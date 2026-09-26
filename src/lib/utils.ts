import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { type Language, getLanguageLocale } from "@/lib/i18n";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Заглавная только у первой буквы строки.
 *
 * CSS-класс `capitalize` поднимает регистр у каждого слова, поэтому
 * `toLocaleDateString` в русской локали превращался в «Август 2026 Г.» —
 * сокращение «г.» получало заглавную букву. Здесь регистр меняется один раз
 * и с учётом локали.
 */
export function capitalizeFirst(value: string, locale?: string): string {
  if (!value) return value;
  const [first, ...rest] = Array.from(value);
  return first.toLocaleUpperCase(locale) + rest.join("");
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
type CurrencyTotals = { unpurchased: number; purchased: number };

/** Стабильный порядок валют для отображения */
export function sortCurrencyTotalsEntries(
  pricesByCurrency: Record<string, CurrencyTotals> | undefined | null,
): [string, CurrencyTotals][] {
  if (!pricesByCurrency) return [];
  return Object.entries(pricesByCurrency).sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Сумма некупленного или купленного по валютам для компактного UI: «100 ₽ · 10 $».
 * Без разбивки по валютам — общий итог. `null` — ненулевых сумм нет.
 */
export function formatStatsSummary(
  stats: {
    totalWishlistValue?: number;
    totalPurchasedValue?: number;
    currency?: string;
    pricesByCurrency?: Record<string, CurrencyTotals>;
  },
  kind: keyof CurrencyTotals,
  language: Language = "ru",
): string | null {
  const entries = sortCurrencyTotalsEntries(stats.pricesByCurrency);
  if (entries.length === 0) {
    const total =
      (kind === "purchased" ? stats.totalPurchasedValue : stats.totalWishlistValue) ?? 0;
    return total > 0 ? formatPrice(total, stats.currency || "RUB", language) : null;
  }
  const parts = entries
    .filter(([, v]) => v[kind] > 0)
    .map(([c, v]) => formatPrice(v[kind], c, language));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Ошибка загрузки");
    return r.json();
  });
