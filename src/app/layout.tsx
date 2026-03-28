import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/Header";

const inter = Inter({
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

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:4030"),
  title: "Вишлист",
  description: "Умный вишлист для совместных желаний",
  appleWebApp: {
    capable: true,
    title: "Вишлист",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/assets/favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/assets/favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/assets/favicon/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/favicon/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/assets/favicon/apple-touch-icon.png",
  },
  openGraph: {
    title: "Вишлист",
    description: "Умный вишлист для совместных желаний",
    images: [{ url: "/assets/github/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Вишлист",
    description: "Умный вишлист для совместных желаний",
    images: ["/assets/github/social-preview.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  /** Мобильный Chrome/Safari: контент подстраивается под панели браузера */
  interactiveWidget: "resizes-content",
  themeColor: "#1A1A1F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="dark" suppressHydrationWarning>
      <head />
      <body className={`${inter.variable} ${jetbrainsMono.variable} ${inter.className}`}>
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
