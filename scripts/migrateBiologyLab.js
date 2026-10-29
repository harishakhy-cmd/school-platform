'use strict';

const pool = require('../config/database');

async function migrateBiologyLab() {
  console.log('Running Biology Laboratory schema migrations...');

  const experimentsTable = `
    CREATE TABLE IF NOT EXISTS \`biology_experiments\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT NOT NULL,
      \`user_role\` ENUM('student', 'tutor', 'admin') DEFAULT 'student',
      \`user_identifier\` VARCHAR(100) NOT NULL,
      \`classroom_id\` INT DEFAULT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`topic_code\` VARCHAR(64) NOT NULL DEFAULT 'virtual-experiments',
      \`model_type\` VARCHAR(64) DEFAULT 'cell_2d',
      \`specimens_json\` JSON,
      \`annotations_json\` JSON,
      \`variables_json\` JSON,
      \`data_readings_json\` JSON,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_bio_exp_user\` (\`user_identifier\`),
      INDEX \`idx_bio_exp_class\` (\`classroom_id\`),
      INDEX \`idx_bio_exp_topic\` (\`topic_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(experimentsTable);
    console.log('✓ biology_experiments table ready.');

    const dbName = process.env.DB_NAME || 'cbt_db';
    const colsToAdd = [
      { table: 'questions', name: 'biology_config', sql: 'ALTER TABLE questions ADD COLUMN biology_config JSON NULL AFTER physics_target' },
      { table: 'questions', name: 'biology_target', sql: 'ALTER TABLE questions ADD COLUMN biology_target JSON NULL AFTER biology_config' },
      { table: 'quiz_questions', name: 'biology_config', sql: 'ALTER TABLE quiz_questions ADD COLUMN biology_config JSON NULL AFTER physics_target' },
      { table: 'quiz_questions', name: 'biology_target', sql: 'ALTER TABLE quiz_questions ADD COLUMN biology_target JSON NULL AFTER biology_config' },
      { table: 'assignments', name: 'biology_config', sql: 'ALTER TABLE assignments ADD COLUMN biology_config JSON NULL AFTER requires_physics_lab' },
      { table: 'assignments', name: 'requires_biology_lab', sql: 'ALTER TABLE assignments ADD COLUMN requires_biology_lab BOOLEAN DEFAULT FALSE AFTER biology_config' }
    ];

    for (const c of colsToAdd) {
      const [existing] = await pool.query(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
        [dbName, c.table, c.name]
      );
      if (!existing || existing.length === 0) {
        await pool.query(c.sql);
        console.log(`✓ Added ${c.table}.${c.name} column.`);
      }
    }

    console.log('Biology Laboratory migrations completed successfully.');
  } catch (err) {
    console.error('Biology Laboratory migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateBiologyLab()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateBiologyLab };
