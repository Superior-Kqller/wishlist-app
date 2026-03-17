"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Palette, Check, Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

const colorThemes = [
  { value: "purple", label: "Фиолетовый", color: "bg-purple-500" },
  { value: "blue", label: "Синий", color: "bg-blue-500" },
  { value: "green", label: "Зелёный", color: "bg-green-500" },
  { value: "emerald", label: "Изумрудный", color: "bg-emerald-500" },
  { value: "cyan", label: "Бирюзовый", color: "bg-cyan-500" },
  { value: "orange", label: "Оранжевый", color: "bg-orange-500" },
  { value: "rose", label: "Розовый", color: "bg-rose-500" },
] as const;

export function ThemeSelector() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [colorTheme, setColorTheme] = useState<string>("purple");

  useEffect(() => {
    setMounted(true);
    // Получаем сохранённую цветовую тему из localStorage
    const savedColorTheme = localStorage.getItem("color-theme") || "purple";
    setColorTheme(savedColorTheme);
    // Применяем тему к document
    document.documentElement.setAttribute("data-theme", savedColorTheme);
  }, []);

  const handleColorThemeChange = (newColorTheme: string) => {
    setColorTheme(newColorTheme);
    localStorage.setItem("color-theme", newColorTheme);
    document.documentElement.setAttribute("data-theme", newColorTheme);
  };

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Palette className="w-4 h-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title="Выбор темы">
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Цветовая тема</DropdownMenuLabel>
        {colorThemes.map((t) => (
          <DropdownMenuItem
            key={t.value}
            onClick={() => handleColorThemeChange(t.value)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded-full", t.color)} />
              <span>{t.label}</span>
            </div>
            {colorTheme === t.value && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Режим</DropdownMenuLabel>
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
