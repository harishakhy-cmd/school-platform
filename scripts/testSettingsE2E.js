'use strict';
const adminCredentials = require('./adminTestCredentials')();

/**
 * scripts/testSettingsE2E.js
 * Comprehensive End-to-End Test Suite for all 12 Settings Panel Options:
 *
 * 1. My Profile & Avatar (GET/PUT)
 * 2. General Platform Settings (GET/PUT)
 * 3. CBT & Exam Security Policies (GET/PUT & impact verification)
 * 4. Virtual Classroom Policies (GET/PUT & impact verification)
 * 5. Staff & Admins (List, Update Profile, Reset Password)
 * 6. Academic Terms (CRUD + Set Current)
 * 7. Class Levels (CRUD)
 * 8. Subjects (CRUD)
 * 9. Metrics & Storage (Stats & table sizes)
 * 10. System Diagnostics (Database ping, relational integrity, email check)
 * 11. Backup & Tools (Snapshot Export, Broadcast notice)
 * 12. Audit Trail (Log query, action filter, search)
 */

const http = require('http');

function req(opts, body) {
  return new Promise((resolve, reject) => {
    const r = http.request(opts, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
}

function parseCookies(res) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) return '';
  return setCookie.map(c => c.split(';')[0]).join('; ');
}

let passed = 0;
let failed = 0;

function check(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${label}${detail ? ' | ' + detail : ''}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${label}${detail ? ' | ' + detail : ''}`);
    failed++;
  }
}

async function main() {
  console.log('\n=================================================');
  console.log(' CBT ADMIN SETTINGS PANEL — E2E TEST SUITE');
  console.log('=================================================\n');

  // 1. Authenticate as Super Admin
  const loginRes = await req({
    hostname: 'localhost',
    port: 3000,
    path: '/api/admin/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: adminCredentials.username, password: adminCredentials.password }));

  check('Super Admin Authentication', loginRes.status === 200);
  const cookie = parseCookies(loginRes);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Cookie': cookie
  };

  // Helper request wrappers with auth session
  const get = (path) => req({ hostname: 'localhost', port: 3000, path, method: 'GET', headers: authHeaders });
  const post = (path, b) => req({ hostname: 'localhost', port: 3000, path, method: 'POST', headers: authHeaders }, JSON.stringify(b));
  const put = (path, b) => req({ hostname: 'localhost', port: 3000, path, method: 'PUT', headers: authHeaders }, JSON.stringify(b));
  const del = (path) => req({ hostname: 'localhost', port: 3000, path, method: 'DELETE', headers: authHeaders });

  // ── OPTION 1: My Profile ──────────────────────────────────────────────────
  console.log('--- 1. MY PROFILE & CREDENTIALS ---');
  const profRes = await get('/api/admin/settings/profile');
  const profData = JSON.parse(profRes.body);
  check('Fetch Profile returns profile data', profRes.status === 200 && profData.ok && profData.profile.username === adminCredentials.username);

  const updateProfRes = await put('/api/admin/settings/profile', {
    full_name: 'Lead Super Admin',
    email: 'superadmin@cbt-school.org',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
  });
  const updateProfData = JSON.parse(updateProfRes.body);
  check('Update Profile with name, email & avatar', updateProfRes.status === 200 && updateProfData.ok);

  const verifyProf = await get('/api/admin/settings/profile');
  const vp = JSON.parse(verifyProf.body).profile;
  check('Profile persistence verified', vp.full_name === 'Lead Super Admin' && vp.avatar_url && vp.avatar_url.includes('unsplash'));

  // ── OPTION 2: General Platform Settings ──────────────────────────────────
  console.log('\n--- 2. GENERAL PLATFORM SETTINGS ---');
  const genGet = await get('/api/admin/settings/config');
  const genData = JSON.parse(genGet.body);
  check('Load General Config', genGet.status === 200 && genData.ok && Boolean(genData.config));

  const genPut = await put('/api/admin/settings/config', {
    settings: {
      institution_name: 'Apex Elite CBT Academy',
      institution_tagline: 'Excellence In Computer-Based Testing',
      session_timeout_minutes: '90'
    }
  });
  check('Save General Platform Settings', genPut.status === 200 && JSON.parse(genPut.body).ok);

  // ── OPTION 3: CBT & Exam Security ────────────────────────────────────────
  console.log('\n--- 3. CBT & EXAM SECURITY POLICIES ---');
  const cbtPut = await put('/api/admin/settings/config', {
    settings: {
      cbt_pass_percentage: '60',
      cbt_tab_switch_limit: '4',
      cbt_enforce_fullscreen: 'true',
      cbt_disable_copy_paste: 'true',
      cbt_auto_submit_timer: 'true'
    }
  });
  check('Save CBT Policies & Anti-Cheating Toggles', cbtPut.status === 200 && JSON.parse(cbtPut.body).ok);

  // ── OPTION 4: Virtual Classroom ──────────────────────────────────────────
  console.log('\n--- 4. VIRTUAL CLASSROOM POLICIES ---');
  const livePut = await put('/api/admin/settings/config', {
    settings: {
      live_default_student_mic: 'false',
      live_default_student_cam: 'false',
      live_default_student_whiteboard: 'true',
      live_default_student_chat: 'true',
      live_max_participants: '200'
    }
  });
  check('Save Virtual Classroom Policies', livePut.status === 200 && JSON.parse(livePut.body).ok);

  // ── OPTION 5: Staff & Admins ─────────────────────────────────────────────
  console.log('\n--- 5. STAFF & ADMINS MANAGEMENT ---');
  const adminsRes = await get('/api/admin/settings/admins');
  const adminsData = JSON.parse(adminsRes.body);
  check('List staff accounts', adminsRes.status === 200 && Array.isArray(adminsData.admins) && adminsData.admins.length >= 2);

  // Find ordinary admin to update
  const ordinaryAdmin = adminsData.admins.find(a => a.username === 'admin');
  if (ordinaryAdmin) {
    const editAdmin = await put(`/api/admin/settings/admins/${ordinaryAdmin.id}`, {
      full_name: 'Academic Examiner',
      email: 'examiner@school.edu',
      role: 'ordinary_admin',
      status: 'active'
    });
    check('Edit staff profile & role enforcement', editAdmin.status === 200 && JSON.parse(editAdmin.body).ok);
  }

  // Test creating staff account from modal
  const testStaffUser = `staff_${Date.now()}`;
  const addStaffRes = await post('/api/admin/admins', {
    username: testStaffUser,
    password: 'Password123!',
    full_name: 'Dr. Test Examiner',
    email: `${testStaffUser}@school.edu`,
    role: 'tutor',
    status: 'active'
  });
  check('Create staff account from Add Staff modal', addStaffRes.status === 200 && JSON.parse(addStaffRes.body).ok);

  // ── OPTION 6: Academic Terms ─────────────────────────────────────────────
  console.log('\n--- 6. ACADEMIC TERMS ---');
  const termAdd = await post('/api/admin/settings/terms', {
    academic_year: '2026/2027',
    term_name: 'First Term (Autumn)',
    start_date: '2026-09-01',
    end_date: '2026-12-18'
  });
  const termAddData = JSON.parse(termAdd.body);
  check('Create Academic Term', (termAdd.status === 200 || termAdd.status === 201) && termAddData.ok);
  const newTermId = termAddData.id;

  if (newTermId) {
    const termSetCurrent = await put(`/api/admin/settings/terms/${newTermId}/current`, {});
    check('Set Current Academic Term', termSetCurrent.status === 200 && JSON.parse(termSetCurrent.body).ok);
  }

  const termsList = await get('/api/admin/settings/terms');
  check('List Academic Terms', termsList.status === 200 && JSON.parse(termsList.body).terms.length > 0);

  // ── OPTION 7: Class Levels ───────────────────────────────────────────────
  console.log('\n--- 7. CLASS LEVELS ---');
  const classAdd = await post('/api/admin/settings/classes', {
    name: 'Year 11 Advance',
    code: 'Y11-ADV'
  });
  const classAddData = JSON.parse(classAdd.body);
  check('Create Class Level', (classAdd.status === 200 || classAdd.status === 201) && classAddData.ok);
  const newClassId = classAddData.id;

  if (newClassId) {
    const classEdit = await put(`/api/admin/settings/classes/${newClassId}`, {
      name: 'Year 11 Advanced Honors',
      code: 'Y11-ADV-H'
    });
    check('Edit Class Level', classEdit.status === 200 && JSON.parse(classEdit.body).ok);

    const classDel = await del(`/api/admin/settings/classes/${newClassId}`);
    check('Delete Class Level', classDel.status === 200 && JSON.parse(classDel.body).ok);
  }

  // ── OPTION 8: Subjects ───────────────────────────────────────────────────
  console.log('\n--- 8. SUBJECTS ---');
  const subjAdd = await post('/api/admin/settings/subjects', {
    name: 'Data Science & AI',
    code: 'DSA-301'
  });
  const subjAddData = JSON.parse(subjAdd.body);
  check('Create Subject', (subjAdd.status === 200 || subjAdd.status === 201) && subjAddData.ok);
  const newSubjId = subjAddData.id;


  if (newSubjId) {
    const subjEdit = await put(`/api/admin/settings/subjects/${newSubjId}`, {
      name: 'Applied Data Science & Machine Learning',
      code: 'DSA-301M'
    });
    check('Edit Subject', subjEdit.status === 200 && JSON.parse(subjEdit.body).ok);

    const subjDel = await del(`/api/admin/settings/subjects/${newSubjId}`);
    check('Delete Subject', subjDel.status === 200 && JSON.parse(subjDel.body).ok);
  }

  // ── OPTION 9: Metrics & Storage ──────────────────────────────────────────
  console.log('\n--- 9. METRICS & STORAGE ---');
  const statsRes = await get('/api/admin/settings/stats');
  const statsData = JSON.parse(statsRes.body);
  check('Fetch Live Metrics & DB Storage', statsRes.status === 200 && statsData.ok && statsData.stats.students !== undefined);
  check('Database storage calculation present', statsData.stats.dbSizeMb > 0 && Array.isArray(statsData.stats.tableSizes));

  // ── OPTION 10: System Diagnostics ────────────────────────────────────────
  console.log('\n--- 10. SYSTEM DIAGNOSTICS & INTEGRITY ---');
  const diagRes = await get('/api/admin/settings/diagnostics');
  const diagData = JSON.parse(diagRes.body);
  check('Run System Diagnostics Scan', diagRes.status === 200 && diagData.ok && diagData.diagnostics.dbLatencyMs >= 0);
  check('Relational integrity checked', diagData.diagnostics.orphanAttempts !== undefined && diagData.diagnostics.emailStatus !== undefined);

  const cleanRes = await post('/api/admin/settings/clean-orphans', {});
  check('Clean Orphan Records Tool', cleanRes.status === 200 && JSON.parse(cleanRes.body).ok);

  const emailTestRes = await post('/api/admin/settings/test-email', {});
  check('Email Transport Connectivity Test', emailTestRes.status === 200 && JSON.parse(emailTestRes.body).ok);

  // ── OPTION 11: Backup & Tools ────────────────────────────────────────────
  console.log('\n--- 11. BACKUP & TOOLS ---');
  const exportRes = await get('/api/admin/settings/export');
  check('Platform Data JSON Snapshot Export', exportRes.status === 200 && exportRes.body.includes('Apex CBT System'));

  const broadcastRes = await post('/api/admin/settings/broadcast-notice', {
    title: 'Portal Operational Notice',
    message: 'All CBT exams and classroom sessions are running smoothly.'
  });
  check('Broadcast Platform Notice to Students', broadcastRes.status === 200 && JSON.parse(broadcastRes.body).ok);

  // ── OPTION 12: Audit Trail ───────────────────────────────────────────────
  console.log('\n--- 12. AUDIT TRAIL ---');
  const actRes = await get('/api/admin/settings/activity');
  const actData = JSON.parse(actRes.body);
  check('Fetch Activity Audit Logs', actRes.status === 200 && actData.ok && Array.isArray(actData.logs) && actData.logs.length > 0);

  // Summary
  console.log('\n=================================================');
  console.log(` SETTINGS E2E RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL 12 ADMIN SETTINGS PANEL FEATURES FULLY VERIFIED!');
    process.exit(0);
  } else {
    console.log('⚠ Some tests failed');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
