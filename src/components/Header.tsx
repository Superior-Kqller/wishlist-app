"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  CalendarDays,
  Home,
  LogOut,
  MoreHorizontal,
  SlidersHorizontal,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { signOutToLogin } from "@/lib/client-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mobileNavButtonClass = (active: boolean) =>
  cn(
    "relative h-11 min-w-0 flex-col gap-0.5 rounded-xl border border-transparent px-0.5 py-1.5 text-[10px] font-semibold leading-none tracking-[-0.01em] transition-[color] active:bg-accent/45 sm:flex-row sm:gap-1.5 sm:px-3 sm:text-xs sm:tracking-normal",
    active ? "text-foreground" : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
  );

/**
 * Подпись вкладки. В колонке `flex-col` элемент по умолчанию шириной по
 * содержимому, поэтому `truncate` не срабатывал и длинная подпись
 * («Предпочтения») выезжала за подложку вкладки в соседние. Ширина по ячейке
 * возвращает обрезку и делает её страховкой для любого языка.
 */
const mobileNavLabelClass = "w-full truncate text-center sm:w-auto";

/** Та же подложка активного раздела, что и в боковом меню, только для узких экранов. */
function MobileNavIndicator({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.span
      layoutId="mobile-nav-active"
      aria-hidden
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
      className="absolute inset-0 -z-10 rounded-xl border border-primary/32 bg-primary/12 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.055)]"
    />
  );
}

export function Header() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isAdmin = session?.user?.role === "ADMIN";

  /**
   * `shortLabel` — подпись для узкой вкладки. «Предпочтения» не помещаются в
   * пятую часть телефонного экрана ни в одном кегле, а раздел и на самой
   * странице называется «Подарочные профили», поэтому короткая подпись
   * ведёт к тому же смыслу, а не к обрезку слова.
   */
  const primaryNavItems: Array<{
    label: string;
    shortLabel?: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { label: t("Главная"), href: "/", icon: Home },
    { label: t("Календарь"), href: "/calendar", icon: CalendarDays },
    { label: t("Статистика"), href: "/stats", icon: BarChart3 },
    {
      label: t("Предпочтения"),
      shortLabel: t("Профили"),
      href: "/preferences",
      icon: SlidersHorizontal,
    },
  ];
  const secondaryNavItems = [
    { label: t("Настройки"), href: "/settings", icon: Settings },
    ...(isAdmin ? [{ label: t("Админка"), href: "/admin", icon: Shield }] : []),
  ];
  const secondaryNavActive = secondaryNavItems.some((item) => pathname === item.href);

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
            className="-mx-3 grid grid-cols-5 gap-1 border-t border-border/35 px-3 pb-1.5 pt-1.5 sm:-mx-4 sm:px-4"
            aria-label={t("Разделы")}
          >
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={mobileNavButtonClass(active)}
                  aria-current={active ? "page" : undefined}
                  aria-label={item.shortLabel ? item.label : undefined}
                  onClick={() => router.push(item.href)}
                >
                  {active ? <MobileNavIndicator reduceMotion={reduceMotion} /> : null}
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className={mobileNavLabelClass}>{item.shortLabel ?? item.label}</span>
                </Button>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={mobileNavButtonClass(secondaryNavActive)}
                  aria-label={t("Ещё")}
                  aria-current={secondaryNavActive ? "page" : undefined}
                >
                  {secondaryNavActive ? <MobileNavIndicator reduceMotion={reduceMotion} /> : null}
                  <MoreHorizontal className="h-4 w-4 shrink-0" />
                  <span className={mobileNavLabelClass}>{t("Ещё")}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <DropdownMenuItem
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className={cn(active && "bg-accent text-accent-foreground")}
                      aria-current={active ? "page" : undefined}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  );
}
