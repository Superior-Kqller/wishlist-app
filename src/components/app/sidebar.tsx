"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  BarChart3,
  CalendarDays,
  Folder,
  Home,
  LogOut,
  SlidersHorizontal,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserAvatar } from "@/components/UserAvatar";
import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { signOutToLogin } from "@/lib/client-auth";
import { uiState, uiSurface } from "@/lib/ui-contract";
import type { ListWithMeta } from "@/types";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

type SidebarUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: "USER" | "ADMIN";
};

export function AppSidebar() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const reduceMotion = useReducedMotion();
  const { data: profile } = useSWR<SidebarUser>(session?.user ? "/api/users/me" : null, fetcher);
  const { data: lists = [] } = useSWR<ListWithMeta[]>(
    session?.user ? "/api/lists" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 },
  );

  if (!session?.user) return null;
  const currentUser = profile ?? session.user;
  const currentUserName = currentUser.name ?? t("Пользователь");
  const currentUserId = currentUser.id ?? session.user.id;
  const currentUsername =
    currentUser.email ?? currentUser.username ?? session.user.email ?? t("Аккаунт");
  const pinnedLists = lists.slice(0, 4);
  const totalListItems = lists.reduce((sum, list) => sum + list._count.items, 0);

  const navItems: NavItem[] = [
    { label: t("Главная"), href: "/", icon: Home },
    { label: t("Календарь"), href: "/calendar", icon: CalendarDays },
    { label: t("Статистика"), href: "/stats", icon: BarChart3 },
    { label: t("Предпочтения"), href: "/preferences", icon: SlidersHorizontal },
    { label: t("Настройки"), href: "/settings", icon: Settings },
  ];

  if (session.user.role === "ADMIN") {
    navItems.push({ label: t("Админка"), href: "/admin", icon: Shield });
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-[16.5rem] shrink-0 flex-col px-5 py-5 lg:flex",
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

      {/*
       * Активный раздел отмечен одной подложкой, которая переезжает между
       * пунктами (`layoutId`), а не появляется и исчезает на каждом. Так
       * переход между разделами читается как перемещение внутри одного меню.
       */}
      <nav
        className="flex flex-col gap-0.5 border-b border-border/32 pb-5"
        aria-label={t("Разделы")}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.href ? pathname === item.href : false;

          return (
            <Button
              key={item.label}
              type="button"
              variant="ghost"
              className={cn(
                "relative justify-start rounded-lg font-medium",
                uiState.navBase,
                active && "text-foreground hover:bg-transparent",
              )}
              aria-current={active ? "page" : undefined}
              title={item.label}
              onClick={() => {
                router.push(item.href);
              }}
            >
              {active ? (
                <motion.span
                  layoutId="sidebar-nav-active"
                  aria-hidden
                  transition={
                    reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }
                  }
                  className="absolute inset-0 -z-10 rounded-lg border border-primary/32 bg-primary/10 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.045)]"
                />
              ) : null}
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          );
        })}
      </nav>

      <section className="mt-6 flex-1 overflow-y-auto py-1" aria-label={t("Подборки")}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-muted-foreground">{t("Подборки")}</p>
          <span className="font-mono text-[11px] text-muted-foreground-subtle">
            {totalListItems}
          </span>
        </div>
        {pinnedLists.length > 0 ? (
          <div className="space-y-1">
            {pinnedLists.map((list) => (
              <button
                key={list.id}
                type="button"
                className="flex min-h-11 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-left text-sm text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-4)/0.56)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                title={list.name}
                onClick={() => router.push(`/?listId=${list.id}`)}
              >
                <Folder className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{list.name}</span>
                <span className="font-mono text-[11px] text-muted-foreground-subtle">
                  {list._count.items}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2 py-2 text-sm text-muted-foreground">{t("Пока нет подборок")}</p>
        )}
      </section>

      <div className="border-t border-border/32 pt-4">
        <button
          type="button"
          onClick={() => router.push("/settings")}
          className="flex w-full min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={t("Настройки")}
          title={t("Настройки")}
        >
          <UserAvatar
            avatarUrl={currentUser.avatarUrl}
            name={currentUserName}
            userId={currentUserId}
            size="md"
            className="ring-1 ring-border/32"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{currentUserName}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground-subtle">
              {currentUsername}
            </p>
          </div>
        </button>
        <LanguageSwitcher className="mt-3 h-11 w-full justify-start px-2 text-muted-foreground-subtle hover:text-foreground" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1 h-11 w-full justify-start gap-2 px-2 text-muted-foreground-subtle hover:text-foreground"
          onClick={signOutToLogin}
        >
          <LogOut className="h-4 w-4" />
          {t("Выйти")}
        </Button>
      </div>
    </aside>
  );
}
