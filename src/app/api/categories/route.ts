import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { authOptions } from "@/lib/auth";
import { categorySchema } from "@/lib/validation";
import { deleteCategory, isDatabaseConfigured, listCategories, sessionToUser, upsertCategory, upsertUser } from "@/services/database-server";
import type { Category } from "@/types/domain";
import { slugify } from "@/lib/utils";

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in with Google to continue.");
  const user = sessionToUser(session.user);
  await upsertUser(user);
  return user;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ categories: DEFAULT_CATEGORIES, warning: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." });
  try {
    const user = await currentUser();
    const projectId = new URL(request.url).searchParams.get("projectId");
    if (!projectId) return NextResponse.json({ error: "Missing project id." }, { status: 400 });
    return NextResponse.json({ categories: await listCategories(projectId, user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const body = await request.json();
    const input = categorySchema.parse(body);
    const projectId = String(body.projectId || "");
    const now = new Date().toISOString();
    const category: Category = {
      id: input.id || `${projectId}-${slugify(input.name)}` || crypto.randomUUID(),
      projectId,
      name: input.name,
      color: input.color,
      icon: input.icon,
      isDefault: false,
      isFavorite: input.isFavorite,
      createdAt: now,
      updatedAt: now
    };
    return NextResponse.json({ category: await upsertCategory(category, projectId, user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const params = new URL(request.url).searchParams;
    const id = params.get("id");
    const projectId = params.get("projectId");
    if (!id || !projectId) return NextResponse.json({ error: "Missing category id or project id." }, { status: 400 });
    await deleteCategory(id, projectId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}
