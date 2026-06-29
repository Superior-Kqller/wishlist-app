"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Home,
  SlidersHorizontal,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export function Header() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isLoginPage = pathname === "/login";

  const navItems = [
    { label: t("Главная"), href: "/", icon: Home },
    { label: t("Статистика"), href: "/stats", icon: BarChart3 },
    { label: t("Предпочтения"), href: "/preferences", icon: SlidersHorizontal },
    { label: t("Настройки"), href: "/settings", icon: Settings },
    ...(isAdmin
      ? [{ label: t("Админка"), href: "/admin", icon: Shield }]
      : []),
  ];

  if (isLoginPage) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[hsl(var(--surface-2)/0.94)] elevation-header backdrop-blur-xl lg:hidden">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex flex-col px-3 sm:px-4">
          <div className="flex min-h-[48px] items-center">
            <button
              onClick={() => router.push("/")}
              className="flex min-w-0 flex-1 items-center rounded-xl py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title={t("На главную")}
              aria-label={t("Вишлист — на главную")}
            >
              <BrandLockup compact />
            </button>
          </div>

          <nav
            className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-4 sm:px-4"
            aria-label={t("Разделы")}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 shrink-0 rounded-full border border-transparent px-3 text-xs font-semibold transition-all active:scale-[0.98]",
                    active
                      ? "border-primary/25 bg-primary/12 text-primary shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]"
                      : "bg-[hsl(var(--surface-3))/0.42] text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
