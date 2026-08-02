/**
 * Единый словарь движения.
 *
 * Правило: продукт использует один авторский момент на экран, а не набор
 * разрозненных эффектов. Прибытие контента — `expo`, реакция на курсор —
 * `soft`, подтверждение действия — тоже `expo`. Значения совпадают с
 * CSS-токенами в `globals.css`, чтобы CSS- и JS-анимации не расходились.
 */
export const easing = {
  expo: [0.16, 1, 0.3, 1],
  soft: [0.22, 0.61, 0.36, 1],
} as const;

export const duration = {
  fast: 0.14,
  base: 0.22,
  slow: 0.42,
  reveal: 0.62,
} as const;

/** Шаг задержки для последовательного появления элементов списка. */
export const STAGGER_STEP_MS = 45;

/** Дальше этого индекса каскад не читается как ритм, а ощущается как лаг. */
export const STAGGER_MAX_STEPS = 10;

export function staggerDelayMs(index: number, step = STAGGER_STEP_MS): number {
  return Math.min(index, STAGGER_MAX_STEPS) * step;
}

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.slow, ease: easing.expo },
} as const;
