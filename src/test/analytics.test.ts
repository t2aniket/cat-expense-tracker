import { describe, expect, it } from "vitest";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { getDashboardMetrics, groupByCategory } from "@/lib/analytics";
import type { Expense } from "@/types/domain";

const expenses: Expense[] = [
  { id: "1", amount: 450, category: "Food", date: "2026-05-29", time: "10:00", notes: "", createdAt: "", updatedAt: "" },
  { id: "2", amount: 1200, category: "Vet", date: "2026-05-28", time: "18:00", notes: "Vaccination", createdAt: "", updatedAt: "" }
];

describe("analytics", () => {
  it("computes dashboard totals", () => {
    const metrics = getDashboardMetrics(expenses, new Date("2026-05-29T12:00:00"));
    expect(metrics.lifetime).toBe(1650);
    expect(metrics.today).toBe(450);
    expect(metrics.count).toBe(2);
  });

  it("groups by category", () => {
    const grouped = groupByCategory(expenses, DEFAULT_CATEGORIES);
    expect(grouped[0]).toMatchObject({ name: "Vet", value: 1200, count: 1 });
  });
});
