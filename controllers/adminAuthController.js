const bcrypt = require('bcrypt');
const adminUserModel = require('../models/adminUserModel');
const { logActivity } = require('../utils/activityLogger');

async function login(req, res, next) {
  try {
    const rawUser = req.body.username;
    const rawPass = req.body.password;
    const username = typeof rawUser === 'string' ? rawUser.trim() : '';
    const password = typeof rawPass === 'string' ? rawPass : '';
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await adminUserModel.findByUsername(username);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      // Log failed attempts (adminId unknown, store username in details)
      logActivity(null, 'LOGIN_FAILED', 'admin', null, `Failed login attempt for username: ${username}`);
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Check if admin is active
    if (user.status === 'suspended') {
      logActivity(user.id, 'LOGIN_BLOCKED', 'admin', user.id, 'Login blocked — account suspended');
      return res.status(403).json({ error: 'Account is suspended. Contact your administrator.' });
    }
    if (user.status === 'pending') {
      logActivity(user.id, 'LOGIN_BLOCKED', 'admin', user.id, 'Login blocked — account pending activation');
      return res.status(403).json({ error: 'Account is pending activation. Contact your administrator.' });
    }
    
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });
    req.session.adminId = user.id;
    req.session.adminUsername = user.username;
    req.session.adminRole = user.role;
    req.session.adminCode = user.admin_code;

    logActivity(user.id, 'LOGIN', 'admin', user.id, `Login successful (role: ${user.role})`);
    
    return res.json({ 
      ok: true, 
      username: user.username,
      role: user.role,
      admin_code: user.admin_code 
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res, next) {
  const adminId = req.session.adminId;
  const username = req.session.adminUsername;
  if (adminId) {
    logActivity(adminId, 'LOGOUT', 'admin', adminId, `Logout: ${username || 'unknown'}`);
  }
  req.session.destroy((err) => {
    if (err) return next ? next(err) : res.status(500).json({ error: 'Could not end session' });
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
}

function me(req, res) {
  if (!req.session.adminId) {
    return res.status(401).json({ error: 'Not logged in as admin' });
  }
  return res.json({
    ok: true,
    username: req.session.adminUsername || null,
    role: req.session.adminRole || null,
    admin_code: req.session.adminCode || null
  });
}

async function changePassword(req, res, next) {
  try {
    if (!req.session.adminId) {
      return res.status(401).json({ error: 'Not logged in as admin' });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All three password fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New password and confirmation do not match' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }
    if (newPassword === currentPassword) {
      return res.status(400).json({ error: 'New password must be different from the current password' });
    }

    // ── Verify current password against DB ──────────────────────────────────
    // We need the password_hash — use findByUsername since session stores username
    const user = await adminUserModel.findByUsername(req.session.adminUsername);
    if (!user) {
      return res.status(404).json({ error: 'Admin account not found' });
    }

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      logActivity(req.session.adminId, 'CHANGE_PASSWORD_FAILED', 'admin', req.session.adminId, 'Wrong current password provided');
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // ── Hash and save new password ──────────────────────────────────────────
    const newHash = await bcrypt.hash(newPassword, 12);
    await adminUserModel.updatePassword(req.session.adminId, newHash);

    logActivity(req.session.adminId, 'CHANGE_PASSWORD', 'admin', req.session.adminId, 'Password changed via settings panel');
    return res.json({ ok: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, logout, me, changePassword };