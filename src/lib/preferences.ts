import { z } from "zod";

/**
 * Потолок собранной строки размеров. Редактор собирает её из шести полей
 * категорий и свободного «Другое», поэтому знать предел должен и он — иначе
 * анкету можно заполнить так, что сохранение падает уже на сервере.
 */
export const SIZES_MAX_LENGTH = 500;

export const giftPreferencesSchema = z.object({
  favoriteCategories: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  dislikedCategories: z.array(z.string().trim().min(1).max(80)).max(12).default([]),
  favoriteColors: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  dislikedColors: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  sizes: z.string().trim().max(SIZES_MAX_LENGTH).default(""),
  favoriteMaterials: z.array(z.string().trim().min(1).max(60)).max(16).default([]),
  dislikedMaterials: z.array(z.string().trim().min(1).max(60)).max(16).default([]),
  favoriteBrands: z.array(z.string().trim().min(1).max(80)).max(16).default([]),
  dislikedBrands: z.array(z.string().trim().min(1).max(80)).max(16).default([]),
  hobbies: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  doNotBuy: z.array(z.string().trim().min(1).max(100)).max(24).default([]),
  occasions: z.array(z.string().trim().min(1).max(80)).max(16).default([]),
  budget: z.string().trim().max(200).default(""),
  notes: z.string().trim().max(1000).default(""),
});

export type GiftPreferences = z.infer<typeof giftPreferencesSchema>;

export const emptyGiftPreferences: GiftPreferences = {
  favoriteCategories: [],
  dislikedCategories: [],
  favoriteColors: [],
  dislikedColors: [],
  sizes: "",
  favoriteMaterials: [],
  dislikedMaterials: [],
  favoriteBrands: [],
  dislikedBrands: [],
  hobbies: [],
  doNotBuy: [],
  occasions: [],
  budget: "",
  notes: "",
};

export function normalizeGiftPreferences(value: unknown): GiftPreferences {
  if (!value || typeof value !== "object") return emptyGiftPreferences;
  return giftPreferencesSchema.parse(value);
}

export function splitPreferenceList(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter((part) => {
      if (!part) return false;
      const key = part.toLocaleLowerCase("ru-RU");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function joinPreferenceList(value: string[]): string {
  return value.join(", ");
}

export function countGiftPreferences(value: GiftPreferences): number {
  return (
    value.favoriteColors.length +
    value.favoriteCategories.length +
    value.dislikedColors.length +
    value.dislikedCategories.length +
    value.favoriteMaterials.length +
    value.dislikedMaterials.length +
    value.favoriteBrands.length +
    value.dislikedBrands.length +
    value.hobbies.length +
    value.doNotBuy.length +
    value.occasions.length +
    Number(Boolean(value.sizes)) +
    Number(Boolean(value.budget)) +
    Number(Boolean(value.notes))
  );
}

/**
 * Разделы редактора и поля, которые в них живут.
 *
 * Признак «раздел заполнен» считался в компоненте страницы ручной дизъюнкцией
 * по четырнадцати полям, а общий счётчик — здесь: добавление поля в схему
 * требовало правки в двух местах, и разъехаться они могли молча.
 */
export const giftPreferenceSections = {
  likes: ["favoriteBrands", "favoriteColors", "favoriteCategories", "hobbies", "favoriteMaterials"],
  avoid: [
    "dislikedBrands",
    "dislikedColors",
    "dislikedCategories",
    "dislikedMaterials",
    "doNotBuy",
  ],
  details: ["sizes", "occasions", "budget", "notes"],
} as const satisfies Record<string, ReadonlyArray<keyof GiftPreferences>>;

export type GiftPreferenceSection = keyof typeof giftPreferenceSections;

export function isGiftPreferenceSectionFilled(
  value: GiftPreferences,
  section: GiftPreferenceSection,
): boolean {
  return giftPreferenceSections[section].some((key) => {
    const field = value[key];
    return Array.isArray(field) ? field.length > 0 : Boolean(field);
  });
}
