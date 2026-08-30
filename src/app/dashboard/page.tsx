import AppShell from "@/components/app-shell";
import { DashboardReport } from "@/components/dashboard-report";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            Dashboard Keuangan
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ringkasan kondisi toko ovora.id sekilas
          </p>
        </header>

        <DashboardReport />
      </div>
    </AppShell>
  );
}