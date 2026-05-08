import { Skeleton, SkeletonHeader } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />
      <div
        className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
        aria-hidden="true"
      >
        <Skeleton className="h-32 rounded-none" />
        <div className="space-y-4 p-6">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-10 w-2/3" />
        </div>
      </div>
    </div>
  );
}
