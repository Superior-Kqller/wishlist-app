import { cn } from "@/lib/utils";

export function ItemDetailBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "space-y-3 px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] sm:space-y-4 sm:px-6 sm:pt-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
