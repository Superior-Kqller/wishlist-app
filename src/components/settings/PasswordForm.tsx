"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { validatePasswordComplexity } from "@/lib/password-validation";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";

interface PasswordFormProps {
  userId: string;
}

export function PasswordForm({ userId }: PasswordFormProps) {
  const { t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const validation = validatePasswordComplexity(value);
      setPasswordErrors(validation.errors);
    } else {
      setPasswordErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password) {
      toast.error(t("Введите пароль"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("Пароли не совпадают"));
      return;
    }

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      toast.error(t("Пароль не соответствует требованиям"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("Ошибка при изменении пароля"));
      }

      toast.success(t("Пароль изменен"));
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setPasswordErrors([]);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t("Ошибка при изменении пароля"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn(uiSurface.contentPanel, "p-4 sm:p-6")}>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <ShieldCheck className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{t("Изменить пароль")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            {t("Обновите пароль для защиты аккаунта")}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("Текущий пароль")} *</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("Текущий пароль")}
            autoComplete="current-password"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">{t("Новый пароль")} *</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder={t("Пароль")}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("Подтвердите пароль")} *</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t("Повторите пароль")}
              autoComplete="new-password"
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-destructive">{t("Пароли не совпадают")}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border/55 bg-[hsl(var(--surface-2))/0.4] p-3.5">
          <div className="flex gap-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium">{t("Требования к паролю")}</p>
              {passwordErrors.length > 0 ? (
                <ul className="mt-1.5 space-y-1 text-xs text-destructive">
                  {passwordErrors.map((err, i) => (
                    <li key={i}>• {t(err)}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t("Минимум 8 символов, буквы, цифры и спецсимволы")}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={
              saving ||
              !currentPassword ||
              passwordErrors.length > 0 ||
              password !== confirmPassword ||
              !password
            }
          >
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t("Изменить пароль")}
          </Button>
        </div>
      </form>
    </div>
  );
}
