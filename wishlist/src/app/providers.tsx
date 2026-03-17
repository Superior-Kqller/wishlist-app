"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
        <Toaster
          position="bottom-right"
          theme="system"
          richColors
          closeButton
          toastOptions={{
            duration: 3000,
            classNames: {
              toast: "rounded-xl border border-border shadow-lg",
              success: "border-green-500/30 dark:border-green-500/20",
              error: "border-destructive/30",
            },
          }}
        />
      </ThemeProvider>
    </SessionProvider>
  );
}
