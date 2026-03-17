"use client";

import { useState, useEffect } from "react";
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
import { User, UpdateUserPayload } from "@/types";

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
  isLastAdmin?: boolean;
}

export function EditUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  isLastAdmin = false,
}: EditUserDialogProps) {
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setName(user.name);
      setRole(user.role);
    }
  }, [user, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    if (!username.trim() || !name.trim()) {
      toast.error("Заполните все поля");
      return;
    }

    // Проверка изменения роли последнего админа
    if (isLastAdmin && user.role === "ADMIN" && role === "USER") {
      toast.error("Нельзя изменить роль последнего администратора");
      return;
    }

    setSaving(true);
    try {
      const payload: UpdateUserPayload = {};
      if (username !== user.username) payload.username = username.trim();
      if (name !== user.name) payload.name = name.trim();
      if (role !== user.role) payload.role = role;

      if (Object.keys(payload).length === 0) {
        toast.info("Нет изменений для сохранения");
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка при обновлении пользователя");
      }

      toast.success("Пользователь обновлен");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Ошибка при обновлении пользователя");
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Редактировать пользователя</DialogTitle>
          <DialogDescription>
            Измените данные пользователя
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Логин *</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              required
              pattern="[a-zA-Z0-9_]+"
              title="Только буквы, цифры и _"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Имя *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Имя пользователя"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Роль</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "USER" | "ADMIN")}
              disabled={isLastAdmin && user.role === "ADMIN"}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Пользователь</SelectItem>
                <SelectItem value="ADMIN">Администратор</SelectItem>
              </SelectContent>
            </Select>
            {isLastAdmin && user.role === "ADMIN" && (
              <p className="text-xs text-destructive">
                Нельзя изменить роль последнего администратора
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
