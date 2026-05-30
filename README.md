# Cat Expense Tracker

A production-ready mobile-first Next.js PWA for tracking project-based shared expenses with Google login, Vercel/Neon Postgres persistence, analytics, reports, calendar views, import/export, dark mode, and offline app-shell support. Existing cat expenses migrate into a default Cat Expense Tracker project.

## Stack

Next.js App Router, TypeScript, Tailwind CSS, Zustand, Recharts, React Hook Form, Zod, NextAuth Google login, Postgres, Vitest, and PWA support.

## Quick Start

```bash
npm install
cp .env.example .env.local
npm run dev
```

For deployment, connect Vercel Postgres/Neon storage to the Vercel project, then open `http://localhost:3000/add` locally or your Vercel URL in production.

Detailed deployment instructions are in `docs/SETUP.md`.
