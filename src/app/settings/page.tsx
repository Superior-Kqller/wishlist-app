"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { ThemeSection } from "@/components/settings/ThemeSection";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fetcher } from "@/lib/fetcher";

export default function SettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: user, isLoading, mutate } = useSWR(
    status === "authenticated" ? "/api/users/me" : null,
    fetcher
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading || !user) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Настройки
            </h1>
            <p className="text-muted-foreground mt-1">
              Управление вашим профилем и паролем
            </p>
          </div>

          <div className="space-y-6">
            <ThemeSection />

            <ProfileForm
              key={`profile-${refreshKey}`}
              initialName={user.name}
              initialUsername={user.username}
              initialAvatarUrl={user.avatarUrl}
              userId={user.id}
              onSuccess={handleSuccess}
            />

            <PasswordForm key={`password-${refreshKey}`} />

            <div className="p-6 border rounded-lg bg-muted/30">
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
