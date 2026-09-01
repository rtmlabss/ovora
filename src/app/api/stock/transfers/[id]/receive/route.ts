import { and, eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { products, stockMovements, stockTransferItems, stockTransfers } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const db = await ensureDb();
  const transferId = Number(params.id);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { userId } = body;

  try {
    const result = await db.transaction(async (tx) => {
      const tRows = await tx.select().from(stockTransfers).where(eq(stockTransfers.id, transferId)).limit(1);
      const transfer = tRows[0];
      if (!transfer) throw new Error("Transfer tidak ditemukan");
      if (transfer.status === "received") throw new Error("Transfer sudah diterima");
      if (transfer.status === "cancelled") throw new Error("Transfer dibatalkan");

      const items = await tx.select().from(stockTransferItems).where(eq(stockTransferItems.transferId, transferId));

      const now = new Date();
      const receivedItems: any[] = [];

      for (const item of items) {
        // Check if product exists in destination branch
        const pRows = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.branchId, transfer.toBranchId)))
          .limit(1);
        let prod = pRows[0];
        const oldStock = prod?.stockQty || 0;

        if (prod) {
          await tx
            .update(products)
            .set({ stockQty: prod.stockQty + item.qty })
            .where(eq(products.id, prod.id));
        } else {
          // Product doesn't exist in destination, need to create it (copy from source)
          const srcProdRows = await tx
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);
          const srcProd = srcProdRows[0];
          if (!srcProd) throw new Error(`Produk sumber ID ${item.productId} tidak ditemukan`);

          const newProdRows = await tx
            .insert(products)
            .values({
              branchId: transfer.toBranchId,
              name: srcProd.name,
              unit: srcProd.unit,
              price: srcProd.price,
              stockQty: item.qty,
              minStock: srcProd.minStock,
            })
            .returning();
          prod = newProdRows[0];
        }

        receivedItems.push({
          productId: item.productId,
          qty: item.qty,
        });

        await tx.insert(stockMovements).values({
          branchId: transfer.toBranchId,
          productId: prod.id,
          type: "transfer",
          qty: item.qty,
          note: `Terima transfer ${transfer.transferNo} dari cabang ${transfer.fromBranchId}`,
          userId: userId || null,
          createdAt: now.toISOString(),
        });
      }

      await tx
        .update(stockTransfers)
        .set({ status: "received" })
        .where(eq(stockTransfers.id, transferId));

      // Log audit
      await logAudit({
        userId: userId || null,
        action: "receive",
        module: "stock_transfers",
        resourceId: String(transferId),
        oldData: { status: transfer.status },
        newData: { status: "received", items: receivedItems },
        ipAddress: getClientIp(request),
      });

      return { transferNo: transfer.transferNo };
    });

    return Response.json({ message: "Transfer diterima", ...result });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
