'use strict';

const model = require('../models/chemistryLabModel');
const simulation = require('../public/js/chemistry-simulation');
const SIMULATION_VERSION = 1;
const MAX_JSON_LENGTH = 64 * 1024;
const EXPERIMENT_KEYS = new Set([
  'open-lab', 'acid-base-neutralisation', 'precipitation',
  'solution-from-solid', 'dilution', 'glucose-dilution',
  'ammonium-sulfate-preparation'
]);

function owner(req) {
  if (req.session.registrationNumber) {
    return { ownerRole: 'student', ownerIdentifier: req.session.registrationNumber };
  }
  if (req.session.adminId) {
    return {
      ownerRole: req.session.adminRole === 'tutor' ? 'tutor' : 'admin',
      ownerIdentifier: req.session.adminUsername || `admin-${req.session.adminId}`
    };
  }
  return null;
}

function parseJsonField(value, label) {
  if (typeof value !== 'string') {
    const serialized = JSON.stringify(value);
    if (serialized.length > MAX_JSON_LENGTH) throw new RangeError(`${label} is too large.`);
    return value;
  }
  if (value.length > MAX_JSON_LENGTH) throw new RangeError(`${label} is too large.`);
  try {
    return JSON.parse(value);
  } catch {
    throw new TypeError(`${label} must contain valid JSON.`);
  }
}

async function list(req, res, next) {
  try {
    const user = owner(req);
    res.json({ success: true, runs: await model.listRuns(user.ownerRole, user.ownerIdentifier) });
  } catch (error) {
    next(error);
  }
}

async function get(req, res, next) {
  try {
    const user = owner(req);
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid experiment id.' });
    const run = await model.findRun(id, user.ownerRole, user.ownerIdentifier);
    if (!run) return res.status(404).json({ error: 'Experiment not found.' });
    res.json({ success: true, run });
  } catch (error) {
    next(error);
  }
}

async function save(req, res, next) {
  try {
    const user = owner(req);
    const { title, experimentKey, version, id } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 255) {
      return res.status(400).json({ error: 'Title must contain 1-255 characters.' });
    }
    if (!EXPERIMENT_KEYS.has(experimentKey)) return res.status(400).json({ error: 'Unsupported experiment type.' });
    if (version !== SIMULATION_VERSION) return res.status(400).json({ error: 'This simulation version is no longer supported.' });
    const state = parseJsonField(req.body.state, 'Experiment state');
    const notebook = parseJsonField(req.body.notebook || {}, 'Notebook');
    try {
      simulation.validateState(state);
    } catch (error) {
      return res.status(400).json({ error: `Experiment state is invalid: ${error.message}` });
    }
    if (state.experimentKey !== experimentKey) {
      return res.status(400).json({ error: 'Experiment state and run type do not match.' });
    }
    if (!notebook || typeof notebook !== 'object' || Array.isArray(notebook)) {
      return res.status(400).json({ error: 'Notebook must be an object.' });
    }
    const run = {
      ownerRole: user.ownerRole,
      ownerIdentifier: user.ownerIdentifier,
      title: title.trim(),
      experimentKey,
      version,
      state,
      notebook
    };
    if (id !== undefined && id !== null) {
      const runId = Number(id);
      if (!Number.isSafeInteger(runId) || runId < 1) return res.status(400).json({ error: 'Invalid experiment id.' });
      if (!await model.updateRun(runId, run)) return res.status(404).json({ error: 'Experiment not found.' });
      return res.json({ success: true, id: runId });
    }
    const runId = await model.saveRun(run);
    res.status(201).json({ success: true, id: runId });
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
}

module.exports = { list, get, save, owner, parseJsonField };
