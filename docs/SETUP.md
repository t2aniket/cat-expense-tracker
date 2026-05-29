# Cat Expense Tracker Setup

## Environment Variables

Create `.env.local` locally and add the same values in Vercel:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"
CAT_APP_INSTANCE_ID="personal-cat-expenses"
NEXT_PUBLIC_APP_NAME="Cat Expense Tracker"
```

Use Node 22 on Vercel. This project is configured for a no-login personal app using Supabase anon access through Next.js route handlers.

## Supabase

1. Create a free Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy Project URL into `SUPABASE_URL`.
5. Copy the anon public key into `SUPABASE_ANON_KEY`.

RLS is enabled with open anon policies because this is a personal no-auth app. Anyone who has the deployed app URL can technically call the same API routes, so keep the URL private if you want it to remain personal.

## GitHub and Vercel

1. Push this repository to GitHub.
2. Import the repository in Vercel.
3. Set the environment variables above.
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
