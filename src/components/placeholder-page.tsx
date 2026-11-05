import type { Metadata } from "next";
import { EmptyState } from "@/components/empty-state";
import { PageIntro } from "@/components/page-intro";
import { NAV, type NavKey } from "@/components/nav";
import { getDictionary } from "@/i18n/server";

// Shared by pages that are built in later phases.
export async function placeholderMetadata(key: NavKey): Promise<Metadata> {
  const t = await getDictionary();
  return { title: t.pages[key].title };
}

export async function PlaceholderPage({ pageKey }: { pageKey: NavKey }) {
  const t = await getDictionary();
  const icon = NAV.find((n) => n.key === pageKey)!.icon;
  return (
    <>
      <PageIntro description={t.pages[pageKey].description} />
      <EmptyState icon={icon} title={t.empty.title} description={t.empty.soon} />
    </>
  );
}
