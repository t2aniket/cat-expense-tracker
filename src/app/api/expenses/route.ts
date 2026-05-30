import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import { deleteExpense, isDatabaseConfigured, listExpenses, sessionToUser, upsertExpense, upsertUser } from "@/services/database-server";

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in with Google to continue.");
  const user = sessionToUser(session.user);
  await upsertUser(user);
  return user;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ expenses: [], warning: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." });
  try {
    const user = await currentUser();
    const projectId = new URL(request.url).searchParams.get("projectId");
    return NextResponse.json({ expenses: await listExpenses(projectId || "", user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const body = await request.json();
    const input = expenseSchema.parse(body);
    const projectId = String(body.projectId || "");
    const expense = await upsertExpense({ id: input.id || crypto.randomUUID(), projectId, amount: input.amount, category: input.category, paidByUserId: body.paidByUserId || user.id, date: input.date, time: input.time, notes: input.notes || "" }, user.id);
    return NextResponse.json({ expense });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const projectId = searchParams.get("projectId");
    if (!id || !projectId) return NextResponse.json({ error: "Missing expense id or project id." }, { status: 400 });
    await deleteExpense(id, projectId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}
