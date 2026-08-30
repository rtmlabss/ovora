"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  CheckIcon,
  CrownIcon,
  StarIcon,
  TrophyIcon,
  UsersIcon,
} from "@/components/icons";
import {
  DEFAULT_PERIOD_KEY,
  MOCK_LEADERBOARD_BY_PERIOD,
  PERIODS,
  TOP_WINNERS,
  type Period,
} from "@/lib/leaderboard";

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
  const [periodKey, setPeriodKey] = useState<string>(DEFAULT_PERIOD_KEY);
  const [editing, setEditing] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number[]>>({});

  const period: Period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[0];

  useEffect(() => {
    if (period.closed) setEditing(false);
  }, [period.closed, periodKey]);

  const [year, month] = period.key.split("-").map(Number);

  const entries = MOCK_LEADERBOARD_BY_PERIOD[period.key];
  const defaultWinners = entries.filter((m) => m.isWinner).map((m) => m.id);

  const selected: number[] = overrides[period.key] ?? defaultWinners;
  const preview = selected.length > 0 ? selected : defaultWinners;

  const winners = entries
    .filter((m) => (editing ? preview.includes(m.id) : selected.includes(m.id)))
    .sort((a, b) => b.monthPoints - a.monthPoints)
    .map((m, i) => ({ ...m, rank: i + 1 }));

  function toggleWinner(id: number) {
    if (period.closed) return;
    setOverrides((prev) => {
      const current = prev[period.key] ?? defaultWinners;
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : current.length < TOP_WINNERS
          ? [...current, id]
          : current;
      return { ...prev, [period.key]: next };
    });
  }

  function saveWinners() {
    setOverrides((prev) => {
      const next = [...(prev[period.key] ?? defaultWinners)].sort(
        (a, b) =>
          entries.find((e) => e.id === b)!.monthPoints -
          entries.find((e) => e.id === a)!.monthPoints
      );
      return { ...prev, [period.key]: next };
    });
    setEditing(false);
  }

  const years = useMemo(
    () => [...new Set(PERIODS.map((p) => Number(p.key.split("-")[0])))].sort((a, b) => b - a),
    []
  );
  const monthsInYear = PERIODS.filter((p) => p.key.startsWith(`${year}-`)).map((p) =>
    Number(p.key.split("-")[1])
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
          {!monthsInYear.includes(month) ? (
            <p className="text-sm text-muted-foreground">Belum ada data untuk periode ini</p>
          ) : (
            <div>
              <h2 className="text-base font-semibold text-foreground">{period.timespanLabel}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {TOP_WINNERS} member dengan poin terbanyak bulan ini berhak atas reward.
                {!period.closed && period.deadline && ` Periode berakhir ${period.deadline}.`}
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              period.closed ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            }`}
          >
            {period.closed ? "Periode ditutup" : "Masih berjalan"}
          </span>
          {!period.closed && monthsInYear.includes(month) && (
            <button
              type="button"
              onClick={() => (editing ? saveWinners() : setEditing(true))}
              className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                editing
                  ? "bg-success text-success-foreground hover:bg-success/90"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {editing ? (
                <>
                  <CheckIcon width={13} height={13} /> Simpan Pemenang
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

      {!monthsInYear.includes(month) ? (
        <div className="rounded-xl bg-muted/20 py-16 text-center text-sm text-muted-foreground">
          Belum ada data leaderboard untuk {MONTHS[month - 1]} {year}
        </div>
      ) : (
        <>
          {editing && (
            <div className="flex items-center justify-between rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <p className="text-warning">
                Mode pemilihan — klik baris untuk menandai hingga {TOP_WINNERS} pemenang
                ({(selected.length).toLocaleString("id-ID")}/{TOP_WINNERS} terpilih).
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
                  Reward: {entry.reward}
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
                  <th className="py-2 text-right font-medium">Reward</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const isWinner = selected.includes(entry.id);
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
                        {editing ? (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                              isWinner
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {isWinner ? <CheckIcon width={13} height={13} /> : entry.rank}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold ${PODIUM_BADGE[entry.rank] ?? "bg-muted/60 text-muted-foreground"}`}
                          >
                            {entry.rank}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-foreground">
                          {isWinner && editing && currentRank
                            ? `Pemenang #${currentRank} — `
                            : ""}
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
                          <span className="text-xs font-medium text-success">{entry.reward}</span>
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
              {editing
                ? "Pemenang dipilih dari data tiruan — belum tersimpan ke server."
                : "Leaderboard memakai data tiruan sampai API leaderboard selesai."}
            </p>
          </section>
        </>
      )}
    </div>
  );
}