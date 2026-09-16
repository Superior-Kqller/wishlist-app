import { createElement, type ComponentType } from "react";
import { ArrowUp, ChevronsUp, Eye, Flame, Star } from "lucide-react";
import { type Language, translate } from "@/lib/i18n";

export type WishlistPriority = 1 | 2 | 3 | 4 | 5;

export function clampWishlistPriority(priority: number): WishlistPriority {
  const n = Math.round(priority);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as WishlistPriority;
}

export const priorityDotClassByPriority: Record<WishlistPriority, string> = {
  1: "bg-[hsl(var(--priority-1))]",
  2: "bg-[hsl(var(--priority-2))]",
  3: "bg-[hsl(var(--priority-3))]",
  4: "bg-[hsl(var(--priority-4))]",
  5: "bg-[hsl(var(--priority-5))]",
};

export const priorityBadgeToneByPriority: Record<WishlistPriority, string> = {
  1: "border-[hsl(var(--priority-1)/0.36)] bg-[hsl(var(--priority-1)/0.12)] text-foreground",
  2: "border-[hsl(var(--priority-2)/0.38)] bg-[hsl(var(--priority-2)/0.12)] text-foreground",
  3: "border-[hsl(var(--priority-3)/0.42)] bg-[hsl(var(--priority-3)/0.14)] text-foreground",
  4: "border-[hsl(var(--priority-4)/0.44)] bg-[hsl(var(--priority-4)/0.15)] text-foreground",
  5: "border-[hsl(var(--priority-5)/0.48)] bg-[hsl(var(--priority-5)/0.16)] text-foreground",
};

const PRIORITY_LABELS: Record<number, string> = {
  1: "Хочу при случае",
  2: "Было бы классно",
  3: "Сильно нужно",
  4: "Очень хочу",
  5: "Нужно вчера",
};

export function getPriorityLabel(priority: number, language: Language = "ru"): string {
  const label = PRIORITY_LABELS[priority];
  return label ? translate(language, label) : `${translate(language, "Приоритет")} ${priority}`;
}

const PRIORITY_SHORT_LABELS: Record<number, string> = {
  1: "При случае",
  2: "Классно",
  3: "Нужно",
  4: "Очень хочу",
  5: "Срочно",
};

export function getPriorityShortLabel(priority: number, language: Language = "ru"): string {
  const label = PRIORITY_SHORT_LABELS[priority];
  return label ? translate(language, label) : `P${priority}`;
}

type IconComponent = ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;

const PRIORITY_ICONS: Record<WishlistPriority, IconComponent> = {
  1: Eye,
  2: Star,
  3: ArrowUp,
  4: ChevronsUp,
  5: Flame,
};

function getPriorityIcon(priority: number): IconComponent {
  return PRIORITY_ICONS[clampWishlistPriority(priority)];
}

interface PriorityIconProps {
  priority: number;
  className?: string;
}

export function PriorityIcon({ priority, className }: PriorityIconProps) {
  return createElement(getPriorityIcon(priority), { className, "aria-hidden": true });
}
