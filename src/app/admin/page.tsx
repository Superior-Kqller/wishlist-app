"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserTable } from "@/components/admin/UserTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { User } from "@/types";
import { toast } from "sonner";
import { fetcher } from "@/lib/fetcher";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isAdminReady = status === "authenticated" && session?.user?.role === "ADMIN";

  const { data: usersData, isLoading, error, mutate } = useSWR<{ users: User[]; pagination?: any } | User[]>(
    isAdminReady ? "/api/users" : null,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  );

  const users = Array.isArray(usersData) ? usersData : usersData?.users || [];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      if (session.user.role !== "ADMIN") {
        toast.error("Доступ запрещен. Требуются права администратора.");
        router.push("/");
      }
    }
  }, [status, session, router]);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <div className="min-h-screen page-bg">
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Управление пользователями
              </h1>
              <p className="text-muted-foreground mt-1">
                Создание, редактирование и удаление учетных записей
              </p>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Создать пользователя
            </Button>
          </div>

          {error ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-destructive font-medium">Не удалось загрузить пользователей</p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Повторить
              </Button>
            </div>
          ) : (
            <UserTable
              users={users}
              currentUserId={currentUserId}
              onRefresh={() => mutate()}
            />
          )}
        </div>
      </main>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
