"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Подписка на медиазапрос.
 *
 * Нужна там, где раскладка меняет не только вид, но и смысл разметки: полоса
 * вкладок ниже `xl` горизонтальная, а от `xl` вертикальная, и `aria-orientation`
 * обязан говорить правду в обоих режимах — статическое значение врало бы в
 * одном из них.
 *
 * На сервере возвращает `false`: до гидратации ориентация неизвестна, а
 * горизонтальная — значение по умолчанию для `tablist` по спецификации.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
