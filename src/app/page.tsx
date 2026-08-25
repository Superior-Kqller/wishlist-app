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
import useSWR from "swr";
import { type WishlistViewMode } from "@/components/wishlist/wishlist-view-toggle";
import {
  WishlistWorkspace,
  type WishlistCatalogActions,
  type WishlistFeed,
  type WishlistFilters,
  type WishlistItemActions,
  type WishlistScope,
  type WishlistSelection,
} from "@/components/wishlist/wishlist-workspace";
import { ItemFormDialog } from "@/components/ItemFormDialog";
import { ListFormDialog } from "@/components/ListFormDialog";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BulkActionBar } from "@/components/BulkActionBar";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import {
  WishlistItem,
  CreateItemPayload,
  UpdateItemPayload,
  UserWithStats,
  ListWithMeta,
} from "@/types";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";
import { useDebounce } from "@/lib/use-debounce";
import { filterListsBySelectedUser, getFirstOwnedListId } from "@/lib/list-filter-client";
import { normalizeSelectedUserId } from "@/lib/filter-state";
import { filterAndSortWishlistItems } from "@/lib/home/filter-wishlist-items";
import { useInfiniteWishlistItems } from "@/hooks/use-infinite-wishlist-items";
import { BulkDeleteFailure, useWishlistItemEditor } from "@/hooks/use-wishlist-item-editor";
import { useWishlistUrlSync } from "@/hooks/use-wishlist-url-sync";
import { useWishlistAddUrlDeepLink } from "@/hooks/use-wishlist-add-url-deeplink";
import { useI18n } from "@/components/i18n/language-provider";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { UpcomingCalendarCard } from "@/components/calendar/UpcomingCalendarCard";

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
  const selectedListId = listIdParam && listIdParam !== "all" ? listIdParam : null;

  // Filter states — инициализация из URL
  const [search, setSearch] = useState(() => searchParams.get("search") || "");
  const searchParamValue = searchParams.get("search") || "";
  const debouncedSearch = useDebounce(search, 300);
  const [sortBy, setSortBy] = useState(() => searchParams.get("sort") || "newest");
  const [viewMode, setViewMode] = useState<WishlistViewMode>(() =>
    searchParams.get("view") === "table" ? "table" : "grid",
  );
  const viewParamValue: WishlistViewMode = searchParams.get("view") === "table" ? "table" : "grid";
  const [showPurchased, setShowPurchased] = useState(
    () => searchParams.get("purchased") === "show",
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const categoriesParam = searchParams.get("categories");
    return categoriesParam ? categoriesParam.split(",").filter(Boolean) : [];
  });

  useEffect(() => {
    setSearch(searchParamValue);
  }, [searchParamValue]);

  useEffect(() => {
    setViewMode(viewParamValue);
  }, [viewParamValue]);

  const { data: usersStatsData } = useSWR<{ users: UserWithStats[] }>("/api/users/stats", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // Статистика меняется реже
  });
  const usersWithStats = useMemo(() => usersStatsData?.users ?? [], [usersStatsData?.users]);
  const normalizedSelectedUserId = useMemo(
    () => normalizeSelectedUserId(selectedUserId, currentUserId, usersWithStats),
    [selectedUserId, currentUserId, usersWithStats],
  );

  const { items, hasMore, isLoading, isLoadingMore, mutateItems, setSize, size, sentinelRef } =
    useInfiniteWishlistItems(normalizedSelectedUserId, selectedListId, debouncedSearch);
  const { data: listsData, mutate: mutateLists } = useSWR<ListWithMeta[]>("/api/lists", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
  const lists = useMemo(() => listsData ?? [], [listsData]);

  /** Только свои подборки — для диалога создания (подстановка первой + обязательный выбор). */
  const ownedListsForCreate = useMemo(() => {
    if (!currentUserId) return [];
    return lists.filter((l) => l.userId === currentUserId);
  }, [lists, currentUserId]);

  const defaultListIdForCreate = useMemo(
    () => (currentUserId ? getFirstOwnedListId(lists, currentUserId) : null),
    [lists, currentUserId],
  );

  /** Вся правка желаний — за одним швом: сеть, исходы и их состояние живут там. */
  const editor = useWishlistItemEditor({ mutateItems, t });

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogAutoFill, setAddDialogAutoFill] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [parsedData, setParsedData] = useState<Partial<CreateItemPayload> | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithMeta | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [listDeleteTarget, setListDeleteTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleOpenAddItem = useCallback(() => {
    setParsedData(null);
    setAddDialogAutoFill(false);
    setAddDialogOpen(true);
  }, []);

  const handleImport = useCallback(() => {
    importFileInputRef.current?.click();
  }, []);

  const handleImportFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const targetListId =
        selectedListId && ownedListsForCreate.some((list) => list.id === selectedListId)
          ? selectedListId
          : defaultListIdForCreate;
      try {
        await editor.handleImportFile(file, targetListId);
      } finally {
        event.target.value = "";
      }
    },
    [defaultListIdForCreate, editor, ownedListsForCreate, selectedListId],
  );
  const selectedWishlistUser = useMemo(() => {
    if (
      !normalizedSelectedUserId ||
      normalizedSelectedUserId === "all" ||
      normalizedSelectedUserId === "me"
    ) {
      return null;
    }
    return usersWithStats.find((user) => user.id === normalizedSelectedUserId) ?? null;
  }, [normalizedSelectedUserId, usersWithStats]);

  /**
   * Заголовок называет раздел, а не охват. Он нужен — без него страница
   * начиналась сразу с панели инструментов и главная выпадала из ритма
   * разделов, — но имя человека он больше не повторяет: строкой ниже стоит
   * переключатель охвата, который и так называет, чей это список и какая
   * подборка. Из двух мест, говоривших одно и то же, осталось управляемое.
   *
   * Заодно заголовок стал постоянным, как во всех остальных разделах:
   * главная была единственной, где он менялся на ходу.
   */
  const pageTitle = t("Список желаний");

  const pageDescription = selectedWishlistUser
    ? t("Что подойдёт этому человеку и что уже кто-то взял на себя.")
    : t("Всё, что вы хотите, и всё, что вы можете подарить другим.");

  const allowedListIdsForFilters = useMemo(() => {
    if (!currentUserId) return new Set(lists.map((l) => l.id));
    return new Set(
      filterListsBySelectedUser(lists, usersWithStats, currentUserId, normalizedSelectedUserId).map(
        (l) => l.id,
      ),
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
    selectedCategories,
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

  const effectiveSelectedCategories = useMemo(() => {
    const availableCategoryIds = new Set<string>(PRODUCT_CATEGORIES.map((category) => category.id));
    return selectedCategories.filter((id) => availableCategoryIds.has(id));
  }, [selectedCategories]);

  const filteredItems = useMemo(
    () =>
      filterAndSortWishlistItems(items, {
        sortBy,
        showPurchased,
        effectiveSelectedCategories,
      }),
    [items, sortBy, showPurchased, effectiveSelectedCategories],
  );

  const selectedListName = useMemo(
    () => lists.find((list) => list.id === selectedListId)?.name ?? null,
    [lists, selectedListId],
  );

  const activeFilterChips = useMemo(() => {
    const chips: Array<{ key: string; label: string; onRemove: () => void }> = [];
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
          : (usersWithStats.find((u) => u.id === normalizedSelectedUserId)?.name ??
            t("Пользователь"));
      chips.push({
        key: "user",
        label: `${t("Владелец")}: ${userName}`,
        onRemove: () => syncFiltersToUrl({ userId: null, listId: null }),
      });
    }
    if (showPurchased) {
      chips.push({
        key: "purchased",
        label: t("Показаны купленные"),
        onRemove: () => setShowPurchased(false),
      });
    }
    if (sortBy !== "newest") {
      const sortLabel =
        sortBy === "oldest"
          ? t("Старые сначала")
          : sortBy === "priority-high"
            ? t("Приоритет ↓")
            : sortBy === "priority-low"
              ? t("Приоритет ↑")
              : sortBy === "price-high"
                ? t("Ориент. цена ↓")
                : t("Ориент. цена ↑");
      chips.push({
        key: "sort",
        label: `${t("Сортировка")}: ${sortLabel}`,
        onRemove: () => setSortBy("newest"),
      });
    }
    effectiveSelectedCategories.forEach((categoryId) => {
      const category = PRODUCT_CATEGORIES.find((item) => item.id === categoryId);
      if (!category) return;
      chips.push({
        key: `category-${categoryId}`,
        label: `${t("Категория")}: ${category.label}`,
        onRemove: () => {
          setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
        },
      });
    });
    return chips;
  }, [
    selectedListName,
    normalizedSelectedUserId,
    usersWithStats,
    showPurchased,
    sortBy,
    effectiveSelectedCategories,
    syncFiltersToUrl,
    t,
  ]);

  // Поиск не превращается в чип: его значение видно в самом поле рядом.
  // Но счётчик результата он включает — именно при поиске он нужнее всего.
  const hasActiveFilters = activeFilterChips.length > 0 || Boolean(search.trim());

  const deletingItemTitle = deletingItemId
    ? (items.find((item) => item.id === deletingItemId)?.title ?? null)
    : null;

  /** Подтверждение называет то, что исчезнет: числа без имён не удерживают от ошибки. */
  const bulkDeleteDescription = useMemo(() => {
    const titles = Array.from(selectedIds)
      .map((id) => items.find((item) => item.id === id)?.title)
      .filter((title): title is string => Boolean(title));
    const shown = titles.slice(0, 3).join(", ");
    const rest = titles.length - 3;
    const list = rest > 0 ? `${shown} ${t("и ещё")} ${rest}` : shown;
    return list
      ? `${list}. ${t("Это действие нельзя отменить.")}`
      : t("Это действие нельзя отменить.");
  }, [selectedIds, items, t]);

  // Handlers
  const handleUpdateItem = useCallback(
    async (data: CreateItemPayload | UpdateItemPayload) => {
      if (!editingItem) return;
      await editor.updateItemById(editingItem.id, data);
      setEditingItem(null);
    },
    [editingItem, editor],
  );

  const handleDeleteItem = useCallback((id: string) => {
    setDeletingItemId(id);
  }, []);

  const handleEditItem = useCallback((item: WishlistItem) => {
    setEditingItem(item);
    setParsedData(null);
    setDetailItem(null);
  }, []);

  const handleEmptyAdd = useCallback(() => {
    setParsedData(null);
    setAddDialogAutoFill(false);
    setAddDialogOpen(true);
  }, []);

  const confirmDeleteItem = useCallback(async () => {
    if (!deletingItemId) return;
    await editor.confirmDeleteItem(deletingItemId);
    setDeletingItemId(null);
  }, [deletingItemId, editor]);

  // Ошибку намеренно не глотаем: её ловит ConfirmDialog и показывает внутри
  // окна, оставляя его открытым. Тост здесь закрыл бы диалог как при успехе.
  const confirmDeleteList = useCallback(async () => {
    if (!listDeleteTarget) return;
    const { id } = listDeleteTarget;
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
  }, [listDeleteTarget, selectedListId, syncFiltersToUrl, mutateItems, mutateLists, t]);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /*
   * Ошибка намеренно не глотается: её ловит ConfirmDialog и показывает внутри
   * окна. Уцелевшие желания остаются выбранными — повтор идёт ровно по ним.
   */
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const titleOf = (id: string) => items.find((item) => item.id === id)?.title;
    try {
      await editor.handleBulkDelete(Array.from(selectedIds), titleOf);
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch (err) {
      if (err instanceof BulkDeleteFailure) setSelectedIds(new Set(err.failedIds));
      throw err;
    }
  }, [selectedIds, items, editor]);

  const handleBulkMarkPurchased = useCallback(async () => {
    if (selectedIds.size === 0) return;
    await editor.handleBulkMarkPurchased(Array.from(selectedIds));
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, [selectedIds, editor]);

  const handleClearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearch("");
    setSortBy("newest");
    setShowPurchased(false);
    setSelectedCategories([]);
    router.replace("/", { scroll: false });
  }, [router]);

  const handleToggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    );
  }, []);

  const handleUserChange = useCallback(
    (userId: string | null) => {
      const uid = userId === null ? null : userId === "me" ? "me" : userId;
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

  const handleCreateList = useCallback(() => {
    setEditingList(null);
    setListDialogOpen(true);
  }, []);

  const handleEditSelectedList = useCallback(() => {
    const list = lists.find((l) => l.id === selectedListId);
    if (list) {
      setEditingList(list);
      setListDialogOpen(true);
    }
  }, [lists, selectedListId]);

  const handleClearCategories = useCallback(() => setSelectedCategories([]), []);

  const handleTogglePurchasedVisibility = useCallback(() => setShowPurchased((prev) => !prev), []);

  // Апдейтер состояния обязан быть чистым: побочный сброс выбора вынесен наружу.
  const handleToggleSelectionMode = useCallback(() => {
    if (selectionMode) setSelectedIds(new Set());
    setSelectionMode(!selectionMode);
  }, [selectionMode]);

  const handleLoadMore = useCallback(
    (nextSize: number) => {
      void setSize(nextSize);
    },
    [setSize],
  );

  /*
   * Шесть связок вместо полусотни пропсов россыпью. Каждая меняется как целое,
   * поэтому и передаётся целиком — см. типы в wishlist-workspace.
   */
  const scope = useMemo<WishlistScope>(
    () => ({
      currentUserId,
      currentUserRole: session?.user?.role ?? null,
      usersWithStats,
      selectedWishlistUser,
      lists,
      ownedListsForCreate,
      normalizedSelectedUserId,
      selectedListId,
      onUserChange: handleUserChange,
      onListChange: handleListChange,
      onCreateList: handleCreateList,
      onEditSelectedList: selectedListId ? handleEditSelectedList : undefined,
    }),
    [
      currentUserId,
      session?.user?.role,
      usersWithStats,
      selectedWishlistUser,
      lists,
      ownedListsForCreate,
      normalizedSelectedUserId,
      selectedListId,
      handleUserChange,
      handleListChange,
      handleCreateList,
      handleEditSelectedList,
    ],
  );

  const filters = useMemo<WishlistFilters>(
    () => ({
      search,
      onSearchChange: setSearch,
      hasActiveFilters,
      activeFilterChips,
      filtersOpen,
      onFiltersOpenChange: setFiltersOpen,
      categories: PRODUCT_CATEGORIES,
      selectedCategories: effectiveSelectedCategories,
      onToggleCategory: handleToggleCategory,
      onClearCategories: handleClearCategories,
      sortBy,
      onSortChange: setSortBy,
      showPurchased,
      onTogglePurchasedVisibility: handleTogglePurchasedVisibility,
      onClearAll: handleClearAllFilters,
    }),
    [
      search,
      hasActiveFilters,
      activeFilterChips,
      filtersOpen,
      effectiveSelectedCategories,
      handleToggleCategory,
      handleClearCategories,
      sortBy,
      showPurchased,
      handleTogglePurchasedVisibility,
      handleClearAllFilters,
    ],
  );

  const selection = useMemo<WishlistSelection>(
    () => ({
      selectionMode,
      selectedIds,
      onToggle: handleToggleSelect,
      onToggleMode: handleToggleSelectionMode,
      onClearMode: handleClearSelection,
    }),
    [
      selectionMode,
      selectedIds,
      handleToggleSelect,
      handleToggleSelectionMode,
      handleClearSelection,
    ],
  );

  const feed = useMemo<WishlistFeed>(
    () => ({
      items,
      filteredItems,
      isLoading,
      hasMore,
      isLoadingMore,
      sentinelRef,
      size,
      setSize: handleLoadMore,
      viewMode,
      onViewModeChange: setViewMode,
    }),
    [
      items,
      filteredItems,
      isLoading,
      hasMore,
      isLoadingMore,
      sentinelRef,
      size,
      handleLoadMore,
      viewMode,
    ],
  );

  const itemActions = useMemo<WishlistItemActions>(
    () => ({
      onEdit: handleEditItem,
      onDelete: handleDeleteItem,
      onTogglePurchased: editor.handleTogglePurchased,
      onSetStatus: editor.handleSetItemStatus,
      pendingStatusByItemId: editor.pendingStatusByItemId,
      justPurchasedId: editor.justPurchasedId,
      onOpenDetail: setDetailItem,
      onEmptyAdd: handleEmptyAdd,
    }),
    [handleEditItem, handleDeleteItem, editor, handleEmptyAdd],
  );

  const catalogActions = useMemo<WishlistCatalogActions>(
    () => ({
      onAddItem: handleOpenAddItem,
      onExport: editor.handleExport,
      onImport: handleImport,
      isImporting: editor.isImporting,
    }),
    [handleOpenAddItem, editor, handleImport],
  );

  return (
    <PageShell>
      <PageMain>
        <PageIntro
          title={pageTitle}
          description={pageDescription}
          meta={<UpcomingCalendarCard />}
        />
        <WishlistWorkspace
          scope={scope}
          filters={filters}
          selection={selection}
          feed={feed}
          itemActions={itemActions}
          catalogActions={catalogActions}
        />
      </PageMain>

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
        onSave={editor.handleCreateItem}
        initialData={parsedData || undefined}
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
        existingLists={lists}
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
        onTogglePurchased={editor.handleTogglePurchased}
        onSetStatus={editor.handleSetItemStatus}
        statusPending={detailItem ? !!editor.pendingStatusByItemId[detailItem.id] : false}
      />

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={!!deletingItemId}
        onOpenChange={(open) => !open && setDeletingItemId(null)}
        title={
          deletingItemTitle ? `${t("Удалить")} «${deletingItemTitle}»?` : t("Удалить желание?")
        }
        description={t("Это действие нельзя отменить.")}
        confirmLabel={t("Удалить")}
        variant="destructive"
        onConfirm={confirmDeleteItem}
      />

      {/* Confirm bulk delete dialog */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`${t("Удалить желаний")}: ${selectedIds.size}?`}
        description={bulkDeleteDescription}
        confirmLabel={t("Удалить")}
        variant="destructive"
        onConfirm={handleBulkDelete}
      />

      <ConfirmDialog
        open={!!listDeleteTarget}
        onOpenChange={(open) => !open && setListDeleteTarget(null)}
        title={
          listDeleteTarget
            ? `${t("Удалить подборку?")} ${listDeleteTarget.name}`
            : t("Удалить подборку?")
        }
        description={t(
          "Желания останутся в общем списке, но без привязки к этой подборке. Восстановить подборку будет нельзя.",
        )}
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
        onDelete={() => setBulkDeleteOpen(true)}
        onMarkPurchased={handleBulkMarkPurchased}
        onClearSelection={handleClearSelection}
        isProcessing={editor.bulkProcessing}
      />
    </PageShell>
  );
}

/** Единственная строка в цепочке загрузки, которая раньше шла мимо словаря. */
function HomeLoadingLabel() {
  const { t } = useI18n();
  return <span className="text-sm text-muted-foreground">{t("Загрузка…")}</span>;
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="page-bg flex min-h-[60svh] items-center justify-center">
          <HomeLoadingLabel />
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  );
}
