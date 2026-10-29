const express = require('express');
const adminController = require('../controllers/adminController');
const adminAuthController = require('../controllers/adminAuthController');
const { requireAdmin, requireSuperAdmin } = require('../middleware/adminAuthMiddleware');
const passwordResetController = require('../controllers/passwordResetController');
const { profilePhotoUpload } = require('../middleware/profilePhotoUpload');

const router = express.Router();

// ── Login rate limiter (in-memory, no extra npm package) ──────────────────────
// Allows LOGIN_RATE_LIMIT (default 10) attempts per IP per 15 minutes.
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT || '10', 10);

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };

  // Reset window if expired
  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + LOGIN_WINDOW_MS;
  }

  entry.count++;
  loginAttempts.set(ip, entry);

  if (entry.count > LOGIN_LIMIT) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
    res.set('Retry-After', String(retryAfterSec));
    return res.status(429).json({
      ok: false,
      error: `Too many login attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`
    });
  }

  next();
}

// Auth routes
router.post('/auth/login', loginRateLimiter, adminAuthController.login);
router.post('/auth/logout', adminAuthController.logout);
router.get('/auth/me', adminAuthController.me);
router.put('/auth/change-password', adminAuthController.changePassword);

// Password recovery routes (public — admin is not logged in when using these)
router.post('/auth/forgot-password', passwordResetController.forgotPassword);
router.get('/auth/validate-reset-token', passwordResetController.validateResetToken);
router.post('/auth/reset-password', passwordResetController.resetPassword);

// Student management
router.post('/students', requireAdmin, adminController.addStudent);
router.get('/students', requireAdmin, adminController.listStudents);
router.put('/students/assign', requireAdmin, adminController.assignStudentToAdmin);

// Admin management (Super Admin only)
router.get('/admins', requireSuperAdmin, adminController.listAdmins);
router.post('/admins', requireSuperAdmin, adminController.createAdmin);
router.put('/admins/:id/activate', requireSuperAdmin, adminController.activateAdmin);
router.put('/admins/:id/promote', requireSuperAdmin, adminController.promoteAdmin);
router.put('/admins/:id/suspend', requireSuperAdmin, adminController.suspendAdmin);

// Exam approval workflow (Super Admin only)
router.get('/exams/pending', requireSuperAdmin, adminController.getPendingExams);
router.put('/exams/:id/approve', requireSuperAdmin, adminController.approveExam);
router.put('/exams/:id/reject', requireSuperAdmin, adminController.rejectExam);
router.put('/exams/:id/broadcast', requireSuperAdmin, adminController.broadcastExam);

// Exam management
router.post('/exams', requireAdmin, adminController.addExam);
router.get('/exams', requireAdmin, adminController.listExams);
router.get('/exams/my', requireAdmin, adminController.getMyExams);

// Results (filtered by admin role)
router.get('/results', requireAdmin, adminController.getResults);

// Question management
router.post('/questions', requireAdmin, adminController.addQuestion);

// Academic Structure (Terms, Classes, Subjects, Tutors)
router.get('/terms', requireAdmin, adminController.listAcademicTerms);
router.post('/terms', requireSuperAdmin, adminController.createAcademicTerm);
router.put('/terms/:id/current', requireSuperAdmin, adminController.setCurrentAcademicTerm);

router.get('/classes', requireAdmin, adminController.listClasses);
router.post('/classes', requireSuperAdmin, adminController.createClass);

router.get('/subjects', requireAdmin, adminController.listSubjects);
router.post('/subjects', requireSuperAdmin, adminController.createSubject);

router.get('/tutors', requireAdmin, adminController.listTutors);
router.put('/tutors/:id/profile', requireAdmin, adminController.updateTutorProfile);

const settingsController = require('../controllers/settingsController');

// ── Settings: My Profile ──────────────────────────────────────────────────────
router.get('/settings/profile', requireAdmin, settingsController.getMyProfile);
router.put('/settings/profile', requireAdmin, settingsController.updateMyProfile);
router.put('/settings/profile/photo', requireAdmin, profilePhotoUpload, settingsController.uploadMyProfilePhoto);

// ── Settings: System Stats ────────────────────────────────────────────────────
router.get('/settings/stats', requireAdmin, settingsController.getSystemStats);

// ── Settings: Admin Management (super_admin only) ─────────────────────────────
router.get('/settings/admins', requireSuperAdmin, settingsController.listAllAdmins);
router.put('/settings/admins/:id', requireSuperAdmin, settingsController.updateAdminProfile);
router.post('/settings/admins/:id/reset-password', requireSuperAdmin, settingsController.resetAdminPassword);

// ── Settings: Academic Terms ──────────────────────────────────────────────────
router.get('/settings/terms', requireAdmin, settingsController.listTerms);
router.post('/settings/terms', requireSuperAdmin, settingsController.createTerm);
router.put('/settings/terms/:id', requireSuperAdmin, settingsController.updateTerm);
router.put('/settings/terms/:id/current', requireSuperAdmin, settingsController.setCurrentTerm);
router.delete('/settings/terms/:id', requireSuperAdmin, settingsController.deleteTerm);

// ── Settings: Classes ─────────────────────────────────────────────────────────
router.get('/settings/classes', requireAdmin, settingsController.listClasses);
router.post('/settings/classes', requireSuperAdmin, settingsController.createClass);
router.put('/settings/classes/:id', requireSuperAdmin, settingsController.updateClass);
router.delete('/settings/classes/:id', requireSuperAdmin, settingsController.deleteClass);

// ── Settings: Subjects ────────────────────────────────────────────────────────
router.get('/settings/subjects', requireAdmin, settingsController.listSubjects);
router.post('/settings/subjects', requireSuperAdmin, settingsController.createSubject);
router.put('/settings/subjects/:id', requireSuperAdmin, settingsController.updateSubject);
router.delete('/settings/subjects/:id', requireSuperAdmin, settingsController.deleteSubject);

// ── Settings: Activity Log ────────────────────────────────────────────────────
router.get('/settings/activity', requireSuperAdmin, settingsController.getActivityLog);

// ── Settings: Global Configuration (General, CBT Policies, Live) ──────────────
router.get('/settings/config', requireAdmin, settingsController.getSystemConfig);
router.put('/settings/config', requireSuperAdmin, settingsController.updateSystemConfig);

// ── Settings: System Diagnostics & Health ─────────────────────────────────────
router.get('/settings/diagnostics', requireSuperAdmin, settingsController.runSystemDiagnostics);

// ── Settings: Data Management, Backup & Maintenance Tools ─────────────────────
router.get('/settings/export', requireSuperAdmin, settingsController.exportPlatformData);
router.post('/settings/purge-attempts', requireSuperAdmin, settingsController.purgeMockAttempts);
router.post('/settings/clean-orphans', requireSuperAdmin, settingsController.cleanOrphanedRecords);
router.post('/settings/broadcast-notice', requireSuperAdmin, settingsController.broadcastGlobalNotice);

// ── Settings: Email Configuration Test ───────────────────────────────────────
router.post('/settings/test-email', requireSuperAdmin, settingsController.testEmailConfig);

module.exports = router;