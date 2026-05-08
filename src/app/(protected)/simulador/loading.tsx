import { SkeletonGrid, SkeletonHeader } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader withActions />
      <SkeletonGrid count={6} cols={3} />
    </div>
  );
}
