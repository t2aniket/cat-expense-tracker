export type Expense = {
  id: string;
  amount: number;
  category: string;
  date: string;
  time: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Category = {
  id: string;
  name: string;
  color: string;
  icon: string;
  isDefault: boolean;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserPreferences = {
  theme: "light" | "dark" | "system";
  lastCategory: string;
  favoriteCategory: string;
  budgetMonthly: number;
  budgetAlertPercent: number;
  quickAmounts: number[];
};

export type SortMode = "latest" | "oldest" | "highest" | "lowest";

export type DateRange = {
  from: string;
  to: string;
};
