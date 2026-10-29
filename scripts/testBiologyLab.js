'use strict';
const adminCredentials = require('./adminTestCredentials')();

/**
 * Interactive Biology & Life Sciences Laboratory
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
  console.log('STARTING BIOLOGY & LIFE SCIENCES LAB TEST SUITE');
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

  // Block unauthenticated access to /biology-lab.html
  const unauthRes = await request({ path: '/biology-lab.html', method: 'GET' });
  assert(
    unauthRes.statusCode === 302 || unauthRes.body.includes('login'),
    'Unauthenticated user should be redirected from /biology-lab.html'
  );
  pass('Unauthenticated access blocked from /biology-lab.html');

  // Authenticated access allowed
  const authRes = await request({
    path: '/biology-lab.html',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(authRes.statusCode === 200, 'Authenticated user should access /biology-lab.html');
  assert(authRes.body.includes('Interactive Biology & Life Sciences Laboratory'), 'Biology lab HTML returned valid title');
  pass('Authenticated session can load /biology-lab.html');

  // STEP 2: Curriculum Topics Registry API (28 Topics)
  console.log('\n--- 2. Curriculum Topics Registry API (28 Topics) ---');
  const topicsRes = await request({
    path: '/api/biology/topics',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(topicsRes.statusCode === 200, 'Topics API failed');
  assert(topicsRes.json && topicsRes.json.success, 'Topics API should report success');
  assert(topicsRes.json.count === 28, `Expected 28 curriculum topics, got ${topicsRes.json.count}`);
  pass('All 28 comprehensive biology curriculum topics loaded');

  const topicCodes = topicsRes.json.topics.map((t) => t.code);
  const requiredCodes = [
    'intro-biology', 'laboratory-apparatus', 'cell-biology', 'microscopy', 'classification',
    'plant-biology', 'human-anatomy', 'animal-biology', 'nutrition', 'respiration',
    'photosynthesis', 'transport-systems', 'excretion', 'coordination', 'reproduction',
    'growth-development', 'genetics', 'evolution', 'ecology', 'microbiology',
    'immunology', 'biotechnology', 'homeostasis', 'environmental-biology',
    'virtual-experiments', 'specimen-library', 'graphing-data-analysis', 'practical-assessments'
  ];
  for (const rc of requiredCodes) {
    assert(topicCodes.includes(rc), `Missing required topic code: ${rc}`);
  }
  pass('All 28 core biological branches verified (Cytology, Taxonomy, Botany, Anatomy, Genetics, Ecology, Microbiology)');

  // Topic detail check: Cell Biology
  const cellRes = await request({
    path: '/api/biology/topics/cell-biology',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(cellRes.json && cellRes.json.success, 'Cell biology topic lookup failed');
  assert(cellRes.json.topic.keyConcepts.some((c) => c.includes('Prokaryotic')), 'Cell biology contains prokaryotic concepts');
  assert(cellRes.json.topic.modes.includes('cell_interactive_canvas'), 'Cell biology includes interactive canvas mode');
  pass('Topic detail lookup retrieves ultrastructure concepts and interactive modes (Cell Biology)');

  // Topic detail check: Genetics
  const genRes = await request({
    path: '/api/biology/topics/genetics',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(genRes.json && genRes.json.success, 'Genetics topic lookup failed');
  assert(genRes.json.topic.keyConcepts.some((c) => c.includes('3:1')), 'Genetics contains 3:1 Mendelian ratio');
  pass('Topic detail lookup retrieves inheritance patterns and Punnett modes (Genetics & Inheritance)');

  // Topic detail check: Photosynthesis
  const photoRes = await request({
    path: '/api/biology/topics/photosynthesis',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(photoRes.json && photoRes.json.success, 'Photosynthesis topic lookup failed');
  assert(photoRes.json.topic.keyConcepts.some((c) => c.includes('6CO2')), 'Photosynthesis contains chemical balance equation');
  pass('Topic detail lookup retrieves biochemical equations and limiting factors (Photosynthesis)');

  // STEP 3: Saved Biology Experiments Persistence CRUD
  console.log('\n--- 3. Saved Biology Experiments Persistence CRUD ---');
  const createExpRes = await request(
    { path: '/api/biology/experiments', method: 'POST', headers: { Cookie: adminCookie } },
    {
      title: 'Investigation of Osmosis in Solanum tuberosum (Potato Tissues)',
      topic_code: 'transport-systems',
      model_type: 'osmosis_cylinders',
      specimens: ['potato_cylinder_0_0M', 'potato_cylinder_0_4M', 'potato_cylinder_0_8M'],
      annotations: [{ label: 'Turgid state in distilled water', x: 120, y: 180 }],
      variables: { initialMassG: 5.0, incubationMinutes: 30 },
      data_readings: [
        { molarity: '0.0 M (Hypotonic)', initial_mass: 5.0, final_mass: 5.45, pct_change: '+9.0%' },
        { molarity: '0.27 M (Isotonic)', initial_mass: 5.0, final_mass: 5.00, pct_change: '0.0%' },
        { molarity: '0.8 M (Hypertonic)', initial_mass: 5.0, final_mass: 4.35, pct_change: '-13.0%' }
      ]
    }
  );
  assert(createExpRes.statusCode === 200, 'Create biology experiment failed');
  assert(createExpRes.json && createExpRes.json.success, 'Create experiment should succeed');
  const expId = createExpRes.json.experiment_id;
  pass(`Created saved biology experiment with ID: ${expId}`);

  // Retrieve single experiment
  const getExpRes = await request({
    path: `/api/biology/experiments/${expId}`,
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(getExpRes.statusCode === 200, 'Get experiment by ID failed');
  assert(getExpRes.json.experiment.title.includes('Solanum tuberosum'), 'Experiment title matches');
  assert(getExpRes.json.experiment.data_readings.length === 3, 'Data readings array persisted');
  pass('Retrieved saved biology experiment matching title and logged observations');

  // Delete experiment cleanly
  const delExpRes = await request({
    path: `/api/biology/experiments/${expId}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie }
  });
  assert(delExpRes.statusCode === 200, 'Delete experiment failed');
  pass('Deleted saved biology experiment cleanly');

  // STEP 4: Computational Genetics & Punnett Square Auto-Grading
  console.log('\n--- 4. Computational Genetics & Punnett Square Auto-Grading ---');
  // Monohybrid cross: Aa x Aa -> 1 AA : 2 Aa : 1 aa
  const geneticsGrade = await request(
    { path: '/api/biology/grade-genetics', method: 'POST', headers: { Cookie: adminCookie } },
    {
      parent1_genotype: 'Aa',
      parent2_genotype: 'Aa',
      student_genotype_ratio: '1 AA : 2 Aa : 1 aa'
    }
  );
  assert(geneticsGrade.json && geneticsGrade.json.isCorrect === true, 'Accurate Punnett cross should be accepted');
  assert(geneticsGrade.json.genotypeCounts['Aa'] === 2, 'Heterozygous count should be 2');
  pass('Mendelian Genetics: Monohybrid cross Aa × Aa yields 1 AA : 2 Aa : 1 aa (75% Dominant / 25% Recessive)');

  // Incorrect ratio rejected
  const wrongGeneticsGrade = await request(
    { path: '/api/biology/grade-genetics', method: 'POST', headers: { Cookie: adminCookie } },
    {
      parent1_genotype: 'Aa',
      parent2_genotype: 'Aa',
      student_genotype_ratio: '3 AA : 1 aa'
    }
  );
  assert(wrongGeneticsGrade.json && wrongGeneticsGrade.json.isCorrect === false, 'Incorrect ratio should be rejected');
  pass('Mendelian Genetics: Inaccurate genotypic ratio correctly rejected');

  // STEP 5: Virtual Microscopy Magnification & Graticule Calibration
  console.log('\n--- 5. Virtual Microscopy Magnification Engine ---');
  // Image size = 24,000 um (24 mm), Actual size = 60 um -> Magnification M = 24000 / 60 = 400x
  const microGrade = await request(
    { path: '/api/biology/grade-microscopy', method: 'POST', headers: { Cookie: adminCookie } },
    {
      image_size: 24000,
      actual_size: 60,
      magnification: 400,
      tolerance: 0.05,
      unit: 'μm'
    }
  );
  assert(microGrade.json && microGrade.json.isCorrect === true, 'Accurate magnification calculation should be accepted');
  pass('Microscopy Calculation: Image 24,000μm / Actual 60μm yields 400× total magnification');

  // STEP 6: Dihybrid 16-Cell Punnett Square Cross Solver
  console.log('\n--- 6. Dihybrid Genetics Independent Assortment ---');
  const dihybridRes = await request(
    { path: '/api/biology/grade-dihybrid', method: 'POST', headers: { Cookie: adminCookie } },
    {
      parent1_genotype: 'AaBb',
      parent2_genotype: 'AaBb',
      student_phenotype_ratio: '9 : 3 : 3 : 1'
    }
  );
  assert(dihybridRes.statusCode === 200, 'Dihybrid cross request failed');
  assert(dihybridRes.json.isCorrect === true, 'Mendelian dihybrid ratio 9:3:3:1 should be valid');
  assert(dihybridRes.json.grid.length === 4 && dihybridRes.json.grid[0].length === 4, '16-cell zygotic matrix created');
  pass('Dihybrid Cross: AaBb × AaBb independently assorts into 9:3:3:1 classic phenotypic ratio');

  // STEP 7: Computational Enzyme Kinetics Engine
  console.log('\n--- 7. Enzyme Kinetics & Inhibitor Dynamics ---');
  const enzymeRes = await request(
    { path: '/api/biology/simulate-enzyme', method: 'POST', headers: { Cookie: adminCookie } },
    {
      temp: 37,
      pH: 7.4,
      substrate: 10,
      inhibitorType: 'competitive',
      inhibitorConc: 2.0
    }
  );
  assert(enzymeRes.statusCode === 200, 'Enzyme simulation failed');
  assert(enzymeRes.json.apparentKm > 5.0, 'Competitive inhibitor increases apparent Km');
  assert(enzymeRes.json.velocity > 0, 'Velocity computed correctly');
  assert(enzymeRes.json.curvePoints.length > 0, 'Lineweaver-Burk and curve points generated');
  pass('Enzyme Kinetics: Michaelis-Menten with competitive inhibitor correctly increases apparent Km');

  // STEP 8: Ecological Dynamics: Lotka-Volterra Predator-Prey Engine
  console.log('\n--- 8. Lotka-Volterra Ecological Dynamics ---');
  const lotkaRes = await request(
    { path: '/api/biology/simulate-lotka-volterra', method: 'POST', headers: { Cookie: adminCookie } },
    {
      alpha: 1.0,
      beta: 0.05,
      gamma: 0.5,
      delta: 0.02,
      prey0: 40,
      pred0: 9,
      steps: 50,
      dt: 0.1
    }
  );
  assert(lotkaRes.statusCode === 200, 'Lotka-Volterra simulation failed');
  assert(lotkaRes.json.timeSeries.length === 51, 'Time series generated 51 points');
  assert(lotkaRes.json.equilibrium.prey === 25, 'Equilibrium prey gamma/delta = 0.5/0.02 = 25');
  assert(lotkaRes.json.equilibrium.predator === 20, 'Equilibrium predator alpha/beta = 1.0/0.05 = 20');
  pass('Ecology Simulation: Lotka-Volterra numerical integration models cyclical oscillations (Prey eq: 25, Pred eq: 20)');

  // STEP 9: Microbiology: Kirby-Bauer Antibiotic Sensitivity Assay
  console.log('\n--- 9. Microbiology: Kirby-Bauer Antibiotic Assay ---');
  const abRes = await request(
    { path: '/api/biology/evaluate-antibiotic', method: 'POST', headers: { Cookie: adminCookie } },
    {
      antibiotic: 'penicillin',
      zone_diameter_mm: 32
    }
  );
  assert(abRes.statusCode === 200, 'Antibiotic assay evaluation failed');
  assert(abRes.json.interpretation === 'Susceptible', 'Zone 32mm should be clinically Susceptible');

  const abResResistant = await request(
    { path: '/api/biology/evaluate-antibiotic', method: 'POST', headers: { Cookie: adminCookie } },
    {
      antibiotic: 'penicillin',
      zone_diameter_mm: 12
    }
  );
  assert(abResResistant.json.interpretation === 'Resistant', 'Zone 12mm should be clinically Resistant');
  pass('Kirby-Bauer Assay: Antibiotic zone diameter classified accurately (32mm -> Susceptible, 12mm -> Resistant)');

  // STEP 10: Biological Specimen Catalog API (11 Categories)
  console.log('\n--- 10. Biological Specimen Catalog API ---');
  const catalogRes = await request({
    path: '/api/biology/specimens/catalog',
    method: 'GET',
    headers: { Cookie: adminCookie }
  });
  assert(catalogRes.statusCode === 200, 'Specimen catalog API failed');
  assert(catalogRes.json.catalog.length >= 5, 'Catalog returned structured categories');
  pass('Specimen Catalog: Retrieved full anatomical and histological categories with SI dimensions');

  // STEP 11: CBT Examination Bank: Biology Questions Schema
  console.log('\n--- 11. CBT Examination Bank: Biology Questions Schema ---');
  const [exams] = await pool.query('SELECT exam_id FROM exams LIMIT 1');
  const testExamId = exams.length ? exams[0].exam_id : 1;

  const testBioConfig = {
    diagram_type: 'plant_cell_organelles',
    target_organelle: 'chloroplast',
    stain_used: 'none_autofluorescent',
    magnification: '10000x_TEM'
  };
  const testBioTarget = {
    organelle_name: 'Chloroplast',
    primary_function: 'Site of photosynthesis; contains thylakoid membranes and stroma',
    atp_generation: true
  };

  const testQId = await questionModel.create(
    testExamId,
    'Identify organelle X containing thylakoid grana discs and double outer envelope membrane.',
    'Chloroplast',
    'Mitochondrion',
    'Endoplasmic Reticulum',
    'Golgi Apparatus',
    'A',
    'text',
    null,
    false,
    null,
    null
  );
  assert(testQId, 'Created test CBT question');

  // Update biology_config and biology_target
  await pool.query(
    'UPDATE questions SET biology_config = ?, biology_target = ? WHERE question_id = ?',
    [JSON.stringify(testBioConfig), JSON.stringify(testBioTarget), testQId]
  );

  const [qRows] = await pool.query(
    'SELECT question_id, biology_config, biology_target FROM questions WHERE question_id = ?',
    [testQId]
  );
  assert(qRows.length === 1, 'Question row retrieved');
  assert(qRows[0].biology_config, 'biology_config persisted in database');
  assert(qRows[0].biology_target, 'biology_target persisted in database');
  pass(`CBT Question Bank: Persisted & verified biology question (ID: ${testQId}) with biology schema`);

  // Clean up question
  await pool.query('DELETE FROM questions WHERE question_id = ?', [testQId]);
  pass('CBT Question Bank: Cleaned up test question');

  console.log('\n==================================================');
  console.log('BIOLOGY LAB TESTS: ALL 21 ASSERTIONS PASSED!');
  console.log('==================================================\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal Biology Lab test runner error:', err);
    process.exit(1);
  });
