import type { ItemStatus } from "@/lib/item-status";
import { type Language, translate } from "@/lib/i18n";

export function getItemStatusLabel(status: ItemStatus, language: Language = "ru"): string {
  if (status === "PURCHASED") return translate(language, "Куплено");
  return translate(language, "Доступно");
}

export function getItemStatusTone(status: ItemStatus): string {
  if (status === "PURCHASED") {
    return "border-success/45 bg-success/16 text-success-foreground";
  }
  return "border-info/45 bg-info/16 text-info-foreground";
}
