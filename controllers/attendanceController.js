'use strict';

const attendanceModel = require('../models/attendanceModel');

async function getClassroomAttendance(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const date = req.query.date || null;
    const lessonId = req.query.lesson_id ? parseInt(req.query.lesson_id, 10) : null;

    if (req.userClassroomRole === 'student') {
      const records = await attendanceModel.findByStudent(classroomId, req.session.registrationNumber);
      const stats = await attendanceModel.getStudentStats(classroomId, req.session.registrationNumber);
      return res.json({ ok: true, records, stats });
    }

    const records = await attendanceModel.findByClassroom(classroomId, date, lessonId);
    return res.json({ ok: true, records });
  } catch (err) {
    next(err);
  }
}

async function markAttendance(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { lesson_id, registration_number, date, status, remarks } = req.body;

    if (!registration_number || !date || !status) {
      return res.status(400).json({ error: 'Registration number, date, and status are required' });
    }

    const markedBy = req.session.adminId;
    await attendanceModel.markAttendance(
      classroomId,
      lesson_id ? parseInt(lesson_id, 10) : null,
      registration_number.trim(),
      date,
      status,
      remarks ? remarks.trim() : null,
      markedBy
    );

    return res.json({ ok: true, message: 'Attendance recorded' });
  } catch (err) {
    next(err);
  }
}

async function markBatchAttendance(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { lesson_id, date, records } = req.body;

    if (!date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Date and records array are required' });
    }

    const markedBy = req.session.adminId;
    await attendanceModel.markBatch(
      classroomId,
      lesson_id ? parseInt(lesson_id, 10) : null,
      date,
      records,
      markedBy
    );

    return res.json({ ok: true, count: records.length, message: `Marked attendance for ${records.length} students` });
  } catch (err) {
    next(err);
  }
}

async function getStudentStats(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const reg = req.params.registrationNumber || req.session.registrationNumber;
    const stats = await attendanceModel.getStudentStats(classroomId, reg);
    return res.json({ ok: true, stats });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getClassroomAttendance,
  markAttendance,
  markBatchAttendance,
  getStudentStats
};
