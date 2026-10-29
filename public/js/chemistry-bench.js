(function () {
  'use strict';

  const Simulation = window.ChemistrySimulation;
  const API = '/api/chemistry-lab';
  const guides = {
    'open-lab': {
      title: 'Open laboratory',
      steps: ['Choose a vessel and add it to the workbench.', 'Select a reagent and transfer a measured amount.', 'Record observations in the notebook.']
    },
    'acid-base-neutralisation': {
      title: 'Strong acid–strong base neutralisation',
      steps: ['Measure dilute hydrochloric acid and sodium hydroxide into the beaker.', 'Add a glass stirring rod and mix the contents.', 'Compare the limiting reagent and ideal dilute-solution pH. Heat is not modelled.']
    },
    precipitation: {
      title: 'Calcium carbonate precipitation',
      steps: ['Measure calcium chloride and sodium carbonate solutions into the beaker.', 'Add a glass stirring rod and mix; inspect the calculated solid product.', 'Add filter funnel and paper, then filter the supported precipitate. Equilibrium is not modelled.']
    },
    'solution-from-solid': {
      title: 'Prepare a solution from a solid',
      steps: ['Add purified water to a 100 mL volumetric flask.', 'Add a measured mass of sodium chloride; the simplified solubility check is at 20 °C.', 'Bring the solution to the calibration volume and inspect its calculated concentration.']
    },
    dilution: {
      title: 'Measured dilution',
      steps: ['Measure dilute hydrochloric acid into a source vessel.', 'Transfer a measured aliquot into the 100 mL volumetric flask.', 'Add purified water to the calibration volume and compare the calculated concentration.']
    },
    'glucose-dilution': {
      title: 'Glucose dilution problem',
      steps: ['Use a 25 mL pipette to measure 25 mL of 1 M glucose stock into a 1000 mL volumetric flask.', 'Add distilled water until the flask reaches its calibration volume.', 'Inspect the calculated glucose concentration; the target is 0.025 M.']
    },
    'ammonium-sulfate-preparation': {
      title: 'Ammonium sulfate preparation',
      steps: ['For this virtual practical only, combine the dilute teaching solutions in a 1:2 sulfuric-acid-to-ammonia mole ratio.', 'Mix with the glass rod and inspect the balanced reaction and dissolved ammonium sulfate.', 'Replay the conceptual evaporation/crystallisation animation. It does not calculate pH endpoints, heating, solubility, or crystal yield. Real acid/ammonia work requires an approved risk assessment, trained supervision, and appropriate controls.']
    }
  };
  const apparatusChoices = Object.entries(Simulation.APPARATUS).map(([type, definition]) => ({
    type, name: definition.label, kind: definition.kind
  }));
  const reagentNames = {
    hydrochloric_acid: 'Hydrochloric acid (0.100 mol/L)',
    sodium_hydroxide: 'Sodium hydroxide (0.100 mol/L)',
    calcium_chloride: 'Calcium chloride (0.100 mol/L)',
    sodium_carbonate: 'Sodium carbonate (0.100 mol/L)',
    water: 'Purified water',
    sodium_chloride: 'Sodium chloride (solid)',
    sulfuric_acid: 'Sulfuric acid (0.100 mol/L teaching solution)',
    ammonia_solution: 'Ammonia solution (0.100 mol/L teaching solution)'
  };
  let state = null;
  let undoStack = [];
  let redoStack = [];
  let savedRunId = null;
  let isDirty = false;
  let selectedReagent = 'hydrochloric_acid';
  let currentTab = 'procedure';
  let animationTimer = null;
  let animationPhase = 'setup';
  const animationSteps = [
    { phase: 'setup', label: 'Apparatus set up' },
    { phase: 'mixing', label: 'Solutions combined and stirred' },
    { phase: 'heating', label: 'Conceptual evaporation stage' },
    { phase: 'crystals', label: 'Illustrative crystals shown' }
  ];

  function byId(id) { return document.getElementById(id); }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }
  function selectedContainer() {
    return state.containers.find((item) => item.id === state.selectedContainerId) || null;
  }
  function formatAmount(value, digits) {
    return Number(value).toLocaleString(undefined, { maximumFractionDigits: digits });
  }
  function setStatus(message, kind) {
    const el = byId('chem-bench-status');
    el.textContent = message;
    el.className = `chem-bench-status${kind ? ` ${kind}` : ''}`;
  }
  function pushUndo() {
    undoStack.push(JSON.stringify(state));
    redoStack = [];
    if (undoStack.length > 50) undoStack.shift();
  }
  function commit(operation, successMessage) {
    pushUndo();
    try {
      operation();
      isDirty = true;
      render();
      setStatus(successMessage, 'success');
    } catch (error) {
      state = JSON.parse(undoStack.pop());
      render();
      setStatus(error.message || 'The laboratory action could not be completed.', 'error');
    }
  }
  function initialisePractical(key) {
    const guide = guides[key] || guides['open-lab'];
    state = Simulation.makeState();
    state.title = guide.title;
    state.experimentKey = key;
    selectedReagent = key === 'glucose-dilution' ? 'glucose'
      : key === 'ammonium-sulfate-preparation' ? 'sulfuric_acid' : 'hydrochloric_acid';
    animationPhase = 'setup';
    clearTimeout(animationTimer);
    undoStack = [];
    redoStack = [];
    savedRunId = null;
    isDirty = false;
    if (key === 'acid-base-neutralisation' || key === 'precipitation') {
      Simulation.addContainer(state, 'beaker');
      Simulation.addApparatus(state, 'glass_rod');
    } else if (key === 'solution-from-solid') {
      Simulation.addContainer(state, 'volumetric_flask');
      Simulation.addApparatus(state, 'glass_rod');
    } else if (key === 'dilution') {
      Simulation.addContainer(state, 'beaker', 'Stock aliquot');
      Simulation.addContainer(state, 'volumetric_flask', 'Diluted solution');
      Simulation.addApparatus(state, 'glass_rod');
    } else if (key === 'glucose-dilution') {
      Simulation.addContainer(state, 'volumetric_flask_1000', 'Glucose dilution, 1000 mL');
      Simulation.addApparatus(state, 'pipette_25');
    } else if (key === 'ammonium-sulfate-preparation') {
      const reactionFlask = Simulation.addContainer(state, 'conical_flask', 'Neutralisation flask');
      Simulation.addContainer(state, 'measuring_cylinder', 'Measure reagent volumes');
      state.selectedContainerId = reactionFlask.id;
      Simulation.addApparatus(state, 'glass_rod');
      Simulation.addApparatus(state, 'burette_50');
      Simulation.addApparatus(state, 'bunsen_burner');
      Simulation.addApparatus(state, 'tripod_stand');
      Simulation.addApparatus(state, 'wire_gauze');
      Simulation.addApparatus(state, 'evaporating_dish');
      Simulation.addApparatus(state, 'watch_glass');
    }
    byId('chem-bench-title').value = state.title;
    render();
    setStatus(`${guide.title} is ready.`, 'success');
  }
  function renderStockroom() {
    const query = byId('chem-bench-stock-search').value.trim().toLowerCase();
    const list = byId('chem-bench-stock-list');
    list.innerHTML = Object.values(Simulation.CHEMICALS)
      .filter((chemical) => `${chemical.name} ${chemical.formula} ${chemical.category}`.toLowerCase().includes(query))
      .filter((chemical) => chemical.availableAsStock !== false)
      .map((chemical) => {
        const stock = state.stock[chemical.id];
        const isSolid = chemical.state === 'solid';
        const remaining = isSolid ? `${formatAmount(stock.grams, 2)} g` : `${formatAmount(stock.ml, 1)} mL`;
        return `<button type="button" class="chem-stock-item${selectedReagent === chemical.id ? ' selected' : ''}" data-reagent="${chemical.id}">
          <span>${escapeHtml(chemical.name)}<small class="d-block">${escapeHtml(chemical.formula)}${chemical.concentrationMolPerL ? ` · ${chemical.concentrationMolPerL.toFixed(3)} mol/L` : ''}</small>
            ${chemical.hazard && !chemical.hazard.startsWith('No special hazard') ? `<small class="chem-stock-hazard d-block">${escapeHtml(chemical.hazard)}</small>` : ''}
          </span>
          <small>${remaining}</small>
        </button>`;
      }).join('');
  }
  function renderVessels() {
    const host = byId('chem-bench-vessels');
    host.innerHTML = state.containers.length ? state.containers.map((container, index) => {
      const contents = Simulation.inspect(container);
      const definition = Simulation.APPARATUS[container.type];
      const shape = {
        beaker: {
          path: 'M20 17 H97 L108 25 V123 Q108 131 100 131 H25 Q18 131 18 123 V22 Q18 17 20 17 Z',
          inner: { x: 19, y: 22, width: 88, height: 108, bottom: 130 }
        },
        conical_flask: {
          path: 'M42 14 H70 V48 L97 117 Q101 127 91 131 H21 Q11 127 15 117 L42 48 Z',
          inner: { x: 15, y: 17, width: 82, height: 112, bottom: 129 }
        },
        volumetric_flask: {
          path: 'M45 13 H67 V64 C67 75 82 85 91 105 Q100 126 80 131 H32 Q12 126 21 105 C30 85 45 75 45 64 Z',
          inner: { x: 20, y: 31, width: 72, height: 98, bottom: 129 }
        },
        measuring_cylinder: {
          path: 'M36 12 H76 V122 L86 131 H26 L36 122 Z',
          inner: { x: 37, y: 14, width: 38, height: 108, bottom: 123 }
        },
        test_tube: {
          path: 'M39 12 H72 V111 Q72 131 55 131 Q38 131 38 111 V12 Z',
          inner: { x: 39, y: 14, width: 32, height: 108, bottom: 123 }
        }
      }[definition.shape];
      const level = Math.max(0, Math.min(1, container.volumeMl / container.capacityMl));
      const liquidHeight = shape.inner.height * level;
      const liquidY = shape.inner.bottom - liquidHeight;
      const liquidId = `chem-bench-liquid-${index}`;
      const chemical = contents.species.length ? Simulation.CHEMICALS[contents.species[0].id] : null;
      const liquidColor = contents.precipitates.length ? '#e2e0d6' : (chemical?.color || '#dff1ff');
      const composition = contents.species.length
        ? contents.species.map((species) => `${escapeHtml(species.formula)} ${formatAmount(species.concentrationMolPerL, 4)} mol/L`).join('<br>')
        : 'No dissolved solute';
      const precipitate = contents.precipitates.reduce((mass, item) => mass + item.massG, 0);
      const marks = definition.family === 'volumetric_flask'
        ? `<line class="chem-glass-scale major" x1="43" y1="31" x2="69" y2="31"/><text class="chem-glass-scale-text" x="71" y="33">${container.capacityMl} mL</text>`
        : ['beaker', 'measuring_cylinder', 'test_tube'].includes(definition.family)
          ? Array.from({ length: 6 }, (_, index) => {
            const y = 24 + index * 17;
            const amount = Math.round(container.capacityMl * (5 - index) / 5);
            const x1 = definition.family === 'beaker' ? 77 : definition.family === 'test_tube' ? 47 : 58;
            const x2 = definition.family === 'beaker' ? 105 : definition.family === 'test_tube' ? 65 : 74;
            const label = index % 2 === 0 ? `<text class="chem-glass-scale-text" x="${x1 - 14}" y="${y + 2}">${amount}</text>` : '';
            return `<line class="chem-glass-scale${index % 2 === 0 ? ' major' : ''}" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>${label}`;
          }).join('')
          : '';
      const selectedClass = state.selectedContainerId === container.id ? ' selected' : '';
      return `<article class="chem-vessel-card">
        <button type="button" class="chem-vessel${selectedClass}" data-container-id="${escapeHtml(container.id)}" aria-pressed="${state.selectedContainerId === container.id}">
          <span class="chem-vessel-name">${escapeHtml(container.label)}</span>
          <span class="chem-vessel-type">${escapeHtml(definition.label)}</span>
          <svg class="chem-vessel-svg" viewBox="0 0 120 140" role="img" aria-label="${escapeHtml(definition.label)} with ${formatAmount(container.volumeMl, 2)} millilitres">
            <defs><clipPath id="${liquidId}"><path d="${shape.path}"/></clipPath></defs>
            <rect class="chem-liquid-fill" x="${shape.inner.x}" y="${liquidY}" width="${shape.inner.width}" height="${liquidHeight}" fill="${liquidColor}" clip-path="url(#${liquidId})"/>
            ${shape.inner.width > 40 && liquidHeight > 2 ? `<path class="chem-meniscus" d="M${shape.inner.x + 2} ${liquidY + 1} Q60 ${liquidY + 4} ${shape.inner.x + shape.inner.width - 2} ${liquidY + 1}"/>` : ''}
            ${marks}
            <path class="chem-glass-outline" d="${shape.path}"/>
            <path class="chem-glass-highlight" d="M27 27 V116 M45 21 V45"/>
          </svg>
          <span class="chem-vessel-readout">${formatAmount(container.volumeMl, 2)} / ${container.capacityMl} mL${container.pH === null ? '' : ` · pH ${container.pH.toFixed(2)}`}</span>
          <span class="chem-vessel-composition">${composition}${precipitate > 0 ? `<br>Suspended CaCO₃: ${formatAmount(precipitate, 3)} g (cloudy)` : ''}</span>
        </button>
        <button type="button" class="chem-vessel-remove" data-remove-container="${escapeHtml(container.id)}" aria-label="Remove ${escapeHtml(container.label)}" title="Remove vessel and discard its contents"><i class="fa-solid fa-xmark"></i></button>
      </article>`;
    }).join('') : '<p class="small text-muted align-self-center">No vessels yet. Choose a vessel type and add one from the controls.</p>';

    const vesselOptions = state.containers.map((item) => `<option value="${escapeHtml(item.id)}"${item.id === state.selectedContainerId ? ' selected' : ''}>${escapeHtml(item.label)} (${formatAmount(item.volumeMl, 1)} mL)</option>`).join('');
    ['chem-bench-target', 'chem-bench-source', 'chem-bench-destination'].forEach((id) => {
      const select = byId(id);
      const previous = select.value;
      select.innerHTML = vesselOptions || '<option value="">Add a vessel first</option>';
      if (state.containers.some((item) => item.id === previous)) select.value = previous;
    });
    const selected = selectedContainer();
    if (selected) byId('chem-bench-target').value = selected.id;
  }
  function renderApparatus() {
    byId('chem-bench-apparatus').innerHTML = state.apparatus.length
      ? state.apparatus.map((item) => `<span class="chem-apparatus-chip">${escapeHtml(item.label)} <button type="button" data-remove-apparatus="${escapeHtml(item.id)}" aria-label="Remove ${escapeHtml(item.label)}">×</button></span>`).join('')
      : '<span class="small text-muted">No apparatus placed.</span>';
  }
  function renderInspection() {
    const container = selectedContainer();
    const target = byId('chem-bench-inspection');
    if (!container) {
      target.innerHTML = '<p class="small text-muted">Add or select a vessel to inspect its measured contents.</p>';
      return;
    }
    const result = Simulation.inspect(container);
    const species = result.species.length
      ? `<ul class="small ps-3 mb-2">${result.species.map((item) => `<li>${escapeHtml(item.name)} (${escapeHtml(item.formula)}): ${formatAmount(item.moles, 6)} mol; ${formatAmount(item.concentrationMolPerL, 5)} mol/L</li>`).join('')}</ul>`
      : '<p class="small text-muted mb-2">No dissolved solutes.</p>';
    const precipitates = result.precipitates.length
      ? `<p class="small mb-1"><strong>Suspended solids:</strong> ${result.precipitates.map((item) => `${escapeHtml(item.formula)} ${formatAmount(item.massG, 4)} g`).join(', ')}</p>`
      : '';
    const separated = result.separatedSolids.length
      ? `<p class="small mb-1"><strong>Filtered residue:</strong> ${result.separatedSolids.map((item) => `${escapeHtml(item.formula)} ${formatAmount(item.massG, 4)} g`).join(', ')}</p>`
      : '';
    const reactions = result.reactions.map((reaction) => `<p class="small mb-1"><strong>${escapeHtml(reaction.equation)}</strong><br>${escapeHtml(reaction.observation)}</p>`).join('');
    const modeledPH = Simulation.calculatePH(container);
    const pHText = result.pH !== null
      ? `<p class="small mb-1"><strong>Calculated ideal dilute pH:</strong> ${result.pH.toFixed(2)}</p>`
      : modeledPH !== null
        ? '<p class="small text-muted mb-1">pH model available; use Measure pH to record a value.</p>'
        : '<p class="small text-muted mb-1">pH model not available for this composition.</p>';
    target.innerHTML = `<p class="small mb-1"><strong>Volume:</strong> ${formatAmount(result.volumeMl, 2)} / ${result.capacityMl} mL</p>
      ${pHText}
      ${species}${precipitates}${separated}${reactions}`;
  }
  function renderTabs() {
    const guide = guides[state.experimentKey] || guides['open-lab'];
    const panel = document.querySelector('[data-bench-panel="procedure"]');
    panel.innerHTML = `<strong>${escapeHtml(guide.title)}</strong><ol>${guide.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol>`;
    const historyPanel = document.querySelector('[data-bench-panel="history"]');
    historyPanel.innerHTML = state.history.length
      ? `<ol class="mb-0">${state.history.slice(-25).reverse().map((entry) => `<li>${escapeHtml(new Date(entry.at).toLocaleTimeString())} — ${escapeHtml(entry.message)}</li>`).join('')}</ol>`
      : '<p class="text-muted mb-0">No observations recorded yet.</p>';
    byId('chem-bench-hypothesis').value = state.notebook.hypothesis || '';
    byId('chem-bench-notes').value = state.notebook.notes || '';
    document.querySelectorAll('[data-bench-tab]').forEach((tab) => {
      const active = tab.getAttribute('data-bench-tab') === currentTab;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-bench-panel]').forEach((section) => {
      section.hidden = section.getAttribute('data-bench-panel') !== currentTab;
    });
  }
  function renderPreparationAnimation() {
    const host = byId('chem-ammonium-animation');
    if (!host) return;
    const active = state.experimentKey === 'ammonium-sulfate-preparation';
    host.hidden = !active;
    byId('chem-ammonium-safety').hidden = !active;
    if (!active) return;
    host.dataset.phase = animationPhase;
    const step = animationSteps.find((item) => item.phase === animationPhase) || animationSteps[0];
    byId('chem-ammonium-animation-status').textContent = step.label;
  }
  function replayPreparationAnimation() {
    clearTimeout(animationTimer);
    let index = 0;
    const advance = () => {
      animationPhase = animationSteps[index].phase;
      renderPreparationAnimation();
      index += 1;
      if (index < animationSteps.length) animationTimer = setTimeout(advance, 850);
    };
    advance();
  }
  function render() {
    if (!state) return;
    renderStockroom();
    byId('chem-bench-reagent').value = selectedReagent;
    renderVessels();
    renderApparatus();
    renderInspection();
    renderTabs();
    renderPreparationAnimation();
    byId('chem-bench-title').value = state.title;
  }
  function populateEquipmentChoices() {
    const vessels = apparatusChoices.filter((item) => item.kind === 'vessel');
    const tools = apparatusChoices.filter((item) => item.kind === 'apparatus');
    byId('chem-bench-vessel-type').innerHTML = vessels.map((item) =>
      `<option value="${escapeHtml(item.type)}">${escapeHtml(item.name)}</option>`
    ).join('');
    byId('chem-bench-apparatus-type').innerHTML = tools.map((item) =>
      `<option value="${escapeHtml(item.type)}">${escapeHtml(item.name)}</option>`
    ).join('');
  }
  function currentNotebook() {
    state.notebook = {
      hypothesis: byId('chem-bench-hypothesis').value,
      notes: byId('chem-bench-notes').value
    };
    return state.notebook;
  }
  function performAction(action) {
    const target = byId('chem-bench-target').value;
    const selected = apparatusChoices.find((item) => item.type === byId('chem-bench-vessel-type').value);
    const volume = Number(byId('chem-bench-volume').value);
    const mass = Number(byId('chem-bench-mass').value);
    if (action === 'add-vessel') return commit(() => Simulation.addContainer(state, selected.type), 'Vessel placed on the workbench.');
    if (action === 'add-apparatus') {
      const type = byId('chem-bench-apparatus-type').value;
      return commit(() => Simulation.addApparatus(state, type), `${Simulation.APPARATUS[type].label} added.`);
    }
    if (action === 'add-liquid') {
      return commit(() => Simulation.transferFromStock(state, selectedReagent, volume, target), `${formatAmount(volume, 2)} mL transferred.`);
    }
    if (action === 'add-solid') {
      return commit(() => Simulation.addSolid(state, selectedReagent, mass, target), `${formatAmount(mass, 3)} g added.`);
    }
    if (action === 'mix') {
      return commit(() => {
        const result = Simulation.mix(state, target);
        if (state.experimentKey === 'ammonium-sulfate-preparation'
          && result.reactions.some((reaction) => reaction.reactionId === 'ammonium-sulfate-neutralisation')) {
          animationPhase = 'mixing';
        }
        setStatus(result.message, result.unsupported ? '' : 'success');
      }, 'Mixture inspected.');
    }
    if (action === 'filter') {
      const receiver = byId('chem-bench-destination').value;
      return commit(() => Simulation.filterPrecipitate(state, target, receiver), 'Precipitate separated; filtrate and residue are recorded in different vessels.');
    }
    if (action === 'between') {
      const amount = Number(byId('chem-bench-transfer-volume').value);
      return commit(() => Simulation.transferBetweenContainers(
        state, byId('chem-bench-source').value, byId('chem-bench-destination').value, amount
      ), `${formatAmount(amount, 2)} mL transferred between vessels.`);
    }
    if (action === 'final-volume') {
      const finalVolume = Number(byId('chem-bench-final-volume').value);
      return commit(() => Simulation.setFinalVolume(state, target, finalVolume), `Volumetric flask brought to ${formatAmount(finalVolume, 2)} mL.`);
    }
    if (action === 'measure-ph') {
      if (!target) return setStatus('Add a vessel before measuring pH.', 'error');
      return commit(() => {
        const container = state.containers.find((item) => item.id === target);
        const pH = Simulation.calculatePH(container);
        if (pH === null) throw new RangeError('The pH model supports only dilute strong hydrochloric acid and sodium hydroxide solutions.');
        container.pH = pH;
        state.history.push({ type: 'MEASURE_PH', message: `Ideal dilute-solution pH measured as ${pH.toFixed(2)}.`, at: new Date().toISOString() });
      }, 'pH measurement recorded using the ideal dilute-solution model.');
    }
  }
  async function request(url, options) {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    let data;
    try { data = await response.json(); } catch { throw new Error(`Server returned an invalid response (${response.status}).`); }
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }
  async function refreshSavedRuns() {
    const list = byId('chem-bench-saved-runs');
    list.textContent = 'Loading saved practicals…';
    try {
      const data = await request(`${API}/runs`);
      list.innerHTML = data.runs.length ? data.runs.map((run) => `<button type="button" class="chem-stock-item" data-load-run="${escapeHtml(run.id)}">
        <span>${escapeHtml(run.title)}<small class="d-block">${escapeHtml(run.experiment_key)} · v${run.version}</small></span>
        <small>${escapeHtml(new Date(run.updated_at).toLocaleDateString())}</small>
      </button>`).join('') : '<p class="small text-muted">No saved practicals yet. Save a run to return to it later.</p>';
    } catch (error) {
      list.textContent = error.message;
    }
  }
  async function saveRun() {
    currentNotebook();
    state.title = byId('chem-bench-title').value.trim() || guides[state.experimentKey].title;
    try {
      const data = await request(`${API}/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: savedRunId,
          title: state.title,
          experimentKey: state.experimentKey,
          version: state.version,
          state,
          notebook: state.notebook
        })
      });
      savedRunId = data.id;
      isDirty = false;
      setStatus('Practical saved to your account.', 'success');
      await refreshSavedRuns();
    } catch (error) {
      setStatus(`Save failed: ${error.message}`, 'error');
    }
  }
  async function loadRun(id) {
    try {
      const data = await request(`${API}/runs/${encodeURIComponent(id)}`);
      const run = data.run;
      const loaded = typeof run.state_json === 'string' ? JSON.parse(run.state_json) : run.state_json;
      for (const chemical of Object.values(Simulation.CHEMICALS)) {
        if (loaded.stock[chemical.id]) continue;
        loaded.stock[chemical.id] = chemical.state === 'solid'
          ? { grams: chemical.stockG }
          : { ml: chemical.stockMl };
      }
      Simulation.validateState(loaded);
      state = loaded;
      state.title = run.title;
      state.experimentKey = run.experiment_key;
      state.notebook = typeof run.notebook_json === 'string' ? JSON.parse(run.notebook_json) : run.notebook_json;
      savedRunId = run.id;
      undoStack = [];
      isDirty = false;
      selectedReagent = state.experimentKey === 'glucose-dilution' ? 'glucose'
        : state.experimentKey === 'ammonium-sulfate-preparation' ? 'sulfuric_acid' : 'hydrochloric_acid';
      byId('chem-bench-practical').value = state.experimentKey;
      render();
      setStatus('Saved practical restored.', 'success');
    } catch (error) {
      setStatus(`Could not restore practical: ${error.message}`, 'error');
    }
  }
  function choosePractical(key) {
    if (isDirty && !window.confirm('Start another practical? Unsaved changes to this run will be lost.')) {
      byId('chem-bench-practical').value = state.experimentKey;
      return;
    }
    initialisePractical(key);
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!Simulation || !byId('chem-bench-container')) return;
    populateEquipmentChoices();
    Object.keys(Simulation.CHEMICALS).forEach((id) => {
      const chemical = Simulation.CHEMICALS[id];
      if (chemical.availableAsStock === false) return;
      byId('chem-bench-reagent').insertAdjacentHTML('beforeend', `<option value="${id}">${escapeHtml(reagentNames[id] || chemical.name)}</option>`);
    });
    state = Simulation.makeState();
    render();
    refreshSavedRuns();

    byId('chem-bench-stock-search').addEventListener('input', renderStockroom);
    byId('chem-bench-practical').addEventListener('change', (event) => choosePractical(event.target.value));
    byId('chem-bench-target').addEventListener('change', (event) => {
      state.selectedContainerId = event.target.value || null;
      render();
    });
    byId('chem-bench-reagent').addEventListener('change', (event) => {
      selectedReagent = event.target.value;
      renderStockroom();
    });
    byId('chem-bench-title').addEventListener('input', (event) => {
      state.title = event.target.value;
      isDirty = true;
    });
    byId('chem-bench-hypothesis').addEventListener('input', (event) => {
      state.notebook.hypothesis = event.target.value;
      isDirty = true;
    });
    byId('chem-bench-notes').addEventListener('input', (event) => {
      state.notebook.notes = event.target.value;
      isDirty = true;
    });
    document.querySelectorAll('[data-bench-tab]').forEach((tab) => tab.addEventListener('click', () => {
      currentTab = tab.getAttribute('data-bench-tab');
      if (currentTab === 'saved') refreshSavedRuns();
      renderTabs();
    }));
    byId('chem-bench-container').addEventListener('click', (event) => {
      const reagentButton = event.target.closest('[data-reagent]');
      if (reagentButton) {
        selectedReagent = reagentButton.getAttribute('data-reagent');
        byId('chem-bench-reagent').value = selectedReagent;
        renderStockroom();
        return;
      }
      const vesselButton = event.target.closest('[data-container-id]');
      if (vesselButton) {
        state.selectedContainerId = vesselButton.getAttribute('data-container-id');
        render();
        return;
      }
      const apparatusButton = event.target.closest('[data-remove-apparatus]');
      if (apparatusButton) {
        const id = apparatusButton.getAttribute('data-remove-apparatus');
        return commit(() => Simulation.removeApparatus(state, id), 'Apparatus removed.');
      }
      const containerRemoveButton = event.target.closest('[data-remove-container]');
      if (containerRemoveButton) {
        const id = containerRemoveButton.getAttribute('data-remove-container');
        const container = state.containers.find((item) => item.id === id);
        if (container && window.confirm(`Remove ${container.label} and discard its contents?`)) {
          commit(() => Simulation.removeContainer(state, id), 'Vessel removed; its contents were discarded.');
        }
        return;
      }
      const runButton = event.target.closest('[data-load-run]');
      if (runButton) {
        if (!isDirty || window.confirm('Restore this saved practical? Unsaved changes to the current run will be lost.')) loadRun(runButton.getAttribute('data-load-run'));
        return;
      }
      const actionButton = event.target.closest('[data-bench-action]');
      if (event.target.closest('[data-bench-animation]')) {
        replayPreparationAnimation();
        return;
      }
      if (!actionButton) return;
      const action = actionButton.getAttribute('data-bench-action');
      if (action === 'save') return saveRun();
      if (action === 'reset') {
        if (!isDirty || window.confirm('Reset this practical? Unsaved measurements and notes will be lost.')) initialisePractical(state.experimentKey);
        return;
      }
      if (action === 'undo') {
        if (!undoStack.length) return setStatus('There are no actions to undo.', '');
        redoStack.push(JSON.stringify(state));
        state = JSON.parse(undoStack.pop());
        isDirty = true;
        render();
        setStatus('Last action undone.', 'success');
        return;
      }
      if (action === 'redo') {
        if (!redoStack.length) return setStatus('There are no actions to redo.', '');
        undoStack.push(JSON.stringify(state));
        state = JSON.parse(redoStack.pop());
        isDirty = true;
        render();
        setStatus('Last undone action restored.', 'success');
        return;
      }
      performAction(action);
    });
  });
})();
