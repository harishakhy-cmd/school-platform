'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId, studentRegistration = null) {
  let sql = `
    SELECT q.id, q.classroom_id, q.subject_id, q.title, q.description,
           q.duration_minutes, q.max_score, q.pass_score, q.start_date, q.end_date,
           q.is_published, q.created_by, q.created_at,
           s.name AS subject_name,
           (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS questions_count
  `;
  if (studentRegistration) {
    sql += `,
      att.id AS attempt_id, att.score, att.total_points, att.percentage,
      att.status AS attempt_status, att.start_time, att.end_time
    `;
  }
  sql += `
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
  `;
  if (studentRegistration) {
    sql += ` LEFT JOIN quiz_attempts att ON att.quiz_id = q.id AND att.registration_number = ? `;
  }
  sql += `
    WHERE q.classroom_id = ?
    ORDER BY q.created_at DESC
  `;

  const params = studentRegistration ? [studentRegistration, classroomId] : [classroomId];
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT q.id, q.classroom_id, q.subject_id, q.title, q.description,
           q.duration_minutes, q.max_score, q.pass_score, q.start_date, q.end_date,
           q.is_published, q.created_by, q.created_at,
           s.name AS subject_name
    FROM quizzes q
    LEFT JOIN subjects s ON s.id = q.subject_id
    WHERE q.id = ?
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

async function create(classroomId, title, description = null, durationMinutes = 15, maxScore = 100, passScore = 50, startDate = null, endDate = null, createdBy = null, subjectId = null) {
  const [result] = await pool.execute(`
    INSERT INTO quizzes (classroom_id, title, description, duration_minutes, max_score, pass_score, start_date, end_date, created_by, subject_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    classroomId,
    title,
    description ?? null,
    durationMinutes || 15,
    maxScore || 100,
    passScore || 50,
    startDate ?? null,
    endDate ?? null,
    createdBy ?? null,
    subjectId ?? null
  ]);
  return result.insertId;
}

async function deleteQuiz(id) {
  await pool.execute('DELETE FROM quizzes WHERE id = ?', [id]);
}

// Questions
async function findQuestionsByQuiz(quizId, includeAnswers = true) {
  let sql = 'SELECT id, quiz_id, question_text, option_a, option_b, option_c, option_d, points';
  if (includeAnswers) {
    sql += ', correct_answer, explanation';
  }
  sql += ' FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC';
  const [rows] = await pool.execute(sql, [quizId]);
  return rows;
}

async function addQuestion(quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, points = 1, explanation = null) {
  const [result] = await pool.execute(`
    INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_answer, points, explanation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [quizId, questionText, optionA, optionB, optionC, optionD, correctAnswer, points, explanation]);
  return result.insertId;
}

// Attempts
async function findAttempt(quizId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT id, quiz_id, registration_number, score, total_points, percentage, start_time, end_time, status
    FROM quiz_attempts
    WHERE quiz_id = ? AND registration_number = ?
    LIMIT 1
  `, [quizId, registrationNumber]);
  return rows[0] || null;
}

async function startAttempt(quizId, registrationNumber) {
  const [result] = await pool.execute(`
    INSERT INTO quiz_attempts (quiz_id, registration_number, start_time, status)
    VALUES (?, ?, NOW(), 'InProgress')
  `, [quizId, registrationNumber]);
  return result.insertId;
}

async function saveResponse(quizAttemptId, questionId, selectedOption, isCorrect) {
  await pool.execute(`
    INSERT INTO quiz_responses (quiz_attempt_id, question_id, selected_option, is_correct)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      selected_option = VALUES(selected_option),
      is_correct = VALUES(is_correct)
  `, [quizAttemptId, questionId, selectedOption, isCorrect ? 1 : 0]);
}

async function submitAttempt(attemptId, score, totalPoints, percentage) {
  await pool.execute(`
    UPDATE quiz_attempts 
    SET score = ?, total_points = ?, percentage = ?, end_time = NOW(), status = 'Submitted'
    WHERE id = ? AND status = 'InProgress'
  `, [score, totalPoints, percentage, attemptId]);
}

async function findAttemptResults(quizId, registrationNumber) {
  const attempt = await findAttempt(quizId, registrationNumber);
  if (!attempt) return null;
  const [responses] = await pool.execute(`
    SELECT r.question_id, r.selected_option, r.is_correct,
           q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_answer, q.explanation, q.points
    FROM quiz_responses r
    JOIN quiz_questions q ON q.id = r.question_id
    WHERE r.quiz_attempt_id = ?
  `, [attempt.id]);
  return { attempt, responses };
}

module.exports = {
  findByClassroom,
  findById,
  create,
  deleteQuiz,
  findQuestionsByQuiz,
  addQuestion,
  findAttempt,
  startAttempt,
  saveResponse,
  submitAttempt,
  findAttemptResults
};
