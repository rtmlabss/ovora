"use client";

import { useMemo, useState } from "react";
import { CategorySelect } from "@/components/keuangan/category-select";
import { CheckIcon, TrendingUpIcon } from "@/components/icons";
import { MOCK_CASH_ENTRIES, type CashEntry } from "@/lib/keuangan";
import { rupiah } from "@/lib/pos";

export function IncomeEntryForm() {
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<CashEntry[]>(MOCK_CASH_ENTRIES);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.amount, 0),
    [entries]
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedAmount = Number(amount);
    if (!category) {
      setError("Pilih kategori pemasukan terlebih dahulu");
      return;
    }
    if (!(parsedAmount > 0)) {
      setError("Jumlah pemasukan harus lebih dari 0");
      return;
    }
    const nextId = Math.max(0, ...entries.map((e) => e.id)) + 1;
    setEntries((prev) => [
      {
        id: nextId,
        type: "pemasukan",
        category,
        amount: parsedAmount,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setCategory("");
    setAmount("");
    setNote("");
    setError(null);
    setSaved(`Pemasukan ${rupiah.format(parsedAmount)} untuk "${category}" tercatat (contoh)`);
    window.setTimeout(() => setSaved(null), 4000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-foreground">
        <TrendingUpIcon width={18} height={18} className="text-success" />
        Catat Pemasukan
      </h3>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Kategori</label>
          <CategorySelect type="pemasukan" value={category} onChange={setCategory} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Jumlah</label>
          <input
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Contoh: 250000"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Catatan</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Penjualan pagi hari"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        {error ? (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">{error}</p>
        ) : null}
        {saved ? (
          <p className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
            <CheckIcon width={14} height={14} />
            {saved}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
        >
          Simpan Pemasukan
        </button>
      </form>

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pemasukan Tercatat
          </p>
          <p className="text-xs font-semibold text-success">{rupiah.format(total)}</p>
        </div>
        {entries.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Belum ada pemasukan tercatat</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {entries.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{entry.category}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.note || "Tanpa catatan"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-success">
                  +{rupiah.format(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tampilan memakai data tiruan sampai API pencatatan selesai.
        </p>
      </div>
    </div>
  );
}