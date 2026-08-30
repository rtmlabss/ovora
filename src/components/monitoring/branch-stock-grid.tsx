"use client";

import { AlertTriangleIcon, BoxIcon, CheckCircleIcon } from "@/components/icons";
import { MOCK_BRANCH_STOCK } from "@/lib/monitoring";

export function BranchStockGrid() {
  const productIds = Array.from(new Set(MOCK_BRANCH_STOCK.map((r) => r.productId)));
  const branchIds = Array.from(new Set(MOCK_BRANCH_STOCK.map((r) => r.branchId)));

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

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Produk</th>
              {branchIds.map((id) => {
                const branch = MOCK_BRANCH_STOCK.find((r) => r.branchId === id);
                return (
                  <th key={id} className="py-2 pr-3 text-center font-medium">
                    {branch?.branchName}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {productIds.map((productId) => {
              const sample = MOCK_BRANCH_STOCK.find((r) => r.productId === productId)!;
              return (
                <tr key={productId} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-foreground">{sample.productName}</p>
                  </td>
                  {branchIds.map((id) => {
                    const row = MOCK_BRANCH_STOCK.find(
                      (r) => r.productId === productId && r.branchId === id
                    );
                    const qty = row?.stockQty ?? 0;
                    const low = row ? qty <= row.minStock : false;
                    const out = row ? qty <= 0 : false;
                    return (
                      <td key={id} className="py-2.5 pr-3 text-center">
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
      </div>
    </section>
  );
}