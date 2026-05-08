"use client";

import { cn } from "@/lib/utils";
import { TrendingUp } from "lucide-react";

/* ========================================================================== */
/* Spinner principal — 2 anéis concêntricos + ponto pulsante                  */
/* ========================================================================== */

/**
 * Spinner customizado da marca: anel azul + anel teal em direções opostas
 * com um ponto central pulsante. Substitui o Loader2 padrão em todo o projeto.
 */
export function BrandSpinner({
  size = 48,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Carregando"
    >
      <span
        className="absolute inset-0 animate-spin rounded-full border-[2.5px] border-transparent border-t-brand-600 border-r-brand-600/40"
        style={{ animationDuration: "1.1s" }}
      />
      <span
        className="absolute animate-spin rounded-full border-[2.5px] border-transparent border-b-accent-500 border-l-accent-500/40"
        style={{
          inset: Math.max(2, Math.round(size * 0.12)),
          animationDuration: "1.4s",
          animationDirection: "reverse",
        }}
      />
      <span
        className="absolute rounded-full bg-gradient-to-br from-brand-600 to-accent-500 animate-[brandPulse_1.6s_ease-in-out_infinite]"
        style={{
          inset: Math.max(6, Math.round(size * 0.32)),
        }}
      />
      <span className="sr-only">Carregando</span>
    </div>
  );
}

/* ========================================================================== */
/* Inline — para usar dentro de botões / textos                                */
/* ========================================================================== */

/**
 * Spinner inline com mensagem opcional.
 *
 * <Loading /> — apenas spinner
 * <Loading size="sm" message="Salvando..." />
 * <Loading size="lg" />
 */
export function Loading({
  size = "md",
  message,
  className,
}: {
  size?: "xs" | "sm" | "md" | "lg";
  message?: string;
  className?: string;
}) {
  const px = size === "xs" ? 14 : size === "sm" ? 18 : size === "lg" ? 32 : 22;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 text-zinc-500 dark:text-zinc-400",
        className,
      )}
    >
      <BrandSpinner size={px} />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}

/* ========================================================================== */
/* 3 dots — barra de progresso minimalista                                     */
/* ========================================================================== */

/**
 * Três pontos pulsando — alternativa compacta ao spinner.
 * Bom para placeholders inline ou status de "está pensando".
 */
export function LoadingDots({
  className,
  tone = "accent",
}: {
  className?: string;
  tone?: "accent" | "brand" | "muted";
}) {
  const color =
    tone === "brand"
      ? "bg-brand-600"
      : tone === "muted"
      ? "bg-zinc-400"
      : "bg-accent-500";
  return (
    <span
      className={cn("inline-flex items-center gap-1", className)}
      role="status"
      aria-label="Carregando"
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-[brandDot_1s_ease-in-out_infinite]",
            color,
          )}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}

/* ========================================================================== */
/* Logo Loader — splash full-screen com identidade da marca                   */
/* ========================================================================== */

/**
 * Loader full-screen com a logo da marca + barra de progresso animada.
 * Use no `app/loading.tsx` raiz para o splash inicial.
 */
export function LogoLoader({
  message = "Carregando…",
}: {
  message?: string;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-accent-50/30 dark:from-zinc-950 dark:via-zinc-900 dark:to-brand-950/30">
      <div className="flex flex-col items-center gap-6">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-600/20 animate-[brandPulse_2s_ease-in-out_infinite]">
          <TrendingUp className="h-8 w-8" />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="font-mono text-xl font-semibold tracking-tight text-brand-700 dark:text-zinc-50">
            PlanoCerto
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {message}
          </span>
        </div>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-zinc-200/60 dark:bg-zinc-800">
          <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-brand-600 via-accent-500 to-brand-600 animate-[loadingBar_1.6s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* Page Loading — área de conteúdo (dentro do layout protegido)                */
/* ========================================================================== */

/**
 * Tela de carregamento para a área de conteúdo (não substitui o layout).
 * Use em `loading.tsx` de rotas protegidas — o navbar/sidebar continuam visíveis.
 */
export function PageLoading({
  message = "Carregando…",
  size = 56,
}: {
  message?: string;
  size?: number;
}) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center animate-[fadeIn_300ms_ease-out]"
      role="status"
      aria-live="polite"
    >
      <BrandSpinner size={size} />
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
        {message}
      </p>
    </div>
  );
}

/* ========================================================================== */
/* Section Loading — bloco médio (dentro de um Card / lista)                  */
/* ========================================================================== */

/**
 * Loader compacto para uso dentro de Cards, seções ou listas.
 * Não ocupa toda a tela — apenas a região onde foi colocado.
 */
export function SectionLoading({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-8",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <BrandSpinner size={32} />
      {message && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{message}</p>
      )}
    </div>
  );
}

/* ========================================================================== */
/* Overlay — sobre um container existente                                      */
/* ========================================================================== */

/**
 * Overlay translúcido sobre um container (pai precisa ter `position: relative`).
 * Útil para indicar que uma lista/tabela está recarregando sem desmontar.
 */
export function OverlayLoading({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-white/70 backdrop-blur-sm animate-[fadeIn_180ms_ease-out] dark:bg-zinc-900/70",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <BrandSpinner size={36} />
      {message && (
        <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
          {message}
        </p>
      )}
    </div>
  );
}

/* ========================================================================== */
/* Skeletons — placeholders para conteúdo que ainda não chegou                 */
/* ========================================================================== */

/**
 * Bloco básico de skeleton — use para qualquer área retangular.
 * Combine com `Skeleton.Text`, `Skeleton.Card`, etc para layouts complexos.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-[skeletonShimmer_1.6s_ease-in-out_infinite] rounded-md bg-gradient-to-r from-zinc-200/70 via-zinc-100 to-zinc-200/70 bg-[length:200%_100%] dark:from-zinc-800/70 dark:via-zinc-700/50 dark:to-zinc-800/70",
        className,
      )}
    />
  );
}

/**
 * N linhas de texto skeleton, com largura variando levemente para parecer real.
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  const widths = ["w-full", "w-11/12", "w-10/12", "w-9/12", "w-8/12"];
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-3", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton de card típico — header + 3 linhas + footer.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      aria-hidden="true"
    >
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  );
}

/**
 * Skeleton de grid com vários cards.
 */
export function SkeletonGrid({
  count = 6,
  cols = 3,
  className,
}: {
  count?: number;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : cols === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={cn("grid gap-3", colClass, className)} aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * Linha skeleton para tabelas (n colunas).
 */
export function SkeletonRow({
  cols = 5,
  className,
}: {
  cols?: number;
  className?: string;
}) {
  return (
    <tr className={className} aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-3 py-2.5">
          <Skeleton
            className={cn(
              "h-3",
              i === 0 ? "w-8" : i === cols - 1 ? "w-16" : "w-full",
            )}
          />
        </td>
      ))}
    </tr>
  );
}

/**
 * Tabela skeleton completa — N linhas × M colunas.
 */
export function SkeletonTable({
  rows = 6,
  cols = 5,
  className,
}: {
  rows?: number;
  cols?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900",
        className,
      )}
      aria-hidden="true"
    >
      <table className="w-full">
        <thead className="border-b border-zinc-200 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/40">
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-3 py-2.5 text-left">
                <Skeleton className="h-2.5 w-2/3" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ========================================================================== */
/* Header skeleton — bloco com título grande + subtítulo                       */
/* ========================================================================== */

/**
 * Skeleton para o cabeçalho de uma página: título + descrição + opcional ações.
 */
export function SkeletonHeader({
  withActions = false,
  className,
}: {
  withActions?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)} aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3 w-64" />
      </div>
      {withActions && (
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      )}
    </div>
  );
}
