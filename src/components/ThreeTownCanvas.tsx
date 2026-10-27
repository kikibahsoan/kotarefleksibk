import React, { useEffect, useRef, useState } from 'react';
import { BuildingId, PublicChatMessage } from '../types/index.ts';
import { sounds } from '../utils/audio.ts';
import { X, Plus, Minus, MapPin } from 'lucide-react';

interface ThreeTownCanvasProps {
  onSelectBuilding: (buildingId: BuildingId) => void;
  activeBuilding: BuildingId | null;
  newMateriBuildingIds: BuildingId[];
  studentName?: string;
  studentGender?: string;
  timeOfDay?: 'day' | 'night' | 'auto';
  latestMessage?: PublicChatMessage | null;
  studentPoints?: number;
  onDeductPoints?: (amount: number, reason: string) => boolean;
}

export interface BuildingInfo {
  id: BuildingId;
  name: string;
  tagline: string;
  position: [number, number, number]; // [worldX, y, worldY]
  color: number;
  icon: string;
}

export const BUILDINGS_INFO: BuildingInfo[] = [
  { id: 'balai_kota', name: 'Balai Kota', tagline: 'Kubah Emas & Misi', position: [0, 0, -4.2], color: 0x3b82f6, icon: '🏛️' },
  { id: 'menara_mentor', name: 'Dewan Kota & Tower', tagline: 'Studio ON AIR & AI', position: [4.2, 0, 0], color: 0x8b5cf6, icon: '📡' },
  { id: 'perpustakaan', name: 'Perpustakaan Kampus', tagline: 'Gedung Biru & Materi', position: [-4.2, 0, 0], color: 0x10b981, icon: '📚' },
  { id: 'pasar_prestasi', name: 'Toko Poin', tagline: 'Lencana & Hadiah', position: [-2.8, 0, 2.8], color: 0x06b6d4, icon: '🎪' },
  { id: 'kantor_pos', name: 'Kantor Pos Kilat', tagline: 'Kirim Pesan ke Guru', position: [2.8, 0, -2.8], color: 0xef4444, icon: '📮' },
  { id: 'taman_refleksi', name: 'Taman Refleksi', tagline: 'Tulis Jurnal Refleksi', position: [-2.8, 0, -2.8], color: 0xec4899, icon: '🌸' },
  { id: 'bengkel_latihan', name: 'Lab DKV & Tefa', tagline: 'Tower Kontrol & Kuis', position: [2.8, 0, 2.8], color: 0xf59e0b, icon: '🛠️' },
  { id: 'monumen_warga', name: 'Air Mancur Warga', tagline: 'Sapa & Obrolan Langsung', position: [0, 0, 0], color: 0x06b6d4, icon: '⛲' },
];

interface AvatarData {
  id: string;
  role: 'siswa' | 'guru' | 'polisi' | 'petugas_kebersihan' | 'kurir' | 'barista';
  handle: string;
  roleLabel: string;
  wx: number;
  wy: number;
  targetWx: number;
  targetWy: number;
  speed: number;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  isMoving: boolean;
  pauseTimer: number;
  walkFrame: number;
  facing: 'down-left' | 'down-right' | 'up-left' | 'up-right';
  speechText?: string;
  speechTimer?: number;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

export const TREES_LIST: [number, number][] = [
  // Top corner (North)
  [0, -5.4],
  [-1.8, -5.2],
  [1.8, -5.2],
  // Left edge (West)
  [-5.2, -1.8],
  [-5.4, 0],
  [-5.2, 1.8],
  [-3.8, 3.8],
  // Bottom corner (South)
  [-1.8, 5.2],
  [0, 5.4],
  [1.8, 5.2],
  // Right edge (East)
  [5.2, -1.8],
  [5.4, 0],
  [5.2, 1.8],
  [3.8, 3.8],
  // Center park trees
  [-1.4, -1.4],
  [1.4, -1.4],
  [-1.4, 1.4],
  [1.4, 1.4],
];

export const STREET_LAMPS_LIST: [number, number][] = [
  // Pathway intersections along outer square
  [-3.0, -1.5],
  [-3.0, 1.5],
  [3.0, -1.5],
  [3.0, 1.5],
  [-1.5, -3.0],
  [1.5, -3.0],
  [-1.5, 3.0],
  [1.5, 3.0],
  // Central spokes along main crossroads
  [-1.8, 0],
  [1.8, 0],
  [0, -1.9],
  [0, 1.9],
  // Outer square corners
  [-3.0, -3.0],
  [3.0, -3.0],
  [-3.0, 3.0],
  [3.0, 3.0],
];

export interface EntryConfirmation {
  type: 'building' | 'cafe';
  id: BuildingId | 'cafe';
  name: string;
  tagline: string;
  icon: string;
  color?: number;
}

export interface SolidObstacle {
  minWx: number;
  maxWx: number;
  minWy: number;
  maxWy: number;
}

export const SOLID_BUILDING_OBSTACLES: SolidObstacle[] = [
  // Balai Kota
  { minWx: -1.35, maxWx: 1.35, minWy: -5.0, maxWy: -3.4 },
  // Menara Mentor
  { minWx: 3.3, maxWx: 5.0, minWy: -1.0, maxWy: 1.0 },
  // Perpustakaan Kampus
  { minWx: -5.0, maxWx: -3.3, minWy: -1.0, maxWy: 1.0 },
  // Pasar Prestasi
  { minWx: -3.6, maxWx: -2.0, minWy: 2.0, maxWy: 3.6 },
  // Kantor Pos
  { minWx: 2.0, maxWx: 3.6, minWy: -3.6, maxWy: -2.0 },
  // Taman Refleksi (Gazebo & Pagoda)
  { minWx: -3.6, maxWx: -2.0, minWy: -3.6, maxWy: -2.0 },
  // Lab DKV & Bengkel
  { minWx: 2.0, maxWx: 3.6, minWy: 2.0, maxWy: 3.6 },
  // Toko Roti & Kafe
  { minWx: -1.1, maxWx: 0.1, minWy: 1.9, maxWy: 2.9 },
];

export const isSolidCollision = (wx: number, wy: number, padding: number = 0.16): boolean => {
  // Island edges
  if (wx < -5.0 + padding || wx > 5.0 - padding || wy < -5.0 + padding || wy > 5.0 - padding) {
    return true;
  }

  // Central Fountain pool
  if (Math.hypot(wx, wy) < 0.92 + padding) {
    return true;
  }

  // Solid buildings
  for (const b of SOLID_BUILDING_OBSTACLES) {
    if (
      wx >= b.minWx - padding &&
      wx <= b.maxWx + padding &&
      wy >= b.minWy - padding &&
      wy <= b.maxWy + padding
    ) {
      return true;
    }
  }

  return false;
};

interface Firefly {
  treeIndex: number;
  angle: number;
  radius: number;
  speed: number;
  altitude: number;
  altitudeWave: number;
  phase: number;
  blinkSpeed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

export const ThreeTownCanvas = React.memo<ThreeTownCanvasProps>(function ThreeTownCanvas({
  onSelectBuilding,
  activeBuilding,
  newMateriBuildingIds,
  studentName = 'Siswa',
  studentGender = 'L',
  timeOfDay = 'night',
  latestMessage,
  studentPoints = 100,
  onDeductPoints,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingInfo | null>(null);
  const [isCafeMenuOpen, setIsCafeMenuOpen] = useState(false);
  const [cafeToast, setCafeToast] = useState<string | null>(null);
  const [cafeScreenPos, setCafeScreenPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Entry confirmation modal state
  const [pendingConfirmation, setPendingConfirmation] = useState<EntryConfirmation | null>(null);
  const pendingConfirmationRef = useRef<EntryConfirmation | null>(null);
  pendingConfirmationRef.current = pendingConfirmation;

  // User Camera Zoom State (+ / -)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  // Active comic speech bubbles
  const playerSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);
  const baristaSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);

  // References for render loop
  const onSelectBuildingRef = useRef(onSelectBuilding);
  onSelectBuildingRef.current = onSelectBuilding;
  const timeOfDayRef = useRef(timeOfDay);
  timeOfDayRef.current = timeOfDay;

  // React to incoming public chat messages
  useEffect(() => {
    if (latestMessage && latestMessage.content) {
      playerSpeechRef.current = {
        text: latestMessage.content.slice(0, 36) + (latestMessage.content.length > 36 ? '...' : ''),
        expiresAt: Date.now() + 6000,
      };
    }
  }, [latestMessage]);

  // Center camera trigger ref
  const resetCameraRequestedRef = useRef(false);
  // Auto-opened building touch tracker to prevent redundant triggers while standing still
  const lastTouchedIdRef = useRef<string | null>(null);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(1.5, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(0.65, Number((prev - 0.15).toFixed(2))));
  };

  const handleCenterOnPlayer = () => {
    resetCameraRequestedRef.current = true;
    sounds.playClick();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = (canvas.width = container.clientWidth || 800);
    let height = (canvas.height = container.clientHeight || 600);

    const handleResize = () => {
      if (!container || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth || 800;
      height = container.clientHeight || 600;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // -----------------------------------------------------------
    // EXACT ISOMETRIC RATIO & PROJECTION MATCHING REFERENCE
    // -----------------------------------------------------------
    const BASE_TILE_W = 60;
    const BASE_TILE_H = 30; // 2:1 isometric ratio

    const toScreen = (wx: number, wy: number, altitude = 0, camX: number, camY: number) => {
      const currentTileW = BASE_TILE_W * zoomLevelRef.current;
      const currentTileH = BASE_TILE_H * zoomLevelRef.current;
      const isoX = (wx - wy) * currentTileW;
      const isoY = (wx + wy) * currentTileH - altitude * zoomLevelRef.current;
      return {
        x: width / 2 + (isoX - camX),
        y: height / 2 + (isoY - camY),
      };
    };

    const toWorld = (sx: number, sy: number, camX: number, camY: number) => {
      const currentTileW = BASE_TILE_W * zoomLevelRef.current;
      const currentTileH = BASE_TILE_H * zoomLevelRef.current;
      const isoX = sx - width / 2 + camX;
      const isoY = sy - height / 2 + camY;
      const wx = (isoX / currentTileW + isoY / currentTileH) / 2;
      const wy = (isoY / currentTileH - isoX / currentTileW) / 2;
      return { wx, wy };
    };

    // Camera state
    const camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    // -----------------------------------------------------------
    // CITIZENS & AVATARS MATCHING SCREENSHOT
    // -----------------------------------------------------------
    const studentHandle = studentName.split(' ')[0].toLowerCase();

    // 1. Player (Andi Pratama / Siswa)
    const player: AvatarData = {
      id: 'siswa',
      role: 'siswa',
      handle: studentHandle || 'andi_pratama',
      roleLabel: 'Kamu',
      wx: 1.5,
      wy: 1.8,
      targetWx: 1.5,
      targetWy: 1.8,
      speed: 2.2, // Natural, relaxed walking pace
      shirtColor: '#3b82f6', // Blue shirt
      pantsColor: '#1e293b', // Dark pants
      hairColor: studentGender === 'P' ? '#78350f' : '#0f172a',
      isMoving: false,
      pauseTimer: 0,
      walkFrame: 0,
      facing: 'down-left',
    };

    // 2. Guru (@ibu_rahmawati [GURU])
    const guru: AvatarData = {
      id: 'guru',
      role: 'guru',
      handle: 'ibu_rahmawati',
      roleLabel: 'GURU',
      wx: 1.8,
      wy: -1.5,
      targetWx: 1.8,
      targetWy: -1.5,
      speed: 2.0,
      shirtColor: '#059669', // Teal green batik/blazer
      pantsColor: '#0f172a',
      hairColor: '#0f172a',
      isMoving: false,
      pauseTimer: 3,
      walkFrame: 0,
      facing: 'down-left',
      speechText: 'Semangat belajar dan terus berefleksi!',
      speechTimer: 5,
    };

    // 3. Siswa Lain (@bima_satria)
    const bima: AvatarData = {
      id: 'bima',
      role: 'polisi',
      handle: 'bima_satria',
      roleLabel: 'Warga',
      wx: -1.8,
      wy: 1.2,
      targetWx: -1.8,
      targetWy: 1.2,
      speed: 2.2,
      shirtColor: '#10b981', // Emerald shirt
      pantsColor: '#1e293b',
      hairColor: '#78350f',
      isMoving: false,
      pauseTimer: 2,
      walkFrame: 0,
      facing: 'down-right',
      speechText: 'Peta Kota Refleksi sangat rapi!',
      speechTimer: 6,
    };

    // 4. Siswa Lain (@siti_nurhaliza)
    const siti: AvatarData = {
      id: 'siti',
      role: 'petugas_kebersihan',
      handle: 'siti_nurhaliza',
      roleLabel: 'Warga',
      wx: 0,
      wy: -1.6,
      targetWx: 0,
      targetWy: -1.6,
      speed: 2.0,
      shirtColor: '#06b6d4', // Cyan shirt
      pantsColor: '#0f172a',
      hairColor: '#7c2d12',
      isMoving: false,
      pauseTimer: 4,
      walkFrame: 0,
      facing: 'down-left',
      speechText: 'Air mancur di tengah sangat segar!',
      speechTimer: 7,
    };

    // 5. Siswa Lain (@dia_putri)
    const dia: AvatarData = {
      id: 'dia',
      role: 'kurir',
      handle: 'dia_putri',
      roleLabel: 'Warga',
      wx: 0,
      wy: 1.5,
      targetWx: 0,
      targetWy: 1.5,
      speed: 2.4,
      shirtColor: '#ec4899', // Pink shirt
      pantsColor: '#1e293b',
      hairColor: '#0f172a',
      isMoving: false,
      pauseTimer: 2.5,
      walkFrame: 0,
      facing: 'up-right',
      speechText: 'Mau pesan roti dan kopi di kafe!',
      speechTimer: 4,
    };

    // 6. Barista Toko Roti & Kafe Warga
    const barista: AvatarData = {
      id: 'barista',
      role: 'barista',
      handle: 'barista_kiki',
      roleLabel: 'Barista',
      wx: -0.8,
      wy: 2.5,
      targetWx: -0.8,
      targetWy: 2.5,
      speed: 0,
      shirtColor: '#ea580c',
      pantsColor: '#1e293b',
      hairColor: '#0f172a',
      isMoving: false,
      pauseTimer: 99999,
      walkFrame: 0,
      facing: 'down-right',
      speechText: 'Kopi, roti, dan eskrim siap disajikan!',
      speechTimer: 6,
    };

    const npcs: AvatarData[] = [guru, bima, siti, dia, barista];

    // Cafe coordinates (Toko Roti & Kafe)
    const cafeWx = -0.5;
    const cafeWy = 2.4;

    // -----------------------------------------------------------
    // SKY & WEATHER ELEMENTS MATCHING SCREENSHOT
    // -----------------------------------------------------------
    // Puffy horizontal flat cumulus clouds in daytime
    const clouds: Cloud[] = [
      { x: width * 0.22, y: 110, w: 120, h: 36, speed: 8 },
      { x: width * 0.58, y: 60, w: 90, h: 28, speed: 10 },
      { x: width * 0.85, y: 130, w: 140, h: 42, speed: 7 },
    ];

    // Constellation / Diagonal star trails in nighttime matching screenshot
    const stars: Star[] = Array.from({ length: 60 }, (_, i) => ({
      x: (i * 24) % width + Math.random() * 20,
      y: (i * 14) % (height * 0.65) + Math.random() * 15,
      size: 1.5 + (i % 3) * 0.8,
      alpha: 0.4 + (i % 4) * 0.18,
    }));

    // Floating tiny glowing fireflies in nighttime (tightly orbiting trees)
    const fireflies: Firefly[] = Array.from({ length: 36 }, (_, i) => {
      const treeIndex = i % TREES_LIST.length;
      return {
        treeIndex,
        angle: Math.random() * Math.PI * 2,
        radius: 0.32 + Math.random() * 0.45,
        speed: (0.75 + Math.random() * 0.85) * (Math.random() > 0.5 ? 1 : -1),
        altitude: 18 + Math.random() * 16,
        altitudeWave: 1.2 + Math.random() * 1.8,
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: 1.8 + Math.random() * 2.5,
      };
    });

    let pendingBuildingId: BuildingId | null = null;
    let hoveredBuildingRef: BuildingInfo | null = null;

    // -----------------------------------------------------------
    // POINTER INTERACTIONS (Click / Touch)
    // -----------------------------------------------------------
    const getPointerWorldPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return { sx, sy, ...toWorld(sx, sy, camera.x, camera.y) };
    };

    const handlePointerAction = (clientX: number, clientY: number) => {
      const { wx, wy } = getPointerWorldPos(clientX, clientY);

      // 1. Check Click on Cafe Stall (Toko Roti & Kafe)
      const cafeDist = Math.hypot(wx - cafeWx, wy - cafeWy);
      if (cafeDist < 1.8) {
        sounds.playClick();
        player.targetWx = -0.5;
        player.targetWy = 1.4; // Counter front outside obstacle
        player.isMoving = true;
        pendingBuildingId = null;
        lastTouchedIdRef.current = 'cafe';
        setPendingConfirmation({
          type: 'cafe',
          id: 'cafe',
          name: 'Toko Roti & Kafe Warga',
          tagline: 'Kopi hangat, roti lezat & eskrim menyegarkan',
          icon: '☕',
        });
        return;
      }

      // 2. Check Click on Buildings
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        const dist = Math.hypot(wx - bx, wy - by);
        if (dist < 2.1 || (Math.abs(wx - bx) < 1.7 && Math.abs(wy - by) < 1.7)) {
          sounds.playClick();
          // Walk to doorstep outside solid collision zone
          if (b.id === 'balai_kota') {
            player.targetWx = 0;
            player.targetWy = -3.0;
          } else if (b.id === 'menara_mentor') {
            player.targetWx = 2.9;
            player.targetWy = 0;
          } else if (b.id === 'perpustakaan') {
            player.targetWx = -2.9;
            player.targetWy = 0;
          } else if (b.id === 'monumen_warga') {
            player.targetWx = 0;
            player.targetWy = 1.25;
          } else {
            player.targetWx = bx * 0.68;
            player.targetWy = by * 0.68;
          }
          player.isMoving = true;
          pendingBuildingId = b.id;
          lastTouchedIdRef.current = null;
          return;
        }
      }

      // 3. Click on ground to walk
      sounds.playClick();
      let targetX = Math.max(-4.9, Math.min(4.9, wx));
      let targetY = Math.max(-4.9, Math.min(4.9, wy));
      if (isSolidCollision(targetX, targetY, 0.1)) {
        // Nudge slightly towards player's current location to remain outside
        const dirX = player.wx - targetX;
        const dirY = player.wy - targetY;
        const d = Math.hypot(dirX, dirY) || 1;
        targetX += (dirX / d) * 0.6;
        targetY += (dirY / d) * 0.6;
      }
      player.targetWx = targetX;
      player.targetWy = targetY;
      player.isMoving = true;
      pendingBuildingId = null;
      lastTouchedIdRef.current = null;
    };

    let lastTouchTime = 0;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const now = performance.now();
      if (now - lastTouchTime < 180) return;
      lastTouchTime = now;

      let clientX = (e as MouseEvent).clientX;
      let clientY = (e as MouseEvent).clientY;
      if ('touches' in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      handlePointerAction(clientX, clientY);
    };

    const onPointerMove = (e: MouseEvent) => {
      const { wx, wy } = getPointerWorldPos(e.clientX, e.clientY);

      if (Math.hypot(wx - cafeWx, wy - cafeWy) < 1.8) {
        canvas.style.cursor = 'pointer';
        hoveredBuildingRef = null;
        setHoveredBuilding(null);
        return;
      }

      let found: BuildingInfo | null = null;
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        if (Math.hypot(wx - bx, wy - by) < 1.8) {
          found = b;
          break;
        }
      }

      hoveredBuildingRef = found;
      setHoveredBuilding(found);
      canvas.style.cursor = found ? 'pointer' : 'default';
    };

    canvas.addEventListener('click', onPointerDown);
    canvas.addEventListener('mousemove', onPointerMove);

    // Initial camera position centered on student
    camera.x = (player.wx - player.wy) * BASE_TILE_W * zoomLevelRef.current;
    camera.y = (player.wx + player.wy) * BASE_TILE_H * zoomLevelRef.current;

    // -----------------------------------------------------------
    // TREE POSITIONS MATCHING SCREENSHOT EXACTLY
    // (Lush double-sphere trees along outer perimeter and plaza edges)
    // -----------------------------------------------------------
    const trees = TREES_LIST;

    // -----------------------------------------------------------
    // MAIN RENDER LOOP
    // -----------------------------------------------------------
    let animId: number;
    let lastTime = performance.now();
    let beaconBlink = 0;

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const elapsed = currentTime / 1000;
      beaconBlink += delta * 4;

      const isNight =
        timeOfDayRef.current === 'night' ||
        (timeOfDayRef.current === 'auto' && (new Date().getHours() >= 18 || new Date().getHours() < 6));

      const currentTileW = BASE_TILE_W * zoomLevelRef.current;
      const currentTileH = BASE_TILE_H * zoomLevelRef.current;

      // Handle Reset Camera to Player
      if (resetCameraRequestedRef.current) {
        resetCameraRequestedRef.current = false;
        camera.x = (player.wx - player.wy) * currentTileW;
        camera.y = (player.wx + player.wy) * currentTileH;
      }

      // Smooth camera follow avatar
      camera.targetX = (player.wx - player.wy) * currentTileW;
      camera.targetY = (player.wx + player.wy) * currentTileH;
      camera.x += (camera.targetX - camera.x) * (delta * 4.5);
      camera.y += (camera.targetY - camera.y) * (delta * 4.5);

      // Update Player Movement (Natural relaxed cadence, obstacle sliding & non-blocking touch trigger)
      if (player.isMoving) {
        const dx = player.targetWx - player.wx;
        const dy = player.targetWy - player.wy;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.12) {
          const step = Math.min(dist, player.speed * delta);
          const stepX = (dx / dist) * step;
          const stepY = (dy / dist) * step;

          const nextWx = player.wx + stepX;
          const nextWy = player.wy + stepY;

          // Solid obstacle collision check with wall sliding
          if (!isSolidCollision(nextWx, nextWy, 0.16)) {
            player.wx = nextWx;
            player.wy = nextWy;
            player.walkFrame += delta * 7.5;
          } else {
            // Wall sliding: try X movement only
            const canMoveX = !isSolidCollision(nextWx, player.wy, 0.16);
            // Wall sliding: try Y movement only
            const canMoveY = !isSolidCollision(player.wx, nextWy, 0.16);

            if (canMoveX) {
              player.wx = nextWx;
              player.walkFrame += delta * 7.5;
            } else if (canMoveY) {
              player.wy = nextWy;
              player.walkFrame += delta * 7.5;
            } else {
              // Blocked completely by building wall
              player.isMoving = false;
              player.walkFrame = 0;
            }
          }

          if (dx >= 0 && dy >= 0) player.facing = 'down-right';
          else if (dx < 0 && dy >= 0) player.facing = 'down-left';
          else if (dx >= 0 && dy < 0) player.facing = 'up-right';
          else player.facing = 'up-left';

          // Proximity touch check: show confirmation popup at top WITHOUT interrupting player movement!
          let touchedBuilding: BuildingInfo | null = null;
          for (const b of BUILDINGS_INFO) {
            const [bx, , by] = b.position;
            const bDist = Math.hypot(player.wx - bx, player.wy - by);
            const threshold = b.id === 'monumen_warga' ? 1.4 : 1.7;
            if (bDist < threshold) {
              touchedBuilding = b;
              break;
            }
          }

          const cafeDist = Math.hypot(player.wx - cafeWx, player.wy - cafeWy);
          if (cafeDist < 1.6) {
            if (lastTouchedIdRef.current !== 'cafe') {
              lastTouchedIdRef.current = 'cafe';
              sounds.playClick();
              setPendingConfirmation({
                type: 'cafe',
                id: 'cafe',
                name: 'Toko Roti & Kafe Warga',
                tagline: 'Kopi hangat, roti lezat & eskrim menyegarkan',
                icon: '☕',
              });
            }
          } else if (touchedBuilding) {
            if (lastTouchedIdRef.current !== touchedBuilding.id) {
              lastTouchedIdRef.current = touchedBuilding.id;
              sounds.playClick();
              setPendingConfirmation({
                type: 'building',
                id: touchedBuilding.id,
                name: touchedBuilding.name,
                tagline: touchedBuilding.tagline,
                icon: touchedBuilding.icon,
                color: touchedBuilding.color,
              });
            }
          } else if (lastTouchedIdRef.current) {
            // Player has moved away from building/cafe: auto-dismiss top popup
            const prevId = lastTouchedIdRef.current;
            let away = false;
            if (prevId === 'cafe') {
              if (cafeDist > 2.0) away = true;
            } else {
              const prevB = BUILDINGS_INFO.find((b) => b.id === prevId);
              if (prevB) {
                const d = Math.hypot(player.wx - prevB.position[0], player.wy - prevB.position[2]);
                if (d > 2.1) away = true;
              }
            }
            if (away) {
              lastTouchedIdRef.current = null;
              setPendingConfirmation(null);
            }
          }
        } else {
          player.isMoving = false;
          player.walkFrame = 0;
          if (pendingBuildingId) {
            const chosen = pendingBuildingId;
            pendingBuildingId = null;
            lastTouchedIdRef.current = chosen;
            const bInfo = BUILDINGS_INFO.find((b) => b.id === chosen);
            if (bInfo) {
              sounds.playClick();
              setPendingConfirmation({
                type: 'building',
                id: bInfo.id,
                name: bInfo.name,
                tagline: bInfo.tagline,
                icon: bInfo.icon,
                color: bInfo.color,
              });
            }
          }
        }
      }

      // Update NPCs
      npcs.forEach((npc) => {
        if (npc.speed === 0) return;

        if (npc.speechTimer && npc.speechTimer > 0) {
          npc.speechTimer -= delta;
          if (npc.speechTimer <= 0) npc.speechText = undefined;
        }

        if (!npc.isMoving) {
          npc.pauseTimer -= delta;
          if (npc.pauseTimer <= 0) {
            npc.isMoving = true;
            const angle = Math.random() * Math.PI * 2;
            const dist = 1.0 + Math.random() * 2.5;
            npc.targetWx = Math.max(-4.5, Math.min(4.5, npc.wx + Math.cos(angle) * dist));
            npc.targetWy = Math.max(-4.5, Math.min(4.5, npc.wy + Math.sin(angle) * dist));
          }
        } else {
          const dx = npc.targetWx - npc.wx;
          const dy = npc.targetWy - npc.wy;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.15) {
            const step = Math.min(dist, npc.speed * delta);
            npc.wx += (dx / dist) * step;
            npc.wy += (dy / dist) * step;
            npc.walkFrame += delta * 10;
            if (dx >= 0) npc.facing = 'down-right';
            else npc.facing = 'down-left';
          } else {
            npc.isMoving = false;
            npc.walkFrame = 0;
            npc.pauseTimer = 3 + Math.random() * 4;
          }
        }
      });

      // ---------------------------------------------------------
      // 1. SKY BACKGROUND (Matching Screenshot Colors)
      // ---------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      if (!isNight) {
        // DAYTIME: Clean sky blue `#7ec8f8`
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(0, 0, width, height);

        // Fluffy pill cumulus clouds
        clouds.forEach((cloud) => {
          cloud.x += cloud.speed * delta;
          if (cloud.x > width + 100) cloud.x = -150;

          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(cloud.x, cloud.y, cloud.w, cloud.h, cloud.h / 2);
          ctx.fill();
        });

        // Cartoon Sun in Top-Right with Triangular Rays (Exact Match)
        const sunX = width - 90;
        const sunY = 75;
        const sunRadius = 26;

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // 10 Triangular Radiating Sun Rays
        ctx.fillStyle = '#fde047';
        for (let r = 0; r < 10; r++) {
          const angle = (r / 10) * Math.PI * 2 + elapsed * 0.1;
          const rInner = sunRadius + 4;
          const rOuter = sunRadius + 16;
          const p1x = sunX + Math.cos(angle - 0.12) * rInner;
          const p1y = sunY + Math.sin(angle - 0.12) * rInner;
          const p2x = sunX + Math.cos(angle) * rOuter;
          const p2y = sunY + Math.sin(angle) * rOuter;
          const p3x = sunX + Math.cos(angle + 0.12) * rInner;
          const p3y = sunY + Math.sin(angle + 0.12) * rInner;

          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(p2x, p2y);
          ctx.lineTo(p3x, p3y);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // NIGHTTIME: Solid pitch dark space `#0b101b`
        ctx.fillStyle = '#0b101b';
        ctx.fillRect(0, 0, width, height);

        // Diagonal constellation star trail (Exact Match to Screenshot 2)
        stars.forEach((star) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Bright Crescent Moon in Top-Right
        const moonX = width - 85;
        const moonY = 65;
        const moonR = 24;

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0b101b';
        ctx.beginPath();
        ctx.arc(moonX + 8, moonY - 3, moonR * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---------------------------------------------------------
      // 2. ISOMETRIC CHECKERBOARD / TILE GRID PLATFORM
      // (11x11 Grid, Green Lawn & Cream Paved Pathways)
      // ---------------------------------------------------------
      const GRID_RADIUS = 5; // -5 to +5 tiles

      const grassColor = isNight ? '#163323' : '#4a7c52';
      const grassBorder = isNight ? '#0f241a' : '#3d6944';
      const pathColor = isNight ? '#334155' : '#fcfaf2';
      const pathBorder = isNight ? '#475569' : '#e5dfd0';

      // Helper to check if tile (gx, gy) is a paved walkway
      const isPathway = (gx: number, gy: number) => {
        // Outer loop road at |gx| == 3 or |gy| == 3
        if (Math.abs(gx) === 3 && Math.abs(gy) <= 3) return true;
        if (Math.abs(gy) === 3 && Math.abs(gx) <= 3) return true;
        // Connecting central spokes to north/south/east/west
        if (gx === 0 && Math.abs(gy) <= 4) return true;
        if (gy === 0 && Math.abs(gx) <= 4) return true;
        // Central ring
        if (Math.abs(gx) <= 1 && Math.abs(gy) <= 1) return true;
        return false;
      };

      // Draw all isometric base tiles
      for (let gy = -GRID_RADIUS; gy <= GRID_RADIUS; gy++) {
        for (let gx = -GRID_RADIUS; gx <= GRID_RADIUS; gx++) {
          const pN = toScreen(gx - 0.5, gy - 0.5, 0, camera.x, camera.y);
          const pE = toScreen(gx + 0.5, gy - 0.5, 0, camera.x, camera.y);
          const pS = toScreen(gx + 0.5, gy + 0.5, 0, camera.x, camera.y);
          const pW = toScreen(gx - 0.5, gy + 0.5, 0, camera.x, camera.y);

          const isRoad = isPathway(gx, gy);
          ctx.fillStyle = isRoad ? pathColor : grassColor;
          ctx.strokeStyle = isRoad ? pathBorder : grassBorder;
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(pN.x, pN.y);
          ctx.lineTo(pE.x, pE.y);
          ctx.lineTo(pS.x, pS.y);
          ctx.lineTo(pW.x, pW.y);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
      }

      // Outer platform border line
      const cornerN = toScreen(-GRID_RADIUS - 0.5, -GRID_RADIUS - 0.5, 0, camera.x, camera.y);
      const cornerE = toScreen(GRID_RADIUS + 0.5, -GRID_RADIUS - 0.5, 0, camera.x, camera.y);
      const cornerS = toScreen(GRID_RADIUS + 0.5, GRID_RADIUS + 0.5, 0, camera.x, camera.y);
      const cornerW = toScreen(-GRID_RADIUS - 0.5, GRID_RADIUS + 0.5, 0, camera.x, camera.y);

      ctx.strokeStyle = isNight ? '#0a1610' : '#2d4e33';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cornerN.x, cornerN.y);
      ctx.lineTo(cornerE.x, cornerE.y);
      ctx.lineTo(cornerS.x, cornerS.y);
      ctx.lineTo(cornerW.x, cornerW.y);
      ctx.closePath();
      ctx.stroke();

      // ---------------------------------------------------------
      // 3. CENTER PLAZA FOUNTAIN (Circular Stepped Pool)
      // ---------------------------------------------------------
      const centerPt = toScreen(0, 0, 0, camera.x, camera.y);
      const poolRadiusX = 48 * zoomLevelRef.current;
      const poolRadiusY = 24 * zoomLevelRef.current;

      // Outer stone rim
      ctx.fillStyle = isNight ? '#475569' : '#e2e8f0';
      ctx.beginPath();
      ctx.ellipse(centerPt.x, centerPt.y, poolRadiusX + 8, poolRadiusY + 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Clear cyan water pool
      ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
      ctx.beginPath();
      ctx.ellipse(centerPt.x, centerPt.y, poolRadiusX, poolRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();

      // Concentric water ripple
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(
        centerPt.x,
        centerPt.y,
        (poolRadiusX * 0.5) + Math.sin(elapsed * 3) * 6,
        (poolRadiusY * 0.5) + Math.sin(elapsed * 3) * 3,
        0,
        0,
        Math.PI * 2
      );
      ctx.stroke();

      // Center fountain spout
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerPt.x, centerPt.y - 4, 3, 0, Math.PI * 2);
      ctx.fill();

      // ---------------------------------------------------------
      // 3.5 STREET LIGHTING (Warm Illuminated Pools along Roads at Night)
      // ---------------------------------------------------------
      if (isNight) {
        const z = zoomLevelRef.current;
        STREET_LAMPS_LIST.forEach(([lx, ly]) => {
          const pt = toScreen(lx, ly, 0, camera.x, camera.y);
          const poolRadiusX = 42 * z;
          const poolRadiusY = 21 * z;

          // Warm radiating pool on cobblestones
          const lightGrad = ctx.createRadialGradient(pt.x, pt.y, 2 * z, pt.x, pt.y, poolRadiusX);
          lightGrad.addColorStop(0, 'rgba(254, 240, 138, 0.42)');
          lightGrad.addColorStop(0.28, 'rgba(250, 204, 21, 0.22)');
          lightGrad.addColorStop(0.65, 'rgba(234, 179, 8, 0.07)');
          lightGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');

          ctx.fillStyle = lightGrad;
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, poolRadiusX, poolRadiusY, 0, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ---------------------------------------------------------
      // 4. DRAW 3D ISOMETRIC BUILDINGS, TREES, AVATARS & LAMPS (Depth-Sorted)
      // ---------------------------------------------------------
      type DrawItem =
        | { type: 'building'; info: BuildingInfo; depth: number }
        | { type: 'cafe'; depth: number }
        | { type: 'avatar'; data: AvatarData; isPlayer: boolean; depth: number }
        | { type: 'tree'; wx: number; wy: number; depth: number }
        | { type: 'lamp'; wx: number; wy: number; depth: number };

      const drawItems: DrawItem[] = [];

      BUILDINGS_INFO.forEach((b) => {
        if (b.id === 'monumen_warga') return; // drawn as fountain
        drawItems.push({ type: 'building', info: b, depth: b.position[0] + b.position[2] });
      });

      drawItems.push({ type: 'cafe', depth: cafeWx + cafeWy });

      drawItems.push({ type: 'avatar', data: player, isPlayer: true, depth: player.wx + player.wy });

      npcs.forEach((npc) => {
        drawItems.push({ type: 'avatar', data: npc, isPlayer: false, depth: npc.wx + npc.wy });
      });

      trees.forEach(([tx, ty]) => {
        drawItems.push({ type: 'tree', wx: tx, wy: ty, depth: tx + ty });
      });

      STREET_LAMPS_LIST.forEach(([lx, ly]) => {
        drawItems.push({ type: 'lamp', wx: lx, wy: ly, depth: lx + ly });
      });

      drawItems.sort((a, b) => a.depth - b.depth);

      // Render Each Item
      drawItems.forEach((item) => {
        if (item.type === 'tree') {
          // Double-Sphere Tree (Noticeably Enlarged, Lush & Sculpted matching screenshot)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Ground shadow (enlarged)
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 2, pt.y + 2, 22 * z, 11 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Brown sturdy trunk with depth shading
          ctx.fillStyle = isNight ? '#381602' : '#6a2f0c';
          ctx.fillRect(pt.x - 3.5 * z, pt.y - 24 * z, 7 * z, 24 * z);
          // Trunk shadow side
          ctx.fillStyle = isNight ? '#240e01' : '#451a03';
          ctx.fillRect(pt.x + 0.5 * z, pt.y - 24 * z, 3 * z, 24 * z);

          // Lower large sphere (Teal/Emerald green with isometric shading)
          ctx.fillStyle = isNight ? '#064e3b' : '#059669';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 32 * z, 22 * z, 0, Math.PI * 2);
          ctx.fill();

          // Lower sphere highlight
          ctx.fillStyle = isNight ? '#047857' : '#10b981';
          ctx.beginPath();
          ctx.arc(pt.x - 4 * z, pt.y - 36 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper overlapping bright mint/lime sphere
          ctx.fillStyle = isNight ? '#047857' : '#10b981';
          ctx.beginPath();
          ctx.arc(pt.x + 1 * z, pt.y - 48 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper sphere soft top highlight
          ctx.fillStyle = isNight ? '#059669' : '#34d399';
          ctx.beginPath();
          ctx.arc(pt.x - 2 * z, pt.y - 52 * z, 11 * z, 0, Math.PI * 2);
          ctx.fill();

          // Top foliage bud
          ctx.fillStyle = isNight ? '#10b981' : '#6ee7b7';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 59 * z, 6 * z, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'building') {
          const b = item.info;
          const [bx, , by] = b.position;
          const pt = toScreen(bx, by, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const isHovered = hoveredBuildingRef?.id === b.id;

          // Realistic building shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 5, pt.y + 6, 44 * z, 22 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          if (b.id === 'balai_kota') {
            // NORTH: GEDUNG KUBAH EMAS (Balai Kota - High Architectural Detail)
            // 3-step marble plinth base
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(pt.x - 40 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 36 * z);
            ctx.lineTo(pt.x + 40 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x + 40 * z, pt.y + 24 * z);
            ctx.lineTo(pt.x, pt.y + 44 * z);
            ctx.lineTo(pt.x - 40 * z, pt.y + 24 * z);
            ctx.closePath();
            ctx.fill();

            // Main white neoclassical structure
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 40 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 36 * z);
            ctx.lineTo(pt.x - 36 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Left shaded wall
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 40 * z);
            ctx.lineTo(pt.x, pt.y + 36 * z);
            ctx.lineTo(pt.x - 36 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Neoclassical fluted columns on entrance facade
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            for (let c = -30; c <= -6; c += 8) {
              ctx.fillRect(pt.x + c * z, pt.y - 14 * z, 5 * z, 34 * z);
              ctx.strokeRect(pt.x + c * z, pt.y - 14 * z, 5 * z, 34 * z);
              // Column capitals
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(pt.x + (c - 1) * z, pt.y - 16 * z, 7 * z, 3 * z);
              ctx.fillRect(pt.x + (c - 1) * z, pt.y + 18 * z, 7 * z, 3 * z);
              ctx.fillStyle = '#ffffff';
            }

            // Arched grand double doors in center
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(pt.x - 17 * z, pt.y + 4 * z, 6 * z, Math.PI, 0);
            ctx.rect(pt.x - 23 * z, pt.y + 4 * z, 12 * z, 16 * z);
            ctx.fill();
            // Door frame & gold brass knobs
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(pt.x - 19 * z, pt.y + 12 * z, 1.2 * z, 0, Math.PI * 2);
            ctx.arc(pt.x - 15 * z, pt.y + 12 * z, 1.2 * z, 0, Math.PI * 2);
            ctx.fill();

            // Right wall multi-pane reflective windows
            ctx.fillStyle = '#38bdf8';
            for (let r = 0; r < 2; r++) {
              for (let col = 7; col <= 27; col += 10) {
                const wx = pt.x + col * z;
                const wy = pt.y - (6 - r * 16) * z;
                ctx.fillRect(wx, wy, 6 * z, 10 * z);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8 * z;
                ctx.strokeRect(wx, wy, 6 * z, 10 * z);
              }
            }

            // Pediment triangular gable
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x - 16 * z, pt.y - 34 * z);
            ctx.lineTo(pt.x, pt.y - 20 * z);
            ctx.closePath();
            ctx.fill();

            // Golden Dome on top with embossed ribs
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 40 * z, 20 * z, Math.PI, 0);
            ctx.fill();

            // Golden dome highlight sheen
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(pt.x - 5 * z, pt.y - 44 * z, 13 * z, Math.PI, 0);
            ctx.fill();

            // Vertical ribs on dome
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.5 * z;
            for (const offset of [-14, -7, 0, 7, 14]) {
              ctx.beginPath();
              ctx.moveTo(pt.x + offset * z, pt.y - 40 * z);
              ctx.quadraticCurveTo(
                pt.x + offset * 0.4 * z,
                pt.y - 54 * z,
                pt.x,
                pt.y - 60 * z
              );
              ctx.stroke();
            }

            // Grand Golden Spire with finial ball
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 3 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 60 * z);
            ctx.lineTo(pt.x, pt.y - 74 * z);
            ctx.stroke();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 75 * z, 3 * z, 0, Math.PI * 2);
            ctx.fill();

            // Red-and-White Flag on Left Post
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 34 * z, pt.y + 12 * z);
            ctx.lineTo(pt.x - 34 * z, pt.y - 28 * z);
            ctx.stroke();
            // Flag cloth
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pt.x - 33 * z, pt.y - 28 * z, 10 * z, 5 * z);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 33 * z, pt.y - 23 * z, 10 * z, 5 * z);

            // Gilded Brass Plaque in front
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 16 * z, pt.y + 32 * z, 32 * z, 9 * z);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 1 * z;
            ctx.strokeRect(pt.x - 16 * z, pt.y + 32 * z, 32 * z, 9 * z);
            ctx.fillStyle = '#facc15';
            ctx.font = `bold ${Math.round(6.5 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('BALAI KOTA', pt.x, pt.y + 39 * z);
          } else if (b.id === 'menara_mentor') {
            // EAST: DEWAN KOTA & TELECOM TRANSMISSION TOWER
            // Base hall
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 30 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 34 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Shaded left wall
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 30 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 34 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Two green ribbed vaulted roof arches
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(pt.x - 10 * z, pt.y - 30 * z, 11 * z, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pt.x + 10 * z, pt.y - 30 * z, 11 * z, Math.PI, 0);
            ctx.fill();

            // Rib stripes on green roofs
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 1.5 * z;
            for (let ro = -5; ro <= 5; ro += 4) {
              ctx.beginPath();
              ctx.arc(pt.x - 10 * z, pt.y - 30 * z, 11 * z, Math.PI + (ro * 0.1), -(ro * 0.1));
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(pt.x + 10 * z, pt.y - 30 * z, 11 * z, Math.PI + (ro * 0.1), -(ro * 0.1));
              ctx.stroke();
            }

            // Blue arched glass portal doors
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(pt.x - 12 * z, pt.y + 16 * z, 5 * z, Math.PI, 0);
            ctx.rect(pt.x - 17 * z, pt.y + 16 * z, 10 * z, 12 * z);
            ctx.fill();

            // Illuminated Red "● ON AIR" Badge
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(pt.x + 6 * z, pt.y - 12 * z, 22 * z, 9 * z, 3 * z);
            ctx.fill();
            ctx.strokeStyle = '#fca5a5';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
            // Blinking neon text
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(5.5 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('● ON AIR', pt.x + 17 * z, pt.y - 5.5 * z);

            // Tall 4-tier Telecom Transmission Lattice Tower
            const towerX = pt.x + 38 * z;
            const towerY = pt.y + 12 * z;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2.5 * z;
            ctx.beginPath();
            ctx.moveTo(towerX - 12 * z, towerY);
            ctx.lineTo(towerX, towerY - 68 * z);
            ctx.lineTo(towerX + 12 * z, towerY);
            ctx.stroke();

            // Tower horizontal bars and diagonal X-braces
            ctx.lineWidth = 1.2 * z;
            for (let b = 1; b <= 5; b++) {
              const ty1 = towerY - (b - 1) * 13 * z;
              const ty2 = towerY - b * 13 * z;
              const w1 = (1 - (b - 1) / 6) * 12 * z;
              const w2 = (1 - b / 6) * 12 * z;
              ctx.beginPath();
              ctx.moveTo(towerX - w2, ty2);
              ctx.lineTo(towerX + w2, ty2);
              // X brace
              ctx.moveTo(towerX - w1, ty1);
              ctx.lineTo(towerX + w2, ty2);
              ctx.moveTo(towerX + w1, ty1);
              ctx.lineTo(towerX - w2, ty2);
              ctx.stroke();
            }

            // Blinking Red Aviation Beacon with Pulsed Glow Aura
            const beaconIsOn = Math.floor(beaconBlink) % 2 === 0;
            if (beaconIsOn) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
              ctx.beginPath();
              ctx.arc(towerX, towerY - 70 * z, 8 * z, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = beaconIsOn ? '#ef4444' : '#7f1d1d';
            ctx.beginPath();
            ctx.arc(towerX, towerY - 70 * z, 4 * z, 0, Math.PI * 2);
            ctx.fill();

            // Parabolic satellite dish mounted on tower
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            ctx.arc(towerX - 6 * z, towerY - 42 * z, 6 * z, -0.6, 1.8);
            ctx.stroke();

            // Power Transformer box with warning diagonal hazard stripes
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(towerX - 24 * z, towerY - 14 * z, 15 * z, 14 * z);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(towerX - 22 * z, towerY - 12 * z, 11 * z, 4 * z);
          } else if (b.id === 'perpustakaan') {
            // WEST: PERPUSTAKAAN KAMPUS (Detailed Modern Blue Facade)
            // Main structure
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x, pt.y - 36 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 32 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Shaded left wall
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x, pt.y - 36 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 32 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Stepped deep sapphire blue parapet cornice
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x, pt.y - 38 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y - 15 * z);
            ctx.lineTo(pt.x, pt.y - 33 * z);
            ctx.lineTo(pt.x - 34 * z, pt.y - 15 * z);
            ctx.closePath();
            ctx.fill();

            // Blue square grid windows (4x2 on front, 4x2 on side) with book spine silhouettes
            ctx.fillStyle = '#38bdf8';
            for (let r = 0; r < 2; r++) {
              for (let c = -24; c <= -8; c += 8) {
                const wx = pt.x + c * z;
                const wy = pt.y - (4 - r * 14) * z;
                ctx.fillRect(wx, wy, 6 * z, 8 * z);
                // Glass frame
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8 * z;
                ctx.strokeRect(wx, wy, 6 * z, 8 * z);
              }
              for (let c = 8; c <= 24; c += 8) {
                const wx = pt.x + c * z;
                const wy = pt.y - (4 - r * 14) * z;
                ctx.fillRect(wx, wy, 6 * z, 8 * z);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8 * z;
                ctx.strokeRect(wx, wy, 6 * z, 8 * z);
              }
            }

            // Arched portico entrance with blue awning
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(pt.x - 8 * z, pt.y + 16 * z, 16 * z, 6 * z);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 6 * z, pt.y + 22 * z, 12 * z, 11 * z);

            // Planter box with green shrubs at entrance
            ctx.fillStyle = '#78350f';
            ctx.fillRect(pt.x - 22 * z, pt.y + 24 * z, 10 * z, 4 * z);
            ctx.fillRect(pt.x + 12 * z, pt.y + 24 * z, 10 * z, 4 * z);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(pt.x - 17 * z, pt.y + 23 * z, 5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 17 * z, pt.y + 23 * z, 5 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (b.id === 'pasar_prestasi') {
            // SOUTH-WEST: TOKO POIN (PASAR PRESTASI)
            // Boutique store body
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 32 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.lineTo(pt.x - 28 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Shaded left wall
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 32 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.lineTo(pt.x - 28 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();

            // Festive Red & White Scalloped Awning
            const awnW = 50 * z;
            for (let a = 0; a < 8; a++) {
              ctx.fillStyle = a % 2 === 0 ? '#ef4444' : '#ffffff';
              const ax = pt.x - 25 * z + a * (awnW / 8);
              ctx.fillRect(ax, pt.y + 6 * z, awnW / 8, 9 * z);
              // Scallop bottom curve
              ctx.beginPath();
              ctx.arc(ax + (awnW / 16), pt.y + 15 * z, awnW / 16, 0, Math.PI);
              ctx.fill();
            }

            // Large glass bay showcase window
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(pt.x - 20 * z, pt.y + 16 * z, 16 * z, 11 * z);
            ctx.strokeStyle = '#cbd5e1';
            ctx.strokeRect(pt.x - 20 * z, pt.y + 16 * z, 16 * z, 11 * z);

            // Golden Trophy Cup inside display
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(pt.x - 12 * z, pt.y + 20 * z, 3 * z, 0, Math.PI);
            ctx.rect(pt.x - 13 * z, pt.y + 23 * z, 2 * z, 3 * z);
            ctx.fill();

            // Entrance door
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x + 2 * z, pt.y + 16 * z, 12 * z, 13 * z);

            // Golden star badge above
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 8 * z, 5 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (b.id === 'bengkel_latihan') {
            // SOUTH-EAST: LAB DKV & TEFA (Modern Creative Workshop & Control Tower)
            // Workshop hangar with sawtooth industrial roof
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(pt.x - 30 * z, pt.y - 12 * z, 42 * z, 30 * z);

            // Blue top roof trim & sawtooth skylight
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(pt.x - 30 * z, pt.y - 18 * z, 42 * z, 6 * z);

            // Sawtooth triangles
            ctx.fillStyle = '#1d4ed8';
            for (let st = -28; st <= 2; st += 10) {
              ctx.beginPath();
              ctx.moveTo(pt.x + st * z, pt.y - 18 * z);
              ctx.lineTo(pt.x + (st + 8) * z, pt.y - 25 * z);
              ctx.lineTo(pt.x + (st + 8) * z, pt.y - 18 * z);
              ctx.closePath();
              ctx.fill();
            }

            // Hazard-striped roll-up shutter garage door
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 26 * z, pt.y + 2 * z, 24 * z, 15 * z);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1 * z;
            for (let hz = 0; hz < 5; hz++) {
              ctx.beginPath();
              ctx.moveTo(pt.x - 26 * z, pt.y + (3 + hz * 3) * z);
              ctx.lineTo(pt.x - 2 * z, pt.y + (3 + hz * 3) * z);
              ctx.stroke();
            }

            // Cylindrical Glass Control Tower with Blue Dome
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(pt.x + 14 * z, pt.y - 26 * z, 16 * z, 44 * z);
            // Glass observation windows on tower
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(pt.x + 15 * z, pt.y - 20 * z, 14 * z, 8 * z);

            // Dome on tower
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(pt.x + 22 * z, pt.y - 26 * z, 8 * z, Math.PI, 0);
            ctx.fill();

            // Rotating radar dish / antenna on tower
            const dishAngle = elapsed * 2;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 22 * z, pt.y - 34 * z);
            ctx.lineTo(pt.x + 22 * z, pt.y - 44 * z);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(
              pt.x + 22 * z,
              pt.y - 44 * z,
              6 * z,
              2.5 * z,
              dishAngle,
              0,
              Math.PI * 2
            );
            ctx.fill();
            ctx.stroke();
          } else if (b.id === 'kantor_pos') {
            // NORTH-EAST: KANTOR POS KILAT (Post Office)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 26 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 30 * z);
            ctx.lineTo(pt.x + 26 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x + 26 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.lineTo(pt.x - 26 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();

            // Classic crimson postal roof
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 34 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 24 * z);
            ctx.closePath();
            ctx.fill();

            // Pediment Town Clock
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 14 * z, 6 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
            // Clock hands
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 14 * z);
            ctx.lineTo(pt.x + 3 * z, pt.y - 14 * z);
            ctx.moveTo(pt.x, pt.y - 14 * z);
            ctx.lineTo(pt.x, pt.y - 17 * z);
            ctx.stroke();

            // Red pillar postbox in front
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.roundRect(pt.x + 14 * z, pt.y + 16 * z, 7 * z, 12 * z, 3 * z);
            ctx.fill();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x + 15 * z, pt.y + 19 * z, 5 * z, 1.5 * z); // mail slot

            // Service counter windows
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(pt.x - 18 * z, pt.y + 8 * z, 10 * z, 8 * z);
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 4 * z, pt.y + 16 * z, 10 * z, 13 * z);
          } else if (b.id === 'taman_refleksi') {
            // NORTH-WEST: TAMAN REFLEKSI (Rose Gazebo & Lotus Pond)
            // Octagonal rose marble gazebo platform
            ctx.fillStyle = '#fce7f3';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 20 * z, 0, Math.PI * 2);
            ctx.fill();

            // Lotus reflection pool
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 14 * z, 0, Math.PI * 2);
            ctx.fill();

            // Lotus flower in center
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();

            // Gazebo trellis pillars
            ctx.fillStyle = '#db2777';
            for (let a = 0; a < 4; a++) {
              const ang = (a * Math.PI) / 2 + 0.4;
              const px = pt.x + Math.cos(ang) * 16 * z;
              const py = pt.y + Math.sin(ang) * 16 * z;
              ctx.fillRect(px - 1.5 * z, py - 18 * z, 3 * z, 18 * z);
            }

            // Rose pagoda roof canopy
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.moveTo(pt.x - 20 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 32 * z);
            ctx.lineTo(pt.x + 20 * z, pt.y - 18 * z);
            ctx.closePath();
            ctx.fill();
          }

          // Floating Building Label with icon & smooth rounded badge
          const tagY = pt.y - 54 * z;
          const labelText = `${b.icon} ${b.name}`;
          ctx.font = `bold ${Math.round(10 * z)}px sans-serif`;
          const tMetrics = ctx.measureText(labelText);
          const tagW = tMetrics.width + 16 * z;
          const tagH = 20 * z;

          ctx.fillStyle = isHovered ? '#0f172a' : 'rgba(15, 23, 42, 0.88)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tagW / 2, tagY - tagH / 2, tagW, tagH, 10 * z);
          ctx.fill();
          ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(148, 163, 184, 0.6)';
          ctx.lineWidth = isHovered ? 2 : 1.2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pt.x, tagY);
        } else if (item.type === 'cafe') {
          // SOUTH: TOKO ROTI & KAFE WARGA (Enriched Bakery & Espresso Stall)
          const pt = toScreen(cafeWx, cafeWy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          setCafeScreenPos({
            x: pt.x,
            y: pt.y - 44 * z,
            visible: true,
          });

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 2, pt.y + 6, 28 * z, 14 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Stall body (Warm wood planks)
          ctx.fillStyle = '#d97706';
          ctx.fillRect(pt.x - 24 * z, pt.y - 14 * z, 48 * z, 22 * z);
          // Horizontal timber grain lines
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1 * z;
          for (let pl = -10; pl <= 6; pl += 4) {
            ctx.beginPath();
            ctx.moveTo(pt.x - 24 * z, pt.y + pl * z);
            ctx.lineTo(pt.x + 24 * z, pt.y + pl * z);
            ctx.stroke();
          }

          // Striped red-white awning with scalloped drape
          for (let s = 0; s < 6; s++) {
            ctx.fillStyle = s % 2 === 0 ? '#ef4444' : '#ffffff';
            const ax = pt.x - 24 * z + s * (48 * z / 6);
            ctx.fillRect(ax, pt.y - 24 * z, 48 * z / 6, 10 * z);
            // Scallop bottom
            ctx.beginPath();
            ctx.arc(ax + (4 * z), pt.y - 14 * z, 4 * z, 0, Math.PI);
            ctx.fill();
          }

          // Glass pastry display case on counter
          ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.fillRect(pt.x - 20 * z, pt.y - 12 * z, 18 * z, 8 * z);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8 * z;
          ctx.strokeRect(pt.x - 20 * z, pt.y - 12 * z, 18 * z, 8 * z);

          // Miniature croissants inside display
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(pt.x - 15 * z, pt.y - 8 * z, 2.5 * z, 0, Math.PI);
          ctx.arc(pt.x - 7 * z, pt.y - 8 * z, 2.5 * z, 0, Math.PI);
          ctx.fill();

          // Espresso machine on right counter
          ctx.fillStyle = '#334155';
          ctx.fillRect(pt.x + 6 * z, pt.y - 14 * z, 10 * z, 10 * z);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(pt.x + 8 * z, pt.y - 12 * z, 6 * z, 3 * z);

          // Animated rising steam wisps from espresso machine
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 1.2 * z;
          for (let st = 0; st < 2; st++) {
            const steamY = pt.y - (16 + ((elapsed * 12 + st * 10) % 18)) * z;
            const steamX = pt.x + (11 + st * 4) * z + Math.sin(elapsed * 4 + st) * 3 * z;
            ctx.beginPath();
            ctx.moveTo(steamX, steamY);
            ctx.lineTo(steamX + 1.5 * z, steamY - 4 * z);
            ctx.stroke();
          }

          // Signboard "TOKO ROTI & KAFE"
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pt.x - 18 * z, pt.y - 2 * z, 36 * z, 9 * z);
          ctx.strokeStyle = '#b45309';
          ctx.strokeRect(pt.x - 18 * z, pt.y - 2 * z, 36 * z, 9 * z);
          ctx.fillStyle = '#b45309';
          ctx.font = `bold ${Math.round(6 * z)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('TOKO ROTI & KAFE', pt.x, pt.y + 5 * z);

          // Outdoor cafe bistro table with parasol umbrella on left
          const tableX = pt.x - 36 * z;
          const tableY = pt.y + 4 * z;
          // Parasol umbrella
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(tableX, tableY - 18 * z, 12 * z, Math.PI, 0);
          ctx.fill();
          // Parasol pole
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.5 * z;
          ctx.beginPath();
          ctx.moveTo(tableX, tableY - 18 * z);
          ctx.lineTo(tableX, tableY);
          ctx.stroke();
          // Small round wooden tabletop
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(tableX, tableY - 6 * z, 8 * z, 4 * z, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'avatar') {
          // AVATARS (Smooth, Natural Leg Swing, Arm Swing, and Gentle Bobbing)
          const av = item.data;
          const pt = toScreen(av.wx, av.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Soft ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 1, pt.y + 1, 8 * z, 4 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Natural leg swing & gentle bobbing matching slow walking speed
          const legSwing = av.isMoving ? Math.sin(av.walkFrame) * 3.5 * z : 0;
          const avY = pt.y - (av.isMoving ? Math.abs(Math.sin(av.walkFrame * 2)) * 1.5 * z : 0);

          // Legs
          ctx.fillStyle = av.pantsColor;
          ctx.fillRect(pt.x - 3.5 * z, avY - 5 * z + legSwing, 3 * z, 6 * z);
          ctx.fillRect(pt.x + 0.5 * z, avY - 5 * z - legSwing, 3 * z, 6 * z);

          // Shoes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(pt.x - 4 * z, avY + 1 * z + legSwing, 3.5 * z, 2.5 * z);
          ctx.fillRect(pt.x, avY + 1 * z - legSwing, 3.5 * z, 2.5 * z);

          // Shirt / Torso
          ctx.fillStyle = av.shirtColor;
          ctx.beginPath();
          ctx.roundRect(pt.x - 5 * z, avY - 14 * z, 10 * z, 9.5 * z, 2.2 * z);
          ctx.fill();

          // Natural arm swing opposing leg movement
          const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 2.8 * z : 0;
          ctx.fillStyle = av.shirtColor;
          ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z - armSwing, 2.2 * z, 7 * z);
          ctx.fillRect(pt.x + 5 * z, avY - 13 * z + armSwing, 2.2 * z, 7 * z);

          // Hands
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(pt.x - 7.2 * z, avY - 6 * z - armSwing, 2.2 * z, 2.2 * z);
          ctx.fillRect(pt.x + 5 * z, avY - 6 * z + armSwing, 2.2 * z, 2.2 * z);

          // Head & Face
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(pt.x, avY - 18 * z, 5 * z, 0, Math.PI * 2);
          ctx.fill();

          // Hair
          ctx.fillStyle = av.hairColor;
          ctx.beginPath();
          ctx.arc(pt.x, avY - 21 * z, 5.2 * z, Math.PI, 0);
          ctx.fill();

          // Floating Username Tag Pill (Exact Match)
          const tagPosY = avY - 29 * z;
          let labelText = `@${av.handle}`;
          if (item.isPlayer) {
            labelText = `@${av.handle} (Kamu)`;
          }

          ctx.font = `bold ${Math.round(8.5 * z)}px sans-serif`;
          const tM = ctx.measureText(labelText);
          const tW = tM.width + 10 * z;
          const tH = 15 * z;

          // Tag Pill background
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tW / 2, tagPosY - tH / 2, tW, tH, 7 * z);
          ctx.fill();

          if (item.isPlayer) {
            ctx.strokeStyle = '#facc15'; // Gold highlight for player!
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = '#fde047'; // Yellow text
          } else {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
          }

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pt.x, tagPosY);

          // GURU Badge if Guru
          if (av.role === 'guru') {
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(pt.x - 14 * z, tagPosY + 10 * z, 28 * z, 10 * z, 4 * z);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(6.5 * z)}px sans-serif`;
            ctx.fillText('GURU', pt.x, tagPosY + 15 * z);
          }

          // Comic Speech Bubble
          let speech: string | undefined = av.speechText;
          if (item.isPlayer && playerSpeechRef.current && Date.now() < playerSpeechRef.current.expiresAt) {
            speech = playerSpeechRef.current.text;
          }
          if (av.role === 'barista' && baristaSpeechRef.current && Date.now() < baristaSpeechRef.current.expiresAt) {
            speech = baristaSpeechRef.current.text;
          }

          if (speech) {
            ctx.font = `bold ${Math.round(9 * z)}px sans-serif`;
            const sMetrics = ctx.measureText(speech);
            const sW = sMetrics.width + 14 * z;
            const sH = 20 * z;
            const bubbleY = tagPosY - 18 * z;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(pt.x - sW / 2, bubbleY - sH / 2, sW, sH, 10 * z);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(pt.x - 3, bubbleY + sH / 2);
            ctx.lineTo(pt.x + 3, bubbleY + sH / 2);
            ctx.lineTo(pt.x, bubbleY + sH / 2 + 4 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(speech, pt.x, bubbleY);
          }
        } else if (item.type === 'lamp') {
          // STREET LAMP POST (Cast Iron Classical Lamppost with Warm Glowing Lantern)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const lampHeight = 35 * z;

          // Small circular cast-iron base plate
          ctx.fillStyle = isNight ? '#1e293b' : '#475569';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, 4 * z, 2.2 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Dark cast iron pole
          ctx.strokeStyle = isNight ? '#0f172a' : '#334155';
          ctx.lineWidth = 2.4 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x, pt.y - lampHeight);
          ctx.stroke();

          // Decorative iron collar ring
          ctx.fillStyle = isNight ? '#334155' : '#64748b';
          ctx.fillRect(pt.x - 2.2 * z, pt.y - lampHeight * 0.42, 4.4 * z, 2.2 * z);

          // Horizontal iron bracket
          ctx.lineWidth = 1.8 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x - 4 * z, pt.y - lampHeight);
          ctx.lineTo(pt.x + 4 * z, pt.y - lampHeight);
          ctx.stroke();

          // Lantern housing
          const lanternY = pt.y - lampHeight - 3 * z;
          const lanternW = 7.5 * z;
          const lanternH = 9.5 * z;

          if (isNight) {
            // Bright radiating lantern halo
            const lanternGlow = ctx.createRadialGradient(pt.x, lanternY, 2 * z, pt.x, lanternY, 26 * z);
            lanternGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
            lanternGlow.addColorStop(0.25, 'rgba(254, 240, 138, 0.85)');
            lanternGlow.addColorStop(0.55, 'rgba(250, 204, 21, 0.42)');
            lanternGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');

            ctx.fillStyle = lanternGlow;
            ctx.beginPath();
            ctx.arc(pt.x, lanternY, 26 * z, 0, Math.PI * 2);
            ctx.fill();

            // Glowing warm yellow glass chamber
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.roundRect(pt.x - lanternW / 2, lanternY - lanternH / 2, lanternW, lanternH, 2 * z);
            ctx.fill();

            // White hot incandescent filament dot
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, lanternY, 1.8 * z, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Daytime frosted glass
            ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
            ctx.beginPath();
            ctx.roundRect(pt.x - lanternW / 2, lanternY - lanternH / 2, lanternW, lanternH, 2 * z);
            ctx.fill();
          }

          // Iron frame outline
          ctx.strokeStyle = isNight ? '#0a0f18' : '#1e293b';
          ctx.lineWidth = 1 * z;
          ctx.strokeRect(pt.x - lanternW / 2, lanternY - lanternH / 2, lanternW, lanternH);

          // Pyramid roof cap
          ctx.fillStyle = isNight ? '#0a0f18' : '#1e293b';
          ctx.beginPath();
          ctx.moveTo(pt.x - lanternW / 2 - 1.5 * z, lanternY - lanternH / 2);
          ctx.lineTo(pt.x, lanternY - lanternH / 2 - 4.5 * z);
          ctx.lineTo(pt.x + lanternW / 2 + 1.5 * z, lanternY - lanternH / 2);
          ctx.closePath();
          ctx.fill();

          // Finial tip
          ctx.beginPath();
          ctx.arc(pt.x, lanternY - lanternH / 2 - 5 * z, 1.2 * z, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // ---------------------------------------------------------
      // 5. NOCTURNAL GLOWING FIREFLIES (Kecil & Mengitari Pohon)
      // ---------------------------------------------------------
      if (isNight) {
        const z = zoomLevelRef.current;
        fireflies.forEach((f) => {
          f.angle += f.speed * delta;
          const tree = trees[f.treeIndex];
          const fx = tree[0] + Math.cos(f.angle) * f.radius;
          const fy = tree[1] + Math.sin(f.angle) * f.radius;
          const fAlt = f.altitude + Math.sin(elapsed * f.altitudeWave + f.phase) * 3.5;
          const fScreen = toScreen(fx, fy, fAlt, camera.x, camera.y);

          const blink = 0.35 + 0.65 * Math.max(0, Math.sin(elapsed * f.blinkSpeed + f.phase));
          const glowRadius = Math.max(3, 5 * z);

          // Delicate warm bioluminescent halo
          const glow = ctx.createRadialGradient(fScreen.x, fScreen.y, 0.5, fScreen.x, fScreen.y, glowRadius);
          glow.addColorStop(0, `rgba(254, 240, 138, ${blink * 0.9})`);
          glow.addColorStop(0.4, `rgba(190, 242, 100, ${blink * 0.5})`);
          glow.addColorStop(1, 'rgba(190, 242, 100, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(fScreen.x, fScreen.y, glowRadius, 0, Math.PI * 2);
          ctx.fill();

          // Tiny delicate glowing particle dot (0.9px - 1.1px)
          ctx.fillStyle = `rgba(255, 255, 255, ${blink})`;
          ctx.beginPath();
          ctx.arc(fScreen.x, fScreen.y, Math.max(0.7, 0.95 * z), 0, Math.PI * 2);
          ctx.fill();
        });
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', onPointerDown);
      canvas.removeEventListener('mousemove', onPointerMove);
    };
  }, [studentName, studentGender]);

  // -------------------------------------------------------------
  // KAFE ITEM PURCHASES (Deduct XP Saldo)
  // -------------------------------------------------------------
  const handleBuyCoffee = () => {
    const cost = 2;
    if (studentPoints < cost) {
      sounds.playClick();
      setCafeToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP, saldo kamu ${studentPoints} XP.`);
      setTimeout(() => setCafeToast(null), 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Kopi Hangat Kafe') : true;
    if (success) {
      sounds.playRewardXp();
      const remaining = studentPoints - cost;
      setCafeToast(`☕ Menikmati kopi hangat di Kafe Warga! (-2 XP) • Sisa Saldo: ${remaining} XP`);
      baristaSpeechRef.current = {
        text: `Kopi hangat siap, selamat menikmati! ☕ (-2 XP)`,
        expiresAt: Date.now() + 5000,
      };
      playerSpeechRef.current = {
        text: 'Mantap kopinya! ☕',
        expiresAt: Date.now() + 5000,
      };
      setTimeout(() => setCafeToast(null), 3800);
    }
  };

  const handleBuyBread = () => {
    const cost = 1;
    if (studentPoints < cost) {
      sounds.playClick();
      setCafeToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP, saldo kamu ${studentPoints} XP.`);
      setTimeout(() => setCafeToast(null), 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Roti Panggang Kafe') : true;
    if (success) {
      sounds.playRewardXp();
      const remaining = studentPoints - cost;
      setCafeToast(`🍞 Roti lezat baru dipanggang! (-1 XP) • Sisa Saldo: ${remaining} XP`);
      baristaSpeechRef.current = {
        text: `Roti hangat baru dipanggang! 🍞 (-1 XP)`,
        expiresAt: Date.now() + 5000,
      };
      playerSpeechRef.current = {
        text: 'Enak banget rotinya! 🍞',
        expiresAt: Date.now() + 5000,
      };
      setTimeout(() => setCafeToast(null), 3800);
    }
  };

  const handleBuyIceCream = () => {
    const cost = 1;
    if (studentPoints < cost) {
      sounds.playClick();
      setCafeToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP, saldo kamu ${studentPoints} XP.`);
      setTimeout(() => setCafeToast(null), 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Eskrim Kafe') : true;
    if (success) {
      sounds.playRewardXp();
      const remaining = studentPoints - cost;
      setCafeToast(`🍦 Eskrim manis menyegarkan harimu! (-1 XP) • Sisa Saldo: ${remaining} XP`);
      baristaSpeechRef.current = {
        text: `Eskrim manis spesial untukmu! 🍦 (-1 XP)`,
        expiresAt: Date.now() + 5000,
      };
      playerSpeechRef.current = {
        text: 'Segar banget eskrimnya! 🍦',
        expiresAt: Date.now() + 5000,
      };
      setTimeout(() => setCafeToast(null), 3800);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden touch-none"
      data-testid="town-canvas-reference-exact"
    >
      {/* Isometric Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* POP-UP KONFIRMASI MASUK BANGUNAN / KAFE (PADA BAGIAN ATAS, TANPA MENGGANGGU PERGERAKAN AVATAR) */}
      {pendingConfirmation && (
        <aside
          aria-label="Konfirmasi Masuk Bangunan"
          className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-md pointer-events-auto animate-fade-in-down"
        >
          <div className="bg-[#121e2c]/95 backdrop-blur-md border border-amber-400/50 rounded-2xl p-3 sm:p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3">
            {/* Left: Building Icon & Name */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 via-slate-800 to-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-sm">
                {pendingConfirmation.icon}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400 flex items-center gap-1">
                  <span>📍 Dekat Bangunan</span>
                </div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white truncate leading-tight">
                  {pendingConfirmation.name}
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-300 truncate">
                  {pendingConfirmation.tagline}
                </p>
              </div>
            </div>

            {/* Right: Enter and Dismiss Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  sounds.playOpenModal();
                  const target = pendingConfirmation;
                  setPendingConfirmation(null);
                  if (target.type === 'cafe') {
                    setIsCafeMenuOpen(true);
                  } else {
                    onSelectBuildingRef.current(target.id as BuildingId);
                  }
                }}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/30 border border-emerald-400/40 transition cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
              >
                <span>🚪 Masuk</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setPendingConfirmation(null);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-xs transition cursor-pointer"
                title="Abaikan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Floating Cafe Card ONLY when Touched/Clicked */}
      {isCafeMenuOpen && cafeScreenPos.visible && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto transition-transform animate-fade-in-up z-30"
          style={{ left: `${cafeScreenPos.x}px`, top: `${cafeScreenPos.y}px` }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#121e2c]/95 backdrop-blur-md text-white px-3.5 py-3 rounded-2xl border border-slate-700/80 shadow-[0_12px_36px_0_rgba(0,0,0,0.65)] flex flex-col items-center gap-2.5 min-w-[260px] max-w-[90vw]">
            <div className="w-full flex items-center justify-between border-b border-slate-700/70 pb-1.5">
              <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-white">Toko Roti & Kafe</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-mono text-[10px]">🪙 {studentPoints} XP</span>
              </div>
              <button
                onClick={() => setIsCafeMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Tutup Menu Kafe"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleBuyCoffee}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
              >
                <span className="text-base">☕</span>
                <span className="text-[10px] mt-0.5">Kopi (-2 XP)</span>
              </button>
              <button
                onClick={handleBuyBread}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
              >
                <span className="text-base">🍞</span>
                <span className="text-[10px] mt-0.5">Roti (-1 XP)</span>
              </button>
              <button
                onClick={handleBuyIceCream}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
              >
                <span className="text-base">🍦</span>
                <span className="text-[10px] mt-0.5">Eskrim (-1 XP)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Cafe Toast Notification */}
      {cafeToast && (
        <div className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 z-40 bg-[#121e2c]/95 backdrop-blur-md text-emerald-300 font-bold text-xs sm:text-sm px-4 py-2 rounded-full border border-emerald-500/40 shadow-2xl animate-fade-in-up flex items-center gap-2 max-w-[90vw] text-center">
          <span>✨</span>
          <span>{cafeToast}</span>
        </div>
      )}

      {/* BOTTOM-RIGHT ZOOM & CAMERA CONTROLS (Positioned cleanly above mobile chat input) */}
      <div className="absolute bottom-20 sm:bottom-6 right-3 sm:right-6 z-30 flex flex-col items-center gap-2 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-full bg-[#121e2c]/90 hover:bg-[#1c2c3e] text-white border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Perbesar Peta (+)"
        >
          <Plus className="w-4 h-4 text-slate-200" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-full bg-[#121e2c]/90 hover:bg-[#1c2c3e] text-white border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Perkecil Peta (-)"
        >
          <Minus className="w-4 h-4 text-slate-200" />
        </button>
        <button
          onClick={handleCenterOnPlayer}
          className="w-9 h-9 rounded-full bg-[#121e2c]/90 hover:bg-[#1c2c3e] text-rose-400 border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95 cursor-pointer"
          title="Fokus ke Posisi Saya"
        >
          <MapPin className="w-4 h-4 text-rose-400" />
        </button>
      </div>
    </div>
  );
});
