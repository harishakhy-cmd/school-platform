# CBT + Online Classroom Platform — Deployment Guide

> **Stack**: Node.js 18+ · Express · MySQL 8+ · Socket.IO · LiveKit (optional)

---

## Quick-Start (Local Development)

```powershell
# 1. Clone / unzip the project
cd d:\CBT

# 2. Install dependencies (PowerShell uses npm.cmd to avoid script-policy blocks)
npm.cmd install

# 3. Copy and edit the environment file
copy .env.example .env
# Open .env and set DB_PASSWORD, SESSION_SECRET, etc.

# 4. Initialise the database
npm.cmd run init-db
npm.cmd run migrate
npm.cmd run migrate:hierarchy
npm.cmd run migrate:password-reset   # creates admin_password_resets table

# 5. Start the server (bundles a local MySQL instance automatically)
npm.cmd start
# Server → http://localhost:3000
# Admin  → http://localhost:3000/admin-login.html
```

## Cloud deployment readiness

The current application remains a shared Express + MySQL codebase. An initial
Vercel function adapter is documented below; it is not yet a full feature
parity release. Firebase backend support is not implemented. Do not treat
Firebase Hosting or Vercel static hosting alone as a full-stack deployment. See the
[current-state audit](./architecture/current-state-audit.md) and
[dual-deployment architecture](./architecture/dual-deployment-architecture.md)
before provisioning production services.

The application exposes `GET /healthz`, which returns HTTP 200 only when the
configured MySQL database responds to a simple connectivity check.

When initializing a database without an admin account, set `ADMIN_USERNAME`
and `ADMIN_PASSWORD` in `.env` first. The initializer does not use a built-in
admin credential.

---

## Environment Variables

Copy `.env.example` to `.env`. All variables are optional unless marked **required**.

### Application

| Variable | Default | Notes |
|---|---|---|
| `APP_URL` | `http://localhost:3000` | Public URL, **no trailing slash**. Used to build password-reset links in emails. |
| `APP_NAME` | `CBT School` | Name shown in emails. |
| `SESSION_SECRET` | _(none)_ | **Required in production.** Long random string. |
| `COOKIE_SECURE` | `false` in development | Set to `true` when serving over HTTPS outside `NODE_ENV=production`. |
| `TRUST_PROXY` | `false` | Set to `true` only when HTTPS is terminated by a trusted reverse proxy. |

### Database

| Variable | Default | Notes |
|---|---|---|
| `DB_HOST` | `127.0.0.1` | MySQL host. |
| `DB_PORT` | `3306` | MySQL port. |
| `DB_NAME` | `cbt_db` | Database name. |
| `DB_USER` | `root` | MySQL user. |
| `DB_PASSWORD` | _(empty)_ | **Required in production.** |

### Email (for Forgot Password)

Without email configuration the server still works — password-reset links are logged to the console, which is fine for local dev.

#### Option A — Gmail App Password (recommended for small deployments)

1. Enable 2-Step Verification on your Google account.
2. Go to **Google Account → Security → 2-Step Verification → App passwords**.
3. Create an App Password for "Mail / Other (custom name)".
4. Copy the 16-character password (no spaces).

```dotenv
EMAIL_FROM=CBT Admin <noreply@your-domain.com>
EMAIL_GMAIL_USER=your@gmail.com
EMAIL_GMAIL_APP_PASS=abcd efgh ijkl mnop   # spaces are stripped automatically
```

#### Option B — SMTP

```dotenv
EMAIL_FROM=CBT Admin <noreply@your-domain.com>
EMAIL_SMTP_HOST=smtp.example.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_SECURE=false
EMAIL_SMTP_USER=user@example.com
EMAIL_SMTP_PASS=password
```

### Password Reset Rate Limiting

| Variable | Default | Notes |
|---|---|---|
| `PASSWORD_RESET_RATE_LIMIT` | `3` | Max forgot-password requests per IP per 15 minutes. Set to `100` when running automated tests. |

### LiveKit (Live Video / Audio)

Without LiveKit, the classroom page loads but video/audio is unavailable. Text chat and whiteboard sync still work.

1. Sign up at <https://livekit.io> (free tier available).
2. Create a project and copy the URL, API Key, and API Secret.

```dotenv
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxxxxxxxxxxxxxxx
LIVEKIT_API_SECRET=your_api_secret_here
```

---

## Database Migrations

Run in this order on a fresh installation:

```powershell
npm.cmd run init-db               # creates all core tables
npm.cmd run migrate               # adds admin column to students
npm.cmd run migrate:hierarchy     # admin role hierarchy tables
npm.cmd run migrate:password-reset # admin_password_resets table
```

### `admin_password_resets` Table Schema

```sql
CREATE TABLE admin_password_resets (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id   INT UNSIGNED NOT NULL,
  token_hash VARCHAR(64)  NOT NULL,   -- SHA-256 hash of the 64-char hex token
  expires_at DATETIME     NOT NULL,
  used_at    DATETIME     DEFAULT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_hash (token_hash),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);
```

---

## Running Tests

All tests require the server to be running (`npm.cmd start`) in a separate terminal. Use a disposable test database because integration tests modify records and settings.

```powershell
# In terminal 1 (PowerShell)
npm.cmd start

# In terminal 2
npm.cmd run test:platform         # 44 integration tests
npm.cmd run test:graphing         # 30 graphing-lab tests
npm.cmd run test:password-reset   # 20 forgot/reset password tests

# Run password-reset tests with a higher rate limit to avoid throttling:
$env:PASSWORD_RESET_RATE_LIMIT="100"; npm.cmd start   # in terminal 1
npm.cmd run test:password-reset                        # in terminal 2
```

---

## Production Checklist

- [ ] Copy `.env.example` → `.env` and set **all** required values.
- [ ] Set a strong, unique `SESSION_SECRET` (e.g., `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).
- [ ] Set `NODE_ENV=production`; the app rejects missing, short, and template session secrets and marks session cookies secure.
- [ ] If HTTPS terminates at a reverse proxy, configure `TRUST_PROXY=true` so secure session cookies work.
- [ ] Set a strong `DB_PASSWORD`.
- [ ] Set a unique `ADMIN_USERNAME` and strong `ADMIN_PASSWORD` before initializing the first admin account.
- [ ] Serve over **HTTPS** (use a reverse proxy like nginx with Let's Encrypt).
- [ ] Set `APP_URL` to your public HTTPS URL so password-reset links work.
- [ ] Configure email so password-reset emails are delivered (see Gmail or SMTP section above).
- [ ] (Optional) Configure LiveKit for live video/audio classrooms.
- [ ] Run all migrations on the production database.
- [ ] Verify all tests pass: `npm run test:platform`, `npm run test:graphing`.

---

## Architecture Overview

```
d:/CBT/
├── app.js                          # Express entry point
├── routes/
│   ├── adminRoutes.js              # /api/admin/* — admin API + settings
│   └── ...                         # student, exam, classroom routes
├── controllers/
│   ├── settingsController.js       # Settings panel backend (profile, stats, terms, etc.)
│   ├── passwordResetController.js  # Forgot / reset admin password
│   └── ...
├── utils/
│   └── emailService.js             # nodemailer wrapper (Gmail / SMTP auto-detect)
├── realtime/
│   └── socketServer.js             # Socket.IO server (whiteboard sync, chat, hand-raise)
├── views/
│   ├── admin.html                  # Admin dashboard (12-panel settings UI)
│   ├── admin-login.html            # Admin login with "Forgot password?" link
│   ├── admin-reset-password.html   # 5-step password reset UI
│   └── classroom.html              # Live classroom (video, whiteboard, chat)
├── public/
│   ├── js/
│   │   ├── admin-settings.js       # Settings panel frontend logic
│   │   └── live-classroom.js       # Classroom WebRTC + Socket.IO frontend
│   └── css/
│       └── admin-settings.css      # Settings panel styles
├── scripts/
│   ├── migratePasswordReset.js     # Creates admin_password_resets table
│   ├── testFullPlatform.js         # 44 integration tests
│   ├── testGraphingLab.js          # 30 graphing tests
│   └── testPasswordReset.js        # 20 password-reset tests
└── .env.example                    # Environment variable template
```

### Key API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/admin/auth/login` | public | Admin login |
| `POST` | `/api/admin/auth/logout` | session | Admin logout |
| `POST` | `/api/admin/auth/forgot-password` | public | Request password-reset email |
| `GET` | `/api/admin/auth/validate-reset-token` | public | Pre-validate reset token |
| `POST` | `/api/admin/auth/reset-password` | public | Set new password with valid token |
| `GET` | `/api/admin/settings/profile` | admin | Get own profile |
| `PUT` | `/api/admin/settings/profile` | admin | Update own profile |
| `GET` | `/api/admin/settings/stats` | admin | System statistics |
| `GET` | `/api/admin/settings/admins` | super_admin | List all admins |
| `PUT` | `/api/admin/settings/admins/:id` | super_admin | Update admin |
| `POST` | `/api/admin/settings/admins/:id/reset-password` | super_admin | Reset admin password |
| `GET/POST/PUT/DELETE` | `/api/admin/settings/terms` | admin/super_admin | Academic terms CRUD |
| `GET/POST/PUT/DELETE` | `/api/admin/settings/classes` | admin/super_admin | Classes CRUD |
| `GET/POST/PUT/DELETE` | `/api/admin/settings/subjects` | admin/super_admin | Subjects CRUD |
| `GET` | `/api/admin/settings/activity` | super_admin | Activity log |
| `POST` | `/api/admin/settings/test-email` | super_admin | Test email configuration |
| `POST` | `/api/admin/auth/change-password` | admin | Change own password |

---

## Email Setup Troubleshooting

**No email received after requesting a reset?**

1. Check the server console — the reset URL is always logged there.
2. Verify `.env` has `EMAIL_GMAIL_USER` and `EMAIL_GMAIL_APP_PASS` (or SMTP equivalents).
3. Use the **Settings → Live Config** panel → **Test Email Config** button to diagnose.
4. For Gmail: make sure 2-Step Verification is on and you are using an App Password (not your regular Gmail password).
5. Check the spam/junk folder.

**`Error: Invalid login` from Gmail?**

- You may be using your regular Google password instead of an App Password.
- Generate a new App Password at <https://myaccount.google.com/apppasswords>.

---

## Security Notes

- Password-reset tokens are stored as **SHA-256 hashes only** — the raw token is never persisted.
- Tokens are **single-use** and expire after **30 minutes**.
- The forgot-password endpoint returns the **same response for all inputs** (no email enumeration).
- Passwords are hashed with **bcrypt cost 12**.
- Admin sessions use `express-session` with `httpOnly` cookies.
- For production, add `cookie: { secure: true }` to the session config (requires HTTPS).
