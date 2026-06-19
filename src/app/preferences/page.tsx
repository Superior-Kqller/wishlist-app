"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate as mutateCache } from "swr";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CircleDollarSign,
  Heart,
  Loader2,
  Ruler,
  Save,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";
import {
  PreferenceChipPicker,
  type PreferenceSuggestion,
} from "@/components/preferences/preference-chip-picker";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import {
  type GiftPreferences,
  countGiftPreferences,
  emptyGiftPreferences,
  normalizeGiftPreferences,
} from "@/lib/preferences";

type PreferencesUser = {
  giftPreferences?: GiftPreferences | null;
};

type EditorSection = "likes" | "avoid" | "details";
type ListPreferenceKey = {
  [Key in keyof GiftPreferences]: GiftPreferences[Key] extends string[] ? Key : never;
}[keyof GiftPreferences];

const colorSuggestions: PreferenceSuggestion[] = [
  { label: "Розовый", color: "#e7a6b8" },
  { label: "Красный", color: "#c75b64" },
  { label: "Оранжевый", color: "#d78a4d" },
  { label: "Жёлтый", color: "#d8b84a" },
  { label: "Зелёный", color: "#6f9b76" },
  { label: "Голубой", color: "#77aabd" },
  { label: "Синий", color: "#56789f" },
  { label: "Фиолетовый", color: "#8c729c" },
  { label: "Белый", color: "#ece9e1" },
  { label: "Бежевый", color: "#cdbb9f" },
  { label: "Серый", color: "#8c9097" },
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

const brandSuggestions: PreferenceSuggestion[] = [
  "Apple",
  "Uniqlo",
  "Nike",
  "Adidas",
  "IKEA",
  "Casio",
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
    <section className="space-y-4 rounded-2xl border border-border/50 bg-[hsl(var(--surface-2))/0.72] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/9 text-primary">
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
                ? "border-primary/42 bg-primary/13 text-foreground"
                : "border-border/52 bg-[hsl(var(--surface-3))/0.5] text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t(placeholder)}
        maxLength={id === "budget" ? 200 : 500}
        className="border-border/56 bg-[hsl(var(--surface-3))/0.6]"
      />
    </section>
  );
}

function PreferencesPageSkeleton() {
  return (
    <PageShell>
      <PageMain className="max-w-7xl">
        <div className="space-y-5 animate-pulse">
          <div className="h-24 rounded-2xl bg-muted/50" />
          <div className="grid gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_21rem]">
            <div className="h-48 rounded-2xl bg-muted/40" />
            <div className="h-[34rem] rounded-2xl bg-muted/40" />
            <div className="h-72 rounded-2xl bg-muted/40" />
          </div>
        </div>
      </PageMain>
    </PageShell>
  );
}

export default function PreferencesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { status } = useSession();
  const { data, isLoading, error, mutate } = useSWR<PreferencesUser>(
    status === "authenticated" ? "/api/users/me" : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const preferences = useMemo(
    () => normalizeGiftPreferences(data?.giftPreferences),
    [data?.giftPreferences],
  );
  const [draft, setDraft] = useState<GiftPreferences>(emptyGiftPreferences);
  const [activeSection, setActiveSection] = useState<EditorSection>("likes");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [router, status]);

  useEffect(() => {
    if (data) setDraft(preferences);
  }, [data, preferences]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(preferences);
  const preferenceCount = countGiftPreferences(draft);

  const updateList = (key: ListPreferenceKey, value: string[]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateText = (key: "sizes" | "budget" | "notes", value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const sectionCounts: Record<EditorSection, number> = {
    likes:
      draft.favoriteColors.length +
      draft.favoriteMaterials.length +
      draft.favoriteBrands.length +
      draft.hobbies.length,
    avoid:
      draft.dislikedColors.length +
      draft.dislikedMaterials.length +
      draft.dislikedBrands.length +
      draft.doNotBuy.length,
    details:
      draft.occasions.length +
      Number(Boolean(draft.sizes)) +
      Number(Boolean(draft.budget)) +
      Number(Boolean(draft.notes)),
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftPreferences: draft }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || t("Не удалось сохранить предпочтения"));
      toast.success(t("Подарочный профиль сохранён"));
      await mutate();
      await mutateCache("/api/users/stats");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось сохранить предпочтения"));
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || isLoading) return <PreferencesPageSkeleton />;

  return (
    <PageShell>
      <PageMain className="max-w-7xl">
        <div className="space-y-5">
          <PageIntro
            title={t("Паспорт подарков")}
            description={t("Соберите подсказки кликами — друзья увидят их прямо рядом с вашим списком желаний.")}
            actions={
              <Button
                type="button"
                className="w-full gap-2 sm:w-auto"
                disabled={!hasChanges || saving || Boolean(error)}
                onClick={handleSubmit}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? t("Сохраняем") : t("Сохранить")}
              </Button>
            }
          />

          {error ? (
            <div className={cn(uiSurface.emptyState, "px-4 py-8")}>
              <p className="text-sm font-semibold">{t("Не удалось загрузить профиль")}</p>
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => mutate()}>
                {t("Попробовать снова")}
              </Button>
            </div>
          ) : (
            <div className="grid items-start gap-4 lg:grid-cols-[14rem_minmax(0,1fr)_21rem]">
              <nav className={cn(uiSurface.contentPanel, "grid gap-1 p-2 lg:sticky lg:top-5")}>
                <div className="px-3 pb-2 pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t("Заполнено")}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{preferenceCount}</p>
                </div>
                {editorSections.map((section) => {
                  const Icon = section.icon;
                  const active = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "group flex min-h-12 items-center gap-3 rounded-xl border px-3 text-left transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98]",
                        active
                          ? "border-primary/30 bg-primary/11 text-foreground"
                          : "border-transparent text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">{t(section.label)}</span>
                        <span className="hidden truncate text-[11px] text-muted-foreground xl:block">
                          {t(section.hint)}
                        </span>
                      </span>
                      <span className="min-w-5 rounded-md bg-[hsl(var(--surface-3))/0.78] px-1.5 py-0.5 text-center text-[10px] font-semibold tabular-nums">
                        {sectionCounts[section.id]}
                      </span>
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
                    className="space-y-4"
                  >
                    {activeSection === "likes" ? (
                      <>
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
                          title="Приятные материалы"
                          description="Из чего подарок ощущается особенно хорошо."
                          value={draft.favoriteMaterials}
                          suggestions={materialSuggestions}
                          placeholder="Например, кашемир"
                          max={16}
                          onChange={(value) => updateList("favoriteMaterials", value)}
                        />
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
                          title="Интересы"
                          description="Темы, вокруг которых можно придумать неожиданный подарок."
                          value={draft.hobbies}
                          suggestions={hobbySuggestions}
                          placeholder="Добавить своё увлечение"
                          max={20}
                          onChange={(value) => updateList("hobbies", value)}
                        />
                      </>
                    ) : null}

                    {activeSection === "avoid" ? (
                      <>
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
                        <PreferenceChipPicker
                          title="Поводы"
                          description="Когда особенно приятно получить подарок."
                          value={draft.occasions}
                          suggestions={occasionSuggestions}
                          placeholder="Добавить свой повод"
                          max={16}
                          onChange={(value) => updateList("occasions", value)}
                        />
                        <QuickTextField
                          id="sizes"
                          label="Размеры"
                          description="Можно выбрать основу и дополнить точными мерками."
                          value={draft.sizes}
                          placeholder="Одежда M, обувь 38, кольцо 17"
                          suggestions={["Одежда XS", "Одежда S", "Одежда M", "Одежда L", "Одежда XL"]}
                          icon={Ruler}
                          onChange={(value) => updateText("sizes", value)}
                        />
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
                        <section className="space-y-3 rounded-2xl border border-border/50 bg-[hsl(var(--surface-2))/0.72] p-4 sm:p-5">
                          <div>
                            <Label htmlFor="notes" className="text-base font-semibold tracking-tight">
                              {t("Личная подсказка")}
                            </Label>
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                              {t("Аллергии, доставка, упаковка или любая деталь, которую не выразить кнопкой.")}
                            </p>
                          </div>
                          <Textarea
                            id="notes"
                            value={draft.notes}
                            rows={5}
                            maxLength={1000}
                            onChange={(event) => updateText("notes", event.target.value)}
                            placeholder={t("Например: люблю практичные подарки и не люблю сюрпризы с доставкой на работу")}
                            className="min-h-32 resize-y border-border/56 bg-[hsl(var(--surface-3))/0.6]"
                          />
                        </section>
                      </>
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              </div>

              <aside className="space-y-4 lg:sticky lg:top-5">
                <GiftPreferencesSummary userName={t("вам")} preferences={draft} />
                <div className={cn(uiSurface.contentPanel, "p-4 text-sm text-muted-foreground")}>
                  <p className="font-semibold text-foreground">{t("Кто это увидит")}</p>
                  <p className="mt-1.5 leading-relaxed">
                    {t("Только пользователи, у которых есть доступ к вашим общим подборкам.")}
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
