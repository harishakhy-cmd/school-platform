'use strict';

const assignmentModel = require('../models/assignmentModel');
const notificationModel = require('../models/notificationModel');
const calendarModel = require('../models/calendarModel');

async function listAssignments(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const studentReg = req.session.registrationNumber || null;
    const assignments = await assignmentModel.findByClassroom(classroomId, studentReg);
    return res.json({ ok: true, assignments });
  } catch (err) {
    next(err);
  }
}

async function getAssignment(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const studentReg = req.session.registrationNumber || null;
    const assignment = await assignmentModel.findById(assignmentId, studentReg);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    let submissions = [];
    if (req.userClassroomRole === 'tutor' || req.userClassroomRole === 'admin') {
      submissions = await assignmentModel.findSubmissionsByAssignment(assignmentId);
    }

    return res.json({ ok: true, assignment, submissions });
  } catch (err) {
    next(err);
  }
}

async function createAssignment(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { title, instructions, max_marks, available_date, deadline, allow_late_submission, attachment_path, subject_id } = req.body;

    if (!title || !instructions || !deadline) {
      return res.status(400).json({ error: 'Title, instructions, and deadline are required' });
    }

    const createdBy = req.session.adminId;
    const assignmentId = await assignmentModel.create(
      classroomId,
      title.trim(),
      instructions.trim(),
      max_marks ? parseInt(max_marks, 10) : 100,
      available_date || new Date(),
      deadline,
      allow_late_submission === true || allow_late_submission === 'true',
      attachment_path || null,
      createdBy,
      subject_id ? parseInt(subject_id, 10) : req.classroom.subject_id
    );

    // Create calendar event for assignment deadline
    await calendarModel.create(
      classroomId,
      `Due: ${title.trim()}`,
      instructions.substring(0, 150),
      'assignment_deadline',
      new Date(deadline),
      new Date(deadline),
      assignmentId,
      createdBy
    );

    // Notify students
    await notificationModel.notifyClassroomStudents(
      classroomId,
      `New Assignment: ${title.trim()}`,
      `A new assignment has been posted. Due on: ${new Date(deadline).toLocaleDateString()}`,
      'assignment',
      `/classroom.html?id=${classroomId}&tab=assignments`
    );

    return res.json({ ok: true, assignment_id: assignmentId, message: 'Assignment created successfully' });
  } catch (err) {
    next(err);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const { title, instructions, max_marks, available_date, deadline, allow_late_submission, attachment_path, subject_id } = req.body;

    await assignmentModel.update(
      assignmentId,
      title.trim(),
      instructions.trim(),
      max_marks ? parseInt(max_marks, 10) : 100,
      available_date || new Date(),
      deadline,
      allow_late_submission === true || allow_late_submission === 'true',
      attachment_path || null,
      subject_id ? parseInt(subject_id, 10) : null
    );

    return res.json({ ok: true, message: 'Assignment updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteAssignment(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.assignmentId, 10);
    await assignmentModel.deleteAssignment(assignmentId);
    return res.json({ ok: true, message: 'Assignment deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function submitAssignment(req, res, next) {
  try {
    const assignmentId = parseInt(req.params.assignmentId, 10);
    const registrationNumber = req.session.registrationNumber;
    if (!registrationNumber) {
      return res.status(401).json({ error: 'Student login required' });
    }

    const assignment = await assignmentModel.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const { submission_text, file_path, file_name } = req.body;
    if (!submission_text && !file_path) {
      return res.status(400).json({ error: 'Submission text or file upload is required' });
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const isLate = now > deadline;

    if (isLate && !assignment.allow_late_submission) {
      return res.status(400).json({ error: 'Deadline has passed and late submissions are not allowed for this assignment.' });
    }

    const submissionId = await assignmentModel.submitAssignment(
      assignmentId,
      registrationNumber,
      submission_text || null,
      file_path || null,
      file_name || null,
      isLate
    );

    return res.json({ ok: true, submission_id: submissionId, is_late: isLate, message: 'Assignment submitted successfully' });
  } catch (err) {
    next(err);
  }
}

async function gradeSubmission(req, res, next) {
  try {
    const submissionId = parseInt(req.params.submissionId, 10);
    const { score, feedback } = req.body;

    if (score === undefined || score === null) {
      return res.status(400).json({ error: 'Score is required' });
    }

    const gradedBy = req.session.adminId;
    await assignmentModel.gradeSubmission(submissionId, parseFloat(score), feedback || null, gradedBy);

    return res.json({ ok: true, message: 'Submission graded successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listAssignments,
  getAssignment,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  gradeSubmission
};
