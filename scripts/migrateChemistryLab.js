'use strict';

const pool = require('../config/database');

async function migrateChemistryLab() {
  console.log('Running Chemistry Laboratory schema migrations...');

  const experimentsTable = `
    CREATE TABLE IF NOT EXISTS \`chemistry_experiments\` (
      \`id\`                INT AUTO_INCREMENT PRIMARY KEY,
      \`user_id\`           INT NOT NULL,
      \`user_role\`         ENUM('student','tutor','admin') DEFAULT 'student',
      \`user_identifier\`   VARCHAR(100) NOT NULL,
      \`classroom_id\`      INT DEFAULT NULL,
      \`title\`             VARCHAR(255) NOT NULL,
      \`topic_code\`        VARCHAR(64) NOT NULL DEFAULT 'virtual-experiments',
      \`template_id\`       VARCHAR(64) DEFAULT NULL,
      \`apparatus_json\`    JSON,
      \`substances_json\`   JSON,
      \`reactions_json\`    JSON,
      \`measurements_json\` JSON,
      \`variables_json\`    JSON,
      \`observations\`      TEXT,
      \`created_at\`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\`        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_chem_exp_user\`  (\`user_identifier\`),
      INDEX \`idx_chem_exp_class\` (\`classroom_id\`),
      INDEX \`idx_chem_exp_topic\` (\`topic_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(experimentsTable);
    console.log('✓ chemistry_experiments table ready.');

    const dbName = process.env.DB_NAME || 'cbt_db';
    const colsToAdd = [
      { table: 'questions',      name: 'chemistry_config', sql: 'ALTER TABLE questions ADD COLUMN chemistry_config JSON NULL AFTER biology_target' },
      { table: 'questions',      name: 'chemistry_target', sql: 'ALTER TABLE questions ADD COLUMN chemistry_target JSON NULL AFTER chemistry_config' },
      { table: 'quiz_questions', name: 'chemistry_config', sql: 'ALTER TABLE quiz_questions ADD COLUMN chemistry_config JSON NULL AFTER biology_target' },
      { table: 'quiz_questions', name: 'chemistry_target', sql: 'ALTER TABLE quiz_questions ADD COLUMN chemistry_target JSON NULL AFTER chemistry_config' },
      { table: 'assignments',    name: 'chemistry_config', sql: 'ALTER TABLE assignments ADD COLUMN chemistry_config JSON NULL AFTER requires_biology_lab' },
      { table: 'assignments',    name: 'requires_chemistry_lab', sql: 'ALTER TABLE assignments ADD COLUMN requires_chemistry_lab BOOLEAN DEFAULT FALSE AFTER chemistry_config' }
    ];

    for (const c of colsToAdd) {
      const [existing] = await pool.query(
        'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?',
        [dbName, c.table, c.name]
      );
      if (!existing || existing.length === 0) {
        await pool.query(c.sql);
        console.log(`✓ Added ${c.table}.${c.name} column.`);
      } else {
        console.log(`  ${c.table}.${c.name} already exists — skipped.`);
      }
    }

    console.log('Chemistry Laboratory migrations completed successfully.');
  } catch (err) {
    console.error('Chemistry Laboratory migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateChemistryLab()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateChemistryLab };
