import { SkeletonHeader, SkeletonTable } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader withActions />
      <SkeletonTable rows={10} cols={7} />
    </div>
  );
}
