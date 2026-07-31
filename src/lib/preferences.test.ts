import { describe, expect, it } from "vitest";
import { emptyGiftPreferences, normalizeGiftPreferences, splitPreferenceList } from "./preferences";

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
