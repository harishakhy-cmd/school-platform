'use strict';

const { v4: uuidv4 } = require('uuid');
const liveSessionModel = require('../models/liveSessionModel');
const notificationModel = require('../models/notificationModel');

async function getLiveStatus(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const activeSession = await liveSessionModel.findActiveSession(classroomId);
    return res.json({ ok: true, activeSession });
  } catch (err) {
    next(err);
  }
}

async function startLiveSession(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { title } = req.body;
    const tutorId = req.session.adminId;

    // Check if session already live
    let existing = await liveSessionModel.findActiveSession(classroomId);
    if (existing) {
      return res.json({ ok: true, session: existing, message: 'Existing live session resumed' });
    }

    const sessionCode = `LIVE-${uuidv4().substring(0, 8).toUpperCase()}`;
    const pool = require('../config/database');
    let wbDefault = 1;
    try {
      const [wbRows] = await pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'live_default_student_whiteboard' LIMIT 1"
      );
      if (wbRows.length) wbDefault = wbRows[0].setting_value === 'true' ? 1 : 0;
    } catch (_) {}

    const sessionId = await liveSessionModel.create(
      classroomId,
      title ? title.trim() : `${req.classroom.name} Live Class`,
      tutorId,
      sessionCode
    );

    // Apply default whiteboard edit policy from settings
    try {
      await pool.query('UPDATE live_sessions SET whiteboard_edit_enabled = ? WHERE id = ?', [wbDefault, sessionId]);
    } catch (_) {}

    const session = await liveSessionModel.findBySessionCode(sessionCode);

    // Notify students
    await notificationModel.notifyClassroomStudents(
      classroomId,
      `🔴 Live Class Started: ${req.classroom.name}`,
      `Your tutor has started a live lesson. Click to join now!`,
      'live',
      `/classroom.html?id=${classroomId}&tab=live`
    );

    return res.json({ ok: true, session, message: 'Live class started' });
  } catch (err) {
    next(err);
  }
}

async function endLiveSession(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const tutorId = req.session.adminId;
    const activeSession = await liveSessionModel.findActiveSession(classroomId);

    if (activeSession) {
      await liveSessionModel.endSession(activeSession.id, tutorId);
    }

    return res.json({ ok: true, message: 'Live class ended' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLiveStatus,
  startLiveSession,
  endLiveSession
};
