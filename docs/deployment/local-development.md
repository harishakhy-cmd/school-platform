# Local Development

## Existing application

The supported current development path uses Node.js 18+, npm, and MySQL.
From the repository root in PowerShell:

```powershell
npm.cmd install
Copy-Item .env.example .env
# Configure local MySQL values and a development SESSION_SECRET in .env.
npm.cmd run init-db
npm.cmd start
```

The default server address is `http://localhost:3000`. For the complete
existing migration sequence, consult [DEPLOYMENT.md](../DEPLOYMENT.md).
Use only a disposable local/test database for integration scripts.

## Cloud-specific local workflows

The Vercel function can be exercised with `npm run dev:vercel` after linking
the repository to a Vercel project or configuring the local Vercel CLI. It
still requires the Vercel edition's isolated MySQL database and optional Blob
store for integration tests. Firebase emulator configuration and Firebase
backend packages are not implemented. Do not point local testing at production
student data.

## Existing tests

Run focused Node tests with:

```powershell
node --test tests/chemistry-simulation.test.js tests/chemistry-lab-controller.test.js tests/scientific-assets.test.js tests/auth-session.test.js
```

The platform's other `test:*` scripts may require a running app and a
disposable MySQL database. The package currently declares no standard lint,
type-check, frontend build, or end-to-end browser test command.
