"use client";

import { useState, useMemo } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Key, Trash2, Search } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { uiSurface } from "@/lib/ui-contract";

interface UserTableProps {
  users: User[];
  currentUserId: string;
  onRefresh: () => void;
}

export function UserTable({
  users,
  currentUserId,
  onRefresh,
}: UserTableProps) {
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.username.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, search]);

  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const isLastAdmin = (user: User) =>
    user.role === "ADMIN" && adminCount <= 1;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по логину, имени или роли..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className={`${uiSurface.panelInset} overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">Логин</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Имя</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Роль</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Желаний</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Создан</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.username}</span>
                        {user.id === currentUserId && (
                          <Badge variant="secondary" className="text-xs">
                            Вы
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">{user.name}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={user.role === "ADMIN" ? "default" : "outline"}
                      >
                        {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{user._count?.items || 0}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(user)}
                          title="Редактировать"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setPasswordUser(user)}
                          title="Изменить пароль"
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(user)}
                          disabled={isLastAdmin(user)}
                          title={
                            isLastAdmin(user)
                              ? "Нельзя удалить последнего администратора"
                              : "Удалить"
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EditUserDialog
        open={!!editingUser}
        onOpenChange={(open) => !open && setEditingUser(null)}
        user={editingUser}
        onSuccess={onRefresh}
        isLastAdmin={editingUser ? isLastAdmin(editingUser) : false}
      />

      <ChangePasswordDialog
        open={!!passwordUser}
        onOpenChange={(open) => !open && setPasswordUser(null)}
        user={passwordUser}
        onSuccess={onRefresh}
      />

      <DeleteUserDialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
        user={deletingUser}
        onSuccess={onRefresh}
        isLastAdmin={deletingUser ? isLastAdmin(deletingUser) : false}
      />
    </div>
  );
}
