"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { UserStats, UserWithStats } from "@/types";
import {
  formatPrice,
  formatStatsPurchasedSummary,
  sortCurrencyTotalsEntries,
  statsHasPurchasedPrices,
} from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";

function StatsWishlistValueBlock({ stats }: { stats: UserStats }) {
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown =
    stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    return (
      <p className="text-2xl font-bold">
        {formatPrice(stats.totalWishlistValue, fallbackCur)}
      </p>
    );
  }
  const unpurchasedEntries = sortCurrencyTotalsEntries(
    stats.pricesByCurrency,
  ).filter(([, v]) => v.unpurchased > 0);
  if (unpurchasedEntries.length === 0) {
    return (
      <p className="text-2xl font-bold">{formatPrice(0, fallbackCur)}</p>
    );
  }
  if (unpurchasedEntries.length === 1) {
    const [c, v] = unpurchasedEntries[0];
    return (
      <p className="text-2xl font-bold">{formatPrice(v.unpurchased, c)}</p>
    );
  }
  return (
    <div className="space-y-1">
      {unpurchasedEntries.map(([c, v]) => (
        <p key={c} className="text-xl font-bold tabular-nums">
          {formatPrice(v.unpurchased, c)}
        </p>
      ))}
    </div>
  );
}

function StatsPurchasedValueBlock({ stats }: { stats: UserStats }) {
  const hasBreakdown =
    stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    const summary = formatStatsPurchasedSummary(stats);
    return (
      <p className="text-lg font-semibold text-muted-foreground">{summary}</p>
    );
  }
  const purchasedEntries = sortCurrencyTotalsEntries(
    stats.pricesByCurrency,
  ).filter(([, v]) => v.purchased > 0);
  if (purchasedEntries.length > 1) {
    return (
      <div className="space-y-1">
        {purchasedEntries.map(([c, v]) => (
          <p
            key={c}
            className="text-lg font-semibold text-muted-foreground tabular-nums"
          >
            {formatPrice(v.purchased, c)}
          </p>
        ))}
      </div>
    );
  }
  const summary = formatStatsPurchasedSummary(stats);
  return (
    <p className="text-lg font-semibold text-muted-foreground">{summary}</p>
  );
}

export default function StatsPage() {
  const { status } = useSession();
  const router = useRouter();

  const { data: statsData, isLoading } = useSWR<{ users: UserWithStats[] }>(
    status === "authenticated" ? "/api/users/stats" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000,
    }
  );

  const { data: versionData } = useSWR<{ version: string }>(
    "/api/version",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
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
          <div className="glass-card border-border/70 px-4 py-4 sm:px-5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Статистика
            </h1>
            <p className="text-muted-foreground mt-1">
              Товары в общих подборках: стоимость по участникам
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
                <Card key={user.id} className="border-border/75 bg-card/68 shadow-[0_8px_24px_rgba(0,0,0,0.28)] transition-[box-shadow,border-color] hover:border-cyan-400/35 hover:shadow-[0_0_18px_rgba(6,182,212,0.18),0_12px_28px_rgba(0,0,0,0.35)]">
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

                    <div className="pt-3 border-t border-border/70">
                      <p className="text-xs text-muted-foreground mb-1">
                        Стоимость вишлиста
                      </p>
                      <StatsWishlistValueBlock stats={user.stats} />
                    </div>

                    {statsHasPurchasedPrices(user.stats) && (
                      <div className="pt-2 border-t border-border/70">
                        <p className="text-xs text-muted-foreground mb-1">
                          Куплено на сумму
                        </p>
                        <StatsPurchasedValueBlock stats={user.stats} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Version info */}
          {versionData?.version && (
            <div className="pt-6 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground">
                Вишлист v{versionData.version}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
