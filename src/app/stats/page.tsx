"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { UserAvatar } from "@/components/UserAvatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BarChart3, ChevronDown, Gift, Heart, Package, Target, Users } from "lucide-react";
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
import { uiSurface } from "@/lib/ui-contract";
import { useI18n } from "@/components/i18n/language-provider";
import { RetryNotice } from "@/components/ui/retry-notice";

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
            {formatPrice(v.purchased, c, language)}
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
    <details className="group overflow-hidden rounded-xl border border-border/55 bg-[hsl(var(--surface-2))]">
      <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center gap-3 px-3 py-2.5 outline-none transition-colors hover:bg-[hsl(var(--surface-3)/0.42)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/45 [&::-webkit-details-marker]:hidden">
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
            {t("Сумма всех желаний")}
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
            <p className="text-[10px] leading-tight text-muted-foreground">{t("Всего желаний")}</p>
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

        {/* Ссылки живут в раскрытой части, а не в summary: вложенная ссылка
            внутри summary ломает и раскрытие, и клавиатуру. */}
        <ParticipantLinks userId={user.id} className="mt-3 border-t border-border/55 pt-3" />
      </div>
    </details>
  );
}

/**
 * Выход из цифр к человеку.
 *
 * Карточка участника показывала «14 не куплено · 42 000 ₽» и не вела никуда:
 * ни ссылки, ни обработчика. Человек, пришедший узнать, что подарить, упирался
 * в тупик и возвращался на главную вручную. Механика перехода в продукте уже
 * была — ею пользуются лента активности и строка дня рождения в календаре.
 */
function ParticipantLinks({ userId, className }: { userId: string; className?: string }) {
  const { t } = useI18n();
  const linkClassName =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border/55 px-3 text-xs font-semibold transition-colors hover:border-primary/32 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55";

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link href={`/?userId=${userId}`} className={linkClassName}>
        <Gift className="h-3.5 w-3.5" aria-hidden />
        {t("Желания")}
      </Link>
      <Link href={`/preferences?userId=${userId}`} className={linkClassName}>
        <Heart className="h-3.5 w-3.5" aria-hidden />
        {t("Что подойдёт")}
      </Link>
    </div>
  );
}

function ParticipantsSection({ users }: { users: UserWithStats[] }) {
  const { t } = useI18n();

  return (
    <section className="min-w-0 border-t border-border/55 pt-4 [grid-area:participants] sm:pt-5">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="section-title text-foreground">{t("Участники")}</h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
            {t("Личные итоги по желаниям, активным идеям и уже закрытым покупкам")}
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

      {/*
       * `auto-fit` вместо фиксированных колонок: при одном участнике пустые
       * дорожки схлопываются, и карточка занимает ширину секции, а не треть
       * её с большой пустотой справа.
       */}
      {/*
       * Минимум 16rem, а не 17: на 1280px левая колонка страницы становится
       * 552px, а двум дорожкам по 17rem нужно 556 — сетка схлопывалась
       * с трёх колонок в одну ровно на переходе через брейкпоинт.
       */}
      <div className="hidden gap-3 md:grid md:grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]">
        {users.map((user) => (
          /* `interactiveCard` убран: он давал hover рамки на узле, который
             никуда не ведёт — карточка выглядела нажимаемой и ею не была.
             Нажимаемы теперь имя и две ссылки в подвале. */
          <Card
            key={user.id}
            className="flex h-full flex-col border-border/55 bg-[hsl(var(--surface-2))] shadow-none"
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
                  <CardTitle className="truncate text-lg">
                    <Link
                      href={`/?userId=${user.id}`}
                      className="rounded transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/55"
                    >
                      {user.name}
                    </Link>
                  </CardTitle>
                  <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col space-y-3">
              <div className="grid grid-cols-2 border-y border-border/55 py-2.5 text-sm">
                <div className="pr-3">
                  <p className="text-xs text-muted-foreground">{t("Всего желаний")}</p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">{user.stats.totalItems}</p>
                </div>
                <div className="border-l border-border/55 pl-3">
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

              <ParticipantLinks
                userId={user.id}
                className="mt-auto border-t border-border/70 pt-3"
              />
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

function getPriorityShares(priorityCounts: StatsSummary["priorityCounts"]) {
  const total = Object.values(priorityCounts).reduce((sum, count) => sum + count, 0);
  if (total === 0) return { total, shares: [] as { priority: number; count: number }[] };

  return {
    total,
    shares: PRIORITY_ORDER.map((priority) => ({
      priority,
      count: priorityCounts[String(priority)] ?? 0,
    })).filter((entry) => entry.count > 0),
  };
}

function StatsOverview({
  summary,
  topItemsAvailable,
}: {
  summary: StatsSummary;
  /** Локальная сводка складывается из счётчиков участников и не знает отдельных желаний. */
  topItemsAvailable: boolean;
}) {
  const { language, t } = useI18n();
  const totalValues = formatSummaryValues(summary.pricesByCurrency, language);
  const totalPriorityItems = Object.values(summary.priorityCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const { shares } = getPriorityShares(summary.priorityCounts);

  return (
    <section className={cn(uiSurface.contentPanel, "overflow-hidden p-4 sm:p-5 lg:p-6")}>
      <div className="flex flex-col gap-6 sm:gap-7">
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-5">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{t("Сумма всех желаний")}</p>
            <div className="mt-2 space-y-1">
              {totalValues.map((value) => (
                <p
                  key={value}
                  className="text-[clamp(1.75rem,1.2rem+1.8vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.02em] tabular-nums"
                >
                  {value}
                </p>
              ))}
            </div>
          </div>

          <dl className="flex shrink-0 items-start gap-5 sm:gap-7">
            <div className="min-w-0">
              <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                <Package className="size-3.5 text-info" aria-hidden />
                {t("Всего желаний")}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{summary.totalItems}</dd>
            </div>
            <div className="min-w-0 border-l border-border/55 pl-5 sm:pl-7">
              <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                <Target className="size-3.5 text-warning" aria-hidden />
                {t("Активных желаний")}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">
                {summary.unpurchasedItems}
              </dd>
            </div>
            <div className="min-w-0 border-l border-border/55 pl-5 sm:pl-7">
              <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground sm:text-xs">
                <Users className="size-3.5 text-primary" aria-hidden />
                {t("Участников")}
              </dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums">{summary.memberCount}</dd>
            </div>
          </dl>
        </div>

        {/*
         * Распределение показано полосой, а не кольцом: кольцо требует легенды
         * сбоку, а в узкой колонке подписи приоритетов обрезались до «Нуж…».
         * Полоса занимает всю ширину, а подписи ложатся под ней и всегда
         * читаются целиком.
         */}
        <div className="border-t border-border/55 pt-5">
          <p className="section-title">{t("Распределение по приоритетам")}</p>
          {shares.length > 0 ? (
            <>
              <div
                className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--surface-4))]"
                role="img"
                aria-label={shares
                  .map(
                    (entry) =>
                      `${getPriorityLabel(entry.priority, language)}: ${entry.count} ${t("из")} ${totalPriorityItems}`,
                  )
                  .join(", ")}
              >
                {shares.map((entry) => (
                  <span
                    key={entry.priority}
                    className="h-full transition-[flex-grow] duration-[var(--dur-slow)] ease-[var(--ease-expo)]"
                    style={{
                      flexGrow: entry.count,
                      backgroundColor: `hsl(var(--priority-${entry.priority}))`,
                    }}
                  />
                ))}
              </div>
              <ul className="mt-3.5 flex flex-wrap gap-x-5 gap-y-2">
                {shares.map((entry) => (
                  <li key={entry.priority} className="flex items-center gap-2 text-xs">
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `hsl(var(--priority-${entry.priority}))` }}
                    />
                    <span className="text-muted-foreground">
                      {getPriorityLabel(entry.priority, language)}
                    </span>
                    <span className="font-semibold tabular-nums">{entry.count}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">{t("Пока нечего распределять")}</p>
          )}
        </div>

        <div className="border-t border-border/55 pt-5">
          <p className="section-title">{t("Самые дорогие желания")}</p>
          {summary.topItems.length > 0 ? (
            <ul className="mt-3 divide-y divide-border/45">
              {summary.topItems.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.userName}</p>
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-foreground">
                    {formatPrice(item.price, item.currency, language)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {topItemsAvailable ? t("Нет желаний с ценой") : t("Подборка недоступна офлайн")}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * Скелет вместо центрированного спиннера.
 *
 * Спиннер занимал всю страницу, терял `PageIntro` и не имел ни `role="status"`,
 * ни доступного имени — а при `prefers-reduced-motion` глобальное правило
 * останавливает `animate-spin`, и от загрузки оставалась немая застывшая
 * иконка. Соседняя `/preferences` для того же случая давно рисует скелет.
 */
function StatsPageSkeleton() {
  return (
    <PageShell>
      <PageMain>
        <div className="space-y-4 animate-pulse" role="status" aria-live="polite">
          <span className="sr-only">Загрузка статистики</span>
          <div className="h-24 rounded-2xl bg-muted/55" />
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]">
            <div className="h-72 rounded-2xl bg-muted/45" />
            <div className="h-72 rounded-2xl bg-muted/32 xl:row-span-2" />
            <div className="h-56 rounded-2xl bg-muted/32" />
          </div>
        </div>
      </PageMain>
    </PageShell>
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

  // Ошибка ленты читается: без неё падение запроса давало пустой массив,
  // визуально неотличимый от «активности пока нет».
  const { data: recentItemsData, error: recentItemsError } = useSWR<ItemsPage>(
    status === "authenticated" ? "/api/items?limit=8" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  // Навигация — побочный эффект, а не результат рендера: вызов router.push
  // прямо в теле компонента предупреждает React и на других страницах
  // проекта уже сделан через эффект.
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "unauthenticated") {
    return null;
  }

  if (status === "loading" || isLoading) {
    return <StatsPageSkeleton />;
  }

  if (error || !statsData) {
    return (
      <PageShell>
        <PageMain>
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
      <PageMain>
        <div>
          <PageIntro
            title={t("Статистика")}
            description={t("Желания в общих подборках и ориентировочная стоимость по участникам")}
          />

          {users.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" aria-hidden />}
              title={t("Нет данных для отображения")}
              description={t("Статистика появится, когда в общих списках будут желания.")}
            />
          ) : (
            <div className="grid grid-cols-1 [grid-template-areas:'overview'_'activity'_'participants'] gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)] xl:[grid-template-areas:'overview_activity'_'participants_activity'] 2xl:gap-5">
              <div className="min-w-0 [grid-area:overview]">
                <StatsOverview summary={summary} topItemsAvailable={Boolean(statsData.summary)} />
              </div>

              <ParticipantsSection users={users} />

              <div className="min-w-0 [grid-area:activity] xl:sticky xl:top-6 xl:self-start">
                {recentItemsError ? (
                  <RetryNotice>
                    {t("Не удалось загрузить активность. Остальная статистика доступна.")}
                  </RetryNotice>
                ) : (
                  <RecentActivityPanel items={recentItemsData?.items ?? []} />
                )}
              </div>
            </div>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
