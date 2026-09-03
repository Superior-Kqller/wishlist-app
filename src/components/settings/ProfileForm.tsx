"use client";

import { useMemo, useState } from "react";
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
import { CalendarDays, Camera, Loader2, Send, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploadDialog } from "./AvatarUploadDialog";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";
import { fetcher } from "@/lib/fetcher";
import type { BirthdayAudience, BirthdayProfile } from "@/types";
import type { ProfileGender } from "@/lib/calendar/profile-gender";

interface AudienceOption {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface ProfileFormProps {
  initialName: string;
  initialUsername: string;
  initialAvatarUrl?: string | null;
  initialTelegramId?: string | null;
  initialTelegramLinkStatus?: "not_configured" | "pending" | "linked";
  initialTelegramNotificationsEnabled?: boolean;
  initialCalendarNotificationsEnabled?: boolean;
  initialBirthday?: BirthdayProfile | null;
  initialGender?: ProfileGender | null;
  initialThematicHolidayConsent?: boolean;
  userId: string;
  onSuccess: () => void;
}

function getTelegramStatusText(
  status: "not_configured" | "pending" | "linked" | undefined,
  t: (key: string) => string,
): string {
  if (status === "linked") return t("Подключено");
  if (status === "pending") return t("Ожидает подтверждения");
  return t("Не настроено");
}

export function ProfileForm({
  initialName,
  initialUsername,
  initialAvatarUrl,
  initialTelegramId,
  initialTelegramLinkStatus,
  initialTelegramNotificationsEnabled = false,
  initialCalendarNotificationsEnabled = true,
  initialBirthday = null,
  initialGender = null,
  initialThematicHolidayConsent = false,
  userId,
  onSuccess,
}: ProfileFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [telegramId, setTelegramId] = useState(initialTelegramId ?? "");
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

  const hasChanges = useMemo(() => {
    return (
      name.trim() !== initialName ||
      telegramId.trim() !== (initialTelegramId ?? "") ||
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
    initialTelegramId,
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
    telegramId,
    telegramNotificationsEnabled,
    calendarNotificationsEnabled,
    gender,
    thematicHolidayConsent,
    selectedViewerIds,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t("Введите имя"));
      return;
    }

    if (telegramId.trim() && !/^\d{5,20}$/.test(telegramId.trim())) {
      toast.error(t("Telegram ID должен содержать только цифры (5-20 символов)"));
      return;
    }

    if (birthdayEnabled && (!birthdayDay || !birthdayMonth)) {
      toast.error(t("Укажите день и месяц рождения"));
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
          telegramId: telegramId.trim() ? telegramId.trim() : null,
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

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("Ошибка при обновлении профиля"));
      }

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
      <div className={cn(uiSurface.contentPanel, "p-4 sm:p-6")}>
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/55 bg-[hsl(var(--surface-3))] text-primary-accent">
            <UserRound className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">{t("Профиль")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {t("Основные данные и способы связи")}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.42)] p-3.5">
            <div className="flex items-center gap-3">
              <UserAvatar
                avatarUrl={avatarUrl || undefined}
                name={name}
                userId={userId}
                size="lg"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-auto"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Camera className="mr-2 h-4 w-4" />
                {t("Изменить аватар")}
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username">{t("Логин")}</Label>
              <Input id="username" value={initialUsername} disabled className="bg-muted/45" />
              <p className="text-xs text-muted-foreground">{t("Логин нельзя изменить")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("Имя")} *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Ваше имя")}
                required
              />
            </div>
          </div>

          <div className="space-y-4 border-t border-border/45 pt-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-3))] text-primary-accent">
                <UsersRound className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{t("Тематические праздники")}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t("Настройте участие в поздравлениях 23 февраля и 8 марта")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileGender">{t("Пол профиля")}</Label>
              <Select
                value={gender === "" ? "none" : gender}
                onValueChange={(value) =>
                  setGender(value === "none" ? "" : (value as ProfileGender))
                }
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

            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.36)] px-3.5 py-3">
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {t("Появляться среди поздравляемых")}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {t(
                    "Ваш пол не будет показан напрямую, но появление в тематическом празднике может косвенно раскрыть выбранное значение. Согласие можно отозвать в любой момент.",
                  )}
                </span>
              </span>
              <Switch
                className="mt-1"
                checked={thematicHolidayConsent}
                onChange={(event) => setThematicHolidayConsent(event.target.checked)}
              />
            </label>
          </div>

          <div className="space-y-4 border-t border-border/45 pt-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-3))] text-primary-accent">
                <CalendarDays className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">{t("День рождения")}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t("Год и возраст видны только вам")}
                </p>
              </div>
              <Switch
                checked={birthdayEnabled}
                onChange={(event) => setBirthdayEnabled(event.target.checked)}
                aria-label={t("Добавить день рождения")}
              />
            </div>

            {birthdayEnabled ? (
              <div className="space-y-4 rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.36)] p-3.5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="birthdayDay">{t("День")}</Label>
                    <Input
                      id="birthdayDay"
                      type="number"
                      min={1}
                      max={31}
                      value={birthdayDay}
                      onChange={(event) => setBirthdayDay(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="birthdayMonth">{t("Месяц")}</Label>
                    <Input
                      id="birthdayMonth"
                      type="number"
                      min={1}
                      max={12}
                      value={birthdayMonth}
                      onChange={(event) => setBirthdayMonth(event.target.value)}
                    />
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
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("Выберите пользователей")}
                    </p>
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-border/55 p-2">
                      {(audienceData?.users ?? []).map((user) => (
                        <label
                          key={user.id}
                          className="flex min-h-10 cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-accent/45"
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
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-4 border-t border-border/45 pt-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--surface-3))] text-primary-accent">
                <Send className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold">{t("Telegram")}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {t("Уведомления о важных изменениях в списках")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegramId">Telegram ID</Label>
              <Input
                id="telegramId"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder={t("Например: 123456789")}
                inputMode="numeric"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/55 bg-background/32 px-2 py-1">
                  {t("Статус")}: {getTelegramStatusText(initialTelegramLinkStatus, t)}
                </span>
                <span>{t("После сохранения отправьте /start боту.")}</span>
              </div>
            </div>

            <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.36)] px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t("Telegram-уведомления")}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("Получать уведомления в подключённом чате")}
                </span>
              </span>
              <Switch
                checked={telegramNotificationsEnabled}
                onChange={(e) => setTelegramNotificationsEnabled(e.target.checked)}
              />
            </label>
            <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.36)] px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t("Напоминания календаря")}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("Получать в Telegram напоминания о доступных событиях")}
                </span>
              </span>
              <Switch
                checked={calendarNotificationsEnabled}
                onChange={(event) => setCalendarNotificationsEnabled(event.target.checked)}
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={saving || !hasChanges}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("Сохранить")}
            </Button>
          </div>
        </form>
      </div>

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
