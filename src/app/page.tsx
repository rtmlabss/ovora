"use client";

import Link from "next/link";
import {
  ChevronRightIcon,
  BoxIcon,
  BuildingIcon,
  CartIcon,
  CheckIcon,
  EggIcon,
  TrophyIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

const FEATURES = [
  {
    icon: CartIcon,
    title: "POS Penjualan",
    desc: "Kasir cepat dengan katalog produk dan struk otomatis. Barang keluar-masuk tercatat begitu transaksi selesai.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: WalletIcon,
    title: "Pencatatan Keuangan",
    desc: "Pemasukan, pengeluaran, dan laba tersaji di satu dasbor. Lihat alur uang toko Anda tanpa pindah aplikasi.",
    accent: "bg-secondary/15 text-secondary",
  },
  {
    icon: BoxIcon,
    title: "Manajemen Stok",
    desc: "Kontrol persediaan telur tiap cabang, dengan tanda saat stok mau habis dan riwayat barang keluar-masuk.",
    accent: "bg-tertiary/10 text-tertiary",
  },
  {
    icon: UsersIcon,
    title: "Membership & Poin",
    desc: "Bangun pelanggan setia lewat kartu anggota dan poin yang terakumulasi dari tiap pembelian.",
    accent: "bg-quaternary/10 text-quaternary",
  },
  {
    icon: TrophyIcon,
    title: "Leaderboard Reward",
    desc: "Rayakan pelanggan terbaik bulan ini dan beri hadiah dari daftar pemenang yang otomatis terhitung.",
    accent: "bg-primary/10 text-primary",
  },
  {
    icon: BuildingIcon,
    title: "Multi Cabang",
    desc: "Pantau kinerja seluruh cabang — stok, penjualan, dan perbandingan omzet — dari satu layar.",
    accent: "bg-secondary/15 text-secondary",
  },
] as const;

const STEPS = [
  {
    n: "1",
    title: "Buat akun toko",
    desc: "Daftar dan siapkan profil toko, daftar cabang, serta pengguna (pemilik, manajer, kasir) untuk tim Anda.",
  },
  {
    n: "2",
    title: "Isi katalog & stok",
    desc: "Masukkan produk telur dan stok awal tiap cabang. Daftarkan pelanggan sebagai member agar poin terkumpul.",
  },
  {
    n: "3",
    title: "Jualan & pantau",
    desc: "Proses penjualan lewat POS, pantau keuangan dan stok tiap cabang, lalu dorong penjualan lewat reward.",
  },
] as const;

function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <EggIcon width={20} height={20} />
          </span>
          <p className="text-base font-bold tracking-tight">ovora.id</p>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground sm:flex">
          {[
            ["Fitur", "#fitur"],
            ["Cara Kerja", "#cara-kerja"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="transition-colors hover:text-foreground">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Masuk
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Coba Gratis
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeroMock() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-full bg-primary/15 blur-3xl"
      />
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-stone-200/60">
        <div className="flex items-center gap-1.5 border-b border-border bg-muted/60 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <p className="ml-3 text-xs text-muted-foreground">dasbor — ringkasan</p>
          <span className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            data tiruan
          </span>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Penjualan hari ini</p>
              <p className="font-display text-2xl font-bold tracking-tight">Rp 1.284.500</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              <CheckIcon width={13} height={13} /> +12%
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Transaksi", "48"],
              ["Stok (pcs)", "1.920"],
              ["Poin terbit", "642"],
            ].map(([label, val]) => (
              <div key={label} className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="mt-1 font-display text-base font-bold tracking-tight">{val}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Pemenang reward bulan ini</p>
              <TrophyIcon width={14} height={14} className="text-secondary" />
            </div>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                Bu
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">Bu Sari</p>
                <p className="text-xs text-muted-foreground">1.240 poin — Toko Utama</p>
              </div>
              <span className="rounded-full bg-secondary/15 px-2 py-1 text-[11px] font-medium text-secondary">
                Hadiah
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Nav />

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Toko telur yang rapi, dari kasir sampai jadi laba
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
              ovora.id memadukan POS, keuangan, stok, membership poin, dan monitoring
              multi-cabang untuk usaha telur Anda — dalam satu tampilan yang sederhana.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                Mulai sekarang
                <ChevronRightIcon width={16} height={16} />
              </Link>
              <Link
                href="#fitur"
                className="rounded-lg border border-border bg-card px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
              >
                Lihat fitur
              </Link>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">
              Peran pemilik, manajer, dan kasir dengan hak akses sesuai jabatan.
            </p>
          </div>
          <HeroMock />
        </section>

        <section id="fitur" className="border-t border-border bg-card/50 px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
              Satu aplikasi untuk seluruh urusan dagang telur
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Enam modul yang saling terhubung, jadi tidak ada data yang tertinggal
              atau ditulis dua kali.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="group">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${f.accent}`}
                    >
                      <Icon width={22} height={22} />
                    </span>
                    <p className="mt-4 font-display text-lg font-bold tracking-tight">{f.title}</p>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="cara-kerja" className="px-5 py-16 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display max-w-lg text-3xl font-bold tracking-tight sm:text-4xl">
              Mulai dalam tiga langkah
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
              {STEPS.map((s) => (
                <div key={s.n} className="relative border-t-2 border-border pt-6">
                  <span className="font-display text-sm font-bold text-primary">{s.n}</span>
                  <p className="mt-2 font-display text-lg font-bold tracking-tight">{s.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="cabang" className="border-t border-border bg-primary px-5 py-16 text-primary-foreground sm:py-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
            <h2 className="font-display max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
              Siap membawa toko telur Anda makin tertata?
            </h2>
            <p className="max-w-md text-sm text-primary-foreground/80 sm:text-base">
              Masuk dan mulai kelola kasir, stok, dan cabang dari satu tempat.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-transform hover:scale-[1.02]"
            >
              Masuk ke dashboard
              <ChevronRightIcon width={16} height={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <EggIcon width={16} height={16} className="text-primary" />
            <p className="text-sm font-medium">ovora.id</p>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} ovora.id — Manajemen Toko Telur
          </p>
        </div>
      </footer>
    </div>
  );
}

