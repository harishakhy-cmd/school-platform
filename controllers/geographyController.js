'use strict';

const pool = require('../config/database');

// Comprehensive 22-Topic Geography Curriculum Registry
const CURRICULUM_TOPICS = [
  {
    code: 'maps-cartography',
    title: 'Maps & Cartography',
    category: 'Foundations & Techniques',
    icon: 'fa-map-location-dot',
    description: 'Map reading, 4-figure and 6-figure grid references, compass bearings, scale conversion, contours, and elevation cross-sections.',
    modes: ['2d_map', 'contours', 'cross_section', 'grid_tools'],
    datasetKeys: ['uganda_features', 'contours_sample']
  },
  {
    code: 'gis-laboratory',
    title: 'GIS Laboratory',
    category: 'Foundations & Techniques',
    icon: 'fa-layer-group',
    description: 'Geographic Information Systems: spatial layers, attribute queries, buffer zones, spatial overlays, and thematic vector styling.',
    modes: ['2d_map', 'gis_layers', 'buffer_query'],
    datasetKeys: ['uganda_districts', 'uganda_national_parks', 'uganda_hydrology']
  },
  {
    code: 'physical-geography',
    title: 'Physical Geography & Earth Systems',
    category: 'Physical Geography',
    icon: 'fa-mountain-sun',
    description: 'Internal and external Earth forces, lithosphere, atmosphere, hydrosphere, biosphere, and global crustal structure.',
    modes: ['2d_map', '3d_earth', 'cross_section'],
    datasetKeys: ['global_tectonics', 'uganda_features']
  },
  {
    code: 'geomorphology',
    title: 'Geomorphology & Landforms',
    category: 'Physical Geography',
    icon: 'fa-volcano',
    description: 'Tectonic processes, faulting (rift valleys, horsts/block mountains), folding (anticlines/synclines), and volcanism (shield, composite, calderas).',
    modes: ['3d_landforms', '2d_map', 'interactive_cross_section'],
    datasetKeys: ['east_africa_rift', 'uganda_features']
  },
  {
    code: 'weather-climate',
    title: 'Weather & Climate',
    category: 'Physical Geography',
    icon: 'fa-cloud-sun-rain',
    description: 'Atmospheric pressure, ITCZ migration, wind systems, rainfall types (orographic, convectional, frontal), weather station instruments, and climate graphs.',
    modes: ['2d_map', 'climate_chart', 'weather_instruments'],
    datasetKeys: ['climate_zones', 'itcz_positions']
  },
  {
    code: 'seasons-astronomy',
    title: 'Seasons & Earth-Sun Astronomy',
    category: 'Physical Geography',
    icon: 'fa-earth-africa',
    description: 'Earth rotation (day/night), axial tilt (23.5°), revolution around the Sun, equinoxes (March 21, Sept 23), solstices (June 21, Dec 22), and solar altitude.',
    modes: ['3d_earth_sun', 'solar_calculator', 'time_zones'],
    datasetKeys: ['latitude_grid']
  },
  {
    code: 'rivers-lakes',
    title: 'Rivers & Hydrology',
    category: 'Physical Geography',
    icon: 'fa-water',
    description: 'Drainage basins, river courses (youthful, mature, old stage), waterfalls, meanders, oxbow lakes, deltas, and river hydrographs.',
    modes: ['2d_map', 'river_profile', 'hydrograph'],
    datasetKeys: ['uganda_hydrology', 'east_africa_lakes']
  },
  {
    code: 'oceans-coasts',
    title: 'Oceans & Coastal Geomorphology',
    category: 'Physical Geography',
    icon: 'fa-water-ladder',
    description: 'Ocean currents (cold Benguela, warm Agulhas/Mozambique), coastal landforms (spits, bars, cliffs, caves, tombolos), and coral reefs.',
    modes: ['2d_map', 'ocean_currents', 'coastal_features'],
    datasetKeys: ['ocean_currents_layer', 'coastal_points']
  },
  {
    code: 'geology',
    title: 'Geology & Mineral Resources',
    category: 'Physical Geography',
    icon: 'fa-gem',
    description: 'Rock cycle (igneous, sedimentary, metamorphic), strata, mineral extraction in East Africa (copper/cobalt Kilembe, gold Karamoja, limestone Tororo, oil Albertine).',
    modes: ['rock_cycle', '2d_map', 'mineral_deposits'],
    datasetKeys: ['uganda_minerals']
  },
  {
    code: 'soils',
    title: 'Soil Science (Pedology)',
    category: 'Physical Geography',
    icon: 'fa-seedling',
    description: 'Soil profile horizons (O, A, B, C, R), soil texture triangle, catena concept in East African valleys, soil erosion, and conservation techniques.',
    modes: ['soil_profile_3d', 'texture_triangle', '2d_map'],
    datasetKeys: ['uganda_soil_zones']
  },
  {
    code: 'vegetation',
    title: 'Vegetation & Biomes',
    category: 'Physical Geography',
    icon: 'fa-tree',
    description: 'Tropical rainforests (Budongo, Mabira, Bwindi), savanna woodlands, montane vegetation altitudinal zonation (Rwenzori/Elgon), and arid scrub.',
    modes: ['2d_map', 'altitudinal_zonation', 'biome_explorer'],
    datasetKeys: ['uganda_vegetation', 'global_biomes']
  },
  {
    code: 'forestry',
    title: 'Forestry & Forest Conservation',
    category: 'Environmental Geography',
    icon: 'fa-tree-city',
    description: 'Central forest reserves, deforestation rates, agroforestry, reforestation initiatives, and sustainable timber management.',
    modes: ['2d_map', 'time_series_deforestation', 'forest_stats'],
    datasetKeys: ['uganda_forest_reserves']
  },
  {
    code: 'wildlife-conservation',
    title: 'Wildlife & Protected Areas',
    category: 'Environmental Geography',
    icon: 'fa-paw',
    description: 'National parks, wildlife reserves, biodiversity hotspots, endangered species (mountain gorillas Bwindi/Mgahinga), anti-poaching, and eco-corridors.',
    modes: ['2d_map', 'wildlife_census', 'protected_boundaries'],
    datasetKeys: ['uganda_national_parks']
  },
  {
    code: 'population',
    title: 'Population Geography',
    category: 'Human & Economic Geography',
    icon: 'fa-users',
    description: 'Demographic transition model, population density distribution, age-sex population pyramids, fertility, mortality, and migration streams.',
    modes: ['2d_map', 'population_pyramid', 'density_choropleth'],
    datasetKeys: ['uganda_districts']
  },
  {
    code: 'settlements',
    title: 'Settlement Geography',
    category: 'Human & Economic Geography',
    icon: 'fa-city',
    description: 'Rural settlement patterns (nucleated, dispersed, linear), urban hierarchy, Central Place Theory, Kampala urban growth, and land use models.',
    modes: ['2d_map', 'settlement_patterns', 'urban_transect'],
    datasetKeys: ['uganda_urban_centers', 'kampala_divisions']
  },
  {
    code: 'agriculture',
    title: 'Agricultural Systems',
    category: 'Human & Economic Geography',
    icon: 'fa-wheat-awn',
    description: 'Subsistence farming, plantation agriculture (tea, sugarcane Kakira/Lugazi), nomadic pastoralism (Karamoja), dairy farming, and irrigation schemes (Doho, Kibimba, Mobuku).',
    modes: ['2d_map', 'crop_calendar', 'farming_zones'],
    datasetKeys: ['uganda_agric_zones', 'irrigation_schemes']
  },
  {
    code: 'industry',
    title: 'Industrial Development',
    category: 'Human & Economic Geography',
    icon: 'fa-industry',
    description: 'Factors influencing industrial location, industrial parks (Namanve, Jinja, Mbale), cottage industries, manufacturing value chains, and environmental impacts.',
    modes: ['2d_map', 'location_factors', 'industrial_zones'],
    datasetKeys: ['uganda_industrial_parks']
  },
  {
    code: 'transport',
    title: 'Transport & Communications',
    category: 'Human & Economic Geography',
    icon: 'fa-route',
    description: 'Road networks, Standard Gauge Railway corridors, inland water transport (Lake Victoria ferries), pipelines, and international air hubs (Entebbe).',
    modes: ['2d_map', 'corridor_analysis', 'network_connectivity'],
    datasetKeys: ['uganda_transport_corridors']
  },
  {
    code: 'tourism',
    title: 'Tourism & Heritage Geography',
    category: 'Human & Economic Geography',
    icon: 'fa-monument',
    description: 'Tourism circuits in Uganda and East Africa, Kasubi royal tombs, source of the River Nile, Rwenzori mountaineering, ecotourism, and revenue sharing.',
    modes: ['2d_map', 'tourist_circuits', 'heritage_sites'],
    datasetKeys: ['uganda_tourist_circuits', 'heritage_sites']
  },
  {
    code: 'environmental-geography',
    title: 'Environmental Geography & Climate Change',
    category: 'Environmental Geography',
    icon: 'fa-earth-americas',
    description: 'Land degradation, wetland encroachment (Lake Victoria shores), desertification, melting of Rwenzori glaciers (1906 vs today), and climate adaptation strategies.',
    modes: ['2d_map', 'glacier_comparison', 'wetland_loss'],
    datasetKeys: ['rwenzori_glaciers', 'wetland_buffers']
  },
  {
    code: 'fieldwork',
    title: 'Geographical Fieldwork & Virtual Excursions',
    category: 'Practical Fieldwork',
    icon: 'fa-compass',
    description: 'Fieldwork methodology: formulation of hypotheses, sampling methods, data collection tools (inclinometer, anemometer, transect walk), data recording, and reporting.',
    modes: ['fieldwork_logger', 'virtual_transect', 'data_collector'],
    datasetKeys: ['fieldwork_sample_sites']
  },
  {
    code: 'geographical-data-analysis',
    title: 'Geographical Data Analysis & CBT Practice',
    category: 'Practical Fieldwork',
    icon: 'fa-chart-pie',
    description: 'Statistical analysis of geographic data: choropleths, isoline interpolation, flowline maps, scatter plots, and CBT exam practice with instant spatial auto-grading.',
    modes: ['data_analytics', 'cbt_quiz_mode', 'isoline_generator'],
    datasetKeys: ['district_stats_table']
  }
];

function getUserIdentifier(req) {
  if (req.session.adminId) {
    return {
      identifier: req.session.adminUsername || `admin_${req.session.adminId}`,
      role: 'admin',
      id: req.session.adminId
    };
  }
  if (req.session.registrationNumber) {
    return {
      identifier: req.session.registrationNumber,
      role: 'student',
      id: req.session.studentId || 0
    };
  }
  return null;
}

// Haversine distance calculator in kilometers
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

exports.getCurriculumTopics = async (req, res) => {
  try {
    return res.json({
      success: true,
      count: CURRICULUM_TOPICS.length,
      topics: CURRICULUM_TOPICS
    });
  } catch (err) {
    console.error('Error fetching curriculum topics:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve curriculum topics' });
  }
};

exports.getTopicByCode = async (req, res) => {
  try {
    const code = req.params.code;
    const topic = CURRICULUM_TOPICS.find((t) => t.code === code);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }
    return res.json({ success: true, topic });
  } catch (err) {
    console.error('Error fetching topic by code:', err);
    return res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.listSavedMaps = async (req, res) => {
  try {
    const user = getUserIdentifier(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const [rows] = await pool.query(
      'SELECT id, user_identifier, user_role, title, topic_code, center_lat, center_lng, zoom_level, active_layers_json, annotations_json, created_at, updated_at FROM geography_saved_maps WHERE user_identifier = ? ORDER BY updated_at DESC',
      [user.identifier]
    );

    return res.json({ success: true, maps: rows });
  } catch (err) {
    console.error('Error listing saved maps:', err);
    return res.status(500).json({ success: false, error: 'Failed to load saved maps' });
  }
};

exports.saveMap = async (req, res) => {
  try {
    const user = getUserIdentifier(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { title, topic_code, center_lat, center_lng, zoom_level, active_layers, annotations } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Map title is required' });
    }

    const [result] = await pool.query(
      `INSERT INTO geography_saved_maps (user_identifier, user_role, title, topic_code, center_lat, center_lng, zoom_level, active_layers_json, annotations_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.identifier,
        user.role,
        title.trim(),
        topic_code || 'cartography',
        parseFloat(center_lat) || 1.3733,
        parseFloat(center_lng) || 32.2903,
        parseInt(zoom_level, 10) || 7,
        JSON.stringify(active_layers || []),
        JSON.stringify(annotations || [])
      ]
    );

    return res.json({
      success: true,
      mapId: result.insertId,
      message: 'Map project saved successfully'
    });
  } catch (err) {
    console.error('Error saving map:', err);
    return res.status(500).json({ success: false, error: 'Failed to save map project' });
  }
};

exports.deleteSavedMap = async (req, res) => {
  try {
    const user = getUserIdentifier(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const mapId = parseInt(req.params.id, 10);
    const [result] = await pool.query(
      'DELETE FROM geography_saved_maps WHERE id = ? AND user_identifier = ?',
      [mapId, user.identifier]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Map not found or unauthorized' });
    }

    return res.json({ success: true, message: 'Map deleted successfully' });
  } catch (err) {
    console.error('Error deleting map:', err);
    return res.status(500).json({ success: false, error: 'Failed to delete map' });
  }
};

exports.listFieldworkEntries = async (req, res) => {
  try {
    const user = getUserIdentifier(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const [rows] = await pool.query(
      'SELECT * FROM geography_fieldwork WHERE user_identifier = ? ORDER BY created_at DESC',
      [user.identifier]
    );

    return res.json({ success: true, entries: rows });
  } catch (err) {
    console.error('Error listing fieldwork entries:', err);
    return res.status(500).json({ success: false, error: 'Failed to load fieldwork entries' });
  }
};

exports.saveFieldworkEntry = async (req, res) => {
  try {
    const user = getUserIdentifier(req);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const {
      title,
      site_name,
      latitude,
      longitude,
      elevation,
      landform_type,
      topic_code,
      observations,
      measurements,
      photos
    } = req.body;

    if (!title || !site_name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Title, site name, latitude, and longitude are required'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO geography_fieldwork (user_id, user_role, user_identifier, title, site_name, latitude, longitude, elevation, landform_type, topic_code, observations, measurements_json, photos_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user.id || 0,
        user.role,
        user.identifier,
        title.trim(),
        site_name.trim(),
        parseFloat(latitude),
        parseFloat(longitude),
        elevation !== undefined ? parseFloat(elevation) : null,
        landform_type || null,
        topic_code || 'fieldwork',
        observations || '',
        JSON.stringify(measurements || {}),
        JSON.stringify(photos || [])
      ]
    );

    return res.json({
      success: true,
      entryId: result.insertId,
      message: 'Fieldwork observation recorded successfully'
    });
  } catch (err) {
    console.error('Error saving fieldwork entry:', err);
    return res.status(500).json({ success: false, error: 'Failed to record fieldwork observation' });
  }
};

exports.gradeGeoCoordinateQuestion = async (req, res) => {
  try {
    const { targetLat, targetLng, studentLat, studentLng, toleranceKm = 25 } = req.body;

    if (
      targetLat === undefined ||
      targetLng === undefined ||
      studentLat === undefined ||
      studentLng === undefined
    ) {
      return res.status(400).json({ success: false, error: 'Target and student coordinates required' });
    }

    const distance = calculateHaversineDistance(
      parseFloat(targetLat),
      parseFloat(targetLng),
      parseFloat(studentLat),
      parseFloat(studentLng)
    );

    const isCorrect = distance <= toleranceKm;
    const scoreRatio = isCorrect
      ? Math.max(0.5, 1 - (distance / (toleranceKm * 2)))
      : 0;

    return res.json({
      success: true,
      distanceKm: parseFloat(distance.toFixed(2)),
      toleranceKm,
      isCorrect,
      scoreRatio: parseFloat(scoreRatio.toFixed(2)),
      feedback: isCorrect
        ? `Accurate location! Your pin was within ${distance.toFixed(1)} km of the target.`
        : `Your pin was ${distance.toFixed(1)} km away from the target (allowed tolerance: ${toleranceKm} km).`
    });
  } catch (err) {
    console.error('Error grading geo question:', err);
    return res.status(500).json({ success: false, error: 'Evaluation failed' });
  }
};
