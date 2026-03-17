"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { validatePasswordComplexity } from "@/lib/password-validation";

export function PasswordForm() {
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
      toast.error("Введите пароль");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      toast.error("Пароль не соответствует требованиям");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка при изменении пароля");
      }

      toast.success("Пароль изменен");
      setPassword("");
      setConfirmPassword("");
      setPasswordErrors([]);
    } catch (err: any) {
      toast.error(err.message || "Ошибка при изменении пароля");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Изменить пароль</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Новый пароль *</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => handlePasswordChange(e.target.value)}
            placeholder="Пароль"
            required
          />
          {passwordErrors.length > 0 && (
            <ul className="text-xs text-destructive space-y-1">
              {passwordErrors.map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-muted-foreground">
            Минимум 8 символов, буквы, цифры и спецсимволы
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Подтвердите пароль *</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повторите пароль"
            required
          />
          {confirmPassword && password !== confirmPassword && (
            <p className="text-xs text-destructive">Пароли не совпадают</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={
            saving ||
            passwordErrors.length > 0 ||
            password !== confirmPassword ||
            !password
          }
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Изменить пароль
        </Button>
      </form>
    </Card>
  );
}
