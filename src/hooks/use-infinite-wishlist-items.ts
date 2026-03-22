"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import type { ItemsPage } from "@/types";

export const WISHLIST_ITEMS_PAGE_SIZE = 30;

export function useInfiniteWishlistItems(
  normalizedSelectedUserId: string | null,
  selectedListId: string | null,
  debouncedSearch: string,
) {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: ItemsPage | null) => {
      if (previousPageData && !previousPageData.pagination?.hasMore) return null;
      const params = new URLSearchParams();
      if (normalizedSelectedUserId) {
        params.set(
          "userId",
          normalizedSelectedUserId === "me" ? "me" : normalizedSelectedUserId,
        );
      }
      if (selectedListId) params.set("listId", selectedListId);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", String(WISHLIST_ITEMS_PAGE_SIZE));
      if (previousPageData?.pagination?.nextCursor) {
        params.set("cursor", previousPageData.pagination.nextCursor);
      }
      return `/api/items?${params.toString()}`;
    },
    [normalizedSelectedUserId, selectedListId, debouncedSearch],
  );

  const {
    data: pages,
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
  const hasMore = pages
    ? (pages[pages.length - 1]?.pagination?.hasMore ?? false)
    : false;
  const isLoadingMore = isValidating && size > 1;

  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
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
  }, [hasMore, isValidating, setSize]);

  return {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    isValidating,
    mutateItems,
    setSize,
    size,
    sentinelRef,
  };
}
