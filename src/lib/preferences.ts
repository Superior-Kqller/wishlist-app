import { z } from "zod";

export const giftPreferencesSchema = z.object({
  favoriteColors: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  dislikedColors: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  sizes: z.string().trim().max(500).default(""),
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
    value.dislikedColors.length +
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
