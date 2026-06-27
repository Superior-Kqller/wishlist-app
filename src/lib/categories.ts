import type { Language } from "@/lib/i18n";

export type ProductCategory =
  | "electronics"
  | "gaming"
  | "books"
  | "fashion"
  | "beauty"
  | "home"
  | "kitchen"
  | "sports"
  | "hobby"
  | "kids"
  | "gift-cards"
  | "other";

export type ProductCategoryOption = {
  id: ProductCategory;
  label: string;
  labelEn: string;
  icon: string;
};

export const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  { id: "electronics", label: "Техника", labelEn: "Electronics", icon: "⌁" },
  { id: "gaming", label: "Игры и ПК", labelEn: "Gaming and PC", icon: "◆" },
  { id: "books", label: "Книги", labelEn: "Books", icon: "◫" },
  { id: "fashion", label: "Одежда", labelEn: "Fashion", icon: "◈" },
  { id: "beauty", label: "Красота", labelEn: "Beauty", icon: "✦" },
  { id: "home", label: "Дом", labelEn: "Home", icon: "⌂" },
  { id: "kitchen", label: "Кухня", labelEn: "Kitchen", icon: "◇" },
  { id: "sports", label: "Спорт", labelEn: "Sports", icon: "●" },
  { id: "hobby", label: "Хобби", labelEn: "Hobby", icon: "✧" },
  { id: "kids", label: "Дети", labelEn: "Kids", icon: "◌" },
  { id: "gift-cards", label: "Сертификаты", labelEn: "Gift cards", icon: "□" },
  { id: "other", label: "Другое", labelEn: "Other", icon: "…" },
];

const CATEGORY_IDS = new Set(PRODUCT_CATEGORIES.map((category) => category.id));

export function isProductCategory(value: string | null | undefined): value is ProductCategory {
  return Boolean(value && CATEGORY_IDS.has(value as ProductCategory));
}

export function normalizeProductCategory(value: string | null | undefined): ProductCategory | null {
  const normalized = value?.trim().toLowerCase();
  return isProductCategory(normalized) ? normalized : null;
}

export function getProductCategoryOption(
  category: string | null | undefined,
): ProductCategoryOption | null {
  const normalized = normalizeProductCategory(category);
  return PRODUCT_CATEGORIES.find((option) => option.id === normalized) ?? null;
}

export function getProductCategoryLabel(
  category: string | null | undefined,
  language: Language = "ru",
): string {
  const option = getProductCategoryOption(category);
  if (!option) return language === "en" ? "No category" : "Без категории";
  return language === "en" ? option.labelEn : option.label;
}

export function getProductCategoryIcon(category: string | null | undefined): string {
  return getProductCategoryOption(category)?.icon ?? "…";
}
