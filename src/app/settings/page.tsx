"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { CalendarDays, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetcher } from "@/lib/fetcher";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
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
        <div className="space-y-4">
          <PageIntro
            title={t("Настройки")}
            description={t("Профиль и безопасность аккаунта")}
            actions={
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                  {user.role === "ADMIN" ? t("Администратор") : t("Пользователь")}
                </Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/55 bg-background/24 px-2.5 py-1.5">
                  <CalendarDays className="h-3.5 w-3.5" aria-hidden />
                  {t("С нами с")}{" "}
                  {new Date(user.createdAt).toLocaleDateString(locale, {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            }
          />

          <Tabs defaultValue="profile" className="grid gap-5">
            <TabsList
              aria-label={t("Разделы настроек")}
              className="grid h-auto grid-cols-2 gap-1 rounded-xl border border-border/55 bg-[hsl(var(--surface-2)/0.6)] p-1.5"
            >
              <TabsTrigger
                value="profile"
                className="min-h-11 gap-2 rounded-lg px-2.5 data-[state=active]:bg-[hsl(var(--surface-4))] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary-accent))]"
              >
                <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("Профиль")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="min-h-11 gap-2 rounded-lg px-2.5 data-[state=active]:bg-[hsl(var(--surface-4))] data-[state=active]:text-foreground data-[state=active]:shadow-[inset_0_-2px_0_hsl(var(--primary-accent))]"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("Защита")}</span>
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
        </div>
      </PageMain>
    </PageShell>
  );
}
