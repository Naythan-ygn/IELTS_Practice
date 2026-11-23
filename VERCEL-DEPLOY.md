# Deploy IELTS Sprint 30 on Vercel

The original local SQLite database cannot be written or shared by Vercel Functions. This version uses Turso for persistent login sessions, progress, Tutor conversations and small speaking recordings when `TURSO_DATABASE_URL` is configured. Local development keeps using SQLite when that variable is unset.

## Setup

1. Deploy the updated source, including `package-lock.json`, `lib/` and `db/migrations/`. If your repository contains this project inside a folder, set Vercel's **Root Directory** to `ielts-sprint-30`.
2. In your Vercel project, open **Storage → Create Database** and choose [Turso from the Marketplace](https://vercel.com/marketplace/tursocloud/database). Create a database and connect it to this project. Check any pricing before confirming a provider plan.
3. Confirm these server-side environment variables are available for **Production** (and Preview if needed):

   ```dotenv
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-database-token
   ```

   The Marketplace connection can add these automatically. Use these exact names, with no `NEXT_PUBLIC_` prefix. Do not set `DATA_DIR=/tmp`: temporary files cannot hold durable sessions or progress.

4. Use **Node.js 24.x**, as required by `package.json`.
5. Optional login overrides are `LOGIN_USERNAME` and `LOGIN_PASSWORD`. When unset, the login remains **TTH / 9834**. Vercel login cookies are automatically Secure and HttpOnly.
6. For the AI Tutor, also configure `AI_PROVIDER=openrouter`, `OPENROUTER_API_KEY` and optionally `OPENROUTER_MODEL`. Database and login work without an AI key.
7. **Redeploy after connecting the database or changing environment variables.** The first database request automatically applies the versioned migrations. No SQL needs to be pasted into a console.

Open the deployment and sign in. Sign out from Settings, then sign in again to check that saved progress remains. A missing database connection now produces a configuration error instead of the previous generic sign-in error.

## Existing local history

Your local `data/` folder is untouched. An empty Turso database starts a new cloud profile; it does not automatically upload the local database or recordings. Keep a backup before transferring existing history. Never commit the SQLite database, session key or `.env.local` to your repository.

## Recordings

In cloud mode, audio is stored as small chunks in the database, linked to the private recording record and deleted with the user's data. Cloud recordings are capped at **4 MB** to stay within the default Vercel function request limit; local recordings retain the 20 MB limit. Record a shorter answer if it exceeds the cloud limit. Recording playback still requires a valid login and an ownership check.

## Troubleshooting

- **Incorrect user name or password:** check optional `LOGIN_USERNAME` / `LOGIN_PASSWORD` overrides in Vercel. Redeploy if changed.
- **Database is not configured:** connect Turso and confirm both variables exist in the environment used by this deployment, then redeploy.
- **Sign-in service is unavailable:** check Vercel runtime logs and the database connection/token. The app logs the error class/code without printing credentials or connection strings. Check that migration files were included in the deployment.
- **Login works but immediately disappears:** verify all routes in the deployment use the same Turso database and a valid token. Do not rely on local SQLite files or `/tmp`.

References: [Vercel function runtimes](https://vercel.com/docs/functions/runtimes), [payload limits](https://vercel.com/docs/errors/function_payload_too_large), [Vercel Turso integration](https://vercel.com/marketplace/tursocloud/database).
