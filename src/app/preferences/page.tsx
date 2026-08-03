"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { motion, useReducedMotion } from "framer-motion";
import { Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {} from "@/components/ui/dialog";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { useI18n } from "@/components/i18n/language-provider";
import {} from "@/components/preferences/preference-chip-picker";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import { PreferenceProfileControls } from "@/components/preferences/preference-profile-controls";
import { PreferenceProfileCard } from "@/components/preferences/preference-profile-card";
import { fetcher } from "@/lib/fetcher";
import { giftPreferencesDraftKey } from "@/lib/preferences-draft";
import { staggerDelayMs } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";
import { type GiftPreferences, normalizeGiftPreferences } from "@/lib/preferences";
import {
  filterAndSortPreferenceProfiles,
  getPreferenceProfileSignals,
  type PreferenceProfileFilter,
  type PreferenceProfileSort,
} from "@/lib/preference-profiles";

type PreferencesUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
  _count?: { items: number };
};

type CircleUser = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
  stats?: { totalItems: number };
};

type CircleUsersResponse = {
  users: CircleUser[];
};

function PreferencesPageSkeleton() {
  return (
    <PageShell>
      <PageMain>
        <div className="space-y-5 animate-pulse">
          <div className="h-24 rounded-2xl bg-muted/50" />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-56 rounded-[1.35rem] bg-muted/40 md:col-span-2" />
            <div className="h-56 rounded-[1.35rem] bg-muted/35" />
            <div className="h-56 rounded-[1.35rem] bg-muted/35" />
          </div>
        </div>
      </PageMain>
    </PageShell>
  );
}

export default function PreferencesPage() {
  const { t } = useI18n();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { status } = useSession();
  const { data, isLoading, error, mutate } = useSWR<PreferencesUser>(
    status === "authenticated" ? "/api/users/me" : null,
    fetcher,
    { revalidateOnFocus: false },
  );
  const {
    data: circleData,
    error: circleError,
    mutate: mutateCircle,
  } = useSWR<CircleUsersResponse>(status === "authenticated" ? "/api/users/stats" : null, fetcher, {
    revalidateOnFocus: false,
  });
  const preferences = useMemo(
    () => normalizeGiftPreferences(data?.giftPreferences),
    [data?.giftPreferences],
  );
  const [profileFilter, setProfileFilter] = useState<PreferenceProfileFilter>("all");
  // По имени, а не «по заполненности»: сортировка по откровенности анкеты
  // превращает круг близких людей в таблицу лидеров.
  const [profileSort, setProfileSort] = useState<PreferenceProfileSort>("name");
  const [profileSearch, setProfileSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [hasStoredDraft, setHasStoredDraft] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [router, status]);

  // Черновик живёт на странице редактора. Здесь он нужен только чтобы
  // не молчать о незавершённой работе: иначе человек, ушедший на полпути,
  // видит список так, будто ничего не заполнял.
  useEffect(() => {
    if (!data?.id) return;
    try {
      setHasStoredDraft(Boolean(window.sessionStorage.getItem(giftPreferencesDraftKey(data.id))));
    } catch {
      setHasStoredDraft(false);
    }
  }, [data?.id]);

  const allCircleUsers = useMemo(() => {
    if (!data) return circleData?.users ?? [];
    const currentFromCircle = circleData?.users.find((user) => user.id === data.id);
    const currentUser: CircleUser = {
      id: data.id,
      username: data.username,
      name: data.name,
      avatarUrl: data.avatarUrl,
      giftPreferences: preferences,
      stats: currentFromCircle?.stats ?? { totalItems: data._count?.items ?? 0 },
    };

    return [currentUser, ...(circleData?.users.filter((user) => user.id !== data.id) ?? [])];
  }, [circleData?.users, data, preferences]);
  const circleUsers = useMemo(
    () =>
      filterAndSortPreferenceProfiles(allCircleUsers, {
        filter: profileFilter,
        sort: profileSort,
        query: profileSearch,
        currentUserId: data?.id,
      }),
    [allCircleUsers, data?.id, profileFilter, profileSearch, profileSort],
  );
  const profileFilterCounts = useMemo(
    () =>
      allCircleUsers.reduce(
        (counts, user) => {
          const signals = getPreferenceProfileSignals(user);
          counts.all += 1;
          if (signals.preferenceCount > 0) counts.filled += 1;
          if (signals.hasSizes) counts.sizes += 1;
          if (signals.avoidCount > 0) counts.avoid += 1;
          return counts;
        },
        { all: 0, filled: 0, sizes: 0, avoid: 0 },
      ),
    [allCircleUsers],
  );
  const hasProfileControls = profileFilter !== "all" || profileSearch.trim().length > 0;

  const toggleProfile = (userId: string) => {
    setExpandedUserId((current) => (current === userId ? null : userId));
  };

  const openEditor = () => {
    router.push("/preferences/me");
  };

  // Свой профиль не ждёт загрузки всего круга: падение /api/users/stats
  // раньше держало пустой скелет, хотя собственные данные уже пришли.
  if (status === "loading" || isLoading) return <PreferencesPageSkeleton />;

  return (
    <PageShell>
      <PageMain>
        <div className="space-y-5">
          <PageIntro
            title={t("Подарочные профили")}
            description={t(
              "Загляните в подсказки друзей перед выбором подарка. Свой профиль можно настроить прямо здесь.",
            )}
            actions={
              <div className="flex items-center gap-2.5 px-1 py-1">
                <div className="flex size-8 items-center justify-center text-primary">
                  <UsersRound className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t("Профилей в круге")}</p>
                  <p className="text-sm font-semibold tabular-nums">{allCircleUsers.length}</p>
                </div>
              </div>
            }
          />

          {error ? (
            <div className={cn(uiSurface.emptyState, "px-4 py-8")}>
              <p className="text-sm font-semibold">{t("Не удалось загрузить профиль")}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => mutate()}
              >
                {t("Попробовать снова")}
              </Button>
            </div>
          ) : (
            <section className="space-y-4" aria-labelledby="circle-title">
              <div className="min-w-0">
                <h2 id="circle-title" className="section-title">
                  {t("Что порадует каждого")}
                </h2>
                <p className="mt-1 max-w-[62ch] text-sm text-muted-foreground">
                  {t(
                    "Откройте карточку, чтобы посмотреть весь профиль. Ваша карточка всегда идёт первой.",
                  )}
                </p>
              </div>

              {circleError ? (
                <div className="flex flex-col gap-3 rounded-xl border border-destructive/24 bg-destructive/7 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {t("Не удалось загрузить профили друзей. Ваш профиль по-прежнему доступен.")}
                  </span>
                  <Button type="button" variant="outline" size="sm" onClick={() => mutateCircle()}>
                    {t("Повторить")}
                  </Button>
                </div>
              ) : null}

              <PreferenceProfileControls
                filter={profileFilter}
                sort={profileSort}
                search={profileSearch}
                counts={profileFilterCounts}
                resultCount={circleUsers.length}
                onFilterChange={setProfileFilter}
                onSortChange={setProfileSort}
                onSearchChange={setProfileSearch}
              />

              {circleUsers.length > 0 ? (
                <motion.div
                  layout
                  className="grid items-start gap-3 md:grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]"
                >
                  {circleUsers.map((user, index) => {
                    const isCurrent = user.id === data?.id;
                    const isExpanded = expandedUserId === user.id;
                    const cardPreferences = user.giftPreferences;

                    return (
                      <motion.div
                        layout
                        key={user.id}
                        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: reduceMotion ? 0 : staggerDelayMs(index) / 1000,
                          duration: 0.3,
                        }}
                      >
                        <PreferenceProfileCard
                          id={user.id}
                          name={user.name}
                          username={user.username}
                          avatarUrl={user.avatarUrl}
                          preferences={cardPreferences}
                          wishCount={user.stats?.totalItems}
                          isCurrent={isCurrent}
                          expanded={isExpanded}
                          onToggle={() => toggleProfile(user.id)}
                          onEdit={isCurrent ? openEditor : undefined}
                          editLabel={
                            isCurrent && hasStoredDraft ? t("Продолжить заполнение") : undefined
                          }
                        >
                          <GiftPreferencesSummary
                            userName={isCurrent ? t("вам") : user.name}
                            preferences={cardPreferences}
                            embedded
                          />
                        </PreferenceProfileCard>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className={cn(uiSurface.emptyState, "px-4 py-10 text-center")}>
                  <Search className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
                  <p className="mt-3 text-sm font-semibold">
                    {t("Подходящих профилей не найдено")}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("Измените запрос или сбросьте фильтры.")}
                  </p>
                  {hasProfileControls ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setProfileFilter("all");
                        setProfileSearch("");
                      }}
                    >
                      {t("Сбросить")}
                    </Button>
                  ) : null}
                </div>
              )}
            </section>
          )}
        </div>
      </PageMain>
    </PageShell>
  );
}
