'use strict';

/**
 * utils/emailService.js
 *
 * Thin wrapper around nodemailer.
 *
 * Supported transport strategies (auto-detected from .env):
 *
 *   1. SMTP  — set EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_USER, EMAIL_SMTP_PASS
 *   2. Gmail — set EMAIL_GMAIL_USER, EMAIL_GMAIL_APP_PASS  (use a Gmail App Password, not your real password)
 *   3. None  — EMAIL_ENABLED=false or no credentials; sendMail() returns { ok:false, reason:'EMAIL_NOT_CONFIGURED' }
 *
 * Common .env variables:
 *   EMAIL_FROM        = "CBT Admin <noreply@your-school.org>"
 *   APP_URL           = "http://localhost:3000"   (used to build reset links)
 */

const nodemailer = require('nodemailer');

let _transporter = null;

function createTransporter() {
  const disabled = process.env.EMAIL_ENABLED === 'false';
  if (disabled) return null;

  // Gmail shortcut
  const gmailUser = process.env.EMAIL_GMAIL_USER;
  const gmailPass = process.env.EMAIL_GMAIL_APP_PASS;
  if (gmailUser && gmailPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    });
  }

  // Generic SMTP
  const smtpHost = process.env.EMAIL_SMTP_HOST;
  const smtpUser = process.env.EMAIL_SMTP_USER;
  const smtpPass = process.env.EMAIL_SMTP_PASS;
  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(process.env.EMAIL_SMTP_PORT || '587', 10),
      secure: process.env.EMAIL_SMTP_SECURE === 'true', // true for port 465
      auth: { user: smtpUser, pass: smtpPass },
    });
  }

  return null; // not configured
}

function getTransporter() {
  if (_transporter === null) {
    _transporter = createTransporter() || false; // false = "checked, not configured"
  }
  return _transporter || null;
}

/**
 * Send an email.
 * @param {object} opts
 * @param {string} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 * @returns {Promise<{ok:boolean, messageId?:string, reason?:string}>}
 */
async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[Email] No email transport configured — skipping send to:', to);
    return { ok: false, reason: 'EMAIL_NOT_CONFIGURED' };
  }

  const from = process.env.EMAIL_FROM || 'CBT System <noreply@cbt-school.org>';

  try {
    const info = await transporter.sendMail({ from, to, subject, html, text });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Email] Send failed:', err.message);
    return { ok: false, reason: err.message };
  }
}

/**
 * Test the email connection (use in setup/diagnostics).
 */
async function verifyTransport() {
  const transporter = getTransporter();
  if (!transporter) return { ok: false, reason: 'EMAIL_NOT_CONFIGURED' };
  try {
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

/**
 * Build and send a password reset email.
 */
async function sendPasswordResetEmail({ to, name, resetUrl }) {
  const appName = process.env.APP_NAME || 'CBT Admin';
  const subject = `${appName} — Password Reset Request`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <div style="background:#1a3a5c;padding:24px 32px">
      <h1 style="color:#fff;margin:0;font-size:20px">${appName}</h1>
    </div>
    <div style="padding:32px">
      <h2 style="color:#1a3a5c;margin-top:0">Password Reset Request</h2>
      <p>Hi <strong>${name || 'Administrator'}</strong>,</p>
      <p>We received a request to reset the password for your administrator account.
         Click the button below to set a new password. This link is valid for <strong>30 minutes</strong>.</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${resetUrl}"
           style="background:#1a3a5c;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:15px">
          Reset My Password
        </a>
      </div>
      <p style="color:#666;font-size:13px">
        If you did not request a password reset, ignore this email — your password will not change.
      </p>
      <p style="color:#666;font-size:13px">
        If the button above doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color:#1a3a5c;word-break:break-all">${resetUrl}</a>
      </p>
    </div>
    <div style="background:#f5f5f5;padding:16px 32px;color:#888;font-size:12px;text-align:center">
      This email was sent from ${appName}. Do not reply to this email.
    </div>
  </div>
</body>
</html>`;

  const text = `Password Reset Request

Hi ${name || 'Administrator'},

We received a request to reset your ${appName} administrator password.

Reset link (valid 30 minutes):
${resetUrl}

If you did not request this, ignore this email.`;

  return sendMail({ to, subject, html, text });
}

module.exports = { sendMail, sendPasswordResetEmail, verifyTransport };
