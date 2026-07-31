"use client";

import { useCallback, useEffect, useRef } from "react";

type RouterReplace = (href: string, options?: { scroll?: boolean }) => void;

type SyncParams = {
  replace: RouterReplace;
  normalizedSelectedUserId: string | null;
  selectedListId: string | null;
  selectedUserId: string | null;
  search: string;
  sortBy: string;
  viewMode: "grid" | "table";
  showPurchased: boolean;
  selectedCategories: string[];
  listIdParam: string | null;
  currentUserId: string | undefined;
  allowedListIdsForFilters: Set<string>;
};

export function useWishlistUrlSync({
  replace,
  normalizedSelectedUserId,
  selectedListId,
  selectedUserId,
  search,
  sortBy,
  viewMode,
  showPurchased,
  selectedCategories,
  listIdParam,
  currentUserId,
  allowedListIdsForFilters,
}: SyncParams) {
  const syncFiltersToUrl = useCallback(
    (overrides: Record<string, string | null> = {}) => {
      const params = new URLSearchParams();
      const vals: Record<string, string | null> = {
        userId: normalizedSelectedUserId,
        listId: selectedListId,
        search: search || null,
        sort: sortBy !== "newest" ? sortBy : null,
        view: viewMode === "table" ? "table" : null,
        purchased: showPurchased ? "show" : null,
        categories: selectedCategories.length > 0 ? selectedCategories.join(",") : null,
        ...overrides,
      };
      for (const [k, v] of Object.entries(vals)) {
        if (v) params.set(k, v);
      }
      const qs = params.toString();
      replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [
      normalizedSelectedUserId,
      selectedListId,
      search,
      sortBy,
      viewMode,
      showPurchased,
      selectedCategories,
      replace,
    ],
  );

  useEffect(() => {
    if (listIdParam !== "all") return;
    syncFiltersToUrl({ listId: null });
  }, [listIdParam, syncFiltersToUrl]);

  useEffect(() => {
    if (selectedUserId !== normalizedSelectedUserId) {
      syncFiltersToUrl({ userId: normalizedSelectedUserId, listId: null });
    }
  }, [selectedUserId, normalizedSelectedUserId, syncFiltersToUrl]);

  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncFiltersToUrl();
  }, [search, sortBy, viewMode, showPurchased, selectedCategories]); // eslint-disable-line react-hooks/exhaustive-deps -- только локальные фильтры, не весь syncFiltersToUrl

  useEffect(() => {
    if (!selectedListId || !currentUserId) return;
    if (!allowedListIdsForFilters.has(selectedListId)) {
      syncFiltersToUrl({ listId: null });
    }
  }, [selectedListId, allowedListIdsForFilters, currentUserId, syncFiltersToUrl]);

  return { syncFiltersToUrl };
}
