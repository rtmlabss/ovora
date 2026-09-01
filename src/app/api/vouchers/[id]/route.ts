import { and, desc, eq } from "drizzle-orm";
import { ensureDb } from "@/db/index";
import { vouchers } from "@/db/schema";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  try {
    const rows = await db
      .update(vouchers)
      .set({
        description: body.description,
        type: body.type,
        value: body.value,
        minPurchase: body.minPurchase,
        maxDiscount: body.maxDiscount,
        startDate: body.startDate,
        endDate: body.endDate,
        quota: body.quota,
        status: body.status,
      })
      .where(eq(vouchers.id, id))
      .returning();

    if (!rows[0]) return Response.json({ error: "Voucher tidak ditemukan" }, { status: 404 });
    return Response.json({ voucher: rows[0] });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const db = await ensureDb();
  const { id: idRaw } = await params;
  const id = Number(idRaw);

  try {
    await db.delete(vouchers).where(eq(vouchers.id, id));
    return Response.json({ message: "Voucher dihapus" });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
