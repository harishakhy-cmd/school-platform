'use strict';

const whiteboardModel = require('../models/whiteboardModel');

async function getWhiteboardState(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const state = await whiteboardModel.findByClassroom(classroomId);
    return res.json({ ok: true, canvasData: state ? state.canvas_data : null, updatedAt: state ? state.updated_at : null });
  } catch (err) {
    next(err);
  }
}

async function saveWhiteboardState(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { canvasData } = req.body;
    const updatedBy = req.session.adminId || null;

    await whiteboardModel.saveState(classroomId, canvasData, updatedBy);
    return res.json({ ok: true, message: 'Whiteboard updated' });
  } catch (err) {
    next(err);
  }
}

async function clearWhiteboard(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const updatedBy = req.session.adminId || null;

    await whiteboardModel.clearState(classroomId, updatedBy);
    return res.json({ ok: true, message: 'Whiteboard cleared' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getWhiteboardState,
  saveWhiteboardState,
  clearWhiteboard
};
