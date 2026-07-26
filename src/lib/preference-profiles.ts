import {
  countGiftPreferences,
  normalizeGiftPreferences,
  type GiftPreferences,
} from "@/lib/preferences";

export type PreferenceProfileFilter = "all" | "filled" | "sizes" | "avoid";
export type PreferenceProfileSort = "filled" | "wishes" | "name";

export type PreferenceProfile = {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string | null;
  giftPreferences?: GiftPreferences | null;
  stats?: { totalItems: number };
};

export function getPreferenceProfileSignals(profile: PreferenceProfile) {
  const preferences = normalizeGiftPreferences(profile.giftPreferences);
  const avoidCount =
    preferences.dislikedCategories.length +
    preferences.dislikedColors.length +
    preferences.dislikedMaterials.length +
    preferences.dislikedBrands.length +
    preferences.doNotBuy.length;

  return {
    preferenceCount: countGiftPreferences(preferences),
    hasSizes: Boolean(preferences.sizes.trim()),
    avoidCount,
    wishCount: profile.stats?.totalItems ?? 0,
  };
}

export function filterAndSortPreferenceProfiles(
  profiles: PreferenceProfile[],
  {
    filter,
    sort,
    query,
    currentUserId,
  }: {
    filter: PreferenceProfileFilter;
    sort: PreferenceProfileSort;
    query: string;
    currentUserId?: string;
  },
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");

  return profiles
    .filter((profile) => {
      const signals = getPreferenceProfileSignals(profile);
      const matchesFilter =
        filter === "all" ||
        (filter === "filled" && signals.preferenceCount > 0) ||
        (filter === "sizes" && signals.hasSizes) ||
        (filter === "avoid" && signals.avoidCount > 0);
      const matchesQuery =
        !normalizedQuery ||
        profile.name.toLocaleLowerCase("ru-RU").includes(normalizedQuery) ||
        profile.username.toLocaleLowerCase("ru-RU").includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    })
    .sort((first, second) => {
      if (first.id === second.id) return 0;
      if (first.id === currentUserId) return -1;
      if (second.id === currentUserId) return 1;

      if (sort === "name") return first.name.localeCompare(second.name, "ru-RU");

      const firstSignals = getPreferenceProfileSignals(first);
      const secondSignals = getPreferenceProfileSignals(second);
      const scoreDiff =
        sort === "wishes"
          ? secondSignals.wishCount - firstSignals.wishCount
          : secondSignals.preferenceCount - firstSignals.preferenceCount;

      return scoreDiff || first.name.localeCompare(second.name, "ru-RU");
    });
}
