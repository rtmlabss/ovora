"use client";

import { useState } from "react";
import { CheckIcon, GiftIcon, TrophyIcon } from "@/components/icons";
import {
  DEFAULT_PERIOD_KEY,
  MOCK_LEADERBOARD_BY_PERIOD,
  PERIODS,
  type Period,
} from "@/lib/leaderboard";

export interface RewardRecord {
  id: number;
  periodLabel: string;
  memberName: string;
  prize: string;
  deliveredDate: string;
  status: "diserahkan" | "dijadwalkan";
}

interface NewRecord {
  memberId: number;
  prize: string;
  deliveredDate: string;
  status: RewardRecord["status"];
  note: string;
}

export function RewardRecordForm({ onRecorded }: { onRecorded: (record: RewardRecord) => void }) {
  const [periodKey, setPeriodKey] = useState<string>(DEFAULT_PERIOD_KEY);
  const [memberId, setMemberId] = useState<number>(0);
  const [prize, setPrize] = useState("");
  const [deliveredDate, setDeliveredDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [status, setStatus] = useState<NewRecord["status"]>("diserahkan");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const period: Period = PERIODS.find((p) => p.key === periodKey) ?? PERIODS[0];
  const entries = MOCK_LEADERBOARD_BY_PERIOD[periodKey];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const member = entries.find((m) => m.id === memberId);
    if (!member) {
      setError("Pilih pemenang terlebih dahulu");
      return;
    }
    if (!prize.trim()) {
      setError("Nama hadiah wajib diisi");
      return;
    }
    if (!deliveredDate) {
      setError("Tanggal hadiah wajib diisi");
      return;
    }

    onRecorded({
      id: Date.now(),
      periodLabel: period.label,
      memberName: member.name,
      prize: prize.trim(),
      deliveredDate,
      status,
    });

    setPrize("");
    setNote("");
    setError(null);
    setMsg(`${member.name} — "${prize.trim()}" tercatat (contoh)`);
    window.setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <GiftIcon width={18} height={18} className="text-primary" />
        Catat Hadiah Reward
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Rekam penyerahan hadiah kepada pemenang leaderboard.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Periode</label>
            <select
              value={periodKey}
              onChange={(e) => {
                setPeriodKey(e.target.value);
                setMemberId(0);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {PERIODS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Pemenang <span className="text-error">*</span>
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value={0}>— Pilih pemenang —</option>
              {entries.map((m) => (
                <option key={m.id} value={m.id}>
                  #{m.rank} {m.name} ({m.monthPoints.toLocaleString("id-ID")} poin)
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            Nama Hadiah <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="Contoh: 1 kg Telur Ayam Negeri"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Tanggal Penyerahan <span className="text-error">*</span>
            </label>
            <input
              type="date"
              value={deliveredDate}
              onChange={(e) => setDeliveredDate(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as NewRecord["status"])}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="diserahkan">Diserahkan</option>
              <option value="dijadwalkan">Dijadwalkan</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Catatan</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Contoh: diserahkan saat struk belanja berikutnya"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">{error}</p>
        ) : null}
        {msg ? (
          <p className="flex items-center gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
            <CheckIcon width={14} height={14} />
            {msg}
          </p>
        ) : null}

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <TrophyIcon width={15} height={15} />
          Simpan Hadiah
        </button>
      </form>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Pencatatan memakai data tiruan sampai API hadiah selesai.
      </p>
    </div>
  );
}