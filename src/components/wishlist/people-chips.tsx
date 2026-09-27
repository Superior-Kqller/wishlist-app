"use client";

import { Users } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { daysBetween, useUpcomingOccurrences } from "@/components/calendar/UpcomingCalendarCard";
import { useI18n } from "@/components/i18n/language-provider";
import { uiState } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";
import type { UserWithStats } from "@/types";

type PeopleChipsProps = {
  currentUserId: string;
  users: UserWithStats[];
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  className?: string;
};

/**
 * «Чей список» — рядом лиц, а не пунктом в панели фильтров.
 *
 * Переключаться между людьми — главное, что делают на главной перед
 * праздником, а на телефоне это пряталось за кнопкой фильтров, двумя
 * касаниями и закрытием панели. Ряд прокручивается вбок; подборки остались
 * в фильтрах — их меняют реже.
 */
export function PeopleChips({
  currentUserId,
  users,
  selectedUserId,
  onUserChange,
  className,
}: PeopleChipsProps) {
  const { t, locale } = useI18n();
  const { data: calendar, today } = useUpcomingOccurrences();
  /*
   * Ближайший день рождения — прямо на чипе человека. Перед праздником
   * вопрос «кому скоро» важнее «кто вообще есть», и ответ должен стоять
   * рядом с лицом, а не в отдельном разделе. Горизонт — месяц: дальше
   * дата уже не повод открыть список сегодня.
   */
  const birthdaySoon = new Map<string, string>();
  for (const occurrence of calendar?.occurrences ?? []) {
    if (occurrence.type !== "BIRTHDAY" || birthdaySoon.has(occurrence.person.id)) continue;
    const days = daysBetween(today, occurrence.date);
    if (days < 0 || days > 30) continue;
    birthdaySoon.set(
      occurrence.person.id,
      days === 0
        ? t("сегодня")
        : new Date(`${occurrence.date}T12:00:00`).toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          }),
    );
  }
  const isMine = selectedUserId === "me" || selectedUserId === currentUserId;
  const me = users.find((user) => user.id === currentUserId);

  const chips = [
    { key: "all", value: null, label: t("Все"), selected: !selectedUserId, user: undefined },
    { key: "me", value: "me", label: t("Мои"), selected: isMine, user: me },
    ...users
      .filter((user) => user.id !== currentUserId)
      .map((user) => ({
        key: user.id,
        value: user.id,
        label: user.name,
        selected: selectedUserId === user.id,
        user,
      })),
  ];

  return (
    <div
      role="group"
      aria-label={t("Чей список")}
      className={cn("scrollbar-none flex gap-2 overflow-x-auto", className)}
    >
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          aria-pressed={chip.selected}
          onClick={() => onUserChange(chip.value)}
          data-testid={`people-chip-${chip.key}`}
          className={cn(
            "flex min-h-11 max-w-[15rem] shrink-0 items-center gap-2 rounded-full border py-1 pl-1.5 pr-3.5 text-sm font-semibold transition-colors",
            uiState.focusRing,
            chip.selected ? uiState.chipSelected : uiState.chipIdle,
          )}
        >
          {chip.user ? (
            <span className="pointer-events-none shrink-0">
              <UserAvatar
                avatarUrl={chip.user.avatarUrl}
                name={chip.user.name}
                userId={chip.user.id}
                size="md"
              />
            </span>
          ) : (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--surface-4))]">
              <Users className="size-4" aria-hidden />
            </span>
          )}
          <span className="truncate">{chip.label}</span>
          {chip.user && chip.key !== "me" && birthdaySoon.has(chip.user.id) ? (
            <span className="shrink-0 text-xs font-medium text-primary-accent">
              <span className="sr-only">{t("День рождения")}: </span>
              {birthdaySoon.get(chip.user.id)}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
