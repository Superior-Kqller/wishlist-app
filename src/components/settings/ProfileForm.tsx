"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Camera } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUploadDialog } from "./AvatarUploadDialog";

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

function getTelegramStatusText(status: "not_configured" | "pending" | "linked" | undefined): string {
  if (status === "linked") return "Подключено";
  if (status === "pending") return "Ожидает подтверждения";
  return "Не настроено";
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
      toast.error("Введите имя");
      return;
    }

    if (telegramId.trim() && !/^\d{5,20}$/.test(telegramId.trim())) {
      toast.error("Telegram ID должен содержать только цифры (5-20 символов)");
      return;
    }

    if (!hasChanges) {
      toast.info("Нет изменений для сохранения");
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
        throw new Error(error.error || "Ошибка при обновлении профиля");
      }

      toast.success("Профиль обновлен");
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Ошибка при обновлении профиля",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Профиль</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Аватар</Label>
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
                Изменить аватар
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Логин</Label>
            <Input
              id="username"
              value={initialUsername}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Логин нельзя изменить
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
            />
          </div>

          <div className="pt-2 border-t space-y-3">
            <div className="space-y-2">
              <Label htmlFor="telegramId">Telegram ID</Label>
              <Input
                id="telegramId"
                value={telegramId}
                onChange={(e) => setTelegramId(e.target.value)}
                placeholder="Например: 123456789"
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">
                Статус: {getTelegramStatusText(initialTelegramLinkStatus)}. После сохранения отправьте /start боту.
              </p>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={telegramNotificationsEnabled}
                onChange={(e) => setTelegramNotificationsEnabled(e.target.checked)}
              />
              Включить Telegram-уведомления
            </label>
          </div>

          <Button type="submit" disabled={saving || !hasChanges}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Сохранить
          </Button>
        </form>
      </Card>

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
