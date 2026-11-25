import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CircleCheck, LogOut, MessageCircle } from "lucide-react";
import { Wordmark } from "@/components/brand-mark";
import { LanguageToggle } from "@/components/language-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { getDictionary, getLocale } from "@/i18n/server";
import { fill } from "@/i18n/config";
import { requireStaff } from "@/lib/auth";
import { getAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { normalizePhone, toInternational } from "@/lib/phone";
import { cn } from "@/lib/utils";
import { logout } from "@/app/login/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.accessEnded.title };
}

/** wa.me link to the provider (CONTACT_WHATSAPP), or null when no number is set. */
function contactHref(text: string) {
  const raw = process.env.CONTACT_WHATSAPP?.trim() ?? "";
  if (!raw) return null;
  const local = normalizePhone(raw);
  const number = local ? toInternational(local) : raw.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export default async function AccessEndedPage() {
  const access = getAccess();
  if (access.state !== "ended") redirect("/");
  await requireStaff();

  const [t, locale, settings, waiting] = await Promise.all([
    getDictionary(),
    getLocale(),
    db.settings.findUnique({ where: { id: 1 }, select: { storeName: true } }),
    db.order.count({ where: { status: { in: ["NEW", "NO_ANSWER", "CALLBACK"] } } }),
  ]);
  const store = settings?.storeName || t.app.name;
  const href = contactHref(fill(t.accessEnded.contactMessage, { store }));

  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 py-16">
      <div className="absolute end-4 top-4 flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>
      <div className="w-full max-w-md">
        <Wordmark className="mb-8 h-8" title={t.app.name} />
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-balance">{t.accessEnded.title}</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">
          {fill(t.accessEnded.text, { date: formatDate(access.until, locale) })}
        </p>

        <div className="mt-6 flex gap-3 rounded-xl border bg-card p-4">
          <CircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-[15px]">
            <p className="font-semibold">{t.accessEnded.ordersSafe}</p>
            <p className="mt-0.5 text-muted-foreground">
              {waiting > 0 ? fill(t.accessEnded.waiting, { count: waiting }) : t.accessEnded.ordersSafeText}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ size: "lg" }), "h-11 gap-2 px-5")}
            >
              <MessageCircle className="size-5" />
              {t.accessEnded.contact}
            </a>
          ) : (
            <p className="text-[15px] font-medium">{t.accessEnded.contactNoNumber}</p>
          )}
          <form action={logout}>
            <Button type="submit" variant="ghost" size="lg" className="h-11 gap-2">
              <LogOut className="size-4" />
              {t.header.logout}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
