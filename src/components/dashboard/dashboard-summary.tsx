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
  const availablePercent =
    summary.total > 0 ? Math.round((summary.available / summary.total) * 100) : 0;
  const claimedPercent =
    summary.total > 0 ? Math.round((summary.claimed / summary.total) * 100) : 0;
  const purchasedPercent =
    summary.total > 0 ? Math.max(0, 100 - availablePercent - claimedPercent) : 0;
  const distribution = [
    { label: t("Доступно"), value: availablePercent, className: "bg-info" },
    { label: t("Забронировано"), value: claimedPercent, className: "bg-warning" },
    { label: t("Куплено"), value: purchasedPercent, className: "bg-success" },
  ];
  const metrics = [
    {
      label: t("Всего"),
      value: summary.total,
      icon: Package,
      tone: "border-primary/24 bg-primary/12 text-primary",
    },
    {
      label: t("Доступно"),
      value: summary.available,
      icon: CheckCircle2,
      tone: "border-info/28 bg-info/10 text-info",
    },
    {
      label: t("Забронировано"),
      value: summary.claimed,
      icon: Clock3,
      tone: "border-warning/30 bg-warning/10 text-warning",
    },
    {
      label: t("Куплено"),
      value: summary.purchased,
      icon: ShoppingBag,
      tone: "border-success/28 bg-success/10 text-success",
    },
    {
      label: t("Общая стоимость"),
      value: formattedValue,
      icon: WalletCards,
      tone: "border-border/42 bg-[hsl(var(--surface-4))/0.58] text-foreground",
    },
  ];

  return (
    <section className={`${uiSurface.homeSummary} h-full rounded-xl px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4`}>
      <div className="sm:hidden">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary/90" />
          {eyebrow}
        </p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="shrink-0 rounded-full border border-primary/26 bg-primary/14 px-2.5 py-1 text-sm font-semibold tabular-nums text-primary-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]">
            {formattedValue}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {summary.total} {t("Всего").toLowerCase()} · {summary.available} {t("Доступно").toLowerCase()}
          {summary.claimed > 0 ? ` · ${summary.claimed} ${t("Забронировано").toLowerCase()}` : ""}
          {summary.purchased > 0 ? ` · ${summary.purchased} ${t("Куплено").toLowerCase()}` : ""}
        </p>
        {summary.total > 0 ? (
          <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[hsl(var(--surface-1))/0.86]">
            {distribution.map((segment) =>
              segment.value > 0 ? (
                <span
                  key={segment.label}
                  className={segment.className}
                  style={{ width: `${segment.value}%` }}
                  aria-hidden
                />
              ) : null,
            )}
          </div>
        ) : null}
      </div>

      <div className="hidden h-full min-w-0 flex-col sm:flex">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0 space-y-1.5">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary/90" />
              {eyebrow}
            </p>
            <h1 className="text-[1.65rem] font-semibold leading-[1.08] tracking-tight text-foreground lg:text-[1.9rem]">
              {title}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {t("Ваши желания в одном месте. Выбирайте, бронируйте и отмечайте покупки.")}
            </p>
          </div>
          <div className="min-w-[9.5rem] rounded-2xl border border-primary/22 bg-primary/12 px-4 py-3 text-right shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]">
            <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
              {t("Общая стоимость")}
            </p>
            <p className="mt-1 text-2xl font-semibold leading-none tabular-nums text-primary-foreground">
              {formattedValue}
            </p>
          </div>
        </div>

        {summary.total > 0 ? (
          <div className="mt-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-1))/0.88] shadow-[inset_0_1px_2px_rgba(0,0,0,0.32)]">
              {distribution.map((segment) =>
                segment.value > 0 ? (
                  <span
                    key={segment.label}
                    className={segment.className}
                    style={{ width: `${segment.value}%` }}
                    aria-hidden
                  />
                ) : null,
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {distribution.map((segment) => (
                <span key={segment.label} className="inline-flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${segment.className}`} aria-hidden />
                  {segment.label}: {segment.value}%
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
          {metrics.map(({ label, value, icon: Icon, tone }) => (
            <div
              key={label}
              className="relative h-[4.5rem] rounded-xl border border-border/28 bg-[hsl(var(--surface-3))/0.64] px-3.5 py-3.5 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]"
            >
              <p className="text-[11px] font-medium leading-none text-muted-foreground/78">{label}</p>
              <p className="mt-2 text-[1.38rem] font-semibold leading-none tabular-nums tracking-tight text-foreground">
                {value}
              </p>
              <span className={`absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-full border ${tone}`}>
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
