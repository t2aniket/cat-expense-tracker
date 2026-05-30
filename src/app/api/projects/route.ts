import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { addProjectMember, createProject, isDatabaseConfigured, listProjects, sessionToUser, upsertUser } from "@/services/database-server";

const projectSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(200).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  icon: z.string().max(40).optional()
});

const memberSchema = z.object({
  projectId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member")
});

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in with Google to continue.");
  const user = sessionToUser(session.user);
  await upsertUser(user);
  return user;
}

export async function GET() {
  if (!isDatabaseConfigured()) return NextResponse.json({ projects: [], warning: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." });
  try {
    const user = await currentUser();
    return NextResponse.json({ projects: await listProjects(user.id), user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const body = await request.json();
    if (body.email) {
      const input = memberSchema.parse(body);
      await addProjectMember(input.projectId, input.email, input.role, user.id);
      return NextResponse.json({ ok: true });
    }
    const input = projectSchema.parse(body);
    return NextResponse.json({ project: await createProject(input, user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}
