'use strict';

const express = require('express');
const classroomController = require('../controllers/classroomController');
const {
  requireAdmin,
  requireTutorOrAdmin,
  requireClassroomAccess,
  requireClassroomTutorOrAdmin
} = require('../middleware/adminAuthMiddleware');

const router = express.Router();

// Metadata for classroom forms (Classes, Subjects, Terms, Tutors)
router.get('/meta/options', requireTutorOrAdmin, classroomController.getMetaOptions);

// List classrooms (Role-scoped: Admin sees all, Tutor sees assigned, Student sees enrolled)
router.get('/', classroomController.listClassrooms);

// Create classroom (Admin or Tutor)
router.post('/', requireTutorOrAdmin, classroomController.createClassroom);

// View classroom details (Admin, assigned Tutor, or enrolled Student)
router.get('/:id', requireClassroomAccess, classroomController.getClassroomDetails);

// Update classroom (Admin or assigned Tutor)
router.put('/:id', requireClassroomTutorOrAdmin, classroomController.updateClassroom);

// Archive / Unarchive classroom (Admin or assigned Tutor)
PUT: router.put('/:id/archive', requireClassroomTutorOrAdmin, classroomController.archiveClassroom);

// Delete classroom (Admin only)
router.delete('/:id', requireAdmin, classroomController.deleteClassroom);

// Classroom Members / Students
router.get('/:id/students', requireClassroomAccess, classroomController.listStudents);
router.post('/:id/enroll', requireClassroomTutorOrAdmin, classroomController.enrollStudent);
router.post('/:id/enroll-batch', requireClassroomTutorOrAdmin, classroomController.batchEnrollStudents);
router.delete('/:id/students/:registrationNumber', requireClassroomTutorOrAdmin, classroomController.removeStudent);

module.exports = router;
