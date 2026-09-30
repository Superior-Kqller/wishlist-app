"use client";

import { useEffect, type RefObject } from "react";
import {
  CheckSquare,
  Download,
  LayoutGrid,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WishlistGrid } from "@/components/WishlistGrid";
import { WishlistSearchInput } from "@/components/wishlist/wishlist-search-input";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import {
  WishlistViewToggle,
  type WishlistViewMode,
} from "@/components/wishlist/wishlist-view-toggle";
import {
  ActiveFilterChips,
  type ActiveFilterChip,
} from "@/components/wishlist/active-filter-chips";
import { WishlistScopePicker } from "@/components/wishlist/wishlist-scope-picker";
import { PeopleChips } from "@/components/wishlist/people-chips";
import { RetryNotice } from "@/components/ui/retry-notice";
import { uiLayout, uiSurface } from "@/lib/ui-contract";
import type { ListWithMeta, UserWithStats, WishlistItem } from "@/types";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import type { ProductCategoryOption } from "@/lib/categories";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/lib/item-status";

/*
 * Мастерская принимает шесть связок, а не полсотни россыпью.
 *
 * Пропсы здесь никогда не были независимыми: охват, фильтры, выбор, лента и два
 * набора действий меняются каждый как целое. Пока они лежали плоским списком,
 * вызов занимал восемьдесят строк, а добавление одного поля к любой из связок
 * требовало трогать и тип, и деструктуризацию, и место вызова. Внутри имена
 * остаются плоскими: разметке всё равно, откуда пришло значение.
 */

/** Чей список смотрим и в какой подборке. */
export type WishlistScope = {
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
  usersWithStats: UserWithStats[];
  selectedWishlistUser: UserWithStats | null;
  lists: ListWithMeta[];
  /** Только свои подборки: пустой список меняет текст пустого состояния. */
  ownedListsForCreate: ListWithMeta[];
  normalizedSelectedUserId: string | null;
  selectedListId: string | null;
  onUserChange: (userId: string | null) => void;
  onListChange: (listId: string | null) => void;
  onCreateList: () => void;
  onEditSelectedList?: () => void;
  /**
   * Люди и подборки не загрузились. Переключатель охвата при этом покажет
   * пустой выбор, поэтому молчать нельзя: пустой список и недоступный список —
   * разные вещи, и вторая лечится повтором.
   */
  scopeError: boolean;
  onRetryScope: () => void;
  /** Ближайший повод — пилюлей справа в строке «чей список». */
  upcoming?: React.ReactNode;
};

/** Чем сузили выдачу и как её отсортировали. */
export type WishlistFilters = {
  search: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  activeFilterChips: ActiveFilterChip[];
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  categories: ProductCategoryOption[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchasedVisibility: () => void;
  onClearAll: () => void;
};

/** Режим выбора нескольких карточек. */
export type WishlistSelection = {
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onToggleMode: () => void;
  onClearMode: () => void;
};

/** Сама лента: что показываем и как дочитываем. */
export type WishlistFeed = {
  /** Страница каталога как её отобрал и упорядочил сервер. */
  items: WishlistItem[];
  isLoading: boolean | undefined;
  /**
   * Что именно не загрузилось. `initial` — показывать нечего; `next-page` —
   * загруженное остаётся на экране, не хватает только продолжения.
   */
  loadError: "initial" | "next-page" | null;
  onRetry: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  size: number;
  setSize: (size: number) => void;
  viewMode: WishlistViewMode;
  onViewModeChange: (mode: WishlistViewMode) => void;
};

/** Действия над одним желанием — ровно то, что отдаёт useWishlistItemEditor. */
export type WishlistItemActions = {
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  pendingStatusByItemId: Record<string, boolean>;
  justPurchasedId?: string | null;
  onOpenDetail: (item: WishlistItem) => void;
  onEmptyAdd: () => void;
};

/** Действия над каталогом целиком. */
export type WishlistCatalogActions = {
  onAddItem: () => void;
  onExport: (format: "csv" | "json") => void;
  onImport: () => void;
  isImporting: boolean;
};

type WishlistWorkspaceProps = {
  scope: WishlistScope;
  filters: WishlistFilters;
  selection: WishlistSelection;
  feed: WishlistFeed;
  itemActions: WishlistItemActions;
  catalogActions: WishlistCatalogActions;
};

export function WishlistWorkspace({
  scope,
  filters,
  selection,
  feed,
  itemActions,
  catalogActions,
}: WishlistWorkspaceProps) {
  const { t } = useI18n();

  const {
    currentUserId,
    currentUserRole,
    usersWithStats,
    selectedWishlistUser,
    lists,
    ownedListsForCreate,
    normalizedSelectedUserId,
    selectedListId,
    onUserChange,
    onListChange,
    onCreateList,
    onEditSelectedList,
    scopeError,
    upcoming,
    onRetryScope,
  } = scope;

  const {
    search,
    onSearchChange,
    hasActiveFilters,
    activeFilterChips,
    filtersOpen,
    onFiltersOpenChange,
    categories: categoriesForFilters,
    selectedCategories: effectiveSelectedCategories,
    onToggleCategory,
    onClearCategories,
    sortBy,
    onSortChange,
    showPurchased,
    onTogglePurchasedVisibility,
    onClearAll: onClearAllFilters,
  } = filters;

  /** Счётчик выводится из самих чипов: отдельным пропсом он мог с ними разойтись. */
  const activeFilterCount = activeFilterChips.length;

  const {
    selectionMode,
    selectedIds,
    onToggle: onToggleSelect,
    onToggleMode: onToggleSelectionMode,
    onClearMode: onClearSelectionMode,
  } = selection;

  const {
    items,
    isLoading,
    loadError,
    onRetry,
    hasMore,
    isLoadingMore,
    sentinelRef,
    size,
    setSize,
    viewMode,
    onViewModeChange,
  } = feed;

  const {
    onEdit: onEditItem,
    onDelete: onDeleteItem,
    onSetStatus,
    pendingStatusByItemId,
    justPurchasedId,
    onOpenDetail,
    onEmptyAdd,
  } = itemActions;

  const { onAddItem, onExport, onImport, isImporting } = catalogActions;

  const hasSelectedCards = selectedIds.size > 0;

  /*
   * Две клавиши для тех, кто живёт за клавиатурой: «/» — в поиск, «n» —
   * новое желание. Молчат, пока фокус в поле ввода или открыт диалог,
   * и не трогают сочетания с модификаторами.
   */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true], [role=dialog]")) return;
      if (document.querySelector("[role=dialog]")) return;
      if (event.key === "/") {
        const input = [...document.querySelectorAll<HTMLInputElement>("[data-hotkey=search]")].find(
          (element) => element.offsetParent !== null,
        );
        if (!input) return;
        event.preventDefault();
        input.focus();
      } else if (event.key === "n" || event.key === "т") {
        event.preventDefault();
        onAddItem();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onAddItem]);

  return (
    // Вертикальный ритм принадлежит рабочей области, а не странице: у неё
    // несколько соседних блоков подряд (панель инструментов, подсказки
    // профиля, режим выбора, сетка), и расстояние между ними не должно
    // зависеть от того, кто её отрисовал.
    // Снизу на телефоне — запас под плавающую кнопку «+»: без него она
    // ложилась на цену и «…» последней строки списка.
    <div className="flex min-w-0 flex-col gap-3 pb-16 sm:gap-5 sm:pb-0">
      {scopeError ? (
        <RetryNotice onRetry={onRetryScope}>
          {t("Не удалось загрузить людей и подборки. Показан весь доступный каталог.")}
        </RetryNotice>
      ) : null}

      {/*
       * Панель реагирует на собственную ширину, а не на ширину окна.
       * Так ярусы переключаются по месту, которое реально есть у панели.
       */}
      <div className={`@container ${uiSurface.homeToolbar} overflow-hidden`}>
        {/*
         * Две строки — два вопроса. Первая — «чей список»: лица людей, подборка
         * и ближайший повод справа (повод тоже про людей). Вторая — «что ищу»:
         * поиск и инструменты. Лица стоят первыми на любой ширине: на вопрос
         * «чей список» отвечает лицо, а не пункт выпадающего меню.
         */}
        <div className="mb-3 flex min-w-0 flex-col gap-3 @min-[52rem]:mb-4 @min-[52rem]:flex-row @min-[52rem]:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {currentUserId && usersWithStats.length > 0 ? (
              <>
                <PeopleChips
                  currentUserId={currentUserId}
                  users={usersWithStats}
                  selectedUserId={normalizedSelectedUserId}
                  onUserChange={onUserChange}
                  className="min-w-0"
                />
                <div className="hidden shrink-0 items-center gap-3 @min-[52rem]:flex">
                  <span className="h-6 w-px bg-border" aria-hidden />
                  <WishlistScopePicker
                    currentUserId={currentUserId}
                    users={usersWithStats}
                    lists={lists}
                    selectedUserId={normalizedSelectedUserId}
                    selectedListId={selectedListId}
                    onUserChange={onUserChange}
                    onListChange={onListChange}
                    onCreateList={onCreateList}
                    onEditList={onEditSelectedList}
                    showPeople={false}
                  />
                </div>
              </>
            ) : null}
          </div>
          {upcoming ? <div className="min-w-0 shrink-0">{upcoming}</div> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-2 @min-[52rem]:hidden">
          <div className="flex min-w-0 items-center gap-2">
            <WishlistSearchInput
              search={search}
              onSearchChange={onSearchChange}
              variant="mobile"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant={hasActiveFilters ? "secondary" : "outline"}
              className={cn(
                "relative h-11 w-11 shrink-0 rounded-full p-0",
                hasActiveFilters ? "border-foreground text-foreground" : "border-border",
              )}
              onClick={() => onFiltersOpenChange(true)}
              title={t("Фильтры")}
              aria-controls="wishlist-filters"
              aria-expanded={filtersOpen}
              aria-label={
                activeFilterCount > 0 ? `${t("Фильтры")}: ${activeFilterCount}` : t("Фильтры")
              }
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0" />
              {activeFilterCount > 0 ? (
                <span
                  key={activeFilterCount}
                  className="count-pop absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-semibold text-background"
                >
                  {activeFilterCount}
                </span>
              ) : null}
            </Button>
            {/*
             * Одна кнопка, а не пара сегментов: две кнопки по 36px не проходят
             * 44px на касание, а по 44px отнимают у поиска половину ширины.
             * Значок показывает, куда переключит касание.
             */}
            <Button
              type="button"
              variant="ghost"
              className="h-11 w-11 shrink-0 rounded-full p-0 text-foreground"
              onClick={() => onViewModeChange(viewMode === "table" ? "grid" : "table")}
              aria-label={viewMode === "table" ? t("Показать карточками") : t("Показать списком")}
              title={viewMode === "table" ? t("Показать карточками") : t("Показать списком")}
            >
              {/* Icon Morph Swap (kinetics): уходящая иконка размывается и
                  поворачивается, приходящая проявляется на её месте. */}
              <span className="relative size-4">
                {(
                  [
                    ["grid", LayoutGrid],
                    ["table", List],
                  ] as const
                ).map(([target, Icon]) => (
                  <Icon
                    key={target}
                    aria-hidden
                    className={cn(
                      "absolute inset-0 size-4 transition-[opacity,filter,transform] duration-300",
                      // Значок показывает, куда переключит касание.
                      viewMode !== target
                        ? "rotate-0 scale-100 opacity-100 blur-0"
                        : "-rotate-[20deg] scale-[0.7] opacity-0 blur-[6px]",
                    )}
                  />
                ))}
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-11 shrink-0 rounded-full p-0 text-foreground"
                  aria-label={t("Ещё действия")}
                  title={t("Ещё действия")}
                >
                  <MoreHorizontal className="h-4 w-4 shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={onToggleSelectionMode} disabled={hasSelectedCards}>
                  <CheckSquare className="h-4 w-4" aria-hidden />
                  {selectionMode ? t("Отменить выбор") : t("Выбрать несколько")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onImport} disabled={isImporting}>
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {t("Импорт JSON")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("csv")}>
                  <Download className="h-4 w-4" />
                  {t("Экспорт CSV")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("json")}>
                  <Download className="h-4 w-4" />
                  {t("Экспорт JSON")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/*
             * Главное действие в полосе между плавающей кнопкой и десктопным
             * ярусом. Кнопка внизу справа скрыта от `sm` (640px), а ярус со
             * своей «Добавить желание» включается только когда контейнер
             * дорастёт до 52rem — с сайдбаром это около 1152px вьюпорта. На
             * ноутбуке 1024px не было ни того, ни другого: пока список пуст,
             * выручает кнопка в заглушке, а с первым же желанием добавить
             * второе становится нечем.
             *
             * Отсюда и смешанное условие: контейнер решает, какой ярус
             * показать, а вьюпорт — не дублирует ли эта кнопка плавающую.
             */}
            <Button
              type="button"
              onClick={onAddItem}
              className="hidden h-11 shrink-0 gap-2 rounded-lg px-3.5 sm:inline-flex"
              title={t("Добавить желание")}
              aria-label={t("Добавить желание")}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden />
              {t("Добавить")}
            </Button>
          </div>
        </div>

        {/* Строка «что ищу» на десктопе: поиск → чем сузить → как показать → добавить своё. */}
        <div className="hidden min-w-0 w-full flex-col gap-2.5 @min-[52rem]:flex">
          <div className="flex min-w-0 items-center gap-2">
            <WishlistSearchInput
              search={search}
              onSearchChange={onSearchChange}
              // Не во всю ширину: запросу из четырёх-пяти слов хватает 32rem.
              className="min-w-[11rem] max-w-[32rem] flex-1"
            />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  uiLayout.filterBarTrigger,
                  "gap-2 px-3",
                  hasActiveFilters ? "border-foreground text-foreground" : "text-foreground",
                )}
                onClick={() => onFiltersOpenChange(true)}
                aria-controls="wishlist-filters"
                aria-expanded={filtersOpen}
                aria-label={
                  activeFilterCount > 0 ? `${t("Фильтры")}: ${activeFilterCount}` : t("Фильтры")
                }
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                {t("Фильтры")}
                {activeFilterCount > 0 ? (
                  <span
                    key={activeFilterCount}
                    className="count-pop flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[11px] font-semibold text-background"
                  >
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>

              <WishlistViewToggle value={viewMode} onValueChange={onViewModeChange} />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      uiLayout.filterBarTrigger,
                      "w-10 px-0 text-foreground",
                      selectionMode && "border-foreground",
                    )}
                    aria-label={t("Ещё действия")}
                    title={t("Ещё действия")}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={onToggleSelectionMode} disabled={hasSelectedCards}>
                    <CheckSquare className="h-4 w-4" aria-hidden />
                    {selectionMode ? t("Отменить выбор") : t("Выбрать несколько")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onImport} disabled={isImporting}>
                    {isImporting ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="h-4 w-4" aria-hidden />
                    )}
                    {t("Импорт JSON")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("csv")}>
                    <Download className="h-4 w-4" aria-hidden />
                    {t("Экспорт CSV")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("json")}>
                    <Download className="h-4 w-4" aria-hidden />
                    {t("Экспорт JSON")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Единственное залитое действие в панели — то, ради которого сюда приходят добавлять. */}
              <Button
                type="button"
                className="h-10 min-w-[11.5rem] gap-2 px-4"
                onClick={onAddItem}
                aria-keyshortcuts="n"
                title={`${t("Добавить желание")} (n)`}
              >
                <Plus className="h-4 w-4" aria-hidden />
                {t("Добавить желание")}
              </Button>
            </div>
          </div>

          {/* Второй ярус существует только когда есть что показать. */}
          {hasActiveFilters ? (
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
              <ActiveFilterChips chips={activeFilterChips} onClearAll={onClearAllFilters} />
              <span className="shrink-0 text-xs text-muted-foreground-subtle tabular-nums">
                {t("Найдено")}: {items.length}
              </span>
            </div>
          ) : null}
        </div>

        <FiltersDrawer
          open={filtersOpen}
          onOpenChange={onFiltersOpenChange}
          currentUserId={currentUserId}
          usersWithStats={usersWithStats}
          selectedUserId={normalizedSelectedUserId}
          lists={lists}
          selectedListId={selectedListId}
          onListChange={onListChange}
          onCreateList={onCreateList}
          onEditList={onEditSelectedList}
          sortBy={sortBy}
          onSortChange={onSortChange}
          showPurchased={showPurchased}
          onTogglePurchased={onTogglePurchasedVisibility}
          categories={categoriesForFilters}
          selectedCategories={effectiveSelectedCategories}
          onToggleCategory={onToggleCategory}
          onClearCategories={onClearCategories}
          activeFilterCount={activeFilterCount}
          resultCount={items.length}
          onClearAllFilters={onClearAllFilters}
        />
      </div>

      {selectedWishlistUser ? (
        <GiftPreferencesSummary
          userName={selectedWishlistUser.name}
          preferences={selectedWishlistUser.giftPreferences}
        />
      ) : null}

      {selectionMode && selectedIds.size === 0 ? (
        <div className={uiSurface.homeSelectionState}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              <span className="font-semibold">{t("Режим выбора")}.</span>{" "}
              {t("Нажмите на карточку, чтобы выбрать её.")}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelectionMode}>
              {t("Завершить выбор")}
            </Button>
          </div>
        </div>
      ) : null}

      {loadError === "initial" ? (
        <RetryNotice onRetry={onRetry}>{t("Не удалось загрузить список желаний.")}</RetryNotice>
      ) : (
        <WishlistGrid
          items={items}
          isLoading={isLoading}
          onEdit={onEditItem}
          onDelete={onDeleteItem}
          onSetStatus={onSetStatus}
          pendingStatusByItemId={pendingStatusByItemId}
          justPurchasedId={justPurchasedId}
          viewMode={viewMode}
          hideOwner={Boolean(normalizedSelectedUserId)}
          onOpenDetail={onOpenDetail}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onToggleSelect={onToggleSelect}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          emptyTitle={
            hasActiveFilters ? t("По этим фильтрам ничего нет") : t("В списке пока пусто")
          }
          emptyDescription={
            hasActiveFilters
              ? t("Попробуйте сбросить часть фильтров или изменить поиск.")
              : ownedListsForCreate.length === 0
                ? t("Сначала создайте подборку, затем добавьте первое желание.")
                : t("Добавьте первое желание вручную или вставьте ссылку на страницу товара.")
          }
          emptyActionLabel={
            hasActiveFilters
              ? undefined
              : ownedListsForCreate.length === 0
                ? t("Создать подборку")
                : t("Добавить желание")
          }
          onEmptyAction={
            hasActiveFilters
              ? undefined
              : ownedListsForCreate.length === 0
                ? onCreateList
                : onEmptyAdd
          }
          emptySecondaryLabel={hasActiveFilters ? t("Сбросить фильтры") : undefined}
          onEmptySecondaryAction={hasActiveFilters ? onClearAllFilters : undefined}
        />
      )}

      {/*
       * Провал догрузки — не пустой каталог: показанные карточки остаются, а
       * повтор человек запрашивает сам. Автодогрузка по сентинелу до этого
       * момента молча повторяла бы тот же неудачный запрос.
       */}
      {loadError === "next-page" ? (
        <RetryNotice onRetry={onRetry}>
          {t("Не удалось загрузить следующие желания. Показаны уже загруженные.")}
        </RetryNotice>
      ) : (
        <div ref={sentinelRef} className="flex justify-center">
          {isLoadingMore ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : null}
          {!isLoadingMore && hasMore ? (
            <Button variant="outline" onClick={() => setSize(size + 1)}>
              {t("Загрузить ещё")}
            </Button>
          ) : null}
        </div>
      )}

      {/*
       * Главное действие раздела на мобильном. В панели инструментов оно
       * оказывалось в правом верхнем углу, внутри меню «ещё» — дальше всего
       * от большого пальца. Скрывается в режиме выбора: там нижнюю кромку
       * занимает панель массовых действий.
       */}
      {!selectionMode ? (
        <Button
          type="button"
          onClick={onAddItem}
          aria-label={t("Добавить желание")}
          className="fixed bottom-[calc(var(--bottom-nav-clearance)+0.25rem)] right-4 z-40 h-14 w-14 rounded-full p-0 shadow-[var(--shadow-float)] sm:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
