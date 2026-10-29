'use strict';

const pool = require('../config/database');
const bcrypt = require('bcrypt');
const { logActivity } = require('../utils/activityLogger');
const { replaceProfilePhoto } = require('../utils/profilePhotoStorage');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validEmail(email) {
  return EMAIL_RE.test(email);
}

// ─── Profile (any logged-in admin) ───────────────────────────────────────────

/**
 * GET /api/admin/settings/profile
 * Returns the calling admin's profile.
 */
async function getMyProfile(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, username, full_name, email, avatar_url, role, status, admin_code, created_at
         FROM admin_users
        WHERE id = ? LIMIT 1`,
      [req.session.adminId]
    );
    if (!rows.length) {
      return res.status(404).json({ ok: false, error: 'Admin not found' });
    }
    return res.json({ ok: true, profile: rows[0] });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/profile
 * Body: { full_name, email, avatar_url }
 */
async function updateMyProfile(req, res, next) {
  try {
    const { full_name, email, avatar_url } = req.body;

    if (email !== undefined && email !== null && email !== '' && !validEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email format' });
    }

    await pool.execute(
      `UPDATE admin_users SET full_name = ?, email = ?, avatar_url = ? WHERE id = ?`,
      [full_name ?? null, email ?? null, avatar_url ?? null, req.session.adminId]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

async function uploadMyProfilePhoto(req, res, next) {
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ ok: false, error: 'Choose a JPEG, PNG, or WebP profile photo.' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT avatar_url FROM admin_users WHERE id = ? LIMIT 1',
      [req.session.adminId]
    );
    if (!rows.length) return res.status(404).json({ ok: false, error: 'Admin not found' });
    const photoUrl = await replaceProfilePhoto(
      req.body,
      req.get('content-type'),
      rows[0].avatar_url,
      async (url) => {
        await pool.execute('UPDATE admin_users SET avatar_url = ? WHERE id = ?', [url, req.session.adminId]);
      }
    );
    return res.json({ ok: true, avatar_url: photoUrl });
  } catch (err) {
    if (err instanceof TypeError) return res.status(400).json({ ok: false, error: err.message });
    next(err);
  }
}


// ─── System Stats (any admin) ─────────────────────────────────────────────────

/**
 * GET /api/admin/settings/stats
 */
async function getSystemStats(req, res, next) {
  try {
    const [
      [studentsRows],
      [activeAdminsRows],
      [examsRows],
      [activeClassroomsRows],
      [activeLiveSessionsRows],
      [totalAttemptsRows],
      [versionRows],
      [tableSizeRows],
    ] = await Promise.all([
      pool.execute('SELECT COUNT(*) AS c FROM students'),
      pool.execute("SELECT COUNT(*) AS c FROM admin_users WHERE status='active'"),
      pool.execute('SELECT COUNT(*) AS c FROM exams'),
      pool.execute('SELECT COUNT(*) AS c FROM classrooms WHERE is_archived=0'),
      pool.execute("SELECT COUNT(*) AS c FROM live_sessions WHERE status='active'"),
      pool.execute('SELECT COUNT(*) AS c FROM exam_attempts'),
      pool.execute('SELECT VERSION() AS v'),
      pool.execute(
        `SELECT TABLE_NAME, ROUND((DATA_LENGTH+INDEX_LENGTH)/1024/1024,2) AS size_mb
           FROM information_schema.TABLES
          WHERE TABLE_SCHEMA=DATABASE()
          ORDER BY size_mb DESC
          LIMIT 10`
      ),
    ]);

    const totalDbSizeMb = tableSizeRows.reduce((sum, t) => sum + Number(t.size_mb || 0), 0);

    return res.json({
      ok: true,
      stats: {
        students: studentsRows[0].c,
        activeAdmins: activeAdminsRows[0].c,
        exams: examsRows[0].c,
        activeClassrooms: activeClassroomsRows[0].c,
        activeLiveSessions: activeLiveSessionsRows[0].c,
        totalAttempts: totalAttemptsRows[0].c,
        mysqlVersion: versionRows[0].v,
        dbSizeMb: Math.round(totalDbSizeMb * 100) / 100,
        tableSizes: tableSizeRows,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Admin Management (super_admin only) ─────────────────────────────────────

/**
 * GET /api/admin/settings/admins
 */
async function listAllAdmins(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, username, full_name, email, role, status, admin_code, created_at
         FROM admin_users
        ORDER BY id`
    );
    return res.json({ ok: true, admins: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/admins/:id
 * Body: { full_name, email, role, status }
 */
async function updateAdminProfile(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) {
      return res.status(400).json({ ok: false, error: 'Invalid admin ID' });
    }

    const { full_name, email, role, status } = req.body;

    if (email !== undefined && email !== '' && !validEmail(email)) {
      return res.status(400).json({ ok: false, error: 'Invalid email format' });
    }

    const VALID_ROLES   = ['super_admin', 'ordinary_admin', 'tutor'];
    const VALID_STATUSES = ['active', 'suspended', 'pending'];

    if (role !== undefined && !VALID_ROLES.includes(role)) {
      return res.status(400).json({ ok: false, error: 'Invalid role value' });
    }
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ ok: false, error: 'Invalid status value' });
    }

    // Guard: ensure at least one super_admin stays active after this change
    if (status === 'suspended' || role === 'ordinary_admin' || role === 'tutor') {
      // Fetch current record
      const [cur] = await pool.execute(
        'SELECT role, status FROM admin_users WHERE id = ? LIMIT 1',
        [targetId]
      );
      if (!cur.length) {
        return res.status(404).json({ ok: false, error: 'Admin not found' });
      }
      const currentRecord = cur[0];

      // Would this change remove an active super_admin?
      const wouldRemoveSuperAdmin =
        currentRecord.role === 'super_admin' &&
        currentRecord.status === 'active' &&
        (status === 'suspended' || role === 'ordinary_admin' || role === 'tutor');

      if (wouldRemoveSuperAdmin) {
        const [[{ cnt }]] = await pool.execute(
          "SELECT COUNT(*) AS cnt FROM admin_users WHERE role='super_admin' AND status='active'"
        );
        if (Number(cnt) <= 1) {
          return res.status(409).json({
            ok: false,
            error: 'Cannot demote or suspend the last active super_admin',
          });
        }
      }
    }

    await pool.execute(
      `UPDATE admin_users
          SET full_name = COALESCE(?, full_name),
              email     = COALESCE(?, email),
              role      = COALESCE(?, role),
              status    = COALESCE(?, status)
        WHERE id = ?`,
      [full_name ?? null, email ?? null, role ?? null, status ?? null, targetId]
    );

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/admins/:id/reset-password
 * Body: { newPassword }
 */
async function resetAdminPassword(req, res, next) {
  try {
    const targetId = parseInt(req.params.id, 10);
    if (Number.isNaN(targetId)) {
      return res.status(400).json({ ok: false, error: 'Invalid admin ID' });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ ok: false, error: 'Password must be at least 8 characters' });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.execute(
      'UPDATE admin_users SET password_hash = ? WHERE id = ?',
      [hash, targetId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Admin not found' });
    }

    logActivity(req.session.adminId, 'RESET_ADMIN_PASSWORD', 'admin', targetId,
      `Super-admin reset password for admin ID ${targetId}`);
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ─── Academic Terms (super_admin only) ───────────────────────────────────────

/**
 * GET /api/admin/settings/terms
 */
async function listTerms(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM academic_terms ORDER BY created_at DESC'
    );
    return res.json({ ok: true, terms: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/terms
 * Body: { academic_year, term_name, start_date, end_date }
 */
async function createTerm(req, res, next) {
  try {
    const { academic_year, term_name, start_date, end_date } = req.body;
    if (!academic_year || !term_name || !start_date || !end_date) {
      return res.status(400).json({ ok: false, error: 'academic_year, term_name, start_date and end_date are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO academic_terms (academic_year, term_name, start_date, end_date) VALUES (?, ?, ?, ?)',
      [academic_year, term_name, start_date, end_date]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/terms/:id
 */
async function updateTerm(req, res, next) {
  try {
    const termId = parseInt(req.params.id, 10);
    if (Number.isNaN(termId)) {
      return res.status(400).json({ ok: false, error: 'Invalid term ID' });
    }

    const { academic_year, term_name, start_date, end_date } = req.body;
    if (!academic_year || !term_name || !start_date || !end_date) {
      return res.status(400).json({ ok: false, error: 'academic_year, term_name, start_date and end_date are required' });
    }

    const [result] = await pool.execute(
      'UPDATE academic_terms SET academic_year=?, term_name=?, start_date=?, end_date=? WHERE id=?',
      [academic_year, term_name, start_date, end_date, termId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Term not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/terms/:id/current
 */
async function setCurrentTerm(req, res, next) {
  try {
    const termId = parseInt(req.params.id, 10);
    if (Number.isNaN(termId)) {
      return res.status(400).json({ ok: false, error: 'Invalid term ID' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('UPDATE academic_terms SET is_current = 0');
      const [result] = await conn.execute(
        'UPDATE academic_terms SET is_current = 1 WHERE id = ?',
        [termId]
      );
      if (result.affectedRows === 0) {
        await conn.rollback();
        return res.status(404).json({ ok: false, error: 'Term not found' });
      }
      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/settings/terms/:id
 */
async function deleteTerm(req, res, next) {
  try {
    const termId = parseInt(req.params.id, 10);
    if (Number.isNaN(termId)) {
      return res.status(400).json({ ok: false, error: 'Invalid term ID' });
    }

    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM classrooms WHERE term_id = ?',
      [termId]
    );
    if (Number(cnt) > 0) {
      return res.status(409).json({
        ok: false,
        error: 'Cannot delete term: classrooms are referencing it',
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM academic_terms WHERE id = ?',
      [termId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Term not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ─── Classes (super_admin only) ───────────────────────────────────────────────

/**
 * GET /api/admin/settings/classes
 */
async function listClasses(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM classes ORDER BY id');
    return res.json({ ok: true, classes: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/classes
 * Body: { name, code }
 */
async function createClass(req, res, next) {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ ok: false, error: 'name and code are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO classes (name, code) VALUES (?, ?)',
      [name, code]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/classes/:id
 */
async function updateClass(req, res, next) {
  try {
    const classId = parseInt(req.params.id, 10);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ ok: false, error: 'Invalid class ID' });
    }

    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ ok: false, error: 'name and code are required' });
    }

    const [result] = await pool.execute(
      'UPDATE classes SET name=?, code=? WHERE id=?',
      [name, code, classId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Class not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/settings/classes/:id
 */
async function deleteClass(req, res, next) {
  try {
    const classId = parseInt(req.params.id, 10);
    if (Number.isNaN(classId)) {
      return res.status(400).json({ ok: false, error: 'Invalid class ID' });
    }

    const [[{ cnt }]] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM classrooms WHERE class_id = ?',
      [classId]
    );
    if (Number(cnt) > 0) {
      return res.status(409).json({
        ok: false,
        error: 'Cannot delete class: classrooms are referencing it',
      });
    }

    const [result] = await pool.execute('DELETE FROM classes WHERE id = ?', [classId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Class not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ─── Subjects (super_admin only) ──────────────────────────────────────────────

/**
 * GET /api/admin/settings/subjects
 */
async function listSubjects(req, res, next) {
  try {
    const [rows] = await pool.execute('SELECT * FROM subjects ORDER BY id');
    return res.json({ ok: true, subjects: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/subjects
 * Body: { name, code }
 */
async function createSubject(req, res, next) {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ ok: false, error: 'name and code are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO subjects (name, code) VALUES (?, ?)',
      [name, code]
    );

    return res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/subjects/:id
 */
async function updateSubject(req, res, next) {
  try {
    const subjectId = parseInt(req.params.id, 10);
    if (Number.isNaN(subjectId)) {
      return res.status(400).json({ ok: false, error: 'Invalid subject ID' });
    }

    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ ok: false, error: 'name and code are required' });
    }

    const [result] = await pool.execute(
      'UPDATE subjects SET name=?, code=? WHERE id=?',
      [name, code, subjectId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Subject not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/admin/settings/subjects/:id
 */
async function deleteSubject(req, res, next) {
  try {
    const subjectId = parseInt(req.params.id, 10);
    if (Number.isNaN(subjectId)) {
      return res.status(400).json({ ok: false, error: 'Invalid subject ID' });
    }

    const [[clsRows]] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM classrooms WHERE subject_id = ?',
      [subjectId]
    );
    const [[examRows]] = await pool.execute(
      'SELECT COUNT(*) AS cnt FROM exams WHERE subject_id = ?',
      [subjectId]
    );

    if (Number(clsRows.cnt) > 0 || Number(examRows.cnt) > 0) {
      return res.status(409).json({
        ok: false,
        error: 'Cannot delete subject: classrooms or exams are referencing it',
      });
    }

    const [result] = await pool.execute('DELETE FROM subjects WHERE id = ?', [subjectId]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ ok: false, error: 'Subject not found' });
    }

    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}

// ─── Activity Log (super_admin only) ─────────────────────────────────────────

/**
 * GET /api/admin/settings/activity
 * Columns: id, admin_id, action, target_type, target_id, details, created_at
 */
async function getActivityLog(req, res, next) {
  try {
    const [rows] = await pool.execute(
      `SELECT l.id,
              l.admin_id,
              a.username   AS admin_username,
              l.action,
              l.target_type,
              l.target_id,
              l.details,
              l.created_at
         FROM admin_activity_log l
         LEFT JOIN admin_users a ON a.id = l.admin_id
        ORDER BY l.created_at DESC
        LIMIT 100`
    );
    return res.json({ ok: true, logs: rows });
  } catch (err) {
    next(err);
  }
}

// ─── Global System Configuration (General, CBT Policies, Live) ──────────────

/**
 * GET /api/admin/settings/config
 * Retrieves all platform settings grouped by category.
 */
async function getSystemConfig(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value, category, description, updated_at FROM system_settings');
    const config = {};
    for (const r of rows) {
      config[r.setting_key] = r.setting_value;
    }
    return res.json({ ok: true, config, list: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/admin/settings/config
 * Body: { settings: { key: value, ... } }
 * Updates platform configuration parameters.
 */
async function updateSystemConfig(req, res, next) {
  try {
    const { settings } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ ok: false, error: 'settings object required' });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const [key, val] of Object.entries(settings)) {
        await conn.query(
          `UPDATE system_settings SET setting_value = ? WHERE setting_key = ?`,
          [String(val ?? ''), key]
        );
      }

      // Log in activity log
      await conn.query(
        `INSERT INTO admin_activity_log (admin_id, action, target_type, details)
         VALUES (?, 'update_settings', 'system', ?)`,
        [req.session.adminId, `Updated ${Object.keys(settings).length} platform settings`]
      ).catch(() => {});

      await conn.commit();
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }

    return res.json({ ok: true, message: 'Settings saved successfully' });
  } catch (err) {
    next(err);
  }
}

// ─── System Diagnostics & Integrity Tool ─────────────────────────────────────

/**
 * GET /api/admin/settings/diagnostics
 * Runs live health checks on database, orphaned records, unapproved content,
 * and email configuration status.
 */
async function runSystemDiagnostics(req, res, next) {
  try {
    const startTime = Date.now();
    await pool.query('SELECT 1');
    const pingMs = Date.now() - startTime;

    const [
      [[orphanAttempts]],
      [[orphanResponses]],
      [[unapprovedExams]],
      [[pendingAdmins]],
      [[activeSessions]],
      [[totalQuestions]],
      [[totalStudents]]
    ] = await Promise.all([
      pool.query(`
        SELECT COUNT(*) AS c FROM exam_attempts a
        LEFT JOIN students s ON s.registration_number = a.registration_number
        WHERE s.registration_number IS NULL
      `),
      pool.query(`
        SELECT COUNT(*) AS c FROM responses r
        LEFT JOIN students s ON s.registration_number = r.registration_number
        WHERE s.registration_number IS NULL
      `),
      pool.query(`SELECT COUNT(*) AS c FROM exams WHERE approval_status = 'pending'`),
      pool.query(`SELECT COUNT(*) AS c FROM admin_users WHERE status = 'pending'`),
      pool.query(`SELECT COUNT(*) AS c FROM live_sessions WHERE status = 'active'`),
      pool.query(`SELECT COUNT(*) AS c FROM questions`),
      pool.query(`SELECT COUNT(*) AS c FROM students`)
    ]);

    // ── Email transport status ────────────────────────────────────────────────
    let emailStatus = 'not_configured';
    let emailTransportType = null;
    try {
      const { verifyTransport } = require('../utils/emailService');
      const emailResult = await verifyTransport();
      emailStatus = emailResult.ok ? 'ok' : 'error';
      emailTransportType = emailResult.transportType || null;
    } catch (_) {
      emailStatus = 'error';
    }

    return res.json({
      ok: true,
      diagnostics: {
        dbLatencyMs: pingMs,
        dbStatus: pingMs < 50 ? 'Optimal' : (pingMs < 200 ? 'Normal' : 'High Latency'),
        orphanAttempts: orphanAttempts.c,
        orphanResponses: orphanResponses.c,
        unapprovedExams: unapprovedExams.c,
        pendingAdmins: pendingAdmins.c,
        activeSessions: activeSessions.c,
        totalQuestions: totalQuestions.c,
        totalStudents: totalStudents.c,
        emailStatus,           // 'ok' | 'error' | 'not_configured'
        emailTransportType,    // 'gmail' | 'smtp' | null
        checkedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    next(err);
  }
}

// ─── Data Management & Backup Tools ───────────────────────────────────────────

/**
 * GET /api/admin/settings/export
 * Generates an instantaneous JSON backup snapshot of core academic & CBT entities.
 */
async function exportPlatformData(req, res, next) {
  try {
    const [
      [students],
      [classrooms],
      [exams],
      [terms],
      [classes],
      [subjects]
    ] = await Promise.all([
      pool.query('SELECT registration_number, name, admin_id FROM students'),
      pool.query('SELECT id, name, class_code, tutor_id, is_archived, created_at FROM classrooms'),
      pool.query('SELECT exam_id, title, duration, approval_status, is_broadcasted, start_time, end_time FROM exams'),
      pool.query('SELECT id, academic_year, term_name, is_current FROM academic_terms'),
      pool.query('SELECT id, name, code, description FROM classes'),
      pool.query('SELECT id, name, code, description FROM subjects')
    ]);

    const backup = {
      exportedAt: new Date().toISOString(),
      platform: 'Apex CBT System',
      version: '3.0.0',
      entities: {
        studentsCount: students.length,
        classroomsCount: classrooms.length,
        examsCount: exams.length,
      },
      data: {
        students,
        classrooms,
        exams,
        academicTerms: terms,
        classes,
        subjects
      }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="cbt-backup-${new Date().toISOString().slice(0,10)}.json"`);
    return res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/purge-attempts
 * Super admin tool: wipes exam attempts & student responses (e.g. before real exam session).
 */
async function purgeMockAttempts(req, res, next) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [[attCount]] = await conn.query('SELECT COUNT(*) AS c FROM exam_attempts');
      await conn.query('DELETE FROM responses');
      await conn.query('DELETE FROM exam_attempts');

      await conn.query(
        `INSERT INTO admin_activity_log (admin_id, action, target_type, details)
         VALUES (?, 'purge_attempts', 'exams', ?)`,
        [req.session.adminId, `Purged ${attCount.c} exam attempts and associated response records`]
      ).catch(() => {});

      await conn.commit();
      return res.json({ ok: true, purgedCount: attCount.c, message: `Successfully cleared ${attCount.c} attempts` });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/clean-orphans
 * Super admin tool: cleans orphaned attempts and responses.
 */
async function cleanOrphanedRecords(req, res, next) {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [resDel] = await conn.query(`
        DELETE r FROM responses r
        LEFT JOIN students s ON s.registration_number = r.registration_number
        WHERE s.registration_number IS NULL
      `);
      const [attDel] = await conn.query(`
        DELETE a FROM exam_attempts a
        LEFT JOIN students s ON s.registration_number = a.registration_number
        WHERE s.registration_number IS NULL
      `);

      await conn.query(
        `INSERT INTO admin_activity_log (admin_id, action, target_type, details)
         VALUES (?, 'clean_orphans', 'database', ?)`,
        [req.session.adminId, `Cleaned ${attDel.affectedRows} orphan attempts and ${resDel.affectedRows} orphan responses`]
      ).catch(() => {});

      await conn.commit();
      return res.json({
        ok: true,
        cleanedAttempts: attDel.affectedRows,
        cleanedResponses: resDel.affectedRows,
        message: `Cleaned ${attDel.affectedRows} orphaned attempt(s) and ${resDel.affectedRows} orphaned response(s)`
      });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/settings/broadcast-notice
 * Body: { title, message, type }
 * Sends a platform-wide notification to all students.
 */
async function broadcastGlobalNotice(req, res, next) {
  try {
    const { title, message, type } = req.body;
    if (!title || !message) {
      return res.status(400).json({ ok: false, error: 'Title and message are required' });
    }

    const [students] = await pool.query('SELECT registration_number FROM students');
    if (!students.length) {
      return res.json({ ok: true, recipientCount: 0, message: 'No registered students to notify' });
    }

    const notifType = type || 'announcement';
    const values = students.map(s => [
      'student',
      s.registration_number,
      title.trim(),
      message.trim(),
      notifType,
      '/portal.html',
      0
    ]);

    await pool.query(
      `INSERT INTO notifications (recipient_type, recipient_id, title, message, type, link, is_read)
       VALUES ?`,
      [values]
    );

    // Record in activity log
    await pool.query(
      `INSERT INTO admin_activity_log (admin_id, action, target_type, details)
       VALUES (?, 'broadcast_notice', 'students', ?)`,
      [req.session.adminId, `Broadcast notice "${title}" to ${students.length} students`]
    ).catch(() => {});

    return res.json({ ok: true, recipientCount: students.length, message: `Notice dispatched to ${students.length} students` });
  } catch (err) {
    next(err);
  }
}

// ─── Email Config Test (super_admin only) ─────────────────────────────────────

/**
 * POST /api/admin/settings/test-email
 * Tests the email transport connection. Returns status without revealing credentials.
 */
async function testEmailConfig(req, res, next) {
  try {
    const { verifyTransport } = require('../utils/emailService');
    const result = await verifyTransport();

    const gmailConfigured = !!(process.env.EMAIL_GMAIL_USER && process.env.EMAIL_GMAIL_APP_PASS);
    const smtpConfigured  = !!(process.env.EMAIL_SMTP_HOST && process.env.EMAIL_SMTP_USER && process.env.EMAIL_SMTP_PASS);
    const anyConfigured   = gmailConfigured || smtpConfigured;

    return res.json({
      ok: true,
      emailConfigured: anyConfigured,
      transport: gmailConfigured ? 'gmail' : smtpConfigured ? 'smtp' : 'none',
      connectionOk: result.ok,
      error: result.ok ? null : result.reason,
    });
  } catch (err) {
    next(err);
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadMyProfilePhoto,
  getSystemStats,
  listAllAdmins,
  updateAdminProfile,
  resetAdminPassword,
  listTerms,
  createTerm,
  updateTerm,
  setCurrentTerm,
  deleteTerm,
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  listSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  getActivityLog,
  getSystemConfig,
  updateSystemConfig,
  runSystemDiagnostics,
  exportPlatformData,
  purgeMockAttempts,
  cleanOrphanedRecords,
  broadcastGlobalNotice,
  testEmailConfig,
};
