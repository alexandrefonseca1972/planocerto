"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ProtectedErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry: () => void;
}

export default function ProtectedError({ error, unstable_retry }: ProtectedErrorProps) {
  useEffect(() => {
    console.error("[Protected] Erro na página:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <AlertTriangle className="h-7 w-7 text-red-500 dark:text-red-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Algo deu errado
      </h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Ocorreu um erro ao carregar esta seção.
      </p>
      {error.digest && (
        <p className="mt-2 rounded-md bg-zinc-100 px-3 py-1 font-mono text-xs text-zinc-400 dark:bg-zinc-800">
          ID: {error.digest}
        </p>
      )}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={() => unstable_retry()}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
