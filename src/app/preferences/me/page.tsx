"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR, { mutate as mutateCache } from "swr";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { Button, useDoneFlash } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RetryNotice } from "@/components/ui/retry-notice";
import { PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";
import {
  GiftProfileEditor,
  type EditorSection,
  type ListPreferenceKey,
} from "@/components/preferences/gift-profile-editor";
import { giftPreferencesDraftKey } from "@/lib/preference-profiles";
import { fetcher } from "@/lib/utils";
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
    : t("Не удалось сохранить профиль");
}

/**
 * Шапка редактора: круглая кнопка «назад», заголовок страницы 28/700 и одна
 * строка о том, кто это увидит, — единственная опора, снимающая неловкость
 * публичного рассказа о себе.
 */
function EditorHeader({ onBack, description }: { onBack: () => void; description?: string }) {
  const { t } = useI18n();
  return (
    <div className="mb-8 flex items-start gap-4 sm:mb-10">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="mt-0.5 shrink-0 rounded-full"
        onClick={onBack}
        aria-label={t("К подарочным профилям")}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
      </Button>
      <div className="min-w-0">
        <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">
          {t("Подарочный профиль")}
        </h1>
        {description ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
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
  const [done, flashDone] = useDoneFlash();
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
      flashDone();
      clearStoredDraft();
      // Возврат к своей раскрытой карточке, а не к свёрнутой строке с аватаром:
      // после пятнадцати минут рассказа о себе человек должен увидеть, как его
      // профиль выглядит для дарителя. Механика раскрытия и прокрутки по
      // `?userId=` уже написана — она просто не была задействована.
      router.push(data?.id ? `/preferences?userId=${data.id}` : "/preferences");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Не удалось сохранить профиль"));
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
          <div className="animate-pulse">
            <div className="mb-10 flex gap-4">
              <div className="size-10 rounded-full bg-muted/55" />
              <div className="h-16 w-full max-w-md rounded-lg bg-muted/55" />
            </div>
            <div className="grid gap-8 min-[1128px]:grid-cols-[15rem_minmax(0,1fr)] min-[1128px]:gap-16">
              <div className="h-12 rounded-full bg-muted/55 min-[1128px]:h-40 min-[1128px]:rounded-xl" />
              <div className="h-[28rem] max-w-3xl rounded-xl bg-muted/45" />
            </div>
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
          <EditorHeader onBack={requestLeave} />
          <RetryNotice onRetry={() => mutate()}>
            {t(
              "Не удалось загрузить ваш подарочный профиль. Пока он не загрузится, править нечего.",
            )}
          </RetryNotice>
        </PageMain>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageMain>
        {/* Плашка «Заполнено подсказок: N» убрана целиком: она измеряла
            откровенность анкеты числом. */}
        <EditorHeader
          onBack={requestLeave}
          description={t(
            "Подсказки для тех, кто выбирает вам подарок. Их видят только участники, у которых есть доступ к вашим общим подборкам.",
          )}
        />

        <GiftProfileEditor
          draft={draft}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          sectionFilled={sectionFilled}
          updateList={updateList}
          updateText={updateText}
          footer={
            /*
             * Сохранение не уезжает вверх вместе с прокруткой: анкета длинная.
             * Сплошной холст с волосяной линией сверху (без градиента), на
             * телефоне — над нижней панелью разделов.
             */
            <div className="sticky bottom-[var(--bottom-nav-clearance)] z-20 mt-10 flex items-center justify-between gap-3 border-t border-border bg-background py-4 after:absolute after:inset-x-0 after:top-full after:h-3 after:bg-background">
              <p className="min-w-0 truncate text-sm text-muted-foreground" aria-live="polite">
                {hasChanges ? t("Не сохранено") : t("Сохранено")}
              </p>
              <Button
                type="button"
                size="lg"
                className="shrink-0 gap-2"
                disabled={!hasChanges || saving}
                onClick={handleSubmit}
                status={saving ? "loading" : done ? "done" : "idle"}
              >
                <Save className="h-4 w-4" aria-hidden />
                {t("Сохранить")}
              </Button>
            </div>
          }
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
