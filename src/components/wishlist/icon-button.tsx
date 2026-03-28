"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border text-sm shadow-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
  {
    variants: {
      intent: {
        default:
          "border-border bg-[hsl(var(--surface-3))] text-foreground hover:border-primary/38 hover:bg-[hsl(var(--surface-4))]",
        success:
          "border-success/35 bg-success/16 text-success-foreground hover:border-success/50 hover:bg-success/24",
        danger:
          "border-destructive/35 bg-destructive/16 text-destructive-foreground hover:border-destructive/50 hover:bg-destructive/24",
      },
    },
    defaultVariants: {
      intent: "default",
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, intent, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(iconButtonVariants({ intent }), className)}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
