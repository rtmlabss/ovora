"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { StockInForm } from "@/components/stok/stock-in-form";
import { StockOutForm } from "@/components/stok/stock-out-form";
import { StockMovementsLog } from "@/components/stok/stock-movements-log";
import { rupiah, type Product } from "@/lib/pos";

type StockLevel = "cukup" | "menipis" | "habis";

function stockLevel(product: Product, minStock: number): StockLevel {
  if (product.stockQty <= 0) return "habis";
  if (product.stockQty <= minStock) return "menipis";
  return "cukup";
}

const LEVEL_META: Record<StockLevel, { label: string; className: string }> = {
  cukup: { label: "Cukup", className: "bg-success/10 text-success" },
  menipis: { label: "Menipis", className: "bg-warning/10 text-warning" },
  habis: { label: "Habis", className: "bg-error/10 text-error" },
};

export function StockBoard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [thresholds, setThresholds] = useState<Record<number, number>>({});

  function loadProducts() {
    fetch("/api/products?branchId=1")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat stok produk");
        return res.json();
      })
      .then((json) => {
        const list: Product[] = json.products ?? [];
        setProducts(list);
        setThresholds((prev) => {
          const next = { ...prev };
          for (const p of list) {
            if (!(p.id in next)) next[p.id] = p.minStock;
          }
          return next;
        });
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function updateThreshold(productId: number, raw: string) {
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) return;
    setThresholds((prev) => ({ ...prev, [productId]: value }));
  }

  const levelCounts = useMemo(() => {
    const counts: Record<StockLevel, number> = { cukup: 0, menipis: 0, habis: 0 };
    for (const product of products) {
      counts[stockLevel(product, thresholds[product.id] ?? product.minStock)] += 1;
    }
    return counts;
  }, [products, thresholds]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => !q || p.name.toLowerCase().includes(q));
  }, [products, query]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Produk</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{products.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Stok Menipis</p>
          <p className="mt-1 text-2xl font-bold text-warning">{levelCounts.menipis}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Stok Habis</p>
          <p className="mt-1 text-2xl font-bold text-error">{levelCounts.habis}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-label="Daftar stok produk"
          className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Daftar Stok Produk</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Ubah batas minimum untuk mengatur label stok menipis.
              </p>
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
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
          ) : products.length === 0 ? (
            <div className="rounded-lg bg-muted/20 py-10 text-center">
              <p className="text-sm text-muted-foreground">Belum ada produk tercatat</p>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Produk</th>
                  <th className="py-2 pr-3 text-right font-medium">Harga</th>
                  <th className="py-2 pr-3 text-right font-medium">Stok</th>
                  <th className="py-2 pr-3 text-right font-medium">Min</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => {
                  const minStock = thresholds[product.id] ?? product.minStock;
                  const level = stockLevel(product, minStock);
                  const meta = LEVEL_META[level];
                  return (
                    <tr key={product.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">per {product.unit}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-right text-foreground">
                        {rupiah.format(product.price)}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-semibold text-foreground">
                        {product.stockQty.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={minStock}
                          onChange={(e) => updateThreshold(product.id, e.target.value)}
                          title={`Batas minimum ${product.name}`}
                          className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-right text-sm text-foreground outline-none transition-colors focus:border-primary"
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}
        </section>

        <div className="space-y-6">
          <StockInForm products={products} onChange={loadProducts} />
          <StockOutForm products={products} onChange={loadProducts} />
        </div>
      </div>

      <StockMovementsLog />
    </div>
  );
}