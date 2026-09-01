"use client";

import { useI18n } from "@/components/i18n/language-provider";
import {
  PreferenceValueChip,
  type PreferenceTone,
} from "@/components/preferences/preference-hint-chip";
import { cn } from "@/lib/utils";

export type PreferenceSignalRowProps = {
  label: string;
  values: string[];
  empty?: string;
  tone?: PreferenceTone;
  limit?: number;
  compact?: boolean;
  colorDots?: boolean;
};

/**
 * Строка сводки: род подсказки слева, значения справа.
 *
 * Иконки у строк убраны. Их было три на девять строк, и шли они по кругу —
 * сердце у брендов, искра у цветов, подарок у категорий, снова сердце у
 * интересов, — то есть значок не сообщал ничего, кроме того, что строк
 * несколько. Роль группы называет её заголовок («Понравится», «Не подойдёт»,
 * «Детали»), и значок остался там — по одному на раздел.
 *
 * Ограничение больше не красится целиком в `--destructive`. Пять красных
 * строк подряд читались как отчёт об ошибках, хотя «шерсть колется» — это
 * рамка выбора, а не сбой. Теперь его несёт кромка чипа и заголовок раздела.
 */
export function PreferenceSignalRow({
  label,
  values,
  empty = "Не указано",
  tone = "neutral",
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
          ? "grid-cols-1 gap-1.5 py-2"
          : "grid-cols-[minmax(5.5rem,0.42fr)_minmax(0,1fr)] gap-3 py-2.5",
      )}
    >
      <span className="min-w-0 self-start pt-1 text-xs font-semibold text-muted-foreground">
        {t(label)}
      </span>
      {visibleValues.length > 0 ? (
        <div className="flex min-w-0 flex-wrap items-start gap-1.5">
          {visibleValues.map((value) => (
            <PreferenceValueChip key={value} value={value} tone={tone} colorDot={colorDots} />
          ))}
          {hiddenCount > 0 ? (
            <span className="self-center text-xs text-muted-foreground">+{hiddenCount}</span>
          ) : null}
        </div>
      ) : (
        <span className="truncate text-sm text-muted-foreground-subtle">{t(empty)}</span>
      )}
    </div>
  );
}
