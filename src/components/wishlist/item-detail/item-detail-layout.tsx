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
        "space-y-3 px-3 py-3 sm:space-y-3.5 sm:px-5 sm:py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
