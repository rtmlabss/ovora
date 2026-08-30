"use client";

import { useMemo, useState } from "react";
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
import { MOCK_BRANCHES } from "@/lib/monitoring";
import { rupiah } from "@/lib/pos";

const ALL = 0;
type SortDir = "asc" | "desc" | null;

export function BranchBoard() {
  const [selectedId, setSelectedId] = useState<number>(ALL);
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const branches = useMemo(() => {
    let list = selectedId === ALL ? MOCK_BRANCHES : MOCK_BRANCHES.filter((b) => b.id === selectedId);
    if (sortDir) {
      const sign = sortDir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => (a.monthRevenue - b.monthRevenue) * sign);
    }
    return list;
  }, [selectedId, sortDir]);

  function toggleSort() {
    setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  const stats = useMemo(() => {
    const active = branches.filter((b) => b.status === "aktif").length;
    const todayRevenue = branches.reduce((sum, b) => sum + b.todayRevenue, 0);
    const monthRevenue = branches.reduce((sum, b) => sum + b.monthRevenue, 0);
    const todayTransactions = branches.reduce((sum, b) => sum + b.todayTransactions, 0);
    const pointsAwarded = branches.reduce((sum, b) => sum + b.pointsAwarded, 0);
    return { active, todayRevenue, monthRevenue, todayTransactions, pointsAwarded };
  }, [branches]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            Pilih Cabang
          </label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(Number(e.target.value))}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value={ALL}>Semua Cabang</option>
            {MOCK_BRANCHES.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.city}
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-muted-foreground">
          Menampilkan :{" "}
          <span className="font-medium text-foreground">
            {selectedId === ALL ? "Semua Cabang" : MOCK_BRANCHES.find((b) => b.id === selectedId)?.name}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BuildingIcon width={15} height={15} /> Cabang Aktif
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {stats.active}/{branches.length}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <BanknoteIcon width={15} height={15} /> Penjualan Hari Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-success">
            {rupiah.format(stats.todayRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <TrendingUpIcon width={15} height={15} /> Penjualan Bulan Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">
            {rupiah.format(stats.monthRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CartIcon width={15} height={15} /> Transaksi Hari Ini
          </p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.todayTransactions}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <StarIcon width={15} height={15} /> Poin Beredar
          </p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {stats.pointsAwarded.toLocaleString("id-ID")}
          </p>
        </div>
      </div>

      <section
        aria-label="Daftar cabang"
        className="rounded-xl border border-border bg-card p-4 shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Cabang</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 text-right font-medium">Hari Ini</th>
                <th className="py-2 pr-3 text-right font-medium">
                  <button
                    type="button"
                    onClick={toggleSort}
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                    aria-label="Urutkan berdasarkan total penjualan"
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
                <th className="py-2 pr-3 text-center font-medium">Member</th>
                <th className="py-2 text-center font-medium">Poin</th>
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
                  <td className="py-2.5 pr-3 text-right font-medium text-success">
                    {rupiah.format(branch.todayRevenue)}
                  </td>
                  <td className="py-2.5 pr-3 text-right text-foreground">
                    {rupiah.format(branch.monthRevenue)}
                  </td>
                  <td className="py-2.5 pr-3 text-center text-foreground">
                    {branch.todayTransactions}
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <span
                      className={
                        branch.lowStockItems > 0 ? "font-semibold text-warning" : "text-muted-foreground"
                      }
                    >
                      {branch.lowStockItems}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <span
                      className={
                        branch.outItems > 0 ? "font-semibold text-error" : "text-muted-foreground"
                      }
                    >
                      {branch.outItems}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-center text-foreground">{branch.members}</td>
                  <td className="py-2.5 text-center text-warning">
                    {branch.pointsAwarded.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Monitoring memakai data tiruan sampai API monitoring cabang selesai.
        </p>
      </section>
    </div>
  );
}