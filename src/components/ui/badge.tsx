import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Высота бейджа зафиксирована: `py-0.5` давал 22px, а соседняя пилюля
  // метаданных — 30px, и в одной строке они читались разными объектами.
  "inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      // Заливка фирменной краской принадлежит одному элементу продукта —
      // главной кнопке. Бейдж называет роль или статус: рамка и текст.
      variant: {
        secondary: "border border-border bg-secondary text-secondary-foreground",
        warning: "border border-warning/45 bg-warning/16 text-foreground",
        outline: "border-border bg-transparent text-foreground",
      },
    },
    defaultVariants: {
      variant: "outline",
    },
  },
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
