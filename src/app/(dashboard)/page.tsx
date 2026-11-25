import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Check, LifeBuoy, PhoneCall, ShoppingCart, Truck, type LucideIcon } from "lucide-react";
import { PageIntro } from "@/components/page-intro";
import { KpiStrip } from "@/components/stats/kpi-strip";
import { OrderJourney } from "@/components/stats/order-outcomes";
import { countAbandoned, countToConfirm, countToRescue } from "@/lib/today-counts";
import { addDays, getStats, todayKey } from "@/lib/stats";
import { formatDZD } from "@/lib/money";
import { formatPercent, startOfDay } from "@/lib/format";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.dashboard.title };
}

type Task = {
  key: string;
  icon: LucideIcon;
  count: number;
  href: string;
  title: string;
  text: string;
  action: string;
  urgent?: boolean;
};

// Screen question: "What do I have to do now?" — one big card per job, numbers after.
export default async function DashboardHome() {
  const today = todayKey();
  const [t, locale, todayOrders, toConfirm, abandoned, toShip, toRescue, month] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.order.count({ where: { createdAt: { gte: startOfDay(today)! } } }),
    countToConfirm(),
    countAbandoned(),
    db.order.count({ where: { status: "CONFIRMED" } }),
    countToRescue(),
    getStats({ from: addDays(today, -29), to: today }),
  ]);

  const finding =
    toConfirm > 0
      ? `${fill(t.home.findingWaiting, { count: toConfirm })} · ${fill(t.home.findingToday, { count: todayOrders })}`
      : t.home.findingClear;

  const tasks: Task[] = [
    { key: "call", icon: PhoneCall, count: toConfirm, href: "/confirmation", ...t.home.tasks.call },
    { key: "rescue", icon: LifeBuoy, count: toRescue, href: "/rescue", urgent: true, ...t.home.tasks.rescue },
    { key: "abandoned", icon: ShoppingCart, count: abandoned, href: "/confirmation/abandoned", ...t.home.tasks.abandoned },
    { key: "ship", icon: Truck, count: toShip, href: "/delivery", ...t.home.tasks.ship },
  ];

  return (
    <>
      <PageIntro title={t.pages.dashboard.title} description={finding} />

      <h2 className="sr-only">{t.home.tasks.title}</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {tasks.map((task) => (
          <li key={task.key}>
            <TaskCard task={task} done={t.home.tasks.done} />
          </li>
        ))}
      </ul>

      <h2 className="mt-8 mb-3 text-base font-semibold">{t.home.tasks.last30}</h2>
      <KpiStrip
        items={[
          { label: t.cards.confirmationRate, value: formatPercent(month.confirmationRate, locale) },
          {
            label: t.cards.returnRate,
            value: formatPercent(month.returnRate, locale),
            tone: month.returnRate !== null && month.returnRate > 0.25 ? "bad" : undefined,
          },
          {
            label: t.cards.profit,
            value: formatDZD(month.profit, locale),
            tone: month.profit < 0 ? "bad" : undefined,
            lead: true,
          },
        ]}
      />
      <div className="mt-3">
        <OrderJourney
          t={t}
          locale={locale}
          data={{
            orders: month.orders,
            pending: month.pending,
            cancelled: month.cancelled,
            confirmed: month.confirmed,
            shipped: month.shipped,
            delivered: month.delivered,
            returned: month.returned,
            sales: month.sales,
            returnCosts: month.returnCosts,
          }}
        />
      </div>
    </>
  );
}

/** One job: a big number, what it means in plain words, and the one button that does it. */
function TaskCard({ task, done }: { task: Task; done: string }) {
  const Icon = task.icon;
  const active = task.count > 0;
  const hot = active && task.urgent;

  if (!active) {
    return (
      <div className="flex h-full items-center gap-4 rounded-xl bg-card p-5 ring-1 ring-border">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0">
          <p className="text-base font-semibold">{task.title}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[15px] text-muted-foreground">
            <Check className="size-4 text-positive" />
            {done}
          </p>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={task.href}
      className={cn(
        "group flex h-full flex-col gap-4 rounded-xl bg-card p-5 ring-1 transition-shadow duration-150 outline-none hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        hot ? "ring-destructive/50" : "ring-border",
      )}
    >
      <div className="flex items-start gap-4">
        <span
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full",
            hot ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
          )}
        >
          <Icon className="size-6" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold">{task.title}</p>
          <p className="mt-0.5 text-[15px] text-muted-foreground">{task.text}</p>
        </div>
        <span className={cn("text-4xl leading-none font-bold tabular-nums", hot && "text-destructive")}>{task.count}</span>
      </div>
      <span
        className={cn(
          "mt-auto flex h-12 items-center justify-center gap-2 rounded-lg text-base font-semibold transition-colors duration-150",
          hot
            ? "bg-destructive text-white group-hover:bg-destructive/90"
            : "bg-primary text-primary-foreground group-hover:bg-primary/90",
        )}
      >
        {task.action}
        <ArrowLeft className="size-5 ltr:rotate-180" />
      </span>
    </Link>
  );
}
