/**
 * Phase 2 visual contract (dark-first):
 * 1) page: background canvas only.
 * 2) panel: section containers and page intros.
 * 3) card: content entities (cards/tables/forms).
 * 4) overlay: dialogs/drawers/dropdowns only.
 *
 * Semantic color rule:
 * - brand: action/focus/selection.
 * - status: badge/marker/control states only.
 * - neutral: all base surfaces.
 */
export const uiSurface = {
  panel:
    "rounded-xl border border-border bg-[hsl(var(--surface-2))] shadow-[0_10px_24px_rgba(0,0,0,0.28)]",
  panelInset: "rounded-lg border border-border bg-card",
  stickyPanel:
    "sticky z-30 -mx-3 flex min-w-0 flex-col gap-1.5 border-b border-border bg-[hsl(var(--surface-2))/0.96] px-3 py-1.5 backdrop-blur-md max-sm:top-[calc(4.625rem+env(safe-area-inset-top,0px))] sm:static sm:z-auto sm:-mx-4 sm:border-0 sm:bg-transparent sm:px-4 sm:py-2 sm:backdrop-blur-none",
  floatingBar:
    "flex items-center gap-2 rounded-2xl border border-border bg-[hsl(var(--surface-2))/0.96] px-4 py-3 shadow-[0_12px_26px_rgba(0,0,0,0.34)] backdrop-blur-md",
  chip: "border-border bg-[hsl(var(--surface-3))]",
  inputAlt: "bg-[hsl(var(--surface-3))]",
  homeSummary:
    "rounded-2xl border border-border bg-[hsl(var(--surface-2))] shadow-[0_12px_30px_rgba(0,0,0,0.32)]",
  homeToolbar:
    "sticky z-30 -mx-3 flex min-w-0 flex-col gap-2 rounded-b-xl border-b border-border bg-[hsl(var(--surface-2))/0.97] px-3 py-2 backdrop-blur-md max-sm:top-[calc(4rem+env(safe-area-inset-top,0px))] sm:static sm:z-auto sm:-mx-4 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-4 sm:py-2 sm:backdrop-blur-none",
  homeSelectionState:
    "rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm text-foreground",
} as const;

export const uiState = {
  navBase:
    "h-9 gap-2 border border-transparent px-3 text-muted-foreground hover:text-foreground",
  navActive:
    "border-primary/45 bg-primary/14 text-foreground shadow-[0_0_12px_hsl(263_70%_55%/0.15)]",
  selectionIdle:
    "h-9 gap-1.5 px-3 border border-border bg-card text-muted-foreground hover:text-foreground",
  selectionActive:
    "h-9 gap-1.5 px-3 border border-primary/55 bg-primary/16 text-foreground",
} as const;
