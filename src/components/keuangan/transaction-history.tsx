"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BanknoteIcon,
  CheckIcon,
  ChevronRightIcon,
  QrIcon,
  SearchIcon,
} from "@/components/icons";
import { ALL_CATEGORIES, MOCK_CASH_ENTRIES, MOCK_EXPENSE_ENTRIES } from "@/lib/keuangan";
import { rupiah } from "@/lib/pos";

interface TxItem {
  productId: number;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
}

interface TxRow {
  id: number;
  invoiceNo: string;
  memberName: string | null;
  subtotal: number;
  discount: number;
  pointsUsed: number;
  total: number;
  paymentMethod: string;
  createdAt: string;
  items: TxItem[];
}

interface UnifiedEntry {
  key: string;
  kind: "penjualan" | "pemasukan" | "pengeluaran";
  category: string;
  title: string;
  note: string;
  amount: number;
  isMock: boolean;
  createdAt: string;
  invoice?: { invoiceNo: string; paymentMethod: string; subtotal: number; items: TxItem[] };
}

type Phase = "semua" | "7hari" | "30hari";

const PHASES: { value: Phase; label: string }[] = [
  { value: "semua", label: "Semua" },
  { value: "7hari", label: "7 Hari" },
  { value: "30hari", label: "30 Hari" },
];

const METHOD_META: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
  tunai: {
    label: "Tunai",
    className: "bg-success/10 text-success",
    icon: <BanknoteIcon width={12} height={12} />,
  },
  qris: {
    label: "QRIS",
    className: "bg-primary/10 text-primary",
    icon: <QrIcon width={12} height={12} />,
  },
  transfer: {
    label: "Transfer",
    className: "bg-tertiary/10 text-tertiary",
    icon: <CheckIcon width={12} height={12} />,
  },
};

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

export function TransactionHistory() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("semua");
  const [category, setCategory] = useState("semua");
  const [query, setQuery] = useState("");
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/transactions?limit=100")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat riwayat keuangan");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setRows(json.transactions ?? []);
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
  }, []);

  const entries = useMemo<UnifiedEntry[]>(() => {
    const sales: UnifiedEntry[] = rows.map((row) => {
      const summary = row.items.slice(0, 2).map((i) => `${i.qty} ${i.name}`).join(", ");
      const extra = row.items.length > 2 ? ` +${row.items.length - 2} lainnya` : "";
      return {
        key: `sale-${row.id}`,
        kind: "penjualan",
        category: "Penjualan",
        title: row.invoiceNo,
        note: `${summary}${extra}${row.memberName ? ` • ${row.memberName}` : ""}`,
        amount: row.total,
        isMock: false,
        createdAt: row.createdAt,
        invoice: {
          invoiceNo: row.invoiceNo,
          paymentMethod: row.paymentMethod,
          subtotal: row.subtotal,
          items: row.items,
        },
      };
    });
    const mocks: UnifiedEntry[] = [
      ...MOCK_CASH_ENTRIES.map((e) => ({
        key: `mock-${e.id}`,
        kind: e.type,
        category: e.category,
        title: e.category,
        note: e.note || "Tanpa catatan",
        amount: e.amount,
        isMock: true,
        createdAt: e.createdAt,
      })),
      ...MOCK_EXPENSE_ENTRIES.map((e) => ({
        key: `mock-${e.id}`,
        kind: e.type,
        category: e.category,
        title: e.category,
        note: e.note || "Tanpa catatan",
        amount: e.amount,
        isMock: true,
        createdAt: e.createdAt,
      })),
    ];
    return [...sales, ...mocks].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [rows]);

  const visible = useMemo(() => {
    const daysAgo = phase === "7hari" ? 7 : phase === "30hari" ? 30 : null;
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (daysAgo !== null) {
        const cutoff = Date.now() - daysAgo * 86_400_000;
        if (new Date(entry.createdAt).getTime() < cutoff) return false;
      }
      if (category !== "semua" && entry.category !== category) return false;
      if (q && !entry.title.toLowerCase().includes(q) && !entry.note.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [entries, phase, category, query]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted/30" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-2">
            {PHASES.map((p) => (
              <button
                key={p.value}
                type="button"
                aria-pressed={phase === p.value}
                onClick={() => setPhase(p.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  phase === p.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary hover:bg-primary/15"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="relative block">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="appearance-none rounded-lg border border-border bg-background py-1.5 pl-3 pr-8 text-xs font-medium text-foreground outline-none transition-colors focus:border-primary"
            >
              <option value="semua">Semua Kategori</option>
              {ALL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <svg
              width={14}
              height={14}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </label>
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
            placeholder="Cari no. nota, kategori, atau catatan…"
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </label>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-lg bg-muted/20 py-10 text-center">
          <p className="text-sm text-muted-foreground">Belum ada catatan yang cocok</p>
        </div>
      ) : (
        <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {visible.map((entry) => {
            const isExpanded = expandedKey === entry.key;
            const isIncome = entry.kind !== "pengeluaran";
            const colorClass = isIncome ? "text-success" : "text-error";
            const badgeClass = isIncome ? "bg-success/10 text-success" : "bg-error/10 text-error";
            return (
              <div key={entry.key} className="bg-card transition-colors hover:bg-muted/20">
                <button
                  type="button"
                  disabled={entry.kind !== "penjualan"}
                  onClick={() => setExpandedKey(isExpanded ? null : entry.key)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${badgeClass}`}>
                        {entry.category}
                      </span>
                      {entry.kind === "penjualan" && entry.invoice ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                            METHOD_META[entry.invoice.paymentMethod]?.className ?? METHOD_META.tunai.className
                          }`}
                        >
                          {METHOD_META[entry.invoice.paymentMethod]?.icon}
                          {METHOD_META[entry.invoice.paymentMethod]?.label ?? "Tunai"}
                        </span>
                      ) : null}
                      {entry.isMock ? (
                        <span className="rounded-md bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold text-secondary">
                          contoh
                        </span>
                      ) : null}
                      <span className="font-mono text-sm font-semibold text-foreground">
                        {entry.title}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.note}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatDate(entry.createdAt)} • {formatTime(entry.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-bold ${colorClass}`}>
                      {isIncome ? "+" : "-"}
                      {rupiah.format(entry.amount)}
                    </p>
                  </div>
                  {entry.kind === "penjualan" ? (
                    <ChevronRightIcon
                      width={16}
                      height={16}
                      className={`shrink-0 text-muted-foreground transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  ) : null}
                </button>
                {isExpanded && entry.invoice ? (
                  <div className="border-t border-border bg-background/50 px-4 py-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-muted-foreground">
                          <th className="pb-1 pr-3 font-medium">Produk</th>
                          <th className="pb-1 pr-3 text-right font-medium">Qty</th>
                          <th className="pb-1 pr-3 text-right font-medium">Harga</th>
                          <th className="pb-1 text-right font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.invoice.items.map((item, idx) => (
                          <tr key={idx} className="text-foreground">
                            <td className="py-1 pr-3">{item.name}</td>
                            <td className="py-1 pr-3 text-right">{item.qty.toLocaleString("id-ID")}</td>
                            <td className="py-1 pr-3 text-right">{rupiah.format(item.price)}</td>
                            <td className="py-1 text-right">{rupiah.format(item.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Subtotal {rupiah.format(entry.invoice.subtotal)}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}