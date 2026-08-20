/**
 * Общие классы для controls в панели инструментов.
 *
 * Высота задана здесь и только здесь: в панели раньше соседствовали 48, 36 и
 * 32 пикселя одновременно, и у ряда не было общего ритма. Единственный
 * элемент, которому позволено быть выше, — ничего; поиск тоже равняется по
 * этой высоте.
 */
export const TOOLBAR_CONTROL_HEIGHT = "h-10";

export const filterBarTriggerClass =
  "h-10 border-border/85 bg-[hsl(var(--surface-3)/0.78)] shadow-none hover:border-primary/32 hover:bg-[hsl(var(--surface-4)/0.86)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
