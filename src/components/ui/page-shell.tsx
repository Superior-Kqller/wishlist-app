import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { uiSurface } from "@/lib/ui-contract";

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

export function PageShell({ children, className }: PageShellProps) {
  return <div className={cn("min-h-screen page-bg", className)}>{children}</div>;
}

interface PageMainProps {
  children: ReactNode;
  className?: string;
}

export function PageMain({ children, className }: PageMainProps) {
  return <main className={cn("container mx-auto px-4 py-6 lg:py-8", className)}>{children}</main>;
}

interface PageIntroProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageIntro({ title, description, actions, className }: PageIntroProps) {
  return (
    <section className={cn(uiSurface.pageHeader, "px-4 py-4 sm:px-5", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold leading-tight tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-[65ch] text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
      </div>
    </section>
  );
}
