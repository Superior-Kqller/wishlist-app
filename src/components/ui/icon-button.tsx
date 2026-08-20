"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "shrink-0 shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      iconSize: {
        default:
          "h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg sm:h-10 sm:w-10 sm:min-h-10 sm:min-w-10 [&_svg]:h-5 [&_svg]:w-5",
        sm: "h-9 w-9 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
        lg: "h-12 w-12 rounded-xl [&_svg]:h-5 [&_svg]:w-5",
        toolbar: "h-9 w-9 rounded-lg [&_svg]:h-4 [&_svg]:w-4",
      },
      intent: {
        default:
          "border-border/85 bg-[hsl(var(--surface-3)/0.64)] text-foreground hover:border-primary/32 hover:bg-accent",
        success:
          "border-success/32 bg-success/16 text-success hover:border-success/55 hover:bg-success/24",
        danger:
          "border-destructive/32 bg-destructive/16 text-destructive hover:border-destructive/55 hover:bg-destructive/24",
      },
    },
    defaultVariants: {
      iconSize: "default",
      intent: "default",
    },
  },
);

export interface IconButtonProps
  extends Omit<ButtonProps, "size">, VariantProps<typeof iconButtonVariants> {
  "aria-label": string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = "outline", iconSize, intent, type = "button", ...props }, ref) => (
    <Button
      ref={ref}
      type={type}
      variant={variant}
      size="icon"
      className={cn(iconButtonVariants({ iconSize, intent }), className)}
      {...props}
    />
  ),
);
IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
