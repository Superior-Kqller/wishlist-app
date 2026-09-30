import { Skeleton } from "@/components/ui/skeleton";
import { PageMain } from "@/components/ui/page-shell";

/** Переход между разделами: та же рамка, заголовок, ряд пилюль и сетка плиток. */
export default function Loading() {
  return (
    <PageMain>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-8 w-56 rounded-lg" />
        <Skeleton className="h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 min-[744px]:grid-cols-3 min-[1128px]:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-4/5 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </PageMain>
  );
}
