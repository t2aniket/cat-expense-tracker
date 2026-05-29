"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (value: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-2xl bg-black/5 p-1 dark:bg-white/10">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn("min-h-10 rounded-xl px-3 text-sm font-semibold text-[var(--muted)] transition", value === option.value && "bg-white text-[var(--foreground)] shadow-sm dark:bg-zinc-800")}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
