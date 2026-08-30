"use client";

export const RANGES = ["Harian", "Mingguan", "Bulanan", "Tahunan"] as const;

export type RangeValue = (typeof RANGES)[number];

export function RangeFilter({
  value,
  onChange,
}: {
  value: RangeValue;
  onChange: (range: RangeValue) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {RANGES.map((range) => {
        const isActive = value === range;
        return (
          <button
            key={range}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(range)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isActive
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/15"
            }`}
          >
            {range}
          </button>
        );
      })}
    </div>
  );
}