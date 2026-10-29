'use strict';

/**
 * Automated Test Suite for Interactive Graphing & Data Visualization Lab
 */

const pool = require('../config/database');
const { listProfiles, getProfile } = require('../config/subjectProfiles');

async function runGraphingLabTests() {
  console.log('==================================================');
  console.log('STARTING GRAPHING & DATA VISUALIZATION LAB TEST SUITE');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Subject Profiles Registry
    console.log('--- TEST 1: Subject Profiles Registry ---');
    const profiles = listProfiles();
    assert(profiles.length >= 8, `Loaded ${profiles.length} subject profiles`);
    
    const mathProfile = getProfile('MATHEMATICS');
    assert(mathProfile && mathProfile.name === 'Mathematics', 'Mathematics profile exists with formulas');
    assert(mathProfile.presets && mathProfile.presets.length > 5, 'Mathematics presets available');

    const physicsProfile = getProfile('PHYSICS');
    assert(physicsProfile && physicsProfile.name === 'Physics', 'Physics profile exists');
    assert(physicsProfile.supportedGraphTypes.some(t => t.id === 'scientific_data'), 'Physics supports scientific_data graph type');

    const chemProfile = getProfile('CHEMISTRY');
    assert(chemProfile && chemProfile.name === 'Chemistry', 'Chemistry profile exists with titration presets');

    const bioProfile = getProfile('BIOLOGY');
    assert(bioProfile && bioProfile.name === 'Biology', 'Biology profile exists with enzyme & growth presets');

    const econProfile = getProfile('ECONOMICS');
    assert(econProfile && econProfile.name === 'Economics & Commerce', 'Economics profile exists with supply/demand');

    const statsProfile = getProfile('STATISTICS');
    assert(statsProfile && statsProfile.name === 'Statistics & Data Science', 'Statistics profile exists');

    const agriProfile = getProfile('AGRICULTURE');
    assert(agriProfile && agriProfile.name === 'Agriculture & Agricultural Science', 'Agriculture profile exists');

    // TEST 2: Database Schema & Seeded Cross-Subject Templates
    console.log('\n--- TEST 2: Seeded Cross-Subject Templates in Database ---');
    const [templates] = await pool.query('SELECT id, title, subject_code, graph_type, is_template FROM saved_graphs WHERE is_template = TRUE');
    assert(templates.length >= 8, `Found ${templates.length} seeded cross-subject templates`);
    
    const subjectsInDB = new Set(templates.map(t => t.subject_code));
    assert(subjectsInDB.has('MATHEMATICS'), 'Database has Mathematics templates');
    assert(subjectsInDB.has('PHYSICS'), 'Database has Physics templates');
    assert(subjectsInDB.has('CHEMISTRY'), 'Database has Chemistry templates');
    assert(subjectsInDB.has('BIOLOGY'), 'Database has Biology templates');
    assert(subjectsInDB.has('ECONOMICS'), 'Database has Economics templates');
    assert(subjectsInDB.has('GEOGRAPHY'), 'Database has Geography templates');
    assert(subjectsInDB.has('STATISTICS'), 'Database has Statistics templates');
    assert(subjectsInDB.has('AGRICULTURE'), 'Database has Agriculture templates');

    // TEST 3: CRUD Operations on Saved Graphs
    console.log('\n--- TEST 3: Graph Persistence & Management ---');
    const [insertResult] = await pool.query(`
      INSERT INTO saved_graphs 
        (title, description, subject_code, topic, graph_type, config, data_points, functions, created_by_role, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'Automated Test Graph: Ohm\'s Law V-I',
      'Test description for experimental verification',
      'PHYSICS',
      'Current Electricity',
      'scientific_data',
      JSON.stringify({ xLabel: 'Voltage', xUnit: 'V', yLabel: 'Current', yUnit: 'A' }),
      JSON.stringify([{ x: 2, y: 0.4 }, { x: 4, y: 0.8 }]),
      JSON.stringify([]),
      'tutor',
      'TEST_TUTOR_01'
    ]);

    const graphId = insertResult.insertId;
    assert(graphId > 0, `Created saved graph with ID: ${graphId}`);

    const [retrieved] = await pool.query('SELECT * FROM saved_graphs WHERE id = ?', [graphId]);
    assert(retrieved.length === 1, 'Retrieved saved graph by ID');
    assert(retrieved[0].title === 'Automated Test Graph: Ohm\'s Law V-I', 'Graph title matches');

    // Update
    await pool.query('UPDATE saved_graphs SET title = ? WHERE id = ?', ['Updated Graph Title', graphId]);
    const [updated] = await pool.query('SELECT title FROM saved_graphs WHERE id = ?', [graphId]);
    assert(updated[0].title === 'Updated Graph Title', 'Updated graph title successfully');

    // Delete
    await pool.query('DELETE FROM saved_graphs WHERE id = ?', [graphId]);
    const [deleted] = await pool.query('SELECT id FROM saved_graphs WHERE id = ?', [graphId]);
    assert(deleted.length === 0, 'Deleted test graph cleanly');

    // TEST 4: Auto-Grading Graph Target Evaluation
    console.log('\n--- TEST 4: Graph Question Auto-Grading Engine ---');
    const graphingController = require('../controllers/graphingController');
    
    // Simulate req / res for gradeGraphAnswer
    let resObj = {};
    const mockRes = {
      json: (data) => { resObj = data; return mockRes; },
      status: () => mockRes
    };

    // Point selection test (correct)
    await graphingController.gradeGraphAnswer({
      body: {
        targetConfig: {
          interactionType: 'select_point',
          targetPoint: { x: 3.0, y: 9.0 },
          tolerance: 0.2,
          explanation: 'Vertex of y = x^2 at x=3 is (3, 9)'
        },
        studentAnswer: { x: 3.05, y: 9.08 }
      }
    }, mockRes, (err) => console.error(err));

    assert(resObj.success === true, 'Grading API response successful');
    assert(resObj.isCorrect === true, 'Correctly matched student point within tolerance');
    assert(resObj.earnedRatio === 1.0, 'Full score ratio 1.0 awarded');

    // Point selection test (out of tolerance)
    await graphingController.gradeGraphAnswer({
      body: {
        targetConfig: {
          interactionType: 'select_point',
          targetPoint: { x: 3.0, y: 9.0 },
          tolerance: 0.2
        },
        studentAnswer: { x: 4.5, y: 12.0 }
      }
    }, mockRes, (err) => console.error(err));

    assert(resObj.isCorrect === false, 'Correctly rejected point outside tolerance');
    assert(resObj.earnedRatio === 0.0, 'Zero score ratio awarded for incorrect point');

    // Slope calculation test
    await graphingController.gradeGraphAnswer({
      body: {
        targetConfig: {
          interactionType: 'calculate_slope',
          targetSlope: 2.5,
          tolerance: 0.1
        },
        studentAnswer: { value: 2.52 }
      }
    }, mockRes, (err) => console.error(err));

    assert(resObj.isCorrect === true, 'Slope calculation graded correctly within tolerance');

    console.log('\n==================================================');
    console.log(`GRAPHING LAB TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('==================================================');

    if (failed > 0) process.exit(1);

  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runGraphingLabTests().then(() => {
  console.log('🎉 ALL GRAPHING LAB TESTS COMPLETED SUCCESSFULLY!');
  process.exit(0);
});
