# Cat Expense Tracker Setup

## Environment Variables

Create `.env.local` locally and add the same values in Vercel:

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-server-only-service-role-key"
CAT_APP_INSTANCE_ID="personal-cat-expenses"
NEXT_PUBLIC_APP_NAME="Cat Expense Tracker"
```

Use Node 22 on Vercel. The Supabase service role key is used only inside Next.js route handlers and is never shipped to the browser.

## Supabase

1. Create a free Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy Project URL into `SUPABASE_URL`.
5. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.

RLS is enabled and direct anonymous table access is denied. The app writes through server routes.

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
