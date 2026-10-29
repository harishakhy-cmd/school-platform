'use strict';

const pool = require('../config/database');

async function findByRecipient(recipientType, recipientId, limit = 50) {
  const [rows] = await pool.execute(`
    SELECT id, recipient_type, recipient_id, title, message, type, link, is_read, created_at
    FROM notifications
    WHERE recipient_type = ? AND recipient_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `, [recipientType, String(recipientId), limit]);
  return rows;
}

async function getUnreadCount(recipientType, recipientId) {
  const [rows] = await pool.execute(`
    SELECT COUNT(*) AS unread_count
    FROM notifications
    WHERE recipient_type = ? AND recipient_id = ? AND is_read = FALSE
  `, [recipientType, String(recipientId)]);
  return rows[0]?.unread_count || 0;
}

async function create(recipientType, recipientId, title, message, type = 'info', link = null) {
  const [result] = await pool.execute(`
    INSERT INTO notifications (recipient_type, recipient_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [recipientType, String(recipientId), title, message, type, link]);
  return result.insertId;
}

async function notifyClassroomStudents(classroomId, title, message, type = 'info', link = null) {
  const [students] = await pool.execute(`
    SELECT registration_number FROM classroom_enrollments
    WHERE classroom_id = ? AND status = 'active'
  `, [classroomId]);

  for (const s of students) {
    await create('student', s.registration_number, title, message, type, link);
  }
}

async function markAsRead(notificationId, recipientType, recipientId) {
  await pool.execute(`
    UPDATE notifications 
    SET is_read = TRUE
    WHERE id = ? AND recipient_type = ? AND recipient_id = ?
  `, [notificationId, recipientType, String(recipientId)]);
}

async function markAllAsRead(recipientType, recipientId) {
  await pool.execute(`
    UPDATE notifications 
    SET is_read = TRUE
    WHERE recipient_type = ? AND recipient_id = ? AND is_read = FALSE
  `, [recipientType, String(recipientId)]);
}

module.exports = {
  findByRecipient,
  getUnreadCount,
  create,
  notifyClassroomStudents,
  markAsRead,
  markAllAsRead
};
