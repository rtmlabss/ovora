import AppShell from "@/components/app-shell";
import { BranchBoard } from "@/components/monitoring/branch-board";
import { BranchStockGrid } from "@/components/monitoring/branch-stock-grid";
import { SalesComparison } from "@/components/monitoring/sales-comparison";

export default function CabangPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Monitoring Cabang</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pantau kinerja semua cabang dalam satu tampilan
          </p>
        </header>

        <BranchBoard />

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <BranchStockGrid />
          <SalesComparison />
        </div>
      </div>
    </AppShell>
  );
}