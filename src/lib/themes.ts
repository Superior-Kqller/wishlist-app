export const colorThemes = [
  { value: "purple", label: "Фиолетовый", color: "bg-purple-500" },
  { value: "blue", label: "Синий", color: "bg-blue-500" },
  { value: "green", label: "Зелёный", color: "bg-green-500" },
  { value: "emerald", label: "Изумрудный", color: "bg-emerald-500" },
  { value: "cyan", label: "Бирюзовый", color: "bg-cyan-500" },
  { value: "orange", label: "Оранжевый", color: "bg-orange-500" },
  { value: "rose", label: "Розовый", color: "bg-rose-500" },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["value"];
