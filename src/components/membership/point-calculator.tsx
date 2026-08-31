"use client";

import { useEffect, useState } from "react";
import { PercentIcon, StarIcon } from "@/components/icons";
import { memberTier, type Member } from "@/lib/membership";
import { POINT_VALUE, rupiah } from "@/lib/pos";

const EARN_RATE = 1000;

interface ApiMember {
  id: number;
  name: string;
  pointsBalance: number;
}

export function PointCalculator() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberId, setMemberId] = useState<number>(0);
  const [subtotal, setSubtotal] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/members?branchId=1")
      .then((res) => {
        if (!res.ok) throw new Error("Gagal memuat member");
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        const list: Member[] = (json.members ?? []).map((m: ApiMember) => ({
          id: m.id,
          name: m.name,
          phone: "",
          email: "",
          points: m.pointsBalance ?? 0,
        }));
        setMembers(list);
        if (list.length > 0) setMemberId(list[0].id);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const member = members.find((m) => m.id === memberId) ?? null;
  const tier = member ? memberTier(member.points) : null;

  const subtotalNum = Number(subtotal) || 0;
  const earned = Math.floor(subtotalNum / EARN_RATE);

  const requested = Number(redeemPoints);
  const memberPoints = member?.points ?? 0;
  const capByBalance = Math.min(
    Number.isFinite(requested) && requested > 0 ? requested : 0,
    memberPoints
  );
  const discountRaw = capByBalance * POINT_VALUE;
  const discount = Math.min(discountRaw, subtotalNum);
  const total = subtotalNum - discount;
  const remaining = memberPoints - capByBalance;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <PercentIcon width={18} height={18} className="text-primary" />
        Hitung &amp; Tukar Poin
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Perkiraan poin yang didapat dari transaksi, atau tukar poin jadi potongan ({rupiah.format(
          POINT_VALUE
        )}/poin).
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">Pilih Member</label>
            <select
              value={memberId}
              onChange={(e) => {
                setMemberId(Number(e.target.value));
                setRedeemPoints("");
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {members.length === 0 ? (
                <option value={0}>Belum ada member</option>
              ) : (
                members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.points.toLocaleString("id-ID")} poin
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Total Belanja (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={subtotal}
              onChange={(e) => setSubtotal(e.target.value)}
              placeholder="Contoh: 125000"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Poin didapat</p>
              <p className="mt-1 text-lg font-bold text-success">
                <StarIcon width={15} height={15} className="mr-1 inline-block" />
                +{earned.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                1 poin per {rupiah.format(EARN_RATE)} belanja
              </p>
            </div>
            <div className="rounded-lg bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground">Saldo member</p>
              <p className="mt-1 text-lg font-bold text-warning">
                <StarIcon width={15} height={15} className="mr-1 inline-block" />
                {memberPoints.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tier {tier?.label ?? "-"} · sisa {remaining.toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm text-muted-foreground">
              Poin Ditukar (maks. saldo)
            </label>
            <input
              type="number"
              min="0"
              max={memberPoints}
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              placeholder={`Maks ${memberPoints.toLocaleString("id-ID")}`}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {capByBalance > 0 && Number(redeemPoints) > memberPoints ? (
              <p className="mt-1 text-xs text-error">
                Melebihi saldo — dibatasi {memberPoints.toLocaleString("id-ID")} poin
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg bg-muted/20 p-3 text-sm">
            <p className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{rupiah.format(subtotalNum)}</span>
            </p>
            <p className="flex justify-between text-muted-foreground">
              <span>
                Potongan ({capByBalance.toLocaleString("id-ID")} poin)
              </span>
              <span className="text-error">-{rupiah.format(discount)}</span>
            </p>
            <p className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
              <span>Total Akhir</span>
              <span>{rupiah.format(total)}</span>
            </p>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Kalkulasi memakai saldo poin member dari database.
          </p>
        </div>
      </div>
    </div>
  );
}