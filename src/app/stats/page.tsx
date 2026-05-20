"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, CircleDollarSign, Loader2, Package, Target, Users } from "lucide-react";
import { StatsSummary, UserStats, UserWithStats } from "@/types";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getPriorityLabel } from "@/lib/priority-labels";
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

type StatsResponse = {
  users: UserWithStats[];
  summary?: StatsSummary;
};

const PRIORITY_ORDER = [5, 4, 3, 2, 1] as const;

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

function mergeCurrencyTotals(
  target: Record<string, { unpurchased: number; purchased: number }>,
  source?: Record<string, { unpurchased: number; purchased: number }>,
) {
  if (!source) return;
  for (const [currency, totals] of Object.entries(source)) {
    if (!target[currency]) target[currency] = { unpurchased: 0, purchased: 0 };
    target[currency].unpurchased += totals.unpurchased;
    target[currency].purchased += totals.purchased;
  }
}

function buildStatsSummary(users: UserWithStats[]): StatsSummary {
  const pricesByCurrency: StatsSummary["pricesByCurrency"] = {};
  const priorityCounts: StatsSummary["priorityCounts"] = {};
  let totalItems = 0;
  let unpurchasedItems = 0;

  for (const user of users) {
    totalItems += user.stats.totalItems;
    unpurchasedItems += user.stats.unpurchasedItems;
    mergeCurrencyTotals(pricesByCurrency, user.stats.pricesByCurrency);
    for (const [priority, count] of Object.entries(user.stats.priorityCounts ?? {})) {
      priorityCounts[priority] = (priorityCounts[priority] ?? 0) + count;
    }
  }

  return {
    totalItems,
    unpurchasedItems,
    memberCount: users.length,
    pricesByCurrency,
    priorityCounts,
    topItems: [],
  };
}

function formatSummaryValues(
  pricesByCurrency: StatsSummary["pricesByCurrency"],
  language: "ru" | "en",
) {
  const entries = sortCurrencyTotalsEntries(pricesByCurrency).filter(
    ([, value]) => value.unpurchased > 0,
  );
  if (entries.length === 0) return [formatPrice(0, "RUB", language)];
  return entries.map(([currency, value]) =>
    formatPrice(value.unpurchased, currency, language),
  );
}

function getPriorityGradient(priorityCounts: StatsSummary["priorityCounts"]) {
  const total = Object.values(priorityCounts).reduce((sum, count) => sum + count, 0);
  if (total === 0) return "hsl(var(--surface-4))";

  let cursor = 0;
  const segments = PRIORITY_ORDER.flatMap((priority) => {
    const count = priorityCounts[String(priority)] ?? 0;
    if (count === 0) return [];
    const start = cursor;
    const end = cursor + (count / total) * 100;
    cursor = end;
    return [
      `hsl(var(--priority-${priority}) / 0.94) ${start.toFixed(2)}% ${end.toFixed(2)}%`,
    ];
  });
  return `conic-gradient(${segments.join(", ")})`;
}

function StatsOverview({ summary }: { summary: StatsSummary }) {
  const { language, t } = useI18n();
  const totalValues = formatSummaryValues(summary.pricesByCurrency, language);
  const totalPriorityItems = Object.values(summary.priorityCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <section className={cn(uiSurface.contentPanel, "overflow-hidden p-4 sm:p-5")}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("Итого к покупке")}
            </p>
            <div className="mt-2 space-y-1">
              {totalValues.map((value) => (
                <p
                  key={value}
                  className="text-3xl font-bold leading-tight tracking-tight tabular-nums sm:text-4xl"
                >
                  {value}
                </p>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/65 bg-[hsl(var(--surface-3))/0.72] p-3">
              <Package className="mb-2 h-4 w-4 text-info" aria-hidden />
              <p className="text-2xl font-semibold tabular-nums">{summary.totalItems}</p>
              <p className="text-xs text-muted-foreground">{t("Всего товаров")}</p>
            </div>
            <div className="rounded-lg border border-border/65 bg-[hsl(var(--surface-3))/0.72] p-3">
              <Target className="mb-2 h-4 w-4 text-warning" aria-hidden />
              <p className="text-2xl font-semibold tabular-nums">
                {summary.unpurchasedItems}
              </p>
              <p className="text-xs text-muted-foreground">{t("Активных желаний")}</p>
            </div>
            <div className="rounded-lg border border-border/65 bg-[hsl(var(--surface-3))/0.72] p-3">
              <Users className="mb-2 h-4 w-4 text-primary" aria-hidden />
              <p className="text-2xl font-semibold tabular-nums">{summary.memberCount}</p>
              <p className="text-xs text-muted-foreground">{t("Участников")}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-lg border border-border/65 bg-[hsl(var(--surface-3))/0.72] p-4">
            <div className="flex items-center gap-4">
              <div
                className="relative h-24 w-24 shrink-0 rounded-full"
                style={{ background: getPriorityGradient(summary.priorityCounts) }}
                aria-hidden
              >
                <div className="absolute inset-5 rounded-full bg-[hsl(var(--surface-3))]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {t("Распределение по приоритетам")}
                </p>
                <div className="mt-3 space-y-1.5">
                  {PRIORITY_ORDER.map((priority) => {
                    const count = summary.priorityCounts[String(priority)] ?? 0;
                    if (count === 0) return null;
                    return (
                      <div
                        key={priority}
                        className="flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="truncate text-muted-foreground">
                          {getPriorityLabel(priority, language)}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {count}/{totalPriorityItems}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border/65 bg-[hsl(var(--surface-3))/0.72] p-4">
            <div className="mb-3 flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4 text-success" aria-hidden />
              <p className="text-sm font-semibold">{t("Самые дорогие желания")}</p>
            </div>
            {summary.topItems.length > 0 ? (
              <div className="space-y-2">
                {summary.topItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {item.userName}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums">
                      {formatPrice(item.price, item.currency, language)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t("Нет товаров с ценой")}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StatsPage() {
  const { t } = useI18n();
  const { status } = useSession();
  const router = useRouter();

  const {
    data: statsData,
    isLoading,
    error,
    mutate,
  } = useSWR<StatsResponse>(
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

  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  if (status === "loading" || isLoading) {
    return (
      <PageShell className="flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </PageShell>
    );
  }

  if (error || !statsData) {
    return (
      <PageShell>
        <PageMain className="max-w-6xl">
          <EmptyState
            icon={<BarChart3 className="h-5 w-5" aria-hidden />}
            title={t("Не удалось загрузить статистику")}
            description={t("Проверьте подключение и попробуйте обновить данные.")}
            actionLabel={t("Повторить")}
            onAction={() => mutate()}
          />
        </PageMain>
      </PageShell>
    );
  }

  const users = statsData.users || [];
  const summary = statsData.summary ?? buildStatsSummary(users);

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
            <>
              <StatsOverview summary={summary} />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            </>
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
