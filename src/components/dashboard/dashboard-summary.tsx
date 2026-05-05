"use client";

import { Sparkles, RotateCcw, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  const formattedValue =
    summary.totalValue > 0
      ? `${Math.round(summary.totalValue).toLocaleString("ru-RU")} ₽`
      : "—";

  return (
    <section className={`${uiSurface.homeSummary} px-3 py-3 sm:px-6 sm:py-6`}>
      <div className="sm:hidden">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary/90" />
          {eyebrow}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="shrink-0 text-sm font-semibold tabular-nums text-primary-foreground">
            {formattedValue}
          </p>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {summary.total} всего · {summary.available} доступно
          {summary.claimed > 0 ? ` · ${summary.claimed} в брони` : ""}
          {summary.purchased > 0 ? ` · ${summary.purchased} куплено` : ""}
        </p>
      </div>

      <div className="hidden gap-6 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0 space-y-5">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary/90" />
              {eyebrow}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Ваши желания в одном месте. Выбирайте, бронируйте и отмечайте покупки.
            </p>
          </div>

          <div className="grid max-w-3xl grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Всего", summary.total],
              ["Доступно", summary.available],
              ["Забронировано", summary.claimed],
              ["Куплено", summary.purchased],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border/70 bg-[hsl(var(--surface-2))/0.62] p-4"
              >
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-primary/25 bg-primary/10 px-6 py-4 text-right shadow-[0_0_24px_hsl(var(--primary)/0.1)]">
          <p className="text-[11px] uppercase tracking-wide text-primary-foreground/80">
            Ориентировочная стоимость
          </p>
          <p className="text-xl font-semibold text-primary-foreground">
            {formattedValue}
          </p>
        </div>
      </div>

      {filterChips.length > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {filterChips.map((chip) => (
            <Badge
              key={chip.key}
              variant="outline"
              className={`group inline-flex items-center gap-1 ${uiSurface.chip} px-2 py-1 text-[11px] text-foreground`}
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/45"
                aria-label={`Убрать фильтр: ${chip.label}`}
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
            Сбросить всё
          </Button>
        </div>
      ) : null}
    </section>
  );
}
