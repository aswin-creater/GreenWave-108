import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Ambulance, ConstructionZone, Intersection, Vehicle } from '../types';
import { CITY_3D_LAYOUTS, getCurvePosition } from '../simulation/cityPaths';
import {
  Camera,
  AlertTriangle,
  Zap,
  Maximize2,
  Minimize2,
  Navigation,
  Compass,
  Repeat,
  Sparkles,
  Infinity as InfinityIcon,
  Activity,
  CheckCircle,
} from 'lucide-react';

interface ThreeCityRoad3DProps {
  scenarioId: string;
  ambulance: Ambulance;
  intersections: Intersection[];
  vehicles: Vehicle[];
  runType: 'BASELINE' | 'PRIORITY';
  constructionZone: ConstructionZone;
  onToggleConstruction: () => void;
  onManualOverride: (intersectionId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isInfiniteMode?: boolean;
  onToggleInfiniteMode?: () => void;
  infiniteLaps?: number;
  totalDistanceKm?: number;
}

export const ThreeCityRoad3D: React.FC<ThreeCityRoad3DProps> = ({
  scenarioId,
  ambulance,
  intersections,
  vehicles,
  runType,
  constructionZone,
  onToggleConstruction,
  onManualOverride,
  isCollapsed,
  onToggleCollapse,
  isInfiniteMode = true,
  onToggleInfiniteMode,
  infiniteLaps = 1,
  totalDistanceKm = 2.4,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [cameraMode, setCameraMode] = useState<'STREET_VIEW' | 'OVERVIEW' | 'CHASE' | 'TOP_DOWN'>('STREET_VIEW');

  // Three.js Core Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Dynamic Object Groups
  const ambulanceGroupRef = useRef<THREE.Group | null>(null);
  const vehiclesMapRef = useRef<Map<string, THREE.Group>>(new Map());
  const signalsMapRef = useRef<Map<string, { redMesh: THREE.Mesh; amberMesh: THREE.Mesh; greenMesh: THREE.Mesh }>>(new Map());
  const constructionGroupRef = useRef<THREE.Group | null>(null);
  const greenWaveMeshRef = useRef<THREE.Mesh | null>(null);
  const strobeLightRedRef = useRef<THREE.PointLight | null>(null);
  const strobeLightBlueRef = useRef<THREE.PointLight | null>(null);

  // State sync ref for render loop
  const stateRef = useRef({
    ambulance,
    intersections,
    vehicles,
    runType,
    cameraMode,
    scenarioId,
    constructionZone,
    isInfiniteMode,
    infiniteLaps,
    totalDistanceKm,
  });

  useEffect(() => {
    stateRef.current = {
      ambulance,
      intersections,
      vehicles,
      runType,
      cameraMode,
      scenarioId,
      constructionZone,
      isInfiniteMode,
      infiniteLaps,
      totalDistanceKm,
    };
  }, [ambulance, intersections, vehicles, runType, cameraMode, scenarioId, constructionZone, isInfiniteMode, infiniteLaps, totalDistanceKm]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Detect software WebGL as per Three.js skill
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.0018);

    const width = container.clientWidth || 960;
    const height = 520;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 1400);
    cameraRef.current = camera;
    camera.position.set(0, 35, 100);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    rendererRef.current = renderer;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.target.set(0, 5, 0);

    // 2. Procedural Lighting & Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const ambientLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.75);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0xe0f2fe, 1.8);
    moonLight.position.set(120, 220, 100);
    moonLight.castShadow = !isSoftwareGl;
    if (!isSoftwareGl) {
      moonLight.shadow.mapSize.width = 1024;
      moonLight.shadow.mapSize.height = 1024;
      moonLight.shadow.camera.near = 10;
      moonLight.shadow.camera.far = 600;
      moonLight.shadow.camera.left = -300;
      moonLight.shadow.camera.right = 300;
      moonLight.shadow.camera.top = 300;
      moonLight.shadow.camera.bottom = -300;
      moonLight.shadow.bias = -0.0004;
    }
    scene.add(moonLight);

    // 3. Ground Terrain & Endless City Grid
    const groundGeo = new THREE.PlaneGeometry(2000, 1600);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090e17,
      roughness: 0.95,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    const grid = new THREE.GridHelper(1600, 80, 0x1e293b, 0x090e17);
    grid.position.y = 0.02;
    scene.add(grid);

    // 4. Procedural Window Grid Texture for Urban High-Rises
    const createBuildingTexture = (baseColor: string, litRatio: number = 0.45) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, 128, 256);

      // Draw window matrix
      for (let y = 10; y < 240; y += 18) {
        for (let x = 10; x < 120; x += 16) {
          const isLit = Math.random() < litRatio;
          ctx.fillStyle = isLit ? (Math.random() > 0.4 ? '#fef08a' : '#38bdf8') : '#1e293b';
          ctx.fillRect(x, y, 9, 11);
        }
      }
      const tex = new THREE.CanvasTexture(canvas);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(2, 4);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    };

    const commTexture = createBuildingTexture('#0b1322', 0.5);
    const residentialTexture = createBuildingTexture('#111827', 0.35);

    // 5. BUILD INFINITE CLOSED-LOOP ROADWAY NETWORK
    const layout = CITY_3D_LAYOUTS[scenarioId] || CITY_3D_LAYOUTS.BLR_MG_ROAD;
    const roadNetworkGroup = new THREE.Group();
    scene.add(roadNetworkGroup);

    const roadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.2,
    });

    // (A) Grand Infinite Continuous Road Curve (closed: true)
    const curvePoints = layout.roadCurvePoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
    const mainCurve = new THREE.CatmullRomCurve3(curvePoints, true, 'catmullrom', 0.5);
    
    // Main Asphalt Tube / Ribbon
    const mainRoadGeo = new THREE.TubeGeometry(mainCurve, 160, 15, 4, true);
    const posA = mainRoadGeo.attributes.position;
    for (let i = 0; i < posA.count; i++) {
      posA.setY(i, posA.getY(i) * 0.08 + 0.22);
    }
    mainRoadGeo.computeVertexNormals();
    const mainRoadMesh = new THREE.Mesh(mainRoadGeo, roadMat);
    mainRoadMesh.receiveShadow = !isSoftwareGl;
    roadNetworkGroup.add(mainRoadMesh);

    // Continuous Center Double Yellow Lines (closed: true)
    const lineGeo = new THREE.TubeGeometry(mainCurve, 160, 0.45, 3, true);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    const centerLine = new THREE.Mesh(lineGeo, lineMat);
    centerLine.position.y += 0.35;
    roadNetworkGroup.add(centerLine);

    // (B) Skyway Support Concrete Pillars for Elevated Highway Sections
    curvePoints.forEach((p) => {
      if (p.y > 2.0) {
        const pillarGeo = new THREE.CylinderGeometry(1.8, 2.2, p.y + 0.6, 12);
        const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.set(p.x, (p.y + 0.6) / 2, p.z);
        pillar.castShadow = !isSoftwareGl;
        roadNetworkGroup.add(pillar);

        // Cross beam support
        const beamGeo = new THREE.BoxGeometry(22, 1.4, 4);
        const beam = new THREE.Mesh(beamGeo, pillarMat);
        beam.position.set(p.x, p.y, p.z);
        roadNetworkGroup.add(beam);
      }
    });

    // (C) Spaced Streetlights Along the Entire Infinite Road Circuit
    for (let t = 0; t < 1; t += 0.05) {
      const sample = getCurvePosition(layout.roadCurvePoints, t, true);
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.4, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
      );
      // Offset to outer shoulder
      const sideX = sample.position.x - sample.tangent.z * 18;
      const sideZ = sample.position.z + sample.tangent.x * 18;
      post.position.set(sideX, sample.position.y + 5, sideZ);
      roadNetworkGroup.add(post);

      // Glowing LED Streetlight Lantern
      const lantern = new THREE.Mesh(
        new THREE.SphereGeometry(0.65, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfef08a })
      );
      lantern.position.set(sideX, sample.position.y + 10, sideZ);
      roadNetworkGroup.add(lantern);
    }

    // (D) Connecting Cross-Street Roads & Slip Avenues
    layout.intersections.forEach((int, idx) => {
      const crossRoadGeo = new THREE.BoxGeometry(26, 0.35, 140);
      const crossRoad = new THREE.Mesh(crossRoadGeo, roadMat);
      crossRoad.position.set(int.position.x, 0.18, int.position.z);
      roadNetworkGroup.add(crossRoad);

      const crossDashGeo = new THREE.BoxGeometry(0.6, 0.4, 136);
      const crossDash = new THREE.Mesh(crossDashGeo, new THREE.MeshBasicMaterial({ color: 0x94a3b8 }));
      crossDash.position.set(int.position.x, 0.22, int.position.z);
      roadNetworkGroup.add(crossDash);

      // Connecting Curved Slip Road Ramp feeding onto arterial corridor
      if (idx === 1 || idx === 3) {
        const slipPoints = [
          new THREE.Vector3(int.position.x - 32, 0, int.position.z - 45),
          new THREE.Vector3(int.position.x - 16, 0, int.position.z - 25),
          new THREE.Vector3(int.position.x + 10, 0, int.position.z - 5),
        ];
        const slipCurve = new THREE.CatmullRomCurve3(slipPoints);
        const slipGeo = new THREE.TubeGeometry(slipCurve, 20, 6, 3, false);
        const posS = slipGeo.attributes.position;
        for (let j = 0; j < posS.count; j++) {
          posS.setY(j, posS.getY(j) * 0.08 + 0.22);
        }
        slipGeo.computeVertexNormals();
        const slipMesh = new THREE.Mesh(slipGeo, roadMat);
        roadNetworkGroup.add(slipMesh);
      }
    });

    // (E) Dedicated U-Turn Bay Loop
    if (layout.uTurnPoints && layout.uTurnPoints.length > 2) {
      const uTurnVecs = layout.uTurnPoints.map((p) => new THREE.Vector3(p.x, p.y, p.z));
      const uTurnCurve = new THREE.CatmullRomCurve3(uTurnVecs);
      const uTurnGeo = new THREE.TubeGeometry(uTurnCurve, 32, 7.5, 3, false);
      const posU = uTurnGeo.attributes.position;
      for (let i = 0; i < posU.count; i++) {
        posU.setY(i, posU.getY(i) * 0.08 + 0.24);
      }
      uTurnGeo.computeVertexNormals();
      const uTurnMesh = new THREE.Mesh(uTurnGeo, roadMat);
      roadNetworkGroup.add(uTurnMesh);

      // U-turn signpost
      const signPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 9),
        new THREE.MeshStandardMaterial({ color: 0x64748b })
      );
      signPost.position.set(layout.uTurnPoints[1].x, 4.5, layout.uTurnPoints[1].z);
      roadNetworkGroup.add(signPost);

      const signDisc = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 0.3, 16),
        new THREE.MeshStandardMaterial({ color: 0x0284c7 })
      );
      signDisc.rotation.x = Math.PI / 2;
      signDisc.position.set(layout.uTurnPoints[1].x, 8.5, layout.uTurnPoints[1].z);
      roadNetworkGroup.add(signDisc);
    }

    // 6. REAL-WORLD BUILDINGS & ARCHITECTURAL ELEMENTS
    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);

    layout.buildings.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.x, 0, b.z);

      const isHospital = b.type === 'HOSPITAL';
      const isMetro = b.type === 'METRO';

      // Primary Structure
      const bMat = isHospital
        ? new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.3, metalness: 0.2 })
        : new THREE.MeshStandardMaterial({
            color: new THREE.Color(b.color),
            roughness: 0.4,
            metalness: 0.2,
            map: b.type === 'COMMERCIAL' ? commTexture : residentialTexture,
          });

      const bMesh = new THREE.Mesh(new THREE.BoxGeometry(b.width, b.height, b.depth), bMat);
      bMesh.position.y = b.height / 2;
      bMesh.castShadow = !isSoftwareGl;
      bMesh.receiveShadow = !isSoftwareGl;
      bGroup.add(bMesh);

      // Rooftop Infrastructure (HVAC units, Elevator Penthouses, Antennae)
      const hvacGeo = new THREE.BoxGeometry(b.width * 0.3, 3.5, b.depth * 0.25);
      const hvacMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const hvac = new THREE.Mesh(hvacGeo, hvacMat);
      hvac.position.set(0, b.height + 1.75, 0);
      bGroup.add(hvac);

      // Communication Mast / Beacon
      const antennaGeo = new THREE.CylinderGeometry(0.3, 0.5, 12, 6);
      const antennaMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
      const antenna = new THREE.Mesh(antennaGeo, antennaMat);
      antenna.position.set(b.width * 0.3, b.height + 6, b.depth * 0.25);
      bGroup.add(antenna);

      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 6), beaconMat);
      beacon.position.set(b.width * 0.3, b.height + 12.2, b.depth * 0.25);
      bGroup.add(beacon);

      // Special Destination Hospital: Illuminated Emergency Cross & Rooftop Helipad
      if (isHospital) {
        // Red Cross On Hospital Facade
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, 0.4), crossMat);
        crossH.position.set(0, b.height * 0.75, b.depth / 2 + 0.3);
        bGroup.add(crossH);

        const crossV = new THREE.Mesh(new THREE.BoxGeometry(2.4, 8, 0.4), crossMat);
        crossV.position.set(0, b.height * 0.75, b.depth / 2 + 0.3);
        bGroup.add(crossV);

        // Rooftop Helipad Circle & Letter H
        const heliCircle = new THREE.Mesh(
          new THREE.RingGeometry(8, 9.5, 24),
          new THREE.MeshBasicMaterial({ color: 0xfef08a, side: THREE.DoubleSide })
        );
        heliCircle.rotation.x = -Math.PI / 2;
        heliCircle.position.set(0, b.height + 0.1, 0);
        bGroup.add(heliCircle);

        const heliH = new THREE.Mesh(
          new THREE.BoxGeometry(6, 0.1, 1.6),
          new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        heliH.position.set(0, b.height + 0.12, 0);
        bGroup.add(heliH);
      }

      // Metro Station Track Viaduct & Glass Canopy
      if (isMetro) {
        const viaduct = new THREE.Mesh(
          new THREE.BoxGeometry(b.width * 1.4, 4, 12),
          new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.2 })
        );
        viaduct.position.set(0, 16, b.depth / 2 + 8);
        bGroup.add(viaduct);
      }

      buildingsGroup.add(bGroup);
    });

    // 7. Dynamic 3D Overhead Signal Gantries with Glowing LEDs
    const signalsGroup = new THREE.Group();
    scene.add(signalsGroup);

    layout.intersections.forEach((int) => {
      const gantryGroup = new THREE.Group();
      gantryGroup.position.set(int.position.x, 0, int.position.z);

      const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const pLeft = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 16, 8), postMat);
      pLeft.position.set(-14, 8, 0);
      gantryGroup.add(pLeft);

      const pRight = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 16, 8), postMat);
      pRight.position.set(14, 8, 0);
      gantryGroup.add(pRight);

      const truss = new THREE.Mesh(new THREE.BoxGeometry(29, 0.9, 0.9), postMat);
      truss.position.set(0, 15.5, 0);
      gantryGroup.add(truss);

      // Signal Head Box
      const headBox = new THREE.Mesh(
        new THREE.BoxGeometry(2.4, 6.2, 1.4),
        new THREE.MeshStandardMaterial({ color: 0x0f172a })
      );
      headBox.position.set(0, 12.8, 0);
      gantryGroup.add(headBox);

      // Signal Lenses (Red, Amber, Green)
      const lensGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.25, 16);
      lensGeo.rotateX(Math.PI / 2);

      const redMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const redMesh = new THREE.Mesh(lensGeo, redMat);
      redMesh.position.set(0, 14.6, 0.7);
      gantryGroup.add(redMesh);

      const amberMat = new THREE.MeshBasicMaterial({ color: 0x78350f });
      const amberMesh = new THREE.Mesh(lensGeo, amberMat);
      amberMesh.position.set(0, 12.8, 0.7);
      gantryGroup.add(amberMesh);

      const greenMat = new THREE.MeshBasicMaterial({ color: 0x064e3b });
      const greenMesh = new THREE.Mesh(lensGeo, greenMat);
      greenMesh.position.set(0, 11.0, 0.7);
      gantryGroup.add(greenMesh);

      signalsMapRef.current.set(int.id, { redMesh, amberMesh, greenMesh });
      signalsGroup.add(gantryGroup);
    });

    // 8. Road Construction Detour Site (Barriers, Cones, Flashing Beacon)
    const constrGroup = new THREE.Group();
    constructionGroupRef.current = constrGroup;
    scene.add(constrGroup);

    for (let i = -2; i <= 2; i++) {
      const barrier = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 2.2, 1.2),
        new THREE.MeshStandardMaterial({ color: i % 2 === 0 ? 0xf59e0b : 0xffffff })
      );
      barrier.position.set(i * 5.2, 1.1, 0);
      constrGroup.add(barrier);

      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.65, 2.8, 12),
        new THREE.MeshStandardMaterial({ color: 0xea580c })
      );
      cone.position.set(i * 5.4, 1.4, 2.8);
      constrGroup.add(cone);
    }
    const beaconLight = new THREE.PointLight(0xf59e0b, 3, 40);
    beaconLight.position.set(0, 6, 0);
    constrGroup.add(beaconLight);

    // 9. REAL-WORLD PROCEDURAL 3D AMBULANCE (Force Traveller 108)
    const ambulanceGroup = new THREE.Group();
    ambulanceGroupRef.current = ambulanceGroup;
    scene.add(ambulanceGroup);

    // Base Chassis
    const vanBody = new THREE.Mesh(
      new THREE.BoxGeometry(13, 5.2, 5.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.3 })
    );
    vanBody.position.y = 3.2;
    ambulanceGroup.add(vanBody);

    // Medical High-Top Roof
    const roofExt = new THREE.Mesh(
      new THREE.BoxGeometry(9.5, 1.8, 4.8),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 })
    );
    roofExt.position.set(-1.2, 6.3, 0);
    ambulanceGroup.add(roofExt);

    // Red Medical Livery Stripe
    const redStripe = new THREE.Mesh(
      new THREE.BoxGeometry(13.1, 1.4, 5.25),
      new THREE.MeshBasicMaterial({ color: 0xdc2626 })
    );
    redStripe.position.y = 3.0;
    ambulanceGroup.add(redStripe);

    // Red Crosses on Both Sides
    [-2.65, 2.65].forEach((zSide) => {
      const crH = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.7, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      crH.position.set(-1, 4.5, zSide);
      ambulanceGroup.add(crH);
      const crV = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.4, 0.1), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      crV.position.set(-1, 4.5, zSide);
      ambulanceGroup.add(crV);
    });

    // Windshield
    const frontWindshield = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.2, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 })
    );
    frontWindshield.position.set(4.6, 4.0, 0);
    ambulanceGroup.add(frontWindshield);

    // Dual Front Headlights
    const headlampGeo = new THREE.SphereGeometry(0.6, 8, 8);
    const headlampMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    [-1.8, 1.8].forEach((z) => {
      const hl = new THREE.Mesh(headlampGeo, headlampMat);
      hl.position.set(6.6, 2.5, z);
      ambulanceGroup.add(hl);
    });

    // Wheels
    const tireGeo = new THREE.CylinderGeometry(1.4, 1.4, 1.1, 16);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.9 });
    const hubcapGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.15, 12);
    const hubcapMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 });

    [
      { x: 3.8, z: 2.6 },
      { x: 3.8, z: -2.6 },
      { x: -3.8, z: 2.6 },
      { x: -3.8, z: -2.6 },
    ].forEach((w) => {
      const wheel = new THREE.Group();
      wheel.position.set(w.x, 1.4, w.z);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.x = Math.PI / 2;
      wheel.add(tire);
      const hub = new THREE.Mesh(hubcapGeo, hubcapMat);
      hub.rotation.x = Math.PI / 2;
      wheel.add(hub);
      ambulanceGroup.add(wheel);
    });

    // Emergency Roof Strobe Lightbar (Dual Red & Blue PointLights)
    const strobeBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.8, 4.2),
      new THREE.MeshStandardMaterial({ color: 0x1e293b })
    );
    strobeBar.position.set(0.6, 7.5, 0);
    ambulanceGroup.add(strobeBar);

    const redLens = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    redLens.position.set(0.6, 7.5, 1.2);
    ambulanceGroup.add(redLens);

    const blueLens = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.6, 1.8), new THREE.MeshBasicMaterial({ color: 0x3b82f6 }));
    blueLens.position.set(0.6, 7.5, -1.2);
    ambulanceGroup.add(blueLens);

    const pLightRed = new THREE.PointLight(0xef4444, 2.5, 30);
    pLightRed.position.set(0.6, 8, 1.2);
    ambulanceGroup.add(pLightRed);
    strobeLightRedRef.current = pLightRed;

    const pLightBlue = new THREE.PointLight(0x3b82f6, 2.5, 30);
    pLightBlue.position.set(0.6, 8, -1.2);
    ambulanceGroup.add(pLightBlue);
    strobeLightBlueRef.current = pLightBlue;

    // Green Wave Projection Corridor Ahead
    const waveGeo = new THREE.PlaneGeometry(85, 18);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
    });
    const waveMesh = new THREE.Mesh(waveGeo, waveMat);
    waveMesh.rotation.x = -Math.PI / 2;
    waveMesh.position.set(45, 0.3, 0);
    greenWaveMeshRef.current = waveMesh;
    ambulanceGroup.add(waveMesh);

    // 10. Multi-Vehicle Group
    const vehiclesGroup = new THREE.Group();
    scene.add(vehiclesGroup);

    // 11. ANIMATION & PACING LOOP
    let frameId = 0;
    const clock = new THREE.Clock();
    let continuousProgress = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 60);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const dt = clock.getDelta();
      const state = stateRef.current;
      const activeLayout = CITY_3D_LAYOUTS[state.scenarioId] || CITY_3D_LAYOUTS.BLR_MG_ROAD;

      // CONTINUOUS INFINITE ROADWAY TRAVERSAL
      // Rate of movement along closed spline loop
      const speedKmph = Math.max(10, state.ambulance.speedKmph || 50);
      const speedMetersPerSec = (speedKmph * 1000) / 3600;
      // Loop length scale: 1 loop is approx 1200 meters
      const deltaT = (speedMetersPerSec * dt) / 950;
      continuousProgress = (continuousProgress + deltaT) % 1.0;

      // In Infinite Mode, continuousProgress drives the endless lap
      // In Single Mode, mapped from progressPercent
      const t = state.isInfiniteMode
        ? continuousProgress
        : Math.max(0, Math.min(1, state.ambulance.progressPercent / 100));

      const curveSample = getCurvePosition(activeLayout.roadCurvePoints, t, true);
      let ambX = curveSample.position.x;
      let ambY = curveSample.position.y;
      let ambZ = curveSample.position.z;

      // Construction Detour deviation
      if (state.constructionZone.active && t > 0.08 && t < 0.22) {
        ambZ += Math.sin(((t - 0.08) * Math.PI) / 0.14) * 15;
      }

      if (ambulanceGroupRef.current) {
        ambulanceGroupRef.current.position.set(ambX, ambY, ambZ);
        const ambHeading = Math.atan2(curveSample.tangent.z, curveSample.tangent.x);
        ambulanceGroupRef.current.rotation.y = -ambHeading;

        // Alternating Strobe Light Beacons
        const strobeTime = clock.getElapsedTime() * 12;
        const strobePhase = Math.sin(strobeTime) > 0;
        if (strobeLightRedRef.current) strobeLightRedRef.current.intensity = strobePhase ? 4.0 : 0.1;
        if (strobeLightBlueRef.current) strobeLightBlueRef.current.intensity = !strobePhase ? 4.0 : 0.1;

        if (greenWaveMeshRef.current) {
          greenWaveMeshRef.current.visible = state.runType === 'PRIORITY' && state.ambulance.urgency === 'CRITICAL';
        }

        // CAMERA PERSPECTIVE LOGIC
        if (state.cameraMode === 'STREET_VIEW' && cameraRef.current) {
          // CRITICAL: Hide the entire ambulance exterior when in Street View so no red stripe or chassis clips into cockpit view!
          ambulanceGroupRef.current.visible = false;

          const fwdX = curveSample.tangent.x;
          const fwdY = curveSample.tangent.y;
          const fwdZ = curveSample.tangent.z;

          // Eye height: 3.6m above road surface
          const eyeHeight = 3.6;
          const camX = ambX + fwdX * 2.5;
          const camY = ambY + eyeHeight + fwdY * 2.5;
          const camZ = ambZ + fwdZ * 2.5;

          cameraRef.current.position.set(camX, camY, camZ);

          const lookDist = 75;
          const lookX = camX + fwdX * lookDist;
          const lookY = camY + fwdY * lookDist - 1.2;
          const lookZ = camZ + fwdZ * lookDist;
          controls.target.set(lookX, lookY, lookZ);
        } else {
          // In Chase, Overview, and Top-Down modes, ambulance is fully visible!
          ambulanceGroupRef.current.visible = true;

          const fwdX = curveSample.tangent.x;
          const fwdZ = curveSample.tangent.z;

          if (state.cameraMode === 'CHASE' && cameraRef.current) {
            // Chase camera smoothly gliding behind the emergency vehicle
            const chaseDist = 42;
            const chaseHeight = 18;
            const targetCamX = ambX - fwdX * chaseDist;
            const targetCamY = ambY + chaseHeight;
            const targetCamZ = ambZ - fwdZ * chaseDist;

            cameraRef.current.position.lerp(new THREE.Vector3(targetCamX, targetCamY, targetCamZ), 0.12);
            controls.target.lerp(new THREE.Vector3(ambX + fwdX * 25, ambY + 4, ambZ + fwdZ * 25), 0.12);
          } else if (state.cameraMode === 'OVERVIEW' && cameraRef.current) {
            // Grand illuminated infinite loop aerial overview
            cameraRef.current.position.lerp(new THREE.Vector3(70, 180, 240), 0.05);
            controls.target.lerp(new THREE.Vector3(60, 15, 30), 0.05);
          } else if (state.cameraMode === 'TOP_DOWN' && cameraRef.current) {
            // Direct drone map view from above
            cameraRef.current.position.set(60, 360, 40);
            controls.target.set(60, 0, 40);
          }
        }
      }

      // Update Overhead Signal Gantries with Simulated Phase Colors
      signalsMapRef.current.forEach((heads, intId) => {
        const intState = state.intersections.find((i) => i.id === intId);
        if (!intState) return;

        (heads.redMesh.material as THREE.MeshBasicMaterial).color.setHex(
          intState.corridorLightColor === 'RED' ? 0xef4444 : 0x450a0a
        );
        (heads.amberMesh.material as THREE.MeshBasicMaterial).color.setHex(
          intState.corridorLightColor === 'AMBER' ? 0xf59e0b : 0x451a03
        );
        (heads.greenMesh.material as THREE.MeshBasicMaterial).color.setHex(
          intState.corridorLightColor === 'GREEN' ? 0x10b981 : 0x022c22
        );
      });

      // Construction Barricades Position & Flashing Beacon
      if (constructionGroupRef.current) {
        constructionGroupRef.current.visible = state.constructionZone.active;
        if (state.constructionZone.active) {
          constructionGroupRef.current.position.set(state.constructionZone.x, 0, state.constructionZone.z);
          beaconLight.intensity = Math.sin(clock.getElapsedTime() * 10) > 0 ? 4 : 0.2;
        }
      }

      // Real-World Fleet (Bajaj Auto-Rickshaws, Ashok Leyland Buses, Cars, Bikes)
      const activeIds = new Set<string>();
      state.vehicles.forEach((v) => {
        activeIds.add(v.id);
        let vGroup = vehiclesMapRef.current.get(v.id);

        if (!vGroup) {
          const targetGroup = new THREE.Group();
          const isAuto = v.type === 'AUTO_RICKSHAW';
          const isBus = v.type === 'BUS';
          const isBike = v.type === 'MOTORBIKE';

          if (isAuto) {
            // BAJAJ RE AUTO-RICKSHAW (Iconic 3-Wheeler)
            const cabin = new THREE.Mesh(
              new THREE.BoxGeometry(4.8, 3.4, 3.2),
              new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.3 })
            );
            cabin.position.y = 2.4;
            targetGroup.add(cabin);

            const greenBase = new THREE.Mesh(
              new THREE.BoxGeometry(4.85, 1.2, 3.25),
              new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 })
            );
            greenBase.position.y = 1.3;
            targetGroup.add(greenBase);

            const canvasRoof = new THREE.Mesh(
              new THREE.BoxGeometry(4.6, 1.2, 3.1),
              new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 })
            );
            canvasRoof.position.set(-0.2, 4.3, 0);
            targetGroup.add(canvasRoof);

            const autoTire = new THREE.CylinderGeometry(0.9, 0.9, 0.6, 12);
            const autoTireMat = new THREE.MeshStandardMaterial({ color: 0x090d16 });

            const frontW = new THREE.Mesh(autoTire, autoTireMat);
            frontW.rotation.x = Math.PI / 2;
            frontW.position.set(2.4, 0.9, 0);
            targetGroup.add(frontW);

            [-1.4, 1.4].forEach((rz) => {
              const rearW = new THREE.Mesh(autoTire, autoTireMat);
              rearW.rotation.x = Math.PI / 2;
              rearW.position.set(-1.8, 0.9, rz);
              targetGroup.add(rearW);
            });

            const autoLight = new THREE.Mesh(new THREE.SphereGeometry(0.4, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
            autoLight.position.set(2.6, 2.2, 0);
            targetGroup.add(autoLight);
          } else if (isBus) {
            // BMTC / BEST ASHOK LEYLAND CITY TRANSIT BUS
            const busChassis = new THREE.Mesh(
              new THREE.BoxGeometry(18, 5.6, 4.6),
              new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.3, metalness: 0.2 })
            );
            busChassis.position.y = 3.6;
            targetGroup.add(busChassis);

            const ledBoard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 3.8), new THREE.MeshBasicMaterial({ color: 0x0284c7 }));
            ledBoard.position.set(9.1, 5.4, 0);
            targetGroup.add(ledBoard);

            const windowStrip = new THREE.Mesh(
              new THREE.BoxGeometry(17.2, 1.6, 4.7),
              new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 })
            );
            windowStrip.position.y = 4.4;
            targetGroup.add(windowStrip);

            const busTireGeo = new THREE.CylinderGeometry(1.3, 1.3, 0.9, 14);
            const busTireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });
            [-6, 0, 6].forEach((bx) => {
              [-2.3, 2.3].forEach((bz) => {
                const bw = new THREE.Mesh(busTireGeo, busTireMat);
                bw.rotation.x = Math.PI / 2;
                bw.position.set(bx, 1.3, bz);
                targetGroup.add(bw);
              });
            });
          } else if (isBike) {
            // MOTORBIKE / SCOOTER
            const bikeBody = new THREE.Mesh(
              new THREE.BoxGeometry(2.8, 1.4, 0.8),
              new THREE.MeshStandardMaterial({ color: 0x3b82f6 })
            );
            bikeBody.position.y = 1.6;
            targetGroup.add(bikeBody);

            const riderTorso = new THREE.Mesh(
              new THREE.BoxGeometry(1.0, 1.8, 0.9),
              new THREE.MeshStandardMaterial({ color: 0x334155 })
            );
            riderTorso.position.set(-0.2, 2.9, 0);
            targetGroup.add(riderTorso);

            const bTireGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 12);
            const bTireMat = new THREE.MeshStandardMaterial({ color: 0x090d16 });
            [-1.2, 1.2].forEach((tx) => {
              const tw = new THREE.Mesh(bTireGeo, bTireMat);
              tw.rotation.x = Math.PI / 2;
              tw.position.set(tx, 0.8, 0);
              targetGroup.add(tw);
            });
          } else {
            // PASSENGER SEDAN / SUV
            const carBody = new THREE.Mesh(
              new THREE.BoxGeometry(8.2, 2.6, 3.8),
              new THREE.MeshStandardMaterial({ color: new THREE.Color(v.color), roughness: 0.3, metalness: 0.5 })
            );
            carBody.position.y = 1.9;
            targetGroup.add(carBody);

            const carCabin = new THREE.Mesh(
              new THREE.BoxGeometry(4.8, 1.8, 3.4),
              new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8 })
            );
            carCabin.position.set(-0.4, 3.8, 0);
            targetGroup.add(carCabin);

            const carTireGeo = new THREE.CylinderGeometry(1.0, 1.0, 0.7, 14);
            const carTireMat = new THREE.MeshStandardMaterial({ color: 0x0f172a });
            [-2.4, 2.4].forEach((cx) => {
              [-1.9, 1.9].forEach((cz) => {
                const cw = new THREE.Mesh(carTireGeo, carTireMat);
                cw.rotation.x = Math.PI / 2;
                cw.position.set(cx, 1.0, cz);
                targetGroup.add(cw);
              });
            });
          }

          vehiclesGroup.add(targetGroup);
          vehiclesMapRef.current.set(v.id, targetGroup);
          vGroup = targetGroup;
        }

        // Coordinate projection from 2D sim space to 3D world
        const normX = ((v.x - 20) / 1060) * 480 - 180;
        let normZ = ((v.y - 220) / 220) * 55;

        // Construction redirection
        if (state.constructionZone.active && Math.abs(normX - state.constructionZone.x) < 28) {
          normZ += normZ > 0 ? 16 : -16;
        }

        vGroup.position.set(normX, 0, normZ);
        vGroup.rotation.y = v.direction === 'S' ? Math.PI / 2 : v.direction === 'N' ? -Math.PI / 2 : 0;
      });

      // Cleanup despawned vehicles
      vehiclesMapRef.current.forEach((grp, id) => {
        if (!activeIds.has(id)) {
          vehiclesGroup.remove(grp);
          vehiclesMapRef.current.delete(id);
        }
      });

      controls.update();
      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 960;
      cameraRef.current.aspect = w / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (frameId) {
        cancelAnimationFrame(frameId);
        clearTimeout(frameId);
      }
      renderer.dispose();
      container.replaceChildren();
    };
  }, [scenarioId]);

  return (
    <div className="relative bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Viewport Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-900/90 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              AmbuWave 3D Connected Road Network &amp; Street View
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-mono flex items-center gap-1">
                <InfinityIcon className="w-3 h-3 text-emerald-400" />
                Never-Ending 3D Road
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Continuous infinite loop roadway with real-world Indian fleet, connecting cross streets &amp; street view
            </p>
          </div>
        </div>

        {/* Camera Perspective & Infinite Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Infinite Road Mode Toggle */}
          <button
            onClick={onToggleInfiniteMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm border ${
              isInfiniteMode
                ? 'bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
            title="Toggle Continuous Infinite Driving vs Single Trip"
          >
            <InfinityIcon className="w-3.5 h-3.5" />
            <span>{isInfiniteMode ? 'Infinite Road: Active' : 'Single Corridor Run'}</span>
          </button>

          {/* Camera Perspectives */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setCameraMode('STREET_VIEW')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold transition-all ${
                cameraMode === 'STREET_VIEW'
                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Street View</span>
            </button>
            <button
              onClick={() => setCameraMode('CHASE')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraMode === 'CHASE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Chase Cam
            </button>
            <button
              onClick={() => setCameraMode('OVERVIEW')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraMode === 'OVERVIEW' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setCameraMode('TOP_DOWN')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                cameraMode === 'TOP_DOWN' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Drone Top-Down
            </button>
          </div>

          {/* Construction Toggle */}
          <button
            onClick={onToggleConstruction}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              constructionZone.active
                ? 'bg-amber-600 hover:bg-amber-500 text-white ring-2 ring-amber-400/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
            <span>{constructionZone.active ? 'Roadwork Active' : 'Add Roadwork'}</span>
          </button>

          {/* Toggle Expand / Collapse */}
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700"
          >
            {isCollapsed ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
            <span>{isCollapsed ? 'Show 3D' : 'Hide 3D'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      {!isCollapsed && (
        <div className="relative w-full overflow-hidden" style={{ height: '520px' }}>
          <div ref={mountRef} className="w-full h-full" />

          {/* Street View Cockpit In-Cab HUD Overlay */}
          {cameraMode === 'STREET_VIEW' && (
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-700 text-xs text-white shadow-2xl flex items-center gap-4 pointer-events-none">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold uppercase tracking-wider text-emerald-400">
                  Street View Active
                </span>
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="font-mono text-slate-300">
                Speed: <strong className="text-white">{Math.round(ambulance.speedKmph)} km/h</strong> • Unit 108
              </div>
              <div className="h-4 w-px bg-slate-700" />
              <div className="text-[11px] text-cyan-300 flex items-center gap-1">
                <InfinityIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Continuous Roadway</span>
              </div>
            </div>
          )}

          {/* Infinite Odometer & Lap Badge */}
          <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700 text-xs text-slate-300 shadow-xl flex items-center gap-3 pointer-events-none">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <InfinityIcon className="w-4 h-4 text-emerald-400" />
              <span>Lap {infiniteLaps}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-700" />
            <div className="font-mono text-[11px] text-slate-200">
              Odometer: <strong className="text-white">{totalDistanceKm.toFixed(1)} km</strong>
            </div>
          </div>

          {/* Helper Badge */}
          <div className="absolute bottom-3 left-4 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {cameraMode === 'STREET_VIEW'
                ? 'Street View: First-person cockpit camera panning forward along infinite road'
                : 'Drag to rotate 3D camera • Scroll to zoom • Right-click to pan'}
            </span>
          </div>

          {/* Construction Alert Overlay */}
          {constructionZone.active && (
            <div className="absolute bottom-3 right-4 bg-amber-950/90 border border-amber-600/80 px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs text-amber-200 pointer-events-none">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>
                <strong>Roadwork Detour:</strong> Lane closure redirected via U-turn bay &amp; side connector.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
