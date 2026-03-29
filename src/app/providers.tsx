"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { HeaderActionsProvider } from "@/lib/header-actions";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
      >
        <TooltipProvider delayDuration={300}>
          <HeaderActionsProvider>
            {children}
          </HeaderActionsProvider>
        </TooltipProvider>
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
    </SessionProvider>
  );
}
