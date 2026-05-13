"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry: () => void;
}

export default function GlobalError({ error, unstable_retry }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[global-error.tsx] Erro crítico:", error);
  }, [error]);

  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
        <div className="w-full max-w-md space-y-6 text-center">
          <PlanocertoLogo className="mx-auto" />

          <div className="flex flex-col items-center gap-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Erro crítico
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Ocorreu um erro que impede o carregamento da aplicação. Tente recarregar.
            </p>
          </div>

          {error.digest && (
            <p className="rounded-md bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              ID: {error.digest}
            </p>
          )}

          <button
            onClick={() => unstable_retry()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar
          </button>
        </div>
      </body>
    </html>
  );
}
