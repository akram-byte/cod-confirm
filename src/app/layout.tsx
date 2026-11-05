import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { Providers } from "@/components/providers";
import { getDictionary, getLocale } from "@/i18n/server";
import { dirOf } from "@/i18n/config";
import "./globals.css";

// One font for both languages: IBM Plex Sans Arabic includes Latin glyphs.
const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-sans",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: { default: t.app.name, template: `%s · ${t.app.name}` }, description: t.app.tagline };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${plex.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers locale={locale} t={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
