"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import {
  BuildingIcon,
  CheckIcon,
  ChevronRightIcon,
  MapPinIcon,
  SettingsIcon,
} from "@/components/icons";
import type { StoreProfile } from "@/lib/settings";

interface BranchRow {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  status: "aktif" | "libur";
}

const EMPTY_PROFILE: StoreProfile = {
  name: "",
  tagline: "",
  phone: "",
  address: "",
  city: "",
  currency: "IDR",
  description: "",
};

export default function ProfilTokoPage() {
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [branches, setBranches] = useState<BranchRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch("/api/store-profile").then((r) => r.json()),
      fetch("/api/branches").then((r) => r.json()),
    ])
      .then(([pd, bd]) => {
        if (cancelled) return;
        setProfile(pd?.profile ? { ...EMPTY_PROFILE, ...pd.profile } : EMPTY_PROFILE);
        if (Array.isArray(bd?.branches)) setBranches(bd.branches);
        else setBranches([]);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Tidak dapat terhubung ke server.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function update(key: keyof StoreProfile, value: string) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaved(false);
    setSaveError(null);
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaveError(null);
    try {
      const res = await fetch("/api/store-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const d = await res.json();
      if (!res.ok) {
        setSaveError(d?.error ?? "Gagal menyimpan profil toko.");
        return;
      }
      if (d?.profile) setProfile({ ...EMPTY_PROFILE, ...d.profile });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setSaveError("Tidak dapat terhubung ke server.");
    }
  }

  const fields: { key: keyof StoreProfile; label: string; cols2?: boolean }[] = [
    { key: "name", label: "Nama Toko" },
    { key: "tagline", label: "Tagline" },
    { key: "phone", label: "Telepon" },
    { key: "currency", label: "Mata Uang" },
    { key: "address", label: "Alamat" },
    { key: "city", label: "Kota" },
    { key: "description", label: "Deskripsi", cols2: true },
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
              {profile === null ? (
                <div className="space-y-3">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {fields.map((f) => (
                    <div key={f.key} className={f.cols2 ? "sm:col-span-2" : ""}>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        {f.label}
                      </label>
                      <input
                        type="text"
                        value={profile[f.key as keyof typeof EMPTY_PROFILE] ?? ""}
                        onChange={(e) => update(f.key, e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={profile === null}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <CheckIcon width={14} height={14} /> Simpan Perubahan
                </button>
                {saved ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-success">
                    <CheckIcon width={14} height={14} /> Tersimpan
                  </span>
                ) : null}
              </div>
              {saveError ? (
                <p className="rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
                  {saveError}
                </p>
              ) : null}
            </form>

            {loadError ? (
              <p className="mt-4 text-[11px] text-error">{loadError}</p>
            ) : (
              <p className="mt-4 text-[11px] text-muted-foreground">
                Profil toko dimuat & disimpan ke database.
              </p>
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
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
              <Link
                href="/cabang"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <ChevronRightIcon width={14} height={14} />
                Kelola Cabang
              </Link>
            </div>

            <div className="space-y-3">
              {branches === null ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                  ))}
                </div>
              ) : branches.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Belum ada cabang.
                </p>
              ) : (
                branches.map((b) => (
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
                      {b.address ? `${b.address}, ${b.city ?? ""}` : "—"}
                    </p>
                  </div>
                ))
              )}
            </div>

            <p className="mt-4 text-[11px] text-muted-foreground">
              Daftar cabang dimuat dari database. Klik "Kelola Cabang" untuk menambah, mengedit, atau menghapus cabang.
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
