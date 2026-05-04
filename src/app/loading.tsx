import { Loader2 } from "lucide-react";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 dark:bg-zinc-950">
      <PlanocertoLogo />
      <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    </div>
  );
}
