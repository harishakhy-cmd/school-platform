(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.ChemistrySimulation = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const VERSION = 1;
  const CHEMICALS = Object.freeze({
    water: {
      id: 'water', name: 'Purified water', formula: 'H2O', state: 'liquid',
      category: 'Solvents', molarMassGPerMol: 18.01528, concentrationMolPerL: 0,
      stockMl: 3000, color: '#d8efff', hazard: 'No special hazard at this scale.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/962'
    },
    glucose: {
      id: 'glucose', name: 'Glucose solution', formula: 'C6H12O6', state: 'aqueous solution',
      category: 'Solutions', molarMassGPerMol: 180.156, concentrationMolPerL: 1,
      stockMl: 100, color: '#e8f4ff', hazard: 'Teaching stock solution; avoid ingestion.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/5793'
    },
    hydrochloric_acid: {
      id: 'hydrochloric_acid', name: 'Hydrochloric acid (dilute)', formula: 'HCl',
      state: 'aqueous solution', category: 'Acids', molarMassGPerMol: 36.458,
      concentrationMolPerL: 0.1, stockMl: 500, color: '#d9efff',
      hazard: 'Dilute acid: avoid contact; use simulated eye protection.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/313'
    },
    sodium_hydroxide: {
      id: 'sodium_hydroxide', name: 'Sodium hydroxide (dilute)', formula: 'NaOH',
      state: 'aqueous solution', category: 'Bases and alkalis', molarMassGPerMol: 39.997,
      concentrationMolPerL: 0.1, stockMl: 500, color: '#e5edff',
      hazard: 'Dilute alkali: avoid contact; use simulated eye protection.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/14798'
    },
    sodium_chloride: {
      id: 'sodium_chloride', name: 'Sodium chloride', formula: 'NaCl', state: 'solid',
      category: 'Soluble salts', molarMassGPerMol: 58.44, solubilityGPerL: 359,
      stockG: 50, color: '#ffffff', hazard: 'Low hazard in this virtual practical.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/5234'
    },
    calcium_chloride: {
      id: 'calcium_chloride', name: 'Calcium chloride solution', formula: 'CaCl2',
      state: 'aqueous solution', category: 'Soluble salts', molarMassGPerMol: 110.98,
      concentrationMolPerL: 0.1, stockMl: 500, color: '#d8efff',
      hazard: 'Avoid contact; simulated eye protection recommended.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/5284359'
    },
    sodium_carbonate: {
      id: 'sodium_carbonate', name: 'Sodium carbonate solution', formula: 'Na2CO3',
      state: 'aqueous solution', category: 'Bases and alkalis', molarMassGPerMol: 105.99,
      concentrationMolPerL: 0.1, stockMl: 500, color: '#e5edff',
      hazard: 'Irritant: avoid contact; simulated eye protection recommended.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/10340'
    },
    sulfuric_acid: {
      id: 'sulfuric_acid', name: 'Sulfuric acid (dilute teaching solution)', formula: 'H2SO4',
      state: 'aqueous solution', category: 'Acids', molarMassGPerMol: 98.079,
      concentrationMolPerL: 0.1, stockMl: 500, color: '#d9efff',
      hazard: 'Irritant even when dilute; this stock is virtual only.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/1118'
    },
    ammonia_solution: {
      id: 'ammonia_solution', name: 'Ammonia solution (dilute teaching solution)', formula: 'NH3',
      state: 'aqueous solution', category: 'Bases and alkalis', molarMassGPerMol: 17.031,
      concentrationMolPerL: 0.1, stockMl: 500, color: '#e5edff',
      hazard: 'Ammonia vapour is harmful; this stock is virtual only.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/222'
    },
    ammonium_sulfate: {
      id: 'ammonium_sulfate', name: 'Ammonium sulfate (product)', formula: '(NH4)2SO4',
      state: 'aqueous solution', category: 'Products', molarMassGPerMol: 132.14,
      concentrationMolPerL: 0, stockMl: 0, availableAsStock: false,
      color: '#e8f4ff', hazard: 'Product shown only in the virtual reaction model.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/24580'
    }
  });

  const REACTIONS = Object.freeze([
    {
      id: 'strong-acid-strong-base-neutralisation', version: 1,
      name: 'Strong acid–strong base neutralisation', type: 'neutralisation',
      reactants: [{ id: 'hydrochloric_acid', coefficient: 1 }, { id: 'sodium_hydroxide', coefficient: 1 }],
      products: [{ id: 'sodium_chloride', coefficient: 1, phase: 'aqueous' }, { id: 'water', coefficient: 1, phase: 'liquid' }],
      equation: 'HCl(aq) + NaOH(aq) → NaCl(aq) + H2O(l)',
      netIonicEquation: 'H+(aq) + OH−(aq) → H2O(l)',
      observation: 'The colourless solutions remain clear. Heat is not modelled.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/313',
      validationStatus: 'balanced classroom reaction; ideal dilute strong-electrolyte model'
    },
    {
      id: 'calcium-carbonate-precipitation', version: 1,
      name: 'Calcium carbonate precipitation', type: 'precipitation',
      reactants: [{ id: 'calcium_chloride', coefficient: 1 }, { id: 'sodium_carbonate', coefficient: 1 }],
      products: [{ id: 'calcium_carbonate', formula: 'CaCO3', coefficient: 1, phase: 'solid', molarMassGPerMol: 100.0869 },
        { id: 'sodium_chloride', coefficient: 2, phase: 'aqueous' }],
      equation: 'CaCl2(aq) + Na2CO3(aq) → CaCO3(s) + 2NaCl(aq)',
      netIonicEquation: 'Ca2+(aq) + CO3^2−(aq) → CaCO3(s)',
      observation: 'A white calcium carbonate precipitate forms. No gas or temperature change is modelled.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/10112',
      validationStatus: 'balanced classroom precipitation reaction; quantitative equilibrium not modelled'
    },
    {
      id: 'ammonium-sulfate-neutralisation', version: 1,
      name: 'Ammonium sulfate neutralisation', type: 'neutralisation',
      reactants: [
        { id: 'sulfuric_acid', coefficient: 1 },
        { id: 'ammonia_solution', coefficient: 2 }
      ],
      products: [
        { id: 'ammonium_sulfate', coefficient: 1, phase: 'aqueous' }
      ],
      equation: 'H2SO4(aq) + 2NH3(aq) → (NH4)2SO4(aq)',
      netIonicEquation: '2NH3(aq) + 2H+(aq) → 2NH4+(aq)',
      observation: 'The model forms dissolved ammonium sulfate in the idealised neutralisation.',
      source: 'https://pubchem.ncbi.nlm.nih.gov/compound/24580',
      validationStatus: 'balanced classroom stoichiometry; ammonia equilibrium, heat, pH endpoint and yield are not modelled'
    }
  ]);

  const APPARATUS = Object.freeze({
    beaker: { label: 'Beaker, 250 mL', capacityMl: 250, kind: 'vessel', shape: 'beaker', family: 'beaker' },
    beaker_600: { label: 'Beaker, 600 mL', capacityMl: 600, kind: 'vessel', shape: 'beaker', family: 'beaker' },
    beaker_1000: { label: 'Beaker, 1000 mL', capacityMl: 1000, kind: 'vessel', shape: 'beaker', family: 'beaker' },
    conical_flask: { label: 'Conical flask, 250 mL', capacityMl: 250, kind: 'vessel', shape: 'conical_flask', family: 'conical_flask' },
    conical_flask_500: { label: 'Flask, 500 mL', capacityMl: 500, kind: 'vessel', shape: 'conical_flask', family: 'conical_flask' },
    conical_flask_1000: { label: 'Flask, 1000 mL', capacityMl: 1000, kind: 'vessel', shape: 'conical_flask', family: 'conical_flask' },
    volumetric_flask: { label: 'Volumetric flask, 100 mL', capacityMl: 100, kind: 'vessel', shape: 'volumetric_flask', family: 'volumetric_flask' },
    volumetric_flask_250: { label: 'Volumetric flask, 250 mL', capacityMl: 250, kind: 'vessel', shape: 'volumetric_flask', family: 'volumetric_flask' },
    volumetric_flask_500: { label: 'Volumetric flask, 500 mL', capacityMl: 500, kind: 'vessel', shape: 'volumetric_flask', family: 'volumetric_flask' },
    volumetric_flask_1000: { label: 'Volumetric flask, 1000 mL', capacityMl: 1000, kind: 'vessel', shape: 'volumetric_flask', family: 'volumetric_flask' },
    test_tube: { label: 'Test tube, 25 mL', capacityMl: 25, kind: 'vessel', shape: 'test_tube', family: 'test_tube' },
    measuring_cylinder_10: { label: 'Graduated cylinder, 10 mL', capacityMl: 10, kind: 'vessel', shape: 'measuring_cylinder', family: 'measuring_cylinder' },
    measuring_cylinder_25: { label: 'Graduated cylinder, 25 mL', capacityMl: 25, kind: 'vessel', shape: 'measuring_cylinder', family: 'measuring_cylinder' },
    measuring_cylinder_50: { label: 'Graduated cylinder, 50 mL', capacityMl: 50, kind: 'vessel', shape: 'measuring_cylinder', family: 'measuring_cylinder' },
    measuring_cylinder: { label: 'Graduated cylinder, 100 mL', capacityMl: 100, kind: 'vessel', shape: 'measuring_cylinder', family: 'measuring_cylinder' },
    foam_cup: { label: 'Foam cup, 200 mL', capacityMl: 200, kind: 'vessel', shape: 'beaker', family: 'foam_cup' },
    funnel: { label: 'Filter funnel', kind: 'apparatus' },
    filter_paper: { label: 'Filter paper', kind: 'apparatus' },
    glass_rod: { label: 'Glass stirring rod', kind: 'apparatus' },
    pipette_5: { label: 'Pipette, 5 mL', kind: 'apparatus' },
    pipette_10: { label: 'Pipette, 10 mL', kind: 'apparatus' },
    pipette_25: { label: 'Pipette, 25 mL', kind: 'apparatus' },
    disposable_pipette: { label: 'Disposable pipette', kind: 'apparatus' },
    weigh_boat: { label: 'Weigh boat', kind: 'apparatus' },
    burette_50: { label: 'Burette, 50 mL', kind: 'apparatus' },
    bunsen_burner: { label: 'Bunsen burner (heating not modelled)', kind: 'apparatus' },
    scale: { label: 'Scale (instrument reading not modelled)', kind: 'apparatus' },
    evaporating_dish: { label: 'Evaporating dish (schematic)', kind: 'apparatus' },
    tripod_stand: { label: 'Tripod stand (schematic)', kind: 'apparatus' },
    wire_gauze: { label: 'Wire gauze (schematic)', kind: 'apparatus' },
    watch_glass: { label: 'Watch glass (schematic)', kind: 'apparatus' }
  });
  const LEGACY_STOCK_DEFAULTS = new Set([
    'glucose', 'sulfuric_acid', 'ammonia_solution', 'ammonium_sulfate'
  ]);

  const ATOMIC_MASSES = Object.freeze({ H: 1.008, C: 12.011, O: 15.999, Na: 22.989769, Cl: 35.45, Ca: 40.078 });

  function number(value, name) {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new TypeError(`${name} must be a finite number.`);
    return n;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeState() {
    const stock = {};
    for (const chemical of Object.values(CHEMICALS)) {
      stock[chemical.id] = chemical.state === 'solid'
        ? { grams: chemical.stockG }
        : { ml: chemical.stockMl };
    }
    return {
      version: VERSION,
      title: 'Open laboratory',
      experimentKey: 'open-lab',
      containers: [],
      apparatus: [],
      stock,
      selectedContainerId: null,
      products: [],
      observations: [],
      history: [],
      notebook: { hypothesis: '', notes: '' }
    };
  }

  function validateState(state) {
    const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
    const finiteNonNegative = (value) => Number.isFinite(value) && value >= 0;
    if (!isRecord(state) || state.version !== VERSION || typeof state.title !== 'string'
      || state.title.length > 255 || typeof state.experimentKey !== 'string') {
      throw new TypeError('Experiment state header is invalid.');
    }
    if (!Array.isArray(state.containers) || state.containers.length > 100
      || !Array.isArray(state.apparatus) || state.apparatus.length > 100
      || !Array.isArray(state.products) || state.products.length > 200
      || !Array.isArray(state.history) || state.history.length > 200
      || !Array.isArray(state.observations) || state.observations.length > 200
      || !isRecord(state.stock) || !isRecord(state.notebook)) {
      throw new TypeError('Experiment state collections are invalid.');
    }
    for (const [id, chemical] of Object.entries(CHEMICALS)) {
      const amount = state.stock[id];
      const stockKey = chemical.state === 'solid' ? 'grams' : 'ml';
      const max = chemical.state === 'solid' ? chemical.stockG : chemical.stockMl;
      if (LEGACY_STOCK_DEFAULTS.has(id) && amount === undefined) continue;
      if (!isRecord(amount) || !finiteNonNegative(amount[stockKey]) || amount[stockKey] > max) {
        throw new TypeError(`Stock quantity for ${id} is invalid.`);
      }
    }
    for (const apparatus of state.apparatus) {
      if (!isRecord(apparatus) || !APPARATUS[apparatus.type]
        || APPARATUS[apparatus.type].kind !== 'apparatus'
        || typeof apparatus.id !== 'string' || typeof apparatus.label !== 'string') {
        throw new TypeError('Experiment apparatus data is invalid.');
      }
    }
    const ids = new Set();
    for (const container of state.containers) {
      if (!isRecord(container) || !APPARATUS[container.type]?.capacityMl
        || typeof container.id !== 'string' || container.id.length > 128 || ids.has(container.id)
        || typeof container.label !== 'string' || container.label.length > 60
        || container.capacityMl !== APPARATUS[container.type].capacityMl
        || !finiteNonNegative(container.volumeMl) || container.volumeMl > container.capacityMl
        || !isRecord(container.species) || !Array.isArray(container.precipitates)
        || container.precipitates.length > 100 || !Array.isArray(container.separatedSolids)
        || container.separatedSolids.length > 100 || !Array.isArray(container.reactionResults)
        || container.reactionResults.length > 200) {
        throw new TypeError('Experiment vessel data is invalid.');
      }
      ids.add(container.id);
      for (const [chemicalId, moles] of Object.entries(container.species)) {
        if (!CHEMICALS[chemicalId] || !finiteNonNegative(moles)) {
          throw new TypeError('Experiment solution composition is invalid.');
        }
      }
      for (const solid of [...container.precipitates, ...container.separatedSolids]) {
        if (!isRecord(solid) || solid.formula !== 'CaCO3'
          || !finiteNonNegative(solid.moles) || !finiteNonNegative(solid.massG)) {
          throw new TypeError('Experiment solid product is invalid.');
        }
      }
      if (container.pH !== null && (!Number.isFinite(container.pH) || container.pH < 0 || container.pH > 14)) {
        throw new TypeError('Experiment pH value is invalid.');
      }
    }
    if (state.selectedContainerId !== null && !ids.has(state.selectedContainerId)) {
      throw new TypeError('Selected vessel does not exist in this experiment.');
    }
    for (const product of state.products) {
      if (!isRecord(product) || typeof product.id !== 'string' || typeof product.formula !== 'string'
        || !finiteNonNegative(product.moles)) {
        throw new TypeError('Experiment product data is invalid.');
      }
    }
    if (typeof state.notebook.hypothesis !== 'string' || state.notebook.hypothesis.length > 4000
      || typeof state.notebook.notes !== 'string' || state.notebook.notes.length > 8000) {
      throw new TypeError('Experiment notebook data is invalid.');
    }
    return true;
  }

  function record(state, type, message, details = {}) {
    state.history.push({ type, message, details: clone(details), at: new Date().toISOString() });
    if (state.history.length > 200) state.history.shift();
    state.observations.push(message);
    if (state.observations.length > 200) state.observations.shift();
  }

  function addApparatus(state, type) {
    const definition = APPARATUS[type];
    if (!definition || definition.kind !== 'apparatus') throw new RangeError('Choose an available apparatus item.');
    const item = { id: `apparatus-${Date.now()}-${state.apparatus.length}`, type, label: definition.label };
    state.apparatus.push(item);
    record(state, 'ADD_APPARATUS', `${definition.label} added to the workbench.`, { apparatus: item });
    return item;
  }

  function removeApparatus(state, id) {
    const index = state.apparatus.findIndex((item) => item.id === id);
    if (index < 0) throw new RangeError('Select apparatus that is on the workbench.');
    const [item] = state.apparatus.splice(index, 1);
    record(state, 'REMOVE_APPARATUS', `${item.label} removed from the workbench.`, { apparatus: item });
  }

  function addContainer(state, type, label) {
    const definition = APPARATUS[type];
    if (!definition || definition.kind !== 'vessel' || !definition.capacityMl) throw new RangeError('Choose a supported liquid container.');
    const container = {
      id: `vessel-${Date.now()}-${state.containers.length}`,
      type, label: (label || definition.label).slice(0, 60),
      capacityMl: definition.capacityMl, volumeMl: 0,
      species: {}, precipitates: [], separatedSolids: [], reactionResults: [],
      pH: null
    };
    state.containers.push(container);
    state.selectedContainerId = container.id;
    record(state, 'ADD_CONTAINER', `${container.label} placed on the workbench.`, { containerId: container.id, type });
    return container;
  }

  function removeContainer(state, id) {
    const index = state.containers.findIndex((container) => container.id === id);
    if (index < 0) throw new RangeError('Select a container on the workbench.');
    const [container] = state.containers.splice(index, 1);
    if (state.selectedContainerId === id) state.selectedContainerId = state.containers[0]?.id || null;
    record(state, 'REMOVE_CONTAINER', `${container.label} removed. Its contents were discarded.`, { containerId: id });
  }

  function containerFor(state, id) {
    const container = state.containers.find((item) => item.id === id);
    if (!container) throw new RangeError('Select a container on the workbench.');
    return container;
  }

  function transferFromStock(state, chemicalId, volumeMl, containerId) {
    const chemical = CHEMICALS[chemicalId];
    if (!chemical || chemical.state === 'solid') throw new RangeError('Choose an available liquid reagent.');
    const volume = number(volumeMl, 'Transfer volume');
    const stock = state.stock[chemicalId];
    const container = containerFor(state, containerId);
    if (!(volume > 0)) throw new RangeError('Transfer volume must be greater than zero.');
    if (volume > stock.ml + 1e-9) throw new RangeError('There is not enough stock solution for that transfer.');
    if (container.volumeMl + volume > container.capacityMl + 1e-9) throw new RangeError(`${container.label} capacity would be exceeded.`);
    stock.ml = Math.max(0, stock.ml - volume);
    container.volumeMl += volume;
    container.species[chemicalId] = (container.species[chemicalId] || 0) + chemical.concentrationMolPerL * volume / 1000;
    record(state, 'TRANSFER_LIQUID', `${volume.toFixed(2)} mL of ${chemical.name} transferred to ${container.label}.`, {
      chemicalId, volumeMl: volume, moles: chemical.concentrationMolPerL * volume / 1000, containerId
    });
    return container;
  }

  function addSolid(state, chemicalId, massG, containerId) {
    const chemical = CHEMICALS[chemicalId];
    if (!chemical || chemical.state !== 'solid') throw new RangeError('Choose an available solid reagent.');
    const mass = number(massG, 'Solid mass');
    const stock = state.stock[chemicalId];
    const container = containerFor(state, containerId);
    if (!(mass > 0)) throw new RangeError('Solid mass must be greater than zero.');
    if (mass > stock.grams + 1e-9) throw new RangeError('There is not enough solid reagent in stock.');
    const dissolved = (container.species[chemicalId] || 0) * chemical.molarMassGPerMol;
    const solventLitres = container.volumeMl / 1000;
    if (solventLitres <= 0) throw new RangeError('Add water or solution to the container before dissolving a solid.');
    if (dissolved + mass > chemical.solubilityGPerL * solventLitres + 1e-9) {
      throw new RangeError('This mass exceeds the simplified 20 °C solubility limit for the available solvent.');
    }
    stock.grams = Math.max(0, stock.grams - mass);
    const moles = mass / chemical.molarMassGPerMol;
    container.species[chemicalId] = (container.species[chemicalId] || 0) + moles;
    record(state, 'ADD_SOLID', `${mass.toFixed(3)} g of ${chemical.name} dissolved in ${container.label}.`, {
      chemicalId, massG: mass, moles, containerId
    });
    return container;
  }

  function transferBetweenContainers(state, sourceId, destinationId, volumeMl) {
    if (sourceId === destinationId) throw new RangeError('Choose two different containers.');
    const source = containerFor(state, sourceId);
    const destination = containerFor(state, destinationId);
    const volume = number(volumeMl, 'Transfer volume');
    if (!(volume > 0) || volume > source.volumeMl + 1e-9) throw new RangeError('Transfer volume must be positive and no greater than the source volume.');
    if (destination.volumeMl + volume > destination.capacityMl + 1e-9) throw new RangeError(`${destination.label} capacity would be exceeded.`);
    if (source.precipitates.length) throw new RangeError('Separate the precipitate before transferring only the liquid; solid suspension transfers are not modelled.');
    const fraction = volume / source.volumeMl;
    for (const [chemicalId, moles] of Object.entries(source.species)) {
      const transferred = moles * fraction;
      source.species[chemicalId] = moles - transferred;
      destination.species[chemicalId] = (destination.species[chemicalId] || 0) + transferred;
    }
    source.volumeMl -= volume;
    destination.volumeMl += volume;
    record(state, 'TRANSFER_BETWEEN_CONTAINERS', `${volume.toFixed(2)} mL transferred from ${source.label} to ${destination.label}.`, {
      sourceId, destinationId, volumeMl: volume
    });
    return { source, destination };
  }

  function formulaAtoms(formula) {
    const tokens = formula.match(/[A-Z][a-z]?|[()]|\d+/g) || [];
    if (tokens.join('') !== formula) throw new TypeError(`Unsupported chemical formula: ${formula}`);
    const groups = [{}];
    for (let index = 0; index < tokens.length; index += 1) {
      const token = tokens[index];
      if (token === '(') {
        groups.push({});
      } else if (token === ')') {
        if (groups.length === 1) throw new TypeError(`Unsupported chemical formula: ${formula}`);
        const group = groups.pop();
        const multiplier = /^\d+$/.test(tokens[index + 1] || '') ? Number(tokens[++index]) : 1;
        const parent = groups[groups.length - 1];
        for (const [element, count] of Object.entries(group)) {
          parent[element] = (parent[element] || 0) + count * multiplier;
        }
      } else if (/^[A-Z]/.test(token)) {
        const count = /^\d+$/.test(tokens[index + 1] || '') ? Number(tokens[++index]) : 1;
        const current = groups[groups.length - 1];
        current[token] = (current[token] || 0) + count;
      } else {
        throw new TypeError(`Unsupported chemical formula: ${formula}`);
      }
    }
    if (groups.length !== 1) throw new TypeError(`Unsupported chemical formula: ${formula}`);
    return groups[0];
  }

  function isBalanced(reaction) {
    const balance = {};
    for (const [parts, direction] of [[reaction.reactants, 1], [reaction.products, -1]]) {
      for (const part of parts) {
        const formula = CHEMICALS[part.id]?.formula || part.formula;
        if (!formula) throw new TypeError(`Missing formula for ${part.id}`);
        for (const [element, count] of Object.entries(formulaAtoms(formula))) {
          balance[element] = (balance[element] || 0) + direction * count * part.coefficient;
        }
      }
    }
    return Object.values(balance).every((count) => count === 0);
  }

  function calculatePH(container) {
    const acidMoles = container.species.hydrochloric_acid || 0;
    const baseMoles = container.species.sodium_hydroxide || 0;
    const litres = container.volumeMl / 1000;
    if (litres <= 0) return null;
    if (!acidMoles && !baseMoles) {
      return container.reactionResults.some((result) => result.reactionId === 'strong-acid-strong-base-neutralisation')
        ? 7
        : null;
    }
    const excess = Math.abs(acidMoles - baseMoles) / litres;
    if (excess < 1e-12) return 7;
    const pH = acidMoles > baseMoles ? -Math.log10(excess) : 14 + Math.log10(excess);
    return Math.max(0, Math.min(14, pH));
  }

  function mix(state, containerId) {
    const container = containerFor(state, containerId);
    if (!state.apparatus.some((item) => item.type === 'glass_rod')) {
      throw new RangeError('Add a glass stirring rod to the workbench before mixing.');
    }
    const matched = [];
    for (const reaction of REACTIONS) {
      const limiting = Math.min(...reaction.reactants.map(({ id, coefficient }) => (
        (container.species[id] || 0) / coefficient
      )));
      if (!(limiting > 1e-12)) continue;
      if (!isBalanced(reaction)) throw new Error(`Reaction definition ${reaction.id} is not atom-balanced.`);
      for (const reactant of reaction.reactants) {
        container.species[reactant.id] = Math.max(0, container.species[reactant.id] - limiting * reactant.coefficient);
      }
      for (const product of reaction.products) {
        const moles = limiting * product.coefficient;
        if (product.phase === 'solid') {
          container.precipitates.push({
            id: product.id, formula: product.formula, name: 'Calcium carbonate precipitate',
            moles, massG: moles * product.molarMassGPerMol, appearance: 'white'
          });
        } else if (CHEMICALS[product.id]) {
          if (product.id === 'water') {
            state.products.push({
              id: product.id,
              formula: CHEMICALS[product.id]?.formula || product.formula,
              moles,
              phase: product.phase
            });
          } else {
            container.species[product.id] = (container.species[product.id] || 0) + moles;
          }
        } else {
          state.products.push({ id: product.id, formula: product.formula, moles, phase: product.phase });
        }
      }
      const result = {
        reactionId: reaction.id, reactionVersion: reaction.version,
        equation: reaction.equation, netIonicEquation: reaction.netIonicEquation,
        limitingExtentMol: limiting, observation: reaction.observation,
        validationStatus: reaction.validationStatus
      };
      container.reactionResults.push(result);
      matched.push(result);
      record(state, 'MIX_CONTENTS', reaction.observation, { containerId, ...result });
    }
    container.pH = calculatePH(container);
    if (!matched.length) {
      const message = 'No supported reaction is defined for the current mixture; no products were invented.';
      record(state, 'MIX_CONTENTS', message, { containerId });
      return { reactions: [], message, pH: container.pH, unsupported: true };
    }
    return { reactions: matched, message: matched.map((item) => item.observation).join(' '), pH: container.pH, unsupported: false };
  }

  function filterPrecipitate(state, containerId, filtrateContainerId) {
    const container = containerFor(state, containerId);
    const hasFunnel = state.apparatus.some((item) => item.type === 'funnel');
    const hasPaper = state.apparatus.some((item) => item.type === 'filter_paper');
    if (!hasFunnel || !hasPaper) throw new RangeError('Add a filter funnel and filter paper to the workbench before filtering.');
    if (!container.precipitates.length) throw new RangeError('There is no supported precipitate to filter.');
    const filtrateContainer = containerFor(state, filtrateContainerId);
    if (container.id === filtrateContainer.id) throw new RangeError('Choose a separate receiving vessel for the filtrate.');
    if (filtrateContainer.volumeMl > 0 || Object.keys(filtrateContainer.species).length) {
      throw new RangeError('The receiving vessel must be empty before filtration.');
    }
    if (container.volumeMl > filtrateContainer.capacityMl) {
      throw new RangeError('The receiving vessel is too small to hold the filtrate.');
    }
    const solids = container.precipitates.splice(0);
    container.separatedSolids.push(...solids);
    filtrateContainer.volumeMl = container.volumeMl;
    filtrateContainer.species = { ...container.species };
    container.volumeMl = 0;
    container.species = {};
    const summary = solids.map((solid) => `${solid.formula}: ${solid.massG.toFixed(3)} g`).join(', ');
    record(state, 'FILTER_MIXTURE', `Filtration separated ${summary}; filtrate collected in ${filtrateContainer.label}.`, {
      containerId, filtrateContainerId, solids
    });
    return solids;
  }

  function setFinalVolume(state, containerId, finalVolumeMl) {
    const container = containerFor(state, containerId);
    if (APPARATUS[container.type].family !== 'volumetric_flask') throw new RangeError('Use a volumetric flask to set a final volume.');
    const volume = number(finalVolumeMl, 'Final volume');
    if (!(volume > 0) || volume > container.capacityMl) throw new RangeError(`Final volume must be between 0 and ${container.capacityMl} mL.`);
    if (volume < container.volumeMl) throw new RangeError('Final volume cannot be less than the current liquid volume.');
    const waterAddedMl = volume - container.volumeMl;
    if (waterAddedMl > state.stock.water.ml + 1e-9) throw new RangeError('There is not enough purified water in stock to reach that final volume.');
    state.stock.water.ml = Math.max(0, state.stock.water.ml - waterAddedMl);
    container.volumeMl = volume;
    record(state, 'SET_FINAL_VOLUME', `${container.label} brought to a final volume of ${volume.toFixed(2)} mL.`, {
      containerId, finalVolumeMl: volume, waterAddedMl
    });
    return container;
  }

  function inspect(container) {
    if (!container) return null;
    const species = Object.entries(container.species).filter(([, moles]) => moles > 1e-12).map(([id, moles]) => {
      const chemical = CHEMICALS[id];
      return {
        id, name: chemical.name, formula: chemical.formula, moles,
        concentrationMolPerL: container.volumeMl > 0 ? moles / (container.volumeMl / 1000) : null,
        source: chemical.source
      };
    });
    return {
      volumeMl: container.volumeMl, capacityMl: container.capacityMl, species,
      precipitates: clone(container.precipitates), separatedSolids: clone(container.separatedSolids),
      pH: container.pH, reactions: clone(container.reactionResults)
    };
  }

  function calculateMolesFromMass(massG, molarMassGPerMol) {
    const mass = number(massG, 'Mass');
    const molarMass = number(molarMassGPerMol, 'Molar mass');
    if (mass < 0 || !(molarMass > 0)) throw new RangeError('Mass must be non-negative and molar mass positive.');
    return mass / molarMass;
  }

  function calculateConcentration(moles, volumeMl) {
    const amount = number(moles, 'Amount in moles');
    const volume = number(volumeMl, 'Volume');
    if (amount < 0 || !(volume > 0)) throw new RangeError('Moles must be non-negative and volume positive.');
    return amount / (volume / 1000);
  }

  return {
    VERSION, CHEMICALS, REACTIONS, APPARATUS,
    makeState, validateState, addApparatus, removeApparatus, addContainer, removeContainer,
    transferFromStock, addSolid, transferBetweenContainers, mix, filterPrecipitate,
    setFinalVolume, inspect, calculatePH, calculateMolesFromMass,
    calculateConcentration, isBalanced
  };
});
