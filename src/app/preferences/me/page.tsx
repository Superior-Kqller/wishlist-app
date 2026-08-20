"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate as mutateCache } from "swr";
import { ArrowLeft, Loader2, Save } from "lucide-react";
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

  const sectionFilled: Record<EditorSection, boolean> = {
    likes: Boolean(
      draft.favoriteBrands.length ||
      draft.favoriteColors.length ||
      draft.favoriteCategories.length ||
      draft.hobbies.length ||
      draft.favoriteMaterials.length,
    ),
    avoid: Boolean(
      draft.dislikedColors.length ||
      draft.dislikedBrands.length ||
      draft.dislikedCategories.length ||
      draft.dislikedMaterials.length ||
      draft.doNotBuy.length,
    ),
    details: Boolean(draft.sizes || draft.occasions.length || draft.budget || draft.notes),
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
            <div className="h-24 rounded-2xl bg-muted/55" />
            <div className="h-[28rem] rounded-2xl bg-muted/45" />
          </div>
        </PageMain>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageMain>
        {/*
         * Три сложенных блока до первого поля стали одним. «Кто это увидит»
         * никуда не делось — это единственная опора, снимающая неловкость
         * публичного рассказа о себе, — но ему хватает строки описания, а не
         * собственной панели с заголовком. Плашка «Заполнено подсказок: N»
         * убрана целиком: она измеряла откровенность анкеты числом.
         */}
        <PageIntro
          title={t("Подарочный профиль")}
          description={t(
            "Подсказки для тех, кто выбирает вам подарок. Их видят только участники, у которых есть доступ к вашим общим подборкам.",
          )}
          actions={
            <Button type="button" variant="outline" className="gap-2" onClick={requestLeave}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t("К предпочтениям")}
            </Button>
          }
        />

        <GiftProfileEditor
          draft={draft}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sectionFilled={sectionFilled}
          updateList={updateList}
          updateText={updateText}
        />

        {/*
         * Сохранение больше не уезжает вверх вместе с прокруткой: анкета
         * длинная, и кнопка, до которой надо возвращаться, — это шаг, который
         * форма может не требовать.
         */}
        <div className="sticky bottom-0 z-20 -mx-4 mt-5 bg-gradient-to-t from-background via-background to-transparent px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 sm:-mx-6 sm:px-6 xl:-mx-8 xl:px-8">
          <div
            className={cn(
              uiSurface.contentPanel,
              "flex items-center justify-between gap-3 bg-[hsl(var(--surface-2))] px-4 py-3",
            )}
          >
            <p className="min-w-0 truncate text-sm text-muted-foreground" aria-live="polite">
              {hasChanges ? t("Не сохранено") : t("Сохранено")}
            </p>
            <Button
              type="button"
              className="shrink-0 gap-2"
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
        </div>

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
