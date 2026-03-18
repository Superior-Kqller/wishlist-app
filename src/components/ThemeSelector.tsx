"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Palette, Check, Moon, Sun, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { colorThemes } from "@/lib/themes";
import { useColorTheme } from "@/hooks/useColorTheme";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const { colorTheme, setColorTheme, mounted } = useColorTheme();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-10 w-10" disabled>
        <Palette className="w-5 h-5" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-10 w-10" title="Выбор темы">
          <Palette className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto min-w-[140px]">
        <DropdownMenuLabel>Цветовая тема</DropdownMenuLabel>
        <div
          className="grid grid-cols-4 gap-2 px-2 py-1.5"
          role="radiogroup"
          aria-label="Выбор цветовой темы"
        >
          {colorThemes.map((t) => (
            <Tooltip key={t.value} delayDuration={300}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setColorTheme(t.value)}
                  role="radio"
                  aria-checked={colorTheme === t.value}
                  aria-label={t.label}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all duration-200 cursor-pointer",
                    "hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    t.color,
                    colorTheme === t.value
                      ? "ring-2 ring-offset-2 ring-foreground scale-110"
                      : "opacity-80 hover:opacity-100"
                  )}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {t.label}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
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
