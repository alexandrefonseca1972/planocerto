import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6 text-center">
        <PlanocertoLogo className="mx-auto" />

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
            <FileQuestion className="h-8 w-8 text-zinc-400 dark:text-zinc-500" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Página não encontrada
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            A página que você procura não existe ou foi removida.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
