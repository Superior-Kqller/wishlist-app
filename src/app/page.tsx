"use client";

import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  Suspense,
} from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { useHeaderActions } from "@/lib/header-actions";
import { WishlistGrid } from "@/components/WishlistGrid";
import { ItemFormDialog } from "@/components/ItemFormDialog";
import { ParseUrlDialog } from "@/components/ParseUrlDialog";
import {
  WishlistSearchInput,
  WishlistToolbarControls,
} from "@/components/SearchAndFilter";
import { TagFilter } from "@/components/TagFilter";
import { CombinedFilter } from "@/components/CombinedFilter";
import { ListFormDialog } from "@/components/ListFormDialog";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BulkActionBar } from "@/components/BulkActionBar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, Loader2, CheckSquare, X, Sparkles } from "lucide-react";
import {
  WishlistItem,
  Tag,
  CreateItemPayload,
  ParsedProductResponse,
  UserWithStats,
  ListWithMeta,
} from "@/types";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/lib/use-debounce";
import {
  filterListsBySelectedUser,
  getFirstOwnedListId,
} from "@/lib/list-filter-client";
import { normalizeSelectedUserId } from "@/lib/filter-state";
import { filterAndSortWishlistItems } from "@/lib/home/filter-wishlist-items";
import { useInfiniteWishlistItems } from "@/hooks/use-infinite-wishlist-items";
import { useWishlistUrlSync } from "@/hooks/use-wishlist-url-sync";
import { useWishlistAddUrlDeepLink } from "@/hooks/use-wishlist-add-url-deeplink";

function HomePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = session?.user?.id;

  const deepLinkRef = useRef<{
    addUrl: string | null;
    fill: boolean;
    consumed: boolean;
  } | null>(null);
  if (deepLinkRef.current === null) {
    deepLinkRef.current = {
      addUrl: searchParams.get("addUrl"),
      fill: searchParams.get("fill") === "1",
      consumed: false,
    };
  }

  // Получаем userId и listId из URL параметров
  const userIdParam = searchParams.get("userId");
  const selectedUserId = userIdParam === "me" ? "me" : userIdParam || null;
  const listIdParam = searchParams.get("listId");
  /** Конкретная подборка или null = «все подборки». Значение `all` в URL (legacy) = то же самое. */
  const selectedListId =
    listIdParam && listIdParam !== "all" ? listIdParam : null;

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

  const {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    mutateItems,
    setSize,
    size,
    sentinelRef,
  } = useInfiniteWishlistItems(
    normalizedSelectedUserId,
    selectedListId,
    debouncedSearch,
  );
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

  /** Только свои подборки — для диалога создания (подстановка первой + обязательный выбор). */
  const ownedListsForCreate = useMemo(() => {
    if (!currentUserId) return [];
    return lists.filter((l) => l.userId === currentUserId);
  }, [lists, currentUserId]);

  const defaultListIdForCreate = useMemo(
    () =>
      currentUserId ? getFirstOwnedListId(lists, currentUserId) : null,
    [lists, currentUserId],
  );

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogAutoFill, setAddDialogAutoFill] = useState(false);
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [parsedData, setParsedData] = useState<Partial<CreateItemPayload> | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithMeta | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItem | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [listDeleteTarget, setListDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

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
        setAddDialogAutoFill(false);
        setAddDialogOpen(true);
      },
      onParseUrl: () => setParseDialogOpen(true),
    });
    return () => setActions({});
  }, [setActions]);

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

  const { syncFiltersToUrl } = useWishlistUrlSync({
    replace: router.replace,
    normalizedSelectedUserId,
    selectedListId,
    selectedUserId,
    search,
    sortBy,
    showPurchased,
    selectedTags,
    listIdParam,
    currentUserId,
    allowedListIdsForFilters,
  });

  useWishlistAddUrlDeepLink(
    deepLinkRef,
    currentUserId,
    router.replace,
    searchParams,
    setParsedData,
    setAddDialogAutoFill,
    setAddDialogOpen,
  );

  const tagsForFilters = useMemo(
    () => (tags && tags.length > 0 ? tags : tagsFromItems),
    [tags, tagsFromItems]
  );
  const effectiveSelectedTags = useMemo(() => {
    const availableTagIds = new Set(tagsForFilters.map((t) => t.id));
    return selectedTags.filter((id) => availableTagIds.has(id));
  }, [selectedTags, tagsForFilters]);

  const filteredItems = useMemo(
    () =>
      filterAndSortWishlistItems(items, {
        sortBy,
        showPurchased,
        effectiveSelectedTags,
      }),
    [items, sortBy, showPurchased, effectiveSelectedTags],
  );

  const summary = useMemo(() => {
    const aggregated = filteredItems.reduce(
      (acc, item) => {
        if (item.status === "AVAILABLE") acc.available += 1;
        if (item.status === "CLAIMED") acc.claimed += 1;
        if (item.status === "PURCHASED") acc.purchased += 1;
        if (item.price && item.status !== "PURCHASED") {
          acc.totalValue += item.price;
        }
        return acc;
      },
      { available: 0, claimed: 0, purchased: 0, totalValue: 0 },
    );

    return {
      total: filteredItems.length,
      available: aggregated.available,
      claimed: aggregated.claimed,
      purchased: aggregated.purchased,
      totalValue: aggregated.totalValue,
    };
  }, [filteredItems]);

  const selectedListName = useMemo(
    () => lists.find((list) => list.id === selectedListId)?.name ?? null,
    [lists, selectedListId]
  );

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (search.trim()) {
      chips.push({
        key: "search",
        label: `Поиск: ${search.trim()}`,
        onRemove: () => setSearch(""),
      });
    }
    if (selectedListName) {
      chips.push({
        key: "list",
        label: `Подборка: ${selectedListName}`,
        onRemove: () => syncFiltersToUrl({ listId: null }),
      });
    }
    if (normalizedSelectedUserId && normalizedSelectedUserId !== "all") {
      const userName =
        normalizedSelectedUserId === "me"
          ? "Мои"
          : usersWithStats.find((u) => u.id === normalizedSelectedUserId)?.name ?? "Пользователь";
      chips.push({
        key: "user",
        label: `Владелец: ${userName}`,
        onRemove: () => syncFiltersToUrl({ userId: null, listId: null }),
      });
    }
    if (!showPurchased) {
      chips.push({
        key: "purchased",
        label: "Купленные скрыты",
        onRemove: () => setShowPurchased(true),
      });
    }
    effectiveSelectedTags.forEach((tagId) => {
      const tag = tagsForFilters.find((t) => t.id === tagId);
      if (!tag) return;
      chips.push({
        key: `tag-${tagId}`,
        label: `Тег: ${tag.name}`,
        onRemove: () => {
          setSelectedTags((prev) => prev.filter((id) => id !== tagId));
        },
      });
    });
    return chips;
  }, [
    search,
    selectedListName,
    normalizedSelectedUserId,
    usersWithStats,
    showPurchased,
    effectiveSelectedTags,
    tagsForFilters,
    syncFiltersToUrl,
  ]);

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

  const confirmDeleteList = useCallback(async () => {
    if (!listDeleteTarget) return;
    const { id } = listDeleteTarget;
    try {
      const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Не удалось удалить подборку");
      }
      toast.success("Подборка удалена");
      await mutateLists();
      await mutateItems();
      if (selectedListId === id) {
        syncFiltersToUrl({ listId: null });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка удаления");
    }
  }, [listDeleteTarget, selectedListId, syncFiltersToUrl, mutateItems, mutateLists]);

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

  const handleParsed = useCallback((data: ParsedProductResponse) => {
    const firstImage = data.images?.[0];
    setParsedData({
      title: data.title,
      url: data.url,
      price: data.price || undefined,
      currency: data.currency,
      images: firstImage ? [firstImage] : undefined,
      notes: data.description?.trim() || undefined,
    });
    setAddDialogAutoFill(false);
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
      syncFiltersToUrl({ userId: uid, listId: null });
    },
    [syncFiltersToUrl],
  );

  const handleListChange = useCallback(
    (listId: string | null) => {
      syncFiltersToUrl({ listId });
    },
    [syncFiltersToUrl],
  );

  return (
    <div className="min-h-screen page-bg">
      <main className="container mx-auto space-y-3 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:space-y-3 sm:px-4 sm:py-5 sm:pb-5">
        <section className="rounded-xl border border-border bg-[hsl(var(--surface-2))] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.28)] sm:px-5 sm:py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary/90" />
                Обзор подборки
              </p>
              <h1 className="text-lg font-semibold text-foreground sm:text-xl">
                {summary.total} {summary.total === 1 ? "желание" : summary.total < 5 ? "желания" : "желаний"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Доступно: {summary.available} • Забронировано: {summary.claimed} • Куплено: {summary.purchased}
              </p>
            </div>
            <div className="rounded-lg border border-primary/35 bg-primary/12 px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-wide text-primary-foreground/80">Открытая стоимость</p>
              <p className="text-sm font-semibold text-primary-foreground">
                {summary.totalValue > 0 ? `${Math.round(summary.totalValue).toLocaleString("ru-RU")} ₽` : "—"}
              </p>
            </div>
          </div>
          {activeFilterChips.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {activeFilterChips.map((chip) => (
                <Badge
                  key={chip.key}
                  variant="outline"
                  className="group inline-flex items-center gap-1 border-border bg-[hsl(var(--surface-3))] px-2 py-1 text-[11px] text-foreground"
                >
                  {chip.label}
                  <button
                    type="button"
                    onClick={chip.onRemove}
                    className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/45"
                    aria-label={`Убрать фильтр: ${chip.label}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          ) : null}
        </section>

        <div className="sticky z-30 -mx-3 flex min-w-0 flex-col gap-1.5 border-b border-border bg-[hsl(var(--surface-2))/0.96] px-3 py-1.5 backdrop-blur-md max-sm:top-[calc(4.625rem+env(safe-area-inset-top,0px))] sm:static sm:z-auto sm:-mx-4 sm:border-0 sm:bg-transparent sm:px-4 sm:py-2 sm:backdrop-blur-none">
          {/* Мобильная компактная строка: только поиск + кнопка «Фильтры» */}
          <div className="flex min-w-0 items-center gap-2 sm:hidden">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 h-4 w-4 shrink-0 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="h-11 min-h-[44px] rounded-lg bg-[hsl(var(--surface-3))] pl-9 text-sm"
              />
            </div>
            <Button
              variant={selectionMode ? "secondary" : "outline"}
              size="icon"
              className="size-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg"
              onClick={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
              title={selectionMode ? "Отменить выбор" : "Выбрать"}
            >
              <CheckSquare className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="size-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg"
              onClick={() => setMobileFiltersOpen(true)}
              title="Фильтры"
            >
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </div>
          {/* Десктоп: фильтры и панель слева, поиск справа от них (ml-auto) */}
          <div className="hidden min-w-0 w-full flex-wrap items-center gap-2 sm:flex">
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
            <WishlistToolbarControls
              sortBy={sortBy}
              onSortChange={setSortBy}
              showPurchased={showPurchased}
              onTogglePurchased={() => setShowPurchased(!showPurchased)}
              selectionMode={selectionMode}
              onToggleSelection={() => {
                setSelectionMode(!selectionMode);
                if (selectionMode) setSelectedIds(new Set());
              }}
            />
            <WishlistSearchInput
              search={search}
              onSearchChange={setSearch}
              className="min-w-0 max-w-md flex-1 basis-[12rem] sm:ml-auto"
            />
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
          onEmptyAdd={() => {
            setParsedData(null);
            setAddDialogAutoFill(false);
            setAddDialogOpen(true);
          }}
          onOpenDetail={setDetailItem}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={handleToggleSelect}
          currentUserId={session?.user?.id}
          currentUserRole={session?.user?.role ?? null}
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
        onOpenChange={(open) => {
          setAddDialogOpen(open);
          if (!open) setAddDialogAutoFill(false);
        }}
        onSave={handleCreateItem}
        initialData={parsedData || undefined}
        existingTags={tags || []}
        existingLists={ownedListsForCreate}
        autoFillFromUrlOnce={addDialogAutoFill}
        defaultListId={defaultListIdForCreate}
        listPickerRequired
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

      <ConfirmDialog
        open={!!listDeleteTarget}
        onOpenChange={(open) => !open && setListDeleteTarget(null)}
        title={
          listDeleteTarget
            ? `Удалить подборку «${listDeleteTarget.name}»?`
            : "Удалить подборку?"
        }
        description="Желания останутся в общем списке, но без привязки к этой подборке. Восстановить подборку будет нельзя."
        confirmLabel="Удалить подборку"
        variant="destructive"
        onConfirm={() => {
          void confirmDeleteList();
        }}
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
        onDeleteRequest={(l) => setListDeleteTarget({ id: l.id, name: l.name })}
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
