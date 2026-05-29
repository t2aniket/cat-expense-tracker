import { z } from "zod";

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.coerce.number().positive("Amount must be greater than zero").max(10_000_000, "Amount is too large"),
  category: z.string().min(1, "Choose a category").max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:mm"),
  notes: z.string().max(500, "Notes must be under 500 characters").optional().default("")
});

export const categorySchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, "Category name is required").max(40),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Use a hex color"),
  icon: z.string().min(1).max(40).default("Tag"),
  isFavorite: z.boolean().default(false)
});

export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).default("system"),
  lastCategory: z.string().default("Food"),
  favoriteCategory: z.string().default("Food"),
  budgetMonthly: z.coerce.number().min(0).max(100_000_000).default(0),
  budgetAlertPercent: z.coerce.number().min(1).max(100).default(80),
  quickAmounts: z.array(z.number().positive()).max(6).default([100, 250, 450, 1000])
});

export type ExpenseInput = z.infer<typeof expenseSchema>;
export type ExpenseFormInput = z.input<typeof expenseSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
