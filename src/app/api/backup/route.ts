import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { authOptions } from "@/lib/auth";
import { defaultProject, isDatabaseConfigured, listCategories, listExpenses, sessionToUser, upsertUser } from "@/services/database-server";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Sign in with Google to continue." }, { status: 401 });
  const user = sessionToUser(session.user);
  await upsertUser(user);
  const projectId = new URL(request.url).searchParams.get("projectId") || defaultProject();
  const categories = isDatabaseConfigured() ? await listCategories(projectId, user.id) : DEFAULT_CATEGORIES;
  const expenses = isDatabaseConfigured() ? await listExpenses(projectId, user.id) : [];
  return NextResponse.json({ version: 1, exportedAt: new Date().toISOString(), expenses, categories });
}
