import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branches, users } from "@/db/schema";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE, SESSION_TTL_MS } from "@/lib/session";
import type { AuthClaims } from "@/lib/auth-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  const emailStr = String(email ?? "").trim().toLowerCase();
  const passwordStr = String(password ?? "");

  if (!emailStr || !passwordStr) {
    return NextResponse.json({ error: "Email dan kata sandi wajib diisi" }, { status: 400 });
  }

  const db = await ensureDb();

  const rows = await db.select().from(users).where(eq(users.email, emailStr)).limit(1);
  const row = rows[0];

  let user: Omit<AuthClaims, "exp">;
  if (row) {
    const ok = verifyPassword(passwordStr, row.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Kata sandi salah" }, { status: 401 });
    }
    if (row.status === "nonaktif") {
      return NextResponse.json({ error: "Akun dinonaktifkan" }, { status: 403 });
    }
    const branch = row.branchId
      ? (await db.select({ name: branches.name }).from(branches).where(eq(branches.id, row.branchId)).limit(1))[0]
      : null;
    user = {
      uid: row.id,
      name: row.name,
      email: row.email,
      role: row.role as AuthClaims["role"],
      branch: branch?.name ?? null,
    };
  } else {
    // Fallback akun admin bawaan bila belum ada data pengguna di DB.
    if (emailStr === "pemilik@ovora.id" && passwordStr === "ovora123") {
      user = {
        uid: 0,
        name: "Pemilik Toko",
        email: emailStr,
        role: "Pemilik",
        branch: "Semua Cabang",
      };
    } else {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 401 });
    }
  }

  const token = createSessionToken(user);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });

  return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role }, ok: true });
}
