"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ExpenseRow } from "@/components/app/expense-row";
import { MetricCard } from "@/components/app/metric-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getDashboardMetrics, getInsights } from "@/lib/analytics";
import { currency } from "@/lib/utils";
import { useCatStore } from "@/store/use-cat-store";

export default function DashboardPage() {
  const expenses = useCatStore((state) => state.expenses);
  const categories = useCatStore((state) => state.categories);
  const preferences = useCatStore((state) => state.preferences);
  const selectedProjectId = useCatStore((state) => state.selectedProjectId);
  const error = useCatStore((state) => state.error);
  const metrics = getDashboardMetrics(expenses);
  const insights = getInsights(expenses, categories);
  const budgetUsed = preferences.budgetMonthly ? Math.min(100, (metrics.month / preferences.budgetMonthly) * 100) : 0;

  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--accent)]">Cat Expense Tracker</p>
        <h1 className="mt-2 text-4xl font-bold tracking-normal">{currency(metrics.month)}</h1>
        <p className="mt-1 text-[var(--muted)]">spent this month across {metrics.count} expenses</p>
      </header>

      {!selectedProjectId && <Card className="text-center text-[var(--muted)]">Create a project or accept an invite in Settings to start tracking shared expenses.</Card>}

      {error && <div className="rounded-2xl bg-amber-500/15 p-3 text-sm font-medium text-amber-800 dark:text-amber-200">{error}</div>}

      <Link href="/add">
        <Button size="lg" className="w-full">
          <Plus size={22} />
          Add Expense
        </Button>
      </Link>

      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Lifetime" value={metrics.lifetime} />
        <MetricCard label="Today" value={metrics.today} />
        <MetricCard label="This Week" value={metrics.week} />
        <MetricCard label="Last 30 Days" value={metrics.last30Days} />
        <MetricCard label="Avg Daily" value={metrics.averageDaily} />
        <MetricCard label="Avg Monthly" value={metrics.averageMonthly} />
      </section>

      <Card>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--muted)]">Budget</p>
            <p className="mt-1 text-xl font-bold">{preferences.budgetMonthly ? `${budgetUsed.toFixed(0)}% used` : "No monthly budget"}</p>
          </div>
          <Link href="/settings" className="text-sm font-bold text-[var(--accent)]">Set</Link>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
          <div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${budgetUsed}%` }} />
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-[var(--muted)]">Insight</p>
        <p className="mt-2 text-lg font-bold">{insights.mostUsedCategory} is your most used category.</p>
        <p className="mt-1 text-sm text-[var(--muted)]">Predicted next month: {currency(insights.predictionNextMonth)}</p>
      </Card>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Recent</h2>
          <Link href="/history" className="flex items-center gap-1 text-sm font-bold text-[var(--accent)]">
            View all <ArrowRight size={16} />
          </Link>
        </div>
        {expenses.slice(0, 5).map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}
        {expenses.length === 0 && <Card className="text-center text-[var(--muted)]">No expenses yet. Add the first one in a few seconds.</Card>}
      </section>
    </div>
  );
}
