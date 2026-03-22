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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { LogOut, Plus, Settings, Shield, BarChart3, Menu, Download } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { useHeaderActions } from "@/lib/header-actions";

export function Header() {
  const {
    actions: { onAddItem },
  } = useHeaderActions();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";
  const isMainPage = pathname === "/";

  const handleExport = async (format: "csv" | "json") => {
    const res = await fetch(`/api/items/export?format=${format}`);
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
      `wishlist.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSignOut = () => {
    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
    signOut({ callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="pt-[env(safe-area-inset-top,0px)]">
        <div className="container mx-auto flex min-h-[74px] items-center justify-between gap-2 px-4 sm:min-h-[92px]">
        <button
          onClick={() => router.push("/")}
          className="flex items-center transition-opacity hover:opacity-80"
          title="На главную"
          aria-label="Вишлист — на главную"
        >
          <BrandLockup />
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {isMainPage && onAddItem && (
            <>
              <Button
                size="sm"
                onClick={onAddItem}
                title="Добавить товар"
                className="hidden sm:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
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
          )}

          {/* Desktop: показать все кнопки */}
          <div className="hidden sm:flex items-center gap-1.5">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/admin")}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
                title="Администрирование"
              >
                <Shield className="w-5 h-5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/stats")}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Статистика"
            >
              <BarChart3 className="w-5 h-5" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
                className="h-10 w-10 text-muted-foreground hover:text-foreground"
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
            </Button>

            {isMainPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-muted-foreground hover:text-foreground"
                    title="Экспорт"
                  >
                    <Download className="w-5 h-5" />
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
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-10 w-10 text-muted-foreground"
              title="Выйти"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* Mobile: dropdown menu для дополнительных действий */}
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
              <DropdownMenuContent align="end" className="w-48">
                {isAdmin && (
                  <>
                    <DropdownMenuItem onClick={() => router.push("/admin")}>
                      <Shield className="w-4 h-4 mr-2" />
                      Администрирование
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={() => router.push("/stats")}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Статистика
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Настройки
                </DropdownMenuItem>
                {isMainPage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Экспорт</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleExport("csv")}>
                      <Download className="w-4 h-4 mr-2" />
                      CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport("json")}>
                      <Download className="w-4 h-4 mr-2" />
                      JSON
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-2" />
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
