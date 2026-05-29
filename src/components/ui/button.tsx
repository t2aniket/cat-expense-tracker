import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" && "bg-[var(--accent)] text-white shadow-lg shadow-teal-900/10 hover:bg-[var(--accent-strong)]",
        variant === "secondary" && "glass text-[var(--foreground)]",
        variant === "ghost" && "text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/10",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "min-h-9 rounded-xl px-3 text-sm",
        size === "md" && "px-4 py-3",
        size === "lg" && "min-h-14 px-5 text-lg",
        size === "icon" && "h-11 w-11 rounded-full p-0",
        className
      )}
      {...props}
    />
  );
}
