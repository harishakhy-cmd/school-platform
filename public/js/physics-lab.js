/**
 * Interactive Physics & Physical Sciences Laboratory Orchestrator
 * Central client-side workbench controller
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // State Management
  const state = {
    activeTopic: null,
    activeMode: 'workspace2d',
    topics: [],
    isPlaying: false,
    simTime: 0.0,
    speedMultiplier: 1.0,
    recordedData: [],
    apparatusList: [],
    activeTool: 'select',
    animFrameId: null
  };

  // 12 Standard Pre-Configured Experiment Templates
  const EXPERIMENT_TEMPLATES = [
    {
      id: 'hookes_law',
      title: 'Hooke’s Law: Spring Constant & Elasticity',
      branch: 'Mechanics',
      icon: 'fa-cubes-stacked',
      description: 'Investigate the extension of a helical spring under increasing tensile loads to determine spring constant k and verify F = kΔx.',
      apparatus: ['retort_stand', 'helical_spring', 'pointer', 'metre_rule', 'slotted_masses_hanger']
    },
    {
      id: 'ohms_law',
      title: 'Ohm’s Law & Resistance Determination',
      branch: 'Electricity',
      icon: 'fa-plug-circle-bolt',
      description: 'Measure current I and potential difference V across a metallic conductor at constant temperature to confirm V = IR and plot I-V curve.',
      apparatus: ['dc_power_supply', 'ammeter', 'voltmeter', 'rheostat', 'nichrome_wire', 'knife_switch']
    },
    {
      id: 'simple_pendulum_g',
      title: 'Acceleration Due to Gravity via Simple Pendulum',
      branch: 'Mechanics',
      icon: 'fa-stopwatch',
      description: 'Measure oscillation period T for different string lengths L to calculate acceleration due to gravity g from T = 2π√(L/g).',
      apparatus: ['retort_stand', 'split_cork', 'pendulum_bob', 'thread', 'metre_rule', 'digital_stopwatch']
    },
    {
      id: 'snells_law',
      title: 'Snell’s Law & Refractive Index of Glass',
      branch: 'Optics',
      icon: 'fa-sun',
      description: 'Trace optical rays through a rectangular glass block at varying angles of incidence i and refraction r to determine refractive index n.',
      apparatus: ['drawing_board', 'glass_block', 'optical_pins', 'protractor', 'white_paper', 'pencil']
    },
    {
      id: 'boyles_law',
      title: 'Boyle’s Law: Pressure-Volume Isothermal Relation',
      branch: 'Thermal & Fluids',
      icon: 'fa-gauge-high',
      description: 'Compress trapped air at constant temperature to verify PV = constant and construct isothermal pressure vs inverse volume graph.',
      apparatus: ['boyles_law_apparatus', 'sealed_gas_syringe', 'bourdon_pressure_gauge', 'temperature_bath']
    },
    {
      id: 'archimedes_upthrust',
      title: 'Archimedes’ Principle & Buoyancy',
      branch: 'Thermal & Fluids',
      icon: 'fa-water',
      description: 'Verify that upthrust experienced by a submerged solid equals the weight of displaced liquid: U = ρVg.',
      apparatus: ['spring_balance', 'overflow_can', 'graduated_cylinder', 'brass_cylinder', 'water_beaker']
    },
    {
      id: 'specific_heat_metals',
      title: 'Specific Heat Capacity of Solids by Mixtures',
      branch: 'Thermal',
      icon: 'fa-temperature-high',
      description: 'Heat a metal cylinder in boiling water and transfer to a calorimeter to calculate specific heat capacity c = Q/(mΔT).',
      apparatus: ['copper_calorimeter', 'brass_block', 'boiling_water_bath', 'bunsen_burner', 'digital_thermometer']
    },
    {
      id: 'resonance_speed_sound',
      title: 'Speed of Sound via Resonance Tube',
      branch: 'Waves & Sound',
      icon: 'fa-volume-high',
      description: 'Excite an air column with tuning forks of known frequencies to locate resonance positions and calculate sound speed in air v = 4(L+c)f.',
      apparatus: ['resonance_tube', 'water_reservoir', 'tuning_forks_set', 'rubber_mallet', 'metre_rule']
    },
    {
      id: 'simple_machines_pulleys',
      title: 'Mechanical Advantage & Efficiency of Pulley Systems',
      branch: 'Mechanics',
      icon: 'fa-gears',
      description: 'Test block-and-tackle pulley rigs to compare velocity ratio (VR) with mechanical advantage (MA = Load/Effort) and determine efficiency η.',
      apparatus: ['fixed_pulley_block', 'movable_pulley_block', 'braided_cord', 'slotted_masses', 'spring_balance']
    },
    {
      id: 'photoelectric_effect',
      title: 'Photoelectric Effect & Planck’s Constant',
      branch: 'Modern Physics',
      icon: 'fa-wand-magic-sparkles',
      description: 'Measure stopping potential Vs under monochromatic spectral filters to calculate Planck’s constant h and metal work function Φ.',
      apparatus: ['photocell', 'spectral_filters', 'variable_reverse_voltage', 'sensitive_nanoammeter', 'mercury_lamp']
    },
    {
      id: 'half_life_decay',
      title: 'Radioactive Decay Law & Half-Life Simulation',
      branch: 'Modern Physics',
      icon: 'fa-biohazard',
      description: 'Observe nuclear disintegration count rate vs time to compute decay constant λ and half-life T_1/2.',
      apparatus: ['geiger_muller_tube', 'digital_ratemeter', 'lead_collimator', 'radioactive_sample_sim']
    },
    {
      id: 'logic_gates_truth_tables',
      title: 'Digital Logic Gates & Combinational Truth Tables',
      branch: 'Electronics',
      icon: 'fa-microchip',
      description: 'Construct combinational circuits using AND, OR, NOT, NAND, NOR gates to verify logic truth tables and Boolean expressions.',
      apparatus: ['logic_gate_breadboard', 'toggle_switches', 'logic_led_indicators', '5v_regulated_supply']
    }
  ];

  // 10 Categorized Apparatus Library
  const APPARATUS_CATEGORIES = [
    {
      id: 'cat_measuring',
      title: '1. Measuring Instruments',
      icon: 'fa-ruler-combined',
      items: ['Metre Rule (1mm)', 'Vernier Calipers (0.1mm)', 'Micrometer Screw Gauge (0.01mm)', 'Digital Stopwatch (0.01s)', 'Beam Balance', 'Electronic Top-Pan Balance', 'Spring Balance (0-10N)', 'Protractor (180° / 360°)']
    },
    {
      id: 'cat_mechanics',
      title: '2. Mechanics & Dynamics',
      icon: 'fa-weight-hanging',
      items: ['Dynamics Trolley', 'Friction Runway Ramp', 'Ticker-Tape Timer (50Hz)', 'Light Gate Sensors', 'Slotted Masses & Hanger (10g-500g)', 'Helical Springs (Steel/Brass)', 'Pendulum Bobs', 'Force Resolution Table', 'Single & Double Pulleys', 'Lever Arm with Knife-Edge']
    },
    {
      id: 'cat_thermal',
      title: '3. Thermal & Heat',
      icon: 'fa-temperature-high',
      items: ['Copper Calorimeter with Stirrer', 'Digital Thermometer (-50 to +300°C)', 'Bunsen Burner & Tripod', 'Electric Immersion Heater (50W)', 'Thermal Conduction Metal Strips', 'Insulated Jacket Lid', 'Glass Boiling Flask']
    },
    {
      id: 'cat_fluids',
      title: '4. Fluids & Pressure',
      icon: 'fa-water',
      items: ['Overflow / Eureka Can', 'Graduated Cylinders (100ml / 250ml)', 'U-Tube Liquid Manometer', 'Density Hydrometer', 'Standard Density Metal Cubes', 'Hydraulic Press Model', 'Barometer Tube']
    },
    {
      id: 'cat_waves_sound',
      title: '5. Waves & Acoustics',
      icon: 'fa-volume-high',
      items: ['Acoustic Resonance Tube', 'Tuning Forks Set (256Hz - 512Hz)', 'Ripple Tank with Stroboscope', 'Melde’s Wave Vibrator & String', 'Audio Signal Generator', 'Microphone Sensor', 'Sound Barrier Screen']
    },
    {
      id: 'cat_optics',
      title: '6. Light & Ray Optics',
      icon: 'fa-sun',
      items: ['Optical Bench (1.0m / 1.5m)', 'Biconvex Lenses (+5cm, +10cm, +15cm)', 'Biconcave Lenses (-10cm, -15cm)', 'Concave & Convex Spherical Mirrors', 'Rectangular Crown Glass Block', 'Equilateral Triangular Prism (60°)', 'Illuminated Crosswire Lamp', 'Ground Glass Projection Screen']
    },
    {
      id: 'cat_electricity',
      title: '7. Electricity & Circuits',
      icon: 'fa-plug-circle-bolt',
      items: ['DC Regulated Power Supply (0-12V)', 'Dry Cell Battery Holder (1.5V / 3V / 4.5V)', 'Digital / Analog DC Ammeter (0-1A, 0-5A)', 'DC Voltmeter (0-3V, 0-15V)', 'Linear Slider Rheostat (10Ω, 20Ω, 50Ω)', 'Standard Carbon Resistors', 'Incandescent Miniature Lamps (3.8V, 6V)', 'Knife / Key Switches', 'Connecting Wires with Banana Plugs']
    },
    {
      id: 'cat_magnetism',
      title: '8. Magnetism & Induction',
      icon: 'fa-magnet',
      items: ['Alnico Bar Magnets (Pair)', 'Horseshoe Magnet', 'Plotting Pocket Compasses', 'Fine Iron Filings Dispenser', 'Solenoid Coil on Core', 'Center-Zero Sensitive Galvanometer', 'Demountable Transformer Iron Core']
    },
    {
      id: 'cat_electrostatics',
      title: '9. Electrostatics',
      icon: 'fa-circle-radiation',
      items: ['Gold-Leaf Electroscope', 'Polythene & Perspex Friction Rods', 'Wool & Silk Rubbing Cloths', 'Proof Plane & Faraday Ice Pail', 'Parallel Capacitor Plates', 'Electrostatic Spark Van de Graaff']
    },
    {
      id: 'cat_electronics_modern',
      title: '10. Electronics & Modern Physics',
      icon: 'fa-microchip',
      items: ['Semiconductor Silicon Diodes (1N4007)', 'Light Emitting Diodes (Red, Green, Blue)', 'Logic Gate Modules (AND, OR, NOT, NAND, NOR)', 'NPN Bipolar Junction Transistor', 'Photocell with Spectral Filters', 'Geiger-Müller Tube & Ratemeter', 'Cathode Ray Tube Simulator']
    }
  ];

  // DOM Elements
  const topicsListEl = document.getElementById('phys-topics-list');
  const searchTopicsInput = document.getElementById('phys-search-topics');
  const inspectorTitleEl = document.getElementById('phys-inspector-title');
  const inspectorSubtitleEl = document.getElementById('phys-inspector-subtitle');
  const hudPrimaryValEl = document.getElementById('hud-primary-val');
  const hudSecondaryValEl = document.getElementById('hud-secondary-val');
  const hudTertiaryValEl = document.getElementById('hud-tertiary-val');
  const hudPrimaryLabelEl = document.getElementById('hud-primary-label');
  const hudSecondaryLabelEl = document.getElementById('hud-secondary-label');
  const hudTertiaryLabelEl = document.getElementById('hud-tertiary-label');
  const equationsContainerEl = document.getElementById('phys-equations-container');
  const clockHudEl = document.getElementById('phys-clock-hud');
  const btnPlay = document.getElementById('btn-phys-play');
  const btnStep = document.getElementById('btn-phys-step');
  const btnReset = document.getElementById('btn-phys-reset');
  const speedSelect = document.getElementById('phys-speed-select');
  const dataTableBody = document.getElementById('phys-table-body');
  const btnRecordReading = document.getElementById('btn-phys-record-reading');
  const btnClearData = document.getElementById('btn-phys-clear-data');
  const btnSaveExperiment = document.getElementById('btn-phys-save-experiment');
  const canvas2d = document.getElementById('phys-main-canvas');
  const container3d = document.getElementById('phys-3d-container');
  const guidePane = document.getElementById('phys-guide-pane');
  const cbtPane = document.getElementById('phys-cbt-pane');
  const btnCloseGuide = document.getElementById('btn-close-guide');
  const btnCloseCbt = document.getElementById('btn-close-cbt');

  let ctx = canvas2d ? canvas2d.getContext('2d') : null;

  // Initialize Canvas Size
  function resizeCanvas() {
    if (!canvas2d) return;
    const rect = canvas2d.parentElement.getBoundingClientRect();
    canvas2d.width = rect.width;
    canvas2d.height = rect.height;
    renderCanvas2D();
  }
  window.addEventListener('resize', resizeCanvas);

  // 1. Fetch & Populate Curriculum Topics
  async function loadCurriculumTopics() {
    try {
      const res = await fetch('/api/physics/topics');
      const data = await res.json();
      if (data.success && data.topics) {
        state.topics = data.topics;
        renderTopicsList(state.topics);

        // Select first topic by default (Measurements & Units or Motion)
        if (state.topics.length > 0) {
          selectTopic(state.topics[0].code);
        }
      }
    } catch (err) {
      console.warn('Failed to load physics curriculum topics:', err);
    }
  }

  function renderTopicsList(topics) {
    if (!topicsListEl) return;
    topicsListEl.innerHTML = '';

    topics.forEach((t) => {
      const item = document.createElement('div');
      item.className = `phys-topic-item ${state.activeTopic && state.activeTopic.code === t.code ? 'active' : ''}`;
      item.dataset.code = t.code;
      item.innerHTML = `
        <div class="phys-topic-icon">
          <i class="fa-solid ${t.icon || 'fa-atom'}"></i>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="phys-topic-title text-truncate">${t.title}</div>
          <span class="phys-topic-branch">${t.branch || 'Physics'}</span>
        </div>
      `;
      item.addEventListener('click', () => selectTopic(t.code));
      topicsListEl.appendChild(item);
    });
  }

  // 2. Select Topic & Update Inspector
  async function selectTopic(code) {
    try {
      const res = await fetch(`/api/physics/topics/${code}`);
      const data = await res.json();
      if (!data.success || !data.topic) return;

      const topic = data.topic;
      const previousCode = state.activeTopic?.code;
      state.activeTopic = topic;

      // Each topic records different measured quantities. Start a fresh log
      // when the experiment changes so values from two models are never mixed.
      if (previousCode && previousCode !== topic.code && state.recordedData.length) {
        state.recordedData = [];
        renderDataTable();
        updateMiniGraph();
      }
      updateReadingHeadings(topic.code);

      // Update sidebar active highlights
      document.querySelectorAll('.phys-topic-item').forEach((el) => {
        el.classList.toggle('active', el.dataset.code === code);
      });

      // Update Inspector Header
      if (inspectorTitleEl) {
        inspectorTitleEl.innerHTML = `<i class="fa-solid ${topic.icon || 'fa-atom'} text-primary me-2"></i> ${topic.title}`;
      }
      if (inspectorSubtitleEl) {
        inspectorSubtitleEl.textContent = `${topic.branch} • ${topic.category}`;
      }

      // Update HUD Labels
      updateHudLabelsForTopic(topic);

      // Render Equations with KaTeX
      renderTopicEquations(topic);

      // Update Graphing Lab Button Link
      updateGraphingLabLinkForTopic(topic);

      // Render Initial Canvas Scene
      renderCanvas2D();
    } catch (err) {
      console.warn('Error fetching topic detail:', err);
    }
  }

  function updateHudLabelsForTopic(topic) {
    if (!hudPrimaryLabelEl) return;
    if (topic.code === 'electricity') {
      hudPrimaryLabelEl.textContent = 'Potential Diff V';
      hudSecondaryLabelEl.textContent = 'Current I';
      hudTertiaryLabelEl.textContent = 'Power P = VI';
      hudPrimaryValEl.textContent = '6.00 V';
      hudSecondaryValEl.textContent = '1.20 A';
      hudTertiaryValEl.textContent = '7.20 W';
    } else if (topic.code === 'light-optics') {
      hudPrimaryLabelEl.textContent = 'Object Distance u';
      hudSecondaryLabelEl.textContent = 'Image Distance v';
      hudTertiaryLabelEl.textContent = 'Focal Length f';
      hudPrimaryValEl.textContent = '30.0 cm';
      hudSecondaryValEl.textContent = '60.0 cm';
      hudTertiaryValEl.textContent = '20.0 cm';
    } else if (topic.code === 'thermal-physics' || topic.code === 'gas-laws') {
      hudPrimaryLabelEl.textContent = 'Pressure P';
      hudSecondaryLabelEl.textContent = 'Volume V';
      hudTertiaryLabelEl.textContent = 'Temperature T';
      hudPrimaryValEl.textContent = '101.3 kPa';
      hudSecondaryValEl.textContent = '2.40 L';
      hudTertiaryValEl.textContent = '298.15 K';
    } else if (topic.code === 'oscillations') {
      hudPrimaryLabelEl.textContent = 'Displacement x';
      hudSecondaryLabelEl.textContent = 'Period T';
      hudTertiaryLabelEl.textContent = 'Frequency f';
      hudPrimaryValEl.textContent = '0.08 m';
      hudSecondaryValEl.textContent = '1.42 s';
      hudTertiaryValEl.textContent = '0.70 Hz';
    } else {
      hudPrimaryLabelEl.textContent = 'Displacement s';
      hudSecondaryLabelEl.textContent = 'Velocity v';
      hudTertiaryLabelEl.textContent = 'Mechanical Energy E';
      hudPrimaryValEl.textContent = '0.00 m';
      hudSecondaryValEl.textContent = '0.00 m/s';
      hudTertiaryValEl.textContent = '0.00 J';
    }
  }

  function renderTopicEquations(topic) {
    if (!equationsContainerEl) return;
    equationsContainerEl.innerHTML = '';

    if (topic.equations && topic.equations.length > 0) {
      topic.equations.forEach((eq) => {
        const item = document.createElement('div');
        item.className = 'mb-2 p-2 bg-light rounded border';
        item.innerHTML = `<strong class="d-block text-dark small mb-1">${eq.name}:</strong><div class="katex-rendered-eq font-monospace text-primary"></div>`;
        const target = item.querySelector('.katex-rendered-eq');
        if (typeof katex !== 'undefined') {
          try {
            katex.render(eq.latex, target, { displayMode: true, throwOnError: false });
          } catch (_) {
            target.textContent = eq.latex;
          }
        } else {
          target.textContent = eq.latex;
        }
        equationsContainerEl.appendChild(item);
      });
    } else {
      equationsContainerEl.innerHTML = '<span class="text-muted">Standard SI physical relationships applied.</span>';
    }
  }

  function updateGraphingLabLinkForTopic(topic) {
    const link = document.getElementById('btn-phys-open-graphing-lab');
    if (!link) return;
    let presetIdx = 0;
    if (topic.code === 'motion') presetIdx = 0;
    else if (topic.code === 'forces') presetIdx = 1;
    else if (topic.code === 'oscillations') presetIdx = 2;
    else if (topic.code === 'electricity') presetIdx = 3;
    else if (topic.code === 'nuclear-physics') presetIdx = 4;
    link.href = `/graphing-lab.html?subject=PHYSICS&preset=${presetIdx}`;
  }

  // 3. Search Filter
  if (searchTopicsInput) {
    searchTopicsInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = state.topics.filter(
        (t) => t.title.toLowerCase().includes(q) || t.branch.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
      renderTopicsList(filtered);
    });
  }

  // 4. Mode Switcher Pills
  document.querySelectorAll('.phys-mode-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.phys-mode-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const mode = pill.dataset.mode;
      switchActiveMode(mode);
    });
  });

  function switchActiveMode(mode) {
    state.activeMode = mode;
    if (canvas2d) canvas2d.style.display = mode === 'workspace2d' ? 'block' : 'none';
    if (container3d) container3d.style.display = mode === 'viewport3d' ? 'block' : 'none';
    if (guidePane) guidePane.style.display = mode === 'guided-labs' ? 'block' : 'none';
    if (cbtPane) cbtPane.style.display = mode === 'assessments' ? 'block' : 'none';

    if (mode === 'guided-labs') {
      renderGuidedExperimentView();
    } else if (mode === 'assessments') {
      renderCbtPracticalView();
    } else if (mode === 'viewport3d') {
      render3DViewport();
    } else {
      renderCanvas2D();
    }
  }

  if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => switchActiveMode('workspace2d'));
  if (btnCloseCbt) btnCloseCbt.addEventListener('click', () => switchActiveMode('workspace2d'));

  // 5. 2D Interactive Canvas Renderer
  function renderCanvas2D() {
    if (!ctx || !canvas2d) return;
    const w = canvas2d.width;
    const h = canvas2d.height;

    // Clear background
    ctx.fillStyle = '#FAFAFC';
    ctx.fillRect(0, 0, w, h);

    // Draw coordinate millimeter grid
    drawGrid(w, h);

    // Draw active topic interactive elements
    const code = state.activeTopic ? state.activeTopic.code : 'motion';

    if (code === 'oscillations' || code === 'forces') {
      drawSimplePendulum(w, h);
    } else if (code === 'light-optics') {
      drawRayOpticsDiagram(w, h);
    } else if (code === 'electricity') {
      drawCircuitDiagram(w, h);
    } else if (code === 'pressure-fluids') {
      drawFluidManometer(w, h);
    } else {
      drawKinematicsProjectile(w, h);
    }
  }

  function drawGrid(w, h) {
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  function drawKinematicsProjectile(w, h) {
    const originX = 80;
    const groundY = h - 80;

    // Ground
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, groundY);
    ctx.lineTo(w - 40, groundY);
    ctx.stroke();

    // Trajectory curve
    const v0 = 25;
    const theta = Math.PI / 4;
    const g = 9.81;

    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let t = 0; t <= 3.6; t += 0.05) {
      const x = originX + v0 * Math.cos(theta) * t * 15;
      const y = groundY - (v0 * Math.sin(theta) * t - 0.5 * g * t * t) * 15;
      if (t === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Projectile Mass
    const tCurrent = (state.simTime % 3.6);
    const projX = originX + v0 * Math.cos(theta) * tCurrent * 15;
    const projY = groundY - (v0 * Math.sin(theta) * tCurrent - 0.5 * g * tCurrent * tCurrent) * 15;

    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(projX, projY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#991B1B';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Velocity Vector
    const vx = v0 * Math.cos(theta);
    const vy = v0 * Math.sin(theta) - g * tCurrent;
    drawVector(projX, projY, vx * 2, -vy * 2, '#10B981', 'v');
  }

  function drawSimplePendulum(w, h) {
    const pivotX = w / 2;
    const pivotY = 90;
    const length = 220;
    const thetaMax = Math.PI / 6;
    const omega = Math.sqrt(9.81 / 1.0);
    const theta = thetaMax * Math.cos(omega * state.simTime);

    const bobX = pivotX + length * Math.sin(theta);
    const bobY = pivotY + length * Math.cos(theta);

    // Support stand
    ctx.fillStyle = '#64748B';
    ctx.fillRect(pivotX - 60, pivotY - 14, 120, 10);
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, 6, 0, Math.PI * 2);
    ctx.fill();

    // String
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();

    // Bob
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B45309';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Restoring force vector
    const F_restoring = -Math.sin(theta) * 40;
    drawVector(bobX, bobY, F_restoring * Math.cos(theta), -F_restoring * Math.sin(theta), '#EF4444', 'F_net');
  }

  function drawRayOpticsDiagram(w, h) {
    const lensX = w / 2;
    const lensY = h / 2;
    const focalLength = 120;

    // Principal Axis
    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(40, lensY);
    ctx.lineTo(w - 40, lensY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Convex Lens
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(lensX, lensY, 12, 140, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Focal Points F
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(lensX - focalLength, lensY, 5, 0, Math.PI * 2);
    ctx.arc(lensX + focalLength, lensY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('F', lensX - focalLength - 5, lensY + 20);
    ctx.fillText('F\'', lensX + focalLength - 5, lensY + 20);

    // Object Arrow
    const objDist = 200;
    const objHeight = 70;
    const objX = lensX - objDist;
    const objTopY = lensY - objHeight;

    drawArrow(objX, lensY, objX, objTopY, '#2563EB', 3);
    ctx.fillText('Object (u=30cm)', objX - 40, objTopY - 10);

    // Image Arrow: 1/v = 1/f - 1/u
    const imgDist = (focalLength * objDist) / (objDist - focalLength);
    const imgHeight = (imgDist / objDist) * objHeight;
    const imgX = lensX + imgDist;
    const imgBottomY = lensY + imgHeight;

    drawArrow(imgX, lensY, imgX, imgBottomY, '#10B981', 3);
    ctx.fillText('Real Inverted Image', imgX - 30, imgBottomY + 20);

    // Ray 1: Parallel then through focus
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(objX, objTopY);
    ctx.lineTo(lensX, objTopY);
    ctx.lineTo(imgX, imgBottomY);
    ctx.stroke();

    // Ray 2: Straight through optical center
    ctx.strokeStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(objX, objTopY);
    ctx.lineTo(imgX, imgBottomY);
    ctx.stroke();
  }

  function drawCircuitDiagram(w, h) {
    const cx = w / 2;
    const cy = h / 2;
    const rw = 260;
    const rh = 160;

    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 3;

    // Loop rectangle
    ctx.beginPath();
    ctx.rect(cx - rw / 2, cy - rh / 2, rw, rh);
    ctx.stroke();

    // Clear top segment for DC Battery
    ctx.fillStyle = '#FAFAFC';
    ctx.fillRect(cx - 30, cy - rh / 2 - 10, 60, 20);
    // Battery plates
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - rh / 2 - 15);
    ctx.lineTo(cx - 10, cy - rh / 2 + 15);
    ctx.stroke();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0F172A';
    ctx.beginPath();
    ctx.moveTo(cx + 6, cy - rh / 2 - 8);
    ctx.lineTo(cx + 6, cy - rh / 2 + 8);
    ctx.stroke();

    ctx.font = '13px monospace';
    ctx.fillStyle = '#DC2626';
    ctx.fillText('+', cx - 22, cy - rh / 2 - 18);
    ctx.fillText('12V', cx - 12, cy - rh / 2 + 30);

    // Clear bottom segment for Resistor
    ctx.fillStyle = '#FAFAFC';
    ctx.fillRect(cx - 40, cy + rh / 2 - 15, 80, 30);
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 3;
    ctx.strokeRect(cx - 35, cy + rh / 2 - 12, 70, 24);
    ctx.fillStyle = '#1E293B';
    ctx.font = '12px Inter';
    ctx.fillText('R = 10 Ω', cx - 24, cy + rh / 2 + 5);

    // Ammeter on right branch
    ctx.fillStyle = '#FAFAFC';
    ctx.fillRect(cx + rw / 2 - 20, cy - 20, 40, 40);
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(cx + rw / 2, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Inter';
    ctx.fillText('A', cx + rw / 2 - 5, cy + 5);

    // Voltmeter across resistor
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 50, cy + rh / 2);
    ctx.lineTo(cx - 50, cy + rh / 2 + 50);
    ctx.lineTo(cx + 50, cy + rh / 2 + 50);
    ctx.lineTo(cx + 50, cy + rh / 2);
    ctx.stroke();

    ctx.fillStyle = '#9333EA';
    ctx.beginPath();
    ctx.arc(cx, cy + rh / 2 + 50, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('V', cx - 5, cy + rh / 2 + 55);
  }

  function drawFluidManometer(w, h) {
    const mx = w / 2;
    const my = h / 2 - 20;

    // U-Tube outline
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mx - 60, my - 80);
    ctx.lineTo(mx - 60, my + 60);
    ctx.arc(mx, my + 60, 60, Math.PI, 0, true);
    ctx.lineTo(mx + 60, my - 80);
    ctx.stroke();

    // Liquid column (Mercury / Water)
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(mx - 60, my + 20);
    ctx.lineTo(mx - 60, my + 60);
    ctx.arc(mx, my + 60, 60, Math.PI, 0, true);
    ctx.lineTo(mx + 60, my - 30);
    ctx.stroke();

    // Height differential indicator
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(mx - 80, my + 20);
    ctx.lineTo(mx + 80, my + 20);
    ctx.moveTo(mx + 40, my - 30);
    ctx.lineTo(mx + 80, my - 30);
    ctx.stroke();
    ctx.setLineDash([]);

    drawArrow(mx + 75, my + 20, mx + 75, my - 30, '#DC2626', 2);
    ctx.font = '12px Inter';
    ctx.fillStyle = '#DC2626';
    ctx.fillText('Δh = 5.0 cm', mx + 85, my - 5);
  }

  function drawVector(x, y, dx, dy, color, label) {
    drawArrow(x, y, x + dx, y + dy, color, 2);
    if (label) {
      ctx.fillStyle = color;
      ctx.font = 'bold 12px Inter';
      ctx.fillText(label, x + dx + 4, y + dy + 4);
    }
  }

  function drawArrow(fromX, fromY, toX, toY, color, width) {
    const headlen = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  // 6. Simulation Playback Controls
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      state.isPlaying = !state.isPlaying;
      btnPlay.classList.toggle('playing', state.isPlaying);
      btnPlay.innerHTML = state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>';
      if (state.isPlaying) {
        runSimulationLoop();
      } else {
        cancelAnimationFrame(state.animFrameId);
      }
    });
  }

  if (btnStep) {
    btnStep.addEventListener('click', () => {
      advanceSimulationStep(0.05);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      state.simTime = 0.0;
      if (clockHudEl) clockHudEl.textContent = 't: 0.00 s';
      renderCanvas2D();
    });
  }

  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      state.speedMultiplier = parseFloat(e.target.value) || 1.0;
    });
  }

  function advanceSimulationStep(dt) {
    state.simTime += dt * state.speedMultiplier;
    if (clockHudEl) clockHudEl.textContent = `t: ${state.simTime.toFixed(2)} s`;
    renderCanvas2D();
    updateMiniGraph();
  }

  function runSimulationLoop() {
    if (!state.isPlaying) return;
    advanceSimulationStep(0.03);
    state.animFrameId = requestAnimationFrame(runSimulationLoop);
  }

  // 7. Experimental Data Recording & Graphing
  function updateReadingHeadings(code) {
    const labels = code === 'electricity'
      ? ['#', 'Time (s)', 'Voltage (V)', 'Current (A)', 'Resistance (Ω)', 'Power (W)']
      : code === 'oscillations'
        ? ['#', 'Time (s)', 'Length (m)', 'Period (s)', 'Gravity (m/s²)', 'Energy (J)']
        : code === 'forces'
          ? ['#', 'Time (s)', 'Extension (m)', 'Load (kg)', 'Force (N)', 'Elastic energy (J)']
          : ['#', 'Time (s)', 'Position x (m)', 'Speed (m/s)', 'Weight (N)', 'Mechanical energy (J)'];
    const head = document.getElementById('phys-table-head');
    if (head) head.querySelectorAll('th').forEach((cell, index) => { cell.textContent = labels[index]; });
  }

  if (btnRecordReading) {
    btnRecordReading.addEventListener('click', () => {
      const t = Math.max(0, state.simTime);
      const code = state.activeTopic?.code || 'motion';
      let x; let v; let f; let e;

      // Use a coherent model for the selected topic so the data log reflects
      // the apparatus the learner is viewing, rather than always recording a projectile.
      if (code === 'electricity') {
        const voltage = 1 + (state.recordedData.length % 10); // V, stepped supply
        const resistance = 10; // Ω, fixed resistor
        const current = voltage / resistance;
        x = voltage; v = current; f = resistance; e = voltage * current; // V, A, Ω, W
      } else if (code === 'oscillations') {
        const length = 0.25 + (state.recordedData.length % 6) * 0.1; // m
        const period = 2 * Math.PI * Math.sqrt(length / 9.81);
        x = length; v = period; f = 9.81;
        e = 0.2 * 9.81 * length * (1 - Math.cos(Math.PI / 18)); // 0.2 kg bob, 10° release
      } else if (code === 'forces') {
        const mass = 0.1 + (state.recordedData.length % 8) * 0.1; // kg on a 20 N/m spring
        const force = mass * 9.81;
        x = force / 20; v = mass; f = force; e = 0.5 * 20 * x * x;
      } else {
        const flightTime = 2 * 25 * Math.sin(Math.PI / 4) / 9.81;
        const sampleTime = Math.min(t % flightTime, flightTime);
        const vx = 25 * Math.cos(Math.PI / 4);
        const vy = 25 * Math.sin(Math.PI / 4) - 9.81 * sampleTime;
        const mass = 2;
        const height = Math.max(0, 25 * Math.sin(Math.PI / 4) * sampleTime - 0.5 * 9.81 * sampleTime * sampleTime);
        x = vx * sampleTime;
        v = Math.hypot(vx, vy);
        f = mass * 9.81;
        e = 0.5 * mass * v * v + mass * 9.81 * height;
      }

      const point = {
        index: state.recordedData.length + 1,
        t: t.toFixed(2), x: x.toFixed(2), v: v.toFixed(2), f: f.toFixed(2), e: e.toFixed(2)
      };
      state.recordedData.push(point);
      renderDataTable();
      updateMiniGraph();
    });
  }

  if (btnClearData) {
    btnClearData.addEventListener('click', () => {
      state.recordedData = [];
      renderDataTable();
      updateMiniGraph();
    });
  }

  function renderDataTable() {
    if (!dataTableBody) return;
    if (state.recordedData.length === 0) {
      dataTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No experimental points recorded yet.</td></tr>';
      return;
    }
    dataTableBody.innerHTML = '';
    state.recordedData.forEach((d) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${d.index}</strong></td>
        <td>${d.t}</td>
        <td>${d.x}</td>
        <td>${d.v}</td>
        <td>${d.f}</td>
        <td>${d.e}</td>
      `;
      dataTableBody.appendChild(row);
    });
  }

  function updateMiniGraph() {
    const miniCanvas = document.getElementById('phys-mini-graph');
    if (!miniCanvas) return;
    const mctx = miniCanvas.getContext('2d');
    const mw = miniCanvas.width;
    const mh = miniCanvas.height;

    mctx.fillStyle = '#FFFFFF';
    mctx.fillRect(0, 0, mw, mh);

    // Axes
    mctx.strokeStyle = '#CBD5E1';
    mctx.lineWidth = 1;
    mctx.beginPath();
    mctx.moveTo(30, 10);
    mctx.lineTo(30, mh - 20);
    mctx.lineTo(mw - 10, mh - 20);
    mctx.stroke();

    // Data line
    if (state.recordedData.length > 1) {
      mctx.strokeStyle = '#2563EB';
      mctx.lineWidth = 2;
      mctx.beginPath();
      const n = state.recordedData.length;
      state.recordedData.forEach((pt, i) => {
        const px = 30 + (i / (n - 1)) * (mw - 50);
        const py = mh - 20 - (parseFloat(pt.x) / 70) * (mh - 35);
        if (i === 0) mctx.moveTo(px, py);
        else mctx.lineTo(px, py);
      });
      mctx.stroke();

      // Points
      mctx.fillStyle = '#DC2626';
      state.recordedData.forEach((pt, i) => {
        const px = 30 + (i / (n - 1)) * (mw - 50);
        const py = mh - 20 - (parseFloat(pt.x) / 70) * (mh - 35);
        mctx.beginPath();
        mctx.arc(px, py, 3, 0, Math.PI * 2);
        mctx.fill();
      });
    }
  }

  // 8. Vernier Caliper & Micrometer Scale Simulator
  const canvasScale = document.getElementById('canvas-scale-sim');
  const scaleObservedInput = document.getElementById('scale-observed-reading');
  const scaleZeroInput = document.getElementById('scale-zero-error');
  const scaleCorrectedVal = document.getElementById('scale-corrected-val');
  let activeScaleType = 'vernier'; // 'vernier' or 'micrometer'

  document.getElementById('tab-vernier')?.addEventListener('click', (e) => {
    activeScaleType = 'vernier';
    e.target.classList.add('active');
    document.getElementById('tab-micrometer')?.classList.remove('active');
    drawScaleSim();
  });

  document.getElementById('tab-micrometer')?.addEventListener('click', (e) => {
    activeScaleType = 'micrometer';
    e.target.classList.add('active');
    document.getElementById('tab-vernier')?.classList.remove('active');
    drawScaleSim();
  });

  function updateCorrectedScale() {
    const obs = parseFloat(scaleObservedInput?.value) || 0;
    const zero = parseFloat(scaleZeroInput?.value) || 0;
    const trueVal = obs - zero;
    if (scaleCorrectedVal) {
      scaleCorrectedVal.textContent = `${trueVal.toFixed(activeScaleType === 'micrometer' ? 2 : 1)} mm`;
    }
    drawScaleSim();
  }

  if (scaleObservedInput) scaleObservedInput.addEventListener('input', updateCorrectedScale);
  if (scaleZeroInput) scaleZeroInput.addEventListener('input', updateCorrectedScale);

  function drawScaleSim() {
    if (!canvasScale) return;
    const sctx = canvasScale.getContext('2d');
    const sw = canvasScale.width;
    const sh = canvasScale.height;

    sctx.fillStyle = '#FFFFFF';
    sctx.fillRect(0, 0, sw, sh);

    const obs = parseFloat(scaleObservedInput?.value) || 23.4;

    if (activeScaleType === 'vernier') {
      // Main scale bar
      sctx.fillStyle = '#E2E8F0';
      sctx.fillRect(40, 40, sw - 80, 50);
      sctx.strokeStyle = '#0F172A';
      sctx.lineWidth = 1;

      // Millimeter ticks on main scale
      for (let i = 0; i <= 60; i++) {
        const x = 50 + i * 10;
        const tickHeight = i % 10 === 0 ? 25 : i % 5 === 0 ? 18 : 12;
        sctx.beginPath();
        sctx.moveTo(x, 40);
        sctx.lineTo(x, 40 + tickHeight);
        sctx.stroke();
        if (i % 10 === 0) {
          sctx.fillStyle = '#0F172A';
          sctx.font = '10px Inter';
          sctx.fillText(`${i / 10}`, x - 4, 80);
        }
      }

      // Vernier sliding scale
      const vernierOffset = 50 + (obs % 10) * 10;
      sctx.fillStyle = '#BFDBFE';
      sctx.fillRect(vernierOffset, 90, 100, 40);
      sctx.strokeRect(vernierOffset, 90, 100, 40);

      for (let j = 0; j <= 10; j++) {
        const vx = vernierOffset + j * 9; // 9mm / 10 divisions = 0.9mm
        sctx.beginPath();
        sctx.moveTo(vx, 90);
        sctx.lineTo(vx, 90 + (j % 5 === 0 ? 16 : 10));
        sctx.stroke();
      }
    } else {
      // Micrometer barrel sleeve
      sctx.fillStyle = '#CBD5E1';
      sctx.fillRect(60, 60, 240, 80);
      sctx.strokeStyle = '#0F172A';
      sctx.lineWidth = 2;
      sctx.strokeRect(60, 60, 240, 80);

      // Datum line
      sctx.beginPath();
      sctx.moveTo(60, 100);
      sctx.lineTo(300, 100);
      sctx.stroke();

      // Thimble cylinder
      sctx.fillStyle = '#94A3B8';
      sctx.fillRect(300, 40, 260, 120);
      sctx.strokeRect(300, 40, 260, 120);

      // Thimble graduations
      sctx.strokeStyle = '#0F172A';
      sctx.lineWidth = 1;
      for (let k = 0; k <= 50; k += 5) {
        const ty = 40 + (k / 50) * 120;
        sctx.beginPath();
        sctx.moveTo(300, ty);
        sctx.lineTo(320, ty);
        sctx.stroke();
        sctx.font = '9px monospace';
        sctx.fillText(`${k}`, 325, ty + 3);
      }
    }
  }

  // 9. Experiment Templates Modal
  function populateTemplatesModal() {
    const container = document.getElementById('templates-grid-container');
    if (!container) return;
    container.innerHTML = '';

    EXPERIMENT_TEMPLATES.forEach((tmpl) => {
      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6';
      col.innerHTML = `
        <div class="card h-100 shadow-sm border">
          <div class="card-body">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="p-2 rounded bg-primary-subtle text-primary">
                <i class="fa-solid ${tmpl.icon}"></i>
              </div>
              <h6 class="card-title fw-bold mb-0">${tmpl.title}</h6>
            </div>
            <p class="card-text small text-muted mb-3">${tmpl.description}</p>
            <button class="btn btn-sm btn-primary w-100 btn-load-tmpl" data-id="${tmpl.id}">
              <i class="fa-solid fa-play me-1"></i> Launch Template
            </button>
          </div>
        </div>
      `;
      col.querySelector('.btn-load-tmpl').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('modal-experiment-templates'))?.hide();
        loadExperimentTemplate(tmpl);
      });
      container.appendChild(col);
    });
  }

  function loadExperimentTemplate(tmpl) {
    if (inspectorTitleEl) inspectorTitleEl.textContent = tmpl.title;
    state.recordedData = [];
    renderDataTable();
    switchActiveMode('workspace2d');
  }

  // 10. Apparatus Library Modal
  function populateApparatusModal() {
    const container = document.getElementById('apparatus-categories-container');
    if (!container) return;
    container.innerHTML = '';

    APPARATUS_CATEGORIES.forEach((cat) => {
      const col = document.createElement('div');
      col.className = 'col-md-6';
      const itemsList = cat.items.map((it) => `<li class="list-group-item py-1 px-2 small">${it}</li>`).join('');
      col.innerHTML = `
        <div class="card border mb-2">
          <div class="card-header bg-light py-2 fw-bold small text-primary">
            <i class="fa-solid ${cat.icon} me-1"></i> ${cat.title}
          </div>
          <ul class="list-group list-group-flush">
            ${itemsList}
          </ul>
        </div>
      `;
      container.appendChild(col);
    });
  }

  // 11. Guided Labs Protocol View
  function renderGuidedExperimentView() {
    const titleEl = document.getElementById('guide-topic-title');
    const contentEl = document.getElementById('guide-topic-content');
    if (!titleEl || !contentEl) return;

    const topic = state.activeTopic || { title: 'General Physics Experiment', code: 'motion' };
    titleEl.textContent = `Guided Protocol: ${topic.title}`;

    contentEl.innerHTML = `
      <div class="row g-4">
        <div class="col-md-8">
          <div class="card p-3 mb-3 border">
            <h6 class="fw-bold text-dark"><i class="fa-solid fa-bullseye text-danger me-2"></i> Objectives</h6>
            <ul class="small text-muted mb-0">
              <li>Formulate and test experimental hypothesis for ${topic.title}.</li>
              <li>Calibrate apparatus, evaluate instrument zero error, and record systematic observations.</li>
              <li>Construct analytical graphs and determine gradient and intercept values.</li>
              <li>Quantify experimental uncertainty and evaluate sources of error.</li>
            </ul>
          </div>
          <div class="card p-3 border mb-3">
            <h6 class="fw-bold text-dark"><i class="fa-solid fa-list-ol text-primary me-2"></i> Step-by-Step Procedure</h6>
            <ol class="small text-muted">
              <li>Assemble components on the 2D workbench according to standard laboratory protocol.</li>
              <li>Inspect measurement instruments for zero error (e.g. vernier calipers, ammeters).</li>
              <li>Vary the independent variable across 6 distinct equally-spaced increments.</li>
              <li>Record dependent variable readings into the Experimental Data Dock.</li>
              <li>Export data points to the Graphing Laboratory to fit a linear regression line.</li>
            </ol>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card p-3 border bg-light">
            <h6 class="fw-bold text-dark mb-2"><i class="fa-solid fa-triangle-exclamation text-warning me-2"></i> Safety & Protocol</h6>
            <p class="small text-muted">Disconnect electrical power when altering circuits. Wear protective eyewear when heating fluids or applying high tension to spring assemblies.</p>
            <a href="/graphing-lab.html?subject=PHYSICS" target="_blank" class="btn btn-sm btn-outline-primary w-100">
              <i class="fa-solid fa-chart-line me-1"></i> Open Graphing Studio
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 12. CBT Practical View
  function renderCbtPracticalView() {
    const container = document.getElementById('cbt-questions-container');
    if (!container) return;

    container.innerHTML = `
      <div class="card p-3 mb-3 border">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-primary">QUESTION 1: MEASUREMENT READING</span>
          <span class="text-muted small">Max Score: 5 Marks</span>
        </div>
        <p class="fw-semibold mb-2">A student uses a micrometer screw gauge to measure the diameter of a resistance wire. The main sleeve reading is 2.5 mm, and the 34th thimble graduation aligns with the datum line. The gauge has a zero error of +0.02 mm. What is the corrected diameter of the wire?</p>
        <div class="input-group input-group-sm mb-3" style="max-width: 250px;">
          <input type="number" step="0.01" class="form-control" id="cbt-q1-input" placeholder="e.g. 2.82" />
          <span class="input-group-text">mm</span>
          <button class="btn btn-primary" id="btn-cbt-q1-check">Submit</button>
        </div>
        <div id="cbt-q1-feedback" class="small"></div>
      </div>
    `;

    document.getElementById('btn-cbt-q1-check')?.addEventListener('click', async () => {
      const val = document.getElementById('cbt-q1-input')?.value;
      const feedbackEl = document.getElementById('cbt-q1-feedback');
      try {
        const res = await fetch('/api/physics/grade-measurement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_reading: val,
            correct_reading: 2.84, // 2.5 + 0.34
            zero_error: 0.02,
            tolerance: 0.02,
            unit: 'mm'
          })
        });
        const data = await res.json();
        if (feedbackEl) {
          feedbackEl.innerHTML = data.isCorrect
            ? `<div class="alert alert-success py-2 mb-0"><i class="fa-solid fa-check-circle me-1"></i> ${data.feedback}</div>`
            : `<div class="alert alert-danger py-2 mb-0"><i class="fa-solid fa-circle-xmark me-1"></i> ${data.feedback}</div>`;
        }
      } catch (err) {
        console.warn('Auto-grade request failed:', err);
      }
    });
  }

  // 13. Three.js 3D Viewport
  let threeRenderer = null, threeScene = null, threeCamera = null;
  function render3DViewport() {
    if (!container3d || typeof THREE === 'undefined') return;
    if (!threeRenderer) {
      container3d.innerHTML = '';
      const w = container3d.clientWidth || 800;
      const h = container3d.clientHeight || 500;

      threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color(0x0f172a);

      threeCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      threeCamera.position.set(0, 5, 12);
      threeCamera.lookAt(0, 0, 0);

      threeRenderer = new THREE.WebGLRenderer({ antialias: true });
      threeRenderer.setSize(w, h);
      container3d.appendChild(threeRenderer.domElement);

      const light = new THREE.DirectionalLight(0xffffff, 1.2);
      light.position.set(5, 10, 7);
      threeScene.add(light);
      threeScene.add(new THREE.AmbientLight(0x404040, 1.0));

      // Grid helper
      const grid = new THREE.GridHelper(20, 20, 0x2563eb, 0x334155);
      threeScene.add(grid);

      // Central Physics Object (Orbital Earth & Satellite)
      const earthGeo = new THREE.SphereGeometry(1.8, 32, 32);
      const earthMat = new THREE.MeshPhongMaterial({ color: 0x0284c7, wireframe: false });
      const earth = new THREE.Mesh(earthGeo, earthMat);
      threeScene.add(earth);

      const satGeo = new THREE.BoxGeometry(0.4, 0.2, 0.3);
      const satMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
      const satellite = new THREE.Mesh(satGeo, satMat);
      threeScene.add(satellite);

      let angle = 0;
      function animate3D() {
        if (state.activeMode === 'viewport3d') {
          requestAnimationFrame(animate3D);
          angle += 0.02 * state.speedMultiplier;
          satellite.position.set(4 * Math.cos(angle), 0.5 * Math.sin(angle), 4 * Math.sin(angle));
          earth.rotation.y += 0.005;
          threeRenderer.render(threeScene, threeCamera);
        }
      }
      animate3D();
    }
  }

  // 14. Save Experiment Endpoint
  if (btnSaveExperiment) {
    btnSaveExperiment.addEventListener('click', async () => {
      const title = prompt('Enter a title for this Physics Experiment:', state.activeTopic ? `${state.activeTopic.title} Setup` : 'My Physics Setup');
      if (!title) return;

      try {
        const res = await fetch('/api/physics/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            topic_code: state.activeTopic ? state.activeTopic.code : 'virtual-experiments',
            apparatus: state.apparatusList,
            connections: [],
            variables: { mass: 2.0, gravity: 9.81 },
            data_readings: state.recordedData
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('Physics experiment saved successfully!');
        } else {
          alert(data.error || 'Failed to save experiment.');
        }
      } catch (err) {
        alert('Network error saving experiment.');
      }
    });
  }

  // Initialize
  loadCurriculumTopics();
  populateTemplatesModal();
  populateApparatusModal();
  resizeCanvas();
  drawScaleSim();
});
