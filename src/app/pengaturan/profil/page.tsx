"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/app-shell";
import {
  BuildingIcon,
  CheckIcon,
  ChevronRightIcon,
  MapPinIcon,
  SettingsIcon,
} from "@/components/icons";
import { MOCK_BRANCH_SETTINGS, MOCK_STORE_PROFILE } from "@/lib/settings";

export default function ProfilTokoPage() {
  const [profile, setProfile] = useState(MOCK_STORE_PROFILE);
  const [saved, setSaved] = useState(false);

  function update(key: keyof typeof MOCK_STORE_PROFILE, value: string) {
    setProfile((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const fields: { key: keyof typeof MOCK_STORE_PROFILE; label: string }[] = [
    { key: "name", label: "Nama Toko" },
    { key: "owner", label: "Pemilik" },
    { key: "phone", label: "Telepon" },
    { key: "email", label: "Email" },
    { key: "whatsapp", label: "WhatsApp" },
    { key: "address", label: "Alamat" },
    { key: "city", label: "Kota" },
    { key: "currency", label: "Mata Uang" },
  ];

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profil Toko & Cabang</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Kelola informasi toko dan daftar cabang
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <SettingsIcon width={18} height={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Profil Toko</h2>
                <p className="text-xs text-muted-foreground">
                  Informasi dasar toko & kontak
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.slice(0, 6).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={profile[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {fields.slice(6).map((f) => (
                  <div key={f.key}>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={profile[f.key]}
                      onChange={(e) => update(f.key, e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <CheckIcon width={14} height={14} /> Simpan Perubahan
                </button>
                {saved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <CheckIcon width={14} height={14} /> Tersimpan
                  </span>
                ) : null}
              </div>
            </form>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Data tiruan untuk profil toko sampai API pengaturan tersedia.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BuildingIcon width={18} height={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">Cabang Toko</h2>
                <p className="text-xs text-muted-foreground">
                  Daftar cabang & status
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {MOCK_BRANCH_SETTINGS.map((b) => (
                <div
                  key={b.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{b.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        b.status === "aktif"
                          ? "bg-success/15 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPinIcon width={11} height={11} />
                    {b.address}, {b.city}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Data tiruan untuk daftar cabang sampai API pengaturan tersedia.
            </p>
          </section>
        </div>

        <div className="mt-4">
          <Link
            href="/pengaturan"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            <ChevronRightIcon width={14} height={14} className="rotate-180" />
            Kembali ke Pengaturan & Akun
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
