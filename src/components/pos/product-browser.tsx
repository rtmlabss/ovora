"use client";

import { useMemo, useState } from "react";
import { PRODUCT_STUB, rupiah, type Product } from "@/lib/pos";
import { CartIcon, SearchIcon } from "@/components/icons";

export function ProductBrowser({
  products = PRODUCT_STUB,
  onSelect,
}: {
  products?: Product[];
  onSelect?: (product: Product) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <section aria-label="Daftar produk telur" className="space-y-4">
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <SearchIcon width={16} height={16} />
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari produk telur…"
          aria-label="Cari produk telur"
          className="w-full rounded-lg border border-input bg-card py-2.5 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {filtered.length} dari {products.length} produk
      </p>

      {filtered.length === 0 ? (
        <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card text-center">
          <span className="rounded-lg bg-muted p-3 text-muted-foreground">
            <SearchIcon width={20} height={20} />
          </span>
          <p className="text-sm text-muted-foreground">
            Tidak ada produk cocok dengan &quot;{query}&quot;
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {filtered.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect?.(product)}
              className="group rounded-xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <CartIcon width={18} height={18} />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {product.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Stok: {product.stockQty} {product.unit}
              </p>
              <p className="mt-2 text-sm font-bold text-primary">
                {rupiah.format(product.price)}
                <span className="ml-1 text-xs font-medium text-muted-foreground">
                  / {product.unit}
                </span>
              </p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}