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
import useSWR, { mutate } from "swr";
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
  const currentUserId = (session?.user as { id?: string })?.id;

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
    if (typeof window !== "undefined" && window.confirm("Удалить это желание?")) {
      onDelete(item.id);
      onClose();
    }
  };

  const handleTogglePurchased = () => {
    onTogglePurchased(item.id, !item.purchased);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Gallery */}
        <div className="relative aspect-[4/3] sm:aspect-[2/1] bg-muted shrink-0">
          {mainImage && !imageError ? (
            <Image
              src={mainImage}
              alt={item.title}
              fill
              className={cn(
                "object-contain sm:object-cover",
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

        <div className="p-4 sm:p-6 space-y-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className={cn("text-xl", item.purchased && "line-through")}>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UserAvatar
                avatarUrl={item.user.avatarUrl || undefined}
                name={item.user.name}
                userId={item.user.id}
                size="sm"
              />
              <span>{item.user.name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-muted hover:bg-muted/80 text-sm font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Открыть ссылку
              </a>
            )}
            {currentUserId === item.userId && (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePurchased}
                >
                  {item.purchased ? (
                    <>
                      <Undo2 className="w-4 h-4 mr-2" />
                      Снять отметку
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Отметить купленным
                    </>
                  )}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Удалить
                </Button>
              </>
            )}
          </div>

          {/* Comments */}
          <div className="pt-4 border-t space-y-3">
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

            <form onSubmit={handleAddComment} className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Добавить комментарий..."
                className="min-h-[80px] resize-none"
                maxLength={2000}
                disabled={submittingComment}
              />
              <Button type="submit" size="sm" disabled={!commentText.trim() || submittingComment}>
                {submittingComment ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
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
