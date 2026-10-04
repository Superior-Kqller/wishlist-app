"use client";

import { useMemo, useState, type ReactNode } from "react";
import useSWR, { mutate as mutateCache } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploadDialog } from "./AvatarUploadDialog";
import { FieldError } from "@/components/ui/field-error";
import { fetcher } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";
import { getLanguageLocale } from "@/lib/i18n";
import type { BirthdayAudience, BirthdayProfile } from "@/types";
import type { ProfileGender } from "@/lib/calendar/calendar-events";
import type { TelegramLinkStatus } from "@/lib/telegram/link-status";
import { responseError } from "@/lib/response-error";

interface AudienceOption {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ProfileFormProps {
  initialName: string;
  initialUsername: string;
  initialAvatarUrl?: string | null;
  initialTelegramUsername?: string | null;
  initialTelegramLinkStatus?: TelegramLinkStatus;
  telegramAvailable?: boolean;
  initialTelegramNotificationsEnabled?: boolean;
  initialCalendarNotificationsEnabled?: boolean;
  initialBirthday?: BirthdayProfile | null;
  initialGender?: ProfileGender | null;
  initialThematicHolidayConsent?: boolean;
  userId: string;
  onSuccess: () => void;
}

/**
 * Привязка Telegram по ссылке `t.me/<bot>?start=<токен>`: бот сам узнаёт ID,
 * вводить его не нужно. Не часть формы — действует сразу, без «Сохранить».
 */
function TelegramConnection({
  status,
  username,
  available,
  onChange,
}: {
  status: TelegramLinkStatus | undefined;
  username: string | null | undefined;
  available: boolean;
  onChange: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);

  async function connect() {
    // Вкладку открываем до запроса: после await Safari считает её всплывающим окном.
    const tab = window.open("", "_blank");
    if (tab) tab.opener = null;
    setBusy(true);
    try {
      const res = await fetch("/api/users/me/telegram-link", { method: "POST" });
      if (!res.ok) throw await responseError(res, t("Не удалось получить ссылку на бота"));
      const { url } = (await res.json()) as { url: string };
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (err: unknown) {
      tab?.close();
      toast.error(err instanceof Error ? err.message : t("Не удалось получить ссылку на бота"));
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telegramId: null }),
      });
      if (!res.ok) throw await responseError(res, t("Не удалось отключить Telegram"));
      toast.success(t("Telegram отключён"));
      onChange();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("Не удалось отключить Telegram"));
    } finally {
      setBusy(false);
    }
  }

  if (status === "linked") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm">
          {t("Подключено")}
          {username ? <span className="text-muted-foreground"> · @{username}</span> : null}
        </p>
        <Button type="button" variant="outline" disabled={busy} onClick={disconnect}>
          {t("Отключить")}
        </Button>
      </div>
    );
  }

  if (!available) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("Администратор ещё не подключил Telegram-бота.")}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" disabled={busy} onClick={connect}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        {t("Подключить Telegram")}
      </Button>
      <p className="text-xs text-muted-foreground">
        {t("Откроется чат с ботом — нажмите в нём «Старт».")}
      </p>
    </div>
  );
}

/** Заголовок раздела настроек: `section-title` и одна строка пояснения. */
function SettingsHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="min-w-0">
      <h2 className="section-title">{title}</h2>
      {description ? (
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

/**
 * Раздел настроек: с 1128px — заголовок и пояснение слева, поля справа (раскладка
 * «боковых заголовков»), так форма занимает ширину контента, а не узкую колонку у
 * левого края. На телефоне — одна колонка.
 */
export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section className="grid gap-6 min-[1128px]:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] min-[1128px]:gap-16">
      <SettingsHeading title={title} description={description} />
      {children ? <div className="min-w-0 max-w-2xl space-y-6">{children}</div> : null}
    </section>
  );
}

/** Строка-переключатель: вся строка — подпись, тумблер справа. */
function SwitchRow({
  title,
  description,
  checked,
  onCheckedChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center justify-between gap-6 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        {description ? (
          <span className="mt-0.5 block text-sm leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
      <Switch checked={checked} onChange={(event) => onCheckedChange(event.target.checked)} />
    </label>
  );
}

export function ProfileForm({
  initialName,
  initialUsername,
  initialAvatarUrl,
  initialTelegramUsername,
  initialTelegramLinkStatus,
  telegramAvailable = false,
  initialTelegramNotificationsEnabled = false,
  initialCalendarNotificationsEnabled = true,
  initialBirthday = null,
  initialGender = null,
  initialThematicHolidayConsent = false,
  userId,
  onSuccess,
}: ProfileFormProps) {
  const { t, language } = useI18n();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] = useState(
    initialTelegramNotificationsEnabled,
  );
  const [calendarNotificationsEnabled, setCalendarNotificationsEnabled] = useState(
    initialCalendarNotificationsEnabled,
  );
  const [birthdayEnabled, setBirthdayEnabled] = useState(Boolean(initialBirthday));
  const [gender, setGender] = useState<ProfileGender | "">(initialGender ?? "");
  const [thematicHolidayConsent, setThematicHolidayConsent] = useState(
    initialThematicHolidayConsent,
  );
  const [birthdayDay, setBirthdayDay] = useState(
    initialBirthday ? String(initialBirthday.day) : "",
  );
  const [birthdayMonth, setBirthdayMonth] = useState(
    initialBirthday ? String(initialBirthday.month) : "",
  );
  const [birthdayYear, setBirthdayYear] = useState(
    initialBirthday?.year ? String(initialBirthday.year) : "",
  );
  const [birthdayAudience, setBirthdayAudience] = useState<BirthdayAudience>(
    initialBirthday?.audience ?? "PRIVATE",
  );
  const [selectedViewerIds, setSelectedViewerIds] = useState<string[]>(
    initialBirthday?.selectedViewerIds ?? [],
  );
  const { data: audienceData } = useSWR<{ users: AudienceOption[] }>(
    birthdayEnabled && birthdayAudience === "SELECTED" ? "/api/calendar/audience-options" : null,
    fetcher,
  );
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "birthday", string>>>({});
  const clearError = (field: keyof typeof errors) =>
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));

  const hasChanges = useMemo(() => {
    return (
      name.trim() !== initialName ||
      telegramNotificationsEnabled !== initialTelegramNotificationsEnabled ||
      calendarNotificationsEnabled !== initialCalendarNotificationsEnabled ||
      gender !== (initialGender ?? "") ||
      thematicHolidayConsent !== initialThematicHolidayConsent ||
      birthdayEnabled !== Boolean(initialBirthday) ||
      (birthdayEnabled &&
        JSON.stringify({
          day: birthdayDay,
          month: birthdayMonth,
          year: birthdayYear,
          audience: birthdayAudience,
          selectedViewerIds: [...selectedViewerIds].sort(),
        }) !==
          JSON.stringify({
            day: initialBirthday ? String(initialBirthday.day) : "",
            month: initialBirthday ? String(initialBirthday.month) : "",
            year: initialBirthday?.year ? String(initialBirthday.year) : "",
            audience: initialBirthday?.audience ?? "PRIVATE",
            selectedViewerIds: [...(initialBirthday?.selectedViewerIds ?? [])].sort(),
          }))
    );
  }, [
    initialName,
    initialTelegramNotificationsEnabled,
    initialCalendarNotificationsEnabled,
    initialGender,
    initialThematicHolidayConsent,
    initialBirthday,
    birthdayAudience,
    birthdayDay,
    birthdayEnabled,
    birthdayMonth,
    birthdayYear,
    name,
    telegramNotificationsEnabled,
    calendarNotificationsEnabled,
    gender,
    thematicHolidayConsent,
    selectedViewerIds,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Ошибка — у поля, а не во всплывающем уведомлении: фокус уходит на первое
    // неверное поле, текст под ним остаётся, пока его не поправят.
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = t("Введите имя");
    if (birthdayEnabled && (!birthdayDay || !birthdayMonth)) {
      nextErrors.birthday = t("Укажите день и месяц рождения");
    }
    setErrors(nextErrors);
    const firstInvalid = nextErrors.name
      ? "name"
      : nextErrors.birthday
        ? birthdayDay
          ? "birthdayMonth"
          : "birthdayDay"
        : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid)?.focus();
      return;
    }

    if (!hasChanges) {
      toast.info(t("Нет изменений для сохранения"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          telegramNotificationsEnabled,
          calendarNotificationsEnabled,
          gender: gender || null,
          thematicHolidayConsent,
          birthday: birthdayEnabled
            ? {
                day: Number(birthdayDay),
                month: Number(birthdayMonth),
                year: birthdayYear ? Number(birthdayYear) : null,
                audience: birthdayAudience,
                selectedViewerIds: birthdayAudience === "SELECTED" ? selectedViewerIds : [],
              }
            : null,
        }),
      });

      if (!res.ok) throw await responseError(res, t("Ошибка при обновлении профиля"));

      toast.success(t("Профиль обновлен"));
      onSuccess();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при обновлении профиля"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Разделы — плоские группы под волосяной линией (Settings Sidebar Layout,
          21st.dev): заголовок, одна строка пояснения, поля; переключатели —
          строкой «подпись слева, тумблер справа». Рамок внутри рамок нет. */}
      <form
        onSubmit={handleSubmit}
        className="divide-y divide-border [&>*]:py-8 [&>*:first-child]:pt-0 [&>*:last-child]:pb-0"
      >
        <SettingsSection title={t("Профиль")} description={t("Основные данные и способы связи")}>
          <div className="flex items-center gap-4">
            <UserAvatar
              avatarUrl={avatarUrl || undefined}
              name={name}
              userId={userId}
              size="xl"
              className="size-16 text-xl"
            />
            <Button type="button" variant="outline" onClick={() => setAvatarDialogOpen(true)}>
              <Camera className="h-4 w-4" aria-hidden />
              {t("Изменить аватар")}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">{t("Имя")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                placeholder={t("Ваше имя")}
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
                required
              />
              <FieldError id="name-error">{errors.name}</FieldError>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">{t("Логин")}</Label>
              <Input id="username" value={initialUsername} disabled />
              <p className="text-xs text-muted-foreground">{t("Логин нельзя изменить")}</p>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("День рождения")}
          description={t("Год и возраст видны только вам")}
        >
          {/* Тумблер — в колонке полей, рядом с тем, что он раскрывает. */}
          <SwitchRow
            title={t("Добавить день рождения")}
            checked={birthdayEnabled}
            onCheckedChange={setBirthdayEnabled}
          />
          {birthdayEnabled ? (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="birthdayDay">{t("День")}</Label>
                  <Input
                    id="birthdayDay"
                    type="number"
                    min={1}
                    max={31}
                    value={birthdayDay}
                    onChange={(event) => {
                      setBirthdayDay(event.target.value);
                      clearError("birthday");
                    }}
                    aria-invalid={(Boolean(errors.birthday) && !birthdayDay) || undefined}
                    aria-describedby={errors.birthday ? "birthday-error" : undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdayMonth">{t("Месяц")}</Label>
                  {/* Месяц — названием: «3» рядом с днём «8» читалось как дата наоборот. */}
                  <Select
                    value={birthdayMonth || undefined}
                    onValueChange={(value) => {
                      setBirthdayMonth(value);
                      clearError("birthday");
                    }}
                  >
                    <SelectTrigger
                      id="birthdayMonth"
                      aria-invalid={(Boolean(errors.birthday) && !birthdayMonth) || undefined}
                      aria-describedby={errors.birthday ? "birthday-error" : undefined}
                    >
                      <SelectValue placeholder="—" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, index) => (
                        <SelectItem key={index + 1} value={String(index + 1)}>
                          {new Intl.DateTimeFormat(getLanguageLocale(language), {
                            month: "long",
                            timeZone: "UTC",
                          }).format(new Date(Date.UTC(2028, index, 1)))}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthdayYear">{t("Год")}</Label>
                  <Input
                    id="birthdayYear"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={birthdayYear}
                    placeholder={t("Необязательно")}
                    onChange={(event) => setBirthdayYear(event.target.value)}
                  />
                </div>
              </div>
              <FieldError id="birthday-error">{errors.birthday}</FieldError>

              <div className="space-y-2">
                <Label htmlFor="birthdayAudience">{t("Кто видит событие")}</Label>
                <Select
                  value={birthdayAudience}
                  onValueChange={(value) => setBirthdayAudience(value as BirthdayAudience)}
                >
                  <SelectTrigger id="birthdayAudience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("Все пользователи")}</SelectItem>
                    <SelectItem value="SELECTED">{t("Выбранные пользователи")}</SelectItem>
                    <SelectItem value="PRIVATE">{t("Только я")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {birthdayAudience === "SELECTED" ? (
                <fieldset>
                  <legend className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("Выберите пользователей")}
                  </legend>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border p-1">
                    {(audienceData?.users ?? []).map((user) => (
                      <label
                        key={user.id}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2.5 hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedViewerIds.includes(user.id)}
                          onChange={(event) =>
                            setSelectedViewerIds((current) =>
                              event.target.checked
                                ? [...current, user.id]
                                : current.filter((id) => id !== user.id),
                            )
                          }
                        />
                        <UserAvatar
                          avatarUrl={user.avatarUrl}
                          name={user.name}
                          userId={user.id}
                          size="sm"
                        />
                        <span className="truncate text-sm">{user.name}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
            </div>
          ) : null}
        </SettingsSection>

        <SettingsSection
          title={t("Тематические праздники")}
          description={t("Настройте участие в поздравлениях 23 февраля и 8 марта")}
        >
          <div className="max-w-sm space-y-2">
            <Label htmlFor="profileGender">{t("Пол профиля")}</Label>
            <Select
              value={gender === "" ? "none" : gender}
              onValueChange={(value) => setGender(value === "none" ? "" : (value as ProfileGender))}
            >
              <SelectTrigger id="profileGender">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("Не указан")}</SelectItem>
                <SelectItem value="MALE">{t("Мужской")}</SelectItem>
                <SelectItem value="FEMALE">{t("Женский")}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {t("Значение видно только вам и не отображается в чужом профиле.")}
            </p>
          </div>

          <SwitchRow
            title={t("Появляться среди поздравляемых")}
            description={t(
              "Ваш пол не будет показан напрямую, но появление в тематическом празднике может косвенно раскрыть выбранное значение. Согласие можно отозвать в любой момент.",
            )}
            checked={thematicHolidayConsent}
            onCheckedChange={setThematicHolidayConsent}
          />
        </SettingsSection>

        <SettingsSection
          title={t("Telegram")}
          description={t("Уведомления о важных изменениях в списках")}
        >
          <TelegramConnection
            status={initialTelegramLinkStatus}
            username={initialTelegramUsername}
            available={telegramAvailable}
            onChange={onSuccess}
          />

          {initialTelegramLinkStatus === "linked" && (
            <div className="divide-y divide-border">
              <SwitchRow
                title={t("Telegram-уведомления")}
                description={t("Получать уведомления в подключённом чате")}
                checked={telegramNotificationsEnabled}
                onCheckedChange={setTelegramNotificationsEnabled}
              />
              <SwitchRow
                title={t("Напоминания календаря")}
                description={t("Получать в Telegram напоминания о доступных событиях")}
                checked={calendarNotificationsEnabled}
                onCheckedChange={setCalendarNotificationsEnabled}
              />
            </div>
          )}
        </SettingsSection>

        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            className="w-full sm:w-auto"
            disabled={saving || !hasChanges}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            {t("Сохранить")}
          </Button>
        </div>
      </form>

      <AvatarUploadDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatarUrl={avatarUrl}
        userName={name}
        userId={userId}
        onSuccess={() => {
          fetch("/api/users/me")
            .then((res) => res.json())
            .then((data) => {
              setAvatarUrl(data.avatarUrl);
              void mutateCache("/api/users/me", data, false);
              onSuccess();
            })
            .catch(() => {
              onSuccess();
            });
        }}
      />
    </>
  );
}
