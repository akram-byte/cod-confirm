"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";
import { setLocale } from "@/i18n/actions";

export function LanguageToggle({ className }: { className?: string }) {
  const { t, locale } = useI18n();
  const [pending, startTransition] = useTransition();
  const other = locale === "ar" ? "fr" : "ar";
  return (
    <Button
      variant="ghost"
      size="sm"
      className={className}
      disabled={pending}
      onClick={() => startTransition(() => setLocale(other))}
      aria-label={t.header.language}
    >
      <Languages className="size-4" />
      <span lang={other}>{other === "fr" ? "Français" : "العربية"}</span>
    </Button>
  );
}
