"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PriorityStars } from "./PriorityStars";
import { UserAvatar } from "./UserAvatar";
import { WishlistItem } from "@/types";
import { ItemComment } from "@/types";
import { formatPrice, getTagColor } from "@/lib/utils";
import {
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
import { useSession } from "next-auth/react";
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
  open: boolean;
  onClose: () => void;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
}

export function ItemDetailDialog({
  item,
  open,
  onClose,
  onEdit,
  onDelete,
  onTogglePurchased,
}: ItemDetailDialogProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const { data: comments = [], mutate: mutateComments } = useSWR<ItemComment[]>(
    item && open ? `/api/items/${item.id}/comments` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

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

  const handleEdit = () => {
    onClose();
    onEdit(item);
  };

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleTogglePurchased = () => {
    onTogglePurchased(item.id, !item.purchased);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-2xl gap-0"
        bodyClassName="p-0 gap-0 overflow-y-auto overscroll-y-contain"
      >
        {/* Gallery */}
        <div className="relative aspect-[4/3] sm:aspect-[2/1] bg-muted shrink-0">
          {mainImage && !imageError ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className={cn(
                "object-cover",
                item.purchased && "grayscale"
              )}
              sizes="(max-width: 768px) 100vw, 672px"
              unoptimized={mainImage.startsWith("data:") || mainImage.startsWith("blob:")}
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
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white"
                aria-label="Предыдущее фото"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white"
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
              <DialogTitle className={cn("text-lg sm:text-xl", item.purchased && "line-through")}>
                {item.title}
              </DialogTitle>
              <PriorityStars priority={item.priority} />
            </div>
          </DialogHeader>

          {(item.price != null && item.price > 0) && (
            <p className="text-lg font-semibold tabular-nums">
              {formatPrice(item.price, item.currency)}
            </p>
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

          {item.user && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pb-0.5">
              <UserAvatar
                avatarUrl={item.user.avatarUrl || undefined}
                name={item.user.name}
                userId={item.user.id}
                size="sm"
              />
              <span>{item.user.name}</span>
            </div>
          )}

          {/* Actions: на мобильном — сетка 2×2 без «дыр»; на sm+ — как раньше */}
          {(item.url || currentUserId === item.userId) && (
            <div
              className={cn(
                "grid w-full gap-2 border-t pt-3 sm:flex sm:flex-wrap sm:items-stretch sm:gap-2 sm:pt-2",
                item.url && currentUserId === item.userId && "grid-cols-2",
                item.url && currentUserId !== item.userId && "grid-cols-1",
                !item.url && currentUserId === item.userId && "grid-cols-2",
              )}
            >
              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-muted px-3 py-2.5 text-sm font-medium hover:bg-muted/80 sm:min-h-9 sm:w-auto sm:justify-start sm:py-2"
                >
                  <ExternalLink className="h-4 w-4 shrink-0" />
                  <span className="truncate">Открыть ссылку</span>
                </a>
              )}
              {currentUserId === item.userId && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEdit}
                    className="min-h-10 w-full sm:min-h-9 sm:w-auto"
                  >
                    <Pencil className="mr-2 h-4 w-4 shrink-0" />
                    Редактировать
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTogglePurchased}
                    className="min-h-10 w-full sm:min-h-9 sm:w-auto"
                  >
                    {item.purchased ? (
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    className={cn(
                      "min-h-10 w-full sm:min-h-9 sm:w-auto",
                      !item.url ? "col-span-2 sm:col-span-1" : "",
                    )}
                  >
                    <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                    Удалить
                  </Button>
                </>
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
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
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
                      <p className="whitespace-pre-wrap break-words mt-0.5">{c.text}</p>
                    </div>
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
