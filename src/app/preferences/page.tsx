"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { motion, useReducedMotion } from "framer-motion";
import { Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RetryNotice } from "@/components/ui/retry-notice";
import { PageIntro, PageMain, PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";
import { GiftPreferencesSummary } from "@/components/preferences/gift-preferences-summary";
import { PreferenceProfileSearch } from "@/components/preferences/preference-profile-search";
import { PreferenceProfileCard } from "@/components/preferences/preference-profile-card";
import { fetcher } from "@/lib/fetcher";
import { giftPreferencesDraftKey } from "@/lib/preferences-draft";
import { duration, easing } from "@/lib/motion";
import { uiLayout, uiSurface } from "@/lib/ui-contract";
import { type GiftPreferences, normalizeGiftPreferences } from "@/lib/preferences";
import { PROFILE_SEARCH_THRESHOLD, searchPreferenceProfiles } from "@/lib/preference-profiles";

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

const profileAnchorId = (userId: string) => `preference-profile-${userId}`;

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
          <div className="h-24 rounded-2xl bg-muted/55" />
          <div className="grid items-start gap-3 md:grid-cols-[repeat(auto-fit,minmax(20rem,32rem))]">
            <div className="h-44 rounded-2xl bg-muted/45" />
            <div className="h-44 rounded-2xl bg-muted/32" />
            <div className="h-44 rounded-2xl bg-muted/32" />
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
  const requestedUserId = useSearchParams().get("userId");
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
  const [expandedUserId, setExpandedUserId] = useState<string | null>(requestedUserId);
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

  // Со страницы статистики сюда приходят с `?userId=`, и раскрытая карточка
  // могла оказаться далеко за краем экрана: человек видел список сначала и
  // не понимал, что ответ на его вопрос уже открыт ниже.
  const scrolledToRequested = useRef(false);
  useEffect(() => {
    if (!requestedUserId || scrolledToRequested.current) return;
    const anchor = document.getElementById(profileAnchorId(requestedUserId));
    if (!anchor) return;
    scrolledToRequested.current = true;
    anchor.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
  }, [circleUsers, reduceMotion, requestedUserId]);

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
        <div className={uiLayout.pageStack}>
          {/* Один заголовок и одно описание: раньше здесь стояли PageIntro и
              второй заголовок секции, каждый со своей фразой, плюс плашка
              «Профилей в круге: N» — счётчик того, что видно ниже глазами. */}
          <PageIntro
            title={t("Подарочные профили")}
            description={t(
              "Что подойдёт каждому в вашем кругу. Откройте карточку, чтобы увидеть профиль целиком.",
            )}
          />

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

            {circleUsers.length > 0 ? (
              /*
               * Контейнер не анимируется. На одном перестроении здесь работали
               * три вложенных `layout` сразу — сетка, обёртка карточки и сама
               * `article`, — и каждый мерил и вёл его независимо. Собственная
               * коробка сетки при этом не меняется вовсе.
               */
              /*
               * Потолок колонки 32rem: `1fr` растягивал единственную карточку
               * круга на всю рамку страницы — 1110px ширины при 260px высоты,
               * и профиль читался не карточкой, а полосой. Раскрытая карточка
               * меряет себя контейнером, поэтому потолок ей не мешает.
               */
              <div className="grid items-start gap-3 md:grid-cols-[repeat(auto-fit,minmax(20rem,32rem))]">
                {circleUsers.map((user) => {
                  const isCurrent = user.id === data?.id;
                  const isExpanded = expandedUserId === user.id;
                  const cardPreferences = user.giftPreferences;

                  return (
                    /* Раскрытие — переход к чтению, а не к сравнению: карточка
                       занимает весь ряд. В колонке шириной 20rem профиль
                       читался столбиком, а рядом оставался пустой ряд. */
                    /*
                     * Раскрытие никого не переставляет.
                     *
                     * Раньше раскрытая карточка забирала весь ряд
                     * (`md:col-span-full`), и соседняя выдавливалась на
                     * следующую строку: она проезжала по диагонали 519px —
                     * 195 вниз и 482 влево — ради того, что рядом выросло на
                     * сорок. Движение сообщало о событии втрое крупнее
                     * случившегося.
                     *
                     * Теперь карточка растёт в своей колонке. Панель внутри
                     * считает свои пороги через `@container`, то есть уже
                     * умеет читаться в колонке — ширина ряда ей не нужна.
                     *
                     * `layout` остаётся: он ведёт рост самой карточки и сдвиг
                     * тех, кто под ней. Появление карточек не анимируется —
                     * каскад со сдвигом и задержкой по индексу был
                     * хореографией загрузки, которой в продукте больше нет
                     * (DESIGN.md → The Nothing-Arrives Rule).
                     */
                    <motion.div
                      layout={!reduceMotion}
                      key={user.id}
                      id={profileAnchorId(user.id)}
                      // `min-w-0` обязателен: у элемента сетки минимальный размер
                      // по умолчанию равен min-content, и длинное имя без
                      // пробелов растягивало колонку за край экрана.
                      className="min-w-0 scroll-mt-24"
                      transition={{ duration: duration.slow, ease: easing.expo }}
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
                        <GiftPreferencesSummary preferences={cardPreferences} embedded />
                      </PreferenceProfileCard>
                    </motion.div>
                  );
                })}
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
        </div>
      </PageMain>
    </PageShell>
  );
}
