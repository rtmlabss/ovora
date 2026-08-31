import { NextResponse } from "next/server";
import { asc, desc, eq, gte, lte } from "drizzle-orm";
import { ensureDb } from "@/db";
import { financialTransactions } from "@/db/schema";
import { CATEGORIES_BY_TYPE, type CashType } from "@/lib/keuangan";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const db = await ensureDb();

  const type = searchParams.get("type");
  const category = searchParams.get("category");
  const branchId = searchParams.get("branchId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = searchParams.get("limit");

  const conditions = [];

  if (type === "pemasukan" || type === "pengeluaran") {
    conditions.push(eq(financialTransactions.type, type));
  }

  if (category) {
    conditions.push(eq(financialTransactions.category, category));
  }

  const branchNum = Number(branchId);
  if (Number.isInteger(branchNum) && branchNum > 0) {
    conditions.push(eq(financialTransactions.branchId, branchNum));
  }

  if (from) {
    conditions.push(gte(financialTransactions.createdAt, from));
  }
  if (to) {
    conditions.push(lte(financialTransactions.createdAt, to));
  }

  const limitNum = Math.min(Math.max(Number(limit) || 100, 1), 500);

  const rows = await db
    .select()
    .from(financialTransactions)
    .where(conditions.length ? conditions.reduce((acc, c) => acc && c) : undefined)
    .orderBy(desc(financialTransactions.createdAt), asc(financialTransactions.id))
    .limit(limitNum);

  return NextResponse.json({ count: rows.length, financialTransactions: rows });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const { type, category, amount, note, branchId, createdAt } = (body ?? {}) as {
    type?: string;
    category?: string;
    amount?: number;
    note?: string;
    branchId?: number;
    createdAt?: string;
  };

  if (type !== "pemasukan" && type !== "pengeluaran") {
    return NextResponse.json(
      { error: "Tipe transaksi harus 'pemasukan' atau 'pengeluaran'" },
      { status: 400 }
    );
  }

  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    return NextResponse.json({ error: "Jumlah transaksi harus lebih dari 0" }, { status: 400 });
  }

  const validCategories = CATEGORIES_BY_TYPE[type as CashType].map((c) => c.value);
  if (!category || !validCategories.includes(category)) {
    return NextResponse.json(
      { error: `Kategori tidak valid. Pilih: ${validCategories.join(", ")}` },
      { status: 400 }
    );
  }

  const db = await ensureDb();

  const branchIdNum = Number(branchId);
  const row = (
    await db
      .insert(financialTransactions)
      .values({
        branchId: Number.isInteger(branchIdNum) && branchIdNum > 0 ? branchIdNum : 1,
        type: type as CashType,
        category,
        amount: amountNum,
        note: typeof note === "string" && note.trim() ? note.trim() : null,
        createdAt: createdAt ?? new Date().toISOString(),
      })
      .returning()
  )[0];

  return NextResponse.json({ financialTransaction: row }, { status: 201 });
}