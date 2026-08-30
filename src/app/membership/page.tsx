import AppShell from "@/components/app-shell";
import { MemberBoard } from "@/components/membership/member-board";
import { PointCalculator } from "@/components/membership/point-calculator";

export default function MembershipPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Membership &amp; Poin</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola daftar member dan saldo poin setiap pelanggan
          </p>
        </header>

        <div className="space-y-6">
          <MemberBoard />
          <PointCalculator />
        </div>
      </div>
    </AppShell>
  );
}