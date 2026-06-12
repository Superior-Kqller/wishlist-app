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
    <div className={cn("space-y-3 rounded-xl border border-border/34 bg-[hsl(var(--surface-2))/0.62] p-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)] sm:space-y-3.5 sm:p-4", className)}>
      <h3 className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
        <span className="flex min-w-0 items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground/78" />
          {t("Комментарии")}
        </span>
        {comments.length > 0 ? (
          <span className="rounded-md border border-border/30 bg-[hsl(var(--surface-3))/0.5] px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {comments.length}
          </span>
        ) : null}
      </h3>

      <div className="max-h-40 space-y-2 overflow-y-auto sm:max-h-52">
        {comments.length === 0 ? (
          <div className="flex min-h-20 flex-col items-center justify-center text-center">
            <MessageCircle className="h-6 w-6 text-muted-foreground/35" />
            <p className="mt-2 text-sm text-muted-foreground/75">{t("Комментариев пока нет")}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-2 rounded-lg bg-[hsl(var(--surface-3))/0.48] p-2 text-sm"
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
        className="flex flex-col gap-2 border-t border-border/35 pt-3 sm:flex-row sm:items-end"
      >
        <Textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder={t("Добавить комментарий...")}
          className="min-h-[56px] resize-none bg-[hsl(var(--surface-2))/0.7] sm:min-h-16 sm:flex-1"
          maxLength={2000}
          disabled={submittingComment}
        />
        <Button
          type="submit"
          size="sm"
          className="h-10 w-full shrink-0 sm:w-auto"
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            t("Отправить")
          )}
        </Button>
      </form>
    </div>
  );
}
