const studentModel = require('../models/studentModel');
const examModel = require('../models/examModel');
const questionModel = require('../models/questionModel');
const examAttemptModel = require('../models/examAttemptModel');
const adminUserModel = require('../models/adminUserModel');
const {
  normalizeRegistrationNumber,
  isValidRegistrationNumber
} = require('../utils/registrationFormat');
const bcrypt = require('bcrypt');
const pool = require('../config/database');

// Helper function to generate admin code
function generateAdminCode(role, existingCodes = []) {
  const prefix = role === 'super_admin' ? 'SPA1' : 'ODA01';
  let num = 1;
  let code;
  do {
    code = `${prefix}-${String(num).padStart(3, '0')}A`;
    num++;
  } while (existingCodes.includes(code) && num < 1000);
  return code;
}

async function addStudent(req, res, next) {
  try {
    const { registration_number, name, admin_id } = req.body;
    const studentName = typeof name === 'string' ? name.trim() : '';
    if (!studentName) {
      return res.status(400).json({ error: 'name is required' });
    }
    if (!isValidRegistrationNumber(registration_number)) {
      return res.status(400).json({
        error:
          'Registration number must match format STO1-001A (STO, digits, hyphen, three digits, one letter).'
      });
    }
    const reg = normalizeRegistrationNumber(registration_number);
    
    // If admin_id is provided, validate it exists
    let targetAdminId = null;
    if (admin_id) {
      const admin = await adminUserModel.findById(admin_id);
      if (!admin) {
        return res.status(404).json({ error: 'Specified admin not found' });
      }
      targetAdminId = admin_id;
    }
    
    await studentModel.create(reg, studentName, targetAdminId);
    res.json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Student already exists' });
    }
    next(err);
  }
}

async function assignStudentToAdmin(req, res, next) {
  try {
    const { registration_number, admin_id } = req.body;
    
    // Validate student exists
    const student = await studentModel.findByRegistration(registration_number);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }
    
    // Validate admin exists (or null to unassign)
    if (admin_id !== null && admin_id !== undefined) {
      const admin = await adminUserModel.findById(admin_id);
      if (!admin) {
        return res.status(404).json({ error: 'Admin not found' });
      }
    }
    
    await studentModel.updateAdmin(registration_number, admin_id || null);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function addExam(req, res, next) {
  try {
    const { title, duration } = req.body;
    const examTitle = typeof title === 'string' ? title.trim() : '';
    const minutes = parseInt(duration, 10);
    if (!examTitle || Number.isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ error: 'title and positive duration (minutes) are required' });
    }
    const examId = await examModel.create(examTitle, minutes);
    res.json({ ok: true, exam_id: examId });
  } catch (err) {
    next(err);
  }
}

async function addQuestion(req, res, next) {
  try {
    const examId = parseInt(req.body.exam_id, 10);
    const {
      question_text,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_answer,
      question_type = 'text',
      rich_text_content = null,
      supports_formatting = false,
      geo_config = null,
      geo_target = null
    } = req.body;
    const allowed = new Set(['A', 'B', 'C', 'D']);
    if (Number.isNaN(examId)) {
      return res.status(400).json({ error: 'exam_id required' });
    }
    const exam = await examModel.findById(examId);
    if (!exam) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    const ca =
      typeof correct_answer === 'string' ? correct_answer.trim().toUpperCase() : '';
    if (
      typeof question_text !== 'string' ||
      !question_text.trim() ||
      typeof option_a !== 'string' ||
      typeof option_b !== 'string' ||
      typeof option_c !== 'string' ||
      typeof option_d !== 'string' ||
      !allowed.has(ca)
    ) {
      return res.status(400).json({
        error: 'Invalid question: need question text, four options, and correct answer A–D.'
      });
    }
    const qid = await questionModel.create(
      examId,
      question_text.trim(),
      option_a.trim(),
      option_b.trim(),
      option_c.trim(),
      option_d.trim(),
      ca,
      question_type,
      rich_text_content,
      supports_formatting,
      geo_config,
      geo_target
    );
    res.json({ ok: true, question_id: qid });
  } catch (err) {
    next(err);
  }
}

async function listExams(req, res, next) {
  try {
    const exams = await examModel.findAll();
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

async function listStudents(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    // Super admins see all students, ordinary admins see their assigned students
    const students = adminRole === 'super_admin' 
      ? await studentModel.findAll() 
      : await studentModel.findByAdmin(adminId);
    
    // Enrich with admin username if admin_id is set
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        if (student.admin_id) {
          const admin = await adminUserModel.findById(student.admin_id);
          return {
            ...student,
            admin_username: admin ? admin.username : null,
            admin_code: admin ? admin.admin_code : null
          };
        }
        return { ...student, admin_username: null, admin_code: null };
      })
    );
    
    res.json({ students: enrichedStudents });
  } catch (err) {
    next(err);
  }
}

async function listAdmins(req, res, next) {
  try {
    const admins = await adminUserModel.findAll();
    res.json({ admins });
  } catch (err) {
    next(err);
  }
}

async function getResults(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (!adminId) {
      return res.status(401).json({ error: 'Not authenticated as admin' });
    }
    
    const { exam_id } = req.query;
    
    // Super admins see all results, ordinary admins see their assigned students' results
    let registrationNumbers;
    if (adminRole === 'super_admin') {
      const allStudents = await studentModel.findAll();
      registrationNumbers = allStudents.map(s => s.registration_number);
    } else {
      const students = await studentModel.findByAdmin(adminId);
      registrationNumbers = students.map(s => s.registration_number);
    }
    
    if (registrationNumbers.length === 0) {
      return res.json({ results: [] });
    }
    
    // Build query to get exam attempts for these students
    let query = `
      SELECT 
        ea.registration_number,
        s.name as student_name,
        ea.exam_id,
        e.title as exam_title,
        ea.start_time,
        ea.end_time,
        ea.status,
        ea.score,
        (SELECT COUNT(*) FROM questions q WHERE q.exam_id = ea.exam_id) as total_questions
      FROM exam_attempts ea
      JOIN students s ON s.registration_number = ea.registration_number
      JOIN exams e ON e.exam_id = ea.exam_id
      WHERE ea.registration_number IN (?)
    `;
    
    const params = [registrationNumbers];
    
    if (exam_id) {
      query += ' AND ea.exam_id = ?';
      params.push(parseInt(exam_id, 10));
    }
    
    query += ' ORDER BY ea.exam_id, s.name';
    
    const [rows] = await pool.execute(query, params);
    
    res.json({ results: rows });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// Super Admin Functions
// ==========================================

async function createAdmin(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    // Only super admins can create admins
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create new admins' });
    }
    
    const { username, password, role = 'ordinary_admin', full_name, email, status } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    // Check if username already exists
    const existing = await adminUserModel.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Generate admin code
    const existingCodes = [];
    const allAdmins = await adminUserModel.findAll();
    allAdmins.forEach(a => { if (a.admin_code) existingCodes.push(a.admin_code); });
    const adminCode = generateAdminCode(role, existingCodes);
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    const initialStatus = status === 'active' ? 'active' : 'pending';

    // Create admin
    const newAdminId = await adminUserModel.create(
      username, 
      passwordHash, 
      role, 
      initialStatus, 
      adminId, 
      adminCode
    );

    if (full_name || email) {
      await pool.execute(
        'UPDATE admin_users SET full_name = ?, email = ? WHERE id = ?',
        [full_name ? full_name.trim() : null, email ? email.trim() : null, newAdminId]
      );
    }
    
    // Log activity
    await logAdminActivity(adminId, 'create_admin', 'admin', newAdminId, `Created ${role} admin: ${username}`);
    
    res.json({ 
      ok: true, 
      admin_id: newAdminId,
      admin_code: adminCode,
      message: initialStatus === 'active' ? 'Admin account created and active.' : 'Admin created successfully. Account is pending activation.'
    });
  } catch (err) {
    next(err);
  }
}

async function activateAdmin(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can activate admins' });
    }
    
    const { id } = req.params;
    
    const admin = await adminUserModel.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    await adminUserModel.updateStatus(id, 'active');
    await logAdminActivity(adminId, 'activate_admin', 'admin', id, `Activated admin: ${admin.username}`);
    
    res.json({ ok: true, message: 'Admin activated successfully' });
  } catch (err) {
    next(err);
  }
}

async function promoteAdmin(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can promote admins' });
    }
    
    const { id } = req.params;
    
    const admin = await adminUserModel.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    if (admin.role === 'super_admin') {
      return res.status(400).json({ error: 'Admin is already a super admin' });
    }
    
    // Check if there's already a super admin with similar code
    const existingCodes = [];
    const allAdmins = await adminUserModel.findAll();
    allAdmins.forEach(a => { if (a.admin_code) existingCodes.push(a.admin_code); });
    const newCode = generateAdminCode('super_admin', existingCodes);
    
    await adminUserModel.updateRole(id, 'super_admin');
    await adminUserModel.updateAdminCode(id, newCode);
    await logAdminActivity(adminId, 'promote_admin', 'admin', id, `Promoted to super admin: ${admin.username}`);
    
    res.json({ ok: true, new_code: newCode, message: 'Admin promoted to super admin successfully' });
  } catch (err) {
    next(err);
  }
}

async function suspendAdmin(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can suspend admins' });
    }
    
    const { id } = req.params;
    
    const admin = await adminUserModel.findById(id);
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }
    
    // Can't suspend yourself
    if (parseInt(id) === adminId) {
      return res.status(400).json({ error: 'Cannot suspend yourself' });
    }
    
    await adminUserModel.updateStatus(id, 'suspended');
    await logAdminActivity(adminId, 'suspend_admin', 'admin', id, `Suspended admin: ${admin.username}`);
    
    res.json({ ok: true, message: 'Admin suspended successfully' });
  } catch (err) {
    next(err);
  }
}

async function getPendingExams(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can access pending exams' });
    }
    
    const [exams] = await pool.execute(`
      SELECT e.*, au.username as created_by_username, au.admin_code as created_by_code
      FROM exams e
      JOIN admin_users au ON e.created_by_admin_id = au.id
      WHERE e.approval_status = 'pending'
      ORDER BY e.exam_id DESC
    `);
    
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

async function approveExam(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can approve exams' });
    }
    
    const { id } = req.params;
    
    await pool.execute(`
      UPDATE exams 
      SET approval_status = 'approved', approved_by = ?, approved_at = NOW()
      WHERE exam_id = ? AND approval_status = 'pending'
    `, [adminId, id]);
    
    await logAdminActivity(adminId, 'approve_exam', 'exam', id, 'Approved exam');
    
    res.json({ ok: true, message: 'Exam approved successfully' });
  } catch (err) {
    next(err);
  }
}

async function rejectExam(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can reject exams' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;
    
    await pool.execute(`
      UPDATE exams 
      SET approval_status = 'rejected', rejection_reason = ?
      WHERE exam_id = ? AND approval_status = 'pending'
    `, [reason || 'No reason provided', id]);
    
    await logAdminActivity(adminId, 'reject_exam', 'exam', id, `Rejected exam: ${reason || 'No reason provided'}`);
    
    res.json({ ok: true, message: 'Exam rejected' });
  } catch (err) {
    next(err);
  }
}

async function broadcastExam(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can broadcast exams' });
    }
    
    const { id } = req.params;
    
    // Check if exam is approved
    const [exams] = await pool.execute('SELECT approval_status FROM exams WHERE exam_id = ?', [id]);
    if (exams.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    
    if (exams[0].approval_status !== 'approved') {
      return res.status(400).json({ error: 'Only approved exams can be broadcasted' });
    }
    
    await pool.execute(`
      UPDATE exams 
      SET is_broadcasted = TRUE, broadcasted_at = NOW()
      WHERE exam_id = ?
    `, [id]);
    
    await logAdminActivity(adminId, 'broadcast_exam', 'exam', id, 'Broadcasted exam to students');
    
    res.json({ ok: true, message: 'Exam broadcasted to students successfully' });
  } catch (err) {
    next(err);
  }
}

// ==========================================
// Ordinary Admin Functions
// ==========================================

async function createExamByOrdinaryAdmin(req, res, next) {
  try {
    const adminId = req.session.adminId;
    const adminRole = req.session.adminRole;
    
    // Both super and ordinary admins can create exams
    // Super admin exams are auto-approved, ordinary admin exams go to pending
    
    const { title, duration } = req.body;
    const examTitle = typeof title === 'string' ? title.trim() : '';
    const minutes = parseInt(duration, 10);
    
    if (!examTitle || Number.isNaN(minutes) || minutes <= 0) {
      return res.status(400).json({ error: 'title and positive duration (minutes) are required' });
    }
    
    const approvalStatus = adminRole === 'super_admin' ? 'approved' : 'pending';
    
    const [result] = await pool.execute(`
      INSERT INTO exams (title, duration, created_by_admin_id, approval_status)
      VALUES (?, ?, ?, ?)
    `, [examTitle, minutes, adminId, approvalStatus]);
    
    const examId = result.insertId;
    
    const statusMessage = adminRole === 'super_admin' 
      ? 'Exam created and approved' 
      : 'Exam submitted for approval';
    
    await logAdminActivity(adminId, 'create_exam', 'exam', examId, `Created exam: ${examTitle}`);
    
    res.json({ 
      ok: true, 
      exam_id: examId,
      status: approvalStatus,
      message: statusMessage
    });
  } catch (err) {
    next(err);
  }
}

async function getMyExams(req, res, next) {
  try {
    const adminId = req.session.adminId;
    
    const [exams] = await pool.execute(`
      SELECT * FROM exams 
      WHERE created_by_admin_id = ? 
      ORDER BY exam_id DESC
    `, [adminId]);
    
    res.json({ exams });
  } catch (err) {
    next(err);
  }
}

// --- Academic Structure Handlers (Terms, Classes, Subjects, Tutors) ---
const academicTermModel = require('../models/academicTermModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const tutorModel = require('../models/tutorModel');

async function listAcademicTerms(req, res, next) {
  try {
    const terms = await academicTermModel.findAll();
    res.json({ ok: true, terms });
  } catch (err) {
    next(err);
  }
}

async function createAcademicTerm(req, res, next) {
  try {
    const { academic_year, term_name, start_date, end_date, is_current } = req.body;
    if (!academic_year || !term_name) {
      return res.status(400).json({ error: 'academic_year and term_name are required' });
    }
    const id = await academicTermModel.create(
      academic_year.trim(),
      term_name.trim(),
      start_date || null,
      end_date || null,
      is_current === true || is_current === 'true'
    );
    res.json({ ok: true, id, message: 'Academic term created' });
  } catch (err) {
    next(err);
  }
}

async function setCurrentAcademicTerm(req, res, next) {
  try {
    const termId = parseInt(req.params.id, 10);
    await academicTermModel.setCurrent(termId);
    res.json({ ok: true, message: 'Active term updated' });
  } catch (err) {
    next(err);
  }
}

async function listClasses(req, res, next) {
  try {
    const classes = await classModel.findAll();
    res.json({ ok: true, classes });
  } catch (err) {
    next(err);
  }
}

async function createClass(req, res, next) {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Class name and code are required' });
    }
    const id = await classModel.create(name.trim(), code.trim().toUpperCase(), description ? description.trim() : null);
    res.json({ ok: true, id, message: 'Class created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Class code already exists' });
    next(err);
  }
}

async function listSubjects(req, res, next) {
  try {
    const subjects = await subjectModel.findAll();
    res.json({ ok: true, subjects });
  } catch (err) {
    next(err);
  }
}

async function createSubject(req, res, next) {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Subject name and code are required' });
    }
    const id = await subjectModel.create(name.trim(), code.trim().toUpperCase(), description ? description.trim() : null);
    res.json({ ok: true, id, message: 'Subject created' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Subject code already exists' });
    next(err);
  }
}

async function listTutors(req, res, next) {
  try {
    const tutors = await tutorModel.findAll();
    res.json({ ok: true, tutors });
  } catch (err) {
    next(err);
  }
}

async function updateTutorProfile(req, res, next) {
  try {
    const adminUserId = parseInt(req.params.id, 10);
    const { specialization, phone, bio } = req.body;
    await tutorModel.upsertProfile(adminUserId, specialization || null, phone || null, bio || null);
    res.json({ ok: true, message: 'Tutor profile updated' });
  } catch (err) {
    next(err);
  }
}

// Helper function for logging admin activity
async function logAdminActivity(adminId, action, targetType, targetId, details) {
  try {
    await pool.execute(
      'INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId, action, targetType, targetId, details]
    );
  } catch (err) {
    console.error('Failed to log admin activity:', err);
  }
}

module.exports = {
  addStudent,
  assignStudentToAdmin,
  addExam: createExamByOrdinaryAdmin,
  addQuestion,
  listExams,
  listStudents,
  listAdmins,
  getResults,
  // Super Admin functions
  createAdmin,
  activateAdmin,
  promoteAdmin,
  suspendAdmin,
  getPendingExams,
  approveExam,
  rejectExam,
  broadcastExam,
  // Ordinary Admin functions
  getMyExams,
  // Academic Structure & Tutors
  listAcademicTerms,
  createAcademicTerm,
  setCurrentAcademicTerm,
  listClasses,
  createClass,
  listSubjects,
  createSubject,
  listTutors,
  updateTutorProfile
};