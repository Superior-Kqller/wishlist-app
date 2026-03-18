"use client";

import { useEffect, useState } from "react";
import { ColorTheme } from "@/lib/themes";

export const useColorTheme = () => {
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("purple");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedColorTheme = (localStorage.getItem("color-theme") as ColorTheme) || "purple";
    setColorThemeState(savedColorTheme);
    document.documentElement.setAttribute("data-theme", savedColorTheme);
  }, []);

  const setColorTheme = (newColorTheme: ColorTheme) => {
    setColorThemeState(newColorTheme);
    localStorage.setItem("color-theme", newColorTheme);
    document.documentElement.setAttribute("data-theme", newColorTheme);
  };

  return { colorTheme, setColorTheme, mounted };
};
