"use client";

import {
  CheckCircle2,
  Clock3,
  Package,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  WalletCards,
  X,
} from "lucide-react";
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
    { label: t("Всего"), value: summary.total, icon: Package },
    { label: t("Доступно"), value: summary.available, icon: CheckCircle2 },
    { label: t("Забронировано"), value: summary.claimed, icon: Clock3 },
    { label: t("Куплено"), value: summary.purchased, icon: ShoppingBag },
    { label: t("Общая стоимость"), value: formattedValue, icon: WalletCards },
  ];

  return (
    <section className={`${uiSurface.homeSummary} h-full rounded-xl px-2.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3.5`}>
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
        <div className="min-w-0 space-y-1">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary/90" />
            {eyebrow}
          </p>
          <h1 className="text-[1.35rem] font-semibold leading-[1.12] tracking-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("Ваши желания в одном месте. Выбирайте, бронируйте и отмечайте покупки.")}
          </p>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          {metrics.map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="relative h-16 rounded-lg border border-border/28 bg-[hsl(var(--surface-3))/0.72] px-3.5 py-3 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.03)]"
            >
              <p className="text-[11px] font-medium leading-none text-muted-foreground/78">{label}</p>
              <p className="mt-1.5 text-[1.35rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
                {value}
              </p>
              <span className="absolute right-3 top-2.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-primary/18 bg-primary/12 text-primary/85">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            </div>
          ))}
        </div>
      </div>

      {filterChips.length > 0 ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
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
