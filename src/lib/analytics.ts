import { differenceInCalendarDays, format, parseISO, startOfMonth } from "date-fns";
import type { Category, Expense } from "@/types/domain";
import { filterByRange, namedRanges } from "@/lib/dates";

const sum = (expenses: Expense[]) => expenses.reduce((total, expense) => total + expense.amount, 0);

export function getDashboardMetrics(expenses: Expense[], now = new Date()) {
  const ranges = namedRanges(now);
  const lifetime = sum(expenses);
  const dates = expenses.map((expense) => parseISO(expense.date));
  const activeDays = dates.length ? Math.max(1, differenceInCalendarDays(now, dates.sort((a, b) => a.getTime() - b.getTime())[0]) + 1) : 1;
  const activeMonths = dates.length ? Math.max(1, (now.getFullYear() - dates[0].getFullYear()) * 12 + now.getMonth() - dates[0].getMonth() + 1) : 1;

  return {
    lifetime,
    today: sum(filterByRange(expenses, ranges.today)),
    week: sum(filterByRange(expenses, ranges.thisWeek)),
    month: sum(filterByRange(expenses, ranges.thisMonth)),
    last30Days: sum(filterByRange(expenses, ranges.last30Days)),
    averageDaily: lifetime / activeDays,
    averageMonthly: lifetime / activeMonths,
    count: expenses.length
  };
}

export function groupByCategory(expenses: Expense[], categories: Category[]) {
  return categories
    .map((category) => {
      const matches = expenses.filter((expense) => expense.category === category.name);
      return { name: category.name, value: sum(matches), count: matches.length, color: category.color };
    })
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

export function groupByMonth(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((expense) => {
    const key = format(startOfMonth(parseISO(expense.date)), "MMM yyyy");
    map.set(key, (map.get(key) || 0) + expense.amount);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function groupByDay(expenses: Expense[]) {
  const map = new Map<string, number>();
  expenses.forEach((expense) => {
    const key = format(parseISO(expense.date), "dd MMM");
    map.set(key, (map.get(key) || 0) + expense.amount);
  });
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

export function getInsights(expenses: Expense[], categories: Category[]) {
  const byCategory = groupByCategory(expenses, categories);
  const highest = [...expenses].sort((a, b) => b.amount - a.amount)[0];
  const lowest = [...expenses].sort((a, b) => a.amount - b.amount)[0];
  const mostUsed = byCategory.sort((a, b) => b.count - a.count)[0];
  const monthGroups = groupByMonth(expenses);
  const previous = monthGroups.at(-2)?.value || 0;
  const current = monthGroups.at(-1)?.value || 0;
  const trendPercent = previous > 0 ? ((current - previous) / previous) * 100 : current > 0 ? 100 : 0;

  return {
    averageSpend: expenses.length ? sum(expenses) / expenses.length : 0,
    highest,
    lowest,
    mostUsedCategory: mostUsed?.name || "None",
    fastestGrowingCategory: byCategory[0]?.name || "None",
    trendPercent,
    predictionNextMonth: Math.max(0, current + (current - previous) * 0.5)
  };
}
