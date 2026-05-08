import { Skeleton, SkeletonHeader } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="space-y-4">
      <SkeletonHeader />
      <div
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
        aria-hidden="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
          {Array.from({ length: 42 }).map((_, i) => (
            <Skeleton key={`d-${i}`} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
