"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  POINT_VALUE,
  rupiah,
  type Product,
} from "@/lib/pos";
import { ProductBrowser } from "@/components/pos/product-browser";
import { ReceiptModal } from "@/components/pos/receipt-modal";
import {
  BanknoteIcon,
  CartIcon,
  CheckIcon,
  MinusIcon,
  PercentIcon,
  PlusIcon,
  PrintIcon,
  QrIcon,
  StarIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";

interface MemberOption {
  id: number;
  name: string;
  points: number;
}

const BRANCH_ID = 1;

export interface CartLine {
  product: Product;
  qty: number;
}

export interface CompletedTransaction {
  id: number;
  invoiceNo: string;
  time: string;
  items: CartLine[];
  subtotal: number;
  discount: number;
  pointsUsed: number;
  pointsDiscount: number;
  pointsEarned: number;
  total: number;
  method: PayMethod;
  paid: number;
  change: number;
  memberName?: string;
}

type PayMethod = "tunai" | "qris" | "transfer";

const QUICK_AMOUNTS = [10000, 20000, 50000, 100000];

const methods: { id: PayMethod; label: string; icon: ReactNode }[] = [
  { id: "tunai", label: "Tunai", icon: <BanknoteIcon width={16} height={16} /> },
  { id: "qris", label: "QRIS", icon: <QrIcon width={16} height={16} /> },
  { id: "transfer", label: "Transfer", icon: <UsersIcon width={16} height={16} /> },
];

export function SalesWorkbench() {
  const [items, setItems] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [memberId, setMemberId] = useState<number>(0);
  const [discount, setDiscount] = useState(0);
  const [pointsUsed, setPointsUsed] = useState(0);
  const [discountEditor, setDiscountEditor] = useState(false);
  const [pointsEditor, setPointsEditor] = useState(false);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [method, setMethod] = useState<PayMethod>("tunai");
  const [paid, setPaid] = useState(0);

  const [lastTx, setLastTx] = useState<CompletedTransaction | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/products?branchId=${BRANCH_ID}`).then((res) => {
        if (!res.ok) throw new Error("Gagal memuat produk");
        return res.json();
      }),
      fetch(`/api/members?branchId=${BRANCH_ID}`).then((res) => {
        if (!res.ok) throw new Error("Gagal memuat member");
        return res.json();
      }),
    ])
      .then(([productJson, memberJson]) => {
        if (cancelled) return;
        setProducts(productJson.products ?? []);
        setMembers(
          (memberJson.members ?? []).map((m: { id: number; name: string; pointsBalance?: number }) => ({
            id: m.id,
            name: m.name,
            points: m.pointsBalance ?? 0,
          }))
        );
        setLoadError(null);
      })
      .catch((err: Error) => {
        if (!cancelled) setLoadError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const member = members.find((m) => m.id === memberId) ?? null;

  const subtotal = items.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const pointsDiscount = pointsUsed * POINT_VALUE;
  const total = Math.max(subtotal - discount - pointsDiscount, 0);

  const maxPoints = member
    ? Math.min(member.points, Math.floor(Math.max(subtotal - discount, 0) / POINT_VALUE))
    : 0;

  const cashChange = method === "tunai" ? Math.max(paid - total, 0) : 0;
  const paidCovers =
    method === "tunai" ? paid >= total : total > 0;

  const add = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const setQty = (id: number, qty: number) => {
    if (qty <= 0) {
      remove(id);
      return;
    }
    setItems((prev) =>
      prev.map((line) => (line.product.id === id ? { ...line, qty } : line))
    );
  };

  const remove = (id: number) => {
    setItems((prev) => prev.filter((line) => line.product.id !== id));
  };

  const changeMember = (value: number) => {
    setMemberId(value);
    setPointsUsed(0);
    setPointsEditor(false);
  };

  const applyDiscount = (value: string) => {
    setDiscount(Math.min(Math.max(Number(value) || 0, 0), subtotal));
    setDiscountEditor(false);
  };

  const applyPoints = (value: string) => {
    setPointsUsed(Math.min(Math.max(Math.floor(Number(value) || 0), 0), maxPoints));
    setPointsEditor(false);
  };

  const openPayment = () => {
    setPaid(method === "tunai" ? Math.max(total, 0) : 0);
    setPaymentOpen(true);
  };

  const completePayment = async () => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: BRANCH_ID,
          memberId: memberId || null,
          subtotal,
          discount,
          pointsUsed,
          total,
          paymentMethod: method,
          items: items.map((line) => ({ productId: line.product.id, qty: line.qty })),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Gagal menyimpan transaksi");
      }
      const t = json.transaction;
      const tx: CompletedTransaction = {
        id: t.id,
        invoiceNo: t.invoiceNo,
        time: new Date().toLocaleString("id-ID"),
        items,
        subtotal: t.subtotal,
        discount: t.discount,
        pointsUsed: t.pointsUsed,
        pointsDiscount: t.pointsDiscount,
        pointsEarned: t.pointsEarned ?? 0,
        total: t.total,
        method,
        paid: method === "tunai" ? paid : t.total,
        change: cashChange,
        memberName: member?.name,
      };
      setLastTx(tx);
      setItems([]);
      setDiscount(0);
      setPointsUsed(0);
      setMemberId(0);
      setPaymentOpen(false);
      setPaid(0);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSubmitting(false);
    }
  };

  const canCheckout = items.length > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_380px]">
        {loadError ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm text-error shadow-sm">
            {loadError}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm">
            Memuat data produk…
          </div>
        ) : (
          <ProductBrowser products={products} onSelect={add} />
        )}

        <aside
          aria-label="Keranjang transaksi"
          className="flex h-fit flex-col rounded-xl border border-border bg-card shadow-sm lg:sticky lg:top-24"
        >
          <div className="border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                Transaksi Baru
              </h2>
              {items.length > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {items.reduce((n, l) => n + l.qty, 0)} item
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-border px-4 py-3">
            <label
              htmlFor="member"
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              Member
            </label>
            <select
              id="member"
              value={memberId}
              onChange={(e) => changeMember(Number(e.target.value))}
              className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
            >
              <option value={0}>-- Tanpa member --</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.points} poin)
                </option>
              ))}
            </select>
          </div>

          {items.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
              <span className="rounded-lg bg-muted p-3 text-muted-foreground">
                <CartIcon width={20} height={20} />
              </span>
              <p className="text-sm text-muted-foreground">
                Pilih produk untuk memulai transaksi
              </p>
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-border overflow-y-auto px-4">
              {items.map((line) => (
                <li key={line.product.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {line.product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {rupiah.format(line.product.price)} / {line.product.unit}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label={`Kurangi ${line.product.name}`}
                      onClick={() => setQty(line.product.id, line.qty - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-muted"
                    >
                      {line.qty === 1 ? (
                        <TrashIcon width={14} height={14} />
                      ) : (
                        <MinusIcon width={14} height={14} />
                      )}
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={line.qty}
                      onChange={(e) => setQty(line.product.id, Number(e.target.value))}
                      aria-label={`Jumlah ${line.product.name}`}
                      className="h-7 w-12 rounded-md border border-input text-center text-sm text-foreground focus:border-ring focus:outline-none"
                    />
                    <button
                      type="button"
                      aria-label={`Tambah ${line.product.name}`}
                      onClick={() => setQty(line.product.id, line.qty + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-input text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <PlusIcon width={14} height={14} />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold text-foreground">
                    {rupiah.format(line.product.price * line.qty)}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-1.5 border-t border-border px-4 py-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">
                {rupiah.format(subtotal)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Diskon</span>
              <span className="font-medium text-foreground">
                {discount > 0 ? `- ${rupiah.format(discount)}` : rupiah.format(0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Poin dipakai</span>
              <span className="font-medium text-foreground">
                {pointsUsed > 0
                  ? `${pointsUsed} poin (- ${rupiah.format(pointsDiscount)})`
                  : "0 poin"}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-lg font-bold text-primary">
                {rupiah.format(total)}
              </span>
            </div>
          </div>

          {discountEditor && (
            <div className="space-y-3 border-t border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-foreground">
                Diskon nominal (Rp)
              </p>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setDiscount(Math.round(subtotal * (pct / 100)));
                      setDiscountEditor(false);
                    }}
                    className="rounded-md bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary hover:bg-secondary/15"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyDiscount(new FormData(e.currentTarget).get("discount") as string);
                }}
                className="flex gap-2"
              >
                <input
                  name="discount"
                  type="number"
                  min={0}
                  max={subtotal}
                  defaultValue={discount}
                  autoFocus
                  aria-label="Nilai diskon dalam rupiah"
                  className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Terapkan
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountEditor(false)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
              </form>
              {discount > 0 && (
                <button
                  type="button"
                  onClick={() => setDiscount(0)}
                  className="text-xs font-medium text-error hover:underline"
                >
                  Hapus diskon
                </button>
              )}
            </div>
          )}

          {pointsEditor && (
            <div className="space-y-3 border-t border-border bg-muted/30 px-4 py-3">
              <p className="text-xs font-medium text-foreground">
                {member
                  ? `${member.name} punya ${member.points} poin`
                  : "Pilih member untuk memakai poin"}
              </p>
              <p className="text-xs text-muted-foreground">
                1 poin = {rupiah.format(POINT_VALUE)}. Maksimal {maxPoints} poin pada
                transaksi ini.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  applyPoints(new FormData(e.currentTarget).get("points") as string);
                }}
                className="flex gap-2"
              >
                <input
                  name="points"
                  type="number"
                  min={0}
                  max={maxPoints}
                  defaultValue={pointsUsed}
                  disabled={!member || maxPoints === 0}
                  autoFocus
                  aria-label="Jumlah poin yang dipakai"
                  className="w-full rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
                >
                  Terapkan
                </button>
                <button
                  type="button"
                  onClick={() => setPointsEditor(false)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                >
                  Batal
                </button>
              </form>
              {pointsUsed > 0 && (
                <button
                  type="button"
                  onClick={() => setPointsUsed(0)}
                  className="text-xs font-medium text-error hover:underline"
                >
                  Batal memakai poin
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 border-t border-border p-4">
            <button
              type="button"
              disabled={!canCheckout}
              onClick={() => {
                setDiscountEditor((v) => !v);
                setPointsEditor(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-secondary/10 px-2 py-2 text-xs font-semibold text-secondary transition-colors hover:bg-secondary/15 disabled:opacity-40"
            >
              <PercentIcon width={14} height={14} />
              Diskon
            </button>
            <button
              type="button"
              disabled={!canCheckout || !member}
              onClick={() => {
                setPointsEditor((v) => !v);
                setDiscountEditor(false);
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-tertiary/10 px-2 py-2 text-xs font-semibold text-tertiary transition-colors hover:bg-tertiary/15 disabled:opacity-40"
            >
              <StarIcon width={14} height={14} />
              Pakai Poin
            </button>
            <button
              type="button"
              disabled={!canCheckout}
              onClick={openPayment}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-quaternary px-2 py-2 text-xs font-semibold text-quaternary-foreground transition-colors hover:bg-quaternary/90 disabled:opacity-40"
            >
              <CartIcon width={14} height={14} />
              Bayar
            </button>
          </div>
        </aside>
      </div>

      {lastTx && (
        <section
          aria-label="Ringkasan transaksi terakhir"
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-success/10 p-2 text-success">
                <CheckIcon width={20} height={20} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {lastTx.invoiceNo} selesai
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {lastTx.time} · {methodLabel(lastTx.method)} ·{" "}
                  {lastTx.memberName ?? "Tanpa member"}
                  {lastTx.pointsEarned > 0
                    ? ` · +${lastTx.pointsEarned} poin diperoleh`
                    : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total dibayar</p>
                <p className="text-lg font-bold text-foreground">
                  {rupiah.format(lastTx.total)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiptOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <PrintIcon width={16} height={16} />
                Cetak / Kirim Struk
              </button>
            </div>
          </div>

          <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
            {lastTx.items.map((line) => (
              <li
                key={line.product.id}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {line.product.name}{" "}
                  <span className="text-muted-foreground">
                    × {line.qty} {line.product.unit}
                  </span>
                </span>
                <span className="font-medium text-foreground">
                  {rupiah.format(line.product.price * line.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{rupiah.format(lastTx.subtotal)}</span>
            </div>
            {lastTx.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diskon</span>
                <span className="text-foreground">
                  - {rupiah.format(lastTx.discount)}
                </span>
              </div>
            )}
            {lastTx.pointsUsed > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Poin dipakai</span>
                <span className="text-foreground">
                  - {rupiah.format(lastTx.pointsDiscount)} ({lastTx.pointsUsed} poin)
                </span>
              </div>
            )}
            {lastTx.method === "tunai" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Uang dibayar</span>
                <span className="text-foreground">{rupiah.format(lastTx.paid)}</span>
              </div>
            )}
            {lastTx.method === "tunai" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kembalian</span>
                <span className="text-foreground">{rupiah.format(lastTx.change)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-2">
              <span className="font-semibold text-foreground">Total dibayar</span>
              <span className="font-bold text-primary">{rupiah.format(lastTx.total)}</span>
            </div>
          </div>
        </section>
      )}

      {paymentOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Pembayaran"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-lg font-semibold text-foreground">Pembayaran</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {items.reduce((n, l) => n + l.qty, 0)} item · total{" "}
                {rupiah.format(total)}
              </p>
            </div>

            <div className="space-y-4 px-5 py-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Metode pembayaran
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setMethod(m.id);
                        setPaid(m.id === "tunai" ? total : 0);
                      }}
                      aria-pressed={method === m.id}
                      className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                        method === m.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m.icon}
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {method === "tunai" ? (
                <div>
                  <label
                    htmlFor="paid"
                    className="mb-1 block text-xs font-medium text-muted-foreground"
                  >
                    Uang dibayar
                  </label>
                  <input
                    id="paid"
                    type="number"
                    min={total}
                    value={paid}
                    onChange={(e) => setPaid(Number(e.target.value))}
                    autoFocus
                    aria-label="Uang dibayar"
                    className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-lg font-bold text-foreground focus:border-ring focus:outline-none"
                  />
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setPaid(total)}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted-foreground/20"
                    >
                      Uang Pas
                    </button>
                    {QUICK_AMOUNTS.map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setPaid(amount)}
                        className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted-foreground/20"
                      >
                        +{rupiah.format(amount)}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
                    <span className="text-sm text-muted-foreground">Kembalian</span>
                    <span
                      className={`text-lg font-bold ${
                        cashChange > 0 ? "text-success" : "text-foreground"
                      }`}
                    >
                      {rupiah.format(cashChange)}
                    </span>
                  </div>
                  {paid > 0 && paid < total && (
                    <p className="mt-1 text-xs font-medium text-error">
                      Uang dibayar kurang {rupiah.format(total - paid)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="rounded-lg bg-muted/60 px-3 py-2.5 text-sm text-muted-foreground">
                  Total {rupiah.format(total)} akan ditagih ke {methodLabel(method)}.
                </p>
              )}
            </div>

            <div className="flex gap-3 border-t border-border px-5 py-4">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setPaymentOpen(false)}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-40"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={!paidCovers || submitting}
                onClick={completePayment}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                <CheckIcon width={16} height={16} />
                {submitting ? "Menyimpan…" : "Bayar & Selesai"}
              </button>
            </div>
            {submitError ? (
              <p className="border-t border-border bg-error/5 px-5 py-2 text-xs font-medium text-error">
                {submitError}
              </p>
            ) : null}
          </div>
        </div>
      )}

      {receiptOpen && lastTx && (
        <ReceiptModal tx={lastTx} onClose={() => setReceiptOpen(false)} />
      )}
    </div>
  );
}

function methodLabel(method: PayMethod) {
  return methods.find((m) => m.id === method)?.label ?? method;
}