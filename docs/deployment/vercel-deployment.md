# Vercel Edition Deployment

## Status

An initial Vercel Node.js Function adapter is present under
[`apps/vercel-edition`](../../apps/vercel-edition/). It runs the existing
Express route application and uses the existing MySQL-backed session/auth
model, plus Vercel Blob for profile photos. This is independent of Firebase,
but **is not yet a full feature-parity or production-validated Vercel edition**.

The Vercel project root must be this repository root because the adapter
imports the shared app, models, static assets, views, and routes. The root
[`vercel.json`](../../vercel.json) rewrites requests to the adapter. The
function does not initialize Socket.IO.

## Provision services

1. Create a Vercel project with the repository root as its project root.
2. Select Node.js 20 or newer in Vercel project settings (the Blob SDK runtime
   requires it).
3. Provision a dedicated remote MySQL database. Do not reuse the development
   or another deployment's production database unless explicitly intended.
4. Create a Vercel Blob store for profile photos.
5. Configure these server-side environment variables:
   `SESSION_SECRET`, `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`,
   `BLOB_READ_WRITE_TOKEN`, `APP_URL`, and `APP_DEPLOYMENT_TARGET=vercel`.
   Set `TRUST_PROXY=true` for Vercel's HTTPS proxy.
6. Generate and set a unique session secret. Never put secrets in frontend
   variables or commit them.
7. Back up the target MySQL database, then apply `schema.sql` and the existing
   reviewed migration scripts. The schema includes the persistent `sessions`
   table. Do not run these scripts against another production environment
   without approval.

Optional email and LiveKit settings are listed in
[`apps/vercel-edition/.env.example`](../../apps/vercel-edition/.env.example).

## Local and build commands

Run from the repository root:

```powershell
npm install
npm run dev:vercel
npm run test:vercel
npm run build:vercel
```

`dev:vercel` and `build:vercel` use Vercel CLI 65.8.0 through `npx`. Link a
Vercel project first (`npx --yes vercel@65.8.0 link`) and configure local
environment values before expecting the Vercel build command to proceed.
Unit tests do not require cloud credentials. Full API testing requires an
isolated MySQL database; the Blob path requires a valid Blob token.

## Deployment

After linking the project, setting production environment values, testing,
and applying approved database migrations:

```powershell
npm run deploy:vercel
```

No Vercel account was linked and no deployment was performed during this work.
The attempted build stopped because there was no local Vercel project settings
file; this is a project-link prerequisite, not a successful build.

## Known gaps

- Socket.IO realtime is not started in the serverless function. LiveKit token
  APIs do not by themselves provide the existing classroom chat/whiteboard
  realtime behavior.
- The computer-science execution sandbox and any local filesystem consumers
  have not been validated in Vercel's serverless runtime and may need a
  separate execution service.
- Existing in-memory rate limiting is not distributed across function
  instances.
- Some existing imperative migrations need to be reviewed and tested on the
  provisioned MySQL service; no unified versioned migration runner exists.
- Firebase Authentication, Firestore, Cloud Functions, Storage rules, and a
  Firebase deployment have not been implemented.
