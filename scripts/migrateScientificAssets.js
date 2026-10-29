'use strict';

require('dotenv').config();
const pool = require('../config/database');

async function migrate() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS scientific_assets (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    asset_key VARCHAR(120) NOT NULL UNIQUE,
    name VARCHAR(180) NOT NULL,
    description TEXT NULL,
    subject VARCHAR(60) NOT NULL,
    category VARCHAR(80) NOT NULL,
    scientific_classification VARCHAR(180) NULL,
    model_format VARCHAR(20) NOT NULL,
    model_url TEXT NULL,
    storage_location VARCHAR(500) NULL,
    thumbnail_url TEXT NULL,
    source_institution VARCHAR(180) NULL,
    source_url TEXT NULL,
    source_record_id VARCHAR(180) NULL,
    author VARCHAR(255) NULL,
    license VARCHAR(180) NOT NULL DEFAULT 'Unknown - review required',
    attribution TEXT NULL,
    acquired_at DATETIME NULL,
    last_verified_at DATETIME NULL,
    scientific_references JSON NULL,
    dimensions JSON NULL,
    measurement_units JSON NULL,
    components JSON NULL,
    labels JSON NULL,
    supported_interactions JSON NULL,
    import_status ENUM('candidate','source_connected','imported_local','external_reference') NOT NULL DEFAULT 'candidate',
    validation_status ENUM('draft','needs_review','source_verified','verified','rejected') NOT NULL DEFAULT 'draft',
    is_public TINYINT(1) NOT NULL DEFAULT 0,
    created_by_role ENUM('student','tutor','admin','system') NOT NULL DEFAULT 'system',
    created_by_id VARCHAR(100) NOT NULL DEFAULT 'system',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_science_asset_subject_status (subject, validation_status, is_public),
    INDEX idx_science_asset_source_record (source_institution, source_record_id),
    INDEX idx_science_asset_owner (created_by_role, created_by_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const [importStatusColumn] = await pool.execute("SHOW COLUMNS FROM scientific_assets LIKE 'import_status'");
  if (!importStatusColumn.length) {
    await pool.execute(`ALTER TABLE scientific_assets
      ADD COLUMN import_status ENUM('candidate','source_connected','imported_local','external_reference') NOT NULL DEFAULT 'candidate'
      AFTER supported_interactions`);
  }

  // RCSB PDB 1CRN is the publicly available crambin structure. This status
  // indicates provenance was checked; it does not certify an anatomy model.
  await pool.execute(`INSERT INTO scientific_assets
    (asset_key, name, description, subject, category, scientific_classification,
     model_format, model_url, storage_location, source_institution, source_url,
     source_record_id, author, license, attribution, scientific_references,
     dimensions, measurement_units, components, labels, supported_interactions,
     import_status, validation_status, is_public, acquired_at, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'source_verified', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON DUPLICATE KEY UPDATE asset_key = VALUES(asset_key)`, [
      'rcsb-pdb-1crn', 'Crambin protein structure (PDB 1CRN)',
      'Experimental protein structure coordinates from the Protein Data Bank. Atom positions are structural data; the viewer does not claim clinical or anatomical validation.',
      'biology', 'protein structure', 'Protein: crambin; chain identifiers and residue records come from the source PDB file.',
      'pdb', '/api/science/assets/sources/rcsb/1CRN/file', 'remote', 'RCSB Protein Data Bank',
      'https://www.rcsb.org/structure/1CRN', '1CRN', 'Hendrickson and Teeter',
      'CC0 1.0 Universal (wwPDB archive data policy; check entry metadata for integrated third-party content)',
      'Structure coordinates: RCSB PDB entry 1CRN. Cite the entry and primary structure publication when reusing.',
      JSON.stringify(['Hendrickson WA, Teeter MM. Structure of the hydrophobic protein crambin determined directly from the anomalous scattering of sulphur. Nature. 1981;290:107-113.']),
      JSON.stringify({ coordinate_unit: 'angstrom', coordinate_source: 'PDB atom coordinate records' }),
      JSON.stringify({ length: 'angstrom', molecular_mass: 'dalton' }),
      JSON.stringify([{ id: 'chain-A', name: 'Chain A', kind: 'protein_chain', source_field: 'chain_id' }]),
      JSON.stringify([{ id: 'atom-serial', name: 'Atom serial', source_field: 'atom_serial' }, { id: 'residue-name', name: 'Residue', source_field: 'residue_name' }]),
      JSON.stringify(['rotate', 'zoom', 'pan', 'select-atom', 'select-residue', 'toggle-labels', 'reset-camera']),
      'source_connected'
    ]);

  const initialAssets = [
    {
      asset_key: 'cs-hardware-interior-photo',
      name: 'Desktop computer interior reference photograph',
      description: 'Static photograph of an Antec P180b desktop showing actual installed hardware. It is not an exploded view or 3D model and cannot expose hidden components.',
      subject: 'computer-science', category: 'hardware photograph', scientific_classification: 'Computer hardware: desktop assembly',
      model_format: 'jpg', model_url: '/images/hardware-interior-reference.jpg', storage_location: 'local:public/images/hardware-interior-reference.jpg',
      source_institution: 'Wikimedia Commons', source_url: 'https://commons.wikimedia.org/wiki/File:Computer_from_inside_018.jpg',
      source_record_id: 'Computer from inside 018.jpg', author: 'Kallerna', license: 'Public domain (worldwide release by author)',
      attribution: 'Kallerna, “Computer from inside 018.jpg”, Wikimedia Commons. Public domain; SCHOOL provides courtesy attribution.',
      scientific_references: [], dimensions: { width: 1415, height: 1337, unit: 'pixels' }, measurement_units: {},
      components: [{ id: 'motherboard', name: 'Motherboard', kind: 'photographed component' }, { id: 'ram', name: 'RAM modules', kind: 'photographed component' }, { id: 'graphics-card', name: 'Graphics card', kind: 'photographed component' }],
      labels: [{ id: 'photo-limit', name: 'Photograph only; hidden surfaces are not visible.' }],
      supported_interactions: ['rotate-image', 'zoom-image', 'pan-image'],
      import_status: 'imported_local', validation_status: 'source_verified', is_public: 1
    },
    {
      asset_key: 'chem-pubchem-water-962',
      name: 'Water molecule 3D conformer (PubChem CID 962)',
      description: 'PubChem source SDF conformer for H₂O. Atom coordinates and bonds are source-derived; rendered atom radii are display aids and not to scale. Contributor-specific reuse terms may apply.',
      subject: 'chemistry', category: 'molecular structure', scientific_classification: 'Water; H₂O',
      model_format: 'sdf', model_url: '/api/science/assets/sources/pubchem/962/sdf', storage_location: 'remote:PubChem PUG REST',
      source_institution: 'PubChem, National Center for Biotechnology Information (NCBI)', source_url: 'https://pubchem.ncbi.nlm.nih.gov/compound/962',
      source_record_id: 'CID 962', author: 'PubChem data contributors', license: 'Aggregated contributor data; check the record and contributor terms before redistribution.',
      attribution: 'PubChem Compound 962; data contributors and source record are linked.',
      scientific_references: ['PubChem PUG REST API: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest'],
      dimensions: { coordinate_unit: 'angstrom', source: 'PubChem 3D SDF conformer' }, measurement_units: { coordinate: 'angstrom' },
      components: [{ id: 'water-molecule', name: 'Water molecule', kind: 'source molecule' }],
      labels: [{ id: 'element-symbol', name: 'Element symbol' }, { id: 'bond-order', name: 'Source bond order' }],
      supported_interactions: ['rotate', 'zoom', 'pan', 'select-atom', 'toggle-labels'],
      import_status: 'source_connected', validation_status: 'source_verified', is_public: 1
    },
    {
      asset_key: 'physics-nist-codata',
      name: 'NIST CODATA fundamental physical constants',
      description: 'Authoritative reference values for constants; not a physical apparatus, exploded view, or measurement performed by this lab.',
      subject: 'physics', category: 'reference data', scientific_classification: 'CODATA 2022 recommended values',
      model_format: 'data', model_url: 'https://physics.nist.gov/cuu/Constants/index.html', storage_location: 'remote-reference',
      source_institution: 'National Institute of Standards and Technology (NIST)', source_url: 'https://physics.nist.gov/cuu/Constants/index.html',
      source_record_id: 'CODATA 2022', author: 'NIST',
      license: 'U.S. Government reference material; source-specific rights and notices apply.',
      attribution: 'National Institute of Standards and Technology, Fundamental Physical Constants.',
      scientific_references: ['https://physics.nist.gov/cuu/Constants/index.html'],
      dimensions: {}, measurement_units: {},
      components: [], labels: [{ id: 'value', name: 'Constant value' }, { id: 'uncertainty', name: 'Standard uncertainty where provided' }],
      supported_interactions: ['search-reference', 'open-source'],
      import_status: 'external_reference', validation_status: 'source_verified', is_public: 1
    },
    {
      asset_key: 'physics-roman-wfi-exploded-view',
      name: 'Roman Space Telescope Wide Field Instrument exploded-view diagram',
      description: 'Static source diagram includes the assembled Wide Field Instrument, a labelled exploded view, completed hardware photographs, and close-ups of optical elements. This is a licensed image, not separable 3D geometry; it does not support part selection or assembly animation.',
      subject: 'physics', category: 'optical instrument exploded-view image', scientific_classification: 'Nancy Grace Roman Space Telescope Wide Field Instrument',
      model_format: 'png', model_url: '/images/physics-roman-wide-field-instrument-exploded.png', storage_location: 'local:public/images/physics-roman-wide-field-instrument-exploded.png',
      source_institution: 'Wikimedia Commons; source paper in Journal of Astronomical Telescopes, Instruments, and Systems',
      source_url: 'https://commons.wikimedia.org/wiki/File:Wide_Field_Instrument_Exploded_View.png',
      source_record_id: 'Wide Field Instrument Exploded View.png', author: 'Benjamin Cromey',
      license: 'CC BY 4.0; attribution, license link, and indication of changes required.',
      attribution: 'Benjamin Cromey, “Wide Field Instrument Exploded View”, Wikimedia Commons, CC BY 4.0. No changes made. Source paper: Roman Wide Field Instrument Optomechanical Assembly performance summary, DOI 10.1117/1.JATIS.11.4.044001.',
      scientific_references: ['https://doi.org/10.1117/1.JATIS.11.4.044001'],
      dimensions: { width: 1551, height: 1158, unit: 'pixels', file_bytes: 1465376 }, measurement_units: {},
      components: [
        { id: 'radiator-panels', name: 'Radiator panels', kind: 'source-labelled assembly' },
        { id: 'focal-plane-electronics', name: 'Focal plane electronics', kind: 'source-labelled assembly' },
        { id: 'optical-bench', name: 'Optical bench', kind: 'source-labelled assembly' },
        { id: 'element-wheel-assembly', name: 'Element Wheel Assembly (EWA)', kind: 'source-labelled assembly' },
        { id: 'cold-optical-baffle-assembly', name: 'Cold Optical Baffle Assembly (COBA)', kind: 'source-labelled assembly' },
        { id: 'alignment-compensation-mechanism', name: 'Alignment Compensation Mechanism (ACM)', kind: 'source-labelled assembly' },
        { id: 'focal-plane-assembly', name: 'Focal Plane Assembly (FPA)', kind: 'source-labelled assembly' },
        { id: 'simplified-relative-calibration-system', name: 'Simplified Relative Calibration System (sRCS)', kind: 'source-labelled assembly' },
        { id: 'aperture-cover', name: 'Aperture cover', kind: 'source-labelled component' },
        { id: 'latch', name: 'Latch', kind: 'source-labelled component' }
      ],
      labels: [{ id: 'component-labels', name: 'Labels transcribed from the source image; retain EWA, COBA, ACM, FPA and sRCS abbreviations.' }],
      supported_interactions: ['rotate-image', 'zoom-image', 'pan-image'],
      import_status: 'imported_local', validation_status: 'source_verified', is_public: 1
    },
    {
      asset_key: 'geography-aster-dem',
      name: 'ASTER GDEM v3 elevation samples',
      description: 'The Geography Lab samples the real ASTER GDEM elevation source through Open Topo Data and renders a 10×10 preview. It is not a full-resolution 30 m mesh. Check ASTER downstream terms before redistribution.',
      subject: 'geography', category: 'elevation data', scientific_classification: 'ASTER Global Digital Elevation Model v3',
      model_format: 'data', model_url: 'https://www.opentopodata.org/datasets/aster/', storage_location: 'remote-reference',
      source_institution: 'Open Topo Data; underlying ASTER is a METI/NASA dataset', source_url: 'https://www.opentopodata.org/datasets/aster/',
      source_record_id: 'ASTER GDEM v3 (GDEM 003)', author: 'METI, Japan and NASA, United States',
      license: 'No downstream redistribution license asserted; use the live sampled service and check source terms.',
      attribution: 'Elevation samples from ASTER GDEM v3 via Open Topo Data; source data developed by METI and NASA.',
      scientific_references: ['https://www.opentopodata.org/api/'],
      dimensions: { preview_rows: 10, preview_columns: 10, nominal_source_resolution_m: 30 }, measurement_units: { elevation: 'metres' },
      components: [{ id: 'elevation-grid', name: 'Sampled elevation grid', kind: 'source data' }],
      labels: [{ id: 'elevation', name: 'Elevation (m)' }, { id: 'sample-position', name: 'Sample coordinate' }],
      supported_interactions: ['sample-current-map-area', 'rotate-rendered-surface', 'zoom-rendered-surface'],
      import_status: 'source_connected', validation_status: 'source_verified', is_public: 1
    },
    {
      asset_key: 'math-noaa-mauna-loa-co2',
      name: 'NOAA Mauna Loa monthly atmospheric CO₂',
      description: 'Observed monthly CO₂ at Mauna Loa Observatory, with a temporary nearby Maunakea measurement site during the 2022–2023 interruption. Not a global average. NOAA requests attribution.',
      subject: 'mathematics', category: 'observational time series', scientific_classification: 'Monthly mean CO₂ concentration',
      model_format: 'csv', model_url: 'https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.csv', storage_location: 'remote-reference',
      source_institution: 'NOAA Global Monitoring Laboratory', source_url: 'https://gml.noaa.gov/ccgg/trends/data.html',
      source_record_id: 'Mauna Loa monthly mean atmospheric CO₂', author: 'NOAA GML; pre-May 1974 measurements by Scripps Institution of Oceanography',
      license: 'Freely available for public and scientific use; provide NOAA attribution and consult source notes.',
      attribution: 'CO₂ observations from NOAA Global Monitoring Laboratory; measurements before May 1974 are from Scripps Institution of Oceanography.',
      scientific_references: ['https://gml.noaa.gov/ccgg/trends/data.html'],
      dimensions: { axes: ['decimal year', 'CO₂ concentration'] }, measurement_units: { x: 'decimal year', y: 'parts per million (ppm)' },
      components: [], labels: [{ id: 'decimal-year', name: 'Decimal year' }, { id: 'co2-ppm', name: 'Observed CO₂ (ppm)' }],
      supported_interactions: ['load-into-graphing-lab', 'plot', 'zoom', 'read-tabulated-values'],
      import_status: 'external_reference', validation_status: 'source_verified', is_public: 1
    },
    {
      asset_key: 'cs-sketchfab-motherboard-candidate',
      name: 'Motherboard + Components (download candidate)',
      description: 'Sketchfab creator describes an ASUS Z370-E motherboard, Intel i7-9700K, RAM and M.2 SSD. No archive was acquired; component hierarchy, accuracy and local viewer integration remain unverified.',
      subject: 'computer-science', category: '3D hardware model candidate', scientific_classification: 'Motherboard and installed components',
      model_format: 'glb', model_url: null, storage_location: 'external-candidate',
      source_institution: 'Sketchfab', source_url: 'https://sketchfab.com/3d-models/motherboard-components-3bc94057328243d4b341a55f59160f8a',
      source_record_id: '3bc94057328243d4b341a55f59160f8a', author: 'Daniel Cardona (DanielCardonaArt)',
      license: 'CC BY 4.0; attribution required; license shown on model page.',
      attribution: 'Daniel Cardona, “MotherBoard + Components”, Sketchfab, CC BY 4.0. No local copy.',
      scientific_references: [], dimensions: {}, measurement_units: {}, components: [],
      labels: [{ id: 'download-state', name: 'Sketchfab download endpoint returned HTTP 401 without authorized access.' }],
      supported_interactions: ['external-sketchfab-viewer-only'],
      import_status: 'candidate', validation_status: 'needs_review', is_public: 0
    }
  ];

  for (const asset of initialAssets) {
    await pool.execute(`INSERT INTO scientific_assets
      (asset_key, name, description, subject, category, scientific_classification,
       model_format, model_url, storage_location, source_institution, source_url,
       source_record_id, author, license, attribution, scientific_references,
       dimensions, measurement_units, components, labels, supported_interactions,
       import_status, validation_status, is_public, created_by_role, created_by_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'system', 'system')
      ON DUPLICATE KEY UPDATE asset_key = VALUES(asset_key)`, [
      asset.asset_key, asset.name, asset.description, asset.subject, asset.category, asset.scientific_classification,
      asset.model_format, asset.model_url, asset.storage_location, asset.source_institution, asset.source_url,
      asset.source_record_id, asset.author, asset.license, asset.attribution, JSON.stringify(asset.scientific_references),
      JSON.stringify(asset.dimensions), JSON.stringify(asset.measurement_units), JSON.stringify(asset.components),
      JSON.stringify(asset.labels), JSON.stringify(asset.supported_interactions), asset.import_status,
      asset.validation_status, asset.is_public
    ]);
  }
  await pool.execute("UPDATE scientific_assets SET import_status = 'source_connected' WHERE asset_key = 'rcsb-pdb-1crn' AND import_status = 'candidate'");

  console.log('Scientific asset registry migration complete.');
}

migrate().then(() => pool.end()).catch(async (error) => {
  console.error('Scientific asset migration failed:', error.message);
  await pool.end();
  process.exitCode = 1;
});
