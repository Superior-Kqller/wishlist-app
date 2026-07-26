"use client";

import { useMemo, useState } from "react";
import { mutate as mutateCache } from "swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploadDialog } from "./AvatarUploadDialog";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";

interface ProfileFormProps {
  initialName: string;
  initialUsername: string;
  initialAvatarUrl?: string | null;
  initialTelegramId?: string | null;
  initialTelegramLinkStatus?: "not_configured" | "pending" | "linked";
  initialTelegramNotificationsEnabled?: boolean;
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
  userId,
  onSuccess,
}: ProfileFormProps) {
  const { t } = useI18n();
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [telegramId, setTelegramId] = useState(initialTelegramId ?? "");
  const [telegramNotificationsEnabled, setTelegramNotificationsEnabled] = useState(
    initialTelegramNotificationsEnabled
  );
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanges = useMemo(() => {
    return (
      name.trim() !== initialName ||
      telegramId.trim() !== (initialTelegramId ?? "") ||
      telegramNotificationsEnabled !== initialTelegramNotificationsEnabled
    );
  }, [
    initialName,
    initialTelegramId,
    initialTelegramNotificationsEnabled,
    name,
    telegramId,
    telegramNotificationsEnabled,
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
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("Ошибка при обновлении профиля"));
      }

      toast.success(t("Профиль обновлен"));
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("Ошибка при обновлении профиля"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className={cn(uiSurface.contentPanel, "p-4 sm:p-6")}>
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
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
          <div className="rounded-xl border border-border/55 bg-[hsl(var(--surface-2))/0.42] p-3.5">
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
              <Input
                id="username"
                value={initialUsername}
                disabled
                className="bg-muted/45"
              />
              <p className="text-xs text-muted-foreground">
                {t("Логин нельзя изменить")}
              </p>
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

          <div className="space-y-4 border-t border-border/40 pt-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/9 text-primary">
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
                <span className="rounded-full border border-border/55 bg-background/30 px-2 py-1">
                  {t("Статус")}: {getTelegramStatusText(initialTelegramLinkStatus, t)}
                </span>
                <span>{t("После сохранения отправьте /start боту.")}</span>
              </div>
            </div>

            <label className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-xl border border-border/55 bg-[hsl(var(--surface-2))/0.36] px-3.5 py-2.5">
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {t("Telegram-уведомления")}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {t("Получать уведомления в подключённом чате")}
                </span>
              </span>
              <input
                type="checkbox"
                className="peer sr-only"
                checked={telegramNotificationsEnabled}
                onChange={(e) => setTelegramNotificationsEnabled(e.target.checked)}
              />
              <span
                aria-hidden
                className="relative h-6 w-11 shrink-0 rounded-full border border-border/70 bg-muted transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-foreground/75 after:shadow-sm after:transition-transform peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-checked:border-primary/50 peer-checked:bg-primary/70 peer-checked:after:translate-x-5 peer-checked:after:bg-primary-foreground"
              />
            </label>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={saving || !hasChanges}
            >
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
