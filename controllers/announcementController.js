'use strict';

const announcementModel = require('../models/announcementModel');
const notificationModel = require('../models/notificationModel');

async function listClassroomAnnouncements(req, res, next) {
  try {
    const classroomId = req.classroom ? req.classroom.id : null;
    const announcements = classroomId 
      ? await announcementModel.findByClassroom(classroomId) 
      : await announcementModel.findGlobal();
    return res.json({ ok: true, announcements });
  } catch (err) {
    next(err);
  }
}

async function createAnnouncement(req, res, next) {
  try {
    const classroomId = req.classroom ? req.classroom.id : (req.body.classroom_id ? parseInt(req.body.classroom_id, 10) : null);
    const { title, content, type, priority } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const publishedBy = req.session.adminId || null;
    const announcementId = await announcementModel.create(
      title.trim(),
      content.trim(),
      type || 'general',
      priority || 'normal',
      classroomId,
      publishedBy
    );

    // If classroom specific, notify enrolled students
    if (classroomId) {
      await notificationModel.notifyClassroomStudents(
        classroomId,
        `Announcement: ${title.trim()}`,
        content.substring(0, 150),
        'announcement',
        `/classroom.html?id=${classroomId}&tab=stream`
      );
    }

    return res.json({ ok: true, announcement_id: announcementId, message: 'Announcement published successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteAnnouncement(req, res, next) {
  try {
    const announcementId = parseInt(req.params.announcementId, 10);
    await announcementModel.deleteAnnouncement(announcementId);
    return res.json({ ok: true, message: 'Announcement deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClassroomAnnouncements,
  createAnnouncement,
  deleteAnnouncement
};
