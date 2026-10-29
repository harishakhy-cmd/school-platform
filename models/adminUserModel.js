const pool = require('../config/database');

async function findByUsername(username) {
  const [rows] = await pool.execute(
    'SELECT id, username, password_hash, role, status, admin_code, created_by FROM admin_users WHERE username = ? LIMIT 1',
    [username]
  );
  return rows[0] || null;
}

async function create(username, passwordHash, role = 'ordinary_admin', status = 'pending', createdBy = null, adminCode = null) {
  const [result] = await pool.execute(
    'INSERT INTO admin_users (username, password_hash, role, status, created_by, admin_code) VALUES (?, ?, ?, ?, ?, ?)',
    [username, passwordHash, role, status, createdBy, adminCode]
  );
  return result.insertId;
}

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, username, role, status, admin_code, created_by, created_at FROM admin_users ORDER BY id'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, username, role, status, admin_code, created_by, created_at FROM admin_users WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByRole(role) {
  const [rows] = await pool.execute(
    'SELECT id, username, role, status, admin_code, created_at FROM admin_users WHERE role = ?',
    [role]
  );
  return rows;
}

async function updateRole(id, role) {
  await pool.execute(
    'UPDATE admin_users SET role = ? WHERE id = ?',
    [role, id]
  );
}

async function updateStatus(id, status) {
  await pool.execute(
    'UPDATE admin_users SET status = ? WHERE id = ?',
    [status, id]
  );
}

async function updateAdminCode(id, adminCode) {
  await pool.execute(
    'UPDATE admin_users SET admin_code = ? WHERE id = ?',
    [adminCode, id]
  );
}

async function countByRole(role) {
  const [rows] = await pool.execute(
    'SELECT COUNT(*) as count FROM admin_users WHERE role = ?',
    [role]
  );
  return rows[0]?.count || 0;
}

async function findPendingAdmins() {
  const [rows] = await pool.execute(
    'SELECT id, username, role, status, admin_code, created_by, created_at FROM admin_users WHERE status = \'pending\''
  );
  return rows;
}

async function findActiveAdmins() {
  const [rows] = await pool.execute(
    'SELECT id, username, role, status, admin_code, created_by, created_at FROM admin_users WHERE status = \'active\''
  );
  return rows;
}

async function updatePassword(id, newPasswordHash) {
  await pool.execute(
    'UPDATE admin_users SET password_hash = ? WHERE id = ?',
    [newPasswordHash, id]
  );
}

module.exports = { 
  findByUsername, 
  create, 
  findAll, 
  findById, 
  findByRole,
  updateRole,
  updateStatus,
  updateAdminCode,
  updatePassword,
  countByRole,
  findPendingAdmins,
  findActiveAdmins
};