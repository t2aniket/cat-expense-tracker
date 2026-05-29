import { NextResponse } from "next/server";
import { expenseSchema } from "@/lib/validation";
import { deleteExpense, isSupabaseConfigured, listExpenses, upsertExpense } from "@/services/supabase-server";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ expenses: [], warning: "Supabase is not configured." });
  const expenses = await listExpenses();
  return NextResponse.json({ expenses });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const input = expenseSchema.parse(await request.json());
  const expense = await upsertExpense({ id: input.id || crypto.randomUUID(), amount: input.amount, category: input.category, date: input.date, time: input.time, notes: input.notes || "" });
  return NextResponse.json({ expense });
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing expense id." }, { status: 400 });
  await deleteExpense(id);
  return NextResponse.json({ ok: true });
}
