'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId) {
  const [rows] = await pool.execute(`
    SELECT d.id, d.classroom_id, d.lesson_id, d.title, d.content,
           d.author_type, d.author_id, d.author_name, d.is_pinned,
           d.created_at, d.updated_at,
           l.title AS lesson_title,
           (SELECT COUNT(*) FROM discussion_comments WHERE discussion_id = d.id) AS comments_count
    FROM discussions d
    LEFT JOIN lessons l ON l.id = d.lesson_id
    WHERE d.classroom_id = ?
    ORDER BY d.is_pinned DESC, d.created_at DESC
  `, [classroomId]);
  return rows;
}

async function findById(id) {
  const [rows] = await pool.execute(`
    SELECT d.id, d.classroom_id, d.lesson_id, d.title, d.content,
           d.author_type, d.author_id, d.author_name, d.is_pinned,
           d.created_at, d.updated_at,
           l.title AS lesson_title
    FROM discussions d
    LEFT JOIN lessons l ON l.id = d.lesson_id
    WHERE d.id = ?
    LIMIT 1
  `, [id]);
  return rows[0] || null;
}

async function create(classroomId, title, content, authorType, authorId, authorName, lessonId = null) {
  const [result] = await pool.execute(`
    INSERT INTO discussions (classroom_id, title, content, author_type, author_id, author_name, lesson_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [classroomId, title, content, authorType, authorId, authorName, lessonId]);
  return result.insertId;
}

async function deleteDiscussion(id) {
  await pool.execute('DELETE FROM discussions WHERE id = ?', [id]);
}

// Comments
async function findComments(discussionId) {
  const [rows] = await pool.execute(`
    SELECT id, discussion_id, parent_comment_id, author_type, author_id, author_name,
           content, created_at
    FROM discussion_comments
    WHERE discussion_id = ?
    ORDER BY created_at ASC
  `, [discussionId]);
  return rows;
}

async function addComment(discussionId, authorType, authorId, authorName, content, parentCommentId = null) {
  const [result] = await pool.execute(`
    INSERT INTO discussion_comments (discussion_id, author_type, author_id, author_name, content, parent_comment_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [discussionId, authorType, authorId, authorName, content, parentCommentId]);
  return result.insertId;
}

async function deleteComment(id) {
  await pool.execute('DELETE FROM discussion_comments WHERE id = ?', [id]);
}

module.exports = {
  findByClassroom,
  findById,
  create,
  deleteDiscussion,
  findComments,
  addComment,
  deleteComment
};
