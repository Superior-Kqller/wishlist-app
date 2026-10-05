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
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { mutate } from "swr";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
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
  const [nameError, setNameError] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverBusy, setCoverBusy] = useState(false);

  const isEdit = !!list;

  useEffect(() => {
    if (list) {
      setName(list.name);
      setViewerIds(list.viewerIds || []);
      setCoverUrl(list.coverUrl ?? null);
    } else {
      setName("");
      setViewerIds([]);
      setCoverUrl(null);
    }
  }, [list, open]);

  const toggleViewer = (userId: string) => {
    setViewerIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  // Обложка сохраняется сразу, как аватар: отдельный запрос, форму отправлять не нужно.
  const changeCover = async (file: File | null) => {
    if (!list) return;
    setCoverBusy(true);
    try {
      if (file) {
        const body = new FormData();
        body.append("cover", file);
        const res = await fetch(`/api/lists/${list.id}/cover`, { method: "POST", body });
        if (!res.ok) throw await responseError(res, t("Не удалось загрузить обложку"));
        setCoverUrl((await res.json()).coverUrl);
        toast.success(t("Обложка обновлена"));
      } else {
        const res = await fetch(`/api/lists/${list.id}/cover`, { method: "DELETE" });
        if (!res.ok) throw await responseError(res, t("Не удалось загрузить обложку"));
        setCoverUrl(null);
        toast.success(t("Обложка убрана"));
      }
      // Не onSuccess: родитель по нему закрывает редактирование, а форма остаётся открытой.
      void mutate("/api/lists");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("Не удалось загрузить обложку"));
    } finally {
      setCoverBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError(t("Введите название подборки"));
      document.getElementById("list-name")?.focus();
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
              onChange={(e) => {
                setName(e.target.value);
                setNameError(null);
              }}
              placeholder={t("Например: День рождения")}
              aria-invalid={Boolean(nameError) || undefined}
              aria-describedby={nameError ? "list-name-error" : undefined}
              required
            />
            <FieldError id="list-name-error">{nameError}</FieldError>
          </div>

          {isEdit ? (
            <div className="space-y-2">
              <Label>{t("Обложка")}</Label>
              <div className="flex items-center gap-3">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-[14px] bg-[hsl(var(--surface-3))]">
                  {coverUrl ? (
                    <Image
                      src={coverUrl}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <ImagePlus
                      className="absolute inset-0 m-auto size-6 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" disabled={coverBusy} asChild>
                      <label className="cursor-pointer">
                        {coverBusy ? <Loader2 className="size-4 animate-spin" /> : null}
                        {coverUrl ? t("Сменить фото") : t("Выбрать фото")}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          disabled={coverBusy}
                          onChange={(e) => {
                            void changeCover(e.target.files?.[0] ?? null);
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </Button>
                    {coverUrl ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={coverBusy}
                        onClick={() => void changeCover(null)}
                      >
                        {t("Убрать обложку")}
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("Без обложки плитка собирается из фото желаний.")}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {otherUsers.length > 0 && (
            <div className="space-y-2">
              <Label>{t("Кто увидит подборку")}</Label>
              {isEdit ? (
                <div className="rounded-lg border border-border bg-card p-2">
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
                        ? "border-foreground bg-accent text-foreground"
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
              <Button type="submit" disabled={saving} status={saving ? "loading" : "idle"}>
                {isEdit ? t("Сохранить") : t("Создать")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
