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

/** Суммы по валютам в статистике вишлиста */
export type CurrencyTotals = { unpurchased: number; purchased: number };

/** Стабильный порядок валют для отображения */
export function sortCurrencyTotalsEntries(
  pricesByCurrency: Record<string, CurrencyTotals> | undefined | null,
): [string, CurrencyTotals][] {
  if (!pricesByCurrency) return [];
  return Object.entries(pricesByCurrency).sort(([a], [b]) => a.localeCompare(b));
}

/** Текст «стоимость не купленного» с учётом нескольких валют (для компактного UI) */
export function formatStatsUnpurchasedSummary(stats: {
  totalWishlistValue: number;
  currency?: string;
  pricesByCurrency?: Record<string, CurrencyTotals>;
}): string {
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown =
    stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    return formatPrice(stats.totalWishlistValue, fallbackCur);
  }
  const entries = sortCurrencyTotalsEntries(stats.pricesByCurrency).filter(
    ([, v]) => v.unpurchased > 0,
  );
  if (entries.length === 0) {
    return formatPrice(0, fallbackCur);
  }
  return entries.map(([c, v]) => formatPrice(v.unpurchased, c)).join(" · ");
}

/** Текст суммы купленного по валютам; null если нет купленных позиций с ценой */
export function formatStatsPurchasedSummary(stats: {
  totalPurchasedValue: number;
  currency?: string;
  pricesByCurrency?: Record<string, CurrencyTotals>;
}): string | null {
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown =
    stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    if (stats.totalPurchasedValue > 0) {
      return formatPrice(stats.totalPurchasedValue, fallbackCur);
    }
    return null;
  }
  const entries = sortCurrencyTotalsEntries(stats.pricesByCurrency).filter(
    ([, v]) => v.purchased > 0,
  );
  if (entries.length === 0) return null;
  return entries.map(([c, v]) => formatPrice(v.purchased, c)).join(" · ");
}

export function statsHasPurchasedPrices(stats: {
  totalPurchasedValue: number;
  pricesByCurrency?: Record<string, CurrencyTotals>;
}): boolean {
  if (stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0) {
    return Object.values(stats.pricesByCurrency).some((v) => v.purchased > 0);
  }
  return stats.totalPurchasedValue > 0;
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
  "#7c5cbf", "#a85cad", "#5c6ebf", "#bf5c8a", "#5ca0bf",
  "#8a5cbf", "#5cbf9a", "#bf8a5c", "#5c8abf", "#bf5c5c",
  "#6b5cbf", "#5cbfbf", "#bf6b5c", "#8a8abf",
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
