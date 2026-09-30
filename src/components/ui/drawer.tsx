"use client";

/**
 * Нижний лист на Base UI Drawer — по компоненту Drawer (21st.dev, wensity):
 * смахивание вниз, точки фиксации, ловушка фокуса и блокировка прокрутки из
 * Base UI; движение — CSS по `data-starting-style` / `data-ending-style` и
 * переменным смахивания. Оформление — по DESIGN.md: холст, линия `hairline`,
 * одна тень, радиус 20px сверху, лист во всю ширину.
 */

import * as React from "react";
import { Drawer as BaseDrawer } from "@base-ui/react/drawer";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";

// Кривая и длительности — из компонента-источника: 500ms на появление, 250ms на уход.
const sheetMotion = cn(
  "transition-[translate,opacity] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] data-[ending-style]:duration-[250ms]",
  "translate-y-[calc(var(--drawer-snap-point-offset,0px)+var(--drawer-swipe-movement-y,0px))]",
  "data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
  "motion-reduce:transition-opacity motion-reduce:data-[starting-style]:translate-y-0 motion-reduce:data-[ending-style]:translate-y-0 motion-reduce:data-[starting-style]:opacity-0 motion-reduce:data-[ending-style]:opacity-0",
);

interface DrawerProps extends Omit<
  React.ComponentPropsWithoutRef<typeof BaseDrawer.Root>,
  "onOpenChange" | "swipeDirection" | "children"
> {
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Drawer({ onOpenChange, modal = true, children, ...props }: DrawerProps) {
  return (
    <BaseDrawer.Root
      modal={modal}
      swipeDirection="down"
      onOpenChange={onOpenChange ? (open) => onOpenChange(open) : undefined}
      {...props}
    >
      {children}
    </BaseDrawer.Root>
  );
}

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  /** Заголовок листа; обязателен для доступного имени диалога. */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Строка рядом с заголовком: счётчик, бейдж. */
  titleAdornment?: React.ReactNode;
  /** Липкий подвал с действиями. */
  footer?: React.ReactNode;
}

export function DrawerContent({
  children,
  className,
  id,
  title,
  description,
  titleAdornment,
  footer,
}: DrawerContentProps) {
  const { t } = useI18n();
  return (
    <BaseDrawer.Portal>
      <BaseDrawer.Backdrop className="fixed inset-0 z-50 bg-[hsl(var(--overlay-backdrop))] transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />
      <BaseDrawer.Viewport className="fixed inset-0 z-50 outline-none">
        <BaseDrawer.Popup
          id={id}
          className={cn(
            "fixed inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-2xl border border-b-0 border-border bg-popover text-popover-foreground shadow-[var(--shadow-float)] outline-none",
            sheetMotion,
            className,
          )}
        >
          <BaseDrawer.Content className="relative flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 justify-center pb-1 pt-3" aria-hidden>
              <span className="h-1.5 w-10 rounded-full bg-border" />
            </div>

            <div className="shrink-0 px-4 pb-3 pr-14">
              <div className="flex items-center gap-2">
                <BaseDrawer.Title className="text-xl font-semibold tracking-[-0.01em]">
                  {title}
                </BaseDrawer.Title>
                {titleAdornment}
              </div>
              {description ? (
                <BaseDrawer.Description className="mt-1 text-sm text-muted-foreground">
                  {description}
                </BaseDrawer.Description>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-contain border-t border-border">
              {children}
            </div>

            {footer ? <div className="shrink-0">{footer}</div> : null}

            <BaseDrawer.Close
              className="absolute right-3 top-4 inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("Закрыть")}
            >
              <X className="size-5" aria-hidden />
            </BaseDrawer.Close>
          </BaseDrawer.Content>
        </BaseDrawer.Popup>
      </BaseDrawer.Viewport>
    </BaseDrawer.Portal>
  );
}
