"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CircleDollarSign, Heart, Ruler, ShieldAlert, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/language-provider";
import {
  PreferenceChipPicker,
  type PreferenceSuggestion,
} from "@/components/preferences/preference-chip-picker";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { SIZES_MAX_LENGTH, type GiftPreferences } from "@/lib/preferences";
import {
  composeSizePreferences,
  hasPresetToken,
  parseSizePreferences,
  sizeCategories,
  togglePresetToken,
  type SizeCategoryId,
} from "@/lib/preference-sizes";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export type EditorSection = "likes" | "avoid" | "details";
export type ListPreferenceKey = {
  [Key in keyof GiftPreferences]: GiftPreferences[Key] extends string[] ? Key : never;
}[keyof GiftPreferences];

const colorSuggestions: PreferenceSuggestion[] = [
  { label: "Розовый", color: "#e7a6b8" },
  { label: "Красный", color: "#c75b64" },
  { label: "Бордовый", color: "#8f3e4b" },
  { label: "Оранжевый", color: "#d78a4d" },
  { label: "Жёлтый", color: "#d8b84a" },
  { label: "Зелёный", color: "#6f9b76" },
  { label: "Хаки", color: "#7b7d57" },
  { label: "Мятный", color: "#8bbfaf" },
  { label: "Голубой", color: "#77aabd" },
  { label: "Синий", color: "#56789f" },
  { label: "Фиолетовый", color: "#8c729c" },
  { label: "Лавандовый", color: "#b5a6cf" },
  { label: "Белый", color: "#ece9e1" },
  { label: "Молочный", color: "#f1eadc" },
  { label: "Бежевый", color: "#cdbb9f" },
  { label: "Коричневый", color: "#80604d" },
  { label: "Серый", color: "#8c9097" },
  { label: "Графитовый", color: "#454a52" },
  { label: "Серебристый", color: "#b8bdc4" },
  { label: "Деним", color: "#4f6787" },
  { label: "Чёрный", color: "#292a2e" },
];

const materialSuggestions: PreferenceSuggestion[] = [
  "Хлопок",
  "Лён",
  "Шерсть",
  "Кожа",
  "Серебро",
  "Золото",
  "Керамика",
  "Дерево",
].map((label) => ({ label }));

const categorySuggestions: PreferenceSuggestion[] = PRODUCT_CATEGORIES.map((category) => ({
  label: category.label,
}));

const brandSuggestions: PreferenceSuggestion[] = [
  "Apple",
  "Samsung",
  "Sony",
  "Dyson",
  "Nintendo",
  "LEGO",
  "Muji",
  "Uniqlo",
  "Zara",
  "H&M",
  "Lime",
  "12 Storeez",
  "Befree",
  "Nike",
  "Adidas",
  "Puma",
  "New Balance",
  "ASICS",
  "Converse",
  "Levi's",
  "IKEA",
  "Hoff",
  "Casio",
  "Xiaomi",
  "Золотое Яблоко",
  "Л'Этуаль",
  "Ozon",
  "Яндекс Маркет",
].map((label) => ({ label }));

const hobbySuggestions: PreferenceSuggestion[] = [
  "Книги",
  "Кофе",
  "Путешествия",
  "Рисование",
  "Музыка",
  "Настолки",
  "Спорт",
  "Растения",
  "Готовка",
  "Игры",
].map((label) => ({ label }));

const doNotBuySuggestions: PreferenceSuggestion[] = [
  "Косметика",
  "Парфюм",
  "Одежда",
  "Сладости",
  "Свечи",
  "Украшения",
  "Сертификаты",
].map((label) => ({ label }));

const occasionSuggestions: PreferenceSuggestion[] = [
  "День рождения",
  "Новый год",
  "Годовщина",
  "Новоселье",
  "Просто так",
].map((label) => ({ label }));

const editorSections: Array<{
  id: EditorSection;
  label: string;
  hint: string;
  icon: typeof Heart;
}> = [
  { id: "likes", label: "Нравится", hint: "Цвета, материалы, бренды и интересы", icon: Heart },
  { id: "avoid", label: "Не подходит", hint: "Что точно не стоит выбирать", icon: ShieldAlert },
  { id: "details", label: "Детали", hint: "Размеры, бюджет и важные нюансы", icon: Sparkles },
];

function QuickTextField({
  id,
  label,
  description,
  value,
  placeholder,
  suggestions,
  icon: Icon,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  placeholder: string;
  suggestions: string[];
  icon: typeof Ruler;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="space-y-4 rounded-2xl border border-border/55 bg-[hsl(var(--surface-2)/0.72)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/24 bg-primary/10 text-primary-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <Label htmlFor={id} className="text-base font-semibold tracking-tight">
            {t(label)}
          </Label>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(description)}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            aria-pressed={value === suggestion}
            onClick={() => onChange(value === suggestion ? "" : suggestion)}
            className={cn(
              "min-h-9 rounded-lg border px-3 text-xs font-semibold transition-[color,background-color,border-color,transform] active:scale-[0.98]",
              value === suggestion
                ? "border-primary/45 bg-primary/16 text-foreground"
                : "border-border/55 bg-[hsl(var(--surface-3)/0.5)] text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t(suggestion)}
          </button>
        ))}
      </div>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t(placeholder)}
        maxLength={id === "budget" ? 200 : 500}
        className="border-border/55 bg-[hsl(var(--surface-3)/0.6)]"
      />
    </section>
  );
}

function SizeBuilder({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();
  const parsed = useMemo(() => parseSizePreferences(value), [value]);
  const remaining = SIZES_MAX_LENGTH - value.length;

  /*
   * Склеенная строка живёт в поле `sizes` со схемным потолком 500 символов
   * (`src/lib/preferences.ts`). Шесть полей по 80 плюс метки плюс «Другое»
   * дают до ~740 — то есть анкету можно было заполнить так, что сохранение
   * падало на сервере с «Ошибка проверки данных». Растущую правку за
   * потолком не принимаем, сокращающую — всегда.
   */
  const applyComposed = (next: string) => {
    if (next.length > SIZES_MAX_LENGTH && next.length > value.length) return;
    onChange(next);
  };

  const updateField = (field: SizeCategoryId, nextValue: string) => {
    applyComposed(
      composeSizePreferences(
        {
          ...parsed.fields,
          [field]: nextValue,
        },
        parsed.custom,
      ),
    );
  };

  const togglePreset = (field: SizeCategoryId, preset: string) => {
    updateField(field, togglePresetToken(parsed.fields[field], preset));
  };

  const isPresetActive = (field: SizeCategoryId, preset: string) =>
    hasPresetToken(parsed.fields[field], preset);

  const updateCustom = (nextValue: string) => {
    applyComposed(composeSizePreferences(parsed.fields, nextValue));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/55 bg-[hsl(var(--surface-2)/0.72)] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/24 bg-primary/10 text-primary-accent">
          <Ruler className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t("Размеры по категориям")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t(
              "Разделите одежду, обувь, брюки и аксессуары, чтобы друзья не угадывали по одному общему полю.",
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {sizeCategories.map((category) => {
          const currentValue = parsed.fields[category.id];
          return (
            <div
              key={category.id}
              className="min-w-0 rounded-xl border border-border/45 bg-[hsl(var(--surface-3)/0.42)] p-3"
            >
              <div className="mb-2.5">
                <Label htmlFor={`size-${category.id}`} className="text-sm font-semibold">
                  {t(category.label)}
                </Label>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t(category.hint)}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.presets.map((preset) => {
                  const active = isPresetActive(category.id, preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={active}
                      onClick={() => togglePreset(category.id, preset)}
                      className={cn(
                        "min-h-11 whitespace-nowrap rounded-lg border px-2.5 text-xs font-semibold transition-[color,background-color,border-color,transform] active:scale-[0.98] sm:min-h-8",
                        active
                          ? "border-primary/45 bg-primary/16 text-foreground"
                          : "border-border/45 bg-[hsl(var(--surface-2)/0.58)] text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
              <Input
                id={`size-${category.id}`}
                value={currentValue}
                onChange={(event) => updateField(category.id, event.target.value)}
                placeholder={t(category.placeholder)}
                maxLength={80}
                className="mt-2.5 min-h-10 border-border/55 bg-[hsl(var(--surface-2)/0.7)]"
              />
            </div>
          );
        })}
      </div>

      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <Label htmlFor="size-custom" className="text-sm font-semibold">
            {t("Другое")}
          </Label>
          {/* Счётчик появляется только у потолка: постоянный остаток превращает
              рассказ о себе в заполнение бланка. */}
          {remaining <= 100 ? (
            <p
              className={cn(
                "text-xs tabular-nums",
                remaining <= 0 ? "text-destructive" : "text-muted-foreground",
              )}
              aria-live="polite"
            >
              {t("Осталось символов: {count}", { count: Math.max(0, remaining) })}
            </p>
          ) : null}
        </div>
        <Input
          id="size-custom"
          value={parsed.custom}
          onChange={(event) => updateCustom(event.target.value)}
          placeholder={t("Например, длина рукава, обхват запястья или свободная заметка")}
          maxLength={180}
          className="mt-2 border-border/55 bg-[hsl(var(--surface-3)/0.6)]"
        />
      </div>
    </section>
  );
}

type GiftProfileEditorProps = {
  draft: GiftPreferences;
  activeSection: EditorSection;
  onSectionChange: (section: EditorSection) => void;
  sectionFilled: Record<EditorSection, boolean>;
  updateList: (key: ListPreferenceKey, value: string[]) => void;
  updateText: (key: "sizes" | "budget" | "notes", value: string) => void;
};

/**
 * Редактор подарочного профиля.
 *
 * Раньше жил внутри модального окна шириной 86rem с собственной боковой
 * навигацией — то есть был страницей, притворявшейся коротким делом.
 * Теперь это обычный компонент страницы: у него есть адрес, история и
 * возможность отвлечься и вернуться.
 */
export function GiftProfileEditor({
  draft,
  activeSection,
  onSectionChange,
  sectionFilled,
  updateList,
  updateText,
}: GiftProfileEditorProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  return (
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[12rem_minmax(0,1fr)]">
      <nav className={cn(uiSurface.contentPanel, "grid min-w-0 gap-1 p-2 lg:sticky lg:top-5")}>
        {editorSections.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "group flex min-h-12 min-w-0 items-center gap-3 rounded-xl border px-3 text-left transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98]",
                active
                  ? "border-primary/32 bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent/55 hover:text-foreground",
              )}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", active && "text-primary-accent")}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{t(section.label)}</span>
                <span className="hidden truncate text-[11px] text-muted-foreground xl:block">
                  {t(section.hint)}
                </span>
              </span>
              {/* Точка вместо счётчика: человеку нужно знать, что раздел он уже
                  трогал, а не сколько чипов в нём набралось. Число превращало
                  рассказ о себе в результат теста. */}
              {sectionFilled[section.id] ? (
                <span
                  className="size-1.5 shrink-0 rounded-full bg-primary"
                  aria-label={t("Раздел заполнен")}
                />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial={reduceMotion ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="min-w-0 space-y-4"
          >
            {activeSection === "likes" ? (
              <>
                <PreferenceChipPicker
                  title="Любимые бренды"
                  description="Марки и магазины, которым вы уже доверяете."
                  value={draft.favoriteBrands}
                  suggestions={brandSuggestions}
                  placeholder="Добавить бренд или магазин"
                  max={16}
                  onChange={(value) => updateList("favoriteBrands", value)}
                />
                <PreferenceChipPicker
                  title="Любимые цвета"
                  description="Выберите оттенки, с которыми сложно промахнуться."
                  value={draft.favoriteColors}
                  suggestions={colorSuggestions}
                  placeholder="Добавить свой цвет"
                  max={12}
                  onChange={(value) => updateList("favoriteColors", value)}
                />
                <PreferenceChipPicker
                  title="Категории товаров"
                  description="Какие типы подарков вам чаще всего интересны."
                  value={draft.favoriteCategories}
                  suggestions={categorySuggestions}
                  placeholder="Добавить категорию"
                  max={12}
                  onChange={(value) => updateList("favoriteCategories", value)}
                />
                <PreferenceChipPicker
                  title="Интересы"
                  description="Темы, вокруг которых можно придумать неожиданный подарок."
                  value={draft.hobbies}
                  suggestions={hobbySuggestions}
                  placeholder="Добавить своё увлечение"
                  max={20}
                  onChange={(value) => updateList("hobbies", value)}
                />
                <PreferenceChipPicker
                  title="Приятные материалы"
                  description="Из чего подарок ощущается особенно хорошо."
                  value={draft.favoriteMaterials}
                  suggestions={materialSuggestions}
                  placeholder="Например, кашемир"
                  max={16}
                  onChange={(value) => updateList("favoriteMaterials", value)}
                />
              </>
            ) : null}

            {activeSection === "avoid" ? (
              <>
                <PreferenceChipPicker
                  title="Бренды не для меня"
                  description="Марки и магазины, которые лучше пропустить."
                  value={draft.dislikedBrands}
                  suggestions={brandSuggestions}
                  placeholder="Добавить бренд или магазин"
                  max={16}
                  warning
                  onChange={(value) => updateList("dislikedBrands", value)}
                />
                <PreferenceChipPicker
                  title="Цвета, которые не нравятся"
                  description="Отметьте оттенки, которых лучше избегать."
                  value={draft.dislikedColors}
                  suggestions={colorSuggestions}
                  placeholder="Добавить нежелательный цвет"
                  max={12}
                  warning
                  onChange={(value) => updateList("dislikedColors", value)}
                />
                <PreferenceChipPicker
                  title="Категории не для меня"
                  description="Типы товаров, которые лучше не выбирать."
                  value={draft.dislikedCategories}
                  suggestions={categorySuggestions}
                  placeholder="Добавить нежелательную категорию"
                  max={12}
                  warning
                  onChange={(value) => updateList("dislikedCategories", value)}
                />
                <PreferenceChipPicker
                  title="Неприятные материалы"
                  description="Полезно для одежды, украшений и предметов дома."
                  value={draft.dislikedMaterials}
                  suggestions={materialSuggestions}
                  placeholder="Например, синтетика"
                  max={16}
                  warning
                  onChange={(value) => updateList("dislikedMaterials", value)}
                />
                <PreferenceChipPicker
                  title="Точно не покупать"
                  description="Самый важный стоп-лист для дарителя."
                  value={draft.doNotBuy}
                  suggestions={doNotBuySuggestions}
                  placeholder="Добавить в стоп-лист"
                  max={24}
                  warning
                  onChange={(value) => updateList("doNotBuy", value)}
                />
              </>
            ) : null}

            {activeSection === "details" ? (
              <>
                <SizeBuilder value={draft.sizes} onChange={(value) => updateText("sizes", value)} />
                <QuickTextField
                  id="budget"
                  label="Комфортный бюджет"
                  description="Ориентир помогает не ставить друзей в неловкое положение."
                  value={draft.budget}
                  placeholder="Например, дороже 5000 ₽ лучше обсудить"
                  suggestions={["До 1000 ₽", "До 3000 ₽", "До 5000 ₽", "Бюджет не важен"]}
                  icon={CircleDollarSign}
                  onChange={(value) => updateText("budget", value)}
                />
                <PreferenceChipPicker
                  title="Поводы"
                  description="Когда особенно приятно получить подарок."
                  value={draft.occasions}
                  suggestions={occasionSuggestions}
                  placeholder="Добавить свой повод"
                  max={16}
                  onChange={(value) => updateList("occasions", value)}
                />
                <section className="space-y-3 rounded-2xl border border-border/55 bg-[hsl(var(--surface-2)/0.72)] p-4 sm:p-5">
                  <div>
                    <Label htmlFor="notes" className="text-base font-semibold tracking-tight">
                      {t("Личная подсказка")}
                    </Label>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {t(
                        "Аллергии, доставка, упаковка или любая деталь, которую не выразить кнопкой.",
                      )}
                    </p>
                  </div>
                  <Textarea
                    id="notes"
                    value={draft.notes}
                    rows={5}
                    maxLength={1000}
                    onChange={(event) => updateText("notes", event.target.value)}
                    placeholder={t(
                      "Например: люблю практичные подарки и не люблю сюрпризы с доставкой на работу",
                    )}
                    className="min-h-32 resize-y border-border/55 bg-[hsl(var(--surface-3)/0.6)]"
                  />
                </section>
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
