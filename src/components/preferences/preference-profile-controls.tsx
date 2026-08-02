"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { PreferenceProfileFilter, PreferenceProfileSort } from "@/lib/preference-profiles";

const filterOptions: Array<{ id: PreferenceProfileFilter; label: string }> = [
  { id: "all", label: "Все" },
  { id: "filled", label: "Заполненные" },
  { id: "sizes", label: "С размерами" },
  { id: "avoid", label: "Со стоп-листом" },
];

const sortOptions: Array<{ id: PreferenceProfileSort; label: string }> = [
  { id: "filled", label: "По заполненности" },
  { id: "wishes", label: "По желаниям" },
  { id: "name", label: "По имени" },
];

type PreferenceProfileControlsProps = {
  filter: PreferenceProfileFilter;
  sort: PreferenceProfileSort;
  search: string;
  counts: Record<PreferenceProfileFilter, number>;
  resultCount: number;
  onFilterChange: (filter: PreferenceProfileFilter) => void;
  onSortChange: (sort: PreferenceProfileSort) => void;
  onSearchChange: (search: string) => void;
};

export function PreferenceProfileControls({
  filter,
  sort,
  search,
  counts,
  resultCount,
  onFilterChange,
  onSortChange,
  onSearchChange,
}: PreferenceProfileControlsProps) {
  const { t } = useI18n();

  return (
    <div className="rounded-xl border border-border/56 bg-[hsl(var(--surface-2)/0.7)] p-3 sm:p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("Найти по имени или логину")}
            aria-label={t("Поиск профилей")}
            className="h-11 border-border/56 bg-background/72 pl-9 pr-10 sm:h-10"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={t("Очистить поиск")}
              className="absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <label className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground lg:w-52">
          <span className="shrink-0">{t("Сначала")}</span>
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as PreferenceProfileSort)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-border/56 bg-background/72 px-3 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-10"
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {t(option.label)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-3 border-t border-border/44 pt-3">
        <div className="mb-2 flex items-center justify-between gap-3 px-0.5">
          <p className="text-xs font-semibold text-muted-foreground">{t("Показывать")}</p>
          <p className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
            {t("Найдено")}: {resultCount}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
          {filterOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={filter === option.id}
              onClick={() => onFilterChange(option.id)}
              className={cn(
                "flex min-h-10 items-center justify-between gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-[color,background-color,border-color,transform] active:scale-[0.98] sm:min-h-9 sm:shrink-0 sm:justify-start",
                filter === option.id
                  ? "border-primary/38 bg-primary/13 text-foreground"
                  : "border-border/48 bg-background/48 text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <span>{t(option.label)}</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[10px] tabular-nums",
                  filter === option.id ? "bg-primary/13 text-primary" : "bg-muted/72",
                )}
              >
                {counts[option.id]}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
