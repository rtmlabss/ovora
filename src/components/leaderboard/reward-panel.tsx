"use client";

import { useState } from "react";
import { GiftIcon } from "@/components/icons";
import { RewardRecordForm, type RewardRecord } from "@/components/leaderboard/reward-record-form";

function RewardRecords({ records }: { records: RewardRecord[] }) {
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
                  {record.memberName}
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
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{record.prize}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {record.periodLabel} · {record.deliveredDate}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RewardPanel() {
  const [records, setRecords] = useState<RewardRecord[]>([]);

  return (
    <div className="space-y-6">
      <RewardRecordForm
        onRecorded={(record) => setRecords((prev) => [record, ...prev])}
      />
      <RewardRecords records={records} />
    </div>
  );
}