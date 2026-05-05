"use client";

import { useState, useMemo } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Key, Trash2, Users } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { uiSurface } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
        <SearchField
          value={search}
          onValueChange={setSearch}
          placeholder="Поиск по логину, имени или роли..."
          wrapperClassName="sm:max-w-md"
        />
      </div>

      <div className={cn(uiSurface.contentPanel, "overflow-hidden")}>
        <Table>
          <TableHeader className="bg-muted/35">
            <TableRow className="hover:bg-transparent">
              <TableHead>Логин</TableHead>
              <TableHead>Имя</TableHead>
              <TableHead>Роль</TableHead>
              <TableHead>Желаний</TableHead>
              <TableHead>Создан</TableHead>
              <TableHead className="text-right">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={<Users className="h-5 w-5" aria-hidden />}
                    title="Пользователи не найдены"
                    description="Измените поисковый запрос или создайте нового пользователя."
                    className="min-h-[240px] rounded-none border-0 bg-transparent"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{user.username}</span>
                      {user.id === currentUserId && (
                        <Badge variant="secondary" className="text-xs">
                          Вы
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "outline"}
                    >
                      {user.role === "ADMIN" ? "Администратор" : "Пользователь"}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count?.items || 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
