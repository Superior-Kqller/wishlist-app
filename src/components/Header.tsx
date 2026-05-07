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
  LogOut,
  Menu,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isLoginPage = pathname === "/login";

  const handleSignOut = () => {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  if (isLoginPage) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[hsl(var(--surface-2)/0.92)] shadow-[0_1px_8px_rgba(0,0,0,0.34)] backdrop-blur-lg lg:hidden">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex min-h-[54px] items-center px-3 sm:min-h-[64px] sm:px-4">
          <button
            onClick={() => router.push("/")}
            className="shrink-0 transition-opacity hover:opacity-90"
            title="На главную"
            aria-label="Вишлист — на главную"
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
              Главная
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
              Статистика
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
              Настройки
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
                Админка
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
                  title="Администрирование"
                  aria-label="Администрирование"
                >
                  <Shield className="h-5 w-5" />
                </Button>
              ) : null}
              <Button
                variant={pathname === "/stats" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => router.push("/stats")}
                className="h-10 w-10"
                title="Статистика"
                aria-label="Статистика"
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => router.push("/settings")}
                className="h-10 w-10"
                title="Настройки"
                aria-label="Настройки"
              >
                <Settings className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10"
                title="Выйти"
                aria-label="Выйти"
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
                title="Выйти"
                aria-label="Выйти"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-10 min-h-[44px] min-w-[44px] shrink-0"
                    aria-label="Открыть меню"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  {isAdmin ? (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Администрирование
                    </DropdownMenuItem>
                  ) : null}
                  {isAdmin ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Выйти
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
