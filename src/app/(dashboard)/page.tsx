import type { Metadata } from "next";
import { CircleDollarSign, PackageOpen, PhoneCall, ShoppingBag, TrendingUp, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { getDictionary } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages.dashboard.title };
}

export default async function DashboardHome() {
  const t = await getDictionary();
  // Real numbers come in Phase 5 (stats). Layout only for now.
  const cards = [
    { label: t.cards.todayOrders, icon: ShoppingBag },
    { label: t.cards.toConfirm, icon: PhoneCall },
    { label: t.cards.confirmationRate, icon: TrendingUp },
    { label: t.cards.returnRate, icon: Undo2 },
    { label: t.cards.profit, icon: CircleDollarSign },
  ];

  return (
    <>
      <PageIntro description={t.pages.dashboard.description} />
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5">
        {cards.map((c, i) => (
          <Card key={c.label} className={i === cards.length - 1 ? "col-span-2 lg:col-span-1" : undefined}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">—</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <EmptyState icon={PackageOpen} title={t.empty.title} description={t.empty.soon} />
      </div>
    </>
  );
}
