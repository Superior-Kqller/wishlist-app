"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { WishlistItem } from "@/types";
import { ItemComment } from "@/types";
import { formatPrice } from "@/lib/utils";
import useSWR from "swr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ItemMediaSection } from "@/components/wishlist/item-detail/item-media-section";
import {
  ItemActionCard,
  ItemDetailDock,
  ItemDetailHeader,
  ItemDetailNotes,
} from "@/components/wishlist/item-detail/item-meta-section";
import { ItemActivitySection } from "@/components/wishlist/item-detail/item-activity-section";
import { useI18n } from "@/components/i18n/language-provider";
import { getPurchaseToggleTarget, type ItemStatus } from "@/lib/item-status";
import { responseError } from "@/lib/response-error";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Ошибка загрузки");
    return r.json();
  });

interface ItemDetailDialogProps {
  item: WishlistItem | null;
  currentUserId?: string;
  open: boolean;
  onClose: () => void;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  statusPending?: boolean;
}

export function ItemDetailDialog({
  item,
  currentUserId,
  open,
  onClose,
  onEdit,
  onDelete,
  onSetStatus,
  statusPending = false,
}: ItemDetailDialogProps) {
  const { language, t } = useI18n();
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  const { data: comments = [], mutate: mutateComments } = useSWR<ItemComment[]>(
    item && open ? `/api/items/${item.id}/comments` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  useEffect(() => {
    if (!open || !item) return;
    setCommentText("");
  }, [open, item]);

  if (!item) return null;

  const canManage = currentUserId === item.userId;
  // Фото показывается, только когда снимок есть: пустая плитка читалась «не догрузилось».
  const hasImage = Boolean(item.images?.[0]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/items/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw await responseError(res, t("Ошибка при отправке"));
      setCommentText("");
      mutateComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при отправке комментария"));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!item) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/items/${item.id}/comments/${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw await responseError(res, t("Не удалось удалить"));
      toast.success(t("Комментарий удалён"));
      mutateComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при удалении комментария"));
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleEdit = () => {
    onClose();
    onEdit(item);
  };

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleTogglePurchased = () => {
    if (statusPending) return;
    onSetStatus(item.id, getPurchaseToggleTarget(item));
  };

  const actionProps = {
    item,
    canManage,
    statusPending,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onTogglePurchased: handleTogglePurchased,
  };

  /*
   * Детальный вид по DESIGN.md: слева название, фото, описание и комментарии,
   * справа липкая карточка действий; на телефоне она становится нижней
   * панелью. Крестик — в правом верхнем углу (Atlassian → Modal dialog).
   */
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "item-detail-dialog-surface bottom-0 left-0 top-auto max-h-[min(96dvh,calc(100dvh-env(safe-area-inset-top,0px)))] w-full max-w-none translate-x-0 translate-y-0 gap-0 rounded-b-none rounded-t-2xl border-border",
          "sm:bottom-auto sm:left-[50%] sm:top-[50%] sm:max-h-[min(90dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.5rem))] sm:w-[min(100%,calc(100vw-2rem))] sm:max-w-[67.5rem] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl",
        )}
        bodyClassName="relative gap-0 overflow-hidden p-0"
        // Фокус — на само окно, а не в поле комментария: на телефоне иначе сразу
        // выезжает клавиатура (Atlassian → Modal dialog → Setting focus).
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus();
        }}
      >
        <DialogDescription className="sr-only">
          {t("Детали желания")}: {item.title}
          {item.price != null && item.price > 0
            ? `, ${t("Ориентировочная стоимость").toLowerCase()} ${formatPrice(item.price, item.currency, language)}`
            : ""}
        </DialogDescription>
        {/* Хват на телефоне — настоящая кнопка закрытия, ближе к пальцу, чем крестик. */}
        <button
          type="button"
          onClick={onClose}
          aria-label={t("Закрыть")}
          className="absolute left-1/2 top-0 z-20 flex h-6 w-16 -translate-x-1/2 items-center justify-center rounded-b-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
        >
          <span className="h-1 w-10 rounded-full bg-border" aria-hidden />
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-8 px-4 pb-8 pt-8 sm:px-8 md:grid-cols-[minmax(0,1fr)_20rem] md:gap-12">
            <div className="min-w-0 space-y-8">
              <ItemDetailHeader item={item} />
              {hasImage ? <ItemMediaSection item={item} /> : null}
              {item.notes?.trim() ? (
                <div className="border-t border-border pt-8">
                  <ItemDetailNotes item={item} />
                </div>
              ) : null}
              <ItemActivitySection
                className="border-t border-border pt-8"
                comments={comments}
                currentUserId={currentUserId}
                commentText={commentText}
                submittingComment={submittingComment}
                deletingCommentId={deletingCommentId}
                onCommentTextChange={setCommentText}
                onSubmitComment={handleAddComment}
                onDeleteComment={handleDeleteComment}
              />
            </div>
            <aside className="hidden pt-10 md:block" aria-label={t("Действия")}>
              <div className="sticky top-0">
                <ItemActionCard {...actionProps} />
              </div>
            </aside>
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 md:hidden">
          <ItemDetailDock {...actionProps} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
