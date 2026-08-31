import { NextResponse } from "next/server";
import { eq, inArray } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members, rewardWinners, rewards } from "@/db/schema";

export const dynamic = "force-dynamic";

const MAX_WINNERS = 10;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON tidak valid" }, { status: 400 });
  }

  const { period, title, memberIds } = (body ?? {}) as {
    period?: unknown;
    title?: unknown;
    memberIds?: unknown;
  };

  if (typeof period !== "string" || !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "period wajib format YYYY-MM" }, { status: 400 });
  }

  if (!Array.isArray(memberIds) || memberIds.length === 0) {
    return NextResponse.json({ error: "memberIds wajib berisi minimal satu member" }, { status: 400 });
  }

  const ids = Array.from(new Set(memberIds.map((v) => Number(v))));
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    return NextResponse.json({ error: "memberIds berisi id member tidak valid" }, { status: 400 });
  }
  if (ids.length > MAX_WINNERS) {
    return NextResponse.json(
      { error: `Jumlah pemenang maksimal ${MAX_WINNERS}` },
      { status: 400 }
    );
  }

  const db = await ensureDb();

  const known = await db
    .select({ id: members.id, name: members.name })
    .from(members)
    .where(inArray(members.id, ids));
  if (known.length !== ids.length) {
    return NextResponse.json({ error: "Terdapat member yang tidak ditemukan" }, { status: 404 });
  }
  const knownMap = new Map(known.map((m) => [m.id, m.name]));

  const rewardTitle = typeof title === "string" && title.trim() ? title.trim() : `Reward ${period}`;

  const existing = await db
    .select({ id: rewards.id })
    .from(rewards)
    .where(eq(rewards.period, period));

  let rewardId: number;
  if (existing.length > 0) {
    rewardId = existing[0].id;
    await db.update(rewards)
      .set({ title: rewardTitle })
      .where(eq(rewards.id, rewardId));
  } else {
    const inserted = await db
      .insert(rewards)
      .values({ period, title: rewardTitle, createdAt: new Date().toISOString() })
      .returning({ id: rewards.id });
    rewardId = inserted[0].id;
  }

  const now = new Date().toISOString();
  await db.delete(rewardWinners).where(eq(rewardWinners.rewardId, rewardId));
  await db.insert(rewardWinners)
    .values(ids.map((memberId, index) => ({
      rewardId,
      memberId,
      rank: index + 1,
      status: "dijadwalkan",
      createdAt: now,
    })));

  return NextResponse.json(
    {
      id: rewardId,
      period,
      title: rewardTitle,
      winners: ids.map((memberId, index) => ({
        memberId,
        memberName: knownMap.get(memberId)!,
        rank: index + 1,
      })),
    },
    { status: 201 }
  );
}