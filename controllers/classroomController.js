'use strict';

const classroomModel = require('../models/classroomModel');
const enrollmentModel = require('../models/enrollmentModel');
const studentModel = require('../models/studentModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const academicTermModel = require('../models/academicTermModel');
const tutorModel = require('../models/tutorModel');
const { normalizeRegistrationNumber, isValidRegistrationNumber } = require('../utils/registrationFormat');

// Generate unique classroom code (e.g. CLS-8A9F)
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'CLS-';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function listClassrooms(req, res, next) {
  try {
    // 1. Admin: View all classrooms
    if (req.session.adminId && (req.session.adminRole === 'super_admin' || req.session.adminRole === 'ordinary_admin')) {
      const classrooms = await classroomModel.findAll(true);
      return res.json({ ok: true, role: 'admin', classrooms });
    }

    // 2. Tutor: View assigned classrooms
    if (req.session.adminId && req.session.adminRole === 'tutor') {
      const classrooms = await classroomModel.findByTutor(req.session.adminId, true);
      return res.json({ ok: true, role: 'tutor', classrooms });
    }

    // 3. Student: View enrolled classrooms
    if (req.session.registrationNumber) {
      const classrooms = await classroomModel.findByStudent(req.session.registrationNumber, false);
      return res.json({ ok: true, role: 'student', classrooms });
    }

    return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
  } catch (err) {
    next(err);
  }
}

async function getClassroomDetails(req, res, next) {
  try {
    const classroom = req.classroom;
    const userRole = req.userClassroomRole;
    return res.json({
      ok: true,
      classroom,
      userRole
    });
  } catch (err) {
    next(err);
  }
}

async function createClassroom(req, res, next) {
  try {
    const { name, class_id, subject_id, term_id, tutor_id, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Classroom name is required' });
    }

    // Determine tutor assignment
    let assignedTutorId = tutor_id ? parseInt(tutor_id, 10) : null;
    if (req.session.adminRole === 'tutor' && !assignedTutorId) {
      assignedTutorId = req.session.adminId;
    }

    let classCode;
    let existing;
    do {
      classCode = generateClassCode();
      existing = await classroomModel.findByClassCode(classCode);
    } while (existing);

    const classroomId = await classroomModel.create(
      name.trim(),
      classCode,
      class_id ? parseInt(class_id, 10) : null,
      subject_id ? parseInt(subject_id, 10) : null,
      term_id ? parseInt(term_id, 10) : null,
      assignedTutorId,
      description ? description.trim() : null
    );

    return res.json({
      ok: true,
      classroom_id: classroomId,
      class_code: classCode,
      message: 'Classroom created successfully'
    });
  } catch (err) {
    next(err);
  }
}

async function updateClassroom(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { name, class_id, subject_id, term_id, tutor_id, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Classroom name is required' });
    }

    let assignedTutorId = tutor_id ? parseInt(tutor_id, 10) : req.classroom.tutor_id;

    await classroomModel.update(
      classroomId,
      name.trim(),
      class_id ? parseInt(class_id, 10) : null,
      subject_id ? parseInt(subject_id, 10) : null,
      term_id ? parseInt(term_id, 10) : null,
      assignedTutorId,
      description ? description.trim() : null
    );

    return res.json({ ok: true, message: 'Classroom updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function archiveClassroom(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { is_archived } = req.body;
    await classroomModel.setArchived(classroomId, is_archived === true || is_archived === 'true');
    return res.json({ ok: true, message: `Classroom ${is_archived ? 'archived' : 'unarchived'} successfully` });
  } catch (err) {
    next(err);
  }
}

async function deleteClassroom(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    await classroomModel.deleteClassroom(classroomId);
    return res.json({ ok: true, message: 'Classroom deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const students = await enrollmentModel.findByClassroom(classroomId);
    return res.json({ ok: true, students });
  } catch (err) {
    next(err);
  }
}

async function enrollStudent(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { registration_number, name } = req.body;

    if (!registration_number || typeof registration_number !== 'string') {
      return res.status(400).json({ error: 'Registration number is required' });
    }

    const reg = normalizeRegistrationNumber(registration_number);
    if (!isValidRegistrationNumber(reg)) {
      return res.status(400).json({ error: 'Invalid registration number format' });
    }

    // Check if student exists in students table, if not and name provided, create student
    let student = await studentModel.findByRegistration(reg);
    if (!student) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(404).json({ error: 'Student registration not found. Please provide student name to register new student.' });
      }
      await studentModel.create(reg, name.trim(), req.session.adminId || null);
    }

    await enrollmentModel.enrollStudent(classroomId, reg, 'active');
    return res.json({ ok: true, message: `Student ${reg} enrolled successfully` });
  } catch (err) {
    next(err);
  }
}

async function batchEnrollStudents(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { registration_numbers } = req.body;

    if (!Array.isArray(registration_numbers) || registration_numbers.length === 0) {
      return res.status(400).json({ error: 'Array of registration numbers is required' });
    }

    let enrolledCount = 0;
    for (const raw of registration_numbers) {
      const reg = normalizeRegistrationNumber(raw);
      if (isValidRegistrationNumber(reg)) {
        const student = await studentModel.findByRegistration(reg);
        if (student) {
          await enrollmentModel.enrollStudent(classroomId, reg, 'active');
          enrolledCount++;
        }
      }
    }

    return res.json({ ok: true, enrolledCount, message: `Successfully enrolled ${enrolledCount} students` });
  } catch (err) {
    next(err);
  }
}

async function removeStudent(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const reg = normalizeRegistrationNumber(req.params.registrationNumber);
    await enrollmentModel.removeStudent(classroomId, reg);
    return res.json({ ok: true, message: `Student ${reg} removed from classroom` });
  } catch (err) {
    next(err);
  }
}

async function getMetaOptions(req, res, next) {
  try {
    const [classes, subjects, terms, tutors] = await Promise.all([
      classModel.findAll(),
      subjectModel.findAll(),
      academicTermModel.findAll(),
      tutorModel.findAll()
    ]);

    return res.json({
      ok: true,
      classes,
      subjects,
      terms,
      tutors
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listClassrooms,
  getClassroomDetails,
  createClassroom,
  updateClassroom,
  archiveClassroom,
  deleteClassroom,
  listStudents,
  enrollStudent,
  batchEnrollStudents,
  removeStudent,
  getMetaOptions
};
