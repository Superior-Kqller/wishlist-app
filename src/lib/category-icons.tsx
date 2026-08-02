import { createElement, type ComponentType } from "react";
import {
  Baby,
  BookOpen,
  Cpu,
  Dumbbell,
  Gamepad2,
  Gift,
  Palette,
  Shapes,
  Shirt,
  Sofa,
  Sparkles,
  UtensilsCrossed,
} from "lucide-react";
import { normalizeProductCategory, type ProductCategory } from "@/lib/categories";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

/**
 * Категории рисуются иконками одной библиотеки и одного веса штриха.
 * Раньше здесь стояли типографские глифы (⌁ ◆ ◫ …): они наследуют метрики
 * шрифта, не выравниваются по тексту и на разных платформах выглядят
 * по-разному — то есть не образуют системы.
 */
const CATEGORY_ICONS: Record<ProductCategory, IconComponent> = {
  electronics: Cpu,
  gaming: Gamepad2,
  books: BookOpen,
  fashion: Shirt,
  beauty: Sparkles,
  home: Sofa,
  kitchen: UtensilsCrossed,
  sports: Dumbbell,
  hobby: Palette,
  kids: Baby,
  "gift-cards": Gift,
  other: Shapes,
};

export function getProductCategoryIcon(category: string | null | undefined): IconComponent {
  const normalized = normalizeProductCategory(category);
  return normalized ? CATEGORY_ICONS[normalized] : Shapes;
}

export interface ProductCategoryIconProps {
  category: string | null | undefined;
  className?: string;
}

export function ProductCategoryIcon({ category, className }: ProductCategoryIconProps) {
  // createElement, а не локальная переменная `<Icon />`: компонент берётся из
  // готовой таблицы, а не создаётся при рендере.
  return createElement(getProductCategoryIcon(category), { className, "aria-hidden": true });
}
