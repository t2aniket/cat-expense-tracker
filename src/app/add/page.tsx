import { ExpenseForm } from "@/components/app/expense-form";

export default function AddPage() {
  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Quick Add</p>
        <h1 className="mt-2 text-4xl font-bold tracking-normal">Cat expense</h1>
        <p className="mt-2 text-[var(--muted)]">Amount is the only required step. Date, time, and category are already set.</p>
      </header>
      <ExpenseForm />
    </div>
  );
}
