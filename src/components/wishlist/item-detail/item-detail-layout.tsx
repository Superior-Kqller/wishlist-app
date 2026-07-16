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
        "space-y-4 px-4 py-4 sm:space-y-5 sm:px-5 sm:py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}
