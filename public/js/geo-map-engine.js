/**
 * Interactive Geography & Earth Sciences Laboratory
 * Core 2D Leaflet Geospatial Engine
 * 
 * Features: Multi-layer switching, coordinate tracking (DD / DMS / 4-fig & 6-fig UTM grid),
 * Haversine distance measurement, polygon area calculation, cross-section transect,
 * whole-circle & back bearing calculator, spatial buffer analysis, and GIS layer querying.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['leaflet', 'GeoDatasets'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('leaflet'), require('./geo-datasets'));
  } else {
    root.GeoMapEngine = factory(root.L, root.GeoDatasets);
  }
})(typeof self !== 'undefined' ? self : this, function (L, GeoDatasets) {
  'use strict';

  function GeoMapEngine(containerId, options = {}) {
    this.containerId = containerId;
    this.options = Object.assign({
      center: [1.3733, 32.2903], // Geographic center of Uganda
      zoom: 7,
      minZoom: 2,
      maxZoom: 18,
      onCoordinateChange: null,
      onFeatureSelect: null,
      onMeasurementUpdate: null,
      onBearingUpdate: null,
      onCrossSectionUpdate: null,
      onBufferAnalysis: null
    }, options);

    this.map = null;
    this.baseLayers = {};
    this.overlayLayers = {};
    this.activeTool = null; // 'measure_distance', 'measure_area', 'measure_bearing', 'cross_section', 'drop_pin', 'buffer_tool'
    this.measurePoints = [];
    this.measureLine = null;
    this.measureAreaPolygon = null;
    this.measureMarkers = [];
    this.gridLinesGroup = null;
    this.bufferCircle = null;
    this.gradingTarget = null;
    this.userPinMarker = null;

    this.init();
  }

  GeoMapEngine.prototype.init = function () {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.warn(`[GeoMapEngine] Container #${this.containerId} not found.`);
      return;
    }

    if (this.map) {
      this.map.remove();
    }

    // Initialize Leaflet map
    this.map = L.map(this.containerId, {
      center: this.options.center,
      zoom: this.options.zoom,
      minZoom: this.options.minZoom,
      maxZoom: this.options.maxZoom,
      zoomControl: false
    });

    // Custom Zoom Control top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Dynamic Scale Bar bottom-left
    L.control.scale({ imperial: false, metric: true, position: 'bottomleft' }).addTo(this.map);

    this.initBaseLayers();
    this.initVectorOverlays();
    this.initGridOverlay();
    this.bindMapEvents();
  };

  GeoMapEngine.prototype.initBaseLayers = function () {
    // 0. CartoDB Voyager with Authenticated API Key
    this.baseLayers.voyager = L.tileLayer(
      'https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4tlk_1_c350409336a0563b146c80d8',
      {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
      }
    );

    // 1. CartoDB Positron (High-contrast clean educational basemap)
    this.baseLayers.clean = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    });

    // 2. OpenStreetMap Standard
    this.baseLayers.osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    // 3. OpenTopoMap (Detailed Relief & Topographic Contours)
    this.baseLayers.topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap',
      maxZoom: 17
    });

    // 4. Satellite Imagery (Esri World Imagery)
    this.baseLayers.satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18
    });

    // Set default base layer to CartoDB Voyager
    this.baseLayers.voyager.addTo(this.map);
  };

  GeoMapEngine.prototype.setBaseLayer = function (layerKey) {
    if (!this.baseLayers[layerKey]) return;

    Object.values(this.baseLayers).forEach((layer) => {
      if (this.map.hasLayer(layer)) {
        this.map.removeLayer(layer);
      }
    });

    this.baseLayers[layerKey].addTo(this.map);
  };

  GeoMapEngine.prototype.initVectorOverlays = function () {
    this.overlayLayers.relief = L.layerGroup().addTo(this.map);
    this.overlayLayers.lakes = L.layerGroup().addTo(this.map);
    this.overlayLayers.rivers = L.layerGroup().addTo(this.map);
    this.overlayLayers.parks = L.layerGroup().addTo(this.map);
    this.overlayLayers.rift = L.layerGroup().addTo(this.map);
    this.overlayLayers.tectonics = L.layerGroup();
    this.overlayLayers.districts = L.layerGroup().addTo(this.map);

    this.populateReliefFeatures();
    this.populateLakes();
    this.populateRivers();
    this.populateNationalParks();
    this.populateRiftSystem();
    this.populateDistricts();
    this.populateTectonicPlates();
  };

  GeoMapEngine.prototype.initGridOverlay = function () {
    this.gridLinesGroup = L.layerGroup();
    // Generate UTM Topographic grid lines across Uganda bounding box [lat -1.5 to 4.5, lng 29.5 to 35.0]
    for (let lat = -1.0; lat <= 4.0; lat += 0.5) {
      const line = L.polyline([[lat, 29.5], [lat, 35.0]], {
        color: '#94A3B8',
        weight: 1,
        dashArray: '4, 4',
        opacity: 0.6
      });
      this.gridLinesGroup.addLayer(line);
    }
    for (let lng = 30.0; lng <= 35.0; lng += 0.5) {
      const line = L.polyline([[-1.5, lng], [4.5, lng]], {
        color: '#94A3B8',
        weight: 1,
        dashArray: '4, 4',
        opacity: 0.6
      });
      this.gridLinesGroup.addLayer(line);
    }
  };

  GeoMapEngine.prototype.toggleGridOverlay = function (show) {
    if (!this.gridLinesGroup) return;
    if (show) {
      if (!this.map.hasLayer(this.gridLinesGroup)) {
        this.gridLinesGroup.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(this.gridLinesGroup)) {
        this.map.removeLayer(this.gridLinesGroup);
      }
    }
  };

  GeoMapEngine.prototype.populateReliefFeatures = function () {
    if (!GeoDatasets || !GeoDatasets.UGANDA_PHYSICAL_FEATURES) return;

    const mountainIcon = L.divIcon({
      className: 'geo-marker-mountain',
      html: '<div style="background:#DC2626; color:#FFF; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:13px;"><i class="fa-solid fa-mountain"></i></div>',
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    GeoDatasets.UGANDA_PHYSICAL_FEATURES.forEach((feature) => {
      const marker = L.marker([feature.lat, feature.lng], { icon: mountainIcon });
      const popupContent = `
        <div class="geo-popup-card">
          <div style="font-weight:700; color:#0F172A; font-size:14px; margin-bottom:2px;">${feature.name}</div>
          <div style="font-size:12px; color:#DC2626; font-weight:600; margin-bottom:6px;">
            <i class="fa-solid fa-arrow-up-right-dots"></i> Elevation: ${feature.elevationM.toLocaleString()} m | ${feature.type}
          </div>
          <div style="font-size:12px; color:#475569; line-height:1.4;">${feature.description}</div>
          <div style="margin-top:6px; font-size:11px; color:#64748B;">
            <strong>Coords:</strong> ${feature.lat.toFixed(4)}°N, ${feature.lng.toFixed(4)}°E
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (typeof this.options.onFeatureSelect === 'function') {
          this.options.onFeatureSelect(feature);
        }
      });
      this.overlayLayers.relief.addLayer(marker);
    });
  };

  GeoMapEngine.prototype.populateLakes = function () {
    if (!GeoDatasets || !GeoDatasets.UGANDA_LAKES) return;

    const lakeIcon = L.divIcon({
      className: 'geo-marker-lake',
      html: '<div style="background:#0284C7; color:#FFF; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:12px;"><i class="fa-solid fa-water"></i></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    GeoDatasets.UGANDA_LAKES.forEach((lake) => {
      const marker = L.marker([lake.lat, lake.lng], { icon: lakeIcon });
      const popupContent = `
        <div class="geo-popup-card">
          <div style="font-weight:700; color:#0369A1; font-size:14px; margin-bottom:2px;">${lake.name}</div>
          <div style="font-size:12px; color:#0284C7; font-weight:600; margin-bottom:6px;">
            <i class="fa-solid fa-expand"></i> Surface Area: ${lake.surfaceAreaKm2.toLocaleString()} km² | Max Depth: ${lake.maxDepthM} m
          </div>
          <div style="font-size:12px; color:#475569; line-height:1.4;">${lake.description}</div>
          <div style="margin-top:6px; font-size:11px; color:#64748B;">
            <strong>Formation Origin:</strong> ${lake.type}
          </div>
        </div>
      `;
      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (typeof this.options.onFeatureSelect === 'function') {
          this.options.onFeatureSelect(lake);
        }
      });
      this.overlayLayers.lakes.addLayer(marker);
    });
  };

  GeoMapEngine.prototype.populateRivers = function () {
    if (!GeoDatasets || !GeoDatasets.UGANDA_RIVERS) return;

    GeoDatasets.UGANDA_RIVERS.forEach((river) => {
      if (river.courseCoordinates && river.courseCoordinates.length > 1) {
        const polyline = L.polyline(river.courseCoordinates, {
          color: '#0284C7',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 6'
        });

        const popupContent = `
          <div class="geo-popup-card">
            <div style="font-weight:700; color:#0369A1; font-size:14px;">${river.name}</div>
            <div style="font-size:12px; color:#0284C7; font-weight:600; margin-bottom:4px;">Length: ~${river.lengthKm} km</div>
            <div style="font-size:12px; color:#475569;"><strong>Source:</strong> ${river.source}</div>
            <div style="font-size:12px; color:#475569;"><strong>Mouth:</strong> ${river.mouth}</div>
            <div style="font-size:11px; color:#64748B; margin-top:4px;"><strong>Notable Knickpoints:</strong> ${river.features.join(', ')}</div>
          </div>
        `;
        polyline.bindPopup(popupContent);
        this.overlayLayers.rivers.addLayer(polyline);
      }
    });
  };

  GeoMapEngine.prototype.populateNationalParks = function () {
    if (!GeoDatasets || !GeoDatasets.UGANDA_NATIONAL_PARKS) return;

    const parkIcon = L.divIcon({
      className: 'geo-marker-park',
      html: '<div style="background:#16A34A; color:#FFF; border-radius:50%; width:26px; height:26px; display:flex; align-items:center; justify-content:center; box-shadow:0 2px 6px rgba(0,0,0,0.3); font-size:12px;"><i class="fa-solid fa-tree"></i></div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    GeoDatasets.UGANDA_NATIONAL_PARKS.forEach((park) => {
      const radiusMeters = Math.sqrt((park.areaKm2 * 1000000) / Math.PI);
      const circle = L.circle([park.lat, park.lng], {
        radius: radiusMeters,
        color: '#15803D',
        fillColor: '#86EFAC',
        fillOpacity: 0.25,
        weight: 2
      });

      const marker = L.marker([park.lat, park.lng], { icon: parkIcon });
      const popupContent = `
        <div class="geo-popup-card">
          <div style="font-weight:700; color:#15803D; font-size:14px;">${park.name}</div>
          <div style="font-size:12px; color:#16A34A; font-weight:600; margin-bottom:4px;">
            Gazetted: ${park.gazettedYear} | Area: ${park.areaKm2.toLocaleString()} km²
          </div>
          <div style="font-size:12px; color:#475569; margin-bottom:4px;"><strong>Ecosystem:</strong> ${park.ecosystem}</div>
          <div style="font-size:11px; color:#15803D;"><strong>Key Fauna:</strong> ${park.wildlife.join(', ')}</div>
        </div>
      `;

      marker.bindPopup(popupContent);
      circle.bindPopup(popupContent);

      this.overlayLayers.parks.addLayer(circle);
      this.overlayLayers.parks.addLayer(marker);
    });
  };

  GeoMapEngine.prototype.populateRiftSystem = function () {
    if (!GeoDatasets || !GeoDatasets.EAST_AFRICAN_RIFT) return;

    const rift = GeoDatasets.EAST_AFRICAN_RIFT;
    rift.branches.forEach((branch, idx) => {
      const color = idx === 0 ? '#9333EA' : '#C026D3';
      if (branch.faultLinePoints && branch.faultLinePoints.length > 1) {
        const polyline = L.polyline(branch.faultLinePoints, {
          color: color,
          weight: 4,
          dashArray: '8, 8',
          opacity: 0.9
        });

        const popupContent = `
          <div class="geo-popup-card">
            <div style="font-weight:700; color:#7E22CE; font-size:14px;">${branch.name}</div>
            <div style="font-size:12px; color:#9333EA; font-weight:600; margin-bottom:4px;">Length: ~${branch.lengthKm} km</div>
            <div style="font-size:12px; color:#475569; margin-bottom:4px;">${branch.trenchType}</div>
            <div style="font-size:11px; color:#64748B;">${rift.tectonicSummary}</div>
          </div>
        `;
        polyline.bindPopup(popupContent);
        this.overlayLayers.rift.addLayer(polyline);
      }

      branch.majorFeatures.forEach((feat) => {
        const riftMarker = L.circleMarker([feat.lat, feat.lng], {
          radius: 6,
          color: color,
          fillColor: '#E9D5FF',
          fillOpacity: 0.9,
          weight: 2
        });
        riftMarker.bindPopup(`<strong>${feat.name}</strong><br><span style="font-size:12px; color:#7E22CE;">${feat.type}</span>`);
        this.overlayLayers.rift.addLayer(riftMarker);
      });
    });
  };

  GeoMapEngine.prototype.populateDistricts = function (filterFn = null) {
    if (!GeoDatasets || !GeoDatasets.UGANDA_KEY_DISTRICTS) return;

    this.overlayLayers.districts.clearLayers();

    GeoDatasets.UGANDA_KEY_DISTRICTS.forEach((district) => {
      if (filterFn && !filterFn(district)) return;

      const circle = L.circleMarker([district.lat, district.lng], {
        radius: Math.max(5, Math.min(18, Math.sqrt(district.popDensityPerKm2) / 3)),
        color: '#2563EB',
        fillColor: '#93C5FD',
        fillOpacity: 0.7,
        weight: 1.5
      });

      const popupContent = `
        <div class="geo-popup-card">
          <div style="font-weight:700; color:#1D4ED8; font-size:14px;">${district.name} District</div>
          <div style="font-size:12px; color:#2563EB; font-weight:600;">Region: ${district.region} Uganda</div>
          <div style="font-size:12px; color:#475569; margin-top:4px;">
            <strong>Population Density:</strong> ${district.popDensityPerKm2.toLocaleString()} persons/km²<br>
            <strong>Surface Area:</strong> ${district.areaKm2.toLocaleString()} km²
          </div>
        </div>
      `;
      circle.bindPopup(popupContent);
      this.overlayLayers.districts.addLayer(circle);
    });
  };

  GeoMapEngine.prototype.populateTectonicPlates = function () {
    if (!GeoDatasets || !GeoDatasets.GLOBAL_TECTONICS) return;

    GeoDatasets.GLOBAL_TECTONICS.forEach((plate) => {
      const plateMarker = L.circleMarker([plate.centerLat, plate.centerLng], {
        radius: 12,
        color: '#D97706',
        fillColor: '#FDE68A',
        fillOpacity: 0.8,
        weight: 2
      });

      const popup = `
        <div class="geo-popup-card">
          <div style="font-weight:700; color:#B45309; font-size:14px;">${plate.name}</div>
          <div style="font-size:12px; color:#475569; margin-top:4px;">
            <strong>Area:</strong> ${plate.areaMillionKm2} million km²<br>
            <strong>Drift Velocity:</strong> ${plate.motionMmYear} mm/year<br>
            <strong>Relative Motion:</strong> ${plate.motionDirection}
          </div>
        </div>
      `;
      plateMarker.bindPopup(popup);
      this.overlayLayers.tectonics.addLayer(plateMarker);
    });
  };

  GeoMapEngine.prototype.bindMapEvents = function () {
    this.map.on('mousemove', (e) => {
      const lat = e.latlng.lat;
      const lng = e.latlng.lng;
      const dms = this.toDMS(lat, lng);
      const grid = this.calculateGridReference(lat, lng);

      if (typeof this.options.onCoordinateChange === 'function') {
        this.options.onCoordinateChange({
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
          dms,
          grid4: grid.grid4,
          grid6: grid.grid6,
          easting: grid.easting,
          northing: grid.northing
        });
      }
    });

    this.map.on('click', (e) => {
      this.handleMapClick(e);
    });
  };

  GeoMapEngine.prototype.toDMS = function (lat, lng) {
    function formatCoord(deg, isLat) {
      const dir = isLat ? (deg >= 0 ? 'N' : 'S') : (deg >= 0 ? 'E' : 'W');
      const absDeg = Math.abs(deg);
      const d = Math.floor(absDeg);
      const minFloat = (absDeg - d) * 60;
      const m = Math.floor(minFloat);
      const s = Math.round((minFloat - m) * 60);
      return `${d}° ${m}' ${s}" ${dir}`;
    }
    return {
      latStr: formatCoord(lat, true),
      lngStr: formatCoord(lng, false)
    };
  };

  GeoMapEngine.prototype.calculateGridReference = function (lat, lng) {
    const falseEasting = 500000;
    const easting = Math.round(falseEasting + (lng - 33.0) * 111320 * Math.cos(lat * (Math.PI / 180)));
    const northing = Math.round(lat * 110540);

    const eastingStr = String(Math.abs(easting)).padStart(6, '0');
    const northingStr = String(Math.abs(northing)).padStart(6, '0');

    const grid4 = `${eastingStr.slice(0, 2)}${northingStr.slice(0, 2)}`;
    const grid6 = `${eastingStr.slice(0, 3)}${northingStr.slice(0, 3)}`;

    return {
      easting,
      northing,
      grid4,
      grid6
    };
  };

  // Compute forward and back bearing between two points
  GeoMapEngine.prototype.calculateBearing = function (lat1, lon1, lat2, lon2) {
    const phi1 = lat1 * (Math.PI / 180);
    const phi2 = lat2 * (Math.PI / 180);
    const deltaLambda = (lon2 - lon1) * (Math.PI / 180);

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);

    let forwardBearing = (theta * (180 / Math.PI) + 360) % 360;
    let backBearing = (forwardBearing + 180) % 360;

    // Quadrantal / Reduced Bearing (e.g. N 45° E, S 30° W)
    let quad = '';
    if (forwardBearing >= 0 && forwardBearing <= 90) {
      quad = `N ${forwardBearing.toFixed(1)}° E`;
    } else if (forwardBearing > 90 && forwardBearing <= 180) {
      quad = `S ${(180 - forwardBearing).toFixed(1)}° E`;
    } else if (forwardBearing > 180 && forwardBearing <= 270) {
      quad = `S ${(forwardBearing - 180).toFixed(1)}° W`;
    } else {
      quad = `N ${(360 - forwardBearing).toFixed(1)}° W`;
    }

    // East African Magnetic Declination adjustment (approx 1° 15' West)
    const magVariation = -1.25; // degrees West
    const magneticBearing = (forwardBearing - magVariation + 360) % 360;

    return {
      forwardBearingDeg: parseFloat(forwardBearing.toFixed(1)),
      backBearingDeg: parseFloat(backBearing.toFixed(1)),
      quadrantalBearing: quad,
      magneticBearingDeg: parseFloat(magneticBearing.toFixed(1)),
      magneticVariation: '1° 15\' W'
    };
  };

  GeoMapEngine.prototype.setTool = function (toolName) {
    this.activeTool = toolName;
    this.clearMeasurements();
  };

  GeoMapEngine.prototype.clearMeasurements = function () {
    this.measurePoints = [];
    if (this.measureLine) {
      this.map.removeLayer(this.measureLine);
      this.measureLine = null;
    }
    if (this.measureAreaPolygon) {
      this.map.removeLayer(this.measureAreaPolygon);
      this.measureAreaPolygon = null;
    }
    if (this.bufferCircle) {
      this.map.removeLayer(this.bufferCircle);
      this.bufferCircle = null;
    }
    this.measureMarkers.forEach((m) => this.map.removeLayer(m));
    this.measureMarkers = [];

    if (this.userPinMarker && this.activeTool !== 'cbt_pin') {
      this.map.removeLayer(this.userPinMarker);
      this.userPinMarker = null;
    }
  };

  GeoMapEngine.prototype.handleMapClick = function (e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (this.activeTool === 'measure_distance') {
      this.addMeasureDistancePoint(lat, lng);
    } else if (this.activeTool === 'measure_area') {
      this.addMeasureAreaPoint(lat, lng);
    } else if (this.activeTool === 'measure_bearing') {
      this.addBearingPoint(lat, lng);
    } else if (this.activeTool === 'cross_section') {
      this.addCrossSectionPoint(lat, lng);
    } else if (this.activeTool === 'buffer_tool') {
      this.runBufferAnalysis(lat, lng, 50); // Default 50 km buffer
    } else if (this.activeTool === 'drop_pin' || this.activeTool === 'cbt_pin') {
      this.dropCustomPin(lat, lng);
    }
  };

  GeoMapEngine.prototype.addMeasureDistancePoint = function (lat, lng) {
    this.measurePoints.push([lat, lng]);

    const marker = L.circleMarker([lat, lng], {
      radius: 5,
      color: '#DC2626',
      fillColor: '#F87171',
      fillOpacity: 1
    }).addTo(this.map);
    this.measureMarkers.push(marker);

    if (this.measurePoints.length > 1) {
      if (this.measureLine) {
        this.measureLine.setLatLngs(this.measurePoints);
      } else {
        this.measureLine = L.polyline(this.measurePoints, {
          color: '#DC2626',
          weight: 3,
          dashArray: '5, 5'
        }).addTo(this.map);
      }

      let totalDistanceKm = 0;
      for (let i = 0; i < this.measurePoints.length - 1; i++) {
        const p1 = this.measurePoints[i];
        const p2 = this.measurePoints[i + 1];
        totalDistanceKm += this.haversine(p1[0], p1[1], p2[0], p2[1]);
      }

      if (typeof this.options.onMeasurementUpdate === 'function') {
        this.options.onMeasurementUpdate({
          type: 'distance',
          pointsCount: this.measurePoints.length,
          totalKm: parseFloat(totalDistanceKm.toFixed(2)),
          totalMeters: Math.round(totalDistanceKm * 1000)
        });
      }
    }
  };

  GeoMapEngine.prototype.addMeasureAreaPoint = function (lat, lng) {
    this.measurePoints.push([lat, lng]);

    const marker = L.circleMarker([lat, lng], {
      radius: 5,
      color: '#16A34A',
      fillColor: '#86EFAC',
      fillOpacity: 1
    }).addTo(this.map);
    this.measureMarkers.push(marker);

    if (this.measurePoints.length > 2) {
      if (this.measureAreaPolygon) {
        this.measureAreaPolygon.setLatLngs(this.measurePoints);
      } else {
        this.measureAreaPolygon = L.polygon(this.measurePoints, {
          color: '#16A34A',
          fillColor: '#86EFAC',
          fillOpacity: 0.35,
          weight: 2
        }).addTo(this.map);
      }

      const areaKm2 = this.calculatePolygonAreaKm2(this.measurePoints);
      const hectares = areaKm2 * 100;

      if (typeof this.options.onMeasurementUpdate === 'function') {
        this.options.onMeasurementUpdate({
          type: 'area',
          pointsCount: this.measurePoints.length,
          areaKm2: parseFloat(areaKm2.toFixed(3)),
          hectares: parseFloat(hectares.toFixed(1))
        });
      }
    }
  };

  // Bearing Tool (Two points: From A to B)
  GeoMapEngine.prototype.addBearingPoint = function (lat, lng) {
    this.measurePoints.push([lat, lng]);

    const pointLabel = this.measurePoints.length === 1 ? 'A (Start)' : 'B (Target)';
    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      color: '#2563EB',
      fillColor: '#60A5FA',
      fillOpacity: 1
    }).addTo(this.map);
    marker.bindTooltip(pointLabel, { permanent: true, direction: 'top' });
    this.measureMarkers.push(marker);

    if (this.measurePoints.length === 2) {
      const p1 = this.measurePoints[0];
      const p2 = this.measurePoints[1];

      this.measureLine = L.polyline([p1, p2], {
        color: '#2563EB',
        weight: 3,
        dashArray: '4, 4'
      }).addTo(this.map);

      const bearing = this.calculateBearing(p1[0], p1[1], p2[0], p2[1]);
      const distKm = this.haversine(p1[0], p1[1], p2[0], p2[1]);

      if (typeof this.options.onBearingUpdate === 'function') {
        this.options.onBearingUpdate({
          from: p1,
          to: p2,
          distanceKm: parseFloat(distKm.toFixed(2)),
          ...bearing
        });
      }

      // Reset measure points for next measurement after completing pair
      this.measurePoints = [];
    }
  };

  // Cross-Section Transect Tool
  GeoMapEngine.prototype.addCrossSectionPoint = function (lat, lng) {
    this.measurePoints.push([lat, lng]);

    const label = this.measurePoints.length === 1 ? 'Transect Start (A)' : 'Transect End (B)';
    const marker = L.circleMarker([lat, lng], {
      radius: 6,
      color: '#7C3AED',
      fillColor: '#C4B5FD',
      fillOpacity: 1
    }).addTo(this.map);
    marker.bindTooltip(label, { permanent: true, direction: 'top' });
    this.measureMarkers.push(marker);

    if (this.measurePoints.length === 2) {
      const pA = this.measurePoints[0];
      const pB = this.measurePoints[1];

      this.measureLine = L.polyline([pA, pB], {
        color: '#7C3AED',
        weight: 4
      }).addTo(this.map);

      // Generate elevation profile slice along transect
      const profile = this.generateElevationProfile(pA[0], pA[1], pB[0], pB[1]);

      if (typeof this.options.onCrossSectionUpdate === 'function') {
        this.options.onCrossSectionUpdate(profile);
      }

      this.measurePoints = [];
    }
  };

  // Synthetic Elevation Profile Interpolator along transect line
  GeoMapEngine.prototype.generateElevationProfile = function (lat1, lon1, lat2, lon2) {
    const samples = 15;
    const profilePoints = [];
    const distTotalKm = this.haversine(lat1, lon1, lat2, lon2);

    for (let i = 0; i < samples; i++) {
      const t = i / (samples - 1);
      const curLat = lat1 + t * (lat2 - lat1);
      const curLng = lon1 + t * (lon2 - lon1);
      const distFromStartKm = t * distTotalKm;

      // Sample base terrain elevation from nearby features or default East African plateau (~1,100 m)
      let elev = 1100 + Math.sin(t * Math.PI) * 450;
      if (GeoDatasets && GeoDatasets.UGANDA_PHYSICAL_FEATURES) {
        GeoDatasets.UGANDA_PHYSICAL_FEATURES.forEach((feat) => {
          const d = this.haversine(curLat, curLng, feat.lat, feat.lng);
          if (d < 50) {
            elev += (feat.elevationM - 1100) * Math.exp(-d / 15);
          }
        });
      }

      profilePoints.push({
        lat: curLat,
        lng: curLng,
        distanceKm: parseFloat(distFromStartKm.toFixed(2)),
        elevationM: Math.round(elev)
      });
    }

    const startElev = profilePoints[0].elevationM;
    const endElev = profilePoints[profilePoints.length - 1].elevationM;
    const deltaH = endElev - startElev;
    const gradientRatio = distTotalKm > 0 ? (deltaH / (distTotalKm * 1000)) : 0;
    const slopePercent = parseFloat((gradientRatio * 100).toFixed(2));

    return {
      distanceTotalKm: parseFloat(distTotalKm.toFixed(2)),
      startElevationM: startElev,
      endElevationM: endElev,
      verticalIntervalM: deltaH,
      slopePercent: slopePercent,
      gradientText: `1 in ${Math.abs(Math.round(1 / (gradientRatio || 0.001)))}`,
      profilePoints
    };
  };

  // Spatial Buffer Tool
  GeoMapEngine.prototype.runBufferAnalysis = function (lat, lng, radiusKm = 50) {
    if (this.bufferCircle) {
      this.map.removeLayer(this.bufferCircle);
    }

    this.bufferCircle = L.circle([lat, lng], {
      radius: radiusKm * 1000,
      color: '#D97706',
      fillColor: '#FDE68A',
      fillOpacity: 0.3,
      weight: 2
    }).addTo(this.map);

    // Find intersecting features
    const intersecting = [];
    if (GeoDatasets) {
      if (GeoDatasets.UGANDA_PHYSICAL_FEATURES) {
        GeoDatasets.UGANDA_PHYSICAL_FEATURES.forEach((feat) => {
          const d = this.haversine(lat, lng, feat.lat, feat.lng);
          if (d <= radiusKm) {
            intersecting.push({ category: 'Relief', name: feat.name, distanceKm: parseFloat(d.toFixed(1)) });
          }
        });
      }
      if (GeoDatasets.UGANDA_NATIONAL_PARKS) {
        GeoDatasets.UGANDA_NATIONAL_PARKS.forEach((park) => {
          const d = this.haversine(lat, lng, park.lat, park.lng);
          if (d <= radiusKm) {
            intersecting.push({ category: 'National Park', name: park.name, distanceKm: parseFloat(d.toFixed(1)) });
          }
        });
      }
      if (GeoDatasets.UGANDA_KEY_DISTRICTS) {
        GeoDatasets.UGANDA_KEY_DISTRICTS.forEach((dist) => {
          const d = this.haversine(lat, lng, dist.lat, dist.lng);
          if (d <= radiusKm) {
            intersecting.push({ category: 'District Center', name: dist.name, distanceKm: parseFloat(d.toFixed(1)) });
          }
        });
      }
    }

    if (typeof this.options.onBufferAnalysis === 'function') {
      this.options.onBufferAnalysis({
        centerLat: lat,
        centerLng: lng,
        radiusKm,
        intersectingCount: intersecting.length,
        features: intersecting
      });
    }
  };

  GeoMapEngine.prototype.dropCustomPin = function (lat, lng) {
    if (this.userPinMarker) {
      this.map.removeLayer(this.userPinMarker);
    }

    const pinIcon = L.divIcon({
      className: 'geo-user-pin',
      html: '<div style="background:#2563EB; color:#FFF; border-radius:50%; width:30px; height:30px; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 8px rgba(0,0,0,0.4); font-size:14px; border:2px solid #FFF;"><i class="fa-solid fa-location-dot"></i></div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    });

    this.userPinMarker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(this.map);
    const dms = this.toDMS(lat, lng);
    const grid = this.calculateGridReference(lat, lng);

    this.userPinMarker.bindPopup(`
      <div style="font-size:13px; font-weight:700; color:#1D4ED8;">Selected Location Pin</div>
      <div style="font-size:12px; color:#475569; margin-top:2px;">
        <strong>Lat/Lng:</strong> ${lat.toFixed(5)}°, ${lng.toFixed(5)}°<br>
        <strong>DMS:</strong> ${dms.latStr}, ${dms.lngStr}<br>
        <strong>6-Fig Grid:</strong> ${grid.grid6}
      </div>
    `).openPopup();

    if (this.activeTool === 'cbt_pin' && this.gradingTarget) {
      const dist = this.haversine(this.gradingTarget.lat, this.gradingTarget.lng, lat, lng);
      const isCorrect = dist <= (this.gradingTarget.toleranceKm || 25);
      if (typeof this.options.onFeatureSelect === 'function') {
        this.options.onFeatureSelect({
          type: 'cbt_answer',
          studentLat: lat,
          studentLng: lng,
          distanceKm: parseFloat(dist.toFixed(2)),
          isCorrect,
          target: this.gradingTarget
        });
      }
    }
  };

  GeoMapEngine.prototype.setGradingTarget = function (target) {
    this.gradingTarget = target;
    this.setTool('cbt_pin');
  };

  GeoMapEngine.prototype.haversine = function (lat1, lon1, lat2, lon2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  GeoMapEngine.prototype.calculatePolygonAreaKm2 = function (latLngs) {
    if (latLngs.length < 3) return 0;
    let total = 0;
    const R = 6371; // km
    for (let i = 0; i < latLngs.length; i++) {
      const p1 = latLngs[i];
      const p2 = latLngs[(i + 1) % latLngs.length];
      const lat1Rad = p1[0] * (Math.PI / 180);
      const lat2Rad = p2[0] * (Math.PI / 180);
      const dLonRad = (p2[1] - p1[1]) * (Math.PI / 180);
      total += dLonRad * (2 + Math.sin(lat1Rad) + Math.sin(lat2Rad));
    }
    return Math.abs((total * (R * R)) / 2);
  };

  GeoMapEngine.prototype.toggleOverlay = function (overlayKey, isVisible) {
    if (!this.overlayLayers[overlayKey]) return;
    if (isVisible) {
      if (!this.map.hasLayer(this.overlayLayers[overlayKey])) {
        this.overlayLayers[overlayKey].addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(this.overlayLayers[overlayKey])) {
        this.map.removeLayer(this.overlayLayers[overlayKey]);
      }
    }
  };

  GeoMapEngine.prototype.flyTo = function (lat, lng, zoom = 10) {
    this.map.flyTo([lat, lng], zoom, { duration: 1.5 });
  };

  GeoMapEngine.prototype.resetView = function () {
    this.map.flyTo(this.options.center, this.options.zoom, { duration: 1.2 });
  };

  return GeoMapEngine;
});
