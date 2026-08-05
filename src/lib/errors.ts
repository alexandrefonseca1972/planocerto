export type AppErrorCode =
  | "AUTH_REQUIRED"
  | "VALIDATION_ERROR"
  | "DB_ERROR"
  | "UNEXPECTED";

export type AppError = {
  code: AppErrorCode;
  message: string;
  fields?: Record<string, string>;
  retryable?: boolean;
};

export type FormState<T = void> = {
  message: string;
  success?: boolean;
  data?: T;
  errors?: Record<string, string[]>;
};

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Erro desconhecido.";
}

const RETRYABLE_MARKERS = [
  "econnreset",
  "etimedout",
  "econnrefused",
  "epipe",
  "fetch failed",
  "network",
  "timeout",
  "503",
  "502",
  "504",
  "retry",
];

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Heurística de erro transitório (vale a pena reexecutar). Cobre tanto Error
 * (mensagem) quanto os erros em formato de objeto do Supabase/PostgREST, que
 * trazem `status`/`code` em vez de herdar de Error.
 */
export function isRetryable(error: unknown): boolean {
  if (!error) return false;

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return RETRYABLE_MARKERS.some((s) => msg.includes(s));
  }

  if (typeof error === "object") {
    const e = error as Record<string, unknown>;
    const status = Number(e.status);
    if (Number.isFinite(status) && RETRYABLE_STATUS.has(status)) return true;
    const text = `${e.message ?? ""} ${e.code ?? ""}`.toLowerCase();
    return RETRYABLE_MARKERS.some((s) => text.includes(s));
  }

  if (typeof error === "string") {
    const text = error.toLowerCase();
    return RETRYABLE_MARKERS.some((s) => text.includes(s));
  }

  return false;
}

export interface RetryOptions {
  /** Tentativas extras além da primeira (padrão 2 → até 3 execuções). */
  retries?: number;
  /** Atraso base em ms; cresce exponencialmente (200, 400, 800…). */
  baseDelayMs?: number;
  /** Injetável para testes — por padrão usa setTimeout. */
  sleep?: (ms: number) => Promise<void>;
  /** Callback opcional a cada nova tentativa. */
  onRetry?: (attempt: number, error: unknown) => void;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Reexecuta `fn` enquanto o erro for transitório (isRetryable), com backoff
 * exponencial. Repropaga o último erro se esgotar as tentativas ou se o erro
 * não for retryable. Mitiga 503/timeouts intermitentes do Supabase.
 */
export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const { retries = 2, baseDelayMs = 200, sleep = defaultSleep, onRetry } = opts;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === retries || !isRetryable(error)) break;
      onRetry?.(attempt + 1, error);
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }

  throw lastError;
}

export function logSupabaseError(tag: string, error: unknown): void {
  if (!error) return;

  const e = error as Record<string, unknown>;
  const errorInfo: Record<string, unknown> = {
    type: Object.prototype.toString.call(error).slice(8, -1),
  };

  const knownProps = [
    'code', 'message', 'details', 'hint', 'context', 'name',
    'status', 'statusText', 'error', 'error_description'
  ];

  for (const prop of knownProps) {
    if (prop in e && e[prop] !== undefined && e[prop] !== null) {
      errorInfo[prop] = e[prop];
    }
  }

  if (Object.keys(errorInfo).length === 1) {
    try {
      errorInfo['raw'] = JSON.stringify(e);
    } catch {
      errorInfo['raw'] = String(error);
    }
  }

  console.error(`[${tag}] Error`, errorInfo);
  if (errorInfo.message) {
    console.error(`[${tag}] Message:`, errorInfo.message);
  }
  if (errorInfo.details) {
    console.error(`[${tag}] Details:`, errorInfo.details);
  }
}
