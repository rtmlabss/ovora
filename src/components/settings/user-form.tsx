"use client";

import { useState } from "react";
import { CheckIcon, XIcon } from "@/components/icons";
import { MOCK_BRANCH_SETTINGS, type AccountUser } from "@/lib/settings";

const ROLES = ["Pemilik", "Manager", "Kasir"] as const;

export interface UserFormValues {
  name: string;
  email: string;
  role: (typeof ROLES)[number];
  branch: string;
  status: "aktif" | "nonaktif";
}

export function emptyUser(): UserFormValues {
  return {
    name: "",
    email: "",
    role: "Kasir",
    branch: MOCK_BRANCH_SETTINGS[0].name,
    status: "aktif",
  };
}

export function toFormValues(user: AccountUser): UserFormValues {
  return {
    name: user.name,
    email: user.email,
    role: user.role as typeof ROLES[number],
    branch: user.branch,
    status: user.status,
  };
}

export function UserForm({
  mode,
  initial,
  onCancel,
  onSave,
}: {
  mode: "tambah" | "ubah";
  initial: UserFormValues;
  onCancel: () => void;
  onSave: (values: UserFormValues) => void;
}) {
  const [values, setValues] = useState<UserFormValues>(initial);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!values.name.trim()) {
      setError("Nama wajib diisi");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setError("Email tidak valid");
      return;
    }
    onSave({ ...values, name: values.name.trim(), email: values.email.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "tambah" ? "Tambah Pengguna" : "Ubah Pengguna"}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Tutup"
            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>

        <label className="mb-1 block text-sm font-medium text-foreground">Nama Lengkap</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="Nama pengguna"
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
        <input
          type="email"
          value={values.email}
          onChange={(e) => update("email", e.target.value)}
          placeholder="nama@ovora.id"
          className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Peran</label>
            <select
              value={values.role}
              onChange={(e) => update("role", e.target.value as typeof ROLES[number])}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Cabang</label>
            <select
              value={values.branch}
              onChange={(e) => update("branch", e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {MOCK_BRANCH_SETTINGS.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <span className="mb-2 block text-sm font-medium text-foreground">Status</span>
          <div className="flex gap-4">
            {(["aktif", "nonaktif"] as const).map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
                <input
                  type="radio"
                  name={mode === "tambah" ? "status-tambah" : "status-ubah"}
                  checked={values.status === s}
                  onChange={() => update("status", s)}
                  className="accent-primary"
                />
                {s === "aktif" ? "Aktif" : "Nonaktif"}
              </label>
            ))}
          </div>
        </div>

        {error ? (
          <p className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CheckIcon width={14} height={14} />
            {mode === "tambah" ? "Simpan Pengguna" : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
