export const PRIORITY_LABELS: Record<number, string> = {
  1: "Было бы классно",
  2: "Хочу при случае",
  3: "Очень хочу",
  4: "Сильно нужно",
  5: "Нужно вчера",
};

export const PRIORITY_EMOJIS: Record<number, string> = {
  1: "✨",
  2: "👀",
  3: "🔥",
  4: "⚡",
  5: "🚀",
};

export function getPriorityLabel(priority: number): string {
  return PRIORITY_LABELS[priority] ?? `Приоритет ${priority}`;
}

export const PRIORITY_SHORT_LABELS: Record<number, string> = {
  1: "Классно",
  2: "При случае",
  3: "Очень хочу",
  4: "Нужно",
  5: "Срочно",
};

export function getPriorityShortLabel(priority: number): string {
  return PRIORITY_SHORT_LABELS[priority] ?? `P${priority}`;
}

export function getPriorityEmoji(priority: number): string {
  return PRIORITY_EMOJIS[priority] ?? "🎯";
}
