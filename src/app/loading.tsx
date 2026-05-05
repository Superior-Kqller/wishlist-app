import { Skeleton } from "@/components/ui/skeleton";
import { uiSurface } from "@/lib/ui-contract";

export default function Loading() {
  return (
    <div className="min-h-screen page-bg">
      <main className="container mx-auto space-y-3 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:space-y-4 sm:px-4 sm:py-6 sm:pb-6">
        <div className={uiSurface.stickyPanel}>
          <div className="flex min-w-0 items-center gap-2 sm:hidden">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
            <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          </div>
          <div className="hidden sm:flex flex-row flex-wrap items-center gap-2 sm:gap-3 min-w-0">
            <Skeleton className="h-10 w-full max-w-md rounded-lg" />
            <Skeleton className="h-10 w-40 rounded-lg" />
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
          <div className="hidden sm:block">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-16 rounded-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] w-full rounded-2xl sm:rounded-3xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
