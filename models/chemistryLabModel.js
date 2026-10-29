'use strict';

const pool = require('../config/database');

async function listRuns(ownerRole, ownerIdentifier) {
  const [rows] = await pool.execute(
    'SELECT id, title, experiment_key, version, status, created_at, updated_at FROM chemistry_lab_runs WHERE owner_role = ? AND owner_identifier = ? ORDER BY updated_at DESC',
    [ownerRole, ownerIdentifier]
  );
  return rows;
}

async function findRun(id, ownerRole, ownerIdentifier) {
  const [rows] = await pool.execute(
    'SELECT id, title, experiment_key, version, status, state_json, notebook_json, created_at, updated_at FROM chemistry_lab_runs WHERE id = ? AND owner_role = ? AND owner_identifier = ? LIMIT 1',
    [id, ownerRole, ownerIdentifier]
  );
  return rows[0] || null;
}

async function saveRun(run) {
  const [result] = await pool.execute(
    `INSERT INTO chemistry_lab_runs
      (owner_role, owner_identifier, title, experiment_key, version, state_json, notebook_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [run.ownerRole, run.ownerIdentifier, run.title, run.experimentKey, run.version,
      JSON.stringify(run.state), JSON.stringify(run.notebook)]
  );
  return result.insertId || run.id;
}

async function updateRun(id, run) {
  const [result] = await pool.execute(
    `UPDATE chemistry_lab_runs
     SET title = ?, experiment_key = ?, version = ?, state_json = ?, notebook_json = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND owner_role = ? AND owner_identifier = ?`,
    [run.title, run.experimentKey, run.version, JSON.stringify(run.state),
      JSON.stringify(run.notebook), id, run.ownerRole, run.ownerIdentifier]
  );
  if (result.affectedRows > 0) return true;
  const [rows] = await pool.execute(
    'SELECT id FROM chemistry_lab_runs WHERE id = ? AND owner_role = ? AND owner_identifier = ? LIMIT 1',
    [id, run.ownerRole, run.ownerIdentifier]
  );
  return rows.length > 0;
}

module.exports = { listRuns, findRun, saveRun, updateRun };
