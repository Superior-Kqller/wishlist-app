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

/**
 * Сколько подсказок показывает свёрнутая карточка до раскрытия.
 *
 * Пять — это по одной каждого рода: категория, интерес, бренд, материал,
 * цвет. Обход источников по кругу выдаёт их именно в таком порядке, так что
 * заполненный профиль показывает срез всех своих сигналов, а не пять слов из
 * самого длинного списка.
 */
const LIKE_PREVIEW_LIMIT = 5;
const AVOID_PREVIEW_LIMIT = 3;

/**
 * Род подсказки. Даритель читает «Moleskine» и «бег» по-разному: первое можно
 * купить сегодня, второе объясняет, как человек живёт. Пока обе строки шли
 * одним перечнем через запятую, эта разница пропадала.
 *
 * `note` — свободная запись стоп-листа («сладости — аллергия на орехи»): она
 * уже сформулирована предложением, и род ей приписывать нечего.
 */
export type PreferenceHintKind = "category" | "hobby" | "brand" | "material" | "color" | "note";

export type PreferenceHint = {
  kind: PreferenceHintKind;
  value: string;
};

/** Подпись рода. У `note` её нет: запись стоп-листа говорит сама за себя. */
export const preferenceHintLabels: Partial<Record<PreferenceHintKind, string>> = {
  category: "категория",
  hobby: "интерес",
  brand: "бренд",
  material: "материал",
  color: "цвет",
};

export type PreferenceHighlights = {
  likes: PreferenceHint[];
  likesHidden: number;
  avoid: PreferenceHint[];
  avoidHidden: number;
};

type HintSource = { kind: PreferenceHintKind; values: string[] };

/**
 * Берёт из каждого источника не больше `perSource` значений, обходя источники
 * по кругу: иначе двадцать интересов вытеснили бы единственный названный
 * бренд, хотя для дарителя ценна как раз разнородность подсказок.
 */
function takeAcross(sources: HintSource[], perSource: number, limit: number): PreferenceHint[] {
  const taken: PreferenceHint[] = [];
  const seen = new Set<string>();

  for (let round = 0; round < perSource; round += 1) {
    for (const source of sources) {
      const value = source.values[round];
      if (!value) continue;
      const key = value.toLocaleLowerCase("ru-RU");
      if (seen.has(key)) continue;
      seen.add(key);
      taken.push({ kind: source.kind, value });
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

  // Цвета идут последними: они уточняют выбор, а не подсказывают предмет.
  // Раньше они и вовсе стояли в стороне — гроздью безымянных кружков, которую
  // нельзя было прочитать, не наведя курсор.
  const likeSources: HintSource[] = [
    { kind: "category", values: preferences.favoriteCategories },
    { kind: "hobby", values: preferences.hobbies },
    { kind: "brand", values: preferences.favoriteBrands },
    { kind: "material", values: preferences.favoriteMaterials },
    { kind: "color", values: preferences.favoriteColors },
  ];
  const likeTotal = likeSources.reduce((total, source) => total + source.values.length, 0);
  const likes = takeAcross(likeSources, LIKE_PREVIEW_LIMIT, LIKE_PREVIEW_LIMIT);

  // Стоп-лист идёт первым: это единственная подсказка, цена ошибки в которой
  // не «подарок не понравился», а «подарок неприятен».
  const avoidSources: HintSource[] = [
    { kind: "note", values: preferences.doNotBuy },
    { kind: "category", values: preferences.dislikedCategories },
    { kind: "brand", values: preferences.dislikedBrands },
  ];
  const avoidTotal = avoidSources.reduce((total, source) => total + source.values.length, 0);
  const avoid = takeAcross(avoidSources, AVOID_PREVIEW_LIMIT, AVOID_PREVIEW_LIMIT);

  return {
    likes,
    likesHidden: Math.max(0, likeTotal - likes.length),
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
