"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CalendarPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetcher } from "@/lib/fetcher";
import { capitalizeFirst, cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import type {
  CalendarAudience,
  PersonalEventRecord,
  PersonalEventInput,
  PersonalEventRecurrence,
} from "@/lib/calendar/personal-events";

interface AudienceUser {
  id: string;
  name: string;
}

const EMPTY_EVENT: PersonalEventInput = {
  title: "",
  description: null,
  date: "",
  recurrence: "ONCE",
  audience: "PRIVATE",
  selectedViewerIds: [],
};

export function PersonalEventsPanel() {
  const { t, locale } = useI18n();
  const { mutate } = useSWRConfig();
  const { data, isLoading, error } = useSWR<{ events: PersonalEventRecord[] }>(
    "/api/calendar/events",
    fetcher,
  );
  const { data: audienceData } = useSWR<{ users: AudienceUser[] }>(
    "/api/calendar/audience-options",
    fetcher,
  );
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PersonalEventInput>(EMPTY_EVENT);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PersonalEventRecord | null>(null);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_EVENT);
    setOpen(true);
  };

  const openEdit = (event: PersonalEventRecord) => {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description,
      date: event.date,
      recurrence: event.recurrence,
      audience: event.audience,
      selectedViewerIds: event.selectedViewerIds,
    });
    setOpen(true);
  };

  const refresh = async () => {
    await Promise.all([
      mutate("/api/calendar/events"),
      mutate((key) => typeof key === "string" && key.startsWith("/api/calendar?")),
    ]);
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        editingId ? `/api/calendar/events/${editingId}` : "/api/calendar/events",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("Не удалось сохранить событие"));
      await refresh();
      setOpen(false);
      toast.success(editingId ? t("Событие изменено") : t("Событие создано"));
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : t("Не удалось сохранить событие"),
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * Подтверждение — общий `ConfirmDialog` продукта, а не нативный
   * `window.confirm`: тот игнорирует тему и язык интерфейса и выглядит
   * системным предупреждением там, где речь про свою же годовщину.
   */
  const remove = async () => {
    if (!pendingDelete) return;
    const response = await fetch(`/api/calendar/events/${pendingDelete.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      toast.error(t("Не удалось удалить событие"));
      return;
    }
    await refresh();
    toast.success(t("Событие удалено"));
  };

  /*
   * «Выбранным» без единого отмеченного человека раньше сохранялось: событие
   * создавалось, не видел его никто, и об этом не сообщалось.
   */
  const audienceIsEmpty = form.audience === "SELECTED" && form.selectedViewerIds.length === 0;
  const canSubmit = Boolean(form.title.trim()) && Boolean(form.date) && !audienceIsEmpty;

  const setAudience = (audience: CalendarAudience) => {
    setForm((current) => ({
      ...current,
      audience,
      selectedViewerIds: audience === "SELECTED" ? current.selectedViewerIds : [],
    }));
  };

  return (
    <>
      <section className={cn(uiSurface.contentPanel, "p-3 sm:p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:items-start sm:gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold">{t("Мои личные события")}</h2>
            <p className="mt-1 text-sm text-muted-foreground max-sm:hidden">
              {t("Годовщины и другие важные даты с выбранной вами аудиторией")}
            </p>
          </div>
          {/* Вторичная кнопка: `default` на этой странице принадлежит переходу
              к вишлисту именинника, а не созданию своей годовщины. */}
          <Button
            type="button"
            variant="outline"
            onClick={openCreate}
            disabled={!!error}
            className="max-sm:px-3"
          >
            <CalendarPlus className="h-4 w-4 sm:mr-2" aria-hidden />
            <span className="max-sm:sr-only">{t("Добавить событие")}</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-4 flex min-h-20 items-center justify-center">
            <Loader2
              className="h-5 w-5 animate-spin text-muted-foreground"
              aria-label={t("Загрузка")}
            />
          </div>
        ) : error ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/32 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{t("Не удалось загрузить личные события")}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void refresh()}>
              {t("Повторить")}
            </Button>
          </div>
        ) : data?.events.length ? (
          <div className="mt-4 divide-y divide-border/55">
            {data.events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{event.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={event.date}>
                      {capitalizeFirst(
                        new Date(`${event.date}T12:00:00`).toLocaleDateString(locale, {
                          day: "numeric",
                          month: "long",
                          ...(event.recurrence === "YEARLY" ? {} : { year: "numeric" }),
                        }),
                        locale,
                      )}
                    </time>{" "}
                    · {event.recurrence === "YEARLY" ? t("Ежегодно") : t("Однократно")}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => openEdit(event)}
                  aria-label={t("Изменить событие")}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setPendingDelete(event)}
                  aria-label={t("Удалить событие")}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground sm:mt-4">
            {t("Личных событий пока нет")}
          </p>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("Изменить личное событие") : t("Новое личное событие")}
            </DialogTitle>
            <DialogDescription>
              {t("Событие увидят только пользователи из выбранной аудитории")}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event-title">{t("Название")}</Label>
              <Input
                id="event-title"
                maxLength={200}
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-date">{t("Дата")}</Label>
              <Input
                id="event-date"
                type="date"
                required
                value={form.date}
                onChange={(event) =>
                  setForm((current) => ({ ...current, date: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event-description">{t("Описание (необязательно)")}</Label>
              <Textarea
                id="event-description"
                maxLength={2000}
                value={form.description ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value || null }))
                }
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="personal-event-recurrence">{t("Повторение")}</Label>
                <Select
                  value={form.recurrence}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      recurrence: value as PersonalEventRecurrence,
                    }))
                  }
                >
                  <SelectTrigger id="personal-event-recurrence" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ONCE">{t("Однократно")}</SelectItem>
                    <SelectItem value="YEARLY">{t("Ежегодно")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="personal-event-audience">{t("Аудитория")}</Label>
                <Select
                  value={form.audience}
                  onValueChange={(value) => setAudience(value as CalendarAudience)}
                >
                  <SelectTrigger id="personal-event-audience" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("Всем")}</SelectItem>
                    <SelectItem value="SELECTED">{t("Выбранным")}</SelectItem>
                    <SelectItem value="PRIVATE">{t("Только мне")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.audience === "SELECTED" ? (
              <fieldset className="grid gap-2">
                <legend className="text-sm font-medium">{t("Кому показать")}</legend>
                <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {(audienceData?.users ?? []).map((user) => (
                    <label
                      key={user.id}
                      className="flex min-h-10 items-center gap-3 rounded-md px-2 hover:bg-accent"
                    >
                      <Checkbox
                        checked={form.selectedViewerIds.includes(user.id)}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            selectedViewerIds: event.target.checked
                              ? [...current.selectedViewerIds, user.id]
                              : current.selectedViewerIds.filter((id) => id !== user.id),
                          }))
                        }
                      />
                      <span className="text-sm">{user.name}</span>
                    </label>
                  ))}
                </div>
                {audienceIsEmpty ? (
                  <p className="text-sm text-destructive">
                    {t("Отметьте хотя бы одного человека, иначе событие не увидит никто.")}
                  </p>
                ) : null}
              </fieldset>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("Отмена")}
            </Button>
            <Button type="button" onClick={save} disabled={saving || !canSubmit}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {editingId ? t("Сохранить") : t("Создать")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={t("Удалить событие?")}
        description={pendingDelete ? `«${pendingDelete.title}»` : ""}
        confirmLabel={t("Удалить")}
        cancelLabel={t("Отмена")}
        variant="destructive"
        onConfirm={() => void remove()}
      />
    </>
  );
}
