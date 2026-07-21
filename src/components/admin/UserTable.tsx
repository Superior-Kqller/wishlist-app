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
import { useI18n } from "@/components/i18n/language-provider";
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
  const { t, locale } = useI18n();
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
          placeholder={t("Поиск по логину, имени или роли…")}
          aria-label={t("Поиск")}
          wrapperClassName="sm:max-w-md"
        />
      </div>

      <div className={cn(uiSurface.contentPanel, "overflow-hidden")}>
        <Table>
          <TableHeader className="bg-muted/35">
            <TableRow className="hover:bg-transparent">
              <TableHead>{t("Логин")}</TableHead>
              <TableHead>{t("Имя")}</TableHead>
              <TableHead>{t("Роль")}</TableHead>
              <TableHead>{t("Желаний")}</TableHead>
              <TableHead>{t("Создан")}</TableHead>
              <TableHead className="text-right">{t("Действия")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={<Users className="h-5 w-5" aria-hidden />}
                    title={t("Пользователи не найдены")}
                    description={t("Измените поисковый запрос или создайте нового пользователя.")}
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
                          {t("Вы")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "outline"}
                    >
                      {user.role === "ADMIN" ? t("Администратор") : t("Пользователь")}
                    </Badge>
                  </TableCell>
                  <TableCell>{user._count?.items || 0}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString(locale, {
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
                        title={t("Редактировать")}
                        aria-label={`${t("Редактировать")}: ${user.username}`}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPasswordUser(user)}
                        title={t("Изменить пароль")}
                        aria-label={`${t("Изменить пароль")}: ${user.username}`}
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
                            ? t("Нельзя удалить последнего администратора")
                            : t("Удалить")
                        }
                        aria-label={
                          isLastAdmin(user)
                            ? t("Нельзя удалить последнего администратора")
                            : `${t("Удалить")}: ${user.username}`
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
