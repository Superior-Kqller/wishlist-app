"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  COLOR_THEME_STORAGE_KEY,
  DEFAULT_COLOR_THEME,
  colorThemes,
  isColorTheme,
  type ColorTheme,
} from "@/lib/themes";

type ColorThemeContextValue = {
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
};

const ColorThemeContext = createContext<ColorThemeContextValue | null>(null);

function applyColorTheme(theme: ColorTheme) {
  const root = document.documentElement;
  root.classList.remove(...colorThemes.map((item) => item.className));
  const nextTheme = colorThemes.find((item) => item.value === theme);
  if (nextTheme) {
    root.classList.add(nextTheme.className);
  }
}

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorTheme, setColorThemeState] =
    useState<ColorTheme>(DEFAULT_COLOR_THEME);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    const initialTheme = isColorTheme(storedTheme)
      ? storedTheme
      : DEFAULT_COLOR_THEME;

    setColorThemeState(initialTheme);
    applyColorTheme(initialTheme);
  }, []);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setColorThemeState(theme);
    applyColorTheme(theme);
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, theme);
  }, []);

  const value = useMemo(
    () => ({ colorTheme, setColorTheme }),
    [colorTheme, setColorTheme],
  );

  return (
    <ColorThemeContext.Provider value={value}>
      {children}
    </ColorThemeContext.Provider>
  );
}

export function useColorTheme() {
  const context = useContext(ColorThemeContext);
  if (!context) {
    throw new Error("useColorTheme must be used inside ColorThemeProvider");
  }
  return context;
}
