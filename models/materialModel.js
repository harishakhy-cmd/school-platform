'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT m.id, m.lesson_id, m.classroom_id, m.title, m.file_name, m.file_path,
           m.file_type, m.file_size, m.external_url, m.is_downloadable, m.created_at,
           l.title AS lesson_title, l.topic AS lesson_topic
    FROM lesson_materials m
    LEFT JOIN lessons l ON l.id = m.lesson_id
    WHERE m.classroom_id = ?
    ORDER BY m.created_at DESC
  `, [classroomId]);
  return rows;
}

async function findByLesson(lessonId) {
  const [rows] = await pool.execute(`
    SELECT id, lesson_id, classroom_id, title, file_name, file_path,
           file_type, file_size, external_url, is_downloadable, created_at
    FROM lesson_materials
    WHERE lesson_id = ?
    ORDER BY created_at ASC
  `, [lessonId]);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT id, lesson_id, classroom_id, title, file_name, file_path,
           file_type, file_size, external_url, is_downloadable, created_at
    FROM lesson_materials
    WHERE id = ?
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

async function create(classroomId, title, lessonId = null, fileName = null, filePath = null, fileType = null, fileSize = null, externalUrl = null, isDownloadable = true) {
  const [result] = await pool.execute(`
    INSERT INTO lesson_materials (classroom_id, lesson_id, title, file_name, file_path, file_type, file_size, external_url, is_downloadable)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [classroomId, lessonId, title, fileName, filePath, fileType, fileSize, externalUrl, isDownloadable ? 1 : 0]);
  return result.insertId;
}

async function deleteMaterial(id) {
  await pool.execute('DELETE FROM lesson_materials WHERE id = ?', [id]);
}

module.exports = {
  findByClassroom,
  findByLesson,
  findById,
  create,
  deleteMaterial
};
