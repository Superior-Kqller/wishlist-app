"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: user, isLoading, error, mutate } = useSWR(
    status === "authenticated" ? "/api/users/me" : null,
    fetcher
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">Не удалось загрузить профиль</p>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            Повторить
          </Button>
        </div>
      </div>
    );
  }

  const handleSuccess = () => {
    mutate();
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen page-bg">
      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-[hsl(var(--surface-2))] px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.28)] sm:px-5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Настройки
            </h1>
            <p className="text-muted-foreground mt-1">
              Управление вашим профилем и паролем
            </p>
          </div>

          <div className="space-y-6">
            <ProfileForm
              key={`profile-${refreshKey}`}
              initialName={user.name}
              initialUsername={user.username}
              initialAvatarUrl={user.avatarUrl}
              initialTelegramId={user.telegramId}
              initialTelegramLinkStatus={user.telegramLinkStatus}
              initialTelegramNotificationsEnabled={Boolean(user.telegramNotificationsEnabled)}
              userId={user.id}
              onSuccess={handleSuccess}
            />

            <PasswordForm key={`password-${refreshKey}`} />

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-medium mb-2">Информация</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Роль:</span>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "outline"}
                  >
                    {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Создан:</span>
                  <span>
                    {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
