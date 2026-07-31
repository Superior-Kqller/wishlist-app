import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-[color,background-color,border-color,box-shadow,transform] duration-200 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:active:translate-y-0",
  {
    variants: {
      variant: {
        default:
          "border border-primary/42 bg-primary/16 text-foreground shadow-[var(--shadow-brand-action)] hover:border-primary/58 hover:bg-primary/22",
        gradient:
          "border border-primary/46 bg-[linear-gradient(180deg,hsl(var(--primary)/0.24),hsl(var(--primary)/0.15))] text-foreground shadow-[var(--shadow-brand-action)] hover:border-primary/62 hover:bg-primary/24 active:bg-primary/20",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-card text-foreground shadow-none hover:border-border/90 hover:bg-accent",
        secondary:
          "border border-border bg-secondary text-secondary-foreground shadow-none hover:bg-muted",
        glass:
          "border border-border/90 bg-popover/70 text-popover-foreground shadow-none backdrop-blur-md transition-colors hover:bg-popover/85",
        glassActive:
          "border border-primary/48 bg-primary/13 text-foreground shadow-none backdrop-blur-md transition-colors hover:bg-primary/18",
        ghost:
          "border border-transparent bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
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

export { Button, buttonVariants };
