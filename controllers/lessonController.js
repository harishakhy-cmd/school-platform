'use strict';

const lessonModel = require('../models/lessonModel');
const materialModel = require('../models/materialModel');
const notificationModel = require('../models/notificationModel');
const calendarModel = require('../models/calendarModel');

// --- Lessons ---
async function listLessons(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const studentReg = req.session.registrationNumber || null;
    const lessons = await lessonModel.findByClassroom(classroomId, studentReg);
    return res.json({ ok: true, lessons });
  } catch (err) {
    next(err);
  }
}

async function getLesson(req, res, next) {
  try {
    const lessonId = parseInt(req.params.lessonId, 10);
    const studentReg = req.session.registrationNumber || null;
    const lesson = await lessonModel.findById(lessonId, studentReg);
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    const materials = await materialModel.findByLesson(lessonId);
    return res.json({ ok: true, lesson, materials });
  } catch (err) {
    next(err);
  }
}

async function createLesson(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { topic, title, description, learning_objectives, content, lesson_date, duration_minutes, subject_id } = req.body;

    if (!title || !topic) {
      return res.status(400).json({ error: 'Topic and title are required' });
    }

    const createdBy = req.session.adminId;
    const lessonId = await lessonModel.create(
      classroomId,
      topic.trim(),
      title.trim(),
      description ? description.trim() : null,
      learning_objectives ? learning_objectives.trim() : null,
      content || null,
      lesson_date || null,
      duration_minutes ? parseInt(duration_minutes, 10) : 45,
      createdBy,
      subject_id ? parseInt(subject_id, 10) : req.classroom.subject_id
    );

    // If lesson date is set, create a calendar event
    if (lesson_date) {
      await calendarModel.create(
        classroomId,
        `Lesson: ${title.trim()}`,
        description || `Topic: ${topic.trim()}`,
        'lesson',
        new Date(lesson_date),
        new Date(new Date(lesson_date).getTime() + (duration_minutes || 45) * 60000),
        lessonId,
        createdBy
      );
    }

    // Notify enrolled students
    await notificationModel.notifyClassroomStudents(
      classroomId,
      `New Lesson: ${title.trim()}`,
      `A new lesson on "${topic.trim()}" has been published in ${req.classroom.name}.`,
      'lesson',
      `/classroom.html?id=${classroomId}&tab=lessons`
    );

    return res.json({ ok: true, lesson_id: lessonId, message: 'Lesson created successfully' });
  } catch (err) {
    next(err);
  }
}

async function updateLesson(req, res, next) {
  try {
    const lessonId = parseInt(req.params.lessonId, 10);
    const { topic, title, description, learning_objectives, content, lesson_date, duration_minutes, subject_id, is_published } = req.body;

    await lessonModel.update(
      lessonId,
      topic.trim(),
      title.trim(),
      description ? description.trim() : null,
      learning_objectives ? learning_objectives.trim() : null,
      content || null,
      lesson_date || null,
      duration_minutes ? parseInt(duration_minutes, 10) : 45,
      subject_id ? parseInt(subject_id, 10) : null,
      is_published !== false
    );

    return res.json({ ok: true, message: 'Lesson updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteLesson(req, res, next) {
  try {
    const lessonId = parseInt(req.params.lessonId, 10);
    await lessonModel.deleteLesson(lessonId);
    return res.json({ ok: true, message: 'Lesson deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function toggleLessonCompletion(req, res, next) {
  try {
    const lessonId = parseInt(req.params.lessonId, 10);
    const registrationNumber = req.session.registrationNumber;
    if (!registrationNumber) {
      return res.status(401).json({ error: 'Student login required' });
    }

    const { status } = req.body;
    const newStatus = status === 'Not Started' ? 'Not Started' : (status === 'In Progress' ? 'In Progress' : 'Completed');
    await lessonModel.setCompletionStatus(lessonId, registrationNumber, newStatus);
    return res.json({ ok: true, status: newStatus });
  } catch (err) {
    next(err);
  }
}

// --- Materials ---
async function listMaterials(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const materials = await materialModel.findByClassroom(classroomId);
    return res.json({ ok: true, materials });
  } catch (err) {
    next(err);
  }
}

async function addMaterial(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { title, lesson_id, file_name, file_path, file_type, file_size, external_url, is_downloadable } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Material title is required' });
    }

    const materialId = await materialModel.create(
      classroomId,
      title.trim(),
      lesson_id ? parseInt(lesson_id, 10) : null,
      file_name || null,
      file_path || null,
      file_type || (external_url ? 'link' : 'document'),
      file_size ? parseInt(file_size, 10) : null,
      external_url || null,
      is_downloadable !== false
    );

    return res.json({ ok: true, material_id: materialId, message: 'Material added successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteMaterial(req, res, next) {
  try {
    const materialId = parseInt(req.params.materialId, 10);
    await materialModel.deleteMaterial(materialId);
    return res.json({ ok: true, message: 'Material deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listLessons,
  getLesson,
  createLesson,
  updateLesson,
  deleteLesson,
  toggleLessonCompletion,
  listMaterials,
  addMaterial,
  deleteMaterial
};
