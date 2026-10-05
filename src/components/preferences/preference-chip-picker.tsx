"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/language-provider";
import { PreferenceColorDot } from "@/components/preferences/preference-color-dot";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";
import { duration, easing } from "@/lib/motion";

export type PreferenceSuggestion = {
  label: string;
  color?: string;
};

type PreferenceChipPickerProps = {
  title: string;
  description: string;
  value: string[];
  suggestions: PreferenceSuggestion[];
  placeholder: string;
  max: number;
  warning?: boolean;
  onChange: (value: string[]) => void;
};

const SUGGESTION_PREVIEW_COUNT = 12;

/**
 * Галочка отмеченного чипа — Selector Chips (21st.dev, preetsuthar17): галочка
 * появляется и штрих прорисовывается. Пружины исходника заменены на `expo`
 * без перелёта, оранжевая заливка — на рамку чернилами (DESIGN.md → «Чипы»).
 * Ширину исходник анимировал — это свойство раскладки; место под галочку здесь
 * встаёт сразу, а движение идёт только через transform, прозрачность и штрих.
 */
export function ChipTick({ shown }: { shown: boolean }) {
  const reduceMotion = useReducedMotion();
  // `initial={false}`: уже отмеченные при загрузке чипы не анимируются.
  return (
    <AnimatePresence initial={false}>
      {shown ? (
        <motion.svg
          key="tick"
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          className="-mr-1 ml-1.5 size-4 shrink-0"
          initial={reduceMotion ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: duration.base, ease: easing.expo }}
        >
          <motion.path
            d="M5 10.5L9 14.5L15 7.5"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.25, ease: easing.expo }}
          />
        </motion.svg>
      ) : null}
    </AnimatePresence>
  );
}

/**
 * Choice Chips (kinetics, select(pop)): на каждом переключении чип коротко
 * вырастает до 1.12 и пружиной возвращается. Класс `.pop` исходника держим
 * 150мс — ровно на разгон пружины.
 */
export function popChip(element: HTMLElement) {
  element.dataset.pop = "";
  setTimeout(() => delete element.dataset.pop, 150);
}

/** Чип-переключатель анкеты: неактивный — волосяная рамка, отмеченный — 2px чернилами. */
export function chipToggleClass(active: boolean, warning = false) {
  return cn(
    "chip-pop inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium transition-[color,background-color,border-color,box-shadow] duration-fast sm:min-h-10",
    uiState.focusRing,
    active ? (warning ? uiState.chipCheckedDanger : uiState.chipChecked) : uiState.chipIdle,
  );
}

function normalizeKey(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU");
}

export function PreferenceChipPicker({
  title,
  description,
  value,
  suggestions,
  placeholder,
  max,
  warning = false,
  onChange,
}: PreferenceChipPickerProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [customValue, setCustomValue] = useState("");
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);
  const selectedKeys = new Set(value.map(normalizeKey));
  const suggestionKeys = new Set(suggestions.map((item) => normalizeKey(item.label)));
  /*
   * Выбранный пресет живёт в одном месте — в самом пресете, отмеченном
   * галочкой. Раньше он показывался дважды: «Бордовый ✓» в ряду подсказок
   * и «Бордовый ×» ниже, и у одного значения было две разные механики
   * снятия. Внизу остаётся только то, чего в подсказках нет, — набранное
   * руками, рядом с полем, где его набрали.
   */
  const customValues = value.filter((item) => !suggestionKeys.has(normalizeKey(item)));
  const limitReached = value.length >= max;

  /*
   * Подсказок в одном разделе набиралось до 28 на пикер и до 79 на экран —
   * это читается как тест, а не как разговор. Показываем первую дюжину плюс
   * всё уже выбранное, остальное — по запросу.
   */
  const visibleSuggestions =
    showAllSuggestions || suggestions.length <= SUGGESTION_PREVIEW_COUNT
      ? suggestions
      : suggestions.filter(
          (suggestion, index) =>
            index < SUGGESTION_PREVIEW_COUNT || selectedKeys.has(normalizeKey(suggestion.label)),
        );
  const hiddenSuggestionCount = suggestions.length - visibleSuggestions.length;

  const toggleValue = (nextValue: string) => {
    const key = normalizeKey(nextValue);
    if (!key) return;
    if (selectedKeys.has(key)) {
      onChange(value.filter((item) => normalizeKey(item) !== key));
      return;
    }
    if (value.length >= max) return;
    onChange([...value, nextValue.trim()]);
  };

  const addCustomValue = () => {
    const nextValue = customValue.trim();
    if (!nextValue) return;
    if (selectedKeys.has(normalizeKey(nextValue))) {
      setCustomValue("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, nextValue]);
    setCustomValue("");
  };

  return (
    <section className="min-w-0 space-y-4">
      <div>
        <h3 className="text-base font-semibold">{t(title)}</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(description)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleSuggestions.map((suggestion) => {
          const active = selectedKeys.has(normalizeKey(suggestion.label));
          return (
            <button
              key={suggestion.label}
              type="button"
              onClick={(event) => {
                popChip(event.currentTarget);
                toggleValue(suggestion.label);
              }}
              aria-pressed={active}
              className={cn(chipToggleClass(active, warning), suggestion.color && "gap-2 pl-3")}
            >
              {suggestion.color ? (
                <PreferenceColorDot value={suggestion.label} size="md" className="swatch-pop" />
              ) : null}
              {t(suggestion.label)}
              <ChipTick shown={active} />
            </button>
          );
        })}
        {hiddenSuggestionCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowAllSuggestions(true)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3 sm:min-h-10 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors duration-base hover:text-foreground hover:underline",
              uiState.focusRing,
            )}
          >
            {t("Показать все")} · {hiddenSuggestionCount}
          </button>
        ) : null}
      </div>

      <div className="flex gap-2">
        <Input
          value={customValue}
          onChange={(event) => setCustomValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addCustomValue();
          }}
          placeholder={t(placeholder)}
          maxLength={100}
          disabled={limitReached}
          className="min-w-0"
          aria-label={t("Добавить свой вариант")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addCustomValue}
          disabled={!customValue.trim() || limitReached}
          aria-label={t("Добавить")}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      {limitReached ? (
        <p className="text-xs text-muted-foreground">
          {t("Больше не поместится")} · {max}. {t("Уберите одно, чтобы добавить другое.")}
        </p>
      ) : null}

      <div className="min-h-7" aria-label={t("Свои варианты")} role="group">
        <AnimatePresence initial={false} mode="popLayout">
          {customValues.length > 0 ? (
            <motion.div key="values" layout={!reduceMotion} className="flex flex-wrap gap-1.5">
              {customValues.map((item) => (
                <motion.button
                  layout={!reduceMotion}
                  key={normalizeKey(item)}
                  type="button"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: duration.fast }}
                  onClick={() => toggleValue(item)}
                  className={cn(
                    "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium sm:min-h-10",
                    uiState.focusRing,
                    warning ? uiState.chipCheckedDanger : uiState.chipChecked,
                  )}
                  aria-label={`${t("Убрать")}: ${t(item)}`}
                >
                  <span className="truncate">{t(item)}</span>
                  <X className="h-3 w-3 shrink-0" aria-hidden />
                </motion.button>
              ))}
            </motion.div>
          ) : value.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground-subtle"
            >
              {t("Пока ничего не выбрано")}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
