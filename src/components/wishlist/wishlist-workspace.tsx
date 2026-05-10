"use client";

import type { RefObject } from "react";
import { ArrowUpDown, CheckSquare, Download, Loader2, MoreHorizontal, Plus, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { SearchField } from "@/components/ui/search-field";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WishlistGrid } from "@/components/WishlistGrid";
import {
  WishlistSearchInput,
  WishlistToolbarControls,
} from "@/components/SearchAndFilter";
import { TagFilter } from "@/components/TagFilter";
import { CombinedFilter } from "@/components/CombinedFilter";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import {
  WishlistViewToggle,
  type WishlistViewMode,
} from "@/components/wishlist/wishlist-view-toggle";
import { uiState, uiSurface } from "@/lib/ui-contract";
import { getCardWord } from "@/lib/i18n";
import type {
  ListWithMeta,
  Tag,
  UserWithStats,
  WishlistItem,
} from "@/types";

type WishlistWorkspaceProps = {
  search: string;
  onSearchChange: (value: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  mobileFiltersOpen: boolean;
  onMobileFiltersOpenChange: (open: boolean) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
  usersWithStats: UserWithStats[];
  lists: ListWithMeta[];
  normalizedSelectedUserId: string | null;
  selectedListId: string | null;
  onUserChange: (userId: string | null) => void;
  onListChange: (listId: string | null) => void;
  onCreateList: () => void;
  onEditSelectedList?: () => void;
  tagsForFilters: Tag[];
  effectiveSelectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearTags: () => void;
  onAddItem: () => void;
  onExport: (format: "csv" | "json") => void;
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
  onSetStatus: (id: string, status: "AVAILABLE" | "CLAIMED" | "PURCHASED") => void;
  pendingStatusByItemId: Record<string, boolean>;
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
  mobileFiltersOpen,
  onMobileFiltersOpenChange,
  currentUserId,
  currentUserRole,
  usersWithStats,
  lists,
  normalizedSelectedUserId,
  selectedListId,
  onUserChange,
  onListChange,
  onCreateList,
  onEditSelectedList,
  tagsForFilters,
  effectiveSelectedTags,
  onToggleTag,
  onClearTags,
  onAddItem,
  onExport,
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
  const { language, t } = useI18n();

  return (
    <>
      <div className={uiSurface.homeToolbar}>
        <div className="flex min-w-0 items-center gap-2 sm:hidden">
          <SearchField
            value={search}
            onValueChange={onSearchChange}
            placeholder={t("Поиск...")}
            wrapperClassName="min-w-0 flex-1"
            inputClassName={`h-11 min-h-[44px] rounded-lg ${uiSurface.inputAlt} pl-9 text-sm`}
          />
        </div>

        <div className="grid min-w-0 grid-cols-4 items-center gap-1.5 sm:hidden">
          <Button
            variant="outline"
            className="relative h-11 min-w-0 gap-1 rounded-lg px-1.5 text-[11px]"
            onClick={() => onMobileFiltersOpenChange(true)}
            title={t("Фильтры")}
            aria-label={
              hasActiveFilters
                ? `${t("Фильтры")}: ${activeFilterCount}`
                : t("Фильтры")
            }
          >
            <SlidersHorizontal className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{t("Фильтр")}</span>
            {hasActiveFilters ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <Button
            variant="outline"
            className="h-11 min-w-0 gap-1 rounded-lg px-1.5 text-[11px]"
            onClick={() => onMobileFiltersOpenChange(true)}
            title={t("Сортировка")}
          >
            <ArrowUpDown className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{t("Сорт")}</span>
          </Button>
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            className="h-11 min-w-0 gap-1 rounded-lg px-1.5 text-[11px]"
            onClick={onToggleSelectionMode}
            title={selectionMode ? t("Отменить выбор") : t("Выбрать")}
            aria-label={selectionMode ? t("Отменить выбор") : t("Выбрать карточки")}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            <span className="min-w-0 truncate">{selectionMode ? t("Готово") : t("Выбрать")}</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="h-11 min-w-0 gap-1 rounded-lg px-1.5 text-[11px]"
                aria-label={t("Ещё действия")}
              >
                <MoreHorizontal className="h-4 w-4 shrink-0" />
                <span className="min-w-0 truncate">{t("Ещё")}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={onAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                {t("Добавить товар")}
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

        <div className="hidden min-w-0 w-full flex-col gap-2 sm:flex xl:flex-row xl:items-start xl:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 xl:max-w-[42rem]">
            <WishlistSearchInput
              search={search}
              onSearchChange={onSearchChange}
              className="min-w-[18rem] flex-1"
            />
            <TagFilter
              tags={tagsForFilters}
              selectedTags={effectiveSelectedTags}
              onToggleTag={onToggleTag}
              onClearTags={onClearTags}
            />
          </div>

          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
            {currentUserId && usersWithStats.length > 0 ? (
              <CombinedFilter
                currentUserId={currentUserId}
                users={usersWithStats}
                lists={lists}
                selectedUserId={normalizedSelectedUserId}
                selectedListId={selectedListId}
                onUserChange={onUserChange}
                onListChange={onListChange}
                onCreateList={onCreateList}
                onEditList={onEditSelectedList}
              />
            ) : null}
            <WishlistToolbarControls
              sortBy={sortBy}
              onSortChange={onSortChange}
              showPurchased={showPurchased}
              onTogglePurchased={onTogglePurchasedVisibility}
              selectionMode={selectionMode}
              onToggleSelection={onToggleSelectionMode}
              showSelectionButton={false}
            />
            <WishlistViewToggle
              value={viewMode}
              onValueChange={onViewModeChange}
              className="hidden lg:inline-flex"
            />
            <Button
              type="button"
              variant={selectionMode ? "secondary" : "outline"}
              size="sm"
              className={selectionMode ? uiState.selectionActive : uiState.selectionIdle}
              onClick={onToggleSelectionMode}
            >
              <CheckSquare className="h-4 w-4 shrink-0" />
              {selectionMode ? t("Режим выбора") : t("Выбрать")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-9 gap-2 text-muted-foreground hover:text-foreground">
                  <Download className="h-4 w-4" />
                  {t("Экспорт")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => onExport("csv")}>
                  {t("Экспорт CSV")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onExport("json")}>
                  {t("Экспорт JSON")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" size="sm" className="h-9 gap-2" onClick={onAddItem}>
              <Plus className="h-4 w-4" />
              {t("Добавить товар")}
            </Button>
          </div>
        </div>

        <FiltersDrawer
          open={mobileFiltersOpen}
          onOpenChange={onMobileFiltersOpenChange}
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
          tags={tagsForFilters}
          selectedTags={effectiveSelectedTags}
          onToggleTag={onToggleTag}
          onClearTags={onClearTags}
        />
      </div>

      {selectionMode ? (
        <div className={uiSurface.homeSelectionState}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p>
              {t("Режим выбора")}:
              <span className="font-semibold">{selectedIds.size}</span>{" "}
              {getCardWord(language, selectedIds.size)}
              .
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
              ? t("Сначала создайте подборку, затем добавьте первый товар.")
              : t("Добавьте первый товар вручную или вставьте ссылку на страницу товара.")
            : t("Попробуйте сбросить часть фильтров или изменить поиск.")
        }
        emptyActionLabel={
          items.length === 0
            ? ownedListsForCreate.length === 0
              ? t("Создать подборку")
              : t("Добавить товар")
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

      <div ref={sentinelRef} className="flex justify-center py-4 sm:py-6">
        {isLoadingMore ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : null}
        {!isLoadingMore && hasMore ? (
          <Button variant="outline" onClick={() => setSize(size + 1)}>
            {t("Загрузить ещё")}
          </Button>
        ) : null}
      </div>
    </>
  );
}
