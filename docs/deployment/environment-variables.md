# Environment Variables

The existing app reads server-side configuration from dotenv and
`process.env`. No Firebase or Vercel-specific variable set exists yet. The
root `.env.example` contains templates only; never commit a real `.env`.

| Variable | Scope | Current purpose |
|---|---|---|
| `NODE_ENV` | Server | Enables production security behavior |
| `PORT`, `HOST` | Server | Express listener |
| `APP_URL`, `APP_NAME` | Server | Password-reset links and email branding |
| `SESSION_SECRET` | Server-only secret | Production session signing; must be unique and at least 32 characters |
| `TRUST_PROXY` | Server | Set `true` only behind one trusted proxy; controls one-hop Express proxy trust |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Server-only | Current MySQL pool |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | Initialization and local tests | Initial admin account for `npm run init-db` and database-backed admin test scripts; use a unique strong password |
| `EMAIL_*` | Server-only where credentials are present | Optional SMTP/Gmail transport |
| `LOGIN_RATE_LIMIT`, `PASSWORD_RESET_RATE_LIMIT` | Server | Existing in-process limit configuration |
| `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` | Server-only | Optional LiveKit token service |

For production, `SESSION_SECRET`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, and
`DB_NAME` are required by the current server startup. `DB_PORT` defaults to
3306. Do not expose server variables through browser build tooling. Firebase
public client IDs/config (once implemented) are distinct from Admin SDK
credentials. Vercel database URLs, auth secrets, and storage tokens must remain
server-side. Configure development, preview, and production values separately
in the corresponding provider's secret manager.

Generate a session secret locally with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

This prints a secret to the terminal; store it only in the local environment
or deployment secret manager. Never include a real value in a report or commit.
