# Security Review: Deployment Readiness

**Date:** 2026-10-29
**Scope:** Static review of repository deployment/authentication configuration
for the dual-deployment request. This is not a penetration test or a complete
line-by-line security audit.

## Findings

| Severity | Finding | Evidence/status | Required action |
|---|---|---|---|
| High | The session-security helper was not wired into the production Express session configuration; the server used a hard-coded fallback secret and did not set the cookie's `Secure` attribute. | Corrected in `app.js`: production uses `getSessionSecurityConfig()`, which rejects missing/short/sample secrets; production cookies use `Secure`. | Supply a unique secret in the production secret manager and deploy HTTPS. |
| High | Production startup could silently use default local MySQL configuration when production database values were missing. | Corrected in `app.js`: requires `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in production. | Configure and test the actual provider's production database. |
| Medium | Admin login rate limiting is process-local and therefore not shared across instances or deploys. | Existing `Map` in `routes/adminRoutes.js`. | Replace with a distributed limiter before horizontally scaled production. |
| Medium | Profile photos use local filesystem storage in the existing deployment. | `utils/profilePhotoStorage.js` keeps local behavior but writes new profile photos to Vercel Blob when the Vercel target is selected. Other application file storage remains separately unverified. | Test Vercel Blob access and migration of existing local files before production cutover. |
| Medium | Initial administrator setup requires a securely provisioned credential. | Corrected in `scripts/initDatabase.js`: creation stops with an explicit error unless `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set. | Supply unique credentials through the local environment or secret manager before initializing an empty admin table. |
| Medium | Existing controllers rely on MySQL and sessions; no provider-specific server auth/rules exist. | No Firebase/Vercel adapters/configuration found. | Implement and test each backend's independent authentication, authorization, database, and storage before deployment. |
| Low | `TRUST_PROXY` configuration can affect client IP/protocol handling if configured incorrectly. | Express trusts one proxy hop only when explicitly enabled. | Set only when the actual topology has one trusted proxy; verify secure cookies and rate-limit IP behavior. |

## Remediation made in this change

- `app.js` now obtains session secret/cookie policy from
  `utils/sessionSecurity.js`.
- The prior session-store dependency pinned a vulnerable outdated MySQL
  driver. It was replaced with a small callback-compatible session store over
  the application's patched shared `mysql2` pool; the relevant store tests
  cover persistence operations.
- Production refuses missing core MySQL settings and refuses to fall back to
  an in-memory session store if MySQL session-store construction fails.
- `TRUST_PROXY=true` enables one-hop proxy trust; defaults to disabled.
- `GET /healthz` checks the database and returns 503 when unavailable.
- Initial admin setup no longer falls back to a built-in password.
- The authentication unit test now awaits the controller's current async
  profile lookup.

Firebase requirements are **not remediated**. Vercel has an initial adapter,
but it has not passed cloud build, deployment, or feature-parity validation.
This document contains no claim of external testing, certification, or
deployment.
