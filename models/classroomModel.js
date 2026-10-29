'use strict';

const pool = require('../config/database');

async function findAll(includeArchived = false) {
  let sql = `
    SELECT c.id, c.name, c.class_code, c.class_id, c.subject_id, c.term_id, c.tutor_id,
           c.description, c.is_archived, c.created_at, c.updated_at,
           cl.name AS class_name, cl.code AS class_grade_code,
           s.name AS subject_name, s.code AS subject_code,
           t.term_name, t.academic_year,
           u.full_name AS tutor_name, u.username AS tutor_username,
           (SELECT COUNT(*) FROM classroom_enrollments WHERE classroom_id = c.id AND status = 'active') AS student_count
    FROM classrooms c
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN subjects s ON s.id = c.subject_id
    LEFT JOIN academic_terms t ON t.id = c.term_id
    LEFT JOIN admin_users u ON u.id = c.tutor_id
  `;
  if (!includeArchived) {
    sql += ' WHERE c.is_archived = FALSE ';
  }
  sql += ' ORDER BY c.created_at DESC';
  const [rows] = await pool.execute(sql);
  return rows;
}

async function findByTutor(tutorId, includeArchived = false) {
  let sql = `
    SELECT c.id, c.name, c.class_code, c.class_id, c.subject_id, c.term_id, c.tutor_id,
           c.description, c.is_archived, c.created_at, c.updated_at,
           cl.name AS class_name, cl.code AS class_grade_code,
           s.name AS subject_name, s.code AS subject_code,
           t.term_name, t.academic_year,
           u.full_name AS tutor_name, u.username AS tutor_username,
           (SELECT COUNT(*) FROM classroom_enrollments WHERE classroom_id = c.id AND status = 'active') AS student_count
    FROM classrooms c
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN subjects s ON s.id = c.subject_id
    LEFT JOIN academic_terms t ON t.id = c.term_id
    LEFT JOIN admin_users u ON u.id = c.tutor_id
    WHERE c.tutor_id = ?
  `;
  if (!includeArchived) {
    sql += ' AND c.is_archived = FALSE ';
  }
  sql += ' ORDER BY c.created_at DESC';
  const [rows] = await pool.execute(sql, [tutorId]);
  return rows;
}

async function findByStudent(registrationNumber, includeArchived = false) {
  let sql = `
    SELECT c.id, c.name, c.class_code, c.class_id, c.subject_id, c.term_id, c.tutor_id,
           c.description, c.is_archived, c.created_at, c.updated_at,
           cl.name AS class_name, cl.code AS class_grade_code,
           s.name AS subject_name, s.code AS subject_code,
           t.term_name, t.academic_year,
           u.full_name AS tutor_name, u.username AS tutor_username,
           e.enrolled_at, e.status AS enrollment_status
    FROM classroom_enrollments e
    JOIN classrooms c ON c.id = e.classroom_id
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN subjects s ON s.id = c.subject_id
    LEFT JOIN academic_terms t ON t.id = c.term_id
    LEFT JOIN admin_users u ON u.id = c.tutor_id
    WHERE e.registration_number = ? AND e.status = 'active'
  `;
  if (!includeArchived) {
    sql += ' AND c.is_archived = FALSE ';
  }
  sql += ' ORDER BY c.created_at DESC';
  const [rows] = await pool.execute(sql, [registrationNumber]);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT c.id, c.name, c.class_code, c.class_id, c.subject_id, c.term_id, c.tutor_id,
           c.description, c.is_archived, c.created_at, c.updated_at,
           cl.name AS class_name, cl.code AS class_grade_code,
           s.name AS subject_name, s.code AS subject_code,
           t.term_name, t.academic_year,
           u.full_name AS tutor_name, u.username AS tutor_username,
           (SELECT COUNT(*) FROM classroom_enrollments WHERE classroom_id = c.id AND status = 'active') AS student_count
    FROM classrooms c
    LEFT JOIN classes cl ON cl.id = c.class_id
    LEFT JOIN subjects s ON s.id = c.subject_id
    LEFT JOIN academic_terms t ON t.id = c.term_id
    LEFT JOIN admin_users u ON u.id = c.tutor_id
    WHERE c.id = ?
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

async function findByClassCode(classCode) {
  const [rows] = await pool.execute(`
    SELECT c.id, c.name, c.class_code, c.class_id, c.subject_id, c.term_id, c.tutor_id,
           c.description, c.is_archived, c.created_at, c.updated_at
    FROM classrooms c
    WHERE c.class_code = ?
    LIMIT 1
  `, [classCode]);
  return rows[0] || null;
}

async function create(name, classCode, classId = null, subjectId = null, termId = null, tutorId = null, description = null) {
  const [result] = await pool.execute(`
    INSERT INTO classrooms (name, class_code, class_id, subject_id, term_id, tutor_id, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [name, classCode, classId, subjectId, termId, tutorId, description]);
  return result.insertId;
}

async function update(id, name, classId = null, subjectId = null, termId = null, tutorId = null, description = null) {
  await pool.execute(`
    UPDATE classrooms 
    SET name = ?, class_id = ?, subject_id = ?, term_id = ?, tutor_id = ?, description = ?
    WHERE id = ?
  `, [name, classId, subjectId, termId, tutorId, description, id]);
}

async function setArchived(id, isArchived) {
  await pool.execute('UPDATE classrooms SET is_archived = ? WHERE id = ?', [isArchived ? 1 : 0, id]);
}

async function deleteClassroom(id) {
  await pool.execute('DELETE FROM classrooms WHERE id = ?', [id]);
}

module.exports = {
  findAll,
  findByTutor,
  findByStudent,
  findById,
  findByClassCode,
  create,
  update,
  setArchived,
  deleteClassroom
};
