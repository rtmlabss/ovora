"use client";

import { useCallback, useEffect, useState } from "react";
import { useMemo } from "react";
import { TrendingUpIcon } from "@/components/icons";
import { rupiah } from "@/lib/pos";

function fmtDate(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

function genPeriodKeys(): string[] {
  const keys: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

interface ComparisonRow {
  branchId: number;
  branchName: string;
  revenue: number;
  otherRevenue: number;
  transactions: number;
  otherTransactions: number;
  diffRevenue: number;
  diffTransactions: number;
}

export function SalesComparison() {
  const [periods] = useState<string[]>(() => genPeriodKeys());
  const [periodA, setPeriodA] = useState<string>(() => genPeriodKeys()[1]);
  const [periodB, setPeriodB] = useState<string>(() => genPeriodKeys()[0]);
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = useMemo(
    () => (periodA === periodB ? undefined : { periodA, periodB, rows }),
    [periodA, periodB, rows]
  );

  const load = useCallback(
    (a: string, b: string) => {
      if (a === b) {
        setRows([]);
        return;
      }
      setLoading(true);
      setError(null);
      fetch("/api/branches")
        .then((res) => {
          if (!res.ok) throw new Error("Gagal memuat cabang");
          return res.json();
        })
        .then(async (json) => {
          const branchList: Array<{ id: number; name: string }> = json.branches ?? [];
          const results = await Promise.all(
            branchList.map(async (br) => {
              try {
                const r = await fetch(
                  `/api/branches/${br.id}/sales-comparison?from=${a}&to=${b}`
                ).then((res) => (res.ok ? res.json() : null));
                const from = r?.from ?? { totalSales: 0, totalTransactions: 0 };
                const to = r?.to ?? { totalSales: 0, totalTransactions: 0 };
                return {
                  branchId: br.id,
                  branchName: br.name,
                  revenue: from.totalSales,
                  otherRevenue: to.totalSales,
                  transactions: from.totalTransactions,
                  otherTransactions: to.totalTransactions,
                  diffRevenue: to.totalSales - from.totalSales,
                  diffTransactions: to.totalTransactions - from.totalTransactions,
                } as ComparisonRow;
              } catch {
                return null;
              }
            })
          );
          setRows(results.filter((r): r is ComparisonRow => r !== null));
        })
        .catch((err: Error) => setError(err.message))
        .finally(() => setLoading(false));
    },
    []
  );

  useEffect(() => {
    load(periodA, periodB);
  }, [load, periodA, periodB]);

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
            {periods.map((k) => (
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
            {periods.map((k) => (
              <option key={k} value={k}>
                {fmtDate(k)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      ) : data ? (
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
              {data.rows.map((row) => (
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
          {data.rows.length === 0 && (
            <p className="mt-4 rounded-lg bg-muted/20 py-6 text-center text-sm text-muted-foreground">
              Tidak ada data penjualan untuk periode ini
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-lg bg-muted/20 py-6 text-center text-sm text-muted-foreground">
          Pilih dua periode yang berbeda untuk membandingkan penjualan.
        </p>
      )}
    </section>
  );
}
