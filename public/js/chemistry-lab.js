/**
 * Advanced Interactive Chemistry & Chemical Sciences Laboratory
 * Main Orchestrator — Client-side IIFE
 * Wires together: ChemData, ChemCanvas, Chem3DEngine, backend API, CBT integration
 */

(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================
  var state = {
    activeMode:    'canvas2d',   // canvas2d | molecular3d | periodic | charts | experiments
    activeTopic:   'intro-chemistry',
    topics:        [],
    activeTool:    'select',
    simulationRunning: false,
    titration: {
      buretteInitial: 0.00,
      buretteFinal:   0.00,
      concentration:  0.10,
      moleRatio:      1,
      volume:         25.0,
      dataPoints:     [],
      running:        false
    },
    energetics: { type: 'exothermic', Ea: 80, deltaH: -60 },
    selectedElement: null,
    calcResults: {}
  };

  // 33-Topic Fallback Registry
  var FALLBACK_TOPICS = [
    { code:'intro-chemistry',      title:'Introduction to Chemistry',       branch:'Foundations',           icon:'fa-flask' },
    { code:'lab-safety',           title:'Laboratory Safety & Hazard Signs', branch:'Foundations',           icon:'fa-shield-halved' },
    { code:'apparatus-library',    title:'Apparatus Library & Glassware',   branch:'Foundations',           icon:'fa-flask-vial' },
    { code:'matter-states',        title:'Matter & States of Matter',       branch:'Physical Chemistry',    icon:'fa-cubes' },
    { code:'atomic-structure',     title:'Atomic Structure',                branch:'Physical Chemistry',    icon:'fa-atom' },
    { code:'periodic-table',       title:'Periodic Table',                  branch:'Inorganic Chemistry',   icon:'fa-table-cells' },
    { code:'chemical-bonding',     title:'Chemical Bonding',                branch:'Physical Chemistry',    icon:'fa-link' },
    { code:'molecular-geometry',   title:'Molecular Geometry (VSEPR)',      branch:'Physical Chemistry',    icon:'fa-shapes' },
    { code:'chemical-formulae',    title:'Chemical Formulae & Nomenclature',branch:'Foundations',           icon:'fa-superscript' },
    { code:'chemical-equations',   title:'Chemical Equations & Balancing',  branch:'Foundations',           icon:'fa-equals' },
    { code:'mole-concept',         title:'Mole Concept & Avogadro',         branch:'Physical Chemistry',    icon:'fa-calculator' },
    { code:'stoichiometry',        title:'Stoichiometry',                   branch:'Physical Chemistry',    icon:'fa-scale-balanced' },
    { code:'acids-bases-salts',    title:'Acids, Bases & Salts',            branch:'Physical Chemistry',    icon:'fa-vial-circle-check' },
    { code:'titration',            title:'Titration Laboratory',            branch:'Analytical Chemistry',  icon:'fa-droplet' },
    { code:'chemical-reactions',   title:'Chemical Reactions',              branch:'Physical Chemistry',    icon:'fa-fire' },
    { code:'energetics',           title:'Chemical Energetics',             branch:'Physical Chemistry',    icon:'fa-temperature-high' },
    { code:'reaction-kinetics',    title:'Reaction Kinetics',               branch:'Physical Chemistry',    icon:'fa-chart-line' },
    { code:'equilibrium',          title:'Chemical Equilibrium',            branch:'Physical Chemistry',    icon:'fa-arrows-left-right' },
    { code:'electrochemistry',     title:'Electrochemistry',                branch:'Physical Chemistry',    icon:'fa-bolt' },
    { code:'redox-chemistry',      title:'Redox Chemistry',                 branch:'Physical Chemistry',    icon:'fa-exchange-alt' },
    { code:'organic-chemistry',    title:'Organic Chemistry',               branch:'Organic Chemistry',     icon:'fa-dna' },
    { code:'inorganic-chemistry',  title:'Inorganic Chemistry',             branch:'Inorganic Chemistry',   icon:'fa-gem' },
    { code:'analytical-chemistry', title:'Analytical Chemistry & Qualitative',branch:'Analytical Chemistry',icon:'fa-magnifying-glass' },
    { code:'separation-techniques','title':'Separation Techniques',         branch:'Analytical Chemistry',  icon:'fa-filter' },
    { code:'gas-chemistry',        title:'Gas Chemistry & Gas Laws',        branch:'Physical Chemistry',    icon:'fa-wind' },
    { code:'water-chemistry',      title:'Water Chemistry',                 branch:'Environmental Chemistry',icon:'fa-droplet' },
    { code:'environmental-chemistry','title':'Environmental Chemistry',     branch:'Environmental Chemistry',icon:'fa-leaf' },
    { code:'industrial-chemistry', title:'Industrial Chemistry',            branch:'Applied Chemistry',     icon:'fa-industry' },
    { code:'nuclear-chemistry',    title:'Nuclear Chemistry',               branch:'Physical Chemistry',    icon:'fa-radiation' },
    { code:'biochemistry',         title:'Biochemistry',                    branch:'Biochemistry',          icon:'fa-dna' },
    { code:'virtual-experiments',  title:'Virtual Experiments Workbench',   branch:'Laboratory Practicals', icon:'fa-microscope' },
    { code:'graphing-analysis',    title:'Graphing & Data Analysis',        branch:'Scientific Computing',  icon:'fa-chart-line' },
    { code:'practical-assessments','title':'Practical Assessments & CBT',   branch:'Assessment',            icon:'fa-pen-to-square' }
  ];

  var TOPIC_MODE_MAP = {
    'intro-chemistry':       'canvas2d',
    'lab-safety':            'canvas2d',
    'apparatus-library':     'canvas2d',
    'matter-states':         'canvas2d',
    'atomic-structure':      'molecular3d',
    'periodic-table':        'periodic',
    'chemical-bonding':      'molecular3d',
    'molecular-geometry':    'molecular3d',
    'chemical-formulae':     'canvas2d',
    'chemical-equations':    'canvas2d',
    'mole-concept':          'canvas2d',
    'stoichiometry':         'canvas2d',
    'acids-bases-salts':     'canvas2d',
    'titration':             'canvas2d',
    'chemical-reactions':    'canvas2d',
    'energetics':            'charts',
    'reaction-kinetics':     'charts',
    'equilibrium':           'charts',
    'electrochemistry':      'canvas2d',
    'redox-chemistry':       'canvas2d',
    'organic-chemistry':     'molecular3d',
    'inorganic-chemistry':   'canvas2d',
    'analytical-chemistry':  'canvas2d',
    'separation-techniques': 'canvas2d',
    'gas-chemistry':         'canvas2d',
    'water-chemistry':       'canvas2d',
    'environmental-chemistry':'canvas2d',
    'industrial-chemistry':  'canvas2d',
    'nuclear-chemistry':     'charts',
    'biochemistry':          'molecular3d',
    'virtual-experiments':   'experiments',
    'graphing-analysis':     'charts',
    'practical-assessments': 'canvas2d'
  };

  // ============================================================
  // INIT
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    renderTopicList(FALLBACK_TOPICS);
    setupModeButtons();
    setupMobileTopicsPanel();
    setupToolbar();
    setupHudTabs();
    setupEquationBalancer();
    setupMoleCalculator();
    setupStoichiometryCalc();
    setupPhCalculator();
    setupTitrationLab();
    setupEnergyProfile();
    setupExperimentBuilder();
    setupApparatusPanel();
    setup3DViewer();
    setupPeriodicTable();
    loadTopicsFromAPI();
    initCanvas();
    setupModals();
    selectTopic('intro-chemistry');
  });

  // ============================================================
  // TOPIC LIST
  // ============================================================
  function renderTopicList(topics) {
    state.topics = topics;
    var listEl = document.getElementById('chem-topics-list');
    if (!listEl) return;

    var branches = {};
    topics.forEach(function (t, idx) {
      var br = t.branch || 'General';
      if (!branches[br]) branches[br] = [];
      branches[br].push(Object.assign({ _idx: idx }, t));
    });

    var html = '';
    Object.keys(branches).forEach(function (br) {
      html += '<div class="chem-branch-label">' + escHtml(br) + '</div>';
      branches[br].forEach(function (t) {
        var activeClass = (t.code === state.activeTopic) ? ' active' : '';
        html += '<div class="chem-topic-item' + activeClass + '" data-code="' + escHtml(t.code) + '" title="' + escHtml(t.title) + '">' +
          '<i class="fa-solid ' + (t.icon || 'fa-flask') + '"></i>' +
          '<span>' + escHtml(t.title) + '</span>' +
          '<span class="chem-topic-num">' + (t._idx + 1) + '</span>' +
          '</div>';
      });
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll('.chem-topic-item').forEach(function (el) {
      el.addEventListener('click', function () {
        var code = el.getAttribute('data-code');
        selectTopic(code);
      });
    });
  }

  function loadTopicsFromAPI() {
    fetch('/api/chemistry/topics', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success && d.topics && d.topics.length > 0) renderTopicList(d.topics);
      })
      .catch(function () { /* keep fallback */ });
  }

  // ============================================================
  // TOPIC SELECTION
  // ============================================================
  function selectTopic(code) {
    document.body.classList.remove('chem-mobile-topics-open');
    var mobileTopicsButton = document.querySelector('[data-chem-mobile-topics]');
    if (mobileTopicsButton) mobileTopicsButton.setAttribute('aria-pressed', 'false');
    state.activeTopic = code;
    document.querySelectorAll('.chem-topic-item').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-code') === code);
    });
    var mode = TOPIC_MODE_MAP[code] || 'canvas2d';
    switchMode(mode);
    updateInspector(code);
    syncCanvasToTopic(code);
    if (mode === 'molecular3d') sync3DToTopic(code);
    if (mode === 'periodic')    renderPeriodicTable();
    if (mode === 'charts')      syncChartToTopic(code);
  }

  // ============================================================
  // MODE SWITCHING
  // ============================================================
  function switchMode(mode) {
    state.activeMode = mode;
    var modes = {
      canvas2d:    'chem-canvas-container',
      molecular3d: 'chem-3d-container',
      periodic:    'chem-periodic-container',
      charts:      'chem-chart-container',
      experiments: 'chem-experiment-container',
      bench:       'chem-bench-container'
    };
    Object.keys(modes).forEach(function (m) {
      var el = document.getElementById(modes[m]);
      if (el) el.style.display = (m === mode) ? 'block' : 'none';
    });
    document.body.classList.toggle('chem-bench-active', mode === 'bench');
    document.querySelectorAll('.chem-mode-pill').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });

    if (mode === 'canvas2d' && window.ChemCanvas) {
      setTimeout(function () { window.ChemCanvas.resize(); }, 50);
    }
  }

  function setupModeButtons() {
    document.querySelectorAll('.chem-mode-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        switchMode(btn.getAttribute('data-mode'));
      });
    });
  }

  function setupMobileTopicsPanel() {
    var button = document.querySelector('[data-chem-mobile-topics]');
    if (!button) return;
    button.addEventListener('click', function () {
      var isOpen = document.body.classList.toggle('chem-mobile-topics-open');
      button.setAttribute('aria-pressed', String(isOpen));
    });
  }

  // ============================================================
  // CANVAS 2D
  // ============================================================
  function initCanvas() {
    var canvasEl = document.getElementById('chem-lab-canvas');
    if (!canvasEl || !window.ChemCanvas) return;
    canvasEl.width  = canvasEl.parentElement.clientWidth || 800;
    canvasEl.height = canvasEl.parentElement.clientHeight || 500;
    window.ChemCanvas.init(canvasEl, function (obj) {
      showObjectProperties(obj);
    });
    new ResizeObserver(function () { window.ChemCanvas.resize(); }).observe(canvasEl.parentElement);
  }

  function syncCanvasToTopic(code) {
    if (!window.ChemCanvas) return;
    ChemCanvas.clearObjects();
    var canvasEl = document.getElementById('chem-lab-canvas');
    var cx = canvasEl ? (canvasEl.width / 2) : 320;
    var cy = canvasEl ? (canvasEl.height / 2) : 220;

    switch (code) {
      case 'titration':
        ChemCanvas.addObject('burette', cx - 70, cy - 60, { label: '0.100 M HCl', reading: 0, height: 160, liquidColor: 'rgba(8,145,178,0.5)' });
        ChemCanvas.addObject('conical_flask', cx - 70, cy + 100, { label: '25.0 mL NaOH', fillFraction: 0.5, liquidColor: 'rgba(252,196,48,0.5)' });
        ChemCanvas.addObject('ph_strip', cx + 90, cy, { pH: 13 });
        break;
      case 'electrochemistry':
        ChemCanvas.addObject('electrolysis', cx, cy, { label: 'Electrolysis of CuSO₄', width: 220, height: 140 });
        break;
      case 'apparatus-library':
        ChemCanvas.addObject('beaker', cx - 140, cy, { label: '250 mL Beaker', fillFraction: 0.45, width: 75, height: 85 });
        ChemCanvas.addObject('conical_flask', cx, cy, { label: 'Conical Flask', fillFraction: 0.4 });
        ChemCanvas.addObject('test_tube', cx + 110, cy - 20, { label: 'Test Tube', height: 75 });
        ChemCanvas.addObject('thermometer', cx + 170, cy, { temperature: 25, height: 110 });
        break;
      case 'chemical-reactions':
        ChemCanvas.addObject('beaker', cx - 90, cy, { label: 'Reactant A', fillFraction: 0.5, liquidColor: 'rgba(8,145,178,0.4)' });
        ChemCanvas.addObject('arrow_reaction', cx, cy, { conditions: 'Catalyst / Heat' });
        ChemCanvas.addObject('beaker', cx + 90, cy, { label: 'Product B', fillFraction: 0.45, liquidColor: 'rgba(220,38,38,0.4)' });
        break;
      case 'acids-bases-salts':
        ChemCanvas.addObject('ph_strip', cx, cy - 40, { pH: 7.0 });
        ChemCanvas.addObject('beaker', cx - 90, cy + 40, { label: 'Acid (HCl)', fillFraction: 0.5, liquidColor: 'rgba(220,38,38,0.35)' });
        ChemCanvas.addObject('beaker', cx + 90, cy + 40, { label: 'Alkali (NaOH)', fillFraction: 0.5, liquidColor: 'rgba(37,99,235,0.35)' });
        break;
      case 'separation-techniques':
        ChemCanvas.addObject('separating_funnel', cx - 60, cy - 30, { liquidColor: 'rgba(8,145,178,0.45)', width: 60, height: 120 });
        ChemCanvas.addObject('beaker', cx + 70, cy + 60, { label: 'Receiver Beaker', fillFraction: 0.3, liquidColor: 'rgba(220,38,38,0.3)' });
        break;
      case 'lab-safety':
        ChemCanvas.addObject('molecule_label', cx, cy - 30, { formula: 'Laboratory Safety', fontSize: 20, color: '#DC2626' });
        ChemCanvas.addObject('molecule_label', cx, cy + 25, { formula: 'GHS Symbols & Personal Protective Equipment', fontSize: 13, color: '#475569' });
        break;
      default:
        var t = FALLBACK_TOPICS.find(function(tp){ return tp.code === code; });
        if (t) {
          ChemCanvas.addObject('molecule_label', cx, cy, { formula: t.title, fontSize: 16, color: '#7C3AED', sublabel: 'Interactive Lab Workbench' });
        }
        break;
    }
  }

  // ============================================================
  // TOOLBAR
  // ============================================================
  function setupToolbar() {
    document.querySelectorAll('.chem-tool-btn[data-tool]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var tool = btn.getAttribute('data-tool');
        state.activeTool = tool;
        document.querySelectorAll('.chem-tool-btn[data-tool]').forEach(function (b) {
          b.classList.toggle('active', b === btn);
        });
        if (tool === 'delete' && window.ChemCanvas) ChemCanvas.deleteSelected();
        if (tool === 'duplicate' && window.ChemCanvas) ChemCanvas.duplicateSelected();
        if (tool === 'clear' && window.ChemCanvas) {
          if (confirm('Clear workspace?')) { ChemCanvas.clearObjects(); syncCanvasToTopic(state.activeTopic); }
        }
      });
    });
  }

  // ============================================================
  // HUD
  // ============================================================
  function setupHudTabs() {
    document.querySelectorAll('.chem-hud-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-target');
        document.querySelectorAll('.chem-hud-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('.chem-hud-panel').forEach(function (p) {
          p.style.display = p.id === target ? 'block' : 'none';
        });
      });
    });
  }

  // ============================================================
  // INSPECTOR
  // ============================================================
  function updateInspector(code) {
    var el = document.getElementById('chem-inspector-body');
    if (!el) return;
    var topic = state.topics.find(function (t) { return t.code === code; }) ||
                FALLBACK_TOPICS.find(function (t) { return t.code === code; });
    if (!topic) { el.innerHTML = '<p class="text-muted small">Select a topic.</p>'; return; }

    el.innerHTML =
      '<div class="chem-formula-box"><i class="fa-solid ' + (topic.icon || 'fa-flask') + ' me-2"></i>' + escHtml(topic.title) + '</div>' +
      '<div class="chem-prop-row"><span class="chem-prop-label">Branch</span><span class="chem-prop-val">' + escHtml(topic.branch || 'Chemistry') + '</span></div>' +
      (topic.description ? '<p class="small text-muted mt-2 mb-3" style="line-height:1.55;">' + escHtml(topic.description) + '</p>' : '') +
      (topic.keyConcepts && topic.keyConcepts.length ? '<div class="mb-2"><div class="small fw-bold text-dark mb-1">Key Concepts</div>' +
        topic.keyConcepts.map(function (k) { return '<span class="badge bg-primary-subtle text-primary border border-primary-subtle me-1 mb-1">' + escHtml(k) + '</span>'; }).join('') + '</div>' : '') +
      getTopicWidget(code) +
      '<button class="btn btn-primary btn-sm w-100 mt-2" id="btn-start-practice"><i class="fa-solid fa-play me-1"></i> Start Interactive Practice</button>';

    var btn = document.getElementById('btn-start-practice');
    if (btn) btn.addEventListener('click', function () { launchTopicActivity(code); });
  }

  function showObjectProperties(obj) {
    var el = document.getElementById('chem-inspector-body');
    if (!el || !obj) return;
    el.innerHTML =
      '<div class="chem-formula-box mb-2">' + escHtml(obj.label || obj.type) + '</div>' +
      '<div class="chem-prop-row"><span class="chem-prop-label">Type</span><span class="chem-prop-val">' + escHtml(obj.type) + '</span></div>' +
      '<div class="chem-prop-row"><span class="chem-prop-label">Position</span><span class="chem-prop-val">(' + Math.round(obj.x) + ', ' + Math.round(obj.y) + ')</span></div>' +
      (obj.fillFraction !== undefined ? '<div class="chem-prop-row"><span class="chem-prop-label">Fill</span><span class="chem-prop-val">' + Math.round(obj.fillFraction * 100) + '%</span></div>' : '') +
      (obj.temperature !== undefined ? '<div class="chem-prop-row"><span class="chem-prop-label">Temperature</span><span class="chem-prop-val">' + obj.temperature + '°C</span></div>' : '') +
      (obj.reading !== undefined ? '<div class="chem-prop-row"><span class="chem-prop-label">Burette</span><span class="chem-prop-val">' + obj.reading.toFixed(2) + ' mL</span></div>' : '') +
      '<div class="mt-3 d-flex gap-2">' +
      '<button class="btn btn-sm btn-outline-danger" onclick="ChemCanvas.deleteSelected();"><i class="fa-solid fa-trash me-1"></i>Delete</button>' +
      '<button class="btn btn-sm btn-outline-secondary" onclick="ChemCanvas.duplicateSelected();"><i class="fa-solid fa-copy me-1"></i>Duplicate</button>' +
      '</div>';
  }

  function getTopicWidget(code) {
    switch (code) {
      case 'chemical-equations':
        return '<div class="card bg-light border-0 p-2 mb-2"><button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#modal-equation-balancer"><i class="fa-solid fa-equals me-1"></i> Open Equation Balancer</button></div>';
      case 'mole-concept':
        return '<div class="card bg-light border-0 p-2 mb-2"><button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#modal-mole-calc"><i class="fa-solid fa-calculator me-1"></i> Open Mole Calculator</button></div>';
      case 'stoichiometry':
        return '<div class="card bg-light border-0 p-2 mb-2"><button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#modal-stoich-calc"><i class="fa-solid fa-scale-balanced me-1"></i> Open Stoichiometry Calculator</button></div>';
      case 'acids-bases-salts':
        return '<div class="card bg-light border-0 p-2 mb-2"><button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#modal-ph-calc"><i class="fa-solid fa-vial me-1"></i> Open pH Calculator</button></div>';
      case 'titration':
        return '<div class="card bg-light border-0 p-2 mb-2"><div class="small fw-bold mb-1"><i class="fa-solid fa-droplet text-primary me-1"></i>Titration Lab</div><div class="small text-muted mb-2">Perform virtual acid-base titration below and plot the curve.</div><button class="btn btn-sm btn-primary w-100" onclick="document.querySelector(\'[data-target=hud-titration]\').click();"><i class="fa-solid fa-eye me-1"></i> View Titration Bench</button></div>';
      case 'gas-chemistry':
        return '<div class="card bg-light border-0 p-2 mb-2"><button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#modal-gas-law"><i class="fa-solid fa-wind me-1"></i> Open Gas Law Calculator</button></div>';
      case 'analytical-chemistry':
        return '<div class="card bg-light border-0 p-2 mb-2"><button class="btn btn-sm btn-outline-primary w-100" data-bs-toggle="modal" data-bs-target="#modal-ion-tests"><i class="fa-solid fa-magnifying-glass me-1"></i> Qualitative Analysis Reference</button></div>';
      case 'energetics':
        return '<div class="card bg-light border-0 p-2 mb-2"><div class="d-flex gap-2"><button class="btn btn-sm btn-outline-danger flex-fill" onclick="renderEnergyProfile(\'exothermic\')">Exothermic</button><button class="btn btn-sm btn-outline-primary flex-fill" onclick="renderEnergyProfile(\'endothermic\')">Endothermic</button></div></div>';
      default:
        return '';
    }
  }

  // ============================================================
  // 3D VIEWER
  // ============================================================
  function setup3DViewer() {
    function tryInit() {
      if (typeof Chem3DEngine !== 'undefined' && typeof THREE !== 'undefined') {
        Chem3DEngine.init('chem-3d-scene');
        Chem3DEngine.buildMolecule('H2O');
      }
    }
    if (typeof THREE !== 'undefined') tryInit();
    else {
      var interval = setInterval(function () {
        if (typeof THREE !== 'undefined') { clearInterval(interval); tryInit(); }
      }, 200);
    }

    var sel = document.getElementById('chem-3d-mol-select');
    if (sel) {
      sel.addEventListener('change', function () {
        if (window.Chem3DEngine) Chem3DEngine.buildMolecule(sel.value);
      });
    }

    var atomicBtn = document.getElementById('btn-3d-atomic');
    if (atomicBtn) {
      atomicBtn.addEventListener('click', function () {
        var zEl = document.getElementById('inp-atomic-Z');
        var aEl = document.getElementById('inp-atomic-A');
        var Z = zEl ? parseInt(zEl.value, 10) : 6;
        var A = aEl ? parseInt(aEl.value, 10) : 12;
        if (window.Chem3DEngine) Chem3DEngine.buildAtomicModel({ protons: Z, neutrons: A - Z });
      });
    }

    var vseprBtn = document.getElementById('btn-3d-vsepr');
    if (vseprBtn) {
      vseprBtn.addEventListener('click', function () {
        var vEl = document.getElementById('chem-vsepr-select');
        var geom = vEl ? vEl.value : 'tetrahedral';
        if (window.Chem3DEngine) Chem3DEngine.buildVSEPR(geom);
      });
    }

    var rotBtn = document.getElementById('btn-3d-rotate-toggle');
    if (rotBtn) {
      rotBtn.addEventListener('click', function () {
        state.simulationRunning = !state.simulationRunning;
        if (window.Chem3DEngine) Chem3DEngine.setAnimating(!state.simulationRunning);
        rotBtn.innerHTML = state.simulationRunning ? '<i class="fa-solid fa-play"></i>' : '<i class="fa-solid fa-pause"></i>';
      });
    }

    var resetBtn = document.getElementById('btn-3d-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        if (window.Chem3DEngine) Chem3DEngine.resetCamera();
      });
    }
  }

  function sync3DToTopic(code) {
    if (!window.Chem3DEngine) return;
    if (code === 'atomic-structure') {
      Chem3DEngine.buildAtomicModel({ protons: 6, neutrons: 6 });
    } else if (code === 'molecular-geometry') {
      Chem3DEngine.buildVSEPR('tetrahedral');
    } else if (code === 'organic-chemistry') {
      Chem3DEngine.buildMolecule('C2H4');
    } else {
      Chem3DEngine.buildMolecule('H2O');
    }
  }

  // ============================================================
  // PERIODIC TABLE
  // ============================================================
  function setupPeriodicTable() {
    var searchEl = document.getElementById('chem-periodic-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () { renderPeriodicTable(searchEl.value); });
    }
    var filterEl = document.getElementById('chem-periodic-filter');
    if (filterEl) {
      filterEl.addEventListener('change', function () { renderPeriodicTable('', filterEl.value); });
    }
  }

  function renderPeriodicTable(search, classFilter) {
    var gridEl = document.getElementById('chem-periodic-grid');
    if (!gridEl || typeof ChemData === 'undefined') return;
    var elems  = ChemData.ELEMENTS;
    var q      = (search || '').toLowerCase();
    var cf     = classFilter || '';

    var grid = {};
    elems.forEach(function (el) {
      if (!el.group || !el.period) return;
      var key = el.period + '_' + el.group;
      grid[key] = el;
    });

    var html = '';
    for (var period = 1; period <= 7; period++) {
      for (var group = 1; group <= 18; group++) {
        var el = grid[period + '_' + group];
        if (!el) {
          html += '<div></div>';
          continue;
        }
        var highlight = (!q && !cf) ||
          (q && (el.symbol.toLowerCase().includes(q) || el.name.toLowerCase().includes(q))) ||
          (cf && el.classification === cf);
        var opacity = (q || cf) && !highlight ? 'opacity:0.2;' : '';
        html += '<div class="chem-element-cell chem-elem-' + el.classification + '" ' +
          'style="' + opacity + '" data-z="' + el.Z + '" onclick="window.selectElement(' + el.Z + ')">' +
          '<div class="chem-elem-num">' + el.Z + '</div>' +
          '<div class="chem-elem-sym">' + escHtml(el.symbol) + '</div>' +
          '<div class="chem-elem-name">' + escHtml(el.name) + '</div>' +
          '<div class="chem-elem-mass">' + (el.atomicMass ? el.atomicMass.toFixed(el.atomicMass >= 100 ? 1 : 2) : '') + '</div>' +
          '</div>';
      }
    }
    gridEl.innerHTML = html;
  }

  window.selectElement = function (Z) {
    if (typeof ChemData === 'undefined') return;
    var el = ChemData.getElementById(Z);
    if (!el) return;
    state.selectedElement = el;

    var detailEl = document.getElementById('chem-element-detail');
    if (!detailEl) return;

    var oxidStates = (el.oxidationStates || []).join(', ');
    var enStr = el.electronegativity ? el.electronegativity.toFixed(2) : 'N/A';

    detailEl.innerHTML =
      '<div class="row g-2 mb-2">' +
      '<div class="col-3 text-center"><div style="font-size:36px;font-weight:800;color:#7C3AED;">' + escHtml(el.symbol) + '</div><div class="small text-muted">' + el.Z + '</div></div>' +
      '<div class="col-9"><div class="fw-bold fs-5">' + escHtml(el.name) + '</div>' +
      '<div class="small text-muted">' + escHtml(el.classification.replace('_', ' ')) + ' | Period ' + el.period + ', Group ' + (el.group || 'N/A') + '</div>' +
      '<div class="small">Atomic Mass: <strong>' + el.atomicMass + '</strong> g mol⁻¹</div>' +
      '</div></div>' +
      '<div class="chem-prop-row"><span class="chem-prop-label">Electron Configuration</span><span class="chem-prop-val small">' + escHtml(el.config) + '</span></div>' +
      '<div class="chem-prop-row"><span class="chem-prop-label">Electronegativity (Pauling)</span><span class="chem-prop-val">' + enStr + '</span></div>' +
      '<div class="chem-prop-row"><span class="chem-prop-label">Common Oxidation States</span><span class="chem-prop-val">' + escHtml(oxidStates) + '</span></div>' +
      '<div class="mt-3">' +
      '<button class="btn btn-sm btn-outline-primary w-100" onclick="if(window.Chem3DEngine){Chem3DEngine.buildAtomicModel({protons:' + el.Z + ',neutrons:' + Math.round(el.atomicMass - el.Z) + '});window.switchMode(\'molecular3d\');}"><i class="fa-solid fa-atom me-1"></i> Build 3D Atomic Model</button>' +
      '</div>';
  };

  window.switchMode = switchMode;

  // ============================================================
  // CHART SYNCHRONIZATION
  // ============================================================
  function syncChartToTopic(code) {
    if (code === 'energetics') {
      setTimeout(function () { renderEnergyProfile('exothermic'); }, 100);
    } else if (code === 'reaction-kinetics') {
      setTimeout(function () { renderKineticsGraph(); }, 100);
    } else if (code === 'nuclear-chemistry') {
      setTimeout(function () { renderHalfLifeGraph(); }, 100);
    }
  }

  window.renderEnergyProfile = function (type) {
    switchMode('charts');
    var canvasEl = document.getElementById('chem-energy-canvas');
    if (!canvasEl || !window.ChemCanvas) return;
    state.energetics.type = type;
    state.energetics.deltaH = (type === 'exothermic') ? -60 : 40;
    ChemCanvas.drawEnergyProfile(canvasEl, state.energetics);
  };

  function renderKineticsGraph() {
    var canvasEl = document.getElementById('chem-kinetics-canvas');
    if (!canvasEl) return;
    var cx  = canvasEl.getContext('2d');
    var w   = canvasEl.width, h = canvasEl.height;
    var pad = { top: 30, right: 30, bottom: 40, left: 50 };
    cx.clearRect(0, 0, w, h); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
    var plotW = w - pad.left - pad.right, plotH = h - pad.top - pad.bottom;

    cx.strokeStyle = '#334155'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.moveTo(pad.left, pad.top); cx.lineTo(pad.left, pad.top + plotH); cx.lineTo(pad.left + plotW, pad.top + plotH); cx.stroke();

    cx.fillStyle = '#334155'; cx.font = 'bold 10px sans-serif'; cx.textAlign = 'center';
    cx.fillText('Time (s)', pad.left + plotW/2, h - 4);
    cx.save(); cx.translate(14, pad.top + plotH/2); cx.rotate(-Math.PI/2); cx.fillText('[Reactant] (mol/L)', 0, 0); cx.restore();

    var conditions = [
      { k: 0.05, label: 'Low Temp', color: '#2563EB' },
      { k: 0.12, label: 'High Temp', color: '#DC2626' },
      { k: 0.22, label: '+ Catalyst', color: '#059669' }
    ];
    var tMax = 60;
    conditions.forEach(function (cond) {
      cx.strokeStyle = cond.color; cx.lineWidth = 2;
      cx.beginPath();
      for (var t = 0; t <= tMax; t++) {
        var conc = Math.exp(-cond.k * t);
        var x = pad.left + (t / tMax) * plotW;
        var y = pad.top + plotH - conc * plotH;
        if (t === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
      }
      cx.stroke();
      cx.fillStyle = cond.color; cx.font = 'bold 9px sans-serif'; cx.textAlign = 'left';
      var labelY = pad.top + plotH - Math.exp(-cond.k * tMax) * plotH - 4;
      cx.fillText(cond.label, pad.left + plotW - 45, labelY);
    });

    cx.fillStyle = '#0F172A'; cx.font = 'bold 11px sans-serif'; cx.textAlign = 'center';
    cx.fillText('Reaction Rate: Temperature & Catalyst Kinetics', pad.left + plotW/2, pad.top - 8);
  }

  function renderHalfLifeGraph() {
    var canvasEl = document.getElementById('chem-kinetics-canvas');
    if (!canvasEl) return;
    var cx  = canvasEl.getContext('2d');
    var w   = canvasEl.width, h = canvasEl.height;
    var pad = { top: 30, right: 30, bottom: 40, left: 50 };
    cx.clearRect(0, 0, w, h); cx.fillStyle = '#fff'; cx.fillRect(0, 0, w, h);
    var plotW = w - pad.left - pad.right, plotH = h - pad.top - pad.bottom;

    cx.strokeStyle = '#334155'; cx.lineWidth = 1.5;
    cx.beginPath(); cx.moveTo(pad.left, pad.top); cx.lineTo(pad.left, pad.top + plotH); cx.lineTo(pad.left + plotW, pad.top + plotH); cx.stroke();

    cx.fillStyle = '#334155'; cx.font = 'bold 10px sans-serif'; cx.textAlign = 'center';
    cx.fillText('Time (half-lives t₁/₂)', pad.left + plotW/2, h - 4);
    cx.save(); cx.translate(14, pad.top + plotH/2); cx.rotate(-Math.PI/2); cx.fillText('Remaining Nuclides (%)', 0, 0); cx.restore();

    var halfLives = 5;
    cx.strokeStyle = '#7C3AED'; cx.lineWidth = 2;
    cx.beginPath();
    for (var i = 0; i <= halfLives * 20; i++) {
      var t2 = i / 20;
      var pct = 100 * Math.pow(0.5, t2);
      var x = pad.left + (t2 / halfLives) * plotW;
      var y = pad.top + plotH - (pct / 100) * plotH;
      if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y);
    }
    cx.stroke();

    cx.fillStyle = '#0F172A'; cx.font = 'bold 11px sans-serif'; cx.textAlign = 'center';
    cx.fillText('Radioactive Decay: Exponential Half-Life Model', pad.left + plotW/2, pad.top - 8);
  }

  // ============================================================
  // EQUATION BALANCER
  // ============================================================
  function setupEquationBalancer() {
    var btn = document.getElementById('btn-balance-equation');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var rEl = document.getElementById('inp-reactants');
      var pEl = document.getElementById('inp-products');
      var reactantsStr = rEl ? rEl.value.trim() : '';
      var productsStr  = pEl ? pEl.value.trim() : '';
      if (!reactantsStr || !productsStr) return;

      var reactants = reactantsStr.split('+').map(function (s) { return s.trim(); });
      var products  = productsStr.split('+').map(function (s) { return s.trim(); });

      fetch('/api/chemistry/balance-equation', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactants: reactants, products: products })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var resEl = document.getElementById('balance-result');
          if (!resEl) return;
          if (d.success) {
            var eq = d.reactantCoeffs.map(function (c, i) { return (c > 1 ? c : '') + reactants[i]; }).join(' + ') +
              ' → ' +
              d.productCoeffs.map(function (c, i) { return (c > 1 ? c : '') + products[i]; }).join(' + ');
            resEl.innerHTML = '<div class="alert alert-success"><strong>Balanced Equation:</strong> ' + escHtml(eq) + '</div>';
          } else {
            resEl.innerHTML = '<div class="alert alert-danger">' + escHtml(d.error || 'Could not balance') + '</div>';
          }
        })
        .catch(function () {
          var resEl = document.getElementById('balance-result');
          if (resEl) resEl.innerHTML = '<div class="alert alert-danger">Network error connecting to balancer.</div>';
        });
    });
  }

  // ============================================================
  // MOLE CALCULATOR
  // ============================================================
  function setupMoleCalculator() {
    var btn = document.getElementById('btn-calc-moles');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var sel = document.getElementById('sel-mole-type');
      var vEl = document.getElementById('inp-mole-value');
      var mEl = document.getElementById('inp-mole-M');
      var calcType  = sel ? sel.value : 'mass_to_moles';
      var value     = vEl ? parseFloat(vEl.value) : 0;
      var molarMass = mEl ? parseFloat(mEl.value) : 18;

      fetch('/api/chemistry/mole-calc', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calcType: calcType, value: value, molarMass: molarMass })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var el = document.getElementById('mole-calc-result');
          if (!el) return;
          if (d.success) {
            var resultVal = d.moles ? (d.moles + ' mol') : d.mass_g ? (d.mass_g + ' g') : d.particles;
            el.innerHTML = '<div class="chem-calc-result"><div class="chem-calc-answer">' + resultVal + '</div>' +
              '<div class="chem-calc-steps">' + (d.steps || []).map(function (s) { return escHtml(s); }).join('<br>') + '</div></div>';
          } else {
            el.innerHTML = '<div class="alert alert-danger">' + escHtml(d.error) + '</div>';
          }
        });
    });
  }

  // ============================================================
  // STOICHIOMETRY
  // ============================================================
  function setupStoichiometryCalc() {
    var btn = document.getElementById('btn-calc-stoich');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var body = {
        molarMassGiven:  parseFloat((document.getElementById('inp-stoich-Mg') || {}).value || '2'),
        molarMassWanted: parseFloat((document.getElementById('inp-stoich-Mw') || {}).value || '18'),
        coeffGiven:      parseFloat((document.getElementById('inp-stoich-cg') || {}).value || '2'),
        coeffWanted:     parseFloat((document.getElementById('inp-stoich-cw') || {}).value || '2'),
        givenAmount:     parseFloat((document.getElementById('inp-stoich-amt') || {}).value || '4'),
        givenUnit:       (document.getElementById('sel-stoich-unit') || {}).value || 'g'
      };
      fetch('/api/chemistry/stoichiometry', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var el = document.getElementById('stoich-result');
          if (!el) return;
          if (d.success) {
            el.innerHTML = '<div class="chem-calc-result">' +
              '<div class="chem-calc-answer">' + d.massWanted_g + ' g</div>' +
              '<div class="small text-muted mb-2">Moles produced: ' + d.molesWanted + ' mol | Particles: ' + d.particles + '</div>' +
              '<div class="chem-calc-steps">' + (d.steps || []).map(function (s) { return escHtml(s); }).join('<br>') + '</div></div>';
          } else {
            el.innerHTML = '<div class="alert alert-danger">' + escHtml(d.error) + '</div>';
          }
        });
    });
  }

  // ============================================================
  // pH CALCULATOR
  // ============================================================
  function setupPhCalculator() {
    var btn = document.getElementById('btn-calc-ph');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var body = {
        type:          (document.getElementById('sel-acid-type') || {}).value || 'strong_acid',
        concentration: parseFloat((document.getElementById('inp-acid-conc') || {}).value || '0.1'),
        ka:            parseFloat((document.getElementById('inp-ka') || {}).value || '0.000018'),
        kb:            parseFloat((document.getElementById('inp-kb') || {}).value || '0.000018')
      };
      fetch('/api/chemistry/ph-calculate', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var el = document.getElementById('ph-result');
          if (!el) return;
          if (d.success) {
            el.innerHTML = '<div class="chem-calc-result">' +
              '<div class="chem-calc-answer">pH = ' + d.pH + '</div>' +
              '<div class="chem-prop-row"><span class="chem-prop-label">pOH</span><span class="chem-prop-val">' + d.pOH + '</span></div>' +
              '<div class="chem-prop-row"><span class="chem-prop-label">[H⁺]</span><span class="chem-prop-val">' + d.H_concentration + ' mol/L</span></div>' +
              '<div class="chem-prop-row"><span class="chem-prop-label">[OH⁻]</span><span class="chem-prop-val">' + d.OH_concentration + ' mol/L</span></div>' +
              '<div class="small text-muted mt-1">' + escHtml(d.notes) + '</div>' +
              '</div>';
          } else {
            el.innerHTML = '<div class="alert alert-danger">' + escHtml(d.error) + '</div>';
          }
        });
    });
  }

  // ============================================================
  // TITRATION LAB
  // ============================================================
  function setupTitrationLab() {
    var titCanvas = document.getElementById('chem-titration-canvas');
    if (!titCanvas) return;

    function redrawTitration() {
      if (!window.ChemCanvas) return;
      ChemCanvas.drawTitrationScene(titCanvas, {
        buretteReading: state.titration.buretteFinal,
        flaskColor: 'rgba(252,196,48,0.4)',
        indicatorTriggered: state.titration.buretteFinal >= 24.5,
        endpointColor: 'rgba(236,72,153,0.5)'
      });
    }

    var addBtn = document.getElementById('btn-titration-add');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var stepEl = document.getElementById('inp-titration-drop');
        var step = stepEl ? parseFloat(stepEl.value) : 1.0;
        state.titration.buretteFinal = Math.min(50, state.titration.buretteFinal + step);

        var rDisp = document.getElementById('disp-burette-reading');
        if (rDisp) rDisp.textContent = state.titration.buretteFinal.toFixed(2);

        var vol = state.titration.buretteFinal - state.titration.buretteInitial;
        var pH  = calcTitrationPH(vol, state.titration.concentration, state.titration.volume);
        state.titration.dataPoints.push({ vol: vol, pH: pH });

        redrawTitration();
        var curveEl = document.getElementById('chem-titration-curve');
        if (curveEl && window.ChemCanvas) {
          ChemCanvas.drawTitrationCurve(curveEl, state.titration.dataPoints, {
            xLabel: 'Volume HCl added (cm³)',
            equivalenceVol: 25
          });
        }

        var titreEl = document.getElementById('disp-titre');
        if (titreEl) titreEl.textContent = vol.toFixed(2) + ' cm³';
      });
    }

    var resetBtn = document.getElementById('btn-titration-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        state.titration.buretteFinal = state.titration.buretteInitial;
        state.titration.dataPoints = [];
        var rDisp = document.getElementById('disp-burette-reading');
        if (rDisp) rDisp.textContent = state.titration.buretteInitial.toFixed(2);
        var titreEl = document.getElementById('disp-titre');
        if (titreEl) titreEl.textContent = '0.00 cm³';
        redrawTitration();
      });
    }

    redrawTitration();
  }

  function calcTitrationPH(volAdded, concAcid, volAlkali) {
    var concAlkali = 0.1;
    var molesAlkali = concAlkali * volAlkali / 1000;
    var molesAcid   = concAcid * volAdded / 1000;
    var diff = molesAlkali - molesAcid;
    if (Math.abs(diff) < 0.0001) return 7.0;
    if (diff > 0) {
      var totalVol = (volAlkali + volAdded) / 1000;
      var pOH = -Math.log10(diff / totalVol);
      return +(14 - pOH).toFixed(2);
    } else {
      var totalVol2 = (volAlkali + volAdded) / 1000;
      return +(-Math.log10(-diff / totalVol2)).toFixed(2);
    }
  }

  // ============================================================
  // ENERGY PROFILE SETUP
  // ============================================================
  function setupEnergyProfile() {
    var eaInput = document.getElementById('inp-ea');
    var dhInput = document.getElementById('inp-dh');
    if (eaInput) eaInput.addEventListener('input', function () { state.energetics.Ea = parseFloat(this.value) || 80; updateEnergyProfile(); });
    if (dhInput) dhInput.addEventListener('input', function () { state.energetics.deltaH = parseFloat(this.value) || -60; updateEnergyProfile(); });
  }

  function updateEnergyProfile() {
    var canvasEl = document.getElementById('chem-energy-canvas');
    if (!canvasEl || !window.ChemCanvas) return;
    ChemCanvas.drawEnergyProfile(canvasEl, state.energetics);
  }

  // ============================================================
  // EXPERIMENT BUILDER
  // ============================================================
  function setupExperimentBuilder() {
    var saveBtn = document.getElementById('btn-save-experiment');
    if (saveBtn) saveBtn.addEventListener('click', saveCurrentExperiment);
    var loadBtn = document.getElementById('btn-load-experiments');
    if (loadBtn) loadBtn.addEventListener('click', loadExperimentList);

    document.querySelectorAll('.chem-template-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadTemplate(btn.getAttribute('data-template'));
      });
    });
  }

  function saveCurrentExperiment() {
    var tEl = document.getElementById('inp-exp-title');
    var title = tEl ? tEl.value.trim() : 'Untitled Chemistry Experiment';
    if (!title) { alert('Please enter an experiment title.'); return; }
    var apparatus = window.ChemCanvas ? ChemCanvas.getObjects() : [];
    var obsEl = document.getElementById('inp-observations');
    var observations = obsEl ? obsEl.value : '';

    fetch('/api/chemistry/experiments', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title,
        topic_code: state.activeTopic || 'virtual-experiments',
        apparatus_json: apparatus,
        observations: observations,
        measurements_json: state.titration.dataPoints
      })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success) alert('Experiment saved successfully! ID: ' + d.id);
        else alert('Error: ' + (d.error || 'Failed to save'));
      })
      .catch(function () { alert('Network error saving experiment.'); });
  }

  function loadExperimentList() {
    fetch('/api/chemistry/experiments', { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var el = document.getElementById('chem-experiment-list');
        if (!el || !d.experiments) return;
        if (!d.experiments.length) { el.innerHTML = '<p class="text-muted small">No saved experiments found.</p>'; return; }
        el.innerHTML = d.experiments.map(function (exp) {
          return '<div class="d-flex justify-content-between align-items-center py-2 border-bottom">' +
            '<div><div class="fw-semibold small">' + escHtml(exp.title) + '</div>' +
            '<div class="text-muted" style="font-size:10px;">' + exp.topic_code + ' | ' + new Date(exp.created_at).toLocaleDateString() + '</div></div>' +
            '<button class="btn btn-sm btn-outline-primary" style="font-size:11px;padding:2px 8px;" onclick="window.loadExperiment(' + exp.id + ')">Load</button>' +
            '</div>';
        }).join('');
      });
  }

  window.loadExperiment = function (id) {
    fetch('/api/chemistry/experiments/' + id, { credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.success && d.experiment) {
          var exp = d.experiment;
          var apparatus = JSON.parse(exp.apparatus_json || '[]');
          if (window.ChemCanvas) ChemCanvas.setObjects(apparatus);
          var tEl = document.getElementById('inp-exp-title');
          if (tEl) tEl.value = exp.title;
          switchMode('canvas2d');
        }
      });
  };

  function loadTemplate(templateId) {
    if (!window.ChemCanvas) return;
    ChemCanvas.clearObjects();
    var cx = 320, cy = 240;

    if (templateId === 'titration') {
      ChemCanvas.addObject('burette', cx - 70, cy - 80, { label: '0.100 M HCl', reading: 0, height: 160 });
      ChemCanvas.addObject('conical_flask', cx - 70, cy + 100, { label: '25.0 mL NaOH', fillFraction: 0.55 });
      ChemCanvas.addObject('ph_strip', cx + 80, cy, { pH: 13 });
    } else if (templateId === 'electrolysis') {
      ChemCanvas.addObject('electrolysis', cx, cy, { label: 'CuSO₄ Electrolysis', width: 220, height: 140 });
    } else if (templateId === 'distillation') {
      ChemCanvas.addObject('bunsen', cx - 140, cy + 90, { flameType: 'blue' });
      ChemCanvas.addObject('beaker', cx - 140, cy + 20, { label: 'Mixture', fillFraction: 0.6 });
      ChemCanvas.addObject('condenser', cx + 20, cy - 20, { width: 140 });
      ChemCanvas.addObject('beaker', cx + 160, cy + 40, { label: 'Distillate', fillFraction: 0.1 });
    }
    switchMode('canvas2d');
  }

  // ============================================================
  // APPARATUS PANEL
  // ============================================================
  function setupApparatusPanel() {
    var panelEl = document.getElementById('chem-apparatus-panel');
    if (!panelEl) return;
    var apparatusTypes = ['beaker', 'conical_flask', 'test_tube', 'burette', 'thermometer', 'bunsen', 'separating_funnel', 'condenser', 'electrolysis'];
    var labels = {
      beaker:'Beaker', conical_flask:'Conical Flask', test_tube:'Test Tube',
      burette:'Burette', thermometer:'Thermometer', bunsen:'Bunsen Burner',
      separating_funnel:'Sep. Funnel', condenser:'Condenser', electrolysis:'Electrolysis Cell'
    };
    panelEl.innerHTML = '<div class="chem-branch-label mt-2">Apparatus Palette</div>' +
      apparatusTypes.map(function (type) {
        return '<div class="chem-apparatus-item chem-apparatus-add" data-apparatus="' + type + '">' +
          '<i class="fa-solid fa-flask me-2 text-primary"></i>' + labels[type] + '</div>';
      }).join('');

    panelEl.querySelectorAll('.chem-apparatus-add').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var type = btn.getAttribute('data-apparatus');
        if (!window.ChemCanvas) return;
        var canvasEl = document.getElementById('chem-lab-canvas');
        var cx = canvasEl ? (canvasEl.width / 2) : 320;
        var cy = canvasEl ? (canvasEl.height / 2) : 220;
        ChemCanvas.addObject(type, cx + (Math.random() * 60 - 30), cy + (Math.random() * 60 - 30), { label: labels[type] });
        switchMode('canvas2d');
      });
    });
  }

  // ============================================================
  // MODALS
  // ============================================================
  function setupModals() {
    var ionGrid = document.getElementById('chem-ion-test-grid');
    if (ionGrid && typeof ChemData !== 'undefined') {
      ionGrid.innerHTML = ChemData.ION_TESTS.map(function (test) {
        return '<tr><td class="fw-bold">' + escHtml(test.ion) + '</td>' +
          '<td>' + escHtml(test.reagent) + '</td>' +
          '<td><span class="badge" style="background:' + test.color + ';color:' + (test.color === '#FFFFFF' ? '#334155' : '#fff') + ';border:1px solid #ccc;">&nbsp;</span> ' +
          escHtml(test.observation) + '</td></tr>';
      }).join('');
    }

    var flameGrid = document.getElementById('chem-flame-test-grid');
    if (flameGrid && typeof ChemData !== 'undefined') {
      flameGrid.innerHTML = ChemData.FLAME_TESTS.map(function (ft) {
        return '<tr><td class="fw-bold">' + escHtml(ft.ion) + '</td>' +
          '<td>' + escHtml(ft.element) + '</td>' +
          '<td><span style="background:' + ft.hex + ';padding:2px 14px;border-radius:4px;display:inline-block;">&nbsp;</span> ' + escHtml(ft.color) + '</td></tr>';
      }).join('');
    }

    var hazardGrid = document.getElementById('chem-hazard-grid');
    if (hazardGrid) {
      var hazards = [
        { sym: '💀', label: 'Toxic',       desc: 'Fatal or toxic if swallowed or inhaled.' },
        { sym: '⚠',  label: 'Harmful',     desc: 'Causes skin and eye irritation.' },
        { sym: '🔥', label: 'Flammable',   desc: 'Keep away from ignition sources.' },
        { sym: '💥', label: 'Explosive',   desc: 'Explosive substances and mixtures.' },
        { sym: '⚡', label: 'Oxidiser',    desc: 'May intensify fire or cause combustion.' },
        { sym: '🧪', label: 'Corrosive',   desc: 'Destroys skin and metals on contact.' },
        { sym: '☣', label: 'Biohazard',   desc: 'Biological and pathogenic risk.' },
        { sym: '☢', label: 'Radioactive', desc: 'Ionising radiation hazard.' }
      ];
      hazardGrid.innerHTML = hazards.map(function (h) {
        return '<div class="chem-hazard-cell" title="' + escHtml(h.desc) + '">' +
          '<span class="chem-hazard-sym">' + h.sym + '</span>' +
          '<div class="chem-hazard-label">' + escHtml(h.label) + '</div>' +
          '</div>';
      }).join('');
    }
  }

  function launchTopicActivity(code) {
    if (code === 'graphing-analysis') {
      window.open('/graphing-lab.html?subject=CHEMISTRY', '_blank');
      return;
    }
    if (code === 'practical-assessments') {
      alert('Chemistry CBT practical assessments are accessed via Assigned Examinations on the Portal.');
      return;
    }
    switchMode(TOPIC_MODE_MAP[code] || 'canvas2d');
  }

  // Element search in sidebar
  document.addEventListener('DOMContentLoaded', function () {
    var searchEl = document.getElementById('chem-topic-search');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        var q = searchEl.value.toLowerCase();
        document.querySelectorAll('.chem-topic-item').forEach(function (el) {
          var matches = el.textContent.toLowerCase().includes(q);
          el.style.display = matches ? '' : 'none';
        });
      });
    }
  });

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
