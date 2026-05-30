"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { api } from "@/services/api-client";
import { cache, defaultPreferences } from "@/services/client-storage";
import type { AppUser, Category, Expense, Project, SortMode, UserPreferences } from "@/types/domain";

type State = {
  expenses: Expense[];
  categories: Category[];
  projects: Project[];
  currentUser: AppUser | null;
  selectedProjectId: string;
  preferences: UserPreferences;
  isReady: boolean;
  isSyncing: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  sync: () => Promise<void>;
  selectProject: (projectId: string) => void;
  createProject: (project: Pick<Project, "name"> & Partial<Pick<Project, "description" | "color" | "icon">>) => Promise<void>;
  addProjectMember: (email: string, role: Project["role"]) => Promise<void>;
  addExpense: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt" | "projectId" | "paidByUserId" | "paidByName"> & Partial<Pick<Expense, "paidByUserId">>) => Promise<Expense>;
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
      projects: [],
      currentUser: null,
      selectedProjectId: "",
      preferences: defaultPreferences,
      isReady: false,
      isSyncing: false,
      error: null,
      async hydrate() {
        set({ expenses: cache.getExpenses(), categories: cache.getCategories(), projects: cache.getProjects() as Project[], preferences: cache.getPreferences(), isSyncing: true });
        await get().sync();
      },
      async sync() {
        if (get().isSyncing && get().isReady) return;
        set({ isSyncing: true });
        try {
          const projectPayload = await api.listProjects();
          const projects = projectPayload.projects;
          const selectedProjectId = get().selectedProjectId && projects.some((project) => project.id === get().selectedProjectId) ? get().selectedProjectId : projects[0]?.id || "";
          const [expenses, categories] = selectedProjectId ? await Promise.all([api.listProjectExpenses(selectedProjectId), api.listCategories(selectedProjectId)]) : [[], DEFAULT_CATEGORIES];
          cache.setExpenses(expenses);
          cache.setCategories(categories);
          cache.setProjects(projects);
          set({ expenses: sortExpenses(expenses), categories, projects, currentUser: projectPayload.user, selectedProjectId, isReady: true, isSyncing: false, error: null });
        } catch (error) {
          set({ isReady: true, isSyncing: false, error: error instanceof Error ? error.message : "Offline cache is active." });
        }
      },
      selectProject(projectId) {
        set({ selectedProjectId: projectId, expenses: [], categories: DEFAULT_CATEGORIES });
        void get().sync();
      },
      async createProject(project) {
        const created = await api.createProject(project);
        set((state) => ({ projects: [...state.projects, created], selectedProjectId: created.id }));
        await get().sync();
      },
      async addProjectMember(email, role) {
        const projectId = get().selectedProjectId;
        if (!projectId) throw new Error("Select a project first.");
        await api.addProjectMember({ projectId, email, role });
      },
      async addExpense(input) {
        const projectId = get().selectedProjectId;
        if (!projectId) throw new Error("Select a project first.");
        const currentUser = get().currentUser;
        const now = new Date().toISOString();
        const optimistic: Expense = { ...input, id: crypto.randomUUID(), projectId, paidByUserId: input.paidByUserId || currentUser?.id || "", paidByName: currentUser?.name || "Me", createdAt: now, updatedAt: now };
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
        const projectId = get().selectedProjectId;
        const deleted = get().expenses.find((expense) => expense.id === id);
        set((state) => ({ expenses: state.expenses.filter((expense) => expense.id !== id) }));
        cache.setExpenses(get().expenses);
        try {
          await api.deleteExpense(id, projectId);
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
        const projectId = get().selectedProjectId;
        if (!projectId) throw new Error("Select a project first.");
        const now = new Date().toISOString();
        const local: Category = { ...category, id: crypto.randomUUID(), projectId, isDefault: false, createdAt: now, updatedAt: now };
        set((state) => ({ categories: [...state.categories, local].sort((a, b) => a.name.localeCompare(b.name)) }));
        cache.setCategories(get().categories);
        try {
          const saved = await api.saveCategory({ ...category, projectId });
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
        const projectId = get().selectedProjectId;
        const deleted = get().categories.find((category) => category.id === id);
        set((state) => ({ categories: state.categories.filter((category) => category.id !== id || category.isDefault) }));
        cache.setCategories(get().categories);
        try {
          await api.deleteCategory(id, projectId);
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
        set({ expenses: [], categories: DEFAULT_CATEGORIES, projects: [], selectedProjectId: "", preferences: defaultPreferences });
        cache.setExpenses([]);
        cache.setCategories(DEFAULT_CATEGORIES);
        cache.setPreferences(defaultPreferences);
      }
    }),
    { name: "cat-expense-ui-state", partialize: (state) => ({ preferences: state.preferences }) }
  )
);
