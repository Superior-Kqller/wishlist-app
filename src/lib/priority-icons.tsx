import { createElement, type ComponentType } from "react";
import { ArrowUp, ChevronsUp, Eye, Flame, Star } from "lucide-react";
import { clampWishlistPriority, type WishlistPriority } from "@/lib/priority-styles";

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

/**
 * Приоритет читается иконками одной библиотеки вместо эмодзи (👀 ✨ ⚡ 🔥 🚀).
 * Эмодзи рисует операционная система: они цветные, разного веса и на каждой
 * платформе свои — рядом с остальным интерфейсом это чужеродный слой,
 * который к тому же перетягивает внимание с самого товара.
 *
 * Форма нарастает вместе со срочностью, поэтому шкала различима и без цвета.
 */
const PRIORITY_ICONS: Record<WishlistPriority, IconComponent> = {
  1: Eye,
  2: Star,
  3: ArrowUp,
  4: ChevronsUp,
  5: Flame,
};

export function getPriorityIcon(priority: number): IconComponent {
  return PRIORITY_ICONS[clampWishlistPriority(priority)];
}

export interface PriorityIconProps {
  priority: number;
  className?: string;
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  // createElement, а не локальная переменная `<Icon />`: компонент берётся из
  // готовой таблицы, а не создаётся при рендере.
  return createElement(getPriorityIcon(priority), { className, "aria-hidden": true });
}
