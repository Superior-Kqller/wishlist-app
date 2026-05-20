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
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";
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

  if (isLoginPage) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-[hsl(var(--surface-2)/0.9)] elevation-header backdrop-blur-lg lg:hidden">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex min-h-[50px] items-center px-3 sm:min-h-[64px] sm:px-4">
          <button
            onClick={() => router.push("/")}
            className="flex min-h-11 shrink-0 items-center rounded-xl transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            title={t("На главную")}
            aria-label={t("Вишлист — на главную")}
          >
            <BrandLockup />
          </button>

          <nav className="hidden flex-1 items-center justify-center gap-1.5 px-4 lg:flex">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                uiState.navBase,
                pathname === "/" && uiState.navActive
              )}
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              {t("Главная")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                uiState.navBase,
                pathname === "/stats" && uiState.navActive
              )}
              onClick={() => router.push("/stats")}
            >
              <BarChart3 className="h-4 w-4" />
              {t("Статистика")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                uiState.navBase,
                pathname === "/settings" && uiState.navActive
              )}
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-4 w-4" />
              {t("Настройки")}
            </Button>
            {isAdmin ? (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  uiState.navBase,
                  pathname === "/admin" && uiState.navActive
                )}
                onClick={() => router.push("/admin")}
              >
                <Shield className="h-4 w-4" />
                {t("Админка")}
              </Button>
            ) : null}
          </nav>

          <div className="ml-auto flex min-w-[56px] items-center justify-end gap-1 sm:min-w-[220px] sm:gap-2 lg:min-w-[340px]">
            <div className="hidden items-center gap-1.5 sm:flex lg:hidden">
              {isAdmin ? (
                <Button
                  variant={pathname === "/admin" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => router.push("/admin")}
                  className="h-10 w-10"
                  title={t("Администрирование")}
                  aria-label={t("Администрирование")}
                >
                  <Shield className="h-5 w-5" />
                </Button>
              ) : null}
              <Button
                variant={pathname === "/stats" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => router.push("/stats")}
                className="h-10 w-10"
                title={t("Статистика")}
                aria-label={t("Статистика")}
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => router.push("/settings")}
                className="h-10 w-10"
                title={t("Настройки")}
                aria-label={t("Настройки")}
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10"
                title={t("Выйти")}
                aria-label={t("Выйти")}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <div className="hidden items-center gap-1.5 lg:flex">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10"
                title={t("Выйти")}
                aria-label={t("Выйти")}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center gap-1 sm:hidden">
              <Button
                variant="default"
                size="icon"
                onClick={handleAddItem}
                className="size-10 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-primary/35 shadow-[0_7px_18px_rgba(0,0,0,0.26),0_0_12px_hsl(var(--primary)/0.16)]"
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
                    className="size-10 min-h-[44px] min-w-[44px] shrink-0 rounded-xl border border-border/35 bg-transparent text-muted-foreground shadow-none hover:bg-accent/60 focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:ring-offset-0 data-[state=open]:border-border/70 data-[state=open]:bg-accent/70"
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
        </div>
      </div>
    </header>
  );
}
