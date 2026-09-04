import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        // Заливка фирменной краской принадлежит одному элементу продукта —
        // главной кнопке. Бейдж называет роль или статус, поэтому берёт
        // голос: рамка и текст акцентом на ступени поверхности.
        default: "border border-primary-accent/45 bg-[hsl(var(--surface-4))] text-primary-accent",
        secondary: "border border-border bg-secondary text-secondary-foreground",
        brand: "border border-primary-accent/45 bg-[hsl(var(--surface-4))] text-primary-accent",
        success: "border border-success/45 bg-success/16 text-success",
        warning: "border border-warning/45 bg-warning/16 text-foreground",
        info: "border border-info/45 bg-info/16 text-info",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
