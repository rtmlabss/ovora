import AppShell from "@/components/app-shell";
import { SalesWorkbench } from "@/components/pos/sales-workbench";
import { SearchIcon, UsersIcon } from "@/components/icons";

export default function KasirPage() {
  return (
    <AppShell>
      <main className="p-6">
        <div className="mx-auto max-w-7xl">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Kasir Penjualan
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Catat transaksi penjualan telur ke pelanggan
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <SearchIcon width={16} height={16} />
                Cari Produk
              </button>
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/90"
              >
                <UsersIcon width={16} height={16} />
                Daftar Member
              </button>
            </div>
          </header>

          <SalesWorkbench />
        </div>
      </main>
    </AppShell>
  );
}