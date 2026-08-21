"use client";

import type { LucideIcon } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { PreferenceColorDot } from "@/components/preferences/preference-color-dot";
import { cn } from "@/lib/utils";

export type PreferenceSignalRowProps = {
  icon: LucideIcon;
  label: string;
  values: string[];
  empty?: string;
  warning?: boolean;
  accent?: "primary" | "danger" | "warning" | "muted";
  limit?: number;
  compact?: boolean;
  colorDots?: boolean;
};

function getIconColor(accent: PreferenceSignalRowProps["accent"], warning: boolean) {
  if (warning || accent === "danger") return "text-destructive";
  if (accent === "warning") return "text-warning";
  if (accent === "muted") return "text-muted-foreground";
  // `--primary-accent`, а не `--primary`: фирменная краска подобрана под
  // заливку кнопки и в тёмно-винной теме как цвет значка неразличима.
  return "text-primary-accent";
}

export function PreferenceSignalRow({
  icon: Icon,
  label,
  values,
  empty = "Не указано",
  warning = false,
  accent = "primary",
  limit,
  compact = false,
  colorDots = false,
}: PreferenceSignalRowProps) {
  const { t } = useI18n();
  const normalizedValues = values.filter(Boolean);
  const visibleValues = limit ? normalizedValues.slice(0, limit) : normalizedValues;
  const hiddenCount = Math.max(0, normalizedValues.length - visibleValues.length);

  return (
    <div
      role="group"
      aria-label={t(label)}
      className={cn(
        "grid min-w-0 border-t border-border/32 first:border-t-0",
        compact
          ? "grid-cols-1 gap-1 py-1.5"
          : "grid-cols-[minmax(5.5rem,0.42fr)_minmax(0,1fr)] gap-3 py-2.5",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5 self-start pt-0.5">
        <Icon
          className={cn(
            compact ? "h-3.5 w-3.5" : "h-4 w-4",
            "shrink-0",
            getIconColor(accent, warning),
          )}
          aria-hidden
        />
        <span className="min-w-0 text-xs font-semibold text-muted-foreground">{t(label)}</span>
      </div>
      {visibleValues.length > 0 ? (
        <div className="flex min-w-0 flex-wrap items-start gap-x-2 gap-y-1 text-xs font-medium leading-relaxed text-foreground/85">
          {visibleValues.map((value) => (
            <span key={value} className="inline-flex max-w-full min-w-0 items-start gap-1">
              {colorDots ? <PreferenceColorDot value={value} size="sm" /> : null}
              <span className="min-w-0 whitespace-normal [overflow-wrap:anywhere]">{t(value)}</span>
            </span>
          ))}
          {hiddenCount > 0 ? <span className="text-muted-foreground">+{hiddenCount}</span> : null}
        </div>
      ) : (
        <span className="truncate text-sm text-muted-foreground-subtle">{t(empty)}</span>
      )}
    </div>
  );
}
