/**
 * Chemistry Laboratory — 3D Molecular & Atomic Visualization Engine
 * Built on Three.js r128 (loaded via CDN).
 * Provides: atomic shell models, ball-and-stick molecules, VSEPR geometries.
 */

/* global THREE, ChemData */
var Chem3DEngine = (function () {
  'use strict';

  var scene, camera, renderer, animFrameId;
  var currentGroup = null;
  var isAnimating = true;

  var CPK_RADII = {
    H:0.25, C:0.40, N:0.38, O:0.36, F:0.32, Cl:0.45, Br:0.50,
    I:0.55, S:0.46, P:0.44, Na:0.55, Mg:0.50, Al:0.45, Si:0.44,
    Ca:0.62, Fe:0.50, Cu:0.48, Zn:0.47, default:0.40
  };

  function getAtomRadius(sym) {
    return CPK_RADII[sym] || CPK_RADII.default;
  }

  function getAtomColor(sym) {
    var colors = (typeof ChemData !== 'undefined' && ChemData.CPK_COLORS) ? ChemData.CPK_COLORS : {};
    return colors[sym] || colors.default || '#FF1493';
  }

  function init(containerId) {
    var container = document.getElementById(containerId);
    if (!container || typeof THREE === 'undefined') return false;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a1a);
    scene.add(new THREE.AmbientLight(0x404040, 1.2));

    var dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(5, 8, 5);
    scene.add(dirLight);

    var fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
    fillLight.position.set(-5, -3, -5);
    scene.add(fillLight);

    var w = container.clientWidth  || 600;
    var h = container.clientHeight || 400;
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 200);
    camera.position.set(0, 0, 8);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Mouse orbit controls
    var isDragging = false, lastMX = 0, lastMY = 0;
    renderer.domElement.addEventListener('mousedown', function(e) { isDragging = true; lastMX = e.clientX; lastMY = e.clientY; });
    window.addEventListener('mouseup', function() { isDragging = false; });
    renderer.domElement.addEventListener('mousemove', function(e) {
      if (!isDragging || !currentGroup) return;
      var dx = (e.clientX - lastMX) * 0.01;
      var dy = (e.clientY - lastMY) * 0.01;
      currentGroup.rotation.y += dx;
      currentGroup.rotation.x += dy;
      lastMX = e.clientX; lastMY = e.clientY;
    });
    renderer.domElement.addEventListener('wheel', function(e) {
      camera.position.z = Math.max(2, Math.min(25, camera.position.z + e.deltaY * 0.01));
    });

    // Touch controls
    var lastTouchX = 0, lastTouchY = 0;
    renderer.domElement.addEventListener('touchstart', function(e) { lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY; });
    renderer.domElement.addEventListener('touchmove', function(e) {
      if (!currentGroup) return;
      var dx = (e.touches[0].clientX - lastTouchX) * 0.01;
      var dy = (e.touches[0].clientY - lastTouchY) * 0.01;
      currentGroup.rotation.y += dx;
      currentGroup.rotation.x += dy;
      lastTouchX = e.touches[0].clientX; lastTouchY = e.touches[0].clientY;
      e.preventDefault();
    }, { passive: false });

    // Resize observer
    var ro = new ResizeObserver(function() {
      var nw = container.clientWidth, nh = container.clientHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    });
    ro.observe(container);

    animate();
    return true;
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate);
    if (isAnimating && currentGroup) {
      currentGroup.rotation.y += 0.005;
    }
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function clearScene() {
    if (currentGroup && scene) {
      scene.remove(currentGroup);
      currentGroup.traverse(function(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(function(m){ m.dispose(); });
          else obj.material.dispose();
        }
      });
      currentGroup = null;
    }
  }

  function makeSphere(radius, color, x, y, z) {
    var geom = new THREE.SphereGeometry(radius, 24, 24);
    var mat  = new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: 80 });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y, z);
    return mesh;
  }

  function makeCylinder(from, to, radius, color) {
    var dir = new THREE.Vector3().subVectors(to, from);
    var length = dir.length();
    var geom = new THREE.CylinderGeometry(radius, radius, length, 12);
    var mat  = new THREE.MeshPhongMaterial({ color: new THREE.Color(color), shininess: 40 });
    var mesh = new THREE.Mesh(geom, mat);
    var mid  = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    mesh.position.copy(mid);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
    return mesh;
  }

  function addLabel(text, x, y, z, group) {
    var canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 48;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, 128, 48);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, 64, 32);
    var tex  = new THREE.CanvasTexture(canvas);
    var geom = new THREE.PlaneGeometry(0.8, 0.3);
    var mat  = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    var mesh = new THREE.Mesh(geom, mat);
    mesh.position.set(x, y + 0.5, z);
    group.add(mesh);
  }

  // ============================================================
  // ATOMIC SHELL MODEL
  // ============================================================
  function buildAtomicModel(config) {
    if (!scene) return;
    clearScene();
    var group = new THREE.Group();
    var Z = config.protons || 6;
    var N = config.neutrons || 6;
    var charge = config.charge || 0;
    var electrons = Z - charge;

    var nucleusR = 0.15 + (Z + N) * 0.003;
    nucleusR = Math.min(nucleusR, 0.5);

    // Protons (red) and neutrons (grey) in nucleus cluster
    var count = Math.min(Z + N, 40);
    for (var i = 0; i < count; i++) {
      var angle = (i / count) * Math.PI * 4;
      var r = nucleusR * 0.6;
      var nx = r * Math.cos(angle) * (1 + Math.random() * 0.3);
      var ny = r * Math.sin(angle) * (1 + Math.random() * 0.3);
      var nz = (Math.random() - 0.5) * r;
      var color = i < Z ? '#FF4444' : '#888888';
      group.add(makeSphere(0.08, color, nx, ny, nz));
    }
    // Glow sphere
    var glowGeom = new THREE.SphereGeometry(nucleusR, 24, 24);
    var glowMat  = new THREE.MeshPhongMaterial({ color: 0xff6600, transparent: true, opacity: 0.3 });
    group.add(new THREE.Mesh(glowGeom, glowMat));

    // Electron shells
    var SHELL_CAPACITY = [2, 8, 18, 32, 32, 18, 8];
    var shellRadii = [1.0, 1.7, 2.5, 3.2, 3.9, 4.6, 5.2];
    var remaining = electrons;
    var maxShellUsed = 0;

    for (var s = 0; s < SHELL_CAPACITY.length && remaining > 0; s++) {
      var cap = SHELL_CAPACITY[s];
      var inShell = Math.min(cap, remaining);
      remaining -= inShell;
      maxShellUsed = s;

      var ringGeom = new THREE.TorusGeometry(shellRadii[s], 0.02, 8, 80);
      var ringMat  = new THREE.MeshBasicMaterial({ color: 0x334466, transparent: true, opacity: 0.5 });
      var ring = new THREE.Mesh(ringGeom, ringMat);
      ring.rotation.x = (s % 3 === 0) ? 0 : (s % 3 === 1) ? Math.PI/3 : Math.PI/1.5;
      group.add(ring);

      for (var e = 0; e < inShell; e++) {
        var eAngle = (e / inShell) * Math.PI * 2;
        var ex = shellRadii[s] * Math.cos(eAngle);
        var ey = shellRadii[s] * Math.sin(eAngle) * Math.cos(ring.rotation.x);
        var ez = shellRadii[s] * Math.sin(eAngle) * Math.sin(ring.rotation.x);
        group.add(makeSphere(0.06, '#00AAFF', ex, ey, ez));
      }
    }

    var elem = (typeof ChemData !== 'undefined') ? ChemData.getElementById(Z) : null;
    var labelText = elem ? (elem.symbol + '  Z=' + Z + '  A=' + (Z+N)) : ('Z=' + Z);
    addLabel(labelText, 0, -(shellRadii[maxShellUsed] + 0.5), 0, group);

    scene.add(group);
    currentGroup = group;
    if (camera) camera.position.z = shellRadii[maxShellUsed] * 2 + 2;
  }

  // ============================================================
  // BALL-AND-STICK MOLECULAR MODELS
  // ============================================================
  var MOLECULE_DEFS = {
    H2O: {
      atoms: [{sym:'O',x:0,y:0,z:0},{sym:'H',x:0.96,y:0.28,z:0},{sym:'H',x:-0.96,y:0.28,z:0}],
      bonds: [[0,1,1],[0,2,1]],
      name: 'Water (H₂O)'
    },
    CO2: {
      atoms: [{sym:'C',x:0,y:0,z:0},{sym:'O',x:1.16,y:0,z:0},{sym:'O',x:-1.16,y:0,z:0}],
      bonds: [[0,1,2],[0,2,2]],
      name: 'Carbon Dioxide (CO₂)'
    },
    NH3: {
      atoms: [{sym:'N',x:0,y:0,z:0},{sym:'H',x:0.94,y:0,z:-0.33},{sym:'H',x:-0.47,y:0.82,z:-0.33},{sym:'H',x:-0.47,y:-0.82,z:-0.33}],
      bonds: [[0,1,1],[0,2,1],[0,3,1]],
      name: 'Ammonia (NH₃)'
    },
    CH4: {
      atoms: [{sym:'C',x:0,y:0,z:0},{sym:'H',x:0.63,y:0.63,z:0.63},{sym:'H',x:-0.63,y:-0.63,z:0.63},{sym:'H',x:-0.63,y:0.63,z:-0.63},{sym:'H',x:0.63,y:-0.63,z:-0.63}],
      bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]],
      name: 'Methane (CH₄)'
    },
    HCl: {
      atoms: [{sym:'H',x:-0.63,y:0,z:0},{sym:'Cl',x:0.63,y:0,z:0}],
      bonds: [[0,1,1]],
      name: 'Hydrogen Chloride (HCl)'
    },
    C2H6: {
      atoms: [{sym:'C',x:-0.76,y:0,z:0},{sym:'C',x:0.76,y:0,z:0},{sym:'H',x:-1.16,y:0.36,z:0.89},{sym:'H',x:-1.16,y:0.36,z:-0.89},{sym:'H',x:-1.16,y:-0.72,z:0},{sym:'H',x:1.16,y:0.36,z:0.89},{sym:'H',x:1.16,y:0.36,z:-0.89},{sym:'H',x:1.16,y:-0.72,z:0}],
      bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1],[1,7,1]],
      name: 'Ethane (C₂H₆)'
    },
    C2H4: {
      atoms: [{sym:'C',x:-0.67,y:0,z:0},{sym:'C',x:0.67,y:0,z:0},{sym:'H',x:-1.24,y:0.93,z:0},{sym:'H',x:-1.24,y:-0.93,z:0},{sym:'H',x:1.24,y:0.93,z:0},{sym:'H',x:1.24,y:-0.93,z:0}],
      bonds: [[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],
      name: 'Ethene (C₂H₄)'
    }
  };

  function buildMolecule(molKey) {
    if (!scene) return;
    clearScene();
    var def = MOLECULE_DEFS[molKey];
    if (!def) { buildMolecule('CH4'); return; }

    var group = new THREE.Group();
    var scale = 1.2;

    def.atoms.forEach(function(atom) {
      var r = getAtomRadius(atom.sym) * scale;
      var c = getAtomColor(atom.sym);
      group.add(makeSphere(r, c, atom.x * scale, atom.y * scale, atom.z * scale));
    });

    def.bonds.forEach(function(bond) {
      var a1 = def.atoms[bond[0]];
      var a2 = def.atoms[bond[1]];
      var order = bond[2] || 1;
      var from = new THREE.Vector3(a1.x * scale, a1.y * scale, a1.z * scale);
      var to   = new THREE.Vector3(a2.x * scale, a2.y * scale, a2.z * scale);

      if (order === 1) {
        group.add(makeCylinder(from, to, 0.07, '#cccccc'));
      } else if (order === 2) {
        var perp = new THREE.Vector3().subVectors(to, from).cross(new THREE.Vector3(0,0,1)).normalize().multiplyScalar(0.1);
        group.add(makeCylinder(from.clone().add(perp), to.clone().add(perp), 0.055, '#cccccc'));
        group.add(makeCylinder(from.clone().sub(perp), to.clone().sub(perp), 0.055, '#cccccc'));
      }
    });

    def.atoms.forEach(function(atom) {
      addLabel(atom.sym, atom.x * scale, atom.y * scale + 0.1, atom.z * scale, group);
    });

    scene.add(group);
    currentGroup = group;
    if (camera) camera.position.z = 6;
  }

  // ============================================================
  // VSEPR GEOMETRY MODELS
  // ============================================================
  function buildVSEPR(geometry) {
    if (!scene) return;
    clearScene();
    var group = new THREE.Group();
    var r = 1.5;

    // Central atom
    group.add(makeSphere(0.35, '#FF4500', 0, 0, 0));

    var positions = [];
    if (geometry === 'linear') {
      positions = [[r,0,0],[-r,0,0]];
    } else if (geometry === 'bent') {
      positions = [[r*Math.cos(Math.PI*104.5/180), r*Math.sin(Math.PI*104.5/180), 0], [r, 0, 0]];
    } else if (geometry === 'trigonal_planar') {
      for (var i=0;i<3;i++) { var a=i*Math.PI*2/3; positions.push([r*Math.cos(a), r*Math.sin(a), 0]); }
    } else if (geometry === 'trigonal_pyramidal') {
      var baseR = r * Math.sin(Math.PI*107/180);
      var h = r * Math.cos(Math.PI*107/180);
      for (var j=0;j<3;j++) { var b=j*Math.PI*2/3; positions.push([baseR*Math.cos(b), -h, baseR*Math.sin(b)]); }
    } else if (geometry === 'tetrahedral') {
      positions = [[0,r,0],[0.94*r,-r/3,0],[-0.47*r,-r/3,0.82*r],[-0.47*r,-r/3,-0.82*r]];
    } else if (geometry === 'trigonal_bipyramidal') {
      for (var k=0;k<3;k++) { var c=k*Math.PI*2/3; positions.push([r*Math.cos(c),0,r*Math.sin(c)]); }
      positions.push([0,r,0]); positions.push([0,-r,0]);
    } else if (geometry === 'octahedral') {
      positions = [[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r],[0,0,-r]];
    }

    positions.forEach(function(p) {
      var from = new THREE.Vector3(0,0,0);
      var to   = new THREE.Vector3(p[0], p[1], p[2]);
      group.add(makeSphere(0.25, '#00AAFF', p[0], p[1], p[2]));
      group.add(makeCylinder(from, to, 0.06, '#888888'));
    });

    scene.add(group);
    currentGroup = group;
    if (camera) camera.position.z = 5;
  }

  return {
    init:             init,
    buildAtomicModel: buildAtomicModel,
    buildMolecule:    buildMolecule,
    buildVSEPR:       buildVSEPR,
    MOLECULE_DEFS:    MOLECULE_DEFS,
    clearScene:       clearScene,
    setAnimating: function(v) { isAnimating = v; },
    resetCamera:  function() { if (camera) camera.position.set(0,0,8); },
    dispose: function() {
      if (animFrameId) cancelAnimationFrame(animFrameId);
      clearScene();
      if (renderer) renderer.dispose();
    }
  };
})();
