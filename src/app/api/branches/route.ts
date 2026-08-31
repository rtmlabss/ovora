import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branches } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const STATUSES = ["aktif", "libur"];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchIdRaw = searchParams.get("branchId");
  const db = await ensureDb();

  if (branchIdRaw) {
    const id = Number(branchIdRaw);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "branchId tidak valid" }, { status: 400 });
    }
    const rows = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json({ branch: row });
  }

  const rows = await db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      city: branches.city,
      status: branches.status,
      productCount: sql<number>`(SELECT COUNT(*) FROM ${sql.raw("products")} WHERE branch_id = ${branches.id})`,
    })
    .from(branches)
    .orderBy(asc(branches.id));

  return NextResponse.json({ branches: rows });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { name, address, city, status } = (body ?? {}) as {
    name?: unknown;
    address?: unknown;
    city?: unknown;
    status?: unknown;
  };

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });
  }
  const newStatus = status === undefined ? "aktif" : String(status);
  if (!STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { error: `status harus salah satu dari: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const db = await ensureDb();
  const row = (
    await db
      .insert(branches)
      .values({
        name: name.trim(),
        address: address === undefined || address === null ? null : String(address),
        city: city === undefined || city === null ? null : String(city),
        status: newStatus,
      })
      .returning()
  )[0];

  return NextResponse.json({ branch: row }, { status: 201 });
}