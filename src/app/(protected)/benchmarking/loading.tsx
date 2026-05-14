import { SkeletonHeader, SkeletonTable } from "@/components/ui/loading";

export default function Loading() {
  return (
    <div className="space-y-5">
      <SkeletonHeader withActions />
      <SkeletonTable rows={5} cols={6} />
    </div>
  );
}
