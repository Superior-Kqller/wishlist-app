"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { type Language } from "@/lib/i18n";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";
import type { ThemePreference } from "@/lib/theme";

export function Providers({
  children,
  language,
  theme,
}: {
  children: React.ReactNode;
  language: Language;
  theme: ThemePreference;
}) {
  return (
    <SessionProvider>
      <ThemeProvider initialTheme={theme}>
        <LanguageProvider initialLanguage={language}>
          {children}
          <ThemedToaster />
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

/** Тосты следуют выбранной теме; «системную» sonner отслеживает сам. */
function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      position="bottom-right"
      // Над нижней панелью разделов, пока она есть (до `lg`).
      offset={{ bottom: "calc(var(--bottom-nav-clearance) + 1rem)" }}
      mobileOffset={{ bottom: "calc(var(--bottom-nav-clearance) + 0.5rem)" }}
      theme={theme}
      richColors
      closeButton
      toastOptions={{
        duration: 3000,
        classNames: {
          toast: "rounded-xl border border-border shadow-[var(--shadow-float)]",
          success: "border-success/32 bg-success/5",
          error: "border-destructive/32 bg-destructive/5",
          warning: "border-warning/32 bg-warning/5",
          info: "border-info/32 bg-info/5",
        },
      }}
    />
  );
}
