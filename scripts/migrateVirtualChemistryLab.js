'use strict';

const pool = require('../config/database');

async function migrateVirtualChemistryLab() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS chemistry_lab_runs (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      owner_role ENUM('student','tutor','admin') NOT NULL,
      owner_identifier VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      experiment_key VARCHAR(64) NOT NULL,
      version INT UNSIGNED NOT NULL,
      status ENUM('in_progress','submitted') NOT NULL DEFAULT 'in_progress',
      state_json JSON NOT NULL,
      notebook_json JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_chemistry_run_owner (owner_role, owner_identifier, updated_at),
      INDEX idx_chemistry_run_experiment (experiment_key, version)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('Virtual chemistry run table is ready.');
}

if (require.main === module) {
  migrateVirtualChemistryLab()
    .then(() => pool.end())
    .catch(async (error) => {
      console.error('Virtual chemistry migration failed:', error);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { migrateVirtualChemistryLab };
