(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ScientificStructureParser = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const radii = { H: 0.31, C: 0.76, N: 0.71, O: 0.66, S: 1.05, P: 1.07, F: 0.57, CL: 1.02 };

  function parsePdb(text) {
    const atoms = []; const explicitBonds = []; const serialToIndex = new Map();
    for (const line of text.split(/\r?\n/)) {
      const record = line.slice(0, 6).trim();
      if (record === 'ATOM' || record === 'HETATM') {
        const alt = line.slice(16, 17).trim(); if (alt && alt !== 'A') continue;
        const element = (line.slice(76, 78).trim() || line.slice(12, 14).trim().replace(/[^A-Za-z]/g, '')).toUpperCase();
        const serial = Number(line.slice(6, 11));
        const atom = { index: atoms.length, serial, name: line.slice(12, 16).trim(), element,
          residue: line.slice(17, 20).trim(), chain: line.slice(21, 22).trim() || '∅',
          residueNumber: line.slice(22, 26).trim(), insertion: line.slice(26, 27).trim(),
          x: Number(line.slice(30, 38)), y: Number(line.slice(38, 46)), z: Number(line.slice(46, 54)), visible: true };
        if (!Number.isFinite(atom.x + atom.y + atom.z) || !atom.element) continue;
        atom.componentId = `${atom.chain}:${atom.residueNumber}${atom.insertion}`;
        atom.componentName = `${atom.residue} ${atom.residueNumber}${atom.insertion} · chain ${atom.chain}`;
        serialToIndex.set(serial, atom.index); atoms.push(atom);
        if (atoms.length > 15000) throw new Error('PDB coordinate file exceeds the 15,000 atom rendering limit.');
      } else if (record === 'CONECT') {
        const from = Number(line.slice(6, 11));
        for (let p = 11; p + 5 <= line.length; p += 5) {
          const to = Number(line.slice(p, p + 5));
          if (from && to && from !== to) explicitBonds.push([from, to]);
        }
      }
    }
    const byComponent = new Map();
    atoms.forEach((atom) => {
      if (!byComponent.has(atom.componentId)) byComponent.set(atom.componentId, { id: atom.componentId, name: atom.componentName, atoms: [] });
      byComponent.get(atom.componentId).atoms.push(atom);
    });
    const bonds = explicitBonds.map(([a, b]) => [serialToIndex.get(a), serialToIndex.get(b)]).filter(([a, b]) => a !== undefined && b !== undefined);
    const bondSource = bonds.length ? 'source CONECT records' : 'distance-inferred covalent links';
    if (!bonds.length) inferPdbBonds(atoms, bonds);
    return { atoms, bonds, components: [...byComponent.values()], bondSource };
  }

  function inferPdbBonds(atoms, out) {
    const cells = new Map(); const cellSize = 2.4;
    const keyFor = (x, y, z) => `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)},${Math.floor(z / cellSize)}`;
    atoms.forEach((atom, index) => {
      const key = keyFor(atom.x, atom.y, atom.z); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(index);
    });
    atoms.forEach((atom, i) => {
      const cx = Math.floor(atom.x / cellSize); const cy = Math.floor(atom.y / cellSize); const cz = Math.floor(atom.z / cellSize);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        for (const j of cells.get(`${cx + dx},${cy + dy},${cz + dz}`) || []) {
          if (j <= i || atom.chain !== atoms[j].chain) continue;
          const other = atoms[j]; const rx = radii[atom.element] || 0.8; const ry = radii[other.element] || 0.8;
          const x = atom.x - other.x; const y = atom.y - other.y; const z = atom.z - other.z;
          const max = Math.min(2.15, (rx + ry) * 1.18); const d2 = x * x + y * y + z * z;
          if (d2 > 0.16 && d2 <= max * max) out.push([i, j]);
        }
      }
    });
  }

  function parseSdf(text) {
    const lines = text.split(/\r?\n/); const counts = lines[3] || '';
    if (/V3000/.test(counts) || lines.some((line) => line.includes('V3000'))) throw new Error('This SDF uses V3000; the current viewer supports V2000 records.');
    const atomCount = Number(counts.slice(0, 3)); const bondCount = Number(counts.slice(3, 6));
    if (!Number.isInteger(atomCount) || atomCount < 1 || atomCount > 10000 || !Number.isInteger(bondCount) || bondCount < 0 || bondCount > 20000) throw new Error('SDF atom/bond counts are missing or exceed safe rendering limits.');
    const atoms = [];
    for (let index = 0; index < atomCount; index++) {
      const line = lines[4 + index] || ''; const element = line.slice(31, 34).trim().toUpperCase();
      const atom = { index, serial: index + 1, name: `${element}${index + 1}`, element,
        x: Number(line.slice(0, 10)), y: Number(line.slice(10, 20)), z: Number(line.slice(20, 30)), visible: true,
        componentId: `atom-${index + 1}`, componentName: `${element} atom ${index + 1}` };
      if (!element || !Number.isFinite(atom.x + atom.y + atom.z)) throw new Error(`SDF atom ${index + 1} has invalid coordinates.`);
      atoms.push(atom);
    }
    const bonds = [];
    for (let index = 0; index < bondCount; index++) {
      const line = lines[4 + atomCount + index] || ''; const a = Number(line.slice(0, 3)) - 1; const b = Number(line.slice(3, 6)) - 1;
      if (a < 0 || b < 0 || a >= atomCount || b >= atomCount) throw new Error('SDF contains a bond with an invalid atom index.');
      bonds.push([a, b]);
    }
    return { atoms, bonds, components: atoms.map((atom) => ({ id: atom.componentId, name: atom.componentName, atoms: [atom] })), bondSource: 'source SDF bond records' };
  }

  return { parsePdb, parseSdf };
});
