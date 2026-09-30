"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef } from "react";
import useSWR from "swr";
import { Check, LogOut, Menu, MoreHorizontal } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { UserAvatar } from "@/components/UserAvatar";
import { ThemeMenuItems } from "@/components/theme/theme-provider";
import { useI18n } from "@/components/i18n/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LANGUAGES } from "@/lib/i18n";
import { cn, fetcher } from "@/lib/utils";
import { getAppNavItems } from "@/lib/app-navigation";

type HeaderUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/**
 * Оболочка по DESIGN.md → «Навигация»: верхняя панель с разделами по центру и
 * меню аккаунта справа; на узких экранах разделы уходят вниз, под палец.
 */
/** Раздел активен и на вложенных адресах: «/preferences/me» — это «Подарочные профили». */
function isSectionActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}

export function Header() {
  const { t, language, setLanguage } = useI18n();
  const { data: session } = useSession();
  const pathname = usePathname();
  const { data: profile } = useSWR<HeaderUser>(session?.user ? "/api/users/me" : null, fetcher);

  const isAdmin = session?.user?.role === "ADMIN";
  const navItems = getAppNavItems(t, { isAdmin });
  const primaryNavItems = navItems.filter((item) => item.group === "primary");
  const secondaryNavItems = navItems.filter((item) => item.group === "secondary");
  // Хаб и всё, что из него открывается, подсвечивают «Ещё».
  const moreActive =
    pathname === "/more" || secondaryNavItems.some((item) => pathname === item.href);

  /*
   * Одна полоска под текущим разделом переезжает между пунктами:
   * Tab Pill Glide (kinetics.colorion.co) — 0.4s, JS меряет цель; сдвиг через
   * transform. При `prefers-reduced-motion` глобальное правило снимает переход.
   */
  const railRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const underline = underlineRef.current;
      const target = railRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
      if (!underline) return;
      underline.style.opacity = target ? "1" : "0";
      if (!target) return;
      // Первая расстановка — без перехода: полоска не «приезжает» слева при загрузке.
      const first = !underline.dataset.placed;
      if (first) underline.style.transition = "none";
      underline.style.transform = `translateX(${target.offsetLeft + 16}px)`;
      underline.style.width = `${target.offsetWidth - 32}px`;
      if (first) {
        void underline.offsetWidth;
        underline.style.transition = "";
        underline.dataset.placed = "true";
      }
    };
    place();
    // Ширина подписей меняется, когда догружается шрифт.
    document.fonts?.ready.then(place);
  }, [pathname, language]);

  const user = profile ?? session?.user;
  const userName = user?.name ?? t("Пользователь");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="mx-auto flex h-14 w-full max-w-[80rem] items-center gap-4 px-4 sm:px-6 lg:h-[4.5rem] xl:px-8">
            <Link
              href="/"
              className={cn("flex min-h-11 shrink-0 items-center rounded-lg", focusRing)}
              aria-label={t("Вишлист — на главную")}
            >
              <BrandLockup compact />
            </Link>

            <nav
              className="hidden flex-1 justify-center self-stretch lg:flex"
              aria-label={t("Разделы")}
            >
              <div ref={railRef} className="relative flex items-center gap-1">
                {primaryNavItems.map((item) => {
                  const active = isSectionActive(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "relative flex h-11 items-center rounded-full px-4 text-base font-semibold transition-colors",
                        focusRing,
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
                <span
                  ref={underlineRef}
                  aria-hidden
                  className="absolute bottom-0 left-0 h-0.5 bg-foreground opacity-0 transition-[transform,width,opacity] duration-[400ms] ease-[cubic-bezier(0.65,0,0.35,1)]"
                />
              </div>
            </nav>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={cn(
                    "ml-auto hidden h-11 items-center gap-2.5 rounded-full border border-border bg-background py-1 pl-3.5 pr-1 transition-shadow hover:shadow-[var(--shadow-float)] data-[state=open]:shadow-[var(--shadow-float)] lg:flex",
                    focusRing,
                  )}
                  aria-label={t("Меню аккаунта")}
                >
                  <Menu className="h-4 w-4" aria-hidden />
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    name={userName}
                    userId={user.id}
                    size="sm"
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className="w-60">
                  <DropdownMenuLabel className="truncate">{userName}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link href={item.href}>
                          <Icon className="h-4 w-4" aria-hidden />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {t("Язык")}
                  </DropdownMenuLabel>
                  {LANGUAGES.map((option) => (
                    <DropdownMenuItem key={option} onClick={() => setLanguage(option)}>
                      <Check
                        className={cn("h-4 w-4", option === language ? "opacity-100" : "opacity-0")}
                        aria-hidden
                      />
                      {option === "ru" ? t("Русский") : t("Английский")}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {t("Тема")}
                  </DropdownMenuLabel>
                  <ThemeMenuItems />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
                    <LogOut className="h-4 w-4" aria-hidden />
                    {t("Выйти")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </header>

      {/*
       * Разделы на телефоне — внизу, под большим пальцем. Панель стоит поверх
       * контента: отступ под неё держит `AppShell` через `--bottom-nav-clearance`.
       */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background pb-[env(safe-area-inset-bottom,0px)] lg:hidden"
        aria-label={t("Разделы")}
      >
        {[
          ...primaryNavItems.map((item) => ({
            ...item,
            active: isSectionActive(pathname, item.href),
          })),
          { label: t("Ещё"), href: "/more", icon: MoreHorizontal, active: moreActive },
        ].map((item) => {
          const Icon = item.icon;
          const shortLabel = "shortLabel" in item ? item.shortLabel : undefined;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={item.active ? "page" : undefined}
              aria-label={shortLabel ? item.label : undefined}
              className={cn(
                "flex h-16 min-w-0 flex-col items-center justify-center gap-1 text-xs transition-colors",
                focusRing,
                item.active ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-6 w-6 shrink-0" aria-hidden />
              <span className="w-full truncate text-center">{shortLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
