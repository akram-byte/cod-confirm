"use client";

import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { useI18n } from "@/i18n/client";
import { formatDZD } from "@/lib/money";

export type ChartDay = { day: string; orders: number; confirmed: number; delivered: number; profit: number };

const label = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** Orders, confirmed and delivered per day. Time always runs left → right. */
export function OrdersChart({ data, className }: { data: ChartDay[]; className?: string }) {
  const { t } = useI18n();
  const config = {
    orders: { label: t.stats.series.orders, color: "oklch(0.68 0.13 235)" },
    confirmed: { label: t.stats.series.confirmed, color: "oklch(0.7 0.15 160)" },
    delivered: { label: t.stats.series.delivered, color: "oklch(0.55 0.15 150)" },
  } satisfies ChartConfig;
  return (
    <div dir="ltr">
      <ChartContainer config={config} className={className ?? "aspect-auto h-64 w-full"}>
        <BarChart data={data} margin={{ left: -20, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickFormatter={label} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => label(String(v))} />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="orders" fill="var(--color-orders)" radius={3} />
          <Bar dataKey="confirmed" fill="var(--color-confirmed)" radius={3} />
          <Bar dataKey="delivered" fill="var(--color-delivered)" radius={3} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/** Profit per day: green above zero, red below. */
export function ProfitChart({ data }: { data: ChartDay[] }) {
  const { t, locale } = useI18n();
  const config = { profit: { label: t.stats.series.profit, color: "oklch(0.6 0.15 155)" } } satisfies ChartConfig;
  return (
    <div dir="ltr">
      <ChartContainer config={config} className="aspect-auto h-64 w-full">
        <BarChart data={data} margin={{ left: 8, right: 4, top: 4 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="day" tickFormatter={label} tickLine={false} axisLine={false} minTickGap={16} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tickFormatter={(v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
          />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(v) => label(String(v))}
                formatter={(value) => <span className="font-medium tabular-nums">{formatDZD(Number(value), locale)}</span>}
              />
            }
          />
          <Bar dataKey="profit" radius={3}>
            {data.map((d) => (
              <Cell key={d.day} fill={d.profit < 0 ? "oklch(0.63 0.2 25)" : "var(--color-profit)"} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
