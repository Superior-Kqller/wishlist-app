"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

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
  const selectedKeys = new Set(value.map(normalizeKey));

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
    <section className="space-y-4 rounded-2xl border border-border/50 bg-[hsl(var(--surface-2))/0.72] p-4 sm:p-5">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{t(title)}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(description)}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => {
          const active = selectedKeys.has(normalizeKey(suggestion.label));
          return (
            <button
              key={suggestion.label}
              type="button"
              onClick={() => toggleValue(suggestion.label)}
              aria-pressed={active}
              className={cn(
                "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                active
                  ? warning
                    ? "border-destructive/45 bg-destructive/12 text-destructive"
                    : "border-primary/45 bg-primary/14 text-foreground"
                  : "border-border/56 bg-[hsl(var(--surface-3))/0.5] text-muted-foreground hover:border-border hover:bg-accent/70 hover:text-foreground",
              )}
            >
              {suggestion.color ? (
                <span
                  className="size-3.5 rounded-full border border-foreground/15 shadow-[inset_0_0_0_1px_hsl(var(--background)/0.2)]"
                  style={{ backgroundColor: suggestion.color }}
                  aria-hidden
                />
              ) : null}
              {suggestion.label}
              {active ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
            </button>
          );
        })}
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
          className="min-w-0 border-border/56 bg-[hsl(var(--surface-3))/0.6]"
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
            <motion.div key="values" layout className="flex flex-wrap gap-1.5">
              {value.map((item) => (
                <motion.button
                  layout
                  key={normalizeKey(item)}
                  type="button"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.16 }}
                  onClick={() => toggleValue(item)}
                  className={cn(
                    "inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors hover:bg-accent",
                    warning
                      ? "border-destructive/32 bg-destructive/8 text-destructive"
                      : "border-primary/28 bg-primary/9 text-foreground/88",
                  )}
                  aria-label={`${t("Убрать")}: ${item}`}
                >
                  <span className="truncate">{item}</span>
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
              className="text-xs text-muted-foreground/74"
            >
              {t("Пока ничего не выбрано")}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
