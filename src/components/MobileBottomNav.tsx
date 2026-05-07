"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Home, Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHeaderActions } from "@/lib/header-actions";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const {
    actions: { onAddItem },
  } = useHeaderActions();

  if (!session?.user || pathname === "/login") return null;

  const navItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/stats", label: "Статистика", icon: BarChart3 },
    { href: "/settings", label: "Настройки", icon: Settings },
  ];

  return (
    <nav
      aria-label="Основная мобильная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-[hsl(var(--surface-2)/0.94)] px-3 pb-[max(0.35rem,env(safe-area-inset-bottom,0px))] pt-1.5 shadow-[0_-6px_18px_rgba(0,0,0,0.28)] backdrop-blur-lg sm:hidden"
    >
      <Button
        type="button"
        className="absolute left-1/2 top-[-1.4rem] size-12 -translate-x-1/2 rounded-full border border-primary/35 p-0 shadow-[0_10px_26px_rgba(0,0,0,0.34),0_0_18px_hsl(var(--primary)/0.24)]"
        aria-label="Добавить товар"
        onClick={() => {
          if (pathname !== "/") {
            router.push("/?add=1");
            return;
          }
          onAddItem?.();
        }}
      >
        <Plus className="h-5 w-5" />
      </Button>

      <div className="mx-auto grid max-w-sm grid-cols-3 items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Button
              key={item.href}
              type="button"
              variant="ghost"
              className={cn(
                "h-11 flex-col gap-0.5 px-2 text-[10px] font-medium",
                active
                  ? "bg-primary/10 text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
              onClick={() => router.push(item.href)}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
