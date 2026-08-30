import { NextResponse } from "next/server";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { ensureDb } from "@/db";
import { members, pointMovements } from "@/db/schema";

export const dynamic = "force-dynamic";

function parsePeriod(value: string | null): string | null {
  if (!value) return null;
  return /^\d{4}-\d{2}$/.test(value.trim()) ? value.trim() : null;
}

function monthRange(period: string) {
  const [y, m] = period.split("-").map(Number);
  const start = new Date(y, m - 1, 1).toISOString();
  const end = new Date(y, m, 1).toISOString();
  return { start, end };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchIdRaw = searchParams.get("branchId");
  const period = parsePeriod(searchParams.get("period"));
  const limitRaw = searchParams.get("limit");

  if (!period) {
    return NextResponse.json({ error: "Query period wajib format YYYY-MM" }, { status: 400 });
  }

  const branchId = branchIdRaw === null ? null : Number(branchIdRaw);
  if (branchId !== null && (Number.isNaN(branchId) || branchId <= 0)) {
    return NextResponse.json({ error: "branchId tidak valid" }, { status: 400 });
  }

  const limit = limitRaw ? Number(limitRaw) : 50;
  if (Number.isNaN(limit) || limit <= 0 || limit > 500) {
    return NextResponse.json({ error: "limit harus 1-500" }, { status: 400 });
  }

  const periodRange = monthRange(period);
  const db = ensureDb();

  const conditions = [
    eq(pointMovements.kind, "perolehan"),
    gte(pointMovements.createdAt, periodRange.start),
    lt(pointMovements.createdAt, periodRange.end),
  ];
  if (branchId) {
    conditions.push(eq(pointMovements.branchId, branchId));
  }

  const rows = db
    .select({
      memberId: pointMovements.memberId,
      memberName: members.name,
      branchId: pointMovements.branchId,
      monthPoints: sql<number>`COALESCE(SUM(${pointMovements.points}), 0)`,
    })
    .from(pointMovements)
    .innerJoin(members, eq(members.id, pointMovements.memberId))
    .where(and(...conditions))
    .groupBy(pointMovements.memberId)
    .orderBy(desc(sql`COALESCE(SUM(${pointMovements.points}), 0)`))
    .limit(limit)
    .all();

  const result = rows.map((row, index) => ({
    rank: index + 1,
    memberId: row.memberId,
    memberName: row.memberName,
    branchId: row.branchId,
    monthPoints: row.monthPoints,
  }));

  return NextResponse.json({ period, rows: result });
}