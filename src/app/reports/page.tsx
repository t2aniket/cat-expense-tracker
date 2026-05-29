"use client";

import { useMemo, useState } from "react";
import { ExpenseRow } from "@/components/app/expense-row";
import { MetricCard } from "@/components/app/metric-card";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { filterByRange, namedRanges } from "@/lib/dates";
import { currency } from "@/lib/utils";
import { useCatStore } from "@/store/use-cat-store";
import type { DateRange } from "@/types/domain";

type ReportKey = "today" | "yesterday" | "thisWeek" | "lastWeek" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

export default function ReportsPage() {
  const expenses = useCatStore((state) => state.expenses);
  const ranges = namedRanges();
  const [report, setReport] = useState<ReportKey>("thisMonth");
  const [custom, setCustom] = useState<DateRange>(ranges.thisMonth);
  const range = report === "custom" ? custom : ranges[report];
  const data = useMemo(() => filterByRange(expenses, range), [expenses, range]);
  const total = data.reduce((sum, expense) => sum + expense.amount, 0);
  const average = data.length ? total / data.length : 0;

  return (
    <div className="grid gap-5">
      <header className="pr-12">
        <h1 className="text-4xl font-bold tracking-normal">Reports</h1>
        <p className="mt-2 text-[var(--muted)]">{currency(total)} from {range.from} to {range.to}</p>
      </header>
      <Card className="grid gap-3">
        <Select label="Report Period" value={report} onChange={(event) => setReport(event.target.value as ReportKey)}>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="thisWeek">This Week</option>
          <option value="lastWeek">Last Week</option>
          <option value="thisMonth">This Month</option>
          <option value="lastMonth">Last Month</option>
          <option value="thisYear">This Year</option>
          <option value="custom">Custom Range</option>
        </Select>
        {report === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From" type="date" value={custom.from} onChange={(event) => setCustom((value) => ({ ...value, from: event.target.value }))} />
            <Field label="To" type="date" value={custom.to} onChange={(event) => setCustom((value) => ({ ...value, to: event.target.value }))} />
          </div>
        )}
      </Card>
      <section className="grid grid-cols-2 gap-3">
        <MetricCard label="Total" value={total} />
        <MetricCard label="Average" value={average} />
        <MetricCard label="Expenses" value={String(data.length)} />
        <MetricCard label="Highest" value={data.length ? Math.max(...data.map((expense) => expense.amount)) : 0} />
      </section>
      <section className="grid gap-3">
        {data.map((expense) => <ExpenseRow key={expense.id} expense={expense} />)}
        {data.length === 0 && <Card className="text-center text-[var(--muted)]">No expenses in this report period.</Card>}
      </section>
    </div>
  );
}
