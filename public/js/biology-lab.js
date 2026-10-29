/**
 * Interactive Biology & Life Sciences Laboratory Orchestrator
 * Comprehensive client-side workbench controller & scientific simulation engine
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Master State Management
  const state = {
    activeTopic: null,
    activeMode: 'workspace2d',
    topics: [],
    recordedData: [],
    activeTool: 'select',
    showLabels: true,
    simulationRunning: false,
    simTime: 0,
    zoomScale: 1.0,
    panOffset: { x: 0, y: 0 },
    selectedObjectId: null,
    caliperStart: null,
    caliperEnd: null,
    undoStack: [],
    redoStack: [],
    microscope: {
      objectiveMag: 10,
      eyepieceMag: 10,
      specimen: 'onion_epidermis',
      coarseFocus: 50,
      fineFocus: 50,
      diaphragm: 85,
      showGraticule: true
    },
    lotkaVolterra: {
      alpha: 1.0,
      beta: 0.05,
      gamma: 0.5,
      delta: 0.02,
      timeSeries: []
    },
    antibioticAssay: {
      drug: 'penicillin',
      zoneDiameter: 22
    },
    threeModelType: 'dna_helix'
  };

  // Canvas Objects (Interactive Biological Specimen & Organ Models)
  let canvasObjects = [
    {
      id: 'spec_plant_cell_1',
      name: 'Plant Mesophyll Cell',
      category: 'Cells & Cytology',
      type: 'plant_cell',
      x: 380,
      y: 260,
      width: 320,
      height: 220,
      rotation: 0,
      scale: 1.0,
      dimensions: '75 μm × 45 μm',
      layerLevel: 1, // 1 = Outer wall/membrane, 2 = Vacuole & organelles, 3 = Nucleus & DNA
      selected: true,
      labels: [
        { text: 'Cellulose Cell Wall', relX: -140, relY: -90 },
        { text: 'Large Central Vacuole', relX: 0, relY: 0 },
        { text: 'Chloroplast Granum', relX: 90, relY: -50 },
        { text: 'Nucleus (Chromatin)', relX: -80, relY: 40 }
      ]
    }
  ];

  // 12 Standard Pre-Configured Biology Experiment Protocols
  const EXPERIMENT_TEMPLATES = [
    {
      id: 'food_tests',
      title: 'Qualitative Biochemical Food Tests',
      branch: 'Physiology & Biochemistry',
      icon: 'fa-utensils',
      description: 'Perform standard tests for reducing sugars (Benedict’s), starch (Iodine), proteins (Biuret), and lipids (Ethanol emulsion).',
      reagents: ['Benedict’s solution', 'Iodine solution', 'Biuret reagent', 'Ethanol']
    },
    {
      id: 'potato_osmosis',
      title: 'Osmosis in Plant Tissues (Potato Cylinders)',
      branch: 'Plant Physiology',
      icon: 'fa-droplet',
      description: 'Immerse uniform potato cylinders in varying molarities of sucrose solution (0.0M to 1.0M) to determine tissue water potential.',
      apparatus: ['cork_borer', 'sucrose_solutions', 'boiling_tubes', 'electronic_balance', 'paper_towels']
    },
    {
      id: 'catalase_kinetics',
      title: 'Enzyme Catalase Activity vs Temperature',
      branch: 'Biochemistry',
      icon: 'fa-temperature-high',
      description: 'Investigate hydrogen peroxide decomposition by liver/potato catalase at temperatures from 0°C to 70°C to locate optimum and denaturation point.',
      apparatus: ['hydrogen_peroxide', 'liver_tissue', 'water_bath', 'gas_syringe_measuring']
    },
    {
      id: 'photosynthesis_light',
      title: 'Light Intensity & Photosynthesis Rate',
      branch: 'Botany',
      icon: 'fa-sun-plant-wilt',
      description: 'Count oxygen bubble evolution per minute from submerged Elodea pondweed at increasing bench lamp distances to test inverse-square law.',
      apparatus: ['elodea_pondweed', 'bench_lamp_50w', 'metre_rule', 'sodium_bicarbonate', 'stopwatch']
    },
    {
      id: 'transpiration_potometer',
      title: 'Transpiration Rate via Bubble Potometer',
      branch: 'Plant Physiology',
      icon: 'fa-leaf',
      description: 'Measure the rate of water uptake in a leafy shoot under ambient conditions, wind (fan), and elevated humidity (plastic bag).',
      apparatus: ['bubble_potometer', 'leafy_shoot', 'electric_fan', 'stopwatch', 'reservoir']
    },
    {
      id: 'respiration_germination',
      title: 'Aerobic Respiration in Germinating Seeds',
      branch: 'Physiology',
      icon: 'fa-lungs',
      description: 'Detect carbon dioxide production using limewater and calculate oxygen consumption rate with a simple manometer respirometer.',
      apparatus: ['germinating_peas', 'limewater_tubes', 'manometer_tube', 'potassium_hydroxide']
    },
    {
      id: 'salivary_amylase',
      title: 'Digestion of Starch by Salivary Amylase',
      branch: 'Physiology & Biochemistry',
      icon: 'fa-vial-circle-check',
      description: 'Test starch breakdown over time using a spotting tile with iodine drops at different pH buffers (pH 4, 7, 9) to determine optimum enzyme pH.',
      apparatus: ['spotting_tile', 'amylase_solution', 'starch_suspension', 'buffer_solutions', 'iodine']
    },
    {
      id: 'stomatal_density',
      title: 'Stomatal Density Leaf Impression',
      branch: 'Microscopy & Botany',
      icon: 'fa-microscope',
      description: 'Prepare clear nail polish impressions of upper and lower epidermis to count stomata per unit area under high power (400×).',
      apparatus: ['monocot_dicot_leaves', 'clear_varnish', 'microscope_slides', 'grid_micrometer']
    },
    {
      id: 'yeast_fermentation',
      title: 'Anaerobic Fermentation in Yeast Culture',
      branch: 'Microbiology',
      icon: 'fa-bacterium',
      description: 'Measure volume of carbon dioxide evolved by baker’s yeast supplied with different carbohydrate substrates (glucose, sucrose, starch).',
      apparatus: ['yeast_suspension', 'glucose_solution', 'paraffin_oil_seal', 'delivery_tube_gas_jar']
    },
    {
      id: 'dna_extraction',
      title: 'Crude DNA Extraction from Fruit Tissue',
      branch: 'Molecular Genetics',
      icon: 'fa-dna',
      description: 'Lyse cell membranes with detergent, digest proteins with protease/salt, and precipitate visible white DNA strands with ice-cold ethanol.',
      apparatus: ['ripe_banana_strawberry', 'dish_detergent', 'sodium_chloride', 'ice_cold_ethanol', 'glass_rod']
    },
    {
      id: 'monohybrid_cross',
      title: 'Monohybrid Cross Genetics Simulation',
      branch: 'Genetics',
      icon: 'fa-chart-pie',
      description: 'Simulate crosses between heterozygous pea plants (Aa × Aa) for seed shape (Round vs Wrinkled) to verify the 3:1 phenotypic ratio.',
      apparatus: ['genetics_beads_container', 'punnett_grid', 'tally_counter']
    },
    {
      id: 'quadrat_sampling',
      title: 'Quadrat Field Sampling & Species Frequency',
      branch: 'Ecology',
      icon: 'fa-tree',
      description: 'Sample plant species abundance across a simulated grassland ecosystem using random quadrat placements to calculate percentage cover.',
      apparatus: ['grid_quadrat_0.5m', 'random_number_table', 'species_identification_key']
    }
  ];

  // 11 Categorized Biological Model & Specimen Library
  const SPECIMEN_CATEGORIES = [
    {
      id: 'cat_cells',
      title: '1. Cell Types & Cytology',
      icon: 'fa-circle-nodes',
      items: [
        { name: 'Plant Mesophyll Cell', type: 'plant_cell', dims: '75 μm × 45 μm', cat: 'Cytology' },
        { name: 'Animal Cheek Epithelial Cell', type: 'animal_cell', dims: '30 μm diam', cat: 'Cytology' },
        { name: 'Bacterial Bacillus Cell', type: 'bacterium', dims: '3 μm × 1 μm', cat: 'Prokaryotes' },
        { name: 'Human Erythrocyte (RBC)', type: 'erythrocyte', dims: '7.5 μm biconcave', cat: 'Hematology' },
        { name: 'Multipolar Motor Neuron', type: 'neuron', dims: '100 μm soma', cat: 'Neurology' }
      ]
    },
    {
      id: 'cat_plants',
      title: '2. Plant Anatomy & Botany',
      icon: 'fa-leaf',
      items: [
        { name: 'Dicotyledonous Leaf T.S.', type: 'leaf_ts', dims: '350 μm thick', cat: 'Botany' },
        { name: 'Dicot Stem Cross-Section', type: 'stem_ts', dims: '2.5 mm diam', cat: 'Botany' },
        { name: 'Stomatal Complex (Guard Cells)', type: 'stoma', dims: '35 μm', cat: 'Botany' },
        { name: 'Root Hair Water Uptake Zone', type: 'root_hair', dims: '1.2 mm', cat: 'Botany' }
      ]
    },
    {
      id: 'cat_human_anatomy',
      title: '3. Human Anatomy & Organs',
      icon: 'fa-person',
      items: [
        { name: 'Four-Chambered Human Heart', type: 'human_heart', dims: '12 cm × 8 cm', cat: 'Cardiology' },
        { name: 'Renal Nephron Functional Unit', type: 'nephron', dims: '45 mm length', cat: 'Urology' },
        { name: 'Pulmonary Alveolus Gas Interface', type: 'alveolus', dims: '200 μm diam', cat: 'Pulmonology' },
        { name: 'Reflex Arc Neural Circuit', type: 'reflex_arc', dims: 'System circuit', cat: 'Neurology' }
      ]
    },
    {
      id: 'cat_tissues',
      title: '4. Histological Tissues',
      icon: 'fa-bars',
      items: [
        { name: 'Simple Squamous Epithelium', type: 'tissue_squamous', dims: '10 μm thickness', cat: 'Histology' },
        { name: 'Striated Skeletal Muscle', type: 'tissue_muscle', dims: '50 μm myofiber', cat: 'Histology' },
        { name: 'Haversian Compact Bone', type: 'tissue_bone', dims: '200 μm osteon', cat: 'Histology' },
        { name: 'Xylem Vessel & Tracheids', type: 'tissue_xylem', dims: '80 μm lumen', cat: 'Plant Histology' }
      ]
    },
    {
      id: 'cat_microorganisms',
      title: '5. Microorganisms & Viruses',
      icon: 'fa-bacterium',
      items: [
        { name: 'Escherichia Coli (Bacterium)', type: 'e_coli', dims: '2 μm × 0.5 μm', cat: 'Bacteriology' },
        { name: 'Bacteriophage T4 Virion', type: 'bacteriophage', dims: '200 nm', cat: 'Virology' },
        { name: 'Paramecium Caudatum', type: 'paramecium', dims: '200 μm', cat: 'Protozoology' },
        { name: 'Spirogyra Algae Ribbon', type: 'spirogyra', dims: '50 μm width', cat: 'Phycology' }
      ]
    },
    {
      id: 'cat_organ_systems',
      title: '6. Organ Systems & Physiology',
      icon: 'fa-heart-pulse',
      items: [
        { name: 'Systemic & Pulmonary Circulation', type: 'circulatory_loop', dims: 'Full loop', cat: 'Physiology' },
        { name: 'Alimentary Digestive Tract', type: 'digestive_tract', dims: '9 m tract', cat: 'Gastroenterology' },
        { name: 'Intestinal Villus Nutrient Unit', type: 'villus', dims: '1 mm length', cat: 'Physiology' }
      ]
    },
    {
      id: 'cat_molecules',
      title: '7. Biological Molecules & DNA',
      icon: 'fa-dna',
      items: [
        { name: 'DNA Double Helix (B-DNA)', type: 'dna_strand', dims: '2.0 nm diam', cat: 'Genetics' },
        { name: 'Enzyme-Substrate Active Site', type: 'enzyme_site', dims: '5.0 nm pocket', cat: 'Biochemistry' },
        { name: 'ATP Energy Storage Molecule', type: 'atp_molecule', dims: '1.4 nm', cat: 'Biochemistry' }
      ]
    },
    {
      id: 'cat_ecosystems',
      title: '8. Ecology & Food Webs',
      icon: 'fa-tree',
      items: [
        { name: 'Savanna Grassland Food Web', type: 'food_web', dims: 'Trophic network', cat: 'Ecology' },
        { name: 'Trophic Energy Pyramid (10% Rule)', type: 'energy_pyramid', dims: '4 Trophic Levels', cat: 'Ecology' },
        { name: 'Carbon Biogeochemical Cycle', type: 'carbon_cycle', dims: 'Global reservoir', cat: 'Ecology' }
      ]
    },
    {
      id: 'cat_genetics',
      title: '9. Genetics & Inheritance',
      icon: 'fa-sitemap',
      items: [
        { name: 'Monohybrid Punnett Grid', type: 'punnett_mono', dims: '2 × 2 Matrix', cat: 'Genetics' },
        { name: 'Dihybrid 16-Cell Matrix', type: 'punnett_di', dims: '4 × 4 Matrix', cat: 'Genetics' },
        { name: 'Family Pedigree Chart', type: 'pedigree_tree', dims: '3 Generations', cat: 'Genetics' }
      ]
    },
    {
      id: 'cat_animals',
      title: '10. Animal Morphology & Dissection',
      icon: 'fa-paw',
      items: [
        { name: 'Dissected Mammalian Heart', type: 'dissected_heart', dims: '12 cm', cat: 'Comparative Anatomy' },
        { name: 'Dissected Frog Viscera', type: 'dissected_frog', dims: '8 cm torso', cat: 'Comparative Anatomy' },
        { name: 'Earthworm Lumbricus T.S.', type: 'earthworm_ts', dims: '6 mm diam', cat: 'Invertebrates' }
      ]
    },
    {
      id: 'cat_apparatus',
      title: '11. Laboratory Apparatus',
      icon: 'fa-flask-vial',
      items: [
        { name: 'Compound Optical Microscope', type: 'microscope_tool', dims: 'Bench apparatus', cat: 'Equipment' },
        { name: 'Capillary Bubble Potometer', type: 'potometer_tool', dims: '20 cm graduated', cat: 'Equipment' },
        { name: 'U-Tube Respirometer', type: 'respirometer_tool', dims: 'Manometer tube', cat: 'Equipment' },
        { name: 'Mueller-Hinton Agar Petri Dish', type: 'petri_plate', dims: '90 mm sterile plate', cat: 'Microbiology' }
      ]
    }
  ];

  // DOM Elements
  const topicsListEl = document.getElementById('bio-topics-list');
  const searchTopicsInput = document.getElementById('bio-search-topics');
  const searchApparatusInput = document.getElementById('bio-search-apparatus');
  const apparatusTreeEl = document.getElementById('bio-apparatus-tree');
  const inspectorTitleEl = document.getElementById('bio-inspector-title');
  const inspectorSubtitleEl = document.getElementById('bio-inspector-subtitle');
  const hudPrimaryValEl = document.getElementById('bio-hud-primary-val');
  const hudSecondaryValEl = document.getElementById('bio-hud-secondary-val');
  const hudTertiaryValEl = document.getElementById('bio-hud-tertiary-val');
  const hudPrimaryLabelEl = document.getElementById('bio-hud-primary-label');
  const hudSecondaryLabelEl = document.getElementById('bio-hud-secondary-label');
  const hudTertiaryLabelEl = document.getElementById('bio-hud-tertiary-label');
  const equationsContainerEl = document.getElementById('bio-equations-container');
  const dataTableBody = document.getElementById('bio-table-body');
  const btnRecordReading = document.getElementById('btn-bio-record-reading');
  const btnClearData = document.getElementById('btn-bio-clear-data');
  const btnSaveExperiment = document.getElementById('btn-bio-save-experiment');
  const canvas2d = document.getElementById('bio-main-canvas');
  const container3d = document.getElementById('bio-3d-container');
  const guidePane = document.getElementById('bio-guide-pane');
  const cbtPane = document.getElementById('bio-cbt-pane');
  const btnCloseGuide = document.getElementById('btn-close-bio-guide');
  const btnCloseCbt = document.getElementById('btn-close-bio-cbt');
  const sliderPeel = document.getElementById('slider-dissection-peel');
  const inspectorObjName = document.getElementById('inspector-obj-name');
  const inspectorObjDim = document.getElementById('inspector-obj-dim');
  const inspectorObjLayer = document.getElementById('inspector-obj-layer');
  const select3DModel = document.getElementById('select-3d-model');

  let ctx = canvas2d ? canvas2d.getContext('2d') : null;

  // 1. Resize Canvas Handler
  function resizeCanvas() {
    if (!canvas2d) return;
    const rect = canvas2d.parentElement.getBoundingClientRect();
    canvas2d.width = rect.width;
    canvas2d.height = rect.height;
    renderCanvas2D();
  }
  window.addEventListener('resize', resizeCanvas);

  // 2. Fetch & Populate Curriculum Topics
  async function loadCurriculumTopics() {
    try {
      const res = await fetch('/api/biology/topics');
      const data = await res.json();
      if (data.success && data.topics) {
        state.topics = data.topics;
        renderTopicsList(state.topics);
        if (state.topics.length > 0) {
          selectTopic(state.topics[2].code); // Default to 'cell-biology'
        }
      }
    } catch (err) {
      console.warn('Failed to load biology curriculum topics:', err);
    }
  }

  function renderTopicsList(topics) {
    if (!topicsListEl) return;
    topicsListEl.innerHTML = '';

    topics.forEach((t) => {
      const item = document.createElement('div');
      item.className = `bio-topic-item ${state.activeTopic && state.activeTopic.code === t.code ? 'active' : ''}`;
      item.dataset.code = t.code;
      item.innerHTML = `
        <div class="bio-topic-icon">
          <i class="fa-solid ${t.icon || 'fa-dna'}"></i>
        </div>
        <div class="flex-grow-1 overflow-hidden">
          <div class="bio-topic-title text-truncate">${t.title}</div>
          <span class="bio-topic-branch">${t.branch || 'Biology'}</span>
        </div>
      `;
      item.addEventListener('click', () => selectTopic(t.code));
      topicsListEl.appendChild(item);
    });
  }

  // 3. Render Categorized Apparatus & Specimen Tree (Pane 2)
  function renderApparatusTree(filterQuery = '') {
    if (!apparatusTreeEl) return;
    apparatusTreeEl.innerHTML = '';
    const q = filterQuery.toLowerCase().trim();

    SPECIMEN_CATEGORIES.forEach((cat) => {
      const matchingItems = cat.items.filter((it) => 
        it.name.toLowerCase().includes(q) || 
        it.cat.toLowerCase().includes(q) ||
        (it.dims && it.dims.toLowerCase().includes(q))
      );
      if (q && matchingItems.length === 0) return;

      const catBox = document.createElement('div');
      catBox.className = 'bio-apparatus-cat';

      const header = document.createElement('div');
      header.className = 'bio-apparatus-cat-header';
      header.innerHTML = `
        <span><i class="fa-solid ${cat.icon} me-1 text-success"></i> ${cat.title} ${q ? `<span class="badge bg-success-subtle text-success ms-1">${matchingItems.length}</span>` : ''}</span>
        <i class="fa-solid fa-chevron-${q ? 'up' : 'down'} small text-muted"></i>
      `;

      const list = document.createElement('div');
      list.className = 'bio-apparatus-list';
      if (q) list.style.display = 'block';

      matchingItems.forEach((item) => {
        const row = document.createElement('div');
        row.className = 'bio-apparatus-item';
        row.innerHTML = `
          <div>
            <span class="fw-semibold">${item.name}</span>
            <small class="text-muted d-block" style="font-size:10px;">${item.dims}</small>
          </div>
          <button class="btn btn-xs btn-outline-success py-0 px-1" title="Add to Canvas">
            <i class="fa-solid fa-plus"></i> Add
          </button>
        `;
        row.addEventListener('click', () => spawnCanvasObject(item));
        list.appendChild(row);
      });

      header.addEventListener('click', () => {
        list.style.display = list.style.display === 'none' ? 'block' : 'none';
      });

      catBox.appendChild(header);
      catBox.appendChild(list);
      apparatusTreeEl.appendChild(catBox);
    });
  }

  if (searchApparatusInput) {
    searchApparatusInput.addEventListener('input', (e) => {
      renderApparatusTree(e.target.value);
    });
  }

  // 4. Spawn Biological Specimen onto 2D Canvas
  function spawnCanvasObject(item) {
    pushUndoState();
    const newId = `obj_${Date.now()}`;
    const newObj = {
      id: newId,
      name: item.name,
      category: item.cat || 'Specimen',
      type: item.type || 'plant_cell',
      x: canvas2d ? canvas2d.width / 2 + (Math.random() * 40 - 20) : 400,
      y: canvas2d ? canvas2d.height / 2 + (Math.random() * 40 - 20) : 260,
      width: 280,
      height: 200,
      rotation: 0,
      scale: 1.0,
      dimensions: item.dims || 'Standard SI',
      layerLevel: 1,
      selected: true,
      labels: []
    };

    // Deselect other objects
    canvasObjects.forEach((o) => (o.selected = false));
    canvasObjects.push(newObj);
    state.selectedObjectId = newId;

    updateInspectorForSelectedObject(newObj);
    renderCanvas2D();
  }

  // 5. Select Topic & Update Inspector
  async function selectTopic(code) {
    try {
      const res = await fetch(`/api/biology/topics/${code}`);
      const data = await res.json();
      if (!data.success || !data.topic) return;

      const topic = data.topic;
      state.activeTopic = topic;

      document.querySelectorAll('.bio-topic-item').forEach((el) => {
        el.classList.toggle('active', el.dataset.code === code);
      });

      if (inspectorTitleEl) {
        inspectorTitleEl.innerHTML = `<i class="fa-solid ${topic.icon || 'fa-dna'} text-success me-2"></i> ${topic.title}`;
      }
      if (inspectorSubtitleEl) {
        inspectorSubtitleEl.textContent = `${topic.branch} • ${topic.category}`;
      }

      updateHudForTopic(topic);
      renderTopicConcepts(topic);
      updateGraphingLabLink(topic);

      // Align default canvas scene if appropriate
      syncCanvasSceneToTopic(code);
      renderCanvas2D();
    } catch (err) {
      console.warn('Error fetching topic detail:', err);
    }
  }

  function syncCanvasSceneToTopic(code) {
    const cx = canvas2d ? canvas2d.width / 2 : 400;
    const cy = canvas2d ? canvas2d.height / 2 : 260;

    if (code === 'intro-biology') {
      canvasObjects = [{
        id: 'mrs_gren_1',
        name: 'MRS GREN Life Characteristics Board',
        category: 'Foundations of Biology',
        type: 'mrs_gren',
        x: cx, y: cy, width: 440, height: 260, rotation: 0, scale: 1.0,
        dimensions: '7 Universal Biological Criteria', layerLevel: 1, selected: true,
        labels: [
          { text: 'Movement & Locomotion', relX: -140, relY: -90 },
          { text: 'Respiration & ATP Release', relX: 0, relY: -90 },
          { text: 'Sensitivity & Receptors', relX: 140, relY: -90 },
          { text: 'Growth & Mitosis', relX: -140, relY: 10 },
          { text: 'Reproduction (DNA replication)', relX: 140, relY: 10 },
          { text: 'Excretion of Toxic Metabolites', relX: -90, relY: 85 },
          { text: 'Nutrition & Biosynthesis', relX: 90, relY: 85 }
        ]
      }];
    } else if (code === 'laboratory-apparatus') {
      canvasObjects = [{
        id: 'lab_bench_1',
        name: 'Biology Laboratory Preparation Bench',
        category: 'Equipment & Techniques',
        type: 'lab_apparatus_bench',
        x: cx, y: cy, width: 480, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Standard Lab Workbench Unit', layerLevel: 1, selected: true,
        labels: [
          { text: 'Petri Dish & Nutrient Agar', relX: -160, relY: -60 },
          { text: 'Glass Slide & Cover Slip', relX: -30, relY: -60 },
          { text: 'Mounted Dissecting Needles', relX: 120, relY: -60 },
          { text: 'Fine Stainless Forceps', relX: -120, relY: 50 },
          { text: 'Dropping Bottle (Iodine/Methylene Blue)', relX: 80, relY: 50 }
        ]
      }];
    } else if (code === 'microscopy') {
      canvasObjects = [{
        id: 'microscope_view_1',
        name: 'Compound Microscope Optical Field (400×)',
        category: 'Cytology',
        type: 'microscope_field',
        x: cx, y: cy, width: 320, height: 320, rotation: 0, scale: 1.0,
        dimensions: 'FOV: 450 μm diameter (40× Obj)', layerLevel: 1, selected: true,
        labels: [
          { text: 'Field of View Boundary', relX: 0, relY: -130 },
          { text: 'Calibrated Eyepiece Graticule', relX: 0, relY: -20 },
          { text: 'Onion Epidermal Cell', relX: -60, relY: 40 },
          { text: 'Nucleus stained with Iodine', relX: 40, relY: 50 }
        ]
      }];
    } else if (code === 'classification') {
      canvasObjects = [{
        id: 'taxonomic_key_1',
        name: 'Dichotomous Taxonomic Classification Key',
        category: 'Taxonomy',
        type: 'taxonomic_key',
        x: cx, y: cy, width: 460, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Linnaean Hierarchy: Kingdom to Species', layerLevel: 1, selected: true,
        labels: [
          { text: '1a. Organism with vascular tissue', relX: -140, relY: -80 },
          { text: '1b. Non-vascular organism (Bryophyta)', relX: 140, relY: -80 },
          { text: '2a. Seeds enclosed in fruit (Angiosperms)', relX: -120, relY: 0 },
          { text: '2b. Naked seeds on cones (Gymnosperms)', relX: 120, relY: 0 },
          { text: '3a. Monocotyledonae vs 3b. Dicotyledonae', relX: 0, relY: 75 }
        ]
      }];
    } else if (code === 'animal-biology') {
      canvasObjects = [{
        id: 'striated_muscle_1',
        name: 'Striated Skeletal Muscle Histology',
        category: 'Zoology',
        type: 'muscle_histology',
        x: cx, y: cy, width: 420, height: 220, rotation: 0, scale: 1.0,
        dimensions: 'Sarcomere Unit: 2.5 μm', layerLevel: 1, selected: true,
        labels: [
          { text: 'Multinucleated Peripheral Nuclei', relX: -120, relY: -65 },
          { text: 'A-Bands (Dark Myosin Filaments)', relX: -20, relY: -20 },
          { text: 'I-Bands (Light Actin Filaments)', relX: 80, relY: -20 },
          { text: 'Sarcolemma Membrane', relX: 0, relY: 65 }
        ]
      }];
    } else if (code === 'nutrition') {
      canvasObjects = [{
        id: 'food_test_rack_1',
        name: 'Biochemical Qualitative Food Test Rack',
        category: 'Physiology & Biochemistry',
        type: 'biochemical_rack',
        x: cx, y: cy, width: 460, height: 240, rotation: 0, scale: 1.0,
        dimensions: 'Standard 4-Tube Test Rack', layerLevel: 1, selected: true,
        labels: [
          { text: 'Benedict’s: Brick-red ppt (Glucose)', relX: -140, relY: -90 },
          { text: 'Biuret: Violet/Purple (Peptide bonds)', relX: -45, relY: -90 },
          { text: 'Iodine: Blue-black complex (Starch)', relX: 45, relY: -90 },
          { text: 'Ethanol: Cloudy white emulsion (Lipids)', relX: 140, relY: -90 }
        ]
      }];
    } else if (code === 'respiration') {
      canvasObjects = [{
        id: 'respirometer_1',
        name: 'Simple Respirometer Apparatus',
        category: 'Physiology & Biochemistry',
        type: 'respirometer',
        x: cx, y: cy, width: 440, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Closed Manometer System', layerLevel: 1, selected: true,
        labels: [
          { text: 'Germinating Pea Seeds (Aerobic O2 consumption)', relX: -120, relY: -50 },
          { text: 'Potassium Hydroxide (KOH) Pellets (absorbs CO2)', relX: -120, relY: 60 },
          { text: 'Capillary Tube with Calibrated Scale', relX: 40, relY: -20 },
          { text: 'Colored Water Manometer Meniscus', relX: 140, relY: 40 }
        ]
      }];
    } else if (code === 'photosynthesis') {
      canvasObjects = [{
        id: 'elodea_photosyn_1',
        name: 'Elodea Photosynthetic Oxygen Evolution Unit',
        category: 'Botany',
        type: 'elodea_photosyn',
        x: cx, y: cy, width: 440, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Graduated Boiling Tube & Funnel', layerLevel: 1, selected: true,
        labels: [
          { text: 'Test Tube Collecting Oxygen Gas (O2)', relX: 0, relY: -95 },
          { text: 'Inverted Glass Funnel', relX: -80, relY: -10 },
          { text: 'Elodea canadensis Shoots in NaHCO3', relX: 0, relY: 45 },
          { text: 'Adjustable Light Source (Lux)', relX: 150, relY: -30 }
        ]
      }];
    } else if (code === 'plant-biology') {
      canvasObjects = [{
        id: 'leaf_1',
        name: 'Dicotyledonous Leaf T.S.',
        category: 'Botany',
        type: 'leaf_ts',
        x: cx, y: cy, width: 480, height: 200, rotation: 0, scale: 1.0,
        dimensions: '350 μm thickness', layerLevel: 1, selected: true,
        labels: [
          { text: 'Upper Epidermis (Waxy Cuticle)', relX: -120, relY: -70 },
          { text: 'Palisade Mesophyll (Chloroplasts)', relX: 0, relY: -30 },
          { text: 'Spongy Mesophyll & Air Spaces', relX: 80, relY: 10 },
          { text: 'Stomatal Pore & Guard Cells', relX: -60, relY: 60 }
        ]
      }];
    } else if (code === 'transport-systems') {
      canvasObjects = [{
        id: 'potometer_1',
        name: 'Ganong’s Bubble Potometer (Transpiration)',
        category: 'Physiology & Biochemistry',
        type: 'potometer',
        x: cx, y: cy, width: 460, height: 250, rotation: 0, scale: 1.0,
        dimensions: 'Capillary Bore 1.0 mm', layerLevel: 1, selected: true,
        labels: [
          { text: 'Cut Leafy Shoot in Airtight Rubber Bung', relX: -140, relY: -70 },
          { text: 'Water Reservoir with Tap for Resetting', relX: -30, relY: -40 },
          { text: 'Graduated Capillary Tube with Air Bubble', relX: 50, relY: 40 },
          { text: 'Beaker of Water for Capillary Uptake', relX: 150, relY: 70 }
        ]
      }];
    } else if (code === 'human-anatomy') {
      canvasObjects = [{
        id: 'heart_1',
        name: 'Human Heart (Cardiovascular)',
        category: 'Human Anatomy',
        type: 'human_heart',
        x: cx, y: cy, width: 280, height: 280, rotation: 0, scale: 1.0,
        dimensions: '12 cm × 8 cm', layerLevel: 1, selected: true,
        labels: [
          { text: 'Aorta & Pulmonary Artery', relX: 0, relY: -110 },
          { text: 'Right Atrium (Deoxygenated)', relX: -80, relY: -40 },
          { text: 'Left Ventricle (Thick Myocardium)', relX: 60, relY: 50 },
          { text: 'Interventricular Septum', relX: 0, relY: 10 }
        ]
      }];
    } else if (code === 'excretion') {
      canvasObjects = [{
        id: 'nephron_1',
        name: 'Renal Nephron Unit',
        category: 'Human Anatomy',
        type: 'nephron',
        x: cx, y: cy, width: 340, height: 280, rotation: 0, scale: 1.0,
        dimensions: '45 mm total length', layerLevel: 1, selected: true,
        labels: [
          { text: 'Bowman’s Capsule & Glomerulus', relX: -120, relY: -40 },
          { text: 'Loop of Henle (Countercurrent Multiplier)', relX: 30, relY: 90 },
          { text: 'Collecting Duct (ADH sensitive)', relX: 120, relY: 30 }
        ]
      }];
    } else if (code === 'coordination') {
      canvasObjects = [{
        id: 'reflex_arc_1',
        name: 'Sensory-Motor Spinal Reflex Arc',
        category: 'Physiology & Biochemistry',
        type: 'reflex_arc',
        x: cx, y: cy, width: 460, height: 240, rotation: 0, scale: 1.0,
        dimensions: 'Spinal Cord Transverse Section', layerLevel: 1, selected: true,
        labels: [
          { text: 'Receptor (Pain/Heat Sensors in Skin)', relX: -160, relY: 60 },
          { text: 'Afferent Sensory Neuron (Dorsal Root)', relX: -80, relY: -50 },
          { text: 'Spinal Grey Matter & Relay Interneuron', relX: 30, relY: -40 },
          { text: 'Efferent Motor Neuron to Biceps Effector', relX: 120, relY: 50 }
        ]
      }];
    } else if (code === 'reproduction') {
      canvasObjects = [{
        id: 'flower_anatomy_1',
        name: 'Dissected Angiosperm Flower Morphology',
        category: 'Genetics & Development',
        type: 'flower_anatomy',
        x: cx, y: cy, width: 420, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Bisexual Flower Model', layerLevel: 1, selected: true,
        labels: [
          { text: 'Stamen: Anther (Pollen) & Filament', relX: -130, relY: -50 },
          { text: 'Carpel: Stigma, Style & Ovary', relX: 0, relY: -70 },
          { text: 'Petal (Corolla) Attracting Pollinators', relX: 120, relY: -40 },
          { text: 'Ovule inside Ovary Wall (Embryo Sac)', relX: 0, relY: 40 }
        ]
      }];
    } else if (code === 'growth-development') {
      canvasObjects = [{
        id: 'germination_1',
        name: 'Seed Germination & Sigmoid Growth Chamber',
        category: 'Genetics & Development',
        type: 'germination_growth',
        x: cx, y: cy, width: 460, height: 240, rotation: 0, scale: 1.0,
        dimensions: 'Epigeal / Hypogeal Development', layerLevel: 1, selected: true,
        labels: [
          { text: 'Seed Coat (Testa) & Micropyle', relX: -140, relY: 40 },
          { text: 'Radicle forming Primary Root', relX: -80, relY: 70 },
          { text: 'Hypocotyl Arch Emerging', relX: 0, relY: -20 },
          { text: 'Cotyledons & First Foliage Leaves', relX: 110, relY: -60 }
        ]
      }];
    } else if (code === 'genetics') {
      canvasObjects = [{
        id: 'punnett_1',
        name: 'Mendelian Monohybrid Punnett Square Board',
        category: 'Genetics & Development',
        type: 'punnett_square',
        x: cx, y: cy, width: 340, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Monohybrid Cross Aa × Aa', layerLevel: 1, selected: true,
        labels: [
          { text: 'Maternal Gametes: A and a', relX: 0, relY: -110 },
          { text: 'Paternal Gametes: A and a', relX: -140, relY: 0 },
          { text: 'Offspring Genotypes: 1 AA : 2 Aa : 1 aa', relX: 0, relY: 110 }
        ]
      }];
    } else if (code === 'evolution') {
      canvasObjects = [{
        id: 'melanism_1',
        name: 'Natural Selection Industrial Melanism Simulator',
        category: 'Evolutionary Biology',
        type: 'industrial_melanism',
        x: cx, y: cy, width: 440, height: 240, rotation: 0, scale: 1.0,
        dimensions: 'Biston betularia Phenotypic Frequencies', layerLevel: 1, selected: true,
        labels: [
          { text: 'Lichen-Covered Birch Trunk (Unpolluted)', relX: -110, relY: -80 },
          { text: 'Soot-Covered Industrial Trunk (Polluted)', relX: 110, relY: -80 },
          { text: 'Typical Light Morph (Camouflaged vs Predated)', relX: -110, relY: 60 },
          { text: 'Carbonaria Dark Morph (High Selective Advantage)', relX: 110, relY: 60 }
        ]
      }];
    } else if (code === 'ecology') {
      canvasObjects = [{
        id: 'food_web_1',
        name: 'Savanna Grassland Food Web',
        category: 'Ecology',
        type: 'food_web',
        x: cx, y: cy, width: 460, height: 300, rotation: 0, scale: 1.0,
        dimensions: 'Ecosystem Trophic Web', layerLevel: 1, selected: true,
        labels: [
          { text: 'Producers: Acacia & Grasses (10,000 kJ)', relX: 0, relY: 100 },
          { text: 'Primary Consumers: Zebra, Gazelle (1,000 kJ)', relX: -80, relY: 0 },
          { text: 'Secondary Consumers: Hyena, Wild Dog (100 kJ)', relX: 80, relY: 0 },
          { text: 'Apex Predator: Lion (10 kJ)', relX: 0, relY: -90 }
        ]
      }];
    } else if (code === 'microbiology') {
      canvasObjects = [{
        id: 'kirby_bauer_1',
        name: 'Kirby-Bauer Antibiotic Sensitivity Assay',
        category: 'Microbiology & Health',
        type: 'kirby_bauer_assay',
        x: cx, y: cy, width: 320, height: 320, rotation: 0, scale: 1.0,
        dimensions: 'Mueller-Hinton Agar Petri Plate', layerLevel: 1, selected: true,
        labels: [
          { text: 'Antibiotic Disk A (Amoxicillin: 28mm Susceptible)', relX: -60, relY: -60 },
          { text: 'Antibiotic Disk B (Tetracycline: 12mm Resistant)', relX: 60, relY: -60 },
          { text: 'Antibiotic Disk C (Ciprofloxacin: 32mm Susceptible)', relX: 0, relY: 60 },
          { text: 'Zone of Inhibition (No Bacterial Growth)', relX: 0, relY: -130 }
        ]
      }];
    } else if (code === 'immunology') {
      canvasObjects = [{
        id: 'immunology_1',
        name: 'Phagocytosis & Antibody-Antigen Complex',
        category: 'Microbiology & Health',
        type: 'immunology_model',
        x: cx, y: cy, width: 440, height: 240, rotation: 0, scale: 1.0,
        dimensions: 'Innate & Adaptive Immune Defenses', layerLevel: 1, selected: true,
        labels: [
          { text: 'Macrophage Pseudopodia Engulfing Pathogen', relX: -110, relY: -50 },
          { text: 'Phagolysosome with Lysozyme Enzymes', relX: -110, relY: 45 },
          { text: 'Y-Shaped Immunoglobulin IgG Antibody', relX: 110, relY: -50 },
          { text: 'Antigen Epitope Lock-and-Key Binding', relX: 110, relY: 45 }
        ]
      }];
    } else if (code === 'biotechnology') {
      canvasObjects = [{
        id: 'electrophoresis_1',
        name: 'Agarose Gel Electrophoresis DNA Tank',
        category: 'Cellular & Molecular',
        type: 'electrophoresis_tank',
        x: cx, y: cy, width: 440, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Horizontal Submerged Gel Bed', layerLevel: 1, selected: true,
        labels: [
          { text: 'Cathode (-) Well Loading End', relX: -140, relY: -90 },
          { text: 'Anode (+) DNA Migration Direction', relX: 140, relY: -90 },
          { text: 'DNA Molecular Weight Ladder (kb)', relX: -130, relY: 20 },
          { text: 'Recombinant Restriction Digest Bands', relX: 50, relY: 20 }
        ]
      }];
    } else if (code === 'homeostasis') {
      canvasObjects = [{
        id: 'homeostasis_1',
        name: 'Negative Feedback Blood Glucose Controller',
        category: 'Physiology & Biochemistry',
        type: 'homeostasis_loop',
        x: cx, y: cy, width: 460, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Set Point: 5.0 mmol/L (90 mg/dL)', layerLevel: 1, selected: true,
        labels: [
          { text: 'High Blood Sugar -> Beta Cells -> Insulin', relX: 0, relY: -90 },
          { text: 'Liver Glycogenesis (Glucose -> Glycogen)', relX: 140, relY: 0 },
          { text: 'Low Blood Sugar -> Alpha Cells -> Glucagon', relX: 0, relY: 90 },
          { text: 'Liver Glycogenolysis (Glycogen -> Glucose)', relX: -140, relY: 0 }
        ]
      }];
    } else if (code === 'environmental-biology') {
      canvasObjects = [{
        id: 'eutrophication_1',
        name: 'Freshwater Eutrophication Lake Transect',
        category: 'Ecology & Environment',
        type: 'eutrophication_lake',
        x: cx, y: cy, width: 460, height: 240, rotation: 0, scale: 1.0,
        dimensions: 'Aquatic Ecosystem Profile', layerLevel: 1, selected: true,
        labels: [
          { text: 'Agricultural Runoff (Nitrates & Phosphates)', relX: -140, relY: -80 },
          { text: 'Surface Algal Bloom Blocking Sunlight', relX: 0, relY: -45 },
          { text: 'Bacterial Decomposition & High BOD', relX: 0, relY: 30 },
          { text: 'Anoxic Zone & Fish Asphyxiation', relX: 120, relY: 60 }
        ]
      }];
    } else if (code === 'virtual-experiments') {
      canvasObjects = [{
        id: 'virtual_bench_1',
        name: 'Enzyme Catalysis Virtual Workbench',
        category: 'Laboratory Practicals',
        type: 'virtual_bench',
        x: cx, y: cy, width: 460, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Complete Practical Protocol Unit', layerLevel: 1, selected: true,
        labels: [
          { text: 'Thermostatic Water Bath (20 - 70°C)', relX: -140, relY: -60 },
          { text: 'Hydrogen Peroxide Substrate + Catalase', relX: 0, relY: -40 },
          { text: 'Delivery Tube to Gas Syringe / Bubbler', relX: 130, relY: -60 },
          { text: 'Stop-Clock for Rate of Reaction Measurement', relX: 0, relY: 65 }
        ]
      }];
    } else if (code === 'specimen-library') {
      canvasObjects = [{
        id: 'specimen_shelf_1',
        name: 'Curated Botanical & Histological Specimen Mount',
        category: 'Laboratory Practicals',
        type: 'specimen_herbarium',
        x: cx, y: cy, width: 440, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Museum Grade Preservation Board', layerLevel: 1, selected: true,
        labels: [
          { text: 'Preserved Angiosperm Dicot Herbarium Mount', relX: -90, relY: -40 },
          { text: 'Taxonomic Index Card with Accession No.', relX: -90, relY: 70 },
          { text: 'Stained Histological Slide Preparation', relX: 100, relY: -40 },
          { text: 'Calibrated Metric Specimen Ruler', relX: 100, relY: 70 }
        ]
      }];
    } else if (code === 'graphing-data-analysis') {
      canvasObjects = [{
        id: 'kinetics_graph_1',
        name: 'Enzyme Saturation Kinetics Graph (v vs [S])',
        category: 'Scientific Computing',
        type: 'enzyme_kinetics_graph',
        x: cx, y: cy, width: 440, height: 250, rotation: 0, scale: 1.0,
        dimensions: 'Michaelis-Menten & Lineweaver-Burk', layerLevel: 1, selected: true,
        labels: [
          { text: 'Maximum Velocity Asymptote Vmax', relX: 60, relY: -75 },
          { text: 'Half-Maximal Velocity (1/2 Vmax)', relX: -80, relY: -10 },
          { text: 'Michaelis Constant Km (Substrate Affinity)', relX: -50, relY: 70 },
          { text: 'Zero-Order Kinetics (Enzyme Saturated)', relX: 100, relY: -20 }
        ]
      }];
    } else if (code === 'practical-assessments') {
      canvasObjects = [{
        id: 'cbt_drawing_1',
        name: 'Biological Specimen Drawing Assessment Canvas',
        category: 'Assessment & Examination',
        type: 'cbt_drawing_specimen',
        x: cx, y: cy, width: 440, height: 260, rotation: 0, scale: 1.0,
        dimensions: 'Strict UNEB / Cambridge Biological Drawing Rules', layerLevel: 1, selected: true,
        labels: [
          { text: 'Continuous Clear Outline (No Shading/Feathering)', relX: -110, relY: -80 },
          { text: 'Straight Horizontal Label Lines without Arrowheads', relX: 110, relY: -40 },
          { text: 'Scale Bar & Stated Magnification (e.g. ×1.5)', relX: -110, relY: 80 },
          { text: 'Accurate Proportions and Relative Organelle Sizes', relX: 110, relY: 50 }
        ]
      }];
    } else {
      // Default to plant mesophyll cell
      canvasObjects = [{
        id: 'plant_cell_1',
        name: 'Plant Mesophyll Cell',
        category: 'Cells & Cytology',
        type: 'plant_cell',
        x: cx, y: cy, width: 340, height: 240, rotation: 0, scale: 1.0,
        dimensions: '75 μm × 45 μm', layerLevel: 1, selected: true,
        labels: [
          { text: 'Cellulose Cell Wall', relX: -130, relY: -80 },
          { text: 'Large Central Vacuole', relX: 0, relY: 0 },
          { text: 'Chloroplast (Thylakoids)', relX: 90, relY: -40 },
          { text: 'Nucleus & Nucleolus', relX: -80, relY: 40 }
        ]
      }];
    }
    state.selectedObjectId = canvasObjects[0]?.id || null;
    if (canvasObjects[0]) updateInspectorForSelectedObject(canvasObjects[0]);
  }

  function updateInspectorForSelectedObject(obj) {
    if (!obj) return;
    if (inspectorObjName) inspectorObjName.textContent = obj.name;
    if (inspectorObjDim) inspectorObjDim.textContent = obj.dimensions;
    if (inspectorObjLayer) {
      inspectorObjLayer.textContent = obj.layerLevel === 1 ? 'Intact (Layer 1/3)' : obj.layerLevel === 2 ? 'Dissected (Layer 2/3)' : 'Deep Core (Layer 3/3)';
    }
    if (sliderPeel) sliderPeel.value = obj.layerLevel || 1;
  }

  if (sliderPeel) {
    sliderPeel.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      const selected = canvasObjects.find((o) => o.selected);
      if (selected) {
        selected.layerLevel = val;
        updateInspectorForSelectedObject(selected);
        renderCanvas2D();
      }
    });
  }

  function updateHudForTopic(topic) {
    if (!hudPrimaryLabelEl) return;
    const tempVal = parseFloat(document.getElementById('slider-bio-temp')?.value || 37);
    const substrateVal = parseFloat(document.getElementById('slider-bio-substrate')?.value || 50);

    const c = topic.code;
    if (c === 'nutrition' || c === 'virtual-experiments' || c === 'graphing-data-analysis') {
      hudPrimaryLabelEl.textContent = 'Enzyme Velocity v';
      hudSecondaryLabelEl.textContent = 'Substrate Conc [S]';
      hudTertiaryLabelEl.textContent = 'Michaelis Km';
      hudPrimaryValEl.textContent = `${(50 * Math.exp(-0.5 * Math.pow((tempVal - 37) / 10, 2))).toFixed(1)} μmol/min`;
      hudSecondaryValEl.textContent = `${substrateVal} mM`;
      hudTertiaryValEl.textContent = '5.0 mM';
    } else if (c === 'photosynthesis') {
      hudPrimaryLabelEl.textContent = 'O2 Evolution Rate';
      hudSecondaryLabelEl.textContent = 'Light Intensity';
      hudTertiaryLabelEl.textContent = 'CO2 Available';
      hudPrimaryValEl.textContent = `${Math.round((substrateVal / 100) * 45)} bubbles/min`;
      hudSecondaryValEl.textContent = `${substrateVal * 16} lux`;
      hudTertiaryValEl.textContent = '0.04 %';
    } else if (c === 'respiration') {
      hudPrimaryLabelEl.textContent = 'O2 Uptake Rate';
      hudSecondaryLabelEl.textContent = 'Respirometer Vol';
      hudTertiaryLabelEl.textContent = 'RQ (Vco2 / Vo2)';
      hudPrimaryValEl.textContent = `${(2.4 * (tempVal / 25)).toFixed(2)} cm³/hr`;
      hudSecondaryValEl.textContent = '14.8 mm³';
      hudTertiaryValEl.textContent = '1.00 (Glucose)';
    } else if (c === 'transport-systems') {
      hudPrimaryLabelEl.textContent = 'Transpiration Rate';
      hudSecondaryLabelEl.textContent = 'Water Potential Ψ';
      hudTertiaryLabelEl.textContent = 'Heart Rate (bpm)';
      hudPrimaryValEl.textContent = '2.8 cm³/hr';
      hudSecondaryValEl.textContent = '-0.62 MPa';
      hudTertiaryValEl.textContent = '72 bpm';
    } else if (c === 'genetics') {
      hudPrimaryLabelEl.textContent = 'Dominant Phenotype';
      hudSecondaryLabelEl.textContent = 'Recessive Phenotype';
      hudTertiaryLabelEl.textContent = 'Mendelian Ratio';
      hudPrimaryValEl.textContent = '75 %';
      hudSecondaryValEl.textContent = '25 %';
      hudTertiaryValEl.textContent = '3 : 1';
    } else if (c === 'ecology') {
      hudPrimaryLabelEl.textContent = 'Producer Biomass';
      hudSecondaryLabelEl.textContent = 'Herbivore Energy';
      hudTertiaryLabelEl.textContent = 'Trophic Transfer';
      hudPrimaryValEl.textContent = '10,000 kJ/m²';
      hudSecondaryValEl.textContent = '1,000 kJ/m²';
      hudTertiaryValEl.textContent = '10.0 %';
    } else if (c === 'microscopy') {
      hudPrimaryLabelEl.textContent = 'Total Magnification';
      hudSecondaryLabelEl.textContent = 'Field Diameter';
      hudTertiaryLabelEl.textContent = 'Graticule Unit';
      hudPrimaryValEl.textContent = '400× (10× × 40×)';
      hudSecondaryValEl.textContent = '450 μm';
      hudTertiaryValEl.textContent = '2.5 μm/div';
    } else if (c === 'microbiology') {
      hudPrimaryLabelEl.textContent = 'Colony Forming (CFU)';
      hudSecondaryLabelEl.textContent = 'Inhibition Zone';
      hudTertiaryLabelEl.textContent = 'Susceptibility';
      hudPrimaryValEl.textContent = '1.2 × 10⁸ /mL';
      hudSecondaryValEl.textContent = '28 mm';
      hudTertiaryValEl.textContent = 'Sensitive';
    } else if (c === 'excretion') {
      hudPrimaryLabelEl.textContent = 'Glomerular GFR';
      hudSecondaryLabelEl.textContent = 'Urine Osmolarity';
      hudTertiaryLabelEl.textContent = 'Urea Clearance';
      hudPrimaryValEl.textContent = '125 mL/min';
      hudSecondaryValEl.textContent = '1200 mOsm/L';
      hudTertiaryValEl.textContent = '75 mL/min';
    } else if (c === 'homeostasis') {
      hudPrimaryLabelEl.textContent = 'Blood Glucose';
      hudSecondaryLabelEl.textContent = 'Insulin Secretion';
      hudTertiaryLabelEl.textContent = 'Core Temp';
      hudPrimaryValEl.textContent = '5.0 mmol/L';
      hudSecondaryValEl.textContent = '12 μIU/mL';
      hudTertiaryValEl.textContent = '37.0 °C';
    } else if (c === 'evolution') {
      hudPrimaryLabelEl.textContent = 'Light Morph Freq';
      hudSecondaryLabelEl.textContent = 'Dark Morph Freq';
      hudTertiaryLabelEl.textContent = 'Selective Coeff s';
      hudPrimaryValEl.textContent = '18.4 %';
      hudSecondaryValEl.textContent = '81.6 %';
      hudTertiaryValEl.textContent = '0.32';
    } else if (c === 'biotechnology') {
      hudPrimaryLabelEl.textContent = 'DNA Fragment Size';
      hudSecondaryLabelEl.textContent = 'Gel Concentration';
      hudTertiaryLabelEl.textContent = 'Voltage Applied';
      hudPrimaryValEl.textContent = '1,450 base pairs';
      hudSecondaryValEl.textContent = '1.2 % Agarose';
      hudTertiaryValEl.textContent = '100 V (45 min)';
    } else {
      hudPrimaryLabelEl.textContent = 'Metabolic Rate';
      hudSecondaryLabelEl.textContent = 'Cellular Turgor Ψp';
      hudTertiaryLabelEl.textContent = 'ATP Yield';
      hudPrimaryValEl.textContent = '24.5 μmol/min';
      hudSecondaryValEl.textContent = '+0.45 MPa';
      hudTertiaryValEl.textContent = '38 ATP/glucose';
    }
  }

  function renderTopicConcepts(topic) {
    if (!equationsContainerEl) return;
    equationsContainerEl.innerHTML = '';

    if (topic.keyConcepts && topic.keyConcepts.length > 0) {
      const ul = document.createElement('ul');
      ul.className = 'list-unstyled mb-0';
      topic.keyConcepts.forEach((kc) => {
        const li = document.createElement('li');
        li.className = 'mb-1 text-muted';
        li.innerHTML = `<i class="fa-solid fa-circle-check text-success me-1"></i> ${kc}`;
        ul.appendChild(li);
      });
      equationsContainerEl.appendChild(ul);
    } else {
      equationsContainerEl.innerHTML = '<span class="text-muted">Standard biological principles and models applied.</span>';
    }
  }

  function updateGraphingLabLink(topic) {
    const link = document.getElementById('btn-bio-open-graphing-lab');
    if (!link) return;
    let presetIdx = 0;
    if (topic.code === 'nutrition') presetIdx = 0;
    else if (topic.code === 'growth-development' || topic.code === 'ecology') presetIdx = 1;
    else if (topic.code === 'intro-biology' || topic.code === 'cell-biology') presetIdx = 2;
    link.href = `/graphing-lab.html?subject=BIOLOGY&preset=${presetIdx}`;
  }

  // 6. Search Filter
  if (searchTopicsInput) {
    searchTopicsInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = state.topics.filter(
        (t) => t.title.toLowerCase().includes(q) || t.branch.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      );
      renderTopicsList(filtered);
    });
  }

  // 7. Mode Switcher Pills
  document.querySelectorAll('.bio-mode-pill').forEach((pill) => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.bio-mode-pill').forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      const mode = pill.dataset.mode;
      switchActiveMode(mode);
    });
  });

  function switchActiveMode(mode) {
    state.activeMode = mode;
    if (canvas2d) canvas2d.style.display = mode === 'workspace2d' ? 'block' : 'none';
    if (container3d) container3d.style.display = mode === 'anatomy3d' ? 'block' : 'none';
    if (guidePane) guidePane.style.display = mode === 'guided-labs' ? 'block' : 'none';
    if (cbtPane) cbtPane.style.display = mode === 'assessments' ? 'block' : 'none';

    if (mode === 'anatomy3d') {
      render3DAnatomyView();
    } else if (mode === 'guided-labs') {
      renderGuidedExperimentView();
    } else if (mode === 'assessments') {
      renderCbtPracticalView();
    } else {
      renderCanvas2D();
    }
  }

  if (btnCloseGuide) btnCloseGuide.addEventListener('click', () => switchActiveMode('workspace2d'));
  if (btnCloseCbt) btnCloseCbt.addEventListener('click', () => switchActiveMode('workspace2d'));

  // 8. Dock Tab Switching
  document.querySelectorAll('#bioDockPills [data-dock-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bioDockPills [data-dock-tab]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.dataset.dockTab;
      document.getElementById('pane-dock-table').style.display = tab === 'data-log' ? 'block' : 'none';
      document.getElementById('pane-dock-graph').style.display = tab === 'response-curve' ? 'block' : 'none';
      document.getElementById('pane-dock-lotka').style.display = tab === 'lotka-chart' ? 'block' : 'none';
      if (tab === 'lotka-chart') renderLotkaVolterraMiniChart();
    });
  });

  // 9. Floating Toolbar Handlers
  document.querySelectorAll('.bio-tool-btn[data-tool]').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.bio-tool-btn[data-tool]').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeTool = btn.dataset.tool;

      if (state.activeTool === 'label') {
        state.showLabels = !state.showLabels;
        btn.classList.toggle('active', state.showLabels);
        renderCanvas2D();
      } else if (state.activeTool === 'dissect') {
        const selected = canvasObjects.find((o) => o.selected);
        if (selected) {
          selected.layerLevel = (selected.layerLevel % 3) + 1;
          updateInspectorForSelectedObject(selected);
          renderCanvas2D();
        }
      }
    });
  });

  // Simulation Controls (Play / Pause / Reset)
  const btnStartSim = document.getElementById('btn-bio-start-sim');
  const btnPauseSim = document.getElementById('btn-bio-pause-sim');
  const btnClearCanvas = document.getElementById('btn-bio-clear-canvas');

  let simInterval = null;
  if (btnStartSim) {
    btnStartSim.addEventListener('click', () => {
      if (state.simulationRunning) return;
      state.simulationRunning = true;
      simInterval = setInterval(() => {
        state.simTime += 0.05;
        renderCanvas2D();
      }, 50);
    });
  }

  if (btnPauseSim) {
    btnPauseSim.addEventListener('click', () => {
      state.simulationRunning = false;
      if (simInterval) clearInterval(simInterval);
    });
  }

  if (btnClearCanvas) {
    btnClearCanvas.addEventListener('click', () => {
      pushUndoState();
      canvasObjects = [];
      state.selectedObjectId = null;
      renderCanvas2D();
    });
  }

  // Undo / Redo Stacks
  function pushUndoState() {
    state.undoStack.push(JSON.stringify(canvasObjects));
    if (state.undoStack.length > 20) state.undoStack.shift();
    state.redoStack = [];
  }

  document.getElementById('btn-bio-undo')?.addEventListener('click', () => {
    if (state.undoStack.length > 0) {
      state.redoStack.push(JSON.stringify(canvasObjects));
      canvasObjects = JSON.parse(state.undoStack.pop());
      renderCanvas2D();
    }
  });

  document.getElementById('btn-bio-redo')?.addEventListener('click', () => {
    if (state.redoStack.length > 0) {
      state.undoStack.push(JSON.stringify(canvasObjects));
      canvasObjects = JSON.parse(state.redoStack.pop());
      renderCanvas2D();
    }
  });

  // Export Canvas Image (PNG)
  document.getElementById('btn-bio-export-png')?.addEventListener('click', () => {
    if (!canvas2d) return;
    const link = document.createElement('a');
    link.download = `biology-lab-${Date.now()}.png`;
    link.href = canvas2d.toDataURL('image/png');
    link.click();
  });

  // 10. Canvas 2D Mouse Drag, Selection & Calipers Measurement Interaction
  let isDragging = false;
  let dragTarget = null;
  let dragOffset = { x: 0, y: 0 };

  if (canvas2d) {
    canvas2d.addEventListener('mousedown', (e) => {
      const rect = canvas2d.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (state.activeTool === 'measure') {
        state.caliperStart = { x: mouseX, y: mouseY };
        state.caliperEnd = { x: mouseX, y: mouseY };
        renderCanvas2D();
        return;
      }

      // Check hit on objects
      let hit = null;
      for (let i = canvasObjects.length - 1; i >= 0; i--) {
        const obj = canvasObjects[i];
        if (
          mouseX >= obj.x - obj.width / 2 &&
          mouseX <= obj.x + obj.width / 2 &&
          mouseY >= obj.y - obj.height / 2 &&
          mouseY <= obj.y + obj.height / 2
        ) {
          hit = obj;
          break;
        }
      }

      if (hit) {
        pushUndoState();
        canvasObjects.forEach((o) => (o.selected = o === hit));
        state.selectedObjectId = hit.id;
        dragTarget = hit;
        dragOffset = { x: mouseX - hit.x, y: mouseY - hit.y };
        isDragging = true;
        updateInspectorForSelectedObject(hit);
      } else {
        canvasObjects.forEach((o) => (o.selected = false));
        state.selectedObjectId = null;
      }
      renderCanvas2D();
    });

    canvas2d.addEventListener('mousemove', (e) => {
      const rect = canvas2d.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      if (state.activeTool === 'measure' && state.caliperStart) {
        state.caliperEnd = { x: mouseX, y: mouseY };
        renderCanvas2D();
        return;
      }

      if (isDragging && dragTarget) {
        dragTarget.x = mouseX - dragOffset.x;
        dragTarget.y = mouseY - dragOffset.y;
        renderCanvas2D();
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
      dragTarget = null;
      if (state.activeTool === 'measure' && state.caliperStart && state.caliperEnd) {
        // Leave measurement vector on canvas
      }
    });
  }

  // 11. 2D Interactive Biological Canvas Renderer
  function renderCanvas2D() {
    if (!ctx || !canvas2d) return;
    const w = canvas2d.width;
    const h = canvas2d.height;

    // Background Grid
    ctx.fillStyle = '#FAFAFC';
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Render Canvas Biological Objects
    canvasObjects.forEach((obj) => {
      ctx.save();
      ctx.translate(obj.x, obj.y);
      ctx.rotate(obj.rotation || 0);
      ctx.scale(obj.scale || 1.0, obj.scale || 1.0);

      // Render individual biological types
      if (obj.type === 'human_heart') {
        drawHumanHeartModel(obj);
      } else if (obj.type === 'leaf_ts') {
        drawLeafCrossSectionModel(obj);
      } else if (obj.type === 'nephron') {
        drawNephronModel(obj);
      } else if (obj.type === 'food_web') {
        drawFoodWebModel(obj);
      } else if (obj.type === 'erythrocyte') {
        drawErythrocyteModel(obj);
      } else if (obj.type === 'bacterium') {
        drawBacteriumModel(obj);
      } else if (obj.type === 'mrs_gren') {
        drawMrsGrenModel(obj);
      } else if (obj.type === 'lab_apparatus_bench') {
        drawLabApparatusBench(obj);
      } else if (obj.type === 'microscope_field') {
        drawMicroscopeFieldModel(obj);
      } else if (obj.type === 'taxonomic_key') {
        drawTaxonomicKeyModel(obj);
      } else if (obj.type === 'muscle_histology') {
        drawMuscleHistologyModel(obj);
      } else if (obj.type === 'biochemical_rack') {
        drawBiochemicalTestRack(obj);
      } else if (obj.type === 'respirometer') {
        drawRespirometerModel(obj);
      } else if (obj.type === 'elodea_photosyn') {
        drawElodeaPhotosynthesisModel(obj);
      } else if (obj.type === 'potometer') {
        drawPotometerModel(obj);
      } else if (obj.type === 'reflex_arc') {
        drawReflexArcModel(obj);
      } else if (obj.type === 'flower_anatomy') {
        drawFlowerAnatomyModel(obj);
      } else if (obj.type === 'germination_growth') {
        drawGerminationGrowthModel(obj);
      } else if (obj.type === 'punnett_square') {
        drawPunnettSquareModel(obj);
      } else if (obj.type === 'industrial_melanism') {
        drawIndustrialMelanismModel(obj);
      } else if (obj.type === 'kirby_bauer_assay') {
        drawKirbyBauerAssayModel(obj);
      } else if (obj.type === 'immunology_model') {
        drawImmunologyModel(obj);
      } else if (obj.type === 'electrophoresis_tank') {
        drawElectrophoresisGelModel(obj);
      } else if (obj.type === 'homeostasis_loop') {
        drawHomeostasisFeedbackModel(obj);
      } else if (obj.type === 'eutrophication_lake') {
        drawEutrophicationLakeModel(obj);
      } else if (obj.type === 'virtual_bench') {
        drawVirtualBenchModel(obj);
      } else if (obj.type === 'specimen_herbarium') {
        drawSpecimenHerbariumModel(obj);
      } else if (obj.type === 'enzyme_kinetics_graph') {
        drawEnzymeKineticsGraphModel(obj);
      } else if (obj.type === 'cbt_drawing_specimen') {
        drawPracticalCbtDrawingModel(obj);
      } else {
        drawPlantCellModel(obj);
      }

      // Selection Bounding Box
      if (obj.selected) {
        ctx.strokeStyle = '#10B981';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(-obj.width / 2 - 8, -obj.height / 2 - 8, obj.width + 16, obj.height + 16);
        ctx.setLineDash([]);

        // Resize / Corner handles
        ctx.fillStyle = '#059669';
        const corners = [
          [-obj.width / 2 - 8, -obj.height / 2 - 8],
          [obj.width / 2 + 8, -obj.height / 2 - 8],
          [-obj.width / 2 - 8, obj.height / 2 + 8],
          [obj.width / 2 + 8, obj.height / 2 + 8]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.fillRect(cx - 3, cy - 3, 6, 6);
        });
      }

      // Render Anatomical Callout Labels
      if (state.showLabels && obj.labels && obj.labels.length > 0) {
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#0F172A';
        obj.labels.forEach((lbl) => {
          drawLeaderLabel(0, 0, lbl.relX, lbl.relY, lbl.text);
        });
      }

      ctx.restore();
    });

    // Render Caliper Measurement Vector if active
    if (state.caliperStart && state.caliperEnd) {
      drawCaliperVector(state.caliperStart, state.caliperEnd);
    }
  }

  // Draw Specific Biological Specimen Models

  // Additional Specialized 2D Biological Model Renderers
  function drawMrsGrenModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F8FAFC';
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-w/2, -h/2, w, h, 12);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#1E3A8A';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MRS GREN • Universal Life Characteristics', 0, -h/2 + 25);

    const criteria = [
      { l: 'M', t: 'Movement', c: '#EF4444', x: -140, y: -40 },
      { l: 'R', t: 'Respiration', c: '#F97316', x: 0, y: -40 },
      { l: 'S', t: 'Sensitivity', c: '#EAB308', x: 140, y: -40 },
      { l: 'G', t: 'Growth', c: '#10B981', x: -140, y: 35 },
      { l: 'R', t: 'Reproduction', c: '#06B6D4', x: 0, y: 35 },
      { l: 'E', t: 'Excretion', c: '#8B5CF6', x: 140, y: 35 },
      { l: 'N', t: 'Nutrition', c: '#EC4899', x: 0, y: 95 }
    ];

    criteria.forEach(cr => {
      ctx.fillStyle = cr.c;
      ctx.beginPath();
      ctx.arc(cr.x - 45, cr.y - 4, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(cr.l, cr.x - 45, cr.y);
      ctx.fillStyle = '#1E293B';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(cr.t, cr.x - 25, cr.y);
    });
  }

  function drawLabApparatusBench(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F1F5F9';
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 2;
    ctx.strokeRect(-w/2, -h/2, w, h);
    ctx.fillRect(-w/2, -h/2, w, h);

    // Petri Dish
    ctx.strokeStyle = '#0284C7'; ctx.fillStyle = '#E0F2FE'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-140, 0, 45, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath(); ctx.arc(-140, 0, 38, 0, Math.PI*2); ctx.fill();

    // Glass Slide & Cover Slip
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 2;
    ctx.fillRect(-40, -15, 80, 30); ctx.strokeRect(-40, -15, 80, 30);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(-12, -12, 24, 24); ctx.strokeRect(-12, -12, 24, 24);

    // Dropper Bottle
    ctx.fillStyle = '#B45309'; ctx.fillRect(80, -25, 30, 50);
    ctx.fillStyle = '#1E293B'; ctx.fillRect(90, -40, 10, 15);
    ctx.fillStyle = '#EF4444'; ctx.beginPath(); ctx.arc(95, -42, 6, 0, Math.PI*2); ctx.fill();

    // Forceps
    ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(140, -35); ctx.lineTo(165, 35); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(150, -35); ctx.lineTo(165, 35); ctx.stroke();
  }

  function drawMicroscopeFieldModel(obj) {
    const r = obj.width / 2;
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r - 10, 0, Math.PI * 2); ctx.clip();

    ctx.fillStyle = '#FEF9C3';
    ctx.fillRect(-r, -r, r*2, r*2);

    // Onion epidermal cell outlines
    ctx.strokeStyle = '#CA8A04'; ctx.lineWidth = 2;
    for (let row = -120; row <= 120; row += 50) {
      for (let col = -120; col <= 120; col += 90) {
        ctx.strokeRect(col, row, 85, 45);
        ctx.fillStyle = '#A16207';
        ctx.beginPath(); ctx.arc(col + 45, row + 22, 6, 0, Math.PI*2); ctx.fill();
      }
    }

    // Calibrated Graticule
    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-100, 0); ctx.lineTo(100, 0); ctx.stroke();
    for (let x = -90; x <= 90; x += 10) {
      const tickH = x % 50 === 0 ? 12 : x % 20 === 0 ? 8 : 4;
      ctx.beginPath(); ctx.moveTo(x, -tickH); ctx.lineTo(x, tickH); ctx.stroke();
    }
    ctx.restore();

    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.arc(0, 0, r - 10, 0, Math.PI*2); ctx.stroke();
  }

  function drawTaxonomicKeyModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F0FDF4'; ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-w/2, -h/2, w, h, 10); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#15803D'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Taxonomic Branching Key • Linnaean Hierarchy', 0, -h/2 + 25);

    ctx.strokeStyle = '#4ADE80'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -h/2 + 45); ctx.lineTo(0, -h/2 + 75);
    ctx.lineTo(-120, -h/2 + 105);
    ctx.moveTo(0, -h/2 + 75); ctx.lineTo(120, -h/2 + 105);
    ctx.stroke();

    ctx.fillStyle = '#166534'; ctx.font = '11px sans-serif';
    ctx.fillText('Kingdom Plantae', 0, -h/2 + 40);
    ctx.fillText('Vascular (Tracheophytes)', -120, -h/2 + 120);
    ctx.fillText('Non-Vascular (Bryophytes)', 120, -h/2 + 120);
  }

  function drawMuscleHistologyModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FFF1F2'; ctx.strokeStyle = '#E11D48'; ctx.lineWidth = 2;
    ctx.strokeRect(-w/2, -h/2, w, h); ctx.fillRect(-w/2, -h/2, w, h);

    // Striated bands
    for (let x = -w/2 + 20; x < w/2 - 20; x += 16) {
      ctx.fillStyle = '#FB7185';
      ctx.fillRect(x, -h/2 + 15, 8, h - 30);
    }
    // Nuclei
    ctx.fillStyle = '#881337';
    ctx.beginPath(); ctx.ellipse(-80, -h/2 + 25, 18, 7, 0, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(60, h/2 - 25, 20, 8, 0, 0, Math.PI*2); ctx.fill();
  }

  function drawBiochemicalTestRack(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    const tubes = [
      { name: 'Benedict', col: '#DC2626', label: 'Reducing Sugar (+)' },
      { name: 'Biuret', col: '#9333EA', label: 'Proteins (+)' },
      { name: 'Iodine', col: '#1E1B4B', label: 'Starch (+)' },
      { name: 'Emulsion', col: '#F1F5F9', border: '#94A3B8', label: 'Lipids (+)' }
    ];

    tubes.forEach((t, i) => {
      const tx = -150 + i * 100;
      // Tube glass
      ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 2;
      ctx.fillStyle = t.col;
      ctx.beginPath();
      ctx.roundRect(tx - 15, -60, 30, 110, [0, 0, 15, 15]);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1E293B'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(t.name, tx, -70);
    });
  }

  function drawRespirometerModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Boiling tube chamber
    ctx.fillStyle = '#E0F2FE'; ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(-150, -80, 70, 150, [0, 0, 20, 20]); ctx.fill(); ctx.stroke();

    // Germinating seeds
    ctx.fillStyle = '#15803D';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath(); ctx.ellipse(-125 + (i%2)*20, -30 + i*18, 8, 12, 0.4, 0, Math.PI*2); ctx.fill();
    }
    // KOH basket
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1;
    ctx.fillRect(-145, 45, 60, 15); ctx.strokeRect(-145, 45, 60, 15);

    // Manometer U-tube
    ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-115, -80); ctx.lineTo(-115, -100); ctx.lineTo(60, -100);
    ctx.lineTo(60, 60); ctx.lineTo(100, 60); ctx.lineTo(100, -80);
    ctx.stroke();
  }

  function drawElodeaPhotosynthesisModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F0FDF4'; ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Beaker with water
    ctx.fillStyle = '#E0F2FE'; ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 2;
    ctx.strokeRect(-120, -50, 140, 140); ctx.fillRect(-120, -50, 140, 140);

    // Inverted funnel
    ctx.strokeStyle = '#0369A1'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-110, 80); ctx.lineTo(-50, 0); ctx.lineTo(-50, -70);
    ctx.lineTo(-40, -70); ctx.lineTo(-40, 0); ctx.lineTo(10, 80);
    ctx.stroke();

    // Elodea sprigs
    ctx.strokeStyle = '#15803D'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-60, 75); ctx.lineTo(-50, 20); ctx.stroke();

    // Oxygen bubbles
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 1;
    [[-45, -20], [-46, -45], [-44, -65]].forEach(([bx, by]) => {
      ctx.beginPath(); ctx.arc(bx, by, 4, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    });

    // Lamp
    ctx.fillStyle = '#FBBF24';
    ctx.beginPath(); ctx.arc(120, 0, 25, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#D97706'; ctx.stroke();
  }

  function drawPotometerModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Leafy shoot
    ctx.strokeStyle = '#15803D'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-130, 20); ctx.lineTo(-130, -70); ctx.stroke();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath(); ctx.ellipse(-150, -80, 25, 12, -0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-110, -90, 25, 12, 0.6, 0, Math.PI*2); ctx.fill();

    // Capillary tube with bubble
    ctx.strokeStyle = '#38BDF8'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-130, 20); ctx.lineTo(120, 20); ctx.stroke();
    // Air bubble
    ctx.fillStyle = '#EF4444';
    ctx.beginPath(); ctx.roundRect(10, 17, 16, 6, 3); ctx.fill();
  }

  function drawReflexArcModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#6366F1'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Spinal cord butterfly grey matter
    ctx.fillStyle = '#C7D2FE';
    ctx.beginPath(); ctx.ellipse(40, -10, 50, 40, 0, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#818CF8';
    ctx.beginPath(); ctx.ellipse(40, -10, 30, 20, 0, 0, Math.PI*2); ctx.fill();

    // Sensory neuron
    ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-150, 50); ctx.quadraticCurveTo(-60, -60, 20, -15); ctx.stroke();
    // Motor neuron
    ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(35, 0); ctx.quadraticCurveTo(-30, 40, -140, 80); ctx.stroke();
  }

  function drawFlowerAnatomyModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FEF2F2'; ctx.strokeStyle = '#F43F5E'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Petals
    ctx.fillStyle = '#FDA4AF';
    ctx.beginPath(); ctx.ellipse(-60, -30, 45, 25, -0.6, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(60, -30, 45, 25, 0.6, 0, Math.PI*2); ctx.fill();

    // Ovary / Carpel
    ctx.fillStyle = '#86EFAC'; ctx.strokeStyle = '#15803D'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(-20, 10, 40, 50, 15); ctx.fill(); ctx.stroke();
    // Style & Stigma
    ctx.strokeStyle = '#15803D'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, -50); ctx.stroke();
    ctx.fillStyle = '#F59E0B'; ctx.beginPath(); ctx.arc(0, -52, 8, 0, Math.PI*2); ctx.fill();

    // Stamens (Anther & filament)
    ctx.strokeStyle = '#EAB308'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-15, 25); ctx.lineTo(-45, -45); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, 25); ctx.lineTo(45, -45); ctx.stroke();
    ctx.fillStyle = '#CA8A04';
    ctx.beginPath(); ctx.ellipse(-45, -45, 6, 10, 0.4, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(45, -45, 6, 10, -0.4, 0, Math.PI*2); ctx.fill();
  }

  function drawGerminationGrowthModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F0FDF4'; ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Soil line
    ctx.strokeStyle = '#78350F'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-w/2 + 20, 20); ctx.lineTo(w/2 - 20, 20); ctx.stroke();

    // Seed & radicle
    ctx.fillStyle = '#92400E';
    ctx.beginPath(); ctx.ellipse(-60, 40, 16, 10, 0, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#D97706'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-60, 45); ctx.quadraticCurveTo(-50, 75, -55, 95); ctx.stroke();

    // Plumule shoot & leaves
    ctx.strokeStyle = '#16A34A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(50, 20); ctx.lineTo(50, -45); ctx.stroke();
    ctx.fillStyle = '#22C55E';
    ctx.beginPath(); ctx.ellipse(35, -50, 18, 9, -0.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(65, -50, 18, 9, 0.5, 0, Math.PI*2); ctx.fill();
  }

  function drawPunnettSquareModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    const sx = -60, sy = -40, cw = 70, ch = 55;
    ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 2;
    ctx.strokeRect(sx, sy, cw*2, ch*2);
    ctx.beginPath();
    ctx.moveTo(sx + cw, sy); ctx.lineTo(sx + cw, sy + ch*2);
    ctx.moveTo(sx, sy + ch); ctx.lineTo(sx + cw*2, sy + ch*2);
    ctx.stroke();

    ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = '#1D4ED8';
    ctx.fillText('A', sx + cw/2, sy - 12);
    ctx.fillText('a', sx + cw*1.5, sy - 12);
    ctx.fillText('A', sx - 16, sy + ch/2 + 5);
    ctx.fillText('a', sx - 16, sy + ch*1.5 + 5);

    ctx.fillStyle = '#0F172A';
    ctx.fillText('AA', sx + cw/2, sy + ch/2 + 5);
    ctx.fillText('Aa', sx + cw*1.5, sy + ch/2 + 5);
    ctx.fillText('Aa', sx + cw/2, sy + ch*1.5 + 5);
    ctx.fillText('aa', sx + cw*1.5, sy + ch*1.5 + 5);
  }

  function drawIndustrialMelanismModel(obj) {
    const w = obj.width, h = obj.height;
    // Pale trunk
    ctx.fillStyle = '#E2E8F0'; ctx.fillRect(-w/2, -h/2, w/2, h);
    // Dark trunk
    ctx.fillStyle = '#1E293B'; ctx.fillRect(0, -h/2, w/2, h);

    // Moths
    // Light moth on light trunk (hidden)
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath(); ctx.ellipse(-110, -20, 24, 14, 0, 0, Math.PI*2); ctx.fill();
    // Dark moth on light trunk (visible)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath(); ctx.ellipse(-110, 45, 24, 14, 0, 0, Math.PI*2); ctx.fill();

    // Light moth on dark trunk (visible)
    ctx.fillStyle = '#F8FAFC';
    ctx.beginPath(); ctx.ellipse(110, -20, 24, 14, 0, 0, Math.PI*2); ctx.fill();
    // Dark moth on dark trunk (hidden)
    ctx.fillStyle = '#0F172A';
    ctx.beginPath(); ctx.ellipse(110, 45, 24, 14, 0, 0, Math.PI*2); ctx.fill();
  }

  function drawKirbyBauerAssayModel(obj) {
    const r = obj.width / 2;
    ctx.fillStyle = '#FEF3C7';
    ctx.beginPath(); ctx.arc(0, 0, r - 15, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#D97706'; ctx.lineWidth = 6; ctx.stroke();

    const disks = [
      { x: -55, y: -45, zone: 45, name: 'AMX' },
      { x: 55, y: -45, zone: 20, name: 'TET' },
      { x: 0, y: 50, zone: 52, name: 'CIP' }
    ];

    disks.forEach(d => {
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.zone, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1; ctx.stroke();

      ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#475569';
      ctx.beginPath(); ctx.arc(d.x, d.y, 10, 0, Math.PI*2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0F172A'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(d.name, d.x, d.y + 3);
    });
  }

  function drawImmunologyModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FDF4FF'; ctx.strokeStyle = '#C026D3'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Macrophage with pseudopodia
    ctx.fillStyle = '#E879F9';
    ctx.beginPath();
    ctx.arc(-110, 0, 45, 0, Math.PI*2); ctx.fill();
    // Engulfing bacteria
    ctx.fillStyle = '#15803D';
    ctx.beginPath(); ctx.ellipse(-65, -10, 10, 5, 0.4, 0, Math.PI*2); ctx.fill();

    // Y-shaped Antibodies
    const drawAntibody = (ax, ay) => {
      ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(ax, ay + 20); ctx.lineTo(ax, ay);
      ctx.lineTo(ax - 12, ay - 14);
      ctx.moveTo(ax, ay); ctx.lineTo(ax + 12, ay - 14);
      ctx.stroke();
    };
    drawAntibody(80, -30);
    drawAntibody(120, 20);
  }

  function drawElectrophoresisGelModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#1E1B4B'; ctx.strokeStyle = '#4338CA'; ctx.lineWidth = 3;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Wells
    for (let c = -140; c <= 140; c += 70) {
      ctx.fillStyle = '#0F172A'; ctx.fillRect(c - 15, -h/2 + 20, 30, 10);
    }

    // DNA Bands fluorescing orange/blue
    ctx.fillStyle = '#38BDF8';
    const lanes = [
      [-h/2 + 50, -h/2 + 80, -h/2 + 120, -h/2 + 170, -h/2 + 210],
      [-h/2 + 80, -h/2 + 170],
      [-h/2 + 120, -h/2 + 210],
      [-h/2 + 50, -h/2 + 170],
      [-h/2 + 80, -h/2 + 120]
    ];
    lanes.forEach((bands, li) => {
      const lx = -140 + li * 70;
      bands.forEach(by => {
        ctx.fillRect(lx - 12, by, 24, 4);
      });
    });
  }

  function drawHomeostasisFeedbackModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F8FAFC'; ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Center Set Point
    ctx.fillStyle = '#10B981'; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('5.0 mmol/L', 0, 0); ctx.fillText('SET POINT', 0, 12);

    // High and Low loops
    ctx.strokeStyle = '#EF4444'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(0, -60, 45, Math.PI*0.8, Math.PI*0.2, true); ctx.stroke();
    ctx.fillStyle = '#EF4444'; ctx.fillText('↑ Glucose → Insulin → Glycogen', 0, -80);

    ctx.strokeStyle = '#3B82F6'; ctx.lineWidth = 2; ctx.beginPath();
    ctx.arc(0, 60, 45, Math.PI*0.2, Math.PI*0.8, true); ctx.stroke();
    ctx.fillStyle = '#3B82F6'; ctx.fillText('↓ Glucose → Glucagon → Glucose', 0, 85);
  }

  function drawEutrophicationLakeModel(obj) {
    const w = obj.width, h = obj.height;
    // Water gradient
    ctx.fillStyle = '#065F46'; ctx.fillRect(-w/2, -h/2, w, h);

    // Surface Algal Bloom
    ctx.fillStyle = '#22C55E'; ctx.fillRect(-w/2, -h/2, w, 35);

    // Dead fish / Anoxic seabed
    ctx.fillStyle = '#374151'; ctx.fillRect(-w/2, h/2 - 40, w, 40);
    ctx.fillStyle = '#E5E7EB';
    ctx.beginPath(); ctx.ellipse(-60, h/2 - 20, 16, 7, 0.3, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(70, h/2 - 25, 18, 8, -0.4, 0, Math.PI*2); ctx.fill();
  }

  function drawVirtualBenchModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#F1F5F9'; ctx.strokeStyle = '#475569'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Water bath
    ctx.fillStyle = '#BAE6FD'; ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 3;
    ctx.strokeRect(-160, -40, 120, 90); ctx.fillRect(-160, -40, 120, 90);

    // Gas Syringe
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#64748B'; ctx.lineWidth = 2;
    ctx.strokeRect(20, -20, 140, 30); ctx.fillRect(20, -20, 140, 30);
    ctx.fillStyle = '#EF4444'; ctx.fillRect(70, -18, 10, 26);
  }

  function drawSpecimenHerbariumModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FEFCE8'; ctx.strokeStyle = '#CA8A04'; ctx.lineWidth = 3;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Plant pressed stem & leaves
    ctx.strokeStyle = '#854D0E'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, h/2 - 30); ctx.lineTo(-20, -40); ctx.stroke();
    ctx.fillStyle = '#4D7C0F';
    ctx.beginPath(); ctx.ellipse(-40, -45, 26, 12, -0.7, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(15, -15, 24, 11, 0.6, 0, Math.PI*2); ctx.fill();

    // Museum index card
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#94A3B8'; ctx.lineWidth = 1;
    ctx.fillRect(w/2 - 140, h/2 - 60, 120, 45); ctx.strokeRect(w/2 - 140, h/2 - 60, 120, 45);
    ctx.fillStyle = '#0F172A'; ctx.font = '9px monospace'; ctx.textAlign = 'left';
    ctx.fillText('HERBARIUM NO: 4092', w/2 - 135, h/2 - 45);
    ctx.fillText('Hibiscus rosa-sinensis', w/2 - 135, h/2 - 30);
  }

  function drawEnzymeKineticsGraphModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#0284C7'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Axes
    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-w/2 + 40, -h/2 + 25); ctx.lineTo(-w/2 + 40, h/2 - 35);
    ctx.lineTo(w/2 - 30, h/2 - 35); ctx.stroke();

    // Hyperbolic saturation curve
    ctx.strokeStyle = '#2563EB'; ctx.lineWidth = 3;
    ctx.beginPath();
    const ox = -w/2 + 40, oy = h/2 - 35;
    for (let x = 0; x <= w - 80; x += 5) {
      const v = (80 * x) / (30 + x);
      if (x === 0) ctx.moveTo(ox + x, oy - v);
      else ctx.lineTo(ox + x, oy - v);
    }
    ctx.stroke();

    // Vmax dashed line
    ctx.strokeStyle = '#DC2626'; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(ox, oy - 80); ctx.lineTo(w/2 - 30, oy - 80); ctx.stroke();
    ctx.setLineDash([]);
  }

  function drawPracticalCbtDrawingModel(obj) {
    const w = obj.width, h = obj.height;
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#059669'; ctx.lineWidth = 2;
    ctx.fillRect(-w/2, -h/2, w, h); ctx.strokeRect(-w/2, -h/2, w, h);

    // Scientific outline
    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(-30, 0, 75, 45, 0.2, 0, Math.PI*2); ctx.stroke();

    // Label lines (ruled horizontal without arrowheads)
    ctx.strokeStyle = '#64748B'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(40, -20); ctx.lineTo(120, -20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(120, 20); ctx.stroke();

    // Scale bar
    ctx.strokeStyle = '#0F172A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-90, h/2 - 25); ctx.lineTo(-30, h/2 - 25); ctx.stroke();
    ctx.fillStyle = '#0F172A'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('10 mm (×1.5)', -60, h/2 - 12);
  }

  function drawPlantCellModel(obj) {
    const cw = obj.width;
    const ch = obj.height;
    const layer = obj.layerLevel || 1;

    // Layer 1: Cellulose Cell Wall & Surface Membrane
    ctx.strokeStyle = '#059669';
    ctx.lineWidth = 10;
    ctx.lineJoin = 'round';
    ctx.strokeRect(-cw / 2, -ch / 2, cw, ch);

    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 3;
    ctx.strokeRect(-cw / 2 + 8, -ch / 2 + 8, cw - 16, ch - 16);

    ctx.fillStyle = layer === 1 ? '#ECFDF5' : '#D1FAE5';
    ctx.fillRect(-cw / 2 + 10, -ch / 2 + 10, cw - 20, ch - 20);

    // Layer 2 & 3: Vacuole, Chloroplasts, Mitochondria & Nucleus
    if (layer >= 1) {
      // Large Central Vacuole
      ctx.fillStyle = '#E0F2FE';
      ctx.strokeStyle = '#0284C7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-cw / 4, -ch / 4, cw / 2, ch / 2.2, 20);
      ctx.fill();
      ctx.stroke();

      // Chloroplasts with Granum Stacks
      const chloro = [
        [cw / 3.4, -ch / 3.2],
        [cw / 3.4, ch / 3.4],
        [-cw / 3.4, ch / 3.4]
      ];
      chloro.forEach(([ox, oy]) => {
        ctx.fillStyle = '#15803D';
        ctx.beginPath();
        ctx.ellipse(ox, oy, 22, 12, Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#14532D';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Nucleus with Double Membrane & Nucleolus
      const nucX = -cw / 3;
      const nucY = -ch / 4;
      ctx.fillStyle = '#7C3AED';
      ctx.strokeStyle = '#5B21B6';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(nucX, nucY, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#4C1D95';
      ctx.beginPath();
      ctx.arc(nucX + 4, nucY - 4, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawHumanHeartModel(obj) {
    const pulse = state.simulationRunning ? Math.sin(state.simTime * 8) * 8 : 0;
    const r = 110 + pulse;

    // Myocardium Wall
    ctx.fillStyle = '#F87171';
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, 10, r, r + 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Central Septum
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(-12, -80, 24, 180);

    // Thick Left Ventricle Muscle
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(50, 0, 24, 90);

    // Chamber Labels
    ctx.font = 'bold 11px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Right Atrium', -75, -40);
    ctx.fillText('Left Atrium', 25, -40);
    ctx.fillText('Right Ventricle', -80, 50);
    ctx.fillText('Left Ventricle', 20, 50);

    // Pulmonary Artery & Aorta Arches
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-30, -90);
    ctx.lineTo(-30, -130);
    ctx.stroke();

    ctx.strokeStyle = '#EF4444';
    ctx.beginPath();
    ctx.moveTo(25, -90);
    ctx.lineTo(25, -140);
    ctx.stroke();
  }

  function drawLeafCrossSectionModel(obj) {
    const cw = obj.width;
    // Upper Cuticle
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-cw / 2, -60, cw, 20);
    ctx.strokeStyle = '#CA8A04';
    ctx.strokeRect(-cw / 2, -60, cw, 20);

    // Palisade Mesophyll Layer
    const cols = 14;
    const colW = (cw - 20) / cols;
    for (let i = 0; i < cols; i++) {
      const px = -cw / 2 + 10 + i * colW;
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(px, -36, colW - 4, 48);
      ctx.strokeStyle = '#15803D';
      ctx.strokeRect(px, -36, colW - 4, 48);
    }

    // Lower Epidermis with Stomatal Pore
    ctx.fillStyle = '#FEF08A';
    ctx.fillRect(-cw / 2, 40, cw, 20);
    ctx.strokeRect(-cw / 2, 40, cw, 20);

    // Guard Cells
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.ellipse(0, 50, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNephronModel(obj) {
    // Bowman's Capsule Cup
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(-100, -30, 30, Math.PI * 0.4, Math.PI * 1.8);
    ctx.stroke();

    // Glomerulus capillary ball
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(-100, -30, 18, 0, Math.PI * 2);
    ctx.fill();

    // Tubule Loops & Loop of Henle
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-70, -30);
    ctx.bezierCurveTo(-30, -70, 0, 10, 30, -30);
    ctx.lineTo(40, 80);
    ctx.arc(55, 80, 15, Math.PI, 0, true);
    ctx.lineTo(70, -30);
    ctx.lineTo(120, -30);
    ctx.lineTo(120, 100);
    ctx.stroke();
  }

  function drawFoodWebModel(obj) {
    const nodes = [
      { name: 'Grass / Acacia (Producers)', x: 0, y: 70, color: '#16A34A' },
      { name: 'Herbivores (Zebra / Gazelle)', x: 90, y: 0, color: '#2563EB' },
      { name: 'Insects (Grasshopper)', x: -90, y: 0, color: '#2563EB' },
      { name: 'Apex Predator (Lion)', x: 0, y: -70, color: '#DC2626' }
    ];

    nodes.forEach((n) => {
      ctx.fillStyle = '#FFFFFF';
      ctx.strokeStyle = n.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(n.x - 70, n.y - 14, 140, 28, 6);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 10px Inter';
      ctx.fillStyle = n.color;
      ctx.textAlign = 'center';
      ctx.fillText(n.name, n.x, n.y + 4);
      ctx.textAlign = 'left';
    });
  }

  function drawErythrocyteModel(obj) {
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();

    // Biconcave Center Depression
    ctx.fillStyle = '#B91C1C';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBacteriumModel(obj) {
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(-60, -25, 120, 50, 25);
    ctx.fill();
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Flagella
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(60, 0);
    ctx.bezierCurveTo(90, -20, 110, 20, 140, 0);
    ctx.stroke();
  }

  function drawLeaderLabel(fromX, fromY, toX, toY, text) {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.fillStyle = '#0F172A';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(text, toX > fromX ? toX + 4 : toX - ctx.measureText(text).width - 4, toY + 4);
  }

  function drawCaliperVector(start, end) {
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();

    // Caliper end ticks
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    const perp = angle + Math.PI / 2;
    const tickLen = 8;

    [start, end].forEach((pt) => {
      ctx.beginPath();
      ctx.moveTo(pt.x - tickLen * Math.cos(perp), pt.y - tickLen * Math.sin(perp));
      ctx.lineTo(pt.x + tickLen * Math.cos(perp), pt.y + tickLen * Math.sin(perp));
      ctx.stroke();
    });

    const distPx = Math.hypot(end.x - start.x, end.y - start.y);
    // Calibration: 1 px ≈ 0.25 μm at 100x
    const distUm = (distPx * 0.25).toFixed(1);

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 12px Inter';
    ctx.fillText(`${distUm} μm (${Math.round(distPx)} px)`, (start.x + end.x) / 2 + 6, (start.y + end.y) / 2 - 6);
  }

  // 12. Virtual Optical Microscope Simulator
  const canvasMicroscope = document.getElementById('canvas-microscope-view');
  const mctx = canvasMicroscope ? canvasMicroscope.getContext('2d') : null;
  const selectSpecimen = document.getElementById('select-slide-specimen');
  const sliderCoarse = document.getElementById('slider-coarse-focus');
  const sliderFine = document.getElementById('slider-fine-focus');
  const sliderDiaphragm = document.getElementById('slider-diaphragm');
  const checkGraticule = document.getElementById('check-show-graticule');
  const valTotalMagEl = document.getElementById('val-total-magnification');
  const valFieldViewEl = document.getElementById('val-field-view');

  document.querySelectorAll('.btn-obj-lens').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-obj-lens').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.microscope.objectiveMag = parseInt(btn.dataset.mag, 10);
      updateMicroscopeView();
    });
  });

  if (selectSpecimen) {
    selectSpecimen.addEventListener('change', (e) => {
      state.microscope.specimen = e.target.value;
      updateMicroscopeView();
    });
  }

  if (sliderCoarse) sliderCoarse.addEventListener('input', (e) => { state.microscope.coarseFocus = parseInt(e.target.value, 10); updateMicroscopeView(); });
  if (sliderFine) sliderFine.addEventListener('input', (e) => { state.microscope.fineFocus = parseInt(e.target.value, 10); updateMicroscopeView(); });
  if (sliderDiaphragm) sliderDiaphragm.addEventListener('input', (e) => { state.microscope.diaphragm = parseInt(e.target.value, 10); updateMicroscopeView(); });
  if (checkGraticule) checkGraticule.addEventListener('change', (e) => { state.microscope.showGraticule = e.target.checked; updateMicroscopeView(); });

  function updateMicroscopeView() {
    if (!mctx || !canvasMicroscope) return;
    const mw = canvasMicroscope.width;
    const mh = canvasMicroscope.height;

    const totalMag = state.microscope.objectiveMag * state.microscope.eyepieceMag;
    if (valTotalMagEl) valTotalMagEl.textContent = `${totalMag}×`;

    const fovMicrons = Math.round(180000 / totalMag);
    if (valFieldViewEl) valFieldViewEl.textContent = `${fovMicrons} μm`;

    const focusError = Math.abs(state.microscope.coarseFocus - 50) * 0.15 + Math.abs(state.microscope.fineFocus - 50) * 0.05;
    mctx.filter = `blur(${focusError.toFixed(1)}px) brightness(${state.microscope.diaphragm}%)`;

    mctx.fillStyle = '#FFFBEB';
    mctx.fillRect(0, 0, mw, mh);

    drawMicroscopeSlide(mw, mh, state.microscope.specimen, totalMag);
    mctx.filter = 'none';

    if (state.microscope.showGraticule) {
      drawOcularGraticule(mw, mh, fovMicrons);
    }
  }

  function drawMicroscopeSlide(mw, mh, specimen, mag) {
    const scaleFactor = mag / 100;
    if (specimen === 'onion_epidermis') {
      mctx.strokeStyle = '#D97706';
      mctx.lineWidth = 2;
      for (let r = -2; r <= 8; r++) {
        for (let c = -2; c <= 8; c++) {
          const bx = c * (80 * scaleFactor);
          const by = r * (40 * scaleFactor) + (c % 2 === 0 ? 10 : 0);
          mctx.fillStyle = '#FEF3C7';
          mctx.fillRect(bx, by, 76 * scaleFactor, 36 * scaleFactor);
          mctx.strokeRect(bx, by, 76 * scaleFactor, 36 * scaleFactor);

          mctx.fillStyle = '#B45309';
          mctx.beginPath();
          mctx.arc(bx + 45 * scaleFactor, by + 18 * scaleFactor, 5 * scaleFactor, 0, Math.PI * 2);
          mctx.fill();
        }
      }
    } else if (specimen === 'human_cheek') {
      for (let k = 0; k < 6; k++) {
        const cx = 60 + (k % 3) * 100;
        const cy = 70 + Math.floor(k / 3) * 120;
        mctx.fillStyle = '#BFDBFE';
        mctx.beginPath();
        mctx.ellipse(cx, cy, 38 * scaleFactor, 26 * scaleFactor, k * 0.4, 0, Math.PI * 2);
        mctx.fill();
        mctx.strokeStyle = '#1D4ED8';
        mctx.stroke();

        mctx.fillStyle = '#1E3A8A';
        mctx.beginPath();
        mctx.arc(cx, cy, 7 * scaleFactor, 0, Math.PI * 2);
        mctx.fill();
      }
    } else {
      const pcx = mw / 2;
      const pcy = mh / 2;
      mctx.fillStyle = '#BBF7D0';
      mctx.beginPath();
      mctx.ellipse(pcx, pcy, 70 * scaleFactor, 32 * scaleFactor, -Math.PI / 8, 0, Math.PI * 2);
      mctx.fill();
      mctx.strokeStyle = '#15803D';
      mctx.stroke();
    }
  }

  function drawOcularGraticule(mw, mh, fovMicrons) {
    mctx.strokeStyle = '#0F172A';
    mctx.lineWidth = 1;
    mctx.beginPath();
    mctx.moveTo(30, mh / 2);
    mctx.lineTo(mw - 30, mh / 2);
    mctx.stroke();

    for (let i = 0; i <= 20; i++) {
      const gx = 30 + i * ((mw - 60) / 20);
      const h = i % 5 === 0 ? 14 : 8;
      mctx.beginPath();
      mctx.moveTo(gx, mh / 2 - h);
      mctx.lineTo(gx, mh / 2 + h);
      mctx.stroke();
    }
  }

  // 13. Genetics Punnett Square Cross Solver (Monohybrid & Dihybrid)
  const btnCalculatePunnett = document.getElementById('btn-calculate-punnett');
  const inputP1 = document.getElementById('punnett-p1');
  const inputP2 = document.getElementById('punnett-p2');
  const punnettGridEl = document.getElementById('punnett-grid-container');
  const punnettGenoRatioEl = document.getElementById('punnett-genotype-ratio');
  const punnettPhenoRatioEl = document.getElementById('punnett-phenotype-ratio');

  let activeCrossType = 'monohybrid';
  document.querySelectorAll('.btn-cross-type').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.btn-cross-type').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      activeCrossType = btn.dataset.type;

      if (activeCrossType === 'dihybrid') {
        if (inputP1) inputP1.value = 'AaBb';
        if (inputP2) inputP2.value = 'AaBb';
      } else {
        if (inputP1) inputP1.value = 'Aa';
        if (inputP2) inputP2.value = 'Aa';
      }
      runPunnettSolver();
    });
  });

  if (btnCalculatePunnett) {
    btnCalculatePunnett.addEventListener('click', runPunnettSolver);
  }

  async function runPunnettSolver() {
    const p1 = inputP1 ? inputP1.value.trim() : 'Aa';
    const p2 = inputP2 ? inputP2.value.trim() : 'Aa';

    if (activeCrossType === 'dihybrid' && p1.length === 4 && p2.length === 4) {
      try {
        const res = await fetch('/api/biology/grade-dihybrid', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parent1_genotype: p1, parent2_genotype: p2 })
        });
        const data = await res.json();
        if (data.success) {
          renderDihybridGrid(data);
          return;
        }
      } catch (err) {
        console.warn('Dihybrid cross API error:', err);
      }
    }

    // Monohybrid cross fallback
    if (p1.length < 2 || p2.length < 2) return;
    const a1 = p1[0], a2 = p1[1];
    const b1 = p2[0], b2 = p2[1];

    const sortAlleles = (x, y) => (x <= y ? x + y : y + x);
    const c11 = sortAlleles(a1, b1);
    const c12 = sortAlleles(a2, b1);
    const c21 = sortAlleles(a1, b2);
    const c22 = sortAlleles(a2, b2);

    if (punnettGridEl) {
      punnettGridEl.innerHTML = `
        <table class="table table-bordered table-sm text-center font-monospace mb-0" style="width: 240px; font-size: 15px;">
          <thead class="table-light">
            <tr><th>♀ \\ ♂</th><th>${b1}</th><th>${b2}</th></tr>
          </thead>
          <tbody>
            <tr><th class="table-light">${a1}</th><td class="fw-bold text-primary">${c11}</td><td class="fw-bold text-primary">${c12}</td></tr>
            <tr><th class="table-light">${a2}</th><td class="fw-bold text-primary">${c21}</td><td class="fw-bold text-primary">${c22}</td></tr>
          </tbody>
        </table>
      `;
    }

    const counts = {};
    [c11, c12, c21, c22].forEach((g) => { counts[g] = (counts[g] || 0) + 1; });
    const genoStr = Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(' : ');
    if (punnettGenoRatioEl) punnettGenoRatioEl.textContent = genoStr;

    let domCount = 0, recCount = 0;
    const domLetter = a1.toUpperCase();
    [c11, c12, c21, c22].forEach((g) => {
      if (g.includes(domLetter)) domCount++;
      else recCount++;
    });
    if (punnettPhenoRatioEl) {
      punnettPhenoRatioEl.textContent = `${domCount} Dominant : ${recCount} Recessive (${domCount * 25}% / ${recCount * 25}%)`;
    }
  }

  function renderDihybridGrid(data) {
    if (!punnettGridEl) return;
    const g1 = data.parent1Gametes;
    const g2 = data.parent2Gametes;

    let html = `
      <table class="table table-bordered table-sm text-center font-monospace mb-0" style="width: 380px; font-size: 13px;">
        <thead class="table-light">
          <tr><th>♀ \\ ♂</th><th>${g2[0]}</th><th>${g2[1]}</th><th>${g2[2]}</th><th>${g2[3]}</th></tr>
        </thead>
        <tbody>
    `;

    for (let r = 0; r < 4; r++) {
      html += `<tr><th class="table-light">${g1[r]}</th>`;
      for (let c = 0; c < 4; c++) {
        html += `<td class="fw-semibold text-primary">${data.grid[r][c]}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table>`;
    punnettGridEl.innerHTML = html;

    if (punnettGenoRatioEl) punnettGenoRatioEl.textContent = '16 Offspring Outcomes (Independent Assortment)';
    if (punnettPhenoRatioEl) punnettPhenoRatioEl.textContent = `${data.expectedRatio} (9:3:3:1 Classical Ratio)`;
  }

  // 14. Kirby-Bauer Antibiotic Susceptibility Assay Evaluator
  const btnEvalAntibiotic = document.getElementById('btn-eval-antibiotic');
  const sliderZone = document.getElementById('slider-zone-diameter');
  const selectAntibiotic = document.getElementById('select-antibiotic-disc');
  const valZoneEl = document.getElementById('val-zone-diameter');
  const antibioticResultEl = document.getElementById('antibiotic-eval-result');

  if (sliderZone) {
    sliderZone.addEventListener('input', (e) => {
      const val = e.target.value;
      if (valZoneEl) valZoneEl.textContent = val;
      state.antibioticAssay.zoneDiameter = parseFloat(val);
      renderPetriDishAssay();
    });
  }

  if (selectAntibiotic) {
    selectAntibiotic.addEventListener('change', (e) => {
      state.antibioticAssay.drug = e.target.value;
      renderPetriDishAssay();
    });
  }

  if (btnEvalAntibiotic) {
    btnEvalAntibiotic.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/biology/evaluate-antibiotic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            antibiotic: state.antibioticAssay.drug,
            zone_diameter_mm: state.antibioticAssay.zoneDiameter
          })
        });
        const data = await res.json();
        if (data.success && antibioticResultEl) {
          const colorClass = data.interpretation === 'Susceptible' ? 'alert-success' : data.interpretation === 'Resistant' ? 'alert-danger' : 'alert-warning';
          antibioticResultEl.innerHTML = `
            <div class="alert ${colorClass} py-2 mb-0">
              <div class="fw-bold fs-6 mb-1">${data.interpretation.toUpperCase()} (${data.zone_diameter_mm} mm)</div>
              <div><strong>Drug Class:</strong> ${data.drugClass}</div>
              <div><strong>Thresholds:</strong> ${data.thresholds.resistant} (R) | ${data.thresholds.intermediate} (I) | ${data.thresholds.susceptible} (S)</div>
              <small class="d-block mt-1 text-muted">${data.clinicalNote}</small>
            </div>
          `;
        }
      } catch (err) {
        console.warn('Antibiotic evaluation request failed:', err);
      }
    });
  }

  function renderPetriDishAssay() {
    const pCanvas = document.getElementById('canvas-petri-dish');
    if (!pCanvas) return;
    const pctx = pCanvas.getContext('2d');
    const pw = pCanvas.width;
    const ph = pCanvas.height;
    const cx = pw / 2;
    const cy = ph / 2;

    pctx.fillStyle = '#FEF3C7';
    pctx.beginPath();
    pctx.arc(cx, cy, 120, 0, Math.PI * 2);
    pctx.fill();

    const zRadius = state.antibioticAssay.zoneDiameter * 2.8;
    pctx.fillStyle = '#F1F5F9';
    pctx.beginPath();
    pctx.arc(cx, cy, zRadius, 0, Math.PI * 2);
    pctx.fill();
    pctx.strokeStyle = '#94A3B8';
    pctx.setLineDash([4, 4]);
    pctx.stroke();
    pctx.setLineDash([]);

    pctx.fillStyle = '#FFFFFF';
    pctx.strokeStyle = '#0F172A';
    pctx.lineWidth = 2;
    pctx.beginPath();
    pctx.arc(cx, cy, 14, 0, Math.PI * 2);
    pctx.fill();
    pctx.stroke();

    pctx.fillStyle = '#0F172A';
    pctx.font = 'bold 9px Inter';
    pctx.textAlign = 'center';
    const discLabel = state.antibioticAssay.drug === 'penicillin' ? 'P10' : state.antibioticAssay.drug === 'ampicillin' ? 'AMP' : state.antibioticAssay.drug === 'tetracycline' ? 'TE30' : 'S10';
    pctx.fillText(discLabel, cx, cy + 3);
    pctx.textAlign = 'left';
  }

  // 15. Lotka-Volterra Predator-Prey Ecology Simulator
  const btnRunLotka = document.getElementById('btn-run-lotka-sim');
  if (btnRunLotka) {
    btnRunLotka.addEventListener('click', runLotkaVolterraSimulation);
  }

  async function runLotkaVolterraSimulation() {
    const alpha = parseFloat(document.getElementById('slider-lv-alpha')?.value || 1.0);
    const beta = parseFloat(document.getElementById('slider-lv-beta')?.value || 0.05);
    const gamma = parseFloat(document.getElementById('slider-lv-gamma')?.value || 0.5);
    const delta = parseFloat(document.getElementById('slider-lv-delta')?.value || 0.02);

    try {
      const res = await fetch('/api/biology/simulate-lotka-volterra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alpha, beta, gamma, delta, prey0: 40, pred0: 9, steps: 80, dt: 0.1 })
      });
      const data = await res.json();
      if (data.success) {
        state.lotkaVolterra.timeSeries = data.timeSeries;
        document.getElementById('val-eq-prey').textContent = data.equilibrium.prey;
        document.getElementById('val-eq-pred').textContent = data.equilibrium.predator;
        renderLotkaVolterraModalChart();
        renderLotkaVolterraMiniChart();
      }
    } catch (err) {
      console.warn('Lotka-Volterra simulation failed:', err);
    }
  }

  function renderLotkaVolterraModalChart() {
    const lCanvas = document.getElementById('canvas-modal-lotka');
    if (!lCanvas || state.lotkaVolterra.timeSeries.length === 0) return;
    const lctx = lCanvas.getContext('2d');
    const lw = lCanvas.width;
    const lh = lCanvas.height;
    const pts = state.lotkaVolterra.timeSeries;

    lctx.fillStyle = '#FFFFFF';
    lctx.fillRect(0, 0, lw, lh);

    // Axes
    lctx.strokeStyle = '#E2E8F0';
    lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(40, 10);
    lctx.lineTo(40, lh - 25);
    lctx.lineTo(lw - 20, lh - 25);
    lctx.stroke();

    const maxVal = Math.max(...pts.map((p) => Math.max(p.prey, p.predator)), 50);

    // Draw Prey Line (Green)
    lctx.strokeStyle = '#16A34A';
    lctx.lineWidth = 2.5;
    lctx.beginPath();
    pts.forEach((p, idx) => {
      const x = 40 + (idx / (pts.length - 1)) * (lw - 70);
      const y = lh - 25 - (p.prey / maxVal) * (lh - 45);
      if (idx === 0) lctx.moveTo(x, y);
      else lctx.lineTo(x, y);
    });
    lctx.stroke();

    // Draw Predator Line (Red)
    lctx.strokeStyle = '#DC2626';
    lctx.lineWidth = 2.5;
    lctx.beginPath();
    pts.forEach((p, idx) => {
      const x = 40 + (idx / (pts.length - 1)) * (lw - 70);
      const y = lh - 25 - (p.predator / maxVal) * (lh - 45);
      if (idx === 0) lctx.moveTo(x, y);
      else lctx.lineTo(x, y);
    });
    lctx.stroke();
  }

  function renderLotkaVolterraMiniChart() {
    const lCanvas = document.getElementById('bio-lotka-canvas');
    if (!lCanvas || state.lotkaVolterra.timeSeries.length === 0) return;
    const lctx = lCanvas.getContext('2d');
    const lw = lCanvas.width;
    const lh = lCanvas.height;
    const pts = state.lotkaVolterra.timeSeries;

    lctx.fillStyle = '#F8FAFC';
    lctx.fillRect(0, 0, lw, lh);

    const maxVal = Math.max(...pts.map((p) => Math.max(p.prey, p.predator)), 50);

    lctx.strokeStyle = '#16A34A';
    lctx.lineWidth = 2;
    lctx.beginPath();
    pts.forEach((p, idx) => {
      const x = 10 + (idx / (pts.length - 1)) * (lw - 20);
      const y = lh - 10 - (p.prey / maxVal) * (lh - 20);
      if (idx === 0) lctx.moveTo(x, y);
      else lctx.lineTo(x, y);
    });
    lctx.stroke();

    lctx.strokeStyle = '#DC2626';
    lctx.lineWidth = 2;
    lctx.beginPath();
    pts.forEach((p, idx) => {
      const x = 10 + (idx / (pts.length - 1)) * (lw - 20);
      const y = lh - 10 - (p.predator / maxVal) * (lh - 20);
      if (idx === 0) lctx.moveTo(x, y);
      else lctx.lineTo(x, y);
    });
    lctx.stroke();
  }

  // 16. Three.js 3D Anatomy Viewport with 4 Switchable Models
  let threeRenderer = null, threeScene = null, threeCamera = null;
  let active3DGroup = null;

  if (select3DModel) {
    select3DModel.addEventListener('change', (e) => {
      state.threeModelType = e.target.value;
      rebuild3DScene();
    });
  }

  function render3DAnatomyView() {
    if (!container3d || typeof THREE === 'undefined') return;
    if (!threeRenderer) {
      const w = container3d.clientWidth || 800;
      const h = container3d.clientHeight || 500;

      threeScene = new THREE.Scene();
      threeScene.background = new THREE.Color(0x0f172a);

      threeCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      threeCamera.position.set(0, 3, 10);
      threeCamera.lookAt(0, 0, 0);

      threeRenderer = new THREE.WebGLRenderer({ antialias: true });
      threeRenderer.setSize(w, h);
      container3d.appendChild(threeRenderer.domElement);

      const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
      dirLight.position.set(5, 10, 7);
      threeScene.add(dirLight);
      threeScene.add(new THREE.AmbientLight(0x404040, 1.2));

      const grid = new THREE.GridHelper(16, 16, 0x059669, 0x334155);
      threeScene.add(grid);

      rebuild3DScene();

      function animate3D() {
        if (state.activeMode === 'anatomy3d') {
          requestAnimationFrame(animate3D);
          if (active3DGroup) {
            active3DGroup.rotation.y += 0.01;
            if (state.threeModelType === 'beating_heart') {
              const pulseScale = 1.0 + Math.sin(Date.now() * 0.005) * 0.08;
              active3DGroup.scale.set(pulseScale, pulseScale, pulseScale);
            }
          }
          threeRenderer.render(threeScene, threeCamera);
        }
      }
      animate3D();
    }
  }

  function rebuild3DScene() {
    if (!threeScene) return;
    if (active3DGroup) {
      threeScene.remove(active3DGroup);
      active3DGroup = null;
    }

    active3DGroup = new THREE.Group();

    if (state.threeModelType === 'beating_heart') {
      // 3D Heart model approximation using two fused spheres & aorta trunk
      const heartMat = new THREE.MeshPhongMaterial({ color: 0xdc2626 });
      const leftSphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 24), heartMat);
      leftSphere.position.set(-0.6, 0.5, 0);
      active3DGroup.add(leftSphere);

      const rightSphere = new THREE.Mesh(new THREE.SphereGeometry(1.2, 24, 24), heartMat);
      rightSphere.position.set(0.6, 0.5, 0);
      active3DGroup.add(rightSphere);

      const bottomCone = new THREE.Mesh(new THREE.ConeGeometry(1.7, 2.4, 24), heartMat);
      bottomCone.position.set(0, -0.7, 0);
      bottomCone.rotation.x = Math.PI;
      active3DGroup.add(bottomCone);

      // Aorta arch
      const aortaMat = new THREE.MeshLambertMaterial({ color: 0x2563eb });
      const aorta = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.6, 16), aortaMat);
      aorta.position.set(0.3, 1.8, 0);
      active3DGroup.add(aorta);
    } else if (state.threeModelType === 'erythrocyte_rbc') {
      // 3D Biconcave Erythrocyte disc
      const rbcMat = new THREE.MeshPhongMaterial({ color: 0xef4444 });
      const rbc = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.6, 32), rbcMat);
      active3DGroup.add(rbc);
    } else {
      // Default: DNA Double Helix
      const numBasePairs = 24;
      const helixRadius = 1.6;
      const helixPitch = 0.35;

      for (let i = 0; i < numBasePairs; i++) {
        const theta = i * 0.45;
        const y = (i - numBasePairs / 2) * helixPitch;

        const sphere1 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshPhongMaterial({ color: 0x10b981 }));
        sphere1.position.set(helixRadius * Math.cos(theta), y, helixRadius * Math.sin(theta));
        active3DGroup.add(sphere1);

        const sphere2 = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshPhongMaterial({ color: 0x0284c7 }));
        sphere2.position.set(helixRadius * Math.cos(theta + Math.PI), y, helixRadius * Math.sin(theta + Math.PI));
        active3DGroup.add(sphere2);

        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, helixRadius * 2, 8), new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0xf59e0b : 0xef4444 }));
        bar.position.set(0, y, 0);
        bar.rotation.z = Math.PI / 2;
        bar.rotation.y = -theta;
        active3DGroup.add(bar);
      }
    }

    threeScene.add(active3DGroup);
  }

  // 17. Experiment Templates Modal
  function populateTemplatesModal() {
    const container = document.getElementById('bio-templates-grid');
    if (!container) return;
    container.innerHTML = '';

    EXPERIMENT_TEMPLATES.forEach((tmpl) => {
      const col = document.createElement('div');
      col.className = 'col-md-4 col-sm-6';
      col.innerHTML = `
        <div class="card h-100 shadow-sm border">
          <div class="card-body">
            <div class="d-flex align-items-center gap-2 mb-2">
              <div class="p-2 rounded bg-success-subtle text-success">
                <i class="fa-solid ${tmpl.icon}"></i>
              </div>
              <h6 class="card-title fw-bold mb-0">${tmpl.title}</h6>
            </div>
            <p class="card-text small text-muted mb-3">${tmpl.description}</p>
            <button class="btn btn-sm btn-success w-100 btn-load-tmpl" data-id="${tmpl.id}">
              <i class="fa-solid fa-play me-1"></i> Launch Protocol
            </button>
          </div>
        </div>
      `;
      col.querySelector('.btn-load-tmpl').addEventListener('click', () => {
        bootstrap.Modal.getInstance(document.getElementById('modal-bio-templates'))?.hide();
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

  // 18. Biological Specimen Modal
  function populateSpecimenModal() {
    const container = document.getElementById('bio-specimens-categories');
    if (!container) return;
    container.innerHTML = '';

    SPECIMEN_CATEGORIES.forEach((cat) => {
      const col = document.createElement('div');
      col.className = 'col-md-6';
      const itemsList = cat.items.map((it) => `<li class="list-group-item py-1 px-2 small">${it.name} <small class="text-muted">(${it.dims})</small></li>`).join('');
      col.innerHTML = `
        <div class="card border mb-2">
          <div class="card-header bg-light py-2 fw-bold small text-success">
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

  // 19. Data Logging & Biological Curve Graphing
  if (btnRecordReading) {
    btnRecordReading.addEventListener('click', () => {
      const tempVal = document.getElementById('slider-bio-temp')?.value || 37;
      const rateVal = (50 * Math.exp(-0.5 * Math.pow((tempVal - 37) / 10, 2))).toFixed(1);
      const point = {
        index: state.recordedData.length + 1,
        condition: `${tempVal} °C`,
        rate: `${rateVal} μmol/min`,
        yield: `${(rateVal * 1.5).toFixed(1)} mg`,
        obs: tempVal > 50 ? 'Enzyme denatured; clear solution' : 'Enzymatic blue-violet complex',
        inference: tempVal == 37 ? 'Optimum temperature (Vmax reached)' : 'Sub-optimal velocity'
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
      dataTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-3">No observations recorded yet.</td></tr>';
      return;
    }
    dataTableBody.innerHTML = '';
    state.recordedData.forEach((d) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><strong>${d.index}</strong></td>
        <td>${d.condition}</td>
        <td>${d.rate}</td>
        <td>${d.yield}</td>
        <td>${d.obs}</td>
        <td>${d.inference}</td>
      `;
      dataTableBody.appendChild(row);
    });
  }

  function updateMiniGraph() {
    const miniCanvas = document.getElementById('bio-mini-graph');
    if (!miniCanvas) return;
    const mctx = miniCanvas.getContext('2d');
    const mw = miniCanvas.width;
    const mh = miniCanvas.height;

    mctx.fillStyle = '#FFFFFF';
    mctx.fillRect(0, 0, mw, mh);

    mctx.strokeStyle = '#CBD5E1';
    mctx.lineWidth = 1;
    mctx.beginPath();
    mctx.moveTo(30, 10);
    mctx.lineTo(30, mh - 20);
    mctx.lineTo(mw - 10, mh - 20);
    mctx.stroke();

    mctx.strokeStyle = '#059669';
    mctx.lineWidth = 2;
    mctx.beginPath();
    for (let t = 0; t <= 70; t += 2) {
      const x = 30 + (t / 70) * (mw - 50);
      const v = 50 * Math.exp(-0.5 * Math.pow((t - 37) / 10, 2));
      const y = mh - 20 - (v / 55) * (mh - 35);
      if (t === 0) mctx.moveTo(x, y);
      else mctx.lineTo(x, y);
    }
    mctx.stroke();

    mctx.fillStyle = '#DC2626';
    state.recordedData.forEach((pt) => {
      const t = parseFloat(pt.condition);
      const r = parseFloat(pt.rate);
      if (!isNaN(t) && !isNaN(r)) {
        const x = 30 + (t / 70) * (mw - 50);
        const y = mh - 20 - (r / 55) * (mh - 35);
        mctx.beginPath();
        mctx.arc(x, y, 4, 0, Math.PI * 2);
        mctx.fill();
      }
    });
  }

  // 20. Guided Labs Protocol View
  function renderGuidedExperimentView() {
    const titleEl = document.getElementById('bio-guide-topic-title');
    const contentEl = document.getElementById('bio-guide-topic-content');
    if (!titleEl || !contentEl) return;

    const topic = state.activeTopic || { title: 'General Biology Practical' };
    titleEl.textContent = `Guided Protocol: ${topic.title}`;

    contentEl.innerHTML = `
      <div class="row g-4">
        <div class="col-md-8">
          <div class="card p-3 mb-3 border">
            <h6 class="fw-bold text-dark"><i class="fa-solid fa-bullseye text-danger me-2"></i> Practical Objectives</h6>
            <ul class="small text-muted mb-0">
              <li>Prepare temporary microscopic wet mounts without air bubble entrapment.</li>
              <li>Calibrate ocular micrometer graticule using a stage micrometer to measure cell dimensions in μm.</li>
              <li>Record qualitative biochemical colorimetric changes (Benedict’s, Biuret, Iodine).</li>
              <li>Plot rate curves and calculate temperature coefficients and activation characteristics.</li>
            </ul>
          </div>
          <div class="card p-3 border mb-3">
            <h6 class="fw-bold text-dark"><i class="fa-solid fa-list-ol text-success me-2"></i> Laboratory Method</h6>
            <ol class="small text-muted">
              <li>Set up controlled biological specimens at calibrated environmental conditions.</li>
              <li>Use the Virtual Microscope modal for specimen examination and graticule calibration.</li>
              <li>Record 6 distinct readings across the experimental range into the Observation Dock.</li>
              <li>Export data to the Interactive Graphing Laboratory to fit Michaelis-Menten kinetic equations.</li>
            </ol>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card p-3 border bg-light">
            <h6 class="fw-bold text-dark mb-2"><i class="fa-solid fa-shield-halved text-success me-2"></i> Safety & Ethics</h6>
            <p class="small text-muted">Use ethanol water baths under heatproof mats. Treat biological stains with care; avoid skin contact. Comply with standard laboratory safety protocol.</p>
            <a href="/graphing-lab.html?subject=BIOLOGY" target="_blank" class="btn btn-sm btn-outline-success w-100">
              <i class="fa-solid fa-chart-line me-1"></i> Open Graphing Studio
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // 21. CBT Practical Assessment View
  function renderCbtPracticalView() {
    const container = document.getElementById('bio-cbt-questions-container');
    if (!container) return;

    container.innerHTML = `
      <div class="card p-3 mb-3 border">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="badge bg-success">QUESTION 1: MICROSCOPIC MAGNIFICATION</span>
          <span class="text-muted small">Max Score: 5 Marks</span>
        </div>
        <p class="fw-semibold mb-2">A student views a plant mesophyll cell using a 40× objective lens and a 10× eyepiece. Under this magnification, the image of the cell measures 24 mm in length. Using the formula M = Image size / Actual size, what is the actual length of the cell in micrometers (μm)?</p>
        <div class="input-group input-group-sm mb-3" style="max-width: 250px;">
          <input type="number" step="1" class="form-control" id="bio-cbt-q1-input" placeholder="e.g. 60" />
          <span class="input-group-text">μm</span>
          <button class="btn btn-success" id="btn-bio-cbt-q1-check">Submit</button>
        </div>
        <div id="bio-cbt-q1-feedback" class="small"></div>
      </div>
    `;

    document.getElementById('btn-bio-cbt-q1-check')?.addEventListener('click', async () => {
      const val = document.getElementById('bio-cbt-q1-input')?.value;
      const feedbackEl = document.getElementById('bio-cbt-q1-feedback');
      try {
        const res = await fetch('/api/biology/grade-microscopy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_size: 24000,
            actual_size: parseFloat(val),
            magnification: 400,
            tolerance: 0.05,
            unit: 'μm'
          })
        });
        const data = await res.json();
        if (feedbackEl) {
          feedbackEl.innerHTML = data.isCorrect
            ? `<div class="alert alert-success py-2 mb-0"><i class="fa-solid fa-check-circle me-1"></i> ${data.feedback}</div>`
            : `<div class="alert alert-danger py-2 mb-0"><i class="fa-solid fa-circle-xmark me-1"></i> ${data.feedback}</div>`;
        }
      } catch (err) {
        console.warn('Microscopy auto-grade request failed:', err);
      }
    });
  }

  // 22. Save Biology Experiment Endpoint
  if (btnSaveExperiment) {
    btnSaveExperiment.addEventListener('click', async () => {
      const title = prompt('Enter a title for this Biology Experiment:', state.activeTopic ? `${state.activeTopic.title} Setup` : 'My Biology Setup');
      if (!title) return;

      try {
        const res = await fetch('/api/biology/experiments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            topic_code: state.activeTopic ? state.activeTopic.code : 'virtual-experiments',
            model_type: 'cell_2d',
            specimens: canvasObjects.map((o) => o.type),
            annotations: [],
            variables: { tempC: 37.0, pH: 7.4 },
            data_readings: state.recordedData
          })
        });
        const data = await res.json();
        if (data.success) {
          alert('Biology experiment setup saved successfully!');
        } else {
          alert(data.error || 'Failed to save experiment.');
        }
      } catch (err) {
        alert('Network error saving experiment.');
      }
    });
  }

  // Initialize Workbench
  loadCurriculumTopics();
  renderApparatusTree();
  populateTemplatesModal();
  populateSpecimenModal();
  runPunnettSolver();
  runLotkaVolterraSimulation();
  renderPetriDishAssay();
  resizeCanvas();
  updateMicroscopeView();
});