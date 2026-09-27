"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { getAppNavItems } from "@/lib/app-navigation";

const mobileNavButtonClass = (active: boolean) =>
  cn(
    "relative h-12 min-w-0 flex-col gap-1 rounded-xl border border-transparent px-0.5 py-1.5 text-[10px] font-semibold leading-none tracking-[-0.01em] transition-[color] active:bg-accent/45",
    active
      ? "text-foreground [&_svg]:text-primary-accent"
      : "text-muted-foreground hover:bg-accent/45 hover:text-foreground",
  );

/**
 * Подпись вкладки. В колонке `flex-col` элемент по умолчанию шириной по
 * содержимому, поэтому `truncate` не срабатывал и длинная подпись
 * («Предпочтения») выезжала за подложку вкладки в соседние. Ширина по ячейке
 * возвращает обрезку и делает её страховкой для любого языка.
 */
const mobileNavLabelClass = "w-full truncate text-center";

/** Та же подложка активного раздела, что и в боковом меню, только для узких экранов. */
function MobileNavIndicator({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <motion.span
      layoutId="mobile-nav-active"
      aria-hidden
      transition={reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 36 }}
      className="absolute inset-0 -z-10 rounded-xl bg-[hsl(var(--surface-4))]"
    />
  );
}

export function Header() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isAdmin = session?.user?.role === "ADMIN";

  const navItems = getAppNavItems(t, { isAdmin });
  const primaryNavItems = navItems.filter((item) => item.group === "primary");
  // Хаб и всё, что из него открывается, подсвечивают «Ещё».
  const moreActive =
    pathname === "/more" ||
    navItems.some((item) => item.group === "secondary" && pathname === item.href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/55 bg-[hsl(var(--surface-2)/0.85)] elevation-header backdrop-blur-xl lg:hidden">
        <div className="pt-[env(safe-area-inset-top,0px)]">
          <div className="container mx-auto flex min-h-[48px] items-center gap-1 px-3 sm:px-4">
            <Link
              href="/"
              className="flex min-h-11 min-w-0 flex-1 items-center rounded-lg py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title={t("На главную")}
              aria-label={t("Вишлист — на главную")}
            >
              <BrandLockup compact />
            </Link>
          </div>
        </div>
      </header>

      {/*
       * Разделы живут внизу, под большим пальцем, а не второй строкой шапки:
       * там до них было дальше всего, и шапка съедала почти сто пикселей
       * высоты на каждом экране. Панель плавает над контентом — отступ под
       * неё держит оболочка (`AppShell`), а плавающие кнопки и тосты
       * поднимаются над ней на ту же высоту.
       */}
      <nav
        className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] z-40 mx-auto grid max-w-lg grid-cols-4 gap-1 rounded-2xl border border-border/55 bg-[hsl(var(--glass-bg))] p-1.5 elevation-floating backdrop-blur-xl lg:hidden"
        aria-label={t("Разделы")}
      >
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              size="sm"
              className={mobileNavButtonClass(active)}
            >
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                aria-label={item.shortLabel ? item.label : undefined}
              >
                {active ? <MobileNavIndicator reduceMotion={reduceMotion} /> : null}
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className={mobileNavLabelClass}>{item.shortLabel ?? item.label}</span>
              </Link>
            </Button>
          );
        })}
        {/* «Ещё» — экран-хаб, а не выпадающее меню: там же язык и выход. */}
        <Button asChild variant="ghost" size="sm" className={mobileNavButtonClass(moreActive)}>
          <Link href="/more" aria-current={moreActive ? "page" : undefined}>
            {moreActive ? <MobileNavIndicator reduceMotion={reduceMotion} /> : null}
            <MoreHorizontal className="h-5 w-5 shrink-0" aria-hidden />
            <span className={mobileNavLabelClass}>{t("Ещё")}</span>
          </Link>
        </Button>
      </nav>
    </>
  );
}
