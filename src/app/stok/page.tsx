import AppShell from "@/components/app-shell";
import { StockBoard } from "@/components/stok/stock-board";

export default function StokPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Manajemen Stok</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau ketersediaan barang serta catat stok masuk dan keluar
          </p>
        </header>

        <StockBoard />
      </div>
    </AppShell>
  );
}