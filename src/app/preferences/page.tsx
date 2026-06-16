"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate } from "swr";
import { Gift, Heart, Loader2, Palette, Ruler, Save, ShieldAlert, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";
import { fetcher } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import {
  type GiftPreferences,
  emptyGiftPreferences,
  joinPreferenceList,
  normalizeGiftPreferences,
  splitPreferenceList,
} from "@/lib/preferences";

type PreferencesUser = {
  giftPreferences?: GiftPreferences | null;
};

type PreferenceListKey =
  | "favoriteColors"
  | "dislikedColors"
  | "favoriteMaterials"
  | "dislikedMaterials"
  | "favoriteBrands"
  | "dislikedBrands"
  | "hobbies"
  | "doNotBuy"
  | "occasions";

type PreferenceTextKey = "sizes" | "budget" | "notes";
type PreferenceDraft = Record<PreferenceListKey | PreferenceTextKey, string>;

const listFields: Array<{
  key: PreferenceListKey;
  label: string;
  placeholder: string;
}> = [
  { key: "favoriteColors", label: "Любимые цвета", placeholder: "розовый, голубой, фисташковый" },
  { key: "dislikedColors", label: "Не любит цвета", placeholder: "черный, кислотный зеленый" },
  { key: "favoriteMaterials", label: "Приятные материалы", placeholder: "серебро, хлопок, кожа" },
  { key: "dislikedMaterials", label: "Избегать материалов", placeholder: "шерсть, никель, синтетика" },
  { key: "favoriteBrands", label: "Любимые бренды", placeholder: "Casio, Apple, Uniqlo" },
  { key: "dislikedBrands", label: "Не нравится", placeholder: "бренды или магазины, которые лучше не брать" },
  { key: "hobbies", label: "Интересы", placeholder: "бег, кофе, настолки, рисование" },
  { key: "doNotBuy", label: "Не покупать", placeholder: "часы, духи, свечи, сладкое" },
  { key: "occasions", label: "Поводы", placeholder: "день рождения, Новый год, просто так" },
];

function draftFromPreferences(preferences: GiftPreferences): PreferenceDraft {
  return {
    favoriteColors: joinPreferenceList(preferences.favoriteColors),
    dislikedColors: joinPreferenceList(preferences.dislikedColors),
    sizes: preferences.sizes,
    favoriteMaterials: joinPreferenceList(preferences.favoriteMaterials),
    dislikedMaterials: joinPreferenceList(preferences.dislikedMaterials),
    favoriteBrands: joinPreferenceList(preferences.favoriteBrands),
    dislikedBrands: joinPreferenceList(preferences.dislikedBrands),
    hobbies: joinPreferenceList(preferences.hobbies),
    doNotBuy: joinPreferenceList(preferences.doNotBuy),
    occasions: joinPreferenceList(preferences.occasions),
    budget: preferences.budget,
    notes: preferences.notes,
  };
}

function preferencesFromDraft(draft: PreferenceDraft): GiftPreferences {
  return {
    favoriteColors: splitPreferenceList(draft.favoriteColors),
    dislikedColors: splitPreferenceList(draft.dislikedColors),
    sizes: draft.sizes.trim(),
    favoriteMaterials: splitPreferenceList(draft.favoriteMaterials),
    dislikedMaterials: splitPreferenceList(draft.dislikedMaterials),
    favoriteBrands: splitPreferenceList(draft.favoriteBrands),
    dislikedBrands: splitPreferenceList(draft.dislikedBrands),
    hobbies: splitPreferenceList(draft.hobbies),
    doNotBuy: splitPreferenceList(draft.doNotBuy),
    occasions: splitPreferenceList(draft.occasions),
    budget: draft.budget.trim(),
    notes: draft.notes.trim(),
  };
}

function PreferenceTextarea({
  id,
  label,
  value,
  placeholder,
  onChange,
  rows = 2,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  const { t } = useI18n();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t(label)}</Label>
      <Textarea
        id={id}
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        placeholder={t(placeholder)}
        className="min-h-20 resize-y border-border/62 bg-[hsl(var(--surface-2))/0.68]"
      />
    </div>
  );
}

export default function PreferencesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { status } = useSession();
  const { data, isLoading, error } = useSWR<PreferencesUser>(
    status === "authenticated" ? "/api/users/me" : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const preferences = useMemo(
    () => normalizeGiftPreferences(data?.giftPreferences),
    [data?.giftPreferences],
  );
  const [draft, setDraft] = useState<PreferenceDraft>(() =>
    draftFromPreferences(emptyGiftPreferences),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [router, status]);

  useEffect(() => {
    if (!data) return;
    setDraft(draftFromPreferences(preferences));
  }, [data, preferences]);

  const nextPreferences = useMemo(() => preferencesFromDraft(draft), [draft]);
  const hasChanges = JSON.stringify(nextPreferences) !== JSON.stringify(preferences);
  const warningChips = [
    ...nextPreferences.dislikedColors,
    ...nextPreferences.dislikedMaterials,
    ...nextPreferences.dislikedBrands,
    ...nextPreferences.doNotBuy,
  ].slice(0, 8);

  const updateDraft = (key: keyof PreferenceDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ giftPreferences: nextPreferences }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || t("Не удалось сохранить предпочтения"));
      }
      toast.success(t("Предпочтения сохранены"));
      await mutate("/api/users/me");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось сохранить предпочтения"));
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <PageShell className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageMain className="max-w-6xl">
        <div className="space-y-5">
          <PageIntro
            title={t("Предпочтения")}
            description={t("Подсказки для подарков: что нравится, что лучше не покупать и какие детали важно проверить перед покупкой.")}
            actions={
              <Button
                type="button"
                className="w-full gap-2 sm:w-auto"
                disabled={!hasChanges || saving || Boolean(error)}
                onClick={handleSubmit}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t("Сохранить")}
              </Button>
            }
          />

          {error ? (
            <div className={cn(uiSurface.emptyState, "px-4 py-8")}>
              <p className="text-sm font-semibold">{t("Не удалось загрузить профиль")}</p>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
              <section className={cn(uiSurface.contentPanel, "space-y-5 p-4 sm:p-5")}>
                <div className="grid gap-4 md:grid-cols-2">
                  {listFields.map((field) => (
                    <PreferenceTextarea
                      key={field.key}
                      id={field.key}
                      label={field.label}
                      value={draft[field.key]}
                      placeholder={field.placeholder}
                      onChange={(value) => updateDraft(field.key, value)}
                    />
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <PreferenceTextarea
                    id="sizes"
                    label="Размеры"
                    value={draft.sizes}
                    placeholder="одежда M, обувь 38, кольцо 17"
                    onChange={(value) => updateDraft("sizes", value)}
                  />
                  <PreferenceTextarea
                    id="budget"
                    label="Бюджетные ориентиры"
                    value={draft.budget}
                    placeholder="до 5000 ₽ без согласования, дороже лучше обсудить"
                    onChange={(value) => updateDraft("budget", value)}
                  />
                </div>

                <PreferenceTextarea
                  id="notes"
                  label="Заметки для дарителя"
                  value={draft.notes}
                  placeholder="аллергии, любимые магазины, упаковка, доставка, важные нюансы"
                  rows={4}
                  onChange={(value) => updateDraft("notes", value)}
                />
              </section>

              <aside className="space-y-4">
                <section className={cn(uiSurface.contentPanel, "p-4")}>
                  <div className="mb-3 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" aria-hidden />
                    <h2 className="text-sm font-semibold">{t("Проверь перед покупкой")}</h2>
                  </div>
                  {warningChips.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {warningChips.map((chip) => (
                        <Badge
                          key={chip}
                          variant="outline"
                          className="border-destructive/34 bg-destructive/8 text-destructive"
                        >
                          {chip}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("Добавьте цвета, материалы или вещи, которые лучше не покупать.")}
                    </p>
                  )}
                </section>

                <section className={cn(uiSurface.contentPanel, "space-y-3 p-4")}>
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" aria-hidden />
                    <h2 className="text-sm font-semibold">{t("Идеи по профилю")}</h2>
                  </div>
                  <div className="grid gap-2 text-sm text-muted-foreground">
                    <p className="flex gap-2">
                      <Palette className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {t("Сверяйте цвет товара с любимыми и нелюбимыми цветами.")}
                    </p>
                    <p className="flex gap-2">
                      <Ruler className="mt-0.5 h-4 w-4 shrink-0 text-info" aria-hidden />
                      {t("Для одежды, украшений и обуви сначала смотрите размеры.")}
                    </p>
                    <p className="flex gap-2">
                      <Heart className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      {t("Интересы помогают выбрать подарок без точной ссылки.")}
                    </p>
                    <p className="flex gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                      {t("Если товар попадает в «не покупать», лучше уточнить заранее.")}
                    </p>
                  </div>
                </section>
              </aside>
            </div>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
