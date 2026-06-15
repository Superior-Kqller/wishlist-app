"use client";

import {
  type ChangeEvent,
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
import {
  type WishlistViewMode,
} from "@/components/wishlist/wishlist-view-toggle";
import { WishlistWorkspace } from "@/components/wishlist/wishlist-workspace";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import { ItemFormDialog } from "@/components/ItemFormDialog";
import { ParseUrlDialog } from "@/components/ParseUrlDialog";
import { ListFormDialog } from "@/components/ListFormDialog";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BulkActionBar } from "@/components/BulkActionBar";
import {
  WishlistItem,
  Tag,
  CreateItemPayload,
  UpdateItemPayload,
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
import { useI18n } from "@/components/i18n/language-provider";

function HomePageContent() {
  const { t } = useI18n();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = session?.user?.id;

  const deepLinkRef = useRef<{
    addUrl: string | null;
    fill: boolean;
    consumed: boolean;
  } | null>(null);
  const importFileInputRef = useRef<HTMLInputElement | null>(null);
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
  const searchParamValue = searchParams.get("search") || "";
  const debouncedSearch = useDebounce(search, 300);
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "newest");
  const [viewMode, setViewMode] = useState<WishlistViewMode>(() =>
    searchParams.get("view") === "table" ? "table" : "grid",
  );
  const viewParamValue: WishlistViewMode =
    searchParams.get("view") === "table" ? "table" : "grid";
  const [showPurchased, setShowPurchased] = useState(() => searchParams.get("purchased") !== "hide");
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  });

  useEffect(() => {
    setSearch(searchParamValue);
  }, [searchParamValue]);

  useEffect(() => {
    setViewMode(viewParamValue);
  }, [viewParamValue]);

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
  const [isImporting, setIsImporting] = useState(false);
  const [listDeleteTarget, setListDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [pendingStatusByItemId, setPendingStatusByItemId] = useState<Record<string, boolean>>({});

  const handleOpenAddItem = useCallback(() => {
    setParsedData(null);
    setAddDialogAutoFill(false);
    setAddDialogOpen(true);
  }, []);

  const handleExport = useCallback(async (format: "csv" | "json") => {
    const res = await fetch(`/api/items/export?format=${format}`);
    if (!res.ok) {
      toast.error(t("Не удалось экспортировать каталог"));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ??
      `wishlist.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [t]);

  const handleImport = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setIsImporting(true);
      try {
        const parsed = JSON.parse(await file.text()) as unknown;
        const targetListId =
          selectedListId && ownedListsForCreate.some((list) => list.id === selectedListId)
            ? selectedListId
            : defaultListIdForCreate;
        const payload = Array.isArray(parsed)
          ? { items: parsed, listId: targetListId }
          : {
              ...(parsed && typeof parsed === "object" ? parsed : { items: parsed }),
              listId:
                parsed && typeof parsed === "object" && "listId" in parsed
                  ? (parsed as { listId?: unknown }).listId
                  : targetListId,
            };

        const res = await fetch("/api/items/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(body.error || t("Не удалось импортировать каталог"));
        }
        toast.success(`${t("Импортировано желаний")}: ${body.imported}`);
        mutateItems();
        mutate("/api/tags");
        mutate("/api/users/stats");
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("Не удалось импортировать каталог"),
        );
      } finally {
        setIsImporting(false);
        event.target.value = "";
      }
    },
    [defaultListIdForCreate, mutateItems, ownedListsForCreate, selectedListId, t],
  );

  const { setActions } = useHeaderActions();
  useEffect(() => {
    setActions({
      onAddItem: handleOpenAddItem,
      onParseUrl: () => setParseDialogOpen(true),
    });
    return () => setActions({});
  }, [handleOpenAddItem, setActions]);

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
    viewMode,
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

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    setParsedData(null);
    setAddDialogAutoFill(false);
    setAddDialogOpen(true);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("add");
    router.replace(params.toString() ? `/?${params.toString()}` : "/", {
      scroll: false,
    });
  }, [router, searchParams]);

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

  const selectedUserName = useMemo(() => {
    if (!normalizedSelectedUserId || normalizedSelectedUserId === "all") return null;
    if (normalizedSelectedUserId === "me") return t("Мои желания");
    return usersWithStats.find((u) => u.id === normalizedSelectedUserId)?.name ?? null;
  }, [normalizedSelectedUserId, usersWithStats, t]);

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
    if (search.trim()) {
      chips.push({
        key: "search",
        label: `${t("Поиск")}: ${search.trim()}`,
        onRemove: () => setSearch(""),
      });
    }
    if (selectedListName) {
      chips.push({
        key: "list",
        label: `${t("Подборка")}: ${selectedListName}`,
        onRemove: () => syncFiltersToUrl({ listId: null }),
      });
    }
    if (normalizedSelectedUserId && normalizedSelectedUserId !== "all") {
      const userName =
        normalizedSelectedUserId === "me"
          ? t("Мои")
          : usersWithStats.find((u) => u.id === normalizedSelectedUserId)?.name ?? t("Пользователь");
      chips.push({
        key: "user",
        label: `${t("Владелец")}: ${userName}`,
        onRemove: () => syncFiltersToUrl({ userId: null, listId: null }),
      });
    }
    if (!showPurchased) {
      chips.push({
        key: "purchased",
        label: t("Купленные скрыты"),
        onRemove: () => setShowPurchased(true),
      });
    }
    effectiveSelectedTags.forEach((tagId) => {
      const tag = tagsForFilters.find((t) => t.id === tagId);
      if (!tag) return;
      chips.push({
        key: `tag-${tagId}`,
        label: `${t("Тег")}: ${tag.name}`,
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
    t,
  ]);

  const hasActiveFilters = activeFilterChips.length > 0;
  const summaryEyebrow = selectedListName
    ? t("Подборка")
    : selectedUserName
      ? t("Владелец")
      : t("Общий обзор");
  const summaryTitle = selectedListName ?? selectedUserName ?? t("Каталог желаний");

  // Handlers
  const handleCreateItem = useCallback(async (data: CreateItemPayload | UpdateItemPayload) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || t("Ошибка при создании желания"));
    }
    toast.success(t("Добавлено в список!"));
    mutateItems();
    mutate("/api/tags");
  }, [mutateItems, t]);

  const handleUpdateItem = useCallback(
    async (data: CreateItemPayload | UpdateItemPayload) => {
      if (!editingItem) return;
      const res = await fetch(`/api/items/${editingItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("Ошибка при обновлении желания"));
      }
      toast.success(t("Сохранено!"));
      mutateItems();
      mutate("/api/tags");
      setEditingItem(null);
    },
    [editingItem, mutateItems, t],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setDeletingItemId(id);
  }, []);

  const confirmDeleteItem = useCallback(async () => {
    if (!deletingItemId) return;
    const res = await fetch(`/api/items/${deletingItemId}`, { method: "DELETE" });
    if (!res.ok) throw new Error(t("Ошибка при удалении желания"));
    toast.success(t("Удалено"));
    mutateItems();
    setDeletingItemId(null);
  }, [deletingItemId, mutateItems, t]);

  const confirmDeleteList = useCallback(async () => {
    if (!listDeleteTarget) return;
    const { id } = listDeleteTarget;
    try {
      const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("Не удалось удалить подборку"));
      }
      toast.success(t("Подборка удалена"));
      await mutateLists();
      await mutateItems();
      if (selectedListId === id) {
        syncFiltersToUrl({ listId: null });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("Ошибка удаления"));
    }
  }, [listDeleteTarget, selectedListId, syncFiltersToUrl, mutateItems, mutateLists, t]);

  const handleTogglePurchased = useCallback(
    async (id: string, purchased: boolean) => {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased }),
      });
      if (!res.ok) throw new Error(t("Ошибка при обновлении желания"));
      toast.success(purchased ? t("Отмечено как купленное") : t("Отметка снята"));
      mutateItems();
    },
    [mutateItems, t],
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
            toast.error(t("Статус уже изменился, список обновлён"));
            return;
          }
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || t("Ошибка смены статуса"));
        }
        const statusText =
          status === "AVAILABLE"
            ? t("Бронь снята")
            : status === "CLAIMED"
              ? t("Товар забронирован")
              : t("Отмечено купленным");
        toast.success(statusText);
        await mutateItems();
      } finally {
        setPendingStatusByItemId((prev) => ({ ...prev, [id]: false }));
      }
    },
    [mutateItems, pendingStatusByItemId, t]
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
    toast.success(`${t("Удалено")} ${ok} / ${ids.length}`);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkProcessing(false);
    mutateItems();
  }, [selectedIds, mutateItems, t]);

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
    toast.success(`${t("Отмечено купленным")}: ${ok} / ${ids.length}`);
    setSelectedIds(new Set());
    setSelectionMode(false);
    setBulkProcessing(false);
    mutateItems();
  }, [selectedIds, mutateItems, t]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    setSortBy("newest");
    setViewMode("grid");
    setShowPurchased(true);
    setSelectedTags([]);
    router.replace("/", { scroll: false });
  }, [router]);

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
      <div className="container mx-auto space-y-3 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:space-y-5 sm:px-6 sm:py-6 sm:pb-6 xl:px-8">
        <div className="grid items-stretch gap-3 sm:gap-5 xl:grid-cols-[minmax(0,2.35fr)_minmax(18rem,0.9fr)]">
          <DashboardSummary
            summary={summary}
            eyebrow={summaryEyebrow}
            title={summaryTitle}
            filterChips={activeFilterChips}
            onClearFilters={handleClearAllFilters}
          />
          <RecentActivityPanel items={filteredItems} />
        </div>

        <WishlistWorkspace
          search={search}
          onSearchChange={setSearch}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterChips.length}
          mobileFiltersOpen={mobileFiltersOpen}
          onMobileFiltersOpenChange={setMobileFiltersOpen}
          currentUserId={currentUserId}
          currentUserRole={session?.user?.role ?? null}
          usersWithStats={usersWithStats}
          lists={lists}
          normalizedSelectedUserId={normalizedSelectedUserId}
          selectedListId={selectedListId}
          onUserChange={handleUserChange}
          onListChange={handleListChange}
          onCreateList={() => {
            setEditingList(null);
            setListDialogOpen(true);
          }}
          onEditSelectedList={
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
          tagsForFilters={tagsForFilters}
          effectiveSelectedTags={effectiveSelectedTags}
          onToggleTag={handleToggleTag}
          onClearTags={() => setSelectedTags([])}
          onAddItem={handleOpenAddItem}
          onExport={handleExport}
          onImport={handleImport}
          isImporting={isImporting}
          sortBy={sortBy}
          onSortChange={setSortBy}
          showPurchased={showPurchased}
          onTogglePurchasedVisibility={() => setShowPurchased(!showPurchased)}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelectionMode={() => {
            setSelectionMode(!selectionMode);
            if (selectionMode) setSelectedIds(new Set());
          }}
          onClearSelectionMode={() => {
            setSelectionMode(false);
            setSelectedIds(new Set());
          }}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          items={items}
          filteredItems={filteredItems}
          isLoading={isLoading}
          onEditItem={(item) => {
            setEditingItem(item);
            setParsedData(null);
            setDetailItem(null);
          }}
          onDeleteItem={handleDeleteItem}
          onTogglePurchased={handleTogglePurchased}
          onSetStatus={handleSetItemStatus}
          pendingStatusByItemId={pendingStatusByItemId}
          onEmptyAdd={() => {
            setParsedData(null);
            setAddDialogAutoFill(false);
            setAddDialogOpen(true);
          }}
          onOpenDetail={setDetailItem}
          onToggleSelect={handleToggleSelect}
          ownedListsForCreate={ownedListsForCreate}
          onClearAllFilters={handleClearAllFilters}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          sentinelRef={sentinelRef}
          size={size}
          setSize={(nextSize) => {
            void setSize(nextSize);
          }}
        />
      </div>

      <input
        ref={importFileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleImportFileChange}
        aria-label={t("Импорт JSON")}
      />

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
        title={t("Удалить желание?")}
        description={t("Это действие нельзя отменить.")}
        confirmLabel={t("Удалить")}
        variant="destructive"
        onConfirm={confirmDeleteItem}
      />

      <ConfirmDialog
        open={!!listDeleteTarget}
        onOpenChange={(open) => !open && setListDeleteTarget(null)}
        title={
          listDeleteTarget
            ? `${t("Удалить подборку?")} ${listDeleteTarget.name}`
            : t("Удалить подборку?")
        }
        description={t("Желания останутся в общем списке, но без привязки к этой подборке. Восстановить подборку будет нельзя.")}
        confirmLabel={t("Удалить подборку")}
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
