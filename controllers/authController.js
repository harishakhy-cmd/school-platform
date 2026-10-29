const studentModel = require('../models/studentModel');
const pool = require('../config/database');
const { replaceProfilePhoto } = require('../utils/profilePhotoStorage');
const {
  normalizeRegistrationNumber,
  isValidRegistrationNumber
} = require('../utils/registrationFormat');

async function login(req, res, next) {
  try {
    // Check platform maintenance mode
    try {
      const [mRows] = await pool.query(
        "SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN ('maintenance_mode', 'maintenance_message')"
      );
      const mMode = mRows.find(r => r.setting_key === 'maintenance_mode')?.setting_value;
      const mMsg = mRows.find(r => r.setting_key === 'maintenance_message')?.setting_value;
      if (mMode === 'true') {
        return res.status(503).json({
          error: mMsg || 'The system is undergoing scheduled maintenance. Please check back shortly.',
          code: 'MAINTENANCE_MODE'
        });
      }
    } catch (_) { /* non-fatal if table not yet migrated */ }

    const raw = req.body.registration_number;
    if (typeof raw !== 'string' || !raw.trim()) {
      return res.status(400).json({ error: 'Registration number is required' });
    }
    if (!isValidRegistrationNumber(raw)) {
      return res.status(400).json({
        error: 'Enter a valid student registration number, such as STO1-001A or 2026/ICT/001.'
      });
    }
    const registrationNumber = normalizeRegistrationNumber(raw);
    const student = await studentModel.findByRegistration(registrationNumber);
    if (!student) {
      return res.status(401).json({ error: 'Unknown registration number' });
    }
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => (err ? reject(err) : resolve()));
    });
    req.session.registrationNumber = student.registration_number;
    req.session.studentName = student.name;
    req.session.examAccess = {};
    return res.json({
      ok: true,
      registration_number: student.registration_number,
      name: student.name
    });
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ ok: true });
  });
}

async function me(req, res, next) {
  if (!req.session.registrationNumber) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  try {
    const student = await studentModel.findByRegistration(req.session.registrationNumber);
    if (!student) return res.status(404).json({ error: 'Student account not found' });
    return res.json({
      registration_number: student.registration_number,
      name: student.name || req.session.studentName || null,
      profile_photo_url: student.profile_photo_url || null
    });
  } catch (err) {
    next(err);
  }
}

async function uploadProfilePhoto(req, res, next) {
  if (!req.session.registrationNumber) {
    return res.status(401).json({ ok: false, error: 'Student login required' });
  }
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ ok: false, error: 'Choose a JPEG, PNG, or WebP profile photo.' });
  }
  try {
    const student = await studentModel.findByRegistration(req.session.registrationNumber);
    if (!student) return res.status(404).json({ ok: false, error: 'Student account not found' });
    const photoUrl = await replaceProfilePhoto(
      req.body,
      req.get('content-type'),
      student.profile_photo_url,
      (url) => studentModel.updateProfilePhoto(student.registration_number, url)
    );
    return res.json({ ok: true, profile_photo_url: photoUrl });
  } catch (err) {
    if (err instanceof TypeError) return res.status(400).json({ ok: false, error: err.message });
    next(err);
  }
}

module.exports = { login, logout, me, uploadProfilePhoto };
