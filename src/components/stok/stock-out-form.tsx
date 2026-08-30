"use client";

import { useMemo, useState } from "react";
import { CheckIcon, TrendingDownIcon } from "@/components/icons";
import { MOCK_STOCK_OUT, type StockMovement } from "@/lib/stok";
import { PRODUCT_STUB } from "@/lib/pos";

export function StockOutForm() {
  const [productId, setProductId] = useState<number | "">("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<StockMovement[]>(MOCK_STOCK_OUT);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const totalQty = useMemo(
    () => entries.reduce((sum, entry) => sum + entry.qty, 0),
    [entries]
  );

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const product = PRODUCT_STUB.find((p) => p.id === productId);
    const parsedQty = Number(qty);
    if (!product) {
      setError("Pilih produk terlebih dahulu");
      return;
    }
    if (!(parsedQty > 0)) {
      setError("Jumlah stok keluar harus lebih dari 0");
      return;
    }
    if (parsedQty > product.stockQty) {
      setError(`Stok ${product.name} hanya ${product.stockQty} ${product.unit}`);
      return;
    }
    const nextId = Math.max(0, ...entries.map((e) => e.id)) + 1;
    setEntries((prev) => [
      {
        id: nextId,
        productId: product.id,
        productName: product.name,
        type: "keluar",
        qty: parsedQty,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setProductId("");
    setQty("");
    setNote("");
    setError(null);
    setMsg(`${parsedQty} ${product.unit} "${product.name}" dicatat keluar (contoh)`);
    window.setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <TrendingDownIcon width={18} height={18} className="text-error" />
        Catat Stok Keluar
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Mencatat barang yang keluar atau berkurang dari gudang.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Produk</label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : "")}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary"
          >
            <option value="">-- Pilih Produk --</option>
            {PRODUCT_STUB.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Jumlah Keluar</label>
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Contoh: 10"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Catatan / Alasan</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Stok rusak, pindah ke cabang"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        {error ? (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">{error}</p>
        ) : null}
        {msg ? (
          <p className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
            <CheckIcon width={14} height={14} />
            {msg}
          </p>
        ) : null}
        <button
          type="submit"
          className="w-full rounded-lg bg-error px-3 py-2 text-sm font-medium text-error-foreground transition-colors hover:bg-error/90"
        >
          Simpan Stok Keluar
        </button>
      </form>

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Riwayat Stok Keluar
          </p>
          <p className="text-xs font-semibold text-error">
            {totalQty.toLocaleString("id-ID")} unit
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Belum ada stok keluar tercatat</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {entries.slice(0, 6).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{entry.productName}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.note || "Tanpa catatan"}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-error">
                  -{entry.qty.toLocaleString("id-ID")}
                </p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">
          Tampilan memakai data tiruan sampai API stok selesai.
        </p>
      </div>
    </div>
  );
}