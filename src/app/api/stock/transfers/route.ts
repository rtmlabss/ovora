import { and, desc, eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { products, stockMovements, stockTransferItems, stockTransfers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const branchId = Number(searchParams.get("branchId")) || null;

  const rows = branchId
    ? await db
        .select()
        .from(stockTransfers)
        .where(
          and(
            // Either from or to matches branchId
          )
        )
        .orderBy(desc(stockTransfers.createdAt))
    : await db.select().from(stockTransfers).orderBy(desc(stockTransfers.createdAt));

  const transferIds = rows.map((r) => r.id);
  const items = transferIds.length
    ? await db
        .select()
        .from(stockTransferItems)
        .where(inArray(stockTransferItems.transferId, transferIds))
    : [];

  const productIds = [...new Set(items.map((i) => i.productId))];
  const prods = productIds.length
    ? await db.select().from(products).where(inArray(products.id, productIds))
    : [];
  const prodMap = new Map(prods.map((p) => [p.id, p]));

  const result = rows.map((r) => ({
    ...r,
    items: items
      .filter((i) => i.transferId === r.id)
      .map((i) => ({
        productId: i.productId,
        productName: prodMap.get(i.productId)?.name ?? "Produk",
        unit: prodMap.get(i.productId)?.unit ?? "pcs",
        qty: i.qty,
      })),
  }));

  return Response.json({ total: result.length, transfers: result });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { fromBranchId, toBranchId, note, items, userId } = body;
  if (!fromBranchId || !toBranchId || !Array.isArray(items) || items.length === 0) {
    return Response.json({ error: "Data transfer tidak lengkap" }, { status: 400 });
  }

  if (fromBranchId === toBranchId) {
    return Response.json({ error: "Cabang asal dan tujuan tidak boleh sama" }, { status: 400 });
  }

  try {
    const transfer = await db.transaction(async (tx) => {
      const now = new Date();
      const maxRows = await tx.select({ id: stockTransfers.id }).from(stockTransfers).orderBy(desc(stockTransfers.id)).limit(1);
      const seq = (maxRows[0]?.id ?? 0) + 1;
      const transferNo = `TRF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(seq).padStart(3, "0")}`;

      const tRows = await tx
        .insert(stockTransfers)
        .values({
          transferNo,
          fromBranchId,
          toBranchId,
          status: "pending",
          note: note || null,
          userId: userId || null,
          createdAt: now.toISOString(),
        })
        .returning();

      const tId = tRows[0].id;

      for (const item of items) {
        // Check source stock
        const pRows = await tx
          .select()
          .from(products)
          .where(and(eq(products.id, item.productId), eq(products.branchId, fromBranchId)))
          .limit(1);
        const prod = pRows[0];
        if (!prod || prod.stockQty < item.qty) {
          throw new Error(`Stok produk ID ${item.productId} tidak cukup di cabang asal`);
        }

        await tx.insert(stockTransferItems).values({
          transferId: tId,
          productId: item.productId,
          qty: item.qty,
        });

        // Deduct from source branch
        await tx
          .update(products)
          .set({ stockQty: prod.stockQty - item.qty })
          .where(eq(products.id, prod.id));

        await tx.insert(stockMovements).values({
          branchId: fromBranchId,
          productId: prod.id,
          type: "transfer",
          qty: -item.qty,
          note: `Kirim transfer ${transferNo} ke cabang ${toBranchId}`,
          userId: userId || null,
          createdAt: now.toISOString(),
        });
      }

      return tRows[0];
    });

    return Response.json({ transfer }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
