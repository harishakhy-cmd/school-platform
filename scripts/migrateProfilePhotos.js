'use strict';

const pool = require('../config/database');

async function ensureColumn(table, column, definition) {
  const [rows] = await pool.execute(
    `SELECT COLUMN_NAME FROM information_schema.columns
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  if (!rows.length) {
    await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
    console.log(`Added ${table}.${column}.`);
  }
}

async function migrateProfilePhotos() {
  await ensureColumn('students', 'profile_photo_url', 'VARCHAR(512) NULL');
  await ensureColumn('admin_users', 'avatar_url', 'VARCHAR(512) NULL');
  console.log('Profile photo columns are ready.');
}

if (require.main === module) {
  migrateProfilePhotos()
    .then(() => pool.end())
    .catch(async (error) => {
      console.error('Profile photo migration failed:', error);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { migrateProfilePhotos };
