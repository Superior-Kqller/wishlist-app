"use client";

import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Heart,
  Home,
  ListChecks,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uiState, uiSurface } from "@/lib/ui-contract";

type NavItem = {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
};

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  if (!session?.user || pathname === "/login") return null;

  const navItems: NavItem[] = [
    { label: "Главная", href: "/", icon: Home },
    { label: "Все списки", icon: ListChecks, disabled: true },
    { label: "Совместные", icon: Users, disabled: true },
    { label: "Избранное", icon: Heart, disabled: true },
    { label: "Уведомления", icon: Bell, disabled: true },
    { label: "Настройки", href: "/settings", icon: Settings },
  ];

  if (session.user.role === "ADMIN") {
    navItems.push({ label: "Админка", href: "/admin", icon: Shield });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-[17.5rem] shrink-0 flex-col px-4 py-5 lg:flex",
        uiSurface.sidebar,
      )}
      aria-label="Основная навигация"
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mb-7 rounded-xl text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label="Вишлист — на главную"
      >
        <BrandLockup />
      </button>

      <nav className="flex flex-1 flex-col gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;

          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              className={cn(
                "h-11 justify-start gap-3 rounded-lg px-3",
                uiState.navBase,
                active && uiState.navActive,
                item.disabled && "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-muted-foreground",
              )}
              disabled={item.disabled}
              aria-current={active ? "page" : undefined}
              title={item.disabled ? "Будет подключено в следующих этапах" : item.label}
              onClick={() => {
                if (item.href) router.push(item.href);
              }}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="rounded-xl border border-border bg-[hsl(var(--surface-3))/0.7] px-3 py-3">
        <p className="truncate text-sm font-semibold text-foreground">
          {session.user.name ?? "Пользователь"}
        </p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {session.user.email ?? session.user.username ?? "Аккаунт"}
        </p>
      </div>
    </aside>
  );
}
