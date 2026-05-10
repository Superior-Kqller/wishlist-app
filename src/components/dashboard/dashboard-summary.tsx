"use client";

import { Sparkles, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/components/i18n/language-provider";
import { uiSurface } from "@/lib/ui-contract";

export type DashboardSummaryData = {
  total: number;
  available: number;
  claimed: number;
  purchased: number;
  totalValue: number;
};

export type DashboardFilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

type DashboardSummaryProps = {
  summary: DashboardSummaryData;
  eyebrow: string;
  title: string;
  filterChips: DashboardFilterChip[];
  onClearFilters: () => void;
};

export function DashboardSummary({
  summary,
  eyebrow,
  title,
  filterChips,
  onClearFilters,
}: DashboardSummaryProps) {
  const { t, locale } = useI18n();
  const formattedValue =
    summary.totalValue > 0
      ? `${Math.round(summary.totalValue).toLocaleString(locale)} ₽`
      : "—";
  const metrics = [
    [t("Всего"), summary.total],
    [t("Доступно"), summary.available],
    [t("Забронировано"), summary.claimed],
    [t("Куплено"), summary.purchased],
    [t("Общая стоимость"), formattedValue],
  ];

  return (
    <section className={`${uiSurface.homeSummary} h-full rounded-xl px-2.5 py-2.5 sm:rounded-2xl sm:px-5 sm:py-5`}>
      <div className="sm:hidden">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary/90" />
          {eyebrow}
        </p>
        <div className="mt-0.5 flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-primary-foreground">
            {formattedValue}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {summary.total} {t("Всего").toLowerCase()} · {summary.available} {t("Доступно").toLowerCase()}
          {summary.claimed > 0 ? ` · ${summary.claimed} ${t("Забронировано").toLowerCase()}` : ""}
          {summary.purchased > 0 ? ` · ${summary.purchased} ${t("Куплено").toLowerCase()}` : ""}
        </p>
      </div>

      <div className="hidden h-full min-w-0 flex-col sm:flex">
        <div className="min-w-0 space-y-2">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary/90" />
            {eyebrow}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("Ваши желания в одном месте. Выбирайте, бронируйте и отмечайте покупки.")}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
          {metrics.map(([label, value]) => (
            <div
              key={label}
              className="min-h-[4.5rem] rounded-xl border border-border/70 bg-[hsl(var(--surface-3))/0.58] p-3"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {filterChips.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
          {filterChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="outline"
              className={`group inline-flex items-center gap-1 ${uiSurface.chip} px-2 py-0.5 text-[11px] text-foreground sm:py-1`}
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/45"
                aria-label={`${t("Убрать фильтр")}: ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onClearFilters}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t("Сбросить всё")}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
