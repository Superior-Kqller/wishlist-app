"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { BrandLockup } from "@/components/BrandLockup";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { safeCallbackPath } from "@/lib/deep-links";

/** Страница, с которой отправили на вход, — например, форма из букмарклета. */
function callbackPath(): string {
  return safeCallbackPath(new URLSearchParams(window.location.search).get("callbackUrl"));
}

export default function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  // Счётчик неудачных попыток перезапускает покачивание полей на каждой ошибке.
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  // Уже вошедшему форма входа не нужна: закладка на /login вела в тупик.
  useEffect(() => {
    if (status === "authenticated") router.replace(callbackPath());
  }, [status, router]);

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
      setFailedAttempts((count) => count + 1);
      setLoading(false);
    } else {
      router.push(callbackPath());
      router.refresh();
    }
  };

  return (
    <div className="page-bg relative min-h-svh px-4 sm:px-8">
      <div className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] sm:right-8 sm:top-6">
        <LanguageSwitcher />
      </div>

      {/*
       * По центру экрана стоят поля и кнопка — единственное действие
       * страницы, а логотип и заголовок формы лежат над ними. Центрирование всего
       * блока целиком опускало поля ниже середины: заголовок тянул их вниз.
       * Над и под формой — распорки с нулевой базой: свободное место делится
       * поровну, а на низком экране верхний блок не сжимается меньше своего
       * содержимого и просто сдвигает форму вниз, без лишней прокрутки.
       */}
      <main className="flex min-h-svh flex-col items-center py-16 sm:py-10">
        <div
          className="flex w-full max-w-[25rem] grow basis-0 flex-col justify-end pb-5 text-center"
          data-reveal
        >
          <BrandLockup className="justify-center" />

          {/* Обещание, а не «Войдите в свой аккаунт»: первый экран говорит,
              зачем сюда приходят. */}
          <h1 className="page-title mt-8 sm:mt-10">{t("Что подарить своим — в одном месте")}</h1>
          <p className="mx-auto mt-3 max-w-[34ch] text-sm text-muted-foreground text-pretty">
            {t("Списки желаний, дни рождения и подсказки всего круга.")}
          </p>
        </div>

        <div className="w-full max-w-[25rem]" data-reveal>
          <form onSubmit={handleSubmit} className="space-y-4 text-left" aria-label={t("Вход")}>
            {/* Error Shake (kinetics): поля покачиваются на каждой неудачной попытке. */}
            <div key={failedAttempts} className={cn("space-y-4", failedAttempts > 0 && "shake-x")}>
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
                  aria-invalid={Boolean(error)}
                  className={error ? "border-destructive" : undefined}
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
                  aria-invalid={Boolean(error)}
                  className={error ? "border-destructive" : undefined}
                />
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className="rounded-lg border border-destructive/32 bg-destructive/10 px-3 py-2 text-sm text-destructive animate-fade-in"
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
              {t("Войти")}
            </Button>
          </form>
        </div>
        <div className="grow basis-0" aria-hidden />
      </main>
    </div>
  );
}
