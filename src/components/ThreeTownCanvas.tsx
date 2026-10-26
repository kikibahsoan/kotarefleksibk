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

interface Firefly {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
  blinkSpeed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
}

export const ThreeTownCanvas: React.FC<ThreeTownCanvasProps> = ({
  onSelectBuilding,
  activeBuilding,
  newMateriBuildingIds,
  studentName = 'Siswa',
  studentGender = 'L',
  timeOfDay = 'night',
  latestMessage,
}) => {
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
      speed: 4.5,
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

    // Floating glowing fireflies in nighttime
    const fireflies: Firefly[] = Array.from({ length: 24 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 1.5 + Math.random() * 4.5;
      return {
        baseX: Math.cos(angle) * dist,
        baseY: Math.sin(angle) * dist,
        x: 0,
        y: 0,
        radius: 4 + Math.random() * 5,
        speed: 0.8 + Math.random() * 1.2,
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: 1.5 + Math.random() * 2.5,
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
        setIsCafeMenuOpen(true);
        player.targetWx = cafeWx;
        player.targetWy = cafeWy + 1.2;
        player.isMoving = true;
        pendingBuildingId = null;
        return;
      }

      // 2. Check Click on Buildings
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        const dist = Math.hypot(wx - bx, wy - by);
        if (dist < 2.0 || (Math.abs(wx - bx) < 1.7 && Math.abs(wy - by) < 1.7)) {
          sounds.playClick();
          player.targetWx = bx * 0.75;
          player.targetWy = by * 0.75;
          player.isMoving = true;
          pendingBuildingId = b.id;
          return;
        }
      }

      // 3. Click on ground to walk
      sounds.playClick();
      player.targetWx = Math.max(-5.2, Math.min(5.2, wx));
      player.targetWy = Math.max(-5.2, Math.min(5.2, wy));
      player.isMoving = true;
      pendingBuildingId = null;
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
    const trees: [number, number][] = [
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

      // Update Player Movement
      if (player.isMoving) {
        const dx = player.targetWx - player.wx;
        const dy = player.targetWy - player.wy;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.15) {
          const step = Math.min(dist, player.speed * delta);
          player.wx += (dx / dist) * step;
          player.wy += (dy / dist) * step;
          player.walkFrame += delta * 12;

          if (dx >= 0 && dy >= 0) player.facing = 'down-right';
          else if (dx < 0 && dy >= 0) player.facing = 'down-left';
          else if (dx >= 0 && dy < 0) player.facing = 'up-right';
          else player.facing = 'up-left';
        } else {
          player.isMoving = false;
          player.walkFrame = 0;
          if (pendingBuildingId) {
            const chosen = pendingBuildingId;
            pendingBuildingId = null;
            onSelectBuildingRef.current(chosen);
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
      // 4. DRAW 3D ISOMETRIC BUILDINGS, TREES, AVATARS (Depth-Sorted)
      // ---------------------------------------------------------
      type DrawItem =
        | { type: 'building'; info: BuildingInfo; depth: number }
        | { type: 'cafe'; depth: number }
        | { type: 'avatar'; data: AvatarData; isPlayer: boolean; depth: number }
        | { type: 'tree'; wx: number; wy: number; depth: number };

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

      drawItems.sort((a, b) => a.depth - b.depth);

      // Render Each Item
      drawItems.forEach((item) => {
        if (item.type === 'tree') {
          // Double-Sphere Tree (Matching Screenshot Exactly)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 2, pt.y + 2, 14 * z, 7 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Brown slender trunk
          ctx.fillStyle = isNight ? '#451a03' : '#78350f';
          ctx.fillRect(pt.x - 2.5 * z, pt.y - 18 * z, 5 * z, 18 * z);

          // Lower large sphere (Teal/Emerald green)
          ctx.fillStyle = isNight ? '#064e3b' : '#10b981';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 24 * z, 14 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper overlapping bright mint/lime sphere
          ctx.fillStyle = isNight ? '#047857' : '#34d399';
          ctx.beginPath();
          ctx.arc(pt.x + 1 * z, pt.y - 32 * z, 11 * z, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'building') {
          const b = item.info;
          const [bx, , by] = b.position;
          const pt = toScreen(bx, by, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const isHovered = hoveredBuildingRef?.id === b.id;

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 4, pt.y + 4, 38 * z, 18 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          if (b.id === 'balai_kota') {
            // NORTH: GEDUNG KUBAH EMAS (Balai Kota)
            // Main white building
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x, pt.y - 36 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y + 20 * z);
            ctx.lineTo(pt.x, pt.y + 36 * z);
            ctx.lineTo(pt.x - 34 * z, pt.y + 20 * z);
            ctx.closePath();
            ctx.fill();

            // Left vertical fluting/pillars
            ctx.fillStyle = '#e2e8f0';
            for (let col = -26; col <= -4; col += 7) {
              ctx.fillRect(pt.x + col * z, pt.y - 12 * z, 4 * z, 30 * z);
            }

            // Right wall white windows
            ctx.fillStyle = '#cbd5e1';
            for (let r = 0; r < 2; r++) {
              for (let c = 8; c <= 26; c += 9) {
                ctx.fillRect(pt.x + c * z, pt.y - (4 - r * 14) * z, 5 * z, 8 * z);
              }
            }

            // Golden Dome on top
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 36 * z, 18 * z, Math.PI, 0);
            ctx.fill();

            // Gold spire
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2.5 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 54 * z);
            ctx.lineTo(pt.x, pt.y - 66 * z);
            ctx.stroke();

            // Flagpole on left
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 30 * z, pt.y + 10 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y - 25 * z);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pt.x - 29 * z, pt.y - 25 * z, 8 * z, 5 * z);

            // Black sign in front
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 14 * z, pt.y + 28 * z, 28 * z, 8 * z);
            ctx.fillStyle = '#facc15';
            ctx.font = `bold ${Math.round(6 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('BALAI KOTA', pt.x, pt.y + 34 * z);
          } else if (b.id === 'menara_mentor') {
            // EAST: DEWAN KOTA & TELECOM TRANSMISSION TOWER
            // Main white council hall
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 30 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.lineTo(pt.x - 28 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();

            // Two green watermelon/capsule roof arches
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(pt.x - 8 * z, pt.y - 28 * z, 10 * z, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pt.x + 8 * z, pt.y - 28 * z, 10 * z, Math.PI, 0);
            ctx.fill();

            // Blue arch doors
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            ctx.arc(pt.x - 10 * z, pt.y + 16 * z, 4 * z, Math.PI, 0);
            ctx.arc(pt.x + 2 * z, pt.y + 20 * z, 4 * z, Math.PI, 0);
            ctx.stroke();

            // Red badge "ON AIR"
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.roundRect(pt.x + 8 * z, pt.y - 10 * z, 18 * z, 8 * z, 3 * z);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(5 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('ON AIR', pt.x + 17 * z, pt.y - 4 * z);

            // Telecom Radio Lattice Tower beside it (Grey steel frame)
            const towerX = pt.x + 36 * z;
            const towerY = pt.y + 10 * z;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            ctx.moveTo(towerX - 10 * z, towerY);
            ctx.lineTo(towerX, towerY - 60 * z);
            ctx.lineTo(towerX + 10 * z, towerY);
            ctx.stroke();
            // Cross bars
            for (let b = 1; b <= 4; b++) {
              const ty = towerY - b * 12 * z;
              const halfW = (1 - b / 5) * 10 * z;
              ctx.beginPath();
              ctx.moveTo(towerX - halfW, ty);
              ctx.lineTo(towerX + halfW, ty);
              ctx.stroke();
            }
            // Blinking red beacon on top
            ctx.fillStyle = Math.floor(beaconBlink) % 2 === 0 ? '#ef4444' : '#fee2e2';
            ctx.beginPath();
            ctx.arc(towerX, towerY - 62 * z, 3.5 * z, 0, Math.PI * 2);
            ctx.fill();

            // Transformer box
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(towerX - 22 * z, towerY - 14 * z, 14 * z, 14 * z);
          } else if (b.id === 'perpustakaan') {
            // WEST: GEDUNG BIRU (Perpustakaan)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 32 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.lineTo(pt.x - 28 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();

            // Blue roof rim
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 3.5 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 32 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 18 * z);
            ctx.stroke();

            // Blue square grid windows (4x2 on front, 4x2 on side)
            ctx.fillStyle = '#38bdf8';
            for (let r = 0; r < 2; r++) {
              for (let c = -20; c <= -6; c += 7) {
                ctx.fillRect(pt.x + c * z, pt.y - (4 - r * 12) * z, 5 * z, 6 * z);
              }
              for (let c = 6; c <= 20; c += 7) {
                ctx.fillRect(pt.x + c * z, pt.y - (4 - r * 12) * z, 5 * z, 6 * z);
              }
            }
          } else if (b.id === 'pasar_prestasi') {
            // SOUTH-WEST: TOKO POIN
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pt.x - 24 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 28 * z);
            ctx.lineTo(pt.x + 24 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x + 24 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 26 * z);
            ctx.lineTo(pt.x - 24 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();

            // Red roof trim
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 3 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 24 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 28 * z);
            ctx.lineTo(pt.x + 24 * z, pt.y - 16 * z);
            ctx.stroke();

            // Red & white striped awning
            const awningW = 44 * z;
            for (let a = 0; a < 6; a++) {
              ctx.fillStyle = a % 2 === 0 ? '#ef4444' : '#ffffff';
              ctx.fillRect(pt.x - 22 * z + a * (awningW / 6), pt.y + 8 * z, awningW / 6, 8 * z);
            }
          } else if (b.id === 'bengkel_latihan') {
            // SOUTH-EAST: LAB DKV & CONTROL TOWER
            // Modern blue/white building
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 26 * z, pt.y - 10 * z, 36 * z, 26 * z);

            ctx.fillStyle = '#3b82f6';
            ctx.fillRect(pt.x - 26 * z, pt.y - 16 * z, 36 * z, 6 * z);

            // Round cylindrical control tower with blue dome
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(pt.x + 12 * z, pt.y - 24 * z, 14 * z, 40 * z);
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(pt.x + 19 * z, pt.y - 24 * z, 7 * z, Math.PI, 0);
            ctx.fill();

            // Antenna
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.5 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 19 * z, pt.y - 31 * z);
            ctx.lineTo(pt.x + 19 * z, pt.y - 39 * z);
            ctx.stroke();
          } else {
            // Other pavilions (Taman Refleksi / Kantor Pos)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 16 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = b.id === 'taman_refleksi' ? '#ec4899' : '#ef4444';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 12 * z, 0, Math.PI * 2);
            ctx.fill();
          }

          // Floating Building Label
          const tagY = pt.y - 48 * z;
          const labelText = `${b.icon} ${b.name}`;
          ctx.font = `bold ${Math.round(9.5 * z)}px sans-serif`;
          const tMetrics = ctx.measureText(labelText);
          const tagW = tMetrics.width + 14 * z;
          const tagH = 18 * z;

          ctx.fillStyle = isHovered ? '#1e293b' : 'rgba(15, 23, 42, 0.85)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tagW / 2, tagY - tagH / 2, tagW, tagH, 9 * z);
          ctx.fill();
          ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(148, 163, 184, 0.5)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pt.x, tagY);
        } else if (item.type === 'cafe') {
          // SOUTH: TOKO ROTI & KAFE WARGA (Exact Match to Screenshot)
          const pt = toScreen(cafeWx, cafeWy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          setCafeScreenPos({
            x: pt.x,
            y: pt.y - 40 * z,
            visible: true,
          });

          // Stall body (Warm wood/cream)
          ctx.fillStyle = '#d97706';
          ctx.fillRect(pt.x - 22 * z, pt.y - 12 * z, 44 * z, 20 * z);

          // Striped red-white awning
          for (let s = 0; s < 5; s++) {
            ctx.fillStyle = s % 2 === 0 ? '#ef4444' : '#ffffff';
            ctx.fillRect(pt.x - 22 * z + s * (44 * z / 5), pt.y - 20 * z, 44 * z / 5, 8 * z);
          }

          // Signboard "TOKO ROTI"
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pt.x - 16 * z, pt.y - 8 * z, 32 * z, 8 * z);
          ctx.fillStyle = '#b45309';
          ctx.font = `bold ${Math.round(6 * z)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('TOKO ROTI', pt.x, pt.y - 2 * z);
        } else if (item.type === 'avatar') {
          // AVATARS MATCHING SCREENSHOT EXACTLY
          const av = item.data;
          const pt = toScreen(av.wx, av.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 1, pt.y + 1, 7 * z, 3.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          const legSwing = av.isMoving ? Math.sin(av.walkFrame) * 4 * z : 0;
          const avY = pt.y - (av.isMoving ? Math.abs(Math.sin(av.walkFrame * 2)) * 1.5 * z : 0);

          // Legs
          ctx.fillStyle = av.pantsColor;
          ctx.fillRect(pt.x - 3.5 * z, avY - 5 * z + legSwing, 3 * z, 6 * z);
          ctx.fillRect(pt.x + 0.5 * z, avY - 5 * z - legSwing, 3 * z, 6 * z);

          // Shirt
          ctx.fillStyle = av.shirtColor;
          ctx.beginPath();
          ctx.roundRect(pt.x - 5 * z, avY - 14 * z, 10 * z, 9 * z, 2 * z);
          ctx.fill();

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
        }
      });

      // ---------------------------------------------------------
      // 5. NOCTURNAL GLOWING FIREFLIES (Malam)
      // ---------------------------------------------------------
      if (isNight) {
        fireflies.forEach((f) => {
          f.x = f.baseX + Math.sin(elapsed * f.speed + f.phase) * f.radius;
          f.y = f.baseY + Math.cos(elapsed * (f.speed * 0.9) + f.phase * 1.5) * f.radius;
          const fScreen = toScreen(f.x, f.y, 4, camera.x, camera.y);

          const blink = 0.4 + 0.6 * Math.max(0, Math.sin(elapsed * f.blinkSpeed + f.phase));

          const glow = ctx.createRadialGradient(fScreen.x, fScreen.y, 1, fScreen.x, fScreen.y, 10);
          glow.addColorStop(0, `rgba(250, 204, 21, ${blink})`);
          glow.addColorStop(0.5, `rgba(163, 230, 53, ${blink * 0.5})`);
          glow.addColorStop(1, 'rgba(163, 230, 53, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(fScreen.x, fScreen.y, 10, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(fScreen.x, fScreen.y, 1.8, 0, Math.PI * 2);
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
  // KAFE ITEM PURCHASES
  // -------------------------------------------------------------
  const handleBuyCoffee = () => {
    sounds.playRewardXp();
    setCafeToast('☕ Menikmati kopi hangat di Kafe Warga!');
    baristaSpeechRef.current = {
      text: 'Kopi hangat siap, selamat menikmati! ☕',
      expiresAt: Date.now() + 5000,
    };
    playerSpeechRef.current = {
      text: 'Mantap kopinya! ☕',
      expiresAt: Date.now() + 5000,
    };
    setTimeout(() => setCafeToast(null), 3500);
  };

  const handleBuyBread = () => {
    sounds.playRewardXp();
    setCafeToast('🍞 Roti lezat baru dipanggang!');
    baristaSpeechRef.current = {
      text: 'Roti hangat baru dipanggang! 🍞',
      expiresAt: Date.now() + 5000,
    };
    playerSpeechRef.current = {
      text: 'Enak banget rotinya! 🍞',
      expiresAt: Date.now() + 5000,
    };
    setTimeout(() => setCafeToast(null), 3500);
  };

  const handleBuyIceCream = () => {
    sounds.playRewardXp();
    setCafeToast('🍦 Eskrim manis menyegarkan harimu!');
    baristaSpeechRef.current = {
      text: 'Eskrim manis spesial untukmu! 🍦',
      expiresAt: Date.now() + 5000,
    };
    playerSpeechRef.current = {
      text: 'Segar banget eskrimnya! 🍦',
      expiresAt: Date.now() + 5000,
    };
    setTimeout(() => setCafeToast(null), 3500);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden touch-none"
      data-testid="town-canvas-reference-exact"
    >
      {/* Isometric Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* Floating Cafe Card ONLY when Touched/Clicked */}
      {isCafeMenuOpen && cafeScreenPos.visible && (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto transition-transform animate-fade-in-up z-30"
          style={{ left: `${cafeScreenPos.x}px`, top: `${cafeScreenPos.y}px` }}
          onPointerDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-[#121e2c]/95 backdrop-blur-md text-white px-3.5 py-3 rounded-2xl border border-slate-700/80 shadow-[0_12px_36px_0_rgba(0,0,0,0.65)] flex flex-col items-center gap-2.5 min-w-[250px] max-w-[90vw]">
            <div className="w-full flex items-center justify-between border-b border-slate-700/70 pb-1.5">
              <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-white">Toko Roti & Kafe</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-semibold">@barista_kiki</span>
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
                <span className="text-[10px] mt-0.5">Kopi - 2</span>
              </button>
              <button
                onClick={handleBuyBread}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
              >
                <span className="text-base">🍞</span>
                <span className="text-[10px] mt-0.5">Roti - 1</span>
              </button>
              <button
                onClick={handleBuyIceCream}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
              >
                <span className="text-base">🍦</span>
                <span className="text-[10px] mt-0.5">Eskrim - 1</span>
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

      {/* BOTTOM-RIGHT ZOOM & CAMERA CONTROLS (Exact Match to Screenshot) */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-20 flex flex-col items-center gap-2 pointer-events-auto">
        <button
          onClick={handleZoomIn}
          className="w-9 h-9 rounded-full bg-[#121e2c]/90 hover:bg-[#1c2c3e] text-white border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95"
          title="Perbesar Peta (+)"
        >
          <Plus className="w-4 h-4 text-slate-200" />
        </button>
        <button
          onClick={handleZoomOut}
          className="w-9 h-9 rounded-full bg-[#121e2c]/90 hover:bg-[#1c2c3e] text-white border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95"
          title="Perkecil Peta (-)"
        >
          <Minus className="w-4 h-4 text-slate-200" />
        </button>
        <button
          onClick={handleCenterOnPlayer}
          className="w-9 h-9 rounded-full bg-[#121e2c]/90 hover:bg-[#1c2c3e] text-rose-400 border border-slate-700/60 shadow-lg flex items-center justify-center transition active:scale-95"
          title="Fokus ke Posisi Saya"
        >
          <MapPin className="w-4 h-4 text-rose-400" />
        </button>
      </div>
    </div>
  );
};
