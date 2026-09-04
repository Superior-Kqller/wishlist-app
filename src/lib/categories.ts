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
};

/** Иконки категорий живут в `lib/category-icons`: этот модуль остаётся без JSX. */
export const PRODUCT_CATEGORIES: ProductCategoryOption[] = [
  { id: "electronics", label: "Техника", labelEn: "Electronics" },
  { id: "gaming", label: "Игры и ПК", labelEn: "Gaming and PC" },
  { id: "books", label: "Книги", labelEn: "Books" },
  { id: "fashion", label: "Одежда", labelEn: "Fashion" },
  { id: "beauty", label: "Красота", labelEn: "Beauty" },
  { id: "home", label: "Дом", labelEn: "Home" },
  { id: "kitchen", label: "Кухня", labelEn: "Kitchen" },
  { id: "sports", label: "Спорт", labelEn: "Sports" },
  { id: "hobby", label: "Хобби", labelEn: "Hobby" },
  { id: "kids", label: "Дети", labelEn: "Kids" },
  { id: "gift-cards", label: "Сертификаты", labelEn: "Gift cards" },
  { id: "other", label: "Другое", labelEn: "Other" },
];

const CATEGORY_IDS = new Set(PRODUCT_CATEGORIES.map((category) => category.id));

function isProductCategory(value: string | null | undefined): value is ProductCategory {
  return Boolean(value && CATEGORY_IDS.has(value as ProductCategory));
}

export function normalizeProductCategory(value: string | null | undefined): ProductCategory | null {
  const normalized = value?.trim().toLowerCase();
  return isProductCategory(normalized) ? normalized : null;
}

function getProductCategoryOption(
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
  if (option) return language === "en" ? option.labelEn : option.label;

  /*
   * Незнакомая категория показывается как есть, а не как «Без категории».
   * `POST /api/items` принимает в это поле любую строку до 80 символов
   * (`z.string().trim().max(80)`), и импорт с другого экземпляра приносит
   * значения, которых нет в местном справочнике. Подпись «Без категории»
   * на таком товаре противоречила сохранённым данным: категория есть, а
   * интерфейс утверждал обратное.
   */
  const raw = category?.trim();
  if (raw) return raw;

  return language === "en" ? "No category" : "Без категории";
}
