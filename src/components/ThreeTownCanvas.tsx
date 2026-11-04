import React, { useEffect, useRef, useState } from 'react';
import {
  BuildingId,
  PublicChatMessage,
  Student,
  DailyJournalStickyNote,
  WismaSuggestion,
  TeacherAnnouncement,
} from '../types/index.ts';
import { StorageService } from '../utils/storage.ts';
import { sounds } from '../utils/audio.ts';
import { TimePeriod, getTimePeriodWita } from '../utils/lofiAudio.ts';
import { WeatherType, getWeatherTypeWita } from '../utils/weather.ts';
import { RealtimePresenceMesh } from '../utils/realtimePresenceMesh.ts';
import { X, MapPin, BookOpen, Newspaper, FileText, Sparkles, CheckCircle2, ScrollText, Pin, Megaphone, Mail, Send, Shuffle, ChevronLeft } from 'lucide-react';
import { TownRulesModal } from './modals/TownRulesModal.tsx';
import {
  INDONESIAN_FOLKLORE_COMICS,
  ART_DESIGN_MAGAZINES,
  renderFolkloreComicIllustration,
  renderArtMagazineIllustration,
} from '../data/literacyCornerData.tsx';
import {
  JurnalHarianModal,
  getStoredStickyNotes,
  saveStoredStickyNotes,
  mergeStickyNotesList,
  fetchStickyNotesFromAllSources,
  STORAGE_KEY_JURNAL_BERINGIN,
} from './modals/JurnalHarianModal.tsx';

interface ThreeTownCanvasProps {
  onSelectBuilding: (buildingId: BuildingId) => void;
  activeBuilding: BuildingId | null;
  newMateriBuildingIds: BuildingId[];
  studentId?: string;
  studentName?: string;
  studentGender?: string;
  isTeacher?: boolean;
  isGuest?: boolean;
  timeOfDay?: 'day' | 'night' | 'auto';
  timePeriod?: TimePeriod;
  weatherType?: WeatherType;
  weatherTempCelsius?: number;
  latestMessage?: PublicChatMessage | null;
  studentPoints?: number;
  latestXpGain?: { amount: number; reason?: string; timestamp: number } | null;
  onDeductPoints?: (amount: number, reason: string) => boolean;
  onOpenTownRules?: () => void;
  onAddXp?: (amount: number, reason: string) => void;
}

export interface XpFloatItem {
  id: string;
  amount: number;
  reason?: string;
  startTime: number;
  duration: number;
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
  { id: 'pasar_prestasi', name: 'Pasar Prestasi', tagline: 'Leaderboard & Dewan Guru', position: [-2.8, 0, 2.8], color: 0xf59e0b, icon: '🏆' },
  { id: 'kantor_pos', name: 'Kantor Pos Kilat', tagline: 'Kirim Pesan ke Guru', position: [2.8, 0, -2.8], color: 0xef4444, icon: '📮' },
  { id: 'taman_refleksi', name: 'Pusat Refleksi', tagline: 'Tulis Jurnal Refleksi (+3 Poin)', position: [-2.8, 0, -2.8], color: 0xd97706, icon: '🌍' },
  { id: 'bengkel_latihan', name: 'Lab DKV', tagline: 'Studio Desain Minimalis, Atom & Kuis', position: [2.8, 0, 2.8], color: 0x0ea5e9, icon: '⚛️' },
  { id: 'masjid', name: 'Masjid Al-Hikmah', tagline: 'Belajar Iqro (1-6) & Tuntunan Sholat', position: [5.45, 0, -4.85], color: 0x10b981, icon: '🕌' },
  { id: 'bank_materi', name: 'Bank Materi Guru', tagline: 'Khusus Guru • Input TP, Materi Esensial & Generate AI', position: [-5.35, 0, -4.85], color: 0x6366f1, icon: '🏦' },
  { id: 'monumen_warga', name: 'Air Mancur Warga', tagline: 'Sapa & Obrolan Langsung', position: [0, 0, 0], color: 0x06b6d4, icon: '⛲' },
];

// Papan Peraturan & Panduan Aktivitas di Dekat Gapura Awal Masuk [wx: 1.45, wy: 5.95]
export const TOWN_RULES_BOARD_COORDS = { wx: 1.45, wy: 5.95 };

// Pohon Beringin Jurnal Harian (Dipindahkan 3 petak ke samping kiri dekat Bank Materi [-5.35, -4.85] namun tidak terlalu berdekatan)
export const BERINGIN_TREE_COORDS = { wx: -2.95, wy: -5.85 };

// Papan Pengumuman Guru di Dekat Balai Kota [wx: -1.55, wy: -3.45] (Di atas rumput samping halaman depan Balai Kota)
export const ANNOUNCEMENT_BOARD_COORDS = { wx: -1.55, wy: -3.45 };

// Sudut Literasi Warga di Samping Balai Kota [wx: 2.35, wy: -6.15] (Di atas rumput hijau & agak jauh dari bangunan lainnya)
export const LITERACY_CORNER_COORDS = { wx: 2.35, wy: -6.15 };

export type EmoteType = 'love' | 'wave' | 'laugh' | 'dance' | 'thumbsup';

export interface ActiveEmote {
  type: EmoteType;
  icon: string;
  label: string;
  startTime: number;
  expiresAt: number;
}

interface AvatarData {
  id: string;
  role: 'siswa' | 'guru' | 'wartawan' | 'polisi' | 'petugas_kebersihan' | 'kurir' | 'barista' | 'penjaga_kota' | 'penjaga_lab' | 'penjaga_literasi' | 'penjaga_kolam' | 'pengawas' | 'kepala_balai';
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
  isRunning?: boolean;
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

interface RaindropParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
}

interface SnowflakeParticle {
  x: number;
  y: number;
  radius: number;
  vy: number;
  swayAmp: number;
  swaySpeed: number;
  phase: number;
  alpha: number;
}

interface RainRipple {
  x: number;
  y: number;
  radius: number;
  alpha: number;
}

interface MinimalistBird {
  id: number;
  mode: 'sky' | 'world';
  // For 'sky' mode (upper horizon gliders)
  x: number;
  y: number;
  vx: number;
  vyWave: number;
  // For 'world' mode (high-altitude isometric garden gliders)
  centerWx: number;
  centerWy: number;
  orbitRx: number;
  orbitRy: number;
  angle: number;
  angularSpeed: number;
  altitude: number;
  // Shared visual traits
  wingSpan: number;
  flapSpeed: number;
  phase: number;
}

export const FISHING_SPOT_COORDS = { wx: 2.05, wy: -10.15 };

export const TREES_LIST: [number, number][] = [
  // Outer perimeter for 17x17 island (North edge - center is reserved for Pohon Beringin at [0, -5.8])
  [-2.2, -7.2],
  [2.2, -7.2],
  [-4.8, -6.8],
  [4.8, -6.8],
  [-3.5, -7.25],
  [3.5, -7.25],
  [-1.05, -6.85],
  [1.05, -6.85],
  [-6.35, -7.15],
  // West edge (framing Perumahan Guru & Wisma X/XI/XII DKV behind Perpustakaan Kampus at wx = -7.05)
  [-7.25, -4.85],
  [-7.25, -2.45],
  [-7.35, -0.25],
  [-7.25, 5.85],
  [-7.55, -6.25],
  [-7.55, 1.85],
  [-7.55, 3.65],
  [-6.45, 6.65],
  // South edge (flanking the Welcome Gapura at [0, 6.15])
  [-1.6, 7.0],
  [1.6, 7.0],
  [-3.2, 7.0],
  [3.2, 7.0],
  [-5.0, 6.6],
  [5.0, 6.6],
  [-4.15, 7.15],
  [4.15, 7.15],
  [-2.35, 6.25],
  [2.45, 6.25],
  [6.15, 6.65],
  // East riverbank edge (framing the long flowing river at wx=7.0..8.1 & Masjid Al-Hikmah at [5.45, -4.85])
  [6.35, -0.45],
  [6.35, 2.2],
  [6.25, 4.6],
  [6.35, -7.2],
  [6.35, -3.75],
  [5.78, -1.95],
  [6.35, 3.45],
  [6.25, 5.75],
  // Mid-park groves (carefully placed on open lawns away from all buildings, roads, swings & lamps)
  [-5.2, -1.8],
  [5.2, 1.8],
  [-4.15, 1.95],
  [-0.5, 2.4],
  [-4.15, -1.25],
  [4.15, -1.25],
  [-2.15, 4.2],
  [2.15, 4.2],
  // Central park trees (spaced around the 8 fountain benches)
  [-1.72, -1.72],
  [1.72, -1.72],
  [-1.72, 1.72],
  [1.72, 1.72],
];

// =============================================================
// PERLUASAN PETA 6 KOTAK KE BELAKANG POHON REFLEKSI (wy: -8.5 -> -14.5)
// Hutan Belantara Lebat (Pohon Beringin Besar), Gunung Api Tidur Berdanau Kawah,
// Air Terjun Gunung Hidup, PLTA Mikro & Mercusuar Danau Pusat Sungai
// =============================================================
export const NORTH_EXPANSION_TILES = 6; // +6 kotak ke utara di belakang Pohon Refleksi
export const DANAU_PUSAT_COORDS = { wx: 4.55, wy: -10.45 };
export const DANAU_VIEW_DECK_COORDS = { wx: 1.78, wy: -10.15 };
export const HUTAN_BELANTARA_SIGN_COORDS = { wx: -0.85, wy: -7.85 };
export const HYDRO_PLANT_COORDS = { wx: 6.52, wy: -11.82 };
export const LIGHTHOUSE_COORDS = { wx: 7.58, wy: -11.48 };
export const RIVERSIDE_SEATING_COORDS = { wx: 6.36, wy: -1.95 };

export interface WildernessTreeDef {
  wx: number;
  wy: number;
  alt: number;
  scale: number;
  kind: 'pine' | 'canopy' | 'banyan';
  shade: 0 | 1 | 2;
}

// Static, lightweight list of Dense Wilderness Forest, Giant Banyan Trees & Front Foothill Trees (ZERO trees behind the mountains!)
export const WILDERNESS_TREES_LIST: WildernessTreeDef[] = [
  // A. Pepohonan Kaki Lereng Depan Gunung (strictly wy >= -12.10 so NO tree ever appears behind the mountains)
  { wx: -7.65, wy: -12.04, alt: 24, scale: 1.06, kind: 'pine', shade: 0 },
  { wx: -6.85, wy: -12.08, alt: 28, scale: 1.10, kind: 'canopy', shade: 1 },
  { wx: -6.05, wy: -12.06, alt: 32, scale: 1.12, kind: 'pine', shade: 0 },
  { wx: -5.15, wy: -12.02, alt: 28, scale: 1.08, kind: 'canopy', shade: 2 },
  { wx: -4.25, wy: -12.08, alt: 30, scale: 1.10, kind: 'pine', shade: 1 },
  { wx: -3.35, wy: -12.05, alt: 32, scale: 1.12, kind: 'pine', shade: 0 },
  { wx: -2.45, wy: -12.08, alt: 36, scale: 1.14, kind: 'canopy', shade: 1 },
  { wx: -1.55, wy: -12.04, alt: 34, scale: 1.10, kind: 'pine', shade: 2 },
  { wx: -0.65, wy: -12.02, alt: 34, scale: 1.08, kind: 'canopy', shade: 0 },
  { wx: 0.35, wy: -12.06, alt: 34, scale: 1.12, kind: 'pine', shade: 1 },
  { wx: 1.25, wy: -12.04, alt: 28, scale: 1.08, kind: 'canopy', shade: 2 },
  { wx: 2.05, wy: -12.02, alt: 24, scale: 1.04, kind: 'pine', shade: 0 },

  // B. Pohon Beringin Raksasa Hutan Belantara (Giant Ancient Banyan Trees with Aerial Roots & Wide Canopies)
  { wx: -6.65, wy: -10.65, alt: 0, scale: 1.32, kind: 'banyan', shade: 0 },
  { wx: -4.15, wy: -10.85, alt: 0, scale: 1.38, kind: 'banyan', shade: 1 },
  { wx: -1.75, wy: -10.70, alt: 0, scale: 1.34, kind: 'banyan', shade: 2 },
  { wx: 0.55, wy: -10.80, alt: 0, scale: 1.30, kind: 'banyan', shade: 0 },
  { wx: -5.45, wy: -9.25, alt: 0, scale: 1.35, kind: 'banyan', shade: 1 },
  { wx: -2.85, wy: -9.15, alt: 0, scale: 1.36, kind: 'banyan', shade: 0 },
  { wx: 0.25, wy: -9.10, alt: 0, scale: 1.28, kind: 'banyan', shade: 2 },
  { wx: -4.25, wy: -7.95, alt: 0, scale: 1.26, kind: 'banyan', shade: 1 },

  // C. Hutan Belantara Lebat Lembah Utara (Dense Multi-Layered Canopy & Pine Woodland, wy: -11.55 .. -7.55)
  { wx: -7.75, wy: -11.45, alt: 0, scale: 1.20, kind: 'pine', shade: 0 },
  { wx: -7.05, wy: -11.35, alt: 0, scale: 1.22, kind: 'canopy', shade: 2 },
  { wx: -6.15, wy: -11.48, alt: 0, scale: 1.26, kind: 'canopy', shade: 1 },
  { wx: -5.35, wy: -11.38, alt: 0, scale: 1.18, kind: 'pine', shade: 0 },
  { wx: -4.65, wy: -11.45, alt: 0, scale: 1.22, kind: 'canopy', shade: 2 },
  { wx: -3.55, wy: -11.42, alt: 0, scale: 1.24, kind: 'pine', shade: 0 },
  { wx: -2.75, wy: -11.38, alt: 0, scale: 1.20, kind: 'canopy', shade: 1 },
  { wx: -1.95, wy: -11.45, alt: 0, scale: 1.18, kind: 'pine', shade: 2 },
  { wx: -1.05, wy: -11.38, alt: 0, scale: 1.24, kind: 'canopy', shade: 0 },
  { wx: -0.15, wy: -11.42, alt: 0, scale: 1.18, kind: 'pine', shade: 1 },
  { wx: 0.85, wy: -11.40, alt: 0, scale: 1.22, kind: 'canopy', shade: 2 },
  { wx: 1.55, wy: -11.32, alt: 0, scale: 1.16, kind: 'pine', shade: 0 },

  { wx: -7.65, wy: -10.35, alt: 0, scale: 1.24, kind: 'canopy', shade: 1 },
  { wx: -5.85, wy: -10.42, alt: 0, scale: 1.20, kind: 'pine', shade: 0 },
  { wx: -4.95, wy: -10.25, alt: 0, scale: 1.26, kind: 'canopy', shade: 2 },
  { wx: -3.35, wy: -10.38, alt: 0, scale: 1.18, kind: 'pine', shade: 1 },
  { wx: -2.35, wy: -10.15, alt: 0, scale: 1.22, kind: 'canopy', shade: 0 },
  { wx: -0.95, wy: -10.28, alt: 0, scale: 1.20, kind: 'pine', shade: 2 },
  { wx: -0.15, wy: -10.12, alt: 0, scale: 1.24, kind: 'canopy', shade: 1 },
  { wx: 1.22, wy: -10.25, alt: 0, scale: 1.16, kind: 'pine', shade: 0 },

  { wx: -7.45, wy: -9.45, alt: 0, scale: 1.20, kind: 'pine', shade: 2 },
  { wx: -6.45, wy: -9.55, alt: 0, scale: 1.24, kind: 'canopy', shade: 0 },
  { wx: -4.65, wy: -9.50, alt: 0, scale: 1.18, kind: 'pine', shade: 1 },
  { wx: -3.65, wy: -9.42, alt: 0, scale: 1.22, kind: 'canopy', shade: 2 },
  { wx: -2.05, wy: -9.48, alt: 0, scale: 1.18, kind: 'pine', shade: 0 },
  { wx: -1.15, wy: -9.35, alt: 0, scale: 1.22, kind: 'canopy', shade: 1 },
  { wx: -0.42, wy: -9.45, alt: 0, scale: 1.16, kind: 'pine', shade: 2 },
  { wx: 0.98, wy: -9.38, alt: 0, scale: 1.18, kind: 'canopy', shade: 0 },

  { wx: -7.55, wy: -8.55, alt: 0, scale: 1.18, kind: 'canopy', shade: 1 },
  { wx: -6.65, wy: -8.35, alt: 0, scale: 1.16, kind: 'pine', shade: 0 },
  { wx: -5.75, wy: -8.48, alt: 0, scale: 1.22, kind: 'canopy', shade: 2 },
  { wx: -4.85, wy: -8.38, alt: 0, scale: 1.18, kind: 'pine', shade: 1 },
  { wx: -3.45, wy: -8.45, alt: 0, scale: 1.22, kind: 'canopy', shade: 0 },
  { wx: -2.35, wy: -8.32, alt: 0, scale: 1.16, kind: 'pine', shade: 2 },
  { wx: -1.45, wy: -8.42, alt: 0, scale: 1.20, kind: 'canopy', shade: 1 },
  { wx: 0.85, wy: -8.38, alt: 0, scale: 1.18, kind: 'pine', shade: 0 },
  { wx: 1.52, wy: -8.48, alt: 0, scale: 1.15, kind: 'canopy', shade: 2 },

  // D. Pepohonan Tepi Selatan Danau Pusat Sungai Mengalir
  { wx: 2.35, wy: -8.32, alt: 0, scale: 1.14, kind: 'canopy', shade: 0 },
  { wx: 3.25, wy: -8.28, alt: 0, scale: 1.18, kind: 'pine', shade: 1 },
  { wx: 4.25, wy: -8.25, alt: 0, scale: 1.22, kind: 'banyan', shade: 2 },
  { wx: 5.35, wy: -8.28, alt: 0, scale: 1.16, kind: 'canopy', shade: 1 },
  { wx: 6.28, wy: -8.32, alt: 0, scale: 1.14, kind: 'pine', shade: 0 },
];


export interface HousingUnitDef {
  id: 'guru_1' | 'guru_2' | 'siswa_1' | 'siswa_2' | 'siswa_3';
  kind: 'guru' | 'siswa';
  shortBadge: string;
  name: string;
  subtitle: string;
  wx: number;
  wy: number;
  roofColor: string;
  roofDark: string;
  accentColor: string;
}

// Perumahan Guru & Wisma X, XI, XII DKV di Belakang Perpustakaan Kampus di Ujung Barat Peta
export const HOUSING_UNITS: HousingUnitDef[] = [
  {
    id: 'guru_1',
    kind: 'guru',
    shortBadge: '🏡 GURU 1',
    name: '🏡 Rumah Dinas Guru 1',
    subtitle: 'Perumahan Guru Refleksia',
    wx: -7.05,
    wy: -3.55,
    roofColor: '#c2410c',
    roofDark: '#9a3412',
    accentColor: '#f59e0b',
  },
  {
    id: 'guru_2',
    kind: 'guru',
    shortBadge: '🏡 GURU 2',
    name: '🏡 Rumah Dinas Guru 2',
    subtitle: 'Perumahan Guru Refleksia',
    wx: -7.05,
    wy: -1.55,
    roofColor: '#b45309',
    roofDark: '#78350f',
    accentColor: '#fbbf24',
  },
  {
    id: 'siswa_1',
    kind: 'siswa',
    shortBadge: '🏘️ X DKV',
    name: '🏘️ Wisma X DKV',
    subtitle: 'Wisma Siswa Kelas X DKV',
    wx: -7.05,
    wy: 1.05,
    roofColor: '#0284c7',
    roofDark: '#0369a1',
    accentColor: '#38bdf8',
  },
  {
    id: 'siswa_2',
    kind: 'siswa',
    shortBadge: '🏘️ XI DKV',
    name: '🏘️ Wisma XI DKV',
    subtitle: 'Wisma Siswa Kelas XI DKV',
    wx: -7.05,
    wy: 2.75,
    roofColor: '#0d9488',
    roofDark: '#0f766e',
    accentColor: '#34d399',
  },
  {
    id: 'siswa_3',
    kind: 'siswa',
    shortBadge: '🏘️ XII DKV',
    name: '🏘️ Wisma XII DKV',
    subtitle: 'Wisma Siswa Kelas XII DKV',
    wx: -7.05,
    wy: 4.45,
    roofColor: '#7c3aed',
    roofDark: '#5b21b6',
    accentColor: '#a78bfa',
  },
];

export const STREET_LAMPS_LIST: [number, number][] = [
  // Inner park lawn quadrants (neatly flanking the central avenues on grass verges, clear of roads & buildings)
  [-1.88, -0.82],
  [1.88, -0.82],
  [-1.88, 0.82],
  [1.88, 0.82],
  [-0.82, -1.88],
  [0.82, -1.88],
  [-0.82, 1.88],
  [0.82, 1.88],
  // Middle garden belt verges (on grass lawns between inner & outer loops, outside all building footprints)
  [-4.15, -1.75],
  [4.15, 1.75],
  [-1.75, 4.15],
  [1.75, 4.15],
  [-0.85, 3.85],
  [0.85, 3.85],
  // Outer garden perimeter & entrance verges (on grass lawns outside the ±5 promenade road)
  [-3.85, -5.75],
  [3.85, -5.75],
  [-1.85, 5.75],
  [2.15, 5.75],
  // East riverbank garden promenade (on grass verges beside the river & bridge)
  [5.75, -0.75],
  [5.75, 0.85],
  [5.75, 3.15],
  // West residential garden verge (on lawn between Perumahan Guru & Wisma DKV and the boulevard road)
  [-6.52, -2.55],
  [-6.52, 1.9],
  [-6.52, 3.6],
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
  // Masjid Al-Hikmah (Di samping Kolam Awal Aliran Sungai)
  { minWx: 4.65, maxWx: 6.25, minWy: -5.65, maxWy: -4.05 },
  // Gedung Bank Materi Guru (Di sisi Barat Laut simetris dengan Masjid)
  { minWx: -6.15, maxWx: -4.55, minWy: -5.65, maxWy: -4.05 },
];

// Pagar Minimalis Pembatas Hutan Belantara & Danau Pusat (Membentang dari ujung barat hutan hingga ujung timur danau pusat)
export const WILDERNESS_FENCE_WY = -7.62;
export const WILDERNESS_FENCE_MIN_WX = -8.15;
export const WILDERNESS_FENCE_MAX_WX = 6.82;
export const WILDERNESS_GATE_HALF_W = 0.56;

export const isSolidCollision = (
  wx: number,
  wy: number,
  padding: number = 0.16,
  allowWildernessAccess: boolean = true
): boolean => {
  // Expanded Island edges: wx from -8.2 to +8.2, wy from -14.2 (North +6 tiles) to +8.2
  if (wx < -8.2 + padding || wx > 8.2 - padding || wy < -14.2 + padding || wy > 8.2 - padding) {
    return true;
  }

  // Steep Northern Mountain Range rock face (Gunung Tinggi at wy < -11.82)
  if (wy < -11.82 + padding) {
    return true;
  }

  // Pagar Minimalis Hutan Belantara & Danau Pusat (wy = -7.62, dari wx = -8.15 s/d wx = 6.82)
  // Semua warga wajib lewat pintu gerbang di jalan belakang Pohon Refleksi (|wx| <= 0.56) yang dijaga @tomi
  const isAtFenceLine = Math.abs(wy - WILDERNESS_FENCE_WY) < 0.09 + padding;
  const isWithinFenceSpan = wx >= WILDERNESS_FENCE_MIN_WX - padding && wx <= WILDERNESS_FENCE_MAX_WX + padding;
  const isInsideGateOpening = Math.abs(wx) <= WILDERNESS_GATE_HALF_W - padding * 0.35;
  if (isAtFenceLine && isWithinFenceSpan && !isInsideGateOpening) {
    return true;
  }

  // Hanya Guru yang bisa masuk melewati Gerbang Hutan Belantara & Danau Pusat (wy < -7.62)
  if (!allowWildernessAccess && wy < WILDERNESS_FENCE_WY + 0.08 + padding) {
    return true;
  }

  // Danau Pusat / Sungai Refleksia water basin (wx: 1.85 .. 7.15, wy: -12.25 .. -8.78)
  // Leaves the 1-tile (1 petak) fishing deck around (wx: 2.05, wy: -10.15) and lakeside viewing deck walkable
  if (wx > 1.85 - padding && wy < -8.78 + padding) {
    // Dermaga pemancingan kayu 1 petak di tepi danau (bisa dinaiki untuk memancing)
    if (wx >= 1.45 - padding && wx <= 2.35 + padding && wy >= -10.55 - padding && wy <= -9.75 + padding) {
      return false;
    }
    return true;
  }

  // Long Flowing River behind Studio ON AIR (wx > 6.82, except across the wooden river bridge at |wy| < 0.75)
  if (wx > 6.82 - padding && Math.abs(wy) >= 0.72) {
    return true;
  }

  // Central Fountain pool (Air Mancur Pusat)
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

const DISTINCT_AVATAR_PALETTE: Array<{
  shirt: string;
  pants: string;
  hijab: string;
  hijabEdge: string;
}> = [
  { shirt: '#2563eb', pants: '#1e293b', hijab: '#1d4ed8', hijabEdge: '#93c5fd' }, // 0: Royal Blue
  { shirt: '#e11d48', pants: '#334155', hijab: '#be185d', hijabEdge: '#fda4af' }, // 1: Rose Crimson
  { shirt: '#059669', pants: '#064e3b', hijab: '#047857', hijabEdge: '#6ee7b7' }, // 2: Emerald Green
  { shirt: '#7c3aed', pants: '#2e1065', hijab: '#6d28d9', hijabEdge: '#c4b5fd' }, // 3: Royal Violet
  { shirt: '#d97706', pants: '#451a03', hijab: '#b45309', hijabEdge: '#fde68a' }, // 4: Warm Amber
  { shirt: '#0891b2', pants: '#164e63', hijab: '#0e7490', hijabEdge: '#67e8f9' }, // 5: Cyan Ocean
  { shirt: '#db2777', pants: '#500724', hijab: '#9d174d', hijabEdge: '#f9a8d4' }, // 6: Berry Pink
  { shirt: '#4f46e5', pants: '#1e1b4b', hijab: '#4338ca', hijabEdge: '#a5b4fc' }, // 7: Deep Indigo
  { shirt: '#ea580c', pants: '#431407', hijab: '#c2410c', hijabEdge: '#fdba74' }, // 8: Sunset Coral
  { shirt: '#16a34a', pants: '#14532d', hijab: '#15803d', hijabEdge: '#86efac' }, // 9: Leaf Green
  { shirt: '#9333ea', pants: '#3b0764', hijab: '#7e22ce', hijabEdge: '#d8b4fe' }, // 10: Amethyst Purple
  { shirt: '#0284c7', pants: '#0c4a6e', hijab: '#0369a1', hijabEdge: '#7dd3fc' }, // 11: Sky Cerulean
  { shirt: '#dc2626', pants: '#450a0a', hijab: '#b91c1c', hijabEdge: '#fca5a5' }, // 12: Bright Scarlet
  { shirt: '#0d9488', pants: '#134e4a', hijab: '#0f766e', hijabEdge: '#5eead4' }, // 13: Tropical Teal
  { shirt: '#c026d3', pants: '#4a044e', hijab: '#a21caf', hijabEdge: '#f0abfc' }, // 14: Fuchsia Magenta
  { shirt: '#65a30d', pants: '#1a2e05', hijab: '#4d7c0f', hijabEdge: '#bef264' }, // 15: Fresh Lime
  { shirt: '#f97316', pants: '#431407', hijab: '#ea580c', hijabEdge: '#fed7aa' }, // 16: Tangerine
  { shirt: '#3b82f6', pants: '#172554', hijab: '#2563eb', hijabEdge: '#bfdbfe' }, // 17: Cobalt Blue
  { shirt: '#10b981', pants: '#064e3b', hijab: '#059669', hijabEdge: '#a7f3d0' }, // 18: Mint Jade
  { shirt: '#ec4899', pants: '#500724', hijab: '#db2777', hijabEdge: '#fbcfe8' }, // 19: Sakura Pink
  { shirt: '#6366f1', pants: '#1e1b4b', hijab: '#4f46e5', hijabEdge: '#c7d2fe' }, // 20: Periwinkle
  { shirt: '#ca8a04', pants: '#422006', hijab: '#a16207', hijabEdge: '#fef08a' }, // 21: Goldenrod
  { shirt: '#06b6d4', pants: '#083344', hijab: '#0891b2', hijabEdge: '#a5f3fc' }, // 22: Turquoise
  { shirt: '#be123c', pants: '#4c0519', hijab: '#9f1239', hijabEdge: '#fecdd3' }, // 23: Ruby Wine
  { shirt: '#15803d', pants: '#052e16', hijab: '#166534', hijabEdge: '#bbf7d0' }, // 24: Forest Pine
  { shirt: '#8b5cf6', pants: '#2e1065', hijab: '#7c3aed', hijabEdge: '#ddd6fe' }, // 25: Lavender Violet
  { shirt: '#0369a1', pants: '#082f49', hijab: '#075985', hijabEdge: '#bae6fd' }, // 26: Marine Blue
  { shirt: '#b45309', pants: '#271103', hijab: '#92400e', hijabEdge: '#fde68a' }, // 27: Cinnamon Bronze
];

function isTimeTravelerAccount(idOrName?: string | null, handle?: string | null): boolean {
  const combined = `${idOrName || ''} ${handle || ''}`.toLowerCase();
  return combined.includes('kikybahsoan') || combined.includes('kikybahoan');
}

function getDistinctAvatarOutfit(seedKey: string): {
  shirt: string;
  pants: string;
  hijab: string;
  hijabEdge: string;
} {
  const clean = (seedKey || 'siswa').trim().toLowerCase();
  if (isTimeTravelerAccount(clean, clean)) {
    return {
      shirt: '#0f172a',
      pants: '#1e1b4b',
      hijab: '#0891b2',
      hijabEdge: '#38bdf8',
    };
  }
  const numMatch = clean.match(/(\d+)$/);
  const baseHash = Math.abs(hashString(clean));
  const idx = numMatch
    ? (parseInt(numMatch[1], 10) * 3 + baseHash) % DISTINCT_AVATAR_PALETTE.length
    : baseHash % DISTINCT_AVATAR_PALETTE.length;
  return DISTINCT_AVATAR_PALETTE[idx];
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
  | 'riverside_1'
  | 'riverside_1_a'
  | 'riverside_1_b'
  | 'riverside_2'
  | 'riverside_2_a'
  | 'riverside_2_b'
  | 'riverside_3'
  | 'riverside_3_a'
  | 'riverside_3_b'
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
    | 'campfire_2'
    | 'riverside_1'
    | 'riverside_2'
    | 'riverside_3';
  name: string;
  kind: 'fountain_minimalist' | 'campfire' | 'riverside';
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

// 2 Kursi Literasi Minimalis di Samping Balai Kota (Tetap di Atas Rumput Hijau & Jauh dari Bangunan Lain)
export const LITERACY_BENCHES: TwoPersonBenchGroup[] = [
  {
    groupId: 'literacy_1',
    name: 'Kursi Literasi 1 (Samping Sudut Literasi Balai Kota)',
    kind: 'fountain_minimalist',
    wx: 1.72,
    wy: -5.82,
    facing: 'down-right',
    seats: [
      { id: 'literacy_1_a', label: 'Kursi Literasi 1 • Kiri (1/2)', wx: 1.65, wy: -5.75, screenOffsetX: -6.2 },
      { id: 'literacy_1_b', label: 'Kursi Literasi 1 • Kanan (2/2)', wx: 1.79, wy: -5.89, screenOffsetX: 6.2 },
    ],
  },
  {
    groupId: 'literacy_2',
    name: 'Kursi Literasi 2 (Depan Sudut Literasi Balai Kota)',
    kind: 'fountain_minimalist',
    wx: 2.95,
    wy: -5.82,
    facing: 'down-left',
    seats: [
      { id: 'literacy_2_a', label: 'Kursi Literasi 2 • Kiri (1/2)', wx: 2.88, wy: -5.89, screenOffsetX: -6.2 },
      { id: 'literacy_2_b', label: 'Kursi Literasi 2 • Kanan (2/2)', wx: 3.02, wy: -5.75, screenOffsetX: 6.2 },
    ],
  },
];

// Api Unggun & 2 Bangku Hangat di Atas Rumput Hijau (Taman Barat Daya [-4.05, 4.15])
export const CAMPFIRE_COORDS = { wx: -4.05, wy: 4.15 };

export const CAMPFIRE_BENCHES: TwoPersonBenchGroup[] = [
  {
    groupId: 'campfire_1',
    name: 'Bangku Api Unggun Kiri (Penghangat Tubuh di Atas Rumput)',
    kind: 'campfire',
    wx: -4.52,
    wy: 4.18,
    facing: 'down-right',
    seats: [
      { id: 'campfire_1_a', label: 'Bangku Api Unggun Kiri • Kursi 1', wx: -4.58, wy: 4.24, screenOffsetX: -5.8 },
      { id: 'campfire_1_b', label: 'Bangku Api Unggun Kiri • Kursi 2', wx: -4.46, wy: 4.12, screenOffsetX: 5.8 },
    ],
  },
  {
    groupId: 'campfire_2',
    name: 'Bangku Api Unggun Kanan (Penghangat Tubuh di Atas Rumput)',
    kind: 'campfire',
    wx: -3.58,
    wy: 4.18,
    facing: 'down-left',
    seats: [
      { id: 'campfire_2_a', label: 'Bangku Api Unggun Kanan • Kursi 1', wx: -3.64, wy: 4.12, screenOffsetX: -5.8 },
      { id: 'campfire_2_b', label: 'Bangku Api Unggun Kanan • Kursi 2', wx: -3.52, wy: 4.24, screenOffsetX: 5.8 },
    ],
  },
];

// 3 Tempat Duduk Pinggiran Sungai untuk 6 Orang (Masing-Masing Bangku Muat 2 Orang Menghadap Aliran Sungai)
export const RIVERSIDE_BENCHES: TwoPersonBenchGroup[] = [
  {
    groupId: 'riverside_1',
    name: 'Bangku Tepi Sungai 1 (Utara • Kursi 1–2/6)',
    kind: 'riverside',
    wx: 6.36,
    wy: -2.85,
    facing: 'down-right',
    seats: [
      { id: 'riverside_1_a', label: 'Bangku Tepi Sungai 1 • Kursi Kiri (1/6)', wx: 6.30, wy: -2.79, screenOffsetX: -6.0 },
      { id: 'riverside_1_b', label: 'Bangku Tepi Sungai 1 • Kursi Kanan (2/6)', wx: 6.42, wy: -2.91, screenOffsetX: 6.0 },
    ],
  },
  {
    groupId: 'riverside_2',
    name: 'Bangku Tepi Sungai 2 (Tengah • Kursi 3–4/6)',
    kind: 'riverside',
    wx: 6.36,
    wy: -1.95,
    facing: 'down-right',
    seats: [
      { id: 'riverside_2_a', label: 'Bangku Tepi Sungai 2 • Kursi Kiri (3/6)', wx: 6.30, wy: -1.89, screenOffsetX: -6.0 },
      { id: 'riverside_2_b', label: 'Bangku Tepi Sungai 2 • Kursi Kanan (4/6)', wx: 6.42, wy: -2.01, screenOffsetX: 6.0 },
    ],
  },
  {
    groupId: 'riverside_3',
    name: 'Bangku Tepi Sungai 3 (Selatan • Kursi 5–6/6)',
    kind: 'riverside',
    wx: 6.36,
    wy: -1.05,
    facing: 'down-right',
    seats: [
      { id: 'riverside_3_a', label: 'Bangku Tepi Sungai 3 • Kursi Kiri (5/6)', wx: 6.30, wy: -0.99, screenOffsetX: -6.0 },
      { id: 'riverside_3_b', label: 'Bangku Tepi Sungai 3 • Kursi Kanan (6/6)', wx: 6.42, wy: -1.11, screenOffsetX: 6.0 },
    ],
  },
];

export const ALL_TWO_PERSON_BENCHES: TwoPersonBenchGroup[] = [
  ...FOUNTAIN_MINIMALIST_BENCHES,
  ...LITERACY_BENCHES,
  ...CAMPFIRE_BENCHES,
  ...RIVERSIDE_BENCHES,
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
  appleStartTime: number | null; // performance.now() when 3rd watering triggers apples
  hasRipeApples?: boolean; // true when ripe apples are ready to be harvested (+2 XP)
  harvestFadeStartTime?: number | null; // performance.now() when apples were harvested -> 1.5s fade-out animation
  nextAutoAppleSpawnAt?: number; // Date.now() timestamp when apples respawn (every 5 minutes = 300,000 ms)
  isAutumn?: boolean; // true when tree has autumn/fallen-leaf colors; turns green (false) when watered!
}

export interface DryLeafItem {
  id: number;
  wx: number;
  wy: number;
  rot: number;
  pickedAt: number | null; // Date.now() when picked
  fadeStartTime: number | null; // performance.now() for smooth fade-out animation
}

// 10 titik daun kering gugur yang rapi & estetik tersebar di taman/bawah pohon (kota tetap terlihat bersih dan asri)
export const DRY_LEAVES_SPOTS: Array<{ id: number; wx: number; wy: number; rot: number }> = [
  { id: 0, wx: -1.45, wy: -1.55, rot: 0.35 },
  { id: 1, wx: 1.55, wy: -1.45, rot: -0.42 },
  { id: 2, wx: -1.52, wy: 1.48, rot: 0.65 },
  { id: 3, wx: 1.48, wy: 1.52, rot: -0.28 },
  { id: 4, wx: -0.82, wy: 2.35, rot: 0.18 },
  { id: 5, wx: 0.85, wy: 2.42, rot: -0.38 },
  { id: 6, wx: -2.45, wy: -0.35, rot: 0.52 },
  { id: 7, wx: 2.45, wy: 0.42, rot: -0.48 },
  { id: 8, wx: -1.65, wy: 3.35, rot: 0.25 },
  { id: 9, wx: 1.68, wy: -3.25, rot: -0.45 },
];

export const TOTAL_SCATTERED_DRY_LEAVES = DRY_LEAVES_SPOTS.length; // 10 daun kering tersebar di kota

export const ThreeTownCanvas = React.memo<ThreeTownCanvasProps>(function ThreeTownCanvas({
  onSelectBuilding,
  activeBuilding,
  newMateriBuildingIds,
  studentId,
  studentName = 'Siswa',
  studentGender = 'L',
  isTeacher = false,
  isGuest = false,
  timeOfDay = 'night',
  timePeriod,
  weatherType,
  weatherTempCelsius,
  latestMessage,
  studentPoints = 100,
  latestXpGain,
  onDeductPoints,
  onOpenTownRules,
  onAddXp,
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Floating Pop-Up XP Gain Queue (+3 XP, +5 XP floating above avatar)
  const xpFloatsRef = useRef<XpFloatItem[]>([]);
  const prevPointsRef = useRef<number>(studentPoints);

  const addXpFloat = (amount: number, reason?: string) => {
    if (amount <= 0) return;
    const now = performance.now();
    // Avoid exact duplicate within 250ms
    const recent = xpFloatsRef.current.find((item) => now - item.startTime < 250 && item.amount === amount);
    if (recent) {
      if (reason && !recent.reason) recent.reason = reason;
      return;
    }
    xpFloatsRef.current.push({
      id: Math.random().toString(),
      amount,
      reason,
      startTime: now,
      duration: 2700,
    });
    sounds.playRewardXp();
  };

  useEffect(() => {
    if (studentPoints > prevPointsRef.current) {
      const diff = studentPoints - prevPointsRef.current;
      addXpFloat(diff);
    }
    prevPointsRef.current = studentPoints;
  }, [studentPoints]);

  useEffect(() => {
    if (!latestXpGain || latestXpGain.amount <= 0) return;
    addXpFloat(latestXpGain.amount, latestXpGain.reason);
  }, [latestXpGain]);

  const [hoveredBuilding, setHoveredBuilding] = useState<BuildingInfo | null>(null);
  const [isCafeMenuOpen, setIsCafeMenuOpen] = useState(false);
  const [isTownRulesModalOpen, setIsTownRulesModalOpen] = useState(false);
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [stickyNotes, setStickyNotes] = useState<DailyJournalStickyNote[]>(() => getStoredStickyNotes());
  const stickyNotesRef = useRef<DailyJournalStickyNote[]>(stickyNotes);
  stickyNotesRef.current = stickyNotes;

  // Real-time synchronization of sticky notes on Pohon Beringin from Google Spreadsheet, Server & localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchStickyNotes = async () => {
      const local = getStoredStickyNotes();
      if (isMounted) setStickyNotes(local);
      try {
        const result = await fetchStickyNotesFromAllSources();
        if (isMounted && Array.isArray(result.notes) && result.notes.length > 0) {
          setStickyNotes(result.notes);
        }
      } catch {}
    };

    fetchStickyNotes();

    const pollInterval = window.setInterval(() => {
      if (isMounted) {
        fetchStickyNotes();
      }
    }, 15000);

    const handleStickyEvent = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        if (Array.isArray(custom.detail)) {
          setStickyNotes(custom.detail);
        } else {
          setStickyNotes((prev) => {
            const exists = prev.some((n) => n.id === custom.detail.id);
            return exists ? prev : [custom.detail, ...prev];
          });
        }
      }
    };

    const handleNativeStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_JURNAL_BERINGIN && e.newValue && isMounted) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setStickyNotes(parsed);
        } catch {}
      }
    };

    window.addEventListener('sticky_note_added', handleStickyEvent);
    window.addEventListener('kota_refleksi_sticky_notes_updated', handleStickyEvent);
    window.addEventListener('storage', handleNativeStorage);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('kota_refleksi_channel');
      channel.onmessage = (event) => {
        if (Array.isArray(event.data?.notes) && isMounted) {
          const merged = mergeStickyNotesList(getStoredStickyNotes(), event.data.notes);
          saveStoredStickyNotes(merged);
          setStickyNotes(merged);
        } else if (event.data?.type === 'STICKY_NOTE_ADDED' && event.data.note) {
          setStickyNotes((prev) => {
            const exists = prev.some((n) => n.id === event.data.note.id);
            const next = exists ? prev : [event.data.note, ...prev];
            saveStoredStickyNotes(next);
            return next;
          });
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      window.removeEventListener('sticky_note_added', handleStickyEvent);
      window.removeEventListener('kota_refleksi_sticky_notes_updated', handleStickyEvent);
      window.removeEventListener('storage', handleNativeStorage);
      if (channel) channel.close();
    };
  }, []);
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

  // Exclusive Master kikybahsoan movement mode ('walk' | 'teleport')
  const isMasterKiky = isTimeTravelerAccount(studentName, studentId);
  const isMasterKikyRef = useRef<boolean>(isMasterKiky);
  isMasterKikyRef.current = isMasterKiky;
  const [masterMoveMode, setMasterMoveMode] = useState<'walk' | 'teleport'>('walk');
  const masterMoveModeRef = useRef<'walk' | 'teleport'>('walk');
  masterMoveModeRef.current = masterMoveMode;
  const teleportFlashRef = useRef<{
    fromWx: number;
    fromWy: number;
    toWx: number;
    toWy: number;
    startTime: number;
  } | null>(null);

  // =============================================================
  // MASJID AL-HIKMAH: INFO ADZAN DI ATAS MASJID (HANYA TAMPIL 10 MENIT SETELAH WAKTU SHOLAT PER 5 WAKTUNYA)
  // =============================================================
  const AZAN_5_WAKTU_LIST = [
    { id: 'Subuh', time: '04:45', minutes: 4 * 60 + 45, icon: '🌅', isSubuh: true },
    { id: 'Dzuhur', time: '12:05', minutes: 12 * 60 + 5, icon: '☀️', isSubuh: false },
    { id: 'Ashar', time: '15:22', minutes: 15 * 60 + 22, icon: '🌤️', isSubuh: false },
    { id: 'Maghrib', time: '18:08', minutes: 18 * 60 + 8, icon: '🌇', isSubuh: false },
    { id: 'Isya', time: '19:18', minutes: 19 * 60 + 18, icon: '🌙', isSubuh: false },
  ] as const;

  type AzanWaktuId = (typeof AZAN_5_WAKTU_LIST)[number]['id'];

  // Manual trigger from inside MasjidModal (shows for 10 minutes if triggered inside the mosque modal)
  const manualAzanOverrideRef = useRef<{ waktu: AzanWaktuId; expiresAt: number } | null>(null);

  // Returns the active prayer time ONLY if current WITA time is within [prayerTime, prayerTime + 10 minutes)
  const getActiveAzanWithin10MinWita = (): AzanWaktuId | null => {
    const override = manualAzanOverrideRef.current;
    if (override && Date.now() < override.expiresAt) {
      return override.waktu;
    }
    try {
      const witaStr = new Date().toLocaleTimeString('en-US', {
        timeZone: 'Asia/Makassar',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const [hStr, mStr] = witaStr.split(':');
      const h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      if (!isNaN(h) && !isNaN(m)) {
        const curMinutes = (h === 24 ? 0 : h) * 60 + m;
        for (const wk of AZAN_5_WAKTU_LIST) {
          if (curMinutes >= wk.minutes && curMinutes < wk.minutes + 10) {
            return wk.id;
          }
        }
      }
    } catch {}
    return null;
  };

  // Listen to custom event from MasjidModal when student tests/triggers Azan from inside the Mosque
  useEffect(() => {
    const handleCustomAzan = (e: Event) => {
      const custom = e as CustomEvent;
      const waktu = custom.detail?.waktu as AzanWaktuId | undefined;
      if (waktu) {
        // Tampil selama 10 menit (600.000 ms)
        manualAzanOverrideRef.current = {
          waktu,
          expiresAt: Date.now() + 10 * 60 * 1000,
        };
      }
    };
    window.addEventListener('kota_refleksi_trigger_azan', handleCustomAzan);
    return () => {
      window.removeEventListener('kota_refleksi_trigger_azan', handleCustomAzan);
    };
  }, []);

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
  const emoteTargetAvatarRef = useRef<AvatarData | null>(null);
  const [playerScreenPos, setPlayerScreenPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [playerEmote, setPlayerEmote] = useState<ActiveEmote | null>(null);
  const playerEmoteRef = useRef<ActiveEmote | null>(null);
  playerEmoteRef.current = playerEmote;

  const triggerEmote = (type: EmoteType) => {
    const config: Record<EmoteType, { icon: string; label: string; duration: number }> = {
      dance: { icon: '🎵', label: 'Joget', duration: 8500 },
      thumbsup: { icon: '👍', label: 'Jempol', duration: 7000 },
      love: { icon: '❤️', label: 'Suka', duration: 7000 },
      laugh: { icon: '😂', label: 'Tertawa', duration: 7000 },
      wave: { icon: '👋', label: 'Lambai', duration: 7000 },
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
    emoteTargetAvatarRef.current = null;

    if (type === 'dance') {
      sounds.playDanceMusic();
      showToast(`🎵 Asyik berjoget mengikuti irama musik!`, 2800);
    } else {
      sounds.playEmote();
      if (type === 'thumbsup') {
        showToast(`👍 Reaksi Jempol Mantap!`, 2500);
      } else if (type === 'love') {
        showToast(`❤️ Suka & apresiasi hangat untuk warga Refleksia!`, 2500);
      } else if (type === 'wave') {
        showToast(`👋 Melambaikan tangan menyapa teman!`, 2500);
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

  // Tree watering & apple fruiting cycle state (treeIndex -> TreeWaterCycle)
  // Beberapa pohon dipilih secara random memiliki warna seperti daun yang gugur (isAutumn: true), yang jika disiram akan hijau kembali!
  const [treeCycles, setTreeCycles] = useState<Record<number, TreeWaterCycle>>(() => {
    const initial: Record<number, TreeWaterCycle> = {};
    const indices = TREES_LIST.map((_, idx) => idx);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    const autumnSet = new Set(indices.slice(0, Math.max(16, Math.round(TREES_LIST.length * 0.42))));
    autumnSet.add(TREES_LIST.length - 1);
    autumnSet.add(TREES_LIST.length - 3);
    autumnSet.add(12);
    autumnSet.add(13);

    TREES_LIST.forEach((_, idx) => {
      initial[idx] = {
        count: 0,
        lastWateredTime: 0,
        appleStartTime: null,
        hasRipeApples: false,
        harvestFadeStartTime: null,
        isAutumn: autumnSet.has(idx),
      };
    });
    return initial;
  });
  const treeCyclesRef = useRef<Record<number, TreeWaterCycle>>(treeCycles);
  treeCyclesRef.current = treeCycles;

  // Aesthetic Dry Leaves (Daun Kering) state & 5-leaves = +1 XP counter
  const [dryLeaves, setDryLeaves] = useState<DryLeafItem[]>(() =>
    DRY_LEAVES_SPOTS.map((spot) => ({
      ...spot,
      pickedAt: null,
      fadeStartTime: null,
    }))
  );
  const dryLeavesRef = useRef<DryLeafItem[]>(dryLeaves);
  dryLeavesRef.current = dryLeaves;

  const dryLeafStorageKey = `kota_refleksi_dry_leaves_${studentId || studentName}`;
  const [pickedDryLeavesCount, setPickedDryLeavesCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    try {
      const saved = parseInt(localStorage.getItem(dryLeafStorageKey) || '0', 10);
      return Number.isNaN(saved) ? 0 : saved % 5;
    } catch {
      return 0;
    }
  });
  const pickedDryLeavesCountRef = useRef<number>(pickedDryLeavesCount);
  pickedDryLeavesCountRef.current = pickedDryLeavesCount;

  // Respawn picked dry leaves gently after 90 seconds so the city always has neat garden leaves to tidy up
  useEffect(() => {
    const leafRespawnTimer = window.setInterval(() => {
      const now = Date.now();
      let updated = false;
      const nextLeaves = dryLeavesRef.current.map((leaf) => {
        if (leaf.pickedAt && now - leaf.pickedAt >= 90 * 1000) {
          updated = true;
          return { ...leaf, pickedAt: null, fadeStartTime: null };
        }
        return leaf;
      });
      if (updated) {
        dryLeavesRef.current = nextLeaves;
        setDryLeaves(nextLeaves);
      }
    }, 2000);
    return () => window.clearInterval(leafRespawnTimer);
  }, []);

  // Pending interactive walk-to-harvest-apple or walk-to-pick-leaf target
  const pendingEnvActionRef = useRef<
    | { type: 'harvest_apple'; treeIndex: number; targetX: number; targetY: number }
    | { type: 'pick_leaf'; leafId: number; targetX: number; targetY: number }
    | null
  >(null);

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
  const [selectedFolkloreComicId, setSelectedFolkloreComicId] = useState<string | null>(null);
  const [randomMagazineIndex, setRandomMagazineIndex] = useState<number>(() =>
    Math.floor(Math.random() * ART_DESIGN_MAGAZINES.length)
  );

  // Papan Pengumuman Guru near Balai Kota state
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [teacherAnnouncements, setTeacherAnnouncements] = useState<TeacherAnnouncement[]>(() =>
    StorageService.getTeacherAnnouncements()
  );
  const [newAnnouncementText, setNewAnnouncementText] = useState('');
  const [isPostingAnnouncement, setIsPostingAnnouncement] = useState(false);

  // Kotak Surat Kecil Masukan & Saran at every Wisma Siswa & Guru state
  const [activeWismaMailbox, setActiveWismaMailbox] = useState<HousingUnitDef | null>(null);
  const [wismaSuggestions, setWismaSuggestions] = useState<WismaSuggestion[]>(() =>
    StorageService.getWismaSuggestions()
  );
  const [suggestionCategory, setSuggestionCategory] = useState<WismaSuggestion['category']>('Pembelajaran & Materi');
  const [suggestionText, setSuggestionText] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);

  useEffect(() => {
    let mounted = true;
    const refreshAnnouncementsAndSuggestions = async () => {
      if (mounted) {
        setTeacherAnnouncements(StorageService.getTeacherAnnouncements());
      }
      try {
        const synced = await StorageService.fetchWismaSuggestionsFromAllSources();
        if (mounted && Array.isArray(synced)) {
          setWismaSuggestions(synced);
        }
      } catch {}
    };
    refreshAnnouncementsAndSuggestions();
    const timer = window.setInterval(refreshAnnouncementsAndSuggestions, 20000);
    const onAnnUpdate = () => {
      if (mounted) setTeacherAnnouncements(StorageService.getTeacherAnnouncements());
    };
    const onSugUpdate = () => {
      if (mounted) setWismaSuggestions(StorageService.getWismaSuggestions());
    };
    window.addEventListener('kota_refleksi_announcement_updated', onAnnUpdate);
    window.addEventListener('kota_refleksi_wisma_suggestions_updated', onSugUpdate);
    return () => {
      mounted = false;
      window.clearInterval(timer);
      window.removeEventListener('kota_refleksi_announcement_updated', onAnnUpdate);
      window.removeEventListener('kota_refleksi_wisma_suggestions_updated', onSugUpdate);
    };
  }, []);

  // Nearby interaction (tree watering/apple harvesting, dry leaf pickup, fishing spot, literacy corner, bench, town rules board, beringin tree journal, announcement board, or wisma mailbox)
  const [nearbyAction, setNearbyAction] = useState<{
    type:
      | 'tree'
      | 'dry_leaf'
      | 'fishing'
      | 'literacy'
      | 'bench'
      | 'town_rules'
      | 'beringin'
      | 'announcement_board'
      | 'wisma_mailbox';
    treeIndex?: number;
    leafId?: number;
    benchId?: BenchId;
    benchName?: string;
    wismaId?: HousingUnitDef['id'];
    wismaName?: string;
  } | null>(null);
  const nearbyActionRef = useRef<{
    type:
      | 'tree'
      | 'dry_leaf'
      | 'fishing'
      | 'literacy'
      | 'bench'
      | 'town_rules'
      | 'beringin'
      | 'announcement_board'
      | 'wisma_mailbox';
    treeIndex?: number;
    leafId?: number;
    benchId?: BenchId;
    benchName?: string;
    wismaId?: HousingUnitDef['id'];
    wismaName?: string;
  } | null>(null);
  nearbyActionRef.current = nearbyAction;

  // Signature helper & auto-dismiss tracker so a nearbyAction popup that auto-hides after 10s
  // does not re-pop on the next animation frame while the avatar stands still at the same spot
  const getNearbyActionSignature = (
    act: {
      type:
        | 'tree'
        | 'dry_leaf'
        | 'fishing'
        | 'literacy'
        | 'bench'
        | 'town_rules'
        | 'beringin'
        | 'announcement_board'
        | 'wisma_mailbox';
      treeIndex?: number;
      leafId?: number;
      benchId?: BenchId;
      wismaId?: string;
    } | null
  ): string | null => {
    if (!act) return null;
    return `${act.type}:${act.treeIndex ?? ''}:${act.leafId ?? ''}:${act.benchId ?? ''}:${act.wismaId ?? ''}`;
  };
  const dismissedNearbySignatureRef = useRef<string | null>(null);

  // Fishing state, phase ('casting' | 'waiting' | 'pulling' | null) & timers
  const [isFishing, setIsFishing] = useState(false);
  const isFishingRef = useRef(false);
  isFishingRef.current = isFishing;
  const [fishingPhase, setFishingPhase] = useState<'casting' | 'waiting' | 'pulling' | null>(null);
  const fishingPhaseRef = useRef<'casting' | 'waiting' | 'pulling' | null>(null);
  fishingPhaseRef.current = fishingPhase;
  const fishingTimerRef = useRef<number | null>(null);
  const fishingStartTimeRef = useRef<number>(0);
  const fishingPullStartTimeRef = useRef<number>(0);
  const caughtFishRef = useRef<{ name: string; icon: string } | null>(null);

  // 5-Second Soft Auto-Dismiss & Soft Appearance State for Information Popups (pendingConfirmation, nearbyAction, isCafeMenuOpen)
  const [isInfoPopupSoftFading, setIsInfoPopupSoftFading] = useState(false);
  const [isInfoPopupSoftEntering, setIsInfoPopupSoftEntering] = useState(false);
  const [popupInteractionTick, setPopupInteractionTick] = useState(0);

  const activeInfoPopupKey = isCafeMenuOpen
    ? 'cafe_menu'
    : pendingConfirmation
    ? `confirm:${pendingConfirmation.type}:${pendingConfirmation.id}`
    : nearbyAction
    ? `nearby:${getNearbyActionSignature(nearbyAction)}:${isFishing ? fishingPhase || 'fishing' : 'idle'}`
    : null;

  useEffect(() => {
    if (!activeInfoPopupKey) {
      setIsInfoPopupSoftFading(false);
      setIsInfoPopupSoftEntering(false);
      return;
    }

    // Soft entrance: start with entering true, then animate to full visibility
    setIsInfoPopupSoftFading(false);
    setIsInfoPopupSoftEntering(true);
    const enterTimer = window.setTimeout(() => {
      setIsInfoPopupSoftEntering(false);
    }, 40);

    // Soft fade-out begins at 4.2s (800ms smooth transition before full removal at 5.0s)
    const fadeTimer = window.setTimeout(() => {
      setIsInfoPopupSoftFading(true);
    }, 4200);

    const dismissTimer = window.setTimeout(() => {
      if (isCafeMenuOpen) {
        setIsCafeMenuOpen(false);
      }
      if (pendingConfirmationRef.current) {
        setPendingConfirmation(null);
      }
      if (nearbyActionRef.current) {
        dismissedNearbySignatureRef.current = getNearbyActionSignature(nearbyActionRef.current);
        setNearbyAction(null);
      }
      setIsInfoPopupSoftFading(false);
      setIsInfoPopupSoftEntering(false);
    }, 5000);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [activeInfoPopupKey, popupInteractionTick, isCafeMenuOpen]);

  // User Camera Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;

  // Active comic speech bubbles (ONLY for live direct chat messages)
  const playerSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);
  const baristaSpeechRef = useRef<{ text: string; expiresAt: number } | null>(null);

  // Animated destination click ripple (supports single-click walk and double-click sprint)
  const clickRippleRef = useRef<{ wx: number; wy: number; time: number; isRun?: boolean } | null>(null);

  // Player avatar object reference for direct snapping/controls
  const playerRef = useRef<AvatarData | null>(null);
  // 5-Second Soft Fade-Out for in-world overhead text tags above buildings, places, leaves, campfire, etc. when avatar stays still in position
  const playerStationaryStartTimeRef = useRef<number>(performance.now());
  const playerStationaryLastPosRef = useRef<{ wx: number; wy: number }>({ wx: 0, wy: 0 });
  const npcsRef = useRef<AvatarData[]>([]);
  const lastMoveBroadcastTimeRef = useRef<number>(0);

  // Remote online players from other devices & Clickable Warga Online Dropdown
  const remotePlayersRef = useRef<Map<string, AvatarData>>(new Map());
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [onlineRemoteList, setOnlineRemoteList] = useState<
    Array<{ id: string; handle: string; name: string; role: string; isMoving: boolean; isSitting: boolean; wx: number; wy: number }>
  >([]);
  const [isOnlineListOpen, setIsOnlineListOpen] = useState<boolean>(false);
  const [isOnlineListSoftFading, setIsOnlineListSoftFading] = useState<boolean>(false);
  const [onlineListInteractionTick, setOnlineListInteractionTick] = useState<number>(0);
  const sendHeartbeatRef = useRef<(() => void) | null>(null);

  // Auto-close Warga Online dropdown softly after 10 seconds if not clicked
  useEffect(() => {
    setIsOnlineListSoftFading(false);
    if (!isOnlineListOpen) return;

    const fadeTimer = window.setTimeout(() => {
      setIsOnlineListSoftFading(true);
    }, 9200);

    const closeTimer = window.setTimeout(() => {
      setIsOnlineListOpen(false);
      setIsOnlineListSoftFading(false);
    }, 10000);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(closeTimer);
    };
  }, [isOnlineListOpen, onlineListInteractionTick]);

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
  const weatherTypeRef = useRef<WeatherType>(weatherType || getWeatherTypeWita());
  weatherTypeRef.current = weatherType || getWeatherTypeWita();
  const studentPointsRef = useRef(studentPoints);
  studentPointsRef.current = studentPoints;
  const onDeductPointsRef = useRef(onDeductPoints);
  onDeductPointsRef.current = onDeductPoints;
  const onAddXpRef = useRef(onAddXp);
  onAddXpRef.current = onAddXp;
  const handleHarvestTreeAppleRef = useRef<(treeIdx: number) => void>(() => {});
  const handlePickDryLeafRef = useRef<(leafId: number) => void>(() => {});

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
    onArrive?: () => void,
    isRun: boolean = false
  ) => {
    const p = playerRef.current;
    if (!p) return;

    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);

    const dist = Math.hypot(p.wx - targetX, p.wy - targetY);
    clickRippleRef.current = { wx: targetX, wy: targetY, time: performance.now(), isRun };

    if (dist <= 0.14) {
      pendingSeatRef.current = null;
      p.wx = targetX;
      p.wy = targetY;
      p.targetWx = targetX;
      p.targetWy = targetY;
      p.isMoving = false;
      p.isRunning = false;
      p.speed = 0.88;
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
    p.isRunning = isRun;
    p.speed = isRun ? 1.28 : 0.88;
    sendHeartbeatRef.current?.();
  };

  // Helper to sit on a 2-person minimalist fountain bench or campfire warming bench (walks there first)
  const sitOnTwoPersonBench = (
    group: TwoPersonBenchGroup,
    preferredIdx: 0 | 1 = 0,
    isRun: boolean = false
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
    }, isRun);
    return true;
  };

  // Helper to ride a swing at either of the 2 Swing Locations (walks there first, then deducts 1 XP upon sitting)
  const rideSwingWithXp = (preferredSwing: SwingSeatDef, isRun: boolean = false): boolean => {
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
    }, isRun);
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

    const mySessionId = `${isTeacher ? 'guru' : isGuest ? 'wartawan' : 'siswa'}_${cleanHandle}_${clientDeviceId}`;

    const syncOnlineUiList = () => {
      if (!isMounted) return;
      const list = Array.from(remotePlayersRef.current.values()).map((r) => ({
        id: r.id,
        handle: r.handle,
        name: r.name || r.handle,
        role: r.role === 'guru' ? 'guru' : r.role === 'wartawan' ? 'wartawan' : 'siswa',
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
        const isRemGuest = rem.role === 'wartawan' || Boolean(rem.isGuest) || String(rem.handle || '').toLowerCase() === 'tamu_kota';
        const remRole: 'guru' | 'wartawan' | 'siswa' = isRemTeacher ? 'guru' : isRemGuest ? 'wartawan' : 'siswa';
        const remGender: 'L' | 'P' = rem.gender === 'P' ? 'P' : 'L';
        const incomingWx = typeof rem.wx === 'number' && !isNaN(rem.wx) ? rem.wx : 0.0;
        const incomingWy = typeof rem.wy === 'number' && !isNaN(rem.wy) ? rem.wy : 6.38;
        const incomingTargetWx = typeof rem.targetWx === 'number' && !isNaN(rem.targetWx) ? rem.targetWx : incomingWx;
        const incomingTargetWy = typeof rem.targetWy === 'number' && !isNaN(rem.targetWy) ? rem.targetWy : incomingWy;

        const remOutfit = getDistinctAvatarOutfit(`${rem.id || ''}_${rem.name || rem.handle || ''}`);
        let existing = remotePlayersRef.current.get(rem.id);
        if (!existing) {
          existing = {
            id: rem.id,
            role: remRole,
            handle: String(rem.handle || 'warga').replace(/^@/, ''),
            name: rem.name || rem.handle || 'Warga',
            roleLabel: rem.roleLabel || (isRemTeacher ? 'GURU DKV' : isRemGuest ? 'WARTAWAN KOTA' : 'Siswa DKV'),
            wx: incomingWx,
            wy: incomingWy,
            targetWx: incomingTargetWx,
            targetWy: incomingTargetWy,
            speed: typeof rem.speed === 'number' && rem.speed > 0 ? rem.speed : 0.88,
            shirtColor: rem.shirtColor || remOutfit.shirt,
            pantsColor: rem.pantsColor || remOutfit.pants,
            hairColor: rem.hairColor || (remGender === 'P' ? remOutfit.hijab : '#0f172a'),
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
          existing.roleLabel = rem.roleLabel || (isRemTeacher ? 'GURU DKV' : isRemGuest ? 'WARTAWAN KOTA' : 'Siswa DKV');
          existing.gender = remGender;
          existing.shirtColor = rem.shirtColor || remOutfit.shirt;
          existing.pantsColor = rem.pantsColor || remOutfit.pants;
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
      const myOutfit = getDistinctAvatarOutfit(`${studentId || ''}_${studentName}`);
      return {
        id: mySessionId,
        handle: p ? p.handle : cleanHandle,
        name: studentName,
        role: isTeacher ? 'guru' : isGuest ? 'wartawan' : 'siswa',
        isTeacher: Boolean(isTeacher),
        isGuest: Boolean(isGuest),
        roleLabel: isTeacher ? 'GURU DKV' : isGuest ? 'WARTAWAN KOTA' : 'Siswa DKV',
        gender: p?.gender || (studentGender === 'P' ? 'P' : 'L'),
        shirtColor: p?.shirtColor || myOutfit.shirt,
        pantsColor: p?.pantsColor || myOutfit.pants,
        hairColor: p?.hairColor || (studentGender === 'P' ? myOutfit.hijab : '#0f172a'),
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

    // 1. Player (Siswa / Guru / Tamu Wartawan) spawning right at the Welcome Gapura at the edge of the map
    const isPlayerTeacher = Boolean(isTeacher);
    const isPlayerGuest = Boolean(isGuest || studentHandle === 'tamu_kota');
    const playerOutfit = getDistinctAvatarOutfit(`${studentId || ''}_${studentName}`);
    const player: AvatarData = {
      id: isPlayerTeacher ? 'guru_player' : isPlayerGuest ? 'tamu_wartawan' : 'siswa',
      role: isPlayerTeacher ? 'guru' : isPlayerGuest ? 'wartawan' : 'siswa',
      handle: studentHandle,
      name: studentName,
      roleLabel: isPlayerTeacher ? 'Guru Pembimbing' : isPlayerGuest ? 'Wartawan Tamu Kota' : 'Kamu',
      wx: initWx,
      wy: initWy,
      targetWx: initWx,
      targetWy: initWy,
      speed: 0.88, // Calmer, slower, relaxed and steady walking speed
      shirtColor: isPlayerGuest ? '#d97706' : playerOutfit.shirt,
      pantsColor: isPlayerGuest ? '#334155' : playerOutfit.pants,
      hairColor: studentGender === 'P' ? playerOutfit.hijab : '#0f172a',
      gender: studentGender === 'P' ? 'P' : 'L',
      isMoving: false,
      isRunning: false,
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

    // 4. Ibu Muslim Sudut Literasi (Patra) - Selalu berada di Sudut Literasi samping Balai Kota mengajak orang membaca
    const patra: AvatarData = {
      id: 'patra',
      role: 'penjaga_literasi',
      handle: 'patra',
      name: 'Patra',
      roleLabel: 'Ibu Literasi',
      wx: 2.35,
      wy: -5.52,
      targetWx: 2.35,
      targetWy: -5.52,
      anchorX: 2.35,
      anchorY: -5.52,
      wanderRadius: 0.22, // Selalu berada di Sudut Literasi samping Balai Kota
      speed: 0.42,
      shirtColor: '#0d9488', // Gamis & Hijab Syar'i Ibu Muslimah warna hijau zamrud/toska lembut
      pantsColor: '#115e59',
      hairColor: '#064e3b',
      gender: 'P',
      isMoving: false,
      pauseTimer: 2.5,
      walkFrame: 0,
      facing: 'down-left',
      speeches: [
        'Assalamualaikum, yuk mampir baca buku! 📖',
        'Mari duduk di Sudut Literasi & baca komik! 📚',
        'Membaca membuka jendela dunia, ayo baca! ✨',
        'Ada komik DKV, majalah & koran seru di sini! 📰',
      ],
      speechText: 'Assalamualaikum, yuk mampir baca buku! 📖',
      speechTimer: 5.5,
    };

    // 5. Penjaga Gerbang Hutan Belantara & Danau Pusat (@tomi) - Menjaga pintu masuk di jalan belakang Pohon Refleksi (Khusus Guru)
    const tomi: AvatarData = {
      id: 'tomi',
      role: 'penjaga_kolam',
      handle: 'tomi',
      name: 'Tomi',
      roleLabel: 'Penjaga Gerbang Hutan & Danau',
      wx: 0.72,
      wy: -7.32,
      targetWx: 0.72,
      targetWy: -7.32,
      anchorX: 0.72,
      anchorY: -7.32,
      wanderRadius: 0,
      speed: 0,
      shirtColor: '#0d9488',
      pantsColor: '#334155',
      hairColor: '#0f172a',
      gender: 'L',
      isMoving: false,
      pauseTimer: 2.5,
      walkFrame: 0,
      facing: 'down-left',
      speeches: [
        'Jalur belakang Pohon Refleksi menuju Hutan & Danau khusus Guru! 👨‍🏫🔒',
        'Halo Bapak/Ibu Guru, silakan masuk lewat gerbang ini! 🌲✨',
        'Area Hutan Belantara & Danau Pusat dijaga ketat khusus Guru! 🛡️',
        'Siswa silakan menulis jurnal di Pohon Refleksi di depan ya! 🌳📖',
      ],
      speechText: 'Jalur masuk Hutan & Danau ini khusus Guru ya! 👨‍🏫🔒',
      speechTimer: 5.5,
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
    npcsRef.current = npcs;

    // Cafe coordinates (Toko Roti & Kafe - Di ujung kota belakang Lab DKV)
    const cafeWx = 4.65;
    const cafeWy = 4.55;

    // -----------------------------------------------------------
    // SKY & WEATHER ELEMENTS (4 Cuaca: Normal, Berawan, Hujan Ringan, Salju)
    // -----------------------------------------------------------
    // Puffy horizontal flat cumulus clouds in daytime
    const clouds: Cloud[] = [
      { x: width * 0.22, y: 110, w: 120, h: 36, speed: 8 },
      { x: width * 0.58, y: 60, w: 90, h: 28, speed: 10 },
      { x: width * 0.85, y: 130, w: 140, h: 42, speed: 7 },
    ];

    // Extra layered cumulus clouds for Berawan (15.00 - 17.00 WITA)
    const extraOvercastClouds: Cloud[] = [
      { x: width * 0.05, y: 35, w: 155, h: 46, speed: 6 },
      { x: width * 0.38, y: 78, w: 135, h: 40, speed: 7.5 },
      { x: width * 0.65, y: 42, w: 170, h: 50, speed: 5.5 },
      { x: width * 0.88, y: 88, w: 125, h: 36, speed: 8 },
    ];

    // Gentle raindrops for Hujan Ringan (10.00-12.00 & 21.00-22.30 WITA)
    const raindrops: RaindropParticle[] = Array.from({ length: 75 }, () => ({
      x: Math.random() * (width + 80) - 40,
      y: Math.random() * (height + 60) - 30,
      vx: -18 + Math.random() * 5,
      vy: 340 + Math.random() * 110,
      length: 12 + Math.random() * 7,
    }));

    const rainRipples: RainRipple[] = Array.from({ length: 12 }, () => ({
      x: 0,
      y: 0,
      radius: 0,
      alpha: 0,
    }));
    let rippleHeadIdx = 0;

    // Gentle floating snowflakes for Salju (00.00 - 02.30 WITA)
    const snowflakes: SnowflakeParticle[] = Array.from({ length: 65 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 1.2 + Math.random() * 2.2,
      vy: 32 + Math.random() * 28,
      swayAmp: 18 + Math.random() * 16,
      swaySpeed: 1.2 + Math.random() * 1.6,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.5 + Math.random() * 0.45,
    }));

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

    // Minimalist tiny flying birds (halus, kecil, tidak menghalangi tampilan bangunan/avatar)
    const minimalistBirds: MinimalistBird[] = [
      // 4 Sky-horizon pair gliders (high in the sky backdrop)
      {
        id: 0,
        mode: 'sky',
        x: width * 0.15,
        y: 52,
        vx: 18,
        vyWave: 3.5,
        centerWx: 0,
        centerWy: 0,
        orbitRx: 0,
        orbitRy: 0,
        angle: 0,
        angularSpeed: 0,
        altitude: 0,
        wingSpan: 3.6,
        flapSpeed: 6.2,
        phase: 0.2,
      },
      {
        id: 1,
        mode: 'sky',
        x: width * 0.15 - 14,
        y: 58,
        vx: 18,
        vyWave: 3.5,
        centerWx: 0,
        centerWy: 0,
        orbitRx: 0,
        orbitRy: 0,
        angle: 0,
        angularSpeed: 0,
        altitude: 0,
        wingSpan: 3.1,
        flapSpeed: 6.5,
        phase: 1.1,
      },
      {
        id: 2,
        mode: 'sky',
        x: width * 0.68,
        y: 84,
        vx: 14,
        vyWave: 2.8,
        centerWx: 0,
        centerWy: 0,
        orbitRx: 0,
        orbitRy: 0,
        angle: 0,
        angularSpeed: 0,
        altitude: 0,
        wingSpan: 3.4,
        flapSpeed: 5.8,
        phase: 2.4,
      },
      {
        id: 3,
        mode: 'sky',
        x: width * 0.68 - 12,
        y: 90,
        vx: 14,
        vyWave: 2.8,
        centerWx: 0,
        centerWy: 0,
        orbitRx: 0,
        orbitRy: 0,
        angle: 0,
        angularSpeed: 0,
        altitude: 0,
        wingSpan: 2.9,
        flapSpeed: 6.1,
        phase: 3.2,
      },
      // 4 High-altitude world-space park gliders (soaring gently above outer trees & pond)
      {
        id: 4,
        mode: 'world',
        x: 0,
        y: 0,
        vx: 0,
        vyWave: 0,
        centerWx: BERINGIN_TREE_COORDS.wx,
        centerWy: BERINGIN_TREE_COORDS.wy + 0.4, // High above Pohon Beringin Jurnal near Bank Materi
        orbitRx: 2.2,
        orbitRy: 1.1,
        angle: 0.4,
        angularSpeed: 0.32,
        altitude: 118,
        wingSpan: 3.4,
        flapSpeed: 5.6,
        phase: 0.5,
      },
      {
        id: 5,
        mode: 'world',
        x: 0,
        y: 0,
        vx: 0,
        vyWave: 0,
        centerWx: BERINGIN_TREE_COORDS.wx,
        centerWy: BERINGIN_TREE_COORDS.wy + 0.4, // Companion bird near Pohon Beringin Jurnal
        orbitRx: 2.35,
        orbitRy: 1.18,
        angle: 0.22,
        angularSpeed: 0.32,
        altitude: 114,
        wingSpan: 2.9,
        flapSpeed: 6.0,
        phase: 1.4,
      },
      {
        id: 6,
        mode: 'world',
        x: 0,
        y: 0,
        vx: 0,
        vyWave: 0,
        centerWx: 4.55,
        centerWy: -10.45, // High above Danau Pusat Sungai Mengalir
        orbitRx: 1.8,
        orbitRy: 1.2,
        angle: 2.1,
        angularSpeed: -0.28,
        altitude: 96,
        wingSpan: 3.2,
        flapSpeed: 5.9,
        phase: 2.0,
      },
      {
        id: 7,
        mode: 'world',
        x: 0,
        y: 0,
        vx: 0,
        vyWave: 0,
        centerWx: 2.35,
        centerWy: -6.15, // High above Sudut Literasi beside Balai Kota
        orbitRx: 1.9,
        orbitRy: 1.25,
        angle: 4.2,
        angularSpeed: 0.3,
        altitude: 98,
        wingSpan: 3.1,
        flapSpeed: 5.7,
        phase: 3.8,
      },
    ];

    // Occasional Airplane Contrail in Sky Background (Random Timing)
    interface SkyContrailFlight {
      active: boolean;
      startX: number;
      startY: number;
      dirX: number;
      dirY: number;
      speed: number;
      startTime: number;
      flightDuration: number;
      fadeDuration: number;
      nextSpawnTime: number;
    }

    const skyContrail: SkyContrailFlight = {
      active: false,
      startX: -60,
      startY: 55,
      dirX: 1,
      dirY: -0.08,
      speed: 36,
      startTime: 0,
      flightDuration: 22,
      fadeDuration: 14,
      // First contrail appears after a random 4–10 seconds, then subsequent random intervals
      nextSpawnTime: 4 + Math.random() * 6,
    };

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

    const handlePointerAction = (clientX: number, clientY: number, isRun: boolean = false) => {
      const { sx, sy, wx, wy } = getPointerWorldPos(clientX, clientY);

      // 0. Check Click on Player Avatar -> Open/Toggle 5-Reaction Circular Menu (Joget, Jempol, Suka, Tertawa, Lambai)
      const z = zoomLevelRef.current;
      const pPt = toScreen(player.wx, player.wy, 0, camera.x, camera.y);
      const distToPlayerScreen = Math.hypot(sx - pPt.x, sy - (pPt.y - 12 * z));
      const distToPlayerWorld = Math.hypot(wx - player.wx, wy - player.wy);

      if (distToPlayerScreen < 28 * z || distToPlayerWorld < 0.65) {
        sounds.playClick();
        emoteTargetAvatarRef.current = null;
        setIsEmoteMenuOpen((prev) => {
          const next = !prev;
          if (next) {
            setPlayerScreenPos({ x: Math.round(pPt.x), y: Math.round(pPt.y - 12 * z) });
          }
          return next;
        });
        return;
      }

      // If circular emote menu was open and user clicked elsewhere, dismiss it
      if (isEmoteMenuOpenRef.current) {
        setIsEmoteMenuOpen(false);
      }

      // 0B. Check Click on NPC -> Show NPC Greeting / Voice Speech ONLY (TIDAK membuka menu reaksi avatar lain)
      // "Pastikan kita tidak bisa mengakses reaksi avatar lainnya. Kita hanya bisa mengakses avatar kita sendiri."
      let clickedNpc: AvatarData | null = null;
      for (const npc of npcs) {
        const nPt = toScreen(npc.wx, npc.wy, 0, camera.x, camera.y);
        const dScreen = Math.hypot(sx - nPt.x, sy - (nPt.y - 12 * z));
        const dWorld = Math.hypot(wx - npc.wx, wy - npc.wy);
        if (dScreen < 26 * z || dWorld < 0.62) {
          clickedNpc = npc;
          break;
        }
      }

      if (clickedNpc) {
        sounds.playClick();
        if (clickedNpc.speeches && clickedNpc.speeches.length > 0) {
          const sIdx = Math.floor(Math.random() * clickedNpc.speeches.length);
          clickedNpc.speechText = clickedNpc.speeches[sIdx];
          clickedNpc.speechTimer = 5.0;
        }
        if (clickedNpc.id === 'tomi' && !isTeacher) {
          showToast('🔒 Gerbang Hutan & Danau dijaga ketat oleh @tomi khusus Guru!', 3200);
        }
        return;
      }

      // Reset any auto-dismissed nearby popup when the user explicitly clicks/taps on the map
      dismissedNearbySignatureRef.current = null;

      // 1. Check Click on Cafe Stall (Toko Roti & Kafe di ujung kota belakang Lab DKV)
      // Harus berjalan mendekati kafe terlebih dahulu, lalu pop-up konfirmasi akan muncul saat avatar sudah di dekat kafe
      const cafeDist = Math.hypot(wx - cafeWx, wy - cafeWy);
      if (cafeDist < 1.65) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        player.targetWx = 4.15;
        player.targetWy = 4.15; // Counter front
        player.isMoving = Math.hypot(player.wx - 4.15, player.wy - 4.15) > 0.08;
        if (player.isMoving) {
          player.isRunning = isRun;
          player.speed = isRun ? 1.28 : 0.88;
        }
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        pendingBuildingId = null;
        // Reset lastTouchedIdRef so proximity check triggers the top pop-up once avatar is near Cafe
        lastTouchedIdRef.current = null;
        return;
      }

      // 1b. Check Click on Papan Peraturan Kota di Dekat Gapura Masuk [1.45, 5.95] or Welcome Gate [0, 6.15]
      // Avatar harus berjalan ke dekat papan peraturan terlebih dahulu, dan masuk ke informasi melalui pop-up di atas
      const rulesDist = Math.hypot(wx - TOWN_RULES_BOARD_COORDS.wx, wy - TOWN_RULES_BOARD_COORDS.wy);
      const gateDist = Math.hypot(wx - 0, wy - 6.15);
      if (rulesDist < 1.25 || gateDist < 1.35) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        player.targetWx = 1.25;
        player.targetWy = 5.95;
        player.isMoving = Math.hypot(player.wx - 1.25, player.wy - 5.95) > 0.08;
        if (player.isMoving) {
          player.isRunning = isRun;
          player.speed = isRun ? 1.28 : 0.88;
        }
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        return;
      }

      // 1c. Check Click on Pohon Beringin Jurnal Harian (3 petak di samping kiri dekat Bank Materi [-2.95, -5.85])
      // Avatar harus berjalan ke dekat Pohon Jurnal terlebih dahulu, lalu masuk ke informasi melalui pop-up di atas
      const beringinDist = Math.hypot(wx - BERINGIN_TREE_COORDS.wx, wy - BERINGIN_TREE_COORDS.wy);
      if (beringinDist < 1.55) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        player.targetWx = BERINGIN_TREE_COORDS.wx;
        player.targetWy = BERINGIN_TREE_COORDS.wy + 0.6;
        player.isMoving =
          Math.hypot(player.wx - BERINGIN_TREE_COORDS.wx, player.wy - (BERINGIN_TREE_COORDS.wy + 0.6)) > 0.08;
        if (player.isMoving) {
          player.isRunning = isRun;
          player.speed = isRun ? 1.28 : 0.88;
        }
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        return;
      }

      // 1d. Check Click on Papan Pengumuman Guru di Dekat Balai Kota [-1.55, -3.45]
      // Avatar harus berjalan ke dekat Papan Pengumuman terlebih dahulu, lalu membuka informasi melalui pop-up di atas
      const annBoardDist = Math.hypot(wx - ANNOUNCEMENT_BOARD_COORDS.wx, wy - ANNOUNCEMENT_BOARD_COORDS.wy);
      if (annBoardDist < 1.15) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        player.targetWx = -1.35;
        player.targetWy = -3.15;
        player.isMoving = Math.hypot(player.wx - -1.35, player.wy - -3.15) > 0.08;
        if (player.isMoving) {
          player.isRunning = isRun;
          player.speed = isRun ? 1.28 : 0.88;
        }
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        setTeacherAnnouncements(StorageService.getTeacherAnnouncements());
        return;
      }

      const canAccessWilderness = Boolean(isPlayerTeacher || isMasterKikyRef.current);

      // 1f. Check Click directly on @tomi or Gerbang Hutan Refleksia [wx: -0.65..1.05, wy: -7.95..-7.05]
      if (Math.hypot(wx - 0.25, wy - -7.48) < 1.05) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        if (canAccessWilderness) {
          tomi.speechText = 'Silakan masuk Bapak/Ibu Guru! Gerbang Hutan Refleksia terbuka 🌲🔓';
          tomi.speechTimer = 6.0;
          player.targetWx = 0.0;
          player.targetWy = player.wy > WILDERNESS_FENCE_WY ? -8.35 : -6.85;
        } else {
          tomi.speechText = '⛔ Maaf, area Hutan Refleksia & Sungai Refleksia hanya untuk Guru! 👨‍🏫🔒';
          tomi.speechTimer = 6.5;
          playerSpeechRef.current = {
            text: '🔒 Area Hutan Refleksia khusus Guru (dijaga @tomi)',
            expiresAt: Date.now() + 4500,
          };
          player.targetWx = 0.0;
          player.targetWy = -7.08;
        }
        player.isMoving = Math.hypot(player.wx - player.targetWx, player.wy - player.targetWy) > 0.08;
        player.isRunning = isRun;
        player.speed = isRun ? 1.28 : 0.88;
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        return;
      }

      // 2. Check Click on Spot Pemancingan 1 Petak di Sungai Refleksia [2.05, -10.15]
      const fishSpotDist = Math.hypot(wx - FISHING_SPOT_COORDS.wx, wy - FISHING_SPOT_COORDS.wy);
      const lakeClick = wx > 1.75 && wx < 6.85 && wy > -12.0 && wy < -8.85;
      if (fishSpotDist < 1.45 || lakeClick) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        if (!canAccessWilderness) {
          tomi.speechText = '⛔ Maaf, area Hutan Refleksia & Sungai Refleksia hanya untuk Guru! 👨‍🏫🔒';
          tomi.speechTimer = 6.5;
          playerSpeechRef.current = {
            text: '🔒 Hanya Guru yang bisa masuk ke Hutan Refleksia lewat gerbang @tomi!',
            expiresAt: Date.now() + 4500,
          };
          player.targetWx = 0.0;
          player.targetWy = -7.08;
          player.isMoving = Math.hypot(player.wx - 0.0, player.wy - -7.08) > 0.08;
          player.isRunning = isRun;
          player.speed = isRun ? 1.28 : 0.88;
          clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
          return;
        }
        player.targetWx = DANAU_VIEW_DECK_COORDS.wx;
        player.targetWy = DANAU_VIEW_DECK_COORDS.wy;
        player.facing = 'down-right';
        player.isMoving = Math.hypot(player.wx - DANAU_VIEW_DECK_COORDS.wx, player.wy - DANAU_VIEW_DECK_COORDS.wy) > 0.08;
        player.isRunning = isRun;
        player.speed = isRun ? 1.28 : 0.88;
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        return;
      }

      // 3. Check Click on Benches (8 Minimalist Fountain Benches [2-seater], 2 Literacy Benches [2-seater], 2 Campfire Benches [2-seater]) & 2 Swing Structures (-1 XP)
      for (const group of ALL_TWO_PERSON_BENCHES) {
        const groupDist = Math.hypot(wx - group.wx, wy - group.wy);
        if (groupDist < 0.85) {
          const distA = Math.hypot(wx - group.seats[0].wx, wy - group.seats[0].wy);
          const distB = Math.hypot(wx - group.seats[1].wx, wy - group.seats[1].wy);
          const preferredIdx: 0 | 1 = distB < distA ? 1 : 0;
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          sitOnTwoPersonBench(group, preferredIdx, isRun);
          return;
        }
      }

      // 3b. Check Click directly on Campfire in Corner [-4.65, 4.65] -> Walk to & sit on nearest available Campfire Bench to warm up!
      if (Math.hypot(wx - CAMPFIRE_COORDS.wx, wy - CAMPFIRE_COORDS.wy) < 1.15) {
        const distLeft = Math.hypot(wx - CAMPFIRE_BENCHES[0].wx, wy - CAMPFIRE_BENCHES[0].wy);
        const distRight = Math.hypot(wx - CAMPFIRE_BENCHES[1].wx, wy - CAMPFIRE_BENCHES[1].wy);
        const firstGroup = distRight < distLeft ? CAMPFIRE_BENCHES[1] : CAMPFIRE_BENCHES[0];
        const secondGroup = distRight < distLeft ? CAMPFIRE_BENCHES[0] : CAMPFIRE_BENCHES[1];
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        if (!sitOnTwoPersonBench(firstGroup, 0, isRun)) {
          sitOnTwoPersonBench(secondGroup, 0, isRun);
        }
        return;
      }

      // 3c. Check Click on 2 Swing Locations (4 Swing Seats, walks there first then costs 1 XP to ride)
      for (const swing of REFLECTION_SWINGS) {
        const swingDist = Math.hypot(wx - swing.wx, wy - swing.wy);
        if (swingDist < 0.88) {
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          rideSwingWithXp(swing, isRun);
          return;
        }
      }

      // 3d. Check Click on Sudut Literasi Warga di Samping Balai Kota [2.35, -6.15]
      // Avatar berjalan ke dekat Sudut Literasi terlebih dahulu, lalu membuka bacaan melalui pop-up di atas
      const litSpotDist = Math.hypot(wx - LITERACY_CORNER_COORDS.wx, wy - LITERACY_CORNER_COORDS.wy);
      if (litSpotDist < 1.35) {
        sounds.playClick();
        if (isSittingRef.current) {
          setIsSitting(false);
          setSittingSeat(null);
        }
        pendingSeatRef.current = null;
        pendingBuildingId = null;
        lastTouchedIdRef.current = null;
        setPendingConfirmation(null);
        setIsCafeMenuOpen(false);
        player.targetWx = LITERACY_CORNER_COORDS.wx;
        player.targetWy = LITERACY_CORNER_COORDS.wy + 0.45;
        player.isMoving =
          Math.hypot(player.wx - LITERACY_CORNER_COORDS.wx, player.wy - (LITERACY_CORNER_COORDS.wy + 0.45)) > 0.08;
        if (player.isMoving) {
          player.isRunning = isRun;
          player.speed = isRun ? 1.28 : 0.88;
        }
        clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
        return;
      }

      // 4a. Check Click on Dry Leaf (Daun Kering) -> Walk to leaf & pick it up (5 leaves = +1 XP)
      for (const leaf of dryLeavesRef.current) {
        if (leaf.pickedAt !== null) continue;
        const leafDist = Math.hypot(wx - leaf.wx, wy - leaf.wy);
        if (leafDist < 0.68) {
          sounds.playClick();
          if (isSittingRef.current) {
            setIsSitting(false);
            setSittingSeat(null);
          }
          pendingSeatRef.current = null;
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          const pDist = Math.hypot(player.wx - leaf.wx, player.wy - leaf.wy);
          if (pDist <= 0.95) {
            handlePickDryLeafRef.current(leaf.id);
          } else {
            pendingEnvActionRef.current = {
              type: 'pick_leaf',
              leafId: leaf.id,
              targetX: leaf.wx,
              targetY: leaf.wy,
            };
            player.targetWx = leaf.wx;
            player.targetWy = leaf.wy;
            player.isMoving = true;
            player.isRunning = isRun;
            player.speed = isRun ? 1.28 : 0.88;
            clickRippleRef.current = { wx: leaf.wx, wy: leaf.wy, time: performance.now(), isRun };
          }
          return;
        }
      }

      // 4b. Check Click on Map Trees -> Walk to tree & show pop-up at top when near
      for (let tIdx = 0; tIdx < TREES_LIST.length; tIdx++) {
        const [tx, ty] = TREES_LIST[tIdx];
        const tDist = Math.hypot(wx - tx, wy - ty);
        if (tDist < 0.78) {
          sounds.playClick();
          if (isSittingRef.current) {
            setIsSitting(false);
            setSittingSeat(null);
          }
          pendingSeatRef.current = null;
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          const standX = tx + (player.wx >= tx ? 0.42 : -0.42);
          const standY = ty + (player.wy >= ty ? 0.42 : -0.42);
          player.targetWx = standX;
          player.targetWy = standY;
          player.isMoving = Math.hypot(player.wx - standX, player.wy - standY) > 0.08;
          if (player.isMoving) {
            player.isRunning = isRun;
            player.speed = isRun ? 1.28 : 0.88;
          }
          clickRippleRef.current = { wx: standX, wy: standY, time: performance.now(), isRun };
          return;
        }
      }

      // 4c. Check Click on Perumahan Guru & Siswa + Kotak Surat Kecil (Masukan & Saran) behind Perpustakaan Kampus
      // Avatar harus berjalan ke dekat Wisma/Kotak Surat terlebih dahulu, lalu membuka kotak saran melalui pop-up di atas
      for (const h of HOUSING_UNITS) {
        const distToHouse = Math.hypot(wx - h.wx, wy - h.wy);
        const distToMailbox = Math.hypot(wx - (h.wx + 0.75), wy - (h.wy + 0.25));
        if (distToHouse < 1.15 || distToMailbox < 0.95) {
          sounds.playClick();
          if (isSittingRef.current) {
            setIsSitting(false);
            setSittingSeat(null);
          }
          pendingSeatRef.current = null;
          player.targetWx = -6.05;
          player.targetWy = h.wy;
          player.isMoving = Math.hypot(player.wx - -6.05, player.wy - h.wy) > 0.08;
          if (player.isMoving) {
            player.isRunning = isRun;
            player.speed = isRun ? 1.28 : 0.88;
          }
          clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
          pendingBuildingId = null;
          lastTouchedIdRef.current = null;
          setPendingConfirmation(null);
          setIsCafeMenuOpen(false);
          return;
        }
      }

      // 5. Check Click on Buildings -> Walk to building doorstep first; top pop-up appears when avatar is near the building
      for (const b of BUILDINGS_INFO) {
        const [bx, , by] = b.position;
        const dist = Math.hypot(wx - bx, wy - by);
        if (dist < 1.55 || (Math.abs(wx - bx) < 1.35 && Math.abs(wy - by) < 1.35)) {
          sounds.playClick();
          if (isSittingRef.current) {
            setIsSitting(false);
            setSittingSeat(null);
          }
          pendingSeatRef.current = null;
          // Walk to doorstep so proximity check triggers pendingConfirmation pop-up
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
            player.targetWy = 1.15;
          } else if (b.id === 'masjid') {
            player.targetWx = 4.45;
            player.targetWy = -4.65;
          } else if (b.id === 'bank_materi') {
            player.targetWx = -4.35;
            player.targetWy = -4.65;
          } else {
            player.targetWx = bx * 0.68;
            player.targetWy = by * 0.68;
          }
          player.isMoving = Math.hypot(player.wx - player.targetWx, player.wy - player.targetWy) > 0.08;
          if (player.isMoving) {
            player.isRunning = isRun;
            player.speed = isRun ? 1.28 : 0.88;
          }
          clickRippleRef.current = { wx: player.targetWx, wy: player.targetWy, time: performance.now(), isRun };
          pendingBuildingId = b.id;
          // Reset lastTouchedIdRef so clicking a building when already nearby re-triggers its confirmation pop-up
          lastTouchedIdRef.current = null;
          return;
        }
      }

      // 6. Click on ground anywhere across the entire map (except pembatas, gunung, danau, sungai, air mancur)
      sounds.playClick();
      if (isSittingRef.current) {
        setIsSitting(false);
        setSittingSeat(null);
      }
      pendingSeatRef.current = null;
      let targetX = Math.max(-8.0, Math.min(8.0, wx));
      let targetY = Math.max(-11.75, Math.min(8.0, wy));

      // Jika bukan Guru dan mengklik area Hutan Refleksia / Sungai Refleksia di balik pagar (wy < -7.45),
      // arahkan ke depan pintu gerbang yang dijaga @tomi di jalan belakang Pohon Refleksi
      if (!canAccessWilderness && targetY < WILDERNESS_FENCE_WY + 0.22) {
        targetX = 0.0;
        targetY = -7.08;
        tomi.speechText = '⛔ Maaf, area Hutan Refleksia & Sungai Refleksia hanya untuk Guru! 👨‍🏫🔒';
        tomi.speechTimer = 6.5;
        playerSpeechRef.current = {
          text: '🔒 Hanya Guru yang bisa masuk lewat gerbang @tomi di belakang Pohon Refleksi!',
          expiresAt: Date.now() + 4500,
        };
      }

      // If clicking directly on Danau water basin, guide avatar to Lakeside Viewing Deck or southern shore
      if (targetX > 1.82 && targetY < -8.72) {
        if (targetX < 4.2 && targetY < -9.2) {
          targetX = DANAU_VIEW_DECK_COORDS.wx;
          targetY = DANAU_VIEW_DECK_COORDS.wy;
        } else {
          targetY = -8.58;
        }
      }
      // Keep target on the inner bank if clicking onto the river water (unless crossing the bridge at |wy| < 0.72)
      if (targetX > 6.72 && Math.abs(targetY) >= 0.72) {
        targetX = 6.68;
      }
      if (isSolidCollision(targetX, targetY, 0.1, canAccessWilderness)) {
        // Nudge away from solid obstacle (pembatas, gunung, danau, sungai, air mancur)
        const dirX = player.wx - targetX;
        const dirY = player.wy - targetY;
        const d = Math.hypot(dirX, dirY) || 1;
        targetX += (dirX / d) * 0.45;
        targetY += (dirY / d) * 0.45;
      }
      clickRippleRef.current = { wx: targetX, wy: targetY, time: performance.now(), isRun };
      player.targetWx = targetX;
      player.targetWy = targetY;
      player.isMoving = true;
      player.isRunning = isRun;
      player.speed = isRun ? 1.28 : 0.88;
      pendingBuildingId = null;
      lastTouchedIdRef.current = null;
    };

    let lastClickTimestamp = 0;
    let lastClickPos = { x: 0, y: 0 };
    let initialPinchDist: number | null = null;
    let initialPinchZoom = 1.0;
    let isPinching = false;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        isPinching = true;
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        initialPinchZoom = zoomLevelRef.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialPinchDist !== null && initialPinchDist > 0) {
        if (e.cancelable) e.preventDefault();
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const scale = currentDist / initialPinchDist;
        const newZoom = Math.min(1.65, Math.max(0.60, Number((initialPinchZoom * scale).toFixed(3))));
        zoomLevelRef.current = newZoom;
        setZoomLevel(newZoom);
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        initialPinchDist = null;
        setTimeout(() => {
          isPinching = false;
        }, 180);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (e.cancelable) e.preventDefault();
      const zoomStep = e.deltaY > 0 ? -0.06 : 0.06;
      const nextZoom = Math.min(1.65, Math.max(0.60, Number((zoomLevelRef.current + zoomStep).toFixed(2))));
      zoomLevelRef.current = nextZoom;
      setZoomLevel(nextZoom);
    };

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (isPinching) return;
      if ('touches' in e && e.touches && e.touches.length >= 2) return;

      let clientX = (e as MouseEvent).clientX;
      let clientY = (e as MouseEvent).clientY;
      if ('touches' in e && e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }

      const now = performance.now();
      const timeDelta = now - lastClickTimestamp;
      const distDelta = Math.hypot(clientX - lastClickPos.x, clientY - lastClickPos.y);

      // Detect rapid double-click or double-tap within 380ms and close screen distance (<50px)
      const isDoubleClick = timeDelta > 30 && timeDelta < 380 && distDelta < 50;

      lastClickTimestamp = now;
      lastClickPos = { x: clientX, y: clientY };
      playerStationaryStartTimeRef.current = now;

      handlePointerAction(clientX, clientY, isDoubleClick);
      // Immediately notify other devices of new position and movement
      sendHeartbeatRef.current?.();
    };

    const onDblClick = (e: MouseEvent) => {
      if (isPinching) return;
      handlePointerAction(e.clientX, e.clientY, true);
      sendHeartbeatRef.current?.();
    };

    const onPointerMove = (e: MouseEvent) => {
      const { wx, wy } = getPointerWorldPos(e.clientX, e.clientY);

      const isOverPlayer =
        Math.hypot(wx - player.wx, wy - player.wy) < 0.65 ||
        npcs.some((n) => Math.hypot(wx - n.wx, wy - n.wy) < 0.62) ||
        Array.from(remotePlayersRef.current.values()).some((r) => Math.hypot(wx - r.wx, wy - r.wy) < 0.62);

      const isOverInteractiveSpot =
        isOverPlayer ||
        Math.hypot(wx - cafeWx, wy - cafeWy) < 2.1 ||
        Math.hypot(wx - FISHING_SPOT_COORDS.wx, wy - FISHING_SPOT_COORDS.wy) < 2.75 ||
        Math.hypot(wx - (-4.3), wy - 1.8) < 2.0 ||
        Math.hypot(wx - (-3.7), wy - 1.8) < 1.05 ||
        Math.hypot(wx - CAMPFIRE_COORDS.wx, wy - CAMPFIRE_COORDS.wy) < 1.35 ||
        Math.hypot(wx - BERINGIN_TREE_COORDS.wx, wy - BERINGIN_TREE_COORDS.wy) < 1.65 ||
        Math.hypot(wx - TOWN_RULES_BOARD_COORDS.wx, wy - TOWN_RULES_BOARD_COORDS.wy) < 1.35 ||
        Math.hypot(wx - 0, wy - 6.15) < 1.45 ||
        HOUSING_UNITS.some((h) => Math.hypot(wx - h.wx, wy - h.wy) < 1.35) ||
        ALL_TWO_PERSON_BENCHES.some((g) => Math.hypot(wx - g.wx, wy - g.wy) < 1.05) ||
        SWING_STRUCTURES.some((s) => Math.hypot(wx - s.wx, wy - s.wy) < 1.15) ||
        dryLeavesRef.current.some((l) => l.pickedAt === null && Math.hypot(wx - l.wx, wy - l.wy) < 0.7) ||
        TREES_LIST.some(([tx, ty]) => Math.hypot(wx - tx, wy - ty) < 0.85);

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
    canvas.addEventListener('dblclick', onDblClick);
    canvas.addEventListener('mousemove', onPointerMove);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });
    canvas.addEventListener('wheel', onWheel, { passive: false });

    // Initial camera position centered on student
    camera.x = (player.wx - player.wy) * BASE_TILE_W * zoomLevelRef.current;
    camera.y = (player.wx + player.wy) * BASE_TILE_H * zoomLevelRef.current;

    // -----------------------------------------------------------
    // TREE POSITIONS MATCHING SCREENSHOT EXACTLY
    // (Lush double-sphere trees along outer perimeter and plaza edges)
    // -----------------------------------------------------------
    const trees = TREES_LIST;

    // -----------------------------------------------------------
    // WEATHER TRANSITION WEIGHTS (Smooth fade-in / fade-out)
    // -----------------------------------------------------------
    const initialWeather = weatherTypeRef.current || 'normal';
    const weatherWeights: Record<WeatherType, number> = {
      berawan: initialWeather === 'berawan' ? 1.0 : 0.0,
      hujan_ringan: initialWeather === 'hujan_ringan' ? 1.0 : 0.0,
      salju: initialWeather === 'salju' ? 1.0 : 0.0,
      normal: initialWeather === 'normal' || !initialWeather ? 1.0 : 0.0,
    };

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

      // Smoothly interpolate weather weights for dynamic fade-in and fade-out (~1.2s crossfade)
      const activeTargetWeather = weatherTypeRef.current || 'normal';
      const WEATHER_FADE_SPEED = 0.85;
      (['berawan', 'hujan_ringan', 'salju', 'normal'] as WeatherType[]).forEach((wt) => {
        const target = activeTargetWeather === wt ? 1.0 : 0.0;
        const cur = weatherWeights[wt];
        if (cur < target) {
          weatherWeights[wt] = Math.min(target, cur + delta * WEATHER_FADE_SPEED);
        } else if (cur > target) {
          weatherWeights[wt] = Math.max(target, cur - delta * WEATHER_FADE_SPEED);
        }
      });

      const currentTileW = BASE_TILE_W * zoomLevelRef.current;
      const currentTileH = BASE_TILE_H * zoomLevelRef.current;

      // Calculate overhead text tag fade multiplier for interactive world objects (bangunan, tempat, daun kering, api unggun, dll.)
      // When avatar stays still in a position for >= 5s, tags fade out softly (smooth transition between 4.2s and 5.0s)
      const pMoved = player.isMoving || Math.hypot(player.wx - playerStationaryLastPosRef.current.wx, player.wy - playerStationaryLastPosRef.current.wy) > 0.04;
      if (pMoved) {
        playerStationaryStartTimeRef.current = currentTime;
        playerStationaryLastPosRef.current = { wx: player.wx, wy: player.wy };
      }
      const stationarySecs = (currentTime - playerStationaryStartTimeRef.current) / 1000;
      let overheadTagAlpha = 1.0;
      if (stationarySecs >= 5.0) {
        overheadTagAlpha = 0.0;
      } else if (stationarySecs > 4.2) {
        overheadTagAlpha = Math.max(0, 1.0 - (stationarySecs - 4.2) / 0.8);
      }

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

      // Update screen coordinates for circular emote menu if open
      if (isEmoteMenuOpenRef.current) {
        const target = emoteTargetAvatarRef.current || playerRef.current;
        if (target) {
          const tPt = toScreen(target.wx, target.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          setPlayerScreenPos({ x: Math.round(tPt.x), y: Math.round(tPt.y - 12 * z) });
        }
      }

      // Check for local emote expiration
      if (playerEmoteRef.current && Date.now() >= playerEmoteRef.current.expiresAt) {
        playerEmoteRef.current = null;
        setPlayerEmote(null);
        if (playerRef.current) {
          playerRef.current.activeEmote = null;
        }
      }
      // Clear expired NPC emotes
      const nowEmoteCheck = Date.now();
      for (const npc of npcs) {
        if (npc.activeEmote && nowEmoteCheck >= npc.activeEmote.expiresAt) {
          npc.activeEmote = null;
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
        player.fishingStartTime = fishingStartTimeRef.current;
      } else if (player.isMoving) {
        const dx = player.targetWx - player.wx;
        const dy = player.targetWy - player.wy;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.08) {
          if (isMasterKikyRef.current && masterMoveModeRef.current === 'teleport') {
            // Instant Chrono-Teleportation exclusively for Master kikybahsoan
            teleportFlashRef.current = {
              fromWx: player.wx,
              fromWy: player.wy,
              toWx: player.targetWx,
              toWy: player.targetWy,
              startTime: currentTime,
            };
            player.wx = player.targetWx;
            player.wy = player.targetWy;
            player.walkFrame = 0;
          } else {
            const canEnterWilderness = Boolean(isPlayerTeacher || isMasterKikyRef.current);
            if (!canEnterWilderness && player.targetWy < WILDERNESS_FENCE_WY + 0.22) {
              player.targetWx = 0.0;
              player.targetWy = -7.08;
            }

            // Route Guru smoothly through the central gate on the road behind Pohon Refleksi (wx: 0, wy: -7.62) guarded by @tomi
            const isCrossingFenceNorth =
              player.wy > WILDERNESS_FENCE_WY - 0.16 && player.targetWy < WILDERNESS_FENCE_WY - 0.16;
            const isCrossingFenceSouth =
              player.wy < WILDERNESS_FENCE_WY + 0.16 && player.targetWy > WILDERNESS_FENCE_WY + 0.16;
            let activeTargetWx = player.targetWx;
            let activeTargetWy = player.targetWy;
            if (canEnterWilderness && (isCrossingFenceNorth || isCrossingFenceSouth)) {
              if (Math.abs(player.wx) > 0.32) {
                activeTargetWx = 0.0;
                activeTargetWy = isCrossingFenceNorth ? WILDERNESS_FENCE_WY + 0.22 : WILDERNESS_FENCE_WY - 0.22;
              } else {
                activeTargetWx = 0.0;
                activeTargetWy = isCrossingFenceNorth ? WILDERNESS_FENCE_WY - 0.24 : WILDERNESS_FENCE_WY + 0.24;
              }
            }

            const stepDx = activeTargetWx - player.wx;
            const stepDy = activeTargetWy - player.wy;
            const stepDist = Math.hypot(stepDx, stepDy) || dist;

            // Soft, gentle deceleration easing as avatar approaches target
            const curSpeed = player.isRunning ? 1.28 : player.speed;
            const easeSpeed = curSpeed * Math.min(1.0, 0.45 + dist * 1.5);
            const step = Math.min(stepDist, easeSpeed * delta);
            const stepX = (stepDx / stepDist) * step;
            const stepY = (stepDy / stepDist) * step;

            const nextWx = player.wx + stepX;
            const nextWy = player.wy + stepY;

            // Solid obstacle collision check with smooth fountain tangential steering & wall sliding
            if (!isSolidCollision(nextWx, nextWy, 0.16, canEnterWilderness)) {
              player.wx = nextWx;
              player.wy = nextWy;
              player.walkFrame += delta * (player.isRunning ? 5.8 : (2.8 + (easeSpeed / player.speed) * 1.5));
            } else {
            const fDist = Math.hypot(nextWx, nextWy);
            if (fDist < 1.12 && fDist > 0.001) {
              // Tangential glide around central fountain basin so walking to any fountain bench never gets stuck
              const nx = nextWx / fDist;
              const ny = nextWy / fDist;
              const t1x = -ny, t1y = nx;
              const t2x = ny, t2y = -nx;
              const dot1 = t1x * stepDx + t1y * stepDy;
              const dot2 = t2x * stepDx + t2y * stepDy;
              const tx = dot1 >= dot2 ? t1x : t2x;
              const ty = dot1 >= dot2 ? t1y : t2y;
              player.wx += tx * step;
              player.wy += ty * step;
              const newR = Math.hypot(player.wx, player.wy);
              if (newR < 1.10 && newR > 0.001) {
                player.wx = (player.wx / newR) * 1.10;
                player.wy = (player.wy / newR) * 1.10;
              }
              player.walkFrame += delta * 3.4;
            } else {
              // Wall sliding: try X movement only
              const canMoveX = !isSolidCollision(nextWx, player.wy, 0.16, canEnterWilderness);
              // Wall sliding: try Y movement only
              const canMoveY = !isSolidCollision(player.wx, nextWy, 0.16, canEnterWilderness);

              if (canMoveX) {
                player.wx = nextWx;
                player.walkFrame += delta * 3.4;
              } else if (canMoveY) {
                player.wy = nextWy;
                player.walkFrame += delta * 3.4;
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
                player.isRunning = false;
                player.speed = 0.88;
                player.walkFrame = 0;
              }
            }
          }
          }

          if (player.isMoving) {
            const faceDx = player.targetWx - player.wx;
            const faceDy = player.targetWy - player.wy;
            if (faceDx >= 0 && faceDy >= 0) player.facing = 'down-right';
            else if (faceDx < 0 && faceDy >= 0) player.facing = 'down-left';
            else if (faceDx >= 0 && faceDy < 0) player.facing = 'up-right';
            else player.facing = 'up-left';
          }
        } else {
          // Arrived at target destination! Check if avatar was walking to a seat/swing or tree apple / dry leaf
          if (pendingSeatRef.current) {
            const ps = pendingSeatRef.current;
            pendingSeatRef.current = null;
            player.wx = ps.targetX;
            player.wy = ps.targetY;
            player.targetWx = ps.targetX;
            player.targetWy = ps.targetY;
            player.isMoving = false;
            player.isRunning = false;
            player.speed = 0.88;
            player.walkFrame = 0;
            player.facing = ps.facingDir;
            setIsSitting(true);
            setSittingSeat(ps.seatId);
            ps.onArrive?.();
            sendHeartbeatRef.current?.();
          } else if (pendingEnvActionRef.current) {
            const envAct = pendingEnvActionRef.current;
            pendingEnvActionRef.current = null;
            player.isMoving = false;
            player.isRunning = false;
            player.speed = 0.88;
            player.walkFrame = 0;
            if (envAct.type === 'pick_leaf') {
              handlePickDryLeafRef.current(envAct.leafId);
            } else if (envAct.type === 'harvest_apple') {
              setNearbyAction({ type: 'tree', treeIndex: envAct.treeIndex });
            }
            sendHeartbeatRef.current?.();
          } else {
            player.isMoving = false;
            player.isRunning = false;
            player.speed = 0.88;
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

      // Building & Cafe Proximity Check (Runs whether moving or stationary so the top pop-up ALWAYS appears when near any building/cafe)
      if (!pendingSeatRef.current) {
        const isNearBeringinSpot =
          Math.hypot(player.wx - BERINGIN_TREE_COORDS.wx, player.wy - BERINGIN_TREE_COORDS.wy) < 1.75;
        const isNearRulesSpot =
          Math.hypot(player.wx - TOWN_RULES_BOARD_COORDS.wx, player.wy - TOWN_RULES_BOARD_COORDS.wy) < 1.65 ||
          Math.hypot(player.wx - 0, player.wy - 6.15) < 1.55;
        const isNearAnnBoardSpot =
          Math.hypot(player.wx - ANNOUNCEMENT_BOARD_COORDS.wx, player.wy - ANNOUNCEMENT_BOARD_COORDS.wy) < 1.55;
        const isNearWismaSpot = HOUSING_UNITS.some(
          (h) =>
            Math.hypot(player.wx - (h.wx + 0.85), player.wy - h.wy) < 1.35 ||
            Math.hypot(player.wx - h.wx, player.wy - h.wy) < 1.55
        );
        const isNearLiteracySpot =
          Math.hypot(player.wx - LITERACY_CORNER_COORDS.wx, player.wy - LITERACY_CORNER_COORDS.wy) < 1.45;

        let touchedBuilding: BuildingInfo | null = null;
        if (!isNearBeringinSpot && !isNearRulesSpot && !isNearAnnBoardSpot && !isNearWismaSpot && !isNearLiteracySpot) {
          for (const b of BUILDINGS_INFO) {
            const [bx, , by] = b.position;
            // Avoid triggering Balai Kota when walking behind it toward Pohon Beringin
            if (b.id === 'balai_kota' && player.wy < -4.65) continue;
            const bDist = Math.hypot(player.wx - bx, player.wy - by);
            const threshold = b.id === 'monumen_warga' ? 1.45 : 1.75;
            if (bDist < threshold) {
              touchedBuilding = b;
              break;
            }
          }
        }

        const cafeDist = Math.hypot(player.wx - cafeWx, player.wy - cafeWy);
        if (isNearBeringinSpot || isNearRulesSpot || isNearAnnBoardSpot || isNearWismaSpot || isNearLiteracySpot) {
          if (lastTouchedIdRef.current) {
            lastTouchedIdRef.current = null;
            setPendingConfirmation(null);
          }
        } else if (cafeDist < 1.7) {
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
            if (cafeDist > 2.05) away = true;
          } else {
            const prevB = BUILDINGS_INFO.find((b) => b.id === prevId);
            if (prevB) {
              const d = Math.hypot(player.wx - prevB.position[0], player.wy - prevB.position[2]);
              if (d > 2.15 || (prevB.id === 'balai_kota' && player.wy < -4.65)) away = true;
            }
          }
          if (away) {
            lastTouchedIdRef.current = null;
            setPendingConfirmation(null);
          }
        }
      }

      // Proximity checks: Spot Memancing Sungai Refleksia, Sudut Literasi Samping Balai Kota [2.35, -6.15], 8 Minimalist Fountain Benches (2-seater), 2 Campfire Benches, 2 Swing Structures + Literacy Bench
      const fishDist = Math.hypot(player.wx - FISHING_SPOT_COORDS.wx, player.wy - FISHING_SPOT_COORDS.wy);
      const litDist = Math.hypot(player.wx - LITERACY_CORNER_COORDS.wx, player.wy - LITERACY_CORNER_COORDS.wy);
      const litBenchDist = Math.min(
        Math.hypot(player.wx - LITERACY_BENCHES[0].wx, player.wy - LITERACY_BENCHES[0].wy),
        Math.hypot(player.wx - LITERACY_BENCHES[1].wx, player.wy - LITERACY_BENCHES[1].wy)
      );

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

      let nearLeafId = -1;
      for (const leaf of dryLeavesRef.current) {
        if (leaf.pickedAt !== null) continue;
        if (Math.hypot(player.wx - leaf.wx, player.wy - leaf.wy) < 0.85) {
          nearLeafId = leaf.id;
          break;
        }
      }

      let nearTreeIdx = -1;
      for (let tIdx = 0; tIdx < trees.length; tIdx++) {
        const [tx, ty] = trees[tIdx];
        const tDist = Math.hypot(player.wx - tx, player.wy - ty);
        if (tDist < 0.95) {
          nearTreeIdx = tIdx;
          break;
        }
      }

      let nearWismaUnit: HousingUnitDef | null = null;
      for (const h of HOUSING_UNITS) {
        const dMailbox = Math.hypot(player.wx - (h.wx + 0.85), player.wy - h.wy);
        const dHouse = Math.hypot(player.wx - h.wx, player.wy - h.wy);
        if (dMailbox < 1.35 || dHouse < 1.55) {
          nearWismaUnit = h;
          break;
        }
      }

      let detectedNearby: {
        type:
          | 'tree'
          | 'dry_leaf'
          | 'fishing'
          | 'literacy'
          | 'bench'
          | 'town_rules'
          | 'beringin'
          | 'announcement_board'
          | 'wisma_mailbox';
        treeIndex?: number;
        leafId?: number;
        benchId?: BenchId;
        benchName?: string;
        wismaId?: HousingUnitDef['id'];
        wismaName?: string;
      } | null = null;

      if (isSittingRef.current) {
        const currentSeat = sittingSeatRef.current;
        let seatName = 'Kursi Taman Kota';
        const matchedTwoPersonGroup = ALL_TWO_PERSON_BENCHES.find(
          (g) => g.groupId === currentSeat || g.seats[0].id === currentSeat || g.seats[1].id === currentSeat
        );
        const matchedSwing = REFLECTION_SWINGS.find((s) => s.id === currentSeat);
        if (matchedTwoPersonGroup) seatName = matchedTwoPersonGroup.name;
        else if (matchedSwing) seatName = matchedSwing.name;
        else if (currentSeat === 'literacy') seatName = 'Bangku Sudut Literasi';
        detectedNearby = { type: 'bench', benchId: currentSeat || undefined, benchName: seatName };
      } else if (nearLeafId !== -1) {
        detectedNearby = { type: 'dry_leaf', leafId: nearLeafId };
      } else if (Math.hypot(player.wx - ANNOUNCEMENT_BOARD_COORDS.wx, player.wy - ANNOUNCEMENT_BOARD_COORDS.wy) < 1.55) {
        detectedNearby = { type: 'announcement_board' };
      } else if (nearWismaUnit) {
        detectedNearby = {
          type: 'wisma_mailbox',
          wismaId: nearWismaUnit.id,
          wismaName: nearWismaUnit.name,
        };
      } else if (
        Math.hypot(player.wx - TOWN_RULES_BOARD_COORDS.wx, player.wy - TOWN_RULES_BOARD_COORDS.wy) < 1.65 ||
        Math.hypot(player.wx - 0, player.wy - 6.15) < 1.55
      ) {
        detectedNearby = { type: 'town_rules' };
      } else if (Math.hypot(player.wx - BERINGIN_TREE_COORDS.wx, player.wy - BERINGIN_TREE_COORDS.wy) < 1.75) {
        detectedNearby = { type: 'beringin' };
      } else if (litDist < 1.45) {
        detectedNearby = { type: 'literacy' };
      } else if (fishDist < 1.75) {
        detectedNearby = { type: 'fishing' };
      } else if (nearBench) {
        detectedNearby = { type: 'bench', benchId: nearBench.id, benchName: nearBench.name };
      } else if (nearTreeIdx !== -1) {
        detectedNearby = { type: 'tree', treeIndex: nearTreeIdx };
      }

      const detectedSig = getNearbyActionSignature(detectedNearby);
      const currentSig = getNearbyActionSignature(nearbyActionRef.current);

      if (!detectedSig) {
        dismissedNearbySignatureRef.current = null;
        if (nearbyActionRef.current) {
          setNearbyAction(null);
        }
      } else if (dismissedNearbySignatureRef.current === detectedSig) {
        // Already auto-dismissed after 10s of inactivity at this exact spot — stay hidden until player moves to another spot or clicks
      } else {
        if (dismissedNearbySignatureRef.current !== null && dismissedNearbySignatureRef.current !== detectedSig) {
          dismissedNearbySignatureRef.current = null;
        }
        if (currentSig !== detectedSig) {
          if (detectedNearby?.type === 'town_rules' || detectedNearby?.type === 'beringin') {
            sounds.playClick();
          }
          setNearbyAction(detectedNearby);
        }
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

      // Smooth atmospheric weather sky wash (fade-in / fade-out)
      if (weatherWeights['berawan'] > 0.005) {
        ctx.fillStyle = isNight
          ? `rgba(30, 41, 59, ${weatherWeights['berawan'] * 0.32})`
          : `rgba(100, 116, 139, ${weatherWeights['berawan'] * 0.22})`;
        ctx.fillRect(0, 0, width, height);
      }
      if (weatherWeights['hujan_ringan'] > 0.005) {
        ctx.fillStyle = isNight
          ? `rgba(15, 23, 42, ${weatherWeights['hujan_ringan'] * 0.38})`
          : `rgba(30, 58, 138, ${weatherWeights['hujan_ringan'] * 0.22})`;
        ctx.fillRect(0, 0, width, height);
      }
      if (weatherWeights['salju'] > 0.005) {
        ctx.fillStyle = `rgba(165, 180, 252, ${weatherWeights['salju'] * 0.16})`;
        ctx.fillRect(0, 0, width, height);
      }

      // ---------------------------------------------------------
      // 1B. OCCASIONAL AIRPLANE CONTRAIL IN SKY BACKGROUND (RANDOM TIMING)
      // ---------------------------------------------------------
      if (!skyContrail.active && elapsed >= skyContrail.nextSpawnTime) {
        const fromLeft = Math.random() > 0.42;
        const rawDirX = fromLeft ? 1 : -1;
        const rawDirY = (Math.random() - 0.5) * 0.22 - 0.04; // slight high-altitude angle
        const mag = Math.hypot(rawDirX, rawDirY) || 1;
        skyContrail.active = true;
        skyContrail.dirX = rawDirX / mag;
        skyContrail.dirY = rawDirY / mag;
        skyContrail.startX = fromLeft ? -40 : width + 40;
        skyContrail.startY = 26 + Math.random() * Math.max(45, height * 0.22);
        skyContrail.speed = 32 + Math.random() * 16;
        skyContrail.startTime = elapsed;
        const diagDist = width + 140;
        skyContrail.flightDuration = diagDist / skyContrail.speed;
        skyContrail.fadeDuration = 12 + Math.random() * 6;
      }

      if (skyContrail.active) {
        const flightElapsed = elapsed - skyContrail.startTime;
        const totalDuration = skyContrail.flightDuration + skyContrail.fadeDuration;
        if (flightElapsed >= totalDuration) {
          skyContrail.active = false;
          // Schedule next random airplane contrail between 18 and 45 seconds later
          skyContrail.nextSpawnTime = elapsed + 18 + Math.random() * 27;
        } else {
          ctx.save();
          const planeTravelTime = Math.min(flightElapsed, skyContrail.flightDuration);
          const headX = skyContrail.startX + skyContrail.dirX * skyContrail.speed * planeTravelTime;
          const headY = skyContrail.startY + skyContrail.dirY * skyContrail.speed * planeTravelTime;

          // Tail of contrail slowly catches up / dissipates from the origin
          const maxTrailLen = 240;
          const currentDist = skyContrail.speed * planeTravelTime;
          const fadeOutRatio =
            flightElapsed > skyContrail.flightDuration
              ? Math.max(0, 1 - (flightElapsed - skyContrail.flightDuration) / skyContrail.fadeDuration)
              : 1.0;
          const trailLen = Math.min(currentDist, maxTrailLen) * (0.55 + 0.45 * fadeOutRatio);
          const tailX = headX - skyContrail.dirX * trailLen;
          const tailY = headY - skyContrail.dirY * trailLen;

          const contrailBaseAlpha = (isNight ? 0.36 : currentPeriod === 'sore' ? 0.58 : 0.65) * fadeOutRatio;
          if (contrailBaseAlpha > 0.01 && trailLen > 2) {
            const perpX = -skyContrail.dirY;
            const perpY = skyContrail.dirX;

            // Soft diffused outer contrail plume
            const outerGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            outerGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            outerGrad.addColorStop(
              0.45,
              currentPeriod === 'sore'
                ? `rgba(254, 215, 170, ${contrailBaseAlpha * 0.45})`
                : `rgba(241, 245, 249, ${contrailBaseAlpha * 0.45})`
            );
            outerGrad.addColorStop(
              1,
              currentPeriod === 'sore'
                ? `rgba(255, 237, 213, ${contrailBaseAlpha * 0.75})`
                : `rgba(255, 255, 255, ${contrailBaseAlpha * 0.75})`
            );

            ctx.strokeStyle = outerGrad;
            ctx.lineWidth = 4.2 + (1 - fadeOutRatio) * 3.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tailX, tailY);
            ctx.lineTo(headX, headY);
            ctx.stroke();

            // Twin crisp jet engine condensation cores right behind the aircraft
            const coreGrad = ctx.createLinearGradient(tailX, tailY, headX, headY);
            coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
            coreGrad.addColorStop(0.3, `rgba(255, 255, 255, ${contrailBaseAlpha * 0.5})`);
            coreGrad.addColorStop(1, `rgba(255, 255, 255, ${Math.min(0.95, contrailBaseAlpha * 1.25)})`);
            ctx.strokeStyle = coreGrad;
            ctx.lineWidth = 1.15;
            [-1.3, 1.3].forEach((offset) => {
              ctx.beginPath();
              ctx.moveTo(tailX + perpX * offset * 1.6, tailY + perpY * offset * 1.6);
              ctx.lineTo(headX + perpX * offset * 0.8, headY + perpY * offset * 0.8);
              ctx.stroke();
            });
          }

          // High-altitude miniature sleek jet silhouette while still in flight across the sky
          if (flightElapsed <= skyContrail.flightDuration) {
            const angle = Math.atan2(skyContrail.dirY, skyContrail.dirX);
            ctx.translate(headX, headY);
            ctx.rotate(angle);

            ctx.fillStyle = isNight ? '#e2e8f0' : '#ffffff';
            // Fuselage
            ctx.beginPath();
            ctx.ellipse(2.5, 0, 5.2, 1.1, 0, 0, Math.PI * 2);
            ctx.fill();
            // Swept main wings
            ctx.beginPath();
            ctx.moveTo(2.0, 0);
            ctx.lineTo(-1.8, -5.2);
            ctx.lineTo(-3.0, -5.2);
            ctx.lineTo(-0.5, 0);
            ctx.lineTo(-3.0, 5.2);
            ctx.lineTo(-1.8, 5.2);
            ctx.closePath();
            ctx.fill();
            // Tail stabilizer
            ctx.beginPath();
            ctx.moveTo(-2.2, 0);
            ctx.lineTo(-4.2, -2.3);
            ctx.lineTo(-4.8, -2.3);
            ctx.lineTo(-3.4, 0);
            ctx.lineTo(-4.8, 2.3);
            ctx.lineTo(-4.2, 2.3);
            ctx.closePath();
            ctx.fill();

            // Tiny blinking aviation strobe at night/subuh
            if (isNight && Math.floor(elapsed * 4) % 2 === 0) {
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.arc(0, 0, 1.3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }

      // ---------------------------------------------------------
      // 2. ISOMETRIC PLATFORM (+6 NORTHERN EXPANSION), POLYGONAL TAPERING BROWN CLIFF,
      //    GUNUNG TINGGI BERPEPOHONAN, HUTAN BELANTARA, DANAU PUSAT & LONG FLOWING RIVER
      // ---------------------------------------------------------
      const GRID_RADIUS = 8; // -8 to +8 base tiles, expanded +6 northward to -14
      const northGridMin = -GRID_RADIUS - NORTH_EXPANSION_TILES; // -14
      const edgeLim = GRID_RADIUS + 0.5; // 8.5
      const northEdgeLim = northGridMin - 0.5; // -14.5
      const rightEdgeSpan = edgeLim - northEdgeLim; // 23.0 tiles along eastern cliff

      // ---------------------------------------------------------
      // 2A. BONGKAHAN BATU TEBING POLIGONAL BERSUDUT MERUNCING KE BAWAH
      //     (Tekstur Tanah & Batuan Geometris Warna Cokelat di Bawah Peta
      //      + Animasi Melayang Halus / Floating Mengikuti Tema Awan)
      // ---------------------------------------------------------
      ctx.save();
      const zCliff = zoomLevelRef.current;

      // Slow, gentle floating/breathing wave for the lower cliff mass (sky-island levitation effect)
      const cliffFloatBase = Math.sin(elapsed * 1.25) * 4.8;
      const cliffSwayX = Math.cos(elapsed * 0.95) * 0.08;
      const cliffSwayY = Math.sin(elapsed * 0.95) * 0.08;

      // Helper to project 3D cliff vertices (wx, wy, negative altitude)
      const cPt = (wx: number, wy: number, alt: number) => toScreen(wx, wy, alt, camera.x, camera.y);

      const fillCliffPoly = (
        pts: Array<{ x: number; y: number }>,
        fill: string,
        stroke?: string,
        lw = 1
      ) => {
        if (pts.length < 3) return;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw * zCliff;
          ctx.stroke();
        }
      };

      // 8-segment division along Left-Front Edge (wx: -8.5 -> +8.5 at wy = +8.5)
      // and 8-segment division along Right-Front Edge (wy: +8.5 -> -14.5 at wx = +8.5)
      const leftSoilAlt = [-14, -20, -17, -24, -19, -26, -22, -28, -26];
      const leftMidAlt = [-48, -74, -62, -98, -86, -124, -112, -148, -142];
      const leftMidIn = [0.25, 0.55, 0.35, 0.85, 0.65, 1.15, 0.95, 1.35, 1.25];
      const leftPeakAlt = [-82, -128, -105, -168, -144, -202, -178, -226, -252];

      const rightSoilAlt = [-26, -24, -27, -21, -25, -19, -22, -17, -14];
      const rightMidAlt = [-142, -136, -118, -128, -96, -104, -74, -64, -46];
      const rightMidIn = [1.25, 1.30, 0.95, 1.10, 0.72, 0.85, 0.52, 0.42, 0.25];
      const rightPeakAlt = [-252, -218, -184, -198, -152, -162, -116, -96, -78];

      // Sunlit warm brown & bronze-sienna palette (Left-Front) & Shaded deep umber-cocoa palette (Right-Front)
      const soilColorsLeft = isNight
        ? ['#451a03', '#52250a', '#3e1a06', '#451a03']
        : ['#92400e', '#854d0e', '#78350f', '#9a3412'];
      const soilColorsRight = isNight
        ? ['#2d1204', '#3b1506', '#270f03', '#331405']
        : ['#65320d', '#52250a', '#5c280b', '#451a03'];

      const rockColorsLeftUpper = isNight
        ? ['#52250a', '#451a03', '#5c280b', '#3e1a06', '#4a1d05']
        : ['#b45309', '#9a3412', '#a16207', '#854d0e', '#92400e'];
      const rockColorsLeftLower = isNight
        ? ['#3b1506', '#2d1204', '#451a03', '#230d03']
        : ['#78350f', '#65320d', '#713f12', '#52250a'];

      const rockColorsRightUpper = isNight
        ? ['#3b1506', '#2d1204', '#331405', '#230d03', '#2a1004']
        : ['#78350f', '#65320d', '#5c280b', '#713f12', '#52250a'];
      const rockColorsRightLower = isNight
        ? ['#230d03', '#1a0902', '#2a1004', '#140701']
        : ['#451a03', '#3b1506', '#52250a', '#2d1204'];

      const facetStrokeLeft = isNight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(69, 26, 3, 0.45)';
      const facetStrokeRight = isNight ? 'rgba(9, 13, 22, 0.65)' : 'rgba(45, 18, 4, 0.55)';

      const deepApexAlt = -268 + cliffFloatBase * 1.35;
      const deepCenterApex = cPt(edgeLim - 1.2 + cliffSwayX, edgeLim - 1.2 + cliffSwayY, deepApexAlt);

      // 1) Draw Left-Front Polygonal Cliff Face (wx from -8.5 to +8.5 at wy = +8.5)
      for (let i = 0; i < 8; i++) {
        const wx0 = -edgeLim + i * (17 / 8);
        const wx1 = -edgeLim + (i + 1) * (17 / 8);
        const wxMid = (wx0 + wx1) * 0.5;

        const segWave0 = Math.sin(elapsed * 1.45 + i * 0.6) * 2.6;
        const segWave1 = Math.sin(elapsed * 1.45 + (i + 1) * 0.6) * 2.6;
        const peakWave = cliffFloatBase + Math.sin(elapsed * 1.65 + i * 0.85) * 4.2;

        const top0 = cPt(wx0, edgeLim, 0);
        const top1 = cPt(wx1, edgeLim, 0);
        const soil0 = cPt(wx0, edgeLim, leftSoilAlt[i] + segWave0 * 0.25);
        const soil1 = cPt(wx1, edgeLim, leftSoilAlt[i + 1] + segWave1 * 0.25);

        const mid0 = cPt(
          wx0 + leftMidIn[i] * 0.35 + cliffSwayX * 0.4,
          edgeLim - leftMidIn[i] * 0.45 + cliffSwayY * 0.4,
          leftMidAlt[i] + cliffFloatBase * 0.65 + segWave0
        );
        const mid1 = cPt(
          wx1 + leftMidIn[i + 1] * 0.35 + cliffSwayX * 0.4,
          edgeLim - leftMidIn[i + 1] * 0.45 + cliffSwayY * 0.4,
          leftMidAlt[i + 1] + cliffFloatBase * 0.65 + segWave1
        );

        const spikeTip = cPt(
          wxMid + (leftMidIn[i] + leftMidIn[i + 1]) * 0.38 + cliffSwayX * 0.75,
          edgeLim - (leftMidIn[i] + leftMidIn[i + 1]) * 0.55 + cliffSwayY * 0.75,
          leftPeakAlt[i + 1] + peakWave
        );

        // Deep inner core triangle connecting to central bottom spire (ensures continuous tapering mass)
        fillCliffPoly(
          [mid0, mid1, deepCenterApex],
          rockColorsLeftLower[(i + 1) % rockColorsLeftLower.length],
          facetStrokeLeft,
          0.8
        );

        // Lower tapering jagged spike triangles (Meruncing ke bawah)
        fillCliffPoly(
          [mid0, mid1, spikeTip],
          rockColorsLeftLower[i % rockColorsLeftLower.length],
          facetStrokeLeft,
          0.95
        );
        fillCliffPoly(
          [mid1, deepCenterApex, spikeTip],
          rockColorsLeftLower[(i + 2) % rockColorsLeftLower.length],
          facetStrokeLeft,
          0.85
        );

        // Upper geometric rock facets (split quad into 2 crisp low-poly triangles)
        fillCliffPoly(
          [soil0, soil1, mid0],
          rockColorsLeftUpper[i % rockColorsLeftUpper.length],
          facetStrokeLeft,
          0.95
        );
        fillCliffPoly(
          [soil1, mid1, mid0],
          rockColorsLeftUpper[(i + 2) % rockColorsLeftUpper.length],
          facetStrokeLeft,
          0.95
        );

        // Top earthen soil crust (Tekstur Tanah Cokelat)
        fillCliffPoly(
          [top0, top1, soil1, soil0],
          soilColorsLeft[i % soilColorsLeft.length],
          facetStrokeLeft,
          0.85
        );

        // Geometric soil strata & pebble details on earthen crust
        ctx.fillStyle = isNight ? '#78350f' : '#b45309';
        ctx.beginPath();
        ctx.arc(
          (top0.x + soil1.x) * 0.5,
          (top0.y + soil1.y) * 0.5,
          1.8 * zCliff,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // 2) Draw Right-Front Polygonal Cliff Face (wy from +8.5 to -14.5 at wx = +8.5)
      for (let i = 0; i < 8; i++) {
        const wy0 = edgeLim - i * (rightEdgeSpan / 8);
        const wy1 = edgeLim - (i + 1) * (rightEdgeSpan / 8);
        const wyMid = (wy0 + wy1) * 0.5;

        const segWave0 = Math.cos(elapsed * 1.45 + i * 0.6) * 2.6;
        const segWave1 = Math.cos(elapsed * 1.45 + (i + 1) * 0.6) * 2.6;
        const peakWave = cliffFloatBase + Math.cos(elapsed * 1.65 + i * 0.85) * 4.2;

        const top0 = cPt(edgeLim, wy0, 0);
        const top1 = cPt(edgeLim, wy1, 0);
        const soil0 = cPt(edgeLim, wy0, rightSoilAlt[i] + segWave0 * 0.25);
        const soil1 = cPt(edgeLim, wy1, rightSoilAlt[i + 1] + segWave1 * 0.25);

        const mid0 = cPt(
          edgeLim - rightMidIn[i] * 0.45 + cliffSwayX * 0.4,
          wy0 - rightMidIn[i] * 0.35 + cliffSwayY * 0.4,
          rightMidAlt[i] + cliffFloatBase * 0.65 + segWave0
        );
        const mid1 = cPt(
          edgeLim - rightMidIn[i + 1] * 0.45 + cliffSwayX * 0.4,
          wy1 - rightMidIn[i + 1] * 0.35 + cliffSwayY * 0.4,
          rightMidAlt[i + 1] + cliffFloatBase * 0.65 + segWave1
        );

        const spikeTip = cPt(
          edgeLim - (rightMidIn[i] + rightMidIn[i + 1]) * 0.55 + cliffSwayX * 0.75,
          wyMid - (rightMidIn[i] + rightMidIn[i + 1]) * 0.38 + cliffSwayY * 0.75,
          rightPeakAlt[i] + peakWave
        );

        // Deep inner core triangle connecting to central bottom spire
        fillCliffPoly(
          [mid0, mid1, deepCenterApex],
          rockColorsRightLower[(i + 1) % rockColorsRightLower.length],
          facetStrokeRight,
          0.8
        );

        // Lower tapering jagged spike triangles (Meruncing ke bawah)
        fillCliffPoly(
          [mid0, mid1, spikeTip],
          rockColorsRightLower[i % rockColorsRightLower.length],
          facetStrokeRight,
          0.95
        );
        fillCliffPoly(
          [mid0, spikeTip, deepCenterApex],
          rockColorsRightLower[(i + 2) % rockColorsRightLower.length],
          facetStrokeRight,
          0.85
        );

        // Upper geometric rock facets (split quad into 2 crisp low-poly triangles)
        fillCliffPoly(
          [soil0, soil1, mid1],
          rockColorsRightUpper[i % rockColorsRightUpper.length],
          facetStrokeRight,
          0.95
        );
        fillCliffPoly(
          [soil0, mid1, mid0],
          rockColorsRightUpper[(i + 2) % rockColorsRightUpper.length],
          facetStrokeRight,
          0.95
        );

        // Top earthen soil crust (Tekstur Tanah Cokelat)
        fillCliffPoly(
          [top0, top1, soil1, soil0],
          soilColorsRight[i % soilColorsRight.length],
          facetStrokeRight,
          0.85
        );
      }

      // 3) Central Front Spire Ridge Highlight (Sharp Polygonal Central Keel under cornerS)
      const cTopS = cPt(edgeLim, edgeLim, 0);
      const cSoilS = cPt(edgeLim, edgeLim, -26 + cliffFloatBase * 0.2);
      const cMidS = cPt(
        edgeLim - 0.65 + cliffSwayX * 0.5,
        edgeLim - 0.65 + cliffSwayY * 0.5,
        -145 + cliffFloatBase * 0.75
      );
      const cMidL = cPt(
        edgeLim - 1.65 + cliffSwayX * 0.5,
        edgeLim + cliffSwayY * 0.5,
        -135 + cliffFloatBase * 0.7
      );
      const cMidR = cPt(
        edgeLim + cliffSwayX * 0.5,
        edgeLim - 1.65 + cliffSwayY * 0.5,
        -135 + cliffFloatBase * 0.7
      );
      const cApexS = deepCenterApex;

      fillCliffPoly(
        [cSoilS, cMidL, cMidS],
        isNight ? '#5c280b' : '#b45309',
        facetStrokeLeft,
        1.1
      );
      fillCliffPoly(
        [cSoilS, cMidS, cMidR],
        isNight ? '#3b1506' : '#65320d',
        facetStrokeRight,
        1.1
      );
      fillCliffPoly(
        [cMidL, cApexS, cMidS],
        isNight ? '#451a03' : '#92400e',
        facetStrokeLeft,
        1.1
      );
      fillCliffPoly(
        [cMidS, cApexS, cMidR],
        isNight ? '#270f03' : '#451a03',
        facetStrokeRight,
        1.1
      );
      // Crisp vertical ridge line on the front-most central spire
      ctx.strokeStyle = isNight ? 'rgba(251, 191, 36, 0.22)' : 'rgba(254, 243, 199, 0.45)';
      ctx.lineWidth = 1.2 * zCliff;
      ctx.beginPath();
      ctx.moveTo(cTopS.x, cTopS.y);
      ctx.lineTo(cSoilS.x, cSoilS.y);
      ctx.lineTo(cMidS.x, cMidS.y);
      ctx.lineTo(cApexS.x, cApexS.y);
      ctx.stroke();

      // 4) Floating Detached Polygonal Cliff Shards (Bongkahan Batu Kecil Melayang di Sekitar Tebing Bawah)
      const floatingShards = [
        { wx: -5.4, wy: 8.8, baseAlt: -125, sz: 0.42, spd: 1.7, ph: 0.0 },
        { wx: -1.6, wy: 8.9, baseAlt: -175, sz: 0.52, spd: 1.4, ph: 1.3 },
        { wx: 3.2, wy: 8.8, baseAlt: -215, sz: 0.48, spd: 1.9, ph: 2.5 },
        { wx: 7.4, wy: 8.4, baseAlt: -260, sz: 0.58, spd: 1.3, ph: 3.7 },
        { wx: 8.8, wy: 4.2, baseAlt: -205, sz: 0.46, spd: 1.6, ph: 0.8 },
        { wx: 8.9, wy: -1.8, baseAlt: -165, sz: 0.50, spd: 1.5, ph: 2.1 },
        { wx: 8.8, wy: -8.6, baseAlt: -118, sz: 0.38, spd: 1.8, ph: 4.2 },
      ];
      for (const sh of floatingShards) {
        const bobAlt = sh.baseAlt + Math.sin(elapsed * sh.spd + sh.ph) * 9.5;
        const sTop = cPt(sh.wx, sh.wy, bobAlt + 12 * sh.sz);
        const sL = cPt(sh.wx - sh.sz, sh.wy + sh.sz * 0.4, bobAlt);
        const sM = cPt(sh.wx + sh.sz * 0.2, sh.wy + sh.sz * 0.2, bobAlt - 5 * sh.sz);
        const sR = cPt(sh.wx + sh.sz * 0.4, sh.wy - sh.sz, bobAlt);
        const sBot = cPt(sh.wx, sh.wy, bobAlt - 26 * sh.sz);

        fillCliffPoly(
          [sTop, sL, sM],
          isNight ? '#5c280b' : '#b45309',
          facetStrokeLeft,
          0.75
        );
        fillCliffPoly(
          [sTop, sM, sR],
          isNight ? '#3b1506' : '#78350f',
          facetStrokeRight,
          0.75
        );
        fillCliffPoly(
          [sL, sBot, sM],
          isNight ? '#451a03' : '#92400e',
          facetStrokeLeft,
          0.75
        );
        fillCliffPoly(
          [sM, sBot, sR],
          isNight ? '#270f03' : '#451a03',
          facetStrokeRight,
          0.75
        );
      }
      ctx.restore();

      // ---------------------------------------------------------
      // 2B. ISOMETRIC BASE TILES & PATHWAYS (17x23 Expanded Grid: gy -14..+8)
      // ---------------------------------------------------------
      // Satu-satunya jalan setapak di hutan adalah jalan alami berumput menuju dermaga pemancingan
      const isFishingTrail = (gx: number, gy: number) => {
        // Alur jalan setapak dari gerbang hutan [0, -7] menuju dermaga pemancingan danau [2, -10]
        if (gx === 0 && gy === -7) return true;
        if (gx === 1 && (gy === -8 || gy === -9)) return true;
        if (gx === 2 && (gy === -9 || gy === -10)) return true;
        return false;
      };

      const isPathway = (gx: number, gy: number) => {
        // Di area Hutan Belantara (gy <= -7), HANYA jalan menuju tempat pemancingan yang ada
        if (gy <= -7) {
          return isFishingTrail(gx, gy);
        }

        // Inner loop road at |gx| == 3 or |gy| == 3
        if (Math.abs(gx) === 3 && Math.abs(gy) <= 5) return true;
        if (Math.abs(gy) === 3 && Math.abs(gx) <= 5) return true;
        // Outer promenade loop road at |gx| == 5 or |gy| == 5
        if (Math.abs(gx) === 5 && Math.abs(gy) <= 5) return true;
        if (Math.abs(gy) === 5 && Math.abs(gx) <= 5) return true;
        // Connecting central avenue in town up to the forest gate (gy = -6..+8)
        if (gx === 0 && gy >= -6 && gy <= 8) return true;
        if (Math.abs(gx) <= 1 && gy === 6) return true;
        if (gy === 0 && gx >= -7 && gx <= 8) return true;
        // Residential Boulevard in front of Perumahan Guru & Wisma X/XI/XII DKV behind Perpustakaan Kampus
        if (gx === -6 && gy >= -4 && gy <= 5) return true;
        // Central ring
        if (Math.abs(gx) <= 1 && Math.abs(gy) <= 1) return true;
        // Walkway spur to Masjid Al-Hikmah Courtyard at [5.45, -4.85]
        if ((gx === 5 || gx === 6) && gy >= -6 && gy <= -3) return true;
        // Walkway spur to Gedung Bank Materi Guru Courtyard at [-5.35, -4.85]
        if ((gx === -5 || gx === -6) && gy >= -6 && gy <= -2) return true;
        // Garden paths to Tempat Ayunan 1 [-3..-2, -4] and Tempat Ayunan 2 [2..3, -4]
        if ((gx === -3 || gx === -2) && gy === -4) return true;
        if ((gx === 2 || gx === 3) && gy === -4) return true;
        // Paved corner patio for relocated Toko Roti & Kafe behind Lab DKV at [4..5, 4..5]
        if ((gx === 4 || gx === 5) && (gy === 4 || gy === 5)) return true;
        return false;
      };

      // Helper to check if a tile is directly covered by a solid building footprint
      const isTileUnderBuilding = (gx: number, gy: number) => {
        for (const obs of SOLID_BUILDING_OBSTACLES) {
          if (gx >= obs.minWx + 0.3 && gx <= obs.maxWx - 0.3 && gy >= obs.minWy + 0.3 && gy <= obs.maxWy - 0.3) {
            return true;
          }
        }
        for (const h of HOUSING_UNITS) {
          if (Math.abs(gx - h.wx) < 0.55 && Math.abs(gy - h.wy) < 0.55) {
            return true;
          }
        }
        return false;
      };

      const zTile = zoomLevelRef.current;
      const flowerPalette = [
        { petal: '#f472b6', center: '#fef08a' }, // Sakura Pink
        { petal: '#facc15', center: '#92400e' }, // Sunny Marigold
        { petal: '#38bdf8', center: '#fef9c3' }, // Sky Forget-Me-Not
        { petal: '#fb7185', center: '#fef08a' }, // Coral Rose
        { petal: '#c084fc', center: '#fef08a' }, // Lavender Blossom
        { petal: '#ffffff', center: '#facc15' }, // White Daisy
      ];

      // Fast RGB Hex Color Interpolation Helper for seamless City -> Hutan grass & road gradient
      const blendHexColor = (hexA: string, hexB: string, t: number): string => {
        const clampT = Math.max(0, Math.min(1, t));
        if (clampT <= 0.001) return hexA;
        if (clampT >= 0.999) return hexB;
        const a = parseInt(hexA.slice(1), 16);
        const b = parseInt(hexB.slice(1), 16);
        const rA = (a >> 16) & 255, gA = (a >> 8) & 255, bA = a & 255;
        const rB = (b >> 16) & 255, gB = (b >> 8) & 255, bB = b & 255;
        const r = Math.round(rA + (rB - rA) * clampT);
        const g = Math.round(gA + (gB - gA) * clampT);
        const bl = Math.round(bA + (bB - bA) * clampT);
        return `rgb(${r}, ${g}, ${bl})`;
      };

      // Draw a neat, symmetrical botanical blossom with tidy basal leaves
      const drawTidyFlower = (wx: number, wy: number, colorIdx: number, scale: number = 1) => {
        const fPt = toScreen(wx, wy, 0, camera.x, camera.y);
        const r = 1.15 * zTile * scale;
        const pal = flowerPalette[Math.abs(colorIdx) % flowerPalette.length];

        // Neat paired emerald basal leaves
        ctx.fillStyle = isNight ? '#065f46' : '#15803d';
        ctx.beginPath();
        ctx.ellipse(fPt.x - 1.5 * zTile * scale, fPt.y + 0.5 * zTile * scale, 1.45 * zTile * scale, 0.7 * zTile * scale, -0.35, 0, Math.PI * 2);
        ctx.ellipse(fPt.x + 1.5 * zTile * scale, fPt.y + 0.5 * zTile * scale, 1.45 * zTile * scale, 0.7 * zTile * scale, 0.35, 0, Math.PI * 2);
        ctx.fill();

        // 4-petal symmetrical flower head
        ctx.fillStyle = pal.petal;
        const pOff = 1.05 * zTile * scale;
        ctx.beginPath();
        ctx.arc(fPt.x - pOff, fPt.y, r, 0, Math.PI * 2);
        ctx.arc(fPt.x + pOff, fPt.y, r, 0, Math.PI * 2);
        ctx.arc(fPt.x, fPt.y - pOff * 0.85, r, 0, Math.PI * 2);
        ctx.arc(fPt.x, fPt.y + pOff * 0.85, r, 0, Math.PI * 2);
        ctx.fill();

        // Crisp center pistil dot
        ctx.fillStyle = pal.center;
        ctx.beginPath();
        ctx.arc(fPt.x, fPt.y, 0.85 * zTile * scale, 0, Math.PI * 2);
        ctx.fill();
      };

      // Draw a neat, symmetrical 3-blade grass tuft with gentle breeze sway
      const drawTidyGrassTuft = (wx: number, wy: number, swayOffset: number) => {
        const gPt = toScreen(wx, wy, 0, camera.x, camera.y);
        ctx.strokeStyle = isNight ? 'rgba(52, 211, 153, 0.38)' : 'rgba(187, 247, 208, 0.65)';
        ctx.lineWidth = 0.85 * zTile;
        ctx.lineCap = 'round';
        ctx.beginPath();
        // Left blade
        ctx.moveTo(gPt.x - 0.8 * zTile, gPt.y);
        ctx.lineTo(gPt.x - 2.1 * zTile + swayOffset, gPt.y - 2.6 * zTile);
        // Center blade
        ctx.moveTo(gPt.x, gPt.y);
        ctx.lineTo(gPt.x + swayOffset * 1.1, gPt.y - 3.3 * zTile);
        // Right blade
        ctx.moveTo(gPt.x + 0.8 * zTile, gPt.y);
        ctx.lineTo(gPt.x + 2.1 * zTile + swayOffset, gPt.y - 2.6 * zTile);
        ctx.stroke();
      };

      // Draw organic lush multi-tiered forest shrubs / semak-semak lebat
      const drawForestBush = (wx: number, wy: number, scale: number = 1.0, seed: number = 0) => {
        const bPt = toScreen(wx, wy, 0, camera.x, camera.y);
        const z = zTile * scale;
        const sway = Math.sin(elapsed * 1.8 + wx * 1.2 + wy * 0.9) * 0.35 * z;

        ctx.save();
        ctx.translate(bPt.x + sway, bPt.y);

        // Soft ground shadow under the bush
        ctx.fillStyle = isNight ? 'rgba(0, 0, 0, 0.28)' : 'rgba(20, 83, 45, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 0.8 * z, 5.2 * z, 2.4 * z, 0, 0, Math.PI * 2);
        ctx.fill();

        // 1. Deep under-leaf foliage layer
        ctx.fillStyle = isNight ? '#064e3b' : '#14532d';
        ctx.beginPath();
        ctx.arc(-2.4 * z, -1.8 * z, 2.8 * z, 0, Math.PI * 2);
        ctx.arc(2.2 * z, -1.8 * z, 2.7 * z, 0, Math.PI * 2);
        ctx.arc(0, -3.2 * z, 3.2 * z, 0, Math.PI * 2);
        ctx.fill();

        // 2. Middle lush foliage cluster
        ctx.fillStyle = isNight ? '#047857' : '#16a34a';
        ctx.beginPath();
        ctx.arc(-1.6 * z, -2.6 * z, 2.5 * z, 0, Math.PI * 2);
        ctx.arc(1.6 * z, -2.5 * z, 2.4 * z, 0, Math.PI * 2);
        ctx.arc(0, -4.2 * z, 2.8 * z, 0, Math.PI * 2);
        ctx.fill();

        // 3. Top sunlit leaf crests & highlights
        ctx.fillStyle = isNight ? '#10b981' : '#4ade80';
        ctx.beginPath();
        ctx.arc(-0.8 * z, -4.5 * z, 1.4 * z, 0, Math.PI * 2);
        ctx.arc(1.0 * z, -4.2 * z, 1.3 * z, 0, Math.PI * 2);
        ctx.fill();

        // Optional tiny woodland berries / wild flower dots
        if (seed % 3 === 0) {
          ctx.fillStyle = seed % 2 === 0 ? '#fde047' : '#f43f5e';
          ctx.beginPath();
          ctx.arc(-1.2 * z, -3.5 * z, 0.65 * z, 0, Math.PI * 2);
          ctx.arc(1.5 * z, -3.2 * z, 0.65 * z, 0, Math.PI * 2);
          ctx.arc(0.2 * z, -4.8 * z, 0.7 * z, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      };

      // Deep Wilderness Forest turf target colors - SEMUA HIJAU & ASRI (TIDAK ADA HITAM)
      const wildernessGrassColor = isNight ? '#0d5336' : '#15803d';
      const wildernessGrassAltColor = isNight ? '#0f603e' : '#16a34a';
      const wildernessGrassBorder = isNight ? '#083c27' : '#166534';
      const wildernessPathColor = isNight ? '#0e4a2d' : '#4d7c43';
      const wildernessPathBorder = isNight ? '#093a22' : '#3d6735';

      // Draw all isometric base tiles across expanded map (gy: -14..+8, gx: -8..+8)
      // with a smooth multi-row gradient between City Grass (gy >= -4) and Wilderness Forest (gy <= -11)
      for (let gy = northGridMin; gy <= GRID_RADIUS; gy++) {
        // Smooth S-curve transition factor from 0.0 (City at gy >= -4) to 1.0 (Deep Forest at gy <= -11)
        const rawT = Math.max(0, Math.min(1, (-4.2 - gy) / 6.8));
        const baseForestBlend = rawT * rawT * (3 - 2 * rawT);

        for (let gx = -GRID_RADIUS; gx <= GRID_RADIUS; gx++) {
          const pN = toScreen(gx - 0.5, gy - 0.5, 0, camera.x, camera.y);
          const pE = toScreen(gx + 0.5, gy - 0.5, 0, camera.x, camera.y);
          const pS = toScreen(gx + 0.5, gy + 0.5, 0, camera.x, camera.y);
          const pW = toScreen(gx - 0.5, gy + 0.5, 0, camera.x, camera.y);

          const isRiverZone = (gx === 7 || gx === 8) && gy >= -11;
          const isLakeTile = gx >= 2 && gx <= 7 && gy >= -12 && gy <= -9;
          const isUnderMountain = gy <= -12;
          const isRoad = isPathway(gx, gy);
          const isFishingPathTile = isFishingTrail(gx, gy);
          const isCityRoad = isRoad && !isFishingPathTile;

          // Organic per-tile micro-dither so the transition feels natural & hand-crafted
          const checkerShift = (gx + gy) % 2 === 0 ? -0.04 : 0.05;
          const tileBlend = Math.max(0, Math.min(1, baseForestBlend + (baseForestBlend > 0.02 && baseForestBlend < 0.98 ? checkerShift : 0)));

          if (isRiverZone || isLakeTile) {
            ctx.fillStyle = blendHexColor(isNight ? '#1e293b' : '#cbd5e1', isNight ? '#0f172a' : '#64748b', tileBlend);
            ctx.strokeStyle = blendHexColor(isNight ? '#334155' : '#94a3b8', isNight ? '#1e293b' : '#475569', tileBlend);
          } else if (isCityRoad) {
            ctx.fillStyle = blendHexColor(pathColor, '#e2e8f0', tileBlend * 0.5);
            ctx.strokeStyle = blendHexColor(pathBorder, '#cbd5e1', tileBlend * 0.5);
          } else if (isFishingPathTile) {
            // Jalan setapak menuju tempat memancing - warna alami tanah berumput (hijau bumi, TIDAK HITAM)
            ctx.fillStyle = isNight ? '#0e4a2d' : '#4d7c43';
            ctx.strokeStyle = isNight ? '#093a22' : '#3d6735';
          } else {
            // SEMUA TANAH DI HUTAN HIJAU SEGAR (emerald & lush forest green, TIDAK ADA HITAM)
            const targetForestGrass = (gx + gy) % 2 === 0 ? wildernessGrassColor : wildernessGrassAltColor;
            const finalGrassColor = blendHexColor(grassColor, targetForestGrass, tileBlend);
            const finalGrassBorder = blendHexColor(grassBorder, wildernessGrassBorder, tileBlend);

            ctx.fillStyle = finalGrassColor;
            ctx.strokeStyle = finalGrassBorder;
          }
          ctx.lineWidth = 1;

          ctx.beginPath();
          ctx.moveTo(pN.x, pN.y);
          ctx.lineTo(pE.x, pE.y);
          ctx.lineTo(pS.x, pS.y);
          ctx.lineTo(pW.x, pW.y);
          ctx.closePath();
          ctx.fill();
          // Hide grid border lines under the mountains (gy <= -12) and inside the lake/river basin
          if (!isUnderMountain && !isLakeTile) {
            ctx.stroke();
          }

          if (isRiverZone || isLakeTile || isCityRoad) {
            continue;
          }

          // Smoothly graduated lawn sheen (stronger in manicured city, softer in transitional woodland)
          if ((gx + gy) % 2 === 0 && tileBlend < 0.85) {
            const sheenAlpha = (isNight ? 0.045 : 0.065) * (1 - tileBlend * 0.75);
            ctx.fillStyle = isNight
              ? `rgba(52, 211, 153, ${sheenAlpha.toFixed(3)})`
              : `rgba(255, 255, 255, ${sheenAlpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(pN.x, pN.y);
            ctx.lineTo(pE.x, pE.y);
            ctx.lineTo(pS.x, pS.y);
            ctx.lineTo(pW.x, pW.y);
            ctx.closePath();
            ctx.fill();
          }

          // HANYA JALAN MENUJU TEMPAT MEMANCING ITU PUN BANYAK RUMPUT
          if (isFishingPathTile) {
            const breeze = Math.sin(elapsed * 2.0 + gx * 0.7 + gy * 0.6) * 0.6 * zTile;
            drawTidyGrassTuft(gx - 0.28, gy - 0.22, breeze);
            drawTidyGrassTuft(gx + 0.25, gy + 0.20, breeze);
            drawTidyGrassTuft(gx - 0.08, gy + 0.24, breeze);
            drawTidyGrassTuft(gx + 0.10, gy - 0.22, breeze);
            drawTidyFlower(gx - 0.18, gy + 0.14, Math.abs(gx * 3 + gy * 7), 0.75);
            continue;
          }

          // SEMUA TANAH DI HUTAN SEMUA HIJAU DAN BERSEMAK (gy <= -7)
          if (gy <= -7) {
            const breeze = Math.sin(elapsed * 1.9 + gx * 0.7 + gy * 0.6) * 0.6 * zTile;
            const bushSeed = Math.abs(gx * 11 + gy * 17);

            // Rerumputan segar bergoyang lembut
            drawTidyGrassTuft(gx - 0.26, gy - 0.18, breeze);
            drawTidyGrassTuft(gx + 0.24, gy + 0.20, breeze);
            drawTidyGrassTuft(gx + 0.22, gy - 0.22, breeze);
            drawTidyGrassTuft(gx - 0.20, gy + 0.24, breeze);

            // Semak-semak hutan berdaun lebat (Lush organic forest shrubs)
            drawForestBush(gx - 0.14, gy - 0.08, 1.05, bushSeed);
            if (bushSeed % 2 === 0) {
              drawForestBush(gx + 0.20, gy + 0.14, 0.88, bushSeed + 1);
            }
            if (bushSeed % 3 === 0) {
              drawForestBush(gx - 0.06, gy + 0.26, 0.78, bushSeed + 2);
            }

            // Bunga hutan & semanggi liar
            if (bushSeed % 2 === 1) {
              drawTidyFlower(gx + 0.16, gy - 0.12, bushSeed, 0.88);
            }
            continue;
          }

          // Transitional & Manicured City Grass Details (gy >= -8)
          if (!isTileUnderBuilding(gx, gy)) {
            const breeze = Math.sin(elapsed * 2.1 + gx * 0.65 + gy * 0.55) * 0.65 * zTile;
            const tileColorSeed = Math.abs(gx * 7 + gy * 13);

            // Symmetrical 4-point manicured grass tufts inside each grass tile
            drawTidyGrassTuft(gx - 0.23, gy - 0.23, breeze);
            drawTidyGrassTuft(gx + 0.23, gy - 0.23, breeze);
            drawTidyGrassTuft(gx - 0.23, gy + 0.23, breeze);
            drawTidyGrassTuft(gx + 0.23, gy + 0.23, breeze);

            // Neat, orderly flower borders along pathway edges & curated center parterres
            const roadN = isPathway(gx, gy - 1);
            const roadS = isPathway(gx, gy + 1);
            const roadW = isPathway(gx - 1, gy);
            const roadE = isPathway(gx + 1, gy);

            if (roadN) {
              drawTidyFlower(gx - 0.2, gy - 0.34, tileColorSeed, 0.92);
              drawTidyFlower(gx + 0.2, gy - 0.34, tileColorSeed + 1, 0.92);
            }
            if (roadS) {
              drawTidyFlower(gx - 0.2, gy + 0.34, tileColorSeed + 2, 0.92);
              drawTidyFlower(gx + 0.2, gy + 0.34, tileColorSeed + 3, 0.92);
            }
            if (!roadN && !roadS && roadW) {
              drawTidyFlower(gx - 0.34, gy - 0.18, tileColorSeed + 1, 0.92);
              drawTidyFlower(gx - 0.34, gy + 0.18, tileColorSeed + 4, 0.92);
            }
            if (!roadN && !roadS && roadE) {
              drawTidyFlower(gx + 0.34, gy - 0.18, tileColorSeed + 2, 0.92);
              drawTidyFlower(gx + 0.34, gy + 0.18, tileColorSeed + 5, 0.92);
            }

            // Neat center floral rosette on open lawn tiles
            if ((gx + gy) % 2 === 0) {
              drawTidyFlower(gx - 0.11, gy, tileColorSeed + 3, 0.88);
              if (gy > -8) {
                drawTidyFlower(gx + 0.11, gy, tileColorSeed + 5, 0.88);
              }
            } else {
              drawTidyFlower(gx, gy, tileColorSeed, 0.92);
            }
          }
        }
      }

      // ---------------------------------------------------------
      // 2B.5 3D ISOMETRIC LOW-POLY GREEN MOUNTAINS WITH WHITE SNOW-CAPPED PEAKS,
      //      TINY STYLIZED PINE TREES ON SLOPES, SQUARE FLOATING ISLAND CROSS-SECTION
      //      PEDESTAL BLOCKS (BROWN DIRT + GREEN GRASS TOP LAYER), & CRATER LAKE / WATERFALL
      //      PARTICLE SYSTEM WITH WATER SPLASH (PERCIKAN AIR)
      // ---------------------------------------------------------
      ctx.save();
      const zMtn = zoomLevelRef.current;
      const mPt = (wx: number, wy: number, alt: number = 0) => toScreen(wx, wy, alt, camera.x, camera.y);
      const fillMtnPoly = (
        pts: Array<{ x: number; y: number }>,
        fill: string,
        stroke?: string,
        lw = 0.85
      ) => {
        if (pts.length < 3) return;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lw * zMtn;
          ctx.stroke();
        }
      };

      // Clean Flat Vector 3D Game Asset Palette (Soft Directional Lighting from Top-Left / West)
      // 1) Cross-Section Floating Island Dirt Block Palette (Brown Dirt)
      const dirtSunlit = isNight ? '#5c280b' : '#c26a27';
      const dirtMidLight = isNight ? '#451a03' : '#a15017';
      const dirtMidShade = isNight ? '#361504' : '#853f10';
      const dirtDeepShade = isNight ? '#230d02' : '#692f0b';
      const dirtEdgeStroke = isNight ? 'rgba(20, 10, 4, 0.55)' : 'rgba(92, 40, 11, 0.35)';

      // 2) Cross-Section Floating Island Grass Top Layer Palette (Green Grass Top Layer)
      const grassTopSurface = isNight ? '#059669' : '#4ade80';
      const grassLipSunlit = isNight ? '#10b981' : '#86efac';
      const grassLipMid = isNight ? '#059669' : '#22c55e';
      const grassLipShade = isNight ? '#047857' : '#15803d';

      // 3) Low-Poly Green Mountain Slope Facets (Sharp Geometric Facets)
      const mtnGreenSunBright = isNight ? '#10b981' : '#4ade80';
      const mtnGreenSun = isNight ? '#059669' : '#22c55e';
      const mtnGreenMid = isNight ? '#047857' : '#16a34a';
      const mtnGreenShade = isNight ? '#065f46' : '#15803d';
      const mtnGreenDeepShade = isNight ? '#064e3b' : '#166534';
      const mtnGreenFacetStroke = isNight ? 'rgba(6, 78, 59, 0.55)' : 'rgba(20, 83, 45, 0.22)';

      // 4) White Snow-Capped Peak Facets (Sunlit White -> Ice-Blue Shaded Facets)
      const snowSunBright = isNight ? '#f1f5f9' : '#ffffff';
      const snowSunMid = isNight ? '#e2e8f0' : '#f8fafc';
      const snowMid = isNight ? '#cbd5e1' : '#e2e8f0';
      const snowShadeIce = isNight ? '#94a3b8' : '#bae6fd';
      const snowDeepIce = isNight ? '#64748b' : '#7dd3fc';
      const snowFacetStroke = isNight ? 'rgba(100, 116, 139, 0.45)' : 'rgba(148, 163, 184, 0.32)';

      // 0A) Flat Ground Concealer Skirt on the Horizontal Terrain Plane (alt = 0)
      //     Hides ground tile seams under the floating island mountain blocks without any vertical wall behind the mountains
      fillMtnPoly(
        [
          mPt(-8.55, -14.55, 0),
          mPt(8.55, -14.55, 0),
          mPt(8.55, -11.86, 0),
          mPt(0, -11.76, 0),
          mPt(-8.55, -11.86, 0),
        ],
        isNight ? '#064e3b' : '#15803d'
      );

      // 0B) Helper: Tiny Stylized Low-Poly 3D Pine Tree on the Mountain Slopes
      const drawTinySlopePine = (wx: number, wy: number, alt: number, scale: number = 1.0, snowTip: boolean = false) => {
        const base = mPt(wx, wy, alt);
        const s = scale * zMtn;
        // Soft drop shadow on the slope facet
        ctx.fillStyle = isNight ? 'rgba(2, 6, 23, 0.38)' : 'rgba(20, 83, 45, 0.26)';
        ctx.beginPath();
        ctx.ellipse(base.x + 1.2 * s, base.y + 0.6 * s, 4.2 * s, 2.0 * s, -0.1, 0, Math.PI * 2);
        ctx.fill();

        // Tiny stylized brown low-poly trunk
        const trunkTop = mPt(wx, wy, alt + 4.5 * scale);
        ctx.strokeStyle = isNight ? '#451a03' : '#78350f';
        ctx.lineWidth = 2.1 * s;
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.lineTo(trunkTop.x, trunkTop.y);
        ctx.stroke();

        // Tier 1 (Lower wide low-poly pyramid foliage: sunlit left triangle + shaded right triangle)
        const t1BotC = mPt(wx, wy + 0.04, alt + 3.8 * scale);
        const t1Top = mPt(wx, wy, alt + 14.5 * scale);
        const t1Left = { x: t1BotC.x - 5.2 * s, y: t1BotC.y - 0.8 * s };
        const t1Right = { x: t1BotC.x + 5.2 * s, y: t1BotC.y - 0.8 * s };
        fillMtnPoly([t1Top, t1Left, t1BotC], isNight ? '#059669' : '#22c55e');
        fillMtnPoly([t1Top, t1BotC, t1Right], isNight ? '#064e3b' : '#15803d');

        // Tier 2 (Upper sharp low-poly pyramid foliage)
        const t2BotC = mPt(wx, wy + 0.03, alt + 10.2 * scale);
        const t2Top = mPt(wx, wy, alt + 21.0 * scale);
        const t2Left = { x: t2BotC.x - 3.9 * s, y: t2BotC.y - 0.6 * s };
        const t2Right = { x: t2BotC.x + 3.9 * s, y: t2BotC.y - 0.6 * s };
        fillMtnPoly([t2Top, t2Left, t2BotC], isNight ? '#10b981' : '#4ade80');
        fillMtnPoly([t2Top, t2BotC, t2Right], isNight ? '#047857' : '#16a34a');

        // Optional crisp white snow frost cap on high-slope pines
        if (snowTip) {
          const sBotC = mPt(wx, wy + 0.02, alt + 16.5 * scale);
          const sLeft = { x: sBotC.x - 2.0 * s, y: sBotC.y - 0.3 * s };
          const sRight = { x: sBotC.x + 2.0 * s, y: sBotC.y - 0.3 * s };
          fillMtnPoly([t2Top, sLeft, sBotC], snowSunBright);
          fillMtnPoly([t2Top, sBotC, sRight], snowShadeIce);
        }
      };

      // 0C) Ground-Level Low-Poly Foothill Turf Apron & Outer Map-Edge Cross-Section Lip
      // Ensures all 3D Isometric Low-Poly Green Mountains sit flush on the map ground (alt = 0)
      // and blend organically with the Hutan Belantara grass tiles without any separating wall in front
      {
        const turfNW = mPt(-8.52, -14.52, 0);
        const turfNE = mPt(8.52, -14.52, 0);
        const turfSE = mPt(8.52, -11.45, 0);
        const turfSMidE = mPt(3.20, -11.30, 0);
        const turfSCenter = mPt(-0.35, -11.18, 0);
        const turfSMidW = mPt(-3.80, -11.32, 0);
        const turfSW = mPt(-8.52, -11.45, 0);

        // Seamless multi-stop elevation gradient: SEMUA HIJAU SEGAR (TIDAK ADA HITAM)
        const apronGrad = ctx.createLinearGradient(0, turfSCenter.y, 0, turfNW.y);
        if (isNight) {
          apronGrad.addColorStop(0.0, '#0d5336');
          apronGrad.addColorStop(0.35, '#0f603e');
          apronGrad.addColorStop(0.70, '#107049');
          apronGrad.addColorStop(1.0, '#0d5336');
        } else {
          apronGrad.addColorStop(0.0, '#15803d');
          apronGrad.addColorStop(0.35, '#16a34a');
          apronGrad.addColorStop(0.70, '#22c55e');
          apronGrad.addColorStop(1.0, '#15803d');
        }

        ctx.save();
        ctx.fillStyle = apronGrad;
        ctx.beginPath();
        ctx.moveTo(turfNW.x, turfNW.y);
        ctx.lineTo(turfNE.x, turfNE.y);
        ctx.lineTo(turfSE.x, turfSE.y);
        ctx.lineTo(turfSMidE.x, turfSMidE.y);
        ctx.lineTo(turfSCenter.x, turfSCenter.y);
        ctx.lineTo(turfSMidW.x, turfSMidW.y);
        ctx.lineTo(turfSW.x, turfSW.y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Bantalan semak & lumut hijau alami di kaki bukit (Lush green moss & shrub mounds)
        const foothillCushions: Array<{ fx: number; fy: number; sw: number; sh: number; color: string }> = [
          { fx: -6.2, fy: -11.55, sw: 1.8, sh: 1.1, color: isNight ? '#0f603e' : '#16a34a' },
          { fx: -3.1, fy: -11.42, sw: 2.2, sh: 1.3, color: isNight ? '#107049' : '#22c55e' },
          { fx: 0.8, fy: -11.38, sw: 2.4, sh: 1.2, color: isNight ? '#0d5336' : '#15803d' },
          { fx: 4.1, fy: -11.45, sw: 1.9, sh: 1.0, color: isNight ? '#0f603e' : '#16a34a' },
          { fx: 6.8, fy: -11.58, sw: 2.3, sh: 1.4, color: isNight ? '#107049' : '#22c55e' },
        ];
        foothillCushions.forEach((cushion) => {
          const pt = toScreen(cushion.fx, cushion.fy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          ctx.fillStyle = cushion.color;
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, cushion.sw * 3.8 * z, cushion.sh * 2.0 * z, 0.15, 0, Math.PI * 2);
          ctx.fill();
        });

        // Outer Western Map-Edge Downward Cross-Section (alt: 0 down to -22) so the mountain range
        // retains the 3D floating-island cross-section edge on the outer map border while flush with the ground
        const edgeYBack = -14.52;
        const edgeYMid = -13.15;
        const edgeYFront = -11.82;
        const eTopNW = mPt(-8.52, edgeYBack, 0);
        const eTopMid = mPt(-8.52, edgeYMid, 0);
        const eTopSW = mPt(-8.52, edgeYFront, 0);
        const eLipNW = mPt(-8.52, edgeYBack, -4);
        const eLipMid = mPt(-8.52, edgeYMid, -4);
        const eLipSW = mPt(-8.52, edgeYFront, -4);
        const eDirtNW = mPt(-8.52, edgeYBack, -22);
        const eDirtMid = mPt(-8.46, edgeYMid, -24);
        const eDirtSW = mPt(-8.52, edgeYFront, -20);

        fillMtnPoly([eLipNW, eLipMid, eDirtMid, eDirtNW], dirtSunlit, dirtEdgeStroke);
        fillMtnPoly([eLipMid, eLipSW, eDirtSW, eDirtMid], dirtMidLight, dirtEdgeStroke);
        fillMtnPoly([eTopNW, eTopMid, eLipMid, eLipNW], grassLipSunlit, mtnGreenFacetStroke);
        fillMtnPoly([eTopMid, eTopSW, eLipSW, eLipMid], grassLipMid, mtnGreenFacetStroke);
      }

      // All mountains sit directly on the map ground plane (alt = 0)
      const pedestalGrassAlt = 0;

      // Helper to render a COMPLETE, Self-Contained 360-Degree 3D Isometric Low-Poly Green Mountain
      // with a White Snow-Capped Peak, Organic Ground-Blending Foothill Root Spurs & Tiny Slope Pines
      const drawLowPolySnowCappedGreenMountain = (
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        baseAlt: number,
        peakAlt: number,
        pines: Array<{ dx: number; dy: number; altFrac: number; scale: number; snow?: boolean }>
      ) => {
        const apex = mPt(cx, cy, peakAlt);

        // Full 8-Vertex Natural Polygonal Base Ring anchored directly on the Map Ground (alt = baseAlt = 0)
        const bN = mPt(cx, cy - ry * 0.96, baseAlt);
        const bNW = mPt(cx - rx * 0.70, cy - ry * 0.66, baseAlt);
        const bW = mPt(cx - rx, cy - ry * 0.06, baseAlt);
        const bSW = mPt(cx - rx * 0.64, cy + ry * 0.84, baseAlt);
        const bS = mPt(cx + rx * 0.03, cy + ry * 1.02, baseAlt);
        const bSE = mPt(cx + rx * 0.66, cy + ry * 0.82, baseAlt);
        const bE = mPt(cx + rx, cy - ry * 0.06, baseAlt);
        const bNE = mPt(cx + rx * 0.70, cy - ry * 0.66, baseAlt);

        // Outer Ground-Blending Low-Poly Root Spur Vertices (alt = 0) that feather the mountain slopes into the map grass
        const spurW = mPt(cx - rx * 1.14, cy + ry * 0.18, baseAlt);
        const spurSW = mPt(cx - rx * 0.78, cy + ry * 1.12, baseAlt);
        const spurS = mPt(cx + rx * 0.04, cy + ry * 1.24, baseAlt);
        const spurSE = mPt(cx + rx * 0.80, cy + ry * 1.10, baseAlt);
        const spurE = mPt(cx + rx * 1.14, cy + ry * 0.16, baseAlt);

        // Low Foothill Knuckle Vertices (alt = 18% of height) connecting ground root spurs to the main slope
        const footAlt = baseAlt + (peakAlt - baseAlt) * 0.16;
        const fSW = mPt(cx - rx * 0.54, cy + ry * 0.72, footAlt);
        const fS = mPt(cx + rx * 0.02, cy + ry * 0.86, footAlt + 2);
        const fSE = mPt(cx + rx * 0.54, cy + ry * 0.70, footAlt);

        // Mid-Slope Low-Poly Green Facet Ring (sharp geometric break at ~45% height)
        const midAlt = baseAlt + (peakAlt - baseAlt) * 0.45;
        const mN = mPt(cx, cy - ry * 0.56, midAlt + 2);
        const mNW = mPt(cx - rx * 0.42, cy - ry * 0.38, midAlt + 4);
        const mW = mPt(cx - rx * 0.58, cy - ry * 0.04, midAlt + 3);
        const mSW = mPt(cx - rx * 0.36, cy + ry * 0.52, midAlt - 3);
        const mS = mPt(cx + rx * 0.02, cy + ry * 0.62, midAlt + 5);
        const mSE = mPt(cx + rx * 0.38, cy + ry * 0.48, midAlt - 2);
        const mE = mPt(cx + rx * 0.58, cy - ry * 0.04, midAlt + 3);
        const mNE = mPt(cx + rx * 0.42, cy - ry * 0.38, midAlt + 2);

        // Jagged Zig-Zag Low-Poly Snowline Ring (~67% height)
        const snowAlt = baseAlt + (peakAlt - baseAlt) * 0.67;
        const sN = mPt(cx, cy - ry * 0.32, snowAlt + 4);
        const sNW = mPt(cx - rx * 0.24, cy - ry * 0.22, snowAlt - 3);
        const sW = mPt(cx - rx * 0.32, cy - ry * 0.03, snowAlt + 4);
        const sWSW = mPt(cx - rx * 0.25, cy + ry * 0.16, snowAlt - 6);
        const sSW = mPt(cx - rx * 0.16, cy + ry * 0.31, snowAlt + 5);
        const sS = mPt(cx + rx * 0.01, cy + ry * 0.36, snowAlt - 7);
        const sSE = mPt(cx + rx * 0.17, cy + ry * 0.29, snowAlt + 4);
        const sESE = mPt(cx + rx * 0.26, cy + ry * 0.14, snowAlt - 5);
        const sE = mPt(cx + rx * 0.32, cy - ry * 0.03, snowAlt + 3);
        const sNE = mPt(cx + rx * 0.24, cy - ry * 0.22, snowAlt - 2);

        // 1) Rear / North-West & North-East Natural Slope Facets (drawn first, painter's order)
        fillMtnPoly([bN, bNW, mNW, mN], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([bNW, bW, mW, mNW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([bN, mN, mNE, bNE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([bNE, mNE, mE, bE], mtnGreenDeepShade, mtnGreenFacetStroke);

        fillMtnPoly([mN, mNW, sNW, sN], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([mNW, mW, sW, sNW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([mN, sN, sNE, mNE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([mNE, sNE, sE, mE], mtnGreenDeepShade, mtnGreenFacetStroke);

        fillMtnPoly([sN, sNW, apex], snowSunMid, snowFacetStroke);
        fillMtnPoly([sNW, sW, apex], snowSunBright, snowFacetStroke);
        fillMtnPoly([sN, apex, sNE], snowShadeIce, snowFacetStroke);
        fillMtnPoly([sNE, apex, sE], snowDeepIce, snowFacetStroke);

        // 2) Front Lower Geometric Green Mountain Facets (Triangulated for crisp low-poly 3D game asset look)
        fillMtnPoly([bW, bSW, mW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([bSW, mSW, mW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([bSW, bS, mSW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([bS, mS, mSW], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([bS, bSE, mS], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([bSE, mSE, mS], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([bSE, bE, mSE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([bE, mE, mSE], mtnGreenDeepShade, mtnGreenFacetStroke);

        // 2B) Ground-Rooting Low-Poly Foothill Spur Facets (smoothly uniting the mountain slopes with the map grass)
        fillMtnPoly([bW, spurW, spurSW, fSW], grassLipSunlit, mtnGreenFacetStroke);
        fillMtnPoly([spurSW, bS, fS, fSW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([bS, spurS, fS], grassLipMid, mtnGreenFacetStroke);
        fillMtnPoly([spurS, bSE, fSE, fS], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([bSE, spurSE, fSE], grassLipShade, mtnGreenFacetStroke);
        fillMtnPoly([spurSE, spurE, bE, fSE], mtnGreenShade, mtnGreenFacetStroke);

        // 3) Front Upper Geometric Green Mountain Facets rising to the Jagged Snowline
        fillMtnPoly([mW, mSW, sWSW, sW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([mSW, sSW, sWSW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([mSW, mS, sS, sSW], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([mS, mSE, sSE, sS], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([mSE, sESE, sSE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([mSE, mE, sE, sESE], mtnGreenDeepShade, mtnGreenFacetStroke);

        // 4) Front WHITE SNOW-CAPPED PEAK (Sharp Low-Poly Triangular Facets with Soft Directional Lighting)
        fillMtnPoly([sW, sWSW, apex], snowSunBright, snowFacetStroke);
        fillMtnPoly([sWSW, sSW, apex], snowSunMid, snowFacetStroke);
        fillMtnPoly([sSW, sS, apex], snowSunBright, snowFacetStroke);
        fillMtnPoly([sS, sSE, apex], snowMid, snowFacetStroke);
        fillMtnPoly([sSE, sESE, apex], snowShadeIce, snowFacetStroke);
        fillMtnPoly([sESE, sE, apex], snowDeepIce, snowFacetStroke);

        // Crisp Geometric Facet Ridge Highlights on Snow & Green Slopes
        ctx.strokeStyle = isNight ? 'rgba(226, 232, 240, 0.28)' : 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1.1 * zMtn;
        ctx.beginPath();
        ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(sSW.x, sSW.y);
        ctx.lineTo(mSW.x, mSW.y);
        ctx.lineTo(bSW.x, bSW.y);
        ctx.moveTo(apex.x, apex.y);
        ctx.lineTo(sS.x, sS.y);
        ctx.stroke();

        // Render Tiny Stylized Pine Trees perched on the Low-Poly Green Slopes
        for (const pt of pines) {
          const pWx = cx + pt.dx * rx;
          const pWy = cy + pt.dy * ry;
          const pAlt = baseAlt + pt.altFrac * (peakAlt - baseAlt);
          drawTinySlopePine(pWx, pWy, pAlt, pt.scale, pt.snow);
        }
      };

      // 0D) Secondary Natural Saddle Foothill Peaks (Full 3D Low-Poly Mountains nestled between the 3 Main Peaks, grounded at alt = 0)
      drawLowPolySnowCappedGreenMountain(-3.12, -13.38, 1.95, 1.02, pedestalGrassAlt, 138, [
        { dx: -0.35, dy: 0.55, altFrac: 0.22, scale: 0.82 },
        { dx: 0.28, dy: 0.52, altFrac: 0.26, scale: 0.80 },
      ]);
      drawLowPolySnowCappedGreenMountain(2.42, -13.38, 2.02, 1.04, pedestalGrassAlt, 144, [
        { dx: -0.32, dy: 0.54, altFrac: 0.24, scale: 0.84 },
        { dx: 0.30, dy: 0.50, altFrac: 0.22, scale: 0.82 },
      ]);

      // 1. Gunung Hijau Bersalju Barat (Complete 3D Low-Poly Green Mountain united with the Map Ground at alt = 0)
      drawLowPolySnowCappedGreenMountain(-5.78, -13.12, 2.68, 1.24, pedestalGrassAlt, 174, [
        { dx: -0.58, dy: 0.42, altFrac: 0.18, scale: 0.92 },
        { dx: -0.32, dy: 0.65, altFrac: 0.25, scale: 1.02 },
        { dx: -0.22, dy: 0.36, altFrac: 0.46, scale: 0.84, snow: true },
        { dx: 0.18, dy: 0.62, altFrac: 0.28, scale: 0.95 },
        { dx: 0.46, dy: 0.44, altFrac: 0.36, scale: 0.88 },
      ]);

      // 2. Gunung Hijau Bersalju Timur (Complete 3D Low-Poly Green Mountain united with the Map Ground & Danau Pusat Shore at alt = 0)
      drawLowPolySnowCappedGreenMountain(5.38, -13.12, 2.98, 1.25, pedestalGrassAlt, 180, [
        { dx: -0.54, dy: 0.46, altFrac: 0.22, scale: 0.90 },
        { dx: 0.14, dy: 0.60, altFrac: 0.30, scale: 0.96 },
        { dx: 0.38, dy: 0.48, altFrac: 0.44, scale: 0.85, snow: true },
        { dx: 0.58, dy: 0.35, altFrac: 0.20, scale: 1.00 },
      ]);

      // 3. GUNUNG UTAMA SEUTUHNYA (COMPLETE 3D ISOMETRIC LOW-POLY GREEN MOUNTAIN UNITED WITH MAP GROUND AT alt = 0,
      //    WITH NATURAL COMPACT DANAU KAWAH & WATER SPLASH PARTICLE SYSTEM DI DASAR DANAU KAWAH, cx: -0.35, cy: -13.10)
      {
        const vCx = -0.35;
        const vCy = -13.10;
        const vRx = 3.18;
        const vRy = 1.32;
        const baseAlt = 0; // Directly united with the map ground!
        const lowAlt = 88;
        const snowLineAlt = 148;
        const rimAlt = 224;

        // Complete 360-Degree Natural Basal Ring anchored directly onto the Map Ground (alt = 0)
        const vbN = mPt(vCx, vCy - vRy * 0.96, baseAlt);
        const vbNW = mPt(vCx - vRx * 0.68, vCy - vRy * 0.66, baseAlt);
        const vbW = mPt(vCx - vRx, vCy - vRy * 0.08, baseAlt);
        const vbWSW = mPt(vCx - vRx * 0.72, vCy + vRy * 0.52, baseAlt);
        const vbSW = mPt(vCx - vRx * 0.36, vCy + vRy * 0.92, baseAlt);
        const vbS = mPt(vCx, vCy + vRy * 1.04, baseAlt);
        const vbSE = mPt(vCx + vRx * 0.36, vCy + vRy * 0.92, baseAlt);
        const vbESE = mPt(vCx + vRx * 0.72, vCy + vRy * 0.52, baseAlt);
        const vbE = mPt(vCx + vRx, vCy - vRy * 0.08, baseAlt);
        const vbNE = mPt(vCx + vRx * 0.68, vCy - vRy * 0.66, baseAlt);

        // Ground-Blending Foothill Root Spurs for the Central Mountain (alt = 0)
        const vSpurWSW = mPt(vCx - vRx * 0.86, vCy + vRy * 0.78, baseAlt);
        const vSpurSW = mPt(vCx - vRx * 0.44, vCy + vRy * 1.18, baseAlt);
        const vSpurS = mPt(vCx, vCy + vRy * 1.26, baseAlt);
        const vSpurSE = mPt(vCx + vRx * 0.44, vCy + vRy * 1.18, baseAlt);
        const vSpurESE = mPt(vCx + vRx * 0.86, vCy + vRy * 0.78, baseAlt);
        const vfSW = mPt(vCx - vRx * 0.32, vCy + vRy * 0.82, 24);
        const vfS = mPt(vCx, vCy + vRy * 0.92, 26);
        const vfSE = mPt(vCx + vRx * 0.32, vCy + vRy * 0.82, 24);

        // Mid-Slope Low-Poly Green Facet Ring (alt = 88)
        const vlN = mPt(vCx, vCy - vRy * 0.56, lowAlt);
        const vlNW = mPt(vCx - vRx * 0.44, vCy - vRy * 0.38, lowAlt + 3);
        const vlW = mPt(vCx - vRx * 0.62, vCy - vRy * 0.06, lowAlt);
        const vlWSW = mPt(vCx - vRx * 0.46, vCy + vRy * 0.34, lowAlt + 5);
        const vlSW = mPt(vCx - vRx * 0.24, vCy + vRy * 0.62, lowAlt - 4);
        const vlS = mPt(vCx, vCy + vRy * 0.70, lowAlt + 6);
        const vlSE = mPt(vCx + vRx * 0.24, vCy + vRy * 0.62, lowAlt - 3);
        const vlESE = mPt(vCx + vRx * 0.46, vCy + vRy * 0.34, lowAlt + 4);
        const vlE = mPt(vCx + vRx * 0.62, vCy - vRy * 0.06, lowAlt);
        const vlNE = mPt(vCx + vRx * 0.44, vCy - vRy * 0.38, lowAlt + 2);

        // Jagged Low-Poly Zig-Zag Snowline Ring (alt = 148)
        const vuN = mPt(vCx, vCy - vRy * 0.34, snowLineAlt + 4);
        const vuNW = mPt(vCx - vRx * 0.25, vCy - vRy * 0.22, snowLineAlt - 3);
        const vuW = mPt(vCx - vRx * 0.35, vCy - vRy * 0.04, snowLineAlt + 4);
        const vuWSW = mPt(vCx - vRx * 0.26, vCy + vRy * 0.20, snowLineAlt - 7);
        const vuSW = mPt(vCx - vRx * 0.14, vCy + vRy * 0.38, snowLineAlt + 6);
        const vuS = mPt(vCx, vCy + vRy * 0.43, snowLineAlt - 8);
        const vuSE = mPt(vCx + vRx * 0.14, vCy + vRy * 0.38, snowLineAlt + 5);
        const vuESE = mPt(vCx + vRx * 0.26, vCy + vRy * 0.20, snowLineAlt - 6);
        const vuE = mPt(vCx + vRx * 0.35, vCy - vRy * 0.04, snowLineAlt + 3);
        const vuNE = mPt(vCx + vRx * 0.25, vCy - vRy * 0.22, snowLineAlt - 2);

        // Compact, Natural Summit Crater Rim & Pointed Snow-Capped Crown (cRx = 0.56, cRy = 0.26)
        // Makes the mountain look like a complete, natural conical peak with a nestled crater lake at its tip
        const cRx = 0.56;
        const cRy = 0.26;
        const vrW = mPt(vCx - cRx, vCy - 0.01, rimAlt + 3);
        const vrNW = mPt(vCx - cRx * 0.66, vCy - cRy * 0.85, rimAlt + 10);
        const vrN = mPt(vCx - 0.04, vCy - cRy * 1.12, rimAlt + 16); // True pointed snow-capped summit apex
        const vrNE = mPt(vCx + cRx * 0.66, vCy - cRy * 0.85, rimAlt + 9);
        const vrE = mPt(vCx + cRx, vCy - 0.01, rimAlt + 2);
        const vrESE = mPt(vCx + cRx * 0.78, vCy + cRy * 0.48, rimAlt - 4);
        const vrSE = mPt(vCx + cRx * 0.42, vCy + cRy * 0.86, rimAlt - 8);
        const vrS = mPt(vCx, vCy + cRy * 0.98, rimAlt - 10);
        const vrSW = mPt(vCx - cRx * 0.42, vCy + cRy * 0.86, rimAlt - 7);
        const vrWSW = mPt(vCx - cRx * 0.78, vCy + cRy * 0.48, rimAlt - 3);

        // Rear / North Natural Slope Facets (drawn first, painter's order, zero artificial wall)
        fillMtnPoly([vbN, vbNW, vlNW, vlN], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([vbNW, vbW, vlW, vlNW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([vbN, vlN, vlNE, vbNE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([vbNE, vlNE, vlE, vbE], mtnGreenDeepShade, mtnGreenFacetStroke);

        fillMtnPoly([vlN, vlNW, vuNW, vuN], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([vlNW, vlW, vuW, vuNW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([vlN, vuN, vuNE, vlNE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([vlNE, vuNE, vuE, vlE], mtnGreenDeepShade, mtnGreenFacetStroke);

        fillMtnPoly([vuN, vuNW, vrNW, vrN], snowSunMid, snowFacetStroke);
        fillMtnPoly([vuNW, vuW, vrW, vrNW], snowSunBright, snowFacetStroke);
        fillMtnPoly([vuN, vrN, vrNE, vuNE], snowShadeIce, snowFacetStroke);
        fillMtnPoly([vuNE, vrNE, vrE, vuE], snowDeepIce, snowFacetStroke);

        // 1) Front Lower Triangulated Low-Poly Green Mountain Facets (alt 0 -> 88)
        fillMtnPoly([vbW, vbWSW, vlW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([vbWSW, vlWSW, vlW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([vbWSW, vbSW, vlWSW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([vbSW, vlSW, vlWSW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([vbSW, vbS, vlSW], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([vbS, vlS, vlSW], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([vbS, vbSE, vlS], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([vbSE, vlSE, vlS], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([vbSE, vbESE, vlSE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([vbESE, vlESE, vlSE], mtnGreenDeepShade, mtnGreenFacetStroke);
        fillMtnPoly([vbESE, vbE, vlESE], mtnGreenDeepShade, mtnGreenFacetStroke);
        fillMtnPoly([vbE, vlE, vlESE], mtnGreenDeepShade, mtnGreenFacetStroke);

        // 1B) Central Mountain Ground-Blending Root Spur Facets (uniting the mountain base with the Hutan Belantara grass)
        fillMtnPoly([vbWSW, vSpurWSW, vSpurSW, vfSW], grassLipSunlit, mtnGreenFacetStroke);
        fillMtnPoly([vSpurSW, vSpurS, vfS, vfSW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([vSpurS, vSpurSE, vfSE, vfS], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([vSpurSE, vSpurESE, vbESE, vfSE], grassLipShade, mtnGreenFacetStroke);

        // 2) Front Upper Triangulated Low-Poly Green Mountain Facets (alt 88 -> 148 snowline)
        fillMtnPoly([vlW, vlWSW, vuWSW, vuW], mtnGreenSunBright, mtnGreenFacetStroke);
        fillMtnPoly([vlWSW, vlSW, vuSW, vuWSW], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([vlSW, vlS, vuS, vuSW], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([vlS, vlSE, vuSE, vuS], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([vlSE, vlESE, vuESE, vuSE], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([vlESE, vlE, vuE, vuESE], mtnGreenDeepShade, mtnGreenFacetStroke);

        // 3) Front WHITE SNOW-CAPPED PEAK FACETS tapering naturally to the compact summit crater (alt 148 -> 224+)
        fillMtnPoly([vuW, vuWSW, vrWSW, vrW], snowSunBright, snowFacetStroke);
        fillMtnPoly([vuWSW, vuSW, vrSW, vrWSW], snowSunMid, snowFacetStroke);
        fillMtnPoly([vuSW, vuS, vrS, vrSW], snowSunBright, snowFacetStroke);
        fillMtnPoly([vuS, vuSE, vrSE, vrS], snowMid, snowFacetStroke);
        fillMtnPoly([vuSE, vuESE, vrESE, vrSE], snowShadeIce, snowFacetStroke);
        fillMtnPoly([vuESE, vuE, vrE, vrESE], snowDeepIce, snowFacetStroke);

        // Crisp Geometric Low-Poly Facet Ridge Lines
        ctx.strokeStyle = isNight ? 'rgba(226, 232, 240, 0.30)' : 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.15 * zMtn;
        ctx.beginPath();
        ctx.moveTo(vrWSW.x, vrWSW.y);
        ctx.lineTo(vuWSW.x, vuWSW.y);
        ctx.lineTo(vlWSW.x, vlWSW.y);
        ctx.moveTo(vrSW.x, vrSW.y);
        ctx.lineTo(vuSW.x, vuSW.y);
        ctx.lineTo(vlSW.x, vlSW.y);
        ctx.lineTo(vbSW.x, vbSW.y);
        ctx.moveTo(vrS.x, vrS.y);
        ctx.lineTo(vuS.x, vuS.y);
        ctx.lineTo(vlS.x, vlS.y);
        ctx.stroke();

        // Tiny Stylized Pine Trees perched on the Central Low-Poly Green Mountain Slopes
        const centralSlopePines = [
          { dx: -0.62, dy: 0.38, altFrac: 0.16, scale: 0.96 },
          { dx: -0.42, dy: 0.62, altFrac: 0.24, scale: 1.05 },
          { dx: -0.26, dy: 0.48, altFrac: 0.42, scale: 0.88, snow: true },
          { dx: -0.06, dy: 0.72, altFrac: 0.22, scale: 0.94 },
          { dx: 0.22, dy: 0.64, altFrac: 0.28, scale: 1.00 },
          { dx: 0.34, dy: 0.45, altFrac: 0.44, scale: 0.86, snow: true },
          { dx: 0.56, dy: 0.42, altFrac: 0.20, scale: 0.92 },
        ];
        for (const cp of centralSlopePines) {
          drawTinySlopePine(
            vCx + cp.dx * vRx,
            vCy + cp.dy * vRy,
            baseAlt + cp.altFrac * (rimAlt - baseAlt),
            cp.scale,
            cp.snow
          );
        }

        // 4) Compact, Natural Recessed Summit Caldera Basin & Danau Kawah
        fillMtnPoly(
          [vrW, vrNW, vrN, vrNE, vrE, vrESE, vrSE, vrS, vrSW, vrWSW],
          isNight ? '#1e293b' : '#334155',
          isNight ? '#94a3b8' : '#e2e8f0',
          1.1
        );

        const lkRx = cRx * 0.76;
        const lkRy = cRy * 0.74;
        const lkAlt = rimAlt - 11;
        const klW = mPt(vCx - lkRx, vCy + 0.02, lkAlt);
        const klNW = mPt(vCx - lkRx * 0.70, vCy - lkRy * 0.74, lkAlt);
        const klN = mPt(vCx, vCy - lkRy * 0.96, lkAlt);
        const klNE = mPt(vCx + lkRx * 0.70, vCy - lkRy * 0.74, lkAlt);
        const klE = mPt(vCx + lkRx, vCy + 0.02, lkAlt);
        const klSE = mPt(vCx + lkRx * 0.66, vCy + lkRy * 0.84, lkAlt);
        const klS = mPt(vCx, vCy + lkRy * 0.98, lkAlt);
        const klSW = mPt(vCx - lkRx * 0.66, vCy + lkRy * 0.84, lkAlt);

        // Steep Inner North Caldera Cliff Face
        fillMtnPoly(
          [vrW, vrNW, vrN, vrNE, vrE, klE, klNE, klN, klNW, klW],
          isNight ? '#0f172a' : '#475569'
        );

        // 5) DANAU KAWAH (Natural Compact Turquoise-Cyan Alpine Crater Lake)
        const craterCenterPt = mPt(vCx, vCy + 0.03, lkAlt);
        const craterGrad = ctx.createRadialGradient(
          craterCenterPt.x - 1.5 * zMtn,
          craterCenterPt.y - 0.8 * zMtn,
          1 * zMtn,
          craterCenterPt.x,
          craterCenterPt.y,
          15 * zMtn
        );
        craterGrad.addColorStop(0, isNight ? '#5eead4' : '#a5f3fc');
        craterGrad.addColorStop(0.42, isNight ? '#14b8a6' : '#2dd4bf');
        craterGrad.addColorStop(0.78, isNight ? '#0284c7' : '#0ea5e9');
        craterGrad.addColorStop(1, isNight ? '#115e59' : '#0369a1');

        fillMtnPoly(
          [klW, klNW, klN, klNE, klE, klSE, klS, klSW],
          craterGrad as unknown as string
        );

        // 6) GLACIAL SNOWMELT CASCADE & WATER SPLASH PARTICLE SYSTEM DI DASAR DANAU KAWAH
        const cwTopL = mPt(vCx - 0.11, vCy - lkRy * 0.90, rimAlt + 9);
        const cwTopR = mPt(vCx + 0.08, vCy - lkRy * 0.90, rimAlt + 9);
        const cwBotL = mPt(vCx - 0.13, vCy - lkRy * 0.38, lkAlt + 1);
        const cwBotR = mPt(vCx + 0.10, vCy - lkRy * 0.38, lkAlt + 1);
        fillMtnPoly([cwTopL, cwTopR, cwBotR, cwBotL], 'rgba(224, 242, 254, 0.88)');

        // Falling snowmelt water stream particles into Danau Kawah
        for (let cp = 0; cp < 10; cp++) {
          const cPhase = (elapsed * 2.4 + cp * 0.19) % 1.0;
          const pWx = vCx - 0.09 + ((cp * 0.05) % 0.16);
          const pWy = vCy - lkRy * 0.88 + cPhase * (lkRy * 0.50);
          const pAlt = rimAlt + 8 - cPhase * cPhase * 18;
          const pt = mPt(pWx, pWy, pAlt);
          ctx.fillStyle = cp % 2 === 0 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(186, 230, 253, 0.88)';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, (0.85 + (1 - cPhase) * 0.65) * zMtn, 0, Math.PI * 2);
          ctx.fill();
        }

        // Expanding Water Splash Impact Rings on Danau Kawah Surface
        const kawahSplashBase = mPt(vCx - 0.01, vCy - lkRy * 0.28, lkAlt + 1);
        for (let cr = 0; cr < 3; cr++) {
          const crProg = (elapsed * 0.85 + cr * 0.33) % 1.0;
          const rW = (1.8 + crProg * 9.0) * zMtn;
          const rH = (0.9 + crProg * 4.2) * zMtn;
          ctx.strokeStyle = `rgba(240, 249, 255, ${((1 - crProg) * 0.82).toFixed(2)})`;
          ctx.lineWidth = 0.95 * zMtn;
          ctx.beginPath();
          ctx.ellipse(kawahSplashBase.x, kawahSplashBase.y, rW, rH, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Foaming White Water Splash Crown at Dasar Danau Kawah
        const crownPulse = 0.88 + Math.sin(elapsed * 7.5) * 0.14;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
        ctx.beginPath();
        ctx.ellipse(
          kawahSplashBase.x,
          kawahSplashBase.y,
          4.2 * crownPulse * zMtn,
          1.8 * crownPulse * zMtn,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // 16 Parabolic Water Splash Droplets (Percikan Air) Bursting at Dasar Danau Kawah
        for (let kd = 0; kd < 16; kd++) {
          const dPhase = (elapsed * (1.85 + (kd % 4) * 0.28) + kd * 0.17) % 1.0;
          const angle = (kd / 16) * Math.PI * 2 + (kd % 3) * 0.2;
          const radiusWx = (0.06 + (kd % 3) * 0.045) * dPhase;
          const dWx = vCx - 0.01 + Math.cos(angle) * radiusWx;
          const dWy = vCy - lkRy * 0.26 + Math.sin(angle) * radiusWx * 0.55;
          // Parabolic trajectory: rises rapidly then falls back to crater lake surface
          const splashLift = 4.0 * dPhase * (1 - dPhase) * (9 + (kd % 3) * 4);
          const dPt = mPt(dWx, dWy, lkAlt + 1 + splashLift);
          const dAlpha = Math.sin(dPhase * Math.PI) * 0.95;
          const dRad = (0.8 + (1 - dPhase) * 0.9) * zMtn;
          ctx.fillStyle =
            kd % 3 === 0
              ? `rgba(255, 255, 255, ${dAlpha.toFixed(2)})`
              : `rgba(224, 242, 254, ${dAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(dPt.x, dPt.y, dRad, 0, Math.PI * 2);
          ctx.fill();
        }

        // Front Snow-Capped Caldera Rim Lip (occludes the front edge of the crater lake for 3D depth)
        ctx.strokeStyle = snowSunBright;
        ctx.lineWidth = 1.6 * zMtn;
        ctx.beginPath();
        ctx.moveTo(vrW.x, vrW.y);
        ctx.lineTo(vrWSW.x, vrWSW.y);
        ctx.lineTo(vrSW.x, vrSW.y);
        ctx.lineTo(vrS.x, vrS.y);
        ctx.lineTo(vrSE.x, vrSE.y);
        ctx.lineTo(vrESE.x, vrESE.y);
        ctx.lineTo(vrE.x, vrE.y);
        ctx.stroke();

        // 7) Gentle Rising Mist & Vapor Plumes above Danau Kawah
        for (let sp = 0; sp < 5; sp++) {
          const sProg = (elapsed * 0.28 + sp * (1 / 5)) % 1.0;
          const windDriftX = Math.sin(elapsed * 0.9 + sp * 1.4) * (2.5 + sProg * 8) * zMtn + sProg * 7 * zMtn;
          const liftY = sProg * 38 * zMtn;
          const puffX = craterCenterPt.x + ((sp % 3) - 1) * 2.8 * zMtn + windDriftX;
          const puffY = craterCenterPt.y - 2 * zMtn - liftY;
          const puffRx = (4.8 + sProg * 12) * zMtn;
          const puffRy = (3.0 + sProg * 7.0) * zMtn;
          const puffAlpha = Math.sin(sProg * Math.PI) * (isNight ? 0.32 : 0.44);

          const puffGrad = ctx.createRadialGradient(puffX, puffY, 1.0 * zMtn, puffX, puffY, puffRx);
          puffGrad.addColorStop(0, `rgba(255, 255, 255, ${puffAlpha.toFixed(3)})`);
          puffGrad.addColorStop(0.6, `rgba(224, 242, 254, ${(puffAlpha * 0.65).toFixed(3)})`);
          puffGrad.addColorStop(1, 'rgba(224, 242, 254, 0)');

          ctx.fillStyle = puffGrad;
          ctx.beginPath();
          ctx.ellipse(puffX, puffY, puffRx, puffRy, -0.06, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 4. SISTEM PARTIKEL AIR TERJUN DI GUNUNG (Compact Natural Mountain Spring Waterfall Integrated into the Eastern Mountain Slope)
      {
        const mwfX0 = 4.58;
        const mwfX1 = 4.84;
        const mwfCx = (mwfX0 + mwfX1) * 0.5; // 4.71
        const springAlt = 82;
        const midLedgeAlt = 42;
        const baseShoreAlt = 0;

        // 1) Natural Recessed Mountain Spring Grotto (Celah Mata Air Alami di Lereng Gunung Hijau Bersalju Timur)
        const grottoApex = mPt(mwfCx, -12.68, springAlt + 16);
        const grottoTopL = mPt(mwfX0 - 0.14, -12.62, springAlt + 8);
        const grottoTopR = mPt(mwfX1 + 0.14, -12.62, springAlt + 8);
        const mwfTopL = mPt(mwfX0, -12.58, springAlt);
        const mwfTopR = mPt(mwfX1, -12.58, springAlt);
        const mwfMidL = mPt(mwfX0 - 0.03, -12.22, midLedgeAlt);
        const mwfMidR = mPt(mwfX1 + 0.03, -12.22, midLedgeAlt);
        const mwfBotL = mPt(mwfX0 - 0.06, -11.82, baseShoreAlt);
        const mwfBotR = mPt(mwfX1 + 0.06, -11.82, baseShoreAlt);

        // Outer low-poly emerald-moss & slate slope facets that seamlessly blend the waterfall cleft into the mountain's green facets
        const cheekLeftTop = mPt(mwfX0 - 0.24, -12.56, springAlt + 4);
        const cheekLeftMid = mPt(mwfX0 - 0.20, -12.20, midLedgeAlt + 2);
        const cheekLeftBot = mPt(mwfX0 - 0.18, -11.82, baseShoreAlt);
        const cheekRightTop = mPt(mwfX1 + 0.24, -12.56, springAlt + 4);
        const cheekRightMid = mPt(mwfX1 + 0.20, -12.20, midLedgeAlt + 2);
        const cheekRightBot = mPt(mwfX1 + 0.18, -11.82, baseShoreAlt);

        // Dark recessed spring cave shadow where water emerges from inside the mountain
        fillMtnPoly(
          [grottoApex, grottoTopR, mwfTopR, mwfTopL, grottoTopL],
          isNight ? '#090d16' : '#1e293b'
        );

        // Mossy green-slate low-poly side facets uniting the cleft with the green mountain slope
        fillMtnPoly([grottoApex, grottoTopL, cheekLeftTop], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([grottoApex, cheekRightTop, grottoTopR], mtnGreenDeepShade, mtnGreenFacetStroke);
        fillMtnPoly([cheekLeftTop, mwfTopL, mwfMidL, cheekLeftMid], mtnGreenMid, mtnGreenFacetStroke);
        fillMtnPoly([cheekLeftMid, mwfMidL, mwfBotL, cheekLeftBot], mtnGreenSun, mtnGreenFacetStroke);
        fillMtnPoly([mwfTopR, cheekRightTop, cheekRightMid, mwfMidR], mtnGreenShade, mtnGreenFacetStroke);
        fillMtnPoly([mwfMidR, cheekRightMid, cheekRightBot, mwfBotR], mtnGreenDeepShade, mtnGreenFacetStroke);

        // Inner wet basalt rock lip flanking the narrow water stream
        fillMtnPoly(
          [grottoTopL, mwfTopL, mwfMidL, mwfBotL, mPt(mwfX0 - 0.10, -11.82, baseShoreAlt)],
          isNight ? '#1e293b' : '#475569'
        );
        fillMtnPoly(
          [mwfTopR, grottoTopR, mPt(mwfX1 + 0.10, -11.82, baseShoreAlt), mwfBotR, mwfMidR],
          isNight ? '#0f172a' : '#334155'
        );

        // Small Emerald-Cyan Spring Pool nestled inside the Mountain Cleft (alt = 82)
        const springPoolCenter = mPt(mwfCx, -12.59, springAlt + 1);
        ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
        ctx.beginPath();
        ctx.ellipse(springPoolCenter.x, springPoolCenter.y, 5.2 * zMtn, 2.0 * zMtn, -0.05, 0, Math.PI * 2);
        ctx.fill();

        // Subtle Aqua Mist Glow around the Natural Mountain Spring Stream
        const mwfHaloPt = mPt(mwfCx, -12.22, midLedgeAlt);
        const mwfHaloGrad = ctx.createRadialGradient(
          mwfHaloPt.x,
          mwfHaloPt.y,
          1.5 * zMtn,
          mwfHaloPt.x,
          mwfHaloPt.y,
          16 * zMtn
        );
        mwfHaloGrad.addColorStop(0, 'rgba(186, 230, 253, 0.38)');
        mwfHaloGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.14)');
        mwfHaloGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = mwfHaloGrad;
        ctx.beginPath();
        ctx.ellipse(mwfHaloPt.x, mwfHaloPt.y, 12 * zMtn, 18 * zMtn, -0.04, 0, Math.PI * 2);
        ctx.fill();

        // Compact, Natural Two-Tier Cascading Water Stream following the Mountain Slope
        const mwfGrad = ctx.createLinearGradient(mwfTopL.x, mwfTopL.y, mwfBotL.x, mwfBotL.y);
        mwfGrad.addColorStop(0, 'rgba(224, 242, 254, 0.95)');
        mwfGrad.addColorStop(0.28, 'rgba(56, 189, 248, 0.90)');
        mwfGrad.addColorStop(0.52, 'rgba(255, 255, 255, 0.96)');
        mwfGrad.addColorStop(0.80, 'rgba(14, 165, 233, 0.92)');
        mwfGrad.addColorStop(1, 'rgba(240, 249, 255, 0.98)');

        ctx.fillStyle = mwfGrad;
        ctx.beginPath();
        ctx.moveTo(mwfTopL.x, mwfTopL.y);
        ctx.lineTo(mwfTopR.x, mwfTopR.y);
        ctx.lineTo(mwfMidR.x, mwfMidR.y);
        ctx.lineTo(mwfBotR.x, mwfBotR.y);
        ctx.lineTo(mwfBotL.x, mwfBotL.y);
        ctx.lineTo(mwfMidL.x, mwfMidL.y);
        ctx.closePath();
        ctx.fill();

        // Natural Mid-Slope Low-Poly Stepping Stone Ledge (alt = 42)
        fillMtnPoly(
          [
            mPt(mwfX0 - 0.05, -12.22, midLedgeAlt + 2),
            mPt(mwfX1 + 0.05, -12.22, midLedgeAlt + 2),
            mPt(mwfCx, -12.16, midLedgeAlt - 5),
          ],
          isNight ? '#1e293b' : '#475569'
        );

        // Two Tiny Stylized Slope Pine Trees flanking the Mountain Waterfall Cleft for extra natural integration
        drawTinySlopePine(mwfX0 - 0.22, -12.42, 58, 0.86, false);
        drawTinySlopePine(mwfX1 + 0.24, -12.12, 32, 0.92, false);

        // 10 Delicate Cascading Water Thread Veins
        ctx.lineCap = 'round';
        for (let mw = 0; mw < 10; mw++) {
          const t = (mw + 0.5) / 10;
          const rWx = mwfX0 + t * (mwfX1 - mwfX0) + Math.sin(elapsed * 5.2 + mw) * 0.008;
          const speed = 1.55 + (mw % 3) * 0.34;
          const dropProg = (elapsed * speed + mw * 0.17) % 1.0;
          const alt0 = springAlt - dropProg * (springAlt - 4);
          const alt1 = Math.max(0, alt0 - 15);
          const wy0 = -12.58 + dropProg * 0.72;
          const wy1 = -12.58 + Math.min(0.76, (dropProg + 0.18) * 0.72);
          const p0 = mPt(rWx, wy0, alt0);
          const p1 = mPt(rWx, wy1, alt1);
          ctx.strokeStyle =
            mw % 3 === 0
              ? 'rgba(255, 255, 255, 0.94)'
              : mw % 2 === 0
              ? 'rgba(224, 242, 254, 0.85)'
              : 'rgba(125, 211, 252, 0.78)';
          ctx.lineWidth = (mw % 3 === 0 ? 1.25 : 0.9) * zMtn;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }

        // WATERFALL PARTICLE SYSTEM — LAYER A: 24 Fine Gravity-Accelerated Mountain Stream Droplets
        for (let fp = 0; fp < 24; fp++) {
          const pSpeed = 1.45 + (fp % 5) * 0.24;
          const tPhase = (elapsed * pSpeed + fp * 0.127) % 1.0;
          const lane = ((fp * 29) % 100) / 100;
          const spread = 1.0 + tPhase * 0.22;
          const pWx =
            mwfCx +
            (lane - 0.5) * (mwfX1 - mwfX0) * spread +
            Math.sin(elapsed * 5.8 + fp) * 0.012;
          const gravFrac = 0.25 * tPhase + 0.75 * tPhase * tPhase;
          const pAlt = springAlt - gravFrac * springAlt;
          const pWy = -12.58 + gravFrac * 0.76;
          const pt = mPt(pWx, pWy, pAlt);
          const pSize = (0.8 + (fp % 3) * 0.32) * zMtn;
          const pAlpha = 0.65 + Math.sin(tPhase * Math.PI) * 0.35;

          ctx.fillStyle =
            fp % 3 === 0
              ? `rgba(255, 255, 255, ${pAlpha.toFixed(2)})`
              : fp % 2 === 0
              ? `rgba(224, 242, 254, ${pAlpha.toFixed(2)})`
              : `rgba(125, 211, 252, ${pAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pSize, 0, Math.PI * 2);
          ctx.fill();
        }

        // WATERFALL PARTICLE SYSTEM — LAYER B: 10 Mid-Slope Rock Step Bounce Particles (alt = 42)
        for (let mp = 0; mp < 10; mp++) {
          const mPhase = (elapsed * 2.25 + mp * 0.21) % 1.0;
          const originWx = mwfX0 + ((mp * 0.07) % (mwfX1 - mwfX0));
          const vx = ((mp % 5) - 2) * 0.05;
          const pWx = originWx + vx * mPhase;
          const pWy = -12.22 + mPhase * 0.12;
          const bounceAlt = midLedgeAlt + (11 * mPhase - 17 * mPhase * mPhase);
          const bPt = mPt(pWx, pWy, bounceAlt);
          const bAlpha = (1 - mPhase) * 0.88;
          ctx.fillStyle = `rgba(255, 255, 255, ${bAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(bPt.x, bPt.y, (0.85 + (1 - mPhase) * 0.65) * zMtn, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Natural Mossy Woodland Boulders scattered in Hutan Belantara Valley
      const forestBoulders = [
        { wx: -6.5, wy: -10.6, sz: 1.0 },
        { wx: -3.8, wy: -9.6, sz: 0.85 },
        { wx: -2.2, wy: -11.4, sz: 1.05 },
        { wx: 0.85, wy: -9.6, sz: 0.9 },
      ];
      for (const rk of forestBoulders) {
        const rPt = mPt(rk.wx, rk.wy, 0);
        const rSz = rk.sz * zMtn;
        ctx.fillStyle = isNight ? '#334155' : '#64748b';
        ctx.beginPath();
        ctx.ellipse(rPt.x, rPt.y, 6.5 * rSz, 3.6 * rSz, -0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isNight ? '#065f46' : '#15803d';
        ctx.beginPath();
        ctx.ellipse(rPt.x - 1.2 * rSz, rPt.y - 1.1 * rSz, 4.2 * rSz, 1.8 * rSz, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // ---------------------------------------------------------
      // 2C. DANAU PUSAT SUNGAI MENGALIR YANG RAPIH & SUNGAI PANJANG DI UJUNG TIMUR PETA
      //     (Danau Pusat: wx 2.05..7.18, wy -11.92..-8.85 -> Mengalir mulus ke Sungai Utama wx 6.94..8.16)
      // ---------------------------------------------------------
      ctx.save();
      const zRiv = zoomLevelRef.current;
      const rivW0 = 6.94;
      const rivW1 = 8.16;
      const rivYStart = -11.15; // Seamless outlet from Danau Pusat Sungai Mengalir
      const rivYEnd = edgeLim;

      // Smooth 12-vertex architectural-natural shoreline for Danau Pusat Sungai Mengalir
      const lakeCenterWx = 4.62;
      const lakeCenterWy = -10.42;
      const lakeVertices = [
        { wx: 2.55, wy: -11.82 },
        { wx: 3.85, wy: -11.95 },
        { wx: 5.35, wy: -11.92 },
        { wx: 6.65, wy: -11.72 },
        { wx: 7.28, wy: -11.25 },
        { wx: 7.32, wy: -9.55 },
        { wx: 6.45, wy: -8.92 },
        { wx: 5.05, wy: -8.82 },
        { wx: 3.55, wy: -8.86 },
        { wx: 2.32, wy: -9.18 },
        { wx: 1.98, wy: -9.85 },
        { wx: 2.02, wy: -11.12 },
      ];

      // 0A) Outer Lush Mossy Turf & Pebble Margin around Danau Pusat
      ctx.fillStyle = isNight ? '#064e3b' : '#15803d';
      ctx.beginPath();
      lakeVertices.forEach((v, idx) => {
        const dx = v.wx - lakeCenterWx;
        const dy = v.wy - lakeCenterWy;
        const p = toScreen(lakeCenterWx + dx * 1.11, lakeCenterWy + dy * 1.12, 0, camera.x, camera.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();

      // 0B) Clean Architectural Cut-Stone Coping Rim around Danau Pusat & Riverbanks
      ctx.fillStyle = isNight ? '#334155' : '#cbd5e1';
      ctx.beginPath();
      lakeVertices.forEach((v, idx) => {
        const dx = v.wx - lakeCenterWx;
        const dy = v.wy - lakeCenterWy;
        const p = toScreen(lakeCenterWx + dx * 1.055, lakeCenterWy + dy * 1.065, 0, camera.x, camera.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isNight ? '#475569' : '#94a3b8';
      ctx.lineWidth = 0.9 * zRiv;
      ctx.stroke();

      // 1) Stone & Pebble Riverbank Coping (Tepi Batu Sungai Utama dari Danau Pusat ke Air Terjun Selatan)
      const bankNW = toScreen(rivW0 - 0.14, rivYStart, 0, camera.x, camera.y);
      const bankNE = toScreen(rivW1 + 0.14, rivYStart, 0, camera.x, camera.y);
      const bankSE = toScreen(rivW1 + 0.14, rivYEnd, 0, camera.x, camera.y);
      const bankSW = toScreen(rivW0 - 0.14, rivYEnd, 0, camera.x, camera.y);

      ctx.fillStyle = isNight ? '#334155' : '#cbd5e1';
      ctx.beginPath();
      ctx.moveTo(bankNW.x, bankNW.y);
      ctx.lineTo(bankNE.x, bankNE.y);
      ctx.lineTo(bankSE.x, bankSE.y);
      ctx.lineTo(bankSW.x, bankSW.y);
      ctx.closePath();
      ctx.fill();

      // Recessed inner stone basin wall for Danau Pusat & Riverbed
      ctx.fillStyle = isNight ? '#0f172a' : '#475569';
      ctx.beginPath();
      lakeVertices.forEach((v, idx) => {
        const p = toScreen(v.wx, v.wy, 0, camera.x, camera.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();

      const bedNW = toScreen(rivW0, rivYStart, 0, camera.x, camera.y);
      const bedNE = toScreen(rivW1, rivYStart, 0, camera.x, camera.y);
      const bedSE = toScreen(rivW1, rivYEnd, 0, camera.x, camera.y);
      const bedSW = toScreen(rivW0, rivYEnd, 0, camera.x, camera.y);

      ctx.fillStyle = isNight ? '#0f172a' : '#475569';
      ctx.beginPath();
      ctx.moveTo(bedNW.x, bedNW.y);
      ctx.lineTo(bedNE.x, bedNE.y);
      ctx.lineTo(bedSE.x, bedSE.y);
      ctx.lineTo(bedSW.x, bedSW.y);
      ctx.closePath();
      ctx.fill();

      // 2) Flowing River Water Channel & Seamless Danau Pusat Water Surface
      const rivNW = toScreen(rivW0 + 0.04, rivYStart, -1.5, camera.x, camera.y);
      const rivNE = toScreen(rivW1 - 0.04, rivYStart, -1.5, camera.x, camera.y);
      const rivSE = toScreen(rivW1 - 0.04, rivYEnd, -1.5, camera.x, camera.y);
      const rivSW = toScreen(rivW0 + 0.04, rivYEnd, -1.5, camera.x, camera.y);

      const rivGrad = ctx.createLinearGradient(rivNW.x, rivNW.y, rivSE.x, rivSE.y);
      rivGrad.addColorStop(0, isNight ? '#0369a1' : '#0284c7');
      rivGrad.addColorStop(0.45, isNight ? '#0284c7' : '#0ea5e9');
      rivGrad.addColorStop(0.85, isNight ? '#0ea5e9' : '#38bdf8');
      rivGrad.addColorStop(1, isNight ? '#38bdf8' : '#7dd3fc');

      ctx.fillStyle = rivGrad;
      ctx.beginPath();
      ctx.moveTo(rivNW.x, rivNW.y);
      ctx.lineTo(rivNE.x, rivNE.y);
      ctx.lineTo(rivSE.x, rivSE.y);
      ctx.lineTo(rivSW.x, rivSW.y);
      ctx.closePath();
      ctx.fill();

      // Fill Danau Pusat Water Surface (Deep Emerald-Teal to Crystal Cyan Gradient merging seamlessly into the River)
      const lkNW = toScreen(2.1, -11.9, -1.5, camera.x, camera.y);
      const lkSE = toScreen(7.3, -8.9, -1.5, camera.x, camera.y);
      const lakeWaterGrad = ctx.createLinearGradient(lkNW.x, lkNW.y, lkSE.x, lkSE.y);
      lakeWaterGrad.addColorStop(0, isNight ? '#0f766e' : '#0d9488');
      lakeWaterGrad.addColorStop(0.45, isNight ? '#0369a1' : '#0284c7');
      lakeWaterGrad.addColorStop(1, isNight ? '#0284c7' : '#0ea5e9');

      ctx.fillStyle = lakeWaterGrad;
      ctx.beginPath();
      lakeVertices.forEach((v, idx) => {
        const dx = v.wx - lakeCenterWx;
        const dy = v.wy - lakeCenterWy;
        const p = toScreen(lakeCenterWx + dx * 0.965, lakeCenterWy + dy * 0.965, -1.5, camera.x, camera.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.fill();

      // Subtle inner shallow-water turquoise glow ring inside Danau Pusat
      ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.22)' : 'rgba(186, 230, 253, 0.42)';
      ctx.lineWidth = 1.4 * zRiv;
      ctx.beginPath();
      lakeVertices.forEach((v, idx) => {
        const dx = v.wx - lakeCenterWx;
        const dy = v.wy - lakeCenterWy;
        const p = toScreen(lakeCenterWx + dx * 0.91, lakeCenterWy + dy * 0.91, -1.5, camera.x, camera.y);
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.closePath();
      ctx.stroke();

      // Seamless Water Outlet Channel connecting Danau Pusat East Basin into the River Headwaters
      const outNW = toScreen(6.55, -11.35, -1.5, camera.x, camera.y);
      const outNE = toScreen(rivW1 - 0.04, -11.15, -1.5, camera.x, camera.y);
      const outSE = toScreen(rivW1 - 0.04, -9.45, -1.5, camera.x, camera.y);
      const outSW = toScreen(6.45, -9.45, -1.5, camera.x, camera.y);
      ctx.fillStyle = isNight ? '#0369a1' : '#0284c7';
      ctx.beginPath();
      ctx.moveTo(outNW.x, outNW.y);
      ctx.lineTo(outNE.x, outNE.y);
      ctx.lineTo(outSE.x, outSE.y);
      ctx.lineTo(outSW.x, outSW.y);
      ctx.closePath();
      ctx.fill();

      // WATERFALL PARTICLE SYSTEM — LAYER C: BASE PLUNGE POOL WATER SPLASH (EFEK PERCIKAN AIR ALAMI DI KAKI GUNUNG / DANAU PUSAT)
      {
        const splashCenterWx = 4.71;
        const splashCenterWy = -11.74;
        const plungePt = toScreen(splashCenterWx, splashCenterWy, -1.2, camera.x, camera.y);

        // 1) Compact Lower Stream Chute & Natural Mossy Shoreline Boulders uniting the Mountain Foot with Danau Pusat
        const chuteTopL = toScreen(4.55, -11.96, 14, camera.x, camera.y);
        const chuteTopR = toScreen(4.87, -11.96, 14, camera.x, camera.y);
        const chuteBotL = toScreen(4.52, splashCenterWy, -1.0, camera.x, camera.y);
        const chuteBotR = toScreen(4.90, splashCenterWy, -1.0, camera.x, camera.y);

        // Natural mossy rocks flanking the waterfall entry into the lake
        const leftShoreRock = toScreen(4.46, -11.80, 0, camera.x, camera.y);
        const rightShoreRock = toScreen(4.96, -11.80, 0, camera.x, camera.y);
        ctx.fillStyle = isNight ? '#334155' : '#64748b';
        ctx.beginPath();
        ctx.ellipse(leftShoreRock.x, leftShoreRock.y, 4.5 * zRiv, 2.5 * zRiv, -0.15, 0, Math.PI * 2);
        ctx.ellipse(rightShoreRock.x, rightShoreRock.y, 4.8 * zRiv, 2.6 * zRiv, 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = isNight ? '#14532d' : '#16a34a';
        ctx.beginPath();
        ctx.ellipse(leftShoreRock.x, leftShoreRock.y - 1.0 * zRiv, 3.2 * zRiv, 1.4 * zRiv, -0.15, 0, Math.PI * 2);
        ctx.ellipse(rightShoreRock.x, rightShoreRock.y - 1.0 * zRiv, 3.4 * zRiv, 1.5 * zRiv, 0.15, 0, Math.PI * 2);
        ctx.fill();

        const chuteGrad = ctx.createLinearGradient(chuteTopL.x, chuteTopL.y, chuteBotL.x, chuteBotL.y);
        chuteGrad.addColorStop(0, 'rgba(56, 189, 248, 0.90)');
        chuteGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.95)');
        chuteGrad.addColorStop(1, 'rgba(255, 255, 255, 0.98)');
        ctx.fillStyle = chuteGrad;
        ctx.beginPath();
        ctx.moveTo(chuteTopL.x, chuteTopL.y);
        ctx.lineTo(chuteTopR.x, chuteTopR.y);
        ctx.lineTo(chuteBotR.x, chuteBotR.y);
        ctx.lineTo(chuteBotL.x, chuteBotL.y);
        ctx.closePath();
        ctx.fill();

        // 2) 4 Expanding Concentric Water Splash Impact Rings on the Plunge Pool Surface
        for (let rp = 0; rp < 4; rp++) {
          const rPhase = (elapsed * 0.92 + rp * 0.25) % 1.0;
          const rRx = (4.2 + rPhase * 16.5) * zRiv;
          const rRy = (2.0 + rPhase * 7.8) * zRiv;
          ctx.strokeStyle = `rgba(240, 249, 255, ${((1 - rPhase) * 0.78).toFixed(2)})`;
          ctx.lineWidth = (1.15 - rPhase * 0.4) * zRiv;
          ctx.beginPath();
          ctx.ellipse(plungePt.x, plungePt.y, rRx, rRy, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // 3) Turbulent White Foam Core & Natural Splash Crown at the Waterfall Impact Zone
        const foamPulse = 0.92 + Math.sin(elapsed * 8.0) * 0.10;
        const foamGrad = ctx.createRadialGradient(
          plungePt.x,
          plungePt.y,
          1.2 * zRiv,
          plungePt.x,
          plungePt.y,
          11.5 * foamPulse * zRiv
        );
        foamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        foamGrad.addColorStop(0.55, 'rgba(224, 242, 254, 0.85)');
        foamGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
        ctx.fillStyle = foamGrad;
        ctx.beginPath();
        ctx.ellipse(plungePt.x, plungePt.y, 11.5 * foamPulse * zRiv, 5.2 * foamPulse * zRiv, 0, 0, Math.PI * 2);
        ctx.fill();

        // 5 Animated Splash Crown Jets (Percikan Mahkota Air) leaping upward at the plunge line
        for (let cj = 0; cj < 5; cj++) {
          const jPhase = (elapsed * 3.4 + cj * 0.29) % 1.0;
          const jWx = 4.55 + (cj / 4) * 0.32 + Math.sin(elapsed * 4 + cj) * 0.015;
          const jLift = Math.sin(jPhase * Math.PI) * (6.5 + (cj % 3) * 2.5);
          const jBase = toScreen(jWx, splashCenterWy - 0.02, -0.5, camera.x, camera.y);
          const jTip = toScreen(jWx + ((cj % 3) - 1) * 0.035 * jPhase, splashCenterWy + 0.04 * jPhase, jLift, camera.x, camera.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${((1 - jPhase * 0.5) * 0.90).toFixed(2)})`;
          ctx.lineWidth = 1.45 * zRiv;
          ctx.beginPath();
          ctx.moveTo(jBase.x, jBase.y);
          ctx.lineTo(jTip.x, jTip.y);
          ctx.stroke();
        }

        // 4) 22 Parabolic Water Splash Droplet Particles (Efek Percikan Air) bursting radially in 3D arcs
        for (let sd = 0; sd < 22; sd++) {
          const sSpeed = 1.65 + (sd % 5) * 0.26;
          const sPhase = (elapsed * sSpeed + sd * 0.143) % 1.0;
          const angle = -0.12 * Math.PI + (sd / 21) * 1.24 * Math.PI;
          const maxReach = 0.16 + (sd % 4) * 0.08;
          const dWx = splashCenterWx + Math.cos(angle) * maxReach * sPhase;
          const dWy = splashCenterWy + Math.sin(angle) * maxReach * 0.65 * sPhase;
          const peakH = 8 + (sd % 4) * 4.0;
          const dAlt = -0.5 + 4.0 * sPhase * (1.0 - sPhase) * peakH;
          const dPt = toScreen(dWx, dWy, dAlt, camera.x, camera.y);
          const dAlpha = Math.sin(sPhase * Math.PI) * 0.95;
          const dRadius = (0.8 + (1.0 - sPhase) * 0.95) * zRiv;

          ctx.fillStyle =
            sd % 3 === 0
              ? `rgba(255, 255, 255, ${dAlpha.toFixed(2)})`
              : sd % 2 === 0
              ? `rgba(224, 242, 254, ${dAlpha.toFixed(2)})`
              : `rgba(125, 211, 252, ${dAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(dPt.x, dPt.y, dRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // 5) 4 Gentle Micro-Spray Mist Clouds above the Water Splash Zone
        for (let mp = 0; mp < 4; mp++) {
          const mPhase = (elapsed * 0.68 + mp * 0.25) % 1.0;
          const mistPt = toScreen(
            4.58 + (mp % 3) * 0.13 + Math.sin(elapsed * 1.6 + mp) * 0.05,
            splashCenterWy + mPhase * 0.12,
            2 + mPhase * 16,
            camera.x,
            camera.y
          );
          const mAlpha = Math.sin(mPhase * Math.PI) * (isNight ? 0.34 : 0.46);
          const mRx = (5.5 + mPhase * 8.5) * zRiv;
          const mRy = (3.2 + mPhase * 4.8) * zRiv;
          const mGrad = ctx.createRadialGradient(mistPt.x, mistPt.y, 1.0 * zRiv, mistPt.x, mistPt.y, mRx);
          mGrad.addColorStop(0, `rgba(255, 255, 255, ${mAlpha.toFixed(3)})`);
          mGrad.addColorStop(0.65, `rgba(224, 242, 254, ${(mAlpha * 0.55).toFixed(3)})`);
          mGrad.addColorStop(1, 'rgba(224, 242, 254, 0)');
          ctx.fillStyle = mGrad;
          ctx.beginPath();
          ctx.ellipse(mistPt.x, mistPt.y, mRx, mRy, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Lotus Lily Pads & Floating Water Lilies on Danau Pusat
      const lakeLilyPads = [
        { wx: 2.95, wy: -11.25, r: 4.0, hasFlower: true },
        { wx: 3.55, wy: -11.45, r: 3.3, hasFlower: false },
        { wx: 5.75, wy: -11.35, r: 3.9, hasFlower: true },
        { wx: 3.35, wy: -9.35, r: 4.2, hasFlower: true },
        { wx: 4.95, wy: -9.28, r: 3.5, hasFlower: false },
        { wx: 6.05, wy: -9.45, r: 3.7, hasFlower: false },
      ];
      for (const lp of lakeLilyPads) {
        const lPt = toScreen(lp.wx, lp.wy, -1.2, camera.x, camera.y);
        ctx.fillStyle = isNight ? '#065f46' : '#16a34a';
        ctx.beginPath();
        ctx.ellipse(lPt.x, lPt.y, lp.r * zRiv, lp.r * 0.52 * zRiv, 0.2, 0.25, Math.PI * 1.9);
        ctx.fill();
        if (lp.hasFlower) {
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.arc(lPt.x, lPt.y - 1.0 * zRiv, 1.8 * zRiv, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(lPt.x, lPt.y - 1.0 * zRiv, 0.75 * zRiv, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Animated surface current lines curving from Danau Pusat center toward the eastern River Headwaters
      for (let lc = 0; lc < 8; lc++) {
        const cProg = (elapsed * 0.75 + lc * 0.125) % 1.0;
        const cWx = 3.25 + cProg * 3.85;
        const cWy = -10.75 + Math.sin(lc * 1.1) * 0.58 + cProg * 0.42;
        const cPt0 = toScreen(cWx, cWy, -1.2, camera.x, camera.y);
        const cPt1 = toScreen(cWx + 0.40, cWy + 0.08, -1.2, camera.x, camera.y);
        ctx.strokeStyle = `rgba(224, 242, 254, ${(Math.sin(cProg * Math.PI) * 0.52).toFixed(2)})`;
        ctx.lineWidth = 1.1 * zRiv;
        ctx.beginPath();
        ctx.moveTo(cPt0.x, cPt0.y);
        ctx.lineTo(cPt1.x, cPt1.y);
        ctx.stroke();
      }

      // 3B) Upstream Sacred Water Channel Connecting Awal Aliran Sungai to Masjid Al-Hikmah Ablution Pavilion [5.45, -4.85]
      const wudhuInNW = toScreen(6.22, -5.15, -1.0, camera.x, camera.y);
      const wudhuInNE = toScreen(rivW0 + 0.08, -5.15, -1.0, camera.x, camera.y);
      const wudhuInSE = toScreen(rivW0 + 0.08, -4.62, -1.0, camera.x, camera.y);
      const wudhuInSW = toScreen(6.22, -4.62, -1.0, camera.x, camera.y);
      ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
      ctx.beginPath();
      ctx.moveTo(wudhuInNW.x, wudhuInNW.y);
      ctx.lineTo(wudhuInNE.x, wudhuInNE.y);
      ctx.lineTo(wudhuInSE.x, wudhuInSE.y);
      ctx.lineTo(wudhuInSW.x, wudhuInSW.y);
      ctx.closePath();
      ctx.fill();

      // 4) Animated Flowing Water Currents (Arus Air Mengalir dari Danau Pusat wy=-11.15 ke Hilir Air Terjun wy=+8.5)
      const rivTotalLen = rivYEnd - rivYStart;
      ctx.lineCap = 'round';
      for (let st = 0; st < 30; st++) {
        const laneFrac = 0.14 + ((st * 37) % 72) / 100; // across width of river
        const laneWx = rivW0 + 0.08 + laneFrac * (rivW1 - rivW0 - 0.16);
        const speed = 1.9 + (st % 3) * 0.45;
        const streamLen = 0.75 + (st % 3) * 0.35;
        const rawWy = rivYStart + ((st * 0.68 + elapsed * speed) % (rivTotalLen - streamLen));
        const sPt0 = toScreen(laneWx, rawWy, -1.2, camera.x, camera.y);
        const sPt1 = toScreen(laneWx, Math.min(edgeLim - 0.05, rawWy + streamLen), -1.2, camera.x, camera.y);

        ctx.strokeStyle =
          st % 3 === 0
            ? 'rgba(255, 255, 255, 0.55)'
            : st % 2 === 0
            ? 'rgba(186, 230, 253, 0.45)'
            : 'rgba(125, 211, 252, 0.38)';
        ctx.lineWidth = (st % 3 === 0 ? 1.5 : 1.0) * zRiv;
        ctx.beginPath();
        ctx.moveTo(sPt0.x, sPt0.y);
        ctx.lineTo(sPt1.x, sPt1.y);
        ctx.stroke();
      }

      // 5) Natural River Stones & Mossy Pebbles along Both Riverbanks
      for (let rb = 0; rb <= 18; rb++) {
        const rWy = -9.0 + rb * 0.95;
        if (Math.abs(rWy) < 0.65) continue; // keep bridge clear
        const leftRockPt = toScreen(rivW0 - 0.08, rWy, 0, camera.x, camera.y);
        const rightRockPt = toScreen(rivW1 + 0.08, rWy + 0.35, 0, camera.x, camera.y);

        ctx.fillStyle = rb % 2 === 0 ? (isNight ? '#475569' : '#64748b') : (isNight ? '#334155' : '#94a3b8');
        if (rWy > -8.6) {
          ctx.beginPath();
          ctx.ellipse(leftRockPt.x, leftRockPt.y, 4.2 * zRiv, 2.2 * zRiv, 0.2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.ellipse(rightRockPt.x, rightRockPt.y, 3.8 * zRiv, 2.0 * zRiv, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 5A) IKAN DI SUNGAI (Animated Freshwater River Fish Swimming Along the River Course)
      const riverFishDefs = [
        { baseWx: 7.30, baseWy: -7.5, size: 1.05, speed: 1.1, hue: 'silver' },
        { baseWx: 7.55, baseWy: -5.2, size: 0.90, speed: 0.9, hue: 'gold' },
        { baseWx: 7.25, baseWy: -2.8, size: 1.15, speed: 1.2, hue: 'silver' },
        { baseWx: 7.60, baseWy: 1.1, size: 0.85, speed: 1.0, hue: 'cyan' },
        { baseWx: 7.35, baseWy: 2.9, size: 1.10, speed: 1.3, hue: 'silver' },
        { baseWx: 7.50, baseWy: 4.8, size: 0.95, speed: 0.95, hue: 'gold' },
        { baseWx: 7.28, baseWy: 6.2, size: 1.00, speed: 1.15, hue: 'cyan' },
      ];

      riverFishDefs.forEach((fish, fIdx) => {
        const driftY = Math.sin(elapsed * fish.speed + fIdx * 1.7) * 0.55;
        const driftX = Math.cos(elapsed * fish.speed * 1.3 + fIdx * 2.1) * 0.14;
        const fWx = fish.baseWx + driftX;
        const fWy = fish.baseWy + driftY;
        const fScreen = toScreen(fWx, fWy, -1.0, camera.x, camera.y);
        const z = zRiv * fish.size;
        const tailWag = Math.sin(elapsed * 9.8 + fIdx * 2.3) * 0.45;

        ctx.save();
        ctx.translate(fScreen.x, fScreen.y);

        // Water ripple halo over fish
        ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.28)';
        ctx.lineWidth = 0.7 * z;
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.2 * z, 1.8 * z, -0.4, 0, Math.PI * 2);
        ctx.stroke();

        // Fish shadow under water
        ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.35)' : 'rgba(30, 58, 138, 0.22)';
        ctx.beginPath();
        ctx.ellipse(0.6 * z, 1.2 * z, 3.4 * z, 1.2 * z, -0.38, 0, Math.PI * 2);
        ctx.fill();

        // Fish body
        ctx.rotate(-0.4); // aligned with river corridor
        const fishGrad = ctx.createLinearGradient(-3.5 * z, 0, 3.5 * z, 0);
        if (fish.hue === 'gold') {
          fishGrad.addColorStop(0, '#f59e0b');
          fishGrad.addColorStop(0.5, '#fde047');
          fishGrad.addColorStop(1, '#d97706');
        } else if (fish.hue === 'cyan') {
          fishGrad.addColorStop(0, '#06b6d4');
          fishGrad.addColorStop(0.5, '#67e8f9');
          fishGrad.addColorStop(1, '#0284c7');
        } else {
          fishGrad.addColorStop(0, '#94a3b8');
          fishGrad.addColorStop(0.5, '#f1f5f9');
          fishGrad.addColorStop(1, '#cbd5e1');
        }

        ctx.fillStyle = fishGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.8 * z, 1.35 * z, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wagging caudal fin (tail)
        ctx.save();
        ctx.translate(3.5 * z, 0);
        ctx.rotate(tailWag);
        ctx.fillStyle = fish.hue === 'gold' ? '#fbbf24' : fish.hue === 'cyan' ? '#38bdf8' : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(2.2 * z, -1.3 * z);
        ctx.lineTo(1.6 * z, 0);
        ctx.lineTo(2.2 * z, 1.3 * z);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Tiny eye dot & scale glint
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-2.4 * z, -0.3 * z, 0.45 * z, 0, Math.PI * 2);
        ctx.fill();

        const glint = Math.sin(elapsed * 4.5 + fIdx * 3.1);
        if (glint > 0.4) {
          ctx.fillStyle = `rgba(255, 255, 255, ${(glint * 0.75).toFixed(2)})`;
          ctx.beginPath();
          ctx.arc(-0.5 * z, -0.4 * z, 0.7 * z, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 5B) TERAS BATU ALAM SPOT DUDUK PINGGIRAN SUNGAI (Promenade Deck for 3 Benches / 6 People at wx: 6.08..6.76, wy: -3.28..-0.65)
      {
        const deckNW = toScreen(6.05, -3.28, 0, camera.x, camera.y);
        const deckNE = toScreen(6.76, -3.28, 0, camera.x, camera.y);
        const deckSE = toScreen(6.76, -0.65, 0, camera.x, camera.y);
        const deckSW = toScreen(6.05, -0.65, 0, camera.x, camera.y);

        // Warm cut-travertine riverside terrace pad
        ctx.fillStyle = isNight ? 'rgba(30, 41, 59, 0.85)' : 'rgba(226, 232, 240, 0.88)';
        ctx.beginPath();
        ctx.moveTo(deckNW.x, deckNW.y);
        ctx.lineTo(deckNE.x, deckNE.y);
        ctx.lineTo(deckSE.x, deckSE.y);
        ctx.lineTo(deckSW.x, deckSW.y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isNight ? '#475569' : '#94a3b8';
        ctx.lineWidth = 0.85 * zRiv;
        ctx.stroke();

        // Individual circular stone inlay pads beneath each of the 3 riverside benches
        RIVERSIDE_BENCHES.forEach((rbGroup) => {
          const padPt = toScreen(rbGroup.wx, rbGroup.wy, 0, camera.x, camera.y);
          ctx.fillStyle = isNight ? '#334155' : '#f1f5f9';
          ctx.beginPath();
          ctx.ellipse(padPt.x, padPt.y + 1 * zRiv, 17 * zRiv, 6.8 * zRiv, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = isNight ? '#38bdf8' : '#0284c7';
          ctx.lineWidth = 0.7 * zRiv;
          ctx.stroke();
        });

        // Low minimalist riverside timber & steel guardrail along the water's edge (wx = 6.74, wy = -3.18..-0.75)
        const railPostsWy = [-3.15, -2.40, -1.60, -0.78];
        const railPts = railPostsWy.map((rwy) => toScreen(6.74, rwy, 0, camera.x, camera.y));
        ctx.strokeStyle = isNight ? '#94a3b8' : '#cbd5e1';
        ctx.lineWidth = 1.15 * zRiv;
        ctx.beginPath();
        railPts.forEach((rp, idx) => {
          if (idx === 0) ctx.moveTo(rp.x, rp.y - 6.5 * zRiv);
          else ctx.lineTo(rp.x, rp.y - 6.5 * zRiv);
        });
        ctx.stroke();

        railPts.forEach((rp) => {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(rp.x - 1.1 * zRiv, rp.y - 7.5 * zRiv, 2.2 * zRiv, 7.5 * zRiv);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(rp.x - 1.1 * zRiv, rp.y - 8.2 * zRiv, 2.2 * zRiv, 0.9 * zRiv);
        });
      }

      // 5C) PEMBANGKIT LISTRIK TENAGA AIR KECIL (PLTA MIKRO) TERHUBUNG DANAU & MERCUSUAR DI SAMPING UJUNG GUNUNG TIMUR
      {
        // A. Saluran Sadap & Pintu Air Danau (Lake Water Intake Weir & Trash-Rack at [6.22, -11.68])
        const intakeNW = toScreen(6.02, -11.88, 0, camera.x, camera.y);
        const intakeNE = toScreen(6.52, -11.88, 0, camera.x, camera.y);
        const intakeSE = toScreen(6.52, -11.46, 0, camera.x, camera.y);
        const intakeSW = toScreen(6.02, -11.46, 0, camera.x, camera.y);

        // Glowing cyan intake water channel drawing water from Danau Pusat into the turbine
        ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(intakeNW.x, intakeNW.y);
        ctx.lineTo(intakeNE.x, intakeNE.y);
        ctx.lineTo(intakeSE.x, intakeSE.y);
        ctx.lineTo(intakeSW.x, intakeSW.y);
        ctx.closePath();
        ctx.fill();

        // Animated water intake suction lines entering the sluice gate from Danau Pusat
        for (let ik = 0; ik < 4; ik++) {
          const ikProg = (elapsed * 1.6 + ik * 0.25) % 1.0;
          const p0 = toScreen(5.65 + ikProg * 0.55, -11.72 + (ik - 1.5) * 0.08, -1.0, camera.x, camera.y);
          const p1 = toScreen(5.82 + ikProg * 0.55, -11.72 + (ik - 1.5) * 0.08, -1.0, camera.x, camera.y);
          ctx.strokeStyle = `rgba(224, 242, 254, ${((1 - ikProg) * 0.8).toFixed(2)})`;
          ctx.lineWidth = 1.0 * zRiv;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }

        // B. Twin Enlarged Pressurized Steel Penstock Pipes (Pipa Pesat Kembar Diperbesar) connecting Eastern Mountain Slope & Lake Intake to Powerhouse
        const penTop1 = toScreen(6.28, -12.52, 62, camera.x, camera.y);
        const penBot1 = toScreen(6.42, -11.90, 18, camera.x, camera.y);
        const penTop2 = toScreen(6.62, -12.52, 62, camera.x, camera.y);
        const penBot2 = toScreen(6.76, -11.90, 18, camera.x, camera.y);

        [
          [penTop1, penBot1],
          [penTop2, penBot2],
        ].forEach(([pTop, pBot]) => {
          // Pipe shadow
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.48)';
          ctx.lineWidth = 6.0 * zRiv;
          ctx.beginPath();
          ctx.moveTo(pTop.x + 1.5 * zRiv, pTop.y + 1.5 * zRiv);
          ctx.lineTo(pBot.x + 1.5 * zRiv, pBot.y + 1.5 * zRiv);
          ctx.stroke();

          // Industrial steel penstock body (Enlarged)
          ctx.strokeStyle = isNight ? '#475569' : '#64748b';
          ctx.lineWidth = 5.2 * zRiv;
          ctx.beginPath();
          ctx.moveTo(pTop.x, pTop.y);
          ctx.lineTo(pBot.x, pBot.y);
          ctx.stroke();

          // Specular highlight & animated hydro flow pulse along pipe
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.6 * zRiv;
          ctx.beginPath();
          ctx.moveTo(pTop.x - 0.8 * zRiv, pTop.y - 0.5 * zRiv);
          ctx.lineTo(pBot.x - 0.8 * zRiv, pBot.y - 0.5 * zRiv);
          ctx.stroke();
        });

        // C. Rumah Turbin Pembangkit Listrik (PLTA Danau Diperbesar + Kincir Air Raksasa di [6.52, -11.82])
        const phPt = toScreen(HYDRO_PLANT_COORDS.wx, HYDRO_PLANT_COORDS.wy, 0, camera.x, camera.y);

        // Enlarged Reinforced Concrete Foundation Pad over Lake Outlet
        ctx.fillStyle = isNight ? '#1e293b' : '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(phPt.x - 32 * zRiv, phPt.y - 3 * zRiv);
        ctx.lineTo(phPt.x + 3 * zRiv, phPt.y - 19 * zRiv);
        ctx.lineTo(phPt.x + 35 * zRiv, phPt.y - 3 * zRiv);
        ctx.lineTo(phPt.x, phPt.y + 14 * zRiv);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isNight ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 1.1 * zRiv;
        ctx.stroke();

        // Enlarged Left Isometric Wall (Facing Danau Pusat, houses the Giant Spinning Hydro Turbine Waterwheel)
        ctx.fillStyle = isNight ? '#334155' : '#e2e8f0';
        ctx.beginPath();
        ctx.moveTo(phPt.x - 28 * zRiv, phPt.y - 4.5 * zRiv);
        ctx.lineTo(phPt.x, phPt.y + 10 * zRiv);
        ctx.lineTo(phPt.x, phPt.y - 25 * zRiv);
        ctx.lineTo(phPt.x - 28 * zRiv, phPt.y - 39.5 * zRiv);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = isNight ? '#475569' : '#94a3b8';
        ctx.lineWidth = 1.0 * zRiv;
        ctx.stroke();

        // Enlarged Right Isometric Wall (Generator Hall with 2 Glowing Cyan Stator Windows)
        ctx.fillStyle = isNight ? '#1e293b' : '#cbd5e1';
        ctx.beginPath();
        ctx.moveTo(phPt.x, phPt.y + 10 * zRiv);
        ctx.lineTo(phPt.x + 29 * zRiv, phPt.y - 4.5 * zRiv);
        ctx.lineTo(phPt.x + 29 * zRiv, phPt.y - 39.5 * zRiv);
        ctx.lineTo(phPt.x, phPt.y - 25 * zRiv);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Enlarged Slanted Minimalist Solar-Slate Roof of Hydro Powerhouse
        ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
        ctx.beginPath();
        ctx.moveTo(phPt.x - 31 * zRiv, phPt.y - 39.5 * zRiv);
        ctx.lineTo(phPt.x + 1.5 * zRiv, phPt.y - 55 * zRiv);
        ctx.lineTo(phPt.x + 32 * zRiv, phPt.y - 39.5 * zRiv);
        ctx.lineTo(phPt.x, phPt.y - 23.5 * zRiv);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.2 * zRiv;
        ctx.stroke();

        // 2 Glowing Cyan-Emerald Generator Bay Windows on Right Wall
        ctx.fillStyle = isNight ? '#22d3ee' : '#0ea5e9';
        ctx.beginPath();
        ctx.moveTo(phPt.x + 4.5 * zRiv, phPt.y - 4 * zRiv);
        ctx.lineTo(phPt.x + 13.5 * zRiv, phPt.y - 8.5 * zRiv);
        ctx.lineTo(phPt.x + 13.5 * zRiv, phPt.y - 23.5 * zRiv);
        ctx.lineTo(phPt.x + 4.5 * zRiv, phPt.y - 19 * zRiv);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(phPt.x + 16.5 * zRiv, phPt.y - 10 * zRiv);
        ctx.lineTo(phPt.x + 25.5 * zRiv, phPt.y - 14.5 * zRiv);
        ctx.lineTo(phPt.x + 25.5 * zRiv, phPt.y - 29.5 * zRiv);
        ctx.lineTo(phPt.x + 16.5 * zRiv, phPt.y - 25 * zRiv);
        ctx.closePath();
        ctx.fill();

        // GIANT SPINNING HYDROELECTRIC WATERWHEEL / KINCIR AIR RAKSASA on the Left Lakeside Wall (Diperbesar ~2x!)
        const wheelCx = phPt.x - 16.5 * zRiv;
        const wheelCy = phPt.y - 6.5 * zRiv;
        const wheelR = 16.2 * zRiv;

        // Waterwheel splash halo
        const wheelHalo = ctx.createRadialGradient(wheelCx, wheelCy, wheelR * 0.25, wheelCx, wheelCy, wheelR * 1.32);
        wheelHalo.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        wheelHalo.addColorStop(0.65, 'rgba(224, 242, 254, 0.20)');
        wheelHalo.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = wheelHalo;
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, wheelR * 1.32, 0, Math.PI * 2);
        ctx.fill();

        // Dark turbine housing recess
        ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, wheelR + 1.8 * zRiv, 0, Math.PI * 2);
        ctx.fill();

        // Outer & Inner Heavy Rotating Steel & Brass Turbine Rims
        ctx.strokeStyle = isNight ? '#fbbf24' : '#d97706';
        ctx.lineWidth = 2.8 * zRiv;
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, wheelR, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.8 * zRiv;
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, wheelR * 0.66, 0, Math.PI * 2);
        ctx.stroke();

        // 12 Giant Hydro Spokes & Scooped Water Buckets (Kincir Air Raksasa Berputar)
        const numPaddles = 12;
        for (let wb = 0; wb < numPaddles; wb++) {
          const wAng = elapsed * 3.2 + (wb * Math.PI) / (numPaddles / 2);
          const bx = wheelCx + Math.cos(wAng) * wheelR;
          const by = wheelCy + Math.sin(wAng) * wheelR;
          const bOuterX = wheelCx + Math.cos(wAng) * (wheelR + 3.0 * zRiv);
          const bOuterY = wheelCy + Math.sin(wAng) * (wheelR + 3.0 * zRiv);

          ctx.strokeStyle = wb % 2 === 0 ? '#e0f2fe' : '#38bdf8';
          ctx.lineWidth = 1.7 * zRiv;
          ctx.beginPath();
          ctx.moveTo(wheelCx, wheelCy);
          ctx.lineTo(bOuterX, bOuterY);
          ctx.stroke();

          // Scooped water bucket paddle at rim
          const tangX = -Math.sin(wAng) * 3.5 * zRiv;
          const tangY = Math.cos(wAng) * 3.5 * zRiv;
          ctx.fillStyle = wb % 2 === 0 ? '#f59e0b' : '#0284c7';
          ctx.beginPath();
          ctx.moveTo(bx - tangX * 0.45, by - tangY * 0.45);
          ctx.lineTo(bOuterX + tangX * 0.55, bOuterY + tangY * 0.55);
          ctx.lineTo(bOuterX - tangX * 0.4, bOuterY - tangY * 0.4);
          ctx.closePath();
          ctx.fill();

          // Splashing water droplets flung from lower buckets
          if (Math.sin(wAng) > 0.15) {
            ctx.fillStyle = 'rgba(224, 242, 254, 0.88)';
            ctx.beginPath();
            ctx.arc(bOuterX + tangX * 0.35, bOuterY + 1.8 * zRiv, 1.85 * zRiv, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Center dynamo hub (Enlarged)
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, 4.6 * zRiv, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, 3.0 * zRiv, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(wheelCx, wheelCy, 1.3 * zRiv, 0, Math.PI * 2);
        ctx.fill();

        // Churning White-Aqua Tailrace Foam where the Giant Hydro Turbine discharges into Danau Pusat & River Headwaters
        for (let tf = 0; tf < 6; tf++) {
          const tfPhase = (elapsed * 2.2 + tf * 0.17) % 1.0;
          const fx = wheelCx - 3 * zRiv + (tf - 2.5) * 4.5 * zRiv;
          const fy = wheelCy + wheelR - 1.5 * zRiv + tfPhase * 7.5 * zRiv;
          ctx.fillStyle = `rgba(224, 242, 254, ${((1 - tfPhase) * 0.88).toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(fx, fy, (3.2 + tfPhase * 4.8) * zRiv, (1.8 + tfPhase * 2.4) * zRiv, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Enlarged Rooftop Step-Up Transformer Bushings & Glowing Electric Sparkle Indicator
        ctx.fillStyle = '#475569';
        ctx.fillRect(phPt.x - 4.5 * zRiv, phPt.y - 49 * zRiv, 9 * zRiv, 7 * zRiv);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.4 * zRiv;
        ctx.beginPath();
        ctx.moveTo(phPt.x - 2.4 * zRiv, phPt.y - 49 * zRiv);
        ctx.lineTo(phPt.x - 2.4 * zRiv, phPt.y - 57 * zRiv);
        ctx.moveTo(phPt.x + 2.4 * zRiv, phPt.y - 49 * zRiv);
        ctx.lineTo(phPt.x + 2.4 * zRiv, phPt.y - 57 * zRiv);
        ctx.stroke();

        const pulseAlpha = 0.55 + Math.sin(elapsed * 6) * 0.35;
        ctx.fillStyle = `rgba(56, 189, 248, ${pulseAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(phPt.x - 2.4 * zRiv, phPt.y - 57.5 * zRiv, 2.0 * zRiv, 0, Math.PI * 2);
        ctx.arc(phPt.x + 2.4 * zRiv, phPt.y - 57.5 * zRiv, 2.0 * zRiv, 0, Math.PI * 2);
        ctx.fill();

        // "PLTA DANAU" Signboard on Enlarged Powerhouse Roof Parapet
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(phPt.x - 17 * zRiv, phPt.y - 36 * zRiv, 34 * zRiv, 8.2 * zRiv, 2.0 * zRiv);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 0.85 * zRiv;
        ctx.stroke();
        ctx.fillStyle = '#7dd3fc';
        ctx.font = `bold ${Math.max(4, Math.round(4.6 * zRiv))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡ PLTA DANAU', phPt.x, phPt.y - 31.9 * zRiv);

        // D. MERCUSUAR DIPERBESAR DI UJUNG GUNUNG TIMUR ([7.58, -11.48] connected via Power Cable)
        //    Sorot lampu mercusuar menjangkau sampai ke Masjid Al-Hikmah [5.45, -4.85] dengan lembut tanpa mengganggu maps!
        const lhPt = toScreen(LIGHTHOUSE_COORDS.wx, LIGHTHOUSE_COORDS.wy, 0, camera.x, camera.y);

        // Overhead Insulated Power Cable connecting PLTA Transformer to the Enlarged Lighthouse
        ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.65)' : 'rgba(71, 85, 105, 0.72)';
        ctx.lineWidth = 1.3 * zRiv;
        ctx.beginPath();
        ctx.moveTo(phPt.x + 2.4 * zRiv, phPt.y - 57 * zRiv);
        ctx.quadraticCurveTo(
          (phPt.x + lhPt.x) * 0.5,
          Math.min(phPt.y, lhPt.y) - 42 * zRiv,
          lhPt.x - 10 * zRiv,
          lhPt.y - 38 * zRiv
        );
        ctx.stroke();

        // Enlarged Two-Tier Octagonal Cut-Stone Promontory Foundation Pier at the Eastern Mountain End
        ctx.fillStyle = isNight ? '#0f172a' : '#334155';
        ctx.beginPath();
        ctx.ellipse(lhPt.x, lhPt.y + 5.0 * zRiv, 31.0 * zRiv, 15.0 * zRiv, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isNight ? '#1e293b' : '#475569';
        ctx.beginPath();
        ctx.ellipse(lhPt.x, lhPt.y + 2.4 * zRiv, 27.5 * zRiv, 13.0 * zRiv, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = isNight ? '#334155' : '#94a3b8';
        ctx.beginPath();
        ctx.ellipse(lhPt.x, lhPt.y - 1.0 * zRiv, 24.5 * zRiv, 11.4 * zRiv, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = isNight ? '#64748b' : '#e2e8f0';
        ctx.lineWidth = 1.3 * zRiv;
        ctx.stroke();

        // Grand Tapered Cylindrical Lighthouse Tower (6 Alternating Red & White Bands — Enlarged Further!)
        const towerH = 118 * zRiv;
        const baseW = 31.0 * zRiv;
        const topW = 18.8 * zRiv;
        const stripeCount = 6;
        for (let st = 0; st < stripeCount; st++) {
          const f0 = st / stripeCount;
          const f1 = (st + 1) / stripeCount;
          const y0 = lhPt.y - f0 * towerH;
          const y1 = lhPt.y - f1 * towerH;
          const w0 = (baseW + (topW - baseW) * f0) * 0.5;
          const w1 = (baseW + (topW - baseW) * f1) * 0.5;
          const isRed = st % 2 === 0;

          // Main sunlit cylindrical body
          ctx.fillStyle = isRed
            ? isNight ? '#b91c1c' : '#dc2626'
            : isNight ? '#cbd5e1' : '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(lhPt.x - w0, y0);
          ctx.lineTo(lhPt.x + w0, y0);
          ctx.lineTo(lhPt.x + w1, y1);
          ctx.lineTo(lhPt.x - w1, y1);
          ctx.closePath();
          ctx.fill();

          // Left-side specular highlight band for 3D cylindrical volume
          ctx.fillStyle = isRed
            ? 'rgba(254, 202, 202, 0.22)'
            : 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.moveTo(lhPt.x - w0 * 0.72, y0);
          ctx.lineTo(lhPt.x - w0 * 0.28, y0);
          ctx.lineTo(lhPt.x - w1 * 0.28, y1);
          ctx.lineTo(lhPt.x - w1 * 0.72, y1);
          ctx.closePath();
          ctx.fill();

          // Right-side cylindrical 3D shadow band
          ctx.fillStyle = isRed
            ? 'rgba(69, 10, 10, 0.30)'
            : 'rgba(15, 23, 42, 0.20)';
          ctx.beginPath();
          ctx.moveTo(lhPt.x + w0 * 0.22, y0);
          ctx.lineTo(lhPt.x + w0, y0);
          ctx.lineTo(lhPt.x + w1, y1);
          ctx.lineTo(lhPt.x + w1 * 0.22, y1);
          ctx.closePath();
          ctx.fill();
        }

        // Grand Lighthouse Entrance Archway Door & 3 Illuminated Porthole Windows
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(lhPt.x - 5.0 * zRiv, lhPt.y - 17.5 * zRiv, 10.0 * zRiv, 17.5 * zRiv, [4.8 * zRiv, 4.8 * zRiv, 0, 0]);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.0 * zRiv;
        ctx.stroke();

        // Warm lit porthole windows up the spiral staircase shaft
        [36, 65, 94].forEach((winH, idx) => {
          const wY = lhPt.y - winH * zRiv;
          const wR = (3.2 - idx * 0.25) * zRiv;
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(lhPt.x, wY, wR + 0.9 * zRiv, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(lhPt.x, wY, wR, 0, Math.PI * 2);
          ctx.fill();
        });

        // Enlarged Wide Observation Gallery Balcony, Corbel Brackets & Guardrail at Tower Top
        const galY = lhPt.y - towerH;
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(lhPt.x, galY + 2.0 * zRiv, 14.8 * zRiv, 5.8 * zRiv, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(lhPt.x, galY, 15.6 * zRiv, 6.0 * zRiv, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.2 * zRiv;
        ctx.stroke();

        // Observation gallery guardrail posts & top ring
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 0.95 * zRiv;
        ctx.beginPath();
        ctx.ellipse(lhPt.x, galY - 4.6 * zRiv, 15.2 * zRiv, 5.5 * zRiv, 0, 0, Math.PI);
        ctx.stroke();
        for (let gp = -3; gp <= 3; gp++) {
          const gx = lhPt.x + gp * 4.2 * zRiv;
          const gy = galY + Math.cos((gp / 3.5) * (Math.PI * 0.5)) * 2.8 * zRiv;
          ctx.beginPath();
          ctx.moveTo(gx, gy);
          ctx.lineTo(gx, gy - 4.6 * zRiv);
          ctx.stroke();
        }

        // Enlarged Grand Glass Lantern Room & Glowing Fresnel Beacon Core
        const lanH = 18.2 * zRiv;
        const lanW = 15.8 * zRiv;
        const lanY = galY - lanH * 0.55;
        ctx.fillStyle = 'rgba(254, 240, 138, 0.94)';
        ctx.fillRect(lhPt.x - lanW * 0.5, galY - lanH, lanW, lanH);

        // Glowing Fresnel lens core inside the lantern room
        const coreGrad = ctx.createRadialGradient(lhPt.x, lanY, 1.0 * zRiv, lhPt.x, lanY, 8.5 * zRiv);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.5, '#fef08a');
        coreGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(lhPt.x, lanY, 8.5 * zRiv, 0, Math.PI * 2);
        ctx.fill();

        // Lantern room vertical steel mullions
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.15 * zRiv;
        ctx.strokeRect(lhPt.x - lanW * 0.5, galY - lanH, lanW, lanH);
        ctx.beginPath();
        ctx.moveTo(lhPt.x - lanW * 0.18, galY - lanH);
        ctx.lineTo(lhPt.x - lanW * 0.18, galY);
        ctx.moveTo(lhPt.x + lanW * 0.18, galY - lanH);
        ctx.lineTo(lhPt.x + lanW * 0.18, galY);
        ctx.stroke();

        // Sweeping Lighthouse Beacon Beam Reaching All the Way to Masjid Al-Hikmah [5.45, -4.85]
        // Rendered with a soft, translucent golden gradient so it reaches Masjid Al-Hikmah without disturbing/obscuring the map!
        const masjidTargetPt = toScreen(5.45, -4.85, 22, camera.x, camera.y);
        const dxToMasjid = masjidTargetPt.x - lhPt.x;
        const dyToMasjid = masjidTargetPt.y - lanY;
        const distToMasjid = Math.hypot(dxToMasjid, dyToMasjid);
        const baseAngleToMasjid = Math.atan2(dyToMasjid, dxToMasjid);

        // Gentle sweeping oscillation centered around Masjid Al-Hikmah so the beam sweeps smoothly across the Masjid
        const sweepOffset = Math.sin(elapsed * 0.72) * 0.15;
        const primaryBeamAngle = baseAngleToMasjid + sweepOffset;
        const beamReachToMasjid = Math.max(distToMasjid * 1.05, 190 * zRiv);
        const beamHalfSpread = 0.11;

        ctx.save();
        const endX1 = lhPt.x + Math.cos(primaryBeamAngle - beamHalfSpread) * beamReachToMasjid;
        const endY1 = lanY + Math.sin(primaryBeamAngle - beamHalfSpread) * beamReachToMasjid;
        const endX2 = lhPt.x + Math.cos(primaryBeamAngle + beamHalfSpread) * beamReachToMasjid;
        const endY2 = lanY + Math.sin(primaryBeamAngle + beamHalfSpread) * beamReachToMasjid;
        const endCenterX = lhPt.x + Math.cos(primaryBeamAngle) * beamReachToMasjid;
        const endCenterY = lanY + Math.sin(primaryBeamAngle) * beamReachToMasjid;

        const masjidBeamGrad = ctx.createLinearGradient(lhPt.x, lanY, endCenterX, endCenterY);
        masjidBeamGrad.addColorStop(0, isNight ? 'rgba(254, 240, 138, 0.38)' : 'rgba(254, 240, 138, 0.25)');
        masjidBeamGrad.addColorStop(0.35, isNight ? 'rgba(253, 224, 71, 0.16)' : 'rgba(253, 224, 71, 0.10)');
        masjidBeamGrad.addColorStop(0.78, isNight ? 'rgba(254, 240, 138, 0.085)' : 'rgba(254, 240, 138, 0.055)');
        masjidBeamGrad.addColorStop(0.95, isNight ? 'rgba(254, 240, 138, 0.055)' : 'rgba(254, 240, 138, 0.035)');
        masjidBeamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

        ctx.fillStyle = masjidBeamGrad;
        ctx.beginPath();
        ctx.moveTo(lhPt.x, lanY);
        ctx.lineTo(endX1, endY1);
        ctx.lineTo(endX2, endY2);
        ctx.closePath();
        ctx.fill();

        // Soft inner core ray along the center of the beam reaching Masjid Al-Hikmah
        const coreSpread = 0.035;
        const cEndX1 = lhPt.x + Math.cos(primaryBeamAngle - coreSpread) * beamReachToMasjid;
        const cEndY1 = lanY + Math.sin(primaryBeamAngle - coreSpread) * beamReachToMasjid;
        const cEndX2 = lhPt.x + Math.cos(primaryBeamAngle + coreSpread) * beamReachToMasjid;
        const cEndY2 = lanY + Math.sin(primaryBeamAngle + coreSpread) * beamReachToMasjid;
        const coreBeamGrad = ctx.createLinearGradient(lhPt.x, lanY, endCenterX, endCenterY);
        coreBeamGrad.addColorStop(0, isNight ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.18)');
        coreBeamGrad.addColorStop(0.5, isNight ? 'rgba(254, 240, 138, 0.10)' : 'rgba(254, 240, 138, 0.065)');
        coreBeamGrad.addColorStop(0.94, isNight ? 'rgba(254, 240, 138, 0.045)' : 'rgba(254, 240, 138, 0.03)');
        coreBeamGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');

        ctx.fillStyle = coreBeamGrad;
        ctx.beginPath();
        ctx.moveTo(lhPt.x, lanY);
        ctx.lineTo(cEndX1, cEndY1);
        ctx.lineTo(cEndX2, cEndY2);
        ctx.closePath();
        ctx.fill();

        // Subtle warm golden halo over Masjid Al-Hikmah when the beacon sweeps across it
        const alignmentWithMasjid = Math.max(0, 1 - Math.abs(sweepOffset) / 0.15);
        if (alignmentWithMasjid > 0.05) {
          const haloR = 36 * zRiv;
          const masjidHalo = ctx.createRadialGradient(
            masjidTargetPt.x,
            masjidTargetPt.y,
            2 * zRiv,
            masjidTargetPt.x,
            masjidTargetPt.y,
            haloR
          );
          const haloPeakAlpha = (isNight ? 0.14 : 0.09) * alignmentWithMasjid;
          masjidHalo.addColorStop(0, `rgba(254, 240, 138, ${haloPeakAlpha.toFixed(3)})`);
          masjidHalo.addColorStop(0.6, `rgba(253, 224, 71, ${(haloPeakAlpha * 0.45).toFixed(3)})`);
          masjidHalo.addColorStop(1, 'rgba(254, 240, 138, 0)');
          ctx.fillStyle = masjidHalo;
          ctx.beginPath();
          ctx.arc(masjidTargetPt.x, masjidTargetPt.y, haloR, 0, Math.PI * 2);
          ctx.fill();
        }

        // Secondary shorter counter-beam sweeping gently over Danau Pusat
        const secAng = primaryBeamAngle + Math.PI * 0.72;
        const secReach = (isNight ? 95 : 68) * zRiv;
        const secBx1 = lhPt.x + Math.cos(secAng - 0.16) * secReach;
        const secBy1 = lanY + Math.sin(secAng - 0.16) * (secReach * 0.5);
        const secBx2 = lhPt.x + Math.cos(secAng + 0.16) * secReach;
        const secBy2 = lanY + Math.sin(secAng + 0.16) * (secReach * 0.5);
        const secGrad = ctx.createRadialGradient(lhPt.x, lanY, 2.0 * zRiv, lhPt.x, lanY, secReach);
        secGrad.addColorStop(0, isNight ? 'rgba(254, 240, 138, 0.35)' : 'rgba(254, 240, 138, 0.22)');
        secGrad.addColorStop(0.5, isNight ? 'rgba(253, 224, 71, 0.12)' : 'rgba(254, 249, 195, 0.07)');
        secGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
        ctx.fillStyle = secGrad;
        ctx.beginPath();
        ctx.moveTo(lhPt.x, lanY);
        ctx.lineTo(secBx1, secBy1);
        ctx.lineTo(secBx2, secBy2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Enlarged Grand Crimson Conical Cupola Dome Roof & Golden Lightning Finial Spire
        const domeBaseY = galY - lanH;
        const domePeakY = domeBaseY - 17.5 * zRiv;
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(lhPt.x - 11.4 * zRiv, domeBaseY);
        ctx.quadraticCurveTo(lhPt.x - 4.6 * zRiv, domePeakY + 2.5 * zRiv, lhPt.x, domePeakY);
        ctx.quadraticCurveTo(lhPt.x + 4.6 * zRiv, domePeakY + 2.5 * zRiv, lhPt.x + 11.4 * zRiv, domeBaseY);
        ctx.closePath();
        ctx.fill();

        // Golden lightning rod spire & orb
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.5 * zRiv;
        ctx.beginPath();
        ctx.moveTo(lhPt.x, domePeakY);
        ctx.lineTo(lhPt.x, domePeakY - 7.8 * zRiv);
        ctx.stroke();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(lhPt.x, domePeakY - 2.2 * zRiv, 2.6 * zRiv, 0, Math.PI * 2);
        ctx.fill();

        // Floating Overhead Tag when Player is near the Lake / Hydro Plant / Lighthouse
        const distToHydro = Math.min(
          Math.hypot(player.wx - HYDRO_PLANT_COORDS.wx, player.wy - HYDRO_PLANT_COORDS.wy),
          Math.hypot(player.wx - LIGHTHOUSE_COORDS.wx, player.wy - LIGHTHOUSE_COORDS.wy),
          Math.hypot(player.wx - DANAU_VIEW_DECK_COORDS.wx, player.wy - DANAU_VIEW_DECK_COORDS.wy)
        );
        if (distToHydro < 4.5 && overheadTagAlpha > 0.005) {
          ctx.save();
          ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
          const lhTagY = domePeakY - 16 * zRiv;
          const lhLabel = '⚡ PLTA Danau & Mercusuar';
          ctx.font = `bold ${Math.round(7.5 * zRiv)}px sans-serif`;
          const lM = ctx.measureText(lhLabel);
          const lW = lM.width + 10 * zRiv;
          const lH = 14.0 * zRiv;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
          ctx.beginPath();
          ctx.roundRect(lhPt.x - lW / 2, lhTagY - lH / 2, lW, lH, 6.5 * zRiv);
          ctx.fill();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
          ctx.lineWidth = 0.9 * zRiv;
          ctx.stroke();
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lhLabel, lhPt.x, lhTagY);
          ctx.restore();
        }
      }

      // 6) Minimalist Wooden Footbridge across the River behind Studio ON AIR (at wy = 0, gx = 7..8)
      const brNW = toScreen(rivW0 - 0.18, -0.46, 2.5, camera.x, camera.y);
      const brNE = toScreen(rivW1 + 0.18, -0.46, 2.5, camera.x, camera.y);
      const brSE = toScreen(rivW1 + 0.18, 0.46, 2.5, camera.x, camera.y);
      const brSW = toScreen(rivW0 - 0.18, 0.46, 2.5, camera.x, camera.y);

      ctx.fillStyle = isNight ? '#78350f' : '#b45309';
      ctx.beginPath();
      ctx.moveTo(brNW.x, brNW.y);
      ctx.lineTo(brNE.x, brNE.y);
      ctx.lineTo(brSE.x, brSE.y);
      ctx.lineTo(brSW.x, brSW.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = isNight ? '#fbbf24' : '#fef3c7';
      ctx.lineWidth = 0.85 * zRiv;
      ctx.stroke();

      // Bridge timber handrails
      ctx.strokeStyle = isNight ? '#d97706' : '#78350f';
      ctx.lineWidth = 1.4 * zRiv;
      ctx.beginPath();
      ctx.moveTo(brNW.x, brNW.y - 4 * zRiv);
      ctx.lineTo(brNE.x, brNE.y - 4 * zRiv);
      ctx.moveTo(brSW.x, brSW.y - 4 * zRiv);
      ctx.lineTo(brSE.x, brSE.y - 4 * zRiv);
      ctx.stroke();

      // ---------------------------------------------------------
      // 2D. AIR TERJUN ESTETIK, HIDUP & DINAMIS DI UJUNG SUNGAI BAGIAN DEPAN
      //     (Spilling over the Front Cliff Edge at wy = +8.5, wx = 6.96 .. 8.12)
      // ---------------------------------------------------------
      const wfSway = Math.sin(elapsed * 4.5) * 0.025;
      const wfW0 = rivW0 + 0.03 + wfSway;
      const wfW1 = rivW1 - 0.03 - wfSway;
      const wfTopL = toScreen(wfW0, edgeLim, -1.0, camera.x, camera.y);
      const wfTopR = toScreen(wfW1, edgeLim, -1.0, camera.x, camera.y);
      const wfMidL = toScreen(wfW0 + 0.06, edgeLim + 0.08, -78, camera.x, camera.y);
      const wfMidR = toScreen(wfW1 - 0.06, edgeLim + 0.08, -78, camera.x, camera.y);
      const wfBotL = toScreen(wfW0 + 0.14, edgeLim + 0.15, -172, camera.x, camera.y);
      const wfBotR = toScreen(wfW1 - 0.14, edgeLim + 0.15, -172, camera.x, camera.y);

      // Architectural Minimalist Cut-Stone Spillway Lip at Cliff Edge
      const lipL = toScreen(rivW0 - 0.06, edgeLim, 0, camera.x, camera.y);
      const lipR = toScreen(rivW1 + 0.06, edgeLim, 0, camera.x, camera.y);
      ctx.strokeStyle = isNight ? '#94a3b8' : '#e2e8f0';
      ctx.lineWidth = 3.2 * zRiv;
      ctx.beginPath();
      ctx.moveTo(lipL.x, lipL.y);
      ctx.lineTo(lipR.x, lipR.y);
      ctx.stroke();

      // Soft Ambient Aqua Glow Behind Waterfall
      const wfGlowCenter = toScreen((wfW0 + wfW1) * 0.5, edgeLim + 0.06, -85, camera.x, camera.y);
      const wfAmbientGlow = ctx.createRadialGradient(
        wfGlowCenter.x,
        wfGlowCenter.y,
        4 * zRiv,
        wfGlowCenter.x,
        wfGlowCenter.y,
        46 * zRiv
      );
      wfAmbientGlow.addColorStop(0, 'rgba(125, 211, 252, 0.36)');
      wfAmbientGlow.addColorStop(0.6, 'rgba(56, 189, 248, 0.14)');
      wfAmbientGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = wfAmbientGlow;
      ctx.beginPath();
      ctx.ellipse(wfGlowCenter.x, wfGlowCenter.y, 26 * zRiv, 52 * zRiv, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Upper Sheer Waterfall Curtain (alt 0 -> -78)
      const wfGradUpper = ctx.createLinearGradient(wfTopL.x, wfTopL.y, wfMidL.x, wfMidL.y);
      wfGradUpper.addColorStop(0, 'rgba(240, 249, 255, 0.98)');
      wfGradUpper.addColorStop(0.3, 'rgba(56, 189, 248, 0.92)');
      wfGradUpper.addColorStop(0.75, 'rgba(14, 165, 233, 0.88)');
      wfGradUpper.addColorStop(1, 'rgba(224, 242, 254, 0.96)');

      ctx.fillStyle = wfGradUpper;
      ctx.beginPath();
      ctx.moveTo(wfTopL.x, wfTopL.y);
      ctx.lineTo(wfTopR.x, wfTopR.y);
      ctx.lineTo(wfMidR.x, wfMidR.y);
      ctx.lineTo(wfMidL.x, wfMidL.y);
      ctx.closePath();
      ctx.fill();

      // Stepped Minimalist Brown Rock Ledge Mid-Waterfall (at alt = -78)
      const ledgeL = toScreen(wfW0 - 0.1, edgeLim + 0.05, -78, camera.x, camera.y);
      const ledgeR = toScreen(wfW1 + 0.1, edgeLim + 0.05, -78, camera.x, camera.y);
      const ledgeBot = toScreen((wfW0 + wfW1) * 0.5, edgeLim + 0.08, -90, camera.x, camera.y);
      fillCliffPoly(
        [ledgeL, ledgeR, ledgeBot],
        isNight ? '#451a03' : '#78350f',
        isNight ? '#270f03' : '#451a03',
        1.0
      );

      // Lower Cascading Waterfall Curtain (alt -78 -> -172)
      const wfGradLower = ctx.createLinearGradient(wfMidL.x, wfMidL.y, wfBotL.x, wfBotL.y);
      wfGradLower.addColorStop(0, 'rgba(240, 249, 255, 0.95)');
      wfGradLower.addColorStop(0.35, 'rgba(56, 189, 248, 0.85)');
      wfGradLower.addColorStop(0.75, 'rgba(125, 211, 252, 0.68)');
      wfGradLower.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = wfGradLower;
      ctx.beginPath();
      ctx.moveTo(wfMidL.x, wfMidL.y);
      ctx.lineTo(wfMidR.x, wfMidR.y);
      ctx.lineTo(wfBotR.x, wfBotR.y);
      ctx.lineTo(wfBotL.x, wfBotL.y);
      ctx.closePath();
      ctx.fill();

      // 1) Lively Multi-Speed Vertical Cascading Water Ribbons & Foaming Veins
      for (let ws = 0; ws < 24; ws++) {
        const t = (ws + 0.5) / 24;
        const wWx = wfW0 + 0.04 + t * (wfW1 - wfW0 - 0.08);
        const speed = 105 + (ws % 4) * 24;
        const dropOffset = (elapsed * speed + ws * 19) % 162;
        const dropAlt0 = -dropOffset;
        const ribbonLen = 22 + (ws % 3) * 11;
        const dropAlt1 = Math.max(-168, dropAlt0 - ribbonLen);
        const wyShift0 = edgeLim + (dropOffset / 162) * 0.14;
        const wyShift1 = edgeLim + (Math.min(168, dropOffset + ribbonLen) / 162) * 0.14;
        const dPt0 = toScreen(wWx, wyShift0, dropAlt0, camera.x, camera.y);
        const dPt1 = toScreen(wWx, wyShift1, dropAlt1, camera.x, camera.y);

        ctx.strokeStyle =
          ws % 3 === 0
            ? 'rgba(255, 255, 255, 0.92)'
            : ws % 2 === 0
            ? 'rgba(224, 242, 254, 0.78)'
            : 'rgba(125, 211, 252, 0.65)';
        ctx.lineWidth = (ws % 3 === 0 ? 1.8 : 1.1) * zRiv;
        ctx.beginPath();
        ctx.moveTo(dPt0.x, dPt0.y);
        ctx.lineTo(dPt1.x, dPt1.y);
        ctx.stroke();
      }

      // 2) Dynamic Bouncing Water Droplets & Spray Arcs off the Spillway & Mid-Ledge
      for (let dp = 0; dp < 18; dp++) {
        const phase = (elapsed * 2.4 + dp * 0.37) % 1.0;
        const isMidSplash = dp % 2 === 0;
        const baseWx = wfW0 + ((dp * 0.19) % 1.0) * (wfW1 - wfW0);
        const spreadWx = (dp % 3 - 1) * 0.16 * phase;
        const startAlt = isMidSplash ? -76 : -4;
        // Parabolic arc upward bounce then gravity drop
        const arcAlt = startAlt + Math.sin(phase * Math.PI) * 12 - phase * phase * 42;
        const spPt = toScreen(
          baseWx + spreadWx,
          edgeLim + 0.08 + phase * 0.18,
          arcAlt,
          camera.x,
          camera.y
        );
        const alpha = Math.max(0, 1 - phase * 0.95);
        ctx.fillStyle = `rgba(255, 255, 255, ${(alpha * 0.9).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(spPt.x, spPt.y, (1.4 + (1 - phase) * 1.1) * zRiv, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3) Churning White-Cyan Spillway Crest Foam at Top Lip & Mid Rock Ledge
      for (let f = 0; f < 9; f++) {
        const ft = f / 8;
        const fxTop = wfTopL.x + ft * (wfTopR.x - wfTopL.x);
        const fyTop = wfTopL.y + ft * (wfTopR.y - wfTopL.y);
        const rPulse = (3.0 + Math.sin(elapsed * 8.5 + f * 1.1) * 1.1) * zRiv;
        ctx.fillStyle = f % 2 === 0 ? 'rgba(255, 255, 255, 0.94)' : 'rgba(224, 242, 254, 0.85)';
        ctx.beginPath();
        ctx.arc(fxTop, fyTop, rPulse, 0, Math.PI * 2);
        ctx.fill();

        const fxMid = wfMidL.x + ft * (wfMidR.x - wfMidL.x);
        const fyMid = wfMidL.y + ft * (wfMidR.y - wfMidL.y);
        ctx.beginPath();
        ctx.arc(
          fxMid + Math.sin(elapsed * 6 + f) * 1.2 * zRiv,
          fyMid + Math.cos(elapsed * 7 + f) * 1.0 * zRiv,
          rPulse * 1.25,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // 4) Billowing Multi-Layered Mist & Rising Vapor Clouds at Waterfall Base
      const mistCenter = toScreen((wfW0 + wfW1) * 0.5, edgeLim + 0.14, -158, camera.x, camera.y);
      const mistGrad = ctx.createRadialGradient(
        mistCenter.x,
        mistCenter.y,
        3 * zRiv,
        mistCenter.x,
        mistCenter.y,
        38 * zRiv
      );
      mistGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      mistGrad.addColorStop(0.45, 'rgba(186, 230, 253, 0.48)');
      mistGrad.addColorStop(1, 'rgba(186, 230, 253, 0)');
      ctx.fillStyle = mistGrad;
      ctx.beginPath();
      ctx.ellipse(
        mistCenter.x,
        mistCenter.y,
        (32 + Math.sin(elapsed * 4.5) * 4) * zRiv,
        (16 + Math.cos(elapsed * 4.5) * 2.5) * zRiv,
        -0.22,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Rising animated mist puffs drifting upward from the plunge zone
      for (let mp = 0; mp < 4; mp++) {
        const mProg = (elapsed * 0.65 + mp * 0.25) % 1.0;
        const mWx = wfW0 + 0.15 + ((mp * 0.27) % 0.75) * (wfW1 - wfW0);
        const mAlt = -162 + mProg * 46;
        const mPt = toScreen(mWx, edgeLim + 0.16, mAlt, camera.x, camera.y);
        const mAlpha = Math.sin(mProg * Math.PI) * 0.52;
        const mRad = (9 + mProg * 14) * zRiv;
        ctx.fillStyle = `rgba(224, 242, 254, ${mAlpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.ellipse(mPt.x, mPt.y, mRad, mRad * 0.58, -0.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Outer platform border line: ONLY stroke the visible front-left and front-right cliff edges
      // from the front base of the mountains (wy = -11.92) down to cornerS so the northern map edges are hidden beneath the mountains!
      const cornerE_Front = toScreen(GRID_RADIUS + 0.5, -11.92, 0, camera.x, camera.y);
      const cornerS = toScreen(GRID_RADIUS + 0.5, GRID_RADIUS + 0.5, 0, camera.x, camera.y);
      const cornerW = toScreen(-GRID_RADIUS - 0.5, GRID_RADIUS + 0.5, 0, camera.x, camera.y);
      const cornerW_Front = toScreen(-GRID_RADIUS - 0.5, -11.92, 0, camera.x, camera.y);

      ctx.strokeStyle = isNight ? '#0a1610' : '#2d4e33';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cornerW_Front.x, cornerW_Front.y);
      ctx.lineTo(cornerW.x, cornerW.y);
      ctx.lineTo(cornerS.x, cornerS.y);
      ctx.lineTo(cornerE_Front.x, cornerE_Front.y);
      ctx.stroke();

      // Soft Animated Click Destination Ripple on Ground
      if (clickRippleRef.current) {
        const isRun = !!clickRippleRef.current.isRun;
        const age = (performance.now() - clickRippleRef.current.time) / (isRun ? 680 : 750);
        if (age < 1.0) {
          const rPt = toScreen(clickRippleRef.current.wx, clickRippleRef.current.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Outer expanding ring
          const rOuter = (6 + age * (isRun ? 28 : 24)) * z;
          ctx.strokeStyle = isRun
            ? `rgba(250, 204, 21, ${0.9 * (1 - age)})`
            : `rgba(56, 189, 248, ${0.85 * (1 - age)})`;
          ctx.lineWidth = (isRun ? 2.6 : 2) * z;
          ctx.beginPath();
          ctx.ellipse(rPt.x, rPt.y, rOuter, rOuter * 0.5, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Second energetic pulse ring for double-click running
          if (isRun) {
            const rSprint = (3 + age * 18) * z;
            ctx.strokeStyle = `rgba(56, 189, 248, ${0.9 * (1 - age)})`;
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.ellipse(rPt.x, rPt.y, rSprint, rSprint * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else if (age > 0.12) {
            // Inner expanding pulse ring for walking
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
          ctx.ellipse(rPt.x, rPt.y, (isRun ? 4.0 : 3.2) * z, (isRun ? 2.0 : 1.6) * z, 0, 0, Math.PI * 2);
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
        | { type: 'wilderness_tree'; tree: WildernessTreeDef; wx: number; wy: number; depth: number }
        | { type: 'hutan_sign'; wx: number; wy: number; depth: number }
        | {
            type: 'wilderness_fence_bay';
            wx1: number;
            wx2: number;
            wy: number;
            drawLeftPost: boolean;
            drawRightPost: boolean;
            depth: number;
          }
        | { type: 'wilderness_gate'; wx: number; wy: number; depth: number }
        | { type: 'lamp'; wx: number; wy: number; depth: number }
        | { type: 'fishing_spot'; wx: number; wy: number; depth: number }
        | { type: 'literacy_corner'; wx: number; wy: number; depth: number }
        | { type: 'bench'; wx: number; wy: number; depth: number; id: BenchId; twoPersonGroup?: TwoPersonBenchGroup }
        | { type: 'swings_structure'; struct: SwingStructureDef; wx: number; wy: number; depth: number }
        | { type: 'campfire_spot'; wx: number; wy: number; depth: number }
        | { type: 'welcome_gate'; wx: number; wy: number; depth: number }
        | { type: 'town_rules_board'; wx: number; wy: number; depth: number }
        | { type: 'announcement_board'; wx: number; wy: number; depth: number }
        | { type: 'beringin_tree'; wx: number; wy: number; depth: number }
        | { type: 'housing_unit'; unit: HousingUnitDef; wx: number; wy: number; depth: number }
        | { type: 'housing_gate'; wx: number; wy: number; depth: number }
        | { type: 'dry_leaf'; leaf: DryLeafItem; wx: number; wy: number; depth: number }
        | { type: 'lake_fishing_boat'; wx: number; wy: number; depth: number }
        | { type: 'river_heron'; wx: number; wy: number; depth: number }
        | {
            type: 'forest_wildlife';
            kind: 'deer_stag' | 'deer_doe' | 'squirrel' | 'rabbit' | 'ground_bird';
            wx: number;
            wy: number;
            depth: number;
            facingDir?: 1 | -1;
            isWalking?: boolean;
          };

      const drawItems: DrawItem[] = [];

      BUILDINGS_INFO.forEach((b) => {
        if (b.id === 'monumen_warga') return; // drawn as fountain
        drawItems.push({ type: 'building', info: b, depth: b.position[0] + b.position[2] });
      });

      // 10. Perumahan Guru & Siswa di Belakang Perpustakaan Kampus (Ujung Barat Peta)
      HOUSING_UNITS.forEach((unit) => {
        drawItems.push({
          type: 'housing_unit',
          unit,
          wx: unit.wx,
          wy: unit.wy,
          depth: unit.wx + unit.wy,
        });
      });

      drawItems.push({
        type: 'housing_gate',
        wx: -6.55,
        wy: 0.0,
        depth: -6.55 + 0.0,
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
            (g) => g.groupId === seatId || g.seats[0].id === seatId || g.seats[1].id === currentSeatIdOrDefault(seatId)
          );
          if (benchGroup) {
            return benchGroup.wx + benchGroup.wy + 0.02;
          }
        }
        return avData.wx + avData.wy;
      };
      function currentSeatIdOrDefault(s: BenchId) {
        return s;
      }

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

      // Hutan Belantara & Gunung Tinggi Trees (Static lightweight list)
      WILDERNESS_TREES_LIST.forEach((wt) => {
        drawItems.push({
          type: 'wilderness_tree',
          tree: wt,
          wx: wt.wx,
          wy: wt.wy,
          depth: wt.wx + wt.wy - wt.alt * 0.002,
        });
      });

      // Papan Penunjuk Hutan Belantara di Belakang Pohon Refleksi [-0.85, -7.85]
      drawItems.push({
        type: 'hutan_sign',
        wx: HUTAN_BELANTARA_SIGN_COORDS.wx,
        wy: HUTAN_BELANTARA_SIGN_COORDS.wy,
        depth: HUTAN_BELANTARA_SIGN_COORDS.wx + HUTAN_BELANTARA_SIGN_COORDS.wy,
      });

      // Pagar Minimalis Pembatas Hutan Belantara & Danau Pusat (wy = -7.62)
      // Sayap Barat: Menutupi Hutan Belantara dari ujung barat (-8.15) sampai sisi kiri jalan belakang Pohon Refleksi (-0.60)
      const westFenceBays = 9;
      const westSpan = -0.60 - WILDERNESS_FENCE_MIN_WX;
      for (let bi = 0; bi < westFenceBays; bi++) {
        const wx1 = WILDERNESS_FENCE_MIN_WX + (bi / westFenceBays) * westSpan;
        const wx2 = WILDERNESS_FENCE_MIN_WX + ((bi + 1) / westFenceBays) * westSpan;
        const midWx = (wx1 + wx2) * 0.5;
        drawItems.push({
          type: 'wilderness_fence_bay',
          wx1,
          wx2,
          wy: WILDERNESS_FENCE_WY,
          drawLeftPost: true,
          drawRightPost: bi === westFenceBays - 1,
          depth: midWx + WILDERNESS_FENCE_WY,
        });
      }

      // Sayap Timur: Menutupi Hutan Belantara & Danau Pusat dari sisi kanan jalan (+0.60) sampai ujung timur Danau Pusat (+6.82)
      const eastFenceBays = 8;
      const eastSpan = WILDERNESS_FENCE_MAX_WX - 0.60;
      for (let bi = 0; bi < eastFenceBays; bi++) {
        const wx1 = 0.60 + (bi / eastFenceBays) * eastSpan;
        const wx2 = 0.60 + ((bi + 1) / eastFenceBays) * eastSpan;
        const midWx = (wx1 + wx2) * 0.5;
        drawItems.push({
          type: 'wilderness_fence_bay',
          wx1,
          wx2,
          wy: WILDERNESS_FENCE_WY,
          drawLeftPost: bi > 0,
          drawRightPost: true,
          depth: midWx + WILDERNESS_FENCE_WY,
        });
      }

      // Gerbang Masuk Hutan Belantara & Danau Pusat di Jalan Belakang Pohon Refleksi (Dijaga @tomi, Khusus Guru)
      drawItems.push({
        type: 'wilderness_gate',
        wx: 0.0,
        wy: WILDERNESS_FENCE_WY,
        depth: 0.0 + WILDERNESS_FENCE_WY + 0.04,
      });

      // Neat golden-amber dry leaves on garden borders (only active or currently fading out)
      dryLeavesRef.current.forEach((leaf) => {
        const isFading = leaf.fadeStartTime !== null && (currentTime - leaf.fadeStartTime) / 1000 < 0.9;
        if (leaf.pickedAt === null || isFading) {
          drawItems.push({
            type: 'dry_leaf',
            leaf,
            wx: leaf.wx,
            wy: leaf.wy,
            depth: leaf.wx + leaf.wy - 0.15,
          });
        }
      });

      STREET_LAMPS_LIST.forEach(([lx, ly]) => {
        drawItems.push({ type: 'lamp', wx: lx, wy: ly, depth: lx + ly });
      });

      // 1. Spot Memancing & Dermaga Kayu di Danau Pusat Sungai Mengalir [2.05, -10.15]
      drawItems.push({
        type: 'fishing_spot',
        wx: FISHING_SPOT_COORDS.wx,
        wy: FISHING_SPOT_COORDS.wy,
        depth: FISHING_SPOT_COORDS.wx + FISHING_SPOT_COORDS.wy - 0.85,
      });

      // 2. Sudut Literasi Warga di Samping Balai Kota di Atas Rumput [2.35, -6.15]
      drawItems.push({
        type: 'literacy_corner',
        wx: LITERACY_CORNER_COORDS.wx,
        wy: LITERACY_CORNER_COORDS.wy,
        depth: LITERACY_CORNER_COORDS.wx + LITERACY_CORNER_COORDS.wy,
      });

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

      // 6. Api Unggun di Atas Rumput [-4.05, 4.15]
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

      // 8. Papan Peraturan & Panduan Aktivitas di Dekat Gapura Masuk [1.45, 5.95]
      drawItems.push({
        type: 'town_rules_board',
        wx: TOWN_RULES_BOARD_COORDS.wx,
        wy: TOWN_RULES_BOARD_COORDS.wy,
        depth: TOWN_RULES_BOARD_COORDS.wx + TOWN_RULES_BOARD_COORDS.wy + 0.45,
      });

      // 9. Pohon Beringin Jurnal Harian di Belakang Balai Kota [0, -5.8]
      drawItems.push({
        type: 'beringin_tree',
        wx: BERINGIN_TREE_COORDS.wx,
        wy: BERINGIN_TREE_COORDS.wy,
        depth: BERINGIN_TREE_COORDS.wx + BERINGIN_TREE_COORDS.wy - 0.05,
      });

      // 10. Papan Pengumuman Guru di Dekat Balai Kota [-1.55, -3.45]
      drawItems.push({
        type: 'announcement_board',
        wx: ANNOUNCEMENT_BOARD_COORDS.wx,
        wy: ANNOUNCEMENT_BOARD_COORDS.wy,
        depth: ANNOUNCEMENT_BOARD_COORDS.wx + ANNOUNCEMENT_BOARD_COORDS.wy + 0.25,
      });

      // 11. Perahu Kayu & Pencari Ikan di Danau Kawah / Danau Pusat
      drawItems.push({
        type: 'lake_fishing_boat',
        wx: 4.85,
        wy: -10.35,
        depth: 4.85 - 10.35,
      });

      // 12. Burung Bangau di Sungai (Singgah & Terbang Berkeliling Sungai)
      const heronPhase = (elapsed % 20);
      let heronCurWx = 7.35;
      let heronCurWy = -3.85;
      if (heronPhase > 8 && heronPhase <= 16) {
        const flightFrac = (heronPhase - 8) / 8;
        heronCurWy = -3.85 + Math.sin(flightFrac * Math.PI) * 4.8;
        heronCurWx = 7.35 + Math.sin(flightFrac * Math.PI * 2) * 0.35;
      } else if (heronPhase > 16) {
        const returnFrac = (heronPhase - 16) / 4;
        heronCurWy = -3.85 + (1 - returnFrac) * 0.4;
      }
      drawItems.push({
        type: 'river_heron',
        wx: heronCurWx,
        wy: heronCurWy,
        depth: heronCurWx + heronCurWy + 0.1,
      });

      // 13. Hewan di Hutan Belantara (2 Rusa Dewasa, Tupai, Kelinci, & Burung Berjalan) - Bergerak Random Pelan
      // A. Rusa Jantan Dewasa: Berkelana pelan santai di padang rumput barat (siklus 28 detik)
      const stagCycle = elapsed % 28;
      let stagCurWx = -4.85;
      let stagCurWy = -10.45;
      let stagFacing: 1 | -1 = 1;
      let stagWalking = false;
      if (stagCycle < 10) {
        // Melangkah pelan ke arah timur
        const p = stagCycle / 10;
        const s = 0.5 - 0.5 * Math.cos(p * Math.PI);
        stagCurWx = -4.85 + s * 1.15;
        stagCurWy = -10.45 + Math.sin(p * Math.PI) * 0.45;
        stagFacing = 1;
        stagWalking = true;
      } else if (stagCycle < 17) {
        // Berhenti berdiri gagah, memantau hutan & sniffing udara
        stagCurWx = -3.70;
        stagCurWy = -10.45;
        stagFacing = 1;
        stagWalking = false;
      } else {
        // Melangkah pelan kembali ke arah barat
        const p = (stagCycle - 17) / 11;
        const s = 0.5 - 0.5 * Math.cos(p * Math.PI);
        stagCurWx = -3.70 - s * 1.15;
        stagCurWy = -10.45 - Math.sin(p * Math.PI) * 0.35;
        stagFacing = -1;
        stagWalking = true;
      }
      drawItems.push({
        type: 'forest_wildlife',
        kind: 'deer_stag',
        wx: stagCurWx,
        wy: stagCurWy,
        depth: stagCurWx + stagCurWy,
        facingDir: stagFacing,
        isWalking: stagWalking,
      });

      // B. Rusa Betina Dewasa: Bergerak pelan dan merumput di dekat pepohonan (siklus 32 detik)
      const doeCycle = elapsed % 32;
      let doeCurWx = -2.35;
      let doeCurWy = -10.85;
      let doeFacing: 1 | -1 = -1;
      let doeWalking = false;
      if (doeCycle < 11) {
        // Melangkah pelan ke arah barat daya
        const p = doeCycle / 11;
        const s = 0.5 - 0.5 * Math.cos(p * Math.PI);
        doeCurWx = -2.35 - s * 0.95;
        doeCurWy = -10.85 + Math.sin(p * Math.PI) * 0.40;
        doeFacing = -1;
        doeWalking = true;
      } else if (doeCycle < 19) {
        // Berhenti merumput di semak hijau
        doeCurWx = -3.30;
        doeCurWy = -10.85;
        doeFacing = -1;
        doeWalking = false;
      } else {
        // Melangkah pelan kembali ke timur laut
        const p = (doeCycle - 19) / 13;
        const s = 0.5 - 0.5 * Math.cos(p * Math.PI);
        doeCurWx = -3.30 + s * 0.95;
        doeCurWy = -10.85 - Math.sin(p * Math.PI) * 0.30;
        doeFacing = 1;
        doeWalking = true;
      }
      drawItems.push({
        type: 'forest_wildlife',
        kind: 'deer_doe',
        wx: doeCurWx,
        wy: doeCurWy,
        depth: doeCurWx + doeCurWy,
        facingDir: doeFacing,
        isWalking: doeWalking,
      });

      // C. Tupai Ekor Lebat: Scurry pelan di antara semak/pohon dan duduk memakan biji (siklus 18 detik)
      const sqCycle = elapsed % 18;
      let sqCurWx = -0.95;
      let sqCurWy = -9.85;
      let sqFacing: 1 | -1 = 1;
      let sqWalking = false;
      if (sqCycle < 4.5) {
        const p = sqCycle / 4.5;
        sqCurWx = -0.95 + p * 0.70;
        sqCurWy = -9.85 + Math.sin(p * Math.PI) * 0.25;
        sqFacing = 1;
        sqWalking = true;
      } else if (sqCycle < 13.5) {
        sqCurWx = -0.25;
        sqCurWy = -9.85;
        sqFacing = 1;
        sqWalking = false;
      } else {
        const p = (sqCycle - 13.5) / 4.5;
        sqCurWx = -0.25 - p * 0.70;
        sqCurWy = -9.85 - Math.sin(p * Math.PI) * 0.25;
        sqFacing = -1;
        sqWalking = true;
      }
      drawItems.push({
        type: 'forest_wildlife',
        kind: 'squirrel',
        wx: sqCurWx,
        wy: sqCurWy,
        depth: sqCurWx + sqCurWy,
        facingDir: sqFacing,
        isWalking: sqWalking,
      });

      // D. Kelinci Hutan: Melompat pelan dan berhenti menggoyangkan hidung (siklus 21 detik)
      const rabCycle = elapsed % 21;
      let rabCurWx = -3.55;
      let rabCurWy = -9.45;
      let rabFacing: 1 | -1 = 1;
      let rabWalking = false;
      if (rabCycle < 6.5) {
        const p = rabCycle / 6.5;
        rabCurWx = -3.55 + p * 0.85;
        rabCurWy = -9.45 + Math.sin(p * Math.PI * 4) * 0.12;
        rabFacing = 1;
        rabWalking = true;
      } else if (rabCycle < 14.5) {
        rabCurWx = -2.70;
        rabCurWy = -9.45;
        rabFacing = 1;
        rabWalking = false;
      } else {
        const p = (rabCycle - 14.5) / 6.5;
        rabCurWx = -2.70 - p * 0.85;
        rabCurWy = -9.45 - Math.sin(p * Math.PI * 4) * 0.12;
        rabFacing = -1;
        rabWalking = true;
      }
      drawItems.push({
        type: 'forest_wildlife',
        kind: 'rabbit',
        wx: rabCurWx,
        wy: rabCurWy,
        depth: rabCurWx + rabCurWy,
        facingDir: rabFacing,
        isWalking: rabWalking,
      });

      // E. Burung Hutan: Berjalan acak perlahan di semak-semak hutan
      const birdCycle = (elapsed * 0.28) % (Math.PI * 2);
      const birdCurWx = -3.2 + Math.sin(birdCycle) * 1.5 + Math.cos(birdCycle * 2.3) * 0.45;
      const birdCurWy = -9.8 + Math.cos(birdCycle) * 0.8 + Math.sin(birdCycle * 1.7) * 0.35;
      const birdVelX = Math.cos(birdCycle) * 1.5 - 2.3 * Math.sin(birdCycle * 2.3) * 0.45;
      const birdFacing: 1 | -1 = birdVelX >= 0 ? 1 : -1;
      drawItems.push({
        type: 'forest_wildlife',
        kind: 'ground_bird',
        wx: birdCurWx,
        wy: birdCurWy,
        depth: birdCurWx + birdCurWy,
        facingDir: birdFacing,
        isWalking: true,
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
          } else if (group && group.kind === 'riverside') {
            // 3 TEMPAT DUDUK PINGGIRAN SUNGAI UNTUK 6 ORANG (Minimalist Teak & Aqua-Steel 2-Seater River-View Benches)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1.5 * z, 15.5 * z, 5.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Powder-coated marine slate legs
            ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.fillRect(pt.x - 12.5 * z, pt.y - 3 * z, 2.2 * z, 6.5 * z);
            ctx.fillRect(pt.x - 0.8 * z, pt.y - 2 * z, 1.6 * z, 5 * z);
            ctx.fillRect(pt.x + 10.3 * z, pt.y - 3 * z, 2.2 * z, 6.5 * z);

            // Warm golden-teak bench deck (fits 2 people per bench = 6 seats across the 3 benches)
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.roundRect(pt.x - 14 * z, pt.y - 4.5 * z, 28 * z, 4.2 * z, 1.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 2 River-Breeze Cyan/Teal Seat Cushions per bench (visually showing 2 seats per bench = 6 seats total)
            ctx.fillStyle = '#0ea5e9';
            ctx.beginPath();
            ctx.roundRect(pt.x - 12.5 * z, pt.y - 4.0 * z, 11.2 * z, 2.9 * z, 1 * z);
            ctx.roundRect(pt.x + 1.3 * z, pt.y - 4.0 * z, 11.2 * z, 2.9 * z, 1 * z);
            ctx.fill();

            // Slatted teak backrest with cyan top trim
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.roundRect(pt.x - 13.2 * z, pt.y - 10.2 * z, 26.4 * z, 3.0 * z, 1.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.75 * z;
            ctx.stroke();

            // Floating label above the middle riverside bench (riverside_2) when player is nearby
            if (group.groupId === 'riverside_2') {
              const distToRivBench = Math.hypot(player.wx - group.wx, player.wy - group.wy);
              if (distToRivBench < 2.5 && overheadTagAlpha > 0.005) {
                ctx.save();
                ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
                const rTagY = pt.y - 24 * z;
                const rLabel = '🪑 Spot Duduk Tepi Sungai (6 Orang)';
                ctx.font = `bold ${Math.round(7.2 * z)}px sans-serif`;
                const rM = ctx.measureText(rLabel);
                const rW = rM.width + 10 * z;
                const rH = 13.5 * z;
                ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
                ctx.beginPath();
                ctx.roundRect(pt.x - rW / 2, rTagY - rH / 2, rW, rH, 6.5 * z);
                ctx.fill();
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
                ctx.lineWidth = 0.9 * z;
                ctx.stroke();
                ctx.fillStyle = '#bae6fd';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(rLabel, pt.x, rTagY);
                ctx.restore();
              }
            }
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
          // 2 TEMPAT AYUNAN MINIMALIS KOTA REFLEKSIA (Modern Architectural Minimalist Park Swing)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const st = item.struct;

          // Subtle elliptical ground shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 3 * z, 25 * z, 7.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Minimalist stone/rubber safety pad strips under left & right swing posts
          ctx.fillStyle = isNight ? '#1e293b' : '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(pt.x - 19 * z, pt.y + 2.5 * z, 4.2 * z, 2.0 * z, 0, 0, Math.PI * 2);
          ctx.ellipse(pt.x + 19 * z, pt.y + 2.5 * z, 4.2 * z, 2.0 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Sleek Minimalist Matte-Charcoal Portal Frame Legs (Slender & clean, no bulky crossbars)
          ctx.strokeStyle = isNight ? '#334155' : '#1e293b';
          ctx.lineWidth = 2.1 * z;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          // Left minimalist inverted-V leg
          ctx.moveTo(pt.x - 21.5 * z, pt.y + 1.5 * z);
          ctx.lineTo(pt.x - 19 * z, pt.y - 29.5 * z);
          ctx.lineTo(pt.x - 16.5 * z, pt.y + 4.5 * z);
          // Right minimalist inverted-V leg
          ctx.moveTo(pt.x + 16.5 * z, pt.y + 0.5 * z);
          ctx.lineTo(pt.x + 19 * z, pt.y - 29.5 * z);
          ctx.lineTo(pt.x + 21.5 * z, pt.y + 4.5 * z);
          ctx.stroke();

          // Slim Minimalist Nordic Teak & Matte-Slate Top Beam
          ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
          ctx.beginPath();
          ctx.roundRect(pt.x - 21.5 * z, pt.y - 31 * z, 43 * z, 2.6 * z, 1.3 * z);
          ctx.fill();

          // Warm amber/teak accent strip along top edge of minimalist beam
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(pt.x - 19.5 * z, pt.y - 30.8 * z, 39 * z, 1.0 * z, 0.5 * z);
          ctx.fill();

          // Hanging Minimalist Swings for this Swing Structure
          const swingIds: Array<SwingSeatDef['id']> = [st.leftSeatId, st.rightSeatId];

          swingIds.forEach((swId) => {
            const m = getSwingSeatMetrics(swId);

            // Soft ground shadow directly beneath the swinging seat
            ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
            ctx.beginPath();
            ctx.ellipse(
              m.shadowX,
              m.shadowY,
              5.5 * m.shadowScale * z,
              2.5 * m.shadowScale * z,
              0,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Discreet minimalist stainless ring mounts on top beam
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(m.anchorX - 3.8 * z, m.anchorY, 1.0 * z, 0, Math.PI * 2);
            ctx.arc(m.anchorX + 3.8 * z, m.anchorY, 1.0 * z, 0, Math.PI * 2);
            ctx.fill();

            // Thin, taut minimalist steel suspension cables
            ctx.strokeStyle = isNight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.85)';
            ctx.lineWidth = 0.85 * z;
            ctx.beginPath();
            ctx.moveTo(m.anchorX - 3.8 * z, m.anchorY);
            ctx.lineTo(m.seatX - 4.0 * z, m.seatY);
            ctx.moveTo(m.anchorX + 3.8 * z, m.anchorY);
            ctx.lineTo(m.seatX + 4.0 * z, m.seatY);
            ctx.stroke();

            // Sleek Floating Minimalist Rounded Teak Seat Board
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.roundRect(m.seatX - 5.4 * z, m.seatY - 1.1 * z, 10.8 * z, 2.4 * z, 1.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 0.65 * z;
            ctx.stroke();

            // Minimalist warm seat pad highlight
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.roundRect(m.seatX - 4.4 * z, m.seatY - 0.7 * z, 8.8 * z, 1.1 * z, 0.5 * z);
            ctx.fill();
          });

          // Floating Badge above Swing Structure ONLY when player approaches & not stationary > 5s
          const distToSwing = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToSwing < 2.15 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const swBadgeY = pt.y - 39 * z;
            ctx.font = `bold ${Math.round(7.6 * z)}px sans-serif`;
            const swM = ctx.measureText(st.badgeText);
            const swW = swM.width + 10 * z;
            const swH = 14.5 * z;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.68)';
            ctx.beginPath();
            ctx.roundRect(pt.x - swW / 2, swBadgeY - swH / 2, swW, swH, 7 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.75)';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();
            ctx.fillStyle = '#fde047';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(st.badgeText, pt.x, swBadgeY);
            ctx.restore();
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

          // Floating Badge above Campfire ONLY when player approaches & not stationary > 5s
          const distToCampfire = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToCampfire < 2.25 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
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
            ctx.restore();
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
          // "SELAMAT DATANG DI REFLEKSIA CITY" — angled to follow the exact isometric slope of the Gapura!
          const bannerCenterX = (leftTopX + rightTopX) / 2;
          const bannerCenterY = (leftTopY + rightTopY) / 2 - 11 * z;
          const gateDx = rightTopX - leftTopX;
          const gateDy = rightTopY - leftTopY;
          const gateSlope = gateDx !== 0 ? gateDy / gateDx : 0.5;

          ctx.save();
          ctx.translate(bannerCenterX, bannerCenterY);
          ctx.transform(1, gateSlope, 0, 1, 0, 0);

          // Supporting golden struts connecting crossbeam to angled signboard
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-52 * z, 6 * z, 4 * z, 10 * z);
          ctx.fillRect(48 * z, 6 * z, 4 * z, 10 * z);

          // Wide Illuminated Signboard Plaque aligned with Gapura angle (Text strictly fitted inside Frame)
          const titleText = '🏛️ SELAMAT DATANG DI REFLEKSIA CITY ✨';
          ctx.font = `900 ${Math.max(7, Math.round(8.2 * z))}px sans-serif`;
          const tm = ctx.measureText(titleText);
          const boardW = Math.max(178 * z, tm.width + 32 * z);
          const boardH = 23 * z;
          const roofHalfW = boardW / 2 + 6 * z;

          // Traditional/Modern Crown Roof Peak above the Signboard (scaled to match boardW)
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.moveTo(-roofHalfW, -boardH / 2 + 2 * z);
          ctx.lineTo(0, -boardH / 2 - 14 * z);
          ctx.lineTo(roofHalfW, -boardH / 2 + 2 * z);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 1.5 * z;
          ctx.stroke();

          // Golden Spire Finial at Apex of Gapura
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, -boardH / 2 - 16 * z, 3.2 * z, 0, Math.PI * 2);
          ctx.fill();

          // 3D Isometric Extrusion / Back Depth of the Signboard
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.roundRect(-boardW / 2 + 2.5 * z, -boardH / 2 - 2 * z, boardW, boardH, 6 * z);
          ctx.fill();

          // Outer golden frame drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
          ctx.beginPath();
          ctx.roundRect(-boardW / 2 + 2 * z, -boardH / 2 + 2.5 * z, boardW, boardH, 6 * z);
          ctx.fill();

          // Deep royal navy & indigo gradient plaque background
          const boardGrad = ctx.createLinearGradient(
            -boardW / 2,
            -boardH / 2,
            boardW / 2,
            boardH / 2
          );
          boardGrad.addColorStop(0, '#0f172a');
          boardGrad.addColorStop(0.5, '#1e3a8a');
          boardGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = boardGrad;
          ctx.beginPath();
          ctx.roundRect(-boardW / 2, -boardH / 2, boardW, boardH, 6 * z);
          ctx.fill();

          // Double gold border
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2.0 * z;
          ctx.stroke();

          const innerPad = 3.2 * z;
          ctx.strokeStyle = 'rgba(254, 240, 138, 0.65)';
          ctx.lineWidth = 0.9 * z;
          ctx.beginPath();
          ctx.roundRect(
            -boardW / 2 + innerPad,
            -boardH / 2 + innerPad,
            boardW - innerPad * 2,
            boardH - innerPad * 2,
            4 * z
          );
          ctx.stroke();

          // Clip to the inner frame and pass maxWidth so the welcome text is 100% guaranteed inside the frame
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(
            -boardW / 2 + innerPad + 2 * z,
            -boardH / 2 + innerPad + 1 * z,
            boardW - (innerPad + 2 * z) * 2,
            boardH - (innerPad + 1 * z) * 2,
            3 * z
          );
          ctx.clip();
          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(titleText, 0, 0, boardW - 20 * z);
          ctx.restore();

          ctx.restore();
        } else if (item.type === 'town_rules_board') {
          // PAPAN PERATURAN KOTA & PANDUAN AKTIVITAS DI DEKAT GAPURA UTAMA [wx: 1.45, wy: 5.95]
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          ctx.save();

          // 1. Soft Ground Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 2 * z, 14 * z, 6 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Twin Sturdy Teak Timber Posts
          const postH = 36 * z;
          const postW = 3.6 * z;
          const leftPostX = pt.x - 10 * z;
          const rightPostX = pt.x + 10 * z;

          [leftPostX, rightPostX].forEach((px) => {
            // Post Footing Stone
            ctx.fillStyle = '#475569';
            ctx.fillRect(px - 3.2 * z, pt.y - 3 * z, 6.4 * z, 4 * z);
            // Wooden Post
            ctx.fillStyle = '#78350f';
            ctx.fillRect(px - postW / 2, pt.y - postH, postW, postH - 2 * z);
            ctx.fillStyle = '#92400e';
            ctx.fillRect(px - postW / 2 + 0.8 * z, pt.y - postH, postW * 0.45, postH - 2 * z);
          });

          // 3. Wooden Crossbars connecting posts
          ctx.fillStyle = '#451a03';
          ctx.fillRect(leftPostX - 1 * z, pt.y - 12 * z, (rightPostX - leftPostX) + 2 * z, 3 * z);
          ctx.fillRect(leftPostX - 1 * z, pt.y - postH + 6 * z, (rightPostX - leftPostX) + 2 * z, 3 * z);

          // 4. Main Notice Board Frame & Bulletin Surface
          const bW = 32 * z;
          const bH = 24 * z;
          const bY = pt.y - postH + 8 * z;

          // Frame drop shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.roundRect(pt.x - bW / 2 + 1.5 * z, bY + 1.5 * z, bW, bH, 4 * z);
          ctx.fill();

          // Heavy Teak Frame
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.roundRect(pt.x - bW / 2, bY, bW, bH, 4 * z);
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.2 * z;
          ctx.stroke();

          // Parchment Bulletin Board Face
          const innerW = bW - 4.5 * z;
          const innerH = bH - 4.5 * z;
          const innerX = pt.x - innerW / 2;
          const innerY = bY + 2.25 * z;
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(innerX, innerY, innerW, innerH);

          // Pinned Notices
          // Left Notice: 📜 Peraturan Kota
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(innerX + 1.5 * z, innerY + 1.5 * z, innerW * 0.46, innerH - 3 * z);
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 0.6 * z;
          ctx.strokeRect(innerX + 1.5 * z, innerY + 1.5 * z, innerW * 0.46, innerH - 3 * z);

          // Miniature text lines
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(innerX + 2.5 * z, innerY + 3.5 * z, innerW * 0.36, 1.2 * z);
          ctx.fillStyle = '#64748b';
          for (let li = 0; li < 4; li++) {
            ctx.fillRect(innerX + 2.5 * z, innerY + 6.5 * z + li * 2.2 * z, innerW * (0.38 - (li % 2) * 0.08), 0.9 * z);
          }
          // Red pushpin
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(innerX + 1.5 * z + innerW * 0.23, innerY + 2.2 * z, 1.1 * z, 0, Math.PI * 2);
          ctx.fill();

          // Right Notice: 🎒 Panduan Siswa & Guru
          ctx.fillStyle = '#f0fdf4';
          ctx.fillRect(innerX + innerW * 0.52, innerY + 1.5 * z, innerW * 0.44, innerH - 3 * z);
          ctx.strokeStyle = '#a7f3d0';
          ctx.lineWidth = 0.6 * z;
          ctx.strokeRect(innerX + innerW * 0.52, innerY + 1.5 * z, innerW * 0.44, innerH - 3 * z);

          ctx.fillStyle = '#065f46';
          ctx.fillRect(innerX + innerW * 0.55, innerY + 3.5 * z, innerW * 0.35, 1.2 * z);
          ctx.fillStyle = '#10b981';
          for (let li = 0; li < 4; li++) {
            ctx.fillRect(innerX + innerW * 0.55, innerY + 6.5 * z + li * 2.2 * z, innerW * (0.35 - (li % 2) * 0.06), 0.9 * z);
          }
          // Brass pushpin
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(innerX + innerW * 0.52 + innerW * 0.22, innerY + 2.2 * z, 1.1 * z, 0, Math.PI * 2);
          ctx.fill();

          // 5. Gabled Roof Canopy at Apex
          const roofW = bW + 8 * z;
          const roofApexY = bY - 8 * z;
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.moveTo(pt.x - roofW / 2, bY + 1 * z);
          ctx.lineTo(pt.x, roofApexY);
          ctx.lineTo(pt.x + roofW / 2, bY + 1 * z);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.4 * z;
          ctx.stroke();

          // Golden finial on roof peak
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(pt.x, roofApexY - 1 * z, 2.2 * z, 0, Math.PI * 2);
          ctx.fill();

          // 6. Overhead glowing lantern
          const lX = pt.x;
          const lY = roofApexY + 4 * z;
          const bGlow = ctx.createRadialGradient(lX, lY, 1 * z, lX, lY, 14 * z);
          bGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
          bGlow.addColorStop(0.5, 'rgba(245, 158, 11, 0.35)');
          bGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
          ctx.fillStyle = bGlow;
          ctx.beginPath();
          ctx.arc(lX, lY, 14 * z, 0, Math.PI * 2);
          ctx.fill();

          // 7. Floating Hover Badge: "📋 Papan Peraturan Kota" (compact & semi-transparent, fades after 5s stationary)
          const distToRulesBoard = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToRulesBoard < 2.35 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const hoverBounce = Math.sin(elapsed * 4) * 1.8 * z;
            const badgeY = roofApexY - 13 * z + hoverBounce;
            const bText = '📋 Papan Peraturan Kota';
            ctx.font = `bold ${Math.round(7.4 * z)}px sans-serif`;
            const tW = ctx.measureText(bText).width + 9 * z;
            const tH = 13.5 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
            ctx.beginPath();
            ctx.roundRect(pt.x - tW / 2, badgeY - tH / 2, tW, tH, 6.5 * z);
            ctx.fill();

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.7)';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            ctx.fillStyle = '#a7f3d0';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bText, pt.x, badgeY);
            ctx.restore();
          }

          ctx.restore();
        } else if (item.type === 'announcement_board') {
          // PAPAN PENGUMUMAN GURU DI DEKAT BALAI KOTA [wx: -1.55, wy: -3.45]
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          ctx.save();

          // 1. Soft Ground Shadow on Grass
          ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 2 * z, 15 * z, 6.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Twin Royal Navy & Gold Pillars
          const postH = 37 * z;
          const postW = 3.6 * z;
          const leftPostX = pt.x - 10.5 * z;
          const rightPostX = pt.x + 10.5 * z;

          [leftPostX, rightPostX].forEach((px) => {
            ctx.fillStyle = '#334155';
            ctx.fillRect(px - 3.2 * z, pt.y - 3 * z, 6.4 * z, 4 * z);
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(px - postW / 2, pt.y - postH, postW, postH - 2 * z);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(px - postW / 2 + 0.8 * z, pt.y - postH, postW * 0.4, postH - 2 * z);
          });

          // 3. Crossbars
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(leftPostX - 1 * z, pt.y - 12 * z, (rightPostX - leftPostX) + 2 * z, 3 * z);
          ctx.fillRect(leftPostX - 1 * z, pt.y - postH + 6 * z, (rightPostX - leftPostX) + 2 * z, 3 * z);

          // 4. Bulletin Board Frame (Royal Blue & Gold Trim)
          const bW = 34 * z;
          const bH = 24 * z;
          const bY = pt.y - postH + 7.5 * z;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.roundRect(pt.x - bW / 2 + 1.5 * z, bY + 1.5 * z, bW, bH, 4 * z);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(pt.x - bW / 2, bY, bW, bH, 4 * z);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.4 * z;
          ctx.stroke();

          // Inner cork / velvet board surface
          const innerW = bW - 4.5 * z;
          const innerH = bH - 4.5 * z;
          const innerX = pt.x - innerW / 2;
          const innerY = bY + 2.25 * z;
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(innerX, innerY, innerW, innerH);

          // Pinned Teacher Announcement Cards
          // Left Card (Gold/Amber urgent teacher notice)
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(innerX + 1.5 * z, innerY + 1.8 * z, innerW * 0.46, innerH - 3.6 * z);
          ctx.fillStyle = '#d97706';
          ctx.fillRect(innerX + 2.3 * z, innerY + 3.4 * z, innerW * 0.38, 1.4 * z);
          ctx.fillStyle = '#475569';
          for (let li = 0; li < 4; li++) {
            ctx.fillRect(innerX + 2.3 * z, innerY + 6.4 * z + li * 2.2 * z, innerW * (0.38 - (li % 2) * 0.08), 0.9 * z);
          }
          // Red pushpin
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(innerX + 1.5 * z + innerW * 0.23, innerY + 2.4 * z, 1.2 * z, 0, Math.PI * 2);
          ctx.fill();

          // Right Card (Sky Blue teacher schedule/mission notice)
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(innerX + innerW * 0.52, innerY + 1.8 * z, innerW * 0.44, innerH - 3.6 * z);
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(innerX + innerW * 0.55, innerY + 3.4 * z, innerW * 0.35, 1.4 * z);
          ctx.fillStyle = '#334155';
          for (let li = 0; li < 4; li++) {
            ctx.fillRect(innerX + innerW * 0.55, innerY + 6.4 * z + li * 2.2 * z, innerW * (0.35 - (li % 2) * 0.06), 0.9 * z);
          }
          // Gold pushpin
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(innerX + innerW * 0.52 + innerW * 0.22, innerY + 2.4 * z, 1.2 * z, 0, Math.PI * 2);
          ctx.fill();

          // 5. Classical Balai Kota Style Blue-Gold Gabled Canopy
          const roofW = bW + 8 * z;
          const roofApexY = bY - 8.5 * z;
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.moveTo(pt.x - roofW / 2, bY + 1 * z);
          ctx.lineTo(pt.x, roofApexY);
          ctx.lineTo(pt.x + roofW / 2, bY + 1 * z);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.5 * z;
          ctx.stroke();

          // Golden Megaphone / Bell Emblem at Roof Apex
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(pt.x, roofApexY - 1.2 * z, 2.5 * z, 0, Math.PI * 2);
          ctx.fill();

          // 6. Warm Overhead Spotlight Glow
          const lX = pt.x;
          const lY = roofApexY + 4 * z;
          const bGlow = ctx.createRadialGradient(lX, lY, 1 * z, lX, lY, 15 * z);
          bGlow.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
          bGlow.addColorStop(0.5, 'rgba(56, 189, 248, 0.35)');
          bGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = bGlow;
          ctx.beginPath();
          ctx.arc(lX, lY, 15 * z, 0, Math.PI * 2);
          ctx.fill();

          // 7. Floating Hover Badge: "📢 Papan Pengumuman Guru" (obeys 5s stationary smooth fade-out)
          const distToAnnBoard = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToAnnBoard < 2.65 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const hoverBounce = Math.sin(elapsed * 4.2) * 1.8 * z;
            const badgeY = roofApexY - 13 * z + hoverBounce;
            const bText = '📢 Papan Pengumuman Guru';
            ctx.font = `bold ${Math.round(7.4 * z)}px sans-serif`;
            const tW = ctx.measureText(bText).width + 10 * z;
            const tH = 13.5 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
            ctx.beginPath();
            ctx.roundRect(pt.x - tW / 2, badgeY - tH / 2, tW, tH, 6.5 * z);
            ctx.fill();

            ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();

            ctx.fillStyle = '#fde68a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(bText, pt.x, badgeY);
            ctx.restore();
          }

          ctx.restore();
        } else if (item.type === 'beringin_tree') {
          // =========================================================
          // POHON BERINGIN JURNAL HARIAN DI BELAKANG BALAI KOTA [wx: 0, wy: -5.8]
          // =========================================================
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          ctx.save();

          // 1. Soft Grand Ground Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 2, pt.y + 4 * z, 44 * z, 20 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Circular Stone / Wooden Garden Retaining Border around Tree Base
          ctx.fillStyle = isNight ? '#1e293b' : '#334155';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 2 * z, 32 * z, 15 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1.2 * z;
          ctx.stroke();

          // Inner rich dark soil ring
          ctx.fillStyle = isNight ? '#180f08' : '#2e190d';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 1 * z, 27 * z, 12 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 3. Sprawling Gnarled Banyan Roots, Broad Trunk & Spreading Upper Crown Branches
          const trunkH = 52 * z;
          const trunkBaseW = 30 * z;
          const trunkTopW = 18 * z;

          // Upper Spreading Wooden Crown Branches (Supporting the wide Beringin Canopy)
          const crownBranches = [
            { xEnd: -28, yEnd: -68, ctrlX: -16, ctrlY: -54, w: 6.5 },
            { xEnd: -14, yEnd: -78, ctrlX: -8, ctrlY: -62, w: 5.5 },
            { xEnd: 0, yEnd: -84, ctrlX: 0, ctrlY: -66, w: 6.5 },
            { xEnd: 14, yEnd: -78, ctrlX: 8, ctrlY: -62, w: 5.5 },
            { xEnd: 28, yEnd: -68, ctrlX: 16, ctrlY: -54, w: 6.5 },
          ];
          crownBranches.forEach((br) => {
            ctx.strokeStyle = isNight ? '#2b1406' : '#54260a';
            ctx.lineWidth = br.w * z;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x + br.ctrlX * 0.25 * z, pt.y - (trunkH - 8 * z));
            ctx.quadraticCurveTo(pt.x + br.ctrlX * z, pt.y + br.ctrlY * z, pt.x + br.xEnd * z, pt.y + br.yEnd * z);
            ctx.stroke();

            // Subtle sunlit branch bark highlight
            ctx.strokeStyle = isNight ? '#422006' : '#78350f';
            ctx.lineWidth = br.w * 0.38 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + (br.ctrlX * 0.25 - 0.8) * z, pt.y - (trunkH - 8 * z));
            ctx.quadraticCurveTo(
              pt.x + (br.ctrlX - 0.8) * z,
              pt.y + (br.ctrlY - 1) * z,
              pt.x + (br.xEnd - 0.8) * z,
              pt.y + (br.yEnd - 1) * z
            );
            ctx.stroke();
          });

          // Main Trunk Body
          ctx.fillStyle = isNight ? '#2b1406' : '#54260a';
          ctx.beginPath();
          ctx.moveTo(pt.x - trunkBaseW / 2, pt.y + 1 * z);
          // Left flared root
          ctx.quadraticCurveTo(pt.x - 18 * z, pt.y - 12 * z, pt.x - trunkTopW / 2, pt.y - trunkH);
          ctx.lineTo(pt.x + trunkTopW / 2, pt.y - trunkH);
          // Right flared root
          ctx.quadraticCurveTo(pt.x + 18 * z, pt.y - 12 * z, pt.x + trunkBaseW / 2, pt.y + 1 * z);
          ctx.closePath();
          ctx.fill();

          // Bark highlights & shadow ridges
          ctx.fillStyle = isNight ? '#1c0c03' : '#3d1a05';
          ctx.fillRect(pt.x + 1 * z, pt.y - trunkH, 4 * z, trunkH);
          ctx.fillStyle = isNight ? '#422006' : '#78350f';
          ctx.fillRect(pt.x - 5 * z, pt.y - trunkH + 4 * z, 2.5 * z, trunkH - 6 * z);

          // 4. Aerial Hanging Roots (Sulur Beringin)
          const aerialRoots = [
            { xOff: -24, topY: -54, botY: -2, width: 1.8 },
            { xOff: -16, topY: -50, botY: -1, width: 2.0 },
            { xOff: -10, topY: -54, botY: 1, width: 1.7 },
            { xOff: 10, topY: -52, botY: 1, width: 1.9 },
            { xOff: 16, topY: -49, botY: -1, width: 1.8 },
            { xOff: 24, topY: -53, botY: -2, width: 1.7 },
          ];
          aerialRoots.forEach((ar) => {
            const rx = pt.x + ar.xOff * z;
            const sway = Math.sin(elapsed * 2 + ar.xOff) * 1.2 * z;
            ctx.strokeStyle = isNight ? '#381a07' : '#6b320d';
            ctx.lineWidth = ar.width * z;
            ctx.beginPath();
            ctx.moveTo(rx, pt.y + ar.topY * z);
            ctx.quadraticCurveTo(rx + sway, pt.y + (ar.topY + ar.botY) * 0.5 * z, rx, pt.y + ar.botY * z);
            ctx.stroke();
          });

          // 5. Majestic Multi-Tiered Banyan Canopy Crown (Mahkota Rimbun Pohon Jurnal Diperbaiki)
          const drawFoliagePuff = (cx: number, cy: number, r: number, color: string) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.fill();
          };

          // Layer A: Deep Shadowed Under-Canopy Base Lobes (Wide spreading banyan skirt)
          const colLayerA = isNight ? '#022c22' : '#064e3b';
          [
            [-32, -62, 19],
            [-18, -60, 22],
            [0, -61, 24],
            [18, -60, 22],
            [32, -62, 19],
            [-26, -74, 21],
            [26, -74, 21],
          ].forEach(([dx, dy, r]) => {
            drawFoliagePuff(pt.x + dx * z, pt.y + dy * z, r * z, colLayerA);
          });

          // Layer B: Rich Emerald Mid-Canopy Domes
          const colLayerB = isNight ? '#065f46' : '#047857';
          [
            [-28, -68, 18],
            [-14, -71, 22],
            [0, -73, 25],
            [14, -71, 22],
            [28, -68, 18],
            [-18, -83, 19],
            [18, -83, 19],
            [0, -86, 23],
          ].forEach(([dx, dy, r]) => {
            drawFoliagePuff(pt.x + dx * z, pt.y + dy * z, r * z, colLayerB);
          });

          // Layer C: Lush Jade-Mint Upper Crown Lobes
          const colLayerC = isNight ? '#047857' : '#059669';
          [
            [-21, -74, 15],
            [-9, -79, 18],
            [9, -79, 18],
            [21, -74, 15],
            [-11, -90, 16],
            [11, -90, 16],
            [0, -94, 18],
          ].forEach(([dx, dy, r]) => {
            drawFoliagePuff(pt.x + dx * z, pt.y + dy * z, r * z, colLayerC);
          });

          // Layer D: Vibrant Sunlit Spring-Green Crown Highlights
          const colLayerD = isNight ? '#059669' : '#10b981';
          [
            [-15, -78, 11],
            [-4, -84, 13],
            [8, -83, 12],
            [16, -77, 10],
            [-7, -94, 12],
            [6, -93, 11],
            [0, -99, 13],
          ].forEach(([dx, dy, r]) => {
            drawFoliagePuff(pt.x + dx * z, pt.y + dy * z, r * z, colLayerD);
          });

          // Layer E: Soft Top Crown Sunlight Rim & Glowing Leaf Buds
          const colLayerE = isNight ? '#10b981' : '#34d399';
          [
            [-10, -97, 7.5],
            [7, -96, 7.0],
            [-2, -103, 8.5],
            [3, -102, 7.0],
          ].forEach(([dx, dy, r]) => {
            drawFoliagePuff(pt.x + dx * z, pt.y + dy * z, r * z, colLayerE);
          });

          // Delicate Golden-Mint Leaf Highlights & Hanging Wooden "POHON JURNAL" Plaque on Upper Trunk
          ctx.fillStyle = isNight ? '#34d399' : '#6ee7b7';
          [
            [-24, -76, 3.2],
            [-12, -96, 3.5],
            [-1, -106, 4.0],
            [12, -94, 3.2],
            [23, -75, 3.0],
          ].forEach(([dx, dy, r]) => {
            ctx.beginPath();
            ctx.arc(pt.x + dx * z, pt.y + dy * z, r * z, 0, Math.PI * 2);
            ctx.fill();
          });

          // Wooden "POHON JURNAL" Signboard nestled at the Crown Fork — strictly fitted & clipped inside frame
          const pohonJurnalFontPx = Math.max(3, Math.round(3.4 * z));
          ctx.font = `bold ${pohonJurnalFontPx}px sans-serif`;
          const pohonJurnalLabel = 'POHON JURNAL';
          const pjMetrics = ctx.measureText(pohonJurnalLabel);
          const pjBoardW = Math.max(30 * z, pjMetrics.width + 6 * z);
          const pjBoardH = 7.2 * z;
          const pjBoardX = pt.x - pjBoardW / 2;
          const pjBoardY = pt.y - 50.4 * z;

          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.roundRect(pjBoardX, pjBoardY, pjBoardW, pjBoardH, 2 * z);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 0.9 * z;
          ctx.stroke();

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(
            pjBoardX + 1.1 * z,
            pjBoardY + 0.8 * z,
            pjBoardW - 2.2 * z,
            pjBoardH - 1.6 * z,
            1.4 * z
          );
          ctx.clip();
          ctx.fillStyle = '#fef08a';
          ctx.font = `bold ${pohonJurnalFontPx}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(pohonJurnalLabel, pt.x, pjBoardY + pjBoardH / 2, pjBoardW - 3.6 * z);
          ctx.restore();

          // 6. Hanging Warm Glowing Paper Lanterns
          const lanterns = [
            { lx: pt.x - 25 * z, ly: pt.y - 50 * z },
            { lx: pt.x + 25 * z, ly: pt.y - 49 * z },
          ];
          lanterns.forEach((lan) => {
            // Cord
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(lan.lx, lan.ly - 8 * z);
            ctx.lineTo(lan.lx, lan.ly);
            ctx.stroke();

            // Glow
            const lGrad = ctx.createRadialGradient(lan.lx, lan.ly, 1 * z, lan.lx, lan.ly, 10 * z);
            lGrad.addColorStop(0, 'rgba(254, 240, 138, 0.9)');
            lGrad.addColorStop(0.4, 'rgba(245, 158, 11, 0.4)');
            lGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = lGrad;
            ctx.beginPath();
            ctx.arc(lan.lx, lan.ly, 10 * z, 0, Math.PI * 2);
            ctx.fill();

            // Lantern body
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(lan.lx - 2.5 * z, lan.ly - 3.5 * z, 5 * z, 7 * z);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(lan.lx - 2.5 * z, lan.ly - 3.5 * z, 5 * z, 7 * z);
          });

          // 7. REALTIME STICKY NOTES ON THE BERINGIN TRUNK!
          const notesToRender = stickyNotesRef.current || [];
          const noteCount = notesToRender.length;

          // Slot coordinates on the beringin trunk for sticky notes
          const noteSlots = [
            { dx: -7, dy: -32, angle: -0.15, defaultColor: '#fef08a' }, // top left
            { dx: 4, dy: -36, angle: 0.12, defaultColor: '#fbcfe8' },  // top right
            { dx: -8, dy: -20, angle: 0.08, defaultColor: '#bae6fd' },  // mid left
            { dx: 3, dy: -22, angle: -0.10, defaultColor: '#a7f3d0' },  // mid right
            { dx: -4, dy: -10, angle: -0.05, defaultColor: '#e9d5ff' }, // lower left
            { dx: 6, dy: -12, angle: 0.15, defaultColor: '#fed7aa' },   // lower right
            { dx: -12, dy: -26, angle: -0.20, defaultColor: '#fef08a' }, // side branch left
            { dx: 11, dy: -28, angle: 0.18, defaultColor: '#fbcfe8' },  // side branch right
          ];

          const visibleCount = Math.min(noteSlots.length, Math.max(3, noteCount));
          for (let ni = 0; ni < visibleCount; ni++) {
            const slot = noteSlots[ni];
            const actualNote = notesToRender[ni];
            const nx = pt.x + slot.dx * z;
            const ny = pt.y + slot.dy * z;
            const nW = 7.5 * z;
            const nH = 7.5 * z;
            const flutter = Math.sin(elapsed * 3 + ni * 1.5) * 0.04;
            const totalAngle = slot.angle + flutter;

            ctx.save();
            ctx.translate(nx, ny);
            ctx.rotate(totalAngle);

            // Drop shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
            ctx.fillRect(-nW / 2 + 0.8 * z, -nH / 2 + 0.8 * z, nW, nH);

            // Note paper background
            let noteBg = slot.defaultColor;
            if (actualNote) {
              if (actualNote.color === 'pink') noteBg = '#fbcfe8';
              else if (actualNote.color === 'blue') noteBg = '#bae6fd';
              else if (actualNote.color === 'green') noteBg = '#a7f3d0';
              else if (actualNote.color === 'purple') noteBg = '#e9d5ff';
              else noteBg = '#fef08a';
            }
            ctx.fillStyle = noteBg;
            ctx.fillRect(-nW / 2, -nH / 2, nW, nH);
            ctx.strokeStyle = 'rgba(0,0,0,0.15)';
            ctx.lineWidth = 0.5 * z;
            ctx.strokeRect(-nW / 2, -nH / 2, nW, nH);

            // Red pushpin
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -nH / 2 + 1.2 * z, 0.9 * z, 0, Math.PI * 2);
            ctx.fill();

            // 2 tiny pencil lines
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(-nW / 2 + 1.2 * z, -nH / 2 + 3.2 * z, nW - 2.4 * z, 0.6 * z);
            ctx.fillRect(-nW / 2 + 1.2 * z, -nH / 2 + 4.8 * z, nW - 3.8 * z, 0.6 * z);

            ctx.restore();
          }

          // 8. Floating Hover Tag: "🌳 Pohon Beringin Jurnal Harian" — muncul saat avatar mendekati Pohon Beringin & fades after 5s stationary
          const distToBeringin = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToBeringin < 2.35 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const treeHoverBounce = Math.sin(elapsed * 3.5) * 1.6 * z;
            const tagY = pt.y - 116 * z + treeHoverBounce;
            const tagTitle = '🌳 Pohon Beringin Jurnal Harian';
            const subText = `${noteCount} Catatan • +1 XP`;

            ctx.font = `bold ${Math.round(7.4 * z)}px sans-serif`;
            const titleWidth = ctx.measureText(tagTitle).width;
            ctx.font = `bold ${Math.round(6.6 * z)}px sans-serif`;
            const subWidth = ctx.measureText(subText).width;
            const bannerW = Math.max(titleWidth, subWidth) + 12 * z;
            const bannerH = 21 * z;

            // Banner capsule background (smaller & slightly transparent)
            ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
            ctx.beginPath();
            ctx.roundRect(pt.x - bannerW / 2, tagY - bannerH / 2, bannerW, bannerH, 8 * z);
            ctx.fill();

            ctx.strokeStyle = 'rgba(16, 185, 129, 0.72)';
            ctx.lineWidth = 0.95 * z;
            ctx.stroke();

            // Title
            ctx.fillStyle = '#a7f3d0';
            ctx.font = `bold ${Math.round(7.4 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tagTitle, pt.x, tagY - 3.2 * z);

            // Subtitle / XP badge
            ctx.fillStyle = '#fde047';
            ctx.font = `bold ${Math.round(6.6 * z)}px sans-serif`;
            ctx.fillText(subText, pt.x, tagY + 4.8 * z);
            ctx.restore();
          }

          ctx.restore();
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

          // Floating Pill Badge: 📖 Sudut Literasi ONLY when player approaches & not stationary > 5s
          const distToLiteracy = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToLiteracy < 2.2 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const litTagY = pt.y - 52 * z;
            const litLabel = '📖 Sudut Literasi';
            ctx.font = `bold ${Math.round(7.5 * z)}px sans-serif`;
            const litM = ctx.measureText(litLabel);
            const litW = litM.width + 10 * z;
            const litH = 14 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
            ctx.beginPath();
            ctx.roundRect(pt.x - litW / 2, litTagY - litH / 2, litW, litH, 7 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.68)';
            ctx.lineWidth = 0.95 * z;
            ctx.stroke();

            ctx.fillStyle = '#bae6fd';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(litLabel, pt.x, litTagY);
            ctx.restore();
          }
          ctx.restore();
        } else if (item.type === 'fishing_spot') {
          // DERMAGA PEMANCINGAN 1 PETAK DI SUNGAI REFLEKSIA (Ukuran 1 Petak Isometrik Rapi & Papan "Sungai Refleksia" di Dalam Frame)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          ctx.save();

          // 1. SWIMMING KOI & GENTLE RIPPLES IN SUNGAI REFLEKSIA NEAR 1-TILE PIER TIP
          const pondX = pt.x + 28 * z;
          const pondY = pt.y + 8 * z;

          // Subtle Minimalist Water Ripples off the 1-tile pier tip
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
          ctx.lineWidth = 0.85 * z;
          for (let wp = 0; wp < 2; wp++) {
            const wRadius = ((elapsed * 4.5 + wp * 16) % (30 * z));
            ctx.beginPath();
            ctx.ellipse(pondX, pondY, wRadius, wRadius * 0.48, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 3 Graceful Minimalist Koi Fish Silhouettes swimming near the 1-tile pier
          const koiConfigs = [
            { color: '#f97316', spot: '#ffffff', speed: 0.52, radius: 13 },
            { color: '#fbbf24', spot: '#fef08a', speed: 0.44, radius: 19 },
            { color: '#f8fafc', spot: '#ef4444', speed: 0.58, radius: 9 },
          ];

          koiConfigs.forEach((koi, kIdx) => {
            const kAngle = elapsed * koi.speed + kIdx * ((Math.PI * 2) / 3);
            const kDist = koi.radius * z;
            const kx = pondX + 4 * z + Math.cos(kAngle) * kDist;
            const ky = pondY + Math.sin(kAngle) * (kDist * 0.48);
            const heading = kAngle + Math.PI / 2;
            const tailWag = Math.sin(elapsed * 6.5 + kIdx) * 1.6 * z;

            ctx.fillStyle = koi.color;
            ctx.beginPath();
            ctx.ellipse(kx, ky, 3.2 * z, 1.4 * z, heading, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = koi.spot;
            ctx.beginPath();
            ctx.arc(kx + Math.cos(heading) * 0.8 * z, ky + Math.sin(heading) * 0.8 * z, 0.95 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = koi.color;
            ctx.lineWidth = 1.05 * z;
            ctx.beginPath();
            ctx.moveTo(kx - Math.cos(heading) * 2.6 * z, ky - Math.sin(heading) * 2.6 * z);
            ctx.lineTo(
              kx - Math.cos(heading) * 4.8 * z + tailWag * 0.5,
              ky - Math.sin(heading) * 4.8 * z + tailWag * 0.3
            );
            ctx.stroke();
          });

          // 2. 1-TILE (1 PETAK) ISOMETRIC TEAK TIMBER FISHING PLATFORM
          // 1 petak isometric diamond dimensions: halfW = 28 * z, halfH = 14 * z
          const tileHalfW = 28 * z;
          const tileHalfH = 14 * z;
          const pNorth = { x: pt.x, y: pt.y - tileHalfH };
          const pEast = { x: pt.x + tileHalfW, y: pt.y };
          const pSouth = { x: pt.x, y: pt.y + tileHalfH };
          const pWest = { x: pt.x - tileHalfW, y: pt.y };

          // 4 corner timber pilings supporting the 1-tile deck
          const pierPilings = [
            { px: pt.x - 16 * z, py: pt.y + 4 * z },
            { px: pt.x, py: pt.y + 12 * z },
            { px: pt.x + 16 * z, py: pt.y + 4 * z },
            { px: pt.x + 24 * z, py: pt.y - 1 * z },
          ];
          for (const pil of pierPilings) {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pil.px - 1.5 * z, pil.py, 3.0 * z, 9.0 * z);
            ctx.strokeStyle = 'rgba(224, 242, 254, 0.38)';
            ctx.lineWidth = 0.75 * z;
            ctx.beginPath();
            ctx.ellipse(pil.px, pil.py + 8.5 * z, 3.8 * z, 1.5 * z, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // 3D Side fascia of the 1-Tile Wooden Fishing Deck
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.moveTo(pWest.x, pWest.y);
          ctx.lineTo(pSouth.x, pSouth.y);
          ctx.lineTo(pEast.x, pEast.y);
          ctx.lineTo(pEast.x, pEast.y + 3.8 * z);
          ctx.lineTo(pSouth.x, pSouth.y + 3.8 * z);
          ctx.lineTo(pWest.x, pWest.y + 3.8 * z);
          ctx.closePath();
          ctx.fill();

          // Top Teak Decking Surface of the 1-Tile (1 Petak) Fishing Spot
          const pierGrad = ctx.createLinearGradient(pWest.x, pNorth.y, pEast.x, pSouth.y);
          pierGrad.addColorStop(0, isNight ? '#78350f' : '#b45309');
          pierGrad.addColorStop(0.55, isNight ? '#92400e' : '#d97706');
          pierGrad.addColorStop(1, isNight ? '#b45309' : '#f59e0b');
          ctx.fillStyle = pierGrad;
          ctx.beginPath();
          ctx.moveTo(pNorth.x, pNorth.y);
          ctx.lineTo(pEast.x, pEast.y);
          ctx.lineTo(pSouth.x, pSouth.y);
          ctx.lineTo(pWest.x, pWest.y);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = isNight ? '#fbbf24' : '#fef3c7';
          ctx.lineWidth = 0.85 * z;
          ctx.stroke();

          // Crisp isometric plank slat lines across the 1-tile deck (7 planks)
          ctx.strokeStyle = 'rgba(69, 26, 3, 0.48)';
          ctx.lineWidth = 0.75 * z;
          for (let s = 1; s < 7; s++) {
            const t = s / 7;
            const lx = pNorth.x + (pEast.x - pNorth.x) * t;
            const ly = pNorth.y + (pEast.y - pNorth.y) * t;
            const rx = pWest.x + (pSouth.x - pWest.x) * t;
            const ry = pWest.y + (pSouth.y - pWest.y) * t;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(rx, ry);
            ctx.stroke();
          }

          // Minimalist Low-Profile Pier Bollards & Handrail along North-East Edge of 1-Tile Deck
          const bollardCoords = [
            [pNorth.x + (pEast.x - pNorth.x) * 0.12, pNorth.y + (pEast.y - pNorth.y) * 0.12],
            [pNorth.x + (pEast.x - pNorth.x) * 0.5, pNorth.y + (pEast.y - pNorth.y) * 0.5],
            [pNorth.x + (pEast.x - pNorth.x) * 0.88, pNorth.y + (pEast.y - pNorth.y) * 0.88],
          ];
          ctx.strokeStyle = isNight ? '#94a3b8' : '#cbd5e1';
          ctx.lineWidth = 1.15 * z;
          ctx.beginPath();
          ctx.moveTo(bollardCoords[0][0], bollardCoords[0][1] - 6.2 * z);
          ctx.lineTo(bollardCoords[1][0], bollardCoords[1][1] - 6.2 * z);
          ctx.lineTo(bollardCoords[2][0], bollardCoords[2][1] - 6.2 * z);
          ctx.stroke();

          bollardCoords.forEach(([bx, by]) => {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(bx - 1.1 * z, by - 7.0 * z, 2.2 * z, 7.0 * z);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(bx - 1.1 * z, by - 7.8 * z, 2.2 * z, 1.0 * z);
          });

          // Wooden Angler Stool & Cyan Bait Bucket on the 1-Tile Deck
          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.roundRect(pt.x - 5 * z, pt.y + 0.5 * z, 6.5 * z, 3.8 * z, 1.1 * z);
          ctx.fill();
          ctx.strokeStyle = '#fde68a';
          ctx.lineWidth = 0.6 * z;
          ctx.stroke();

          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.roundRect(pt.x + 5 * z, pt.y + 2.5 * z, 4.2 * z, 4.4 * z, 1.0 * z);
          ctx.fill();
          ctx.strokeStyle = '#bae6fd';
          ctx.lineWidth = 0.65 * z;
          ctx.stroke();

          // Framed Wooden Signboard "Sungai Refleksia" on the North-West corner of the 1-Tile Pier (Strictly fitted inside frame)
          const signPtX = pt.x - 16 * z;
          const signPtY = pt.y - 8.5 * z;
          const signBoxW = 46 * z;
          const signBoxH = 11.5 * z;
          const signBoxX = signPtX - signBoxW / 2;
          const signBoxY = signPtY - 20.5 * z;

          // Dual timber support posts
          ctx.fillStyle = '#451a03';
          ctx.fillRect(signPtX - 10 * z, signPtY - 10 * z, 1.8 * z, 10 * z);
          ctx.fillRect(signPtX + 8.2 * z, signPtY - 10 * z, 1.8 * z, 10 * z);

          // Outer & Inner Signboard Frame
          ctx.fillStyle = isNight ? '#1e293b' : '#78350f';
          ctx.beginPath();
          ctx.roundRect(signBoxX, signBoxY, signBoxW, signBoxH, 2.4 * z);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 0.9 * z;
          ctx.stroke();

          // Strictly clip "Sungai Refleksia" inside the frame
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(signBoxX + 1.5 * z, signBoxY + 1.0 * z, signBoxW - 3.0 * z, signBoxH - 2.0 * z, 1.6 * z);
          ctx.clip();
          ctx.fillStyle = '#fef3c7';
          ctx.font = `bold ${Math.max(4, Math.round(5.0 * z))}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('Sungai Refleksia', signPtX, signBoxY + signBoxH / 2, signBoxW - 4.5 * z);
          ctx.restore();

          // Resting minimalist carbon/bamboo fishing rods when player is not actively fishing
          if (!isFishingRef.current) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 8 * z, pt.y + 4 * z);
            ctx.lineTo(pt.x + 25 * z, pt.y - 2 * z);
            ctx.moveTo(pt.x + 11 * z, pt.y + 2 * z);
            ctx.lineTo(pt.x + 27 * z, pt.y - 4 * z);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 0.65 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 25 * z, pt.y - 2 * z);
            ctx.lineTo(pt.x + 26 * z, pt.y + 8 * z);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(pt.x + 26 * z, pt.y + 8 * z, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();
          }

          // 3. FLOATING BADGE: 🎣 Spot Memancing • Sungai Refleksia ONLY when player approaches & not stationary > 5s
          const distToFishing = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          if (distToFishing < 2.3 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const dockTagY = pt.y - 38 * z;
            const dockLabel = '🎣 Spot Memancing • Sungai Refleksia';
            ctx.font = `bold ${Math.round(6.8 * z)}px sans-serif`;
            const dM = ctx.measureText(dockLabel);
            const dW = dM.width + 10 * z;
            const dH = 13 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
            ctx.beginPath();
            ctx.roundRect(pt.x - dW / 2, dockTagY - dH / 2, dW, dH, 6.5 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.68)';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            ctx.fillStyle = '#bae6fd';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(dockLabel, pt.x, dockTagY);
            ctx.restore();
          }
          ctx.restore();
        } else if (item.type === 'dry_leaf') {
          // AESTHETIC GOLDEN-AMBER DRY LEAF (Daun Kering Gugur yang Rapi & Bersih di Tepi Taman)
          const leaf = item.leaf;
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          let fadeAlpha = 1.0;
          let liftY = 0;
          if (leaf.fadeStartTime !== null) {
            const fadeElapsed = (currentTime - leaf.fadeStartTime) / 1000;
            fadeAlpha = Math.max(0, 1 - fadeElapsed / 0.85);
            liftY = fadeElapsed * 18 * z;
          }

          if (fadeAlpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = fadeAlpha;
            const gentleSway = Math.sin(elapsed * 2.2 + leaf.id) * 0.08;
            ctx.translate(pt.x, pt.y - liftY);
            ctx.rotate(leaf.rot + gentleSway);

            // Subtle ground shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
            ctx.beginPath();
            ctx.ellipse(0.5 * z, 1.2 * z, 5.2 * z, 2.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Warm autumn amber leaf body (clean & scenic)
            ctx.fillStyle = '#d97706';
            ctx.beginPath();
            ctx.moveTo(-5.2 * z, 0);
            ctx.quadraticCurveTo(0, -4.2 * z, 5.5 * z, 0);
            ctx.quadraticCurveTo(0, 4.2 * z, -5.2 * z, 0);
            ctx.closePath();
            ctx.fill();

            // Golden inner highlight
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.ellipse(-0.5 * z, -0.6 * z, 3.2 * z, 1.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Delicate leaf stem & center vein
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.moveTo(-6.8 * z, 0.4 * z);
            ctx.lineTo(4.2 * z, 0);
            ctx.stroke();

            ctx.restore();

            // Show subtle floating pill when avatar is close or fading out
            const distPlayerToLeaf = Math.hypot(player.wx - item.wx, player.wy - item.wy);
            if (leaf.fadeStartTime !== null) {
              ctx.save();
              ctx.globalAlpha = fadeAlpha;
              ctx.font = `bold ${Math.round(8.5 * z)}px sans-serif`;
              ctx.fillStyle = '#fef08a';
              ctx.textAlign = 'center';
              ctx.fillText('🍂 Diambil!', pt.x, pt.y - 12 * z - liftY);
              ctx.restore();
            } else if (distPlayerToLeaf < 1.35 && overheadTagAlpha > 0.005) {
              const badgeY = pt.y - 14 * z;
              const badgeText = `🍂 Daun Kering (${pickedDryLeavesCountRef.current}/5)`;
              ctx.save();
              ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
              ctx.font = `bold ${Math.round(7.5 * z)}px sans-serif`;
              const bm = ctx.measureText(badgeText);
              const bw = bm.width + 8 * z;
              const bh = 12 * z;
              ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
              ctx.beginPath();
              ctx.roundRect(pt.x - bw / 2, badgeY - bh / 2, bw, bh, 6 * z);
              ctx.fill();
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 1 * z;
              ctx.stroke();
              ctx.fillStyle = '#fef3c7';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(badgeText, pt.x, badgeY);
              ctx.restore();
            }
          }
        } else if (item.type === 'tree') {
          // Double-Sphere Tree (Minimalist Watering + 5-Minute Ripe Apples (+2 XP) with Smooth Fade-Out Animation when Picked)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const cycle = treeCyclesRef.current[item.index];
          const elapsedSinceWatered = cycle && cycle.lastWateredTime ? (currentTime - cycle.lastWateredTime) / 1000 : 999;
          const isRecentlyWatered = elapsedSinceWatered >= 0 && elapsedSinceWatered < 1.8;

          const hasRipeApples = Boolean(cycle?.hasRipeApples);
          let harvestFadeElapsed = -1;
          if (cycle && cycle.harvestFadeStartTime !== null && cycle.harvestFadeStartTime !== undefined) {
            harvestFadeElapsed = (currentTime - cycle.harvestFadeStartTime) / 1000;
            if (harvestFadeElapsed >= 1.5) {
              cycle.harvestFadeStartTime = null;
              harvestFadeElapsed = -1;
            }
          }
          const isFadingHarvest = harvestFadeElapsed >= 0 && harvestFadeElapsed < 1.5;
          const hasApples = hasRipeApples || isFadingHarvest;
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

          const isAutumnTree = Boolean(cycle?.isAutumn);

          // Fallen autumn leaves scattered neatly around the base of the trunk when tree is in autumn/fallen-leaf state
          if (isAutumnTree) {
            const fallenLeafOffsets: Array<[number, number, string, number]> = [
              [-11, 2.5, '#ea580c', 0.3],
              [-5, 4.8, '#f59e0b', -0.4],
              [4, 4.2, '#d97706', 0.5],
              [10, 2.0, '#c2410c', -0.2],
              [-2, 1.5, '#fbbf24', 0.1],
            ];
            fallenLeafOffsets.forEach(([lx, ly, lCol, lRot]) => {
              ctx.save();
              ctx.translate(pt.x + lx * z, pt.y + ly * z);
              ctx.rotate(lRot);
              ctx.fillStyle = lCol;
              ctx.beginPath();
              ctx.ellipse(0, 0, 2.8 * z, 1.5 * z, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            });
          }

          // Lower large sphere (Emerald green OR Warm Autumn Fallen-Leaf Orange/Terracotta)
          ctx.fillStyle = isAutumnTree
            ? (isNight ? '#9a3412' : '#c2410c')
            : isLush
            ? '#047857'
            : (isNight ? '#064e3b' : '#059669');
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 32 * z, 22 * z, 0, Math.PI * 2);
          ctx.fill();

          // Lower sphere highlight
          ctx.fillStyle = isAutumnTree
            ? (isNight ? '#c2410c' : '#ea580c')
            : isLush
            ? '#10b981'
            : (isNight ? '#047857' : '#10b981');
          ctx.beginPath();
          ctx.arc(pt.x - 4 * z, pt.y - 36 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper overlapping sphere
          ctx.fillStyle = isAutumnTree
            ? (isNight ? '#d97706' : '#f59e0b')
            : isLush
            ? '#10b981'
            : (isNight ? '#047857' : '#10b981');
          ctx.beginPath();
          ctx.arc(pt.x + 1 * z, pt.y - 48 * z, 16 * z, 0, Math.PI * 2);
          ctx.fill();

          // Upper sphere soft top highlight
          ctx.fillStyle = isAutumnTree
            ? (isNight ? '#f59e0b' : '#fbbf24')
            : isLush
            ? '#34d399'
            : (isNight ? '#059669' : '#34d399');
          ctx.beginPath();
          ctx.arc(pt.x - 2 * z, pt.y - 52 * z, 11 * z, 0, Math.PI * 2);
          ctx.fill();

          // Top foliage bud
          ctx.fillStyle = isAutumnTree
            ? (isNight ? '#fbbf24' : '#fde047')
            : isLush
            ? '#6ee7b7'
            : (isNight ? '#10b981' : '#6ee7b7');
          ctx.beginPath();
          ctx.arc(pt.x, pt.y - 59 * z, 6 * z, 0, Math.PI * 2);
          ctx.fill();

          // 1. EFEK POHON TERSIRAM MINIMALIS (Clean & subtle for 1.8s when watered)
          if (isRecentlyWatered) {
            const fade = Math.max(0, 1 - elapsedSinceWatered / 1.8);
            ctx.save();
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

            const ringR = (10 + (elapsedSinceWatered / 1.8) * 14) * z;
            ctx.strokeStyle = `rgba(125, 211, 252, ${0.55 * fade})`;
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 38 * z, ringR, ringR * 0.45, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          }

          // 2. BUAH APEL MERAH (Muncul setiap 5 menit atau setelah disiram, dapat dipetik siswa untuk +2 XP dengan animasi buah memudar)
          if (hasApples) {
            let appleAlpha = 1.0;
            let harvestFloatY = 0;
            if (isFadingHarvest) {
              // Smooth fade-out & gentle upward float animation after student harvests the apples
              appleAlpha = Math.max(0, 1 - harvestFadeElapsed / 1.5);
              harvestFloatY = -harvestFadeElapsed * 14 * z;
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
                const appleY = pt.y + ay * z + appleBob + harvestFloatY;

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

              if (isFadingHarvest) {
                ctx.font = `bold ${Math.round(9 * z)}px sans-serif`;
                ctx.fillStyle = '#fde047';
                ctx.textAlign = 'center';
                ctx.fillText('🍎 Dipetik! +2 XP ✨', pt.x, pt.y - 66 * z + harvestFloatY);
              }

              ctx.restore();
            }
          }

          // Minimalist status pill above tree when near, when autumn leaves need watering, or when ripe apples are ready
          const distPlayerToThisTree = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          const activeCount = cycle ? cycle.count : 0;
          if (((distPlayerToThisTree < 1.65 && (activeCount > 0 || hasRipeApples || isAutumnTree)) || isRecentlyWatered) && (overheadTagAlpha > 0.005 || hasRipeApples)) {
            const badgeText = hasRipeApples
              ? '🍎 Petik Apel (+2 XP)'
              : isAutumnTree
              ? '🍂 Siram agar Hijau'
              : `💧 ${activeCount}/3`;
            const badgeY = pt.y - 68 * z;
            ctx.save();
            if (!hasRipeApples) {
              ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            }
            ctx.font = `bold ${Math.round(7.5 * z)}px sans-serif`;
            const bm = ctx.measureText(badgeText);
            const bw = bm.width + 8 * z;
            const bh = 12 * z;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
            ctx.beginPath();
            ctx.roundRect(pt.x - bw / 2, badgeY - bh / 2, bw, bh, 6 * z);
            ctx.fill();
            ctx.strokeStyle = hasRipeApples ? '#ef4444' : isAutumnTree ? '#f59e0b' : '#38bdf8';
            ctx.lineWidth = 1 * z;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(badgeText, pt.x, badgeY);
            ctx.restore();
          }

          ctx.restore();
        } else if (item.type === 'wilderness_tree') {
          const wt = item.tree;
          const pt = toScreen(wt.wx, wt.wy, wt.alt, camera.x, camera.y);
          const z = zoomLevelRef.current * wt.scale;
          const distToPlayer = Math.hypot(player.wx - wt.wx, player.wy - wt.wy);
          const isTransparent = wt.alt === 0 && distToPlayer < 1.35 && player.wy < wt.wy;
          const sway = Math.sin(elapsed * 1.45 + wt.wx * 0.7 + wt.wy * 0.5) * 1.15 * z;

          ctx.save();
          if (isTransparent) {
            ctx.globalAlpha = 0.52;
          }

          // Ground shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 2 * z, pt.y + 2 * z, 11 * z, 5.5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Timber trunk
          ctx.fillStyle = isNight ? '#3e2723' : '#5d4037';
          ctx.fillRect(pt.x - 2.4 * z, pt.y - 14 * z, 4.8 * z, 14 * z);

          // 3 emerald shade variations for rich wilderness depth
          const darkFoliage =
            wt.shade === 0
              ? isNight ? '#064e3b' : '#14532d'
              : wt.shade === 1
              ? isNight ? '#065f46' : '#166534'
              : isNight ? '#115e59' : '#0f766e';
          const midFoliage =
            wt.shade === 0
              ? isNight ? '#047857' : '#15803d'
              : wt.shade === 1
              ? isNight ? '#059669' : '#16a34a'
              : isNight ? '#0d9488' : '#0d9488';
          const lightFoliage =
            wt.shade === 0
              ? isNight ? '#10b981' : '#22c55e'
              : wt.shade === 1
              ? isNight ? '#34d399' : '#4ade80'
              : isNight ? '#2dd4bf' : '#34d399';

          if (wt.kind === 'banyan') {
            // POHON BERINGIN BESAR HUTAN BELANTARA (Giant Wilderness Banyan Tree with Fluted Trunk, Aerial Roots & Lush Multi-Tiered Crown)
            // Enlarged forest floor shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
            ctx.beginPath();
            ctx.ellipse(pt.x + 2 * z, pt.y + 2.5 * z, 20 * z, 9.5 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Flared banyan buttress roots & thick trunk
            ctx.fillStyle = isNight ? '#2b1406' : '#4a2511';
            ctx.beginPath();
            ctx.moveTo(pt.x - 11 * z, pt.y + 2 * z);
            ctx.quadraticCurveTo(pt.x - 6 * z, pt.y - 6 * z, pt.x - 4.8 * z, pt.y - 24 * z);
            ctx.lineTo(pt.x + 4.8 * z, pt.y - 24 * z);
            ctx.quadraticCurveTo(pt.x + 6 * z, pt.y - 6 * z, pt.x + 11 * z, pt.y + 2 * z);
            ctx.closePath();
            ctx.fill();

            // Spreading primary limbs
            ctx.strokeStyle = isNight ? '#2b1406' : '#4a2511';
            ctx.lineWidth = 2.8 * z;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x - 2 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x - 14 * z, pt.y - 29 * z);
            ctx.moveTo(pt.x + 2 * z, pt.y - 20 * z);
            ctx.lineTo(pt.x + 14 * z, pt.y - 29 * z);
            ctx.stroke();

            // Hanging aerial banyan roots (Sulur Akar Gantung Beringin)
            ctx.strokeStyle = isNight ? '#3e2723' : '#6d4c41';
            ctx.lineWidth = 1.05 * z;
            const rootOffsets = [-13, -8, 8, 13];
            for (let ri = 0; ri < rootOffsets.length; ri++) {
              const rx = pt.x + rootOffsets[ri] * z;
              ctx.beginPath();
              ctx.moveTo(rx, pt.y - 26 * z);
              ctx.quadraticCurveTo(rx + sway * 0.4, pt.y - 13 * z, rx, pt.y - 1 * z);
              ctx.stroke();
            }

            // Layer 1: Wide shadowed under-canopy banyan lobes
            ctx.fillStyle = darkFoliage;
            ctx.beginPath();
            ctx.arc(pt.x - 14 * z + sway * 0.35, pt.y - 28 * z, 11.5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 14 * z + sway * 0.35, pt.y - 28 * z, 11.5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + sway * 0.35, pt.y - 29 * z, 13.5 * z, 0, Math.PI * 2);
            ctx.fill();

            // Layer 2: Rich emerald mid-crown domes
            ctx.fillStyle = midFoliage;
            ctx.beginPath();
            ctx.arc(pt.x - 9 * z + sway * 0.55, pt.y - 35 * z, 11.5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 9 * z + sway * 0.55, pt.y - 35 * z, 11.5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + sway * 0.65, pt.y - 39 * z, 13 * z, 0, Math.PI * 2);
            ctx.fill();

            // Layer 3: Sunlit top foliage crown highlights
            ctx.fillStyle = lightFoliage;
            ctx.beginPath();
            ctx.arc(pt.x - 5 * z + sway * 0.75, pt.y - 42 * z, 8.5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 5 * z + sway * 0.75, pt.y - 41 * z, 8.0 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + sway * 0.85, pt.y - 46 * z, 8.5 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (wt.kind === 'pine') {
            // Minimalist 3-tiered evergreen mountain pine cone
            const tiers = [
              { baseY: -11 * z, tipY: -28 * z, halfW: 13.5 * z, fill: darkFoliage },
              { baseY: -21 * z, tipY: -38 * z, halfW: 10.5 * z, fill: midFoliage },
              { baseY: -30 * z, tipY: -47 * z, halfW: 7.5 * z, fill: lightFoliage },
            ];
            for (let ti = 0; ti < tiers.length; ti++) {
              const tr = tiers[ti];
              const tipSway = sway * (0.45 + ti * 0.3);
              ctx.fillStyle = tr.fill;
              ctx.beginPath();
              ctx.moveTo(pt.x + tipSway, pt.y + tr.tipY);
              ctx.lineTo(pt.x + tr.halfW + tipSway * 0.35, pt.y + tr.baseY);
              ctx.lineTo(pt.x, pt.y + tr.baseY + 2.5 * z);
              ctx.lineTo(pt.x - tr.halfW + tipSway * 0.35, pt.y + tr.baseY);
              ctx.closePath();
              ctx.fill();
            }
          } else {
            // Minimalist layered woodland broadleaf canopy
            ctx.fillStyle = darkFoliage;
            ctx.beginPath();
            ctx.arc(pt.x - 6.5 * z + sway * 0.4, pt.y - 21 * z, 9.5 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 6.5 * z + sway * 0.4, pt.y - 21 * z, 9.5 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = midFoliage;
            ctx.beginPath();
            ctx.arc(pt.x + sway * 0.7, pt.y - 27 * z, 11.5 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = lightFoliage;
            ctx.beginPath();
            ctx.arc(pt.x - 2 * z + sway * 0.85, pt.y - 31 * z, 7.5 * z, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        } else if (item.type === 'hutan_sign') {
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          ctx.save();

          // Soft shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 1.5 * z, 12 * z, 5 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Dual timber posts
          ctx.fillStyle = isNight ? '#5c280b' : '#78350f';
          ctx.fillRect(pt.x - 9 * z, pt.y - 22 * z, 2.6 * z, 22 * z);
          ctx.fillRect(pt.x + 6.4 * z, pt.y - 22 * z, 2.6 * z, 22 * z);

          // Framed wooden signboard
          const bw = 64 * z;
          const bh = 14 * z;
          const bx = pt.x - bw / 2;
          const by = pt.y - 31 * z;
          ctx.fillStyle = isNight ? '#1e293b' : '#451a03';
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 1.2 * z;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 3.5 * z);
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.beginPath();
          ctx.roundRect(bx + 1.5 * z, by + 1 * z, bw - 3 * z, bh - 2 * z, 2 * z);
          ctx.clip();
          ctx.font = `bold ${Math.max(5, Math.round(6.2 * z))}px sans-serif`;
          ctx.fillStyle = '#bbf7d0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🌲 Hutan Refleksia', pt.x, by + bh / 2, bw - 5 * z);
          ctx.restore();

          ctx.restore();
        } else if (item.type === 'wilderness_fence_bay') {
          const p1 = toScreen(item.wx1, item.wy, 0, camera.x, camera.y);
          const p2 = toScreen(item.wx2, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          ctx.save();

          // 1. Soft ground shadow along minimalist fence bay
          ctx.strokeStyle = 'rgba(15, 23, 42, 0.22)';
          ctx.lineWidth = 3.6 * z;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y + 1.6 * z);
          ctx.lineTo(p2.x, p2.y + 1.6 * z);
          ctx.stroke();

          // 2. Minimalist architectural stone curb plinth at ground level
          ctx.fillStyle = isNight ? '#334155' : '#cbd5e1';
          ctx.strokeStyle = isNight ? '#1e293b' : '#94a3b8';
          ctx.lineWidth = 0.7 * z;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y + 0.5 * z);
          ctx.lineTo(p2.x, p2.y + 0.5 * z);
          ctx.lineTo(p2.x, p2.y - 2.4 * z);
          ctx.lineTo(p1.x, p1.y - 2.4 * z);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 3. Minimalist vertical matte-charcoal balusters
          ctx.strokeStyle = isNight ? '#1e293b' : '#334155';
          ctx.lineWidth = 1.25 * z;
          for (let s = 1; s <= 4; s++) {
            const t = s / 5;
            const bx = p1.x + (p2.x - p1.x) * t;
            const by = p1.y + (p2.y - p1.y) * t;
            ctx.beginPath();
            ctx.moveTo(bx, by - 2.2 * z);
            ctx.lineTo(bx, by - 13.5 * z);
            ctx.stroke();
          }

          // 4. Lower & Upper sleek matte-anthracite horizontal rails
          ctx.strokeStyle = isNight ? '#0f172a' : '#1e293b';
          ctx.lineWidth = 1.8 * z;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y - 5.2 * z);
          ctx.lineTo(p2.x, p2.y - 5.2 * z);
          ctx.moveTo(p1.x, p1.y - 13.4 * z);
          ctx.lineTo(p2.x, p2.y - 13.4 * z);
          ctx.stroke();

          // 5. Center Nordic teak/cedar wood minimalist accent slat
          ctx.strokeStyle = isNight ? '#b45309' : '#d97706';
          ctx.lineWidth = 2.4 * z;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y - 9.3 * z);
          ctx.lineTo(p2.x, p2.y - 9.3 * z);
          ctx.stroke();
          ctx.strokeStyle = isNight ? '#f59e0b' : '#fbbf24';
          ctx.lineWidth = 0.7 * z;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y - 10.2 * z);
          ctx.lineTo(p2.x, p2.y - 10.2 * z);
          ctx.stroke();

          // 6. Square minimalist steel posts at bay ends
          const drawFencePost = (px: number, py: number) => {
            const pw = 3.2 * z;
            const ph = 16.2 * z;
            ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.fillRect(px - pw / 2, py - ph, pw, ph);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 0.65 * z;
            ctx.strokeRect(px - pw / 2, py - ph, pw, ph);
            // Minimalist brushed steel flat post cap
            ctx.fillStyle = isNight ? '#64748b' : '#94a3b8';
            ctx.fillRect(px - (pw + 1.0 * z) / 2, py - ph - 1.3 * z, pw + 1.0 * z, 1.5 * z);
          };
          if (item.drawLeftPost) drawFencePost(p1.x, p1.y);
          if (item.drawRightPost) drawFencePost(p2.x, p2.y);

          ctx.restore();
        } else if (item.type === 'wilderness_gate') {
          const pLeft = toScreen(-0.60, item.wy, 0, camera.x, camera.y);
          const pRight = toScreen(0.60, item.wy, 0, camera.x, camera.y);
          const pCenter = toScreen(0.0, item.wy, 0, camera.x, camera.y);
          const pGuard = toScreen(0.72, -7.32, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const canEnterGate = Boolean(isPlayerTeacher || isMasterKikyRef.current);
          const distToGate = Math.hypot(player.wx - 0.0, player.wy - item.wy);
          const isGateOpen = canEnterGate && distToGate < 2.25;

          ctx.save();

          // 1. Minimalist Guard Post Mat under @tomi (di jalan belakang Pohon Refleksi)
          ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.65)' : 'rgba(51, 65, 85, 0.35)';
          ctx.beginPath();
          ctx.ellipse(pGuard.x, pGuard.y + 1.5 * z, 11.5 * z, 5.2 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = canEnterGate ? '#10b981' : '#f59e0b';
          ctx.lineWidth = 1.0 * z;
          ctx.stroke();

          // 2. Stone threshold strip across the gate entrance
          ctx.strokeStyle = isNight ? '#334155' : '#94a3b8';
          ctx.lineWidth = 4.2 * z;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pLeft.x, pLeft.y + 0.5 * z);
          ctx.lineTo(pRight.x, pRight.y + 0.5 * z);
          ctx.stroke();

          // 3. Double-leaf minimalist gate wings (Swing open when Guru approaches, stay locked for Siswa)
          const leftLeafTip = isGateOpen
            ? toScreen(-0.56, item.wy - 0.48, 0, camera.x, camera.y)
            : toScreen(-0.03, item.wy, 0, camera.x, camera.y);
          const rightLeafTip = isGateOpen
            ? toScreen(0.56, item.wy - 0.48, 0, camera.x, camera.y)
            : toScreen(0.03, item.wy, 0, camera.x, camera.y);

          const drawGateLeaf = (hinge: { x: number; y: number }, tip: { x: number; y: number }) => {
            // Vertical balusters on gate leaf
            ctx.strokeStyle = isNight ? '#1e293b' : '#334155';
            ctx.lineWidth = 1.15 * z;
            for (let s = 1; s <= 3; s++) {
              const t = s / 4;
              const gx = hinge.x + (tip.x - hinge.x) * t;
              const gy = hinge.y + (tip.y - hinge.y) * t;
              ctx.beginPath();
              ctx.moveTo(gx, gy - 2.5 * z);
              ctx.lineTo(gx, gy - 15.0 * z);
              ctx.stroke();
            }
            // Top & bottom charcoal steel frame rails
            ctx.strokeStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.lineWidth = 1.9 * z;
            ctx.beginPath();
            ctx.moveTo(hinge.x, hinge.y - 4.5 * z);
            ctx.lineTo(tip.x, tip.y - 4.5 * z);
            ctx.moveTo(hinge.x, hinge.y - 15.0 * z);
            ctx.lineTo(tip.x, tip.y - 15.0 * z);
            ctx.stroke();
            // Center warm teak & status-accent bar
            ctx.strokeStyle = canEnterGate ? '#10b981' : '#d97706';
            ctx.lineWidth = 2.2 * z;
            ctx.beginPath();
            ctx.moveTo(hinge.x, hinge.y - 9.8 * z);
            ctx.lineTo(tip.x, tip.y - 9.8 * z);
            ctx.stroke();
          };

          drawGateLeaf(pLeft, leftLeafTip);
          drawGateLeaf(pRight, rightLeafTip);

          // Center smart-lock badge when gate is closed
          if (!isGateOpen) {
            ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.strokeStyle = canEnterGate ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.roundRect(pCenter.x - 5.5 * z, pCenter.y - 14.5 * z, 11 * z, 9.5 * z, 2.2 * z);
            ctx.fill();
            ctx.stroke();

            ctx.font = `${Math.max(6, Math.round(6.5 * z))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(canEnterGate ? '🔓' : '🔒', pCenter.x, pCenter.y - 9.6 * z);
          }

          // 4. Left & Right Minimalist Architectural Gate Pillars
          const pillarH = 29 * z;
          const pillarW = 5.4 * z;
          [pLeft, pRight].forEach((pPillar) => {
            // Pillar shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
            ctx.beginPath();
            ctx.ellipse(pPillar.x, pPillar.y + 1.5 * z, 4.8 * z, 2.2 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pillar body
            ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.fillRect(pPillar.x - pillarW / 2, pPillar.y - pillarH, pillarW, pillarH);
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 0.8 * z;
            ctx.strokeRect(pPillar.x - pillarW / 2, pPillar.y - pillarH, pillarW, pillarH);

            // Warm teak vertical inset strip on pillar face
            ctx.fillStyle = '#d97706';
            ctx.fillRect(pPillar.x - 1.0 * z, pPillar.y - pillarH + 4 * z, 2.0 * z, pillarH - 8 * z);

            // Brushed steel pillar cap
            ctx.fillStyle = '#94a3b8';
            ctx.fillRect(pPillar.x - (pillarW + 1.6 * z) / 2, pPillar.y - pillarH - 1.8 * z, pillarW + 1.6 * z, 2.0 * z);

            // Glowing status indicator lamp on top of each pillar
            ctx.fillStyle = canEnterGate ? '#10b981' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(pPillar.x, pPillar.y - pillarH - 3.2 * z, 2.0 * z, 0, Math.PI * 2);
            ctx.fill();
          });

          // 5. Overhead Minimalist Portal Crossbeam & "Hutan Refleksia" Signboard Aligned Following the Forest Gate Isometric Position
          ctx.strokeStyle = isNight ? '#0f172a' : '#1e293b';
          ctx.lineWidth = 2.6 * z;
          ctx.beginPath();
          ctx.moveTo(pLeft.x, pLeft.y - pillarH + 1.5 * z);
          ctx.lineTo(pRight.x, pRight.y - pillarH + 1.5 * z);
          ctx.stroke();

          // Vertical steel mounting brackets connecting the portal arch crossbeam to the signboard
          const gateDx = pRight.x - pLeft.x;
          const gateDy = pRight.y - pLeft.y;
          const gateSlope = Math.abs(gateDx) > 0.001 ? gateDy / gateDx : 0.5;
          const signCenterY = pCenter.y - pillarH - 6.8 * z;
          const signW = Math.max(54 * z, Math.min(68 * z, Math.abs(gateDx) * 0.92));
          const signH = 12.5 * z;

          ctx.save();
          ctx.translate(pCenter.x, signCenterY);
          // Align signboard parallel to the isometric angle & position of the forest gate crossbeam
          ctx.transform(1, gateSlope, 0, 1, 0, 0);

          // Support struts down to the crossbeam
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.6 * z;
          ctx.beginPath();
          ctx.moveTo(-signW * 0.32, signH / 2);
          ctx.lineTo(-signW * 0.32, signH / 2 + 3.5 * z);
          ctx.moveTo(signW * 0.32, signH / 2);
          ctx.lineTo(signW * 0.32, signH / 2 + 3.5 * z);
          ctx.stroke();

          // Framed Signboard Body
          ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.95)' : 'rgba(30, 41, 59, 0.95)';
          ctx.strokeStyle = canEnterGate ? '#10b981' : '#f59e0b';
          ctx.lineWidth = 1.15 * z;
          ctx.beginPath();
          ctx.roundRect(-signW / 2, -signH / 2, signW, signH, 3.2 * z);
          ctx.fill();
          ctx.stroke();

          // Strictly clip "Hutan Refleksia" inside the aligned gate signboard frame
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(-signW / 2 + 1.5 * z, -signH / 2 + 1.0 * z, signW - 3.0 * z, signH - 2.0 * z, 2.2 * z);
          ctx.clip();
          ctx.font = `bold ${Math.max(5, Math.round(6.0 * z))}px sans-serif`;
          ctx.fillStyle = canEnterGate ? '#a7f3d0' : '#fde68a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🌲 Hutan Refleksia', 0, 0, signW - 5 * z);
          ctx.restore();

          ctx.restore();

          ctx.restore();
        } else if (item.type === 'building') {
          const b = item.info;
          const [bx, , by] = b.position;
          const pt = toScreen(bx, by, 0, camera.x, camera.y);
          // Ukuran setiap bangunan diperbesar sedikit (~18% lebih besar & proporsional)
          const z = zoomLevelRef.current * 1.18;
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

            // Illuminated Red "● ON AIR" Lightbox Sign on Right Facade — strictly fitted & clipped inside frame
            const neonPulse = 0.82 + Math.sin(elapsed * 5) * 0.18;
            const onAirBoxX = pt.x + 3.5 * z;
            const onAirBoxY = pt.y - 8.2 * z;
            const onAirBoxW = 23 * z;
            const onAirBoxH = 8.6 * z;
            const onAirInnerX = onAirBoxX + 0.9 * z;
            const onAirInnerY = onAirBoxY + 0.9 * z;
            const onAirInnerW = onAirBoxW - 1.8 * z;
            const onAirInnerH = onAirBoxH - 1.8 * z;

            ctx.fillStyle = '#7f1d1d';
            ctx.beginPath();
            ctx.roundRect(onAirBoxX, onAirBoxY, onAirBoxW, onAirBoxH, 2.4 * z);
            ctx.fill();

            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.roundRect(onAirInnerX, onAirInnerY, onAirInnerW, onAirInnerH, 1.8 * z);
            ctx.fill();
            ctx.strokeStyle = `rgba(254, 202, 202, ${neonPulse})`;
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(onAirInnerX + 0.6 * z, onAirInnerY + 0.5 * z, onAirInnerW - 1.2 * z, onAirInnerH - 1.0 * z, 1.4 * z);
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(3, Math.round(3.7 * z))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('● ON AIR', onAirBoxX + onAirBoxW / 2, onAirBoxY + onAirBoxH / 2, onAirInnerW - 2.6 * z);
            ctx.restore();

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
            // SOUTH-EAST: LAB DKV (Renovated Minimalist & Detailed Creative Design Studio + Moving 3D Atom Logo on Top)
            // 1. Minimalist Isometric Architectural Plinth & Terrazzo Base
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.moveTo(pt.x - 32 * z, pt.y + 15 * z);
            ctx.lineTo(pt.x, pt.y + 31 * z);
            ctx.lineTo(pt.x + 32 * z, pt.y + 15 * z);
            ctx.lineTo(pt.x, pt.y + 1 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = isNight ? '#334155' : '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(pt.x - 30 * z, pt.y + 13.5 * z);
            ctx.lineTo(pt.x, pt.y + 28.5 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y + 13.5 * z);
            ctx.lineTo(pt.x, pt.y - 0.5 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = isNight ? '#38bdf8' : '#94a3b8';
            ctx.lineWidth = 0.85 * z;
            ctx.stroke();

            // 2. Main Minimalist Isometric Studio Volumes (Left Alabaster Wing & Right Anthracite Wing)
            // Left Wing (Matte Alabaster White Creative Wing)
            ctx.fillStyle = isNight ? '#cbd5e1' : '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(pt.x - 28 * z, pt.y + 13 * z);
            ctx.lineTo(pt.x, pt.y + 27 * z);
            ctx.lineTo(pt.x, pt.y - 8 * z);
            ctx.lineTo(pt.x - 28 * z, pt.y - 22 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Right Wing (Sleek Anthracite Slate & Glass Atrium Wing)
            ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y + 27 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y + 13 * z);
            ctx.lineTo(pt.x + 28 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 8 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#334155';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // 3. Cantilevered Minimalist Flat Roof Deck with Recessed Skylight Atrium
            ctx.fillStyle = isNight ? '#e2e8f0' : '#ffffff';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 36 * z);
            ctx.lineTo(pt.x + 30 * z, pt.y - 21 * z);
            ctx.lineTo(pt.x, pt.y - 6 * z);
            ctx.lineTo(pt.x - 30 * z, pt.y - 21 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            // Inner Skylight Glass Atrium on Roof
            ctx.fillStyle = isNight ? '#0284c7' : '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 31 * z);
            ctx.lineTo(pt.x + 18 * z, pt.y - 22 * z);
            ctx.lineTo(pt.x, pt.y - 13 * z);
            ctx.lineTo(pt.x - 18 * z, pt.y - 22 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#bae6fd';
            ctx.lineWidth = 0.75 * z;
            ctx.stroke();

            // 4. Left Facade Details: Minimalist Curtain-Wall Studio Window + Creative Workstations & CMYK Swatch Bar
            ctx.fillStyle = isNight ? '#082f49' : '#0f172a';
            ctx.beginPath();
            ctx.moveTo(pt.x - 24.5 * z, pt.y + 6.5 * z);
            ctx.lineTo(pt.x - 3.5 * z, pt.y + 17 * z);
            ctx.lineTo(pt.x - 3.5 * z, pt.y + 1 * z);
            ctx.lineTo(pt.x - 24.5 * z, pt.y - 9.5 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Glowing iMac / Pen-Display Screens visible inside Left Studio Window
            ctx.fillStyle = isNight ? '#fde047' : '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(pt.x - 21 * z, pt.y + 2 * z);
            ctx.lineTo(pt.x - 15 * z, pt.y + 5 * z);
            ctx.lineTo(pt.x - 15 * z, pt.y - 0.5 * z);
            ctx.lineTo(pt.x - 21 * z, pt.y - 3.5 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = isNight ? '#38bdf8' : '#a855f7';
            ctx.beginPath();
            ctx.moveTo(pt.x - 12.5 * z, pt.y + 6.2 * z);
            ctx.lineTo(pt.x - 6.5 * z, pt.y + 9.2 * z);
            ctx.lineTo(pt.x - 6.5 * z, pt.y + 3.7 * z);
            ctx.lineTo(pt.x - 12.5 * z, pt.y + 0.7 * z);
            ctx.closePath();
            ctx.fill();

            // Minimalist CMYK / RGB Geometric Accent Dots on Left Facade Corner
            const cmykColors = ['#06b6d4', '#ec4899', '#facc15'];
            cmykColors.forEach((col, idx) => {
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.arc(pt.x - (25 - idx * 3.2) * z, pt.y + (9.5 + idx * 1.6) * z, 1.2 * z, 0, Math.PI * 2);
              ctx.fill();
            });

            // 5. Right Facade Details: Minimalist Timber Louvers, Recessed Neon Strips & Glass Entrance Door
            for (let lv = 0; lv < 4; lv++) {
              const lx = pt.x + (15 + lv * 3.2) * z;
              const lyTop = pt.y - (13.5 + lv * 1.6) * z;
              const lyBot = pt.y + (11.5 - lv * 1.6) * z;
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 1.1 * z;
              ctx.beginPath();
              ctx.moveTo(lx, lyTop);
              ctx.lineTo(lx, lyBot);
              ctx.stroke();
            }

            // Glass Double Studio Entrance on Right Wing with Cantilevered Canopy
            ctx.fillStyle = isNight ? '#38bdf8' : '#0ea5e9';
            ctx.beginPath();
            ctx.moveTo(pt.x + 3 * z, pt.y + 24.5 * z);
            ctx.lineTo(pt.x + 12.5 * z, pt.y + 19.8 * z);
            ctx.lineTo(pt.x + 12.5 * z, pt.y + 4.5 * z);
            ctx.lineTo(pt.x + 3 * z, pt.y + 9.2 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Center door divider & minimalist vertical handle
            ctx.beginPath();
            ctx.moveTo(pt.x + 7.75 * z, pt.y + 22.15 * z);
            ctx.lineTo(pt.x + 7.75 * z, pt.y + 6.85 * z);
            ctx.stroke();

            // 6. Framed "LAB DKV" Architectural Signboard — strictly fitted & clipped inside its frame
            const dkvSignW = 24 * z;
            const dkvSignH = 6.6 * z;
            const dkvSignX = pt.x - 26.5 * z;
            const dkvSignY = pt.y - 16.5 * z;

            ctx.fillStyle = '#090d16';
            ctx.beginPath();
            ctx.roundRect(dkvSignX, dkvSignY, dkvSignW, dkvSignH, 2 * z);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(
              dkvSignX + 1.0 * z,
              dkvSignY + 0.8 * z,
              dkvSignW - 2.0 * z,
              dkvSignH - 1.6 * z,
              1.4 * z
            );
            ctx.clip();
            ctx.fillStyle = '#38bdf8';
            ctx.font = `bold ${Math.max(3, Math.round(3.7 * z))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('LAB DKV', dkvSignX + dkvSignW / 2, dkvSignY + dkvSignH / 2, dkvSignW - 3.6 * z);
            ctx.restore();

            // 7. Animated Moving 3D Atom Logo on Top of Lab DKV Roof
            const atomCx = pt.x;
            const atomCy = pt.y - 39 * z;

            // Minimalist Roof Pedestal & Chrome Pylon supporting the Atom Logo
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 22 * z, 6.5 * z, 3.2 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.6 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y - 22 * z);
            ctx.lineTo(atomCx, atomCy + 8 * z);
            ctx.stroke();

            // Soft Glowing Cyan Energy Halo behind the Moving Atom Logo
            const atomPulse = 0.78 + Math.sin(elapsed * 4) * 0.22;
            const atomHalo = ctx.createRadialGradient(atomCx, atomCy, 1.5 * z, atomCx, atomCy, 15 * z);
            atomHalo.addColorStop(0, `rgba(56, 189, 248, ${0.42 * atomPulse})`);
            atomHalo.addColorStop(0.6, `rgba(14, 165, 233, ${0.15 * atomPulse})`);
            atomHalo.addColorStop(1, 'rgba(14, 165, 233, 0)');
            ctx.fillStyle = atomHalo;
            ctx.beginPath();
            ctx.arc(atomCx, atomCy, 15 * z, 0, Math.PI * 2);
            ctx.fill();

            // 3 Rotating Elliptical Electron Orbital Rings + Orbiting Glowing Electrons
            const orbitRx = 12.2 * z;
            const orbitRy = 4.5 * z;
            const baseAtomRotation = elapsed * 0.55;
            const orbitAngles = [
              baseAtomRotation,
              baseAtomRotation + Math.PI / 3,
              baseAtomRotation + (2 * Math.PI) / 3,
            ];
            const electronColors = ['#38bdf8', '#fde047', '#f472b6'];

            orbitAngles.forEach((ringAngle, idx) => {
              // Orbital ring ellipse
              ctx.strokeStyle = idx === 0 ? 'rgba(56, 189, 248, 0.88)' : idx === 1 ? 'rgba(250, 204, 21, 0.82)' : 'rgba(244, 114, 182, 0.82)';
              ctx.lineWidth = 1.15 * z;
              ctx.beginPath();
              ctx.ellipse(atomCx, atomCy, orbitRx, orbitRy, ringAngle, 0, Math.PI * 2);
              ctx.stroke();

              // Moving Electron position along the rotated ellipse
              const ePhase = elapsed * (3.2 + idx * 0.45) + idx * ((2 * Math.PI) / 3);
              const localX = orbitRx * Math.cos(ePhase);
              const localY = orbitRy * Math.sin(ePhase);
              const cosA = Math.cos(ringAngle);
              const sinA = Math.sin(ringAngle);
              const ex = atomCx + localX * cosA - localY * sinA;
              const ey = atomCy + localX * sinA + localY * cosA;

              // Electron outer glow
              ctx.fillStyle = electronColors[idx];
              ctx.beginPath();
              ctx.arc(ex, ey, 2.3 * z, 0, Math.PI * 2);
              ctx.fill();

              // Electron white hot core
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(ex, ey, 1.1 * z, 0, Math.PI * 2);
              ctx.fill();
            });

            // Pulsing Atom Nucleus at the center
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.arc(atomCx, atomCy, 3.6 * z * atomPulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(atomCx - 0.9 * z, atomCy - 0.7 * z, 1.7 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(atomCx + 1.0 * z, atomCy + 0.6 * z, 1.7 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(atomCx, atomCy, 1.3 * z, 0, Math.PI * 2);
            ctx.fill();
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

            // Rooftop Iconic 3D Origami Paper Airplane (Model Pesawat Kertas di Bagian Atas Kantor Pos)
            const planeFloatY = Math.sin(elapsed * 2.8) * 1.6 * z;
            const planeTilt = Math.sin(elapsed * 1.8) * 0.04;
            const pylonTopY = pt.y - 38.5 * z;

            // Sleek Golden & Slate Mounting Pedestal Pylon on Roof Peak
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(pt.x - 3.2 * z, pt.y - 31.5 * z);
            ctx.lineTo(pt.x - 1.4 * z, pylonTopY);
            ctx.lineTo(pt.x + 1.4 * z, pylonTopY);
            ctx.lineTo(pt.x + 3.2 * z, pt.y - 31.5 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y - 32 * z, 4.5 * z, 2.0 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pt.x, pylonTopY, 2.2 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.save();
            ctx.translate(pt.x, pylonTopY - 6.5 * z + planeFloatY);
            ctx.rotate(-0.22 + planeTilt); // Angled dynamically nose-up toward the sky

            // Subtle Wind Trail / Swoosh Lines behind the Paper Airplane
            ctx.strokeStyle = isNight ? 'rgba(125, 211, 252, 0.55)' : 'rgba(255, 255, 255, 0.78)';
            ctx.lineWidth = 1.1 * z;
            ctx.lineCap = 'round';
            const trailPulse = (elapsed * 12) % 6;
            ctx.beginPath();
            ctx.moveTo(-16 * z - trailPulse * z, 2.5 * z);
            ctx.lineTo(-23 * z - trailPulse * z, 4.2 * z);
            ctx.moveTo(-14 * z - trailPulse * 0.7 * z, 7.5 * z);
            ctx.lineTo(-20 * z - trailPulse * 0.7 * z, 9.0 * z);
            ctx.stroke();

            // Nose Point: (19*z, -3*z)
            const noseX = 19 * z;
            const noseY = -3 * z;

            // 1) Left / Rear Upper Paper Wing (Crisp White Paper with Soft Sky Shading)
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(-15 * z, -11.5 * z); // Left wingtip
            ctx.lineTo(-9.5 * z, -1.5 * z); // Inner fold rear
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.85 * z;
            ctx.stroke();

            // 2) Deep Origami Center Valley Crease & Under-Keel Fin (Shaded Slate-Blue Paper Fold)
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(-9.5 * z, -1.5 * z);
            ctx.lineTo(-11.5 * z, 6.2 * z); // Bottom keel point
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Inner fold shadow triangle
            ctx.fillStyle = '#cbd5e1';
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(-9.5 * z, -1.5 * z);
            ctx.lineTo(-7.5 * z, 1.8 * z);
            ctx.closePath();
            ctx.fill();

            // 3) Right / Front Sunlit Main Paper Wing (Pure Crisp White Origami Wing)
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(noseX, noseY);
            ctx.lineTo(-7.5 * z, 1.8 * z); // Center crease rear
            ctx.lineTo(-14.5 * z, 9.8 * z); // Right-front wingtip
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Express Airmail Red & Blue Stripes on Front Paper Wing
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5 * z;
            ctx.beginPath();
            ctx.moveTo(7 * z, 0.2 * z);
            ctx.lineTo(-11.2 * z, 6.8 * z);
            ctx.stroke();

            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 1.2 * z;
            ctx.beginPath();
            ctx.moveTo(4 * z, 1.8 * z);
            ctx.lineTo(-12.5 * z, 8.0 * z);
            ctx.stroke();

            ctx.restore();

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

            // Winged Envelope "POS KILAT" Sign Banner below Clock — strictly fitted & clipped inside frame
            const posSignW = 25 * z;
            const posSignH = 6.2 * z;
            const posSignX = pt.x - posSignW / 2;
            const posSignY = pt.y - 8.4 * z;

            ctx.fillStyle = '#9a3412';
            ctx.beginPath();
            ctx.roundRect(posSignX, posSignY, posSignW, posSignH, 1.8 * z);
            ctx.fill();

            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.roundRect(posSignX + 0.8 * z, posSignY + 0.7 * z, posSignW - 1.6 * z, posSignH - 1.4 * z, 1.3 * z);
            ctx.fill();
            ctx.strokeStyle = '#fef08a';
            ctx.lineWidth = 0.85 * z;
            ctx.stroke();

            ctx.save();
            ctx.beginPath();
            ctx.roundRect(posSignX + 1.2 * z, posSignY + 1.0 * z, posSignW - 2.4 * z, posSignH - 2.0 * z, 1.0 * z);
            ctx.clip();
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${Math.max(3, Math.round(3.3 * z))}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('POS KILAT', pt.x, posSignY + posSignH / 2, posSignW - 3.6 * z);
            ctx.restore();

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
          } else if (b.id === 'masjid') {
            // =========================================================================
            // 9. MASJID AL-HIKMAH (Di Samping Kolam Awal Aliran Sungai)
            //    Tempat Belajar Baca Iqro (Jilid 1-6) & Tuntunan Sholat Lengkap
            // =========================================================================
            const drawIsoBox = (
              c: CanvasRenderingContext2D,
              cx: number,
              cy: number,
              zBase: number,
              w: number,
              d: number,
              h: number,
              topCol: string,
              leftCol: string,
              rightCol: string,
              camX: number,
              camY: number,
              strokeCol?: string
            ) => {
              const hw = w / 2;
              const hd = d / 2;
              const bW = toScreen(cx - hw, cy + hd, zBase, camX, camY);
              const bS = toScreen(cx + hw, cy + hd, zBase, camX, camY);
              const bE = toScreen(cx + hw, cy - hd, zBase, camX, camY);
              const tN = toScreen(cx - hw, cy - hd, zBase + h, camX, camY);
              const tW = toScreen(cx - hw, cy + hd, zBase + h, camX, camY);
              const tS = toScreen(cx + hw, cy + hd, zBase + h, camX, camY);
              const tE = toScreen(cx + hw, cy - hd, zBase + h, camX, camY);

              // Left Face (West-South)
              c.fillStyle = leftCol;
              c.beginPath();
              c.moveTo(tW.x, tW.y);
              c.lineTo(tS.x, tS.y);
              c.lineTo(bS.x, bS.y);
              c.lineTo(bW.x, bW.y);
              c.closePath();
              c.fill();
              if (strokeCol) {
                c.strokeStyle = strokeCol;
                c.lineWidth = 0.7 * z;
                c.stroke();
              }

              // Right Face (South-East)
              c.fillStyle = rightCol;
              c.beginPath();
              c.moveTo(tS.x, tS.y);
              c.lineTo(tE.x, tE.y);
              c.lineTo(bE.x, bE.y);
              c.lineTo(bS.x, bS.y);
              c.closePath();
              c.fill();
              if (strokeCol) {
                c.strokeStyle = strokeCol;
                c.lineWidth = 0.7 * z;
                c.stroke();
              }

              // Top Face (North-East-South-West)
              c.fillStyle = topCol;
              c.beginPath();
              c.moveTo(tN.x, tN.y);
              c.lineTo(tE.x, tE.y);
              c.lineTo(tS.x, tS.y);
              c.lineTo(tW.x, tW.y);
              c.closePath();
              c.fill();
              if (strokeCol) {
                c.strokeStyle = strokeCol;
                c.lineWidth = 0.7 * z;
                c.stroke();
              }
            };

            // 1) Stepped White Marble & Emerald Granite Courtyard Plinth (Pelataran Marmer Suci)
            drawIsoBox(ctx, bx, by, 0, 1.56, 1.56, 4.5, '#f8fafc', '#cbd5e1', '#e2e8f0', camera.x, camera.y, '#94a3b8');
            drawIsoBox(ctx, bx, by, 4.5, 1.42, 1.42, 3.0, '#10b981', '#047857', '#059669', camera.x, camera.y, '#065f46');
            drawIsoBox(ctx, bx, by, 7.5, 1.32, 1.32, 2.5, '#ffffff', '#e2e8f0', '#f1f5f9', camera.x, camera.y, '#cbd5e1');

            // Front & West Welcoming Marble Steps (Tangga Pelataran Jamaah)
            drawIsoBox(ctx, bx - 0.56, by + 0.56, 0, 0.52, 0.52, 2.6, '#fef3c7', '#fde68a', '#f59e0b', camera.x, camera.y);
            drawIsoBox(ctx, bx - 0.46, by + 0.46, 2.6, 0.42, 0.42, 2.6, '#fffbeb', '#fef3c7', '#fbbf24', camera.x, camera.y);

            // 2) Riverside Ablution Pavilion (Tempat Wudhu Air Hulu Sungai di sisi kanan dekat kolam & hulu sungai)
            drawIsoBox(ctx, bx + 0.58, by - 0.08, 4.5, 0.36, 0.72, 14, '#f8fafc', '#cbd5e1', '#e2e8f0', camera.x, camera.y, '#94a3b8');
            drawIsoBox(ctx, bx + 0.58, by - 0.08, 18.5, 0.42, 0.78, 3.2, '#10b981', '#047857', '#059669', camera.x, camera.y);
            // Water basin & flowing ablution water spouts
            drawIsoBox(ctx, bx + 0.68, by - 0.08, 4.5, 0.24, 0.62, 5.5, '#38bdf8', '#0284c7', '#0ea5e9', camera.x, camera.y);
            for (const wOff of [-0.2, 0, 0.2]) {
              const spoutTop = toScreen(bx + 0.64, by - 0.08 + wOff, 12.5, camera.x, camera.y);
              const spoutBot = toScreen(bx + 0.72, by - 0.08 + wOff, 6.5, camera.x, camera.y);
              ctx.strokeStyle = '#bae6fd';
              ctx.lineWidth = 1.4 * z;
              ctx.beginPath();
              ctx.moveTo(spoutTop.x, spoutTop.y);
              ctx.lineTo(spoutBot.x, spoutBot.y);
              ctx.stroke();
            }

            // 3) Main Mosque Sanctuary Hall (Ruang Utama Sholat & Kajian Iqro)
            drawIsoBox(ctx, bx - 0.04, by - 0.04, 10, 1.12, 1.12, 32, '#fffbeb', '#e2e8f0', '#f8fafc', camera.x, camera.y, '#cbd5e1');

            // Emerald & Gold Calligraphic Frieze Band around upper sanctuary wall
            drawIsoBox(ctx, bx - 0.04, by - 0.04, 35, 1.15, 1.15, 4.5, '#059669', '#065f46', '#047857', camera.x, camera.y);
            drawIsoBox(ctx, bx - 0.04, by - 0.04, 39.5, 1.17, 1.17, 2.5, '#fbbf24', '#b45309', '#d97706', camera.x, camera.y);

            // Corner Marble Pilasters with Gold Capitals
            for (const [px, py] of [
              [-0.54, -0.54],
              [0.46, -0.54],
              [-0.54, 0.46],
              [0.46, 0.46],
            ]) {
              drawIsoBox(ctx, bx + px, by + py, 10, 0.14, 0.14, 32, '#f1f5f9', '#94a3b8', '#cbd5e1', camera.x, camera.y);
              drawIsoBox(ctx, bx + px, by + py, 42, 0.17, 0.17, 3.2, '#fde047', '#ca8a04', '#eab308', camera.x, camera.y);
            }

            // 4) Front Grand Portal Iwan & Pointed Islamic Archway (Pintu Utama Mihrab & Serambi)
            drawIsoBox(ctx, bx - 0.36, by + 0.36, 10, 0.56, 0.56, 26, '#f8fafc', '#cbd5e1', '#e2e8f0', camera.x, camera.y, '#94a3b8');
            drawIsoBox(ctx, bx - 0.36, by + 0.36, 36, 0.62, 0.62, 3.5, '#10b981', '#047857', '#059669', camera.x, camera.y);

            // Pointed Islamic Arch Doorway & Illuminated Emerald Prayer Carpet Inside
            const doorC = toScreen(bx - 0.46, by + 0.46, 10, camera.x, camera.y);
            ctx.save();
            ctx.fillStyle = '#064e3b';
            ctx.beginPath();
            ctx.moveTo(doorC.x - 8.5 * z, doorC.y);
            ctx.lineTo(doorC.x - 8.5 * z, doorC.y - 12 * z);
            ctx.quadraticCurveTo(doorC.x - 8.5 * z, doorC.y - 19 * z, doorC.x, doorC.y - 22.5 * z);
            ctx.quadraticCurveTo(doorC.x + 8.5 * z, doorC.y - 19 * z, doorC.x + 8.5 * z, doorC.y - 12 * z);
            ctx.lineTo(doorC.x + 8.5 * z, doorC.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.6 * z;
            ctx.stroke();

            // Warm Golden Lantern Glow Inside Mosque Sanctuary
            const inGlow = ctx.createRadialGradient(doorC.x, doorC.y - 10 * z, 1 * z, doorC.x, doorC.y - 10 * z, 11 * z);
            inGlow.addColorStop(0, isNight ? 'rgba(253, 224, 71, 0.9)' : 'rgba(254, 240, 138, 0.65)');
            inGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = inGlow;
            ctx.fill();
            ctx.restore();

            // Arched Stained-Glass Windows on Left & Right Facades
            for (const wOffset of [-0.26, 0.22]) {
              const winL = toScreen(bx - 0.56, by + wOffset, 20, camera.x, camera.y);
              const winR = toScreen(bx + wOffset, by + 0.52, 20, camera.x, camera.y);
              for (const wPt of [winL, winR]) {
                ctx.fillStyle = isNight ? '#fde047' : '#34d399';
                ctx.beginPath();
                ctx.arc(wPt.x, wPt.y - 4 * z, 3.6 * z, Math.PI, 0);
                ctx.lineTo(wPt.x + 3.6 * z, wPt.y + 3 * z);
                ctx.lineTo(wPt.x - 3.6 * z, wPt.y + 3 * z);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 1 * z;
                ctx.stroke();
              }
            }

            // 5) Octagonal Drum & Grand Emerald-Gold Onion Dome (Kubah Utama Masjid Al-Hikmah)
            drawIsoBox(ctx, bx - 0.04, by - 0.04, 42, 0.78, 0.78, 6.5, '#f8fafc', '#cbd5e1', '#e2e8f0', camera.x, camera.y, '#94a3b8');
            drawIsoBox(ctx, bx - 0.04, by - 0.04, 48.5, 0.82, 0.82, 2.2, '#fbbf24', '#b45309', '#d97706', camera.x, camera.y);

            const domeBase = toScreen(bx - 0.04, by - 0.04, 50.5, camera.x, camera.y);
            const domeR = 20.5 * z;
            ctx.save();
            const domeGrad = ctx.createRadialGradient(
              domeBase.x - domeR * 0.28,
              domeBase.y - domeR * 0.65,
              domeR * 0.1,
              domeBase.x,
              domeBase.y - domeR * 0.35,
              domeR * 1.15
            );
            domeGrad.addColorStop(0, '#6ee7b7');
            domeGrad.addColorStop(0.35, '#10b981');
            domeGrad.addColorStop(0.78, '#047857');
            domeGrad.addColorStop(1, '#064e3b');

            // Pointed Onion Dome Silhouette
            ctx.fillStyle = domeGrad;
            ctx.beginPath();
            ctx.moveTo(domeBase.x - domeR, domeBase.y);
            ctx.bezierCurveTo(
              domeBase.x - domeR * 1.08,
              domeBase.y - domeR * 0.75,
              domeBase.x - domeR * 0.35,
              domeBase.y - domeR * 1.18,
              domeBase.x,
              domeBase.y - domeR * 1.38
            );
            ctx.bezierCurveTo(
              domeBase.x + domeR * 0.35,
              domeBase.y - domeR * 1.18,
              domeBase.x + domeR * 1.08,
              domeBase.y - domeR * 0.75,
              domeBase.x + domeR,
              domeBase.y
            );
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.4 * z;
            ctx.stroke();

            // Golden Ribbed Meridian Lines on Mosque Dome
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
            ctx.lineWidth = 1.0 * z;
            for (const ribF of [-0.55, -0.25, 0.25, 0.55]) {
              ctx.beginPath();
              ctx.moveTo(domeBase.x + domeR * ribF, domeBase.y);
              ctx.quadraticCurveTo(
                domeBase.x + domeR * ribF * 1.05,
                domeBase.y - domeR * 0.75,
                domeBase.x,
                domeBase.y - domeR * 1.36
              );
              ctx.stroke();
            }

            // Golden Spire & Crescent Moon Hilal Finial (Bulan Sabit Emas di Puncak Kubah)
            const spireTopY = domeBase.y - domeR * 1.38 - 10 * z;
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2.0 * z;
            ctx.beginPath();
            ctx.moveTo(domeBase.x, domeBase.y - domeR * 1.36);
            ctx.lineTo(domeBase.x, spireTopY + 3 * z);
            ctx.stroke();

            // Three stacked brass orbs on spire
            for (const [orbOff, orbRad] of [
              [7.5, 2.1],
              [5.0, 1.6],
              [2.8, 1.2],
            ]) {
              ctx.fillStyle = '#fde047';
              ctx.beginPath();
              ctx.arc(domeBase.x, spireTopY + orbOff * z, orbRad * z, 0, Math.PI * 2);
              ctx.fill();
            }

            // Golden Crescent Moon (Hilal)
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(domeBase.x, spireTopY - 1.5 * z, 4.6 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = isNight ? '#0f172a' : '#bae6fd';
            ctx.beginPath();
            ctx.arc(domeBase.x + 1.6 * z, spireTopY - 2.6 * z, 3.7 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 6) Slender Tall Minaret Tower (Menara Masjid di Sudut Utara-Barat)
            const minX = bx - 0.52;
            const minY = by - 0.52;
            drawIsoBox(ctx, minX, minY, 10, 0.28, 0.28, 44, '#f8fafc', '#cbd5e1', '#e2e8f0', camera.x, camera.y, '#94a3b8');
            drawIsoBox(ctx, minX, minY, 32, 0.31, 0.31, 3.0, '#10b981', '#047857', '#059669', camera.x, camera.y);
            // Muazin Balcony with Golden Mashrabiya Railing
            drawIsoBox(ctx, minX, minY, 54, 0.38, 0.38, 4.0, '#fbbf24', '#b45309', '#d97706', camera.x, camera.y);
            drawIsoBox(ctx, minX, minY, 58, 0.22, 0.22, 12, '#ffffff', '#cbd5e1', '#e2e8f0', camera.x, camera.y);
            // Minaret Emerald Cupola & Golden Crescent
            const minTop = toScreen(minX, minY, 70, camera.x, camera.y);
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(minTop.x, minTop.y - 3 * z, 5.2 * z, Math.PI, 0);
            ctx.lineTo(minTop.x, minTop.y - 10.5 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();

            // 6b) 4 Horn Loudspeakers (TOA Menara Masjid) on the Minaret Balcony
            const spkBase = toScreen(minX, minY, 63, camera.x, camera.y);
            const spkDirs = [
              { dx: -7.5 * z, dy: -2.2 * z },
              { dx: 7.5 * z, dy: -2.2 * z },
              { dx: -5.5 * z, dy: 2.2 * z },
              { dx: 5.5 * z, dy: 2.2 * z },
            ];
            spkDirs.forEach((sd) => {
              ctx.fillStyle = '#e2e8f0';
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 0.8 * z;
              ctx.beginPath();
              ctx.moveTo(spkBase.x, spkBase.y);
              ctx.lineTo(spkBase.x + sd.dx, spkBase.y + sd.dy - 2.1 * z);
              ctx.lineTo(spkBase.x + sd.dx, spkBase.y + sd.dy + 2.1 * z);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            });

            // 6c) LIVE AZAN 5 WAKTU VISUAL BROADCAST ON THE MAP
            // (Hanya tampil 10 menit setelah waktu sholat per 5 waktunya)
            const curWaktu = getActiveAzanWithin10MinWita();
            if (curWaktu) {
              const waktuMeta =
                AZAN_5_WAKTU_LIST.find((w) => w.id === curWaktu) || AZAN_5_WAKTU_LIST[0];

              // Concentric Expanding Emerald-Gold Acoustic Ripples from Minaret Balcony
              for (let rw = 0; rw < 3; rw++) {
                const waveProg = ((elapsed * 0.68 + rw * 0.33) % 1);
                const waveRx = (12 + waveProg * 46) * z;
                const waveRy = (7 + waveProg * 25) * z;
                const waveAlpha = Math.max(0, (1 - waveProg) * 0.72);

                ctx.save();
                ctx.strokeStyle =
                  rw % 2 === 0
                    ? `rgba(251, 191, 36, ${waveAlpha})`
                    : `rgba(52, 211, 153, ${waveAlpha})`;
                ctx.lineWidth = (2.0 - waveProg * 1.1) * z;
                ctx.beginPath();
                ctx.ellipse(
                  minTop.x,
                  minTop.y - 5 * z,
                  waveRx,
                  waveRy,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
              }

              // Cycling Lafadz Azan phrases (including special Subuh phrase)
              const azanPhrases =
                curWaktu === 'Subuh'
                  ? [
                      { ar: 'اللّٰهُ أَكْبَرُ ، اللّٰهُ أَكْبَرُ', id: 'Allaahu Akbar, Allaahu Akbar' },
                      { ar: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ', id: 'Asyhadu allaa ilaaha illallaah' },
                      { ar: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُوْلُ اللّٰهِ', id: 'Asyhadu anna Muhammadar Rasuulullaah' },
                      { ar: 'حَيَّ عَلَى الصَّلَاةِ', id: "Hayya 'alash-shalaah" },
                      { ar: 'حَيَّ عَلَى الْفَلَاحِ', id: "Hayya 'alal-falaah" },
                      { ar: 'الصَّلَاةُ خَيْرٌ مِنَ النَّوْمِ', id: 'Ash-shalaatu khairum minan-naum' },
                      { ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ', id: 'Laa ilaaha illallaah' },
                    ]
                  : [
                      { ar: 'اللّٰهُ أَكْبَرُ ، اللّٰهُ أَكْبَرُ', id: 'Allaahu Akbar, Allaahu Akbar' },
                      { ar: 'أَشْهَدُ أَنْ لَا إِلٰهَ إِلَّا اللّٰهُ', id: 'Asyhadu allaa ilaaha illallaah' },
                      { ar: 'أَشْهَدُ أَنَّ مُحَمَّدًا رَسُوْلُ اللّٰهِ', id: 'Asyhadu anna Muhammadar Rasuulullaah' },
                      { ar: 'حَيَّ عَلَى الصَّلَاةِ', id: "Hayya 'alash-shalaah" },
                      { ar: 'حَيَّ عَلَى الْفَلَاحِ', id: "Hayya 'alal-falaah" },
                      { ar: 'لَا إِلٰهَ إِلَّا اللّٰهُ', id: 'Laa ilaaha illallaah' },
                    ];

              const phraseIdx = Math.floor(elapsed * 0.28) % azanPhrases.length;
              const currentPhrase = azanPhrases[phraseIdx];

              // Floating Azan 5 Waktu Callout Card above the Minaret
              const azanBob = Math.sin(elapsed * 2.4) * 2.2 * z;
              const cardCx = minTop.x + 6 * z;
              const cardCy = minTop.y - 34 * z + azanBob;
              const cardW = 132 * z;
              const cardH = 34 * z;

              ctx.save();
              // Glowing emerald-slate background
              ctx.fillStyle = 'rgba(6, 78, 59, 0.90)';
              ctx.beginPath();
              ctx.roundRect(cardCx - cardW / 2, cardCy - cardH / 2, cardW, cardH, 6 * z);
              ctx.fill();

              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 1.25 * z;
              ctx.stroke();

              // Pointer stem down to Minaret cupola
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.moveTo(cardCx - 8 * z, cardCy + cardH / 2);
              ctx.lineTo(minTop.x, minTop.y - 11 * z);
              ctx.lineTo(cardCx - 2 * z, cardCy + cardH / 2);
              ctx.closePath();
              ctx.fill();

              // Row 1: Active Prayer Time Header + Animated Sound Equalizer Bars
              ctx.fillStyle = '#fde047';
              ctx.font = `bold ${Math.round(5.8 * z)}px sans-serif`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(
                `🔊 ADZAN ${waktuMeta.id.toUpperCase()} (${waktuMeta.time} WITA)`,
                cardCx,
                cardCy - 10.5 * z
              );

              // Row 2: Live Arabic & Latin Azan Call
              ctx.fillStyle = '#ffffff';
              ctx.font = `bold ${Math.round(6.6 * z)}px sans-serif`;
              ctx.fillText(currentPhrase.ar, cardCx, cardCy - 2.2 * z);

              ctx.fillStyle = '#a7f3d0';
              ctx.font = `italic ${Math.round(4.9 * z)}px sans-serif`;
              ctx.fillText(currentPhrase.id, cardCx, cardCy + 4.8 * z);

              // Row 3: 5-Waktu Schedule Strip (Subuh | Dzuhur | Ashar | Maghrib | Isya)
              const stripY = cardCy + 12.2 * z;
              const slotW = (cardW - 8 * z) / 5;
              AZAN_5_WAKTU_LIST.forEach((wk, wIdx) => {
                const slotX = cardCx - cardW / 2 + 4 * z + wIdx * slotW + slotW / 2;
                const isAct = wk.id === curWaktu;
                if (isAct) {
                  ctx.fillStyle = '#fbbf24';
                  ctx.beginPath();
                  ctx.roundRect(slotX - slotW * 0.46, stripY - 3.3 * z, slotW * 0.92, 6.6 * z, 2.2 * z);
                  ctx.fill();
                  ctx.fillStyle = '#064e3b';
                } else {
                  ctx.fillStyle = '#d1fae5';
                }
                ctx.font = `bold ${Math.round(4.3 * z)}px sans-serif`;
                ctx.fillText(wk.id, slotX, stripY);
              });

              ctx.restore();
            }

            // 7) Illuminated Mosque Name Signboard ("🕌 MASJID AL-HIKMAH • IQRO & SHOLAT")
            const signM = toScreen(bx - 0.42, by + 0.42, 39.5, camera.x, camera.y);
            ctx.fillStyle = '#064e3b';
            ctx.beginPath();
            ctx.roundRect(signM.x - 36 * z, signM.y - 6.5 * z, 72 * z, 12 * z, 3.5 * z);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.2 * z;
            ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.font = `bold ${Math.round(5.6 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🕌 MASJID AL-HIKMAH', signM.x, signM.y - 0.5 * z);
          } else if (b.id === 'bank_materi') {
            // =========================================================================
            // 10. GEDUNG BANK MATERI GURU (Di Sisi Barat Laut [-5.35, 0, -4.85])
            //     Khusus Guru • Input Mapel, Elemen, TP, Materi Esensial & Generate AI
            // =========================================================================
            const drawIsoBoxBM = (
              c: CanvasRenderingContext2D,
              cx: number,
              cy: number,
              zBase: number,
              w: number,
              d: number,
              h: number,
              topCol: string,
              leftCol: string,
              rightCol: string,
              camX: number,
              camY: number,
              strokeCol?: string
            ) => {
              const hw = w / 2;
              const hd = d / 2;
              const bW = toScreen(cx - hw, cy + hd, zBase, camX, camY);
              const bS = toScreen(cx + hw, cy + hd, zBase, camX, camY);
              const bE = toScreen(cx + hw, cy - hd, zBase, camX, camY);
              const tN = toScreen(cx - hw, cy - hd, zBase + h, camX, camY);
              const tW = toScreen(cx - hw, cy + hd, zBase + h, camX, camY);
              const tS = toScreen(cx + hw, cy + hd, zBase + h, camX, camY);
              const tE = toScreen(cx + hw, cy - hd, zBase + h, camX, camY);

              c.fillStyle = leftCol;
              c.beginPath();
              c.moveTo(tW.x, tW.y);
              c.lineTo(tS.x, tS.y);
              c.lineTo(bS.x, bS.y);
              c.lineTo(bW.x, bW.y);
              c.closePath();
              c.fill();
              if (strokeCol) {
                c.strokeStyle = strokeCol;
                c.lineWidth = 0.7 * z;
                c.stroke();
              }

              c.fillStyle = rightCol;
              c.beginPath();
              c.moveTo(tS.x, tS.y);
              c.lineTo(tE.x, tE.y);
              c.lineTo(bE.x, bE.y);
              c.lineTo(bS.x, bS.y);
              c.closePath();
              c.fill();
              if (strokeCol) {
                c.strokeStyle = strokeCol;
                c.lineWidth = 0.7 * z;
                c.stroke();
              }

              c.fillStyle = topCol;
              c.beginPath();
              c.moveTo(tN.x, tN.y);
              c.lineTo(tE.x, tE.y);
              c.lineTo(tS.x, tS.y);
              c.lineTo(tW.x, tW.y);
              c.closePath();
              c.fill();
              if (strokeCol) {
                c.strokeStyle = strokeCol;
                c.lineWidth = 0.7 * z;
                c.stroke();
              }
            };

            // 1) Stepped Indigo-Slate & Gold Marble Plinth
            drawIsoBoxBM(ctx, bx, by, 0, 1.54, 1.54, 4.5, '#e0e7ff', '#94a3b8', '#cbd5e1', camera.x, camera.y, '#64748b');
            drawIsoBoxBM(ctx, bx, by, 4.5, 1.40, 1.40, 3.0, '#6366f1', '#3730a3', '#4f46e5', camera.x, camera.y, '#312e81');
            drawIsoBoxBM(ctx, bx, by, 7.5, 1.28, 1.28, 2.5, '#f8fafc', '#cbd5e1', '#e2e8f0', camera.x, camera.y, '#94a3b8');

            // Front-East Welcoming Steps toward the central promenade
            drawIsoBoxBM(ctx, bx + 0.54, by + 0.54, 0, 0.50, 0.50, 2.6, '#fef3c7', '#fde68a', '#f59e0b', camera.x, camera.y);
            drawIsoBoxBM(ctx, bx + 0.44, by + 0.44, 2.6, 0.40, 0.40, 2.6, '#fffbeb', '#fef3c7', '#fbbf24', camera.x, camera.y);

            // 2) Main Neo-Classical Digital Knowledge Vault Hall
            drawIsoBoxBM(ctx, bx, by, 10, 1.12, 1.12, 33, '#eef2ff', '#c7d2fe', '#e0e7ff', camera.x, camera.y, '#818cf8');

            // Royal Indigo & Gold Crown Cornice Band
            drawIsoBoxBM(ctx, bx, by, 36, 1.16, 1.16, 4.5, '#4f46e5', '#312e81', '#3730a3', camera.x, camera.y);
            drawIsoBoxBM(ctx, bx, by, 40.5, 1.18, 1.18, 2.8, '#fbbf24', '#b45309', '#d97706', camera.x, camera.y);

            // 3) 4 Classical Marble Columns with Golden Capitals
            for (const [px, py] of [
              [-0.52, -0.52],
              [0.52, -0.52],
              [-0.52, 0.52],
              [0.52, 0.52],
            ]) {
              drawIsoBoxBM(ctx, bx + px, by + py, 10, 0.15, 0.15, 31, '#ffffff', '#cbd5e1', '#e2e8f0', camera.x, camera.y);
              drawIsoBoxBM(ctx, bx + px, by + py, 41, 0.18, 0.18, 3.0, '#fde047', '#ca8a04', '#eab308', camera.x, camera.y);
            }

            // 4) Grand Vault Entrance Portal & Glowing AI Data Windows
            const doorBM = toScreen(bx + 0.46, by + 0.46, 10, camera.x, camera.y);
            ctx.save();
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.roundRect(doorBM.x - 8 * z, doorBM.y - 20 * z, 16 * z, 20 * z, [6 * z, 6 * z, 0, 0]);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.6 * z;
            ctx.stroke();

            // Golden Vault Wheel / Key Emblem on Door
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.arc(doorBM.x, doorBM.y - 10 * z, 4.2 * z, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();

            // Illuminated Indigo-Cyan Smart Windows on Left & Right Facades
            for (const wOff of [-0.26, 0.22]) {
              const wLeft = toScreen(bx + wOff, by + 0.54, 21, camera.x, camera.y);
              const wRight = toScreen(bx + 0.54, by + wOff, 21, camera.x, camera.y);
              for (const wPt of [wLeft, wRight]) {
                ctx.fillStyle = isNight ? '#fde047' : '#38bdf8';
                ctx.beginPath();
                ctx.roundRect(wPt.x - 3.5 * z, wPt.y - 6 * z, 7 * z, 10 * z, 2 * z);
                ctx.fill();
                ctx.strokeStyle = '#fbbf24';
                ctx.lineWidth = 0.9 * z;
                ctx.stroke();
              }
            }

            // 5) Stepped Roof Pedestal & Levitating AI Knowledge Crystal Beacon
            drawIsoBoxBM(ctx, bx, by, 43.3, 0.84, 0.84, 5.2, '#4338ca', '#312e81', '#3730a3', camera.x, camera.y, '#6366f1');
            drawIsoBoxBM(ctx, bx, by, 48.5, 0.58, 0.58, 3.2, '#fbbf24', '#b45309', '#d97706', camera.x, camera.y);

            const crystalFloat = Math.sin(elapsed * 2.8) * 2.8 * z;
            const crystalPt = toScreen(bx, by, 62, camera.x, camera.y);
            const cY = crystalPt.y + crystalFloat;

            // Expanding AI Distribution Rings around Roof Beacon (Symbolizing AI spreading materials to all buildings)
            for (let ri = 0; ri < 2; ri++) {
              const rProg = (elapsed * 0.55 + ri * 0.5) % 1;
              const rx = (10 + rProg * 28) * z;
              const ry = (5 + rProg * 14) * z;
              ctx.strokeStyle = `rgba(99, 102, 241, ${(1 - rProg) * 0.65})`;
              ctx.lineWidth = 1.3 * z;
              ctx.beginPath();
              ctx.ellipse(crystalPt.x, cY, rx, ry, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Glowing Diamond AI Crystal
            ctx.save();
            ctx.fillStyle = '#38bdf8';
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.3 * z;
            ctx.beginPath();
            ctx.moveTo(crystalPt.x, cY - 11 * z);
            ctx.lineTo(crystalPt.x + 7.5 * z, cY);
            ctx.lineTo(crystalPt.x, cY + 9 * z);
            ctx.lineTo(crystalPt.x - 7.5 * z, cY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            // 6) Signboard "🏦 BANK MATERI GURU" + "🔒 KHUSUS GURU • AI"
            const signBM = toScreen(bx + 0.36, by + 0.36, 40.5, camera.x, camera.y);
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.roundRect(signBM.x - 42 * z, signBM.y - 8 * z, 84 * z, 15 * z, 3.8 * z);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.25 * z;
            ctx.stroke();

            ctx.fillStyle = '#fef08a';
            ctx.font = `bold ${Math.round(5.4 * z)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🏦 BANK MATERI GURU', signBM.x, signBM.y - 2.4 * z);

            ctx.fillStyle = '#a5b4fc';
            ctx.font = `bold ${Math.round(3.8 * z)}px sans-serif`;
            ctx.fillText('🔒 KHUSUS GURU • GENERATE AI', signBM.x, signBM.y + 3.4 * z);
          }

          // Floating Building Label ONLY when touched, hovered or active (compact & semi-transparent, fades after 5s stationary)
          const tagAlpha = isHovered ? 1.0 : overheadTagAlpha;
          const shouldShowLabel = (isHovered || activeBuilding === b.id || lastTouchedIdRef.current === b.id) && tagAlpha > 0.005;
          if (shouldShowLabel) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * tagAlpha;
            const tagY = pt.y - (b.id === 'balai_kota' ? 86 : b.id === 'masjid' || b.id === 'bank_materi' ? 78 : b.id === 'menara_mentor' || b.id === 'bengkel_latihan' ? 62 : b.id === 'taman_refleksi' ? 60 : 52) * z;
            const labelText = `${b.icon} ${b.name}`;
            ctx.font = `bold ${Math.round(8.2 * z)}px sans-serif`;
            const tMetrics = ctx.measureText(labelText);
            const tagW = tMetrics.width + 11 * z;
            const tagH = 15.5 * z;

            ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
            ctx.beginPath();
            ctx.roundRect(pt.x - tagW / 2, tagY - tagH / 2, tagW, tagH, 7.5 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.72)';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(labelText, pt.x, tagY);
            ctx.restore();
          }
          ctx.restore();
        } else if (item.type === 'cafe') {
          // SOUTH: TOKO ROTI & KAFE WARGA (Enriched Bakery & Espresso Stall - Enlarged Slightly)
          const pt = toScreen(cafeWx, cafeWy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current * 1.16;

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

          // Floating Pill Badge above Toko Roti awning ONLY when touched/opened (compact & semi-transparent, fades after 5s stationary)
          const isCafeTouched = (lastTouchedIdRef.current === 'cafe' || isCafeMenuOpen) && overheadTagAlpha > 0.005;
          if (isCafeTouched) {
            const trBadgeY = pt.y - 36 * z;
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
            const trLabel = '🥐 Toko Roti & Kafe';
            ctx.font = `bold ${Math.round(8.0 * z)}px sans-serif`;
            const trMetrics = ctx.measureText(trLabel);
            const trW = trMetrics.width + 11 * z;
            const trH = 15 * z;
            ctx.beginPath();
            ctx.roundRect(pt.x - trW / 2, trBadgeY - trH / 2, trW, trH, 7.5 * z);
            ctx.fill();
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.72)';
            ctx.lineWidth = 1.0 * z;
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
        } else if (item.type === 'housing_gate') {
          // GERBANG & PAPAN KOMPLEKS PERUMAHAN GURU & WISMA DKV (Di Belakang Perpustakaan Kampus [-6.55, 0])
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current * 1.12;
          ctx.save();

          const gateTitle = '🏡 PERUMAHAN GURU & WISMA DKV';
          ctx.font = `bold ${Math.max(4, Math.round(4.5 * z))}px sans-serif`;
          const gateTm = ctx.measureText(gateTitle);
          const signW = Math.max(76 * z, gateTm.width + 14 * z);
          const signH = 13 * z;
          const signY = pt.y - 25 * z;
          const pillarSpan = Math.min(24, Math.max(14, (signW / z) * 0.34));

          // Soft shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 2 * z, (pillarSpan + 6) * z, 7 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Ornamental stone & flower planter base on both sides of the boulevard sign
          [-pillarSpan, pillarSpan].forEach((ox) => {
            ctx.fillStyle = '#475569';
            ctx.fillRect(pt.x + (ox - 2.5) * z, pt.y - 18 * z, 5 * z, 19 * z);
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(pt.x + (ox - 3.2) * z, pt.y - 19.5 * z, 6.4 * z, 2.2 * z);
            // Mini garden bush at post base
            ctx.fillStyle = '#10b981';
            ctx.beginPath();
            ctx.arc(pt.x + ox * z, pt.y - 1 * z, 3.8 * z, 0, Math.PI * 2);
            ctx.fill();
          });

          // Overhead Neighborhood Arch Signboard (Text strictly fitted inside Frame)
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(pt.x - signW / 2, signY, signW, signH, 4 * z);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 1.3 * z;
          ctx.stroke();

          ctx.strokeStyle = 'rgba(254, 240, 138, 0.45)';
          ctx.lineWidth = 0.65 * z;
          ctx.beginPath();
          ctx.roundRect(
            pt.x - signW / 2 + 1.8 * z,
            signY + 1.8 * z,
            signW - 3.6 * z,
            signH - 3.6 * z,
            2.8 * z
          );
          ctx.stroke();

          ctx.fillStyle = '#fef08a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(gateTitle, pt.x, signY + signH / 2, signW - 10 * z);

          ctx.restore();
        } else if (item.type === 'housing_unit') {
          // KOMPLEKS PERUMAHAN GURU & SISWA DI BELAKANG PERPUSTAKAAN KAMPUS (Ujung Barat Peta)
          const u = item.unit;
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current * 1.16;
          const distToPlayer = Math.hypot(player.wx - item.wx, player.wy - item.wy);

          ctx.save();
          if (distToPlayer < 1.55) {
            ctx.globalAlpha = 0.55;
          }

          // 1. Soft Ground & Garden Lawn Shadow
          ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 2 * z, pt.y + 5 * z, 32 * z, 16 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Isometric Stone Foundation & Front Terrace Stepping Stones
          ctx.fillStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(pt.x - 24 * z, pt.y + 11 * z);
          ctx.lineTo(pt.x, pt.y + 23 * z);
          ctx.lineTo(pt.x + 24 * z, pt.y + 11 * z);
          ctx.lineTo(pt.x + 24 * z, pt.y + 15 * z);
          ctx.lineTo(pt.x, pt.y + 27 * z);
          ctx.lineTo(pt.x - 24 * z, pt.y + 15 * z);
          ctx.closePath();
          ctx.fill();

          // 3. Left Shaded House Wall
          ctx.fillStyle = u.kind === 'guru' ? '#f1f5f9' : '#e0f2fe';
          ctx.beginPath();
          ctx.moveTo(pt.x - 22 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x, pt.y + 1 * z);
          ctx.lineTo(pt.x, pt.y + 23 * z);
          ctx.lineTo(pt.x - 22 * z, pt.y + 11 * z);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 0.8 * z;
          ctx.stroke();

          // 4. Right Sunlit Front House Wall (Facing Perpustakaan & City Center)
          ctx.fillStyle = u.kind === 'guru' ? '#fffbeb' : '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y + 1 * z);
          ctx.lineTo(pt.x + 22 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x + 22 * z, pt.y + 11 * z);
          ctx.lineTo(pt.x, pt.y + 23 * z);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 0.8 * z;
          ctx.stroke();

          // Architectural Timber Accent Slats on Guru Houses / Cheerful Color Trim on Siswa Houses
          ctx.fillStyle = u.accentColor;
          ctx.fillRect(pt.x - 1 * z, pt.y + 1 * z, 2 * z, 22 * z);
          ctx.fillRect(pt.x + 20 * z, pt.y - 10 * z, 2 * z, 21 * z);

          // 5. Isometric Pitched Gable Roof with Chimney & Dormer Window
          // Left Roof Slope
          ctx.fillStyle = u.roofDark;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - 25 * z);
          ctx.lineTo(pt.x - 25 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x, pt.y + 3 * z);
          ctx.closePath();
          ctx.fill();

          // Right Sunlit Roof Slope
          ctx.fillStyle = u.roofColor;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - 25 * z);
          ctx.lineTo(pt.x + 25 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x, pt.y + 3 * z);
          ctx.closePath();
          ctx.fill();

          // Roof Eaves Trim
          ctx.strokeStyle = u.accentColor;
          ctx.lineWidth = 1.4 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x - 25 * z, pt.y - 11 * z);
          ctx.lineTo(pt.x, pt.y + 3 * z);
          ctx.lineTo(pt.x + 25 * z, pt.y - 11 * z);
          ctx.stroke();

          // Cozy Chimney on Roof Peak
          ctx.fillStyle = '#78350f';
          ctx.fillRect(pt.x - 10 * z, pt.y - 24 * z, 4.5 * z, 8 * z);
          ctx.fillStyle = '#451a03';
          ctx.fillRect(pt.x - 10.6 * z, pt.y - 25.2 * z, 5.7 * z, 1.6 * z);

          // 6. Front Door & Porch Canopy on Right Sunlit Wall
          const doorX = pt.x + 6.5 * z;
          const doorY = pt.y + 19.5 * z;
          ctx.fillStyle = u.kind === 'guru' ? '#78350f' : '#1e3a8a';
          ctx.beginPath();
          ctx.roundRect(doorX - 3.5 * z, doorY - 10.5 * z, 7 * z, 10.5 * z, [2 * z, 2 * z, 0, 0]);
          ctx.fill();
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 0.75 * z;
          ctx.stroke();

          // Warm Door Window & Handle
          ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
          ctx.beginPath();
          ctx.arc(doorX, doorY - 6.8 * z, 1.8 * z, 0, Math.PI * 2);
          ctx.fill();

          // Illuminated Windows on Left & Right Walls with Flower Boxes
          const winColor = isNight ? '#fef08a' : '#38bdf8';
          // Left wall window
          ctx.fillStyle = winColor;
          ctx.fillRect(pt.x - 14.5 * z, pt.y + 2 * z, 7.5 * z, 6.5 * z);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8 * z;
          ctx.strokeRect(pt.x - 14.5 * z, pt.y + 2 * z, 7.5 * z, 6.5 * z);
          // Flower box under left window
          ctx.fillStyle = '#92400e';
          ctx.fillRect(pt.x - 15.2 * z, pt.y + 8.2 * z, 8.9 * z, 1.8 * z);
          ctx.fillStyle = '#ec4899';
          ctx.beginPath();
          ctx.arc(pt.x - 12.5 * z, pt.y + 7.8 * z, 1.2 * z, 0, Math.PI * 2);
          ctx.arc(pt.x - 9.2 * z, pt.y + 7.8 * z, 1.2 * z, 0, Math.PI * 2);
          ctx.fill();

          // Right wall study window
          ctx.fillStyle = winColor;
          ctx.fillRect(pt.x + 12.5 * z, pt.y + 1.5 * z, 6.5 * z, 6.5 * z);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.8 * z;
          ctx.strokeRect(pt.x + 12.5 * z, pt.y + 1.5 * z, 6.5 * z, 6.5 * z);

          // Front Yard Garden Fence & Kotak Surat Kecil (Small Mailbox for Suggestions) at EVERY Wisma Siswa & Guru
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1.1 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x + 2 * z, pt.y + 24.5 * z);
          ctx.lineTo(pt.x + 16 * z, pt.y + 17 * z);
          ctx.stroke();

          if (u.kind === 'siswa') {
            // Cute Parked Student Bicycle beside the porch of Student Wisma
            const bx = pt.x + 11.2 * z;
            const by = pt.y + 18.8 * z;
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 0.85 * z;
            ctx.beginPath();
            ctx.arc(bx - 2.0 * z, by, 1.6 * z, 0, Math.PI * 2);
            ctx.arc(bx + 2.0 * z, by, 1.6 * z, 0, Math.PI * 2);
            ctx.stroke();
            ctx.strokeStyle = u.accentColor;
            ctx.beginPath();
            ctx.moveTo(bx - 2.0 * z, by);
            ctx.lineTo(bx, by - 2.2 * z);
            ctx.lineTo(bx + 2.0 * z, by);
            ctx.stroke();
          }

          // Kotak Surat Kecil (Small Mailbox for Masukan & Saran) at EVERY Wisma Siswa & Rumah Dinas Guru
          const mbX = pt.x + 16.8 * z;
          const mbY = pt.y + 12.2 * z;
          // Mailbox Wooden/Steel Post
          ctx.fillStyle = '#334155';
          ctx.fillRect(mbX - 0.7 * z, mbY, 1.4 * z, 5.5 * z);
          // Mailbox Rounded Box Body
          ctx.fillStyle = u.kind === 'guru' ? '#dc2626' : '#0284c7';
          ctx.beginPath();
          ctx.roundRect(mbX - 2.6 * z, mbY - 2.8 * z, 5.2 * z, 3.4 * z, 1.4 * z);
          ctx.fill();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 0.65 * z;
          ctx.stroke();
          // White Letter Slot / Envelope stripe inside Mailbox
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(mbX - 1.5 * z, mbY - 1.4 * z, 3.0 * z, 0.9 * z);
          // Little Raised Red/Gold Signal Flag on Mailbox Side
          ctx.fillStyle = u.kind === 'guru' ? '#fbbf24' : '#ef4444';
          ctx.fillRect(mbX + 2.4 * z, mbY - 4.0 * z, 0.8 * z, 2.2 * z);
          ctx.fillRect(mbX + 2.4 * z, mbY - 4.0 * z, 1.8 * z, 1.0 * z);

          // House Badge Plate on Gable ("🏡 GURU 1/2" / "🏘️ X DKV", "🏘️ XI DKV", "🏘️ XII DKV")
          ctx.font = `bold ${Math.max(3, Math.round(3.3 * z))}px sans-serif`;
          const gableLabel = u.shortBadge || (u.kind === 'guru' ? '🏡 GURU' : '🏘️ SISWA');
          const gableW = Math.max(20 * z, ctx.measureText(gableLabel).width + 6 * z);
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(pt.x - gableW / 2, pt.y - 7.8 * z, gableW, 5.6 * z, 2 * z);
          ctx.fill();
          ctx.strokeStyle = u.accentColor;
          ctx.lineWidth = 0.8 * z;
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(gableLabel, pt.x, pt.y - 5.0 * z, gableW - 3 * z);

          // Floating Hover / Proximity Label when Player is Nearby (fades after 5s stationary)
          if (distToPlayer < 2.35 && overheadTagAlpha > 0.005) {
            ctx.save();
            ctx.globalAlpha = (ctx.globalAlpha || 1.0) * overheadTagAlpha;
            const hTagY = pt.y - 34 * z;
            const hLabel = `${u.name} • 📮 Kotak Saran`;
            ctx.font = `bold ${Math.round(6.8 * z)}px sans-serif`;
            const tw = ctx.measureText(hLabel).width + 10 * z;
            const th = 13 * z;
            ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
            ctx.beginPath();
            ctx.roundRect(pt.x - tw / 2, hTagY - th / 2, tw, th, 6.5 * z);
            ctx.fill();
            ctx.strokeStyle = u.accentColor;
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(hLabel, pt.x, hTagY);
            ctx.restore();
          }

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
          const isThumbsUpNow = activeEmote?.type === 'thumbsup';

          // Natural leg swing & gentle bobbing (plus lively running stride, rhythmic dancing or giggle bounce)
          const isRun = Boolean(item.isPlayer ? player.isRunning : av.isRunning);
          let legSwing = (av.isMoving && !isSittingNow) ? Math.sin(av.walkFrame) * (isRun ? 5.2 : 3.5) * z : 0;
          if (isDancingNow && !isSittingNow) {
            legSwing = Math.sin(elapsed * 10) * 2.8 * z;
          }

          let avY = pt.y + (isSittingNow ? -1.8 * z : (av.isMoving ? -Math.abs(Math.sin(av.walkFrame * 2)) * (isRun ? 2.3 : 1.5) * z : 0));

          if (isDancingNow) {
            const danceBounce = !isSittingNow ? Math.abs(Math.sin(elapsed * 10)) * 3.5 * z : Math.sin(elapsed * 8) * 1.5 * z;
            avY -= danceBounce;
            if (!isSittingNow && !swingMetrics && !twoPersonBenchLock) {
              pt.x += Math.sin(elapsed * 7) * 2.4 * z;
            }
          } else if (isLaughingNow) {
            const laughBounce = Math.abs(Math.sin(elapsed * 14)) * 2.6 * z;
            avY -= laughBounce;
          } else if (isThumbsUpNow) {
            const thumbBounce = Math.abs(Math.sin(elapsed * 6.5)) * 1.9 * z;
            avY -= thumbBounce;
          }

          if (swingMetrics) {
            // Lock avatar hip/seat center with 100% precision onto the wooden swing plank!
            pt.x = swingMetrics.seatX;
            avY = swingMetrics.seatY + 1.2 * z;
          } else if (twoPersonBenchLock) {
            pt.x = twoPersonBenchLock.screenX;
            avY = twoPersonBenchLock.screenY;
          }

          const isKikyTimeTraveler = Boolean(
            (item.isPlayer && isTimeTravelerAccount(studentName, studentId)) ||
              isTimeTravelerAccount(av.name, av.handle)
          );
          const isJournalistAvatar = Boolean(
            (item.isPlayer && isGuest) ||
              av.role === 'wartawan' ||
              String(av.handle || '').toLowerCase() === 'tamu_kota' ||
              String(av.name || '').toLowerCase() === 'tamu kota'
          );
          const avatarDistinctOutfit = getDistinctAvatarOutfit(
            item.isPlayer ? `${studentId || ''}_${studentName}` : `${av.id || ''}_${av.name || av.handle || ''}`
          );
          const resolvedShirtColor = isJournalistAvatar
            ? '#d97706'
            : av.shirtColor && av.shirtColor !== '#ec4899' && av.shirtColor !== '#2563eb'
            ? av.shirtColor
            : avatarDistinctOutfit.shirt;
          const resolvedPantsColor = isJournalistAvatar
            ? '#334155'
            : av.pantsColor && av.pantsColor !== '#be185d' && av.pantsColor !== '#1e293b'
            ? av.pantsColor
            : avatarDistinctOutfit.pants;
          const resolvedHijabColor = avatarDistinctOutfit.hijab;
          const resolvedHijabEdge = avatarDistinctOutfit.hijabEdge;

          // 0. SPECIAL CHRONO PORTAL RING UNDER TIME TRAVELER (kikybahsoan)
          if (isKikyTimeTraveler && !isOnSwing) {
            ctx.save();
            const chronoAngle = elapsed * 2.4;
            const ringRx = 11.5 * z;
            const ringRy = 5.4 * z;

            // Soft cyan-gold temporal glow under feet
            const timeGlow = ctx.createRadialGradient(pt.x, pt.y + 1, 1 * z, pt.x, pt.y + 1, 14 * z);
            timeGlow.addColorStop(0, 'rgba(34, 211, 238, 0.42)');
            timeGlow.addColorStop(0.55, 'rgba(250, 204, 21, 0.22)');
            timeGlow.addColorStop(1, 'rgba(34, 211, 238, 0)');
            ctx.fillStyle = timeGlow;
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1, 14 * z, 6.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Outer golden clockwork ring
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.85)';
            ctx.lineWidth = 1.3 * z;
            ctx.setLineDash([3 * z, 2 * z]);
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1, ringRx, ringRy, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Inner neon-cyan temporal ring
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.ellipse(pt.x, pt.y + 1, ringRx * 0.72, ringRy * 0.72, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Rotating clock hands inside ground portal
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x, pt.y + 1);
            ctx.lineTo(
              pt.x + Math.cos(chronoAngle) * ringRx * 0.65,
              pt.y + 1 + Math.sin(chronoAngle) * ringRy * 0.65
            );
            ctx.moveTo(pt.x, pt.y + 1);
            ctx.lineTo(
              pt.x + Math.cos(-chronoAngle * 0.5) * ringRx * 0.45,
              pt.y + 1 + Math.sin(-chronoAngle * 0.5) * ringRy * 0.45
            );
            ctx.stroke();

            // 3 Orbiting temporal chrono sparks rising around Time Traveler
            for (let sp = 0; sp < 3; sp++) {
              const spAng = elapsed * 3 + sp * ((Math.PI * 2) / 3);
              const sx = pt.x + Math.cos(spAng) * 9.5 * z;
              const sy = avY - (6 + ((elapsed * 10 + sp * 6) % 18)) * z;
              ctx.fillStyle = sp % 2 === 0 ? '#22d3ee' : '#fde047';
              ctx.beginPath();
              ctx.arc(sx, sy, 1.3 * z, 0, Math.PI * 2);
              ctx.fill();
            }

            // Chrono-Teleport Flash Burst (at origin & destination when Master kikybahsoan teleports)
            if (item.isPlayer && teleportFlashRef.current) {
              const tf = teleportFlashRef.current;
              const tfAge = (currentTime - tf.startTime) / 1000;
              if (tfAge < 0.65) {
                const tfAlpha = Math.max(0, 1 - tfAge / 0.65);
                const fromPt = toScreen(tf.fromWx, tf.fromWy, 0, camera.x, camera.y);
                const toPt = toScreen(tf.toWx, tf.toWy, 0, camera.x, camera.y);

                // Origin departure ring & vertical beam
                ctx.strokeStyle = `rgba(34, 211, 238, ${(tfAlpha * 0.85).toFixed(2)})`;
                ctx.lineWidth = 2.0 * z;
                ctx.beginPath();
                ctx.ellipse(
                  fromPt.x,
                  fromPt.y,
                  (8 + tfAge * 26) * z,
                  (4 + tfAge * 12) * z,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();

                // Destination arrival chrono beam & golden burst
                const beamGrad = ctx.createLinearGradient(toPt.x, toPt.y - 48 * z, toPt.x, toPt.y + 4 * z);
                beamGrad.addColorStop(0, 'rgba(34, 211, 238, 0)');
                beamGrad.addColorStop(0.5, `rgba(34, 211, 238, ${(tfAlpha * 0.55).toFixed(2)})`);
                beamGrad.addColorStop(1, `rgba(250, 204, 21, ${(tfAlpha * 0.85).toFixed(2)})`);
                ctx.fillStyle = beamGrad;
                ctx.beginPath();
                ctx.ellipse(toPt.x, toPt.y - 20 * z, (11 - tfAge * 8) * z, 26 * z, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = `rgba(250, 204, 21, ${(tfAlpha * 0.95).toFixed(2)})`;
                ctx.lineWidth = 2.2 * z;
                ctx.beginPath();
                ctx.ellipse(
                  toPt.x,
                  toPt.y,
                  (6 + tfAge * 28) * z,
                  (3 + tfAge * 13) * z,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();
              } else {
                teleportFlashRef.current = null;
              }
            }
            ctx.restore();
          }

          // 1. LEGS & PANTS / SKIRT
          if (isSittingNow) {
            // SITTING ANIMATION: Legs folded forward resting comfortably over the bench/swing surface
            const swayVal = swingMetrics ? swingMetrics.sway : 0;
            const calfKickX = isOnSwing ? swayVal * 2.2 * z : 0;
            const calfKickY = isOnSwing ? -Math.max(0, swayVal) * 1.6 * z : 0;

            ctx.fillStyle = isKikyTimeTraveler
              ? '#0f172a'
              : isTeacherAvatar
              ? (isFemale ? '#065f46' : '#1e293b')
              : resolvedPantsColor;

            // Horizontal thighs resting flat on bench/swing plank
            ctx.fillRect(pt.x - 4 * z, avY - 4 * z, 3.8 * z, 3.2 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY - 4 * z, 3.8 * z, 3.2 * z);

            // Vertical calves hanging downward from bench/swing
            ctx.fillRect(pt.x - 4 * z + calfKickX, avY - 1 * z + calfKickY, 3.2 * z, 4.2 * z);
            ctx.fillRect(pt.x + 1 * z + calfKickX, avY - 1 * z + calfKickY, 3.2 * z, 4.2 * z);

            // Shoes resting on ground / swinging in air
            ctx.fillStyle = isKikyTimeTraveler
              ? '#22d3ee'
              : isFemale
              ? (isTeacherAvatar ? '#064e3b' : '#be185d')
              : '#0f172a';
            ctx.fillRect(pt.x - 4.5 * z + calfKickX, avY + 3.2 * z + calfKickY, 4 * z, 2.2 * z);
            ctx.fillRect(pt.x + 0.8 * z + calfKickX, avY + 3.2 * z + calfKickY, 4 * z, 2.2 * z);
          } else if (isKikyTimeTraveler) {
            // KIKYBAHSOAN (PENJELAJAH WAKTU): Flowing Cosmic Trench Coat Tails & Futuristic Chrono Gravity Boots
            const coatFlare = Math.sin(elapsed * 4.5) * 1.1 * z;
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(pt.x - 5.5 * z, avY - 7 * z);
            ctx.lineTo(pt.x + 5.5 * z, avY - 7 * z);
            ctx.lineTo(pt.x + 7.4 * z + coatFlare, avY + 0.2 * z);
            ctx.lineTo(pt.x + 1.8 * z, avY - 1.5 * z);
            ctx.lineTo(pt.x - 1.8 * z, avY - 1.5 * z);
            ctx.lineTo(pt.x - 7.4 * z - coatFlare, avY + 0.2 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Dark temporal trousers
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 3.6 * z, avY - 5 * z + legSwing, 3.1 * z, 6 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY - 5 * z - legSwing, 3.1 * z, 6 * z);

            // Chrono Gravity Boots with glowing cyan hover soles
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(pt.x - 4.2 * z, avY + 0.8 * z + legSwing, 3.8 * z, 2.4 * z);
            ctx.fillRect(pt.x + 0.4 * z, avY + 0.8 * z - legSwing, 3.8 * z, 2.4 * z);
            ctx.fillStyle = '#22d3ee';
            ctx.fillRect(pt.x - 4.2 * z, avY + 2.6 * z + legSwing, 3.8 * z, 0.9 * z);
            ctx.fillRect(pt.x + 0.4 * z, avY + 2.6 * z - legSwing, 3.8 * z, 0.9 * z);
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
              // Female Hijabi Student: Modest long pleated skirt (rok panjang rapi) & white socks/shoes
              ctx.fillStyle = resolvedPantsColor;
              ctx.beginPath();
              ctx.moveTo(pt.x - 5.2 * z, avY - 7 * z);
              ctx.lineTo(pt.x + 5.2 * z, avY - 7 * z);
              ctx.lineTo(pt.x + 6.6 * z, avY + 0.8 * z);
              ctx.lineTo(pt.x - 6.6 * z, avY + 0.8 * z);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
              ctx.lineWidth = 0.7 * z;
              for (let pl = -3.6; pl <= 3.6; pl += 2.4) {
                ctx.beginPath();
                ctx.moveTo(pt.x + pl * z, avY - 6.8 * z);
                ctx.lineTo(pt.x + pl * 1.15 * z, avY + 0.6 * z);
                ctx.stroke();
              }
              // Shoes
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(pt.x - 4 * z, avY + 1 * z + legSwing * 0.4, 3.5 * z, 2.4 * z);
              ctx.fillRect(pt.x + 0.5 * z, avY + 1 * z - legSwing * 0.4, 3.5 * z, 2.4 * z);
            }
          } else {
            // Male Pants
            ctx.fillStyle = isTeacherAvatar ? '#1e293b' : resolvedPantsColor;
            ctx.fillRect(pt.x - 3.5 * z, avY - 5 * z + legSwing, 3 * z, 6 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY - 5 * z - legSwing, 3 * z, 6 * z);
            // Shoes
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 4 * z, avY + 1 * z + legSwing, 3.5 * z, 2.5 * z);
            ctx.fillRect(pt.x + 0.5 * z, avY + 1 * z - legSwing, 3.5 * z, 2.5 * z);
          }

          // 2. SHIRT / TORSO
          if (isKikyTimeTraveler) {
            // KIKYBAHSOAN (PENJELAJAH WAKTU): High-Collar Cosmic Trench Coat, Chrono Bandolier & Glowing Arcane Hourglass Core
            // High popped time-traveler collar behind neck
            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.moveTo(pt.x - 6.2 * z, avY - 13.5 * z);
            ctx.lineTo(pt.x - 7.4 * z, avY - 18.2 * z);
            ctx.lineTo(pt.x + 7.4 * z, avY - 18.2 * z);
            ctx.lineTo(pt.x + 6.2 * z, avY - 13.5 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#22d3ee';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();

            // Main Chrono Coat Torso
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.8 * z, avY - 14.2 * z, 11.6 * z, 8.8 * z, 2.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();

            // Golden-Brass Epaulettes on shoulders
            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(pt.x - 5.8 * z, avY - 14.5 * z, 2.8 * z, 1.3 * z);
            ctx.fillRect(pt.x + 3.0 * z, avY - 14.5 * z, 2.8 * z, 1.3 * z);

            // Diagonal Leather & Brass Chrono Bandolier Strap across chest
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 1.8 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 4.8 * z, avY - 13.8 * z);
            ctx.lineTo(pt.x + 4.8 * z, avY - 6.2 * z);
            ctx.stroke();

            // Chrono Waist Belt with Golden Time Buckle
            ctx.fillStyle = '#78350f';
            ctx.fillRect(pt.x - 5.6 * z, avY - 6.8 * z, 11.2 * z, 1.6 * z);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(pt.x - 1.4 * z, avY - 7.0 * z, 2.8 * z, 2.0 * z);

            // Pulsing Cyan-Gold Temporal Reactor / Pocket Watch Core in center of chest
            const corePulse = 0.75 + Math.sin(elapsed * 6) * 0.25;
            ctx.fillStyle = `rgba(34, 211, 238, ${corePulse})`;
            ctx.beginPath();
            ctx.arc(pt.x, avY - 10.5 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 0.9 * z;
            ctx.stroke();
          } else if (isTeacherAvatar) {
            if (isFemale) {
              // Female Teacher: Formal blazer in distinct color with golden brooch
              ctx.fillStyle = resolvedShirtColor;
              ctx.beginPath();
              ctx.roundRect(pt.x - 5.5 * z, avY - 14 * z, 11 * z, 8.5 * z, 2.2 * z);
              ctx.fill();
              // Golden brooch
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(pt.x - 2 * z, avY - 11.5 * z, 1.2 * z, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Male Teacher: Formal blazer in distinct color with golden amber tie
              ctx.fillStyle = resolvedShirtColor;
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
          } else if (isJournalistAvatar) {
            // TAMU KOTA (WARTAWAN / REPORTER): Light-Blue Press Shirt + Khaki Multi-Pocket Journalist Vest + Hanging "PRESS" ID Card Lanyard
            ctx.fillStyle = '#bae6fd';
            ctx.beginPath();
            ctx.roundRect(pt.x - 5.4 * z, avY - 14.2 * z, 10.8 * z, 8.8 * z, 2.2 * z);
            ctx.fill();
            // Khaki/Tan Journalist Safari Press Vest panels (Left & Right)
            ctx.fillStyle = '#b45309';
            ctx.fillRect(pt.x - 5.2 * z, avY - 14.0 * z, 3.8 * z, 8.4 * z);
            ctx.fillRect(pt.x + 1.4 * z, avY - 14.0 * z, 3.8 * z, 8.4 * z);
            // Utility Press Pockets on Vest
            ctx.fillStyle = '#78350f';
            ctx.fillRect(pt.x - 4.7 * z, avY - 9.2 * z, 2.8 * z, 2.5 * z);
            ctx.fillRect(pt.x + 1.9 * z, avY - 9.2 * z, 2.8 * z, 2.5 * z);
            // Red Lanyard Strap around neck holding "PRESS" ID Badge
            ctx.strokeStyle = '#dc2626';
            ctx.lineWidth = 0.9 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 1.8 * z, avY - 14.0 * z);
            ctx.lineTo(pt.x, avY - 10.2 * z);
            ctx.lineTo(pt.x + 1.8 * z, avY - 14.0 * z);
            ctx.stroke();
            // White & Cyan "PRESS" ID Badge Card on chest
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 1.7 * z, avY - 10.5 * z, 3.4 * z, 3.8 * z);
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(pt.x - 1.7 * z, avY - 10.5 * z, 3.4 * z, 1.3 * z);
          } else {
            // Student Torso with distinct unique shirt color per student
            ctx.fillStyle = resolvedShirtColor;
            ctx.beginPath();
            ctx.roundRect(pt.x - 5 * z, avY - 14 * z, 10 * z, 8.5 * z, 2.2 * z);
            ctx.fill();

            if (isFemale) {
              // Modest tunic accent trim at waist for hijabi female student
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
              ctx.lineWidth = 0.8 * z;
              ctx.beginPath();
              ctx.moveTo(pt.x - 4.6 * z, avY - 6.2 * z);
              ctx.lineTo(pt.x + 4.6 * z, avY - 6.2 * z);
              ctx.stroke();
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

          const sleeveColor = isKikyTimeTraveler
            ? '#0f172a'
            : isTeacherAvatar
            ? resolvedShirtColor
            : resolvedShirtColor;

          if (isReadingNow) {
            // ARMS HOLDING OPEN BOOK / COMIC
            ctx.fillStyle = sleeveColor;
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
            ctx.strokeStyle = sleeveColor;
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
            ctx.fillStyle = sleeveColor;
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

            ctx.fillStyle = sleeveColor;
            ctx.fillRect(pt.x - 7.2 * z + leftPointX, avY - 14 * z + leftArmY, 2.2 * z, 6.5 * z);
            ctx.fillRect(pt.x + 5.0 * z + rightPointX, avY - 14 * z + rightArmY, 2.2 * z, 6.5 * z);
            // Hands
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x - 6.1 * z + leftPointX, avY - 7.5 * z + leftArmY, 1.4 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 6.1 * z + rightPointX, avY - 7.5 * z + rightArmY, 1.4 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (isThumbsUpNow) {
            // THUMBS-UP GESTURE: Left arm relaxed, Right arm extended forward/upward with a distinct physical Thumbs-Up (👍) hand & raised thumb!
            const thumbPump = Math.sin(elapsed * 7.5) * 1.4 * z;
            const handX = pt.x + 8.6 * z;
            const handY = avY - 12.2 * z + thumbPump;

            ctx.fillStyle = sleeveColor;
            // Left arm relaxed at side
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z, 2.2 * z, 6.8 * z);
            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 7.2 * z, avY - 6.2 * z, 2.2 * z, 2.1 * z);

            // Right sleeve reaching outward to present the Thumbs-Up gesture
            ctx.strokeStyle = sleeveColor;
            ctx.lineWidth = 2.6 * z;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x + 5.2 * z, avY - 12.2 * z);
            ctx.lineTo(handX - 1.2 * z, handY + 0.4 * z);
            ctx.stroke();

            // Closed Fist of the Thumbs-Up Hand
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.roundRect(handX - 1.0 * z, handY - 1.5 * z, 3.8 * z, 3.3 * z, 1.2 * z);
            ctx.fill();
            ctx.strokeStyle = '#c2410c';
            ctx.lineWidth = 0.65 * z;
            ctx.stroke();

            // Prominent Upward-Pointing Thumb (Ibu Jari Terangkat ke Atas 👍)
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.roundRect(handX - 0.6 * z, handY - 4.8 * z, 2.0 * z, 3.7 * z, 0.95 * z);
            ctx.fill();
            ctx.strokeStyle = '#c2410c';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();

            // Golden Star Sparkle Gleam at the Tip of the Raised Thumb!
            const gleamScale = (0.85 + Math.sin(elapsed * 11) * 0.25) * z;
            const gleamX = handX + 0.4 * z;
            const gleamY = handY - 6.0 * z;
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.moveTo(gleamX, gleamY - 2.4 * gleamScale);
            ctx.lineTo(gleamX + 0.7 * gleamScale, gleamY - 0.7 * gleamScale);
            ctx.lineTo(gleamX + 2.4 * gleamScale, gleamY);
            ctx.lineTo(gleamX + 0.7 * gleamScale, gleamY + 0.7 * gleamScale);
            ctx.lineTo(gleamX, gleamY + 2.4 * gleamScale);
            ctx.lineTo(gleamX - 0.7 * gleamScale, gleamY + 0.7 * gleamScale);
            ctx.lineTo(gleamX - 2.4 * gleamScale, gleamY);
            ctx.lineTo(gleamX - 0.7 * gleamScale, gleamY - 0.7 * gleamScale);
            ctx.closePath();
            ctx.fill();
          } else if (isWavingNow) {
            // WAVING ARM: Right hand held high and waving side-to-side
            const waveCycle = Math.sin(elapsed * 10) * 3.6 * z;
            ctx.fillStyle = sleeveColor;
            // Left arm relaxed
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z, 2.2 * z, 7 * z);
            // Right arm raised high
            ctx.fillRect(pt.x + 5.2 * z + waveCycle * 0.4, avY - 18 * z, 2.2 * z, 6.5 * z);

            ctx.fillStyle = '#fed7aa';
            ctx.fillRect(pt.x - 7.2 * z, avY - 6 * z, 2.2 * z, 2.2 * z);
            ctx.beginPath();
            ctx.arc(pt.x + 6.3 * z + waveCycle, avY - 19.5 * z, 1.6 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (isJournalistAvatar) {
            // TAMU KOTA (WARTAWAN / REPORTER): Left hand holds DSLR Camera with Telephoto Lens & Flash, Right hand holds Reporter Microphone
            const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 2.0 * z : 0;
            ctx.fillStyle = '#bae6fd';
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z - armSwing * 0.5, 2.2 * z, 6.2 * z);
            ctx.fillRect(pt.x + 5.0 * z, avY - 13 * z + armSwing * 0.5, 2.2 * z, 6.2 * z);
            // Hands
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(pt.x - 6.1 * z, avY - 6.8 * z - armSwing * 0.5, 1.3 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 6.1 * z, avY - 6.8 * z + armSwing * 0.5, 1.3 * z, 0, Math.PI * 2);
            ctx.fill();

            // Professional DSLR Camera held at left/front chest
            const camX = pt.x - 5.8 * z;
            const camY = avY - 8.2 * z - armSwing * 0.4;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.roundRect(camX - 2.6 * z, camY - 2.2 * z, 5.4 * z, 4.0 * z, 0.8 * z);
            ctx.fill();
            // Camera flash unit on top
            ctx.fillStyle = '#e2e8f0';
            ctx.fillRect(camX - 1.2 * z, camY - 3.4 * z, 2.4 * z, 1.2 * z);
            // Silver & Cyan Telephoto Camera Lens
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.arc(camX + 0.2 * z, camY - 0.2 * z, 1.9 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(camX + 0.2 * z, camY - 0.2 * z, 1.2 * z, 0, Math.PI * 2);
            ctx.fill();
            // Occasional camera shutter flash sparkle
            if (Math.sin(elapsed * 3.2) > 0.92) {
              ctx.fillStyle = 'rgba(254, 240, 138, 0.9)';
              ctx.beginPath();
              ctx.arc(camX, camY - 3.4 * z, 4.2 * z, 0, Math.PI * 2);
              ctx.fill();
            }

            // Reporter Broadcast Microphone in Right Hand
            const micX = pt.x + 7.2 * z;
            const micY = avY - 8.2 * z + armSwing * 0.5;
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1.5 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x + 6.1 * z, avY - 6.5 * z + armSwing * 0.5);
            ctx.lineTo(micX + 1.4 * z, micY - 2.6 * z);
            ctx.stroke();
            // Red/Blue Press Flag cube on mic shaft
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(micX + 0.1 * z, micY - 2.4 * z, 2.2 * z, 1.6 * z);
            // Foam windscreen ball on top of microphone
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(micX + 1.5 * z, micY - 3.3 * z, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();
          } else {
            const armSwing = av.isMoving ? Math.sin(av.walkFrame) * 2.8 * z : 0;
            ctx.fillStyle = sleeveColor;
            ctx.fillRect(pt.x - 7.2 * z, avY - 13 * z - armSwing, 2.2 * z, 7 * z);
            ctx.fillRect(pt.x + 5 * z, avY - 13 * z + armSwing, 2.2 * z, 7 * z);
            if (isKikyTimeTraveler) {
              // Glowing Cyan Chrono Gauntlet / Time-Turner Wristband on left & right cuffs
              ctx.fillStyle = '#22d3ee';
              ctx.fillRect(pt.x - 7.2 * z, avY - 7.2 * z - armSwing, 2.2 * z, 1.3 * z);
              ctx.fillStyle = '#facc15';
              ctx.fillRect(pt.x + 5 * z, avY - 7.2 * z + armSwing, 2.2 * z, 1.3 * z);
            }
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

          // 5. HAIR, HIJAB, HATS & GLASSES (Time Traveler kikybahsoan, Distinguished Teacher, Custom NPCs & Hijabi Female Students)
          if (isKikyTimeTraveler) {
            // KIKYBAHSOAN (PENJELAJAH WAKTU): Tousled Temporal Hair with Silver-Cyan Streaks + Steampunk-Futuristic Glowing Chrono Goggles & Floating Mini Hourglass
            // Dark cosmic hair with silver-cyan time streak
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 21.2 * z, 5.6 * z, Math.PI, 0);
            ctx.fill();
            ctx.fillRect(pt.x - 4.8 * z, avY - 22.4 * z, 4.2 * z, 2.6 * z);
            // Silver-cyan temporal hair streak
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(pt.x - 1.5 * z, avY - 23.2 * z);
            ctx.lineTo(pt.x + 2.2 * z, avY - 20.2 * z);
            ctx.lineTo(pt.x + 0.5 * z, avY - 19.8 * z);
            ctx.closePath();
            ctx.fill();

            // Leather head strap for Time-Traveler Goggles
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 1.6 * z;
            ctx.beginPath();
            ctx.moveTo(pt.x - 5.2 * z, avY - 18.4 * z);
            ctx.lineTo(pt.x + 5.2 * z, avY - 18.4 * z);
            ctx.stroke();

            // Dual Brass & Neon-Cyan Time-Traveler Goggles over eyes
            ctx.fillStyle = '#22d3ee';
            ctx.beginPath();
            ctx.arc(pt.x - 2.2 * z, avY - 18.3 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 2.2 * z, avY - 18.3 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 1.15 * z;
            ctx.beginPath();
            ctx.arc(pt.x - 2.2 * z, avY - 18.3 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(pt.x + 2.2 * z, avY - 18.3 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.stroke();

            // Specular gleam on chrono goggle lenses
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(pt.x - 3.0 * z, avY - 19.2 * z, 0.9 * z, 0.9 * z);
            ctx.fillRect(pt.x + 1.4 * z, avY - 19.2 * z, 0.9 * z, 0.9 * z);

            // Floating Golden Hourglass / Temporal Crown Halo above head
            const floatBob = Math.sin(elapsed * 5) * 1.4 * z;
            ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
            ctx.lineWidth = 1.1 * z;
            ctx.beginPath();
            ctx.ellipse(pt.x, avY - 26.5 * z + floatBob * 0.4, 5.2 * z, 1.5 * z, 0, 0, Math.PI * 2);
            ctx.stroke();
          } else if ((isTeacherAvatar && isFemale) || av.role === 'penjaga_literasi') {
            // Female Teacher or PATRA (Ibu Muslim di Sudut Literasi): Flowing Syar'i Hijab covering chest with Golden Brooch
            const hijabMain = av.role === 'penjaga_literasi' ? '#0d9488' : resolvedHijabColor;
            const hijabEdge = av.role === 'penjaga_literasi' ? '#99f6e4' : resolvedHijabEdge;
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
          } else if (isJournalistAvatar) {
            // TAMU KOTA (WARTAWAN / REPORTER): Classic Brown Reporter Fedora Hat with Dark Hatband, White "PRESS" Ticket Card & Journalist Glasses
            // Hair under fedora
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(pt.x, avY - 20.5 * z, 5.1 * z, Math.PI, 0);
            ctx.fill();
            // Reporter Fedora Brim
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(pt.x, avY - 21.2 * z, 7.6 * z, 2.1 * z, 0, 0, Math.PI * 2);
            ctx.fill();
            // Reporter Fedora Crown
            ctx.fillStyle = '#92400e';
            ctx.beginPath();
            ctx.roundRect(pt.x - 4.8 * z, avY - 25.8 * z, 9.6 * z, 4.8 * z, 1.8 * z);
            ctx.fill();
            // Dark Hatband Ribbon
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(pt.x - 4.8 * z, avY - 22.4 * z, 9.6 * z, 1.4 * z);
            // Iconic White "PRESS" Ticket Card tucked into the Fedora Hatband!
            ctx.save();
            ctx.translate(pt.x + 2.8 * z, avY - 23.6 * z);
            ctx.rotate(0.18);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-1.8 * z, -1.8 * z, 3.6 * z, 2.6 * z);
            ctx.fillStyle = '#dc2626';
            ctx.fillRect(-1.4 * z, -1.1 * z, 2.8 * z, 0.8 * z);
            ctx.restore();
            // Journalist Glasses
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 0.9 * z;
            ctx.strokeRect(pt.x - 4.0 * z, avY - 19.4 * z, 3.1 * z, 2.1 * z);
            ctx.strokeRect(pt.x + 0.9 * z, avY - 19.4 * z, 3.1 * z, 2.1 * z);
            ctx.beginPath();
            ctx.moveTo(pt.x - 0.9 * z, avY - 18.4 * z);
            ctx.lineTo(pt.x + 0.9 * z, avY - 18.4 * z);
            ctx.stroke();
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
            // Female Student (Siswa Perempuan Berhijab): Modest & neat student Hijab coordinated with outfit color
            ctx.fillStyle = resolvedHijabColor;
            ctx.beginPath();
            ctx.arc(pt.x, avY - 19.4 * z, 6.2 * z, 0, Math.PI * 2);
            ctx.fill();

            // Neat hijab shoulder & chest drape (kerudung menutup dada dengan rapi)
            ctx.beginPath();
            ctx.moveTo(pt.x - 6.3 * z, avY - 17.5 * z);
            ctx.lineTo(pt.x + 6.3 * z, avY - 17.5 * z);
            ctx.lineTo(pt.x + 7.2 * z, avY - 10.2 * z);
            ctx.quadraticCurveTo(pt.x, avY - 8.0 * z, pt.x - 7.2 * z, avY - 10.2 * z);
            ctx.closePath();
            ctx.fill();

            // Soft hijab edge border trim
            ctx.strokeStyle = resolvedHijabEdge;
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();

            // Cute pastel brooch pin on hijab drape
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(pt.x - 2.3 * z, avY - 11.8 * z, 1.0 * z, 0, Math.PI * 2);
            ctx.fill();

            // Inner face opening
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.ellipse(pt.x, avY - 18 * z, 3.8 * z, 4.1 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Soft white inner underscarf (ciput) line at forehead
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 0.75 * z;
            ctx.beginPath();
            ctx.arc(pt.x, avY - 18.2 * z, 3.8 * z, Math.PI * 1.18, Math.PI * 1.82);
            ctx.stroke();

            // Rosy blushing cheeks
            ctx.fillStyle = 'rgba(244, 63, 94, 0.38)';
            ctx.beginPath();
            ctx.arc(pt.x - 2.4 * z, avY - 17.5 * z, 1.0 * z, 0, Math.PI * 2);
            ctx.arc(pt.x + 2.4 * z, avY - 17.5 * z, 1.0 * z, 0, Math.PI * 2);
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

          // FISHING ANIMATION (Casting Rod + Bobber Flight & Splash + Interactive Pulling Rod & Leaping Fish)
          if (isFishingNow) {
            const fishStart = item.isPlayer
              ? fishingStartTimeRef.current || av.fishingStartTime || 0
              : av.fishingStartTime || 0;
            const fishAgeSec = fishStart > 0 ? Math.max(0, (currentTime - fishStart) / 1000) : 1.5;

            const pullStart = item.isPlayer ? fishingPullStartTimeRef.current : 0;
            const isPullingNow = pullStart > 0 && currentTime >= pullStart;
            const pullAgeSec = isPullingNow ? Math.max(0, (currentTime - pullStart) / 1000) : 0;
            const pullProgress = isPullingNow ? Math.min(1, pullAgeSec / 0.85) : 0;

            // Phase 1 (0.00s - 0.32s): Wind-up backswing behind shoulder (Ancang-ancang melempar pancing)
            // Phase 2 (0.32s - 0.65s): Forward overhead whip cast toward the pond (Melempar pancing)
            // Phase 3 (0.40s - 1.00s): Line & bobber fly in a high parabolic arc into the water + splash
            // Phase 4 (1.00s+): Waiting stance with bobber tugging in water
            // Phase 5 (isPullingNow): Lifting/pulling rod upward (Mengangkat pancing) & fish leaping out of water!
            let rodAngle = -0.68; // settled angle (radians relative to horizontal +X)
            if (isPullingNow) {
              // Whip rod sharply upward from -0.68 to -1.92 rad when player clicks "Angkat Pancing!"
              const easePull = 1 - Math.pow(1 - Math.min(1, pullAgeSec / 0.38), 3);
              rodAngle = -0.68 - easePull * 1.24 + Math.sin(pullAgeSec * 18) * 0.06;
            } else if (fishAgeSec < 0.32) {
              const p = fishAgeSec / 0.32;
              // Swing back from -0.7 to -2.32 rad (tilted far backward over head)
              rodAngle = -0.7 - p * 1.62;
            } else if (fishAgeSec < 0.65) {
              const p = (fishAgeSec - 0.32) / 0.33;
              // Ease-out whip forward from -2.32 to -0.44 rad
              const easeOut = 1 - Math.pow(1 - p, 3);
              rodAngle = -2.32 + easeOut * 1.88;
            } else if (fishAgeSec < 1.0) {
              const p = (fishAgeSec - 0.65) / 0.35;
              // Settle softly from -0.44 to -0.68 rad
              rodAngle = -0.44 - p * 0.24;
            } else {
              // Active tug while waiting for player to lift rod
              rodAngle = -0.68 + Math.sin(elapsed * 5.5) * 0.065;
            }

            const handBaseX = pt.x + 4.5 * z;
            const handBaseY = avY - 8.5 * z;
            const rodLen = 24 * z;
            const rodMidX = handBaseX + Math.cos(rodAngle) * (rodLen * 0.78);
            const rodMidY = handBaseY + Math.sin(rodAngle) * (rodLen * 0.78);

            // Flexible rod tip bends during cast, water tug & upward pull
            const tipBendY = isPullingNow
              ? (6.5 - pullProgress * 4.5) * z
              : fishAgeSec >= 0.32 && fishAgeSec < 0.65
              ? -5.5 * z
              : (4.5 + Math.sin(elapsed * 7.5) * 1.8) * z;
            const rodTipX = handBaseX + Math.cos(rodAngle) * rodLen + (isPullingNow ? 2.5 * z : 5.5 * z);
            const rodTipY = handBaseY + Math.sin(rodAngle) * rodLen + tipBendY;

            // Casting arm reaching forward/upward with the rod handle
            ctx.strokeStyle = isTeacherAvatar ? (isFemale ? '#047857' : '#1e3a8a') : av.shirtColor;
            ctx.lineWidth = 2.6 * z;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(pt.x + 3 * z, avY - 11.5 * z);
            ctx.lineTo(handBaseX + Math.cos(rodAngle) * 3.5 * z, handBaseY + Math.sin(rodAngle) * 3.5 * z);
            ctx.stroke();

            // Motion swoosh arc during the forward whip cast (0.28s - 0.72s) or upward pull
            if (!isPullingNow && fishAgeSec >= 0.28 && fishAgeSec <= 0.72) {
              const swooshAlpha = 1 - Math.abs(fishAgeSec - 0.5) / 0.24;
              ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, swooshAlpha * 0.85)})`;
              ctx.lineWidth = 2.8 * z;
              ctx.beginPath();
              ctx.arc(handBaseX, handBaseY, rodLen * 0.92, -2.25, rodAngle, false);
              ctx.stroke();
            } else if (isPullingNow && pullAgeSec <= 0.45) {
              const pullSwooshAlpha = 1 - pullAgeSec / 0.45;
              ctx.strokeStyle = `rgba(253, 224, 71, ${Math.max(0, pullSwooshAlpha * 0.85)})`;
              ctx.lineWidth = 2.6 * z;
              ctx.beginPath();
              ctx.arc(handBaseX, handBaseY, rodLen * 0.88, rodAngle, -0.65, false);
              ctx.stroke();
            }

            // Wooden bamboo fishing rod shaft & spinning reel
            ctx.strokeStyle = '#78350f';
            ctx.lineWidth = 2.2 * z;
            ctx.beginPath();
            ctx.moveTo(handBaseX, handBaseY);
            ctx.lineTo(rodMidX, rodMidY);
            ctx.stroke();

            // Flexible fiberglass rod tip
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.3 * z;
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
              1.7 * z,
              0,
              Math.PI * 2
            );
            ctx.fill();

            // Bobber & fishing line trajectory (Parabolic cast flight -> splash -> floating bobber -> upward pull arc)
            const targetBobberX = pt.x + 36 * z;
            const targetBobberY = avY + (4 + Math.sin(elapsed * 8) * 2.8) * z;

            let bobberX = targetBobberX;
            let bobberY = targetBobberY;
            let isInWater = true;

            if (isPullingNow) {
              // Pulling rod up: bobber & caught fish fly in a high arc out of the pond toward the avatar!
              isInWater = false;
              const endX = pt.x + 12 * z;
              const endY = avY - 16 * z;
              bobberX = targetBobberX + (endX - targetBobberX) * pullProgress;
              const pullArcLift = Math.sin(pullProgress * Math.PI) * 24 * z;
              bobberY = targetBobberY + (endY - targetBobberY) * pullProgress - pullArcLift;
            } else if (fishAgeSec < 0.42) {
              // During wind-up & early whip, bobber hangs close to rod tip
              isInWater = false;
              bobberX = rodTipX + Math.cos(rodAngle + 0.5) * 4.5 * z;
              bobberY = rodTipY + 5.5 * z;
            } else if (fishAgeSec < 1.0) {
              // High parabolic arc flight from rod tip into the pond water
              isInWater = false;
              const flightP = (fishAgeSec - 0.42) / 0.58;
              const startX = handBaseX + 14 * z;
              const startY = handBaseY - 20 * z;
              bobberX = startX + (targetBobberX - startX) * flightP;
              const arcLift = Math.sin(flightP * Math.PI) * 18 * z;
              bobberY = startY + (targetBobberY - startY) * flightP - arcLift;

              // Glowing air trail behind flying bobber during cast
              ctx.strokeStyle = `rgba(186, 230, 253, ${(1 - flightP) * 0.65})`;
              ctx.lineWidth = 1.4 * z;
              ctx.setLineDash([2 * z, 2 * z]);
              ctx.beginPath();
              ctx.moveTo(startX, startY);
              ctx.quadraticCurveTo(
                (startX + bobberX) * 0.5,
                Math.min(startY, bobberY) - 10 * z,
                bobberX,
                bobberY
              );
              ctx.stroke();
              ctx.setLineDash([]);
            }

            // Fishing line from rod tip to bobber
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
            ctx.lineWidth = 0.95 * z;
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
            ctx.arc(bobberX, bobberY, 2.8 * z, Math.PI, 0);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(bobberX, bobberY, 2.8 * z, 0, Math.PI);
            ctx.fill();

            // Leaping Caught Fish during Pulling Animation (Mengangkat Pancing)
            if (isPullingNow) {
              // Water splash burst at the pond surface where fish leaps out
              if (pullAgeSec < 0.5) {
                const spP = pullAgeSec / 0.5;
                ctx.strokeStyle = `rgba(186, 230, 253, ${(1 - spP) * 0.95})`;
                ctx.lineWidth = 1.6 * z;
                ctx.beginPath();
                ctx.ellipse(
                  targetBobberX,
                  targetBobberY + 1.5 * z,
                  (4 + spP * 14) * z,
                  (2 + spP * 6.5) * z,
                  0,
                  0,
                  Math.PI * 2
                );
                ctx.stroke();
              }

              // Draw Golden-Orange Leaping Fish attached below the bobber
              const fishX = bobberX;
              const fishY = bobberY + 4.2 * z;
              ctx.save();
              ctx.translate(fishX, fishY);
              ctx.rotate(-0.45 + pullProgress * 0.9);
              ctx.fillStyle = '#f97316';
              ctx.beginPath();
              ctx.ellipse(0, 0, 4.5 * z, 2.3 * z, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.moveTo(3.8 * z, 0);
              ctx.lineTo(6.8 * z, -2.5 * z);
              ctx.lineTo(6.8 * z, 2.5 * z);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }

            // Initial Water Impact Splash Ring & Droplets when cast hits water (1.00s - 1.45s)
            if (!isPullingNow && fishAgeSec >= 1.0 && fishAgeSec < 1.45) {
              const spP = (fishAgeSec - 1.0) / 0.45;
              ctx.strokeStyle = `rgba(224, 242, 254, ${(1 - spP) * 0.95})`;
              ctx.lineWidth = 1.6 * z;
              ctx.beginPath();
              ctx.ellipse(bobberX, bobberY + 1.5 * z, (3 + spP * 13) * z, (1.5 + spP * 6) * z, 0, 0, Math.PI * 2);
              ctx.stroke();

              // Flying water droplets on splash impact
              ctx.fillStyle = `rgba(186, 230, 253, ${1 - spP})`;
              for (let dp = -1; dp <= 1; dp += 2) {
                const dx = bobberX + dp * (2.5 + spP * 8) * z;
                const dy = bobberY - Math.sin(spP * Math.PI) * 7.5 * z;
                ctx.beginPath();
                ctx.arc(dx, dy, 1.2 * z, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Continuous Pond Ripples & Nibbling Splashes once Bobber is in Water
            if (isInWater && !isPullingNow) {
              const bPhase = (elapsed * 1.8) % 1;
              ctx.strokeStyle = `rgba(56, 189, 248, ${0.7 * (1 - bPhase)})`;
              ctx.lineWidth = 1.0 * z;
              ctx.beginPath();
              ctx.ellipse(bobberX, bobberY + 2 * z, (3 + bPhase * 9) * z, (1.5 + bPhase * 4.5) * z, 0, 0, Math.PI * 2);
              ctx.stroke();

              if (Math.sin(elapsed * 7) > 0.45) {
                ctx.fillStyle = '#bae6fd';
                ctx.beginPath();
                ctx.arc(bobberX - 2.5 * z, bobberY - 3.5 * z, 1.0 * z, 0, Math.PI * 2);
                ctx.arc(bobberX + 3.2 * z, bobberY - 4.2 * z, 1.1 * z, 0, Math.PI * 2);
                ctx.fill();
              }
            }
          }

          // Helper to word-wrap overhead text into compact multi-line arrays so text never stretches long horizontally
          const wrapOverheadText = (text: string, maxWidthPx: number, maxLinesCount: number = 3): string[] => {
            const words = text.trim().split(/\s+/);
            const lines: string[] = [];
            let currentLine = '';
            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              if (ctx.measureText(testLine).width <= maxWidthPx || !currentLine) {
                currentLine = testLine;
              } else {
                lines.push(currentLine);
                currentLine = word;
                if (lines.length >= maxLinesCount - 1) {
                  break;
                }
              }
            }
            if (currentLine && lines.length < maxLinesCount) {
              const remainingIdx = words.indexOf(currentLine.split(' ')[0]);
              if (lines.length === maxLinesCount - 1 && remainingIdx !== -1) {
                // Combine remaining words if on last allowed line
                const joinedRest = words.slice(remainingIdx).join(' ');
                lines.push(joinedRest);
              } else {
                lines.push(currentLine);
              }
            }
            return lines.length > 0 ? lines : [text];
          };

          // 6. COMPACT & WRAPPED USERNAME TAG PILL (Diperkecil & Di-wrap Rapi)
          let labelText = `@${av.handle}`;
          if (isKikyTimeTraveler) {
            labelText = `⏳ @${av.handle}`;
          } else if (isJournalistAvatar) {
            labelText = `📸 @${av.handle} • WARTAWAN`;
          } else if (isTeacherAvatar) {
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

          const tagFontPx = Math.max(
            5.5,
            Math.round((isTeacherAvatar || isKikyTimeTraveler || isJournalistAvatar ? 6.5 : 6.0) * z)
          );
          ctx.font = `${isTeacherAvatar || isKikyTimeTraveler || isJournalistAvatar ? 'bold' : '600'} ${tagFontPx}px sans-serif`;
          const maxTagLineW = 68 * z;
          const tagLines = wrapOverheadText(labelText, maxTagLineW, 2);
          const tagLineH = 7.4 * z;
          let maxMeasuredTagW = 0;
          for (const tl of tagLines) {
            maxMeasuredTagW = Math.max(maxMeasuredTagW, ctx.measureText(tl).width);
          }
          const tW = Math.min(78 * z, maxMeasuredTagW + 7.5 * z);
          const tH = tagLines.length * tagLineH + 3.6 * z;
          const tagBottomY = avY - (isKikyTimeTraveler || isJournalistAvatar ? 21.5 : 20.5) * z;
          const tagPosY = tagBottomY - tH / 2;

          // Lightweight Transparent Pill Background so it never clutters the city view
          ctx.fillStyle = isKikyTimeTraveler
            ? 'rgba(15, 23, 42, 0.78)'
            : isJournalistAvatar
            ? 'rgba(12, 74, 110, 0.72)'
            : isTeacherAvatar
            ? 'rgba(120, 53, 15, 0.45)'
            : 'rgba(15, 23, 42, 0.28)';
          ctx.beginPath();
          ctx.roundRect(pt.x - tW / 2, tagPosY - tH / 2, tW, tH, 5.2 * z);
          ctx.fill();

          if (isKikyTimeTraveler) {
            ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)';
            ctx.lineWidth = 1.1 * z;
            ctx.stroke();
            ctx.fillStyle = '#67e8f9';
          } else if (isJournalistAvatar) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();
            ctx.fillStyle = '#fde047';
          } else if (isTeacherAvatar) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();
            ctx.fillStyle = '#fde047';
          } else if (item.isPlayer) {
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
          } else if (av.isOnlineRemote) {
            ctx.strokeStyle = 'rgba(52, 211, 153, 0.42)';
            ctx.lineWidth = 0.8 * z;
            ctx.stroke();
            ctx.fillStyle = 'rgba(209, 250, 229, 0.92)';
          } else {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
            ctx.lineWidth = 0.65 * z;
            ctx.stroke();
            ctx.fillStyle = 'rgba(241, 245, 249, 0.82)';
          }

          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const firstTagLineY = tagPosY - ((tagLines.length - 1) * tagLineH) / 2;
          for (let li = 0; li < tagLines.length; li++) {
            ctx.fillText(tagLines[li], pt.x, firstTagLineY + li * tagLineH, tW - 4 * z);
          }

          // 7. COMPACT MULTI-LINE WRAPPED SPEECH BUBBLE (Diperkecil, Tidak Memanjang & Di-wrap Rapi di Atas Nametag)
          let speech: string | undefined = av.speechText;
          if (item.isPlayer && playerSpeechRef.current && Date.now() < playerSpeechRef.current.expiresAt) {
            speech = playerSpeechRef.current.text;
          }
          if (av.role === 'barista' && baristaSpeechRef.current && Date.now() < baristaSpeechRef.current.expiresAt) {
            speech = baristaSpeechRef.current.text;
          }

          let speechTopEdgeY = tagPosY - tH / 2;
          if (speech) {
            const speechFontPx = Math.max(5.5, Math.round(6.3 * z));
            ctx.font = `600 ${speechFontPx}px sans-serif`;
            const maxSpeechLineW = 86 * z;
            const speechLines = wrapOverheadText(speech, maxSpeechLineW, 3);
            const speechLineH = 7.8 * z;
            let maxMeasuredSpeechW = 0;
            for (const sl of speechLines) {
              maxMeasuredSpeechW = Math.max(maxMeasuredSpeechW, ctx.measureText(sl).width);
            }
            const sW = Math.min(96 * z, Math.max(26 * z, maxMeasuredSpeechW + 9 * z));
            const sH = speechLines.length * speechLineH + 5.5 * z;
            const bubbleBottomY = tagPosY - tH / 2 - 4.2 * z;
            const bubbleY = bubbleBottomY - sH / 2;
            speechTopEdgeY = bubbleY - sH / 2;

            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.55)';
            ctx.lineWidth = 0.75 * z;
            ctx.beginPath();
            ctx.roundRect(pt.x - sW / 2, bubbleY - sH / 2, sW, sH, 5.5 * z);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
            ctx.beginPath();
            ctx.moveTo(pt.x - 2.4 * z, bubbleBottomY);
            ctx.lineTo(pt.x + 2.4 * z, bubbleBottomY);
            ctx.lineTo(pt.x, bubbleBottomY + 3.2 * z);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const firstSpeechLineY = bubbleY - ((speechLines.length - 1) * speechLineH) / 2;
            for (let si = 0; si < speechLines.length; si++) {
              ctx.fillText(speechLines[si], pt.x, firstSpeechLineY + si * speechLineH, sW - 5 * z);
            }
          }

          // 8. FLOATING EMOTE BADGE & PARTICLES (Suka ❤️, Lambai 👋, Tertawa 😂, Joget 🎵, Jempol 👍)
          if (activeEmote && Date.now() < activeEmote.expiresAt) {
            const emoteBounce = Math.sin(elapsed * 7) * 2.5 * z;
            const baseEmoteY = speechTopEdgeY - 12 * z;
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
                : activeEmote.type === 'thumbsup'
                ? 'rgba(16, 185, 129, 0.75)'
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
                : activeEmote.type === 'thumbsup'
                ? '#10b981'
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
            } else if (isThumbsUpNow) {
              // Thumbs-up appreciation particles 👍 ✨ ⭐
              const thumbsIcons = ['👍', '✨', '⭐', '👍'];
              for (let ti = 0; ti < thumbsIcons.length; ti++) {
                const tProgress = (elapsed * 1.55 + ti * 0.25) % 1;
                const tX = pt.x + Math.sin(elapsed * 4.2 + ti * 1.9) * 15 * z;
                const tY = emoteY - 8 * z - tProgress * 22 * z;
                ctx.save();
                ctx.globalAlpha = Math.sin(tProgress * Math.PI) * 0.94;
                ctx.font = `${Math.round(10.5 * z)}px sans-serif`;
                ctx.fillText(thumbsIcons[ti], tX, tY);
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

          // 9. ANIMASI FLOATING POP-UP XP GAIN MELAYANG DI ATAS AVATAR (+3 XP, +5 XP, DLL)
          if (item.isPlayer && xpFloatsRef.current.length > 0) {
            const now = performance.now();
            xpFloatsRef.current = xpFloatsRef.current.filter((xp) => now - xp.startTime < xp.duration);

            xpFloatsRef.current.forEach((xpItem, idx) => {
              const elapsedXp = now - xpItem.startTime;
              const progress = Math.min(1.0, elapsedXp / xpItem.duration);

              // Smooth bouncy pop-in at start (first 320ms)
              const enterT = Math.min(1.0, elapsedXp / 320);
              const springScale = enterT < 1.0 ? 0.35 + 0.85 * Math.sin(enterT * Math.PI * 0.55) : 1.0;

              // Float upward smoothly from speechTopEdgeY
              const floatDistance = (14 + Math.pow(progress, 0.72) * 44) * z + (idx * 16 * z);
              const xpY = speechTopEdgeY - floatDistance;
              const xpX = pt.x;

              // Fade out gently in the last 30% of lifetime
              const alpha = progress > 0.7 ? Math.max(0, (1.0 - progress) / 0.3) : 1.0;

              ctx.save();
              ctx.globalAlpha = alpha;
              ctx.translate(xpX, xpY);
              ctx.scale(springScale, springScale);

              // A. Radial Golden Shimmer Glow
              const halo = ctx.createRadialGradient(0, 0, 2 * z, 0, 0, 26 * z);
              halo.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
              halo.addColorStop(0.4, 'rgba(245, 158, 11, 0.5)');
              halo.addColorStop(1, 'rgba(217, 119, 6, 0)');
              ctx.fillStyle = halo;
              ctx.beginPath();
              ctx.arc(0, 0, 26 * z, 0, Math.PI * 2);
              ctx.fill();

              // B. Orbiting Sparkle Stars & Gleams
              const numSparkles = 5;
              for (let si = 0; si < numSparkles; si++) {
                const spAngle = si * ((Math.PI * 2) / numSparkles) + elapsedXp * 0.0035;
                const spDist = (18 + Math.sin(elapsedXp * 0.009 + si * 1.3) * 5) * z;
                const spX = Math.cos(spAngle) * spDist;
                const spY = Math.sin(spAngle) * spDist;
                const spAlpha = alpha * (0.6 + 0.4 * Math.sin(elapsedXp * 0.012 + si));

                ctx.save();
                ctx.globalAlpha = spAlpha;
                ctx.font = `${Math.round(9 * z)}px sans-serif`;
                ctx.fillText(si % 2 === 0 ? '✨' : '⭐', spX, spY);
                ctx.restore();
              }

              // C. XP Pill Badge with Deep Gold Gradient & Glowing Border
              const textStr = `+${xpItem.amount} XP`;
              ctx.font = `900 ${Math.round(12.5 * z)}px ui-sans-serif, system-ui, -apple-system, sans-serif`;
              const textMetrics = ctx.measureText(textStr);
              const pillW = Math.max(52 * z, textMetrics.width + 24 * z);
              const pillH = 22 * z;

              // Shadow
              ctx.shadowColor = 'rgba(245, 158, 11, 0.75)';
              ctx.shadowBlur = 10 * z;
              ctx.shadowOffsetY = 2 * z;

              // Gradient Capsule
              const pillGrad = ctx.createLinearGradient(-pillW / 2, -pillH / 2, pillW / 2, pillH / 2);
              pillGrad.addColorStop(0, '#f59e0b');
              pillGrad.addColorStop(0.5, '#ea580c');
              pillGrad.addColorStop(1, '#c2410c');
              ctx.fillStyle = pillGrad;
              ctx.beginPath();
              ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 11 * z);
              ctx.fill();

              // Sharp Gold/Yellow Rim
              ctx.shadowColor = 'transparent';
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = 1.8 * z;
              ctx.stroke();

              // Glossy Upper Highlight Reflection
              ctx.fillStyle = 'rgba(255, 255, 255, 0.32)';
              ctx.beginPath();
              ctx.roundRect(-pillW / 2 + 1.5 * z, -pillH / 2 + 1.5 * z, pillW - 3 * z, pillH / 2 - 1.5 * z, [9 * z, 9 * z, 0, 0]);
              ctx.fill();

              // Text: Coin Icon + "+X XP"
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              // Text Outline
              ctx.lineWidth = 3.0 * z;
              ctx.strokeStyle = '#431407';
              ctx.strokeText(`🪙 ${textStr}`, 0, 0.5 * z);

              // Text Fill
              ctx.fillStyle = '#ffffff';
              ctx.fillText(`🪙 ${textStr}`, 0, 0.5 * z);

              // D. Reason Capsule (if exists)
              if (xpItem.reason && z >= 0.8) {
                const subStr = xpItem.reason.length > 22 ? xpItem.reason.slice(0, 20) + '...' : xpItem.reason;
                ctx.font = `bold ${Math.round(8.5 * z)}px sans-serif`;
                const subMetrics = ctx.measureText(subStr);
                const subW = subMetrics.width + 11 * z;
                const subH = 13.5 * z;
                const subY = pillH / 2 + 7.5 * z;

                ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
                ctx.beginPath();
                ctx.roundRect(-subW / 2, subY - subH / 2, subW, subH, 4 * z);
                ctx.fill();

                ctx.strokeStyle = 'rgba(251, 191, 36, 0.6)';
                ctx.lineWidth = 0.9 * z;
                ctx.stroke();

                ctx.fillStyle = '#fef08a';
                ctx.fillText(subStr, 0, subY);
              }

              ctx.restore();
            });
          }
        } else if (item.type === 'lamp') {
          // MINIMALIST ARCHITECTURAL PARK LAMP POST (Slender Nordic LED Luminaire on Grass Verge)
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const lampHeight = 23 * z;

          const distToPlayer = Math.hypot(player.wx - item.wx, player.wy - item.wy);
          const isLampTransparent = distToPlayer < 1.15;
          ctx.save();
          if (isLampTransparent) {
            ctx.globalAlpha = 0.45;
          }

          // Subtle ground shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 1 * z, pt.y + 0.8 * z, 3.8 * z, 1.9 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Neat circular garden stone pad & matte charcoal base ring
          ctx.fillStyle = isNight ? '#334155' : '#cbd5e1';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, 3.3 * z, 1.65 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y - 0.3 * z, 2.1 * z, 1.05 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Slender matte-anthracite cylindrical shaft
          ctx.strokeStyle = isNight ? '#1e293b' : '#334155';
          ctx.lineWidth = 1.55 * z;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - 0.5 * z);
          ctx.lineTo(pt.x, pt.y - lampHeight);
          ctx.stroke();

          // Subtle brushed-steel lower accent sleeve
          ctx.strokeStyle = isNight ? '#475569' : '#94a3b8';
          ctx.lineWidth = 1.75 * z;
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y - 0.8 * z);
          ctx.lineTo(pt.x, pt.y - 4.8 * z);
          ctx.stroke();

          const orbY = pt.y - lampHeight - 1.8 * z;
          const isLampLit = currentPeriod === 'malam' || currentPeriod === 'subuh' || currentPeriod === 'sore';

          if (isLampLit) {
            // Soft warm ambient halo around minimalist LED head
            const lanternGlow = ctx.createRadialGradient(pt.x, orbY, 1 * z, pt.x, orbY, 19 * z);
            lanternGlow.addColorStop(0, 'rgba(255, 255, 255, 0.92)');
            lanternGlow.addColorStop(0.28, 'rgba(254, 240, 138, 0.72)');
            lanternGlow.addColorStop(0.62, 'rgba(250, 204, 21, 0.25)');
            lanternGlow.addColorStop(1, 'rgba(234, 179, 8, 0)');

            ctx.fillStyle = lanternGlow;
            ctx.beginPath();
            ctx.arc(pt.x, orbY, 19 * z, 0, Math.PI * 2);
            ctx.fill();

            // Glowing warm-white minimalist frosted orb diffuser
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(pt.x, orbY, 2.5 * z, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(pt.x - 0.4 * z, orbY - 0.4 * z, 1.1 * z, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Daytime clean frosted glass diffuser orb
            ctx.fillStyle = 'rgba(248, 250, 252, 0.92)';
            ctx.beginPath();
            ctx.arc(pt.x, orbY, 2.4 * z, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 0.6 * z;
            ctx.stroke();
          }

          // Sleek minimalist horizontal disc cap atop the orb
          ctx.fillStyle = isNight ? '#0f172a' : '#1e293b';
          ctx.beginPath();
          ctx.ellipse(pt.x, orbY - 2.1 * z, 3.6 * z, 1.15 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        } else if (item.type === 'lake_fishing_boat') {
          // ---------------------------------------------------------
          // PERAHU KAYU TRADISIONAL & PENCARI IKAN DI DANAU KAWAH
          // ---------------------------------------------------------
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;

          // Water bobbing physics (gentle vertical heave and pitch)
          const bobY = Math.sin(elapsed * 2.2) * 1.6 * z;
          const boatPitch = Math.sin(elapsed * 1.6) * 0.035;
          const boatRoll = Math.cos(elapsed * 1.8) * 0.025;

          ctx.save();

          // 1. Water displacement ripple rings around hull
          const ripplePulse = (Math.sin(elapsed * 2.2) + 1) / 2;
          ctx.strokeStyle = isNight ? 'rgba(56, 189, 248, 0.28)' : 'rgba(255, 255, 255, 0.42)';
          ctx.lineWidth = 1.0 * z;
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y + 2.5 * z, (22 + ripplePulse * 5) * z, (9 + ripplePulse * 2.5) * z, 0.38, 0, Math.PI * 2);
          ctx.stroke();

          // 2. Under-hull lake shadow
          ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.52)' : 'rgba(12, 74, 96, 0.35)';
          ctx.beginPath();
          ctx.ellipse(pt.x + 0.5 * z, pt.y + 3.2 * z, 19 * z, 7.2 * z, 0.38, 0, Math.PI * 2);
          ctx.fill();

          // Move to boat origin
          ctx.translate(pt.x, pt.y + bobY);
          ctx.rotate(0.38 + boatPitch);

          // 3. Wooden Hull (Hand-carved teak / kayu jati sampan)
          // Outer hull profile
          ctx.fillStyle = isNight ? '#451a03' : '#78350f';
          ctx.beginPath();
          ctx.moveTo(-20 * z, 0);
          ctx.bezierCurveTo(-14 * z, -5.5 * z, 14 * z, -5.5 * z, 21 * z, -1.2 * z);
          ctx.bezierCurveTo(15 * z, 6.2 * z, -14 * z, 6.2 * z, -20 * z, 0);
          ctx.closePath();
          ctx.fill();

          // Sunlit upper gunwale rim (teak timber highlight)
          ctx.fillStyle = isNight ? '#78350f' : '#b45309';
          ctx.beginPath();
          ctx.moveTo(-19 * z, -0.6 * z);
          ctx.bezierCurveTo(-13 * z, -4.8 * z, 13 * z, -4.8 * z, 20 * z, -1.4 * z);
          ctx.lineTo(19 * z, -0.5 * z);
          ctx.bezierCurveTo(12 * z, -3.8 * z, -12 * z, -3.8 * z, -18 * z, -0.1 * z);
          ctx.closePath();
          ctx.fill();

          // Inner hollow deck floor
          ctx.fillStyle = isNight ? '#291104' : '#451a03';
          ctx.beginPath();
          ctx.ellipse(0, 0.6 * z, 16.5 * z, 4.2 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Deck cross-planks / ribs
          ctx.strokeStyle = isNight ? '#451a03' : '#92400e';
          ctx.lineWidth = 0.8 * z;
          for (let rib = -11; rib <= 11; rib += 5.5) {
            ctx.beginPath();
            ctx.moveTo(rib * z, -2.8 * z);
            ctx.lineTo(rib * z, 3.8 * z);
            ctx.stroke();
          }

          // Middle thwart wooden bench (tempat duduk nelayan)
          ctx.fillStyle = isNight ? '#542106' : '#92400e';
          ctx.beginPath();
          ctx.roundRect(-3.5 * z, -3.6 * z, 7 * z, 7.2 * z, 1.2 * z);
          ctx.fill();

          // Bow lantern timber post & warm boat lantern
          ctx.strokeStyle = isNight ? '#78350f' : '#92400e';
          ctx.lineWidth = 1.2 * z;
          ctx.beginPath();
          ctx.moveTo(18 * z, -1.0 * z);
          ctx.lineTo(20 * z, -9.5 * z);
          ctx.stroke();

          // Lantern glow at dusk/night
          const isLampOn = currentPeriod === 'malam' || currentPeriod === 'subuh' || currentPeriod === 'sore';
          if (isLampOn) {
            const boatGlow = ctx.createRadialGradient(20 * z, -9.5 * z, 1 * z, 20 * z, -9.5 * z, 12 * z);
            boatGlow.addColorStop(0, 'rgba(254, 240, 138, 0.85)');
            boatGlow.addColorStop(0.4, 'rgba(245, 158, 11, 0.35)');
            boatGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = boatGlow;
            ctx.beginPath();
            ctx.arc(20 * z, -9.5 * z, 12 * z, 0, Math.PI * 2);
            ctx.fill();
          }
          // Brass lantern body
          ctx.fillStyle = '#ca8a04';
          ctx.beginPath();
          ctx.arc(20 * z, -9.5 * z, 1.9 * z, 0, Math.PI * 2);
          ctx.fill();

          // Woven bamboo fish basket (keranjang ikan) near stern
          ctx.fillStyle = '#a16207';
          ctx.beginPath();
          ctx.ellipse(-12 * z, 1.2 * z, 2.8 * z, 2.2 * z, 0, 0, Math.PI * 2);
          ctx.fill();
          // Tiny silver fish tail peeking out
          ctx.fillStyle = '#e2e8f0';
          ctx.beginPath();
          ctx.moveTo(-13 * z, 0.5 * z);
          ctx.lineTo(-15.5 * z, -1.8 * z);
          ctx.lineTo(-14.2 * z, 0.2 * z);
          ctx.closePath();
          ctx.fill();

          // Wooden paddle (dayung) resting on gunwale
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.0 * z;
          ctx.beginPath();
          ctx.moveTo(-9 * z, -5.5 * z);
          ctx.lineTo(7 * z, 5.8 * z);
          ctx.stroke();
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(8.5 * z, 6.8 * z, 3.2 * z, 1.4 * z, 0.7, 0, Math.PI * 2);
          ctx.fill();

          // 4. Fisherman (Pencari Ikan) Sitting on Thwart
          ctx.save();
          ctx.translate(0, -2.5 * z);

          // Fisherman body & legs
          ctx.fillStyle = '#1e3a8a'; // indigo blue fisherman shirt
          ctx.beginPath();
          ctx.roundRect(-2.8 * z, -8.5 * z, 5.6 * z, 6.8 * z, 1.8 * z);
          ctx.fill();

          // Trousers
          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.roundRect(-2.6 * z, -2.2 * z, 5.2 * z, 3.2 * z, 1.2 * z);
          ctx.fill();

          // Conical Bamboo Hat (Caping Bambu / Caping Petani-Nelayan)
          const hatY = -12.5 * z;
          const capingW = 9.8 * z;
          const capingH = 4.8 * z;

          // Caping shadow on body
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          ctx.beginPath();
          ctx.ellipse(0, -8.2 * z, 3.6 * z, 1.4 * z, 0, 0, Math.PI * 2);
          ctx.fill();

          // Caping cone
          const capingGrad = ctx.createLinearGradient(0, hatY - capingH, 0, hatY);
          capingGrad.addColorStop(0, '#fef08a');
          capingGrad.addColorStop(0.65, '#fde047');
          capingGrad.addColorStop(1, '#ca8a04');
          ctx.fillStyle = capingGrad;
          ctx.beginPath();
          ctx.moveTo(0, hatY - capingH);
          ctx.lineTo(capingW, hatY);
          ctx.bezierCurveTo(capingW * 0.5, hatY + 1.2 * z, -capingW * 0.5, hatY + 1.2 * z, -capingW, hatY);
          ctx.closePath();
          ctx.fill();

          // Woven bamboo rings on caping
          ctx.strokeStyle = '#a16207';
          ctx.lineWidth = 0.6 * z;
          ctx.beginPath();
          ctx.ellipse(0, hatY - 0.2 * z, capingW * 0.95, 1.2 * z, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Fisherman arms holding bamboo rod
          ctx.strokeStyle = '#fed7aa'; // skin tone
          ctx.lineWidth = 1.2 * z;
          ctx.beginPath();
          ctx.moveTo(-1.2 * z, -6.5 * z);
          ctx.lineTo(2.8 * z, -5.2 * z);
          ctx.stroke();

          // Flexible Bamboo Fishing Rod (Joran Pancing Bambu)
          const rodAngle = -0.38 + Math.sin(elapsed * 2.2) * 0.03;
          ctx.save();
          ctx.translate(2.8 * z, -5.2 * z);
          ctx.rotate(rodAngle);
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.3 * z;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(14 * z, -6 * z, 26 * z, -13 * z);
          ctx.stroke();

          // Tip of rod coordinates
          const tipX = 26 * z;
          const tipY = -13 * z;
          ctx.restore();

          ctx.restore(); // restore fisherman translate

          // 5. Fishing Line & Floating Bobber (Pelampung)
          // Compute rod tip in local boat coordinate space
          const cosR = Math.cos(rodAngle);
          const sinR = Math.sin(rodAngle);
          const rodTipLocalX = 2.8 * z + (26 * z * cosR - (-13 * z) * sinR);
          const rodTipLocalY = -7.7 * z + (26 * z * sinR + (-13 * z) * cosR);

          // Bobber floating on water surface
          const bobberLocalX = rodTipLocalX + 9 * z;
          const bobberLocalY = 4.5 * z + Math.sin(elapsed * 3.5) * 0.6 * z;

          // Animated nibble twitch
          const nibbleTug = Math.sin(elapsed * 5.2) > 0.88 ? 1.4 * z : 0;

          // Fine monofilament line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
          ctx.lineWidth = 0.55 * z;
          ctx.beginPath();
          ctx.moveTo(rodTipLocalX, rodTipLocalY);
          ctx.quadraticCurveTo(
            (rodTipLocalX + bobberLocalX) / 2 + 1.5 * z,
            (rodTipLocalY + bobberLocalY) / 2 + 2.0 * z,
            bobberLocalX,
            bobberLocalY + nibbleTug
          );
          ctx.stroke();

          // Red & White Floating Bobber
          ctx.fillStyle = '#ef4444'; // red top
          ctx.beginPath();
          ctx.arc(bobberLocalX, bobberLocalY + nibbleTug - 0.7 * z, 1.1 * z, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#ffffff'; // white bottom
          ctx.beginPath();
          ctx.arc(bobberLocalX, bobberLocalY + nibbleTug - 0.7 * z, 1.1 * z, 0, Math.PI);
          ctx.fill();

          // Tiny water ripple ring under bobber
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 0.6 * z;
          ctx.beginPath();
          ctx.ellipse(bobberLocalX, bobberLocalY + nibbleTug + 0.6 * z, 2.5 * z, 1.1 * z, 0, 0, Math.PI * 2);
          ctx.stroke();

          ctx.restore();
        } else if (item.type === 'river_heron') {
          // ---------------------------------------------------------
          // BURUNG BANGAU DI SUNGAI (Singgah di Dangkal, Berburu Ikan, & Terbang Berkeliling)
          // ---------------------------------------------------------
          const z = zoomLevelRef.current;
          const cycleTime = elapsed % 20; // 20-second lifecycle

          let hWx = item.wx;
          let hWy = item.wy;
          let hAlt = 0;
          let isFlying = false;
          let flightHeading = 0;
          let flapPhase = 0;
          let peckDown = 0;

          if (cycleTime <= 8.0) {
            // PHASE 1: Singgah di dangkal sungai, memantau air & mematuk ikan
            hWx = 7.35;
            hWy = -3.85;
            hAlt = -0.6; // wading in shallow water
            isFlying = false;
            // Pecking behavior every ~2.5 seconds
            const peckSub = (cycleTime % 2.5);
            if (peckSub > 1.8 && peckSub < 2.3) {
              peckDown = Math.sin(((peckSub - 1.8) / 0.5) * Math.PI);
            }
          } else if (cycleTime <= 11.0) {
            // PHASE 2: Lepas landas (Take-off) & menanjak sepanjang sungai
            const prog = (cycleTime - 8.0) / 3.0; // 0 to 1
            hWx = 7.35 + Math.sin(prog * Math.PI) * 0.3;
            hWy = -3.85 + prog * 2.6;
            hAlt = prog * 36;
            isFlying = true;
            flightHeading = 0.42;
            flapPhase = Math.sin(elapsed * 12.0); // rapid take-off flaps
          } else if (cycleTime <= 16.0) {
            // PHASE 3: Terbang melayang anggun (Soaring & Banking) menyusuri sungai
            const prog = (cycleTime - 11.0) / 5.0; // 0 to 1
            hWx = 7.35 + Math.sin(prog * Math.PI * 2) * 0.45;
            hWy = -1.25 + Math.sin(prog * Math.PI) * 2.8;
            hAlt = 36 + Math.sin(prog * Math.PI) * 6;
            isFlying = true;
            flightHeading = 0.42 + Math.cos(prog * Math.PI) * 0.35;
            flapPhase = Math.sin(elapsed * 6.5); // majestic soaring flaps
          } else {
            // PHASE 4: Menukik kembali, rem angin, mendarat di dangkal sungai
            const prog = (cycleTime - 16.0) / 4.0; // 0 to 1
            hWx = 7.35 + (1 - prog) * 0.25;
            hWy = -3.85 + (1 - prog) * 1.5;
            hAlt = (1 - prog) * 36 - 0.6;
            isFlying = prog < 0.88;
            flightHeading = -2.7; // banking back north
            flapPhase = Math.sin(elapsed * 9.0) * (1 - prog); // cupped air-brake flaps
          }

          const hPt = toScreen(hWx, hWy, hAlt, camera.x, camera.y);
          const shadowPt = toScreen(hWx, hWy, -0.6, camera.x, camera.y);

          ctx.save();

          // Cast shadow on river water surface
          const shadowAlpha = Math.max(0.12, 0.38 - (hAlt / 40) * 0.22);
          const shadowScale = Math.max(0.5, 1.0 - (hAlt / 40) * 0.45);
          ctx.fillStyle = `rgba(15, 23, 42, ${shadowAlpha.toFixed(2)})`;
          ctx.beginPath();
          ctx.ellipse(shadowPt.x, shadowPt.y, 8.5 * z * shadowScale, 3.8 * z * shadowScale, 0.4, 0, Math.PI * 2);
          ctx.fill();

          if (!isFlying) {
            // -------------------------------------------------------
            // WADING / STANDING HERON (Ardea alba / Burung Bangau Putih)
            // -------------------------------------------------------
            ctx.translate(hPt.x, hPt.y);

            // Water ripple around wading feet
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.38)';
            ctx.lineWidth = 0.8 * z;
            ctx.beginPath();
            ctx.ellipse(0, 0, 5.2 * z, 2.2 * z, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Long yellow-orange wading legs
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 1.1 * z;
            // Left leg
            ctx.beginPath();
            ctx.moveTo(-1.4 * z, 0);
            ctx.lineTo(-1.2 * z, -9.5 * z);
            ctx.stroke();
            // Right leg (slight forward step)
            ctx.beginPath();
            ctx.moveTo(1.2 * z, 0);
            ctx.lineTo(0.8 * z, -9.5 * z);
            ctx.stroke();

            // Slender white egret body
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, -13 * z, 4.2 * z, 6.2 * z, 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Soft feather shade on breast
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.ellipse(0.8 * z, -11.5 * z, 2.4 * z, 4.2 * z, 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Elegant S-curved long neck & head
            const headAngle = peckDown * 0.85;
            const headX = (2.5 + peckDown * 4.5) * z;
            const headY = (-19 + peckDown * 9.5) * z;

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.4 * z;
            ctx.beginPath();
            ctx.moveTo(0, -17 * z);
            ctx.quadraticCurveTo(1.5 * z, -18 * z, headX, headY);
            ctx.stroke();

            // Heron head
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(headX, headY, 2.2 * z, 1.4 * z, 0.2 + headAngle, 0, Math.PI * 2);
            ctx.fill();

            // Sharp dagger-shaped yellow bill
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.moveTo(headX + 1.5 * z, headY - 0.4 * z);
            ctx.lineTo(headX + 6.8 * z + peckDown * 2 * z, headY + (peckDown * 3.5) * z);
            ctx.lineTo(headX + 1.5 * z, headY + 0.6 * z);
            ctx.closePath();
            ctx.fill();

            // Splash ring if pecking into water
            if (peckDown > 0.6) {
              ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.lineWidth = 1.0 * z;
              ctx.beginPath();
              ctx.ellipse(headX + 6.8 * z, 0, 4.0 * z, 1.8 * z, 0, 0, Math.PI * 2);
              ctx.stroke();
            }

            // Black eye dot
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(headX + 0.4 * z, headY - 0.3 * z, 0.45 * z, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // -------------------------------------------------------
            // FLYING HERON (Wings Outstretched, Long Legs Trailing)
            // -------------------------------------------------------
            ctx.translate(hPt.x, hPt.y);
            ctx.rotate(flightHeading);

            // Trailing slender legs behind body
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 0.9 * z;
            ctx.beginPath();
            ctx.moveTo(-4 * z, 0);
            ctx.lineTo(-14 * z, -0.6 * z);
            ctx.moveTo(-4 * z, 0.8 * z);
            ctx.lineTo(-13.5 * z, 1.2 * z);
            ctx.stroke();

            // Aerodynamic white torso
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(0, 0, 6.2 * z, 2.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Retracted S-curve neck in flight & sharp yellow bill
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.2 * z;
            ctx.beginPath();
            ctx.moveTo(4 * z, 0);
            ctx.quadraticCurveTo(7 * z, -1.8 * z, 9.5 * z, 0);
            ctx.stroke();

            // Sharp yellow bill
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.moveTo(9.5 * z, -0.6 * z);
            ctx.lineTo(15.5 * z, 0);
            ctx.lineTo(9.5 * z, 0.6 * z);
            ctx.closePath();
            ctx.fill();

            // Outstretched Broad Wings (Left & Right Flapping)
            const wingSpan = 16 * z;
            const wingFlapY = flapPhase * 9 * z;

            // Port (Left) Wing
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(1 * z, -1.5 * z);
            ctx.quadraticCurveTo(0, -wingSpan * 0.7, -5 * z, -wingSpan + wingFlapY);
            ctx.lineTo(-7 * z, -wingSpan * 0.8 + wingFlapY * 0.8);
            ctx.lineTo(-3 * z, -1.5 * z);
            ctx.closePath();
            ctx.fill();
            // Wingtip flight feathers (remiges)
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();

            // Starboard (Right) Wing
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(1 * z, 1.5 * z);
            ctx.quadraticCurveTo(0, wingSpan * 0.7, -5 * z, wingSpan - wingFlapY);
            ctx.lineTo(-7 * z, wingSpan * 0.8 - wingFlapY * 0.8);
            ctx.lineTo(-3 * z, 1.5 * z);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 0.7 * z;
            ctx.stroke();
          }

          ctx.restore();
        } else if (item.type === 'forest_wildlife') {
          // ---------------------------------------------------------
          // HEWAN DI HUTAN BELANTARA (2 Rusa Dewasa, Tupai, Kelinci, & Burung Berjalan)
          // ---------------------------------------------------------
          const pt = toScreen(item.wx, item.wy, 0, camera.x, camera.y);
          const z = zoomLevelRef.current;
          const facing = item.facingDir ?? 1;
          const isWalking = Boolean(item.isWalking);

          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.scale(facing, 1);

          if (item.kind === 'deer_stag') {
            // =======================================================
            // 1. RUSA JANTAN DEWASA BERTANDUK (Adult Male Antlered Stag)
            // =======================================================
            const legSwing = isWalking ? Math.sin(elapsed * 4.2) * 2.5 * z : 0;
            const headAlertSway = Math.sin(elapsed * 1.8) * 0.04;
            const earFlick = Math.sin(elapsed * 4.5) > 0.8 ? 0.25 : 0;

            // Ground shadow
            ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.42)' : 'rgba(0, 0, 0, 0.26)';
            ctx.beginPath();
            ctx.ellipse(0, 1.5 * z, 12 * z, 5.2 * z, 0.25, 0, Math.PI * 2);
            ctx.fill();

            // Muscular Slender Legs
            ctx.strokeStyle = isNight ? '#542106' : '#78350f';
            ctx.lineWidth = 1.4 * z;
            // Back legs
            ctx.beginPath();
            ctx.moveTo(-6 * z, -5 * z);
            ctx.lineTo(-7.5 * z - legSwing, 1.2 * z);
            ctx.moveTo(-4 * z, -5 * z);
            ctx.lineTo(-4.5 * z + legSwing, 1.4 * z);
            // Front legs
            ctx.moveTo(4 * z, -5 * z);
            ctx.lineTo(4.8 * z + legSwing, 1.4 * z);
            ctx.moveTo(6.5 * z, -5 * z);
            ctx.lineTo(7.2 * z - legSwing, 1.2 * z);
            ctx.stroke();

            // Chestnut brown deer body
            ctx.fillStyle = isNight ? '#78350f' : '#9a3412';
            ctx.beginPath();
            ctx.ellipse(0, -9.5 * z, 8.8 * z, 5.8 * z, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Creamy throat patch & underbelly
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.ellipse(2 * z, -7.5 * z, 5.2 * z, 2.4 * z, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Dappled white fawn/stag spots along back
            ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
            ctx.beginPath();
            ctx.arc(-3 * z, -12 * z, 0.65 * z, 0, Math.PI * 2);
            ctx.arc(-0.5 * z, -12.5 * z, 0.7 * z, 0, Math.PI * 2);
            ctx.arc(2 * z, -11.8 * z, 0.6 * z, 0, Math.PI * 2);
            ctx.fill();

            // White rump patch & flicking tail
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(-7.8 * z, -10.5 * z, 2.2 * z, 1.6 * z, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Strong arched neck
            ctx.save();
            ctx.translate(5.5 * z, -10.5 * z);
            ctx.rotate(headAlertSway);

            ctx.strokeStyle = isNight ? '#78350f' : '#9a3412';
            ctx.lineWidth = 4.2 * z;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(3.2 * z, -6.5 * z);
            ctx.stroke();

            // Stag Head
            ctx.fillStyle = isNight ? '#78350f' : '#9a3412';
            ctx.beginPath();
            ctx.ellipse(4.2 * z, -8 * z, 3.4 * z, 2.2 * z, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Muzzle
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(7.2 * z, -8.6 * z, 0.8 * z, 0, Math.PI * 2);
            ctx.fill();

            // Ears
            ctx.fillStyle = '#c2410c';
            ctx.beginPath();
            ctx.ellipse(2.5 * z, -10.2 * z + earFlick * z, 1.8 * z, 0.8 * z, 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Branching Majestic Antlers (Tanduk Rusa Bercabang)
            ctx.strokeStyle = '#fef3c7'; // ivory bone tone
            ctx.lineWidth = 1.2 * z;

            // Left antler beam & tines
            ctx.beginPath();
            ctx.moveTo(3.2 * z, -9.8 * z);
            ctx.quadraticCurveTo(1.5 * z, -16 * z, 0, -21 * z);
            // Brow tine
            ctx.moveTo(2.6 * z, -12.5 * z);
            ctx.lineTo(4.8 * z, -14.5 * z);
            // Bez tine
            ctx.moveTo(1.8 * z, -15.5 * z);
            ctx.lineTo(3.8 * z, -18.2 * z);
            // Crown fork
            ctx.moveTo(0.5 * z, -19.5 * z);
            ctx.lineTo(-1.8 * z, -22 * z);
            ctx.stroke();

            // Right antler beam & tines
            ctx.beginPath();
            ctx.moveTo(4.6 * z, -9.8 * z);
            ctx.quadraticCurveTo(5.2 * z, -16.5 * z, 5.8 * z, -21.5 * z);
            // Brow tine
            ctx.moveTo(5.0 * z, -12.5 * z);
            ctx.lineTo(7.5 * z, -14.2 * z);
            // Crown fork
            ctx.moveTo(5.6 * z, -19.2 * z);
            ctx.lineTo(8.2 * z, -21.8 * z);
            ctx.stroke();

            ctx.restore();
          } else if (item.kind === 'deer_doe') {
            // =======================================================
            // 2. RUSA BETINA DEWASA (Adult Grazing Female Doe)
            // =======================================================
            const legSwingDoe = isWalking ? Math.sin(elapsed * 4.0) * 2.2 * z : 0;
            const grazeSway = Math.sin(elapsed * 2.2) * 0.05;
            const grazeY = Math.sin(elapsed * 1.5) * 1.2 * z;

            // Ground shadow
            ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.42)' : 'rgba(0, 0, 0, 0.24)';
            ctx.beginPath();
            ctx.ellipse(0, 1.4 * z, 11 * z, 4.8 * z, 0.22, 0, Math.PI * 2);
            ctx.fill();

            // Legs
            ctx.strokeStyle = isNight ? '#78350f' : '#a16207';
            ctx.lineWidth = 1.3 * z;
            ctx.beginPath();
            ctx.moveTo(-5.5 * z, -4.5 * z);
            ctx.lineTo(-6.8 * z - legSwingDoe, 1.1 * z);
            ctx.moveTo(-3.5 * z, -4.5 * z);
            ctx.lineTo(-4.0 * z + legSwingDoe, 1.3 * z);
            ctx.moveTo(4.0 * z, -4.5 * z);
            ctx.lineTo(4.6 * z + legSwingDoe, 1.3 * z);
            ctx.moveTo(6.0 * z, -4.5 * z);
            ctx.lineTo(6.6 * z - legSwingDoe, 1.1 * z);
            ctx.stroke();

            // Doe body (honey caramel coat)
            ctx.fillStyle = isNight ? '#854d0e' : '#b45309';
            ctx.beginPath();
            ctx.ellipse(0, -8.5 * z, 8.2 * z, 5.2 * z, 0.12, 0, Math.PI * 2);
            ctx.fill();

            // Light belly
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.ellipse(0.5 * z, -6.8 * z, 4.8 * z, 2.2 * z, 0.12, 0, Math.PI * 2);
            ctx.fill();

            // White rump
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(-7.2 * z, -9.5 * z, 1.8 * z, 1.4 * z, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Grazing Neck (angled downwards toward grass)
            ctx.save();
            ctx.translate(5.0 * z, -8.0 * z);
            ctx.rotate(0.55 + grazeSway);

            ctx.strokeStyle = isNight ? '#854d0e' : '#b45309';
            ctx.lineWidth = 3.6 * z;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(4.5 * z, 0);
            ctx.stroke();

            // Doe head grazing grass
            ctx.fillStyle = isNight ? '#854d0e' : '#b45309';
            ctx.beginPath();
            ctx.ellipse(5.2 * z, 0 + grazeY, 2.8 * z, 1.9 * z, 0.3, 0, Math.PI * 2);
            ctx.fill();

            // Muzzle nibbling ground
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(7.6 * z, 0.5 * z + grazeY, 0.7 * z, 0, Math.PI * 2);
            ctx.fill();

            // Alert soft ears
            ctx.fillStyle = '#ca8a04';
            ctx.beginPath();
            ctx.ellipse(3.8 * z, -2.4 * z, 1.6 * z, 0.75 * z, -0.6, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          } else if (item.kind === 'squirrel') {
            // =======================================================
            // 3. TUPAI EKOR LEBAT (Fluffy-Tailed Squirrel Nibbling Acorn)
            // =======================================================
            const tailTwitch = Math.sin(elapsed * 7.5) * 0.12;
            const nibble = Math.sin(elapsed * 16.0) * 0.4 * z;

            // Tiny ground shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(0, 0.8 * z, 4.2 * z, 2.0 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Large Bushy Arched Squirrel Tail (arched over back)
            ctx.save();
            ctx.translate(-2.0 * z, -3.5 * z);
            ctx.rotate(tailTwitch);
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(-6 * z, -2 * z, -6 * z, -12 * z, -1.5 * z, -14 * z);
            ctx.bezierCurveTo(2 * z, -15 * z, 1 * z, -7 * z, 0, 0);
            ctx.closePath();
            ctx.fill();

            // Fluffy tail fur fringe
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 1.0 * z;
            ctx.stroke();
            ctx.restore();

            // Squirrel body sitting upright
            ctx.fillStyle = '#c2410c';
            ctx.beginPath();
            ctx.ellipse(0, -3.8 * z, 2.6 * z, 3.8 * z, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Cream belly
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.ellipse(0.8 * z, -3.5 * z, 1.4 * z, 2.6 * z, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Squirrel head
            ctx.fillStyle = '#ea580c';
            ctx.beginPath();
            ctx.arc(1.5 * z, -7.5 * z, 2.1 * z, 0, Math.PI * 2);
            ctx.fill();

            // Tiny perky ear
            ctx.fillStyle = '#c2410c';
            ctx.beginPath();
            ctx.ellipse(0.6 * z, -9.6 * z, 0.9 * z, 1.4 * z, -0.2, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(2.3 * z, -7.8 * z, 0.45 * z, 0, Math.PI * 2);
            ctx.fill();

            // Front paws clutching brown acorn
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(2.6 * z, -5.2 * z + nibble, 1.2 * z, 1.4 * z, 0.3, 0, Math.PI * 2);
            ctx.fill();
            // Acorn cap
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.arc(2.6 * z, -6.1 * z + nibble, 1.1 * z, Math.PI, 0);
            ctx.fill();
          } else if (item.kind === 'rabbit') {
            // =======================================================
            // 4. KELINCI HUTAN (Cottontail Bunny with Twitching Nose & Hop)
            // =======================================================
            let hopY = 0;
            let hopStretch = 1.0;
            if (isWalking) {
              const hopCycle = (elapsed * 3.8) % 1.0;
              if (hopCycle < 0.6) {
                const hopProg = hopCycle / 0.6;
                hopY = -Math.sin(hopProg * Math.PI) * 5.2 * z;
                hopStretch = 1.18;
              }
            } else {
              // Gentle breathing stretch when stopped
              hopStretch = 1.0 + Math.sin(elapsed * 3.0) * 0.04;
            }
            const noseTwitch = Math.sin(elapsed * 12.0) * 0.3 * z;

            // Ground shadow expands/contracts with hop
            const shadowScale = 1 - Math.abs(hopY) / (8 * z);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.20)';
            ctx.beginPath();
            ctx.ellipse(0, 0.8 * z, 4.5 * z * shadowScale, 2.2 * z * shadowScale, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.translate(0, hopY);

            // Fluffy white cottontail
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-3.6 * z, -2.8 * z, 1.4 * z, 0, Math.PI * 2);
            ctx.fill();

            // Rabbit hindquarters & body (soft cream / warm beige)
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.ellipse(-0.5 * z, -3.5 * z, 3.6 * z * hopStretch, 2.8 * z, -0.2, 0, Math.PI * 2);
            ctx.fill();

            // Back hind foot
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.ellipse(-1.2 * z, -0.8 * z, 2.2 * z, 1.0 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Rabbit head
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(2.5 * z, -5.2 * z, 2.2 * z, 1.9 * z, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Long upright ears
            const earTilt = Math.sin(elapsed * 3.5) * 0.08;
            ctx.save();
            ctx.translate(1.8 * z, -6.8 * z);
            ctx.rotate(earTilt);

            // Left ear
            ctx.fillStyle = '#f1f5f9';
            ctx.beginPath();
            ctx.ellipse(-0.6 * z, -4.2 * z, 0.9 * z, 4.2 * z, -0.15, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbcfe8'; // pink inner ear
            ctx.beginPath();
            ctx.ellipse(-0.6 * z, -4.2 * z, 0.45 * z, 3.0 * z, -0.15, 0, Math.PI * 2);
            ctx.fill();

            // Right ear
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(1.0 * z, -4.0 * z, 0.9 * z, 4.0 * z, 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fbcfe8';
            ctx.beginPath();
            ctx.ellipse(1.0 * z, -4.0 * z, 0.45 * z, 2.8 * z, 0.18, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Dark eye
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(3.4 * z, -5.5 * z, 0.45 * z, 0, Math.PI * 2);
            ctx.fill();

            // Twitching pink nose
            ctx.fillStyle = '#f43f5e';
            ctx.beginPath();
            ctx.arc(4.6 * z, -4.6 * z + noseTwitch, 0.4 * z, 0, Math.PI * 2);
            ctx.fill();
          } else if (item.kind === 'ground_bird') {
            // =======================================================
            // 5. BURUNG HUTAN BERJALAN RANDOM (Forest Ground Bird Strutting)
            // =======================================================
            const walkStep = Math.sin(elapsed * 12.0);
            const headBob = Math.cos(elapsed * 12.0) * 0.8 * z;
            const peckGround = Math.sin(elapsed * 2.8) > 0.75 ? 2.5 * z : 0;

            // Ground shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
            ctx.beginPath();
            ctx.ellipse(0, 0.6 * z, 3.5 * z, 1.8 * z, 0, 0, Math.PI * 2);
            ctx.fill();

            // Walking legs (slender yellow strides)
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 0.8 * z;
            // Left leg
            ctx.beginPath();
            ctx.moveTo(-0.6 * z, -2.5 * z);
            ctx.lineTo(-0.6 * z - walkStep * 1.5 * z, 0.4 * z);
            ctx.stroke();
            // Right leg
            ctx.beginPath();
            ctx.moveTo(0.8 * z, -2.5 * z);
            ctx.lineTo(0.8 * z + walkStep * 1.5 * z, 0.4 * z);
            ctx.stroke();

            // Mottled forest quail body (warm olive brown with speckled breast)
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.ellipse(0, -4.2 * z, 3.2 * z, 2.2 * z, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Speckled cream breast
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.ellipse(1.5 * z, -3.8 * z, 1.6 * z, 1.5 * z, 0.2, 0, Math.PI * 2);
            ctx.fill();

            // Wing feather detail
            ctx.fillStyle = '#451a03';
            ctx.beginPath();
            ctx.ellipse(-0.8 * z, -4.4 * z, 2.0 * z, 1.2 * z, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Bobbing Head
            const headX = (2.6 + headBob * 0.4) * z;
            const headY = (-6.5 + peckGround) * z;
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.arc(headX, headY, 1.5 * z, 0, Math.PI * 2);
            ctx.fill();

            // Yellow bill
            ctx.fillStyle = '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(headX + 1.2 * z, headY - 0.3 * z);
            ctx.lineTo(headX + 3.2 * z, headY + (peckGround > 0 ? 0.8 * z : 0.2 * z));
            ctx.lineTo(headX + 1.2 * z, headY + 0.5 * z);
            ctx.closePath();
            ctx.fill();

            // Dark eye dot
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(headX + 0.5 * z, headY - 0.4 * z, 0.35 * z, 0, Math.PI * 2);
            ctx.fill();
          }

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

      // ---------------------------------------------------------
      // 6. MINIMALIST TINY FLYING BIRDS (Burung-burung kecil minimalis yang terbang, tidak mengganggu tampilan)
      // ---------------------------------------------------------
      {
        const z = zoomLevelRef.current;
        const birdStrokeColor =
          currentPeriod === 'malam'
            ? 'rgba(148, 163, 184, 0.35)'
            : currentPeriod === 'sore'
            ? 'rgba(69, 26, 3, 0.52)'
            : currentPeriod === 'subuh'
            ? 'rgba(226, 232, 240, 0.45)'
            : 'rgba(30, 41, 59, 0.48)';

        const drawMinimalistBirdShape = (
          bx: number,
          by: number,
          span: number,
          flapPhase: number,
          tiltRad: number,
          alphaMult: number = 1
        ) => {
          const wingY = Math.sin(flapPhase) * (span * 0.58);
          const wingMidY = -Math.abs(Math.cos(flapPhase)) * (span * 0.32) + wingY * 0.35;

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(tiltRad);
          ctx.globalAlpha = alphaMult;
          ctx.strokeStyle = birdStrokeColor;
          ctx.lineWidth = Math.max(0.85, 1.05 * (span / 3.4));
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          // Minimalist 2-wing gull silhouette (clean curved 'm'/'v' strokes)
          ctx.beginPath();
          ctx.moveTo(-span, wingY);
          ctx.quadraticCurveTo(-span * 0.48, wingMidY - span * 0.28, 0, 0);
          ctx.quadraticCurveTo(span * 0.48, wingMidY - span * 0.28, span, wingY);
          ctx.stroke();
          ctx.restore();
        };

        minimalistBirds.forEach((b) => {
          // At deep night, only a couple of high sky birds glide faintly
          if (currentPeriod === 'malam' && b.id > 3) return;

          const flap = elapsed * b.flapSpeed + b.phase;

          if (b.mode === 'sky') {
            b.x += b.vx * delta;
            if (b.x > width + 40) {
              b.x = -40;
            }
            const curY = b.y + Math.sin(elapsed * 1.4 + b.phase) * b.vyWave;
            drawMinimalistBirdShape(b.x, curY, b.wingSpan, flap, 0.06, 0.72);
          } else {
            b.angle += b.angularSpeed * delta;
            const wx = b.centerWx + Math.cos(b.angle) * b.orbitRx;
            const wy = b.centerWy + Math.sin(b.angle) * b.orbitRy;
            const altBob = b.altitude + Math.sin(elapsed * 1.8 + b.phase) * 3.5;

            const airPt = toScreen(wx, wy, altBob, camera.x, camera.y);
            // Compute screen-space velocity tangent for subtle natural bank tilt
            const nextAngle = b.angle + (b.angularSpeed >= 0 ? 0.05 : -0.05);
            const nextWx = b.centerWx + Math.cos(nextAngle) * b.orbitRx;
            const nextWy = b.centerWy + Math.sin(nextAngle) * b.orbitRy;
            const nextPt = toScreen(nextWx, nextWy, altBob, camera.x, camera.y);
            const dxScreen = nextPt.x - airPt.x;
            const bankTilt = Math.max(-0.18, Math.min(0.18, (dxScreen >= 0 ? 1 : -1) * 0.08));

            drawMinimalistBirdShape(airPt.x, airPt.y, b.wingSpan * z, flap, bankTilt, 0.65);
          }
        });
      }

      // ---------------------------------------------------------
      // 6B. AESTHETIC ROYAL ZEPPELIN CRUISING ABOVE THE CITY (ENLARGED & CRISP "KOTA REFLEKSIA" TEXT)
      // (Purely atmospheric in the upper sky canopy — zero click/collision interference)
      // ---------------------------------------------------------
      {
        const z = zoomLevelRef.current * 1.32;
        // Slow, majestic high-altitude figure-8 / elliptical cruise path high above the north-central skyline
        const zepAngle = elapsed * 0.085;
        const zepWx = Math.cos(zepAngle) * 5.6;
        const zepWy = -5.2 + Math.sin(zepAngle * 2) * 1.9;
        const zepAlt = 154 + Math.sin(elapsed * 0.95) * 4.5;

        const nextZepAngle = zepAngle + 0.02;
        const nextZepWx = Math.cos(nextZepAngle) * 5.6;
        const nextZepWy = -5.2 + Math.sin(nextZepAngle * 2) * 1.9;

        const zepPt = toScreen(zepWx, zepWy, zepAlt, camera.x, camera.y);
        const nextZepPt = toScreen(nextZepWx, nextZepWy, zepAlt, camera.x, camera.y);
        const groundShadowPt = toScreen(zepWx, zepWy, 0, camera.x, camera.y);

        const dxZep = nextZepPt.x - zepPt.x;
        const dyZep = nextZepPt.y - zepPt.y;
        const facingRight = dxZep >= 0;
        const dirSign = facingRight ? 1 : -1;
        const pitchTilt = Math.max(-0.08, Math.min(0.08, (dyZep / (Math.abs(dxZep) + 0.1)) * 0.18 * dirSign));

        ctx.save();
        // 1) Very faint, soft ground shadow so the Zeppelin feels grounded in 3D space without distracting
        ctx.fillStyle = isNight ? 'rgba(2, 6, 23, 0.12)' : 'rgba(15, 23, 42, 0.075)';
        ctx.beginPath();
        ctx.ellipse(groundShadowPt.x, groundShadowPt.y, 30 * z, 12 * z, 0, 0, Math.PI * 2);
        ctx.fill();

        // 2) Position & orient high-altitude Zeppelin hull
        ctx.translate(zepPt.x, zepPt.y);
        ctx.scale(dirSign, 1);
        ctx.rotate(pitchTilt);

        const hullRx = 52 * z;
        const hullRy = 21 * z;

        // Soft nighttime ambient sky halo around the airship
        if (isNight) {
          const nightHalo = ctx.createRadialGradient(0, 4 * z, 4 * z, 0, 4 * z, 65 * z);
          nightHalo.addColorStop(0, 'rgba(251, 191, 36, 0.24)');
          nightHalo.addColorStop(0.6, 'rgba(16, 185, 129, 0.10)');
          nightHalo.addColorStop(1, 'rgba(15, 23, 42, 0)');
          ctx.fillStyle = nightHalo;
          ctx.beginPath();
          ctx.arc(0, 4 * z, 65 * z, 0, Math.PI * 2);
          ctx.fill();
        }

        // 3) Fluttering Trailing Aerial Streamer / Banner behind the tailfin (at x < -hullRx)
        ctx.save();
        const bannerStartX = -hullRx - 7 * z;
        const bannerLen = 58 * z;
        const bannerHalfH = 7.2 * z;
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
        ctx.lineWidth = 1.0 * z;
        ctx.beginPath();
        ctx.moveTo(-hullRx + 2 * z, 0);
        ctx.lineTo(bannerStartX, Math.sin(elapsed * 4.2) * 1.4 * z);
        ctx.stroke();

        // Waving ribbon polygon with generous height & width for text
        ctx.fillStyle = isNight ? 'rgba(6, 78, 59, 0.94)' : 'rgba(15, 23, 42, 0.90)';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.15 * z;
        ctx.beginPath();
        const wave1 = Math.sin(elapsed * 4.2) * 1.5 * z;
        const wave2 = Math.sin(elapsed * 4.2 + 1.2) * 1.8 * z;
        ctx.moveTo(bannerStartX, -bannerHalfH + wave1);
        ctx.quadraticCurveTo(
          bannerStartX - bannerLen * 0.5,
          -bannerHalfH + wave2,
          bannerStartX - bannerLen,
          -bannerHalfH * 0.92 - wave1 * 0.5
        );
        ctx.lineTo(bannerStartX - bannerLen + 5.5 * z, wave2 * 0.25);
        ctx.lineTo(bannerStartX - bannerLen, bannerHalfH * 0.92 - wave1 * 0.5);
        ctx.quadraticCurveTo(
          bannerStartX - bannerLen * 0.5,
          bannerHalfH + wave2,
          bannerStartX,
          bannerHalfH + wave1
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Unflip text inside the trailing banner so it is always readable left-to-right & fits cleanly
        ctx.save();
        ctx.translate(bannerStartX - bannerLen * 0.46, wave2 * 0.45);
        ctx.scale(dirSign, 1);
        ctx.fillStyle = '#fde047';
        ctx.font = `900 ${Math.max(5, Math.round(5.4 * z))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('✨ KOTA REFLEKSIA ✨', 0, 0, bannerLen - 14 * z);
        ctx.restore();
        ctx.restore();

        // 4) Cruciform Tail Stabilizer Fins (Upper, Lower, and Side Fin)
        // Upper vertical fin
        ctx.fillStyle = '#dc2626';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.0 * z;
        ctx.beginPath();
        ctx.moveTo(-hullRx * 0.58, -hullRy * 0.72);
        ctx.lineTo(-hullRx * 0.98, -hullRy * 1.42);
        ctx.lineTo(-hullRx * 1.04, -hullRy * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lower vertical fin
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.moveTo(-hullRx * 0.58, hullRy * 0.72);
        ctx.lineTo(-hullRx * 0.98, hullRy * 1.38);
        ctx.lineTo(-hullRx * 1.04, hullRy * 0.35);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 5) Suspended Passenger Gondola / Sky Cabin underneath the envelope
        const gondW = 34 * z;
        const gondH = 9.5 * z;
        const gondY = hullRy * 0.88;

        // Suspension rigging struts
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.95 * z;
        ctx.beginPath();
        ctx.moveTo(-gondW * 0.38, hullRy * 0.65);
        ctx.lineTo(-gondW * 0.32, gondY);
        ctx.moveTo(gondW * 0.38, hullRy * 0.65);
        ctx.lineTo(gondW * 0.32, gondY);
        ctx.stroke();

        // Gondola cabin hull (Royal Mahogany & Brass)
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.15 * z;
        ctx.beginPath();
        ctx.roundRect(-gondW / 2, gondY, gondW, gondH, [2 * z, 2 * z, 5 * z, 5 * z]);
        ctx.fill();
        ctx.stroke();

        // Illuminated Gondola Panoramic Windows
        for (let gw = -3; gw <= 3; gw++) {
          ctx.fillStyle = isNight ? '#fef08a' : '#bae6fd';
          ctx.beginPath();
          ctx.roundRect(gw * 4.0 * z - 1.35 * z, gondY + 2.4 * z, 2.7 * z, 4.0 * z, 0.8 * z);
          ctx.fill();
        }

        // Spinning Rear Gondola Propeller + Subtle Slipstream Puff
        const propX = -gondW / 2 - 2.4 * z;
        const propY = gondY + gondH * 0.5;
        const bladeLen = Math.sin(elapsed * 18) * 5.8 * z;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1.35 * z;
        ctx.beginPath();
        ctx.moveTo(propX, propY - bladeLen);
        ctx.lineTo(propX, propY + bladeLen);
        ctx.stroke();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(propX, propY, 1.6 * z, 0, Math.PI * 2);
        ctx.fill();

        // 6) Main Aerodynamic Ribbed Zeppelin Envelope (3D Cylindrical Shaded Hull)
        const hullGrad = ctx.createLinearGradient(0, -hullRy, 0, hullRy);
        if (isNight) {
          hullGrad.addColorStop(0, '#fef9c3');
          hullGrad.addColorStop(0.35, '#fde68a');
          hullGrad.addColorStop(0.75, '#0f766e');
          hullGrad.addColorStop(1, '#064e3b');
        } else {
          hullGrad.addColorStop(0, '#ffffff');
          hullGrad.addColorStop(0.38, '#fef3c7');
          hullGrad.addColorStop(0.78, '#10b981');
          hullGrad.addColorStop(1, '#047857');
        }

        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, hullRx, hullRy, 0, 0, Math.PI * 2);
        ctx.fill();

        // Clip inside envelope for longitudinal ribs & equatorial stripe
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(0, 0, hullRx, hullRy, 0, 0, Math.PI * 2);
        ctx.clip();

        // Longitudinal rib seams
        ctx.strokeStyle = isNight ? 'rgba(245, 158, 11, 0.32)' : 'rgba(5, 150, 105, 0.28)';
        ctx.lineWidth = 0.9 * z;
        for (const ribFactor of [-0.65, -0.32, 0.32, 0.65]) {
          ctx.beginPath();
          ctx.ellipse(0, ribFactor * hullRy * 0.2, hullRx, Math.abs(ribFactor) * hullRy, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Royal Gold & Emerald Equatorial Ribbon Belt across Zeppelin Hull
        const bandHalfH = 5.4 * z;
        ctx.fillStyle = 'rgba(6, 78, 59, 0.92)';
        ctx.fillRect(-hullRx, -bandHalfH, hullRx * 2, bandHalfH * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.15 * z;
        ctx.beginPath();
        ctx.moveTo(-hullRx, -bandHalfH);
        ctx.lineTo(hullRx, -bandHalfH);
        ctx.moveTo(-hullRx, bandHalfH);
        ctx.lineTo(hullRx, bandHalfH);
        ctx.stroke();

        // Crisp "KOTA REFLEKSIA" Emblem Text on the Zeppelin Body (unflipped so it always reads left-to-right)
        ctx.save();
        ctx.scale(dirSign, 1);
        ctx.fillStyle = '#fef08a';
        ctx.font = `900 ${Math.max(6, Math.round(6.2 * z))}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('KOTA REFLEKSIA', 0, 0, hullRx * 1.55);
        ctx.restore();

        ctx.restore();

        // Outer golden rim of envelope
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 1.3 * z;
        ctx.beginPath();
        ctx.ellipse(0, 0, hullRx, hullRy, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Golden Nose Cone & Mooring Spire at the Bow (x = +hullRx)
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(hullRx - 1.5 * z, 0, 4.2 * z, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 1.15 * z;
        ctx.beginPath();
        ctx.moveTo(hullRx + 2.2 * z, 0);
        ctx.lineTo(hullRx + 8.2 * z, 0);
        ctx.stroke();

        // Blinking Aviation Navigation Beacon on Top & Tail
        const navBlink = Math.sin(elapsed * 6) > 0.2;
        if (navBlink) {
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(-hullRx * 0.98, -hullRy * 1.42, 2.2 * z, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.arc(0, -hullRy - 1.6 * z, 2.0 * z, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      // ---------------------------------------------------------
      // 7. DYNAMIC 4 WEATHER PARTICLES & OVERLAYS (Smooth Fade-In / Fade-Out)
      // (Berawan: 15.00-17.00 | Hujan Ringan: 10.00-12.00 & 21.00-22.30 | Salju: 00.00-02.30 | Normal)
      // ---------------------------------------------------------
      {
        // 7a. Hujan Ringan (Smooth crossfade)
        const rainWeight = weatherWeights['hujan_ringan'];
        if (rainWeight > 0.005) {
          ctx.save();
          ctx.globalAlpha = rainWeight;

          // Soft atmospheric drizzle tint
          ctx.fillStyle = isNight ? 'rgba(15, 23, 42, 0.22)' : 'rgba(30, 41, 59, 0.12)';
          ctx.fillRect(0, 0, width, height);

          // Translucent slanted raindrops
          ctx.strokeStyle = isNight ? 'rgba(186, 230, 253, 0.52)' : 'rgba(125, 211, 252, 0.62)';
          ctx.lineWidth = 1.05;
          ctx.beginPath();
          for (const drop of raindrops) {
            drop.x += drop.vx * delta;
            drop.y += drop.vy * delta;
            if (drop.y > height + 25) {
              drop.y = -20;
              drop.x = Math.random() * (width + 60) - 30;
              if (Math.random() < 0.25) {
                const rip = rainRipples[rippleHeadIdx % rainRipples.length];
                rip.x = drop.x;
                rip.y = height * (0.35 + Math.random() * 0.6);
                rip.radius = 2;
                rip.alpha = 0.55;
                rippleHeadIdx++;
              }
            }
            if (drop.x < -40) drop.x = width + 30;

            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x + drop.vx * 0.045, drop.y + drop.length);
          }
          ctx.stroke();

          // Delicate water splash ripples on the ground
          for (const rip of rainRipples) {
            if (rip.alpha > 0.02) {
              rip.radius += delta * 15;
              rip.alpha -= delta * 1.5;
              ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, rip.alpha * 0.45)})`;
              ctx.lineWidth = 0.9;
              ctx.beginPath();
              ctx.ellipse(rip.x, rip.y, rip.radius, rip.radius * 0.45, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          ctx.restore();
        }

        // 7b. Salju (Smooth crossfade)
        const snowWeight = weatherWeights['salju'];
        if (snowWeight > 0.005) {
          ctx.save();
          ctx.globalAlpha = snowWeight;

          // Soft frosted cool midnight tint
          ctx.fillStyle = 'rgba(199, 210, 254, 0.09)';
          ctx.fillRect(0, 0, width, height);

          // Gentle fluttering snowflakes
          for (const flake of snowflakes) {
            flake.y += flake.vy * delta;
            flake.x += Math.sin(elapsed * flake.swaySpeed + flake.phase) * (flake.swayAmp * delta);
            if (flake.y > height + 10) {
              flake.y = -10;
              flake.x = Math.random() * width;
            }
            ctx.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // 7c. Berawan (Smooth crossfade)
        const cloudWeight = weatherWeights['berawan'];
        if (cloudWeight > 0.005) {
          ctx.save();
          ctx.globalAlpha = cloudWeight;

          // Drifting soft cumulus cloud wisps across upper screen
          for (const oc of extraOvercastClouds) {
            oc.x += oc.speed * delta;
            if (oc.x > width + 180) oc.x = -180;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
            ctx.beginPath();
            ctx.roundRect(oc.x, oc.y, oc.w, oc.h, oc.h / 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('click', onPointerDown);
      canvas.removeEventListener('dblclick', onDblClick);
      canvas.removeEventListener('mousemove', onPointerMove);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
      canvas.removeEventListener('wheel', onWheel);
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
  // TREE APPLE HARVESTING (+2 XP, Smooth Fade-Out) & WATERING ACTION (Pohon berbuah saat disiram)
  // -------------------------------------------------------------
  const handleHarvestTreeApple = (treeIdx: number) => {
    const nowPerf = performance.now();
    const existingCycle = treeCyclesRef.current[treeIdx];
    if (!existingCycle || !existingCycle.hasRipeApples) {
      sounds.playClick();
      showToast('🌳 Pohon ini belum berbuah apel. Yuk siram pohonnya terlebih dahulu agar berbuah!', 3000);
      return;
    }

    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);

    const updatedCycle: TreeWaterCycle = {
      ...existingCycle,
      count: 0,
      appleStartTime: null,
      hasRipeApples: false,
      harvestFadeStartTime: nowPerf,
    };

    treeCyclesRef.current[treeIdx] = updatedCycle;
    setTreeCycles((prev) => ({ ...prev, [treeIdx]: updatedCycle }));

    sounds.playRewardXp();
    if (onAddXpRef.current) {
      onAddXpRef.current(2, 'Memetik Buah Apel Segar di Pohon Kota');
    } else {
      addXpFloat(2, 'Memetik Buah Apel Pohon');
    }

    showToast('🍎 Berhasil memetik buah apel segar! (+2 XP) • Siram pohon lagi untuk menumbuhkan buah berikutnya.', 3600);
    playerSpeechRef.current = {
      text: 'Segar banget buah apelnya! Dapat +2 XP 🍎✨',
      expiresAt: Date.now() + 4000,
    };
    sendHeartbeatRef.current?.();
  };
  handleHarvestTreeAppleRef.current = handleHarvestTreeApple;

  // -------------------------------------------------------------
  // DRY LEAF PICKUP ACTION (10 Daun Kering Tersebar di Kota, Memungut 5 Daun Kering = +1 XP, Kota Tetap Bersih)
  // -------------------------------------------------------------
  const handlePickDryLeaf = (leafId: number) => {
    const targetLeaf = dryLeavesRef.current.find((l) => l.id === leafId);
    if (!targetLeaf || targetLeaf.pickedAt !== null) return;

    const nowPerf = performance.now();
    const nowMs = Date.now();
    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);

    const nextLeaves = dryLeavesRef.current.map((l) =>
      l.id === leafId ? { ...l, pickedAt: nowMs, fadeStartTime: nowPerf } : l
    );
    dryLeavesRef.current = nextLeaves;
    setDryLeaves(nextLeaves);

    const remainingLeavesOnMap = nextLeaves.filter((l) => l.pickedAt === null).length;
    const nextCount = pickedDryLeavesCountRef.current + 1;
    if (nextCount >= 5) {
      pickedDryLeavesCountRef.current = 0;
      setPickedDryLeavesCount(0);
      try {
        localStorage.setItem(dryLeafStorageKey, '0');
      } catch {}

      sounds.playRewardXp();
      if (onAddXpRef.current) {
        onAddXpRef.current(1, 'Peduli Lingkungan: Memungut 5 Daun Kering');
      } else {
        addXpFloat(1, 'Memungut 5 Daun Kering');
      }
      showToast(
        `🍂 Luar biasa! Kamu telah memungut 5 Daun Kering & menjaga kebersihan kota (+1 XP)! (${remainingLeavesOnMap}/10 daun tersisa di peta)`,
        3800
      );
      playerSpeechRef.current = {
        text: '5 daun kering terkumpul! Kota tetap bersih & dapat +1 XP 🍂✨',
        expiresAt: Date.now() + 4500,
      };
    } else {
      pickedDryLeavesCountRef.current = nextCount;
      setPickedDryLeavesCount(nextCount);
      try {
        localStorage.setItem(dryLeafStorageKey, String(nextCount));
      } catch {}

      sounds.playClick();
      showToast(
        `🍂 Memungut daun kering (${nextCount}/5). Kumpulkan ${5 - nextCount} daun lagi untuk +1 XP! (${remainingLeavesOnMap}/10 tersebar di peta)`,
        3200
      );
      playerSpeechRef.current = {
        text: `Memungut daun kering (${nextCount}/5) 🍂`,
        expiresAt: Date.now() + 3200,
      };
    }

    sendHeartbeatRef.current?.();
  };
  handlePickDryLeafRef.current = handlePickDryLeaf;

  const handleWaterTree = (treeIdx: number) => {
    const nowPerf = performance.now();
    const existingCycle = treeCyclesRef.current[treeIdx];
    setPendingConfirmation(null);
    setIsCafeMenuOpen(false);

    if (existingCycle && existingCycle.hasRipeApples) {
      handleHarvestTreeApple(treeIdx);
      return;
    }

    const wasAutumnTree = Boolean(existingCycle?.isAutumn);
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
        existingCycle && !existingCycle.hasRipeApples && existingCycle.count < 3
          ? existingCycle.count
          : 0;
      const nextCount = prevCount + 1;
      const isThirdWatering = nextCount >= 3;

      const updatedCycle: TreeWaterCycle = {
        count: isThirdWatering ? 3 : nextCount,
        lastWateredTime: nowPerf,
        appleStartTime: isThirdWatering ? nowPerf : null,
        hasRipeApples: isThirdWatering ? true : false,
        harvestFadeStartTime: null,
        isAutumn: false, // Pohon dengan daun gugur yang disiram langsung hijau kembali!
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

      if (wasAutumnTree) {
        showToast(
          `🌿 Pohon daun gugur berhasil disiram dan kini telah HIJAU RIMBUN kembali! (${nextCount}/3 menuju berbuah apel • -1 XP • Sisa: ${remaining} XP)`,
          4000
        );
        playerSpeechRef.current = {
          text: 'Alhamdulillah! Pohon daun gugur yang disiram langsung hijau segar kembali! 🌿💧✨',
          expiresAt: Date.now() + 4500,
        };
      } else if (isThirdWatering) {
        showToast(`🍎 Pohon telah disiram (3/3) dan langsung mengeluarkan buah apel merah segar! Klik "Petik Apel" untuk +2 XP!`, 3800);
        playerSpeechRef.current = {
          text: 'Wah pohonnya sudah disiram dan berbuah apel! Ayo kita petik (+2 XP)! 🍎✨',
          expiresAt: Date.now() + 4500,
        };
      } else {
        showToast(`💧 Pohon disiram (${nextCount}/3)! Siram ${3 - nextCount}x lagi agar pohon mengeluarkan buah apel (-1 XP) • Sisa: ${remaining} XP`, 3500);
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
      const nowPerf = performance.now();
      fishingStartTimeRef.current = nowPerf;
      fishingPullStartTimeRef.current = 0;
      caughtFishRef.current = null;
      if (playerRef.current) {
        playerRef.current.fishingStartTime = nowPerf;
      }
      setFishingPhase('casting');
      setIsFishing(true);
      showToast('🎣 Mengayunkan joran & melempar pancing ke Kolam... (-3 XP)', 3500);
      playerSpeechRef.current = {
        text: 'Hap! Lempar pancing dulu ke tengah kolam! 🎣',
        expiresAt: Date.now() + 3000,
      };

      if (fishingTimerRef.current) clearTimeout(fishingTimerRef.current);
      // Setelah animasi melempar pancing selesai (~1.0 detik), masuk fase menunggu interaktif
      fishingTimerRef.current = window.setTimeout(() => {
        setFishingPhase('waiting');
        showToast('💦 Umpan bergoyang! Klik tombol "🎣 Angkat Pancing!" untuk menarik ikan!', 6000);
        playerSpeechRef.current = {
          text: 'Wah pelampungnya bergoyang! Ayo klik Angkat Pancing! 💦🎣',
          expiresAt: Date.now() + 4500,
        };
      }, 1000);
    }
  };

  const handlePullFishingRod = () => {
    if (!isFishing || fishingPhase === 'pulling') return;
    sounds.playClick();
    if (fishingTimerRef.current) clearTimeout(fishingTimerRef.current);

    const randomCatch = FISH_REWARDS[Math.floor(Math.random() * FISH_REWARDS.length)];
    caughtFishRef.current = randomCatch;
    fishingPullStartTimeRef.current = performance.now();
    setFishingPhase('pulling');
    showToast('🎣 Menarik joran & mengangkat pancing dari air...', 2000);
    playerSpeechRef.current = {
      text: 'Tarikk!! Angkat pancingnya! 🎣💦',
      expiresAt: Date.now() + 2000,
    };

    fishingTimerRef.current = window.setTimeout(() => {
      setIsFishing(false);
      setFishingPhase(null);
      fishingPullStartTimeRef.current = 0;
      sounds.playRewardXp();
      showToast(`🎉 Hore! Kamu berhasil mengangkat pancing & menangkap ${randomCatch.icon} ${randomCatch.name}!`, 4500);
      playerSpeechRef.current = {
        text: `Dapat ${randomCatch.name}! Hore! 🎣✨`,
        expiresAt: Date.now() + 5000,
      };
    }, 850);
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
          {/* Left: Header Jumlah Warga Online, Daun Kering Counter, and Held Item Countdown (Roti, Kopi, Eskrim) */}
          <div className="flex flex-col items-start gap-1 max-w-full pointer-events-auto relative">
            {(() => {
              const myHandle =
                studentName
                  .split(' ')
                  .slice(0, 2)
                  .join('_')
                  .toLowerCase()
                  .replace(/[^a-z0-9_]/g, '') || (isTeacher ? 'guru_dkv' : isGuest ? 'tamu_kota' : 'siswa');

              // Hanya Warga yang benar-benar Online (Tanpa NPC!)
              const realOnlineCitizens = onlineRemoteList.map((rem) => ({
                id: rem.id,
                handle: rem.handle,
                name: rem.name,
                role: rem.role,
                icon: rem.role === 'guru' ? '👨‍🏫' : rem.role === 'wartawan' ? '📸' : '👦',
                getCoords: () => {
                  const r = remotePlayersRef.current.get(rem.id);
                  return r ? { wx: r.wx, wy: r.wy } : { wx: rem.wx, wy: rem.wy };
                },
              }));

              const totalOnlineWarga = 1 + realOnlineCitizens.length;

              return (
                <>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Tombol Header Jumlah Warga Online: Hanya menampilkan "Icon Online (Jumlah dalam bentuk angka) Warga Online" */}
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsOnlineListOpen((prev) => !prev);
                        setOnlineListInteractionTick((t) => t + 1);
                      }}
                      className="bg-[#121e2c]/78 hover:bg-[#1a293b]/90 backdrop-blur-md border border-emerald-500/55 hover:border-emerald-400 rounded-full px-3 py-1 sm:py-1.5 text-white shadow-lg flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
                      title="Klik untuk melihat daftar nama Warga Online & menuju ke lokasinya"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                      <span className="text-emerald-300 font-mono font-extrabold text-[10.5px] sm:text-xs">
                        {totalOnlineWarga}
                      </span>
                      <span className="text-slate-100 font-bold text-[10.5px] sm:text-xs">
                        Warga Online
                      </span>
                    </button>

                    {/* Daun Kering Counter */}
                    <div
                      className="bg-[#121e2c]/68 backdrop-blur-md border border-amber-500/45 rounded-full px-2.5 py-1 sm:py-1.5 text-amber-200 text-[10px] sm:text-[11px] font-bold shadow-lg flex items-center gap-1 shrink-0"
                      title="10 Daun Kering tersebar di kota • Pungut setiap 5 daun kering untuk mendapatkan +1 XP"
                    >
                      <span>🍂</span>
                      <span className="font-mono text-amber-300">{pickedDryLeavesCount}/5</span>
                      <span className="text-[9px] text-emerald-300 font-mono">(+1 XP)</span>
                    </div>

                    {/* Info Header Memegang Item (Kopi, Roti, Eskrim) Bersama Countdown Timer di Samping Info Daun */}
                    {heldItem && (
                      <div className="bg-[#121e2c]/78 backdrop-blur-md border border-amber-400/55 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 flex items-center gap-1.5 text-[10.5px] sm:text-[11px] font-bold text-amber-200 shadow-lg animate-fade-in-down shrink-0">
                        <span className="text-xs sm:text-sm">
                          {heldItem === 'kopi' ? '☕' : heldItem === 'roti' ? '🥐' : '🍦'}
                        </span>
                        <span className="whitespace-nowrap font-medium text-amber-100">
                          {heldItem === 'kopi' ? 'Kopi Hangat' : heldItem === 'roti' ? 'Roti Panggang' : 'Eskrim Segar'}
                        </span>
                        <span className="text-[9.5px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/50 text-amber-300">
                          {heldItemRemainingSec}d
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            equipHeldItem(null);
                          }}
                          className="w-4 h-4 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[9px] cursor-pointer transition active:scale-90"
                          title="Habiskan / Simpan"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Exclusive Movement Mode Selector for Master kikybahsoan (Jalan Normal vs Teleportasi) */}
                    {isMasterKiky && (
                      <div
                        className="bg-[#0f172a]/85 backdrop-blur-md border border-cyan-400/60 rounded-full p-0.5 text-[10px] sm:text-[11px] font-bold shadow-lg flex items-center gap-0.5"
                        title="Mode Pergerakan Khusus Master kikybahsoan: Pilih Jalan Normal atau Teleportasi Instan"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setMasterMoveMode('walk');
                            showToast('🚶 Mode Pergerakan Master: Jalan Normal Aktif', 2000);
                          }}
                          className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 cursor-pointer ${
                            masterMoveMode === 'walk'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'text-slate-300 hover:text-white'
                          }`}
                        >
                          <span>🚶</span>
                          <span>Jalan</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setMasterMoveMode('teleport');
                            showToast('⚡ Mode Pergerakan Master: Teleportasi Chrono Aktif', 2000);
                          }}
                          className={`px-2 py-0.5 rounded-full transition flex items-center gap-1 cursor-pointer ${
                            masterMoveMode === 'teleport'
                              ? 'bg-gradient-to-r from-cyan-400 to-amber-300 text-slate-950 shadow-sm'
                              : 'text-cyan-200 hover:text-white'
                          }`}
                        >
                          <span>⚡</span>
                          <span>Teleport</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Popover Daftar Nama Warga Online (Muncul saat Header Warga Online diklik, Tanpa NPC, & Hilang Otomatis dengan Soft setelah 10 detik) */}
                  {isOnlineListOpen && (
                    <div
                      onPointerDown={() => setOnlineListInteractionTick((t) => t + 1)}
                      className={`mt-1 bg-[#121e2c]/90 backdrop-blur-md border border-emerald-500/50 rounded-2xl p-2.5 text-white shadow-2xl w-60 sm:w-68 transition-all duration-700 ease-in-out origin-top-left ${
                        isOnlineListSoftFading
                          ? 'opacity-0 -translate-y-1.5 scale-95 pointer-events-none'
                          : 'opacity-100 translate-y-0 scale-100 animate-fade-in-down'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-700/70">
                        <div className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-emerald-300">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Daftar Warga Online ({totalOnlineWarga})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsOnlineListOpen(false)}
                          className="w-5 h-5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
                          title="Tutup daftar warga online"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex flex-col gap-1 max-h-48 overflow-y-auto pr-0.5">
                        {/* Pengguna Sendiri */}
                        <button
                          type="button"
                          onClick={() => {
                            handleCenterOnPlayer();
                            setIsOnlineListOpen(false);
                            showToast(`📍 Kamera diarahkan ke avatarmu (${studentName})`, 2200);
                          }}
                          className="w-full px-2.5 py-1.5 rounded-xl text-left text-[10.5px] sm:text-xs font-bold bg-sky-500/15 hover:bg-sky-500/30 border border-sky-400/40 text-sky-100 flex items-center justify-between gap-2 transition active:scale-98 cursor-pointer"
                          title="Klik untuk memusatkan kamera ke avatarmu"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span>{isGuest ? '📸' : isTeacher ? '👨‍🏫' : '🟢'}</span>
                            <span className="truncate">{studentName}</span>
                            <span className="text-[9.5px] text-sky-300 font-normal shrink-0">(Kamu)</span>
                          </div>
                          <span className="text-[9px] font-mono text-sky-300 shrink-0">@{myHandle}</span>
                        </button>

                        {/* Daftar Warga Online Lainnya (Tanpa NPC) */}
                        {realOnlineCitizens.map((cit) => (
                          <button
                            key={cit.id}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              const coords = cit.getCoords();
                              if (coords && playerRef.current) {
                                if (isSittingRef.current) {
                                  setIsSitting(false);
                                  setSittingSeat(null);
                                }
                                const destWx = Math.max(-6.8, Math.min(6.8, coords.wx + 0.42));
                                const destWy = Math.max(-6.8, Math.min(6.8, coords.wy + 0.35));
                                if (isMasterKikyRef.current && masterMoveModeRef.current === 'teleport') {
                                  teleportFlashRef.current = {
                                    fromWx: playerRef.current.wx,
                                    fromWy: playerRef.current.wy,
                                    toWx: destWx,
                                    toWy: destWy,
                                    startTime: performance.now(),
                                  };
                                  playerRef.current.wx = destWx;
                                  playerRef.current.wy = destWy;
                                  playerRef.current.targetWx = destWx;
                                  playerRef.current.targetWy = destWy;
                                  playerRef.current.isMoving = false;
                                } else {
                                  playerRef.current.targetWx = destWx;
                                  playerRef.current.targetWy = destWy;
                                  playerRef.current.isMoving = true;
                                }
                                clickRippleRef.current = {
                                  wx: destWx,
                                  wy: destWy,
                                  time: performance.now(),
                                };
                                resetCameraRequestedRef.current = true;
                                sendHeartbeatRef.current?.();
                                setIsOnlineListOpen(false);
                                showToast(`🧭 Avatar menuju ke warga ${cit.name} (@${cit.handle})`, 2800);
                              }
                            }}
                            className={`w-full px-2.5 py-1.5 rounded-xl text-left text-[10.5px] sm:text-xs font-bold border flex items-center justify-between gap-2 transition active:scale-98 cursor-pointer ${
                              cit.role === 'guru'
                                ? 'bg-amber-950/60 hover:bg-amber-900/80 border-amber-400/50 text-amber-100'
                                : cit.role === 'wartawan'
                                ? 'bg-sky-950/60 hover:bg-sky-900/80 border-sky-400/50 text-sky-100'
                                : 'bg-emerald-950/60 hover:bg-emerald-900/80 border-emerald-400/50 text-emerald-100'
                            }`}
                            title={`Klik untuk menggerakkan avatarmu menuju ${cit.name} (@${cit.handle})`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span>{cit.icon}</span>
                              <span className="truncate">{cit.name}</span>
                            </div>
                            <span className="text-[9px] font-mono text-emerald-300 shrink-0">
                              🧭 @{cit.handle}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* ROW 2: SINGLE MUTUALLY-EXCLUSIVE POPUP SLOT (Auto-hilang dengan soft setelah 5 detik jika tidak diklik, dan muncul secara soft) */}
        <div
          onPointerDown={() => setPopupInteractionTick((t) => t + 1)}
          className={`w-full flex justify-center transition-all duration-700 ease-out ${
            isInfoPopupSoftEntering
              ? 'opacity-0 translate-y-2.5 scale-95 pointer-events-none'
              : isInfoPopupSoftFading
              ? 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
              : 'opacity-100 translate-y-0 scale-100'
          }`}
        >
          {isCafeMenuOpen ? (
            /* 1. MENU TOKO ROTI & KAFE (Compact & Semi-Transparent) */
            <aside
              aria-label="Menu Toko Roti & Kafe"
              className="w-full max-w-[310px] sm:max-w-[340px] pointer-events-auto animate-fade-in-down"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-[#121e2c]/72 backdrop-blur-md text-white px-2.5 py-2 rounded-xl border border-amber-400/40 shadow-lg flex flex-col items-center gap-1.5">
                <div className="w-full flex items-center justify-between border-b border-slate-700/50 pb-1">
                  <div className="text-[11px] font-bold text-slate-200 flex items-center gap-1 whitespace-nowrap">
                    <span>☕</span>
                    <span className="font-extrabold text-white">Toko Roti & Kafe Warga</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-amber-300 font-mono text-[10px]">🪙 {studentPoints} XP</span>
                  </div>
                  <button
                    onClick={() => setIsCafeMenuOpen(false)}
                    className="p-0.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="Tutup Menu Kafe"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {cafeToast && (
                  <div className="w-full text-center text-[10px] font-bold text-amber-200 bg-amber-950/50 border border-amber-500/35 rounded-lg px-2 py-0.5">
                    {cafeToast}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-1.5 w-full">
                  <button
                    onClick={handleBuyCoffee}
                    className="bg-[#245e54]/80 hover:bg-[#2d7569]/90 active:scale-95 text-white px-2 py-1.5 rounded-lg text-[10.5px] font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                  >
                    <span className="text-sm">☕</span>
                    <span className="text-[10px] mt-0.5">Kopi (-2 XP)</span>
                    <span className="text-[8.5px] text-emerald-200/90 font-normal">90 detik</span>
                  </button>
                  <button
                    onClick={handleBuyBread}
                    className="bg-[#245e54]/80 hover:bg-[#2d7569]/90 active:scale-95 text-white px-2 py-1.5 rounded-lg text-[10.5px] font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                  >
                    <span className="text-sm">🍞</span>
                    <span className="text-[10px] mt-0.5">Roti (-1 XP)</span>
                    <span className="text-[8.5px] text-emerald-200/90 font-normal">60 detik</span>
                  </button>
                  <button
                    onClick={handleBuyIceCream}
                    className="bg-[#245e54]/80 hover:bg-[#2d7569]/90 active:scale-95 text-white px-2 py-1.5 rounded-lg text-[10.5px] font-bold flex flex-col items-center leading-tight transition cursor-pointer border border-emerald-400/30 shadow-sm"
                  >
                    <span className="text-sm">🍦</span>
                    <span className="text-[10px] mt-0.5">Eskrim (-1 XP)</span>
                    <span className="text-[8.5px] text-emerald-200/90 font-normal">30 detik</span>
                  </button>
                </div>
              </div>
            </aside>
          ) : isStandaloneToast && cafeToast ? (
            /* 2. STANDALONE TOAST (Compact & Semi-Transparent) */
            <div
              role="status"
              className="pointer-events-auto bg-[#121e2c]/70 backdrop-blur-md text-emerald-200 font-bold text-[11px] sm:text-xs px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-lg animate-fade-in-down flex items-center gap-1.5 max-w-[310px] sm:max-w-[340px] text-center"
            >
              <span>✨</span>
              <span>{cafeToast}</span>
              <button
                onClick={() => showToast(null, 0)}
                className="ml-1 text-slate-300 hover:text-white text-[10px] cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            </div>
          ) : pendingConfirmation ? (
            /* 3. POP-UP KONFIRMASI MASUK BANGUNAN / KAFE (Perkecil & Transparan Sedikit) */
            <aside
              aria-label="Konfirmasi Masuk Bangunan"
              className="w-full max-w-[295px] sm:max-w-[330px] pointer-events-auto animate-fade-in-down"
            >
              <div className="bg-[#121e2c]/68 backdrop-blur-md border border-amber-400/40 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg bg-gradient-to-tr from-sky-500/20 via-slate-800/70 to-amber-500/20 border border-amber-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                    {pendingConfirmation.icon}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[8.5px] font-bold tracking-wider uppercase text-amber-300/95 flex items-center gap-1 leading-none">
                      <span>📍 Dekat Bangunan</span>
                    </div>
                    <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                      {pendingConfirmation.name}
                    </h4>
                    <p className="text-[9.5px] text-slate-200/90 truncate leading-tight">
                      {pendingConfirmation.tagline}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => {
                      const target = pendingConfirmation;
                      if (target.id === 'bank_materi' && !isTeacher) {
                        sounds.playClick();
                        setPendingConfirmation(null);
                        showToast(
                          '🔒 Gedung Bank Materi khusus untuk Bapak/Ibu Guru! Materi hasil Generate AI Guru sudah tersebar di Perpustakaan, Pusat Refleksi, Studio ON AIR & Lab DKV.',
                          4500
                        );
                        onSelectBuildingRef.current('bank_materi');
                        return;
                      }
                      sounds.playOpenModal();
                      setPendingConfirmation(null);
                      if (target.type === 'cafe') {
                        setIsCafeMenuOpen(true);
                      } else {
                        onSelectBuildingRef.current(target.id as BuildingId);
                      }
                    }}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-[10.5px] sm:text-[11px] font-bold shadow-sm border border-emerald-400/40 transition cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>{pendingConfirmation.id === 'bank_materi' && !isTeacher ? '🔒 Khusus Guru' : '🚪 Masuk'}</span>
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setPendingConfirmation(null);
                    }}
                    className="w-6 h-6 rounded-md bg-slate-800/65 hover:bg-slate-700/80 text-slate-300 hover:text-white flex items-center justify-center text-[10px] transition cursor-pointer"
                    title="Abaikan"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </aside>
          ) : nearbyAction ? (
            /* 4. POP-UP AKSI KONTEKSTUAL (Perkecil & Transparan Sedikit) */
            <aside
              aria-label="Aksi Lingkungan Kota"
              className="w-full max-w-[295px] sm:max-w-[340px] pointer-events-auto animate-fade-in-down"
            >
              {nearbyAction.type === 'dry_leaf' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-amber-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      🍂
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-amber-300 leading-none">
                        10 Daun Kering • Terkumpul {pickedDryLeavesCount}/5
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        Pungut Daun Kering ({pickedDryLeavesCount}/5)
                      </h4>
                      <p className="text-[9.5px] truncate text-slate-200/90 leading-tight">
                        {cafeToast || 'Kumpulkan 5 dari 10 daun kering (+1 XP)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePickDryLeaf(nearbyAction.leafId ?? 0)}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-500 hover:to-orange-500 text-white text-[10.5px] font-bold border border-amber-400/45 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>🍂 Pungut</span>
                    <span className="text-[9px] font-mono text-emerald-200 bg-amber-950/75 px-1 py-0.5 rounded border border-amber-400/30">
                      +1 XP
                    </span>
                  </button>
                </div>
              ) : nearbyAction.type === 'tree' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-emerald-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      {treeCycles[nearbyAction.treeIndex || 0]?.hasRipeApples
                        ? '🍎'
                        : treeCycles[nearbyAction.treeIndex || 0]?.isAutumn
                        ? '🍂'
                        : '🌳'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-emerald-300 leading-none">
                        {treeCycles[nearbyAction.treeIndex || 0]?.hasRipeApples
                          ? 'Pohon Berbuah Apel • Siap Dipetik!'
                          : treeCycles[nearbyAction.treeIndex || 0]?.isAutumn
                          ? 'Pohon Daun Gugur • Siram agar Hijau Kembali!'
                          : `Pohon Kota • Disiram ${treeCycles[nearbyAction.treeIndex || 0]?.count || 0}/3`}
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        {treeCycles[nearbyAction.treeIndex || 0]?.hasRipeApples
                          ? 'Petik Buah Apel Merah (+2 XP)'
                          : treeCycles[nearbyAction.treeIndex || 0]?.isAutumn
                          ? 'Siram Pohon agar Hijau Kembali'
                          : `Siram Pohon (${treeCycles[nearbyAction.treeIndex || 0]?.count || 0}/3)`}
                      </h4>
                      <p className={`text-[9.5px] truncate leading-tight ${cafeToast ? 'text-emerald-200 font-semibold' : 'text-slate-200/90'}`}>
                        {cafeToast ||
                          (treeCycles[nearbyAction.treeIndex || 0]?.hasRipeApples
                            ? 'Buah apel segar siap dipetik (+2 XP)'
                            : treeCycles[nearbyAction.treeIndex || 0]?.isAutumn
                            ? 'Siram pohon daun gugur ini agar rimbun & hijau kembali'
                            : 'Siram pohon 3x agar berbuah apel (+2 XP)')}
                      </p>
                    </div>
                  </div>
                  {treeCycles[nearbyAction.treeIndex || 0]?.hasRipeApples ? (
                    <button
                      onClick={() => handleHarvestTreeApple(nearbyAction.treeIndex || 0)}
                      className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-rose-600/90 to-red-600/90 hover:from-rose-500 hover:to-red-500 text-white text-[10.5px] font-bold border border-rose-400/45 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>🍎 Petik</span>
                      <span className="text-[9px] font-mono text-amber-200 bg-rose-950/75 px-1 py-0.5 rounded border border-rose-400/30">
                        +2 XP
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleWaterTree(nearbyAction.treeIndex || 0)}
                      className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-[10.5px] font-bold border border-emerald-400/40 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>
                        {treeCycles[nearbyAction.treeIndex || 0]?.isAutumn
                          ? '💧 Siram Hijaukan'
                          : `💧 Siram (${Math.min(3, (treeCycles[nearbyAction.treeIndex || 0]?.count || 0) + 1)}/3)`}
                      </span>
                      <span className="text-[9px] font-mono text-amber-300 bg-emerald-950/75 px-1 py-0.5 rounded border border-emerald-500/30">
                        -1 XP
                      </span>
                    </button>
                  )}
                </div>
              ) : nearbyAction.type === 'town_rules' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-amber-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      📋
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-amber-300 leading-none">
                        Gapura Masuk Kota SMKN 2
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        Papan Peraturan & Panduan
                      </h4>
                      <p className="text-[9.5px] truncate text-amber-100/85 leading-tight">
                        Tata tertib kota & panduan aktivitas warga
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playOpenModal();
                      if (onOpenTownRules) {
                        onOpenTownRules();
                      } else {
                        setIsTownRulesModalOpen(true);
                      }
                    }}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-500 hover:to-orange-500 text-white text-[10.5px] font-bold border border-amber-400/45 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>📋 Baca</span>
                  </button>
                </div>
              ) : nearbyAction.type === 'announcement_board' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-amber-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      📢
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-amber-300 leading-none">
                        Halaman Balai Kota • Info Guru
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        Papan Pengumuman Guru
                      </h4>
                      <p className="text-[9.5px] truncate text-amber-100/85 leading-tight">
                        {teacherAnnouncements[0]?.content || 'Lihat pengumuman & arahan terbaru dari Bapak/Ibu Guru'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playOpenModal();
                      setTeacherAnnouncements(StorageService.getTeacherAnnouncements());
                      setIsAnnouncementModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-500 hover:to-orange-500 text-white text-[10.5px] font-bold border border-amber-400/45 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>📢 Lihat</span>
                  </button>
                </div>
              ) : nearbyAction.type === 'wisma_mailbox' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-sky-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      📮
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-sky-300 leading-none">
                        {nearbyAction.wismaName || 'Wisma Refleksia'}
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        Kotak Surat Masukan & Saran
                      </h4>
                      <p className="text-[9.5px] truncate text-sky-100/85 leading-tight">
                        Kirim masukan & saran (Tersimpan ke Spreadsheet)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playOpenModal();
                      const found =
                        HOUSING_UNITS.find((h) => h.id === nearbyAction.wismaId) || HOUSING_UNITS[0];
                      setActiveWismaMailbox(found);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-sky-600/90 to-blue-600/90 hover:from-sky-500 hover:to-blue-500 text-white text-[10.5px] font-bold border border-sky-400/45 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>📮 Kotak Saran</span>
                  </button>
                </div>
              ) : nearbyAction.type === 'beringin' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-emerald-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600/80 to-teal-500/80 border border-emerald-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      🌳
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-emerald-300 flex items-center gap-1 leading-none">
                        <span>Pohon Beringin</span>
                        <span className="text-amber-300 font-mono font-black">+1 XP</span>
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        Jurnal Harian Refleksi
                      </h4>
                      <p className="text-[9.5px] truncate text-emerald-100/85 leading-tight">
                        {stickyNotes.length} catatan di pohon • Tulis refleksimu
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playOpenModal();
                      setIsJurnalModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-600/90 to-teal-600/90 hover:from-emerald-500 hover:to-teal-500 text-white text-[10.5px] font-bold border border-emerald-400/45 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <Pin className="w-3 h-3" />
                    <span>Tulis Jurnal</span>
                  </button>
                </div>
              ) : nearbyAction.type === 'literacy' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-cyan-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      📖
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-cyan-300 leading-none">
                        Sudut Literasi Warga
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        Baca Buku & Majalah DKV
                      </h4>
                      <p className={`text-[9.5px] truncate leading-tight ${cafeToast ? 'text-cyan-200 font-semibold' : 'text-slate-200/90'}`}>
                        {cafeToast || 'Komik, Majalah, atau Koran (-1 XP)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playOpenModal();
                      setIsLiteracyModalOpen(true);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-cyan-600/90 to-blue-600/90 hover:from-cyan-500 hover:to-blue-500 text-white text-[10.5px] font-bold border border-cyan-400/40 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>📖 Baca</span>
                    <span className="text-[9px] font-mono text-amber-300 bg-cyan-950/75 px-1 py-0.5 rounded border border-cyan-500/30">
                      -1 XP
                    </span>
                  </button>
                </div>
              ) : nearbyAction.type === 'bench' ? (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-amber-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      {nearbyAction.benchId?.startsWith('swing')
                        ? '🎠'
                        : nearbyAction.benchId?.startsWith('campfire')
                        ? '🔥'
                        : '🪑'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-amber-300 leading-none">
                        {nearbyAction.benchName || 'Kursi Taman'}
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        {nearbyAction.benchId?.startsWith('swing')
                          ? isSittingRef.current
                            ? 'Sedang Naik Ayunan'
                            : 'Naik & Berayun (-1 XP)'
                          : nearbyAction.benchId?.startsWith('campfire')
                          ? isSittingRef.current
                            ? 'Menghangatkan Tubuh'
                            : 'Duduk di Api Unggun'
                          : isSittingRef.current
                          ? 'Sedang Duduk Santai'
                          : 'Duduk Santai (Muat 2 Orang)'}
                      </h4>
                      <p className={`text-[9.5px] truncate leading-tight ${cafeToast ? 'text-amber-200 font-semibold' : 'text-slate-200/90'}`}>
                        {cafeToast ||
                          (nearbyAction.benchId?.startsWith('swing')
                            ? 'Naik ayunan taman (-1 XP)'
                            : nearbyAction.benchId?.startsWith('campfire')
                            ? 'Hangatkan tubuh bersama warga'
                            : 'Bangku taman muat 2 orang')}
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
                    className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-amber-600/90 to-orange-600/90 hover:from-amber-500 hover:to-orange-500 text-white text-[10.5px] font-bold border border-amber-400/40 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>
                      {nearbyAction.benchId?.startsWith('swing')
                        ? isSittingRef.current
                          ? '🚶 Turun'
                          : '🎠 Ayunan'
                        : nearbyAction.benchId?.startsWith('campfire')
                        ? isSittingRef.current
                          ? '🚶 Berdiri'
                          : '🔥 Duduk'
                        : isSittingRef.current
                        ? '🚶 Berdiri'
                        : '🪑 Duduk'}
                    </span>
                    {nearbyAction.benchId?.startsWith('swing') && !isSittingRef.current && (
                      <span className="text-[9px] font-mono text-amber-200 bg-amber-950/75 px-1 py-0.5 rounded border border-amber-400/30">
                        -1 XP
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="bg-[#121e2c]/68 backdrop-blur-md border border-sky-400/45 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 shadow-lg flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/35 flex items-center justify-center text-sm sm:text-base shrink-0 shadow-sm">
                      {fishingPhase === 'pulling' ? '🐟' : fishingPhase === 'waiting' ? '💦' : '🎣'}
                    </div>
                    <div className="min-w-0">
                      <div className="text-[8.5px] font-bold tracking-wider uppercase text-sky-300 leading-none">
                        Sungai Refleksia
                      </div>
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-white truncate leading-tight mt-0.5">
                        {!isFishing
                          ? 'Spot Memancing • Sungai Refleksia'
                          : fishingPhase === 'casting'
                          ? 'Melempar Pancing...'
                          : fishingPhase === 'pulling'
                          ? 'Mengangkat Pancing...'
                          : 'Umpan Disambar! Angkat!'}
                      </h4>
                      <p className={`text-[9.5px] truncate leading-tight ${cafeToast ? 'text-sky-200 font-semibold' : 'text-slate-200/90'}`}>
                        {cafeToast || 'Santai memancing & dapatkan ikan unik'}
                      </p>
                    </div>
                  </div>
                  {!isFishing ? (
                    <button
                      onClick={handleStartFishing}
                      className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-sky-600/90 to-blue-600/90 hover:from-sky-500 hover:to-blue-500 text-white text-[10.5px] font-bold border border-sky-400/40 shadow-sm transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap"
                    >
                      <span>🎣 Pancing</span>
                      <span className="text-[9px] font-mono text-amber-300 bg-sky-950/75 px-1 py-0.5 rounded border border-sky-500/30">
                        -3 XP
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePullFishingRod}
                      disabled={fishingPhase === 'pulling'}
                      className={`py-1.5 px-2.5 rounded-lg text-white text-[10.5px] font-extrabold border shadow-md transition cursor-pointer active:scale-95 shrink-0 flex items-center gap-1 whitespace-nowrap ${
                        fishingPhase === 'pulling'
                          ? 'bg-amber-600/90 border-amber-300/60 opacity-90'
                          : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 border-emerald-300/70 animate-bounce shadow-emerald-500/30'
                      }`}
                    >
                      <span>
                        {fishingPhase === 'pulling' ? '🐟 Mengangkat...' : '🎣 Angkat Pancing!'}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </aside>
          ) : cafeToast ? (
            /* 5. FALLBACK SINGLE TOAST NOTIFICATION (Compact & Semi-Transparent) */
            <div
              role="status"
              className="pointer-events-auto bg-[#121e2c]/70 backdrop-blur-md text-emerald-200 font-bold text-[11px] sm:text-xs px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-lg animate-fade-in-down flex items-center gap-1.5 max-w-[310px] sm:max-w-[340px] text-center"
            >
              <span>✨</span>
              <span>{cafeToast}</span>
              <button
                onClick={() => showToast(null, 0)}
                className="ml-1 text-slate-300 hover:text-white text-[10px] cursor-pointer"
                title="Tutup"
              >
                ✕
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* LITERACY READING CORNER MODAL (-1 XP for Komik Cerita Rakyat 15 Pilihan, Majalah Seni Random, Koran Info Terbaru Refleksia City) */}
      {isLiteracyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
          onClick={() => setIsLiteracyModalOpen(false)}
        >
          <div
            className="bg-[#0f172a] border border-cyan-500/50 rounded-3xl w-full max-w-3xl p-4 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.92)] text-white relative overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/40 text-xl font-black">
                  📖
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Sudut Literasi Warga • Samping Balai Kota
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pilih 15 Komik Cerita Rakyat Nusantara, Majalah Seni Random, atau Koran Refleksia City • Biaya: 1 XP
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLiteracyModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  if (activeLiteracyDoc !== 'komik') {
                    const cost = 1;
                    if (studentPoints < cost) {
                      sounds.playClick();
                      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP.`, 3000);
                      return;
                    }
                    const success = onDeductPoints ? onDeductPoints(cost, 'Baca Komik Cerita Rakyat') : true;
                    if (!success) return;
                    sounds.playRewardXp();
                    showToast('📚 Membuka 15 Komik Cerita Rakyat Indonesia (-1 XP)', 3000);
                  } else {
                    sounds.playClick();
                  }
                  setActiveLiteracyDoc('komik');
                  setSelectedFolkloreComicId(null);
                  setIsSitting(true);
                  setSittingSeat('literacy_1_a');
                  if (playerRef.current) {
                    playerRef.current.wx = LITERACY_BENCHES[0].seats[0].wx;
                    playerRef.current.wy = LITERACY_BENCHES[0].seats[0].wy;
                    playerRef.current.targetWx = LITERACY_BENCHES[0].seats[0].wx;
                    playerRef.current.targetWy = LITERACY_BENCHES[0].seats[0].wy;
                    playerRef.current.isMoving = false;
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  activeLiteracyDoc === 'komik'
                    ? 'bg-cyan-600/30 border-cyan-400 text-white shadow-lg ring-2 ring-cyan-400/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-xl sm:text-2xl">📚</span>
                <span className="text-[11px] sm:text-xs font-extrabold">15 Komik Rakyat</span>
                <span className="text-[9px] text-amber-300 font-mono">-1 XP • Bergambar</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeLiteracyDoc !== 'majalah') {
                    const cost = 1;
                    if (studentPoints < cost) {
                      sounds.playClick();
                      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP.`, 3000);
                      return;
                    }
                    const success = onDeductPoints ? onDeductPoints(cost, 'Baca Majalah Seni Random') : true;
                    if (!success) return;
                    sounds.playRewardXp();
                    showToast('🎨 Membaca Edisi Random Majalah Seni & Desain (-1 XP)', 3000);
                  } else {
                    sounds.playClick();
                  }
                  // Pick a random magazine different from current if possible
                  setRandomMagazineIndex((prev) => {
                    if (ART_DESIGN_MAGAZINES.length <= 1) return 0;
                    let next = Math.floor(Math.random() * ART_DESIGN_MAGAZINES.length);
                    if (next === prev) next = (prev + 1) % ART_DESIGN_MAGAZINES.length;
                    return next;
                  });
                  setActiveLiteracyDoc('majalah');
                  setIsSitting(true);
                  setSittingSeat('literacy_1_a');
                  if (playerRef.current) {
                    playerRef.current.wx = LITERACY_BENCHES[0].seats[0].wx;
                    playerRef.current.wy = LITERACY_BENCHES[0].seats[0].wy;
                    playerRef.current.targetWx = LITERACY_BENCHES[0].seats[0].wx;
                    playerRef.current.targetWy = LITERACY_BENCHES[0].seats[0].wy;
                    playerRef.current.isMoving = false;
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  activeLiteracyDoc === 'majalah'
                    ? 'bg-pink-600/30 border-pink-400 text-white shadow-lg ring-2 ring-pink-400/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-xl sm:text-2xl">🎨</span>
                <span className="text-[11px] sm:text-xs font-extrabold">Majalah Seni</span>
                <span className="text-[9px] text-amber-300 font-mono">-1 XP • Random</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeLiteracyDoc !== 'koran') {
                    const cost = 1;
                    if (studentPoints < cost) {
                      sounds.playClick();
                      showToast(`⚠️ Saldo XP tidak cukup! Butuh ${cost} XP.`, 3000);
                      return;
                    }
                    const success = onDeductPoints ? onDeductPoints(cost, 'Baca Koran Refleksia City') : true;
                    if (!success) return;
                    sounds.playRewardXp();
                    showToast('🗞️ Membaca Koran Info Terbaru Refleksia City (-1 XP)', 3000);
                  } else {
                    sounds.playClick();
                  }
                  setActiveLiteracyDoc('koran');
                  setIsSitting(true);
                  setSittingSeat('literacy_1_a');
                  if (playerRef.current) {
                    playerRef.current.wx = LITERACY_BENCHES[0].seats[0].wx;
                    playerRef.current.wy = LITERACY_BENCHES[0].seats[0].wy;
                    playerRef.current.targetWx = LITERACY_BENCHES[0].seats[0].wx;
                    playerRef.current.targetWy = LITERACY_BENCHES[0].seats[0].wy;
                    playerRef.current.isMoving = false;
                  }
                }}
                className={`p-2.5 sm:p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-1 ${
                  activeLiteracyDoc === 'koran'
                    ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-lg ring-2 ring-emerald-400/30'
                    : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300'
                }`}
              >
                <span className="text-xl sm:text-2xl">🗞️</span>
                <span className="text-[11px] sm:text-xs font-extrabold">Koran Refleksia</span>
                <span className="text-[9px] text-amber-300 font-mono">-1 XP • Info Kota</span>
              </button>
            </div>

            {/* Reading Display Area */}
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm text-slate-200 leading-relaxed overflow-y-auto flex-1 min-h-[260px]">
              {!activeLiteracyDoc ? (
                <div className="text-center py-12 px-4 space-y-2">
                  <div className="text-4xl">📚🎨🗞️</div>
                  <div className="font-bold text-slate-200 text-sm">
                    Selamat Datang di Sudut Literasi Warga Refleksia City!
                  </div>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Silakan klik salah satu tombol di atas: <strong>15 Komik Rakyat</strong> (pilihan komik cerita rakyat Nusantara bergambar), <strong>Majalah Seni</strong> (edisi majalah seni visual acak bergambar), atau <strong>Koran Refleksia</strong> (kabar terbaru seputar Refleksia City).
                  </p>
                </div>
              ) : activeLiteracyDoc === 'komik' ? (
                (() => {
                  const selectedComic = INDONESIAN_FOLKLORE_COMICS.find((c) => c.id === selectedFolkloreComicId);
                  if (!selectedComic) {
                    return (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div>
                            <h4 className="font-black text-cyan-300 text-sm sm:text-base flex items-center gap-1.5">
                              <span>📚</span>
                              <span>Koleksi 15 Komik Cerita Rakyat Indonesia</span>
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Pilih salah satu dari 15 komik cerita rakyat Nusantara lengkap dengan ilustrasi gambar di bawah ini:
                            </p>
                          </div>
                          <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            15 Judul Lengkap
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          {INDONESIAN_FOLKLORE_COMICS.map((comic) => (
                            <button
                              key={comic.id}
                              type="button"
                              onClick={() => {
                                sounds.playClick();
                                setSelectedFolkloreComicId(comic.id);
                              }}
                              className="group text-left rounded-2xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-400/70 overflow-hidden transition-all flex flex-col shadow-md cursor-pointer"
                            >
                              <div className="relative h-28 w-full overflow-hidden bg-slate-900">
                                {renderFolkloreComicIllustration(comic.id)}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/85 text-cyan-300 font-mono text-[10px] font-black border border-cyan-500/40">
                                  Komik #{comic.number}
                                </div>
                                <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-slate-950/85 text-amber-300 text-[9px] font-bold border border-amber-400/30">
                                  📍 {comic.region}
                                </div>
                              </div>
                              <div className="p-2.5 flex-1 flex flex-col justify-between gap-1.5">
                                <div>
                                  <div className="font-extrabold text-xs text-white group-hover:text-cyan-300 transition line-clamp-1">
                                    {comic.title}
                                  </div>
                                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">
                                    {comic.summary}
                                  </p>
                                </div>
                                <div className="text-[10px] font-bold text-cyan-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                                  <span>Baca Komik Lengkap</span>
                                  <span>→</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  const curIdx = INDONESIAN_FOLKLORE_COMICS.findIndex((c) => c.id === selectedComic.id);
                  const prevComic = INDONESIAN_FOLKLORE_COMICS[(curIdx - 1 + INDONESIAN_FOLKLORE_COMICS.length) % INDONESIAN_FOLKLORE_COMICS.length];
                  const nextComic = INDONESIAN_FOLKLORE_COMICS[(curIdx + 1) % INDONESIAN_FOLKLORE_COMICS.length];

                  return (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedFolkloreComicId(null);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 cursor-pointer"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span>Daftar 15 Komik</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedFolkloreComicId(prevComic.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
                          >
                            ← #{prevComic.number}
                          </button>
                          <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                            Komik #{selectedComic.number} / 15
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedFolkloreComicId(nextComic.id);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold cursor-pointer"
                          >
                            #{nextComic.number} →
                          </button>
                        </div>
                      </div>

                      {/* Main Comic Cover Banner with Illustration & Speech Bubble */}
                      <div className="rounded-2xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-xl">
                        <div className="relative h-44 sm:h-52 w-full">
                          {renderFolkloreComicIllustration(selectedComic.id)}
                          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                            <span className="px-2.5 py-1 rounded-full bg-slate-950/90 text-cyan-300 font-mono text-[10px] font-black border border-cyan-400/50">
                              KOMIK NUSANTARA #{selectedComic.number}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-slate-950 font-extrabold text-[10px]">
                              📍 {selectedComic.region}
                            </span>
                          </div>
                          {/* Comic Speech Bubble */}
                          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:max-w-md bg-white/95 text-slate-900 px-3.5 py-2 rounded-2xl shadow-lg border-2 border-slate-900">
                            <div className="text-[11px] sm:text-xs font-black italic leading-snug">
                              💬 {selectedComic.speechBubble}
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-t border-slate-800">
                          <h4 className="text-base sm:text-lg font-black text-white">
                            {selectedComic.title}
                          </h4>
                          <p className="text-xs text-slate-300 mt-1">{selectedComic.summary}</p>
                        </div>
                      </div>

                      {/* 4 Comic Strip Story Panels */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {selectedComic.panels.map((p) => (
                          <div
                            key={p.panelNo}
                            className="p-3 rounded-2xl bg-slate-950/90 border-2 border-slate-800 flex flex-col justify-between gap-2"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black border border-cyan-500/30">
                                  PANEL {p.panelNo}
                                </span>
                                <span className="text-[11px] font-extrabold text-amber-300">
                                  {p.caption}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-relaxed">
                                {p.sceneDesc}
                              </p>
                            </div>
                            <div className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-[11px] font-bold text-cyan-200 italic">
                              💬 {p.dialogue}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Moral Value & DKV Visual Note */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                          <div className="text-[11px] font-black text-emerald-300 uppercase tracking-wider mb-1">
                            🌟 Pesan Moral Cerita Rakyat
                          </div>
                          <p className="text-xs text-emerald-100/90">{selectedComic.moralValue}</p>
                        </div>
                        <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/40">
                          <div className="text-[11px] font-black text-amber-300 uppercase tracking-wider mb-1">
                            🎨 Catatan Visual & DKV
                          </div>
                          <p className="text-xs text-amber-100/90">{selectedComic.dkvInsight}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : activeLiteracyDoc === 'majalah' ? (
                (() => {
                  const mag = ART_DESIGN_MAGAZINES[randomMagazineIndex % ART_DESIGN_MAGAZINES.length] || ART_DESIGN_MAGAZINES[0];
                  return (
                    <div className="space-y-3.5 animate-fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/40">
                            {mag.issueNumber} • {mag.category}
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-white mt-1">
                            {mag.title}
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setRandomMagazineIndex((prev) => {
                              let next = Math.floor(Math.random() * ART_DESIGN_MAGAZINES.length);
                              if (next === prev) next = (prev + 1) % ART_DESIGN_MAGAZINES.length;
                              return next;
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                          <span>Acak Majalah Lainnya</span>
                        </button>
                      </div>

                      {/* Visual Magazine Cover & Spread Illustration */}
                      <div className="rounded-2xl overflow-hidden border border-pink-500/40 bg-slate-950 shadow-xl">
                        <div className="relative h-44 sm:h-52 w-full">
                          {renderArtMagazineIllustration(mag.id)}
                          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/85 text-pink-300 font-mono text-[10px] font-black border border-pink-400/40">
                            MAJALAH SENI VISUAL REFLEKSIA
                          </div>
                          <div className="absolute bottom-3 left-3 right-3 bg-slate-950/90 backdrop-blur-sm p-3 rounded-xl border border-white/15">
                            <div className="text-xs sm:text-sm font-black text-white">
                              {mag.subtitle}
                            </div>
                            <div className="text-[10px] text-pink-300 font-semibold mt-0.5">
                              Oleh: {mag.editorName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Color Palette Swatches */}
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                          🎨 Palet Warna Edisi Ini (Color Swatches)
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {mag.palette.map((sw, i) => (
                            <div key={i} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800">
                              <span
                                className="w-6 h-6 rounded-lg shrink-0 border border-white/20 shadow-inner"
                                style={{ backgroundColor: sw.hex }}
                              />
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-white truncate">{sw.name}</div>
                                <div className="text-[9px] font-mono text-slate-400">{sw.hex}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Magazine Articles */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {mag.highlights.map((hl, i) => (
                          <div key={i} className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                            <span className="text-[9px] font-mono font-black text-pink-400 uppercase tracking-wider">
                              {hl.rubric}
                            </span>
                            <h5 className="text-xs font-extrabold text-white">{hl.heading}</h5>
                            <p className="text-[11px] text-slate-300 leading-relaxed">{hl.body}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-2xl bg-pink-950/30 border border-pink-500/30 text-xs text-pink-200 italic">
                        {mag.leadQuote}
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* KORAN REFLEKSIA CITY: INFO TERBARU TENTANG REFLEKSIA CITY */
                <div className="space-y-3.5 animate-fade-in">
                  {/* Newspaper Masthead */}
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/40 text-center space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-300 border-b border-emerald-500/30 pb-1">
                      <span>EDISI TERBARU • KOTA REFLEKSIA</span>
                      <span>HARIAN WARGA & PELAJAR DKV</span>
                      <span>SMKN 2 GORONTALO</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black tracking-tight text-white font-serif uppercase">
                      🗞️ SUARA REFLEKSIA CITY
                    </h4>
                    <p className="text-[11px] text-emerald-200 font-medium">
                      Informasi Terkini Pembangunan Kota, Aktivitas Literasi, Renovasi Lab DKV & Pengumuman Dewan Guru
                    </p>
                  </div>

                  {/* Visual Newspaper Headline Illustration + Lead Story */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 items-center">
                    <div className="sm:col-span-2 h-36 rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900">
                      <svg viewBox="0 0 280 170" className="w-full h-full">
                        <rect width="280" height="170" fill="#0f172a" />
                        {/* City Skyline & Lab DKV Atom Icon */}
                        <rect x="24" y="68" width="52" height="82" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                        <rect x="88" y="52" width="64" height="98" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                        <rect x="164" y="64" width="90" height="86" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
                        {/* Moving Atom symbol above Lab DKV in illustration */}
                        <ellipse cx="120" cy="28" rx="22" ry="8" fill="none" stroke="#38bdf8" strokeWidth="1.8" transform="rotate(-25 120 28)" />
                        <ellipse cx="120" cy="28" rx="22" ry="8" fill="none" stroke="#fde047" strokeWidth="1.8" transform="rotate(25 120 28)" />
                        <circle cx="120" cy="28" r="4" fill="#ffffff" />
                        <rect x="98" y="64" width="44" height="12" rx="3" fill="#090d16" stroke="#38bdf8" strokeWidth="1" />
                        <text x="120" y="73" fill="#38bdf8" fontSize="7" fontWeight="900" textAnchor="middle">LAB DKV</text>
                        <rect x="0" y="148" width="280" height="22" fill="#065f46" />
                      </svg>
                    </div>
                    <div className="sm:col-span-3 space-y-1.5">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-black border border-emerald-500/30">
                        BERITA UTAMA REFLEKSIA CITY
                      </span>
                      <h5 className="text-sm sm:text-base font-black text-white leading-snug">
                        Wajah Baru Gedung Lab DKV Minimalis Modern dengan Ikon Logo Atom Berputar di Puncak Atap!
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Pemerintah Kota Refleksia resmi merampungkan renovasi gedung <strong>Lab DKV</strong> dengan gaya arsitektur studio kreatif minimalis modern berlapis kaca tirai dan instalasi <strong>Logo Atom Bergerak</strong> di bagian atas gedung. Seluruh papan nama utama kota—mulai dari <strong>ON AIR</strong> di Studio, <strong>POS KILAT</strong>, <strong>LAB DKV</strong>, hingga <strong>POHON JURNAL</strong>—kini tampil makin presisi dan rapi.
                      </p>
                    </div>
                  </div>

                  {/* Latest Teacher Announcement Live Feed */}
                  <div className="p-3 rounded-2xl bg-amber-950/35 border border-amber-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1">
                        <Megaphone className="w-3.5 h-3.5" /> Kutipan Papan Pengumuman Balai Kota Terbaru
                      </span>
                      <span className="text-[10px] font-mono text-amber-200/80">
                        {teacherAnnouncements[0]?.createdAt || 'Hari Ini'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-100">
                      “{teacherAnnouncements[0]?.content || 'Selamat datang di Kota Refleksia! Mari aktif menulis refleksi, menjaga keasrian kota, dan berlatih kuis di Lab DKV.'}”
                    </p>
                    <div className="text-[10px] text-amber-300/90 font-bold">
                      — {teacherAnnouncements[0]?.teacherName || 'Dewan Guru DKV'}
                    </div>
                  </div>

                  {/* 4 Columns of Latest Refleksia City Updates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                      <div className="text-xs font-extrabold text-cyan-300">
                        🌳 Sudut Literasi & Taman Rumput Samping Balai Kota
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Sudut Literasi Warga bersama Ibu Patra kini hadir di hamparan rumput hijau sebelah timur Balai Kota, dilengkapi bangku taman yang nyaman serta koleksi 15 Komik Cerita Rakyat Nusantara.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                      <div className="text-xs font-extrabold text-rose-300">
                        📮 Kotak Surat Kecil di Setiap Wisma Siswa & Guru
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Warga kini dapat mengirimkan masukan, ide kreatif, dan saran langsung melalui Kotak Surat Kecil di depan Wisma Siswa 1–4 maupun Wisma Guru 1–2 yang otomatis tersinkron ke Google Spreadsheet. ({wismaSuggestions.length} saran tercatat).
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                      <div className="text-xs font-extrabold text-amber-300">
                        🔥 Kehangatan Api Unggun & Bangku Taman Rumput
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Area Api Unggun beserta bangku kayu hangat di atas hamparan rumput barat daya menjadi titik favorit siswa untuk duduk berdiskusi santai sambil menikmati suasana sore dan malam Kota Refleksia.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-1">
                      <div className="text-xs font-extrabold text-emerald-300">
                        📌 Pohon Beringin Jurnal & Masjid Al-Hikmah
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Tercatat sudah <strong>{stickyNotes.length} catatan refleksi warga</strong> tertempel di Pohon Jurnal belakang Balai Kota, sementara Masjid Al-Hikmah di hulu sungai ramai dikunjungi untuk belajar Iqro (Jilid 1–6) dan Tuntunan Sholat.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-3.5 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                💡 Klik tab bacaan di atas untuk berpindah antara Komik, Majalah Seni, dan Koran Kota.
              </span>
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

      {/* TOWN RULES & ACTIVITIES GUIDE MODAL (Gapura Awal Masuk) */}
      {isTownRulesModalOpen && (
        <TownRulesModal
          onClose={() => setIsTownRulesModalOpen(false)}
          student={
            studentId
              ? ({
                  id: studentId,
                  name: studentName,
                  gender: studentGender,
                  isTeacher,
                  points: studentPoints,
                  className: isTeacher ? 'Guru DKV' : 'Siswa DKV',
                  studentNumber: studentId,
                  password: '',
                  badges: [],
                  lastLogin: '',
                  streakDays: 1,
                } as Student)
              : null
          }
        />
      )}

      {/* JURNAL HARIAN POHON BERINGIN MODAL (Belakang Balai Kota) */}
      {isJurnalModalOpen && (
        <JurnalHarianModal
          onClose={() => setIsJurnalModalOpen(false)}
          student={
            studentId
              ? ({
                  id: studentId,
                  name: studentName,
                  gender: studentGender,
                  isTeacher,
                  points: studentPoints,
                  className: isTeacher ? 'Guru DKV' : 'X DKV 2',
                  studentNumber: studentId,
                  password: '',
                  badges: [],
                  lastLogin: '',
                  streakDays: 1,
                } as Student)
              : null
          }
          onAddXp={onAddXp}
          onNoteAdded={(newNote) => {
            setStickyNotes((prev) => [newNote, ...prev]);
          }}
        />
      )}

      {/* PAPAN PENGUMUMAN GURU MODAL (Di Dekat Balai Kota - Diambil dari Data Pesan Sistem) */}
      {isAnnouncementModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setIsAnnouncementModalOpen(false)}
        >
          <div
            className="bg-[#121e2c] border border-amber-400/50 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white relative overflow-hidden max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-400/40 text-xl font-black">
                  <Megaphone className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>Papan Pengumuman Balai Kota</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                      Info Resmi Guru
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Menampilkan pengumuman & arahan terbaru dari Bapak/Ibu Guru (data pesan sistem)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Tambah Pengumuman Baru (Khusus Guru) */}
            {isTeacher && !isGuest && (
              <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/35 shrink-0">
                <div className="text-xs font-extrabold text-amber-300 mb-2 flex items-center gap-1.5">
                  <span>✍️</span>
                  <span>Tulis Pengumuman Guru Baru (Tersimpan ke Pesan Sistem & Spreadsheet)</span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newAnnouncementText}
                    onChange={(e) => setNewAnnouncementText(e.target.value)}
                    placeholder="Tulis pengumuman untuk seluruh warga siswa DKV..."
                    maxLength={260}
                    className="flex-1 bg-slate-900/90 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="button"
                    disabled={isPostingAnnouncement || !newAnnouncementText.trim()}
                    onClick={async () => {
                      if (!newAnnouncementText.trim()) return;
                      setIsPostingAnnouncement(true);
                      try {
                        await StorageService.postTeacherAnnouncement({
                          teacherId: studentId || 'teacher-dkv',
                          teacherName: studentName || 'Guru DKV',
                          subject: 'Pengumuman Guru DKV',
                          content: newAnnouncementText.trim(),
                        });
                        setNewAnnouncementText('');
                        setTeacherAnnouncements(StorageService.getTeacherAnnouncements());
                        sounds.playRewardXp();
                        showToast('📢 Pengumuman Guru berhasil ditempel di Papan Pengumuman Balai Kota!', 3200);
                      } finally {
                        setIsPostingAnnouncement(false);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isPostingAnnouncement ? 'Menempel...' : 'Tempel Pengumuman'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Daftar Pengumuman Guru dari Data Pesan Sistem */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
              {teacherAnnouncements.map((ann, idx) => (
                <div
                  key={ann.id}
                  className={`p-3.5 rounded-2xl border transition ${
                    idx === 0
                      ? 'bg-gradient-to-br from-amber-950/45 via-slate-900/95 to-slate-900 border-amber-400/50 shadow-md'
                      : 'bg-slate-900/85 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-400/35 flex items-center justify-center text-sm shrink-0">
                        {ann.priority === 'misi' ? '🎯' : ann.priority === 'penting' ? '📢' : '👨‍🏫'}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-amber-300 truncate">
                            {ann.teacherName}
                          </span>
                          {idx === 0 && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                              TERBARU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ann.subject || 'Dewan Guru SMKN 2 Gorontalo'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/60 shrink-0">
                      {ann.createdAt}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-100 leading-relaxed pl-9">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
              <span className="text-[10px] text-slate-400">
                📌 Sumber: Data Pesan Sistem & Arahan Guru Kota Refleksia
              </span>
              <button
                type="button"
                onClick={() => setIsAnnouncementModalOpen(false)}
                className="py-2 px-5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
              >
                Tutup Papan Pengumuman
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KOTAK SURAT KECIL MASUKAN & SARAN MODAL (Di Setiap Wisma Siswa & Rumah Dinas Guru - Tersimpan di Google Spreadsheet) */}
      {activeWismaMailbox && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in"
          onClick={() => setActiveWismaMailbox(null)}
        >
          <div
            className="bg-[#121e2c] border border-sky-400/50 rounded-3xl w-full max-w-xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.9)] text-white relative overflow-hidden max-h-[88dvh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 mb-3.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 text-sky-300 flex items-center justify-center border border-sky-400/40 text-xl font-black">
                  <Mail className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 flex-wrap">
                    <span>📮 Kotak Surat Kecil • {activeWismaMailbox.name}</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Kotak masukan & saran Siswa/Guru • Otomatis tersimpan ke Google Spreadsheet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveWismaMailbox(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pilihan Cepat Pindah Kotak Surat Antar-Wisma */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0">
              {HOUSING_UNITS.map((unit) => (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => setActiveWismaMailbox(unit)}
                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold border whitespace-nowrap transition cursor-pointer ${
                    activeWismaMailbox.id === unit.id
                      ? 'bg-sky-600/35 border-sky-400 text-white shadow'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  📮 {unit.shortBadge}
                </button>
              ))}
            </div>

            {/* Form Input Masukan & Saran Siswa / Guru */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3.5 mb-3.5 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-extrabold text-sky-300">
                  ✍️ Kirim Masukan & Saran dari {isTeacher ? 'Guru' : 'Siswa'} ({studentName})
                </span>
                <select
                  value={suggestionCategory}
                  onChange={(e) => setSuggestionCategory(e.target.value as WismaSuggestion['category'])}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold text-amber-300 outline-none cursor-pointer"
                >
                  <option value="Pembelajaran & Materi">📚 Pembelajaran & Materi</option>
                  <option value="Fasilitas Sekolah & Lab">🖥️ Fasilitas Sekolah & Lab</option>
                  <option value="Fitur Kota Refleksia">🏛️ Fitur Kota Refleksia</option>
                  <option value="Ide & Apresiasi">💡 Ide & Apresiasi</option>
                </select>
              </div>

              <textarea
                value={suggestionText}
                onChange={(e) => setSuggestionText(e.target.value)}
                rows={3}
                maxLength={350}
                placeholder={`Tulis masukan, ide, atau saran konstruktif di Kotak Surat ${activeWismaMailbox.name}...`}
                className="w-full bg-slate-950/90 border border-slate-700/80 focus:border-sky-400 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="text-[10px] text-emerald-300/90 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Tersinkron ke Sheet Kotak_Saran_Wisma & Pesan_Guru di Spreadsheet</span>
                </span>
                <button
                  type="button"
                  disabled={isSubmittingSuggestion || !suggestionText.trim() || isGuest}
                  onClick={async () => {
                    if (!suggestionText.trim()) return;
                    if (isGuest) {
                      showToast('📸 Mode Tamu hanya melihat-lihat (View Only).', 3000);
                      return;
                    }
                    setIsSubmittingSuggestion(true);
                    try {
                      const nowStr = new Date().toLocaleString('id-ID', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      });
                      const newSug: WismaSuggestion = {
                        id: `wsug-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
                        wismaId: activeWismaMailbox.id,
                        wismaName: activeWismaMailbox.name,
                        senderId: studentId || 'warga-dkv',
                        senderName: studentName || 'Warga Refleksia',
                        senderRole: isTeacher ? 'guru' : 'siswa',
                        className: isTeacher ? 'Guru DKV' : 'Siswa DKV',
                        category: suggestionCategory,
                        content: suggestionText.trim(),
                        createdAt: nowStr,
                        timestamp: Date.now(),
                      };
                      await StorageService.saveWismaSuggestion(newSug);
                      setWismaSuggestions(StorageService.getWismaSuggestions());
                      setSuggestionText('');
                      sounds.playRewardXp();
                      if (onAddXp) {
                        onAddXp(1, `Masukan Kotak Surat ${activeWismaMailbox.shortBadge}`);
                      }
                      showToast(
                        `📮 Masukan & saran di ${activeWismaMailbox.name} terkirim ke Google Spreadsheet! (+1 XP)`,
                        3600
                      );
                    } finally {
                      setIsSubmittingSuggestion(false);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingSuggestion ? 'Mengirim...' : 'Kirim ke Spreadsheet (+1 XP)'}</span>
                </button>
              </div>
            </div>

            {/* Riwayat Masukan & Saran Terbaru */}
            <div className="text-[11px] font-bold text-slate-300 mb-2 flex items-center justify-between shrink-0">
              <span>📬 Daftar Masukan & Saran Warga ({wismaSuggestions.length})</span>
              <span className="text-[10px] text-sky-300 font-normal">Semua Wisma & Rumah Dinas</span>
            </div>
            <div className="space-y-2 overflow-y-auto pr-1 flex-1">
              {wismaSuggestions.map((sug) => (
                <div
                  key={sug.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-400/30">
                        {sug.wismaName}
                      </span>
                      <span className="text-xs font-extrabold text-white">{sug.senderName}</span>
                      <span
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                          sug.senderRole === 'guru'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                        }`}
                      >
                        {sug.senderRole === 'guru' ? '👨‍🏫 Guru' : '🎒 Siswa'}
                      </span>
                      <span className="text-[9.5px] text-amber-200/90 bg-slate-800 px-1.5 py-0.5 rounded">
                        {sug.category}
                      </span>
                    </div>
                    <span className="text-[9.5px] font-mono text-slate-400 shrink-0">{sug.createdAt}</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed mt-0.5">{sug.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* MINIMALIST 5-REACTION CIRCULAR / RADIAL EMOTE PICKER */}
      {/* 5 Pilihan Melingkar: Joget, Jempol, Suka, Tertawa, Lambai */}
      {/* Sempurna Pentagonal (72 deg), tombol berjarak 84px simetris, pusat avatar terbuka bebas tanpa bertumpukan */}
      {/* ============================================================= */}
      {isEmoteMenuOpen && (
        <div
          className="absolute z-40 pointer-events-none select-none transition-all duration-150"
          style={{
            left: `${Math.max(100, Math.min((containerRef.current?.clientWidth || 800) - 100, playerScreenPos.x))}px`,
            top: `${Math.max(100, Math.min((containerRef.current?.clientHeight || 600) - 100, playerScreenPos.y))}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Circular Wheel: w-60 h-60 (240px), Pusat Avatar bebas tidak tertutup */}
          <div className="relative w-60 h-60 flex items-center justify-center pointer-events-none">
            {/* Subtle dashed orbit ring (diameter 144px / radius 72px) */}
            <div className="absolute w-[144px] h-[144px] rounded-full border border-dashed border-sky-400/25 pointer-events-none" />

            {/* 1. TOP (-90deg): 🎵 JOGET */}
            <div
              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center"
              style={{ left: '50%', top: 'calc(50% - 72px)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('dance');
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 border border-purple-200/90 shadow-lg shadow-purple-950/60 flex items-center justify-center text-xl transition-transform hover:scale-115 active:scale-90 cursor-pointer animate-pulse"
                title="Joget (Avatar otomatis berjoget musik)"
              >
                <span className="drop-shadow">🎵</span>
              </button>
              {/* Outward text label placed above the button */}
              <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-purple-400/50 text-[9px] font-bold text-purple-200 whitespace-nowrap shadow-md pointer-events-none">
                Joget
              </span>
            </div>

            {/* 2. TOP-RIGHT (-18deg): 👍 JEMPOL */}
            <div
              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center"
              style={{ left: 'calc(50% + 68px)', top: 'calc(50% - 22px)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('thumbsup');
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 border border-emerald-200/95 shadow-lg shadow-emerald-950/60 flex items-center justify-center text-xl transition-transform hover:scale-115 active:scale-90 cursor-pointer"
                title="Jempol Mantap (Reaksi Jempol + Gesture Tangan)"
              >
                <span className="drop-shadow">👍</span>
              </button>
              {/* Outward text label placed to the right */}
              <span className="absolute left-full ml-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-emerald-400/50 text-[9px] font-bold text-emerald-200 whitespace-nowrap shadow-md pointer-events-none">
                Jempol
              </span>
            </div>

            {/* 3. BOTTOM-RIGHT (+54deg): ❤️ SUKA */}
            <div
              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center"
              style={{ left: 'calc(50% + 42px)', top: 'calc(50% + 58px)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('love');
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 via-pink-600 to-rose-400 hover:from-rose-500 hover:to-pink-400 border border-rose-200/90 shadow-lg shadow-rose-950/60 flex items-center justify-center text-xl transition-transform hover:scale-115 active:scale-90 cursor-pointer"
                title="Suka (Apresiasi cinta & kasih sayang)"
              >
                <span className="drop-shadow">❤️</span>
              </button>
              {/* Outward text label placed below the button */}
              <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-rose-400/50 text-[9px] font-bold text-rose-200 whitespace-nowrap shadow-md pointer-events-none">
                Suka
              </span>
            </div>

            {/* 4. BOTTOM-LEFT (+126deg): 😂 TERTAWA */}
            <div
              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center"
              style={{ left: 'calc(50% - 42px)', top: 'calc(50% + 58px)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('laugh');
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 hover:from-amber-400 hover:to-yellow-300 border border-amber-200/90 shadow-lg shadow-amber-950/60 flex items-center justify-center text-xl transition-transform hover:scale-115 active:scale-90 cursor-pointer"
                title="Tertawa (Gembira & riang bersama warga)"
              >
                <span className="drop-shadow">😂</span>
              </button>
              {/* Outward text label placed below the button */}
              <span className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-amber-400/50 text-[9px] font-bold text-amber-200 whitespace-nowrap shadow-md pointer-events-none">
                Tertawa
              </span>
            </div>

            {/* 5. TOP-LEFT (+198deg / -162deg): 👋 LAMBAI */}
            <div
              className="absolute w-10 h-10 -translate-x-1/2 -translate-y-1/2 pointer-events-auto flex items-center justify-center"
              style={{ left: 'calc(50% - 68px)', top: 'calc(50% - 22px)' }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerEmote('wave');
                }}
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 via-blue-600 to-sky-400 hover:from-sky-400 hover:to-blue-500 border border-sky-200/90 shadow-lg shadow-sky-950/60 flex items-center justify-center text-xl transition-transform hover:scale-115 active:scale-90 cursor-pointer"
                title="Lambai (Menyapa ramah)"
              >
                <span className="drop-shadow">👋</span>
              </button>
              {/* Outward text label placed to the left */}
              <span className="absolute right-full mr-1.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-slate-900/95 border border-sky-400/50 text-[9px] font-bold text-sky-200 whitespace-nowrap shadow-md pointer-events-none">
                Lambai
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
});
