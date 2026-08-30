import { NextResponse } from "next/server";
import { desc, eq, gte, lte, sql } from "drizzle-orm";
import { ensureDb } from "@/db";
import { products, stockMovements } from "@/db/schema";

export const dynamic = "force-dynamic";

type MovementType = "masuk" | "keluar";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const db = ensureDb();

  const type = searchParams.get("type");
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = searchParams.get("limit");

  const conditions = [];
  if (type === "masuk" || type === "keluar") {
    conditions.push(eq(stockMovements.type, type));
  }
  const branchNum = Number(branchId);
  if (Number.isInteger(branchNum) && branchNum > 0) {
    conditions.push(eq(stockMovements.branchId, branchNum));
  }
  if (from) {
    conditions.push(gte(stockMovements.createdAt, from));
  }
  if (to) {
    conditions.push(lte(stockMovements.createdAt, to));
  }

  const limitNum = Math.min(Math.max(Number(limit) || 100, 1), 500);

  const rows = db
    .select({
      id: stockMovements.id,
      branchId: stockMovements.branchId,
      productId: stockMovements.productId,
      productName: products.name,
      productUnit: products.unit,
      type: stockMovements.type,
      qty: stockMovements.qty,
      note: stockMovements.note,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .leftJoin(products, eq(stockMovements.productId, products.id))
    .where(conditions.length ? conditions.reduce((a, c) => a && c) : undefined)
    .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
    .limit(limitNum)
    .all();

  return NextResponse.json({ count: rows.length, movements: rows });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const { productId, type, qty, note, branchId, createdAt } = (body ?? {}) as {
    productId?: number;
    type?: string;
    qty?: number;
    note?: string;
    branchId?: number;
    createdAt?: string;
  };

  if (type !== "masuk" && type !== "keluar") {
    return NextResponse.json(
      { error: "Tipe mutasi harus 'masuk' atau 'keluar'" },
      { status: 400 }
    );
  }

  const productIdNum = Number(productId);
  const qtyNum = Number(qty);
  if (!Number.isInteger(productIdNum) || productIdNum <= 0) {
    return NextResponse.json({ error: "Produk tidak valid" }, { status: 400 });
  }
  if (!Number.isFinite(qtyNum) || qtyNum <= 0) {
    return NextResponse.json({ error: "Jumlah mutasi harus lebih dari 0" }, { status: 400 });
  }

  const branchIdNum = Number(branchId);
  const db = ensureDb();
  const moveType = type as MovementType;

  try {
    const result = db.transaction(() => {
      const branch = Number.isInteger(branchIdNum) && branchIdNum > 0 ? branchIdNum : 1;
      const product = db
        .select()
        .from(products)
        .where(eq(products.id, productIdNum))
        .get();

      if (!product || product.branchId !== branch) {
        throw Object.assign(new Error("Produk tidak ditemukan pada cabang ini"), {
          statusCode: 404,
        });
      }

      if (moveType === "keluar" && qtyNum > product.stockQty) {
        throw Object.assign(
          new Error(`Stok ${product.name} tidak mencukupi (sisa ${product.stockQty})`),
          { statusCode: 400 }
        );
      }

      const delta = moveType === "masuk" ? qtyNum : -qtyNum;
      const updated = db
        .update(products)
        .set({ stockQty: sql`${products.stockQty} + ${delta}` })
        .where(eq(products.id, productIdNum))
        .returning()
        .get();

      const movement = db
        .insert(stockMovements)
        .values({
          branchId: branch,
          productId: productIdNum,
          type: moveType,
          qty: qtyNum,
          note: typeof note === "string" && note.trim() ? note.trim() : null,
          createdAt: createdAt ?? new Date().toISOString(),
        })
        .returning()
        .get();

      return { movement, product: updated };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const statusCode = (error as { statusCode?: number }).statusCode;
    if (statusCode) {
      return NextResponse.json(
        { error: (error as Error).message },
        { status: statusCode }
      );
    }
    throw error;
  }
}