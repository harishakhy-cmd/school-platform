/**
 * Interactive Geography & Earth Sciences Laboratory
 * Main Client Orchestrator
 */

(function () {
  'use strict';

  let mapEngine = null;
  let threeEngine = null;
  let lastElevationGrid = null;
  let currentTopicCode = 'maps-cartography';
  let currentActiveMode = 'map2d'; // 'map2d', 'terrain3d', 'charts', 'fieldwork'
  let currentChartType = 'climate'; // 'climate', 'pyramid', 'glacier'
  let curriculumTopics = [];

  document.addEventListener('DOMContentLoaded', () => {
    initLab();
  });

  async function initLab() {
    setupMapEngine();
    setupThreeEngine();
    bindToolbarEvents();
    bindModeSwitching();
    setupChartSubTabs();
    await loadCurriculumTopics();
    renderClimateChart('entebbe');
    setupFieldworkForm();
    setupGisFilterControls();
    setupWeatherAndHydroControls();
    setupStudyAreaSelector();
    setupLandformInfoPanel();
  }

  function setupMapEngine() {
    if (!window.GeoMapEngine) {
      console.error('[GeographyLab] GeoMapEngine not loaded.');
      return;
    }

    mapEngine = new window.GeoMapEngine('geo-leaflet-map', {
      center: [1.3733, 32.2903],
      zoom: 7,
      onCoordinateChange: (coords) => {
        const ddEl = document.getElementById('geo-hud-dd');
        const dmsEl = document.getElementById('geo-hud-dms');
        const gridEl = document.getElementById('geo-hud-grid');

        if (ddEl) ddEl.textContent = `${coords.lat.toFixed(4)}°, ${coords.lng.toFixed(4)}°`;
        if (dmsEl) dmsEl.textContent = `${coords.dms.latStr}, ${coords.dms.lngStr}`;
        if (gridEl) gridEl.textContent = `${coords.grid6}`;
      },
      onFeatureSelect: (feature) => {
        showFeatureDetails(feature);
      },
      onMeasurementUpdate: (data) => {
        const measBadge = document.getElementById('geo-measure-readout');
        if (!measBadge) return;

        if (data.type === 'distance') {
          measBadge.innerHTML = `<i class="fa-solid fa-ruler"></i> Distance: <strong>${data.totalKm} km</strong> (${data.totalMeters.toLocaleString()} m)`;
        } else if (data.type === 'area') {
          measBadge.innerHTML = `<i class="fa-solid fa-draw-polygon"></i> Area: <strong>${data.areaKm2} km²</strong> (${data.hectares} ha)`;
        }
      },
      onBearingUpdate: (data) => {
        const measBadge = document.getElementById('geo-measure-readout');
        if (measBadge) {
          measBadge.innerHTML = `
            <i class="fa-regular fa-compass"></i> True Bearing: <strong>${data.forwardBearingDeg}°</strong> | Back Bearing: <strong>${data.backBearingDeg}°</strong> | Quad: <strong>${data.quadrantalBearing}</strong> | Dist: <strong>${data.distanceKm} km</strong>
          `;
        }
      },
      onCrossSectionUpdate: (profile) => {
        renderElevationCrossSection(profile);
      },
      onBufferAnalysis: (bufferData) => {
        showBufferAnalysisResults(bufferData);
      }
    });
  }

  function setupThreeEngine() {
    if (window.THREE && window.Geo3DEngine) {
      threeEngine = new window.Geo3DEngine('geo-three-container');
    }
  }

  function bindToolbarEvents() {
    const demButton = document.getElementById('btn-geo-real-terrain');
    const demStatus = document.getElementById('geo-dem-status');
    const exaggerationInput = document.getElementById('geo-terrain-exaggeration');
    const exaggerationValue = document.getElementById('geo-terrain-exaggeration-value');
    demButton?.addEventListener('click', async () => {
      if (!mapEngine?.map || !threeEngine) {
        if (demStatus) demStatus.textContent = 'The interactive map or WebGL viewer is not available.';
        return;
      }
      demButton.disabled = true;
      if (demStatus) demStatus.textContent = 'Requesting real elevation samples for the current map area…';
      try {
        switchActiveMode('terrain3d');
        const center = mapEngine.map.getCenter();
        const mapBounds = mapEngine.map.getBounds();
        const span = Math.min(2, Math.max(0.02, mapBounds.getNorth() - mapBounds.getSouth(), mapBounds.getEast() - mapBounds.getWest()));
        const query = new URLSearchParams({ lat: center.lat.toFixed(6), lng: center.lng.toFixed(6), span: span.toFixed(4) });
        const response = await fetch(`/api/science/assets/sources/elevation?${query}`);
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || 'The real elevation source could not provide terrain data.');
        lastElevationGrid = data.grid;
        const exaggeration = Number(exaggerationInput?.value || 3);
        threeEngine.renderElevationGrid(lastElevationGrid, exaggeration);
        const validSamples = data.grid.elevations_m.filter(Number.isFinite).length;
        if (demStatus) demStatus.textContent = `${validSamples}/100 samples · ASTER GDEM v3 · requested ${new Date(data.grid.requestedAt).toLocaleDateString()} · 10×10 preview (not 30 m mesh spacing).`;
      } catch (error) {
        if (demStatus) demStatus.textContent = `${error.message} You can still inspect the illustrative landform models.`;
      } finally { demButton.disabled = false; }
    });
    exaggerationInput?.addEventListener('input', () => {
      if (exaggerationValue) exaggerationValue.textContent = `${exaggerationInput.value}×`;
      if (lastElevationGrid && threeEngine) {
        try { threeEngine.renderElevationGrid(lastElevationGrid, Number(exaggerationInput.value)); }
        catch (error) { if (demStatus) demStatus.textContent = error.message; }
      }
    });

    const btnDist = document.getElementById('tool-measure-dist');
    const btnArea = document.getElementById('tool-measure-area');
    const btnBearing = document.getElementById('tool-measure-bearing');
    const btnCrossSection = document.getElementById('tool-cross-section');
    const btnBuffer = document.getElementById('tool-spatial-buffer');
    const btnPin = document.getElementById('tool-drop-pin');
    const btnClear = document.getElementById('tool-clear-meas');
    const btnResetView = document.getElementById('tool-reset-view');

    if (btnDist) {
      btnDist.addEventListener('click', () => {
        toggleToolActive(btnDist);
        mapEngine.setTool('measure_distance');
        showToolbarHelp('Click on the map to add distance waypoints along roads, rivers, or boundaries.');
      });
    }

    if (btnArea) {
      btnArea.addEventListener('click', () => {
        toggleToolActive(btnArea);
        mapEngine.setTool('measure_area');
        showToolbarHelp('Click at least 3 points to outline a surface area (in hectares & km²).');
      });
    }

    if (btnBearing) {
      btnBearing.addEventListener('click', () => {
        toggleToolActive(btnBearing);
        mapEngine.setTool('measure_bearing');
        showToolbarHelp('Click Point A (start observer) then Point B (target feature) to measure True & Back bearing.');
      });
    }

    if (btnCrossSection) {
      btnCrossSection.addEventListener('click', () => {
        toggleToolActive(btnCrossSection);
        mapEngine.setTool('cross_section');
        showToolbarHelp('Click Point A then Point B to draw an elevation transect slice and calculate slope gradient.');
      });
    }

    if (btnBuffer) {
      btnBuffer.addEventListener('click', () => {
        toggleToolActive(btnBuffer);
        mapEngine.setTool('buffer_tool');
        showToolbarHelp('Click any location to generate a 50 km proximity buffer zone and identify intersecting features.');
      });
    }

    if (btnPin) {
      btnPin.addEventListener('click', () => {
        toggleToolActive(btnPin);
        mapEngine.setTool('drop_pin');
      });
    }

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        clearActiveTools();
        mapEngine.clearMeasurements();
        const readout = document.getElementById('geo-measure-readout');
        if (readout) readout.innerHTML = '';
      });
    }

    if (btnResetView) {
      btnResetView.addEventListener('click', () => {
        mapEngine.resetView();
      });
    }

    const baseSelector = document.getElementById('geo-basemap-select');
    if (baseSelector) {
      baseSelector.addEventListener('change', (e) => {
        mapEngine.setBaseLayer(e.target.value);
      });
    }

    const layerChecks = [
      { id: 'layer-chk-relief', key: 'relief' },
      { id: 'layer-chk-lakes', key: 'lakes' },
      { id: 'layer-chk-rivers', key: 'rivers' },
      { id: 'layer-chk-parks', key: 'parks' },
      { id: 'layer-chk-rift', key: 'rift' },
      { id: 'layer-chk-tectonics', key: 'tectonics' },
      { id: 'layer-chk-districts', key: 'districts' }
    ];

    layerChecks.forEach((chk) => {
      const el = document.getElementById(chk.id);
      if (el) {
        el.addEventListener('change', (e) => {
          mapEngine.toggleOverlay(chk.key, e.target.checked);
        });
      }
    });

    const chkGrid = document.getElementById('layer-chk-grid');
    if (chkGrid) {
      chkGrid.addEventListener('change', (e) => {
        mapEngine.toggleGridOverlay(e.target.checked);
      });
    }

    const sel3D = document.getElementById('geo-3d-model-select');
    if (sel3D) {
      sel3D.addEventListener('change', (e) => {
        if (threeEngine) {
          threeEngine.renderLandform(e.target.value);
        }
      });
    }

    const btn3DRotate = document.getElementById('btn-3d-rotate');
    if (btn3DRotate) {
      btn3DRotate.addEventListener('click', () => {
        if (threeEngine) {
          const rotating = threeEngine.toggleRotation();
          btn3DRotate.innerHTML = rotating
            ? '<i class="fa-solid fa-pause"></i> Pause'
            : '<i class="fa-solid fa-play"></i> Rotate';
        }
      });
    }

    const btn3DReset = document.getElementById('btn-3d-reset');
    if (btn3DReset) {
      btn3DReset.addEventListener('click', () => {
        if (threeEngine) threeEngine.resetCamera();
      });
    }

    const btnSaveMap = document.getElementById('btn-geo-save-map');
    if (btnSaveMap) {
      btnSaveMap.addEventListener('click', async () => {
        const title = prompt('Enter a name for this Geography Map Project:', 'Uganda Physical Features Map');
        if (!title) return;

        try {
          const res = await fetch('/api/geography/maps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              topic_code: currentTopicCode,
              center_lat: 1.3733,
              center_lng: 32.2903,
              zoom_level: 7
            })
          });
          const data = await res.json();
          if (data.success) {
            alert('✓ Map project saved successfully!');
          } else {
            alert('Error: ' + (data.error || 'Failed to save'));
          }
        } catch (err) {
          alert('Network error saving map project');
        }
      });
    }
  }

  function showToolbarHelp(msg) {
    const readout = document.getElementById('geo-measure-readout');
    if (readout) {
      readout.innerHTML = `<i class="fa-solid fa-circle-info text-primary"></i> ${msg}`;
    }
  }

  function toggleToolActive(btn) {
    document.querySelectorAll('.geo-tool-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  }

  function clearActiveTools() {
    document.querySelectorAll('.geo-tool-btn').forEach((b) => b.classList.remove('active'));
  }

  function bindModeSwitching() {
    const pills = document.querySelectorAll('.geo-mode-pill');
    pills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const targetMode = pill.getAttribute('data-mode');
        switchActiveMode(targetMode);
      });
    });
  }

  function switchActiveMode(mode) {
    currentActiveMode = mode;

    document.querySelectorAll('.geo-mode-pill').forEach((p) => {
      if (p.getAttribute('data-mode') === mode) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
    });

    const vMap = document.getElementById('geo-leaflet-map');
    const v3D = document.getElementById('geo-three-container');
    const vChart = document.getElementById('geo-chart-container');
    const vField = document.getElementById('geo-fieldwork-container');
    const toolbar = document.querySelector('.geo-map-toolbar');
    const hud = document.querySelector('.geo-hud-coordinates');
    const controls3D = document.getElementById('geo-3d-controls');

    vMap.style.display = mode === 'map2d' ? 'block' : 'none';
    v3D.style.display = mode === 'terrain3d' ? 'block' : 'none';
    vChart.style.display = mode === 'charts' ? 'block' : 'none';
    vField.style.display = mode === 'fieldwork' ? 'block' : 'none';

    if (toolbar) toolbar.style.display = mode === 'map2d' ? 'flex' : 'none';
    if (hud) hud.style.display = mode === 'map2d' ? 'flex' : 'none';
    if (controls3D) controls3D.style.display = mode === 'terrain3d' ? 'flex' : 'none';

    if (mode === 'terrain3d' && threeEngine) {
      threeEngine.onResize();
    }
    if (mode === 'map2d' && mapEngine && mapEngine.map) {
      setTimeout(() => { mapEngine.map.invalidateSize(); }, 150);
    }
  }

  function updateGraphingLabLink(presetIndex) {
    const link = document.getElementById('btn-open-in-graphing-lab');
    if (link) {
      link.href = `/graphing-lab.html?subject=GEOGRAPHY&preset=${presetIndex}`;
    }
  }

  function setupChartSubTabs() {
    const btnClimate = document.getElementById('btn-tab-climate');
    const btnPyramid = document.getElementById('btn-tab-pyramid');
    const btnGlacier = document.getElementById('btn-tab-glacier');
    const wrapperStation = document.getElementById('wrapper-station-select');
    const selStation = document.getElementById('geo-station-select');

    function syncClimateStationPreset(val) {
      if (val === 'gulu') updateGraphingLabLink(1);
      else if (val === 'moroto') updateGraphingLabLink(2);
      else updateGraphingLabLink(0);
    }

    if (selStation) {
      selStation.addEventListener('change', (e) => {
        syncClimateStationPreset(e.target.value);
        if (currentChartType === 'climate') {
          renderClimateChart(e.target.value);
        }
      });
    }

    if (btnClimate) {
      btnClimate.addEventListener('click', () => {
        currentChartType = 'climate';
        setActiveChartTab(btnClimate);
        if (wrapperStation) wrapperStation.style.display = 'block';
        const sel = document.getElementById('geo-station-select');
        const stnVal = sel ? sel.value : 'entebbe';
        syncClimateStationPreset(stnVal);
        renderClimateChart(stnVal);
      });
    }

    if (btnPyramid) {
      btnPyramid.addEventListener('click', () => {
        currentChartType = 'pyramid';
        setActiveChartTab(btnPyramid);
        if (wrapperStation) wrapperStation.style.display = 'none';
        updateGraphingLabLink(6); // Demographic Transition preset
        renderPopulationPyramid();
      });
    }

    if (btnGlacier) {
      btnGlacier.addEventListener('click', () => {
        currentChartType = 'glacier';
        setActiveChartTab(btnGlacier);
        if (wrapperStation) wrapperStation.style.display = 'none';
        updateGraphingLabLink(4); // Rwenzori Glacial Recession preset
        renderGlacialRecessionChart();
      });
    }
  }

  function setActiveChartTab(activeBtn) {
    ['btn-tab-climate', 'btn-tab-pyramid', 'btn-tab-glacier'].forEach((id) => {
      const b = document.getElementById(id);
      if (b) b.classList.remove('active');
    });
    activeBtn.classList.add('active');
  }

  const FALLBACK_CURRICULUM = [
  {
    "code": "maps-cartography",
    "title": "Maps & Cartography",
    "category": "Foundations & Techniques",
    "icon": "fa-map-location-dot",
    "description": "Map reading, 4-figure and 6-figure grid references, compass bearings, scale conversion, contours, and elevation cross-sections.",
    "modes": [
      "2d_map",
      "contours",
      "cross_section",
      "grid_tools"
    ]
  },
  {
    "code": "gis-laboratory",
    "title": "GIS Laboratory",
    "category": "Foundations & Techniques",
    "icon": "fa-layer-group",
    "description": "Geographic Information Systems: spatial layers, attribute queries, buffer zones, spatial overlays, and thematic vector styling.",
    "modes": [
      "2d_map",
      "gis_layers",
      "buffer_query"
    ]
  },
  {
    "code": "physical-geography",
    "title": "Physical Geography & Earth Systems",
    "category": "Physical Geography",
    "icon": "fa-mountain-sun",
    "description": "Internal and external Earth forces, lithosphere, atmosphere, hydrosphere, biosphere, and global crustal structure.",
    "modes": [
      "2d_map",
      "3d_earth",
      "cross_section"
    ]
  },
  {
    "code": "geomorphology",
    "title": "Geomorphology & Landforms",
    "category": "Physical Geography",
    "icon": "fa-volcano",
    "description": "Tectonic processes, faulting (rift valleys, horsts/block mountains), folding (anticlines/synclines), and volcanism (shield, composite, calderas).",
    "modes": [
      "3d_landforms",
      "2d_map",
      "interactive_cross_section"
    ]
  },
  {
    "code": "weather-climate",
    "title": "Weather & Climate",
    "category": "Physical Geography",
    "icon": "fa-cloud-sun-rain",
    "description": "Atmospheric pressure, ITCZ migration, wind systems, rainfall types (orographic, convectional, frontal), weather station instruments, and climate graphs.",
    "modes": [
      "2d_map",
      "climate_chart",
      "weather_instruments"
    ]
  },
  {
    "code": "seasons-astronomy",
    "title": "Seasons & Earth-Sun Astronomy",
    "category": "Physical Geography",
    "icon": "fa-earth-africa",
    "description": "Earth rotation (day/night), axial tilt (23.5°), revolution around the Sun, equinoxes (March 21, Sept 23), solstices (June 21, Dec 22), and solar altitude.",
    "modes": [
      "3d_earth_sun",
      "solar_calculator",
      "time_zones"
    ]
  },
  {
    "code": "rivers-lakes",
    "title": "Rivers & Hydrology",
    "category": "Physical Geography",
    "icon": "fa-water",
    "description": "Drainage basins, river courses (youthful, mature, old stage), waterfalls, meanders, oxbow lakes, deltas, and river hydrographs.",
    "modes": [
      "2d_map",
      "river_profile",
      "hydrograph"
    ]
  },
  {
    "code": "oceans-coasts",
    "title": "Oceans & Coastal Geomorphology",
    "category": "Physical Geography",
    "icon": "fa-water-ladder",
    "description": "Ocean currents (cold Benguela, warm Agulhas/Mozambique), coastal landforms (spits, bars, cliffs, caves, tombolos), and coral reefs.",
    "modes": [
      "2d_map",
      "ocean_currents",
      "coastal_features"
    ]
  },
  {
    "code": "geology",
    "title": "Geology & Mineral Resources",
    "category": "Physical Geography",
    "icon": "fa-gem",
    "description": "Rock cycle (igneous, sedimentary, metamorphic), strata, mineral extraction in East Africa (copper/cobalt Kilembe, gold Karamoja, limestone Tororo, oil Albertine).",
    "modes": [
      "rock_cycle",
      "2d_map",
      "mineral_deposits"
    ]
  },
  {
    "code": "soils",
    "title": "Soil Science (Pedology)",
    "category": "Physical Geography",
    "icon": "fa-seedling",
    "description": "Soil profile horizons (O, A, B, C, R), soil texture triangle, catena concept in East African valleys, soil erosion, and conservation techniques.",
    "modes": [
      "soil_profile_3d",
      "texture_triangle",
      "2d_map"
    ]
  },
  {
    "code": "vegetation",
    "title": "Vegetation & Biomes",
    "category": "Physical Geography",
    "icon": "fa-tree",
    "description": "Tropical rainforests (Budongo, Mabira, Bwindi), savanna woodlands, montane vegetation altitudinal zonation (Rwenzori/Elgon), and arid scrub.",
    "modes": [
      "2d_map",
      "altitudinal_zonation",
      "biome_explorer"
    ]
  },
  {
    "code": "forestry",
    "title": "Forestry & Forest Conservation",
    "category": "Environmental Geography",
    "icon": "fa-tree-city",
    "description": "Central forest reserves, deforestation rates, agroforestry, reforestation initiatives, and sustainable timber management.",
    "modes": [
      "2d_map",
      "time_series_deforestation",
      "forest_stats"
    ]
  },
  {
    "code": "wildlife-conservation",
    "title": "Wildlife & Protected Areas",
    "category": "Environmental Geography",
    "icon": "fa-paw",
    "description": "National parks, wildlife reserves, biodiversity hotspots, endangered species (mountain gorillas Bwindi/Mgahinga), anti-poaching, and eco-corridors.",
    "modes": [
      "2d_map",
      "wildlife_census",
      "protected_boundaries"
    ]
  },
  {
    "code": "population",
    "title": "Population Geography",
    "category": "Human & Economic Geography",
    "icon": "fa-users",
    "description": "Demographic transition model, population density distribution, age-sex population pyramids, fertility, mortality, and migration streams.",
    "modes": [
      "2d_map",
      "population_pyramid",
      "density_choropleth"
    ]
  },
  {
    "code": "settlements",
    "title": "Settlement Geography",
    "category": "Human & Economic Geography",
    "icon": "fa-city",
    "description": "Rural settlement patterns (nucleated, dispersed, linear), urban hierarchy, Central Place Theory, Kampala urban growth, and land use models.",
    "modes": [
      "2d_map",
      "settlement_patterns",
      "urban_transect"
    ]
  },
  {
    "code": "agriculture",
    "title": "Agricultural Systems",
    "category": "Human & Economic Geography",
    "icon": "fa-wheat-awn",
    "description": "Subsistence farming, plantation agriculture (tea, sugarcane Kakira/Lugazi), nomadic pastoralism (Karamoja), dairy farming, and irrigation schemes (Doho, Kibimba, Mobuku).",
    "modes": [
      "2d_map",
      "crop_calendar",
      "farming_zones"
    ]
  },
  {
    "code": "industry",
    "title": "Industrial Development",
    "category": "Human & Economic Geography",
    "icon": "fa-industry",
    "description": "Factors influencing industrial location, industrial parks (Namanve, Jinja, Mbale), cottage industries, manufacturing value chains, and environmental impacts.",
    "modes": [
      "2d_map",
      "location_factors",
      "industrial_zones"
    ]
  },
  {
    "code": "transport",
    "title": "Transport & Communications",
    "category": "Human & Economic Geography",
    "icon": "fa-route",
    "description": "Road networks, Standard Gauge Railway corridors, inland water transport (Lake Victoria ferries), pipelines, and international air hubs (Entebbe).",
    "modes": [
      "2d_map",
      "corridor_analysis",
      "network_connectivity"
    ]
  },
  {
    "code": "tourism",
    "title": "Tourism & Heritage Geography",
    "category": "Human & Economic Geography",
    "icon": "fa-monument",
    "description": "Tourism circuits in Uganda and East Africa, Kasubi royal tombs, source of the River Nile, Rwenzori mountaineering, ecotourism, and revenue sharing.",
    "modes": [
      "2d_map",
      "tourist_circuits",
      "heritage_sites"
    ]
  },
  {
    "code": "environmental-geography",
    "title": "Environmental Geography & Climate Change",
    "category": "Environmental Geography",
    "icon": "fa-earth-americas",
    "description": "Land degradation, wetland encroachment (Lake Victoria shores), desertification, melting of Rwenzori glaciers (1906 vs today), and climate adaptation strategies.",
    "modes": [
      "2d_map",
      "glacier_comparison",
      "wetland_loss"
    ]
  },
  {
    "code": "fieldwork",
    "title": "Geographical Fieldwork & Virtual Excursions",
    "category": "Practical Fieldwork",
    "icon": "fa-compass",
    "description": "Fieldwork methodology: formulation of hypotheses, sampling methods, data collection tools (inclinometer, anemometer, transect walk), data recording, and reporting.",
    "modes": [
      "fieldwork_logger",
      "virtual_transect",
      "data_collector"
    ]
  },
  {
    "code": "geographical-data-analysis",
    "title": "Geographical Data Analysis & CBT Practice",
    "category": "Practical Fieldwork",
    "icon": "fa-chart-pie",
    "description": "Statistical analysis of geographic data: choropleths, isoline interpolation, flowline maps, scatter plots, and CBT exam practice with instant spatial auto-grading.",
    "modes": [
      "data_analytics",
      "cbt_quiz_mode",
      "isoline_generator"
    ]
  }
];

  async function loadCurriculumTopics() {
    // 1. Immediately populate from fallback to guarantee zero blank state
    if (!curriculumTopics || curriculumTopics.length === 0) {
      curriculumTopics = FALLBACK_CURRICULUM;
      renderTopicsSidebar(curriculumTopics);
      if (curriculumTopics.length > 0) {
        selectTopic(curriculumTopics[0]);
      }
    }

    // 2. Fetch fresh topics from server API if authenticated
    try {
      const res = await fetch('/api/geography/topics');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.topics && data.topics.length > 0) {
          curriculumTopics = data.topics;
          renderTopicsSidebar(curriculumTopics);
          const active = curriculumTopics.find(t => t.code === currentTopicCode) || curriculumTopics[0];
          selectTopic(active);
        }
      }
    } catch (err) {
      console.info('[GeographyLab] Running with standard embedded curriculum registry.');
    }
  }

  function renderTopicsSidebar(topics) {
    const container = document.getElementById('geo-topics-list');
    if (!container) return;

    container.innerHTML = '';
    const categories = {};

    topics.forEach((topic) => {
      if (!categories[topic.category]) {
        categories[topic.category] = [];
      }
      categories[topic.category].push(topic);
    });

    Object.keys(categories).forEach((catName) => {
      const catTitle = document.createElement('div');
      catTitle.className = 'geo-category-title';
      catTitle.textContent = catName;
      container.appendChild(catTitle);

      categories[catName].forEach((topic) => {
        const item = document.createElement('div');
        item.className = `geo-topic-item ${topic.code === currentTopicCode ? 'active' : ''}`;
        item.setAttribute('data-code', topic.code);
        item.innerHTML = `
          <i class="fa-solid ${topic.icon}"></i>
          <span>${topic.title}</span>
        `;
        item.addEventListener('click', () => {
          selectTopic(topic);
        });
        container.appendChild(item);
      });
    });
  }

  // ── Topic-specific map configurations ──
  const TOPIC_MAP_CONFIG = {
    'maps-cartography': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['relief', 'lakes', 'rivers', 'districts'],
      mode: 'map2d',
      help: 'Use the toolbar to measure distances, bearings, and cross-sections on the Uganda topographic sheet.'
    },
    'gis-laboratory': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['districts', 'parks', 'lakes', 'rivers'],
      mode: 'map2d',
      help: 'Toggle GIS overlay layers, apply attribute/spatial queries, and use buffer analysis tools.'
    },
    'physical-geography': {
      center: [1.3733, 32.2903], zoom: 6,
      layers: ['relief', 'lakes', 'rivers', 'rift', 'tectonics'],
      mode: 'map2d',
      help: 'Explore Earth systems: lithosphere (rift/tectonics), hydrosphere (lakes/rivers), and relief patterns.'
    },
    'geomorphology': {
      center: [0.3861, 29.8731], zoom: 8,
      layers: ['relief', 'rift'],
      mode: 'terrain3d', landform: 'rift_valley',
      help: 'Examine tectonic landforms in 3D: rift valleys, faults, folds, and volcanic cones.'
    },
    'weather-climate': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['relief'],
      mode: 'charts', chartTab: 'btn-tab-climate',
      help: 'Compare climate graphs for Entebbe, Gulu, Moroto, and Kabale. Use psychrometer & solar calculators.'
    },
    'seasons-astronomy': {
      center: [0.0, 32.0], zoom: 5,
      layers: [],
      mode: 'terrain3d', landform: 'earth_sun',
      help: 'Visualise Earth-Sun geometry: axial tilt 23.5°, equinoxes, solstices, and solar declination.'
    },
    'rivers-lakes': {
      center: [0.4244, 33.2042], zoom: 8,
      layers: ['lakes', 'rivers', 'relief'],
      mode: 'map2d',
      help: 'Trace the Victoria Nile from Jinja to Murchison Falls. Examine drainage basins and river features.'
    },
    'oceans-coasts': {
      center: [-4.0, 39.7], zoom: 5,
      layers: ['lakes', 'rivers'],
      mode: 'map2d',
      help: 'Study East African ocean currents (Benguela, Agulhas) and Indian Ocean coastal landforms.'
    },
    'geology': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['relief', 'rift'],
      mode: 'map2d',
      help: 'Locate mineral deposits: Kilembe copper, Karamoja gold, Tororo limestone, and Albertine oil reserves.'
    },
    'soils': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['relief', 'districts'],
      mode: 'map2d',
      help: 'Examine soil zones of Uganda: laterites, volcanic soils, alluvial deposits, and the catena concept.'
    },
    'vegetation': {
      center: [0.4, 30.0], zoom: 7,
      layers: ['parks', 'relief'],
      mode: 'map2d',
      help: 'Map vegetation types: tropical rainforest (Bwindi/Mabira), savanna woodland, and montane zones (Rwenzori/Elgon).'
    },
    'forestry': {
      center: [0.5, 31.5], zoom: 7,
      layers: ['parks', 'relief'],
      mode: 'map2d',
      help: 'Explore central forest reserves, deforestation patterns, and agroforestry conservation initiatives.'
    },
    'wildlife-conservation': {
      center: [2.2783, 31.6847], zoom: 7,
      layers: ['parks', 'lakes', 'rivers'],
      mode: 'map2d',
      help: "Map Uganda's 10 national parks, wildlife reserves, and biodiversity hotspots including mountain gorilla habitat."
    },
    'population': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['districts'],
      mode: 'charts', chartTab: 'btn-tab-pyramid',
      help: "Analyse Uganda's expansive population pyramid, demographic transition, and district density choropleth."
    },
    'settlements': {
      center: [0.3136, 32.5811], zoom: 10,
      layers: ['districts', 'relief'],
      mode: 'map2d',
      help: 'Examine Kampala urban growth, settlement hierarchy, and land use models (Burgess, Hoyt).'
    },
    'agriculture': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['districts', 'relief'],
      mode: 'map2d',
      help: 'Map agricultural zones: coffee, tea, sugarcane (Kakira/Lugazi), and irrigation schemes (Doho/Kibimba/Mobuku).'
    },
    'industry': {
      center: [0.3136, 32.5811], zoom: 9,
      layers: ['districts'],
      mode: 'map2d',
      help: 'Locate industrial parks (Namanve, Jinja, Mbale) and analyse factors influencing industrial location.'
    },
    'transport': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['districts', 'lakes', 'rivers'],
      mode: 'map2d',
      help: 'Trace the Northern Transport Corridor, SGR routes, Lake Victoria marine transport, and Entebbe airport.'
    },
    'tourism': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['parks', 'lakes', 'relief'],
      mode: 'map2d',
      help: 'Map tourist circuits: gorilla trekking (Bwindi), Murchison Falls, Source of the Nile, and Rwenzori mountaineering.'
    },
    'environmental-geography': {
      center: [0.3861, 29.8731], zoom: 8,
      layers: ['relief', 'parks'],
      mode: 'charts', chartTab: 'btn-tab-glacier',
      help: 'Analyse Rwenzori glacial recession (1906-2024), wetland encroachment, and climate adaptation strategies.'
    },
    'fieldwork': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['relief', 'rivers'],
      mode: 'fieldwork',
      help: 'Log fieldwork observations: site coordinates, elevation, measurements, and environmental data.'
    },
    'geographical-data-analysis': {
      center: [1.3733, 32.2903], zoom: 7,
      layers: ['districts'],
      mode: 'map2d',
      help: 'Practice CBT spatial questions: identify locations, interpret choropleths, and analyse geographic data.'
    }
  };

  function selectTopic(topic) {
    currentTopicCode = topic.code;

    document.querySelectorAll('.geo-topic-item').forEach((it) => {
      if (it.getAttribute('data-code') === topic.code) {
        it.classList.add('active');
      } else {
        it.classList.remove('active');
      }
    });

    const inspectorContent = document.getElementById('geo-inspector-content');
    if (inspectorContent) {
      inspectorContent.innerHTML = `
        <div style="font-size:16px; font-weight:700; color:#0F172A; margin-bottom:6px;">
          <i class="fa-solid ${topic.icon} text-primary me-2"></i> ${topic.title}
        </div>
        <div style="font-size:12px; color:#64748B; font-weight:600; text-transform:uppercase; margin-bottom:12px;">
          Category: ${topic.category}
        </div>
        <div style="font-size:13px; color:#334155; line-height:1.5; margin-bottom:16px;">
          ${topic.description}
        </div>
        <div class="card p-3 bg-light border-0 mb-3">
          <div style="font-size:12px; font-weight:700; color:#1E293B; margin-bottom:6px;">Supported Learning Modes:</div>
          <div class="d-flex flex-wrap gap-1">
            ${topic.modes.map((m) => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle">${m}</span>`).join(' ')}
          </div>
        </div>
        ${getTopicSpecificWidget(topic)}
        <button class="btn btn-primary btn-sm w-100 mt-2" id="btn-launch-topic-activity">
          <i class="fa-solid fa-play me-1"></i> Start Interactive Practice
        </button>
      `;

      const btnAct = document.getElementById('btn-launch-topic-activity');
      if (btnAct) {
        btnAct.addEventListener('click', () => {
          startInteractiveQuizForTopic(topic);
        });
      }

      // Bind topic-specific interactive widgets
      bindTopicWidgetControls(topic);
    }

    // Apply topic-specific configuration
    const config = TOPIC_MAP_CONFIG[topic.code];
    if (config) {
      // Switch to the appropriate mode
      switchActiveMode(config.mode);

      // If mode is map2d, fly to location and set layers
      if (config.mode === 'map2d' && mapEngine) {
        mapEngine.flyTo(config.center[0], config.center[1], config.zoom);
        applyTopicLayers(config.layers);
      }

      // If mode is terrain3d, render the appropriate landform
      if (config.mode === 'terrain3d' && config.landform && threeEngine) {
        const sel3D = document.getElementById('geo-3d-model-select');
        if (sel3D) sel3D.value = config.landform;
        threeEngine.renderLandform(config.landform);
      }

      // If mode is charts, click the appropriate tab
      if (config.mode === 'charts' && config.chartTab) {
        const b = document.getElementById(config.chartTab);
        if (b) b.click();
      }

      // Show contextual help
      if (config.help) {
        showToolbarHelp(config.help);
      }
    } else {
      switchActiveMode('map2d');
    }
  }

  // Apply topic-specific overlay layers (enable listed, disable unlisted)
  function applyTopicLayers(layerKeys) {
    const allLayerKeys = ['relief', 'lakes', 'rivers', 'parks', 'rift', 'tectonics', 'districts'];
    allLayerKeys.forEach((key) => {
      const shouldShow = layerKeys.includes(key);
      if (mapEngine) {
        mapEngine.toggleOverlay(key, shouldShow);
      }
      // Also sync the checkbox state
      const chk = document.getElementById('layer-chk-' + key);
      if (chk) chk.checked = shouldShow;
    });
  }

  // Generate topic-specific inspector widget HTML
  function getTopicSpecificWidget(topic) {
    switch (topic.code) {
      case 'maps-cartography':
        return `
          <div class="card border-primary-subtle p-2 mb-2">
            <div class="small fw-bold text-primary mb-1"><i class="fa-solid fa-map me-1"></i> Cartography Quick Reference</div>
            <div class="small text-muted">
              <strong>Grid Ref:</strong> Eastings (across) then Northings (up)<br>
              <strong>Scale:</strong> 1:50,000 → 2 cm = 1 km<br>
              <strong>Contour Interval:</strong> 20 m<br>
              <strong>Bearing:</strong> Measure clockwise from True North
            </div>
          </div>
        `;
      case 'gis-laboratory':
        return `
          <div class="card border-info p-2 mb-2">
            <div class="small fw-bold text-info mb-1"><i class="fa-solid fa-layer-group me-1"></i> GIS Operations</div>
            <div class="d-flex flex-wrap gap-1">
              <button class="btn btn-outline-info btn-sm geo-gis-op" data-op="buffer">Buffer Zone</button>
              <button class="btn btn-outline-info btn-sm geo-gis-op" data-op="query">Attribute Query</button>
              <button class="btn btn-outline-info btn-sm geo-gis-op" data-op="overlay">Spatial Overlay</button>
            </div>
          </div>
        `;
      case 'geology':
        return `
          <div class="card border-warning-subtle p-2 mb-2">
            <div class="small fw-bold text-dark mb-1"><i class="fa-solid fa-gem me-1"></i> Rock Cycle</div>
            <div class="small text-muted">
              <strong>Igneous:</strong> Granite (intrusive), Basalt (extrusive)<br>
              <strong>Sedimentary:</strong> Sandstone, Limestone, Shale<br>
              <strong>Metamorphic:</strong> Marble, Slate, Quartzite<br>
              <em>Weathering → Erosion → Deposition → Compaction → Cementation</em>
            </div>
          </div>
        `;
      case 'soils':
        return `
          <div class="card border-success-subtle p-2 mb-2">
            <div class="small fw-bold text-success mb-1"><i class="fa-solid fa-seedling me-1"></i> Soil Profile Horizons</div>
            <div class="d-flex align-items-start gap-2">
              <div style="width:24px;text-align:center;">
                <div style="height:12px;background:#2D1B0E;border-radius:3px 3px 0 0;" title="O - Organic"></div>
                <div style="height:16px;background:#5C3A1E;" title="A - Topsoil"></div>
                <div style="height:20px;background:#8B6914;" title="B - Subsoil"></div>
                <div style="height:16px;background:#A0A0A0;" title="C - Parent Material"></div>
                <div style="height:10px;background:#666;border-radius:0 0 3px 3px;" title="R - Bedrock"></div>
              </div>
              <div class="small text-muted">
                <strong>O</strong> – Organic litter<br>
                <strong>A</strong> – Dark topsoil (humus)<br>
                <strong>B</strong> – Subsoil (leached minerals)<br>
                <strong>C</strong> – Weathered parent material<br>
                <strong>R</strong> – Bedrock
              </div>
            </div>
          </div>
        `;
      case 'rivers-lakes':
        return `
          <div class="card border-primary-subtle p-2 mb-2">
            <div class="small fw-bold text-primary mb-1"><i class="fa-solid fa-water me-1"></i> River Course Stages</div>
            <div class="small text-muted">
              <strong>Upper:</strong> V-shaped valleys, waterfalls, interlocking spurs<br>
              <strong>Middle:</strong> Meanders, floodplains, lateral erosion<br>
              <strong>Lower:</strong> Oxbow lakes, deltas, levées, deposition
            </div>
            <button class="btn btn-outline-primary btn-sm mt-1 w-100" id="btn-show-hydrograph">
              <i class="fa-solid fa-chart-area me-1"></i> Open Storm Hydrograph
            </button>
          </div>
        `;
      case 'oceans-coasts':
        return `
          <div class="card border-info p-2 mb-2">
            <div class="small fw-bold text-info mb-1"><i class="fa-solid fa-anchor me-1"></i> Ocean Currents</div>
            <div class="small text-muted">
              <strong>Cold:</strong> Benguela Current (SW Africa)<br>
              <strong>Warm:</strong> Agulhas Current (SE Africa), Mozambique Current<br>
              <strong>Coastal features:</strong> Spit, Bar, Tombolo, Stack, Cave, Arch
            </div>
          </div>
        `;
      case 'vegetation':
        return `
          <div class="card border-success-subtle p-2 mb-2">
            <div class="small fw-bold text-success mb-1"><i class="fa-solid fa-tree me-1"></i> Altitudinal Zonation (Rwenzori)</div>
            <div class="small text-muted">
              <strong>0–1,500 m:</strong> Tropical Rainforest<br>
              <strong>1,500–2,500 m:</strong> Bamboo Zone<br>
              <strong>2,500–3,500 m:</strong> Hagenia-Rapanea Zone<br>
              <strong>3,500–4,500 m:</strong> Afro-alpine Heath & Lobelia<br>
              <strong>4,500+ m:</strong> Glacial/Nival Zone
            </div>
          </div>
        `;
      case 'forestry':
        return `
          <div class="card border-success-subtle p-2 mb-2">
            <div class="small fw-bold text-success mb-1"><i class="fa-solid fa-tree-city me-1"></i> Forest Conservation</div>
            <div class="small text-muted">
              Uganda forest cover declined from <strong>24%</strong> (1990) to <strong>9%</strong> (2024).<br>
              Key reserves: Budongo, Mabira, Bugoma, Bwindi Impenetrable.<br>
              Initiatives: REDD+, NFA tree planting, agroforestry.
            </div>
          </div>
        `;
      case 'wildlife-conservation':
        return `
          <div class="card border-success-subtle p-2 mb-2">
            <div class="small fw-bold text-success mb-1"><i class="fa-solid fa-paw me-1"></i> National Parks (10)</div>
            <div class="small text-muted">
              Murchison Falls, Queen Elizabeth, Bwindi Impenetrable, Mgahinga, Kibale,
              Lake Mburo, Kidepo Valley, Rwenzori Mountains, Mt Elgon, Semuliki.
            </div>
          </div>
        `;
      case 'settlements':
        return `
          <div class="card border-secondary-subtle p-2 mb-2">
            <div class="small fw-bold text-dark mb-1"><i class="fa-solid fa-city me-1"></i> Settlement Models</div>
            <div class="small text-muted">
              <strong>Burgess:</strong> Concentric Zone Model<br>
              <strong>Hoyt:</strong> Sector Model<br>
              <strong>Harris-Ullman:</strong> Multiple Nuclei Model<br>
              <strong>Patterns:</strong> Nucleated, Dispersed, Linear
            </div>
          </div>
        `;
      case 'agriculture':
        return `
          <div class="card border-warning-subtle p-2 mb-2">
            <div class="small fw-bold text-dark mb-1"><i class="fa-solid fa-wheat-awn me-1"></i> Key Crops & Zones</div>
            <div class="small text-muted">
              <strong>Central:</strong> Coffee (Robusta), Matooke, Maize<br>
              <strong>Eastern:</strong> Sugarcane (Kakira/Lugazi), Rice<br>
              <strong>Western:</strong> Tea, Coffee (Arabica), Irish Potatoes<br>
              <strong>Northern:</strong> Cotton, Simsim, Sorghum
            </div>
          </div>
        `;
      case 'industry':
        return `
          <div class="card border-secondary-subtle p-2 mb-2">
            <div class="small fw-bold text-dark mb-1"><i class="fa-solid fa-industry me-1"></i> Industrial Parks</div>
            <div class="small text-muted">
              <strong>Namanve:</strong> Kampala (mixed manufacturing)<br>
              <strong>Jinja:</strong> Historical industrial town<br>
              <strong>Mbale:</strong> Eastern industrial zone<br>
              <strong>Factors:</strong> Raw materials, labour, market, transport, power, capital
            </div>
          </div>
        `;
      case 'transport':
        return `
          <div class="card border-primary-subtle p-2 mb-2">
            <div class="small fw-bold text-primary mb-1"><i class="fa-solid fa-route me-1"></i> Transport Network</div>
            <div class="small text-muted">
              <strong>Northern Corridor:</strong> Mombasa → Kampala → Kigali<br>
              <strong>SGR:</strong> Standard Gauge Railway project<br>
              <strong>Marine:</strong> Lake Victoria ferry services<br>
              <strong>Air:</strong> Entebbe International Airport
            </div>
          </div>
        `;
      case 'tourism':
        return `
          <div class="card border-warning-subtle p-2 mb-2">
            <div class="small fw-bold text-dark mb-1"><i class="fa-solid fa-monument me-1"></i> Tourist Circuits</div>
            <div class="small text-muted">
              <strong>Western:</strong> Bwindi gorillas, Queen Elizabeth NP<br>
              <strong>Northern:</strong> Murchison Falls, Kidepo Valley<br>
              <strong>Central:</strong> Source of Nile, Kampala heritage<br>
              <strong>Eastern:</strong> Mt Elgon, Sipi Falls
            </div>
          </div>
        `;
      case 'seasons-astronomy':
        return `
          <div class="card border-warning-subtle p-2 mb-2">
            <div class="small fw-bold text-dark mb-1"><i class="fa-solid fa-earth-africa me-1"></i> Key Dates</div>
            <div class="small text-muted">
              <strong>March 21:</strong> Vernal Equinox (Sun at Equator 0°)<br>
              <strong>June 21:</strong> Solstice (Sun at 23.5°N)<br>
              <strong>Sept 23:</strong> Autumnal Equinox (Sun at Equator 0°)<br>
              <strong>Dec 22:</strong> Solstice (Sun at 23.5°S)<br>
              <strong>Axial Tilt:</strong> 23.5° → Seasons
            </div>
            <button class="btn btn-outline-warning btn-sm mt-1 w-100" id="btn-open-solar-calc">
              <i class="fa-solid fa-sun me-1"></i> Open Solar Calculator
            </button>
          </div>
        `;
      case 'weather-climate':
        return `
          <div class="card border-info p-2 mb-2">
            <div class="small fw-bold text-info mb-1"><i class="fa-solid fa-cloud-sun-rain me-1"></i> Weather Instruments</div>
            <div class="small text-muted">
              <strong>Rain Gauge:</strong> Precipitation (mm)<br>
              <strong>Thermometer:</strong> Max/Min temperature (°C)<br>
              <strong>Barometer:</strong> Atmospheric pressure (hPa)<br>
              <strong>Anemometer:</strong> Wind speed (m/s)
            </div>
            <button class="btn btn-outline-info btn-sm mt-1 w-100" id="btn-open-weather-modal">
              <i class="fa-solid fa-temperature-half me-1"></i> Open Weather Station
            </button>
          </div>
        `;
      case 'geographical-data-analysis':
        return `
          <div class="card border-primary-subtle p-2 mb-2">
            <div class="small fw-bold text-primary mb-1"><i class="fa-solid fa-chart-pie me-1"></i> Data Analysis Methods</div>
            <div class="small text-muted">
              <strong>Choropleth:</strong> Density shading by region<br>
              <strong>Isoline:</strong> Contour interpolation<br>
              <strong>Flowline:</strong> Migration/trade flow maps<br>
              <strong>Scatter Plot:</strong> Correlation analysis
            </div>
          </div>
        `;
      default:
        return '';
    }
  }

  // Bind interactive controls within topic-specific widgets
  function bindTopicWidgetControls(topic) {
    if (topic.code === 'rivers-lakes') {
      const btn = document.getElementById('btn-show-hydrograph');
      if (btn) {
        btn.addEventListener('click', () => {
          const modal = document.getElementById('modal-geo-weather-hydro');
          if (modal) {
            const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.show();
            // Switch to hydrograph tab
            const tabHydro = document.getElementById('tab-hydrograph');
            if (tabHydro) {
              const bsTab = bootstrap.Tab.getOrCreateInstance(tabHydro);
              bsTab.show();
            }
          }
        });
      }
    }

    if (topic.code === 'seasons-astronomy') {
      const btn = document.getElementById('btn-open-solar-calc');
      if (btn) {
        btn.addEventListener('click', () => {
          const modal = document.getElementById('modal-geo-weather-hydro');
          if (modal) {
            const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.show();
            const tabSolar = document.getElementById('tab-solar');
            if (tabSolar) {
              const bsTab = bootstrap.Tab.getOrCreateInstance(tabSolar);
              bsTab.show();
            }
          }
        });
      }
    }

    if (topic.code === 'weather-climate') {
      const btn = document.getElementById('btn-open-weather-modal');
      if (btn) {
        btn.addEventListener('click', () => {
          const modal = document.getElementById('modal-geo-weather-hydro');
          if (modal) {
            const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.show();
          }
        });
      }
    }

    if (topic.code === 'gis-laboratory') {
      document.querySelectorAll('.geo-gis-op').forEach((btn) => {
        btn.addEventListener('click', () => {
          const op = btn.dataset.op;
          if (op === 'buffer' && mapEngine) {
            mapEngine.setTool('buffer_tool');
            showToolbarHelp('Click on the map to generate a proximity buffer zone.');
          } else if (op === 'query') {
            const modal = document.getElementById('modal-gis-query');
            if (modal) {
              const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
              bsModal.show();
            }
          } else if (op === 'overlay') {
            showToolbarHelp('Toggle layer checkboxes to overlay multiple spatial datasets for visual intersection analysis.');
          }
        });
      });
    }
  }

  function showFeatureDetails(feature) {
    const inspectorContent = document.getElementById('geo-inspector-content');
    if (!inspectorContent) return;

    if (feature.type === 'cbt_answer') {
      inspectorContent.innerHTML = `
        <div class="alert ${feature.isCorrect ? 'alert-success' : 'alert-warning'} border mb-3">
          <h6 class="alert-heading fw-bold mb-1">
            ${feature.isCorrect ? '✓ Correct Location Identified!' : '❌ Location Outside Tolerance'}
          </h6>
          <p class="mb-0 small">
            Distance from target: <strong>${feature.distanceKm} km</strong><br>
            Tolerance allowed: ${feature.target.toleranceKm || 25} km
          </p>
        </div>
        <div class="card p-3 border mb-3">
          <div class="fw-bold text-dark mb-1">Target Feature: ${feature.target.name}</div>
          <div class="small text-muted mb-2">Target Coords: ${feature.target.lat.toFixed(4)}°N, ${feature.target.lng.toFixed(4)}°E</div>
          <div class="small text-muted">Your Dropped Pin: ${feature.studentLat.toFixed(4)}°N, ${feature.studentLng.toFixed(4)}°E</div>
        </div>
      `;
      return;
    }

    inspectorContent.innerHTML = `
      <div style="font-size:16px; font-weight:700; color:#0F172A; margin-bottom:4px;">${feature.name}</div>
      <div style="font-size:12px; color:#2563EB; font-weight:600; margin-bottom:12px;">${feature.type || 'Geographic Entity'}</div>
      
      ${feature.elevationM ? `<div class="mb-2 small"><strong>Elevation:</strong> ${feature.elevationM.toLocaleString()} m</div>` : ''}
      ${feature.surfaceAreaKm2 ? `<div class="mb-2 small"><strong>Surface Area:</strong> ${feature.surfaceAreaKm2.toLocaleString()} km²</div>` : ''}
      ${feature.areaKm2 ? `<div class="mb-2 small"><strong>Area:</strong> ${feature.areaKm2.toLocaleString()} km²</div>` : ''}
      ${feature.popDensityPerKm2 ? `<div class="mb-2 small"><strong>Density:</strong> ${feature.popDensityPerKm2.toLocaleString()} /km²</div>` : ''}

      <div class="small text-secondary mb-3" style="line-height:1.4;">${feature.description || ''}</div>

      <div class="p-2 bg-light rounded border small mb-3">
        <strong>Coordinates:</strong> ${feature.lat.toFixed(4)}°N, ${feature.lng.toFixed(4)}°E
      </div>

      <button class="btn btn-outline-primary btn-sm w-100" id="btn-zoom-feature">
        <i class="fa-solid fa-magnifying-glass-plus me-1"></i> Center & Zoom Here
      </button>
    `;

    const btnZoom = document.getElementById('btn-zoom-feature');
    if (btnZoom) {
      btnZoom.addEventListener('click', () => {
        mapEngine.flyTo(feature.lat, feature.lng, 11);
      });
    }
  }

  function renderElevationCrossSection(profile) {
    const modalEl = document.getElementById('modal-geo-cross-section');
    if (!modalEl) return;

    const bsModal = new bootstrap.Modal(modalEl);
    bsModal.show();

    const canvas = document.getElementById('geo-cross-section-canvas');
    const statsEl = document.getElementById('geo-cross-section-stats');

    if (statsEl) {
      statsEl.innerHTML = `
        <div class="row g-2 text-center">
          <div class="col-3 p-2 bg-light rounded border">
            <div class="small text-muted">Distance</div>
            <div class="fw-bold text-dark">${profile.distanceTotalKm} km</div>
          </div>
          <div class="col-3 p-2 bg-light rounded border">
            <div class="small text-muted">Vertical Interval (VI)</div>
            <div class="fw-bold text-primary">${profile.verticalIntervalM} m</div>
          </div>
          <div class="col-3 p-2 bg-light rounded border">
            <div class="small text-muted">Slope Gradient</div>
            <div class="fw-bold text-danger">${profile.gradientText}</div>
          </div>
          <div class="col-3 p-2 bg-light rounded border">
            <div class="small text-muted">Slope %</div>
            <div class="fw-bold text-success">${profile.slopePercent}%</div>
          </div>
        </div>
      `;
    }

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 60, padR = 40, padT = 30, padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const points = profile.profilePoints;
    if (!points || points.length === 0) return;

    let minElev = 800;
    let maxElev = 3500;
    points.forEach((p) => {
      if (p.elevationM < minElev) minElev = p.elevationM - 100;
      if (p.elevationM > maxElev) maxElev = p.elevationM + 200;
    });

    ctx.beginPath();
    ctx.fillStyle = 'rgba(124, 58, 237, 0.15)';
    ctx.strokeStyle = '#7C3AED';
    ctx.lineWidth = 3;

    points.forEach((p, idx) => {
      const x = padL + (p.distanceKm / (profile.distanceTotalKm || 1)) * chartW;
      const y = height - padB - ((p.elevationM - minElev) / (maxElev - minElev)) * chartH;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const lastX = padL + chartW;
    const baselineY = height - padB;
    ctx.lineTo(lastX, baselineY);
    ctx.lineTo(padL, baselineY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#94A3B8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, height - padB);
    ctx.lineTo(width - padR, height - padB);
    ctx.stroke();

    ctx.fillStyle = '#64748B';
    ctx.font = '10px monospace';
    ctx.textAlign = 'right';
    for (let e = minElev; e <= maxElev; e += 500) {
      const y = height - padB - ((e - minElev) / (maxElev - minElev)) * chartH;
      ctx.fillText(`${e}m`, padL - 6, y + 4);
    }
  }

  function showBufferAnalysisResults(data) {
    const inspectorContent = document.getElementById('geo-inspector-content');
    if (!inspectorContent) return;

    inspectorContent.innerHTML = `
      <div class="card border-warning p-3 mb-3">
        <h6 class="fw-bold text-dark mb-1"><i class="fa-solid fa-circle-dot text-warning me-1"></i> GIS Proximity Buffer (${data.radiusKm} km)</h6>
        <div class="small text-muted mb-2">Center: ${data.centerLat.toFixed(4)}°N, ${data.centerLng.toFixed(4)}°E</div>
        <div class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle mb-3" style="width:fit-content;">
          Found ${data.intersectingCount} Intersecting Features
        </div>

        <div class="list-group list-group-flush border-top border-bottom small" style="max-height:260px; overflow-y:auto;">
          ${data.features.map((f) => `
            <div class="list-group-item d-flex justify-content-between align-items-center px-0 py-2">
              <div>
                <strong class="text-dark">${f.name}</strong><br>
                <span class="text-muted">${f.category}</span>
              </div>
              <span class="badge bg-light text-secondary border">${f.distanceKm} km away</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function setupGisFilterControls() {
    const selRegion = document.getElementById('gis-filter-region');
    const inputMinDens = document.getElementById('gis-filter-density');
    const btnApplyGis = document.getElementById('btn-apply-gis-filter');
    const btnResetGis = document.getElementById('btn-reset-gis-filter');

    if (btnApplyGis) {
      btnApplyGis.addEventListener('click', () => {
        const region = selRegion ? selRegion.value : 'all';
        const minDens = inputMinDens ? parseInt(inputMinDens.value, 10) || 0 : 0;

        mapEngine.populateDistricts((d) => {
          const matchRegion = region === 'all' || d.region === region;
          const matchDens = d.popDensityPerKm2 >= minDens;
          return matchRegion && matchDens;
        });

        showToolbarHelp(`GIS Filter Applied: ${region.toUpperCase()} region | Min Density: ${minDens}/km²`);
      });
    }

    if (btnResetGis) {
      btnResetGis.addEventListener('click', () => {
        if (selRegion) selRegion.value = 'all';
        if (inputMinDens) inputMinDens.value = '';
        mapEngine.populateDistricts();
        showToolbarHelp('GIS district filters reset.');
      });
    }
  }

  function setupWeatherAndHydroControls() {
    if (!window.GeoWeatherHydro) return;

    const rangeDry = document.getElementById('range-dry-bulb');
    const rangeWet = document.getElementById('range-wet-bulb');
    const valDry = document.getElementById('val-dry-bulb');
    const valWet = document.getElementById('val-wet-bulb');

    function updateHygrometer() {
      if (!rangeDry || !rangeWet) return;
      let dry = parseFloat(rangeDry.value);
      let wet = parseFloat(rangeWet.value);
      if (wet > dry) {
        wet = dry;
        rangeWet.value = dry;
      }
      if (valDry) valDry.textContent = dry;
      if (valWet) valWet.textContent = wet;

      const res = window.GeoWeatherHydro.calculateRelativeHumidity(dry, wet);
      const elDep = document.getElementById('res-depression');
      const elRh = document.getElementById('res-rh');
      const elDew = document.getElementById('res-dew-point');
      const elComfort = document.getElementById('res-comfort-badge');

      if (elDep) elDep.textContent = `${res.wetBulbDepressionC}°C`;
      if (elRh) elRh.textContent = `${res.relativeHumidityPercent}%`;
      if (elDew) elDew.textContent = `${res.dewPointC}°C`;
      if (elComfort) elComfort.innerHTML = `<i class="fa-solid fa-circle-check me-1"></i> Comfort Level: <strong>${res.comfortLevel}</strong>`;
    }

    if (rangeDry) rangeDry.addEventListener('input', updateHygrometer);
    if (rangeWet) rangeWet.addEventListener('input', updateHygrometer);

    const rangeLat = document.getElementById('range-solar-lat');
    const rangeDay = document.getElementById('range-solar-day');
    const valLat = document.getElementById('val-solar-lat');
    const valDay = document.getElementById('val-solar-day');

    function updateSolar() {
      if (!rangeLat || !rangeDay) return;
      const lat = parseFloat(rangeLat.value);
      const day = parseInt(rangeDay.value, 10);
      if (valLat) valLat.textContent = lat;
      if (valDay) valDay.textContent = day;

      const res = window.GeoWeatherHydro.calculateSolarPosition(lat, day);
      const elDec = document.getElementById('res-declination');
      const elAlt = document.getElementById('res-noon-alt');
      const elLen = document.getElementById('res-day-length');
      const elSeason = document.getElementById('res-season-name');

      if (elDec) elDec.textContent = `${res.declinationDeg}°`;
      if (elAlt) elAlt.textContent = `${res.solarNoonAltitudeDeg}°`;
      if (elLen) elLen.textContent = `${res.dayLengthHours}h`;
      if (elSeason) elSeason.innerHTML = `<i class="fa-solid fa-sun me-1"></i> Season / Position: <strong>${res.seasonName}</strong>`;
    }

    if (rangeLat) rangeLat.addEventListener('input', updateSolar);
    if (rangeDay) rangeDay.addEventListener('input', updateSolar);

    const selBasin = document.getElementById('sel-basin-type');
    const rangeRain = document.getElementById('range-storm-rain');
    const valRain = document.getElementById('val-storm-rain');

    function updateHydrograph() {
      if (!rangeRain || !selBasin) return;
      const rain = parseFloat(rangeRain.value);
      const basin = selBasin.value;
      if (valRain) valRain.textContent = rain;

      const res = window.GeoWeatherHydro.generateStormHydrograph(rain, basin);
      const elLag = document.getElementById('res-lag-time');
      const elPeak = document.getElementById('res-peak-q');
      if (elLag) elLag.textContent = `${res.lagTimeHours} hrs`;
      if (elPeak) elPeak.textContent = `${res.peakDischargeCumecs} m³/s`;

      drawHydrographCanvas(res);
    }

    if (selBasin) selBasin.addEventListener('change', updateHydrograph);
    if (rangeRain) rangeRain.addEventListener('input', updateHydrograph);

    updateHygrometer();
    updateSolar();
    updateHydrograph();
  }

  function drawHydrographCanvas(res) {
    const canvas = document.getElementById('canvas-storm-hydrograph');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 60, padR = 60, padT = 30, padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const maxDischarge = Math.max(150, res.peakDischargeCumecs * 1.25);
    const maxRain = 100;
    const steps = res.timeStepsHours.length;
    const colStep = chartW / (steps - 1);

    ctx.fillStyle = 'rgba(2, 132, 199, 0.5)';
    res.rainfallSeries.forEach((rain, i) => {
      if (rain > 0) {
        const x = padL + i * colStep - 6;
        const barH = (rain / maxRain) * (chartH * 0.45);
        ctx.fillRect(x, padT, 12, barH);
      }
    });

    const baseY = height - padB - (res.baseFlowCumecs / maxDischarge) * chartH;
    ctx.strokeStyle = '#94A3B8';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padL, baseY);
    ctx.lineTo(width - padR, baseY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#64748B';
    ctx.font = '10px sans-serif';
    ctx.fillText('Baseflow', padL + 4, baseY - 4);

    ctx.beginPath();
    ctx.strokeStyle = '#2563EB';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';

    res.dischargeSeries.forEach((q, i) => {
      const x = padL + i * colStep;
      const y = height - padB - (q / maxDischarge) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastX = padL + (steps - 1) * colStep;
    ctx.lineTo(lastX, height - padB);
    ctx.lineTo(padL, height - padB);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const peakIdx = res.dischargeSeries.indexOf(res.peakDischargeCumecs);
    const peakX = padL + peakIdx * colStep;
    const peakY = height - padB - (res.peakDischargeCumecs / maxDischarge) * chartH;
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`Peak Q: ${res.peakDischargeCumecs} m³/s`, peakX - 25, peakY - 8);

    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, height - padB);
    ctx.lineTo(width - padR, height - padB);
    ctx.stroke();

    ctx.fillStyle = '#2563EB';
    ctx.textAlign = 'right';
    for (let q = 0; q <= maxDischarge; q += 50) {
      const y = height - padB - (q / maxDischarge) * chartH;
      ctx.fillText(`${q}`, padL - 8, y + 4);
    }
    ctx.fillText('Q (m³/s)', padL - 8, padT - 8);

    ctx.fillStyle = '#0284C7';
    ctx.textAlign = 'left';
    for (let r = 0; r <= 80; r += 20) {
      const y = padT + (r / maxRain) * (chartH * 0.45);
      ctx.fillText(`${r} mm`, width - padR + 8, y + 4);
    }

    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'center';
    for (let h = 0; h <= 24; h += 4) {
      const x = padL + h * colStep;
      ctx.fillText(`${h}h`, x, height - padB + 16);
    }
  }

  function renderPopulationPyramid() {
    if (!window.GeoDatasets || !window.GeoDatasets.UGANDA_DEMOGRAPHICS) return;
    const demo = window.GeoDatasets.UGANDA_DEMOGRAPHICS;

    const chartTitle = document.getElementById('geo-climate-chart-title');
    const chartDesc = document.getElementById('geo-climate-chart-desc');
    const legend = document.getElementById('geo-chart-legend');
    const canvas = document.getElementById('geo-climate-canvas');

    if (chartTitle) chartTitle.textContent = `Uganda Age-Sex Population Pyramid (2024 Census)`;
    if (chartDesc) chartDesc.textContent = `Broad-based expansive structure: Median Age ${demo.medianAgeYears} years | Youth Dependency Ratio: ${demo.dependencyRatioPercent}% | Total Pop: ${demo.totalPopulationMillions}M.`;

    if (legend) {
      legend.innerHTML = `
        <span class="fw-bold" style="color:#2563EB;"><i class="fa-solid fa-square text-primary"></i> Male (%)</span>
        <span class="fw-bold ms-4" style="color:#DC2626;"><i class="fa-solid fa-square text-danger"></i> Female (%)</span>
      `;
    }

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 40, padR = 40, padT = 30, padB = 30;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const centerX = padL + chartW / 2;

    const cohorts = demo.cohorts;
    const rowH = chartH / cohorts.length;
    const maxPercent = 10;

    cohorts.forEach((cohort, idx) => {
      // Draw from bottom up (youngest at bottom)
      const rowIdx = cohorts.length - 1 - idx;
      const y = padT + rowIdx * rowH + 2;
      const barH = rowH - 4;

      // Male Bar (left of center)
      const maleW = (cohort.malePercent / maxPercent) * (chartW / 2 - 40);
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(centerX - 35 - maleW, y, maleW, barH);

      // Female Bar (right of center)
      const femaleW = (cohort.femalePercent / maxPercent) * (chartW / 2 - 40);
      ctx.fillStyle = '#DC2626';
      ctx.fillRect(centerX + 35, y, femaleW, barH);

      // Cohort Age Label in Center
      ctx.fillStyle = '#0F172A';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(cohort.age, centerX, y + barH * 0.75);
    });

    // Center vertical divider
    ctx.strokeStyle = '#94A3B8';
    ctx.beginPath();
    ctx.moveTo(centerX, padT);
    ctx.lineTo(centerX, height - padB);
    ctx.stroke();
  }

  function renderGlacialRecessionChart() {
    if (!window.GeoDatasets || !window.GeoDatasets.RWENZORI_GLACIER_RECESSION) return;
    const series = window.GeoDatasets.RWENZORI_GLACIER_RECESSION;

    const chartTitle = document.getElementById('geo-climate-chart-title');
    const chartDesc = document.getElementById('geo-climate-chart-desc');
    const legend = document.getElementById('geo-chart-legend');
    const canvas = document.getElementById('geo-climate-canvas');

    if (chartTitle) chartTitle.textContent = 'Rwenzori Mountains Glacial Recession (1906 - 2024)';
    if (chartDesc) chartDesc.textContent = 'Severe tropical alpine glacier retreat due to regional warming: loss of over 95% surface area since Duke of the Abruzzi survey.';

    if (legend) {
      legend.innerHTML = `
        <span class="text-info fw-bold"><i class="fa-solid fa-snowflake text-info"></i> Ice Surface Area (km²)</span>
      `;
    }

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const padL = 70, padR = 50, padT = 30, padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const minYear = 1900;
    const maxYear = 2030;
    const maxArea = 8.0;

    // Draw Curve
    ctx.beginPath();
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 3;
    ctx.fillStyle = 'rgba(2, 132, 199, 0.15)';

    series.forEach((pt, i) => {
      const x = padL + ((pt.year - minYear) / (maxYear - minYear)) * chartW;
      const y = height - padB - (pt.areaKm2 / maxArea) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    const lastPt = series[series.length - 1];
    const lastX = padL + ((lastPt.year - minYear) / (maxYear - minYear)) * chartW;
    const firstPt = series[0];
    const firstX = padL + ((firstPt.year - minYear) / (maxYear - minYear)) * chartW;

    ctx.lineTo(lastX, height - padB);
    ctx.lineTo(firstX, height - padB);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Data points & badges
    series.forEach((pt) => {
      const x = padL + ((pt.year - minYear) / (maxYear - minYear)) * chartW;
      const y = height - padB - (pt.areaKm2 / maxArea) * chartH;

      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0F172A';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${pt.areaKm2} km²`, x, y - 10);
      ctx.fillText(`${pt.year}`, x, height - padB + 16);
    });

    // Y Axis
    ctx.fillStyle = '#0284C7';
    ctx.textAlign = 'right';
    for (let a = 0; a <= maxArea; a += 2) {
      const y = height - padB - (a / maxArea) * chartH;
      ctx.fillText(`${a} km²`, padL - 8, y + 4);
    }
  }

  function startInteractiveQuizForTopic(topic) {
    switchActiveMode('map2d');

    // Topic-specific quiz targets for accurate CBT spatial assessment
    const TOPIC_QUIZ_TARGETS = {
      'maps-cartography': [
        { name: 'Mount Stanley (Margherita Peak)', lat: 0.3861, lng: 29.8731, toleranceKm: 25 },
        { name: 'Source of the River Nile (Jinja)', lat: 0.4244, lng: 33.2042, toleranceKm: 20 },
        { name: 'Murchison Falls (Nile Knickpoint)', lat: 2.2783, lng: 31.6847, toleranceKm: 25 }
      ],
      'gis-laboratory': [
        { name: 'Kampala Central Business District', lat: 0.3136, lng: 32.5811, toleranceKm: 15 },
        { name: 'Wakiso District (Suburban Kampala)', lat: 0.3999, lng: 32.4594, toleranceKm: 20 },
        { name: 'Mukono District', lat: 0.3531, lng: 32.7554, toleranceKm: 20 }
      ],
      'physical-geography': [
        { name: 'Rwenzori Mountains (Mountains of the Moon)', lat: 0.3861, lng: 29.8731, toleranceKm: 25 },
        { name: 'Lake Victoria (Africa\'s largest lake)', lat: -1.0, lng: 33.0, toleranceKm: 50 },
        { name: 'Mount Elgon Caldera', lat: 1.1167, lng: 34.5667, toleranceKm: 30 }
      ],
      'geomorphology': [
        { name: 'Albertine Rift Valley Floor (Lake Albert)', lat: 1.8, lng: 30.9, toleranceKm: 30 },
        { name: 'Virunga Volcanic Field', lat: -1.4, lng: 29.5, toleranceKm: 25 },
        { name: 'Rwenzori Horst Block', lat: 0.3861, lng: 29.8731, toleranceKm: 25 }
      ],
      'weather-climate': [
        { name: 'Entebbe Weather Station (Equatorial, Lakeside)', lat: 0.0422, lng: 32.4430, toleranceKm: 20 },
        { name: 'Moroto (Semi-Arid Karamoja)', lat: 2.5337, lng: 34.6676, toleranceKm: 25 },
        { name: 'Kabale (Highland, Cool-Humid)', lat: -1.2491, lng: 29.9899, toleranceKm: 20 }
      ],
      'seasons-astronomy': [
        { name: 'Equator Crossing at Kayabwe', lat: 0.0, lng: 32.0, toleranceKm: 25 },
        { name: 'Tropic of Cancer (23.5°N)', lat: 23.5, lng: 32.0, toleranceKm: 50 }
      ],
      'rivers-lakes': [
        { name: 'Source of the River Nile (Jinja)', lat: 0.4244, lng: 33.2042, toleranceKm: 20 },
        { name: 'Murchison Falls (Nile Knickpoint)', lat: 2.2783, lng: 31.6847, toleranceKm: 25 },
        { name: 'Lake Bunyonyi Volcanic Lake', lat: -1.2833, lng: 29.9167, toleranceKm: 20 },
        { name: 'Bujagali Falls (Nile, near Jinja)', lat: 0.4505, lng: 33.1548, toleranceKm: 15 }
      ],
      'oceans-coasts': [
        { name: 'Mombasa Port (Indian Ocean)', lat: -4.0435, lng: 39.6682, toleranceKm: 25 },
        { name: 'Dar es Salaam Harbour', lat: -6.7924, lng: 39.2083, toleranceKm: 25 },
        { name: 'Lamu Archipelago (Kenya Coast)', lat: -2.2717, lng: 40.9020, toleranceKm: 25 }
      ],
      'geology': [
        { name: 'Kilembe Copper Mines (Kasese)', lat: 0.1820, lng: 30.0080, toleranceKm: 25 },
        { name: 'Tororo Limestone/Cement Works', lat: 0.6930, lng: 34.1809, toleranceKm: 20 },
        { name: 'Albertine Oil Basin (Hoima)', lat: 1.4314, lng: 31.3530, toleranceKm: 30 }
      ],
      'soils': [
        { name: 'Volcanic Soils (Elgon Slopes)', lat: 1.1167, lng: 34.5667, toleranceKm: 30 },
        { name: 'Alluvial Soils (Lake Kyoga Basin)', lat: 1.5, lng: 33.0, toleranceKm: 30 },
        { name: 'Laterite Soils (Central Uganda)', lat: 0.5, lng: 32.5, toleranceKm: 30 }
      ],
      'vegetation': [
        { name: 'Bwindi Impenetrable Forest', lat: -1.0530, lng: 29.6150, toleranceKm: 20 },
        { name: 'Mabira Central Forest Reserve', lat: 0.4294, lng: 33.0009, toleranceKm: 20 },
        { name: 'Budongo Forest Reserve', lat: 1.7167, lng: 31.5333, toleranceKm: 20 }
      ],
      'forestry': [
        { name: 'Mabira Forest (Central)', lat: 0.4294, lng: 33.0009, toleranceKm: 20 },
        { name: 'Bugoma Forest Reserve', lat: 1.1681, lng: 30.9419, toleranceKm: 20 },
        { name: 'Budongo Forest', lat: 1.7167, lng: 31.5333, toleranceKm: 20 }
      ],
      'wildlife-conservation': [
        { name: 'Murchison Falls National Park', lat: 2.2783, lng: 31.6847, toleranceKm: 25 },
        { name: 'Queen Elizabeth National Park', lat: -0.1978, lng: 30.0004, toleranceKm: 25 },
        { name: 'Kidepo Valley National Park', lat: 3.8667, lng: 33.8833, toleranceKm: 25 },
        { name: 'Bwindi Impenetrable NP (Gorillas)', lat: -1.0530, lng: 29.6150, toleranceKm: 20 }
      ],
      'population': [
        { name: 'Kampala (Highest population density)', lat: 0.3136, lng: 32.5811, toleranceKm: 15 },
        { name: 'Gulu (Northern urban center)', lat: 2.7746, lng: 32.2990, toleranceKm: 20 },
        { name: 'Mbarara (Western urban center)', lat: -0.6118, lng: 30.6546, toleranceKm: 20 }
      ],
      'settlements': [
        { name: 'Kampala City Centre', lat: 0.3136, lng: 32.5811, toleranceKm: 10 },
        { name: 'Jinja (Historical industrial town)', lat: 0.4244, lng: 33.2042, toleranceKm: 15 },
        { name: 'Entebbe (Lakeside planned town)', lat: 0.0512, lng: 32.4604, toleranceKm: 15 }
      ],
      'agriculture': [
        { name: 'Kakira Sugar Works', lat: 0.5105, lng: 33.2756, toleranceKm: 20 },
        { name: 'Doho Irrigation Scheme (Butaleja)', lat: 0.9262, lng: 33.9590, toleranceKm: 20 },
        { name: 'Bugisu Arabica Coffee Zone (Mt Elgon)', lat: 1.1167, lng: 34.5667, toleranceKm: 30 }
      ],
      'industry': [
        { name: 'Namanve Industrial Park', lat: 0.3443, lng: 32.6794, toleranceKm: 15 },
        { name: 'Jinja Industrial Area', lat: 0.4244, lng: 33.2042, toleranceKm: 15 },
        { name: 'Mbale Industrial Zone', lat: 1.0647, lng: 34.1747, toleranceKm: 15 }
      ],
      'transport': [
        { name: 'Entebbe International Airport', lat: 0.0424, lng: 32.4435, toleranceKm: 15 },
        { name: 'Malaba Border Crossing (Kenya)', lat: 0.6394, lng: 34.2721, toleranceKm: 15 },
        { name: 'Port Bell (Lake Victoria)', lat: 0.3094, lng: 32.6400, toleranceKm: 15 }
      ],
      'tourism': [
        { name: 'Source of the Nile (Tourist site)', lat: 0.4244, lng: 33.2042, toleranceKm: 20 },
        { name: 'Kasubi Royal Tombs (Heritage site)', lat: 0.3375, lng: 32.5522, toleranceKm: 10 },
        { name: 'Sipi Falls (Mt Elgon)', lat: 1.3247, lng: 34.3567, toleranceKm: 20 }
      ],
      'environmental-geography': [
        { name: 'Rwenzori Glaciers (Margherita Peak)', lat: 0.3861, lng: 29.8731, toleranceKm: 25 },
        { name: 'Nakivubo Wetland (Lake Victoria Shore)', lat: 0.2897, lng: 32.6160, toleranceKm: 15 },
        { name: 'Lake Victoria Shore (Eutrophication)', lat: 0.0, lng: 32.8, toleranceKm: 30 }
      ],
      'fieldwork': [
        { name: 'Mount Stanley (Margherita Peak)', lat: 0.3861, lng: 29.8731, toleranceKm: 25 },
        { name: 'Source of the River Nile (Jinja)', lat: 0.4244, lng: 33.2042, toleranceKm: 20 }
      ],
      'geographical-data-analysis': [
        { name: 'Kampala (CBT Practice Target)', lat: 0.3136, lng: 32.5811, toleranceKm: 15 },
        { name: 'Lake Bunyonyi', lat: -1.2833, lng: 29.9167, toleranceKm: 20 },
        { name: 'Mount Elgon Caldera', lat: 1.1167, lng: 34.5667, toleranceKm: 30 }
      ]
    };

    const topicTargets = TOPIC_QUIZ_TARGETS[topic.code] || TOPIC_QUIZ_TARGETS['maps-cartography'];
    const sampleTargets = topicTargets;

    const target = sampleTargets[Math.floor(Math.random() * sampleTargets.length)];

    const inspectorContent = document.getElementById('geo-inspector-content');
    if (inspectorContent) {
      inspectorContent.innerHTML = `
        <div class="card border-primary p-3 mb-3">
          <div class="badge bg-primary text-white mb-2" style="width:fit-content;">CBT Practical Question</div>
          <h6 class="fw-bold text-dark mb-2">Identify Location on Map</h6>
          <p class="small text-secondary mb-3">
            Using the map, click the precise geographic position of:
            <br><strong class="text-primary fs-6">${target.name}</strong>.
          </p>
          <div class="alert alert-info py-2 small mb-0">
            <i class="fa-solid fa-crosshairs me-1"></i> Click anywhere on the map to drop your answer pin.
          </div>
        </div>
      `;
    }

    mapEngine.setGradingTarget(target);
  }

  function renderClimateChart(stationKey) {
    if (!window.GeoDatasets || !window.GeoDatasets.CLIMATE_STATIONS) return;
    const station = window.GeoDatasets.CLIMATE_STATIONS[stationKey] || window.GeoDatasets.CLIMATE_STATIONS.entebbe;

    const chartTitle = document.getElementById('geo-climate-chart-title');
    const chartDesc = document.getElementById('geo-climate-chart-desc');
    const legend = document.getElementById('geo-chart-legend');
    const canvas = document.getElementById('geo-climate-canvas');

    if (chartTitle) chartTitle.textContent = `${station.name} (${station.climateType})`;
    if (chartDesc) chartDesc.textContent = `${station.description} Elevation: ${station.elevationM} m.`;

    if (legend) {
      legend.innerHTML = `
        <span class="text-primary fw-bold"><i class="fa-solid fa-square text-primary"></i> Precipitation (Bars, mm)</span>
        <span class="text-danger fw-bold ms-4"><i class="fa-solid fa-chart-line text-danger"></i> Temperature (Curve, °C)</span>
      `;
    }

    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padL = 60;
    const padR = 60;
    const padT = 40;
    const padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;

    const maxPrecip = 300;
    const minTemp = 10;
    const maxTemp = 35;

    const barWidth = (chartW / 12) * 0.6;
    const colStep = chartW / 12;

    station.precipMm.forEach((precip, i) => {
      const x = padL + i * colStep + (colStep - barWidth) / 2;
      const barH = (precip / maxPrecip) * chartH;
      const y = height - padB - barH;

      ctx.fillStyle = '#0284C7';
      ctx.fillRect(x, y, barWidth, barH);

      ctx.fillStyle = '#64748B';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(station.months[i], padL + i * colStep + colStep / 2, height - padB + 16);
    });

    ctx.beginPath();
    ctx.strokeStyle = '#DC2626';
    ctx.lineWidth = 3;

    station.tempC.forEach((temp, i) => {
      const x = padL + i * colStep + colStep / 2;
      const y = height - padB - ((temp - minTemp) / (maxTemp - minTemp)) * chartH;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    station.tempC.forEach((temp, i) => {
      const x = padL + i * colStep + colStep / 2;
      const y = height - padB - ((temp - minTemp) / (maxTemp - minTemp)) * chartH;

      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#0284C7';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    for (let p = 0; p <= maxPrecip; p += 50) {
      const y = height - padB - (p / maxPrecip) * chartH;
      ctx.fillText(`${p} mm`, padL - 8, y + 4);
    }

    ctx.fillStyle = '#DC2626';
    ctx.textAlign = 'left';
    for (let t = 10; t <= maxTemp; t += 5) {
      const y = height - padB - ((t - minTemp) / (maxTemp - minTemp)) * chartH;
      ctx.fillText(`${t} °C`, width - padR + 8, y + 4);
    }
  }

  function setupFieldworkForm() {
    const selStation = document.getElementById('geo-station-select');
    if (selStation) {
      selStation.addEventListener('change', (e) => {
        if (currentChartType === 'climate') {
          renderClimateChart(e.target.value);
        }
      });
    }

    const fwForm = document.getElementById('geo-fieldwork-form');
    if (fwForm) {
      fwForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('fw-title').value;
        const siteName = document.getElementById('fw-site-name').value;
        const lat = document.getElementById('fw-lat').value;
        const lng = document.getElementById('fw-lng').value;
        const elevation = document.getElementById('fw-elevation').value;
        const observations = document.getElementById('fw-observations').value;

        try {
          const res = await fetch('/api/geography/fieldwork', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title,
              site_name: siteName,
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              elevation: elevation ? parseFloat(elevation) : null,
              observations
            })
          });

          const data = await res.json();
          if (data.success) {
            alert('✓ Fieldwork observation successfully logged to database!');
            fwForm.reset();
          } else {
            alert('Error: ' + (data.error || 'Failed to save entry'));
          }
        } catch (err) {
          alert('Network error submitting fieldwork record');
        }
      });
    }
  }

  // ================================================================
  // GLOBAL STUDY AREA SELECTOR
  // Builds the Bootstrap accordion inside #geo-study-area-accordion
  // from GeoDatasets.GLOBAL_STUDY_AREAS. Each continent is an
  // accordion item; each region is a clickable list item that flies
  // the Leaflet map to that location and shows a case study card
  // in the Inspector panel.
  // ================================================================
  function setupStudyAreaSelector() {
    const container = document.getElementById('geo-study-area-accordion');
    if (!container) return;

    const studyAreas = (window.GeoDatasets && window.GeoDatasets.GLOBAL_STUDY_AREAS)
      ? window.GeoDatasets.GLOBAL_STUDY_AREAS
      : null;

    if (!studyAreas) {
      container.innerHTML = '<p class="text-muted small">Study area data not loaded.</p>';
      return;
    }

    // Continent icon map
    const CONTINENT_ICONS = {
      Africa:        'fa-earth-africa',
      Europe:        'fa-earth-europe',
      Asia:          'fa-earth-asia',
      'North America':'fa-earth-americas',
      'South America':'fa-earth-americas',
      Oceania:       'fa-earth-oceania',
      Polar:         'fa-snowflake'
    };

    const CONTINENT_COLORS = {
      Africa:         '#F59E0B',
      Europe:         '#3B82F6',
      Asia:           '#EF4444',
      'North America':'#10B981',
      'South America':'#8B5CF6',
      Oceania:        '#06B6D4',
      Polar:          '#64748B'
    };

    let accordionHtml = '';
    const continents = Object.keys(studyAreas);

    continents.forEach((continent, cIdx) => {
      const regions = studyAreas[continent];
      const icon = CONTINENT_ICONS[continent] || 'fa-globe';
      const color = CONTINENT_COLORS[continent] || '#2563EB';
      const collapseId = 'sa-collapse-' + cIdx;
      const headingId  = 'sa-heading-'  + cIdx;

      const regionItems = regions.map(region => {
        const topicBadges = (region.topics || [])
          .slice(0, 3)
          .map(t => `<span class="badge bg-primary-subtle text-primary border border-primary-subtle me-1 small">${escapeHtml(t)}</span>`)
          .join('');

        return `
          <button class="list-group-item list-group-item-action d-flex justify-content-between align-items-start py-2 px-3"
                  data-lat="${region.lat}" data-lng="${region.lng}" data-zoom="${region.zoom}"
                  data-name="${escapeHtml(region.name)}"
                  data-case="${escapeHtml(region.caseStudy || '')}"
                  data-topics="${escapeHtml(JSON.stringify(region.topics || []))}"
                  onclick="window._geoSelectStudyArea(this)">
            <div>
              <div class="fw-semibold small">${escapeHtml(region.name)}</div>
              <div class="mt-1">${topicBadges}</div>
            </div>
            <i class="fa-solid fa-arrow-right text-muted mt-1 ms-2"></i>
          </button>`;
      }).join('');

      accordionHtml += `
        <div class="accordion-item">
          <h2 class="accordion-header" id="${headingId}">
            <button class="accordion-button ${cIdx > 0 ? 'collapsed' : ''} fw-bold py-2"
                    type="button" data-bs-toggle="collapse"
                    data-bs-target="#${collapseId}"
                    aria-expanded="${cIdx === 0 ? 'true' : 'false'}"
                    aria-controls="${collapseId}"
                    style="color:${color};">
              <i class="fa-solid ${icon} me-2"></i> ${continent}
              <span class="badge ms-2" style="background:${color};color:#fff;">${regions.length}</span>
            </button>
          </h2>
          <div id="${collapseId}" class="accordion-collapse collapse ${cIdx === 0 ? 'show' : ''}"
               data-bs-parent="#geo-study-area-accordion">
            <div class="accordion-body p-0">
              <div class="list-group list-group-flush">${regionItems}</div>
            </div>
          </div>
        </div>`;
    });

    container.innerHTML = accordionHtml;

    // Expose global click handler (used by onclick attribute above)
    window._geoSelectStudyArea = function(btn) {
      const lat   = parseFloat(btn.getAttribute('data-lat'));
      const lng   = parseFloat(btn.getAttribute('data-lng'));
      const zoom  = parseInt(btn.getAttribute('data-zoom'), 10);
      const name  = btn.getAttribute('data-name');
      const caseStudy = btn.getAttribute('data-case');
      let topics = [];
      try { topics = JSON.parse(btn.getAttribute('data-topics') || '[]'); } catch(e) {}

      // Close the modal
      const modalEl = document.getElementById('modal-geo-study-areas');
      if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) bsModal.hide();
      }

      // Switch to map mode and fly there
      switchActiveMode('map2d');
      if (mapEngine) {
        setTimeout(() => {
          mapEngine.flyTo(lat, lng, zoom);
        }, 200);
      }

      // Show case study card in inspector
      const inspector = document.getElementById('geo-inspector-content');
      if (inspector) {
        const topicBadges = topics
          .map(t => `<span class="badge bg-success-subtle text-success border border-success-subtle me-1">${escapeHtml(t)}</span>`)
          .join('');

        inspector.innerHTML = `
          <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:6px;">
            <i class="fa-solid fa-location-dot text-success me-2"></i>${escapeHtml(name)}
          </div>
          <div style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;margin-bottom:10px;">
            Global Study Area
          </div>
          <div class="d-flex flex-wrap gap-1 mb-3">${topicBadges}</div>
          <div class="card bg-success bg-opacity-10 border-success border-opacity-25 p-3 mb-3">
            <div style="font-size:12px;font-weight:700;color:#065F46;margin-bottom:6px;">
              <i class="fa-solid fa-book-open me-1"></i> Case Study Notes
            </div>
            <div style="font-size:13px;color:#334155;line-height:1.6;">${escapeHtml(caseStudy || 'Navigate the map to explore features of this region.')}</div>
          </div>
          <div class="card bg-light border-0 p-2 mb-2">
            <div class="small text-muted mb-1">Coordinates</div>
            <div class="fw-bold small">Lat: ${lat.toFixed(4)}° &nbsp; Lng: ${lng.toFixed(4)}°</div>
          </div>
          <button class="btn btn-sm btn-outline-success w-100 mt-2"
                  onclick="if(window.mapEngine||null){window.mapEngine.flyTo(${lat},${lng},${zoom});}">
            <i class="fa-solid fa-crosshairs me-1"></i> Re-centre Map Here
          </button>`;
      }
    };
  }

  // ================================================================
  // LANDFORM INFO PANEL
  // Listens for geo:landform_selected events (fired by Geo3DEngine)
  // and renders formation theory + exam points in the Inspector.
  // ================================================================
  function setupLandformInfoPanel() {
    window.addEventListener('geo:landform_selected', (e) => {
      const info = e.detail;
      if (!info) return;

      const inspector = document.getElementById('geo-inspector-content');
      if (!inspector) return;

      const examList = (info.examPoints || [])
        .map(pt => `<li class="mb-1">${escapeHtml(pt)}</li>`)
        .join('');

      inspector.innerHTML = `
        <div style="font-size:14px;font-weight:700;color:#0F172A;margin-bottom:6px;">
          <i class="fa-solid fa-mountain text-primary me-2"></i>${escapeHtml(info.name || 'Landform Model')}
        </div>
        <div style="font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;margin-bottom:10px;">
          3D Landform &mdash; Geomorphology
        </div>

        <div class="row g-2 mb-3">
          <div class="col-6">
            <div class="card bg-light border-0 p-2 text-center">
              <div class="small text-muted">Type</div>
              <div class="fw-bold small text-primary">${escapeHtml(info.type || '—')}</div>
            </div>
          </div>
          <div class="col-6">
            <div class="card bg-light border-0 p-2 text-center">
              <div class="small text-muted">Scale</div>
              <div class="fw-bold small text-danger">${escapeHtml(info.scale || '—')}</div>
            </div>
          </div>
        </div>

        <div class="card bg-light border-0 p-2 mb-2">
          <div class="small text-muted mb-1">Real-world Location</div>
          <div class="small fw-semibold">${escapeHtml(info.location || '—')}</div>
        </div>

        <div class="card border-primary border-opacity-25 p-3 mb-3">
          <div style="font-size:12px;font-weight:700;color:#1E40AF;margin-bottom:6px;">
            <i class="fa-solid fa-flask me-1"></i> Formation Theory
          </div>
          <div style="font-size:12px;color:#334155;line-height:1.6;">
            ${escapeHtml(info.formationTheory || 'See 3D model for visual explanation.')}
          </div>
        </div>

        ${examList ? `
        <div class="card border-warning border-opacity-50 p-3">
          <div style="font-size:12px;font-weight:700;color:#92400E;margin-bottom:8px;">
            <i class="fa-solid fa-graduation-cap me-1"></i> Exam Key Points
          </div>
          <ul class="mb-0 ps-3" style="font-size:12px;color:#334155;line-height:1.7;">
            ${examList}
          </ul>
        </div>` : ''}`;
    });
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[character]);
  }

})();
