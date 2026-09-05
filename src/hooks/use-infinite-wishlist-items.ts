"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import type { ItemsPage } from "@/types";

const WISHLIST_ITEMS_PAGE_SIZE = 30;

/** Что именно не загрузилось: список целиком или только его продолжение. */
export type WishlistFeedError = "initial" | "next-page";

export type WishlistFeedQuery = {
  normalizedSelectedUserId: string | null;
  selectedListId: string | null;
  debouncedSearch: string;
  sortBy: string;
  showPurchased: boolean;
  categories: string[];
};

export function useInfiniteWishlistItems({
  normalizedSelectedUserId,
  selectedListId,
  debouncedSearch,
  sortBy,
  showPurchased,
  categories,
}: WishlistFeedQuery) {
  // Порядок и состав страницы задаёт сервер, поэтому оба входят в ключ SWR.
  const categoriesKey = categories.join(",");

  const getKey = useCallback(
    (_pageIndex: number, previousPageData: ItemsPage | null) => {
      if (previousPageData && !previousPageData.pagination?.hasMore) return null;
      const params = new URLSearchParams();
      if (normalizedSelectedUserId) params.set("userId", normalizedSelectedUserId);
      if (selectedListId) params.set("listId", selectedListId);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (sortBy) params.set("sort", sortBy);
      if (showPurchased) params.set("purchased", "show");
      if (categoriesKey) params.set("categories", categoriesKey);
      params.set("limit", String(WISHLIST_ITEMS_PAGE_SIZE));
      if (previousPageData?.pagination?.nextCursor) {
        params.set("cursor", previousPageData.pagination.nextCursor);
      }
      return `/api/items?${params.toString()}`;
    },
    [
      normalizedSelectedUserId,
      selectedListId,
      debouncedSearch,
      sortBy,
      showPurchased,
      categoriesKey,
    ],
  );

  const {
    data: pages,
    error,
    size,
    setSize,
    isLoading,
    isValidating,
    mutate: mutateItems,
  } = useSWRInfinite<ItemsPage>(getKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateFirstPage: true,
    dedupingInterval: 2000,
  });

  const items = useMemo(() => pages?.flatMap((p) => p.items) ?? [], [pages]);
  const hasMore = pages ? (pages[pages.length - 1]?.pagination?.hasMore ?? false) : false;
  const isLoadingMore = isValidating && size > 1;

  /*
   * Пустой каталог и неудавшаяся загрузка выглядели одинаково: items оставался
   * пустым, а ошибка никуда не доходила. Теперь их two: нечего показать — и
   * показать не удалось, причём уже загруженные карточки при ошибке следующей
   * страницы остаются на месте.
   */
  const loadError: WishlistFeedError | null = error
    ? items.length === 0
      ? "initial"
      : "next-page"
    : null;

  const retry = useCallback(() => {
    void mutateItems();
  }, [mutateItems]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // После ошибки страницы не догружаем сами: повтор запрашивает человек.
    if (loadError) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isValidating) {
          setSize((s) => s + 1);
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isValidating, setSize, loadError]);

  return {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    loadError,
    retry,
    mutateItems,
    setSize,
    size,
    sentinelRef,
  };
}
