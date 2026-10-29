'use strict';

const express = require('express');
const notificationController = require('../controllers/notificationController');
const calendarController = require('../controllers/calendarController');
const aiAssistantController = require('../controllers/aiAssistantController');
const { requireTutorOrAdmin } = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// Notifications
router.get('/notifications', notificationController.listNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);

// Calendar
router.get('/calendar', calendarController.getEvents);
router.post('/calendar', requireTutorOrAdmin, calendarController.createEvent);
router.delete('/calendar/:id', requireTutorOrAdmin, calendarController.deleteEvent);

// AI Assistant
router.post('/ai/ask', aiAssistantController.askAssistant);

module.exports = router;
