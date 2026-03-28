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
import { fetcher } from "@/lib/fetcher";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isAdminReady = status === "authenticated" && session?.user?.role === "ADMIN";

  const { data: usersData, isLoading, error, mutate } = useSWR<
    { users: User[]; pagination?: { total?: number; page?: number } } | User[]
  >(
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
    } else if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading" || isLoading) {
    return (
      <PageShell className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  const currentUserId = session?.user?.id;

  return (
    <PageShell>
      <PageMain>
        <div className="space-y-6">
          <PageIntro
            title="Управление пользователями"
            description="Создание, редактирование и удаление учетных записей"
            actions={
              <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Создать пользователя
              </Button>
            }
          />

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
      </PageMain>

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => mutate()}
      />
    </PageShell>
  );
}
