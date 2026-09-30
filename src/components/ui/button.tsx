import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";

// DESIGN.md → «Кнопки»: радиус 8px, вес 500, нажатие меняет цвет без сдвига.
// Рамка в базе прозрачна, чтобы заливные и рамочные варианты были одного размера.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-medium ring-offset-background transition-[color,background-color,border-color] duration-fast ease-[var(--ease-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        /** Одна на экран: единственная заливка фирменной краской. */
        default: "bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-hover))]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-border bg-background text-foreground hover:border-foreground",
        secondary: "border-foreground bg-background text-foreground hover:bg-accent",
        segmentActive: cn("border", uiState.segmentActive),
        ghost: "bg-transparent text-foreground hover:bg-accent",
        // Underline Draw (kinetics): подчёркивание прорисовывается на наведении.
        link: "underline-draw text-foreground",
      },
      size: {
        default: "min-h-11 px-4 py-2 sm:min-h-10",
        sm: "min-h-11 px-3 sm:min-h-9",
        lg: "min-h-12 px-6 text-base",
        icon: "h-11 w-11 rounded-full sm:h-10 sm:w-10",
        /** Компактные иконки в полосе фильтров */
        iconToolbar: "h-11 w-11 rounded-full sm:h-9 sm:w-9",
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
