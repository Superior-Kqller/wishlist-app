import { useSyncExternalStore } from "react";

/** Та же граница, на которой раскладка перестраивается сама: `sm`, 640px. */
const PHONE_QUERY = "(max-width: 639px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Узкий экран телефона. На сервере — всегда нет: разметка, зависящая от
 * ответа, досчитывается после гидратации, а лента желаний к этому моменту
 * ещё грузится и показывает скелет.
 */
export function useIsPhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false,
  );
}
