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
import { Gift, LogOut, Plus, Settings, Shield, BarChart3, Menu, Sun, Moon, Monitor, Check, Download } from "lucide-react";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useHeaderActions } from "@/lib/header-actions";

export function Header() {
  const { actions: { onAddItem } } = useHeaderActions();
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState<string>("purple");

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

  useEffect(() => {
    setMounted(true);
    const savedColorTheme = localStorage.getItem("color-theme") || "purple";
    setColorTheme(savedColorTheme);
  }, []);

  const colorThemes = [
    { value: "purple", label: "Фиолетовый", color: "bg-purple-500" },
    { value: "blue", label: "Синий", color: "bg-blue-500" },
    { value: "green", label: "Зелёный", color: "bg-green-500" },
    { value: "emerald", label: "Изумрудный", color: "bg-emerald-500" },
    { value: "cyan", label: "Бирюзовый", color: "bg-cyan-500" },
    { value: "orange", label: "Оранжевый", color: "bg-orange-500" },
    { value: "rose", label: "Розовый", color: "bg-rose-500" },
  ];

  const handleColorThemeChange = (newColorTheme: string) => {
    setColorTheme(newColorTheme);
    localStorage.setItem("color-theme", newColorTheme);
    document.documentElement.setAttribute("data-theme", newColorTheme);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-lg shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
          title="На главную"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/15 rounded-xl flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          </div>
          <div className="text-left hidden sm:block">
            <h1 className="text-lg font-semibold leading-none tracking-tight">
              Вишлист
            </h1>
            {session?.user?.name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {session.user.name}
              </p>
            )}
          </div>
          <div className="text-left sm:hidden">
            <h1 className="text-base font-semibold leading-none tracking-tight">
              Вишлист
            </h1>
          </div>
        </button>

        <div className="flex items-center gap-1 sm:gap-2">
          {isMainPage && onAddItem && (
            <>
              <Button size="sm" onClick={onAddItem} title="Добавить вручную" className="hidden sm:flex">
                <Plus className="w-4 h-4 mr-2" />
                Вручную
              </Button>
              <Button size="icon" onClick={onAddItem} title="Добавить вручную" className="sm:hidden h-8 w-8">
                <Plus className="w-4 h-4" />
              </Button>
            </>
          )}

          {/* Desktop: показать все кнопки */}
          <div className="hidden sm:flex items-center gap-1">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/admin")}
                className="h-9 w-9"
                title="Администрирование"
              >
                <Shield className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/stats")}
              className="h-9 w-9"
              title="Статистика"
            >
              <BarChart3 className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
              className="h-9 w-9"
              title="Настройки"
            >
              <Settings className="w-4 h-4" />
            </Button>

            {isMainPage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" title="Экспорт">
                    <Download className="w-4 h-4" />
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

            <ThemeSelector />

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
                signOut({ 
                  callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" 
                });
              }}
              className="h-9 w-9 text-muted-foreground"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile: dropdown menu для дополнительных действий */}
          <div className="sm:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="w-4 h-4" />
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
                <DropdownMenuLabel>Цветовая тема</DropdownMenuLabel>
                {mounted && colorThemes.map((t) => (
                  <DropdownMenuItem
                    key={t.value}
                    onClick={() => handleColorThemeChange(t.value)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${t.color}`} />
                      <span>{t.label}</span>
                    </div>
                    {colorTheme === t.value && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Режим</DropdownMenuLabel>
                {mounted && (
                  <>
                    <DropdownMenuItem
                      onClick={() => setTheme("light")}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Sun className="w-4 h-4" />
                        <span>Светлый</span>
                      </div>
                      {theme === "light" && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme("dark")}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Moon className="w-4 h-4" />
                        <span>Тёмный</span>
                      </div>
                      {theme === "dark" && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme("system")}
                      className="flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Monitor className="w-4 h-4" />
                        <span>Системный</span>
                      </div>
                      {theme === "system" && <Check className="w-4 h-4 text-primary" />}
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
                    signOut({ 
                      callbackUrl: currentOrigin ? `${currentOrigin}/login` : "/login" 
                    });
                  }}
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
    </header>
  );
}
