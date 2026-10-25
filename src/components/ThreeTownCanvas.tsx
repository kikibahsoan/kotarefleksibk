import React, { useEffect, useRef, useState } from 'react';
import { BuildingId, PublicChatMessage } from '../types/index.ts';
import { sounds } from '../utils/audio.ts';
import { X } from 'lucide-react';

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
  { id: 'balai_kota', name: 'Balai Kota', tagline: 'Misi & Pengumuman', position: [0, 0, -13], color: 0x3b82f6, icon: '🏛️' },
  { id: 'perpustakaan', name: 'Perpustakaan', tagline: 'Materi & Video', position: [-12, 0, -7], color: 0x10b981, icon: '📚' },
  { id: 'menara_mentor', name: 'Menara Mentor', tagline: 'Umpan Balik AI', position: [12, 0, -7], color: 0x8b5cf6, icon: '🔭' },
  { id: 'taman_refleksi', name: 'Taman Refleksi', tagline: 'Tulis Refleksi', position: [-11, 0, 7], color: 0xec4899, icon: '🌸' },
  { id: 'bengkel_latihan', name: 'Bengkel Latihan', tagline: 'Kuis & Tantangan', position: [12, 0, 7], color: 0xf59e0b, icon: '🛠️' },
  { id: 'kantor_pos', name: 'Kantor Pos', tagline: 'Kirim Pesan ke Guru', position: [-7, 0, 13], color: 0xef4444, icon: '📮' },
  { id: 'pasar_prestasi', name: 'Pasar Prestasi', tagline: 'Lencana & Poin', position: [7, 0, 13], color: 0x06b6d4, icon: '🎪' },
  { id: 'monumen_warga', name: 'Monumen Warga', tagline: 'Sapa & Obrolan Langsung', position: [0, 0, 0], color: 0xec4899, icon: '💬' },
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
  color: string;
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
  size: number;
  speed: number;
  opacity: number;
}

interface Firefly {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speed: number;
  phase: number;
  blinkSpeed: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkleSpeed: number;
  phase: number;
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
    // ISOMETRIC PROJECTION CONSTANTS
    // -----------------------------------------------------------
    const TILE_W = 44;
    const TILE_H = 22;

    const toScreen = (wx: number, wy: number, altitude = 0, camX: number, camY: number) => {
      const isoX = (wx - wy) * TILE_W;
      const isoY = (wx + wy) * TILE_H - altitude;
      return {
        x: width / 2 + (isoX - camX),
        y: height / 2 + (isoY - camY),
      };
    };

    const toWorld = (sx: number, sy: number, camX: number, camY: number) => {
      const isoX = sx - width / 2 + camX;
      const isoY = sy - height / 2 + camY;
      const wx = (isoX / TILE_W + isoY / TILE_H) / 2;
      const wy = (isoY / TILE_H - isoX / TILE_W) / 2;
      return { wx, wy };
    };

    // -----------------------------------------------------------
    // CAMERA STATE (Smooth Follow Avatar)
    // -----------------------------------------------------------
    const camera = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
    };

    // -----------------------------------------------------------
    // AVATARS (Strictly: Siswa, Guru, Polisi, Petugas Kebersihan, Kurir, Barista)
    // -----------------------------------------------------------
    const studentHandle = studentName.split(' ')[0].toLowerCase();

    // 1. Player (Siswa)
    const player: AvatarData = {
      id: 'siswa',
      role: 'siswa',
      handle: studentHandle,
      roleLabel: 'Siswa',
      wx: 0,
      wy: 3.5,
      targetWx: 0,
      targetWy: 3.5,
      speed: 4.8,
      color: studentGender === 'P' ? '#f43f5e' : '#38bdf8',
      isMoving: false,
      pauseTimer: 0,
      walkFrame: 0,
      facing: 'down-left',
    };

    // 2. Guru
    const guru: AvatarData = {
      id: 'guru',
      role: 'guru',
      handle: 'guru_ahmad',
      roleLabel: 'Guru Pembimbing',
      wx: -6,
      wy: -6,
      targetWx: -6,
      targetWy: -6,
      speed: 2.2,
      color: '#b45309',
      isMoving: false,
      pauseTimer: 2,
      walkFrame: 0,
      facing: 'down-right',
      speechText: 'Selamat belajar dan terus berefleksi!',
      speechTimer: 5,
    };

    // 3. Polisi
    const polisi: AvatarData = {
      id: 'polisi',
      role: 'polisi',
      handle: 'polisi_jaya',
      roleLabel: 'Polisi Kota',
      wx: 6,
      wy: 3,
      targetWx: 6,
      targetWy: 3,
      speed: 2.5,
      color: '#1d4ed8',
      isMoving: false,
      pauseTimer: 1.5,
      walkFrame: 0,
      facing: 'up-left',
      speechText: 'Kota Refleksi aman dan tertib!',
      speechTimer: 6,
    };

    // 4. Petugas Kebersihan
    const petugas: AvatarData = {
      id: 'petugas_kebersihan',
      role: 'petugas_kebersihan',
      handle: 'petugas_kebersihan',
      roleLabel: 'Petugas Kebersihan',
      wx: -7,
      wy: 5,
      targetWx: -7,
      targetWy: 5,
      speed: 2.0,
      color: '#16a34a',
      isMoving: false,
      pauseTimer: 3,
      walkFrame: 0,
      facing: 'down-left',
      speechText: 'Mari jaga kebersihan pulau kita!',
      speechTimer: 7,
    };

    // 5. Kurir
    const kurir: AvatarData = {
      id: 'kurir',
      role: 'kurir',
      handle: 'kurir_kilat',
      roleLabel: 'Kurir Paket',
      wx: -3,
      wy: 10,
      targetWx: -3,
      targetWy: 10,
      speed: 3.2,
      color: '#ea580c',
      isMoving: false,
      pauseTimer: 2,
      walkFrame: 0,
      facing: 'up-right',
      speechText: 'Materi dan umpan balik baru siap diantar!',
      speechTimer: 4,
    };

    // Barista at the cafe
    const barista: AvatarData = {
      id: 'barista',
      role: 'barista',
      handle: 'nnisa_0311',
      roleLabel: 'Barista Kafe',
      wx: -4.5,
      wy: 2.2,
      targetWx: -4.5,
      targetWy: 2.2,
      speed: 0,
      color: '#059669',
      isMoving: false,
      pauseTimer: 99999,
      walkFrame: 0,
      facing: 'down-right',
      speechText: 'Kopi, roti, dan eskrim siap disajikan!',
      speechTimer: 6,
    };

    const npcs: AvatarData[] = [guru, polisi, petugas, kurir, barista];

    // Cafe stall coordinates
    const cafeWx = -4.5;
    const cafeWy = 2.2;

    // -----------------------------------------------------------
    // SKY ELEMENTS: Clouds (Pagi) & Stars/Fireflies (Malam)
    // -----------------------------------------------------------
    const clouds: Cloud[] = Array.from({ length: 7 }, (_, i) => ({
      x: (i / 7) * width + Math.random() * 80,
      y: 40 + (i % 4) * 45 + Math.random() * 20,
      size: 45 + Math.random() * 35,
      speed: 12 + Math.random() * 15,
      opacity: 0.75 + Math.random() * 0.2,
    }));

    const stars: Star[] = Array.from({ length: 90 }, () => ({
      x: Math.random() * width,
      y: Math.random() * (height * 0.75),
      size: 1 + Math.random() * 2.2,
      twinkleSpeed: 1.5 + Math.random() * 3.5,
      phase: Math.random() * Math.PI * 2,
    }));

    const fireflies: Firefly[] = Array.from({ length: 38 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 3 + Math.random() * 12;
      return {
        baseX: Math.cos(angle) * dist,
        baseY: Math.sin(angle) * dist,
        x: 0,
        y: 0,
        radiusX: 0.8 + Math.random() * 1.6,
        radiusY: 0.6 + Math.random() * 1.2,
        speed: 0.8 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: 1.8 + Math.random() * 2.6,
      };
    });

    // Street Lamps positions along cobblestone paths
    const streetLamps: [number, number][] = [
      [0, -7],
      [-5, -4],
      [5, -4],
      [-7, 2],
      [7, 2],
      [-4, 7],
      [4, 7],
      [0, 10],
    ];

    let pendingBuildingId: BuildingId | null = null;
    let hoveredBuildingRef: BuildingInfo | null = null;

    // -----------------------------------------------------------
    // INTERACTION HANDLERS (Click & Touch)
    // -----------------------------------------------------------
    const getPointerWorldPos = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;
      return { sx, sy, ...toWorld(sx, sy, camera.x, camera.y) };
    };

    const handlePointerAction = (clientX: number, clientY: number) => {
      const { wx, wy } = getPointerWorldPos(clientX, clientY);

      // 1. Check Click on Cafe Stall
      const cafeDist = Math.hypot(wx - cafeWx, wy - cafeWy);
      if (cafeDist < 2.4) {
        sounds.playClick();
        setIsCafeMenuOpen(true);
        player.targetWx = -3.2;
        player.targetWy = 2.8;
        player.isMoving = true;
        pendingBuildingId = null;
        return;
      }

      // 2. Check Click on Buildings
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        const dist = Math.hypot(wx - bx, wy - by);
        // Generous hit test threshold for isometric roofs/walls
        if (dist < 2.8 || (Math.abs(wx - bx) < 2.5 && Math.abs(wy - by) < 2.5)) {
          sounds.playClick();
          player.targetWx = bx;
          player.targetWy = by + 2.2;
          player.isMoving = true;
          pendingBuildingId = b.id;
          return;
        }
      }

      // 3. Click on ground to walk
      sounds.playClick();
      player.targetWx = Math.max(-15, Math.min(15, wx));
      player.targetWy = Math.max(-15, Math.min(15, wy));
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

      // Check Cafe hover
      if (Math.hypot(wx - cafeWx, wy - cafeWy) < 2.4) {
        canvas.style.cursor = 'pointer';
        hoveredBuildingRef = null;
        setHoveredBuilding(null);
        return;
      }

      // Check Building hover
      let found: BuildingInfo | null = null;
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        if (Math.hypot(wx - bx, wy - by) < 2.6) {
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
    camera.x = (player.wx - player.wy) * TILE_W;
    camera.y = (player.wx + player.wy) * TILE_H;

    // -----------------------------------------------------------
    // MAIN ANIMATION LOOP (Lightweight 60 FPS Canvas 2D)
    // -----------------------------------------------------------
    let animId: number;
    let lastTime = performance.now();
    let sunRaysAngle = 0;

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;
      const elapsed = currentTime / 1000;

      // Determine daytime or nighttime
      const isNight =
        timeOfDayRef.current === 'night' ||
        (timeOfDayRef.current === 'auto' && (new Date().getHours() >= 18 || new Date().getHours() < 6));

      // ---------------------------------------------------------
      // FEATURE 4: CAMERA SMOOTH FOLLOW AVATAR
      // ---------------------------------------------------------
      camera.targetX = (player.wx - player.wy) * TILE_W;
      camera.targetY = (player.wx + player.wy) * TILE_H;
      camera.x += (camera.targetX - camera.x) * (delta * 4.5);
      camera.y += (camera.targetY - camera.y) * (delta * 4.5);

      // ---------------------------------------------------------
      // UPDATE AVATAR POSITIONS & ANIMATIONS
      // ---------------------------------------------------------
      // Update Player
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

      // Update NPCs (Guru, Polisi, Petugas Kebersihan, Kurir)
      npcs.forEach((npc) => {
        if (npc.speed === 0) return; // Barista stays at counter

        if (npc.speechTimer && npc.speechTimer > 0) {
          npc.speechTimer -= delta;
          if (npc.speechTimer <= 0) npc.speechText = undefined;
        }

        if (!npc.isMoving) {
          npc.pauseTimer -= delta;
          if (npc.pauseTimer <= 0) {
            npc.isMoving = true;
            // Wander around town within bounds
            const angle = Math.random() * Math.PI * 2;
            const dist = 2 + Math.random() * 6;
            npc.targetWx = Math.max(-12, Math.min(12, npc.wx + Math.cos(angle) * dist));
            npc.targetWy = Math.max(-12, Math.min(12, npc.wy + Math.sin(angle) * dist));
          }
        } else {
          const dx = npc.targetWx - npc.wx;
          const dy = npc.targetWy - npc.wy;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.2) {
            const step = Math.min(dist, npc.speed * delta);
            npc.wx += (dx / dist) * step;
            npc.wy += (dy / dist) * step;
            npc.walkFrame += delta * 10;
            if (dx >= 0) npc.facing = 'down-right';
            else npc.facing = 'down-left';
          } else {
            npc.isMoving = false;
            npc.walkFrame = 0;
            npc.pauseTimer = 3 + Math.random() * 5;
          }
        }
      });

      // ---------------------------------------------------------
      // 1. SKY BACKGROUND (Pagi: Cerah & Sinar Matahari / Malam: Nebula Bintang)
      // ---------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      if (!isNight) {
        // PAGI (Daytime Sky Gradient: Fresh azure to warm golden morning sun)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#38bdf8'); // Sky blue
        skyGrad.addColorStop(0.5, '#7dd3fc');
        skyGrad.addColorStop(1, '#bae6fd'); // Horizon haze
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // FEATURE 1: PAGI - SINAR MATAHARI (Golden Sun & Radiating Rays)
        const sunX = width * 0.82;
        const sunY = height * 0.18;
        const sunRadius = Math.min(width, height) * 0.085;

        // Radiating Sun Rays
        sunRaysAngle += delta * 0.08;
        ctx.save();
        ctx.translate(sunX, sunY);
        ctx.rotate(sunRaysAngle);

        const rayCount = 12;
        for (let r = 0; r < rayCount; r++) {
          const angle = (r / rayCount) * Math.PI * 2;
          const rayLen = sunRadius * (2.8 + Math.sin(elapsed * 2 + r) * 0.4);
          const rayGrad = ctx.createLinearGradient(0, 0, Math.cos(angle) * rayLen, Math.sin(angle) * rayLen);
          rayGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
          rayGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.15)');
          rayGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');

          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle - 0.14) * rayLen, Math.sin(angle - 0.14) * rayLen);
          ctx.lineTo(Math.cos(angle + 0.14) * rayLen, Math.sin(angle + 0.14) * rayLen);
          ctx.closePath();
          ctx.fillStyle = rayGrad;
          ctx.fill();
        }
        ctx.restore();

        // Golden Sun Glow & Core
        const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.2, sunX, sunY, sunRadius * 2.2);
        sunGlow.addColorStop(0, '#fffbeb');
        sunGlow.addColorStop(0.35, '#fef08a');
        sunGlow.addColorStop(0.7, 'rgba(250, 204, 21, 0.35)');
        sunGlow.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = sunGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Sun Sphere
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        // FEATURE 1: PAGI - AWAN BERGERAK (Drifting 2D Cumulus Clouds)
        clouds.forEach((cloud) => {
          cloud.x += cloud.speed * delta;
          if (cloud.x > width + cloud.size * 2) {
            cloud.x = -cloud.size * 2;
            cloud.y = 30 + Math.random() * (height * 0.35);
          }

          ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
          const cx = cloud.x;
          const cy = cloud.y + Math.sin(elapsed * 0.8 + cloud.x * 0.01) * 6;
          const s = cloud.size;

          ctx.beginPath();
          ctx.arc(cx, cy, s * 0.5, 0, Math.PI * 2);
          ctx.arc(cx + s * 0.35, cy - s * 0.2, s * 0.45, 0, Math.PI * 2);
          ctx.arc(cx + s * 0.7, cy, s * 0.4, 0, Math.PI * 2);
          ctx.arc(cx + s * 0.35, cy + s * 0.1, s * 0.35, 0, Math.PI * 2);
          ctx.fill();
        });
      } else {
        // MALAM (Night Sky Gradient matching screenshot)
        const nightGrad = ctx.createLinearGradient(0, 0, 0, height);
        nightGrad.addColorStop(0, '#070e1c');
        nightGrad.addColorStop(0.6, '#0f172a');
        nightGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, width, height);

        // Twinkling Stars
        stars.forEach((star) => {
          const alpha = 0.35 + 0.65 * Math.abs(Math.sin(elapsed * star.twinkleSpeed + star.phase));
          ctx.fillStyle = `rgba(241, 245, 249, ${alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Glowing Crescent Moon
        const moonX = width * 0.82;
        const moonY = height * 0.16;
        const moonR = 26;

        const moonGlow = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.2);
        moonGlow.addColorStop(0, 'rgba(224, 231, 255, 0.45)');
        moonGlow.addColorStop(1, 'rgba(224, 231, 255, 0)');
        ctx.fillStyle = moonGlow;
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        ctx.fill();

        // Moon cutout to make crescent
        ctx.fillStyle = '#0a1222';
        ctx.beginPath();
        ctx.arc(moonX + 9, moonY - 4, moonR * 0.9, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---------------------------------------------------------
      // 2. FLOATING ISLAND GEOMETRY (Cliff layers & Grassy Plateau)
      // ---------------------------------------------------------
      const islandPoints: [number, number][] = [];
      const segs = 28;
      for (let i = 0; i < segs; i++) {
        const theta = (i / segs) * Math.PI * 2;
        const r = 17.5 + Math.sin(theta * 3) * 0.8;
        islandPoints.push([Math.cos(theta) * r, Math.sin(theta) * r]);
      }

      // Draw Island Rocky Cliff Underneath (Earth strata)
      for (let layer = 5; layer >= 1; layer--) {
        const cliffDepth = layer * 14;
        const shrink = 1 - layer * 0.08;
        ctx.fillStyle = isNight
          ? `rgb(${16 + layer * 3}, ${22 + layer * 4}, ${36 + layer * 6})`
          : `rgb(${75 - layer * 5}, ${55 - layer * 4}, ${40 - layer * 3})`;

        ctx.beginPath();
        islandPoints.forEach(([ix, iy], idx) => {
          const pt = toScreen(ix * shrink, iy * shrink, -cliffDepth, camera.x, camera.y);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fill();
      }

      // Draw Top Grass Plateau
      ctx.fillStyle = isNight ? '#064e3b' : '#15803d'; // Night emerald vs Day lush green
      ctx.beginPath();
      islandPoints.forEach(([ix, iy], idx) => {
        const pt = toScreen(ix, iy, 0, camera.x, camera.y);
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.closePath();
      ctx.fill();

      // Grass Rim Border highlight
      ctx.strokeStyle = isNight ? '#059669' : '#22c55e';
      ctx.lineWidth = 3;
      ctx.stroke();

      // ---------------------------------------------------------
      // 3. COBBLESTONE ROADS & PLAZA
      // ---------------------------------------------------------
      const plazaCenter = toScreen(0, 0, 0, camera.x, camera.y);
      const plazaR = TILE_W * 3.4;
      ctx.save();
      ctx.translate(plazaCenter.x, plazaCenter.y);
      ctx.scale(1, TILE_H / TILE_W);
      ctx.beginPath();
      ctx.arc(0, 0, plazaR, 0, Math.PI * 2);
      ctx.fillStyle = isNight ? '#1e293b' : '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = isNight ? '#334155' : '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.restore();

      // Cobblestone path lines connecting plaza to each building
      ctx.strokeStyle = isNight ? 'rgba(51, 65, 85, 0.85)' : 'rgba(203, 213, 225, 0.95)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';

      BUILDINGS_INFO.forEach((b) => {
        if (b.id === 'monumen_warga') return;
        const [bx, , by] = b.position;
        const bScreen = toScreen(bx, by, 0, camera.x, camera.y);
        ctx.beginPath();
        ctx.moveTo(plazaCenter.x, plazaCenter.y);
        ctx.lineTo(bScreen.x, bScreen.y);
        ctx.stroke();
      });

      // Cobblestone path to Cafe
      const cafeScreen = toScreen(cafeWx, cafeWy, 0, camera.x, camera.y);
      ctx.beginPath();
      ctx.moveTo(plazaCenter.x, plazaCenter.y);
      ctx.lineTo(cafeScreen.x, cafeScreen.y);
      ctx.stroke();

      // ---------------------------------------------------------
      // NIGHT STREET LAMPS (Warm Pools of Light)
      // ---------------------------------------------------------
      if (isNight) {
        streetLamps.forEach(([lx, ly]) => {
          const lScreen = toScreen(lx, ly, 0, camera.x, camera.y);
          const lampGlow = ctx.createRadialGradient(lScreen.x, lScreen.y, 4, lScreen.x, lScreen.y, 48);
          lampGlow.addColorStop(0, 'rgba(251, 191, 36, 0.42)');
          lampGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.18)');
          lampGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = lampGlow;
          ctx.beginPath();
          ctx.arc(lScreen.x, lScreen.y, 48, 0, Math.PI * 2);
          ctx.fill();

          // Lamp post stick & glowing bulb
          const bulbScreen = toScreen(lx, ly, 24, camera.x, camera.y);
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(lScreen.x, lScreen.y);
          ctx.lineTo(bulbScreen.x, bulbScreen.y);
          ctx.stroke();

          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(bulbScreen.x, bulbScreen.y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // ---------------------------------------------------------
      // 4. DRAW ENTITIES (Buildings, Cafe, Avatars, Trees)
      // Sorted by depth (wx + wy) for true 2.5D Isometric Z-Ordering
      // ---------------------------------------------------------
      type DrawItem =
        | { type: 'building'; info: BuildingInfo; depth: number }
        | { type: 'cafe'; depth: number }
        | { type: 'avatar'; data: AvatarData; isPlayer: boolean; depth: number }
        | { type: 'tree'; wx: number; wy: number; kind: 'cherry' | 'pine'; depth: number };

      const drawItems: DrawItem[] = [];

      BUILDINGS_INFO.forEach((b) => {
        drawItems.push({
          type: 'building',
          info: b,
          depth: b.position[0] + b.position[2],
        });
      });

      drawItems.push({
        type: 'cafe',
        depth: cafeWx + cafeWy,
      });

      // Avatars: Player + NPCs (Guru, Polisi, Petugas Kebersihan, Kurir, Barista)
      drawItems.push({
        type: 'avatar',
        data: player,
        isPlayer: true,
        depth: player.wx + player.wy,
      });

      npcs.forEach((npc) => {
        drawItems.push({
          type: 'avatar',
          data: npc,
          isPlayer: false,
          depth: npc.wx + npc.wy,
        });
      });

      // Decorative Island Trees
      const trees: { wx: number; wy: number; kind: 'cherry' | 'pine' }[] = [
        { wx: -13, wy: 4, kind: 'cherry' },
        { wx: -10, wy: 10, kind: 'cherry' },
        { wx: 13, wy: -4, kind: 'pine' },
        { wx: 10, wy: -11, kind: 'pine' },
        { wx: -5, wy: -13, kind: 'pine' },
        { wx: 5, wy: -13, kind: 'pine' },
        { wx: 11, wy: 11, kind: 'pine' },
      ];

      trees.forEach((t) => {
        drawItems.push({
          type: 'tree',
          wx: t.wx,
          wy: t.wy,
          kind: t.kind,
          depth: t.wx + t.wy,
        });
      });

      // Sort back-to-front
      drawItems.sort((a, b) => a.depth - b.depth);

      // Render each sorted item
      drawItems.forEach((item) => {
        if (item.type === 'tree') {
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          // Tree Trunk
          ctx.fillStyle = '#78350f';
          ctx.fillRect(pt.x - 3, pt.y - 14, 6, 14);

          // Foliage
          if (item.kind === 'cherry') {
            ctx.fillStyle = isNight ? '#be185d' : '#f472b6';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 24, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isNight ? '#9d174d' : '#fbcfe8';
            ctx.beginPath();
            ctx.arc(pt.x + 4, pt.y - 28, 11, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.fillStyle = isNight ? '#064e3b' : '#15803d';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 42);
            ctx.lineTo(pt.x + 14, pt.y - 14);
            ctx.lineTo(pt.x - 14, pt.y - 14);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = isNight ? '#047857' : '#22c55e';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 32);
            ctx.lineTo(pt.x + 11, pt.y - 10);
            ctx.lineTo(pt.x - 11, pt.y - 10);
            ctx.closePath();
            ctx.fill();
          }
        } else if (item.type === 'building') {
          const b = item.info;
          const [bx, , by] = b.position;
          const pt = toScreen(bx, by, 0, camera.x, camera.y);

          // Building Ground Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 4, 38, 18, 0, 0, Math.PI * 2);
          ctx.fill();

          // Check if hovered
          const isHovered = hoveredBuildingRef?.id === b.id;
          const hoverLift = isHovered ? Math.sin(elapsed * 6) * 3 : 0;
          const bY = pt.y - hoverLift;

          // Distinct Architectural Geometry for each building
          if (b.id === 'balai_kota') {
            // Balai Kota: Grand City Hall
            ctx.fillStyle = isNight ? '#1e293b' : '#f8fafc';
            ctx.fillRect(pt.x - 36, bY - 60, 72, 60);

            // Roof
            ctx.fillStyle = isNight ? '#1d4ed8' : '#2563eb';
            ctx.beginPath();
            ctx.moveTo(pt.x - 42, bY - 60);
            ctx.lineTo(pt.x, bY - 96);
            ctx.lineTo(pt.x + 42, bY - 60);
            ctx.closePath();
            ctx.fill();

            // Columns
            ctx.fillStyle = '#e2e8f0';
            for (let c = -28; c <= 28; c += 18) {
              ctx.fillRect(pt.x + c - 2, bY - 56, 5, 54);
            }
          } else if (b.id === 'perpustakaan') {
            // Perpustakaan: Emerald Library
            ctx.fillStyle = isNight ? '#064e3b' : '#059669';
            ctx.fillRect(pt.x - 32, bY - 54, 64, 54);

            // Roof
            ctx.fillStyle = isNight ? '#047857' : '#10b981';
            ctx.beginPath();
            ctx.moveTo(pt.x - 36, bY - 54);
            ctx.lineTo(pt.x, bY - 84);
            ctx.lineTo(pt.x + 36, bY - 54);
            ctx.closePath();
            ctx.fill();

            // Big arched window
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(pt.x, bY - 30, 14, Math.PI, 0);
            ctx.fillRect(pt.x - 14, bY - 30, 28, 20);
            ctx.fill();
          } else if (b.id === 'menara_mentor') {
            // Menara Mentor: Violet Observatory Tower
            ctx.fillStyle = isNight ? '#312e81' : '#4338ca';
            ctx.fillRect(pt.x - 22, bY - 76, 44, 76);

            // Dome
            ctx.fillStyle = isNight ? '#6d28d9' : '#8b5cf6';
            ctx.beginPath();
            ctx.arc(pt.x, bY - 76, 22, Math.PI, 0);
            ctx.fill();

            // Telescope lens & sparkle
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pt.x + 8, bY - 88);
            ctx.lineTo(pt.x + 28, bY - 108);
            ctx.stroke();
          } else if (b.id === 'taman_refleksi') {
            // Taman Refleksi: Pagoda
            ctx.fillStyle = isNight ? '#831843' : '#db2777';
            ctx.fillRect(pt.x - 20, bY - 45, 40, 45);

            // Pagoda Roof 1
            ctx.fillStyle = isNight ? '#be185d' : '#ec4899';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34, bY - 26);
            ctx.lineTo(pt.x, bY - 48);
            ctx.lineTo(pt.x + 34, bY - 26);
            ctx.closePath();
            ctx.fill();

            // Pagoda Roof 2 (Upper)
            ctx.beginPath();
            ctx.moveTo(pt.x - 26, bY - 50);
            ctx.lineTo(pt.x, bY - 74);
            ctx.lineTo(pt.x + 26, bY - 50);
            ctx.closePath();
            ctx.fill();
          } else if (b.id === 'bengkel_latihan') {
            // Bengkel Latihan: Industrial Workshop
            ctx.fillStyle = isNight ? '#78350f' : '#b45309';
            ctx.fillRect(pt.x - 30, bY - 52, 60, 52);

            // Slanted roof
            ctx.fillStyle = isNight ? '#92400e' : '#d97706';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34, bY - 52);
            ctx.lineTo(pt.x - 10, bY - 80);
            ctx.lineTo(pt.x + 34, bY - 60);
            ctx.closePath();
            ctx.fill();

            // Chimney with steam
            ctx.fillStyle = '#475569';
            ctx.fillRect(pt.x - 24, bY - 90, 8, 20);
          } else if (b.id === 'kantor_pos') {
            // Kantor Pos: Red Mailbox Post
            ctx.fillStyle = isNight ? '#7f1d1d' : '#b91c1c';
            ctx.fillRect(pt.x - 28, bY - 48, 56, 48);

            // Roof
            ctx.fillStyle = isNight ? '#991b1b' : '#dc2626';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32, bY - 48);
            ctx.lineTo(pt.x, bY - 72);
            ctx.lineTo(pt.x + 32, bY - 48);
            ctx.closePath();
            ctx.fill();

            // Letter emblem
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(pt.x - 8, bY - 32, 16, 12);
          } else if (b.id === 'pasar_prestasi') {
            // Pasar Prestasi: Festive Cyan Circus Tent
            ctx.fillStyle = isNight ? '#0e7490' : '#0891b2';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32, bY - 30);
            ctx.lineTo(pt.x, bY - 80);
            ctx.lineTo(pt.x + 32, bY - 30);
            ctx.closePath();
            ctx.fill();

            // Striped panels
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 10, bY - 30);
            ctx.lineTo(pt.x, bY - 80);
            ctx.lineTo(pt.x + 10, bY - 30);
            ctx.closePath();
            ctx.fill();

            // Golden trophy topper
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(pt.x, bY - 84, 5, 0, Math.PI * 2);
            ctx.fill();
          } else if (b.id === 'monumen_warga') {
            // Monumen Warga: Center Plaza Fountain & Obelisk
            ctx.fillStyle = isNight ? '#334155' : '#94a3b8';
            ctx.beginPath();
            ctx.ellipse(pt.x, bY - 6, 28, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            // Water
            ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
            ctx.beginPath();
            ctx.ellipse(pt.x, bY - 8, 22, 10, 0, 0, Math.PI * 2);
            ctx.fill();

            // Center Obelisk Crystal
            ctx.fillStyle = '#ec4899';
            ctx.beginPath();
            ctx.moveTo(pt.x, bY - 46);
            ctx.lineTo(pt.x + 8, bY - 14);
            ctx.lineTo(pt.x - 8, bY - 14);
            ctx.closePath();
            ctx.fill();
          }

          // Animated Beacon atop building
          const beaconY = bY - (b.id === 'balai_kota' ? 104 : b.id === 'menara_mentor' ? 116 : 90);
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(pt.x, beaconY + Math.sin(elapsed * 4) * 3, 4.5, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing Beacon Halo
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(pt.x, beaconY + Math.sin(elapsed * 4) * 3, 8 + Math.sin(elapsed * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();

          // Floating Building Name Tag
          const tagY = beaconY - 14;
          const labelText = `${b.icon} ${b.name}`;
          ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
          const textMetrics = ctx.measureText(labelText);
          const tagW = textMetrics.width + 16;
          const tagH = 22;

          ctx.fillStyle = isHovered ? '#1e293b' : 'rgba(15, 23, 42, 0.88)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tagW / 2, tagY - tagH / 2, tagW, tagH, 11);
          ctx.fill();
          ctx.strokeStyle = isHovered ? '#38bdf8' : 'rgba(100, 116, 139, 0.6)';
          ctx.lineWidth = isHovered ? 2 : 1;
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pt.x, tagY);
        } else if (item.type === 'cafe') {
          // FEATURE 3: KAFE WARGA (Stall with awning, coffee, bread, ice cream)
          const pt = toScreen(cafeWx, cafeWy, 0, camera.x, camera.y);

          // Update Screen Pos for HTML menu overlay
          setCafeScreenPos({
            x: pt.x,
            y: pt.y - 56,
            visible: true,
          });

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 4, 32, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // Wooden Counter
          ctx.fillStyle = '#78350f';
          ctx.fillRect(pt.x - 26, pt.y - 24, 52, 24);

          // Green & White Striped Canvas Awning
          const stripeW = 52 / 6;
          for (let s = 0; s < 6; s++) {
            ctx.fillStyle = s % 2 === 0 ? '#059669' : '#f8fafc';
            ctx.fillRect(pt.x - 26 + s * stripeW, pt.y - 48, stripeW, 24);
          }

          // Awning roof slant
          ctx.fillStyle = '#047857';
          ctx.beginPath();
          ctx.moveTo(pt.x - 28, pt.y - 48);
          ctx.lineTo(pt.x, pt.y - 62);
          ctx.lineTo(pt.x + 28, pt.y - 48);
          ctx.closePath();
          ctx.fill();

          // Mini items on counter: ☕ Kopi, 🍞 Roti, 🍦 Eskrim
          // ☕ Coffee Cup
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pt.x - 18, pt.y - 28, 6, 8);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pt.x - 17, pt.y - 26, 4, 4);

          // 🍞 Bread Loaf
          ctx.fillStyle = '#d97706';
          ctx.beginPath();
          ctx.roundRect(pt.x - 4, pt.y - 28, 10, 7, 3);
          ctx.fill();

          // 🍦 Ice cream cone
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(pt.x + 12, pt.y - 22);
          ctx.lineTo(pt.x + 16, pt.y - 22);
          ctx.lineTo(pt.x + 14, pt.y - 16);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(pt.x + 14, pt.y - 24, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Floating Cafe Badge
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          ctx.roundRect(pt.x - 38, pt.y - 78, 76, 20, 10);
          ctx.fill();
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☕ Kafe Warga', pt.x, pt.y - 68);
        } else if (item.type === 'avatar') {
          // FEATURE 3 & 4: AVATARS (Siswa, Guru, Polisi, Petugas Kebersihan, Kurir, Barista)
          const av = item.data;
          const pt = toScreen(av.wx, av.wy, 0, camera.x, camera.y);

          // Avatar Ground Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 2, 10, 5, 0, 0, Math.PI * 2);
          ctx.fill();

          // Walking legs animation
          const legSwing = av.isMoving ? Math.sin(av.walkFrame) * 6 : 0;
          const bodyBob = av.isMoving ? Math.abs(Math.sin(av.walkFrame * 2)) * 2 : 0;
          const avY = pt.y - bodyBob;

          // Legs
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          // Left Leg
          ctx.beginPath();
          ctx.moveTo(pt.x - 3, avY - 8);
          ctx.lineTo(pt.x - 3 + legSwing, avY);
          ctx.stroke();
          // Right Leg
          ctx.beginPath();
          ctx.moveTo(pt.x + 3, avY - 8);
          ctx.lineTo(pt.x + 3 - legSwing, avY);
          ctx.stroke();

          // Torso / Attire based on Role
          ctx.fillStyle = av.color;
          ctx.beginPath();
          ctx.roundRect(pt.x - 6, avY - 22, 12, 14, 3);
          ctx.fill();

          // Head / Face
          ctx.fillStyle = '#fed7aa'; // Skin tone
          ctx.beginPath();
          ctx.arc(pt.x, avY - 27, 6, 0, Math.PI * 2);
          ctx.fill();

          // Hair / Headgear based on role
          if (av.role === 'polisi') {
            // Police Cap (Blue with gold badge)
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(pt.x - 7, avY - 34, 14, 5);
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 32, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (av.role === 'petugas_kebersihan') {
            // High-vis vest stripes & Green Cap
            ctx.fillStyle = '#facc15';
            ctx.fillRect(pt.x - 6, avY - 18, 12, 3);
            ctx.fillStyle = '#15803d';
            ctx.fillRect(pt.x - 6, avY - 34, 12, 5);
            // Broom in hand
            ctx.strokeStyle = '#a16207';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(pt.x + 7, avY - 24);
            ctx.lineTo(pt.x + 11, avY + 2);
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(pt.x + 8, avY, 6, 4);
          } else if (av.role === 'kurir') {
            // Delivery Cap & Backpack parcel
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(pt.x - 6, avY - 34, 12, 5);
            // Delivery parcel backpack
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 11, avY - 22, 5, 10);
          } else if (av.role === 'guru') {
            // Glasses & neat dark hair
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pt.x - 6, avY - 34, 12, 5);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1;
            ctx.strokeRect(pt.x - 4, avY - 28, 8, 3);
          } else if (av.role === 'barista') {
            // Apron
            ctx.fillStyle = '#065f46';
            ctx.fillRect(pt.x - 4, avY - 20, 8, 11);
          } else {
            // Siswa (Player) Hair
            ctx.fillStyle = studentGender === 'P' ? '#7c2d12' : '#0f172a';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 31, 6.5, Math.PI, 0);
            ctx.fill();
          }

          // Floating Username Pill Tag
          const tagText = `@${av.handle}`;
          ctx.font = 'bold 9.5px system-ui, -apple-system, sans-serif';
          const tMetrics = ctx.measureText(tagText);
          const tW = tMetrics.width + 12;
          const tH = 17;
          const tagPosY = avY - 42;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tW / 2, tagPosY - tH / 2, tW, tH, 8);
          ctx.fill();
          ctx.strokeStyle = item.isPlayer ? '#38bdf8' : 'rgba(148, 163, 184, 0.5)';
          ctx.lineWidth = item.isPlayer ? 1.5 : 1;
          ctx.stroke();

          ctx.fillStyle = item.isPlayer ? '#7dd3fc' : '#f1f5f9';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tagText, pt.x, tagPosY);

          // Comic Speech Bubble (if any)
          let speech: string | undefined = av.speechText;
          if (item.isPlayer && playerSpeechRef.current && Date.now() < playerSpeechRef.current.expiresAt) {
            speech = playerSpeechRef.current.text;
          }
          if (av.role === 'barista' && baristaSpeechRef.current && Date.now() < baristaSpeechRef.current.expiresAt) {
            speech = baristaSpeechRef.current.text;
          }

          if (speech) {
            ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
            const sMetrics = ctx.measureText(speech);
            const sW = sMetrics.width + 16;
            const sH = 22;
            const bubbleY = tagPosY - 22;

            // White comic bubble
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(pt.x - sW / 2, bubbleY - sH / 2, sW, sH, 11);
            ctx.fill();

            // Little speech arrow pointing down
            ctx.beginPath();
            ctx.moveTo(pt.x - 4, bubbleY + sH / 2);
            ctx.lineTo(pt.x + 4, bubbleY + sH / 2);
            ctx.lineTo(pt.x, bubbleY + sH / 2 + 5);
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
      // FEATURE 2: MALAM - KUNANG-KUNANG BERPENDAR (Animated Fireflies)
      // ---------------------------------------------------------
      if (isNight) {
        fireflies.forEach((f) => {
          f.x = f.baseX + Math.sin(elapsed * f.speed + f.phase) * f.radiusX;
          f.y = f.baseY + Math.cos(elapsed * (f.speed * 0.9) + f.phase * 1.5) * f.radiusY;
          const fScreen = toScreen(f.x, f.y, 6 + Math.sin(elapsed * 2 + f.phase) * 4, camera.x, camera.y);

          const blink = 0.35 + 0.65 * Math.max(0, Math.sin(elapsed * f.blinkSpeed + f.phase));

          // Soft green-yellow glow
          const glow = ctx.createRadialGradient(fScreen.x, fScreen.y, 1, fScreen.x, fScreen.y, 8);
          glow.addColorStop(0, `rgba(163, 230, 53, ${blink})`);
          glow.addColorStop(0.6, `rgba(234, 179, 8, ${blink * 0.45})`);
          glow.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(fScreen.x, fScreen.y, 8, 0, Math.PI * 2);
          ctx.fill();

          // Firefly core
          ctx.fillStyle = `rgba(254, 240, 138, ${blink})`;
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
  // FEATURE 3: KAFE WARGA ITEM PURCHASES (Kopi, Roti, Eskrim)
  // -------------------------------------------------------------
  const handleBuyCoffee = () => {
    sounds.playRewardXp();
    setCafeToast('☕ Menikmati kopi hangat nikmat! Barista @nnisa_0311 tersenyum ramah.');
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
    setCafeToast('🍞 Roti panggang gurih disantap di taman kota!');
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
    setCafeToast('🍦 Eskrim vanila strawberry manis menyegarkan harimu di Kota Refleksi!');
    baristaSpeechRef.current = {
      text: 'Eskrim manis spesial untuk warga teladan! 🍦',
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
      data-testid="town-canvas-2d"
    >
      {/* 2D High Performance Canvas */}
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
          <div className="bg-[#1a2530]/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl border border-slate-700/80 shadow-[0_12px_36px_0_rgba(0,0,0,0.65)] flex flex-col items-center gap-2.5 min-w-[260px]">
            {/* Header with Close Button */}
            <div className="w-full flex items-center justify-between border-b border-slate-700/70 pb-1.5">
              <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-extrabold text-white">Cafe buka</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-300 font-semibold">barista @nnisa_0311</span>
              </div>
              <button
                onClick={() => setIsCafeMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Tutup Menu Kafe"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Menu Items: Kopi, Roti, and Eskrim */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleBuyCoffee}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                title="Beli Kopi Hangat"
              >
                <span className="text-base">☕</span>
                <span className="text-[10px] mt-0.5">Kopi - 2</span>
              </button>
              <button
                onClick={handleBuyBread}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                title="Beli Roti Panggang"
              >
                <span className="text-base">🍞</span>
                <span className="text-[10px] mt-0.5">Roti - 1</span>
              </button>
              <button
                onClick={handleBuyIceCream}
                className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                title="Beli Eskrim Manis Segar"
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-[#1e293b]/95 backdrop-blur-md text-emerald-300 font-bold text-xs sm:text-sm px-4 py-2 rounded-full border border-emerald-500/40 shadow-2xl animate-fade-in-up flex items-center gap-2">
          <span>✨</span>
          <span>{cafeToast}</span>
        </div>
      )}
    </div>
  );
};
