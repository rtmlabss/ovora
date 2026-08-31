import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { products } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID produk tidak valid" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const { minStock } = (body ?? {}) as { minStock?: number };

  const minStockNum = Number(minStock);
  if (!Number.isFinite(minStockNum) || minStockNum < 0) {
    return NextResponse.json({ error: "Batas minimum harus angka >= 0" }, { status: 400 });
  }

  const db = await ensureDb();
  const existingRows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const updated = (
    await db
      .update(products)
      .set({ minStock: minStockNum })
      .where(eq(products.id, id))
      .returning()
  )[0];

  return NextResponse.json(
    {
      product: {
        id: updated.id,
        name: updated.name,
        unit: updated.unit,
        price: updated.price,
        stockQty: updated.stockQty,
        minStock: updated.minStock,
        branchId: updated.branchId,
        stockStatus:
          updated.stockQty <= 0
            ? "habis"
            : updated.stockQty <= updated.minStock
              ? "menipis"
              : "cukup",
      },
    },
    { status: 200 }
  );
}