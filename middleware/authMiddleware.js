const examAttemptModel = require('../models/examAttemptModel');
const questionModel = require('../models/questionModel');

function requireLogin(req, res, next) {
  if (!req.session.registrationNumber && !req.session.adminId) {
    return res.status(401).json({ error: 'Login required', code: 'AUTH_REQUIRED' });
  }
  next();
}

function requireStudent(req, res, next) {
  if (!req.session.registrationNumber) {
    return res.status(401).json({ error: 'Student login required', code: 'STUDENT_AUTH_REQUIRED' });
  }
  next();
}

async function performSubmit(registrationNumber, examId) {
  const latest = await examAttemptModel.findByStudentExam(registrationNumber, examId);
  if (!latest) return null;
  if (latest.status === 'Submitted') {
    const rows = await questionModel.findWithAnswersByExamForGrading(examId, registrationNumber);
    return { score: latest.score, total: rows.length, submitted: true };
  }
  const rows = await questionModel.findWithAnswersByExamForGrading(examId, registrationNumber);
  let correct = 0;
  for (const r of rows) {
    let isCorrect = false;
    if (r.selected_option && r.selected_option === r.correct_answer) {
      isCorrect = true;
    } else if (r.geo_target && r.graph_answer) {
      try {
        const tgt = typeof r.geo_target === 'string' ? JSON.parse(r.geo_target) : r.geo_target;
        const ans = typeof r.graph_answer === 'string' ? JSON.parse(r.graph_answer) : r.graph_answer;
        if (tgt && ans && typeof ans.lat === 'number' && typeof ans.lng === 'number' && typeof tgt.lat === 'number' && typeof tgt.lng === 'number') {
          const R = 6371;
          const dLat = (tgt.lat - ans.lat) * Math.PI / 180;
          const dLng = (tgt.lng - ans.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 +
                    Math.cos(ans.lat * Math.PI / 180) * Math.cos(tgt.lat * Math.PI / 180) *
                    Math.sin(dLng / 2) ** 2;
          const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const toleranceKm = tgt.tolerance_km || 25;
          if (distKm <= toleranceKm) {
            isCorrect = true;
          }
        }
      } catch (_) {}
    }
    if (isCorrect) {
      correct += 1;
    }
  }
  await examAttemptModel.submitAttempt(latest.id, correct);
  return { score: correct, total: rows.length, submitted: true };
}

function clearExamBinding(req, examId) {
  if (req.session.examAccess) {
    delete req.session.examAccess[String(examId)];
  }
}

async function requireValidAttempt(req, res, next) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (Number.isNaN(examId)) {
      return res.status(400).json({ error: 'Invalid exam id' });
    }
    const reg = req.session.registrationNumber;
    const binding = req.session.examAccess && req.session.examAccess[String(examId)];
    if (!binding || !binding.token) {
      return res.status(403).json({ error: 'Start the exam from the exam list first', code: 'NO_ATTEMPT' });
    }
    const attempt = await examAttemptModel.findByStudentExam(reg, examId);
    if (!attempt) {
      return res.status(403).json({ error: 'No exam attempt found', code: 'NO_ATTEMPT' });
    }
    if (attempt.status === 'Submitted') {
      return res.status(403).json({ error: 'This exam was already submitted', code: 'ALREADY_SUBMITTED' });
    }
    if (attempt.session_token !== binding.token) {
      return res.status(403).json({
        error: 'This exam is open elsewhere. Start again from the list to take over this session.',
        code: 'TOKEN_MISMATCH'
      });
    }
    const deadline =
      new Date(attempt.start_time).getTime() + attempt.duration_minutes * 60 * 1000;
    if (Date.now() >= deadline) {
      const result = await performSubmit(reg, examId);
      clearExamBinding(req, examId);
      return res.status(403).json({
        error: 'Time has expired. Your attempt was submitted automatically.',
        code: 'TIME_EXPIRED',
        result
      });
    }
    req.cbtAttempt = attempt;
    req.cbtExamId = examId;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requireLogin,
  requireStudent,
  requireValidAttempt,
  performSubmit,
  clearExamBinding
};
