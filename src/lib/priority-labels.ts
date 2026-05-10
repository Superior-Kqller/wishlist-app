import { type Language, translate } from "@/lib/i18n";

export const PRIORITY_LABELS: Record<number, string> = {
  1: "Хочу при случае",
  2: "Было бы классно",
  3: "Сильно нужно",
  4: "Очень хочу",
  5: "Нужно вчера",
};

export const PRIORITY_EMOJIS: Record<number, string> = {
  1: "👀",
  2: "✨",
  3: "⚡",
  4: "🔥",
  5: "🚀",
};

export function getPriorityLabel(priority: number, language: Language = "ru"): string {
  const label = PRIORITY_LABELS[priority];
  return label ? translate(language, label) : `${translate(language, "Приоритет")} ${priority}`;
}

export const PRIORITY_SHORT_LABELS: Record<number, string> = {
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

export function getPriorityEmoji(priority: number): string {
  return PRIORITY_EMOJIS[priority] ?? "🎯";
}
