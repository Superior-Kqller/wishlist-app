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
      className="fixed inset-x-2 bottom-[max(0.5rem,env(safe-area-inset-bottom,0px))] z-40 rounded-2xl border border-border/70 bg-[hsl(var(--surface-2)/0.94)] px-2.5 py-1.5 shadow-[0_-4px_14px_rgba(0,0,0,0.24)] backdrop-blur-lg sm:hidden"
    >
      <Button
        type="button"
        className="absolute left-1/2 top-[-0.65rem] size-11 -translate-x-1/2 rounded-full border border-primary/35 p-0 shadow-[0_8px_20px_rgba(0,0,0,0.3),0_0_14px_hsl(var(--primary)/0.2)]"
        aria-label="Добавить товар"
        onClick={() => {
          if (pathname !== "/") {
            router.push("/?add=1");
            return;
          }
          onAddItem?.();
        }}
      >
        <Plus className="h-[18px] w-[18px]" />
      </Button>

      <div className="mx-auto grid max-w-sm grid-cols-[1fr_1fr_3.25rem_1fr] items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const columnClass =
            item.href === "/"
              ? "col-start-1"
              : item.href === "/stats"
                ? "col-start-2"
                : "col-start-4";
          return (
            <Button
              key={item.href}
              type="button"
              variant="ghost"
              className={cn(
                "h-10 min-w-0 flex-col gap-0.5 px-1.5 text-[10px] font-medium",
                columnClass,
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
