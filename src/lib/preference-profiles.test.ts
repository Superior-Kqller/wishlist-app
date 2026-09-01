import { describe, expect, it } from "vitest";
import {
  getPreferenceHighlights,
  searchPreferenceProfiles,
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
  it("searches by name or username and pins a matching current profile", () => {
    const result = searchPreferenceProfiles(profiles, {
      query: "alex",
      currentUserId: "current",
    });

    expect(result.map((profile) => profile.id)).toEqual(["current"]);
  });

  it("orders the circle by name and keeps the current profile first", () => {
    const result = searchPreferenceProfiles(profiles, { query: "", currentUserId: "current" });

    expect(result.map((profile) => profile.id)).toEqual(["current", "avoid", "sizes"]);
  });

  it("matches a username even when the query differs in case", () => {
    const result = searchPreferenceProfiles(profiles, { query: "  MARIA " });

    expect(result.map((profile) => profile.id)).toEqual(["sizes"]);
  });
});

describe("preference highlights", () => {
  it("spreads the preview across sources instead of draining the longest one", () => {
    const highlights = getPreferenceHighlights(
      giftPreferences({
        hobbies: ["Книги", "Кофе", "Растения", "Готовка", "Игры", "Спорт"],
        favoriteCategories: ["Книги и хобби"],
        favoriteBrands: ["Muji"],
      }),
    );

    expect(highlights.likes).toEqual([
      { kind: "category", value: "Книги и хобби" },
      { kind: "hobby", value: "Книги" },
      { kind: "brand", value: "Muji" },
      { kind: "hobby", value: "Кофе" },
      { kind: "hobby", value: "Растения" },
    ]);
    expect(highlights.likesHidden).toBe(3);
  });

  it("keeps the kind of every hint: «Moleskine» покупают, «бег» объясняет человека", () => {
    const highlights = getPreferenceHighlights(
      giftPreferences({
        hobbies: ["Бег"],
        favoriteBrands: ["Moleskine"],
        favoriteMaterials: ["Шерсть"],
        favoriteColors: ["Хаки"],
      }),
    );

    expect(highlights.likes.map((hint) => hint.kind)).toEqual([
      "hobby",
      "brand",
      "material",
      "color",
    ]);
  });

  it("puts the stop list ahead of milder dislikes", () => {
    const highlights = getPreferenceHighlights(
      giftPreferences({
        dislikedBrands: ["Zara"],
        dislikedCategories: ["Косметика"],
        doNotBuy: ["Свечи"],
      }),
    );

    expect(highlights.avoid).toEqual([
      { kind: "note", value: "Свечи" },
      { kind: "category", value: "Косметика" },
      { kind: "brand", value: "Zara" },
    ]);
    expect(highlights.avoidHidden).toBe(0);
  });

  it("counts what the preview leaves out", () => {
    const highlights = getPreferenceHighlights(
      giftPreferences({
        doNotBuy: ["Свечи", "Парфюм", "Сладости", "Сертификаты"],
        favoriteColors: ["Зелёный", "Синий", "Белый", "Бежевый", "Серый", "Чёрный"],
      }),
    );

    expect(highlights.avoid).toHaveLength(3);
    expect(highlights.avoidHidden).toBe(1);
    expect(highlights.likes).toHaveLength(5);
    expect(highlights.likesHidden).toBe(1);
  });

  it("returns an empty preview for a profile without hints", () => {
    const highlights = getPreferenceHighlights(null);

    expect(highlights).toEqual({
      likes: [],
      likesHidden: 0,
      avoid: [],
      avoidHidden: 0,
    });
  });
});
