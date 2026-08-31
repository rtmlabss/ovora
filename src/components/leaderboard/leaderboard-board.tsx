"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  CheckIcon,
  CrownIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/icons";
import { PERIODS, TOP_WINNERS, type Period } from "@/lib/leaderboard";

interface ApiLeaderboardRow {
  rank: number;
  memberId: number;
  memberName: string;
  branchId: number;
  monthPoints: number;
}

interface ApiMember {
  id: number;
  name: string;
  phone: string | null;
}

interface LeaderboardEntry {
  id: number;
  name: string;
  phone: string;
  monthPoints: number;
  rank: number;
}

const PODIUM_BADGE: Record<number, string> = {
  1: "bg-warning/15 text-warning",
  2: "bg-muted text-muted-foreground",
  3: "bg-primary/10 text-primary",
};

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export function LeaderboardBoard() {
  const [periodKey, setPeriodKey] = useState<string>(
    new Date().toISOString().slice(0, 7)
  );
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  const period: Period | undefined = PERIODS.find((p) => p.key === periodKey);
  const closed = period?.closed ?? false;

  const [year, month] = periodKey.split("-").map(Number);

  const loadLeaderboard = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/leaderboard?period=${periodKey}&branchId=1&limit=50`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((j) => Promise.reject(new Error(j.error ?? "Gagal memuat leaderboard")));
        }
        return res.json();
      })
      .then((json) => {
        const rows: ApiLeaderboardRow[] = json.rows ?? [];
        const ranks = new Map(rows.map((r) => [r.memberId, r.rank]));
        let memberMap: Map<number, string> = new Map();
        return fetch("/api/members?branchId=1")
          .then((r) => (r.ok ? r.json() : { members: [] }))
          .then((mj) => {
            memberMap = new Map((mj.members ?? [] as ApiMember[]).map((m: ApiMember) => [m.id, m.phone ?? ""]));
            return rows.map((row) => ({
              id: row.memberId,
              name: row.memberName,
              phone: memberMap.get(row.memberId) ?? "",
              monthPoints: row.monthPoints,
              rank: ranks.get(row.memberId) ?? rows.indexOf(row) + 1,
            }));
          });
      })
      .then((list) => {
        setEntries(list);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [periodKey]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const defaultWinners = useMemo(
    () => selected.filter(() => false),
    []
  );

  const sortedPreview = useMemo(() => {
    const sorted = [...entries].sort((a, b) => b.monthPoints - a.monthPoints);
    return sorted.slice(0, TOP_WINNERS).map((e) => e.id);
  }, [entries]);

  const shown = editing ? (selected.length > 0 ? selected : defaultWinners) : selected;

  const winners = entries
    .filter((m) => shown.includes(m.id))
    .sort((a, b) => b.monthPoints - a.monthPoints)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  function toggleWinner(id: number) {
    if (closed) return;
    setSelected((prev) => {
      const current = prev.length > 0 ? prev : sortedPreview;
      return current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < TOP_WINNERS
          ? [...current, id]
          : current;
    });
  }

  async function saveWinners() {
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/rewards/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: periodKey, memberIds: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan pemenang");
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  const years = useMemo(
    () => [...new Set(PERIODS.map((p) => Number(p.key.split("-")[0])))].sort((a, b) => b - a),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon width={16} height={16} className="text-muted-foreground" />
            <select
              value={month}
              onChange={(e) => setPeriodKey(`${year}-${String(Number(e.target.value)).padStart(2, "0")}`)}
              disabled={editing}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setPeriodKey(`${e.target.value}-${String(month).padStart(2, "0")}`)}
              disabled={editing}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Reward {MONTHS[month - 1]} {year}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {TOP_WINNERS} member dengan poin terbanyak bulan ini berhak atas reward.
              {closed && " Periode telah ditutup."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              closed ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            }`}
          >
            {closed ? "Periode ditutup" : "Masih berjalan"}
          </span>
          {!closed && (
            <button
              type="button"
              disabled={saving}
              onClick={() => (editing ? saveWinners() : setEditing(true))}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                editing
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {editing ? (
                <>
                  <CheckIcon width={13} height={13} /> {saving ? "Menyimpan…" : "Simpan Pemenang"}
                </>
              ) : (
                <>
                  <CrownIcon width={13} height={13} /> Pilih Pemenang
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl bg-error/10 px-4 py-4 text-sm text-error">{error}</p>
      ) : entries.length === 0 ? (
        <div className="rounded-xl bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Belum ada data leaderboard untuk {MONTHS[month - 1]} {year}
        </div>
      ) : (
        <>
          {editing && (
            <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <p className="text-warning">
                Mode pemilihan — klik baris untuk menandai hingga {TOP_WINNERS} pemenang
                ({(selected.length > 0 ? selected.length : sortedPreview.length).toLocaleString("id-ID")}/{TOP_WINNERS} terpilih).
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {winners.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${PODIUM_BADGE[entry.rank] ?? "bg-muted text-muted-foreground"}`}
                  >
                    #{entry.rank}
                  </span>
                  <TrophyIcon width={20} height={20} className="text-warning" />
                </div>
                <p className="mt-3 font-semibold text-foreground">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.phone}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-lg font-bold text-warning">
                  <StarIcon width={16} height={16} />
                  {entry.monthPoints.toLocaleString("id-ID")}
                  <span className="text-xs font-normal text-muted-foreground">poin</span>
                </p>
                <p className="mt-2 rounded-lg bg-success/10 px-3 py-1.5 text-xs text-success">
                  Pemenang #{entry.rank}
                </p>
              </div>
            ))}
          </div>

          <section
            aria-label="Papan peringkat"
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Peringkat</th>
                  <th className="py-2 pr-3 font-medium">Member</th>
                  <th className="py-2 pr-3 text-right font-medium">Poin Bulan Ini</th>
                  <th className="py-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isWinner = entry.rank <= TOP_WINNERS && editing
                    ? (selected.length > 0 ? selected : sortedPreview).includes(entry.id)
                    : entry.rank <= TOP_WINNERS
                      ? (selected.length > 0 ? selected : sortedPreview).includes(entry.id)
                      : false;
                  const currentRank = winners.find((w) => w.id === entry.id)?.rank;
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => editing && toggleWinner(entry.id)}
                      className={`border-b border-border/60 last:border-0 ${
                        isWinner ? "bg-warning/5" : ""
                      } ${editing ? "cursor-pointer select-none" : ""}`}
                    >
                      <td className="py-2.5 pr-3">
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${
                            editing
                              ? isWinner
                                ? "border border-primary bg-primary text-primary-foreground"
                                : "border border-border text-muted-foreground"
                              : PODIUM_BADGE[entry.rank] ?? "bg-muted/60 text-muted-foreground"
                          }`}
                        >
                          {editing && isWinner ? (
                            <CheckIcon width={13} height={13} />
                          ) : (
                            entry.rank
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-foreground">
                          {isWinner && editing && currentRank ? `Pemenang #${currentRank} — ` : ""}
                          {entry.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{entry.phone}</p>
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        <span className="font-semibold text-warning">
                          {entry.monthPoints.toLocaleString("id-ID")}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {isWinner ? (
                          <span className="text-xs font-medium text-success">Reward</span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <UsersIcon width={13} height={13} />
              Peringkat dihitung dari perolehan poin di database per periode.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
