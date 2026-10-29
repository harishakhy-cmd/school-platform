'use strict';

const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.execute(`
    SELECT u.id, u.username, u.full_name, u.email, u.role, u.status, u.admin_code,
           t.id AS tutor_profile_id, t.specialization, t.phone, t.bio, u.created_at
    FROM admin_users u
    LEFT JOIN tutors t ON t.admin_user_id = u.id
    WHERE u.role = 'tutor' OR u.role = 'ordinary_admin'
    ORDER BY u.full_name ASC, u.username ASC
  `);
  return rows;
}

async function findById(adminUserId) {
  const [rows] = await pool.execute(`
    SELECT u.id, u.username, u.full_name, u.email, u.role, u.status, u.admin_code,
           t.id AS tutor_profile_id, t.specialization, t.phone, t.bio, u.created_at
    FROM admin_users u
    LEFT JOIN tutors t ON t.admin_user_id = u.id
    WHERE u.id = ?
    LIMIT 1
  `, [adminUserId]);
  return rows[0] || null;
}

async function upsertProfile(adminUserId, specialization = null, phone = null, bio = null) {
  await pool.execute(`
    INSERT INTO tutors (admin_user_id, specialization, phone, bio)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      specialization = VALUES(specialization),
      phone = VALUES(phone),
      bio = VALUES(bio)
  `, [adminUserId, specialization, phone, bio]);
}

module.exports = {
  findAll,
  findById,
  upsertProfile
};
