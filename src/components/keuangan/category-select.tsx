"use client";

import { TrendingDownIcon, TrendingUpIcon } from "@/components/icons";
import { CATEGORIES_BY_TYPE, type CashType } from "@/lib/keuangan";

export function CategorySelect({
  type,
  value,
  onChange,
  disabled = false,
  id,
}: {
  type: CashType;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const Icon = type === "pemasukan" ? TrendingUpIcon : TrendingDownIcon;
  return (
    <div className="relative">
      <Icon
        width={16}
        height={16}
        className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
          type === "pemasukan" ? "text-success" : "text-error"
        }`}
      />
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-border bg-background py-2 pl-9 pr-8 text-sm text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="" disabled>
          -- Pilih Kategori --
        </option>
        {CATEGORIES_BY_TYPE[type].map((category) => (
          <option key={category.value} value={category.value}>
            {category.label}
          </option>
        ))}
      </select>
      <svg
        width={16}
        height={16}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}