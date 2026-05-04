"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
}

interface ToastContextType {
  toasts: Toast[];
  toast: (message: string, variant?: Toast["variant"]) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: Toast["variant"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg animate-[slideUp_300ms_ease-out]",
              t.variant === "success" && "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
              t.variant === "error" && "border-red-200 bg-white text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
              t.variant === "info" && "border-blue-200 bg-white text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
            )}
          >
            {t.variant === "success" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
            {t.variant === "error" && <AlertCircle className="h-5 w-5 shrink-0" />}
            {t.variant === "info" && <Info className="h-5 w-5 shrink-0" />}
            <p className="text-sm">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="ml-auto shrink-0 rounded p-0.5 hover:bg-zinc-900/5 dark:hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
