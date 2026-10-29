'use strict';

const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.execute(
    'SELECT id, academic_year, term_name, start_date, end_date, is_current, created_at FROM academic_terms ORDER BY id DESC'
  );
  return rows;
}

async function findCurrent() {
  const [rows] = await pool.execute(
    'SELECT id, academic_year, term_name, start_date, end_date, is_current FROM academic_terms WHERE is_current = TRUE LIMIT 1'
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, academic_year, term_name, start_date, end_date, is_current, created_at FROM academic_terms WHERE id = ? LIMIT 1',
    [id]
  );
  return rows[0] || null;
}

async function create(academicYear, termName, startDate = null, endDate = null, isCurrent = false) {
  if (isCurrent) {
    await pool.execute('UPDATE academic_terms SET is_current = FALSE');
  }
  const [result] = await pool.execute(
    'INSERT INTO academic_terms (academic_year, term_name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)',
    [academicYear, termName, startDate, endDate, isCurrent ? 1 : 0]
  );
  return result.insertId;
}

async function setCurrent(id) {
  await pool.execute('UPDATE academic_terms SET is_current = FALSE');
  await pool.execute('UPDATE academic_terms SET is_current = TRUE WHERE id = ?', [id]);
}

async function deleteTerm(id) {
  await pool.execute('DELETE FROM academic_terms WHERE id = ?', [id]);
}

module.exports = {
  findAll,
  findCurrent,
  findById,
  create,
  setCurrent,
  deleteTerm
};
