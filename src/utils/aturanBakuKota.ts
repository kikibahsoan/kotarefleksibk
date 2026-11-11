import { BuildingId } from '../types/index.ts';

/**
 * Representasi terstruktur Aturan Baku Pengembangan Kota Refleksia (Pasal A s.d. H)
 * Digunakan untuk validasi gedung baru, batas hadiah XP harian, moderasi kata kasar,
 * kontrol guru (kunci gedung/obrolan), dan sinkronisasi sheet Data_Bangunan_Kota.
 */
export interface BuildingGovernanceSpec {
  id: BuildingId;
  name: string;
  zone: 'Kota Lama' | 'Pusat Kota (Seberang Sungai)';
  icon: string;
  wx: number;
  wy: number;
  tileFootprint: number; // jumlah kotak zona
  category: string;
  shortDescription: string;
  learningObjective: string;
  capacity: number;
  openingHours: string;
  xpRewardPerActivity: number;
  dailyXpCap: number;
  defaultOpen: boolean;
}

export const CITY_BUILDINGS_GOVERNANCE: Record<BuildingId, BuildingGovernanceSpec> = {
  // === 10 BANGUNAN KOTA LAMA (DIPERTAHANKAN 100%) ===
  balai_kota: {
    id: 'balai_kota',
    name: 'Balai Kota',
    zone: 'Kota Lama',
    icon: '🏛️',
    wx: 0,
    wy: -4.2,
    tileFootprint: 1,
    category: 'Pemerintahan & Misi Kota',
    shortDescription: 'Pusat informasi misi harian, pengumuman sekolah, dan Leaderboard Mingguan.',
    learningObjective: 'Memahami target capaian pembelajaran mingguan dan menyelesaikan misi warga secara tertib.',
    capacity: 40,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 15,
    defaultOpen: true,
  },
  menara_mentor: {
    id: 'menara_mentor',
    name: 'Studio ON AIR',
    zone: 'Kota Lama',
    icon: '🎙️',
    wx: 4.2,
    wy: 0,
    tileFootprint: 1,
    category: 'Podcast & Konsultasi AI Mentor',
    shortDescription: 'Studio siaran podcast interaktif bersama Host AI Mentor dan Radio 99.9 FM.',
    learningObjective: 'Mengartikulasikan pemahaman materi secara lisan/tertulis melalui dialog reflektif.',
    capacity: 25,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 5,
    dailyXpCap: 15,
    defaultOpen: true,
  },
  perpustakaan: {
    id: 'perpustakaan',
    name: 'Perpustakaan Kampus',
    zone: 'Kota Lama',
    icon: '📚',
    wx: -4.2,
    wy: 0,
    tileFootprint: 1,
    category: 'Literasi & Modul Ajar',
    shortDescription: 'Gedung bacaan 5 buku utama, modul Bank Materi Guru, dan penulisan Jurnal 4F.',
    learningObjective: 'Membaca kritis materi kejuruan DKV/Informatika dan menyusun rangkuman 4F.',
    capacity: 36,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 15,
    defaultOpen: true,
  },
  pasar_prestasi: {
    id: 'pasar_prestasi',
    name: 'Pasar Prestasi',
    zone: 'Kota Lama',
    icon: '🏆',
    wx: -2.8,
    wy: 2.8,
    tileFootprint: 1,
    category: 'Apresiasi & Peringkat',
    shortDescription: 'Papan peringkat siswa teraktif, lencana kompetensi, dan profil Dewan Guru.',
    learningObjective: 'Membangun motivasi belajar sehat dan mengapresiasi ketekunan rekan sekelas.',
    capacity: 30,
    openingHours: '24 Jam',
    xpRewardPerActivity: 2,
    dailyXpCap: 6,
    defaultOpen: true,
  },
  kantor_pos: {
    id: 'kantor_pos',
    name: 'Kantor Pos Kilat',
    zone: 'Kota Lama',
    icon: '📮',
    wx: 2.8,
    wy: -2.8,
    tileFootprint: 1,
    category: 'Komunikasi Guru & Siswa',
    shortDescription: 'Layanan pengiriman surat pertanyaan materi dan konsultasi langsung ke guru.',
    learningObjective: 'Menyampaikan pertanyaan akademik dengan bahasa yang santun, jelas, dan terstruktur.',
    capacity: 20,
    openingHours: '06.00 - 21.00 WITA',
    xpRewardPerActivity: 2,
    dailyXpCap: 6,
    defaultOpen: true,
  },
  taman_refleksi: {
    id: 'taman_refleksi',
    name: 'Pusat Refleksi',
    zone: 'Kota Lama',
    icon: '🌍',
    wx: -2.8,
    wy: -2.8,
    tileFootprint: 1,
    category: 'Evaluasi Diri & Jurnal',
    shortDescription: 'Ruang tenang untuk menulis refleksi pemahaman materi dan meraih +3 XP.',
    learningObjective: 'Mengevaluasi bagian materi yang sudah dikuasai, kendala belajar, dan rencana tindak lanjut.',
    capacity: 35,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 12,
    defaultOpen: true,
  },
  bengkel_latihan: {
    id: 'bengkel_latihan',
    name: 'Lab DKV',
    zone: 'Kota Lama',
    icon: '⚛️',
    wx: 2.8,
    wy: 2.8,
    tileFootprint: 1,
    category: 'Praktik & Evaluasi Berjenjang',
    shortDescription: 'Laboratorium kuis berjenjang 5 tingkat untuk menguji ketuntasan materi.',
    learningObjective: 'Menguji penguasaan konsep dasar hingga analisis desain melalui latihan soal terstruktur.',
    capacity: 32,
    openingHours: '07.00 - 21.00 WITA',
    xpRewardPerActivity: 5,
    dailyXpCap: 15,
    defaultOpen: true,
  },
  masjid: {
    id: 'masjid',
    name: 'Masjid Al-Hikmah',
    zone: 'Kota Lama',
    icon: '🕌',
    wx: 5.45,
    wy: -4.85,
    tileFootprint: 1,
    category: 'Karakter & Spiritual',
    shortDescription: 'Pusat belajar Iqro Jilid 1-6 bersuara tajwid serta panduan wudhu dan sholat.',
    learningObjective: 'Memperkuat karakter religius, adab menuntut ilmu, dan ketenangan batin.',
    capacity: 50,
    openingHours: '04.30 - 22.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  bank_materi: {
    id: 'bank_materi',
    name: 'Bank Materi Guru',
    zone: 'Kota Lama',
    icon: '🏦',
    wx: -5.35,
    wy: -4.85,
    tileFootprint: 1,
    category: 'Khusus Guru • Kurikulum',
    shortDescription: 'Gedung khusus Guru untuk menginput TP, Materi Esensial, dan distribusi ke seluruh kota.',
    learningObjective: 'Menyusun dan mendistribusikan bahan ajar terpadu ke seluruh fasilitas Kota Refleksia.',
    capacity: 15,
    openingHours: '24 Jam (Khusus Guru)',
    xpRewardPerActivity: 0,
    dailyXpCap: 0,
    defaultOpen: true,
  },
  monumen_warga: {
    id: 'monumen_warga',
    name: 'Air Mancur Warga',
    zone: 'Kota Lama',
    icon: '⛲',
    wx: 0,
    wy: 0,
    tileFootprint: 1,
    category: 'Interaksi Sosial Kelas',
    shortDescription: 'Titik temu alun-alun pusat untuk menyapa dan berdiskusi santun bersama warga.',
    learningObjective: 'Berlatih komunikasi publik yang sopan, positif, dan saling mendukung antarwarga.',
    capacity: 60,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 1,
    dailyXpCap: 5,
    defaultOpen: true,
  },

  // === 6 BANGUNAN BARU DI PUSAT KOTA SEBERANG SUNGAI (8 KOTAK ZONA BARU) ===
  pencakar_langit: {
    id: 'pencakar_langit',
    name: 'Gedung Pencakar Langit',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '🏙️',
    wx: 10.5,
    wy: -3.2,
    tileFootprint: 2, // 2 kotak: gedung tinggi + plaza karier
    category: 'Tantangan Karier & Cita-cita',
    shortDescription: 'Menara kembar kaca modern & Plaza Karier untuk merancang masa depan dan profesi impian.',
    learningObjective: 'Mengenal dunia industri kreatif/teknologi, menyusun portofolio karier, dan memetakan cita-cita pasca-SMK.',
    capacity: 45,
    openingHours: '06.30 - 21.30 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  museum_seni: {
    id: 'museum_seni',
    name: 'Museum Seni',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '🎨',
    wx: 13.0,
    wy: -3.2,
    tileFootprint: 1,
    category: 'Karya & Kreativitas',
    shortDescription: 'Galeri pameran karya visual, poster, fotografi, dan instalasi kreatif warga Kota Refleksia.',
    learningObjective: 'Mengapresiasi nilai estetika karya seni/desain serta mempresentasikan proses kreatif di balik karya.',
    capacity: 35,
    openingHours: '07.00 - 21.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  panggung_kota: {
    id: 'panggung_kota',
    name: 'Panggung Kota',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '🎭',
    wx: 13.0,
    wy: 0.0,
    tileFootprint: 1,
    category: 'Presentasi & Pengumuman Kelas',
    shortDescription: 'Panggung terbuka berkapasitas besar dengan kursi penonton untuk presentasi karya & pengumuman.',
    learningObjective: 'Melatih keberanian berbicara di depan umum (public speaking), pitch ide desain, dan kolaborasi kelas.',
    capacity: 60,
    openingHours: '06.30 - 22.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  mall_kota: {
    id: 'mall_kota',
    name: 'Mall Pusat Kota',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '🛍️',
    wx: 10.5,
    wy: 2.8,
    tileFootprint: 1,
    category: 'Belanja Atribut & Literasi Finansial',
    shortDescription: 'Pusat perbelanjaan modern untuk menukar XP dengan atribut kreatif serta belajar manajemen anggaran.',
    learningObjective: 'Memahami skala prioritas kebutuhan vs keinginan, literasi finansial kreatif, dan penghargaan atas usaha belajar.',
    capacity: 50,
    openingHours: '08.00 - 21.30 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  latihan_tentara: {
    id: 'latihan_tentara',
    name: 'Kemah Latihan Tentara',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '⛺',
    wx: 10.5,
    wy: 5.2,
    tileFootprint: 1,
    category: 'Disiplin, Tanggung Jawab & Kerja Tim',
    shortDescription: 'Lapangan latihan ketangkasan, tenda barak taktis, dan tiang bendera untuk melatih karakter tangguh.',
    learningObjective: 'Menumbuhkan kedisiplinan waktu, tanggung jawab terhadap tugas, kepemimpinan, dan kekompakan tim.',
    capacity: 40,
    openingHours: '05.30 - 21.00 WITA',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  bandara: {
    id: 'bandara',
    name: 'Bandara Refleksia',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '✈️',
    wx: 13.1,
    wy: 3.8,
    tileFootprint: 1,
    category: 'Perjalanan Belajar & Target Jangka Panjang',
    shortDescription: 'Terminal penerbangan, menara kontrol ATC, dan landasan pesawat menuju destinasi cita-cita jangka panjang.',
    learningObjective: 'Merumuskan peta perjalanan belajar (learning roadmap) jangka pendek, menengah, dan panjang secara terukur.',
    capacity: 45,
    openingHours: '24 Jam',
    xpRewardPerActivity: 3,
    dailyXpCap: 9,
    defaultOpen: true,
  },
  arena_rumah_misteri: {
    id: 'arena_rumah_misteri',
    name: 'Arena Rumah Misteri',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '🏠',
    wx: 13.5,
    wy: 3.6,
    tileFootprint: 2,
    category: 'Game Kelompok Langsung • Refleksia Timur Depan',
    shortDescription: 'Arena permainan kelompok real-time 5 Rumah Misteri dengan diskusi tim, hitung mundur, dan ledakan rumah salah.',
    learningObjective: 'Melatih kolaborasi tim (Kelompok 1-8), pemecahan masalah cepat, dan pengambilan keputusan bersama.',
    capacity: 64,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 5,
    dailyXpCap: 25,
    defaultOpen: true,
  },
  menara_asesmen: {
    id: 'menara_asesmen',
    name: 'Menara Asesmen Individu',
    zone: 'Pusat Kota (Seberang Sungai)',
    icon: '📝',
    wx: 9.5,
    wy: -3.5,
    tileFootprint: 2,
    category: 'Asesmen Sumatif Mandiri • TKA & CBT',
    shortDescription: 'Menara asesmen sumatif mandiri berbasis lobi dengan soal otomatis dari Bank Materi (PG Tunggal, MCMA, Kategori & Stimulus).',
    learningObjective: 'Mengukur ketercapaian Tujuan Pembelajaran (TP) secara mandiri, jujur, dan terukur melalui asesmen sumatif standar TKA.',
    capacity: 60,
    openingHours: '06.00 - 22.00 WITA',
    xpRewardPerActivity: 10,
    dailyXpCap: 30,
    defaultOpen: true,
  },
};

export const PUSAT_KOTA_BUILDING_IDS: BuildingId[] = [
  'pencakar_langit',
  'latihan_tentara',
  'museum_seni',
  'panggung_kota',
  'mall_kota',
  'bandara',
];

export const isPusatKotaBuilding = (id?: BuildingId | null): boolean => {
  if (!id) return false;
  return (PUSAT_KOTA_BUILDING_IDS as string[]).includes(id);
};

// ============================================================================
// PASAL G.22: FILTER KATA KASAR / TIDAK PANTAS UNTUK INPUT & OBROLAN SISWA
// ============================================================================
const FORBIDDEN_WORDS = [
  'bodoh',
  'tolol',
  'goblok',
  'anjing',
  'anjir',
  'babi',
  'bangsat',
  'kampret',
  'bajingan',
  'brengsek',
  'sialan',
  'tai',
  'tahi',
  'kontol',
  'memek',
  'ngentot',
  'asu',
  'jancok',
  'keparat',
  'setan',
  'iblis',
  'bacot',
];

export function sanitizeStudentInputText(rawText: string): {
  cleanText: string;
  wasFiltered: boolean;
} {
  if (!rawText) return { cleanText: '', wasFiltered: false };
  let cleanText = rawText;
  let wasFiltered = false;

  FORBIDDEN_WORDS.forEach((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(cleanText)) {
      wasFiltered = true;
      cleanText = cleanText.replace(regex, '***');
    }
  });

  return { cleanText, wasFiltered };
}

// ============================================================================
// PASAL C.10 & G.23: KONTROL GURU (KUNCI BANGUNAN, KUNCI OBROLAN, BATAS HARIAN XP)
// ============================================================================
const GOVERNANCE_STORAGE_KEY = 'kota_refleksi_governance_state_v1';
const DAILY_BUILDING_XP_KEY = 'kota_refleksi_daily_building_xp_v1';

export interface CityGovernanceState {
  lockedBuildings: Partial<Record<BuildingId, boolean>>;
  isGlobalChatLocked: boolean;
  hiddenMateriIdsByClass: Record<string, string[]>; // className -> array of hidden materiId
  kickedStudentIds: string[];
  updatedByTeacher?: string;
  updatedAt?: string;
}

export function getCityGovernanceState(): CityGovernanceState {
  try {
    const raw = localStorage.getItem(GOVERNANCE_STORAGE_KEY);
    if (!raw) {
      return {
        lockedBuildings: {},
        isGlobalChatLocked: false,
        hiddenMateriIdsByClass: {},
        kickedStudentIds: [],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      lockedBuildings: parsed.lockedBuildings || {},
      isGlobalChatLocked: Boolean(parsed.isGlobalChatLocked),
      hiddenMateriIdsByClass: parsed.hiddenMateriIdsByClass || {},
      kickedStudentIds: Array.isArray(parsed.kickedStudentIds) ? parsed.kickedStudentIds : [],
      updatedByTeacher: parsed.updatedByTeacher,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return {
      lockedBuildings: {},
      isGlobalChatLocked: false,
      hiddenMateriIdsByClass: {},
      kickedStudentIds: [],
    };
  }
}

export function saveCityGovernanceState(
  nextState: CityGovernanceState,
  isTeacherAccount: boolean
): boolean {
  // Pasal E.18: Validasi peran guru sebelum menyimpan perubahan tata kelola
  if (!isTeacherAccount) return false;
  try {
    localStorage.setItem(
      GOVERNANCE_STORAGE_KEY,
      JSON.stringify({
        ...nextState,
        updatedAt: new Date().toLocaleString('id-ID'),
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function isBuildingLockedByTeacher(buildingId: BuildingId): boolean {
  const gov = getCityGovernanceState();
  return Boolean(gov.lockedBuildings[buildingId]);
}

// Pasal C.11: Batas Harian XP per Bangunan agar tidak bisa dikuras berulang kali
function getTodayWitaDateKey(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function getStudentTodayBuildingXp(studentId: string, buildingId: BuildingId): number {
  try {
    const raw = localStorage.getItem(DAILY_BUILDING_XP_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const todayKey = getTodayWitaDateKey();
    return Number(data?.[`${todayKey}_${studentId}_${buildingId}`] || 0);
  } catch {
    return 0;
  }
}

export function recordStudentBuildingXpWithCap(
  studentId: string,
  buildingId: BuildingId,
  requestedXp: number
): { grantedXp: number; remainingDailyXp: number; reachedCap: boolean } {
  const spec = CITY_BUILDINGS_GOVERNANCE[buildingId];
  const dailyCap = spec?.dailyXpCap ?? 9;
  if (dailyCap <= 0 || requestedXp <= 0) {
    return { grantedXp: 0, remainingDailyXp: 0, reachedCap: true };
  }

  const currentEarned = getStudentTodayBuildingXp(studentId, buildingId);
  if (currentEarned >= dailyCap) {
    return { grantedXp: 0, remainingDailyXp: 0, reachedCap: true };
  }

  const grantedXp = Math.min(requestedXp, dailyCap - currentEarned);
  const newTotal = currentEarned + grantedXp;

  try {
    const raw = localStorage.getItem(DAILY_BUILDING_XP_KEY);
    const data = raw ? JSON.parse(raw) : {};
    const todayKey = getTodayWitaDateKey();
    data[`${todayKey}_${studentId}_${buildingId}`] = newTotal;
    localStorage.setItem(DAILY_BUILDING_XP_KEY, JSON.stringify(data));
  } catch {
    // ignore storage quota errors
  }

  return {
    grantedXp,
    remainingDailyXp: Math.max(0, dailyCap - newTotal),
    reachedCap: newTotal >= dailyCap,
  };
}
