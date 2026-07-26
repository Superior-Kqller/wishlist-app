"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import {
  CalendarDays,
  Check,
  Loader2,
  Palette,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetcher } from "@/lib/fetcher";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";
import { useColorTheme } from "@/components/theme/color-theme-provider";
import { colorThemes } from "@/lib/themes";

function ThemeAccentSection({ className }: { className?: string }) {
  const { t } = useI18n();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <section className={cn(uiSurface.contentPanel, "p-4 sm:p-6", className)}>
      <div className="mb-5 flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Palette className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{t("Внешний вид")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("Выберите цветовой характер интерфейса.")}
          </p>
        </div>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {colorThemes.map((theme) => {
          const selected = colorTheme === theme.value;
          const descriptionId = `theme-${theme.value}-description`;

          return (
            <button
              key={theme.value}
              type="button"
              aria-pressed={selected}
              aria-describedby={descriptionId}
              onClick={() => setColorTheme(theme.value)}
              className={cn(
                "group relative min-h-32 rounded-xl border p-3.5 text-left transition-[background-color,border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                selected
                  ? "border-primary/48 bg-primary/10 shadow-[inset_0_1px_0_hsl(var(--primary)/0.12)]"
                  : "border-border/58 bg-[hsl(var(--surface-2))/0.4] hover:border-primary/28 hover:bg-[hsl(var(--surface-3))/0.62]",
              )}
            >
              <span className="mb-4 flex gap-1.5" aria-hidden>
                {theme.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className={cn(
                      "h-5 flex-1 rounded-md border border-foreground/10",
                      swatch,
                    )}
                  />
                ))}
              </span>
              <span className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{t(theme.label)}</span>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors",
                    selected
                      ? "border-primary/35 bg-primary text-primary-foreground"
                      : "border-border/65 bg-background/35 text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              </span>
              <p
                id={descriptionId}
                className="mt-1.5 text-xs leading-relaxed text-muted-foreground"
              >
                {t(theme.description)}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function SettingsPage() {
  const { t, locale } = useI18n();
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
      <PageMain className="max-w-5xl">
        <div className="space-y-4">
          <PageIntro
            title={t("Настройки")}
            description={t("Профиль, оформление и безопасность аккаунта")}
            actions={
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:justify-end">
                <Badge variant={user.role === "ADMIN" ? "default" : "outline"}>
                  {user.role === "ADMIN" ? t("Администратор") : t("Пользователь")}
                </Badge>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/55 bg-background/25 px-2.5 py-1.5">
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
            className="sm:px-5"
          />

          <Tabs
            defaultValue="profile"
            className="grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)] lg:items-start"
          >
            <TabsList
              aria-label={t("Разделы настроек")}
              className={cn(
                uiSurface.contentPanel,
                "grid h-auto grid-cols-3 gap-1 bg-transparent p-1.5 lg:sticky lg:top-6 lg:flex lg:flex-col lg:items-stretch",
              )}
            >
              <TabsTrigger
                value="profile"
                className="min-h-11 gap-2 rounded-lg px-2.5 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none lg:justify-start"
              >
                <UserRound className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("Профиль")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="min-h-11 gap-2 rounded-lg px-2.5 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none lg:justify-start"
              >
                <Palette className="h-4 w-4 shrink-0" aria-hidden />
                <span>{t("Вид")}</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="min-h-11 gap-2 rounded-lg px-2.5 data-[state=active]:bg-primary/12 data-[state=active]:text-foreground data-[state=active]:shadow-none lg:justify-start"
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
                userId={user.id}
                onSuccess={handleSuccess}
              />
            </TabsContent>
            <TabsContent value="appearance" className="m-0">
              <ThemeAccentSection />
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
