"use client";

import { useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { Loader2, Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetcher } from "@/lib/utils";
import { uiLayout } from "@/lib/ui-contract";
import { getLanguageLocale } from "@/lib/i18n";
import { useI18n } from "@/components/i18n/language-provider";
import type { HolidayCatalogEntry } from "@/lib/calendar/holiday-catalog";
import type { HolidayRule } from "@/lib/calendar/holiday-rules";

type HolidayTheme = HolidayCatalogEntry["theme"];
type Occurrence = Extract<HolidayRule, { kind: "NTH_WEEKDAY" }>["occurrence"];

interface HolidayDraft {
  name: string;
  rule: HolidayRule;
  theme: HolidayTheme;
}

const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
/* Понедельник первым, как в сетке календаря; значения — `getUTCDay`: 0 — воскресенье. */
const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];
const OCCURRENCES: { value: Occurrence; label: string }[] = [
  { value: 1, label: "первая" },
  { value: 2, label: "вторая" },
  { value: 3, label: "третья" },
  { value: 4, label: "четвёртая" },
  { value: -1, label: "последняя" },
];
const NEW_HOLIDAY: HolidayDraft = {
  name: "",
  rule: { kind: "FIXED", month: 1, day: 1 },
  theme: null,
};

/* 2023 год: первое января — воскресенье, поэтому 1 + weekday даёт нужный день недели. */
function weekdayName(locale: string, weekday: number) {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2023, 0, 1 + weekday)),
  );
}

/** Приблизительное место правила в году — только для порядка строк. */
function ruleSortKey(rule: HolidayRule) {
  if (rule.kind === "FIXED") return rule.month * 100 + rule.day;
  const week = rule.occurrence < 0 ? 5 : rule.occurrence;
  return rule.month * 100 + (week - 1) * 7 + 1;
}

function monthName(locale: string, month: number) {
  return new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2028, month - 1, 1)),
  );
}

/* Родительный падеж месяца без числа: «октября» из «1 октября», «October» из «October 1». */
function monthInDate(locale: string, month: number) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", timeZone: "UTC" })
    .formatToParts(new Date(Date.UTC(2028, month - 1, 1)))
    .find((part) => part.type === "month")!.value;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function HolidayCatalog() {
  const { t, language } = useI18n();
  const locale = getLanguageLocale(language);
  const { data, mutate, isLoading } = useSWR<{ holidays: HolidayCatalogEntry[] }>(
    "/api/admin/holidays",
    fetcher,
  );
  /* `null` — окно закрыто, `"new"` — добавление, иначе правка праздника с этим id. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<HolidayDraft>(NEW_HOLIDAY);
  const [saving, setSaving] = useState(false);

  function describeRule(rule: HolidayRule) {
    if (rule.kind === "FIXED") {
      return new Intl.DateTimeFormat(locale, {
        day: "numeric",
        month: "long",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(2028, rule.month - 1, rule.day)));
    }
    const occurrence = OCCURRENCES.find((item) => item.value === rule.occurrence);
    return t("{weekday}, {ordinal} неделя {month}", {
      weekday: capitalize(weekdayName(locale, rule.weekday)),
      ordinal: occurrence ? t(occurrence.label) : String(rule.occurrence),
      month: monthInDate(locale, rule.month),
    });
  }

  function themeLabel(theme: HolidayTheme) {
    if (theme === "MALE") return t("Мужская");
    if (theme === "FEMALE") return t("Женская");
    return null;
  }

  function openEditor(holiday?: HolidayCatalogEntry) {
    setDraft(
      holiday ? { name: holiday.name, rule: holiday.rule, theme: holiday.theme } : NEW_HOLIDAY,
    );
    setEditing(holiday?.id ?? "new");
  }

  async function patch(id: string, input: Partial<HolidayCatalogEntry>) {
    const response = await fetch(`/api/admin/holidays/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      toast.error(t("Не удалось изменить праздник"));
      return false;
    }
    await mutate();
    return true;
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name || !editing) return;
    setSaving(true);
    try {
      if (editing === "new") {
        const response = await fetch("/api/admin/holidays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            name,
            enabled: true,
            remindersEnabled: true,
          }),
        });
        if (!response.ok) {
          toast.error(t("Не удалось добавить праздник"));
          return;
        }
        await mutate();
      } else if (!(await patch(editing, { ...draft, name }))) {
        return;
      }
      setEditing(null);
    } finally {
      setSaving(false);
    }
  }

  function setRuleKind(kind: HolidayRule["kind"]) {
    const month = draft.rule.month;
    setDraft({
      ...draft,
      rule: kind === "FIXED" ? { kind, month, day: 1 } : { kind, month, weekday: 0, occurrence: 1 },
    });
  }

  function setRuleField(field: "day" | "month" | "weekday" | "occurrence", value: number) {
    setDraft({ ...draft, rule: { ...draft.rule, [field]: value } as HolidayRule });
  }

  // По дате в году, а не по порядку добавления: «12 июня» стояло перед «1 июня».
  const holidays = [...(data?.holidays ?? [])].sort(
    (a, b) => ruleSortKey(a.rule) - ruleSortKey(b.rule) || a.name.localeCompare(b.name),
  );
  const rule = draft.rule;

  return (
    <section className="space-y-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-title">{t("Общие праздники")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("Локальный каталог для всех пользователей установки")}
          </p>
        </div>
        <Button variant="outline" onClick={() => openEditor()}>
          <Plus className="h-4 w-4" aria-hidden />
          {t("Добавить праздник")}
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("Загрузка…")}</p>
      ) : (
        /* Каталог читают глазами чаще, чем правят: строка — название, дата словами
           и два переключателя. Раньше каждый праздник был открытой формой в три
           яруса с полями «0 / -1 / 11», и пятнадцать праздников занимали пять экранов. */
        <ul className="divide-y divide-border/55 overflow-hidden rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.85)]">
          {holidays.map((holiday) => {
            const theme = themeLabel(holiday.theme);
            return (
              <li
                key={holiday.id}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-2.5 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
              >
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                    <span className="truncate">{holiday.name}</span>
                    {theme ? <Badge variant="outline">{theme}</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {describeRule(holiday.rule)}
                  </p>
                </div>
                <label className="col-span-2 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm md:col-span-1 md:min-h-9">
                  <Switch
                    checked={holiday.enabled}
                    onChange={(event) => void patch(holiday.id, { enabled: event.target.checked })}
                  />
                  <span className="md:w-20">
                    {t("Включён")}
                    <span className="sr-only">: {holiday.name}</span>
                  </span>
                </label>
                <label className="col-span-2 flex min-h-11 cursor-pointer items-center gap-2.5 text-sm md:col-span-1 md:min-h-9">
                  <Switch
                    checked={holiday.remindersEnabled}
                    disabled={!holiday.enabled}
                    onChange={(event) =>
                      void patch(holiday.id, { remindersEnabled: event.target.checked })
                    }
                  />
                  <span className="md:w-24">
                    {t("Напоминания")}
                    <span className="sr-only">: {holiday.name}</span>
                  </span>
                </label>
                <Button
                  variant="ghost"
                  size="icon"
                  className="col-start-2 row-start-1 md:col-start-auto md:row-start-auto"
                  aria-label={`${t("Изменить")}: ${holiday.name}`}
                  title={t("Изменить")}
                  onClick={() => openEditor(holiday)}
                >
                  <Pencil className="h-4 w-4" aria-hidden />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className={uiLayout.dialogForm}>
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? t("Новый праздник") : t("Изменить праздник")}
            </DialogTitle>
            <DialogDescription>
              {t("Дата повторяется каждый год. Праздник увидят все участники установки.")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={save} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="holiday-name">{t("Название праздника")}</Label>
              <Input
                id="holiday-name"
                value={draft.name}
                onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label id="holiday-rule-kind">{t("Как считается дата")}</Label>
              <div
                className={`${uiLayout.segmentBar} grid-cols-2`}
                role="radiogroup"
                aria-labelledby="holiday-rule-kind"
              >
                {(["FIXED", "NTH_WEEKDAY"] as const).map((kind) => (
                  <Button
                    key={kind}
                    type="button"
                    role="radio"
                    aria-checked={rule.kind === kind}
                    variant={rule.kind === kind ? "segmentActive" : "ghost"}
                    onClick={() => rule.kind !== kind && setRuleKind(kind)}
                  >
                    {kind === "FIXED" ? t("Число месяца") : t("День недели")}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {rule.kind === "FIXED" ? (
                <RuleSelect
                  label={t("Число")}
                  value={rule.day}
                  onChange={(value) => setRuleField("day", value)}
                  options={DAYS.map((day) => ({ value: day, label: String(day) }))}
                />
              ) : (
                <>
                  <RuleSelect
                    label={t("Неделя месяца")}
                    value={rule.occurrence}
                    onChange={(value) => setRuleField("occurrence", value)}
                    options={OCCURRENCES.map((item) => ({
                      value: item.value,
                      label: capitalize(t(item.label)),
                    }))}
                  />
                  <RuleSelect
                    label={t("День недели")}
                    value={rule.weekday}
                    onChange={(value) => setRuleField("weekday", value)}
                    options={WEEKDAYS.map((weekday) => ({
                      value: weekday,
                      label: capitalize(weekdayName(locale, weekday)),
                    }))}
                  />
                </>
              )}
              <RuleSelect
                label={t("Месяц")}
                value={rule.month}
                onChange={(value) => setRuleField("month", value)}
                options={MONTHS.map((month) => ({
                  value: month,
                  label: capitalize(monthName(locale, month)),
                }))}
              />
            </div>
            <p className="text-sm text-muted-foreground">{describeRule(rule)}</p>

            <RuleSelect
              label={t("Тематика")}
              value={draft.theme ?? "none"}
              onChange={(value) =>
                setDraft({ ...draft, theme: value === "none" ? null : (value as HolidayTheme) })
              }
              options={[
                { value: "none", label: t("Без тематики") },
                { value: "MALE", label: t("Мужская") },
                { value: "FEMALE", label: t("Женская") },
              ]}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {t("Отмена")}
              </Button>
              <Button type="submit" disabled={saving || !draft.name.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                {editing === "new" ? t("Добавить") : t("Сохранить")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function RuleSelect<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label>{label}</Label>
      <Select
        value={String(value)}
        onValueChange={(next) => onChange((typeof value === "number" ? Number(next) : next) as T)}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
