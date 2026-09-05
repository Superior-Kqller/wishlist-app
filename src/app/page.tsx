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
import { useInfiniteWishlistItems } from "@/hooks/use-infinite-wishlist-items";
import { BulkDeleteFailure, useWishlistItemEditor } from "@/hooks/use-wishlist-item-editor";
import { useSearchDraftUrlSync, useWishlistUrlSync } from "@/hooks/use-wishlist-url-sync";
import { parseWishlistFilters } from "@/lib/home/wishlist-filters-url";
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

  /*
   * Все фильтры читаются из адреса на каждом рендере — это и есть их хранилище.
   * Раньше сортировка, категории и показ купленного брались из URL только при
   * первом рендере, и переход на другую ссылку той же страницы оставлял
   * прежние значения.
   */
  const urlFilters = useMemo(() => parseWishlistFilters(searchParams), [searchParams]);
  const {
    userId: selectedUserId,
    listId: selectedListId,
    sort: sortBy,
    view: viewMode,
    showPurchased,
    categories: selectedCategories,
  } = urlFilters;
  const listIdParam = searchParams.get("listId");

  // Единственный черновик: печатать в адресную строку по букве нельзя.
  const [search, setSearch] = useState(urlFilters.search);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setSearch(urlFilters.search);
  }, [urlFilters.search]);

  const {
    data: usersStatsData,
    error: usersStatsError,
    mutate: mutateUsersStats,
  } = useSWR<{ users: UserWithStats[] }>("/api/users/stats", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 10000, // Статистика меняется реже
  });
  const usersWithStats = useMemo(() => usersStatsData?.users ?? [], [usersStatsData?.users]);
  const normalizedSelectedUserId = useMemo(
    () => normalizeSelectedUserId(selectedUserId, currentUserId, usersWithStats),
    [selectedUserId, currentUserId, usersWithStats],
  );

  /*
   * Отбор и порядок задаёт сервер: клиент видит только одну страницу из
   * тридцати карточек и не может решать за весь каталог. Категории здесь
   * заранее сведены к известным — чужое значение из ссылки в запрос не идёт.
   */
  const effectiveSelectedCategories = useMemo(() => {
    const availableCategoryIds = new Set<string>(PRODUCT_CATEGORIES.map((category) => category.id));
    return selectedCategories.filter((id) => availableCategoryIds.has(id));
  }, [selectedCategories]);

  const {
    items,
    hasMore,
    isLoading,
    isLoadingMore,
    loadError,
    retry,
    mutateItems,
    setSize,
    size,
    sentinelRef,
  } = useInfiniteWishlistItems({
    normalizedSelectedUserId,
    selectedListId,
    debouncedSearch,
    sortBy,
    showPurchased,
    categories: effectiveSelectedCategories,
  });
  const {
    data: listsData,
    error: listsError,
    mutate: mutateLists,
  } = useSWR<ListWithMeta[]>("/api/lists", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });

  /* Пустой выбор охвата не должен выдавать отказ сети за отсутствие людей. */
  const scopeError = Boolean(usersStatsError || listsError);
  const retryScope = useCallback(() => {
    void mutateUsersStats();
    void mutateLists();
  }, [mutateUsersStats, mutateLists]);
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
    filters: urlFilters,
    normalizedSelectedUserId,
    listIdParam,
    currentUserId,
    allowedListIdsForFilters,
  });
  useSearchDraftUrlSync(debouncedSearch, urlFilters.search, syncFiltersToUrl);

  const setSortBy = useCallback(
    (value: string) => syncFiltersToUrl({ sort: value }),
    [syncFiltersToUrl],
  );

  const setViewMode = useCallback(
    (value: WishlistViewMode) => syncFiltersToUrl({ view: value }),
    [syncFiltersToUrl],
  );

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
        onRemove: () => syncFiltersToUrl({ showPurchased: false }),
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
        onRemove: () => syncFiltersToUrl({ sort: "newest" }),
      });
    }
    effectiveSelectedCategories.forEach((categoryId) => {
      const category = PRODUCT_CATEGORIES.find((item) => item.id === categoryId);
      if (!category) return;
      chips.push({
        key: `category-${categoryId}`,
        label: `${t("Категория")}: ${category.label}`,
        onRemove: () =>
          syncFiltersToUrl({ categories: selectedCategories.filter((id) => id !== categoryId) }),
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
    selectedCategories,
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
    router.replace("/", { scroll: false });
  }, [router]);

  const handleToggleCategory = useCallback(
    (categoryId: string) => {
      const next = selectedCategories.includes(categoryId)
        ? selectedCategories.filter((id) => id !== categoryId)
        : [...selectedCategories, categoryId];
      syncFiltersToUrl({ categories: next });
    },
    [selectedCategories, syncFiltersToUrl],
  );

  const handleUserChange = useCallback(
    (userId: string | null) => {
      syncFiltersToUrl({ userId, listId: null });
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

  /*
   * `?list=new` — вход снаружи: из пустого круга подарочных профилей, где
   * человеку объясняют, что участники появляются после общей подборки.
   * Кнопка там обязана открывать создание, а не высаживать на главной.
   */
  useEffect(() => {
    if (searchParams.get("list") !== "new") return;
    handleCreateList();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("list");
    router.replace(params.toString() ? `/?${params.toString()}` : "/", { scroll: false });
  }, [handleCreateList, router, searchParams]);

  const handleEditSelectedList = useCallback(() => {
    const list = lists.find((l) => l.id === selectedListId);
    if (list) {
      setEditingList(list);
      setListDialogOpen(true);
    }
  }, [lists, selectedListId]);

  const handleClearCategories = useCallback(
    () => syncFiltersToUrl({ categories: [] }),
    [syncFiltersToUrl],
  );

  const handleTogglePurchasedVisibility = useCallback(
    () => syncFiltersToUrl({ showPurchased: !showPurchased }),
    [showPurchased, syncFiltersToUrl],
  );

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
      scopeError,
      onRetryScope: retryScope,
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
      scopeError,
      retryScope,
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
      setSortBy,
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
      isLoading,
      loadError,
      onRetry: retry,
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
      isLoading,
      loadError,
      retry,
      hasMore,
      isLoadingMore,
      sentinelRef,
      size,
      handleLoadMore,
      viewMode,
      setViewMode,
    ],
  );

  const itemActions = useMemo<WishlistItemActions>(
    () => ({
      onEdit: handleEditItem,
      onDelete: handleDeleteItem,
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
