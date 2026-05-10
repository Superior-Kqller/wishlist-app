"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Loader2 } from "lucide-react";
import { UserStats, UserWithStats } from "@/types";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import {
  cn,
  formatPrice,
  formatStatsPurchasedSummary,
  sortCurrencyTotalsEntries,
  statsHasPurchasedPrices,
} from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";

function StatsWishlistValueBlock({ stats }: { stats: UserStats }) {
  const { language } = useI18n();
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown =
    stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    return (
      <p className="text-2xl font-bold">
        {formatPrice(stats.totalWishlistValue, fallbackCur, language)}
      </p>
    );
  }
  const unpurchasedEntries = sortCurrencyTotalsEntries(
    stats.pricesByCurrency,
  ).filter(([, v]) => v.unpurchased > 0);
  if (unpurchasedEntries.length === 0) {
    return (
      <p className="text-2xl font-bold">{formatPrice(0, fallbackCur, language)}</p>
    );
  }
  if (unpurchasedEntries.length === 1) {
    const [c, v] = unpurchasedEntries[0];
    return (
      <p className="text-2xl font-bold">{formatPrice(v.unpurchased, c, language)}</p>
    );
  }
  return (
    <div className="space-y-1">
      {unpurchasedEntries.map(([c, v]) => (
        <p key={c} className="text-xl font-bold tabular-nums">
          {formatPrice(v.unpurchased, c, language)}
        </p>
      ))}
    </div>
  );
}

function StatsPurchasedValueBlock({ stats }: { stats: UserStats }) {
  const { language } = useI18n();
  const hasBreakdown =
    stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    const summary = formatStatsPurchasedSummary(stats, language);
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
  const summary = formatStatsPurchasedSummary(stats, language);
  return (
    <p className="text-lg font-semibold text-muted-foreground">{summary}</p>
  );
}

export default function StatsPage() {
  const { t } = useI18n();
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
      <PageShell className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  const users = statsData.users || [];

  return (
    <PageShell>
      <PageMain className="max-w-6xl">
        <div className="space-y-6">
          <PageIntro
            title={t("Статистика")}
            description={t("Товары в общих подборках и ориентировочная стоимость по участникам")}
          />

          {users.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" aria-hidden />}
              title={t("Нет данных для отображения")}
              description={t("Статистика появится, когда в общих списках будут товары.")}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <Card key={user.id} className={cn(uiSurface.interactiveCard, "h-full")}>
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
                        <p className="text-muted-foreground">{t("Всего товаров")}</p>
                        <p className="text-lg font-semibold">
                          {user.stats.totalItems}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">{t("Не куплено")}</p>
                        <p className="text-lg font-semibold">
                          {user.stats.unpurchasedItems}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/70">
                      <p className="text-xs text-muted-foreground mb-1">
                        {t("Ориентировочная стоимость")}
                      </p>
                      <StatsWishlistValueBlock stats={user.stats} />
                    </div>

                    {statsHasPurchasedPrices(user.stats) && (
                      <div className="pt-2 border-t border-border/70">
                        <p className="text-xs text-muted-foreground mb-1">
                          {t("Отмечено купленным")}
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
                {t("Вишлист")} v{versionData.version}
              </p>
            </div>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
