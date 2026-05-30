# Cat Expense Tracker Setup

## Environment Variables

For Vercel deployment, use Vercel Storage. You do not need Supabase or a manual SQL setup.

Vercel/Neon will automatically add a Postgres connection variable such as `POSTGRES_URL` or `DATABASE_URL`. The app uses either one.

Optional local `.env.local`:

```bash
POSTGRES_URL="postgres://user:password@host/database?sslmode=require"
CAT_APP_INSTANCE_ID="personal-cat-expenses"
NEXT_PUBLIC_APP_NAME="Cat Expense Tracker"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-long-random-secret"
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

Use Node 22 on Vercel. This project is configured for a no-login personal app using server-side Next.js route handlers and Postgres.

## Vercel Database

1. Open the Vercel project.
2. Go to Storage or Marketplace.
3. Create or connect a Postgres database, usually Neon Postgres.
4. Connect it to this project.
5. Redeploy.

The app creates its own tables automatically on first API request.

## Google Login

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs & Services, then OAuth consent screen.
4. Configure the app name and your email.
5. Go to Credentials.
6. Create OAuth Client ID.
7. Choose Web application.
8. Add this Authorized JavaScript origin:

```text
https://cat-expense-tracker.vercel.app
```

9. Add this Authorized redirect URI:

```text
https://cat-expense-tracker.vercel.app/api/auth/callback/google
```

10. Copy the client ID and secret into Vercel:

```bash
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXTAUTH_URL="https://cat-expense-tracker.vercel.app"
NEXTAUTH_SECRET="a-long-random-secret"
CAT_APP_INSTANCE_ID="personal-cat-expenses"
```

The first Google user to open the app becomes owner of the migrated Cat Expense Tracker project. Existing old expenses are kept and moved into that project automatically.

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
