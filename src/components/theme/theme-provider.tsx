"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/i18n/language-provider";
import { THEMES, THEME_COOKIE_NAME, type ThemePreference } from "@/lib/theme";
import { cn } from "@/lib/utils";

type ThemeContextValue = {
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const THEME_OPTIONS: Record<ThemePreference, { label: string; icon: typeof Sun }> = {
  system: { label: "Системная", icon: Monitor },
  light: { label: "Светлая", icon: Sun },
  dark: { label: "Тёмная", icon: Moon },
};

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: ThemePreference;
}) {
  const [theme, setThemeState] = useState<ThemePreference>(initialTheme);

  const setTheme = useCallback((next: ThemePreference) => {
    setThemeState(next);
    document.cookie = `${THEME_COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  // «Системная» следит за настройкой устройства и после загрузки страницы.
  useEffect(() => {
    const root = document.documentElement;
    if (theme !== "system") {
      root.dataset.theme = theme;
      return;
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      root.dataset.theme = media.matches ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

/** Пункты выбора темы — для любого выпадающего меню. */
export function ThemeMenuItems() {
  const { t } = useI18n();
  const { theme, setTheme } = useTheme();
  return THEMES.map((option) => (
    <DropdownMenuItem key={option} onClick={() => setTheme(option)}>
      <Check
        className={cn("h-4 w-4", option === theme ? "opacity-100" : "opacity-0")}
        aria-hidden
      />
      {t(THEME_OPTIONS[option].label)}
    </DropdownMenuItem>
  ));
}

/** Кнопка-переключатель темы для строки настроек. */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { t } = useI18n();
  const { theme } = useTheme();
  const Icon = THEME_OPTIONS[theme].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn("h-9 gap-2 px-2.5", className)}
          aria-label={t("Сменить тему")}
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span className="text-xs font-semibold">{t(THEME_OPTIONS[theme].label)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <ThemeMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
