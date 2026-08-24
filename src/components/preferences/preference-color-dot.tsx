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
 * читались раздельно) и внешнее `--foreground/55`.
 *
 * Кольцо держит форму там, где её не держит сам образец. Против фона панели
 * оно даёт 3.81–5.46 во всех четырёх темах, и этого хватает тёмным оттенкам,
 * которые сливаются с тёмной поверхностью (`#292a2e` даёт 1.25–1.27). Светлые
 * оттенки в тёмных темах различимы сами (`#ece9e1` — 14.7–15.0), и там кольцо
 * от образца отделяется слабее порога (2.74–2.78) — но отделять его от
 * образца там и не нужно, нужно от фона.
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
