# Cat Expense Tracker

A production-ready mobile-first Next.js PWA for quickly tracking personal cat expenses with Supabase-backed persistence, analytics, reports, calendar views, import/export, dark mode, and offline app-shell support. It is intentionally no-login and uses a personal open Supabase anon setup.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Zustand, Recharts, React Hook Form, Zod, Supabase, Vitest, and PWA support.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

Run the SQL in `supabase/schema.sql`, fill `.env.local`, then open `http://localhost:3000/add`.

Detailed deployment instructions are in `docs/SETUP.md`.
