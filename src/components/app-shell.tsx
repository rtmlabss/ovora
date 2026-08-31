"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BoxIcon,
  BuildingIcon,
  CartIcon,
  EggIcon,
  LayoutIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
  TrophyIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
} from "@/components/icons";

const NAV_SECTIONS = [
  {
    title: "Menu Utama",
    items: [
      { href: "/dashboard", label: "Dashboard Keuangan", icon: LayoutIcon, roles: ["Pemilik", "Manager", "Kasir"] },
      { href: "/kasir", label: "Kasir Penjualan", icon: CartIcon, roles: ["Pemilik", "Manager", "Kasir"] },
    ],
  },
  {
    title: "Manajemen",
    items: [
      { href: "/stok", label: "Manajemen Stok", icon: BoxIcon, roles: ["Pemilik", "Manager", "Kasir"] },
      { href: "/keuangan", label: "Pencatatan Keuangan", icon: WalletIcon, roles: ["Pemilik", "Manager"] },
      { href: "/membership", label: "Membership & Poin", icon: UsersIcon, roles: ["Pemilik", "Manager"] },
    ],
  },
  {
    title: "Evaluasi",
    items: [
      { href: "/leaderboard", label: "Leaderboard Reward", icon: TrophyIcon, roles: ["Pemilik", "Manager"] },
      { href: "/cabang", label: "Monitoring Cabang", icon: BuildingIcon, roles: ["Pemilik", "Manager"] },
    ],
  },
  {
    title: "Pengaturan",
    items: [
      { href: "/pengaturan", label: "Pengaturan & Akun", icon: SettingsIcon, roles: ["Pemilik"] },
    ],
  },
];

const MOCK_ROLE_OPTIONS = ["Pemilik", "Manager", "Kasir"] as const;
export type MockRole = (typeof MOCK_ROLE_OPTIONS)[number];

function useToday() {
  const [today, setToday] = useState("");
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);
  return today;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const today = useToday();
  const [role, setRole] = useState<MockRole>("Pemilik");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = NAV_SECTIONS.filter((section) =>
    section.items.some((item) => item.roles.includes(role))
  ).map((section) => ({
    ...section,
    items: section.items.filter((item) => item.roles.includes(role)),
  }));

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  function handleLogout() {
    fetch("/api/auth/logout", { method: "POST" })
      .catch(() => {})
      .finally(() => {
        router.push("/login");
        router.refresh();
      });
  }

  function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex h-16 shrink-0 items-center justify-between gap-2.5 border-b border-border px-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <EggIcon width={20} height={20} />
            </span>
            <div>
              <p className="text-base font-bold leading-tight">ovora.id</p>
              <p className="text-xs text-muted-foreground">Manajemen Toko Telur</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Icon width={16} height={16} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              PM
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-medium text-foreground">
                {role === "Kasir" ? "Andi Kasir" : role === "Manager" ? "Nina Manager" : "Pemilik Toko"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {role === "Kasir" ? "andi@ovora.id" : role === "Manager" ? "nina@ovora.id" : "pemilik@ovora.id"}
              </p>
            </div>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Simulasi Peran
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as MockRole)}
              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none focus:border-primary"
            >
              {MOCK_ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-xl transition-transform duration-200 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <SidebarContent onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Buka menu"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg border border-border p-2 text-foreground hover:bg-muted md:hidden"
            >
              <MenuIcon width={18} height={18} />
            </button>
            <button
              type="button"
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground"
            >
              Cabang Utama
            </button>
            <span className="hidden text-xs text-muted-foreground sm:inline">{today}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOutIcon width={16} height={16} />
            <span className="hidden sm:inline">Keluar</span>
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
