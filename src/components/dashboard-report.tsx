"use client";

import { useState } from "react";
import Link from "next/link";
import { RangeFilter, type RangeValue } from "@/components/range-filter";
import { SalesTrendChart, type TrendPoint } from "@/components/sales-trend-chart";
import { TodaySummary } from "@/components/today-summary";
import { CalendarIcon, CartIcon, ChevronRightIcon, WalletIcon } from "@/components/icons";

const TREND_BY_RANGE: Record<
  RangeValue,
  { subtitle: string; data: TrendPoint[] }
> = {
  Harian: {
    subtitle: "Pendapatan 7 hari terakhir",
    data: [
      { label: "Sen 24", value: 980_000 },
      { label: "Sel 25", value: 1_150_000 },
      { label: "Rab 26", value: 860_000 },
      { label: "Kam 27", value: 1_320_000 },
      { label: "Jum 28", value: 1_540_000 },
      { label: "Sab 29", value: 1_480_000 },
      { label: "Min 30", value: 1_250_000 },
    ],
  },
  Mingguan: {
    subtitle: "Pendapatan 4 minggu terakhir",
    data: [
      { label: "W1", value: 6_400_000 },
      { label: "W2", value: 7_150_000 },
      { label: "W3", value: 6_880_000 },
      { label: "W4", value: 8_100_000 },
    ],
  },
  Bulanan: {
    subtitle: "Pendapatan 6 bulan terakhir",
    data: [
      { label: "Mar", value: 27_500_000 },
      { label: "Apr", value: 29_800_000 },
      { label: "Mei", value: 28_400_000 },
      { label: "Jun", value: 31_200_000 },
      { label: "Jul", value: 33_600_000 },
      { label: "Agu", value: 30_900_000 },
    ],
  },
  Tahunan: {
    subtitle: "Pendapatan 3 tahun terakhir",
    data: [
      { label: "2024", value: 268_000_000 },
      { label: "2025", value: 342_000_000 },
      { label: "2026", value: 391_500_000 },
    ],
  },
};

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
  const { subtitle, data } = TREND_BY_RANGE[range];

  return (
    <>
      <section aria-label="Ringkasan hari ini" className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Ringkasan Hari Ini
        </h2>
        <TodaySummary />
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
        </div>
        <div className="mt-4">
          <SalesTrendChart data={data} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section
          aria-label="Filter rentang waktu"
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <h2 className="mb-3 text-base font-semibold text-foreground">
            Rentang Waktu
          </h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Pilih periode laporan harian, mingguan, bulanan, atau tahunan.
          </p>
          <RangeFilter value={range} onChange={setRange} />
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