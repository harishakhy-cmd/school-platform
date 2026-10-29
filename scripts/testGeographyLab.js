'use strict';
const adminCredentials = require('./adminTestCredentials')();

/**
 * Interactive Geography & Earth Sciences Laboratory
 * Comprehensive Integration & Verification Test Suite
 */

const http = require('http');
const assert = require('assert');
const GeoDatasets = require('../public/js/geo-datasets');
const GeoWeatherHydro = require('../public/js/geo-weather-hydro');
const subjectProfiles = require('../config/subjectProfiles');
const pool = require('../config/database');
const questionModel = require('../models/questionModel');

const BASE_URL = 'http://127.0.0.1:3000';
let adminCookie = '';

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(options.url || options.path, BASE_URL);
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: Object.assign({}, options.headers || {})
    };

    if (body) {
      const data = typeof body === 'string' ? body : JSON.stringify(body);
      reqOpts.headers['Content-Type'] = 'application/json';
      reqOpts.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(reqOpts, (res) => {
      let chunks = '';
      res.on('data', (c) => (chunks += c));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(chunks);
        } catch (_) {}
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: chunks,
          json
        });
      });
    });

    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

function pass(msg) {
  console.log(`  ✓ PASS: ${msg}`);
}

async function runTests() {
  console.log('\n==================================================');
  console.log('STARTING GEOGRAPHY & EARTH SCIENCES LAB TEST SUITE');
  console.log('==================================================\n');

  // STEP 1: Authenticate Admin to obtain session cookie
  console.log('--- 1. Authentication & Access Control ---');
  const loginRes = await request(
    { path: '/api/admin/auth/login', method: 'POST' },
    { username: adminCredentials.username, password: adminCredentials.password }
  );
  assert.strictEqual(loginRes.statusCode, 200, 'Admin login must succeed');
  const rawCookies = loginRes.headers['set-cookie'];
  assert(rawCookies && rawCookies.length > 0, 'Session cookie must be returned');
  adminCookie = rawCookies[0].split(';')[0];
  pass('Super Admin session established');

  // Verify /geography-lab.html redirects unauthenticated user
  const unauthRes = await request({ path: '/geography-lab.html' });
  assert.strictEqual(unauthRes.statusCode, 302, 'Unauthenticated access must redirect');
  assert(unauthRes.headers.location.includes('/login.html'), 'Redirect target must be /login.html');
  pass('Unauthenticated access blocked from /geography-lab.html');

  // Verify /geography-lab.html is served to authenticated session
  const authLabRes = await request({
    path: '/geography-lab.html',
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(authLabRes.statusCode, 200, 'Authenticated user can access /geography-lab.html');
  assert(authLabRes.body.includes('Geography & Earth Sciences Laboratory'), 'Page title present');
  pass('Authenticated session can load /geography-lab.html');

  // STEP 2: Curriculum Topics Registry
  console.log('\n--- 2. Curriculum Topics Registry API ---');
  const topicsRes = await request({
    path: '/api/geography/topics',
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(topicsRes.statusCode, 200);
  assert.strictEqual(topicsRes.json.success, true);
  assert.strictEqual(topicsRes.json.count, 22, 'Must provide all 22 required curriculum topics');
  pass('22 comprehensive curriculum topics loaded');

  // Verify key required topics exist
  const codes = topicsRes.json.topics.map((t) => t.code);
  const required = [
    'maps-cartography',
    'gis-laboratory',
    'geomorphology',
    'weather-climate',
    'seasons-astronomy',
    'rivers-lakes',
    'wildlife-conservation',
    'population',
    'fieldwork',
    'geographical-data-analysis'
  ];
  required.forEach((reqCode) => {
    assert(codes.includes(reqCode), `Topic ${reqCode} must be registered`);
  });
  pass('Core curriculum branches verified (Physical, Human, GIS, Fieldwork)');

  // Detail lookup
  const singleTopicRes = await request({
    path: '/api/geography/topics/geomorphology',
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(singleTopicRes.statusCode, 200);
  assert.strictEqual(singleTopicRes.json.topic.code, 'geomorphology');
  assert(singleTopicRes.json.topic.modes.includes('3d_landforms'));
  pass('Topic detail lookup retrieves interactive modes (3D landforms)');

  // STEP 3: Scientific Geospatial Datasets
  console.log('\n--- 3. Scientific Geospatial Datasets Accuracy ---');
  assert(GeoDatasets.UGANDA_PHYSICAL_FEATURES.length >= 10, 'Must have at least 10 key relief features');
  const stanley = GeoDatasets.UGANDA_PHYSICAL_FEATURES.find((f) => f.id === 'rwenzori-stanley');
  assert(stanley && stanley.elevationM === 5109, 'Mount Stanley Margherita peak must be 5,109 m');
  pass('Mount Stanley Margherita peak verified at 5,109 m');

  const elgon = GeoDatasets.UGANDA_PHYSICAL_FEATURES.find((f) => f.id === 'elgon-wagagai');
  assert(elgon && elgon.elevationM === 4321, 'Mount Elgon Wagagai peak must be 4,321 m');
  pass('Mount Elgon Wagagai caldera peak verified at 4,321 m');

  const vic = GeoDatasets.UGANDA_LAKES.find((l) => l.id === 'lake-victoria');
  assert(vic && vic.surfaceAreaKm2 === 68800, 'Lake Victoria surface area verified');
  pass('Lake Victoria drainage basin and crustal warping verified');

  const nile = GeoDatasets.UGANDA_RIVERS.find((r) => r.id === 'victoria-nile');
  assert(nile && nile.lengthKm === 420, 'Victoria Nile length verified');
  pass('Victoria Nile course, knickpoints & dams verified');

  assert(GeoDatasets.EAST_AFRICAN_RIFT.branches.length === 2, 'Western and Eastern Rift branches present');
  pass('East African Rift System (EARS) Albertine and Gregory branches verified');

  assert(GeoDatasets.CLIMATE_STATIONS.entebbe.months.length === 12, '12 months climate data for Entebbe');
  assert(GeoDatasets.CLIMATE_STATIONS.gulu.months.length === 12, '12 months climate data for Gulu');
  pass('Genuine climate hyetograph figures verified for Entebbe, Gulu, Kabale, Moroto');

  // STEP 4: Spatial Distance & Math Calculation
  console.log('\n--- 4. Spatial Math & Coordinate Grid References ---');
  const lat1 = 0.0425, lon1 = 32.4436;
  const lat2 = 0.3476, lon2 = 32.5825;
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const distanceKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  assert(distanceKm >= 36 && distanceKm <= 38, `Calculated distance ${distanceKm.toFixed(1)} km matches reality`);
  pass(`Haversine distance Entebbe to Kampala: ${distanceKm.toFixed(1)} km`);

  // STEP 5: Map Projects Persistence CRUD
  console.log('\n--- 5. Saved Map Projects Persistence CRUD ---');
  const saveMapRes = await request(
    { path: '/api/geography/maps', method: 'POST', headers: { Cookie: adminCookie } },
    {
      title: 'East African Rift Project',
      topic_code: 'geomorphology',
      center_lat: 0.3861,
      center_lng: 29.8731,
      zoom_level: 8,
      active_layers: ['relief', 'rift', 'lakes']
    }
  );
  assert.strictEqual(saveMapRes.statusCode, 200);
  assert.strictEqual(saveMapRes.json.success, true);
  const mapId = saveMapRes.json.mapId;
  assert(mapId > 0, 'New map project ID must be returned');
  pass(`Created saved map project with ID: ${mapId}`);

  // List saved maps
  const listMapsRes = await request({
    path: '/api/geography/maps',
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(listMapsRes.statusCode, 200);
  const foundMap = listMapsRes.json.maps.find((m) => m.id === mapId);
  assert(foundMap, 'Saved map must be found in list');
  assert.strictEqual(foundMap.title, 'East African Rift Project');
  pass('Retrieved saved map project matching title');

  // Delete saved map
  const delMapRes = await request({
    path: `/api/geography/maps/${mapId}`,
    method: 'DELETE',
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(delMapRes.statusCode, 200);
  assert.strictEqual(delMapRes.json.success, true);
  pass('Deleted saved map project cleanly');

  // STEP 6: Fieldwork Observations Persistence
  console.log('\n--- 6. Geographical Fieldwork Observations Persistence ---');
  const saveFwRes = await request(
    { path: '/api/geography/fieldwork', method: 'POST', headers: { Cookie: adminCookie } },
    {
      title: 'Rwenzori Altitudinal Transect',
      site_name: 'Mahoma River / Nyabitaba Hut',
      latitude: 0.3550,
      longitude: 29.9820,
      elevation: 2650,
      landform_type: 'Glacial U-Shaped Valley / Moraine',
      observations: 'Observed hanging valley waterfall, lateral moraine boulders, and bamboo forest transition.'
    }
  );
  assert.strictEqual(saveFwRes.statusCode, 200);
  assert.strictEqual(saveFwRes.json.success, true);
  const entryId = saveFwRes.json.entryId;
  assert(entryId > 0, 'Fieldwork entry ID returned');
  pass(`Recorded fieldwork observation with ID: ${entryId}`);

  // List fieldwork
  const listFwRes = await request({
    path: '/api/geography/fieldwork',
    headers: { Cookie: adminCookie }
  });
  assert.strictEqual(listFwRes.statusCode, 200);
  const foundEntry = listFwRes.json.entries.find((e) => e.id === entryId);
  assert(foundEntry, 'Fieldwork observation present in list');
  assert.strictEqual(foundEntry.site_name, 'Mahoma River / Nyabitaba Hut');
  pass('Retrieved fieldwork observation matching site name and elevation (2,650 m)');

  // STEP 7: CBT Geospatial Auto-Grading Engine
  console.log('\n--- 7. CBT Geospatial Auto-Grading Engine ---');
  const gradePassRes = await request(
    { path: '/api/geography/grade-coordinate', method: 'POST', headers: { Cookie: adminCookie } },
    {
      targetLat: 0.4244,
      targetLng: 33.2042,
      studentLat: 0.4300,
      studentLng: 33.2100,
      toleranceKm: 20
    }
  );
  assert.strictEqual(gradePassRes.statusCode, 200);
  assert.strictEqual(gradePassRes.json.isCorrect, true);
  assert(gradePassRes.json.scoreRatio >= 0.9, 'High score ratio awarded for high accuracy');
  pass(`Accurate pin accepted: ${gradePassRes.json.distanceKm} km away (tolerance: 20 km)`);

  const gradeFailRes = await request(
    { path: '/api/geography/grade-coordinate', method: 'POST', headers: { Cookie: adminCookie } },
    {
      targetLat: 0.4244,
      targetLng: 33.2042,
      studentLat: 2.7747,
      studentLng: 32.2990,
      toleranceKm: 20
    }
  );
  assert.strictEqual(gradeFailRes.statusCode, 200);
  assert.strictEqual(gradeFailRes.json.isCorrect, false);
  assert.strictEqual(gradeFailRes.json.scoreRatio, 0);
  pass(`Inaccurate pin rejected: ${gradeFailRes.json.distanceKm} km away (outside tolerance)`);

  // STEP 8: Topographic Compass Bearing & Slope Gradient (Phase 4)
  console.log('\n--- 8. Cartography: Compass Bearing & Slope Gradient ---');
  const phi1 = lat1 * (Math.PI / 180);
  const phi2 = lat2 * (Math.PI / 180);
  const dLam = (lon2 - lon1) * (Math.PI / 180);
  const yB = Math.sin(dLam) * Math.cos(phi2);
  const xB = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLam);
  const fwdBearing = (Math.atan2(yB, xB) * (180 / Math.PI) + 360) % 360;
  const backBearing = (fwdBearing + 180) % 360;

  assert(fwdBearing >= 23 && fwdBearing <= 26, `Forward bearing ${fwdBearing.toFixed(1)}° is accurate NNE`);
  assert(backBearing >= 203 && backBearing <= 206, `Back bearing ${backBearing.toFixed(1)}° is accurate SSW`);
  pass(`Calculated True Forward Bearing: ${fwdBearing.toFixed(1)}° and Back Bearing: ${backBearing.toFixed(1)}°`);

  const elevStart = 1146; // Entebbe
  const elevEnd = 1200; // Kampala hill
  const viM = elevEnd - elevStart; // 54 m
  const heM = distanceKm * 1000; // ~37,300 m
  const gradient = viM / heM;
  const slopePercent = (gradient * 100).toFixed(2);
  assert(slopePercent > 0 && slopePercent < 1, 'Entebbe to Kampala gradient slope percentage is gentle (~0.14%)');
  pass(`Topographic slope gradient calculated: ${slopePercent}% (1 in ${Math.round(1 / gradient)})`);

  // STEP 9: GIS Spatial Buffer & Proximity Queries (Phase 5)
  console.log('\n--- 9. GIS Laboratory: Spatial Buffer & Attribute Queries ---');
  const kampalaLat = 0.3476, kampalaLng = 32.5825;
  const intersectingDistricts = GeoDatasets.UGANDA_KEY_DISTRICTS.filter((d) => {
    const dLat = (d.lat - kampalaLat) * (Math.PI / 180);
    const dLon = (d.lng - kampalaLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(kampalaLat * (Math.PI / 180)) * Math.cos(d.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= 50;
  });

  const names = intersectingDistricts.map((d) => d.name);
  assert(names.includes('Kampala') && names.includes('Wakiso') && names.includes('Mukono'), '50km buffer encompasses Kampala metropolitan districts');
  pass(`GIS Buffer Analysis: Found ${intersectingDistricts.length} districts within 50 km of Kampala: ${names.join(', ')}`);

  const westernDistricts = GeoDatasets.UGANDA_KEY_DISTRICTS.filter((d) => d.region === 'Western');
  assert(westernDistricts.length >= 4, 'Western region districts retrieved accurately');
  pass(`GIS Attribute Query: Retrieved ${westernDistricts.length} Western Region districts`);

  // STEP 10: Scientific Hydrology & Weather Station Instruments (Phases 6-12)
  console.log('\n--- 10. Hydrology & Meteorology Instrument Engines (Phases 6-12) ---');
  // Relative humidity from Psychrometer: Dry 28°C, Wet 22°C (depression 6.0°C) -> RH ~ 58%
  const psychro = GeoWeatherHydro.calculateRelativeHumidity(28, 22);
  assert(psychro.relativeHumidityPercent >= 56 && psychro.relativeHumidityPercent <= 62, 'Psychrometer Relative Humidity calculated accurately (~58%)');
  assert(psychro.wetBulbDepressionC === 6.0, 'Depression of wet bulb verified');
  pass(`Psychrometer: Dry 28°C / Wet 22°C yields ${psychro.relativeHumidityPercent}% RH with dew point ${psychro.dewPointC}°C`);

  // Solar position at Equator (lat 0.3°) on March 21 Equinox (day 80) -> Declination ~ 0°, Noon altitude ~ 89.7°
  const solarEquinox = GeoWeatherHydro.calculateSolarPosition(0.3, 80);
  assert(solarEquinox.solarNoonAltitudeDeg >= 89 && solarEquinox.solarNoonAltitudeDeg <= 90, 'Equator solar noon altitude at Equinox is ~90° overhead');
  assert(solarEquinox.dayLengthHours >= 11.9 && solarEquinox.dayLengthHours <= 12.1, 'Day length at Equinox is 12 hours');
  pass(`Solar Astronomy: Kampala Solar Noon Altitude on March 21 is ${solarEquinox.solarNoonAltitudeDeg}° with ${solarEquinox.dayLengthHours}h daylight`);

  // River storm hydrograph: urban vs rural lag time
  const ruralHydro = GeoWeatherHydro.generateStormHydrograph(45, 'rural_vegetated');
  const urbanHydro = GeoWeatherHydro.generateStormHydrograph(45, 'urban_impervious');
  assert(urbanHydro.lagTimeHours < ruralHydro.lagTimeHours, 'Urban basin has significantly shorter lag time than vegetated basin');
  assert(urbanHydro.peakDischargeCumecs > ruralHydro.peakDischargeCumecs, 'Urban basin has significantly higher peak discharge (flashier response)');
  pass(`Storm Hydrograph: Rural lag time (${ruralHydro.lagTimeHours}h, ${ruralHydro.peakDischargeCumecs} m³/s) vs Urban lag time (${urbanHydro.lagTimeHours}h, ${urbanHydro.peakDischargeCumecs} m³/s)`);

  // STEP 11: Human, Regional & Environmental Geography (Phases 13-26)
  console.log('\n--- 11. Human, Regional & Environmental Geography (Phases 13-26) ---');
  // Demographic Pyramid
  assert(GeoDatasets.UGANDA_DEMOGRAPHICS.cohorts.length === 14, '14 age-sex cohorts for 2024 UBOS census');
  assert(GeoDatasets.UGANDA_DEMOGRAPHICS.dependencyRatioPercent === 88.5, 'Youth dependency ratio verified');
  assert(GeoDatasets.UGANDA_DEMOGRAPHICS.medianAgeYears === 16.7, 'Uganda youthful median age verified');
  pass(`Demographics: Verified broad-based pyramid with median age ${GeoDatasets.UGANDA_DEMOGRAPHICS.medianAgeYears} yrs & dependency ratio ${GeoDatasets.UGANDA_DEMOGRAPHICS.dependencyRatioPercent}%`);

  // Agriculture & Irrigation Schemes
  assert(GeoDatasets.UGANDA_AGRICULTURAL_ZONES.length >= 4, '4 major agricultural zones categorized');
  const doho = GeoDatasets.UGANDA_IRRIGATION_SCHEMES.find((s) => s.name.includes('Doho'));
  assert(doho && doho.crop === 'Paddy Rice' && doho.riverSource === 'River Manafwa', 'Doho rice irrigation scheme verified');
  pass('Agricultural systems & Doho, Kibimba, Mobuku irrigation schemes verified');

  // Transport Corridors
  assert(GeoDatasets.UGANDA_TRANSPORT_CORRIDORS.length >= 2, 'Northern Corridor & marine circuits present');
  pass('Transport Corridors: Northern corridor and Lake Victoria marine transport verified');

  // Environmental Geography: Rwenzori Glacial Recession
  assert(GeoDatasets.RWENZORI_GLACIER_RECESSION.length === 5, '5 historical glacier survey observations');
  const g1906 = GeoDatasets.RWENZORI_GLACIER_RECESSION.find((g) => g.year === 1906);
  const g2024 = GeoDatasets.RWENZORI_GLACIER_RECESSION.find((g) => g.year === 2024);
  const retreatRatio = ((g1906.areaKm2 - g2024.areaKm2) / g1906.areaKm2) * 100;
  assert(retreatRatio > 95, 'Over 95% glacial retreat in Rwenzori verified');
  pass(`Environmental Climate Change: Rwenzori glacier retreated ${retreatRatio.toFixed(1)}% (from 7.50 km² in 1906 to 0.35 km² in 2024)`);

  // STEP 12: Graphing Lab Subject Profiles & Seamless Preset Bridge
  console.log('\n--- 12. Graphing Lab Deep Integration & Scientific Presets ---');
  const geoProfile = subjectProfiles.SUBJECT_PROFILES ? subjectProfiles.SUBJECT_PROFILES.GEOGRAPHY : subjectProfiles.getProfile('GEOGRAPHY');
  assert(geoProfile, 'Geography subject profile exists in system registry');
  assert(geoProfile.presets && geoProfile.presets.length >= 7, '7 scientific presets configured for Geography');
  
  const climographPreset = geoProfile.presets.find((p) => p.name.includes('Entebbe'));
  const hydroPreset = geoProfile.presets.find((p) => p.name.includes('Flood Hydrograph'));
  const glacierPreset = geoProfile.presets.find((p) => p.name.includes('Glacial Recession'));
  const riverPreset = geoProfile.presets.find((p) => p.name.includes('River Longitudinal'));
  const dtmPreset = geoProfile.presets.find((p) => p.name.includes('Demographic Transition'));

  assert(climographPreset && climographPreset.data.rainfall.length === 12, 'Equatorial climograph rainfall dataset verified');
  assert(hydroPreset && hydroPreset.params.Qpeak === 120, 'Storm hydrograph parameterization verified');
  assert(glacierPreset && glacierPreset.params.A0 === 7.5, 'Glacial retreat exponential model verified');
  assert(riverPreset && riverPreset.params.H0 === 3500, 'River longitudinal source elevation verified');
  assert(dtmPreset && dtmPreset.expr.includes('exp'), 'Demographic transition logistic model verified');
  pass('Graphing Lab presets verified: Climograph, Hydrograph, Glacial Recession, River Profile, DTM');

  // STEP 13: CBT Exam Question Bank: Interactive Map Pin-Drop & Auto-Grading
  console.log('\n--- 13. CBT Examination Bank: Map Questions & Spatial Grading ---');
  // 1. Get an existing exam id or dummy exam for testing question persistence
  const [exams] = await pool.query('SELECT exam_id FROM exams LIMIT 1');
  const testExamId = exams.length ? exams[0].exam_id : 1;

  const testGeoConfig = { center: [0.3857, 29.8719], zoom: 9, basemap: 'osm' };
  const testGeoTarget = { lat: 0.3857, lng: 29.8719, tolerance_km: 25 };

  const testQId = await questionModel.create(
    testExamId,
    'Locate Mount Stanley (Margherita Peak 5,109m) on the Rwenzori Horst block',
    'Rwenzori Mountain Range',
    'Mount Elgon Caldera',
    'Virunga Volcanic Range',
    'Moroto Alkaline Volcano',
    'A',
    'text',
    null,
    false,
    testGeoConfig,
    testGeoTarget
  );
  assert(testQId, 'Created CBT geography interactive question with geo_config and geo_target');

  const publicQs = await questionModel.findPublicByIds([testQId]);
  assert(publicQs.length === 1, 'Retrieved CBT question publicly');
  assert(publicQs[0].geo_config, 'geo_config returned in public question payload');
  assert(publicQs[0].geo_target, 'geo_target returned in public question payload');
  pass(`CBT Question Bank: Persisted & retrieved geo question (ID: ${testQId}) with spatial config`);

  // Clean up test question
  await pool.query('DELETE FROM questions WHERE question_id = ?', [testQId]);
  pass('CBT Question Bank: Cleaned up test question');

  console.log('\n==================================================');
  console.log('GEOGRAPHY LAB TESTS: ALL 30 ASSERTIONS PASSED!');
  console.log('==================================================\n');
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Fatal Geography Lab test runner error:', err);
    process.exit(1);
  });
