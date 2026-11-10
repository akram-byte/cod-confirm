import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { getDictionary, getLocale } from "@/i18n/server";
import { dirOf } from "@/i18n/config";
import "./globals.css";

// Inter sets Latin text and every figure (close to the system face on Apple devices);
// Arabic letters fall through to IBM Plex Sans Arabic. One face per script.
const inter = Inter({
  variable: "--font-latin",
  subsets: ["latin"],
  display: "swap",
});
const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
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
    { media: "(prefers-color-scheme: light)", color: "#f2f2f4" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  const t = await getDictionary();
  return (
    <html lang={locale} dir={dirOf(locale)} className={`${inter.variable} ${plex.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full">
        <Providers locale={locale} t={t}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
