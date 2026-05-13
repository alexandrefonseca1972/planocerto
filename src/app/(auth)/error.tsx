"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PlanocertoLogo } from "@/components/layout/planocerto-logo";

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  unstable_retry: () => void;
}

export default function AuthError({ error, unstable_retry }: AuthErrorProps) {
  useEffect(() => {
    console.error("[Auth] Erro na página:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-6 text-center">
        <PlanocertoLogo className="mx-auto" />

        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Algo deu errado
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ocorreu um erro inesperado. Tente novamente.
          </p>
        </div>

        {error.digest && (
          <p className="rounded-md bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            ID: {error.digest}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => unstable_retry()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar novamente
          </button>
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 underline underline-offset-2 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            Ir para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
