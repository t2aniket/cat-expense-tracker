import { describe, expect, it } from "vitest";
import { expensesToCsv, parseExpenseCsv } from "@/services/api-client";
import type { Expense } from "@/types/domain";

describe("import export", () => {
  it("round trips CSV expenses", () => {
    const expenses: Expense[] = [{ id: crypto.randomUUID(), amount: 450, category: "Food", date: "2026-05-29", time: "09:15", notes: "Wet food", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }];
    const csv = expensesToCsv(expenses);
    const parsed = parseExpenseCsv(csv);
    expect(parsed[0].amount).toBe(450);
    expect(parsed[0].notes).toBe("Wet food");
  });
});
