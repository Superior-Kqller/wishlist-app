"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { OfflineNotice } from "@/components/app/offline-notice";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showAuthenticatedShell = pathname !== "/login";

  return (
    <div className="app-canvas flex min-h-svh flex-col text-foreground">
      {showAuthenticatedShell ? <Header /> : null}
      {showAuthenticatedShell ? <OfflineNotice /> : null}
      {/* Запас под нижнюю панель разделов: она стоит поверх контента до `lg`. */}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col",
          showAuthenticatedShell && "pb-[var(--bottom-nav-clearance)]",
        )}
      >
        <main id="content" className="flex-1">
          {children}
        </main>
        {showAuthenticatedShell ? <Footer /> : null}
      </div>
    </div>
  );
}
