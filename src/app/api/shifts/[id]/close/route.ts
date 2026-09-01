import { and, eq, inArray, sum } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { cashShifts, financialTransactions, users } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const db = await ensureDb();
  const shiftId = Number(params.id);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { closingCash, userId, note } = body;
  if (closingCash === undefined || closingCash === null) {
    return Response.json({ error: "closingCash wajib diisi" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const shiftRows = await tx.select().from(cashShifts).where(eq(cashShifts.id, shiftId)).limit(1);
      const shift = shiftRows[0];
      if (!shift) throw new Error("Shift tidak ditemukan");
      if (shift.status === "closed") throw new Error("Shift sudah ditutup");
      if (shift.userId !== userId) throw new Error("Shift ini bukan milik Anda");

      // Calculate expected cash from financial transactions during shift
      const transactions = await tx
        .select({ amount: financialTransactions.amount, type: financialTransactions.type })
        .from(financialTransactions)
        .where(
          and(
            eq(financialTransactions.branchId, shift.branchId),
            gte(financialTransactions.createdAt, shift.openedAt)
          )
        );

      let expectedCash = shift.openingCash;
      for (const t of transactions) {
        if (t.type === "pemasukan") expectedCash += t.amount;
        else expectedCash -= t.amount;
      }

      const variance = closingCash - expectedCash;
      const now = new Date();

      await tx
        .update(cashShifts)
        .set({
          closingCash,
          expectedCash,
          variance,
          status: "closed",
          closedAt: now.toISOString(),
          note: note || shift.note,
        })
        .where(eq(cashShifts.id, shiftId));

      // Record variance as financial transaction if not zero
      if (variance !== 0) {
        await tx.insert(financialTransactions).values({
          branchId: shift.branchId,
          type: variance > 0 ? "pemasukan" : "pengeluaran",
          category: "Selisih Kas",
          amount: Math.abs(variance),
          note: `Selisih shift ${shift.id} (variance: ${variance > 0 ? "+" : ""}${variance})`,
          userId: userId || null,
          createdAt: now.toISOString(),
        });
      }

      return { expectedCash, variance };
    });

    await logAudit({
      userId: userId || null,
      action: "close",
      module: "cash_shifts",
      resourceId: String(shiftId),
      newData: { closingCash: result.closingCash, expectedCash: result.expectedCash, variance: result.variance },
      ipAddress: getClientIp(request),
    });

    return Response.json({ message: "Shift ditutup", ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}