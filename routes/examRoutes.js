const express = require('express');
const examController = require('../controllers/examController');
const { requireStudent, requireValidAttempt } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', requireStudent, examController.listExams);
router.post('/:examId/start', requireStudent, examController.startExam);
router.get('/:examId/session', requireStudent, requireValidAttempt, examController.getSession);
router.post('/:examId/answer', requireStudent, requireValidAttempt, examController.saveAnswer);
router.post('/:examId/submit', requireStudent, requireValidAttempt, examController.submit);
router.get('/:examId/result', requireStudent, examController.getResult);

module.exports = router;
