"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Eye, EyeOff, Gift, Loader2, Shuffle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n/language-provider";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { apiRequest } from "@/lib/response-error";
import type { SantaDrawView } from "@/lib/santa";
import { uiSurface } from "@/lib/ui-contract";
import { capitalizeFirst, cn, fetcher } from "@/lib/utils";
import { daysBetween } from "./UpcomingCalendarCard";

// Совпадает с SANTA_MIN_PARTICIPANTS: сам модуль тянет node:crypto и в браузер не идёт.
const MIN_PARTICIPANTS = 3;
const pillLinkClass =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const EMPTY_FORM = { title: "", eventDate: "", budget: "", participantIds: [] as string[] };

export function SantaPanel() {
  const { t, locale } = useI18n();
  const { data, isLoading, error, mutate } = useSWR<{ draws: SantaDrawView[] }>(
    "/api/santa",
    fetcher,
  );
  const { data: people } = useSWR<{ users: Array<{ id: string; name: string }> }>(
    "/api/calendar/audience-options",
    fetcher,
  );
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [includeMe, setIncludeMe] = useState(true);
  const [saving, setSaving] = useState(false);
  // Имя открывается по нажатию: календарь часто смотрят рядом с теми, кому готовят сюрприз.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<SantaDrawView | null>(null);

  const participantCount = form.participantIds.length + (includeMe ? 1 : 0);
  const tooFew = participantCount < MIN_PARTICIPANTS;
  const canSubmit = Boolean(form.title.trim()) && Boolean(form.eventDate) && !tooFew;

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, title: t("Тайный Санта") });
    setIncludeMe(true);
    setOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await apiRequest(
        "/api/santa",
        { method: "POST", body: { ...form, budget: form.budget || null, includeMe } },
        t("Не удалось провести жеребьёвку"),
      );
      await mutate();
      setOpen(false);
      toast.success(t("Жеребьёвка проведена"));
    } catch (saveError) {
      toast.error(
        saveError instanceof Error ? saveError.message : t("Не удалось провести жеребьёвку"),
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!pendingDelete) return;
    const response = await fetch(`/api/santa/${pendingDelete.id}`, { method: "DELETE" });
    setPendingDelete(null);
    if (!response.ok) {
      toast.error(t("Не удалось отменить жеребьёвку"));
      return;
    }
    await mutate();
    toast.success(t("Жеребьёвка отменена"));
  };

  const toggleReveal = (id: string) =>
    setRevealed((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const today = new Date().toLocaleDateString("sv-SE");
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  return (
    <>
      <section className={cn(uiSurface.contentPanel, "p-3 sm:p-5")}>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:items-start sm:gap-3">
          <div className="min-w-0">
            <h2 className="font-semibold">{t("Тайный Санта")}</h2>
            <p className="mt-1 text-sm text-muted-foreground max-sm:hidden">
              {t("Жеребьёвка: каждый узнаёт только своего поздравляемого")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openCreate}
            disabled={!!error}
            className="max-sm:px-3"
          >
            <Shuffle className="h-4 w-4 sm:mr-2" aria-hidden />
            <span className="max-sm:sr-only">{t("Провести жеребьёвку")}</span>
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/32 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{t("Не удалось загрузить жеребьёвки")}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => void mutate()}>
              {t("Повторить")}
            </Button>
          </div>
        ) : data?.draws.length ? (
          <div className="mt-4 divide-y divide-border">
            {data.draws.map((draw) => {
              const isRevealed = revealed.has(draw.id);
              return (
                <div key={draw.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{draw.title}</p>
                      <p className="text-sm tabular-nums text-muted-foreground">
                        <time dateTime={draw.eventDate}>
                          {capitalizeFirst(
                            new Date(`${draw.eventDate}T12:00:00`).toLocaleDateString(locale, {
                              day: "numeric",
                              month: "long",
                            }),
                            locale,
                          )}
                        </time>
                        {" · "}
                        {relative.format(daysBetween(today, draw.eventDate), "day")}
                        {draw.budget ? ` · ${draw.budget}` : null}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t("Участников")}: {draw.participantCount}
                        {draw.isOrganizer ? null : ` · ${t("Организатор")}: ${draw.organizerName}`}
                      </p>
                    </div>
                    {draw.isOrganizer ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(draw)}
                        aria-label={t("Отменить жеребьёвку")}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    ) : null}
                  </div>

                  {draw.receiver ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {isRevealed ? (
                        <>
                          <span className="inline-flex min-w-0 items-center gap-2 text-sm">
                            <span className="text-muted-foreground">{t("Вы дарите")}:</span>
                            <UserAvatar
                              avatarUrl={draw.receiver.avatarUrl}
                              name={draw.receiver.name}
                              userId={draw.receiver.id}
                              size="sm"
                            />
                            <span className="truncate font-semibold">{draw.receiver.name}</span>
                          </span>
                          <Link href={`/?userId=${draw.receiver.id}`} className={pillLinkClass}>
                            <Gift className="size-4" aria-hidden />
                            {t("Открыть вишлист")}
                          </Link>
                          <Link
                            href={`/preferences?userId=${draw.receiver.id}`}
                            className={pillLinkClass}
                          >
                            {t("Профиль")}
                          </Link>
                        </>
                      ) : null}
                      <Button
                        type="button"
                        variant={isRevealed ? "ghost" : "outline"}
                        size="sm"
                        onClick={() => toggleReveal(draw.id)}
                        aria-expanded={isRevealed}
                      >
                        {isRevealed ? (
                          <EyeOff className="mr-2 size-4" aria-hidden />
                        ) : (
                          <Eye className="mr-2 size-4" aria-hidden />
                        )}
                        {isRevealed ? t("Скрыть") : t("Показать, кому я дарю")}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t("Вы организатор и сами не участвуете")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-[hsl(var(--surface-3))] px-4 py-6 text-center text-sm text-muted-foreground">
            {t("Жеребьёвок пока нет")}
          </p>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Новая жеребьёвка")}</DialogTitle>
            <DialogDescription>
              {t(
                "Пары создаются сразу и не меняются. Каждый видит только своего поздравляемого — остальные пары не видит никто, даже вы.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="santa-title">{t("Название")}</Label>
              <Input
                id="santa-title"
                maxLength={200}
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({ ...current, title: event.target.value }))
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="santa-date">{t("Дата обмена подарками")}</Label>
                <Input
                  id="santa-date"
                  type="date"
                  required
                  value={form.eventDate}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, eventDate: event.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="santa-budget">{t("Бюджет (необязательно)")}</Label>
                <Input
                  id="santa-budget"
                  maxLength={100}
                  placeholder={t("до 2000 ₽")}
                  value={form.budget}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, budget: event.target.value }))
                  }
                />
              </div>
            </div>
            <fieldset className="grid gap-2">
              <legend className="text-sm font-medium">
                {t("Участники")}: {participantCount}
              </legend>
              <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border p-2">
                <label className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-accent sm:min-h-10">
                  <Checkbox
                    checked={includeMe}
                    onChange={(event) => setIncludeMe(event.target.checked)}
                  />
                  <span className="text-sm">{t("Я участвую")}</span>
                </label>
                {(people?.users ?? []).map((user) => (
                  <label
                    key={user.id}
                    className="flex min-h-11 items-center gap-3 rounded-lg px-2 hover:bg-accent sm:min-h-10"
                  >
                    <Checkbox
                      checked={form.participantIds.includes(user.id)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          participantIds: event.target.checked
                            ? [...current.participantIds, user.id]
                            : current.participantIds.filter((id) => id !== user.id),
                        }))
                      }
                    />
                    <span className="text-sm">{user.name}</span>
                  </label>
                ))}
              </div>
              {tooFew ? (
                <p className="text-sm text-muted-foreground">
                  {t("Нужно не меньше трёх участников")}
                </p>
              ) : null}
            </fieldset>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("Отмена")}
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={saving || !canSubmit}
              status={saving ? "loading" : "idle"}
            >
              {t("Разыграть")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
        title={t("Отменить жеребьёвку?")}
        description={
          pendingDelete ? `«${pendingDelete.title}». ${t("Пары пропадут у всех участников.")}` : ""
        }
        confirmLabel={t("Отменить жеребьёвку")}
        cancelLabel={t("Отмена")}
        variant="destructive"
        onConfirm={() => void remove()}
      />
    </>
  );
}
