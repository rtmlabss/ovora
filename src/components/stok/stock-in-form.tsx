"use client";

import { useMemo, useState } from "react";
import { CheckIcon, TrendingUpIcon } from "@/components/icons";
import { MOCK_STOCK_IN, type StockMovement } from "@/lib/stok";
import { PRODUCT_STUB } from "@/lib/pos";

export function StockInForm() {
  const [productId, setProductId] = useState<number | "">("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [entries, setEntries] = useState<StockMovement[]>(MOCK_STOCK_IN);
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
      setError("Jumlah stok masuk harus lebih dari 0");
      return;
    }
    const nextId = Math.max(0, ...entries.map((e) => e.id)) + 1;
    setEntries((prev) => [
      {
        id: nextId,
        productId: product.id,
        productName: product.name,
        type: "masuk",
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
    setMsg(`${parsedQty} ${product.unit} "${product.name}" dicatat masuk (contoh)`);
    window.setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <TrendingUpIcon width={18} height={18} className="text-success" />
        Catat Stok Masuk
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Mencatat barang yang masuk ke gudang.
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
          <label className="mb-1 block text-sm text-muted-foreground">Jumlah Masuk</label>
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="Contoh: 50"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Catatan / Asal</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: Restock dari peternak"
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
          className="w-full rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
        >
          Simpan Stok Masuk
        </button>
      </form>

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Riwayat Stok Masuk
          </p>
          <p className="text-xs font-semibold text-success">
            {totalQty.toLocaleString("id-ID")} unit
          </p>
        </div>
        {entries.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Belum ada stok masuk tercatat</p>
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
                <p className="shrink-0 text-sm font-bold text-success">
                  +{entry.qty.toLocaleString("id-ID")}
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