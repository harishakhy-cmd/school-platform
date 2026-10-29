'use strict';
/**
 * utils/activityLogger.js
 * Lightweight helper to append records to admin_activity_log.
 *
 * Usage:
 *   const { logActivity } = require('../utils/activityLogger');
 *   await logActivity(adminId, 'LOGIN', null, null, 'Login from 192.168.1.1');
 *
 * Errors are swallowed and logged to stderr so a failed write never crashes
 * the request that triggered it.
 */

const pool = require('../config/database');

/**
 * @param {number|null} adminId     - ID of the admin who performed the action
 * @param {string}      action      - Short action name (e.g. 'LOGIN', 'CREATE_EXAM')
 * @param {string|null} targetType  - Type of affected entity (e.g. 'student', 'exam')
 * @param {number|null} targetId    - ID of affected entity
 * @param {string|null} details     - Free-text details (keep concise)
 */
async function logActivity(adminId, action, targetType = null, targetId = null, details = null) {
  try {
    await pool.query(
      'INSERT INTO admin_activity_log (admin_id, action, target_type, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [adminId || null, action, targetType || null, targetId || null, details || null]
    );
  } catch (err) {
    // Never let a logging failure propagate
    console.error('[ActivityLogger] Failed to write activity log:', err.message);
  }
}

/**
 * Express middleware factory. Logs an activity AFTER the response is sent.
 * Only fires if `res.locals.activityLog` is populated by the route handler.
 *
 * Route handlers can set:
 *   res.locals.activityLog = { action, targetType, targetId, details }
 *
 * The admin ID is read from req.session.adminId.
 */
function activityLogMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (body) {
    const log = res.locals.activityLog;
    if (log && log.action) {
      const adminId = req.session && req.session.adminId;
      // Fire and forget — don't await
      logActivity(adminId, log.action, log.targetType, log.targetId, log.details).catch(() => {});
    }
    return originalJson(body);
  };

  next();
}

module.exports = { logActivity, activityLogMiddleware };
