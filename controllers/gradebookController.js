'use strict';

const gradebookModel = require('../models/gradebookModel');

async function getClassroomGradebook(req, res, next) {
  try {
    const classroomId = req.classroom.id;

    if (req.userClassroomRole === 'student') {
      const studentData = await gradebookModel.getStudentGradebook(classroomId, req.session.registrationNumber);
      return res.json({ ok: true, ...studentData });
    }

    const data = await gradebookModel.getClassroomGradebook(classroomId);
    return res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
}

async function getStudentClassroomGrades(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const reg = req.params.registrationNumber || req.session.registrationNumber;

    if (req.userClassroomRole === 'student' && reg !== req.session.registrationNumber) {
      return res.status(403).json({ error: 'Cannot view grades of other students' });
    }

    const data = await gradebookModel.getStudentGradebook(classroomId, reg);
    return res.json({ ok: true, ...data });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getClassroomGradebook,
  getStudentClassroomGrades
};
