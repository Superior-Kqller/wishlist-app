"use client";

import type { RefObject } from "react";
import {
  CheckSquare,
  Download,
  Loader2,
  Link as LinkIcon,
  MoreHorizontal,
  Plus,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { SearchField } from "@/components/ui/search-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WishlistGrid } from "@/components/WishlistGrid";
import { WishlistSearchInput } from "@/components/SearchAndFilter";
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
import { uiSurface } from "@/lib/ui-contract";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import type { ListWithMeta, UserWithStats, WishlistItem } from "@/types";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import type { ProductCategoryOption } from "@/lib/categories";
import { cn } from "@/lib/utils";

type WishlistWorkspaceProps = {
  search: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  activeFilterChips: ActiveFilterChip[];
  filtersOpen: boolean;
  onFiltersOpenChange: (open: boolean) => void;
  /** Открывает диалог разбора ссылки на товар. */
  onParseUrl?: () => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
  usersWithStats: UserWithStats[];
  selectedWishlistUser: UserWithStats | null;
  lists: ListWithMeta[];
  normalizedSelectedUserId: string | null;
  selectedListId: string | null;
  onUserChange: (userId: string | null) => void;
  onListChange: (listId: string | null) => void;
  onCreateList: () => void;
  onEditSelectedList?: () => void;
  categoriesForFilters: ProductCategoryOption[];
  effectiveSelectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
  onAddItem: () => void;
  onExport: (format: "csv" | "json") => void;
  onImport: () => void;
  isImporting: boolean;
  sortBy: string;
  onSortChange: (value: string) => void;
  showPurchased: boolean;
  onTogglePurchasedVisibility: () => void;
  selectionMode: boolean;
  selectedIds: Set<string>;
  onToggleSelectionMode: () => void;
  onClearSelectionMode: () => void;
  viewMode: WishlistViewMode;
  onViewModeChange: (mode: WishlistViewMode) => void;
  items: WishlistItem[];
  filteredItems: WishlistItem[];
  isLoading: boolean | undefined;
  onEditItem: (item: WishlistItem) => void;
  onDeleteItem: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus: (id: string, status: "AVAILABLE" | "PURCHASED") => void;
  pendingStatusByItemId: Record<string, boolean>;
  justPurchasedId?: string | null;
  onEmptyAdd: () => void;
  onOpenDetail: (item: WishlistItem) => void;
  onToggleSelect: (id: string) => void;
  ownedListsForCreate: ListWithMeta[];
  onClearAllFilters: () => void;
  hasMore: boolean;
  isLoadingMore: boolean;
  sentinelRef: RefObject<HTMLDivElement | null>;
  size: number;
  setSize: (size: number) => void;
};

export function WishlistWorkspace({
  search,
  onSearchChange,
  hasActiveFilters,
  activeFilterCount,
  activeFilterChips,
  filtersOpen,
  onFiltersOpenChange,
  onParseUrl,
  currentUserId,
  currentUserRole,
  usersWithStats,
  selectedWishlistUser,
  lists,
  normalizedSelectedUserId,
  selectedListId,
  onUserChange,
  onListChange,
  onCreateList,
  onEditSelectedList,
  categoriesForFilters,
  effectiveSelectedCategories,
  onToggleCategory,
  onClearCategories,
  onAddItem,
  onExport,
  onImport,
  isImporting,
  sortBy,
  onSortChange,
  showPurchased,
  onTogglePurchasedVisibility,
  selectionMode,
  selectedIds,
  onToggleSelectionMode,
  onClearSelectionMode,
  viewMode,
  onViewModeChange,
  items,
  filteredItems,
  isLoading,
  onEditItem,
  onDeleteItem,
  onTogglePurchased,
  onSetStatus,
  pendingStatusByItemId,
  justPurchasedId,
  onEmptyAdd,
  onOpenDetail,
  onToggleSelect,
  ownedListsForCreate,
  onClearAllFilters,
  hasMore,
  isLoadingMore,
  sentinelRef,
  size,
  setSize,
}: WishlistWorkspaceProps) {
  const { t } = useI18n();
  const hasSelectedCards = selectedIds.size > 0;
  const selectionButtonTitle = hasSelectedCards
    ? t("Режим выбора")
    : selectionMode
      ? t("Отменить выбор")
      : t("Выбрать");
  const selectionButtonAriaLabel = hasSelectedCards
    ? t("Режим выбора")
    : selectionMode
      ? t("Отменить выбор")
      : t("Выбрать карточки");
  return (
    // Вертикальный ритм принадлежит рабочей области, а не странице: у неё
    // несколько соседних блоков подряд (панель инструментов, подсказки
    // профиля, режим выбора, сетка), и расстояние между ними не должно
    // зависеть от того, кто её отрисовал.
    <div className="flex min-w-0 flex-col gap-3 sm:gap-5">
      {/*
       * Панель реагирует на собственную ширину, а не на ширину окна.
       * Ширина контента здесь немонотонна: на 1023px сайдбара ещё нет и под
       * контент остаётся ~975px, а на 1024px он появляется и остаётся ~712px.
       * Любой viewport-брейкпоинт на этом ломается, container query — нет.
       */}
      <div
        className={`@container ${uiSurface.homeToolbar} overflow-hidden @max-[52rem]:rounded-xl @max-[52rem]:px-2 @max-[52rem]:py-2`}
      >
        <div className="flex min-w-0 items-center gap-2 @min-[52rem]:hidden">
          <SearchField
            value={search}
            onValueChange={onSearchChange}
            placeholder={t("Поиск…")}
            aria-label={t("Поиск")}
            wrapperClassName="group min-w-0 flex-1"
            iconClassName="left-3.5 text-muted-foreground/62 transition-colors duration-200 group-focus-within:text-primary/88"
            inputClassName="h-11 min-h-[44px] rounded-xl border-border/52 bg-[linear-gradient(180deg,hsl(var(--surface-3)_/_0.82),hsl(var(--surface-2)_/_0.66))] pl-10 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.045)] placeholder:text-muted-foreground-subtle focus-visible:border-primary/48 focus-visible:ring-2 focus-visible:ring-primary/18 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            variant={hasActiveFilters ? "secondary" : "outline"}
            className={cn(
              "relative h-11 w-11 shrink-0 rounded-xl p-0",
              hasActiveFilters
                ? "border-primary/40 bg-primary/12 text-foreground"
                : "border-border/58 bg-[hsl(var(--surface-3)/0.58)]",
            )}
            onClick={() => onFiltersOpenChange(true)}
            title={t("Фильтры")}
            aria-controls="wishlist-filters"
            aria-expanded={filtersOpen}
            aria-label={hasActiveFilters ? `${t("Фильтры")}: ${activeFilterCount}` : t("Фильтры")}
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            {hasActiveFilters ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "h-11 w-11 shrink-0 rounded-xl p-0 text-muted-foreground disabled:pointer-events-none disabled:opacity-100",
              selectionMode && "bg-primary/11 text-foreground",
            )}
            onClick={onToggleSelectionMode}
            disabled={hasSelectedCards}
            title={selectionButtonTitle}
            aria-label={selectionButtonAriaLabel}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="h-11 w-11 shrink-0 rounded-xl p-0 text-muted-foreground"
                aria-label={t("Ещё действия")}
                title={t("Ещё действия")}
              >
                <MoreHorizontal className="h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {onParseUrl ? (
                <>
                  <DropdownMenuItem onClick={onParseUrl}>
                    <LinkIcon className="mr-2 h-4 w-4" aria-hidden />
                    {t("Вставить ссылку на товар")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              ) : null}
              <DropdownMenuItem onClick={onImport} disabled={isImporting}>
                {isImporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {t("Импорт JSON")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("csv")}>
                <Download className="mr-2 h-4 w-4" />
                {t("Экспорт CSV")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("json")}>
                <Download className="mr-2 h-4 w-4" />
                {t("Экспорт JSON")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/*
         * Десктопный ярус — один. Раньше их было четыре (поиск, фильтры,
         * категории, чипы), и между заголовком страницы и первой карточкой
         * стояло до одиннадцати контролов. Порядок слева направо повторяет
         * вопросы, которые человек задаёт по очереди: чей список → что ищу →
         * чем сузить → как показать → добавить своё.
         */}
        <div className="hidden min-w-0 w-full flex-col gap-2.5 @min-[52rem]:flex">
          <div className="flex min-w-0 items-center gap-2">
            {currentUserId && usersWithStats.length > 0 ? (
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
                className="shrink-0"
              />
            ) : null}

            <WishlistSearchInput
              search={search}
              onSearchChange={onSearchChange}
              // Поиск больше не растягивается во всю ширину: в списке из
              // десятков элементов он вторичен, а 22rem хватает на запрос
              // из четырёх-пяти слов.
              className="min-w-[11rem] max-w-[22rem] flex-1"
            />

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  filterBarTriggerClass,
                  "gap-2 px-3",
                  hasActiveFilters
                    ? "border-primary/45 bg-primary/12 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                onClick={() => onFiltersOpenChange(true)}
                aria-controls="wishlist-filters"
                aria-expanded={filtersOpen}
                aria-label={
                  hasActiveFilters ? `${t("Фильтры")}: ${activeFilterCount}` : t("Фильтры")
                }
              >
                <SlidersHorizontal className="h-4 w-4 shrink-0" aria-hidden />
                {t("Фильтры")}
                {hasActiveFilters ? (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
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
                      filterBarTriggerClass,
                      "w-10 px-0 text-muted-foreground hover:text-foreground",
                      selectionMode && "border-primary/45 bg-primary/12 text-foreground",
                    )}
                    aria-label={t("Ещё действия")}
                    title={t("Ещё действия")}
                  >
                    <MoreHorizontal className="h-4 w-4" aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={onToggleSelectionMode} disabled={hasSelectedCards}>
                    <CheckSquare className="mr-2 h-4 w-4" aria-hidden />
                    {selectionMode ? t("Отменить выбор") : t("Выбрать несколько")}
                  </DropdownMenuItem>
                  {onParseUrl ? (
                    <DropdownMenuItem onClick={onParseUrl}>
                      <LinkIcon className="mr-2 h-4 w-4" aria-hidden />
                      {t("Вставить ссылку на товар")}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onImport} disabled={isImporting}>
                    {isImporting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" aria-hidden />
                    )}
                    {t("Импорт JSON")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("csv")}>
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    {t("Экспорт CSV")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onExport("json")}>
                    <Download className="mr-2 h-4 w-4" aria-hidden />
                    {t("Экспорт JSON")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Единственное залитое действие в панели — то, ради которого сюда приходят добавлять. */}
              <Button type="button" className="h-10 min-w-[11.5rem] gap-2 px-4" onClick={onAddItem}>
                <Plus className="h-4 w-4" aria-hidden />
                {t("Добавить желание")}
              </Button>
            </div>
          </div>

          {/* Второй ярус существует только когда есть что показать. */}
          {hasActiveFilters ? (
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border/32 pt-2.5">
              <ActiveFilterChips chips={activeFilterChips} onClearAll={onClearAllFilters} />
              <span className="shrink-0 text-xs text-muted-foreground-subtle tabular-nums">
                {t("Найдено")}: {filteredItems.length}
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
          onUserChange={onUserChange}
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
          resultCount={filteredItems.length}
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
              {t("Нажмите на карточку, чтобы")} {t("выбрать")}.
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelectionMode}>
              {t("Завершить выбор")}
            </Button>
          </div>
        </div>
      ) : null}

      <WishlistGrid
        items={filteredItems}
        isLoading={isLoading}
        onEdit={onEditItem}
        onDelete={onDeleteItem}
        onTogglePurchased={onTogglePurchased}
        onSetStatus={onSetStatus}
        pendingStatusByItemId={pendingStatusByItemId}
        justPurchasedId={justPurchasedId}
        viewMode={viewMode}
        onEmptyAdd={onEmptyAdd}
        onOpenDetail={onOpenDetail}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={onToggleSelect}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        emptyTitle={
          items.length === 0 ? t("В списке пока пусто") : t("По этим фильтрам ничего нет")
        }
        emptyDescription={
          items.length === 0
            ? ownedListsForCreate.length === 0
              ? t("Сначала создайте подборку, затем добавьте первое желание.")
              : t("Добавьте первое желание вручную или вставьте ссылку на страницу товара.")
            : t("Попробуйте сбросить часть фильтров или изменить поиск.")
        }
        emptyActionLabel={
          items.length === 0
            ? ownedListsForCreate.length === 0
              ? t("Создать подборку")
              : t("Добавить желание")
            : undefined
        }
        onEmptyAction={
          items.length === 0
            ? ownedListsForCreate.length === 0
              ? onCreateList
              : onEmptyAdd
            : undefined
        }
        emptySecondaryLabel={
          items.length > 0 && hasActiveFilters ? t("Сбросить фильтры") : undefined
        }
        onEmptySecondaryAction={
          items.length > 0 && hasActiveFilters ? onClearAllFilters : undefined
        }
      />

      <div ref={sentinelRef} className="flex justify-center">
        {isLoadingMore ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : null}
        {!isLoadingMore && hasMore ? (
          <Button variant="outline" onClick={() => setSize(size + 1)}>
            {t("Загрузить ещё")}
          </Button>
        ) : null}
      </div>

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
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-4 z-40 h-14 w-14 rounded-full p-0 shadow-[var(--shadow-floating)] sm:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Button>
      ) : null}
    </div>
  );
}
