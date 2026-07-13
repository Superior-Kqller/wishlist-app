"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <section className={cn(uiSurface.contentPanel, "p-4 sm:p-5", className)}>
      <div className="mb-3 min-w-0">
        <h2 className="text-lg font-semibold">{t("Внешний вид")}</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {t("Выберите цветовой характер интерфейса.")}
        </p>
      </div>

      <div className="divide-y divide-border/42 border-y border-border/42">
        {colorThemes.map((theme) => {
          const selected = colorTheme === theme.value;
          const descriptionId = `theme-${theme.value}-description`;

          return (
            <div
              key={theme.value}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 px-1 py-2"
            >
              <button
                type="button"
                aria-pressed={selected}
                aria-describedby={descriptionId}
                onClick={() => setColorTheme(theme.value)}
                className={cn(
                  "flex min-h-11 min-w-0 items-center gap-2 rounded-md text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:bg-primary/10",
                  selected
                    ? "text-foreground"
                    : "text-foreground hover:text-primary",
                )}
              >
                <span className="whitespace-nowrap text-sm font-semibold">
                  {t(theme.label)}
                </span>
                {selected ? (
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/16 text-primary">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                ) : null}
              </button>
              <span className="row-span-2 flex gap-1.5" aria-hidden>
                {theme.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className={cn(
                      "h-3 w-7 rounded-sm border border-border/45",
                      swatch,
                    )}
                  />
                ))}
              </span>
              <p
                id={descriptionId}
                className="-mt-1 pb-1 text-xs leading-relaxed text-muted-foreground"
              >
                {t(theme.description)}
              </p>
            </div>
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
      <PageMain className="max-w-6xl">
        <div className="space-y-4">
          <PageIntro
            title={t("Настройки")}
            description={t("Управление вашим профилем и паролем")}
            className="py-3 sm:px-5"
          />

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(21rem,0.9fr)] xl:items-start">
            <div className="space-y-4">
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
            </div>

            <div className="space-y-4">
              <PasswordForm key={`password-${refreshKey}`} userId={user.id} />

              <div className={cn(uiSurface.contentPanel, "p-4 sm:p-5")}>
                <h3 className="mb-3 font-medium">{t("Информация")}</h3>
                <div className="divide-y divide-border/35 border-y border-border/35 text-sm">
                  <div className="flex min-h-11 items-center justify-between gap-3 py-2">
                    <span className="text-muted-foreground">{t("Роль:")}</span>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "outline"}
                    >
                      {user.role === "ADMIN" ? t("Администратор") : t("Пользователь")}
                    </Badge>
                  </div>
                  <div className="flex min-h-11 items-center justify-between gap-3 py-2">
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
        </div>
      </PageMain>
    </PageShell>
  );
}
