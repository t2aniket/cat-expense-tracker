import { describe, expect, it } from "vitest";
import { expenseSchema } from "@/lib/validation";

describe("expense validation", () => {
  it("accepts a valid quick-add expense", () => {
    const parsed = expenseSchema.parse({ amount: "450", category: "Food", date: "2026-05-29", time: "22:30", notes: "" });
    expect(parsed.amount).toBe(450);
  });

  it("rejects non-positive amounts", () => {
    expect(() => expenseSchema.parse({ amount: 0, category: "Food", date: "2026-05-29", time: "22:30" })).toThrow();
  });
});
