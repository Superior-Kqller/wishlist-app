"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex h-11 w-11 min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10",
  {
    variants: {
      intent: {
        default:
          "border-fuchsia-500/40 bg-fuchsia-500/[0.08] text-fuchsia-100 hover:border-fuchsia-400/55 hover:bg-fuchsia-500/15",
        success:
          "border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300/60 hover:bg-emerald-500/22",
        danger:
          "border-rose-400/50 bg-rose-500/12 text-rose-200 hover:border-rose-300/58 hover:bg-rose-500/20",
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
