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
    <div className="flex min-h-screen items-center justify-center page-bg px-4 py-6">
      <div className="relative w-full max-w-[26rem]">
        <div className="absolute -inset-px rounded-[1.35rem] bg-[linear-gradient(135deg,hsl(var(--primary)/0.48),hsl(var(--info)/0.22),hsl(var(--warning)/0.18))] opacity-80 blur-sm" aria-hidden />
        <div className="glass relative rounded-2xl border-border/58 bg-[hsl(var(--surface-2))/0.86] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.44),inset_0_1px_0_hsl(var(--foreground)/0.05)] sm:p-8">
          <div className="mb-7 flex items-center justify-between gap-3">
            <BrandLockup compact />
            <LanguageSwitcher />
          </div>
          <div className="mb-6">
            <h1 className="text-left text-sm font-medium text-muted-foreground">
              {t("Войдите в свой аккаунт")}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

          {error && (
            <p className="rounded-md border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-destructive text-center animate-fade-in">
              {error}
            </p>
          )}

          <Button type="submit" variant="gradient" className="mt-1 w-full shadow-[var(--shadow-brand-action)]" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            {t("Войти")}
          </Button>
        </form>
        </div>
      </div>
    </div>
  );
}
