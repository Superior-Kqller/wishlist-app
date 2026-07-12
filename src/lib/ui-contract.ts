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
export const uiLayout = {
  catalogCanvas:
    "w-full space-y-2.5 px-2.5 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:space-y-5 sm:px-5 sm:py-5 sm:pb-6 xl:px-6 2xl:px-8",
} as const;

export const uiSurface = {
  shell:
    "min-h-screen bg-[hsl(var(--background))] text-foreground",
  sidebar:
    "border-r border-border/42 bg-[hsl(var(--surface-2))/0.78] elevation-sidebar backdrop-blur-xl",
  topHeader:
    "border-b border-border bg-[hsl(var(--surface-2))/0.88] elevation-header backdrop-blur-xl",
  pageHeader:
    "rounded-2xl border border-border/70 bg-[hsl(var(--surface-2))/0.88] elevation-page-header",
  contentPanel:
    "rounded-2xl border border-border/58 bg-[hsl(var(--surface-2))/0.8] elevation-panel backdrop-blur-md",
  interactiveCard:
    "border-border/62 bg-[hsl(var(--surface-2))] elevation-interactive-card transition-[border-color,box-shadow,transform] hover:border-primary/38",
  emptyState:
    "rounded-2xl border border-dashed border-border/70 bg-[hsl(var(--surface-2))/0.74] px-4 py-10 text-center",
  panel:
    "rounded-xl border border-border bg-[hsl(var(--surface-2))] elevation-panel",
  panelInset: "rounded-lg border border-border bg-card",
  stickyPanel:
    "sticky z-30 -mx-3 flex min-w-0 flex-col gap-1.5 border-b border-border bg-[hsl(var(--surface-2))/0.96] px-3 py-1.5 backdrop-blur-md max-sm:top-[calc(4.625rem+env(safe-area-inset-top,0px))] sm:static sm:z-auto sm:-mx-4 sm:border-0 sm:bg-transparent sm:px-4 sm:py-2 sm:backdrop-blur-none",
  floatingBar:
    "flex items-center gap-2 rounded-2xl border border-border bg-[hsl(var(--surface-2))/0.96] px-4 py-3 elevation-floating backdrop-blur-md",
  chip: "border-border bg-[hsl(var(--surface-3))]",
  inputAlt: "bg-[hsl(var(--surface-3))]",
  homeSummary:
    "home-summary-panel relative overflow-hidden rounded-2xl border border-border/62 elevation-hero-panel backdrop-blur-md",
  homeToolbar:
    "home-toolbar-panel relative z-20 flex min-w-0 flex-col gap-2.5 border-y border-border/48 bg-[hsl(var(--surface-2))/0.58] px-2.5 py-2.5 sm:z-auto sm:px-3 sm:py-3",
  homeSelectionState:
    "rounded-lg border border-primary/45 bg-primary/12 px-3 py-2 text-sm text-foreground",
} as const;

export const uiState = {
  focusVisible:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  navBase:
    "h-10 gap-2.5 border border-transparent px-3 text-muted-foreground/88 hover:bg-[hsl(var(--surface-3))/0.74] hover:text-foreground",
  navActive:
    "border-primary/22 bg-primary/12 text-foreground shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)]",
  selectionIdle:
    "h-9 gap-1.5 px-3 border border-border bg-card text-muted-foreground hover:text-foreground",
  selectionActive:
    "h-9 gap-1.5 px-3 border border-primary/55 bg-primary/16 text-foreground",
} as const;
