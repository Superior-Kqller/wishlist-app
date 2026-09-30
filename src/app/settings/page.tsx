"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { Loader2, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetcher } from "@/lib/utils";
import { PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";

export default function SettingsPage() {
  const { t, locale } = useI18n();
  const { status } = useSession();
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    data: user,
    isLoading,
    error,
    mutate,
  } = useSWR(status === "authenticated" ? "/api/users/me" : null, fetcher);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || isLoading) {
    return (
      <PageShell className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  if (error || !user) {
    return (
      <PageShell className="flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-destructive font-medium">{t("Не удалось загрузить профиль")}</p>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            {t("Повторить")}
          </Button>
        </div>
      </PageShell>
    );
  }

  const handleSuccess = () => {
    mutate();
    setRefreshKey((k) => k + 1);
  };

  return (
    <PageShell>
      <PageMain>
        {/* Настройки живут в меню аккаунта, а не в верхней панели — поэтому
            заголовок видимый, 28/700 (DESIGN.md → «Типографика»). Роль и дата
            — одной строкой `muted` вместо плашек. */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-[1.75rem] font-bold leading-tight tracking-[-0.02em]">
            {t("Настройки")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.role === "ADMIN" ? t("Администратор") : t("Пользователь")} · {t("С нами с")}{" "}
            {new Date(user.createdAt).toLocaleDateString(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>

        {/* Форма — колонка чтения, а не рамка страницы: во всю ширину
              переключатель стоял в 900px от своей подписи, а поле «Пол
              профиля» тянулось на 1100px ради двух слов. */}
        <Tabs defaultValue="profile" className="grid max-w-3xl gap-8">
          <TabsList aria-label={t("Разделы настроек")} className="sm:max-w-sm">
            <TabsTrigger value="profile">
              <UserRound className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t("Профиль")}</span>
            </TabsTrigger>
            <TabsTrigger value="security">
              <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
              <span className="truncate">{t("Защита")}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="m-0">
            <ProfileForm
              key={`profile-${refreshKey}`}
              initialName={user.name}
              initialUsername={user.username}
              initialAvatarUrl={user.avatarUrl}
              initialTelegramId={user.telegramId}
              initialTelegramLinkStatus={user.telegramLinkStatus}
              initialTelegramNotificationsEnabled={Boolean(user.telegramNotificationsEnabled)}
              initialCalendarNotificationsEnabled={Boolean(user.calendarNotificationsEnabled)}
              initialBirthday={user.birthday}
              initialGender={user.gender}
              initialThematicHolidayConsent={Boolean(user.thematicHolidayConsent)}
              userId={user.id}
              onSuccess={handleSuccess}
            />
          </TabsContent>
          <TabsContent value="security" className="m-0">
            <PasswordForm key={`password-${refreshKey}`} userId={user.id} />
          </TabsContent>
        </Tabs>
      </PageMain>
    </PageShell>
  );
}
