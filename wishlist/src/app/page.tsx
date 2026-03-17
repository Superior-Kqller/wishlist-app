"use client";

import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
import { Header } from "@/components/Header";
import { WishlistGrid } from "@/components/WishlistGrid";
import { ItemFormDialog } from "@/components/ItemFormDialog";
import { ParseUrlDialog } from "@/components/ParseUrlDialog";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { TagFilter } from "@/components/TagFilter";
import { UserFilter } from "@/components/UserFilter";
import { ListFilter } from "@/components/ListFilter";
import { ListFormDialog } from "@/components/ListFormDialog";
import { ItemDetailDialog } from "@/components/ItemDetailDialog";
import { FiltersDrawer } from "@/components/FiltersDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal } from "lucide-react";
import {
  WishlistItem,
  Tag,
  CreateItemPayload,
  ParsedProductResponse,
  UserWithStats,
  ListWithMeta,
} from "@/types";
import { toast } from "sonner";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Ошибка загрузки");
    return r.json();
  });

// Поддержка старого формата (массив) и нового (объект с пагинацией)
function extractItems(data: WishlistItem[] | { items: WishlistItem[]; pagination?: unknown }): WishlistItem[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && "items" in data && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}

function HomePageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentUserId = (session?.user as any)?.id;

  // Получаем userId и listId из URL параметров
  const userIdParam = searchParams.get("userId");
  const selectedUserId = userIdParam === "me" ? "me" : userIdParam || null;
  const listIdParam = searchParams.get("listId");
  const selectedListId = listIdParam || null;

  // Data fetching
  const itemsUrl = (() => {
    const params = new URLSearchParams();
    if (selectedUserId) params.set("userId", selectedUserId === "me" ? "me" : selectedUserId);
    if (selectedListId) params.set("listId", selectedListId);
    const q = params.toString();
    return q ? `/api/items?${q}` : "/api/items";
  })();
  const { data: itemsData, isLoading } = useSWR<WishlistItem[] | { items: WishlistItem[]; pagination?: unknown }>(
    itemsUrl,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 2000, // Дедупликация запросов в течение 2 секунд
    }
  );
  const items = useMemo(() => extractItems(itemsData || []), [itemsData]);
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
  const { data: usersStatsData } = useSWR<{ users: UserWithStats[] }>(
    "/api/users/stats",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10000, // Статистика меняется реже
    }
  );
  const usersWithStats = usersStatsData?.users || [];

  const { data: listsData, mutate: mutateLists } = useSWR<ListWithMeta[]>(
    "/api/lists",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  );
  const lists = listsData || [];

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [parseDialogOpen, setParseDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [parsedData, setParsedData] = useState<Partial<CreateItemPayload> | null>(null);
  const [listDialogOpen, setListDialogOpen] = useState(false);
  const [editingList, setEditingList] = useState<ListWithMeta | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItem | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter states
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showPurchased, setShowPurchased] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const effectiveSelectedTags = useMemo(
    () => selectedTags.filter((id) => tagsFromItems.some((t) => t.id === id)),
    [selectedTags, tagsFromItems]
  );

  // Filtered + sorted items
  const filteredItems = useMemo(() => {
    if (!items) return [];

    let filtered = [...items];

    // Search filter
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.notes?.toLowerCase().includes(q) ||
          item.tags.some((t) => t.name.includes(q))
      );
    }

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
  }, [items, search, sortBy, showPurchased, effectiveSelectedTags]);

  // Handlers
  const handleCreateItem = useCallback(async (data: CreateItemPayload) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Ошибка при создании желания");
    toast.success("Добавлено в список!");
    mutate("/api/items");
    mutate("/api/tags");
  }, []);

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
      mutate("/api/items");
      mutate("/api/tags");
      setEditingItem(null);
    },
    [editingItem]
  );

  const handleDeleteItem = useCallback(async (id: string) => {
    if (!window.confirm("Удалить это желание?")) return;
    const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Ошибка при удалении желания");
    toast.success("Удалено");
    mutate("/api/items");
  }, []);

  const handleTogglePurchased = useCallback(
    async (id: string, purchased: boolean) => {
      const res = await fetch(`/api/items/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ purchased }),
      });
      if (!res.ok) throw new Error("Ошибка при обновлении желания");
      toast.success(purchased ? "Отмечено как купленное" : "Отметка снята");
      mutate("/api/items");
    },
    []
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

  const handleToggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  }, []);

  const handleUserChange = useCallback((userId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (userId === null) params.delete("userId");
    else params.set("userId", userId === "me" ? "me" : userId);
    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  const handleListChange = useCallback((listId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (listId === null) params.delete("listId");
    else params.set("listId", listId);
    router.push(`/?${params.toString()}`);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen page-bg">
      <Header
        onAddItem={() => {
          setParsedData(null);
          setAddDialogOpen(true);
        }}
        onParseUrl={() => setParseDialogOpen(true)}
      />

      <main className="container mx-auto px-4 py-6 space-y-4">
        <div className="sticky top-16 z-30 -mx-4 px-4 py-2 sm:py-3 bg-background/95 backdrop-blur-sm border-b border-border/50 sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:static sm:z-auto flex flex-col gap-2 sm:gap-3 min-w-0">
          {/* Мобильная компактная строка: только поиск + кнопка «Фильтры» */}
          <div className="flex sm:hidden items-center gap-2 min-w-0">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск..."
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setMobileFiltersOpen(true)}
              title="Фильтры"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </Button>
          </div>
          {/* Десктоп: все фильтры по строкам */}
          <div className="hidden sm:flex flex-row flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            {currentUserId && usersWithStats.length > 0 && (
              <UserFilter
                selectedUserId={selectedUserId}
                onUserChange={handleUserChange}
                users={usersWithStats}
                currentUserId={currentUserId}
              />
            )}
            {currentUserId && (
              <ListFilter
                selectedListId={selectedListId}
                onListChange={handleListChange}
                lists={lists}
                onCreateClick={() => {
                  setEditingList(null);
                  setListDialogOpen(true);
                }}
                onEditClick={
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
          <div className="hidden sm:block">
            <SearchAndFilter
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={setSortBy}
              showPurchased={showPurchased}
              onTogglePurchased={() => setShowPurchased(!showPurchased)}
            />
          </div>
          <div className="hidden sm:block">
            <TagFilter
              tags={tagsFromItems}
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
            selectedUserId={selectedUserId}
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
            tags={tagsFromItems}
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
          onEmptyAdd={() => {
            setParsedData(null);
            setAddDialogOpen(true);
          }}
          onOpenDetail={setDetailItem}
        />

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
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        onEdit={(item) => {
          setDetailItem(null);
          setEditingItem(item);
          setParsedData(null);
        }}
        onDelete={handleDeleteItem}
        onTogglePurchased={handleTogglePurchased}
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
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen page-bg">
        <Header
          onAddItem={() => {}}
          onParseUrl={() => {}}
        />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-muted-foreground">Загрузка...</div>
          </div>
        </main>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  );
}
