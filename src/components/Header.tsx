"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  Home,
  LogOut,
  SlidersHorizontal,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { signOutToLogin } from "@/lib/client-auth";

export function Header() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = [
    { label: t("Главная"), href: "/", icon: Home },
    { label: t("Статистика"), href: "/stats", icon: BarChart3 },
    { label: t("Предпочтения"), href: "/preferences", icon: SlidersHorizontal },
    { label: t("Настройки"), href: "/settings", icon: Settings },
    ...(isAdmin
      ? [{ label: t("Админка"), href: "/admin", icon: Shield }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[hsl(var(--surface-2)/0.94)] elevation-header backdrop-blur-xl lg:hidden">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex flex-col px-3 sm:px-4">
          <div className="flex min-h-[48px] items-center gap-1">
            <button
              onClick={() => router.push("/")}
              className="flex min-w-0 flex-1 items-center rounded-xl py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title={t("На главную")}
              aria-label={t("Вишлист — на главную")}
            >
              <BrandLockup compact />
            </button>
            <LanguageSwitcher className="h-11 px-2" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={signOutToLogin}
              title={t("Выйти")}
              aria-label={t("Выйти")}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <nav
            className="-mx-3 flex gap-1 overflow-x-auto border-t border-border/35 px-3 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-4 sm:px-4"
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
                    "h-11 shrink-0 rounded-md border-x-0 border-b-2 border-t-0 px-3 text-xs font-semibold transition-colors active:bg-accent/45",
                    active
                      ? "border-primary bg-primary/8 text-foreground"
                      : "border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground",
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
