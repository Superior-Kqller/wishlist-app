"use client";

import { PreferenceColorDot } from "@/components/preferences/preference-color-dot";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { preferenceHintLabels, type PreferenceHint } from "@/lib/preference-profiles";

export type PreferenceTone = "neutral" | "avoid";

/**
 * Форма значения предпочтения — одна на весь раздел.
 *
 * Значения раньше набирались обычным текстом через широкий пробел, и строка
 * «Футболка L обувь 42 кольцо 19» не делилась глазом: пробел между размерами
 * не отличался от пробела внутри размера. Граница чипа делит их сама.
 *
 * Ограничение отличается не сплошной красной краской по всему перечню, а
 * кромкой: смысл несёт раздел, в котором чип лежит («Не подойдёт»), а краска
 * лишь помогает выхватить его при беглом чтении.
 */
export function preferenceChipClass(tone: PreferenceTone) {
  return cn(
    "inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs leading-tight",
    tone === "avoid"
      ? "border-destructive/45 bg-destructive/8"
      : "border-border/55 bg-[hsl(var(--surface-3)/0.55)]",
  );
}

export function PreferenceValueChip({
  value,
  tone = "neutral",
  colorDot = false,
}: {
  value: string;
  tone?: PreferenceTone;
  colorDot?: boolean;
}) {
  const { t } = useI18n();

  return (
    <span className={preferenceChipClass(tone)}>
      {colorDot ? <PreferenceColorDot value={value} size="sm" /> : null}
      <span className="min-w-0 whitespace-normal text-foreground/90 [overflow-wrap:anywhere]">
        {t(value)}
      </span>
    </span>
  );
}

/**
 * Подсказка свёрнутой карточки: значение вместе со своим родом.
 *
 * Перечень «Книги, Бег, Moleskine, Шерсть, Кофе» сваливал в одну строку
 * категорию, интерес, бренд и материал. Даритель читает их по-разному, и
 * теперь род стоит рядом со значением, а не подразумевается.
 */
export function PreferenceHintChip({
  hint,
  tone = "neutral",
}: {
  hint: PreferenceHint;
  tone?: PreferenceTone;
}) {
  const { t } = useI18n();
  const kindLabel = preferenceHintLabels[hint.kind];

  return (
    <span className={preferenceChipClass(tone)}>
      {hint.kind === "color" ? <PreferenceColorDot value={hint.value} size="sm" /> : null}
      {kindLabel ? (
        <span className="shrink-0 text-[11px] text-muted-foreground">{t(kindLabel)}</span>
      ) : null}
      <span className="min-w-0 whitespace-normal text-foreground/90 [overflow-wrap:anywhere]">
        {t(hint.value)}
      </span>
    </span>
  );
}
