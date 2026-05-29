"use client";

import { addMonths, eachDayOfInterval, endOfMonth, format, isSameDay, parseISO, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { ExpenseRow } from "@/components/app/expense-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { currency } from "@/lib/utils";
import { useCatStore } from "@/store/use-cat-store";

export default function CalendarPage() {
  const expenses = useCatStore((state) => state.expenses);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

  const dayTotals = useMemo(() => {
    const map = new Map<string, number>();
    expenses.forEach((expense) => map.set(expense.date, (map.get(expense.date) || 0) + expense.amount));
    return map;
  }, [expenses]);

  const selectedExpenses = expenses.filter((expense) => isSameDay(parseISO(expense.date), selected));
  const monthTotal = days.reduce((total, day) => total + (dayTotals.get(format(day, "yyyy-MM-dd")) || 0), 0);

  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <h1 className="text-4xl font-bold tracking-normal">Calendar</h1>
        <p className="mt-2 text-[var(--muted)]">{currency(monthTotal)} in {format(month, "MMMM yyyy")}</p>
      </header>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <Button variant="secondary" size="icon" onClick={() => setMonth(subMonths(month, 1))} aria-label="Previous month"><ChevronLeft size={20} /></Button>
          <h2 className="text-xl font-bold">{format(month, "MMMM yyyy")}</h2>
          <Button variant="secondary" size="icon" onClick={() => setMonth(addMonths(month, 1))} aria-label="Next month"><ChevronRight size={20} /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-[var(--muted)]">
          {["M", "T", "W", "T", "F", "S", "S"].map((day) => <div key={day}>{day}</div>)}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {Array.from({ length: (Number(format(startOfMonth(month), "i")) + 6) % 7 }).map((_, index) => <span key={index} />)}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const total = dayTotals.get(key) || 0;
            const active = isSameDay(day, selected);
            return (
              <button key={key} type="button" onClick={() => setSelected(day)} className={`min-h-16 rounded-2xl p-1 text-left transition ${active ? "bg-[var(--accent)] text-white" : "bg-black/5 dark:bg-white/10"}`}>
                <span className="block text-sm font-bold">{format(day, "d")}</span>
                {total > 0 && <span className="mt-1 block truncate text-[10px] font-bold">{currency(total)}</span>}
              </button>
            );
          })}
        </div>
      </Card>

      <section className="grid gap-3">
        <h2 className="text-xl font-bold">{format(selected, "dd MMMM yyyy")}</h2>
        {selectedExpenses.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}
        {selectedExpenses.length === 0 && <Card className="text-center text-[var(--muted)]">No expenses on this date.</Card>}
      </section>
    </div>
  );
}
