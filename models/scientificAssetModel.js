'use strict';

const pool = require('../config/database');

const SELECT_COLUMNS = `id, asset_key, name, description, subject, category,
  scientific_classification, model_format, model_url, storage_location, thumbnail_url,
  source_institution, source_url, source_record_id, author, license, attribution,
  acquired_at, last_verified_at, scientific_references, dimensions, measurement_units,
  components, labels, supported_interactions, import_status, validation_status, is_public,
  created_by_role, created_by_id, created_at, updated_at`;

function parseJsonFields(asset) {
  if (!asset) return asset;
  for (const field of ['scientific_references', 'dimensions', 'components', 'labels', 'supported_interactions']) {
    if (typeof asset[field] === 'string') {
      try { asset[field] = JSON.parse(asset[field]); } catch (_) { asset[field] = []; }
    }
  }
  return asset;
}

async function list({ query, subject, category, format, limit = 60, offset = 0, viewerRole, viewerId }) {
  const clauses = [];
  const values = [];
  if (query) {
    clauses.push('(name LIKE ? OR description LIKE ? OR scientific_classification LIKE ? OR source_record_id LIKE ?)');
    const term = `%${query}%`;
    values.push(term, term, term, term);
  }
  if (subject) { clauses.push('subject = ?'); values.push(subject); }
  if (category) { clauses.push('category = ?'); values.push(category); }
  if (format) { clauses.push('model_format = ?'); values.push(format); }
  if (viewerRole === 'admin') {
    // Staff curators can inspect all records.
  } else {
    clauses.push('(is_public = 1 AND validation_status IN (\'source_verified\', \'verified\') OR (created_by_role = ? AND created_by_id = ?))');
    values.push(viewerRole || '', String(viewerId || ''));
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT ${SELECT_COLUMNS} FROM scientific_assets ${where} ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...values, Math.max(1, Math.min(100, Number(limit) || 60)), Math.max(0, Number(offset) || 0)]
  );
  return rows.map(parseJsonFields);
}

async function findByKey(key) {
  const [rows] = await pool.execute(`SELECT ${SELECT_COLUMNS} FROM scientific_assets WHERE asset_key = ? LIMIT 1`, [key]);
  return parseJsonFields(rows[0]);
}

async function create(asset, creator) {
  const [result] = await pool.execute(
    `INSERT INTO scientific_assets
      (asset_key, name, description, subject, category, scientific_classification,
       model_format, model_url, storage_location, thumbnail_url, source_institution,
       source_url, source_record_id, author, license, attribution, scientific_references,
       dimensions, measurement_units, components, labels, supported_interactions,
       import_status, validation_status, is_public, created_by_role, created_by_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [asset.asset_key, asset.name, asset.description || null, asset.subject, asset.category,
      asset.scientific_classification || null, asset.model_format, asset.model_url || null,
      asset.storage_location || 'remote', asset.thumbnail_url || null, asset.source_institution || null,
      asset.source_url || null, asset.source_record_id || null, asset.author || null,
      asset.license || 'Unknown - review required', asset.attribution || null,
      JSON.stringify(asset.scientific_references || []), JSON.stringify(asset.dimensions || {}),
      JSON.stringify(asset.measurement_units || {}), JSON.stringify(asset.components || []),
      JSON.stringify(asset.labels || []), JSON.stringify(asset.supported_interactions || []),
      'candidate',
      creator.role === 'admin' && asset.validation_status === 'verified' ? 'verified' : 'needs_review',
      creator.role === 'admin' && asset.is_public ? 1 : 0, creator.role, String(creator.id)]
  );
  return result.insertId;
}

async function update(key, changes) {
  const fields = [];
  const values = [];
  const allowed = {
    name: 'name', description: 'description', subject: 'subject', category: 'category',
    scientific_classification: 'scientific_classification', model_format: 'model_format',
    model_url: 'model_url', thumbnail_url: 'thumbnail_url', source_institution: 'source_institution',
    source_url: 'source_url', source_record_id: 'source_record_id', author: 'author', license: 'license',
    attribution: 'attribution', validation_status: 'validation_status', is_public: 'is_public',
    last_verified_at: 'last_verified_at', import_status: 'import_status'
  };
  const jsonFields = ['scientific_references', 'dimensions', 'measurement_units', 'components', 'labels', 'supported_interactions'];
  for (const [input, column] of Object.entries(allowed)) {
    if (Object.hasOwn(changes, input)) { fields.push(`${column} = ?`); values.push(input === 'is_public' ? Number(!!changes[input]) : changes[input]); }
  }
  for (const field of jsonFields) {
    if (Object.hasOwn(changes, field)) { fields.push(`${field} = ?`); values.push(JSON.stringify(changes[field])); }
  }
  if (!fields.length) return false;
  const [result] = await pool.execute(`UPDATE scientific_assets SET ${fields.join(', ')} WHERE asset_key = ?`, [...values, key]);
  return result.affectedRows > 0;
}

module.exports = { list, findByKey, create, update, parseJsonFields };
