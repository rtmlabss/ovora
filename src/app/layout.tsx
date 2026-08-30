import type { Metadata } from "next";
import { Plus_Jakarta_Sans as Display } from "next/font/google";
import "./globals.css";

const display = Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ovora.id — Manajemen Toko Telur",
    template: "%s | ovora.id",
  },
  description: "WebApp POS untuk toko retail telur: kasir, keuangan, stok, membership, dan monitoring cabang.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${display.variable} min-h-screen bg-background text-foreground font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}