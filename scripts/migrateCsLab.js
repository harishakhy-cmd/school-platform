'use strict';

/**
 * Migration Script: Virtual Computer Science, ICT & Software Development Laboratory
 * Creates `cs_projects` and `cs_execution_logs` tables and adds cs_config columns
 * to questions, quiz_questions, and assignments tables.
 */

const pool = require('../config/database');

async function migrate() {
  console.log('--- Migrating Computer Science & ICT Laboratory Schema ---');

  // 1. Create cs_projects table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cs_projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(100) NOT NULL,
      title VARCHAR(255) NOT NULL,
      module_code VARCHAR(100) NOT NULL,
      project_type VARCHAR(50) NOT NULL DEFAULT 'web',
      files JSON NULL,
      environment_config JSON NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_cs_user (user_identifier),
      INDEX idx_cs_module (module_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ cs_projects table verified / created');

  // 2. Create cs_execution_logs table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cs_execution_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_identifier VARCHAR(100) NOT NULL,
      project_id INT NULL,
      language VARCHAR(50) NOT NULL,
      execution_mode VARCHAR(50) NOT NULL DEFAULT 'isolated_worker',
      exit_code INT DEFAULT 0,
      execution_time_ms INT DEFAULT 0,
      stdout MEDIUMTEXT NULL,
      stderr MEDIUMTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_cs_exec_user (user_identifier),
      INDEX idx_cs_exec_lang (language)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✓ cs_execution_logs table verified / created');

  // 3. Add cs_config and cs_target columns to questions table
  const [qCols] = await pool.query('DESCRIBE questions');
  const qColNames = qCols.map((c) => c.Field);

  if (!qColNames.includes('cs_config')) {
    await pool.query('ALTER TABLE questions ADD COLUMN cs_config JSON NULL');
    console.log('✓ Added cs_config to questions table');
  }
  if (!qColNames.includes('cs_target')) {
    await pool.query('ALTER TABLE questions ADD COLUMN cs_target JSON NULL');
    console.log('✓ Added cs_target to questions table');
  }

  // 4. Add cs_config and cs_target columns to quiz_questions table
  const [qqCols] = await pool.query('DESCRIBE quiz_questions');
  const qqColNames = qqCols.map((c) => c.Field);

  if (!qqColNames.includes('cs_config')) {
    await pool.query('ALTER TABLE quiz_questions ADD COLUMN cs_config JSON NULL');
    console.log('✓ Added cs_config to quiz_questions table');
  }
  if (!qqColNames.includes('cs_target')) {
    await pool.query('ALTER TABLE quiz_questions ADD COLUMN cs_target JSON NULL');
    console.log('✓ Added cs_target to quiz_questions table');
  }

  // 5. Add cs_config and requires_cs_lab to assignments table
  const [aCols] = await pool.query('DESCRIBE assignments');
  const aColNames = aCols.map((c) => c.Field);

  if (!aColNames.includes('cs_config')) {
    await pool.query('ALTER TABLE assignments ADD COLUMN cs_config JSON NULL');
    console.log('✓ Added cs_config to assignments table');
  }
  if (!aColNames.includes('requires_cs_lab')) {
    await pool.query('ALTER TABLE assignments ADD COLUMN requires_cs_lab BOOLEAN DEFAULT FALSE');
    console.log('✓ Added requires_cs_lab to assignments table');
  }

  console.log('🎉 Computer Science & ICT Laboratory schema migration completed successfully!');
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
