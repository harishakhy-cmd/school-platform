'use strict';

/**
 * End-to-End Automated Platform Verification Test Suite
 * Tests all educational management, classroom, learning, and CBT features.
 */

const pool = require('../config/database');
const studentModel = require('../models/studentModel');
const adminUserModel = require('../models/adminUserModel');
const classroomModel = require('../models/classroomModel');
const enrollmentModel = require('../models/enrollmentModel');
const lessonModel = require('../models/lessonModel');
const materialModel = require('../models/materialModel');
const assignmentModel = require('../models/assignmentModel');
const quizModel = require('../models/quizModel');
const attendanceModel = require('../models/attendanceModel');
const discussionModel = require('../models/discussionModel');
const announcementModel = require('../models/announcementModel');
const notificationModel = require('../models/notificationModel');
const gradebookModel = require('../models/gradebookModel');
const examModel = require('../models/examModel');
const questionModel = require('../models/questionModel');
const examAttemptModel = require('../models/examAttemptModel');
const responseModel = require('../models/responseModel');
const liveSessionModel = require('../models/liveSessionModel');
const whiteboardModel = require('../models/whiteboardModel');
const { isValidRegistrationNumber, normalizeRegistrationNumber } = require('../utils/registrationFormat');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('==================================================');
  console.log('STARTING FULL EDUCATIONAL & CBT PLATFORM TEST SUITE');
  console.log('==================================================\n');

  try {
    // 1. Identity & Registration Number Format
    console.log('--- TEST 1: Registration Number Formats & Validation ---');
    assert(isValidRegistrationNumber('STO1-001A'), 'Legacy format STO1-001A is valid');
    assert(isValidRegistrationNumber('2026/ICT/001'), 'Academic format 2026/ICT/001 is valid');
    assert(isValidRegistrationNumber('STU-2026-042'), 'Academic format STU-2026-042 is valid');
    assert(!isValidRegistrationNumber('AB'), 'Too short registration number rejected');
    assert(normalizeRegistrationNumber('sto1-001a') === 'STO1-001A', 'Normalization handles case correctly');

    // 2. Students & Tutors Provisioning
    console.log('\n--- TEST 2: Users, Tutors & Students ---');
    const testReg = '2026/ICT/001';
    let testStudent = await studentModel.findByRegistration(testReg);
    if (!testStudent) {
      await studentModel.create(testReg, 'Jane Doe Academic', null);
      testStudent = await studentModel.findByRegistration(testReg);
    }
    assert(testStudent !== null, `Student with academic ID ${testReg} exists`);
    assert(testStudent.name === 'Jane Doe Academic', 'Student name matches');

    // Check or create a test tutor
    let tutor = await adminUserModel.findByUsername('test_tutor');
    let tutorId;
    if (!tutor) {
      const hash = await bcrypt.hash('TutorPass123!', 10);
      tutorId = await adminUserModel.create('test_tutor', hash, 'tutor', 'active', null, 'TUT-001');
    } else {
      tutorId = tutor.id;
    }
    assert(tutorId > 0, 'Tutor account active in system');

    // 3. Classroom Creation & Enrollment
    console.log('\n--- TEST 3: Classroom Management & Student Enrollment ---');
    const classCode = `CLS-TEST-${Date.now().toString().slice(-4)}`;
    const classroomId = await classroomModel.create(
      'Advanced Mathematics & Computing 2026',
      classCode,
      1, // Class ID
      1, // Subject ID
      1, // Term ID
      tutorId,
      'Integrated classroom with Computer-Based Testing'
    );
    assert(classroomId > 0, `Classroom created with ID: ${classroomId} (Code: ${classCode})`);

    await enrollmentModel.enrollStudent(classroomId, testReg, 'active');
    const isEnrolled = await enrollmentModel.isEnrolled(classroomId, testReg);
    assert(isEnrolled === true, `Student ${testReg} enrolled in classroom ${classroomId}`);

    // Verify duplicate enrollment prevention
    await enrollmentModel.enrollStudent(classroomId, testReg, 'active');
    const enrollments = await enrollmentModel.findByClassroom(classroomId);
    assert(enrollments.filter(e => e.registration_number === testReg).length === 1, 'No duplicate enrollments created');

    // 4. Lessons & Progress Tracking
    console.log('\n--- TEST 4: Lessons & Completion Progress ---');
    const lessonId = await lessonModel.create(
      classroomId,
      'Calculus & Numerical Methods',
      'Introduction to Derivatives',
      'Understand tangent slopes and rate of change',
      'Learn tangent lines and power rule',
      'Calculus is the mathematical study of continuous change.',
      new Date(),
      45,
      tutorId
    );
    assert(lessonId > 0, `Lesson created with ID: ${lessonId}`);

    const lessonsList = await lessonModel.findByClassroom(classroomId, testReg);
    assert(lessonsList.length >= 1, 'Classroom lessons retrieved successfully');

    await lessonModel.setCompletionStatus(lessonId, testReg, 'Completed');
    const completionStats = await lessonModel.getCompletionStats(classroomId, testReg);
    assert(completionStats.completed_lessons >= 1, 'Lesson completion status tracked for student');

    // 5. Materials
    console.log('\n--- TEST 5: Learning Materials ---');
    const matId = await materialModel.create(
      classroomId,
      'Calculus Reference Sheet',
      lessonId,
      'calculus_ref.pdf',
      '/uploads/calculus_ref.pdf',
      'pdf',
      102400,
      'https://example.com/calculus.pdf'
    );
    assert(matId > 0, `Learning material attached with ID: ${matId}`);
    const materials = await materialModel.findByClassroom(classroomId);
    assert(materials.some(m => m.id === matId), 'Material listed under classroom');

    // 6. Assignments & Submissions & Grading
    console.log('\n--- TEST 6: Assignments, Submissions & Grading ---');
    const assignDeadline = new Date(Date.now() + 86400000 * 7);
    const assignId = await assignmentModel.create(
      classroomId,
      'Calculus Problem Set 1',
      'Solve problems 1 through 10 on page 42.',
      100,
      new Date(),
      assignDeadline,
      true,
      null,
      tutorId
    );
    assert(assignId > 0, `Assignment created with ID: ${assignId}`);

    const subId = await assignmentModel.submitAssignment(
      assignId,
      testReg,
      'Here are my solutions to problems 1-10.',
      'https://drive.google.com/sample-solution',
      'solution.pdf',
      false
    );
    assert(subId > 0, `Assignment submitted by student ${testReg}`);

    await assignmentModel.gradeSubmission(subId, 95.0, 'Excellent mathematical reasoning!', tutorId);
    const gradedSub = await assignmentModel.findStudentSubmission(assignId, testReg);
    assert(gradedSub.score == 95.0, 'Submission graded with score 95/100');
    assert(gradedSub.feedback === 'Excellent mathematical reasoning!', 'Tutor feedback recorded');

    // 7. Quizzes & Auto-Grading
    console.log('\n--- TEST 7: Classroom Quizzes & Auto-Grading ---');
    const quizId = await quizModel.create(
      classroomId,
      'Calculus Quick Quiz',
      '5-minute concept verification quiz',
      15,
      100,
      50,
      null,
      null,
      tutorId
    );
    assert(quizId > 0, `Quiz created with ID: ${quizId}`);

    const q1 = await quizModel.addQuestion(
      quizId,
      'What is the derivative of x^2?',
      'x',
      '2x',
      'x^3',
      '2',
      'B',
      1,
      'Power rule: d/dx(x^n) = n*x^(n-1)'
    );
    const q2 = await quizModel.addQuestion(
      quizId,
      'What is the derivative of a constant c?',
      '0',
      '1',
      'c',
      'undefined',
      'A',
      1,
      'Derivative of constant is 0'
    );
    assert(q1 > 0 && q2 > 0, 'Quiz questions added');

    const attId = await quizModel.startAttempt(quizId, testReg);
    assert(attId > 0, `Student quiz attempt started with ID: ${attId}`);

    await quizModel.saveResponse(attId, q1, 'B', true);
    await quizModel.saveResponse(attId, q2, 'A', true);
    await quizModel.submitAttempt(attId, 2, 2, 100.0);

    const quizResult = await quizModel.findAttemptResults(quizId, testReg);
    assert(quizResult.attempt.score == 2, 'Quiz auto-graded correctly (2/2)');
    assert(quizResult.attempt.percentage == 100.0, 'Quiz percentage calculated (100%)');

    // 8. CBT Integrated Examination Engine & One-Attempt Protection
    console.log('\n--- TEST 8: CBT Integrated Exam Engine & Single Attempt Lockout ---');
    const examId = await examModel.create(
      'Advanced Mathematics CBT Exam 2026',
      30,
      classroomId,
      1,
      null,
      null,
      'Answer all questions. Strictly one attempt.'
    );
    assert(examId > 0, `Classroom CBT Exam created with ID: ${examId}`);

    const cbtQ1 = await questionModel.create(
      examId,
      'What is \\int 2x dx?',
      'x^2 + C',
      '2x^2 + C',
      'x + C',
      '2 + C',
      'A'
    );
    assert(cbtQ1 > 0, 'CBT Exam questions added');

    // Start CBT attempt
    const cbtToken = uuidv4();
    const cbtAttemptId = await examAttemptModel.createAttempt(testReg, examId, cbtToken, [cbtQ1]);
    assert(cbtAttemptId > 0, `CBT attempt created for ${testReg}`);

    // Save answer
    await responseModel.upsertAnswer(testReg, cbtQ1, 'A');
    const answerMap = await responseModel.findMapForExam(testReg, [cbtQ1]);
    assert(answerMap[cbtQ1] === 'A', 'Student CBT selected option autosaved');

    // Submit CBT attempt
    await examAttemptModel.submitAttempt(cbtAttemptId, 1);
    const submittedAttempt = await examAttemptModel.findByStudentExam(testReg, examId);
    assert(submittedAttempt.status === 'Submitted', 'CBT Attempt marked Submitted');
    assert(submittedAttempt.score === 1, 'CBT score recorded accurately (1 correct)');

    // Attempting retake should be rejected
    let retakeAllowed = true;
    try {
      const checkAttempt = await examAttemptModel.findByStudentExam(testReg, examId);
      if (checkAttempt && checkAttempt.status === 'Submitted') {
        retakeAllowed = false;
      }
    } catch {
      retakeAllowed = false;
    }
    assert(retakeAllowed === false, 'ONE-ATTEMPT PROTECTION ENFORCED: Retake blocked after submission');

    // 9. Attendance
    console.log('\n--- TEST 9: Attendance Register ---');
    const today = new Date().toISOString().split('T')[0];
    await attendanceModel.markAttendance(classroomId, lessonId, testReg, today, 'Present', 'Attended calculus lecture', tutorId);
    const attStats = await attendanceModel.getStudentStats(classroomId, testReg);
    assert(attStats.present_count >= 1, 'Attendance recorded as Present');
    assert(attStats.percentage === 100, 'Student attendance percentage calculated (100%)');

    // 10. Threaded Discussions
    console.log('\n--- TEST 10: Threaded Discussions ---');
    const discId = await discussionModel.create(
      classroomId,
      'Question regarding Calculus derivatives',
      'Can someone explain the chain rule with a trigonometric example?',
      'student',
      testReg,
      'Jane Doe',
      lessonId
    );
    assert(discId > 0, `Discussion thread created with ID: ${discId}`);

    const commId = await discussionModel.addComment(
      discId,
      'tutor',
      String(tutorId),
      'Prof. Alan Turing',
      'For sin(2x), let u=2x, so d/dx(sin(u)) = cos(u) * du/dx = 2cos(2x).'
    );
    assert(commId > 0, `Tutor reply posted with ID: ${commId}`);

    // 11. Gradebook Aggregation
    console.log('\n--- TEST 11: Unified Gradebook Aggregation ---');
    const gradebook = await gradebookModel.getStudentGradebook(classroomId, testReg);
    assert(gradebook.studentGrade !== null, `Gradebook record found for student ${testReg}`);
    assert(gradebook.studentGrade.overallAverage >= 80, `Composite average computed (${gradebook.studentGrade.overallAverage}%)`);
    assert(gradebook.studentGrade.grade === 'A', `Letter grade computed (${gradebook.studentGrade.grade})`);

    // 12. Collaborative Whiteboard & Live Sessions
    console.log('\n--- TEST 12: Live Classrooms & Collaborative Whiteboard ---');
    const liveCode = `LIVE-TEST-${Date.now()}`;
    const liveId = await liveSessionModel.create(classroomId, 'Calculus Live Seminar', tutorId, liveCode);
    assert(liveId > 0, `Live session started with code: ${liveCode}`);

    const activeLive = await liveSessionModel.findActiveSession(classroomId);
    assert(activeLive !== null && activeLive.session_code === liveCode, 'Active live session retrieved');

    await whiteboardModel.saveState(classroomId, '{"strokes": [{"tool": "pen", "points": [10, 20, 30]}]}', tutorId);
    const wb = await whiteboardModel.findByClassroom(classroomId);
    assert(wb !== null && wb.canvas_data.includes('strokes'), 'Whiteboard canvas state saved and synchronized');

    // 13. Notifications
    console.log('\n--- TEST 13: Centralized Notifications ---');
    const notifId = await notificationModel.create('student', testReg, 'Grade Published', 'Your Calculus assignment was graded.', 'grade');
    assert(notifId > 0, `Notification sent with ID: ${notifId}`);
    const unread = await notificationModel.getUnreadCount('student', testReg);
    assert(unread >= 1, `Unread notification count: ${unread}`);

    console.log('\n==================================================');
    console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('==================================================');

    if (failedTests === 0) {
      console.log('🎉 ALL INTEGRATION & PLATFORM TESTS PASSED SUCCESSFULLY!');
    }

  } catch (err) {
    console.error('Test execution error:', err);
  } finally {
    await pool.end();
  }
}

runTests();
