'use strict';

const pool = require('../config/database');

async function migrateGeographyLab() {
  console.log('Running Geography Lab schema migrations...');

  const fieldworkTable = `
    CREATE TABLE IF NOT EXISTS \`geography_fieldwork\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_id\` INT NOT NULL,
      \`user_role\` ENUM('student', 'tutor', 'admin') DEFAULT 'student',
      \`user_identifier\` VARCHAR(100) NOT NULL,
      \`classroom_id\` INT DEFAULT NULL,
      \`title\` VARCHAR(255) NOT NULL,
      \`site_name\` VARCHAR(255) NOT NULL,
      \`latitude\` DECIMAL(10, 7) NOT NULL,
      \`longitude\` DECIMAL(10, 7) NOT NULL,
      \`elevation\` DECIMAL(8, 2) DEFAULT NULL,
      \`landform_type\` VARCHAR(100) DEFAULT NULL,
      \`topic_code\` VARCHAR(64) DEFAULT 'fieldwork',
      \`observations\` TEXT,
      \`measurements_json\` JSON,
      \`photos_json\` JSON,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_geo_fw_user\` (\`user_identifier\`),
      INDEX \`idx_geo_fw_class\` (\`classroom_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  const savedMapsTable = `
    CREATE TABLE IF NOT EXISTS \`geography_saved_maps\` (
      \`id\` INT AUTO_INCREMENT PRIMARY KEY,
      \`user_identifier\` VARCHAR(100) NOT NULL,
      \`user_role\` ENUM('student', 'tutor', 'admin') DEFAULT 'student',
      \`title\` VARCHAR(255) NOT NULL,
      \`topic_code\` VARCHAR(64) NOT NULL DEFAULT 'cartography',
      \`center_lat\` DECIMAL(10, 7) NOT NULL DEFAULT 1.3733,
      \`center_lng\` DECIMAL(10, 7) NOT NULL DEFAULT 32.2903,
      \`zoom_level\` INT NOT NULL DEFAULT 7,
      \`active_layers_json\` JSON,
      \`annotations_json\` JSON,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX \`idx_geo_sm_user\` (\`user_identifier\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(fieldworkTable);
    console.log('✓ geography_fieldwork table ready.');
    await pool.query(savedMapsTable);
    console.log('✓ geography_saved_maps table ready.');

    // Add geo_config and geo_target columns if missing
    const dbName = process.env.DB_NAME || 'cbt_db';
    const colsToAdd = [
      { table: 'questions', name: 'geo_config', sql: 'ALTER TABLE questions ADD COLUMN geo_config JSON NULL AFTER graph_target' },
      { table: 'questions', name: 'geo_target', sql: 'ALTER TABLE questions ADD COLUMN geo_target JSON NULL AFTER geo_config' },
      { table: 'quiz_questions', name: 'geo_config', sql: 'ALTER TABLE quiz_questions ADD COLUMN geo_config JSON NULL AFTER graph_target' },
      { table: 'quiz_questions', name: 'geo_target', sql: 'ALTER TABLE quiz_questions ADD COLUMN geo_target JSON NULL AFTER geo_config' },
      { table: 'assignments', name: 'geo_config', sql: 'ALTER TABLE assignments ADD COLUMN geo_config JSON NULL AFTER requires_graph' },
      { table: 'assignments', name: 'requires_map', sql: 'ALTER TABLE assignments ADD COLUMN requires_map BOOLEAN DEFAULT FALSE AFTER geo_config' }
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

    console.log('Geography Lab migrations completed successfully.');
  } catch (err) {
    console.error('Geography Lab migration failed:', err);
    throw err;
  }
}

if (require.main === module) {
  migrateGeographyLab()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { migrateGeographyLab };
