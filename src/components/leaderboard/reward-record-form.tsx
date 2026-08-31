"use client";

import { useEffect, useState } from "react";
import { CheckIcon, GiftIcon, TrophyIcon } from "@/components/icons";

export interface ApiReward {
  id: number;
  period: string;
  title: string;
  createdAt: string;
  winners: ApiRewardWinner[];
}

export interface ApiRewardWinner {
  id: number;
  memberId: number;
  memberName: string;
  rank: number;
  status: "diserahkan" | "dijadwalkan";
  deliveredDate: string | null;
  note: string | null;
}

function fmtPeriod(period: string) {
  const [y, m] = period.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

export function RewardRecordForm({
  rewards,
  onDelivered,
}: {
  rewards: ApiReward[];
  onDelivered: () => void;
}) {
  const [rewardId, setRewardId] = useState<number>(0);
  const [memberId, setMemberId] = useState<number>(0);
  const [status, setStatus] = useState<"diserahkan" | "dijadwalkan">("diserahkan");
  const [deliveredDate, setDeliveredDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reward = rewards.find((r) => r.id === rewardId);
  const winners = reward?.winners ?? [];

  useEffect(() => {
    if (reward && winners.length > 0 && !winners.some((w) => w.memberId === memberId)) {
      setMemberId(winners[0].memberId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rewardId]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!rewardId) {
      setError("Pilih periode reward terlebih dahulu");
      return;
    }
    if (!memberId) {
      setError("Pilih pemenang terlebih dahulu");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/rewards/deliver", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rewardId,
          memberId,
          status,
          deliveredDate,
          note: note.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mencatat hadiah");
      const m = winners.find((w) => w.memberId === memberId);
      setMsg(`${m?.memberName ?? "Pemenang"} — status diperbarui ke "${status}"`);
      setNote("");
      onDelivered();
      window.setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <GiftIcon width={18} height={18} className="text-primary" />
        Serahkan Hadiah
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Rilis hadiah kepada pemenang reward dan tandai status penyerahan.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Reward</label>
          <select
            value={rewardId}
            onChange={(e) => setRewardId(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value={0}>— Pilih reward —</option>
            {rewards.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title} ({fmtPeriod(r.period)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Pemenang</label>
          <select
            value={memberId}
            onChange={(e) => setMemberId(Number(e.target.value))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value={0}>— Pilih pemenang —</option>
            {winners.map((w) => (
              <option key={w.id} value={w.memberId}>
                #{w.rank} {w.memberName}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "diserahkan" | "dijadwalkan")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="diserahkan">Diserahkan</option>
              <option value="dijadwalkan">Dijadwalkan</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Tanggal Penyerahan
            </label>
            <input
              type="date"
              value={deliveredDate}
              onChange={(e) => setDeliveredDate(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
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
          disabled={saving}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          <TrophyIcon width={15} height={15} />
          {saving ? "Menyimpan…" : "Simpan Penyerahan"}
        </button>
      </form>
    </div>
  );
}
