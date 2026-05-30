"use client";

import { format, parseISO } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
import type { Expense } from "@/types/domain";

export function ExpenseRow({ expense, onEdit, onDelete }: { expense: Expense; onEdit?: (expense: Expense) => void; onDelete?: (expense: Expense) => void }) {
  return (
    <article className="grid grid-cols-[1fr_auto] gap-3 rounded-3xl border border-[var(--border)] bg-white/60 p-4 dark:bg-white/5">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-bold">{expense.category}</p>
          <span className="rounded-full bg-black/5 px-2 py-1 text-xs font-semibold text-[var(--muted)] dark:bg-white/10">{format(parseISO(expense.date), "dd MMM")}</span>
        </div>
        <p className="mt-1 text-sm text-[var(--muted)]">{expense.time} · Paid by {expense.paidByName || "Unknown"}{expense.notes ? ` · ${expense.notes}` : ""}</p>
      </div>
      <div className="grid justify-items-end gap-2">
        <p className="text-lg font-bold">{currency(expense.amount)}</p>
        <div className="flex gap-1">
          {onEdit && <Button type="button" variant="ghost" size="icon" onClick={() => onEdit(expense)} aria-label="Edit expense"><Pencil size={17} /></Button>}
          {onDelete && <Button type="button" variant="ghost" size="icon" onClick={() => onDelete(expense)} aria-label="Delete expense"><Trash2 size={17} /></Button>}
        </div>
      </div>
    </article>
  );
}
