"use client";

import { useEffect, useState } from "react";
import { BuildingIcon, CheckIcon, MailIcon, MapPinIcon, SettingsIcon, UserPlusIcon, WhatsAppIcon } from "@/components/icons";
import { MOCK_ACCOUNTS, MOCK_BRANCH_SETTINGS, MOCK_PREFERENCES, MOCK_STORE_PROFILE } from "@/lib/settings";
import type { StoreProfile } from "@/lib/settings";

function Card({
  title,
  desc,
  icon,
  children,
}: {
  title: string;
  desc: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
        {value}
      </div>
    </div>
  );
}

export function ProfileSettings() {
  const [profile, setProfile] = useState<StoreProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/store-profile")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.profile) setProfile(d.profile);
        else setError("Gagal memuat profil toko.");
      })
      .catch(() => {
        if (!cancelled) setError("Tidak dapat terhubung ke server.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const p = profile ?? MOCK_STORE_PROFILE;
  return (
    <Card
      title="Profil Toko"
      desc="Informasi dasar toko & kontak"
      icon={<SettingsIcon width={18} height={18} />}
    >
      {profile === null && !error ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-9 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nama Toko" value={p.name} />
          <Field label="Tagline" value={p.tagline} />
          <Field label="Telepon" value={p.phone} />
          <Field label="Mata Uang" value={p.currency} />
        </div>
      )}
      <div className="mt-4">
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Alamat</label>
        <div className="flex items-start gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
          <MapPinIcon width={14} height={14} className="mt-0.5 shrink-0 text-muted-foreground" />
          {profile ? `${p.address}, ${p.city}` : "—"}
        </div>
      </div>
      {error ? <p className="mt-4 text-[11px] text-error">{error}</p> : null}
      <p className="mt-4 text-[11px] text-muted-foreground">
        Profil toko dimuat dari database.
      </p>
    </Card>
  );
}

interface ApiBranch {
  id: number;
  name: string;
  address: string | null;
  city: string | null;
  status: "aktif" | "libur";
}

export function BranchSettings() {
  const [branches, setBranches] = useState<ApiBranch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d?.branches)) setBranches(d.branches);
        else setError("Gagal memuat cabang.");
      })
      .catch(() => {
        if (!cancelled) setError("Tidak dapat terhubung ke server.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = branches ?? MOCK_BRANCH_SETTINGS;
  return (
    <Card
      title="Cabang Toko"
      desc="Daftar cabang & status"
      icon={<BuildingIcon width={18} height={18} />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Nama Cabang</th>
              <th className="py-2 pr-3 font-medium">Alamat</th>
              <th className="py-2 pr-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-foreground">{b.name}</td>
                <td className="py-2.5 pr-3 text-sm text-muted-foreground">
                  {b.address ? `${b.address}, ${b.city ?? ""}` : "—"}
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      b.status === "aktif"
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-3 text-[11px] text-error">{error}</p> : null}
    </Card>
  );
}

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: "Pemilik" | "Manager" | "Kasir";
  branch: string | null;
  status: "aktif" | "nonaktif";
}

export function AccountSettings() {
  const [users, setUsers] = useState<ApiUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (Array.isArray(d?.users)) setUsers(d.users);
        else setError("Gagal memuat pengguna.");
      })
      .catch(() => {
        if (!cancelled) setError("Tidak dapat terhubung ke server.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = users ?? MOCK_ACCOUNTS;
  return (
    <Card
      title="Akun Pengguna"
      desc="Pengelolaan akses kasir & manager"
      icon={<UserPlusIcon width={18} height={18} />}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Nama</th>
              <th className="py-2 pr-3 font-medium">Email</th>
              <th className="py-2 pr-3 font-medium">Peran</th>
              <th className="py-2 pr-3 font-medium">Cabang</th>
              <th className="py-2 pr-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id} className="border-b border-border/60 last:border-0">
                <td className="py-2.5 pr-3 font-medium text-foreground">{u.name}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{u.email}</td>
                <td className="py-2.5 pr-3 text-foreground">{u.role}</td>
                <td className="py-2.5 pr-3 text-muted-foreground">{u.branch ?? "—"}</td>
                <td className="py-2.5 text-center">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      u.status === "aktif"
                        ? "bg-success/15 text-success"
                        : "bg-error/15 text-error"
                    }`}
                  >
                    {u.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? <p className="mt-3 text-[11px] text-error">{error}</p> : null}
    </Card>
  );
}

export function NotificationPreferences() {
  const prefs = MOCK_PREFERENCES;
  const toggles: { key: keyof typeof MOCK_PREFERENCES; label: string; icon: React.ReactNode }[] = [
    { key: "notificationEmail", label: "Notifikasi lewat Email", icon: <MailIcon width={14} height={14} /> },
    { key: "notificationWhatsapp", label: "Notifikasi lewat WhatsApp", icon: <WhatsAppIcon width={14} height={14} /> },
    { key: "lowStockAlert", label: "Peringatan stok menipis", icon: <CheckIcon width={14} height={14} /> },
    { key: "receiptFooter", label: "Footer pada struk kasir", icon: <CheckIcon width={14} height={14} /> },
  ];
  return (
    <Card
      title="Preferensi & Notifikasi"
      desc="Atur notifikasi & preferensi aplikasi"
      icon={<SettingsIcon width={18} height={18} />}
    >
      <div className="space-y-3">
        {toggles.map((t) => (
          <div key={t.key} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm text-foreground">
              <span className="text-muted-foreground">{t.icon}</span>
              {t.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {prefs[t.key] ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        ))}
        <div className="border-t border-border pt-3">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Bahasa</label>
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
            {prefs.language}
          </div>
        </div>
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">
        Preferensi aplikasi belum memiliki penyimpanan di database.
      </p>
    </Card>
  );
}
