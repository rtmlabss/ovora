"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronRightIcon, SearchIcon, StarIcon, UsersIcon } from "@/components/icons";
import { MemberAddForm } from "@/components/membership/member-add-form";
import { MemberDetail } from "@/components/membership/member-detail";
import { memberTier, type Member } from "@/lib/membership";
import { rupiah } from "@/lib/pos";

interface ApiMember {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  pointsBalance: number;
}

export function MemberBoard() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const selected = members.find((m) => m.id === selectedId) ?? null;

  function loadMembers() {
    return fetch("/api/members?branchId=1")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat member");
        return res.json();
      })
      .then((json) => {
        const list: Member[] = (json.members ?? []).map((m: ApiMember) => ({
          id: m.id,
          name: m.name,
          phone: m.phone ?? "-",
          email: m.email ?? "-",
          points: m.pointsBalance ?? 0,
        }));
        setMembers(list);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadMembers();
  }, []);

  function handleAdd(member: Member) {
    loadMembers();
    setSelectedId(member.id);
  }

  const stats = useMemo(() => {
    const totalPoints = members.reduce((sum, m) => sum + m.points, 0);
    const goldCount = members.filter((m) => memberTier(m.points).label === "Gold").length;
    return { total: members.length, totalPoints, goldCount };
  }, [members]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.email ?? "").toLowerCase().includes(q)
      );
    });
  }, [members, query]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Member</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Poin Beredar</p>
          <p className="mt-1 text-2xl font-bold text-warning">
            {stats.totalPoints.toLocaleString("id-ID")}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Member Gold</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{stats.goldCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section
          aria-label="Daftar member"
          className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-foreground">Daftar Member</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                1 poin bernilai {rupiah.format(100)} — lebih banyak transaksi, lebih banyak poin.
              </p>
            </div>
            <label className="relative block w-full max-w-xs">
              <SearchIcon
                width={16}
                height={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama, telepon, email…"
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
              />
            </label>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
              ))}
            </div>
          ) : error ? (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p>
          ) : visible.length === 0 ? (
            <div className="rounded-lg bg-muted/20 py-10 text-center">
              <p className="text-sm text-muted-foreground">Tidak ada member yang cocok</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Nama</th>
                    <th className="py-2 pr-3 font-medium">Kontak</th>
                    <th className="py-2 pr-3 text-right font-medium">Poin</th>
                    <th className="py-2 pr-3 text-right font-medium">Nilai Poin</th>
                    <th className="py-2 pr-3 text-right font-medium">Tier</th>
                    <th className="py-2 text-right font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((member) => {
                    const tier = memberTier(member.points);
                    return (
                      <tr
                        key={member.id}
                        className="cursor-pointer border-b border-border/60 last:border-0 transition-colors hover:bg-muted/30"
                        onClick={() => setSelectedId(member.id)}
                      >
                        <td className="py-2.5 pr-3">
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-xs text-muted-foreground">Member aktif</p>
                        </td>
                        <td className="py-2.5 pr-3 text-muted-foreground">
                          <p>{member.phone}</p>
                          <p className="text-xs">{member.email}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <span className="inline-flex items-center gap-1 font-semibold text-warning">
                            <StarIcon width={14} height={14} />
                            {member.points.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right text-foreground">
                          {rupiah.format(member.points * 100)}
                        </td>
                        <td className="py-2.5 pr-3 text-right">
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${tier.className}`}
                          >
                            {tier.label}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-muted-foreground">
                          <ChevronRightIcon width={16} height={16} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <UsersIcon width={13} height={13} />
            Data member dari database.
          </p>
        </section>

        <MemberAddForm onAdd={handleAdd} />
      </div>

      {selected ? (
        <MemberDetail member={selected} onClose={() => setSelectedId(null)} />
      ) : null}
    </div>
  );
}