import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeInput(value: string): string {
  if (typeof value !== "string") return "";
  return value.replace(/[<>]/g, "");
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "Não disponível";
  try {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return "Data inválida";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  } catch {
    return "Data inválida";
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Ocorreu um erro inesperado. Tente novamente.";
}
