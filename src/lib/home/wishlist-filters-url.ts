import { DEFAULT_WISHLIST_SORT, parseWishlistSort } from "@/lib/wishlist/item-sort";

/*
 * Фильтры каталога живут в ссылке.
 *
 * Раньше половина из них читалась из URL только при первом рендере: переход на
 * другую ссылку той же страницы оставлял прежнюю сортировку и категории, а
 * следующая запись состояния возвращала их обратно в адрес. Разбор и сборка
 * описаны здесь рядом, одной парой, и обе стороны знают один набор ключей.
 */

export type WishlistViewMode = "grid" | "table";

export type WishlistFiltersState = {
  userId: string | null;
  listId: string | null;
  search: string;
  sort: string;
  view: WishlistViewMode;
  showPurchased: boolean;
  categories: string[];
};

type ReadableParams = { get(name: string): string | null };

export function parseWishlistFilters(params: ReadableParams): WishlistFiltersState {
  const userId = params.get("userId");
  const listId = params.get("listId");
  const categories = params.get("categories");
  return {
    userId: userId === "me" ? "me" : userId || null,
    // `all` из старых ссылок значит то же, что отсутствие подборки.
    listId: listId && listId !== "all" ? listId : null,
    search: params.get("search") || "",
    sort: parseWishlistSort(params.get("sort")),
    view: params.get("view") === "table" ? "table" : "grid",
    showPurchased: params.get("purchased") === "show",
    categories: categories ? categories.split(",").filter(Boolean) : [],
  };
}

/** Значения по умолчанию в адрес не пишутся — ссылка остаётся короткой. */
export function serializeWishlistFilters(state: WishlistFiltersState): string {
  const params = new URLSearchParams();
  const values: Record<string, string | null> = {
    userId: state.userId,
    listId: state.listId,
    search: state.search || null,
    sort: state.sort !== DEFAULT_WISHLIST_SORT ? state.sort : null,
    view: state.view === "table" ? "table" : null,
    purchased: state.showPurchased ? "show" : null,
    categories: state.categories.length > 0 ? state.categories.join(",") : null,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
