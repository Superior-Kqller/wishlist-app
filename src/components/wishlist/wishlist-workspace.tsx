"use client";

import type { RefObject } from "react";
import { CheckSquare, Loader2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
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
  return (
    <>
      <div className={uiSurface.homeToolbar}>
        <div className="flex min-w-0 items-center gap-2 sm:hidden">
          <SearchField
            value={search}
            onValueChange={onSearchChange}
            placeholder="Поиск..."
            wrapperClassName="min-w-0 flex-1"
            inputClassName={`h-11 min-h-[44px] rounded-lg ${uiSurface.inputAlt} pl-9 text-sm`}
          />
          <Button
            variant="outline"
            size="icon"
            className="relative size-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg"
            onClick={() => onMobileFiltersOpenChange(true)}
            title="Фильтры"
            aria-label={
              hasActiveFilters
                ? `Фильтры, активно: ${activeFilterCount}`
                : "Фильтры"
            }
          >
            <SlidersHorizontal className="h-5 w-5" />
            {hasActiveFilters ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>
          <Button
            variant={selectionMode ? "secondary" : "outline"}
            size="icon"
            className="size-11 min-h-[44px] min-w-[44px] shrink-0 rounded-lg"
            onClick={onToggleSelectionMode}
            title={selectionMode ? "Отменить выбор" : "Выбрать"}
            aria-label={selectionMode ? "Отменить выбор" : "Выбрать карточки"}
          >
            <CheckSquare className="h-5 w-5" />
          </Button>
        </div>

        <div className="hidden min-w-0 w-full items-center gap-2 sm:flex">
          <WishlistSearchInput
            search={search}
            onSearchChange={onSearchChange}
            className="min-w-0 flex-1 basis-[22rem]"
          />
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
        </div>

        <div className="hidden min-w-0 w-full items-center justify-between gap-2 sm:flex">
          <div className="min-w-0 flex-1">
            <TagFilter
              tags={tagsForFilters}
              selectedTags={effectiveSelectedTags}
              onToggleTag={onToggleTag}
              onClearTags={onClearTags}
            />
          </div>
          <div className="flex items-center gap-2">
            <WishlistViewToggle
              value={viewMode}
              onValueChange={onViewModeChange}
              className="hidden lg:inline-flex"
            />
            <WishlistToolbarControls
              sortBy={sortBy}
              onSortChange={onSortChange}
              showPurchased={showPurchased}
              onTogglePurchased={onTogglePurchasedVisibility}
              selectionMode={selectionMode}
              onToggleSelection={onToggleSelectionMode}
              showSelectionButton={false}
            />
            <Button
              type="button"
              variant={selectionMode ? "secondary" : "outline"}
              size="sm"
              className={selectionMode ? uiState.selectionActive : uiState.selectionIdle}
              onClick={onToggleSelectionMode}
            >
              <CheckSquare className="h-4 w-4 shrink-0" />
              {selectionMode ? "Режим выбора" : "Выбрать"}
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
              Режим выбора активен: отмечено{" "}
              <span className="font-semibold">{selectedIds.size}</span>{" "}
              {selectedIds.size === 1
                ? "карточка"
                : selectedIds.size < 5
                  ? "карточки"
                  : "карточек"}
              .
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={onClearSelectionMode}>
              Завершить выбор
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
          items.length === 0 ? "В списке пока пусто" : "По этим фильтрам ничего нет"
        }
        emptyDescription={
          items.length === 0
            ? ownedListsForCreate.length === 0
              ? "Сначала создайте подборку, затем добавьте первый товар."
              : "Добавьте первый товар вручную или вставьте ссылку на страницу товара."
            : "Попробуйте сбросить часть фильтров или изменить поиск."
        }
        emptyActionLabel={
          items.length === 0
            ? ownedListsForCreate.length === 0
              ? "Создать подборку"
              : "Добавить товар"
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
          items.length > 0 && hasActiveFilters ? "Сбросить фильтры" : undefined
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
            Загрузить ещё
          </Button>
        ) : null}
      </div>
    </>
  );
}
