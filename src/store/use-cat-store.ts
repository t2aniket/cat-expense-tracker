"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { api } from "@/services/api-client";
import { cache, defaultPreferences } from "@/services/client-storage";
import type { Category, Expense, SortMode, UserPreferences } from "@/types/domain";

type State = {
  expenses: Expense[];
  categories: Category[];
  preferences: UserPreferences;
  isReady: boolean;
  isSyncing: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  sync: () => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<Expense>;
  updateExpense: (expense: Expense) => Promise<Expense>;
  removeExpense: (id: string) => Promise<Expense | undefined>;
  restoreExpense: (expense: Expense) => Promise<void>;
  addCategory: (category: Pick<Category, "name" | "color" | "icon" | "isFavorite">) => Promise<void>;
  updateCategoryLocal: (category: Category) => void;
  removeCategory: (id: string) => Promise<void>;
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  importExpenses: (expenses: Expense[]) => Promise<void>;
  resetAll: () => void;
};

function sortExpenses(expenses: Expense[], mode: SortMode = "latest") {
  return [...expenses].sort((a, b) => {
    if (mode === "highest") return b.amount - a.amount;
    if (mode === "lowest") return a.amount - b.amount;
    const left = new Date(`${a.date}T${a.time}`).getTime();
    const right = new Date(`${b.date}T${b.time}`).getTime();
    return mode === "oldest" ? left - right : right - left;
  });
}

export const useCatStore = create<State>()(
  persist(
    (set, get) => ({
      expenses: [],
      categories: DEFAULT_CATEGORIES,
      preferences: defaultPreferences,
      isReady: false,
      isSyncing: false,
      error: null,
      async hydrate() {
        set({ expenses: cache.getExpenses(), categories: cache.getCategories(), preferences: cache.getPreferences(), isSyncing: true });
        await get().sync();
      },
      async sync() {
        if (get().isSyncing && get().isReady) return;
        set({ isSyncing: true });
        try {
          const [expenses, categories] = await Promise.all([api.listExpenses(), api.listCategories()]);
          cache.setExpenses(expenses);
          cache.setCategories(categories);
          set({ expenses: sortExpenses(expenses), categories, isReady: true, isSyncing: false, error: null });
        } catch (error) {
          set({ isReady: true, isSyncing: false, error: error instanceof Error ? error.message : "Offline cache is active." });
        }
      },
      async addExpense(input) {
        const now = new Date().toISOString();
        const optimistic: Expense = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
        const nextPreferences = { ...get().preferences, lastCategory: input.category };
        set((state) => ({ expenses: sortExpenses([optimistic, ...state.expenses]), preferences: nextPreferences }));
        cache.setPreferences(nextPreferences);
        try {
          const saved = await api.saveExpense(optimistic);
          set((state) => ({ expenses: sortExpenses(state.expenses.map((expense) => (expense.id === optimistic.id ? saved : expense))), error: null }));
          cache.setExpenses(get().expenses);
          void get().sync();
          return saved;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Supabase sync failed.";
          set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== optimistic.id), error: message }));
          cache.setExpenses(get().expenses);
          throw new Error(message);
        }
      },
      async updateExpense(expense) {
        const previous = get().expenses.find((item) => item.id === expense.id);
        const updated = { ...expense, updatedAt: new Date().toISOString() };
        set((state) => ({ expenses: sortExpenses(state.expenses.map((item) => (item.id === expense.id ? updated : item))) }));
        cache.setExpenses(get().expenses);
        try {
          const saved = await api.saveExpense(updated);
          set((state) => ({ expenses: sortExpenses(state.expenses.map((item) => (item.id === saved.id ? saved : item))), error: null }));
          void get().sync();
          return saved;
        } catch (error) {
          const message = error instanceof Error ? error.message : "Supabase sync failed.";
          if (previous) set((state) => ({ expenses: sortExpenses(state.expenses.map((item) => (item.id === previous.id ? previous : item))), error: message }));
          else set({ error: message });
          cache.setExpenses(get().expenses);
          throw new Error(message);
        }
      },
      async removeExpense(id) {
        const deleted = get().expenses.find((expense) => expense.id === id);
        set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== id) }));
        cache.setExpenses(get().expenses);
        try {
          await api.deleteExpense(id);
          set({ error: null });
          void get().sync();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Supabase sync failed.";
          if (deleted) set((state) => ({ expenses: sortExpenses([deleted, ...state.expenses]), error: message }));
          else set({ error: message });
          cache.setExpenses(get().expenses);
          throw new Error(message);
        }
        return deleted;
      },
      async restoreExpense(expense) {
        const saved = await api.saveExpense(expense);
        set((state) => ({ expenses: sortExpenses([saved, ...state.expenses.filter((item) => item.id !== saved.id)]), error: null }));
        cache.setExpenses(get().expenses);
        void get().sync();
      },
      async addCategory(category) {
        const now = new Date().toISOString();
        const local: Category = { ...category, id: crypto.randomUUID(), isDefault: false, createdAt: now, updatedAt: now };
        set((state) => ({ categories: [...state.categories, local].sort((a, b) => a.name.localeCompare(b.name)) }));
        cache.setCategories(get().categories);
        try {
          const saved = await api.saveCategory(category);
          set((state) => ({ categories: state.categories.map((item) => (item.id === local.id ? saved : item)), error: null }));
          cache.setCategories(get().categories);
          void get().sync();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Supabase sync failed.";
          set((state) => ({ categories: state.categories.filter((item) => item.id !== local.id), error: message }));
          cache.setCategories(get().categories);
          throw new Error(message);
        }
      },
      updateCategoryLocal(category) {
        set((state) => ({ categories: state.categories.map((item) => (item.id === category.id ? category : item)) }));
        cache.setCategories(get().categories);
      },
      async removeCategory(id) {
        const deleted = get().categories.find((category) => category.id === id);
        set((state) => ({ categories: state.categories.filter((category) => category.id !== id || category.isDefault) }));
        cache.setCategories(get().categories);
        try {
          await api.deleteCategory(id);
          set({ error: null });
          void get().sync();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Supabase sync failed.";
          if (deleted && !deleted.isDefault) set((state) => ({ categories: [...state.categories, deleted].sort((a, b) => a.name.localeCompare(b.name)), error: message }));
          else set({ error: message });
          cache.setCategories(get().categories);
          throw new Error(message);
        }
      },
      setPreferences(partial) {
        const preferences = { ...get().preferences, ...partial };
        set({ preferences });
        cache.setPreferences(preferences);
      },
      async importExpenses(expenses) {
        for (const expense of expenses) await get().updateExpense(expense);
      },
      resetAll() {
        set({ expenses: [], categories: DEFAULT_CATEGORIES, preferences: defaultPreferences });
        cache.setExpenses([]);
        cache.setCategories(DEFAULT_CATEGORIES);
        cache.setPreferences(defaultPreferences);
      }
    }),
    { name: "cat-expense-ui-state", partialize: (state) => ({ preferences: state.preferences }) }
  )
);
