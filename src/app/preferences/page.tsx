"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate as mutateCache } from "swr";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CircleDollarSign,
  Gift,
  Heart,
  Loader2,
  Ruler,
  Save,
  ShieldAlert,
  Sparkles,
  UsersRound,
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
import { PreferenceProfileCard } from "@/components/preferences/preference-profile-card";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import {
  type GiftPreferences,
  countGiftPreferences,
  emptyGiftPreferences,
  normalizeGiftPreferences,
} from "@/lib/preferences";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

type PreferencesUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
  _count?: { items: number };
};

type CircleUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
  stats?: { totalItems: number };
};

type CircleUsersResponse = {
  users: CircleUser[];
};

type EditorSection = "likes" | "avoid" | "details";
type ListPreferenceKey = {
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

type SizeCategoryId = "clothes" | "shoes" | "pants" | "outerwear" | "rings" | "belts";

const sizeCategories: Array<{
  id: SizeCategoryId;
  label: string;
  aliases?: string[];
  hint: string;
  placeholder: string;
  presets: string[];
}> = [
  {
    id: "clothes",
    label: "Одежда",
    hint: "Футболки, худи, платья",
    placeholder: "Например, M или 46",
    presets: ["XS", "S", "M", "L", "XL", "42", "44", "46", "48"],
  },
  {
    id: "shoes",
    label: "Обувь",
    hint: "Кроссовки, ботинки, домашняя обувь",
    placeholder: "Например, 38 EU",
    presets: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
  },
  {
    id: "pants",
    label: "Брюки и джинсы",
    aliases: ["Брюки", "Джинсы"],
    hint: "Талия, длина или обычный размер",
    placeholder: "Например, W30/L32",
    presets: ["XS", "S", "M", "L", "W28", "W30", "W32", "W34"],
  },
  {
    id: "outerwear",
    label: "Верхняя одежда",
    aliases: ["Верх", "Куртка", "Пальто"],
    hint: "Куртки, пальто, жилеты",
    placeholder: "Например, M или 48",
    presets: ["S", "M", "L", "XL", "44", "46", "48", "50"],
  },
  {
    id: "rings",
    label: "Кольцо",
    hint: "Если украшения уместны",
    placeholder: "Например, 17",
    presets: ["15", "16", "16.5", "17", "17.5", "18", "18.5", "19"],
  },
  {
    id: "belts",
    label: "Ремень",
    aliases: ["Пояс"],
    hint: "Длина или обхват",
    placeholder: "Например, 95 см",
    presets: ["80 см", "85 см", "90 см", "95 см", "100 см", "105 см"],
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseSizePreferences(value: string) {
  const fields = Object.fromEntries(sizeCategories.map((category) => [category.id, ""])) as Record<SizeCategoryId, string>;
  const custom: string[] = [];
  const parts = value
    .split(/[;\n,]/)
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const matched = sizeCategories.find((category) => {
      const names = [category.label, ...(category.aliases ?? [])];
      return names.some((name) => new RegExp(`^${escapeRegExp(name)}[:\\s-]+`, "i").test(part));
    });

    if (!matched) {
      custom.push(part);
      continue;
    }

    const names = [matched.label, ...(matched.aliases ?? [])];
    const matchedName = names.find((name) => new RegExp(`^${escapeRegExp(name)}[:\\s-]+`, "i").test(part));
    const nextValue = matchedName
      ? part.replace(new RegExp(`^${escapeRegExp(matchedName)}[:\\s-]+`, "i"), "").trim()
      : "";
    fields[matched.id] = [fields[matched.id], nextValue].filter(Boolean).join(", ");
  }

  return { fields, custom: custom.join("; ") };
}

function composeSizePreferences(fields: Record<SizeCategoryId, string>, custom: string) {
  return [
    ...sizeCategories
      .map((category) => {
        const value = fields[category.id].trim();
        return value ? `${category.label}: ${value}` : "";
      })
      .filter(Boolean),
    custom.trim(),
  ]
    .filter(Boolean)
    .join("; ");
}

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
        className="border-border/56 bg-[hsl(var(--surface-3))/0.6]"
      />
    </section>
  );
}

function SizeBuilder({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useI18n();
  const parsed = useMemo(() => parseSizePreferences(value), [value]);

  const updateField = (field: SizeCategoryId, nextValue: string) => {
    onChange(
      composeSizePreferences(
        {
          ...parsed.fields,
          [field]: nextValue,
        },
        parsed.custom,
      ),
    );
  };

  const updateCustom = (nextValue: string) => {
    onChange(composeSizePreferences(parsed.fields, nextValue));
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/50 bg-[hsl(var(--surface-2))/0.72] p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/9 text-primary">
          <Ruler className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold tracking-tight">{t("Размеры по категориям")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("Разделите одежду, обувь, брюки и аксессуары, чтобы друзья не угадывали по одному общему полю.")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
        {sizeCategories.map((category) => {
          const currentValue = parsed.fields[category.id];
          return (
            <div
              key={category.id}
              className="min-w-0 rounded-xl border border-border/44 bg-[hsl(var(--surface-3))/0.42] p-3"
            >
              <div className="mb-2.5">
                <Label htmlFor={`size-${category.id}`} className="text-sm font-semibold">
                  {t(category.label)}
                </Label>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{t(category.hint)}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {category.presets.map((preset) => {
                  const active = currentValue === preset;
                  return (
                    <button
                      key={preset}
                      type="button"
                      aria-pressed={active}
                      onClick={() => updateField(category.id, active ? "" : preset)}
                      className={cn(
                        "min-h-8 rounded-lg border px-2.5 text-xs font-semibold transition-[color,background-color,border-color,transform] active:scale-[0.98]",
                        active
                          ? "border-primary/42 bg-primary/13 text-foreground"
                          : "border-border/48 bg-[hsl(var(--surface-2))/0.58] text-muted-foreground hover:bg-accent hover:text-foreground",
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
                className="mt-2.5 min-h-10 border-border/56 bg-[hsl(var(--surface-2))/0.7]"
              />
            </div>
          );
        })}
      </div>

      <div>
        <Label htmlFor="size-custom" className="text-sm font-semibold">
          {t("Другое")}
        </Label>
        <Input
          id="size-custom"
          value={parsed.custom}
          onChange={(event) => updateCustom(event.target.value)}
          placeholder={t("Например, длина рукава, обхват запястья или свободная заметка")}
          maxLength={180}
          className="mt-2 border-border/56 bg-[hsl(var(--surface-3))/0.6]"
        />
      </div>
    </section>
  );
}

function PreferencesPageSkeleton() {
  return (
    <PageShell>
      <PageMain className="max-w-[92rem]">
        <div className="space-y-5 animate-pulse">
          <div className="h-24 rounded-2xl bg-muted/50" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-56 rounded-[1.35rem] bg-muted/40 md:col-span-2" />
            <div className="h-56 rounded-[1.35rem] bg-muted/35" />
            <div className="h-56 rounded-[1.35rem] bg-muted/35" />
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
  const {
    data: circleData,
    isLoading: isCircleLoading,
    error: circleError,
    mutate: mutateCircle,
  } = useSWR<CircleUsersResponse>(
    status === "authenticated" ? "/api/users/stats" : null,
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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [editingOwnProfile, setEditingOwnProfile] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [router, status]);

  useEffect(() => {
    if (data) setDraft(preferences);
  }, [data, preferences]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(preferences);
  const preferenceCount = countGiftPreferences(draft);
  const circleUsers = useMemo(() => {
    if (!data) return circleData?.users ?? [];
    const currentFromCircle = circleData?.users.find((user) => user.id === data.id);
    const currentUser: CircleUser = {
      id: data.id,
      username: data.username,
      name: data.name,
      avatarUrl: data.avatarUrl,
      giftPreferences: data.giftPreferences,
      stats: currentFromCircle?.stats ?? { totalItems: data._count?.items ?? 0 },
    };

    return [currentUser, ...(circleData?.users.filter((user) => user.id !== data.id) ?? [])];
  }, [circleData?.users, data]);

  const updateList = (key: ListPreferenceKey, value: string[]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateText = (key: "sizes" | "budget" | "notes", value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const sectionCounts: Record<EditorSection, number> = {
    likes:
      draft.favoriteCategories.length +
      draft.favoriteColors.length +
      draft.favoriteMaterials.length +
      draft.favoriteBrands.length +
      draft.hobbies.length,
    avoid:
      draft.dislikedCategories.length +
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
      await mutateCircle();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось сохранить предпочтения"));
    } finally {
      setSaving(false);
    }
  };

  const toggleProfile = (userId: string) => {
    setExpandedUserId((current) => (current === userId ? null : userId));
    setEditingOwnProfile(false);
  };

  const toggleEditor = () => {
    if (!data) return;
    if (editingOwnProfile) {
      setEditingOwnProfile(false);
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(data.id);
    setEditingOwnProfile(true);
  };

  if (status === "loading" || isLoading || isCircleLoading) return <PreferencesPageSkeleton />;

  return (
    <PageShell>
      <PageMain className="max-w-[92rem]">
        <div className="space-y-5">
          <PageIntro
            title={t("Подарочные профили")}
            description={t("Загляните в подсказки друзей перед выбором подарка. Свой профиль можно настроить прямо здесь.")}
            actions={
              <div className="flex items-center gap-3 rounded-xl border border-border/52 bg-[hsl(var(--surface-3))/0.56] px-3.5 py-2.5">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UsersRound className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
                    {t("Профилей в круге")}
                  </p>
                  <p className="text-sm font-semibold tabular-nums">{circleUsers.length}</p>
                </div>
              </div>
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
            <section className="space-y-4" aria-labelledby="circle-title">
              <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-primary/78">
                    {t("Ваш круг")}
                  </p>
                  <h2 id="circle-title" className="mt-1 text-lg font-semibold tracking-tight sm:text-xl">
                    {t("Что порадует каждого")}
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                  {t("Откройте карточку, чтобы посмотреть весь профиль. Ваша карточка всегда идёт первой.")}
                </p>
              </div>

              {circleError ? (
                <div className="flex flex-col gap-3 rounded-xl border border-destructive/24 bg-destructive/7 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span>{t("Не удалось загрузить профили друзей. Ваш профиль по-прежнему доступен.")}</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => mutateCircle()}>
                    {t("Повторить")}
                  </Button>
                </div>
              ) : null}

              <motion.div layout className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(24rem,0.92fr)] 2xl:grid-cols-[minmax(0,1.25fr)_minmax(25rem,0.75fr)]">
                {circleUsers.map((user, index) => {
                  const isCurrent = user.id === data?.id;
                  const isExpanded = expandedUserId === user.id;
                  const cardPreferences = isCurrent ? draft : user.giftPreferences;

                  return (
                    <motion.div
                      layout
                      key={user.id}
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduceMotion ? 0 : index * 0.055, duration: 0.3 }}
                      className={cn(isCurrent && "lg:col-span-2")}
                    >
                      <PreferenceProfileCard
                        id={user.id}
                        name={user.name}
                        username={user.username}
                        avatarUrl={user.avatarUrl}
                        preferences={cardPreferences}
                        wishCount={user.stats?.totalItems}
                        isCurrent={isCurrent}
                        expanded={isExpanded}
                        editing={isCurrent && editingOwnProfile}
                        onToggle={() => toggleProfile(user.id)}
                        onEdit={isCurrent ? toggleEditor : undefined}
                      >
                        {isCurrent && editingOwnProfile ? (
                          <div className="space-y-4">
                            <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary/7 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex items-center gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                                  <Gift className="h-4 w-4" aria-hidden />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold">{t("Настройка вашего профиля")}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {t("Изменения сразу видны в карточке выше")}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                className="w-full gap-2 sm:w-auto"
                                disabled={!hasChanges || saving}
                                onClick={handleSubmit}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? t("Сохраняем") : t("Сохранить")}
                              </Button>
                            </div>

                            <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[11rem_minmax(0,1fr)] xl:grid-cols-[11rem_minmax(0,1.45fr)_20rem] 2xl:grid-cols-[11rem_minmax(0,1.7fr)_22rem]">
                              <nav className={cn(uiSurface.contentPanel, "grid min-w-0 gap-1 p-2 lg:sticky lg:top-5")}>
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
                                        "group flex min-h-12 min-w-0 items-center gap-3 rounded-xl border px-3 text-left transition-[color,background-color,border-color,transform] duration-200 active:scale-[0.98]",
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
                                    className="min-w-0 space-y-4"
                                  >
                                    {activeSection === "likes" ? (
                                      <>
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
                                        <SizeBuilder
                                          value={draft.sizes}
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

                              <aside className="min-w-0 space-y-4 lg:col-span-2 xl:col-span-1 xl:sticky xl:top-5">
                                <GiftPreferencesSummary userName={t("вам")} preferences={draft} />
                                <div className={cn(uiSurface.contentPanel, "p-4 text-sm text-muted-foreground")}>
                                  <p className="font-semibold text-foreground">{t("Кто это увидит")}</p>
                                  <p className="mt-1.5 leading-relaxed">
                                    {t("Только пользователи, у которых есть доступ к вашим общим подборкам.")}
                                  </p>
                                </div>
                              </aside>
                            </div>
                          </div>
                        ) : (
                          <GiftPreferencesSummary
                            userName={isCurrent ? t("вам") : user.name}
                            preferences={cardPreferences}
                            embedded
                          />
                        )}
                      </PreferenceProfileCard>
                    </motion.div>
                  );
                })}
              </motion.div>
            </section>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
