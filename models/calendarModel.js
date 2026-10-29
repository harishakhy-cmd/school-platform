'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT id, classroom_id, title, description, event_type, start_time, end_time, reference_id, created_by, created_at
    FROM calendar_events
    WHERE classroom_id = ? OR classroom_id IS NULL
    ORDER BY start_time ASC
  `, [classroomId]);
  return rows;
}

async function findForStudent(registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT e.id, e.classroom_id, e.title, e.description, e.event_type, e.start_time, e.end_time, e.reference_id, e.created_at,
           c.name AS classroom_name
    FROM calendar_events e
    LEFT JOIN classrooms c ON c.id = e.classroom_id
    WHERE e.classroom_id IS NULL
       OR e.classroom_id IN (
         SELECT classroom_id FROM classroom_enrollments WHERE registration_number = ? AND status = 'active'
       )
    ORDER BY e.start_time ASC
  `, [registrationNumber]);
  return rows;
}

async function findForTutor(tutorId) {
  const [rows] = await pool.execute(`
    SELECT e.id, e.classroom_id, e.title, e.description, e.event_type, e.start_time, e.end_time, e.reference_id, e.created_at,
           c.name AS classroom_name
    FROM calendar_events e
    LEFT JOIN classrooms c ON c.id = e.classroom_id
    WHERE e.classroom_id IS NULL
       OR e.classroom_id IN (
         SELECT id FROM classrooms WHERE tutor_id = ?
       )
    ORDER BY e.start_time ASC
  `, [tutorId]);
  return rows;
}

async function create(classroomId, title, description, eventType, startTime, endTime, referenceId = null, createdBy = null) {
  const [result] = await pool.execute(`
    INSERT INTO calendar_events (classroom_id, title, description, event_type, start_time, end_time, reference_id, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [classroomId, title, description, eventType, startTime, endTime, referenceId, createdBy]);
  return result.insertId;
}

async function deleteEvent(id) {
  await pool.execute('DELETE FROM calendar_events WHERE id = ?', [id]);
}

module.exports = {
  findByClassroom,
  findForStudent,
  findForTutor,
  create,
  deleteEvent
};
