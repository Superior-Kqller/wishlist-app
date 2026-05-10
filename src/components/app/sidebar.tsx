"use client";

import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Home,
  LogOut,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserAvatar } from "@/components/UserAvatar";
import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uiState, uiSurface } from "@/lib/ui-contract";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function AppSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  if (!session?.user || pathname === "/login") return null;

  const navItems: NavItem[] = [
    { label: t("Главная"), href: "/", icon: Home },
    { label: t("Статистика"), href: "/stats", icon: BarChart3 },
    { label: t("Настройки"), href: "/settings", icon: Settings },
  ];

  if (session.user.role === "ADMIN") {
    navItems.push({ label: t("Админка"), href: "/admin", icon: Shield });
  }

  const handleSignOut = () => {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-[17rem] shrink-0 flex-col px-4 py-5 lg:flex",
        uiSurface.sidebar,
      )}
      aria-label={t("Основная навигация")}
    >
      <button
        type="button"
        onClick={() => router.push("/")}
        className="mb-6 rounded-xl text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={t("Вишлист — на главную")}
      >
        <BrandLockup />
      </button>

      <nav className="flex flex-1 flex-col gap-2" aria-label={t("Разделы")}>
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/70">
          {t("Навигация")}
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;

          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              className={cn(
                "justify-start rounded-lg font-medium",
                uiState.navBase,
                active && uiState.navActive,
              )}
              aria-current={active ? "page" : undefined}
              title={item.label}
              onClick={() => {
                router.push(item.href);
              }}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <div className="rounded-xl border border-border/45 bg-[hsl(var(--surface-3))/0.46] px-3 py-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <UserAvatar
            avatarUrl={session.user.avatarUrl}
            name={session.user.name ?? t("Пользователь")}
            userId={session.user.id}
            size="md"
            className="ring-1 ring-border/35"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {session.user.name ?? t("Пользователь")}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground/78">
              {session.user.email ?? session.user.username ?? t("Аккаунт")}
            </p>
          </div>
        </div>
        <LanguageSwitcher className="mt-3 h-8 w-full justify-start px-2 text-muted-foreground/82 hover:text-foreground" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 w-full justify-start gap-2 border-t border-border/35 px-2 pt-2 text-muted-foreground/82 hover:text-foreground"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          {t("Выйти")}
        </Button>
      </div>
    </aside>
  );
}
