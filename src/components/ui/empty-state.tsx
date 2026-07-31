import * as React from "react";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  secondaryIcon?: React.ReactNode;
}

function EmptyState({
  className,
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondaryAction,
  secondaryIcon,
  ...props
}: EmptyStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center sm:min-h-[320px]",
        uiSurface.emptyState,
        className,
      )}
      {...props}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
        {icon ?? <Inbox className="h-5 w-5" aria-hidden />}
      </div>
      <h2 className="text-lg font-semibold text-balance">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-pretty text-muted-foreground">{description}</p>
      ) : null}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        {actionLabel && onAction ? (
          <Button type="button" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {secondaryLabel && onSecondaryAction ? (
          <Button type="button" variant="outline" onClick={onSecondaryAction}>
            {secondaryIcon ? (
              <span className="mr-2 inline-flex h-4 w-4 items-center justify-center">
                {secondaryIcon}
              </span>
            ) : null}
            {secondaryLabel}
          </Button>
        ) : null}
      </div>
    </section>
  );
}

export { EmptyState };
