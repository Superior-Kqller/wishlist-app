"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/language-provider";

type PreferenceProfileSearchProps = {
  search: string;
  resultCount: number;
  onSearchChange: (search: string) => void;
};

/**
 * Один контрол вместо восьми.
 *
 * Над списком близких людей раньше стояла панель из двух ярусов: поиск,
 * сортировка на три варианта и четыре фильтра со счётчиками. Сортировка
 * «по заполненности» и фильтр «Заполненные» ранжировали родню по тому,
 * насколько подробно человек рассказал о себе. Порядок теперь один — по
 * имени, со своей карточкой впереди, а найти человека помогает поиск.
 */
export function PreferenceProfileSearch({
  search,
  resultCount,
  onSearchChange,
}: PreferenceProfileSearchProps) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1 sm:max-w-sm">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("Найти по имени или логину")}
          aria-label={t("Поиск профилей")}
          className="h-11 border-border/56 bg-background/72 pl-9 pr-12 sm:h-10 sm:pr-10"
        />
        {/* 44px на телефоне — тот же минимум, что держат все кнопки проекта;
            выше `sm` цель ужимается вместе с полем. */}
        {search ? (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            aria-label={t("Очистить поиск")}
            className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:right-1.5 sm:size-8"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Счётчик появляется только когда список действительно отфильтрован:
          «Найдено: 8» над восемью видимыми карточками — шум. */}
      <p className="min-h-5 shrink-0 text-xs tabular-nums text-muted-foreground" aria-live="polite">
        {search.trim() ? `${t("Найдено")}: ${resultCount}` : ""}
      </p>
    </div>
  );
}
