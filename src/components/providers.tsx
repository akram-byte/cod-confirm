"use client";

import { ThemeProvider } from "next-themes";
import { DirectionProvider } from "@/components/ui/direction";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { I18nProvider } from "@/i18n/client";
import { dirOf, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/ar";

export function Providers({
  locale,
  t,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  const dir = dirOf(locale);
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DirectionProvider direction={dir}>
        <I18nProvider locale={locale} t={t}>
          <TooltipProvider>
            {children}
            <Toaster position={dir === "rtl" ? "bottom-left" : "bottom-right"} richColors />
          </TooltipProvider>
        </I18nProvider>
      </DirectionProvider>
    </ThemeProvider>
  );
}
