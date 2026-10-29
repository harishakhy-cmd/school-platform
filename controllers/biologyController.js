'use strict';

const pool = require('../config/database');

// Comprehensive 28-Module Biology & Life Sciences Curriculum Registry
const CURRICULUM_TOPICS = [
  {
    code: 'intro-biology',
    title: 'Introduction to Biology & Life Characteristics',
    branch: 'Foundations of Biology',
    category: 'Biological Principles',
    icon: 'fa-seedling',
    description: 'Characteristics of living organisms (MRS GREN: Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition), scientific method, laboratory safety, and SI biological units.',
    modes: ['interactive_overview', 'mrs_gren_explorer', 'safety_guide'],
    keyConcepts: ['MRS GREN criteria', 'Controlled variables', 'Hypothesis formulation'],
    apparatus: ['hand_lens', 'measuring_cylinder', 'petri_dish']
  },
  {
    code: 'laboratory-apparatus',
    title: 'Laboratory Apparatus & Tooling',
    branch: 'Foundations of Biology',
    category: 'Equipment & Techniques',
    icon: 'fa-flask-vial',
    description: 'Handling and care of optical microscopes, glass microscope slides, cover slips, dissecting kits (scalpel, forceps, seeker, scissors), Petri dishes, boiling tubes, and staining reagents.',
    modes: ['apparatus_browser', 'slide_preparation_sim', 'dissection_kit'],
    keyConcepts: ['Wet mount preparation', 'Bubble-free cover slip placement', 'Iodine & methylene blue staining'],
    apparatus: ['microscope', 'slides', 'cover_slips', 'scalpel', 'forceps', 'dropper', 'watch_glass']
  },
  {
    code: 'cell-biology',
    title: 'Cell Structure & Organization',
    branch: 'Cellular & Molecular',
    category: 'Cytology',
    icon: 'fa-circle-nodes',
    description: 'Ultrastructure of plant and animal cells: nucleus, cell membrane, cellulose cell wall, cytoplasm, mitochondria, chloroplasts, large central vacuole, ribosomes, endoplasmic reticulum, and Golgi body.',
    modes: ['cell_interactive_canvas', 'organelle_highlighter', 'plant_vs_animal_diff'],
    keyConcepts: ['Prokaryotic vs Eukaryotic cells', 'Organelle compartmentalization', 'Cell differentiation & specialization'],
    apparatus: ['plant_cell_model', 'animal_cell_model', 'organelle_inspector']
  },
  {
    code: 'microscopy',
    title: 'Microscopy & Specimen Preparation',
    branch: 'Cellular & Molecular',
    category: 'Cytology',
    icon: 'fa-microscope',
    description: 'Compound optical microscope mechanics, coarse/fine focus adjustment, objective turret lenses (4x, 10x, 40x, 100x oil), magnification formula M = I/A, eyepiece graticule calibration, and stage vernier.',
    modes: ['virtual_microscope', 'magnification_calc', 'graticule_calibrator'],
    keyConcepts: ['Magnification M = Image size / Actual size', 'Resolving power limit', 'Temporary mount preparation'],
    apparatus: ['compound_microscope', 'stage_micrometer', 'eyepiece_graticule', 'onion_epidermis_slide', 'cheek_cell_slide']
  },
  {
    code: 'classification',
    title: 'Classification & Biodiversity',
    branch: 'Diversity & Taxonomy',
    category: 'Systematics',
    icon: 'fa-sitemap',
    description: 'Taxonomic hierarchy (Domain, Kingdom, Phylum, Class, Order, Family, Genus, Species), binomial nomenclature (Linnaean system), Five-Kingdom classification, and biological dichotomous keys.',
    modes: ['dichotomous_key_builder', 'taxonomic_tree', 'specimen_identifier'],
    keyConcepts: ['Binomial nomenclature rules', 'Monocotyledon vs Dicotyledon traits', 'Arthropod class keys'],
    apparatus: ['dichotomous_key_cards', 'pinned_insect_specimens', 'herbarium_sheets']
  },
  {
    code: 'plant-biology',
    title: 'Plant Anatomy & Physiology',
    branch: 'Botany',
    category: 'Plant Sciences',
    icon: 'fa-leaf',
    description: 'Morphology and internal cross-sectional anatomy of roots, stems, and leaves in monocots and dicots, vascular bundle arrangement, xylem vessels, phloem sieve tubes, and stomatal complex.',
    modes: ['leaf_cross_section', 'stem_dicot_monocot', 'stoma_guard_cells'],
    keyConcepts: ['Palisade mesophyll adaptations', 'Guard cell turgor mechanism', 'Xylem lignification'],
    apparatus: ['leaf_peel_slide', 'dicot_stem_ts', 'monocot_stem_ts', 'potometer']
  },
  {
    code: 'human-anatomy',
    title: 'Human Anatomy & Organ Systems',
    branch: 'Human Biology',
    category: 'Anatomy',
    icon: 'fa-person',
    description: 'Overview of the 11 human body systems: skeletal, muscular, circulatory, respiratory, digestive, nervous, endocrine, urinary, reproductive, lymphatic, and integumentary systems in 3D.',
    modes: ['human_anatomy_3d', 'organ_isolator', 'system_layer_peeler'],
    keyConcepts: ['Hierarchical organization: Cells -> Tissues -> Organs -> Systems', 'Homeostatic integration'],
    apparatus: ['human_torso_model', 'skeleton_3d', 'vital_organs_pack']
  },
  {
    code: 'animal-biology',
    title: 'Animal Biology & Tissue Specialization',
    branch: 'Zoology',
    category: 'Comparative Zoology',
    icon: 'fa-paw',
    description: 'Major animal phyla (Porifera, Cnidaria, Platyhelminthes, Annelida, Mollusca, Arthropoda, Chordata), vertebrate classes (fish, amphibians, reptiles, birds, mammals), and specialized animal tissues.',
    modes: ['vertebrate_comparer', 'tissue_histology_viewer', 'locomotion_simulator'],
    keyConcepts: ['Epithelial, connective, muscular, and nervous tissues', 'Endoskeleton vs exoskeleton adaptations'],
    apparatus: ['dissected_frog_model', 'mammalian_tissue_slides', 'arthropod_collection']
  },
  {
    code: 'nutrition',
    title: 'Nutrition & Digestive Chemistry',
    branch: 'Physiology & Biochemistry',
    category: 'Metabolism',
    icon: 'fa-utensils',
    description: 'Autotrophic vs heterotrophic nutrition, macro/micronutrients, balanced human diet, and standard qualitative biochemical food tests (Benedict’s, Iodine, Biuret, Ethanol emulsion, DCPIP for Vitamin C).',
    modes: ['biochemical_food_tests', 'digestive_tract_sim', 'dietary_calorie_calc'],
    keyConcepts: ['Reducing sugars Benedict test', 'Starch iodine complex', 'Biuret peptide bond reaction', 'Emulsion test for lipids'],
    apparatus: ['reagent_bottles', 'water_bath_70c', 'test_tube_rack', 'benedicts_solution', 'biuret_reagent', 'iodine_solution']
  },
  {
    code: 'respiration',
    title: 'Cellular Respiration & Gas Exchange',
    branch: 'Physiology & Biochemistry',
    category: 'Metabolism',
    icon: 'fa-lungs',
    description: 'Aerobic cellular respiration pathway and energy yield (38 ATP), anaerobic lactic acid fermentation in muscle and ethanol fermentation in yeast, mammalian lungs alveoli, and breathing mechanics.',
    modes: ['bell_jar_lungs_model', 'yeast_fermentation_sim', 'alveolar_gas_exchange'],
    keyConcepts: ['C6H12O6 + 6O2 -> 6CO2 + 6H2O + 38 ATP', 'Diaphragm & intercostal muscles in ventilation', 'Lime water CO2 test'],
    apparatus: ['respirometer', 'bell_jar_diaphragm_model', 'lime_water_flask', 'germinating_peas_flask']
  },
  {
    code: 'photosynthesis',
    title: 'Photosynthesis & Plant Energy',
    branch: 'Botany',
    category: 'Plant Sciences',
    icon: 'fa-sun-plant-wilt',
    description: 'Light-dependent and light-independent stages in chloroplast thylakoids and stroma, overall chemical equation, light intensity, CO2 concentration, and temperature as Blackman limiting factors.',
    modes: ['elodea_bubble_counter', 'limiting_factors_surface', 'chlorophyll_chromatography'],
    keyConcepts: ['6CO2 + 6H2O -> C6H12O6 + 6O2', 'Starch leaf destarching & iodine test', 'Photosynthetic saturation rate'],
    apparatus: ['elodea_pondweed', 'inverted_funnel', 'boiling_tube', 'bench_lamp_ruler', 'sodium_bicarbonate']
  },
  {
    code: 'transport-systems',
    title: 'Transport in Plants & Animals',
    branch: 'Physiology & Biochemistry',
    category: 'Circulation & Transport',
    icon: 'fa-heart-pulse',
    description: 'Plant water uptake through root hair cells, transpiration stream, potometer investigations; human double circulatory system (pulmonary and systemic), heart structure, cardiac cycle, and blood vessels.',
    modes: ['potometer_transpiration_sim', 'beating_heart_3d', 'blood_vessel_cross_section'],
    keyConcepts: ['Cohesion-tension theory', 'Cardiac valves (tricuspid, bicuspid, semilunar)', 'Arteries vs Veins vs Capillaries'],
    apparatus: ['bubble_potometer', 'mammalian_heart_model', 'stethoscope', 'sphygmomanometer']
  },
  {
    code: 'excretion',
    title: 'Excretion & Osmoregulation',
    branch: 'Physiology & Biochemistry',
    category: 'Renal Physiology',
    icon: 'fa-droplet',
    description: 'Metabolic waste products, human urinary system, kidney internal longitudinal section (cortex, medulla, pelvis), and detailed nephron functioning: ultrafiltration in Bowman’s capsule and selective reabsorption.',
    modes: ['nephron_filtration_sim', 'kidney_longitudinal_section', 'dialysis_machine_sim'],
    keyConcepts: ['Glomerular ultrafiltration under high pressure', 'Loop of Henle countercurrent multiplier', 'ADH negative feedback'],
    apparatus: ['kidney_nephron_model', 'dialysis_tubing', 'artificial_urine_test']
  },
  {
    code: 'coordination',
    title: 'Coordination & Response',
    branch: 'Physiology & Biochemistry',
    category: 'Neurobiology & Endocrinology',
    icon: 'fa-brain',
    description: 'Central and peripheral nervous system, sensory, relay, and motor neurons, synaptic transmission via neurotransmitters, spinal reflex arc, structure of the human eye and accommodation, and endocrine glands.',
    modes: ['reflex_arc_animator', 'synapse_neurotransmitter_sim', 'eye_accommodation_bench'],
    keyConcepts: ['Resting & action potential transmission', 'Reflex pathway: Receptor -> Sensory -> CNS -> Motor -> Effector', 'Hormonal vs nervous control'],
    apparatus: ['brain_model', 'dissectible_eye_model', 'reflex_hammer']
  },
  {
    code: 'reproduction',
    title: 'Reproduction in Plants & Animals',
    branch: 'Genetics & Development',
    category: 'Reproductive Biology',
    icon: 'fa-venus-mars',
    description: 'Asexual reproduction (binary fission, budding, vegetative propagation) vs sexual reproduction; flower anatomy, pollination vectors, fertilization, fruit/seed formation; human reproductive anatomy and gametogenesis.',
    modes: ['flower_dissection_bench', 'human_reproductive_cycle', 'gametogenesis_meiosis'],
    keyConcepts: ['Pollen tube germination to micropyle', 'Menstrual cycle hormonal regulation (FSH, LH, Estrogen, Progesterone)', 'Zygote to blastocyst development'],
    apparatus: ['hibiscus_flower_model', 'pollen_slide', 'mammalian_ovary_testis_slides']
  },
  {
    code: 'growth-development',
    title: 'Growth & Development',
    branch: 'Genetics & Development',
    category: 'Developmental Biology',
    icon: 'fa-arrow-up-right-dots',
    description: 'Phases of growth, primary and secondary growth, apical meristems, conditions necessary for seed germination (water, oxygen, temperature), hypogeal vs epigeal germination, and animal metamorphosis.',
    modes: ['seed_germination_chamber', 'sigmoidal_growth_curve', 'insect_metamorphosis'],
    keyConcepts: ['Sigmoid growth curve (Lag, Log, Decelerating, Stationary phases)', 'Auxin elongation in phototropism and gravitropism'],
    apparatus: ['germination_beakers', 'clinostat', 'auxin_agar_blocks']
  },
  {
    code: 'genetics',
    title: 'Genetics & Inheritance',
    branch: 'Genetics & Development',
    category: 'Classical Genetics',
    icon: 'fa-dna',
    description: 'Mendel’s laws of segregation and independent assortment, monohybrid and dihybrid crosses, Punnett squares, dominant and recessive alleles, codominance (ABO blood groups), sex linkage, and pedigree charts.',
    modes: ['punnett_square_solver', 'pedigree_tree_builder', 'blood_group_genotyper'],
    keyConcepts: ['Monohybrid 3:1 phenotypic ratio', 'Dihybrid 9:3:3:1 ratio', 'X-linked recessive inheritance (Color blindness, Hemophilia)'],
    apparatus: ['genetics_bead_counters', 'punnett_interactive_board', 'pedigree_cards']
  },
  {
    code: 'evolution',
    title: 'Variation & Evolution',
    branch: 'Evolutionary Biology',
    category: 'Evolution & Adaptation',
    icon: 'fa-crow',
    description: 'Continuous vs discontinuous variation, environmental and genetic causes of variation, natural selection (Darwinian fitness, industrial melanism in peppered moth), adaptation, speciation, and fossil record.',
    modes: ['natural_selection_simulator', 'variation_histogram_generator', 'phylogenetic_tree'],
    keyConcepts: ['Differential survival and reproduction', 'Gene pool allele frequency shifts', 'Homologous pentadactyl limb structures'],
    apparatus: ['peppered_moth_simulation', 'beak_variation_finches']
  },
  {
    code: 'ecology',
    title: 'Ecology & Ecosystem Dynamics',
    branch: 'Ecology & Environment',
    category: 'Environmental Sciences',
    icon: 'fa-tree',
    description: 'Ecosystem biotic and abiotic components, food chains, complex food webs, pyramids of numbers, biomass, and energy, 10% trophic efficiency rule, biogeochemical cycles (carbon, nitrogen, water), and ecological sampling.',
    modes: ['food_web_interactive_canvas', 'trophic_pyramid_builder', 'quadrat_sampling_grid'],
    keyConcepts: ['Trophic level energy transfer (90% loss as heat)', 'Nitrification, nitrogen fixation, and denitrification', 'Quadrat & line transect population estimation'],
    apparatus: ['quadrat_frame', 'pitfall_traps', 'secchi_disc', 'soil_testing_kit']
  },
  {
    code: 'microbiology',
    title: 'Microbiology & Infectious Diseases',
    branch: 'Microbiology & Health',
    category: 'Microbial Sciences',
    icon: 'fa-bacterium',
    description: 'Structure, classification, and reproduction of bacteria, viruses (bacteriophage, HIV, influenza), pathogenic fungi, and protozoa; bacterial growth phases; aseptic culturing techniques; and antibiotic disc sensitivity.',
    modes: ['bacterial_growth_curve', 'antibiotic_zone_inhibition', 'virus_capsid_3d'],
    keyConcepts: ['Binary fission doubling time', 'Aseptic streaking technique', 'Antibiotic resistance mechanisms'],
    apparatus: ['agar_petri_plates', 'inoculating_loop', 'antibiotic_sensidiscs', 'autoclave_model']
  },
  {
    code: 'immunology',
    title: 'Immunology & Body Defense',
    branch: 'Microbiology & Health',
    category: 'Immune System',
    icon: 'fa-shield-virus',
    description: 'First, second, and third lines of defense, phagocytosis by neutrophils and macrophages, humoral and cell-mediated immunity (B and T lymphocytes), antibody structure, active/passive immunity, and vaccination.',
    modes: ['phagocytosis_animation', 'antibody_antigen_lock_key', 'primary_secondary_immune_curve'],
    keyConcepts: ['Antigen-antibody specificity', 'Memory cells in secondary response', 'Herd immunity in vaccination'],
    apparatus: ['antibody_model', 'blood_typing_serum_kit']
  },
  {
    code: 'biotechnology',
    title: 'Biotechnology & Genetic Engineering',
    branch: 'Cellular & Molecular',
    category: 'Applied Biotechnology',
    icon: 'fa-microchip',
    description: 'Industrial fermentation in bioreactors, recombinant DNA technology: isolation of human insulin gene, restriction endonucleases, DNA ligase, plasmid vectors, PCR amplification, and gel electrophoresis.',
    modes: ['recombinant_plasmid_cloning', 'gel_electrophoresis_tank', 'industrial_fermenter_3d'],
    keyConcepts: ['Restriction enzyme sticky ends', 'Bacterial transformation', 'DNA fragment separation by charge and size'],
    apparatus: ['agarose_gel_tank', 'transilluminator', 'bioreactor_vessel']
  },
  {
    code: 'homeostasis',
    title: 'Homeostasis & Feedback Systems',
    branch: 'Physiology & Biochemistry',
    category: 'Regulatory Physiology',
    icon: 'fa-temperature-arrow-down',
    description: 'Principles of negative feedback: stimulus, receptor, control center, effector, response. Human thermoregulation (vasodilation, vasoconstriction, sweating, shivering), and blood glucose regulation by pancreas (insulin, glucagon).',
    modes: ['glucose_feedback_loop', 'thermoregulation_skin_model', 'water_balance_osmoregulator'],
    keyConcepts: ['Negative feedback counteraction of deviations', 'Islets of Langerhans alpha and beta cell hormones', 'Hypothalamus thermostat'],
    apparatus: ['skin_cross_section_model', 'glucose_monitoring_sim']
  },
  {
    code: 'environmental-biology',
    title: 'Environmental Biology & Conservation',
    branch: 'Ecology & Environment',
    category: 'Environmental Sciences',
    icon: 'fa-earth-americas',
    description: 'Human impact on ecosystems: deforestation, soil erosion, air pollution (acid rain, greenhouse effect), water pollution (organic waste, eutrophication, biomagnification), conservation strategies, and sustainable development.',
    modes: ['eutrophication_lake_simulator', 'greenhouse_carbon_cycle', 'biodiversity_hotspot_map'],
    keyConcepts: ['Eutrophication sequence: Fertilizer runoff -> Algal bloom -> Light blocked -> Decomposition -> Anoxia -> Fish kill', 'Bioaccumulation through food chains'],
    apparatus: ['water_quality_sensors', 'dissolved_oxygen_meter']
  },
  {
    code: 'virtual-experiments',
    title: 'Virtual Experiments Workbench',
    branch: 'Laboratory Practicals',
    category: 'Hands-On Labs',
    icon: 'fa-flask-round-potion',
    description: '12 guided virtual biology experiments: Starch and reducing sugar tests, potato cylinder osmosis, enzyme catalase kinetics vs temperature, light intensity on photosynthesis rate, and transpiration with potometer.',
    modes: ['interactive_lab_protocol', 'apparatus_assembly', 'data_logger_table'],
    keyConcepts: ['Hypothesis-driven methodology', 'Controlled independent/dependent variables', 'Reproducible quantitative measurements'],
    apparatus: ['all_biology_apparatus']
  },
  {
    code: 'specimen-library',
    title: 'Specimen & Slide Library',
    branch: 'Laboratory Practicals',
    category: 'Equipment & Tooling',
    icon: 'fa-boxes-packing',
    description: 'Curated library of 11 biological model and specimen categories: cell organelles, tissues, plant parts, anatomical organ models, preserved invertebrate specimens, and digital high-magnification slides.',
    modes: ['specimen_viewer', 'slide_catalogue', 'model_dissector'],
    keyConcepts: ['Morphological identification', 'Histological staining features'],
    apparatus: ['all_specimens']
  },
  {
    code: 'graphing-data-analysis',
    title: 'Biological Graphing & Data Analysis',
    branch: 'Scientific Computing',
    category: 'Analysis & Statistics',
    icon: 'fa-chart-area',
    description: 'Direct integration with the Interactive Graphing Laboratory: plot Michaelis-Menten enzyme curves, logistic population growth sigmoids, photosynthesis rate vs light/temperature, and ecological histograms.',
    modes: ['graph_studio_bridge', 'regression_fit', 'statistical_error_bars'],
    keyConcepts: ['Independent variable on x-axis, dependent on y-axis', 'Line of best fit vs smooth curve', 'Initial rate calculation from gradient'],
    apparatus: ['graphing_engine']
  },
  {
    code: 'practical-assessments',
    title: 'Practical Assessments & CBT',
    branch: 'Assessment & Examination',
    category: 'Evaluations',
    icon: 'fa-file-circle-check',
    description: 'Interactive biology practical assessments: microscopic magnification problem solving, diagram labeling, food test identification, Punnett square inheritance crosses, and food web trophic analysis.',
    modes: ['cbt_practical_exam', 'diagram_label_quiz', 'punnett_challenge'],
    keyConcepts: ['Objective verifiable grading', 'Tolerance-based numerical evaluation', 'Genotype-phenotype ratio matching'],
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
      modes: t.modes,
      keyConcepts: t.keyConcepts
    }));
    res.json({ success: true, count: list.length, topics: list });
  } catch (err) {
    next(err);
  }
}

// 2. Get Single Topic Detail
async function getTopicByCode(req, res, next) {
  try {
    const code = req.params.code;
    const topic = CURRICULUM_TOPICS.find((t) => t.code === code);
    if (!topic) {
      return res.status(404).json({ success: false, error: `Topic '${code}' not found in Biology curriculum` });
    }
    res.json({ success: true, topic });
  } catch (err) {
    next(err);
  }
}

// 3. List Saved Biology Experiments
async function listExperiments(req, res, next) {
  try {
    const userIdentifier = req.session.registrationNumber || req.session.adminId || 'anonymous';
    const [rows] = await pool.query(
      `SELECT id, title, topic_code, model_type, classroom_id, created_at, updated_at
       FROM biology_experiments
       WHERE user_identifier = ? OR classroom_id IS NOT NULL
       ORDER BY updated_at DESC`,
      [String(userIdentifier)]
    );
    res.json({ success: true, count: rows.length, experiments: rows });
  } catch (err) {
    next(err);
  }
}

// 4. Save New Biology Experiment Setup
async function saveExperiment(req, res, next) {
  try {
    const userIdentifier = req.session.registrationNumber || req.session.adminId || 'anonymous';
    const userRole = req.session.adminId ? 'admin' : 'student';
    const userId = req.session.userId || 1;

    const {
      title,
      topic_code = 'virtual-experiments',
      model_type = 'cell_2d',
      classroom_id = null,
      specimens = [],
      annotations = [],
      variables = {},
      data_readings = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Experiment title is required.' });
    }

    const [result] = await pool.query(
      `INSERT INTO biology_experiments 
        (user_id, user_role, user_identifier, classroom_id, title, topic_code, model_type, specimens_json, annotations_json, variables_json, data_readings_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userRole,
        String(userIdentifier),
        classroom_id,
        title.trim(),
        topic_code,
        model_type,
        JSON.stringify(specimens),
        JSON.stringify(annotations),
        JSON.stringify(variables),
        JSON.stringify(data_readings)
      ]
    );

    res.json({ success: true, experiment_id: result.insertId, message: 'Biology experiment saved successfully.' });
  } catch (err) {
    next(err);
  }
}

// 5. Get Single Experiment Detail
async function getExperimentById(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const [rows] = await pool.query(
      `SELECT * FROM biology_experiments WHERE id = ? LIMIT 1`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'Biology experiment not found.' });
    }
    const exp = rows[0];
    res.json({
      success: true,
      experiment: {
        id: exp.id,
        title: exp.title,
        topic_code: exp.topic_code,
        model_type: exp.model_type,
        classroom_id: exp.classroom_id,
        specimens: typeof exp.specimens_json === 'string' ? JSON.parse(exp.specimens_json) : (exp.specimens_json || []),
        annotations: typeof exp.annotations_json === 'string' ? JSON.parse(exp.annotations_json) : (exp.annotations_json || []),
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
      `DELETE FROM biology_experiments WHERE id = ? AND (user_identifier = ? OR ? = 'admin')`,
      [id, String(userIdentifier), req.session.adminId ? 'admin' : 'student']
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Experiment not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Biology experiment deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

// 7. Auto-Grading: Genetics Punnett Square Cross Solver
async function gradeGeneticsCross(req, res, next) {
  try {
    const { parent1_genotype, parent2_genotype, student_genotype_ratio, student_phenotype_ratio } = req.body;

    if (!parent1_genotype || !parent2_genotype) {
      return res.status(400).json({ success: false, error: 'Parental genotypes required.' });
    }

    const p1 = parent1_genotype.trim();
    const p2 = parent2_genotype.trim();

    // Monohybrid cross solver (e.g. Aa x Aa -> AA, Aa, aA, aa)
    if (p1.length === 2 && p2.length === 2) {
      const g1 = [p1[0], p1[1]];
      const g2 = [p2[0], p2[1]];
      const offspring = [];
      for (const a of g1) {
        for (const b of g2) {
          // Normalize so dominant letter comes first (e.g. Aa instead of aA)
          const sorted = a.toLowerCase() === b.toLowerCase() ? (a <= b ? a + b : b + a) : a + b;
          offspring.push(sorted);
        }
      }

      // Count genotypes
      const counts = {};
      offspring.forEach((g) => { counts[g] = (counts[g] || 0) + 1; });

      // Build expected standard ratios
      const expectedRatios = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' : ');
      const isCorrect = student_genotype_ratio ? student_genotype_ratio.trim() === expectedRatios.trim() : true;

      return res.json({
        success: true,
        cross: `${p1} × ${p2}`,
        offspringGenotypes: offspring,
        genotypeCounts: counts,
        expectedRatio: expectedRatios,
        isCorrect,
        feedback: isCorrect
          ? `Correct inheritance outcome! Offspring genotypes follow ${expectedRatios}.`
          : `Incorrect ratio. Expected ${expectedRatios}.`
      });
    }

    res.json({ success: true, cross: `${p1} × ${p2}`, message: 'Cross evaluated successfully.' });
  } catch (err) {
    next(err);
  }
}

// 8. Auto-Grading: Virtual Microscopy Magnification & Graticule Calibration
async function gradeMicroscopyCalculation(req, res, next) {
  try {
    const { image_size, actual_size, magnification, tolerance = 0.05, unit = 'μm' } = req.body;

    const I = parseFloat(image_size);
    const A = parseFloat(actual_size);
    const M = parseFloat(magnification);

    let isCorrect = false;
    let expected = null;
    let diff = 0;

    if (!isNaN(I) && !isNaN(A) && !isNaN(M)) {
      // Check M = I / A (ensure image and actual are in matching units)
      expected = I / A;
      diff = Math.abs(M - expected);
      isCorrect = diff <= tolerance * expected;
    } else if (!isNaN(I) && !isNaN(M)) {
      // Calculate A = I / M
      expected = I / M;
      diff = Math.abs(A - expected);
      isCorrect = diff <= tolerance * expected;
    } else if (!isNaN(A) && !isNaN(M)) {
      // Calculate I = A * M
      expected = A * M;
      diff = Math.abs(I - expected);
      isCorrect = diff <= tolerance * expected;
    } else {
      return res.status(400).json({ success: false, error: 'Provide at least two variables from (image_size, actual_size, magnification).' });
    }

    res.json({
      success: true,
      isCorrect,
      expected: parseFloat(expected.toFixed(4)),
      difference: parseFloat(diff.toFixed(4)),
      unit,
      feedback: isCorrect
        ? `Accurate microscopic calculation! Matches formula M = I / A within allowed tolerance.`
        : `Calculation out of bounds. Expected ${expected.toFixed(3)} ${unit}.`
    });
  } catch (err) {
    next(err);
  }
}

// 9. Auto-Grading: Dihybrid 16-Cell Punnett Square Cross Solver
async function gradeDihybridCross(req, res, next) {
  try {
    const { parent1_genotype = 'AaBb', parent2_genotype = 'AaBb', student_phenotype_ratio } = req.body;

    const p1 = parent1_genotype.trim();
    const p2 = parent2_genotype.trim();

    if (p1.length !== 4 || p2.length !== 4) {
      return res.status(400).json({ success: false, error: 'Dihybrid cross requires 4-allele genotypes (e.g. AaBb).' });
    }

    // Generate gametes using foil (First, Outer, Inner, Last)
    const getGametes = (g) => [
      g[0] + g[2],
      g[0] + g[3],
      g[1] + g[2],
      g[1] + g[3]
    ];

    const gametes1 = getGametes(p1);
    const gametes2 = getGametes(p2);

    // Helper to sort alleles per gene (e.g. A + a -> Aa, B + b -> Bb)
    const combineGametes = (gam1, gam2) => {
      const aAlleles = gam1[0].toLowerCase() === gam2[0].toLowerCase()
        ? (gam1[0] <= gam2[0] ? gam1[0] + gam2[0] : gam2[0] + gam1[0])
        : gam1[0] + gam2[0];
      const bAlleles = gam1[1].toLowerCase() === gam2[1].toLowerCase()
        ? (gam1[1] <= gam2[1] ? gam1[1] + gam2[1] : gam2[1] + gam1[1])
        : gam1[1] + gam2[1];
      return aAlleles + bAlleles;
    };

    const grid = [];
    const offspring = [];
    for (let r = 0; r < 4; r++) {
      const row = [];
      for (let c = 0; c < 4; c++) {
        const zygote = combineGametes(gametes1[r], gametes2[c]);
        row.push(zygote);
        offspring.push(zygote);
      }
      grid.push(row);
    }

    // Phenotype classification
    // Dominant A: has uppercase of p1[0]
    // Dominant B: has uppercase of p1[2]
    const domA = p1[0].toUpperCase();
    const domB = p1[2].toUpperCase();

    let AB = 0, Ab = 0, aB = 0, ab = 0;
    offspring.forEach((z) => {
      const hasA = z.includes(domA);
      const hasB = z.includes(domB);
      if (hasA && hasB) AB++;
      else if (hasA && !hasB) Ab++;
      else if (!hasA && hasB) aB++;
      else ab++;
    });

    const expectedRatio = `${AB} : ${Ab} : ${aB} : ${ab}`;
    const isCorrect = student_phenotype_ratio ? student_phenotype_ratio.trim() === expectedRatio.trim() : true;

    res.json({
      success: true,
      cross: `${p1} × ${p2}`,
      parent1Gametes: gametes1,
      parent2Gametes: gametes2,
      grid,
      phenotypeCounts: { 'Dominant-Dominant': AB, 'Dominant-Recessive': Ab, 'Recessive-Dominant': aB, 'Recessive-Recessive': ab },
      expectedRatio,
      isCorrect,
      feedback: isCorrect
        ? `Correct dihybrid assortment! Mendelian independent assortment yields ${expectedRatio}.`
        : `Incorrect dihybrid ratio. Expected ${expectedRatio}.`
    });
  } catch (err) {
    next(err);
  }
}

// 10. Computational Enzyme Kinetics Engine (Michaelis-Menten with Inhibitors)
async function simulateEnzymeKinetics(req, res, next) {
  try {
    const {
      temp = 37,
      pH = 7.4,
      substrate = 10, // mM
      inhibitorType = 'none', // 'none' | 'competitive' | 'non_competitive'
      inhibitorConc = 0 // mM
    } = req.body;

    const T = parseFloat(temp);
    const pHVal = parseFloat(pH);
    const S = parseFloat(substrate);
    const I = parseFloat(inhibitorConc);

    let Vmax = 100.0; // μmol/min
    let Km = 5.0; // mM
    const Ki = 2.0; // mM inhibitor dissociation constant

    // Modify apparent kinetic parameters based on inhibitor
    let apparentVmax = Vmax;
    let apparentKm = Km;

    if (inhibitorType === 'competitive' && I > 0) {
      apparentKm = Km * (1 + I / Ki);
    } else if (inhibitorType === 'non_competitive' && I > 0) {
      apparentVmax = Vmax / (1 + I / Ki);
    }

    // Temperature & pH factor bells
    const tempFactor = Math.exp(-0.5 * Math.pow((T - 37) / 10, 2));
    const pHFactor = Math.exp(-0.5 * Math.pow((pHVal - 7.4) / 1.5, 2));

    const adjustedVmax = apparentVmax * tempFactor * pHFactor;
    const velocity = (adjustedVmax * S) / (apparentKm + S);

    // Lineweaver-Burk coordinates (1/S vs 1/v)
    const lineweaverBurk = {
      invS: S > 0 ? parseFloat((1 / S).toFixed(4)) : null,
      invV: velocity > 0 ? parseFloat((1 / velocity).toFixed(4)) : null,
      xIntercept: parseFloat((-1 / apparentKm).toFixed(4)),
      yIntercept: parseFloat((1 / adjustedVmax).toFixed(4))
    };

    // Generate curve points for graphing
    const curvePoints = [];
    for (let sVal = 0.5; sVal <= 40; sVal += 1.5) {
      const v = (adjustedVmax * sVal) / (apparentKm + sVal);
      curvePoints.push({ s: parseFloat(sVal.toFixed(1)), v: parseFloat(v.toFixed(2)) });
    }

    res.json({
      success: true,
      velocity: parseFloat(velocity.toFixed(2)),
      unit: 'μmol/min',
      apparentVmax: parseFloat(adjustedVmax.toFixed(2)),
      apparentKm: parseFloat(apparentKm.toFixed(2)),
      inhibitorType,
      lineweaverBurk,
      curvePoints
    });
  } catch (err) {
    next(err);
  }
}

// 11. Computational Ecology: Lotka-Volterra Predator-Prey Dynamics Engine
async function simulateLotkaVolterra(req, res, next) {
  try {
    const {
      alpha = 1.0,  // Prey natural birth rate
      beta = 0.05,  // Predation rate
      gamma = 0.5,  // Predator death rate
      delta = 0.02, // Predator reproduction efficiency
      prey0 = 40,   // Initial prey population
      pred0 = 9,    // Initial predator population
      steps = 60,   // Number of iterations
      dt = 0.1      // Time step
    } = req.body;

    let x = parseFloat(prey0);
    let y = parseFloat(pred0);
    const a = parseFloat(alpha);
    const b = parseFloat(beta);
    const g = parseFloat(gamma);
    const d = parseFloat(delta);
    const nSteps = parseInt(steps, 10);
    const deltaT = parseFloat(dt);

    const timeSeries = [];
    timeSeries.push({ t: 0, prey: Math.round(x), predator: Math.round(y) });

    for (let i = 1; i <= nSteps; i++) {
      // Runge-Kutta 2nd order (midpoint) numerical step for stability
      const dx1 = (a * x - b * x * y) * deltaT;
      const dy1 = (d * x * y - g * y) * deltaT;

      const xMid = Math.max(0, x + dx1 * 0.5);
      const yMid = Math.max(0, y + dy1 * 0.5);

      const dx2 = (a * xMid - b * xMid * yMid) * deltaT;
      const dy2 = (d * xMid * yMid - g * yMid) * deltaT;

      x = Math.max(0, x + dx2);
      y = Math.max(0, y + dy2);

      timeSeries.push({
        t: parseFloat((i * deltaT).toFixed(2)),
        prey: parseFloat(x.toFixed(1)),
        predator: parseFloat(y.toFixed(1))
      });
    }

    const equilibriumPrey = g / d;
    const equilibriumPredator = a / b;

    res.json({
      success: true,
      timeSeries,
      equilibrium: {
        prey: parseFloat(equilibriumPrey.toFixed(1)),
        predator: parseFloat(equilibriumPredator.toFixed(1))
      }
    });
  } catch (err) {
    next(err);
  }
}

// 12. Microbiology: Kirby-Bauer Antibiotic Susceptibility Assay Evaluator
async function evaluateAntibioticAssay(req, res, next) {
  try {
    const { antibiotic = 'penicillin', zone_diameter_mm = 22 } = req.body;
    const d = parseFloat(zone_diameter_mm);

    // Standard CLSI / EUCAST breakpoint reference table
    const BREAKPOINTS = {
      penicillin: { resistant: 14, susceptible: 29, drugClass: 'Beta-lactam (Cell wall synthesis inhibitor)' },
      ampicillin: { resistant: 13, susceptible: 17, drugClass: 'Aminopenicillin (Transpeptidase inhibitor)' },
      tetracycline: { resistant: 14, susceptible: 19, drugClass: 'Tetracycline (30S ribosomal protein inhibitor)' },
      streptomycin: { resistant: 11, susceptible: 15, drugClass: 'Aminoglycoside (30S subunit misreading)' },
      chloramphenicol: { resistant: 12, susceptible: 18, drugClass: 'Peptidyl transferase inhibitor' }
    };

    const ref = BREAKPOINTS[antibiotic.toLowerCase()] || BREAKPOINTS['penicillin'];
    let interpretation = 'Intermediate';
    let statusClass = 'text-warning';

    if (d <= ref.resistant) {
      interpretation = 'Resistant';
      statusClass = 'text-danger';
    } else if (d >= ref.susceptible) {
      interpretation = 'Susceptible';
      statusClass = 'text-success';
    }

    res.json({
      success: true,
      antibiotic,
      zone_diameter_mm: d,
      interpretation,
      drugClass: ref.drugClass,
      thresholds: {
        resistant: `≤ ${ref.resistant} mm`,
        intermediate: `${ref.resistant + 1} - ${ref.susceptible - 1} mm`,
        susceptible: `≥ ${ref.susceptible} mm`
      },
      clinicalNote: interpretation === 'Susceptible'
        ? `Organism is inhibited by standard therapeutic concentrations of ${antibiotic}.`
        : interpretation === 'Resistant'
        ? `Organism is NOT inhibited by systemic concentrations; therapy with ${antibiotic} is not recommended.`
        : `Buffer zone: clinical efficacy uncertain without elevated dosage.`
    });
  } catch (err) {
    next(err);
  }
}

// 13. Categorized Biological Model & Specimen Catalog API
async function getSpecimenLibrary(req, res, next) {
  try {
    const CATALOG = [
      {
        id: 'cat_cells',
        name: 'Cells & Cytology',
        icon: 'fa-circle-nodes',
        specimens: [
          { id: 'plant_mesophyll', name: 'Plant Mesophyll Cell', dimensions: '50-100 μm', layers: ['Cell Wall', 'Cell Membrane', 'Vacuole', 'Chloroplasts', 'Nucleus'], organelleCount: 8 },
          { id: 'animal_hepatocyte', name: 'Animal Hepatocyte Cell', dimensions: '20-30 μm', layers: ['Plasma Membrane', 'Cytosol', 'Mitochondria', 'Nucleus', 'Endoplasmic Reticulum'], organelleCount: 7 },
          { id: 'bacterial_bacillus', name: 'Bacterial Bacillus Cell', dimensions: '1-5 μm', layers: ['Capsule', 'Peptidoglycan Wall', 'Plasmids', 'Nucleoid DNA'], organelleCount: 4 },
          { id: 'erythrocyte', name: 'Human Erythrocyte (RBC)', dimensions: '7.5 μm', layers: ['Biconcave Membrane', 'Hemoglobin Stroma'], organelleCount: 2 }
        ]
      },
      {
        id: 'cat_plants',
        name: 'Plant Anatomy',
        icon: 'fa-leaf',
        specimens: [
          { id: 'dicot_leaf_ts', name: 'Dicotyledonous Leaf T.S.', dimensions: '250 μm thick', layers: ['Cuticle', 'Upper Epidermis', 'Palisade Layer', 'Spongy Layer', 'Vascular Bundle', 'Lower Epidermis & Stomata'] },
          { id: 'dicot_stem_ts', name: 'Dicotyledonous Stem T.S.', dimensions: '2.5 mm diam', layers: ['Epidermis', 'Cortex', 'Phloem', 'Vascular Cambium', 'Xylem Vessels', 'Pith'] },
          { id: 'stoma_complex', name: 'Stomatal Complex (Guard Cells)', dimensions: '30 μm', layers: ['Cellulose Microfibrils', 'Stomatal Aperture', 'Chloroplasts', 'Subsidiary Cells'] }
        ]
      },
      {
        id: 'cat_human_anatomy',
        name: 'Human Anatomy & Organs',
        icon: 'fa-person',
        specimens: [
          { id: 'heart_4_chamber', name: 'Four-Chambered Human Heart', dimensions: '12 × 8 cm', layers: ['Pericardium', 'Myocardium', 'Endocardium', 'Valves & Chambers'] },
          { id: 'renal_nephron', name: 'Renal Nephron Functional Unit', dimensions: '30-55 mm total length', layers: ['Bowman’s Capsule', 'Glomerulus', 'Proximal Tubule', 'Loop of Henle', 'Collecting Duct'] },
          { id: 'alveolus_unit', name: 'Pulmonary Alveolus Gas Interface', dimensions: '200 μm diam', layers: ['Squamous Alveolar Wall', 'Pulmonary Capillary', 'Surfactant Film'] }
        ]
      },
      {
        id: 'cat_microorganisms',
        name: 'Microbiology & Viruses',
        icon: 'fa-bacterium',
        specimens: [
          { id: 'bacteriophage_t4', name: 'Bacteriophage T4 Virion', dimensions: '200 nm', layers: ['Icosahedral Capsid Head', 'Contractile Sheath', 'Tail Fibers', 'Base Plate'] },
          { id: 'escherichia_coli', name: 'Escherichia Coli (K-12)', dimensions: '2 × 0.5 μm', layers: ['Outer Membrane', 'Periplasmic Space', 'Flagella Tuft'] }
        ]
      },
      {
        id: 'cat_apparatus',
        name: 'Laboratory Apparatus',
        icon: 'fa-flask-vial',
        specimens: [
          { id: 'compound_microscope', name: 'Compound Optical Microscope', category: 'Optics & Microscopy', specs: 'Turret 4x/10x/40x/100x oil, Abbe condenser' },
          { id: 'bubble_potometer', name: 'Capillary Bubble Potometer', category: 'Plant Transpiration', specs: '0.1 mL graduated capillary with reservoir' },
          { id: 'respirometer_u_tube', name: 'U-Tube Respirometer', category: 'Physiology & Gas Exchange', specs: 'Manometer tube with KOH CO2 absorber' },
          { id: 'kirby_bauer_plate', name: 'Mueller-Hinton Agar Petri Plate', category: 'Microbiology Assay', specs: '90 mm sterile plate with antibiotic discs' }
        ]
      }
    ];

    res.json({ success: true, catalog: CATALOG });
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
  gradeGeneticsCross,
  gradeMicroscopyCalculation,
  gradeDihybridCross,
  simulateEnzymeKinetics,
  simulateLotkaVolterra,
  evaluateAntibioticAssay,
  getSpecimenLibrary
};
