export const colorThemes = [
  {
    value: "graphite",
    label: "Графитовый",
    description: "Спокойная тёмная основа с прохладным акцентом",
    className: "theme-graphite",
    swatches: ["bg-[#2d7f8e]", "bg-[#8b96a3]", "bg-[#161a21]"],
  },
  {
    value: "wine-sky",
    label: "Бордово-голубой",
    description: "Глубокий винный фон и свежий небесный акцент",
    className: "theme-wine-sky",
    swatches: ["bg-[#8f263d]", "bg-[#62bddc]", "bg-[#17151d]"],
  },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["value"];

export const DEFAULT_COLOR_THEME: ColorTheme = "graphite";
export const COLOR_THEME_STORAGE_KEY = "wishlist-color-theme";

export function isColorTheme(value: unknown): value is ColorTheme {
  return colorThemes.some((theme) => theme.value === value);
}
