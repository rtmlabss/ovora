import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branches, users } from "@/db/schema";
import { hashPassword } from "@/lib/password";

export const dynamic = "force-dynamic";

const ROLES = ["Pemilik", "Manager", "Kasir"];
const STATUSES = ["aktif", "nonaktif"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

  const db = await ensureDb();
  const row = (
    await db
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
      .where(eq(users.id, id))
      .limit(1)
  )[0];

  if (!row) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  return NextResponse.json({
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      status: row.status,
      branchId: row.branchId,
      branch: row.branchName ?? null,
      createdAt: row.createdAt,
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

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

  const db = await ensureDb();
  const [existing] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  const patch: Partial<typeof existing> = {};

  if (name !== undefined) {
    const v = String(name).trim();
    if (!v) return NextResponse.json({ error: "Nama tidak boleh kosong" }, { status: 400 });
    patch.name = v;
  }

  if (email !== undefined) {
    const v = String(email).trim().toLowerCase();
    if (!EMAIL_RE.test(v)) return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });
    const [dup] = await db.select({ id: users.id }).from(users).where(eq(users.email, v)).limit(1);
    if (dup && dup.id !== id) return NextResponse.json({ error: "Email sudah digunakan" }, { status: 409 });
    patch.email = v;
  }

  if (password !== undefined && password !== null && String(password) !== "") {
    const v = String(password);
    if (v.length < 6) return NextResponse.json({ error: "Kata sandi minimal 6 karakter" }, { status: 400 });
    patch.passwordHash = hashPassword(v);
  }

  if (role !== undefined) {
    const v = String(role);
    if (!ROLES.includes(v)) return NextResponse.json({ error: `role harus salah satu dari: ${ROLES.join(", ")}` }, { status: 400 });
    patch.role = v;
  }

  if (status !== undefined) {
    const v = String(status);
    if (!STATUSES.includes(v)) return NextResponse.json({ error: `status harus salah satu dari: ${STATUSES.join(", ")}` }, { status: 400 });
    patch.status = v;
  }

  if (branchId !== undefined) {
    const v = branchId === null || branchId === "" ? null : Number(branchId);
    if (v !== null && (!Number.isInteger(v) || v <= 0)) {
      return NextResponse.json({ error: "branchId tidak valid" }, { status: 400 });
    }
    if (v !== null) {
      const [branch] = await db.select({ id: branches.id }).from(branches).where(eq(branches.id, v)).limit(1);
      if (!branch) return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
    }
    patch.branchId = v;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada data yang diubah" }, { status: 400 });
  }

  await db.update(users).set(patch).where(eq(users.id, id));

  const row = (
    await db
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
      .where(eq(users.id, id))
      .limit(1)
  )[0];

  return NextResponse.json({
    user: {
      id: row?.id,
      name: row?.name,
      email: row?.email,
      role: row?.role,
      status: row?.status,
      branchId: row?.branchId,
      branch: row?.branchName ?? null,
      createdAt: row?.createdAt,
    },
    ok: true,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = parseId(raw);
  if (!id) return NextResponse.json({ error: "id tidak valid" }, { status: 400 });

  const db = await ensureDb();
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Pengguna tidak ditemukan" }, { status: 404 });

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}