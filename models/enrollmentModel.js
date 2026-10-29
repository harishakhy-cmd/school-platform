'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT e.id, e.classroom_id, e.registration_number, e.status, e.enrolled_at,
           s.name AS student_name
    FROM classroom_enrollments e
    JOIN students s ON s.registration_number = e.registration_number
    WHERE e.classroom_id = ?
    ORDER BY s.name ASC
  `, [classroomId]);
  return rows;
}

async function findEnrollment(classroomId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT id, classroom_id, registration_number, status, enrolled_at
    FROM classroom_enrollments
    WHERE classroom_id = ? AND registration_number = ?
    LIMIT 1
  `, [classroomId, registrationNumber]);
  return rows[0] || null;
}

async function isEnrolled(classroomId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT 1 FROM classroom_enrollments
    WHERE classroom_id = ? AND registration_number = ? AND status = 'active'
    LIMIT 1
  `, [classroomId, registrationNumber]);
  return rows.length > 0;
}

async function enrollStudent(classroomId, registrationNumber, status = 'active') {
  const [result] = await pool.execute(`
    INSERT INTO classroom_enrollments (classroom_id, registration_number, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status)
  `, [classroomId, registrationNumber, status]);
  return result.insertId;
}

async function removeStudent(classroomId, registrationNumber) {
  await pool.execute(
    'DELETE FROM classroom_enrollments WHERE classroom_id = ? AND registration_number = ?',
    [classroomId, registrationNumber]
  );
}

async function updateStatus(classroomId, registrationNumber, status) {
  await pool.execute(
    'UPDATE classroom_enrollments SET status = ? WHERE classroom_id = ? AND registration_number = ?',
    [status, classroomId, registrationNumber]
  );
}

module.exports = {
  findByClassroom,
  findEnrollment,
  isEnrolled,
  enrollStudent,
  removeStudent,
  updateStatus
};
