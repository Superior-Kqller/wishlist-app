"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { HeaderActionsProvider } from "@/lib/header-actions";
import { type Language } from "@/lib/i18n";
import { LanguageProvider } from "@/components/i18n/language-provider";
import { ColorThemeProvider } from "@/components/theme/color-theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({
  children,
  language,
}: {
  children: React.ReactNode;
  language: Language;
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLanguage={language}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          enableSystem={false}
        >
          <ColorThemeProvider>
            <TooltipProvider delayDuration={300}>
              <HeaderActionsProvider>{children}</HeaderActionsProvider>
            </TooltipProvider>
          </ColorThemeProvider>
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
              classNames: {
                toast: "rounded-xl border border-border shadow-lg",
                success: "border-success/30 bg-success/5",
                error: "border-destructive/30 bg-destructive/5",
                warning: "border-warning/30 bg-warning/5",
                info: "border-info/30 bg-info/5",
              },
            }}
          />
        </ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
