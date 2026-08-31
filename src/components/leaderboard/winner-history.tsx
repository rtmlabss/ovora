"use client";

import { useEffect, useState } from "react";
import { TrophyIcon } from "@/components/icons";
import type { ApiReward, ApiRewardWinner } from "@/components/leaderboard/reward-record-form";

function fmtPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

interface Row {
  periodLabel: string;
  rank: number;
  name: string;
  reward: string;
}

export function WinnerHistory() {
  const [rewards, setRewards] = useState<ApiReward[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/rewards")
      .then((res) => (res.ok ? res.json() : { rewards: [] }))
      .then((json) => {
        if (!cancelled) setRewards(json.rewards ?? []);
      })
      .catch(() => {
        if (!cancelled) setRewards([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: Row[] = rewards.flatMap((reward) =>
    reward.winners
      .slice()
      .sort((a: ApiRewardWinner, b: ApiRewardWinner) => a.rank - b.rank)
      .map((w) => ({
        periodLabel: fmtPeriod(reward.period),
        rank: w.rank,
        name: w.memberName,
        reward: reward.title,
      }))
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <TrophyIcon width={18} height={18} className="text-warning" />
        Riwayat Pemenang &amp; Hadiah
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pemenang reward yang tercatat di database.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 rounded-lg bg-muted/20 py-8 text-center text-sm text-muted-foreground">
          Belum ada pemenang yang tercatat
        </p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">Periode</th>
                <th className="py-2 pr-3 font-medium">Peringkat</th>
                <th className="py-2 pr-3 font-medium">Pemenang</th>
                <th className="py-2 text-right font-medium">Hadiah</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={`${row.periodLabel}-${row.rank}-${i}`}
                  className="border-b border-border/60 last:border-0"
                >
                  <td className="py-2.5 pr-3">
                    <p className="text-foreground">{row.periodLabel}</p>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-warning/15 text-xs font-bold text-warning">
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-foreground">{row.name}</td>
                  <td className="py-2.5 text-right text-xs font-medium text-success">
                    {row.reward}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
