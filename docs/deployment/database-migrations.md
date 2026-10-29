# Database and Data Migrations

## Current state

The existing backend uses MySQL. `schema.sql` defines core relational
structures, and `scripts/` contains additional imperative migration scripts.
There is not yet a unified versioned SQL migration system, PostgreSQL
deployment schema, Firestore data mapping, or production import/export tool.

## Safe current operation

Use the existing project scripts only against the intended database. Follow
the migration sequence in [DEPLOYMENT.md](../DEPLOYMENT.md), take a verified
backup before changing any non-disposable database, and inspect each script
before execution. Do not run these commands against production as part of
cloud deployment setup without a reviewed rollout/rollback plan.

## Required dual-provider work

1. Inventory columns, constraints, relationships, indexes, status values, and
   ownership rules from schemas, models, and route authorization.
2. Define stable IDs and provider-neutral export formats without dropping
   existing identifiers.
3. Add versioned relational migrations for the Vercel-selected database and
   map Firestore documents/queries/indexes separately.
4. Build dry-run import/export scripts with counts, validation, resumability,
   and redacted logs; never auto-copy production student data to development.
5. Test backups/restores and account/session transition plans.
6. Obtain explicit review/approval before destructive migrations or cutover.

No database migration command for Firebase or Vercel is documented yet because
the adapters and their schemas do not exist.
