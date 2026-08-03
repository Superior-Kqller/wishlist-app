"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate as mutateCache } from "swr";
import { ArrowLeft, Gift, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";
import {
  GiftProfileEditor,
  type EditorSection,
  type ListPreferenceKey,
} from "@/components/preferences/gift-profile-editor";
import { fetcher } from "@/lib/fetcher";
import { giftPreferencesDraftKey } from "@/lib/preferences-draft";
import { uiSurface } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";
import {
  type GiftPreferences,
  countGiftPreferences,
  emptyGiftPreferences,
  normalizeGiftPreferences,
} from "@/lib/preferences";

type PreferencesUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
};

/**
 * Редактор подарочного профиля как отдельная страница.
 *
 * Раньше это было модальное окно шириной 86rem с собственной боковой
 * навигацией и получасовой анкетой внутри — модалка обещает одно короткое
 * дело, а здесь человек рассказывает о себе. У страницы есть адрес, история
 * браузера и понятный выход: можно отвлечься и вернуться.
 */
export default function GiftProfilePage() {
  const { t } = useI18n();
  const router = useRouter();
  const { status } = useSession();

  const { data, isLoading, mutate } = useSWR<PreferencesUser>(
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
  const [discardOpen, setDiscardOpen] = useState(false);

  const draftStorageKey = data?.id ? giftPreferencesDraftKey(data.id) : null;

  const clearStoredDraft = useCallback(() => {
    if (!draftStorageKey) return;
    try {
      window.sessionStorage.removeItem(draftStorageKey);
    } catch {
      /* приватный режим — переживём без черновика */
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [router, status]);

  // Восстановление важнее инициализации: черновик этой сессии побеждает
  // сохранённые значения, иначе перезагрузка посреди заполнения стёрла бы
  // работу молча.
  useEffect(() => {
    if (!data || !draftStorageKey) return;
    try {
      const stored = window.sessionStorage.getItem(draftStorageKey);
      if (stored) {
        setDraft(normalizeGiftPreferences(JSON.parse(stored)));
        return;
      }
    } catch {
      /* повреждённый черновик игнорируем */
    }
    setDraft(preferences);
  }, [data, draftStorageKey, preferences]);

  const hasChanges = JSON.stringify(draft) !== JSON.stringify(preferences);

  useEffect(() => {
    if (!draftStorageKey) return;
    try {
      if (hasChanges) {
        window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draft));
      } else {
        window.sessionStorage.removeItem(draftStorageKey);
      }
    } catch {
      /* приватный режим — переживём без черновика */
    }
  }, [draft, draftStorageKey, hasChanges]);

  // Уход со страницы через кнопку «назад» браузера или закрытие вкладки —
  // единственный путь, который приложение не контролирует.
  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  const preferenceCount = countGiftPreferences(draft);

  const sectionCounts: Record<EditorSection, number> = {
    likes:
      draft.favoriteBrands.length +
      draft.favoriteColors.length +
      draft.favoriteCategories.length +
      draft.hobbies.length +
      draft.favoriteMaterials.length,
    avoid: draft.dislikedColors.length + draft.dislikedBrands.length + draft.doNotBuy.length,
    details:
      Number(Boolean(draft.sizes)) +
      draft.occasions.length +
      Number(Boolean(draft.budget)) +
      Number(Boolean(draft.notes)),
  };

  const updateList = (key: ListPreferenceKey, value: string[]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const updateText = (key: "sizes" | "budget" | "notes", value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
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
      clearStoredDraft();
      router.push("/preferences");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось сохранить предпочтения"));
    } finally {
      setSaving(false);
    }
  };

  const requestLeave = () => {
    if (hasChanges) {
      setDiscardOpen(true);
      return;
    }
    router.push("/preferences");
  };

  const discardDraft = () => {
    setDraft(preferences);
    clearStoredDraft();
    setDiscardOpen(false);
    router.push("/preferences");
  };

  if (status === "loading" || isLoading) {
    return (
      <PageShell>
        <PageMain>
          <div className="animate-pulse space-y-5">
            <div className="h-24 rounded-2xl bg-muted/50" />
            <div className="h-[28rem] rounded-2xl bg-muted/40" />
          </div>
        </PageMain>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageMain>
        <PageIntro
          title={t("Подарочный профиль")}
          description={t(
            "Разделите бренды, цвета, категории, стоп-лист и детали. Это подсказки для тех, кто выбирает вам подарок.",
          )}
          actions={
            <Button type="button" variant="outline" className="gap-2" onClick={requestLeave}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("К предпочтениям")}
            </Button>
          }
        />

        {/*
         * «Кто это увидит» стоит до первого поля, а не в хвосте правой
         * колонки: это единственная опора, снимающая неловкость публичного
         * рассказа о себе, и нужна она раньше, чем человек начнёт отвечать.
         */}
        <div className="mb-5 rounded-xl border border-border/42 bg-[hsl(var(--surface-2)/0.44)] px-4 py-3 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">{t("Кто это увидит")}</p>
          <p className="mt-1 leading-relaxed">
            {t("Только пользователи, у которых есть доступ к вашим общим подборкам.")}
          </p>
        </div>

        <div
          className={cn(
            uiSurface.contentPanel,
            "mb-5 flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
              <Gift className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold">{t("Ваш профиль")}</p>
              <p className="text-xs text-muted-foreground">
                {t("Заполнено подсказок")}: <span className="tabular-nums">{preferenceCount}</span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            className="w-full gap-2 sm:w-auto"
            disabled={!hasChanges || saving}
            onClick={handleSubmit}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {saving ? t("Сохраняем") : t("Сохранить")}
          </Button>
        </div>

        <GiftProfileEditor
          draft={draft}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sectionCounts={sectionCounts}
          updateList={updateList}
          updateText={updateText}
        />

        <ConfirmDialog
          open={discardOpen}
          onOpenChange={setDiscardOpen}
          title={t("Уйти без сохранения?")}
          description={t("Заполненные подсказки не сохранятся.")}
          confirmLabel={t("Отменить правки")}
          cancelLabel={t("Продолжить редактирование")}
          variant="destructive"
          onConfirm={discardDraft}
        />
      </PageMain>
    </PageShell>
  );
}
