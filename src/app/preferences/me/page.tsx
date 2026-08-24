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
  giftPreferenceLabels,
  isGiftPreferenceSectionFilled,
  normalizeGiftPreferences,
} from "@/lib/preferences";

type PreferencesUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
};

type SaveErrorBody = { error?: unknown; details?: unknown };

/**
 * Сервер возвращает `details` от zod, но клиент их выбрасывал и показывал
 * «Ошибка проверки данных» — тост, по которому нельзя понять, что чинить.
 */
function describeSaveError(
  body: SaveErrorBody,
  t: (key: string, values?: Record<string, string>) => string,
) {
  const issues = Array.isArray(body.details) ? body.details : [];
  const fields = new Set<string>();

  for (const issue of issues) {
    if (!issue || typeof issue !== "object") continue;
    const path = (issue as { path?: unknown }).path;
    if (!Array.isArray(path)) continue;
    const field = path.find(
      (part): part is string => typeof part === "string" && part in giftPreferenceLabels,
    );
    if (field) fields.add(giftPreferenceLabels[field as keyof typeof giftPreferenceLabels]);
  }

  if (fields.size > 0) {
    return t("Не сохранено. Проверьте: {fields}", {
      fields: [...fields].map((label) => t(label)).join(", "),
    });
  }

  return typeof body.error === "string" && body.error
    ? body.error
    : t("Не удалось сохранить предпочтения");
}

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

  const draftJson = useMemo(() => JSON.stringify(draft), [draft]);
  const preferencesJson = useMemo(() => JSON.stringify(preferences), [preferences]);
  const hasChanges = draftJson !== preferencesJson;

  useEffect(() => {
    if (!draftStorageKey) return;
    try {
      if (hasChanges) {
        window.sessionStorage.setItem(draftStorageKey, draftJson);
      } else {
        window.sessionStorage.removeItem(draftStorageKey);
      }
    } catch {
      /* приватный режим — переживём без черновика */
    }
  }, [draftJson, draftStorageKey, hasChanges]);

  // Уход со страницы через кнопку «назад» браузера или закрытие вкладки —
  // единственный путь, который приложение не контролирует.
  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasChanges]);

  const sectionFilled: Record<EditorSection, boolean> = {
    likes: isGiftPreferenceSectionFilled(draft, "likes"),
    avoid: isGiftPreferenceSectionFilled(draft, "avoid"),
    details: isGiftPreferenceSectionFilled(draft, "details"),
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
      if (!res.ok) {
        // Сервер уже возвращает `details` от zod — раньше клиент их выбрасывал
        // и показывал «Ошибка проверки данных» без единого указания, что чинить.
        throw new Error(describeSaveError(body, t));
      }
      toast.success(t("Подарочный профиль сохранён"));
      clearStoredDraft();
      // Возврат к своей раскрытой карточке, а не к свёрнутой строке с аватаром:
      // после пятнадцати минут рассказа о себе человек должен увидеть, как его
      // профиль выглядит для дарителя. Механика раскрытия и прокрутки по
      // `?userId=` уже написана — она просто не была задействована.
      router.push(data?.id ? `/preferences?userId=${data.id}` : "/preferences");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось сохранить предпочтения"));
      return;
    } finally {
      setSaving(false);
    }

    // Обе ревалидации — после успеха и вне `try`. Раньше здесь стояла только
    // одна из двух: `await mutate()` оставался внутри, и его отказ выдавал
    // «Не удалось сохранить» сразу вслед за «Профиль сохранён», а заодно
    // отменял очистку черновика и переход.
    void mutate().catch(() => {
      /* свежий профиль подтянется при следующем заходе */
    });
    void mutateCache("/api/users/stats").catch(() => {
      /* список круга обновится сам при следующем заходе */
    });
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

  /*
   * Провал загрузки раньше молчал: `data` оставалась `undefined`, анкета
   * инициализировалась пустой, и открытый редактор был неотличим от «вы ещё
   * ничего не заполняли». Черновик при этом тоже не писался — `draftStorageKey`
   * без `data.id` равен null. Пустую форму, которая ничего не сохранит,
   * показывать нельзя.
   */
  if (error && !data) {
    return (
      <PageShell>
        <PageMain>
          <PageIntro
            title={t("Подарочный профиль")}
            actions={
              <Button type="button" variant="outline" className="gap-2" onClick={requestLeave}>
                <ArrowLeft className="h-4 w-4" aria-hidden />
                {t("К предпочтениям")}
              </Button>
            }
          />
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-destructive/24 bg-destructive/5 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              {t(
                "Не удалось загрузить ваш подарочный профиль. Пока он не загрузится, править нечего.",
              )}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => mutate()}>
              {t("Повторить")}
            </Button>
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
              // Второй фон той же специфичности убран: `contentPanel` уже несёт
              // `surface-2/0.7`, и кто победит, решал порядок в сгенерированном
              // CSS. Непрозрачность здесь даёт градиент обёртки выше.
              "flex items-center justify-between gap-3 px-4 py-3",
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
