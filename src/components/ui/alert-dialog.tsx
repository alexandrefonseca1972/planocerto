"use client";

import {
  createContext,
  useContext,
  type ReactNode,
  type ButtonHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertDialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(
  undefined
);

function useAlertDialog() {
  const ctx = useContext(AlertDialogContext);
  if (!ctx) throw new Error("AlertDialog components must be used within <AlertDialog>");
  return ctx;
}

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  if (!open) return null;

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

interface AlertDialogTriggerProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export function AlertDialogTrigger({
  children,
  className,
  ...props
}: AlertDialogTriggerProps) {
  return (
    <button type="button" className={className} {...props}>
      {children}
    </button>
  );
}

export function AlertDialogContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { onOpenChange } = useAlertDialog();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-700 dark:bg-zinc-900",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start gap-3", className)}>
      {children}
    </div>
  );
}

export function AlertDialogTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold text-red-600 dark:text-red-400",
        className
      )}
    >
      {children}
    </h3>
  );
}

export function AlertDialogDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn("text-sm text-zinc-600 dark:text-zinc-400", className)}
    >
      {children}
    </p>
  );
}

export function AlertDialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 flex justify-end gap-2", className)}>
      {children}
    </div>
  );
}

export function AlertDialogCancel({
  children = "Cancelar",
  onClick,
}: {
  children?: ReactNode;
  onClick?: () => void;
}) {
  const { onOpenChange } = useAlertDialog();

  return (
    <Button
      type="button"
      variant="outline"
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
    >
      {children}
    </Button>
  );
}

export function AlertDialogAction({
  children,
  onClick,
  className,
  isLoading,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}) {
  const { onOpenChange } = useAlertDialog();

  return (
    <Button
      variant="destructive"
      onClick={() => {
        onClick?.();
        onOpenChange(false);
      }}
      className={className}
      isLoading={isLoading}
    >
      {children}
    </Button>
  );
}
