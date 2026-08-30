import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branchStocks, branches, products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const branchId = Number(id);
  if (!Number.isInteger(branchId) || branchId <= 0) {
    return NextResponse.json({ error: "branchId tidak valid" }, { status: 400 });
  }

  const db = ensureDb();

  const branch = db.select().from(branches).where(eq(branches.id, branchId)).get();
  if (!branch) {
    return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
  }

  const rows = db
    .select({
      productId: products.id,
      productName: products.name,
      unit: products.unit,
      price: products.price,
      stockQty: branchStocks.stockQty,
      minStock: branchStocks.minStock,
    })
    .from(branchStocks)
    .innerJoin(products, eq(products.id, branchStocks.productId))
    .where(eq(branchStocks.branchId, branchId))
    .all();

  if (rows.length === 0) {
    const fallback = db
      .select({
        id: products.id,
        name: products.name,
        unit: products.unit,
        price: products.price,
        stockQty: products.stockQty,
        minStock: products.minStock,
        branchId: products.branchId,
      })
      .from(products)
      .where(eq(products.branchId, branchId))
      .all();
    if (fallback.length === 0) {
      const allProducts = db
        .select({
          id: products.id,
          name: products.name,
          unit: products.unit,
          price: products.price,
          stockQty: products.stockQty,
          minStock: products.minStock,
        })
        .from(products)
        .limit(50)
        .all();
      return NextResponse.json({
        branch: { id: branch.id, name: branch.name, city: branch.city, status: branch.status },
        stocks: allProducts.map((p) => ({
          productId: p.id,
          productName: p.name,
          unit: p.unit,
          price: p.price,
          stockQty: p.stockQty,
          minStock: p.minStock,
        })),
      });
    }
    return NextResponse.json({
      branch: { id: branch.id, name: branch.name, city: branch.city, status: branch.status },
      stocks: fallback.map((p) => ({
        productId: p.id,
        productName: p.name,
        unit: p.unit,
        price: p.price,
        stockQty: p.stockQty,
        minStock: p.minStock,
      })),
    });
  }

  return NextResponse.json({
    branch: { id: branch.id, name: branch.name, city: branch.city, status: branch.status },
    stocks: rows,
  });
}