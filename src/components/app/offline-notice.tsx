"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/** Полоса под шапкой, пока нет сети: иначе кнопки «сохранить» молча ничего не делают. */
export function OfflineNotice() {
  const { t } = useI18n();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 border-b border-warning/24 bg-warning/10 px-4 py-2 text-sm text-warning"
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden />
      {t("Нет соединения — изменения не сохранятся")}
    </div>
  );
}
