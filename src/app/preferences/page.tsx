"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { useReducedMotion } from "framer-motion";
import { BarChart3, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetryNotice } from "@/components/ui/retry-notice";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatsPanel } from "@/components/stats/stats-panel";
import { PageMain, PageShell } from "@/components/ui/page-shell";
import { cn, fetcher } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";
import { PreferenceProfileSearch } from "@/components/preferences/preference-profile-search";
import {
  ProfileSwatchCard,
  type ProfileOccasion,
} from "@/components/preferences/profile-swatch-card";
import { ProfileStage } from "@/components/preferences/profile-stage";
import { daysBetween, useUpcomingOccurrences } from "@/components/calendar/UpcomingCalendarCard";
import {
  PROFILE_SEARCH_THRESHOLD,
  giftPreferencesDraftKey,
  searchPreferenceProfiles,
} from "@/lib/preference-profiles";
import { uiLayout, uiSurface } from "@/lib/ui-contract";
import { type GiftPreferences, normalizeGiftPreferences } from "@/lib/preferences";

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

const STAGE_ID = "profile-stage";

/**
 * Круг наполняется не сам.
 *
 * В круг попадают владельцы и зрители подборок, видных участнику
 * (`/api/users/stats`), — то есть люди появляются здесь после того, как кто-то
 * поделился списком. Пока этого не случилось, человек видит на странице себя
 * одного под заголовком, который обещает «каждого в вашем кругу», и объяснения
 * этому не было никакого.
 */
function CircleHint() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    /* `py-6` вместо десятки из токена: раздел не пуст — своя карточка стоит
       выше, — и подсказка обязана читаться примечанием под ней, а не первым
       экраном раздела. По той же причине заголовок здесь гротеск: антиква
       принадлежит крупному шагу, а он на странице уже занят. */
    // Ширина по колонке сетки: подсказка стоит под единственной карточкой
    // круга, и растянутая во всю рамку она спорила бы с ней краем.
    <div className={cn(uiSurface.emptyState, "py-6 md:max-w-[32rem]")}>
      <Users className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="mt-3 text-sm font-semibold">{t("В круге пока только вы")}</p>
      <p className="mx-auto mt-1 max-w-[46ch] text-sm leading-relaxed text-muted-foreground">
        {t("Профили появляются, когда вы делитесь подборкой или кто-то открывает свою вам.")}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4"
        onClick={() => router.push("/?list=new")}
      >
        {t("Создать подборку")}
      </Button>
    </div>
  );
}

function PreferencesPageSkeleton() {
  return (
    <PageShell>
      <PageMain>
        {/* Скелет повторяет реальную сетку и радиус карточки: со своей
            геометрией он обещал одну раскладку, а данные приносили другую,
            и страница дёргалась на загрузке. */}
        <div className="animate-pulse space-y-5">
          <div className="h-11 w-72 rounded-full bg-muted" />
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-24 rounded-xl bg-muted" />
              <div className="h-24 rounded-xl bg-muted" />
            </div>
            <div className="h-96 rounded-xl bg-muted max-lg:order-first" />
          </div>
        </div>
      </PageMain>
    </PageShell>
  );
}

/**
 * Статистика и другие поверхности ссылаются сюда с `?userId=`, чтобы человек
 * попадал не в общий список, а сразу на профиль того, кому выбирает подарок.
 */
export default function PreferencesPage() {
  return (
    <Suspense fallback={<PreferencesPageSkeleton />}>
      <PreferencesPageContent />
    </Suspense>
  );
}

function PreferencesPageContent() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId");
  // Вкладка живёт в адресе: старые ссылки на `/stats` ведут сюда с `?tab=stats`.
  const tab = searchParams.get("tab") === "stats" ? "stats" : "profiles";
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
  const [profileSearch, setProfileSearch] = useState("");
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
      searchPreferenceProfiles(allCircleUsers, {
        query: profileSearch,
        currentUserId: data?.id,
      }),
    [allCircleUsers, data?.id, profileSearch],
  );
  // Поиск появляется только когда круг перестаёт помещаться в один взгляд.
  const showProfileSearch =
    allCircleUsers.length > PROFILE_SEARCH_THRESHOLD || profileSearch.trim().length > 0;

  /*
   * Ближайший день рождения каждого — из того же запроса, что и повод на
   * главной. Круг упорядочен по нему: перед праздником первым нужен тот,
   * кому дарить раньше. Свой образец — последним: сюда приходят выбирать
   * подарок другому.
   */
  const { data: calendar, today } = useUpcomingOccurrences();
  const occasions = useMemo(() => {
    const byPerson = new Map<string, ProfileOccasion>();
    for (const occurrence of calendar?.occurrences ?? []) {
      if (occurrence.type !== "BIRTHDAY" || byPerson.has(occurrence.person.id)) continue;
      const days = daysBetween(today, occurrence.date);
      if (days >= 0) byPerson.set(occurrence.person.id, { date: occurrence.date, days });
    }
    return byPerson;
  }, [calendar?.occurrences, today]);

  const orderedUsers = useMemo(() => {
    const others = circleUsers
      .filter((user) => user.id !== data?.id)
      .sort(
        (a, b) =>
          (occasions.get(a.id)?.days ?? Infinity) - (occasions.get(b.id)?.days ?? Infinity) ||
          a.name.localeCompare(b.name),
      );
    const self = circleUsers.filter((user) => user.id === data?.id);
    return [...others, ...self];
  }, [circleUsers, data?.id, occasions]);

  // Выбор живёт в адресе: ссылки из статистики и календаря ведут сразу к
  // человеку. Без выбора на сцене тот, кому дарить раньше всех.
  const selectedUser =
    orderedUsers.find((user) => user.id === requestedUserId) ?? orderedUsers[0] ?? null;

  const stageRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  /*
   * Ниже `lg` круг — горизонтальная лента с привязкой прокрутки. Пока круг
   * грузится, в ленте стоит один свой образец, и браузер держит привязку к
   * нему, когда остальные встают перед ним, — лента уезжала в конец. Лента
   * сама держит в поле зрения выбранного человека.
   */
  const selectedId =
    orderedUsers.find((user) => user.id === requestedUserId)?.id ?? orderedUsers[0]?.id;
  useEffect(() => {
    const strip = stripRef.current;
    const card = strip?.querySelector<HTMLElement>(`[data-testid="profile-swatch-${selectedId}"]`);
    if (!strip || !card || strip.scrollWidth <= strip.clientWidth) return;
    const offset = card.getBoundingClientRect().left - strip.getBoundingClientRect().left - 16;
    strip.scrollTo({ left: strip.scrollLeft + offset, behavior: "auto" });
  }, [selectedId, orderedUsers.length]);
  const selectUser = (userId: string) => {
    router.replace(`/preferences?userId=${userId}`, { scroll: false });
    // Ниже `lg` сцена стоит над сеткой — к ней нужно вернуться взглядом.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      stageRef.current?.scrollIntoView({
        block: "start",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  };

  // Свой профиль не ждёт загрузки всего круга: падение /api/users/stats
  // раньше держало пустой скелет, хотя собственные данные уже пришли.
  if (status === "loading" || isLoading) return <PreferencesPageSkeleton />;

  return (
    <PageShell>
      <PageMain>
        <div className={uiLayout.pageStack}>
          {/* Раздел называет верхняя панель; видимого заголовка нет, как на главной. */}
          <h1 className="sr-only">{t("Подарочные профили")}</h1>

          <Tabs
            value={tab}
            onValueChange={(value) =>
              router.replace(value === "stats" ? "/preferences?tab=stats" : "/preferences", {
                scroll: false,
              })
            }
            className="grid gap-5"
          >
            <TabsList aria-label={t("Разделы профилей")} className="sm:max-w-sm">
              <TabsTrigger value="profiles">
                <Users className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{t("Профили")}</span>
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart3 className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate">{t("Статистика")}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="stats" className="m-0">
              <StatsPanel />
            </TabsContent>

            <TabsContent value="profiles" className="m-0">
              <section className="space-y-4" aria-label={t("Подарочные профили")}>
                {/* Падение своего профиля больше не прячет круг: раньше ошибка
                `/api/users/me` заменяла собой весь список, хотя профили
                друзей уже пришли и были главным, ради чего сюда идут. */}
                {error ? (
                  <RetryNotice onRetry={() => mutate()}>
                    {t("Не удалось загрузить ваш профиль. Профили друзей ниже доступны.")}
                  </RetryNotice>
                ) : null}

                {circleError ? (
                  <RetryNotice onRetry={() => mutateCircle()}>
                    {t("Не удалось загрузить профили друзей. Ваш профиль по-прежнему доступен.")}
                  </RetryNotice>
                ) : null}

                {showProfileSearch ? (
                  <PreferenceProfileSearch
                    search={profileSearch}
                    resultCount={circleUsers.length}
                    onSearchChange={setProfileSearch}
                  />
                ) : null}

                {selectedUser ? (
                  <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-12">
                    {/* Ниже `lg` круг — лента образцов над сценой: палитры видны
                        сразу, а не после полной сводки первого человека. */}
                    <div
                      ref={stripRef}
                      role="group"
                      aria-label={t("Круг")}
                      className="scrollbar-none -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 pt-1 sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:grid lg:grid-cols-2 lg:gap-x-4 lg:gap-y-8 lg:overflow-visible lg:px-0 lg:pb-0 [&>*]:w-[15.5rem] [&>*]:shrink-0 [&>*]:snap-start lg:[&>*]:w-auto"
                    >
                      {orderedUsers.map((user) => (
                        <ProfileSwatchCard
                          key={user.id}
                          id={user.id}
                          name={user.name}
                          avatarUrl={user.avatarUrl}
                          preferences={user.giftPreferences}
                          occasion={occasions.get(user.id)}
                          isCurrent={user.id === data?.id}
                          selected={user.id === selectedUser.id}
                          onSelect={() => selectUser(user.id)}
                        />
                      ))}
                    </div>
                    <div
                      ref={stageRef}
                      id={STAGE_ID}
                      // Сцена выше экрана не прячет «Бюджет» и заметку до конца сетки:
                      // на lg она ограничена высотой окна и прокручивается сама.
                      className="min-w-0 scroll-mt-24 [scrollbar-width:thin] lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:rounded-xl"
                    >
                      <ProfileStage
                        id={selectedUser.id}
                        name={selectedUser.name}
                        username={selectedUser.username}
                        avatarUrl={selectedUser.avatarUrl}
                        preferences={selectedUser.giftPreferences}
                        wishCount={selectedUser.stats?.totalItems}
                        occasion={occasions.get(selectedUser.id)}
                        isCurrent={selectedUser.id === data?.id}
                        hasDraft={hasStoredDraft}
                      />
                    </div>
                  </div>
                ) : profileSearch.trim() ? (
                  /* Пустая выдача поиска — единственный случай, когда список
                 действительно пуст: своя карточка всегда стоит в круге, и
                 отфильтровать её может только запрос. */
                  <div className={uiSurface.emptyState}>
                    <Search className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
                    <p className="mt-3 text-sm font-semibold">{t("Никого не нашли")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("Проверьте имя или логин.")}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setProfileSearch("")}
                    >
                      {t("Очистить поиск")}
                    </Button>
                  </div>
                ) : null}

                {/* Круг из одного человека — не пустой список, а состояние «вас тут
                пока никто не видит»: своя карточка на месте, и под ней сказано,
                откуда берутся остальные. */}
                {!profileSearch.trim() && allCircleUsers.length <= 1 ? <CircleHint /> : null}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </PageMain>
    </PageShell>
  );
}
