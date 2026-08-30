"use client";

import { useState } from "react";

export interface TrendPoint {
  label: string;
  value: number;
}

export const SALES_TREND_STUB: TrendPoint[] = [
  { label: "Sen 24", value: 980_000 },
  { label: "Sel 25", value: 1_150_000 },
  { label: "Rab 26", value: 860_000 },
  { label: "Kam 27", value: 1_320_000 },
  { label: "Jum 28", value: 1_540_000 },
  { label: "Sab 29", value: 1_480_000 },
  { label: "Min 30", value: 1_250_000 },
];

const WIDTH = 560;
const HEIGHT = 240;
const PAD = { top: 16, right: 12, bottom: 28, left: 52 };

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function toPath(points: TrendPoint[], valueToY: (v: number) => number, x: (i: number) => number) {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${valueToY(p.value)}`).join(" ");
}

export function SalesTrendChart({ data = SALES_TREND_STUB }: { data?: TrendPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = Math.max(...data.map((d) => d.value)) * 1.1;
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const stepX = innerW / (data.length - 1);
  const x = (i: number) => PAD.left + stepX * i;
  const valueToY = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD.top + innerH - f * innerH,
    value: max * f,
  }));

  return (
    <div className="w-full">
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          width="100%"
          height={HEIGHT}
          role="img"
          aria-label="Grafik tren penjualan 7 hari terakhir"
          className="min-w-[420px]"
          onMouseLeave={() => setHovered(null)}
        >
          {gridTicks.map((tick) => (
            <g key={tick.y}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={tick.y}
                y2={tick.y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="4 4"
              />
              <text
                x={PAD.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                fontSize={10}
                className="fill-muted-foreground"
              >
                {rupiah.format(tick.value).replace(",00", "")}
              </text>
            </g>
          ))}

          <path
            d={`${toPath(data, valueToY, x)} L${x(data.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`}
            fill="currentColor"
            className="text-primary/15"
          />
          <path
            d={toPath(data, valueToY, x)}
            fill="none"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          />

          {data.map((point, i) => {
            const cx = x(i);
            const cy = valueToY(point.value);
            const isActive = hovered === i;
            return (
              <g key={point.label}>
                {isActive && (
                  <>
                    <line
                      x1={cx}
                      x2={cx}
                      y1={PAD.top}
                      y2={PAD.top + innerH}
                      stroke="currentColor"
                      className="text-border"
                      strokeDasharray="3 3"
                    />
                    <rect
                      x={Math.min(Math.max(cx - 58, PAD.left), WIDTH - PAD.right - 116)}
                      y={Math.max(cy - 44, 2)}
                      width={116}
                      height={36}
                      rx={6}
                      className="fill-foreground"
                    />
                    <text
                      x={Math.min(Math.max(cx, PAD.left + 58), WIDTH - PAD.right - 58)}
                      y={Math.max(cy - 21, 19)}
                      textAnchor="middle"
                      fontSize={11}
                      fontWeight={600}
                      className="fill-background"
                    >
                      {point.label}
                    </text>
                    <text
                      x={Math.min(Math.max(cx, PAD.left + 58), WIDTH - PAD.right - 58)}
                      y={Math.max(cy - 21, 19) + 14}
                      textAnchor="middle"
                      fontSize={11}
                      className="fill-background/80"
                    >
                      {rupiah.format(point.value)}
                    </text>
                  </>
                )}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isActive ? 5 : 3.5}
                  className={isActive ? "fill-primary" : "fill-card stroke-primary"}
                  strokeWidth={2}
                  onMouseEnter={() => setHovered(i)}
                />
              </g>
            );
          })}

          {data.map((point, i) => (
            <text
              key={`${point.label}-x`}
              x={x(i)}
              y={HEIGHT - 8}
              textAnchor="middle"
              fontSize={10}
              className="fill-muted-foreground"
            >
              {point.label.split(" ")[0]}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}