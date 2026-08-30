"use client";

import { useState } from "react";
import { CheckIcon, UserPlusIcon } from "@/components/icons";
import { POINT_VALUE, rupiah } from "@/lib/pos";
import type { Member } from "@/lib/membership";

export function MemberAddForm({ onAdd }: { onAdd: (member: Member) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Nama member wajib diisi");
      return;
    }
    if (!phone.trim()) {
      setError("Nomor telepon wajib diisi");
      return;
    }
    const pointsNum = Number(points);
    if (points !== "" && (!Number.isInteger(pointsNum) || pointsNum < 0)) {
      setError("Poin awal harus angka >= 0");
      return;
    }

    onAdd({
      id: Date.now(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || "-",
      points: points === "" ? 0 : pointsNum,
      joinedAt: new Date().toISOString().slice(0, 10),
    });

    setName("");
    setPhone("");
    setEmail("");
    setPoints("");
    setError(null);
    setMsg(`Member "${name.trim()}" berhasil ditambahkan (contoh)`);
    window.setTimeout(() => setMsg(null), 4000);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-foreground">
        <UserPlusIcon width={18} height={18} className="text-primary" />
        Tambah Member
      </h2>
      <p className="mb-3 text-xs text-muted-foreground">
        Daftarkan pelanggan baru untuk mulai mengumpulkan poin.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            Nama Lengkap <span className="text-error">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Budi Santoso"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            Nomor Telepon <span className="text-error">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Contoh: 081234567890"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Contoh: budi@example.com"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted-foreground">
            Poin Awal{" "}
            <span className="text-muted-foreground/70">
              ({rupiah.format(POINT_VALUE)} / poin)
            </span>
          </label>
          <input
            type="number"
            min="0"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="Contoh: 0"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
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
          className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Simpan Member
        </button>
      </form>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Menyimpan dalam memori (contoh) sampai API member selesai.
      </p>
    </div>
  );
}