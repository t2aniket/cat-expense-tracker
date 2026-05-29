import * as React from "react";
import { cn } from "@/lib/utils";

export function Select({ label, className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
      {label}
      <select className={cn("min-h-12 w-full rounded-2xl border border-[var(--border)] bg-white/80 px-4 text-base text-[var(--foreground)] outline-none focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-500/10 dark:bg-zinc-900", className)} {...props}>
        {children}
      </select>
    </label>
  );
}
