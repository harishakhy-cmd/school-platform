/**
 * Interactive Geography & Earth Sciences Laboratory
 * 3D Geomorphological Landform & Astronomical Earth-Sun Simulator
 * 
 * Powered by Three.js with Canvas fallback.
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['three'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('three'));
  } else {
    root.Geo3DEngine = factory(root.THREE);
  }
})(typeof self !== 'undefined' ? self : this, function (THREE) {
  'use strict';

  function Geo3DEngine(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.currentMeshGroup = null;
    this.animationId = null;
    this.isRotating = true;
    this.currentMode = 'rift_valley';
    this.axialTiltDeg = 23.5;
    this.orbitDayOfYear = 80;

    this.init();
  }

  Geo3DEngine.prototype.init = function () {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.warn(`[Geo3DEngine] Container #${this.containerId} not found.`);
      return;
    }

    if (!THREE) {
      console.warn('[Geo3DEngine] THREE.js is not loaded. Fallback canvas will be used.');
      return;
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Dark slate

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.set(25, 20, 30);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);
    this.renderer.shadowMap.enabled = true;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);
    if (THREE.OrbitControls) {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.08;
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(30, 40, 20);
    dirLight.castShadow = true;
    this.scene.add(dirLight);

    this.renderLandform('rift_valley');
    window.addEventListener('resize', () => this.onResize());
    this.animate();
  };

  Geo3DEngine.prototype.onResize = function () {
    if (!this.container || !this.renderer || !this.camera) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  Geo3DEngine.prototype.clearScene = function () {
    if (this.currentMeshGroup) {
      this.scene.remove(this.currentMeshGroup);
      this.currentMeshGroup.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.filter(Boolean).forEach((material) => material.dispose());
      });
      this.currentMeshGroup = null;
    }
  };

  Geo3DEngine.prototype.renderElevationGrid = function (grid, verticalExaggeration = 1) {
    if (!this.scene || !grid || !Array.isArray(grid.elevations_m) || grid.elevations_m.length !== grid.rows * grid.columns) {
      throw new Error('The supplied terrain grid is incomplete.');
    }
    this.clearScene();
    this.currentMode = 'real-elevation-grid';
    const group = new THREE.Group();
    const { rows, columns, bounds } = grid;
    const exaggeration = Math.max(1, Math.min(8, Number(verticalExaggeration) || 1));
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const cosLat = Math.cos(centerLat * Math.PI / 180);
    const elevations = grid.elevations_m.filter((value) => Number.isFinite(value));
    if (elevations.length < 4) throw new Error('The source returned too few valid elevation samples for a terrain surface.');
    const minElevation = Math.min(...elevations); const maxElevation = Math.max(...elevations);
    const positions = []; const colors = []; const valid = [];
    for (let row = 0; row < rows; row++) {
      const lat = bounds.north - (bounds.north - bounds.south) * row / (rows - 1);
      for (let col = 0; col < columns; col++) {
        const lng = bounds.west + (bounds.east - bounds.west) * col / (columns - 1);
        const index = row * columns + col; const elevation = grid.elevations_m[index];
        const x = (lng - centerLng) * 111.32 * cosLat;
        const z = (centerLat - lat) * 111.32;
        const good = Number.isFinite(elevation); valid[index] = good;
        positions.push(x, good ? elevation / 1000 * exaggeration : 0, z);
        const t = good && maxElevation > minElevation ? (elevation - minElevation) / (maxElevation - minElevation) : 0;
        const color = t < 0.5
          ? new THREE.Color(0x39734a).lerp(new THREE.Color(0xb8a36a), t * 2)
          : new THREE.Color(0xb8a36a).lerp(new THREE.Color(0xe8edf1), (t - 0.5) * 2);
        colors.push(color.r, color.g, color.b);
      }
    }
    const indices = [];
    for (let row = 0; row < rows - 1; row++) for (let col = 0; col < columns - 1; col++) {
      const a = row * columns + col; const b = a + 1; const c = a + columns; const d = c + 1;
      if (valid[a] && valid[c] && valid[b]) indices.push(a, c, b);
      if (valid[b] && valid[c] && valid[d]) indices.push(b, c, d);
    }
    if (!indices.length) throw new Error('The elevation samples contain no complete terrain surface.');
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const terrain = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.94 }));
    terrain.name = 'ASTER GDEM sampled elevation surface';
    terrain.userData.source = grid.dataset;
    group.add(terrain);
    const widthKm = (bounds.east - bounds.west) * 111.32 * cosLat;
    const depthKm = (bounds.north - bounds.south) * 111.32;
    const gridHelper = new THREE.GridHelper(Math.max(widthKm, depthKm), 10, 0x64748b, 0xcbd5e1);
    gridHelper.position.y = minElevation / 1000 * exaggeration;
    group.add(gridHelper);
    group.userData.terrainMetadata = { source: grid.provenance, sampleSpacingDegrees: grid.sampleSpacingDegrees, minElevationM: minElevation, maxElevationM: maxElevation, verticalExaggeration: exaggeration };
    this.currentMeshGroup = group;
    this.scene.add(group);
    const center = new THREE.Vector3(0, ((minElevation + maxElevation) / 2000) * exaggeration, 0);
    this.camera.position.set(widthKm * 0.85, Math.max(depthKm, widthKm) * 0.55, depthKm * 1.15);
    this.camera.lookAt(center);
    this.camera.far = Math.max(1000, Math.max(widthKm, depthKm) * 20);
    this.camera.updateProjectionMatrix();
    if (this.controls) { this.controls.target.copy(center); this.controls.update(); }
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('geo:terrain_loaded', { detail: { grid, mesh: terrain, metadata: group.userData.terrainMetadata } }));
    this.isRotating = false;
  };

  Geo3DEngine.prototype.renderLandform = function (type) {
    this.clearScene();
    this.currentMode = type;
    this.currentMeshGroup = new THREE.Group();

    if (type === 'rift_valley') {
      this.buildRiftValleyModel();
    } else if (type === 'horst_mountain') {
      this.buildHorstMountainModel();
    } else if (type === 'elgon_caldera') {
      this.buildElgonCalderaModel();
    } else if (type === 'volcano' || type === 'nyiragongo') {
      this.buildVolcanoModel();
    } else if (type === 'anticline_syncline') {
      this.buildFoldingModel();
    } else if (type === 'glacial_valley') {
      this.buildGlacialValleyModel();
    } else if (type === 'intrusive_pluton') {
      this.buildIntrusivePlutonModel();
    } else if (type === 'coastal_stack') {
      this.buildCoastalStackModel();
    } else if (type === 'meander_oxbow') {
      this.buildMeanderOxbowModel();
    } else if (type === 'normal_fault') {
      this.buildNormalFaultModel();
    } else if (type === 'reverse_fault') {
      this.buildReverseFaultModel();
    } else if (type === 'earth_sun') {
      this.buildEarthSunModel();
    }

    // Emit event so UI can display curriculum case study details
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const info = (window.GeoDatasets && window.GeoDatasets.REAL_WORLD_LANDFORMS) ? window.GeoDatasets.REAL_WORLD_LANDFORMS[type] : null;
      window.dispatchEvent(new CustomEvent('geo:landform_selected', { detail: { type, info } }));
    }

    this.scene.add(this.currentMeshGroup);
  };

  // 1. ALBERTINE RIFT VALLEY GRABEN (Lake Albert & Butiaba Escarpment, East Africa)
  Geo3DEngine.prototype.buildRiftValleyModel = function () {
    // West Escarpment Plateau (Blue Mountains, DRC)
    const plateauMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const westHighGeom = new THREE.BoxGeometry(6, 9, 16);
    const westHigh = new THREE.Mesh(westHighGeom, plateauMat);
    westHigh.position.set(-9, 1, 0);
    this.currentMeshGroup.add(westHigh);

    // Step-faulted terrace blocks (Step Faulting)
    const stepMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const westStep = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 16), stepMat);
    westStep.position.set(-4.5, -0.5, 0);
    this.currentMeshGroup.add(westStep);

    // Central Downthrown Graben Floor with Sedimentary Layers (Lake Albert Graben)
    const grabenMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const graben = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 16), grabenMat);
    graben.position.set(0, -2, 0);
    this.currentMeshGroup.add(graben);

    // Rift Valley Floor Lake (Lake Albert / Lake Tanganyika)
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 });
    const lake = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.5, 15.6), waterMat);
    lake.position.set(0, 0.1, 0);
    this.currentMeshGroup.add(lake);

    // East Escarpment Plateau (Butiaba / Bunyoro Escarpment, Uganda)
    const eastStep = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 16), stepMat);
    eastStep.position.set(4.5, -0.5, 0);
    this.currentMeshGroup.add(eastStep);

    const eastHigh = new THREE.Mesh(westHighGeom, plateauMat);
    eastHigh.position.set(9, 1, 0);
    this.currentMeshGroup.add(eastHigh);

    // Tensional Stress Arrows (Lithospheric Extension <- ->)
    this.addArrowIndicator(new THREE.Vector3(-13, 6, 0), new THREE.Vector3(-1, 0, 0), 0xdc2626);
    this.addArrowIndicator(new THREE.Vector3(13, 6, 0), new THREE.Vector3(1, 0, 0), 0xdc2626);
  };

  // 2. MOUNT RWENZORI MASSIF (Crystalline Horst / Block Mountain, 5,109m Margherita Peak)
  Geo3DEngine.prototype.buildHorstMountainModel = function () {
    // Uplifted Central Block (Metamorphic Granite/Gneiss Massif)
    const horstMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const horstGeom = new THREE.BoxGeometry(9, 13, 14);
    const horst = new THREE.Mesh(horstGeom, horstMat);
    horst.position.set(0, 2.5, 0);
    this.currentMeshGroup.add(horst);

    // Permanent Alpine Glacial Cap (Margherita & Alexandra Peaks)
    const snowMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const peak1 = new THREE.Mesh(new THREE.ConeGeometry(3.2, 4, 5), snowMat);
    peak1.position.set(-1.5, 10, -1);
    this.currentMeshGroup.add(peak1);

    const peak2 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 3.2, 5), snowMat);
    peak2.position.set(2, 9.5, 1.5);
    this.currentMeshGroup.add(peak2);

    // Flanking Down-dropped Rift Valleys (Semliki Graben West & Lake George Graben East)
    const grabenMat = new THREE.MeshLambertMaterial({ color: 0x1e293b });
    const westGraben = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 14), grabenMat);
    westGraben.position.set(-7.5, -1.5, 0);
    this.currentMeshGroup.add(westGraben);

    const eastGraben = new THREE.Mesh(new THREE.BoxGeometry(6, 5, 14), grabenMat);
    eastGraben.position.set(7.5, -1.5, 0);
    this.currentMeshGroup.add(eastGraben);

    // Tectonic Vertical Uplift Vectors (^ ^)
    this.addArrowIndicator(new THREE.Vector3(0, 9, 8), new THREE.Vector3(0, 1, 0), 0x2563eb);
    this.addArrowIndicator(new THREE.Vector3(0, 9, -8), new THREE.Vector3(0, 1, 0), 0x2563eb);
  };

  // 3. MOUNT ELGON VOLCANIC CALDERA (Wagagai Peak 4,321m • Breached Shield Caldera)
  Geo3DEngine.prototype.buildElgonCalderaModel = function () {
    // Giant Volcanic Cone Outer Shell
    const coneGeom = new THREE.CylinderGeometry(8, 14, 8, 36);
    const coneMat = new THREE.MeshLambertMaterial({ color: 0x57534e });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(0, 0, 0);
    this.currentMeshGroup.add(cone);

    // Collapsed Central Caldera Floor
    const floorGeom = new THREE.CylinderGeometry(7, 7, 1.5, 36);
    const floorMat = new THREE.MeshLambertMaterial({ color: 0x292524 });
    const calderaFloor = new THREE.Mesh(floorGeom, floorMat);
    calderaFloor.position.set(0, 2.5, 0);
    this.currentMeshGroup.add(calderaFloor);

    // Concentric Caldera Rim Wall
    const rimGeom = new THREE.TorusGeometry(7.2, 1.2, 16, 48);
    const rimMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
    const rim = new THREE.Mesh(rimGeom, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 4.2, 0);
    this.currentMeshGroup.add(rim);

    // Breached Gorge (Suam River Gorge breach on eastern rim)
    const breachGeom = new THREE.BoxGeometry(3, 4, 6);
    const breachMat = new THREE.MeshLambertMaterial({ color: 0x292524 });
    const breach = new THREE.Mesh(breachGeom, breachMat);
    breach.position.set(7, 3, 0);
    this.currentMeshGroup.add(breach);

    // Resurgence Thermal Cone in center
    const vent = new THREE.Mesh(new THREE.ConeGeometry(1.8, 2.2, 16), new THREE.MeshLambertMaterial({ color: 0xb45309 }));
    vent.position.set(0, 4, 0);
    this.currentMeshGroup.add(vent);
  };

  // 4. MOUNT NYIRAGONGO & KILIMANJARO (Composite Stratovolcano with Lava Lake)
  Geo3DEngine.prototype.buildVolcanoModel = function () {
    // Stratovolcano Cone with Alternating Ash & Lava Slopes
    const coneGeom = new THREE.CylinderGeometry(2.5, 12, 11, 32);
    const coneMat = new THREE.MeshLambertMaterial({ color: 0x44403c });
    const cone = new THREE.Mesh(coneGeom, coneMat);
    cone.position.set(0, 0, 0);
    this.currentMeshGroup.add(cone);

    // Alternating strata rings visible on flank
    const strataColors = [0x78350f, 0x292524, 0xb45309, 0x1c1917];
    strataColors.forEach((col, idx) => {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(3 + idx * 2, 4 + idx * 2, 24),
        new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })
      );
      ring.rotation.x = Math.PI / 2.8;
      ring.position.set(0, -3 + idx * 2, 2);
      this.currentMeshGroup.add(ring);
    });

    // Summit Crater with Active Incandescent Lava Lake (Nyiragongo model)
    const lavaLake = new THREE.Mesh(
      new THREE.CylinderGeometry(2.2, 2.2, 0.4, 24),
      new THREE.MeshBasicMaterial({ color: 0xef4444 })
    );
    lavaLake.position.set(0, 5.5, 0);
    this.currentMeshGroup.add(lavaLake);

    // Flank Parasitic Cinder Cone
    const parasitic = new THREE.Mesh(
      new THREE.ConeGeometry(2, 3, 16),
      new THREE.MeshLambertMaterial({ color: 0x78350f })
    );
    parasitic.position.set(6, -2, 5);
    this.currentMeshGroup.add(parasitic);
  };

  // 5. JURA MOUNTAINS & CAPE FOLD BELT (Fold Mountains • Anticlines & Synclines)
  Geo3DEngine.prototype.buildFoldingModel = function () {
    const foldGroup = new THREE.Group();
    // 4 Distinct Sedimentary Strata: Limestone, Sandstone, Shale, Base Crystalline
    const strataColors = [0x991b1b, 0xd97706, 0x15803d, 0x1d4ed8];

    strataColors.forEach((color, layerIdx) => {
      const geom = new THREE.PlaneGeometry(26, 15, 36, 12);
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        // Sinusoidal fold wave: 2 anticlines and 1 syncline
        const yOffset = Math.sin((x / 26) * Math.PI * 3) * 3.5 + layerIdx * 1.3;
        pos.setY(i, yOffset);
      }
      geom.computeVertexNormals();

      const mat = new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geom, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = layerIdx * 0.4 - 2;
      foldGroup.add(mesh);
    });

    this.currentMeshGroup.add(foldGroup);

    // Horizontal Tectonic Compression Vectors (-> <-)
    this.addArrowIndicator(new THREE.Vector3(-14, 3, 0), new THREE.Vector3(1, 0, 0), 0x2563eb);
    this.addArrowIndicator(new THREE.Vector3(14, 3, 0), new THREE.Vector3(-1, 0, 0), 0x2563eb);
  };

  // 6. MATTERHORN & BUJUKU GLACIAL TROUGH (Alpine Glaciation • Horn, Cirque, U-Valley)
  Geo3DEngine.prototype.buildGlacialValleyModel = function () {
    // Pyramidal Horn Peak (Matterhorn / Margherita)
    const hornMat = new THREE.MeshLambertMaterial({ color: 0x334155 });
    const horn = new THREE.Mesh(new THREE.ConeGeometry(5.5, 12, 4), hornMat);
    horn.position.set(0, 4.5, -5);
    this.currentMeshGroup.add(horn);

    // Snow-clad Arête Ridges radiating from the Horn
    const snowMat = new THREE.MeshLambertMaterial({ color: 0xf8fafc });
    const peakCap = new THREE.Mesh(new THREE.ConeGeometry(2.5, 4.5, 4), snowMat);
    peakCap.position.set(0, 8.5, -5);
    this.currentMeshGroup.add(peakCap);

    // Flat-bottomed U-Shaped Glacial Trough Valley Floor
    const troughMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const trough = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 14), troughMat);
    trough.position.set(0, -2, 2);
    this.currentMeshGroup.add(trough);

    // Glacial Ice Tongue in U-Trough
    const iceMat = new THREE.MeshLambertMaterial({ color: 0xbae6fd, transparent: true, opacity: 0.85 });
    const glacier = new THREE.Mesh(new THREE.BoxGeometry(6.5, 1.4, 10), iceMat);
    glacier.position.set(0, -1, 1);
    this.currentMeshGroup.add(glacier);

    // Cirque Tarn Lake (Rock Basin Amphitheater Lake)
    const tarn = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 2.8, 0.4, 24),
      new THREE.MeshLambertMaterial({ color: 0x0284c7 })
    );
    tarn.position.set(0, -0.8, 7.5);
    this.currentMeshGroup.add(tarn);
  };

  // 7. INTRUSIVE IGNEOUS COMPLEX (Tororo Rock Volcanic Neck, Dykes, Sills & Batholith)
  Geo3DEngine.prototype.buildIntrusivePlutonModel = function () {
    // Country Rock Strata
    const countryMat = new THREE.MeshLambertMaterial({ color: 0x78716c });
    const country = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 14), countryMat);
    country.position.set(0, -4, 0);
    this.currentMeshGroup.add(country);

    // Deep Subterranean Granite Batholith Pluton
    const batholithMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
    const batholith = new THREE.Mesh(new THREE.SphereGeometry(6, 24, 16), batholithMat);
    batholith.position.set(0, -7, 0);
    this.currentMeshGroup.add(batholith);

    // Discordant Vertical Igneous Dyke
    const dykeMat = new THREE.MeshLambertMaterial({ color: 0xb91c1c });
    const dyke = new THREE.Mesh(new THREE.BoxGeometry(1.2, 7, 12), dykeMat);
    dyke.position.set(-4, -2, 0);
    this.currentMeshGroup.add(dyke);

    // Concordant Horizontal Sill
    const sill = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 12), dykeMat);
    sill.position.set(2, -2.5, 0);
    this.currentMeshGroup.add(sill);

    // Tororo Rock Volcanic Neck / Plug (Resistant Monolith standing above denuded plain)
    const plugMat = new THREE.MeshLambertMaterial({ color: 0x292524 });
    const plug = new THREE.Mesh(new THREE.CylinderGeometry(2, 3.5, 8, 20), plugMat);
    plug.position.set(0, 2.5, 0);
    this.currentMeshGroup.add(plug);
  };

  // 8. COASTAL HEADLAND WAVE EROSION (Old Harry Rocks & Mombasa Coast • Cave, Arch, Stack)
  Geo3DEngine.prototype.buildCoastalStackModel = function () {
    // Ocean Water Surface
    const waterMat = new THREE.MeshLambertMaterial({ color: 0x0284c7, transparent: true, opacity: 0.85 });
    const ocean = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), waterMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.set(0, -1, 0);
    this.currentMeshGroup.add(ocean);

    // Chalk / Limestone Headland Cliff
    const cliffMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
    const headland = new THREE.Mesh(new THREE.BoxGeometry(8, 7, 14), cliffMat);
    headland.position.set(-8, 2.5, 0);
    this.currentMeshGroup.add(headland);

    // Natural Coastal Arch
    const archPillar = new THREE.Mesh(new THREE.BoxGeometry(2, 6, 3), cliffMat);
    archPillar.position.set(-1.5, 2, 0);
    this.currentMeshGroup.add(archPillar);

    const archSpan = new THREE.Mesh(new THREE.BoxGeometry(4, 1.8, 3), cliffMat);
    archSpan.position.set(-3, 5, 0);
    this.currentMeshGroup.add(archSpan);

    // Isolated Sea Stack (Detached Pillar)
    const stack = new THREE.Mesh(new THREE.BoxGeometry(2.5, 7, 3), cliffMat);
    stack.position.set(4, 2.5, 0);
    this.currentMeshGroup.add(stack);

    // Wave-worn Sea Stump (Low profile)
    const stump = new THREE.Mesh(new THREE.BoxGeometry(2, 1.5, 2), cliffMat);
    stump.position.set(8.5, -0.2, 0);
    this.currentMeshGroup.add(stump);
  };

  // 9. FLUVIAL MEANDER & OXBOW LAKE (Mississippi & Lower Nile Floodplain)
  Geo3DEngine.prototype.buildMeanderOxbowModel = function () {
    // Alluvial Floodplain Bed
    const plainMat = new THREE.MeshLambertMaterial({ color: 0x4ade80 });
    const plain = new THREE.Mesh(new THREE.BoxGeometry(22, 1.5, 16), plainMat);
    plain.position.set(0, -1, 0);
    this.currentMeshGroup.add(plain);

    // S-Curved Active Meander River Channel
    const riverMat = new THREE.MeshLambertMaterial({ color: 0x0284c7 });
    const riverCurve = new THREE.TorusGeometry(4.5, 1.1, 8, 24, Math.PI * 1.3);
    const riverMesh = new THREE.Mesh(riverCurve, riverMat);
    riverMesh.rotation.x = Math.PI / 2;
    riverMesh.position.set(-3, -0.1, -1);
    this.currentMeshGroup.add(riverMesh);

    // Detached Crescent Oxbow Lake (Cutoff loop filled with water)
    const oxbowCurve = new THREE.TorusGeometry(3.5, 0.9, 8, 24, Math.PI);
    const oxbowMesh = new THREE.Mesh(oxbowCurve, riverMat);
    oxbowMesh.rotation.x = Math.PI / 2;
    oxbowMesh.position.set(4.5, -0.1, 2.5);
    this.currentMeshGroup.add(oxbowMesh);

    // Silt / Alluvium Plug at Meander Neck Cutoff
    const plugMat = new THREE.MeshLambertMaterial({ color: 0x92400e });
    const siltPlug = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 2), plugMat);
    siltPlug.position.set(2, -0.1, 0.5);
    this.currentMeshGroup.add(siltPlug);
  };

  // 10. NORMAL FAULT (Tensional Stress • Hanging Wall Drop)
  Geo3DEngine.prototype.buildNormalFaultModel = function () {
    const footwallMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const footwall = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 14), footwallMat);
    footwall.position.set(-5, 0, 0);
    this.currentMeshGroup.add(footwall);

    const hangingWallMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
    const hangingWall = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 14), hangingWallMat);
    hangingWall.position.set(5, -3, 0);
    this.currentMeshGroup.add(hangingWall);

    this.addArrowIndicator(new THREE.Vector3(-11, 4, 0), new THREE.Vector3(-1, 0, 0), 0xdc2626);
    this.addArrowIndicator(new THREE.Vector3(11, 1, 0), new THREE.Vector3(1, 0, 0), 0xdc2626);
  };

  // 11. REVERSE / THRUST FAULT (Compressional Stress • Hanging Wall Uplift)
  Geo3DEngine.prototype.buildReverseFaultModel = function () {
    const footwallMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
    const footwall = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 14), footwallMat);
    footwall.position.set(-5, -2, 0);
    this.currentMeshGroup.add(footwall);

    const hangingWallMat = new THREE.MeshLambertMaterial({ color: 0x94a3b8 });
    const hangingWall = new THREE.Mesh(new THREE.BoxGeometry(10, 8, 14), hangingWallMat);
    hangingWall.position.set(5, 2, 0);
    this.currentMeshGroup.add(hangingWall);

    this.addArrowIndicator(new THREE.Vector3(-12, 1, 0), new THREE.Vector3(1, 0, 0), 0x2563eb);
    this.addArrowIndicator(new THREE.Vector3(12, 3, 0), new THREE.Vector3(-1, 0, 0), 0x2563eb);
  };

  // 12. 3D EARTH-SUN ORBIT & SEASONS SIMULATOR
  Geo3DEngine.prototype.buildEarthSunModel = function () {
    const earthGeom = new THREE.SphereGeometry(6, 32, 32);
    const earthMat = new THREE.MeshLambertMaterial({
      color: 0x2563eb,
      wireframe: true
    });
    const earth = new THREE.Mesh(earthGeom, earthMat);
    earth.rotation.z = (this.axialTiltDeg * Math.PI) / 180;
    this.currentMeshGroup.add(earth);

    const axisMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 });
    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -10, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), (this.axialTiltDeg * Math.PI) / 180),
      new THREE.Vector3(0, 10, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), (this.axialTiltDeg * Math.PI) / 180)
    ]);
    const axisLine = new THREE.Line(axisGeom, axisMat);
    this.currentMeshGroup.add(axisLine);

    const equatorGeom = new THREE.RingGeometry(6.05, 6.2, 32);
    const equatorMat = new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide });
    const equator = new THREE.Mesh(equatorGeom, equatorMat);
    equator.rotation.x = Math.PI / 2;
    equator.rotation.z = (this.axialTiltDeg * Math.PI) / 180;
    this.currentMeshGroup.add(equator);
  };

    Geo3DEngine.prototype.addArrowIndicator = function (origin, direction, color) {
    const arrow = new THREE.ArrowHelper(direction.normalize(), origin, 4, color, 1.2, 0.8);
    this.currentMeshGroup.add(arrow);
  };

  Geo3DEngine.prototype.animate = function () {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.controls) this.controls.update();

    if (this.currentMeshGroup && this.isRotating) {
      this.currentMeshGroup.rotation.y += 0.005;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  };

  Geo3DEngine.prototype.toggleRotation = function () {
    this.isRotating = !this.isRotating;
    return this.isRotating;
  };

  Geo3DEngine.prototype.resetCamera = function () {
    if (this.camera) {
      this.camera.position.set(25, 20, 30);
      this.camera.lookAt(0, 0, 0);
    }
    if (this.controls) { this.controls.target.set(0, 0, 0); this.controls.update(); }
    if (this.currentMeshGroup) {
      this.currentMeshGroup.rotation.set(0, 0, 0);
    }
  };

  return Geo3DEngine;
});
