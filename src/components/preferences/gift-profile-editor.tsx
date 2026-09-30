"use client";

import { useMemo, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, ShieldAlert, Sparkles } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/components/i18n/language-provider";
import {
  ChipTick,
  PreferenceChipPicker,
  chipToggleClass,
  type PreferenceSuggestion,
} from "@/components/preferences/preference-chip-picker";
import { duration, easing } from "@/lib/motion";
import { cn } from "@/lib/utils";
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

/** Заголовок группы анкеты: подпись и одна строка пояснения, без плитки-иконки. */
function GroupHeading({
  htmlFor,
  title,
  description,
}: {
  htmlFor?: string;
  title: string;
  description: string;
}) {
  const { t } = useI18n();
  return (
    <div>
      {htmlFor ? (
        <Label htmlFor={htmlFor} className="text-base font-semibold">
          {t(title)}
        </Label>
      ) : (
        <h3 className="text-base font-semibold">{t(title)}</h3>
      )}
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{t(description)}</p>
    </div>
  );
}

function QuickTextField({
  id,
  label,
  description,
  value,
  placeholder,
  suggestions,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  placeholder: string;
  suggestions: string[];
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  return (
    <section className="min-w-0 space-y-4">
      <GroupHeading htmlFor={id} title={label} description={description} />
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            aria-pressed={value === suggestion}
            onClick={() => onChange(value === suggestion ? "" : suggestion)}
            className={chipToggleClass(value === suggestion)}
          >
            {t(suggestion)}
            <ChipTick shown={value === suggestion} />
          </button>
        ))}
      </div>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t(placeholder)}
        maxLength={id === "budget" ? 200 : 500}
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
    <section className="min-w-0 space-y-6">
      <GroupHeading
        title={giftPreferenceLabels.sizes}
        description="Разделите одежду, обувь, брюки и аксессуары, чтобы друзья не угадывали по одному общему полю."
      />

      {/* Категории — плоские группы в две колонки: рамка вокруг каждой
          превращала раздел в стопку карточек внутри карточки. */}
      <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {sizeCategories.map((category) => {
          const currentValue = parsed.fields[category.id];
          return (
            <div key={category.id} className="min-w-0">
              <Label htmlFor={`size-${category.id}`} className="text-sm font-semibold">
                {t(category.label)}
              </Label>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{t(category.hint)}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {category.presets.map((preset) => {
                  const active = isPresetActive(category.id, preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={active}
                      onClick={() => togglePreset(category.id, preset)}
                      className={cn(
                        chipToggleClass(active),
                        "min-w-11 justify-center whitespace-nowrap px-3 tabular-nums",
                      )}
                    >
                      {preset}
                      <ChipTick shown={active} />
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
                className="mt-2.5"
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
          className="mt-2"
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
  /** Панель сохранения — липнет к низу колонки анкеты, а не всей страницы. */
  footer?: ReactNode;
};

/**
 * Редактор подарочного профиля.
 *
 * Разделы — вкладки Radix (стрелки, Home/End и связи `aria-controls` даёт
 * примитив): на телефоне полоса-сегмент сверху, с 1128px — вертикальная рельса
 * слева, как меню разделов в Settings Sidebar Layout (21st.dev). Пилюля выбора
 * одна и переезжает между разделами (Tab Pill Glide).
 *
 * Все три панели живут в разметке (`forceMount`), неактивные скрыты: иначе
 * `aria-controls` двух вкладок из трёх указывал бы на несуществующий id.
 */
export function GiftProfileEditor({
  draft,
  activeSection,
  onSectionChange,
  sectionFilled,
  updateList,
  updateText,
  footer,
}: GiftProfileEditorProps) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1128px)");

  return (
    <Tabs
      value={activeSection}
      onValueChange={(value) => onSectionChange(value as EditorSection)}
      orientation={isDesktop ? "vertical" : "horizontal"}
      className="grid min-w-0 items-start gap-8 min-[1128px]:grid-cols-[15rem_minmax(0,1fr)] min-[1128px]:gap-16"
    >
      <TabsList
        aria-label={t("Разделы профиля")}
        className="min-[1128px]:sticky min-[1128px]:top-24 min-[1128px]:grid-flow-row min-[1128px]:auto-cols-auto min-[1128px]:rounded-none min-[1128px]:border-0 min-[1128px]:bg-transparent min-[1128px]:p-0"
      >
        {editorSections.map((section) => {
          const Icon = section.icon;
          return (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="gap-1.5 px-2 sm:gap-2 sm:px-3 min-[1128px]:min-h-12 min-[1128px]:justify-start min-[1128px]:px-4"
            >
              {/* На 320px вкладке остаётся около 40px на подпись — иконка со `sm`. */}
              <Icon className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden />
              <span className="min-w-0 truncate">{t(section.label)}</span>
              {/* Точка вместо счётчика: человеку нужно знать, что раздел он уже
                  трогал, а не сколько чипов набралось. Чернилами, не краской —
                  малиновый на экране один: «Сохранить». */}
              {sectionFilled[section.id] ? (
                <span
                  role="img"
                  aria-label={t("Раздел заполнен")}
                  className="size-1.5 shrink-0 rounded-full bg-current min-[1128px]:ml-auto"
                />
              ) : null}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="min-w-0 max-w-3xl">
        {editorSections.map((section) => (
          <TabsContent
            key={section.id}
            value={section.id}
            forceMount
            className="m-0 data-[state=inactive]:hidden"
          >
            {activeSection !== section.id ? null : (
              <motion.div
                key={section.id}
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: duration.base, ease: easing.expo }}
              >
                <div className="mb-8">
                  <h2 className="section-title">{t(section.label)}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{t(section.hint)}</p>
                </div>

                {/* Группы разделены волосяной линией, а не рамками: одна
                    колонка чтения вместо стопки карточек. */}
                <div className="divide-y divide-border [&>*]:py-8 [&>*:first-child]:pt-0">
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
                      <section className="min-w-0 space-y-4">
                        <GroupHeading
                          htmlFor="notes"
                          title={giftPreferenceLabels.notes}
                          description="Аллергии, доставка, упаковка или любая деталь, которую не выразить кнопкой."
                        />
                        <Textarea
                          id="notes"
                          value={draft.notes}
                          rows={5}
                          maxLength={1000}
                          onChange={(event) => updateText("notes", event.target.value)}
                          placeholder={t(
                            "Например: люблю практичные подарки и не люблю сюрпризы с доставкой на работу",
                          )}
                          className="min-h-32 resize-y"
                        />
                      </section>
                    </>
                  ) : null}
                </div>
              </motion.div>
            )}
          </TabsContent>
        ))}
        {footer}
      </div>
    </Tabs>
  );
}
