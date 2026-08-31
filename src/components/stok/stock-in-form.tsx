"use client";

import { useState } from "react";
import { CheckIcon, TrendingUpIcon } from "@/components/icons";
import type { Product } from "@/lib/pos";

export function StockInForm({
  products,
  onChange,
}: {
  products: Product[];
  onChange?: () => void;
}) {
  const [productId, setProductId] = useState<number | "">("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const product = products.find((p) => p.id === productId);
    const parsedQty = Number(qty);
    if (!product) {
      setError("Pilih produk terlebih dahulu");
      return;
    }
    if (!(parsedQty > 0)) {
      setError("Jumlah stok masuk harus lebih dari 0");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/stock/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type: "masuk",
          qty: parsedQty,
          note: note.trim(),
          branchId: 1,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Gagal mencatat stok masuk");
      }
      setProductId("");
      setQty("");
      setNote("");
      setMsg(`${parsedQty} ${product.unit} "${product.name}" dicatat masuk`);
      onChange?.();
      window.setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
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
            {products.map((product) => (
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
          disabled={saving}
          className="w-full rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-40"
        >
          {saving ? "Menyimpan…" : "Simpan Stok Masuk"}
        </button>
      </form>
    </div>
  );
}
