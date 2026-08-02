export type WishlistPriority = 1 | 2 | 3 | 4 | 5;

export function clampWishlistPriority(priority: number): WishlistPriority {
  const n = Math.round(priority);
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as WishlistPriority;
}

export const priorityDotClassByPriority: Record<WishlistPriority, string> = {
  1: "bg-[hsl(var(--priority-1))]",
  2: "bg-[hsl(var(--priority-2))]",
  3: "bg-[hsl(var(--priority-3))]",
  4: "bg-[hsl(var(--priority-4))]",
  5: "bg-[hsl(var(--priority-5))]",
};

export const priorityBadgeToneByPriority: Record<WishlistPriority, string> = {
  1: "border-[hsl(var(--priority-1)/0.36)] bg-[hsl(var(--priority-1)/0.12)] text-foreground",
  2: "border-[hsl(var(--priority-2)/0.38)] bg-[hsl(var(--priority-2)/0.12)] text-foreground",
  3: "border-[hsl(var(--priority-3)/0.42)] bg-[hsl(var(--priority-3)/0.14)] text-foreground",
  4: "border-[hsl(var(--priority-4)/0.44)] bg-[hsl(var(--priority-4)/0.15)] text-foreground",
  5: "border-[hsl(var(--priority-5)/0.48)] bg-[hsl(var(--priority-5)/0.16)] text-foreground",
};

/**
 * This badge floats over an arbitrary product photo, so text contrast can't
 * depend on the priority hue's own lightness (some priority hues are too
 * light for white text at any opacity that still reads as "tinted"). The
 * backdrop is a near-opaque neutral dark (>=90%, guarantees >=4.5:1 for
 * white text even against a pure-white product shot) with white text; the
 * priority hue only tints the border and glow, not the fill.
 */
export const priorityOverlayToneByPriority: Record<WishlistPriority, string> = {
  1: "border-white/45 bg-zinc-950/90 text-white shadow-[0_12px_28px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.18)]",
  2: "border-[hsl(var(--priority-2)/0.72)] bg-zinc-950/90 text-white shadow-[0_12px_28px_hsl(var(--priority-2)/0.28)]",
  3: "border-[hsl(var(--priority-3)/0.76)] bg-zinc-950/90 text-white shadow-[0_12px_28px_hsl(var(--priority-3)/0.3)]",
  4: "border-[hsl(var(--priority-4)/0.8)] bg-zinc-950/90 text-white shadow-[0_12px_28px_hsl(var(--priority-4)/0.32)]",
  5: "border-[hsl(var(--priority-5)/0.84)] bg-zinc-950/90 text-white shadow-[0_12px_28px_hsl(var(--priority-5)/0.34)]",
};
