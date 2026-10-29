# Dual-Deployment Architecture

## Status

**Incremental Vercel adapter implemented; neither target is production-ready.**
The Vercel edition currently wraps existing Express routes and the MySQL data
model and uses Vercel Blob for profile photos. The Firebase edition does not
yet exist. Full parity, cloud builds, and deployments have not been validated.

## Target

Maintain the existing shared browser application and provider-independent
business logic where practical. Select each deployment's services through
server-side composition, not a client-controlled query parameter:

```text
Firebase Hosting
  -> Firebase-specific API/functions
  -> Firebase Auth + Firestore + Cloud Storage

Vercel frontend
  -> Vercel Node.js Function -> existing Express routes and session auth
  -> separately provisioned MySQL database
  -> Vercel Blob for profile photos
```

Neither backend may call the other backend for normal application operations.
The existing MySQL deployment remains a separate existing deployment until
each new target has passed migration and acceptance tests.

## Shared code boundaries

Candidate shared code should be extracted only when consumers are proven:

- Shared validation and request/response types (provider-neutral).
- Deterministic Chemistry simulation and assessment calculations.
- Provider-neutral use-case interfaces for authentication, records, and
  object storage.
- Browser UI and 3D assets that contain no private credentials or
  administration SDK.

Provider-specific server implementations belong in deployment-specific
composition roots. Existing controllers/models import MySQL directly; the
Vercel adapter intentionally reuses that implementation for its dedicated
MySQL database. They cannot be relabeled as Firestore repositories without
changes.
Do not import Firebase Admin SDKs, database credentials, Vercel secrets, or
server-only modules into browser bundles.

## Authentication and authorization

Each deployment needs its own sign-in/session implementation. Preserve the
student, teacher/tutor, administrator, and super-administrator access rules.
Every backend must derive identity and role from a verified server-side
session/token and enforce record/class ownership on every operation. Do not
trust client-supplied role or owner identifiers. Do not presume accounts or
password hashes can be shared between providers.

## Data and files

The existing MySQL schema and migrations are the source inventory, not a
provider-neutral schema. Before migrating, document entity identifiers,
foreign keys, query patterns, retention, and authorization. Firestore may
require denormalized documents and indexes; a Vercel relational service needs
versioned SQL migrations and connection pooling. Build explicit import/export
tools with stable identifiers and dry-run validation before moving records.

The existing local server continues to use disk for profile photos; the
Vercel adapter stores new photos in Vercel Blob and validates image content.
Other file-storage flows require separate verification. Keep large science
assets static or in the active provider's object store with caching/lazy
loading. The Chemistry simulation remains local and deterministic; persist
runs through the selected backend and validate any graded outcome on the
server.

## Current blockers and rollout gates

1. Validate the Vercel function against linked project settings and remote
   MySQL/Blob services, then address its runtime gaps.
2. Build Firebase API/auth/Firestore/storage operations and strict rules,
   using Firebase emulators and an independently initialized test project.
3. Introduce a versioned, reviewed migration workflow for Vercel's dedicated
   database, without changing production data automatically.
4. Demonstrate core workflow parity and cross-user denial on each target.
5. Validate uploads, sessions, health, rate limits, job/realtime behavior,
   rollback, and scale limits.
6. Only then add production deployment workflows and enable real deployments.

Cloud project IDs, credentials, database provisioning, billing, and domain
ownership are manual prerequisites. Never treat a successful static-site
build as proof of full-stack readiness.
