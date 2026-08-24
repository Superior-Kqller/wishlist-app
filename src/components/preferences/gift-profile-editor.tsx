"use client";

import { useMemo, useRef, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CircleDollarSign, Heart, Ruler, ShieldAlert, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/components/i18n/language-provider";
import {
  PreferenceChipPicker,
  type PreferenceSuggestion,
} from "@/components/preferences/preference-chip-picker";
import { duration, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { uiState, uiSurface } from "@/lib/ui-contract";
import { useMediaQuery } from "@/lib/use-media-query";
import { SIZES_MAX_LENGTH, giftPreferenceLabels, type GiftPreferences } from "@/lib/preferences";
import {
  composeSizePreferences,
  hasPresetToken,
  parseSizePreferences,
  sizeCategories,
  togglePresetToken,
  type SizeCategoryId,
} from "@/lib/preference-sizes";
import { preferenceColors } from "@/lib/preference-colors";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export type EditorSection = "likes" | "avoid" | "details";

const editorTabId = (section: EditorSection) => `gift-profile-tab-${section}`;
const editorPanelId = (section: EditorSection) => `gift-profile-panel-${section}`;
export type ListPreferenceKey = {
  [Key in keyof GiftPreferences]: GiftPreferences[Key] extends string[] ? Key : never;
}[keyof GiftPreferences];

const colorSuggestions: PreferenceSuggestion[] = preferenceColors.map((color) => ({
  label: color.label,
  color: color.hex,
}));

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
    <section className={cn("space-y-4", uiSurface.formSection)}>
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
              "min-h-11 rounded-full border px-3 text-xs font-semibold sm:min-h-9 transition-[color,background-color,border-color,transform] active:scale-[0.98]",
              uiState.focusRing,
              value === suggestion ? uiState.chipSelected : uiState.chipIdle,
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
        className="border-border/55 bg-[hsl(var(--surface-3)/0.55)]"
      />
    </section>
  );
}

function SizeBuilder({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();
  const parsed = useMemo(() => parseSizePreferences(value), [value]);

  /*
   * Склеенная строка живёт в поле `sizes` со схемным потолком 500 символов
   * (`src/lib/preferences.ts`). Шесть полей по 80 плюс метки плюс «Другое»
   * дают до ~740 — то есть анкету можно заполнить так, что сохранение упадёт
   * на сервере с «Ошибка проверки данных». Растущую правку за потолком не
   * принимаем, сокращающую — всегда.
   *
   * Сравнивать `next` с исходным `value` было нельзя: разбор не изоморфен —
   * псевдонимы разворачиваются в полные подписи, и «Брюки: X» при обратной
   * склейке становится «Брюки и джинсы: X», плюс девять символов. У строки
   * длиной около потолка это запирало поле: удаление символа давало строку
   * длиннее исходной, правка отклонялась, и выйти из этого через форму было
   * нельзя.
   * Обе стороны сравнения теперь канонические.
   */
  const composedValue = useMemo(
    () => composeSizePreferences(parsed.fields, parsed.custom),
    [parsed],
  );
  const remaining = SIZES_MAX_LENGTH - composedValue.length;

  const applyComposed = (next: string) => {
    if (next.length > SIZES_MAX_LENGTH && next.length > composedValue.length) return;
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
    <section className={cn("space-y-4", uiSurface.formSection)}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/24 bg-primary/10 text-primary-accent">
          <Ruler className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            {t(giftPreferenceLabels.sizes)}
          </h2>
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
              className="min-w-0 rounded-xl border border-border/45 bg-[hsl(var(--surface-3)/0.45)] p-3"
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
                        "min-h-11 min-w-11 whitespace-nowrap rounded-full border px-2.5 text-xs font-semibold sm:min-w-0 transition-[color,background-color,border-color,transform] active:scale-[0.98] sm:min-h-9",
                        uiState.focusRing,
                        active ? uiState.chipSelected : uiState.chipIdle,
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
                className="mt-2.5 border-border/55 bg-[hsl(var(--surface-2)/0.7)]"
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
          className="mt-2 border-border/55 bg-[hsl(var(--surface-3)/0.55)]"
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
  const tabRefs = useRef<Partial<Record<EditorSection, HTMLButtonElement | null>>>({});
  // Полоса вкладок горизонтальная ниже `xl` и вертикальная от него: статическое
  // `aria-orientation` врало бы в одном из двух режимов.
  const verticalTabs = useMediaQuery("(min-width: 80rem)");

  /*
   * Три кнопки, подменяющие область справа, — это вкладки, а не просто кнопки.
   * Раньше активность передавалась только краской: ни `aria-selected`, ни
   * `aria-controls`, ни связи с панелью, — и для скринридера смена раздела
   * происходила беззвучно. Роль вкладок требует и клавиш: стрелки, Home и End.
   */
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const order = editorSections.map((section) => section.id);
    const current = order.indexOf(activeSection);
    let next = -1;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") next = current + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = current - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = order.length - 1;
    else return;

    event.preventDefault();
    const target = order[(next + order.length) % order.length];
    onSectionChange(target);
    tabRefs.current[target]?.focus();
  };

  return (
    <div className="grid min-w-0 items-start gap-4 xl:grid-cols-[11rem_minmax(0,1fr)]">
      <div
        role="tablist"
        aria-orientation={verticalTabs ? "vertical" : "horizontal"}
        aria-label={t("Разделы профиля")}
        className={cn(
          uiSurface.contentPanel,
          "grid min-w-0 grid-cols-3 gap-1 p-2 lg:sticky lg:top-5 xl:grid-cols-1",
        )}
      >
        {editorSections.map((section) => {
          const Icon = section.icon;
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              ref={(node) => {
                tabRefs.current[section.id] = node;
              }}
              type="button"
              role="tab"
              id={editorTabId(section.id)}
              aria-selected={active}
              aria-controls={editorPanelId(section.id)}
              tabIndex={active ? 0 : -1}
              onKeyDown={handleTabKeyDown}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "group flex min-h-12 min-w-0 items-center justify-center gap-2 rounded-lg border px-2 text-center transition-[color,background-color,border-color,transform] duration-base active:scale-[0.98] xl:justify-start xl:gap-3 xl:px-3 xl:text-left",
                uiState.focusRing,
                active
                  ? "border-primary-accent/70 bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-accent/55 hover:text-foreground",
              )}
            >
              {/* Ниже `xl` вкладки идут полосой в три колонки: на 320px на
                  подпись остаётся около 40px, и иконка отнимала их у слова.
                  В боковой колонке она возвращается. */}
              <Icon
                className={cn("hidden h-4 w-4 shrink-0 xl:block", active && "text-primary-accent")}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold [overflow-wrap:anywhere] sm:text-sm">
                  {t(section.label)}
                </span>
                <span className="hidden truncate text-[11px] text-muted-foreground xl:block">
                  {t(section.hint)}
                </span>
              </span>
              {/* Точка вместо счётчика: человеку нужно знать, что раздел он уже
                  трогал, а не сколько чипов в нём набралось. Число превращало
                  рассказ о себе в результат теста. `role="img"` обязателен:
                  `aria-label` на голом `span` скринридеры игнорируют. */}
              {sectionFilled[section.id] ? (
                <span
                  role="img"
                  aria-label={t("Раздел заполнен")}
                  className="size-1.5 shrink-0 rounded-full bg-primary-accent"
                />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Три панели живут в разметке постоянно, скрытые — через `hidden`.
          Раньше подменялась одна: `aria-controls` двух вкладок из трёх всегда
          указывал на несуществующий id, а во время перехода не существовало и
          третьего. Ровно эту ошибку соседняя карточка уже исправила у себя.
          `tabIndex` панели снят: внутри есть фокусируемые дети, и лишняя
          остановка табуляции только удлиняла путь. */}
      <div className="min-w-0">
        {editorSections.map((section) => (
          <div
            key={section.id}
            role="tabpanel"
            id={editorPanelId(section.id)}
            aria-labelledby={editorTabId(section.id)}
            hidden={activeSection !== section.id}
          >
            {activeSection !== section.id ? null : (
              <motion.div
                key={section.id}
                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: duration.base, ease: easing.expo }}
                className="min-w-0 space-y-4"
              >
                {section.id === "likes" ? (
                  <>
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.favoriteBrands}
                      description="Марки и магазины, которым вы уже доверяете."
                      value={draft.favoriteBrands}
                      suggestions={brandSuggestions}
                      placeholder="Добавить бренд или магазин"
                      max={16}
                      onChange={(value) => updateList("favoriteBrands", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.favoriteColors}
                      description="Выберите оттенки, с которыми сложно промахнуться."
                      value={draft.favoriteColors}
                      suggestions={colorSuggestions}
                      placeholder="Добавить свой цвет"
                      max={12}
                      onChange={(value) => updateList("favoriteColors", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.favoriteCategories}
                      description="Какие типы подарков вам чаще всего интересны."
                      value={draft.favoriteCategories}
                      suggestions={categorySuggestions}
                      placeholder="Добавить категорию"
                      max={12}
                      onChange={(value) => updateList("favoriteCategories", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.hobbies}
                      description="Темы, вокруг которых можно придумать неожиданный подарок."
                      value={draft.hobbies}
                      suggestions={hobbySuggestions}
                      placeholder="Добавить своё увлечение"
                      max={20}
                      onChange={(value) => updateList("hobbies", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.favoriteMaterials}
                      description="Из чего подарок ощущается особенно хорошо."
                      value={draft.favoriteMaterials}
                      suggestions={materialSuggestions}
                      placeholder="Например, кашемир"
                      max={16}
                      onChange={(value) => updateList("favoriteMaterials", value)}
                    />
                  </>
                ) : null}

                {section.id === "avoid" ? (
                  <>
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.dislikedBrands}
                      description="Марки и магазины, которые лучше пропустить."
                      value={draft.dislikedBrands}
                      suggestions={brandSuggestions}
                      placeholder="Добавить бренд или магазин"
                      max={16}
                      warning
                      onChange={(value) => updateList("dislikedBrands", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.dislikedColors}
                      description="Отметьте оттенки, которых лучше избегать."
                      value={draft.dislikedColors}
                      suggestions={colorSuggestions}
                      placeholder="Добавить нежелательный цвет"
                      max={12}
                      warning
                      onChange={(value) => updateList("dislikedColors", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.dislikedCategories}
                      description="Типы товаров, которые лучше не выбирать."
                      value={draft.dislikedCategories}
                      suggestions={categorySuggestions}
                      placeholder="Добавить нежелательную категорию"
                      max={12}
                      warning
                      onChange={(value) => updateList("dislikedCategories", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.dislikedMaterials}
                      description="Полезно для одежды, украшений и предметов дома."
                      value={draft.dislikedMaterials}
                      suggestions={materialSuggestions}
                      placeholder="Например, синтетика"
                      max={16}
                      warning
                      onChange={(value) => updateList("dislikedMaterials", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.doNotBuy}
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

                {section.id === "details" ? (
                  <>
                    <SizeBuilder
                      value={draft.sizes}
                      onChange={(value) => updateText("sizes", value)}
                    />
                    <QuickTextField
                      id="budget"
                      label={giftPreferenceLabels.budget}
                      description="Ориентир помогает не ставить друзей в неловкое положение."
                      value={draft.budget}
                      placeholder="Например, дороже 5000 ₽ лучше обсудить"
                      suggestions={["До 1000 ₽", "До 3000 ₽", "До 5000 ₽", "Бюджет не важен"]}
                      icon={CircleDollarSign}
                      onChange={(value) => updateText("budget", value)}
                    />
                    <PreferenceChipPicker
                      title={giftPreferenceLabels.occasions}
                      description="Когда особенно приятно получить подарок."
                      value={draft.occasions}
                      suggestions={occasionSuggestions}
                      placeholder="Добавить свой повод"
                      max={16}
                      onChange={(value) => updateList("occasions", value)}
                    />
                    <section className={cn("space-y-3", uiSurface.formSection)}>
                      <div>
                        <Label htmlFor="notes" className="text-base font-semibold tracking-tight">
                          {t(giftPreferenceLabels.notes)}
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
                        className="min-h-32 resize-y border-border/55 bg-[hsl(var(--surface-3)/0.55)]"
                      />
                    </section>
                  </>
                ) : null}
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
