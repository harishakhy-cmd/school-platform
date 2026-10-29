# Vercel Edition Deployment

The deployment entry point is in [apps/vercel-edition](../apps/vercel-edition/).
The Vercel project root must be the repository root so the function can import
the shared Express app and its existing routes/models. This edition is
independent of Firebase but is an incremental adapter, not yet validated for
full feature parity.

Provision an independent MySQL database and Vercel Blob store, configure the
server-side variables in the edition's `.env.example`, apply the existing
schema and reviewed migrations, then use:

```powershell
npm install
npm run dev:vercel
npm run test:vercel
npm run build:vercel
npm run deploy:vercel
```

See the [edition README](../apps/vercel-edition/README.md) for known runtime
gaps and deployment prerequisites. No cloud deployment has been run.
