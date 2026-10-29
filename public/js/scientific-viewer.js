(function () {
  'use strict';

  const stage = document.getElementById('scientific-stage');
  if (!stage) return;
  const $ = (id) => document.getElementById(id);
  const status = $('sv-status');
  const loading = $('sv-loading');
  if (!window.THREE) {
    status.textContent = 'The 3D rendering library did not load. Check your connection and reload this page.';
    status.classList.add('text-danger');
    loading.textContent = '3D viewer unavailable';
    return;
  }
  const label = $('sv-label');
  const componentList = $('sv-components');
  const selectionInfo = $('sv-selection');
  let renderer; let scene; let camera; let controls; let root;
  let raycaster; let pointer;
  let visibleAtomMeshes = [];
  let moleculeAtoms = null;
  let moleculeBonds = [];
  let selected = null;
  let highlightedObject = null;
  let highlightedMaterials = [];
  let labelsVisible = true;
  let bounds = null;
  let meshMaterials = [];
  let inspectionPlane = null;
  let meshInspectionSupported = false;
  let cameraTransition = 0;
  const previousCameraStates = [];
  let cameraStorageKey = 'scientific-viewer-camera:default';
  let distanceStart = null;
  const labelPosition = new THREE.Vector3();

  const ELEMENT_COLORS = {
    H: 0xffffff, C: 0x4b5563, N: 0x2563eb, O: 0xef4444, S: 0xeab308,
    P: 0xf97316, F: 0x22c55e, CL: 0x22c55e, BR: 0x7c3aed, I: 0x7c3aed,
    FE: 0xb45309, CA: 0x94a3b8, MG: 0x16a34a, ZN: 0x64748b
  };

  function setStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('text-danger', !!isError);
  }

  function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f5fb);
    camera = new THREE.PerspectiveCamera(45, stage.clientWidth / stage.clientHeight, 0.01, 10000);
    camera.position.set(0, 0, 30);
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.localClippingEnabled = true;
    renderer.setSize(stage.clientWidth, stage.clientHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D model. Drag to rotate, use the wheel to zoom, and right-drag to pan.');
    renderer.domElement.tabIndex = 0;
    stage.insertBefore(renderer.domElement, label);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x64748b, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(8, 12, 16);
    scene.add(key);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    raycaster = new THREE.Raycaster();
    pointer = new THREE.Vector2();
    renderer.domElement.addEventListener('pointerup', onPick);
    window.addEventListener('resize', resize);
    renderer.setAnimationLoop(() => {
      controls.update();
      updateAttachedLabel();
      renderer.render(scene, camera);
    });
    document.addEventListener('fullscreenchange', resize);
    window.addEventListener('pagehide', disposeViewer, { once: true });
  }

  function disposeViewer() {
    if (renderer) renderer.setAnimationLoop(null);
    if (controls) controls.dispose();
    clearModel();
    if (renderer) renderer.dispose();
  }

  function resize() {
    if (!renderer) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function disposeNode(node) {
    node.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.filter(Boolean).forEach((material) => {
        for (const value of Object.values(material)) if (value && value.isTexture) value.dispose();
        material.dispose();
      });
    });
  }

  function clearModel() {
    clearObjectHighlight();
    cancelAnimationFrame(cameraTransition);
    previousCameraStates.length = 0;
    $('sv-previous').disabled = true;
    if (root) { scene.remove(root); disposeNode(root); }
    root = new THREE.Group();
    scene.add(root);
    moleculeAtoms = null;
    moleculeBonds = [];
    visibleAtomMeshes = [];
    bounds = null;
    meshMaterials = [];
    inspectionPlane = null;
    meshInspectionSupported = false;
    highlightedObject = null;
    highlightedMaterials = [];
    selected = null;
    distanceStart = null;
    label.style.display = 'none';
    selectionInfo.textContent = 'Select a visible component or atom.';
    componentList.replaceChildren();
    resetInspectionControls();
  }

  function addComponentButton(id, name, selectAction) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'sv-component';
    button.textContent = name;
    button.dataset.componentId = id;
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => selectAction());
    componentList.appendChild(button);
    return button;
  }

  function setComponentButtons(activeId) {
    componentList.querySelectorAll('.sv-component').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.componentId === activeId ? 'true' : 'false');
    });
  }

  function drawMolecule(parsed) {
    if (!parsed.atoms.length) throw new Error('The structure contains no atom coordinates.');
    moleculeAtoms = parsed.atoms;
    moleculeBonds = parsed.bonds;
    visibleAtomMeshes = [];
    const byElement = new Map();
    parsed.atoms.forEach((atom) => {
      if (!byElement.has(atom.element)) byElement.set(atom.element, []);
      byElement.get(atom.element).push(atom);
    });
    const sphere = new THREE.SphereGeometry(0.23, 12, 10);
    const dummy = new THREE.Object3D();
    for (const [element, atoms] of byElement) {
      const mesh = new THREE.InstancedMesh(sphere, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 50 }), atoms.length);
      mesh.userData.atomMap = atoms;
      mesh.userData.element = element;
      mesh.userData.isAtomMesh = true;
      atoms.forEach((atom, instanceId) => {
        dummy.position.set(atom.x, atom.y, atom.z);
        dummy.scale.setScalar(atom.visible ? 1 : 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(instanceId, dummy.matrix);
        mesh.setColorAt(instanceId, new THREE.Color(ELEMENT_COLORS[element] || 0x0891b2));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      root.add(mesh);
      visibleAtomMeshes.push(mesh);
    }
    const positions = [];
    parsed.bonds.forEach(([a, b]) => {
      if (!parsed.atoms[a] || !parsed.atoms[b]) return;
      const p = parsed.atoms[a]; const q = parsed.atoms[b];
      positions.push(p.x, p.y, p.z, q.x, q.y, q.z);
    });
    if (positions.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const bonds = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.85 }));
      bonds.userData.isBondLines = true;
      root.add(bonds);
    }
    parsed.components.slice(0, 350).forEach((component) => {
      addComponentButton(component.id, component.name, () => selectComponent(component.id));
    });
    return { atomCount: parsed.atoms.length, componentCount: parsed.components.length, bondSource: parsed.bondSource };
  }

  function selectComponent(id) {
    if (moleculeAtoms) {
      const atom = moleculeAtoms.find((item) => item.componentId === id);
      if (atom) selectAtom(atom);
      return;
    }
    const object = root.getObjectByName(id);
    if (object) selectObject(object);
  }

  function refreshMolecule() {
    if (!moleculeAtoms) return;
    const oldLabel = selected?.atom?.componentId;
    const oldBondSource = moleculeBonds;
    root.children.slice().forEach((child) => {
      if (child.userData.isAtomMesh || child.userData.isBondLines) { root.remove(child); disposeNode(child); }
    });
    // Rebuild atom instances to apply visibility and selection colors.
    const atoms = moleculeAtoms;
    const byElement = new Map();
    atoms.forEach((atom) => { if (!byElement.has(atom.element)) byElement.set(atom.element, []); byElement.get(atom.element).push(atom); });
    const sphere = new THREE.SphereGeometry(0.23, 12, 10); const dummy = new THREE.Object3D();
    visibleAtomMeshes = [];
    for (const [element, groupAtoms] of byElement) {
      const mesh = new THREE.InstancedMesh(sphere, new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 50 }), groupAtoms.length);
      mesh.userData.atomMap = groupAtoms; mesh.userData.element = element; mesh.userData.isAtomMesh = true;
      groupAtoms.forEach((atom, idx) => {
        dummy.position.set(atom.x, atom.y, atom.z); dummy.scale.setScalar(atom.visible ? 1 : 0); dummy.updateMatrix(); mesh.setMatrixAt(idx, dummy.matrix);
        let color = ELEMENT_COLORS[element] || 0x0891b2;
        if (selected?.atom && atom.componentId === selected.atom.componentId) color = 0xf59e0b;
        mesh.setColorAt(idx, new THREE.Color(color));
      });
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      root.add(mesh); visibleAtomMeshes.push(mesh);
    }
    const positions = [];
    oldBondSource.forEach(([a, b]) => {
      const p = atoms[a]; const q = atoms[b];
      if (p?.visible && q?.visible) positions.push(p.x, p.y, p.z, q.x, q.y, q.z);
    });
    if (positions.length) {
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const lines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0x475569, transparent: true, opacity: 0.85 }));
      lines.userData.isBondLines = true; root.add(lines);
    }
    if (oldLabel && selected?.atom) selected.atom = atoms.find((atom) => atom.componentId === oldLabel) || selected.atom;
  }

  function selectAtom(atom) {
    clearObjectHighlight();
    selected = { atom, componentId: atom.componentId };
    setComponentButtons(atom.componentId);
    selectionInfo.textContent = `${atom.name} (${atom.element}) · ${atom.componentName} · source atom ${atom.serial}`;
    label.textContent = `${atom.name} · ${atom.componentName}`;
    label.style.display = labelsVisible ? 'block' : 'none';
    updateInspectionControls();
    if (distanceStart) {
      const a = new THREE.Vector3(distanceStart.x, distanceStart.y, distanceStart.z);
      const b = new THREE.Vector3(atom.x, atom.y, atom.z);
      setStatus(`Distance: ${a.distanceTo(b).toFixed(3)} Å (straight-line coordinate distance)`, false);
      distanceStart = null;
    } else {
      distanceStart = atom;
      setStatus('Atom selected. Select a second atom to measure distance.', false);
    }
    refreshMolecule();
  }

  function selectObject(object) {
    clearObjectHighlight();
    if (object.geometry && !object.geometry.boundingBox) object.geometry.computeBoundingBox();
    const localCenter = object.geometry?.boundingBox
      ? object.geometry.boundingBox.getCenter(new THREE.Vector3())
      : new THREE.Vector3();
    selected = { object, componentId: object.name || object.uuid };
    setComponentButtons(selected.componentId);
    label.textContent = object.name || 'Selected model component';
    label.style.display = labelsVisible ? 'block' : 'none';
    selectionInfo.textContent = object.name || `Mesh ${object.uuid.slice(0, 8)}`;
    selected.localCenter = localCenter;
    highlightObject(object);
    updateInspectionControls();
    if ($('sv-selected-transparency').checked) applyMeshDisplayMode();
  }

  function clearObjectHighlight() {
    if (!highlightedObject) return;
    highlightedObject.traverse((node) => {
      const original = highlightedMaterials.find((entry) => entry.node === node);
      if (original) node.material = original.material;
    });
    highlightedMaterials.forEach((entry) => {
      const materials = Array.isArray(entry.highlighted) ? entry.highlighted : [entry.highlighted];
      materials.filter(Boolean).forEach((material) => material.dispose());
    });
    highlightedObject = null;
    highlightedMaterials = [];
  }

  function highlightObject(object) {
    highlightedObject = object;
    object.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const original = node.material;
      const sourceMaterials = Array.isArray(original) ? original : [original];
      const highlighted = sourceMaterials.map((source) => {
        const material = source.clone();
        if (material.emissive) {
          material.emissive.set(0xf59e0b);
          material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.45);
        } else if (material.color) {
          material.color.lerp(new THREE.Color(0xf59e0b), 0.35);
        }
        return material;
      });
      const replacement = Array.isArray(original) ? highlighted : highlighted[0];
      highlightedMaterials.push({ node, material: original, highlighted: replacement });
      node.material = replacement;
    });
  }

  function onPick(event) {
    if (!root || event.button !== 0 || event.target !== renderer.domElement) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(root.children, true);
    if (!hits.length) return;
    const hit = hits[0];
    if (hit.object.userData.isAtomMesh && Number.isInteger(hit.instanceId)) {
      const atom = hit.object.userData.atomMap[hit.instanceId];
      if (atom?.visible) selectAtom(atom);
    } else if (!hit.object.userData.isBondLines) selectObject(hit.object);
  }

  function updateAttachedLabel() {
    if (!selected || !labelsVisible) return;
    if (selected.object) {
      if (!selected.object.visible) {
        label.style.display = 'none';
        return;
      }
      selected.object.updateWorldMatrix(true, false);
      labelPosition.copy(selected.localCenter);
      selected.object.localToWorld(labelPosition);
    } else {
      labelPosition.set(selected.atom.x, selected.atom.y, selected.atom.z);
      root.localToWorld(labelPosition);
    }
    const projected = labelPosition.clone().project(camera);
    const insideStage = projected.x >= -1 && projected.x <= 1 && projected.y >= -1 && projected.y <= 1;
    label.style.left = `${(projected.x * 0.5 + 0.5) * stage.clientWidth}px`;
    label.style.top = `${(-projected.y * 0.5 + 0.5) * stage.clientHeight}px`;
    label.style.display = projected.z >= -1 && projected.z < 1 && insideStage ? 'block' : 'none';
  }

  function fitCamera(smooth = false) {
    if (!root || root.children.length === 0) return;
    bounds = new THREE.Box3().setFromObject(root);
    const sphere = bounds.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.5);
    const center = sphere.center;
    const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));
    camera.near = Math.max(0.01, distance / 1000);
    camera.far = Math.max(100, distance * 100);
    const position = center.clone().add(new THREE.Vector3(0, radius * 0.35, distance * 1.25));
    camera.updateProjectionMatrix();
    controls.minDistance = radius * 0.05; controls.maxDistance = distance * 10;
    if (smooth) animateCamera(position, center);
    else { camera.position.copy(position); controls.target.copy(center); }
    controls.update();
  }

  function getCameraState() {
    return { position: camera.position.clone(), target: controls.target.clone() };
  }

  function animateCamera(position, target, savePrevious = true, onComplete) {
    if (savePrevious) {
      previousCameraStates.push(getCameraState());
      if (previousCameraStates.length > 20) previousCameraStates.shift();
      $('sv-previous').disabled = false;
    }
    cancelAnimationFrame(cameraTransition);
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const endPosition = position.clone();
    const endTarget = target.clone();
    const startedAt = performance.now();
    const duration = 650;
    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPosition, endPosition, eased);
      controls.target.lerpVectors(startTarget, endTarget, eased);
      controls.update();
      if (progress < 1) cameraTransition = requestAnimationFrame(tick);
      else {
        cameraTransition = 0;
        if (onComplete) onComplete();
      }
    }
    cameraTransition = requestAnimationFrame(tick);
  }

  function focusSelection() {
    if (!selected?.object) return;
    const box = new THREE.Box3().setFromObject(selected.object);
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    const radius = Math.max(sphere.radius, 0.1);
    const direction = camera.position.clone().sub(controls.target).normalize();
    const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5)) * 1.25;
    animateCamera(sphere.center.clone().addScaledVector(direction, distance), sphere.center);
    setStatus(`Focusing on ${selected.object.name || 'selected component'}.`, false);
  }

  function prepareMeshInspection() {
    meshMaterials = [];
    root.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      const sourceMaterials = Array.isArray(node.material) ? node.material : [node.material];
      const materials = sourceMaterials.map((material) => material.clone());
      meshMaterials.push({ node, materials });
      node.material = Array.isArray(node.material) ? materials : materials[0];
    });
    meshInspectionSupported = meshMaterials.length > 0;
    if (meshInspectionSupported) {
      bounds = new THREE.Box3().setFromObject(root);
      inspectionPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), -bounds.getCenter(new THREE.Vector3()).x);
    }
    resetInspectionControls();
  }

  function updateInspectionControls() {
    $('sv-transparency').disabled = !meshInspectionSupported;
    $('sv-opacity').disabled = !meshInspectionSupported || !$('sv-transparency').checked;
    $('sv-selected-transparency').disabled = !meshInspectionSupported || !$('sv-transparency').checked || !selected?.object;
    $('sv-cutaway').disabled = !meshInspectionSupported;
    $('sv-cut-position').disabled = !meshInspectionSupported || !$('sv-cutaway').checked;
    $('sv-focus').disabled = !selected?.object;
  }

  function resetInspectionControls() {
    $('sv-transparency').checked = false;
    $('sv-opacity').value = '35';
    $('sv-opacity-value').value = '35%';
    $('sv-selected-transparency').checked = false;
    $('sv-cutaway').checked = false;
    $('sv-cut-position').value = '50';
    $('sv-hide').disabled = false;
    $('sv-isolate').disabled = false;
    $('sv-label-toggle').disabled = false;
    $('sv-restore').disabled = false;
    updateInspectionControls();
  }

  function applyMeshDisplayMode() {
    const transparent = $('sv-transparency').checked;
    const opacity = Number($('sv-opacity').value) / 100;
    const cutaway = $('sv-cutaway').checked;
    const selectedOnly = $('sv-selected-transparency').checked && selected?.object;
    const percentage = Number($('sv-cut-position').value) / 100;
    if (inspectionPlane && bounds) {
      inspectionPlane.constant = -THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, percentage);
    }
    const highlighted = selected?.object;
    if (highlighted) clearObjectHighlight();
    const selectedMeshes = new Set();
    if (selectedOnly) selected.object.traverse((node) => selectedMeshes.add(node));
    meshMaterials.forEach(({ node, materials }) => {
      const applyTransparency = transparent && (!selectedOnly || selectedMeshes.has(node));
      node.material = Array.isArray(node.material) ? materials : materials[0];
      materials.forEach((material) => {
        material.transparent = applyTransparency;
        material.opacity = applyTransparency ? opacity : 1;
        material.depthWrite = !applyTransparency;
        material.clippingPlanes = cutaway && inspectionPlane ? [inspectionPlane] : [];
        material.needsUpdate = true;
      });
    });
    if (highlighted?.visible) highlightObject(highlighted);
    updateInspectionControls();
    if (transparent && cutaway) setStatus('Surface transparency and geometric clipping are active; no internal structures are inferred or generated.', false);
    else if (transparent && selectedOnly) setStatus(`Selected component opacity: ${Math.round(opacity * 100)}%. This is not X-ray data.`, false);
    else if (transparent) setStatus(`Source surface opacity: ${Math.round(opacity * 100)}%. This is not X-ray data.`, false);
    else if (cutaway) setStatus('Geometric cutaway active. The supplied surface is clipped; no cut caps or internal structures are generated.', false);
    else if (meshInspectionSupported) setStatus('Source surface restored.', false);
  }

  function addSceneComponents() {
    componentList.replaceChildren();
    let index = 0;
    root.traverse((node) => {
      if (!node.isMesh || node.userData.isAtomMesh || node.userData.isBondLines) return;
      if (!node.name) node.name = `mesh-${++index}`;
      addComponentButton(node.name, node.name, () => selectObject(node));
    });
    if (!componentList.children.length) componentList.textContent = 'This asset does not expose named selectable mesh components.';
  }

  async function loadTextModel(text, format) {
    clearModel();
    loading.style.display = 'grid';
    try {
      let result;
      if (format === 'pdb') result = drawMolecule(window.ScientificStructureParser.parsePdb(text));
      else if (format === 'sdf' || format === 'mol') result = drawMolecule(window.ScientificStructureParser.parseSdf(text));
      else throw new Error(`Text model format “${format}” is not supported.`);
      fitCamera();
      setInteractionDescription(false);
      setStatus(`${result.atomCount} atoms · ${result.componentCount} components · ${result.bondSource}`, false);
      return result;
    } finally { loading.style.display = 'none'; }
  }

  function setInteractionDescription(staticImage) {
    const hint = $('sv-interaction-hint');
    const stageCard = $('sv-stage-card');
    const copy = hint.querySelector('span');
    const strong = document.createElement('strong');
    stageCard.setAttribute('aria-label', staticImage ? 'Static source image viewer' : 'Interactive scientific model');
    strong.textContent = staticImage ? 'View the source illustration' : 'Explore the model';
    copy.replaceChildren(strong, document.createTextNode(staticImage
      ? ' Rotate or zoom the image plane; depicted parts are not independently interactive.'
      : ' Drag to rotate · scroll to zoom · right-drag to pan'));
    renderer.domElement.setAttribute('aria-label', staticImage
      ? 'Static source image on a flat plane. Rotate or zoom the view; depicted parts are not independently interactive.'
      : 'Interactive 3D model. Drag to rotate, use the wheel to zoom, and right-drag to pan.');
  }

  async function loadUrl(url, format) {
    clearModel();
    loading.style.display = 'grid';
    setStatus('Loading scientific model…', false);
    try {
      const normalized = String(format || '').toLowerCase();
      const staticImage = ['png', 'jpg', 'jpeg', 'svg'].includes(normalized);
      if (['pdb', 'sdf', 'mol'].includes(normalized)) {
        const response = await fetch(url, { credentials: 'same-origin' });
        if (!response.ok) throw new Error(`Model request failed with HTTP ${response.status}.`);
        return await loadTextModel(await response.text(), normalized);
      }
      if (normalized === 'gltf' || normalized === 'glb') {
        if (!THREE.GLTFLoader) throw new Error('The glTF loader did not load. Check the browser connection to the Three.js add-on CDN.');
        const loader = new THREE.GLTFLoader();
        const gltf = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
        root.add(gltf.scene);
      } else if (normalized === 'obj') {
        if (!THREE.OBJLoader) throw new Error('The OBJ loader did not load.');
        const response = await fetch(url); if (!response.ok) throw new Error(`Model request failed with HTTP ${response.status}.`);
        root.add(new THREE.OBJLoader().parse(await response.text()));
      } else if (normalized === 'stl') {
        if (!THREE.STLLoader) throw new Error('The STL loader did not load.');
        const response = await fetch(url); if (!response.ok) throw new Error(`Model request failed with HTTP ${response.status}.`);
        const geometry = new THREE.STLLoader().parse(await response.arrayBuffer());
        const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.12, roughness: 0.58, side: THREE.DoubleSide }));
        mesh.name = 'STL surface'; root.add(mesh);
      } else if (['png', 'jpg', 'jpeg', 'svg'].includes(normalized)) {
        const texture = await new Promise((resolve, reject) => new THREE.TextureLoader().load(url, resolve, undefined, reject));
        texture.encoding = THREE.sRGBEncoding;
        const image = texture.image;
        const aspect = image?.width && image?.height ? image.width / image.height : 1;
        const mesh = new THREE.Mesh(new THREE.PlaneGeometry(5 * aspect, 5), new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }));
        mesh.name = 'Source image plane'; root.add(mesh);
      } else throw new Error(`Unsupported 3D format: ${normalized || 'not specified'}.`);
      meshInspectionSupported = ['gltf', 'glb', 'obj', 'stl'].includes(normalized);
      if (meshInspectionSupported) prepareMeshInspection();
      if (staticImage) {
        componentList.textContent = 'Static image: the pictured parts are not separately selectable.';
        $('sv-hide').disabled = true;
        $('sv-isolate').disabled = true;
        $('sv-label-toggle').disabled = true;
        $('sv-restore').disabled = true;
      } else {
        addSceneComponents();
      }
      fitCamera();
      setInteractionDescription(staticImage);
      setStatus(staticImage
        ? 'Static source image displayed on a flat plane. Rotate or zoom the view; the depicted parts are not interactive.'
        : '3D model loaded. Drag to rotate, scroll to zoom, right-drag to pan.', false);
    } finally { loading.style.display = 'none'; }
  }

  function showProvenance(asset) {
    const container = $('sv-provenance'); container.replaceChildren();
    const rows = [
      ['Source', asset.source_institution], ['Record', asset.source_record_id], ['Author', asset.author],
      ['License', asset.license], ['Attribution', asset.attribution], ['Status', asset.validation_status],
      ['Last checked', asset.last_verified_at]
    ];
    rows.forEach(([key, value]) => {
      if (!value) return;
      const p = document.createElement('p'); p.className = 'mb-1';
      const strong = document.createElement('strong'); strong.textContent = `${key}: `;
      p.append(strong, document.createTextNode(String(value)));
      container.appendChild(p);
    });
    if (asset.import_status) {
      const p = document.createElement('p'); p.className = 'mb-1';
      const strong = document.createElement('strong'); strong.textContent = 'Import: ';
      p.append(strong, document.createTextNode(String(asset.import_status).replaceAll('_', ' ')));
      container.appendChild(p);
    }
    for (const [heading, key] of [['Source component relationships', 'components'], ['Scientific labels and caveats', 'labels'], ['Recorded interactions', 'supported_interactions']]) {
      const values = asset[key];
      if (!Array.isArray(values) || !values.length) continue;
      const p = document.createElement('p'); p.className = 'mt-2 mb-0';
      const strong = document.createElement('strong'); strong.textContent = `${heading}: `;
      const descriptions = values.map((value) => typeof value === 'string' ? value : [value.name, value.kind].filter(Boolean).join(' — '));
      p.append(strong, document.createTextNode(descriptions.join('; ')));
      container.appendChild(p);
    }
    if (asset.source_url) {
      const a = document.createElement('a'); a.href = asset.source_url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'Open original source record'; container.appendChild(a);
    }
    if (Array.isArray(asset.scientific_references)) asset.scientific_references.forEach((reference) => {
      const p = document.createElement('p'); p.className = 'mt-2 mb-0'; p.textContent = String(reference); container.appendChild(p);
    });
    const status = $('sv-accuracy');
    status.className = 'sv-notice';
    status.textContent = asset.validation_status === 'verified'
      ? 'This asset passed the platform review recorded in its metadata.'
      : 'Source provenance was recorded. Platform scientific validation has not been asserted.';
  }

  async function loadAsset(assetKey) {
    const response = await fetch(`/api/science/assets/${encodeURIComponent(assetKey)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || `Asset request failed (${response.status}).`);
    const asset = data.asset;
    cameraStorageKey = `scientific-viewer-camera:${assetKey}`;
    try { $('sv-restore-camera').disabled = !localStorage.getItem(cameraStorageKey); }
    catch (error) { setStatus(`Browser storage is unavailable: ${error.message}`, true); }
    $('sv-title').textContent = asset.name;
    $('sv-subtitle').textContent = asset.description || `${asset.subject} · ${asset.category}`;
    showProvenance(asset);
    const modelUrl = asset.model_url;
    if (!modelUrl) throw new Error('This registry record has no model URL attached yet.');
    await loadUrl(modelUrl, asset.model_format);
    return asset;
  }

  function selectedAtomVisibility(predicate) {
    if (!moleculeAtoms || !selected?.atom) return false;
    const component = selected.atom.componentId;
    moleculeAtoms.forEach((atom) => { if (predicate(atom, component)) atom.visible = false; });
    refreshMolecule();
    return true;
  }

  $('sv-reset').addEventListener('click', () => fitCamera(true));
  $('sv-previous').addEventListener('click', () => {
    const previous = previousCameraStates.pop();
    if (!previous) return;
    animateCamera(previous.position, previous.target, false);
    $('sv-previous').disabled = previousCameraStates.length === 0;
    setStatus('Returned to the previous camera position.', false);
  });
  $('sv-focus').addEventListener('click', focusSelection);
  $('sv-save-camera').addEventListener('click', () => {
    try {
      localStorage.setItem(cameraStorageKey, JSON.stringify({
        position: camera.position.toArray(),
        target: controls.target.toArray()
      }));
      $('sv-restore-camera').disabled = false;
      setStatus('Camera position saved in this browser for this asset.', false);
    } catch (error) {
      setStatus(`Could not save this camera position: ${error.message}`, true);
    }
  });
  $('sv-restore-camera').addEventListener('click', () => {
    try {
      const saved = JSON.parse(localStorage.getItem(cameraStorageKey) || 'null');
      if (!saved || !Array.isArray(saved.position) || !Array.isArray(saved.target)) {
        $('sv-restore-camera').disabled = true;
        setStatus('There is no saved camera position for this asset.', true);
        return;
      }
      animateCamera(new THREE.Vector3(...saved.position), new THREE.Vector3(...saved.target), true, () => {
        setStatus('Saved camera position restored.', false);
      });
      setStatus('Restoring the saved camera position.', false);
    } catch (error) {
      setStatus(`Could not restore this camera position: ${error.message}`, true);
    }
  });
  $('sv-transparency').addEventListener('change', applyMeshDisplayMode);
  $('sv-selected-transparency').addEventListener('change', applyMeshDisplayMode);
  $('sv-opacity').addEventListener('input', () => {
    $('sv-opacity-value').value = `${$('sv-opacity').value}%`;
    applyMeshDisplayMode();
  });
  $('sv-cutaway').addEventListener('change', applyMeshDisplayMode);
  $('sv-cut-position').addEventListener('input', applyMeshDisplayMode);
  $('sv-label-toggle').addEventListener('click', (event) => {
    labelsVisible = !labelsVisible; label.style.display = labelsVisible && selected ? 'block' : 'none';
    event.currentTarget.textContent = labelsVisible ? 'Hide label' : 'Show label';
    event.currentTarget.setAttribute('aria-pressed', String(labelsVisible));
  });
  $('sv-hide').addEventListener('click', () => {
    if (selectedAtomVisibility((atom, id) => atom.componentId === id)) return;
    if (selected?.object) {
      selected.object.visible = false;
      clearObjectHighlight();
      label.style.display = 'none';
      setStatus('Selected mesh hidden.', false);
    }
  });
  $('sv-isolate').addEventListener('click', () => {
    if (selectedAtomVisibility((atom, id) => atom.componentId !== id)) return;
    if (selected?.object) {
      root.traverse((node) => {
        const isSelectionOrParent = node.getObjectById(selected.object.id) !== undefined;
        const isSelectionOrChild = selected.object.getObjectById(node.id) !== undefined;
        node.visible = node === root || isSelectionOrParent || isSelectionOrChild;
      });
      setStatus(`Isolated ${selected.object.name || 'selected component'}.`, false);
    }
  });
  $('sv-restore').addEventListener('click', () => {
    if (moleculeAtoms) moleculeAtoms.forEach((atom) => { atom.visible = true; });
    if (root) root.traverse((node) => { node.visible = true; });
    refreshMolecule();
    if (selected?.object) {
      clearObjectHighlight();
      highlightObject(selected.object);
    }
    setStatus('All model components restored.', false);
  });
  $('sv-fullscreen').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) await stage.requestFullscreen(); else await document.exitFullscreen();
    } catch (_) { setStatus('Fullscreen is unavailable in this browser.', true); }
  });

  init();
  const assetKey = new URLSearchParams(window.location.search).get('asset');
  const query = new URLSearchParams(window.location.search);
  const source = query.get('source');
  const compound = query.get('compound');
  async function loadPubChemCompound(identifier) {
    if (!identifier || identifier.length > 100) throw new Error('Provide a compound name or PubChem CID (up to 100 characters).');
    setStatus('Loading compound data and source conformer from PubChem…', false);
    const response = await fetch(`/api/science/assets/sources/pubchem/${encodeURIComponent(identifier)}`, { credentials: 'same-origin' });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || `PubChem request failed (${response.status}).`);
    const record = result.compound;
    cameraStorageKey = `scientific-viewer-camera:pubchem-${record.cid}`;
    try { $('sv-restore-camera').disabled = !localStorage.getItem(cameraStorageKey); }
    catch (error) { setStatus(`Browser storage is unavailable: ${error.message}`, true); }
    $('sv-title').textContent = record.name || `PubChem CID ${record.cid}`;
    $('sv-subtitle').textContent = [record.formula, record.molecular_weight_g_mol == null ? null : `${record.molecular_weight_g_mol} g/mol`].filter(Boolean).join(' · ');
    showProvenance({
      source_institution: record.provenance.institution,
      source_record_id: record.provenance.record_id,
      source_url: record.provenance.source_url,
      license: record.provenance.data_license,
      attribution: record.provenance.attribution,
      validation_status: 'source_verified'
    });
    if (record.sdf) await loadTextModel(record.sdf, 'sdf');
    else {
      clearModel();
      setStatus(record.warning || 'PubChem does not provide a 3D conformer for this compound.', true);
    }
    return record;
  }
  if (assetKey) loadAsset(assetKey).catch((err) => { setStatus(err.message, true); loading.textContent = err.message; });
  else if (source === 'pubchem') loadPubChemCompound(compound || '').catch((err) => { setStatus(err.message, true); loading.textContent = err.message; });
  else { loading.style.display = 'none'; setStatus('Open a registered asset with ?asset=asset-key or a PubChem record with ?source=pubchem&compound=water.', false); }

  window.ScientificViewer = { loadAsset, loadTextModel, loadUrl, loadPubChemCompound, focusSelection, animateCamera };
})();
