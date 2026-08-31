import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members, rewardWinners } from "@/db/schema";

export const dynamic = "force-dynamic";

const STATUSES = ["diserahkan", "dijadwalkan"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { rewardId, memberId, status, deliveredDate, note } = (body ?? {}) as {
    rewardId?: unknown;
    memberId?: unknown;
    status?: unknown;
    deliveredDate?: unknown;
    note?: unknown;
  };

  const rId = Number(rewardId);
  const mId = Number(memberId);
  if (!Number.isInteger(rId) || rId <= 0 || !Number.isInteger(mId) || mId <= 0) {
    return NextResponse.json({ error: "rewardId dan memberId wajib berupa angka positif" }, { status: 400 });
  }

  const newStatus = status === undefined ? "diserahkan" : String(status);
  if (!STATUSES.includes(newStatus)) {
    return NextResponse.json(
      { error: `status harus salah satu dari: ${STATUSES.join(", ")}` },
      { status: 400 }
    );
  }

  const date = deliveredDate === undefined || deliveredDate === null ? null : String(deliveredDate);
  if (date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "deliveredDate wajib format YYYY-MM-DD" }, { status: 400 });
  }

  const noteText = note === undefined || note === null ? null : String(note).slice(0, 500);

  const db = await ensureDb();

  const existing = await db
    .select({ id: rewardWinners.id })
    .from(rewardWinners)
    .where(and(eq(rewardWinners.rewardId, rId), eq(rewardWinners.memberId, mId)));
  if (existing.length === 0) {
    return NextResponse.json({ error: "Pemenang pada reward ini tidak ditemukan" }, { status: 404 });
  }

  const winnerId = existing[0].id;
  await db.update(rewardWinners)
    .set({
      status: newStatus,
      deliveredDate: date,
      note: noteText,
    })
    .where(eq(rewardWinners.id, winnerId));

  const memberRows = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(eq(members.id, mId))
    .limit(1);
  const member = memberRows[0];

  return NextResponse.json({
    rewardId: rId,
    memberId: mId,
    memberName: member?.name ?? null,
    status: newStatus,
    deliveredDate: date,
    note: noteText,
  });
}