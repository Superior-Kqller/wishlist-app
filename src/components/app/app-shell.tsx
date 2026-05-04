import { Suspense } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { AppSidebar } from "@/components/app/sidebar";
import { TopHeader } from "@/components/app/top-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col bg-[hsl(var(--background))] text-foreground">
      <Header />
      <div className="flex min-h-0 flex-1">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Suspense fallback={null}>
            <TopHeader />
          </Suspense>
          <main className="flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))] sm:pb-0">
            {children}
          </main>
          <Footer />
        </div>
      </div>
      <MobileBottomNav />
    </div>
  );
}
