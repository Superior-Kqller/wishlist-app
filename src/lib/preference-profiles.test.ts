import { describe, expect, it } from "vitest";
import {
  filterAndSortPreferenceProfiles,
  getPreferenceProfileSignals,
  type PreferenceProfile,
} from "@/lib/preference-profiles";
import { emptyGiftPreferences, type GiftPreferences } from "@/lib/preferences";

function giftPreferences(overrides: Partial<GiftPreferences>): GiftPreferences {
  return { ...emptyGiftPreferences, ...overrides };
}

const profiles: PreferenceProfile[] = [
  {
    id: "current",
    name: "Алексей",
    username: "alex",
    giftPreferences: giftPreferences({ favoriteColors: ["Зелёный"] }),
    stats: { totalItems: 5 },
  },
  {
    id: "sizes",
    name: "Мария",
    username: "maria",
    giftPreferences: giftPreferences({ sizes: "Одежда: M" }),
    stats: { totalItems: 1 },
  },
  {
    id: "avoid",
    name: "Борис",
    username: "boris",
    giftPreferences: giftPreferences({ doNotBuy: ["Свечи"] }),
    stats: { totalItems: 3 },
  },
];

describe("preference profile directory", () => {
  it("keeps only profiles with sizes when the sizes filter is active", () => {
    const result = filterAndSortPreferenceProfiles(profiles, {
      filter: "sizes",
      sort: "filled",
      query: "",
      currentUserId: "current",
    });

    expect(result.map((profile) => profile.id)).toEqual(["sizes"]);
  });

  it("keeps only profiles with exclusions when the stop-list filter is active", () => {
    const result = filterAndSortPreferenceProfiles(profiles, {
      filter: "avoid",
      sort: "filled",
      query: "",
      currentUserId: "current",
    });

    expect(result.map((profile) => profile.id)).toEqual(["avoid"]);
  });

  it("searches by name or username and pins a matching current profile", () => {
    const result = filterAndSortPreferenceProfiles(profiles, {
      filter: "all",
      sort: "name",
      query: "alex",
      currentUserId: "current",
    });

    expect(result.map((profile) => profile.id)).toEqual(["current"]);
  });

  it("exposes counts used by filter badges", () => {
    expect(getPreferenceProfileSignals(profiles[1])).toMatchObject({
      preferenceCount: 1,
      hasSizes: true,
      avoidCount: 0,
    });
    expect(getPreferenceProfileSignals(profiles[2]).avoidCount).toBe(1);
  });
});
