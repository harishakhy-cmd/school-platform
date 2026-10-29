'use strict';

require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Running live features migration...');

    // 1. Create live_chat_messages table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS live_chat_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        classroom_id INT NOT NULL,
        session_id INT NULL,
        sender_type ENUM('student','tutor','admin') NOT NULL,
        sender_id VARCHAR(64) NOT NULL,
        sender_name VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        is_reaction BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_chat_classroom (classroom_id),
        INDEX idx_chat_session (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ live_chat_messages table created (or already exists)');

    // 2. Add whiteboard_edit_enabled to live_sessions if missing
    const [cols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'live_sessions'
        AND COLUMN_NAME = 'whiteboard_edit_enabled'
    `);
    if (cols.length === 0) {
      await conn.query(`
        ALTER TABLE live_sessions
          ADD COLUMN whiteboard_edit_enabled BOOLEAN DEFAULT TRUE,
          ADD COLUMN chat_enabled BOOLEAN DEFAULT TRUE
      `);
      console.log('✓ Added whiteboard_edit_enabled + chat_enabled to live_sessions');
    } else {
      console.log('✓ whiteboard_edit_enabled already exists in live_sessions');
    }

    // 3. Add livekit_room_name to live_sessions if missing
    const [lkCols] = await conn.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'live_sessions'
        AND COLUMN_NAME = 'livekit_room_name'
    `);
    if (lkCols.length === 0) {
      await conn.query(`
        ALTER TABLE live_sessions
          ADD COLUMN livekit_room_name VARCHAR(128) NULL
      `);
      console.log('✓ Added livekit_room_name to live_sessions');
    } else {
      console.log('✓ livekit_room_name already exists in live_sessions');
    }

    console.log('\nMigration complete!');
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
