"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EggIcon, MailIcon, CheckIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error ?? "Gagal masuk");
      }
    } catch {
      setError("Terjadi kesalahan, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <EggIcon width={26} height={26} />
          </span>
          <h1 className="mt-3 text-2xl font-bold">ovora.id</h1>
          <p className="text-sm text-muted-foreground">
            Masuk untuk mengelola toko telur Anda
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <label className="mb-1 block text-sm font-medium text-foreground">Email</label>
          <div className="relative mb-4">
            <MailIcon
              width={16}
              height={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pemilik@ovora.id"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
              autoComplete="email"
            />
          </div>

          <label className="mb-1 block text-sm font-medium text-foreground">Kata Sandi</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mb-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            autoComplete="current-password"
          />

          {error ? (
            <p className="mb-3 rounded-lg bg-error/10 px-3 py-2 text-xs font-medium text-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>

          <p className="mt-4 flex items-center gap-1 text-[11px] text-muted-foreground">
            <CheckIcon width={12} height={12} /> Demo: pemilik@ovora.id / ovora123
          </p>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Autentikasi terhubung ke API login pengguna.
        </p>
      </div>
    </div>
  );
}
