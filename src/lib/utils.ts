import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Language, getLanguageLocale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(
  price: number,
  currency: string = "RUB",
  language: Language = "ru",
): string {
  const symbols: Record<string, string> = {
    RUB: "₽",
    USD: "$",
    EUR: "€",
    CNY: "¥",
  };
  const symbol = symbols[currency] || currency;
  return `${price.toLocaleString(getLanguageLocale(language))} ${symbol}`;
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
export function formatStatsUnpurchasedSummary(
  stats: {
    totalWishlistValue: number;
    currency?: string;
    pricesByCurrency?: Record<string, CurrencyTotals>;
  },
  language: Language = "ru",
): string {
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown = stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    return formatPrice(stats.totalWishlistValue, fallbackCur, language);
  }
  const entries = sortCurrencyTotalsEntries(stats.pricesByCurrency).filter(
    ([, v]) => v.unpurchased > 0,
  );
  if (entries.length === 0) {
    return formatPrice(0, fallbackCur, language);
  }
  return entries.map(([c, v]) => formatPrice(v.unpurchased, c, language)).join(" · ");
}

/** Текст суммы купленного по валютам; null если нет купленных позиций с ценой */
export function formatStatsPurchasedSummary(
  stats: {
    totalPurchasedValue: number;
    currency?: string;
    pricesByCurrency?: Record<string, CurrencyTotals>;
  },
  language: Language = "ru",
): string | null {
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown = stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    if (stats.totalPurchasedValue > 0) {
      return formatPrice(stats.totalPurchasedValue, fallbackCur, language);
    }
    return null;
  }
  const entries = sortCurrencyTotalsEntries(stats.pricesByCurrency).filter(
    ([, v]) => v.purchased > 0,
  );
  if (entries.length === 0) return null;
  return entries.map(([c, v]) => formatPrice(v.purchased, c, language)).join(" · ");
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
    1: "text-[hsl(var(--priority-1))]",
    2: "text-[hsl(var(--priority-2))]",
    3: "text-[hsl(var(--priority-3))]",
    4: "text-[hsl(var(--priority-4))]",
    5: "text-[hsl(var(--priority-5))]",
  };
  return colors[priority] || colors[3];
}

export function priorityBgColor(priority: number): string {
  const colors: Record<number, string> = {
    1: "bg-[hsl(var(--priority-1)/0.12)]",
    2: "bg-[hsl(var(--priority-2)/0.12)]",
    3: "bg-[hsl(var(--priority-3)/0.14)]",
    4: "bg-[hsl(var(--priority-4)/0.15)]",
    5: "bg-[hsl(var(--priority-5)/0.16)]",
  };
  return colors[priority] || colors[3];
}

/** Класс для левой полоски приоритета на карточке (светлая и тёмная тема) */
export function priorityBorderClass(priority: number): string {
  const borders: Record<number, string> = {
    1: "border-l-[hsl(var(--priority-1))]",
    2: "border-l-[hsl(var(--priority-2))]",
    3: "border-l-[hsl(var(--priority-3))]",
    4: "border-l-[hsl(var(--priority-4))]",
    5: "border-l-[hsl(var(--priority-5))]",
  };
  return "border-l-4 " + (borders[priority] || borders[3]);
}
