import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { Check, CircleAlert, CircleCheck, CircleX, ClipboardList, Info, PackageCheck, PhoneCall, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { formatDZD } from "@/lib/money";
import { formatDate, formatDateTime } from "@/lib/format";
import { getCommune, getWilaya, wilayaLabel } from "@/lib/algeria";
import { TRACK_STEPS, TRACK_TOKEN, trackStepIndex, type TrackStep } from "@/lib/tracking";
import { cn } from "@/lib/utils";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { LanguageToggle } from "@/components/language-toggle";

// Public page for the customer: what they ordered and where it is. No name, phone or address
// on it, so a forwarded link shows nothing private.
const getOrder = cache((token: string) =>
  TRACK_TOKEN.test(token)
    ? db.order.findUnique({
        where: { trackToken: token },
        select: {
          number: true,
          status: true,
          createdAt: true,
          confirmedAt: true,
          shippedAt: true,
          deliveredAt: true,
          callbackAt: true,
          wilayaCode: true,
          communeId: true,
          communeName: true,
          deliveryType: true,
          stopDeskName: true,
          subtotal: true,
          deliveryFee: true,
          total: true,
          trackingNumber: true,
          courierStatus: true,
          rescueOpen: true,
          items: { select: { id: true, productName: true, quantity: true } },
        },
      })
    : null,
);

const STEP_ICONS: Record<TrackStep, typeof Check> = {
  received: ClipboardList,
  confirmed: PhoneCall,
  shipped: Truck,
  delivered: PackageCheck,
};

const TONES = {
  neutral: "bg-muted/70",
  positive: "bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]",
  warning: "bg-[var(--pill-warning-bg)] text-[var(--pill-warning-ink)]",
  negative: "bg-[var(--pill-negative-bg)] text-[var(--pill-negative-ink)]",
};
const TONE_ICONS = { neutral: Info, positive: CircleCheck, warning: CircleAlert, negative: CircleX };

export async function generateMetadata({ params }: PageProps<"/track/[token]">): Promise<Metadata> {
  const { token } = await params;
  const [order, t] = await Promise.all([getOrder(token), getDictionary()]);
  return {
    title: order ? fill(t.track.title, { number: `#${order.number}` }) : t.track.notFoundTitle,
    robots: { index: false, follow: false },
    // The token is the key: never send it to other sites.
    referrer: "no-referrer",
  };
}

export default async function TrackPage({ params }: PageProps<"/track/[token]">) {
  const { token } = await params;
  const [order, t, locale, settings] = await Promise.all([
    getOrder(token),
    getDictionary(),
    getLocale(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true } }),
  ]);
  if (!order) notFound();

  const tr = t.track;
  const step = trackStepIndex(order.status);
  const stepDates = [order.createdAt, order.confirmedAt, order.shippedAt, order.deliveredAt];

  // Courier could not deliver and the seller is about to call: tell the customer to keep the phone on.
  const failed = order.status === "SHIPPED" && order.rescueOpen;
  const message = failed
    ? tr.status.failed
    : order.status === "CALLBACK"
      ? order.callbackAt
        ? fill(tr.status.CALLBACK, { date: formatDateTime(order.callbackAt, locale) })
        : tr.status.NEW
      : tr.status[order.status];
  const tone: keyof typeof TONES =
    order.status === "DELIVERED"
      ? "positive"
      : order.status === "CANCELLED" || order.status === "RETURNED"
        ? "negative"
        : failed || order.status === "NO_ANSWER"
          ? "warning"
          : "neutral";
  const ToneIcon = TONE_ICONS[tone];

  const wilaya = getWilaya(order.wilayaCode);
  const commune = getCommune(order.wilayaCode, order.communeId);
  const place = [
    wilaya ? wilayaLabel(wilaya, locale) : String(order.wilayaCode),
    commune ? (locale === "ar" ? commune.nameAr : commune.nameFr) : order.communeName,
  ].join(" · ");
  const deliveryText =
    order.deliveryType === "DESK" && order.stopDeskName
      ? `${t.deliveryType.DESK} · ${order.stopDeskName}`
      : t.deliveryType[order.deliveryType];
  const stillToPay = step !== null && step < 3;
  const money = (n: number) => formatDZD(n, locale);

  return (
    <main className="min-h-svh bg-muted/40 px-4 py-6 sm:py-10">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="truncate font-semibold">{settings?.storeName}</p>
          <LanguageToggle />
        </div>

        <div className="rounded-xl border bg-card">
          <div className="border-b p-5">
            <h1 className="text-xl font-semibold">{fill(tr.title, { number: `#${order.number}` })}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{fill(tr.orderedOn, { date: formatDate(order.createdAt, locale) })}</p>
          </div>

          <div className="space-y-5 p-5">
            <div role="status" className={cn("flex gap-3 rounded-lg p-4 text-sm leading-relaxed", TONES[tone])}>
              <ToneIcon className="mt-0.5 size-5 shrink-0" />
              <p>{message}</p>
            </div>

            {step !== null && (
              <ol>
                {TRACK_STEPS.map((key, i) => {
                  const reached = i <= step;
                  const Icon = reached ? Check : STEP_ICONS[key];
                  const at = stepDates[i];
                  return (
                    <li key={key} aria-current={i === step ? "step" : undefined} className="relative flex gap-3 pb-6 last:pb-0">
                      {i < TRACK_STEPS.length - 1 && (
                        <span
                          aria-hidden
                          className={cn("absolute top-8 bottom-0 start-[15px] w-0.5", i < step ? "bg-positive" : "bg-border")}
                        />
                      )}
                      <span
                        className={cn(
                          "relative grid size-8 shrink-0 place-items-center rounded-full border-2",
                          reached
                            ? "border-positive bg-[var(--pill-positive-bg)] text-[var(--pill-positive-ink)]"
                            : "border-border bg-card text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="pt-1">
                        <p className={cn("text-sm", i === step ? "font-semibold" : !reached && "text-muted-foreground")}>
                          {tr.steps[key]}
                        </p>
                        {reached && at && <p className="text-xs text-muted-foreground tabular-nums">{formatDateTime(at, locale)}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border bg-card p-5">
          <h2 className="mb-3 text-base font-semibold">{tr.details}</h2>
          <ul className="space-y-1 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="font-medium">
                {i.productName}
                {i.quantity > 1 && <span className="text-muted-foreground tabular-nums"> ×{i.quantity}</span>}
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">{tr.delivery}</dt>
              <dd className="text-end">
                <p>{place}</p>
                <p className="text-muted-foreground">{deliveryText}</p>
              </dd>
            </div>
            {order.trackingNumber && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{tr.tracking}</dt>
                <dd dir="ltr" className="tabular-nums">
                  {order.trackingNumber}
                </dd>
              </div>
            )}
            {order.courierStatus && order.status === "SHIPPED" && (
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{tr.courierStatus}</dt>
                <dd className="text-end">{order.courierStatus}</dd>
              </div>
            )}
          </dl>

          <dl className="mt-4 space-y-2 rounded-lg bg-muted/60 p-4 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t.orderFields.subtotal}</dt>
              <dd className="tabular-nums">{money(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{t.orderFields.deliveryFee}</dt>
              <dd className="tabular-nums">{money(order.deliveryFee)}</dd>
            </div>
            <div className="flex justify-between gap-2 border-t pt-2 text-base font-semibold">
              <dt>{stillToPay ? tr.toPay : tr.total}</dt>
              <dd className="tabular-nums">{money(order.total)}</dd>
            </div>
          </dl>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">{tr.saveLink}</p>
      </div>
    </main>
  );
}
