"use client";

import { Loader2, MessageCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import type { ItemComment } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

type ItemActivitySectionProps = {
  comments: ItemComment[];
  currentUserId?: string;
  commentText: string;
  submittingComment: boolean;
  deletingCommentId: string | null;
  onCommentTextChange: (value: string) => void;
  onSubmitComment: (event: React.FormEvent) => void;
  onDeleteComment: (commentId: string) => void;
  className?: string;
};

export function ItemActivitySection({
  comments,
  currentUserId,
  commentText,
  submittingComment,
  deletingCommentId,
  onCommentTextChange,
  onSubmitComment,
  onDeleteComment,
  className,
}: ItemActivitySectionProps) {
  const { locale, t } = useI18n();

  return (
    <section className={cn("space-y-3", className)} aria-label={t("Комментарии")}>
      <h3 className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground/78" />
          {t("Комментарии")}
        </span>
        {comments.length > 0 ? (
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {comments.length}
          </span>
        ) : null}
      </h3>

      <div className="max-h-44 overflow-y-auto pr-1 sm:max-h-56">
        {comments.length === 0 ? (
          <div className="flex min-h-16 items-center gap-2 border-y border-border/28 py-3 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 shrink-0 text-muted-foreground/60" />
            <p>{t("Комментариев пока нет")}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-2 border-t border-border/28 py-3 text-sm first:border-t-0 first:pt-0"
            >
              <UserAvatar
                avatarUrl={comment.user.avatarUrl || undefined}
                name={comment.user.name}
                userId={comment.user.id}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground/72">
                    {new Date(comment.createdAt).toLocaleString(locale, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 break-words whitespace-pre-wrap">
                  {comment.text}
                </p>
              </div>
              {currentUserId === comment.userId ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  title={t("Удалить комментарий")}
                  aria-label={t("Удалить комментарий")}
                  disabled={deletingCommentId === comment.id}
                  onClick={() => onDeleteComment(comment.id)}
                >
                  {deletingCommentId === comment.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              ) : null}
            </div>
          ))
        )}
      </div>

      <form
        onSubmit={onSubmitComment}
        className="grid gap-2 border-t border-border/35 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      >
        <Textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder={t("Добавить комментарий…")}
          className="min-h-24 resize-y border-border/58 bg-[hsl(var(--surface-1))]"
          maxLength={2000}
          disabled={submittingComment}
        />
        <Button
          type="submit"
          size="sm"
          className="h-11 w-full shrink-0 whitespace-nowrap sm:w-auto"
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("Отправить")
          )}
        </Button>
      </form>
    </section>
  );
}
