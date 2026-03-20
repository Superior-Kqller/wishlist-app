"use client";

import { useEffect, useState } from "react";
import { ColorTheme } from "@/lib/themes";

export const useColorTheme = () => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("purple");
  const [mounted, setMounted] = useState(false);

  const normalizeColorTheme = (value: string | null): ColorTheme =>
    value === "purple" ? "purple" : "purple";

  useEffect(() => {
    setMounted(true);
    const savedColorTheme = normalizeColorTheme(localStorage.getItem("color-theme"));
    setColorThemeState(savedColorTheme);
    document.documentElement.setAttribute("data-theme", savedColorTheme);
  }, []);

  const setColorTheme = (newColorTheme: ColorTheme) => {
    const normalizedTheme = normalizeColorTheme(newColorTheme);
    setColorThemeState(normalizedTheme);
    localStorage.setItem("color-theme", normalizedTheme);
    document.documentElement.setAttribute("data-theme", normalizedTheme);
  };

  return { colorTheme, setColorTheme, mounted };
};
