'use strict';

const express = require('express');
const lessonController = require('../controllers/lessonController');
const assignmentController = require('../controllers/assignmentController');
const quizController = require('../controllers/quizController');
const attendanceController = require('../controllers/attendanceController');
const discussionController = require('../controllers/discussionController');
const announcementController = require('../controllers/announcementController');
const notificationController = require('../controllers/notificationController');
const calendarController = require('../controllers/calendarController');
const gradebookController = require('../controllers/gradebookController');
const liveSessionController = require('../controllers/liveSessionController');
const liveTokenController = require('../controllers/liveTokenController');
const whiteboardController = require('../controllers/whiteboardController');
const aiAssistantController = require('../controllers/aiAssistantController');
const graphingController = require('../controllers/graphingController');
const {
  requireClassroomAccess,
  requireClassroomTutorOrAdmin,
  requireTutorOrAdmin
} = require('../middleware/adminAuthMiddleware');
const { requireLogin } = require('../middleware/authMiddleware');

const router = express.Router({ mergeParams: true });

// --- Lessons & Materials ---
router.get('/lessons', requireClassroomAccess, lessonController.listLessons);
router.post('/lessons', requireClassroomTutorOrAdmin, lessonController.createLesson);
router.get('/lessons/:lessonId', requireClassroomAccess, lessonController.getLesson);
router.put('/lessons/:lessonId', requireClassroomTutorOrAdmin, lessonController.updateLesson);
router.delete('/lessons/:lessonId', requireClassroomTutorOrAdmin, lessonController.deleteLesson);
router.post('/lessons/:lessonId/complete', requireClassroomAccess, lessonController.toggleLessonCompletion);

router.get('/materials', requireClassroomAccess, lessonController.listMaterials);
router.post('/materials', requireClassroomTutorOrAdmin, lessonController.addMaterial);
router.delete('/materials/:materialId', requireClassroomTutorOrAdmin, lessonController.deleteMaterial);

// --- Assignments & Submissions ---
router.get('/assignments', requireClassroomAccess, assignmentController.listAssignments);
router.post('/assignments', requireClassroomTutorOrAdmin, assignmentController.createAssignment);
router.get('/assignments/:assignmentId', requireClassroomAccess, assignmentController.getAssignment);
router.put('/assignments/:assignmentId', requireClassroomTutorOrAdmin, assignmentController.updateAssignment);
router.delete('/assignments/:assignmentId', requireClassroomTutorOrAdmin, assignmentController.deleteAssignment);
router.post('/assignments/:assignmentId/submit', requireClassroomAccess, assignmentController.submitAssignment);
router.put('/assignments/submissions/:submissionId/grade', requireClassroomTutorOrAdmin, assignmentController.gradeSubmission);

// --- Quizzes ---
router.get('/quizzes', requireClassroomAccess, quizController.listQuizzes);
router.post('/quizzes', requireClassroomTutorOrAdmin, quizController.createQuiz);
router.get('/quizzes/:quizId', requireClassroomAccess, quizController.getQuiz);
router.post('/quizzes/:quizId/questions', requireClassroomTutorOrAdmin, quizController.addQuizQuestion);
router.post('/quizzes/:quizId/start', requireClassroomAccess, quizController.startQuizAttempt);
router.post('/quizzes/:quizId/submit', requireClassroomAccess, quizController.submitQuizAttempt);
router.get('/quizzes/:quizId/result', requireClassroomAccess, quizController.getQuizResult);

// --- Attendance ---
router.get('/attendance', requireClassroomAccess, attendanceController.getClassroomAttendance);
router.post('/attendance', requireClassroomTutorOrAdmin, attendanceController.markAttendance);
router.post('/attendance/batch', requireClassroomTutorOrAdmin, attendanceController.markBatchAttendance);
router.get('/attendance/student/:registrationNumber?', requireClassroomAccess, attendanceController.getStudentStats);

// --- Discussions ---
router.get('/discussions', requireClassroomAccess, discussionController.listDiscussions);
router.post('/discussions', requireClassroomAccess, discussionController.createDiscussion);
router.get('/discussions/:discussionId', requireClassroomAccess, discussionController.getDiscussion);
router.post('/discussions/:discussionId/comments', requireClassroomAccess, discussionController.addComment);
router.delete('/discussions/:discussionId', requireClassroomTutorOrAdmin, discussionController.deleteDiscussion);
router.delete('/discussions/comments/:commentId', requireClassroomTutorOrAdmin, discussionController.deleteComment);

// --- Announcements ---
router.get('/announcements', requireClassroomAccess, announcementController.listClassroomAnnouncements);
router.post('/announcements', requireClassroomTutorOrAdmin, announcementController.createAnnouncement);
router.delete('/announcements/:announcementId', requireClassroomTutorOrAdmin, announcementController.deleteAnnouncement);

// --- Gradebook ---
router.get('/gradebook', requireClassroomAccess, gradebookController.getClassroomGradebook);
router.get('/gradebook/student/:registrationNumber?', requireClassroomAccess, gradebookController.getStudentClassroomGrades);

// --- Live Sessions ---
router.get('/live', requireClassroomAccess, liveSessionController.getLiveStatus);
router.post('/live', requireClassroomTutorOrAdmin, liveSessionController.startLiveSession);
router.put('/live/end', requireClassroomTutorOrAdmin, liveSessionController.endLiveSession);
router.post('/live/token', requireClassroomAccess, liveTokenController.getLiveToken);

// --- Whiteboard ---
router.get('/whiteboard', requireClassroomAccess, whiteboardController.getWhiteboardState);
router.post('/whiteboard', requireClassroomTutorOrAdmin, whiteboardController.saveWhiteboardState);
router.delete('/whiteboard', requireClassroomTutorOrAdmin, whiteboardController.clearWhiteboard);

// --- Interactive Graphing Lab (Classroom Scoped) ---
router.get('/graphing/graphs', requireClassroomAccess, graphingController.listSavedGraphs);
router.post('/graphing/graphs', requireClassroomAccess, graphingController.saveGraph);
router.get('/graphing/graphs/:id', requireClassroomAccess, graphingController.getSavedGraph);
router.delete('/graphing/graphs/:id', requireClassroomAccess, graphingController.deleteSavedGraph);

module.exports = router;
