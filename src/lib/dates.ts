import { addDays, endOfMonth, endOfWeek, endOfYear, format, isWithinInterval, parseISO, startOfMonth, startOfWeek, startOfYear, subDays, subMonths, subWeeks } from "date-fns";
import type { DateRange, Expense } from "@/types/domain";

export function toDateTime(expense: Expense) {
  return parseISO(`${expense.date}T${expense.time || "00:00"}:00`);
}

export function filterByRange(expenses: Expense[], range: DateRange) {
  const start = parseISO(range.from);
  const end = parseISO(range.to);
  return expenses.filter((expense) => isWithinInterval(parseISO(expense.date), { start, end }));
}

export function namedRanges(reference = new Date()) {
  const yesterday = subDays(reference, 1);
  const lastWeek = subWeeks(reference, 1);
  const lastMonth = subMonths(reference, 1);

  return {
    today: { from: format(reference, "yyyy-MM-dd"), to: format(reference, "yyyy-MM-dd") },
    yesterday: { from: format(yesterday, "yyyy-MM-dd"), to: format(yesterday, "yyyy-MM-dd") },
    thisWeek: { from: format(startOfWeek(reference, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(reference, { weekStartsOn: 1 }), "yyyy-MM-dd") },
    lastWeek: { from: format(startOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"), to: format(endOfWeek(lastWeek, { weekStartsOn: 1 }), "yyyy-MM-dd") },
    thisMonth: { from: format(startOfMonth(reference), "yyyy-MM-dd"), to: format(endOfMonth(reference), "yyyy-MM-dd") },
    lastMonth: { from: format(startOfMonth(lastMonth), "yyyy-MM-dd"), to: format(endOfMonth(lastMonth), "yyyy-MM-dd") },
    thisYear: { from: format(startOfYear(reference), "yyyy-MM-dd"), to: format(endOfYear(reference), "yyyy-MM-dd") },
    last30Days: { from: format(addDays(reference, -29), "yyyy-MM-dd"), to: format(reference, "yyyy-MM-dd") }
  };
}
