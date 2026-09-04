import * as React from "react";
import { cn } from "@/lib/utils";
import { uiState } from "@/lib/ui-contract";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-[color,background-color,border-color,box-shadow] duration-fast ease-[var(--ease-soft)] disabled:cursor-not-allowed disabled:opacity-50",
          uiState.focusField,
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
