"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Folder, FolderPlus, LogOut, Plus } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { UserAvatar } from "@/components/UserAvatar";
import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { cn, fetcher } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { getAppNavItems } from "@/lib/app-navigation";
import { uiState, uiSurface } from "@/lib/ui-contract";
import type { ListWithMeta } from "@/types";

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
  const searchParams = useSearchParams();
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
  // Секция прокручивается сама — прятать пятую подборку без ссылки на
  // остальные незачем.
  const activeListId = pathname === "/" ? searchParams.get("listId") : null;
  // Вторая строка — только если она что-то добавляет: «Avgel / Avgel» дублировал имя.
  const showUsername = currentUsername.toLowerCase() !== currentUserName.toLowerCase();

  const navItems = getAppNavItems(t, { isAdmin: session.user.role === "ADMIN" });

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh w-[16.5rem] shrink-0 flex-col px-5 py-5 lg:flex",
        uiSurface.sidebar,
      )}
      aria-label={t("Основная навигация")}
    >
      <Link
        href="/"
        className="mb-6 rounded-lg text-left transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={t("Вишлист — на главную")}
      >
        <BrandLockup />
      </Link>

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
              asChild
              variant="ghost"
              className={cn(
                "relative justify-start rounded-lg font-medium",
                uiState.navBase,
                "h-10",
                active && "text-foreground hover:bg-transparent",
                // Значок текущего раздела берёт голос краски: подсветка
                // самой строки теперь тональная, и без него «текущий»
                // читался бы только по фону.
                active && "[&_svg]:text-primary-accent",
              )}
            >
              <Link href={item.href} aria-current={active ? "page" : undefined}>
                {active ? (
                  <motion.span
                    layoutId="sidebar-nav-active"
                    aria-hidden
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 36 }
                    }
                    className="absolute inset-0 -z-10 rounded-lg border border-border/55 bg-[hsl(var(--surface-3))]"
                  />
                ) : null}
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <section className="mt-6 flex-1 overflow-y-auto py-1" aria-label={t("Подборки")}>
        {/* Без общего счётчика: сумма желаний рядом со словом «Подборки»
            читалась как число подборок. Счёт у каждой подборки — свой. */}
        <div className="mb-1.5 flex items-center justify-between gap-2 pl-2">
          <p className="text-xs font-medium text-muted-foreground">{t("Подборки")}</p>
          <Link
            href="/?list=new"
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground-subtle transition-colors hover:bg-[hsl(var(--surface-4)/0.55)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t("Создать подборку")}
            title={t("Создать подборку")}
          >
            <Plus className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        {lists.length > 0 ? (
          <div className="space-y-0.5">
            {lists.map((list) => {
              const active = activeListId === list.id;
              return (
                <Link
                  key={list.id}
                  href={`/?listId=${list.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-9 w-full min-w-0 items-center gap-2 rounded-lg px-2 text-sm transition-colors hover:bg-[hsl(var(--surface-4)/0.55)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "bg-[hsl(var(--surface-3))] text-foreground [&_svg]:text-primary-accent"
                      : "text-muted-foreground",
                  )}
                  title={list.name}
                >
                  <Folder className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{list.name}</span>
                  <span className="text-xs tabular-nums text-muted-foreground-subtle">
                    {list._count.items}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <Link
            href="/?list=new"
            className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left text-sm text-muted-foreground transition-colors hover:bg-[hsl(var(--surface-4)/0.55)] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FolderPlus className="h-4 w-4 shrink-0" aria-hidden />
            {t("Создать подборку")}
          </Link>
        )}
      </section>

      <div className="border-t border-border/32 pt-4">
        <Link
          href="/settings"
          className="flex w-full min-w-0 items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-left transition-colors hover:bg-accent/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
            {showUsername ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground-subtle">
                {currentUsername}
              </p>
            ) : null}
          </div>
        </Link>
        <LanguageSwitcher className="mt-3 h-10 w-full justify-start px-2 text-muted-foreground-subtle hover:text-foreground" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-0.5 h-10 w-full justify-start gap-2 px-2 text-muted-foreground-subtle hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {t("Выйти")}
        </Button>
      </div>
    </aside>
  );
}
