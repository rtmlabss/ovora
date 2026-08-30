"use client";

import { useEffect, useState } from "react";
import { RangeFilter, type RangeValue } from "@/components/range-filter";
import { ReceiptIcon, TrendingDownIcon, TrendingUpIcon } from "@/components/icons";
import { rupiah } from "@/lib/pos";

const RANGE_TO_QUERY: Record<RangeValue, string> = {
  Harian: "daily",
  Mingguan: "weekly",
  Bulanan: "monthly",
  Tahunan: "yearly",
};

export interface SummaryData {
  sales: number;
  expenses: number;
  profit: number;
  orders: number;
}

function Card({
  label,
  amount,
  helper,
  tone,
  icon,
}: {
  label: string;
  amount: number;
  helper: string;
  tone: "primary" | "success" | "error";
  icon: React.ReactNode;
}) {
  const iconBg =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "error"
        ? "bg-error/10 text-error"
        : "bg-success/10 text-success";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {rupiah.format(amount)}
          </p>
        </div>
        <span className={`rounded-lg p-3 ${iconBg}`}>{icon}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}

export function FinancialSummary() {
  const [range, setRange] = useState<RangeValue>("Harian");
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/dashboard/summary?range=${RANGE_TO_QUERY[range]}`)
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat ringkasan keuangan");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData({
          sales: json.summary?.sales ?? 0,
          expenses: json.summary?.expenses ?? 0,
          profit: json.summary?.profit ?? 0,
          orders: json.summary?.orders ?? 0,
        });
        setError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <section
      aria-label="Ringkasan keuangan"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Ringkasan Keuangan</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Total pemasukan, pengeluaran, dan laba untuk rentang terpilih.
          </p>
        </div>
        <RangeFilter value={range} onChange={setRange} />
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      ) : data ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            label="Total Pemasukan"
            amount={data.sales}
            tone="primary"
            icon={<TrendingUpIcon width={20} height={20} />}
            helper={`${data.orders.toLocaleString("id-ID")} transaksi penjualan`}
          />
          <Card
            label="Total Pengeluaran"
            amount={data.expenses}
            tone="error"
            icon={<TrendingDownIcon width={20} height={20} />}
            helper="Pengeluaran operasional toko"
          />
          <Card
            label="Total Laba"
            amount={data.profit}
            tone="success"
            icon={<ReceiptIcon width={20} height={20} />}
            helper="Pemasukan dikurangi pengeluaran"
          />
        </div>
      ) : null}
    </section>
  );
}