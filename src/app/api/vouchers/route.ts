import { and, desc, eq, inArray, or } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { vouchers } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = await ensureDb();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const now = new Date().toISOString();

  if (code) {
    // Validate voucher
    const rows = await db
      .select()
      .from(vouchers)
      .where(and(eq(vouchers.code, code), eq(vouchers.status, "aktif")));
    const voucher = rows[0];
    if (!voucher) {
      return Response.json({ valid: false, error: "Voucher tidak ditemukan" }, { status: 404 });
    }

    if (voucher.startDate > now) {
      return Response.json({ valid: false, error: "Voucher belum aktif" }, { status: 400 });
    }
    if (voucher.endDate < now) {
      return Response.json({ valid: false, error: "Voucher sudah kedaluwarsa" }, { status: 400 });
    }
    if (voucher.quota && voucher.usedCount >= voucher.quota) {
      return Response.json({ valid: false, error: "Voucher habis" }, { status: 400 });
    }

    return Response.json({ valid: true, voucher });
  }

  const rows = await db.select().from(vouchers).orderBy(desc(vouchers.createdAt)).limit(100);
  return Response.json({ total: rows.length, vouchers: rows });
}

export async function POST(request: Request) {
  const db = await ensureDb();
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { code, description, type, value, minPurchase, maxDiscount, startDate, endDate, quota } = body;
  if (!code || !type || !value || !startDate || !endDate) {
    return Response.json({ error: "Data voucher tidak lengkap" }, { status: 400 });
  }

  try {
    const rows = await db
      .insert(vouchers)
      .values({
        code,
        description: description || null,
        type,
        value,
        minPurchase: minPurchase || 0,
        maxDiscount: maxDiscount || null,
        startDate,
        endDate,
        quota: quota || null,
        usedCount: 0,
        status: "aktif",
        createdAt: new Date().toISOString(),
      })
      .returning();

    return Response.json({ voucher: rows[0] }, { status: 201 });
  } catch (err: any) {
    if (err.code === "23505") {
      return Response.json({ error: "Kode voucher sudah digunakan" }, { status: 400 });
    }
    return Response.json({ error: err.message }, { status: 400 });
  }
}
