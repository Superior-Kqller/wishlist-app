"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(t("Неверный логин или пароль"));
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-svh page-bg p-3 sm:p-5 lg:p-7">
      <section className="mx-auto grid min-h-[calc(100svh-1.5rem)] w-full max-w-[80rem] grid-rows-[auto_1fr] overflow-hidden border border-border/55 bg-[hsl(var(--surface-1)/0.7)] sm:min-h-[calc(100svh-2.5rem)] sm:rounded-2xl lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1.2fr)_minmax(24rem,0.8fr)] lg:grid-rows-1">
        {/*
         * На телефоне первым экраном была витрина: заголовок в четыре строки
         * и подпись занимали всё, а «Войти» уходила под панель браузера —
         * единственное действие страницы требовало прокрутки. Витрина
         * осталась, но ужалась до шапки; полноэкранной она становится с `lg`,
         * где для неё есть отдельная колонка.
         */}
        <div className="relative flex flex-col gap-8 overflow-hidden p-6 pb-7 sm:gap-10 sm:p-9 lg:min-h-0 lg:justify-between lg:gap-0 lg:p-12">
          <div
            className="absolute -left-24 bottom-[-10rem] h-80 w-80 rounded-full bg-primary/16 blur-3xl"
            aria-hidden
          />
          <div
            className="absolute right-[-8rem] top-[-8rem] h-64 w-64 rounded-full bg-[hsl(var(--theme-warm)/0.12)] blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-4">
            <BrandLockup />
            <div className="lg:hidden">
              <LanguageSwitcher />
            </div>
          </div>
          <div className="relative max-w-[38rem] lg:pb-2">
            <h1 className="display-face max-w-[16ch] text-2xl leading-[1.12] text-foreground sm:max-w-[12ch] sm:text-5xl sm:leading-[1.08] lg:text-6xl">
              {t("Умный вишлист для совместных желаний")}
            </h1>
            {/* Подпись остаётся для скринридеров, но на телефоне не занимает
                места: заголовок говорит то же самое, а полсотни пикселей
                решают, видно ли «Войти» без прокрутки на коротком экране.
                Тот же приём, что у `PageIntro`. */}
            <p className="mt-3 max-w-[34rem] text-sm leading-6 text-muted-foreground max-sm:sr-only sm:mt-5 sm:text-base">
              {t("Ваши желания в одном месте. Выбирайте и отмечайте покупки.")}
            </p>
          </div>
        </div>

        <div className="flex flex-col border-t border-border/55 bg-[hsl(var(--surface-2)/0.7)] p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-12">
          <div className="hidden justify-end lg:flex">
            <LanguageSwitcher />
          </div>
          <div className="flex flex-1 items-center py-2 sm:py-6 lg:py-12">
            <div className="mx-auto w-full max-w-[27rem]">
              <div className="mb-5 sm:mb-7">
                <h2 id="login-heading" className="section-title text-balance">
                  {t("Войдите в свой аккаунт")}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" aria-labelledby="login-heading">
                <div className="space-y-2">
                  <Label htmlFor="username">{t("Логин")}</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder={t("Введите логин")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("Пароль")}</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder={t("Введите пароль")}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                {error ? (
                  <p
                    role="alert"
                    className="rounded-md border border-destructive/32 bg-destructive/10 px-3 py-2 text-center text-sm text-destructive animate-fade-in"
                  >
                    {error}
                  </p>
                ) : null}

                <Button type="submit" className="mt-1 w-full" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                  {t("Войти")}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
