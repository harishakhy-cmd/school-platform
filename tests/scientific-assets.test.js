'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const calculations = require('../public/js/scientific-calculations');
const structures = require('../public/js/scientific-structure-parser');
const sources = require('../controllers/scientificSourceController');
const assetModel = require('../models/scientificAssetModel');
const assetController = require('../controllers/scientificAssetController');

test('scientific unit conversions preserve scale and temperature offsets', () => {
  assert.equal(calculations.convert(100, 'cm', 'm'), 1);
  assert.ok(Math.abs(calculations.convert(1, 'L', 'cm3') - 1000) < 1e-9);
  assert.equal(calculations.convert(0, 'C', 'F'), 32);
  assert.equal(calculations.convert(1, 'atm', 'Pa'), 101325);
  assert.throws(() => calculations.convert(1, 'kg', 'm'), /Cannot convert/);
});

test('container volume follows actual fill height for nonuniform vessels', () => {
  assert.equal(calculations.liquidVolumeAtFill(100, 'cylinder', 50), 50);
  assert.equal(calculations.liquidVolumeAtFill(100, 'cone', 50), 87.5);
  assert.equal(calculations.liquidVolumeAtFill(100, 'hemisphere', 50), 68.75);
  assert.equal(calculations.liquidVolumeAtFill(100, 'hemisphere', 0), 0);
  assert.equal(calculations.liquidVolumeAtFill(100, 'hemisphere', 100), 100);
});

test('molar concentration uses mass, molar mass, and final volume', () => {
  assert.ok(Math.abs(calculations.molarConcentration(5, 0.25, 180.16) - 0.1110124) < 1e-6);
  assert.throws(() => calculations.molarConcentration(1, 0, 10), /positive/);
});

test('uncertainty scales with a unit conversion magnitude', () => {
  assert.deepEqual(calculations.propagatedUncertainty(2, 0.1, 100), { value: 200, uncertainty: 10 });
});

test('PDB coordinate parser keeps source residue labels and coordinate units', () => {
  const atomLine = (serial, atomName, residue, chain, residueNumber, x, element) =>
    `ATOM  ${String(serial).padStart(5)} ${atomName.padStart(4)} ${residue.padStart(3)} ${chain}${String(residueNumber).padStart(4)}    ${x.toFixed(3).padStart(8)}${'0.000'.padStart(8)}${'0.000'.padStart(8)}  1.00 20.00          ${element.padStart(2)}`;
  const parsed = structures.parsePdb([
    atomLine(1, 'CA', 'GLY', 'A', 1, 0, 'C'),
    atomLine(2, 'C', 'GLY', 'A', 1, 1.4, 'C'),
    atomLine(3, 'N', 'ALA', 'A', 2, 2.7, 'N')
  ].join('\n'));
  assert.equal(parsed.atoms.length, 3);
  assert.equal(parsed.components.length, 2);
  assert.equal(parsed.components[0].name, 'GLY 1 · chain A');
  assert.equal(parsed.atoms[1].x, 1.4);
  assert.ok(parsed.bonds.length >= 2);
  assert.match(parsed.bondSource, /inferred/);
});

test('SDF parser respects atom and bond records and rejects malformed input', () => {
  const sdf = [
    'Ethanol', '  PubChem', '', '  2  1  0  0  0  0            999 V2000',
    '    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0',
    '    1.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0',
    '  1  2  1  0  0  0  0', 'M  END', '$$$$'
  ].join('\n');
  const parsed = structures.parseSdf(sdf);
  assert.deepEqual(parsed.bonds, [[0, 1]]);
  assert.equal(parsed.bondSource, 'source SDF bond records');
  assert.equal(parsed.atoms[1].element, 'O');
  assert.throws(() => structures.parseSdf('bad'), /counts/);
});

test('asset detail permissions hide private drafts from students and permit their owner', async () => {
  const originalFind = assetModel.findByKey;
  const asset = { asset_key: 'tutor-draft', is_public: 0, validation_status: 'needs_review', created_by_role: 'tutor', created_by_id: '41' };
  assetModel.findByKey = async () => asset;
  const makeResponse = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
  try {
    const studentResponse = makeResponse();
    await assetController.getAsset({ params: { assetKey: 'tutor-draft' }, session: { registrationNumber: 'STU-1' } }, studentResponse, (error) => { throw error; });
    assert.equal(studentResponse.statusCode, 404);
    const ownerResponse = makeResponse();
    await assetController.getAsset({ params: { assetKey: 'tutor-draft' }, session: { adminId: 41, adminRole: 'tutor' } }, ownerResponse, (error) => { throw error; });
    assert.equal(ownerResponse.statusCode, 200);
    assert.equal(ownerResponse.body.asset.asset_key, 'tutor-draft');
  } finally { assetModel.findByKey = originalFind; }
});

test('administrator can mark source provenance reviewed before scientific validation', async () => {
  const originalFind = assetModel.findByKey;
  const originalUpdate = assetModel.update;
  assetModel.findByKey = async () => ({
    asset_key: 'source-reviewed-model', is_public: 0, validation_status: 'needs_review',
    created_by_role: 'tutor', created_by_id: '41'
  });
  let updatedChanges;
  assetModel.update = async (key, changes) => {
    assert.equal(key, 'source-reviewed-model');
    updatedChanges = changes;
    return true;
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  try {
    await assetController.updateAsset({
      params: { assetKey: 'source-reviewed-model' },
      body: { validation_status: 'source_verified', is_public: true },
      session: { adminId: 9, adminRole: 'ordinary_admin' }
    }, response, (error) => { throw error; });
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.updated, true);
    assert.equal(updatedChanges.validation_status, 'source_verified');
    assert.equal(updatedChanges.is_public, true);
    assert.ok(updatedChanges.last_verified_at instanceof Date);
  } finally {
    assetModel.findByKey = originalFind;
    assetModel.update = originalUpdate;
  }
});

test('asset registration accepts only approved same-origin source routes for models', async () => {
  const originalCreate = assetModel.create;
  let savedAsset;
  assetModel.create = async (asset) => { savedAsset = asset; return 17; };
  const makeResponse = () => ({
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  });
  const request = {
    body: {
      asset_key: 'pubchem-water-test', name: 'Water source structure', subject: 'chemistry',
      category: 'molecular structure', model_format: 'sdf',
      model_url: '/api/science/assets/sources/pubchem/962/sdf',
      source_url: 'https://pubchem.ncbi.nlm.nih.gov/compound/962'
    },
    session: { adminId: 12, adminRole: 'super_admin' }
  };
  try {
    const accepted = makeResponse();
    await assetController.createAsset(request, accepted, (error) => { throw error; });
    assert.equal(accepted.statusCode, 201);
    assert.equal(savedAsset.model_url, request.body.model_url);

    const rejected = makeResponse();
    await assetController.createAsset({
      ...request,
      body: { ...request.body, asset_key: 'unsafe-model-url', model_url: '//example.com/asset.sdf' }
    }, rejected, (error) => { throw error; });
    assert.equal(rejected.statusCode, 400);
  } finally { assetModel.create = originalCreate; }
});

test('PubChem proxy returns upstream properties, 3D SDF, and provenance', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (url) => {
    requests.push(String(url));
    const body = String(url).includes('/property/')
      ? JSON.stringify({ PropertyTable: { Properties: [{ CID: 87241634, IUPACName: 'test compound', MolecularFormula: 'C2H6O', MolecularWeight: 46.069, ConnectivitySMILES: 'CCO', InChIKey: 'TEST' }] } })
      : 'Test compound\n  PubChem\n\n  2  1  0  0  0  0            999 V2000\n    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0\n    1.5000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0\n  1  2  1  0  0  0  0\nM  END\n$$$$';
    return { ok: true, status: 200, text: async () => body };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  try {
    await sources.pubchemCompound({ params: { identifier: '87241634' } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.compound.cid, 87241634);
    assert.equal(response.body.compound.formula, 'C2H6O');
    assert.match(response.body.compound.sdf, /V2000/);
    assert.equal(response.body.compound.provenance.institution, 'PubChem, National Center for Biotechnology Information (NCBI)');
    assert.equal(requests.length, 2);
  } finally { global.fetch = originalFetch; }
});

test('PubChem SDF asset endpoint validates CID and serves source 3D coordinates', async () => {
  const originalFetch = global.fetch;
  const requests = [];
  global.fetch = async (url) => {
    requests.push(String(url));
    return {
      ok: true, status: 200,
      text: async () => '962\n  PubChem\n\n  1  0  0  0  0  0            999 V2000\n    0.0000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0\nM  END\n$$$$'
    };
  };
  const makeResponse = () => ({
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    type(value) { this.contentType = value; return this; },
    set(name, value) { this.headers = { ...(this.headers || {}), [name]: value }; return this; },
    send(body) { this.body = body; return this; },
    json(body) { this.body = body; return this; }
  });
  try {
    const invalid = makeResponse();
    await sources.pubchemSdf({ params: { identifier: '../962' } }, invalid);
    assert.equal(invalid.statusCode, 400);
    assert.equal(requests.length, 0);

    const response = makeResponse();
    await sources.pubchemSdf({ params: { identifier: '962' } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.contentType, 'text/plain');
    assert.match(response.body, /V2000/);
    assert.match(response.headers['Cache-Control'], /max-age=3600/);
    assert.match(requests[0], /cid\/962\/SDF\?record_type=3d/);
  } finally { global.fetch = originalFetch; }
});

test('NOAA CO2 proxy returns valid monthly observations and source caveat', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => '# source note\n# another comment\nyear,month,decimal date,average,deseasonalized,ndays,sdev,unc\n2023,1,2023.041,419.31,418.2,31,0.2,0.1\n2023,2,2023.12,-99.99,-99.99,-1,-9.99,-0.99\n2023,3,2023.2,420.0,419.0,30,0.2,0.1'
  });
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  try {
    await sources.noaaMaunaLoaCo2({}, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.dataset.points.length, 2);
    assert.deepEqual(response.body.dataset.points[0], { year: 2023, decimalYear: 2023.041, co2Ppm: 419.31 });
    assert.match(response.body.dataset.provenance.limitation, /not a global average/);
    assert.match(response.body.dataset.provenance.attribution, /Scripps Institution/);
  } finally { global.fetch = originalFetch; }
});

test('ASTER terrain endpoint requests a bounded 10 by 10 real elevation grid', async () => {
  const originalFetch = global.fetch;
  let requestUrl = '';
  global.fetch = async (url) => {
    requestUrl = String(url);
    const grid = Array.from({ length: 100 }, (_, index) => ({ elevation: 900 + index, location: { lat: 0, lng: 32 }, dataset: 'aster30m' }));
    return { ok: true, status: 200, text: async () => JSON.stringify({ status: 'OK', results: grid }) };
  };
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
  try {
    await sources.elevationGrid({ query: { lat: '0.123', lng: '32.21', span: '0.02' } }, response);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.grid.elevations_m.length, 100);
    assert.equal(response.body.grid.rows, 10);
    assert.match(response.body.grid.dataset, /ASTER GDEM v3/);
    assert.match(requestUrl, /api\.opentopodata\.org\/v1\/aster30m/);
  } finally { global.fetch = originalFetch; }
});
