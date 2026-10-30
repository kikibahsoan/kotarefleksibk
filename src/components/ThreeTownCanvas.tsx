import React, { useEffect, useRef, useState } from 'react';
import { BuildingId, PublicChatMessage } from '../types/index.ts';
import { sounds } from '../utils/audio.ts';
import { TimePeriod, getTimePeriodWita } from '../utils/lofiAudio.ts';
import { RealtimePresenceMesh } from '../utils/realtimePresenceMesh.ts';
import { X, Plus, Minus, MapPin, BookOpen, Newspaper, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface ThreeTownCanvasProps {
  onSelectBuilding: (buildingId: BuildingId) => void;
  activeBuilding: BuildingId | null;
  newMateriBuildingIds: BuildingId[];
  studentId?: string;
  studentName?: string;
  studentGender?: string;
  isTeacher?: boolean;
  timeOfDay?: 'day' | 'night' | 'auto';
  timePeriod?: TimePeriod;
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
  { id: 'menara_mentor', name: 'Studio ON AIR', tagline: 'Studio Podcast, ON AIR & AI', position: [4.2, 0, 0], color: 0x8b5cf6, icon: '🎙️' },
  { id: 'perpustakaan', name: 'Perpustakaan Kampus', tagline: 'Gedung Biru & Materi', position: [-4.2, 0, 0], color: 0x10b981, icon: '📚' },
  { id: 'pasar_prestasi', name: 'Toko Poin', tagline: 'Lencana & Hadiah', position: [-2.8, 0, 2.8], color: 0x06b6d4, icon: '🎪' },
  { id: 'kantor_pos', name: 'Kantor Pos Kilat', tagline: 'Kirim Pesan ke Guru', position: [2.8, 0, -2.8], color: 0xef4444, icon: '📮' },
  { id: 'taman_refleksi', name: 'Pusat Refleksi', tagline: 'Tulis Jurnal Refleksi (+3 Poin)', position: [-2.8, 0, -2.8], color: 0xd97706, icon: '🌍' },
  { id: 'bengkel_latihan', name: 'Lab DKV & Tefa', tagline: 'Tower Kontrol & Kuis', position: [2.8, 0, 2.8], color: 0xf59e0b, icon: '🛠️' },
  { id: 'monumen_warga', name: 'Air Mancur Warga', tagline: 'Sapa & Obrolan Langsung', position: [0, 0, 0], color: 0x06b6d4, icon: '⛲' },
];

export type EmoteType = 'love' | 'wave' | 'laugh' | 'dance';

export interface ActiveEmote {
  type: EmoteType;
  icon: string;
  label: string;
  startTime: number;
  expiresAt: number;
}

interface AvatarData {
  id: string;
  role: 'siswa' | 'guru' | 'polisi' | 'petugas_kebersihan' | 'kurir' | 'barista' | 'penjaga_kota' | 'penjaga_lab' | 'penjaga_literasi' | 'penjaga_kolam' | 'pengawas' | 'kepala_balai';
  handle: string;
  name?: string;
  roleLabel: string;
  wx: number;
  wy: number;
  targetWx: number;
  targetWy: number;
  speed: number;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  gender?: 'L' | 'P';
  isMoving: boolean;
  pauseTimer: number;
  walkFrame: number;
  facing: 'down-left' | 'down-right' | 'up-left' | 'up-right';
  speechText?: string;
  speechTimer?: number;
  anchorX?: number;
  anchorY?: number;
  wanderRadius?: number;
  patrolWaypoints?: [number, number][];
  waypointIndex?: number;
  speeches?: string[];
  isSitting?: boolean;
  sittingSeat?: string;
  isFishing?: boolean;
  fishingStartTime?: number;
  heldItem?: 'kopi' | 'roti' | 'eskrim' | null;
  activeEmote?: ActiveEmote | null;
  isOnlineRemote?: boolean;
  spawnTime?: number;
  lastPing?: number;
}

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

export const TREES_LIST: [number, number][] = [
  // Outer perimeter for 15x15 island (North edge)
  [0, -6.6],
  [-2.2, -6.4],
  [2.2, -6.4],
  [-4.4, -6.0],
  [4.4, -6.0],
  // West edge
  [-6.6, 0],
  [-6.4, -2.2],
  [-6.4, 2.2],
  [-6.0, -4.4],
  [-6.0, 4.4],
  // South edge (flanking the Welcome Gapura at [0, 6.15])
  [-1.5, 6.4],
  [1.5, 6.4],
  [-2.8, 6.4],
  [2.8, 6.4],
  [-4.4, 6.0],
  [4.4, 6.0],
  // East edge (leaving [4.6, -2.2] clear for Kolam)
  [6.6, 0],
  [6.4, 2.2],
  [6.0, 4.4],
  [6.0, -4.4],
  // Mid-park groves (tree moved from [3.8, 3.8] to [-0.5, 2.4] to clear view for Toko Roti & Kafe behind Lab DKV)
  [-5.2, -1.8],
  [5.2, 1.8],
  [-3.8, 3.4],
  [-0.5, 2.4],
  // Central park trees (spaced around the 8 fountain benches)
  [-1.72, -1.72],
  [1.72, -1.72],
  [-1.72, 1.72],
  [1.72, 1.72],
];

export const STREET_LAMPS_LIST: [number, number][] = [
  // Inner ring intersections
  [-3.0, -1.5],
  [-3.0, 1.5],
  [3.0, -1.5],
  [3.0, 1.5],
  [-1.5, -3.0],
  [1.5, -3.0],
  [-1.5, 3.0],
  [1.5, 3.0],
  // Central crossroad spokes
  [-1.8, 0],
  [1.8, 0],
  [0, -1.9],
  [0, 1.9],
  // Outer promenade ring (for 15x15 grid)
  [-5.0, -2.5],
  [-5.0, 2.5],
  [5.0, -2.5],
  [5.0, 2.5],
  [-2.5, -5.0],
  [2.5, -5.0],
  [-2.5, 5.0],
  [2.5, 5.0],
  // Corners
  [-3.0, -3.0],
  [3.0, -3.0],
  [-3.0, 3.0],
  [3.0, 3.0],
  [-5.0, -5.0],
  [5.45, 4.55],
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
  // Taman Refleksi (Pusat Refleksi)
  { minWx: -3.6, maxWx: -2.0, minWy: -3.6, maxWy: -2.0 },
  // Lab DKV & Bengkel
  { minWx: 2.0, maxWx: 3.6, minWy: 2.0, maxWy: 3.6 },
  // Toko Roti & Kafe (Di ujung kota belakang Lab DKV)
  { minWx: 4.05, maxWx: 5.25, minWy: 4.05, maxWy: 5.05 },
];

export const isSolidCollision = (wx: number, wy: number, padding: number = 0.16): boolean => {
  // 15x15 Island edges (from -7.0 to +7.0)
  if (wx < -7.0 + padding || wx > 7.0 - padding || wy < -7.0 + padding || wy > 7.0 - padding) {
    return true;
  }

  // Central Fountain pool
  if (Math.hypot(wx, wy) < 0.92 + padding) {
    return true;
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

// The 4 outer corners/ends of the 15x15 map
export const MAP_CORNERS: [number, number][] = [
  [-5.5, -5.5], // Ujung Barat Laut (North-West)
  [5.5, -5.5],  // Ujung Timur Laut (North-East)
  [-5.5, 5.5],  // Ujung Barat Daya (South-West)
  [5.5, 5.5],   // Ujung Tenggara (South-East)
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

export type BenchId =
  | 'fountain_1'
  | 'fountain_1_a'
  | 'fountain_1_b'
  | 'fountain_2'
  | 'fountain_2_a'
  | 'fountain_2_b'
  | 'fountain_3'
  | 'fountain_3_a'
  | 'fountain_3_b'
  | 'fountain_4'
  | 'fountain_4_a'
  | 'fountain_4_b'
  | 'fountain_5'
  | 'fountain_5_a'
  | 'fountain_5_b'
  | 'fountain_6'
  | 'fountain_6_a'
  | 'fountain_6_b'
  | 'fountain_7'
  | 'fountain_7_a'
  | 'fountain_7_b'
  | 'fountain_8'
  | 'fountain_8_a'
  | 'fountain_8_b'
  | 'literacy_1'
  | 'literacy_1_a'
  | 'literacy_1_b'
  | 'literacy_2'
  | 'literacy_2_a'
  | 'literacy_2_b'
  | 'campfire_1'
  | 'campfire_1_a'
  | 'campfire_1_b'
  | 'campfire_2'
  | 'campfire_2_a'
  | 'campfire_2_b'
  | 'literacy'
  | 'fountain_east'
  | 'fountain_west'
  | 'fountain_north'
  | 'fountain_south'
  | 'swing_left'
  | 'swing_right'
  | 'swing_2_left'
  | 'swing_2_right';

export interface TwoPersonSeatSlot {
  id: BenchId;
  label: string;
  wx: number;
  wy: number;
  screenOffsetX: number;
}

export interface TwoPersonBenchGroup {
  groupId:
    | 'fountain_1'
    | 'fountain_2'
    | 'fountain_3'
    | 'fountain_4'
    | 'fountain_5'
    | 'fountain_6'
    | 'fountain_7'
    | 'fountain_8'
    | 'literacy_1'
    | 'literacy_2'
    | 'campfire_1'
    | 'campfire_2';
  name: string;
  kind: 'fountain_minimalist' | 'campfire';
  wx: number;
  wy: number;
  facing: 'down-left' | 'down-right' | 'up-left' | 'up-right';
  seats: [TwoPersonSeatSlot, TwoPersonSeatSlot];
}

// 8 Tempat Duduk Minimalis di Sekitar Air Mancur (Masing-Masing Muat 2 Orang = Total 16 Kursi)
export const FOUNTAIN_MINIMALIST_BENCHES: TwoPersonBenchGroup[] = [
  {
    groupId: 'fountain_1',
    name: 'Bangku Air Mancur 1 (Barat Laut)',
    kind: 'fountain_minimalist',
    wx: -1.05,
    wy: -1.05,
    facing: 'down-right',
    seats: [
      { id: 'fountain_1_a', label: 'Bangku Air Mancur 1 • Kursi Kiri (1/2)', wx: -1.12, wy: -0.98, screenOffsetX: -6.2 },
      { id: 'fountain_1_b', label: 'Bangku Air Mancur 1 • Kursi Kanan (2/2)', wx: -0.98, wy: -1.12, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_2',
    name: 'Bangku Air Mancur 2 (Utara)',
    kind: 'fountain_minimalist',
    wx: 0.0,
    wy: -1.42,
    facing: 'down-right',
    seats: [
      { id: 'fountain_2_a', label: 'Bangku Air Mancur 2 • Kursi Kiri (1/2)', wx: -0.07, wy: -1.35, screenOffsetX: -6.2 },
      { id: 'fountain_2_b', label: 'Bangku Air Mancur 2 • Kursi Kanan (2/2)', wx: 0.07, wy: -1.49, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_3',
    name: 'Bangku Air Mancur 3 (Timur Laut)',
    kind: 'fountain_minimalist',
    wx: 1.05,
    wy: -1.05,
    facing: 'down-left',
    seats: [
      { id: 'fountain_3_a', label: 'Bangku Air Mancur 3 • Kursi Kiri (1/2)', wx: 0.98, wy: -1.12, screenOffsetX: -6.2 },
      { id: 'fountain_3_b', label: 'Bangku Air Mancur 3 • Kursi Kanan (2/2)', wx: 1.12, wy: -0.98, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_4',
    name: 'Bangku Air Mancur 4 (Timur)',
    kind: 'fountain_minimalist',
    wx: 1.42,
    wy: 0.0,
    facing: 'down-left',
    seats: [
      { id: 'fountain_4_a', label: 'Bangku Air Mancur 4 • Kursi Kiri (1/2)', wx: 1.35, wy: -0.07, screenOffsetX: -6.2 },
      { id: 'fountain_4_b', label: 'Bangku Air Mancur 4 • Kursi Kanan (2/2)', wx: 1.49, wy: 0.07, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_5',
    name: 'Bangku Air Mancur 5 (Tenggara)',
    kind: 'fountain_minimalist',
    wx: 1.05,
    wy: 1.05,
    facing: 'up-left',
    seats: [
      { id: 'fountain_5_a', label: 'Bangku Air Mancur 5 • Kursi Kiri (1/2)', wx: 0.98, wy: 1.12, screenOffsetX: -6.2 },
      { id: 'fountain_5_b', label: 'Bangku Air Mancur 5 • Kursi Kanan (2/2)', wx: 1.12, wy: 0.98, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_6',
    name: 'Bangku Air Mancur 6 (Selatan)',
    kind: 'fountain_minimalist',
    wx: 0.0,
    wy: 1.42,
    facing: 'up-left',
    seats: [
      { id: 'fountain_6_a', label: 'Bangku Air Mancur 6 • Kursi Kiri (1/2)', wx: -0.07, wy: 1.49, screenOffsetX: -6.2 },
      { id: 'fountain_6_b', label: 'Bangku Air Mancur 6 • Kursi Kanan (2/2)', wx: 0.07, wy: 1.35, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_7',
    name: 'Bangku Air Mancur 7 (Barat Daya)',
    kind: 'fountain_minimalist',
    wx: -1.05,
    wy: 1.05,
    facing: 'up-right',
    seats: [
      { id: 'fountain_7_a', label: 'Bangku Air Mancur 7 • Kursi Kiri (1/2)', wx: -1.12, wy: 0.98, screenOffsetX: -6.2 },
      { id: 'fountain_7_b', label: 'Bangku Air Mancur 7 • Kursi Kanan (2/2)', wx: -0.98, wy: 1.12, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'fountain_8',
    name: 'Bangku Air Mancur 8 (Barat)',
    kind: 'fountain_minimalist',
    wx: -1.42,
    wy: 0.0,
    facing: 'down-right',
    seats: [
      { id: 'fountain_8_a', label: 'Bangku Air Mancur 8 • Kursi Kiri (1/2)', wx: -1.49, wy: 0.07, screenOffsetX: -6.2 },
      { id: 'fountain_8_b', label: 'Bangku Air Mancur 8 • Kursi Kanan (2/2)', wx: -1.35, wy: -0.07, screenOffsetX: 6.2 },
    ],
  },
];

// 2 Kursi Literasi Minimalis (Model Sama Seperti Kursi Samping Air Mancur, Masing-Masing Muat 2 Orang)
export const LITERACY_BENCHES: TwoPersonBenchGroup[] = [
  {
    groupId: 'literacy_1',
    name: 'Kursi Literasi 1 (Samping Sudut Literasi)',
    kind: 'fountain_minimalist',
    wx: -3.65,
    wy: 1.45,
    facing: 'down-right',
    seats: [
      { id: 'literacy_1_a', label: 'Kursi Literasi 1 • Kiri (1/2)', wx: -3.72, wy: 1.52, screenOffsetX: -6.2 },
      { id: 'literacy_1_b', label: 'Kursi Literasi 1 • Kanan (2/2)', wx: -3.58, wy: 1.38, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'literacy_2',
    name: 'Kursi Literasi 2 (Depan Sudut Literasi)',
    kind: 'fountain_minimalist',
    wx: -3.65,
    wy: 2.15,
    facing: 'down-right',
    seats: [
      { id: 'literacy_2_a', label: 'Kursi Literasi 2 • Kiri (1/2)', wx: -3.72, wy: 2.22, screenOffsetX: -6.2 },
      { id: 'literacy_2_b', label: 'Kursi Literasi 2 • Kanan (2/2)', wx: -3.58, wy: 2.08, screenOffsetX: 6.2 },
    ],
  },
];

// Api Unggun di Sudut Kota (Sudut Barat Daya [-4.65, 4.65]) & 2 Bangku Penghangat Tubuh di Sampingnya
export const CAMPFIRE_COORDS = { wx: -4.65, wy: 4.65 };

export const CAMPFIRE_BENCHES: TwoPersonBenchGroup[] = [
  {
    groupId: 'campfire_1',
    name: 'Bangku Api Unggun Kiri (Penghangat Tubuh)',
    kind: 'campfire',
    wx: -5.32,
    wy: 4.72,
    facing: 'down-right',
    seats: [
      { id: 'campfire_1_a', label: 'Bangku Api Unggun Kiri • Kursi 1', wx: -5.38, wy: 4.78, screenOffsetX: -5.8 },
      { id: 'campfire_1_b', label: 'Bangku Api Unggun Kiri • Kursi 2', wx: -5.26, wy: 4.66, screenOffsetX: 5.8 },
    ],
  },
  {
    groupId: 'campfire_2',
    name: 'Bangku Api Unggun Kanan (Penghangat Tubuh)',
    kind: 'campfire',
    wx: -3.98,
    wy: 4.72,
    facing: 'down-left',
    seats: [
      { id: 'campfire_2_a', label: 'Bangku Api Unggun Kanan • Kursi 1', wx: -4.04, wy: 4.66, screenOffsetX: -5.8 },
      { id: 'campfire_2_b', label: 'Bangku Api Unggun Kanan • Kursi 2', wx: -3.92, wy: 4.78, screenOffsetX: 5.8 },
    ],
  },
];

export const ALL_TWO_PERSON_BENCHES: TwoPersonBenchGroup[] = [
  ...FOUNTAIN_MINIMALIST_BENCHES,
  ...LITERACY_BENCHES,
  ...CAMPFIRE_BENCHES,
];

// Legacy flat export kept for compatibility
export const FOUNTAIN_FRONT_BENCHES = FOUNTAIN_MINIMALIST_BENCHES.map((b) => ({
  id: b.seats[0].id,
  name: b.name,
  wx: b.wx,
  wy: b.wy,
  facing: b.facing,
}));

// 2 Tempat Ayunan di Kota Refleksia (Masing-Masing 2 Kursi Ayunan, Naik Bayar 1 XP)
export interface SwingStructureDef {
  id: 'swing_struct_1' | 'swing_struct_2';
  title: string;
  badgeText: string;
  wx: number;
  wy: number;
  leftSeatId: 'swing_left' | 'swing_2_left';
  rightSeatId: 'swing_right' | 'swing_2_right';
}

export const SWING_STRUCTURES: SwingStructureDef[] = [
  {
    id: 'swing_struct_1',
    title: '🎠 AYUNAN 1 • REFLEKSI',
    badgeText: '🎠 Tempat Ayunan 1 (-1 XP)',
    wx: -2.8,
    wy: -4.05,
    leftSeatId: 'swing_left',
    rightSeatId: 'swing_right',
  },
  {
    id: 'swing_struct_2',
    title: '🎠 AYUNAN 2 • TAMAN TIMUR',
    badgeText: '🎠 Tempat Ayunan 2 (-1 XP)',
    wx: 2.8,
    wy: -4.05,
    leftSeatId: 'swing_2_left',
    rightSeatId: 'swing_2_right',
  },
];

export interface SwingSeatDef {
  id: 'swing_left' | 'swing_right' | 'swing_2_left' | 'swing_2_right';
  structId: 'swing_struct_1' | 'swing_struct_2';
  structWx: number;
  structWy: number;
  isLeft: boolean;
  name: string;
  wx: number;
  wy: number;
  facing: 'down-left' | 'down-right' | 'up-left' | 'up-right';
}

export const REFLECTION_SWINGS: SwingSeatDef[] = [
  {
    id: 'swing_left',
    structId: 'swing_struct_1',
    structWx: -2.8,
    structWy: -4.05,
    isLeft: true,
    name: 'Tempat Ayunan 1 (Kursi Kiri)',
    wx: -2.90,
    wy: -3.95,
    facing: 'down-right',
  },
  {
    id: 'swing_right',
    structId: 'swing_struct_1',
    structWx: -2.8,
    structWy: -4.05,
    isLeft: false,
    name: 'Tempat Ayunan 1 (Kursi Kanan)',
    wx: -2.70,
    wy: -4.15,
    facing: 'down-right',
  },
  {
    id: 'swing_2_left',
    structId: 'swing_struct_2',
    structWx: 2.8,
    structWy: -4.05,
    isLeft: true,
    name: 'Tempat Ayunan 2 (Kursi Kiri)',
    wx: 2.70,
    wy: -4.15,
    facing: 'down-left',
  },
  {
    id: 'swing_2_right',
    structId: 'swing_struct_2',
    structWx: 2.8,
    structWy: -4.05,
    isLeft: false,
    name: 'Tempat Ayunan 2 (Kursi Kanan)',
    wx: 2.90,
    wy: -3.95,
    facing: 'down-left',
  },
];

export const isSwingSeatId = (seatId?: string | null): seatId is SwingSeatDef['id'] => {
  return (
    seatId === 'swing_left' ||
    seatId === 'swing_right' ||
    seatId === 'swing_2_left' ||
    seatId === 'swing_2_right'
  );
};

// Gapura Selamat Datang di Ujung Selatan Peta [wx: 0, wy: 6.15]
export const WELCOME_GATE_COORDS = { wx: 0, wy: 6.15 };

export interface TreeWaterCycle {
  count: number; // 0, 1, 2, or 3
  lastWateredTime: number; // performance.now()
  appleStartTime: number | null; // performance.now() when 3rd watering triggers 15s apples
}

export const ThreeTownCanvas = React.memo<ThreeTownCanvasProps>(function ThreeTownCanvas({
  onSelectBuilding,
  activeBuilding,
  newMateriBuildingIds,
  studentId,
  studentName = 'Siswa',
  studentGender = 'L',
  isTeacher = false,
  timeOfDay = 'night',
  timePeriod,
  latestMessage,
  studentPoints = 100,
  onDeductPoints,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingInfo | null>(null);
  const [isCafeMenuOpen, setIsCafeMenuOpen] = useState(false);
  const [cafeToast, setCafeToast] = useState<string | null>(null);
  const cafeToastTimerRef = useRef<number | null>(null);
  const [cafeScreenPos, setCafeScreenPos] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  // Entry confirmation modal state
  const [pendingConfirmation, setPendingConfirmation] = useState<EntryConfirmation | null>(null);
  const pendingConfirmationRef = useRef<EntryConfirmation | null>(null);
  pendingConfirmationRef.current = pendingConfirmation;

  // Held item (kopi: 90s, roti: 60s, eskrim: 30s)
  const [heldItem, setHeldItem] = useState<'kopi' | 'roti' | 'eskrim' | null>(null);
  const heldItemRef = useRef<'kopi' | 'roti' | 'eskrim' | null>(null);
  heldItemRef.current = heldItem;
  const [heldItemRemainingSec, setHeldItemRemainingSec] = useState<number>(0);
  const heldItemExpiresAtRef = useRef<number | null>(null);
  const heldItemTimerRef = useRef<number | null>(null);
  const heldItemIntervalRef = useRef<number | null>(null);

  // Centralized non-overlapping toast helper
  const showToast = (msg: string | null, durationMs = 3200) => {
    if (cafeToastTimerRef.current) {
      window.clearTimeout(cafeToastTimerRef.current);
      cafeToastTimerRef.current = null;
    }
    setCafeToast(msg);
    if (msg && durationMs > 0) {
      cafeToastTimerRef.current = window.setTimeout(() => {
        setCafeToast(null);
        cafeToastTimerRef.current = null;
      }, durationMs);
    }
  };

  // Equip or clear held item with automatic expiration (kopi: 90s, roti: 60s, eskrim: 30s)
  const equipHeldItem = (item: 'kopi' | 'roti' | 'eskrim' | null) => {
    if (heldItemTimerRef.current) {
      window.clearTimeout(heldItemTimerRef.current);
      heldItemTimerRef.current = null;
    }
    if (heldItemIntervalRef.current) {
      window.clearInterval(heldItemIntervalRef.current);
      heldItemIntervalRef.current = null;
    }

    if (!item) {
      heldItemRef.current = null;
      heldItemExpiresAtRef.current = null;
      setHeldItem(null);
      setHeldItemRemainingSec(0);
      sendHeartbeatRef.current?.();
      return;
    }

    const durationSec = item === 'kopi' ? 90 : item === 'roti' ? 60 : 30;
    const expiresAt = Date.now() + durationSec * 1000;
    heldItemRef.current = item;
    heldItemExpiresAtRef.current = expiresAt;
    setHeldItem(item);
    setHeldItemRemainingSec(durationSec);
    sendHeartbeatRef.current?.();

    heldItemIntervalRef.current = window.setInterval(() => {
      if (!heldItemExpiresAtRef.current) return;
      const secsLeft = Math.max(0, Math.ceil((heldItemExpiresAtRef.current - Date.now()) / 1000));
      setHeldItemRemainingSec(secsLeft);
      if (secsLeft <= 0) {
        if (heldItemIntervalRef.current) {
          window.clearInterval(heldItemIntervalRef.current);
          heldItemIntervalRef.current = null;
        }
        heldItemRef.current = null;
        heldItemExpiresAtRef.current = null;
        setHeldItem(null);
        sendHeartbeatRef.current?.();
      }
    }, 500);

    heldItemTimerRef.current = window.setTimeout(() => {
      if (heldItemIntervalRef.current) {
        window.clearInterval(heldItemIntervalRef.current);
        heldItemIntervalRef.current = null;
      }
      heldItemTimerRef.current = null;
      heldItemRef.current = null;
      heldItemExpiresAtRef.current = null;
      setHeldItem(null);
      setHeldItemRemainingSec(0);
      sendHeartbeatRef.current?.();
    }, durationSec * 1000);
  };

  // Radial Emote Menu & Active Emote State
  const [isEmoteMenuOpen, setIsEmoteMenuOpen] = useState(false);
  const isEmoteMenuOpenRef = useRef(false);
  isEmoteMenuOpenRef.current = isEmoteMenuOpen;
  const [playerScreenPos, setPlayerScreenPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [playerEmote, setPlayerEmote] = useState<ActiveEmote | null>(null);
  const playerEmoteRef = useRef<ActiveEmote | null>(null);
  playerEmoteRef.current = playerEmote;

  const triggerEmote = (type: EmoteType) => {
    const config: Record<EmoteType, { icon: string; label: string; duration: number }> = {
      love: { icon: '❤️', label: 'Suka', duration: 7000 },
      wave: { icon: '👋', label: 'Lambai', duration: 7000 },
      laugh: { icon: '😂', label: 'Tertawa', duration: 7000 },
      dance: { icon: '🎵', label: 'Joget', duration: 8500 },
    };
    const c = config[type];
    const emoteObj: ActiveEmote = {
      type,
      icon: c.icon,
      label: c.label,
      startTime: Date.now(),
      expiresAt: Date.now() + c.duration,
    };

    setPlayerEmote(emoteObj);
    if (playerRef.current) {
      playerRef.current.activeEmote = emoteObj;
    }
    setIsEmoteMenuOpen(false);

    if (type === 'dance') {
      sounds.playDanceMusic();
      showToast(`🎵 Asyik berjoget mengikuti irama musik!`, 2800);
    } else {
      sounds.playEmote();
      if (type === 'love') {
        showToast(`❤️ Suka & apresiasi hangat untuk warga Refleksia!`, 2500);
      } else if (type === 'wave') {
        showToast(`👋 Melambaikan tangan menyapa semua teman!`, 2500);
      } else if (type === 'laugh') {
        showToast(`😂 Tertawa gembira bersama warga kota!`, 2500);
      }
    }

    sendHeartbeatRef.current?.();
  };

  useEffect(() => {
    return () => {
      if (heldItemTimerRef.current) window.clearTimeout(heldItemTimerRef.current);
      if (heldItemIntervalRef.current) window.clearInterval(heldItemIntervalRef.current);
      if (cafeToastTimerRef.current) window.clearTimeout(cafeToastTimerRef.current);
    };
  }, []);

  // Tree 3-step watering & 15-second apple fruiting cycle state (treeIndex -> TreeWaterCycle)
  const [treeCycles, setTreeCycles] = useState<Record<number, TreeWaterCycle>>({});
  const treeCyclesRef = useRef<Record<number, TreeWaterCycle>>({});
  treeCyclesRef.current = treeCycles;

  // Active minimalist water spray effect from avatar to tree { treeIndex, startTime, avatarWx, avatarWy, treeWx, treeWy }
  const activeWaterSprayRef = useRef<{
    treeIndex: number;
    startTime: number;
    avatarWx: number;
    avatarWy: number;
    treeWx: number;
    treeWy: number;
  } | null>(null);

  // Sitting state on 4 front fountain benches, dual swings, campfire benches, or literacy corner
  const [isSitting, setIsSitting] = useState(false);
  const isSittingRef = useRef(false);
  isSittingRef.current = isSitting;
  const [sittingSeat, setSittingSeat] = useState<BenchId | null>(null);
  const sittingSeatRef = useRef<BenchId | null>(null);
  sittingSeatRef.current = sittingSeat;

  // Pending seat target when avatar walks to a seat before sitting down
  const pendingSeatRef = useRef<{
    seatId: BenchId;
    targetX: number;
    targetY: number;
    facingDir: 'down-left' | 'down-right' | 'up-left' | 'up-right';
    onArrive?: () => void;
  } | null>(null);

  // Literacy corner reading modal
  const [isLiteracyModalOpen, setIsLiteracyModalOpen] = useState(false);
  const [activeLiteracyDoc, setActiveLiteracyDoc] = useState<'komik' | 'majalah' | 'koran' | null>(null);

  // Nearby interaction (tree watering, fishing spot, literacy corner, or bench)
  const [nearbyAction, setNearbyAction] = useState<{
    type: 'tree' | 'fishing' | 'literacy' | 'bench';
    treeIndex?: number;
    benchId?: BenchId;
    benchName?: string;
  } | null>(null);
  const nearbyActionRef = useRef<{
    type: 'tree' | 'fishing' | 'literacy' | 'bench';
    treeIndex?: number;
    benchId?: BenchId;
    benchName?: string;
  } | null>(null);
  nearbyActionRef.current = nearbyAction;

  // Fishing state & timer
  const [isFishing, setIsFishing] = useState(false);
  const isFishingRef = useRef(false);
  isFishingRef.current = isFishing;
  const fishingTimerRef = useRef<number | null>(null);
  const fishingStartTimeRef = useRef<number>(0);

  // User Camera Zoom State (+ / -)
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  // Active comic speech bubbles (ONLY for live direct chat messages)
  const playerSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);
  const baristaSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);

  // Animated destination click ripple
  const clickRippleRef = useRef<{ wx: number; wy: number; time: number } | null>(null);

  // Player avatar object reference for direct snapping/controls
  const playerRef = useRef<AvatarData | null>(null);
  const lastMoveBroadcastTimeRef = useRef<number>(0);

  // Remote online players from other devices
  const remotePlayersRef = useRef<Map<string, AvatarData>>(new Map());
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineRemoteList, setOnlineRemoteList] = useState<
    Array<{ id: string; handle: string; name: string; role: string; isMoving: boolean; isSitting: boolean; wx: number; wy: number }>
  >([]);
  const sendHeartbeatRef = useRef<(() => void) | null>(null);

  // Persistent unique device ID per browser tab/device
  const clientDeviceIdRef = useRef<string>('');
  if (!clientDeviceIdRef.current && typeof window !== 'undefined') {
    try {
      let devId = sessionStorage.getItem('kota_device_uuid') || '';
      if (!devId) {
        devId = 'dev_' + Math.random().toString(36).substring(2, 8) + '_' + Date.now().toString(36).slice(-4);
        sessionStorage.setItem('kota_device_uuid', devId);
      }
      clientDeviceIdRef.current = devId;
    } catch {
      clientDeviceIdRef.current = 'dev_' + Math.random().toString(36).substring(2, 8);
    }
  }

  // References for render loop
  const onSelectBuildingRef = useRef(onSelectBuilding);
  onSelectBuildingRef.current = onSelectBuilding;
  const timeOfDayRef = useRef(timeOfDay);
  timeOfDayRef.current = timeOfDay;
  const timePeriodRef = useRef<TimePeriod>(timePeriod || getTimePeriodWita());
  timePeriodRef.current = timePeriod || getTimePeriodWita();
  const studentPointsRef = useRef(studentPoints);
  studentPointsRef.current = studentPoints;
  const onDeductPointsRef = useRef(onDeductPoints);
  onDeductPointsRef.current = onDeductPoints;

  // Helper to check if a specific seat ID is occupied by any remote online player
  const isSeatOccupiedByRemote = (seatId: BenchId): boolean => {
    for (const rem of remotePlayersRef.current.values()) {
      if (rem.isSitting && rem.sittingSeat === seatId) {
        return true;
      }
    }
    return false;
  };

  // Unified helper: Walk smoothly to target seat coordinates first, then sit down upon arrival
  const walkToSeatAndSit = (
    seatId: BenchId,
    targetX: number,
    targetY: number,
    facingDir: 'down-left' | 'down-right' | 'up-left' | 'up-right',
    onArrive?: () => void
  ) => {
    const p = playerRef.current;
    if (!p) return;

    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);

    const dist = Math.hypot(p.wx - targetX, p.wy - targetY);
    clickRippleRef.current = { wx: targetX, wy: targetY, time: performance.now() };

    if (dist <= 0.14) {
      pendingSeatRef.current = null;
      p.wx = targetX;
      p.wy = targetY;
      p.targetWx = targetX;
      p.targetWy = targetY;
      p.isMoving = false;
      p.walkFrame = 0;
      p.facing = facingDir;
      setIsSitting(true);
      setSittingSeat(seatId);
      onArrive?.();
      sendHeartbeatRef.current?.();
      return;
    }

    // Stand up from current seat if sitting, then walk to the new seat first
    if (isSittingRef.current) {
      setIsSitting(false);
      setSittingSeat(null);
    }
    pendingSeatRef.current = {
      seatId,
      targetX,
      targetY,
      facingDir,
      onArrive,
    };
    p.targetWx = targetX;
    p.targetWy = targetY;
    p.isMoving = true;
    sendHeartbeatRef.current?.();
  };

  // Helper to sit on a 2-person minimalist fountain bench or campfire warming bench (walks there first)
  const sitOnTwoPersonBench = (
    group: TwoPersonBenchGroup,
    preferredIdx: 0 | 1 = 0
  ): boolean => {
    const p = playerRef.current;
    if (!p) return false;

    const firstSlot = group.seats[preferredIdx];
    const secondSlot = group.seats[preferredIdx === 0 ? 1 : 0];

    let chosenSlot: TwoPersonSeatSlot | null = null;
    if (!isSeatOccupiedByRemote(firstSlot.id)) {
      chosenSlot = firstSlot;
    } else if (!isSeatOccupiedByRemote(secondSlot.id)) {
      chosenSlot = secondSlot;
    }

    if (!chosenSlot) {
      sounds.playClick();
      showToast(`🪑 ${group.name} sudah penuh (2/2 orang). Silakan pilih bangku di sebelahnya!`, 2800);
      return false;
    }

    sounds.playClick();
    const targetSlot = chosenSlot;
    walkToSeatAndSit(targetSlot.id, targetSlot.wx, targetSlot.wy, group.facing, () => {
      if (group.kind === 'campfire') {
        showToast(`🔥 Duduk di ${group.name} untuk menghangatkan tubuh di dekat Api Unggun!`, 3000);
      } else {
        const otherOccupied = isSeatOccupiedByRemote(
          targetSlot.id === firstSlot.id ? secondSlot.id : firstSlot.id
        );
        showToast(
          `🪑 Duduk santai di ${group.name} (${otherOccupied ? '2/2 terisi bersama warga' : '1/2 kapasitas'}).`,
          3000
        );
      }
    });
    return true;
  };

  // Helper to ride a swing at either of the 2 Swing Locations (walks there first, then deducts 1 XP upon sitting)
  const rideSwingWithXp = (preferredSwing: SwingSeatDef): boolean => {
    const p = playerRef.current;
    if (!p) return false;

    // If already sitting on this exact swing, do nothing
    if (isSittingRef.current && sittingSeatRef.current === preferredSwing.id) {
      return true;
    }

    // Check if preferred swing seat is occupied by a remote player; if so, check partner seat on same swing structure
    let targetSwing = preferredSwing;
    if (isSeatOccupiedByRemote(preferredSwing.id)) {
      const partner = REFLECTION_SWINGS.find(
        (s) => s.structId === preferredSwing.structId && s.id !== preferredSwing.id
      );
      if (partner && !isSeatOccupiedByRemote(partner.id)) {
        targetSwing = partner;
      } else {
        sounds.playClick();
        showToast('🎠 Kedua kursi di tempat ayunan ini sedang dinaiki warga lain!', 2800);
        return false;
      }
    }

    const cost = 1;
    if (studentPointsRef.current < cost) {
      sounds.playClick();
      showToast(
        `⚠️ Saldo XP tidak cukup! Butuh ${cost} XP untuk naik ayunan (saldo kamu ${studentPointsRef.current} XP).`,
        3200
      );
      return false;
    }

    sounds.playClick();
    walkToSeatAndSit(targetSwing.id, targetSwing.wx, targetSwing.wy, targetSwing.facing, () => {
      if (studentPointsRef.current < cost) {
        setIsSitting(false);
        setSittingSeat(null);
        showToast(`⚠️ Saldo XP tidak cukup untuk naik ayunan!`, 2800);
        return;
      }
      const ok = onDeductPointsRef.current
        ? onDeductPointsRef.current(cost, `Naik ${targetSwing.name}`)
        : true;
      if (!ok) {
        setIsSitting(false);
        setSittingSeat(null);
        return;
      }
      sounds.playRewardXp();
      const remaining = Math.max(0, studentPointsRef.current - cost);
      showToast(`🎠 Naik & berayun di ${targetSwing.name} (-1 XP) • Sisa Saldo: ${remaining} XP`, 3200);
    });
    return true;
  };

  // React to public chat messages: ONLY show speech bubble above the exact sender's avatar head
  useEffect(() => {
    if (!latestMessage || !latestMessage.content) return;
    const shortText =
      latestMessage.content.slice(0, 38) + (latestMessage.content.length > 38 ? '...' : '');

    const myCleanHandle =
      studentName
        .split(' ')
        .slice(0, 2)
        .join('_')
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '') || (isTeacher ? 'guru_dkv' : 'siswa');

    const msgHandle = String(latestMessage.senderHandle || '').replace(/^@/, '').toLowerCase();
    const msgName = String(latestMessage.senderName || '').trim().toLowerCase();

    const isFromLocalPlayer = Boolean(
      (studentId && latestMessage.senderId === studentId) ||
        (!studentId &&
          msgName === studentName.trim().toLowerCase() &&
          Boolean(latestMessage.isTeacher) === Boolean(isTeacher))
    );

    if (isFromLocalPlayer) {
      playerSpeechRef.current = {
        text: shortText,
        expiresAt: Date.now() + 6500,
      };
      // Broadcast immediately so other devices display this bubble ONLY above our avatar
      sendHeartbeatRef.current?.();
    } else {
      // Message came from another online user: attach bubble ONLY to that remote user's avatar
      for (const rem of remotePlayersRef.current.values()) {
        const remHandle = String(rem.handle || '').replace(/^@/, '').toLowerCase();
        const remName = String(rem.name || '').trim().toLowerCase();
        const sameRole = (rem.role === 'guru') === Boolean(latestMessage.isTeacher);
        if (
          sameRole &&
          ((msgHandle && remHandle === msgHandle) || (msgName && remName === msgName))
        ) {
          rem.speechText = shortText;
          rem.speechTimer = 6.5;
        }
      }
    }
  }, [latestMessage, studentId, studentName, isTeacher]);

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

  // -----------------------------------------------------------
  // REAL-TIME MULTI-DEVICE PRESENCE SYNCHRONIZATION
  // 4-Layer Hybrid Sync:
  // 1. Global WSS MQTT Presence Mesh (RealtimePresenceMesh) across any device/network/instance
  // 2. Express Server SSE (/api/presence/stream)
  // 3. Express Heartbeat (/api/presence/heartbeat)
  // 4. Local BroadcastChannel
  // -----------------------------------------------------------
  useEffect(() => {
    let isMounted = true;
    const presenceChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
      ? new BroadcastChannel('kota_refleksi_presence')
      : null;

    const clientDeviceId = clientDeviceIdRef.current || 'dev_default';
    const cleanHandle = studentName
      .split(' ')
      .slice(0, 2)
      .join('_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') || (isTeacher ? 'guru_dkv' : 'siswa');

    const mySessionId = `${isTeacher ? 'guru' : 'siswa'}_${cleanHandle}_${clientDeviceId}`;

    const syncOnlineUiList = () => {
      if (!isMounted) return;
      const list = Array.from(remotePlayersRef.current.values()).map((r) => ({
        id: r.id,
        handle: r.handle,
        name: r.name || r.handle,
        role: r.role === 'guru' ? 'guru' : 'siswa',
        isMoving: Boolean(r.isMoving),
        isSitting: Boolean(r.isSitting),
        wx: r.wx,
        wy: r.wy,
      }));
      setOnlineCount(list.length + 1);
      setOnlineRemoteList(list);
    };

    const handleIncomingOthers = (others: any[]) => {
      if (!isMounted || !Array.isArray(others)) return;
      const now = Date.now();

      others.forEach((rem: any) => {
        if (!rem || !rem.id || rem.id === mySessionId) return;

        const isRemTeacher = rem.role === 'guru' || Boolean(rem.isTeacher);
        const remRole: 'guru' | 'siswa' = isRemTeacher ? 'guru' : 'siswa';
        const remGender: 'L' | 'P' = rem.gender === 'P' ? 'P' : 'L';
        const incomingWx = typeof rem.wx === 'number' && !isNaN(rem.wx) ? rem.wx : 0.0;
        const incomingWy = typeof rem.wy === 'number' && !isNaN(rem.wy) ? rem.wy : 6.38;
        const incomingTargetWx = typeof rem.targetWx === 'number' && !isNaN(rem.targetWx) ? rem.targetWx : incomingWx;
        const incomingTargetWy = typeof rem.targetWy === 'number' && !isNaN(rem.targetWy) ? rem.targetWy : incomingWy;

        let existing = remotePlayersRef.current.get(rem.id);
        if (!existing) {
          existing = {
            id: rem.id,
            role: remRole,
            handle: String(rem.handle || 'warga').replace(/^@/, ''),
            name: rem.name || rem.handle || 'Warga',
            roleLabel: rem.roleLabel || (isRemTeacher ? 'GURU DKV' : 'Siswa DKV'),
            wx: incomingWx,
            wy: incomingWy,
            targetWx: incomingTargetWx,
            targetWy: incomingTargetWy,
            speed: typeof rem.speed === 'number' && rem.speed > 0 ? rem.speed : 1.35,
            shirtColor: rem.shirtColor || (isRemTeacher ? (remGender === 'P' ? '#047857' : '#1e3a8a') : (remGender === 'P' ? '#ec4899' : '#2563eb')),
            pantsColor: rem.pantsColor || (isRemTeacher ? (remGender === 'P' ? '#065f46' : '#1e293b') : (remGender === 'P' ? '#be185d' : '#1e293b')),
            hairColor: rem.hairColor || (remGender === 'P' ? '#6b3410' : '#0f172a'),
            gender: remGender,
            isMoving: Boolean(rem.isMoving),
            pauseTimer: 0,
            walkFrame: typeof rem.walkFrame === 'number' ? rem.walkFrame : 0,
            facing: rem.facing || 'up-left',
            isSitting: Boolean(rem.isSitting),
            sittingSeat: rem.sittingSeat,
            isFishing: Boolean(rem.isFishing),
            fishingStartTime: Boolean(rem.isFishing) ? performance.now() : undefined,
            heldItem: rem.heldItem || null,
            activeEmote: rem.activeEmote && Date.now() < rem.activeEmote.expiresAt ? rem.activeEmote : null,
            speechText: rem.speechText,
            speechTimer: rem.speechTimer || (rem.speechText ? 5 : 0),
            isOnlineRemote: true,
            spawnTime: performance.now(),
            lastPing: now,
          };
          remotePlayersRef.current.set(rem.id, existing);
        } else {
          existing.role = remRole;
          existing.handle = String(rem.handle || existing.handle).replace(/^@/, '');
          existing.name = rem.name || existing.name;
          existing.roleLabel = rem.roleLabel || (isRemTeacher ? 'GURU DKV' : 'Siswa DKV');
          existing.gender = remGender;
          existing.shirtColor = rem.shirtColor || existing.shirtColor;
          existing.pantsColor = rem.pantsColor || existing.pantsColor;
          existing.speed = typeof rem.speed === 'number' && rem.speed > 0 ? rem.speed : 1.35;

          const distFromActual = Math.hypot(existing.wx - incomingWx, existing.wy - incomingWy);
          if (Boolean(rem.isSitting)) {
            existing.wx = incomingWx;
            existing.wy = incomingWy;
            existing.targetWx = incomingWx;
            existing.targetWy = incomingWy;
            existing.isMoving = false;
          } else if (Boolean(rem.isMoving)) {
            existing.targetWx = incomingTargetWx;
            existing.targetWy = incomingTargetWy;
            if (distFromActual > 1.8) {
              existing.wx = incomingWx;
              existing.wy = incomingWy;
            }
            existing.isMoving = true;
          } else {
            // Remote player stopped at incomingWx, incomingWy
            existing.targetWx = incomingWx;
            existing.targetWy = incomingWy;
            if (distFromActual > 1.8) {
              existing.wx = incomingWx;
              existing.wy = incomingWy;
              existing.isMoving = false;
            } else {
              existing.isMoving = distFromActual > 0.05;
            }
          }

          existing.isSitting = Boolean(rem.isSitting);
          existing.sittingSeat = rem.sittingSeat;
          if (rem.facing) existing.facing = rem.facing;
          const wasFishing = Boolean(existing.isFishing);
          const nowFishing = Boolean(rem.isFishing);
          if (!wasFishing && nowFishing) {
            existing.fishingStartTime = performance.now();
          } else if (!nowFishing) {
            existing.fishingStartTime = undefined;
          }
          existing.isFishing = nowFishing;
          existing.heldItem = rem.heldItem || null;
          existing.activeEmote = rem.activeEmote && Date.now() < rem.activeEmote.expiresAt ? rem.activeEmote : null;
          if (rem.speechText) {
            existing.speechText = rem.speechText;
            existing.speechTimer = typeof rem.speechTimer === 'number' && rem.speechTimer > 0 ? rem.speechTimer : 5;
          } else {
            existing.speechText = undefined;
            existing.speechTimer = 0;
          }
          existing.lastPing = now;
        }
      });

      // Prune only players that have been completely silent across all channels for >18 seconds
      for (const [id, pl] of remotePlayersRef.current.entries()) {
        if (pl.lastPing && now - pl.lastPing > 18000) {
          remotePlayersRef.current.delete(id);
        }
      }

      syncOnlineUiList();
    };

    const buildLocalPayload = () => {
      const p = playerRef.current;
      return {
        id: mySessionId,
        handle: p ? p.handle : cleanHandle,
        name: studentName,
        role: isTeacher ? 'guru' : 'siswa',
        isTeacher: Boolean(isTeacher),
        roleLabel: isTeacher ? 'GURU DKV' : 'Siswa DKV',
        gender: p?.gender || (studentGender === 'P' ? 'P' : 'L'),
        shirtColor: p?.shirtColor || (isTeacher ? (studentGender === 'P' ? '#047857' : '#1e3a8a') : (studentGender === 'P' ? '#ec4899' : '#2563eb')),
        pantsColor: p?.pantsColor || (isTeacher ? (studentGender === 'P' ? '#065f46' : '#1e293b') : (studentGender === 'P' ? '#be185d' : '#1e293b')),
        hairColor: p?.hairColor || (studentGender === 'P' ? '#6b3410' : '#0f172a'),
        wx: p ? Number(p.wx.toFixed(3)) : 0.0,
        wy: p ? Number(p.wy.toFixed(3)) : 6.38,
        targetWx: p ? Number(p.targetWx.toFixed(3)) : 0.0,
        targetWy: p ? Number(p.targetWy.toFixed(3)) : 6.38,
        speed: p ? p.speed : 1.35,
        isMoving: Boolean(p?.isMoving),
        walkFrame: p ? Number(p.walkFrame.toFixed(2)) : 0,
        facing: p?.facing || 'up-left',
        isSitting: Boolean(isSittingRef.current),
        sittingSeat: sittingSeatRef.current || undefined,
        isFishing: Boolean(isFishingRef.current),
        heldItem: heldItemRef.current || null,
        activeEmote: playerEmoteRef.current && Date.now() < playerEmoteRef.current.expiresAt ? playerEmoteRef.current : null,
        speechText: playerSpeechRef.current && Date.now() < playerSpeechRef.current.expiresAt ? playerSpeechRef.current.text : undefined,
        speechTimer: playerSpeechRef.current ? Math.max(0, (playerSpeechRef.current.expiresAt - Date.now()) / 1000) : 0,
      };
    };

    // 1. Global WebSocket MQTT Presence Mesh (works across all devices, networks, Cloud Run instances & GitHub Pages)
    const mesh = new RealtimePresenceMesh(
      mySessionId,
      (msg) => {
        if (!isMounted) return;
        if (msg.type === 'presence_update' && msg.player && msg.player.id !== mySessionId) {
          handleIncomingOthers([msg.player]);
        } else if (msg.type === 'presence_leave' && msg.id) {
          remotePlayersRef.current.delete(msg.id);
          syncOnlineUiList();
        } else if (msg.type === 'request_sync' && msg.senderId !== mySessionId) {
          // Immediately reply with our current state so the newly connected device sees us in <50ms
          mesh.publish({ type: 'presence_update', player: buildLocalPayload() });
        }
      },
      () => {
        if (!isMounted) return;
        // Request all online citizens on other devices to announce themselves immediately
        mesh.publish({ type: 'request_sync', senderId: mySessionId });
        mesh.publish({ type: 'presence_update', player: buildLocalPayload() });
      }
    );

    const sendHeartbeat = async () => {
      if (!isMounted) return;
      const payload = buildLocalPayload();

      // A. Global WebSocket Mesh broadcast (instant cross-device & cross-network)
      mesh.publish({ type: 'presence_update', player: payload });

      // B. BroadcastChannel for local instant reaction across browser tabs
      if (presenceChannel) {
        try {
          presenceChannel.postMessage({ type: 'presence_update', player: payload });
        } catch (e) {}
      }

      // C. Server API for Express SSE & HTTP presence
      try {
        const res = await fetch('/api/presence/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok && isMounted) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const json = await res.json();
            if (json.success && Array.isArray(json.onlinePlayers)) {
              handleIncomingOthers(json.onlinePlayers);
            }
          }
        }
      } catch (err) {
        // Offline / static host fallback handled by mesh
      }
    };

    // Store instant trigger in ref so movements can be immediately synced
    sendHeartbeatRef.current = sendHeartbeat;

    // Real-time Server-Sent Events (SSE) Stream with auto-reconnect
    let eventSource: EventSource | null = null;
    let reconnectTimer: number | null = null;

    const connectSSE = () => {
      if (!isMounted) return;
      try {
        if (eventSource) eventSource.close();
        eventSource = new EventSource('/api/presence/stream');
        eventSource.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if ((data.type === 'sync' || data.type === 'init') && Array.isArray(data.onlinePlayers || data.players)) {
              handleIncomingOthers(data.onlinePlayers || data.players);
            } else if (data.type === 'player_update' || data.type === 'update') {
              if (Array.isArray(data.onlinePlayers)) {
                handleIncomingOthers(data.onlinePlayers);
              } else if (data.player) {
                handleIncomingOthers([data.player]);
              }
            } else if (data.type === 'leave') {
              const leftId = data.leftId || data.id;
              if (leftId) {
                remotePlayersRef.current.delete(leftId);
                syncOnlineUiList();
              }
            }
          } catch (err) {}
        };
        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isMounted && !reconnectTimer) {
            reconnectTimer = window.setTimeout(() => {
              reconnectTimer = null;
              connectSSE();
            }, 3000);
          }
        };
      } catch (e) {}
    };
    connectSSE();

    if (presenceChannel) {
      presenceChannel.onmessage = (event) => {
        if (event.data?.type === 'presence_update' && event.data.player) {
          handleIncomingOthers([event.data.player]);
        } else if (event.data?.type === 'presence_leave' && event.data.id) {
          remotePlayersRef.current.delete(event.data.id);
          syncOnlineUiList();
        }
      };
    }

    const interval = setInterval(sendHeartbeat, 650);
    // Initial heartbeat after playerRef is ready
    const initTimer = window.setTimeout(sendHeartbeat, 50);

    const onUnload = () => {
      sendHeartbeatRef.current = null;
      try {
        mesh.publish({ type: 'presence_leave', id: mySessionId });
        if (presenceChannel) {
          presenceChannel.postMessage({ type: 'presence_leave', id: mySessionId });
        }
        const blob = new Blob([JSON.stringify({ id: mySessionId })], { type: 'application/json' });
        navigator.sendBeacon('/api/presence/leave', blob);
      } catch (e) {}
    };
    window.addEventListener('beforeunload', onUnload);

    return () => {
      isMounted = false;
      sendHeartbeatRef.current = null;
      clearInterval(interval);
      clearTimeout(initTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (eventSource) eventSource.close();
      if (presenceChannel) presenceChannel.close();
      window.removeEventListener('beforeunload', onUnload);
      onUnload();
      mesh.dispose();
    };
  }, [isTeacher, studentName, studentGender]);

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
    // CITIZENS & AVATARS: SPAWN AT SOUTHERN MAP EDGE BY WELCOME GAPURA
    // ("SELAMAT DATANG DI REFLEKSIA CITY")
    // -----------------------------------------------------------
    const studentHandle = studentName
      .split(' ')
      .slice(0, 2)
      .join('_')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '') || (isTeacher ? 'guru_dkv' : 'siswa');

    // Deterministic non-overlapping spawn offset at the Welcome Gate (Ujung Selatan Peta [wx: 0, wy: 6.38])
    const devSeedStr = `${clientDeviceIdRef.current}_${studentHandle}_${isTeacher ? 'guru' : 'siswa'}`;
    let seedHash = 0;
    for (let i = 0; i < devSeedStr.length; i++) {
      seedHash = (seedHash * 31 + devSeedStr.charCodeAt(i)) % 1000;
    }
    const spawnSlot = seedHash % 8;
    const WELCOME_GATE_SPAWN_OFFSETS: Array<[number, number]> = [
      [0.0, 6.38],
      [-0.32, 6.42],
      [0.32, 6.42],
      [-0.18, 6.54],
      [0.18, 6.54],
      [-0.50, 6.36],
      [0.50, 6.36],
      [0.0, 6.58],
    ];
    const [initWx, initWy] = WELCOME_GATE_SPAWN_OFFSETS[spawnSlot] || [0.0, 6.38];

    // 1. Player (Siswa / Guru) spawning right at the Welcome Gapura at the edge of the map
    const isPlayerTeacher = Boolean(isTeacher);
    const player: AvatarData = {
      id: isPlayerTeacher ? 'guru_player' : 'siswa',
      role: isPlayerTeacher ? 'guru' : 'siswa',
      handle: studentHandle,
      name: studentName,
      roleLabel: isPlayerTeacher ? 'Guru Pembimbing' : 'Kamu',
      wx: initWx,
      wy: initWy,
      targetWx: initWx,
      targetWy: initWy,
      speed: 1.35, // Relaxed, gentle and natural walking speed
      shirtColor: isPlayerTeacher
        ? (studentGender === 'P' ? '#047857' : '#1e3a8a')
        : (studentGender === 'P' ? '#ec4899' : '#2563eb'),
      pantsColor: isPlayerTeacher
        ? (studentGender === 'P' ? '#065f46' : '#1e293b')
        : (studentGender === 'P' ? '#be185d' : '#1e293b'),
      hairColor: studentGender === 'P' ? '#6b3410' : '#0f172a',
      gender: studentGender === 'P' ? 'P' : 'L',
      isMoving: false,
      pauseTimer: 0,
      walkFrame: 0,
      facing: 'up-left',
    };
    playerRef.current = player;
    playerSpeechRef.current = null;
    // Immediately announce our spawn position at the Welcome Gate to all other devices
    sendHeartbeatRef.current?.();

    // -----------------------------------------------------------
    // 6 OFFICIAL TOWN STAFF NPCS IN KOTA REFLEKSIA
    // 1. Satpam Kota (Surya) - Mengitari seluruh kota menjaga keamanan
    // 2. Kutu Buku Berkacamata (Malik) - Di sekitar Lab DKV & Tefa
    // 3. Ibu Kantin (Ma Uba) - Berdiri ramah tepat di depan Toko Roti & Kafe
    // 4. Ibu Muslim Penjaga Literasi (Patra) - Selalu di Sudut Literasi mengajak warga membaca
    // 5. Penjaga Kolam (Tomi) - Dermaga Kolam Pancing Timur
    // 6. Wali Kota (Sony) - Mengitari kota & menyapa warga
    // (NPC Naziefa telah dihilangkan sesuai permintaan)
    // -----------------------------------------------------------

    // 1. Satpam Kota (Surya) - Mengitari seluruh jalan kota
    const surya: AvatarData = {
      id: 'surya',
      role: 'penjaga_kota',
      handle: 'surya',
      name: 'Surya',
      roleLabel: 'Satpam Kota',
      wx: 0.0,
      wy: 4.8,
      targetWx: 3.2,
      targetWy: 3.6,
      patrolWaypoints: [
        [0.0, 4.8],
        [3.2, 3.6],
        [3.5, 0.0],
        [3.2, -3.2],
        [0.0, -3.2],
        [-3.2, -3.2],
        [-3.5, 0.0],
        [-3.2, 3.6],
        [0.0, 1.8],
      ],
      waypointIndex: 1,
      speed: 1.05,
      shirtColor: '#d6c7b2', // Seragam PDH Satpam krem/coklat muda
      pantsColor: '#451a03', // Celana PDH Satpam coklat tua gelap
      hairColor: '#0f172a',
      gender: 'L',
      isMoving: true,
      pauseTimer: 1.2,
      walkFrame: 0,
      facing: 'down-right',
    };

    // 2. Kutu Buku Berkacamata (Malik) - Near Bengkel Latihan & Lab DKV / Tefa (South-East)
    const malik: AvatarData = {
      id: 'malik',
      role: 'penjaga_lab',
      handle: 'malik',
      name: 'Malik',
      roleLabel: 'Kutu Buku Lab',
      wx: 2.8,
      wy: 2.2,
      targetWx: 2.8,
      targetWy: 2.2,
      anchorX: 2.8,
      anchorY: 2.2,
      wanderRadius: 1.4,
      speed: 0.78,
      shirtColor: '#1e3a8a', // Sweater vest kutu buku di atas kemeja putih & dasi kupu-kupu
      pantsColor: '#334155',
      hairColor: '#0f172a',
      gender: 'L',
      isMoving: false,
      pauseTimer: 2.5,
      walkFrame: 0,
      facing: 'down-left',
    };

    // 3. Ibu Kantin Toko Roti & Kafe (Ma Uba) - Posisi tepat di DEPAN Toko menyambut warga
    const maUba: AvatarData = {
      id: 'ma_uba',
      role: 'barista',
      handle: 'ma_uba',
      name: 'Ma Uba',
      roleLabel: 'Ibu Kantin',
      wx: 4.88,
      wy: 4.82,
      targetWx: 4.88,
      targetWy: 4.82,
      anchorX: 4.88,
      anchorY: 4.82,
      wanderRadius: 0,
      speed: 0, // Berdiri ramah tepat di depan Toko
      shirtColor: '#ea580c', // Blus hangat dengan celemek putih Ibu Kantin
      pantsColor: '#7c2d12',
      hairColor: '#451a03',
      gender: 'P',
      isMoving: false,
      pauseTimer: 99999,
      walkFrame: 0,
      facing: 'down-left',
    };

    // 4. Ibu Muslim Sudut Literasi (Patra) - Selalu berada di Sudut Literasi mengajak orang membaca
    const patra: AvatarData = {
      id: 'patra',
      role: 'penjaga_literasi',
      handle: 'patra',
      name: 'Patra',
      roleLabel: 'Ibu Literasi',
      wx: -3.95,
      wy: 1.78,
      targetWx: -3.95,
      targetWy: 1.78,
      anchorX: -3.95,
      anchorY: 1.78,
      wanderRadius: 0.22, // Selalu berada di Sudut Literasi
      speed: 0.42,
      shirtColor: '#0d9488', // Gamis & Hijab Syar'i Ibu Muslimah warna hijau zamrud/toska lembut
      pantsColor: '#115e59',
      hairColor: '#064e3b',
      gender: 'P',
      isMoving: false,
      pauseTimer: 2.5,
      walkFrame: 0,
      facing: 'down-right',
      speeches: [
        'Assalamualaikum, yuk mampir baca buku! 📖',
        'Mari duduk di Sudut Literasi & baca komik! 📚',
        'Membaca membuka jendela dunia, ayo baca! ✨',
        'Ada komik DKV, majalah & koran seru di sini! 📰',
      ],
      speechText: 'Assalamualaikum, yuk mampir baca buku! 📖',
      speechTimer: 5.5,
    };

    // 5. Penjaga Kolam (Tomi) - East Fishing Pier & Pond
    const tomi: AvatarData = {
      id: 'tomi',
      role: 'penjaga_kolam',
      handle: 'tomi',
      name: 'Tomi',
      roleLabel: 'Penjaga Kolam',
      wx: 4.0,
      wy: -1.8,
      targetWx: 4.0,
      targetWy: -1.8,
      anchorX: 4.0,
      anchorY: -1.8,
      wanderRadius: 1.5,
      speed: 0.85,
      shirtColor: '#0d9488',
      pantsColor: '#334155',
      hairColor: '#0f172a',
      gender: 'L',
      isMoving: false,
      pauseTimer: 2.5,
      walkFrame: 0,
      facing: 'down-left',
    };

    // 6. Wali Kota (Sony) - Mengitari seluruh kota dan menyapa warga
    const sony: AvatarData = {
      id: 'sony',
      role: 'kepala_balai',
      handle: 'sony',
      name: 'Sony',
      roleLabel: 'Wali Kota',
      wx: 0.0,
      wy: -2.5,
      targetWx: 2.0,
      targetWy: -2.0,
      patrolWaypoints: [
        [0.0, -2.5],
        [2.0, -2.0],
        [2.5, 0.0],
        [2.0, 2.0],
        [0.0, 2.5],
        [-2.0, 2.0],
        [-2.5, 0.0],
        [-2.0, -2.0],
        [0.0, 1.4],
        [0.0, 4.2],
        [0.0, 1.4],
      ],
      waypointIndex: 1,
      speed: 0.92,
      shirtColor: '#f8fafc', // Jas Dinas Putih Wali Kota (PDUB) dengan lencana emas & dasi merah
      pantsColor: '#f1f5f9',
      hairColor: '#0f172a',
      gender: 'L',
      isMoving: true,
      pauseTimer: 1.5,
      walkFrame: 0,
      facing: 'down-right',
      speeches: [
        'Halo warga! Selamat beraktivitas di Refleksia City! 👋',
        'Semangat belajar & berkarya hari ini ya! 🌟',
        'Mari jaga kota kita tetap asri dan kreatif! 🏛️',
        'Salam hangat dari Wali Kota untuk seluruh warga! 🤝',
      ],
      speechText: 'Halo warga! Selamat beraktivitas di Refleksia City! 👋',
      speechTimer: 5.0,
    };

    const npcs: AvatarData[] = [surya, malik, maUba, patra, tomi, sony];

    // Cafe coordinates (Toko Roti & Kafe - Di ujung kota belakang Lab DKV)
    const cafeWx = 4.65;
    const cafeWy = 4.55;

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
      const { sx, sy, wx, wy } = getPointerWorldPos(clientX, clientY);

      // 0. Check Click on Player Avatar -> Open/toggle radial emote picker!
      const z = zoomLevelRef.current;
      const pPt = toScreen(player.wx, player.wy, 0, camera.x, camera.y);
      const distToPlayerScreen = Math.hypot(sx - pPt.x, sy - (pPt.y - 12 * z));
      const distToPlayerWorld = Math.hypot(wx - player.wx, wy - player.wy);

      if (distToPlayerScreen < 28 * z || distToPlayerWorld < 0.65) {
        sounds.playClick();
        setIsEmoteMenuOpen((prev) => {
          const next = !prev;
          if (next) {
            setPlayerScreenPos({ x: Math.round(pPt.x), y: Math.round(pPt.y - 12 * z) });
          }
          return next;
        });
        return;
      }

      // If radial emote menu was open and user clicked elsewhere, dismiss it
      if (isEmoteMenuOpenRef.current) {
        setIsEmoteMenuOpen(false);
      }

      // 1. Check Click on Cafe Stall (Toko Roti & Kafe di ujung kota belakang Lab DKV)
      const cafeDist = Math.hypot(wx - cafeWx, wy - cafeWy);
      if (cafeDist < 1.95) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        player.targetWx = 4.15;
        player.targetWy = 4.15; // Counter front
        player.isMoving = true;
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now() };
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

      // 2. Check Click on Kolam Pemancingan Timur [4.6, -2.2]
      const fishSpotDist = Math.hypot(wx - 4.6, wy - (-2.2));
      if (fishSpotDist < 2.2) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        player.targetWx = 4.2;
        player.targetWy = -2.0;
        player.isMoving = true;
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now() };
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        setNearbyAction({ type: 'fishing' });
        return;
      }

      // 3. Check Click on Benches (8 Minimalist Fountain Benches [2-seater], 2 Literacy Benches [2-seater], 2 Campfire Benches [2-seater]) & 2 Swing Structures (-1 XP)
      for (const group of ALL_TWO_PERSON_BENCHES) {
        const groupDist = Math.hypot(wx - group.wx, wy - group.wy);
        if (groupDist < 0.95) {
          const distA = Math.hypot(wx - group.seats[0].wx, wy - group.seats[0].wy);
          const distB = Math.hypot(wx - group.seats[1].wx, wy - group.seats[1].wy);
          const preferredIdx: 0 | 1 = distB < distA ? 1 : 0;
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          sitOnTwoPersonBench(group, preferredIdx);
          return;
        }
      }

      // 3b. Check Click directly on Campfire in Corner [-4.65, 4.65] -> Walk to & sit on nearest available Campfire Bench to warm up!
      if (Math.hypot(wx - CAMPFIRE_COORDS.wx, wy - CAMPFIRE_COORDS.wy) < 1.25) {
        const distLeft = Math.hypot(wx - CAMPFIRE_BENCHES[0].wx, wy - CAMPFIRE_BENCHES[0].wy);
        const distRight = Math.hypot(wx - CAMPFIRE_BENCHES[1].wx, wy - CAMPFIRE_BENCHES[1].wy);
        const firstGroup = distRight < distLeft ? CAMPFIRE_BENCHES[1] : CAMPFIRE_BENCHES[0];
        const secondGroup = distRight < distLeft ? CAMPFIRE_BENCHES[0] : CAMPFIRE_BENCHES[1];
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        if (!sitOnTwoPersonBench(firstGroup, 0)) {
          sitOnTwoPersonBench(secondGroup, 0);
        }
        return;
      }

      // 3c. Check Click on 2 Swing Locations (4 Swing Seats, walks there first then costs 1 XP to ride)
      for (const swing of REFLECTION_SWINGS) {
        const swingDist = Math.hypot(wx - swing.wx, wy - swing.wy);
        if (swingDist < 0.95) {
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          rideSwingWithXp(swing);
          return;
        }
      }

      // 3d. Check Click on Sudut Literasi [-4.3, 1.8]
      const litSpotDist = Math.hypot(wx - (-4.3), wy - 1.8);
      if (litSpotDist < 2.0) {
        sounds.playClick();
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        const targetLitBench = LITERACY_BENCHES[0];
        walkToSeatAndSit(targetLitBench.seats[0].id, targetLitBench.seats[0].wx, targetLitBench.seats[0].wy, targetLitBench.facing, () => {
          sounds.playOpenModal();
          setIsLiteracyModalOpen(true);
        });
        return;
      }

      // 5. Check Click on Buildings
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        const dist = Math.hypot(wx - bx, wy - by);
        if (dist < 2.2 || (Math.abs(wx - bx) < 1.8 && Math.abs(wy - by) < 1.8)) {
          sounds.playClick();
          if (isSittingRef.current) {
            setIsSitting(false);
            setSittingSeat(null);
          }
          pendingSeatRef.current = null;
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
          clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now() };
          pendingBuildingId = b.id;
          lastTouchedIdRef.current = null;
          return;
        }
      }

      // 6. Click on ground anywhere across 15x15 platform
      sounds.playClick();
      if (isSittingRef.current) {
        setIsSitting(false);
        setSittingSeat(null);
      }
      pendingSeatRef.current = null;
      let targetX = Math.max(-6.8, Math.min(6.8, wx));
      let targetY = Math.max(-6.8, Math.min(6.8, wy));
      if (isSolidCollision(targetX, targetY, 0.1)) {
        // Nudge away from fountain center basin
        const dirX = player.wx - targetX;
        const dirY = player.wy - targetY;
        const d = Math.hypot(dirX, dirY) || 1;
        targetX += (dirX / d) * 0.45;
        targetY += (dirY / d) * 0.45;
      }
      clickRippleRef.current = { wx: targetX, wy: targetY, time: performance.now() };
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
      // Immediately notify other devices of new position and movement
      sendHeartbeatRef.current?.();
    };

    const onPointerMove = (e: MouseEvent) => {
      const { wx, wy } = getPointerWorldPos(e.clientX, e.clientY);

      const isOverPlayer = Math.hypot(wx - player.wx, wy - player.wy) < 0.65;

      const isOverInteractiveSpot =
        isOverPlayer ||
        Math.hypot(wx - cafeWx, wy - cafeWy) < 2.0 ||
        Math.hypot(wx - 4.6, wy - (-2.2)) < 2.2 ||
        Math.hypot(wx - (-4.3), wy - 1.8) < 2.0 ||
        Math.hypot(wx - (-3.7), wy - 1.8) < 1.05 ||
        Math.hypot(wx - CAMPFIRE_COORDS.wx, wy - CAMPFIRE_COORDS.wy) < 1.35 ||
        ALL_TWO_PERSON_BENCHES.some((g) => Math.hypot(wx - g.wx, wy - g.wy) < 1.05) ||
        SWING_STRUCTURES.some((s) => Math.hypot(wx - s.wx, wy - s.wy) < 1.15);

      if (isOverInteractiveSpot) {
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

      // Update player screen coordinates for radial emote menu if open
      if (isEmoteMenuOpenRef.current && playerRef.current) {
        const pPt = toScreen(player.wx, player.wy, 0, camera.x, camera.y);
        const z = zoomLevelRef.current;
        setPlayerScreenPos({ x: Math.round(pPt.x), y: Math.round(pPt.y - 12 * z) });
      }

      // Check for local emote expiration
      if (playerEmoteRef.current && Date.now() >= playerEmoteRef.current.expiresAt) {
        playerEmoteRef.current = null;
        setPlayerEmote(null);
        if (playerRef.current) {
          playerRef.current.activeEmote = null;
        }
      }

      // Update Player Movement (Natural relaxed cadence, obstacle sliding & seat arrival transition)
      if (isSittingRef.current) {
        player.isMoving = false;
        player.walkFrame = 0;
      } else if (isFishingRef.current) {
        player.isMoving = false;
        player.walkFrame = 0;
        player.facing = 'down-right';
      } else if (player.isMoving) {
        const dx = player.targetWx - player.wx;
        const dy = player.targetWy - player.wy;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.08) {
          // Soft, gentle deceleration easing as avatar approaches target
          const easeSpeed = player.speed * Math.min(1.0, 0.45 + dist * 1.5);
          const step = Math.min(dist, easeSpeed * delta);
          const stepX = (dx / dist) * step;
          const stepY = (dy / dist) * step;

          const nextWx = player.wx + stepX;
          const nextWy = player.wy + stepY;

          // Solid obstacle collision check with smooth fountain tangential steering & wall sliding
          if (!isSolidCollision(nextWx, nextWy, 0.16)) {
            player.wx = nextWx;
            player.wy = nextWy;
            player.walkFrame += delta * (4.2 + (easeSpeed / player.speed) * 1.8);
          } else {
            const fDist = Math.hypot(nextWx, nextWy);
            if (fDist < 1.12 && fDist > 0.001) {
              // Tangential glide around central fountain basin so walking to any fountain bench never gets stuck
              const nx = nextWx / fDist;
              const ny = nextWy / fDist;
              const t1x = -ny, t1y = nx;
              const t2x = ny, t2y = -nx;
              const dot1 = t1x * dx + t1y * dy;
              const dot2 = t2x * dx + t2y * dy;
              const tx = dot1 >= dot2 ? t1x : t2x;
              const ty = dot1 >= dot2 ? t1y : t2y;
              player.wx += tx * step;
              player.wy += ty * step;
              const newR = Math.hypot(player.wx, player.wy);
              if (newR < 1.10 && newR > 0.001) {
                player.wx = (player.wx / newR) * 1.10;
                player.wy = (player.wy / newR) * 1.10;
              }
              player.walkFrame += delta * 5.2;
            } else {
              // Wall sliding: try X movement only
              const canMoveX = !isSolidCollision(nextWx, player.wy, 0.16);
              // Wall sliding: try Y movement only
              const canMoveY = !isSolidCollision(player.wx, nextWy, 0.16);

              if (canMoveX) {
                player.wx = nextWx;
                player.walkFrame += delta * 5.2;
              } else if (canMoveY) {
                player.wy = nextWy;
                player.walkFrame += delta * 5.2;
              } else if (pendingSeatRef.current && dist < 0.55) {
                // Close enough to target seat when blocked -> complete sitting
                const ps = pendingSeatRef.current;
                pendingSeatRef.current = null;
                player.wx = ps.targetX;
                player.wy = ps.targetY;
                player.targetWx = ps.targetX;
                player.targetWy = ps.targetY;
                player.isMoving = false;
                player.walkFrame = 0;
                player.facing = ps.facingDir;
                setIsSitting(true);
                setSittingSeat(ps.seatId);
                ps.onArrive?.();
                sendHeartbeatRef.current?.();
              } else {
                // Blocked completely by building wall
                player.isMoving = false;
                player.walkFrame = 0;
              }
            }
          }

          if (player.isMoving) {
            if (dx >= 0 && dy >= 0) player.facing = 'down-right';
            else if (dx < 0 && dy >= 0) player.facing = 'down-left';
            else if (dx >= 0 && dy < 0) player.facing = 'up-right';
            else player.facing = 'up-left';
          }

          // Proximity touch check: show confirmation popup at top WITHOUT interrupting player movement (skip while walking to a seat)
          if (!pendingSeatRef.current) {
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
          }
        } else {
          // Arrived at target destination! Check if avatar was walking to a seat/swing
          if (pendingSeatRef.current) {
            const ps = pendingSeatRef.current;
            pendingSeatRef.current = null;
            player.wx = ps.targetX;
            player.wy = ps.targetY;
            player.targetWx = ps.targetX;
            player.targetWy = ps.targetY;
            player.isMoving = false;
            player.walkFrame = 0;
            player.facing = ps.facingDir;
            setIsSitting(true);
            setSittingSeat(ps.seatId);
            ps.onArrive?.();
            sendHeartbeatRef.current?.();
          } else {
            player.isMoving = false;
            player.walkFrame = 0;
            sendHeartbeatRef.current?.();
          }
        }

        // Live broadcast position while walking every 120ms so other devices see movement in real-time
        if (currentTime - lastMoveBroadcastTimeRef.current > 120) {
          lastMoveBroadcastTimeRef.current = currentTime;
          sendHeartbeatRef.current?.();
        }
      }

      // Proximity checks: East Fishing Dock & Kolam [4.6, -2.2], West Literacy Corner [-4.3, 1.8], 4 Minimalist Fountain Benches (2-seater), 2 Campfire Benches, 2 Swing Structures + Literacy Bench
      const fishDist = Math.hypot(player.wx - 4.6, player.wy - (-2.2));
      const litDist = Math.hypot(player.wx - (-4.3), player.wy - 1.8);
      const litBenchDist = Math.hypot(player.wx - (-3.7), player.wy - 1.8);

      let nearBench: { id: BenchId; name: string } | null = null;
      for (const group of ALL_TWO_PERSON_BENCHES) {
        if (Math.hypot(player.wx - group.wx, player.wy - group.wy) < 1.05) {
          const distA = Math.hypot(player.wx - group.seats[0].wx, player.wy - group.seats[0].wy);
          const distB = Math.hypot(player.wx - group.seats[1].wx, player.wy - group.seats[1].wy);
          const chosenSeat = distB < distA ? group.seats[1] : group.seats[0];
          nearBench = { id: chosenSeat.id, name: group.name };
          break;
        }
      }
      if (!nearBench && Math.hypot(player.wx - CAMPFIRE_COORDS.wx, player.wy - CAMPFIRE_COORDS.wy) < 1.35) {
        nearBench = { id: 'campfire_1_a', name: 'Bangku Api Unggun (Penghangat Tubuh)' };
      }
      if (!nearBench) {
        for (const s of REFLECTION_SWINGS) {
          if (Math.hypot(player.wx - s.wx, player.wy - s.wy) < 1.05) {
            nearBench = { id: s.id, name: s.name };
            break;
          }
        }
      }
      if (!nearBench && litBenchDist < 0.95) {
        nearBench = { id: 'literacy', name: 'Bangku Sudut Literasi' };
      }

      let nearTreeIdx = -1;
      for (let tIdx = 0; tIdx < trees.length; tIdx++) {
        const [tx, ty] = trees[tIdx];
        const tDist = Math.hypot(player.wx - tx, player.wy - ty);
        if (tDist < 0.85) {
          nearTreeIdx = tIdx;
          break;
        }
      }

      if (isSittingRef.current) {
        if (nearbyActionRef.current?.type !== 'bench') {
          const currentSeat = sittingSeatRef.current;
          let seatName = 'Kursi Taman Kota';
          const matchedTwoPersonGroup = ALL_TWO_PERSON_BENCHES.find(
            (g) => g.groupId === currentSeat || g.seats[0].id === currentSeat || g.seats[1].id === currentSeat
          );
          const matchedSwing = REFLECTION_SWINGS.find((s) => s.id === currentSeat);
          if (matchedTwoPersonGroup) seatName = matchedTwoPersonGroup.name;
          else if (matchedSwing) seatName = matchedSwing.name;
          else if (currentSeat === 'literacy') seatName = 'Bangku Sudut Literasi';
          setNearbyAction({ type: 'bench', benchId: currentSeat || undefined, benchName: seatName });
        }
      } else if (nearBench) {
        if (nearbyActionRef.current?.type !== 'bench' || nearbyActionRef.current?.benchId !== nearBench.id) {
          setNearbyAction({ type: 'bench', benchId: nearBench.id, benchName: nearBench.name });
        }
      } else if (litDist < 1.05) {
        if (nearbyActionRef.current?.type !== 'literacy') {
          setNearbyAction({ type: 'literacy' });
        }
      } else if (fishDist < 1.0) {
        if (nearbyActionRef.current?.type !== 'fishing') {
          setNearbyAction({ type: 'fishing' });
        }
      } else if (nearTreeIdx !== -1) {
        if (nearbyActionRef.current?.type !== 'tree' || nearbyActionRef.current?.treeIndex !== nearTreeIdx) {
          setNearbyAction({ type: 'tree', treeIndex: nearTreeIdx });
        }
      } else if (nearbyActionRef.current) {
        setNearbyAction(null);
      }

      // Update 6 Town NPCs (Patrol routes for Sony & Surya, Sudut Literasi invitations for Patra, Mayor greetings for Sony)
      npcs.forEach((npc) => {
        // Handle speech timer for Sony (Wali Kota menyapa warga) & Patra (Ibu Muslim mengajak warga baca di Sudut Literasi)
        if (npc.speeches && npc.speeches.length > 0) {
          if (npc.speechTimer && npc.speechTimer > 0) {
            npc.speechTimer -= delta;
            if (npc.speechTimer <= 0) {
              npc.speechText = undefined;
              // Pause before next greeting
              npc.speechTimer = -(3.5 + Math.random() * 3.5);
            }
          } else {
            const distToPlayer = Math.hypot(player.wx - npc.wx, player.wy - npc.wy);
            // Trigger faster if player is nearby
            npc.speechTimer = (npc.speechTimer || -2) + delta * (distToPlayer < 2.6 ? 2.5 : 1.0);
            if (npc.speechTimer >= 0) {
              const nextIdx = Math.floor(Math.random() * npc.speeches.length);
              npc.speechText = npc.speeches[nextIdx];
              npc.speechTimer = 4.8 + Math.random() * 1.5;
            }
          }
        }

        if (npc.speed === 0) {
          return;
        }

        if (!npc.isMoving) {
          npc.pauseTimer -= delta;
          if (npc.pauseTimer <= 0) {
            npc.isMoving = true;
            if (npc.patrolWaypoints && npc.patrolWaypoints.length > 0) {
              const nextWpIdx = ((npc.waypointIndex ?? 0) + 1) % npc.patrolWaypoints.length;
              npc.waypointIndex = nextWpIdx;
              npc.targetWx = npc.patrolWaypoints[nextWpIdx][0];
              npc.targetWy = npc.patrolWaypoints[nextWpIdx][1];
            } else {
              const ax = npc.anchorX ?? npc.wx;
              const ay = npc.anchorY ?? npc.wy;
              const r = npc.wanderRadius ?? 2.0;
              const angle = Math.random() * Math.PI * 2;
              const dist = 0.25 + Math.random() * r;
              npc.targetWx = Math.max(-6.5, Math.min(6.5, ax + Math.cos(angle) * dist));
              npc.targetWy = Math.max(-6.5, Math.min(6.5, ay + Math.sin(angle) * dist));
            }
          }
        } else {
          const dx = npc.targetWx - npc.wx;
          const dy = npc.targetWy - npc.wy;
          const dist = Math.hypot(dx, dy);

          if (dist > 0.1) {
            const step = Math.min(dist, npc.speed * delta);
            npc.wx += (dx / dist) * step;
            npc.wy += (dy / dist) * step;
            npc.walkFrame += delta * 8.5;
            if (dx >= 0) npc.facing = 'down-right';
            else npc.facing = 'down-left';
          } else {
            npc.isMoving = false;
            npc.walkFrame = 0;
            // Sony & Surya pause briefly at each patrol point before continuing around the city
            npc.pauseTimer = npc.patrolWaypoints ? 1.2 + Math.random() * 1.6 : 3.2 + Math.random() * 3.5;
          }
        }
      });

      // Update Real-Time Online Remote Avatars from Other Devices
      remotePlayersRef.current.forEach((rem) => {
        if (rem.speechTimer && rem.speechTimer > 0) {
          rem.speechTimer -= delta;
          if (rem.speechTimer <= 0) rem.speechText = undefined;
        }

        if (rem.isSitting) {
          rem.isMoving = false;
          rem.walkFrame = 0;
          return;
        }

        const rdx = rem.targetWx - rem.wx;
        const rdy = rem.targetWy - rem.wy;
        const rdist = Math.hypot(rdx, rdy);

        if (rdist > 0.04) {
          // Smooth catch-up speed if slightly behind, otherwise natural walking speed
          const catchupMultiplier = rdist > 1.0 ? 1.35 : 1.0;
          const rstep = Math.min(rdist, (rem.speed || 1.35) * catchupMultiplier * delta);
          rem.wx += (rdx / rdist) * rstep;
          rem.wy += (rdy / rdist) * rstep;
          rem.isMoving = true;
          rem.walkFrame += delta * 8.5;
          if (rdx >= 0 && rdy >= 0) rem.facing = 'down-right';
          else if (rdx < 0 && rdy >= 0) rem.facing = 'down-left';
          else if (rdx >= 0 && rdy < 0) rem.facing = 'up-right';
          else rem.facing = 'up-left';
        } else {
          rem.wx = rem.targetWx;
          rem.wy = rem.targetWy;
          rem.isMoving = false;
          rem.walkFrame = 0;
        }
      });

      // ---------------------------------------------------------
      // 1. SKY BACKGROUND & ATMOSPHERE (5 Periods: Subuh, Pagi, Siang, Sore, Malam)
      // ---------------------------------------------------------
      ctx.clearRect(0, 0, width, height);

      const currentPeriod: TimePeriod = timePeriodRef.current || 'siang';
      const isNight = currentPeriod === 'malam' || currentPeriod === 'subuh';

      // Atmosphere ground & pathway colors for 5 times of day
      let grassColor = '#4a7c52';
      let grassBorder = '#3d6944';
      let pathColor = '#fcfaf2';
      let pathBorder = '#e5dfd0';

      if (currentPeriod === 'subuh') {
        // SUBUH (04:30 - 06:00 WITA) - Soft twilight violet to rosy dawn horizon gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#1e1b4b');
        skyGrad.addColorStop(0.4, '#3730a3');
        skyGrad.addColorStop(0.75, '#86198f');
        skyGrad.addColorStop(1, '#f472b6');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Faint morning stars fading away
        stars.slice(0, 24).forEach((star) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * 0.4})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        });

        // Soft rosy dawn sun rising near eastern horizon
        const sunX = width - 85;
        const sunY = height * 0.45;
        const dawnGlow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 70);
        dawnGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
        dawnGlow.addColorStop(0.35, 'rgba(244, 114, 182, 0.55)');
        dawnGlow.addColorStop(1, 'rgba(244, 114, 182, 0)');
        ctx.fillStyle = dawnGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 18, 0, Math.PI * 2);
        ctx.fill();

        grassColor = '#134e4a';
        grassBorder = '#0f3a37';
        pathColor = '#475569';
        pathBorder = '#334155';
      } else if (currentPeriod === 'pagi') {
        // PAGI (06:00 - 11:00 WITA) - Fresh cheerful sky blue gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#38bdf8');
        skyGrad.addColorStop(1, '#bae6fd');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Fluffy pill clouds drifting
        clouds.forEach((cloud) => {
          cloud.x += cloud.speed * delta;
          if (cloud.x > width + 100) cloud.x = -150;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.roundRect(cloud.x, cloud.y, cloud.w, cloud.h, cloud.h / 2);
          ctx.fill();
        });

        // Rising golden morning sun
        const sunX = width - 90;
        const sunY = 75;
        const sunRadius = 26;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        for (let r = 0; r < 10; r++) {
          const angle = (r / 10) * Math.PI * 2 + elapsed * 0.1;
          const rInner = sunRadius + 4;
          const rOuter = sunRadius + 16;
          ctx.beginPath();
          ctx.moveTo(sunX + Math.cos(angle - 0.12) * rInner, sunY + Math.sin(angle - 0.12) * rInner);
          ctx.lineTo(sunX + Math.cos(angle) * rOuter, sunY + Math.sin(angle) * rOuter);
          ctx.lineTo(sunX + Math.cos(angle + 0.12) * rInner, sunY + Math.sin(angle + 0.12) * rInner);
          ctx.closePath();
          ctx.fill();
        }

        grassColor = '#22c55e';
        grassBorder = '#16a34a';
        pathColor = '#fcfaf2';
        pathBorder = '#e2e8f0';
      } else if (currentPeriod === 'siang') {
        // SIANG (11:00 - 15:00 WITA) - Brilliant daylight azure gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#0284c7');
        skyGrad.addColorStop(1, '#7dd3fc');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Clouds
        clouds.forEach((cloud) => {
          cloud.x += cloud.speed * delta;
          if (cloud.x > width + 100) cloud.x = -150;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(cloud.x, cloud.y, cloud.w, cloud.h, cloud.h / 2);
          ctx.fill();
        });

        // High brilliant sun with lens flare halo
        const sunX = width / 2;
        const sunY = 48;
        const sunRadius = 24;
        const middayGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 80);
        middayGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
        middayGlow.addColorStop(0.3, 'rgba(254, 240, 138, 0.4)');
        middayGlow.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = middayGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();

        grassColor = '#16a34a';
        grassBorder = '#15803d';
        pathColor = '#f8fafc';
        pathBorder = '#cbd5e1';
      } else if (currentPeriod === 'sore') {
        // SORE (15:00 - 18:30 WITA) - Dramatic golden hour amber & crimson gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#4c1d95');
        skyGrad.addColorStop(0.35, '#c2410c');
        skyGrad.addColorStop(0.7, '#ea580c');
        skyGrad.addColorStop(1, '#fde047');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // Sunset tinted clouds
        clouds.forEach((cloud) => {
          cloud.x += cloud.speed * delta;
          if (cloud.x > width + 100) cloud.x = -150;
          ctx.fillStyle = 'rgba(253, 164, 175, 0.75)';
          ctx.beginPath();
          ctx.roundRect(cloud.x, cloud.y, cloud.w, cloud.h, cloud.h / 2);
          ctx.fill();
        });

        // Warm setting sun sinking low in west
        const sunX = 90;
        const sunY = height * 0.42;
        const sunsetGlow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, 75);
        sunsetGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
        sunsetGlow.addColorStop(0.4, 'rgba(249, 115, 22, 0.6)');
        sunsetGlow.addColorStop(1, 'rgba(249, 115, 22, 0)');
        ctx.fillStyle = sunsetGlow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 75, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
        ctx.fill();

        grassColor = '#4d7c0f';
        grassBorder = '#3f6212';
        pathColor = '#fed7aa';
        pathBorder = '#fdba74';
      } else {
        // MALAM (18:30 - 04:30 WITA) - Deep cosmic dark space
        ctx.fillStyle = '#0b101b';
        ctx.fillRect(0, 0, width, height);

        // Constellation star trail
        stars.forEach((star) => {
          ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
        });

        // Glowing crescent moon
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

        grassColor = '#0f291e';
        grassBorder = '#0a1c15';
        pathColor = '#1e293b';
        pathBorder = '#334155';
      }

      // ---------------------------------------------------------
      // 2. ISOMETRIC CHECKERBOARD / TILE GRID PLATFORM
      // (15x15 Grid, Green Lawn & Cream Paved Pathways)
      // ---------------------------------------------------------
      const GRID_RADIUS = 7; // -7 to +7 tiles (15x15 = 225 isometric tiles)

      // Helper to check if tile (gx, gy) is a paved walkway across 15x15 island
      const isPathway = (gx: number, gy: number) => {
        // Inner loop road at |gx| == 3 or |gy| == 3
        if (Math.abs(gx) === 3 && Math.abs(gy) <= 5) return true;
        if (Math.abs(gy) === 3 && Math.abs(gx) <= 5) return true;
        // Outer promenade loop road at |gx| == 5 or |gy| == 5
        if (Math.abs(gx) === 5 && Math.abs(gy) <= 5) return true;
        if (Math.abs(gy) === 5 && Math.abs(gx) <= 5) return true;
        // Connecting central spokes to north/east/west, and South Welcome Gate avenue all the way to gy = 7
        if (gx === 0 && gy >= -6 && gy <= 7) return true;
        if (Math.abs(gx) <= 1 && gy === 6) return true;
        if (gy === 0 && Math.abs(gx) <= 6) return true;
        // Central ring
        if (Math.abs(gx) <= 1 && Math.abs(gy) <= 1) return true;
        // Walkway spur to East Pier & Kolam at [4.6, -2.2]
        if (gx >= 3 && gx <= 5 && gy === -2) return true;
        // Walkway spur to West Sudut Literasi at [-4.3, 1.8]
        if (gx <= -3 && gx >= -5 && gy === 2) return true;
        // Garden paths to Tempat Ayunan 1 [-3..-2, -4] and Tempat Ayunan 2 [2..3, -4]
        if ((gx === -3 || gx === -2) && gy === -4) return true;
        if ((gx === 2 || gx === 3) && gy === -4) return true;
        // Cozy corner stone patio for Api Unggun & Bangku Hangat at [-5..-4, 4..5]
        if ((gx === -5 || gx === -4) && (gy === 4 || gy === 5)) return true;
        // Paved corner patio for relocated Toko Roti & Kafe behind Lab DKV at [4..5, 4..5]
        if ((gx === 4 || gx === 5) && (gy === 4 || gy === 5)) return true;
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

      // Soft Animated Click Destination Ripple on Ground
      if (clickRippleRef.current) {
        const age = (performance.now() - clickRippleRef.current.time) / 750;
        if (age < 1.0) {
          const rPt = toScreen(clickRippleRef.current.wx, clickRippleRef.current.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Outer expanding ring
          const rOuter = (6 + age * 24) * z;
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.85 * (1 - age)})`;
          ctx.lineWidth = 2 * z;
          ctx.beginPath();
          ctx.ellipse(rPt.x, rPt.y, rOuter, rOuter * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Inner expanding pulse ring
          if (age > 0.12) {
            const rInner = (age - 0.12) * 18 * z;
            ctx.strokeStyle = `rgba(254, 240, 138, ${0.75 * (1 - age)})`;
            ctx.lineWidth = 1.5 * z;
            ctx.beginPath();
            ctx.ellipse(rPt.x, rPt.y, rInner, rInner * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Glowing center dot
          ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * (1 - age)})`;
          ctx.beginPath();
          ctx.ellipse(rPt.x, rPt.y, 3.2 * z, 1.6 * z, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          clickRippleRef.current = null;
        }
      }

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
        | { type: 'tree'; wx: number; wy: number; depth: number; index: number }
        | { type: 'lamp'; wx: number; wy: number; depth: number }
        | { type: 'fishing_spot'; wx: number; wy: number; depth: number }
        | { type: 'literacy_corner'; wx: number; wy: number; depth: number }
        | { type: 'bench'; wx: number; wy: number; depth: number; id: BenchId; twoPersonGroup?: TwoPersonBenchGroup }
        | { type: 'swings_structure'; struct: SwingStructureDef; wx: number; wy: number; depth: number }
        | { type: 'campfire_spot'; wx: number; wy: number; depth: number }
        | { type: 'welcome_gate'; wx: number; wy: number; depth: number };

      const drawItems: DrawItem[] = [];

      BUILDINGS_INFO.forEach((b) => {
        if (b.id === 'monumen_warga') return; // drawn as fountain
        drawItems.push({ type: 'building', info: b, depth: b.position[0] + b.position[2] });
      });

      drawItems.push({ type: 'cafe', depth: cafeWx + cafeWy });

      const getAvatarRenderDepth = (avData: AvatarData, isLocalPlayer: boolean): number => {
        const sittingNow = isLocalPlayer ? isSittingRef.current : Boolean(avData.isSitting);
        const seatId = (isLocalPlayer ? sittingSeatRef.current : avData.sittingSeat) as BenchId | undefined;
        if (sittingNow && seatId) {
          const swingDef = REFLECTION_SWINGS.find((s) => s.id === seatId);
          if (swingDef) {
            return swingDef.structWx + swingDef.structWy + 0.02;
          }
          const benchGroup = ALL_TWO_PERSON_BENCHES.find(
            (g) => g.groupId === seatId || g.seats[0].id === seatId || g.seats[1].id === seatId
          );
          if (benchGroup) {
            return benchGroup.wx + benchGroup.wy + 0.02;
          }
        }
        return avData.wx + avData.wy;
      };

      drawItems.push({
        type: 'avatar',
        data: player,
        isPlayer: true,
        depth: getAvatarRenderDepth(player, true),
      });

      npcs.forEach((npc) => {
        drawItems.push({ type: 'avatar', data: npc, isPlayer: false, depth: npc.wx + npc.wy });
      });

      // Real-time Online Avatars from other devices
      remotePlayersRef.current.forEach((remotePlayer) => {
        drawItems.push({
          type: 'avatar',
          data: remotePlayer,
          isPlayer: false,
          depth: getAvatarRenderDepth(remotePlayer, false),
        });
      });

      trees.forEach(([tx, ty], tIdx) => {
        drawItems.push({ type: 'tree', wx: tx, wy: ty, depth: tx + ty, index: tIdx });
      });

      STREET_LAMPS_LIST.forEach(([lx, ly]) => {
        drawItems.push({ type: 'lamp', wx: lx, wy: ly, depth: lx + ly });
      });

      // 1. Spot Memancing & Kolam Ikan Relocated far to East End at [4.6, -2.2]
      drawItems.push({ type: 'fishing_spot', wx: 4.6, wy: -2.2, depth: 4.6 + -2.2 });

      // 2. Sudut Literasi Siswa at West End at [-4.3, 1.8]
      drawItems.push({ type: 'literacy_corner', wx: -4.3, wy: 1.8, depth: -4.3 + 1.8 });

      // 3. 8 Minimalist 2-Seater Benches around Central Fountain + 2 Literacy Benches + 2 Campfire Benches
      ALL_TWO_PERSON_BENCHES.forEach((group) => {
        drawItems.push({
          type: 'bench',
          wx: group.wx,
          wy: group.wy,
          depth: group.wx + group.wy,
          id: group.seats[0].id,
          twoPersonGroup: group,
        });
      });

      // 5. 2 Tempat Ayunan (Behind Taman Refleksi [-2.8, -4.05] & Taman Timur [2.8, -4.05])
      SWING_STRUCTURES.forEach((st) => {
        drawItems.push({
          type: 'swings_structure',
          struct: st,
          wx: st.wx,
          wy: st.wy,
          depth: st.wx + st.wy,
        });
      });

      // 6. Api Unggun di Sudut Kota [-4.65, 4.65]
      drawItems.push({
        type: 'campfire_spot',
        wx: CAMPFIRE_COORDS.wx,
        wy: CAMPFIRE_COORDS.wy,
        depth: CAMPFIRE_COORDS.wx + CAMPFIRE_COORDS.wy,
      });

      // 7. Gapura Selamat Datang di Ujung Selatan Peta [0, 6.15]
      drawItems.push({
        type: 'welcome_gate',
        wx: WELCOME_GATE_COORDS.wx,
        wy: WELCOME_GATE_COORDS.wy,
        depth: WELCOME_GATE_COORDS.wx + WELCOME_GATE_COORDS.wy + 0.65,
      });

      drawItems.sort((a, b) => a.depth - b.depth);

      // Shared helper for exact 3D isometric front-to-back (kemuka-kebelakang) swing seat & chain geometry across BOTH swing structures
      const getSwingSeatMetrics = (seatId: SwingSeatDef['id']) => {
        const swingDef = REFLECTION_SWINGS.find((s) => s.id === seatId) || REFLECTION_SWINGS[0];
        const structPt = toScreen(swingDef.structWx, swingDef.structWy, 0, camera.x, camera.y);
        const z = zoomLevelRef.current;
        const isLeft = swingDef.isLeft;
        const anchorX = structPt.x + (isLeft ? -10 * z : 10 * z);
        const anchorY = structPt.y - 29 * z;

        let isOccupied = Boolean(isSittingRef.current && sittingSeatRef.current === seatId);
        if (!isOccupied) {
          remotePlayersRef.current.forEach((r) => {
            if (r.isSitting && r.sittingSeat === seatId) isOccupied = true;
          });
        }

        // Front-to-back (kemuka = +1 toward front-right/viewer, kebelakang = -1 toward rear-left)
        const sway = isOccupied
          ? Math.sin(elapsed * 3.2)
          : Math.sin(elapsed * 1.5 + (isLeft ? 0 : 1.2)) * 0.08;

        // Isometric forward-backward travel along the swing direction perpendicular to the top beam
        const fwdX = sway * 5.2 * z;
        const fwdGroundY = sway * 6.8 * z;
        // Circular pendulum upward lift at both front peak and back peak
        const arcLiftY = (1 - Math.cos(sway * 0.78)) * 6.5 * z;

        const seatX = anchorX + fwdX;
        const seatY = (structPt.y - 5.5 * z) + fwdGroundY - arcLiftY;
        const shadowX = anchorX + fwdX;
        const shadowY = (structPt.y + 3 * z) + fwdGroundY * 0.8;
        const shadowScale = Math.max(0.6, 1 - (1 - Math.cos(sway * 0.78)) * 0.35);

        return {
          structPt,
          anchorX,
          anchorY,
          seatX,
          seatY,
          shadowX,
          shadowY,
          shadowScale,
          sway,
          isOccupied,
        };
      };

      // Render Each Item
      drawItems.forEach((item) => {
        if (item.type === 'bench') {
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const group = item.twoPersonGroup;

          if (group && group.kind === 'fountain_minimalist') {
            // 4 TEMPAT DUDUK MINIMALIS DI SEKITAR AIR MANCUR (Muat 2 Orang / 2-Seater Minimalist Architectural Bench)
            // Soft elliptical ground shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1.5 * z, 16 * z, 5.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Matte Charcoal Minimalist U-Loop Steel Legs (Left, Center Support, Right)
            ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.fillRect(pt.x - 13 * z, pt.y - 3 * z, 2.2 * z, 6.5 * z);
            ctx.fillRect(pt.x - 0.8 * z, pt.y - 2 * z, 1.6 * z, 5 * z);
            ctx.fillRect(pt.x + 10.8 * z, pt.y - 3 * z, 2.2 * z, 6.5 * z);
            // Minimalist steel under-frame beam
            ctx.fillStyle = '#334155';
            ctx.fillRect(pt.x - 13 * z, pt.y - 0.5 * z, 26 * z, 1.8 * z);

            // Sleek Floating Minimalist Nordic Teak/Cedar Wood Deck (Wide for 2 People)
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.roundRect(pt.x - 14.5 * z, pt.y - 4.5 * z, 29 * z, 4.2 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 2 Minimalist Seat Pads (Left Seat 1 & Right Seat 2) so 2-person capacity is visually unmistakable
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(pt.x - 13 * z, pt.y - 4.1 * z, 11.8 * z, 3.0 * z, 1 * z);
            ctx.roundRect(pt.x + 1.2 * z, pt.y - 4.1 * z, 11.8 * z, 3.0 * z, 1 * z);
            ctx.fill();

            // Center divider groove between Seat 1 and Seat 2
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.0 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 4.5 * z);
            ctx.lineTo(pt.x, pt.y - 0.3 * z);
            ctx.stroke();

            // Minimalist brushed steel backrest posts
            ctx.fillStyle = '#64748b';
            ctx.fillRect(pt.x - 9.5 * z, pt.y - 9.5 * z, 1.5 * z, 5.2 * z);
            ctx.fillRect(pt.x + 8 * z, pt.y - 9.5 * z, 1.5 * z, 5.2 * z);

            // Floating Minimalist Single-Bar Backrest
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(pt.x - 13.5 * z, pt.y - 10.5 * z, 27 * z, 2.8 * z, 1.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();
          } else if (group && group.kind === 'campfire') {
            // BANGKU PENGHANGAT TUBUH DI SAMPING API UNGGUN (Warm Rustic Timber 2-Seater Log Bench)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1.5 * z, 15.5 * z, 5.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Warm firelight reflection on bench base
            ctx.fillStyle = 'rgba(251, 146, 60, 0.18)';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1 * z, 17 * z, 6.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Sturdy hewn log legs
            ctx.fillStyle = '#451a03';
            ctx.fillRect(pt.x - 12 * z, pt.y - 3 * z, 3.2 * z, 6.5 * z);
            ctx.fillRect(pt.x + 8.8 * z, pt.y - 3 * z, 3.2 * z, 6.5 * z);

            // Warm cedar plank seat (fits 2 people)
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.roundRect(pt.x - 14 * z, pt.y - 4.5 * z, 28 * z, 4.2 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Warm wool seat cushions for 2 people beside the fire
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(pt.x - 12.2 * z, pt.y - 4.0 * z, 11 * z, 2.8 * z, 1 * z);
            ctx.roundRect(pt.x + 1.2 * z, pt.y - 4.0 * z, 11 * z, 2.8 * z, 1 * z);
            ctx.fill();

            // Low backrest rail
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.roundRect(pt.x - 13 * z, pt.y - 9.5 * z, 26 * z, 2.8 * z, 1.2 * z);
            ctx.fill();
          } else {
            // LITERACY BENCH
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1 * z, 14 * z, 6 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isNight ? '#0f172a' : '#334155';
            ctx.fillRect(pt.x - 11 * z, pt.y - 3 * z, 2.5 * z, 7 * z);
            ctx.fillRect(pt.x + 8.5 * z, pt.y - 3 * z, 2.5 * z, 7 * z);
            ctx.fillRect(pt.x - 11 * z, pt.y + 2 * z, 22 * z, 2 * z);

            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.moveTo(pt.x - 12 * z, pt.y - 4 * z);
            ctx.lineTo(pt.x + 12 * z, pt.y - 4 * z);
            ctx.lineTo(pt.x + 10 * z, pt.y + 1 * z);
            ctx.lineTo(pt.x - 14 * z, pt.y + 1 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            ctx.fillStyle = '#d97706';
            ctx.fillRect(pt.x - 12 * z, pt.y - 11 * z, 24 * z, 3 * z);
            ctx.fillRect(pt.x - 12 * z, pt.y - 7 * z, 24 * z, 2.5 * z);
          }
        } else if (item.type === 'swings_structure') {
          // 2 TEMPAT AYUNAN KOTA REFLEKSIA (Masing-Masing 2 Kursi Ayunan, Naik Bayar 1 XP)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const st = item.struct;

          // Ground shadow for A-frame structure and floor patch
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 4 * z, 32 * z, 11 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Left A-Frame timber support legs (angled front-to-back for stability)
          ctx.strokeStyle = '#572506';
          ctx.lineWidth = 3.2 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x - 24 * z, pt.y + 2 * z);
          ctx.lineTo(pt.x - 20 * z, pt.y - 30 * z);
          ctx.lineTo(pt.x - 15 * z, pt.y + 8 * z);
          ctx.stroke();

          // Left A-frame cross brace
          ctx.lineWidth = 2 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x - 22.2 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x - 17.5 * z, pt.y - 9 * z);
          ctx.stroke();

          // Right A-Frame timber support legs (angled front-to-back)
          ctx.lineWidth = 3.2 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x + 15 * z, pt.y - 1 * z);
          ctx.lineTo(pt.x + 20 * z, pt.y - 30 * z);
          ctx.lineTo(pt.x + 24 * z, pt.y + 7 * z);
          ctx.stroke();

          // Right A-frame cross brace
          ctx.lineWidth = 2 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x + 17.5 * z, pt.y - 13 * z);
          ctx.lineTo(pt.x + 22.2 * z, pt.y - 10 * z);
          ctx.stroke();

          // Top horizontal timber crossbeam with beveled ends
          ctx.fillStyle = '#78350f';
          ctx.fillRect(pt.x - 25 * z, pt.y - 32 * z, 50 * z, 4.5 * z);
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1 * z;
          ctx.strokeRect(pt.x - 25 * z, pt.y - 32 * z, 50 * z, 4.5 * z);

          // Iron bolt plates & suspension rings at crossbeam
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(pt.x - 20 * z, pt.y - 30 * z, 2 * z, 0, Math.PI * 2);
          ctx.arc(pt.x + 20 * z, pt.y - 30 * z, 2 * z, 0, Math.PI * 2);
          ctx.fill();

          // Hanging Swings for this Swing Structure
          const swingIds: Array<SwingSeatDef['id']> = [st.leftSeatId, st.rightSeatId];

          swingIds.forEach((swId) => {
            const m = getSwingSeatMetrics(swId);

            // Ground shadow moving forward and backward directly beneath the swinging seat
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(
              m.shadowX,
              m.shadowY,
              6.5 * m.shadowScale * z,
              3.2 * m.shadowScale * z,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Iron hook brackets on top crossbeam
            ctx.fillStyle = '#334155';
            ctx.fillRect(m.anchorX - 5 * z, m.anchorY - 1 * z, 2 * z, 2.2 * z);
            ctx.fillRect(m.anchorX + 3 * z, m.anchorY - 1 * z, 2 * z, 2.2 * z);

            // Dual hanging iron chains / ropes from crossbeam to seat (swinging forward & backward)
            ctx.strokeStyle = isNight ? '#cbd5e1' : '#57534e';
            ctx.lineWidth = 1.3 * z;
            ctx.beginPath();
            ctx.moveTo(m.anchorX - 4.2 * z, m.anchorY);
            ctx.lineTo(m.seatX - 4.5 * z, m.seatY);
            ctx.moveTo(m.anchorX + 4.2 * z, m.anchorY);
            ctx.lineTo(m.seatX + 4.5 * z, m.seatY);
            ctx.stroke();

            // 3D Isometric Wooden Swing Seat Board
            const seatTilt = m.sway * 1.2 * z;
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(m.seatX - 6 * z, m.seatY - 1.5 * z - seatTilt * 0.4);
            ctx.lineTo(m.seatX + 6 * z, m.seatY - 1.5 * z - seatTilt * 0.4);
            ctx.lineTo(m.seatX + 5.2 * z, m.seatY + 1.8 * z + seatTilt * 0.4);
            ctx.lineTo(m.seatX - 6.8 * z, m.seatY + 1.8 * z + seatTilt * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Front thickness edge of wooden seat plank
            ctx.fillStyle = '#92400e';
            ctx.fillRect(m.seatX - 6.2 * z, m.seatY + 1.2 * z, 11.4 * z, 1.5 * z);
          });

          // Brass plaque on top beam
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(pt.x - 13 * z, pt.y - 34.5 * z, 26 * z, 3.5 * z);
          ctx.fillStyle = '#451a03';
          ctx.font = `bold ${Math.round(2.7 * z)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(st.title, pt.x, pt.y - 32.8 * z);

          // Floating Badge above Swing Structure ONLY when player approaches
          const distToSwing = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToSwing < 2.15) {
            const swBadgeY = pt.y - 44 * z;
            ctx.font = `bold ${Math.round(8.2 * z)}px sans-serif`;
            const swM = ctx.measureText(st.badgeText);
            const swW = swM.width + 12 * z;
            const swH = 16 * z;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
            ctx.beginPath();
            ctx.roundRect(pt.x - swW / 2, swBadgeY - swH / 2, swW, swH, 8 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();
            ctx.fillStyle = '#fde047';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(st.badgeText, pt.x, swBadgeY);
          }
        } else if (item.type === 'campfire_spot') {
          // API UNGGUN DI SUDUT KOTA [-4.65, 4.65] (Dikelilingi Bangku Penghangat Tubuh)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // 1. Warm Radial Ground Firelight Aura (Pulses gently with the flames)
          const firePulse = 1 + Math.sin(elapsed * 7.5) * 0.08 + Math.cos(elapsed * 11.2) * 0.05;
          const glowRx = 52 * z * firePulse;
          const glowRy = 26 * z * firePulse;
          const fireGlow = ctx.createRadialGradient(pt.x, pt.y, 2 * z, pt.x, pt.y, glowRx);
          fireGlow.addColorStop(0, 'rgba(254, 240, 138, 0.72)');
          fireGlow.addColorStop(0.28, 'rgba(251, 146, 60, 0.45)');
          fireGlow.addColorStop(0.65, 'rgba(234, 88, 12, 0.16)');
          fireGlow.addColorStop(1, 'rgba(234, 88, 12, 0)');
          ctx.fillStyle = fireGlow;
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, glowRx, glowRy, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Dark ash & glowing charcoal bed
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, 14 * z, 7.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, 9 * z, 4.8 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 3. Ring of 10 River Cobblestones around the fire pit
          for (let stIdx = 0; stIdx < 10; stIdx++) {
            const ang = (stIdx / 10) * Math.PI * 2;
            const sx = pt.x + Math.cos(ang) * 14 * z;
            const sy = pt.y + Math.sin(ang) * 7.2 * z;
            ctx.fillStyle = stIdx % 2 === 0 ? '#64748b' : '#475569';
            ctx.beginPath();
            ctx.ellipse(sx, sy, 3.6 * z, 2.4 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            // Warm inner rim highlight from fire
            ctx.fillStyle = 'rgba(251, 146, 60, 0.45)';
            ctx.beginPath();
            ctx.arc(sx - Math.cos(ang) * 1.1 * z, sy - Math.sin(ang) * 0.6 * z, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();
          }

          // 4. Crossed Firewood Logs (Kayu Bakar)
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 3.4 * z;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pt.x - 9.5 * z, pt.y + 2.5 * z);
          ctx.lineTo(pt.x + 9.5 * z, pt.y - 3.5 * z);
          ctx.moveTo(pt.x - 8.5 * z, pt.y - 3.0 * z);
          ctx.lineTo(pt.x + 8.5 * z, pt.y + 3.0 * z);
          ctx.stroke();

          // 5. Animated Multi-Layer Flickering Campfire Flames
          const sway1 = Math.sin(elapsed * 8.5) * 2.2 * z;
          const sway2 = Math.cos(elapsed * 10.5) * 1.8 * z;
          const flameH = (18 + Math.sin(elapsed * 9.2) * 3.2) * z;

          // Outer crimson-orange flame
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(pt.x - 8.5 * z, pt.y);
          ctx.quadraticCurveTo(pt.x - 9 * z, pt.y - flameH * 0.55, pt.x + sway1, pt.y - flameH);
          ctx.quadraticCurveTo(pt.x + 9 * z, pt.y - flameH * 0.55, pt.x + 8.5 * z, pt.y);
          ctx.closePath();
          ctx.fill();

          // Left & Right secondary flame tongues
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(pt.x - 7 * z, pt.y);
          ctx.quadraticCurveTo(pt.x - 8 * z, pt.y - flameH * 0.45, pt.x - 4 * z + sway2, pt.y - flameH * 0.78);
          ctx.quadraticCurveTo(pt.x, pt.y - flameH * 0.4, pt.x + 2 * z, pt.y);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(pt.x - 2 * z, pt.y);
          ctx.quadraticCurveTo(pt.x, pt.y - flameH * 0.4, pt.x + 4.5 * z - sway2, pt.y - flameH * 0.75);
          ctx.quadraticCurveTo(pt.x + 8 * z, pt.y - flameH * 0.45, pt.x + 7 * z, pt.y);
          ctx.closePath();
          ctx.fill();

          // Middle bright amber-gold flame
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.moveTo(pt.x - 5.2 * z, pt.y);
          ctx.quadraticCurveTo(pt.x - 5 * z, pt.y - flameH * 0.45, pt.x + sway2 * 0.7, pt.y - flameH * 0.76);
          ctx.quadraticCurveTo(pt.x + 5 * z, pt.y - flameH * 0.45, pt.x + 5.2 * z, pt.y);
          ctx.closePath();
          ctx.fill();

          // Inner white-yellow hot core flame
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.moveTo(pt.x - 2.8 * z, pt.y);
          ctx.quadraticCurveTo(pt.x - 2.5 * z, pt.y - flameH * 0.3, pt.x + sway1 * 0.4, pt.y - flameH * 0.48);
          ctx.quadraticCurveTo(pt.x + 2.5 * z, pt.y - flameH * 0.3, pt.x + 2.8 * z, pt.y);
          ctx.closePath();
          ctx.fill();

          // 6. Rising Glowing Sparks / Embers & Warm Smoke Wisps
          for (let sp = 0; sp < 6; sp++) {
            const spProg = (elapsed * 0.85 + sp * 0.17) % 1;
            const spX = pt.x + Math.sin(elapsed * 4 + sp * 1.9) * (6 * z) * (0.4 + spProg);
            const spY = pt.y - (8 + spProg * 28) * z;
            const spAlpha = Math.max(0, 1 - spProg);
            ctx.fillStyle = sp % 2 === 0 ? `rgba(254, 240, 138, ${spAlpha})` : `rgba(249, 115, 22, ${spAlpha})`;
            ctx.beginPath();
            ctx.arc(spX, spY, (1.6 - spProg * 0.8) * z, 0, Math.PI * 2);
            ctx.fill();
          }

          // Floating Badge above Campfire ONLY when player approaches
          const distToCampfire = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToCampfire < 2.25) {
            const cfTagY = pt.y - 42 * z;
            const cfLabel = '🔥 Api Unggun & Bangku Hangat';
            ctx.font = `bold ${Math.round(8.5 * z)}px sans-serif`;
            const cfM = ctx.measureText(cfLabel);
            const cfW = cfM.width + 14 * z;
            const cfH = 17 * z;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
            ctx.beginPath();
            ctx.roundRect(pt.x - cfW / 2, cfTagY - cfH / 2, cfW, cfH, 8.5 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(249, 115, 22, 0.8)';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();
            ctx.fillStyle = '#fed7aa';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(cfLabel, pt.x, cfTagY);
          }
        } else if (item.type === 'welcome_gate') {
          // GAPURA SELAMAT DATANG DI UJUNG PETA [wx: 0, wy: 6.15] ("SELAMAT DATANG DI REFLEKSIA CITY")
          const leftBase = toScreen(-0.92, item.wy, 0, camera.x, camera.y);
          const rightBase = toScreen(0.92, item.wy, 0, camera.x, camera.y);
          const centerBase = toScreen(0, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const pillarH = 44 * z;

          // Ground shadows under Left & Right Gate Pillars
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(leftBase.x, leftBase.y + 2 * z, 11 * z, 5.5 * z, 0, 0, Math.PI * 2);
          ctx.ellipse(rightBase.x, rightBase.y + 2 * z, 11 * z, 5.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Draw Left & Right Ornate Gapura Pillars
          [leftBase, rightBase].forEach((pBase) => {
            // Stepped carved stone pedestal base
            ctx.fillStyle = '#475569';
            ctx.fillRect(pBase.x - 7.5 * z, pBase.y - 6 * z, 15 * z, 8 * z);
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(pBase.x - 6.5 * z, pBase.y - 9 * z, 13 * z, 3.5 * z);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 0.9 * z;
            ctx.strokeRect(pBase.x - 7.5 * z, pBase.y - 6 * z, 15 * z, 8 * z);

            // Tall crimson & royal-gold column shaft
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(pBase.x - 4.8 * z, pBase.y - pillarH, 9.6 * z, pillarH - 8 * z);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(pBase.x - 3.2 * z, pBase.y - pillarH, 4.5 * z, pillarH - 8 * z);

            // Golden ornamental rings along column
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(pBase.x - 5.5 * z, pBase.y - 16 * z, 11 * z, 2.4 * z);
            ctx.fillRect(pBase.x - 5.5 * z, pBase.y - 28 * z, 11 * z, 2.4 * z);
            ctx.fillRect(pBase.x - 6.0 * z, pBase.y - pillarH + 1 * z, 12 * z, 3 * z);
          });

          // High Arch Crossbeam connecting Left & Right Pillars above the entrance road
          const leftTopX = leftBase.x;
          const leftTopY = leftBase.y - pillarH;
          const rightTopX = rightBase.x;
          const rightTopY = rightBase.y - pillarH;

          // Lower ornamental golden-crimson arch beam
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 7 * z;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(leftTopX - 6 * z, leftTopY + 3 * z);
          ctx.lineTo(rightTopX + 6 * z, rightTopY + 3 * z);
          ctx.stroke();

          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 4.2 * z;
          ctx.beginPath();
          ctx.moveTo(leftTopX - 5 * z, leftTopY + 3 * z);
          ctx.lineTo(rightTopX + 5 * z, rightTopY + 3 * z);
          ctx.stroke();

          // Hanging Warm Glowing Welcome Lanterns under both ends of the Gapura arch
          [
            { lx: leftTopX + 10 * z, ly: leftTopY + 7 * z },
            { lx: rightTopX - 10 * z, ly: rightTopY + 7 * z },
          ].forEach(({ lx, ly }) => {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.moveTo(lx, ly - 4 * z);
            ctx.lineTo(lx, ly + 1 * z);
            ctx.stroke();

            const lGlow = ctx.createRadialGradient(lx, ly + 4 * z, 1 * z, lx, ly + 4 * z, 12 * z);
            lGlow.addColorStop(0, 'rgba(254, 240, 138, 0.95)');
            lGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.4)');
            lGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
            ctx.fillStyle = lGlow;
            ctx.beginPath();
            ctx.arc(lx, ly + 4 * z, 12 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(lx, ly + 4 * z, 3.6 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
          });

          // Grand Banner Signboard at the Crown of the Gapura:
          // "SELAMAT DATANG DI REFLEKSIA CITY"
          const bannerCenterX = centerBase.x;
          const bannerCenterY = (leftTopY + rightTopY) / 2 - 10 * z;

          // Traditional/Modern Crown Roof Peak above the Signboard
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.moveTo(bannerCenterX - 96 * z, bannerCenterY - 8 * z);
          ctx.lineTo(bannerCenterX, bannerCenterY - 24 * z);
          ctx.lineTo(bannerCenterX + 96 * z, bannerCenterY - 8 * z);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.5 * z;
          ctx.stroke();

          // Golden Spire Finial at Apex of Gapura
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(bannerCenterX, bannerCenterY - 26 * z, 3.2 * z, 0, Math.PI * 2);
          ctx.fill();

          // Wide Illuminated Signboard Plaque
          const titleText = '🏛️ SELAMAT DATANG DI REFLEKSIA CITY ✨';
          ctx.font = `900 ${Math.round(9.2 * z)}px sans-serif`;
          const tm = ctx.measureText(titleText);
          const boardW = Math.max(176 * z, tm.width + 24 * z);
          const boardH = 22 * z;

          // Outer golden frame shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.roundRect(bannerCenterX - boardW / 2 + 2 * z, bannerCenterY - boardH / 2 + 2 * z, boardW, boardH, 7 * z);
          ctx.fill();

          // Deep royal navy & emerald gradient plaque background
          const boardGrad = ctx.createLinearGradient(
            bannerCenterX - boardW / 2,
            bannerCenterY - boardH / 2,
            bannerCenterX + boardW / 2,
            bannerCenterY + boardH / 2
          );
          boardGrad.addColorStop(0, '#0f172a');
          boardGrad.addColorStop(0.5, '#1e3a8a');
          boardGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = boardGrad;
          ctx.beginPath();
          ctx.roundRect(bannerCenterX - boardW / 2, bannerCenterY - boardH / 2, boardW, boardH, 7 * z);
          ctx.fill();

          // Double gold border
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.0 * z;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
          ctx.lineWidth = 0.8 * z;
          ctx.beginPath();
          ctx.roundRect(
            bannerCenterX - boardW / 2 + 2.5 * z,
            bannerCenterY - boardH / 2 + 2.5 * z,
            boardW - 5 * z,
            boardH - 5 * z,
            5 * z
          );
          ctx.stroke();

          // Crisp Glowing Gold & White Welcome Text
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(titleText, bannerCenterX, bannerCenterY);
        } else if (item.type === 'literacy_corner') {
          // SUDUT LITERASI WARGA (Minimalist Modern Reading Pavilion, Recessed Bookshelf & Teak Reading Deck)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          ctx.save();

          // Soft ambient ground shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.26)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 4 * z, 33 * z, 16.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 1. Minimalist Isometric Teak & Slate Platform Deck
          // 3D Base thickness (Matte dark slate architectural plinth)
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.moveTo(pt.x - 28 * z, pt.y - 6 * z);
          ctx.lineTo(pt.x + 2 * z, pt.y + 9 * z);
          ctx.lineTo(pt.x + 28 * z, pt.y - 4 * z);
          ctx.lineTo(pt.x + 28 * z, pt.y - 0.5 * z);
          ctx.lineTo(pt.x + 2 * z, pt.y + 12.5 * z);
          ctx.lineTo(pt.x - 28 * z, pt.y - 2.5 * z);
          ctx.closePath();
          ctx.fill();

          // Warm Honey-Teak Top Deck Surface
          const deckGrad = ctx.createLinearGradient(pt.x - 28 * z, pt.y - 18 * z, pt.x + 28 * z, pt.y + 10 * z);
          deckGrad.addColorStop(0, isNight ? '#78350f' : '#b45309');
          deckGrad.addColorStop(0.5, isNight ? '#92400e' : '#d97706');
          deckGrad.addColorStop(1, isNight ? '#572506' : '#92400e');
          ctx.fillStyle = deckGrad;
          ctx.beginPath();
          ctx.moveTo(pt.x - 28 * z, pt.y - 6 * z);
          ctx.lineTo(pt.x - 2 * z, pt.y - 19 * z);
          ctx.lineTo(pt.x + 28 * z, pt.y - 4 * z);
          ctx.lineTo(pt.x + 2 * z, pt.y + 9 * z);
          ctx.closePath();
          ctx.fill();

          // Crisp minimalist border & fine isometric teak deck plank grooves
          ctx.strokeStyle = isNight ? '#fbbf24' : '#fef3c7';
          ctx.lineWidth = 0.7 * z;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(69, 26, 3, 0.35)';
          ctx.lineWidth = 0.65 * z;
          for (let t = 1; t < 6; t++) {
            const frac = t / 6;
            const sx = (pt.x - 28 * z) + frac * (26 * z);
            const sy = (pt.y - 6 * z) - frac * (13 * z);
            const ex = (pt.x + 2 * z) + frac * (26 * z);
            const ey = (pt.y + 9 * z) - frac * (13 * z);
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
          }

          // 2. Minimalist Architectural Back Wall & Recessed Illuminated Bookshelf
          // Matte charcoal outer cabinet frame
          const shelfX = pt.x - 23 * z;
          const shelfY = pt.y - 35 * z;
          const shelfW = 20 * z;
          const shelfH = 24 * z;

          // 3D Left side depth of cabinet
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.moveTo(shelfX, shelfY);
          ctx.lineTo(shelfX - 3 * z, shelfY + 1.5 * z);
          ctx.lineTo(shelfX - 3 * z, shelfY + shelfH + 1.5 * z);
          ctx.lineTo(shelfX, shelfY + shelfH);
          ctx.closePath();
          ctx.fill();

          // Cabinet main body (Warm walnut & matte slate frame)
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(shelfX, shelfY, shelfW, shelfH, 1.5 * z);
          ctx.fill();
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 0.8 * z;
          ctx.stroke();

          // Warm recessed walnut interior with subtle LED reading backlight
          ctx.fillStyle = isNight ? '#451a03' : '#78350f';
          ctx.fillRect(shelfX + 1.4 * z, shelfY + 3.2 * z, shelfW - 2.8 * z, shelfH - 4.8 * z);

          // Minimalist header strip with subtle icon/line
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(shelfX + 1 * z, shelfY + 0.8 * z, shelfW - 2 * z, 2.2 * z);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(shelfX + 4 * z, shelfY + 1.6 * z, shelfW - 8 * z, 0.7 * z);

          // 3 Neat Minimalist Shelves with Curated Designer Book Spines
          const minimalBookPalette = ['#38bdf8', '#f59e0b', '#f8fafc', '#10b981', '#fb7185', '#a78bfa'];
          for (let s = 0; s < 3; s++) {
            const rowY = shelfY + (4.5 + s * 6.2) * z;
            // Warm LED strip glow at top of each shelfbay
            ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
            ctx.fillRect(shelfX + 1.6 * z, rowY, shelfW - 3.2 * z, 0.9 * z);

            // Neat vertical & slightly leaned minimalist book spines
            for (let b = 0; b < 5; b++) {
              const bx = shelfX + (2.3 + b * 3.1) * z;
              const bh = (b % 2 === 0 ? 4.4 : 3.9) * z;
              ctx.fillStyle = minimalBookPalette[(s * 2 + b) % minimalBookPalette.length];
              ctx.fillRect(bx, rowY + 4.8 * z - bh, 2.2 * z, bh);
              // Minimal spine band detail
              ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
              ctx.fillRect(bx, rowY + 4.8 * z - bh + 0.9 * z, 2.2 * z, 0.5 * z);
            }

            // Sleek oak shelf divider plank
            ctx.fillStyle = '#d97706';
            ctx.fillRect(shelfX + 1.4 * z, rowY + 4.8 * z, shelfW - 2.8 * z, 1.1 * z);
          }

          // Note: The 2 minimalist reading benches at Sudut Literasi are rendered via LITERACY_BENCHES (fountain_minimalist style)

          // 4. Minimalist Round Nordic Coffee Table & Open Book in Front
          const rTableX = pt.x + 7 * z;
          const rTableY = pt.y + 2.5 * z;
          // 3 sleek tripod legs
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.1 * z;
          ctx.beginPath();
          ctx.moveTo(rTableX - 3.5 * z, rTableY);
          ctx.lineTo(rTableX - 4.5 * z, rTableY + 3.5 * z);
          ctx.moveTo(rTableX + 3.5 * z, rTableY);
          ctx.lineTo(rTableX + 4.5 * z, rTableY + 3.5 * z);
          ctx.moveTo(rTableX, rTableY + 1 * z);
          ctx.lineTo(rTableX, rTableY + 4 * z);
          ctx.stroke();

          // Smooth circular birch tabletop
          ctx.fillStyle = isNight ? '#e2e8f0' : '#ffffff';
          ctx.beginPath();
          ctx.ellipse(rTableX, rTableY - 0.5 * z, 6.8 * z, 3.4 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 0.8 * z;
          ctx.stroke();

          // Minimalist open hardcover book & tiny ceramic mug on table
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(rTableX - 3.8 * z, rTableY - 2.0 * z, 5.2 * z, 2.6 * z);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(rTableX - 3.4 * z, rTableY - 1.8 * z, 2.1 * z, 2.2 * z);
          ctx.fillRect(rTableX - 1.0 * z, rTableY - 1.8 * z, 2.1 * z, 2.2 * z);

          // Minimalist ceramic cup on right side of table
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(rTableX + 3.2 * z, rTableY - 1.0 * z, 1.3 * z, 0, Math.PI * 2);
          ctx.fill();

          // 5. Minimalist Cantilevered Slatted Timber Pergola (Kisi-Kisi Kayu Modern)
          // Sleek matte-charcoal structural posts
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2.0 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x - 25 * z, pt.y - 6 * z);
          ctx.lineTo(pt.x - 25 * z, pt.y - 38 * z);
          ctx.moveTo(pt.x - 1 * z, pt.y - 18 * z);
          ctx.lineTo(pt.x - 1 * z, pt.y - 46 * z);
          ctx.moveTo(pt.x + 24 * z, pt.y - 4 * z);
          ctx.lineTo(pt.x + 24 * z, pt.y - 34 * z);
          ctx.stroke();

          // Cantilevered perimeter roof frame
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.2 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x - 26 * z, pt.y - 38 * z);
          ctx.lineTo(pt.x - 1 * z, pt.y - 46 * z);
          ctx.lineTo(pt.x + 25 * z, pt.y - 34 * z);
          ctx.lineTo(pt.x, pt.y - 26 * z);
          ctx.closePath();
          ctx.stroke();

          // Clean Parallel Teak Louver Slats (Kisi-kisi atap minimalis)
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.2 * z;
          for (let sl = 1; sl <= 5; sl++) {
            const sf = sl / 6;
            const lx = (pt.x - 26 * z) + sf * (25 * z);
            const ly = (pt.y - 38 * z) - sf * (8 * z);
            const rx = (pt.x) + sf * (25 * z);
            const ry = (pt.y - 26 * z) - sf * (8 * z);
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(rx, ry);
            ctx.stroke();
          }

          // 6. Sleek Minimalist Arch Studio Reading Lamp & Single White Ceramic Planter
          // White cylindrical ceramic pot on front-left corner
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(pt.x - 24 * z, pt.y - 3.5 * z, 5 * z, 5.5 * z, 1.2 * z);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 0.6 * z;
          ctx.stroke();
          // Neat minimalist sansevieria / monstera leaves
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.ellipse(pt.x - 21.5 * z, pt.y - 6 * z, 1.4 * z, 3.5 * z, -0.2, 0, Math.PI * 2);
          ctx.ellipse(pt.x - 19.8 * z, pt.y - 5.5 * z, 1.3 * z, 3.0 * z, 0.25, 0, Math.PI * 2);
          ctx.fill();

          // Warm Minimalist Pendant Reading Light under pergola
          const lampX = pt.x + 4 * z;
          const lampY = pt.y - 31 * z;
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 1 * z;
          ctx.beginPath();
          ctx.moveTo(lampX, lampY - 5 * z);
          ctx.lineTo(lampX, lampY);
          ctx.stroke();

          // Soft warm reading light cone
          const readGlow = ctx.createRadialGradient(lampX, lampY + 2 * z, 1 * z, lampX, lampY + 6 * z, 16 * z);
          readGlow.addColorStop(0, 'rgba(254, 240, 138, 0.75)');
          readGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.22)');
          readGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
          ctx.fillStyle = readGlow;
          ctx.beginPath();
          ctx.arc(lampX, lampY + 4 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Matte black dome shade & warm bulb
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(lampX, lampY + 1.5 * z, 3.5 * z, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(lampX, lampY + 2 * z, 1.8 * z, 0, Math.PI);
          ctx.fill();

          // Floating Pill Badge: 📖 Sudut Literasi ONLY when player approaches
          const distToLiteracy = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToLiteracy < 2.2) {
            const litTagY = pt.y - 54 * z;
            const litLabel = '📖 Sudut Literasi';
            ctx.font = `bold ${Math.round(8.8 * z)}px sans-serif`;
            const litM = ctx.measureText(litLabel);
            const litW = litM.width + 14 * z;
            const litH = 18 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.beginPath();
            ctx.roundRect(pt.x - litW / 2, litTagY - litH / 2, litW, litH, 9 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();

            ctx.fillStyle = '#bae6fd';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(litLabel, pt.x, litTagY);
          }
          ctx.restore();
        } else if (item.type === 'fishing_spot') {
          // KOLAM PEMANCINGAN TIMUR & DERMAGA (Minimalist Modern Zen Koi Pond & Cantilevered Teak Pier)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          ctx.save();

          // 1. ARCHITECTURAL MINIMALIST STONE KOI POND
          const pondX = pt.x + 20 * z;
          const pondY = pt.y + 14 * z;
          const pondW = 48 * z;
          const pondH = 24 * z;

          // Subtle ground drop shadow under stone coping
          ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
          ctx.beginPath();
          ctx.ellipse(pondX, pondY + 2 * z, pondW + 7 * z, pondH + 4 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Smooth Architectural Cut-Stone Coping Rim (Travertine / Slate)
          ctx.fillStyle = isNight ? '#334155' : '#e2e8f0';
          ctx.beginPath();
          ctx.ellipse(pondX, pondY, pondW + 5.5 * z, pondH + 3.2 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isNight ? '#475569' : '#94a3b8';
          ctx.lineWidth = 1 * z;
          ctx.stroke();

          // Clean radial architectural stone slab joint lines on rim
          ctx.strokeStyle = isNight ? 'rgba(15, 23, 42, 0.45)' : 'rgba(148, 163, 184, 0.55)';
          ctx.lineWidth = 0.75 * z;
          for (let j = 0; j < 12; j++) {
            const ang = (j / 12) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(pondX + Math.cos(ang) * pondW, pondY + Math.sin(ang) * pondH);
            ctx.lineTo(
              pondX + Math.cos(ang) * (pondW + 5.5 * z),
              pondY + Math.sin(ang) * (pondH + 3.2 * z)
            );
            ctx.stroke();
          }

          // Recessed Inner Stone Bevel Wall (gives crisp 3D depth to the basin)
          ctx.fillStyle = isNight ? '#0f172a' : '#64748b';
          ctx.beginPath();
          ctx.ellipse(pondX, pondY, pondW + 0.8 * z, pondH + 0.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Deep Crystal-Clear Azure & Emerald Water Gradient
          const pondGrad = ctx.createRadialGradient(
            pondX - 6 * z,
            pondY - 3 * z,
            3 * z,
            pondX,
            pondY,
            pondW
          );
          pondGrad.addColorStop(0, isNight ? '#0284c7' : '#38bdf8');
          pondGrad.addColorStop(0.6, isNight ? '#0369a1' : '#0284c7');
          pondGrad.addColorStop(1, isNight ? '#082f49' : '#075985');
          ctx.fillStyle = pondGrad;
          ctx.beginPath();
          ctx.ellipse(pondX, pondY + 0.6 * z, pondW, pondH - 0.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Subtle Minimalist Water Ripples
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
          ctx.lineWidth = 0.85 * z;
          for (let wp = 0; wp < 2; wp++) {
            const wRadius = ((elapsed * 4.5 + wp * 18) % (pondW * 0.78));
            ctx.beginPath();
            ctx.ellipse(pondX + 4 * z, pondY, wRadius, wRadius * 0.48, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 3 Graceful Minimalist Koi Fish Silhouettes (Kohaku, Yamabuki, Sanke)
          const koiConfigs = [
            { color: '#f97316', spot: '#ffffff', speed: 0.55, radius: 16 },
            { color: '#fbbf24', spot: '#fef08a', speed: 0.48, radius: 23 },
            { color: '#f8fafc', spot: '#ef4444', speed: 0.62, radius: 11 },
          ];

          koiConfigs.forEach((koi, kIdx) => {
            const kAngle = elapsed * koi.speed + kIdx * ((Math.PI * 2) / 3);
            const kDist = koi.radius * z;
            const kx = pondX + 3 * z + Math.cos(kAngle) * kDist;
            const ky = pondY + Math.sin(kAngle) * (kDist * 0.48);
            const heading = kAngle + Math.PI / 2;
            const tailWag = Math.sin(elapsed * 6.5 + kIdx) * 1.6 * z;

            // Sleek tapered koi body
            ctx.fillStyle = koi.color;
            ctx.beginPath();
            ctx.ellipse(kx, ky, 3.4 * z, 1.5 * z, heading, 0, Math.PI * 2);
            ctx.fill();

            // Minimalist dorsal spot
            ctx.fillStyle = koi.spot;
            ctx.beginPath();
            ctx.arc(kx + Math.cos(heading) * 0.8 * z, ky + Math.sin(heading) * 0.8 * z, 1.0 * z, 0, Math.PI * 2);
            ctx.fill();

            // Delicate crescent tail fin
            ctx.strokeStyle = koi.color;
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.moveTo(kx - Math.cos(heading) * 2.8 * z, ky - Math.sin(heading) * 2.8 * z);
            ctx.lineTo(
              kx - Math.cos(heading) * 5.2 * z + tailWag * 0.5,
              ky - Math.sin(heading) * 5.2 * z + tailWag * 0.3
            );
            ctx.stroke();
          });

          // 2 Clean Minimalist Lily Pads & Single Lotus Bloom on Far Edge
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.ellipse(pondX + 20 * z, pondY - 6 * z, 4.8 * z, 2.4 * z, 0, 0, Math.PI * 2);
          ctx.ellipse(pondX + 14 * z, pondY + 8 * z, 4.0 * z, 2.0 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Minimalist pink-white lotus flower
          ctx.fillStyle = '#fda4af';
          ctx.beginPath();
          ctx.arc(pondX + 20 * z, pondY - 6.8 * z, 2.0 * z, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(pondX + 20 * z, pondY - 6.8 * z, 0.75 * z, 0, Math.PI * 2);
          ctx.fill();

          // 2. CANTILEVERED MINIMALIST TEAK TIMBER FISHING PIER (Dermaga Kayu Minimalis)
          // Pier support pilings in water with subtle water rings
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(pt.x - 4 * z, pt.y + 10 * z, 2.6 * z, 8 * z);
          ctx.fillRect(pt.x + 7 * z, pt.y + 3 * z, 2.6 * z, 8 * z);

          // 3D Side fascia of wooden pier
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.moveTo(pt.x - 32 * z, pt.y - 2 * z);
          ctx.lineTo(pt.x - 2 * z, pt.y + 13 * z);
          ctx.lineTo(pt.x + 9 * z, pt.y + 4 * z);
          ctx.lineTo(pt.x + 9 * z, pt.y + 6.8 * z);
          ctx.lineTo(pt.x - 2 * z, pt.y + 15.8 * z);
          ctx.lineTo(pt.x - 32 * z, pt.y + 0.8 * z);
          ctx.closePath();
          ctx.fill();

          // Top Teak Decking Surface of Pier
          const pierGrad = ctx.createLinearGradient(pt.x - 32 * z, pt.y - 12 * z, pt.x + 9 * z, pt.y + 13 * z);
          pierGrad.addColorStop(0, isNight ? '#78350f' : '#b45309');
          pierGrad.addColorStop(1, isNight ? '#92400e' : '#d97706');
          ctx.fillStyle = pierGrad;
          ctx.beginPath();
          ctx.moveTo(pt.x - 21 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x + 9 * z, pt.y + 4 * z);
          ctx.lineTo(pt.x - 2 * z, pt.y + 13 * z);
          ctx.lineTo(pt.x - 32 * z, pt.y - 2 * z);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = isNight ? '#fbbf24' : '#fef3c7';
          ctx.lineWidth = 0.7 * z;
          ctx.stroke();

          // Crisp isometric plank slat lines across the pier
          ctx.strokeStyle = 'rgba(69, 26, 3, 0.45)';
          ctx.lineWidth = 0.7 * z;
          for (let s = 1; s < 7; s++) {
            const t = s / 7;
            const lx = (pt.x - 21 * z) + t * (30 * z);
            const ly = (pt.y - 11 * z) + t * (15 * z);
            const rx = (pt.x - 32 * z) + t * (30 * z);
            const ry = (pt.y - 2 * z) + t * (15 * z);
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(rx, ry);
            ctx.stroke();
          }

          // Sleek Minimalist Low-Profile Pier Bollards & Handrail along North-East Edge
          const bollardCoords = [
            [pt.x - 20 * z, pt.y - 10.5 * z],
            [pt.x - 6 * z, pt.y - 3.5 * z],
            [pt.x + 7.5 * z, pt.y + 3.2 * z],
          ];
          // Taut minimalist stainless & timber top rail
          ctx.strokeStyle = isNight ? '#94a3b8' : '#cbd5e1';
          ctx.lineWidth = 1.1 * z;
          ctx.beginPath();
          ctx.moveTo(bollardCoords[0][0], bollardCoords[0][1] - 6.5 * z);
          ctx.lineTo(bollardCoords[1][0], bollardCoords[1][1] - 6.5 * z);
          ctx.lineTo(bollardCoords[2][0], bollardCoords[2][1] - 6.5 * z);
          ctx.stroke();

          bollardCoords.forEach(([bx, by]) => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(bx - 1.1 * z, by - 7.5 * z, 2.2 * z, 7.5 * z);
            // Warm LED cap on each bollard
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(bx - 1.1 * z, by - 8.2 * z, 2.2 * z, 1.0 * z);
          });

          // Minimalist Wooden Tackle Case & Sleek Resting Rod at Pier Tip
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.roundRect(pt.x - 16 * z, pt.y - 3.5 * z, 5.5 * z, 3.8 * z, 0.8 * z);
          ctx.fill();
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(pt.x - 15.2 * z, pt.y - 2.3 * z, 3.9 * z, 0.8 * z);

          // Resting minimalist carbon/bamboo fishing rod when player is not actively fishing
          if (!isFishingRef.current) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 4 * z, pt.y + 4 * z);
            ctx.lineTo(pt.x + 14 * z, pt.y - 4 * z);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 0.65 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 14 * z, pt.y - 4 * z);
            ctx.lineTo(pt.x + 15 * z, pt.y + 11 * z);
            ctx.stroke();

            // Minimalist red-white float bobber
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(pt.x + 15 * z, pt.y + 11 * z, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. FLOATING BADGE: 🎣 Kolam Pemancingan ONLY when player approaches
          const distToFishing = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToFishing < 2.3) {
            const dockTagY = pt.y - 46 * z;
            const dockLabel = '🎣 Kolam Pemancingan';
            ctx.font = `bold ${Math.round(8.8 * z)}px sans-serif`;
            const dM = ctx.measureText(dockLabel);
            const dW = dM.width + 14 * z;
            const dH = 18 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
            ctx.beginPath();
            ctx.roundRect(pt.x - dW / 2, dockTagY - dH / 2, dW, dH, 9 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();

            ctx.fillStyle = '#bae6fd';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dockLabel, pt.x, dockTagY);
          }
          ctx.restore();
        } else if (item.type === 'tree') {
          // Double-Sphere Tree (Minimalist Watering + 3-Watering Cycle -> 15s Red Apples -> Auto Reset)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const cycle = treeCyclesRef.current[item.index];
          const elapsedSinceWatered = cycle && cycle.lastWateredTime ? (currentTime - cycle.lastWateredTime) / 1000 : 999;
          const isRecentlyWatered = elapsedSinceWatered >= 0 && elapsedSinceWatered < 1.8;

          let appleElapsed = -1;
          if (cycle && cycle.appleStartTime !== null) {
            appleElapsed = (currentTime - cycle.appleStartTime) / 1000;
            if (appleElapsed >= 15.0) {
              // 15 seconds of apples completed -> automatically reset tree cycle back to 0/3!
              treeCyclesRef.current[item.index] = {
                count: 0,
                lastWateredTime: 0,
                appleStartTime: null,
              };
              appleElapsed = -1;
            }
          }
          const hasApples = appleElapsed >= 0 && appleElapsed < 15.0;
          const isLush = isRecentlyWatered || hasApples || (cycle && cycle.count > 0 && elapsedSinceWatered < 15.0);

          // Only make tree transparent if avatar is specifically BEHIND tree canopy and tree is NOT being watered/fruiting
          const isBehindTree = (player.wy < item.wy - 0.2) && (Math.abs(player.wx - item.wx) < 0.95) && (item.wy - player.wy < 1.7);
          const isTreeTransparent = isBehindTree && !isRecentlyWatered && !hasApples;

          ctx.save();
          if (isTreeTransparent) {
            ctx.globalAlpha = 0.45;
          }

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
          ctx.fillStyle = isLush ? '#047857' : (isNight ? '#064e3b' : '#059669');
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 32 * z, 22 * z, 0, Math.PI * 2);
          ctx.fill();

          // Lower sphere highlight
          ctx.fillStyle = isLush ? '#10b981' : (isNight ? '#047857' : '#10b981');
          ctx.beginPath();
          ctx.arc(pt.x - 4 * z, pt.y - 36 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper overlapping bright mint/lime sphere
          ctx.fillStyle = isLush ? '#10b981' : (isNight ? '#047857' : '#10b981');
          ctx.beginPath();
          ctx.arc(pt.x + 1 * z, pt.y - 48 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper sphere soft top highlight
          ctx.fillStyle = isLush ? '#34d399' : (isNight ? '#059669' : '#34d399');
          ctx.beginPath();
          ctx.arc(pt.x - 2 * z, pt.y - 52 * z, 11 * z, 0, Math.PI * 2);
          ctx.fill();

          // Top foliage bud
          ctx.fillStyle = isLush ? '#6ee7b7' : (isNight ? '#10b981' : '#6ee7b7');
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 59 * z, 6 * z, 0, Math.PI * 2);
          ctx.fill();

          // 1. EFEK POHON TERSIRAM MINIMALIS (Clean & subtle for 1.8s when watered)
          if (isRecentlyWatered) {
            const fade = Math.max(0, 1 - elapsedSinceWatered / 1.8);
            ctx.save();
            // 8 delicate minimalist vertical rain droplets over the tree crown
            for (let r = 0; r < 8; r++) {
              const offset = ((r - 3.5) * 4.5) * z;
              const dropProg = ((elapsedSinceWatered * 2.4 + r * 0.27) % 1.0);
              const rx = pt.x + offset;
              const ry = pt.y - (68 - dropProg * 36) * z;

              ctx.strokeStyle = `rgba(186, 230, 253, ${0.75 * fade})`;
              ctx.lineWidth = 1.0 * z;
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx, ry + 4.2 * z);
              ctx.stroke();
            }

            // Single minimalist expanding water ring ripple around tree crown
            const ringR = (10 + (elapsedSinceWatered / 1.8) * 14) * z;
            ctx.strokeStyle = `rgba(125, 211, 252, ${0.55 * fade})`;
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 38 * z, ringR, ringR * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 2. BUAH APEL MERAH (Muncul setelah 3x disiram, bertahan selama 15 detik lalu hilang otomatis)
          if (hasApples) {
            let appleAlpha = 1.0;
            if (appleElapsed < 0.5) {
              // 0s to 0.5s: smooth pop-in
              appleAlpha = appleElapsed / 0.5;
            } else if (appleElapsed <= 12.5) {
              // 0.5s to 12.5s: ripe bright red apples
              appleAlpha = 1.0;
            } else {
              // 12.5s to 15.0s: smooth fade to 0 before cycle resets
              appleAlpha = Math.max(0, (15.0 - appleElapsed) / 2.5);
            }

            if (appleAlpha > 0.01) {
              ctx.save();
              ctx.globalAlpha = appleAlpha * (isTreeTransparent ? 0.45 : 1.0);

              const applePositions = [
                [-11, -34],
                [10, -36],
                [-4, -48],
                [8, -46],
                [-12, -24],
                [5, -26],
                [-1, -40],
              ];

              applePositions.forEach(([ax, ay], aIdx) => {
                const appleBob = Math.sin(elapsed * 3.5 + aIdx) * 0.5 * z;
                const appleX = pt.x + ax * z;
                const appleY = pt.y + ay * z + appleBob;

                // Little brown stem
                ctx.strokeStyle = '#451a03';
                ctx.lineWidth = 0.9 * z;
                ctx.beginPath();
                ctx.moveTo(appleX, appleY - 2.8 * z);
                ctx.lineTo(appleX + 0.5 * z, appleY - 4.5 * z);
                ctx.stroke();

                // Tiny green leaf
                ctx.fillStyle = '#16a34a';
                ctx.beginPath();
                ctx.ellipse(appleX + 1.8 * z, appleY - 4 * z, 1.8 * z, 1.0 * z, Math.PI / 4, 0, Math.PI * 2);
                ctx.fill();

                // Plump Red Apple body
                ctx.fillStyle = '#dc2626';
                ctx.beginPath();
                ctx.arc(appleX, appleY, 3.4 * z, 0, Math.PI * 2);
                ctx.fill();

                // Soft bright red highlight
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(appleX - 0.5 * z, appleY - 0.5 * z, 2.7 * z, 0, Math.PI * 2);
                ctx.fill();

                // White specular shine gleam
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(appleX - 1 * z, appleY - 1.2 * z, 0.9 * z, 0, Math.PI * 2);
                ctx.fill();
              });

              ctx.restore();
            }
          }

          // Minimalist watering progress pill above tree when near or active (💧 1/3, 💧 2/3, or 🍎 15s)
          const distPlayerToThisTree = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          const activeCount = cycle ? cycle.count : 0;
          if ((distPlayerToThisTree < 1.35 && activeCount > 0) || isRecentlyWatered || hasApples) {
            const badgeText = hasApples
              ? `🍎 ${Math.max(1, Math.ceil(15 - appleElapsed))}d`
              : `💧 ${activeCount}/3`;
            const badgeY = pt.y - 68 * z;
            ctx.font = `bold ${Math.round(7.5 * z)}px sans-serif`;
            const bm = ctx.measureText(badgeText);
            const bw = bm.width + 8 * z;
            const bh = 12 * z;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.beginPath();
            ctx.roundRect(pt.x - bw / 2, badgeY - bh / 2, bw, bh, 6 * z);
            ctx.fill();
            ctx.strokeStyle = hasApples ? '#ef4444' : '#38bdf8';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, pt.x, badgeY);
          }

          ctx.restore();
        } else if (item.type === 'building') {
          const b = item.info;
          const [bx, , by] = b.position;
          const pt = toScreen(bx, by, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const isHovered = hoveredBuildingRef?.id === b.id;

          const distToPlayer = Math.hypot(player.wx - bx, player.wy - by);
          const isTransparent = distToPlayer < 2.2;

          ctx.save();
          if (isTransparent) {
            ctx.globalAlpha = 0.5;
          }

          // Realistic building shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 5, pt.y + 6, 44 * z, 22 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          if (b.id === 'balai_kota') {
            // NORTH: GEDUNG KUBAH EMAS (Balai Kota - Symmetrical Neoclassical Capitol & Refined Rotunda Dome)
            // 1. Stepped Granite & Marble Plinth Foundation
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(pt.x - 42 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 37 * z);
            ctx.lineTo(pt.x + 42 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x + 42 * z, pt.y + 23 * z);
            ctx.lineTo(pt.x, pt.y + 44 * z);
            ctx.lineTo(pt.x - 42 * z, pt.y + 23 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(pt.x - 39 * z, pt.y + 15 * z);
            ctx.lineTo(pt.x, pt.y + 34.5 * z);
            ctx.lineTo(pt.x + 39 * z, pt.y + 15 * z);
            ctx.lineTo(pt.x + 39 * z, pt.y + 19.5 * z);
            ctx.lineTo(pt.x, pt.y + 39 * z);
            ctx.lineTo(pt.x - 39 * z, pt.y + 19.5 * z);
            ctx.closePath();
            ctx.fill();

            // 2. Isometric Roof Deck Platform (Gives the building true 3D volume so the dome sits squarely in the center)
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 40 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 4 * z);
            ctx.lineTo(pt.x - 36 * z, pt.y - 22 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1 * z;
            ctx.stroke();

            // 3. Left Front Wall (Shaded Limestone Facade)
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 4 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 36 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 4. Right Front Wall (Sunlit Cream-White Marble Facade)
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 4 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Horizontal architectural stringcourse bands along both walls
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 36 * z, pt.y - 6 * z);
            ctx.lineTo(pt.x, pt.y + 12 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y - 6 * z);
            ctx.stroke();

            // 5. Left Wall Neoclassical Colonnade Portico & Grand Entrance
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.7 * z;
            [-31, -24, -11, -4].forEach((c) => {
              const colBaseY = pt.y + 16 * z + ((c + 36) / 36) * 18 * z;
              const colH = 28 * z;
              ctx.fillRect(pt.x + c * z, colBaseY - colH, 3.6 * z, colH);
              ctx.strokeRect(pt.x + c * z, colBaseY - colH, 3.6 * z, colH);
              // Column capital & base
              ctx.fillStyle = '#cbd5e1';
              ctx.fillRect(pt.x + (c - 0.6) * z, colBaseY - colH - 1.5 * z, 4.8 * z, 2 * z);
              ctx.fillRect(pt.x + (c - 0.6) * z, colBaseY - 1.5 * z, 4.8 * z, 2 * z);
              ctx.fillStyle = '#ffffff';
            });

            // Arched Mahogany Grand Double Doors on Left Facade Center
            const doorX = pt.x - 16.5 * z;
            const doorBottomY = pt.y + 25.5 * z;
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(doorX, doorBottomY - 14 * z, 5.5 * z, Math.PI, 0);
            ctx.rect(doorX - 5.5 * z, doorBottomY - 14 * z, 11 * z, 14 * z);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1 * z;
            ctx.stroke();

            // Fanlight transom window above door
            ctx.fillStyle = isNight ? '#fef08a' : '#38bdf8';
            ctx.beginPath();
            ctx.arc(doorX, doorBottomY - 14 * z, 4.2 * z, Math.PI, 0);
            ctx.fill();
            // Double door center seam & gold handles
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(doorX, doorBottomY - 14 * z);
            ctx.lineTo(doorX, doorBottomY);
            ctx.stroke();
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(doorX - 1.4 * z, doorBottomY - 6 * z, 0.9 * z, 0, Math.PI * 2);
            ctx.arc(doorX + 1.4 * z, doorBottomY - 6 * z, 0.9 * z, 0, Math.PI * 2);
            ctx.fill();

            // Classical Triangular Pediment above Left Portico
            ctx.fillStyle = '#f1f5f9';
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 33 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x - 16.5 * z, pt.y - 24 * z);
            ctx.lineTo(pt.x - 2 * z, pt.y - 2 * z);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Golden Emblem Seal inside Pediment
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(pt.x - 17 * z, pt.y - 14 * z, 2.8 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();

            // 6. Right Wall Symmetrical Arched Windows (2 Tiers of 3 Crisp Windows)
            for (let r = 0; r < 2; r++) {
              [7, 17, 27].forEach((col) => {
                const wx = pt.x + col * z;
                const slopeOffset = (col / 36) * -18 * z;
                const wy = pt.y + (r === 0 ? 2 : 16) * z + slopeOffset;
                ctx.fillStyle = isNight ? '#fef08a' : '#38bdf8';
                ctx.beginPath();
                ctx.arc(wx + 3 * z, wy, 3 * z, Math.PI, 0);
                ctx.rect(wx, wy, 6 * z, 8 * z);
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 0.8 * z;
                ctx.stroke();

                // Window mullion crossbars
                ctx.beginPath();
                ctx.moveTo(wx + 3 * z, wy - 3 * z);
                ctx.lineTo(wx + 3 * z, wy + 8 * z);
                ctx.moveTo(wx, wy + 3.5 * z);
                ctx.lineTo(wx + 6 * z, wy + 3.5 * z);
                ctx.stroke();
              });
            }

            // 7. Rooftop Cornice Rim & Balustrade around Roof Deck
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.6 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 36 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 4 * z);
            ctx.lineTo(pt.x + 36 * z, pt.y - 22 * z);
            ctx.stroke();

            // 8. NEATENED CLASSICAL ROTUNDA DRUM & GOLDEN CAPITOL DOME (Kubah Balai Kota Dirapihkan)
            const domeCx = pt.x;
            const drumBaseY = pt.y - 23 * z;
            const drumTopY = pt.y - 33 * z;
            const drumRx = 18.5 * z;
            const drumRy = 8.5 * z;

            // Rotunda Drum Base Shadow on Roof Deck
            ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
            ctx.beginPath();
            ctx.ellipse(domeCx, drumBaseY + 1.5 * z, drumRx + 2 * z, drumRy + 1.2 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Cylindrical Marble Drum Body (Tambour) supporting the Dome
            const drumGrad = ctx.createLinearGradient(domeCx - drumRx, drumTopY, domeCx + drumRx, drumBaseY);
            drumGrad.addColorStop(0, '#cbd5e1');
            drumGrad.addColorStop(0.45, '#f8fafc');
            drumGrad.addColorStop(1, '#e2e8f0');
            ctx.fillStyle = drumGrad;
            ctx.beginPath();
            ctx.ellipse(domeCx, drumBaseY, drumRx, drumRy, 0, 0, Math.PI);
            ctx.lineTo(domeCx - drumRx, drumTopY);
            ctx.ellipse(domeCx, drumTopY, drumRx, drumRy * 0.85, 0, Math.PI, 0, true);
            ctx.lineTo(domeCx + drumRx, drumBaseY);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Colonnette Pilasters & Arched Windows around the Rotunda Drum
            [-13, -7.5, -2.5, 2.5, 7.5, 13].forEach((dx) => {
              const curveY = Math.sqrt(Math.max(0, 1 - (dx / 18.5) ** 2)) * (drumRy * 0.75);
              const winX = domeCx + dx * z;
              const winY = drumTopY + 2 * z + curveY;
              ctx.fillStyle = isNight ? '#fef08a' : '#0284c7';
              ctx.fillRect(winX - 1.3 * z, winY, 2.6 * z, 5.2 * z);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 0.5 * z;
              ctx.strokeRect(winX - 1.3 * z, winY, 2.6 * z, 5.2 * z);
            });

            // Smooth Symmetrical Golden Hemispherical Dome Cap
            const domeRadius = 18 * z;
            const domeGrad = ctx.createRadialGradient(
              domeCx - 6 * z,
              drumTopY - 10 * z,
              2 * z,
              domeCx,
              drumTopY - 4 * z,
              domeRadius * 1.2
            );
            domeGrad.addColorStop(0, '#fef08a');
            domeGrad.addColorStop(0.35, '#fbbf24');
            domeGrad.addColorStop(0.78, '#f59e0b');
            domeGrad.addColorStop(1, '#b45309');

            ctx.fillStyle = domeGrad;
            ctx.beginPath();
            ctx.arc(domeCx, drumTopY, domeRadius, Math.PI, 0);
            ctx.ellipse(domeCx, drumTopY, domeRadius, drumRy * 0.78, 0, 0, Math.PI);
            ctx.closePath();
            ctx.fill();

            // Neat Symmetrical Meridian Ribs on Golden Dome
            ctx.strokeStyle = 'rgba(180, 83, 9, 0.65)';
            ctx.lineWidth = 1.0 * z;
            [-12, -6, 0, 6, 12].forEach((ribOffset) => {
              const ribBaseY = drumTopY + Math.sqrt(Math.max(0, 1 - (ribOffset / 18) ** 2)) * (drumRy * 0.75);
              ctx.beginPath();
              ctx.moveTo(domeCx + ribOffset * z, ribBaseY);
              ctx.quadraticCurveTo(
                domeCx + ribOffset * 0.55 * z,
                drumTopY - domeRadius * 0.75,
                domeCx,
                drumTopY - domeRadius
              );
              ctx.stroke();
            });

            // Golden Cornice Ring Collar at Dome Base
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.ellipse(domeCx, drumTopY, drumRx, drumRy * 0.78, 0, 0, Math.PI);
            ctx.stroke();

            // Classical Lantern Cupola & Finial Spire at Apex of Dome
            const cupolaBaseY = drumTopY - domeRadius;
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(domeCx - 3.5 * z, cupolaBaseY - 5.5 * z, 7 * z, 5.5 * z);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(domeCx - 3.5 * z, cupolaBaseY - 5.5 * z, 7 * z, 5.5 * z);

            // Mini Golden Cupola Cap
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(domeCx, cupolaBaseY - 5.5 * z, 4 * z, Math.PI, 0);
            ctx.fill();

            // Straight Finial Spire & Glowing Orb
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(domeCx, cupolaBaseY - 9.5 * z);
            ctx.lineTo(domeCx, cupolaBaseY - 18 * z);
            ctx.stroke();

            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(domeCx, cupolaBaseY - 18.5 * z, 2.2 * z, 0, Math.PI * 2);
            ctx.fill();

            // Red-and-White Indonesian Flag on Front Courtyard Flagpole
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 35 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x - 35 * z, pt.y - 24 * z);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(pt.x - 34 * z, pt.y - 24 * z, 9 * z, 4 * z);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 34 * z, pt.y - 20 * z, 9 * z, 4 * z);
          } else if (b.id === 'menara_mentor') {
            // EAST: STUDIO ON AIR & MENARA MENTOR (Detailed Broadcast Media Center, Control Room & Telecom Tower)
            // 1. Two-Tiered Dark Slate & Granite Acoustic Foundation Plinth
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 37 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y + 23 * z);
            ctx.lineTo(pt.x, pt.y + 42 * z);
            ctx.lineTo(pt.x - 34 * z, pt.y + 23 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y + 19 * z);
            ctx.lineTo(pt.x, pt.y + 37 * z);
            ctx.lineTo(pt.x - 32 * z, pt.y + 19 * z);
            ctx.closePath();
            ctx.fill();

            // 2. Isometric Roof Deck with Dark Studio Slate Finish
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 35 * z);
            ctx.lineTo(pt.x + 31 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 1 * z);
            ctx.lineTo(pt.x - 31 * z, pt.y - 18 * z);
            ctx.closePath();
            ctx.fill();

            // 3. Left Shaded Wall with Acoustic Ribbed Cladding
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 30 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y + 18 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Vertical acoustic slat lines on left wall
            ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
            ctx.lineWidth = 0.7 * z;
            for (let sl = 1; sl <= 5; sl++) {
              const frac = sl / 6;
              const sx = pt.x - 30 * z * (1 - frac);
              const syTop = pt.y - 18 * z + 16 * z * frac;
              ctx.beginPath();
              ctx.moveTo(sx, syTop + 2 * z);
              ctx.lineTo(sx, syTop + 32 * z);
              ctx.stroke();
            }

            // 4. Right Sunlit Wall with Studio Paneling
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Emerald & Cyan Broadcast Fascia Ribbon along Roof Edge
            ctx.strokeStyle = '#059669';
            ctx.lineWidth = 2.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 31 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 1 * z);
            ctx.lineTo(pt.x + 31 * z, pt.y - 18 * z);
            ctx.stroke();

            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 31 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y + 1 * z);
            ctx.lineTo(pt.x + 31 * z, pt.y - 16 * z);
            ctx.stroke();

            // Two Soundproof Acoustic Vaulted Studio Domes on Roof Deck
            [-9.5, 8.5].forEach((vx) => {
              ctx.fillStyle = '#047857';
              ctx.beginPath();
              ctx.arc(pt.x + vx * z, pt.y - 18 * z, 9 * z, Math.PI, 0);
              ctx.fill();
              ctx.strokeStyle = '#34d399';
              ctx.lineWidth = 1.1 * z;
              ctx.stroke();
              ctx.strokeStyle = 'rgba(255,255,255,0.35)';
              ctx.lineWidth = 0.7 * z;
              ctx.beginPath();
              ctx.arc(pt.x + vx * z, pt.y - 18 * z, 6.2 * z, Math.PI * 1.15, -Math.PI * 0.15);
              ctx.stroke();
            });

            // Rooftop Parabolic Satellite Uplink Dish (Left Roof Corner)
            const dishX = pt.x - 19 * z;
            const dishY = pt.y - 23 * z;
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.6 * z;
            ctx.beginPath();
            ctx.moveTo(dishX, dishY + 5 * z);
            ctx.lineTo(dishX, dishY);
            ctx.stroke();
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.ellipse(dishX, dishY - 1 * z, 6.5 * z, 3.8 * z, -0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(dishX, dishY - 1 * z);
            ctx.lineTo(dishX + 3.5 * z, dishY - 4.5 * z);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(dishX + 3.5 * z, dishY - 4.5 * z, 1.1 * z, 0, Math.PI * 2);
            ctx.fill();

            // Left Facade: Control Room Panoramic Window (Showing Mixing Console & Studio Monitors)
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(pt.x - 27 * z, pt.y - 8 * z);
            ctx.lineTo(pt.x - 11 * z, pt.y + 0.5 * z);
            ctx.lineTo(pt.x - 11 * z, pt.y + 9.5 * z);
            ctx.lineTo(pt.x - 27 * z, pt.y + 1 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1 * z;
            ctx.stroke();

            // Glowing mixing desk sliders & dual waveform monitors inside window
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(pt.x - 24.5 * z, pt.y - 4 * z, 5 * z, 3.2 * z);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(pt.x - 18 * z, pt.y - 0.5 * z, 5 * z, 3.2 * z);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 25 * z, pt.y + 0.5 * z, 11 * z, 1.5 * z);

            // Studio Acoustic Entrance Portal with Condenser Mic Emblem (Left Lower Facade)
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(pt.x - 14 * z, pt.y + 15 * z, 5.2 * z, Math.PI, 0);
            ctx.rect(pt.x - 19.2 * z, pt.y + 15 * z, 10.4 * z, 12.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            ctx.strokeStyle = 'rgba(125, 211, 252, 0.6)';
            ctx.lineWidth = 0.7 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 14 * z, pt.y + 10 * z);
            ctx.lineTo(pt.x - 14 * z, pt.y + 27.5 * z);
            ctx.stroke();

            // Golden Condenser Microphone & Headphone Emblem above Studio Door
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(pt.x - 15.4 * z, pt.y + 7.5 * z, 2.8 * z, 4.5 * z, 1.4 * z);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 0.9 * z;
            ctx.beginPath();
            ctx.arc(pt.x - 14 * z, pt.y + 10.2 * z, 2.6 * z, 0, Math.PI);
            ctx.stroke();

            // Illuminated Red "● ON AIR" Lightbox Sign on Right Facade
            const neonPulse = 0.82 + Math.sin(elapsed * 5) * 0.18;
            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.roundRect(pt.x + 4 * z, pt.y - 8 * z, 22 * z, 8.5 * z, 2.5 * z);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(pt.x + 4.8 * z, pt.y - 7.2 * z, 20.4 * z, 7 * z, 2 * z);
            ctx.fill();
            ctx.strokeStyle = `rgba(254, 202, 202, ${neonPulse})`;
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.round(5.2 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('● ON AIR', pt.x + 15 * z, pt.y - 2.1 * z);

            // Animated 8-Channel Audio Spectrum Equalizer Matrix on Right Facade
            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.roundRect(pt.x + 4.5 * z, pt.y + 2.2 * z, 21 * z, 10.5 * z, 1.8 * z);
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            const eqColors = ['#10b981', '#10b981', '#34d399', '#38bdf8', '#38bdf8', '#facc15', '#f59e0b', '#ef4444'];
            for (let eq = 0; eq < 8; eq++) {
              const barH = (2.0 + Math.abs(Math.sin(elapsed * 6.5 + eq * 1.15)) * 6.8) * z;
              ctx.fillStyle = eqColors[eq];
              ctx.fillRect(pt.x + (5.8 + eq * 2.4) * z, pt.y + 11.6 * z - barH, 1.7 * z, barH);
            }

            // Acoustic Gold Foam Panel Showcase on Lower Right Wall
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pt.x + 5.5 * z, pt.y + 14.5 * z, 19 * z, 8 * z);
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.7 * z;
            ctx.strokeRect(pt.x + 5.5 * z, pt.y + 14.5 * z, 19 * z, 8 * z);
            for (let wp = 0; wp < 5; wp++) {
              ctx.fillStyle = wp % 2 === 0 ? '#f59e0b' : '#0284c7';
              ctx.beginPath();
              ctx.moveTo(pt.x + (6.5 + wp * 3.5) * z, pt.y + 21.5 * z);
              ctx.lineTo(pt.x + (8.25 + wp * 3.5) * z, pt.y + 15.8 * z);
              ctx.lineTo(pt.x + (10 + wp * 3.5) * z, pt.y + 21.5 * z);
              ctx.closePath();
              ctx.fill();
            }

            // Tall Red-and-White Broadcast Transmission Lattice Tower with Microwave Drums
            const towerX = pt.x + 36 * z;
            const towerY = pt.y + 12 * z;
            for (let tb = 1; tb <= 5; tb++) {
              const ty1 = towerY - (tb - 1) * 13 * z;
              const ty2 = towerY - tb * 13 * z;
              const w1 = (1 - (tb - 1) / 6.2) * 10.5 * z;
              const w2 = (1 - tb / 6.2) * 10.5 * z;
              ctx.strokeStyle = tb % 2 === 1 ? '#dc2626' : '#f8fafc';
              ctx.lineWidth = 2.1 * z;
              ctx.beginPath();
              ctx.moveTo(towerX - w1, ty1);
              ctx.lineTo(towerX - w2, ty2);
              ctx.moveTo(towerX + w1, ty1);
              ctx.lineTo(towerX + w2, ty2);
              ctx.stroke();

              ctx.lineWidth = 1.05 * z;
              ctx.beginPath();
              ctx.moveTo(towerX - w2, ty2);
              ctx.lineTo(towerX + w2, ty2);
              ctx.moveTo(towerX - w1, ty1);
              ctx.lineTo(towerX + w2, ty2);
              ctx.moveTo(towerX + w1, ty1);
              ctx.lineTo(towerX - w2, ty2);
              ctx.stroke();
            }

            // Microwave drum transceivers mounted on tower
            ctx.fillStyle = '#f8fafc';
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 0.9 * z;
            ctx.beginPath();
            ctx.arc(towerX - 5.5 * z, towerY - 34 * z, 2.8 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(towerX + 4.5 * z, towerY - 47 * z, 2.3 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Blinking Red Aviation Beacon & Radiating Radio Wave Rings
            const beaconIsOn = Math.floor(beaconBlink) % 2 === 0;
            const wavePhase = (elapsed * 1.4) % 1;
            ctx.strokeStyle = `rgba(56, 189, 248, ${(1 - wavePhase) * 0.65})`;
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.arc(towerX, towerY - 68 * z, (4 + wavePhase * 14) * z, 0, Math.PI * 2);
            ctx.stroke();

            if (beaconIsOn) {
              ctx.fillStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.beginPath();
              ctx.arc(towerX, towerY - 68 * z, 8 * z, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = beaconIsOn ? '#ef4444' : '#7f1d1d';
            ctx.beginPath();
            ctx.arc(towerX, towerY - 68 * z, 3.3 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (b.id === 'perpustakaan') {
            // WEST: PERPUSTAKAAN KOTA (Modern-Classical Civic Library & Knowledge Hall — NO Steeple, NO Cross)
            // 1. Stepped Granite Foundation Plinth
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(pt.x - 35 * z, pt.y + 17 * z);
            ctx.lineTo(pt.x, pt.y + 35 * z);
            ctx.lineTo(pt.x + 35 * z, pt.y + 17 * z);
            ctx.lineTo(pt.x + 35 * z, pt.y + 22 * z);
            ctx.lineTo(pt.x, pt.y + 40 * z);
            ctx.lineTo(pt.x - 35 * z, pt.y + 22 * z);
            ctx.closePath();
            ctx.fill();

            // 2. Flat Architectural Roof Deck with Skylight Reading Atrium (Horizontal Civic Profile)
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 36 * z);
            ctx.lineTo(pt.x + 33 * z, pt.y - 19 * z);
            ctx.lineTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x - 33 * z, pt.y - 19 * z);
            ctx.closePath();
            ctx.fill();

            // Inner Skylight Glass Atrium Panel on Flat Roof (Brings daylight into the reading room)
            const skyGrad = ctx.createLinearGradient(pt.x - 16 * z, pt.y - 26 * z, pt.x + 16 * z, pt.y - 12 * z);
            skyGrad.addColorStop(0, '#38bdf8');
            skyGrad.addColorStop(0.5, '#bae6fd');
            skyGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = skyGrad;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 29 * z);
            ctx.lineTo(pt.x + 19 * z, pt.y - 19 * z);
            ctx.lineTo(pt.x, pt.y - 9 * z);
            ctx.lineTo(pt.x - 19 * z, pt.y - 19 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Skylight mullion grid lines
            ctx.beginPath();
            ctx.moveTo(pt.x - 9.5 * z, pt.y - 24 * z);
            ctx.lineTo(pt.x + 9.5 * z, pt.y - 14 * z);
            ctx.moveTo(pt.x + 9.5 * z, pt.y - 24 * z);
            ctx.lineTo(pt.x - 9.5 * z, pt.y - 14 * z);
            ctx.stroke();

            // 3. Left Shaded Library Wall
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 33 * z, pt.y - 19 * z);
            ctx.lineTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.lineTo(pt.x - 33 * z, pt.y + 17 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 4. Right Sunlit Library Wall
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x + 33 * z, pt.y - 19 * z);
            ctx.lineTo(pt.x + 33 * z, pt.y + 17 * z);
            ctx.lineTo(pt.x, pt.y + 34 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 5. Horizontal Royal Blue & Gold Library Cornice Frieze Band along Top Eaves
            ctx.fillStyle = '#1d4ed8';
            ctx.beginPath();
            ctx.moveTo(pt.x - 34 * z, pt.y - 19.5 * z);
            ctx.lineTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y - 19.5 * z);
            ctx.lineTo(pt.x + 34 * z, pt.y - 15 * z);
            ctx.lineTo(pt.x, pt.y + 2.5 * z);
            ctx.lineTo(pt.x - 34 * z, pt.y - 15 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();

            // Classical Horizontal Stone Balustrade Railing along Roof Edge
            ctx.fillStyle = '#f1f5f9';
            for (let bal = -28; bal <= 28; bal += 7) {
              const balY = pt.y - 2 * z - (Math.abs(bal) / 33) * 17 * z;
              ctx.fillRect(pt.x + (bal - 1) * z, balY - 4 * z, 2 * z, 3.2 * z);
            }

            // 6. Prominent Open-Book Architectural Monument Emblem on Front Parapet (Symbol of Perpustakaan)
            const bookCx = pt.x;
            const bookCy = pt.y - 5.5 * z;
            // Golden pedestal plate behind open book
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.roundRect(bookCx - 10 * z, bookCy - 6 * z, 20 * z, 10 * z, 2.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            // Left & Right Open Book Pages
            ctx.fillStyle = '#fefce8';
            ctx.beginPath();
            ctx.moveTo(bookCx, bookCy - 3.5 * z);
            ctx.quadraticCurveTo(bookCx - 4 * z, bookCy - 5 * z, bookCx - 7.5 * z, bookCy - 3.2 * z);
            ctx.lineTo(bookCx - 7.5 * z, bookCy + 2.2 * z);
            ctx.quadraticCurveTo(bookCx - 4 * z, bookCy + 0.8 * z, bookCx, bookCy + 2.5 * z);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(bookCx, bookCy - 3.5 * z);
            ctx.quadraticCurveTo(bookCx + 4 * z, bookCy - 5 * z, bookCx + 7.5 * z, bookCy - 3.2 * z);
            ctx.lineTo(bookCx + 7.5 * z, bookCy + 2.2 * z);
            ctx.quadraticCurveTo(bookCx + 4 * z, bookCy + 0.8 * z, bookCx, bookCy + 2.5 * z);
            ctx.closePath();
            ctx.fill();

            // Book spine & text lines
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(bookCx, bookCy - 3.5 * z);
            ctx.lineTo(bookCx, bookCy + 2.5 * z);
            ctx.stroke();

            // 7. Panoramic Library Reading Room Windows with Visible Colorful Bookshelves
            const spineColors = ['#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'];
            [-25, -16].forEach((c, idx) => {
              const wx = pt.x + c * z;
              const slopeY = ((c + 33) / 33) * 17 * z;
              const wy = pt.y - 10 * z + slopeY;
              ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
              ctx.fillRect(wx, wy, 6.5 * z, 14 * z);
              // Wooden shelves & colorful book spines inside window
              for (let sh = 0; sh < 3; sh++) {
                const sy = wy + (3.5 + sh * 4.2) * z;
                ctx.fillStyle = '#78350f';
                ctx.fillRect(wx + 0.5 * z, sy, 5.5 * z, 0.8 * z);
                for (let bk = 0; bk < 3; bk++) {
                  ctx.fillStyle = spineColors[(idx + sh + bk) % spineColors.length];
                  ctx.fillRect(wx + (1 + bk * 1.6) * z, sy - 2.6 * z, 1.3 * z, 2.6 * z);
                }
              }
              ctx.strokeStyle = '#1d4ed8';
              ctx.lineWidth = 0.9 * z;
              ctx.strokeRect(wx, wy, 6.5 * z, 14 * z);
            });

            [9, 19].forEach((c, idx) => {
              const wx = pt.x + c * z;
              const slopeY = (c / 33) * -17 * z;
              const wy = pt.y + 6 * z + slopeY;
              ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
              ctx.fillRect(wx, wy, 6.5 * z, 14 * z);
              for (let sh = 0; sh < 3; sh++) {
                const sy = wy + (3.5 + sh * 4.2) * z;
                ctx.fillStyle = '#78350f';
                ctx.fillRect(wx + 0.5 * z, sy, 5.5 * z, 0.8 * z);
                for (let bk = 0; bk < 3; bk++) {
                  ctx.fillStyle = spineColors[(idx + sh + bk + 2) % spineColors.length];
                  ctx.fillRect(wx + (1 + bk * 1.6) * z, sy - 2.6 * z, 1.3 * z, 2.6 * z);
                }
              }
              ctx.strokeStyle = '#1d4ed8';
              ctx.lineWidth = 0.9 * z;
              ctx.strokeRect(wx, wy, 6.5 * z, 14 * z);
            });

            // 8. Grand Library Entrance Portico on Front Corner with Warm Oak Doors & Book Return Box
            ctx.fillStyle = '#1e40af';
            ctx.fillRect(pt.x - 7.5 * z, pt.y + 15 * z, 15 * z, 3.5 * z);
            ctx.fillStyle = '#78350f';
            ctx.fillRect(pt.x - 5.5 * z, pt.y + 18.5 * z, 11 * z, 13 * z);
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(pt.x - 5.5 * z, pt.y + 18.5 * z, 11 * z, 13 * z);

            // Book return dropbox & landscaped planters
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(pt.x + 7.5 * z, pt.y + 23 * z, 4 * z, 7.5 * z);
            ctx.fillStyle = '#e0f2fe';
            ctx.fillRect(pt.x + 8.2 * z, pt.y + 24.5 * z, 2.6 * z, 1.1 * z);
          } else if (b.id === 'pasar_prestasi') {
            // SOUTH-WEST: TOKO POIN (PASAR PRESTASI - Detailed Grand Boutique Emporium, Trophy Gallery & Reward Kiosk)
            // 1. Two-Tiered Cream Marble & Gold Trim Foundation Plinth
            ctx.fillStyle = '#78716c';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x, pt.y + 35 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y + 18 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y + 23 * z);
            ctx.lineTo(pt.x, pt.y + 40 * z);
            ctx.lineTo(pt.x - 32 * z, pt.y + 23 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#d6d3d1';
            ctx.beginPath();
            ctx.moveTo(pt.x - 30 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 32 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y + 19 * z);
            ctx.lineTo(pt.x, pt.y + 35 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y + 19 * z);
            ctx.closePath();
            ctx.fill();

            // 2. Isometric Terracotta & Gold Roof Deck with Skylight Lantern
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 33 * z);
            ctx.lineTo(pt.x + 29 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 3 * z);
            ctx.lineTo(pt.x - 29 * z, pt.y - 18 * z);
            ctx.closePath();
            ctx.fill();

            // Inner Skylight Glass Atrium on Roof
            ctx.fillStyle = isNight ? '#fde047' : '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 26 * z);
            ctx.lineTo(pt.x + 14 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 10 * z);
            ctx.lineTo(pt.x - 14 * z, pt.y - 18 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            // 3. Left Shaded Boutique Wall
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 4 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.lineTo(pt.x - 28 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 4. Right Sunlit Boutique Wall with Warm Cream Finish
            ctx.fillStyle = '#fffbeb';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 4 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 30 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fde68a';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Decorative Gold Corner Columns / Pilasters
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 28 * z, pt.y - 18 * z, 2.2 * z, 34 * z);
            ctx.fillRect(pt.x - 1.1 * z, pt.y - 4 * z, 2.2 * z, 34 * z);
            ctx.fillRect(pt.x + 25.8 * z, pt.y - 18 * z, 2.2 * z, 34 * z);

            // Golden Crown Parapet Molding & Warm String Lights along Roof Edge
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2.6 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 29 * z, pt.y - 18 * z);
            ctx.lineTo(pt.x, pt.y - 3 * z);
            ctx.lineTo(pt.x + 29 * z, pt.y - 18 * z);
            ctx.stroke();

            for (let bl = -24; bl <= 24; bl += 6) {
              const by = pt.y - 3 * z - (Math.abs(bl) / 28) * 14 * z + 1.8 * z;
              ctx.fillStyle = isNight ? '#fef08a' : '#fbbf24';
              ctx.beginPath();
              ctx.arc(pt.x + bl * z, by, 1.1 * z, 0, Math.PI * 2);
              ctx.fill();
            }

            // Festive Red, Gold & White Striped Boutique Awning Across Both Facades
            const awnW = 50 * z;
            for (let a = 0; a < 10; a++) {
              ctx.fillStyle = a % 2 === 0 ? '#dc2626' : '#fffbeb';
              const ax = pt.x - 25 * z + a * (awnW / 10);
              ctx.fillRect(ax, pt.y + 2.5 * z, awnW / 10, 7.5 * z);
              ctx.beginPath();
              ctx.arc(ax + awnW / 20, pt.y + 10 * z, awnW / 20, 0, Math.PI);
              ctx.fill();
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(ax + awnW / 20, pt.y + 11.2 * z, 0.7 * z, 0, Math.PI * 2);
              ctx.fill();
            }

            // Left Facade: Grand Trophy & Gift Box Display Window
            ctx.fillStyle = isNight ? '#fef9c3' : '#e0f2fe';
            ctx.beginPath();
            ctx.roundRect(pt.x - 24.5 * z, pt.y + 12.5 * z, 20.5 * z, 12.5 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();

            // Velvet Display Pedestal + Golden Cup Trophy + Silver Medal + Wrapped Gift Box
            ctx.fillStyle = '#991b1b';
            ctx.fillRect(pt.x - 22.5 * z, pt.y + 21.5 * z, 16.5 * z, 3 * z);
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(pt.x - 14.5 * z, pt.y + 17.2 * z, 2.8 * z, 0, Math.PI);
            ctx.rect(pt.x - 15.3 * z, pt.y + 19.2 * z, 1.6 * z, 2.3 * z);
            ctx.fill();
            ctx.fillStyle = '#2563eb';
            ctx.fillRect(pt.x - 21.5 * z, pt.y + 18 * z, 4 * z, 3.5 * z);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(pt.x - 19.9 * z, pt.y + 18 * z, 0.9 * z, 3.5 * z);
            ctx.fillRect(pt.x - 21.5 * z, pt.y + 19.3 * z, 4 * z, 0.8 * z);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(pt.x - 8.5 * z, pt.y + 18.5 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Right Facade: Ornate Boutique Entrance Door with Red VIP Carpet
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(pt.x + 2.5 * z, pt.y + 12.5 * z, 11 * z, 14.5 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();
            ctx.fillStyle = isNight ? 'rgba(254, 240, 138, 0.35)' : 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(pt.x + 3.8 * z, pt.y + 14 * z, 3.8 * z, 11 * z);
            ctx.fillRect(pt.x + 8.4 * z, pt.y + 14 * z, 3.8 * z, 11 * z);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(pt.x + 7.2 * z, pt.y + 19 * z, 1.6 * z, 2.2 * z);

            ctx.fillStyle = '#dc2626';
            ctx.fillRect(pt.x + 2.5 * z, pt.y + 27 * z, 11 * z, 3.5 * z);
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 0.7 * z;
            ctx.strokeRect(pt.x + 2.5 * z, pt.y + 27 * z, 11 * z, 3.5 * z);

            // Digital "POIN EXPRESS" Reward Exchange Kiosk Cabinet on Right Side
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.roundRect(pt.x + 15.5 * z, pt.y + 12.5 * z, 9.5 * z, 12.5 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(pt.x + 17 * z, pt.y + 14.2 * z, 6.5 * z, 4.5 * z);
            ctx.fillStyle = '#facc15';
            ctx.font = `bold ${Math.max(3, Math.round(3.2 * z))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('★ XP', pt.x + 20.2 * z, pt.y + 17.5 * z);
            ctx.fillStyle = '#10b981';
            ctx.fillRect(pt.x + 17.5 * z, pt.y + 20.2 * z, 5.5 * z, 2 * z);

            // Rooftop Rotating 3D Golden Star Coin & Trophy Medallion Crest
            const coinPulse = Math.max(0.25, Math.abs(Math.cos(elapsed * 2.2)));
            ctx.fillStyle = '#b45309';
            ctx.fillRect(pt.x - 5 * z, pt.y - 10 * z, 10 * z, 3 * z);
            ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 17 * z, 9 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 17 * z, 7 * z * coinPulse, 7 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();
            if (coinPulse > 0.45) {
              ctx.fillStyle = '#92400e';
              ctx.font = `bold ${Math.round(6.5 * z)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('★', pt.x, pt.y - 17 * z);
            }
          } else if (b.id === 'bengkel_latihan') {
            // SOUTH-EAST: LAB DKV & TEFA (Modern Creative Design Studio, Sawtooth Skylight & Glass Control Tower)
            // 1. Concrete Studio Base Plinth
            ctx.fillStyle = '#64748b';
            ctx.fillRect(pt.x - 31 * z, pt.y + 17 * z, 62 * z, 4 * z);

            // 2. Main Creative Studio Body with Crisp Architectural Panels
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(pt.x - 30 * z, pt.y - 12 * z, 42 * z, 30 * z);
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.9 * z;
            ctx.strokeRect(pt.x - 30 * z, pt.y - 12 * z, 42 * z, 30 * z);

            // Blue top roof fascia & sawtooth North-Light studio skylights
            ctx.fillStyle = '#1d4ed8';
            ctx.fillRect(pt.x - 30 * z, pt.y - 18 * z, 42 * z, 6 * z);

            for (let st = -28; st <= 2; st += 10) {
              ctx.fillStyle = '#1e40af';
              ctx.beginPath();
              ctx.moveTo(pt.x + st * z, pt.y - 18 * z);
              ctx.lineTo(pt.x + (st + 8) * z, pt.y - 25 * z);
              ctx.lineTo(pt.x + (st + 8) * z, pt.y - 18 * z);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#7dd3fc';
              ctx.lineWidth = 1.2 * z;
              ctx.beginPath();
              ctx.moveTo(pt.x + (st + 2) * z, pt.y - 19.5 * z);
              ctx.lineTo(pt.x + (st + 7.5) * z, pt.y - 24 * z);
              ctx.stroke();
            }

            // Digital LED Studio Sign ("LAB DKV • TEFA")
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(pt.x - 26 * z, pt.y - 10 * z, 28 * z, 6 * z, 2 * z);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            ctx.fillStyle = '#38bdf8';
            ctx.font = `bold ${Math.max(4, Math.round(3.8 * z))}px monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LAB DKV • TEFA', pt.x - 12 * z, pt.y - 7 * z);

            // Industrial Roll-up Studio Bay Door & Glass Creative Window
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 26 * z, pt.y + 1 * z, 22 * z, 16 * z);
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 0.9 * z;
            ctx.strokeRect(pt.x - 26 * z, pt.y + 1 * z, 22 * z, 16 * z);
            for (let hz = 1; hz < 5; hz++) {
              ctx.beginPath();
              ctx.moveTo(pt.x - 26 * z, pt.y + (1 + hz * 3.2) * z);
              ctx.lineTo(pt.x - 4 * z, pt.y + (1 + hz * 3.2) * z);
              ctx.stroke();
            }

            // Cylindrical Glass Control & Render Tower with Blue Dome
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(pt.x + 12 * z, pt.y - 24 * z, 17 * z, 42 * z);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(pt.x + 12 * z, pt.y - 24 * z, 17 * z, 42 * z);

            ctx.fillStyle = isNight ? '#fde047' : '#38bdf8';
            ctx.fillRect(pt.x + 13.5 * z, pt.y - 19 * z, 14 * z, 7.5 * z);
            ctx.fillRect(pt.x + 13.5 * z, pt.y - 8 * z, 14 * z, 7.5 * z);
            ctx.fillRect(pt.x + 13.5 * z, pt.y + 3 * z, 14 * z, 7.5 * z);

            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(pt.x + 20.5 * z, pt.y - 24 * z, 8.5 * z, Math.PI, 0);
            ctx.fill();

            // Rotating radar dish on tower
            const dishAngle = elapsed * 2;
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 20.5 * z, pt.y - 32.5 * z);
            ctx.lineTo(pt.x + 20.5 * z, pt.y - 41 * z);
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(pt.x + 20.5 * z, pt.y - 41 * z, 5.5 * z, 2.2 * z, dishAngle, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (b.id === 'kantor_pos') {
            // NORTH-EAST: KANTOR POS KILAT (Detailed Express Post Office, Clock Gable, Sorting Bay & Courier Hub)
            // 1. Stepped Stone Foundation Plinth
            ctx.fillStyle = '#64748b';
            ctx.beginPath();
            ctx.moveTo(pt.x - 29 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 32 * z);
            ctx.lineTo(pt.x + 29 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x + 29 * z, pt.y + 20 * z);
            ctx.lineTo(pt.x, pt.y + 36 * z);
            ctx.lineTo(pt.x - 29 * z, pt.y + 20 * z);
            ctx.closePath();
            ctx.fill();

            // 2. Left Shaded Wall with Classic Postal Quoins
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 27 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x, pt.y + 31 * z);
            ctx.lineTo(pt.x - 27 * z, pt.y + 16 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 3. Right Sunlit Wall
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 2 * z);
            ctx.lineTo(pt.x + 27 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x + 27 * z, pt.y + 16 * z);
            ctx.lineTo(pt.x, pt.y + 31 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Brick Corner Quoins along Left, Center, and Right Edges
            for (let q = 0; q < 5; q++) {
              ctx.fillStyle = q % 2 === 0 ? '#dc2626' : '#f59e0b';
              ctx.fillRect(pt.x - 27 * z, pt.y + (-12 + q * 5.2) * z, 2.2 * z, 2.4 * z);
              ctx.fillRect(pt.x - 1.1 * z, pt.y + (2 + q * 5.2) * z, 2.2 * z, 2.4 * z);
              ctx.fillRect(pt.x + 24.8 * z, pt.y + (-12 + q * 5.2) * z, 2.2 * z, 2.4 * z);
            }

            // 4. Pitched Crimson Postal Roof with Shingle Texture & Overhanging Gold Eaves
            ctx.fillStyle = '#b91c1c';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 34 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y - 16 * z);
            ctx.lineTo(pt.x, pt.y - 1 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y - 16 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.4 * z;
            ctx.stroke();

            // Subtle roof tile ridges
            ctx.strokeStyle = 'rgba(127, 29, 29, 0.45)';
            ctx.lineWidth = 0.7 * z;
            for (let rt = 1; rt <= 3; rt++) {
              const rOff = rt * 4.2 * z;
              ctx.beginPath();
              ctx.moveTo(pt.x - (28 - rt * 5) * z, pt.y - 16 * z - rOff * 0.35);
              ctx.lineTo(pt.x, pt.y - 2 * z - rOff);
              ctx.lineTo(pt.x + (28 - rt * 5) * z, pt.y - 16 * z - rOff * 0.35);
              ctx.stroke();
            }

            // Rooftop Dispatch Radio Antenna & Weather Vane
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 34 * z);
            ctx.lineTo(pt.x, pt.y - 44 * z);
            ctx.moveTo(pt.x - 4 * z, pt.y - 40 * z);
            ctx.lineTo(pt.x + 4 * z, pt.y - 40 * z);
            ctx.stroke();
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 44.5 * z, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();

            // Classic International Airmail Red-White-Blue Stripe Band
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 27 * z, pt.y - 3.5 * z);
            ctx.lineTo(pt.x, pt.y + 10 * z);
            ctx.lineTo(pt.x + 27 * z, pt.y - 3.5 * z);
            ctx.stroke();

            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 27 * z, pt.y - 1 * z);
            ctx.lineTo(pt.x, pt.y + 12.5 * z);
            ctx.lineTo(pt.x + 27 * z, pt.y - 1 * z);
            ctx.stroke();

            // Ornate Town Post Clock Gable & Winged Envelope Signboard ("POS KILAT")
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 15.5 * z, 6.8 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 15.5 * z, 5.4 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.3 * z;
            ctx.stroke();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 0.9 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 15.5 * z);
            ctx.lineTo(pt.x + 2.8 * z, pt.y - 15.5 * z);
            ctx.moveTo(pt.x, pt.y - 15.5 * z);
            ctx.lineTo(pt.x, pt.y - 18.8 * z);
            ctx.stroke();

            // Winged Envelope "POS KILAT" Sign Banner below Clock
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(pt.x - 11.5 * z, pt.y - 8 * z, 23 * z, 5.2 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(3.5, Math.round(3.6 * z))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('✉ POS KILAT', pt.x, pt.y - 4.3 * z);

            // Left Facade: Express Service Counter Window with Wooden Ledge
            ctx.fillStyle = isNight ? '#fef08a' : '#38bdf8';
            ctx.beginPath();
            ctx.roundRect(pt.x - 23 * z, pt.y + 5 * z, 14 * z, 9.5 * z, 1.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pt.x - 16 * z, pt.y + 5 * z);
            ctx.lineTo(pt.x - 16 * z, pt.y + 14.5 * z);
            ctx.stroke();
            ctx.fillStyle = '#b45309';
            ctx.fillRect(pt.x - 24 * z, pt.y + 14 * z, 16 * z, 1.8 * z);

            // Center Entrance Door with Golden Mail Slot
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.5 * z, pt.y + 14.5 * z, 9.5 * z, 14 * z, 1.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
            ctx.fillStyle = '#facc15';
            ctx.fillRect(pt.x - 3 * z, pt.y + 21 * z, 4.5 * z, 1.2 * z);

            // Right Facade: Express Parcel Sorting Bay, Stacked Cardboard Packages & Classic Red Pillar Postbox
            ctx.fillStyle = '#334155';
            ctx.fillRect(pt.x + 6 * z, pt.y + 8 * z, 10 * z, 12 * z);
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(pt.x + 6 * z, pt.y + 8 * z, 10 * z, 12 * z);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(pt.x + 7 * z, pt.y + 15 * z, 4.2 * z, 4.2 * z);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x + 11.4 * z, pt.y + 16 * z, 3.8 * z, 3.2 * z);
            ctx.fillStyle = '#fde68a';
            ctx.fillRect(pt.x + 8.5 * z, pt.y + 11.8 * z, 4 * z, 3.2 * z);

            // Iconic Red Pillar Postbox with Crown Cap & Letter Slot
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(pt.x + 18 * z, pt.y + 12.5 * z, 6.8 * z, 12.5 * z, 2.8 * z);
            ctx.fill();
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x + 19.2 * z, pt.y + 15.2 * z, 4.4 * z, 1.3 * z);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(pt.x + 19.5 * z, pt.y + 18 * z, 3.8 * z, 2.2 * z);

            // Parked Orange "Pos Kilat" Courier Delivery Scooter in Front Right
            const scX = pt.x + 13 * z;
            const scY = pt.y + 27.5 * z;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(scX - 3.5 * z, scY + 1.5 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.arc(scX + 3.5 * z, scY + 1.5 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(scX - 4 * z, scY - 2 * z, 7.5 * z, 3.5 * z, 1.2 * z);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(scX - 5.2 * z, scY - 5.8 * z, 4.5 * z, 4 * z);
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 0.6 * z;
            ctx.strokeRect(scX - 5.2 * z, scY - 5.8 * z, 4.5 * z, 4 * z);
          } else if (b.id === 'taman_refleksi') {
            // NORTH-WEST: PUSAT REFLEKSI (Monumental Rotating "Vintage Desk Globe" / Bola Dunia Meja Antik yang Berputar)
            const globeCx = pt.x;
            const globeCy = pt.y - 25 * z;
            const globeR = 19.5 * z;
            const tiltAngle = -0.36; // ~21 deg classic axial tilt

            // 1. Stepped Antique Walnut & Brass Circular Plaza Plinth on Ground
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 4 * z, 26 * z, 14 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1.5 * z, 24 * z, 12.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            // Inner parchment/travertine compass medallion floor
            ctx.fillStyle = isNight ? '#1e293b' : '#fef3c7';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 0.5 * z, 19 * z, 10 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 2. Turned Antique Mahogany Desk-Globe Pedestal Base (Kaki Meja Kayu Bubut Antik)
            // Tier 1: Wide molded mahogany foot
            const standGrad = ctx.createLinearGradient(pt.x - 14 * z, pt.y, pt.x + 14 * z, pt.y);
            standGrad.addColorStop(0, '#451a03');
            standGrad.addColorStop(0.45, '#9a3412');
            standGrad.addColorStop(0.7, '#78350f');
            standGrad.addColorStop(1, '#271103');
            ctx.fillStyle = standGrad;
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 0.5 * z, 13.5 * z, 7.2 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Tier 2: Stepped walnut riser ring
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 2.2 * z, 9.8 * z, 5.2 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();

            // Turned Central Baluster Column (Tiang Penyangga Bola Dunia)
            ctx.fillStyle = standGrad;
            ctx.beginPath();
            ctx.moveTo(pt.x - 4.2 * z, pt.y - 2 * z);
            ctx.quadraticCurveTo(pt.x - 2.2 * z, pt.y - 6 * z, pt.x - 3.2 * z, pt.y - 10 * z);
            ctx.lineTo(pt.x + 3.2 * z, pt.y - 10 * z);
            ctx.quadraticCurveTo(pt.x + 2.2 * z, pt.y - 6 * z, pt.x + 4.2 * z, pt.y - 2 * z);
            ctx.closePath();
            ctx.fill();

            // Polished Brass Pedestal Collar Ring
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 6.2 * z, 3.8 * z, 1.9 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Back half of Horizontal Wooden & Brass Horizon Ring (Cincin Ekuator Penyangga)
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 2.6 * z;
            ctx.beginPath();
            ctx.ellipse(globeCx, globeCy, globeR + 4.2 * z, (globeR + 4.2 * z) * 0.34, 0, Math.PI, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();

            // 3. ROTATING VINTAGE PARCHMENT & SEPIA-OCEAN GLOBE SPHERE
            ctx.save();
            ctx.beginPath();
            ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
            ctx.closePath();

            // Warm Vintage Parchment / Sepia-Teal Ocean Base Gradient
            const oceanGrad = ctx.createRadialGradient(
              globeCx - 6 * z,
              globeCy - 7 * z,
              2 * z,
              globeCx,
              globeCy,
              globeR
            );
            oceanGrad.addColorStop(0, '#fef9c3');
            oceanGrad.addColorStop(0.35, '#fde68a');
            oceanGrad.addColorStop(0.72, '#eab308');
            oceanGrad.addColorStop(1, '#a16207');
            ctx.fillStyle = oceanGrad;
            ctx.fill();

            // Clip all rotating continents & graticule lines strictly inside the sphere
            ctx.clip();

            // Rotate coordinate space to match the globe's 21-degree axial tilt
            ctx.translate(globeCx, globeCy);
            ctx.rotate(tiltAngle);

            // 3A. Animated Rotating Vintage Continents (Seamless Horizontal Wrap)
            const wrapSpan = globeR * 2.4;
            const spinShift = (elapsed * 13 * z) % wrapSpan;

            for (let repeat = -1; repeat <= 1; repeat++) {
              const baseX = repeat * wrapSpan + spinShift - globeR * 1.2;

              // Continent Group 1: Vintage Eurasia & Nusantara Archipelago
              ctx.fillStyle = 'rgba(180, 83, 9, 0.72)';
              ctx.strokeStyle = 'rgba(120, 53, 15, 0.85)';
              ctx.lineWidth = 0.7 * z;
              ctx.beginPath();
              ctx.moveTo(baseX - 6 * z, -9 * z);
              ctx.bezierCurveTo(baseX + 2 * z, -13 * z, baseX + 12 * z, -11 * z, baseX + 14 * z, -4 * z);
              ctx.bezierCurveTo(baseX + 11 * z, 1 * z, baseX + 4 * z, 2 * z, baseX - 2 * z, -1 * z);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Nusantara islands chain near equator
              ctx.fillStyle = 'rgba(101, 163, 13, 0.75)';
              ctx.beginPath();
              ctx.ellipse(baseX + 10 * z, 2.5 * z, 3.2 * z, 1.3 * z, 0.2, 0, Math.PI * 2);
              ctx.ellipse(baseX + 14.5 * z, 3.2 * z, 2.2 * z, 1.1 * z, -0.1, 0, Math.PI * 2);
              ctx.fill();

              // Continent Group 2: Vintage Africa Silhouette
              ctx.fillStyle = 'rgba(161, 98, 7, 0.72)';
              ctx.beginPath();
              ctx.moveTo(baseX - 5 * z, 0 * z);
              ctx.bezierCurveTo(baseX + 1 * z, -1 * z, baseX + 3 * z, 5 * z, baseX - 1 * z, 11 * z);
              ctx.bezierCurveTo(baseX - 5 * z, 10 * z, baseX - 7 * z, 4 * z, baseX - 5 * z, 0 * z);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Continent Group 3: Vintage Americas (North & South)
              ctx.fillStyle = 'rgba(154, 52, 18, 0.68)';
              ctx.beginPath();
              ctx.moveTo(baseX + 21 * z, -11 * z);
              ctx.bezierCurveTo(baseX + 27 * z, -9 * z, baseX + 26 * z, -2 * z, baseX + 22 * z, -1 * z);
              ctx.bezierCurveTo(baseX + 18 * z, -3 * z, baseX + 18 * z, -8 * z, baseX + 21 * z, -11 * z);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              ctx.beginPath();
              ctx.moveTo(baseX + 23 * z, 1 * z);
              ctx.bezierCurveTo(baseX + 27 * z, 4 * z, baseX + 25 * z, 11 * z, baseX + 22 * z, 13 * z);
              ctx.bezierCurveTo(baseX + 19 * z, 9 * z, baseX + 20 * z, 3 * z, baseX + 23 * z, 1 * z);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();

              // Continent Group 4: Vintage Terra Australis
              ctx.fillStyle = 'rgba(180, 83, 9, 0.7)';
              ctx.beginPath();
              ctx.ellipse(baseX + 13 * z, 9 * z, 4.2 * z, 2.5 * z, -0.15, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }

            // 3B. Animated 3D Rotating Longitude Meridians (Garis Bujur Berputar)
            ctx.strokeStyle = 'rgba(120, 53, 15, 0.36)';
            ctx.lineWidth = 0.75 * z;
            const numMeridians = 5;
            for (let m = 0; m < numMeridians; m++) {
              const mProg = ((elapsed * 0.45 + m / numMeridians) % 1.0);
              // Map [0..1] to [-1..1] using cosine for authentic spherical perspective compression at edges
              const nx = -Math.cos(mProg * Math.PI);
              const rx = Math.abs(nx) * globeR;
              ctx.beginPath();
              ctx.ellipse(
                0,
                0,
                Math.max(0.6 * z, rx),
                globeR,
                0,
                nx >= 0 ? -Math.PI / 2 : Math.PI / 2,
                nx >= 0 ? Math.PI / 2 : (Math.PI * 3) / 2
              );
              ctx.stroke();
            }

            // 3C. Latitude Parallels (Garis Lintang & Garis Khatulistiwa)
            [-0.6, -0.3, 0.3, 0.6].forEach((latFrac) => {
              const ly = latFrac * globeR;
              const halfChord = Math.sqrt(Math.max(0, 1 - latFrac * latFrac)) * globeR;
              ctx.beginPath();
              ctx.moveTo(-halfChord, ly);
              ctx.quadraticCurveTo(0, ly + 2.2 * z, halfChord, ly);
              ctx.stroke();
            });

            // Prominent Crimson & Gold Equatorial Band (Garis Khatulistiwa)
            ctx.strokeStyle = 'rgba(185, 28, 28, 0.78)';
            ctx.lineWidth = 1.3 * z;
            ctx.beginPath();
            ctx.moveTo(-globeR, 0);
            ctx.quadraticCurveTo(0, 2.8 * z, globeR, 0);
            ctx.stroke();

            // Tilted Ecliptic Line with Vintage Graduations
            ctx.strokeStyle = 'rgba(146, 64, 14, 0.55)';
            ctx.lineWidth = 0.9 * z;
            ctx.setLineDash([2 * z, 1.5 * z]);
            ctx.beginPath();
            ctx.moveTo(-globeR, 6 * z);
            ctx.lineTo(globeR, -6 * z);
            ctx.stroke();
            ctx.setLineDash([]);

            // 3D Inner Spherical Shading & Specular Lacquer Shine
            ctx.rotate(-tiltAngle);
            const shadeGrad = ctx.createRadialGradient(
              -globeR * 0.35,
              -globeR * 0.35,
              globeR * 0.1,
              0,
              0,
              globeR
            );
            shadeGrad.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
            shadeGrad.addColorStop(0.25, 'rgba(255, 255, 255, 0.12)');
            shadeGrad.addColorStop(0.7, 'rgba(69, 26, 3, 0)');
            shadeGrad.addColorStop(1, 'rgba(69, 26, 3, 0.48)');
            ctx.fillStyle = shadeGrad;
            ctx.beginPath();
            ctx.arc(0, 0, globeR, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            // Outer Antique Bronze Rim of the Globe Sphere
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.arc(globeCx, globeCy, globeR, 0, Math.PI * 2);
            ctx.stroke();

            // 4. FRONT HALF OF HORIZONTAL WOOD & BRASS HORIZON RING
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 3.0 * z;
            ctx.beginPath();
            ctx.ellipse(globeCx, globeCy, globeR + 4.2 * z, (globeR + 4.2 * z) * 0.34, 0, 0, Math.PI);
            ctx.stroke();
            ctx.strokeStyle = '#fcd34d';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();

            // 5. HEAVY BURNISHED BRASS MERIDIAN ARC RING & POLAR FINIALS (Busur Kuningan Derajat)
            ctx.save();
            ctx.translate(globeCx, globeCy);
            ctx.rotate(tiltAngle);

            // Curved Brass Support Arm connecting South Pole to Pedestal Stem
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2.8 * z;
            ctx.beginPath();
            ctx.arc(0, 0, globeR + 2.5 * z, -Math.PI / 2, Math.PI / 2 + 0.35);
            ctx.stroke();

            // Bright Gold Highlight on Brass Meridian Ring
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.arc(0, 0, globeR + 2.5 * z, -Math.PI / 2, Math.PI / 2 + 0.35);
            ctx.stroke();

            // Degree Tick Marks along the Brass Meridian Arc
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 0.7 * z;
            for (let deg = -75; deg <= 90; deg += 15) {
              const rad = (deg * Math.PI) / 180;
              const rIn = globeR + 1.4 * z;
              const rOut = globeR + 3.6 * z;
              ctx.beginPath();
              ctx.moveTo(Math.cos(rad) * rIn, Math.sin(rad) * rIn);
              ctx.lineTo(Math.cos(rad) * rOut, Math.sin(rad) * rOut);
              ctx.stroke();
            }

            // North & South Pole Brass Axis Spindles
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(0, -globeR);
            ctx.lineTo(0, -(globeR + 6.5 * z));
            ctx.moveTo(0, globeR);
            ctx.lineTo(0, globeR + 3.5 * z);
            ctx.stroke();

            // Ornate Brass Finial Knob at North Pole Apex
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(0, -(globeR + 7.2 * z), 2.5 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            ctx.restore();
          }

          // Floating Building Label ONLY when touched, hovered or active
          const shouldShowLabel = isHovered || activeBuilding === b.id || lastTouchedIdRef.current === b.id;
          if (shouldShowLabel) {
            const tagY = pt.y - (b.id === 'balai_kota' ? 88 : b.id === 'menara_mentor' ? 64 : b.id === 'taman_refleksi' ? 62 : 54) * z;
            const labelText = `${b.icon} ${b.name}`;
            ctx.font = `bold ${Math.round(10 * z)}px sans-serif`;
            const tMetrics = ctx.measureText(labelText);
            const tagW = tMetrics.width + 16 * z;
            const tagH = 20 * z;

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(pt.x - tagW / 2, tagY - tagH / 2, tagW, tagH, 10 * z);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, pt.x, tagY);
          }
          ctx.restore();
        } else if (item.type === 'cafe') {
          // SOUTH: TOKO ROTI & KAFE WARGA (Enriched Bakery & Espresso Stall)
          const pt = toScreen(cafeWx, cafeWy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          const cafeDistToPlayer = Math.hypot(player.wx - cafeWx, player.wy - cafeWy);
          const isCafeTransparent = cafeDistToPlayer < 2.0;
          ctx.save();
          if (isCafeTransparent) {
            ctx.globalAlpha = 0.45;
          }

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

          // Floating Pill Badge above Toko Roti awning ONLY when touched/opened
          const isCafeTouched = lastTouchedIdRef.current === 'cafe' || isCafeMenuOpen;
          if (isCafeTouched) {
            const trBadgeY = pt.y - 38 * z;
            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            const trLabel = '🥐 Toko Roti & Kafe';
            ctx.font = `bold ${Math.round(9.5 * z)}px sans-serif`;
            const trMetrics = ctx.measureText(trLabel);
            const trW = trMetrics.width + 16 * z;
            const trH = 19 * z;
            ctx.beginPath();
            ctx.roundRect(pt.x - trW / 2, trBadgeY - trH / 2, trW, trH, 9.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();
            ctx.fillStyle = '#fef3c7';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(trLabel, pt.x, trBadgeY);
            ctx.restore();
          }

          // Signboard "TOKO ROTI & KAFE" on front counter
          ctx.fillStyle = '#fef3c7';
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1 * z;
          ctx.beginPath();
          ctx.roundRect(pt.x - 20 * z, pt.y - 2 * z, 40 * z, 8 * z, 2 * z);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#92400e';
          ctx.font = `bold ${Math.round(5.5 * z)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☕ TOKO ROTI & KAFE 🥐', pt.x, pt.y + 2.5 * z);

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

          // Woven bistro chair tucked beside the table
          ctx.fillStyle = '#92400e';
          ctx.fillRect(tableX + 9 * z, tableY - 4 * z, 5 * z, 4 * z); // seat
          ctx.fillRect(tableX + 12 * z, tableY - 11 * z, 2 * z, 8 * z); // backrest
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 0.8 * z;
          ctx.strokeRect(tableX + 9 * z, tableY - 4 * z, 5 * z, 4 * z);

          // A-Frame Chalkboard Easel Menu beside Cafe
          const easelX = pt.x + 26 * z;
          const easelY = pt.y + 6 * z;
          // Wooden A-frame legs
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.4 * z;
          ctx.beginPath();
          ctx.moveTo(easelX, easelY - 14 * z);
          ctx.lineTo(easelX - 6 * z, easelY + 4 * z);
          ctx.moveTo(easelX, easelY - 14 * z);
          ctx.lineTo(easelX + 6 * z, easelY + 4 * z);
          ctx.stroke();
          // Slate Blackboard
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(easelX - 5 * z, easelY - 11 * z, 10 * z, 11 * z);
          ctx.strokeStyle = '#92400e';
          ctx.lineWidth = 0.8 * z;
          ctx.strokeRect(easelX - 5 * z, easelY - 11 * z, 10 * z, 11 * z);
          // Chalk menu text
          ctx.fillStyle = '#fef08a';
          ctx.font = `bold ${Math.round(3.8 * z)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('MENU', easelX, easelY - 7 * z);
          ctx.fillStyle = '#ffffff';
          ctx.font = `${Math.round(2.8 * z)}px sans-serif`;
          ctx.fillText('☕ 2 XP', easelX, easelY - 3.5 * z);
          ctx.fillText('🥐 1 XP', easelX, easelY - 0.5 * z);

          // Coffee Bean Barrel with brass bands
          const barrelX = pt.x - 22 * z;
          const barrelY = pt.y + 8 * z;
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.ellipse(barrelX, barrelY, 4.5 * z, 6 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 0.8 * z;
          ctx.stroke();
          // Barrel brass hoop lines
          ctx.strokeStyle = '#d97706';
          ctx.beginPath();
          ctx.moveTo(barrelX - 4 * z, barrelY - 2 * z);
          ctx.lineTo(barrelX + 4 * z, barrelY - 2 * z);
          ctx.moveTo(barrelX - 4 * z, barrelY + 2 * z);
          ctx.lineTo(barrelX + 4 * z, barrelY + 2 * z);
          ctx.stroke();

          // Sack of Flour ("TEPUNG") beside barrel
          ctx.fillStyle = '#fef3c7';
          ctx.beginPath();
          ctx.roundRect(barrelX + 8 * z, barrelY - 1 * z, 6 * z, 5.5 * z, 2 * z);
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 0.6 * z;
          ctx.stroke();
          ctx.fillStyle = '#92400e';
          ctx.font = `bold ${Math.round(2.2 * z)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText('FLOUR', barrelX + 11 * z, barrelY + 2.5 * z);
          ctx.restore();
        } else if (item.type === 'avatar') {
          // AVATARS (Smooth, Natural Leg Swing, Arm Swing, and Gentle Bobbing)
          const av = item.data;
          const pt = toScreen(av.wx, av.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          const isFemale = item.isPlayer
            ? studentGender === 'P'
            : av.gender === 'P';
          const isTeacherAvatar = Boolean((item.isPlayer && isTeacher) || av.role === 'guru');
          const isSittingNow = Boolean((item.isPlayer && isSittingRef.current) || av.isSitting);
          const isFishingNow = Boolean((item.isPlayer && isFishingRef.current) || av.isFishing);
          if (
            item.isPlayer &&
            heldItemRef.current &&
            heldItemExpiresAtRef.current &&
            Date.now() >= heldItemExpiresAtRef.current
          ) {
            heldItemRef.current = null;
            heldItemExpiresAtRef.current = null;
          }
          const currentHeldItem = item.isPlayer ? heldItemRef.current : av.heldItem;

          const currentSeatId = item.isPlayer ? sittingSeatRef.current : av.sittingSeat;
          const isOnSwing = Boolean(isSittingNow && isSwingSeatId(currentSeatId));
          const swingMetrics = isOnSwing && currentSeatId
            ? getSwingSeatMetrics(currentSeatId as 'swing_left' | 'swing_right' | 'swing_2_left' | 'swing_2_right')
            : null;
          const isCampfireSeat = Boolean(isSittingNow && currentSeatId && currentSeatId.startsWith('campfire_'));

          // Check if sitting on any 2-person bench (4 Fountain Minimalist Benches or 2 Campfire Benches)
          let twoPersonBenchLock: { screenX: number; screenY: number } | null = null;
          if (isSittingNow && currentSeatId && !isOnSwing) {
            for (const bGroup of ALL_TWO_PERSON_BENCHES) {
              const matchedSlot = bGroup.seats.find((s) => s.id === currentSeatId);
              if (matchedSlot) {
                const bPt = toScreen(bGroup.wx, bGroup.wy, 0, camera.x, camera.y);
                twoPersonBenchLock = {
                  screenX: bPt.x + matchedSlot.screenOffsetX * z,
                  screenY: bPt.y - 2.2 * z,
                };
                break;
              }
            }
          }

          if (twoPersonBenchLock) {
            pt.x = twoPersonBenchLock.screenX;
          }

          // Soft ground shadow (when on swing, shadow is already drawn under the swinging seat)
          if (!isOnSwing) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(pt.x + 1, pt.y + 1, 8 * z, 4 * z, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Warm orange firelight aura when warming body on a Campfire Bench
          if (isCampfireSeat) {
            ctx.save();
            const warmPulse = (11 + Math.sin(elapsed * 5) * 1.5) * z;
            const warmGrad = ctx.createRadialGradient(pt.x, pt.y - 8 * z, 2 * z, pt.x, pt.y - 8 * z, warmPulse * 1.4);
            warmGrad.addColorStop(0, 'rgba(251, 146, 60, 0.32)');
            warmGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
            ctx.fillStyle = warmGrad;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y - 8 * z, warmPulse * 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Subtle live online aura ring under remote online Guru & Siswa avatars
          if (av.isOnlineRemote && !isOnSwing) {
            ctx.save();
            const pulseR = (9.5 + Math.sin(elapsed * 4) * 1.2) * z;
            ctx.strokeStyle = isTeacherAvatar ? 'rgba(245, 158, 11, 0.75)' : 'rgba(16, 185, 129, 0.75)';
            ctx.lineWidth = 1.4 * z;
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1, pulseR, pulseR * 0.48, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // Spawning Portal Effect for Remote Online Avatars
          if (av.isOnlineRemote && av.spawnTime && currentTime - av.spawnTime < 3500) {
            const spawnFade = 1 - (currentTime - av.spawnTime) / 3500;
            ctx.save();
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.85 * spawnFade})`;
            ctx.lineWidth = 2 * z;
            ctx.beginPath();
            const ringR = (11 + Math.sin(elapsed * 9) * 3) * z;
            ctx.ellipse(pt.x, pt.y + 1, ringR, ringR * 0.48, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Rising teleport sparkle particles
            for (let sp = 0; sp < 4; sp++) {
              const spOffset = (elapsed * 2.5 + sp * 0.25) % 1;
              const spY = pt.y - spOffset * 26 * z;
              const spX = pt.x + Math.sin(elapsed * 5 + sp * 2) * 10 * z;
              ctx.fillStyle = `rgba(254, 240, 138, ${(1 - spOffset) * spawnFade})`;
              ctx.beginPath();
              ctx.arc(spX, spY, 1.8 * z, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.restore();
          }

          const activeEmote = item.isPlayer
            ? (playerEmoteRef.current && Date.now() < playerEmoteRef.current.expiresAt ? playerEmoteRef.current : null)
            : (av.activeEmote && Date.now() < av.activeEmote.expiresAt ? av.activeEmote : null);

          const isDancingNow = activeEmote?.type === 'dance';
          const isWavingNow = activeEmote?.type === 'wave';
          const isLaughingNow = activeEmote?.type === 'laugh';
          const isLovingNow = activeEmote?.type === 'love';

          // Natural leg swing & gentle bobbing (plus lively rhythmic dancing or giggle bounce)
          let legSwing = (av.isMoving && !isSittingNow) ? Math.sin(av.walkFrame) * 3.5 * z : 0;
          if (isDancingNow && !isSittingNow) {
            legSwing = Math.sin(elapsed * 10) * 2.8 * z;
          }

          let avY = pt.y + (isSittingNow ? -1.8 * z : (av.isMoving ? -Math.abs(Math.sin(av.walkFrame * 2)) * 1.5 * z : 0));

          if (isDancingNow) {
            const danceBounce = !isSittingNow ? Math.abs(Math.sin(elapsed * 10)) * 3.5 * z : Math.sin(elapsed * 8) * 1.5 * z;
            avY -= danceBounce;
            if (!isSittingNow && !swingMetrics && !twoPersonBenchLock) {
              pt.x += Math.sin(elapsed * 7) * 2.4 * z;
            }
          } else if (isLaughingNow) {
            const laughBounce = Math.abs(Math.sin(elapsed * 14)) * 2.6 * z;
            avY -= laughBounce;
          }

          if (swingMetrics) {
            // Lock avatar hip/seat center with 100% precision onto the wooden swing plank!
            pt.x = swingMetrics.seatX;
            avY = swingMetrics.seatY + 1.2 * z;
          } else if (twoPersonBenchLock) {
            pt.x = twoPersonBenchLock.screenX;
            avY = twoPersonBenchLock.screenY;
          }

          // 1. LEGS & PANTS / SKIRT
          if (isSittingNow) {
            // SITTING ANIMATION: Legs folded forward resting comfortably over the bench/swing surface
            const swayVal = swingMetrics ? swingMetrics.sway : 0;
            // When swinging forward (kemuka, sway > 0), calves kick forward/outward; when swinging backward (kebelakang, sway < 0), calves tuck back
            const calfKickX = isOnSwing ? swayVal * 2.2 * z : 0;
            const calfKickY = isOnSwing ? -Math.max(0, swayVal) * 1.6 * z : 0;

            ctx.fillStyle = isTeacherAvatar
              ? (isFemale ? '#065f46' : '#1e293b')
              : (isFemale ? (av.pantsColor || '#be185d') : av.pantsColor);

            // Horizontal thighs resting flat on bench/swing plank
            ctx.fillRect(pt.x - 4 * z, avY - 4 * z, 3.8 * z, 3.2 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY - 4 * z, 3.8 * z, 3.2 * z);

            // Vertical calves hanging downward from bench/swing (pumping forward & backward on swing)
            ctx.fillRect(pt.x - 4 * z + calfKickX, avY - 1 * z + calfKickY, 3.2 * z, 4.2 * z);
            ctx.fillRect(pt.x + 1 * z + calfKickX, avY - 1 * z + calfKickY, 3.2 * z, 4.2 * z);

            // Shoes resting on ground / swinging in air
            ctx.fillStyle = isFemale ? (isTeacherAvatar ? '#064e3b' : '#e11d48') : '#0f172a';
            ctx.fillRect(pt.x - 4.5 * z + calfKickX, avY + 3.2 * z + calfKickY, 4 * z, 2.2 * z);
            ctx.fillRect(pt.x + 0.8 * z + calfKickX, avY + 3.2 * z + calfKickY, 4 * z, 2.2 * z);
          } else if (av.role === 'penjaga_literasi') {
            // PATRA (Ibu Muslim di Sudut Literasi): Long modest Muslimah Gamis skirt & soft shoes
            ctx.fillStyle = '#115e59';
            ctx.beginPath();
            ctx.moveTo(pt.x - 5.2 * z, avY - 6.5 * z);
            ctx.lineTo(pt.x + 5.2 * z, avY - 6.5 * z);
            ctx.lineTo(pt.x + 6.4 * z, avY + 1.2 * z);
            ctx.lineTo(pt.x - 6.4 * z, avY + 1.2 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0d9488';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            ctx.fillStyle = '#042f2e';
            ctx.fillRect(pt.x - 4 * z, avY + 1.2 * z + legSwing * 0.4, 3.5 * z, 2.2 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY + 1.2 * z - legSwing * 0.4, 3.5 * z, 2.2 * z);
          } else if (av.role === 'barista') {
            // MA UBA (Ibu Kantin): Long modest canteen skirt + white apron lower hem
            ctx.fillStyle = '#7c2d12';
            ctx.beginPath();
            ctx.moveTo(pt.x - 5 * z, avY - 6.5 * z);
            ctx.lineTo(pt.x + 5 * z, avY - 6.5 * z);
            ctx.lineTo(pt.x + 6 * z, avY + 1 * z);
            ctx.lineTo(pt.x - 6 * z, avY + 1 * z);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#451a03';
            ctx.fillRect(pt.x - 4 * z, avY + 1 * z, 3.5 * z, 2.3 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY + 1 * z, 3.5 * z, 2.3 * z);
          } else if (isFemale) {
            if (isTeacherAvatar) {
              // Female Teacher: Elegant tailored long slacks or maxi skirt
              ctx.fillStyle = '#065f46';
              ctx.fillRect(pt.x - 3.8 * z, avY - 5 * z + legSwing, 3.2 * z, 6 * z);
              ctx.fillRect(pt.x + 0.6 * z, avY - 5 * z - legSwing, 3.2 * z, 6 * z);
              ctx.fillStyle = '#064e3b';
              ctx.fillRect(pt.x - 4 * z, avY + 1 * z + legSwing, 3.6 * z, 2.4 * z);
              ctx.fillRect(pt.x + 0.6 * z, avY + 1 * z - legSwing, 3.6 * z, 2.4 * z);
            } else {
              // Female Student: Legs in socks & pleated skirt
              ctx.fillStyle = '#fed7aa';
              ctx.fillRect(pt.x - 3.5 * z, avY - 4 * z + legSwing, 2.5 * z, 5 * z);
              ctx.fillRect(pt.x + 1 * z, avY - 4 * z - legSwing, 2.5 * z, 5 * z);

              // White ankle socks
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(pt.x - 3.5 * z, avY - 0.5 * z + legSwing, 2.5 * z, 2 * z);
              ctx.fillRect(pt.x + 1 * z, avY - 0.5 * z - legSwing, 2.5 * z, 2 * z);

              // Pleated skirt
              ctx.fillStyle = av.pantsColor || '#be185d';
              ctx.beginPath();
              ctx.moveTo(pt.x - 5.5 * z, avY - 7 * z);
              ctx.lineTo(pt.x + 5.5 * z, avY - 7 * z);
              ctx.lineTo(pt.x + 7.5 * z, avY - 2 * z);
              ctx.lineTo(pt.x - 7.5 * z, avY - 2 * z);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
              ctx.lineWidth = 0.8 * z;
              for (let pl = -4; pl <= 4; pl += 2.6) {
                ctx.beginPath();
                ctx.moveTo(pt.x + pl * z, avY - 7 * z);
                ctx.lineTo(pt.x + pl * 1.3 * z, avY - 2 * z);
                ctx.stroke();
              }
              // Shoes
              ctx.fillStyle = '#e11d48';
              ctx.fillRect(pt.x - 4 * z, avY + 1 * z + legSwing, 3.5 * z, 2.5 * z);
              ctx.fillRect(pt.x + 0.5 * z, avY + 1 * z - legSwing, 3.5 * z, 2.5 * z);
            }
          } else {
            // Male Pants (including Wali Kota Sony's crisp white/slate dress pants & Satpam Surya's dark brown trousers)
            ctx.fillStyle = isTeacherAvatar ? '#1e293b' : av.pantsColor;
            ctx.fillRect(pt.x - 3.5 * z, avY - 5 * z + legSwing, 3 * z, 6 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY - 5 * z - legSwing, 3 * z, 6 * z);
            // Shoes
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 4 * z, avY + 1 * z + legSwing, 3.5 * z, 2.5 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY + 1 * z - legSwing, 3.5 * z, 2.5 * z);
          }

          // 2. SHIRT / TORSO
          if (isTeacherAvatar) {
            if (isFemale) {
              // Female Teacher: Formal emerald blazer with golden brooch
              ctx.fillStyle = '#047857';
              ctx.beginPath();
              ctx.roundRect(pt.x - 5.5 * z, avY - 14 * z, 11 * z, 8.5 * z, 2.2 * z);
              ctx.fill();
              // Golden brooch
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(pt.x - 2 * z, avY - 11.5 * z, 1.2 * z, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Male Teacher: Formal navy blazer with golden amber tie
              ctx.fillStyle = '#1e3a8a';
              ctx.beginPath();
              ctx.roundRect(pt.x - 5.5 * z, avY - 14 * z, 11 * z, 8.5 * z, 2.2 * z);
              ctx.fill();
              // White shirt v-neck & tie
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(pt.x - 2 * z, avY - 14 * z);
              ctx.lineTo(pt.x, avY - 11 * z);
              ctx.lineTo(pt.x + 2 * z, avY - 14 * z);
              ctx.fill();
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(pt.x - 0.8 * z, avY - 11.5 * z, 1.6 * z, 4.5 * z);
            }
          } else if (av.role === 'kepala_balai') {
            // SONY (WALI KOTA): Official White Mayor Suit (Jas Dinas Putih Wali Kota), Red Tie, Ceremonial Sash & Golden Garuda Emblem
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.6 * z, avY - 14.2 * z, 11.2 * z, 8.8 * z, 2.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            // Red tie & collar
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(pt.x - 0.8 * z, avY - 13 * z, 1.6 * z, 5.2 * z);
            // Golden Mayor Epaulettes on shoulders
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 5.5 * z, avY - 14.4 * z, 2.6 * z, 1.3 * z);
            ctx.fillRect(pt.x + 2.9 * z, avY - 14.4 * z, 2.6 * z, 1.3 * z);
            // Golden Mayor Jengkol / Garuda Star Medal on Left Chest
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x + 2.5 * z, avY - 10.8 * z, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 0.5 * z;
            ctx.stroke();
            // Brass buttons down center
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x - 0.6 * z, avY - 8 * z, 1.2 * z, 1.2 * z);
          } else if (av.role === 'penjaga_kota') {
            // SURYA (SATPAM): Official Security Guard Uniform (Kemeja PDH Krem Satpam, Sabuk Kopel, Tali Kur & Badge Perisai)
            ctx.fillStyle = '#d6c7b2';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.5 * z, avY - 14 * z, 11 * z, 8.6 * z, 2 * z);
            ctx.fill();
            ctx.strokeStyle = '#78716c';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();
            // Dark brown shoulder straps (pangkat Satpam) & breast pockets
            ctx.fillStyle = '#451a03';
            ctx.fillRect(pt.x - 5.3 * z, avY - 14.2 * z, 2.4 * z, 1.1 * z);
            ctx.fillRect(pt.x + 2.9 * z, avY - 14.2 * z, 2.4 * z, 1.1 * z);
            ctx.fillRect(pt.x - 0.7 * z, avY - 13.2 * z, 1.4 * z, 5.5 * z); // dark tie
            // White whistle lanyard cord (Tali Kur Satpam) on shoulder
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.0 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 4.2 * z, avY - 13.5 * z);
            ctx.quadraticCurveTo(pt.x - 2.5 * z, avY - 9.5 * z, pt.x - 4.5 * z, avY - 8 * z);
            ctx.stroke();
            // Golden shield badge on chest
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x + 2.4 * z, avY - 11.2 * z, 1.3 * z, 0, Math.PI * 2);
            ctx.fill();
            // Heavy Black Security Duty Belt (Sabuk Kopel) with Brass Buckle
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 5.5 * z, avY - 6.8 * z, 11 * z, 1.8 * z);
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(pt.x - 1.2 * z, avY - 6.8 * z, 2.4 * z, 1.8 * z);
          } else if (av.role === 'penjaga_literasi') {
            // PATRA (IBU MUSLIM): Modest Emerald Tunic / Gamis with Golden Floral Brooch
            ctx.fillStyle = '#0d9488';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.4 * z, avY - 14 * z, 10.8 * z, 8.8 * z, 2.2 * z);
            ctx.fill();
            // Delicate embroidery trim at waist
            ctx.strokeStyle = '#99f6e4';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 5 * z, avY - 6.2 * z);
            ctx.lineTo(pt.x + 5 * z, avY - 6.2 * z);
            ctx.stroke();
          } else if (av.role === 'barista') {
            // MA UBA (IBU KANTIN): Warm Orange Blouse with Crisp White Canteen Apron & Front Pocket
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.4 * z, avY - 14 * z, 10.8 * z, 8.6 * z, 2.2 * z);
            ctx.fill();
            // White Canteen Apron Bib & Waist Ties
            ctx.fillStyle = '#fffbeb';
            ctx.beginPath();
            ctx.roundRect(pt.x - 3.8 * z, avY - 13 * z, 7.6 * z, 9.5 * z, 1.4 * z);
            ctx.fill();
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();
            // Red front apron pocket
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(pt.x - 2.2 * z, avY - 8.2 * z, 4.4 * z, 2.4 * z);
          } else if (av.role === 'penjaga_lab') {
            // MALIK (KUTU BUKU BERKACAMATA): White Collared Shirt + Navy Argyle Sweater Vest + Red Bowtie + Pocket Protector
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.2 * z, avY - 14 * z, 10.4 * z, 8.5 * z, 2.2 * z);
            ctx.fill();
            // White shirt V-neck collar
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pt.x - 2.6 * z, avY - 14 * z);
            ctx.lineTo(pt.x, avY - 10.5 * z);
            ctx.lineTo(pt.x + 2.6 * z, avY - 14 * z);
            ctx.closePath();
            ctx.fill();
            //Argyle diamond pattern on vest
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(pt.x, avY - 9.8 * z);
            ctx.lineTo(pt.x + 1.8 * z, avY - 8.2 * z);
            ctx.lineTo(pt.x, avY - 6.6 * z);
            ctx.lineTo(pt.x - 1.8 * z, avY - 8.2 * z);
            ctx.closePath();
            ctx.fill();
            // Red Nerd Bowtie at collar
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(pt.x - 2.2 * z, avY - 13.6 * z);
            ctx.lineTo(pt.x + 2.2 * z, avY - 12.0 * z);
            ctx.lineTo(pt.x + 2.2 * z, avY - 13.6 * z);
            ctx.lineTo(pt.x - 2.2 * z, avY - 12.0 * z);
            ctx.closePath();
            ctx.fill();
          } else {
            // Student Torso
            ctx.fillStyle = av.shirtColor;
            ctx.beginPath();
            ctx.roundRect(pt.x - 5 * z, avY - 14 * z, 10 * z, 8.5 * z, 2.2 * z);
            ctx.fill();

            if (isFemale) {
              // Cute Peter Pan collar
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(pt.x - 2 * z, avY - 13.5 * z, 1.8 * z, 0, Math.PI);
              ctx.arc(pt.x + 2 * z, avY - 13.5 * z, 1.8 * z, 0, Math.PI);
              ctx.fill();
              ctx.fillStyle = '#f43f5e';
              ctx.fillRect(pt.x - 1 * z, avY - 13 * z, 2 * z, 2.5 * z);
            } else {
              // Male open polo collar line
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1 * z;
              ctx.beginPath();
              ctx.moveTo(pt.x - 2 * z, avY - 14 * z);
              ctx.lineTo(pt.x, avY - 11.5 * z);
              ctx.lineTo(pt.x + 2 * z, avY - 14 * z);
              ctx.stroke();
            }
          }

          // 3. ARMS & HANDS
          const isReadingNow = Boolean(
            item.isPlayer &&
              (activeLiteracyDoc !== null ||
                (isSittingNow && (sittingSeat === 'literacy' || sittingSeat?.startsWith('literacy_'))))
          );

          if (isReadingNow) {
            // ARMS HOLDING OPEN BOOK / COMIC
            ctx.fillStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            // Left arm reaching forward to hold book
            ctx.beginPath();
            ctx.moveTo(pt.x - 5.5 * z, avY - 12 * z);
            ctx.lineTo(pt.x - 2 * z, avY - 7 * z);
            ctx.lineTo(pt.x - 0.5 * z, avY - 9 * z);
            ctx.lineTo(pt.x - 4 * z, avY - 13.5 * z);
            ctx.fill();

            // Right arm reaching forward to hold book
            ctx.beginPath();
            ctx.moveTo(pt.x + 5.5 * z, avY - 12 * z);
            ctx.lineTo(pt.x + 2 * z, avY - 7 * z);
            ctx.lineTo(pt.x + 0.5 * z, avY - 9 * z);
            ctx.lineTo(pt.x + 4 * z, avY - 13.5 * z);
            ctx.fill();

            // Hands holding the book pages
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x - 3.2 * z, avY - 7 * z, 1.4 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 3.2 * z, avY - 7 * z, 1.4 * z, 0, Math.PI * 2);
            ctx.fill();

            // Open book / comic / magazine cover
            ctx.fillStyle = activeLiteracyDoc === 'komik' ? '#06b6d4' : activeLiteracyDoc === 'majalah' ? '#f59e0b' : '#10b981';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.5 * z, avY - 10.5 * z, 11 * z, 6.5 * z, 1.2 * z);
            ctx.fill();

            // Open white pages
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 4.8 * z, avY - 9.8 * z, 4.2 * z, 5.2 * z);
            ctx.fillRect(pt.x + 0.6 * z, avY - 9.8 * z, 4.2 * z, 5.2 * z);

            // Spine crease line
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, avY - 9.8 * z);
            ctx.lineTo(pt.x, avY - 4.6 * z);
            ctx.stroke();

            // Text lines on pages
            ctx.fillStyle = '#64748b';
            for (let pl = 0; pl < 3; pl++) {
              ctx.fillRect(pt.x - 4.2 * z, avY - (8.8 - pl * 1.5) * z, 3 * z, 0.7 * z);
              ctx.fillRect(pt.x + 1.2 * z, avY - (8.8 - pl * 1.5) * z, 3 * z, 0.7 * z);
            }
          } else if (isOnSwing && swingMetrics) {
            // Gripping the left & right swing chains with exact chain alignment
            const handChainT = 0.68; // 68% down from top beam to seat
            const leftHandX = swingMetrics.anchorX - 4.2 * z + ((swingMetrics.seatX - 4.5 * z) - (swingMetrics.anchorX - 4.2 * z)) * handChainT;
            const leftHandY = swingMetrics.anchorY + (swingMetrics.seatY - swingMetrics.anchorY) * handChainT;
            const rightHandX = swingMetrics.anchorX + 4.2 * z + ((swingMetrics.seatX + 4.5 * z) - (swingMetrics.anchorX + 4.2 * z)) * handChainT;
            const rightHandY = swingMetrics.anchorY + (swingMetrics.seatY - swingMetrics.anchorY) * handChainT;

            // Sleeves reaching from shoulders to the chains
            ctx.strokeStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            ctx.lineWidth = 2.4 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 4.8 * z, avY - 12.5 * z);
            ctx.lineTo(leftHandX, leftHandY);
            ctx.moveTo(pt.x + 4.8 * z, avY - 12.5 * z);
            ctx.lineTo(rightHandX, rightHandY);
            ctx.stroke();

            // Hands gripping the chains
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(leftHandX, leftHandY, 1.5 * z, 0, Math.PI * 2);
            ctx.arc(rightHandX, rightHandY, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();

            // Re-draw lower front chain segment passing through the hands to the seat so avatar sits inside the chains
            ctx.strokeStyle = isNight ? '#cbd5e1' : '#57534e';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(leftHandX, leftHandY);
            ctx.lineTo(swingMetrics.seatX - 4.5 * z, swingMetrics.seatY);
            ctx.moveTo(rightHandX, rightHandY);
            ctx.lineTo(swingMetrics.seatX + 4.5 * z, swingMetrics.seatY);
            ctx.stroke();
          } else if (isSittingNow) {
            // Resting arms on lap / knees
            ctx.fillStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            ctx.fillRect(pt.x - 6.5 * z, avY - 13 * z, 2.2 * z, 6.5 * z);
            ctx.fillRect(pt.x + 4.5 * z, avY - 13 * z, 2.2 * z, 6.5 * z);
            // Hands on knees
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 5.5 * z, avY - 7 * z, 2.6 * z, 2.2 * z);
            ctx.fillRect(pt.x + 3 * z, avY - 7 * z, 2.6 * z, 2.2 * z);
          } else if (av.role === 'kepala_balai') {
            // SONY (WALI KOTA): Left arm normal swing, Right arm waves warmly to greet citizens!
            const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 2.5 * z : 0;
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z - armSwing, 2.2 * z, 6.8 * z);
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 7.2 * z, avY - 6.2 * z - armSwing, 2.2 * z, 2.2 * z);

            // Waving right arm when greeting citizens
            const waveOffset = Math.sin(elapsed * 7) * 2.2 * z;
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2.4 * z;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x + 5 * z, avY - 12.5 * z);
            ctx.lineTo(pt.x + 8.5 * z, avY - 17.5 * z + waveOffset);
            ctx.stroke();
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x + 8.8 * z, avY - 18 * z + waveOffset, 1.4 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (av.role === 'penjaga_kota') {
            // SURYA (SATPAM): Patrol arms + Security Baton / HT at right hand
            const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 2.8 * z : 0;
            ctx.fillStyle = '#d6c7b2';
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z - armSwing, 2.2 * z, 7 * z);
            ctx.fillRect(pt.x + 5 * z, avY - 13 * z + armSwing, 2.2 * z, 7 * z);
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 7.2 * z, avY - 6 * z - armSwing, 2.2 * z, 2.2 * z);
            ctx.fillRect(pt.x + 5 * z, avY - 6 * z + armSwing, 2.2 * z, 2.2 * z);
            // Black Security Baton (Pentungan Satpam) in right hand
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 6.2 * z, avY - 5.5 * z + armSwing);
            ctx.lineTo(pt.x + 9.5 * z, avY - 1.5 * z + armSwing);
            ctx.stroke();
          } else if (av.role === 'penjaga_lab') {
            // MALIK (KUTU BUKU): Holding a stack of thick reference books against chest
            const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 1.5 * z : 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 7.0 * z, avY - 13 * z - armSwing, 2.1 * z, 6.2 * z);
            ctx.fillRect(pt.x + 4.9 * z, avY - 13 * z, 2.1 * z, 5.5 * z);
            // Stack of 2 thick books held in right arm
            ctx.fillStyle = '#059669';
            ctx.fillRect(pt.x + 2.2 * z, avY - 9.8 * z, 5.2 * z, 2.2 * z);
            ctx.fillStyle = '#d97706';
            ctx.fillRect(pt.x + 2.5 * z, avY - 7.6 * z, 5.0 * z, 2.2 * z);
            ctx.fillStyle = '#fef3c7';
            ctx.fillRect(pt.x + 2.8 * z, avY - 9.2 * z, 4.2 * z, 0.8 * z);
            ctx.fillRect(pt.x + 3.0 * z, avY - 7.0 * z, 4.0 * z, 0.8 * z);
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x + 5.2 * z, avY - 6.8 * z, 1.3 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (av.role === 'penjaga_literasi') {
            // PATRA (IBU MUSLIM DI SUDUT LITERASI): Holding an open golden-emerald book inviting citizens to read
            const gentleWave = Math.sin(elapsed * 4) * 1.2 * z;
            ctx.fillStyle = '#0d9488';
            ctx.fillRect(pt.x - 7.0 * z, avY - 12.8 * z, 2.2 * z, 6.2 * z);
            ctx.fillRect(pt.x + 4.8 * z, avY - 13 * z + gentleWave * 0.4, 2.2 * z, 6.2 * z);
            // Book held in left hand
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(pt.x - 8.2 * z, avY - 9.5 * z, 5.2 * z, 4.2 * z, 0.8 * z);
            ctx.fill();
            ctx.fillStyle = '#fefce8';
            ctx.fillRect(pt.x - 7.5 * z, avY - 8.8 * z, 3.8 * z, 2.8 * z);
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x + 5.9 * z, avY - 6.5 * z + gentleWave * 0.4, 1.3 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (av.role === 'barista') {
            // MA UBA (IBU KANTIN): Holding a warm serving tray with teacup in front of Toko
            ctx.fillStyle = '#ea580c';
            ctx.fillRect(pt.x - 7.0 * z, avY - 13 * z, 2.2 * z, 6.2 * z);
            ctx.fillRect(pt.x + 4.8 * z, avY - 13 * z, 2.2 * z, 5.8 * z);
            // Silver/wooden canteen serving tray & warm cup
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.ellipse(pt.x + 5.8 * z, avY - 7.2 * z, 4.2 * z, 1.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x + 4.6 * z, avY - 10 * z, 2.4 * z, 2.6 * z);
          } else if (isDancingNow) {
            // DANCING ARMS: Alternating disco arm pump & groove
            const beat = (elapsed * 8) % (Math.PI * 2);
            const leftArmY = Math.sin(beat) * 5.5 * z;
            const rightArmY = -Math.sin(beat) * 5.5 * z;
            const leftPointX = Math.cos(beat) * 2.5 * z;
            const rightPointX = -Math.cos(beat) * 2.5 * z;

            ctx.fillStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            ctx.fillRect(pt.x - 7.2 * z + leftPointX, avY - 14 * z + leftArmY, 2.2 * z, 6.5 * z);
            ctx.fillRect(pt.x + 5.0 * z + rightPointX, avY - 14 * z + rightArmY, 2.2 * z, 6.5 * z);
            // Hands
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x - 6.1 * z + leftPointX, avY - 7.5 * z + leftArmY, 1.4 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 6.1 * z + rightPointX, avY - 7.5 * z + rightArmY, 1.4 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (isWavingNow) {
            // WAVING ARM: Right hand held high and waving side-to-side
            const waveCycle = Math.sin(elapsed * 10) * 3.6 * z;
            ctx.fillStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            // Left arm relaxed
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z, 2.2 * z, 7 * z);
            // Right arm raised high
            ctx.fillRect(pt.x + 5.2 * z + waveCycle * 0.4, avY - 18 * z, 2.2 * z, 6.5 * z);

            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 7.2 * z, avY - 6 * z, 2.2 * z, 2.2 * z);
            ctx.beginPath();
            ctx.arc(pt.x + 6.3 * z + waveCycle, avY - 19.5 * z, 1.6 * z, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 2.8 * z : 0;
            ctx.fillStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z - armSwing, 2.2 * z, 7 * z);
            ctx.fillRect(pt.x + 5 * z, avY - 13 * z + armSwing, 2.2 * z, 7 * z);
            // Hands
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 7.2 * z, avY - 6 * z - armSwing, 2.2 * z, 2.2 * z);
            ctx.fillRect(pt.x + 5 * z, avY - 6 * z + armSwing, 2.2 * z, 2.2 * z);
          }

          // 4. HEAD & FACE
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(pt.x, avY - 18 * z, 5 * z, 0, Math.PI * 2);
          ctx.fill();

          if (isFemale && !isTeacherAvatar) {
            // Blushing cheeks for female characters
            ctx.fillStyle = 'rgba(244, 63, 94, 0.42)';
            ctx.beginPath();
            ctx.arc(pt.x - 3 * z, avY - 17.5 * z, 1.2 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 3 * z, avY - 17.5 * z, 1.2 * z, 0, Math.PI * 2);
            ctx.fill();
          }

          // 5. HAIR, HIJAB, HATS & GLASSES (Distinguished Teacher, Custom NPCs & Student)
          if ((isTeacherAvatar && isFemale) || av.role === 'penjaga_literasi') {
            // Female Teacher or PATRA (Ibu Muslim di Sudut Literasi): Flowing Syar'i Hijab covering chest with Golden Brooch
            const hijabMain = av.role === 'penjaga_literasi' ? '#0d9488' : '#059669';
            const hijabEdge = av.role === 'penjaga_literasi' ? '#99f6e4' : '#34d399';
            ctx.fillStyle = hijabMain;
            ctx.beginPath();
            ctx.arc(pt.x, avY - 19.5 * z, 6.4 * z, 0, Math.PI * 2);
            ctx.fill();
            // Modest Syar'i Khimar / Hijab drape covering shoulders and chest
            ctx.beginPath();
            ctx.moveTo(pt.x - 6.6 * z, avY - 17.5 * z);
            ctx.lineTo(pt.x + 6.6 * z, avY - 17.5 * z);
            ctx.lineTo(pt.x + 7.8 * z, avY - 9.2 * z);
            ctx.quadraticCurveTo(pt.x, avY - 6.8 * z, pt.x - 7.8 * z, avY - 9.2 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = hijabEdge;
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();
            // Golden hijab pin brooch on chest drape
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x - 2.6 * z, avY - 11.2 * z, 1.1 * z, 0, Math.PI * 2);
            ctx.fill();
            // Inner face opening
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.ellipse(pt.x, avY - 18 * z, 3.8 * z, 4.2 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            // Delicate blushing
            ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
            ctx.beginPath();
            ctx.arc(pt.x - 2.5 * z, avY - 17.5 * z, 1 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 2.5 * z, avY - 17.5 * z, 1 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (av.role === 'barista') {
            // MA UBA (IBU KANTIN): Neat hair bun & Cream-Red Canteen Headscarf / Bandana Ibu Kantin
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 20.5 * z, 5.5 * z, Math.PI, 0);
            ctx.fill();
            // Ibu Kantin headscarf / kerudung masak
            ctx.fillStyle = '#fef3c7';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 21.2 * z, 5.8 * z, Math.PI * 1.05, -Math.PI * 0.05);
            ctx.fill();
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(pt.x - 5.6 * z, avY - 21.8 * z, 11.2 * z, 1.6 * z);
          } else if (av.role === 'kepala_balai') {
            // SONY (WALI KOTA): Official Black Velvet Peci / Kopiah with Golden Mayor Trim & Neat Mustache
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.4 * z, avY - 25.2 * z, 10.8 * z, 4.8 * z, 1.2 * z);
            ctx.fill();
            // Golden trim band & Garuda pin on Peci
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 0.9 * z;
            ctx.strokeRect(pt.x - 5.2 * z, avY - 25.0 * z, 10.4 * z, 4.4 * z);
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 22.8 * z, 1.3 * z, 0, Math.PI * 2);
            ctx.fill();
            // Dignified small mustache
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pt.x - 2.0 * z, avY - 16.5 * z, 4.0 * z, 0.9 * z);
          } else if (av.role === 'penjaga_kota') {
            // SURYA (SATPAM): Official Security Guard Peaked Cap (Topi Pet Satpam) with Visor & Gold Shield Emblem
            // Cap crown
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(pt.x, avY - 23.8 * z, 6.2 * z, 2.6 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(pt.x - 5.2 * z, avY - 23.8 * z, 10.4 * z, 3.0 * z);
            // Black glossy visor brim
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.ellipse(pt.x, avY - 20.6 * z, 5.8 * z, 1.5 * z, 0, 0, Math.PI);
            ctx.fill();
            // Gold cord & Satpam shield badge on front of cap
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 0.9 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 5.0 * z, avY - 21.0 * z);
            ctx.lineTo(pt.x + 5.0 * z, avY - 21.0 * z);
            ctx.stroke();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 22.6 * z, 1.4 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (av.role === 'penjaga_lab') {
            // MALIK (KUTU BUKU BERKACAMATA): Center-parted Geek Hair + Oversized Thick-Rimmed Nerd Glasses with Lens Glint
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 21.2 * z, 5.4 * z, Math.PI, 0);
            ctx.fill();
            // Center hair part notch
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.moveTo(pt.x, avY - 21.5 * z);
            ctx.lineTo(pt.x - 0.8 * z, avY - 19.8 * z);
            ctx.lineTo(pt.x + 0.8 * z, avY - 19.8 * z);
            ctx.closePath();
            ctx.fill();
            // Large Thick-Rimmed Round Nerd Glasses (Kacamata Kutu Buku Tebal)
            ctx.fillStyle = 'rgba(186, 230, 253, 0.78)';
            ctx.beginPath();
            ctx.arc(pt.x - 2.4 * z, avY - 18.2 * z, 2.3 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 2.4 * z, avY - 18.2 * z, 2.3 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.35 * z;
            ctx.beginPath();
            ctx.arc(pt.x - 2.4 * z, avY - 18.2 * z, 2.3 * z, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pt.x + 2.4 * z, avY - 18.2 * z, 2.3 * z, 0, Math.PI * 2);
            ctx.stroke();
            // White tape / bridge in the middle of nerd glasses
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 0.3 * z, avY - 18.2 * z);
            ctx.lineTo(pt.x + 0.3 * z, avY - 18.2 * z);
            ctx.stroke();
            // White lens shine reflection
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 3.3 * z, avY - 19.2 * z, 0.9 * z, 0.9 * z);
            ctx.fillRect(pt.x + 1.5 * z, avY - 19.2 * z, 0.9 * z, 0.9 * z);
          } else if (isTeacherAvatar) {
            // Male Teacher: Smart side-parted hairstyle with glasses
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 21 * z, 5.4 * z, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(pt.x - 4.5 * z, avY - 22 * z, 3.5 * z, 2.5 * z);
            // Wireframe glasses
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(pt.x - 4 * z, avY - 19.5 * z, 3 * z, 2.2 * z);
            ctx.strokeRect(pt.x + 1 * z, avY - 19.5 * z, 3 * z, 2.2 * z);
            ctx.beginPath();
            ctx.moveTo(pt.x - 1 * z, avY - 18.5 * z);
            ctx.lineTo(pt.x + 1 * z, avY - 18.5 * z);
            ctx.stroke();
          } else if (isFemale) {
            // Female Student: Round crown & bangs with side locks & hair ribbons
            ctx.fillStyle = av.hairColor || '#6b3410';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 21 * z, 5.8 * z, Math.PI, 0);
            ctx.fill();
            ctx.beginPath();
            ctx.roundRect(pt.x - 7 * z, avY - 20 * z, 2.4 * z, 10 * z, 1.2 * z);
            ctx.roundRect(pt.x + 4.6 * z, avY - 20 * z, 2.4 * z, 10 * z, 1.2 * z);
            ctx.fill();
            // Hair ribbons
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(pt.x - 6 * z, avY - 21 * z, 1.8 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 6 * z, avY - 21 * z, 1.8 * z, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Male Student: Clean crop with side part
            ctx.fillStyle = av.hairColor || '#0f172a';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 21 * z, 5.2 * z, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(pt.x - 4 * z, avY - 22 * z, 3 * z, 2.5 * z);
          }

          // HELD ITEM (Minimalist Coffee, Bread, or Ice Cream in hand)
          if (currentHeldItem) {
            const hType = currentHeldItem;
            const hX = pt.x + 6 * z;
            const hY = avY - 8 * z + (isSittingNow ? 0 : (av.isMoving ? Math.sin(av.walkFrame) * 2.8 * z : 0));

            if (hType === 'kopi') {
              ctx.fillStyle = '#f8fafc';
              ctx.fillRect(hX - 1.5 * z, hY - 4 * z, 4 * z, 5.5 * z);
              ctx.fillStyle = '#b45309';
              ctx.fillRect(hX - 1.5 * z, hY - 2.5 * z, 4 * z, 2.5 * z);
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(hX - 2 * z, hY - 5 * z, 5 * z, 1.4 * z);
              // Animated warm steam wisps
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
              ctx.lineWidth = 0.8 * z;
              const sY = hY - (6 + (elapsed * 8) % 7) * z;
              ctx.beginPath();
              ctx.moveTo(hX + 0.5 * z, sY);
              ctx.lineTo(hX + 0.5 * z + Math.sin(elapsed * 4) * 1.5 * z, sY - 2.5 * z);
              ctx.stroke();
            } else if (hType === 'roti') {
              ctx.fillStyle = '#f59e0b';
              ctx.beginPath();
              ctx.ellipse(hX + 0.5 * z, hY - 2 * z, 3.8 * z, 2.4 * z, Math.PI / 4, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#b45309';
              ctx.lineWidth = 0.8 * z;
              ctx.stroke();
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(hX - 0.5 * z, hY - 2.8 * z, 1.2 * z, 0, Math.PI * 2);
              ctx.fill();
            } else if (hType === 'eskrim') {
              ctx.fillStyle = '#d97706';
              ctx.beginPath();
              ctx.moveTo(hX - 2 * z, hY - 1 * z);
              ctx.lineTo(hX + 2 * z, hY - 1 * z);
              ctx.lineTo(hX, hY + 3.5 * z);
              ctx.closePath();
              ctx.fill();
              ctx.fillStyle = '#f472b6';
              ctx.beginPath();
              ctx.arc(hX, hY - 2.5 * z, 2.6 * z, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(hX, hY - 5.2 * z, 1 * z, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          // FISHING ANIMATION (Simple Fishing Rod Casting + Bobber & Splash at East Pier)
          if (isFishingNow) {
            const fishStart = av.fishingStartTime || 0;
            const fishAgeSec = fishStart > 0 ? Math.max(0, (currentTime - fishStart) / 1000) : 1.5;

            // Phase 1 (0.00s - 0.24s): Wind-up backswing behind shoulder
            // Phase 2 (0.24s - 0.56s): Forward whip cast toward the pond
            // Phase 3 (0.56s - 0.90s): Line & bobber fly in a parabolic arc into the water + splash
            // Phase 4 (0.90s+): Settled fishing stance with gentle rod tip & bobber motion
            let rodAngle = -0.68; // settled angle (radians relative to horizontal +X)
            if (fishAgeSec < 0.24) {
              const p = fishAgeSec / 0.24;
              // Swing back from -0.7 to -2.15 rad (tilted backward over head)
              rodAngle = -0.7 - p * 1.45;
            } else if (fishAgeSec < 0.56) {
              const p = (fishAgeSec - 0.24) / 0.32;
              // Ease-out whip forward from -2.15 to -0.52 rad
              const easeOut = 1 - Math.pow(1 - p, 3);
              rodAngle = -2.15 + easeOut * 1.63;
            } else if (fishAgeSec < 0.9) {
              const p = (fishAgeSec - 0.56) / 0.34;
              // Settle softly from -0.52 to -0.68 rad
              rodAngle = -0.52 - p * 0.16;
            } else {
              rodAngle = -0.68 + Math.sin(elapsed * 3.5) * 0.04;
            }

            const handBaseX = pt.x + 4.5 * z;
            const handBaseY = avY - 8.5 * z;
            const rodLen = 23 * z;
            const rodMidX = handBaseX + Math.cos(rodAngle) * (rodLen * 0.78);
            const rodMidY = handBaseY + Math.sin(rodAngle) * (rodLen * 0.78);

            // Flexible rod tip bends slightly during cast & water tug
            const tipBendY =
              fishAgeSec >= 0.24 && fishAgeSec < 0.56
                ? -4.5 * z
                : (4.5 + Math.sin(elapsed * 6) * 1.1) * z;
            const rodTipX = handBaseX + Math.cos(rodAngle) * rodLen + 5.5 * z;
            const rodTipY = handBaseY + Math.sin(rodAngle) * rodLen + tipBendY;

            // Casting arm reaching forward/upward with the rod handle
            ctx.strokeStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            ctx.lineWidth = 2.6 * z;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x + 3 * z, avY - 11.5 * z);
            ctx.lineTo(handBaseX + Math.cos(rodAngle) * 3.2 * z, handBaseY + Math.sin(rodAngle) * 3.2 * z);
            ctx.stroke();

            // Motion swoosh arc during the forward whip cast (0.24s - 0.58s)
            if (fishAgeSec >= 0.22 && fishAgeSec <= 0.62) {
              const swooshAlpha = 1 - Math.abs(fishAgeSec - 0.42) / 0.22;
              ctx.strokeStyle = `rgba(224, 242, 254, ${Math.max(0, swooshAlpha * 0.75)})`;
              ctx.lineWidth = 2.2 * z;
              ctx.beginPath();
              ctx.arc(handBaseX, handBaseY, rodLen * 0.9, -2.05, rodAngle, false);
              ctx.stroke();
            }

            // Wooden bamboo fishing rod shaft & spinning reel
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.1 * z;
            ctx.beginPath();
            ctx.moveTo(handBaseX, handBaseY);
            ctx.lineTo(rodMidX, rodMidY);
            ctx.stroke();

            // Flexible fiberglass rod tip
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(rodMidX, rodMidY);
            ctx.quadraticCurveTo(
              (rodMidX + rodTipX) * 0.5 + 1.5 * z,
              (rodMidY + rodTipY) * 0.5 - 2.5 * z,
              rodTipX,
              rodTipY
            );
            ctx.stroke();

            // Small golden spinning reel near handle
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(
              handBaseX + Math.cos(rodAngle) * 4.5 * z,
              handBaseY + Math.sin(rodAngle) * 4.5 * z + 1.2 * z,
              1.6 * z,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Bobber & fishing line trajectory (Parabolic cast flight -> splash -> floating bobber)
            const targetBobberX = pt.x + 36 * z;
            const targetBobberY = avY + (4 + Math.sin(elapsed * 6) * 2.5) * z;

            let bobberX = targetBobberX;
            let bobberY = targetBobberY;
            let isInWater = true;

            if (fishAgeSec < 0.36) {
              // During wind-up & early whip, bobber hangs close to rod tip
              isInWater = false;
              bobberX = rodTipX + Math.cos(rodAngle + 0.5) * 4.5 * z;
              bobberY = rodTipY + 5.5 * z;
            } else if (fishAgeSec < 0.85) {
              // Parabolic arc flight from rod tip into the pond water
              isInWater = false;
              const flightP = (fishAgeSec - 0.36) / 0.49;
              const startX = handBaseX + 16 * z;
              const startY = handBaseY - 18 * z;
              bobberX = startX + (targetBobberX - startX) * flightP;
              const arcLift = Math.sin(flightP * Math.PI) * 14 * z;
              bobberY = startY + (targetBobberY - startY) * flightP - arcLift;
            }

            // Fishing line from rod tip to bobber
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.78)';
            ctx.lineWidth = 0.85 * z;
            ctx.beginPath();
            ctx.moveTo(rodTipX, rodTipY);
            if (!isInWater) {
              ctx.lineTo(bobberX, bobberY);
            } else {
              ctx.quadraticCurveTo(
                (rodTipX + bobberX) * 0.5,
                (rodTipY + bobberY) * 0.5 + 3 * z,
                bobberX,
                bobberY
              );
            }
            ctx.stroke();

            // Red & White Fishing Bobber
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(bobberX, bobberY, 2.6 * z, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bobberX, bobberY, 2.6 * z, 0, Math.PI);
            ctx.fill();

            // Initial Water Impact Splash Ring & Droplets (0.85s - 1.30s)
            if (fishAgeSec >= 0.85 && fishAgeSec < 1.3) {
              const spP = (fishAgeSec - 0.85) / 0.45;
              ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - spP) * 0.9})`;
              ctx.lineWidth = 1.4 * z;
              ctx.beginPath();
              ctx.ellipse(bobberX, bobberY + 1.5 * z, (3 + spP * 12) * z, (1.5 + spP * 5.5) * z, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Flying water droplets on splash impact
              ctx.fillStyle = `rgba(186, 230, 253, ${1 - spP})`;
              for (let dp = -1; dp <= 1; dp += 2) {
                const dx = bobberX + dp * (2.5 + spP * 7) * z;
                const dy = bobberY - Math.sin(spP * Math.PI) * 6.5 * z;
                ctx.beginPath();
                ctx.arc(dx, dy, 1.1 * z, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Continuous Pond Ripples & Nibbling Splashes once Bobber is in Water
            if (isInWater) {
              const bPhase = (elapsed * 1.5) % 1;
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 * (1 - bPhase)})`;
              ctx.lineWidth = 0.8 * z;
              ctx.beginPath();
              ctx.ellipse(bobberX, bobberY + 2 * z, (3 + bPhase * 8) * z, (1.5 + bPhase * 4) * z, 0, 0, Math.PI * 2);
              ctx.stroke();

              if (Math.sin(elapsed * 6) > 0.6) {
                ctx.fillStyle = '#38bdf8';
                ctx.beginPath();
                ctx.arc(bobberX - 2 * z, bobberY - 3 * z, 0.8 * z, 0, Math.PI * 2);
                ctx.arc(bobberX + 3 * z, bobberY - 4 * z, 1 * z, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // 6. TRANSPARENT USERNAME TAG PILL (Teachers show ONLY their name differentiated by golden-amber color; citizens have subtle transparent tags)
          const tagPosY = avY - 28 * z;
          let labelText = `@${av.handle}`;
          if (isTeacherAvatar) {
            // Guru: hanya nama saja dan dibedakan dengan warnanya
            labelText = `@${av.handle}`;
          } else if (item.isPlayer) {
            labelText = `@${av.handle}`;
          } else if (av.isOnlineRemote) {
            labelText = `@${av.handle}`;
          } else if (av.role === 'penjaga_kota') {
            labelText = `@surya`;
          } else if (av.role === 'penjaga_lab') {
            labelText = `@malik`;
          } else if (av.role === 'barista') {
            labelText = `@ma_uba`;
          } else if (av.role === 'penjaga_literasi') {
            labelText = `@patra`;
          } else if (av.role === 'penjaga_kolam') {
            labelText = `@tomi`;
          } else if (av.role === 'kepala_balai') {
            labelText = `@sony`;
          }

          ctx.font = `${isTeacherAvatar ? 'bold' : '600'} ${Math.round((isTeacherAvatar ? 8.5 : 7.8) * z)}px sans-serif`;
          const tM = ctx.measureText(labelText);
          const tW = tM.width + 9 * z;
          const tH = 13.5 * z;

          // Lightweight Transparent Pill Background so it never clutters the city view
          ctx.fillStyle = isTeacherAvatar
            ? 'rgba(120, 53, 15, 0.45)'
            : 'rgba(15, 23, 42, 0.28)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tW / 2, tagPosY - tH / 2, tW, tH, 6.5 * z);
          ctx.fill();

          if (isTeacherAvatar) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();
            ctx.fillStyle = '#fde047';
          } else if (item.isPlayer) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
            ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
          } else if (av.isOnlineRemote) {
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.42)';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
            ctx.fillStyle = 'rgba(209, 250, 229, 0.92)';
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();
            ctx.fillStyle = 'rgba(241, 245, 249, 0.78)';
          }

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(labelText, pt.x, tagPosY);

          // 7. COMIC SPEECH BUBBLE (Floats cleanly above nametag)
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

          // 8. FLOATING EMOTE BADGE & PARTICLES (Suka ❤️, Lambai 👋, Tertawa 😂, Joget 🎵)
          if (activeEmote && Date.now() < activeEmote.expiresAt) {
            const emoteBounce = Math.sin(elapsed * 7) * 2.5 * z;
            const baseEmoteY = speech ? tagPosY - 34 * z : tagPosY - 14 * z;
            const emoteY = baseEmoteY + emoteBounce;

            // Floating Emote Bubble with Glow
            const badgeR = 12 * z;
            ctx.save();
            ctx.shadowColor =
              activeEmote.type === 'love'
                ? 'rgba(244, 63, 94, 0.7)'
                : activeEmote.type === 'dance'
                ? 'rgba(168, 85, 247, 0.7)'
                : activeEmote.type === 'laugh'
                ? 'rgba(245, 158, 11, 0.7)'
                : 'rgba(14, 165, 233, 0.7)';
            ctx.shadowBlur = 9 * z;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x, emoteY, badgeR, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle =
              activeEmote.type === 'love'
                ? '#f43f5e'
                : activeEmote.type === 'dance'
                ? '#a855f7'
                : activeEmote.type === 'laugh'
                ? '#f59e0b'
                : '#0284c7';
            ctx.lineWidth = 1.6 * z;
            ctx.stroke();
            ctx.restore();

            // Emote Icon
            ctx.font = `${Math.round(13 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(activeEmote.icon, pt.x, emoteY + 0.6 * z);

            // Particles Depending on Emote Type
            if (isDancingNow) {
              // Rising musical notes 🎵 🎶 ✨
              const notes = ['🎵', '🎶', '✨', '🎵'];
              for (let ni = 0; ni < notes.length; ni++) {
                const noteProgress = (elapsed * 1.5 + ni * 0.25) % 1;
                const noteX = pt.x + Math.sin(elapsed * 4 + ni * 1.7) * 16 * z;
                const noteY = emoteY - 10 * z - noteProgress * 24 * z;
                ctx.save();
                ctx.globalAlpha = Math.sin(noteProgress * Math.PI) * 0.95;
                ctx.font = `bold ${Math.round(11 * z)}px sans-serif`;
                ctx.fillText(notes[ni], noteX, noteY);
                ctx.restore();
              }
            } else if (isLovingNow) {
              // Floating hearts ❤️ 💕 ✨
              const hearts = ['❤️', '💕', '✨', '💖'];
              for (let hi = 0; hi < hearts.length; hi++) {
                const hProgress = (elapsed * 1.4 + hi * 0.25) % 1;
                const hX = pt.x + Math.sin(elapsed * 3.5 + hi * 1.8) * 14 * z;
                const hY = emoteY - 8 * z - hProgress * 22 * z;
                ctx.save();
                ctx.globalAlpha = Math.sin(hProgress * Math.PI) * 0.92;
                ctx.font = `${Math.round(10 * z)}px sans-serif`;
                ctx.fillText(hearts[hi], hX, hY);
                ctx.restore();
              }
            } else if (isLaughingNow) {
              // Laugh tears and giggles 😂 ✨ 💨
              const laughs = ['😂', '✨', '💨', '✨'];
              for (let li = 0; li < laughs.length; li++) {
                const lProgress = (elapsed * 1.8 + li * 0.25) % 1;
                const lX = pt.x + Math.sin(elapsed * 5 + li * 2) * 15 * z;
                const lY = emoteY - 8 * z - lProgress * 20 * z;
                ctx.save();
                ctx.globalAlpha = Math.sin(lProgress * Math.PI) * 0.9;
                ctx.font = `${Math.round(10 * z)}px sans-serif`;
                ctx.fillText(laughs[li], lX, lY);
                ctx.restore();
              }
            } else if (isWavingNow) {
              // Wave sparkles ✨ 👋
              const sparkles = ['✨', '👋', '✨'];
              for (let wi = 0; wi < sparkles.length; wi++) {
                const wProgress = (elapsed * 1.5 + wi * 0.33) % 1;
                const wX = pt.x + 8 * z + Math.sin(elapsed * 4 + wi) * 10 * z;
                const wY = emoteY - 6 * z - wProgress * 18 * z;
                ctx.save();
                ctx.globalAlpha = Math.sin(wProgress * Math.PI) * 0.9;
                ctx.font = `${Math.round(9 * z)}px sans-serif`;
                ctx.fillText(sparkles[wi], wX, wY);
                ctx.restore();
              }
            }
          }
        } else if (item.type === 'lamp') {
          // STREET LAMP POST (Cast Iron Classical Lamppost with Warm Glowing Lantern)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const lampHeight = 35 * z;

          const distToPlayer = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          const isLampTransparent = distToPlayer < 1.2;
          ctx.save();
          if (isLampTransparent) {
            ctx.globalAlpha = 0.45;
          }

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

          const isLampLit = currentPeriod === 'malam' || currentPeriod === 'subuh' || currentPeriod === 'sore';

          if (isLampLit) {
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

          ctx.restore();
        }
      });

      // -----------------------------------------------------------
      // MINIMALIST WATER ARC EFFECT FROM AVATAR TO TREE (1.0s)
      // -----------------------------------------------------------
      if (activeWaterSprayRef.current) {
        const spray = activeWaterSprayRef.current;
        const sprayElapsed = (currentTime - spray.startTime) / 1000;
        if (sprayElapsed >= 0 && sprayElapsed < 1.0) {
          const fade = 1 - sprayElapsed / 1.0;
          const z = zoomLevelRef.current;
          const avPt = toScreen(spray.avatarWx, spray.avatarWy, 12, camera.x, camera.y);
          const treePt = toScreen(spray.treeWx, spray.treeWy, 36, camera.x, camera.y);

          ctx.save();
          const midX = (avPt.x + treePt.x) / 2;
          const midY = Math.min(avPt.y, treePt.y) - 24 * z;

          // Clean minimalist thin sky-blue water stream
          ctx.strokeStyle = `rgba(125, 211, 252, ${0.65 * fade})`;
          ctx.lineWidth = 1.4 * z;
          ctx.setLineDash([3 * z, 3 * z]);
          ctx.beginPath();
          ctx.moveTo(avPt.x, avPt.y);
          ctx.quadraticCurveTo(midX, midY, treePt.x, treePt.y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.restore();
        } else {
          activeWaterSprayRef.current = null;
        }
      }

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
      playerRef.current = null;
    };
  }, [studentName, studentGender, isTeacher]);

  // -------------------------------------------------------------
  // KAFE ITEM PURCHASES (Deduct XP Saldo & Auto-Expire: Kopi 90s, Roti 60s, Eskrim 30s)
  // -------------------------------------------------------------
  const handleBuyCoffee = () => {
    const cost = 2;
    if (studentPoints < cost) {
      sounds.playClick();
      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP, saldo kamu ${studentPoints} XP.`, 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Kopi Hangat Kafe') : true;
    if (success) {
      sounds.playRewardXp();
      setIsCafeMenuOpen(false);
      setPendingConfirmation(null);
      equipHeldItem('kopi'); // Hilang otomatis dari tangan dalam 90 detik
      const remaining = studentPoints - cost;
      showToast(`☕ Menikmati kopi hangat! (-2 XP • 90 detik) • Sisa Saldo: ${remaining} XP`, 3600);
      baristaSpeechRef.current = {
        text: `Kopi hangat siap, selamat menikmati! ☕ (-2 XP)`,
        expiresAt: Date.now() + 5000,
      };
      playerSpeechRef.current = {
        text: 'Mantap kopinya! ☕',
        expiresAt: Date.now() + 5000,
      };
    }
  };

  const handleBuyBread = () => {
    const cost = 1;
    if (studentPoints < cost) {
      sounds.playClick();
      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP, saldo kamu ${studentPoints} XP.`, 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Roti Panggang Kafe') : true;
    if (success) {
      sounds.playRewardXp();
      setIsCafeMenuOpen(false);
      setPendingConfirmation(null);
      equipHeldItem('roti'); // Hilang otomatis dari tangan dalam 60 detik
      const remaining = studentPoints - cost;
      showToast(`🍞 Roti lezat baru dipanggang! (-1 XP • 60 detik) • Sisa Saldo: ${remaining} XP`, 3600);
      baristaSpeechRef.current = {
        text: `Roti hangat baru dipanggang! 🍞 (-1 XP)`,
        expiresAt: Date.now() + 5000,
      };
      playerSpeechRef.current = {
        text: 'Enak banget rotinya! 🍞',
        expiresAt: Date.now() + 5000,
      };
    }
  };

  const handleBuyIceCream = () => {
    const cost = 1;
    if (studentPoints < cost) {
      sounds.playClick();
      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP, saldo kamu ${studentPoints} XP.`, 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Eskrim Kafe') : true;
    if (success) {
      sounds.playRewardXp();
      setIsCafeMenuOpen(false);
      setPendingConfirmation(null);
      equipHeldItem('eskrim'); // Hilang otomatis dari tangan dalam 30 detik
      const remaining = studentPoints - cost;
      showToast(`🍦 Eskrim manis menyegarkan! (-1 XP • 30 detik) • Sisa Saldo: ${remaining} XP`, 3600);
      baristaSpeechRef.current = {
        text: `Eskrim manis spesial untukmu! 🍦 (-1 XP)`,
        expiresAt: Date.now() + 5000,
      };
      playerSpeechRef.current = {
        text: 'Segar banget eskrimnya! 🍦',
        expiresAt: Date.now() + 5000,
      };
    }
  };

  // -------------------------------------------------------------
  // TREE WATERING ACTION (3x Siram -> Muncul Buah Apel 15 Detik -> Hilang Otomatis)
  // -------------------------------------------------------------
  const handleWaterTree = (treeIdx: number) => {
    const nowPerf = performance.now();
    const existingCycle = treeCyclesRef.current[treeIdx];
    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);

    // Check if tree is currently in its 15-second apple fruiting phase
    if (existingCycle && existingCycle.appleStartTime !== null) {
      const appleElapsed = (nowPerf - existingCycle.appleStartTime) / 1000;
      if (appleElapsed < 15.0) {
        const secsLeft = Math.max(1, Math.ceil(15.0 - appleElapsed));
        sounds.playClick();
        showToast(`🍎 Pohon sedang berbuah apel merah! Siklus baru dapat dimulai dalam ${secsLeft} detik.`, 3000);
        return;
      }
    }

    const cost = 1;
    if (studentPoints < cost) {
      sounds.playClick();
      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP untuk menyiram pohon (saldo kamu ${studentPoints} XP).`, 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Menyiram Pohon Hijau') : true;
    if (success) {
      sounds.playRewardXp();
      const remaining = studentPoints - cost;
      const prevCount =
        existingCycle && existingCycle.appleStartTime === null && existingCycle.count < 3
          ? existingCycle.count
          : 0;
      const nextCount = prevCount + 1;
      const isThirdWatering = nextCount >= 3;

      const updatedCycle: TreeWaterCycle = {
        count: nextCount,
        lastWateredTime: nowPerf,
        appleStartTime: isThirdWatering ? nowPerf : null,
      };

      treeCyclesRef.current[treeIdx] = updatedCycle;
      setTreeCycles((prev) => ({ ...prev, [treeIdx]: updatedCycle }));

      const treePos = TREES_LIST[treeIdx] || [0, 0];
      activeWaterSprayRef.current = {
        treeIndex: treeIdx,
        startTime: nowPerf,
        avatarWx: playerRef.current ? playerRef.current.wx : 0,
        avatarWy: playerRef.current ? playerRef.current.wy : 0,
        treeWx: treePos[0],
        treeWy: treePos[1],
      };

      if (isThirdWatering) {
        showToast(`🍎 Siraman ke-3 (3/3)! Pohon berbuah apel merah segar selama 15 detik (-1 XP) • Sisa: ${remaining} XP`, 3500);
        playerSpeechRef.current = {
          text: 'Siraman ke-3! Pohonnya berbuah apel 🍎✨',
          expiresAt: Date.now() + 4500,
        };
        // Schedule UI state sync after 15 seconds when apples disappear
        window.setTimeout(() => {
          const resetCycle: TreeWaterCycle = { count: 0, lastWateredTime: 0, appleStartTime: null };
          treeCyclesRef.current[treeIdx] = resetCycle;
          setTreeCycles((prev) => ({ ...prev, [treeIdx]: resetCycle }));
        }, 15000);
      } else {
        showToast(`💧 Pohon disiram (${nextCount}/3)! Siram ${3 - nextCount}x lagi agar muncul buah apel (-1 XP) • Sisa: ${remaining} XP`, 3500);
        playerSpeechRef.current = {
          text: `Menyiram pohon (${nextCount}/3) 💧🌱`,
          expiresAt: Date.now() + 3500,
        };
      }
      sendHeartbeatRef.current?.();
    }
  };

  // -------------------------------------------------------------
  // FISHING ACTION (-3 XP Saldo with animation)
  // -------------------------------------------------------------
  const FISH_REWARDS = [
    { name: 'Ikan Mas Refleksi', icon: '🐠' },
    { name: 'Gurame DKV Kreatif', icon: '🐟' },
    { name: 'Udang Windu Danau', icon: '🦐' },
    { name: 'Ikan Nila Juara', icon: '🐡' },
    { name: 'Botol Berisi Pesan Bijak', icon: '📜' },
  ];

  const handleStartFishing = () => {
    if (isFishing) return;
    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);
    const cost = 3;
    if (studentPoints < cost) {
      sounds.playClick();
      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP untuk memancing (saldo kamu ${studentPoints} XP).`, 3500);
      return;
    }

    const success = onDeductPoints ? onDeductPoints(cost, 'Memancing Ikan Kota') : true;
    if (success) {
      sounds.playClick();
      fishingStartTimeRef.current = performance.now();
      setIsFishing(true);
      showToast('🎣 Mengayunkan joran & melempar kail ke Kolam Pancing... (-3 XP)', 3500);
      playerSpeechRef.current = {
        text: 'Mancing dulu ah, semoga dapat ikan besar! 🎣',
        expiresAt: Date.now() + 3500,
      };

      if (fishingTimerRef.current) clearTimeout(fishingTimerRef.current);
      fishingTimerRef.current = window.setTimeout(() => {
        setIsFishing(false);
        sounds.playRewardXp();
        const randomCatch = FISH_REWARDS[Math.floor(Math.random() * FISH_REWARDS.length)];
        showToast(`🎉 Hore! Kamu berhasil menangkap ${randomCatch.icon} ${randomCatch.name}!`, 4500);
        playerSpeechRef.current = {
          text: `Dapat ${randomCatch.name}! Hore! 🎣✨`,
          expiresAt: Date.now() + 5000,
        };
      }, 3500);
    }
  };

  // Check if cafeToast is a standalone notification (buying from cafe, standing up, or jumping to citizen)
  // vs contextual feedback that belongs inside the active nearbyAction card
  const isStandaloneToast = Boolean(
    cafeToast &&
      (cafeToast.startsWith('☕') ||
        cafeToast.startsWith('🍞') ||
        cafeToast.startsWith('🍦') ||
        cafeToast.startsWith('🧭') ||
        cafeToast.startsWith('🚶'))
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden touch-none"
      data-testid="town-canvas-reference-exact"
    >
      {/* Isometric Canvas */}
      <canvas ref={canvasRef} className="block w-full h-full" />

      {/* ============================================================= */}
      {/* UNIFIED NON-OVERLAPPING TOP HUD STACK (HP & LAPTOP)           */}
      {/* Row 1: Warga Online + Held Item Countdown Pill                */}
      {/* Row 2: Single Mutually-Exclusive Popup / Action / Toast Slot  */}
      {/* ============================================================= */}
      <div className="absolute top-12 sm:top-14 left-2.5 right-2.5 sm:left-4 sm:right-4 z-30 pointer-events-none flex flex-col gap-2">
        {/* ROW 1: STATUS PILLS (Left: Warga Online & Radar | Right: Active Held Item + Countdown) */}
        <div className="w-full flex flex-wrap items-start justify-between gap-1.5">
          {/* Left: Online Citizens Badge & Quick Teleport Chips */}
          <div className="flex flex-col items-start gap-1 max-w-[62vw] sm:max-w-[380px] pointer-events-auto">
            <div className="bg-[#121e2c]/92 backdrop-blur-md border border-emerald-500/45 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 text-white text-[10px] sm:text-[11px] font-bold shadow-lg flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-300 font-mono">{onlineCount}</span>
              <span className="text-slate-200">Warga Online</span>
            </div>

            {onlineRemoteList.length > 0 && (
              <div className="flex flex-wrap items-center gap-1">
                {onlineRemoteList.slice(0, 6).map((cit) => (
                  <button
                    key={cit.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      const rem = remotePlayersRef.current.get(cit.id);
                      if (rem && playerRef.current) {
                        if (isSittingRef.current) {
                          setIsSitting(false);
                          setSittingSeat(null);
                        }
                        playerRef.current.targetWx = Math.max(-6.5, Math.min(6.5, rem.wx + 0.55));
                        playerRef.current.targetWy = Math.max(-6.5, Math.min(6.5, rem.wy + 0.35));
                        playerRef.current.isMoving = true;
                        clickRippleRef.current = {
                          wx: playerRef.current.targetWx,
                          wy: playerRef.current.targetWy,
                          time: performance.now(),
                        };
                        sendHeartbeatRef.current?.();
                        showToast(`🧭 Menuju lokasi ${cit.role === 'guru' ? 'Guru' : 'Siswa'} @${cit.handle}`, 2500);
                      }
                    }}
                    className={`px-2 py-0.5 rounded-full text-[9.5px] sm:text-[10px] font-bold border shadow-md backdrop-blur-md flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                      cit.role === 'guru'
                        ? 'bg-amber-950/90 border-amber-400/60 text-amber-200 hover:bg-amber-900/90'
                        : 'bg-[#121e2c]/90 border-emerald-400/50 text-emerald-200 hover:bg-slate-800/90'
                    }`}
                    title={`Klik untuk menghampiri ${cit.name} (@${cit.handle})`}
                  >
                    <span>{cit.role === 'guru' ? '👨‍🏫' : '👦'}</span>
                    <span className="truncate max-w-[75px] sm:max-w-[90px]">@{cit.handle}</span>
                    <span className="text-[8.5px] opacity-85">
                      {cit.isSitting ? '🪑' : cit.isMoving ? '🚶' : '🟢'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Held Item Badge with Live Auto-Disappear Countdown (90s Kopi, 60s Roti, 30s Eskrim) */}
          {heldItem && (
            <div className="pointer-events-auto bg-[#121e2c]/95 backdrop-blur-md border border-amber-400/50 rounded-full px-2.5 sm:px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-amber-200 shadow-xl animate-fade-in-down ml-auto shrink-0">
              <span className="text-sm sm:text-base">
                {heldItem === 'kopi' ? '☕' : heldItem === 'roti' ? '🥐' : '🍦'}
              </span>
              <span className="text-[10.5px] sm:text-xs whitespace-nowrap">
                {heldItem === 'kopi' ? 'Kopi Hangat' : heldItem === 'roti' ? 'Roti Panggang' : 'Eskrim Segar'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300">
                {heldItemRemainingSec}d
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  equipHeldItem(null);
                }}
                className="w-4 h-4 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
                title="Habiskan / Simpan"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ROW 2: SINGLE MUTUALLY-EXCLUSIVE POPUP SLOT (Never overlaps on Mobile HP or Laptop) */}
        <div className="w-full flex justify-center">
          {isCafeMenuOpen ? (
            /* 1. MENU TOKO ROTI & KAFE */
            <aside
              aria-label="Menu Toko Roti & Kafe"
              className="w-full max-w-md pointer-events-auto animate-fade-in-down"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#121e2c]/95 backdrop-blur-md text-white px-3.5 py-3 rounded-2xl border border-amber-400/50 shadow-[0_12px_36px_rgba(0,0,0,0.8)] flex flex-col items-center gap-2.5">
                <div className="w-full flex items-center justify-between border-b border-slate-700/70 pb-1.5">
                  <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5 whitespace-nowrap">
                    <span>☕</span>
                    <span className="font-extrabold text-white">Toko Roti & Kafe Warga</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-amber-400 font-mono text-[11px]">🪙 {studentPoints} XP</span>
                  </div>
                  <button
                    onClick={() => setIsCafeMenuOpen(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Tutup Menu Kafe"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {cafeToast && (
                  <div className="w-full text-center text-[11px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/40 rounded-xl px-2.5 py-1">
                    {cafeToast}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 w-full">
                  <button
                    onClick={handleBuyCoffee}
                    className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                  >
                    <span className="text-lg">☕</span>
                    <span className="text-[11px] mt-0.5">Kopi (-2 XP)</span>
                    <span className="text-[9.5px] text-emerald-200/90 font-normal">Tahan 90 detik</span>
                  </button>
                  <button
                    onClick={handleBuyBread}
                    className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                  >
                    <span className="text-lg">🍞</span>
                    <span className="text-[11px] mt-0.5">Roti (-1 XP)</span>
                    <span className="text-[9.5px] text-emerald-200/90 font-normal">Tahan 60 detik</span>
                  </button>
                  <button
                    onClick={handleBuyIceCream}
                    className="bg-[#245e54] hover:bg-[#2d7569] active:scale-95 text-white px-2.5 py-2 rounded-xl text-xs font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                  >
                    <span className="text-lg">🍦</span>
                    <span className="text-[11px] mt-0.5">Eskrim (-1 XP)</span>
                    <span className="text-[9.5px] text-emerald-200/90 font-normal">Tahan 30 detik</span>
                  </button>
                </div>
              </div>
            </aside>
          ) : isStandaloneToast && cafeToast ? (
            /* 2. STANDALONE TOAST (Pembelian Kopi/Roti/Eskrim, Berdiri, atau Navigasi Warga) */
            <div
              role="status"
              className="pointer-events-auto bg-[#121e2c]/95 backdrop-blur-md text-emerald-300 font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl border border-emerald-500/45 shadow-2xl animate-fade-in-down flex items-center gap-2 max-w-md text-center"
            >
              <span>✨</span>
              <span>{cafeToast}</span>
              <button
                onClick={() => showToast(null, 0)}
                className="ml-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            </div>
          ) : pendingConfirmation ? (
            /* 3. POP-UP KONFIRMASI MASUK BANGUNAN / KAFE */
            <aside
              aria-label="Konfirmasi Masuk Bangunan"
              className="w-full max-w-md pointer-events-auto animate-fade-in-down"
            >
              <div className="bg-[#121e2c]/95 backdrop-blur-md border border-amber-400/50 rounded-2xl p-2.5 sm:p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.8)] flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-500/20 via-slate-800 to-amber-500/20 border border-amber-400/40 flex items-center justify-center text-lg sm:text-xl shrink-0 shadow-sm">
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
          ) : nearbyAction ? (
            /* 4. POP-UP AKSI KONTEKSTUAL (POHON, LITERASI, DUDUK/AYUNAN, MEMANCING) DENGAN STATUS INLINE TANPA MENIMPA */
            <aside
              aria-label="Aksi Lingkungan Kota"
              className="w-full max-w-md pointer-events-auto animate-fade-in-down"
            >
              {nearbyAction.type === 'tree' ? (
                <div className="bg-[#121e2c]/95 backdrop-blur-md border border-emerald-400/50 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {treeCycles[nearbyAction.treeIndex || 0]?.appleStartTime ? '🍎' : '🌳'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                        Pohon Rindang Kota • Siklus {treeCycles[nearbyAction.treeIndex || 0]?.count || 0}/3
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {treeCycles[nearbyAction.treeIndex || 0]?.appleStartTime
                          ? 'Sedang Berbuah Apel (15d)'
                          : `Siram Pohon (${treeCycles[nearbyAction.treeIndex || 0]?.count || 0}/3)`}
                      </h4>
                      <p className={`text-[10px] truncate ${cafeToast ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>
                        {cafeToast ||
                          (treeCycles[nearbyAction.treeIndex || 0]?.appleStartTime
                            ? 'Buah apel merah hilang otomatis setelah 15 detik'
                            : 'Siram 3 kali agar pohon mengeluarkan buah apel')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleWaterTree(nearbyAction.treeIndex || 0)}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold border border-emerald-400/40 shadow-md transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>💧 Siram ({Math.min(3, (treeCycles[nearbyAction.treeIndex || 0]?.count || 0) + 1)}/3)</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-500/30">
                      -1 XP
                    </span>
                  </button>
                </div>
              ) : nearbyAction.type === 'literacy' ? (
                <div className="bg-[#121e2c]/95 backdrop-blur-md border border-cyan-400/50 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl shrink-0 shadow-sm">
                      📖
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-cyan-400">
                        Sudut Literasi Warga
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        Baca Buku & Majalah DKV
                      </h4>
                      <p className={`text-[10px] truncate ${cafeToast ? 'text-cyan-300 font-semibold' : 'text-slate-300'}`}>
                        {cafeToast || 'Komik, Majalah, atau Koran (-1 XP)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playOpenModal();
                      setIsLiteracyModalOpen(true);
                    }}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold border border-cyan-400/40 shadow-md transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>📖 Baca</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-cyan-950/80 px-1 py-0.5 rounded border border-cyan-500/30">
                      -1 XP
                    </span>
                  </button>
                </div>
              ) : nearbyAction.type === 'bench' ? (
                <div className="bg-[#121e2c]/95 backdrop-blur-md border border-amber-400/50 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-xl shrink-0 shadow-sm">
                      {nearbyAction.benchId?.startsWith('swing')
                        ? '🎠'
                        : nearbyAction.benchId?.startsWith('campfire')
                        ? '🔥'
                        : '🪑'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-amber-400">
                        {nearbyAction.benchName || 'Kursi Taman'}
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {nearbyAction.benchId?.startsWith('swing')
                          ? isSittingRef.current
                            ? 'Sedang Naik Ayunan'
                            : 'Naik & Berayun (-1 XP)'
                          : nearbyAction.benchId?.startsWith('campfire')
                          ? isSittingRef.current
                            ? 'Menghangatkan Tubuh di Api Unggun'
                            : 'Duduk Menghangatkan Tubuh'
                          : isSittingRef.current
                          ? 'Sedang Duduk Santai'
                          : 'Duduk Santai (Muat 2 Orang)'}
                      </h4>
                      <p className={`text-[10px] truncate ${cafeToast ? 'text-amber-300 font-semibold' : 'text-slate-300'}`}>
                        {cafeToast ||
                          (nearbyAction.benchId?.startsWith('swing')
                            ? 'Setiap warga yang naik ayunan membayar 1 XP'
                            : nearbyAction.benchId?.startsWith('campfire')
                            ? 'Hangatkan tubuh bersama warga di sudut api unggun'
                            : 'Bangku minimalis air mancur muat untuk 2 orang')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      if (isSittingRef.current) {
                        const wasSwing = sittingSeatRef.current?.startsWith('swing');
                        const wasCampfire = sittingSeatRef.current?.startsWith('campfire');
                        setIsSitting(false);
                        setSittingSeat(null);
                        showToast(
                          wasSwing
                            ? '🚶 Turun dari ayunan taman.'
                            : wasCampfire
                            ? '🚶 Berdiri dari bangku penghangat api unggun.'
                            : '🚶 Berdiri kembali dari bangku taman.',
                          2200
                        );
                        sendHeartbeatRef.current?.();
                      } else {
                        const seat = nearbyAction.benchId || 'fountain_1_a';
                        if (seat.startsWith('swing')) {
                          const targetSwing = REFLECTION_SWINGS.find((s) => s.id === seat) || REFLECTION_SWINGS[0];
                          rideSwingWithXp(targetSwing);
                        } else {
                          const matchedGroup = ALL_TWO_PERSON_BENCHES.find((g) =>
                            g.seats.some((s) => s.id === seat)
                          );
                          if (matchedGroup) {
                            const slotIdx: 0 | 1 = matchedGroup.seats[1].id === seat ? 1 : 0;
                            sitOnTwoPersonBench(matchedGroup, slotIdx);
                          } else if (seat === 'literacy' && playerRef.current) {
                            sitOnTwoPersonBench(LITERACY_BENCHES[0], 0);
                          }
                        }
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold border border-amber-400/40 shadow-md transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>
                      {nearbyAction.benchId?.startsWith('swing')
                        ? isSittingRef.current
                          ? '🚶 Turun'
                          : '🎠 Naik Ayunan'
                        : nearbyAction.benchId?.startsWith('campfire')
                        ? isSittingRef.current
                          ? '🚶 Berdiri'
                          : '🔥 Hangatkan'
                        : isSittingRef.current
                        ? '🚶 Berdiri'
                        : '🪑 Duduk'}
                    </span>
                    {nearbyAction.benchId?.startsWith('swing') && !isSittingRef.current && (
                      <span className="text-[10px] font-mono text-amber-200 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-400/30">
                        -1 XP
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-[#121e2c]/95 backdrop-blur-md border border-sky-400/50 rounded-2xl p-2.5 sm:p-3 shadow-xl flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-xl shrink-0 shadow-sm">
                      🎣
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold tracking-wider uppercase text-sky-400">
                        Dermaga Air Kota
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {isFishing ? 'Sedang Memancing Ikan...' : 'Spot Memancing Warga'}
                      </h4>
                      <p className={`text-[10px] truncate ${cafeToast ? 'text-sky-300 font-semibold' : 'text-slate-300'}`}>
                        {cafeToast || 'Santai memancing & dapatkan ikan unik'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleStartFishing}
                    disabled={isFishing}
                    className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white text-xs font-bold border border-sky-400/40 shadow-md transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>{isFishing ? '⏳ Menunggu...' : '🎣 Mancing'}</span>
                    <span className="text-[10px] font-mono text-amber-300 bg-sky-950/80 px-1 py-0.5 rounded border border-sky-500/30">
                      -3 XP
                    </span>
                  </button>
                </div>
              )}
            </aside>
          ) : cafeToast ? (
            /* 5. FALLBACK SINGLE TOAST NOTIFICATION */
            <div
              role="status"
              className="pointer-events-auto bg-[#121e2c]/95 backdrop-blur-md text-emerald-300 font-bold text-xs sm:text-sm px-4 py-2 rounded-2xl border border-emerald-500/45 shadow-2xl animate-fade-in-down flex items-center gap-2 max-w-md text-center"
            >
              <span>✨</span>
              <span>{cafeToast}</span>
              <button
                onClick={() => showToast(null, 0)}
                className="ml-1 text-slate-400 hover:text-white text-xs cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* LITERACY READING CORNER MODAL (-1 XP for Komik, Majalah, Koran) */}
      {isLiteracyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setIsLiteracyModalOpen(false)}
        >
          <div
            className="bg-[#121e2c] border border-cyan-500/50 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 text-xl font-black">
                  📖
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">Sudut Literasi Warga</h3>
                  <p className="text-[11px] text-slate-400">Pilih bahan bacaan kreatif DKV • Biaya: 1 XP</p>
                </div>
              </div>
              <button
                onClick={() => setIsLiteracyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
              <button
                type="button"
                onClick={() => {
                  const cost = 1;
                  if (studentPoints < cost) {
                    sounds.playClick();
                    showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP.`, 3000);
                    return;
                  }
                  const success = onDeductPoints ? onDeductPoints(cost, 'Baca Komik DKV') : true;
                  if (success) {
                    sounds.playRewardXp();
                    setActiveLiteracyDoc('komik');
                    setIsSitting(true);
                    setSittingSeat('literacy_1_a');
                    if (playerRef.current) {
                      playerRef.current.wx = -3.72;
                      playerRef.current.wy = 1.52;
                      playerRef.current.targetWx = -3.72;
                      playerRef.current.targetWy = 1.52;
                      playerRef.current.isMoving = false;
                    }
                    showToast('📚 Membaca Komik Desain Kreatif (-1 XP)', 3000);
                  }
                }}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  activeLiteracyDoc === 'komik'
                    ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-2xl">📚</span>
                <span className="text-xs font-extrabold">Komik DKV</span>
                <span className="text-[9px] text-amber-300 font-mono">-1 XP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const cost = 1;
                  if (studentPoints < cost) {
                    sounds.playClick();
                    showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP.`, 3000);
                    return;
                  }
                  const success = onDeductPoints ? onDeductPoints(cost, 'Baca Majalah Desain') : true;
                  if (success) {
                    sounds.playRewardXp();
                    setActiveLiteracyDoc('majalah');
                    setIsSitting(true);
                    setSittingSeat('literacy_1_a');
                    if (playerRef.current) {
                      playerRef.current.wx = -3.72;
                      playerRef.current.wy = 1.52;
                      playerRef.current.targetWx = -3.72;
                      playerRef.current.targetWy = 1.52;
                      playerRef.current.isMoving = false;
                    }
                    showToast('📰 Membaca Majalah Seni Rupa (-1 XP)', 3000);
                  }
                }}
                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  activeLiteracyDoc === 'majalah'
                    ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-2xl">📰</span>
                <span className="text-xs font-extrabold">Majalah Seni</span>
                <span className="text-[9px] text-amber-300 font-mono">-1 XP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const cost = 1;
                  if (studentPoints < cost) {
                    sounds.playClick();
                    showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP.`, 3000);
                    return;
                  }
                  const success = onDeductPoints ? onDeductPoints(cost, 'Baca Koran Kora') : true;
                  if (success) {
                    sounds.playRewardXp();
                    setActiveLiteracyDoc('koran');
                    setIsSitting(true);
                    setSittingSeat('literacy_1_a');
                    if (playerRef.current) {
                      playerRef.current.wx = -3.72;
                      playerRef.current.wy = 1.52;
                      playerRef.current.targetWx = -3.72;
                      playerRef.current.targetWy = 1.52;
                      playerRef.current.isMoving = false;
                    }
                    showToast('🗞️ Membaca Koran Warga Kora (-1 XP)', 3000);
                  }
                }}

                className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1.5 ${
                  activeLiteracyDoc === 'koran'
                    ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-2xl">🗞️</span>
                <span className="text-xs font-extrabold">Koran Kora</span>
                <span className="text-[9px] text-amber-300 font-mono">-1 XP</span>
              </button>
            </div>

            {/* Reading Display Area */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-56 overflow-y-auto">
              {!activeLiteracyDoc ? (
                <div className="text-center py-8 text-slate-500 italic">
                  Silakan pilih bahan bacaan Komik, Majalah, atau Koran di atas untuk mulai membaca.
                </div>
              ) : activeLiteracyDoc === 'komik' ? (
                <div className="space-y-2">
                  <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>📚</span> <span>Komik Edukasi DKV: Petualangan Warna & Cahaya</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Episode 1: Rahasia Kombinasi Warna CMYK & RGB dalam Desain Poster Interaktif. Andi dan Siti belajar bahwa harmoni warna menentukan pesan emosional sebuah karya visual yang profesional di SMKN 2 Gorontalo.
                  </p>
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-200 italic">
                    "Desain yang baik adalah desain yang dapat dipahami tanpa perlu banyak penjelasan."
                  </div>
                </div>
              ) : activeLiteracyDoc === 'majalah' ? (
                <div className="space-y-2">
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <span>📰</span> <span>Majalah Seni & Desain: Tren Tipografi 2026</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Ulasan mendalam mengenai tren Serif Modern dan Sans Serif Geometris dalam branding produk digital masa kini. Siswa DKV SMKN 2 Gorontalo memamerkan karya poster pameran budaya Gorontalo.
                  </p>
                  <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 italic">
                    "Tipografi adalah suara visual dari sebuah pesan."
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>🗞️</span> <span>Koran Kora Warga: Berita Harian Kota Refleksia</span>
                  </div>
                  <p className="text-slate-300 text-xs">
                    Warga kota antusias menyiram pohon rindang dan berpartisipasi aktif dalam obrolan harian antarteman. Pameran karya Tefa DKV sukses menarik perhatian dewan mentor dan guru pembimbing.
                  </p>
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200 italic">
                    "Gotong royong dan literasi adalah kunci kemajuan kota kita tercinta."
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setIsLiteracyModalOpen(false)}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Tutup & Kembali Jelajah
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CIRCULAR / RADIAL EMOTE PICKER OVERLAY (Suka, Lambai, Tertawa, Joget) */}
      {/* ============================================================= */}
      {isEmoteMenuOpen && (
        <div
          className="absolute z-40 pointer-events-none select-none transition-all duration-150"
          style={{
            left: `${Math.max(65, Math.min((containerRef.current?.clientWidth || 800) - 65, playerScreenPos.x))}px`,
            top: `${Math.max(75, Math.min((containerRef.current?.clientHeight || 600) - 75, playerScreenPos.y))}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Circular Connecting Glow Ring */}
          <div className="absolute inset-0 -m-16 rounded-full border border-sky-400/40 bg-slate-950/50 backdrop-blur-sm shadow-[0_0_30px_rgba(56,189,248,0.35)] pointer-events-auto" />
          <div className="absolute inset-0 -m-14 rounded-full border border-dashed border-sky-300/30 pointer-events-none animate-spin" style={{ animationDuration: '24s' }} />

          {/* Radial Buttons Container */}
          <div className="relative w-32 h-32 flex items-center justify-center pointer-events-auto">
            {/* Center Dismiss Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                setIsEmoteMenuOpen(false);
              }}
              className="w-10 h-10 rounded-full bg-slate-900/95 border border-slate-600/80 hover:border-slate-400 text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition transform hover:scale-110 active:scale-95 cursor-pointer z-10"
              title="Tutup Menu Emosi"
            >
              <X className="w-5 h-5" />
            </button>

            {/* 1. TOP (-90deg): 🎵 JOGET (Icon Music - Otomatis Avatar Berjoget) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('dance');
                }}
                className="group relative w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 border-2 border-purple-200/90 shadow-lg shadow-purple-600/60 flex items-center justify-center text-2xl transition transform hover:scale-125 active:scale-90 cursor-pointer animate-pulse"
                title="Joget (Avatar otomatis berjoget musik)"
              >
                <span className="drop-shadow">🎵</span>
                <span className="absolute -top-7 px-2 py-0.5 rounded-full bg-slate-900/95 border border-purple-400/60 text-purple-200 text-[10px] font-extrabold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  Joget
                </span>
              </button>
              <span className="mt-1 text-[9px] font-extrabold text-purple-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-slate-950/75 px-1.5 py-0.5 rounded-full border border-purple-500/40">
                Joget
              </span>
            </div>

            {/* 2. RIGHT (0deg): ❤️ SUKA (Love) */}
            <div className="absolute right-0 top-1/2 translate-x-4 -translate-y-1/2 flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('love');
                }}
                className="group relative w-12 h-12 rounded-full bg-gradient-to-tr from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 border-2 border-rose-200/90 shadow-lg shadow-rose-600/60 flex items-center justify-center text-2xl transition transform hover:scale-125 active:scale-90 cursor-pointer"
                title="Suka (Apresiasi cinta)"
              >
                <span className="drop-shadow">❤️</span>
                <span className="absolute -top-7 px-2 py-0.5 rounded-full bg-slate-900/95 border border-rose-400/60 text-rose-200 text-[10px] font-extrabold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  Suka
                </span>
              </button>
              <span className="mt-1 text-[9px] font-extrabold text-rose-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-slate-950/75 px-1.5 py-0.5 rounded-full border border-rose-500/40">
                Suka
              </span>
            </div>

            {/* 3. BOTTOM (90deg): 😂 TERTAWA (Icon Tertawa) */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-4 flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('laugh');
                }}
                className="group relative w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 border-2 border-amber-200/90 shadow-lg shadow-amber-500/60 flex items-center justify-center text-2xl transition transform hover:scale-125 active:scale-90 cursor-pointer"
                title="Tertawa (Gembira)"
              >
                <span className="drop-shadow">😂</span>
                <span className="absolute -bottom-7 px-2 py-0.5 rounded-full bg-slate-900/95 border border-amber-400/60 text-amber-200 text-[10px] font-extrabold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  Tertawa
                </span>
              </button>
              <span className="mt-1 text-[9px] font-extrabold text-amber-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-slate-950/75 px-1.5 py-0.5 rounded-full border border-amber-500/40">
                Tertawa
              </span>
            </div>

            {/* 4. LEFT (180deg): 👋 LAMBAI (Tangan) */}
            <div className="absolute left-0 top-1/2 -translate-x-4 -translate-y-1/2 flex flex-col items-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('wave');
                }}
                className="group relative w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 border-2 border-sky-200/90 shadow-lg shadow-sky-500/60 flex items-center justify-center text-2xl transition transform hover:scale-125 active:scale-90 cursor-pointer"
                title="Lambai (Sapa Warga)"
              >
                <span className="drop-shadow">👋</span>
                <span className="absolute -top-7 px-2 py-0.5 rounded-full bg-slate-900/95 border border-sky-400/60 text-sky-200 text-[10px] font-extrabold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-md">
                  Lambai
                </span>
              </button>
              <span className="mt-1 text-[9px] font-extrabold text-sky-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] bg-slate-950/75 px-1.5 py-0.5 rounded-full border border-sky-500/40">
                Lambai
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Zoom & Center Controls (Positioned cleanly above mobile chat panel & at bottom-right on laptop) */}
      <div className="absolute right-2.5 sm:right-4 bottom-[calc(max(0.85rem,env(safe-area-inset-bottom))+15.5rem)] sm:bottom-20 z-30 flex flex-col gap-2">
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
