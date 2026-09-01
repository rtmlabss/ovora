import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { purchaseOrderItems, purchaseOrders, suppliers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "suppliers" or "pos"
  const branchId = Number(searchParams.get("branchId")) || null;

  if (type === "pos") {
    const filters = branchId ? [eq(purchaseOrders.branchId, branchId)] : [];
    const rows = await db
      .select()
      .from(purchaseOrders)
      .where(and(...filters))
      .orderBy(desc(purchaseOrders.createdAt))
      .limit(100);

    const poIds = rows.map((r) => r.id);
    const items = poIds.length
      ? await db
          .select()
          .from(purchaseOrderItems)
          .where(inArray(purchaseOrderItems.poId, poIds))
      : [];

    const productIds = [...new Set(items.map((i) => i.productId))];
    // We don't have product names in PO items directly, but we could join if needed
    // For now return basic data
    const supplierIds = [...new Set(rows.map((r) => r.supplierId))];
    const sups = supplierIds.length
      ? await db.select().from(suppliers).where(inArray(suppliers.id, supplierIds))
      : [];
    const supMap = new Map(sups.map((s) => [s.id, s]));

    const result = rows.map((r) => ({
      ...r,
      supplierName: supMap.get(r.supplierId)?.name ?? "Supplier",
      items: items.filter((i) => i.poId === r.id),
    }));

    return Response.json({ total: result.length, purchaseOrders: result });
  }

  // Default: suppliers
  const rows = await db.select().from(suppliers).orderBy(suppliers.name);
  return Response.json({ total: rows.length, suppliers: rows });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (type === "po") {
    // Create Purchase Order
    const { supplierId, branchId, items, note, userId } = body;
    if (!supplierId || !branchId || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Data PO tidak lengkap" }, { status: 400 });
    }

    try {
      const po = await db.transaction(async (tx) => {
        const now = new Date();
        const maxRows = await tx.select({ id: purchaseOrders.id }).from(purchaseOrders).orderBy(desc(purchaseOrders.id)).limit(1);
        const seq = (maxRows[0]?.id ?? 0) + 1;
        const poNo = `PO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}-${String(seq).padStart(3, "0")}`;

        const totalAmount = items.reduce((sum: number, it: any) => sum + it.qty * it.costPrice, 0);

        const poRows = await tx
          .insert(purchaseOrders)
          .values({
            poNo,
            supplierId,
            branchId,
            totalAmount,
            status: "ordered",
            note: note || null,
            userId: userId || null,
            createdAt: now.toISOString(),
          })
          .returning();

        const poId = poRows[0].id;

        for (const it of items) {
          await tx.insert(purchaseOrderItems).values({
            poId,
            productId: it.productId,
            qty: it.qty,
            costPrice: it.costPrice,
            subtotal: it.qty * it.costPrice,
          });
        }

        return poRows[0];
      });

      return Response.json({ purchaseOrder: po }, { status: 201 });
    } catch (err: any) {
      return Response.json({ error: err.message }, { status: 400 });
    }
  }

  // Create Supplier
  const { name, contactName, phone, email, address } = body;
  if (!name) return Response.json({ error: "Nama supplier wajib diisi" }, { status: 400 });

  try {
    const rows = await db
      .insert(suppliers)
      .values({
        name,
        contactName: contactName || null,
        phone: phone || null,
        email: email || null,
        address: address || null,
        status: "aktif",
      })
      .returning();

    return Response.json({ supplier: rows[0] }, { status: 201 });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
