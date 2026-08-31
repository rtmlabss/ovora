"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RangeFilter, type RangeValue } from "@/components/range-filter";
import { SalesTrendChart, type TrendPoint } from "@/components/sales-trend-chart";
import { TodaySummary, type TodaySummaryData } from "@/components/today-summary";
import { CalendarIcon, CartIcon, ChevronRightIcon, WalletIcon } from "@/components/icons";

const RANGE_API_MAP: Record<RangeValue, string> = {
  Harian: "daily",
  Mingguan: "weekly",
  Bulanan: "monthly",
  Tahunan: "yearly",
};

const SUBTITLE_BY_RANGE: Record<RangeValue, string> = {
  Harian: "Pendapatan hari ini",
  Mingguan: "Pendapatan 7 hari terakhir",
  Bulanan: "Pendapatan bulan ini",
  Tahunan: "Pendapatan tahun ini",
};

interface ApiSummary {
  today: { sales: number; expenses: number; profit: number; orders: number };
  summary: { sales: number; expenses: number; profit: number; orders: number };
  trend: { label: string; sales: number }[];
}

function buildTodaySummary(today: ApiSummary["today"]): TodaySummaryData {
  return {
    penjualan: {
      amount: today.sales,
      helper: `${today.orders} transaksi hari ini`,
      changePct: 0,
    },
    pengeluaran: {
      amount: today.expenses,
      helper: "Pengeluaran hari ini",
      changePct: 0,
    },
    laba: {
      amount: today.profit,
      helper: "Penjualan dikurangi pengeluaran",
      changePct: 0,
    },
  };
}

const QUICK_ACTIONS = [
  {
    href: "/kasir",
    label: "Kasir Penjualan",
    description: "Buat transaksi penjualan",
    icon: CartIcon,
    className: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  {
    href: "/stok",
    label: "Manajemen Stok",
    description: "Catat stok masuk & keluar",
    icon: CalendarIcon,
    className: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  },
  {
    href: "/keuangan",
    label: "Pencatatan Keuangan",
    description: "Catat pemasukan & pengeluaran",
    icon: WalletIcon,
    className: "bg-tertiary text-tertiary-foreground hover:bg-tertiary/90",
  },
];

export function DashboardReport() {
  const [range, setRange] = useState<RangeValue>("Harian");
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    fetch(`/api/dashboard/summary?range=${RANGE_API_MAP[range]}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.trend && Array.isArray(d?.trend)) setSummary(d);
        else setError("Gagal memuat data dashboard.");
      })
      .catch(() => {
        if (!cancelled) setError("Tidak dapat terhubung ke server.");
      });
    return () => {
      cancelled = true;
    };
  }, [range]);

  const subtitle = SUBTITLE_BY_RANGE[range];
  const trendData: TrendPoint[] = summary
    ? summary.trend.map((t) => ({ label: t.label, value: t.sales }))
    : [];
  const todayData = summary ? buildTodaySummary(summary.today) : undefined;

  return (
    <>
      <section aria-label="Ringkasan hari ini" className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ringkasan Hari Ini
        </h2>
        <TodaySummary data={todayData} />
      </section>

      <section
        aria-label="Grafik tren penjualan"
        className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Grafik Tren Penjualan
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <RangeFilter value={range} onChange={setRange} />
        </div>
        <div className="mt-4">
          {error ? (
            <p className="py-8 text-center text-sm text-error">{error}</p>
          ) : trendData.length === 0 ? (
            <div className="h-40 animate-pulse rounded-lg bg-muted" />
          ) : trendData.every((t) => t.value === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada data penjualan pada rentang ini.
            </p>
          ) : (
            <SalesTrendChart data={trendData} />
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          aria-label="Ringkasan periode"
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Ringkasan Periode
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Total pendapatan, pengeluaran, dan laba pada rentang terpilih.
          </p>
          {summary ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { label: "Penjualan", value: summary.summary?.sales ?? 0 },
                { label: "Pengeluaran", value: summary.summary?.expenses ?? 0 },
                { label: "Laba", value: summary.summary?.profit ?? 0 },
              ].map((s) => (
                <div key={s.label} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-lg font-bold text-foreground">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(s.value)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            !error && <div className="h-24 animate-pulse rounded-lg bg-muted" />
          )}
        </section>

        <section
          aria-label="Akses cepat"
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Akses Cepat
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Buka modul utama dengan satu klik.
          </p>
          <div className="space-y-2">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition-colors ${action.className}`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="shrink-0 rounded-md bg-white/20 p-1.5">
                      <Icon width={16} height={16} />
                    </span>
                    <span className="min-w-0 leading-tight">
                      <span className="block text-sm font-medium">
                        {action.label}
                      </span>
                      <span className="block truncate text-xs opacity-80">
                        {action.description}
                      </span>
                    </span>
                  </span>
                  <ChevronRightIcon
                    width={16}
                    height={16}
                    className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}
