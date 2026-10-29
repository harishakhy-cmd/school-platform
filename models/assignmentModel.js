'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId, studentRegistration = null) {
  let sql = `
    SELECT a.id, a.classroom_id, a.subject_id, a.title, a.instructions,
           a.max_marks, a.available_date, a.deadline, a.allow_late_submission,
           a.attachment_path, a.created_by, a.created_at,
           s.name AS subject_name,
           (SELECT COUNT(*) FROM assignment_submissions WHERE assignment_id = a.id) AS submissions_count
  `;
  if (studentRegistration) {
    sql += `,
      sub.id AS submission_id, sub.submitted_at, sub.is_late, sub.score,
      sub.status AS submission_status, sub.feedback, sub.file_name AS submitted_file
    `;
  }
  sql += `
    FROM assignments a
    LEFT JOIN subjects s ON s.id = a.subject_id
  `;
  if (studentRegistration) {
    sql += ` LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.registration_number = ? `;
  }
  sql += `
    WHERE a.classroom_id = ?
    ORDER BY a.deadline ASC
  `;

  const params = studentRegistration ? [studentRegistration, classroomId] : [classroomId];
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function findById(id, studentRegistration = null) {
  let sql = `
    SELECT a.id, a.classroom_id, a.subject_id, a.title, a.instructions,
           a.max_marks, a.available_date, a.deadline, a.allow_late_submission,
           a.attachment_path, a.created_by, a.created_at,
           s.name AS subject_name
  `;
  if (studentRegistration) {
    sql += `,
      sub.id AS submission_id, sub.submission_text, sub.file_path AS submitted_file_path,
      sub.file_name AS submitted_file_name, sub.submitted_at, sub.is_late, sub.score,
      sub.status AS submission_status, sub.feedback
    `;
  }
  sql += `
    FROM assignments a
    LEFT JOIN subjects s ON s.id = a.subject_id
  `;
  if (studentRegistration) {
    sql += ` LEFT JOIN assignment_submissions sub ON sub.assignment_id = a.id AND sub.registration_number = ? `;
  }
  sql += `
    WHERE a.id = ?
    LIMIT 1
  `;
  const params = studentRegistration ? [studentRegistration, id] : [id];
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function create(classroomId, title, instructions, maxMarks = 100, availableDate = null, deadline = null, allowLateSubmission = false, attachmentPath = null, createdBy = null, subjectId = null) {
  const [result] = await pool.execute(`
    INSERT INTO assignments (classroom_id, title, instructions, max_marks, available_date, deadline, allow_late_submission, attachment_path, created_by, subject_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    classroomId,
    title,
    instructions,
    maxMarks || 100,
    availableDate || new Date(),
    deadline,
    allowLateSubmission ? 1 : 0,
    attachmentPath ?? null,
    createdBy ?? null,
    subjectId ?? null
  ]);
  return result.insertId;
}

async function update(id, title, instructions, maxMarks, availableDate, deadline, allowLateSubmission, attachmentPath = null, subjectId = null) {
  await pool.execute(`
    UPDATE assignments 
    SET title = ?, instructions = ?, max_marks = ?, available_date = ?, deadline = ?, allow_late_submission = ?, attachment_path = COALESCE(?, attachment_path), subject_id = ?
    WHERE id = ?
  `, [title, instructions, maxMarks, availableDate, deadline, allowLateSubmission ? 1 : 0, attachmentPath, subjectId, id]);
}

async function deleteAssignment(id) {
  await pool.execute('DELETE FROM assignments WHERE id = ?', [id]);
}

// Submissions
async function findSubmissionsByAssignment(assignmentId) {
  const [rows] = await pool.execute(`
    SELECT sub.id, sub.assignment_id, sub.registration_number, sub.submission_text,
           sub.file_path, sub.file_name, sub.submitted_at, sub.is_late, sub.score,
           sub.graded_by, sub.graded_at, sub.feedback, sub.status,
           s.name AS student_name,
           u.full_name AS grader_name
    FROM assignment_submissions sub
    JOIN students s ON s.registration_number = sub.registration_number
    LEFT JOIN admin_users u ON u.id = sub.graded_by
    WHERE sub.assignment_id = ?
    ORDER BY sub.submitted_at DESC
  `, [assignmentId]);
  return rows;
}

async function findStudentSubmission(assignmentId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT id, assignment_id, registration_number, submission_text, file_path, file_name,
           submitted_at, is_late, score, graded_by, graded_at, feedback, status
    FROM assignment_submissions
    WHERE assignment_id = ? AND registration_number = ?
    LIMIT 1
  `, [assignmentId, registrationNumber]);
  return rows[0] || null;
}

async function submitAssignment(assignmentId, registrationNumber, submissionText, filePath, fileName, isLate) {
  const [result] = await pool.execute(`
    INSERT INTO assignment_submissions (assignment_id, registration_number, submission_text, file_path, file_name, is_late, status)
    VALUES (?, ?, ?, ?, ?, ?, 'submitted')
    ON DUPLICATE KEY UPDATE 
      submission_text = VALUES(submission_text),
      file_path = VALUES(file_path),
      file_name = VALUES(file_name),
      is_late = VALUES(is_late),
      submitted_at = CURRENT_TIMESTAMP,
      status = 'submitted'
  `, [assignmentId, registrationNumber, submissionText, filePath, fileName, isLate ? 1 : 0]);
  return result.insertId;
}

async function gradeSubmission(submissionId, score, feedback, gradedBy) {
  await pool.execute(`
    UPDATE assignment_submissions 
    SET score = ?, feedback = ?, graded_by = ?, graded_at = CURRENT_TIMESTAMP, status = 'graded'
    WHERE id = ?
  `, [score, feedback, gradedBy, submissionId]);
}

module.exports = {
  findByClassroom,
  findById,
  create,
  update,
  deleteAssignment,
  findSubmissionsByAssignment,
  findStudentSubmission,
  submitAssignment,
  gradeSubmission
};
