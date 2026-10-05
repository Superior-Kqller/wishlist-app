"use client";

import { useState } from "react";
import { Button, useDoneFlash } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { validatePasswordComplexity } from "@/lib/password-validation";
import { SettingsSection } from "@/components/settings/ProfileForm";
import { useI18n } from "@/components/i18n/language-provider";
import { responseError } from "@/lib/response-error";

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
  const [done, flashDone] = useDoneFlash();

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

      if (!res.ok) throw await responseError(res, t("Ошибка при изменении пароля"));

      toast.success(t("Пароль изменен"));
      flashDone();
      setCurrentPassword("");
      setPassword("");
      setConfirmPassword("");
      setPasswordErrors([]);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при изменении пароля"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <SettingsSection
        title={t("Изменить пароль")}
        description={t("Обновите пароль для защиты аккаунта")}
      >
        <div className="max-w-sm space-y-2">
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
              aria-invalid={passwordErrors.length > 0 || undefined}
              aria-describedby="password-requirements"
              required
            />
            {/* Требования — подписью под полем, а не отдельной рамкой с иконкой. */}
            <div id="password-requirements" className="text-xs leading-relaxed">
              {passwordErrors.length > 0 ? (
                <ul className="space-y-0.5 text-destructive">
                  {passwordErrors.map((err, i) => (
                    <li key={i}>{t(err)}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  {t("Минимум 8 символов, буквы, цифры и спецсимволы")}
                </p>
              )}
            </div>
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
              aria-invalid={(Boolean(confirmPassword) && password !== confirmPassword) || undefined}
              aria-describedby="confirm-password-error"
              required
            />
            <FieldError id="confirm-password-error">
              {confirmPassword && password !== confirmPassword ? t("Пароли не совпадают") : null}
            </FieldError>
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end border-t border-border pt-8">
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={
            saving ||
            !currentPassword ||
            passwordErrors.length > 0 ||
            password !== confirmPassword ||
            !password
          }
          status={saving ? "loading" : done ? "done" : "idle"}
        >
          {t("Изменить пароль")}
        </Button>
      </div>
    </form>
  );
}
