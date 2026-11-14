import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  Check,
  ChevronDown,
  ClipboardList,
  Megaphone,
  MessageCircle,
  PackageCheck,
  Phone,
  Truck,
  Wallet,
} from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { StatusBadge } from "@/components/status-badge";
import { KpiStrip } from "@/components/stats/kpi-strip";
import { ProfitChart } from "@/components/stats/lazy-charts";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { formatDZD } from "@/lib/money";
import { formatPercent } from "@/lib/format";
import { normalizePhone, toInternational } from "@/lib/phone";
import { cn } from "@/lib/utils";
import {
  AdLinkCard,
  CallCard,
  CallMini,
  CourierMini,
  CustomersScreen,
  DeliveryScreen,
  FlaggedOrders,
  Frag,
  MONTH,
  OrderFormCard,
  OrderProfitCard,
  PROFIT,
  PhoneScreen,
  QueueScreen,
  TelegramAlert,
  TrailCard,
  profitDays,
  type FragProps,
} from "./fragments";
import "./landing.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: { absolute: t.landing.metaTitle }, description: t.landing.metaDescription };
}

/** wa.me link to CONTACT_WHATSAPP (any Algerian format) with the greeting filled in. */
function whatsappHref(text: string) {
  const raw = process.env.CONTACT_WHATSAPP?.trim() ?? "";
  const local = normalizePhone(raw);
  const number = local ? toInternational(local) : raw.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

const WRAP = "mx-auto w-full max-w-[1360px] px-4 sm:px-6 lg:px-10";
const H2 = "text-[clamp(30px,4vw,56px)] leading-[1.05] font-bold tracking-[-0.03em] text-balance";
const LEAD = "text-[17px] leading-relaxed md:text-lg";

function Contact({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ size: "lg" }), "h-12 gap-2 px-5 text-base hover:-translate-y-px", className)}
    >
      <MessageCircle className="size-5" />
      {label}
    </a>
  );
}

const STEPS = [
  { id: "ad", Icon: Megaphone, Frag: AdLinkCard },
  { id: "form", Icon: ClipboardList, Frag: OrderFormCard },
  { id: "alert", Icon: BellRing, Frag: TelegramAlert },
  { id: "call", Icon: Phone, Frag: CallMini },
  { id: "courier", Icon: Truck, Frag: CourierMini },
  { id: "outcome", Icon: PackageCheck, Frag: TrailCard },
  { id: "profit", Icon: Wallet, Frag: OrderProfitCard },
] as const;

export default async function LandingPage() {
  const t = await getDictionary();
  const locale = await getLocale();
  const L = t.landing;
  const p: FragProps = { t, locale };
  const wa = whatsappHref(L.whatsappText);
  const num = new Intl.NumberFormat(locale === "ar" ? "ar-DZ-u-nu-latn" : "fr-DZ", { maximumFractionDigits: 0 });
  const unit = locale === "ar" ? "د.ج" : "DA";

  const ledger = [
    { label: t.stats.sales, v: MONTH.sales, sign: "" },
    { label: t.stats.productCost, v: MONTH.productCost, sign: "−" },
    { label: t.stats.deliveryFees, v: MONTH.deliveryFees, sign: "−" },
    { label: t.stats.returnCosts, v: MONTH.returnCosts, sign: "−" },
    { label: t.stats.adSpend, v: MONTH.adSpend, sign: "−" },
  ];
  const kpis = [
    { label: t.stats.orders, value: String(MONTH.orders), hint: fill(t.stats.pending, { count: MONTH.waiting }) },
    {
      label: t.stats.confirmationRate,
      value: formatPercent(MONTH.confirmed / (MONTH.confirmed + MONTH.cancelled), locale),
      hint: t.stats.confirmationHint,
    },
    {
      label: t.stats.deliveryRate,
      value: formatPercent(MONTH.delivered / (MONTH.delivered + MONTH.returned), locale),
      hint: t.stats.deliveryHint,
    },
    {
      label: t.stats.returnRate,
      value: formatPercent(MONTH.returned / (MONTH.delivered + MONTH.returned), locale),
      hint: t.stats.returnHint,
    },
    { label: t.stats.profit, value: formatDZD(PROFIT, locale), lead: true, tone: "good" as const },
  ];

  return (
    <div className="min-h-svh overflow-x-clip bg-frame text-foreground">
      {/* ---------- Header ---------- */}
      <header className={cn(WRAP, "flex h-16 items-center justify-between gap-3")} id="top">
        <Link href="/landing" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <Wordmark className="h-6 sm:h-7" title={t.app.name} />
        </Link>
        <nav aria-label={L.nav.label} className="hidden items-center gap-1 text-[15px] lg:flex">
          {(
            [
              ["#how", L.nav.how],
              ["#features", L.nav.features],
              ["#faq", L.nav.faq],
            ] as const
          ).map(([href, label]) => (
            <a key={href} href={href} className="rounded-md px-3 py-2 hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
              {label}
            </a>
          ))}
          <Link href="/login" className="rounded-md px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none">
            {L.nav.login}
          </Link>
        </nav>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LanguageToggle />
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: "lg" }), "ms-1 hidden sm:inline-flex")}
          >
            <MessageCircle />
            {L.nav.contact}
          </a>
        </div>
      </header>

      <main>
        {/* ---------- Hero ---------- */}
        <section className={cn(WRAP, "grid gap-10 pt-8 pb-24 md:pt-14 lg:grid-cols-12 lg:gap-x-10 lg:pb-36")}>
          <div className="lg:col-span-7 lg:pt-6">
            <h1 className="text-[8.2vw] leading-[1.04] font-bold tracking-[-0.035em] sm:text-[6.6vw] lg:text-[4.9vw] 2xl:text-[76px]">
              <span className={"lp-line"}>
                <span>{L.hero.line1}</span>
              </span>
              <span className={"lp-line"}>
                <span>
                  {L.hero.line2Before}{" "}
                  <StatusBadge
                    status="DELIVERED"
                    label={L.hero.line2Pill}
                    className="h-[0.92em] gap-[0.14em] px-[0.34em] align-[0.08em] text-[0.62em] font-bold tracking-[-0.02em] [&_svg]:size-[0.72em]"
                  />
                  {L.hero.line2After === "." ? "." : ` ${L.hero.line2After}`}
                </span>
              </span>
            </h1>
            <p className={cn("lp-after", "mt-8 max-w-[34rem] text-lg leading-relaxed md:text-xl md:leading-relaxed")}>{L.hero.lead}</p>
            <div className={cn("lp-after", "mt-8 flex flex-wrap items-center gap-x-5 gap-y-3")}>
              <Contact href={wa} label={L.hero.cta} />
              <a href="#how" className="rounded-md py-2 text-[15px] font-medium text-primary underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50">
                {L.hero.secondary}
              </a>
            </div>
            <p className={cn("lp-after", "mt-8 text-sm text-muted-foreground")}>{L.hero.facts}</p>
          </div>
          <Frag caption={L.hero.caption} className={cn("lp-after-late", "lg:col-span-5")}>
            <CallCard {...p} />
          </Frag>
        </section>

        {/* ---------- Why: four plain reasons ---------- */}
        <section aria-labelledby="why-title" className={cn(WRAP, "grid gap-10 pb-24 lg:grid-cols-12 lg:gap-x-10 lg:pb-36")}>
          <h2 id="why-title" className={cn(H2, "lp-reveal", "lg:col-span-4")}>
            {L.why.title}
          </h2>
          <ul className="grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:col-span-8">
            {Object.values(L.why.items).map((item, i) => (
              <li key={item.title} className={cn(i % 2 ? "lp-reveal3" : "lp-reveal2", "flex gap-4")}>
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-hue-soft text-data">
                  <Check className="size-4" strokeWidth={3} aria-hidden />
                </span>
                <div>
                  <h3 className="text-[21px] leading-snug font-bold tracking-[-0.01em]">{item.title}</h3>
                  <p className="mt-2 text-[17px] leading-relaxed">{item.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* ---------- Journey: the one interactive part ---------- */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-4 bg-hue-soft py-24 lg:pt-36 lg:pb-28">
          <div className={WRAP}>
            <div className="grid gap-4 lg:grid-cols-12 lg:items-end">
              <h2 id="how-title" className={cn(H2, "lp-reveal", "text-hue-ink lg:col-span-7")}>
                {L.journey.title}
              </h2>
              <p className={cn(LEAD, "lp-reveal2", "text-hue-ink lg:col-span-4 lg:col-start-9")}>{L.journey.lead}</p>
            </div>

            <div className={cn("lp-journey", "mt-12 lg:mt-16")}>
              <fieldset className="min-w-0">
                <legend className="sr-only">{L.journey.legend}</legend>
                <div className="flex flex-wrap gap-1.5">
                  {STEPS.map(({ id, Icon }, i) => (
                    <label
                      key={id}
                      className={cn(
                        "relative flex min-h-12 flex-[1_1_9rem] lg:min-h-14 cursor-pointer items-center gap-2 rounded-lg bg-card px-4 text-[15px] font-medium text-foreground transition-[background-color,color,transform] duration-200",
                        "hover:bg-card/70 active:scale-[0.98]",
                        "has-checked:bg-primary has-checked:text-primary-foreground",
                        "has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      )}
                    >
                      <input type="radio" name="journey" value={id} defaultChecked={i === 0} className="sr-only" />
                      <Icon className="size-4 shrink-0" aria-hidden />
                      {L.journey.steps[id].name}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-8 lg:mt-12 lg:min-h-[29rem]">
                {STEPS.map(({ id, Frag: Piece }) => (
                  <div
                    key={id}
                    data-panel={id}
                    className="grid gap-8 py-4 lg:grid-cols-12 lg:items-start lg:gap-x-10 lg:py-0"
                  >
                    <div className="lg:col-span-5 lg:pt-4">
                      <h3 className="text-[26px] leading-tight font-bold tracking-[-0.02em] text-hue-ink md:text-[32px]">
                        {L.journey.steps[id].title}
                      </h3>
                      <p className="mt-4 max-w-[30rem] text-[17px] leading-relaxed text-foreground md:text-lg">
                        {L.journey.steps[id].text}
                      </p>
                    </div>
                    <Frag caption={L.journey.steps[id].title} className="w-full max-w-[28rem] lg:col-span-6 lg:col-start-7">
                      <Piece {...p} />
                    </Frag>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- Confirm faster ---------- */}
        <section id="features" aria-labelledby="confirm-title" className={cn(WRAP, "grid scroll-mt-4 gap-10 py-24 lg:grid-cols-12 lg:gap-x-10 lg:py-40")}>
          <div className="lg:col-span-4">
            <h2 id="confirm-title" className={cn(H2, "lp-reveal")}>
              {L.confirm.title}
            </h2>
            <p className={cn(LEAD, "lp-reveal2", "mt-6")}>{L.confirm.lead}</p>
            <ul className={cn("lp-reveal3", "mt-8 space-y-3 text-[16px]")}>
              {Object.values(L.confirm.points).map((pt) => (
                <li key={pt} className="flex gap-2.5">
                  <Check className="mt-1 size-4 shrink-0 text-data" strokeWidth={3} aria-hidden />
                  {pt}
                </li>
              ))}
            </ul>
          </div>
          <Frag caption={L.confirm.caption} className={cn("lp-reveal2", "lg:col-span-8")}>
            <QueueScreen {...p} />
          </Frag>
        </section>

        {/* ---------- Stop bad orders ---------- */}
        <section aria-labelledby="risk-title" className={cn(WRAP, "pb-24 lg:pb-40")}>
          <div className="grid gap-6 lg:grid-cols-12 lg:gap-x-10">
            <h2 id="risk-title" className={cn(H2, "lp-reveal", "lg:col-span-6")}>
              {L.risk.title}
            </h2>
            <p className={cn(LEAD, "lp-reveal2", "lg:col-span-5 lg:col-start-8 lg:pt-2")}>{L.risk.lead}</p>
          </div>
          <Frag caption={L.risk.caption} className={cn("lp-reveal3", "mt-12 lg:mt-16")}>
            <div className="grid gap-4 lg:grid-cols-12 lg:gap-x-10">
              <div className="lg:col-span-7">
                <CustomersScreen {...p} />
              </div>
              <div className="lg:col-span-5">
                <FlaggedOrders {...p} />
              </div>
            </div>
          </Frag>
        </section>

        {/* ---------- Ship in one click ---------- */}
        <section aria-labelledby="ship-title" className="bg-card py-24 lg:py-36">
          <div className={cn(WRAP, "grid gap-10 lg:grid-cols-12 lg:gap-x-10")}>
            <div className="lg:col-span-4">
              <h2 id="ship-title" className={cn(H2, "lp-reveal")}>
                {L.ship.title}
              </h2>
              <p className={cn(LEAD, "lp-reveal2", "mt-6")}>{L.ship.lead}</p>
              <p className={cn("lp-reveal3", "mt-6 text-[16px] text-muted-foreground")}>{L.ship.other}</p>
            </div>
            <Frag caption={L.ship.caption} className={cn("lp-reveal2", "lg:col-span-8 lg:pt-2")}>
              <div className="rounded-2xl bg-frame p-3 sm:p-5">
                <DeliveryScreen {...p} />
              </div>
            </Frag>
          </div>
        </section>

        {/* ---------- Real profit ---------- */}
        <section aria-labelledby="profit-title" className={cn(WRAP, "py-24 lg:py-40")}>
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
            <div className="lg:col-span-5 lg:self-center">
              <h2 id="profit-title" className={cn(H2, "lp-reveal")}>
                {L.profit.title}
              </h2>
              <p className={cn(LEAD, "lp-reveal2", "mt-6")}>{L.profit.lead}</p>
            </div>
            <figure data-ui className={cn("lp-reveal2", "lg:col-span-6 lg:col-start-7")}>
              <figcaption className="mb-4 text-sm text-muted-foreground">
                {L.profit.period} · {unit}
              </figcaption>
              <dl className="space-y-1">
                {ledger.map((r) => (
                  <div key={r.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-1">
                    <dt className="text-[16px] text-muted-foreground">{r.label}</dt>
                    <dd dir="ltr" className="text-[clamp(26px,3.1vw,46px)] leading-none font-semibold tracking-[-0.02em] tabular-nums">
                      <span className="text-muted-foreground">{r.sign}</span>
                      {r.sign && " "}
                      {num.format(r.v)}
                    </dd>
                  </div>
                ))}
                <div className="!mt-4 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 rounded-xl bg-hue-soft px-4 py-4 text-hue-ink sm:-mx-4">
                  <dt className="text-[17px] font-semibold">{t.stats.profit}</dt>
                  <dd dir="ltr" className="text-[clamp(34px,4.2vw,64px)] leading-none font-bold tracking-[-0.03em] tabular-nums">
                    {num.format(PROFIT)}
                  </dd>
                </div>
              </dl>
            </figure>
          </div>
          <Frag caption={L.profit.caption} className={cn("lp-reveal3", "mt-14 lg:mt-20")}>
            <div className="space-y-4">
              <KpiStrip items={kpis} />
              <div className="rounded-xl border bg-card p-4 sm:p-5">
                <p className="mb-4 text-sm font-medium">{t.stats.profitChart}</p>
                <ProfitChart data={profitDays()} />
              </div>
            </div>
          </Frag>
        </section>

        {/* ---------- On your phone ---------- */}
        <section aria-labelledby="phone-title" className="bg-hue-soft py-24 lg:pt-36 lg:pb-28">
          <div className={cn(WRAP, "grid items-center gap-12 lg:grid-cols-12 lg:gap-x-10")}>
            <div className="lg:col-span-5">
              <h2 id="phone-title" className={cn(H2, "lp-reveal", "text-hue-ink")}>
                {L.phone.title}
              </h2>
              <p className={cn(LEAD, "lp-reveal2", "mt-6")}>{L.phone.lead}</p>
            </div>
            <Frag caption={L.phone.caption} className="relative lg:col-span-6 lg:col-start-7">
              {/* Phone: the alert sits on top of the screen. Wider: it rests beside it, just over its edge. */}
              <div className="relative mx-auto flex max-w-[34rem] flex-col items-center sm:block">
                <TelegramAlert
                  {...p}
                  className="lp-float relative z-10 -mb-12 w-[17rem] sm:absolute sm:end-0 sm:top-24 sm:mb-0 sm:w-[16.5rem]"
                />
                <div className="sm:w-fit">
                  <PhoneScreen {...p} />
                </div>
              </div>
            </Frag>
          </div>
        </section>

        {/* ---------- How to use it: three steps; the bars climb the status ladder ---------- */}
        <section aria-labelledby="start-title" className={cn(WRAP, "pt-24 lg:pt-36")}>
          <h2 id="start-title" className={cn(H2, "lp-reveal")}>
            {L.start.title}
          </h2>
          <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-x-8 lg:mt-16">
            {(
              [
                ["setup", "bg-hue-track"],
                ["link", "bg-hue-mid"],
                ["daily", "bg-primary"],
              ] as const
            ).map(([id, bar], i) => (
              <li key={id} className={["lp-reveal", "lp-reveal2", "lp-reveal3"][i]}>
                <span aria-hidden className={cn("block h-2 rounded-full", bar)} />
                <h3 className="mt-6 text-[21px] leading-snug font-bold tracking-[-0.01em]">{L.start.steps[id].title}</h3>
                <p className="mt-2 max-w-[24rem] text-[17px] leading-relaxed">{L.start.steps[id].text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- FAQ ---------- */}
        <section id="faq" aria-labelledby="faq-title" className={cn(WRAP, "scroll-mt-4 py-24 lg:py-40")}>
          <h2 id="faq-title" className={cn(H2, "lp-reveal", "text-[clamp(34px,5.4vw,80px)] leading-[1.02]")}>
            {L.faq.title}
          </h2>
          <div className="mt-12 grid lg:mt-20 lg:grid-cols-12">
            <div className="space-y-2 lg:col-span-8 lg:col-start-5">
              {L.faq.items.map((item) => (
                <details
                  key={item.q}
                  className={cn("lp-reveal2", "group -mx-4 rounded-xl px-4 transition-colors open:bg-card sm:-mx-6 sm:px-6")}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl py-5 text-[19px] font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:text-[22px] [&::-webkit-details-marker]:hidden">
                    {item.q}
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="max-w-[48ch] pb-6 text-[16px] leading-relaxed md:text-[17px]">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ---------- Closing: the idea again, inverted ---------- */}
      <footer className="bg-hue-ink text-white dark:text-[#04130c]">
        <div className={cn(WRAP, "pt-24 pb-10 lg:pt-36")}>
          <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-x-10">
            <h2 className={cn(H2, "lp-reveal", "text-[clamp(34px,5.6vw,84px)] leading-[1.02] lg:col-span-8")}>{L.close.title}</h2>
            <div className={cn("lp-reveal2", "lg:col-span-4")}>
              <p className="text-lg leading-relaxed">{L.close.lead}</p>
              <Contact
                href={wa}
                label={L.hero.cta}
                className="mt-6 w-full bg-white text-[#0a4a34] hover:bg-white/90 sm:w-auto dark:bg-[#04130c] dark:text-hue-ink dark:hover:bg-[#04130c]/90"
              />
            </div>
          </div>
          <Wordmark className={cn("lp-reveal3", "mt-20 h-auto w-full lg:mt-32")} title={t.app.name} />
          <div className="mt-10 flex flex-col gap-3 text-sm opacity-80 sm:flex-row sm:items-center sm:justify-between">
            <p>{L.footer.about}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link href="/login" className="underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-white/50">
                {L.nav.login}
              </Link>
              <a href="#top" className="underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-white/50">
                {L.footer.top}
              </a>
              <span>
                {t.app.name} · {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
