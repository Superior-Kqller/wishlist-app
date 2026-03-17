"use client";

import { useState } from "react";
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
  userId: string;
  onSuccess: () => void;
}

export function ProfileForm({
  initialName,
  initialUsername,
  initialAvatarUrl,
  userId,
  onSuccess,
}: ProfileFormProps) {
  const [name, setName] = useState(initialName);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Введите имя");
      return;
    }

    if (name === initialName) {
      toast.info("Нет изменений для сохранения");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка при обновлении профиля");
      }

      toast.success("Профиль обновлен");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Ошибка при обновлении профиля");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Профиль</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Аватар */}
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

          <Button type="submit" disabled={saving || name === initialName}>
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
          // Обновляем локальное состояние после успешной загрузки
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
