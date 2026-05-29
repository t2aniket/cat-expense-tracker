import { NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { isDatabaseConfigured, listCategories, listExpenses } from "@/services/database-server";

export async function GET() {
  const categories = isDatabaseConfigured() ? await listCategories() : DEFAULT_CATEGORIES;
  const expenses = isDatabaseConfigured() ? await listExpenses() : [];
  return NextResponse.json({ version: 1, exportedAt: new Date().toISOString(), expenses, categories });
}
