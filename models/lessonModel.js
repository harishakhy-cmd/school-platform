'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId, studentRegistration = null) {
  let sql = `
    SELECT l.id, l.classroom_id, l.subject_id, l.topic, l.title, l.description,
           l.learning_objectives, l.content, l.lesson_date, l.duration_minutes,
           l.order_num, l.is_published, l.created_by, l.created_at,
           s.name AS subject_name,
           (SELECT COUNT(*) FROM lesson_materials WHERE lesson_id = l.id) AS materials_count
  `;
  if (studentRegistration) {
    sql += `, (SELECT status FROM lesson_completions WHERE lesson_id = l.id AND registration_number = ?) AS completion_status`;
  }
  sql += `
    FROM lessons l
    LEFT JOIN subjects s ON s.id = l.subject_id
    WHERE l.classroom_id = ?
    ORDER BY l.order_num ASC, l.lesson_date ASC, l.id ASC
  `;

  const params = studentRegistration ? [studentRegistration, classroomId] : [classroomId];
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function findById(id, studentRegistration = null) {
  let sql = `
    SELECT l.id, l.classroom_id, l.subject_id, l.topic, l.title, l.description,
           l.learning_objectives, l.content, l.lesson_date, l.duration_minutes,
           l.order_num, l.is_published, l.created_by, l.created_at,
           s.name AS subject_name,
           u.full_name AS author_name
  `;
  if (studentRegistration) {
    sql += `, (SELECT status FROM lesson_completions WHERE lesson_id = l.id AND registration_number = ?) AS completion_status`;
  }
  sql += `
    FROM lessons l
    LEFT JOIN subjects s ON s.id = l.subject_id
    LEFT JOIN admin_users u ON u.id = l.created_by
    WHERE l.id = ?
    LIMIT 1
  `;
  const params = studentRegistration ? [studentRegistration, id] : [id];
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

async function create(classroomId, topic, title, description = null, learningObjectives = null, content = null, lessonDate = null, durationMinutes = 45, createdBy = null, subjectId = null) {
  const [result] = await pool.execute(`
    INSERT INTO lessons (classroom_id, topic, title, description, learning_objectives, content, lesson_date, duration_minutes, created_by, subject_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    classroomId,
    topic,
    title,
    description ?? null,
    learningObjectives ?? null,
    content ?? null,
    lessonDate ?? null,
    durationMinutes || 45,
    createdBy ?? null,
    subjectId ?? null
  ]);
  return result.insertId;
}

async function update(id, topic, title, description = null, learningObjectives = null, content = null, lessonDate = null, durationMinutes = 45, subjectId = null, isPublished = true) {
  await pool.execute(`
    UPDATE lessons 
    SET topic = ?, title = ?, description = ?, learning_objectives = ?, content = ?, lesson_date = ?, duration_minutes = ?, subject_id = ?, is_published = ?
    WHERE id = ?
  `, [
    topic,
    title,
    description ?? null,
    learningObjectives ?? null,
    content ?? null,
    lessonDate ?? null,
    durationMinutes || 45,
    subjectId ?? null,
    isPublished ? 1 : 0,
    id
  ]);
}

async function deleteLesson(id) {
  await pool.execute('DELETE FROM lessons WHERE id = ?', [id]);
}

async function setCompletionStatus(lessonId, registrationNumber, status = 'Completed') {
  await pool.execute(`
    INSERT INTO lesson_completions (lesson_id, registration_number, status)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE status = VALUES(status), completed_at = CURRENT_TIMESTAMP
  `, [lessonId, registrationNumber, status]);
}

async function getCompletionStats(classroomId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT 
      COUNT(l.id) AS total_lessons,
      COUNT(c.id) AS completed_lessons
    FROM lessons l
    LEFT JOIN lesson_completions c ON c.lesson_id = l.id AND c.registration_number = ? AND c.status = 'Completed'
    WHERE l.classroom_id = ? AND l.is_published = TRUE
  `, [registrationNumber, classroomId]);
  return rows[0] || { total_lessons: 0, completed_lessons: 0 };
}

module.exports = {
  findByClassroom,
  findById,
  create,
  update,
  deleteLesson,
  setCompletionStatus,
  getCompletionStats
};
