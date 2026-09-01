import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branches, products } from "@/db/schema";
import { logAudit, getClientIp } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID cabang tidak valid" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON" }, { status: 400 });
  }

  const { name, address, city, status } = (body ?? {}) as { name?: string; address?: string; city?: string; status?: string };

  const db = await ensureDb();
  const existingRows = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  const existing = existingRows[0];
  if (!existing) {
    return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (address !== undefined) updateData.address = address;
  if (city !== undefined) updateData.city = city;
  if (status !== undefined) updateData.status = status;

  const updated = (
    await db
      .update(branches)
      .set(updateData)
      .where(eq(branches.id, id))
      .returning()
  )[0];

  await logAudit({
    userId: null,
    action: "update",
    module: "branches",
    resourceId: String(id),
    oldData: existing,
    newData: updated,
    ipAddress: getClientIp(request),
  });

  return NextResponse.json({ branch: updated }, { status: 200 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "ID cabang tidak valid" }, { status: 400 });
  }

  const db = await ensureDb();
  
  // Check if branch has products
  const hasProducts = await db.select().from(products).where(eq(products.branchId, id)).limit(1);
  if (hasProducts.length > 0) {
    return NextResponse.json({ error: "Cabang tidak bisa dihapus karena masih memiliki produk" }, { status: 400 });
  }

  try {
    await db.delete(branches).where(eq(branches.id, id));
    
    await logAudit({
      userId: null,
      action: "delete",
      module: "branches",
      resourceId: String(id),
      ipAddress: getClientIp(request),
    });

    return NextResponse.json({ message: "Cabang berhasil dihapus" }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
