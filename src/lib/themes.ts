export const colorThemes = [
  // Brandbook strict mode: фирменная тема без вариаций.
  { value: "purple", label: "Фиолетовый", color: "bg-purple-500" },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["value"];
