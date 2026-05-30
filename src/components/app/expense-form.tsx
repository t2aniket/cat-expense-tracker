"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Copy, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { expenseSchema, type ExpenseFormInput, type ExpenseInput } from "@/lib/validation";
import { currency, timeInputValue, todayInputValue } from "@/lib/utils";
import { useCatStore } from "@/store/use-cat-store";
import type { Expense } from "@/types/domain";

export function ExpenseForm({ editing, onDone }: { editing?: Expense; onDone?: () => void }) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const categories = useCatStore((state) => state.categories);
  const expenses = useCatStore((state) => state.expenses);
  const preferences = useCatStore((state) => state.preferences);
  const members = useCatStore((state) => state.members);
  const currentUser = useCatStore((state) => state.currentUser);
  const addExpense = useCatStore((state) => state.addExpense);
  const updateExpense = useCatStore((state) => state.updateExpense);

  const recentNotes = useMemo(() => Array.from(new Set(expenses.map((expense) => expense.notes).filter(Boolean))).slice(0, 5), [expenses]);
  const defaultCategory = editing?.category || preferences.lastCategory || preferences.favoriteCategory || categories[0]?.name || "Food";
  const [paidByUserId, setPaidByUserId] = useState(editing?.paidByUserId || currentUser?.id || "");

  const form = useForm<ExpenseFormInput, unknown, ExpenseInput>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      id: editing?.id,
      amount: editing?.amount || undefined,
      category: defaultCategory,
      date: editing?.date || todayInputValue(),
      time: editing?.time || timeInputValue(),
      notes: editing?.notes || ""
    }
  });

  useEffect(() => {
    const id = window.setTimeout(() => form.setFocus("amount"), 180);
    return () => window.clearTimeout(id);
  }, [form]);

  async function onSubmit(input: ExpenseInput) {
    const effectivePaidByUserId = paidByUserId || currentUser?.id || "";
    try {
      if (editing) {
        const payer = members.find((member) => member.userId === effectivePaidByUserId);
        await updateExpense({ ...editing, ...input, paidByUserId: effectivePaidByUserId, paidByName: payer?.name || currentUser?.name || "Me", notes: input.notes || "" });
        toast.success("Expense updated");
        onDone?.();
        return;
      }
      await addExpense({ amount: input.amount, category: input.category, paidByUserId: effectivePaidByUserId, date: input.date, time: input.time, notes: input.notes || "" });
      toast.success(`${currency(input.amount)} saved to shared database`);
      form.reset({ amount: "", category: input.category, date: todayInputValue(), time: timeInputValue(), notes: "" });
      form.setFocus("amount");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save to Supabase");
    }
  }

  function duplicatePrevious() {
    const previous = expenses[0];
    if (!previous) return;
    form.reset({ amount: previous.amount, category: previous.category, date: todayInputValue(), time: timeInputValue(), notes: previous.notes });
    setPaidByUserId(previous.paidByUserId || currentUser?.id || "");
    setDetailsOpen(true);
  }

  const amountField = form.register("amount");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
      <section className="glass rounded-[2rem] p-4 shadow-xl shadow-black/5">
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-[var(--muted)]">Amount</span>
          <div className="flex items-center rounded-[1.7rem] border border-[var(--border)] bg-white/90 px-4 py-2 focus-within:border-[var(--accent)] focus-within:ring-4 focus-within:ring-teal-500/10 dark:bg-white/5">
            <span className="text-4xl font-bold text-[var(--muted)]">₹</span>
            <input
              inputMode="decimal"
              placeholder="0"
              aria-label="Expense amount"
              className="min-h-20 w-full bg-transparent px-3 text-5xl font-bold tracking-normal text-[var(--foreground)] outline-none"
              {...amountField}
            />
          </div>
          {form.formState.errors.amount && <span className="text-sm font-medium text-red-600">{form.formState.errors.amount.message}</span>}
        </label>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {preferences.quickAmounts.map((amount) => (
            <button key={amount} type="button" onClick={() => form.setValue("amount", amount, { shouldValidate: true })} className="min-h-11 rounded-2xl bg-black/5 text-sm font-bold dark:bg-white/10">
              ₹{amount}
            </button>
          ))}
        </div>

        <Button type="submit" size="lg" className="mt-4 w-full">
          <Save size={20} />
          Save
        </Button>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" variant="secondary" onClick={() => setDetailsOpen((open) => !open)}>
            <ChevronDown size={18} className={detailsOpen ? "rotate-180 transition" : "transition"} />
            Details
          </Button>
          <Button type="button" variant="secondary" onClick={duplicatePrevious}>
            <Copy size={18} />
            Duplicate
          </Button>
        </div>
      </section>

      {detailsOpen && (
        <section className="grid gap-4">
          <Select label="Category" {...form.register("category")}>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </Select>
          <Select label="Paid By" value={paidByUserId || currentUser?.id || ""} onChange={(event) => setPaidByUserId(event.target.value)}>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.userId === currentUser?.id ? `${member.name} (me)` : member.name}
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date" type="date" {...form.register("date")} />
            <Field label="Time" type="time" {...form.register("time")} />
          </div>
          <Textarea label="Notes" placeholder="Whiskas Wet Food 24 Pack" rows={4} {...form.register("notes")} />
          {recentNotes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recentNotes.map((note) => (
                <button key={note} type="button" onClick={() => form.setValue("notes", note)} className="shrink-0 rounded-full bg-black/5 px-3 py-2 text-sm font-medium dark:bg-white/10">
                  {note}
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </form>
  );
}
