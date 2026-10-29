'use strict';
const adminCredentials = require('./adminTestCredentials')();
/**
 * scripts/testPasswordReset.js
 * End-to-end test for the Forgot / Reset Admin Password flow.
 *
 * Run against a server started with PASSWORD_RESET_RATE_LIMIT=100 for full coverage,
 * or against the default server (rate limit = 3) to verify rate limiting works.
 *
 * Usage:
 *   node scripts/testPasswordReset.js          (tests against running server)
 */
// Load env so DB config is available
require('dotenv').config();

const pool = require('../config/database');
const http = require('http');
const crypto = require('crypto');

function req(opts, body) {
  return new Promise((res, rej) => {
    const r = http.request(opts, resp => {
      let d = '';
      resp.on('data', c => d += c);
      resp.on('end', () => res({ s: resp.statusCode, b: d }));
    });
    r.on('error', rej);
    if (body) r.write(body);
    r.end();
  });
}

function post(path, body) {
  const b = JSON.stringify(body);
  return req({ hostname: 'localhost', port: 3000, path, method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(b) } }, b);
}

function get(path) {
  return req({ hostname: 'localhost', port: 3000, path, method: 'GET' });
}

let passed = 0, failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${label}${detail ? ' | ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}${detail ? ' | ' + detail : ''}`);
    failed++;
  }
}

async function main() {
  console.log('');
  console.log('=================================================');
  console.log(' PASSWORD RESET FLOW — END-TO-END TEST SUITE');
  console.log('=================================================');
  console.log('');

  const [admins] = await pool.query(
    'SELECT id FROM admin_users WHERE username = ? LIMIT 1', [adminCredentials.username]
  );
  const adminId = admins[0].id;

  // ── Group 1: Forgot-password endpoint (run first — may overwrite token) ──────
  console.log('--- TEST GROUP 1: POST /api/admin/auth/forgot-password ---');

  const r1a = await post('/api/admin/auth/forgot-password', { email: 'superadmin@cbt-school.org' });
  const d1a = JSON.parse(r1a.b);
  check('Known email returns generic ok message', r1a.s === 200 && d1a.ok, d1a.message);

  const r1b = await post('/api/admin/auth/forgot-password', { email: 'hacker@nowhere.com' });
  const d1b = JSON.parse(r1b.b);
  check('Unknown email returns same generic message (no enumeration)', r1b.s === 200 && d1b.ok && d1b.message === d1a.message, d1b.message);

  const r1c = await post('/api/admin/auth/forgot-password', {});
  const d1c = JSON.parse(r1c.b);
  check('Missing email body returns ok (no enumeration)', r1c.s === 200 && d1c.ok);

  // ── Setup: seed a fresh known token AFTER Group 1 (which may create its own) ─
  const rawToken = crypto.randomBytes(32).toString('hex');   // 64 hex chars
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  await pool.query('DELETE FROM admin_password_resets WHERE admin_id = ?', [adminId]);
  await pool.query(
    'INSERT INTO admin_password_resets (admin_id, token_hash, expires_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
    [adminId, tokenHash]
  );
  console.log('\n--- Setup: fresh known token seeded for Groups 2-4 ---');

  // The password used in the actual reset — must meet all three policy rules
  const TEST_NEW_PASSWORD = 'TestReset1!';

  // ── Group 2: Token validation ────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 2: GET /api/admin/auth/validate-reset-token ---');

  const r2a = await get('/api/admin/auth/validate-reset-token?token=' + rawToken);
  const d2a = JSON.parse(r2a.b);
  check('Valid fresh token is accepted', r2a.s === 200 && d2a.ok, d2a.message || d2a.error);

  const r2b = await get('/api/admin/auth/validate-reset-token?token=' + 'a'.repeat(64));
  const d2b = JSON.parse(r2b.b);
  check('Non-existent token rejected (400)', r2b.s === 400 && !d2b.ok, d2b.error);

  const r2c = await get('/api/admin/auth/validate-reset-token?token=short');
  const d2c = JSON.parse(r2c.b);
  check('Too-short token rejected (400)', r2c.s === 400 && !d2c.ok, d2c.error);

  const r2d = await get('/api/admin/auth/validate-reset-token');
  const d2d = JSON.parse(r2d.b);
  check('Missing token param rejected (400)', r2d.s === 400 && !d2d.ok, d2d.error);

  // ── Group 3: Password policy ─────────────────────────────────────────────────
  console.log('\n--- TEST GROUP 3: POST /api/admin/auth/reset-password (policy checks) ---');

  const r3a = await post('/api/admin/auth/reset-password', { token: rawToken, newPassword: 'short', confirmPassword: 'short' });
  const d3a = JSON.parse(r3a.b);
  check('Too-short password rejected', r3a.s === 400 && !d3a.ok, d3a.error);

  const r3b = await post('/api/admin/auth/reset-password', { token: rawToken, newPassword: 'nouppercase1', confirmPassword: 'nouppercase1' });
  const d3b = JSON.parse(r3b.b);
  check('No uppercase letter rejected', r3b.s === 400 && !d3b.ok, d3b.error);

  const r3c = await post('/api/admin/auth/reset-password', { token: rawToken, newPassword: 'NoNumbersHere', confirmPassword: 'NoNumbersHere' });
  const d3c = JSON.parse(r3c.b);
  check('No number in password rejected', r3c.s === 400 && !d3c.ok, d3c.error);

  const r3d = await post('/api/admin/auth/reset-password', { token: rawToken, newPassword: TEST_NEW_PASSWORD, confirmPassword: 'DifferentPass1' });
  const d3d = JSON.parse(r3d.b);
  check('Mismatched passwords rejected', r3d.s === 400 && !d3d.ok, d3d.error);

  const r3e = await post('/api/admin/auth/reset-password', { newPassword: TEST_NEW_PASSWORD, confirmPassword: TEST_NEW_PASSWORD });
  const d3e = JSON.parse(r3e.b);
  check('Missing token field rejected', r3e.s === 400 && !d3e.ok, d3e.error);

  // ── Group 4: Successful reset + single-use enforcement ───────────────────────
  console.log('\n--- TEST GROUP 4: Successful reset and single-use ---');

  const r4a = await post('/api/admin/auth/reset-password', {
    token: rawToken, newPassword: TEST_NEW_PASSWORD, confirmPassword: TEST_NEW_PASSWORD
  });
  const d4a = JSON.parse(r4a.b);
  check('Valid token + strong password accepted (200)', r4a.s === 200 && d4a.ok, d4a.message || d4a.error);

  // Token must be rejected on second use
  const r4b = await get('/api/admin/auth/validate-reset-token?token=' + rawToken);
  const d4b = JSON.parse(r4b.b);
  check('Token rejected after first use (single-use)', r4b.s === 400 && !d4b.ok, d4b.error);

  const r4c = await post('/api/admin/auth/reset-password', {
    token: rawToken, newPassword: 'AnotherPass1', confirmPassword: 'AnotherPass1'
  });
  const d4c = JSON.parse(r4c.b);
  check('Second reset attempt with used token rejected', r4c.s === 400 && !d4c.ok, d4c.error);

  // ── Group 5: Login still works after reset ───────────────────────────────────
  console.log('\n--- TEST GROUP 5: Login after password reset ---');

  const r5a = await post('/api/admin/auth/login', { username: adminCredentials.username, password: TEST_NEW_PASSWORD });
  const d5a = JSON.parse(r5a.b);
  check('Login with reset password succeeds', r5a.s === 200 && d5a.ok, d5a.username || d5a.error);

  const r5b = await post('/api/admin/auth/login', { username: adminCredentials.username, password: adminCredentials.password });
  const d5b = JSON.parse(r5b.b);
  check('Wrong password rejected after reset', r5b.s === 401 && !d5b.ok, d5b.error);

  // ── Restore: reset superadmin password back to original ──────────────────────
  console.log('\n--- RESTORE: resetting superadmin password back to original ---');
  const bcrypt = require('bcrypt');
  const restoredHash = await bcrypt.hash(adminCredentials.password, 12);
  await pool.query('UPDATE admin_users SET password_hash = ? WHERE username = ?', [restoredHash, adminCredentials.username]);
   console.log('  Password restored to the configured admin credential.');

  // ── Group 6: Reset page is served ────────────────────────────────────────────
  console.log('\n--- TEST GROUP 6: Page serving ---');

  const r6a = await get('/admin-reset-password.html');
  check('Reset page served (HTTP 200)', r6a.s === 200);

  const r6b = await get('/admin-login.html');
  check('Login page served (HTTP 200)', r6b.s === 200);
  check('Login page contains Forgot password link', r6b.b.includes('admin-reset-password.html'));

  await pool.end();

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('');
  console.log('=================================================');
  console.log(` TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================');
  if (failed === 0) {
    console.log('🎉 ALL PASSWORD RESET TESTS PASSED!');
  } else {
    console.log('⚠  Some tests failed — check output above.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test runner error:', err.message);
  process.exit(1);
});
