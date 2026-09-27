"use client";

import { Loader2, MessageCircle, SendHorizontal, Trash2 } from "lucide-react";
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
      <h3 className="text-xs font-semibold text-muted-foreground">
        {t("Комментарии")}
        {comments.length > 0 ? <span className="tabular-nums"> · {comments.length}</span> : null}
      </h3>

      <div className="sm:max-h-56 sm:overflow-y-auto sm:pr-1">
        {comments.length === 0 ? (
          <p className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            {t("Комментариев пока нет")}
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 py-2.5 text-sm first:pt-0">
              <UserAvatar
                avatarUrl={comment.user.avatarUrl || undefined}
                name={comment.user.name}
                userId={comment.user.id}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{comment.user.name}</span>
                  <span className="text-xs text-muted-foreground-subtle">
                    {new Date(comment.createdAt).toLocaleString(locale, {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-0.5 break-words whitespace-pre-wrap leading-relaxed text-foreground/85">
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

      {/*
       * Поле в одну строку с кнопкой-значком. Раньше textarea в три строки и
       * «Отправить» на всю ширину под ней занимали четверть экрана окна — больше,
       * чем сами комментарии. Поле растёт, если текст длинный.
       */}
      <form onSubmit={onSubmitComment} className="flex items-end gap-2 pt-1">
        <Textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder={t("Добавить комментарий…")}
          aria-label={t("Комментарий")}
          rows={1}
          className="min-h-11 flex-1 resize-none border-border/55 py-2.5 [field-sizing:content] max-h-40"
          maxLength={2000}
          disabled={submittingComment}
        />
        <Button
          type="submit"
          variant="secondary"
          size="icon"
          className="h-11 w-11 shrink-0 text-primary-accent"
          aria-label={t("Отправить")}
          disabled={!commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <SendHorizontal className="h-4 w-4" aria-hidden />
          )}
        </Button>
      </form>
    </section>
  );
}
