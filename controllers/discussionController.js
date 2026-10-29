'use strict';

const discussionModel = require('../models/discussionModel');

async function listDiscussions(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const discussions = await discussionModel.findByClassroom(classroomId);
    return res.json({ ok: true, discussions });
  } catch (err) {
    next(err);
  }
}

async function getDiscussion(req, res, next) {
  try {
    const discussionId = parseInt(req.params.discussionId, 10);
    const discussion = await discussionModel.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({ error: 'Discussion not found' });
    }
    const comments = await discussionModel.findComments(discussionId);
    return res.json({ ok: true, discussion, comments });
  } catch (err) {
    next(err);
  }
}

async function createDiscussion(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { title, content, lesson_id } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let authorType = 'student';
    let authorId = req.session.registrationNumber;
    let authorName = req.session.studentName || 'Student';

    if (req.session.adminId) {
      authorType = req.session.adminRole === 'tutor' ? 'tutor' : 'admin';
      authorId = String(req.session.adminId);
      authorName = req.session.adminUsername || 'Teacher';
    }

    const discussionId = await discussionModel.create(
      classroomId,
      title.trim(),
      content.trim(),
      authorType,
      authorId,
      authorName,
      lesson_id ? parseInt(lesson_id, 10) : null
    );

    return res.json({ ok: true, discussion_id: discussionId, message: 'Discussion posted' });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const discussionId = parseInt(req.params.discussionId, 10);
    const { content, parent_comment_id } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Content is required' });
    }

    let authorType = 'student';
    let authorId = req.session.registrationNumber;
    let authorName = req.session.studentName || 'Student';

    if (req.session.adminId) {
      authorType = req.session.adminRole === 'tutor' ? 'tutor' : 'admin';
      authorId = String(req.session.adminId);
      authorName = req.session.adminUsername || 'Teacher';
    }

    const commentId = await discussionModel.addComment(
      discussionId,
      authorType,
      authorId,
      authorName,
      content.trim(),
      parent_comment_id ? parseInt(parent_comment_id, 10) : null
    );

    return res.json({ ok: true, comment_id: commentId, message: 'Reply posted' });
  } catch (err) {
    next(err);
  }
}

async function deleteDiscussion(req, res, next) {
  try {
    const discussionId = parseInt(req.params.discussionId, 10);
    await discussionModel.deleteDiscussion(discussionId);
    return res.json({ ok: true, message: 'Discussion deleted' });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const commentId = parseInt(req.params.commentId, 10);
    await discussionModel.deleteComment(commentId);
    return res.json({ ok: true, message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listDiscussions,
  getDiscussion,
  createDiscussion,
  addComment,
  deleteDiscussion,
  deleteComment
};
