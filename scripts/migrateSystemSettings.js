'use strict';

require('dotenv').config();
const pool = require('../config/database');

const DEFAULT_SETTINGS = [
  // General Platform
  { key: 'institution_name', value: 'Apex CBT & Virtual Academy', category: 'general', description: 'Official name of the school or testing institution' },
  { key: 'institution_tagline', value: 'Computer-Based Testing & Interactive Virtual Classroom Hub', category: 'general', description: 'School motto or platform tagline' },
  { key: 'support_email', value: 'admin@apex-cbt.edu', category: 'general', description: 'Official contact and student support email' },
  { key: 'support_phone', value: '+1 (800) 555-0199', category: 'general', description: 'Helpline phone number displayed on portal' },
  { key: 'maintenance_mode', value: 'false', category: 'general', description: 'When enabled, only administrators can access the platform' },
  { key: 'maintenance_message', value: 'The examination portal is currently undergoing scheduled maintenance. Please check back shortly.', category: 'general', description: 'Announcement displayed to students during maintenance' },
  { key: 'session_timeout_minutes', value: '60', category: 'general', description: 'Inactivity session timeout in minutes' },

  // CBT Exam Security & Policies
  { key: 'cbt_pass_percentage', value: '50', category: 'exam', description: 'Minimum percentage score required to pass exams' },
  { key: 'cbt_tab_switch_limit', value: '3', category: 'exam', description: 'Maximum window blur / tab-switch warnings before automatic test submission' },
  { key: 'cbt_enforce_fullscreen', value: 'true', category: 'exam', description: 'Force full-screen mode during CBT examinations' },
  { key: 'cbt_disable_copy_paste', value: 'true', category: 'exam', description: 'Disable right-click, context menu, text selection, and copy-paste during exams' },
  { key: 'cbt_auto_submit_timer', value: 'true', category: 'exam', description: 'Automatically submit student responses when countdown timer reaches 00:00' },
  { key: 'cbt_show_instant_result', value: 'true', category: 'exam', description: 'Display immediate scores and question breakdowns to students upon exam submission' },
  { key: 'cbt_shuffle_questions_default', value: 'true', category: 'exam', description: 'Default randomization of question order for newly created exams' },
  { key: 'cbt_shuffle_options_default', value: 'true', category: 'exam', description: 'Default shuffling of answer choices (A, B, C, D) for each student' },

  // Live Classroom Defaults
  { key: 'live_default_student_mic', value: 'false', category: 'live', description: 'Allow students to speak / unmute their microphones upon joining live sessions' },
  { key: 'live_default_student_cam', value: 'false', category: 'live', description: 'Allow students to broadcast live webcams upon joining live sessions' },
  { key: 'live_default_student_whiteboard', value: 'true', category: 'live', description: 'Grant drawing and annotation tools on collaborative whiteboard' },
  { key: 'live_default_student_chat', value: 'true', category: 'live', description: 'Enable real-time messaging drawer for classroom attendees' },
  { key: 'live_max_participants', value: '150', category: 'live', description: 'Maximum concurrent video/audio participants per live room' }
];

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('Running system_settings table migration...');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'general',
        description VARCHAR(255) NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_settings_category (category)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
    console.log('✓ system_settings table created (or exists)');

    for (const s of DEFAULT_SETTINGS) {
      await conn.query(`
        INSERT INTO system_settings (setting_key, setting_value, category, description)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          description = VALUES(description),
          category = VALUES(category)
      `, [s.key, s.value, s.category, s.description]);
    }
    console.log(`✓ Seeded/verified ${DEFAULT_SETTINGS.length} system settings`);

  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
