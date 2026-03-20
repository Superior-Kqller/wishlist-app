export type WishCardPriorityTier = "URGENT" | "NORMAL" | "SOMEDAY";

/** Соответствие числового приоритета вишлиста (1–5) трём уровням бейджа на карточке. */
export function wishlistPriorityToTier(priority: number): WishCardPriorityTier {
  const p = Math.min(5, Math.max(1, Math.round(priority)));
  if (p >= 4) return "URGENT";
  if (p === 3) return "NORMAL";
  return "SOMEDAY";
}
