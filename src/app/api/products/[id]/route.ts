import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { products } from "@/db/schema";
import { logAudit } from "@/lib/audit";

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

  const { minStock, name, unit, price, barcode } = (body ?? {}) as { minStock?: number; name?: string; unit?: string; price?: number; barcode?: string };

  const db = await ensureDb();
  const existingRows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  }

  const updateData: any = {};
  if (minStock !== undefined) {
    const minStockNum = Number(minStock);
    if (!Number.isFinite(minStockNum) || minStockNum < 0) {
      return NextResponse.json({ error: "Batas minimum harus angka >= 0" }, { status: 400 });
    }
    updateData.minStock = minStockNum;
  }
  if (name !== undefined) updateData.name = name;
  if (unit !== undefined) updateData.unit = unit;
  if (price !== undefined) {
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      return NextResponse.json({ error: "Harga harus angka >= 0" }, { status: 400 });
    }
    updateData.price = priceNum;
  }
  if (barcode !== undefined) updateData.barcode = barcode;

  const updated = (
    await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning()
  )[0];

  await logAudit({
    userId: null,
    action: "update",
    module: "products",
    resourceId: String(id),
    oldData: existing,
    newData: updated,
    ipAddress: request.headers.get("x-forwarded-for") || "unknown",
  });

  return NextResponse.json(
    {
      product: {
        id: updated.id,
        name: updated.name,
        unit: updated.unit,
        price: updated.price,
        stockQty: updated.stockQty,
        minStock: updated.minStock,
        barcode: updated.barcode,
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

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const id = Number(idRaw);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID produk tidak valid" }, { status: 400 });
  }

  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!rows[0]) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  const p = rows[0];
  return NextResponse.json({
    product: {
      id: p.id,
      name: p.name,
      unit: p.unit,
      price: p.price,
      stockQty: p.stockQty,
      minStock: p.minStock,
      barcode: p.barcode,
      branchId: p.branchId,
      stockStatus: p.stockQty <= 0 ? "habis" : p.stockQty <= p.minStock ? "menipis" : "cukup",
    },
  });
}