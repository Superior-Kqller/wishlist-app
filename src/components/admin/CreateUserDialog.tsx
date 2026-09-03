"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { passwordSchema, validatePasswordComplexity } from "@/lib/password-validation";
import { CreateUserPayload } from "@/types";
import { useI18n } from "@/components/i18n/language-provider";
import { uiLayout } from "@/lib/ui-contract";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
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

    // Валидация
    if (!username.trim() || !password || !name.trim()) {
      toast.error(t("Заполните все поля"));
      return;
    }

    const passwordValidation = validatePasswordComplexity(password);
    if (!passwordValidation.valid) {
      toast.error(t("Пароль не соответствует требованиям"));
      return;
    }

    try {
      passwordSchema.parse(password);
    } catch {
      toast.error(t("Пароль не соответствует требованиям"));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim(),
          role,
        } as CreateUserPayload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || t("Ошибка при создании пользователя"));
      }

      toast.success(t("Пользователь создан"));
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("Ошибка при создании пользователя"));
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setName("");
    setRole("USER");
    setPasswordErrors([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={uiLayout.dialogForm}>
        <DialogHeader>
          <DialogTitle>{t("Создать пользователя")}</DialogTitle>
          <DialogDescription>{t("Создайте новую учетную запись пользователя")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">{t("Логин")} *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              pattern="[a-zA-Z0-9_]+"
              title={t("Только буквы, цифры и _")}
            />
            <p className="text-xs text-muted-foreground">{t("Только буквы, цифры и символ _")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{t("Имя")} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("Имя пользователя")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("Пароль")} *</Label>
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
            <Label>{t("Роль")}</Label>
            <Select value={role} onValueChange={(v) => setRole(v as "USER" | "ADMIN")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">{t("Пользователь")}</SelectItem>
                <SelectItem value="ADMIN">{t("Администратор")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
            >
              {t("Отмена")}
            </Button>
            <Button type="submit" disabled={saving || passwordErrors.length > 0}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t("Создать")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
