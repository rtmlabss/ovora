"use client";

import { useMemo, useState } from "react";
import { TrendingUpIcon } from "@/components/icons";
import {
  MOCK_SALES_BY_PERIOD,
  SALES_PERIOD_KEYS,
} from "@/lib/monitoring";
import { rupiah } from "@/lib/pos";

function fmtDate(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
}

interface ComparisonRow {
  branchId: number;
  branchName: string;
  revenue: number;
  transactions: number;
  otherRevenue: number;
  otherTransactions: number;
  diffRevenue: number;
  diffTransactions: number;
}

interface ComparisonData {
  period: string;
  branches: ComparisonRow[];
}

export function SalesComparison() {
  const [periodA, setPeriodA] = useState<string>("2026-07");
  const [periodB, setPeriodB] = useState<string>("2026-08");

  const data: ComparisonData | undefined = useMemo(() => {
    if (periodA === periodB) return undefined;
    const a = MOCK_SALES_BY_PERIOD[periodA];
    const b = MOCK_SALES_BY_PERIOD[periodB];
    if (!a || !b) return undefined;
    const branches: ComparisonRow[] = a.branches.map((row) => {
      const other = b.branches.find((r) => r.branchId === row.branchId);
      return {
        branchId: row.branchId,
        branchName: row.branchName,
        revenue: row.revenue,
        transactions: row.transactions,
        otherRevenue: other?.revenue ?? 0,
        otherTransactions: other?.transactions ?? 0,
        diffRevenue: row.revenue - (other?.revenue ?? 0),
        diffTransactions: row.transactions - (other?.transactions ?? 0),
      };
    });
    return { period: a.period, branches };
  }, [periodA, periodB]);

  return (
    <section
      aria-label="Perbandingan penjualan antar periode"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <TrendingUpIcon width={18} height={18} className="text-success" />
        Perbandingan Penjualan
      </h2>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Periode Awal</label>
          <select
            value={periodA}
            onChange={(e) => setPeriodA(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {SALES_PERIOD_KEYS.map((k) => (
              <option key={k} value={k}>
                {fmtDate(k)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Periode Akhir</label>
          <select
            value={periodB}
            onChange={(e) => setPeriodB(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            {SALES_PERIOD_KEYS.map((k) => (
              <option key={k} value={k}>
                {fmtDate(k)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {data ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Cabang</th>
                <th className="py-2 pr-3 font-medium">{fmtDate(periodA)}</th>
                <th className="py-2 pr-3 font-medium">{fmtDate(periodB)}</th>
                <th className="py-2 pr-3 text-right font-medium">Δ Penjualan</th>
                <th className="py-2 text-right font-medium">Δ Transaksi</th>
              </tr>
            </thead>
            <tbody>
              {data.branches.map((row) => (
                <tr key={row.branchId} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{row.branchName}</td>
                  <td className="py-2.5 pr-3 text-foreground">{rupiah.format(row.revenue)}</td>
                  <td className="py-2.5 pr-3 text-foreground">
                    {rupiah.format(row.otherRevenue)}
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <span
                      className={`font-semibold ${
                        row.diffRevenue >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {row.diffRevenue >= 0 ? "+" : "-"}
                      {rupiah.format(Math.abs(row.diffRevenue))}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span
                      className={`font-semibold ${
                        row.diffTransactions >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {row.diffTransactions >= 0 ? "+" : "-"}
                      {Math.abs(row.diffTransactions)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-muted/20 py-6 text-center text-sm text-muted-foreground">
          Pilih dua periode yang berbeda untuk membandingkan penjualan.
        </p>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">
        Data pembanding memakai data tiruan sampai API monitoring selesai.
      </p>
    </section>
  );
}