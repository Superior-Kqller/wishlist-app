"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import useSWRInfinite from "swr/infinite";
import { useHeaderActions } from "@/lib/header-actions";
import { WishlistGrid } from "@/components/WishlistGrid";
import { ItemFormDialog } from "@/components/ItemFormDialog";
import { ParseUrlDialog } from "@/components/ParseUrlDialog";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { TagFilter } from "@/components/TagFilter";
import { CombinedFilter } from "@/components/CombinedFilter";
import { ListFormDialog } from "@/components/ListFormDialog";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2, CheckSquare } from "lucide-react";
import {
  WishlistItem,
  ItemsPage,
  Tag,
  CreateItemPayload,
  ParsedProductResponse,
  UserWithStats,
  ListWithMeta,
} from "@/types";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/lib/use-debounce";
import { filterListsBySelectedUser } from "@/lib/list-filter-client";
import { normalizeSelectedUserId } from "@/lib/filter-state";

const ITEMS_PER_PAGE = 30;

function HomePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = session?.user?.id;

  // Получаем userId и listId из URL параметров
  const userIdParam = searchParams.get("userId");
  const selectedUserId = userIdParam === "me" ? "me" : userIdParam || null;
  const listIdParam = searchParams.get("listId");
  const selectedListId = listIdParam || null;

  // Filter states — инициализация из URL
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const debouncedSearch = useDebounce(search, 300);
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "newest");
  const [showPurchased, setShowPurchased] = useState(() => searchParams.get("purchased") !== "hide");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  });

  const { data: usersStatsData } = useSWR<{ users: UserWithStats[] }>(
    "/api/users/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Статистика меняется реже
    }
  );
  const usersWithStats = useMemo(
    () => usersStatsData?.users ?? [],
    [usersStatsData?.users]
  );
  const normalizedSelectedUserId = useMemo(
    () =>
      normalizeSelectedUserId(selectedUserId, currentUserId, usersWithStats),
    [selectedUserId, currentUserId, usersWithStats]
  );

  // Data fetching (infinite scroll)
  const getKey = useCallback(
    (pageIndex: number, previousPageData: ItemsPage | null) => {
      if (previousPageData && !previousPageData.pagination?.hasMore) return null;
      const params = new URLSearchParams();
      if (normalizedSelectedUserId) {
        params.set(
          "userId",
          normalizedSelectedUserId === "me" ? "me" : normalizedSelectedUserId
        );
      }
      if (selectedListId) params.set("listId", selectedListId);
      if (debouncedSearch) params.set("search", debouncedSearch);
      params.set("limit", String(ITEMS_PER_PAGE));
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
  const hasMore = pages ? pages[pages.length - 1]?.pagination?.hasMore ?? false : false;
  const isLoadingMore = isValidating && size > 1;

  // Intersection Observer для бесконечной прокрутки
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
  const tagsFromItems = useMemo(() => {
    const byId = new Map<string, Tag>();
    items.forEach((item) => {
      item.tags?.forEach((t) => {
        if (!byId.has(t.id)) byId.set(t.id, t);
      });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);
  const { data: tags } = useSWR<Tag[]>(
    "/api/tags",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // Теги меняются реже, можно кэшировать дольше
    }
  );
  const { data: listsData, mutate: mutateLists } = useSWR<ListWithMeta[]>(
    "/api/lists",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const lists = useMemo(() => listsData ?? [], [listsData]);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [parsedData, setParsedData] = useState<Partial<CreateItemPayload> | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithMeta | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItem | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [pendingStatusByItemId, setPendingStatusByItemId] = useState<Record<string, boolean>>({});

  const { setActions } = useHeaderActions();
  useEffect(() => {
    setActions({
      onAddItem: () => {
        setParsedData(null);
        setAddDialogOpen(true);
      },
      onParseUrl: () => setParseDialogOpen(true),
    });
    return () => setActions({});
  }, [setActions]);

  // Синхронизация фильтров в URL (без добавления в history)
  const syncFiltersToUrl = useCallback(
    (overrides: Record<string, string | null> = {}) => {
      const params = new URLSearchParams();
      const vals: Record<string, string | null> = {
        userId: normalizedSelectedUserId,
        listId: selectedListId,
        search: search || null,
        sort: sortBy !== "newest" ? sortBy : null,
        purchased: showPurchased ? null : "hide",
        tags: selectedTags.length > 0 ? selectedTags.join(",") : null,
        ...overrides,
      };
      for (const [k, v] of Object.entries(vals)) {
        if (v) params.set(k, v);
      }
      const qs = params.toString();
      router.replace(qs ? `/?${qs}` : "/", { scroll: false });
    },
    [
      normalizedSelectedUserId,
      selectedListId,
      search,
      sortBy,
      showPurchased,
      selectedTags,
      router,
    ],
  );

  // Sync когда меняются локальные фильтры (search, sort, purchased, tags)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (selectedUserId !== normalizedSelectedUserId) {
      syncFiltersToUrl({ userId: normalizedSelectedUserId, listId: null });
    }
  }, [selectedUserId, normalizedSelectedUserId, syncFiltersToUrl]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    syncFiltersToUrl();
  }, [search, sortBy, showPurchased, selectedTags]); // eslint-disable-line react-hooks/exhaustive-deps

  const allowedListIdsForFilters = useMemo(() => {
    if (!currentUserId) return new Set(lists.map((l) => l.id));
    return new Set(
      filterListsBySelectedUser(
        lists,
        usersWithStats,
        currentUserId,
        normalizedSelectedUserId
      ).map((l) => l.id)
    );
  }, [lists, usersWithStats, currentUserId, normalizedSelectedUserId]);

  useEffect(() => {
    if (!selectedListId || !currentUserId) return;
    if (!allowedListIdsForFilters.has(selectedListId)) {
      syncFiltersToUrl({ listId: null });
    }
  }, [
    selectedListId,
    allowedListIdsForFilters,
    currentUserId,
    syncFiltersToUrl,
  ]);

  const tagsForFilters = useMemo(
    () => (tags && tags.length > 0 ? tags : tagsFromItems),
    [tags, tagsFromItems]
  );
  const effectiveSelectedTags = useMemo(() => {
    const availableTagIds = new Set(tagsForFilters.map((t) => t.id));
    return selectedTags.filter((id) => availableTagIds.has(id));
  }, [selectedTags, tagsForFilters]);

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    if (!items) return [];

    let filtered = [...items];

    // Purchased filter
    if (!showPurchased) {
      filtered = filtered.filter((item) => !item.purchased);
    }

    // Tag filter (only by tags that exist in current items)
    if (effectiveSelectedTags.length > 0) {
      filtered = filtered.filter((item) =>
        effectiveSelectedTags.some((tagId) => item.tags.some((t) => t.id === tagId))
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "priority-high":
          return b.priority - a.priority;
        case "priority-low":
          return a.priority - b.priority;
        case "price-high":
          return (b.price || 0) - (a.price || 0);
        case "price-low":
          return (a.price || 0) - (b.price || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [items, sortBy, showPurchased, effectiveSelectedTags]);

  // Handlers
  const handleCreateItem = useCallback(async (data: CreateItemPayload) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка при создании желания");
    toast.success("Добавлено в список!");
    mutateItems();
    mutate("/api/tags");
  }, [mutateItems]);

  const handleUpdateItem = useCallback(
    async (data: CreateItemPayload) => {
      if (!editingItem) return;
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Ошибка при обновлении желания");
      toast.success("Сохранено!");
      mutateItems();
      mutate("/api/tags");
      setEditingItem(null);
    },
    [editingItem, mutateItems],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setDeletingItemId(id);
  }, []);

  const confirmDeleteItem = useCallback(async () => {
    if (!deletingItemId) return;
    const res = await fetch(`/api/items/${deletingItemId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Ошибка при удалении желания");
    toast.success("Удалено");
    mutateItems();
    setDeletingItemId(null);
  }, [deletingItemId, mutateItems]);

  const handleTogglePurchased = useCallback(
    async (id: string, purchased: boolean) => {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased }),
      });
      if (!res.ok) throw new Error("Ошибка при обновлении желания");
      toast.success(purchased ? "Отмечено как купленное" : "Отметка снята");
      mutateItems();
    },
    [mutateItems],
  );

  const handleSetItemStatus = useCallback(
    async (id: string, status: "AVAILABLE" | "CLAIMED" | "PURCHASED") => {
      if (pendingStatusByItemId[id]) return;
      setPendingStatusByItemId((prev) => ({ ...prev, [id]: true }));
      try {
        const res = await fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          if (res.status === 409) {
            await mutateItems();
            toast.error("Статус уже изменился, список обновлён");
            return;
          }
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Ошибка смены статуса");
        }
        const statusText =
          status === "AVAILABLE"
            ? "Бронь снята"
            : status === "CLAIMED"
              ? "Товар забронирован"
              : "Отмечено купленным";
        toast.success(statusText);
        await mutateItems();
      } finally {
        setPendingStatusByItemId((prev) => ({ ...prev, [id]: false }));
      }
    },
    [mutateItems, pendingStatusByItemId]
  );

  const handlePriorityChange = useCallback(
    async (id: string, priority: number) => {
      // Оптимистичное обновление
      mutateItems(
        (current) =>
          current?.map((page) => ({
            ...page,
            items: page.items.map((item) =>
              item.id === id ? { ...item, priority } : item,
            ),
          })),
        { revalidate: false },
      );
      try {
        const res = await fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ priority }),
        });
        if (!res.ok) throw new Error();
      } catch {
        mutateItems();
        toast.error("Не удалось изменить приоритет");
      }
    },
    [mutateItems],
  );

  const handleParsed = useCallback((data: ParsedProductResponse) => {
    setParsedData({
      title: data.title,
      url: data.url,
      price: data.price || undefined,
      currency: data.currency,
      images: data.images,
    });
    setAddDialogOpen(true);
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) => fetch(`/api/items/${id}`, { method: "DELETE" })),
    );
    const ok = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length;
    toast.success(`Удалено ${ok} из ${ids.length}`);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkProcessing(false);
    mutateItems();
  }, [selectedIds, mutateItems]);

  const handleBulkMarkPurchased = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const results = await Promise.allSettled(
      ids.map((id) =>
        fetch(`/api/items/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ purchased: true }),
        }),
      ),
    );
    const ok = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length;
    toast.success(`Отмечено купленным: ${ok} из ${ids.length}`);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkProcessing(false);
    mutateItems();
  }, [selectedIds, mutateItems]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleUserChange = useCallback(
    (userId: string | null) => {
      const uid =
        userId === null ? null : userId === "me" ? "me" : userId;
      // Сброс подборки при смене «контекста» пользователя — иначе AND (userId + listId) даёт пустой список
      syncFiltersToUrl({ userId: uid, listId: null });
    },
    [syncFiltersToUrl]
  );

  const handleListChange = useCallback((listId: string | null) => {
    syncFiltersToUrl({ listId });
  }, [syncFiltersToUrl]);

  return (
    <div className="min-h-screen page-bg">
      <main className="container mx-auto space-y-3 px-4 py-3 sm:space-y-4 sm:py-6">
        <div className="sticky top-16 z-30 -mx-4 flex min-w-0 flex-col gap-2 border-b border-border bg-card px-4 py-2 sm:static sm:top-[76px] sm:z-auto sm:border-0 sm:bg-transparent sm:py-3">
          {/* Мобильная компактная строка: только поиск + кнопка «Фильтры» */}
          <div className="flex min-w-0 items-center gap-2 sm:hidden">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-10 rounded-lg bg-card pl-8 text-sm"
              />
            </div>
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg"
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
              title={selectionMode ? "Отменить выбор" : "Выбрать"}
            >
              <CheckSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg"
              onClick={() => setMobileFiltersOpen(true)}
              title="Фильтры"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
          {/* Десктоп: объединённый фильтр */}
          <div className="hidden sm:flex flex-row flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            {currentUserId && usersWithStats.length > 0 && (
              <CombinedFilter
                currentUserId={currentUserId}
                users={usersWithStats}
                lists={lists}
                selectedUserId={normalizedSelectedUserId}
                selectedListId={selectedListId}
                onUserChange={handleUserChange}
                onListChange={handleListChange}
                onCreateList={() => {
                  setEditingList(null);
                  setListDialogOpen(true);
                }}
                onEditList={
                  selectedListId
                    ? () => {
                        const list = lists.find((l) => l.id === selectedListId);
                        if (list) {
                          setEditingList(list);
                          setListDialogOpen(true);
                        }
                      }
                    : undefined
                }
              />
            )}
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex-1">
              <SearchAndFilter
                search={search}
                onSearchChange={setSearch}
                sortBy={sortBy}
                onSortChange={setSortBy}
                showPurchased={showPurchased}
                onTogglePurchased={() => setShowPurchased(!showPurchased)}
              />
            </div>
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
            >
              <CheckSquare className="w-4 h-4 mr-1.5" />
              {selectionMode ? "Отменить" : "Выбрать"}
            </Button>
          </div>
          <div className="hidden sm:block">
            <TagFilter
              tags={tagsForFilters}
              selectedTags={effectiveSelectedTags}
              onToggleTag={handleToggleTag}
              onClearTags={() => setSelectedTags([])}
            />
          </div>
          <FiltersDrawer
            open={mobileFiltersOpen}
            onOpenChange={setMobileFiltersOpen}
            currentUserId={currentUserId}
            usersWithStats={usersWithStats}
            selectedUserId={normalizedSelectedUserId}
            onUserChange={handleUserChange}
            lists={lists}
            selectedListId={selectedListId}
            onListChange={handleListChange}
            onCreateList={() => {
              setEditingList(null);
              setListDialogOpen(true);
            }}
            onEditList={
              selectedListId
                ? () => {
                    const list = lists.find((l) => l.id === selectedListId);
                    if (list) {
                      setEditingList(list);
                      setListDialogOpen(true);
                    }
                  }
                : undefined
            }
            sortBy={sortBy}
            onSortChange={setSortBy}
            showPurchased={showPurchased}
            onTogglePurchased={() => setShowPurchased(!showPurchased)}
            tags={tagsForFilters}
            selectedTags={effectiveSelectedTags}
            onToggleTag={handleToggleTag}
            onClearTags={() => setSelectedTags([])}
          />
        </div>

        <WishlistGrid
          items={filteredItems}
          currentUserId={currentUserId}
          isLoading={isLoading}
          onEdit={(item) => {
            setEditingItem(item);
            setParsedData(null);
            setDetailItem(null);
          }}
          onDelete={handleDeleteItem}
          onTogglePurchased={handleTogglePurchased}
          onSetStatus={handleSetItemStatus}
          pendingStatusByItemId={pendingStatusByItemId}
          onPriorityChange={handlePriorityChange}
          onEmptyAdd={() => {
            setParsedData(null);
            setAddDialogOpen(true);
          }}
          onOpenDetail={setDetailItem}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
        />

        {/* Sentinel для Intersection Observer + кнопка "Загрузить ещё" */}
        <div ref={sentinelRef} className="flex justify-center py-4 sm:py-6">
          {isLoadingMore && (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          )}
          {!isLoadingMore && hasMore && (
            <Button
              variant="outline"
              onClick={() => setSize(size + 1)}
            >
              Загрузить ещё
            </Button>
          )}
        </div>

      </main>

      {/* Add item dialog */}
      <ItemFormDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={handleCreateItem}
        initialData={parsedData || undefined}
        existingTags={tags || []}
        existingLists={lists}
      />

      {/* Edit item dialog */}
      <ItemFormDialog
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        item={editingItem}
        onSave={handleUpdateItem}
        existingTags={tags || []}
        existingLists={lists}
      />

      {/* Parse URL dialog */}
      <ParseUrlDialog
        open={parseDialogOpen}
        onOpenChange={setParseDialogOpen}
        onParsed={handleParsed}
      />

      {/* Item detail dialog */}
      <ItemDetailDialog
        item={detailItem}
        currentUserId={currentUserId}
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          setDetailItem(null);
          setEditingItem(item);
          setParsedData(null);
        }}
        onDelete={handleDeleteItem}
        onTogglePurchased={handleTogglePurchased}
        onSetStatus={handleSetItemStatus}
        statusPending={detailItem ? !!pendingStatusByItemId[detailItem.id] : false}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!deletingItemId}
        onOpenChange={(open) => !open && setDeletingItemId(null)}
        title="Удалить желание?"
        description="Это действие нельзя отменить."
        confirmLabel="Удалить"
        variant="destructive"
        onConfirm={confirmDeleteItem}
      />

      {/* List create/edit dialog */}
      <ListFormDialog
        open={listDialogOpen}
        onOpenChange={(open) => {
          setListDialogOpen(open);
          if (!open) setEditingList(null);
        }}
        list={editingList}
        users={usersWithStats}
        onSuccess={() => {
          mutateLists();
          setEditingList(null);
        }}
      />

      {/* Bulk action bar */}
      <BulkActionBar
        selectedCount={selectedIds.size}
        onDelete={handleBulkDelete}
        onMarkPurchased={handleBulkMarkPurchased}
        onClearSelection={handleClearSelection}
        isProcessing={bulkProcessing}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen page-bg flex items-center justify-center min-h-[50vh]">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
