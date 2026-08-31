"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  BanknoteIcon,
  BuildingIcon,
  CartIcon,
  MapPinIcon,
  StarIcon,
  TrendingUpIcon,
} from "@/components/icons";
import { rupiah } from "@/lib/pos";

const ALL = 0;
type SortDir = "asc" | "desc" | null;

interface ApiBranch {
  id: number;
  name: string;
  city: string | null;
  address: string | null;
  status: string;
}

interface BranchMetric {
  monthRevenue: number;
  monthTransactions: number;
  lowStockItems: number;
  outItems: number;
}

interface BranchRow {
  id: number;
  name: string;
  city: string;
  address: string;
  status: "aktif" | string;
  monthRevenue: number;
  monthTransactions: number;
  lowStockItems: number;
  outItems: number;
}

function currentMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

async function fetchMetrics(id: number): Promise<BranchMetric> {
  const stockRes = await fetch(`/api/branches/${id}/stock`).then((r) =>
    r.ok ? r.json() : { stocks: [] }
  );
  const stocks: Array<{ stockQty: number; minStock: number }> = stockRes.stocks ?? [];
  const lowStockItems = stocks.filter((s) => s.stockQty > 0 && s.stockQty <= s.minStock).length;
  const outItems = stocks.filter((s) => s.stockQty <= 0).length;

  const salesRes = await fetch(
    `/api/branches/${id}/sales-comparison?from=${currentMonthKey()}`
  ).then((r) => (r.ok ? r.json() : null));
  const monthRevenue = salesRes?.to?.totalSales ?? 0;
  const monthTransactions = salesRes?.to?.totalTransactions ?? 0;

  return { monthRevenue, monthTransactions, lowStockItems, outItems };
}

export function BranchBoard() {
  const [selectedId, setSelectedId] = useState<number>(ALL);
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [rows, setRows] = useState<BranchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/branches")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat cabang");
        return res.json();
      })
      .then(async (json) => {
        const branches: ApiBranch[] = json.branches ?? [];
        const withMetrics = await Promise.all(
          branches.map(async (b) => {
            try {
              const m = await fetchMetrics(b.id);
              return {
                id: b.id,
                name: b.name,
                city: b.city ?? "",
                address: b.address ?? "",
                status: b.status,
                ...m,
              } as BranchRow;
            } catch {
              return {
                id: b.id,
                name: b.name,
                city: b.city ?? "",
                address: b.address ?? "",
                status: b.status,
                monthRevenue: 0,
                monthTransactions: 0,
                lowStockItems: 0,
                outItems: 0,
              } as BranchRow;
            }
          })
        );
        setRows(withMetrics);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const branches = useMemo(() => {
    let list = selectedId === ALL ? rows : rows.filter((b) => b.id === selectedId);
    if (sortDir) {
      const sign = sortDir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => (a.monthRevenue - b.monthRevenue) * sign);
    }
    return list;
  }, [rows, selectedId, sortDir]);

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  const stats = useMemo(() => {
    const active = branches.filter((b) => b.status === "aktif").length;
    const monthRevenue = branches.reduce((sum, b) => sum + b.monthRevenue, 0);
    const monthTransactions = branches.reduce((sum, b) => sum + b.monthTransactions, 0);
    return { active, count: branches.length, monthRevenue, monthTransactions };
  }, [branches]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Pilih Cabang</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value={ALL}>Semua Cabang</option>
            {rows.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          Menampilkan :{" "}
          <span className="font-medium text-foreground">
            {selectedId === ALL ? "Semua Cabang" : rows.find((b) => b.id === selectedId)?.name}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BuildingIcon width={15} height={15} /> Cabang Aktif
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.active}/{stats.count}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BanknoteIcon width={15} height={15} /> Penjualan Bulan Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-success">
            {rupiah.format(stats.monthRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CartIcon width={15} height={15} /> Transaksi Bulan Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.monthTransactions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUpIcon width={15} height={15} /> Penjualan Hari Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">—</p>
        </div>
      </div>

      <section
        aria-label="Daftar cabang"
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Cabang</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={toggleSort}
                      className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      aria-label="Urutkan berdasarkan total penjualan bulan ini"
                    >
                      Bulan Ini
                      {sortDir === "asc" ? (
                        <ArrowUpIcon width={12} height={12} />
                      ) : (
                        <ArrowDownIcon width={12} height={12} />
                      )}
                    </button>
                  </th>
                  <th className="py-2 pr-3 text-center font-medium">Transaksi</th>
                  <th className="py-2 pr-3 text-center font-medium">Stok Menipis</th>
                  <th className="py-2 pr-3 text-center font-medium">Habis</th>
                </tr>
              </thead>
              <tbody>
                {branches.map((branch) => (
                  <tr key={branch.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-foreground">{branch.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPinIcon width={11} height={11} />
                        {branch.city} · {branch.address}
                      </p>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          branch.status === "aktif"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {branch.status}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right text-foreground">
                      {rupiah.format(branch.monthRevenue)}
                    </td>
                    <td className="py-2.5 pr-3 text-center text-foreground">
                      {branch.monthTransactions}
                    </td>
                    <td className="py-2.5 pr-3 text-center">
                      <span
                        className={
                          branch.lowStockItems > 0
                            ? "font-semibold text-warning"
                            : "text-muted-foreground"
                        }
                      >
                        {branch.lowStockItems}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span
                        className={
                          branch.outItems > 0 ? "font-semibold text-error" : "text-muted-foreground"
                        }
                      >
                        {branch.outItems}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-[11px] text-muted-foreground">
          <StarIcon width={12} height={12} className="mr-0.5 inline-block" />
          Data cabang, stok, dan penjualan dari database.
        </p>
      </section>
    </div>
  );
}
