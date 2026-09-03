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
/**
 * Ширина и отступы страницы живут в `PageMain` (`components/ui/page-shell`),
 * а не в наборах утилит на каждый раздел: единая рамка — это то, что делает
 * переходы между разделами непрерывными.
 */
export const uiSurface = {
  shell: "min-h-screen bg-[hsl(var(--background))] text-foreground",
  sidebar:
    "border-r border-border/32 bg-[hsl(var(--surface-2)/0.68)] elevation-sidebar backdrop-blur-xl",
  topHeader:
    "border-b border-border bg-[hsl(var(--surface-2)/0.88)] elevation-header backdrop-blur-xl",
  pageHeader:
    "rounded-2xl border border-border/70 bg-[hsl(var(--surface-2)/0.88)] elevation-page-header",
  contentPanel:
    "rounded-2xl border border-border/55 bg-[hsl(var(--surface-2)/0.8)] elevation-panel",
  interactiveCard:
    "border-border/55 bg-[hsl(var(--surface-2))] elevation-interactive-card transition-[border-color,box-shadow,transform] hover:border-primary/32",
  emptyState:
    "rounded-2xl border border-dashed border-border/70 bg-[hsl(var(--surface-2)/0.74)] px-4 py-10 text-center",
  panel: "rounded-xl border border-border bg-[hsl(var(--surface-2))] elevation-panel",
  panelInset: "rounded-lg border border-border bg-card",
  stickyPanel:
    "sticky z-30 -mx-3 flex min-w-0 flex-col gap-1.5 border-b border-border bg-[hsl(var(--surface-2)/0.96)] px-3 py-1.5 backdrop-blur-md max-sm:top-[calc(4.625rem+env(safe-area-inset-top,0px))] sm:static sm:z-auto sm:-mx-4 sm:border-0 sm:bg-transparent sm:px-4 sm:py-2 sm:backdrop-blur-none",
  floatingBar:
    "flex items-center gap-2 rounded-2xl border border-border bg-[hsl(var(--surface-2)/0.96)] px-4 py-3 elevation-floating backdrop-blur-md",
  chip: "border-border bg-[hsl(var(--surface-3))]",
  /**
   * Оболочка секции анкеты: заголовок, описание и поля одной темы. Строка была
   * выписана дословно в четырёх местах редактора и чип-пикера.
   */
  formSection: "rounded-2xl border border-border/55 bg-[hsl(var(--surface-2)/0.7)] p-4 sm:p-5",
  inputAlt: "bg-[hsl(var(--surface-3))]",
  homeSummary:
    "home-summary-panel relative overflow-hidden rounded-2xl border border-border/55 elevation-hero-panel",
  homeToolbar:
    "home-toolbar-panel relative z-20 flex min-w-0 flex-col gap-2.5 rounded-2xl border border-border/55 px-2.5 py-2.5 elevation-panel sm:z-auto sm:px-3 sm:py-3",
  homeSelectionState:
    "rounded-lg border border-primary/45 bg-primary/10 px-3 py-2 text-sm text-foreground",
} as const;

export const uiState = {
  /**
   * Кольцо фокуса на `--ring`, а не на `--primary`. В тёмных темах `--ring`
   * завязан на `--primary-accent`, тогда как сама `--primary` там подобрана
   * под заливку кнопки и как обводка почти неразличима.
   *
   * Имя одно. Пока их было два (`focusVisible` и `focusRing`) с разными
   * значениями, у продукта было три конвенции фокуса сразу: `ring-primary`,
   * `ring-ring` и `ring-primary/55` — в разметке они стояли вперемешку.
   */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  navBase:
    "h-11 gap-2.5 border border-transparent px-3 text-muted-foreground/85 hover:bg-[hsl(var(--surface-3)/0.74)] hover:text-foreground",
  /*
   * Текущий раздел — это состояние, а не действие: тон поверхности плюс голос
   * краски на значке. Заливка `bg-primary/10` давала 1.2:1 — читалась дымкой,
   * а не указателем, и повторяла рецепт главной кнопки.
   */
  navActive: "border-border/55 bg-[hsl(var(--surface-3))] text-foreground",
  selectionIdle:
    "h-9 gap-1.5 px-3 border border-border bg-card text-muted-foreground hover:text-foreground",
  selectionActive:
    "h-9 gap-1.5 px-3 border border-primary-accent/70 bg-[hsl(var(--surface-4))] text-foreground",
  /**
   * Выбранный чип: рамка голосом краски, заливка — ступень поверхности.
   * Ступень `/70` у рамки — минимальная, которая берёт 3:1. Заливка была
   * `bg-primary/16` (1.18:1 к соседу): она не отличала выбранный чип, а лишь
   * добавляла тона в общую дымку — выбор виден рамкой и уровнем поверхности.
   */
  chipSelected: "border-primary-accent/70 bg-[hsl(var(--surface-4))] text-foreground",
  chipSelectedDanger: "border-destructive/70 bg-destructive/10 text-destructive",
  chipIdle:
    "border-border/55 bg-[hsl(var(--surface-3)/0.45)] text-muted-foreground hover:bg-accent hover:text-foreground",
} as const;
