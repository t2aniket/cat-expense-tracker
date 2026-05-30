import "server-only";
import postgres from "postgres";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { AppUser, Category, Expense, Project, ProjectInvite, ProjectMember, UserPreferences } from "@/types/domain";

type ExpenseRow = {
  id: string;
  project_id: string;
  amount: string | number;
  category: string;
  paid_by_user_id: string | null;
  paid_by_name: string | null;
  expense_date: string | Date;
  expense_time: string;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type CategoryRow = {
  id: string;
  project_id: string | null;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_favorite: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  role: Project["role"];
  member_count: string | number;
  created_at: string | Date;
  updated_at: string | Date;
};

type InviteRow = {
  id: string;
  project_id: string;
  project_name: string;
  email: string;
  role: Project["role"];
  status: ProjectInvite["status"];
  invited_by_name: string;
  created_at: string | Date;
};

type MemberRow = {
  project_id: string;
  user_id: string;
  name: string;
  email: string;
  image: string;
  role: Project["role"];
  joined_at: string | Date;
};

type PreferenceRow = {
  settings: UserPreferences;
};

const appInstanceId = process.env.CAT_APP_INSTANCE_ID || "personal-cat-expenses";
const defaultProjectId = `${appInstanceId}-cat`;
const databaseUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
let sqlClient: postgres.Sql | null = null;
let setupPromise: Promise<void> | null = null;

function sql() {
  if (!databaseUrl) throw new Error("Database is not configured. Add Vercel Postgres or Neon to this Vercel project.");
  sqlClient ??= postgres(databaseUrl, { max: 3, idle_timeout: 20, connect_timeout: 10, prepare: false, ssl: "require" });
  return sqlClient;
}

export function isDatabaseConfigured() {
  return Boolean(databaseUrl);
}

export function defaultProject() {
  return defaultProjectId;
}

function iso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function dateOnly(value: string | Date) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value.slice(0, 10);
}

function timeOnly(value: string) {
  return value.slice(0, 5);
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    projectId: row.project_id,
    amount: Number(row.amount),
    category: row.category,
    paidByUserId: row.paid_by_user_id || "",
    paidByName: row.paid_by_name || "Unknown",
    date: dateOnly(row.expense_date),
    time: timeOnly(row.expense_time),
    notes: row.notes || "",
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    projectId: row.project_id || undefined,
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default,
    isFavorite: row.is_favorite,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description || "",
    color: row.color,
    icon: row.icon,
    role: row.role,
    memberCount: Number(row.member_count || 0),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

function mapInvite(row: InviteRow): ProjectInvite {
  return {
    id: row.id,
    projectId: row.project_id,
    projectName: row.project_name,
    email: row.email,
    role: row.role,
    status: row.status,
    invitedByName: row.invited_by_name,
    createdAt: iso(row.created_at)
  };
}

function mapMember(row: MemberRow): ProjectMember {
  return {
    projectId: row.project_id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    image: row.image,
    role: row.role,
    joinedAt: iso(row.joined_at)
  };
}

async function ensureSchema() {
  const db = sql();
  await db`
    create table if not exists app_users (
      id text primary key,
      email text not null unique,
      name text not null,
      image text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists projects (
      id text primary key,
      app_instance_id text not null,
      name text not null,
      description text default '',
      color text not null default '#0f766e',
      icon text not null default 'Wallet',
      created_by_user_id text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists project_members (
      project_id text not null references projects(id) on delete cascade,
      user_id text not null references app_users(id) on delete cascade,
      role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
      joined_at timestamptz not null default now(),
      primary key (project_id, user_id)
    )
  `;
  await db`
    create table if not exists project_invites (
      id uuid primary key,
      project_id text not null references projects(id) on delete cascade,
      email text not null,
      role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
      status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
      invited_by_user_id text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique(project_id, email)
    )
  `;
  await db`
    create table if not exists expenses (
      id uuid primary key,
      app_instance_id text not null,
      project_id text,
      amount numeric(12,2) not null check (amount > 0),
      category text not null,
      paid_by_user_id text,
      expense_date date not null,
      expense_time time not null,
      notes text default '',
      created_by_user_id text,
      updated_by_user_id text,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists categories (
      id text primary key,
      app_instance_id text not null,
      project_id text,
      name text not null,
      color text not null,
      icon text not null default 'Tag',
      is_default boolean not null default false,
      is_favorite boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists preferences (
      app_instance_id text primary key,
      settings jsonb not null default '{}',
      updated_at timestamptz not null default now()
    )
  `;
  await db`alter table expenses add column if not exists project_id text`;
  await db`alter table expenses add column if not exists paid_by_user_id text`;
  await db`alter table expenses add column if not exists created_by_user_id text`;
  await db`alter table expenses add column if not exists updated_by_user_id text`;
  await db`alter table categories add column if not exists project_id text`;
  await db`
    insert into projects (id, app_instance_id, name, description, color, icon)
    values (${defaultProjectId}, ${appInstanceId}, 'Cat Expense Tracker', 'Original cat spending project', '#0f766e', 'Cat')
    on conflict (id) do nothing
  `;
  await db`update expenses set project_id = ${defaultProjectId} where app_instance_id = ${appInstanceId} and project_id is null`;
  await db`update categories set project_id = ${defaultProjectId} where app_instance_id = ${appInstanceId} and project_id is null`;
  await db`create index if not exists expenses_project_date_idx on expenses(project_id, expense_date desc, expense_time desc)`;
  await db`create index if not exists expenses_project_category_idx on expenses(project_id, category)`;
  await db`create index if not exists categories_project_name_idx on categories(project_id, name)`;
  await db`create index if not exists project_members_user_idx on project_members(user_id)`;
  await db`create index if not exists project_invites_email_idx on project_invites(email, status)`;
  await db`
    delete from project_members
    where project_id = ${defaultProjectId}
      and role = 'viewer'
      and not exists (
        select 1 from project_invites
        where project_invites.project_id = project_members.project_id
          and project_invites.email = project_members.user_id
          and project_invites.status = 'accepted'
      )
  `;
}

async function ready() {
  setupPromise ??= ensureSchema();
  await setupPromise;
}

function userIdFromEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function upsertUser(user: AppUser) {
  await ready();
  await sql()`
    insert into app_users (id, email, name, image, updated_at)
    values (${user.id}, ${user.email.toLowerCase()}, ${user.name}, ${user.image}, ${new Date().toISOString()})
    on conflict (id) do update set email = excluded.email, name = excluded.name, image = excluded.image, updated_at = excluded.updated_at
  `;
  await ensureDefaultOwner(user.id);
}

export function sessionToUser(sessionUser: { email?: string | null; name?: string | null; image?: string | null }): AppUser {
  if (!sessionUser.email) throw new Error("Sign in with Google to continue.");
  return {
    id: userIdFromEmail(sessionUser.email),
    email: sessionUser.email.toLowerCase(),
    name: sessionUser.name || sessionUser.email,
    image: sessionUser.image || ""
  };
}

async function ensureDefaultOwner(userId: string) {
  const existing = await sql()<[{ count: string }]>`select count(*)::text from project_members where project_id = ${defaultProjectId}`;
  if (Number(existing[0]?.count || 0) === 0) {
    await sql()`
      insert into project_members (project_id, user_id, role)
      values (${defaultProjectId}, ${userId}, 'owner')
      on conflict (project_id, user_id) do nothing
    `;
  }
}

async function assertProjectAccess(projectId: string, userId: string, write = false) {
  await ready();
  const rows = await sql()<[{ role: Project["role"] }]>`
    select role from project_members where project_id = ${projectId} and user_id = ${userId}
  `;
  const role = rows[0]?.role;
  if (!role) throw new Error("You do not have access to this project.");
  if (write && role === "viewer") throw new Error("You only have view access to this project.");
  return role;
}

export async function listProjects(userId: string) {
  await ready();
  const rows = await sql()<ProjectRow[]>`
    select p.id, p.name, p.description, p.color, p.icon, pm.role, count(all_members.user_id)::text as member_count, p.created_at, p.updated_at
    from projects p
    join project_members pm on pm.project_id = p.id
    left join project_members all_members on all_members.project_id = p.id
    where p.app_instance_id = ${appInstanceId} and pm.user_id = ${userId}
    group by p.id, p.name, p.description, p.color, p.icon, pm.role, p.created_at, p.updated_at
    order by p.created_at asc
  `;
  return rows.map(mapProject);
}

export async function createProject(input: { name: string; description?: string; color?: string; icon?: string }, userId: string) {
  await ready();
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const rows = await sql()<ProjectRow[]>`
    insert into projects (id, app_instance_id, name, description, color, icon, created_by_user_id, created_at, updated_at)
    values (${id}, ${appInstanceId}, ${input.name}, ${input.description || ''}, ${input.color || '#0f766e'}, ${input.icon || 'Wallet'}, ${userId}, ${now}, ${now})
    returning id, name, description, color, icon, 'owner'::text as role, 1::text as member_count, created_at, updated_at
  `;
  await sql()`insert into project_members (project_id, user_id, role) values (${id}, ${userId}, 'owner')`;
  await seedDefaultCategories(id);
  return mapProject(rows[0]);
}

export async function createProjectInvite(projectId: string, email: string, role: Project["role"], actorUserId: string) {
  const actorRole = await assertProjectAccess(projectId, actorUserId, true);
  if (!["owner", "admin"].includes(actorRole)) throw new Error("Only owners and admins can add members.");
  const normalized = userIdFromEmail(email);
  await sql()`
    insert into project_invites (id, project_id, email, role, status, invited_by_user_id, updated_at)
    values (${crypto.randomUUID()}, ${projectId}, ${normalized}, ${role}, 'pending', ${actorUserId}, ${new Date().toISOString()})
    on conflict (project_id, email) do update set role = excluded.role, status = 'pending', invited_by_user_id = excluded.invited_by_user_id, updated_at = excluded.updated_at
  `;
}

export async function listPendingInvites(userId: string) {
  await ready();
  const rows = await sql()<InviteRow[]>`
    select i.id, i.project_id, p.name as project_name, i.email, i.role, i.status, coalesce(u.name, i.invited_by_user_id) as invited_by_name, i.created_at
    from project_invites i
    join projects p on p.id = i.project_id
    left join app_users u on u.id = i.invited_by_user_id
    where i.email = ${userId} and i.status = 'pending'
    order by i.created_at desc
  `;
  return rows.map(mapInvite);
}

export async function listProjectMembers(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);
  const rows = await sql()<MemberRow[]>`
    select pm.project_id, pm.user_id, u.name, u.email, u.image, pm.role, pm.joined_at
    from project_members pm
    join app_users u on u.id = pm.user_id
    where pm.project_id = ${projectId}
    order by case pm.role when 'owner' then 1 when 'admin' then 2 when 'member' then 3 else 4 end, u.name
  `;
  return rows.map(mapMember);
}

export async function removeProjectMember(projectId: string, memberUserId: string, actorUserId: string) {
  const actorRole = await assertProjectAccess(projectId, actorUserId, true);
  if (!["owner", "admin"].includes(actorRole)) throw new Error("Only owners and admins can remove members.");
  if (memberUserId === actorUserId) throw new Error("You cannot remove yourself from the project here.");
  const rows = await sql()<[{ role: Project["role"] }]>`select role from project_members where project_id = ${projectId} and user_id = ${memberUserId}`;
  const targetRole = rows[0]?.role;
  if (!targetRole) return;
  if (targetRole === "owner" && actorRole !== "owner") throw new Error("Only owners can remove another owner.");
  await sql()`delete from project_members where project_id = ${projectId} and user_id = ${memberUserId}`;
}

export async function respondToProjectInvite(inviteId: string, accept: boolean, userId: string) {
  await ready();
  const rows = await sql()<[{ project_id: string; role: Project["role"]; email: string; status: string }]>`
    select project_id, role, email, status from project_invites where id = ${inviteId}
  `;
  const invite = rows[0];
  if (!invite || invite.email !== userId || invite.status !== "pending") throw new Error("Invite is not available.");
  if (accept) {
    await sql()`insert into project_members (project_id, user_id, role) values (${invite.project_id}, ${userId}, ${invite.role}) on conflict (project_id, user_id) do update set role = excluded.role`;
    await sql()`update project_invites set status = 'accepted', updated_at = ${new Date().toISOString()} where id = ${inviteId}`;
  } else {
    await sql()`update project_invites set status = 'declined', updated_at = ${new Date().toISOString()} where id = ${inviteId}`;
  }
}

export async function listExpenses(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);
  const rows = await sql()<ExpenseRow[]>`
    select e.id, e.project_id, e.amount, e.category, e.paid_by_user_id, coalesce(u.name, e.paid_by_user_id, 'Unknown') as paid_by_name,
      e.expense_date, e.expense_time, e.notes, e.created_at, e.updated_at
    from expenses e
    left join app_users u on u.id = e.paid_by_user_id
    where e.app_instance_id = ${appInstanceId} and e.project_id = ${projectId}
    order by e.expense_date desc, e.expense_time desc
  `;
  return rows.map(mapExpense);
}

export async function upsertExpense(expense: Omit<Expense, "createdAt" | "updatedAt" | "paidByName"> & Partial<Pick<Expense, "createdAt" | "updatedAt" | "paidByName">>, userId: string) {
  if (!expense.projectId) throw new Error("Missing project id.");
  await assertProjectAccess(expense.projectId, userId, true);
  const now = new Date().toISOString();
  const paidBy = expense.paidByUserId || userId;
  const rows = await sql()<ExpenseRow[]>`
    insert into expenses (id, app_instance_id, project_id, amount, category, paid_by_user_id, expense_date, expense_time, notes, created_by_user_id, updated_by_user_id, created_at, updated_at)
    values (${expense.id}, ${appInstanceId}, ${expense.projectId}, ${expense.amount}, ${expense.category}, ${paidBy}, ${expense.date}, ${expense.time}, ${expense.notes}, ${userId}, ${userId}, ${expense.createdAt || now}, ${now})
    on conflict (id) do update set
      amount = excluded.amount,
      category = excluded.category,
      paid_by_user_id = excluded.paid_by_user_id,
      expense_date = excluded.expense_date,
      expense_time = excluded.expense_time,
      notes = excluded.notes,
      updated_by_user_id = excluded.updated_by_user_id,
      updated_at = excluded.updated_at
    returning id, project_id, amount, category, paid_by_user_id, ${expense.paidByName || paidBy}::text as paid_by_name, expense_date, expense_time, notes, created_at, updated_at
  `;
  return mapExpense(rows[0]);
}

export async function deleteExpense(id: string, projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId, true);
  await sql()`delete from expenses where id = ${id} and app_instance_id = ${appInstanceId} and project_id = ${projectId}`;
}

async function seedDefaultCategories(projectId: string) {
  const now = new Date().toISOString();
  await sql().begin((transaction) =>
    DEFAULT_CATEGORIES.map((category) => transaction`
      insert into categories (id, app_instance_id, project_id, name, color, icon, is_default, is_favorite, created_at, updated_at)
      values (${`${projectId}-${category.id}`}, ${appInstanceId}, ${projectId}, ${category.name}, ${category.color}, ${category.icon}, true, ${category.isFavorite}, ${now}, ${now})
      on conflict (id) do nothing
    `)
  );
}

export async function listCategories(projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId);
  const rows = await sql()<CategoryRow[]>`
    select id, project_id, name, color, icon, is_default, is_favorite, created_at, updated_at
    from categories
    where app_instance_id = ${appInstanceId} and project_id = ${projectId}
    order by name
  `;
  if (rows.length) return rows.map(mapCategory);
  await seedDefaultCategories(projectId);
  return listCategories(projectId, userId);
}

export async function upsertCategory(category: Category, projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId, true);
  const rows = await sql()<CategoryRow[]>`
    insert into categories (id, app_instance_id, project_id, name, color, icon, is_default, is_favorite, created_at, updated_at)
    values (${category.id}, ${appInstanceId}, ${projectId}, ${category.name}, ${category.color}, ${category.icon}, ${category.isDefault}, ${category.isFavorite}, ${category.createdAt}, ${new Date().toISOString()})
    on conflict (id) do update set
      name = excluded.name,
      color = excluded.color,
      icon = excluded.icon,
      is_favorite = excluded.is_favorite,
      updated_at = excluded.updated_at
    returning id, project_id, name, color, icon, is_default, is_favorite, created_at, updated_at
  `;
  return mapCategory(rows[0]);
}

export async function deleteCategory(id: string, projectId: string, userId: string) {
  await assertProjectAccess(projectId, userId, true);
  await sql()`delete from categories where id = ${id} and app_instance_id = ${appInstanceId} and project_id = ${projectId} and is_default = false`;
}

export async function getPreferences(): Promise<UserPreferences | null> {
  await ready();
  const rows = await sql()<PreferenceRow[]>`select settings from preferences where app_instance_id = ${appInstanceId}`;
  return rows[0]?.settings || null;
}

export async function savePreferences(settings: UserPreferences) {
  await ready();
  await sql()`
    insert into preferences (app_instance_id, settings, updated_at)
    values (${appInstanceId}, ${sql().json(settings)}, ${new Date().toISOString()})
    on conflict (app_instance_id) do update set settings = excluded.settings, updated_at = excluded.updated_at
  `;
}
