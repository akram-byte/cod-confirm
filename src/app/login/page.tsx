import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { isOwner } from "@/lib/auth";
import { getDictionary } from "@/i18n/server";
import { LoginForm } from "./login-form";
import { LanguageToggle } from "@/components/language-toggle";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.login.title };
}

export default async function LoginPage() {
  if (await isOwner()) redirect("/");
  const t = await getDictionary();

  return (
    <main className="grid min-h-svh md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {/* The product's side: one field of the palest tint, its name and what it is for. */}
      <section className="hidden flex-col justify-between bg-hue-soft p-10 md:flex lg:p-14">
        <div className="flex items-center gap-3">
          <BrandMark className="size-9" />
          <span className="text-base font-semibold text-hue-ink">{t.app.name}</span>
        </div>
        <p className="max-w-md text-[32px] leading-[1.25] font-bold tracking-tight text-hue-ink">{t.app.tagline}</p>
        <span aria-hidden className="h-1.5 w-16 rounded-full bg-data" />
      </section>

      <section className="relative flex items-center justify-center px-4 py-10">
        <div className="absolute end-4 top-4">
          <LanguageToggle />
        </div>
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 md:hidden">
            <BrandMark className="size-10" />
            <div>
              <p className="text-base font-semibold">{t.app.name}</p>
              <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
            </div>
          </div>
          <h1 className="text-[26px] leading-tight font-bold tracking-tight">{t.login.title}</h1>
          <p className="mt-1.5 mb-6 text-[15px] text-muted-foreground">{t.login.subtitle}</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
