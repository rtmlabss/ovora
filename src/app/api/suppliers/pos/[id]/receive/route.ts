import { and, eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { financialTransactions, products, purchaseOrderItems, purchaseOrders } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const db = await ensureDb();
  const poId = Number(params.id);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { items, userId } = body;
  if (!Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Item penerimaan tidak boleh kosong" }, { status: 400 });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const poRows = await tx.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId)).limit(1);
      const po = poRows[0];
      if (!po) throw new Error("PO tidak ditemukan");
      if (po.status === "received") throw new Error("PO sudah diterima");
      if (po.status === "cancelled") throw new Error("PO dibatalkan");

      const poItems = await tx.select().from(purchaseOrderItems).where(eq(purchaseOrderItems.poId, poId));
      const poItemMap = new Map(poItems.map((i) => [i.productId, i]));

      const now = new Date();
      const receivedItems: any[] = [];

      for (const it of items) {
        const poItem = poItemMap.get(it.productId);
        if (!poItem) throw new Error(`Produk ID ${it.productId} tidak ada di PO ini`);

        // Check if product exists in destination branch
        const pRows = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, it.productId), eq(products.branchId, po.branchId)))
          .limit(1);
        let prod = pRows[0];

        const oldStock = prod?.stockQty || 0;

        if (prod) {
          await tx
            .update(products)
            .set({ stockQty: prod.stockQty + it.qtyReceived })
            .where(eq(products.id, prod.id));
        } else {
          // Create product if not exists (shouldn't normally happen)
          const newProdRows = await tx
            .insert(products)
            .values({
              branchId: po.branchId,
              name: `Produk ${it.productId}`,
              unit: "pcs",
              price: 0,
              stockQty: it.qtyReceived,
              minStock: 0,
            })
            .returning();
          prod = newProdRows[0];
        }

        receivedItems.push({
          productId: it.productId,
          qtyReceived: it.qtyReceived,
          costPrice: poItem.costPrice,
        });

        await tx.insert(financialTransactions).values({
          branchId: po.branchId,
          type: "pengeluaran",
          category: "Penerimaan PO",
          amount: it.qtyReceived * poItem.costPrice,
          note: `Terima PO ${po.poNo}`,
          userId: userId || null,
          createdAt: now.toISOString(),
        });
      }

      // Update PO status to received
      await tx
        .update(purchaseOrders)
        .set({ status: "received" })
        .where(eq(purchaseOrders.id, poId));

      // Log audit
      await logAudit({
        userId: userId || null,
        action: "receive",
        module: "purchase_orders",
        resourceId: String(poId),
        oldData: { status: po.status },
        newData: { status: "received", items: receivedItems },
        ipAddress: getClientIp(request),
      });

      return { poNo: po.poNo };
    });

    return Response.json({ message: "PO diterima", ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
