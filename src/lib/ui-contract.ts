/**
 * Визуальный контракт — DESIGN.md: плоские поверхности, одна тень,
 * выбор и фокус чернилами, фирменная краска только на главном действии.
 */
/**
 * Ширина и отступы страницы живут в `PageMain` (`components/ui/page-shell`),
 * а не в наборах утилит на каждый раздел: единая рамка — это то, что делает
 * переходы между разделами непрерывными.
 */
/**
 * Вертикальный ритм страницы и геометрия повторяющейся мебели.
 *
 * Раньше каждая страница выбирала свой зазор между блоками (16 / 20 / 24px)
 * и свою полосу разделов: у настроек она была 58px высотой с радиусом 12,
 * у редактора профиля — 66px с радиусом 16, у календаря — кнопки высотой 36.
 * Один объект выглядел тремя, и страницы читались собранными разными людьми.
 */
export const uiLayout = {
  /** Зазор между блоками страницы. */
  pageStack: "space-y-5",
  /** Полоса разделов: настройки, редактор профиля, переключатели вида. */
  segmentBar:
    "relative isolate grid min-w-0 gap-1 rounded-full border border-border bg-background p-1",
  /**
   * Та же полоса, но по содержимому — когда переключатель стоит в строке
   * рядом с другим контролом. Отдельная строка нужна ровно из-за раскладки:
   * рамка, фон, зазор и отступ у обеих одни.
   */
  segmentBarInline:
    "relative isolate inline-grid auto-cols-auto grid-flow-col min-w-0 gap-1 rounded-full border border-border bg-background p-1",
  /** Общие классы для controls в панели инструментов вишлиста. */
  filterBarTrigger:
    "h-10 rounded-full border-border bg-background shadow-none hover:border-foreground",
  /*
   * Ширин диалога ровно две. Было пять — 384, 448, 500, 1024 и 1088, — и
   * ни одна не совпадала с обещанной в DESIGN.md: три окна подряд читались
   * тремя разными объектами. Форма — всё, что заполняют; просмотр — окно
   * желания и разбор ссылки, где рядом лежат поля и содержимое.
   */
  dialogForm: "max-w-lg",
  dialogWide: "sm:max-w-5xl",
} as const;

export const uiSurface = {
  sidebar: "border-r border-border bg-background",
  contentPanel: "rounded-xl border border-border bg-card",
  emptyState: "rounded-xl border border-border bg-card px-4 py-12 text-center",
  floatingBar:
    "flex items-center gap-2 rounded-full border border-border bg-popover px-4 py-2.5 shadow-[var(--shadow-float)]",
  chip: "border-border bg-background",
  /**
   * Оболочка секции анкеты: заголовок, описание и поля одной темы. Строка была
   * выписана дословно в четырёх местах редактора и чип-пикера.
   */
  formSection: "rounded-xl border border-border bg-card p-4 sm:p-6",
  inputAlt: "bg-background",
  homeSummary: "relative overflow-hidden rounded-xl border border-border bg-card",
  homeToolbar: "relative z-20 flex min-w-0 flex-col gap-2.5 sm:z-auto",
  /**
   * Пилюля метаданных под заголовком страницы: дата, счётчик, статус. Раньше
   * такие подписи выписывались на месте и вставали рядом с `Badge` разной
   * высоты — 22px против 30px в одной строке.
   */
  metaPill:
    "inline-flex min-h-7 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground",
  homeSelectionState:
    "rounded-lg border border-foreground bg-accent px-3 py-2 text-sm text-foreground",
} as const;

export const uiState = {
  /** Фокус и выбор — чернилами (DESIGN.md → «Цвет»), без свечения. */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  /** Фокус поля — рамка 2px чернилами; ошибка (`aria-invalid`) — та же рамка цветом `error` (DESIGN.md → «Поля»). */
  focusField:
    "focus-visible:outline-none focus-visible:border-foreground focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--foreground))] aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:border-destructive aria-[invalid=true]:focus-visible:shadow-[inset_0_0_0_1px_hsl(var(--destructive))]",
  navBase:
    "h-11 gap-2.5 border border-transparent px-3 text-muted-foreground hover:bg-accent hover:text-foreground",
  navActive: "bg-accent text-foreground font-semibold",
  // Заливку выбранного сегмента несёт `SegmentGlide`, когда рельса готова.
  segmentActive:
    "relative z-[1] rounded-full border-foreground bg-foreground text-background hover:bg-foreground hover:text-background in-data-[glide=ready]:border-transparent in-data-[glide=ready]:bg-transparent in-data-[glide=ready]:hover:bg-transparent",
  segmentIdle:
    "relative z-[1] rounded-full border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
  selectionIdle:
    "h-9 gap-1.5 px-4 rounded-full border border-border bg-background text-foreground hover:border-foreground",
  selectionActive:
    "h-9 gap-1.5 px-4 rounded-full border border-foreground bg-foreground text-background",
  chipSelected: "border-foreground bg-foreground text-background",
  /**
   * Отмеченный чип мультивыбора (DESIGN.md → «Чипы»): рамка 2px чернилами, фон холста.
   * Второй пиксель — внутренней тенью, чтобы чип не толкал соседей.
   */
  chipChecked:
    "border-foreground bg-background text-foreground shadow-[inset_0_0_0_1px_hsl(var(--foreground))]",
  chipCheckedDanger:
    "border-destructive bg-destructive/8 text-destructive shadow-[inset_0_0_0_1px_hsl(var(--destructive))]",
  chipIdle: "border-border bg-background text-foreground hover:border-foreground",
} as const;
