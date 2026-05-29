import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea({ label, className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-[var(--muted)]">
      {label}
      <textarea
        className={cn("min-h-24 w-full resize-none rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-teal-500/10 dark:bg-white/5", className)}
        {...props}
      />
    </label>
  );
}
