import AppShell from "@/components/app-shell";
import { CashEntryForms } from "@/components/keuangan/cash-entry-forms";
import { FinancialSummary } from "@/components/keuangan/financial-summary";
import { TransactionHistory } from "@/components/keuangan/transaction-history";

export default function KeuanganPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Pencatatan Keuangan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mencatat semua uang masuk dan keluar toko
          </p>
        </header>

        <CashEntryForms />

        <div className="mt-6">
          <FinancialSummary />
        </div>

        <section aria-label="Riwayat transaksi" className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Riwayat Transaksi</h2>
          </div>
          <TransactionHistory />
        </section>
      </div>
    </AppShell>
  );
}