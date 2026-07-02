"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { Check, Loader2, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetcher } from "@/lib/fetcher";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";
import { useColorTheme } from "@/components/theme/color-theme-provider";
import { colorThemes } from "@/lib/themes";

function ThemeAccentSection() {
  const { t } = useI18n();
  const { colorTheme, setColorTheme } = useColorTheme();

  return (
    <section className={cn(uiSurface.contentPanel, "p-5 sm:p-6")}>
      <div className="mb-4 flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/24 bg-primary/10 text-primary">
          <Palette className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{t("Внешний вид")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("Выберите цветовой характер интерфейса.")}
          </p>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {colorThemes.map((theme) => {
          const selected = colorTheme === theme.value;

          return (
            <button
              key={theme.value}
              type="button"
              aria-pressed={selected}
              onClick={() => setColorTheme(theme.value)}
              className={cn(
                "group flex min-h-[6.75rem] flex-col justify-between rounded-xl border p-3 text-left transition-[border-color,background-color,transform,box-shadow] duration-200 active:scale-[0.99]",
                selected
                  ? "border-primary/50 bg-primary/12 shadow-[inset_0_1px_0_hsl(var(--foreground)/0.045),0_12px_26px_hsl(var(--primary)/0.08)]"
                  : "border-border/56 bg-[hsl(var(--surface-3))/0.42] hover:border-primary/28 hover:bg-[hsl(var(--surface-3))/0.58]",
              )}
            >
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {t(theme.label)}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {t(theme.description)}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-lg border transition-colors",
                    selected
                      ? "border-primary/45 bg-primary/18 text-primary"
                      : "border-border/60 bg-[hsl(var(--surface-2))/0.7] text-transparent",
                  )}
                >
                  <Check className="h-3.5 w-3.5" aria-hidden />
                </span>
              </span>
              <span className="mt-3 flex gap-1.5" aria-hidden>
                {theme.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className={cn(
                      "h-6 flex-1 rounded-md border border-white/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]",
                      swatch,
                    )}
                  />
                ))}
              </span>
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
      <PageMain className="max-w-2xl">
        <div className="space-y-6">
          <PageIntro
            title={t("Настройки")}
            description={t("Управление вашим профилем и паролем")}
          />

          <div className="space-y-6">
            <ThemeAccentSection />

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

            <PasswordForm key={`password-${refreshKey}`} userId={user.id} />

            <div className={cn(uiSurface.contentPanel, "p-5 sm:p-6")}>
              <h3 className="font-medium mb-2">{t("Информация")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Роль:")}</span>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "outline"}
                  >
                    {user.role === "ADMIN" ? t("Администратор") : t("Пользователь")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("Создан:")}</span>
                  <span>
                    {new Date(user.createdAt).toLocaleDateString(locale, {
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
      </PageMain>
    </PageShell>
  );
}
