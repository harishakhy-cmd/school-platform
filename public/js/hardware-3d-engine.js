(function (root) {
  'use strict';

  const MODELS = {
    motherboard: {
      title: 'ATX motherboard',
      summary: 'Representative system board with common sockets, slots, power connections and controllers.',
      parts: {
        'Motherboard PCB': ['Printed circuit board carrying sockets, slots and electrical interconnects.', 'ATX-class illustrative layout; placement varies by board.'],
        'CPU socket': ['Mechanical and electrical interface that connects a compatible processor to the board.', 'Socket family is model-specific; this sample does not represent a particular manufacturer board.'],
        'DIMM slot': ['Long connector for desktop memory modules. The slot and module generation must match.', 'Four slots shown for illustration; channel population rules vary by board.'],
        'PCI Express slot': ['Expansion connector for add-in cards such as graphics and network adapters.', 'Lane count, generation and physical length vary by board.'],
        'Chipset heatsink': ['Covers a board controller that coordinates selected I/O functions.', 'Modern processor platforms may integrate functions that older chipsets handled.'],
        'VRM heatsink': ['Helps dissipate heat from voltage-regulation components supplying processor power.', 'Not all boards use the same VRM layout or heatsink design.'],
        'M.2 socket': ['Edge connector for a compatible M.2 storage or expansion module.', 'Keying, protocol and supported lengths are board-specific.'],
        'SATA ports': ['Connectors for SATA storage devices and optical drives.', 'Shown as a representative port group.'],
        'ATX power connector': ['Main board power input from the power supply.', 'Connector and pinout must match the board and PSU cable.'],
        'Rear I/O block': ['External connections for display, USB, networking and audio.', 'The exact port selection varies by motherboard model.'],
        'CMOS battery': ['Coin-cell battery that commonly backs the real-time clock and firmware settings.', 'Some newer systems use other designs or integrated batteries.'],
        'Fan header': ['Low-voltage header for a compatible system fan.', 'Pinout and control support vary.']
      }
    },
    desktop: {
      title: 'Desktop system unit',
      summary: 'Open-frame teaching model showing typical desktop locations. It is not a specific retail case or board.',
      parts: {
        'Chassis frame': ['Structural case that supports components and manages airflow.', 'Representative mid-tower proportions; case sizes and layouts vary.'],
        'Side panel': ['Enclosure panel; remove it only after safely disconnecting the system from power.', 'Transparent teaching view, not a service instruction.'],
        'System board': ['Main printed circuit board connecting processor, memory, expansion cards and storage.'],
        'Processor and cooler': ['Processor fitted to its socket with a cooling assembly above it.'],
        'Memory modules': ['Desktop DIMMs installed in board slots.'],
        'Graphics card': ['Expansion card installed in a PCI Express slot.'],
        'Power supply enclosure': ['Contains power conversion electronics and supplies DC power to components.', 'Not serviceable in this simulation. Never open a mains-connected PSU.'],
        'Storage device': ['Representative solid-state storage mounted in a drive location.'],
        'Case fan': ['Moves air through the enclosure; orientation and airflow path matter.'],
        'Rear I/O': ['External board connections accessible at the rear of the chassis.']
      }
    },
    cpu: {
      title: 'Processor package',
      summary: 'A conceptual package model; the simplified core diagram is not a photomicrograph or die layout.',
      parts: {
        'Package substrate': ['Substrate routes signals and power between the processor die and its socket contacts.'],
        'Integrated heat spreader': ['Metal lid transfers heat from the package toward a cooler.'],
        'Contact array': ['Representative contact field for a land-grid style package.', 'Other CPU packages use different contact arrangements.'],
        'Core cluster': ['Simplified view of processing cores that execute instruction streams.', 'Not to scale and not a physical die map.'],
        'Cache block': ['Small, fast memory close to processing cores that reduces average data access time.', 'Real cache levels and topology vary.'],
        'Memory controller': ['Coordinates processor access to system memory on many modern platforms.', 'Implementation differs by architecture.']
      }
    },
    ram: {
      title: 'Desktop DIMM memory',
      summary: 'Representative desktop memory module with packages and a keyed edge connector.',
      parts: {
        'DIMM PCB': ['Module circuit board that connects memory packages to the memory controller.'],
        'Memory package': ['A DRAM package stores bits as charge in volatile memory cells.', 'Package count and arrangement vary by capacity and design.'],
        'Gold contacts': ['Electrical contacts mate with the motherboard memory slot.'],
        'Key notch': ['Mechanical key helps prevent installation into an incompatible slot generation.'],
        'Retention clip': ['Slot mechanism helps retain a module after correct alignment.']
      }
    },
    storage: {
      title: 'M.2 solid-state drive',
      summary: 'Representative M.2 board. M.2 describes a form factor; it does not by itself guarantee NVMe or a particular speed.',
      parts: {
        'SSD circuit board': ['Compact printed circuit board carrying storage controller and flash packages.'],
        'NAND flash package': ['Non-volatile flash stores data without continuous power.'],
        'SSD controller': ['Manages flash translation, error correction and host communication.'],
        'M.2 edge connector': ['Keyed connector; supported protocol depends on both drive and host slot.'],
        'Mounting point': ['Secures a supported drive length to the motherboard standoff.']
      }
    },
    gpu: {
      title: 'Graphics card',
      summary: 'Representative add-in graphics card showing the PCB, cooling and host connector.',
      parts: {
        'Graphics PCB': ['Board carrying the graphics processor, memory, power circuitry and connectors.'],
        'GPU package': ['Parallel processor optimized for graphics and other highly parallel workloads.'],
        'Graphics memory': ['Dedicated high-bandwidth memory used by the graphics processor.', 'Amount and type depend on the particular card.'],
        'Cooling fan': ['Moves air through the heatsink; fan count and direction vary by design.'],
        'Heatsink': ['Transfers heat away from high-power components to surrounding airflow.'],
        'PCIe edge connector': ['Connects the card to a compatible motherboard expansion slot.'],
        'Display outputs': ['Connect displays using the supported port and display capabilities.', 'Connector shape alone does not guarantee every protocol or feature.'],
        'Auxiliary power socket': ['Provides additional power when required by the card.', 'Cable type and power requirements are model-specific.']
      }
    },
    cooling: {
      title: 'CPU air cooler',
      summary: 'Simplified air-cooling assembly showing heat transfer from the processor to moving air.',
      parts: {
        'Cold plate': ['Contacts the processor heat spreader through suitable thermal interface material.'],
        'Heat pipes': ['Move heat from the base toward the fin stack using phase-change heat transport.'],
        'Fin stack': ['Provides surface area for heat exchange with moving air.'],
        'Cooling fan': ['Pushes or pulls air through the heatsink fins.'],
        'Fan header lead': ['Connects a compatible fan to a board header for power and control.']
      }
    },
    laptop: {
      title: 'Laptop architecture',
      summary: 'Representative open teaching model. Many laptops solder memory or storage and have different internal layouts.',
      parts: {
        'Display assembly': ['Panel and supporting structure; hinge and display technology vary.'],
        'Keyboard deck': ['Input surface containing keyboard and commonly a touchpad.'],
        'Bottom enclosure': ['Protective cover; opening a real device may affect warranty and safety.'],
        'System board': ['Compact board integrating processor, controllers and device connections.'],
        'Battery pack': ['Rechargeable energy storage. Do not puncture, bend or service a damaged battery.'],
        'Cooling assembly': ['Fan and heat pipe move processor heat to an exhaust fin stack.'],
        'M.2 storage': ['Shown as a replaceable module in this example; some laptops use soldered storage.'],
        'SO-DIMM slot': ['Shown as a replaceable memory slot; many laptops instead use soldered memory.'],
        'Wireless module': ['Provides Wi-Fi/Bluetooth functions; antennas are routed through the display assembly.']
      }
    },
    mobile: {
      title: 'Mobile device architecture',
      summary: 'Exploded conceptual device showing typical subsystems; component placement is model-specific.',
      parts: {
        'Display assembly': ['Combines display and touch sensing; bonding and layer arrangements vary.'],
        'Battery': ['Rechargeable cell. Never puncture, heat, bend or attempt to remove a swollen battery.'],
        'Mainboard': ['Compact board carrying the system-on-chip, memory, storage and interfaces.'],
        'System-on-chip': ['Integrates processor, graphics and other functions in a single package.'],
        'Camera module': ['Image sensor and optics capture still images or video.'],
        'Speaker module': ['Electro-acoustic transducer for audio output.'],
        'Charging connector': ['Physical connector for charging and supported data functions.'],
        'Antenna assembly': ['Conductive structures used by supported radio systems.']
      }
    },
    network: {
      title: 'Ethernet switch',
      summary: 'Representative access switch front panel with numbered ports and status indicators.',
      parts: {
        'Switch enclosure': ['Protects and supports the switching electronics.'],
        'Ethernet port': ['Connects a compatible twisted-pair Ethernet cable. Negotiated speed depends on all link components.'],
        'Status indicator': ['Communicates link/activity state; color and blink meanings are product-specific.'],
        'Uplink port': ['Representative higher-level network connection; actual port capability varies by model.'],
        'Power input': ['Connects the specified external supply or facility power input.']
      }
    },
    ports: {
      title: 'I/O connector study',
      summary: 'Representative connector shapes for identification. Shape alone does not establish supported protocol or capability.',
      parts: {
        'USB-A': ['Common rectangular USB connector used for data and, where supported, power.'],
        'USB-C': ['Reversible connector shape; supported data rates, display features and power vary by device.'],
        'HDMI': ['Digital audio/video connector family; version and supported features are device-specific.'],
        'DisplayPort': ['Digital display interface; capabilities depend on the port, cable and connected devices.'],
        'Ethernet RJ45': ['Common 8-position modular connector for twisted-pair Ethernet.'],
        '3.5 mm audio': ['Analog audio connector; wiring and microphone support can vary.'],
        'SATA data': ['Data connector used by compatible SATA storage devices.'],
        'Power plug': ['Illustrative DC power connector. Voltage, polarity and current rating must match equipment.']
      }
    }
  };

  const ASSEMBLY_STEPS = [
    'Disconnect external power and place the system on a clear work surface.',
    'Open the case using its designed panel fasteners.',
    'Mount a motherboard that matches the case form factor.',
    'Align and seat a compatible CPU; secure its retention mechanism.',
    'Apply thermal interface material as specified, then mount the cooler.',
    'Install compatible memory modules in the board-recommended slots.',
    'Mount storage and any required expansion card; secure each component.',
    'Connect only matching power/data cables, then perform a visual check.'
  ];

  const DESKTOP_ASSEMBLY = {
    'case-frame': { relation: 'Chassis anchor; motherboard and drives mount within the case.', offset: [0, 0, 0] },
    'side-panel': { relation: 'Removable enclosure panel; removed before internal service.', offset: [1.8, 0.15, 0] },
    'system-board': { relation: 'Board mounts to case standoffs; CPU, memory and expansion card connect to it.', offset: [-1.2, 0.15, 0] },
    processor: { relation: 'CPU occupies the board socket; cooler mounts over the CPU heat spreader.', offset: [-0.8, 0.75, -0.8] },
    'memory-a': { relation: 'DIMM A is inserted into a board memory slot.', offset: [-0.1, 0.45, -0.85] },
    'memory-b': { relation: 'DIMM B is inserted into an adjacent compatible board memory slot.', offset: [0.2, 0.45, -0.85] },
    graphics: { relation: 'Graphics card edge connector seats in the board PCI Express slot; bracket aligns with the case.', offset: [-0.15, 0.65, 1.35] },
    'power-supply': { relation: 'PSU is secured to the chassis; matching power cables connect to system components.', offset: [1.3, 0.75, -0.9] },
    storage: { relation: 'Storage mounts to a compatible case or board location and uses supported data/power interfaces.', offset: [1.1, -0.4, 0.9] },
    'case-fan': { relation: 'Fan attaches to a chassis mount; airflow direction depends on fan orientation.', offset: [-1.3, 0.4, 0.9] },
    'rear-io': { relation: 'Rear I/O aligns with the case opening and is attached to the system board.', offset: [-1.25, -0.4, -0.85] }
  };

  const DIAGNOSTICS = {
    'no-display': {
      options: ['Check display input and cable, then verify the monitor is powered.', 'Check the system power connection and motherboard status indicators.', 'Reseat memory only after powering down and disconnecting the system.'],
      answers: [0, 2],
      feedback: 'No-display faults have several possible causes. Confirm the display path first; if necessary, power down safely before checking memory or other internal connections.'
    },
    'no-boot': {
      options: ['Confirm the outlet, power cable and PSU switch without opening the PSU.', 'Check that the board power connectors are fully seated after disconnecting mains power.', 'Replace the processor immediately.'],
      answers: [0, 1],
      feedback: 'Start with external power and visible status indicators. Internal connector checks require the system to be disconnected from mains power.'
    },
    overheat: {
      options: ['Check that the cooler is mounted correctly and its fan is connected.', 'Check that vents are unobstructed and airflow is not blocked.', 'Open the power supply enclosure to inspect its fan.'],
      answers: [0, 1],
      feedback: 'Check cooler contact, fan operation, and airflow. Never open a power supply; it can retain hazardous charge.'
    },
    'no-network': {
      options: ['Check link indicators and reseat a known-good Ethernet cable.', 'Verify the switch port and network adapter are enabled.', 'Change the CPU thermal paste first.'],
      answers: [0, 1],
      feedback: 'Inspect the physical link and port status, then check adapter and network configuration. Physical and logical network faults can coexist.'
    }
  };

  function HardwareLabEngine(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.root = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.parts = [];
    this.components = new Map();
    this.selected = null;
    this.exploded = false;
    this.explosionProgress = 0;
    this.explosionDirection = 1;
    this.explosionPlaying = false;
    this.explosionCameraState = null;
    this.lastFrameTime = 0;
    this.xrayMode = false;
    this.xrayOpacity = 0.22;
    this.hiddenSelected = false;
    this.modelId = 'motherboard';
    this.target = new THREE.Vector3(0, 0.15, 0);
    this.spherical = { theta: Math.PI * 0.22, phi: 1.12, radius: 9 };
    this.drag = null;
    this.assemblyComplete = new Set();
    this.resizeObserver = null;
    this.animationId = null;
    this.onResize = this.resize.bind(this);
    this.init();
  }

  HardwareLabEngine.prototype.init = function () {
    if (!this.container || typeof THREE === 'undefined' || !THREE.WebGLRenderer) {
      this.setStatus('3D hardware view is unavailable. Check that the Three.js library loaded successfully.');
      return;
    }
    try {
      const width = Math.max(1, this.container.clientWidth);
      const height = Math.max(1, this.container.clientHeight);
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x0b1220);
      this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
      this.renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 1.75));
      this.renderer.setSize(width, height);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.container.replaceChildren(this.renderer.domElement);
      this.renderer.domElement.setAttribute('aria-label', '3D hardware model. Drag to orbit, use the mouse wheel to zoom, and select components.');
      this.renderer.domElement.style.touchAction = 'none';
      this.scene.add(new THREE.HemisphereLight(0xe2efff, 0x182335, 1.7));
      const key = new THREE.DirectionalLight(0xffffff, 2.4);
      key.position.set(5, 10, 7);
      key.castShadow = true;
      this.scene.add(key);
      const fill = new THREE.DirectionalLight(0x75a7ff, 1.1);
      fill.position.set(-7, 3, -5);
      this.scene.add(fill);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.ShadowMaterial({ opacity: 0.22 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -1.35;
      ground.receiveShadow = true;
      this.scene.add(ground);
      this.scene.add(new THREE.GridHelper(18, 18, 0x263954, 0x172338));
      this.bindInput();
      this.bindUi();
      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(this.onResize);
        this.resizeObserver.observe(this.container);
      } else {
        root.addEventListener('resize', this.onResize);
      }
      this.loadModel(this.modelId);
      this.animate();
    } catch (error) {
      console.error('[HardwareLabEngine] Initialization failed:', error);
      this.setStatus(`Could not initialize the 3D hardware viewer: ${error.message}`);
    }
  };

  HardwareLabEngine.prototype.disposeModel = function () {
    if (!this.root) return;
    this.scene.remove(this.root);
    this.root.traverse((node) => {
      node.geometry?.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.filter(Boolean).forEach((material) => {
        material.map?.dispose();
        material.dispose();
      });
    });
    this.root = null;
    this.parts = [];
    this.components.clear();
    this.selected = null;
  };

  HardwareLabEngine.prototype.makeMaterial = function (color, options) {
    return new THREE.MeshStandardMaterial(Object.assign({
      color,
      metalness: 0.24,
      roughness: 0.58
    }, options || {}));
  };

  HardwareLabEngine.prototype.part = function (name, position, size, color, detail, options) {
    const opts = options || {};
    const geometry = opts.geometry || new THREE.BoxGeometry(size[0], size[1], size[2]);
    const material = this.makeMaterial(color, opts.material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position[0], position[1], position[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    let assembly = null;
    if (opts.componentId) {
      let componentGroup = this.components.get(opts.componentId);
      if (!componentGroup) {
        assembly = DESKTOP_ASSEMBLY[opts.componentId] || null;
        componentGroup = new THREE.Group();
        componentGroup.name = opts.componentId;
        componentGroup.userData.assembly = assembly;
        componentGroup.userData.explodeOffset = new THREE.Vector3(...(assembly?.offset || [0, 0, 0]));
        this.root.add(componentGroup);
        this.components.set(opts.componentId, componentGroup);
      } else {
        assembly = componentGroup.userData.assembly;
      }
      componentGroup.add(mesh);
    } else {
      this.root.add(mesh);
    }
    mesh.userData.hardwarePart = {
      name,
      description: detail || '',
      specs: (MODELS[this.modelId].parts[name] || [detail || 'Representative component.'])[1] || 'Representative educational geometry; dimensions and implementation vary by model.',
      originalColor: new THREE.Color(color),
      originalEmissive: material.emissive ? material.emissive.clone() : new THREE.Color(0x000000),
      originalPosition: mesh.position.clone(),
      explodeVector: new THREE.Vector3(position[0], position[1] + 0.2, position[2]).normalize(),
      componentId: opts.componentId || null,
      relationship: assembly?.relation || '',
      role: opts.role || ''
    };
    this.parts.push(mesh);
    return mesh;
  };

  HardwareLabEngine.prototype.addLabel = function (text, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(8, 16, 30, .88)';
    context.fillRect(4, 4, 504, 88);
    context.fillStyle = '#f8fafc';
    context.font = '600 30px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 48, 480);
    const texture = new THREE.CanvasTexture(canvas);
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 0.49),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    label.position.set(position[0], position[1], position[2]);
    label.userData.isHardwareLabel = true;
    this.root.add(label);
    return label;
  };

  HardwareLabEngine.prototype.addComponentLabel = function (componentId, text, position) {
    const component = this.components.get(componentId);
    if (!component) return;
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 80;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(8, 16, 30, .9)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#f8fafc';
    context.font = '600 28px system-ui, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 20);
    const texture = new THREE.CanvasTexture(canvas);
    const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false }));
    label.scale.set(1.55, 0.32, 1);
    label.position.set(position[0], position[1], position[2]);
    label.userData.isHardwareLabel = true;
    component.add(label);
  };

  HardwareLabEngine.prototype.loadModel = function (modelId) {
    if (!MODELS[modelId] || !this.scene || !this.renderer) return;
    this.stopExplosion();
    this.setXray(false, false);
    this.disposeModel();
    this.modelId = modelId;
    this.root = new THREE.Group();
    this.root.name = modelId;
    this.scene.add(this.root);
    this.exploded = false;
    this.explosionProgress = 0;
    this.hiddenSelected = false;
    const builder = this[`build_${modelId}`];
    if (typeof builder !== 'function') {
      this.setStatus(`The ${MODELS[modelId].title} model is not available.`);
      return;
    }
    try {
      builder.call(this);
      this.setCamera('iso');
      this.updateInspector(null);
      this.updateActionButtons();
      const explodeButton = document.querySelector('[data-hw-action="explode"]');
      explodeButton?.classList.remove('active');
      explodeButton?.setAttribute('aria-pressed', 'false');
      this.setStatus('Select a component in the model or use the library to explore another device.');
      document.querySelectorAll('[data-hw-model]').forEach((button) => {
        button.classList.toggle('active', button.dataset.hwModel === modelId);
      });
      const picker = document.getElementById('select-hardware-component');
      if (picker) picker.value = modelId;
    } catch (error) {
      console.error(`[HardwareLabEngine] Failed to build ${modelId}:`, error);
      this.setStatus(`Could not build ${MODELS[modelId].title}: ${error.message}`);
    }
  };

  HardwareLabEngine.prototype.build_motherboard = function () {
    this.part('Motherboard PCB', [0, 0, 0], [6.1, 0.16, 4.5], 0x176b55, 'Multi-layer board routes signals and power between the processor, memory, expansion cards, storage and I/O.');
    for (let i = 0; i < 18; i++) {
      const x = -2.6 + (i % 6) * 0.48;
      const z = -1.7 + Math.floor(i / 6) * 0.86;
      this.part('VRM heatsink', [x, 0.16, z], [0.23, 0.2, 0.5], i % 2 ? 0x94a3b8 : 0x64748b, 'A simplified visible component in the processor voltage-regulation area.');
    }
    this.part('CPU socket', [-1.05, 0.26, -0.65], [1.3, 0.16, 1.3], 0xcbd5e1, 'Socket interface for a compatible processor.');
    this.part('CPU socket', [-1.05, 0.36, -0.65], [0.93, 0.1, 0.93], 0x475569, 'Retention frame aligns and secures a supported processor package.');
    for (let i = 0; i < 4; i++) {
      this.part('DIMM slot', [0.35 + i * 0.28, 0.28, -0.62], [0.11, 0.1, 1.75], 0x172033, 'Memory slot. Align the module notch and use the board-recommended population order.');
      this.part('DIMM slot', [0.35 + i * 0.28, 0.34, -1.51], [0.16, 0.16, 0.12], 0xdbe4ee, 'Movable retention clip on the memory slot.');
    }
    this.part('Chipset heatsink', [1.6, 0.23, 0.8], [1.05, 0.18, 0.82], 0x334155, 'Representative heatsink over board I/O control circuitry.');
    this.part('VRM heatsink', [-2.45, 0.24, -0.55], [0.48, 0.34, 1.25], 0x94a3b8, 'Heatsink over voltage-regulation components.');
    for (let i = 0; i < 3; i++) this.part('PCI Express slot', [-0.25, 0.24, 0.34 + i * 0.61], [3.25, 0.1, 0.15], 0x111827, 'Expansion slot. Physical length does not alone establish its electrical lane count.');
    this.part('M.2 socket', [1.35, 0.26, -0.1], [1.55, 0.11, 0.24], 0x0f172a, 'Socket for a compatible M.2 module; keying, protocol and length are board-specific.');
    this.part('SATA ports', [2.48, 0.28, 1.2], [0.65, 0.28, 0.35], 0xf97316, 'Representative group of SATA storage connectors.');
    this.part('ATX power connector', [2.78, 0.28, -0.65], [0.34, 0.4, 0.92], 0x0f172a, 'Main motherboard power connector.');
    this.part('CMOS battery', [2.05, 0.28, -1.5], [0.52, 0.12, 0.52], 0xcbd5e1, 'Representative coin-cell battery for the real-time clock and firmware settings.');
    this.part('Fan header', [2.55, 0.27, -1.65], [0.34, 0.18, 0.22], 0xf8fafc, 'Connector for a compatible cooling fan.');
    this.part('Rear I/O block', [-2.82, 0.45, 1.5], [0.42, 0.72, 1.2], 0x334155, 'Board-edge area for external USB, display, networking and audio connections.');
    this.addLabel('CPU socket', [-1.1, 1.1, -0.65]);
    this.addLabel('Memory slots', [1.1, 1.45, -0.7]);
  };

  HardwareLabEngine.prototype.build_desktop = function () {
    const caseMaterial = { metalness: 0.62, roughness: 0.42, transparent: true, opacity: 1 };
    const frameDetail = 'Open-frame representative chassis structure. Real cases use different dimensions, panels, mounts and airflow paths.';
    [
      [[-2.72, 0.1, -1.12], [0.12, 4.1, 0.12]],
      [[2.72, 0.1, -1.12], [0.12, 4.1, 0.12]],
      [[-2.72, 0.1, 1.12], [0.12, 4.1, 0.12]],
      [[2.72, 0.1, 1.12], [0.12, 4.1, 0.12]],
      [[0, -1.92, -1.12], [5.5, 0.12, 0.12]],
      [[0, 2.12, -1.12], [5.5, 0.12, 0.12]],
      [[0, -1.92, 1.12], [5.5, 0.12, 0.12]],
      [[0, 2.12, 1.12], [5.5, 0.12, 0.12]],
      [[-2.72, -1.92, 0], [0.12, 0.12, 2.2]],
      [[2.72, -1.92, 0], [0.12, 0.12, 2.2]],
      [[-2.72, 2.12, 0], [0.12, 0.12, 2.2]],
      [[2.72, 2.12, 0], [0.12, 0.12, 2.2]]
    ].forEach(([position, size]) => {
      this.part('Chassis frame', position, size, 0x475569, frameDetail, {
        componentId: 'case-frame',
        role: 'casing',
        material: caseMaterial
      });
    });
    this.part('Side panel', [2.84, 0.1, 0], [0.08, 4.1, 2.2], 0x64748b, 'Enclosure panel shown in its installed position. Remove only after the system is safely disconnected from power.', {
      componentId: 'side-panel',
      role: 'casing',
      material: { transparent: true, opacity: 1, metalness: 0.1 }
    });
    this.part('System board', [-0.75, 0.2, 0], [3.5, 0.18, 3.45], 0x176b55, 'Main board connecting processor, memory, expansion cards and storage. A simplified internal board is shown.', { componentId: 'system-board' });
    this.part('Processor and cooler', [-1.15, 0.75, -0.45], [0.9, 0.88, 0.9], 0x94a3b8, 'CPU and cooler assembly mounted to the system board.', { componentId: 'processor' });
    this.part('Memory modules', [-0.25, 0.58, -0.45], [0.14, 0.78, 1.2], 0x2563eb, 'Desktop memory module inserted in a motherboard DIMM slot.', { componentId: 'memory-a' });
    this.part('Memory modules', [0.15, 0.58, -0.45], [0.14, 0.78, 1.2], 0x3b82f6, 'Adjacent desktop memory module in a representative dual-channel arrangement.', { componentId: 'memory-b' });
    this.part('Graphics card', [-0.55, 0.42, 0.72], [3.05, 0.65, 0.45], 0x475569, 'Expansion card installed in a compatible PCI Express slot.', { componentId: 'graphics' });
    this.part('Power supply enclosure', [1.8, 0.55, -0.85], [1.55, 1.15, 1.55], 0x1e293b, 'Enclosed power supply. It is not serviceable in this simulation; never open a mains-connected PSU.', { componentId: 'power-supply' });
    this.part('Storage device', [1.55, 0.12, 0.55], [1.1, 0.22, 0.8], 0x64748b, 'Representative storage location and device.', { componentId: 'storage' });
    this.part('Case fan', [-2.45, 0.45, 0.7], [0.22, 1.05, 1.05], 0x0f172a, 'Airflow fan. Chassis airflow depends on fan placement, orientation and case design.', { componentId: 'case-fan' });
    this.part('Rear I/O', [-2.55, 0.2, -1.22], [0.42, 1.2, 0.48], 0x0f172a, 'External system-board ports accessible at the rear.', { componentId: 'rear-io' });
    this.addComponentLabel('system-board', 'SYSTEM BOARD', [-0.75, 0.72, 0]);
    this.addComponentLabel('processor', 'CPU + COOLER', [-1.15, 1.3, -0.45]);
    this.addComponentLabel('memory-a', 'DIMM A', [-0.25, 1.05, -0.45]);
    this.addComponentLabel('memory-b', 'DIMM B', [0.15, 1.05, -0.45]);
    this.addComponentLabel('graphics', 'GRAPHICS CARD', [-0.55, 0.9, 0.72]);
    this.addComponentLabel('power-supply', 'POWER SUPPLY', [1.8, 1.25, -0.85]);
    this.addComponentLabel('storage', 'STORAGE', [1.55, 0.42, 0.55]);
  };

  HardwareLabEngine.prototype.build_cpu = function () {
    this.part('Package substrate', [0, 0, 0], [2.6, 0.28, 2.6], 0x172033, 'Substrate routes signals and power between the die and socket contacts.');
    this.part('Integrated heat spreader', [0, 0.24, 0], [2.15, 0.18, 2.15], 0x9ca3af, 'Metal spreader distributes heat from the package toward the cooling system.', { material: { metalness: 0.88, roughness: 0.27 } });
    for (let row = 0; row < 7; row++) for (let col = 0; col < 7; col++) {
      this.part('Contact array', [-1.05 + col * 0.35, -0.19, -1.05 + row * 0.35], [0.07, 0.04, 0.07], 0xeab308, 'Representative land-grid contacts; pin-grid packages use a different interface.', { material: { metalness: 0.8, roughness: 0.25 } });
    }
    this.part('Core cluster', [-0.62, 0.45, 0], [0.86, 0.08, 1.25], 0x2563eb, 'Conceptual processing cores. Not a physical die layout.');
    this.part('Core cluster', [0.47, 0.45, 0], [0.86, 0.08, 1.25], 0x3b82f6, 'Conceptual processing cores. Not a physical die layout.');
    this.part('Cache block', [0, 0.46, -0.82], [1.8, 0.08, 0.27], 0x10b981, 'Conceptual cache region close to processing cores.');
    this.part('Memory controller', [0, 0.46, 0.82], [1.8, 0.08, 0.27], 0xf59e0b, 'Conceptual memory controller region.');
  };

  HardwareLabEngine.prototype.build_ram = function () {
    this.part('DIMM PCB', [0, 0.3, 0], [0.16, 2.3, 0.3], 0x166534, 'Module PCB links memory packages to the DIMM edge connector.');
    for (let i = 0; i < 8; i++) this.part('Memory package', [0.11, 0.36, -0.98 + i * 0.27], [0.13, 0.2, 0.2], 0x111827, 'DRAM package containing volatile memory cells.');
    this.part('Gold contacts', [0.01, -0.9, 0], [0.19, 0.18, 0.29], 0xeab308, 'Representative contact area at the module edge.');
    this.part('Key notch', [0.11, -0.88, 0.2], [0.2, 0.12, 0.08], 0x0b1220, 'Illustrative notch that keys the module to a compatible slot generation.');
    this.part('Retention clip', [0.25, 0.3, -1.22], [0.13, 0.32, 0.14], 0xcbd5e1, 'Representative slot retention feature.');
    this.part('Retention clip', [0.25, 0.3, 1.22], [0.13, 0.32, 0.14], 0xcbd5e1, 'Representative slot retention feature.');
  };

  HardwareLabEngine.prototype.build_storage = function () {
    this.part('SSD circuit board', [0, 0, 0], [4.3, 0.12, 0.85], 0x166534, 'Representative M.2 board. Key type and length vary.');
    for (let i = 0; i < 4; i++) this.part('NAND flash package', [-0.95 + i * 0.72, 0.11, -0.12], [0.55, 0.13, 0.48], 0x111827, 'Non-volatile flash memory package.');
    this.part('SSD controller', [0.25, 0.12, 0.17], [0.5, 0.13, 0.43], 0x475569, 'Controller manages flash translation and host communication.');
    this.part('M.2 edge connector', [-2.05, 0, 0], [0.36, 0.08, 0.68], 0xeab308, 'Keyed edge connector; protocol support depends on host and module.');
    this.part('Mounting point', [2.05, 0.08, 0], [0.21, 0.08, 0.21], 0xcbd5e1, 'Representative end mounting hole.');
  };

  HardwareLabEngine.prototype.build_gpu = function () {
    this.part('Graphics PCB', [0, 0, 0], [4.7, 0.16, 1.9], 0x166534, 'Printed circuit board carrying graphics, memory, power and I/O components.');
    this.part('GPU package', [0, 0.2, 0], [1.15, 0.22, 0.92], 0x334155, 'Graphics processor package.');
    for (let i = 0; i < 6; i++) this.part('Graphics memory', [-1.6 + i * 0.64, 0.2, i % 2 ? -0.7 : 0.7], [0.43, 0.13, 0.33], 0x0f172a, 'Dedicated graphics memory package.');
    for (let i = 0; i < 2; i++) {
      this.part('Cooling fan', [-1.1 + i * 2.15, 0.42, 0], [0.92, 0.13, 0.92], 0x1e293b, 'Fan hub and simplified blades; real blade geometry varies.', { geometry: new THREE.CylinderGeometry(0.46, 0.46, 0.14, 24) });
      for (let blade = 0; blade < 5; blade++) {
        const angle = blade * Math.PI * 2 / 5;
        const fanBlade = this.part('Cooling fan', [-1.1 + i * 2.15 + Math.cos(angle) * 0.22, 0.51, Math.sin(angle) * 0.22], [0.42, 0.04, 0.1], 0x94a3b8, 'Simplified fan blade geometry.');
        fanBlade.rotation.y = -angle;
      }
    }
    this.part('Heatsink', [0, 0.55, 0], [4.1, 0.15, 1.45], 0x94a3b8, 'Metal heatsink transfers heat to airflow.', { material: { metalness: 0.72, roughness: 0.34 } });
    this.part('PCIe edge connector', [0, -0.19, 0.98], [2.75, 0.08, 0.18], 0xeab308, 'Edge connector mates with a compatible expansion slot.');
    this.part('Display outputs', [2.05, 0.05, -0.87], [0.66, 0.38, 0.22], 0x111827, 'Representative output port area; connector types and features are model-specific.');
    this.part('Auxiliary power socket', [-1.9, 0.2, -0.82], [0.55, 0.32, 0.24], 0x0f172a, 'Power input required by some graphics cards; use only the specified matching cable.');
  };

  HardwareLabEngine.prototype.build_cooling = function () {
    this.part('Cold plate', [0, 0.05, 0], [1.25, 0.22, 1.25], 0x94a3b8, 'Base contacts the processor heat spreader through appropriate interface material.', { material: { metalness: 0.86, roughness: 0.26 } });
    for (let i = 0; i < 4; i++) {
      const pipe = this.part('Heat pipes', [-0.42 + i * 0.28, 0.72, 0], [0.1, 1.3, 0.1], 0xb8c3d1, 'Simplified heat pipe transfers energy from base to fin stack.', { geometry: new THREE.CylinderGeometry(0.055, 0.055, 1.3, 10) });
      pipe.rotation.z = i % 2 ? -0.16 : 0.16;
    }
    for (let i = 0; i < 11; i++) this.part('Fin stack', [0, 1.15, -0.8 + i * 0.16], [1.55, 0.1, 0.06], 0x94a3b8, 'Thin fin increases surface area for heat exchange.', { material: { metalness: 0.72, roughness: 0.38 } });
    this.part('Cooling fan', [0, 1.28, 0], [1.35, 0.24, 1.35], 0x1e293b, 'Fan drives air through the heatsink.', { geometry: new THREE.CylinderGeometry(0.65, 0.65, 0.24, 24) });
    this.part('Fan header lead', [0.8, 0.28, 0.68], [0.82, 0.06, 0.06], 0x111827, 'Illustrative low-voltage fan lead to a compatible motherboard header.');
  };

  HardwareLabEngine.prototype.build_laptop = function () {
    this.part('Keyboard deck', [0, 0, 0.3], [4.6, 0.2, 2.9], 0x475569, 'Representative laptop base. Internal mounting and layout vary by model.');
    this.part('Display assembly', [0, 1.48, -1.15], [4.6, 2.75, 0.16], 0x1e293b, 'Display panel raised for teaching visibility.');
    this.part('Bottom enclosure', [0, -0.45, 0.3], [4.5, 0.14, 2.8], 0x64748b, 'Bottom cover shown separated from the body; actual service procedures are model-specific.');
    this.part('System board', [-0.85, 0.22, -0.15], [2.2, 0.14, 1.8], 0x166534, 'Compact laptop system board.');
    this.part('Battery pack', [0.55, 0.12, 1.15], [2.9, 0.2, 0.62], 0x334155, 'Rechargeable battery; do not bend, puncture or work on a damaged pack.');
    this.part('Cooling assembly', [-1.22, 0.45, -0.78], [1.05, 0.36, 0.78], 0x94a3b8, 'Simplified fan and heat-pipe assembly.');
    this.part('M.2 storage', [0.15, 0.32, -0.55], [1.25, 0.12, 0.35], 0x166534, 'Replaceable module in this example only; designs may solder storage.');
    this.part('SO-DIMM slot', [0.5, 0.33, 0.05], [1.15, 0.12, 0.45], 0x2563eb, 'Replaceable memory shown for this example; many laptops use soldered memory.');
    this.part('Wireless module', [1.25, 0.33, -0.45], [0.75, 0.1, 0.45], 0x64748b, 'Wireless module and antenna leads; implementation varies.');
  };

  HardwareLabEngine.prototype.build_mobile = function () {
    this.part('Display assembly', [0, 0.05, 0], [2.25, 0.18, 4.4], 0x1e293b, 'Front display/touch assembly shown above the internal components.');
    this.part('Battery', [0, -0.25, 0.15], [1.35, 0.25, 2.25], 0x334155, 'Rechargeable battery. Never puncture, heat, bend or attempt to remove a swollen cell.');
    this.part('Mainboard', [0.53, -0.15, -1.35], [0.78, 0.14, 1.45], 0x166534, 'Compact board containing the major processing and interface components.');
    this.part('System-on-chip', [0.53, -0.03, -1.18], [0.42, 0.1, 0.42], 0x475569, 'Integrated processor package; shown schematically.');
    this.part('Camera module', [0.7, -0.03, -1.88], [0.35, 0.12, 0.35], 0x111827, 'Camera sensor and optics.');
    this.part('Speaker module', [-0.58, -0.16, 1.78], [0.8, 0.12, 0.35], 0x64748b, 'Audio output transducer.');
    this.part('Charging connector', [0, -0.17, 2.18], [0.48, 0.25, 0.17], 0xcbd5e1, 'Charging/data connector; supported functions depend on the device.');
    this.part('Antenna assembly', [-0.82, -0.12, -1.4], [0.13, 0.08, 1.3], 0xeab308, 'Simplified antenna conductor.');
  };

  HardwareLabEngine.prototype.build_network = function () {
    this.part('Switch enclosure', [0, 0, 0], [5.8, 1.2, 2.2], 0x334155, 'Representative desktop network switch enclosure.');
    for (let i = 0; i < 8; i++) {
      this.part('Ethernet port', [-2.25 + i * 0.64, 0.18, 1.13], [0.42, 0.36, 0.12], 0x0b1220, 'Twisted-pair Ethernet port; link rate depends on every component in the path.');
      this.part('Status indicator', [-2.25 + i * 0.64, 0.48, 1.2], [0.1, 0.08, 0.04], 0x10b981, 'Illustrative link/activity indicator; product-specific meaning varies.', { material: { emissive: 0x064e3b } });
    }
    this.part('Uplink port', [2.45, 0.18, 1.13], [0.52, 0.36, 0.12], 0x0b1220, 'Representative uplink connector; actual speed and media depend on the model.');
    this.part('Power input', [-2.6, 0.12, -1.13], [0.42, 0.38, 0.12], 0x111827, 'Power inlet for the specified supply.');
  };

  HardwareLabEngine.prototype.build_ports = function () {
    const names = ['USB-A', 'USB-C', 'HDMI', 'DisplayPort', 'Ethernet RJ45', '3.5 mm audio', 'SATA data', 'Power plug'];
    names.forEach((name, index) => {
      const row = Math.floor(index / 4);
      const col = index % 4;
      const x = -3.3 + col * 2.2;
      const z = -1.45 + row * 2.2;
      this.part(name, [x, 0, z], [1.05, 0.26, 0.58], 0x475569, MODELS.ports.parts[name][0]);
      const insert = this.part(name, [x, 0.15, z + 0.32], [0.66, 0.12, 0.12], 0x0b1220, MODELS.ports.parts[name][0]);
      if (name === '3.5 mm audio') insert.geometry.dispose(), insert.geometry = new THREE.CylinderGeometry(0.17, 0.17, 0.12, 20), insert.rotation.x = Math.PI / 2;
    });
  };

  HardwareLabEngine.prototype.setCamera = function (view) {
    const views = {
      iso: { theta: Math.PI * 0.22, phi: 1.12 },
      front: { theta: 0, phi: Math.PI / 2 },
      top: { theta: 0, phi: 0.08 },
      side: { theta: Math.PI / 2, phi: Math.PI / 2 },
      reset: { theta: Math.PI * 0.22, phi: 1.12 }
    };
    const selected = views[view] || views.iso;
    if (view === 'reset') {
      this.restoreAssembly(false);
      this.parts.forEach((part) => {
        part.visible = true;
        if (part.material.emissive) part.material.emissive.copy(part.userData.hardwarePart.originalEmissive);
      });
      this.selected = null;
      this.hiddenSelected = false;
      this.updateInspector(null);
      this.updateActionButtons();
    }
    this.spherical.theta = selected.theta;
    this.spherical.phi = selected.phi;
    this.spherical.radius = view === 'reset' ? 9 : (this.modelId === 'desktop' || this.modelId === 'laptop' ? 10 : 8);
    this.target.set(0, 0.15, 0);
    this.updateCamera();
  };

  HardwareLabEngine.prototype.updateCamera = function () {
    if (!this.camera) return;
    const s = this.spherical;
    this.camera.position.set(
      this.target.x + s.radius * Math.sin(s.phi) * Math.sin(s.theta),
      this.target.y + s.radius * Math.cos(s.phi),
      this.target.z + s.radius * Math.sin(s.phi) * Math.cos(s.theta)
    );
    this.camera.lookAt(this.target);
  };

  HardwareLabEngine.prototype.bindInput = function () {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => {
      this.drag = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, moved: false, button: event.button };
      if (event.isTrusted) canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.drag) return;
      const dx = event.clientX - this.drag.lastX;
      const dy = event.clientY - this.drag.lastY;
      if (Math.abs(event.clientX - this.drag.x) + Math.abs(event.clientY - this.drag.y) > 4) this.drag.moved = true;
      if (this.drag.button === 2 || event.shiftKey) {
        const scale = this.spherical.radius * 0.0018;
        const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 0);
        const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrix, 1);
        this.target.addScaledVector(right, -dx * scale);
        this.target.addScaledVector(up, dy * scale);
      } else {
        this.spherical.theta -= dx * 0.008;
        this.spherical.phi = Math.max(0.08, Math.min(Math.PI - 0.08, this.spherical.phi + dy * 0.008));
      }
      this.drag.lastX = event.clientX;
      this.drag.lastY = event.clientY;
      this.updateCamera();
    });
    canvas.addEventListener('pointerup', (event) => {
      if (this.drag && !this.drag.moved && this.drag.button === 0) this.pick(event);
      this.drag = null;
    });
    canvas.addEventListener('pointercancel', () => { this.drag = null; });
    canvas.addEventListener('contextmenu', (event) => event.preventDefault());
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.spherical.radius = Math.max(2.8, Math.min(24, this.spherical.radius * (event.deltaY > 0 ? 1.1 : 0.91)));
      this.updateCamera();
    }, { passive: false });
  };

  HardwareLabEngine.prototype.pick = function (event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.parts.filter((part) => part.visible), false);
    const target = hits.find((hit) => !this.xrayMode || hit.object.userData.hardwarePart.role !== 'casing');
    if (target) this.selectPart(target.object);
  };

  HardwareLabEngine.prototype.selectPart = function (mesh) {
    if (this.selected && this.selected.material.emissive) {
      this.selected.material.emissive.copy(this.selected.userData.hardwarePart.originalEmissive);
    }
    this.selected = mesh;
    if (mesh.material.emissive) mesh.material.emissive.setHex(0x1d4ed8);
    this.hiddenSelected = false;
    mesh.getWorldPosition(this.target);
    this.spherical.radius = Math.min(this.spherical.radius, 6);
    this.updateCamera();
    this.updateInspector(mesh.userData.hardwarePart);
    this.updateActionButtons();
    this.setStatus(`Selected ${mesh.userData.hardwarePart.name}.`);
  };

  HardwareLabEngine.prototype.updateInspector = function (part) {
    const model = MODELS[this.modelId];
    const title = document.getElementById('hardware-part-name');
    const summary = document.getElementById('hardware-part-summary');
    const details = document.getElementById('hardware-part-details');
    if (!title || !summary || !details) return;
    if (!part) {
      title.textContent = model.title;
      summary.textContent = model.summary;
      details.replaceChildren();
      return;
    }
    title.textContent = part.name;
    summary.textContent = part.description || (model.parts[part.name] || ['Representative component.'])[0];
    details.replaceChildren();
    const specs = document.createElement('div');
    specs.className = 'hardware-spec-card';
    const label = document.createElement('span');
    label.className = 'hardware-section-label';
    label.textContent = 'MODEL NOTES';
    const value = document.createElement('p');
    value.textContent = part.specs || 'Representative educational geometry; dimensions and implementation vary by model.';
    specs.append(label, value);
    details.append(specs);
    if (part.relationship) {
      const relationship = document.createElement('div');
      relationship.className = 'hardware-spec-card hardware-relationship-card';
      const relationshipLabel = document.createElement('span');
      relationshipLabel.className = 'hardware-section-label';
      relationshipLabel.textContent = 'ASSEMBLY RELATIONSHIP';
      const relationshipValue = document.createElement('p');
      relationshipValue.textContent = part.relationship;
      relationship.append(relationshipLabel, relationshipValue);
      details.append(relationship);
    }
  };

  HardwareLabEngine.prototype.bindUi = function () {
    const select = document.getElementById('select-hardware-component');
    select?.addEventListener('change', () => this.loadModel(select.value));
    document.querySelectorAll('[data-hw-model]').forEach((button) => button.addEventListener('click', () => this.loadModel(button.dataset.hwModel)));
    document.querySelectorAll('[data-hw-view]').forEach((button) => button.addEventListener('click', () => this.setCamera(button.dataset.hwView)));
    document.querySelectorAll('[data-hw-action]').forEach((button) => button.addEventListener('click', () => this.handleAction(button.dataset.hwAction)));
    document.querySelector('[data-hw-load-sketchfab]')?.addEventListener('click', (event) => {
      const button = event.currentTarget;
      const frame = document.getElementById('hardware-sketchfab-reference');
      if (!frame || !frame.dataset.src) {
        this.setStatus('The external 3D reference is unavailable in this page.');
        return;
      }
      frame.src = frame.dataset.src;
      frame.hidden = false;
      button.disabled = true;
      button.textContent = 'Interactive model loaded';
      button.setAttribute('aria-expanded', 'true');
    });
    document.getElementById('hardware-xray-opacity')?.addEventListener('input', (event) => {
      this.xrayOpacity = Number(event.target.value) / 100;
      this.setXray(true);
    });
    document.getElementById('hardware-explosion-progress')?.addEventListener('input', (event) => {
      this.pauseExplosion();
      const progress = Number(event.target.value) / 100;
      if (progress > 0 && !this.explosionCameraState) this.prepareExplosionView();
      if (progress === 0) {
        this.restoreAssembly();
        return;
      }
      this.explosionProgress = progress;
      this.updateExplosionPose();
      this.updateExplosionControls();
      this.setStatus(`Exploded-view position: ${Math.round(this.explosionProgress * 100)}%.`);
    });
    document.querySelectorAll('[data-hw-panel]').forEach((button) => {
      button.addEventListener('click', () => this.switchPanel(button.dataset.hwPanel));
    });
    document.getElementById('hardware-scenario')?.addEventListener('change', () => this.renderDiagnosticOptions());
    this.renderAssemblySteps();
    this.renderDiagnosticOptions();
  };

  HardwareLabEngine.prototype.switchPanel = function (panel) {
    const assembly = panel === 'assembly';
    document.querySelectorAll('[data-hw-panel]').forEach((button) => {
      const active = button.dataset.hwPanel === panel;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
    });
    document.getElementById('hardware-assembly-panel').hidden = !assembly;
    document.getElementById('hardware-diagnostics-panel').hidden = assembly;
  };

  HardwareLabEngine.prototype.renderAssemblySteps = function () {
    const list = document.getElementById('hardware-assembly-steps');
    if (!list) return;
    list.replaceChildren();
    ASSEMBLY_STEPS.forEach((step, index) => {
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'hardware-step';
      button.dataset.step = String(index);
      button.setAttribute('aria-pressed', 'false');
      button.textContent = step;
      button.addEventListener('click', () => {
        const completed = this.assemblyComplete.has(index);
        if (completed) {
          for (const itemIndex of Array.from(this.assemblyComplete)) if (itemIndex >= index) this.assemblyComplete.delete(itemIndex);
        } else if (index === 0 || this.assemblyComplete.has(index - 1)) {
          this.assemblyComplete.add(index);
        } else {
          this.setPracticalResult('Complete the previous step first.', false);
        }
        this.renderAssemblySteps();
      });
      if (this.assemblyComplete.has(index)) {
        button.setAttribute('aria-pressed', 'true');
        button.classList.add('complete');
      }
      item.appendChild(button);
      list.appendChild(item);
    });
  };

  HardwareLabEngine.prototype.renderDiagnosticOptions = function () {
    const scenario = document.getElementById('hardware-scenario')?.value || 'no-display';
    const select = document.getElementById('hardware-diagnosis');
    if (!select) return;
    select.replaceChildren();
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose a check…';
    select.appendChild(placeholder);
    DIAGNOSTICS[scenario].options.forEach((option, index) => {
      const choice = document.createElement('option');
      choice.value = String(index);
      choice.textContent = option;
      select.appendChild(choice);
    });
    const result = document.getElementById('hardware-diagnostic-result');
    if (result) result.textContent = '';
  };

  HardwareLabEngine.prototype.handleAction = function (action) {
    if (action === 'explode') {
      if (this.explosionPlaying) this.pauseExplosion();
      else this.playExplosion();
    } else if (action === 'xray') {
      this.setXray(!this.xrayMode);
    } else if (action === 'explosion-play') {
      this.playExplosion();
    } else if (action === 'explosion-pause') {
      this.pauseExplosion();
    } else if (action === 'explosion-reverse') {
      this.reverseExplosion();
    } else if (action === 'explosion-restore') {
      this.restoreAssembly();
    } else if (action === 'toggle-selected') {
      if (!this.selected) return;
      this.selected.visible = !this.selected.visible;
      this.hiddenSelected = !this.selected.visible;
      this.updateActionButtons();
    } else if (action === 'fullscreen') {
      const lab = document.getElementById('cs-hardware-lab');
      if (!document.fullscreenElement) lab?.requestFullscreen?.().catch((error) => this.setStatus(`Fullscreen could not be opened: ${error.message}`));
      else document.exitFullscreen?.();
    } else if (action === 'check-build') {
      const stepsComplete = this.assemblyComplete.size === ASSEMBLY_STEPS.length;
      const cpuSocket = document.getElementById('hardware-cpu-socket')?.value;
      const boardSocket = document.getElementById('hardware-board-socket')?.value;
      const memory = document.getElementById('hardware-memory')?.value;
      const boardMemory = document.getElementById('hardware-board-memory')?.value;
      const psuWatts = Number(document.getElementById('hardware-psu-watts')?.value);
      const compatibility = [
        { label: 'CPU socket matches board', valid: cpuSocket === boardSocket },
        { label: 'Memory generation matches board', valid: memory === boardMemory },
        { label: 'Illustrative PSU budget is at least 550 W', valid: Number.isFinite(psuWatts) && psuWatts >= 550 }
      ];
      const compatible = compatibility.every((check) => check.valid);
      const checkText = compatibility.map((check) => `${check.valid ? 'PASS' : 'CHECK'}: ${check.label}`).join(' · ');
      const complete = stepsComplete && compatible;
      const status = stepsComplete ? checkText : `Complete all ${ASSEMBLY_STEPS.length} guided steps (${this.assemblyComplete.size}/${ASSEMBLY_STEPS.length}) · ${checkText}`;
      this.setPracticalResult(complete ? `Guided sequence complete. ${status} These simplified rules cover only this representative build, not all hardware compatibility requirements.` : status, complete);
    } else if (action === 'diagnose') {
      const scenario = document.getElementById('hardware-scenario')?.value || 'no-display';
      const selected = Number(document.getElementById('hardware-diagnosis')?.value);
      if (!Number.isInteger(selected)) {
        this.setDiagnosticResult('Choose a diagnostic check first.', false);
        return;
      }
      const diagnosis = DIAGNOSTICS[scenario];
      const correct = diagnosis.answers.includes(selected);
      this.setDiagnosticResult(`${correct ? 'Reasonable first check. ' : 'Consider another first check. '}${diagnosis.feedback}`, correct);
    }
  };

  HardwareLabEngine.prototype.setXray = function (enabled, updateStatus) {
    const supported = this.modelId === 'desktop';
    this.xrayMode = Boolean(enabled && supported);
    this.parts.forEach((part) => {
      const material = part.material;
      if (part.userData.hardwarePart.role !== 'casing') return;
      material.transparent = this.xrayMode;
      material.opacity = this.xrayMode ? this.xrayOpacity : 1;
      material.depthWrite = !this.xrayMode;
      material.needsUpdate = true;
    });
    const button = document.querySelector('[data-hw-action="xray"]');
    const slider = document.getElementById('hardware-xray-opacity');
    const value = document.getElementById('hardware-xray-opacity-value');
    if (button) {
      button.disabled = !supported;
      button.classList.toggle('active', this.xrayMode);
      button.setAttribute('aria-pressed', String(this.xrayMode));
      button.textContent = this.xrayMode ? 'X-ray on' : 'X-ray';
    }
    if (slider) {
      slider.disabled = !supported || !this.xrayMode;
      slider.value = String(Math.round(this.xrayOpacity * 100));
    }
    if (value) value.textContent = this.xrayMode ? `${Math.round(this.xrayOpacity * 100)}%` : 'off';
    if (updateStatus !== false && supported) {
      this.setStatus(this.xrayMode
        ? `X-ray mode on. Case opacity ${Math.round(this.xrayOpacity * 100)}%; internal components remain selectable.`
        : 'X-ray mode off. The case is opaque.');
    }
  };

  HardwareLabEngine.prototype.updateExplosionPose = function () {
    this.components.forEach((component) => {
      component.position.copy(component.userData.explodeOffset).multiplyScalar(this.explosionProgress);
    });
    this.exploded = this.explosionProgress > 0.001;
    const slider = document.getElementById('hardware-explosion-progress');
    if (slider) slider.value = String(Math.round(this.explosionProgress * 100));
  };

  HardwareLabEngine.prototype.updateExplosionControls = function () {
    const supported = this.modelId === 'desktop';
    const play = document.querySelector('[data-hw-action="explosion-play"]');
    const pause = document.querySelector('[data-hw-action="explosion-pause"]');
    const reverse = document.querySelector('[data-hw-action="explosion-reverse"]');
    const restore = document.querySelector('[data-hw-action="explosion-restore"]');
    const slider = document.getElementById('hardware-explosion-progress');
    const toggle = document.querySelector('[data-hw-action="explode"]');
    [play, pause, reverse, restore, slider, toggle].filter(Boolean).forEach((control) => {
      control.disabled = !supported;
    });
    if (pause) pause.disabled = !supported || !this.explosionPlaying;
    if (play) play.disabled = !supported || this.explosionPlaying || this.explosionProgress >= 1;
    if (reverse) reverse.disabled = !supported || this.explosionPlaying || this.explosionProgress <= 0;
    if (restore) restore.disabled = !supported || (!this.explosionPlaying && this.explosionProgress <= 0);
    if (toggle) {
      toggle.textContent = this.explosionPlaying ? 'Pause' : this.explosionProgress > 0 ? 'Continue' : 'Explode';
      toggle.classList.toggle('active', this.explosionPlaying || this.explosionProgress > 0);
      toggle.setAttribute('aria-pressed', String(this.explosionPlaying));
    }
  };

  HardwareLabEngine.prototype.playExplosion = function () {
    if (this.modelId !== 'desktop') return;
    if (this.explosionProgress >= 1) {
      this.setStatus('Assembly is fully exploded. Use Reverse or Restore to bring the components back.');
      return;
    }
    if (this.explosionProgress === 0) this.prepareExplosionView();
    this.explosionDirection = 1;
    this.explosionPlaying = true;
    this.lastFrameTime = 0;
    this.updateExplosionControls();
    this.setStatus('Playing the guided exploded view. Components follow their documented representative mounting relationships.');
  };

  HardwareLabEngine.prototype.pauseExplosion = function () {
    this.explosionPlaying = false;
    this.updateExplosionControls();
    if (this.modelId === 'desktop') this.setStatus(`Exploded-view animation paused at ${Math.round(this.explosionProgress * 100)}%.`);
  };

  HardwareLabEngine.prototype.reverseExplosion = function () {
    if (this.modelId !== 'desktop') return;
    if (this.explosionProgress <= 0) {
      this.prepareExplosionView();
      this.explosionProgress = 1;
      this.updateExplosionPose();
    }
    this.explosionDirection = -1;
    this.explosionPlaying = true;
    this.lastFrameTime = 0;
    this.updateExplosionControls();
    this.setStatus('Reversing the exploded view toward the assembled computer.');
  };

  HardwareLabEngine.prototype.restoreAssembly = function (announce) {
    this.explosionPlaying = false;
    this.explosionDirection = 1;
    this.explosionProgress = 0;
    this.updateExplosionPose();
    this.restoreExplosionView();
    this.updateExplosionControls();
    if (announce !== false && this.modelId === 'desktop') {
      this.setStatus('Computer restored to its original assembled component positions.');
    }
  };

  HardwareLabEngine.prototype.stopExplosion = function () {
    this.restoreAssembly(false);
  };

  HardwareLabEngine.prototype.prepareExplosionView = function () {
    if (!this.explosionCameraState) {
      this.explosionCameraState = {
        radius: this.spherical.radius,
        theta: this.spherical.theta,
        phi: this.spherical.phi,
        target: this.target.clone()
      };
    }
    this.spherical.radius = Math.max(this.spherical.radius, 18.5);
    this.target.set(0, 0.15, 0);
    this.updateCamera();
  };

  HardwareLabEngine.prototype.restoreExplosionView = function () {
    if (!this.explosionCameraState) return;
    this.spherical.radius = this.explosionCameraState.radius;
    this.spherical.theta = this.explosionCameraState.theta;
    this.spherical.phi = this.explosionCameraState.phi;
    this.target.copy(this.explosionCameraState.target);
    this.explosionCameraState = null;
    this.updateCamera();
  };

  HardwareLabEngine.prototype.updateActionButtons = function () {
    const button = document.querySelector('[data-hw-action="toggle-selected"]');
    if (button) {
      button.disabled = !this.selected;
      button.textContent = this.hiddenSelected ? 'Show selected' : 'Hide selected';
    }
    const supported = this.modelId === 'desktop';
    const xray = document.querySelector('[data-hw-action="xray"]');
    const opacity = document.getElementById('hardware-xray-opacity');
    if (xray) xray.disabled = !supported;
    if (opacity) opacity.disabled = !supported || !this.xrayMode;
    this.updateExplosionControls();
  };

  HardwareLabEngine.prototype.setPracticalResult = function (text, success) {
    const result = document.getElementById('hardware-practical-result');
    if (!result) return;
    result.textContent = text;
    result.className = `hardware-practical-result ${success ? 'success' : 'notice'}`;
  };

  HardwareLabEngine.prototype.setDiagnosticResult = function (text, success) {
    const result = document.getElementById('hardware-diagnostic-result');
    if (!result) return;
    result.textContent = text;
    result.className = `hardware-practical-result ${success ? 'success' : 'notice'}`;
  };

  HardwareLabEngine.prototype.setStatus = function (text) {
    const status = document.getElementById('hardware-stage-status');
    if (status) status.textContent = text;
  };

  HardwareLabEngine.prototype.resize = function () {
    if (!this.renderer || !this.container) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  HardwareLabEngine.prototype.animate = function () {
    const render = () => {
      this.animationId = root.requestAnimationFrame(render);
      if (!this.renderer || !this.scene || !this.camera) return;
      const lab = document.getElementById('cs-hardware-lab');
      if (!document.hidden && lab && lab.getBoundingClientRect().width > 0 && lab.getBoundingClientRect().height > 0) {
        const now = performance.now();
        if (this.explosionPlaying) {
          const elapsed = this.lastFrameTime ? Math.min((now - this.lastFrameTime) / 1000, 0.05) : 0;
          this.explosionProgress = Math.max(0, Math.min(1, this.explosionProgress + elapsed * this.explosionDirection / 2.2));
          this.lastFrameTime = now;
          this.updateExplosionPose();
          const animationComplete = this.explosionDirection > 0
            ? this.explosionProgress >= 1
            : this.explosionProgress <= 0;
          if (animationComplete) {
            this.explosionPlaying = false;
            this.updateExplosionControls();
            if (this.explosionProgress === 0) {
              this.restoreExplosionView();
              this.setStatus('Reverse animation complete. Components are back in their assembled positions.');
            } else {
              this.setStatus('Exploded view complete. Components remain selectable and the full assembly can be rotated.');
            }
          }
        }
        this.renderer.render(this.scene, this.camera);
      }
    };
    render();
  };

  HardwareLabEngine.prototype.dispose = function () {
    if (this.animationId) root.cancelAnimationFrame(this.animationId);
    this.resizeObserver?.disconnect();
    if (this.renderer) {
      this.disposeModel();
      this.scene?.traverse((node) => {
        node.geometry?.dispose();
        const materials = Array.isArray(node.material) ? node.material : [node.material];
        materials.filter(Boolean).forEach((material) => {
          material.map?.dispose();
          material.dispose();
        });
      });
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
  };

  root.HardwareLabEngine = {
    create: (containerId) => new HardwareLabEngine(containerId),
    models: Object.keys(MODELS)
  };
})(window);
