import { NextResponse } from "next/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members, pointMovements } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const db = await ensureDb();

  const memberId = searchParams.get("memberId");
  const kind = searchParams.get("kind");
  const limit = searchParams.get("limit");

  const conditions = [];

  const memberNum = Number(memberId);
  if (memberId && memberId.trim() !== "" && Number.isInteger(memberNum) && memberNum > 0) {
    conditions.push(eq(pointMovements.memberId, memberNum));
  }

  if (kind === "perolehan" || kind === "penukaran") {
    conditions.push(eq(pointMovements.kind, kind));
  }

  const limitNum = Math.min(Math.max(Number(limit) || 100, 1), 500);

  const rows = await db
    .select({
      id: pointMovements.id,
      memberId: pointMovements.memberId,
      memberName: members.name,
      branchId: pointMovements.branchId,
      kind: pointMovements.kind,
      points: pointMovements.points,
      note: pointMovements.note,
      transactionId: pointMovements.transactionId,
      createdAt: pointMovements.createdAt,
    })
    .from(pointMovements)
    .leftJoin(members, eq(pointMovements.memberId, members.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`${pointMovements.kind} IS 'penukaran'`, desc(pointMovements.createdAt), asc(pointMovements.id))
    .limit(limitNum);

  return NextResponse.json({ count: rows.length, pointMovements: rows });
}