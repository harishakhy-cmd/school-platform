'use strict';

const assetModel = require('../models/scientificAssetModel');

function viewer(req) {
  if (req.session.adminId) {
    const role = ['super_admin', 'ordinary_admin'].includes(req.session.adminRole) ? 'admin' : 'tutor';
    return { role, id: req.session.adminId };
  }
  return { role: 'student', id: req.session.registrationNumber };
}

function canManage(req, asset) {
  const user = viewer(req);
  return user.role === 'admin' || (asset.created_by_role === user.role && String(asset.created_by_id) === String(user.id));
}

function validExternalUrl(value, optional = true) {
  if (!value && optional) return true;
  try { return new URL(value).protocol === 'https:'; } catch (_) { return false; }
}

function validModelUrl(value, optional = true) {
  if (!value && optional) return true;
  if (typeof value === 'string' && value.startsWith('/')) {
    try {
      const parsed = new URL(value, 'https://school.invalid');
      return parsed.origin === 'https://school.invalid'
        && parsed.pathname.startsWith('/api/science/assets/sources/')
        && !parsed.pathname.includes('//');
    } catch (_) { return false; }
  }
  return validExternalUrl(value, optional);
}

function parseCollection(value, maxItems = 100) {
  if (value === undefined) return [];
  return Array.isArray(value) ? value.slice(0, maxItems) : null;
}

async function listAssets(req, res, next) {
  try {
    const user = viewer(req);
    const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 120) : '';
    const assets = await assetModel.list({
      query: q,
      subject: typeof req.query.subject === 'string' ? req.query.subject.slice(0, 60) : undefined,
      category: typeof req.query.category === 'string' ? req.query.category.slice(0, 80) : undefined,
      format: typeof req.query.format === 'string' ? req.query.format.slice(0, 20) : undefined,
      limit: req.query.limit,
      offset: req.query.offset,
      viewerRole: user.role,
      viewerId: user.id
    });
    res.json({ ok: true, assets });
  } catch (err) { next(err); }
}

async function getAsset(req, res, next) {
  try {
    const asset = await assetModel.findByKey(req.params.assetKey);
    if (!asset) return res.status(404).json({ ok: false, error: 'Scientific asset not found.' });
    const visible = asset.is_public && ['source_verified', 'verified'].includes(asset.validation_status);
    if (!visible && !canManage(req, asset)) return res.status(404).json({ ok: false, error: 'Scientific asset not found.' });
    res.json({ ok: true, asset });
  } catch (err) { next(err); }
}

async function createAsset(req, res, next) {
  try {
    const body = req.body || {};
    const assetKey = String(body.asset_key || '').trim().toLowerCase();
    const name = String(body.name || '').trim();
    const subject = String(body.subject || '').trim().toLowerCase();
    const category = String(body.category || '').trim();
    const format = String(body.model_format || '').trim().toLowerCase();
    const allowedFormats = ['glb', 'gltf', 'obj', 'stl', 'pdb', 'sdf', 'mol', 'png', 'jpg', 'jpeg', 'svg', 'csv', 'data'];
    if (!/^[a-z0-9][a-z0-9._-]{1,119}$/.test(assetKey) || !name || name.length > 180 || !subject || subject.length > 60 || !category || category.length > 80 || !allowedFormats.includes(format)) {
      return res.status(400).json({ ok: false, error: 'Provide a valid asset key, name, subject, category, and supported model format.' });
    }
    if (!validModelUrl(body.model_url) || !validExternalUrl(body.source_url) || !validExternalUrl(body.thumbnail_url)) {
      return res.status(400).json({ ok: false, error: 'Model URLs must use HTTPS or an approved same-origin source route; source and thumbnail URLs must use HTTPS.' });
    }
    const refs = parseCollection(body.scientific_references);
    const components = parseCollection(body.components);
    const labels = parseCollection(body.labels);
    const interactions = parseCollection(body.supported_interactions, 30);
    if (refs === null || components === null || labels === null || interactions === null) {
      return res.status(400).json({ ok: false, error: 'Scientific references, components, labels, and interactions must be bounded arrays.' });
    }
    const id = await assetModel.create({
      ...body, asset_key: assetKey, name, subject, category, model_format: format,
      scientific_references: refs, components, labels, supported_interactions: interactions
    }, viewer(req));
    res.status(201).json({ ok: true, id, validation_status: 'needs_review', message: 'Asset saved for scientific and license review.' });
  } catch (err) {
    if (err && err.code === 'ER_DUP_ENTRY') return res.status(409).json({ ok: false, error: 'That asset key is already registered.' });
    next(err);
  }
}

async function updateAsset(req, res, next) {
  try {
    const asset = await assetModel.findByKey(req.params.assetKey);
    if (!asset) return res.status(404).json({ ok: false, error: 'Scientific asset not found.' });
    if (!canManage(req, asset)) return res.status(403).json({ ok: false, error: 'You cannot edit this scientific asset.' });
    const changes = { ...(req.body || {}) };
    if (viewer(req).role !== 'admin') {
      delete changes.validation_status;
      delete changes.is_public;
      delete changes.import_status;
    }
    if (changes.validation_status && !['draft', 'needs_review', 'source_verified', 'verified', 'rejected'].includes(changes.validation_status)) {
      return res.status(400).json({ ok: false, error: 'Invalid asset validation status.' });
    }
    if (changes.import_status && !['candidate', 'source_connected', 'imported_local', 'external_reference'].includes(changes.import_status)) {
      return res.status(400).json({ ok: false, error: 'Invalid asset import status.' });
    }
    for (const key of ['model_url', 'source_url', 'thumbnail_url']) {
      if (Object.hasOwn(changes, key) && !(key === 'model_url' ? validModelUrl(changes[key]) : validExternalUrl(changes[key]))) {
        return res.status(400).json({ ok: false, error: `${key} must use HTTPS or a supported same-origin scientific source route.` });
      }
    }
    if (viewer(req).role === 'admin' && ['verified', 'source_verified'].includes(changes.validation_status)) {
      changes.last_verified_at = new Date();
    }
    for (const key of ['scientific_references', 'components', 'labels', 'supported_interactions']) {
      if (Object.hasOwn(changes, key) && (!Array.isArray(changes[key]) || changes[key].length > (key === 'supported_interactions' ? 30 : 100))) {
        return res.status(400).json({ ok: false, error: `${key} must be an array with a valid size.` });
      }
    }
    const updated = await assetModel.update(req.params.assetKey, changes);
    res.json({ ok: true, updated });
  } catch (err) { next(err); }
}

module.exports = { listAssets, getAsset, createAsset, updateAsset };
