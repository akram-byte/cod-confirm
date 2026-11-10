"use client";

import dynamic from "next/dynamic";

// The chart library loads after the screen is on view, so numbers and lists appear first.
// The placeholder holds the chart's real height: nothing shifts when it lands.
const Placeholder = ({ h }: { h: string }) => <div className={`${h} w-full rounded-md bg-muted`} />;

export const OrdersChart = dynamic(() => import("./charts").then((m) => m.OrdersChart), {
  ssr: false,
  loading: () => <Placeholder h="h-56" />,
});

export const ProfitChart = dynamic(() => import("./charts").then((m) => m.ProfitChart), {
  ssr: false,
  loading: () => <Placeholder h="h-64" />,
});
