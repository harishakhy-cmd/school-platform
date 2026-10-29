# Current-State Architecture Audit

**Audit date:** 2026-10-29
**Repository:** `CBT`  
**Scope:** Repository configuration, application entry point, database schema,
authentication, file storage, educational modules, deployment files, and
existing tests. No cloud account was accessed and no production data was read.

## Summary

This is a single Node.js application, not a monorepo. It serves static HTML,
CSS, and JavaScript from an Express server, exposes JSON APIs from that same
server, uses MySQL for application persistence, and uses Express sessions for
authentication. It has no current Firebase or Vercel backend adapter and is
not yet ready for either target as a complete independent deployment.

The browser-side Chemistry Lab simulation is already separated into static
JavaScript and does not require a hosting-provider SDK to calculate or render.
Its experiment save/load API and controller are coupled to MySQL and Express
sessions.

## Existing technologies and structure

| Area | Verified current state |
|---|---|
| Runtime/language | Node.js `>=18`, CommonJS JavaScript |
| Server | Express 4, with `app.js` exporting the app and starting HTTP/Socket.IO only when invoked directly |
| Browser UI | Server-served HTML in `views/`; CSS and JavaScript in `public/`; no React, Vue, Angular, Vite, or frontend build tool is declared |
| Package manager | npm; `package-lock.json` is tracked |
| Database | MySQL via `mysql2`; SQL schema in `schema.sql` and imperative Node migration scripts |
| Authentication/session | Student registration-number session and staff/admin session; `express-session` with the current branch's MySQL-backed store adapter |
| Realtime | Socket.IO server initialized alongside Express; LiveKit integration is optional |
| File storage | Local deployment writes profile photos to disk; Vercel target stores new profile photos in Vercel Blob. Other assets are served from `public/` |
| 3D/science | Browser-side scientific viewer and hardware rendering code; Chemistry simulation and workbench are browser JavaScript |
| Tests | Node's built-in test runner for selected unit suites; additional script-based platform tests |
| CI/CD | No tracked GitHub Actions workflow was found |
| Cloud configuration | No Firebase config or rules. This branch adds an initial Vercel function adapter and `vercel.json`; no cloud project has validated them |

Important directories are `controllers/`, `models/`, `routes/`, `middleware/`,
`config/`, `realtime/`, `public/`, `views/`, `scripts/`, `tests/`, and `docs/`.
The codebase does not use a workspace/monorepo package structure.

## Application areas and routes

`app.js` mounts authentication, exam, admin, classroom, LMS, graphing,
geography, physics, biology, computer-science, chemistry, virtual chemistry
lab, and scientific asset routes. Protected HTML routes include the student
portal, exam, classroom, lab pages, scientific viewer, and admin portal.

Student, teacher/tutor, and administrator experiences are served by existing
HTML pages and Express route/controller code. Admin role checks and classroom
ownership/enrollment checks exist in middleware. Existing feature modules
include lessons, materials, assignments, quizzes, exams/results, attendance,
discussions, gradebook, live sessions, notifications, whiteboard, profile
photos, and science labs. The repository's README and route structure are the
source for the feature inventory; no claim is made that every feature has
cloud deployment compatibility.

## Existing schemas, storage, and migration state

`schema.sql` and the model layer describe a MySQL relational application,
including students, admins, exams, questions, attempts/responses, and chemistry
lab runs. Additional application entities are introduced through migration
scripts. Migrations are not organized as a single versioned, provider-neutral
migration history. No Firestore collections/rules, PostgreSQL schema,
cross-provider record importer/exporter, or tested account-linking migration
exists.

Uploaded profile-photo bytes are persisted on the server filesystem. This
works for a persistent host but is not durable across ephemeral serverless
instances or deployments. The configured photo URL is stored in MySQL.

## Authentication and security-relevant observations

- Student login uses a registration number; admin login uses the existing
  admin account flow. Firebase Authentication is not implemented. The
  Vercel adapter reuses this application's session authentication, separate
  from Firebase, rather than adding a new identity provider.
- Authorization is currently based on the server-side session and role
  middleware. A migration must preserve those role distinctions and the
  existing classroom/record ownership checks.
- `utils/sessionSecurity.js` contains production secret validation and secure
  cookie settings, but `app.js` did not use it at the time of this audit. The
  implementation change in this branch wires it into startup.
- The current branch replaces the legacy MySQL session-store package with a
  small adapter using the same updated MySQL pool as application queries.
- The production application requires durable sessions. A memory-backed
  session store is unsuitable for production or serverless deployments.
- The login rate limiter in `routes/adminRoutes.js` is in-memory and per
  process; it is not a distributed limiter.
- `scripts/initDatabase.js` has a default initial admin password for local
  initialization. Production database initialization must explicitly set a
  strong `ADMIN_PASSWORD` and rotate credentials; never use the default.
- Local filesystem uploads, Socket.IO process state, and direct MySQL model
  imports are incompatible with a naive static/serverless redeployment.
- This is a repository architecture audit, not a penetration test. See
  [security review](../security/security-review.md) for known issues and scope.

## Firebase and Vercel dependencies

The original repository contained no Firebase or Vercel integrations. This
branch adds a Vercel Node.js function wrapper and Vercel Blob profile-photo
adapter; these use the existing Express session authentication and a dedicated
MySQL deployment. No Firebase SDK, backend, Firestore rules, emulator, or
deployment workflow has been added. Neither target has cloud credentials or
been deployed.

## Deployment limitations

1. `app.js` now exports the Express app for a Vercel function; Socket.IO is
   initialized only when running the app directly and is therefore absent in
   the serverless deployment.
2. Controllers/models import the MySQL pool directly, so changing a frontend
   deployment does not change the backend's database.
3. There are no Firestore/Cloud Storage repositories or Firebase auth rules.
4. Vercel has a function adapter and Blob profile-photo storage, but no
   versioned migration runner, linked project build, deployment, or complete
   feature-parity verification.
5. Other application file storage remains separately unverified; profile-photo
   storage alone does not migrate existing local files.
6. No Firebase emulator, CI pipeline, or cloud deployment validation exists.
7. Socket.IO and LiveKit behavior requires separate design and deployment
   validation; it cannot be assumed to work unchanged in serverless functions.
8. The package has no frontend build, lint, or type-check scripts.

## Test baseline

On 2026-10-29, the following command was run:

```text
node --test tests/chemistry-simulation.test.js tests/chemistry-lab-controller.test.js tests/scientific-assets.test.js tests/auth-session.test.js
```

Result: **32 passed, 1 failed**. The pre-existing `auth-session.test.js` test
called the now-async `/api/auth/me` controller synchronously and did not stub
its database lookup. That test was updated alongside the session/deployment
foundation work; subsequent results are reported separately and are not
retroactively represented as this baseline.

## Data migration risks

- MySQL identifiers and foreign-key relationships must be preserved or
  explicitly mapped before importing to Firestore or a separately provisioned
  Vercel relational database.
- Firestore denormalization/query patterns need a migration design; copying
  SQL tables mechanically will not preserve joins or authorization.
- Existing session IDs and password/account semantics cannot be presumed
  portable to another auth provider.
- Do not copy production student data into development or run destructive
  schema changes without a reviewed migration, backup, and approval.
- Large 3D/model files and generated profile-photo URLs need explicit storage
  ownership and migration handling.

## Recommended incremental migration

1. Keep the current Express/MySQL production path stable; enforce safe
   production session and database configuration.
2. Inventory every route/model and write shared request/response contracts and
   access-control tests before extracting repositories.
3. Add provider-neutral interfaces around specific, tested use cases; do not
   move all controllers or the chemistry engine at once.
4. Implement Firebase auth/data/storage/functions as its own backend and
   emulator-tested composition. Port and test the required business logic.
5. Implement Vercel API, independent auth, relational database/migrations,
   and durable object storage without calling Firebase.
6. Test data access isolation, migration/import/export, uploads, async jobs,
   health checks, and realtime limitations independently on both targets.
7. Add separate deployment workflows only after each deployment is runnable
   from its own configuration and credentials.

## Features to preserve

Preserve the existing portal and role workflows; classroom/LMS/assessment
features; exam integrity and server-side scoring; existing visual identity;
all science simulations, including the Chemistry Laboratory; scientific asset
provenance and model rendering; and local development with MySQL. Keep
chemistry calculations/rendering provider-independent, and keep authoritative
graded outcomes server-validated.
