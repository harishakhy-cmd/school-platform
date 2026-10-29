'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT l.id, l.classroom_id, l.title, l.tutor_id, l.session_code,
           l.status, l.started_at, l.ended_at, l.created_at,
           u.full_name AS tutor_name
    FROM live_sessions l
    JOIN admin_users u ON u.id = l.tutor_id
    WHERE l.classroom_id = ?
    ORDER BY l.created_at DESC
  `, [classroomId]);
  return rows;
}

async function findActiveSession(classroomId) {
  const [rows] = await pool.execute(`
    SELECT l.id, l.classroom_id, l.title, l.tutor_id, l.session_code,
           l.status, l.started_at, l.ended_at, l.created_at,
           u.full_name AS tutor_name
    FROM live_sessions l
    JOIN admin_users u ON u.id = l.tutor_id
    WHERE l.classroom_id = ? AND l.status = 'live'
    LIMIT 1
  `, [classroomId]);
  return rows[0] || null;
}

async function findBySessionCode(sessionCode) {
  const [rows] = await pool.execute(`
    SELECT l.id, l.classroom_id, l.title, l.tutor_id, l.session_code,
           l.status, l.started_at, l.ended_at, l.created_at,
           u.full_name AS tutor_name
    FROM live_sessions l
    JOIN admin_users u ON u.id = l.tutor_id
    WHERE l.session_code = ?
    LIMIT 1
  `, [sessionCode]);
  return rows[0] || null;
}

async function create(classroomId, title, tutorId, sessionCode) {
  const [result] = await pool.execute(`
    INSERT INTO live_sessions (classroom_id, title, tutor_id, session_code, status, started_at)
    VALUES (?, ?, ?, ?, 'live', NOW())
  `, [classroomId, title, tutorId, sessionCode]);
  return result.insertId;
}

async function endSession(sessionId, tutorId) {
  await pool.execute(`
    UPDATE live_sessions 
    SET status = 'ended', ended_at = NOW()
    WHERE id = ? AND tutor_id = ?
  `, [sessionId, tutorId]);
}

module.exports = {
  findByClassroom,
  findActiveSession,
  findBySessionCode,
  create,
  endSession
};
