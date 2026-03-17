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
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { User } from "@/types";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: User | null;
  onSuccess: () => void;
  isLastAdmin?: boolean;
}

export function DeleteUserDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
  isLastAdmin = false,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleDelete = async () => {
    if (!user) return;

    if (confirmText !== user.username) {
      toast.error("Введите логин пользователя для подтверждения");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка при удалении пользователя");
      }

      toast.success("Пользователь удален");
      onSuccess();
      onOpenChange(false);
      setConfirmText("");
    } catch (err: any) {
      toast.error(err.message || "Ошибка при удалении пользователя");
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  const canDelete = !isLastAdmin || user.role !== "ADMIN";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Удалить пользователя
          </DialogTitle>
          <DialogDescription>
            {canDelete ? (
              <>
                Это действие нельзя отменить. Все данные пользователя{" "}
                <strong>{user.username}</strong> будут удалены, включая все его
                желания ({user._count?.items || 0} шт.).
              </>
            ) : (
              <>
                Нельзя удалить последнего администратора. Сначала создайте
                другого администратора или измените роль другого пользователя.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {canDelete && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Для подтверждения введите логин пользователя:{" "}
                <strong>{user.username}</strong>
              </label>
              <Input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={user.username}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmText("");
            }}
          >
            Отмена
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !canDelete || confirmText !== user.username}
          >
            {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Удалить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
