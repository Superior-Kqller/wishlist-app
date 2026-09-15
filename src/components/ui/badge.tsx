import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Высота бейджа зафиксирована: `py-0.5` давал 22px, а соседняя пилюля
  // метаданных — 30px, и в одной строке они читались разными объектами.
  "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
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

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
