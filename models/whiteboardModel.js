'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT id, classroom_id, canvas_data, last_updated_by, updated_at
    FROM whiteboard_states
    WHERE classroom_id = ?
    LIMIT 1
  `, [classroomId]);
  return rows[0] || null;
}

async function saveState(classroomId, canvasData, updatedBy) {
  await pool.execute(`
    INSERT INTO whiteboard_states (classroom_id, canvas_data, last_updated_by)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      canvas_data = VALUES(canvas_data),
      last_updated_by = VALUES(last_updated_by),
      updated_at = CURRENT_TIMESTAMP
  `, [classroomId, canvasData, updatedBy]);
}

async function clearState(classroomId, updatedBy) {
  await pool.execute(`
    UPDATE whiteboard_states 
    SET canvas_data = NULL, last_updated_by = ?, updated_at = CURRENT_TIMESTAMP
    WHERE classroom_id = ?
  `, [updatedBy, classroomId]);
}

module.exports = {
  findByClassroom,
  saveState,
  clearState
};
