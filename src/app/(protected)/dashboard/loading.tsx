import {
  Skeleton,
  SkeletonGrid,
  SkeletonHeader,
} from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900"
            aria-hidden="true"
          >
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="mb-3 h-8 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>

      <SkeletonGrid count={6} cols={3} />
    </div>
  );
}
