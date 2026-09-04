import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // `gap-2` в базе: раньше каждая кнопка с иконкой задавала отступ сама, и там,
  // где об этом забывали, иконка прилипала к подписи («Список», «Месяц»).
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-[color,background-color,border-color,box-shadow,transform] duration-[var(--dur-base)] ease-[var(--ease-soft)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0",
  {
    variants: {
      variant: {
        /*
         * Единственная сплошная заливка фирменной краской во всём продукте.
         *
         * Раньше главное действие носило `bg-primary/16` — полупрозрачный слой,
         * дающий 1.18:1 к соседней поверхности, то есть невидимый как указатель.
         * Краску приходилось добирать рамкой, а тот же рецепт носил и «выбранный
         * сегмент», и активный пункт меню: одна кнопка не отличалась от восьми
         * состояний вокруг. Fill-and-Voice Rule требует ровно этого: `--primary`
         * — заливка, и на ней лежит только `--primary-foreground`.
         *
         * Ховер темнее, а не светлее: `--primary-accent` светлее заливки на две
         * ступени, и белая подпись на нём теряет норму.
         */
        default:
          "bg-primary text-primary-foreground shadow-[var(--shadow-brand-action)] hover:bg-[hsl(var(--primary)/0.88)]",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/95",
        outline:
          "border border-border bg-card text-foreground shadow-none hover:border-border/95 hover:bg-accent",
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-none hover:bg-muted",
        /*
         * Выбранный сегмент в переключателе (вид ленты, фильтр календаря).
         * Размытия здесь больше нет: кнопка лежит на панели инструментов, а не
         * поверх снимка, и размывать ей нечего — контракт `--glass-*` оставляет
         * стекло оверлеям и хрому оболочки. Соседний вариант `glass` был
         * объявлен, но не использован ни разу.
         */
        segmentActive:
          "border border-border/70 bg-[hsl(var(--surface-4))] text-foreground shadow-[inset_0_-2px_0_hsl(var(--primary-accent))] transition-colors",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-primary-accent underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 px-4 py-2 sm:min-h-10",
        sm: "min-h-11 rounded-md px-3 sm:min-h-9",
        lg: "h-11 rounded-lg px-8",
        icon: "h-11 w-11 sm:h-10 sm:w-10",
        /** Компактные иконки в полосе фильтров */
        iconToolbar: "h-11 w-11 rounded-lg sm:h-9 sm:w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button };
