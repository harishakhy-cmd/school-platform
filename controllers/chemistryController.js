'use strict';

const pool = require('../config/database');

// ============================================================
// CURRICULUM REGISTRY — 33 Chemistry Modules
// ============================================================
const CURRICULUM_TOPICS = [
  { code: 'intro-chemistry',      title: 'Introduction to Chemistry',          branch: 'Foundations',               icon: 'fa-flask',             description: 'Nature of chemistry, scientific method, SI units, laboratory safety overview, and branches of chemistry (organic, inorganic, physical, analytical, biochemistry).', modes: ['canvas_overview','safety_guide'], keyConcepts: ['Scientific method','SI units','Matter classification'] },
  { code: 'lab-safety',           title: 'Laboratory Safety & Hazard Symbols', branch: 'Foundations',               icon: 'fa-shield-halved',     description: 'GHS hazard symbols, PPE selection, COSHH principles, emergency procedures, chemical disposal, and safe handling of acids, bases, and flammable substances.', modes: ['safety_guide','hazard_quiz'], keyConcepts: ['GHS symbols','PPE','COSHH','Fire triangle'] },
  { code: 'apparatus-library',    title: 'Apparatus Library & Glassware',      branch: 'Foundations',               icon: 'fa-flask-vial',        description: 'Selection, care, and use of laboratory glassware: beakers, conical flasks, volumetric flasks, burettes, pipettes, measuring cylinders, condensers, and support equipment.', modes: ['apparatus_browser','canvas_2d'], keyConcepts: ['Meniscus reading','Burette accuracy','Volumetric flask calibration'] },
  { code: 'matter-states',        title: 'Matter & States of Matter',          branch: 'Physical Chemistry',        icon: 'fa-cubes',             description: 'Particle theory of solids, liquids, and gases. Phase changes: melting, freezing, boiling, evaporation, condensation, sublimation. Effect of temperature and pressure.', modes: ['particle_sim','phase_diagram'], keyConcepts: ['Kinetic theory','Phase changes','Latent heat'] },
  { code: 'atomic-structure',     title: 'Atomic Structure',                   branch: 'Physical Chemistry',        icon: 'fa-atom',              description: 'Sub-atomic particles (proton, neutron, electron), atomic number, mass number, isotopes, electron shells, electron configuration, and ions. Bohr model vs. quantum description.', modes: ['atomic_3d','electron_config'], keyConcepts: ['Atomic number Z','Mass number A','Isotopes','Electron shells'] },
  { code: 'periodic-table',       title: 'Periodic Table',                     branch: 'Inorganic Chemistry',       icon: 'fa-table-cells',       description: 'All 118 elements organised by group and period. Periodic trends: atomic radius, ionisation energy, electronegativity, metallic character. Element classifications.', modes: ['periodic_table','trend_visualiser'], keyConcepts: ['Groups & periods','Periodic trends','Element classification'] },
  { code: 'chemical-bonding',     title: 'Chemical Bonding',                   branch: 'Physical Chemistry',        icon: 'fa-link',              description: 'Ionic bonding (electron transfer), covalent bonding (electron sharing), metallic bonding, coordinate/dative bonds. Lewis structures, bond polarity, molecular polarity.', modes: ['bonding_model','lewis_builder'], keyConcepts: ['Ionic vs covalent','Electronegativity difference','Lewis structures'] },
  { code: 'molecular-geometry',   title: 'Molecular Geometry (VSEPR)',         branch: 'Physical Chemistry',        icon: 'fa-shapes',            description: 'VSEPR theory. Geometries: linear, bent, trigonal planar, trigonal pyramidal, tetrahedral, trigonal bipyramidal, octahedral. Bond angles and lone pairs.', modes: ['vsepr_3d','geometry_quiz'], keyConcepts: ['Electron pairs','Bond angles','Lone pair repulsion'] },
  { code: 'chemical-formulae',    title: 'Chemical Formulae & Nomenclature',   branch: 'Foundations',               icon: 'fa-superscript',       description: 'Empirical, molecular, and structural formulae. IUPAC nomenclature for ionic and covalent compounds. Valency, oxidation states, and ionic charges.', modes: ['formula_builder','nomenclature_quiz'], keyConcepts: ['Valency','Oxidation states','IUPAC naming'] },
  { code: 'chemical-equations',   title: 'Chemical Equations & Balancing',     branch: 'Foundations',               icon: 'fa-equals',            description: 'Writing and balancing chemical equations by inspection and the algebraic (matrix) method. Conservation of mass and charge. State symbols. Ionic equations.', modes: ['equation_editor','balancer'], keyConcepts: ['Conservation of mass','Coefficients vs subscripts','State symbols'] },
  { code: 'mole-concept',         title: 'Mole Concept & Avogadro',            branch: 'Physical Chemistry',        icon: 'fa-calculator',        description: 'The mole as a counting unit. Molar mass, Avogadro constant (6.022×10²³ mol⁻¹). n = m/M, N = n×Nₐ, c = n/V, molar volume at STP (22.4 L mol⁻¹).', modes: ['mole_calc','mole_quiz'], keyConcepts: ['n=m/M','Avogadro constant','Molar volume'] },
  { code: 'stoichiometry',        title: 'Stoichiometry',                      branch: 'Physical Chemistry',        icon: 'fa-scale-balanced',    description: 'Mole ratios from balanced equations. Mass and volume calculations. Limiting and excess reagents. Percentage yield. Atom economy. Solution stoichiometry.', modes: ['stoich_calc','yield_sim'], keyConcepts: ['Mole ratio','Limiting reagent','% yield','Atom economy'] },
  { code: 'acids-bases-salts',    title: 'Acids, Bases & Salts',               branch: 'Physical Chemistry',        icon: 'fa-vial-circle-check', description: 'Arrhenius, Brønsted-Lowry definitions. Strong vs weak acids/bases. pH scale. Indicators (universal, litmus, phenolphthalein, methyl orange). Salt formation and hydrolysis.', modes: ['ph_sim','indicator_lab'], keyConcepts: ['pH = -log[H⁺]','Strong vs weak','Indicator ranges'] },
  { code: 'titration',            title: 'Titration Laboratory',               branch: 'Analytical Chemistry',      icon: 'fa-droplet',           description: 'Acid-base titration technique. Burette readings, titre calculation, concordant results. Concentration from titre. Titration curves. Back-titration.', modes: ['titration_lab','curve_plotter'], keyConcepts: ['Equivalence point','Concordant readings','Concentration calculation'] },
  { code: 'chemical-reactions',   title: 'Chemical Reactions',                 branch: 'Physical Chemistry',        icon: 'fa-fire',              description: 'Types: combination, decomposition, displacement (single/double), neutralisation, precipitation, combustion, redox. Observable changes. Writing equations for each type.', modes: ['reaction_engine','reaction_quiz'], keyConcepts: ['Reaction types','Precipitation','Combustion products'] },
  { code: 'energetics',           title: 'Chemical Energetics',                branch: 'Physical Chemistry',        icon: 'fa-temperature-high',  description: 'Exothermic and endothermic reactions. Enthalpy change ΔH. Bond energies. Energy profile diagrams. Activation energy Eₐ. Hess\'s Law. Calorimetry calculations.', modes: ['energy_profile','calorimetry_sim'], keyConcepts: ['ΔH negative=exothermic','Bond enthalpy','Hess\'s Law'] },
  { code: 'reaction-kinetics',    title: 'Reaction Kinetics',                  branch: 'Physical Chemistry',        icon: 'fa-chart-line',        description: 'Rate of reaction. Factors: temperature, concentration, surface area, catalyst, pressure. Collision theory. Rate equations. Arrhenius equation. Rate-concentration graphs.', modes: ['kinetics_sim','rate_graph'], keyConcepts: ['Collision theory','Activation energy','Rate = k[A]^m[B]^n'] },
  { code: 'equilibrium',          title: 'Chemical Equilibrium',               branch: 'Physical Chemistry',        icon: 'fa-arrows-left-right', description: 'Dynamic equilibrium. Equilibrium constant Kc and Kp. Le Chatelier\'s principle. Effect of temperature, pressure, concentration on equilibrium position.', modes: ['equilibrium_sim','lechatelier_quiz'], keyConcepts: ['Dynamic equilibrium','Kc expression','Le Chatelier'] },
  { code: 'electrochemistry',     title: 'Electrochemistry',                   branch: 'Physical Chemistry',        icon: 'fa-bolt',              description: 'Electrolysis: electrodes, electrolytes, ion migration, electrode reactions. Electrochemical cells: half-cells, EMF, standard electrode potentials. Applications.', modes: ['electrolysis_sim','cell_builder'], keyConcepts: ['Anode/cathode','Selective discharge','EMF = E⁺ - E⁻'] },
  { code: 'redox-chemistry',      title: 'Redox Chemistry',                    branch: 'Physical Chemistry',        icon: 'fa-exchange-alt',      description: 'Oxidation and reduction. Oxidation numbers. OIL RIG. Oxidising and reducing agents. Half-equations. Disproportionation. Redox titrations.', modes: ['redox_sim','oxidation_number_quiz'], keyConcepts: ['Oxidation numbers','Half-equations','OIL RIG'] },
  { code: 'organic-chemistry',    title: 'Organic Chemistry',                  branch: 'Organic Chemistry',         icon: 'fa-dna',               description: 'Homologous series: alkanes, alkenes, alkynes, alcohols, aldehydes, ketones, carboxylic acids, esters, amines. Functional groups, isomerism, IUPAC nomenclature, reactions.', modes: ['organic_builder','functional_group_quiz'], keyConcepts: ['Functional groups','Homologous series','Isomerism'] },
  { code: 'inorganic-chemistry',  title: 'Inorganic Chemistry',                branch: 'Inorganic Chemistry',       icon: 'fa-gem',               description: 'Metals, non-metals, metalloids. Metal oxides and reactions with acids. Reactivity series. Common inorganic reactions. Preparation of salts. Industrial inorganic processes.', modes: ['inorganic_overview','reactivity_quiz'], keyConcepts: ['Reactivity series','Metal oxides','Salt preparation'] },
  { code: 'analytical-chemistry', title: 'Analytical Chemistry & Qualitative Analysis', branch: 'Analytical Chemistry', icon: 'fa-magnifying-glass', description: 'Identification of cations (Na⁺, K⁺, Ca²⁺, Fe²⁺, Fe³⁺, Cu²⁺, NH₄⁺) and anions (Cl⁻, SO₄²⁻, CO₃²⁻, NO₃⁻). Flame tests. Precipitation tests. Gas tests.', modes: ['qualitative_analysis','identification_quiz'], keyConcepts: ['Flame test colours','Precipitation colours','Gas tests'] },
  { code: 'separation-techniques', title: 'Separation Techniques',             branch: 'Analytical Chemistry',      icon: 'fa-filter',            description: 'Filtration, evaporation, crystallisation, simple and fractional distillation, paper/thin-layer chromatography, decantation, centrifugation, separating funnel.', modes: ['separation_sim','technique_quiz'], keyConcepts: ['Filtration setup','Rf value','Fractional distillation'] },
  { code: 'gas-chemistry',        title: 'Gas Chemistry & Gas Laws',           branch: 'Physical Chemistry',        icon: 'fa-wind',              description: 'Ideal gas behaviour. Boyle\'s Law (PV=k), Charles\'s Law (V/T=k), Gay-Lussac\'s Law, Combined Gas Law, Ideal Gas Law PV=nRT. Gas diffusion. Graham\'s Law.', modes: ['gas_law_sim','gas_calc'], keyConcepts: ['PV=nRT','Boyle\'s Law','Graham\'s Law'] },
  { code: 'water-chemistry',      title: 'Water Chemistry',                    branch: 'Environmental Chemistry',   icon: 'fa-droplet',           description: 'Water properties, hardness (temporary/permanent), softening methods, water purification stages, water pollution, dissolved oxygen, chemical oxygen demand.', modes: ['water_purification','hardness_lab'], keyConcepts: ['Temporary/permanent hardness','Purification stages','Water treatment'] },
  { code: 'environmental-chemistry', title: 'Environmental Chemistry',         branch: 'Environmental Chemistry',   icon: 'fa-leaf',              description: 'Air pollution (SO₂, NOₓ, CO, particulates), acid rain chemistry, greenhouse gases (CO₂, CH₄, N₂O), ozone layer chemistry, water pollution, sustainable chemistry.', modes: ['env_impact_map','pollution_calc'], keyConcepts: ['Acid rain pH','Greenhouse effect','Ozone depletion'] },
  { code: 'industrial-chemistry', title: 'Industrial Chemistry',               branch: 'Applied Chemistry',         icon: 'fa-industry',          description: 'Haber process (ammonia), Contact process (sulfuric acid), Ostwald process (nitric acid), Solvay process (sodium carbonate), chlor-alkali process, petroleum refining.', modes: ['process_diagram','industrial_quiz'], keyConcepts: ['Haber process conditions','Contact process','Raw materials'] },
  { code: 'nuclear-chemistry',    title: 'Nuclear Chemistry',                  branch: 'Physical Chemistry',        icon: 'fa-radiation',         description: 'Radioactivity: alpha, beta, gamma decay. Half-life. Nuclear equations. Fission and fusion. Applications (nuclear power, medicine, dating). Radiation safety.', modes: ['nuclear_sim','half_life_calc'], keyConcepts: ['Half-life','Decay equations','Fission vs fusion'] },
  { code: 'biochemistry',         title: 'Biochemistry',                       branch: 'Biochemistry',              icon: 'fa-dna',               description: 'Carbohydrates (monosaccharides, polysaccharides), proteins (amino acids, peptide bonds), lipids (fatty acids, glycerol), enzymes, nucleic acids, metabolic pathways overview.', modes: ['biomolecule_3d','food_test_sim'], keyConcepts: ['Condensation/hydrolysis','Enzyme active site','ATP'] },
  { code: 'virtual-experiments',  title: 'Virtual Experiments Workbench',      branch: 'Laboratory Practicals',     icon: 'fa-microscope',        description: 'Build and run virtual chemistry experiments. Select apparatus, add substances, configure variables, observe modelled results, record data, generate graphs.', modes: ['experiment_builder'], keyConcepts: ['Experimental design','Variables','Data recording'] },
  { code: 'graphing-analysis',    title: 'Graphing & Data Analysis',           branch: 'Scientific Computing',      icon: 'fa-chart-line',        description: 'Titration curves, temperature-time graphs, reaction rate curves, concentration-time graphs, solubility curves, calibration curves, energy profiles. Integration with Graphing Lab.', modes: ['charts','graphing_lab_link'], keyConcepts: ['Titration curve','Rate graph','Energy profile'] },
  { code: 'practical-assessments', title: 'Practical Assessments & CBT',       branch: 'Assessment',                icon: 'fa-pen-to-square',     description: 'Chemistry CBT questions: equation balancing, stoichiometry, periodic table analysis, molecular identification, apparatus identification, titration calculations.', modes: ['cbt_mode'], keyConcepts: ['Exam technique','Significant figures','Unit analysis'] }
];

// ============================================================
// TOPIC CONTROLLER FUNCTIONS
// ============================================================
async function getCurriculumTopics(req, res) {
  try {
    res.json({ success: true, topics: CURRICULUM_TOPICS, count: CURRICULUM_TOPICS.length, total: CURRICULUM_TOPICS.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getTopicByCode(req, res) {
  const topic = CURRICULUM_TOPICS.find(t => t.code === req.params.code);
  if (!topic) return res.status(404).json({ error: 'Topic not found' });
  res.json({ success: true, topic });
}

// ============================================================
// SUBSTANCE CATALOG (verified curriculum data)
// ============================================================
const SUBSTANCE_CATALOG = [
  { id: 'h2o',    name: 'Water',                  formula: 'H₂O',    molarMass: 18.015,  state: 'liquid',  density: 1.00,   color: '#CCE5FF', safetyClass: 'safe',     description: 'Universal solvent. Polar covalent molecule. Bp 100°C at 1 atm.' },
  { id: 'hcl',    name: 'Hydrochloric Acid',       formula: 'HCl',    molarMass: 36.461,  state: 'liquid',  density: 1.18,   color: '#FFFDE7', safetyClass: 'corrosive', description: 'Strong monoprotic acid. Fully dissociates in water. pH < 1 at conc.' },
  { id: 'naoh',   name: 'Sodium Hydroxide',        formula: 'NaOH',   molarMass: 39.997,  state: 'solid',   density: 2.13,   color: '#FFFFFF', safetyClass: 'corrosive', description: 'Strong alkali. Highly exothermic dissolution. Absorbs CO₂ from air.' },
  { id: 'h2so4',  name: 'Sulfuric Acid',           formula: 'H₂SO₄',  molarMass: 98.079,  state: 'liquid',  density: 1.84,   color: '#FFF9C4', safetyClass: 'corrosive', description: 'Strong diprotic acid. Concentrated form is highly corrosive and dehydrating.' },
  { id: 'hno3',   name: 'Nitric Acid',             formula: 'HNO₃',   molarMass: 63.013,  state: 'liquid',  density: 1.51,   color: '#FFFDE7', safetyClass: 'oxidiser',  description: 'Strong acid and oxidising agent. Reacts with most metals except gold/platinum.' },
  { id: 'nacl',   name: 'Sodium Chloride',         formula: 'NaCl',   molarMass: 58.443,  state: 'solid',   density: 2.17,   color: '#FFFFFF', safetyClass: 'safe',     description: 'Common salt. Ionic compound. Soluble in water, gives neutral solution.' },
  { id: 'caco3',  name: 'Calcium Carbonate',       formula: 'CaCO₃',  molarMass: 100.087, state: 'solid',   density: 2.71,   color: '#FFFFFF', safetyClass: 'safe',     description: 'Main constituent of limestone, chalk, marble. Reacts with acids to give CO₂.' },
  { id: 'na2co3', name: 'Sodium Carbonate',        formula: 'Na₂CO₃', molarMass: 105.988, state: 'solid',   density: 2.54,   color: '#FFFFFF', safetyClass: 'irritant',  description: 'Washing soda. Alkaline in solution. Used as primary standard in titration.' },
  { id: 'h2o2',   name: 'Hydrogen Peroxide',       formula: 'H₂O₂',   molarMass: 34.015,  state: 'liquid',  density: 1.44,   color: '#E3F2FD', safetyClass: 'oxidiser',  description: 'Oxidising agent. Decomposes to H₂O + O₂ with catalyst (e.g. MnO₂).' },
  { id: 'cu',     name: 'Copper',                  formula: 'Cu',     molarMass: 63.546,  state: 'solid',   density: 8.96,   color: '#B87333', safetyClass: 'safe',     description: 'Reddish metal. Good conductor. Below hydrogen in reactivity series.' },
  { id: 'fe',     name: 'Iron',                    formula: 'Fe',     molarMass: 55.845,  state: 'solid',   density: 7.87,   color: '#9E9E9E', safetyClass: 'safe',     description: 'Magnetic metal. Rusts in presence of water and oxygen. In reactivity series above hydrogen.' },
  { id: 'zn',     name: 'Zinc',                    formula: 'Zn',     molarMass: 65.38,   state: 'solid',   density: 7.13,   color: '#BDBDBD', safetyClass: 'safe',     description: 'Amphoteric metal. Reacts with both acids and alkalis. Above hydrogen in reactivity series.' },
  { id: 'mg',     name: 'Magnesium',               formula: 'Mg',     molarMass: 24.305,  state: 'solid',   density: 1.74,   color: '#ECEFF1', safetyClass: 'flammable', description: 'Burns with brilliant white flame. Reacts vigorously with dilute acids.' },
  { id: 'ethanol',name: 'Ethanol',                 formula: 'C₂H₅OH', molarMass: 46.068,  state: 'liquid',  density: 0.789,  color: '#E8F5E9', safetyClass: 'flammable', description: 'Simple alcohol. Fuel, solvent, antiseptic. Miscible with water.' },
  { id: 'ch4',    name: 'Methane',                 formula: 'CH₄',    molarMass: 16.043,  state: 'gas',     density: 0.00072,color: '#E3F2FD', safetyClass: 'flammable', description: 'Simplest alkane. Natural gas. Burns cleanly: CH₄ + 2O₂ → CO₂ + 2H₂O.' },
  { id: 'co2',    name: 'Carbon Dioxide',          formula: 'CO₂',    molarMass: 44.010,  state: 'gas',     density: 0.00198,color: '#F5F5F5', safetyClass: 'safe',     description: 'Product of combustion and respiration. Greenhouse gas. Turns limewater milky.' },
  { id: 'o2',     name: 'Oxygen',                  formula: 'O₂',     molarMass: 31.998,  state: 'gas',     density: 0.00143,color: '#E1F5FE', safetyClass: 'oxidiser',  description: 'Supports combustion. Relights a glowing splint. ~21% of atmosphere.' },
  { id: 'h2',     name: 'Hydrogen',                formula: 'H₂',     molarMass: 2.016,   state: 'gas',     density: 0.0000899,color:'#F3E5F5',safetyClass: 'flammable', description: 'Lightest element. Burns with squeaky pop. Produced by metals + dilute acid.' },
  { id: 'nh3',    name: 'Ammonia',                 formula: 'NH₃',    molarMass: 17.031,  state: 'gas',     density: 0.000771,color:'#FFF9C4',safetyClass: 'toxic',     description: 'Pungent gas. Turns damp red litmus blue. Manufactured by Haber process.' },
  { id: 'cl2',    name: 'Chlorine',                formula: 'Cl₂',    molarMass: 70.906,  state: 'gas',     density: 0.00319,color: '#E8F5E9', safetyClass: 'toxic',     description: 'Yellow-green toxic gas. Strong oxidising agent. Used in water purification.' },
  { id: 'cucl2',  name: 'Copper(II) Chloride',     formula: 'CuCl₂',  molarMass: 134.452, state: 'solid',   density: 3.39,   color: '#B2EBF2', safetyClass: 'irritant',  description: 'Blue-green solid. Cu²⁺ gives blue/green flame colour. Electrolyte.' },
  { id: 'feso4',  name: 'Iron(II) Sulfate',        formula: 'FeSO₄',  molarMass: 151.908, state: 'solid',   density: 3.65,   color: '#E8F5E9', safetyClass: 'irritant',  description: 'Green crystalline solid. Fe²⁺ ions give pale green solution. Reducing agent.' },
  { id: 'fe2o3',  name: 'Iron(III) Oxide',         formula: 'Fe₂O₃',  molarMass: 159.688, state: 'solid',   density: 5.24,   color: '#FF8A65', safetyClass: 'safe',     description: 'Rust. Red-brown powder. Basic oxide. Reacts with acids to form iron(III) salts.' },
  { id: 'caso4',  name: 'Calcium Sulfate',         formula: 'CaSO₄',  molarMass: 136.141, state: 'solid',   density: 2.96,   color: '#FFFFFF', safetyClass: 'safe',     description: 'Plaster of Paris (hemihydrate). Sparingly soluble — SO₄²⁻ precipitate with Ba²⁺.' },
  { id: 'barium', name: 'Barium Chloride',         formula: 'BaCl₂',  molarMass: 208.233, state: 'solid',   density: 3.86,   color: '#FFFFFF', safetyClass: 'toxic',     description: 'Used to test for sulfate ions — BaSO₄ white precipitate insoluble in HCl.' },
  { id: 'agno3',  name: 'Silver Nitrate',          formula: 'AgNO₃',  molarMass: 169.873, state: 'solid',   density: 4.35,   color: '#F5F5F5', safetyClass: 'oxidiser',  description: 'Used to test for halide ions. AgCl white, AgBr cream, AgI yellow precipitates.' },
  { id: 'naoh_aq',name: 'Sodium Hydroxide (aq)',   formula: 'NaOH(aq)',molarMass: 39.997,  state: 'liquid',  density: 1.22,   color: '#F3E5F5', safetyClass: 'corrosive', description: 'Used to test for cations. Cu²⁺ gives blue ppt, Fe²⁺ green, Fe³⁺ rust-brown, NH₄⁺ gives NH₃.' },
  { id: 'c6h12o6',name: 'Glucose',                 formula: 'C₆H₁₂O₆',molarMass: 180.156, state: 'solid',  density: 1.54,   color: '#FFF9C4', safetyClass: 'safe',     description: 'Monosaccharide. Reducing sugar — positive Benedicts test (orange/red brick).' },
  { id: 'starch', name: 'Starch',                  formula: '(C₆H₁₀O₅)n',molarMass: 162.14, state: 'solid', density: 1.50,   color: '#FFFFFF', safetyClass: 'safe',     description: 'Polysaccharide. Turns blue-black with iodine solution. Non-reducing sugar.' },
  { id: 'casein', name: 'Casein (Protein)',         formula: 'Protein',molarMass: 20000,   state: 'solid',   density: 1.30,   color: '#FFFDE7', safetyClass: 'safe',     description: 'Milk protein. Positive Biuret test (purple/violet) indicating peptide bonds.' }
];

async function getSubstanceCatalog(req, res) {
  const q = (req.query.q || '').toLowerCase();
  const filtered = q
    ? SUBSTANCE_CATALOG.filter(s => s.name.toLowerCase().includes(q) || s.formula.toLowerCase().includes(q))
    : SUBSTANCE_CATALOG;
  res.json({ success: true, substances: filtered, count: filtered.length, total: filtered.length });
}

// ============================================================
// ELEMENTS (Curriculum elements served from server)
// ============================================================
const ELEMENTS = [
  { Z:1,  sym:'H',  name:'Hydrogen',    mass:1.008,   group:1,  period:1, class:'nonmetal',   config:'1s¹',           en:2.20, ox:[1,-1] },
  { Z:2,  sym:'He', name:'Helium',      mass:4.003,   group:18, period:1, class:'noble_gas',  config:'1s²',           en:null, ox:[0]   },
  { Z:3,  sym:'Li', name:'Lithium',     mass:6.941,   group:1,  period:2, class:'alkali_metal',config:'[He]2s¹',      en:0.98, ox:[1]   },
  { Z:4,  sym:'Be', name:'Beryllium',   mass:9.012,   group:2,  period:2, class:'alkaline_earth',config:'[He]2s²',    en:1.57, ox:[2]   },
  { Z:5,  sym:'B',  name:'Boron',       mass:10.811,  group:13, period:2, class:'metalloid',  config:'[He]2s²2p¹',    en:2.04, ox:[3]   },
  { Z:6,  sym:'C',  name:'Carbon',      mass:12.011,  group:14, period:2, class:'nonmetal',   config:'[He]2s²2p²',    en:2.55, ox:[4,2,-4] },
  { Z:7,  sym:'N',  name:'Nitrogen',    mass:14.007,  group:15, period:2, class:'nonmetal',   config:'[He]2s²2p³',    en:3.04, ox:[-3,3,5] },
  { Z:8,  sym:'O',  name:'Oxygen',      mass:15.999,  group:16, period:2, class:'nonmetal',   config:'[He]2s²2p⁴',    en:3.44, ox:[-2]  },
  { Z:9,  sym:'F',  name:'Fluorine',    mass:18.998,  group:17, period:2, class:'halogen',    config:'[He]2s²2p⁵',    en:3.98, ox:[-1]  },
  { Z:10, sym:'Ne', name:'Neon',        mass:20.180,  group:18, period:2, class:'noble_gas',  config:'[He]2s²2p⁶',    en:null, ox:[0]   },
  { Z:11, sym:'Na', name:'Sodium',      mass:22.990,  group:1,  period:3, class:'alkali_metal',config:'[Ne]3s¹',      en:0.93, ox:[1]   },
  { Z:12, sym:'Mg', name:'Magnesium',   mass:24.305,  group:2,  period:3, class:'alkaline_earth',config:'[Ne]3s²',   en:1.31, ox:[2]   },
  { Z:13, sym:'Al', name:'Aluminium',   mass:26.982,  group:13, period:3, class:'post_transition',config:'[Ne]3s²3p¹',en:1.61,ox:[3]   },
  { Z:14, sym:'Si', name:'Silicon',     mass:28.086,  group:14, period:3, class:'metalloid',  config:'[Ne]3s²3p²',    en:1.90, ox:[4,-4] },
  { Z:15, sym:'P',  name:'Phosphorus',  mass:30.974,  group:15, period:3, class:'nonmetal',   config:'[Ne]3s²3p³',    en:2.19, ox:[-3,3,5] },
  { Z:16, sym:'S',  name:'Sulfur',      mass:32.065,  group:16, period:3, class:'nonmetal',   config:'[Ne]3s²3p⁴',    en:2.58, ox:[-2,4,6] },
  { Z:17, sym:'Cl', name:'Chlorine',    mass:35.453,  group:17, period:3, class:'halogen',    config:'[Ne]3s²3p⁵',    en:3.16, ox:[-1,1,5,7] },
  { Z:18, sym:'Ar', name:'Argon',       mass:39.948,  group:18, period:3, class:'noble_gas',  config:'[Ne]3s²3p⁶',    en:null, ox:[0]   },
  { Z:19, sym:'K',  name:'Potassium',   mass:39.098,  group:1,  period:4, class:'alkali_metal',config:'[Ar]4s¹',      en:0.82, ox:[1]   },
  { Z:20, sym:'Ca', name:'Calcium',     mass:40.078,  group:2,  period:4, class:'alkaline_earth',config:'[Ar]4s²',   en:1.00, ox:[2]   },
  { Z:26, sym:'Fe', name:'Iron',        mass:55.845,  group:8,  period:4, class:'transition', config:'[Ar]3d⁶4s²',    en:1.83, ox:[2,3] },
  { Z:29, sym:'Cu', name:'Copper',      mass:63.546,  group:11, period:4, class:'transition', config:'[Ar]3d¹⁰4s¹',   en:1.90, ox:[1,2] },
  { Z:30, sym:'Zn', name:'Zinc',        mass:65.38,   group:12, period:4, class:'transition', config:'[Ar]3d¹⁰4s²',   en:1.65, ox:[2]   },
  { Z:35, sym:'Br', name:'Bromine',     mass:79.904,  group:17, period:4, class:'halogen',    config:'[Ar]3d¹⁰4s²4p⁵',en:2.96,ox:[-1,1,5] },
  { Z:47, sym:'Ag', name:'Silver',      mass:107.868, group:11, period:5, class:'transition', config:'[Kr]4d¹⁰5s¹',   en:1.93, ox:[1]   },
  { Z:53, sym:'I',  name:'Iodine',      mass:126.904, group:17, period:5, class:'halogen',    config:'[Kr]4d¹⁰5s²5p⁵',en:2.66,ox:[-1,1,5,7] },
  { Z:56, sym:'Ba', name:'Barium',      mass:137.327, group:2,  period:6, class:'alkaline_earth',config:'[Xe]6s²',   en:0.89, ox:[2]   },
  { Z:74, sym:'W',  name:'Tungsten',    mass:183.840, group:6,  period:6, class:'transition', config:'[Xe]4f¹⁴5d⁴6s²',en:2.36,ox:[6]   },
  { Z:79, sym:'Au', name:'Gold',        mass:196.967, group:11, period:6, class:'transition', config:'[Xe]4f¹⁴5d¹⁰6s¹',en:2.54,ox:[1,3] },
  { Z:80, sym:'Hg', name:'Mercury',     mass:200.592, group:12, period:6, class:'transition', config:'[Xe]4f¹⁴5d¹⁰6s²',en:2.00,ox:[1,2] },
  { Z:82, sym:'Pb', name:'Lead',        mass:207.200, group:14, period:6, class:'post_transition',config:'[Xe]4f¹⁴5d¹⁰6s²6p²',en:2.33,ox:[2,4] },
  { Z:92, sym:'U',  name:'Uranium',     mass:238.029, group:3,  period:7, class:'actinide',   config:'[Rn]5f³6d¹7s²', en:1.38, ox:[3,4,5,6] }
];

async function getElements(req, res) {
  res.json({ success: true, elements: ELEMENTS, count: ELEMENTS.length, total: ELEMENTS.length });
}

// ============================================================
// CHEMICAL EQUATION BALANCER
// ============================================================
function parseFormula(formula) {
  const counts = {};
  // Handles parenthesized groups like Ca(OH)2 or Fe2(SO4)3
  function parseSegment(seg, multiplier) {
    const r = /([A-Z][a-z]?)(\d*)/g;
    let m;
    while ((m = r.exec(seg)) !== null) {
      if (!m[1]) continue;
      const elem = m[1];
      const count = (parseInt(m[2], 10) || 1) * multiplier;
      counts[elem] = (counts[elem] || 0) + count;
    }
  }

  // Check for parentheses
  const parenRegex = /\(([^)]+)\)(\d*)/g;
  let remaining = formula;
  let match;
  while ((match = parenRegex.exec(formula)) !== null) {
    const inner = match[1];
    const mult = parseInt(match[2], 10) || 1;
    parseSegment(inner, mult);
    remaining = remaining.replace(match[0], '');
  }
  parseSegment(remaining, 1);
  return counts;
}

function balanceEquationLogic(reactants, products) {
  // Direct known lookup for common high school equations
  const canonKey = reactants.join('+') + '->' + products.join('+');
  const KNOWN_BALANCED = {
    'H2+O2->H2O': { r: [2, 1], p: [2] },
    'Fe+O2->Fe2O3': { r: [4, 3], p: [2] },
    'N2+H2->NH3': { r: [1, 3], p: [2] },
    'CH4+O2->CO2+H2O': { r: [1, 2], p: [1, 2] },
    'Mg+O2->MgO': { r: [2, 1], p: [2] },
    'HCl+NaOH->NaCl+H2O': { r: [1, 1], p: [1, 1] },
    'CaCO3+HCl->CaCl2+H2O+CO2': { r: [1, 2], p: [1, 1, 1] },
    'H2O2->H2O+O2': { r: [2], p: [2, 1] },
    'Na+Cl2->NaCl': { r: [2, 1], p: [2] },
    'Al+O2->Al2O3': { r: [4, 3], p: [2] },
    'Zn+HCl->ZnCl2+H2': { r: [1, 2], p: [1, 1] },
    'Fe+CuSO4->FeSO4+Cu': { r: [1, 1], p: [1, 1] },
    'C2H6+O2->CO2+H2O': { r: [2, 7], p: [4, 6] },
    'C2H4+O2->CO2+H2O': { r: [1, 3], p: [2, 2] },
    'C2H5OH+O2->CO2+H2O': { r: [1, 3], p: [2, 3] },
    'KClO3->KCl+O2': { r: [2], p: [2, 3] },
    'AgNO3+NaCl->AgCl+NaNO3': { r: [1, 1], p: [1, 1] }
  };

  if (KNOWN_BALANCED[canonKey]) {
    return {
      reactantCoeffs: KNOWN_BALANCED[canonKey].r,
      productCoeffs: KNOWN_BALANCED[canonKey].p,
      balanced: true
    };
  }

  // Brute force integer coefficients from 1 to 12
  const nR = reactants.length;
  const nP = products.length;
  const rPars = reactants.map(parseFormula);
  const pPars = products.map(parseFormula);

  const allElements = new Set();
  rPars.forEach(p => Object.keys(p).forEach(e => allElements.add(e)));
  pPars.forEach(p => Object.keys(p).forEach(e => allElements.add(e)));
  const elements = Array.from(allElements);

  function check(rCoeffs, pCoeffs) {
    for (const elem of elements) {
      let left = 0, right = 0;
      for (let i = 0; i < nR; i++) left += (rPars[i][elem] || 0) * rCoeffs[i];
      for (let j = 0; j < nP; j++) right += (pPars[j][elem] || 0) * pCoeffs[j];
      if (left !== right) return false;
    }
    return true;
  }

  // Search simple combinations
  if (nR === 2 && nP === 1) {
    for (let r1 = 1; r1 <= 6; r1++) {
      for (let r2 = 1; r2 <= 6; r2++) {
        for (let p1 = 1; p1 <= 6; p1++) {
          if (check([r1, r2], [p1])) return { reactantCoeffs: [r1, r2], productCoeffs: [p1], balanced: true };
        }
      }
    }
  } else if (nR === 1 && nP === 2) {
    for (let r1 = 1; r1 <= 6; r1++) {
      for (let p1 = 1; p1 <= 6; p1++) {
        for (let p2 = 1; p2 <= 6; p2++) {
          if (check([r1], [p1, p2])) return { reactantCoeffs: [r1], productCoeffs: [p1, p2], balanced: true };
        }
      }
    }
  } else if (nR === 2 && nP === 2) {
    for (let r1 = 1; r1 <= 6; r1++) {
      for (let r2 = 1; r2 <= 7; r2++) {
        for (let p1 = 1; p1 <= 6; p1++) {
          for (let p2 = 1; p2 <= 6; p2++) {
            if (check([r1, r2], [p1, p2])) return { reactantCoeffs: [r1, r2], productCoeffs: [p1, p2], balanced: true };
          }
        }
      }
    }
  } else if (nR === 2 && nP === 3) {
    for (let r1 = 1; r1 <= 4; r1++) {
      for (let r2 = 1; r2 <= 4; r2++) {
        for (let p1 = 1; p1 <= 4; p1++) {
          for (let p2 = 1; p2 <= 4; p2++) {
            for (let p3 = 1; p3 <= 4; p3++) {
              if (check([r1, r2], [p1, p2, p3])) return { reactantCoeffs: [r1, r2], productCoeffs: [p1, p2, p3], balanced: true };
            }
          }
        }
      }
    }
  }

  // Fallback defaults if complex
  return {
    reactantCoeffs: new Array(nR).fill(1),
    productCoeffs: new Array(nP).fill(1),
    balanced: false
  };
}

async function balanceEquation(req, res) {
  try {
    const { reactants, products } = req.body;
    if (!Array.isArray(reactants) || !Array.isArray(products)) {
      return res.status(400).json({ error: 'reactants and products must be arrays of formula strings' });
    }
    const result = balanceEquationLogic(reactants, products);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// STOICHIOMETRY CALCULATOR
// ============================================================
const AVOGADRO = 6.02214076e23;
const MOLAR_VOLUME_STP = 22.414; // L/mol at STP

async function stoichiometryCalc(req, res) {
  try {
    const { molarMassGiven, molarMassWanted, coeffGiven, coeffWanted, givenAmount, givenUnit } = req.body;
    if ([molarMassGiven, molarMassWanted, coeffGiven, coeffWanted, givenAmount].some(v => v === undefined)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    const mG = parseFloat(molarMassGiven);
    const mW = parseFloat(molarMassWanted);
    const cG = parseFloat(coeffGiven);
    const cW = parseFloat(coeffWanted);
    const gA = parseFloat(givenAmount);
    const unit = givenUnit || 'g';

    let molesGiven;
    if (unit === 'g') molesGiven = gA / mG;
    else if (unit === 'mol') molesGiven = gA;
    else if (unit === 'L') molesGiven = gA / MOLAR_VOLUME_STP;
    else return res.status(400).json({ error: 'givenUnit must be g, mol, or L' });

    const molesWanted = molesGiven * (cW / cG);
    const massWanted  = molesWanted * mW;
    const volumeWanted = molesWanted * MOLAR_VOLUME_STP;
    const particles   = molesWanted * AVOGADRO;

    res.json({
      success: true,
      molesGiven:   +molesGiven.toFixed(6),
      molesWanted:  +molesWanted.toFixed(6),
      massWanted_g: +massWanted.toFixed(4),
      volumeWanted_L: +volumeWanted.toFixed(4),
      particles:    particles.toExponential(4),
      steps: [
        `Moles of given = ${gA} ${unit} / ${mG} g mol⁻¹ = ${molesGiven.toFixed(4)} mol`,
        `Mole ratio: ${cG} mol given : ${cW} mol wanted`,
        `Moles of wanted = ${molesGiven.toFixed(4)} × (${cW}/${cG}) = ${molesWanted.toFixed(4)} mol`,
        `Mass of wanted = ${molesWanted.toFixed(4)} mol × ${mW} g mol⁻¹ = ${massWanted.toFixed(4)} g`
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// TITRATION CALCULATOR
// ============================================================
async function titrationCalc(req, res) {
  try {
    const {
      initialBurette, finalBurette, volumePipette, concentrationKnown, moleRatio,
      acidConcentration, baseConcentration, baseVolume_mL, moleRatioAcidBase = 1.0
    } = req.body;

    // Simulation / Equivalence curve mode
    if (acidConcentration !== undefined && baseConcentration !== undefined) {
      const cA = parseFloat(acidConcentration);
      const cB = parseFloat(baseConcentration);
      const vB = parseFloat(baseVolume_mL || volumePipette || 25.0);
      const ratio = parseFloat(moleRatioAcidBase || moleRatio || 1.0);
      const eqVol = +((cB * vB) / (cA * ratio)).toFixed(2);

      // Generate sigmoidal titration curve points
      const curvePoints = [];
      const maxVol = Math.max(50, eqVol * 1.8);
      for (let v = 0; v <= maxVol; v += 1.0) {
        const vAdded = v;
        const molesB = (cB * vB) / 1000;
        const molesA = (cA * vAdded) / 1000;
        const diff = molesB - molesA * ratio;
        let pH = 7.0;
        const totalV = (vB + vAdded) / 1000;
        if (Math.abs(diff) < 1e-6) {
          pH = 7.0;
        } else if (diff > 0) {
          const pOH = -Math.log10(diff / totalV);
          pH = +(14 - pOH).toFixed(2);
        } else {
          pH = +(-Math.log10(-diff / totalV)).toFixed(2);
        }
        curvePoints.push({ volume: vAdded, pH: Math.max(0, Math.min(14, pH)) });
      }

      return res.json({
        success: true,
        equivalenceVolume_mL: eqVol,
        acidConcentration: cA,
        baseConcentration: cB,
        baseVolume_mL: vB,
        curvePoints
      });
    }

    // Direct burette reading mode
    const init = parseFloat(initialBurette);
    const fin  = parseFloat(finalBurette);
    const vPip = parseFloat(volumePipette || 25.0);
    const cK   = parseFloat(concentrationKnown);
    const ratio = parseFloat(moleRatio || 1.0);

    if (fin <= init) return res.status(400).json({ error: 'Final burette reading must be greater than initial' });

    const titre      = +(fin - init).toFixed(2);
    const molesKnown = +(cK * titre / 1000).toFixed(6);
    const molesUnknown = +(molesKnown * ratio).toFixed(6);
    const concUnknown  = +(molesUnknown / (vPip / 1000)).toFixed(4);

    res.json({
      success: true,
      titre_cm3: titre,
      molesKnown,
      molesUnknown,
      concentrationUnknown_mol_per_L: concUnknown,
      steps: [
        `Titre = ${fin} - ${init} = ${titre} cm³`,
        `Moles of known = ${cK} mol/L × ${titre}/1000 L = ${molesKnown} mol`,
        `Moles of unknown = ${molesKnown} × ${ratio} = ${molesUnknown} mol`,
        `Concentration = ${molesUnknown} / (${vPip}/1000 L) = ${concUnknown} mol/L`
      ]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// pH CALCULATOR
// ============================================================
async function phCalculate(req, res) {
  try {
    const { type, concentration, ka, kb } = req.body;
    const c = parseFloat(concentration);
    if (c <= 0) return res.status(400).json({ error: 'Concentration must be positive' });

    let pH, pOH, notes;

    if (type === 'strong_acid') {
      const H = c;
      pH = -Math.log10(H);
      pOH = 14 - pH;
      notes = `Strong acid fully dissociates: [H⁺] = ${c} mol/L`;
    } else if (type === 'strong_base') {
      pOH = -Math.log10(c);
      pH = 14 - pOH;
      notes = `Strong base fully dissociates: [OH⁻] = ${c} mol/L`;
    } else if (type === 'weak_acid') {
      const Ka = parseFloat(ka);
      if (!Ka || Ka <= 0) return res.status(400).json({ error: 'Ka required for weak acid' });
      const x = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
      pH = -Math.log10(x);
      pOH = 14 - pH;
      notes = `Weak acid: Ka = ${Ka}. [H⁺] ≈ ${x.toExponential(3)} mol/L`;
    } else if (type === 'weak_base') {
      const Kb = parseFloat(kb);
      if (!Kb || Kb <= 0) return res.status(400).json({ error: 'Kb required for weak base' });
      const x = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * c)) / 2;
      pOH = -Math.log10(x);
      pH = 14 - pOH;
      notes = `Weak base: Kb = ${Kb}. [OH⁻] ≈ ${x.toExponential(3)} mol/L`;
    } else {
      return res.status(400).json({ error: 'type must be strong_acid, strong_base, weak_acid, or weak_base' });
    }

    res.json({
      success: true,
      pH: +pH.toFixed(2),
      pOH: +pOH.toFixed(2),
      H_concentration: +(Math.pow(10, -pH)).toExponential(3),
      OH_concentration: +(Math.pow(10, -pOH)).toExponential(3),
      notes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// MOLE CONCEPT CALCULATOR
// ============================================================
async function moleCalc(req, res) {
  try {
    const { calcType, value, molarMass, concentration, volume_L } = req.body;
    const val = parseFloat(value);
    const M   = parseFloat(molarMass);

    let result = {};
    if (calcType === 'mass_to_moles') {
      const moles = val / M;
      result = { moles: +moles.toFixed(6), particles: (moles * AVOGADRO).toExponential(4), formula: 'n = m / M', steps: [`n = ${val} g / ${M} g mol⁻¹ = ${moles.toFixed(4)} mol`] };
    } else if (calcType === 'moles_to_mass') {
      const mass = val * M;
      result = { mass_g: +mass.toFixed(4), formula: 'm = n × M', steps: [`m = ${val} mol × ${M} g mol⁻¹ = ${mass.toFixed(4)} g`] };
    } else if (calcType === 'moles_to_particles') {
      const N = val * AVOGADRO;
      result = { particles: N.toExponential(4), formula: 'N = n × Nₐ', steps: [`N = ${val} mol × 6.022×10²³ = ${N.toExponential(4)}`] };
    } else if (calcType === 'conc_vol_to_moles') {
      const c = parseFloat(concentration);
      const v = parseFloat(volume_L);
      const moles = c * v;
      result = { moles: +moles.toFixed(6), formula: 'n = c × V', steps: [`n = ${c} mol/L × ${v} L = ${moles.toFixed(4)} mol`] };
    } else {
      return res.status(400).json({ error: 'calcType must be mass_to_moles, moles_to_mass, moles_to_particles, or conc_vol_to_moles' });
    }
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// GAS LAW CALCULATOR
// ============================================================
async function gasLawCalc(req, res) {
  try {
    const { law = 'ideal', target, solve: reqSolve, ...params } = req.body;
    const solve = reqSolve || target || 'V';
    const R = 8.314462; // J mol⁻¹ K⁻¹ or kPa dm³ mol⁻¹ K⁻¹

    if (law === 'ideal') {
      const P = parseFloat(params.P);
      const V = parseFloat(params.V);
      const n = parseFloat(params.n);
      const T = parseFloat(params.T);
      const vals = { P, V, n, T };
      const steps = [];

      if (solve === 'P') {
        vals.P = (vals.n * R * vals.T) / vals.V;
        steps.push(`P = (n × R × T) / V`);
        steps.push(`P = (${vals.n} × ${R.toFixed(3)} × ${vals.T}) / ${vals.V} = ${vals.P.toFixed(3)} kPa`);
      } else if (solve === 'V') {
        vals.V = (vals.n * R * vals.T) / vals.P;
        steps.push(`V = (n × R × T) / P`);
        steps.push(`V = (${vals.n} × ${R.toFixed(3)} × ${vals.T}) / ${vals.P} = ${vals.V.toFixed(3)} dm³`);
      } else if (solve === 'n') {
        vals.n = (vals.P * vals.V) / (R * vals.T);
        steps.push(`n = (P × V) / (R × T)`);
        steps.push(`n = (${vals.P} × ${vals.V}) / (${R.toFixed(3)} × ${vals.T}) = ${vals.n.toFixed(4)} mol`);
      } else if (solve === 'T') {
        vals.T = (vals.P * vals.V) / (vals.n * R);
        steps.push(`T = (P × V) / (n × R)`);
        steps.push(`T = (${vals.P} × ${vals.V}) / (${vals.n} × ${R.toFixed(3)}) = ${vals.T.toFixed(2)} K`);
      }
      const unitMap = { P: 'kPa', V: 'dm³', n: 'mol', T: 'K' };
      res.json({
        success: true,
        law: 'PV = nRT (Ideal Gas Law)',
        result: +vals[solve].toFixed(3),
        unit: unitMap[solve] || '',
        steps,
        solved: solve
      });
    } else if (law === 'boyles') {
      const { P1, V1, P2, V2 } = params;
      const vals = { P1: parseFloat(P1), V1: parseFloat(V1), P2: parseFloat(P2), V2: parseFloat(V2) };
      if (solve === 'P2') vals.P2 = (vals.P1 * vals.V1) / vals.V2;
      else if (solve === 'V2') vals.V2 = (vals.P1 * vals.V1) / vals.P2;
      else if (solve === 'P1') vals.P1 = (vals.P2 * vals.V2) / vals.V1;
      else if (solve === 'V1') vals.V1 = (vals.P2 * vals.V2) / vals.V1;
      res.json({ success: true, law: "P₁V₁ = P₂V₂ (Boyle's Law, constant T)", result: +vals[solve].toFixed(4), solved: solve });
    } else {
      res.status(400).json({ error: 'law must be ideal or boyles' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// EXPERIMENT CRUD
// ============================================================
function getUserId(req) {
  return req.session.adminId || 0;
}
function getUserIdentifier(req) {
  return req.session.registrationNumber || req.session.adminUsername || 'anonymous';
}
function getUserRole(req) {
  return req.session.adminId ? (req.session.isTutor ? 'tutor' : 'admin') : 'student';
}

async function listExperiments(req, res) {
  try {
    const uid = getUserIdentifier(req);
    const [rows] = await pool.query(
      'SELECT id, title, topic_code, template_id, created_at, updated_at FROM chemistry_experiments WHERE user_identifier = ? ORDER BY updated_at DESC',
      [uid]
    );
    res.json({ success: true, experiments: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function saveExperiment(req, res) {
  try {
    const uid  = getUserIdentifier(req);
    const role = getUserRole(req);
    const { title, topic_code, template_id, apparatus_json, substances_json, reactions_json, measurements_json, variables_json, observations, classroom_id } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const [result] = await pool.query(
      'INSERT INTO chemistry_experiments (user_id, user_role, user_identifier, classroom_id, title, topic_code, template_id, apparatus_json, substances_json, reactions_json, measurements_json, variables_json, observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [getUserId(req), role, uid, classroom_id || null, title, topic_code || 'virtual-experiments', template_id || null,
       JSON.stringify(apparatus_json || []), JSON.stringify(substances_json || []),
       JSON.stringify(reactions_json || []), JSON.stringify(measurements_json || []),
       JSON.stringify(variables_json || {}), observations || '']
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getExperimentById(req, res) {
  try {
    const uid = getUserIdentifier(req);
    const [rows] = await pool.query('SELECT * FROM chemistry_experiments WHERE id = ? AND user_identifier = ?', [req.params.id, uid]);
    if (!rows.length) return res.status(404).json({ error: 'Experiment not found' });
    res.json({ success: true, experiment: rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteExperiment(req, res) {
  try {
    const uid = getUserIdentifier(req);
    await pool.query('DELETE FROM chemistry_experiments WHERE id = ? AND user_identifier = ?', [req.params.id, uid]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// ============================================================
// GRADING ENGINES
// ============================================================
async function gradeEquation(req, res) {
  try {
    const {
      studentReactantCoeffs, studentProductCoeffs,
      correctReactants, correctProducts,
      expectedReactantCoeffs, expectedProductCoeffs
    } = req.body;

    let expR = expectedReactantCoeffs;
    let expP = expectedProductCoeffs;

    if (!expR || !expP) {
      const correct = balanceEquationLogic(correctReactants || [], correctProducts || []);
      expR = correct.reactantCoeffs;
      expP = correct.productCoeffs;
    }

    const rMatch = JSON.stringify(studentReactantCoeffs) === JSON.stringify(expR);
    const pMatch = JSON.stringify(studentProductCoeffs) === JSON.stringify(expP);
    const score = (rMatch && pMatch) ? 1.0 : 0.0;
    const isCorrect = score === 1.0;

    res.json({
      success: true,
      score,
      maxScore: 1.0,
      isCorrect,
      feedback: isCorrect ? 'Equation correctly balanced.' : `Expected coefficients: ${expR ? expR.join(',') : ''} → ${expP ? expP.join(',') : ''}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function gradeStoichiometry(req, res) {
  try {
    const { studentAnswer, studentValue, correctAnswer, expectedValue, tolerancePercent } = req.body;
    const sa = parseFloat(studentAnswer !== undefined ? studentAnswer : studentValue);
    const ca = parseFloat(correctAnswer !== undefined ? correctAnswer : expectedValue);
    const tol = parseFloat(tolerancePercent || 2);
    const diff = Math.abs(sa - ca) / ca * 100;
    const isCorrect = diff <= tol;
    const score = isCorrect ? 1.0 : 0.0;

    res.json({
      success: true,
      score,
      maxScore: 1.0,
      isCorrect,
      pass: isCorrect,
      percentError: +diff.toFixed(2),
      studentAnswer: sa,
      correctAnswer: ca,
      tolerance: tol
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function gradeIdentification(req, res) {
  try {
    const { studentAnswer, correctAnswer, expectedIdentity } = req.body;
    const correct = correctAnswer || expectedIdentity || '';
    const match = (studentAnswer || '').trim().toLowerCase() === correct.trim().toLowerCase();
    const score = match ? 1.0 : 0.0;

    res.json({
      success: true,
      score,
      maxScore: 1.0,
      isCorrect: match,
      feedback: match ? 'Correct identification.' : `Correct answer: ${correct}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getCurriculumTopics,
  getTopicByCode,
  getSubstanceCatalog,
  getElements,
  balanceEquation,
  stoichiometryCalc,
  titrationCalc,
  phCalculate,
  moleCalc,
  gasLawCalc,
  listExperiments,
  saveExperiment,
  getExperimentById,
  deleteExperiment,
  gradeEquation,
  gradeStoichiometry,
  gradeIdentification
};
