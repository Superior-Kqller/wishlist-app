"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { type Language } from "@/lib/i18n";
import { LanguageProvider } from "@/components/i18n/language-provider";
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
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster
            position="bottom-right"
            theme="dark"
            richColors
            closeButton
            toastOptions={{
              duration: 3000,
              classNames: {
                toast: "rounded-xl border border-border shadow-lg",
                success: "border-success/32 bg-success/5",
                error: "border-destructive/32 bg-destructive/5",
                warning: "border-warning/32 bg-warning/5",
                info: "border-info/32 bg-info/5",
              },
            }}
          />
        </ThemeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
