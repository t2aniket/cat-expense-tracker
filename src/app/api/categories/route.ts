import { NextResponse } from "next/server";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import { categorySchema } from "@/lib/validation";
import { deleteCategory, isSupabaseConfigured, listCategories, upsertCategory } from "@/services/supabase-server";
import type { Category } from "@/types/domain";
import { slugify } from "@/lib/utils";

export async function GET() {
  if (!isSupabaseConfigured()) return NextResponse.json({ categories: DEFAULT_CATEGORIES, warning: "Supabase env is missing. Add the project URL and anon key in Vercel." });
  const categories = await listCategories();
  return NextResponse.json({ categories });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase env is missing. Add the project URL and anon key in Vercel." }, { status: 503 });
  const input = categorySchema.parse(await request.json());
  const now = new Date().toISOString();
  const category: Category = {
    id: input.id || slugify(input.name) || crypto.randomUUID(),
    name: input.name,
    color: input.color,
    icon: input.icon,
    isDefault: false,
    isFavorite: input.isFavorite,
    createdAt: now,
    updatedAt: now
  };
  return NextResponse.json({ category: await upsertCategory(category) });
}

export async function DELETE(request: Request) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase env is missing. Add the project URL and anon key in Vercel." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing category id." }, { status: 400 });
  await deleteCategory(id);
  return NextResponse.json({ ok: true });
}
