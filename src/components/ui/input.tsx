import * as React from "react";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground transition-[color,background-color,border-color,box-shadow] duration-fast ease-[var(--ease-soft)] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-10",
          uiState.focusField,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
