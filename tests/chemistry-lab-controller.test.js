'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const controller = require('../controllers/chemistryLabController');
const model = require('../models/chemistryLabModel');
const simulation = require('../public/js/chemistry-simulation');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('chemistry run ownership is scoped to the logged-in student or staff account', () => {
  assert.deepEqual(controller.owner({ session: { registrationNumber: 'STO1-001A' } }), {
    ownerRole: 'student', ownerIdentifier: 'STO1-001A'
  });
  assert.deepEqual(controller.owner({ session: { adminId: 7, adminUsername: 'tutor-a', adminRole: 'tutor' } }), {
    ownerRole: 'tutor', ownerIdentifier: 'tutor-a'
  });
  assert.deepEqual(controller.owner({ session: { adminId: 8, adminUsername: 'admin-a', adminRole: 'super_admin' } }), {
    ownerRole: 'admin', ownerIdentifier: 'admin-a'
  });
});

test('save rejects unsupported experiments and malformed state before touching storage', async () => {
  let storageCalled = false;
  const originalSave = model.saveRun;
  model.saveRun = async () => { storageCalled = true; return 1; };
  try {
    const res = response();
    await controller.save({
      session: { registrationNumber: 'STO1-001A' },
      body: { title: 'Bad run', experimentKey: 'invented', version: 1, state: {} }
    }, res, assert.fail);
    assert.equal(res.statusCode, 400);
    assert.equal(storageCalled, false);
  } finally {
    model.saveRun = originalSave;
  }
});

test('save persists only versioned, bounded state for the authenticated owner', async () => {
  const originalSave = model.saveRun;
  let saved;
  model.saveRun = async (run) => { saved = run; return 43; };
  try {
    const state = simulation.makeState();
    const res = response();
    await controller.save({
      session: { registrationNumber: 'STO1-001A' },
      body: {
        title: 'My run', experimentKey: 'open-lab', version: 1,
        state, notebook: { hypothesis: 'Test', notes: '' }
      }
    }, res, assert.fail);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 43);
    assert.equal(saved.ownerIdentifier, 'STO1-001A');
    assert.equal(saved.experimentKey, 'open-lab');
  } finally {
    model.saveRun = originalSave;
  }
});

test('save accepts the ChemCollective glucose dilution practical', async () => {
  const originalSave = model.saveRun;
  model.saveRun = async () => 44;
  try {
    const state = simulation.makeState();
    state.experimentKey = 'glucose-dilution';
    const res = response();
    await controller.save({
      session: { registrationNumber: 'STO1-001A' },
      body: { title: 'Glucose dilution', experimentKey: 'glucose-dilution', version: 1, state }
    }, res, assert.fail);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 44);
  } finally {
    model.saveRun = originalSave;
  }
});

test('save accepts the ammonium sulfate preparation practical', async () => {
  const originalSave = model.saveRun;
  model.saveRun = async () => 45;
  try {
    const state = simulation.makeState();
    state.experimentKey = 'ammonium-sulfate-preparation';
    const res = response();
    await controller.save({
      session: { registrationNumber: 'STO1-001A' },
      body: {
        title: 'Ammonium sulfate preparation',
        experimentKey: 'ammonium-sulfate-preparation',
        version: 1,
        state
      }
    }, res, assert.fail);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.id, 45);
  } finally {
    model.saveRun = originalSave;
  }
});

test('JSON parser rejects oversized state', () => {
  assert.throws(() => controller.parseJsonField(' '.repeat(1024 * 1024 + 1), 'state'), /too large/);
});
