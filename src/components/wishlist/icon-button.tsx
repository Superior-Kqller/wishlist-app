"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border text-sm shadow-none backdrop-blur-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
  {
    variants: {
      intent: {
        default:
          "border-border/65 bg-card/35 text-slate-200 hover:border-primary/38 hover:bg-card/50 dark:bg-black/28 dark:hover:bg-black/40",
        success:
          "border-emerald-500/25 bg-emerald-950/30 text-emerald-300/90 hover:border-emerald-400/40 hover:bg-emerald-950/45",
        danger:
          "border-rose-500/25 bg-rose-950/28 text-rose-300/88 hover:border-rose-400/38 hover:bg-rose-950/42",
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
