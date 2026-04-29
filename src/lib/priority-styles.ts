export type WishlistPriority = 1 | 2 | 3 | 4 | 5;

export function clampWishlistPriority(priority: number): WishlistPriority {
  const n = Math.round(priority);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as WishlistPriority;
}

export const priorityDotClassByPriority: Record<WishlistPriority, string> = {
  1: "bg-slate-400",
  2: "bg-sky-400",
  3: "bg-amber-400",
  4: "bg-orange-500",
  5: "bg-rose-500",
};

export const priorityBadgeToneByPriority: Record<WishlistPriority, string> = {
  1: "border-slate-400/35 bg-slate-400/12 text-slate-100",
  2: "border-sky-400/35 bg-sky-400/12 text-sky-100",
  3: "border-amber-400/40 bg-amber-400/14 text-amber-50",
  4: "border-orange-500/42 bg-orange-500/15 text-orange-50",
  5: "border-rose-500/45 bg-rose-500/16 text-rose-50",
};

export const priorityOverlayToneByPriority: Record<WishlistPriority, string> = {
  1: "border-slate-300/35 bg-slate-950/62 text-slate-100 shadow-sm",
  2: "border-sky-300/38 bg-sky-950/58 text-sky-50 shadow-sm",
  3: "border-amber-300/45 bg-amber-950/56 text-amber-50 shadow-sm",
  4: "border-orange-300/48 bg-orange-950/56 text-orange-50 shadow-sm",
  5: "border-rose-300/52 bg-rose-950/58 text-rose-50 shadow-sm",
};
