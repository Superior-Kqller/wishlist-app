"use client";

import { useState, useMemo } from "react";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { KeyRound, Pencil, Trash2, Users } from "lucide-react";
import { EditUserDialog } from "./EditUserDialog";
import { ChangePasswordDialog } from "./ChangePasswordDialog";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { uiSurface } from "@/lib/ui-contract";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchField } from "@/components/ui/search-field";
import { useI18n } from "@/components/i18n/language-provider";
import { UserAvatar } from "@/components/UserAvatar";
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

  const formatCreatedAt = (createdAt: string) =>
    new Date(createdAt).toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const renderActions = (user: User, mobile = false) => (
    <div
      className={cn(
        "flex items-center gap-1",
        mobile ? "grid grid-cols-[1fr_1fr_2.75rem] gap-2" : "justify-end",
      )}
    >
      <Button
        variant={mobile ? "outline" : "ghost"}
        size={mobile ? "sm" : "icon"}
        className={cn(mobile && "min-h-11 gap-2 px-2.5")}
        onClick={() => setEditingUser(user)}
        title={t("Редактировать")}
        aria-label={`${t("Редактировать")}: ${user.username}`}
      >
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        {mobile ? <span>{t("Изменить")}</span> : null}
      </Button>
      <Button
        variant={mobile ? "outline" : "ghost"}
        size={mobile ? "sm" : "icon"}
        className={cn(mobile && "min-h-11 gap-2 px-2.5")}
        onClick={() => setPasswordUser(user)}
        title={t("Изменить пароль")}
        aria-label={`${t("Изменить пароль")}: ${user.username}`}
      >
        <KeyRound className="h-4 w-4 shrink-0" aria-hidden />
        {mobile ? <span>{t("Пароль")}</span> : null}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          mobile && "min-h-11 min-w-11 text-muted-foreground",
          !isLastAdmin(user) && "hover:text-destructive",
        )}
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
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SearchField
          value={search}
          onValueChange={setSearch}
          placeholder={t("Поиск по логину, имени или роли…")}
          aria-label={t("Поиск")}
          wrapperClassName="min-w-0 flex-1 sm:max-w-md"
        />
        <span className="hidden shrink-0 text-sm tabular-nums text-muted-foreground sm:inline">
          {filteredUsers.length} / {users.length}
        </span>
      </div>

      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" aria-hidden />}
          title={t("Пользователи не найдены")}
          description={t(
            "Измените поисковый запрос или создайте нового пользователя.",
          )}
          className={cn(uiSurface.contentPanel, "min-h-[240px]")}
        />
      ) : (
        <>
          <div
            className={cn(
              uiSurface.contentPanel,
              "divide-y divide-border/42 overflow-hidden sm:hidden",
            )}
          >
            {filteredUsers.map((user) => (
              <article key={user.id} className="p-4">
                <div className="flex min-w-0 items-start gap-3">
                  <UserAvatar
                    avatarUrl={user.avatarUrl}
                    name={user.name}
                    userId={user.id}
                    size="lg"
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="truncate font-semibold">{user.name}</h2>
                      {user.id === currentUserId ? (
                        <Badge variant="secondary" className="text-xs">
                          {t("Вы")}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "outline"}
                    className="shrink-0"
                  >
                    {user.role === "ADMIN"
                      ? t("Администратор")
                      : t("Пользователь")}
                  </Badge>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border/34 pt-3 text-sm">
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("Желаний")}
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums">
                      {user._count?.items || 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">
                      {t("Создан")}
                    </dt>
                    <dd className="mt-1 font-medium tabular-nums">
                      {formatCreatedAt(user.createdAt)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 border-t border-border/34 pt-3">
                  {renderActions(user, true)}
                </div>
              </article>
            ))}
          </div>

          <div
            className={cn(
              uiSurface.contentPanel,
              "hidden overflow-hidden sm:block",
            )}
          >
            <Table>
              <TableHeader className="bg-muted/35">
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t("Логин")}</TableHead>
                  <TableHead>{t("Имя")}</TableHead>
                  <TableHead>{t("Роль")}</TableHead>
                  <TableHead>{t("Желаний")}</TableHead>
                  <TableHead>{t("Создан")}</TableHead>
                  <TableHead className="text-right">
                    {t("Действия")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
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
                        {user.role === "ADMIN"
                          ? t("Администратор")
                          : t("Пользователь")}
                      </Badge>
                    </TableCell>
                    <TableCell>{user._count?.items || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatCreatedAt(user.createdAt)}
                    </TableCell>
                    <TableCell>{renderActions(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

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
