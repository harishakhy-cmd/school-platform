'use strict';

const pool = require('../config/database');

async function getClassroomGradebook(classroomId) {
  // 1. Get all active enrolled students
  const [students] = await pool.execute(`
    SELECT s.registration_number, s.name AS student_name
    FROM classroom_enrollments e
    JOIN students s ON s.registration_number = e.registration_number
    WHERE e.classroom_id = ? AND e.status = 'active'
    ORDER BY s.name ASC
  `, [classroomId]);

  // 2. Get all assignments for this classroom
  const [assignments] = await pool.execute(`
    SELECT id, title, max_marks FROM assignments
    WHERE classroom_id = ?
    ORDER BY deadline ASC
  `, [classroomId]);

  // 3. Get all quizzes for this classroom
  const [quizzes] = await pool.execute(`
    SELECT id, title, max_score FROM quizzes
    WHERE classroom_id = ?
    ORDER BY created_at ASC
  `, [classroomId]);

  // 4. Get all CBT exams linked to this classroom
  const [exams] = await pool.execute(`
    SELECT e.exam_id, e.title,
           (SELECT COUNT(*) FROM questions WHERE exam_id = e.exam_id) AS total_questions
    FROM exams e
    WHERE e.classroom_id = ?
    ORDER BY e.exam_id ASC
  `, [classroomId]);

  // 5. Fetch all assignment submissions
  const [assignSubs] = await pool.execute(`
    SELECT sub.assignment_id, sub.registration_number, sub.score, sub.status
    FROM assignment_submissions sub
    JOIN assignments a ON a.id = sub.assignment_id
    WHERE a.classroom_id = ?
  `, [classroomId]);

  // 6. Fetch all quiz attempts
  const [quizAtts] = await pool.execute(`
    SELECT att.quiz_id, att.registration_number, att.score, att.percentage, att.status
    FROM quiz_attempts att
    JOIN quizzes q ON q.id = att.quiz_id
    WHERE q.classroom_id = ?
  `, [classroomId]);

  // 7. Fetch all CBT attempts for classroom exams
  const [examAtts] = await pool.execute(`
    SELECT ea.exam_id, ea.registration_number, ea.score, ea.status
    FROM exam_attempts ea
    JOIN exams e ON e.exam_id = ea.exam_id
    WHERE e.classroom_id = ?
  `, [classroomId]);

  // Build lookup maps
  const subMap = {};
  for (const s of assignSubs) {
    subMap[`${s.registration_number}_${s.assignment_id}`] = s;
  }

  const quizMap = {};
  for (const q of quizAtts) {
    quizMap[`${q.registration_number}_${q.quiz_id}`] = q;
  }

  const examMap = {};
  for (const ex of examAtts) {
    examMap[`${ex.registration_number}_${ex.exam_id}`] = ex;
  }

  // Compile student rows
  const studentRows = students.map((st) => {
    const reg = st.registration_number;
    const assignmentScores = {};
    let assignTotal = 0;
    let assignCount = 0;

    for (const a of assignments) {
      const entry = subMap[`${reg}_${a.id}`];
      const score = entry && entry.score !== null ? Number(entry.score) : null;
      assignmentScores[a.id] = {
        score,
        status: entry ? entry.status : 'not_submitted',
        max: a.max_marks
      };
      if (score !== null) {
        assignTotal += (score / a.max_marks) * 100;
        assignCount += 1;
      }
    }

    const quizScores = {};
    let quizTotal = 0;
    let quizCount = 0;

    for (const q of quizzes) {
      const entry = quizMap[`${reg}_${q.id}`];
      const score = entry && entry.score !== null ? Number(entry.score) : null;
      const percentage = entry && entry.percentage !== null ? Number(entry.percentage) : null;
      quizScores[q.id] = {
        score,
        percentage,
        status: entry ? entry.status : 'not_attempted',
        max: q.max_score
      };
      if (percentage !== null) {
        quizTotal += percentage;
        quizCount += 1;
      }
    }

    const examScores = {};
    let examTotal = 0;
    let examCount = 0;

    for (const ex of exams) {
      const entry = examMap[`${reg}_${ex.exam_id}`];
      const score = entry && entry.score !== null ? Number(entry.score) : null;
      const totalQ = Math.max(1, Number(ex.total_questions) || 1);
      const percentage = score !== null ? Math.round((score / totalQ) * 100) : null;
      examScores[ex.exam_id] = {
        score,
        percentage,
        status: entry ? entry.status : 'not_attempted'
      };
      if (percentage !== null) {
        examTotal += percentage;
        examCount += 1;
      }
    }

    // Overall Average calculation
    let totalPercents = 0;
    let totalItems = 0;
    if (assignCount > 0) {
      totalPercents += (assignTotal / assignCount);
      totalItems += 1;
    }
    if (quizCount > 0) {
      totalPercents += (quizTotal / quizCount);
      totalItems += 1;
    }
    if (examCount > 0) {
      totalPercents += (examTotal / examCount);
      totalItems += 1;
    }

    const overallAverage = totalItems > 0 ? Math.round(totalPercents / totalItems) : 0;
    let grade = 'N/A';
    if (totalItems > 0) {
      if (overallAverage >= 80) grade = 'A';
      else if (overallAverage >= 70) grade = 'B';
      else if (overallAverage >= 60) grade = 'C';
      else if (overallAverage >= 50) grade = 'D';
      else grade = 'F';
    }

    return {
      registration_number: reg,
      student_name: st.student_name,
      assignmentScores,
      quizScores,
      examScores,
      overallAverage,
      grade
    };
  });

  return {
    classroomId,
    assignments,
    quizzes,
    exams,
    studentRows
  };
}

async function getStudentGradebook(classroomId, registrationNumber) {
  const all = await getClassroomGradebook(classroomId);
  const row = all.studentRows.find((r) => r.registration_number === registrationNumber) || null;
  return {
    classroomId,
    assignments: all.assignments,
    quizzes: all.quizzes,
    exams: all.exams,
    studentGrade: row
  };
}

module.exports = {
  getClassroomGradebook,
  getStudentGradebook
};
