"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ListWithMeta } from "@/types";
import { UserWithStats } from "@/types";
import { cn } from "@/lib/utils";
import { MemberList } from "@/components/wishlist/member-list";
import { useI18n } from "@/components/i18n/language-provider";
import { uiLayout } from "@/lib/ui-contract";
import { responseError } from "@/lib/response-error";

interface ListFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  list: ListWithMeta | null;
  users: UserWithStats[];
  onSuccess: () => void;
  /** Запрос на удаление: родитель закроет форму и покажет подтверждение */
  onDeleteRequest?: (list: ListWithMeta) => void;
}

export function ListFormDialog({
  open,
  onOpenChange,
  list,
  users,
  onSuccess,
  onDeleteRequest,
}: ListFormDialogProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [viewerIds, setViewerIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const isEdit = !!list;

  useEffect(() => {
    if (list) {
      setName(list.name);
      setViewerIds(list.viewerIds || []);
    } else {
      setName("");
      setViewerIds([]);
    }
  }, [list, open]);

  const toggleViewer = (userId: string) => {
    setViewerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t("Введите название подборки"));
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/lists/${list.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), viewerIds }),
        });
        if (!res.ok) throw await responseError(res, t("Ошибка при обновлении"));
        toast.success(t("Подборка обновлена"));
      } else {
        const res = await fetch("/api/lists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), viewerIds }),
        });
        if (!res.ok) throw await responseError(res, t("Ошибка при создании"));
        toast.success(t("Подборка создана"));
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при сохранении"));
    } finally {
      setSaving(false);
    }
  };

  const otherUsers = users.filter((u) => u.id !== list?.userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={uiLayout.dialogForm}>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("Редактировать подборку") : t("Создать подборку")}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("Измените название и выберите, кто может видеть эту подборку.")
              : t("Название и пользователи, которые смогут видеть подборку (кроме вас).")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="list-name">{t("Название")} *</Label>
            <Input
              id="list-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Например: День рождения")}
              required
            />
          </div>

          {otherUsers.length > 0 && (
            <div className="space-y-2">
              <Label>{t("Кто увидит подборку")}</Label>
              {isEdit ? (
                <div className="rounded-lg border border-border bg-[hsl(var(--surface-2)/0.55)] p-2">
                  <MemberList
                    users={users}
                    ownerId={list.userId}
                    viewerIds={viewerIds}
                    emptyLabel={t("Подборка видна только владельцу")}
                  />
                </div>
              ) : null}
              <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-lg border p-2 bg-muted/32">
                {otherUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleViewer(user.id)}
                    className={cn(
                      "inline-flex min-h-11 items-center rounded-full border px-3 text-sm font-medium transition-colors sm:min-h-9",
                      viewerIds.includes(user.id)
                        ? "border-primary/45 bg-primary/16 text-foreground"
                        : "bg-background border-input hover:bg-accent",
                    )}
                  >
                    {user.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:gap-2">
              {isEdit && onDeleteRequest && list ? (
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full border-destructive/85 bg-destructive/95 sm:w-auto"
                  disabled={saving}
                  onClick={() => {
                    onDeleteRequest(list);
                    onOpenChange(false);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("Удалить подборку")}
                </Button>
              ) : null}
            </div>
            <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("Отмена")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isEdit ? t("Сохранить") : t("Создать")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
