'use strict';

const pool = require('../config/database');

async function findAll() {
  const [rows] = await pool.execute(`
    SELECT e.exam_id, e.title, e.duration, e.approval_status, e.is_broadcasted,
           e.classroom_id, e.subject_id, e.start_time, e.end_time,
           c.name AS classroom_name, s.name AS subject_name
    FROM exams e
    LEFT JOIN classrooms c ON c.id = e.classroom_id
    LEFT JOIN subjects s ON s.id = e.subject_id
    ORDER BY e.exam_id ASC
  `);
  return rows;
}

async function findAllApprovedAndBroadcasted() {
  const [rows] = await pool.execute(`
    SELECT exam_id, title, duration, classroom_id, subject_id, start_time, end_time
    FROM exams
    WHERE (approval_status = 'approved' AND is_broadcasted = TRUE)
       OR approval_status = 'approved'
    ORDER BY exam_id ASC
  `);
  return rows;
}

async function findForStudent(registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT DISTINCT e.exam_id, e.title, e.duration, e.classroom_id, e.subject_id,
                    e.start_time, e.end_time, c.name AS classroom_name, s.name AS subject_name
    FROM exams e
    LEFT JOIN classrooms c ON c.id = e.classroom_id
    LEFT JOIN subjects s ON s.id = e.subject_id
    LEFT JOIN classroom_enrollments en ON en.classroom_id = e.classroom_id AND en.status = 'active'
    WHERE (e.approval_status = 'approved' AND e.is_broadcasted = TRUE)
       OR (e.approval_status = 'approved' AND en.registration_number = ?)
    ORDER BY e.exam_id ASC
  `, [registrationNumber]);
  return rows;
}

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT e.exam_id, e.title, e.duration, e.approval_status, e.is_broadcasted,
           e.classroom_id, e.subject_id, e.start_time, e.end_time,
           s.name AS subject_name
    FROM exams e
    LEFT JOIN subjects s ON s.id = e.subject_id
    WHERE e.classroom_id = ?
    ORDER BY e.exam_id ASC
  `, [classroomId]);
  return rows;
}

async function findById(examId) {
  const [rows] = await pool.execute(`
    SELECT exam_id, title, duration, approval_status, is_broadcasted,
           classroom_id, subject_id, start_time, end_time, is_randomized, shuffle_options, instructions
    FROM exams
    WHERE exam_id = ?
    LIMIT 1
  `, [examId]);
  return rows[0] || null;
}

async function create(title, durationMinutes, classroomId = null, subjectId = null, startTime = null, endTime = null, instructions = null) {
  const [result] = await pool.execute(`
    INSERT INTO exams (title, duration, classroom_id, subject_id, start_time, end_time, instructions, approval_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'approved')
  `, [title, durationMinutes, classroomId, subjectId, startTime, endTime, instructions]);
  return result.insertId;
}

module.exports = {
  findAll,
  findAllApprovedAndBroadcasted,
  findForStudent,
  findByClassroom,
  findById,
  create
};
