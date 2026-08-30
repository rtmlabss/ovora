import { NextResponse } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { ensureDb } from "@/db";
import { branches, transactions } from "@/db/schema";

export const dynamic = "force-dynamic";

function monthRange(period: string) {
  return { start: `${period}-01`, end: `${period}-99` };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const branchId = Number(id);
  if (!Number.isInteger(branchId) || branchId <= 0) {
    return NextResponse.json({ error: "branchId tidak valid" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const fromPeriod = searchParams.get("from");
  const toPeriod = searchParams.get("to") ?? fromPeriod;
  if (!fromPeriod || !/^\d{4}-\d{2}$/.test(fromPeriod)) {
    return NextResponse.json({ error: "from wajib format YYYY-MM" }, { status: 400 });
  }
  if (!toPeriod || !/^\d{4}-\d{2}$/.test(toPeriod)) {
    return NextResponse.json({ error: "to wajib format YYYY-MM" }, { status: 400 });
  }

  const db = ensureDb();

  const branch = db.select().from(branches).where(eq(branches.id, branchId)).get();
  if (!branch) {
    return NextResponse.json({ error: "Cabang tidak ditemukan" }, { status: 404 });
  }

  const agg = (period: string) => {
    const { start, end } = monthRange(period);
    const rows = db
      .select({
        totalSales: sql<number>`COALESCE(SUM(${transactions.total}), 0)`,
        totalTransactions: sql<number>`COALESCE(COUNT(*), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.branchId, branchId),
          gte(transactions.createdAt, start),
          lt(transactions.createdAt, end)
        )
      )
      .all();
    const r = rows[0];
    return {
      period,
      totalSales: r?.totalSales ?? 0,
      totalTransactions: r?.totalTransactions ?? 0,
    };
  };

  const from = agg(fromPeriod);
  const to = agg(toPeriod);

  const salesDelta = from.totalSales === 0 ? null : to.totalSales - from.totalSales;
  const salesPct =
    from.totalSales === 0 ? null : Math.round((salesDelta! / from.totalSales) * 1000) / 10;
  const txnDelta = from.totalTransactions === 0 ? null : to.totalTransactions - from.totalTransactions;
  const txnPct =
    from.totalTransactions === 0
      ? null
      : Math.round((txnDelta! / from.totalTransactions) * 1000) / 10;

  return NextResponse.json({
    branch: { id: branch.id, name: branch.name },
    from,
    to,
    deltas: {
      salesDelta,
      salesPct,
      txnDelta,
      txnPct,
    },
  });
}