"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { UserWithStats } from "@/types";
import { formatPrice } from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";

export default function StatsPage() {
  const { status } = useSession();
  const router = useRouter();

  const { data: statsData, isLoading } = useSWR<{ users: UserWithStats[] }>(
    status === "authenticated" ? "/api/users/stats" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // Статистика меняется реже
    }
  );

  if (status === "loading" || isLoading || !statsData) {
    return (
      <div className="min-h-screen page-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const users = statsData.users || [];

  return (
    <div className="min-h-screen page-bg">
      <main className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Статистика
            </h1>
            <p className="text-muted-foreground mt-1">
              Общая стоимость вишлистов пользователей
            </p>
          </div>

          {users.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Нет данных для отображения
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        avatarUrl={user.avatarUrl || undefined}
                        name={user.name}
                        userId={user.id}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {user.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Всего товаров</p>
                        <p className="text-lg font-semibold">
                          {user.stats.totalItems}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Не куплено</p>
                        <p className="text-lg font-semibold">
                          {user.stats.unpurchasedItems}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t">
                      <p className="text-xs text-muted-foreground mb-1">
                        Стоимость вишлиста
                      </p>
                      <p className="text-2xl font-bold">
                        {formatPrice(
                          user.stats.totalWishlistValue,
                          user.stats.currency || "RUB"
                        )}
                      </p>
                    </div>

                    {user.stats.totalPurchasedValue > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Куплено на сумму
                        </p>
                        <p className="text-lg font-semibold text-muted-foreground">
                          {formatPrice(
                            user.stats.totalPurchasedValue,
                            user.stats.currency || "RUB"
                          )}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
