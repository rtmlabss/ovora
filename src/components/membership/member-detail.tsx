"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, MailIcon, StarIcon, WhatsAppIcon, XIcon } from "@/components/icons";
import { memberTier, type Member, type PointHistoryEntry } from "@/lib/membership";
import { rupiah } from "@/lib/pos";

interface ApiMovement {
  id: number;
  memberId: number;
  kind: "perolehan" | "penukaran";
  points: number;
  note: string | null;
  createdAt: string;
}

export function MemberDetail({
  member,
  onClose,
}: {
  member: Member;
  onClose: () => void;
}) {
  const tier = memberTier(member.points);
  const [history, setHistory] = useState<PointHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/points/movements?memberId=${member.id}&limit=50`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        if (cancelled) return;
        const movements: PointHistoryEntry[] = (json.pointMovements ?? []).map(
          (m: ApiMovement) => ({
            id: m.id,
            memberId: m.memberId,
            kind: m.kind,
            points: m.points,
            note: m.note ?? "",
            createdAt: m.createdAt,
          })
        );
        setHistory(movements);
      })
      .catch(() => {
        if (!cancelled) setHistory([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [member.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-bold text-foreground">{member.name}</p>
            <p className="text-sm text-muted-foreground">Member aktif</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-primary/5 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
              {member.name
                .split(" ")
                .map((w) => w[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </span>
            <div>
              <p className="text-sm text-muted-foreground">Saldo Poin</p>
              <p className="flex items-center gap-1.5 text-2xl font-bold text-warning">
                <StarIcon width={18} height={18} />
                {member.points.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-semibold ${tier.className}`}
            >
              {tier.label}
            </span>
            <p className="mt-1 text-sm text-muted-foreground">
              senilai {rupiah.format(member.points * 100)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-muted-foreground">
            <WhatsAppIcon width={15} height={15} />
            {member.phone}
          </p>
          <p className="flex items-center gap-2 rounded-lg bg-muted/20 px-3 py-2 text-muted-foreground">
            <MailIcon width={15} height={15} />
            {member.email}
          </p>
        </div>

        <div className="mt-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <CalendarIcon width={15} height={15} />
            Riwayat Poin
          </h3>
          {loading ? (
            <div className="mt-2 space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-muted/30" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="mt-2 rounded-lg bg-muted/20 py-4 text-center text-sm text-muted-foreground">
              Belum ada riwayat poin untuk member ini
            </p>
          ) : (
            <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
              {history.map((entry) => {
                const isEarn = entry.kind === "perolehan";
                return (
                  <li
                    key={entry.id}
                    className="flex items-center justify-between gap-2 rounded-lg bg-muted/20 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {entry.note}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold ${
                        isEarn ? "text-success" : "text-error"
                      }`}
                    >
                      {entry.points > 0 ? "+" : ""}
                      {entry.points.toLocaleString("id-ID")}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="mt-3 text-[11px] text-muted-foreground">
          Riwayat poin dari database.
        </p>
      </div>
    </div>
  );
}
