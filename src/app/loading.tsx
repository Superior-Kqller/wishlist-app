import { Skeleton } from "@/components/ui/skeleton";
import { uiSurface } from "@/lib/ui-contract";

export default function Loading() {
  return (
    <div className="min-h-screen page-bg">
      <div className="mx-auto w-full max-w-[112rem] space-y-3 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:space-y-5 sm:px-6 sm:py-6 sm:pb-6 xl:px-8 2xl:px-10">
        <div className="grid items-stretch gap-3 sm:gap-5 xl:grid-cols-[minmax(0,2.35fr)_minmax(18rem,0.9fr)]">
          <section
            className={`${uiSurface.homeSummary} h-full rounded-xl px-3 py-3 sm:rounded-2xl sm:px-5 sm:py-4`}
          >
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
              <div className="min-w-0 space-y-2">
                <Skeleton className="h-3 w-28 rounded-full" />
                <Skeleton className="h-8 w-56 rounded-lg" />
                <Skeleton className="h-4 w-full max-w-lg rounded-full" />
              </div>
              <Skeleton className="h-20 w-40 rounded-2xl" />
            </div>
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
            <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-[4.5rem] rounded-xl" />
              ))}
            </div>
          </section>

          <aside
            className={`${uiSurface.contentPanel} rounded-xl border-border/45 p-3 sm:rounded-2xl sm:p-4`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-full" />
                <Skeleton className="h-3 w-32 rounded-full" />
              </div>
              <Skeleton className="h-7 w-7 rounded-full" />
            </div>
            <div className="mt-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[3.75rem] rounded-xl" />
              ))}
            </div>
          </aside>
        </div>

        <section className={uiSurface.homeToolbar}>
          <div className="hidden min-w-0 w-full flex-col gap-3 sm:flex">
            <div className="flex min-w-0 items-center justify-between gap-3 border-b border-border/32 pb-3">
              <div className="space-y-2">
                <Skeleton className="h-3 w-32 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-full" />
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <Skeleton className="h-9 w-24 rounded-lg" />
                <Skeleton className="h-9 w-28 rounded-lg" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
            </div>
            <div className="grid min-w-0 gap-2.5 xl:grid-cols-[minmax(18rem,1fr)_auto] xl:items-start xl:gap-x-5 xl:gap-y-2">
              <Skeleton className="h-10 w-full rounded-lg" />
              <div className="flex min-w-0 flex-wrap items-center gap-1.5 xl:col-span-2">
                <Skeleton className="h-9 w-44 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-9 w-36 rounded-lg" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>

          <div className="space-y-2 sm:hidden">
            <Skeleton className="h-11 w-full rounded-lg" />
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-lg" />
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1800px]:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-[344px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
