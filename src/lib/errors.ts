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
