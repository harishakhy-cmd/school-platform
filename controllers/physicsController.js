'use strict';

const pool = require('../config/database');

// Comprehensive 27-Module Physics Curriculum Registry
const CURRICULUM_TOPICS = [
  {
    code: 'measurements-units',
    title: 'Measurements & Units',
    branch: 'General Physics',
    category: 'Foundations & Metrology',
    icon: 'fa-ruler-combined',
    description: 'SI base units, derived units, dimensional analysis, vernier calipers (0.1mm), micrometer screw gauge (0.01mm), zero error correction, and measurement uncertainty.',
    modes: ['apparatus_sim', 'scale_reading', 'uncertainty_calc'],
    equations: [
      { name: 'Measured Value with Zero Error', latex: 'x_{\\text{true}} = x_{\\text{observed}} - (\\pm \\text{Zero Error})' },
      { name: 'Percentage Uncertainty', latex: '\\% \\, \\Delta = \\left(\\frac{\\Delta x}{x}\\right) \\times 100\\%' }
    ],
    apparatus: ['metre_rule', 'vernier_calipers', 'micrometer_gauge', 'stopwatch', 'electronic_balance']
  },
  {
    code: 'vectors',
    title: 'Vectors & Scalars',
    branch: 'Mechanics',
    category: 'Classical Mechanics',
    icon: 'fa-arrows-split-up-and-left',
    description: 'Vector magnitude, direction, horizontal and vertical components, resultant vectors by head-to-tail polygon and parallelogram law of forces.',
    modes: ['vector_canvas', 'component_resolver', 'equilibrium_table'],
    equations: [
      { name: 'Component Resolution', latex: 'F_x = F \\cos\\theta, \\quad F_y = F \\sin\\theta' },
      { name: 'Resultant Magnitude', latex: 'R = \\sqrt{R_x^2 + R_y^2}, \\quad \\alpha = \\arctan(R_y / R_x)' }
    ],
    apparatus: ['force_table', 'pulleys', 'slotted_masses', 'protractor', 'spring_balances']
  },
  {
    code: 'motion',
    title: 'Motion & Kinematics',
    branch: 'Mechanics',
    category: 'Classical Mechanics',
    icon: 'fa-person-running',
    description: 'Linear uniform and uniformly accelerated motion, free fall under gravity, vertical projection, projectile trajectories, s-t, v-t, and a-t graphs.',
    modes: ['kinematics_sim', 'projectile_launcher', 'ticker_timer'],
    equations: [
      { name: 'First Equation of Motion', latex: 'v = u + at' },
      { name: 'Displacement Equation', latex: 's = ut + \\frac{1}{2}at^2' },
      { name: 'Velocity-Displacement', latex: 'v^2 = u^2 + 2as' },
      { name: 'Projectile Range', latex: 'R = \\frac{u^2 \\sin(2\\theta)}{g}' }
    ],
    apparatus: ['ticker_timer', 'air_track', 'light_gates', 'projectile_cannon', 'stopwatch']
  },
  {
    code: 'forces',
    title: 'Forces & Newton’s Laws',
    branch: 'Mechanics',
    category: 'Classical Mechanics',
    icon: 'fa-weight-hanging',
    description: 'Newton’s three laws of motion, inertia, weight, normal contact reaction, friction (static and kinetic), tension in strings, and interactive free-body diagrams.',
    modes: ['fbd_canvas', 'newton2_trolley', 'friction_ramp'],
    equations: [
      { name: 'Newton’s Second Law', latex: '\\sum \\vec{F} = m\\vec{a}' },
      { name: 'Limiting Static Friction', latex: 'F_s \\le \\mu_s R_N, \\quad F_k = \\mu_k R_N' }
    ],
    apparatus: ['dynamics_trolley', 'runway', 'spring_balance', 'hanging_masses', 'friction_blocks']
  },
  {
    code: 'work-energy-power',
    title: 'Work, Energy & Power',
    branch: 'Mechanics',
    category: 'Classical Mechanics',
    icon: 'fa-bolt',
    description: 'Mechanical work done, gravitational potential energy, kinetic energy, conservation of mechanical energy, work-energy theorem, power and mechanical efficiency.',
    modes: ['energy_skate_park', 'roller_coaster_sim', 'power_lifter'],
    equations: [
      { name: 'Work Done', latex: 'W = F d \\cos\\theta' },
      { name: 'Kinetic Energy', latex: 'KE = \\frac{1}{2}mv^2' },
      { name: 'Gravitational Potential Energy', latex: 'PE = mgh' },
      { name: 'Mechanical Efficiency', latex: '\\eta = \\left(\\frac{W_{\\text{useful}}}{W_{\\text{input}}}\\right) \\times 100\\%' }
    ],
    apparatus: ['incline_track', 'steel_ball', 'pendulum_bob', 'spring_assembly']
  },
  {
    code: 'simple-machines',
    title: 'Simple Machines',
    branch: 'Mechanics',
    category: 'Applied Mechanics',
    icon: 'fa-gears',
    description: 'Mechanical advantage (MA), velocity ratio (VR), and efficiency for levers (classes 1, 2, 3), block and tackle pulley systems, inclined planes, wheel & axle, and hydraulic press.',
    modes: ['machine_rig', 'pulley_system', 'lever_fulcrum'],
    equations: [
      { name: 'Mechanical Advantage', latex: 'MA = \\frac{\\text{Load } (L)}{\\text{Effort } (E)}' },
      { name: 'Velocity Ratio', latex: 'VR = \\frac{\\text{Distance moved by Effort } (d_E)}{\\text{Distance moved by Load } (d_L)}' },
      { name: 'Machine Efficiency', latex: '\\eta = \\frac{MA}{VR} \\times 100\\%' }
    ],
    apparatus: ['lever_arm', 'single_pulley', 'double_pulley', 'inclined_plane', 'screw_jack']
  },
  {
    code: 'pressure-fluids',
    title: 'Pressure & Fluids',
    branch: 'Thermal & Fluid Physics',
    category: 'Fluids & Matter',
    icon: 'fa-water',
    description: 'Density of solids and liquids, hydrostatic liquid pressure, U-tube manometers, Archimedes’ principle, upthrust, buoyant flotation condition, and Pascal’s hydraulic principle.',
    modes: ['liquid_tank', 'u_tube_manometer', 'hydraulic_press_sim'],
    equations: [
      { name: 'Hydrostatic Pressure', latex: 'P = \\rho g h' },
      { name: 'Archimedes Upthrust', latex: 'U = \\rho_{\\text{fluid}} V_{\\text{submerged}} g' },
      { name: 'Pascal Hydraulic Law', latex: '\\frac{F_1}{A_1} = \\frac{F_2}{A_2}' }
    ],
    apparatus: ['overflow_can', 'graduated_cylinder', 'manometer_tube', 'hydrometer', 'density_blocks']
  },
  {
    code: 'thermal-physics',
    title: 'Thermal Physics',
    branch: 'Thermal & Fluid Physics',
    category: 'Thermodynamics',
    icon: 'fa-temperature-high',
    description: 'Temperature scales, heat transfer mechanisms (conduction, convection, radiation), thermal expansion, specific heat capacity of metals/water, and latent heat of fusion/vaporization.',
    modes: ['calorimetry_sim', 'conduction_rods', 'cooling_curve'],
    equations: [
      { name: 'Heat Capacity Equation', latex: 'Q = mc\\Delta T' },
      { name: 'Latent Heat Equation', latex: 'Q = mL' },
      { name: 'Method of Mixtures', latex: 'm_1 c_1 (T_1 - T_f) = m_2 c_2 (T_f - T_2)' }
    ],
    apparatus: ['copper_calorimeter', 'bunsen_burner', 'digital_thermometer', 'immersion_heater', 'insulating_jacket']
  },
  {
    code: 'gas-laws',
    title: 'Gas Laws & Kinetic Theory',
    branch: 'Thermal & Fluid Physics',
    category: 'Thermodynamics',
    icon: 'fa-gauge-high',
    description: 'Ideal gas assumptions, Boyle’s Law (P-V isothermal), Charles’s Law (V-T isobaric), Pressure Law (P-T isochoric), Combined gas law, and absolute zero in Kelvin.',
    modes: ['gas_syringe_sim', 'piston_chamber', 'molecular_gas_box'],
    equations: [
      { name: 'Boyle’s Law', latex: 'P_1 V_1 = P_2 V_2 \\quad (T = \\text{const})' },
      { name: 'Charles’s Law', latex: '\\frac{V_1}{T_1} = \\frac{V_2}{T_2} \\quad (P = \\text{const})' },
      { name: 'Ideal Gas Equation', latex: 'PV = nRT = N k_B T' }
    ],
    apparatus: ['gas_syringe', 'pressure_gauge', 'water_bath_thermostat', 'sealed_gas_vessel']
  },
  {
    code: 'waves',
    title: 'Waves & Wave Motion',
    branch: 'Waves & Optics',
    category: 'Vibrations & Optics',
    icon: 'fa-water',
    description: 'Transverse and longitudinal wave kinematics, amplitude, wavelength, frequency, wave speed equation, reflection, refraction, single/double-slit diffraction, and constructive/destructive interference.',
    modes: ['ripple_tank_sim', 'wave_generator', 'standing_wave_string'],
    equations: [
      { name: 'Wave Equation', latex: 'v = f \\lambda = \\frac{\\lambda}{T}' },
      { name: 'Phase Difference', latex: '\\Delta \\phi = \\frac{2\\pi}{\\lambda} \\Delta x' }
    ],
    apparatus: ['ripple_tank', 'stroboscope', 'vibrating_blade', 'wave_string', 'slits_barrier']
  },
  {
    code: 'sound',
    title: 'Sound & Acoustics',
    branch: 'Waves & Optics',
    category: 'Vibrations & Optics',
    icon: 'fa-volume-high',
    description: 'Speed of sound in air, resonance in resonance tubes (open and closed pipes), end correction, tuning fork excitation, Doppler effect frequency shifts, and echo ranging.',
    modes: ['resonance_tube_sim', 'tuning_fork_osc', 'doppler_car'],
    equations: [
      { name: 'Closed Pipe Resonance', latex: 'L + c = \\frac{(2n - 1)}{4} \\lambda' },
      { name: 'Speed of Sound by Echo', latex: 'v = \\frac{2d}{t}' },
      { name: 'Doppler Frequency Shift', latex: 'f\' = f \\left(\\frac{v \\pm v_o}{v \\mp v_s}\\right)' }
    ],
    apparatus: ['resonance_tube', 'tuning_forks', 'rubber_mallet', 'signal_generator', 'sound_sensor']
  },
  {
    code: 'light-optics',
    title: 'Light & Ray Optics',
    branch: 'Waves & Optics',
    category: 'Vibrations & Optics',
    icon: 'fa-sun',
    description: 'Reflection at plane and curved spherical mirrors, refraction through rectangular glass blocks and triangular prisms, Snell’s Law, critical angle, total internal reflection, and thin lens image formation.',
    modes: ['ray_optics_bench', 'prism_spectrometer', 'lens_imaging_bench'],
    equations: [
      { name: 'Snell’s Law of Refraction', latex: 'n_1 \\sin\\theta_1 = n_2 \\sin\\theta_2' },
      { name: 'Critical Angle', latex: '\\sin c = \\frac{1}{n}' },
      { name: 'Lens Formula', latex: '\\frac{1}{f} = \\frac{1}{u} + \\frac{1}{v}' },
      { name: 'Linear Magnification', latex: 'm = \\frac{v}{u} = \\frac{h_i}{h_o}' }
    ],
    apparatus: ['optical_bench', 'convex_lens', 'concave_lens', 'glass_block', 'triangular_prism', 'plane_mirror', 'illuminated_crosswire', 'screen']
  },
  {
    code: 'electricity',
    title: 'Current Electricity & Circuits',
    branch: 'Electricity & Magnetism',
    category: 'Electrodynamics',
    icon: 'fa-plug-circle-bolt',
    description: 'Current, voltage, Ohm’s Law, electrical resistance, factors affecting resistance (length, area, resistivity), series and parallel combinations, internal resistance, and electromotive force (EMF).',
    modes: ['circuit_builder_2d', 'ohms_law_bench', 'wheatstone_bridge'],
    equations: [
      { name: 'Ohm’s Law', latex: 'V = IR' },
      { name: 'Resistors in Series', latex: 'R_s = R_1 + R_2 + R_3' },
      { name: 'Resistors in Parallel', latex: '\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}' },
      { name: 'Cell EMF and Internal Resistance', latex: 'E = I(R + r) = V + Ir' }
    ],
    apparatus: ['dc_power_supply', 'ammeter', 'voltmeter', 'rheostat', 'standard_resistors', 'connecting_wires', 'knife_switch']
  },
  {
    code: 'magnetism',
    title: 'Magnetism & Magnetic Fields',
    branch: 'Electricity & Magnetism',
    category: 'Electrodynamics',
    icon: 'fa-magnet',
    description: 'Permanent bar magnets, magnetic poles, magnetic field lines, plotting compass methods, neutral points in Earth’s magnetic field, electromagnets, and domain theory.',
    modes: ['magnetic_field_canvas', 'plotting_compass_grid', 'solenoid_field'],
    equations: [
      { name: 'Magnetic Force on Charge', latex: 'F = q v B \\sin\\theta' },
      { name: 'Force on Current-Carrying Conductor', latex: 'F = B I L \\sin\\theta' }
    ],
    apparatus: ['bar_magnets', 'horseshoe_magnet', 'plotting_compasses', 'iron_filings', 'solenoid_coil', 'soft_iron_core']
  },
  {
    code: 'electromagnetic-induction',
    title: 'Electromagnetic Induction',
    branch: 'Electricity & Magnetism',
    category: 'Electrodynamics',
    icon: 'fa-atom',
    description: 'Faraday’s Law of electromagnetic induction, Lenz’s Law of direction, induced EMF, AC generators, DC motors, and step-up/step-down electrical transformers.',
    modes: ['induction_coil_sim', 'transformer_rig', 'dc_motor_3d'],
    equations: [
      { name: 'Faraday-Lenz Law', latex: '\\mathcal{E} = -N \\frac{\\Delta\\Phi}{\\Delta t}' },
      { name: 'Transformer Ratio', latex: '\\frac{V_s}{V_p} = \\frac{N_s}{N_p} = \\frac{I_p}{I_s}' }
    ],
    apparatus: ['galvanometer', 'induction_coils', 'laminated_core', 'bar_magnet', 'commutator_motor']
  },
  {
    code: 'electrostatics',
    title: 'Electrostatics & Electric Fields',
    branch: 'Electricity & Magnetism',
    category: 'Electrodynamics',
    icon: 'fa-circle-radiation',
    description: 'Electrostatic charges (positive and negative), charging by friction, conduction, and induction, gold-leaf electroscope detection, Coulomb’s Law, and electric field lines between parallel plates.',
    modes: ['coulomb_charges_canvas', 'gold_leaf_electroscope', 'parallel_plate_field'],
    equations: [
      { name: 'Coulomb’s Inverse-Square Law', latex: 'F = k_e \\frac{|q_1 q_2|}{r^2} = \\frac{1}{4\\pi\\varepsilon_0} \\frac{|q_1 q_2|}{r^2}' },
      { name: 'Uniform Electric Field', latex: 'E = \\frac{V}{d} = \\frac{F}{q}' }
    ],
    apparatus: ['gold_leaf_electroscope', 'polythene_rod', 'acetate_rod', 'wool_cloth', 'van_de_graaff']
  },
  {
    code: 'circular-motion',
    title: 'Circular Motion & Dynamics',
    branch: 'Mechanics',
    category: 'Classical Mechanics',
    icon: 'fa-arrows-spin',
    description: 'Angular displacement, angular velocity, period, frequency, centripetal acceleration, centripetal force in horizontal/vertical circles, conical pendulum, and banked road curves.',
    modes: ['circular_turntable', 'conical_pendulum', 'banked_track'],
    equations: [
      { name: 'Angular Velocity', latex: '\\omega = \\frac{2\\pi}{T} = 2\\pi f' },
      { name: 'Centripetal Acceleration', latex: 'a_c = \\frac{v^2}{r} = \\omega^2 r' },
      { name: 'Centripetal Force', latex: 'F_c = \\frac{m v^2}{r} = m \\omega^2 r' }
    ],
    apparatus: ['whirling_bob', 'slotted_masses_hanger', 'stopwatch', 'glass_tube_sleeving']
  },
  {
    code: 'gravitation',
    title: 'Gravitation & Orbital Mechanics',
    branch: 'Mechanics',
    category: 'Astrophysics & Space',
    icon: 'fa-globe',
    description: 'Newton’s Law of Universal Gravitation, gravitational field strength, orbital velocity of satellites, geostationary orbits, escape velocity, and Kepler’s three laws of planetary motion.',
    modes: ['orbital_gravity_3d', 'kepler_orbit_canvas', 'field_strength_plot'],
    equations: [
      { name: 'Universal Law of Gravitation', latex: 'F = G \\frac{m_1 m_2}{r^2}' },
      { name: 'Gravitational Field Strength', latex: 'g = \\frac{G M}{r^2}' },
      { name: 'Orbital Speed', latex: 'v_{\\text{orb}} = \\sqrt{\\frac{G M}{r}}' },
      { name: 'Escape Velocity', latex: 'v_{\\text{esc}} = \\sqrt{\\frac{2 G M}{R}}' }
    ],
    apparatus: ['earth_satellite_model', 'torsion_balance_model']
  },
  {
    code: 'oscillations',
    title: 'Oscillations & Simple Harmonic Motion',
    branch: 'Mechanics',
    category: 'Classical Mechanics',
    icon: 'fa-clock',
    description: 'Simple Harmonic Motion (SHM) definition, simple pendulum period dependence on length and g, helical spring-mass system (Hooke’s law and dynamic oscillations), damped oscillations, and resonance.',
    modes: ['pendulum_lab', 'spring_mass_oscillator', 'damping_resonance_curve'],
    equations: [
      { name: 'Simple Pendulum Period', latex: 'T = 2\\pi \\sqrt{\\frac{L}{g}}' },
      { name: 'Helical Spring Period', latex: 'T = 2\\pi \\sqrt{\\frac{m}{k}}' },
      { name: 'SHM Acceleration Condition', latex: 'a = -\\omega^2 x' }
    ],
    apparatus: ['retort_stand', 'pendulum_bobs', 'helical_springs', 'optical_timer', 'slotted_masses']
  },
  {
    code: 'atomic-physics',
    title: 'Atomic Physics & Spectra',
    branch: 'Modern Physics',
    category: 'Quantum & Atomic',
    icon: 'fa-circle-nodes',
    description: 'Rutherford alpha particle scattering experiment and nuclear atom model, Bohr hydrogen atom postulates, quantized energy levels, electron transitions, photon emission, and spectral line series.',
    modes: ['rutherford_scattering_sim', 'bohr_energy_levels', 'spectral_lines_viewer'],
    equations: [
      { name: 'Photon Energy', latex: 'E = h f = \\frac{h c}{\\lambda}' },
      { name: 'Bohr Hydrogen Energy Levels', latex: 'E_n = -\\frac{13.6}{n^2} \\, \\text{eV}' }
    ],
    apparatus: ['discharge_tubes', 'spectrometer', 'diffraction_grating']
  },
  {
    code: 'nuclear-physics',
    title: 'Nuclear Physics & Radioactivity',
    branch: 'Modern Physics',
    category: 'Nuclear Physics',
    icon: 'fa-biohazard',
    description: 'Nuclear composition (protons, neutrons, isotopes), alpha, beta, and gamma radiation properties and penetration, radioactive decay law, half-life, decay constant, nuclear fission, and fusion.',
    modes: ['radioactive_decay_counter', 'radiation_penetration_barrier', 'nuclear_fission_chain'],
    equations: [
      { name: 'Radioactive Decay Law', latex: 'N(t) = N_0 e^{-\\lambda t} = N_0 \\left(\\frac{1}{2}\\right)^{t / T_{1/2}}' },
      { name: 'Half-Life Relation', latex: 'T_{1/2} = \\frac{\\ln 2}{\\lambda} \\approx \\frac{0.693}{\\lambda}' },
      { name: 'Mass-Energy Equivalence', latex: 'E = \\Delta m \\cdot c^2' }
    ],
    apparatus: ['geiger_muller_counter', 'ratemeter', 'lead_aluminum_absorbers', 'radioactive_sources_sim']
  },
  {
    code: 'modern-physics',
    title: 'Modern & Quantum Physics',
    branch: 'Modern Physics',
    category: 'Quantum & Relativity',
    icon: 'fa-wand-magic-sparkles',
    description: 'Photoelectric effect experiments, work function, threshold frequency, stopping potential, wave-particle duality, de Broglie wavelength of matter, and special relativity length contraction / time dilation concepts.',
    modes: ['photoelectric_bench', 'de_broglie_wavelength_calc', 'relativity_lorentz_factor'],
    equations: [
      { name: 'Einstein Photoelectric Equation', latex: 'h f = \\Phi + KE_{\\max} = h f_0 + e V_s' },
      { name: 'de Broglie Wavelength', latex: '\\lambda = \\frac{h}{p} = \\frac{h}{m v}' }
    ],
    apparatus: ['photocell', 'spectral_lamp_filters', 'variable_reverse_voltage', 'sensitive_nanoammeter']
  },
  {
    code: 'electronics',
    title: 'Introductory Electronics',
    branch: 'Electronics & Computing',
    category: 'Applied Electronics',
    icon: 'fa-microchip',
    description: 'Semiconductor basics, p-n junction diode forward/reverse characteristics, half-wave and full-wave bridge rectification, light emitting diodes (LEDs), and logic gates (AND, OR, NOT, NAND, NOR) with truth tables.',
    modes: ['logic_gate_builder', 'diode_rectifier_bench', 'transistor_switch_sim'],
    equations: [
      { name: 'Diode Shockley Equation', latex: 'I = I_s \\left(e^{V / \\eta V_T} - 1\\right)' },
      { name: 'Transistor Current Gain', latex: '\\beta = \\frac{I_c}{I_b}' }
    ],
    apparatus: ['logic_gate_trainer', 'breadboard', 'silicon_diodes', 'leds', 'npn_transistors', 'oscilloscope_sim']
  },
  {
    code: 'virtual-experiments',
    title: 'Virtual Experiments Workbench',
    branch: 'Laboratory Practicals',
    category: 'Hands-On Labs',
    icon: 'fa-flask-vial',
    description: '12 guided virtual physics experiments: Ohm’s Law, Hooke’s Law, Pendulum acceleration due to gravity, Snell’s Law of Refraction, Boyle’s Law, and Archimedes Upthrust with full data logging.',
    modes: ['interactive_workbench', 'guided_protocol', 'data_logger'],
    equations: [
      { name: 'Hooke’s Law', latex: 'F = k \\Delta x' },
      { name: 'Ohm’s Law', latex: 'R = \\frac{\\Delta V}{\\Delta I}' }
    ],
    apparatus: ['all_apparatus']
  },
  {
    code: 'apparatus-library',
    title: 'Apparatus Library & Inventory',
    branch: 'Laboratory Practicals',
    category: 'Equipment & Tooling',
    icon: 'fa-boxes-stacked',
    description: 'Comprehensive categorized apparatus library: 10 equipment categories with customizable physical parameters, connection nodes, and live drag-and-drop stencils.',
    modes: ['inventory_browser', 'spec_sheet', 'stencil_export'],
    apparatus: ['all_categories']
  },
  {
    code: 'graphing-data-analysis',
    title: 'Graphing & Data Analysis',
    branch: 'Scientific Computing',
    category: 'Analysis & Statistics',
    icon: 'fa-chart-line',
    description: 'Integration with the Interactive Graphing Laboratory: plot displacement-time, velocity-time, force-extension, current-voltage, pressure-volume, and cooling curves with linear regression line of best fit.',
    modes: ['graph_workbench', 'regression_solver', 'csv_export'],
    apparatus: ['graphing_engine']
  },
  {
    code: 'practical-assessments',
    title: 'Practical Assessments & CBT',
    branch: 'Assessment & Examination',
    category: 'Evaluations',
    icon: 'fa-clipboard-check',
    description: 'Physics practical assessments, interactive CBT question bank: vernier caliper scale reading, circuit fault-finding, ray diagram alignment, and numerical calculation with tolerance auto-grading.',
    modes: ['cbt_practical', 'scale_quiz', 'circuit_challenge'],
    apparatus: ['assessment_engine']
  }
];

// 1. Get Curriculum Topics List
async function getCurriculumTopics(req, res, next) {
  try {
    const list = CURRICULUM_TOPICS.map((t) => ({
      code: t.code,
      title: t.title,
      branch: t.branch,
      category: t.category,
      icon: t.icon,
      description: t.description,
      modes: t.modes
    }));
    res.json({ success: true, count: list.length, topics: list });
  } catch (err) {
    next(err);
  }
}

// 2. Get Single Topic Configuration
async function getTopicByCode(req, res, next) {
  try {
    const code = req.params.code;
    const topic = CURRICULUM_TOPICS.find((t) => t.code === code);
    if (!topic) {
      return res.status(404).json({ success: false, error: `Topic '${code}' not found in Physics curriculum` });
    }
    res.json({ success: true, topic });
  } catch (err) {
    next(err);
  }
}

// 3. List Saved Experiments
async function listExperiments(req, res, next) {
  try {
    const userIdentifier = req.session.registrationNumber || req.session.adminId || 'anonymous';
    const [rows] = await pool.query(
      `SELECT id, title, topic_code, classroom_id, created_at, updated_at
       FROM physics_experiments
       WHERE user_identifier = ? OR classroom_id IS NOT NULL
       ORDER BY updated_at DESC`,
      [String(userIdentifier)]
    );
    res.json({ success: true, count: rows.length, experiments: rows });
  } catch (err) {
    next(err);
  }
}

// 4. Save New or Update Experiment
async function saveExperiment(req, res, next) {
  try {
    const userIdentifier = req.session.registrationNumber || req.session.adminId || 'anonymous';
    const userRole = req.session.adminId ? 'admin' : 'student';
    const userId = req.session.userId || 1;

    const {
      title,
      topic_code = 'virtual-experiments',
      classroom_id = null,
      apparatus = [],
      connections = [],
      variables = {},
      data_readings = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Experiment title is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO physics_experiments 
        (user_id, user_role, user_identifier, classroom_id, title, topic_code, apparatus_json, connections_json, variables_json, data_readings_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userRole,
        String(userIdentifier),
        classroom_id,
        title.trim(),
        topic_code,
        JSON.stringify(apparatus),
        JSON.stringify(connections),
        JSON.stringify(variables),
        JSON.stringify(data_readings)
      ]
    );

    res.json({ success: true, experiment_id: result.insertId, message: 'Physics experiment saved successfully.' });
  } catch (err) {
    next(err);
  }
}

// 5. Get Single Experiment Detail
async function getExperimentById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT * FROM physics_experiments WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Experiment not found.' });
    }
    const exp = rows[0];
    res.json({
      success: true,
      experiment: {
        id: exp.id,
        title: exp.title,
        topic_code: exp.topic_code,
        classroom_id: exp.classroom_id,
        apparatus: typeof exp.apparatus_json === 'string' ? JSON.parse(exp.apparatus_json) : (exp.apparatus_json || []),
        connections: typeof exp.connections_json === 'string' ? JSON.parse(exp.connections_json) : (exp.connections_json || []),
        variables: typeof exp.variables_json === 'string' ? JSON.parse(exp.variables_json) : (exp.variables_json || {}),
        data_readings: typeof exp.data_readings_json === 'string' ? JSON.parse(exp.data_readings_json) : (exp.data_readings_json || []),
        created_at: exp.created_at,
        updated_at: exp.updated_at
      }
    });
  } catch (err) {
    next(err);
  }
}

// 6. Delete Saved Experiment
async function deleteExperiment(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const userIdentifier = req.session.registrationNumber || req.session.adminId;
    const [result] = await pool.query(
      `DELETE FROM physics_experiments WHERE id = ? AND (user_identifier = ? OR ? = 'admin')`,
      [id, String(userIdentifier), req.session.adminId ? 'admin' : 'student']
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Experiment deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// 7. Auto-Grading for Measurement Scale Questions (Vernier, Micrometer, Stopwatch, Ohm's Slope)
async function gradeMeasurementQuestion(req, res, next) {
  try {
    const { student_reading, correct_reading, zero_error = 0, tolerance = 0.05, unit = 'mm' } = req.body;

    const studentVal = parseFloat(student_reading);
    const correctVal = parseFloat(correct_reading);
    const zeroVal = parseFloat(zero_error);
    const tolVal = parseFloat(tolerance);

    if (isNaN(studentVal) || isNaN(correctVal)) {
      return res.status(400).json({ success: false, error: 'Numeric readings required for auto-grading.' });
    }

    // Expected value accounting for zero error: Observed - (Zero Error)
    const expectedCorrected = correctVal - zeroVal;
    const diff = Math.abs(studentVal - expectedCorrected);
    const isCorrect = diff <= tolVal;

    res.json({
      success: true,
      isCorrect,
      studentValue: studentVal,
      expectedValue: expectedCorrected,
      absoluteDifference: parseFloat(diff.toFixed(4)),
      tolerance: tolVal,
      unit,
      feedback: isCorrect
        ? `Accurate reading! Within allowed tolerance of ±${tolVal} ${unit}.`
        : `Reading out of bounds. Expected ${expectedCorrected.toFixed(3)} ${unit} (observed ${correctVal} minus zero error of ${zeroVal >= 0 ? '+' : ''}${zeroVal}), difference was ${diff.toFixed(3)} ${unit}.`
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  CURRICULUM_TOPICS,
  getCurriculumTopics,
  getTopicByCode,
  listExperiments,
  saveExperiment,
  getExperimentById,
  deleteExperiment,
  gradeMeasurementQuestion
};
