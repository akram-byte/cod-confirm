import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { getDictionary } from "@/i18n/server";

export default async function DashboardNotFound() {
  const t = await getDictionary();
  return (
    <EmptyState icon={SearchX} title={t.errorPage.notFoundTitle} description={t.errorPage.notFoundText}>
      <Link href="/" className={buttonVariants({ variant: "outline" })}>
        {t.errorPage.home}
      </Link>
    </EmptyState>
  );
}
