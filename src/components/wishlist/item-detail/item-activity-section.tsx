"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/UserAvatar";
import type { ItemComment } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";

type ItemActivitySectionProps = {
  comments: ItemComment[];
  currentUserId?: string;
  commentText: string;
  submittingComment: boolean;
  deletingCommentId: string | null;
  onCommentTextChange: (value: string) => void;
  onSubmitComment: (event: React.FormEvent) => void;
  onDeleteComment: (commentId: string) => void;
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
}: ItemActivitySectionProps) {
  const { locale, t } = useI18n();

  return (
    <div className="space-y-2.5 border-t pt-3 sm:space-y-3 sm:pt-4">
      <h3 className="text-sm font-semibold">{t("Комментарии")}</h3>

      <div className="max-h-40 space-y-2 overflow-y-auto sm:max-h-48">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("Комментариев пока нет")}</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-2 rounded-lg bg-muted/50 p-2 text-sm"
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
                  <span className="text-xs text-muted-foreground">
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
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
      >
        <Textarea
          value={commentText}
          onChange={(event) => onCommentTextChange(event.target.value)}
          placeholder={t("Добавить комментарий...")}
          className="min-h-[56px] resize-none sm:min-h-[80px] sm:flex-1"
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
            t("Отправить")
          )}
        </Button>
      </form>
    </div>
  );
}
