import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createProject, createProjectInvite, isDatabaseConfigured, listPendingInvites, listProjectMembers, listProjects, removeProjectMember, respondToProjectInvite, sessionToUser, upsertUser } from "@/services/database-server";

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

const inviteResponseSchema = z.object({
  inviteId: z.string().min(1),
  accept: z.boolean()
});

const removeMemberSchema = z.object({
  projectId: z.string().min(1),
  memberUserId: z.string().min(1)
});

async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Sign in with Google to continue.");
  const user = sessionToUser(session.user);
  await upsertUser(user);
  return user;
}

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ projects: [], warning: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." });
  try {
    const user = await currentUser();
    const selectedProjectId = new URL(request.url).searchParams.get("projectId");
    const [projects, invites] = await Promise.all([listProjects(user.id), listPendingInvites(user.id)]);
    const activeProjectId = selectedProjectId && projects.some((project) => project.id === selectedProjectId) ? selectedProjectId : projects[0]?.id;
    const members = activeProjectId ? await listProjectMembers(activeProjectId, user.id) : [];
    return NextResponse.json({ projects, invites, members, user });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const params = new URL(request.url).searchParams;
    const input = removeMemberSchema.parse({ projectId: params.get("projectId"), memberUserId: params.get("memberUserId") });
    await removeProjectMember(input.projectId, input.memberUserId, user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database is missing. Add Vercel Postgres or Neon storage to this Vercel project." }, { status: 503 });
  try {
    const user = await currentUser();
    const body = await request.json();
    if (body.inviteId) {
      const input = inviteResponseSchema.parse(body);
      await respondToProjectInvite(input.inviteId, input.accept, user.id);
      return NextResponse.json({ ok: true });
    }
    if (body.email) {
      const input = memberSchema.parse(body);
      await createProjectInvite(input.projectId, input.email, input.role, user.id);
      return NextResponse.json({ ok: true });
    }
    const input = projectSchema.parse(body);
    return NextResponse.json({ project: await createProject(input, user.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Request failed" }, { status: 400 });
  }
}
