'use strict';

const quizModel = require('../models/quizModel');
const notificationModel = require('../models/notificationModel');
const calendarModel = require('../models/calendarModel');

async function listQuizzes(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const studentReg = req.session.registrationNumber || null;
    const quizzes = await quizModel.findByClassroom(classroomId, studentReg);
    return res.json({ ok: true, quizzes });
  } catch (err) {
    next(err);
  }
}

async function getQuiz(req, res, next) {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    const quiz = await quizModel.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const isStaff = req.userClassroomRole === 'tutor' || req.userClassroomRole === 'admin';
    const questions = await quizModel.findQuestionsByQuiz(quizId, isStaff);
    let attempt = null;

    if (req.session.registrationNumber) {
      attempt = await quizModel.findAttempt(quizId, req.session.registrationNumber);
    }

    return res.json({ ok: true, quiz, questions, attempt });
  } catch (err) {
    next(err);
  }
}

async function createQuiz(req, res, next) {
  try {
    const classroomId = req.classroom.id;
    const { title, description, duration_minutes, max_score, pass_score, start_date, end_date, questions, subject_id } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Quiz title is required' });
    }

    const createdBy = req.session.adminId;
    const quizId = await quizModel.create(
      classroomId,
      title.trim(),
      description ? description.trim() : null,
      duration_minutes ? parseInt(duration_minutes, 10) : 15,
      max_score ? parseInt(max_score, 10) : 100,
      pass_score ? parseInt(pass_score, 10) : 50,
      start_date || null,
      end_date || null,
      createdBy,
      subject_id ? parseInt(subject_id, 10) : req.classroom.subject_id
    );

    // If questions provided in payload, insert them
    if (Array.isArray(questions)) {
      for (const q of questions) {
        if (q.question_text && q.option_a && q.option_b && q.option_c && q.option_d && q.correct_answer) {
          await quizModel.addQuestion(
            quizId,
            q.question_text.trim(),
            q.option_a.trim(),
            q.option_b.trim(),
            q.option_c.trim(),
            q.option_d.trim(),
            q.correct_answer,
            q.points || 1,
            q.explanation || null
          );
        }
      }
    }

    // Notify students
    await notificationModel.notifyClassroomStudents(
      classroomId,
      `New Quiz: ${title.trim()}`,
      `A new quiz is available in ${req.classroom.name}.`,
      'quiz',
      `/classroom.html?id=${classroomId}&tab=quizzes`
    );

    return res.json({ ok: true, quiz_id: quizId, message: 'Quiz created successfully' });
  } catch (err) {
    next(err);
  }
}

async function addQuizQuestion(req, res, next) {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, points, explanation } = req.body;

    if (!question_text || !option_a || !option_b || !option_c || !option_d || !correct_answer) {
      return res.status(400).json({ error: 'All question fields and correct answer are required' });
    }

    const questionId = await quizModel.addQuestion(
      quizId,
      question_text.trim(),
      option_a.trim(),
      option_b.trim(),
      option_c.trim(),
      option_d.trim(),
      correct_answer,
      points ? parseInt(points, 10) : 1,
      explanation ? explanation.trim() : null
    );

    return res.json({ ok: true, question_id: questionId, message: 'Question added successfully' });
  } catch (err) {
    next(err);
  }
}

async function startQuizAttempt(req, res, next) {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    const registrationNumber = req.session.registrationNumber;
    if (!registrationNumber) {
      return res.status(401).json({ error: 'Student login required' });
    }

    let attempt = await quizModel.findAttempt(quizId, registrationNumber);
    if (attempt && attempt.status === 'Submitted') {
      return res.status(403).json({ error: 'You have already completed this quiz.', code: 'ALREADY_SUBMITTED' });
    }

    if (!attempt) {
      await quizModel.startAttempt(quizId, registrationNumber);
      attempt = await quizModel.findAttempt(quizId, registrationNumber);
    }

    const questions = await quizModel.findQuestionsByQuiz(quizId, false);
    return res.json({ ok: true, attempt, questions });
  } catch (err) {
    next(err);
  }
}

async function submitQuizAttempt(req, res, next) {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    const registrationNumber = req.session.registrationNumber;
    if (!registrationNumber) {
      return res.status(401).json({ error: 'Student login required' });
    }

    const attempt = await quizModel.findAttempt(quizId, registrationNumber);
    if (!attempt || attempt.status === 'Submitted') {
      return res.status(400).json({ error: 'No active attempt found or quiz already submitted.' });
    }

    const { answers } = req.body; // { questionId: 'A' }
    const questions = await quizModel.findQuestionsByQuiz(quizId, true);

    let totalPoints = 0;
    let earnedPoints = 0;

    for (const q of questions) {
      const pts = q.points || 1;
      totalPoints += pts;
      const selected = answers ? answers[q.id] : null;
      const isCorrect = selected === q.correct_answer;
      if (isCorrect) {
        earnedPoints += pts;
      }
      if (selected) {
        await quizModel.saveResponse(attempt.id, q.id, selected, isCorrect);
      }
    }

    const percentage = totalPoints > 0 ? ((earnedPoints / totalPoints) * 100).toFixed(2) : 0;
    await quizModel.submitAttempt(attempt.id, earnedPoints, totalPoints, percentage);

    return res.json({
      ok: true,
      score: earnedPoints,
      total_points: totalPoints,
      percentage,
      message: 'Quiz submitted and graded successfully'
    });
  } catch (err) {
    next(err);
  }
}

async function getQuizResult(req, res, next) {
  try {
    const quizId = parseInt(req.params.quizId, 10);
    const registrationNumber = req.session.registrationNumber;
    if (!registrationNumber) {
      return res.status(401).json({ error: 'Student login required' });
    }

    const results = await quizModel.findAttemptResults(quizId, registrationNumber);
    if (!results) {
      return res.status(404).json({ error: 'Quiz results not found' });
    }

    return res.json({ ok: true, ...results });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listQuizzes,
  getQuiz,
  createQuiz,
  addQuizQuestion,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResult
};
