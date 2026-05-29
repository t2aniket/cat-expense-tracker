"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExpenseForm } from "@/components/app/expense-form";
import { ExpenseRow } from "@/components/app/expense-row";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Segmented } from "@/components/ui/segmented";
import type { Expense, SortMode } from "@/types/domain";
import { useCatStore } from "@/store/use-cat-store";

export default function HistoryPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortMode>("latest");
  const [editing, setEditing] = useState<Expense | null>(null);
  const expenses = useCatStore((state) => state.expenses);
  const categories = useCatStore((state) => state.categories);
  const removeExpense = useCatStore((state) => state.removeExpense);
  const restoreExpense = useCatStore((state) => state.restoreExpense);

  const filtered = useMemo(() => {
    const text = query.toLowerCase();
    return expenses
      .filter((expense) => category === "all" || expense.category === category)
      .filter((expense) => !text || `${expense.notes} ${expense.category} ${expense.date}`.toLowerCase().includes(text))
      .sort((a, b) => {
        if (sort === "highest") return b.amount - a.amount;
        if (sort === "lowest") return a.amount - b.amount;
        const left = new Date(`${a.date}T${a.time}`).getTime();
        const right = new Date(`${b.date}T${b.time}`).getTime();
        return sort === "oldest" ? left - right : right - left;
      });
  }, [category, expenses, query, sort]);

  async function onDelete(expense: Expense) {
    if (!window.confirm(`Delete ${expense.category} expense of ₹${expense.amount}?`)) return;
    const deleted = await removeExpense(expense.id);
    if (deleted) toast("Expense deleted", { action: { label: "Undo", onClick: () => void restoreExpense(deleted) } });
  }

  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <h1 className="text-4xl font-bold tracking-normal">History</h1>
        <p className="mt-2 text-[var(--muted)]">Search, sort, edit, and delete every saved expense.</p>
      </header>

      <Card className="grid gap-3">
        <Field label="Search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Notes, category, date" />
        <Select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">All Categories</option>
          {categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
        </Select>
        <Segmented value={sort} onChange={setSort} options={[{ value: "latest", label: "Latest" }, { value: "highest", label: "Highest" }, { value: "lowest", label: "Lowest" }]} />
      </Card>

      {editing && (
        <Card className="grid gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Edit Expense</h2>
            <Button type="button" variant="ghost" onClick={() => setEditing(null)}>Close</Button>
          </div>
          <ExpenseForm editing={editing} onDone={() => setEditing(null)} />
        </Card>
      )}

      <section className="grid gap-3">
        {filtered.map((expense) => <ExpenseRow key={expense.id} expense={expense} onEdit={setEditing} onDelete={onDelete} />)}
        {filtered.length === 0 && <Card className="text-center text-[var(--muted)]">No matching expenses.</Card>}
      </section>
    </div>
  );
}
