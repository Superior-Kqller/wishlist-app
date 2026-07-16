"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
} from "@/components/ui/dialog";
import { WishlistItem } from "@/types";
import { ItemComment } from "@/types";
import { formatPrice } from "@/lib/utils";
import useSWR from "swr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ItemDetailBody } from "@/components/wishlist/item-detail/item-detail-layout";
import { ItemMediaSection } from "@/components/wishlist/item-detail/item-media-section";
import { ItemMetaSection } from "@/components/wishlist/item-detail/item-meta-section";
import { ItemActivitySection } from "@/components/wishlist/item-detail/item-activity-section";
import { useI18n } from "@/components/i18n/language-provider";

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
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "PURCHASED") => void;
  statusPending?: boolean;
}

export function ItemDetailDialog({
  item,
  currentUserId,
  open,
  onClose,
  onEdit,
  onDelete,
  onTogglePurchased,
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
    { revalidateOnFocus: false }
  );

  useEffect(() => {
    if (!open || !item) return;
    setCommentText("");
  }, [open, item]);

  if (!item) return null;

  const canManage = currentUserId === item.userId;

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
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("Ошибка при отправке"));
      }
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || t("Не удалось удалить"));
      }
      toast.success(t("Комментарий удалён"));
      mutateComments();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("Ошибка при удалении комментария")
      );
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
    if (onSetStatus) {
      const nextStatus = item.status === "PURCHASED" ? "AVAILABLE" : "PURCHASED";
      onSetStatus(item.id, nextStatus);
      return;
    }
    onTogglePurchased(item.id, !item.purchased);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "item-detail-dialog-surface max-w-5xl gap-0 border-border/64 bg-[hsl(var(--surface-2))] shadow-[var(--shadow-dialog)]",
          /* Мобильные: почти на всю ширину и высоту экрана */
          "max-sm:max-h-[min(94dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.75rem))]",
          "max-sm:w-[calc(100vw-0.75rem)] max-sm:max-w-[min(42rem,calc(100vw-0.75rem))]",
        )}
        bodyClassName="p-0 gap-0 overflow-y-auto overscroll-y-contain"
      >
        <DialogDescription className="sr-only">
          {t("Детали желания")}: {item.title}
          {item.price != null && item.price > 0
            ? `, ${t("Ориентировочная стоимость").toLowerCase()} ${formatPrice(item.price, item.currency, language)}`
            : ""}
        </DialogDescription>
        <div className="item-detail-dialog-frame grid min-h-0 md:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <ItemMediaSection item={item} className="md:border-r md:border-border/34" />
          <div className="flex min-h-0 min-w-0 flex-col bg-[hsl(var(--surface-2))]">
            <ItemDetailBody>
              <ItemMetaSection
                item={item}
                canManage={canManage}
                statusPending={statusPending}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePurchased={handleTogglePurchased}
              />
            </ItemDetailBody>
            <div className="mt-auto border-t border-border/34 px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:px-5 sm:py-5">
              <ItemActivitySection
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
