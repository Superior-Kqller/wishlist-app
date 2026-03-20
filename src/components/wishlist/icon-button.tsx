"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      intent: {
        default:
          "border-purple-500/35 bg-card/80 text-slate-200 hover:border-purple-400/55 hover:bg-card",
        success:
          "border-emerald-500/45 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60 hover:bg-emerald-500/15",
        danger:
          "border-rose-500/45 bg-rose-500/10 text-rose-300 hover:border-rose-400/60 hover:bg-rose-500/15",
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
