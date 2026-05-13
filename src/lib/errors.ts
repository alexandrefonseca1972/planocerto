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

export function isRetryable(error: unknown): boolean {
  if (error instanceof Error) {
    return ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "503", "retry"].some((s) =>
      error.message.toLowerCase().includes(s.toLowerCase())
    );
  }
  return false;
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
