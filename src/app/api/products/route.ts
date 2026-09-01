import { and, eq, like, or } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const branchId = Number(searchParams.get("branchId")) || 1;

  const conditions = [eq(products.branchId, branchId)];
  if (q) {
    conditions.push(
      or(
        like(products.name, `%${q}%`),
        like(products.unit, `%${q}%`),
        like(products.barcode, `%${q}%`)
      )!
    );
  }

  const rows = await db.select().from(products).where(and(...conditions));

  return Response.json({
    products: rows.map((p) => ({
      id: p.id,
      name: p.name,
      unit: p.unit,
      price: p.price,
      stockQty: p.stockQty,
      minStock: p.minStock,
      barcode: p.barcode,
      branchId: p.branchId,
      stockStatus: p.stockQty <= 0 ? "habis" : p.stockQty <= p.minStock ? "menipis" : "cukup",
    })),
  });
}