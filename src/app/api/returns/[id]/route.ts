import { and, desc, eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { financialTransactions, members, products, pointMovements, returnItems, returns, stockMovements, transactions } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";
import { POINT_VALUE } from "@/lib/pos";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const returnId = Number(idRaw);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { action, userId, note } = body; // action: "approve" | "reject" | "complete"
  if (!["approve", "reject", "complete"].includes(action)) {
    return Response.json({ error: "Aksi tidak valid" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const retRows = await tx.select().from(returns).where(eq(returns.id, returnId)).limit(1);
      const ret = retRows[0];
      if (!ret) throw new Error("Retur tidak ditemukan");
      if (ret.status === "completed") throw new Error("Retur sudah selesai");
      if (ret.status === "rejected" && action !== "approve") throw new Error("Retur sudah ditolak");

      const now = new Date();

      if (action === "approve") {
        await tx
          .update(returns)
          .set({ status: "approved", note: note || ret.note })
          .where(eq(returns.id, returnId));

        return { status: "approved" };
      }

      if (action === "reject") {
        await tx
          .update(returns)
          .set({ status: "rejected", note: note || ret.note, processedAt: now.toISOString() })
          .where(eq(returns.id, returnId));

        return { status: "rejected" };
      }

      // action === "complete" - process refund & restock
      const items = await tx.select().from(returnItems).where(eq(returnItems.returnId, returnId));
      const r = ret;

      let pointsDeducted = 0;

      for (const item of items) {
        // Restock if condition baik and restock=true
        if (item.condition === "baik" && item.restock) {
          const prodRows = await tx
            .select()
            .from(products)
            .where(and(eq(products.id, item.productId), eq(products.branchId, r.branchId)))
            .limit(1);
          const prod = prodRows[0];
          if (prod) {
            await tx
              .update(products)
              .set({ stockQty: prod.stockQty + item.qty })
              .where(eq(products.id, prod.id));
          }

          await tx.insert(stockMovements).values({
            branchId: r.branchId,
            productId: item.productId,
            type: "masuk",
            qty: item.qty,
            batchNo: null,
            expiryDate: null,
            costPrice: null,
            note: `Retur ${r.returnNo} - kondisi baik`,
            userId: userId || null,
            createdAt: now.toISOString(),
          });
        } else {
          // Record as write-off
          await tx.insert(stockMovements).values({
            branchId: r.branchId,
            productId: item.productId,
            type: "keluar",
            qty: item.qty,
            batchNo: null,
            expiryDate: null,
            costPrice: null,
            note: `Retur ${r.returnNo} - ${item.condition === "rusak" ? "rusak" : "tidak direstock"}`,
            userId: userId || null,
            createdAt: now.toISOString(),
          });
        }
      }

      // Process refund
      if (r.refundAmount > 0) {
        if (r.refundMethod === "credit" && r.memberId) {
          await tx.insert(financialTransactions).values({
            branchId: r.branchId,
            type: "pengeluaran",
            category: "Retur Pelanggan",
            amount: r.refundAmount,
            note: `Retur ${r.returnNo} - kredit ke member`,
            userId: userId || null,
            createdAt: now.toISOString(),
          });
        } else {
          await tx.insert(financialTransactions).values({
            branchId: r.branchId,
            type: "pengeluaran",
            category: "Retur Pelanggan",
            amount: r.refundAmount,
            note: `Retur ${r.returnNo} - ${r.refundMethod}`,
            userId: userId || null,
            createdAt: now.toISOString(),
          });
        }
      }

      // Deduct points earned from original transaction
      if (r.memberId) {
        const memberRows = await tx.select().from(members).where(eq(members.id, r.memberId)).limit(1);
        const member = memberRows[0];
        if (member) {
          // Get original transaction
          const txnRows = await tx
            .select()
            .from(transactions)
            .where(eq(transactions.id, r.transactionId))
            .limit(1);
          const origTxn = txnRows[0];
          if (origTxn) {
            // Calculate points earned from original transaction
            pointsDeducted = Math.floor(origTxn.total / 1000);
            const newBalance = Math.max(member.pointsBalance - pointsDeducted, 0);
            await tx
              .update(members)
              .set({ pointsBalance: newBalance })
              .where(eq(members.id, r.memberId));

            if (pointsDeducted > 0) {
              await tx.insert(pointMovements).values({
                memberId: r.memberId,
                branchId: r.branchId,
                kind: "penukaran",
                points: -pointsDeducted,
                note: `Retur ${r.returnNo}`,
                transactionId: r.transactionId,
                userId: userId || null,
                createdAt: now.toISOString(),
              });
            }
          }
        }
      }

      await tx
        .update(returns)
        .set({ status: "completed", processedAt: now.toISOString() })
        .where(eq(returns.id, returnId));

      return { status: "completed", pointsDeducted };
    });

    await logAudit({
      userId: userId || null,
      action,
      module: "returns",
      resourceId: String(returnId),
      newData: { status: action },
      ipAddress: getClientIp(request),
    });

    return Response.json({ message: `Retur ${action}`, ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}