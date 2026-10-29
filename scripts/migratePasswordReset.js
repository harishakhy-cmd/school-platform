'use strict';

/**
 * scripts/migratePasswordReset.js
 *
 * Creates the admin_password_resets table used by the Forgot Password flow.
 * Safe to run multiple times (uses IF NOT EXISTS).
 */

const pool = require('../config/database');

async function run() {
  const conn = await pool.getConnection();
  try {
    // ── admin_password_resets ───────────────────────────────────────────────
    // Stores hashed reset tokens so that plain tokens are never persisted.
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_password_resets (
        id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        admin_id     INT UNSIGNED NOT NULL,
        token_hash   VARCHAR(64)  NOT NULL UNIQUE,   -- SHA-256 hex of the raw token
        expires_at   DATETIME     NOT NULL,
        used_at      DATETIME     NULL DEFAULT NULL,
        created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_apr_admin (admin_id),
        INDEX idx_apr_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ admin_password_resets table ready');

    // Verify columns
    const [cols] = await conn.query('DESCRIBE admin_password_resets');
    console.log('  Columns:', cols.map(c => c.Field).join(', '));
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
