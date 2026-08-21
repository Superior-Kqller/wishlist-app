"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/language-provider";
import { PreferenceColorDot } from "@/components/preferences/preference-color-dot";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";

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
    <section className="space-y-4 rounded-2xl border border-border/55 bg-[hsl(var(--surface-2)/0.7)] p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{t(title)}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(description)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleSuggestions.map((suggestion) => {
          const active = selectedKeys.has(normalizeKey(suggestion.label));
          return (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => toggleValue(suggestion.label)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 sm:min-h-10 text-sm font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98]",
                uiState.focusRing,
                active
                  ? warning
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-primary-accent bg-primary/16 text-foreground"
                  : "border-border/55 bg-[hsl(var(--surface-3)/0.45)] text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground",
              )}
            >
              {suggestion.color ? <PreferenceColorDot value={suggestion.label} size="md" /> : null}
              {t(suggestion.label)}
              {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
            </button>
          );
        })}
        {hiddenSuggestionCount > 0 ? (
          <button
            type="button"
            onClick={() => setShowAllSuggestions(true)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-3 sm:min-h-10 text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline",
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
          disabled={value.length >= max}
          className="min-w-0 border-border/55 bg-[hsl(var(--surface-3)/0.55)]"
          aria-label={t("Добавить свой вариант")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={addCustomValue}
          disabled={!customValue.trim() || value.length >= max}
          aria-label={t("Добавить")}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
        </Button>
      </div>

      <div className="min-h-7">
        <AnimatePresence initial={false} mode="popLayout">
          {value.length > 0 ? (
            <motion.div key="values" layout={!reduceMotion} className="flex flex-wrap gap-1.5">
              {value.map((item) => (
                <motion.button
                  layout={!reduceMotion}
                  key={normalizeKey(item)}
                  type="button"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.16 }}
                  onClick={() => toggleValue(item)}
                  className={cn(
                    "inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-full border px-2.5 sm:min-h-9 text-xs font-semibold transition-colors hover:bg-accent",
                    uiState.focusRing,
                    warning
                      ? "border-destructive/32 bg-destructive/10 text-destructive"
                      : "border-primary/32 bg-primary/10 text-foreground/85",
                  )}
                  aria-label={`${t("Убрать")}: ${t(item)}`}
                >
                  <span className="truncate">{t(item)}</span>
                  <X className="h-3 w-3 shrink-0" aria-hidden />
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground-subtle"
            >
              {t("Пока ничего не выбрано")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
