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

export const priorityOverlayToneByPriority: Record<WishlistPriority, string> = {
  1: "border-[hsl(var(--priority-1)/0.42)] bg-[hsl(var(--surface-1)/0.76)] text-foreground shadow-sm",
  2: "border-[hsl(var(--priority-2)/0.45)] bg-[hsl(var(--surface-1)/0.76)] text-foreground shadow-sm",
  3: "border-[hsl(var(--priority-3)/0.5)] bg-[hsl(var(--surface-1)/0.78)] text-foreground shadow-sm",
  4: "border-[hsl(var(--priority-4)/0.52)] bg-[hsl(var(--surface-1)/0.78)] text-foreground shadow-sm",
  5: "border-[hsl(var(--priority-5)/0.56)] bg-[hsl(var(--surface-1)/0.8)] text-foreground shadow-sm",
};
