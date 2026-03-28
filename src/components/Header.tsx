"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  Download,
  Home,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
} from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { useHeaderActions } from "@/lib/header-actions";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";

export function Header() {
  const {
    actions: { onAddItem },
  } = useHeaderActions();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isMainPage = pathname === "/";
  const isLoginPage = pathname === "/login";

  const handleExport = async (format: "csv" | "json") => {
    const res = await fetch(`/api/items/export?format=${format}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
      `wishlist.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = () => {
    const currentOrigin =
      typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  if (isLoginPage) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-secondary/95 shadow-sm backdrop-blur-md">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex min-h-[64px] items-center justify-between gap-3 px-4 sm:min-h-[72px]">
          <button
            onClick={() => router.push("/")}
            className="flex items-center transition-opacity hover:opacity-90"
            title="На главную"
            aria-label="Вишлист — на главную"
          >
            <BrandLockup />
          </button>

          <div className="hidden items-center gap-1.5 lg:flex">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-2 px-3 text-muted-foreground hover:text-foreground",
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
                "h-9 gap-2 px-3 text-muted-foreground hover:text-foreground",
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
                "h-9 gap-2 px-3 text-muted-foreground hover:text-foreground",
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
                  "h-9 gap-2 px-3 text-muted-foreground hover:text-foreground",
                  pathname === "/admin" && uiState.navActive
                )}
                onClick={() => router.push("/admin")}
              >
                <Shield className="h-4 w-4" />
                Админка
              </Button>
            ) : null}
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {isMainPage && onAddItem ? (
              <>
                <Button
                  size="sm"
                  onClick={onAddItem}
                  title="Добавить товар"
                  className="hidden sm:inline-flex"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить товар
                </Button>
                <Button
                  size="icon"
                  onClick={onAddItem}
                  title="Добавить товар"
                  className="size-11 min-h-[44px] min-w-[44px] shrink-0 sm:hidden"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </>
            ) : null}

            <div className="hidden items-center gap-1.5 sm:flex lg:hidden">
              {isAdmin ? (
                <Button
                  variant={pathname === "/admin" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => router.push("/admin")}
                  className="h-10 w-10"
                  title="Администрирование"
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
              >
                <BarChart3 className="h-5 w-5" />
              </Button>
              <Button
                variant={pathname === "/settings" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => router.push("/settings")}
                className="h-10 w-10"
                title="Настройки"
              >
                <Settings className="h-5 w-5" />
              </Button>
              {isMainPage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      title="Экспорт"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      Экспорт CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")}>
                      Экспорт JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10"
                title="Выйти"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>

            <div className="hidden items-center gap-1.5 lg:flex">
              {isMainPage ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      title="Экспорт"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      Экспорт CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")}>
                      Экспорт JSON
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="h-10 w-10"
                title="Выйти"
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
                    className="size-11 min-h-[44px] min-w-[44px] shrink-0"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => router.push("/")}>
                    <Home className="mr-2 h-4 w-4" />
                    Главная
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/stats")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Статистика
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Настройки
                  </DropdownMenuItem>
                  {isAdmin ? (
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="mr-2 h-4 w-4" />
                      Администрирование
                    </DropdownMenuItem>
                  ) : null}
                  {isMainPage ? (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Экспорт</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleExport("csv")}>
                        <Download className="mr-2 h-4 w-4" />
                        CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleExport("json")}>
                        <Download className="mr-2 h-4 w-4" />
                        JSON
                      </DropdownMenuItem>
                    </>
                  ) : null}
                  <DropdownMenuSeparator />
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
