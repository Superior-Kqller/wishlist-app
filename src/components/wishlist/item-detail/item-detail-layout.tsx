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
        "space-y-2 px-3 pt-3 pb-3 sm:space-y-2.5 sm:px-5 sm:py-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
