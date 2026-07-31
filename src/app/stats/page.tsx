"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart3,
  ChevronDown,
  CircleDollarSign,
  Loader2,
  Package,
  Target,
  Users,
} from "lucide-react";
import { ItemsPage, StatsSummary, UserStats, UserWithStats } from "@/types";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import { getPriorityLabel } from "@/lib/priority-labels";
import {
  cn,
  formatPrice,
  formatStatsPurchasedSummary,
  formatStatsUnpurchasedSummary,
  sortCurrencyTotalsEntries,
  statsHasPurchasedPrices,
} from "@/lib/utils";
import { fetcher } from "@/lib/fetcher";
import { uiLayout, uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";

type StatsResponse = {
  users: UserWithStats[];
  summary?: StatsSummary;
};

const PRIORITY_ORDER = [5, 4, 3, 2, 1] as const;

function StatsWishlistValueBlock({ stats }: { stats: UserStats }) {
  const { language } = useI18n();
  const fallbackCur = stats.currency || "RUB";
  const hasBreakdown = stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    return (
      <p className="text-2xl font-bold">
        {formatPrice(stats.totalWishlistValue, fallbackCur, language)}
      </p>
    );
  }
  const unpurchasedEntries = sortCurrencyTotalsEntries(stats.pricesByCurrency).filter(
    ([, v]) => v.unpurchased > 0,
  );
  if (unpurchasedEntries.length === 0) {
    return <p className="text-2xl font-bold">{formatPrice(0, fallbackCur, language)}</p>;
  }
  if (unpurchasedEntries.length === 1) {
    const [c, v] = unpurchasedEntries[0];
    return <p className="text-2xl font-bold">{formatPrice(v.unpurchased, c, language)}</p>;
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
  const hasBreakdown = stats.pricesByCurrency && Object.keys(stats.pricesByCurrency).length > 0;
  if (!hasBreakdown) {
    const summary = formatStatsPurchasedSummary(stats, language);
    return <p className="text-lg font-semibold text-muted-foreground">{summary}</p>;
  }
  const purchasedEntries = sortCurrencyTotalsEntries(stats.pricesByCurrency).filter(
    ([, v]) => v.purchased > 0,
  );
  if (purchasedEntries.length > 1) {
    return (
      <div className="space-y-1">
        {purchasedEntries.map(([c, v]) => (
          <p key={c} className="text-lg font-semibold text-muted-foreground tabular-nums">
            {formatPrice(v.purchased, c)}
          </p>
        ))}
      </div>
    );
  }
  const summary = formatStatsPurchasedSummary(stats, language);
  return <p className="text-lg font-semibold text-muted-foreground">{summary}</p>;
}

function MobileParticipantRow({ user }: { user: UserWithStats }) {
  const { language, t } = useI18n();
  const purchasedItems = Math.max(0, user.stats.totalItems - user.stats.unpurchasedItems);
  const wishlistValue = formatStatsUnpurchasedSummary(user.stats, language);
  const purchasedValue = formatStatsPurchasedSummary(user.stats, language);

  return (
    <details className="group overflow-hidden rounded-xl border border-border/58 bg-[hsl(var(--surface-2))]">
      <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-[hsl(var(--surface-3))/0.42] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/45 [&::-webkit-details-marker]:hidden">
        <UserAvatar
          avatarUrl={user.avatarUrl || undefined}
          name={user.name}
          userId={user.id}
          size="md"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{user.name}</span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            @{user.username} · {user.stats.unpurchasedItems} {t("Активных желаний").toLowerCase()}
          </span>
        </span>
        <span className="min-w-0 max-w-[7.75rem] text-right">
          <span className="block text-[10px] leading-tight text-muted-foreground">
            {t("Итого к покупке")}
          </span>
          <span className="mt-0.5 block truncate text-sm font-semibold tabular-nums text-foreground">
            {wishlistValue}
          </span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
          aria-hidden
        />
      </summary>

      <div className="border-t border-border/55 px-3 pb-3 pt-2.5">
        <div className="mb-2.5 flex items-baseline justify-between gap-3">
          <p className="text-xs text-muted-foreground">{t("Ориентировочная стоимость")}</p>
          <p className="max-w-[62%] text-right text-sm font-semibold leading-snug tabular-nums text-foreground">
            {wishlistValue}
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-border/55">
          <div className="pr-2.5">
            <p className="text-[10px] leading-tight text-muted-foreground">{t("Всего товаров")}</p>
            <p className="mt-1 text-base font-semibold tabular-nums">{user.stats.totalItems}</p>
          </div>
          <div className="px-2.5">
            <p className="text-[10px] leading-tight text-muted-foreground">{t("Не куплено")}</p>
            <p className="mt-1 text-base font-semibold tabular-nums">
              {user.stats.unpurchasedItems}
            </p>
          </div>
          <div className="pl-2.5">
            <p className="text-[10px] leading-tight text-muted-foreground">{t("Куплено")}</p>
            <p className="mt-1 text-base font-semibold tabular-nums">{purchasedItems}</p>
          </div>
        </div>

        {statsHasPurchasedPrices(user.stats) && purchasedValue ? (
          <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-border/55 pt-2.5">
            <p className="text-xs text-muted-foreground">{t("Отмечено купленным")}</p>
            <p className="max-w-[62%] text-right text-sm font-semibold leading-snug tabular-nums text-foreground">
              {purchasedValue}
            </p>
          </div>
        ) : null}
      </div>
    </details>
  );
}

function ParticipantsSection({ users }: { users: UserWithStats[] }) {
  const { t } = useI18n();

  return (
    <section className="min-w-0 border-t border-border/55 pt-4 [grid-area:participants] sm:pt-5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">{t("Участники")}</h2>
          <p className="mt-0.5 max-w-[62ch] text-xs text-muted-foreground">
            {t("Личные итоги по товарам, активным желаниям и уже закрытым покупкам")}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-muted-foreground tabular-nums">
          <Users className="h-3.5 w-3.5" aria-hidden />
          {users.length}
        </span>
      </div>

      <div className="space-y-2 md:hidden">
        {users.map((user) => (
          <MobileParticipantRow key={user.id} user={user} />
        ))}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-2 2xl:grid-cols-3 min-[2200px]:grid-cols-4">
        {users.map((user) => (
          <Card
            key={user.id}
            className={cn(
              uiSurface.interactiveCard,
              "h-full border-border/58 bg-[hsl(var(--surface-2))] shadow-none",
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  avatarUrl={user.avatarUrl || undefined}
                  name={user.name}
                  userId={user.id}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <CardTitle className="truncate text-lg">{user.name}</CardTitle>
                  <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 border-y border-border/60 py-2.5 text-sm">
                <div className="pr-3">
                  <p className="text-xs text-muted-foreground">{t("Всего товаров")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{user.stats.totalItems}</p>
                </div>
                <div className="border-l border-border/60 pl-3">
                  <p className="text-xs text-muted-foreground">{t("Не куплено")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {user.stats.unpurchasedItems}
                  </p>
                </div>
              </div>

              <div className="border-t border-border/70 pt-3">
                <p className="mb-1 text-xs text-muted-foreground">
                  {t("Ориентировочная стоимость")}
                </p>
                <StatsWishlistValueBlock stats={user.stats} />
              </div>

              {statsHasPurchasedPrices(user.stats) ? (
                <div className="border-t border-border/70 pt-2">
                  <p className="mb-1 text-xs text-muted-foreground">{t("Отмечено купленным")}</p>
                  <StatsPurchasedValueBlock stats={user.stats} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
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
  return entries.map(([currency, value]) => formatPrice(value.unpurchased, currency, language));
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
    return [`hsl(var(--priority-${priority}) / 0.94) ${start.toFixed(2)}% ${end.toFixed(2)}%`];
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
    <section className={cn(uiSurface.contentPanel, "overflow-hidden p-3.5 sm:p-5 lg:p-6")}>
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)] lg:gap-0">
        <div className="space-y-4 sm:space-y-5 lg:pr-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{t("Итого к покупке")}</p>
            <div className="mt-1.5 space-y-0.5 sm:mt-2 sm:space-y-1">
              {totalValues.map((value) => (
                <p
                  key={value}
                  className="text-[1.75rem] font-semibold leading-tight tracking-tight tabular-nums sm:text-4xl"
                >
                  {value}
                </p>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 border-y border-border/55 py-2.5 sm:py-3">
            <div className="min-w-0 pr-2.5 sm:pr-3">
              <Package className="mb-1.5 h-4 w-4 text-info sm:mb-2" aria-hidden />
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">{summary.totalItems}</p>
              <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {t("Всего товаров")}
              </p>
            </div>
            <div className="min-w-0 border-l border-border/55 px-2.5 sm:px-3">
              <Target className="mb-1.5 h-4 w-4 text-warning sm:mb-2" aria-hidden />
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">
                {summary.unpurchasedItems}
              </p>
              <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {t("Активных желаний")}
              </p>
            </div>
            <div className="min-w-0 border-l border-border/55 pl-2.5 sm:pl-3">
              <Users className="mb-1.5 h-4 w-4 text-primary sm:mb-2" aria-hidden />
              <p className="text-xl font-semibold tabular-nums sm:text-2xl">
                {summary.memberCount}
              </p>
              <p className="text-[11px] leading-tight text-muted-foreground sm:text-xs">
                {t("Участников")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-border/55 pt-4 sm:grid-cols-2 sm:gap-5 sm:pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="min-w-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="relative h-[4.5rem] w-[4.5rem] shrink-0 rounded-full shadow-[inset_0_0_0_1px_hsl(var(--foreground)/0.08)] sm:h-24 sm:w-24"
                style={{ background: getPriorityGradient(summary.priorityCounts) }}
                aria-hidden
              >
                <div className="absolute inset-4 rounded-full bg-[hsl(var(--surface-2))] sm:inset-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t("Распределение по приоритетам")}</p>
                <div className="mt-2 space-y-1 sm:mt-3 sm:space-y-1.5">
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

          <div className="min-w-0 border-t border-border/55 pt-4 sm:border-l sm:border-t-0 sm:pl-5 sm:pt-0">
            <div className="mb-2.5 flex items-center gap-2 sm:mb-3">
              <CircleDollarSign className="h-4 w-4 text-success" aria-hidden />
              <p className="text-sm font-semibold">{t("Самые дорогие желания")}</p>
            </div>
            {summary.topItems.length > 0 ? (
              <div className="space-y-2 sm:space-y-2.5">
                {summary.topItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-md py-0.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.userName}</p>
                    </div>
                    <p className="font-semibold tabular-nums text-foreground">
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
  } = useSWR<StatsResponse>(status === "authenticated" ? "/api/users/stats" : null, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    dedupingInterval: 30000,
  });

  const { data: versionData } = useSWR<{ version: string }>("/api/version", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  const { data: recentItemsData } = useSWR<ItemsPage>(
    status === "authenticated" ? "/api/items?limit=8" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
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
        <PageMain className={uiLayout.workspaceCanvas}>
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
      <PageMain className={uiLayout.workspaceCanvas}>
        <div className="space-y-4 sm:space-y-5">
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
            <div className="grid grid-cols-1 [grid-template-areas:'overview'_'activity'_'participants'] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:[grid-template-areas:'overview_activity'_'participants_activity'] 2xl:gap-5">
              <div className="min-w-0 [grid-area:overview]">
                <StatsOverview summary={summary} />
              </div>

              <ParticipantsSection users={users} />

              <div className="min-w-0 [grid-area:activity] xl:sticky xl:top-6 xl:self-start">
                <RecentActivityPanel items={recentItemsData?.items ?? []} />
              </div>
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
