import { useState, type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

const PasswordInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        className={cn(
          "flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 pr-10 text-sm shadow-sm placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-400",
          className
        )}
        ref={ref}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
        aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
        tabIndex={-1}
      >
        {visible ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
