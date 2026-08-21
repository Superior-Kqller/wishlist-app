"use client";

import { getPreferenceColor } from "@/lib/preference-colors";
import { cn } from "@/lib/utils";

const dotSizes = {
  sm: "size-2.5",
  md: "size-3.5",
  lg: "size-4",
} as const;

export type PreferenceColorDotProps = {
  value: string;
  size?: keyof typeof dotSizes;
  /** Разделять соседние кружки краской карточки, когда они идут внахлёст. */
  inset?: boolean;
  title?: string;
  className?: string;
};

/**
 * Образец цвета-предпочтения.
 *
 * Кружок раньше был написан трижды — в карточке, в строке сводки и в чипе
 * редактора, — и все три обводки были ниже порога: `/24` давало 1.4:1 в
 * светлой теме, `/16` — 1.2:1. Белый и чёрный на краях шкалы исчезали, а
 * цвет — единственный сигнал, который нечем передать словом кроме подписи.
 *
 * Здесь два кольца: внутреннее краской поверхности (чтобы соседние кружки
 * читались раздельно) и внешнее `--foreground/55` — оно и держит ≥3:1 в
 * каждой из четырёх тем, независимо от того, светлый оттенок или тёмный.
 */
export function PreferenceColorDot({
  value,
  size = "sm",
  inset = false,
  title,
  className,
}: PreferenceColorDotProps) {
  const hex = getPreferenceColor(value);
  if (!hex) return null;

  return (
    <span
      title={title}
      aria-hidden
      className={cn(
        "shrink-0 rounded-full ring-1 ring-foreground/55",
        dotSizes[size],
        inset && "ring-offset-1 ring-offset-[hsl(var(--surface-2))]",
        className,
      )}
      style={{ backgroundColor: hex }}
    />
  );
}
