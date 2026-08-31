import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branches, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const ROLES = ["Pemilik", "Manager", "Kasir"];
const STATUSES = ["aktif", "nonaktif"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const status = searchParams.get("status");
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 100) || 100, 1), 500);

  const db = await ensureDb();

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status,
      branchId: users.branchId,
      branchName: branches.name,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(branches, eq(branches.id, users.branchId))
    .limit(limit);

  let filtered = rows;
  if (role && ROLES.includes(role)) filtered = filtered.filter((r) => r.role === role);
  if (status && STATUSES.includes(status)) filtered = filtered.filter((r) => r.status === status);
  if (q) {
    filtered = filtered.filter(
      (r) => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({
    total: filtered.length,
    users: filtered.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      role: r.role,
      status: r.status,
      branchId: r.branchId,
      branch: r.branchName ?? null,
      createdAt: r.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { name, email, password, role, status, branchId } = (body ?? {}) as {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    role?: unknown;
    status?: unknown;
    branchId?: unknown;
  };

  const nameStr = String(name ?? "").trim();
  const emailStr = String(email ?? "").trim().toLowerCase();
  const passwordStr = String(password ?? "");

  if (!nameStr) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
  if (!emailStr || !EMAIL_RE.test(emailStr)) {
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
  }
  if (passwordStr.length < 6) {
    return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
  }
  if (!ROLES.includes(String(role ?? "Kasir"))) {
    return NextResponse.json({ error: `role harus salah satu dari: ${ROLES.join(", ")}` }, { status: 400 });
  }
  const newStatus = status === undefined ? "aktif" : String(status);
  if (!STATUSES.includes(newStatus)) {
    return NextResponse.json({ error: `status harus salah satu dari: ${STATUSES.join(", ")}` }, { status: 400 });
  }

  let bId: number | null = branchId === null || branchId === undefined || branchId === "" ? null : Number(branchId);
  if (bId !== null && (!Number.isInteger(bId) || bId <= 0)) {
    return NextResponse.json({ error: "branchId tidak valid" }, { status: 400 });
  }

  const db = await ensureDb();

  if (bId !== null) {
    const branchRows = await db.select({ id: branches.id }).from(branches).where(eq(branches.id, bId)).limit(1);
    const branch = branchRows[0];
    if (!branch) return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
  }

  const existsRows = await db.select({ id: users.id }).from(users).where(eq(users.email, emailStr)).limit(1);
  const exists = existsRows[0];
  if (exists) {
    return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
  }

  const createdAt = new Date().toISOString();
  const rows = await db
    .insert(users)
    .values({
      name: nameStr,
      email: emailStr,
      passwordHash: hashPassword(passwordStr),
      role: String(role ?? "Kasir"),
      status: newStatus,
      branchId: bId,
      createdAt,
    })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, status: users.status, branchId: users.branchId });
  const row = rows[0];

  return NextResponse.json({ user: { ...row, branch: null, createdAt }, ok: true }, { status: 201 });
}
