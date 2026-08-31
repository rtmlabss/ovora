import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { storeProfiles } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const db = await ensureDb();
  const rows = await db.select().from(storeProfiles).limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({
      profile: {
        name: "Toko Telur ovora",
        tagline: "Telur segar pilihan setiap hari",
        address: "Jl. Raya Telur No. 1",
        city: "Kota",
        phone: "081234567890",
        currency: "IDR",
        description: "Pemasok telur berkualitas untuk retail & pelanggan setia.",
      },
    });
  }
  return NextResponse.json({ profile: row });
}

export async function PUT(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { name, tagline, address, city, phone, currency, description } = (body ?? {}) as {
    name?: unknown;
    tagline?: unknown;
    address?: unknown;
    city?: unknown;
    phone?: unknown;
    currency?: unknown;
    description?: unknown;
  };

  const nameStr = String(name ?? "").trim();
  if (!nameStr) return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });

  const now = new Date().toISOString();
  const db = await ensureDb();
  const existingRows = await db.select({ id: storeProfiles.id }).from(storeProfiles).limit(1);
  const existing = existingRows[0];
  const values = {
    name: nameStr,
    tagline: tagline === undefined || tagline === null ? null : String(tagline),
    address: address === undefined || address === null ? null : String(address),
    city: city === undefined || city === null ? null : String(city),
    phone: phone === undefined || phone === null ? null : String(phone),
    currency: currency === undefined || currency === null ? "IDR" : String(currency).toUpperCase(),
    description: description === undefined || description === null ? null : String(description),
    updatedAt: now,
  };

  if (existing) {
    await db.update(storeProfiles).set(values).where(eq(storeProfiles.id, existing.id));
  } else {
    await db.insert(storeProfiles).values(values);
  }

  const rows = await db.select().from(storeProfiles).limit(1);
  const row = rows[0];
  return NextResponse.json({ profile: row, ok: true });
}
