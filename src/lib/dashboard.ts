import { and, between, eq, gte } from "drizzle-orm";
import { financialTransactions, transactions } from "@/db/schema";
import type { DB } from "@/db/type";

export type DashboardRange = "daily" | "weekly" | "monthly" | "yearly";

export const RANGES: DashboardRange[] = ["daily", "weekly", "monthly", "yearly"];

export function parseRange(value: string | null): DashboardRange {
  return RANGES.includes(value as DashboardRange)
    ? (value as DashboardRange)
    : "weekly";
}

function rangeBounds(range: DashboardRange, now: Date) {
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case "daily":
      return { from: startOfDay, to: now };
    case "weekly":
      return { from: new Date(startOfDay.getTime() - 6 * 86_400_000), to: now };
    case "monthly": {
      const from = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from, to: now };
    }
    case "yearly":
      return { from: new Date(now.getFullYear(), 0, 1), to: now };
  }
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}T00:00:00.000Z`;
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01T00:00:00.000Z`;
}

export function buildTrend(
  range: DashboardRange,
  now: Date,
  salesByBucket: Map<string, number>
) {
  const trend: { label: string; sales: number }[] = [];
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (range === "daily") {
    for (let h = 0; h <= now.getHours(); h++) {
      const bucket = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h).toISOString();
      trend.push({ label: `${String(h).padStart(2, "0")}.00`, sales: Math.round(salesByBucket.get(bucket) ?? 0) });
    }
  } else if (range === "weekly") {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(startOfDay.getTime() - d * 86_400_000);
      trend.push({
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        sales: Math.round(salesByBucket.get(dayKey(date)) ?? 0),
      });
    }
  } else if (range === "monthly") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), d);
      trend.push({
        label: String(d),
        sales: Math.round(salesByBucket.get(dayKey(date)) ?? 0),
      });
    }
  } else {
    for (let m = 0; m <= now.getMonth(); m++) {
      const date = new Date(now.getFullYear(), m, 1);
      trend.push({
        label: date.toLocaleDateString("id-ID", { month: "short" }),
        sales: Math.round(salesByBucket.get(monthKey(date)) ?? 0),
      });
    }
  }
  return trend;
}

export function getDashboardData(db: DB, range: DashboardRange, now: Date) {
  const { from, to } = rangeBounds(range, now);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const txnRows = db
    .select({
      total: transactions.total,
      createdAt: transactions.createdAt,
    })
    .from(transactions)
    .where(gte(transactions.createdAt, from.toISOString()))
    .all();

  const expenseRows = db
    .select({
      amount: financialTransactions.amount,
      createdAt: financialTransactions.createdAt,
    })
    .from(financialTransactions)
    .where(
      and(
        eq(financialTransactions.type, "pengeluaran"),
        between(financialTransactions.createdAt, from.toISOString(), to.toISOString())
      )
    )
    .all();

  const sales = txnRows.reduce((sum, r) => sum + r.total, 0);
  const expenses = expenseRows.reduce((sum, r) => sum + r.amount, 0);

  const todayRows = txnRows.filter((r) => r.createdAt >= startOfToday.toISOString());
  const todaySales = todayRows.reduce((sum, r) => sum + r.total, 0);
  const todayExpenses = expenseRows
    .filter((r) => r.createdAt >= startOfToday.toISOString())
    .reduce((sum, r) => sum + r.amount, 0);

  const salesByBucket = new Map<string, number>();
  for (const r of txnRows) {
    const date = new Date(r.createdAt);
    const bucket =
      range === "daily"
        ? new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()).toISOString()
        : range === "yearly"
          ? monthKey(date)
          : dayKey(date);
    salesByBucket.set(bucket, (salesByBucket.get(bucket) ?? 0) + r.total);
  }

  return {
    today: {
      sales: Math.round(todaySales),
      expenses: Math.round(todayExpenses),
      profit: Math.round(todaySales - todayExpenses),
      orders: todayRows.length,
    },
    summary: {
      sales: Math.round(sales),
      expenses: Math.round(expenses),
      profit: Math.round(sales - expenses),
      orders: txnRows.length,
    },
    trend: buildTrend(range, now, salesByBucket),
  };
}