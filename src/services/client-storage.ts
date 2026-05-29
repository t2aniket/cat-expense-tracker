import type { Category, Expense, UserPreferences } from "@/types/domain";
import { DEFAULT_CATEGORIES } from "@/constants/categories";

const keys = {
  expenses: "cat-expenses-cache",
  categories: "cat-categories-cache",
  preferences: "cat-preferences"
};

export const defaultPreferences: UserPreferences = {
  theme: "system",
  lastCategory: "Food",
  favoriteCategory: "Food",
  budgetMonthly: 0,
  budgetAlertPercent: 80,
  quickAmounts: [100, 250, 450, 1000]
};

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(value));
}

export const cache = {
  getExpenses: () => read<Expense[]>(keys.expenses, []),
  setExpenses: (expenses: Expense[]) => write(keys.expenses, expenses),
  getCategories: () => read<Category[]>(keys.categories, DEFAULT_CATEGORIES),
  setCategories: (categories: Category[]) => write(keys.categories, categories),
  getPreferences: () => read<UserPreferences>(keys.preferences, defaultPreferences),
  setPreferences: (preferences: UserPreferences) => write(keys.preferences, preferences)
};
