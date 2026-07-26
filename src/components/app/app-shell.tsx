"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AppSidebar } from "@/components/app/sidebar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showAuthenticatedShell = pathname !== "/login";

  return (
    <div className="app-canvas flex min-h-svh flex-col text-foreground">
      {showAuthenticatedShell ? <Header /> : null}
      <div className="flex min-h-0 flex-1">
        {showAuthenticatedShell ? <AppSidebar /> : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <main id="content" className="flex-1 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:pb-0">
            {children}
          </main>
          {showAuthenticatedShell ? <Footer /> : null}
        </div>
      </div>
    </div>
  );
}
