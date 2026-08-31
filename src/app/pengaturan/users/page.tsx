"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AppShell from "@/components/app-shell";
import {
  CheckIcon,
  ChevronRightIcon,
  MailIcon,
  SearchIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/icons";
import { UserForm, emptyUser, toFormValues, type ApiBranch, type UserFormValues } from "@/components/settings/user-form";
import type { AccountUser } from "@/lib/settings";

interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: "Pemilik" | "Manager" | "Kasir";
  branch: string | null;
  branchId: number | null;
  status: "aktif" | "nonaktif";
  createdAt: string;
}

const ROLE_FILTERS = ["Semua", "Pemilik", "Manager", "Kasir"] as const;
const ROLE_RANK: Record<string, number> = { Pemilik: 0, Manager: 1, Kasir: 2 };

function toAccountUser(u: ApiUser): AccountUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    branch: u.branch ?? "Semua Cabang",
    branchId: u.branchId,
    status: u.status,
    lastActive: u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID") : "—",
  };
}

export default function DaftarPenggunaPage() {
  const [accounts, setAccounts] = useState<AccountUser[]>([]);
  const [branches, setBranches] = useState<ApiBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>("Semua");
  const [statusFilter, setStatusFilter] = useState<"semua" | "aktif" | "nonaktif">("semua");
  const [formMode, setFormMode] = useState<"tambah" | "ubah" | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const loadUsers = useCallback(() => {
    setLoading(true);
    setLoadError(null);
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d?.users)) setAccounts(d.users.map(toAccountUser));
        else setLoadError("Gagal memuat pengguna.");
      })
      .catch(() => setLoadError("Tidak dapat terhubung ke server."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadUsers();
    let cancelled = false;
    fetch("/api/branches")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && Array.isArray(d?.branches)) setBranches(d.branches);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [loadUsers]);

  const filtered = accounts.filter((u) => {
    const q = query.trim().toLowerCase();
    if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) {
      return false;
    }
    if (roleFilter !== "Semua" && u.role !== roleFilter) return false;
    if (statusFilter !== "semua" && u.status !== statusFilter) return false;
    return true;
  }).sort((a, b) => (ROLE_RANK[a.role] ?? 9) - (ROLE_RANK[b.role] ?? 9));

  const activeCount = accounts.filter((u) => u.status === "aktif").length;

  function notify(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 2500);
  }

  function openAdd() {
    setEditingId(null);
    setFormMode("tambah");
  }

  function openEdit(user: AccountUser) {
    setEditingId(user.id);
    setFormMode("ubah");
  }

  async function handleSave(values: UserFormValues) {
    if (formMode === "tambah") {
      try {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            password: values.password,
            role: values.role,
            status: values.status,
            branchId: values.branchId,
          }),
        });
        const d = await res.json();
        if (!res.ok) {
          notify(d?.error ?? "Gagal menambahkan pengguna.");
          return;
        }
        if (d?.user) setAccounts((prev) => [...prev, toAccountUser(d.user)]);
        notify("Pengguna baru ditambahkan.");
      } catch {
        notify("Tidak dapat terhubung ke server.");
        return;
      }
    } else if (editingId !== null) {
      try {
        const res = await fetch(`/api/users/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: values.name,
            email: values.email,
            role: values.role,
            status: values.status,
            branchId: values.branchId,
            ...(values.password ? { password: values.password } : {}),
          }),
        });
        const d = await res.json();
        if (!res.ok) {
          notify(d?.error ?? "Gagal menyimpan perubahan.");
          return;
        }
        if (d?.user) {
          setAccounts((prev) =>
            prev.map((u) => (u.id === editingId ? toAccountUser(d.user) : u))
          );
        }
        notify("Perubahan pengguna disimpan.");
      } catch {
        notify("Tidak dapat terhubung ke server.");
        return;
      }
    }
    setFormMode(null);
    setEditingId(null);
  }

  async function handleDelete(id: number) {
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        notify("Gagal menghapus pengguna.");
        return;
      }
      setAccounts((prev) => prev.filter((u) => u.id !== id));
      notify("Pengguna dihapus.");
    } catch {
      notify("Tidak dapat terhubung ke server.");
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Daftar Pengguna</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Kelola seluruh akun pengguna di semua cabang
            </p>
          </div>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <UserPlusIcon width={15} height={15} /> Tambah Pengguna
          </button>
        </header>

        <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <UsersIcon width={15} height={15} /> Total Pengguna
            </p>
            <p className="mt-1 text-2xl font-bold text-foreground">{accounts.length}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckIcon width={15} height={15} /> Aktif
            </p>
            <p className="mt-1 text-2xl font-bold text-success">{activeCount}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <UsersIcon width={15} height={15} /> Nonaktif
            </p>
            <p className="mt-1 text-2xl font-bold text-muted-foreground">
              {accounts.length - activeCount}
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <SearchIcon
                width={16}
                height={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau email..."
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ROLE_FILTERS.map((r) => (
                <option key={r} value={r}>
                  Peran: {r}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="semua">Status: Semua</option>
              <option value="aktif">Status: Aktif</option>
              <option value="nonaktif">Status: Nonaktif</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="space-y-3 py-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : loadError ? (
              <p className="py-8 text-center text-sm text-error">{loadError}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Pengguna</th>
                    <th className="py-2 pr-3 font-medium">Peran</th>
                    <th className="py-2 pr-3 font-medium">Cabang</th>
                    <th className="py-2 pr-3 text-center font-medium">Status</th>
                    <th className="py-2 pr-3 text-right font-medium">Terakhir Aktif</th>
                    <th className="py-2 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                        Tidak ada pengguna yang cocok dengan filter.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((u) => (
                      <tr key={u.id} className="border-b border-border/60 last:border-0">
                        <td className="py-2.5 pr-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {u.name
                                .split(" ")
                                .map((s) => s[0])
                                .slice(0, 2)
                                .join("")}
                            </span>
                            <div className="min-w-0 leading-tight">
                              <p className="font-medium text-foreground">{u.name}</p>
                              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MailIcon width={11} height={11} /> {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-foreground">{u.role}</td>
                        <td className="py-2.5 pr-3 text-muted-foreground">{u.branch}</td>
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
                        <td className="py-2.5 pr-3 text-right text-muted-foreground">{u.lastActive}</td>
                        <td className="py-2.5 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(u)}
                              className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted"
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(u.id)}
                              aria-label={`Hapus ${u.name}`}
                              className="rounded-lg border border-border p-1 text-error hover:bg-error/10"
                            >
                              <TrashIcon width={14} height={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Daftar pengguna & aksi tambah/ubah/hapus terhubung ke database.
          </p>
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

      {formMode ? (
        <UserForm
          mode={formMode}
          branches={branches}
          initial={
            formMode === "ubah" && editingId !== null
              ? toFormValues(accounts.find((u) => u.id === editingId)!)
              : emptyUser(branches)
          }
          onCancel={() => {
            setFormMode(null);
            setEditingId(null);
          }}
          onSave={handleSave}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background shadow-lg">
          {toast}
        </div>
      ) : null}
    </AppShell>
  );
}
