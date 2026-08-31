import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members } from "@/db/schema";
import { EARN_RATE } from "@/lib/membership";
import { POINT_VALUE } from "@/lib/pos";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const db = await ensureDb();

  const subtotal = Number(searchParams.get("subtotal"));
  if (!Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ error: "subtotal harus angka >= 0" }, { status: 400 });
  }

  const earned = Math.floor(subtotal / EARN_RATE);

  const requested = Number(searchParams.get("points")) || 0;

  let balance = 0;
  let memberId: number | null = null;
  const memberParam = searchParams.get("memberId");
  const memberNum = Number(memberParam);
  if (memberParam && memberParam.trim() !== "" && Number.isInteger(memberNum) && memberNum > 0) {
    const rows = await db.select().from(members).where(eq(members.id, memberNum)).limit(1);
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
    }
    memberId = row.id;
    balance = row.pointsBalance;
  }

  const redeemable = Math.min(
    Number.isFinite(requested) && requested > 0 ? Math.floor(requested) : 0,
    balance
  );
  const discountRaw = redeemable * POINT_VALUE;
  const discount = Math.min(discountRaw, subtotal);
  const total = subtotal - discount;
  const remaining = balance - redeemable;

  return NextResponse.json({
    memberId,
    subtotal,
    earnedPoints: earned,
    balance,
    redeemablePoints: redeemable,
    discount,
    total,
    remainingPoints: remaining,
  });
}