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

  const fallbackAdmin = (
    email: string,
    password: string
  ): Omit<AuthClaims, "exp"> | null => {
    // Akun admin bawaan bila belum ada data pengguna di DB
    // (atau DB tidak bisa dihubungi saat cold-start).
    if (email === "pemilik@ovora.id" && password === "ovora123") {
      return {
        uid: 0,
        name: "Pemilik Toko",
        email,
        role: "Pemilik",
        branch: "Semua Cabang",
      };
    }
    return null;
  };

  let db;
  try {
    db = await ensureDb();
  } catch (err) {
    console.error("[login] DB init gagal:", err instanceof Error ? err.message : err);
    const fallback = fallbackAdmin(emailStr, passwordStr);
    if (fallback) {
      const token = createSessionToken(fallback);
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_MS / 1000,
      });
      return NextResponse.json({
        user: { name: fallback.name, email: fallback.email, role: fallback.role },
        ok: true,
        warning: "Masuk memakai akun bawaan (database tidak terjangkau).",
      });
    }
    return NextResponse.json(
      { error: "Database tidak terjangkau. Cek env DATABASE_URL di Vercel lalu redeploy." },
      { status: 503 }
    );
  }

  let rows;
  try {
    rows = await db.select().from(users).where(eq(users.email, emailStr)).limit(1);
  } catch (err) {
    console.error("[login] query users gagal:", err instanceof Error ? err.message : err);
    const fallback = fallbackAdmin(emailStr, passwordStr);
    if (fallback) {
      const token = createSessionToken(fallback);
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_TTL_MS / 1000,
      });
      return NextResponse.json({
        user: { name: fallback.name, email: fallback.email, role: fallback.role },
        ok: true,
        warning: "Masuk memakai akun bawaan (tabel users belum siap).",
      });
    }
    return NextResponse.json(
      { error: "Database belum siap (migrasi/tabel users bermasalah). Cek Runtime Logs Vercel." },
      { status: 503 }
    );
  }
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
    let branch: { name: string } | null | undefined = null;
    if (row.branchId) {
      try {
        [branch] = await db
          .select({ name: branches.name })
          .from(branches)
          .where(eq(branches.id, row.branchId))
          .limit(1);
      } catch (err) {
        console.error("[login] query branch gagal:", err instanceof Error ? err.message : err);
        branch = null;
      }
    }
    user = {
      uid: row.id,
      name: row.name,
      email: row.email,
      role: row.role as AuthClaims["role"],
      branch: branch?.name ?? null,
    };
  } else {
    // Fallback akun admin bawaan bila belum ada data pengguna di DB.
    const fallback = fallbackAdmin(emailStr, passwordStr);
    if (!fallback) {
      return NextResponse.json({ error: "Email tidak ditemukan" }, { status: 401 });
    }
    user = fallback;
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
