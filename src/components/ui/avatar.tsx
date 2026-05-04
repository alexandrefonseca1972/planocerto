import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

const Avatar = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
);
Avatar.displayName = "Avatar";

const AvatarImage = forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, alt = "", ...props }, ref) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    ref={ref}
    alt={alt}
    className={cn("aspect-square h-full w-full", className)}
    {...props}
  />
));
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-zinc-200 text-sm font-medium text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200",
      className
    )}
    {...props}
  />
));
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
