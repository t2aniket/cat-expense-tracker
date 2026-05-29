import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Category, Expense, UserPreferences } from "@/types/domain";
import { DEFAULT_CATEGORIES } from "@/constants/categories";

type ExpenseRow = {
  id: string;
  app_instance_id: string;
  amount: number;
  category: string;
  expense_date: string;
  expense_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type CategoryRow = {
  id: string;
  app_instance_id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

const appInstanceId = process.env.CAT_APP_INSTANCE_ID || "personal-cat-expenses";

function client() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

export function isSupabaseConfigured() {
  return Boolean((process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: Number(row.amount),
    category: row.category,
    date: row.expense_date,
    time: row.expense_time.slice(0, 5),
    notes: row.notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default,
    isFavorite: row.is_favorite,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listExpenses() {
  const { data, error } = await client()
    .from("expenses")
    .select("*")
    .eq("app_instance_id", appInstanceId)
    .order("expense_date", { ascending: false })
    .order("expense_time", { ascending: false });
  if (error) throw error;
  return (data as ExpenseRow[]).map(mapExpense);
}

export async function upsertExpense(expense: Omit<Expense, "createdAt" | "updatedAt"> & Partial<Pick<Expense, "createdAt" | "updatedAt">>) {
  const now = new Date().toISOString();
  const { data, error } = await client()
    .from("expenses")
    .upsert(
      {
        id: expense.id,
        app_instance_id: appInstanceId,
        amount: expense.amount,
        category: expense.category,
        expense_date: expense.date,
        expense_time: expense.time,
        notes: expense.notes,
        created_at: expense.createdAt || now,
        updated_at: now
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapExpense(data as ExpenseRow);
}

export async function deleteExpense(id: string) {
  const { error } = await client().from("expenses").delete().eq("id", id).eq("app_instance_id", appInstanceId);
  if (error) throw error;
}

export async function listCategories() {
  const { data, error } = await client().from("categories").select("*").eq("app_instance_id", appInstanceId).order("name");
  if (error) throw error;
  const stored = (data as CategoryRow[]).map(mapCategory);
  return stored.length ? stored : DEFAULT_CATEGORIES;
}

export async function upsertCategory(category: Category) {
  const { data, error } = await client()
    .from("categories")
    .upsert(
      {
        id: category.id,
        app_instance_id: appInstanceId,
        name: category.name,
        color: category.color,
        icon: category.icon,
        is_default: category.isDefault,
        is_favorite: category.isFavorite,
        created_at: category.createdAt,
        updated_at: new Date().toISOString()
      },
      { onConflict: "id" }
    )
    .select("*")
    .single();
  if (error) throw error;
  return mapCategory(data as CategoryRow);
}

export async function deleteCategory(id: string) {
  const { error } = await client().from("categories").delete().eq("id", id).eq("app_instance_id", appInstanceId).eq("is_default", false);
  if (error) throw error;
}

export async function getPreferences(): Promise<UserPreferences | null> {
  const { data, error } = await client().from("preferences").select("settings").eq("app_instance_id", appInstanceId).maybeSingle();
  if (error) throw error;
  return (data?.settings as UserPreferences | undefined) || null;
}

export async function savePreferences(settings: UserPreferences) {
  const { error } = await client().from("preferences").upsert({ app_instance_id: appInstanceId, settings, updated_at: new Date().toISOString() }, { onConflict: "app_instance_id" });
  if (error) throw error;
}
