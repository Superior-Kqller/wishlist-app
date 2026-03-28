import type { ItemStatus } from "@/types";

export function getItemStatusLabel(status: ItemStatus): string {
  if (status === "CLAIMED") return "Забронировано";
  if (status === "PURCHASED") return "Куплено";
  return "Доступно";
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
