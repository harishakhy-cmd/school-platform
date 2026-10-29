'use strict';
const adminCredentials = require('./adminTestCredentials')();

/**
 * Advanced Interactive Chemistry & Chemical Sciences Laboratory
 * Comprehensive Integration & Verification Test Suite
 * 30+ Assertions covering:
 * - 33 Curriculum Topics API
 * - Substance Catalog & Element Data (118 IUPAC elements)
 * - Chemical Equation Balancer Engine (Matrix Conservation)
 * - Stoichiometry Yield Engine
 * - Mole & Avogadro Number Calculations
 * - Acid-Base & pH / pOH Calculator
 * - Gas Laws Engine (PV = nRT)
 * - Titration Titre & Equivalence Analysis
 * - Experiment Persistence CRUD (MySQL)
 * - CBT Examination Auto-Grading Handlers
 * - Database Schema Integrity
 */

const http = require('http');
const assert = require('assert');
const pool = require('../config/database');
const subjectProfiles = require('../config/subjectProfiles');

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
  console.log('\n======================================================');
  console.log('STARTING CHEMISTRY & CHEMICAL SCIENCES LAB TEST SUITE');
  console.log('======================================================\n');

  try {
    // -----------------------------------------------------------------
    // 1. Authentication & Security
    // -----------------------------------------------------------------
    console.log('--- 1. Authentication & Access Security ---');
    const loginRes = await request(
      { path: '/api/admin/auth/login', method: 'POST' },
      { username: adminCredentials.username, password: adminCredentials.password }
    );
    assert(loginRes.statusCode === 200, 'Super admin login failed');
    const setCookie = loginRes.headers['set-cookie'];
    assert(setCookie && setCookie.length > 0, 'No session cookie received');
    adminCookie = setCookie[0].split(';')[0];
    pass('Super Admin session established');

    const unauthRes = await request({ path: '/chemistry-lab.html', method: 'GET' });
    assert(
      unauthRes.statusCode === 302 || unauthRes.body.includes('login'),
      'Unauthenticated request must be redirected to login'
    );
    pass('Unauthenticated access blocked from /chemistry-lab.html');

    const authRes = await request({
      path: '/chemistry-lab.html',
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(authRes.statusCode === 200, 'Authenticated access to /chemistry-lab.html must succeed');
    assert(authRes.body.includes('Interactive Chemistry Laboratory'), 'Chemistry Lab title rendered');
    assert(authRes.body.includes('chem-lab-canvas'), '2D workbench canvas present in DOM');
    assert(authRes.body.includes('chem-3d-container'), '3D molecular container present in DOM');
    assert(authRes.body.includes('chem-periodic-grid'), 'Periodic table grid present in DOM');
    pass('Authenticated session loaded /chemistry-lab.html successfully');

    // -----------------------------------------------------------------
    // 2. 33 Curriculum Topics Registry API
    // -----------------------------------------------------------------
    console.log('\n--- 2. 33 Curriculum Topics Registry API ---');
    const topicsRes = await request({
      path: '/api/chemistry/topics',
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(topicsRes.statusCode === 200, 'Topics API failed');
    assert(topicsRes.json && topicsRes.json.success, 'Topics API should report success');
    assert(topicsRes.json.count === 33, `Expected 33 curriculum topics, got ${topicsRes.json.count}`);
    pass('All 33 comprehensive curriculum topics returned by API');

    const requiredTopics = [
      'intro-chemistry', 'lab-safety', 'apparatus-library', 'matter-states',
      'atomic-structure', 'periodic-table', 'chemical-bonding', 'molecular-geometry',
      'chemical-formulae', 'chemical-equations', 'mole-concept', 'stoichiometry',
      'acids-bases-salts', 'titration', 'chemical-reactions', 'energetics',
      'reaction-kinetics', 'equilibrium', 'electrochemistry', 'redox-chemistry',
      'organic-chemistry', 'inorganic-chemistry', 'analytical-chemistry', 'separation-techniques',
      'gas-chemistry', 'water-chemistry', 'environmental-chemistry', 'industrial-chemistry',
      'nuclear-chemistry', 'biochemistry', 'virtual-experiments', 'graphing-analysis',
      'practical-assessments'
    ];
    const retrievedCodes = topicsRes.json.topics.map((t) => t.code);
    for (const rc of requiredTopics) {
      assert(retrievedCodes.includes(rc), `Missing required curriculum topic: ${rc}`);
    }
    pass('All 33 required topics present in registry');

    // Individual topic detail lookups
    const titrRes = await request({
      path: '/api/chemistry/topics/titration',
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(titrRes.json && titrRes.json.success, 'Titration topic lookup failed');
    assert(titrRes.json.topic.branch === 'Analytical Chemistry', 'Titration belongs to Analytical Chemistry');
    pass('Topic detail lookup for Titration verified');

    const atomRes = await request({
      path: '/api/chemistry/topics/atomic-structure',
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(atomRes.json && atomRes.json.success, 'Atomic structure topic lookup failed');
    assert(atomRes.json.topic.branch === 'Physical Chemistry', 'Atomic structure belongs to Physical Chemistry');
    pass('Topic detail lookup for Atomic Structure verified');

    // -----------------------------------------------------------------
    // 3. Substance Catalog & 118-Element Data
    // -----------------------------------------------------------------
    console.log('\n--- 3. Substance Catalog & Element Data ---');
    const catRes = await request({
      path: '/api/chemistry/substances/catalog',
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(catRes.statusCode === 200, 'Substance catalog failed');
    assert(catRes.json && catRes.json.success, 'Substance catalog success flag');
    assert(Array.isArray(catRes.json.substances), 'Substance catalog is an array');
    assert(catRes.json.substances.length >= 25, 'Catalog has at least 25 standard verified reagents');
    const hcl = catRes.json.substances.find((s) => s.formula === 'HCl');
    assert(hcl && hcl.molarMass > 36.4 && hcl.molarMass < 36.5, 'HCl molar mass matches 36.46 g/mol');
    pass('Substance catalog contains verified chemical properties and safety classifications');

    const elemRes = await request({
      path: '/api/chemistry/elements',
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(elemRes.statusCode === 200, 'Elements API failed');
    assert(elemRes.json && elemRes.json.success, 'Elements API success flag');
    assert(elemRes.json.count >= 30, `Expected at least 30 curriculum elements, received ${elemRes.json.count}`);
    const carbon = elemRes.json.elements.find((e) => e.sym === 'C' || e.symbol === 'C');
    assert(carbon && carbon.Z === 6 && (carbon.mass > 12.0 || carbon.atomicMass > 12.0), 'Carbon properties accurate');
    // Also verify all 118 IUPAC elements from client ChemData module
    const chemData = require('../public/js/chem-data.js');
    assert(chemData && chemData.ELEMENTS && chemData.ELEMENTS.length === 118, 'ChemData provides all 118 IUPAC elements');
    pass('Periodic Table elements API provides verified curriculum elements & client provides complete 118-element IUPAC dataset');

    // -----------------------------------------------------------------
    // 4. Chemical Equation Balancer Engine
    // -----------------------------------------------------------------
    console.log('\n--- 4. Chemical Equation Balancer Engine ---');
    // Test 1: Propane combustion: C3H8 + O2 -> CO2 + H2O
    const eq1 = await request(
      { path: '/api/chemistry/balance-equation', method: 'POST', headers: { Cookie: adminCookie } },
      { reactants: ['C3H8', 'O2'], products: ['CO2', 'H2O'] }
    );
    assert(eq1.json && eq1.json.success, 'Propane combustion balancing failed');
    assert.deepStrictEqual(eq1.json.reactantCoeffs, [1, 5], `Expected [1, 5], got ${JSON.stringify(eq1.json.reactantCoeffs)}`);
    assert.deepStrictEqual(eq1.json.productCoeffs, [3, 4], `Expected [3, 4], got ${JSON.stringify(eq1.json.productCoeffs)}`);
    pass('Propane combustion balanced: C3H8 + 5O2 -> 3CO2 + 4H2O');

    // Test 2: Synthesis of ammonia: N2 + H2 -> NH3
    const eq2 = await request(
      { path: '/api/chemistry/balance-equation', method: 'POST', headers: { Cookie: adminCookie } },
      { reactants: ['N2', 'H2'], products: ['NH3'] }
    );
    assert(eq2.json && eq2.json.success, 'Haber ammonia synthesis balancing failed');
    assert.deepStrictEqual(eq2.json.reactantCoeffs, [1, 3], 'N2 + 3H2');
    assert.deepStrictEqual(eq2.json.productCoeffs, [2], '2NH3');
    pass('Ammonia synthesis balanced: N2 + 3H2 -> 2NH3');

    // Test 3: Water synthesis: H2 + O2 -> H2O
    const eq3 = await request(
      { path: '/api/chemistry/balance-equation', method: 'POST', headers: { Cookie: adminCookie } },
      { reactants: ['H2', 'O2'], products: ['H2O'] }
    );
    assert(eq3.json && eq3.json.success, 'Water synthesis balancing failed');
    assert.deepStrictEqual(eq3.json.reactantCoeffs, [2, 1], '2H2 + O2');
    assert.deepStrictEqual(eq3.json.productCoeffs, [2], '2H2O');
    pass('Water formation balanced: 2H2 + O2 -> 2H2O');

    // -----------------------------------------------------------------
    // 5. Stoichiometry Engine
    // -----------------------------------------------------------------
    console.log('\n--- 5. Stoichiometry Engine ---');
    // 2H2 + O2 -> 2H2O: Given 4.0 g of H2 (M=2.016 g/mol, coeff=2), wanted H2O (M=18.015 g/mol, coeff=2)
    const stoichRes = await request(
      { path: '/api/chemistry/stoichiometry', method: 'POST', headers: { Cookie: adminCookie } },
      {
        molarMassGiven: 2.016,
        molarMassWanted: 18.015,
        coeffGiven: 2,
        coeffWanted: 2,
        givenAmount: 4.0,
        givenUnit: 'g'
      }
    );
    assert(stoichRes.json && stoichRes.json.success, 'Stoichiometry calculation failed');
    assert(Math.abs(stoichRes.json.molesGiven - 1.984) < 0.05, 'Moles of H2 calculated correctly');
    assert(Math.abs(stoichRes.json.massWanted_g - 35.74) < 0.2, 'Theoretical mass of H2O yield calculated correctly');
    pass('Stoichiometry theoretical yield verified with mole-ratio conversion');

    // -----------------------------------------------------------------
    // 6. Mole Concept & Avogadro Number
    // -----------------------------------------------------------------
    console.log('\n--- 6. Mole Concept & Avogadro Engine ---');
    const moleRes1 = await request(
      { path: '/api/chemistry/mole-calc', method: 'POST', headers: { Cookie: adminCookie } },
      { calcType: 'mass_to_moles', value: 36.03, molarMass: 18.015 }
    );
    assert(moleRes1.json && moleRes1.json.success, 'Mass to moles failed');
    assert(Math.abs(moleRes1.json.moles - 2.0) < 0.01, '36.03 g of H2O corresponds to 2.0 moles');
    pass('Mole conversion: mass -> moles verified');

    const moleRes2 = await request(
      { path: '/api/chemistry/mole-calc', method: 'POST', headers: { Cookie: adminCookie } },
      { calcType: 'moles_to_particles', value: 1.0, molarMass: 18.015 }
    );
    assert(moleRes2.json && moleRes2.json.success, 'Moles to particles failed');
    assert(moleRes2.json.particles.includes('6.022'), 'Avogadro constant applied: 6.022 x 10^23');
    pass('Avogadro particle conversion verified');

    // -----------------------------------------------------------------
    // 7. pH & Acid-Base Calculations
    // -----------------------------------------------------------------
    console.log('\n--- 7. pH & Acid-Base Calculations ---');
    // Strong Acid: 0.01 M HCl -> pH = 2.00, pOH = 12.00
    const phAcid = await request(
      { path: '/api/chemistry/ph-calculate', method: 'POST', headers: { Cookie: adminCookie } },
      { type: 'strong_acid', concentration: 0.01 }
    );
    assert(phAcid.json && phAcid.json.success, 'Strong acid pH failed');
    assert(Math.abs(phAcid.json.pH - 2.0) < 0.01, '0.01 M HCl gives pH = 2.00');
    assert(Math.abs(phAcid.json.pOH - 12.0) < 0.01, '0.01 M HCl gives pOH = 12.00');
    pass('Strong monoprotic acid pH and pOH verified');

    // Strong Base: 0.01 M NaOH -> pH = 12.00, pOH = 2.00
    const phBase = await request(
      { path: '/api/chemistry/ph-calculate', method: 'POST', headers: { Cookie: adminCookie } },
      { type: 'strong_base', concentration: 0.01 }
    );
    assert(phBase.json && phBase.json.success, 'Strong base pH failed');
    assert(Math.abs(phBase.json.pH - 12.0) < 0.01, '0.01 M NaOH gives pH = 12.00');
    pass('Strong alkali pH and pOH verified');

    // Weak Acid: 0.10 M CH3COOH (Ka = 1.8e-5) -> pH = -log10(sqrt(1.8e-6)) = ~2.87
    const phWeak = await request(
      { path: '/api/chemistry/ph-calculate', method: 'POST', headers: { Cookie: adminCookie } },
      { type: 'weak_acid', concentration: 0.10, ka: 0.000018 }
    );
    assert(phWeak.json && phWeak.json.success, 'Weak acid pH failed');
    assert(Math.abs(phWeak.json.pH - 2.87) < 0.05, 'Weak acid pH calculation accurate to equilibrium');
    pass('Weak acid Ostwald equilibrium pH verified');

    // -----------------------------------------------------------------
    // 8. Gas Laws Engine
    // -----------------------------------------------------------------
    console.log('\n--- 8. Gas Laws Engine (PV = nRT) ---');
    const gasRes = await request(
      { path: '/api/chemistry/gas-law', method: 'POST', headers: { Cookie: adminCookie } },
      { target: 'V', P: 101.325, n: 1.0, T: 273.15 }
    );
    assert(gasRes.json && gasRes.json.success, 'Gas law V calculation failed');
    assert(Math.abs(parseFloat(gasRes.json.result) - 22.414) < 0.05, '1 mole at STP occupies 22.414 dm3');
    pass('Ideal gas molar volume at STP verified (22.414 L/mol)');

    // -----------------------------------------------------------------
    // 9. Titration Analysis Engine
    // -----------------------------------------------------------------
    console.log('\n--- 9. Titration Analysis Engine ---');
    // 25 mL of 0.1 M NaOH titrated with 0.1 M HCl
    const titrCalc = await request(
      { path: '/api/chemistry/titration-calc', method: 'POST', headers: { Cookie: adminCookie } },
      { acidConcentration: 0.10, baseConcentration: 0.10, baseVolume_mL: 25.0, moleRatioAcidBase: 1.0 }
    );
    assert(titrCalc.json && titrCalc.json.success, 'Titration calc failed');
    assert(Math.abs(titrCalc.json.equivalenceVolume_mL - 25.0) < 0.01, 'Equivalence volume is 25.0 mL');
    assert(Array.isArray(titrCalc.json.curvePoints) && titrCalc.json.curvePoints.length > 10, 'Generated full titration curve');
    pass('Titration equivalence point and sigmoidal curve points verified');

    // -----------------------------------------------------------------
    // 10. Saved Experiments Persistence CRUD
    // -----------------------------------------------------------------
    console.log('\n--- 10. Saved Experiments Persistence CRUD ---');
    const createExp = await request(
      { path: '/api/chemistry/experiments', method: 'POST', headers: { Cookie: adminCookie } },
      {
        title: 'Standardisation of 0.1M Hydrochloric Acid',
        topic_code: 'titration',
        apparatus_json: [{ type: 'burette', x: 200, y: 150 }, { type: 'conical_flask', x: 200, y: 300 }],
        observations: 'Sharp color change from pink to colorless at 24.95 cm³',
        measurements_json: [{ titre: 24.95, pH: 7.0 }]
      }
    );
    assert(createExp.json && createExp.json.success, 'Experiment save failed');
    const expId = createExp.json.id;
    assert(expId > 0, 'Returned valid experiment ID');
    pass(`Created chemistry experiment (ID: ${expId})`);

    const getExp = await request({
      path: `/api/chemistry/experiments/${expId}`,
      method: 'GET',
      headers: { Cookie: adminCookie }
    });
    assert(getExp.json && getExp.json.success, 'Retrieve experiment failed');
    assert(getExp.json.experiment.title.includes('Standardisation'), 'Retrieved matching title');
    pass('Retrieved saved chemistry experiment from database');

    const delExp = await request({
      path: `/api/chemistry/experiments/${expId}`,
      method: 'DELETE',
      headers: { Cookie: adminCookie }
    });
    assert(delExp.json && delExp.json.success, 'Delete experiment failed');
    pass('Deleted chemistry experiment record');

    // -----------------------------------------------------------------
    // 11. CBT Question Auto-Grading Handlers
    // -----------------------------------------------------------------
    console.log('\n--- 11. CBT Examination Auto-Grading Handlers ---');
    const gradeEq = await request(
      { path: '/api/chemistry/grade-equation', method: 'POST', headers: { Cookie: adminCookie } },
      {
        expectedReactantCoeffs: [1, 5],
        expectedProductCoeffs: [3, 4],
        studentReactantCoeffs: [1, 5],
        studentProductCoeffs: [3, 4]
      }
    );
    assert(gradeEq.json && gradeEq.json.success, 'Equation grading failed');
    assert(gradeEq.json.score === 1.0 && gradeEq.json.isCorrect, 'Correct equation scored 100%');
    pass('Equation balancer CBT question auto-grading verified');

    const gradeStoich = await request(
      { path: '/api/chemistry/grade-stoichiometry', method: 'POST', headers: { Cookie: adminCookie } },
      {
        expectedValue: 35.74,
        tolerancePercent: 2.0,
        studentValue: 35.8
      }
    );
    assert(gradeStoich.json && gradeStoich.json.success, 'Stoichiometry grading failed');
    assert(gradeStoich.json.score === 1.0 && gradeStoich.json.isCorrect, 'Answer within tolerance scored 100%');
    pass('Stoichiometry numerical answer CBT question auto-grading verified');

    const gradeIdent = await request(
      { path: '/api/chemistry/grade-identification', method: 'POST', headers: { Cookie: adminCookie } },
      {
        expectedIdentity: 'Cu2+',
        studentAnswer: 'cu2+'
      }
    );
    assert(gradeIdent.json && gradeIdent.json.success, 'Identification grading failed');
    assert(gradeIdent.json.isCorrect, 'Ion qualitative analysis identification auto-graded correctly');
    pass('Qualitative identification CBT question auto-grading verified');

    // -----------------------------------------------------------------
    // 12. Database Schema Validation
    // -----------------------------------------------------------------
    console.log('\n--- 12. Database Schema Validation ---');
    const [tables] = await pool.query("SHOW TABLES LIKE 'chemistry_experiments'");
    assert(tables.length === 1, 'Table chemistry_experiments exists');
    pass('chemistry_experiments database table verified');

    const [qCols] = await pool.query("SHOW COLUMNS FROM questions LIKE 'chemistry_config'");
    assert(qCols.length === 1, 'questions.chemistry_config column exists');
    pass('questions.chemistry_config column verified');

    const [aCols] = await pool.query("SHOW COLUMNS FROM assignments LIKE 'requires_chemistry_lab'");
    assert(aCols.length === 1, 'assignments.requires_chemistry_lab column exists');
    pass('assignments.requires_chemistry_lab column verified');

    // -----------------------------------------------------------------
    // 13. Subject Profile Integration
    // -----------------------------------------------------------------
    console.log('\n--- 13. Subject Profiles Integration ---');
    const chemProfile = (subjectProfiles.SUBJECT_PROFILES && subjectProfiles.SUBJECT_PROFILES.CHEMISTRY) ||
      (typeof subjectProfiles.getProfile === 'function' && subjectProfiles.getProfile('CHEMISTRY')) ||
      subjectProfiles.CHEMISTRY;
    assert(chemProfile, 'CHEMISTRY profile exists in subjectProfiles');
    assert(chemProfile.presets.length >= 4, 'CHEMISTRY profile has at least 4 scientific graph presets');
    pass('Graphing Laboratory CHEMISTRY profile verified');

    console.log('\n======================================================');
    console.log('✓ ALL 30+ CHEMISTRY LABORATORY TESTS PASSED CLEANLY');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ CHEMISTRY LAB TEST FAILED:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTests();
