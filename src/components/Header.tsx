"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Home,
  Languages,
  LogOut,
  Menu,
  Plus,
  SlidersHorizontal,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { useHeaderActions } from "@/lib/header-actions";

export function Header() {
  const { language, setLanguage, t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isLoginPage = pathname === "/login";
  const {
    actions: { onAddItem },
  } = useHeaderActions();

  const handleSignOut = () => {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  const handleAddItem = () => {
    if (pathname === "/" && onAddItem) {
      onAddItem();
      return;
    }
    router.push("/?add=1");
  };

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
          <div className="flex min-h-[56px] items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex min-w-0 flex-1 items-center rounded-xl py-1 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              title={t("На главную")}
              aria-label={t("Вишлист — на главную")}
            >
              <BrandLockup compact />
            </button>

            <div className="flex shrink-0 items-center gap-1.5">
              <Button
                variant="glass"
                size="icon"
                onClick={handleAddItem}
                className="size-11 min-h-[44px] min-w-[44px] shrink-0 rounded-2xl border-primary/28 bg-primary/10 text-primary shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] transition-transform hover:border-primary/38 hover:bg-primary/14 active:scale-95"
                title={t("Добавить товар")}
                aria-label={t("Добавить товар")}
              >
                <Plus className="h-[18px] w-[18px]" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11 min-h-[44px] min-w-[44px] shrink-0 rounded-2xl border border-border/45 bg-[hsl(var(--surface-3))/0.55] text-muted-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)] transition-transform hover:bg-accent/60 active:scale-95 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 data-[state=open]:border-border/70 data-[state=open]:bg-accent/70"
                    aria-label={t("Ещё действия")}
                  >
                    <Menu className="h-[18px] w-[18px]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => router.push("/")}>
                    <Home className="mr-2 h-4 w-4" />
                    {t("Главная")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/stats")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    {t("Статистика")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/preferences")}>
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {t("Предпочтения")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    {t("Настройки")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {isAdmin ? (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      {t("Администрирование")}
                  </DropdownMenuItem>
                ) : null}
                {isAdmin ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    onClick={() => setLanguage(language === "ru" ? "en" : "ru")}
                  >
                    <Languages className="mr-2 h-4 w-4" />
                    {t("Сменить язык")}: {language === "ru" ? "EN" : "RU"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("Выйти")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
