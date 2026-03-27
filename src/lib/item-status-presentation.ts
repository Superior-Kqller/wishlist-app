import type { ItemStatus } from "@/types";

export function getItemStatusLabel(status: ItemStatus): string {
  if (status === "CLAIMED") return "Забронировано";
  if (status === "PURCHASED") return "Куплено";
  return "Доступно";
}

export function getItemStatusTone(status: ItemStatus): string {
  if (status === "CLAIMED") {
    return "border-amber-400/45 bg-amber-500/12 text-amber-100";
  }
  if (status === "PURCHASED") {
    return "border-emerald-400/45 bg-emerald-500/12 text-emerald-100";
  }
  return "border-cyan-400/35 bg-cyan-500/10 text-cyan-100";
}

export function getItemStatusSurface(status: ItemStatus): string {
  if (status === "CLAIMED") {
    return "border-amber-500/28 bg-amber-950/26";
  }
  if (status === "PURCHASED") {
    return "border-emerald-500/26 bg-emerald-950/24";
  }
  return "border-cyan-500/22 bg-cyan-950/22";
}
