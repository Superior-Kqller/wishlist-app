"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  serializeWishlistFilters,
  type WishlistFiltersState,
} from "@/lib/home/wishlist-filters-url";

type RouterReplace = (href: string, options?: { scroll?: boolean }) => void;

type SyncParams = {
  replace: RouterReplace;
  /** Текущие фильтры — как их прочитали из адреса, кроме черновика поиска. */
  filters: WishlistFiltersState;
  normalizedSelectedUserId: string | null;
  listIdParam: string | null;
  currentUserId: string | undefined;
  allowedListIdsForFilters: Set<string>;
};

export function useWishlistUrlSync({
  replace,
  filters,
  normalizedSelectedUserId,
  listIdParam,
  currentUserId,
  allowedListIdsForFilters,
}: SyncParams) {
  /*
   * Адрес — хранилище фильтров, а не их отражение. Любая правка идёт сюда:
   * состояние страницы после неё перечитывается из ссылки, поэтому переход
   * по другой ссылке не может оставить прежнюю сортировку или категории.
   */
  const syncFiltersToUrl = useCallback(
    (overrides: Partial<WishlistFiltersState> = {}) => {
      const qs = serializeWishlistFilters({
        ...filters,
        userId: normalizedSelectedUserId,
        ...overrides,
      });
      replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [filters, normalizedSelectedUserId, replace],
  );

  useEffect(() => {
    if (listIdParam !== "all") return;
    syncFiltersToUrl({ listId: null });
  }, [listIdParam, syncFiltersToUrl]);

  useEffect(() => {
    if (filters.userId !== normalizedSelectedUserId) {
      syncFiltersToUrl({ userId: normalizedSelectedUserId, listId: null });
    }
  }, [filters.userId, normalizedSelectedUserId, syncFiltersToUrl]);

  useEffect(() => {
    const listId = filters.listId;
    if (!listId || !currentUserId) return;
    if (!allowedListIdsForFilters.has(listId)) {
      syncFiltersToUrl({ listId: null });
    }
  }, [filters.listId, allowedListIdsForFilters, currentUserId, syncFiltersToUrl]);

  return { syncFiltersToUrl };
}

/**
 * Поиск — единственный черновик: печатать в адресную строку по букве нельзя,
 * поэтому в ссылку попадает уже успокоившееся значение.
 */
export function useSearchDraftUrlSync(
  debouncedSearch: string,
  urlSearch: string,
  syncFiltersToUrl: (overrides: Partial<WishlistFiltersState>) => void,
) {
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (debouncedSearch === urlSearch) return;
    syncFiltersToUrl({ search: debouncedSearch });
  }, [debouncedSearch, urlSearch, syncFiltersToUrl]);
}
