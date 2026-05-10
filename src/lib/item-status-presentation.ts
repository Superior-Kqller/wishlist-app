import type { ItemStatus } from "@/types";
import { type Language, translate } from "@/lib/i18n";

export function getItemStatusLabel(
  status: ItemStatus,
  language: Language = "ru",
): string {
  if (status === "CLAIMED") return translate(language, "Забронировано");
  if (status === "PURCHASED") return translate(language, "Куплено");
  return translate(language, "Доступно");
}

export function getItemStatusTone(status: ItemStatus): string {
  if (status === "CLAIMED") {
    return "border-warning/45 bg-warning/16 text-foreground";
  }
  if (status === "PURCHASED") {
    return "border-success/45 bg-success/16 text-success-foreground";
  }
  return "border-info/45 bg-info/14 text-info-foreground";
}

export function getItemStatusMarker(status: ItemStatus): string {
  if (status === "CLAIMED") {
    return "bg-warning";
  }
  if (status === "PURCHASED") {
    return "bg-success";
  }
  return "bg-info";
}
