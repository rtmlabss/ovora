import AppShell from "@/components/app-shell";
import Link from "next/link";
import { BuildingIcon, ChevronRightIcon, SettingsIcon, UsersIcon } from "@/components/icons";
import {
  AccountSettings,
  NotificationPreferences,
} from "@/components/settings/settings-panels";

export default function PengaturanPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pengaturan & Akun</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola profil toko, cabang, akun pengguna, dan preferensi aplikasi
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pengaturan/profil"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <BuildingIcon width={15} height={15} />
              Profil & Cabang
              <ChevronRightIcon width={14} height={14} />
            </Link>
            <Link
              href="/pengaturan/users"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <UsersIcon width={15} height={15} />
              Daftar Pengguna
              <ChevronRightIcon width={14} height={14} />
            </Link>
            <Link
              href="/pengaturan/roles"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <SettingsIcon width={15} height={15} />
              Hak Akses
              <ChevronRightIcon width={14} height={14} />
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AccountSettings />
          <NotificationPreferences />
        </div>
      </div>
    </AppShell>
  );
}
