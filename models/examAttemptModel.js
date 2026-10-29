const pool = require('../config/database');

async function findByStudentExam(registrationNumber, examId) {
  const [rows] = await pool.execute(
    `SELECT ea.id, ea.registration_number, ea.exam_id, ea.start_time, ea.end_time,
            ea.status, ea.session_token, ea.question_order, ea.score,
            e.duration AS duration_minutes
     FROM exam_attempts ea
     JOIN exams e ON e.exam_id = ea.exam_id
     WHERE ea.registration_number = ? AND ea.exam_id = ?
     LIMIT 1`,
    [registrationNumber, examId]
  );
  const row = rows[0];
  if (row && row.question_order != null && typeof row.question_order === 'string') {
    try {
      row.question_order = JSON.parse(row.question_order);
    } catch {
      row.question_order = null;
    }
  }
  return row || null;
}

async function createAttempt(registrationNumber, examId, sessionToken, questionOrderJson) {
  const [result] = await pool.execute(
    `INSERT INTO exam_attempts
      (registration_number, exam_id, start_time, status, session_token, question_order)
     VALUES (?, ?, NOW(), 'InProgress', ?, ?)`,
    [registrationNumber, examId, sessionToken, JSON.stringify(questionOrderJson)]
  );
  return result.insertId;
}

async function updateSessionToken(attemptId, sessionToken) {
  await pool.execute(
    'UPDATE exam_attempts SET session_token = ? WHERE id = ? AND status = ?',
    [sessionToken, attemptId, 'InProgress']
  );
}

async function submitAttempt(attemptId, score) {
  await pool.execute(
    `UPDATE exam_attempts
     SET status = 'Submitted', end_time = NOW(), score = ?
     WHERE id = ? AND status = 'InProgress'`,
    [score, attemptId]
  );
}

async function findInProgressOtherExam(registrationNumber, examId) {
  const [rows] = await pool.execute(
    `SELECT exam_id FROM exam_attempts
     WHERE registration_number = ? AND status = 'InProgress' AND exam_id != ?
     LIMIT 1`,
    [registrationNumber, examId]
  );
  return rows[0] || null;
}

module.exports = {
  findByStudentExam,
  createAttempt,
  updateSessionToken,
  submitAttempt,
  findInProgressOtherExam
};
