import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/app/app-shell";
import { LANGUAGE_COOKIE_NAME, appMetadataCopy, normalizeLanguage, translate } from "@/lib/i18n";
import { THEME_BOOT_SCRIPT, THEME_COOKIE_NAME, normalizeTheme } from "@/lib/theme";

// Одна гарнитура на всё — DESIGN.md → typography.
const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
  fallback: ["system-ui", "sans-serif"],
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
    title: { default: copy.title, template: `%s · ${copy.title}` },
    description: copy.description,
    appleWebApp: {
      capable: true,
      title: copy.title,
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/assets/favicon/app-icon-64.png", sizes: "64x64", type: "image/png" },
        { url: "/assets/favicon/app-icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/assets/favicon/app-icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/assets/favicon/app-icon-192.png",
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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#161616" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const language = await getRequestLanguage();
  const theme = normalizeTheme((await cookies()).get(THEME_COOKIE_NAME)?.value);
  const skipLabel = translate(language, "К основному содержимому");

  return (
    <html
      lang={language}
      data-theme={theme === "system" ? undefined : theme}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <a
          href="#content"
          className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:border focus:border-foreground focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-[var(--shadow-float)] focus:outline-none"
        >
          {skipLabel}
        </a>
        <Providers language={language} theme={theme}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
