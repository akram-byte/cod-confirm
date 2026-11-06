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
    <main className="relative flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
      <div className="absolute top-4 end-4">
        <LanguageToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <BrandMark className="size-12" />
          <div>
            <p className="text-lg font-semibold">{t.app.name}</p>
            <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h1 className="text-xl font-semibold">{t.login.title}</h1>
          <p className="mt-1 mb-5 text-sm text-muted-foreground">{t.login.subtitle}</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
