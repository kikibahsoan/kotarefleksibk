import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BuildingId, PublicChatMessage } from '../types/index.ts';
import { StorageService } from '../utils/storage.ts';
import {
  Send,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ThreeTownCanvasProps {
  onSelectBuilding: (buildingId: BuildingId) => void;
  activeBuilding: BuildingId | null;
  newMateriBuildingIds: BuildingId[];
  studentName?: string;
  studentGender?: string;
  timeOfDay?: 'day' | 'night' | 'auto';
}

export interface BuildingInfo {
  id: BuildingId;
  name: string;
  tagline: string;
  position: [number, number, number];
  color: number;
}

export const BUILDINGS_INFO: BuildingInfo[] = [
  { id: 'balai_kota', name: 'Balai Kota', tagline: 'Misi & Pengumuman Utama', position: [0, -165, 0], color: 0x3b82f6 },
  { id: 'perpustakaan', name: 'Perpustakaan', tagline: 'Materi & Video Ajar', position: [-210, -95, 0], color: 0x10b981 },
  { id: 'taman_refleksi', name: 'Taman Refleksi', tagline: 'Tulis Refleksi Harian', position: [-210, 85, 0], color: 0xec4899 },
  { id: 'menara_mentor', name: 'Menara Mentor', tagline: 'Umpan Balik AI Mentor', position: [210, -95, 0], color: 0x8b5cf6 },
  { id: 'bengkel_latihan', name: 'Bengkel Latihan', tagline: 'Kuis & Tantangan', position: [210, 85, 0], color: 0xf59e0b },
  { id: 'kantor_pos', name: 'Kantor Pos', tagline: 'Kirim Pesan ke Guru', position: [-110, 145, 0], color: 0xef4444 },
  { id: 'pasar_prestasi', name: 'Pasar Prestasi', tagline: 'Lencana & Poin XP', position: [110, 145, 0], color: 0x06b6d4 },
  { id: 'monumen_warga', name: 'Papan Informasi', tagline: 'Pusat Pengumuman & Berita Kota', position: [0, 0, 0], color: 0xec4899 },
];

interface ProfessionNPC {
  id: string;
  name: string;
  handle: string;
  gender: 'L' | 'P';
  profession: string;
  professionBadge: string;
  badgeBg: string;
  shirtColor: string;
  pantsColor: string;
  skinColor: string;
  hairColor: string;
  hasHijab?: boolean;
  accessory?: 'glasses' | 'police_hat' | 'guard_hat' | 'broom' | 'stethoscope' | 'apron' | 'fishing_rod';
  waypoints: { x: number; y: number }[];
  currentWaypointIdx: number;
  x: number;
  y: number;
  facing: 'left' | 'right';
  pauseTimer: number;
  quotes: string[];
}

export const ThreeTownCanvas: React.FC<ThreeTownCanvasProps> = ({
  onSelectBuilding,
  activeBuilding,
  newMateriBuildingIds,
  studentName = 'Murid Refleksia',
  studentGender = 'L',
  timeOfDay = 'night',
}) => {
  // Player state
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 55 });
  const [targetPos, setTargetPos] = useState({ x: 0, y: 55 });
  const [isWalking, setIsWalking] = useState(false);
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
  const [playerSpeechBubble, setPlayerSpeechBubble] = useState<string | null>(null);

  // Active temporary NPC bubble (only 1 or at most 2, automatically disappears)
  const [activeNpcBubble, setActiveNpcBubble] = useState<{
    npcId: string;
    text: string;
  } | null>(null);

  // Hovered building info
  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingInfo | null>(null);

  // Cafe popup modal state
  const [isCafeOpen, setIsCafeOpen] = useState(false);
  const [cafeFeedback, setCafeFeedback] = useState<string | null>(null);

  // Kolam pancing feedback
  const [fishingFeedback, setFishingFeedback] = useState<string | null>(null);

  // Chat bar & Obrolan window state
  const [chatInput, setChatInput] = useState('');
  const [isChatWindowOpen, setIsChatWindowOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState<PublicChatMessage[]>(() =>
    StorageService.getPublicChatMessages()
  );

  // Day / Night state calculation
  const isNight = timeOfDay === 'night' || (timeOfDay === 'auto' && new Date().getHours() >= 18);

  // Moving Clouds State for Day Mode ("awan berjalan")
  const [clouds, setClouds] = useState([
    { id: 1, x: -350, y: -210, speed: 14, scale: 1.1 },
    { id: 2, x: -180, y: -160, speed: 22, scale: 0.85 },
    { id: 3, x: 20, y: -230, speed: 10, scale: 1.35 },
    { id: 4, x: 190, y: -180, speed: 18, scale: 0.95 },
    { id: 5, x: 380, y: -140, speed: 25, scale: 0.75 },
  ]);

  // Animated Fireflies for Night Mode ("kunang-kunang")
  const fireflyBases = useMemo(() => [
    { id: 1, x: -160, y: -40, phase: 0.2, speed: 1.8 },
    { id: 2, x: -90, y: -110, phase: 1.4, speed: 2.2 },
    { id: 3, x: -40, y: -30, phase: 2.8, speed: 1.6 },
    { id: 4, x: 50, y: -50, phase: 4.1, speed: 2.0 },
    { id: 5, x: 120, y: -70, phase: 0.9, speed: 1.7 },
    { id: 6, x: -180, y: 50, phase: 3.3, speed: 2.1 },
    { id: 7, x: -80, y: 80, phase: 5.0, speed: 1.5 },
    { id: 8, x: 70, y: 40, phase: 2.1, speed: 1.9 },
    { id: 9, x: 140, y: 70, phase: 0.5, speed: 2.3 },
    { id: 10, x: 170, y: 140, phase: 4.4, speed: 1.6 },
    { id: 11, x: -220, y: 20, phase: 1.8, speed: 2.0 },
    { id: 12, x: 20, y: -130, phase: 3.7, speed: 1.7 },
    { id: 13, x: 0, y: 90, phase: 2.5, speed: 2.2 },
    { id: 14, x: 90, y: 120, phase: 1.1, speed: 1.8 },
  ], []);

  const [fireflyOffsets, setFireflyOffsets] = useState(
    fireflyBases.map(() => ({ dx: 0, dy: 0, glow: 1 }))
  );

  // 6+ Moving NPCs with Professions (Guru, Polisi, Penjaga Kota, Tukang Bersih, Petugas Medis, Barista, Pemancing)
  const [npcList, setNpcList] = useState<ProfessionNPC[]>([
    {
      id: 'npc-guru',
      name: 'Pak Rahman',
      handle: '@guru_rahman',
      gender: 'L',
      profession: 'Guru DKV',
      professionBadge: '👨‍🏫 GURU DKV',
      badgeBg: '#059669',
      shirtColor: '#10b981',
      pantsColor: '#1e293b',
      skinColor: '#fbcfe8',
      hairColor: '#1e293b',
      accessory: 'glasses',
      x: 0,
      y: -100,
      facing: 'right',
      pauseTimer: 2,
      currentWaypointIdx: 0,
      waypoints: [
        { x: 0, y: -140 },
        { x: -120, y: -65 },
        { x: 0, y: -45 },
        { x: 0, y: -100 },
      ],
      quotes: [
        'Sudah memahami konsep IPO Von Neumann? Yuk refleksi!',
        'Semangat belajarnya ya anak-anak!',
        'Karya desain DKV yang baik dimulai dari logika yang teratur.',
      ],
    },
    {
      id: 'npc-polisi',
      name: 'Bripka Dimas',
      handle: '@polisi_dimas',
      gender: 'L',
      profession: 'Polisi Kota',
      professionBadge: '👮 POLISI KOTA',
      badgeBg: '#2563eb',
      shirtColor: '#1d4ed8',
      pantsColor: '#0f172a',
      skinColor: '#fed7aa',
      hairColor: '#0f172a',
      accessory: 'police_hat',
      x: 100,
      y: -40,
      facing: 'right',
      pauseTimer: 3,
      currentWaypointIdx: 0,
      waypoints: [
        { x: 170, y: -75 },
        { x: 60, y: -25 },
        { x: 120, y: 40 },
        { x: 180, y: 70 },
      ],
      quotes: [
        'Situasi Refleksia City aman dan tertib!',
        'Silakan belajar dengan fokus dan tenang ya!',
        'Patroli kota berjalan lancar.',
      ],
    },
    {
      id: 'npc-penjaga',
      name: 'Pak Hendra',
      handle: '@penjaga_hendra',
      gender: 'L',
      profession: 'Penjaga Kota',
      professionBadge: '🛡️ PENJAGA KOTA',
      badgeBg: '#d97706',
      shirtColor: '#65a30d',
      pantsColor: '#365314',
      skinColor: '#fbcfe8',
      hairColor: '#1e293b',
      accessory: 'guard_hat',
      x: -60,
      y: 20,
      facing: 'left',
      pauseTimer: 1,
      currentWaypointIdx: 0,
      waypoints: [
        { x: 0, y: 35 },
        { x: -60, y: 20 },
        { x: -120, y: 45 },
        { x: -50, y: -20 },
      ],
      quotes: [
        'Fasilitas kota terjaga rapi untuk murid SMK!',
        'Jaga kebersihan dan ketertiban kota kita bersama.',
        'Papan informasi di tengah plaza siap dibaca.',
      ],
    },
    {
      id: 'npc-kebersihan',
      name: 'Ibu Siti',
      handle: '@kebersihan_siti',
      gender: 'P',
      profession: 'Petugas Kebersihan',
      professionBadge: '🧹 TUKANG BERSIH',
      badgeBg: '#0d9488',
      shirtColor: '#f97316',
      pantsColor: '#1e293b',
      skinColor: '#fed7aa',
      hairColor: '#f8fafc',
      hasHijab: true,
      accessory: 'broom',
      x: -140,
      y: -50,
      facing: 'right',
      pauseTimer: 4,
      currentWaypointIdx: 0,
      waypoints: [
        { x: -120, y: -25 },
        { x: -160, y: 60 },
        { x: -80, y: -20 },
        { x: -140, y: -50 },
      ],
      quotes: [
        'Kota yang asri dan bersih membuat pikiran segar berefleksi!',
        'Ayo jaga taman dan jalan tetap bersih ya.',
        'Sapu dulu area sekitar kafe dan taman.',
      ],
    },
    {
      id: 'npc-medis',
      name: 'dr. Maya',
      handle: '@medis_maya',
      gender: 'P',
      profession: 'Petugas Medis',
      professionBadge: '🩺 DOKTER UKS',
      badgeBg: '#e11d48',
      shirtColor: '#f8fafc',
      pantsColor: '#475569',
      skinColor: '#fbcfe8',
      hairColor: '#f8fafc',
      hasHijab: true,
      accessory: 'stethoscope',
      x: -40,
      y: -70,
      facing: 'left',
      pauseTimer: 2,
      currentWaypointIdx: 0,
      waypoints: [
        { x: 0, y: -60 },
        { x: -120, y: -65 },
        { x: -60, y: 30 },
        { x: -40, y: -70 },
      ],
      quotes: [
        'Jaga kesehatan dan cukup minum air saat belajar!',
        'Kesehatan mental dan fisik sangat penting untuk murid.',
        'Ada yang butuh vitamin atau istirahat sejenak?',
      ],
    },
    {
      id: 'npc-barista',
      name: 'Nnisa',
      handle: '@nnisa_0311',
      gender: 'P',
      profession: 'Barista Cafe',
      professionBadge: '☕ BARISTA',
      badgeBg: '#b45309',
      shirtColor: '#b45309',
      pantsColor: '#1e1b4b',
      skinColor: '#fde047',
      hairColor: '#1e293b',
      accessory: 'apron',
      x: -115,
      y: -25,
      facing: 'right',
      pauseTimer: 99999, // Stationary at cafe
      currentWaypointIdx: 0,
      waypoints: [{ x: -115, y: -25 }],
      quotes: [
        'Cafe buka! Kopi dan roti siap disajikan ☕',
        'Nikmati aroma kopi di Refleksia City.',
      ],
    },
    {
      id: 'npc-pancing',
      name: 'Kiky',
      handle: '@kikybahsoan',
      gender: 'L',
      profession: 'Pemancing',
      professionBadge: '🎣 PEMANCING',
      badgeBg: '#0284c7',
      shirtColor: '#0284c7',
      pantsColor: '#1e293b',
      skinColor: '#fbcfe8',
      hairColor: '#1e293b',
      accessory: 'fishing_rod',
      x: 165,
      y: 110,
      facing: 'left',
      pauseTimer: 99999, // Stationary at pier
      currentWaypointIdx: 0,
      waypoints: [{ x: 165, y: 110 }],
      quotes: [
        'Asyik memancing di kolam Refleksia! Dapet ikan mujair 🐟',
        'Menunggu kail sambil santai sejenak.',
      ],
    },
  ]);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Periodic random single speech bubble (strictly 1 NPC occasionally, auto disappearing)
  useEffect(() => {
    const timer = setInterval(() => {
      const activeCandidates = npcList.filter((n) => n.quotes.length > 0);
      const chosen = activeCandidates[Math.floor(Math.random() * activeCandidates.length)];
      const text = chosen.quotes[Math.floor(Math.random() * chosen.quotes.length)];

      setActiveNpcBubble({
        npcId: chosen.id,
        text,
      });

      setTimeout(() => {
        setActiveNpcBubble((prev) => (prev?.npcId === chosen.id ? null : prev));
      }, 3500);
    }, 13000);

    return () => clearInterval(timer);
  }, [npcList]);

  // Master Animation Loop: Clouds drift, Fireflies hover, Player & NPCs walk smoothly
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const t = now / 1000;

      // 1. Animate Moving Clouds (Day mode)
      if (!isNight) {
        setClouds((prev) =>
          prev.map((c) => {
            let nextX = c.x + c.speed * dt;
            if (nextX > 480) nextX = -480;
            return { ...c, x: nextX };
          })
        );
      }

      // 2. Animate Fireflies (Night mode)
      if (isNight) {
        setFireflyOffsets(
          fireflyBases.map((f) => ({
            dx: Math.sin(t * f.speed + f.phase) * 12,
            dy: Math.cos(t * f.speed * 0.8 + f.phase) * 8,
            glow: 0.35 + 0.65 * Math.abs(Math.sin(t * 3.5 + f.phase)),
          }))
        );
      }

      // 3. Animate Player Movement
      setPlayerPos((curr) => {
        const dx = targetPos.x - curr.x;
        const dy = targetPos.y - curr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 2.5) {
          setIsWalking(false);
          return targetPos;
        }

        setIsWalking(true);
        if (Math.abs(dx) > 1) {
          setPlayerFacing(dx > 0 ? 'right' : 'left');
        }

        const speed = 140;
        const stepDist = Math.min(speed * dt, dist);
        const ratio = stepDist / dist;

        return {
          x: curr.x + dx * ratio,
          y: curr.y + dy * ratio,
        };
      });

      // 4. Animate NPCs Walking
      setNpcList((prevList) =>
        prevList.map((npc) => {
          if (npc.waypoints.length <= 1) return npc;

          if (npc.pauseTimer > 0) {
            return {
              ...npc,
              pauseTimer: npc.pauseTimer - dt,
            };
          }

          const target = npc.waypoints[npc.currentWaypointIdx];
          const dx = target.x - npc.x;
          const dy = target.y - npc.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 3) {
            // Reached waypoint: pause and select next
            const nextIdx = (npc.currentWaypointIdx + 1) % npc.waypoints.length;
            return {
              ...npc,
              x: target.x,
              y: target.y,
              currentWaypointIdx: nextIdx,
              pauseTimer: 3 + Math.random() * 4,
            };
          }

          const speed = 32; // relaxed patrol speed
          const moveStep = Math.min(speed * dt, dist);
          const ratio = moveStep / dist;
          const newX = npc.x + dx * ratio;
          const newY = npc.y + dy * ratio;
          const facing = dx >= 0 ? 'right' : 'left';

          return {
            ...npc,
            x: newX,
            y: newY,
            facing,
          };
        })
      );

      animationRef.current = requestAnimationFrame(loop);
    };

    animationRef.current = requestAnimationFrame(loop);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetPos, isNight, fireflyBases]);

  // Click on island ground to walk
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());

    // Clamp inside island
    const cx = Math.max(-270, Math.min(270, cursorPt.x));
    const cy = Math.max(-160, Math.min(160, cursorPt.y));
    setTargetPos({ x: cx, y: cy });
  };

  // Quick chat send
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg: PublicChatMessage = {
      id: `pchat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderId: 'current-student',
      senderName: studentName,
      senderHandle: '@' + (studentName.split(' ')[0] || 'siswa').toLowerCase(),
      className: 'DKV',
      roomNumber: 2,
      content: chatInput.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.'),
      createdAt: new Date().toISOString(),
    };

    StorageService.addPublicChatMessage(newMsg);
    setChatMessages(StorageService.getPublicChatMessages());
    setPlayerSpeechBubble(chatInput.trim());
    setChatInput('');

    setTimeout(() => {
      setPlayerSpeechBubble(null);
    }, 4500);
  };

  // NPC click interaction
  const handleNpcClick = (npc: ProfessionNPC, e: React.MouseEvent) => {
    e.stopPropagation();
    const quote = npc.quotes[Math.floor(Math.random() * npc.quotes.length)];
    setActiveNpcBubble({
      npcId: npc.id,
      text: quote,
    });
    setTimeout(() => {
      setActiveNpcBubble((prev) => (prev?.npcId === npc.id ? null : prev));
    }, 3500);
  };

  const handleCafeOrder = (item: 'Kopi' | 'Roti') => {
    setCafeFeedback(`☕ Barista menyajikan ${item} hangat untukmu!`);
    setTimeout(() => setCafeFeedback(null), 3000);
  };

  const handleFishingClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setFishingFeedback('🎣 Kail dilempar... Berhasil memancing ikan mujair!');
    setTimeout(() => setFishingFeedback(null), 3500);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none overflow-hidden transition-colors duration-700 ${
        isNight ? 'bg-[#0c1427]' : 'bg-gradient-to-b from-[#38bdf8] via-[#7dd3fc] to-[#bae6fd]'
      }`}
      data-testid="vector-town-canvas"
    >
      {/* 1. SKY DECORATIONS (CELESTIAL & MOVING CLOUDS / FIREFLIES) */}
      <div className="absolute inset-0 pointer-events-none">
        {isNight ? (
          <>
            {/* Twinkling Starfield */}
            <div className="absolute top-8 left-1/4 w-1 h-1 bg-white rounded-full opacity-60 animate-pulse" />
            <div className="absolute top-16 left-1/3 w-1.5 h-1.5 bg-yellow-100 rounded-full opacity-70" />
            <div className="absolute top-12 right-1/4 w-1 h-1 bg-white rounded-full opacity-50" />
            <div className="absolute top-24 right-1/3 w-1 h-1 bg-cyan-100 rounded-full opacity-60 animate-pulse" />
            <div className="absolute top-36 left-12 w-1.5 h-1.5 bg-white rounded-full opacity-40" />
            <div className="absolute top-48 right-16 w-1 h-1 bg-white rounded-full opacity-50" />

            {/* Crescent Moon */}
            <div className="absolute top-10 right-28 sm:right-36 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-yellow-200/10 blur-xl absolute" />
              <div className="relative text-3xl sm:text-4xl filter drop-shadow-[0_0_12px_rgba(254,240,138,0.7)] select-none">
                🌙
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Glowing Day Sun */}
            <div className="absolute top-8 right-24 sm:right-32 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-amber-300/30 blur-2xl absolute animate-pulse" />
              <div className="relative text-4xl sm:text-5xl filter drop-shadow-[0_0_16px_rgba(251,191,36,0.8)] select-none">
                ☀️
              </div>
            </div>
          </>
        )}
      </div>

      {/* 2. VECTOR 2D ISOMETRIC SVG MAP */}
      <svg
        viewBox="-440 -260 880 520"
        className="w-full h-full cursor-crosshair transition-transform duration-300"
        onClick={handleMapClick}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Radial light glow for street lamps */}
          <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3b0" stopOpacity={isNight ? 0.45 : 0.15} />
            <stop offset="35%" stopColor="#fef08a" stopOpacity={isNight ? 0.25 : 0.08} />
            <stop offset="70%" stopColor="#eab308" stopOpacity={isNight ? 0.08 : 0.02} />
            <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
          </radialGradient>

          {/* Grass Island Top Gradient */}
          <linearGradient id="grassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#2c6943' : '#34d399'} />
            <stop offset="100%" stopColor={isNight ? '#204f32' : '#10b981'} />
          </linearGradient>

          {/* Under-cliff Gradients */}
          <linearGradient id="cliffLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3d2817" />
            <stop offset="100%" stopColor="#21150c" />
          </linearGradient>
          <linearGradient id="cliffRight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2f1e11" />
            <stop offset="100%" stopColor="#170e08" />
          </linearGradient>

          {/* Fountain Water */}
          <radialGradient id="fountainWater" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="70%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>

          {/* Firefly Glow Filter */}
          <filter id="fireflyGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ------------------------------------------------------------- */}
        {/* A. MOVING CLOUDS IN DAY MODE ("AWAN BERJALAN")                */}
        {/* ------------------------------------------------------------- */}
        {!isNight &&
          clouds.map((c) => (
            <g key={c.id} transform={`translate(${c.x}, ${c.y}) scale(${c.scale})`} opacity="0.9">
              <ellipse cx="0" cy="0" rx="38" ry="16" fill="#ffffff" />
              <circle cx="-16" cy="-8" r="18" fill="#ffffff" />
              <circle cx="8" cy="-12" r="22" fill="#ffffff" />
              <circle cx="26" cy="-4" r="16" fill="#ffffff" />
            </g>
          ))}

        {/* ------------------------------------------------------------- */}
        {/* B. FLOATING ISLAND BEDROCK & CLIFFS                           */}
        {/* ------------------------------------------------------------- */}
        {/* Left Cliff */}
        <polygon points="-360,-10 0,185 0,230 -360,35" fill="url(#cliffLeft)" />
        {/* Right Cliff */}
        <polygon points="0,185 360,-10 360,35 0,230" fill="url(#cliffRight)" />
        {/* Rock striations */}
        <line x1="-180" y1="87" x2="-180" y2="132" stroke="#1c1109" strokeWidth="3" opacity="0.6" />
        <line x1="-90" y1="135" x2="-90" y2="180" stroke="#1c1109" strokeWidth="4" opacity="0.6" />
        <line x1="180" y1="87" x2="180" y2="132" stroke="#120b06" strokeWidth="3" opacity="0.7" />
        <line x1="90" y1="135" x2="90" y2="180" stroke="#120b06" strokeWidth="4" opacity="0.7" />

        {/* Top Lawn Diamond Slab */}
        <polygon
          points="0,-205 360,-10 0,185 -360,-10"
          fill="url(#grassGrad)"
          stroke="#397d52"
          strokeWidth="3"
        />

        {/* ------------------------------------------------------------- */}
        {/* C. NEAT & SYMMETRICAL ROADS ("JALANNYA DIRAPIHKAN")          */}
        {/* ------------------------------------------------------------- */}
        {/* Road Base Styling: Warm Cobblestone Paving */}
        <g id="neat-roads">
          {/* 1. Grand North Boulevard (Balai Kota) */}
          <polygon
            points="-22,-38 22,-38 26,-175 -26,-175"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="2"
          />
          {/* Road center dash */}
          <line x1="0" y1="-44" x2="0" y2="-170" stroke="#eae5da" strokeWidth="2" strokeDasharray="6 4" />

          {/* 2. North-West Boulevard (Perpustakaan) */}
          <polygon
            points="-40,-20 -24,-34 -222,-108 -234,-96"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="2"
          />

          {/* 3. North-East Boulevard (Menara Mentor) */}
          <polygon
            points="40,-20 24,-34 222,-108 234,-96"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="2"
          />

          {/* 4. South-West Boulevard (Taman Refleksi) */}
          <polygon
            points="-40,20 -24,34 -222,108 -234,96"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="2"
          />

          {/* 5. South-East Boulevard (Bengkel Latihan) */}
          <polygon
            points="40,20 24,34 222,108 234,96"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="2"
          />

          {/* 6. South Connector to Kantor Pos & Pasar Prestasi */}
          <polygon
            points="-20,38 20,38 126,145 94,155"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="1.5"
          />
          <polygon
            points="-20,38 20,38 -94,155 -126,145"
            fill="#ded8cd"
            stroke="#b8b09f"
            strokeWidth="1.5"
          />

          {/* 7. Walkway Branches to Cafe & Fishing Pier */}
          <polygon points="-45,-8 -45,-26 -130,-34 -130,-16" fill="#ded8cd" stroke="#b8b09f" strokeWidth="1.5" />
          <polygon points="45,8 45,26 185,116 185,98" fill="#ded8cd" stroke="#b8b09f" strokeWidth="1.5" />

          {/* Central Fountain Circular Plaza with Concentric Rings */}
          <ellipse cx="0" cy="0" rx="84" ry="48" fill="#ded8cd" stroke="#b8b09f" strokeWidth="2.5" />
          <ellipse cx="0" cy="0" rx="72" ry="41" fill="#e8e3d8" stroke="#c4bead" strokeWidth="1" strokeDasharray="8 4" />
        </g>

        {/* ------------------------------------------------------------- */}
        {/* D. WARM STREET LANTERNS WITH SOFT GROUND GLOW HALOS          */}
        {/* ------------------------------------------------------------- */}
        {[
          { x: -55, y: -45 },
          { x: 55, y: -45 },
          { x: -55, y: 45 },
          { x: 55, y: 45 },
          { x: -145, y: -75 },
          { x: 145, y: -75 },
          { x: -145, y: 75 },
          { x: 145, y: 75 },
          { x: 0, y: -115 },
          { x: 0, y: 95 },
        ].map((lamp, i) => (
          <g key={`lamp-${i}`}>
            <ellipse cx={lamp.x} cy={lamp.y + 4} rx="44" ry="24" fill="url(#lampGlow)" />
            <ellipse cx={lamp.x} cy={lamp.y} rx="3" ry="1.5" fill="#1e293b" />
            <line x1={lamp.x} y1={lamp.y} x2={lamp.x} y2={lamp.y - 18} stroke="#0f172a" strokeWidth="2.5" />
            <circle cx={lamp.x} cy={lamp.y - 19} r="4" fill="#fffbeb" filter="drop-shadow(0 0 6px #fef08a)" />
            <circle cx={lamp.x} cy={lamp.y - 19} r="2.2" fill="#ffffff" />
          </g>
        ))}

        {/* ------------------------------------------------------------- */}
        {/* E. CENTRAL PLAZA & PAPAN INFORMASI ("MONUMEN WARGA")          */}
        {/* ------------------------------------------------------------- */}
        {/* Central Fountain */}
        <g id="central-fountain">
          <ellipse cx="0" cy="0" rx="42" ry="24" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <ellipse cx="0" cy="0" rx="36" ry="20" fill="url(#fountainWater)" />
          <ellipse cx="0" cy="-4" rx="20" ry="11" fill="#cbd5e1" stroke="#64748b" strokeWidth="1.5" />
          <ellipse cx="0" cy="-4" rx="16" ry="8" fill="#38bdf8" />
          <ellipse cx="0" cy="-9" rx="6" ry="3.5" fill="#f8fafc" />
          <line x1="0" y1="-9" x2="0" y2="-17" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="2 1" />

          {/* Curved Benches */}
          <path d="M -50,-15 Q -42,-26 -30,-30" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 50,-15 Q 42,-26 30,-30" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M -50,15 Q -42,26 -30,30" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M 50,15 Q 42,26 30,30" stroke="#78350f" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>

        {/* PAPAN INFORMASI KOTA (REPLACED MONUMEN WARGA AS REQUESTED) */}
        <g
          className="cursor-pointer group"
          transform="translate(0, 32)"
          onClick={(e) => {
            e.stopPropagation();
            onSelectBuilding('monumen_warga');
          }}
          onMouseEnter={() =>
            setHoveredBuilding(BUILDINGS_INFO.find((b) => b.id === 'monumen_warga') || null)
          }
          onMouseLeave={() => setHoveredBuilding(null)}
        >
          {/* Ground Shadow */}
          <ellipse cx="0" cy="4" rx="18" ry="7" fill="#143721" opacity="0.6" />
          {/* Wooden Stand Posts */}
          <line x1="-12" y1="4" x2="-12" y2="-18" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="12" y1="4" x2="12" y2="-18" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          {/* Notice Board */}
          <rect x="-18" y="-30" width="36" height="20" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
          <rect x="-15" y="-27" width="30" height="14" rx="1.5" fill="#fef3c7" />
          {/* Notice Paper Snippets */}
          <rect x="-13" y="-25" width="11" height="10" fill="#ffffff" rx="1" />
          <line x1="-11" y1="-22" x2="-4" y2="-22" stroke="#0284c7" strokeWidth="1" />
          <line x1="-11" y1="-19" x2="-5" y2="-19" stroke="#94a3b8" strokeWidth="0.8" />
          <line x1="-11" y1="-17" x2="-6" y2="-17" stroke="#94a3b8" strokeWidth="0.8" />
          <rect x="1" y="-25" width="11" height="10" fill="#fdf2f8" rx="1" />
          <line x1="3" y1="-22" x2="10" y2="-22" stroke="#db2777" strokeWidth="1" />
          <line x1="3" y1="-19" x2="9" y2="-19" stroke="#94a3b8" strokeWidth="0.8" />
          {/* Board Canopy */}
          <polygon points="-22,-30 22,-30 0,-38" fill="#b45309" stroke="#78350f" strokeWidth="1" />

          {/* Overhead Tag Pill */}
          <g transform="translate(0, -42)">
            <rect
              x="-40"
              y="-8"
              width="80"
              height="16"
              fill="#0f172a"
              opacity="0.9"
              rx="8"
              stroke="#ec4899"
              strokeWidth="1.2"
              filter="drop-shadow(0 2px 6px rgba(236,72,153,0.4))"
            />
            <text x="0" y="3" fill="#ffffff" fontSize="6.8" fontWeight="extrabold" textAnchor="middle">
              📋 Papan Informasi
            </text>
          </g>
        </g>

        {/* ------------------------------------------------------------- */}
        {/* F. TREES & CHERRY BLOSSOMS                                    */}
        {/* ------------------------------------------------------------- */}
        {[
          { x: -280, y: -40, r: 24, cherry: false },
          { x: -240, y: 10, r: 22, cherry: false },
          { x: -170, y: -140, r: 26, cherry: false },
          { x: -80, y: -160, r: 20, cherry: false },
          { x: 80, y: -160, r: 20, cherry: false },
          { x: 170, y: -140, r: 26, cherry: false },
          { x: 260, y: -50, r: 24, cherry: false },
          { x: 290, y: 20, r: 22, cherry: false },
          { x: -270, y: 50, r: 24, cherry: true },
          { x: -160, y: 130, r: 22, cherry: true },
          { x: 190, y: -10, r: 20, cherry: true },
          { x: 240, y: 20, r: 22, cherry: true },
          { x: 260, y: 60, r: 24, cherry: false },
          { x: 20, y: 155, r: 20, cherry: false },
        ].map((t, i) => (
          <g key={`tree-${i}`}>
            <ellipse cx={t.x} cy={t.y + 4} rx="6" ry="3" fill="#143721" opacity="0.6" />
            <line x1={t.x} y1={t.y + 4} x2={t.x} y2={t.y - 12} stroke="#451a03" strokeWidth="4" strokeLinecap="round" />
            {t.cherry ? (
              <>
                <circle cx={t.x} cy={t.y - 18} r={t.r} fill="#db2777" />
                <circle cx={t.x - 4} cy={t.y - 22} r={t.r * 0.75} fill="#f472b6" />
                <circle cx={t.x + 5} cy={t.y - 14} r="3" fill="#fdf2f8" />
                <circle cx={t.x - 5} cy={t.y - 12} r="2.5" fill="#fdf2f8" />
              </>
            ) : (
              <>
                <circle cx={t.x} cy={t.y - 18} r={t.r} fill="#14532d" />
                <circle cx={t.x - 4} cy={t.y - 22} r={t.r * 0.78} fill="#15803d" />
                <circle cx={t.x - 7} cy={t.y - 25} r={t.r * 0.45} fill="#22c55e" opacity="0.85" />
              </>
            )}
          </g>
        ))}

        {/* ------------------------------------------------------------- */}
        {/* G. SPECIALTY LANDMARKS (CAFE, KOLAM PANCING, GERBANG)         */}
        {/* ------------------------------------------------------------- */}
        {/* Cafe */}
        <g className="cursor-pointer group" onClick={(e) => { e.stopPropagation(); setIsCafeOpen(true); }}>
          <ellipse cx="-110" cy="-35" rx="22" ry="12" fill="#143721" opacity="0.6" />
          <rect x="-124" y="-48" width="28" height="15" fill="#92400e" rx="3" stroke="#78350f" strokeWidth="1.5" />
          <polygon points="-128,-48 -124,-58 -92,-58 -96,-48" fill="#b91c1c" />
          <polygon points="-120,-48 -116,-58 -108,-58 -112,-48" fill="#fef3c7" />
          <polygon points="-104,-48 -100,-58 -92,-58 -96,-48" fill="#fef3c7" />
          <circle cx="-100" cy="-44" r="2.5" fill="#f8fafc" />
          <rect x="-120" y="-36" width="20" height="7" fill="#1e293b" rx="2" />
          <text x="-110" y="-31" fill="#facc15" fontSize="5" fontWeight="bold" textAnchor="middle">CAFE</text>
        </g>

        {/* Kolam Pancing */}
        <g className="cursor-pointer group" onClick={handleFishingClick}>
          <ellipse cx="165" cy="115" rx="36" ry="20" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
          <ellipse cx="165" cy="115" rx="28" ry="15" fill="#0369a1" />
          <polygon points="135,115 155,105 160,113 140,123" fill="#78350f" stroke="#451a03" strokeWidth="1" />
          <line x1="152" y1="108" x2="168" y2="102" stroke="#d97706" strokeWidth="1.5" />
          <rect x="145" y="128" width="38" height="9" fill="#1e293b" rx="2.5" stroke="#475569" strokeWidth="0.8" />
          <text x="164" y="134.5" fill="#f8fafc" fontSize="5.5" fontWeight="extrabold" textAnchor="middle">KOLAM PANCING</text>
        </g>

        {/* Thaloria Pergola Gate */}
        <g>
          <line x1="175" y1="-30" x2="175" y2="-52" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="205" y1="-45" x2="205" y2="-67" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
          <line x1="170" y1="-53" x2="210" y2="-68" stroke="#92400e" strokeWidth="4" strokeLinecap="round" />
          <text x="190" y="-62" fill="#f8fafc" fontSize="6.5" fontWeight="bold" textAnchor="middle" transform="rotate(-20 190 -62)">Thaloria</text>
        </g>

        {/* ------------------------------------------------------------- */}
        {/* H. THE 7 REMAINING BUILDINGS (AROUND ROAD TERMINALS)          */}
        {/* ------------------------------------------------------------- */}
        {BUILDINGS_INFO.filter((b) => b.id !== 'monumen_warga').map((b) => {
          const hasNew = newMateriBuildingIds.includes(b.id);
          const [bx, by] = [b.position[0], b.position[1]];

          return (
            <g
              key={b.id}
              className="cursor-pointer transition-transform duration-200 hover:scale-110"
              onClick={(e) => {
                e.stopPropagation();
                onSelectBuilding(b.id);
              }}
              onMouseEnter={() => setHoveredBuilding(b)}
              onMouseLeave={() => setHoveredBuilding(null)}
            >
              <ellipse cx={bx} cy={by + 6} rx="26" ry="14" fill="#143721" opacity="0.6" />

              {b.id === 'balai_kota' && (
                <g>
                  <polygon points={`${bx - 26},${by + 2} ${bx + 26},${by + 2} ${bx + 20},${by - 24} ${bx - 20},${by - 24}`} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
                  <polygon points={`${bx - 22},${by - 24} ${bx + 22},${by - 24} ${bx},${by - 42}`} fill="#1d4ed8" />
                  <line x1={bx - 14} y1={by + 2} x2={bx - 14} y2={by - 22} stroke="#cbd5e1" strokeWidth="3" />
                  <line x1={bx} y1={by + 2} x2={bx} y2={by - 22} stroke="#cbd5e1" strokeWidth="3" />
                  <line x1={bx + 14} y1={by + 2} x2={bx + 14} y2={by - 22} stroke="#cbd5e1" strokeWidth="3" />
                  <circle cx={bx} cy={by - 28} r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                </g>
              )}

              {b.id === 'perpustakaan' && (
                <g>
                  <polygon points={`${bx - 22},${by + 2} ${bx + 22},${by + 2} ${bx + 18},${by - 20} ${bx - 18},${by - 20}`} fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                  <polygon points={`${bx - 20},${by - 20} ${bx + 20},${by - 20} ${bx},${by - 36}`} fill="#059669" />
                  <path d={`M ${bx - 6},${by + 2} A 6 6 0 0 1 ${bx + 6},${by + 2}`} fill="#0f172a" />
                </g>
              )}

              {b.id === 'taman_refleksi' && (
                <g>
                  <polygon points={`${bx - 18},${by + 2} ${bx + 18},${by + 2} ${bx + 14},${by - 16} ${bx - 14},${by - 16}`} fill="#9a3412" />
                  <polygon points={`${bx - 22},${by - 16} ${bx + 22},${by - 16} ${bx},${by - 30}`} fill="#db2777" />
                  <polygon points={`${bx - 15},${by - 28} ${bx + 15},${by - 28} ${bx},${by - 40}`} fill="#db2777" />
                </g>
              )}

              {b.id === 'menara_mentor' && (
                <g>
                  <polygon points={`${bx - 14},${by + 2} ${bx + 14},${by + 2} ${bx + 10},${by - 28} ${bx - 10},${by - 28}`} fill="#475569" />
                  <ellipse cx={bx} cy={by - 28} rx="12" ry="7" fill="#7c3aed" />
                  <circle cx={bx} cy={by - 34} r="10" fill="#7c3aed" />
                  <line x1={bx + 4} y1={by - 34} x2={bx + 16} y2={by - 44} stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}

              {b.id === 'bengkel_latihan' && (
                <g>
                  <rect x={bx - 20} y={by - 18} width="40" height="20" fill="#b45309" stroke="#78350f" strokeWidth="1.5" rx="2" />
                  <polygon points={`${bx - 22},${by - 18} ${bx + 22},${by - 18} ${bx},${by - 32}`} fill="#334155" />
                  <rect x={bx + 10} y={by - 36} width="6" height="16" fill="#78350f" />
                  <circle cx={bx} cy={by - 8} r="6" fill="#64748b" stroke="#334155" strokeWidth="2" strokeDasharray="3 2" />
                </g>
              )}

              {b.id === 'kantor_pos' && (
                <g>
                  <rect x={bx - 18} y={by - 16} width="36" height="18" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" rx="2" />
                  <polygon points={`${bx - 20},${by - 16} ${bx + 20},${by - 16} ${bx},${by - 28}`} fill="#dc2626" />
                  <rect x={bx + 10} y={by - 6} width="5" height="8" fill="#facc15" rx="1.5" />
                </g>
              )}

              {b.id === 'pasar_prestasi' && (
                <g>
                  <rect x={bx - 18} y={by - 14} width="36" height="16" fill="#fef08a" rx="2" />
                  <polygon points={`${bx - 20},${by - 14} ${bx + 20},${by - 14} ${bx},${by - 32}`} fill="#06b6d4" />
                  <polygon points={`${bx - 8},${by - 14} ${bx + 8},${by - 14} ${bx},${by - 32}`} fill="#f59e0b" />
                  <circle cx={bx} cy={by - 34} r="3.5" fill="#fbbf24" filter="drop-shadow(0 0 4px #facc15)" />
                </g>
              )}

              <g transform={`translate(${bx}, ${by - 42})`}>
                <rect x="-38" y="-9" width="76" height="18" fill="#0f172a" opacity="0.88" rx="9" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.3" />
                <text x="0" y="3.5" fill="#f8fafc" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">
                  {b.name}
                </text>
                {hasNew && (
                  <circle cx="34" cy="-5" r="4" fill="#fbbf24" stroke="#0f172a" strokeWidth="1.5" className="animate-ping" />
                )}
              </g>
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* I. MOVING PROFESSION NPCS (6+ GURU, POLISI, PENJAGA, DLL)    */}
        {/* ------------------------------------------------------------- */}
        {npcList.map((npc) => {
          const isBubbleActive = activeNpcBubble?.npcId === npc.id;

          return (
            <g
              key={npc.id}
              className="cursor-pointer group"
              transform={`translate(${npc.x}, ${npc.y})`}
              onClick={(e) => handleNpcClick(npc, e)}
            >
              {/* Shadow */}
              <ellipse cx="0" cy="2" rx="5.5" ry="2.5" fill="#143721" opacity="0.6" />

              {/* Character Body with Facing Direction */}
              <g transform={`scale(${npc.facing === 'left' ? -1 : 1}, 1)`}>
                {/* Head */}
                <circle cx="0" cy="-12" r="5" fill={npc.skinColor} />

                {/* Hijab / Hair */}
                {npc.hasHijab ? (
                  <circle cx="0" cy="-13" r="5.6" fill={npc.hairColor} />
                ) : (
                  <path d="M -5,-13 A 5 5 0 0 1 5,-13" fill={npc.hairColor} />
                )}

                {/* Specific Accessories */}
                {npc.accessory === 'glasses' && (
                  <circle cx="2" cy="-12" r="1.8" fill="none" stroke="#0284c7" strokeWidth="0.8" />
                )}
                {npc.accessory === 'police_hat' && (
                  <g transform="translate(0, -16)">
                    <ellipse cx="0" cy="0" rx="5" ry="2.5" fill="#1e3a8a" />
                    <circle cx="0" cy="-1" r="1.5" fill="#fbbf24" />
                  </g>
                )}
                {npc.accessory === 'guard_hat' && (
                  <ellipse cx="0" cy="-16" rx="5.2" ry="2" fill="#3f6212" />
                )}
                {npc.accessory === 'stethoscope' && (
                  <path d="M -2,-8 Q 0,-3 2,-8" stroke="#ef4444" strokeWidth="1" fill="none" />
                )}

                {/* Torso / Uniform */}
                <rect x="-4" y="-8" width="8" height="8" rx="2" fill={npc.shirtColor} />

                {npc.accessory === 'broom' && (
                  <line x1="4" y1="-8" x2="7" y2="4" stroke="#d97706" strokeWidth="1.5" />
                )}

                {/* Legs with walking animation if moving */}
                <line x1="-2" y1="0" x2="-2" y2="4" stroke={npc.pantsColor} strokeWidth="2" strokeLinecap="round" />
                <line x1="2" y1="0" x2="2" y2="4" stroke={npc.pantsColor} strokeWidth="2" strokeLinecap="round" />
              </g>

              {/* Profession Tag Badge above head */}
              <g transform="translate(0, -21)">
                <rect
                  x="-32"
                  y="-6.5"
                  width="64"
                  height="13"
                  fill="#0f172a"
                  opacity="0.88"
                  rx="6.5"
                  stroke={npc.badgeBg}
                  strokeWidth="0.8"
                />
                <text x="0" y="2.5" fill="#f1f5f9" fontSize="5.5" fontWeight="extrabold" textAnchor="middle">
                  {npc.professionBadge}
                </text>
              </g>

              {/* Temporary Speech Bubble (Strictly 1 NPC, Disappears automatically) */}
              {isBubbleActive && (
                <g transform="translate(0, -38)" className="animate-fade-in-up">
                  <rect
                    x="-42"
                    y="-9"
                    width="84"
                    height="18"
                    fill="#ffffff"
                    rx="9"
                    stroke="#cbd5e1"
                    strokeWidth="1"
                    filter="drop-shadow(0 2px 8px rgba(0,0,0,0.4))"
                  />
                  <polygon points="-3,9 3,9 0,13" fill="#ffffff" />
                  <text x="0" y="3" fill="#0f172a" fontSize="6.2" fontWeight="bold" textAnchor="middle">
                    {activeNpcBubble.text}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* ------------------------------------------------------------- */}
        {/* J. THE PLAYER AVATAR                                          */}
        {/* ------------------------------------------------------------- */}
        <g transform={`translate(${playerPos.x}, ${playerPos.y})`}>
          <ellipse cx="0" cy="3" rx="7" ry="3.5" fill="#143721" opacity="0.75" />

          <g transform={`scale(${playerFacing === 'left' ? -1 : 1}, 1) translate(0, ${isWalking ? -Math.sin(Date.now() / 100) * 2 : 0})`}>
            <circle cx="0" cy="-14" r="6" fill="#fbcfe8" />
            {studentGender === 'P' ? (
              <>
                <circle cx="0" cy="-15" r="6.8" fill="#f8fafc" />
                <rect x="-5" y="-9" width="10" height="9" rx="2" fill="#0284c7" />
                <polygon points="-6,0 6,0 4,-5 -4,-5" fill="#1e1b4b" />
              </>
            ) : (
              <>
                <path d="M -6,-15 A 6 6 0 0 1 6,-15" fill="#1e293b" />
                <rect x="-5.5" y="-9" width="11" height="9" rx="2" fill="#2563eb" />
                <rect x="-7.5" y="-9" width="3" height="7" rx="1" fill="#f59e0b" />
              </>
            )}

            <line
              x1="-2.5"
              y1="0"
              x2={isWalking ? -2.5 + Math.sin(Date.now() / 90) * 3 : -2.5}
              y2="5"
              stroke="#1e1b4b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <line
              x1="2.5"
              y1="0"
              x2={isWalking ? 2.5 - Math.sin(Date.now() / 90) * 3 : 2.5}
              y2="5"
              stroke="#1e1b4b"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>

          <g transform="translate(0, -26)">
            <rect
              x="-36"
              y="-8"
              width="72"
              height="16"
              fill="#059669"
              rx="8"
              stroke="#6ee7b7"
              strokeWidth="1.2"
              filter="drop-shadow(0 2px 8px rgba(16,185,129,0.5))"
            />
            <text x="0" y="3" fill="#ffffff" fontSize="6.8" fontWeight="extrabold" textAnchor="middle">
              @{studentName.split(' ')[0].toLowerCase()} (Kamu)
            </text>
          </g>

          {playerSpeechBubble && (
            <g transform="translate(0, -46)" className="animate-fade-in-up">
              <rect
                x="-42"
                y="-10"
                width="84"
                height="20"
                fill="#ffffff"
                rx="10"
                stroke="#6ee7b7"
                strokeWidth="1.5"
                filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
              />
              <polygon points="-4,10 4,10 0,14" fill="#ffffff" />
              <text x="0" y="3.5" fill="#0f172a" fontSize="7" fontWeight="bold" textAnchor="middle">
                {playerSpeechBubble}
              </text>
            </g>
          )}
        </g>

        {/* ------------------------------------------------------------- */}
        {/* K. ANIMATED FIREFLIES IN NIGHT MODE ("KUNANG-KUNANG")        */}
        {/* ------------------------------------------------------------- */}
        {isNight &&
          fireflyBases.map((base, idx) => {
            const off = fireflyOffsets[idx] || { dx: 0, dy: 0, glow: 1 };
            const fx = base.x + off.dx;
            const fy = base.y + off.dy;

            return (
              <g key={`firefly-${base.id}`} transform={`translate(${fx}, ${fy})`} opacity={off.glow}>
                {/* Soft outer lime halo */}
                <circle cx="0" cy="0" r="6" fill="#a3e635" opacity="0.3" filter="url(#fireflyGlow)" />
                {/* Bright core dot */}
                <circle cx="0" cy="0" r="2" fill="#fef08a" />
              </g>
            );
          })}
      </svg>

      {/* 3. CAFE POPUP CARD */}
      {isCafeOpen && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 animate-fade-in-up max-w-[280px] w-full">
          <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl p-4 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>☕</span> Cafe Buka
                </h4>
                <p className="text-[11px] text-amber-400 font-medium">Barista @nnisa_0311</p>
              </div>
              <button
                onClick={() => setIsCafeOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Selamat datang di Cafe Refleksia! Silakan nikmati hidangan santai bersama kawan-kawan.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => handleCafeOrder('Kopi')}
                className="p-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-center transition flex flex-col items-center gap-1 active:scale-95"
              >
                <span className="text-xl">☕</span>
                <span className="text-xs font-bold text-emerald-200">Kopi - 2</span>
              </button>
              <button
                onClick={() => handleCafeOrder('Roti')}
                className="p-2.5 rounded-xl bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/50 text-center transition flex flex-col items-center gap-1 active:scale-95"
              >
                <span className="text-xl">🍞</span>
                <span className="text-xs font-bold text-teal-200">Roti - 1</span>
              </button>
            </div>

            {cafeFeedback && (
              <p className="mt-3 text-[11px] text-center font-bold text-amber-300 animate-pulse">
                {cafeFeedback}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Fishing Feedback Toast */}
      {fishingFeedback && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 animate-fade-in-up">
          <div className="bg-blue-900/90 backdrop-blur-xl border border-blue-400/40 text-blue-100 text-xs font-bold px-4 py-2 rounded-full shadow-lg">
            {fishingFeedback}
          </div>
        </div>
      )}

      {/* 4. FLOATING OBROLAN WINDOW */}
      <div className="absolute bottom-32 sm:bottom-36 left-3 sm:left-5 z-20 w-[280px] sm:w-[320px] max-w-[calc(100vw-24px)] pointer-events-auto">
        <div className="bg-slate-950/85 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all">
          <div
            onClick={() => setIsChatWindowOpen(!isChatWindowOpen)}
            className="px-3.5 py-2.5 bg-slate-900/80 border-b border-white/10 flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">Obrolan</span>
              <span className="text-[10px] text-slate-400">• ruang 2 • {chatMessages.length} pesan</span>
            </div>
            <button className="text-slate-400 hover:text-white transition">
              {isChatWindowOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>

          {isChatWindowOpen && (
            <div className="p-3 max-h-[160px] overflow-y-auto space-y-2 text-xs divide-y divide-white/5">
              {chatMessages.slice(0, 25).map((m) => (
                <div key={m.id} className="pt-1.5 first:pt-0">
                  <div className="flex items-baseline justify-between gap-1">
                    <span className="font-extrabold text-emerald-400 text-[11px] truncate">
                      {m.senderHandle || '@warga'}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {m.timestamp || m.createdAt.slice(11, 16) || '23.35'}
                    </span>
                  </div>
                  <p className="text-slate-200 text-xs mt-0.5 leading-snug break-words">
                    {m.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 5. BOTTOM CHAT INPUT BAR */}
      <div className="absolute bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto w-[92vw] max-w-[480px]">
        <form
          onSubmit={handleSendChat}
          className="bg-slate-950/85 backdrop-blur-2xl border border-white/25 rounded-full px-3.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)] flex items-center gap-2.5"
        >
          <span className="text-emerald-400 text-base shrink-0">💬</span>
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Ngobrol dengan warga di dekatmu..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
            maxLength={120}
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center transition active:scale-95 shrink-0"
            title="Kirim Pesan"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* 6. HOVER BUILDING INFO BADGE */}
      {hoveredBuilding && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 pointer-events-none z-30 animate-fade-in-up">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/25 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2.5">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: '#' + hoveredBuilding.color.toString(16).padStart(6, '0') }}
            />
            <div>
              <p className="font-extrabold text-xs sm:text-sm leading-tight text-white">
                {hoveredBuilding.name}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium">
                {hoveredBuilding.tagline} • Ketuk untuk masuk
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
