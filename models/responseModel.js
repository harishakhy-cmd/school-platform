const pool = require('../config/database');

async function upsertAnswer(registrationNumber, questionId, selectedOption, graphAnswer = null) {
  const graphAnswerJson = graphAnswer ? (typeof graphAnswer === 'object' ? JSON.stringify(graphAnswer) : graphAnswer) : null;
  await pool.execute(
    `INSERT INTO responses (registration_number, question_id, selected_option, graph_answer)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE 
       selected_option = VALUES(selected_option),
       graph_answer = VALUES(graph_answer)`,
    [registrationNumber, questionId, selectedOption, graphAnswerJson]
  );
}

async function findMapForExam(registrationNumber, questionIds) {
  if (!questionIds.length) return {};
  const placeholders = questionIds.map(() => '?').join(',');
  const [rows] = await pool.execute(
    `SELECT question_id, selected_option FROM responses
     WHERE registration_number = ? AND question_id IN (${placeholders})`,
    [registrationNumber, ...questionIds]
  );
  const map = {};
  for (const r of rows) {
    map[r.question_id] = r.selected_option;
  }
  return map;
}

module.exports = { upsertAnswer, findMapForExam };
