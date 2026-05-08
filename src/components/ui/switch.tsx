import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface SwitchProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: React.ReactNode;
}

/**
 * Toggle switch (estilo shadcn). Aceita as mesmas props de input checkbox,
 * mas renderizado como switch deslizante.
 */
const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn("inline-flex cursor-pointer items-center gap-2", className)}
      >
        <span className="relative inline-flex h-5 w-9 shrink-0">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <span className="absolute inset-0 rounded-full border border-zinc-300 bg-zinc-200 transition-colors peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-disabled:opacity-50 dark:border-zinc-600 dark:bg-zinc-700" />
          <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
        </span>
        {label && (
          <span className="text-sm text-zinc-700 dark:text-zinc-300 select-none">
            {label}
          </span>
        )}
      </label>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
