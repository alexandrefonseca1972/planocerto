import { type HTMLAttributes, forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";

const alertVariants = cva(
  "relative w-full rounded-md border p-4 text-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-zinc-50 text-zinc-900 border-zinc-200 dark:bg-zinc-900/50 dark:text-zinc-50 dark:border-zinc-700",
        destructive: "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300 [&>svg]:text-red-600",
        success: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 [&>svg]:text-emerald-600",
        warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300 [&>svg]:text-amber-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const iconMap = {
  default: Info,
  destructive: XCircle,
  success: CheckCircle2,
  warning: AlertCircle,
} as const;

interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, children, ...props }, ref) => {
    const Icon = variant ? iconMap[variant] : iconMap.default;

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <div>{children}</div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription };
