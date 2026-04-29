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
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-[hsl(var(--surface-2)/0.96)] px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_-10px_26px_rgba(0,0,0,0.38)] backdrop-blur-lg sm:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-1">
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Button
              key={item.href}
              type="button"
              variant="ghost"
              className={cn(
                "h-12 flex-col gap-1 px-2 text-[11px] font-medium",
                active
                  ? "bg-primary/14 text-foreground"
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

        <Button
          type="button"
          className="h-12 flex-col gap-1 px-2 text-[11px] font-semibold"
          aria-label="Добавить товар"
          onClick={() => {
            if (pathname !== "/") {
              router.push("/?add=1");
              return;
            }
            onAddItem?.();
          }}
        >
          <Plus className="h-4 w-4" />
          Добавить
        </Button>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Button
              key={item.href}
              type="button"
              variant="ghost"
              className={cn(
                "h-12 flex-col gap-1 px-2 text-[11px] font-medium",
                active
                  ? "bg-primary/14 text-foreground"
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
