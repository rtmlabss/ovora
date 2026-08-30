"use client";

import { useMemo, useState } from "react";
import { SearchIcon, TrendingDownIcon, TrendingUpIcon } from "@/components/icons";
import { MOCK_STOCK_IN, MOCK_STOCK_OUT, type StockMoveType } from "@/lib/stok";
import type { Product } from "@/lib/pos";
import { PRODUCT_STUB } from "@/lib/pos";

type MoveFilter = "semua" | StockMoveType;

const FILTERS: { value: MoveFilter; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "masuk", label: "Masuk" },
  { value: "keluar", label: "Keluar" },
];

function formatDate(iso: string) {
  const date = new Date(iso);
  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const QUANTITY_UNITS: Record<string, { unit: string }> = {};
for (const product of PRODUCT_STUB) {
  QUANTITY_UNITS[product.name] = { unit: product.unit };
}

export function StockMovementsLog() {
  const [filter, setFilter] = useState<MoveFilter>("semua");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const all = [...MOCK_STOCK_IN, ...MOCK_STOCK_OUT].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const q = query.trim().toLowerCase();
    return all.filter((move) => {
      if (filter !== "semua" && move.type !== filter) return false;
      if (q && !move.productName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [filter, query]);

  return (
    <section
      aria-label="Riwayat mutasi stok"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Riwayat Mutasi Stok</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Semua pergerakan barang masuk dan keluar terbaru.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                aria-pressed={filter === f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/15"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="relative block w-full max-w-xs">
            <SearchIcon
              width={16}
              height={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari produk…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
            />
          </label>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg bg-muted/20 py-10 text-center">
          <p className="text-sm text-muted-foreground">Belum ada mutasi stok yang cocok</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Tanggal</th>
                <th className="py-2 pr-3 font-medium">Produk</th>
                <th className="py-2 pr-3 font-medium">Tipe</th>
                <th className="py-2 pr-3 text-right font-medium">Jumlah</th>
                <th className="py-2 font-medium">Catatan</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((move) => {
                const isIn = move.type === "masuk";
                const unit = QUANTITY_UNITS[move.productName]?.unit ?? "";
                return (
                  <tr
                    key={move.id}
                    className="border-b border-border/60 align-top last:border-0"
                  >
                    <td className="whitespace-nowrap py-2.5 pr-3 text-muted-foreground">
                      <p>{formatDate(move.createdAt)}</p>
                      <p className="text-xs">{formatTime(move.createdAt)}</p>
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      {move.productName}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                          isIn ? "bg-success/10 text-success" : "bg-error/10 text-error"
                        }`}
                      >
                        {isIn ? (
                          <TrendingUpIcon width={12} height={12} />
                        ) : (
                          <TrendingDownIcon width={12} height={12} />
                        )}
                        {isIn ? "Masuk" : "Keluar"}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap py-2.5 pr-3 text-right font-semibold ${
                        isIn ? "text-success" : "text-error"
                      }`}
                    >
                      {isIn ? "+" : "-"}
                      {move.qty.toLocaleString("id-ID")}
                      {unit ? ` ${unit}` : ""}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {move.note || "Tanpa catatan"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">
        Tampilan memakai data tiruan sampai API mutasi stok selesai.
      </p>
    </section>
  );
}