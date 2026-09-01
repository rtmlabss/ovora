import { and, desc, eq, gte, inArray, lte, sum as drizzleSum, count as drizzleCount } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { customerCredits, creditPayments, members, transactions } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const memberId = Number(searchParams.get("memberId")) || null;
  const status = searchParams.get("status") || null;

  if (memberId) {
    const creditRows = await db.select().from(customerCredits).where(eq(customerCredits.memberId, memberId)).limit(1);
    const credit = creditRows[0];
    
    // Get payment history
    const payments = await db
      .select()
      .from(creditPayments)
      .where(eq(creditPayments.memberId, memberId))
      .orderBy(desc(creditPayments.createdAt));
    
    // Get unpaid transactions (credit sales)
    const creditTxns = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.memberId, memberId), eq(transactions.paymentMethod, "kredit")))
      .orderBy(desc(transactions.createdAt));

    return Response.json({ 
      credit, 
      payments, 
      creditTransactions: creditTxns,
      availableCredit: credit ? credit.creditLimit - credit.usedCredit : 0
    });
  }

  const filters = [];
  if (status) filters.push(eq(customerCredits.status, status));
  
  const rows = await db.select().from(customerCredits).where(and(...filters)).orderBy(desc(customerCredits.updatedAt));
  return Response.json({ total: rows.length, credits: rows });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { memberId, amount, type, userId, note, paymentMethod } = body; // type: "pay" | "init" | "sale"
  
  try {
    const result = await db.transaction(async (tx) => {
      if (type === "init") {
        const { creditLimit } = body;
        const rows = await tx.insert(customerCredits).values({
          memberId,
          creditLimit: creditLimit || 0,
          usedCredit: 0,
          status: "aktif",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }).returning();
        return { credit: rows[0] };
      }

      if (type === "sale") {
        // Record a credit sale
        if (!amount || amount <= 0) throw new Error("Jumlah tidak valid");
        
        const creditRows = await tx.select().from(customerCredits).where(eq(customerCredits.memberId, memberId)).limit(1);
        const credit = creditRows[0];
        if (!credit) throw new Error("Akun kredit tidak ditemukan");
        if (credit.status !== "aktif") throw new Error("Akun kredit tidak aktif");
        if (credit.usedCredit + amount > credit.creditLimit) throw new Error("Melebihi batas kredit");

        await tx.update(customerCredits)
          .set({ usedCredit: credit.usedCredit + amount, updatedAt: new Date().toISOString() })
          .where(eq(customerCredits.memberId, memberId));

        await tx.insert(creditPayments).values({
          memberId,
          amount,
          paymentMethod: "kredit",
          note: note || "Penjualan kredit",
          userId,
          createdAt: new Date().toISOString(),
        });

        return { message: "Penjualan kredit dicatat" };
      }

      // Payment
      const creditRows = await tx.select().from(customerCredits).where(eq(customerCredits.memberId, memberId)).limit(1);
      const credit = creditRows[0];
      if (!credit) throw new Error("Akun kredit tidak ditemukan");

      const paymentAmount = amount || 0;
      if (paymentAmount > credit.usedCredit) throw new Error("Jumlah bayar melebihi hutang");

      await tx.update(customerCredits)
        .set({ usedCredit: credit.usedCredit - paymentAmount, updatedAt: new Date().toISOString() })
        .where(eq(customerCredits.memberId, memberId));

      await tx.insert(creditPayments).values({
        memberId,
        amount: paymentAmount,
        paymentMethod: paymentMethod || "tunai",
        note,
        userId,
        createdAt: new Date().toISOString(),
      });

      return { message: "Pembayaran kredit berhasil" };
    });

    return Response.json(result, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}