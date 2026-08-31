"use client";

import { useCallback, useEffect, useState } from "react";
import { GiftIcon } from "@/components/icons";
import {
  RewardRecordForm,
  type ApiReward,
  type ApiRewardWinner,
} from "@/components/leaderboard/reward-record-form";

function fmtPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function RewardRecords({ records }: { records: ApiRewardWinner[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
        <GiftIcon width={15} height={15} />
        Riwayat Hadiah
      </h3>
      {records.length === 0 ? (
        <p className="rounded-lg bg-muted/20 py-6 text-center text-sm text-muted-foreground">
          Belum ada hadiah yang dicatat
        </p>
      ) : (
        <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
          {records.map((record) => (
            <li key={record.id} className="rounded-lg bg-muted/20 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-medium text-foreground">
                  #{record.rank} {record.memberName}
                </p>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                    record.status === "diserahkan"
                      ? "bg-success/15 text-success"
                      : "bg-warning/15 text-warning"
                  }`}
                >
                  {record.status}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {record.deliveredDate
                  ? new Date(record.deliveredDate).toLocaleDateString("id-ID")
                  : "Belum ada tanggal penyerahan"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RewardPanel() {
  const [rewards, setRewards] = useState<ApiReward[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/rewards")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        setRewards(json.rewards ?? []);
        setError(null);
      })
      .catch(() => setError("Gagal memuat riwayat hadiah"));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allWinners = rewards.flatMap((r) => r.winners);

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p>
      ) : null}
      <RewardRecordForm rewards={rewards} onDelivered={load} />
      <RewardRecords records={allWinners} />
    </div>
  );
}
