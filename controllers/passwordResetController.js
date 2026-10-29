'use strict';

/**
 * controllers/passwordResetController.js
 *
 * Handles the Forgot / Reset Admin Password flow.
 *
 * Routes (added to adminRoutes.js, public — no auth middleware):
 *   POST /api/admin/auth/forgot-password
 *   POST /api/admin/auth/reset-password
 *   GET  /api/admin/auth/validate-reset-token   (used to pre-validate token before showing form)
 *
 * Security model:
 *   - 32-byte random token (crypto.randomBytes) — never stored
 *   - Only the SHA-256 hex hash is stored in admin_password_resets
 *   - Token expires in 30 minutes
 *   - Single-use: used_at is set immediately on first valid use
 *   - Rate-limited: max 3 forgot-password requests per 15 min per IP
 *   - Reset URL built from APP_URL env var, never from user input
 *   - Generic response for forgot-password (does not reveal whether email exists)
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const adminUserModel = require('../models/adminUserModel');
const { sendPasswordResetEmail } = require('../utils/emailService');
const { logActivity } = require('../utils/activityLogger');

// ── Simple in-memory rate limiter ─────────────────────────────────────────────
// Format: { ip: { count, resetAt } }
// Not persisted across restarts — acceptable for forgot-password (low volume).
// Set RATE_LIMIT_MAX env var to override (e.g. set to 100 in test env).
const rateLimitStore = new Map();
const RATE_LIMIT_MAX = parseInt(process.env.PASSWORD_RESET_RATE_LIMIT || '3', 10);
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Exposed so test scripts can clear state between test groups
function clearRateLimits() { rateLimitStore.clear(); }

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    const waitSec = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, waitSec };
  }

  entry.count++;
  return { allowed: true };
}

// Clean up stale entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) rateLimitStore.delete(ip);
  }
}, 30 * 60 * 1000);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sha256(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(32).toString('hex'); // 64 hex chars
}

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

async function cleanupExpiredTokens() {
  try {
    await pool.query('DELETE FROM admin_password_resets WHERE expires_at < NOW()');
  } catch (e) { /* non-fatal */ }
}

// ── POST /api/admin/auth/forgot-password ──────────────────────────────────────

async function forgotPassword(req, res, next) {
  try {
    const ip = getClientIp(req);
    const { email } = req.body;

    // Rate limit
    const rl = checkRateLimit(ip);
    if (!rl.allowed) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${rl.waitSec} seconds before trying again.`,
      });
    }

    // Always return the same generic message to prevent email enumeration
    const GENERIC_MSG = 'If that email address is registered to an admin account, a reset link has been sent.';

    if (!email || typeof email !== 'string') {
      return res.json({ ok: true, message: GENERIC_MSG });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Find admin by email
    const [rows] = await pool.query(
      `SELECT id, username, full_name, email FROM admin_users
       WHERE LOWER(email) = ? AND status = 'active' LIMIT 1`,
      [cleanEmail]
    );

    if (rows.length === 0) {
      // Still return generic message — don't reveal miss
      return res.json({ ok: true, message: GENERIC_MSG });
    }

    const admin = rows[0];

    // Clean up old tokens for this admin
    await pool.query(
      'DELETE FROM admin_password_resets WHERE admin_id = ?',
      [admin.id]
    );

    // Generate token
    const rawToken = generateResetToken();
    const tokenHash = sha256(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 min

    await pool.query(
      'INSERT INTO admin_password_resets (admin_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [admin.id, tokenHash, expiresAt]
    );

    // Build reset URL from APP_URL env var (never from user input)
    const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${appUrl}/admin-reset-password.html?token=${rawToken}`;

    // Send email
    const emailResult = await sendPasswordResetEmail({
      to: admin.email,
      name: admin.full_name || admin.username,
      resetUrl,
    });

    if (!emailResult.ok && emailResult.reason === 'EMAIL_NOT_CONFIGURED') {
      // Log the URL for local dev / testing (token is already hashed in DB, raw token in log is ok here)
      console.log(`[PasswordReset] Email not configured. Reset URL for ${admin.username}: ${resetUrl}`);
    }

    return res.json({ ok: true, message: GENERIC_MSG });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/auth/validate-reset-token ──────────────────────────────────
// Pre-validates a token so the frontend can show a proper error before the form loads.

async function validateResetToken(req, res, next) {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return res.status(400).json({ ok: false, error: 'Invalid or missing reset token.' });
    }

    const tokenHash = sha256(token);
    const [rows] = await pool.query(
      `SELECT id, admin_id, expires_at, used_at
       FROM admin_password_resets
       WHERE token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ ok: false, error: 'Reset link is invalid. Please request a new one.' });
    }

    const record = rows[0];

    if (record.used_at) {
      return res.status(400).json({ ok: false, error: 'This reset link has already been used. Please request a new one.' });
    }

    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ ok: false, error: 'Reset link has expired. Please request a new one.' });
    }

    return res.json({ ok: true, message: 'Token is valid.' });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/auth/reset-password ───────────────────────────────────────

async function resetPassword(req, res, next) {
  try {
    const ip = getClientIp(req);

    // Separate rate limit for reset attempts
    const rl = checkRateLimit(`reset:${ip}`);
    if (!rl.allowed) {
      return res.status(429).json({
        error: `Too many requests. Please wait ${rl.waitSec} seconds.`,
      });
    }

    const { token, newPassword, confirmPassword } = req.body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!token || typeof token !== 'string' || token.length !== 64) {
      return res.status(400).json({ error: 'Invalid or missing reset token.' });
    }
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Both password fields are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter.' });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must contain at least one number.' });
    }

    // ── Validate token ───────────────────────────────────────────────────────
    const tokenHash = sha256(token);
    const [rows] = await pool.query(
      `SELECT id, admin_id, expires_at, used_at
       FROM admin_password_resets
       WHERE token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid. Please request a new one.' });
    }

    const record = rows[0];

    if (record.used_at) {
      return res.status(400).json({ error: 'This reset link has already been used.' });
    }
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    // ── Mark token as used BEFORE updating password (prevents race conditions) ──
    await pool.query(
      'UPDATE admin_password_resets SET used_at = NOW() WHERE id = ?',
      [record.id]
    );

    // ── Hash and save new password ───────────────────────────────────────────
    const newHash = await bcrypt.hash(newPassword, 12);
    await adminUserModel.updatePassword(record.admin_id, newHash);

    // ── Log the activity ─────────────────────────────────────────────────────
    logActivity(record.admin_id, 'PASSWORD_RESET_VIA_EMAIL', 'admin', record.admin_id, 'Password reset via email link');

    // ── Clean up all reset tokens for this admin ─────────────────────────────
    await pool.query('DELETE FROM admin_password_resets WHERE admin_id = ?', [record.admin_id]);

    return res.json({ ok: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { forgotPassword, validateResetToken, resetPassword, clearRateLimits };
