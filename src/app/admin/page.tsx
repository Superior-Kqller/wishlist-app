"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserTable } from "@/components/admin/UserTable";
import { CreateUserDialog } from "@/components/admin/CreateUserDialog";
import { Button } from "@/components/ui/button";
import { CalendarDays, PartyPopper, Plus, Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@/types";
import { fetcher } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { uiLayout } from "@/lib/ui-contract";
import { HolidayCatalog } from "@/components/admin/HolidayCatalog";
import { CalendarSettings } from "@/components/admin/CalendarSettings";

export default function AdminPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isAdminReady = status === "authenticated" && session?.user?.role === "ADMIN";

  const {
    data: usersData,
    isLoading,
    error,
    mutate,
  } = useSWR<{ users: User[]; pagination?: { total?: number; page?: number } } | User[]>(
    isAdminReady ? "/api/users" : null,
    fetcher,
    {
      revalidateOnFocus: false,
    },
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
    // Скелет повторяет раскладку страницы, как в настройках, а не спиннер по центру.
    return (
      <PageShell>
        <PageMain>
          <div className="animate-pulse" aria-busy="true" aria-label={t("Загрузка…")}>
            <div className="mb-8 h-14 w-72 rounded-lg bg-muted/55" />
            <div className="mb-8 h-12 w-full max-w-lg rounded-full bg-muted/55" />
            <div className="h-64 rounded-xl bg-muted/45" />
          </div>
        </PageMain>
      </PageShell>
    );
  }

  if (!session?.user?.id) return null;

  const currentUserId = session.user.id;

  return (
    <PageShell>
      <PageMain>
        <div className={uiLayout.pageStack}>
          <PageIntro
            title={t("Администрирование")}
            description={t("Участники, напоминания календаря и каталог общих праздников")}
          />

          <Tabs defaultValue="users" className="grid gap-8">
            <TabsList aria-label={t("Разделы администрирования")} className="sm:max-w-xl">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{t("Участники")}</span>
                <span className="tabular-nums text-muted-foreground">{users.length}</span>
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarDays className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{t("Календарь")}</span>
              </TabsTrigger>
              <TabsTrigger value="holidays">
                <PartyPopper className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{t("Праздники")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="m-0">
              {error ? (
                <div className="text-center py-12 space-y-2">
                  <p className="text-destructive font-medium">
                    {t("Не удалось загрузить пользователей")}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => mutate()}>
                    {t("Повторить")}
                  </Button>
                </div>
              ) : (
                <section className="space-y-3.5" aria-labelledby="admin-users-title">
                  {/* Действие стоит у своей секции, как «Добавить праздник» у каталога. */}
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <h2 id="admin-users-title" className="section-title">
                      {t("Участники")}
                    </h2>
                    <Button variant="outline" onClick={() => setCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4" aria-hidden />
                      {t("Создать пользователя")}
                    </Button>
                  </div>
                  <UserTable
                    users={users}
                    currentUserId={currentUserId}
                    onRefresh={() => mutate()}
                  />
                </section>
              )}
            </TabsContent>
            <TabsContent value="calendar" className="m-0">
              <CalendarSettings />
            </TabsContent>
            <TabsContent value="holidays" className="m-0">
              <HolidayCatalog />
            </TabsContent>
          </Tabs>
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
