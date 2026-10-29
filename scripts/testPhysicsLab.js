'use strict';
const adminCredentials = require('./adminTestCredentials')();

/**
 * Interactive Physics & Physical Sciences Laboratory
 * Comprehensive Integration & Verification Test Suite
 */

const http = require('http');
const assert = require('assert');
const pool = require('../config/database');
const questionModel = require('../models/questionModel');

const BASE_URL = 'http://127.0.0.1:3000';
let adminCookie = '';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(options.url || options.path, BASE_URL);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: Object.assign({}, options.headers || {})
    };

    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(reqOpts, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(chunks);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: chunks,
          json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      req.write(data);
    }
    req.end();
  });
}

function pass(msg) {
  console.log(`  ✓ PASS: ${msg}`);
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING PHYSICS & PHYSICAL SCIENCES LAB TEST SUITE');
  console.log('==================================================\n');

  // STEP 1: Authentication & Access Control
  console.log('--- 1. Authentication & Access Control ---');
  const loginRes = await request(
    { path: '/api/admin/auth/login', method: 'POST' },
    { username: adminCredentials.username, password: adminCredentials.password }
  );
  assert(loginRes.statusCode === 200, 'Super admin login failed');
  const setCookie = loginRes.headers['set-cookie'];
  assert(setCookie && setCookie.length > 0, 'No session cookie received');
  adminCookie = setCookie[0].split(';')[0];
  pass('Super Admin session established');

  // Block unauthenticated access to /physics-lab.html
  const unauthRes = await request({ path: '/physics-lab.html', method: 'GET' });
  assert(
    unauthRes.statusCode === 302 || unauthRes.body.includes('login'),
    'Unauthenticated user should be redirected from /physics-lab.html'
  );
  pass('Unauthenticated access blocked from /physics-lab.html');

  // Authenticated access allowed
  const authRes = await request({
    path: '/physics-lab.html',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(authRes.statusCode === 200, 'Authenticated user should access /physics-lab.html');
  assert(authRes.body.includes('Interactive Physics Laboratory'), 'Physics lab HTML returned valid title');
  pass('Authenticated session can load /physics-lab.html');

  // STEP 2: Curriculum Topics Registry API (27 Topics)
  console.log('\n--- 2. Curriculum Topics Registry API (27 Topics) ---');
  const topicsRes = await request({
    path: '/api/physics/topics',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(topicsRes.statusCode === 200, 'Topics API failed');
  assert(topicsRes.json && topicsRes.json.success, 'Topics API should report success');
  assert(topicsRes.json.count === 27, `Expected 27 curriculum topics, got ${topicsRes.json.count}`);
  pass('All 27 comprehensive curriculum topics loaded');

  const topicCodes = topicsRes.json.topics.map((t) => t.code);
  const requiredCodes = [
    'measurements-units', 'vectors', 'motion', 'forces', 'work-energy-power',
    'simple-machines', 'pressure-fluids', 'thermal-physics', 'gas-laws',
    'waves', 'sound', 'light-optics', 'electricity', 'magnetism',
    'electromagnetic-induction', 'electrostatics', 'circular-motion', 'gravitation',
    'oscillations', 'atomic-physics', 'nuclear-physics', 'modern-physics',
    'electronics', 'virtual-experiments', 'apparatus-library', 'graphing-data-analysis',
    'practical-assessments'
  ];
  for (const rc of requiredCodes) {
    assert(topicCodes.includes(rc), `Missing required topic code: ${rc}`);
  }
  pass('All 27 core curriculum branches verified (Mechanics, Thermal, Waves, Optics, Electricity, Modern Physics)');

  // Topic detail check: Motion
  const motionRes = await request({
    path: '/api/physics/topics/motion',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(motionRes.json && motionRes.json.success, 'Motion topic lookup failed');
  assert(motionRes.json.topic.equations.some((e) => e.name.includes('First Equation')), 'Motion has first equation of motion');
  assert(motionRes.json.topic.apparatus.includes('ticker_timer'), 'Motion lists ticker_timer apparatus');
  pass('Topic detail lookup retrieves equations and apparatus stencils (Motion & Kinematics)');

  // Topic detail check: Electricity
  const elecRes = await request({
    path: '/api/physics/topics/electricity',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(elecRes.json && elecRes.json.success, 'Electricity topic lookup failed');
  assert(elecRes.json.topic.equations.some((e) => e.name.includes('Ohm')), 'Electricity contains Ohm’s Law');
  pass('Topic detail lookup retrieves equations and circuit stencils (Electricity & Circuits)');

  // Topic detail check: Light & Optics
  const opticsRes = await request({
    path: '/api/physics/topics/light-optics',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(opticsRes.json && opticsRes.json.success, 'Optics topic lookup failed');
  assert(opticsRes.json.topic.equations.some((e) => e.name.includes('Snell')), 'Optics contains Snell’s Law');
  pass('Topic detail lookup retrieves ray-optics laws (Light & Ray Optics)');

  // STEP 3: Saved Experiments Persistence CRUD
  console.log('\n--- 3. Saved Experiments Persistence CRUD ---');
  const createExpRes = await request(
    { path: '/api/physics/experiments', method: 'POST', headers: { Cookie: adminCookie } },
    {
      title: 'Verification of Hooke’s Law for Spiral Spring',
      topic_code: 'oscillations',
      apparatus: [
        { id: 'spring_1', type: 'helical_spring', k: 25.0, x: 100, y: 150 },
        { id: 'mass_hanger', type: 'slotted_masses', massKg: 0.2, x: 100, y: 220 }
      ],
      connections: [{ from: 'spring_1', to: 'mass_hanger', type: 'mechanical' }],
      variables: { springConstant_k: 25.0, initialLength_m: 0.15 },
      data_readings: [
        { load_N: 0.98, extension_m: 0.039 },
        { load_N: 1.96, extension_m: 0.078 },
        { load_N: 2.94, extension_m: 0.117 }
      ]
    }
  );
  assert(createExpRes.statusCode === 200, 'Create experiment failed');
  assert(createExpRes.json && createExpRes.json.success, 'Create experiment should succeed');
  const expId = createExpRes.json.experiment_id;
  pass(`Created saved physics experiment with ID: ${expId}`);

  // Retrieve single experiment
  const getExpRes = await request({
    path: `/api/physics/experiments/${expId}`,
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(getExpRes.statusCode === 200, 'Get experiment by ID failed');
  assert(getExpRes.json.experiment.title === 'Verification of Hooke’s Law for Spiral Spring', 'Experiment title matches');
  assert(getExpRes.json.experiment.data_readings.length === 3, 'Data readings array persisted');
  pass('Retrieved saved physics experiment matching title and logged data');

  // Delete experiment cleanly
  const delExpRes = await request({
    path: `/api/physics/experiments/${expId}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie }
  });
  assert(delExpRes.statusCode === 200, 'Delete experiment failed');
  pass('Deleted saved physics experiment cleanly');

  // STEP 4: Precision Measurement Auto-Grading Engine
  console.log('\n--- 4. Precision Measurement Auto-Grading Engine ---');
  // Vernier Caliper: Observed = 23.4 mm, Zero Error = +0.2 mm -> True = 23.2 mm
  const vernierGrade = await request(
    { path: '/api/physics/grade-measurement', method: 'POST', headers: { Cookie: adminCookie } },
    {
      student_reading: 23.2,
      correct_reading: 23.4,
      zero_error: 0.2,
      tolerance: 0.05,
      unit: 'mm'
    }
  );
  assert(vernierGrade.json && vernierGrade.json.isCorrect === true, 'Accurate vernier reading should be accepted');
  pass('Vernier Calipers: Observed 23.4mm minus +0.2mm zero error yields 23.2mm (Accepted within ±0.05mm)');

  // Incorrect Reading Rejected
  const wrongVernierGrade = await request(
    { path: '/api/physics/grade-measurement', method: 'POST', headers: { Cookie: adminCookie } },
    {
      student_reading: 23.8,
      correct_reading: 23.4,
      zero_error: 0.2,
      tolerance: 0.05,
      unit: 'mm'
    }
  );
  assert(wrongVernierGrade.json && wrongVernierGrade.json.isCorrect === false, 'Inaccurate reading should be rejected');
  pass('Vernier Calipers: Inaccurate reading 23.8mm correctly rejected');

  // Micrometer Screw Gauge: Observed = 2.84 mm, Zero Error = -0.02 mm -> True = 2.84 - (-0.02) = 2.86 mm
  const microGrade = await request(
    { path: '/api/physics/grade-measurement', method: 'POST', headers: { Cookie: adminCookie } },
    {
      student_reading: 2.86,
      correct_reading: 2.84,
      zero_error: -0.02,
      tolerance: 0.02,
      unit: 'mm'
    }
  );
  assert(microGrade.json && microGrade.json.isCorrect === true, 'Accurate micrometer reading accepted');
  pass('Micrometer Screw Gauge: Observed 2.84mm minus -0.02mm zero error yields 2.86mm (Accepted within ±0.02mm)');

  // STEP 5: CBT Examination Bank: Physics Question Config & Schema
  console.log('\n--- 5. CBT Examination Bank: Physics Questions Schema ---');
  const [exams] = await pool.query('SELECT exam_id FROM exams LIMIT 1');
  const testExamId = exams.length ? exams[0].exam_id : 1;

  const testPhysConfig = {
    apparatus: 'micrometer_screw_gauge',
    sleeve_reading_mm: 2.5,
    thimble_divisions: 34,
    thimble_pitch_mm: 0.01,
    zero_error_mm: 0.02
  };
  const testPhysTarget = {
    expected_value: 2.82,
    tolerance: 0.02,
    unit: 'mm'
  };

  const testQId = await questionModel.create(
    testExamId,
    'Read the micrometer screw gauge: main sleeve 2.5mm, thimble 34 divisions, zero error +0.02mm.',
    '2.82 mm',
    '2.84 mm',
    '2.86 mm',
    '2.52 mm',
    'A',
    'text',
    null,
    false,
    null,
    null
  );
  assert(testQId, 'Created test CBT question');

  // Update physics_config and physics_target
  await pool.query(
    'UPDATE questions SET physics_config = ?, physics_target = ? WHERE question_id = ?',
    [JSON.stringify(testPhysConfig), JSON.stringify(testPhysTarget), testQId]
  );

  const [qRows] = await pool.query(
    'SELECT question_id, physics_config, physics_target FROM questions WHERE question_id = ?',
    [testQId]
  );
  assert(qRows.length === 1, 'Question row retrieved');
  assert(qRows[0].physics_config, 'physics_config persisted in database');
  assert(qRows[0].physics_target, 'physics_target persisted in database');
  pass(`CBT Question Bank: Persisted & verified physics question (ID: ${testQId}) with physics schema`);

  // Clean up question
  await pool.query('DELETE FROM questions WHERE question_id = ?', [testQId]);
  pass('CBT Question Bank: Cleaned up test question');

  console.log('\n==================================================');
  console.log('PHYSICS LAB TESTS: ALL 15 ASSERTIONS PASSED!');
  console.log('==================================================\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal Physics Lab test runner error:', err);
    process.exit(1);
  });
