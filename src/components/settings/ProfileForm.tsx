"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Camera } from "lucide-react";
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
      <div className={cn(uiSurface.contentPanel, "p-5 sm:p-6")}>
        <h2 className="text-lg font-semibold mb-4">{t("Профиль")}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("Аватар")}</Label>
            <div className="flex items-center gap-4">
              <UserAvatar
                avatarUrl={avatarUrl || undefined}
                name={name}
                userId={userId}
                size="lg"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setAvatarDialogOpen(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                {t("Изменить аватар")}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">{t("Логин")}</Label>
            <Input
              id="username"
              value={initialUsername}
              disabled
              className="bg-muted"
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

          <div className="space-y-3 border-t border-border pt-4">
            <div className="space-y-2">
              <Label htmlFor="telegramId">Telegram ID</Label>
              <Input
                id="telegramId"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder={t("Например: 123456789")}
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">
                {t("Статус")}: {getTelegramStatusText(initialTelegramLinkStatus, t)}. {t("После сохранения отправьте /start боту.")}
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={telegramNotificationsEnabled}
                onChange={(e) => setTelegramNotificationsEnabled(e.target.checked)}
              />
              {t("Включить Telegram-уведомления")}
            </label>
          </div>

          <Button type="submit" disabled={saving || !hasChanges}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("Сохранить")}
          </Button>
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
