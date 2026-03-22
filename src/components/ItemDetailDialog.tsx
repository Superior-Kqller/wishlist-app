"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PriorityBadge } from "./PriorityBadge";
import { UserAvatar } from "./UserAvatar";
import { WishlistItem } from "@/types";
import { ItemComment } from "@/types";
import { formatPrice, getTagColor } from "@/lib/utils";
import {
  Clock3,
  ExternalLink,
  Pencil,
  Trash2,
  ShoppingCart,
  Undo2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Loader2,
} from "lucide-react";
import useSWR from "swr";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  onSetStatus?: (id: string, status: "AVAILABLE" | "CLAIMED" | "PURCHASED") => void;
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
  const actionButtonClass =
    "h-11 min-h-[44px] w-full shrink-0 justify-center whitespace-nowrap border-primary/55 bg-card/85 px-3 text-foreground backdrop-blur-[8px] hover:border-primary/70 hover:bg-card sm:h-9 sm:min-h-9 sm:w-auto";

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
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
    setCurrentImageIndex(0);
    setImageError(false);
  }, [open, item?.id]);

  if (!item) return null;

  const images = item.images?.length ? item.images : [];
  const mainImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;

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
        throw new Error(err.error || "Ошибка при отправке");
      }
      setCommentText("");
      mutateComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка при отправке комментария");
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
        throw new Error(err.error || "Не удалось удалить");
      }
      toast.success("Комментарий удалён");
      mutateComments();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Ошибка при удалении комментария"
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

  const handleClaimAction = () => {
    if (statusPending) return;
    if (!onSetStatus) return;
    if (item.status === "AVAILABLE") onSetStatus(item.id, "CLAIMED");
    if (item.status === "CLAIMED") onSetStatus(item.id, "AVAILABLE");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className={cn(
          "max-w-2xl gap-0",
          /* Мобильные: почти на всю ширину и высоту экрана */
          "max-sm:max-h-[min(94dvh,calc(100dvh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-0.75rem))]",
          "max-sm:w-[calc(100vw-0.75rem)] max-sm:max-w-[min(42rem,calc(100vw-0.75rem))]",
        )}
        bodyClassName="p-0 gap-0 overflow-y-auto overscroll-y-contain"
      >
        <DialogDescription className="sr-only">
          Детали желания: {item.title}
          {item.price != null && item.price > 0
            ? `, цена ${formatPrice(item.price, item.currency)}`
            : ""}
        </DialogDescription>
        {/* Галерея: на мобильных ограничиваем высоту — больше места под текст и кнопки */}
        <div className="relative h-[min(42vh,280px)] w-full shrink-0 bg-muted sm:aspect-[2/1] sm:h-auto sm:min-h-0">
          {mainImage && !imageError ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className={cn(
                "object-cover",
                item.purchased && "grayscale"
              )}
              sizes="(max-width: 640px) 100vw, 672px"
              unoptimized={
                mainImage.startsWith("data:") || mainImage.startsWith("blob:")
              }
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {hasMultipleImages && !imageError && (
            <>
              <button
                type="button"
                onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Следующее фото"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentImageIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      i === currentImageIndex ? "bg-primary" : "bg-white/60 hover:bg-white/80"
                    )}
                    aria-label={`Фото ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="space-y-3 sm:space-y-4 px-3 pt-3 sm:px-6 sm:pt-6 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <DialogHeader className="space-y-0">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div>
                <DialogTitle className={cn("text-lg sm:text-xl", item.purchased && "line-through")}>
                  {item.title}
                </DialogTitle>
                {item.status === "CLAIMED" && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Clock3 className="w-3 h-3 mr-1" />
                    Забронировано
                  </Badge>
                )}
                {item.status === "PURCHASED" && (
                  <Badge className="mt-2 text-xs">Куплено</Badge>
                )}
              </div>
              <PriorityBadge priority={item.priority} />
            </div>
          </DialogHeader>

          {(item.user || (item.price != null && item.price > 0)) && (
            <div className="flex items-center justify-between gap-3">
              {item.user ? (
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <UserAvatar
                    avatarUrl={item.user.avatarUrl || undefined}
                    name={item.user.name}
                    userId={item.user.id}
                    size="sm"
                  />
                  <span className="truncate">{item.user.name}</span>
                </div>
              ) : (
                <span className="min-w-0 shrink" aria-hidden />
              )}
              {item.price != null && item.price > 0 ? (
                <p className="shrink-0 text-lg font-semibold tabular-nums">
                  {formatPrice(item.price, item.currency)}
                </p>
              ) : null}
            </div>
          )}

          {item.notes && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
          )}

          {item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {item.tags.map((tag) => {
                const color = tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
                return (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-xs"
                    style={{ borderColor: color, color }}
                  >
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* Действия: на мобильных — столбец на всю ширину без горизонтального скролла */}
          {(item.url || currentUserId === item.userId) && (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2 sm:pt-2">
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 min-h-[44px] w-full shrink-0 items-center justify-center gap-2 rounded-md bg-muted px-3 text-sm font-medium hover:bg-muted/80 sm:h-9 sm:min-h-9 sm:w-auto sm:justify-start"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  Открыть ссылку
                </a>
              )}
              {currentUserId === item.userId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className={actionButtonClass}
                  >
                    <Pencil className="mr-2 h-4 w-4 shrink-0" />
                    Редактировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePurchased}
                    className={actionButtonClass}
                    disabled={statusPending}
                  >
                    {item.status === "PURCHASED" ? (
                      <>
                        <Undo2 className="mr-2 h-4 w-4 shrink-0" />
                        Снять отметку
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
                        Отметить купленным
                      </>
                    )}
                  </Button>
                  {onSetStatus && item.status !== "PURCHASED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClaimAction}
                      className={actionButtonClass}
                      disabled={statusPending}
                    >
                      {item.status === "CLAIMED" ? "Снять бронь" : "Забронировать"}
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className="h-11 min-h-[44px] w-full shrink-0 justify-center whitespace-nowrap px-3 sm:h-9 sm:min-h-9 sm:w-auto"
                  >
                    <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                    Удалить
                  </Button>
                </>
              )}
              {currentUserId !== item.userId && onSetStatus && item.status !== "PURCHASED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClaimAction}
                  className={actionButtonClass}
                  disabled={statusPending}
                >
                  {item.status === "CLAIMED" ? "Снять бронь" : "Забронировать"}
                </Button>
              )}
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2.5 border-t pt-3 sm:space-y-3 sm:pt-4">
            <h3 className="text-sm font-semibold">Комментарии</h3>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Пока нет комментариев.</p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex gap-2 p-2 rounded-lg bg-muted/50 text-sm"
                  >
                    <UserAvatar
                      avatarUrl={c.user.avatarUrl || undefined}
                      name={c.user.name}
                      userId={c.user.id}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{c.user.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(c.createdAt).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-0.5 break-words whitespace-pre-wrap">
                        {c.text}
                      </p>
                    </div>
                    {currentUserId === c.userId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        title="Удалить комментарий"
                        aria-label="Удалить комментарий"
                        disabled={deletingCommentId === c.id}
                        onClick={() => handleDeleteComment(c.id)}
                      >
                        {deletingCommentId === c.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>

            <form
              onSubmit={handleAddComment}
              className="flex flex-col gap-2 sm:flex-row sm:items-end"
            >
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Добавить комментарий..."
                className="min-h-[72px] resize-none sm:min-h-[80px] sm:flex-1"
                maxLength={2000}
                disabled={submittingComment}
              />
              <Button
                type="submit"
                size="sm"
                className="w-full shrink-0 sm:w-auto"
                disabled={!commentText.trim() || submittingComment}
              >
                {submittingComment ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Отправить"
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
