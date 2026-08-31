import { NextResponse } from "next/server";
import { and, asc, desc, eq, like, or } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const db = await ensureDb();

  const branchId = searchParams.get("branchId");
  const q = searchParams.get("q");
  const limit = searchParams.get("limit");

  const conditions = [];

  const branchNum = Number(branchId);
  if (Number.isInteger(branchNum) && branchNum > 0) {
    conditions.push(eq(members.branchId, branchNum));
  }

  if (q && q.trim()) {
    const pattern = `%${q.trim()}%`;
    conditions.push(
      or(like(members.name, pattern), like(members.phone, pattern), like(members.email, pattern))
    );
  }

  const limitNum = Math.min(Math.max(Number(limit) || 100, 1), 500);

  const rows = await db
    .select()
    .from(members)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(members.pointsBalance), asc(members.id))
    .limit(limitNum);

  return NextResponse.json({ count: rows.length, members: rows });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const { name, phone, email, initialPoints, branchId } = (body ?? {}) as {
    name?: string;
    phone?: string;
    email?: string;
    initialPoints?: number;
    branchId?: number;
  };

  if (!name || !name.trim()) {
    return NextResponse.json({ error: "Nama member wajib diisi" }, { status: 400 });
  }
  if (!phone || !phone.trim()) {
    return NextResponse.json({ error: "Nomor telepon wajib diisi" }, { status: 400 });
  }

  const pointsNum = Number(initialPoints) || 0;
  if (!Number.isFinite(pointsNum) || pointsNum < 0 || !Number.isInteger(pointsNum)) {
    return NextResponse.json({ error: "Poin awal harus angka bulat >= 0" }, { status: 400 });
  }

  const db = await ensureDb();

  const branchIdNum = Number(branchId);
  const row = (
    await db
      .insert(members)
      .values({
        branchId: Number.isInteger(branchIdNum) && branchIdNum > 0 ? branchIdNum : 1,
        name: name.trim(),
        phone: phone.trim(),
        email: typeof email === "string" && email.trim() ? email.trim() : null,
        pointsBalance: pointsNum,
      })
      .returning()
  )[0];

  return NextResponse.json({ member: row }, { status: 201 });
}