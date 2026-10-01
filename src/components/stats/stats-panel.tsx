"use client";

import { useSession } from "next-auth/react";
import useSWR from "swr";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { BarChart3, Gift, Heart } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { CountUp, COUNT_UP_MS, useInViewOnce } from "@/components/ui/count-up";
import { EmptyState } from "@/components/ui/empty-state";
import { RecentActivityPanel } from "@/components/dashboard/recent-activity-panel";
import { RetryNotice } from "@/components/ui/retry-notice";
import { useI18n } from "@/components/i18n/language-provider";
import { getPriorityLabel } from "@/lib/priority";
import { fetcher, formatPrice, formatStatsSummary, sortCurrencyTotalsEntries } from "@/lib/utils";
import type { ItemsPage, StatsSummary, UserWithStats } from "@/types";

type StatsResponse = {
  users: UserWithStats[];
  summary?: StatsSummary;
};

const PRIORITY_ORDER = [5, 4, 3, 2, 1] as const;

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

/** Непокупленная сумма по валютам; без цен — ноль в рублях. */
function summaryTotals(pricesByCurrency: StatsSummary["pricesByCurrency"]) {
  const entries = sortCurrencyTotalsEntries(pricesByCurrency).filter(
    ([, value]) => value.unpurchased > 0,
  );
  if (entries.length === 0) return [{ currency: "RUB", value: 0 }];
  return entries.map(([currency, value]) => ({ currency, value: value.unpurchased }));
}

/**
 * Итоги — крупная сумма (`stat-display` 48/700, DESIGN.md) и три счётчика в
 * строку через волосяную линию. Числа отсчитываются, когда попадают в кадр —
 * Odometer Count-up (kinetics).
 */
function StatsTotals({ summary }: { summary: StatsSummary }) {
  const { language, t } = useI18n();
  const totals = summaryTotals(summary.pricesByCurrency);
  const counters = [
    { label: "Всего желаний", value: summary.totalItems },
    { label: "Активных желаний", value: summary.unpurchasedItems },
    { label: "Участников", value: summary.memberCount },
  ];

  return (
    <section
      aria-label={t("Сумма всех желаний")}
      className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
    >
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{t("Сумма всех желаний")}</p>
        <div className="mt-2 space-y-1">
          {totals.map(({ currency, value }) => (
            <p
              key={currency}
              className="text-[2.5rem] font-bold leading-none tracking-[-0.02em] sm:text-5xl"
            >
              <CountUp value={value} format={(n) => formatPrice(n, currency, language)} />
            </p>
          ))}
        </div>
      </div>

      {/* Число над подписью и прижато к верху ячейки (`justify-end` в обратной
          колонке): подпись в две строки на телефоне не поднимает свою цифру. */}
      <dl className="grid grid-cols-3 divide-x divide-border md:flex md:shrink-0">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className="flex min-w-0 flex-col-reverse justify-end gap-1 px-4 first:pl-0 last:pr-0 md:px-8"
          >
            <dt className="text-xs leading-tight text-muted-foreground sm:text-sm">
              {t(counter.label)}
            </dt>
            <dd className="text-[1.75rem] font-bold leading-none tracking-[-0.02em]">
              <CountUp value={counter.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/**
 * Приоритеты — пять полос чернилами вместо радужной: шкала всегда с подписью
 * и числом (DESIGN.md → «Приоритеты»), цвет приоритета — только точкой.
 * Полосы растут вместе с числами: тот же триггер и та же кривая, что у
 * Odometer Count-up, через `transform`, а не ширину.
 */
function PriorityBars({ priorityCounts }: { priorityCounts: StatsSummary["priorityCounts"] }) {
  const { language, t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [ref, inView] = useInViewOnce<HTMLUListElement>();
  const rows = PRIORITY_ORDER.map((priority) => ({
    priority,
    count: priorityCounts[String(priority)] ?? 0,
  }));
  const max = Math.max(...rows.map((row) => row.count));

  return (
    <section aria-labelledby="stats-priorities" className="min-w-0">
      <h2 id="stats-priorities" className="section-title">
        {t("Распределение по приоритетам")}
      </h2>
      {max === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("Пока нечего распределять")}</p>
      ) : (
        <ul ref={ref} className="mt-5 flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.priority}
              className="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: `hsl(var(--priority-${row.priority}))` }}
                />
                <span className="truncate">{getPriorityLabel(row.priority, language)}</span>
              </span>
              <span
                aria-hidden
                className="h-2 overflow-hidden rounded-full bg-[hsl(var(--surface-4))]"
              >
                <span
                  className="block h-full origin-left rounded-full bg-foreground"
                  style={{
                    transform: `scaleX(${inView || reduceMotion ? row.count / max : 0})`,
                    transition: reduceMotion
                      ? undefined
                      : `transform ${COUNT_UP_MS}ms cubic-bezier(0.33, 1, 0.68, 1)`,
                  }}
                />
              </span>
              <span className="text-right font-semibold tabular-nums">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TopItems({ summary, available }: { summary: StatsSummary; available: boolean }) {
  const { language, t } = useI18n();
  return (
    <section aria-labelledby="stats-top" className="min-w-0">
      <h2 id="stats-top" className="section-title">
        {t("Самые дорогие желания")}
      </h2>
      {summary.topItems.length > 0 ? (
        <ol className="mt-4 divide-y divide-border">
          {summary.topItems.map((item, index) => (
            <li key={item.id} className="flex items-center gap-4 py-3 text-sm">
              <span className="w-4 shrink-0 text-right text-muted-foreground tabular-nums">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{item.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.userName}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">
                {formatPrice(item.price, item.currency, language)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {available ? t("Нет желаний с ценой") : t("Подборка недоступна офлайн")}
        </p>
      )}
    </section>
  );
}

/**
 * Участник — та же «Карточка человека», что на вкладке профилей: лицо, имя,
 * три счётчика в строку, сумма и два выхода — к желаниям и к подсказкам.
 * Одна карточка на все ширины вместо отдельного аккордеона для телефона.
 */
function ParticipantCard({ user }: { user: UserWithStats }) {
  const { language, t } = useI18n();
  const purchasedItems = Math.max(0, user.stats.totalItems - user.stats.unpurchasedItems);
  const wishlistValue =
    formatStatsSummary(user.stats, "unpurchased", language) ??
    formatPrice(0, user.stats.currency || "RUB", language);
  const purchasedValue = formatStatsSummary(user.stats, "purchased", language);
  const counters = [
    { label: "Всего желаний", value: user.stats.totalItems },
    { label: "Не куплено", value: user.stats.unpurchasedItems },
    { label: "Куплено", value: purchasedItems },
  ];

  return (
    <article className="flex h-full min-w-0 flex-col gap-5 rounded-xl border border-border bg-background p-6">
      <div className="flex min-w-0 items-center gap-4">
        <UserAvatar
          avatarUrl={user.avatarUrl || undefined}
          name={user.name}
          userId={user.id}
          size="xl"
          className="size-14 shrink-0 text-lg"
        />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold leading-tight tracking-[-0.01em]">
            {user.name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-border border-y border-border py-3">
        {counters.map((counter) => (
          <div
            key={counter.label}
            className="flex min-w-0 flex-col-reverse justify-end gap-1 px-3 first:pl-0"
          >
            <dt className="truncate text-xs text-muted-foreground">{t(counter.label)}</dt>
            <dd className="text-lg font-semibold tabular-nums">{counter.value}</dd>
          </div>
        ))}
      </dl>

      <dl className="space-y-2 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">{t("Ориентировочная стоимость")}</dt>
          <dd className="text-right font-semibold tabular-nums">{wishlistValue}</dd>
        </div>
        {purchasedValue ? (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{t("Отмечено купленным")}</dt>
            <dd className="text-right font-semibold tabular-nums">{purchasedValue}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-auto grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href={`/?userId=${user.id}`}>
            <Gift className="h-4 w-4" aria-hidden />
            {t("Желания")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/preferences?userId=${user.id}`}>
            <Heart className="h-4 w-4" aria-hidden />
            {t("Что подойдёт")}
          </Link>
        </Button>
      </div>
    </article>
  );
}

/**
 * Скелет повторяет раскладку: итоги, две колонки, сетка участников.
 */
function StatsPanelSkeleton() {
  return (
    <div className="animate-pulse space-y-12" role="status" aria-live="polite">
      <span className="sr-only">Загрузка статистики</span>
      <div className="flex flex-wrap items-end justify-between gap-8">
        <div className="h-16 w-72 rounded-lg bg-muted/55" />
        <div className="h-14 w-96 max-w-full rounded-lg bg-muted/45" />
      </div>
      <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="h-72 rounded-xl bg-muted/45" />
        <div className="h-72 rounded-xl bg-muted/32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="h-72 rounded-xl bg-muted/32" />
        <div className="h-72 rounded-xl bg-muted/32" />
      </div>
    </div>
  );
}

/**
 * Статистика — вкладка «Подарочных профилей», а не отдельный раздел меню.
 *
 * Спокойная страница вместо панели с плитками (DESIGN.md: «Не SaaS-панель»):
 * итоги крупно, ниже две колонки — приоритеты и дорогие желания слева, лента
 * изменений справа, — затем участники. Разделы разделены воздухом и линией.
 */
export function StatsPanel() {
  const { t } = useI18n();
  const { status } = useSession();

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

  if (status === "loading" || isLoading) {
    return <StatsPanelSkeleton />;
  }

  if (error || !statsData) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" aria-hidden />}
        title={t("Не удалось загрузить статистику")}
        description={t("Проверьте подключение и попробуйте обновить данные.")}
        actionLabel={t("Повторить")}
        onAction={() => mutate()}
      />
    );
  }

  const users = statsData.users || [];
  const summary = statsData.summary ?? buildStatsSummary(users);

  if (users.length === 0) {
    return (
      <EmptyState
        icon={<BarChart3 className="h-5 w-5" aria-hidden />}
        title={t("Нет данных для отображения")}
        description={t("Статистика появится, когда в общих списках будут желания.")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-12">
      <StatsTotals summary={summary} />

      <div className="grid gap-12 border-t border-border pt-12 xl:grid-cols-[minmax(0,1fr)_24rem] xl:gap-16">
        <div className="flex min-w-0 flex-col gap-12">
          <PriorityBars priorityCounts={summary.priorityCounts} />
          <TopItems summary={summary} available={Boolean(statsData.summary)} />
        </div>
        {recentItemsError ? (
          <RetryNotice>
            {t("Не удалось загрузить активность. Остальная статистика доступна.")}
          </RetryNotice>
        ) : (
          <RecentActivityPanel items={recentItemsData?.items ?? []} />
        )}
      </div>

      <section aria-labelledby="stats-participants" className="border-t border-border pt-12">
        <h2 id="stats-participants" className="section-title">
          {t("Участники")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Личные итоги по желаниям, активным идеям и уже закрытым покупкам")}
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {users.map((user) => (
            <ParticipantCard key={user.id} user={user} />
          ))}
        </div>
      </section>
    </div>
  );
}
