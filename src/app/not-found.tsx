import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getDictionary } from "@/i18n/server";

export default async function NotFound() {
  const t = await getDictionary();
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4">
      <div className="flex max-w-sm flex-col items-center text-center">
        <SearchX className="mb-3 size-12 text-muted-foreground" />
        <h1 className="text-lg font-semibold">{t.errorPage.notFoundTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.errorPage.notFoundText}</p>
        <Link href="/" className={buttonVariants({ variant: "outline", className: "mt-5" })}>
          {t.errorPage.home}
        </Link>
      </div>
    </main>
  );
}
