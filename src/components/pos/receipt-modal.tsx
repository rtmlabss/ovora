"use client";

import { useState } from "react";
import { rupiah } from "@/lib/pos";
import type { CompletedTransaction } from "@/components/pos/sales-workbench";
import {
  CheckIcon,
  MailIcon,
  PrintIcon,
  WhatsAppIcon,
  XIcon,
} from "@/components/icons";

type Delivery = "email" | "wa" | null;

export function ReceiptModal({
  tx,
  onClose,
}: {
  tx: CompletedTransaction;
  onClose: () => void;
}) {
  const [delivery, setDelivery] = useState<Delivery>(null);
  const [recipient, setRecipient] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const handlePrint = () => window.print();

  const handleSend = () => {
    if (!recipient.trim()) return;
    setSent(`${delivery === "email" ? "Email" : "WhatsApp"}: ${recipient.trim()}`);
    setRecipient("");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Struk transaksi"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl print:max-w-none print:border-none print:bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4 print:hidden">
          <h2 className="text-lg font-semibold text-foreground">Struk Transaksi</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup struk"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>

        <div className="receipt-print mx-auto w-full max-w-xs px-5 py-4 font-mono text-[13px] leading-relaxed text-zinc-800 print:max-w-none print:px-2">
          <div className="text-center">
            <p className="text-base font-bold uppercase">Ovora Telur</p>
            <p>Jl. Raya Telur No. 1, Kota</p>
            <p>Telp: 0812-0000-0000</p>
          </div>

          <div className="my-3 border-t border-dashed border-zinc-400" />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>No. Struk</span>
              <span>{tx.invoiceNo || `#${tx.id.toString().slice(-6)}`}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal</span>
              <span>{tx.time}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir</span>
              <span>Petugas Toko</span>
            </div>
            {tx.memberName && (
              <div className="flex justify-between">
                <span>Member</span>
                <span>{tx.memberName}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Metode</span>
              <span>{methodLabel(tx.method)}</span>
            </div>
          </div>

          <div className="my-3 border-t border-dashed border-zinc-400" />

          <div className="space-y-1.5">
            {tx.items.map((line) => (
              <div key={line.product.id}>
                <p>{line.product.name}</p>
                <div className="flex justify-between">
                  <span>
                    {line.qty} {line.product.unit} x {rupiah.format(line.product.price)}
                  </span>
                  <span>{rupiah.format(line.product.price * line.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="my-3 border-t border-dashed border-zinc-400" />

          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{rupiah.format(tx.subtotal)}</span>
            </div>
            {tx.discount > 0 && (
              <div className="flex justify-between">
                <span>Diskon</span>
                <span>-{rupiah.format(tx.discount)}</span>
              </div>
            )}
            {tx.pointsUsed > 0 && (
              <div className="flex justify-between">
                <span>Poin ({tx.pointsUsed})</span>
                <span>-{rupiah.format(tx.pointsDiscount)}</span>
              </div>
            )}
            <div className="my-1 border-t border-dashed border-zinc-400" />
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{rupiah.format(tx.total)}</span>
            </div>
            {tx.method === "tunai" && (
              <>
                <div className="flex justify-between">
                  <span>Dibayar</span>
                  <span>{rupiah.format(tx.paid)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kembali</span>
                  <span>{rupiah.format(tx.change)}</span>
                </div>
              </>
            )}
          </div>

          <div className="my-3 border-t border-dashed border-zinc-400" />

          <div className="text-center">
            <p>Terima kasih atas kunjungan Anda!</p>
            <p>Telur segar setiap hari.</p>
          </div>
        </div>

        <div className="space-y-3 border-t border-border px-5 py-4 print:hidden">
          {sent && (
            <p className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-sm font-medium text-success">
              <CheckIcon width={16} height={16} />
              Struk terkirim ke {sent}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              <PrintIcon width={16} height={16} />
              Cetak
            </button>
            <button
              type="button"
              onClick={() => {
                setDelivery(delivery === "email" ? null : "email");
                setSent(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                delivery === "email"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <MailIcon width={16} height={16} />
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setDelivery(delivery === "wa" ? null : "wa");
                setSent(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                delivery === "wa"
                  ? "bg-success text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <WhatsAppIcon width={16} height={16} />
              WA
            </button>
          </div>

          {delivery && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <label className="sr-only" htmlFor="recipient">
                {delivery === "email" ? "Alamat email" : "Nomor WhatsApp"}
              </label>
              <input
                id="recipient"
                type={delivery === "email" ? "email" : "tel"}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={
                  delivery === "email"
                    ? "pelanggan@email.com"
                    : "08xx xxx xxxx"
                }
                className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none"
              />
              <button
                type="submit"
                disabled={!recipient.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
              >
                Kirim
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function methodLabel(method: CompletedTransaction["method"]) {
  const labels: Record<CompletedTransaction["method"], string> = {
    tunai: "Tunai",
    qris: "QRIS",
    transfer: "Transfer",
  };
  return labels[method];
}