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
  shell:
    "min-h-screen bg-[hsl(var(--background))] text-foreground",
  sidebar:
    "border-r border-border bg-[hsl(var(--surface-2))/0.86] shadow-[8px_0_28px_rgba(0,0,0,0.22)] backdrop-blur-xl",
  topHeader:
    "border-b border-border bg-[hsl(var(--surface-2))/0.88] shadow-[0_1px_8px_rgba(0,0,0,0.38)] backdrop-blur-xl",
  pageHeader:
    "rounded-2xl border border-primary/18 bg-[linear-gradient(135deg,hsl(var(--surface-3)/0.98),hsl(var(--surface-2)/0.94))] shadow-[0_18px_48px_rgba(0,0,0,0.34),inset_0_1px_0_hsl(var(--foreground)/0.04)]",
  contentPanel:
    "rounded-2xl border border-border/80 bg-[hsl(var(--surface-2))/0.82] shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_hsl(var(--foreground)/0.04)] backdrop-blur-md",
  interactiveCard:
    "border-border/80 bg-[linear-gradient(180deg,hsl(var(--surface-3)),hsl(var(--surface-2)))] shadow-[0_14px_34px_rgba(0,0,0,0.28),inset_0_1px_0_hsl(var(--foreground)/0.035)] transition-[border-color,box-shadow,transform] hover:border-primary/45 hover:shadow-[0_18px_46px_rgba(0,0,0,0.42),0_0_28px_hsl(var(--primary)/0.16),inset_0_1px_0_hsl(var(--foreground)/0.05)]",
  emptyState:
    "rounded-xl border border-dashed border-border bg-[hsl(var(--surface-2))] px-4 py-10 text-center",
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
    "relative overflow-hidden rounded-2xl border border-border/80 bg-[hsl(var(--surface-2))/0.82] shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_hsl(var(--foreground)/0.04)] backdrop-blur-md",
  homeToolbar:
    "relative z-20 flex min-w-0 flex-col gap-2 overflow-hidden rounded-xl border border-primary/14 bg-[hsl(var(--surface-2))/0.92] px-2.5 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.3),inset_0_1px_0_hsl(var(--foreground)/0.04)] backdrop-blur-md sm:z-auto sm:rounded-2xl sm:bg-[hsl(var(--surface-2))/0.82] sm:px-4 sm:py-3",
  homeSelectionState:
    "rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm text-foreground",
} as const;

export const uiState = {
  focusVisible:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  navBase:
    "h-10 gap-2.5 border border-transparent px-3 text-muted-foreground hover:text-foreground",
  navActive:
    "border-primary/28 bg-primary/10 text-foreground shadow-none",
  selectionIdle:
    "h-9 gap-1.5 px-3 border border-border bg-card text-muted-foreground hover:text-foreground",
  selectionActive:
    "h-9 gap-1.5 px-3 border border-primary/55 bg-primary/16 text-foreground",
} as const;
