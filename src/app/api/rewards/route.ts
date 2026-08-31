import { NextResponse } from "next/server";
import { asc, desc, eq } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members, rewardWinners, rewards } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period");
  const limitRaw = searchParams.get("limit");

  if (period !== null && !/^\d{4}-\d{2}$/.test(period)) {
    return NextResponse.json({ error: "period wajib format YYYY-MM" }, { status: 400 });
  }

  const limit = limitRaw ? Number(limitRaw) : 50;
  if (Number.isNaN(limit) || limit <= 0 || limit > 500) {
    return NextResponse.json({ error: "limit harus 1-500" }, { status: 400 });
  }

  const db = await ensureDb();

  const rewardRows = period
    ? await db
        .select({ id: rewards.id, period: rewards.period, title: rewards.title, createdAt: rewards.createdAt })
        .from(rewards)
        .where(eq(rewards.period, period))
        .orderBy(desc(rewards.period))
    : await db
        .select({ id: rewards.id, period: rewards.period, title: rewards.title, createdAt: rewards.createdAt })
        .from(rewards)
        .orderBy(desc(rewards.period))
        .limit(limit);

  const winnerRows = await db
    .select({
      id: rewardWinners.id,
      rewardId: rewardWinners.rewardId,
      memberId: rewardWinners.memberId,
      memberName: members.name,
      rank: rewardWinners.rank,
      status: rewardWinners.status,
      deliveredDate: rewardWinners.deliveredDate,
      note: rewardWinners.note,
    })
    .from(rewardWinners)
    .innerJoin(members, eq(members.id, rewardWinners.memberId))
    .orderBy(asc(rewardWinners.rank));

  const winnersByReward = new Map<number, typeof winnerRows>();
  for (const row of winnerRows) {
    const list = winnersByReward.get(row.rewardId) ?? [];
    list.push(row);
    winnersByReward.set(row.rewardId, list);
  }

  const result = rewardRows.map((reward) => ({
    id: reward.id,
    period: reward.period,
    title: reward.title,
    createdAt: reward.createdAt,
    winners: (winnersByReward.get(reward.id) ?? []).map((w) => ({
      id: w.id,
      memberId: w.memberId,
      memberName: w.memberName,
      rank: w.rank,
      status: w.status,
      deliveredDate: w.deliveredDate,
      note: w.note,
    })),
  }));

  return NextResponse.json({ period: period ?? null, rewards: result });
}