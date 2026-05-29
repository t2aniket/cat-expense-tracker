import { NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { isSupabaseConfigured, listCategories, listExpenses } from "@/services/supabase-server";

export async function GET() {
  const categories = isSupabaseConfigured() ? await listCategories() : DEFAULT_CATEGORIES;
  const expenses = isSupabaseConfigured() ? await listExpenses() : [];
  return NextResponse.json({ version: 1, exportedAt: new Date().toISOString(), expenses, categories });
}
