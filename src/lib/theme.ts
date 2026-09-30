/*
 * Тема оформления: «системная» по умолчанию, светлую или тёмную можно
 * закрепить. Выбор живёт в cookie, как язык, — сервер сразу ставит
 * `data-theme` на `<html>`, и страница не мигает при загрузке.
 */
export const THEMES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEMES)[number];

export const THEME_COOKIE_NAME = "wishlist-theme";

export function normalizeTheme(value: string | null | undefined): ThemePreference {
  return THEMES.includes(value as ThemePreference) ? (value as ThemePreference) : "system";
}

/**
 * Для «системной» темы сервер не знает настройку устройства. Скрипт в `<head>`
 * ставит `data-theme` до первой отрисовки, чтобы не было вспышки светлой темы.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var d=document.documentElement;if(!d.dataset.theme){d.dataset.theme=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){}})()`;
