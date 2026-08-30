import { ReceiptIcon, TrendingDownIcon, TrendingUpIcon } from "@/components/icons";

type Tone = "primary" | "success" | "error";

export interface TodaySummaryData {
  penjualan: { amount: number; helper: string; changePct: number };
  pengeluaran: { amount: number; helper: string; changePct: number };
  laba: { amount: number; helper: string; changePct: number };
}

export const TODAY_SUMMARY_STUB: TodaySummaryData = {
  penjualan: {
    amount: 1_250_000,
    helper: "24 transaksi hari ini",
    changePct: 12.5,
  },
  pengeluaran: {
    amount: 420_000,
    helper: "5 catatan pengeluaran hari ini",
    changePct: -4.2,
  },
  laba: {
    amount: 830_000,
    helper: "Penjualan dikurangi pengeluaran",
    changePct: 18.3,
  },
};

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const TONE_STYLES: Record<
  Tone,
  { iconBg: string; value: string; changeGood: boolean }
> = {
  primary: { iconBg: "bg-primary/10 text-primary", value: "text-foreground", changeGood: true },
  success: { iconBg: "bg-success/10 text-success", value: "text-success", changeGood: true },
  error: { iconBg: "bg-error/10 text-error", value: "text-foreground", changeGood: false },
};

function Card({
  label,
  amount,
  helper,
  changePct,
  tone,
  icon,
}: {
  label: string;
  amount: number;
  helper: string;
  changePct: number;
  tone: Tone;
  icon: React.ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  const up = changePct >= 0;
  const positiveForTone = up === styles.changeGood;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${styles.value}`}>
            {rupiah.format(amount)}
          </p>
        </div>
        <span className={`rounded-lg p-3 ${styles.iconBg}`}>{icon}</span>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs">
        <span
          className={`inline-flex items-center gap-1 font-medium ${
            positiveForTone ? "text-success" : "text-error"
          }`}
        >
          {up ? "▲" : "▼"} {Math.abs(changePct).toLocaleString("id-ID")}%
        </span>
        <span className="text-muted-foreground">{helper}</span>
      </div>
    </div>
  );
}

export function TodaySummary({ data = TODAY_SUMMARY_STUB }: { data?: TodaySummaryData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        label="Total Penjualan"
        amount={data.penjualan.amount}
        helper={data.penjualan.helper}
        changePct={data.penjualan.changePct}
        tone="primary"
        icon={<TrendingUpIcon width={20} height={20} />}
      />
      <Card
        label="Total Pengeluaran"
        amount={data.pengeluaran.amount}
        helper={data.pengeluaran.helper}
        changePct={data.pengeluaran.changePct}
        tone="error"
        icon={<TrendingDownIcon width={20} height={20} />}
      />
      <Card
        label="Laba Hari Ini"
        amount={data.laba.amount}
        helper={data.laba.helper}
        changePct={data.laba.changePct}
        tone="success"
        icon={<ReceiptIcon width={20} height={20} />}
      />
    </div>
  );
}