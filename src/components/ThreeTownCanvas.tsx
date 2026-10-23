import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { BuildingId } from '../types/index.ts';

interface ThreeTownCanvasProps {
  onSelectBuilding: (buildingId: BuildingId) => void;
  activeBuilding: BuildingId | null;
  newMateriBuildingIds: BuildingId[];
  studentName?: string;
  timeOfDay?: 'day' | 'night' | 'auto';
}

interface BuildingInfo {
  id: BuildingId;
  name: string;
  tagline: string;
  position: [number, number, number];
  color: number;
}

export const BUILDINGS_INFO: BuildingInfo[] = [
  { id: 'balai_kota', name: 'Balai Kota', tagline: 'Misi & Pengumuman', position: [0, 0, -14], color: 0x3b82f6 },
  { id: 'perpustakaan', name: 'Perpustakaan', tagline: 'Materi & Video', position: [-14, 0, -8], color: 0x10b981 },
  { id: 'taman_refleksi', name: 'Taman Refleksi', tagline: 'Tulis Refleksi', position: [-13, 0, 7], color: 0xec4899 },
  { id: 'menara_mentor', name: 'Menara Mentor', tagline: 'Umpan Balik AI', position: [14, 0, -8], color: 0x8b5cf6 },
  { id: 'bengkel_latihan', name: 'Bengkel Latihan', tagline: 'Kuis & Tantangan', position: [14, 0, 7], color: 0xf59e0b },
  { id: 'kantor_pos', name: 'Kantor Pos', tagline: 'Kirim Pesan ke Guru', position: [-8, 0, 15], color: 0xef4444 },
  { id: 'pasar_prestasi', name: 'Pasar Prestasi', tagline: 'Lencana & Poin', position: [8, 0, 15], color: 0x06b6d4 },
  { id: 'monumen_warga', name: 'Monumen Warga', tagline: 'Sapa & Obrolan Langsung', position: [0, 0, 0], color: 0xec4899 },
];

export const ThreeTownCanvas: React.FC<ThreeTownCanvasProps> = ({
  onSelectBuilding,
  activeBuilding,
  newMateriBuildingIds,
  timeOfDay = 'day',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingInfo | null>(null);
  const [isWalking, setIsWalking] = useState(false);
  const [webglError, setWebglError] = useState<string | null>(null);

  // Store callbacks & dynamic props in refs to prevent WebGL teardown
  const onSelectBuildingRef = useRef(onSelectBuilding);
  onSelectBuildingRef.current = onSelectBuilding;
  const activeBuildingRef = useRef(activeBuilding);
  activeBuildingRef.current = activeBuilding;
  const newMateriBuildingIdsRef = useRef(newMateriBuildingIds);
  newMateriBuildingIdsRef.current = newMateriBuildingIds;
  const timeOfDayRef = useRef(timeOfDay);
  timeOfDayRef.current = timeOfDay;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check headless
    const isHeadless =
      typeof navigator !== 'undefined' &&
      (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent));

    // Scene
    // Scene - Lush verdant green horizon & night emerald sky
    const scene = new THREE.Scene();
    const daySkyColor = new THREE.Color(0x86efac); // Lush pastel meadow green
    const nightSkyColor = new THREE.Color(0x064e3b); // Deep emerald forest night
    const daySunColor = new THREE.Color(0xfffaed);
    const nightMoonColor = new THREE.Color(0x6ee7b7);
    const dayHemiSky = new THREE.Color(0xbbf7d0);
    const nightHemiSky = new THREE.Color(0x064e3b);
    const dayHemiGround = new THREE.Color(0x22c55e);
    const nightHemiGround = new THREE.Color(0x022c22);

    scene.background = new THREE.Color(0x86efac);
    // Expand fog range so mobile camera distance keeps the green atmosphere without fogging buildings
    scene.fog = new THREE.Fog(0x86efac, 55, 260);

    // Camera - Isometric top-down perspective with dynamic mobile framing
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 280);

    const defaultCamPos = new THREE.Vector3(0, 24, 28);
    const updateCameraFraming = (w: number, h: number) => {
      const aspect = w / h;
      camera.aspect = aspect;
      if (aspect < 1.0) {
        // Mobile phone portrait: scale camera distance comfortably while keeping town centered in lush green
        const mobileFactor = Math.max(1.4, Math.min(2.1, 1.05 / aspect));
        camera.fov = 44;
        camera.position.set(0, 22 * mobileFactor, 26 * mobileFactor);
        camera.lookAt(0, 0, -1.8);
      } else {
        camera.fov = 42;
        camera.position.set(0, 24, 28);
        camera.lookAt(0, 0, 0);
      }
      defaultCamPos.copy(camera.position);
      camera.updateProjectionMatrix();
    };

    updateCameraFraming(width, height);

    // Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isHeadless,
        powerPreference: 'high-performance',
      });
    } catch (err: any) {
      console.warn('WebGL initialization failed, falling back to 2D view:', err);
      setWebglError(err?.message || 'WebGL tidak tersedia pada perangkat/browser ini');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xcfd8dc, 0.85);
    hemiLight.position.set(0, 30, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    dirLight.position.set(15, 28, 18);
    if (!isHeadless) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 70;
      const d = 26;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    // Twinkling Starfield for Night
    const starCount = 450;
    const starsGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.75 + 0.25);
      const r = 55 + Math.random() * 35;
      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.cos(phi);
      starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.85,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const starField = new THREE.Points(starsGeo, starsMat);
    scene.add(starField);

    // =========================================================================
    // LUSH GREEN GROUND & SURROUNDINGS (Fix Mobile White Horizon)
    // =========================================================================
    // Expansive Ground Plane with rich grass green covering all camera angles
    const groundGeo = new THREE.PlaneGeometry(500, 500);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80, // Rich vibrant lush spring grass green
      roughness: 0.88,
      metalness: 0.04,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = !isHeadless;
    scene.add(ground);

    // Surrounding Rolling Green Hills / Perimeter Mounds
    const hillMat = new THREE.MeshStandardMaterial({
      color: 0x22c55e, // Emerald green hill slope
      roughness: 0.9,
      metalness: 0.02,
    });
    const hillGroup = new THREE.Group();
    const hillGeo = new THREE.ConeGeometry(9.0, 4.5, 7);
    const hillPositions: [number, number, number, number][] = [
      [-38, 1.8, -32, 1.4],
      [-18, 1.6, -42, 1.6],
      [12, 1.7, -40, 1.5],
      [36, 1.9, -35, 1.3],
      [-42, 1.6, -10, 1.2],
      [42, 1.8, -8, 1.4],
      [-40, 1.7, 18, 1.3],
      [38, 1.9, 22, 1.5],
      [-25, 1.6, 36, 1.4],
      [8, 1.8, 38, 1.3],
      [28, 1.7, 34, 1.2],
    ];
    hillPositions.forEach(([hx, hy, hz, hScale]) => {
      const hill = new THREE.Mesh(hillGeo, hillMat);
      hill.position.set(hx, hy, hz);
      hill.scale.set(hScale, hScale * 0.75, hScale);
      hill.receiveShadow = !isHeadless;
      hillGroup.add(hill);
    });
    scene.add(hillGroup);

    // =========================================================================
    // MOVING 3D CLOUDS SYSTEM ("Efek Awan Berjalan")
    // =========================================================================
    const cloudsList: {
      group: THREE.Group;
      speed: number;
      baseY: number;
      bobSeed: number;
    }[] = [];

    const cloudPuffGeo = new THREE.DodecahedronGeometry(1.6, 1);
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.35,
      metalness: 0.05,
      transparent: true,
      opacity: 0.92,
      flatShading: true,
    });

    const createCloud = (x: number, y: number, z: number, scale: number, speed: number) => {
      const cGroup = new THREE.Group();
      cGroup.position.set(x, y, z);
      cGroup.scale.set(scale, scale * 0.65, scale);

      // Puffs inside cloud
      const puffOffsets: [number, number, number, number][] = [
        [0, 0, 0, 1.0],
        [1.3, -0.2, 0.3, 0.78],
        [-1.3, -0.15, -0.2, 0.82],
        [0.6, 0.35, 0.1, 0.75],
        [-0.5, 0.3, 0.2, 0.72],
        [0.2, -0.25, 0.8, 0.68],
        [-0.3, -0.2, -0.7, 0.65],
      ];

      puffOffsets.forEach(([px, py, pz, pScale]) => {
        const puff = new THREE.Mesh(cloudPuffGeo, cloudMat);
        puff.position.set(px, py, pz);
        puff.scale.setScalar(pScale);
        puff.castShadow = !isHeadless;
        cGroup.add(puff);
      });

      scene.add(cGroup);
      cloudsList.push({
        group: cGroup,
        speed,
        baseY: y,
        bobSeed: Math.random() * Math.PI * 2,
      });
    };

    // Instantiate 10 drifting clouds hovering over the town
    const initialCloudConfigs = [
      { x: -50, y: 17, z: -28, scale: 2.2, speed: 1.4 },
      { x: -25, y: 19, z: -12, scale: 2.6, speed: 1.8 },
      { x: 0, y: 16, z: -38, scale: 2.0, speed: 1.2 },
      { x: 26, y: 18, z: -18, scale: 2.4, speed: 1.6 },
      { x: -38, y: 20, z: 10, scale: 2.5, speed: 1.5 },
      { x: -10, y: 17, z: 20, scale: 2.1, speed: 1.3 },
      { x: 16, y: 19, z: 26, scale: 2.3, speed: 1.7 },
      { x: 40, y: 16, z: 6, scale: 2.7, speed: 1.9 },
      { x: -60, y: 18, z: -42, scale: 2.8, speed: 1.5 },
      { x: -12, y: 21, z: -48, scale: 3.0, speed: 1.4 },
    ];

    initialCloudConfigs.forEach((cfg) => {
      createCloud(cfg.x, cfg.y, cfg.z, cfg.scale, cfg.speed);
    });

    // Cobblestone Plaza & Pathways
    const plazaGeo = new THREE.CylinderGeometry(7.5, 7.5, 0.06, 32);
    const plazaMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.7,
      metalness: 0.1,
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.position.set(0, 0, 0);
    plaza.receiveShadow = !isHeadless;
    scene.add(plaza);

    // Pathways to each building (skip monumen_warga which is at center [0,0,0])
    BUILDINGS_INFO.forEach((b) => {
      if (b.id === 'monumen_warga') return;
      const dx = b.position[0];
      const dz = b.position[2];
      const dist = Math.hypot(dx, dz);
      const angle = Math.atan2(dz, dx);
      const pathGeo = new THREE.BoxGeometry(dist, 0.04, 2.4);
      const pathMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const pathMesh = new THREE.Mesh(pathGeo, pathMat);
      pathMesh.position.set(dx / 2, 0.01, dz / 2);
      pathMesh.rotation.y = -angle;
      pathMesh.receiveShadow = !isHeadless;
      scene.add(pathMesh);
    });

    // Street Lamps with Warm Amber Lanterns for Night
    const lampPostMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.8 });
    const lampBulbMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
      roughness: 0.3,
    });

    const lampPositions: [number, number][] = [
      [-5.5, -6],
      [5.5, -6],
      [-5.5, 6],
      [5.5, 6],
      [-8.5, 0],
      [8.5, 0],
    ];

    const lampLights: THREE.PointLight[] = [];

    lampPositions.forEach(([lx, lz]) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(lx, 0, lz);

      // Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.8, 8), lampPostMat);
      pole.position.y = 1.4;
      pole.castShadow = !isHeadless;
      lampGroup.add(pole);

      // Cross arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.08), lampPostMat);
      arm.position.y = 2.75;
      lampGroup.add(arm);

      // Lantern Head
      const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 0.32), lampBulbMat);
      lantern.position.y = 2.55;
      lampGroup.add(lantern);

      // PointLight
      if (!isHeadless) {
        const pointLight = new THREE.PointLight(0xf59e0b, 0, 14, 2);
        pointLight.position.y = 2.5;
        lampGroup.add(pointLight);
        lampLights.push(pointLight);
      }

      scene.add(lampGroup);
    });

    // Decorative Low-Poly Trees
    const treePositions = [
      [-6, -4], [6, -4], [-8, 4], [8, 4],
      [-18, -2], [18, -2], [-18, 12], [18, 12],
      [-5, -20], [5, -20], [-20, -18], [20, -18],
      [-16, 20], [16, 20], [0, 22]
    ];
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const foliageMat1 = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.8 });
    const foliageMat2 = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 });

    treePositions.forEach(([tx, tz], i) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(tx, 0, tz);

      const trunkGeo = new THREE.CylinderGeometry(0.2, 0.3, 1.6, 8);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 0.8;
      trunk.castShadow = !isHeadless;
      treeGroup.add(trunk);

      const fMat = i % 2 === 0 ? foliageMat1 : foliageMat2;
      const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.6, 2.2, 7), fMat);
      f1.position.y = 2.4;
      f1.castShadow = !isHeadless;
      treeGroup.add(f1);

      const f2 = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.8, 7), fMat);
      f2.position.y = 3.3;
      f2.castShadow = !isHeadless;
      treeGroup.add(f2);

      scene.add(treeGroup);
    });

    // Window Material that glows at night
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      emissive: 0xf59e0b,
      emissiveIntensity: 0,
      roughness: 0.3,
    });

    // BUILDINGS CREATION
    const buildingMeshes: { id: BuildingId; group: THREE.Group; beacon: THREE.Mesh }[] = [];

    BUILDINGS_INFO.forEach((b) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(b.position[0], 0, b.position[2]);
      bGroup.userData = { buildingId: b.id, buildingInfo: b };

      // Base Foundation (rectangular for buildings, round for monumen_warga)
      if (b.id !== 'monumen_warga') {
        const baseGeo = new THREE.BoxGeometry(5.2, 0.4, 5.2);
        const baseMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.7 });
        const baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.y = 0.2;
        baseMesh.receiveShadow = !isHeadless;
        bGroup.add(baseMesh);
      }

      // Unique Architecture per building
      if (b.id === 'balai_kota') {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.3, metalness: 0.2 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.7 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.6, 4.2), wallMat);
        body.position.y = 2.0;
        body.castShadow = !isHeadless;
        bGroup.add(body);

        // Pillars
        for (let px of [-1.6, -0.6, 0.6, 1.6]) {
          const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 3.4, 12), wallMat);
          col.position.set(px, 1.9, 2.2);
          col.castShadow = !isHeadless;
          bGroup.add(col);
        }

        // Portico pediment
        const pediment = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.4, 4), roofMat);
        pediment.rotation.y = Math.PI / 4;
        pediment.position.set(0, 4.3, 2.1);
        bGroup.add(pediment);

        // Grand Dome
        const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 16), wallMat);
        domeBase.position.y = 4.2;
        bGroup.add(domeBase);

        const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), roofMat);
        dome.position.y = 4.6;
        bGroup.add(dome);

        // Gold Spire
        const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.2, 1.5, 8), goldMat);
        spire.position.y = 6.2;
        bGroup.add(spire);

        // Clock disc
        const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), goldMat);
        clock.rotation.x = Math.PI / 2;
        clock.position.set(0, 3.2, 2.15);
        bGroup.add(clock);

        // Balai Kota glowing windows
        const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.08), windowMat);
        win1.position.set(-1.1, 2.1, 2.12);
        bGroup.add(win1);
        const win2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.1, 0.08), windowMat);
        win2.position.set(1.1, 2.1, 2.12);
        bGroup.add(win2);

      } else if (b.id === 'perpustakaan') {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.6 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x059669, roughness: 0.4 });
        const timberMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.7 });

        const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.4, 4.4), wallMat);
        body.position.y = 1.9;
        body.castShadow = !isHeadless;
        bGroup.add(body);

        // Mansard Roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.4, 2.2, 4), roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 4.4;
        bGroup.add(roof);

        // Arch Entrance
        const arch = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.2, 8, 16, Math.PI), timberMat);
        arch.position.set(0, 1.8, 2.25);
        bGroup.add(arch);

        // Signboard
        const sign = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.5, 0.1), timberMat);
        sign.position.set(0, 2.9, 2.25);
        bGroup.add(sign);

        // Perpustakaan Windows
        const libWinL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.08), windowMat);
        libWinL.position.set(-1.2, 1.9, 2.22);
        bGroup.add(libWinL);
        const libWinR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.08), windowMat);
        libWinR.position.set(1.2, 1.9, 2.22);
        bGroup.add(libWinR);

      } else if (b.id === 'taman_refleksi') {
        const woodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.6 });
        const cherryMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.8 });
        const pagodaMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.3 });

        // Circular stone garden wall
        const gWall = new THREE.Mesh(new THREE.CylinderGeometry(2.8, 2.8, 0.5, 24), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
        gWall.position.y = 0.25;
        bGroup.add(gWall);

        // Wooden pavilion pillars
        for (let angle of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
          const px = Math.cos(angle) * 1.4;
          const pz = Math.sin(angle) * 1.4;
          const pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.8, 8), woodMat);
          pCol.position.set(px, 1.6, pz);
          bGroup.add(pCol);
        }

        // Curved Tiered Roof
        const roof1 = new THREE.Mesh(new THREE.ConeGeometry(2.5, 0.9, 8), pagodaMat);
        roof1.position.y = 3.2;
        bGroup.add(roof1);

        const roof2 = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.8, 8), pagodaMat);
        roof2.position.y = 3.9;
        bGroup.add(roof2);

        // Miniature Blossom Tree
        const bTree = new THREE.Mesh(new THREE.DodecahedronGeometry(0.9, 1), cherryMat);
        bTree.position.set(1.6, 2.0, 1.2);
        bGroup.add(bTree);

      } else if (b.id === 'menara_mentor') {
        const wallMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.4 });
        const purpleMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.2, metalness: 0.5 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.8 });

        // Octagonal Tower Body
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 2.2, 5.2, 8), wallMat);
        tower.position.y = 2.8;
        tower.castShadow = !isHeadless;
        bGroup.add(tower);

        // Observatory Dome
        const obsDome = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2), purpleMat);
        obsDome.position.y = 5.4;
        bGroup.add(obsDome);

        // Telescope
        const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 2.2, 12), goldMat);
        scope.rotation.x = -Math.PI / 4;
        scope.rotation.z = Math.PI / 6;
        scope.position.set(0.6, 6.2, 0.6);
        bGroup.add(scope);

        // Glowing Orbit Ring
        const ringGeo = new THREE.TorusGeometry(2.4, 0.1, 8, 24);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
        const orbitRing = new THREE.Mesh(ringGeo, ringMat);
        orbitRing.rotation.x = Math.PI / 3;
        orbitRing.position.y = 3.8;
        bGroup.add(orbitRing);

      } else if (b.id === 'bengkel_latihan') {
        const brickMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5 });
        const ironMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.8 });

        const bBody = new THREE.Mesh(new THREE.BoxGeometry(4.4, 3.0, 4.0), brickMat);
        bBody.position.y = 1.7;
        bBody.castShadow = !isHeadless;
        bGroup.add(bBody);

        // Industrial Slanted Roof
        const roof = new THREE.Mesh(new THREE.ConeGeometry(3.3, 1.8, 4), roofMat);
        roof.rotation.y = Math.PI / 4;
        roof.position.y = 3.8;
        bGroup.add(roof);

        // Chimney
        const chim = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.6, 0.8), brickMat);
        chim.position.set(1.4, 4.0, -1.0);
        bGroup.add(chim);

        // Giant Gear accent
        const gear = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.2, 6, 12), ironMat);
        gear.position.set(0, 2.2, 2.1);
        bGroup.add(gear);

        // Bengkel Windows
        const bWin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.08), windowMat);
        bWin.position.set(0, 1.1, 2.05);
        bGroup.add(bWin);

      } else if (b.id === 'kantor_pos') {
        const redMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4 });
        const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
        const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.3 });

        const pBody = new THREE.Mesh(new THREE.BoxGeometry(3.8, 2.8, 3.8), whiteMat);
        pBody.position.y = 1.6;
        bGroup.add(pBody);

        // Red Roof
        const pRoof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 1.8, 4), redMat);
        pRoof.rotation.y = Math.PI / 4;
        pRoof.position.y = 3.6;
        bGroup.add(pRoof);

        // Striped Awning
        const awning = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 1.0), redMat);
        awning.rotation.x = 0.2;
        awning.position.set(0, 1.8, 2.2);
        bGroup.add(awning);

        // Yellow Postbox Pillar
        const mailbox = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.2, 12), yellowMat);
        mailbox.position.set(1.6, 0.8, 2.4);
        bGroup.add(mailbox);

        // Kantor Pos Windows
        const posWin = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.08), windowMat);
        posWin.position.set(-1.0, 1.8, 1.95);
        bGroup.add(posWin);

      } else if (b.id === 'pasar_prestasi') {
        const tentMat1 = new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.5 });
        const tentMat2 = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.2, metalness: 0.8 });

        const stall = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 3.8), new THREE.MeshStandardMaterial({ color: 0xfef08a }));
        stall.position.y = 1.4;
        bGroup.add(stall);

        // Striped tent canopy
        const canopy1 = new THREE.Mesh(new THREE.ConeGeometry(2.8, 1.6, 6), tentMat1);
        canopy1.position.set(-0.8, 3.0, 0);
        bGroup.add(canopy1);

        const canopy2 = new THREE.Mesh(new THREE.ConeGeometry(2.4, 1.5, 6), tentMat2);
        canopy2.position.set(1.0, 3.2, 0);
        bGroup.add(canopy2);

        // Trophy star banner
        const star = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6), goldMat);
        star.position.set(0, 4.4, 0);
        bGroup.add(star);

      } else if (b.id === 'monumen_warga') {
        const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.6 });
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.3, metalness: 0.8 });
        const sakuraMat = new THREE.MeshStandardMaterial({
          color: 0xf472b6,
          emissive: 0xdb2777,
          emissiveIntensity: 0.45,
          roughness: 0.2,
        });
        const benchWoodMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 });

        // Monument Stepped Base
        const step1 = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.9, 0.25, 28), stoneMat);
        step1.position.y = 0.12;
        step1.receiveShadow = !isHeadless;
        bGroup.add(step1);

        const step2 = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 0.3, 24), stoneMat);
        step2.position.y = 0.38;
        step2.receiveShadow = !isHeadless;
        bGroup.add(step2);

        // Water Basin & Surface
        const waterGeo = new THREE.CylinderGeometry(2.4, 2.4, 0.2, 24);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.1,
          metalness: 0.8,
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.position.y = 0.52;
        bGroup.add(water);

        // Center Pillar with Gold Rings
        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.65, 2.4, 16), stoneMat);
        pillar.position.y = 1.7;
        pillar.castShadow = !isHeadless;
        bGroup.add(pillar);

        const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.08, 8, 20), goldMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.y = 1.2;
        bGroup.add(ring1);

        const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.08, 8, 20), goldMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.y = 2.4;
        bGroup.add(ring2);

        // Monument Sakura Crystal / Flower at Peak
        const sakuraCrystal = new THREE.Mesh(new THREE.DodecahedronGeometry(0.75, 0), sakuraMat);
        sakuraCrystal.position.y = 3.35;
        bGroup.add(sakuraCrystal);

        // 4 Circular Plaza Benches with Gathered Classmates
        const benchAngles = [0.25, Math.PI / 2 + 0.15, Math.PI + 0.35, (3 * Math.PI) / 2 + 0.25];
        const studentShirtColors = [0xec4899, 0x10b981, 0x8b5cf6, 0xf59e0b];
        const studentSkinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.8 });
        const studentHairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });

        benchAngles.forEach((angle, idx) => {
          const bx = Math.cos(angle) * 4.4;
          const bz = Math.sin(angle) * 4.4;

          // Wooden Bench
          const bench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.35, 0.6), benchWoodMat);
          bench.position.set(bx, 0.25, bz);
          bench.rotation.y = -angle + Math.PI / 2;
          bGroup.add(bench);

          // Classmate avatar
          const cmGroup = new THREE.Group();
          cmGroup.position.set(bx, 0.45, bz);

          const cmShirtMat = new THREE.MeshStandardMaterial({ color: studentShirtColors[idx], roughness: 0.7 });
          const cmTorso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.6, 10), cmShirtMat);
          cmTorso.position.y = 0.35;
          cmGroup.add(cmTorso);

          const cmHead = new THREE.Mesh(new THREE.SphereGeometry(0.26, 12, 12), studentSkinMat);
          cmHead.position.y = 0.82;
          cmGroup.add(cmHead);

          const cmHair = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 10, 0, Math.PI * 2, 0, Math.PI / 2), studentHairMat);
          cmHair.position.y = 0.92;
          cmGroup.add(cmHair);

          bGroup.add(cmGroup);
        });
      }

      // Beacon indicator over building for new material / mission
      const beaconGeo = new THREE.OctahedronGeometry(0.45, 0);
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, wireframe: false });
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.position.y = b.id === 'monumen_warga' ? 5.2 : 7.0;
      bGroup.add(beacon);

      scene.add(bGroup);
      buildingMeshes.push({ id: b.id, group: bGroup, beacon });
    });

    // 3D STUDENT AVATAR
    const avatarGroup = new THREE.Group();
    avatarGroup.position.set(0, 0, 3.5);

    // Avatar parts
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfbcfe8, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e1b4b, roughness: 0.8 });
    const bagMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.6 });

    // Head & Hair
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 16, 16), skinMat);
    head.position.y = 1.7;
    head.castShadow = !isHeadless;
    avatarGroup.add(head);

    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2), hairMat);
    hair.position.y = 1.82;
    avatarGroup.add(hair);

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.75, 12), shirtMat);
    torso.position.y = 1.1;
    torso.castShadow = !isHeadless;
    avatarGroup.add(torso);

    // Backpack
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.25), bagMat);
    backpack.position.set(0, 1.1, -0.32);
    avatarGroup.add(backpack);

    // Legs
    const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), pantsMat);
    leftLeg.position.set(-0.16, 0.4, 0);
    avatarGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 8), pantsMat);
    rightLeg.position.set(0.16, 0.4, 0);
    avatarGroup.add(rightLeg);

    // Soft Contact Shadow Plane under Avatar
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3 });
    const avatarShadow = new THREE.Mesh(shadowGeo, shadowMat);
    avatarShadow.rotation.x = -Math.PI / 2;
    avatarShadow.position.y = 0.02;
    avatarGroup.add(avatarShadow);

    scene.add(avatarGroup);

    // Click / Target Navigation State
    let targetPos = new THREE.Vector3(0, 0, 3.5);
    let isMoving = false;
    let targetBuildingId: BuildingId | null = null;

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
      const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Check building click first
      const buildingHit = raycaster.intersectObjects(
        buildingMeshes.map((b) => b.group),
        true
      );

      if (buildingHit.length > 0) {
        let parent: THREE.Object3D | null = buildingHit[0].object;
        while (parent && !parent.userData?.buildingId) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.buildingId) {
          const bId = parent.userData.buildingId as BuildingId;
          const bInfo = BUILDINGS_INFO.find((b) => b.id === bId);
          if (bInfo) {
            if (bId === 'monumen_warga') {
              targetPos.set(0, 0, 2.8);
            } else {
              targetPos.set(bInfo.position[0] * 0.7, 0, bInfo.position[2] * 0.7);
            }
            targetBuildingId = bId;
            isMoving = true;
            setIsWalking(true);
            return;
          }
        }
      }

      // Check ground click
      const groundHit = raycaster.intersectObject(ground);
      if (groundHit.length > 0) {
        const point = groundHit[0].point;
        const clampedX = THREE.MathUtils.clamp(point.x, -22, 22);
        const clampedZ = THREE.MathUtils.clamp(point.z, -22, 22);
        targetPos.set(clampedX, 0, clampedZ);
        targetBuildingId = null;
        isMoving = true;
        setIsWalking(true);
      }
    };

    const handlePointerMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const buildingHit = raycaster.intersectObjects(
        buildingMeshes.map((b) => b.group),
        true
      );

      if (buildingHit.length > 0) {
        let parent: THREE.Object3D | null = buildingHit[0].object;
        while (parent && !parent.userData?.buildingId) {
          parent = parent.parent;
        }
        if (parent && parent.userData?.buildingInfo) {
          setHoveredBuilding(parent.userData.buildingInfo);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }

      setHoveredBuilding(null);
      renderer.domElement.style.cursor = 'default';
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('click', handlePointerDown);
    domElement.addEventListener('mousemove', handlePointerMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      updateCameraFraming(w, h);
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Day & Night smooth factor
    let currentNightFactor = 0; // 0 = day, 1 = night

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsedTime = clock.getElapsedTime();

      // Determine target night factor
      let targetNightFactor = 0;
      if (timeOfDayRef.current === 'night') {
        targetNightFactor = 1.0;
      } else if (timeOfDayRef.current === 'day') {
        targetNightFactor = 0.0;
      } else if (timeOfDayRef.current === 'auto') {
        // Smooth ~80s day/night sinusoidal cycle
        targetNightFactor = (Math.sin(elapsedTime * 0.08) + 1) / 2;
      }

      // Smoothly interpolate night factor
      currentNightFactor = THREE.MathUtils.damp(currentNightFactor, targetNightFactor, 3.5, delta);

      // 1. Sky & Fog color transition
      (scene.background as THREE.Color).lerpColors(daySkyColor, nightSkyColor, currentNightFactor);
      if (scene.fog && scene.fog instanceof THREE.Fog) {
        scene.fog.color.lerpColors(daySkyColor, nightSkyColor, currentNightFactor);
        scene.fog.near = THREE.MathUtils.lerp(45, 35, currentNightFactor);
        scene.fog.far = THREE.MathUtils.lerp(160, 140, currentNightFactor);
      }

      // 2. Sun to Moon light transition
      dirLight.color.lerpColors(daySunColor, nightMoonColor, currentNightFactor);
      dirLight.intensity = THREE.MathUtils.lerp(1.4, 0.42, currentNightFactor);

      // 3. Ambient Hemisphere light
      hemiLight.color.lerpColors(dayHemiSky, nightHemiSky, currentNightFactor);
      hemiLight.groundColor.lerpColors(dayHemiGround, nightHemiGround, currentNightFactor);
      hemiLight.intensity = THREE.MathUtils.lerp(0.85, 0.32, currentNightFactor);

      // 4. Starfield visibility & twinkling
      starsMat.opacity = currentNightFactor * 0.92;
      if (currentNightFactor > 0.05) {
        starsMat.size = 0.8 + Math.sin(elapsedTime * 2.5) * 0.15;
      }

      // 5. Moving Clouds Animation & Night Dimming ("Efek Awan Berjalan")
      cloudMat.color.lerpColors(new THREE.Color(0xffffff), new THREE.Color(0x94a3b8), currentNightFactor);
      cloudsList.forEach((cloud) => {
        cloud.group.position.x += cloud.speed * delta;
        cloud.group.position.y = cloud.baseY + Math.sin(elapsedTime * 0.7 + cloud.bobSeed) * 0.35;
        if (cloud.group.position.x > 68) {
          cloud.group.position.x = -68;
          cloud.group.position.z = (Math.random() - 0.5) * 85;
        }
      });

      // 6. Street Lamps & Lantern PointLights
      lampBulbMat.emissiveIntensity = currentNightFactor * 1.6;
      lampLights.forEach((pl) => {
        pl.intensity = currentNightFactor * 1.8;
      });

      // 7. Building Windows glow
      windowMat.emissiveIntensity = currentNightFactor * 0.85;

      // Animate building beacons & indicators
      buildingMeshes.forEach((bm) => {
        const hasNew = newMateriBuildingIdsRef.current.includes(bm.id);
        bm.beacon.visible = hasNew;
        if (hasNew) {
          bm.beacon.rotation.y += delta * 2.5;
          bm.beacon.position.y = 6.8 + Math.sin(elapsedTime * 4) * 0.35;
        }
      });

      // Animate Avatar Movement
      if (isMoving) {
        const currentPos = avatarGroup.position;
        const dist = currentPos.distanceTo(targetPos);

        if (dist > 0.25) {
          const angle = Math.atan2(targetPos.x - currentPos.x, targetPos.z - currentPos.z);
          avatarGroup.rotation.y = THREE.MathUtils.damp(avatarGroup.rotation.y, angle, 12, delta);

          currentPos.x = THREE.MathUtils.damp(currentPos.x, targetPos.x, 5, delta);
          currentPos.z = THREE.MathUtils.damp(currentPos.z, targetPos.z, 5, delta);

          const legAngle = Math.sin(elapsedTime * 14) * 0.6;
          leftLeg.rotation.x = legAngle;
          rightLeg.rotation.x = -legAngle;
          avatarGroup.position.y = Math.abs(Math.sin(elapsedTime * 14)) * 0.08;
        } else {
          isMoving = false;
          setIsWalking(false);
          leftLeg.rotation.x = 0;
          rightLeg.rotation.x = 0;
          avatarGroup.position.y = 0;

          if (targetBuildingId) {
            const chosen = targetBuildingId;
            targetBuildingId = null;
            onSelectBuildingRef.current(chosen);
          }
        }
      }

      // Smooth camera focus when visiting Monumen Warga gathering
      if (activeBuildingRef.current === 'monumen_warga') {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 9.8, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 12.8, 3.5, delta);
        camera.lookAt(0, 1.2, 0);
      } else if (defaultCamPos.lengthSq() > 0 && camera.position.distanceTo(defaultCamPos) > 0.05) {
        camera.position.x = THREE.MathUtils.damp(camera.position.x, defaultCamPos.x, 3.2, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, defaultCamPos.y, 3.2, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, defaultCamPos.z, 3.2, delta);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      if (renderer) renderer.dispose();
      if (domElement) {
        domElement.removeEventListener('click', handlePointerDown);
        domElement.removeEventListener('mousemove', handlePointerMove);
        if (container.contains(domElement)) {
          container.removeChild(domElement);
        }
      }
    };
  }, []);

  if (webglError) {
    return (
      <div className="relative w-full h-full select-none overflow-y-auto bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-500/30">
            <span>🏛️</span>
            <span>Mode Peta 2D Kota Refleksi</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display text-white">
            Peta Gedung Pembelajaran
          </h2>
          <p className="text-xs text-slate-400">
            Pilih gedung di bawah untuk langsung membuka ruang belajar dan refleksi:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
            {BUILDINGS_INFO.map((b) => (
              <button
                key={b.id}
                onClick={() => onSelectBuilding(b.id)}
                className="p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 flex items-center gap-3 transition shadow-lg cursor-pointer hover:border-indigo-500"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md shrink-0 text-base"
                  style={{ backgroundColor: '#' + b.color.toString(16).padStart(6, '0') }}
                >
                  🏛️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{b.name}</span>
                    {newMateriBuildingIds.includes(b.id) && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    )}
                  </div>
                  <span className="text-xs text-slate-400">{b.tagline}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full select-none overflow-hidden" data-testid="threejs-town-canvas">
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Hover Info Badge */}
      {hoveredBuilding && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-slate-900/90 text-white px-5 py-2.5 rounded-2xl shadow-xl border border-slate-700/60 flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full inline-block"
              style={{ backgroundColor: '#' + hoveredBuilding.color.toString(16).padStart(6, '0') }}
            />
            <div>
              <p className="font-bold text-sm leading-tight text-white">{hoveredBuilding.name}</p>
              <p className="text-xs text-slate-300 font-medium">{hoveredBuilding.tagline}</p>
            </div>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
              Ketuk untuk masuk
            </span>
          </div>
        </div>
      )}

      {/* Walking Status Badge */}
      {isWalking && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="bg-slate-900/80 text-white text-xs px-4 py-1.5 rounded-full shadow border border-slate-700/50 flex items-center gap-2">
            <span>🏃</span>
            <span>Murid sedang berjalan...</span>
          </div>
        </div>
      )}
    </div>
  );
};
