export const colorThemes = [
  {
    value: "classic",
    label: "Классический",
    description: "Старая фиолетовая тема и оригинальный знак",
    className: "theme-classic",
    logo: "classic",
    swatches: ["bg-[#8f61e8]", "bg-[#2f1a74]", "bg-[#12101b]"],
  },
  {
    value: "graphite",
    label: "Графитовый",
    description: "Спокойная тёмная основа с прохладным акцентом",
    className: "theme-graphite",
    logo: "token",
    swatches: ["bg-[#2d7f8e]", "bg-[#8b96a3]", "bg-[#161a21]"],
  },
  {
    value: "wine-sky",
    label: "Бордово-голубой",
    description: "Холодный винный фон, ледяной голубой и припылённая роза",
    className: "theme-wine-sky",
    logo: "token",
    swatches: ["bg-[#8B1026]", "bg-[#A6D2EC]", "bg-[#07111D]", "bg-[#A65D79]"],
  },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["value"];

export const DEFAULT_COLOR_THEME: ColorTheme = "graphite";
export const COLOR_THEME_STORAGE_KEY = "wishlist-color-theme";

export function isColorTheme(value: unknown): value is ColorTheme {
  return colorThemes.some((theme) => theme.value === value);
}
