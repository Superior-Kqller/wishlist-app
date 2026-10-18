"use client";

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate as globalMutate } from "swr";
import { ArrowLeft, FolderOpen, Loader2, Plus, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RetryNotice } from "@/components/ui/retry-notice";
import { PageMain, PageShell } from "@/components/ui/page-shell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { WishlistGrid } from "@/components/WishlistGrid";
import { useI18n } from "@/components/i18n/language-provider";
import { useInfiniteWishlistItems } from "@/hooks/use-infinite-wishlist-items";
import { useWishlistItemEditor } from "@/hooks/use-wishlist-item-editor";
import { getWishWord } from "@/lib/i18n";
import { responseError } from "@/lib/response-error";
import { uiState } from "@/lib/ui-contract";
import { cn, fetcher } from "@/lib/utils";
import type {
  CreateItemPayload,
  ListWithMeta,
  UpdateItemPayload,
  UserWithStats,
  WishlistItem,
} from "@/types";

const ItemFormDialog = dynamic(
  () => import("@/components/ItemFormDialog").then((mod) => mod.ItemFormDialog),
  { ssr: false },
);
const ListFormDialog = dynamic(
  () => import("@/components/ListFormDialog").then((mod) => mod.ListFormDialog),
  { ssr: false },
);
const ItemDetailDialog = dynamic(
  () => import("@/components/ItemDetailDialog").then((mod) => mod.ItemDetailDialog),
  { ssr: false },
);

/** Название подборки: владелец правит его прямо в заголовке, остальные только читают. */
function ListTitle({
  name,
  editable,
  onSave,
}: {
  name: string;
  editable: boolean;
  onSave: (name: string) => Promise<void>;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setDraft(name), [name]);

  if (!editable) return <h1 className="page-title text-foreground">{name}</h1>;

  const commit = async () => {
    const next = draft.trim();
    if (!next || next === name) {
      setDraft(name);
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
    } catch {
      setDraft(name);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={draft}
        maxLength={200}
        disabled={saving}
        aria-label={t("Название подборки")}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") inputRef.current?.blur();
          if (event.key === "Escape") {
            setDraft(name);
            inputRef.current?.blur();
          }
        }}
        className={cn(
          "page-title -mx-2 w-[calc(100%+1rem)] rounded-sm border border-transparent bg-transparent px-2 text-foreground",
          "hover:border-border focus-visible:border-foreground focus-visible:outline-none",
        )}
      />
      {saving ? (
        <Loader2
          className="absolute right-2 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

export default function ListDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t, language } = useI18n();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role ?? null;

  const [showPurchased, setShowPurchased] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [detailItem, setDetailItem] = useState<WishlistItem | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: list,
    error: listError,
    mutate: mutateList,
  } = useSWR<ListWithMeta>(`/api/lists/${id}`, fetcher, { revalidateOnFocus: false });
  const { data: usersData } = useSWR<{ users: UserWithStats[] }>("/api/users/stats", fetcher, {
    revalidateOnFocus: false,
  });
  const users = useMemo(() => usersData?.users ?? [], [usersData?.users]);

  const {
    items: feedItems,
    isLoading: feedLoading,
    loadError,
    retry,
    mutateItems,
    sentinelRef,
  } = useInfiniteWishlistItems({
    normalizedSelectedUserId: null,
    selectedListId: id,
    debouncedSearch: "",
    sortBy: "",
    showPurchased,
    categories: [],
  });
  const refresh = useCallback(async () => {
    await Promise.all([mutateItems(), mutateList()]);
  }, [mutateItems, mutateList]);
  const editor = useWishlistItemEditor({ mutateItems: refresh, t });

  const isOwner = Boolean(list && list.userId === currentUserId);
  const owner = users.find((u) => u.id === list?.userId);
  const viewers = useMemo(
    () => users.filter((u) => list?.viewerIds.includes(u.id)),
    [users, list?.viewerIds],
  );
  const visibleItems = useMemo(
    () => feedItems.filter((item) => !editor.hiddenItemIds.has(item.id)),
    [feedItems, editor.hiddenItemIds],
  );

  const renameList = async (name: string) => {
    try {
      const res = await fetch(`/api/lists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw await responseError(res, t("Ошибка при сохранении"));
      toast.success(t("Сохранено!"));
      await Promise.all([mutateList(), globalMutate("/api/lists")]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при сохранении"));
      throw err;
    }
  };

  // Ошибку не глотаем: её показывает ConfirmDialog, оставаясь открытым.
  const confirmDelete = async () => {
    const res = await fetch(`/api/lists/${id}`, { method: "DELETE" });
    if (!res.ok) throw await responseError(res, t("Не удалось удалить подборку"));
    toast.success(t("Подборка удалена"));
    await globalMutate("/api/lists");
    router.push("/lists");
  };

  const handleUpdateItem = async (data: CreateItemPayload | UpdateItemPayload) => {
    if (!editingItem) return;
    await editor.updateItemById(editingItem.id, data);
    setEditingItem(null);
  };

  if (listError) {
    return (
      <PageShell>
        <PageMain>
          <RetryNotice onRetry={() => mutateList()}>
            {t("Не удалось загрузить подборку")}
          </RetryNotice>
        </PageMain>
      </PageShell>
    );
  }

  const count = list?._count.items ?? 0;

  return (
    <PageShell>
      <PageMain>
        <div className="space-y-8">
          <Link
            href="/lists"
            className={cn(
              "inline-flex items-center gap-1.5 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground",
              uiState.focusRing,
            )}
          >
            <ArrowLeft className="size-4" aria-hidden />
            {t("Подборки")}
          </Link>

          <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-center gap-5">
              <div className="media-tile relative size-24 shrink-0 overflow-hidden rounded-[14px] bg-[hsl(var(--surface-3))] sm:size-28">
                {list?.coverUrl ? (
                  <Image
                    src={list.coverUrl}
                    alt=""
                    fill
                    sizes="112px"
                    className="object-cover"
                    unoptimized={list.coverUrl.startsWith("/uploads/")}
                  />
                ) : (
                  <FolderOpen
                    className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 stroke-[1.5] text-muted-foreground"
                    aria-hidden
                  />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {list ? (
                  <ListTitle name={list.name} editable={isOwner} onSave={renameList} />
                ) : (
                  <div className="h-9 w-56 animate-pulse rounded-sm bg-muted" aria-hidden />
                )}
                {list ? (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                    <span className="tabular-nums">
                      {count} {getWishWord(language, count)}
                    </span>
                    {owner ? (
                      <span className="inline-flex items-center gap-1.5 text-foreground">
                        <UserAvatar
                          avatarUrl={owner.avatarUrl || undefined}
                          name={owner.name}
                          userId={owner.id}
                          size="sm"
                        />
                        {isOwner ? t("Это вы") : owner.name}
                      </span>
                    ) : null}
                    {isOwner ? (
                      <span>
                        {viewers.length > 0
                          ? `${t("Доступ")}: ${viewers.map((u) => u.name).join(", ")}`
                          : t("Видна только вам")}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            {isOwner ? (
              <div className="flex shrink-0 items-center gap-2">
                <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
                  <Settings2 className="size-4" aria-hidden />
                  {t("Доступ и обложка")}
                </Button>
                <Button type="button" onClick={() => setAddOpen(true)}>
                  <Plus className="size-4" aria-hidden />
                  {t("Добавить желание")}
                </Button>
              </div>
            ) : null}
          </header>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="section-title">{t("Желания")}</h2>
              <button
                type="button"
                aria-pressed={showPurchased}
                onClick={() => setShowPurchased((value) => !value)}
                className={cn(
                  "h-9 rounded-full border px-4 text-sm font-medium transition-colors duration-fast",
                  uiState.focusRing,
                  showPurchased ? "border-2 border-foreground" : "border-border hover:bg-accent",
                )}
              >
                {t("Показать купленные")}
              </button>
            </div>

            {loadError === "initial" ? (
              <RetryNotice onRetry={retry}>{t("Не удалось загрузить список желаний.")}</RetryNotice>
            ) : (
              <WishlistGrid
                items={visibleItems}
                isLoading={feedLoading}
                onEdit={setEditingItem}
                onDelete={editor.deleteItemWithUndo}
                onSetStatus={editor.handleSetItemStatus}
                pendingStatusByItemId={editor.pendingStatusByItemId}
                justPurchasedId={editor.justPurchasedId}
                hideOwner
                onOpenDetail={setDetailItem}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                emptyTitle={t("В подборке пока пусто")}
                emptyDescription={
                  isOwner
                    ? t("Добавьте первое желание вручную или вставьте ссылку на страницу товара.")
                    : t("Владелец ещё ничего сюда не добавил.")
                }
                emptyActionLabel={isOwner ? t("Добавить желание") : undefined}
                onEmptyAction={isOwner ? () => setAddOpen(true) : undefined}
              />
            )}
            <div ref={sentinelRef} aria-hidden />
          </section>
        </div>
      </PageMain>

      {list ? (
        <>
          <ItemFormDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            onSave={editor.handleCreateItem}
            existingLists={[list]}
            defaultListId={list.id}
            listPickerRequired
          />
          <ItemFormDialog
            open={!!editingItem}
            onOpenChange={(open) => !open && setEditingItem(null)}
            item={editingItem}
            onSave={handleUpdateItem}
            existingLists={[list]}
          />
          <ItemDetailDialog
            item={detailItem}
            currentUserId={currentUserId}
            open={!!detailItem}
            onClose={() => setDetailItem(null)}
            onEdit={(item) => {
              setDetailItem(null);
              setEditingItem(item);
            }}
            onDelete={editor.deleteItemWithUndo}
            onSetStatus={editor.handleSetItemStatus}
            statusPending={detailItem ? !!editor.pendingStatusByItemId[detailItem.id] : false}
          />
          <ListFormDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            list={list}
            users={users}
            onSuccess={() => {
              void mutateList();
              void globalMutate("/api/lists");
            }}
            onDeleteRequest={() => {
              setSettingsOpen(false);
              setDeleteOpen(true);
            }}
          />
          <ConfirmDialog
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
            title={`${t("Удалить подборку?")} ${list.name}`}
            confirmLabel={t("Удалить")}
            variant="destructive"
            onConfirm={confirmDelete}
          />
        </>
      ) : null}
    </PageShell>
  );
}
