'use strict';

const upstreamCache = new Map();
let nextPubChemRequestAt = 0;
let nextElevationRequestAt = 0;
let elevationDailyCount = 0;
let elevationCountDay = '';

async function fetchTextCached(url, ttlMs = 60 * 60 * 1000) {
  const hit = upstreamCache.get(url);
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const response = await fetch(url, { signal: AbortSignal.timeout(12000), headers: { 'User-Agent': 'CBT-Scientific-Labs/1.0 (educational data client)' } });
  if (!response.ok) throw Object.assign(new Error(`Scientific source responded with HTTP ${response.status}.`), { status: response.status });
  const text = await response.text();
  if (text.length > 3_000_000) throw Object.assign(new Error('Scientific source response exceeded the size limit.'), { status: 502 });
  if (upstreamCache.size > 200) {
    for (const [key, value] of upstreamCache) if (value.expiresAt < Date.now()) upstreamCache.delete(key);
    while (upstreamCache.size > 180) upstreamCache.delete(upstreamCache.keys().next().value);
  }
  upstreamCache.set(url, { value: text, expiresAt: Date.now() + ttlMs });
  return text;
}

async function fetchPubChemText(url) {
  const wait = Math.max(0, nextPubChemRequestAt - Date.now());
  if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
  nextPubChemRequestAt = Date.now() + 250; // PUG REST asks clients to stay at or below 5 requests/second.
  return fetchTextCached(url, 6 * 60 * 60 * 1000);
}

async function rcsbFile(req, res) {
  const pdbId = String(req.params.pdbId || '').toUpperCase();
  if (!/^[0-9][A-Z0-9]{3}$/.test(pdbId)) return res.status(400).json({ ok: false, error: 'Invalid PDB entry identifier.' });
  try {
    const pdb = await fetchTextCached(`https://files.rcsb.org/download/${pdbId}.pdb`, 24 * 60 * 60 * 1000);
    if (!pdb.startsWith('HEADER') && !pdb.includes('\nATOM  ') && !pdb.startsWith('ATOM  ')) {
      return res.status(502).json({ ok: false, error: 'The source response was not a PDB coordinate file.' });
    }
    res.type('text/plain').set('Cache-Control', 'private, max-age=3600').send(pdb);
  } catch (err) {
    res.status(err.status || 502).json({ ok: false, error: 'RCSB PDB is unavailable right now.', detail: err.message });
  }
}

async function noaaMaunaLoaCo2(req, res) {
  try {
    const csv = await fetchTextCached('https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv', 24 * 60 * 60 * 1000);
    const points = csv.split(/\r?\n/).filter((line) => line && !line.startsWith('#')).slice(1).map((line) => {
      const columns = line.split(',');
      const year = Number(columns[0]);
      const decimalYear = Number(columns[2]);
      const co2Ppm = Number(columns[3]);
      return Number.isFinite(year) && Number.isFinite(decimalYear) && Number.isFinite(co2Ppm) && co2Ppm > 0
        ? { year, decimalYear, co2Ppm }
        : null;
    }).filter(Boolean);
    if (!points.length) return res.status(502).json({ ok: false, error: 'NOAA returned no valid monthly CO₂ observations.' });
    res.json({
      ok: true,
      dataset: {
        points,
        firstYear: points[0].year,
        lastYear: points[points.length - 1].year,
        provenance: {
          institution: 'NOAA Global Monitoring Laboratory',
          record_id: 'Mauna Loa monthly mean atmospheric CO₂',
          source_url: 'https://gml.noaa.gov/ccgg/trends/data.html',
          attribution: 'CO₂ observations from NOAA Global Monitoring Laboratory; measurements before May 1974 are from Scripps Institution of Oceanography.',
          units: 'parts per million (ppm)',
          limitation: 'Monthly means are observations from Mauna Loa Observatory, with a temporary nearby Maunakea site during the 2022–2023 volcanic eruption interruption. This is not a global average.'
        }
      }
    });
  } catch (err) {
    res.status(err.status || 502).json({ ok: false, error: 'NOAA CO₂ observations are temporarily unavailable.', detail: err.message });
  }
}

async function pubchemCompound(req, res) {
  const identifier = String(req.params.identifier || '').trim();
  if (!identifier || identifier.length > 100 || /[\\/?#]/.test(identifier)) {
    return res.status(400).json({ ok: false, error: 'Provide a compound name or CID (up to 100 characters).' });
  }
  try {
    const numericCid = /^\d+$/.test(identifier);
    let cid = numericCid ? identifier : null;
    if (!cid) {
      const lookupUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(identifier)}/cids/JSON`;
      const lookup = JSON.parse(await fetchPubChemText(lookupUrl));
      cid = String(lookup.IdentifierList?.CID?.[0] || '');
      if (!cid) return res.status(404).json({ ok: false, error: 'PubChem did not find this compound name.' });
    }
    const root = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${encodeURIComponent(cid)}`;
    const propertiesUrl = `${root}/property/IUPACName,MolecularFormula,MolecularWeight,ConnectivitySMILES,InChIKey/JSON`;
    const propertyData = JSON.parse(await fetchPubChemText(propertiesUrl));
    const properties = propertyData.PropertyTable?.Properties?.[0];
    if (!properties) return res.status(404).json({ ok: false, error: 'PubChem has no property record for this compound.' });
    let sdf = null;
    let modelWarning = null;
    try { sdf = await fetchPubChemText(`${root}/SDF?record_type=3d`); }
    catch (err) { modelWarning = 'PubChem has no 3D conformer available for this record, or the structure service is temporarily unavailable.'; }
    res.json({
      ok: true,
      compound: {
        cid: Number(cid), name: properties.IUPACName || identifier,
        formula: properties.MolecularFormula || null,
        molecular_weight_g_mol: properties.MolecularWeight ?? null,
        smiles: properties.ConnectivitySMILES || properties.CanonicalSMILES || null,
        inchikey: properties.InChIKey || null,
        model_format: 'sdf', model_source: sdf ? 'PubChem 3D conformer' : null,
        model_status: sdf ? 'source_conformer' : 'unavailable', sdf, warning: modelWarning,
        provenance: {
          institution: 'PubChem, National Center for Biotechnology Information (NCBI)',
          record_id: `CID ${cid}`,
          source_url: `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}`,
          data_license: 'PubChem data are aggregated from contributors; consult the record and source-specific terms before redistribution.',
          attribution: `PubChem Compound ${cid}; data contributors and record details are listed on the source page.`
        }
      }
    });
  } catch (err) {
    const status = err.status === 404 ? 404 : 502;
    res.status(status).json({ ok: false, error: 'PubChem is unavailable or returned an unrecognized response.', detail: err.message });
  }
}

async function pubchemSdf(req, res) {
  const cid = String(req.params.identifier || '').trim();
  if (!/^[1-9]\d{0,11}$/.test(cid)) return res.status(400).json({ ok: false, error: 'Provide a valid PubChem compound CID.' });
  try {
    const sdf = await fetchPubChemText(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`);
    if (!new RegExp(`^${cid}\\r?\\n`).test(sdf) || !/\r?\nM  END(?:\r?\n|$)/.test(sdf)) {
      return res.status(502).json({ ok: false, error: 'PubChem did not return a valid SDF 3D conformer.' });
    }
    res.type('text/plain').set('Cache-Control', 'private, max-age=3600').send(sdf);
  } catch (err) {
    res.status(err.status || 502).json({ ok: false, error: 'PubChem 3D structure is unavailable right now.', detail: err.message });
  }
}

async function elevationGrid(req, res) {
  const lat = Number(req.query.lat); const lng = Number(req.query.lng); const span = Number(req.query.span || 0.2);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(span) || lat < -83 || lat > 83 || lng < -180 || lng > 180 || span < 0.02 || span > 2) {
    return res.status(400).json({ ok: false, error: 'Choose a map center within ASTER coverage (83°S–83°N) and an extent from 0.02° to 2°.' });
  }
  const today = new Date().toISOString().slice(0, 10);
  if (today !== elevationCountDay) { elevationCountDay = today; elevationDailyCount = 0; }
  if (elevationDailyCount >= 800) return res.status(429).json({ ok: false, error: 'The daily terrain lookup budget is reached. Try again tomorrow or configure an approved elevation service.' });
  const rows = 10; const columns = 10;
  const south = lat - span / 2; const north = lat + span / 2;
  const west = lng - span / 2; const east = lng + span / 2;
  if (south < -83 || north > 83) return res.status(400).json({ ok: false, error: 'This terrain window extends beyond ASTER GDEM latitude coverage.' });
  const locations = [];
  for (let row = 0; row < rows; row++) {
    const sampleLat = north - (north - south) * row / (rows - 1);
    for (let col = 0; col < columns; col++) {
      const sampleLng = west + (east - west) * col / (columns - 1);
      locations.push(`${sampleLat.toFixed(6)},${sampleLng.toFixed(6)}`);
    }
  }
  try {
    const wait = Math.max(0, nextElevationRequestAt - Date.now());
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    nextElevationRequestAt = Date.now() + 1000;
    elevationDailyCount += 1;
    const url = `https://api.opentopodata.org/v1/aster30m?locations=${encodeURIComponent(locations.join('|'))}&interpolation=bilinear`;
    const upstream = JSON.parse(await fetchTextCached(url, 24 * 60 * 60 * 1000));
    if (upstream.status !== 'OK' || !Array.isArray(upstream.results) || upstream.results.length !== rows * columns) {
      return res.status(502).json({ ok: false, error: 'The elevation source returned an incomplete terrain grid.' });
    }
    res.json({
      ok: true,
      grid: {
        rows, columns, bounds: { south, north, west, east },
        elevations_m: upstream.results.map((point) => point.elevation == null ? null : Number(point.elevation)),
        dataset: 'ASTER GDEM v3 (GDEM 003)', sampleSpacingDegrees: { latitude: span / (rows - 1), longitude: span / (columns - 1) },
        requestedAt: new Date().toISOString(),
        provenance: {
          provider: 'Open Topo Data public elevation API',
          datasetSource: 'ASTER: METI, Japan and NASA, United States',
          sourceUrl: 'https://www.opentopodata.org/datasets/aster/',
          apiUrl: 'https://www.opentopodata.org/api/',
          license: 'ASTER source data terms should be checked for downstream redistribution. Elevations are returned as sampled source values; no ownership or extra license is asserted here.',
          attribution: 'Elevation samples from ASTER GDEM version 3 via Open Topo Data; nominal source resolution about 30 m at the equator. The rendered 10 × 10 preview is more widely spaced than the underlying DEM.'
        }
      }
    });
  } catch (err) {
    res.status(err.status || 502).json({ ok: false, error: 'Real elevation data is temporarily unavailable. Existing illustrative landform models remain available.', detail: err.message });
  }
}

module.exports = { rcsbFile, noaaMaunaLoaCo2, pubchemCompound, pubchemSdf, elevationGrid, _fetchTextCached: fetchTextCached };
