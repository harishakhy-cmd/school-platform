/**
 * Interactive Geography & Earth Sciences Laboratory
 * Scientific Geospatial Datasets & Reference Dictionaries
 * 
 * Sources: UBOS (Uganda Bureau of Statistics 2024 Census),
 * Directorate of Water Resources Management (DWRM),
 * Uganda Wildlife Authority (UWA), USGS, Natural Earth.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GeoDatasets = factory();
  }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const GeoDatasets = {};

  // 1. UGANDA PHYSICAL FEATURES & ELEVATIONS
  GeoDatasets.UGANDA_PHYSICAL_FEATURES = [
    {
      id: 'rwenzori-stanley',
      name: 'Mount Stanley (Margherita Peak)',
      type: 'Mountain / Horst Peak',
      region: 'Western Uganda (Kasese / DRC Border)',
      lat: 0.3861,
      lng: 29.8731,
      elevationM: 5109,
      description: 'Highest peak in Uganda and third highest in Africa. Glaciated horst mountain formed through block faulting in the Western Albertine Rift.',
      category: 'relief'
    },
    {
      id: 'rwenzori-speke',
      name: 'Mount Speke (Vittorio Emanuele Peak)',
      type: 'Mountain Peak',
      region: 'Western Uganda',
      lat: 0.4000,
      lng: 29.8833,
      elevationM: 4890,
      description: 'Second highest massif in the Rwenzori range, composed of pre-Cambrian crystalline metamorphic rocks (gneiss and amphibolite).',
      category: 'relief'
    },
    {
      id: 'elgon-wagagai',
      name: 'Mount Elgon (Wagagai Peak)',
      type: 'Extinct Volcano / Shield Caldera',
      region: 'Eastern Uganda (Mbale / Kapchorwa)',
      lat: 1.1167,
      lng: 34.5667,
      elevationM: 4321,
      description: 'Ancient solitary shield volcano with one of the largest intact calderas in the world (~40 km²). Base diameter spans over 80 km.',
      category: 'volcanism'
    },
    {
      id: 'muhabura',
      name: 'Mount Muhabura',
      type: 'Extinct Volcano (Virunga Range)',
      region: 'Southwestern Uganda (Kisoro)',
      lat: -1.3833,
      lng: 29.6667,
      elevationM: 4127,
      description: 'Steep conical strato-volcano with a scenic crater lake at the summit, situated in Mgahinga Gorilla National Park.',
      category: 'volcanism'
    },
    {
      id: 'sabyinyo',
      name: 'Mount Sabyinyo ("Old Man\'s Teeth")',
      type: 'Extinct Volcano',
      region: 'Southwestern Uganda (Tri-border: UG/RW/CD)',
      lat: -1.3917,
      lng: 29.6000,
      elevationM: 3669,
      description: 'Deeply eroded volcanic plug marking the intersection of Uganda, Rwanda, and the Democratic Republic of Congo.',
      category: 'volcanism'
    },
    {
      id: 'moroto',
      name: 'Mount Moroto',
      type: 'Ancient Volcanic Massif',
      region: 'Karamoja (Eastern/Northeastern Uganda)',
      lat: 2.5333,
      lng: 34.7667,
      elevationM: 3083,
      description: 'Alkaline volcanic center rising precipitously from the semi-arid Karamoja peneplain, serving as a vital water catchment forest.',
      category: 'relief'
    },
    {
      id: 'kadam',
      name: 'Mount Kadam (Debasien)',
      type: 'Extinct Volcanic Mountain',
      region: 'Northeastern Uganda (Nakapiripirit)',
      lat: 1.7500,
      lng: 34.7000,
      elevationM: 3063,
      description: 'Prominent volcanic mountain south of Moroto, characterized by steep cliffs and dense montane woodland.',
      category: 'relief'
    },
    {
      id: 'napak',
      name: 'Mount Napak',
      type: 'Dissected Carbonatite Volcano',
      region: 'Northeastern Uganda (Napak District)',
      lat: 2.1500,
      lng: 34.2833,
      elevationM: 2538,
      description: 'Eroded remnants of a Miocene nephelinite-carbonatite volcano famous for paleontological mammalian fossil deposits.',
      category: 'geology'
    },
    {
      id: 'murchison-falls',
      name: 'Murchison Falls (Kabalega Falls)',
      type: 'Waterfall / Knickpoint',
      region: 'Northwestern Uganda (River Nile)',
      lat: 2.2783,
      lng: 31.6847,
      elevationM: 615,
      description: 'The Victoria Nile surges through a narrow 7-meter rocky gorge with torrential kinetic energy before plunging 43 meters into the Albert Nile basin.',
      category: 'hydrology'
    },
    {
      id: 'bujagali-falls',
      name: 'Bujagali / Nalubaale Rapids',
      type: 'River Knickpoint / Hydro Station',
      region: 'Jinja (Victoria Nile)',
      lat: 0.4492,
      lng: 33.1783,
      elevationM: 1140,
      description: 'Historic knickpoint rapids downstream from the source of the River Nile, now an integral hydroelectric energy hub.',
      category: 'hydrology'
    }
  ];

  // 2. LAKES & INLAND DRAINAGE BASINS
  GeoDatasets.UGANDA_LAKES = [
    {
      id: 'lake-victoria',
      name: 'Lake Victoria (Nalubaale)',
      type: 'Downwarped Basin Lake (Crustal Sagging)',
      lat: -0.4000,
      lng: 33.2000,
      surfaceAreaKm2: 68800,
      maxDepthM: 84,
      meanElevationM: 1135,
      description: 'Second largest freshwater lake by surface area on Earth, formed by shallow crustal downwarping between the Western and Eastern branches of the Rift Valley.',
      shorelineDistricts: ['Kampala', 'Wakiso', 'Mukono', 'Buikwe', 'Jinja', 'Mayuge', 'Bugiri', 'Busia', 'Kalangala', 'Buvuma', 'Masaka', 'Mpigi']
    },
    {
      id: 'lake-albert',
      name: 'Lake Albert (Mwitanzige)',
      type: 'Graben Lake (Western Rift Valley)',
      lat: 1.6833,
      lng: 30.9167,
      surfaceAreaKm2: 5300,
      maxDepthM: 58,
      meanElevationM: 615,
      description: 'Classic graben lake nestled between the Bunyoro escarpment on the east and the Blue Mountains of DRC on the west.',
      shorelineDistricts: ['Hoima', 'Buliisa', 'Kagadi', 'Ntoroko', 'Nebbi', 'Pakwach']
    },
    {
      id: 'lake-edward',
      name: 'Lake Edward',
      type: 'Graben Lake (Western Rift Valley)',
      lat: -0.3333,
      lng: 29.6000,
      surfaceAreaKm2: 2325,
      maxDepthM: 112,
      meanElevationM: 912,
      description: 'Rift valley graben lake drained northwards via the Semliki River around the base of the Rwenzori massif into Lake Albert.',
      shorelineDistricts: ['Kasese', 'Rubirizi', 'Rukungiri']
    },
    {
      id: 'lake-kyoga',
      name: 'Lake Kyoga & Kwania Complex',
      type: 'Drowned River Valley Lake (River Reversal)',
      lat: 1.5000,
      lng: 32.8333,
      surfaceAreaKm2: 1720,
      maxDepthM: 5.7,
      meanElevationM: 1033,
      description: 'Shallow dendritic lake complex formed when tectonic uplifting of the western rift shoulder reversed eastward-flowing rivers.',
      shorelineDistricts: ['Nakasongola', 'Kayunga', 'Kamuli', 'Buyende', 'Serere', 'Amolatar', 'Apac', 'Dokolo']
    },
    {
      id: 'lake-george',
      name: 'Lake George',
      type: 'Shallow Depression Lake',
      lat: 0.0000,
      lng: 30.2000,
      surfaceAreaKm2: 250,
      maxDepthM: 4.5,
      meanElevationM: 914,
      description: 'Bisected exactly by the Equator, connected to Lake Edward via the 36-km natural Kazinga Channel.',
      shorelineDistricts: ['Kasese', 'Kamwenge', 'Rubirizi']
    },
    {
      id: 'lake-bunyonyi',
      name: 'Lake Bunyonyi ("Place of Little Birds")',
      type: 'Volcanic Lava-Dammed Lake',
      lat: -1.2833,
      lng: 29.9167,
      surfaceAreaKm2: 60,
      maxDepthM: 44,
      meanElevationM: 1962,
      description: 'High-altitude scenic lake with 29 islands, formed when lava flows from the Virunga volcanoes blocked a dendritic river valley.',
      shorelineDistricts: ['Kabale', 'Rubanda']
    }
  ];

  // 3. RIVERS & DRAINAGE NETWORK
  GeoDatasets.UGANDA_RIVERS = [
    {
      id: 'victoria-nile',
      name: 'Victoria Nile',
      source: 'Lake Victoria, Jinja (0.424°N, 33.195°E)',
      mouth: 'Lake Albert delta (2.23°N, 31.42°E)',
      lengthKm: 420,
      features: ['Source of the Nile', 'Nalubaale Dam', 'Bujagali Dam', 'Karuma Dam', 'Murchison Falls'],
      courseCoordinates: [
        [0.424, 33.195],
        [0.750, 33.050],
        [1.150, 32.900],
        [1.500, 32.300],
        [2.240, 32.250],
        [2.278, 31.685],
        [2.230, 31.420]
      ]
    },
    {
      id: 'albert-nile',
      name: 'Albert Nile',
      source: 'Lake Albert northern tip (Pakwach)',
      mouth: 'South Sudan border (Nimule / Bahr el Jebel)',
      lengthKm: 210,
      features: ['Pakwach Bridge', 'Rhino Camp', 'Laropi Ferry', 'Moyo Escarpment'],
      courseCoordinates: [
        [2.450, 31.500],
        [2.800, 31.400],
        [3.200, 31.600],
        [3.600, 31.850]
      ]
    },
    {
      id: 'river-katonga',
      name: 'River Katonga',
      source: 'Swamps between Lake Victoria and Lake George',
      mouth: 'Lake Victoria (Lukaya)',
      lengthKm: 220,
      features: ['Katonga Wildlife Reserve', 'East-West drainage divide reversal', 'Lukaya wetlands'],
      courseCoordinates: [
        [0.100, 30.600],
        [0.050, 31.100],
        [-0.010, 31.700],
        [-0.150, 32.000]
      ]
    },
    {
      id: 'river-aswa',
      name: 'River Aswa (Achwa)',
      source: 'Karamoja / Lango plateau',
      mouth: 'White Nile (South Sudan)',
      lengthKm: 300,
      features: ['Pader and Gulu drainage', 'Seasonal torrential discharge', 'Aswa hydro site'],
      courseCoordinates: [
        [2.400, 33.200],
        [2.800, 32.800],
        [3.200, 32.300],
        [3.650, 31.950]
      ]
    }
  ];

  // 4. NATIONAL PARKS & CONSERVATION RESERVES
  GeoDatasets.UGANDA_NATIONAL_PARKS = [
    {
      id: 'murchison-falls-np',
      name: 'Murchison Falls National Park',
      areaKm2: 3893,
      gazettedYear: 1952,
      lat: 2.2500,
      lng: 31.7500,
      ecosystem: 'Borassus savanna, riverine forest, Nile delta swamps',
      wildlife: ['African elephant', 'Rothschild giraffe', 'Lion', 'Nile crocodile', 'Shoebill stork']
    },
    {
      id: 'queen-elizabeth-np',
      name: 'Queen Elizabeth National Park',
      areaKm2: 1978,
      gazettedYear: 1952,
      lat: -0.2000,
      lng: 30.0000,
      ecosystem: 'Acacia woodland, savanna, volcanic crater lakes, papyrus swamps',
      wildlife: ['Tree-climbing lions (Ishasha)', 'Hippopotamus', 'Uganda kob', 'Chimpanzees (Kyambura)']
    },
    {
      id: 'kidepo-valley-np',
      name: 'Kidepo Valley National Park',
      areaKm2: 1442,
      gazettedYear: 1962,
      lat: 3.9000,
      lng: 33.8000,
      ecosystem: 'Semi-arid savanna, Narus valley oasis, Mount Morungole slopes',
      wildlife: ['Cheetah', 'Bat-eared fox', 'Caracal', 'Lion', 'African buffalo herds']
    },
    {
      id: 'bwindi-impenetrable-np',
      name: 'Bwindi Impenetrable National Park',
      areaKm2: 331,
      gazettedYear: 1991,
      lat: -1.0500,
      lng: 29.6500,
      ecosystem: 'Afromontane ancient rainforest, mist-covered ridges',
      wildlife: ['Mountain gorillas (Gorilla beringei beringei)', 'Albertine rift endemic birds', 'Colobus monkeys']
    },
    {
      id: 'rwenzori-mountains-np',
      name: 'Rwenzori Mountains National Park',
      areaKm2: 998,
      gazettedYear: 1991,
      lat: 0.3500,
      lng: 29.9000,
      ecosystem: 'Altitudinal zonation: montane forest, bamboo, heather, alpine afro-alpine moorland, glaciers',
      wildlife: ['Giant lobelias', 'Tree heathers', 'Rwenzori colobus', 'Three-horned chameleon']
    },
    {
      id: 'mount-elgon-np',
      name: 'Mount Elgon National Park',
      areaKm2: 1121,
      gazettedYear: 1992,
      lat: 1.1500,
      lng: 34.5000,
      ecosystem: 'Montane forest, bamboo zone, giant groundsels, Kitum elephant salt caves',
      wildlife: ['Black and white colobus', 'Defassa waterbuck', 'Over 300 bird species']
    },
    {
      id: 'kibale-np',
      name: 'Kibale National Park',
      areaKm2: 795,
      gazettedYear: 1993,
      lat: 0.5000,
      lng: 30.4000,
      ecosystem: 'Medium-altitude moist evergreen rainforest',
      wildlife: ['13 primate species', 'Highest density of chimpanzees in Africa', 'L\'Hoest monkey']
    },
    {
      id: 'lake-mburo-np',
      name: 'Lake Mburo National Park',
      areaKm2: 370,
      gazettedYear: 1983,
      lat: -0.6000,
      lng: 30.9500,
      ecosystem: 'Acacia savanna, wetland valleys, rocky outcrops',
      wildlife: ['Burchell zebra', 'Impala', 'Eland', 'Leopard', 'African fish eagle']
    }
  ];

  // 5. EAST AFRICAN RIFT SYSTEM (EARS) - FAULTS & VOLCANISM
  GeoDatasets.EAST_AFRICAN_RIFT = {
    tectonicSummary: 'Divergent plate boundary where the African Plate is splitting into the Nubian Subplate (west) and Somali Subplate (east) at a rate of 6-7 mm per year.',
    branches: [
      {
        name: 'Western Branch (Albertine Rift)',
        lengthKm: 1200,
        trenchType: 'Deep graben with high relief, seismic faulting, deep freshwater lakes, and active horst mountains.',
        majorFeatures: [
          { name: 'Albertine Graben', lat: 1.5, lng: 30.8, type: 'Asymmetric Graben with oil reserves' },
          { name: 'Rwenzori Horst Mountain', lat: 0.38, lng: 29.87, type: 'Crystalline Block / Horst Mountain (5,109 m)' },
          { name: 'Bunyoro Escarpment', lat: 1.7, lng: 31.3, type: 'Fault Scarp rising 300 m above lake' },
          { name: 'Virunga Volcanic Chain', lat: -1.4, lng: 29.6, type: '8 active and dormant strato-volcanoes' }
        ],
        faultLinePoints: [
          [3.5, 31.6], [2.2, 31.3], [1.5, 30.8], [0.5, 30.0],
          [-0.3, 29.6], [-1.3, 29.4], [-2.5, 29.0], [-5.0, 29.5]
        ]
      },
      {
        name: 'Eastern Branch (Gregory Rift)',
        lengthKm: 1800,
        trenchType: 'Volcanically prolific rift with shallow alkaline/soda lakes, calderas, and basaltic fissures.',
        majorFeatures: [
          { name: 'Mount Kilimanjaro (Kibo)', lat: -3.067, lng: 37.355, type: 'Highest peak in Africa (5,895 m)' },
          { name: 'Mount Kenya (Batian)', lat: -0.150, lng: 37.308, type: 'Extinct stratovolcano (5,199 m)' },
          { name: 'Ol Doinyo Lengai', lat: -2.764, lng: 35.914, type: 'Only active natrocarbonatite volcano on Earth' },
          { name: 'Lake Natron & Lake Nakuru', lat: -0.370, lng: 36.080, type: 'Alkaline soda lakes with flamingo populations' }
        ],
        faultLinePoints: [
          [4.5, 36.0], [2.0, 36.2], [0.5, 36.1], [-1.2, 36.3],
          [-2.5, 36.0], [-3.8, 35.8], [-6.0, 36.2]
        ]
      }
    ]
  };

  // 6. GLOBAL TECTONIC PLATES & BOUNDARIES
  GeoDatasets.GLOBAL_TECTONICS = [
    {
      name: 'African Plate (Nubian Plate)',
      areaMillionKm2: 61.3,
      motionMmYear: 21.5,
      motionDirection: 'North-Northeast',
      centerLat: 5.0,
      centerLng: 20.0
    },
    {
      name: 'Somali Plate',
      areaMillionKm2: 16.7,
      motionMmYear: 6.0,
      motionDirection: 'Southeast (rifting from Nubian plate)',
      centerLat: -5.0,
      centerLng: 45.0
    },
    {
      name: 'Eurasian Plate',
      areaMillionKm2: 67.8,
      motionMmYear: 18.0,
      motionDirection: 'East-Southeast',
      centerLat: 50.0,
      centerLng: 80.0
    },
    {
      name: 'Indo-Australian Plate',
      areaMillionKm2: 58.9,
      motionMmYear: 60.0,
      motionDirection: 'North-Northeast (colliding with Eurasian plate creating Himalayas)',
      centerLat: -20.0,
      centerLng: 110.0
    },
    {
      name: 'Pacific Plate',
      areaMillionKm2: 103.3,
      motionMmYear: 81.0,
      motionDirection: 'Northwest (driving the Pacific Ring of Fire)',
      centerLat: 0.0,
      centerLng: -160.0
    },
    {
      name: 'North American Plate',
      areaMillionKm2: 75.9,
      motionMmYear: 23.0,
      motionDirection: 'West-Southwest',
      centerLat: 45.0,
      centerLng: -100.0
    },
    {
      name: 'South American Plate',
      areaMillionKm2: 43.6,
      motionMmYear: 28.0,
      motionDirection: 'West (converging with Nazca Plate creating Andes)',
      centerLat: -20.0,
      centerLng: -60.0
    },
    {
      name: 'Antarctic Plate',
      areaMillionKm2: 60.9,
      motionMmYear: 12.0,
      motionDirection: 'Radial divergence',
      centerLat: -80.0,
      centerLng: 0.0
    }
  ];

  // 7. CLIMATE STATIONS & DUAL-AXIS HYETOGRAPH DATA
  GeoDatasets.CLIMATE_STATIONS = {
    entebbe: {
      name: 'Entebbe International Airport, Uganda',
      lat: 0.0425,
      lng: 32.4436,
      elevationM: 1146,
      climateType: 'Af - Tropical Rainforest / Equatorial Lake Basin',
      description: 'Bimodal rainfall pattern moderated by Lake Victoria breezes with two pronounced wet seasons (March-May and October-November).',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tempC: [22.8, 23.1, 22.9, 22.5, 22.3, 21.8, 21.2, 21.4, 21.9, 22.3, 22.4, 22.5],
      precipMm: [66, 88, 165, 256, 242, 122, 75, 84, 102, 128, 178, 115]
    },
    gulu: {
      name: 'Gulu Meteorological Station, Northern Uganda',
      lat: 2.7747,
      lng: 32.2990,
      elevationM: 1105,
      climateType: 'Aw - Tropical Wet-and-Dry (Savanna)',
      description: 'Single high-sun rainy season (April to October) driven by the ITCZ overhead, with a distinct dry season from December to February.',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tempC: [24.5, 25.2, 24.8, 23.9, 23.4, 22.8, 22.2, 22.4, 22.8, 23.2, 23.5, 23.8],
      precipMm: [18, 35, 105, 168, 205, 175, 185, 225, 180, 145, 65, 22]
    },
    moroto: {
      name: 'Moroto Airfield Station, Karamoja',
      lat: 2.5333,
      lng: 34.6667,
      elevationM: 1380,
      climateType: 'BSh - Semi-Arid Steppe',
      description: 'High variability in annual precipitation (~650-800 mm). Subject to dry desiccating northeasterly winds during the dry period.',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tempC: [25.1, 25.8, 25.4, 24.1, 23.5, 23.0, 22.5, 22.8, 23.4, 23.9, 24.2, 24.6],
      precipMm: [12, 24, 60, 115, 105, 78, 92, 85, 55, 42, 28, 15]
    },
    kabale: {
      name: 'Kabale Highlands Station, Kigezi',
      lat: -1.2500,
      lng: 29.9833,
      elevationM: 1864,
      climateType: 'Cfb - Subtropical Highland (Cool Montane)',
      description: 'Known as the "Switzerland of Africa" with lower temperatures due to altitude lapse rate (-6.5°C per 1,000 m).',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tempC: [16.8, 17.2, 17.1, 16.9, 16.6, 16.0, 15.5, 16.1, 16.5, 16.8, 16.7, 16.6],
      precipMm: [65, 80, 125, 140, 85, 28, 20, 52, 98, 115, 120, 82]
    },
    mombasa: {
      name: 'Mombasa Port, Kenya Coast',
      lat: -4.0435,
      lng: 39.6682,
      elevationM: 17,
      climateType: 'Am - Tropical Monsoon (Indian Ocean Coast)',
      description: 'Governed by Southeast monsoon winds (Kusi) bringing heavy May rainfall and Northeast monsoon winds (Kaskazi).',
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      tempC: [27.6, 28.1, 28.3, 27.7, 26.1, 25.0, 24.3, 24.4, 24.9, 25.7, 26.7, 27.4],
      precipMm: [25, 15, 55, 155, 240, 90, 70, 65, 70, 100, 95, 75]
    }
  };

  // 8. SAMPLE UGANDA DISTRICTS WITH COORDINATES & REGIONAL DATA
  GeoDatasets.UGANDA_KEY_DISTRICTS = [
    { code: 'KLA', name: 'Kampala', region: 'Central', lat: 0.3476, lng: 32.5825, popDensityPerKm2: 8900, areaKm2: 189 },
    { code: 'WAK', name: 'Wakiso', region: 'Central', lat: 0.4044, lng: 32.4594, popDensityPerKm2: 1520, areaKm2: 1907 },
    { code: 'MUK', name: 'Mukono', region: 'Central', lat: 0.3544, lng: 32.7528, popDensityPerKm2: 380, areaKm2: 1875 },
    { code: 'MAS', name: 'Masaka', region: 'Central', lat: -0.3411, lng: 31.7361, popDensityPerKm2: 260, areaKm2: 1156 },
    { code: 'JIN', name: 'Jinja', region: 'Eastern', lat: 0.4244, lng: 33.2042, popDensityPerKm2: 780, areaKm2: 673 },
    { code: 'MBA', name: 'Mbale', region: 'Eastern', lat: 1.0784, lng: 34.1755, popDensityPerKm2: 950, areaKm2: 518 },
    { code: 'SOR', name: 'Soroti', region: 'Eastern', lat: 1.7147, lng: 33.6111, popDensityPerKm2: 230, areaKm2: 1411 },
    { code: 'TOR', name: 'Tororo', region: 'Eastern', lat: 0.6928, lng: 34.1809, popDensityPerKm2: 440, areaKm2: 1195 },
    { code: 'GUL', name: 'Gulu', region: 'Northern', lat: 2.7747, lng: 32.2990, popDensityPerKm2: 180, areaKm2: 3450 },
    { code: 'LIR', name: 'Lira', region: 'Northern', lat: 2.2472, lng: 32.8997, popDensityPerKm2: 270, areaKm2: 1326 },
    { code: 'ARU', name: 'Arua', region: 'Northern', lat: 3.0303, lng: 30.9108, popDensityPerKm2: 340, areaKm2: 1282 },
    { code: 'MOR', name: 'Moroto', region: 'Northern', lat: 2.5333, lng: 34.6667, popDensityPerKm2: 45, areaKm2: 3538 },
    { code: 'MBR', name: 'Mbarara', region: 'Western', lat: -0.6072, lng: 30.6545, popDensityPerKm2: 310, areaKm2: 1778 },
    { code: 'KAS', name: 'Kasese', region: 'Western', lat: 0.1833, lng: 30.0833, popDensityPerKm2: 240, areaKm2: 2724 },
    { code: 'HOI', name: 'Hoima', region: 'Western', lat: 1.4331, lng: 31.3524, popDensityPerKm2: 195, areaKm2: 1557 },
    { code: 'KBL', name: 'Kabale', region: 'Western', lat: -1.2500, lng: 29.9833, popDensityPerKm2: 420, areaKm2: 572 },
    { code: 'FPT', name: 'Fort Portal', region: 'Western', lat: 0.6544, lng: 30.2744, popDensityPerKm2: 520, areaKm2: 289 }
  ];

  // 9. UGANDA DEMOGRAPHIC AGE-SEX COHORT DATA (UBOS 2024 CENSUS)
  GeoDatasets.UGANDA_DEMOGRAPHICS = {
    totalPopulationMillions: 45.9,
    medianAgeYears: 16.7,
    growthRateAnnualPercent: 2.9,
    dependencyRatioPercent: 88.5,
    cohorts: [
      { age: '0-4', malePercent: 8.4, femalePercent: 8.2 },
      { age: '5-9', malePercent: 7.6, femalePercent: 7.4 },
      { age: '10-14', malePercent: 6.8, femalePercent: 6.7 },
      { age: '15-19', malePercent: 5.8, femalePercent: 5.9 },
      { age: '20-24', malePercent: 4.8, femalePercent: 5.1 },
      { age: '25-29', malePercent: 4.0, femalePercent: 4.2 },
      { age: '30-34', malePercent: 3.2, femalePercent: 3.3 },
      { age: '35-39', malePercent: 2.6, femalePercent: 2.7 },
      { age: '40-44', malePercent: 2.1, femalePercent: 2.1 },
      { age: '45-49', malePercent: 1.6, femalePercent: 1.6 },
      { age: '50-54', malePercent: 1.2, femalePercent: 1.3 },
      { age: '55-59', malePercent: 0.9, femalePercent: 1.0 },
      { age: '60-64', malePercent: 0.7, femalePercent: 0.8 },
      { age: '65+', malePercent: 1.2, femalePercent: 1.5 }
    ]
  };

  // 10. AGRICULTURAL SYSTEMS & IRRIGATION SCHEMES
  GeoDatasets.UGANDA_AGRICULTURAL_ZONES = [
    {
      name: 'Coffee-Banana Crescent (Lake Victoria Basin)',
      type: 'Intensive Perennial Cropping',
      crops: ['Robusta Coffee', 'Matooke (Plantain)', 'Maize', 'Beans', 'Horticulture'],
      rainfallMm: '1200 - 1800',
      soilType: 'Ferralsols and Nitisols (deep volcanic/clay loams)'
    },
    {
      name: 'Montane Arabica Coffee Zones (Elgon & Rwenzori)',
      type: 'Highland Specialty Cash Cropping',
      crops: ['Arabica Coffee (Bugisu/Sebei/Rwenzori)', 'Irish Potatoes', 'Wheat', 'Barley'],
      rainfallMm: '1400 - 2000',
      soilType: 'Andosols (fertile volcanic ash soils)'
    },
    {
      name: 'Northern & Eastern Grain & Oilseed Zone',
      type: 'Annual Grain & Legume Farming',
      crops: ['Sorghum', 'Finger Millet', 'Sesame (Simsim)', 'Sunflower', 'Cassava'],
      rainfallMm: '900 - 1300',
      soilType: 'Plinthosols and Lixisols'
    },
    {
      name: 'Pastoral Cattle Corridor (Karamoja to Ankole)',
      type: 'Nomadic & Semi-Nomadic Pastoralism / Dairy Ranching',
      livestock: ['Zebu', 'Ankole Longhorn', 'Dairy Friesian crosses'],
      rainfallMm: '600 - 900',
      soilType: 'Vertisols and Arenosols (black cotton clay / sandy loams)'
    }
  ];

  GeoDatasets.UGANDA_IRRIGATION_SCHEMES = [
    {
      name: 'Doho Rice Irrigation Scheme',
      district: 'Butaleja (Eastern Uganda)',
      riverSource: 'River Manafwa',
      areaHectares: 1000,
      crop: 'Paddy Rice',
      lat: 0.8500,
      lng: 33.9800
    },
    {
      name: 'Kibimba (Tilda) Rice Scheme',
      district: 'Bugiri (Eastern Uganda)',
      riverSource: 'Kibimba River Dam',
      areaHectares: 1500,
      crop: 'Commercial Rice',
      lat: 0.5333,
      lng: 33.7833
    },
    {
      name: 'Mobuku Irrigation Scheme',
      district: 'Kasese (Western Uganda)',
      riverSource: 'River Sebwe & Mobuku (Rwenzori meltwater)',
      areaHectares: 800,
      crop: 'Horticulture, Maize, Onions, Cotton',
      lat: 0.2833,
      lng: 30.1333
    }
  ];

  // 11. TRANSPORT CORRIDORS & TOURISM CIRCUITS
  GeoDatasets.UGANDA_TRANSPORT_CORRIDORS = [
    {
      name: 'Northern Transport Corridor',
      route: 'Mombasa Port -> Nairobi -> Malaba -> Jinja -> Kampala -> Masaka -> Mbarara -> Katuna -> Kigali',
      modes: ['Tarmac Highway (Trans-African Highway)', 'Meter Gauge Railway / SGR corridor', 'Oil Pipeline'],
      economicSignificance: 'Handles over 80% of Uganda\'s import and export freight tonnage.'
    },
    {
      name: 'Lake Victoria Marine Transport Circuit',
      ports: ['Port Bell (Luzira)', 'Jinja Pier', 'Bukasa Inland Port', 'Mwanza (TZ)', 'Kisumu (KE)'],
      vessels: ['MV Kaawa', 'MV Pamba', 'Wagon Ferries'],
      significance: 'Vital multi-modal link connecting to Central Corridor railway to Dar es Salaam.'
    }
  ];

  // 12. RWENZORI GLACIAL RECESSION TIME-SERIES (Duke of Abruzzi to Present)
  GeoDatasets.RWENZORI_GLACIER_RECESSION = [
    { year: 1906, areaKm2: 7.50, observer: 'Duke of the Abruzzi Expedition (43 distinct glaciers)' },
    { year: 1955, areaKm2: 3.50, observer: 'Geological Survey of Uganda' },
    { year: 1990, areaKm2: 1.70, observer: 'Landsat Thematic Mapper satellite survey' },
    { year: 2005, areaKm2: 0.96, observer: 'USGS / Makerere University Glaciology Project' },
    { year: 2024, areaKm2: 0.35, observer: 'High-resolution Sentinel-2 multispectral imaging' }
  ];

  // 13. MINERAL DEPOSITS & GEOLOGICAL RESOURCES
  GeoDatasets.UGANDA_MINERAL_DEPOSITS = [
    { name: 'Kilembe Copper-Cobalt Mines', mineral: 'Copper & Cobalt', district: 'Kasese', lat: 0.1820, lng: 30.0080, status: 'Under rehabilitation', production: '16,000 tonnes copper concentrate (peak)' },
    { name: 'Karamoja Gold Belt', mineral: 'Gold', district: 'Moroto/Amudat', lat: 2.5, lng: 34.5, status: 'Artisanal & exploration', production: '~5 kg/year artisanal' },
    { name: 'Tororo Cement Works', mineral: 'Limestone & Cement', district: 'Tororo', lat: 0.6930, lng: 34.1809, status: 'Active production', production: '600,000 tonnes/year' },
    { name: 'Hima Cement Limestone Quarry', mineral: 'Limestone & Cement', district: 'Kasese', lat: 0.3300, lng: 30.2200, status: 'Active production', production: '1,200,000 tonnes/year' },
    { name: 'Albertine Graben Oil Basin', mineral: 'Petroleum (crude oil)', district: 'Hoima/Buliisa', lat: 1.4314, lng: 31.3530, status: 'Development phase (6.5 billion barrels)', production: 'Expected 230,000 bbl/day' },
    { name: 'Sukulu Phosphate Complex', mineral: 'Phosphate & Vermiculite', district: 'Tororo', lat: 0.6500, lng: 34.1700, status: 'Active mining', production: '300,000 tonnes/year' },
    { name: 'Busia Gold Mining', mineral: 'Gold', district: 'Busia', lat: 0.4600, lng: 34.0900, status: 'Artisanal mining', production: '~3 kg/year artisanal' },
    { name: 'Muko Iron Ore', mineral: 'Iron Ore (haematite)', district: 'Kabale/Rubanda', lat: -1.2000, lng: 29.9500, status: 'Exploration & licensing', production: '~38 million tonnes reserves' }
  ];

  // 14. SOIL ZONES OF UGANDA
  GeoDatasets.UGANDA_SOIL_ZONES = [
    { name: 'Ferralsols (Tropical Red Soils)', region: 'Central Uganda & Lake Victoria Crescent', description: 'Deep, well-drained, acidic red soils. Rich in iron and aluminium oxides. Support coffee, banana, and maize cultivation.', lat: 0.3, lng: 32.5, color: '#B22222' },
    { name: 'Andosols (Volcanic Ash Soils)', region: 'Mount Elgon & Rwenzori Slopes', description: 'Fertile, dark volcanic soils with high organic matter. Ideal for arabica coffee, potatoes, and wheat.', lat: 1.1, lng: 34.5, color: '#2F4F2F' },
    { name: 'Vertisols (Black Cotton Soils)', region: 'Karamoja & Cattle Corridor', description: 'Expansive clay soils that swell when wet and crack when dry. Challenging for construction; supports pastoralism.', lat: 2.3, lng: 34.0, color: '#1C1C1C' },
    { name: 'Nitisols (Deep Red Clay)', region: 'Western Uganda Highlands', description: 'Deep, well-structured red clay soils with high nutrient capacity. Support tea, coffee, and horticultural crops.', lat: -0.5, lng: 30.5, color: '#8B0000' },
    { name: 'Gleysols (Waterlogged Soils)', region: 'Wetlands & Lake Shores', description: 'Poorly drained, permanently or seasonally waterlogged. Found around Lakes Kyoga, Victoria, and papyrus swamps.', lat: 1.5, lng: 33.0, color: '#4682B4' },
    { name: 'Arenosols (Sandy Soils)', region: 'Lake Albert Shores & Rift Floor', description: 'Coarse-textured, low fertility sandy soils. Poor water retention; requires irrigation for cultivation.', lat: 1.8, lng: 31.0, color: '#DEB887' },
    { name: 'Lixisols (Leached Tropical Soils)', region: 'Northern Uganda', description: 'Moderately weathered soils with accumulation of clay in the subsoil. Support millet, sorghum, and simsim.', lat: 2.8, lng: 32.3, color: '#CD853F' }
  ];

  // 15. FOREST RESERVES
  GeoDatasets.UGANDA_FOREST_RESERVES = [
    { name: 'Budongo Central Forest Reserve', lat: 1.7167, lng: 31.5333, areaKm2: 793, type: 'Tropical High Forest', keySpecies: 'Chimpanzees, Mahogany trees' },
    { name: 'Mabira Central Forest Reserve', lat: 0.4294, lng: 33.0009, areaKm2: 300, type: 'Tropical Moist Deciduous', keySpecies: 'Grey-cheeked mangabey, 312 tree species' },
    { name: 'Bugoma Forest Reserve', lat: 1.1681, lng: 30.9419, areaKm2: 411, type: 'Tropical High Forest', keySpecies: 'Chimpanzees (500+), African elephants' },
    { name: 'Kalinzu Forest Reserve', lat: -0.3500, lng: 30.0833, areaKm2: 137, type: 'Tropical Rainforest', keySpecies: 'Chimpanzees, red-tailed monkeys' },
    { name: 'Kasyoha-Kitomi Forest Reserve', lat: -0.4000, lng: 30.2000, areaKm2: 399, type: 'Tropical High Forest', keySpecies: 'L\'Hoest monkey, varied bird species' }
  ];

  // 16. INDUSTRIAL PARKS & MANUFACTURING CENTRES
  GeoDatasets.UGANDA_INDUSTRIAL_PARKS = [
    { name: 'Namanve Industrial Park', lat: 0.3443, lng: 32.6794, district: 'Wakiso/Mukono', areaHectares: 2200, tenants: 'Steel, pharmaceuticals, plastics, food processing', status: 'Operational' },
    { name: 'Jinja Industrial Area', lat: 0.4244, lng: 33.2042, district: 'Jinja', areaHectares: 450, tenants: 'Nile Breweries, SCOUL Sugar, Kakira Sugar', status: 'Operational (historical base)' },
    { name: 'Mbale Industrial Park', lat: 1.0647, lng: 34.1747, district: 'Mbale', areaHectares: 620, tenants: 'Grain milling, coffee processing, steel rolling', status: 'Operational' },
    { name: 'Luzira Industrial Zone', lat: 0.3094, lng: 32.6400, district: 'Kampala', areaHectares: 150, tenants: 'Mukwano Industries, textiles, beverages', status: 'Operational' },
    { name: 'Kasese Cobalt Processing', lat: 0.1833, lng: 30.0833, district: 'Kasese', areaHectares: 80, tenants: 'Kilembe Mines rehabilitation, cement', status: 'Under development' }
  ];

  // 17. TOURIST CIRCUITS & HERITAGE SITES
  GeoDatasets.UGANDA_TOURIST_CIRCUITS = [
    {
      name: 'Western Circuit (Gorilla & Primates)',
      route: 'Kampala → Fort Portal → Kibale NP → Queen Elizabeth NP → Bwindi → Lake Bunyonyi → Kampala',
      highlights: ['Chimpanzee tracking (Kibale)', 'Tree-climbing lions (Ishasha)', 'Mountain gorilla trekking (Bwindi)', 'Lake Bunyonyi (one of deepest in Africa)'],
      durationDays: 7,
      coordinates: [
        { lat: 0.3136, lng: 32.5811, label: 'Kampala' },
        { lat: 0.6544, lng: 30.2744, label: 'Fort Portal' },
        { lat: 0.4136, lng: 30.3808, label: 'Kibale NP' },
        { lat: -0.1978, lng: 30.0004, label: 'Queen Elizabeth NP' },
        { lat: -1.0530, lng: 29.6150, label: 'Bwindi Impenetrable NP' },
        { lat: -1.2833, lng: 29.9167, label: 'Lake Bunyonyi' }
      ]
    },
    {
      name: 'Northern Circuit (Murchison & Kidepo)',
      route: 'Kampala → Ziwa Rhino Sanctuary → Murchison Falls NP → Kidepo Valley NP → Kampala',
      highlights: ['Rhino tracking (Ziwa)', 'Murchison Falls boat safari', 'Kidepo wilderness (cheetah, bat-eared fox)', 'Top of the Falls hike'],
      durationDays: 6,
      coordinates: [
        { lat: 0.3136, lng: 32.5811, label: 'Kampala' },
        { lat: 1.7833, lng: 32.0667, label: 'Ziwa Rhino Sanctuary' },
        { lat: 2.2783, lng: 31.6847, label: 'Murchison Falls NP' },
        { lat: 3.8667, lng: 33.8833, label: 'Kidepo Valley NP' }
      ]
    },
    {
      name: 'Central & Eastern Circuit (Nile & Mountains)',
      route: 'Kampala → Jinja (Source of Nile) → Sipi Falls → Mt Elgon NP → Mbale → Kampala',
      highlights: ['White-water rafting (Nile)', 'Source of the Nile boat trip', 'Sipi Falls hiking & abseiling', 'Mt Elgon caldera trail'],
      durationDays: 4,
      coordinates: [
        { lat: 0.3136, lng: 32.5811, label: 'Kampala' },
        { lat: 0.4244, lng: 33.2042, label: 'Jinja' },
        { lat: 1.3247, lng: 34.3567, label: 'Sipi Falls' },
        { lat: 1.1167, lng: 34.5667, label: 'Mt Elgon NP' }
      ]
    }
  ];

  // 18. HERITAGE SITES
  GeoDatasets.UGANDA_HERITAGE_SITES = [
    { name: 'Kasubi Royal Tombs', lat: 0.3375, lng: 32.5522, type: 'UNESCO World Heritage', description: 'Burial ground of Baganda kings (Kabaka). Major cultural site since 1882.' },
    { name: 'Bigo Bya Mugenyi Earthworks', lat: 0.0833, lng: 31.3833, type: 'Archaeological', description: 'Ancient Iron Age earthwork ditches and mounds, linked to Bachwezi dynasty.' },
    { name: 'Nyero Rock Paintings', lat: 1.5833, lng: 33.6500, type: 'Archaeological', description: 'Geometric rock art dating to 3,000 years ago. White concentric circle motifs.' },
    { name: 'Fort Lugard (Kampala Hill)', lat: 0.3137, lng: 32.5806, type: 'Colonial Heritage', description: 'Site of Captain Lugard\'s fort (1890). Marks the founding of modern Kampala.' },
    { name: 'Namugongo Martyrs Shrine', lat: 0.3680, lng: 32.6280, type: 'Religious Heritage', description: 'Basilica commemorating 45 Christian martyrs killed by Kabaka Mwanga II in 1886.' }
  ];

  // 19. OCEAN CURRENTS (East Africa)
  GeoDatasets.EAST_AFRICA_OCEAN_CURRENTS = [
    { name: 'Agulhas Current', type: 'warm', direction: 'SW along SE Africa coast', origin: 'Mozambique Channel / Indian Ocean gyre', effect: 'Brings warm moisture, heavy rainfall on east coast' },
    { name: 'Benguela Current', type: 'cold', direction: 'N along SW Africa coast', origin: 'Antarctic circumpolar current', effect: 'Creates arid conditions (Namib & Kalahari deserts)' },
    { name: 'Mozambique Current', type: 'warm', direction: 'S through Mozambique Channel', origin: 'South Equatorial Current', effect: 'Warms coastal waters of Mozambique and Madagascar' },
    { name: 'Somali Current', type: 'warm', direction: 'NE along Horn of Africa', origin: 'SW monsoon (seasonal reversal)', effect: 'Seasonal upwelling supporting rich marine fisheries' }
  ];

  // 20. SETTLEMENT HIERARCHY (Uganda)
  GeoDatasets.UGANDA_SETTLEMENT_HIERARCHY = [
    { name: 'Kampala', rank: 'Primate City / Capital', population: 1680000, functions: 'National government, commerce, industry, universities, international airport', lat: 0.3136, lng: 32.5811 },
    { name: 'Gulu', rank: 'Regional Centre (2nd)', population: 152276, functions: 'Northern regional capital, Gulu University, military base', lat: 2.7746, lng: 32.2990 },
    { name: 'Jinja', rank: 'Industrial Town (3rd)', population: 76250, functions: 'Industry (steel, sugar, brewing), Source of Nile tourism', lat: 0.4244, lng: 33.2042 },
    { name: 'Mbarara', rank: 'Regional Centre (4th)', population: 97400, functions: 'Western Uganda hub, dairy industry, MUST university', lat: -0.6118, lng: 30.6546 },
    { name: 'Fort Portal', rank: 'Tourism Town', population: 54275, functions: 'Western tourism gateway, Tooro Kingdom capital', lat: 0.6544, lng: 30.2744 },
    { name: 'Mbale', rank: 'Eastern Regional Town', population: 96189, functions: 'Coffee processing hub, Mt Elgon gateway', lat: 1.0647, lng: 34.1747 }
  ];


  // 21. GLOBAL STUDY AREAS & CONTINENTS REGISTRY FOR TUTOR REGIONAL SELECTION
  GeoDatasets.GLOBAL_STUDY_AREAS = {
    africa: {
      name: 'Africa',
      regions: [
        {
          id: 'uganda_all',
          name: 'Uganda (East Africa • Victoria Basin & Rift Valley)',
          lat: 1.3733, lng: 32.2903, zoom: 7,
          caseStudy: 'Equatorial highlands, Lake Victoria crustal warping, Albertine Rift Valley, Mount Rwenzori (5,109m), Mount Elgon (4,321m), Victoria Nile.',
          topics: ['Geomorphology', 'Weather & Climate', 'Rivers & Hydrology', 'Population', 'Agriculture']
        },
        {
          id: 'kenya_rift',
          name: 'Kenya (Gregory Rift Valley, Mt Kenya & Coast)',
          lat: 0.0236, lng: 37.9062, zoom: 7,
          caseStudy: 'Eastern Rift branch, Lake Nakuru/Naivasha, Mount Kenya extinct stratovolcano, Mombasa coastal geomorphology and Port trade.',
          topics: ['Volcanism', 'Tourism', 'Coastal Landforms']
        },
        {
          id: 'tanzania_kilimanjaro',
          name: 'Tanzania (Kilimanjaro, Serengeti & Ngorongoro Caldera)',
          lat: -3.0674, lng: 37.3556, zoom: 8,
          caseStudy: 'Mount Kilimanjaro (5,895m Kibo peak, highest in Africa), Ngorongoro caldera collapsed crater, Serengeti savanna ecosystem.',
          topics: ['Volcanoes', 'Wildlife', 'Ecosystems']
        },
        {
          id: 'egypt_nile',
          name: 'Egypt (Nile River Delta, Aswan Dam & Sahara)',
          lat: 26.8206, lng: 30.8025, zoom: 6,
          caseStudy: 'Arcuate Nile Delta, Aswan High Dam irrigation and silt retention, arid desert geomorphology (barchan dunes, hamada).',
          topics: ['River Deltas', 'Irrigation', 'Arid Landforms']
        },
        {
          id: 'drc_congo',
          name: 'DR Congo (Congo River Basin Rainforest & Nyiragongo)',
          lat: -4.0383, lng: 21.7587, zoom: 6,
          caseStudy: 'Congo rainforest drainage basin (second largest river by discharge), Mount Nyiragongo active stratovolcano and persistent lava lake.',
          topics: ['Tropical Biomes', 'Volcanoes', 'Hydrology']
        },
        {
          id: 'south_africa_cape',
          name: 'South Africa (Cape Fold Belt & Drakensberg Escarpment)',
          lat: -30.5595, lng: 22.9375, zoom: 6,
          caseStudy: 'Cape Fold Mountains (anticlinal/synclinal ridges), Drakensberg basaltic plateau escarpment, Witwatersrand gold reefs.',
          topics: ['Folding', 'Escarpments', 'Mining']
        },
        {
          id: 'nigeria_delta',
          name: 'Nigeria (Niger Delta Mangroves, Sahel & Oil Fields)',
          lat: 9.0820, lng: 8.6753, zoom: 6,
          caseStudy: 'Lobate Niger River Delta, petroleum extraction impacts, Sahel desertification transition zone in the north.',
          topics: ['Deltas', 'Energy Resources', 'Desertification']
        },
        {
          id: 'morocco_atlas',
          name: 'Morocco (Atlas Fold Mountains & Sahara Margins)',
          lat: 31.7917, lng: -7.0926, zoom: 6,
          caseStudy: 'Atlas Alpine orogeny fold mountain range (Toubkal 4,167m), rain shadow effect producing the Sahara arid expanse.',
          topics: ['Fold Mountains', 'Rain Shadow', 'Arid Geography']
        }
      ]
    },
    europe: {
      name: 'Europe',
      regions: [
        {
          id: 'switzerland_alps',
          name: 'Switzerland (The Alps • Glacial Troughs & Matterhorn)',
          lat: 46.8182, lng: 8.2275, zoom: 8,
          caseStudy: 'Alpine mountain orogeny, Matterhorn pyramidal horn, Lauterbrunnen U-shaped glacial valley with hanging waterfalls, Aletsch Glacier.',
          topics: ['Glacial Landforms', 'Orogeny', 'Tourism']
        },
        {
          id: 'uk_jurassic',
          name: 'United Kingdom (Jurassic Coast & Lake District)',
          lat: 54.5, lng: -3.0, zoom: 6,
          caseStudy: 'Dorset Jurassic Coast (Old Harry Rocks stack, Lulworth Cove concordant coast, Chesil Beach tombolo), Lake District glacial ribbon lakes.',
          topics: ['Coastal Landforms', 'Glacial Lakes', 'Geology']
        },
        {
          id: 'norway_fjords',
          name: 'Norway (Geirangerfjord & Glacial Fjords)',
          lat: 62.1, lng: 7.2, zoom: 8,
          caseStudy: 'Deep submerged glacial U-shaped valleys (fjords), threshold shallow mouth, steep cliffs with hanging valley waterfalls.',
          topics: ['Fjords', 'Glaciation', 'Hydroelectricity']
        },
        {
          id: 'iceland_rift',
          name: 'Iceland (Mid-Atlantic Ridge Tectonic Rift & Geothermal)',
          lat: 64.9631, lng: -19.0208, zoom: 7,
          caseStudy: 'Divergent plate boundary between North American and Eurasian plates at Thingvellir, fissure volcanism (Eyjafjallajökull), geysers.',
          topics: ['Plate Tectonics', 'Volcanism', 'Geothermal Energy']
        },
        {
          id: 'italy_volcanoes',
          name: 'Italy (Vesuvius, Mount Etna & Apennine Folding)',
          lat: 40.8224, lng: 14.4289, zoom: 7,
          caseStudy: 'Mount Vesuvius and Etna (destructive plate subduction volcanism), caldera collapse at Campi Flegrei, Mediterranean climate.',
          topics: ['Plate Subduction', 'Volcanoes', 'Hazards']
        },
        {
          id: 'germany_rhine',
          name: 'Germany (Rhine Graben Rift Valley & Black Forest)',
          lat: 48.5, lng: 8.0, zoom: 8,
          caseStudy: 'Classic European continental rift graben flanked by the Black Forest (Schwarzwald) and Vosges horst mountains.',
          topics: ['Rift Valleys', 'Horst Mountains', 'River Transport']
        },
        {
          id: 'netherlands_polders',
          name: 'Netherlands (Rhine-Meuse Delta & Zuiderzee Polders)',
          lat: 52.1326, lng: 5.2913, zoom: 8,
          caseStudy: 'Coastal lowlands and reclamation (polders, dykes, Delta Works flood barrier system), sea level rise vulnerability.',
          topics: ['Coastal Engineering', 'Flood Management', 'Settlement']
        }
      ]
    },
    asia: {
      name: 'Asia',
      regions: [
        {
          id: 'nepal_himalayas',
          name: 'Nepal / China (Himalayas • Mount Everest & Collision Orogeny)',
          lat: 27.9881, lng: 86.9250, zoom: 8,
          caseStudy: 'Continental-continental convergent collision (Indian Plate under Eurasian Plate), Mount Everest (8,848m), ongoing crustal uplift.',
          topics: ['Plate Collisions', 'Fold Mountains', 'Glaciation']
        },
        {
          id: 'japan_ring_of_fire',
          name: 'Japan (Mount Fuji, Subduction Arc & Ring of Fire)',
          lat: 35.3606, lng: 138.7274, zoom: 7,
          caseStudy: 'Triple plate subduction junction, Pacific Ring of Fire, Mount Fuji composite cone, earthquake and tsunami engineering.',
          topics: ['Tectonic Hazards', 'Stratovolcanoes', 'Urban Defense']
        },
        {
          id: 'india_ganga',
          name: 'India (Indo-Gangetic Plain, Deccan Traps & Monsoons)',
          lat: 25.0, lng: 82.0, zoom: 6,
          caseStudy: 'Extensive alluvial deposition plain, Deccan Traps flood basalt plateau, Southwest Asian summer monsoon dynamics.',
          topics: ['Alluvial Plains', 'Monsoons', 'Agriculture']
        },
        {
          id: 'bangladesh_delta',
          name: 'Bangladesh (Ganges-Brahmaputra Sundarbans Delta)',
          lat: 22.5, lng: 89.5, zoom: 8,
          caseStudy: "World\'s largest river delta, Sundarbans mangrove swamp ecosystem, seasonal cyclone storm surges and sea-level rise vulnerability.",
          topics: ['Deltas', 'Cyclones', 'Wetlands']
        },
        {
          id: 'indonesia_java',
          name: 'Indonesia (Java Volcanic Island Arc & Krakatoa)',
          lat: -7.5, lng: 110.0, zoom: 7,
          caseStudy: 'Indo-Australian subduction beneath Sunda Plate, Krakatoa caldera collapse and tsunami, rich volcanic andosol soils supporting high density.',
          topics: ['Island Arcs', 'Calderas', 'Population Density']
        },
        {
          id: 'saudi_erg',
          name: 'Saudi Arabia (Rub\' al Khali Arid Erg Sand Sea)',
          lat: 22.0, lng: 50.0, zoom: 6,
          caseStudy: 'Subtropical high-pressure descending air, barchan and seif longitudinal sand dunes, hyper-arid desert geomorphology.',
          topics: ['Arid Landscapes', 'Aeolian Processes', 'Deserts']
        },
        {
          id: 'china_yangtze',
          name: 'China (Yangtze River, Three Gorges & Loess Plateau)',
          lat: 30.82, lng: 111.0, zoom: 7,
          caseStudy: 'Three Gorges Dam hydroelectric engineering and flood control, wind-blown Loess Plateau soil erosion.',
          topics: ['River Management', 'Soil Erosion', 'Dams']
        }
      ]
    },
    north_america: {
      name: 'North America',
      regions: [
        {
          id: 'usa_grand_canyon',
          name: 'United States (Grand Canyon • Colorado River Incision)',
          lat: 36.1069, lng: -112.1129, zoom: 9,
          caseStudy: 'Colorado Plateau uplift and continuous river canyon incision, 1.8-billion-year stratified geological cross-section (Vishnu schist to Kaibab limestone).',
          topics: ['River Incision', 'Stratigraphy', 'Arid Weathering']
        },
        {
          id: 'usa_san_andreas',
          name: 'United States (San Andreas Fault Transform Boundary)',
          lat: 35.1, lng: -119.6, zoom: 8,
          caseStudy: 'Right-lateral conservative transform fault between Pacific and North American plates, offset stream channels, earthquake hazard.',
          topics: ['Transform Faults', 'Earthquakes', 'Tectonics']
        },
        {
          id: 'usa_mississippi',
          name: 'United States (Mississippi River Delta & Floodplain Meanders)',
          lat: 29.2, lng: -89.2, zoom: 8,
          caseStudy: "Bird\'s-foot Mississippi Delta, artificial levées, oxbow lake development, wetland subsidence and coastal erosion.",
          topics: ['Bird-Foot Delta', 'Meanders', 'River Management']
        },
        {
          id: 'usa_yellowstone',
          name: 'United States (Yellowstone Continental Hotspot Caldera)',
          lat: 44.4280, lng: -110.5885, zoom: 8,
          caseStudy: 'Continental supervolcano caldera (70×45 km), geothermal geysers (Old Faithful), hot springs and hydrothermal features.',
          topics: ['Supervolcanoes', 'Hotspots', 'Geothermal']
        },
        {
          id: 'canada_shield',
          name: 'Canada (Canadian Shield & Post-Glacial Isostatic Rebound)',
          lat: 52.0, lng: -85.0, zoom: 5,
          caseStudy: 'Precambrian crystalline rock shield, Pleistocene continental ice sheet scouring, thousands of kettle and deranged drainage lakes, isostatic uplift.',
          topics: ['Glacial Scour', 'Isostasy', 'Mineral Belts']
        }
      ]
    },
    south_america: {
      name: 'South America',
      regions: [
        {
          id: 'brazil_amazon',
          name: 'Brazil (Amazon River Basin & Tropical Rainforest)',
          lat: -3.4653, lng: -62.2159, zoom: 6,
          caseStudy: "World\'s largest drainage basin (discharge >200,000 m³/s), tropical rainforest nutrient cycling, deforestation along Trans-Amazonian Highway.",
          topics: ['Rainforest Ecosystems', 'Hydrology', 'Deforestation']
        },
        {
          id: 'chile_atacama',
          name: 'Chile (Atacama Desert • Cold Current Rain Shadow)',
          lat: -23.8634, lng: -69.1328, zoom: 7,
          caseStudy: 'Driest non-polar desert on Earth, caused by cold offshore Humboldt (Peru) Current, subtropical Pacific high pressure, and Andes rain shadow.',
          topics: ['Ocean Currents', 'Hyper-Aridity', 'Mining']
        },
        {
          id: 'peru_andes',
          name: 'Peru (Andes Cordillera Orogeny & Altiplano)',
          lat: -13.1631, lng: -72.5450, zoom: 7,
          caseStudy: 'Nazca plate subduction beneath South American plate, high-altitude Altiplano plateau (Lake Titicaca), vertical agricultural zonation.',
          topics: ['Fold Mountains', 'Subduction', 'Altitudinal Zonation']
        },
        {
          id: 'argentina_patagonia',
          name: 'Argentina (Patagonian Ice Sheet & Perito Moreno)',
          lat: -50.4962, lng: -73.1377, zoom: 8,
          caseStudy: 'Southern Patagonian Icefield, calving outlet glacier into Lake Argentino, katabatic winds, arid Patagonian steppe rain shadow.',
          topics: ['Glacial Calving', 'Ice Sheets', 'Rain Shadow']
        }
      ]
    },
    oceania: {
      name: 'Oceania & Australasia',
      regions: [
        {
          id: 'australia_barrier_reef',
          name: 'Australia (Great Barrier Reef & Coral Geomorphology)',
          lat: -18.2871, lng: 147.6992, zoom: 7,
          caseStudy: "World\'s largest coral reef ecosystem (2,300 km), fringing reefs, barrier reefs and atolls, ocean warming and coral bleaching.",
          topics: ['Coral Reefs', 'Coastal Ecology', 'Climate Change']
        },
        {
          id: 'australia_uluru',
          name: 'Australia (Uluru / Kata Tjuta Arid Inselbergs)',
          lat: -25.3444, lng: 131.0369, zoom: 9,
          caseStudy: 'Arkose sandstone monolith inselberg rising 348m above central desert sand plains, exfoliation flaking, honeycomb weathering.',
          topics: ['Inselbergs', 'Arid Weathering', 'Monoliths']
        },
        {
          id: 'nz_southern_alps',
          name: 'New Zealand (Southern Alps & Alpine Fault)',
          lat: -43.5950, lng: 170.1418, zoom: 7,
          caseStudy: 'Pacific-Australian oblique plate collision along Alpine Fault, Franz Josef and Fox valley glaciers terminating in temperate rainforest.',
          topics: ['Glacial Valleys', 'Plate Collision', 'Fjords']
        }
      ]
    },
    polar: {
      name: 'Polar & Cryosphere',
      regions: [
        {
          id: 'antarctica_ross',
          name: 'Antarctica (Ross Ice Shelf & Transantarctic Mountains)',
          lat: -82.0, lng: 175.0, zoom: 4,
          caseStudy: "World\'s largest floating ice shelf (size of France), ice sheet mass balance, katabatic winds, subglacial lakes (Lake Vostok).",
          topics: ['Ice Shelves', 'Polar Deserts', 'Sea Level Rise']
        },
        {
          id: 'greenland_icesheet',
          name: 'Greenland (Inland Ice Sheet & Sermeq Kujalleq Glacier)',
          lat: 69.2, lng: -50.0, zoom: 6,
          caseStudy: 'Fastest-moving ice stream (Jakobshavn / Ilulissat Icefjord), massive iceberg calving into Baffin Bay, climate warming melt rate.',
          topics: ['Glacial Calving', 'Ice Sheets', 'Cryosphere Dynamics']
        }
      ]
    }
  };

  // 22. REAL-LIFE CURRICULUM FORMATION SPECIFICATIONS FOR 3D GEOMORPHOLOGY
  GeoDatasets.REAL_WORLD_LANDFORMS = {
    rift_valley: {
      name: 'Albertine Rift Valley Graben',
      location: 'Western Uganda / DR Congo border (East African Rift System)',
      type: 'Tensional Tectonic Rift Graben',
      scale: 'Width: 45 km | Length: 600 km | Depth: 2,000m sediment infill',
      formationTheory: 'Formed by horizontal tensional stress pulling the African continental lithosphere apart (Nubian and Somali plates), causing the central graben crust to drop along normal fault planes (Butiaba and Blue Mountain escarpments).',
      examPoints: ['Graben floor occupied by Lake Albert and Lake Tanganyika', 'Parallel steep fault scarps (escarpments)', 'Step faulting along margins', 'Associated with volcanic activity and hot springs (Kibiro, Sempaya)']
    },
    horst_mountain: {
      name: 'Mount Rwenzori Massif (Block Mountain)',
      location: 'Uganda / DR Congo border (Central Albertine Rift)',
      type: 'Tectonically Uplifted Crystalline Horst Block',
      scale: 'Peak: Margherita (5,109m a.s.l.) | Dimensions: 120 km × 50 km',
      formationTheory: 'Unlike Kilimanjaro or Elgon, Rwenzori is NOT volcanic. It is a crystalline block of Precambrian metamorphic rock (gneiss, granite, schist) pushed up between flanking rift faults during Cenozoic tectonic uplift.',
      examPoints: ['Highest non-volcanic mountain in Africa', 'Steep fault-bounded escarpments on both sides', 'Permanent glaciers and hanging cirques above 4,500m', 'Produces severe orographic rainfall (>2,500mm/yr)']
    },
    elgon_caldera: {
      name: 'Mount Elgon Volcanic Caldera',
      location: 'Uganda / Kenya border (Eastern Uganda)',
      type: 'Collapsed Basaltic/Andesitic Shield Caldera',
      scale: 'Diameter: 8 km | Area: 40 km² | Summit: Wagagai (4,321m)',
      formationTheory: 'Enormous Miocene-era shield volcano whose central magma chamber was evacuated by cataclysmic eruptions, causing the unsupported summit cone to collapse inward into a vast caldera crater, subsequently breached by the Suam Gorge.',
      examPoints: ['One of the largest intact calderas in the world', 'Caldera wall breached by river erosion (Suam river)', 'Fertile volcanic andosols supporting Bugisu Arabica coffee', 'Hot springs and secondary explosion craters']
    },
    volcano: {
      name: 'Mount Nyiragongo & Kilimanjaro (Stratovolcano)',
      location: 'Virunga Volcanic Arc (DRC) & Tanzania',
      type: 'Composite Stratovolcano with Central Conduit',
      scale: 'Nyiragongo: 3,470m (active lava lake) | Kilimanjaro: 5,895m',
      formationTheory: 'Constructed from alternating layers (strata) of viscous andesitic/basaltic lava flows and pyroclastic tephra/ash ejected from repeated explosive and effusive eruptions along a central volcanic pipe.',
      examPoints: ['Summit crater containing an active ultra-alkaline lava lake', 'Steep conical flanks formed by viscous lava cooling rapidly', 'Parasitic cinder cones and fissure vents along the flanks', 'Volcanic hazards: fast-moving lava flows, tephra fall, toxic volcanic gases']
    },
    anticline_syncline: {
      name: 'Jura Mountains & Cape Fold Belt',
      location: 'Switzerland/France & South Africa',
      type: 'Compressional Wave-Folded Sedimentary Strata',
      scale: 'Wavelength: 5 - 15 km | Strata thickness: 3,000m',
      formationTheory: 'Formed by horizontal compressional tectonic forces caused by converging continental plates, warping flexible sedimentary strata (limestone, sandstone, shale) into alternating upfolds (anticlines) and downfolds (synclines).',
      examPoints: ['Anticline: Upfold crest forming mountain ridges', 'Syncline: Downfold trough forming river valleys', 'Overthrust folds and nappes under extreme compression', 'Differential erosion cuts water gaps and chevron valleys']
    },
    glacial_valley: {
      name: 'Matterhorn & Bujuku U-Shaped Glacial Trough',
      location: 'Swiss Alps & Mount Rwenzori (Uganda)',
      type: 'Alpine Glacial Erosional Complex',
      scale: 'Trough depth: 600m | Horn height: 1,200m vertical relief',
      formationTheory: 'Pleistocene glaciers occupied pre-existing V-shaped river valleys. Glacial plucking and basal abrasion deepened and widened the valley into a flat-bottomed, steep-sided U-shaped trough, carving pyramidal horns and cirque tarns.',
      examPoints: ['Pyramidal Horn: Peak carved by 3 or more headward-eroding cirques', 'Arête: Knife-edge ridge separating two cirques', 'Hanging Valley: Tributary valley left high above main glacial trough', 'Cirque Tarn: Glacial amphitheater lake (e.g. Lac du Ruwenzori)']
    },
    intrusive_pluton: {
      name: 'Tororo Rock Volcanic Plug & Mubende Batholith',
      location: 'Tororo & Mubende districts (Uganda)',
      type: 'Intrusive Magma Pluton & Resistent Volcanic Neck',
      scale: 'Tororo Rock: 1,483m a.s.l. (rises 250m above plain)',
      formationTheory: 'Molten magma solidified beneath the Earth\'s crust into batholiths, vertical dykes, and horizontal sills. Millions of years of tropical chemical weathering and denudation stripped away the softer country rock, leaving the hard crystalline core standing as an inselberg.',
      examPoints: ['Volcanic plug / neck: Solidified lava core of an eroded extinct volcano', 'Dyke: Vertical sheet-like intrusion cutting across strata', 'Sill: Horizontal concordant intrusion parallel to bedding planes', 'Batholith: Vast underground magma reservoir forming granitic shields']
    },
    coastal_stack: {
      name: 'Old Harry Rocks & Mombasa Coral Cliffs',
      location: 'Jurassic Coast (Dorset, UK) & Indian Ocean (Kenya/Tanzania)',
      type: 'Marine Headland Wave-Erosion Sequence',
      scale: 'Stack height: 25 - 40m | Platform width: 100m',
      formationTheory: 'Wave action (hydraulic action and abrasion) attacks weaknesses in a coastal headland, sequentially enlarging cracks into sea caves. Opposing caves erode through to form a natural arch. Gravity collapses the arch roof, leaving an isolated sea stack and stump on a wave-cut platform.',
      examPoints: ['Erosion sequence: Crack -> Cave -> Arch -> Stack -> Stump', 'Wave-cut notch formed at high water mark', 'Wave-cut platform exposed at low tide', 'Headlands and bays form on discordant coastlines']
    },
    meander_oxbow: {
      name: 'Mississippi & Lower Nile Meander with Oxbow Lake',
      location: 'Lower Mississippi River (USA) & Lower Nile Basin',
      type: 'Fluvial Floodplain Meander Evolution',
      scale: 'Meander wavelength: 3 - 8 km | Floodplain width: 50 km',
      formationTheory: 'Helicoidal flow in low-gradient river channels causes lateral erosion on the outer bend (forming a steep river cliff) and deposition on the inner bend (forming a slip-off slope point bar). During high discharge floods, the narrow meander neck is breached, abandoning the old loop as an oxbow lake.',
      examPoints: ['Centrifugal force accelerates water on outside curve -> cut bank erosion', 'Slower velocity on inside curve -> sand and gravel point bar deposition', 'Neck narrowing until river breaks through during flood stage', 'Abandoned cutoff fills with silt and organic matter to form oxbow wetland']
    },
    earth_sun: {
      name: 'Earth 23.5° Axial Tilt & Planetary Seasons',
      location: 'Astronomical Solar System Orbit',
      type: 'Earth-Sun Orbital Geometry & Insolation',
      scale: 'Earth-Sun distance: 149.6 million km | Tilt: 23.44°',
      formationTheory: 'Earth revolves around the Sun in an elliptical 365.25-day orbit with its rotational axis permanently tilted 23.5° relative to the plane of the ecliptic. This causes the Sun\'s overhead position to migrate between the Tropics, driving the seasons.',
      examPoints: ['Equinoxes (March 21 & Sept 23): Sun overhead at Equator (0°), 12h day/night everywhere', 'Northern Solstice (June 21): Sun overhead at Tropic of Cancer (23.5°N)', 'Southern Solstice (Dec 22): Sun overhead at Tropic of Capricorn (23.5°S)', 'High latitudes experience oblique sun angle (lower insolation per m²)']
    }
  };

  return GeoDatasets;
});
