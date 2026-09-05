/*
 * «Самые дорогие желания» — список внутри одной валюты.
 *
 * Раньше числа сравнивались напрямую, и 100 USD оказывались дешевле 500 RUB.
 * Курса у приложения нет, поэтому выбирается валюта, в которой желаний с ценой
 * больше всего (при равенстве — первая по алфавиту), и тройка считается в ней.
 * Так все три строки списка сравнимы между собой и с подписью цены.
 */

export type PricedItem = {
  price: number | null;
  currency: string;
  purchased: boolean;
};

export const TOP_ITEMS_LIMIT = 3;

export function pickDominantCurrency(items: PricedItem[]): string | null {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.price) continue;
    const currency = item.currency || "RUB";
    counts.set(currency, (counts.get(currency) ?? 0) + 1);
  }
  if (counts.size === 0) return null;
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

export function selectTopItems<T extends PricedItem>(items: T[]): T[] {
  const available = items.filter((item) => !item.purchased && item.price != null);
  const currency = pickDominantCurrency(available);
  if (!currency) return [];
  return available
    .filter((item) => (item.currency || "RUB") === currency)
    .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    .slice(0, TOP_ITEMS_LIMIT);
}
