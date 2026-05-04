import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn("flex cursor-pointer items-center gap-2", className)}
      >
        <div className="relative flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className="peer sr-only"
            {...props}
          />
          <div className="flex h-4 w-4 items-center justify-center rounded border border-zinc-300 bg-white transition-colors peer-checked:border-zinc-900 peer-checked:bg-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:peer-checked:border-zinc-50 dark:peer-checked:bg-zinc-50">
            <Check className="h-3 w-3 text-white opacity-0 transition-opacity peer-checked:opacity-100 dark:text-zinc-900" />
          </div>
        </div>
        {label && (
          <span className="text-sm text-zinc-700 dark:text-zinc-300 select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
