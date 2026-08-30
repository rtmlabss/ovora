"use client";

import Link from "next/link";
import { useState } from "react";
import AppShell from "@/components/app-shell";
import { CheckIcon, ChevronRightIcon, SettingsIcon, UsersIcon, XIcon } from "@/components/icons";
import {
  PERMISSIONS,
  ROLES_WITH_PERMISSIONS,
  type PermissionId,
  type RoleId,
} from "@/lib/settings";

type State = Record<RoleId, Set<PermissionId>>;

function initState(): State {
  const state = {} as State;
  for (const role of ROLES_WITH_PERMISSIONS) {
    state[role.id] = new Set(role.permissions);
  }
  return state;
}

export default function HakAksesPage() {
  const [state, setState] = useState<State>(initState);
  const [saved, setSaved] = useState(false);

  function toggle(role: RoleId, perm: PermissionId) {
    setState((prev) => {
      const next = new Set(prev[role]);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return { ...prev, [role]: next };
    });
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl p-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Hak Akses Peran</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Atur izin akses setiap peran terhadap fitur aplikasi
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <CheckIcon width={15} height={15} /> Simpan Perubahan
          </button>
        </header>

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {ROLES_WITH_PERMISSIONS.map((role) => (
            <div key={role.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <SettingsIcon width={16} height={16} className="text-primary" />
                <p className="font-semibold text-foreground">{role.id}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{role.desc}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {state[role.id].size}/{PERMISSIONS.length} izin · {role.count} pengguna
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <UsersIcon width={16} height={16} className="text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Matriks Izin</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Fitur</th>
                  {ROLES_WITH_PERMISSIONS.map((role) => (
                    <th key={role.id} className="px-2 py-2 text-center font-medium">
                      {role.id}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-4">
                      <p className="font-medium text-foreground">{perm.label}</p>
                      <p className="text-xs text-muted-foreground">{perm.desc}</p>
                    </td>
                    {ROLES_WITH_PERMISSIONS.map((role) => {
                      const has = state[role.id].has(perm.id);
                      return (
                        <td key={role.id} className="px-2 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggle(role.id, perm.id)}
                            aria-label={`${role.id} ${has ? "nonaktifkan" : "aktifkan"} ${perm.label}`}
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-lg border transition-colors ${
                              has
                                ? "border-success/30 bg-success/15 text-success"
                                : "border-border bg-background text-muted-foreground"
                            }`}
                          >
                            {has ? <CheckIcon width={14} height={14} /> : <XIcon width={14} height={14} />}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {saved ? (
            <p className="mt-3 flex items-center gap-1 text-xs font-medium text-success">
              <CheckIcon width={14} height={14} /> Perubahan hak akses tersimpan.
            </p>
          ) : null}

          <p className="mt-3 text-[11px] text-muted-foreground">
            Matriks hak akses memakai data tiruan sampai API pengaturan tersedia.
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
    </AppShell>
  );
}
