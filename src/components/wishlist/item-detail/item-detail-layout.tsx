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
        "space-y-2.5 px-3 pt-3 pb-3 sm:space-y-3 sm:px-5 sm:py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
