const pool = require('../config/database');

async function findByRegistration(registrationNumber) {
  const [rows] = await pool.execute(
    'SELECT registration_number, name, admin_id, profile_photo_url FROM students WHERE registration_number = ? LIMIT 1',
    [registrationNumber]
  );
  return rows[0] || null;
}

async function updateProfilePhoto(registrationNumber, photoUrl) {
  const [result] = await pool.execute(
    'UPDATE students SET profile_photo_url = ? WHERE registration_number = ?',
    [photoUrl, registrationNumber]
  );
  return result.affectedRows > 0;
}

async function create(registrationNumber, name, adminId = null) {
  await pool.execute(
    'INSERT INTO students (registration_number, name, admin_id) VALUES (?, ?, ?)',
    [registrationNumber, name, adminId]
  );
}

async function updateAdmin(registrationNumber, adminId) {
  await pool.execute(
    'UPDATE students SET admin_id = ? WHERE registration_number = ?',
    [adminId, registrationNumber]
  );
}

async function findByAdmin(adminId) {
  const [rows] = await pool.execute(
    'SELECT registration_number, name, admin_id FROM students WHERE admin_id = ? OR admin_id IS NULL',
    [adminId]
  );
  return rows;
}

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT registration_number, name, admin_id FROM students'
  );
  return rows;
}

module.exports = { findByRegistration, create, updateAdmin, updateProfilePhoto, findByAdmin, findAll };