"use client";

import { TrophyIcon } from "@/components/icons";
import { MOCK_LEADERBOARD_BY_PERIOD, PERIODS } from "@/lib/leaderboard";

function fmtDate(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${new Date(y, m - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" })}`;
}

export function WinnerHistory() {
  const rows = PERIODS.flatMap((period) =>
    MOCK_LEADERBOARD_BY_PERIOD[period.key]
      .filter((m) => m.isWinner)
      .sort((a, b) => a.rank - b.rank)
      .map((m) => ({
        periodLabel: period.label,
        rank: m.rank,
        name: m.name,
        points: m.monthPoints,
        reward: m.reward,
      }))
  );

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <TrophyIcon width={18} height={18} className="text-warning" />
        Riwayat Pemenang &amp; Hadiah
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Pemenang {fmtDate(PERIODS[0].key)} hingga periode sebelumnya.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 pr-3 font-medium">Periode</th>
              <th className="py-2 pr-3 font-medium">Peringkat</th>
              <th className="py-2 pr-3 font-medium">Pemenang</th>
              <th className="py-2 pr-3 text-right font-medium">Poin</th>
              <th className="py-2 text-right font-medium">Hadiah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.periodLabel}-${row.rank}`}
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
                <td className="py-2.5 pr-3 text-right text-warning">
                  {row.points.toLocaleString("id-ID")}
                </td>
                <td className="py-2.5 text-right text-xs font-medium text-success">
                  {row.reward}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}