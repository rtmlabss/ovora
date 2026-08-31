"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangleIcon, BoxIcon, CheckCircleIcon } from "@/components/icons";

interface ApiBranch {
  id: number;
  name: string;
}

interface ApiStock {
  productId: number;
  productName: string;
  unit: string;
  stockQty: number;
  minStock: number;
}

type StockMap = Record<number, ApiStock>;

export function BranchStockGrid() {
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [perBranch, setPerBranch] = useState<Record<number, StockMap>>({});
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
        const branchList: ApiBranch[] = (json.branches ?? []).map((b: { id: number; name: string }) => ({
          id: b.id,
          name: b.name,
        }));
        setBranches(branchList);
        const map: Record<number, StockMap> = {};
        await Promise.all(
          branchList.map(async (b) => {
            const r = await fetch(`/api/branches/${b.id}/stock`).then((res) =>
              res.ok ? res.json() : { stocks: [] }
            );
            const stocks: ApiStock[] = r.stocks ?? [];
            const byProduct: StockMap = {};
            for (const s of stocks) byProduct[s.productId] = s;
            map[b.id] = byProduct;
          })
        );
        setPerBranch(map);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const productIds = Array.from(
    new Set(Object.values(perBranch).flatMap((m) => Object.values(m).map((s) => s.productId)))
  );

  function sampleFor(productId: number) {
    for (const branchId of Object.keys(perBranch)) {
      const s = perBranch[Number(branchId)][productId];
      if (s) return s;
    }
    return undefined;
  }

  return (
    <section
      aria-label="Stok per produk tiap cabang"
      className="rounded-xl border border-border bg-card p-4 shadow-sm"
    >
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <BoxIcon width={18} height={18} className="text-primary" />
        Stok per Produk tiap Cabang
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pantau ketersediaan setiap produk di semua cabang.
      </p>

      {loading ? (
        <div className="mt-3 space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Produk</th>
                {branches.map((b) => (
                  <th key={b.id} className="py-2 pr-3 text-center font-medium">
                    {b.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {productIds.map((productId) => {
                const sample = sampleFor(productId);
                if (!sample) return null;
                return (
                  <tr key={productId} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3">
                      <p className="font-medium text-foreground">{sample.productName}</p>
                    </td>
                    {branches.map((b) => {
                      const row = perBranch[b.id]?.[productId];
                      const qty = row?.stockQty ?? 0;
                      const low = row ? qty <= row.minStock : false;
                      const out = row ? qty <= 0 : false;
                      return (
                        <td key={b.id} className="py-2.5 pr-3 text-center">
                          {out ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-error/10 px-1.5 py-0.5 text-[11px] font-semibold text-error">
                              <AlertTriangleIcon width={12} height={12} />
                              Habis
                            </span>
                          ) : low ? (
                            <span className="inline-flex items-center gap-1 rounded-md bg-error/10 px-1.5 py-0.5 text-[11px] font-semibold text-error">
                              <AlertTriangleIcon width={12} height={12} />
                              Menipis {qty} {sample.unit}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-1.5 py-0.5 text-[11px] font-semibold text-success">
                              <CheckCircleIcon width={12} height={12} />
                              {qty} {sample.unit}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {productIds.length === 0 && (
            <p className="mt-4 rounded-lg bg-muted/20 py-6 text-center text-sm text-muted-foreground">
              Belum ada data stok
            </p>
          )}
        </div>
      )}
    </section>
  );
}
