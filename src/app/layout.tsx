import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app/app-shell";
import {
  LANGUAGE_COOKIE_NAME,
  appMetadataCopy,
  normalizeLanguage,
  translate,
} from "@/lib/i18n";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-mono",
  display: "swap",
  fallback: ["Consolas", "monospace"],
});

async function getRequestLanguage() {
  const cookieStore = await cookies();
  return normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
}

export async function generateMetadata(): Promise<Metadata> {
  const language = await getRequestLanguage();
  const copy = appMetadataCopy[language];

  return {
    metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:4030"),
    title: copy.title,
    description: copy.description,
    appleWebApp: {
      capable: true,
      title: copy.title,
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/assets/favicon/app-icon-1.8.0-64.png", sizes: "64x64", type: "image/png" },
        { url: "/assets/favicon/app-icon-1.8.0-192.png", sizes: "192x192", type: "image/png" },
        { url: "/assets/favicon/app-icon-1.8.0-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/assets/favicon/app-icon-1.8.0-192.png",
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      images: [{ url: "/assets/github/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: ["/assets/github/social-preview.png"],
    },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  /** Мобильный Chrome/Safari: контент подстраивается под панели браузера */
  interactiveWidget: "resizes-content",
  themeColor: "#0E1119",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getRequestLanguage();
  const skipLabel = translate(language, "К основному содержимому");

  return (
    <html lang={language} className="dark" suppressHydrationWarning>
      <head />
      <body className={`${manrope.variable} ${jetbrainsMono.variable} ${manrope.className}`}>
        <a
          href="#content"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:border focus:border-primary/45 focus:bg-[hsl(var(--surface-2))] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-[var(--shadow-floating)] focus:outline-none"
        >
          {skipLabel}
        </a>
        <Providers language={language}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
