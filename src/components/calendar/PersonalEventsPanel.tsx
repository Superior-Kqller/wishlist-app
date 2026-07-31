"use client";

import { useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { CalendarPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
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
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
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
  const { t } = useI18n();
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

  const remove = async (event: PersonalEventRecord) => {
    if (!window.confirm(t("Удалить событие «{title}»?").replace("{title}", event.title))) return;
    const response = await fetch(`/api/calendar/events/${event.id}`, { method: "DELETE" });
    if (!response.ok) {
      toast.error(t("Не удалось удалить событие"));
      return;
    }
    await refresh();
    toast.success(t("Событие удалено"));
  };

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
          <Button
            type="button"
            onClick={openCreate}
            disabled={!!error}
            className="max-sm:h-11 max-sm:px-3"
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/35 bg-destructive/8 px-4 py-3">
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
                    {event.date} · {event.recurrence === "YEARLY" ? t("Ежегодно") : t("Однократно")}
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
                  onClick={() => remove(event)}
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
              <label className="grid gap-2 text-sm font-medium">
                {t("Повторение")}
                <select
                  className="h-11 rounded-md border border-input bg-background px-3"
                  value={form.recurrence}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recurrence: event.target.value as PersonalEventRecurrence,
                    }))
                  }
                >
                  <option value="ONCE">{t("Однократно")}</option>
                  <option value="YEARLY">{t("Ежегодно")}</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                {t("Аудитория")}
                <select
                  className="h-11 rounded-md border border-input bg-background px-3"
                  value={form.audience}
                  onChange={(event) => setAudience(event.target.value as CalendarAudience)}
                >
                  <option value="ALL">{t("Всем")}</option>
                  <option value="SELECTED">{t("Выбранным")}</option>
                  <option value="PRIVATE">{t("Только мне")}</option>
                </select>
              </label>
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
                      <input
                        type="checkbox"
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
              </fieldset>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("Отмена")}
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving || !form.title.trim() || !form.date}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
              {editingId ? t("Сохранить") : t("Создать")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
