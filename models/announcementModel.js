'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT a.id, a.classroom_id, a.title, a.content, a.type, a.priority,
           a.published_by, a.created_at,
           u.full_name AS publisher_name
    FROM announcements a
    LEFT JOIN admin_users u ON u.id = a.published_by
    WHERE a.classroom_id = ? OR a.classroom_id IS NULL
    ORDER BY a.created_at DESC
  `, [classroomId]);
  return rows;
}

async function findGlobal() {
  const [rows] = await pool.execute(`
    SELECT a.id, a.classroom_id, a.title, a.content, a.type, a.priority,
           a.published_by, a.created_at,
           u.full_name AS publisher_name
    FROM announcements a
    LEFT JOIN admin_users u ON u.id = a.published_by
    WHERE a.classroom_id IS NULL
    ORDER BY a.created_at DESC
  `);
  return rows;
}

async function create(title, content, type = 'general', priority = 'normal', classroomId = null, publishedBy = null) {
  const [result] = await pool.execute(`
    INSERT INTO announcements (title, content, type, priority, classroom_id, published_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [title, content, type, priority, classroomId, publishedBy]);
  return result.insertId;
}

async function deleteAnnouncement(id) {
  await pool.execute('DELETE FROM announcements WHERE id = ?', [id]);
}

module.exports = {
  findByClassroom,
  findGlobal,
  create,
  deleteAnnouncement
};
