import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export const Field = React.forwardRef<HTMLInputElement, Props>(({ label, className, ...props }, ref) => (
  <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
    {label}
    <input
      ref={ref}
      className={cn("min-h-12 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-500/10 dark:bg-white/5", className)}
      {...props}
    />
  </label>
));
Field.displayName = "Field";
