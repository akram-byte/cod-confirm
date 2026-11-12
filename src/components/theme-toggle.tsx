"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/client";

/** Icon button: moon in light mode, sun in dark mode. CSS picks the icon (the theme is unknown on the server). */
export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={className}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={t.header.theme}
      title={t.header.theme}
    >
      <Moon className="size-4 dark:hidden" />
      <Sun className="hidden size-4 dark:block" />
    </Button>
  );
}
