import type { Metadata, Viewport } from "next";
import { Figtree, Readex_Pro } from "next/font/google";
import { Providers } from "@/components/providers";
import { getDictionary, getLocale } from "@/i18n/server";
import { dirOf } from "@/i18n/config";
import "./globals.css";

// Figtree sets Latin text and every figure (its digits are truly tabular; DM Sans has none);
// Arabic letters fall through to Readex Pro, its geometric match. One face per script.
const latin = Figtree({
  variable: "--font-latin",
  subsets: ["latin"],
  display: "swap",
});
const arabic = Readex_Pro({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getDictionary();
  return { title: { default: t.app.name, template: `%s · ${t.app.name}` }, description: t.app.tagline };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0d0c" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getDictionary();
  // next/font appends a metric fallback (Arial) that claims every script, so Arabic letters
  // would stop there and never reach Readex Pro. Keep only the family's own name.
  const latinOnly = { "--font-latin": latin.style.fontFamily.split(",")[0] } as React.CSSProperties;
  return (
    <html lang={locale} dir={dirOf(locale)} style={latinOnly} className={`${latin.variable} ${arabic.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers locale={locale} t={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
