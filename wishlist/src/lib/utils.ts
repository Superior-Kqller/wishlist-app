import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency: string = "RUB"): string {
  const symbols: Record<string, string> = {
    RUB: "₽",
    USD: "$",
    EUR: "€",
    CNY: "¥",
  };
  const symbol = symbols[currency] || currency;
  return `${price.toLocaleString("ru-RU")} ${symbol}`;
}

export function priorityColor(priority: number): string {
  const colors: Record<number, string> = {
    1: "text-slate-400",
    2: "text-blue-500",
    3: "text-amber-500",
    4: "text-orange-500",
    5: "text-red-500",
  };
  return colors[priority] || colors[3];
}

export function priorityBgColor(priority: number): string {
  const colors: Record<number, string> = {
    1: "bg-slate-100 dark:bg-slate-800",
    2: "bg-blue-50 dark:bg-blue-950",
    3: "bg-amber-50 dark:bg-amber-950",
    4: "bg-orange-50 dark:bg-orange-950",
    5: "bg-red-50 dark:bg-red-950",
  };
  return colors[priority] || colors[3];
}

/** Класс для левой полоски приоритета на карточке (светлая и тёмная тема) */
export function priorityBorderClass(priority: number): string {
  const borders: Record<number, string> = {
    1: "border-l-slate-400 dark:border-l-slate-500",
    2: "border-l-blue-500 dark:border-l-blue-400",
    3: "border-l-amber-500 dark:border-l-amber-400",
    4: "border-l-orange-500 dark:border-l-orange-400",
    5: "border-l-red-500 dark:border-l-red-400",
  };
  return "border-l-4 " + (borders[priority] || borders[3]);
}

/** Палитра цветов для тегов (хорошо читаются в светлой и тёмной теме) */
const TAG_PALETTE = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#0ea5e9",
  "#a855f7", "#22c55e", "#e11d48", "#64748b",
];

/** Цвет тега по имени (детерминированно, один тег — один цвет) */
export function getTagColor(tagName: string): string {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    hash = (hash << 5) - hash + tagName.charCodeAt(i);
    hash |= 0;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}
