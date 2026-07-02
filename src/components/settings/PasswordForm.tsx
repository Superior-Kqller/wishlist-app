"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
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
    <div className={cn(uiSurface.contentPanel, "p-4 sm:p-5")}>
      <h2 className="mb-3 text-lg font-semibold">{t("Изменить пароль")}</h2>
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="space-y-2">
          <Label htmlFor="currentPassword">{t("Текущий пароль")} *</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder={t("Текущий пароль")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t("Новый пароль")} *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder={t("Пароль")}
            required
          />
          {passwordErrors.length > 0 && (
            <ul className="text-xs text-destructive space-y-1">
              {passwordErrors.map((err, i) => (
                <li key={i}>• {t(err)}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            {t("Минимум 8 символов, буквы, цифры и спецсимволы")}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("Подтвердите пароль")} *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("Повторите пароль")}
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-destructive">{t("Пароли не совпадают")}</p>
          )}
        </div>

        <Button
          type="submit"
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
      </form>
    </div>
  );
}
