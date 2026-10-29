const { v4: uuidv4 } = require('uuid');
const examModel = require('../models/examModel');
const questionModel = require('../models/questionModel');
const examAttemptModel = require('../models/examAttemptModel');
const responseModel = require('../models/responseModel');
const {
  performSubmit,
  clearExamBinding
} = require('../middleware/authMiddleware');

function shuffle(ids) {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setExamBinding(req, examId, token) {
  req.session.examAccess = req.session.examAccess || {};
  req.session.examAccess[String(examId)] = { token };
}

async function listExams(req, res, next) {
  try {
    const reg = req.session.registrationNumber;
    const exams = await examModel.findAllApprovedAndBroadcasted();
    const result = [];
    for (const e of exams) {
      const att = await examAttemptModel.findByStudentExam(reg, e.exam_id);
      let attemptStatus = 'NotStarted';
      if (att) {
        attemptStatus = att.status === 'Submitted' ? 'Submitted' : 'InProgress';
      }
      result.push({
        exam_id: e.exam_id,
        title: e.title,
        duration: e.duration,
        attemptStatus
      });
    }
    res.json({ exams: result });
  } catch (err) {
    next(err);
  }
}

async function startExam(req, res, next) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (Number.isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam id' });
    }
    const reg = req.session.registrationNumber;
    const exam = await examModel.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    // Verify exam is approved and broadcasted for students
    if (exam.approval_status !== 'approved' || !exam.is_broadcasted) {
      return res.status(403).json({
        error: 'This exam is not active or has not been broadcasted to students yet.',
        code: 'EXAM_NOT_ACTIVE'
      });
    }
    const other = await examAttemptModel.findInProgressOtherExam(reg, examId);
    if (other) {
      return res.status(409).json({
        error: 'You already have an exam in progress. Submit or finish it before starting another.',
        code: 'OTHER_EXAM_IN_PROGRESS',
        blocking_exam_id: other.exam_id
      });
    }
    let attempt = await examAttemptModel.findByStudentExam(reg, examId);
    if (attempt && attempt.status === 'Submitted') {
      return res.status(403).json({
        error: 'You have already submitted this exam. Retakes are not allowed.',
        code: 'ALREADY_SUBMITTED'
      });
    }
    const newToken = uuidv4();
    if (attempt && attempt.status === 'InProgress') {
      await examAttemptModel.updateSessionToken(attempt.id, newToken);
      setExamBinding(req, examId, newToken);
      return res.json({
        ok: true,
        resumed: true,
        exam_id: examId,
        session_token: newToken
      });
    }
    const questionIds = await questionModel.findIdsByExam(examId);
    if (!questionIds.length) {
      return res.status(400).json({ error: 'This exam has no questions yet.' });
    }
    const order = shuffle(questionIds);
    await examAttemptModel.createAttempt(reg, examId, newToken, order);
    setExamBinding(req, examId, newToken);
    return res.json({
      ok: true,
      resumed: false,
      exam_id: examId,
      session_token: newToken
    });
  } catch (err) {
    next(err);
  }
}

const pool = require('../config/database');

async function getSession(req, res, next) {
  try {
    const examId = req.cbtExamId;
    const attempt = req.cbtAttempt;
    const reg = req.session.registrationNumber;
    const exam = await examModel.findById(examId);
    const order = Array.isArray(attempt.question_order) ? attempt.question_order : [];
    const questions = await questionModel.findPublicByIds(order);
    const answers = await responseModel.findMapForExam(reg, order);
    const endTime =
      new Date(attempt.start_time).getTime() + attempt.duration_minutes * 60 * 1000;

    // Fetch live security policy settings
    let policies = {
      enforceFullscreen: true,
      disableCopyPaste: true,
      tabSwitchLimit: 3,
      autoSubmitTimer: true
    };
    try {
      const [rows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE category = 'exam'"
      );
      for (const r of rows) {
        if (r.setting_key === 'cbt_enforce_fullscreen') policies.enforceFullscreen = r.setting_value === 'true';
        if (r.setting_key === 'cbt_disable_copy_paste') policies.disableCopyPaste = r.setting_value === 'true';
        if (r.setting_key === 'cbt_tab_switch_limit') policies.tabSwitchLimit = parseInt(r.setting_value, 10) || 3;
        if (r.setting_key === 'cbt_auto_submit_timer') policies.autoSubmitTimer = r.setting_value === 'true';
      }
    } catch (_) { /* use defaults if DB query fails */ }

    res.json({
      exam: { exam_id: exam.exam_id, title: exam.title, duration: exam.duration },
      endTime,
      serverNow: Date.now(),
      questionOrder: order,
      questions,
      answers,
      policies
    });
  } catch (err) {
    next(err);
  }
}

async function saveAnswer(req, res, next) {
  try {
    const examId = req.cbtExamId;
    const attempt = req.cbtAttempt;
    const reg = req.session.registrationNumber;
    const questionId = parseInt(req.body.question_id, 10);
    const selected = req.body.selected_option;
    const allowed = new Set(['A', 'B', 'C', 'D']);
    if (Number.isNaN(questionId)) {
      return res.status(400).json({ error: 'Invalid question' });
    }
    if (!allowed.has(selected)) {
      return res.status(400).json({ error: 'Option must be A, B, C, or D' });
    }
    const order = Array.isArray(attempt.question_order) ? attempt.question_order : [];
    if (!order.includes(questionId)) {
      return res.status(400).json({ error: 'Question does not belong to this exam attempt' });
    }
    const graphAnswer = req.body.graph_answer || null;
    await responseModel.upsertAnswer(reg, questionId, selected, graphAnswer);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function submit(req, res, next) {
  try {
    const examId = req.cbtExamId;
    const reg = req.session.registrationNumber;
    const result = await performSubmit(reg, examId);
    clearExamBinding(req, examId);
    if (!result) {
      return res.status(400).json({ error: 'Unable to submit' });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  }
}

async function getResult(req, res, next) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (Number.isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam id' });
    }
    const reg = req.session.registrationNumber;
    const attempt = await examAttemptModel.findByStudentExam(reg, examId);
    if (!attempt) {
      return res.status(404).json({ error: 'No attempt found for this exam' });
    }
    if (attempt.status === 'InProgress') {
      return res.status(400).json({
        error: 'Exam still in progress',
        code: 'IN_PROGRESS'
      });
    }
    const exam = await examModel.findById(examId);
    const rows = await questionModel.findWithAnswersByExamForGrading(examId, reg);
    const total = rows.length;
    const score = attempt.score;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    let passPercentage = 50;
    try {
      const [pRows] = await pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'cbt_pass_percentage' LIMIT 1"
      );
      if (pRows.length) passPercentage = parseInt(pRows[0].setting_value, 10) || 50;
    } catch (_) {}

    res.json({
      exam_id: examId,
      title: exam.title,
      score,
      total,
      percentage,
      passPercentage,
      passed: percentage >= passPercentage,
      submittedAt: attempt.end_time
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listExams,
  startExam,
  getSession,
  saveAnswer,
  submit,
  getResult
};
