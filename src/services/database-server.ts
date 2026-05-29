import "server-only";
import postgres from "postgres";
import { DEFAULT_CATEGORIES } from "@/constants/categories";
import type { Category, Expense, UserPreferences } from "@/types/domain";

type ExpenseRow = {
  id: string;
  amount: string | number;
  category: string;
  expense_date: string | Date;
  expense_time: string;
  notes: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type CategoryRow = {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_default: boolean;
  is_favorite: boolean;
  created_at: string | Date;
  updated_at: string | Date;
};

type PreferenceRow = {
  settings: UserPreferences;
};

const appInstanceId = process.env.CAT_APP_INSTANCE_ID || "personal-cat-expenses";
const databaseUrl = process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
let sqlClient: postgres.Sql | null = null;
let setupPromise: Promise<void> | null = null;

function sql() {
  if (!databaseUrl) {
    throw new Error("Database is not configured. Add Vercel Postgres or Neon to this Vercel project.");
  }
  sqlClient ??= postgres(databaseUrl, {
    max: 3,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ssl: "require"
  });
  return sqlClient;
}

export function isDatabaseConfigured() {
  return Boolean(databaseUrl);
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
    amount: Number(row.amount),
    category: row.category,
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
    name: row.name,
    color: row.color,
    icon: row.icon,
    isDefault: row.is_default,
    isFavorite: row.is_favorite,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  };
}

async function ensureSchema() {
  const db = sql();
  await db`
    create table if not exists expenses (
      id uuid primary key,
      app_instance_id text not null,
      amount numeric(12,2) not null check (amount > 0),
      category text not null,
      expense_date date not null,
      expense_time time not null,
      notes text default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;
  await db`
    create table if not exists categories (
      id text primary key,
      app_instance_id text not null,
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
  await db`create index if not exists expenses_instance_date_idx on expenses(app_instance_id, expense_date desc, expense_time desc)`;
  await db`create index if not exists expenses_instance_category_idx on expenses(app_instance_id, category)`;
  await db`create index if not exists categories_instance_name_idx on categories(app_instance_id, name)`;
}

async function ready() {
  setupPromise ??= ensureSchema();
  await setupPromise;
}

export async function listExpenses() {
  await ready();
  const rows = await sql()<ExpenseRow[]>`
    select id, amount, category, expense_date, expense_time, notes, created_at, updated_at
    from expenses
    where app_instance_id = ${appInstanceId}
    order by expense_date desc, expense_time desc
  `;
  return rows.map(mapExpense);
}

export async function upsertExpense(expense: Omit<Expense, "createdAt" | "updatedAt"> & Partial<Pick<Expense, "createdAt" | "updatedAt">>) {
  await ready();
  const now = new Date().toISOString();
  const rows = await sql()<ExpenseRow[]>`
    insert into expenses (id, app_instance_id, amount, category, expense_date, expense_time, notes, created_at, updated_at)
    values (${expense.id}, ${appInstanceId}, ${expense.amount}, ${expense.category}, ${expense.date}, ${expense.time}, ${expense.notes}, ${expense.createdAt || now}, ${now})
    on conflict (id) do update set
      amount = excluded.amount,
      category = excluded.category,
      expense_date = excluded.expense_date,
      expense_time = excluded.expense_time,
      notes = excluded.notes,
      updated_at = excluded.updated_at
    returning id, amount, category, expense_date, expense_time, notes, created_at, updated_at
  `;
  return mapExpense(rows[0]);
}

export async function deleteExpense(id: string) {
  await ready();
  await sql()`delete from expenses where id = ${id} and app_instance_id = ${appInstanceId}`;
}

export async function listCategories() {
  await ready();
  const rows = await sql()<CategoryRow[]>`
    select id, name, color, icon, is_default, is_favorite, created_at, updated_at
    from categories
    where app_instance_id = ${appInstanceId}
    order by name
  `;
  if (rows.length) return rows.map(mapCategory);
  const now = new Date().toISOString();
  await sql().begin((transaction) =>
    DEFAULT_CATEGORIES.map((category) => transaction`
      insert into categories (id, app_instance_id, name, color, icon, is_default, is_favorite, created_at, updated_at)
      values (${category.id}, ${appInstanceId}, ${category.name}, ${category.color}, ${category.icon}, true, ${category.isFavorite}, ${now}, ${now})
      on conflict (id) do nothing
    `)
  );
  return DEFAULT_CATEGORIES;
}

export async function upsertCategory(category: Category) {
  await ready();
  const rows = await sql()<CategoryRow[]>`
    insert into categories (id, app_instance_id, name, color, icon, is_default, is_favorite, created_at, updated_at)
    values (${category.id}, ${appInstanceId}, ${category.name}, ${category.color}, ${category.icon}, ${category.isDefault}, ${category.isFavorite}, ${category.createdAt}, ${new Date().toISOString()})
    on conflict (id) do update set
      name = excluded.name,
      color = excluded.color,
      icon = excluded.icon,
      is_favorite = excluded.is_favorite,
      updated_at = excluded.updated_at
    returning id, name, color, icon, is_default, is_favorite, created_at, updated_at
  `;
  return mapCategory(rows[0]);
}

export async function deleteCategory(id: string) {
  await ready();
  await sql()`delete from categories where id = ${id} and app_instance_id = ${appInstanceId} and is_default = false`;
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
