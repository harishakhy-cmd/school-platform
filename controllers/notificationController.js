'use strict';

const notificationModel = require('../models/notificationModel');

function getRecipientInfo(req) {
  if (req.session.registrationNumber) {
    return { type: 'student', id: req.session.registrationNumber };
  }
  if (req.session.adminId) {
    const type = req.session.adminRole === 'tutor' ? 'tutor' : 'admin';
    return { type, id: String(req.session.adminId) };
  }
  return null;
}

async function listNotifications(req, res, next) {
  try {
    const recipient = getRecipientInfo(req);
    if (!recipient) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notifications = await notificationModel.findByRecipient(recipient.type, recipient.id);
    const unreadCount = await notificationModel.getUnreadCount(recipient.type, recipient.id);

    return res.json({ ok: true, notifications, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const recipient = getRecipientInfo(req);
    if (!recipient) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const unreadCount = await notificationModel.getUnreadCount(recipient.type, recipient.id);
    return res.json({ ok: true, unreadCount });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const recipient = getRecipientInfo(req);
    if (!recipient) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const notificationId = parseInt(req.params.id, 10);
    await notificationModel.markAsRead(notificationId, recipient.type, recipient.id);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const recipient = getRecipientInfo(req);
    if (!recipient) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    await notificationModel.markAllAsRead(recipient.type, recipient.id);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
