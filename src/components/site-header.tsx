"use client";

import { useTransition } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Monitor, Moon, Sun, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/i18n/client";
import { LanguageToggle } from "@/components/language-toggle";
import { logout } from "@/app/login/actions";
import { navKeyFor } from "@/components/nav";

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [, startTransition] = useTransition();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-backdrop-filter:bg-background/60 md:px-4">
      <SidebarTrigger className="size-9" aria-label={t.nav.toggleSidebar} />
      <Separator orientation="vertical" className="mx-1 h-5 data-vertical:self-center" />
      <h1 className="truncate text-base font-semibold">{t.pages[navKeyFor(pathname)].title}</h1>

      <div className="ms-auto flex items-center gap-1">
        <LanguageToggle />

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t.header.theme} />}>
            <Sun className="size-4 dark:hidden" />
            <Moon className="hidden size-4 dark:block" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t.header.theme}</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={theme ?? "system"} onValueChange={(v) => setTheme(String(v))}>
                <DropdownMenuRadioItem value="light">
                  <Sun /> {t.header.light}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">
                  <Moon /> {t.header.dark}
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="system">
                  <Monitor /> {t.header.system}
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon" aria-label={t.header.account} />}>
            <UserRound className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuGroup>
              <DropdownMenuLabel>{t.header.owner}</DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => startTransition(() => logout())}>
              <LogOut /> {t.header.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
