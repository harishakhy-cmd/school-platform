'use strict';

const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, name, code, description, created_at FROM subjects ORDER BY name ASC'
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, code, description, created_at FROM subjects WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function findByCode(code) {
  const [rows] = await pool.execute(
    'SELECT id, name, code, description, created_at FROM subjects WHERE code = ? LIMIT 1',
    [code]
  );
  return rows[0] || null;
}

async function create(name, code, description = null) {
  const [result] = await pool.execute(
    'INSERT INTO subjects (name, code, description) VALUES (?, ?, ?)',
    [name, code, description]
  );
  return result.insertId;
}

async function update(id, name, code, description = null) {
  await pool.execute(
    'UPDATE subjects SET name = ?, code = ?, description = ? WHERE id = ?',
    [name, code, description, id]
  );
}

async function deleteSubject(id) {
  await pool.execute('DELETE FROM subjects WHERE id = ?', [id]);
}

module.exports = {
  findAll,
  findById,
  findByCode,
  create,
  update,
  deleteSubject
};
