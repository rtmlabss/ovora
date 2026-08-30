"use client";

import { useMemo, useState } from "react";
import { PercentIcon, StarIcon } from "@/components/icons";
import { memberTier, MOCK_MEMBERS } from "@/lib/membership";
import { POINT_VALUE, rupiah } from "@/lib/pos";

const EARN_RATE = 1000;

export function PointCalculator() {
  const [memberId, setMemberId] = useState<number>(MOCK_MEMBERS[0].id);
  const [subtotal, setSubtotal] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");

  const member = MOCK_MEMBERS.find((m) => m.id === memberId)!;
  const tier = memberTier(member.points);

  const subtotalNum = Number(subtotal) || 0;
  const earned = Math.floor(subtotalNum / EARN_RATE);

  const requested = Number(redeemPoints);
  const capByBalance = Math.min(
    Number.isFinite(requested) && requested > 0 ? requested : 0,
    member.points
  );
  const discountRaw = capByBalance * POINT_VALUE;
  const discount = Math.min(discountRaw, subtotalNum);
  const total = subtotalNum - discount;
  const remaining = member.points - capByBalance;

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
              {MOCK_MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} — {m.points.toLocaleString("id-ID")} poin
                </option>
              ))}
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
                {member.points.toLocaleString("id-ID")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tier {tier.label} · sisa {remaining.toLocaleString("id-ID")}
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
              max={member.points}
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              placeholder={`Maks ${member.points.toLocaleString("id-ID")}`}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
            />
            {capByBalance > 0 && Number(redeemPoints) > member.points ? (
              <p className="mt-1 text-xs text-error">
                Melebihi saldo — dibatasi {member.points.toLocaleString("id-ID")} poin
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
            Kalkulasi memakai data tiruan sampai transaksi POS terhubung ke API poin.
          </p>
        </div>
      </div>
    </div>
  );
}