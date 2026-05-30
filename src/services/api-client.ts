import Papa from "papaparse";
import type { AppUser, Category, Expense, Project } from "@/types/domain";

async function request<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) }
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  async listExpenses() {
    throw new Error("Project id is required.");
  },
  async listProjectExpenses(projectId: string) {
    const data = await request<{ expenses: Expense[]; warning?: string }>(`/api/expenses?projectId=${encodeURIComponent(projectId)}`);
    if (data.warning) throw new Error(data.warning);
    return data.expenses;
  },
  async saveExpense(expense: Omit<Expense, "createdAt" | "updatedAt"> & Partial<Pick<Expense, "createdAt" | "updatedAt">>) {
    const data = await request<{ expense: Expense }>("/api/expenses", { method: "POST", body: JSON.stringify(expense) });
    return data.expense;
  },
  async deleteExpense(id: string, projectId: string) {
    await request<{ ok: true }>(`/api/expenses?id=${encodeURIComponent(id)}&projectId=${encodeURIComponent(projectId)}`, { method: "DELETE" });
  },
  async listCategories(projectId: string) {
    const data = await request<{ categories: Category[]; warning?: string }>(`/api/categories?projectId=${encodeURIComponent(projectId)}`);
    if (data.warning) throw new Error(data.warning);
    return data.categories;
  },
  async saveCategory(category: Partial<Category> & Pick<Category, "name" | "color" | "icon" | "isFavorite"> & { projectId: string }) {
    const data = await request<{ category: Category }>("/api/categories", { method: "POST", body: JSON.stringify(category) });
    return data.category;
  },
  async deleteCategory(id: string, projectId: string) {
    await request<{ ok: true }>(`/api/categories?id=${encodeURIComponent(id)}&projectId=${encodeURIComponent(projectId)}`, { method: "DELETE" });
  },
  async listProjects() {
    return request<{ projects: Project[]; user: AppUser; warning?: string }>("/api/projects");
  },
  async createProject(project: Pick<Project, "name"> & Partial<Pick<Project, "description" | "color" | "icon">>) {
    const data = await request<{ project: Project }>("/api/projects", { method: "POST", body: JSON.stringify(project) });
    return data.project;
  },
  async addProjectMember(input: { projectId: string; email: string; role: Project["role"] }) {
    await request<{ ok: true }>("/api/projects", { method: "POST", body: JSON.stringify(input) });
  }
};

export function expensesToCsv(expenses: Expense[]) {
  return Papa.unparse(expenses.map(({ id, amount, category, date, time, notes, createdAt, updatedAt }) => ({ id, amount, category, date, time, notes, createdAt, updatedAt })));
}

export function parseExpenseCsv(csv: string): Expense[] {
  const parsed = Papa.parse<Record<string, string>>(csv, { header: true, skipEmptyLines: true });
  if (parsed.errors.length) throw new Error(parsed.errors[0].message);
  return parsed.data.map((row) => ({
    id: row.id || crypto.randomUUID(),
    amount: Number(row.amount),
    category: row.category,
    date: row.date,
    time: row.time,
    notes: row.notes || "",
    createdAt: row.createdAt || new Date().toISOString(),
    updatedAt: row.updatedAt || new Date().toISOString()
  }));
}
