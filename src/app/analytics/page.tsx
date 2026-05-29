"use client";

import { MetricCard } from "@/components/app/metric-card";
import { BarChartCard, LineChartCard, PieChartCard } from "@/components/charts/chart-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getInsights, groupByCategory, groupByDay, groupByMonth } from "@/lib/analytics";
import { currency } from "@/lib/utils";
import { useCatStore } from "@/store/use-cat-store";
import Link from "next/link";

export default function AnalyticsPage() {
  const expenses = useCatStore((state) => state.expenses);
  const categories = useCatStore((state) => state.categories);
  const monthly = groupByMonth(expenses);
  const daily = groupByDay(expenses).slice(-30);
  const byCategory = groupByCategory(expenses, categories);
  const insights = getInsights(expenses, categories);

  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <h1 className="text-4xl font-bold tracking-normal">Analytics</h1>
        <p className="mt-2 text-[var(--muted)]">Trends, frequency, category breakdowns, and predictions.</p>
      </header>
      <Link href="/reports"><Button variant="secondary" className="w-full">Open Reports</Button></Link>

      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Average Spend" value={insights.averageSpend} />
        <MetricCard label="Trend" value={`${insights.trendPercent.toFixed(0)}%`} caption="vs previous month" />
        <MetricCard label="Highest" value={insights.highest ? currency(insights.highest.amount) : "₹0"} caption={insights.highest?.category} />
        <MetricCard label="Lowest" value={insights.lowest ? currency(insights.lowest.amount) : "₹0"} caption={insights.lowest?.category} />
        <MetricCard label="Most Used" value={insights.mostUsedCategory} />
        <MetricCard label="Growing" value={insights.fastestGrowingCategory} />
      </section>

      <PieChartCard title="Category Breakdown" data={byCategory} />
      <BarChartCard title="Monthly Spending" data={monthly} />
      <LineChartCard title="Daily Spending" data={daily} />
      <BarChartCard title="Category Comparison" data={byCategory} />
      <LineChartCard title="Yearly Trend" data={monthly} />

      <Card>
        <p className="text-sm font-semibold text-[var(--muted)]">Prediction</p>
        <p className="mt-2 text-2xl font-bold">{currency(insights.predictionNextMonth)}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">estimated for next month from recent trend momentum.</p>
      </Card>
    </div>
  );
}
