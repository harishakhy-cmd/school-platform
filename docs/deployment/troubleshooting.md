# Deployment Troubleshooting

## Current Express/MySQL deployment

### Startup says a production variable is missing

Set `SESSION_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in the
server's secret/configuration manager. Use a unique session secret of at least
32 characters. Do not use the example file's placeholders.

### Login/session is not persistent

The current app expects the MySQL `sessions` table and persistent connectivity.
Check the MySQL connection and run the existing reviewed schema setup for the
selected database. Production must not rely on Express's in-memory store.

### `/healthz` returns HTTP 503

The endpoint reports database readiness. Check the service's MySQL host,
port, credentials, network allowlist, and database availability. The response
intentionally omits connection details; inspect server logs for the database
error code.

### Secure cookies are not set behind a proxy

Use HTTPS and set `TRUST_PROXY=true` only when exactly one trusted reverse
proxy sits before Express. Verify the actual platform's forwarded protocol
behavior rather than trusting arbitrary client headers.

### Uploaded profile photos disappear

The current photo implementation writes to local disk. Ephemeral/serverless
instances do not guarantee durable local files; the cloud storage adapter is
not implemented yet.

## Firebase and Vercel

The Vercel function adapter is present but has not been validated against a
linked account or cloud services. Link the repository root before running
`npm run build:vercel`; configure the required Vercel target variables and
dedicated database. The Firebase backend and emulator target are not
implemented. Do not apply generic hosting rewrites or claim a frontend-only
deployment is full stack.
