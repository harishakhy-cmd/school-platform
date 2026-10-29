const pool = require('../config/database');

async function findIdsByExam(examId) {
  const [rows] = await pool.execute(
    'SELECT question_id FROM questions WHERE exam_id = ? ORDER BY question_id ASC',
    [examId]
  );
  return rows.map((r) => r.question_id);
}

async function findPublicByIds(questionIds) {
  if (!questionIds.length) return [];
  const placeholders = questionIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT question_id, exam_id, question_text, rich_text_content, option_a, option_b, option_c, option_d, question_type, supports_formatting, graph_config, graph_target, geo_config, geo_target
     FROM questions WHERE question_id IN (${placeholders})`,
    questionIds
  );
  const map = new Map(rows.map((r) => [r.question_id, r]));
  return questionIds.map((id) => map.get(id)).filter(Boolean);
}

async function findWithAnswersByExamForGrading(examId, registrationNumber) {
  const [rows] = await pool.execute(
    `SELECT q.question_id, q.correct_answer, q.question_type, q.graph_config, q.graph_target, q.geo_config, q.geo_target, r.selected_option, r.graph_answer
     FROM questions q
     LEFT JOIN responses r ON r.question_id = q.question_id AND r.registration_number = ?
     WHERE q.exam_id = ?`,
    [registrationNumber, examId]
  );
  return rows;
}

async function create(examId, questionText, optionA, optionB, optionC, optionD, correctAnswer, questionType = 'text', richTextContent = null, supportsFormatting = false, geoConfig = null, geoTarget = null) {
  const geoCfgJson = geoConfig ? (typeof geoConfig === 'object' ? JSON.stringify(geoConfig) : geoConfig) : null;
  const geoTgtJson = geoTarget ? (typeof geoTarget === 'object' ? JSON.stringify(geoTarget) : geoTarget) : null;
  const [result] = await pool.execute(
    `INSERT INTO questions
      (exam_id, question_text, option_a, option_b, option_c, option_d, correct_answer, question_type, rich_text_content, supports_formatting, geo_config, geo_target)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [examId, questionText, optionA, optionB, optionC, optionD, correctAnswer, questionType, richTextContent, supportsFormatting, geoCfgJson, geoTgtJson]
  );
  return result.insertId;
}

module.exports = {
  findIdsByExam,
  findPublicByIds,
  findWithAnswersByExamForGrading,
  create
};