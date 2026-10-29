'use strict';

const classroomModel = require('../models/classroomModel');
const enrollmentModel = require('../models/enrollmentModel');

function requireAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({
      error: 'Admin login required',
      code: 'ADMIN_AUTH_REQUIRED'
    });
  }
  if (req.session.adminRole !== 'super_admin' && req.session.adminRole !== 'ordinary_admin') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'ADMIN_FORBIDDEN'
    });
  }
  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({
      error: 'Super admin login required',
      code: 'ADMIN_AUTH_REQUIRED'
    });
  }
  if (req.session.adminRole !== 'super_admin') {
    return res.status(403).json({
      error: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }
  next();
}

function requireTutorOrAdmin(req, res, next) {
  if (!req.session.adminId) {
    return res.status(401).json({
      error: 'Staff / Tutor login required',
      code: 'STAFF_AUTH_REQUIRED'
    });
  }
  const allowed = ['super_admin', 'ordinary_admin', 'tutor'];
  if (!allowed.includes(req.session.adminRole)) {
    return res.status(403).json({
      error: 'Tutor or Admin role required',
      code: 'STAFF_FORBIDDEN'
    });
  }
  next();
}

async function requireClassroomAccess(req, res, next) {
  try {
    const classroomId = parseInt(req.params.classroomId || req.params.id, 10);
    if (Number.isNaN(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }

    const classroom = await classroomModel.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    req.classroom = classroom;

    // 1. Admin has access
    if (req.session.adminId) {
      if (req.session.adminRole === 'super_admin' || req.session.adminRole === 'ordinary_admin') {
        req.userClassroomRole = 'admin';
        return next();
      }
      // 2. Assigned Tutor has access
      if (req.session.adminRole === 'tutor' && classroom.tutor_id === req.session.adminId) {
        req.userClassroomRole = 'tutor';
        return next();
      }
    }

    // 3. Enrolled Student has access
    if (req.session.registrationNumber) {
      const isEnrolled = await enrollmentModel.isEnrolled(classroomId, req.session.registrationNumber);
      if (isEnrolled) {
        req.userClassroomRole = 'student';
        return next();
      }
    }

    return res.status(403).json({
      error: 'You do not have permission to access this classroom.',
      code: 'CLASSROOM_FORBIDDEN'
    });
  } catch (err) {
    next(err);
  }
}

async function requireClassroomTutorOrAdmin(req, res, next) {
  try {
    const classroomId = parseInt(req.params.classroomId || req.params.id, 10);
    if (Number.isNaN(classroomId)) {
      return res.status(400).json({ error: 'Invalid classroom ID' });
    }

    const classroom = await classroomModel.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'Classroom not found' });
    }

    req.classroom = classroom;

    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.session.adminRole === 'super_admin' || req.session.adminRole === 'ordinary_admin') {
      req.userClassroomRole = 'admin';
      return next();
    }

    if (req.session.adminRole === 'tutor' && classroom.tutor_id === req.session.adminId) {
      req.userClassroomRole = 'tutor';
      return next();
    }

    return res.status(403).json({
      error: 'Only the assigned tutor or an administrator can manage this classroom.',
      code: 'TUTOR_OR_ADMIN_REQUIRED'
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requireTutorOrAdmin,
  requireClassroomAccess,
  requireClassroomTutorOrAdmin
};