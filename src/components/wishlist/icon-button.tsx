"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/45 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
  {
    variants: {
      intent: {
        default:
          "border-purple-500/30 bg-purple-950/40 text-slate-300 hover:border-purple-400/42 hover:bg-purple-900/50 hover:text-slate-100",
        success:
          "border-emerald-800/35 bg-emerald-950/35 text-emerald-400/85 hover:border-emerald-700/45 hover:bg-emerald-950/50",
        danger:
          "border-rose-900/40 bg-rose-950/35 text-rose-300/90 hover:border-rose-800/50 hover:bg-rose-950/48",
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
