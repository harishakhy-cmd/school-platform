'use strict';

const pool = require('../config/database');

async function findByClassroom(classroomId, date = null, lessonId = null) {
  let sql = `
    SELECT a.id, a.classroom_id, a.lesson_id, a.registration_number, a.date,
           a.status, a.remarks, a.marked_by, a.created_at,
           s.name AS student_name,
           l.title AS lesson_title,
           u.full_name AS marker_name
    FROM attendance a
    JOIN students s ON s.registration_number = a.registration_number
    LEFT JOIN lessons l ON l.id = a.lesson_id
    LEFT JOIN admin_users u ON u.id = a.marked_by
    WHERE a.classroom_id = ?
  `;
  const params = [classroomId];
  if (date) {
    sql += ' AND a.date = ? ';
    params.push(date);
  }
  if (lessonId) {
    sql += ' AND a.lesson_id = ? ';
    params.push(lessonId);
  }
  sql += ' ORDER BY a.date DESC, s.name ASC';
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function findByStudent(classroomId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT a.id, a.classroom_id, a.lesson_id, a.registration_number, a.date,
           a.status, a.remarks, a.created_at,
           l.title AS lesson_title
    FROM attendance a
    LEFT JOIN lessons l ON l.id = a.lesson_id
    WHERE a.classroom_id = ? AND a.registration_number = ?
    ORDER BY a.date DESC
  `, [classroomId, registrationNumber]);
  return rows;
}

async function getStudentStats(classroomId, registrationNumber) {
  const [rows] = await pool.execute(`
    SELECT 
      COUNT(*) AS total_records,
      SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) AS present_count,
      SUM(CASE WHEN status = 'Absent' THEN 1 ELSE 0 END) AS absent_count,
      SUM(CASE WHEN status = 'Late' THEN 1 ELSE 0 END) AS late_count,
      SUM(CASE WHEN status = 'Excused' THEN 1 ELSE 0 END) AS excused_count
    FROM attendance
    WHERE classroom_id = ? AND registration_number = ?
  `, [classroomId, registrationNumber]);
  
  const stats = rows[0] || { total_records: 0, present_count: 0, absent_count: 0, late_count: 0, excused_count: 0 };
  const total = Number(stats.total_records) || 0;
  const present = (Number(stats.present_count) || 0) + (Number(stats.late_count) || 0);
  stats.percentage = total > 0 ? Math.round((present / total) * 100) : 100;
  return stats;
}

async function markAttendance(classroomId, lessonId, registrationNumber, date, status, remarks = null, markedBy = null) {
  await pool.execute(`
    INSERT INTO attendance (classroom_id, lesson_id, registration_number, date, status, remarks, marked_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE 
      status = VALUES(status),
      remarks = VALUES(remarks),
      marked_by = VALUES(marked_by)
  `, [classroomId, lessonId, registrationNumber, date, status, remarks, markedBy]);
}

async function markBatch(classroomId, lessonId, date, records, markedBy = null) {
  for (const item of records) {
    await markAttendance(
      classroomId,
      lessonId,
      item.registration_number,
      date,
      item.status,
      item.remarks || null,
      markedBy
    );
  }
}

module.exports = {
  findByClassroom,
  findByStudent,
  getStudentStats,
  markAttendance,
  markBatch
};
