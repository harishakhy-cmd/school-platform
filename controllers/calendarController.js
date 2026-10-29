'use strict';

const calendarModel = require('../models/calendarModel');

async function getEvents(req, res, next) {
  try {
    const classroomId = req.query.classroom_id ? parseInt(req.query.classroom_id, 10) : null;

    if (classroomId) {
      const events = await calendarModel.findByClassroom(classroomId);
      return res.json({ ok: true, events });
    }

    if (req.session.registrationNumber) {
      const events = await calendarModel.findForStudent(req.session.registrationNumber);
      return res.json({ ok: true, events });
    }

    if (req.session.adminId) {
      const events = req.session.adminRole === 'tutor' 
        ? await calendarModel.findForTutor(req.session.adminId)
        : await calendarModel.findForTutor(null); // Admin sees all
      return res.json({ ok: true, events });
    }

    return res.status(401).json({ error: 'Authentication required' });
  } catch (err) {
    next(err);
  }
}

async function createEvent(req, res, next) {
  try {
    const { classroom_id, title, description, event_type, start_time, end_time, reference_id } = req.body;

    if (!title || !start_time || !event_type) {
      return res.status(400).json({ error: 'Title, start time, and event type are required' });
    }

    const createdBy = req.session.adminId || null;
    const eventId = await calendarModel.create(
      classroom_id ? parseInt(classroom_id, 10) : null,
      title.trim(),
      description ? description.trim() : null,
      event_type,
      new Date(start_time),
      end_time ? new Date(end_time) : null,
      reference_id ? parseInt(reference_id, 10) : null,
      createdBy
    );

    return res.json({ ok: true, event_id: eventId, message: 'Event created successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteEvent(req, res, next) {
  try {
    const eventId = parseInt(req.params.id, 10);
    await calendarModel.deleteEvent(eventId);
    return res.json({ ok: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getEvents,
  createEvent,
  deleteEvent
};
