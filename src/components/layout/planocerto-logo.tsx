import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp } from "lucide-react";

interface PlanocertoLogoProps {
  className?: string;
  href?: string;
}

export function PlanocertoLogo({ className, href }: PlanocertoLogoProps) {
  const content = (
    <div className={cn("flex items-center gap-2 select-none", className)}>
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900">
        <TrendingUp className="h-5 w-5" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 font-mono">
        PlanoCerto
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block">
        {content}
      </Link>
    );
  }

  return content;
}
