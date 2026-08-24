import { describe, expect, it } from "vitest";
import {
  emptyGiftPreferences,
  giftPreferenceLabels,
  giftPreferenceSections,
  giftPreferencesSchema,
  isGiftPreferenceSectionFilled,
  normalizeGiftPreferences,
  splitPreferenceList,
} from "./preferences";

describe("gift preferences", () => {
  it("normalizes empty values to a complete preferences object", () => {
    expect(normalizeGiftPreferences(null)).toEqual(emptyGiftPreferences);
  });

  it("keeps useful gift preference fields", () => {
    expect(
      normalizeGiftPreferences({
        favoriteColors: ["розовый"],
        dislikedColors: ["черный"],
        sizes: "кольцо 17",
        budget: "до 5000 ₽",
        notes: "без сильных ароматов",
      }),
    ).toMatchObject({
      favoriteColors: ["розовый"],
      dislikedColors: ["черный"],
      sizes: "кольцо 17",
      budget: "до 5000 ₽",
      notes: "без сильных ароматов",
    });
  });

  it("splits comma, semicolon and newline lists without duplicates", () => {
    expect(splitPreferenceList("розовый, зеленый\nрозовый; синий")).toEqual([
      "розовый",
      "зеленый",
      "синий",
    ]);
  });
});

describe("разделы редактора профиля", () => {
  it("покрывают каждое поле схемы ровно один раз", () => {
    const schemaKeys = Object.keys(giftPreferencesSchema.shape).sort();
    const mapped = Object.values(giftPreferenceSections).flat();

    expect([...mapped].sort()).toEqual(schemaKeys);
    expect(new Set(mapped).size).toBe(mapped.length);
  });

  it("пустой профиль не заполнен ни в одном разделе", () => {
    for (const section of Object.keys(giftPreferenceSections) as Array<
      keyof typeof giftPreferenceSections
    >) {
      expect(isGiftPreferenceSectionFilled(emptyGiftPreferences, section)).toBe(false);
    }
  });

  it("считает заполненными и непустой список, и непустую строку", () => {
    expect(
      isGiftPreferenceSectionFilled({ ...emptyGiftPreferences, hobbies: ["Книги"] }, "likes"),
    ).toBe(true);
    expect(
      isGiftPreferenceSectionFilled({ ...emptyGiftPreferences, budget: "до 3000" }, "details"),
    ).toBe(true);
    expect(
      isGiftPreferenceSectionFilled({ ...emptyGiftPreferences, hobbies: ["Книги"] }, "avoid"),
    ).toBe(false);
  });
});

describe("названия полей профиля", () => {
  it("покрывают каждое поле схемы", () => {
    expect(Object.keys(giftPreferenceLabels).sort()).toEqual(
      Object.keys(giftPreferencesSchema.shape).sort(),
    );
  });

  it("не повторяются: два поля с одним названием сделали бы текст ошибки бесполезным", () => {
    const labels = Object.values(giftPreferenceLabels);
    expect(new Set(labels).size).toBe(labels.length);
  });
});
