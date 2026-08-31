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

  const db = await ensureDb();

  const branchRows = await db.select().from(branches).where(eq(branches.id, branchId)).limit(1);
  const branch = branchRows[0];
  if (!branch) {
    return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
  }

  const rows = await db
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
    .where(eq(branchStocks.branchId, branchId));

  if (rows.length === 0) {
    const fallback = await db
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
      .where(eq(products.branchId, branchId));
    if (fallback.length === 0) {
      const allProducts = await db
        .select({
          id: products.id,
          name: products.name,
          unit: products.unit,
          price: products.price,
          stockQty: products.stockQty,
          minStock: products.minStock,
        })
        .from(products)
        .limit(50);
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