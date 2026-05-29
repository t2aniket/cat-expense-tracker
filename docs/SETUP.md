# Cat Expense Tracker Setup

## Environment Variables

For Vercel deployment, use Vercel Storage. You do not need Supabase or a manual SQL setup.

Vercel/Neon will automatically add a Postgres connection variable such as `POSTGRES_URL` or `DATABASE_URL`. The app uses either one.

Optional local `.env.local`:

```bash
POSTGRES_URL="postgres://user:password@host/database?sslmode=require"
CAT_APP_INSTANCE_ID="personal-cat-expenses"
NEXT_PUBLIC_APP_NAME="Cat Expense Tracker"
```

Use Node 22 on Vercel. This project is configured for a no-login personal app using server-side Next.js route handlers and Postgres.

## Vercel Database

1. Open the Vercel project.
2. Go to Storage or Marketplace.
3. Create or connect a Postgres database, usually Neon Postgres.
4. Connect it to this project.
5. Redeploy.

The app creates its own tables automatically on first API request.

## GitHub and Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Connect Vercel Postgres/Neon storage.
4. Set Node.js Version to 22.x.
5. Deploy.

## PWA Install

On iPhone: open the deployed URL in Safari, tap Share, then Add to Home Screen.

On Android: open the deployed URL in Chrome and use Install app or Add to Home screen.

The manifest, app icons, standalone display mode, and service worker are included.

## Local Commands

```bash
npm install
npm run dev
npm test
npm run build
```
