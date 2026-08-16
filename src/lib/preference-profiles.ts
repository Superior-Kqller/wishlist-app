import { normalizeGiftPreferences, type GiftPreferences } from "@/lib/preferences";

export type PreferenceProfile = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
  stats?: { totalItems: number };
};

/**
 * Ниже этого числа профилей поиск — лишний контрол: круг целиком помещается
 * на экран, и найти человека глазами быстрее, чем набрать имя.
 */
export const PROFILE_SEARCH_THRESHOLD = 6;

/** Сколько подсказок показывает свёрнутая карточка до раскрытия. */
const LIKE_PREVIEW_LIMIT = 5;
const AVOID_PREVIEW_LIMIT = 3;
const COLOR_PREVIEW_LIMIT = 5;

export type PreferenceHighlights = {
  likes: string[];
  likesHidden: number;
  colors: string[];
  avoid: string[];
  avoidHidden: number;
};

/**
 * Берёт из каждого источника не больше `perSource` значений, обходя источники
 * по кругу: иначе двадцать интересов вытеснили бы единственный названный
 * бренд, хотя для дарителя ценна как раз разнородность подсказок.
 */
function takeAcross(sources: string[][], perSource: number, limit: number) {
  const taken: string[] = [];
  const seen = new Set<string>();

  for (let round = 0; round < perSource; round += 1) {
    for (const source of sources) {
      const value = source[round];
      if (!value) continue;
      const key = value.toLocaleLowerCase("ru-RU");
      if (seen.has(key)) continue;
      seen.add(key);
      taken.push(value);
      if (taken.length === limit) return taken;
    }
  }

  return taken;
}

/**
 * То, ради чего человек открывает чужой профиль: что подойдёт и чего дарить
 * нельзя. Карточка раньше показывала вместо этого пять счётчиков —
 * оценку откровенности анкеты, а не подсказку для подарка.
 */
export function getPreferenceHighlights(
  rawPreferences?: GiftPreferences | null,
): PreferenceHighlights {
  const preferences = normalizeGiftPreferences(rawPreferences);

  const likeSources = [
    preferences.favoriteCategories,
    preferences.hobbies,
    preferences.favoriteBrands,
    preferences.favoriteMaterials,
  ];
  const likeTotal = likeSources.reduce((total, source) => total + source.length, 0);
  const likes = takeAcross(likeSources, LIKE_PREVIEW_LIMIT, LIKE_PREVIEW_LIMIT);

  // Стоп-лист идёт первым: это единственная подсказка, цена ошибки в которой
  // не «подарок не понравился», а «подарок неприятен».
  const avoidSources = [
    preferences.doNotBuy,
    preferences.dislikedCategories,
    preferences.dislikedBrands,
  ];
  const avoidTotal = avoidSources.reduce((total, source) => total + source.length, 0);
  const avoid = takeAcross(avoidSources, AVOID_PREVIEW_LIMIT, AVOID_PREVIEW_LIMIT);

  return {
    likes,
    likesHidden: Math.max(0, likeTotal - likes.length),
    colors: preferences.favoriteColors.slice(0, COLOR_PREVIEW_LIMIT),
    avoid,
    avoidHidden: Math.max(0, avoidTotal - avoid.length),
  };
}

/**
 * Порядок один и всегда по имени, своя карточка закреплена первой.
 * Сортировка «по заполненности» и фильтры «Заполненные / Со стоп-листом»
 * ранжировали близких людей по откровенности анкеты — для круга из
 * нескольких человек это машинерия под задачу, которой не существует.
 */
export function searchPreferenceProfiles(
  profiles: PreferenceProfile[],
  { query, currentUserId }: { query: string; currentUserId?: string },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

  return profiles
    .filter(
      (profile) =>
        !normalizedQuery ||
        profile.name.toLocaleLowerCase("ru-RU").includes(normalizedQuery) ||
        profile.username.toLocaleLowerCase("ru-RU").includes(normalizedQuery),
    )
    .sort((first, second) => {
      if (first.id === second.id) return 0;
      if (first.id === currentUserId) return -1;
      if (second.id === currentUserId) return 1;
      return first.name.localeCompare(second.name, "ru-RU");
    });
}
