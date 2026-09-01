import { and, desc, eq, inArray, gte, lte } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { members, products, returnItems, returns, transactions, transactionItems } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const branchId = Number(searchParams.get("branchId")) || null;
  const status = searchParams.get("status") || null;
  const from = searchParams.get("from") || null;
  const to = searchParams.get("to") || null;
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 200);

  const filters = [];
  if (branchId) filters.push(eq(returns.branchId, branchId));
  if (status) filters.push(eq(returns.status, status));
  if (from) filters.push(gte(returns.createdAt, from));
  if (to) filters.push(lte(returns.createdAt, to));

  const rows = await db
    .select()
    .from(returns)
    .where(and(...filters))
    .orderBy(desc(returns.createdAt))
    .limit(limit);

  const returnIds = rows.map((r) => r.id);
  const items = returnIds.length
    ? await db.select().from(returnItems).where(inArray(returnItems.returnId, returnIds))
    : [];

  const txnIds = [...new Set(rows.map((r) => r.transactionId))];
  const txns = txnIds.length
    ? await db.select().from(transactions).where(inArray(transactions.id, txnIds))
    : [];
  const txnMap = new Map(txns.map((t) => [t.id, t]));

  const memberIds = [...new Set(rows.flatMap((r) => (r.memberId != null ? [r.memberId] : [])))];
  const mems = memberIds.length
    ? await db.select().from(members).where(inArray(members.id, memberIds))
    : [];
  const memMap = new Map(mems.map((m) => [m.id, m]));

  const result = rows.map((r) => ({
    ...r,
    transaction: txnMap.get(r.transactionId) ?? null,
    member: r.memberId ? memMap.get(r.memberId) ?? null : null,
    items: items.filter((i) => i.returnId === r.id).map((i) => ({
      ...i,
      productName: null, // could join products if needed
    })),
  }));

  return Response.json({ total: result.length, returns: result });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { transactionId, branchId, memberId, reason, items, refundMethod, note, userId } = body;

  if (!transactionId || !branchId || !reason || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Data retur tidak lengkap" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      // Verify original transaction exists
      const txnRows = await tx.select().from(transactions).where(eq(transactions.id, transactionId)).limit(1);
      const txn = txnRows[0];
      if (!txn) throw new Error("Transaksi asal tidak ditemukan");
      if (txn.branchId !== branchId) throw new Error("Transaksi tidak属于 cabang ini");

      // Get original transaction items
      const origItems = await tx.select().from(transactionItems).where(eq(transactionItems.transactionId, transactionId));
      const origItemMap = new Map(origItems.map((i) => [i.id, i]));

      let totalRefund = 0;
      const returnItemsData: any[] = [];

      for (const item of items) {
        const origItem = origItemMap.get(item.transactionItemId);
        if (!origItem) throw new Error(`Item transaksi ID ${item.transactionItemId} tidak ditemukan`);
        if (item.qty > origItem.qty) throw new Error(`Qty retur melebihi qty beli untuk item ${item.transactionItemId}`);

        const subtotal = item.qty * item.price;
        totalRefund += subtotal;

        returnItemsData.push({
          transactionItemId: item.transactionItemId,
          productId: item.productId,
          qty: item.qty,
          price: item.price,
          subtotal,
          condition: item.condition || "baik",
          restock: item.restock !== false,
        });
      }

      const now = new Date();
      const maxRows = await tx.select({ id: returns.id }).from(returns).orderBy(desc(returns.id)).limit(1);
      const seq = (maxRows[0]?.id ?? 0) + 1;
      const returnNo = `RET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(seq).padStart(3, "0")}`;

      const retRows = await tx
        .insert(returns)
        .values({
          returnNo,
          transactionId,
          branchId,
          memberId: memberId || null,
          reason,
          status: "pending",
          refundAmount: totalRefund,
          refundMethod: refundMethod || "tunai",
          note: note || null,
          userId: userId || null,
          createdAt: now.toISOString(),
        })
        .returning();

      const retId = retRows[0].id;

      for (const item of returnItemsData) {
        await tx.insert(returnItems).values({ ...item, returnId: retId });
      }

      return { return: retRows[0], items: returnItemsData };
    });

    // Log audit
    await logAudit({
      userId: userId || null,
      action: "create",
      module: "returns",
      resourceId: String(result.return.id),
      newData: { returnNo: result.return.returnNo, refundAmount: result.return.refundAmount, items: result.items },
      ipAddress: getClientIp(request),
    });

    return Response.json({ return: result.return }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}