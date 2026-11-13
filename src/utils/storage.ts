import {
  Materi,
  LearningObjective,
  QuizQuestion,
  Student,
  StudentActivityBreakdown,
  Reflection,
  MentorFeedback,
  Message,
  TownSettings,
  PublicChatMessage,
  BankMateriEntry,
  WismaSuggestion,
  TeacherAnnouncement,
  LabDkvTestResult,
  WeeklyXpLogEntry,
  WeeklyLeaderboardCitizen,
  CityEntryLogEntry,
  CityCreatorState,
  CreatorBuildingItem,
  CreatorIdeaItem,
  CreatorMissionSubmission,
  GameRondeRow,
  GamePilihanRow,
  GameSkorRow,
  EscapeKonfigurasiFloor,
  EscapeSesiRow,
  EscapeProgresRow,
  EscapeSkorRow,
  AsesmenTpReference,
  AsesmenSesiRow,
  AsesmenBankSoalRow,
  AsesmenStimulusRow,
  AsesmenPaketSiswaRow,
  AsesmenJawabanRow,
  AsesmenHasilRow,
  FountainAttendanceRow,
} from '../types/index.ts';
import {
  INITIAL_MATERI,
  INITIAL_OBJECTIVES,
  INITIAL_QUIZ,
  INITIAL_STUDENTS,
  INITIAL_REFLECTIONS,
  INITIAL_FEEDBACKS,
  INITIAL_MESSAGES,
  INITIAL_SETTINGS,
  INITIAL_PUBLIC_CHAT,
} from '../data/initialData.ts';
import {
  CITY_BUILDINGS_GOVERNANCE,
  sanitizeStudentInputText,
  isBuildingLockedByTeacher,
} from './aturanBakuKota.ts';

const STORAGE_KEYS = {
  CURRENT_USER: 'kota_refleksi_current_user',
  MATERI: 'kota_refleksi_materi',
  OBJECTIVES: 'kota_refleksi_objectives',
  QUIZ: 'kota_refleksi_quiz',
  STUDENTS: 'kota_refleksi_students',
  REFLECTIONS: 'kota_refleksi_reflections',
  FEEDBACKS: 'kota_refleksi_feedbacks',
  MESSAGES: 'kota_refleksi_messages',
  SETTINGS: 'kota_refleksi_settings',
  PUBLIC_CHAT: 'kota_refleksi_public_chat',
  DELETED_REFLECTIONS: 'kota_refleksi_deleted_reflections',
  BANK_MATERI: 'kota_refleksi_bank_materi',
  DELETED_BANK_MATERI: 'kota_refleksi_deleted_bank_materi',
  WISMA_SUGGESTIONS: 'kota_refleksi_wisma_suggestions',
  LAB_DKV_RESULTS: 'kota_refleksi_lab_dkv_results',
  WEEKLY_XP_LOGS: 'kota_refleksi_weekly_xp_logs',
  CITY_ENTRY_LOGS: 'kota_refleksi_city_entry_logs',
  CREATOR_CITY_STATE: 'kota_refleksi_creator_city_state',
  FOUNTAIN_ATTENDANCE: 'kota_refleksi_fountain_attendance',
};

const INITIAL_BANK_MATERI: BankMateriEntry[] = [
  {
    id: 'bm-seed-001',
    materiId: 'materi-bm-001',
    objectiveId: 'tp-bm-001',
    teacherId: 'teacher-1',
    teacherName: 'Mohamad Rizki Bahsoan, S.Kom',
    mataPelajaran: 'Komputer Grafis & Publikasi',
    kelasTarget: 'X DKV 2 & X DKV 3',
    elemen: 'Prinsip Desain Grafis, Tipografi & Hierarki Visual Publikasi',
    tujuanPembelajaran:
      'Peserta didik mampu menerapkan prinsip keseimbangan, kontras, penekanan (emphasis), dan hierarki tipografi dalam merancang poster publikasi digital yang komunikatif.',
    materiEsensial:
      '1. Hierarki Visual mengatur urutan mata audiens membaca informasi (Judul Utama -> Subjudul -> Isi -> Call to Action).\n2. Kontras warna dan ukuran huruf membantu menonjolkan pesan kunci.\n3. White space (ruang kosong) menjaga desain tetap lega, rapi, dan mudah dipindai.\n4. Grid system menyatukan tata letak elemen grafis dan foto agar proporsional.',
    ringkasanAI:
      'Materi ini membekali siswa DKV dengan fondasi penyusunan tata letak visual menggunakan Hierarki Tipografi, Kontras Warna, Grid System, dan White Space agar karya publikasi memiliki pesan yang langsung tertangkap audiens dalam 3 detik pertama.',
    modulPerpustakaan:
      'BAB 1 — MENGAPA HIERARKI VISUAL PENTING DALAM DESAIN PUBLIKASI?\nKetika seseorang melihat poster atau konten media sosial, mata mereka hanya membutuhkan waktu kurang dari 3 detik untuk memutuskan apakah informasi tersebut menarik atau membingungkan. Hierarki visual adalah seni memandu pandangan mata pembaca dari elemen terpenting menuju detail pendukung.\n\nBAB 2 — 4 PILAR UTAMA KOMPOSISI GRAFIS\n1. Ukuran & Skala (Scale): Elemen yang lebih besar otomatis dipersepsikan lebih penting. Pastikan Headline memiliki ukuran paling dominan dibanding Body Text.\n2. Kontras Warna & Nilai Gelap-Terang: Gunakan kontras tinggi antara teks utama dan latar belakang agar keterbacaan (readability) tetap terjaga dari jarak jauh.\n3. Keseimbangan & Sistem Grid: Gunakan margin yang konsisten dan rata kiri/tengah yang jelas agar desain tidak terlihat berantakan.\n4. White Space (Ruang Negatif): Jangan memenuhi seluruh kanvas dengan teks atau ornamen. Ruang kosong memberi nafas bagi mata audiens.\n\nBAB 3 — RUMUS CEPAT EVALUASI KARYA (TES 3 DETIK)\nCoba jauhkan desainmu atau kecilkan ukurannya hingga 25%. Apakah judul utamanya masih terbaca jelas? Apa elemen pertama yang dilihat matamu? Jika mata langsung tertuju pada pesan inti, maka hierarki visualmu sudah berhasil!',
    pertanyaanRefleksi: [
      'Saat melihat sebuah poster atau desain publikasi, bagian mana dari prinsip hierarki visual (ukuran, kontras warna, atau ruang kosong) yang paling mudah kamu terapkan?',
      'Kendala apa yang paling sering kamu alami ketika menyusun banyak teks di dalam satu kanvas desain agar tidak terlihat penuh dan semrawut?',
      'Bagaimana langkah perbaikan yang akan kamu terapkan pada proyek poster DKV berikutnya setelah memahami konsep Grid System dan White Space?',
    ],
    topikPodcastMentor:
      'Strategi menyusun Hierarki Visual & Tipografi agar poster karya siswa DKV langsung menarik perhatian audiens dalam 3 detik pertama.',
    pertanyaanPemantikPodcast:
      'Jika kamu diminta mendesain ulang satu poster kegiatan sekolah yang penuh teks, elemen apa yang akan kamu perbesar pertama kali dan bagian mana yang akan kamu beri ruang kosong (white space)?',
    misiBalaiKota:
      'Misi Kota: Amati 1 desain poster/informasi di lingkungan sekolah atau kota, lalu identifikasi Headline utama, kontras warna, dan penggunaan White Space-nya!',
    tantanganBangunanLain: [
      {
        buildingId: 'perpustakaan',
        buildingName: 'Perpustakaan Kampus',
        buildingIcon: '📚',
        activityTitle: 'Modul Bacaan & Jurnal 4F: Hierarki Visual & Tipografi',
        materialSummary:
          'Pelajari 4 pilar komposisi grafis (Skala, Kontras, Grid, White Space) dan rumus evaluasi karya Tes 3 Detik, lalu catat kesimpulanmu di Jurnal 4F.',
        challengePrompt: 'Baca modul lengkap di Rak Buku Bank Materi lalu tulis Jurnal 4F (Facts, Feelings, Findings, Future).',
      },
      {
        buildingId: 'taman_refleksi',
        buildingName: 'Pusat Refleksi',
        buildingIcon: '🌿',
        activityTitle: 'Refleksi Mandiri: Evaluasi Tata Letak & Keterbacaan Desain',
        materialSummary:
          'Refleksikan pengalamanmu mengatur keseimbangan teks dan gambar dalam karya publikasi digital.',
        challengePrompt: 'Jawab 3 pertanyaan refleksi khusus dari Guru pada materi Komputer Grafis & Publikasi.',
      },
      {
        buildingId: 'menara_mentor',
        buildingName: 'Studio ON AIR',
        buildingIcon: '🎙️',
        activityTitle: 'Siaran Podcast AI Mentor: Bedah Karya Poster DKV',
        materialSummary:
          'Diskusikan bersama Host AI Mentor mengenai cara mengatasi kanvas desain yang terlalu penuh menggunakan prinsip White Space.',
        challengePrompt: 'Mulai sesi rekaman Podcast ON AIR dengan memilih topik Komputer Grafis & Publikasi.',
      },
      {
        buildingId: 'bengkel_latihan',
        buildingName: 'Lab DKV & Tefa',
        buildingIcon: '🛠️',
        activityTitle: 'Tantangan Kuis 5 Jenjang: Komputer Grafis & Publikasi',
        materialSummary:
          'Uji pemahamanmu dari Jenjang 1 (Dasar) hingga Jenjang 5 (Mahir) seputar Hierarki Visual, Tipografi, dan Grid System.',
        challengePrompt: 'Selesaikan 5 soal berjenjang untuk meraih bintang kompetensi dan XP tambahan.',
      },
      {
        buildingId: 'balai_kota',
        buildingName: 'Balai Kota',
        buildingIcon: '🏛️',
        activityTitle: 'Misi Utama Warga: Audit Visual Poster Kota',
        materialSummary:
          'Panduan capaian pembelajaran & misi kolaboratif merancang publikasi visual yang informatif bagi warga Kota Refleksia.',
        challengePrompt: 'Cek target capaian pembelajaran di papan informasi Balai Kota.',
      },
      {
        buildingId: 'kantor_pos',
        buildingName: 'Kantor Pos',
        buildingIcon: '📮',
        activityTitle: 'Konsultasi Karya ke Guru Pengampu',
        materialSummary:
          'Kirimkan pertanyaan atau minta masukan langsung kepada Bapak Mohamad Rizki Bahsoan, S.Kom terkait draf desain publikasimu.',
        challengePrompt: 'Tulis surat konsultasi desain melalui Kantor Pos.',
      },
      {
        buildingId: 'monumen_warga',
        buildingName: 'Monumen Warga',
        buildingIcon: '🗿',
        activityTitle: 'Diskusi Publik: Warna & Font Favorit Desainer DKV',
        materialSummary:
          'Bagikan tips kombinasi font (Font Pairing) atau palet warna andalanmu di papan obrolan Monumen Warga.',
        challengePrompt: 'Berdiskusi santun dengan teman sekelas di ruang obrolan Monumen Warga.',
      },
      {
        buildingId: 'pasar_prestasi',
        buildingName: 'Pasar Prestasi',
        buildingIcon: '🏆',
        activityTitle: 'Apresiasi Kompetensi Desainer Publikasi',
        materialSummary:
          'Kumpulkan XP dari membaca modul, refleksi, podcast, dan kuis Bank Materi untuk menaikkan peringkatmu di Pasar Prestasi.',
        challengePrompt: 'Pantau lencana dan papan peringkat warga teraktif.',
      },
      {
        buildingId: 'masjid',
        buildingName: 'Masjid Al-Hikmah',
        buildingIcon: '🕌',
        activityTitle: 'Adab & Etika Komunikasi Visual yang Jujur dan Santun',
        materialSummary:
          'Setiap karya desain publikasi harus menyampaikan informasi yang benar, jujur, bermanfaat, dan menjauhi unsur hoaks.',
        challengePrompt: 'Renungkan nilai kejujuran dan kebermanfaatan karya bagi sesama.',
      },
    ],
    kuisBengkel: [
      {
        id: 'q-bm-001-1',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 1 - Dasar] Apa fungsi utama dari penerapan Hierarki Visual dalam sebuah desain poster publikasi?',
        options: [
          'Memandu urutan pandangan mata audiens dari informasi paling penting ke informasi pendukung',
          'Membuat seluruh teks memiliki ukuran yang sama rata di seluruh kanvas',
          'Mengisi seluruh ruang kosong dengan ornamen dekoratif sebanyak mungkin',
          'Menggunakan lebih dari sepuluh jenis font berbeda dalam satu halaman',
        ],
        correctIndex: 0,
        explanation:
          'Hierarki visual berfungsi memandu mata pembaca agar langsung menangkap pesan utama (Headline) sebelum membaca detail pendukung.',
      },
      {
        id: 'q-bm-001-2',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 2 - Pemahaman] Mengapa keberadaan White Space (ruang kosong/negatif) sangat penting dalam tata letak publikasi?',
        options: [
          'Agar perancang tidak perlu memikirkan isi informasi poster',
          'Memberi ruang bernafas bagi mata audiens sehingga desain tampak rapi dan mudah dibaca',
          'Menurunkan kontras warna antara judul dan latar belakang',
          'Menghilangkan kebutuhan akan sistem grid dan margin',
        ],
        correctIndex: 1,
        explanation:
          'White space menjaga fokus visual dan mencegah kelelahan mata saat audiens memindai informasi.',
      },
      {
        id: 'q-bm-001-3',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 3 - Penerapan] Seorang siswa DKV membuat poster dengan latar biru tua gelap. Warna teks judul apa yang paling tepat dipilih untuk menghasilkan kontras keterbacaan (readability) tertinggi?',
        options: [
          'Ungu tua atau hitam pekat',
          'Abu-abu gelap dengan transparansi rendah',
          'Putih bersih atau kuning cerah',
          'Biru dongker dengan ukuran font kecil',
        ],
        correctIndex: 2,
        explanation:
          'Pada latar belakang gelap (biru tua), teks berwarna terang seperti putih atau kuning cerah menciptakan kontras nilai (value contrast) yang tinggi sehingga mudah terbaca.',
      },
      {
        id: 'q-bm-001-4',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 4 - Analisis] Saat dilakukan "Tes 3 Detik", audiens justru lebih dulu melihat dekorasi bunga di sudut poster daripada judul acara. Langkah perbaikan apa yang paling tepat?',
        options: [
          'Memperbesar ukuran dekorasi bunga agar menutupi setengah kanvas',
          'Memperbesar ukuran & ketebalan font judul utama serta mengecilkan/meredupkan elemen dekorasi',
          'Menghapus judul acara dari poster',
          'Mengubah jenis huruf judul menjadi huruf sambung (script) yang rumit dan tipis',
        ],
        correctIndex: 1,
        explanation:
          'Penekanan (Emphasis) harus diberikan pada judul utama melalui skala, ketebalan font, dan kontras, sementara elemen dekoratif tidak boleh mendominasi pesan inti.',
      },
      {
        id: 'q-bm-001-5',
        materiId: 'materi-bm-001',
        materiTitle: 'Komputer Grafis & Publikasi: Prinsip Desain & Hierarki Visual',
        question:
          '[Jenjang 5 - Evaluasi & Kreasi] Dalam merancang katalog produk Teaching Factory DKV yang memuat foto, judul produk, spesifikasi, dan harga, sistem tata letak apa yang paling efektif menjaga konsistensi antarhalaman?',
        options: [
          'Menempatkan foto dan teks secara acak di setiap halaman tanpa garis bantu',
          'Menerapkan Modular Grid System dengan gaya tipografi (Heading, Subheading, Body) yang konsisten',
          'Mengganti warna latar dan jenis font di setiap baris kalimat',
          'Menyatukan seluruh teks spesifikasi tanpa paragraf maupun jarak antarbaris (leading)',
        ],
        correctIndex: 1,
        explanation:
          'Modular Grid System dikombinasikan dengan aturan tipografi yang konsisten memastikan katalog multi-halaman terlihat profesional, terstruktur, dan nyaman dibaca.',
      },
    ],
    createdAt: '3 November 2026',
    timestamp: 1762140000000,
  },
];

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`Failed reading storage key: ${key}`, e);
    return fallback;
  }
}

function safeSet<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed writing storage key: ${key}`, e);
  }
}

export function parseChatTimestamp(val: any): number {
  if (!val) return Date.now();
  if (typeof val === 'number') return val;
  const str = String(val).trim();

  // 1. Direct standard parse
  let parsed = new Date(str).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 2. Replace dots in time (e.g. "08.34" -> "08:34")
  const withColons = str.replace(/(\d{1,2})\.(\d{2})(?:\.(\d{2}))?/, '$1:$2:$3');
  parsed = new Date(withColons).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 3. Indonesian month names conversion
  const idMonths: Record<string, string> = {
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr', mei: 'May', jun: 'Jun',
    jul: 'Jul', agu: 'Aug', agt: 'Aug', sep: 'Sep', okt: 'Oct', nov: 'Nov', des: 'Dec'
  };
  let converted = withColons.toLowerCase();
  for (const [idm, enm] of Object.entries(idMonths)) {
    if (converted.includes(idm)) {
      converted = converted.replace(idm, enm);
      break;
    }
  }
  parsed = new Date(converted).getTime();
  if (!isNaN(parsed) && parsed > 0) return parsed;

  // 4. Timestamp number match
  const numMatch = str.match(/\d{10,13}/);
  if (numMatch) {
    const n = Number(numMatch[0]);
    if (n > 1000000000) return n > 100000000000 ? n : n * 1000;
  }

  return Date.now();
}

export type ActivityType = 'login' | 'mission' | 'reflection' | 'chat' | 'quiz' | 'message';

export function getBaselineActivity(
  _studentId: string,
  className: string,
  studentNumber?: string
): {
  logins: number;
  missions: number;
  reflections: number;
  chats: number;
  quizzes: number;
  messages: number;
  points: number;
} {
  const num = parseInt(studentNumber || '0', 10);
  const isDkv2 = (className || '').includes('2');

  if (isDkv2) {
    if (num === 1) return { logins: 7, missions: 8, reflections: 5, chats: 4, quizzes: 3, messages: 0, points: 86 };
    if (num === 2) return { logins: 6, missions: 7, reflections: 4, chats: 4, quizzes: 3, messages: 0, points: 75 };
    if (num === 3) return { logins: 5, missions: 6, reflections: 4, chats: 3, quizzes: 3, messages: 0, points: 66 };
    if (num === 4) return { logins: 5, missions: 5, reflections: 3, chats: 4, quizzes: 2, messages: 0, points: 58 };
    if (num === 5) return { logins: 4, missions: 5, reflections: 3, chats: 3, quizzes: 2, messages: 0, points: 52 };
    if (num === 6) return { logins: 4, missions: 4, reflections: 3, chats: 2, quizzes: 2, messages: 0, points: 46 };
    if (num === 7) return { logins: 4, missions: 4, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 42 };
    if (num === 8) return { logins: 3, missions: 4, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 39 };
    if (num === 9) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 36 };
    if (num === 10) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 1, messages: 0, points: 33 };
    const variedMissions = (num % 3) + 2;
    const variedReflections = (num % 2) + 1;
    return { logins: 2, missions: variedMissions, reflections: variedReflections, chats: 1, quizzes: 1, messages: 0, points: 20 + (num % 10) };
  } else {
    // X DKV 3
    if (num === 1) return { logins: 7, missions: 7, reflections: 5, chats: 4, quizzes: 3, messages: 0, points: 82 };
    if (num === 2) return { logins: 6, missions: 6, reflections: 4, chats: 4, quizzes: 3, messages: 0, points: 72 };
    if (num === 3) return { logins: 5, missions: 6, reflections: 4, chats: 3, quizzes: 2, messages: 0, points: 63 };
    if (num === 4) return { logins: 5, missions: 5, reflections: 3, chats: 3, quizzes: 2, messages: 0, points: 56 };
    if (num === 5) return { logins: 4, missions: 5, reflections: 3, chats: 2, quizzes: 2, messages: 0, points: 50 };
    if (num === 6) return { logins: 4, missions: 4, reflections: 3, chats: 2, quizzes: 2, messages: 0, points: 45 };
    if (num === 7) return { logins: 3, missions: 4, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 40 };
    if (num === 8) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 2, messages: 0, points: 37 };
    if (num === 9) return { logins: 3, missions: 3, reflections: 2, chats: 2, quizzes: 1, messages: 0, points: 34 };
    if (num === 10) return { logins: 3, missions: 3, reflections: 2, chats: 1, quizzes: 1, messages: 0, points: 31 };
    const variedMissions = (num % 3) + 2;
    const variedReflections = (num % 2) + 1;
    return { logins: 2, missions: variedMissions, reflections: variedReflections, chats: 1, quizzes: 1, messages: 0, points: 20 + (num % 9) };
  }
}

export const StorageService = {
  getCurrentStudent(): Student | null {
    const student = safeGet<Student | null>(STORAGE_KEYS.CURRENT_USER, null);
    if (student && student.className.includes('DKV 1')) {
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } catch (e) {
        // safe
      }
      return null;
    }
    if (student) {
      const canonical = INITIAL_STUDENTS.find(
        (s) => s.id === student.id || s.name.trim().toUpperCase() === student.name.trim().toUpperCase()
      );
      if (canonical && canonical.gender && student.gender !== canonical.gender) {
        student.gender = canonical.gender;
        safeSet(STORAGE_KEYS.CURRENT_USER, student);
      }
      const migratedKey = `kota_xp_v2_${student.id}`;
      if (!localStorage.getItem(migratedKey)) {
        const initialPoints = student.isTeacher ? 10 : 5;
        const updated = { ...student, points: initialPoints };
        try {
          localStorage.setItem(migratedKey, '1');
        } catch (e) {}
        safeSet(STORAGE_KEYS.CURRENT_USER, updated);
        return updated;
      }
    }
    return student;
  },

  setCurrentStudent(student: Student | null): void {
    safeSet(STORAGE_KEYS.CURRENT_USER, student);
    if (student) {
      try {
        localStorage.setItem(`kota_xp_v2_${student.id}`, '1');
      } catch (e) {}
    }
  },

  getMateri(): Materi[] {
    const items = safeGet<Materi[]>(STORAGE_KEYS.MATERI, INITIAL_MATERI);
    if (
      !items ||
      items.length < 5 ||
      !items.some((m) => m.id === 'materi-bk-01' && m.content.includes('BAB 1 —'))
    ) {
      safeSet(STORAGE_KEYS.MATERI, INITIAL_MATERI);
      return INITIAL_MATERI;
    }
    // Pastikan 6 materi awal gedung Pusat Kota baru otomatis tergabung tanpa menghapus materi lama
    const existingIds = new Set(items.map((m) => m.id));
    const missingSeeds = INITIAL_MATERI.filter((seed) => !existingIds.has(seed.id));
    if (missingSeeds.length > 0) {
      const merged = [...items, ...missingSeeds];
      safeSet(STORAGE_KEYS.MATERI, merged);
      return merged;
    }
    return items;
  },

  setMateri(items: Materi[]): void {
    safeSet(STORAGE_KEYS.MATERI, items);
  },

  addMateri(item: Materi): void {
    const items = this.getMateri();
    this.setMateri([item, ...items]);
  },

  updateMateri(updated: Materi): void {
    const items = this.getMateri().map((m) => (m.id === updated.id ? updated : m));
    this.setMateri(items);
  },

  deleteMateri(id: string): void {
    const items = this.getMateri().filter((m) => m.id !== id);
    this.setMateri(items);
  },

  getObjectives(): LearningObjective[] {
    const items = safeGet<LearningObjective[]>(STORAGE_KEYS.OBJECTIVES, INITIAL_OBJECTIVES);
    if (!items || items.length === 0 || !items.some((tp) => tp.id.startsWith('tp-bk-'))) {
      safeSet(STORAGE_KEYS.OBJECTIVES, INITIAL_OBJECTIVES);
      return INITIAL_OBJECTIVES;
    }
    const existingIds = new Set(items.map((tp) => tp.id));
    const missingObjectives = INITIAL_OBJECTIVES.filter((seed) => !existingIds.has(seed.id));
    if (missingObjectives.length > 0) {
      const merged = [...items, ...missingObjectives];
      safeSet(STORAGE_KEYS.OBJECTIVES, merged);
      return merged;
    }
    return items;
  },

  setObjectives(items: LearningObjective[]): void {
    safeSet(STORAGE_KEYS.OBJECTIVES, items);
  },

  addObjective(item: LearningObjective): void {
    const items = this.getObjectives();
    this.setObjectives([...items, item]);
  },

  getQuizQuestions(): QuizQuestion[] {
    const items = safeGet<QuizQuestion[]>(STORAGE_KEYS.QUIZ, INITIAL_QUIZ);
    if (
      !items ||
      items.length < 25 ||
      !items.some((q) => q.id === 'q-bk-1a')
    ) {
      safeSet(STORAGE_KEYS.QUIZ, INITIAL_QUIZ);
      return INITIAL_QUIZ;
    }
    return items;
  },

  setQuizQuestions(items: QuizQuestion[]): void {
    safeSet(STORAGE_KEYS.QUIZ, items);
  },

  addQuizQuestion(item: QuizQuestion): void {
    const items = this.getQuizQuestions();
    this.setQuizQuestions([...items, item]);
  },

  getStudents(): Student[] {
    const rawItems = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const listMigrated = localStorage.getItem('kota_students_act_v4');
    let items = rawItems;
    if (
      !items ||
      items.length < 50 ||
      items.some((s) => s.className.includes('DKV 1')) ||
      !listMigrated
    ) {
      items = INITIAL_STUDENTS;
      safeSet(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
      try {
        localStorage.setItem('kota_students_act_v4', '1');
      } catch (e) {}
    }

    // Enrich each student with computed activity stats, accurate points & canonical gender
    return items.map((s) => {
      const canonical = INITIAL_STUDENTS.find(
        (initS) => initS.id === s.id || initS.name.trim().toUpperCase() === s.name.trim().toUpperCase()
      );
      const upperName = s.name.trim().toUpperCase();
      let resolvedGender = canonical?.gender || s.gender || 'L';
      if (upperName.includes('REVAN PUTRA KARAMA') || upperName.includes('AQZA SETIAWAN YUNUS')) {
        resolvedGender = 'L';
      } else if (upperName.includes('AIRA MUSTAPA')) {
        resolvedGender = 'P';
      }
      const stats = this.getStudentActivityStats(s);
      const base = getBaselineActivity(s.id, s.className, s.studentNumber);
      const currentPts = s.points !== undefined && s.points > 5 ? s.points : base.points;
      return {
        ...s,
        gender: resolvedGender,
        points: currentPts,
        activityStats: stats,
        totalActivities: stats.total,
      };
    });
  },

  recordStudentActivity(
    studentId: string,
    type: ActivityType,
    count = 1
  ): void {
    try {
      const key = `kota_act_${studentId}`;
      const cur = safeGet<Record<string, number>>(key, {});
      cur[type] = (cur[type] || 0) + count;
      safeSet(key, cur);

      // If user is current user, update current user too
      const current = this.getCurrentStudent();
      if (current && current.id === studentId) {
        const stats = this.getStudentActivityStats(current);
        const updated = {
          ...current,
          activityStats: stats,
          totalActivities: stats.total,
        };
        safeSet(STORAGE_KEYS.CURRENT_USER, updated);
        this.syncPasarPrestasiToSpreadsheet(updated);
      } else {
        const matched = this.getStudents().find((s) => s.id === studentId);
        if (matched) {
          this.syncPasarPrestasiToSpreadsheet(matched);
        }
      }
    } catch (e) {}
  },

  getStudentActivityStats(
    student: Student,
    reflections?: Reflection[],
    chats?: PublicChatMessage[],
    messages?: Message[]
  ): StudentActivityBreakdown {
    try {
      const base = getBaselineActivity(student.id, student.className, student.studentNumber);
      const actKey = `kota_act_${student.id}`;
      const recorded = safeGet<Record<string, number>>(actKey, {});

      // Live counts
      const realReflections = reflections ? reflections.filter((r) => r.studentId === student.id).length : 0;
      const realChats = chats ? chats.filter((c) => c.senderId === student.id).length : 0;
      const realMessages = messages ? messages.filter((m) => m.studentId === student.id).length : 0;

      // Completed missions
      let liveMissions = 0;
      try {
        const raw = localStorage.getItem(`kota_completed_missions_v2_${student.id}`);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) liveMissions = arr.length;
        }
      } catch (e) {}

      const logins = Math.max(
        (base.logins || 1) + (recorded.login || 0) + (student.loginCount || 0),
        recorded.sheet_logins || 0
      );
      const missions = Math.max(
        Math.max(base.missions, liveMissions) + (recorded.mission || 0) + (student.completedMissionsCount || 0),
        recorded.sheet_missions || 0
      );
      const refls = Math.max(
        Math.max(base.reflections, realReflections) + (recorded.reflection || 0),
        recorded.sheet_reflections || 0
      );
      const chs = Math.max(
        Math.max(base.chats, realChats) + (recorded.chat || 0),
        recorded.sheet_chats || 0
      );
      const qzs = Math.max(
        (base.quizzes || 0) + (recorded.quiz || 0) + (student.quizCount || 0),
        recorded.sheet_quizzes || 0
      );
      const msgs = Math.max(
        Math.max(base.messages, realMessages) + (recorded.message || 0),
        recorded.sheet_messages || 0
      );

      const total = logins + missions + refls + chs + qzs + msgs;

      return {
        logins,
        missions,
        reflections: refls,
        chats: chs,
        quizzes: qzs,
        messages: msgs,
        total,
      };
    } catch (e) {
      return {
        logins: 1,
        missions: 0,
        reflections: 0,
        chats: 0,
        quizzes: 0,
        messages: 0,
        total: 1,
      };
    }
  },

  setStudents(items: Student[]): void {
    safeSet(STORAGE_KEYS.STUDENTS, items);
  },

  saveOrUpdateStudent(student: Student): void {
    const items = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);
    const idx = items.findIndex((s) => s.id === student.id);
    if (idx >= 0) {
      items[idx] = student;
    } else {
      items.push(student);
    }
    this.setStudents(items);
    // If it's the current user, update current user too
    const current = this.getCurrentStudent();
    if (current && current.id === student.id) {
      this.setCurrentStudent(student);
    }
    if (!student.isTeacher) {
      this.syncPasarPrestasiToSpreadsheet(student);
    }
  },

  /**
   * Menyimpan & menyinkronkan data Pasar Prestasi (Aktivitas Kota, Saldo XP & Top 5 Siswa) ke Google Spreadsheet v2.6
   */
  async syncPasarPrestasiToSpreadsheet(student?: Student | null): Promise<void> {
    try {
      const allStudents = this.getStudents().filter((s) => !s.isTeacher);
      const reflections = this.getReflections();
      const chats = this.getPublicChatMessages();
      const messages = this.getMessages();

      const enrichedList = allStudents.map((s) => {
        const stats = this.getStudentActivityStats(s, reflections, chats, messages);
        return {
          ...s,
          activityStats: stats,
          totalActivities: stats.total,
        };
      });

      enrichedList.sort((a, b) => {
        const actDiff = (b.totalActivities || 0) - (a.totalActivities || 0);
        if (actDiff !== 0) return actDiff;
        return (b.points || 0) - (a.points || 0);
      });

      const top5 = enrichedList.slice(0, 5);
      const targetStudent = student
        ? enrichedList.find((s) => s.id === student.id) || {
            ...student,
            activityStats: this.getStudentActivityStats(student, reflections, chats, messages),
            totalActivities: this.getStudentActivityStats(student, reflections, chats, messages).total,
          }
        : null;

      // 1. Kirim ke Sheet khusus 'Pasar_Prestasi_Siswa' pada Google Apps Script v2.6
      await this.syncWithGAS('save_pasar_prestasi', {
        student: targetStudent,
        top5,
      });

      // 2. Kirim juga ringkasan ke submit_reflection bertanda [PASAR_PRESTASI] agar kompatibel dengan semua versi Spreadsheet
      if (targetStudent && !targetStudent.isTeacher) {
        const stStats = targetStudent.activityStats || this.getStudentActivityStats(targetStudent);
        const rankIdx = enrichedList.findIndex((s) => s.id === targetStudent.id);
        const rankText = rankIdx >= 0 ? `Peringkat #${rankIdx + 1}` : 'Warga Aktif';

        const reflectionPayload: Reflection = {
          id: `prestasi-${targetStudent.id}`,
          studentId: targetStudent.id,
          studentName: targetStudent.name,
          studentNumber: 'PASAR_PRESTASI',
          className: targetStudent.className || 'X DKV 2',
          materiId: 'pasar_prestasi',
          materiTitle: `[PASAR_PRESTASI] ${rankText} • ${stStats.total} Aktivitas • ${targetStudent.points || 0} XP`,
          scale: 5,
          moodEmoji: '🏆',
          answers: {
            understood: `Total Aktivitas: ${stStats.total} (Login: ${stStats.logins}, Misi: ${stStats.missions}, Refleksi: ${stStats.reflections}, Obrolan: ${stStats.chats}, Kuis: ${stStats.quizzes}, Pesan: ${stStats.messages})`,
            difficult: `Saldo XP: ${targetStudent.points || 0} XP | ${rankText}`,
            findings: JSON.stringify(stStats),
            actionPlan: JSON.stringify(
              top5.map((t, i) => `#${i + 1} ${t.name} (${t.className}) - ${t.totalActivities} Aktivitas / ${t.points} XP`)
            ),
            customAnswers: {
              totalActivities: String(stStats.total),
              points: String(targetStudent.points || 0),
              rank: rankText,
              statsJson: JSON.stringify(stStats),
            },
          },
          createdAt: new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        };

        await this.syncWithGAS('submit_reflection', {
          reflection: reflectionPayload,
        });
      }
    } catch (e) {
      // silent fallback
    }
  },

  /**
   * Menarik data Pasar Prestasi dari Google Spreadsheet v2.6 dan memperbarui statistik aktivitas siswa lokal
   */
  async fetchPasarPrestasiFromGAS(): Promise<{
    success: boolean;
    spreadsheetName?: string;
    version?: string;
    updatedCount: number;
  }> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.startsWith('http')) {
      return { success: false, updatedCount: 0 };
    }

    try {
      const url = new URL(settings.gasWebAppUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const res = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        cache: 'no-store',
      });
      if (!res.ok) return { success: false, updatedCount: 0 };

      const resData = await res.json();
      let updatedCount = 0;
      const students = safeGet<Student[]>(STORAGE_KEYS.STUDENTS, INITIAL_STUDENTS);

      const applyRemoteStats = (
        studentId: string,
        studentName: string,
        stats: Partial<StudentActivityBreakdown>,
        points?: number
      ) => {
        const target = students.find(
          (s) =>
            s.id === studentId ||
            (studentName && s.name.toLowerCase() === studentName.toLowerCase())
        );
        if (!target) return;

        const actKey = `kota_act_${target.id}`;
        const cur = safeGet<Record<string, number>>(actKey, {});
        if (stats.logins) cur.sheet_logins = Math.max(cur.sheet_logins || 0, Number(stats.logins));
        if (stats.missions) cur.sheet_missions = Math.max(cur.sheet_missions || 0, Number(stats.missions));
        if (stats.reflections) cur.sheet_reflections = Math.max(cur.sheet_reflections || 0, Number(stats.reflections));
        if (stats.chats) cur.sheet_chats = Math.max(cur.sheet_chats || 0, Number(stats.chats));
        if (stats.quizzes) cur.sheet_quizzes = Math.max(cur.sheet_quizzes || 0, Number(stats.quizzes));
        if (stats.messages) cur.sheet_messages = Math.max(cur.sheet_messages || 0, Number(stats.messages));
        safeSet(actKey, cur);

        if (typeof points === 'number' && points > (target.points || 0)) {
          target.points = points;
        }
        updatedCount++;
      };

      // A. Dari array pasarPrestasi (Skrip GAS v2.6 Sheet 'Pasar_Prestasi_Siswa')
      if (Array.isArray(resData.pasarPrestasi)) {
        resData.pasarPrestasi.forEach((row: any) => {
          if (row && (row.id || row.name)) {
            applyRemoteStats(
              String(row.id || ''),
              String(row.name || ''),
              row.activityStats || {},
              Number(row.points) || undefined
            );
          }
        });
      }

      // B. Dari refleksi bertanda [PASAR_PRESTASI]
      if (Array.isArray(resData.reflections)) {
        resData.reflections.forEach((r: Reflection) => {
          const isPrestasi =
            (r.id && String(r.id).startsWith('prestasi-')) ||
            (r.materiTitle && String(r.materiTitle).includes('[PASAR_PRESTASI]')) ||
            r.studentNumber === 'PASAR_PRESTASI';
          if (isPrestasi && r.answers?.findings) {
            try {
              const parsedStats = JSON.parse(r.answers.findings);
              const pts = Number(r.answers?.customAnswers?.['points']) || undefined;
              applyRemoteStats(r.studentId, r.studentName, parsedStats, pts);
            } catch {}
          }
        });
      }

      if (updatedCount > 0) {
        safeSet(STORAGE_KEYS.STUDENTS, students);
      }

      return {
        success: true,
        spreadsheetName: resData.spreadsheet || 'Google Spreadsheet',
        version: resData.version || '2.6',
        updatedCount,
      };
    } catch {
      return { success: false, updatedCount: 0 };
    }
  },

  getReflections(): Reflection[] {
    const items = safeGet<Reflection[]>(STORAGE_KEYS.REFLECTIONS, INITIAL_REFLECTIONS);
    const deletedIds = new Set(this.getDeletedReflectionIds());
    // Automatically purge old dummy reflections and deleted ones
    const cleaned = (items || []).filter(
      (r) =>
        r.id !== 'ref-bk-001' &&
        r.id !== 'ref-bk-002' &&
        !r.id.startsWith('dummy-') &&
        !deletedIds.has(r.id)
    );
    if (cleaned.length !== (items || []).length) {
      safeSet(STORAGE_KEYS.REFLECTIONS, cleaned);
    }
    return cleaned;
  },

  getDeletedReflectionIds(): string[] {
    return safeGet<string[]>(STORAGE_KEYS.DELETED_REFLECTIONS, []);
  },

  setReflections(items: Reflection[]): void {
    safeSet(STORAGE_KEYS.REFLECTIONS, items);
  },

  addReflection(reflection: Reflection): void {
    const items = this.getReflections();
    this.setReflections([reflection, ...items]);
  },

  deleteReflection(id: string): void {
    const items = this.getReflections().filter((r) => r.id !== id);
    this.setReflections(items);
    // Also remove any corresponding feedback
    const feedbacks = this.getFeedbacks().filter((f) => f.reflectionId !== id);
    this.setFeedbacks(feedbacks);

    // Save to deleted list so spreadsheet sync won't re-add it
    const deleted = this.getDeletedReflectionIds();
    if (!deleted.includes(id)) {
      safeSet(STORAGE_KEYS.DELETED_REFLECTIONS, [...deleted, id]);
    }

    // Sync delete action to Google Apps Script
    this.syncWithGAS('delete_reflection', { reflectionId: id });
  },

  deleteMultipleReflections(ids: string[]): void {
    const idSet = new Set(ids);
    const items = this.getReflections().filter((r) => !idSet.has(r.id));
    this.setReflections(items);
    const feedbacks = this.getFeedbacks().filter((f) => !idSet.has(f.reflectionId));
    this.setFeedbacks(feedbacks);

    const deleted = this.getDeletedReflectionIds();
    const updatedDeleted = Array.from(new Set([...deleted, ...ids]));
    safeSet(STORAGE_KEYS.DELETED_REFLECTIONS, updatedDeleted);

    ids.forEach((id) => {
      this.syncWithGAS('delete_reflection', { reflectionId: id });
    });
  },

  clearReflections(): void {
    const current = this.getReflections();
    const currentIds = current.map((r) => r.id);
    this.setReflections([]);
    this.setFeedbacks([]);
    const deleted = this.getDeletedReflectionIds();
    safeSet(STORAGE_KEYS.DELETED_REFLECTIONS, Array.from(new Set([...deleted, ...currentIds])));

    // Sync clear action to Google Apps Script
    this.syncWithGAS('clear_all_reflections', {});
  },

  getFeedbacks(): MentorFeedback[] {
    const items = safeGet<MentorFeedback[]>(STORAGE_KEYS.FEEDBACKS, INITIAL_FEEDBACKS);
    const cleaned = (items || []).filter(
      (f) =>
        f.id !== 'fb-bk-001' &&
        f.id !== 'fb-bk-002' &&
        f.reflectionId !== 'ref-bk-001' &&
        f.reflectionId !== 'ref-bk-002' &&
        !f.id.startsWith('dummy-')
    );
    if (cleaned.length !== (items || []).length) {
      safeSet(STORAGE_KEYS.FEEDBACKS, cleaned);
    }
    return cleaned;
  },

  setFeedbacks(items: MentorFeedback[]): void {
    safeSet(STORAGE_KEYS.FEEDBACKS, items);
  },

  addFeedback(feedback: MentorFeedback): void {
    const items = this.getFeedbacks();
    this.setFeedbacks([feedback, ...items]);
  },

  updateFeedback(feedback: MentorFeedback): void {
    const items = this.getFeedbacks().map((f) => (f.id === feedback.id ? feedback : f));
    this.setFeedbacks(items);
  },

  getMessages(): Message[] {
    return safeGet<Message[]>(STORAGE_KEYS.MESSAGES, INITIAL_MESSAGES);
  },

  setMessages(items: Message[]): void {
    safeSet(STORAGE_KEYS.MESSAGES, items);
  },

  addMessage(msg: Message): void {
    const { cleanText } = sanitizeStudentInputText(msg.content);
    const cleanMsg: Message = { ...msg, content: cleanText };
    const items = this.getMessages();
    this.setMessages([cleanMsg, ...items]);
  },

  updateMessage(msg: Message): void {
    const items = this.getMessages().map((m) => (m.id === msg.id ? msg : m));
    this.setMessages(items);
  },

  // Monumen Warga 24-Hour Purge & Max 25 Messages Helper:
  // Removes messages older than 24 hours and strictly returns the latest 25 messages in chronological order (newest at bottom)
  purgeExpiredPublicChats(items: PublicChatMessage[]): PublicChatMessage[] {
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
    const MAX_CHATS = 25;
    const cutoff = Date.now() - TWENTY_FOUR_HOURS;
    const valid = (items || []).filter((m) => {
      if (!m || !m.id || !m.content) return false;
      // Filter out legacy mock messages (e.g. mujair, sayang, pchat-ref-)
      if (
        m.id.startsWith('pchat-ref-') ||
        m.content.includes('mujair') ||
        m.content.includes('sayang') ||
        m.content.includes('WNT')
      ) {
        return false;
      }
      const time = parseChatTimestamp(m.createdAt || m.timestamp);
      return time >= cutoff && !m.isReported;
    });

    if (valid.length === 0) {
      return [...INITIAL_PUBLIC_CHAT];
    }

    // 1. Sort newest first to pick the latest 25
    valid.sort((a, b) => {
      const timeA = parseChatTimestamp(a.createdAt || a.timestamp);
      const timeB = parseChatTimestamp(b.createdAt || b.timestamp);
      return timeB - timeA;
    });

    const latest = valid.slice(0, MAX_CHATS);

    // 2. Sort chronologically ascending so newest message is at the very bottom
    return latest.sort((a, b) => {
      const timeA = parseChatTimestamp(a.createdAt || a.timestamp);
      const timeB = parseChatTimestamp(b.createdAt || b.timestamp);
      return timeA - timeB;
    });
  },

  getPublicChatMessages(): PublicChatMessage[] {
    const raw = safeGet<PublicChatMessage[]>(STORAGE_KEYS.PUBLIC_CHAT, INITIAL_PUBLIC_CHAT);
    const map = new Map<string, PublicChatMessage>();
    (raw || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    const cleaned = this.purgeExpiredPublicChats(Array.from(map.values()));
    safeSet(STORAGE_KEYS.PUBLIC_CHAT, cleaned);
    return cleaned;
  },

  setPublicChatMessages(items: PublicChatMessage[]): void {
    const map = new Map<string, PublicChatMessage>();
    (items || []).forEach((m) => {
      if (m && m.id) map.set(m.id, m);
    });
    const cleaned = this.purgeExpiredPublicChats(Array.from(map.values()));
    safeSet(STORAGE_KEYS.PUBLIC_CHAT, cleaned);
    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_public_chat_updated', { detail: cleaned }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('kota_refleksi_channel');
        bc.postMessage({ type: 'chat_updated', data: cleaned });
        bc.close();
      }
    } catch (e) {
      // safe fallback
    }
  },

  async fetchPublicChatMessages(): Promise<PublicChatMessage[]> {
    const localItems = this.getPublicChatMessages();
    const msgMap = new Map<string, PublicChatMessage>();
    localItems.forEach((m) => msgMap.set(m.id, m));

    // 1. Fetch shared messages from server API (/api/chat/messages) if available
    try {
      const response = await fetch('/api/chat/messages');
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          result.data.forEach((m: PublicChatMessage) => {
            if (m && m.id) msgMap.set(m.id, m);
          });
        }
      }
    } catch (err) {
      // Offline / client-only fallback
    }

    // 2. Fetch shared messages from Google Spreadsheet / Google Apps Script Web App
    // This connects all students across different devices & networks in real-time
    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_chats');
        url.searchParams.set('_t', String(Date.now()));

        const gasRes = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (gasRes.ok) {
          const resData = await gasRes.json();
          const chatList = Array.isArray(resData.chats)
            ? resData.chats
            : Array.isArray(resData)
            ? resData
            : [];
          chatList.forEach((m: PublicChatMessage) => {
            if (m && m.id && m.content) {
              msgMap.set(m.id, {
                ...m,
                roomNumber: m.roomNumber || 1,
                avatarColor: m.avatarColor || '#38bdf8',
              });
            }
          });
        }
      } catch (err) {
        // Safe silent fallback if offline or network error
      }
    }

    const merged = this.purgeExpiredPublicChats(Array.from(msgMap.values()));
    const localIds = localItems.map((m) => m.id).join(',');
    const mergedIds = merged.map((m) => m.id).join(',');
    if (localIds !== mergedIds) {
      this.setPublicChatMessages(merged);
    }
    return merged;
  },

  async addPublicChatMessage(msg: PublicChatMessage): Promise<void> {
    const { cleanText } = sanitizeStudentInputText(msg.content);
    const sanitizedMsg: PublicChatMessage = { ...msg, content: cleanText };
    const items = this.getPublicChatMessages();
    const map = new Map<string, PublicChatMessage>();
    map.set(sanitizedMsg.id, sanitizedMsg);
    items.forEach((m) => {
      if (m && m.id && !map.has(m.id)) {
        map.set(m.id, m);
      }
    });
    const cleaned = this.purgeExpiredPublicChats(Array.from(map.values()));
    this.setPublicChatMessages(cleaned);

    // 1. Broadcast to server API
    try {
      fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitizedMsg),
      }).catch(() => {});
    } catch (e) {
      // safe fallback
    }

    // 2. Sync to Google Spreadsheet immediately so all students on all devices receive it
    this.syncWithGAS('send_public_chat', { message: sanitizedMsg });
  },

  reportChatMessage(msgId: string): void {
    const items = this.getPublicChatMessages().map((m) =>
      m.id === msgId ? { ...m, isReported: true } : m
    );
    this.setPublicChatMessages(items);

    try {
      fetch('/api/chat/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msgId }),
      }).catch(() => {});
    } catch (e) {
      // safe fallback
    }
  },

  getSettings(): TownSettings {
    const saved = safeGet<TownSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    let modified = false;
    if (!saved.gasWebAppUrl || saved.gasWebAppUrl.trim().length === 0) {
      saved.gasWebAppUrl = INITIAL_SETTINGS.gasWebAppUrl;
      modified = true;
    }
    if (!saved.spreadsheetUrl || saved.spreadsheetUrl.trim().length === 0) {
      saved.spreadsheetUrl = INITIAL_SETTINGS.spreadsheetUrl;
      modified = true;
    }
    if (!saved.teacherPin || saved.teacherPin.trim().length === 0) {
      saved.teacherPin = 'Kiki123!';
      modified = true;
    }
    if (!saved.bridgePassCode || saved.bridgePassCode.trim().length === 0) {
      saved.bridgePassCode = 'REFLEKSIA2026';
      modified = true;
    }
    if (modified) {
      safeSet(STORAGE_KEYS.SETTINGS, saved);
    }
    return saved;
  },

  setSettings(settings: TownSettings): void {
    safeSet(STORAGE_KEYS.SETTINGS, settings);
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(STORAGE_KEYS.MATERI);
    localStorage.removeItem(STORAGE_KEYS.OBJECTIVES);
    localStorage.removeItem(STORAGE_KEYS.QUIZ);
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
    localStorage.removeItem(STORAGE_KEYS.FEEDBACKS);
    localStorage.removeItem(STORAGE_KEYS.MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },

  async syncWithGAS(action: string, payload: any): Promise<boolean> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.startsWith('http')) {
      return false;
    }
    try {
      const dataToSend = {
        action,
        timestamp: new Date().toISOString(),
        ...payload,
      };

      // Use text/plain;charset=utf-8 with mode: 'no-cors' so browser avoids CORS preflight OPTIONS rejection
      // Google Apps Script parses e.postData.contents as JSON seamlessly
      await fetch(settings.gasWebAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(dataToSend),
      });
      return true;
    } catch (e) {
      console.warn('Google Apps Script sync skipped/failed:', e);
      return false;
    }
  },

  async fetchFromGAS(): Promise<{
    success: boolean;
    reflections?: Reflection[];
    feedbacks?: MentorFeedback[];
    messages?: Message[];
    chats?: PublicChatMessage[];
    spreadsheetName?: string;
    needsScriptUpdate?: boolean;
    error?: string;
  }> {
    const settings = this.getSettings();
    if (!settings.gasWebAppUrl || !settings.gasWebAppUrl.startsWith('http')) {
      return { success: false, error: 'URL Google Apps Script belum diatur.' };
    }

    try {
      const url = new URL(settings.gasWebAppUrl);
      url.searchParams.set('action', 'get_data');
      url.searchParams.set('_t', String(Date.now()));

      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Koneksi HTTP menghasilkan status: ${response.status}`);
      }

      const resData = await response.json();

      const hasReflections = Array.isArray(resData.reflections);
      const hasMessages = Array.isArray(resData.messages);
      const hasChats = Array.isArray(resData.chats);

      if (hasReflections || hasMessages || hasChats) {
        // Check if there is a synced Master Creator Studio state in reflections
        if (hasReflections) {
          const creatorRows = (resData.reflections as Reflection[]).filter(
            (r) =>
              r &&
              (r.id === 'creator-city-state-v1' ||
                r.studentNumber === 'CREATOR_CITY_STATE' ||
                (r.materiTitle && String(r.materiTitle).includes('[CREATOR_CITY_STATE]')))
          );
          if (creatorRows.length > 0) {
            // Find highest version
            let latestState: CityCreatorState | null = null;
            creatorRows.forEach((row) => {
              if (row.answers?.findings) {
                try {
                  const parsed = JSON.parse(row.answers.findings) as CityCreatorState;
                  if (
                    parsed &&
                    typeof parsed.version === 'number' &&
                    (!latestState || parsed.version > latestState.version)
                  ) {
                    latestState = parsed;
                  }
                } catch {}
              }
            });
            if (latestState) {
              const currentLocal = this.getCreatorCityState();
              if ((latestState as CityCreatorState).version >= currentLocal.version) {
                safeSet(STORAGE_KEYS.CREATOR_CITY_STATE, latestState);
                try {
                  window.dispatchEvent(
                    new CustomEvent('kota_refleksi_creator_state_updated', { detail: latestState })
                  );
                } catch {}
              }
            }
          }
        }

        const deletedIds = new Set(this.getDeletedReflectionIds());
        const validReflections = (resData.reflections || []).filter(
          (r: Reflection) =>
            !deletedIds.has(r.id) &&
            r.id !== 'creator-city-state-v1' &&
            r.studentNumber !== 'CREATOR_CITY_STATE' &&
            !(r.materiTitle && String(r.materiTitle).includes('[CREATOR_CITY_STATE]'))
        );
        const validFeedbacks = (resData.feedbacks || []).filter(
          (f: MentorFeedback) => !deletedIds.has(f.reflectionId)
        );

        let validChats: PublicChatMessage[] = [];
        if (hasChats && resData.chats.length > 0) {
          const currentChats = this.getPublicChatMessages();
          const chatMap = new Map<string, PublicChatMessage>();
          resData.chats.forEach((c: PublicChatMessage) => chatMap.set(c.id, c));
          currentChats.forEach((c) => {
            if (!chatMap.has(c.id)) chatMap.set(c.id, c);
          });
          validChats = this.purgeExpiredPublicChats(Array.from(chatMap.values()));
          this.setPublicChatMessages(validChats);
        }

        return {
          success: true,
          reflections: validReflections,
          feedbacks: validFeedbacks,
          messages: resData.messages || [],
          chats: validChats,
          spreadsheetName: resData.spreadsheet || 'Google Spreadsheet',
        };
      }

      if (resData.spreadsheet && !hasReflections) {
        return {
          success: false,
          spreadsheetName: resData.spreadsheet,
          needsScriptUpdate: true,
          error: `Terhubung ke Google Spreadsheet "${resData.spreadsheet}", namun skrip Google Apps Script masih versi 1.0 (belum memiliki fungsi pembacaan data). Silakan perbarui skrip di spreadsheet Anda.`,
        };
      }

      return {
        success: false,
        error: 'Respons dari Google Apps Script tidak mengandung data refleksi atau pesan.',
      };
    } catch (err: any) {
      console.warn('Gagal menarik data dari Google Apps Script:', err);
      return {
        success: false,
        error: err?.message || 'Gagal terhubung ke Google Apps Script.',
      };
    }
  },

  // ==========================================================================
  // BANK MATERI GURU & DISTRIBUSI OTOMATIS KE SELURUH BANGUNAN REFLEKSIA CITY
  // ==========================================================================
  getDeletedBankMateriIds(): string[] {
    return safeGet<string[]>(STORAGE_KEYS.DELETED_BANK_MATERI, []);
  },

  getBankMateri(): BankMateriEntry[] {
    const deletedIds = new Set(this.getDeletedBankMateriIds());
    const saved = safeGet<BankMateriEntry[]>(STORAGE_KEYS.BANK_MATERI, INITIAL_BANK_MATERI);
    const list = Array.isArray(saved) && saved.length > 0 ? saved : INITIAL_BANK_MATERI;
    const filtered = list.filter((item) => item && item.id && !deletedIds.has(item.id));
    if (filtered.length === 0 && !deletedIds.has('bm-seed-001')) {
      safeSet(STORAGE_KEYS.BANK_MATERI, INITIAL_BANK_MATERI);
      return INITIAL_BANK_MATERI;
    }
    return filtered;
  },

  setBankMateri(items: BankMateriEntry[]): void {
    const deletedIds = new Set(this.getDeletedBankMateriIds());
    const map = new Map<string, BankMateriEntry>();
    (items || []).forEach((item) => {
      if (item && item.id && !deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    });
    const sorted = Array.from(map.values()).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );
    safeSet(STORAGE_KEYS.BANK_MATERI, sorted);
    this.applyBankMateriToCityState(sorted);
  },

  /**
   * Menyebarkan seluruh item Bank Materi ke state Materi (Perpustakaan, Pusat Refleksi, Studio ON AIR),
   * LearningObjective (Balai Kota & Pusat Refleksi), serta QuizQuestion (Lab DKV & Tefa).
   */
  applyBankMateriToCityState(entries?: BankMateriEntry[]): void {
    const list = entries || this.getBankMateri();
    if (!list || list.length === 0) return;

    const currentMateris = this.getMateri();
    const currentObjectives = this.getObjectives();
    const currentQuizzes = this.getQuizQuestions();

    const materiMap = new Map<string, Materi>();
    currentMateris.forEach((m) => materiMap.set(m.id, m));

    const objMap = new Map<string, LearningObjective>();
    currentObjectives.forEach((o) => objMap.set(o.id, o));

    const quizMap = new Map<string, QuizQuestion>();
    currentQuizzes.forEach((q) => quizMap.set(q.id, q));

    list.forEach((bm) => {
      const mId = bm.materiId || `materi-${bm.id}`;
      const oId = bm.objectiveId || `tp-${bm.id}`;
      const fullTitle = `${bm.mataPelajaran}: ${bm.elemen}`;

      const generatedMateri: Materi = {
        id: mId,
        title: fullTitle,
        subject: bm.mataPelajaran,
        targetClass: bm.kelasTarget || 'X DKV 2 & X DKV 3',
        content: bm.modulPerpustakaan || bm.materiEsensial,
        location: 'perpustakaan',
        createdAt: bm.createdAt || new Date().toLocaleDateString('id-ID'),
        isNew: true,
        customQuestions:
          Array.isArray(bm.pertanyaanRefleksi) && bm.pertanyaanRefleksi.length > 0
            ? bm.pertanyaanRefleksi
            : [
                `Apa konsep utama dari materi "${bm.elemen}" (${bm.mataPelajaran}) yang sudah kamu pahami?`,
                `Bagian mana dari tujuan pembelajaran "${bm.tujuanPembelajaran}" yang masih perlu kamu latih?`,
                `Bagaimana rencana penerapan materi ini pada karya/tugas berikutnya?`,
              ],
        elemen: bm.elemen,
        tujuanPembelajaran: bm.tujuanPembelajaran,
        materiEsensial: bm.materiEsensial,
        teacherName: bm.teacherName,
        bankMateriId: bm.id,
      };
      materiMap.set(mId, generatedMateri);

      const generatedObj: LearningObjective = {
        id: oId,
        materiId: mId,
        goalStatement: bm.tujuanPembelajaran,
        indicator: `Elemen: ${bm.elemen} • Oleh: ${bm.teacherName}`,
        deadline: bm.misiBalaiKota || 'Misi Aktif Kota Refleksia',
      };
      objMap.set(oId, generatedObj);

      if (Array.isArray(bm.kuisBengkel)) {
        bm.kuisBengkel.forEach((q, idx) => {
          const qId = q.id || `q-${bm.id}-${idx + 1}`;
          quizMap.set(qId, {
            id: qId,
            materiId: mId,
            materiTitle: fullTitle,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.explanation || 'Sesuai dengan Materi Esensial & Tujuan Pembelajaran.',
          });
        });
      }
    });

    this.setMateri(Array.from(materiMap.values()));
    this.setObjectives(Array.from(objMap.values()));
    this.setQuizQuestions(Array.from(quizMap.values()));
  },

  /**
   * Menyimpan Bank Materi baru/update, menyebarkan ke seluruh bangunan Kota Refleksia,
   * menyimpan ke Server, dan menyinkronkan ke Google Spreadsheet.
   */
  async saveAndDistributeBankMateri(entry: BankMateriEntry): Promise<void> {
    const current = this.getBankMateri();
    const filtered = current.filter((item) => item.id !== entry.id);
    const updated = [entry, ...filtered];
    this.setBankMateri(updated);

    // 1. Simpan ke Server API (/api/bank-materi)
    try {
      fetch('/api/bank-materi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {});
    } catch {}

    // 2. Kirim ke Google Spreadsheet menggunakan action 'save_bank_materi' (GAS v2.7)
    await this.syncWithGAS('save_bank_materi', {
      bankMateri: entry,
    });

    // 3. Kirim juga ke submit_reflection bertanda [BANK_MATERI_AI] agar tetap tersimpan
    // meskipun Guru belum sempat memperbarui skrip GAS ke versi 2.7
    const fallbackReflection: Reflection = {
      id: `bankmateri-${entry.id}`,
      studentId: entry.teacherId || 'teacher-bank-materi',
      studentName: entry.teacherName || 'Guru Kota Refleksia',
      studentNumber: 'BANK_MATERI_AI',
      className: entry.kelasTarget || 'X DKV 2 & X DKV 3',
      materiId: entry.materiId,
      materiTitle: `[BANK_MATERI_AI] ${entry.mataPelajaran} — ${entry.elemen}`,
      scale: 5,
      moodEmoji: '🏦',
      answers: {
        understood: `TP: ${entry.tujuanPembelajaran}`,
        difficult: `Materi Esensial: ${entry.materiEsensial}`,
        actionPlan: `Ringkasan AI: ${entry.ringkasanAI}`,
        findings: JSON.stringify(entry),
      },
      createdAt: entry.createdAt,
    };
    await this.syncWithGAS('submit_reflection', {
      reflection: fallbackReflection,
    });

    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_bank_materi_updated', { detail: updated }));
    } catch {}
  },

  async deleteBankMateriEntry(id: string): Promise<void> {
    const current = this.getBankMateri();
    const target = current.find((item) => item.id === id);
    const deleted = this.getDeletedBankMateriIds();
    if (!deleted.includes(id)) {
      safeSet(STORAGE_KEYS.DELETED_BANK_MATERI, [...deleted, id]);
    }

    const remaining = current.filter((item) => item.id !== id);
    safeSet(STORAGE_KEYS.BANK_MATERI, remaining);

    if (target) {
      const mId = target.materiId || `materi-${target.id}`;
      const oId = target.objectiveId || `tp-${target.id}`;
      this.setMateri(this.getMateri().filter((m) => m.id !== mId && m.bankMateriId !== id));
      this.setObjectives(this.getObjectives().filter((o) => o.id !== oId && o.materiId !== mId));
      this.setQuizQuestions(this.getQuizQuestions().filter((q) => q.materiId !== mId));
    }

    try {
      fetch(`/api/bank-materi/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      }).catch(() => {});
    } catch {}

    await this.syncWithGAS('delete_bank_materi', { id });
    await this.syncWithGAS('delete_reflection', { reflectionId: `bankmateri-${id}` });

    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_bank_materi_updated', { detail: remaining }));
    } catch {}
  },

  /**
   * Menarik Bank Materi dari Server & Google Spreadsheet agar semua siswa di semua perangkat
   * otomatis mendapatkan materi terbaru yang di-generate oleh Bapak/Ibu Guru.
   */
  async fetchBankMateriFromAllSources(): Promise<BankMateriEntry[]> {
    const deletedIds = new Set(this.getDeletedBankMateriIds());
    const map = new Map<string, BankMateriEntry>();

    this.getBankMateri().forEach((item) => {
      if (item && item.id && !deletedIds.has(item.id)) {
        map.set(item.id, item);
      }
    });

    // 1. Tarik dari Server API (/api/bank-materi)
    try {
      const res = await fetch('/api/bank-materi');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((item: BankMateriEntry) => {
            if (item && item.id && !deletedIds.has(item.id)) {
              map.set(item.id, item);
            }
          });
        }
      }
    } catch {}

    // 2. Tarik dari Google Spreadsheet (Sheet 'Bank_Materi_Guru' v2.7 & fallback [BANK_MATERI_AI])
    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_data');
        url.searchParams.set('_t', String(Date.now()));
        const gasRes = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (gasRes.ok) {
          const resData = await gasRes.json();
          if (Array.isArray(resData.bankMateri)) {
            resData.bankMateri.forEach((item: BankMateriEntry) => {
              if (item && item.id && item.mataPelajaran && !deletedIds.has(item.id)) {
                map.set(item.id, item);
              }
            });
          }
          if (Array.isArray(resData.reflections)) {
            resData.reflections.forEach((r: Reflection) => {
              const isBM =
                (r.id && String(r.id).startsWith('bankmateri-')) ||
                (r.materiTitle && String(r.materiTitle).includes('[BANK_MATERI_AI]')) ||
                r.studentNumber === 'BANK_MATERI_AI';
              if (isBM && r.answers?.findings) {
                try {
                  const parsed: BankMateriEntry = JSON.parse(r.answers.findings);
                  if (parsed && parsed.id && parsed.mataPelajaran && !deletedIds.has(parsed.id)) {
                    map.set(parsed.id, parsed);
                  }
                } catch {}
              }
            });
          }
        }
      } catch {}
    }

    const merged = Array.from(map.values()).sort(
      (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
    );
    this.setBankMateri(merged);
    return merged;
  },

  // ==========================================================================
  // PAPAN PENGUMUMAN BALAI KOTA (DARI DATA PESAN SISTEM & PENGUMUMAN GURU)
  // ==========================================================================
  getTeacherAnnouncements(): TeacherAnnouncement[] {
    const announcements: TeacherAnnouncement[] = [];
    const seenIds = new Set<string>();

    // 1. Ambil dari data pesan sistem (StorageService.getMessages()) yang dikirim oleh Guru atau memiliki balasan/arahan Guru
    const sysMessages = this.getMessages();
    sysMessages.forEach((msg) => {
      const isDirectAnnouncement =
        (msg.studentId && msg.studentId.startsWith('teacher-')) ||
        (msg.className && (msg.className.toLowerCase().includes('guru') || msg.className.toLowerCase().includes('pengumuman'))) ||
        (msg.content && msg.content.includes('[PENGUMUMAN]'));

      if (isDirectAnnouncement) {
        const cleanText = msg.content.replace(/^\[PENGUMUMAN\]\s*/i, '').trim();
        const item: TeacherAnnouncement = {
          id: `ann-msg-${msg.id}`,
          teacherId: msg.studentId || 'teacher-dkv',
          teacherName: msg.studentName || 'Dewan Guru DKV',
          subject: msg.className || 'Pengumuman Resmi Guru',
          title: 'Pengumuman Guru Kota Refleksia',
          content: cleanText,
          priority: 'penting',
          createdAt: msg.createdAt || 'Hari ini',
          timestamp: parseChatTimestamp(msg.createdAt),
        };
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          announcements.push(item);
        }
      } else if (msg.teacherReply && msg.teacherReply.trim().length > 0) {
        const item: TeacherAnnouncement = {
          id: `ann-reply-${msg.id}`,
          teacherId: 'teacher-mentor',
          teacherName: 'Bapak/Ibu Guru Pembimbing DKV',
          subject: `Arahan Guru (Tanggapan untuk ${msg.studentName})`,
          title: 'Arahan & Pengumuman Pembelajaran',
          content: msg.teacherReply.trim(),
          priority: 'info',
          createdAt: msg.repliedAt || msg.createdAt || 'Terbaru',
          timestamp: parseChatTimestamp(msg.repliedAt || msg.createdAt),
        };
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          announcements.push(item);
        }
      }
    });

    // 2. Ambil dari pesan Obrolan Warga yang dikirim oleh akun Guru
    const publicChats = this.getPublicChatMessages();
    publicChats.forEach((chat) => {
      if (chat.isTeacher || (chat.senderId && chat.senderId.startsWith('teacher-'))) {
        const item: TeacherAnnouncement = {
          id: `ann-chat-${chat.id}`,
          teacherId: chat.senderId,
          teacherName: chat.senderName,
          subject: chat.className || 'Guru DKV',
          title: 'Sapaan & Informasi Guru',
          content: chat.content,
          priority: 'info',
          createdAt: chat.timestamp || 'Hari ini',
          timestamp: parseChatTimestamp(chat.createdAt || chat.timestamp),
        };
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          announcements.push(item);
        }
      }
    });

    // 3. Ambil Misi Balai Kota dari Bank Materi Guru terbaru
    const bankMateris = this.getBankMateri();
    bankMateris.slice(0, 3).forEach((bm) => {
      if (bm.misiBalaiKota) {
        const item: TeacherAnnouncement = {
          id: `ann-bm-${bm.id}`,
          teacherId: bm.teacherId || 'teacher-bm',
          teacherName: bm.teacherName || 'Guru Pengampu DKV',
          subject: `${bm.mataPelajaran} (${bm.kelasTarget})`,
          title: `Misi & Materi Baru: ${bm.elemen}`,
          content: `${bm.misiBalaiKota} — Silakan kunjungi Perpustakaan, Pusat Refleksi, Studio ON AIR, dan Lab DKV & Tefa.`,
          priority: 'misi',
          createdAt: bm.createdAt || 'Terbaru',
          timestamp: bm.timestamp || Date.now() - 3600000,
        };
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          announcements.push(item);
        }
      }
    });

    // 4. Pastikan selalu ada pengumuman sistem default jika belum ada pesan
    if (announcements.length === 0) {
      announcements.push({
        id: 'ann-default-1',
        teacherId: 'teacher-1',
        teacherName: 'Mohamad Rizki Bahsoan, S.Kom',
        subject: 'Komputer Grafis & Berpikir Komputasional',
        title: 'Pengumuman Pembelajaran & Misi Harian Warga',
        content:
          'Selamat datang di Kota Refleksia SMKN 2 Gorontalo! Jangan lupa membaca materi terbaru di Perpustakaan Kampus, mengerjakan kuis di Lab DKV & Tefa, serta menuliskan Jurnal Refleksi 4F hari ini.',
        priority: 'penting',
        createdAt: 'Hari ini',
        timestamp: Date.now(),
      });
    }

    return announcements.sort((a, b) => b.timestamp - a.timestamp);
  },

  async postTeacherAnnouncement(params: {
    teacherId: string;
    teacherName: string;
    subject?: string;
    content: string;
  }): Promise<Message> {
    const nowStr = new Date().toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const newMsg: Message = {
      id: `msg-ann-${Date.now().toString(36)}`,
      studentId: params.teacherId.startsWith('teacher-') ? params.teacherId : `teacher-${params.teacherId}`,
      studentName: params.teacherName,
      className: params.subject || 'Pengumuman Guru DKV',
      content: `[PENGUMUMAN] ${params.content.trim()}`,
      teacherReply: params.content.trim(),
      status: 'replied',
      createdAt: nowStr,
      repliedAt: nowStr,
    };
    this.addMessage(newMsg);
    await this.syncWithGAS('send_message', { message: newMsg });
    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_announcement_updated', { detail: newMsg }));
    } catch {}
    return newMsg;
  },

  // ==========================================================================
  // KOTAK SURAT KECIL MASUKAN & SARAN DI SETIAP WISMA SISWA & GURU
  // ==========================================================================
  getWismaSuggestions(): WismaSuggestion[] {
    const initialSuggestions: WismaSuggestion[] = [
      {
        id: 'wsug-seed-1',
        wismaId: 'siswa_1',
        wismaName: '🏘️ Wisma X DKV',
        senderId: 'std-dkv2-01',
        senderName: 'Abdul Razak Samauna',
        senderRole: 'siswa',
        className: 'X DKV 2',
        category: 'Fitur Kota Refleksia',
        content: 'Semoga sudut literasi di samping Balai Kota semakin banyak koleksi komik desain grafis dan tipografinya!',
        createdAt: 'Hari ini',
        timestamp: Date.now() - 3600 * 1000 * 2,
      },
      {
        id: 'wsug-seed-2',
        wismaId: 'guru_1',
        wismaName: '🏡 Rumah Dinas Guru 1',
        senderId: 'teacher-1',
        senderName: 'Mohamad Rizki Bahsoan, S.Kom',
        senderRole: 'guru',
        className: 'Guru DKV',
        category: 'Pembelajaran & Materi',
        content: 'Mari manfaatkan Kotak Surat Kecil di setiap Wisma ini untuk menyampaikan ide praktik Tefa DKV dan masukan pembelajaran.',
        createdAt: 'Hari ini',
        timestamp: Date.now() - 3600 * 1000 * 4,
      },
    ];
    const items = safeGet<WismaSuggestion[]>(STORAGE_KEYS.WISMA_SUGGESTIONS, initialSuggestions);
    return Array.isArray(items) && items.length > 0 ? items : initialSuggestions;
  },

  setWismaSuggestions(items: WismaSuggestion[]): void {
    const map = new Map<string, WismaSuggestion>();
    (items || []).forEach((it) => {
      if (it && it.id) map.set(it.id, it);
    });
    const sorted = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    safeSet(STORAGE_KEYS.WISMA_SUGGESTIONS, sorted);
  },

  async saveWismaSuggestion(suggestion: WismaSuggestion): Promise<void> {
    const current = this.getWismaSuggestions();
    const updated = [suggestion, ...current.filter((s) => s.id !== suggestion.id)];
    this.setWismaSuggestions(updated);

    // 1. Simpan ke Server API (/api/wisma-suggestions)
    try {
      fetch('/api/wisma-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(suggestion),
      }).catch(() => {});
    } catch {}

    // 2. Simpan ke Google Spreadsheet melalui action khusus 'save_wisma_suggestion' (Sheet: Kotak_Saran_Wisma)
    await this.syncWithGAS('save_wisma_suggestion', {
      suggestion,
    });

    // 3. Simpan juga sebagai Pesan Sistem (Sheet: Pesan_Guru) agar langsung tercatat di Google Spreadsheet
    //    meskipun pengguna belum memperbarui ulang deployment Apps Script ke versi terbaru
    const asMessage: Message = {
      id: `kotaksaran-${suggestion.id}`,
      studentId: suggestion.senderId,
      studentName: `${suggestion.senderName} (${suggestion.senderRole === 'guru' ? 'Guru' : 'Siswa'})`,
      className: `${suggestion.wismaName} • ${suggestion.category}`,
      content: `[KOTAK SARAN ${suggestion.wismaName}] (${suggestion.category}): ${suggestion.content}`,
      status: 'unread',
      createdAt: suggestion.createdAt,
    };
    this.addMessage(asMessage);
    await this.syncWithGAS('send_message', {
      message: asMessage,
    });

    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_wisma_suggestions_updated', { detail: updated }));
    } catch {}
  },

  async fetchWismaSuggestionsFromAllSources(): Promise<WismaSuggestion[]> {
    const map = new Map<string, WismaSuggestion>();
    this.getWismaSuggestions().forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });

    // 1. Tarik dari Server API (/api/wisma-suggestions)
    try {
      const res = await fetch('/api/wisma-suggestions');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          json.data.forEach((item: WismaSuggestion) => {
            if (item && item.id) map.set(item.id, item);
          });
        }
      }
    } catch {}

    // 2. Tarik dari Google Spreadsheet (Sheet 'Kotak_Saran_Wisma' & fallback 'Pesan_Guru')
    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_data');
        url.searchParams.set('_t', String(Date.now()));
        const gasRes = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (gasRes.ok) {
          const resData = await gasRes.json();
          if (Array.isArray(resData.wismaSuggestions)) {
            resData.wismaSuggestions.forEach((item: WismaSuggestion) => {
              if (item && item.id && item.content) {
                map.set(item.id, item);
              }
            });
          }
        }
      } catch {}
    }

    const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    this.setWismaSuggestions(merged);
    return merged;
  },

  // ==========================================================================
  // HASIL TES DI LAB DKV & TEFA (TERSINKRON KE SPREADSHEET: Hasil_Tes_Lab_DKV)
  // ==========================================================================
  getLabDkvTestResults(): LabDkvTestResult[] {
    const items = safeGet<LabDkvTestResult[]>(STORAGE_KEYS.LAB_DKV_RESULTS, []);
    return Array.isArray(items) ? items : [];
  },

  setLabDkvTestResults(items: LabDkvTestResult[]): void {
    const map = new Map<string, LabDkvTestResult>();
    (items || []).forEach((it) => {
      if (it && it.id) map.set(it.id, it);
    });
    const sorted = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    safeSet(STORAGE_KEYS.LAB_DKV_RESULTS, sorted.slice(0, 200));
  },

  async saveLabDkvTestResult(result: LabDkvTestResult): Promise<void> {
    const current = this.getLabDkvTestResults();
    const updated = [result, ...current.filter((r) => r.id !== result.id)];
    this.setLabDkvTestResults(updated);

    // 1. Catat perolehan XP ke log mingguan (7 hari terakhir) untuk Leaderboard Mingguan Balai Kota
    if (result.xpEarned > 0) {
      await this.logWeeklyXpGain({
        studentId: result.studentId,
        studentName: result.studentName,
        className: result.className,
        xpEarned: result.xpEarned,
        activityType: 'tes_lab_dkv',
        description: `Tes Lab DKV (${result.materiTitle}) • Skor ${result.scoreCorrect}/${result.totalQuestions}`,
      });
    }

    // 2. Kirim ke Sheet khusus 'Hasil_Tes_Lab_DKV' pada Google Apps Script v3.0
    await this.syncWithGAS('save_lab_dkv_test', {
      testResult: result,
    });

    // 3. Kirim juga ke submit_reflection bertanda [HASIL_TES_LAB_DKV] agar langsung tersimpan di Data_Refleksi_Siswa / Refleksi_Siswa
    //    meskipun deployment Apps Script lama belum sempat di-update ke v3.0
    const fallbackReflection: Reflection = {
      id: `labdkv-${result.id}`,
      studentId: result.studentId,
      studentName: result.studentName,
      studentNumber: 'HASIL_TES_LAB_DKV',
      className: result.className || 'X DKV 2',
      materiId: result.materiId || 'materi-lab-dkv',
      materiTitle: `[HASIL_TES_LAB_DKV] ${result.materiTitle} • Paket #${result.roundNumber} (${result.scoreCorrect}/${result.totalQuestions} Benar • +${result.xpEarned} XP)`,
      scale: Math.max(1, Math.min(5, result.scoreCorrect || 1)),
      moodEmoji: result.scoreCorrect >= 4 ? '🏆' : result.scoreCorrect >= 3 ? '🛠️' : '📝',
      answers: {
        understood: `Skor Tes Lab DKV: ${result.scoreCorrect} dari ${result.totalQuestions} Soal Benar (+${result.xpEarned} XP) | Paket #${result.roundNumber}`,
        difficult: `Rincian Jenjang 1-5: ${result.tierBreakdown}`,
        actionPlan: result.answersDetail || `Menyelesaikan evaluasi berjenjang materi "${result.materiTitle}" di Lab DKV & Tefa.`,
        findings: JSON.stringify(result),
        customAnswers: {
          Kategori: 'HASIL_TES_LAB_DKV',
          Skor_Benar: String(result.scoreCorrect),
          Total_Soal: String(result.totalQuestions),
          XP_Diperoleh: String(result.xpEarned),
          Rincian_Jenjang: result.tierBreakdown,
        },
      },
      createdAt: result.createdAt,
    };

    await this.syncWithGAS('submit_reflection', {
      reflection: fallbackReflection,
    });

    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_lab_dkv_updated', { detail: updated }));
    } catch {}
  },

  async fetchLabDkvTestResultsFromGAS(): Promise<LabDkvTestResult[]> {
    const map = new Map<string, LabDkvTestResult>();
    this.getLabDkvTestResults().forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });

    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_data');
        url.searchParams.set('_t', String(Date.now()));
        const gasRes = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (gasRes.ok) {
          const resData = await gasRes.json();
          // A. Dari array labDkvResults (Sheet 'Hasil_Tes_Lab_DKV' GAS v3.0)
          if (Array.isArray(resData.labDkvResults)) {
            resData.labDkvResults.forEach((item: any, idx: number) => {
              if (item && (item.id || item.studentName)) {
                const rec: LabDkvTestResult = {
                  id: String(item.id || `labdkv-sheet-${idx}`),
                  studentId: String(item.studentId || 'std-sheet'),
                  studentName: String(item.studentName || 'Siswa DKV'),
                  className: String(item.className || 'X DKV 2'),
                  materiId: String(item.materiId || 'materi-bk-01'),
                  materiTitle: String(item.materiTitle || 'Evaluasi Lab DKV'),
                  roundNumber: Number(item.roundNumber) || 1,
                  scoreCorrect: Number(item.scoreCorrect) || 0,
                  totalQuestions: Number(item.totalQuestions) || 5,
                  xpEarned: Number(item.xpEarned ?? item.scoreCorrect) || 0,
                  tierBreakdown: String(item.tierBreakdown || ''),
                  answersDetail: String(item.answersDetail || ''),
                  createdAt: String(item.createdAt || 'Hari ini'),
                  timestamp: Number(item.timestamp) || parseChatTimestamp(item.createdAt) || Date.now() - idx * 30000,
                };
                map.set(rec.id, rec);
              }
            });
          }

          // B. Dari refleksi bertanda [HASIL_TES_LAB_DKV]
          if (Array.isArray(resData.reflections)) {
            resData.reflections.forEach((r: Reflection, idx: number) => {
              const isLabTest =
                (r.id && String(r.id).startsWith('labdkv-')) ||
                (r.materiTitle && String(r.materiTitle).includes('[HASIL_TES_LAB_DKV]')) ||
                r.studentNumber === 'HASIL_TES_LAB_DKV';
              if (isLabTest) {
                try {
                  if (r.answers?.findings && r.answers.findings.startsWith('{')) {
                    const parsed: LabDkvTestResult = JSON.parse(r.answers.findings);
                    if (parsed && parsed.id) {
                      map.set(parsed.id, parsed);
                      return;
                    }
                  }
                } catch {}
                const cleanId = String(r.id).replace(/^labdkv-/, '');
                const score = Number(r.answers?.customAnswers?.['Skor_Benar'] ?? r.scale) || 0;
                const xp = Number(r.answers?.customAnswers?.['XP_Diperoleh'] ?? score) || 0;
                const rec: LabDkvTestResult = {
                  id: cleanId,
                  studentId: r.studentId,
                  studentName: r.studentName,
                  className: r.className || 'X DKV 2',
                  materiId: r.materiId || 'materi-bk-01',
                  materiTitle: String(r.materiTitle || 'Tes Lab DKV')
                    .replace('[HASIL_TES_LAB_DKV]', '')
                    .trim(),
                  roundNumber: 1,
                  scoreCorrect: score,
                  totalQuestions: 5,
                  xpEarned: xp,
                  tierBreakdown: r.answers?.difficult || '',
                  answersDetail: r.answers?.actionPlan || '',
                  createdAt: r.createdAt || 'Hari ini',
                  timestamp: parseChatTimestamp(r.createdAt) || Date.now() - idx * 30000,
                };
                map.set(rec.id, rec);
              }
            });
          }
        }
      } catch {}
    }

    const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    this.setLabDkvTestResults(merged);
    return merged;
  },

  // ==========================================================================
  // LOG XP MINGGUAN & LEADERBOARD MINGGUAN BALAI KOTA (7 HARI TERAKHIR DARI SPREADSHEET)
  // ==========================================================================
  getWeeklyXpLogs(): WeeklyXpLogEntry[] {
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - FOURTEEN_DAYS;
    const raw = safeGet<WeeklyXpLogEntry[]>(STORAGE_KEYS.WEEKLY_XP_LOGS, []);
    const valid = (Array.isArray(raw) ? raw : []).filter(
      (item) => item && item.id && (item.timestamp || 0) >= cutoff
    );
    return valid;
  },

  setWeeklyXpLogs(items: WeeklyXpLogEntry[]): void {
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - FOURTEEN_DAYS;
    const map = new Map<string, WeeklyXpLogEntry>();
    (items || []).forEach((it) => {
      if (it && it.id && (it.timestamp || 0) >= cutoff) {
        map.set(it.id, it);
      }
    });
    const sorted = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    safeSet(STORAGE_KEYS.WEEKLY_XP_LOGS, sorted.slice(0, 500));
  },

  async logWeeklyXpGain(params: {
    studentId: string;
    studentName: string;
    className: string;
    xpEarned: number;
    activityType: WeeklyXpLogEntry['activityType'];
    description: string;
  }): Promise<void> {
    if (!params.studentId || params.xpEarned <= 0) return;
    if (params.studentId.startsWith('teacher-') || params.studentId.startsWith('guest-')) return;

    const now = Date.now();
    const entry: WeeklyXpLogEntry = {
      id: `xplog-${now}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: params.studentId,
      studentName: params.studentName,
      className: params.className || 'X DKV 2',
      xpEarned: params.xpEarned,
      activityType: params.activityType,
      description: params.description,
      createdAt: new Date(now).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      timestamp: now,
    };

    const current = this.getWeeklyXpLogs();
    this.setWeeklyXpLogs([entry, ...current]);

    // Sync to Google Spreadsheet Sheet 'Log_XP_Mingguan' (GAS v3.0)
    await this.syncWithGAS('log_xp_gain', {
      xpLog: entry,
    });
  },

  /**
   * Menghitung & menarik Top 5 Warga dengan perolehan XP terbanyak dalam 7 hari terakhir
   * menggunakan data langsung dari Google Spreadsheet (Log_XP_Mingguan, Data_Refleksi_Siswa,
   * Hasil_Tes_Lab_DKV, Studio_On_Air_Podcast, Jurnal_Pohon_Beringin, Pesan_Kantor_Pos, Pasar_Prestasi_Siswa)
   * yang digabung dengan aktivitas 7 hari terakhir.
   */
  async fetchWeeklyLeaderboardFromSpreadsheet(): Promise<{
    top5: WeeklyLeaderboardCitizen[];
    syncedFromSheet: boolean;
    spreadsheetName: string;
    lastUpdated: string;
  }> {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const cutoff7Days = now - SEVEN_DAYS_MS;

    const allStudents = this.getStudents().filter((s) => !s.isTeacher && !s.isGuest);
    const studentByIdOrName = (id?: string, name?: string): Student | undefined => {
      if (id) {
        const byId = allStudents.find((s) => s.id === id);
        if (byId) return byId;
      }
      if (name) {
        const clean = name.trim().toLowerCase();
        const byName = allStudents.find((s) => s.name.trim().toLowerCase() === clean);
        if (byName) return byName;
      }
      return undefined;
    };

    interface AggregatedWeekly {
      studentId: string;
      studentName: string;
      className: string;
      gender: string;
      totalXp: number;
      weeklyXp: number;
      weeklyActivitiesCount: number;
      breakdown: {
        refleksi: number;
        tesLabDkv: number;
        podcast: number;
        misi: number;
        lainnya: number;
      };
      lastActivityText: string;
      lastTimestamp: number;
      seenEventKeys: Set<string>;
    }

    const aggMap = new Map<string, AggregatedWeekly>();

    const ensureCitizen = (id: string, name: string, className?: string): AggregatedWeekly => {
      const matched = studentByIdOrName(id, name);
      const canonicalId = matched?.id || id || `std-${name.toLowerCase().replace(/\s+/g, '-')}`;
      let entry = aggMap.get(canonicalId);
      if (!entry) {
        entry = {
          studentId: canonicalId,
          studentName: matched?.name || name || 'Warga DKV',
          className: matched?.className || className || 'X DKV 2',
          gender: matched?.gender || 'L',
          totalXp: matched?.points || 0,
          weeklyXp: 0,
          weeklyActivitiesCount: 0,
          breakdown: {
            refleksi: 0,
            tesLabDkv: 0,
            podcast: 0,
            misi: 0,
            lainnya: 0,
          },
          lastActivityText: 'Aktif di Kota Refleksia minggu ini',
          lastTimestamp: 0,
          seenEventKeys: new Set<string>(),
        };
        aggMap.set(canonicalId, entry);
      } else if (matched && matched.points > entry.totalXp) {
        entry.totalXp = matched.points;
      }
      return entry;
    };

    const addWeeklyEvent = (params: {
      eventKey: string;
      studentId: string;
      studentName: string;
      className?: string;
      xp: number;
      category: 'refleksi' | 'tesLabDkv' | 'podcast' | 'misi' | 'lainnya';
      label: string;
      timestamp: number;
    }) => {
      if (!params.studentName || params.xp <= 0) return;
      if (
        params.studentId.startsWith('teacher-') ||
        params.studentId.startsWith('guest-') ||
        params.studentName.toLowerCase().includes('guru')
      ) {
        return;
      }
      if (params.timestamp < cutoff7Days) return;

      const citizen = ensureCitizen(params.studentId, params.studentName, params.className);
      if (citizen.seenEventKeys.has(params.eventKey)) return;
      citizen.seenEventKeys.add(params.eventKey);

      citizen.weeklyXp += params.xp;
      citizen.weeklyActivitiesCount += 1;
      citizen.breakdown[params.category] += params.xp;

      if (params.timestamp >= citizen.lastTimestamp) {
        citizen.lastTimestamp = params.timestamp;
        citizen.lastActivityText = params.label;
      }
    };

    let syncedFromSheet = false;
    let spreadsheetName = 'Google Spreadsheet Kota Refleksia';

    // 1. Tarik data langsung dari Google Spreadsheet (doGet?action=get_data)
    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_data');
        url.searchParams.set('_t', String(Date.now()));

        const response = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });

        if (response.ok) {
          const resData = await response.json();
          syncedFromSheet = true;
          if (resData.spreadsheet) {
            spreadsheetName = String(resData.spreadsheet);
          }

          // A. Log_XP_Mingguan dari Spreadsheet (GAS v3.0)
          if (Array.isArray(resData.xpLogs)) {
            resData.xpLogs.forEach((log: any, idx: number) => {
              const ts = Number(log.timestamp) || parseChatTimestamp(log.createdAt) || now - idx * 30000;
              const actType = String(log.activityType || '');
              const cat: 'refleksi' | 'tesLabDkv' | 'podcast' | 'misi' | 'lainnya' =
                actType === 'refleksi'
                  ? 'refleksi'
                  : actType === 'tes_lab_dkv'
                  ? 'tesLabDkv'
                  : actType === 'podcast'
                  ? 'podcast'
                  : actType === 'misi'
                  ? 'misi'
                  : 'lainnya';
              addWeeklyEvent({
                eventKey: `xplog-${log.id || `${log.studentId}-${ts}`}`,
                studentId: String(log.studentId || ''),
                studentName: String(log.studentName || ''),
                className: String(log.className || ''),
                xp: Number(log.xpEarned) || 1,
                category: cat,
                label: String(log.description || 'Aktivitas Mingguan Spreadsheet'),
                timestamp: ts,
              });
            });
          }

          // B. Hasil_Tes_Lab_DKV dari Spreadsheet (GAS v3.0)
          if (Array.isArray(resData.labDkvResults)) {
            resData.labDkvResults.forEach((t: any, idx: number) => {
              const ts = Number(t.timestamp) || parseChatTimestamp(t.createdAt) || now - idx * 45000;
              const xp = Number(t.xpEarned ?? t.scoreCorrect) || 1;
              addWeeklyEvent({
                eventKey: `labdkv-${t.id || `${t.studentId}-${ts}`}`,
                studentId: String(t.studentId || ''),
                studentName: String(t.studentName || ''),
                className: String(t.className || ''),
                xp,
                category: 'tesLabDkv',
                label: `Tes Lab DKV: ${t.materiTitle || 'Evaluasi 5 Jenjang'} (+${xp} XP)`,
                timestamp: ts,
              });
            });
          }

          // C. Studio_On_Air_Podcast / Hasil_Podcast_Siswa dari Spreadsheet
          if (Array.isArray(resData.podcasts)) {
            resData.podcasts.forEach((p: any, idx: number) => {
              const ts = Number(p.timestamp) || parseChatTimestamp(p.createdAt) || now - idx * 60000;
              addWeeklyEvent({
                eventKey: `pod-${p.id || `${p.studentId}-${ts}`}`,
                studentId: String(p.studentId || ''),
                studentName: String(p.studentName || ''),
                className: String(p.className || ''),
                xp: Number(p.xpEarned) || 2,
                category: 'podcast',
                label: `Podcast ON AIR: ${p.materiTitle || 'Dialog Refleksi AI'}`,
                timestamp: ts,
              });
            });
          }

          // D. Data_Refleksi_Siswa / Refleksi_Siswa dari Spreadsheet
          if (Array.isArray(resData.reflections)) {
            resData.reflections.forEach((r: Reflection, idx: number) => {
              if (!r || !r.studentName) return;
              const titleStr = String(r.materiTitle || '');
              if (titleStr.includes('[BANK_MATERI_AI]') || r.studentNumber === 'BANK_MATERI_AI') {
                return;
              }

              const ts = parseChatTimestamp(r.createdAt) || now - idx * 60000;

              // Jika baris refleksi adalah [PASAR_PRESTASI], sinkronkan statistik mingguan dari Spreadsheet
              if (
                (r.id && String(r.id).startsWith('prestasi-')) ||
                titleStr.includes('[PASAR_PRESTASI]') ||
                r.studentNumber === 'PASAR_PRESTASI'
              ) {
                const pts = Number(r.answers?.customAnswers?.['points']) || 0;
                const citizen = ensureCitizen(r.studentId, r.studentName, r.className);
                if (pts > citizen.totalXp) citizen.totalXp = pts;
                return;
              }

              // Jika baris refleksi adalah [HASIL_TES_LAB_DKV]
              if (
                (r.id && String(r.id).startsWith('labdkv-')) ||
                titleStr.includes('[HASIL_TES_LAB_DKV]') ||
                r.studentNumber === 'HASIL_TES_LAB_DKV'
              ) {
                const cleanId = String(r.id).replace(/^labdkv-/, '');
                const xp = Number(r.answers?.customAnswers?.['XP_Diperoleh'] ?? r.scale) || 1;
                addWeeklyEvent({
                  eventKey: `labdkv-${cleanId}`,
                  studentId: r.studentId,
                  studentName: r.studentName,
                  className: r.className,
                  xp,
                  category: 'tesLabDkv',
                  label: `Tes Lab DKV (${r.scale}/5 Benar • +${xp} XP)`,
                  timestamp: ts,
                });
                return;
              }

              // Jika baris refleksi adalah [PODCAST_MENARA_MENTOR]
              if (
                (r.id && String(r.id).startsWith('pod-')) ||
                titleStr.includes('[PODCAST_MENARA_MENTOR]') ||
                r.studentNumber === 'PODCAST'
              ) {
                addWeeklyEvent({
                  eventKey: `pod-${r.id}`,
                  studentId: r.studentId,
                  studentName: r.studentName,
                  className: r.className,
                  xp: 2,
                  category: 'podcast',
                  label: `Podcast Studio ON AIR: ${titleStr.replace('[PODCAST_MENARA_MENTOR]', '').trim()}`,
                  timestamp: ts,
                });
                return;
              }

              // Jika baris refleksi adalah [JURNAL_POHON_BERINGIN]
              if (
                (r.id && String(r.id).startsWith('pohon-')) ||
                titleStr.includes('[JURNAL_POHON_BERINGIN]') ||
                r.studentNumber === 'POHON_JURNAL'
              ) {
                addWeeklyEvent({
                  eventKey: `pohon-${r.id}`,
                  studentId: r.studentId,
                  studentName: r.studentName,
                  className: r.className,
                  xp: 1,
                  category: 'refleksi',
                  label: 'Jurnal Harian Pohon Beringin (+1 XP)',
                  timestamp: ts,
                });
                return;
              }

              // Refleksi Siswa reguler di Data_Refleksi_Siswa
              addWeeklyEvent({
                eventKey: `ref-${r.id}`,
                studentId: r.studentId,
                studentName: r.studentName,
                className: r.className,
                xp: 2,
                category: 'refleksi',
                label: `Refleksi: ${titleStr || 'Pusat Refleksi Kota'}`,
                timestamp: ts,
              });
            });
          }

          // E. Pesan_Kantor_Pos / Pesan_Guru dari Spreadsheet
          if (Array.isArray(resData.messages)) {
            resData.messages.forEach((m: Message, idx: number) => {
              if (!m || !m.studentName || String(m.studentId).startsWith('teacher-')) return;
              const ts = parseChatTimestamp(m.createdAt) || now - idx * 90000;
              addWeeklyEvent({
                eventKey: `msg-${m.id}`,
                studentId: m.studentId,
                studentName: m.studentName,
                className: m.className,
                xp: 1,
                category: 'lainnya',
                label: 'Kirim Surat Konsultasi di Kantor Pos (+1 XP)',
                timestamp: ts,
              });
            });
          }

          // F. Pasar_Prestasi_Siswa dari Spreadsheet (Rekap XP 7 Hari Terakhir)
          if (Array.isArray(resData.pasarPrestasi)) {
            resData.pasarPrestasi.forEach((row: any) => {
              if (!row || !row.name) return;
              const citizen = ensureCitizen(String(row.id || ''), String(row.name), String(row.className || ''));
              const sheetPts = Number(row.points) || 0;
              if (sheetPts > citizen.totalXp) {
                citizen.totalXp = sheetPts;
              }
              const st = row.activityStats || {};
              const reflCount = Number(st.reflections) || 0;
              const quizCount = Number(st.quizzes) || 0;
              const missionCount = Number(st.missions) || 0;
              const msgCount = Number(st.messages) || 0;
              const computed7DayXp = Math.max(
                Number(row.weeklyXp) || 0,
                reflCount * 2 + quizCount * 3 + missionCount * 2 + msgCount
              );
              if (computed7DayXp > citizen.weeklyXp) {
                citizen.weeklyXp = computed7DayXp;
                citizen.weeklyActivitiesCount = Math.max(
                  citizen.weeklyActivitiesCount,
                  reflCount + quizCount + missionCount + msgCount
                );
                citizen.breakdown.refleksi = Math.max(citizen.breakdown.refleksi, reflCount * 2);
                citizen.breakdown.tesLabDkv = Math.max(citizen.breakdown.tesLabDkv, quizCount * 3);
                citizen.breakdown.misi = Math.max(citizen.breakdown.misi, missionCount * 2);
                citizen.breakdown.lainnya = Math.max(citizen.breakdown.lainnya, msgCount);
              }
            });
          }
        }
      } catch (e) {
        // Fallback ke cache lokal yang tersinkron
      }
    }

    // 2. Gabungkan dengan data lokal 7 hari terakhir (Log XP Mingguan, Hasil Tes Lab DKV, Refleksi, Pesan Kantor Pos)
    this.getWeeklyXpLogs().forEach((log) => {
      const cat: 'refleksi' | 'tesLabDkv' | 'podcast' | 'misi' | 'lainnya' =
        log.activityType === 'refleksi'
          ? 'refleksi'
          : log.activityType === 'tes_lab_dkv'
          ? 'tesLabDkv'
          : log.activityType === 'podcast'
          ? 'podcast'
          : log.activityType === 'misi'
          ? 'misi'
          : 'lainnya';
      addWeeklyEvent({
        eventKey: `xplog-${log.id}`,
        studentId: log.studentId,
        studentName: log.studentName,
        className: log.className,
        xp: log.xpEarned,
        category: cat,
        label: log.description,
        timestamp: log.timestamp,
      });
    });

    this.getLabDkvTestResults().forEach((t) => {
      addWeeklyEvent({
        eventKey: `labdkv-${t.id}`,
        studentId: t.studentId,
        studentName: t.studentName,
        className: t.className,
        xp: t.xpEarned || t.scoreCorrect || 1,
        category: 'tesLabDkv',
        label: `Tes Lab DKV: ${t.materiTitle} (${t.scoreCorrect}/${t.totalQuestions} Benar)`,
        timestamp: t.timestamp,
      });
    });

    this.getReflections().forEach((r) => {
      const ts = parseChatTimestamp(r.createdAt);
      addWeeklyEvent({
        eventKey: `ref-${r.id}`,
        studentId: r.studentId,
        studentName: r.studentName,
        className: r.className,
        xp: 2,
        category: 'refleksi',
        label: `Refleksi: ${r.materiTitle || 'Pusat Refleksi'}`,
        timestamp: ts,
      });
    });

    this.getMessages().forEach((m) => {
      if (String(m.studentId).startsWith('teacher-')) return;
      const ts = parseChatTimestamp(m.createdAt);
      addWeeklyEvent({
        eventKey: `msg-${m.id}`,
        studentId: m.studentId,
        studentName: m.studentName,
        className: m.className,
        xp: 1,
        category: 'lainnya',
        label: 'Surat Konsultasi Kantor Pos (+1 XP)',
        timestamp: ts,
      });
    });

    // 3. Pastikan seluruh warga aktif terdata dengan capaian XP 7 hari terakhir
    allStudents.forEach((s) => {
      const citizen = ensureCitizen(s.id, s.name, s.className);
      const stats = this.getStudentActivityStats(s);
      const estimatedWeeklyXp =
        (stats.reflections || 0) * 2 +
        (stats.quizzes || 0) * 3 +
        (stats.missions || 0) * 2 +
        (stats.messages || 0) * 1 +
        (stats.chats || 0) * 1;

      if (citizen.weeklyXp < estimatedWeeklyXp) {
        citizen.weeklyXp = estimatedWeeklyXp;
        citizen.weeklyActivitiesCount = Math.max(citizen.weeklyActivitiesCount, stats.total || 1);
        citizen.breakdown.refleksi = Math.max(citizen.breakdown.refleksi, (stats.reflections || 0) * 2);
        citizen.breakdown.tesLabDkv = Math.max(citizen.breakdown.tesLabDkv, (stats.quizzes || 0) * 3);
        citizen.breakdown.misi = Math.max(citizen.breakdown.misi, (stats.missions || 0) * 2);
        citizen.breakdown.lainnya = Math.max(
          citizen.breakdown.lainnya,
          (stats.messages || 0) + (stats.chats || 0)
        );
        if (citizen.lastTimestamp === 0) {
          citizen.lastActivityText = `Tuntas ${stats.reflections} Refleksi, ${stats.quizzes} Tes Lab DKV & ${stats.missions} Misi Kota`;
        }
      }
    });

    const sortedCitizens = Array.from(aggMap.values())
      .sort((a, b) => {
        if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
        if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
        return b.weeklyActivitiesCount - a.weeklyActivitiesCount;
      })
      .slice(0, 5)
      .map((item, idx): WeeklyLeaderboardCitizen => ({
        rank: idx + 1,
        studentId: item.studentId,
        studentName: item.studentName,
        className: item.className,
        gender: item.gender,
        weeklyXp: item.weeklyXp,
        totalXp: item.totalXp,
        weeklyActivitiesCount: item.weeklyActivitiesCount,
        breakdown: item.breakdown,
        lastActivityText: item.lastActivityText,
      }));

    return {
      top5: sortedCitizens,
      syncedFromSheet,
      spreadsheetName,
      lastUpdated: new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  },

  // ============================================================================
  // POS GERBANG SELAMAT DATANG — LOG WARGA MASUK KOTA HARI INI (KOMANDAN NAWA)
  // ============================================================================
  getTodayWitaDateMeta(now = new Date()): { dateKey: string; dateDisplay: string; timeWita: string } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now); // YYYY-MM-DD
    const dateDisplay = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Makassar',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(now);
    const timeWita =
      new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now) + ' WITA';
    return { dateKey: parts, dateDisplay, timeWita };
  },

  recordCityEntry(student: Student | null | undefined): CityEntryLogEntry | null {
    if (!student || !student.name) return null;
    const now = new Date();
    const { dateKey, dateDisplay, timeWita } = this.getTodayWitaDateMeta(now);
    const allLogs = safeGet<CityEntryLogEntry[]>(STORAGE_KEYS.CITY_ENTRY_LOGS, []);

    const role: 'siswa' | 'guru' | 'tamu' = student.isTeacher
      ? 'guru'
      : student.isGuest
      ? 'tamu'
      : 'siswa';

    const newEntry: CityEntryLogEntry = {
      id: `entry-${student.id || student.name}-${now.getTime()}`,
      studentId: student.id || student.name,
      studentName: student.name,
      className: student.className || (role === 'guru' ? 'Dewan Guru' : role === 'tamu' ? 'Tamu Kota' : 'Warga DKV'),
      gender: student.gender,
      role,
      enteredAtTime: timeWita,
      dateKey,
      dateDisplay,
      timestamp: now.getTime(),
    };

    // Simpan 1 entri terbaru per warga untuk hari yang sama namun perbarui timestamp jika login ulang
    const filtered = allLogs.filter(
      (item) =>
        !(
          item.dateKey === dateKey &&
          (item.studentId === newEntry.studentId ||
            item.studentName.trim().toLowerCase() === newEntry.studentName.trim().toLowerCase())
        )
    );

    const updated = [newEntry, ...filtered].slice(0, 120);
    safeSet(STORAGE_KEYS.CITY_ENTRY_LOGS, updated);
    try {
      window.dispatchEvent(new CustomEvent('city-entry-updated', { detail: updated }));
    } catch {}
    return newEntry;
  },

  getTodayCityEntries(extraOnlinePlayers?: Array<{ id?: string; name?: string; role?: string; gender?: string }>): {
    todayEntries: CityEntryLogEntry[];
    lastEntry: CityEntryLogEntry | null;
    dateDisplay: string;
  } {
    const now = new Date();
    const { dateKey, dateDisplay, timeWita } = this.getTodayWitaDateMeta(now);
    const isoToday = now.toISOString().slice(0, 10);

    const storedLogs = safeGet<CityEntryLogEntry[]>(STORAGE_KEYS.CITY_ENTRY_LOGS, []);
    const byNameMap = new Map<string, CityEntryLogEntry>();

    // 1. Masukkan log masuk eksplisit hari ini
    storedLogs
      .filter((item) => item.dateKey === dateKey || item.dateKey === isoToday)
      .sort((a, b) => b.timestamp - a.timestamp)
      .forEach((item) => {
        const key = item.studentName.trim().toLowerCase();
        if (!byNameMap.has(key)) {
          byNameMap.set(key, item);
        }
      });

    // 2. Pastikan pengguna yang sedang login saat ini selalu tercatat masuk hari ini
    const curUser = this.getCurrentStudent();
    if (curUser && curUser.name) {
      const key = curUser.name.trim().toLowerCase();
      if (!byNameMap.has(key)) {
        const created = this.recordCityEntry(curUser);
        if (created) {
          byNameMap.set(key, created);
        }
      }
    }

    // 3. Gabungkan dengan pemain online di kota (jika ada dari realtime presence)
    if (Array.isArray(extraOnlinePlayers)) {
      extraOnlinePlayers.forEach((p, idx) => {
        const pName = (p.name || '').trim();
        if (!pName) return;
        const key = pName.toLowerCase();
        if (!byNameMap.has(key)) {
          byNameMap.set(key, {
            id: `online-${p.id || key}`,
            studentId: p.id || key,
            studentName: pName,
            className: p.role === 'guru' ? 'Dewan Guru' : p.role === 'wartawan' ? 'Tamu Kota' : 'Warga Kota Online',
            gender: p.gender,
            role: p.role === 'guru' ? 'guru' : p.role === 'wartawan' ? 'tamu' : 'siswa',
            enteredAtTime: timeWita,
            dateKey,
            dateDisplay,
            timestamp: now.getTime() - (idx + 1) * 30000,
          });
        }
      });
    }

    // 4. Gabungkan dengan data siswa yang lastLogin-nya hari ini
    const allStudents = this.getStudents();
    allStudents.forEach((s, idx) => {
      if (!s.name) return;
      const sLast = String(s.lastLogin || '');
      if (sLast === dateKey || sLast === isoToday || sLast.includes(dateDisplay)) {
        const key = s.name.trim().toLowerCase();
        if (!byNameMap.has(key)) {
          byNameMap.set(key, {
            id: `student-today-${s.id}`,
            studentId: s.id,
            studentName: s.name,
            className: s.className || 'Warga DKV',
            gender: s.gender,
            role: s.isTeacher ? 'guru' : s.isGuest ? 'tamu' : 'siswa',
            enteredAtTime: 'Hari Ini (WITA)',
            dateKey,
            dateDisplay,
            timestamp: now.getTime() - 180000 - idx * 60000,
          });
        }
      }
    });

    const todayEntries = Array.from(byNameMap.values()).sort((a, b) => b.timestamp - a.timestamp);
    const lastEntry = todayEntries.length > 0 ? todayEntries[0] : null;

    return {
      todayEntries,
      lastEntry,
      dateDisplay,
    };
  },

  getNawaDynamicSpeeches(extraOnlinePlayers?: Array<{ id?: string; name?: string; role?: string; gender?: string }>): string[] {
    const { todayEntries, lastEntry, dateDisplay } = this.getTodayCityEntries(extraOnlinePlayers);
    if (todayEntries.length === 0) {
      return [
        `🦅 Siap komando! Saya Nawa, Penjaga Gerbang Selamat Datang Kota Refleksia (${dateDisplay}).`,
        '🦅 Belum ada warga lain yang tercatat melintasi gerbang hari ini. Mari awali aktivitas belajarmu!',
        '🦅 Pastikan kamu membaca Papan Peraturan & Panduan Kota di sebelah kanan gerbang sebelum menjelajah!',
      ];
    }

    const namesPreview = todayEntries
      .slice(0, 5)
      .map((e) => e.studentName)
      .join(', ');
    const moreCount = todayEntries.length > 5 ? ` (+${todayEntries.length - 5} warga lainnya)` : '';
    const lastInfo = lastEntry
      ? `${lastEntry.studentName} (${lastEntry.className}) pukul ${lastEntry.enteredAtTime}`
      : '-';

    return [
      `🦅 Salam tegas! Saya Nawa, Penjaga Gerbang Utama. Hari ini (${dateDisplay}) tercatat ${todayEntries.length} warga masuk kota: ${namesPreview}${moreCount}!`,
      `🦅 Laporan Gerbang: Warga TERAKHIR yang baru saja masuk ke Kota Refleksia adalah ${lastInfo}!`,
      `🦅 Daftar hadir gerbang hari ini (${todayEntries.length} warga): ${namesPreview}${moreCount}. Klik saya untuk melihat Buku Tamu Gerbang lengkap!`,
    ];
  },

  syncCityBuildingsToSpreadsheet(): void {
    const buildingsPayload = Object.values(CITY_BUILDINGS_GOVERNANCE).map((b) => ({
      id: b.id,
      name: b.name,
      wx: b.wx,
      wy: b.wy,
      zone: b.zone,
      category: b.category,
      description: b.shortDescription,
      learningObjective: b.learningObjective,
      capacity: b.capacity,
      openingHours: b.openingHours,
      status: isBuildingLockedByTeacher(b.id) ? 'Terkunci' : 'Terbuka',
      updatedAt: new Date().toLocaleString('id-ID'),
    }));
    this.syncWithGAS('sync_city_buildings', { buildings: buildingsPayload });
  },

  // ==========================================================================
  // MASTER CREATOR STUDIO (KIKYBAHSOAN) — REALTIME & CLOUD PERSISTENCE
  // ==========================================================================
  _creatorGasSyncTimer: null as any,

  normalizeCreatorCityState(raw: any): CityCreatorState {
    const defaultState: CityCreatorState = {
      version: 0,
      updatedAt: new Date().toLocaleString('id-ID'),
      updatedBy: 'kikybahsoan',
      customBuildings: [],
      existingOverrides: {},
      npcConfigs: {},
      customProps: [],
      customAnimals: [],
      terrainTiles: {},
      customFences: [],
    };
    if (!raw || typeof raw !== 'object') return defaultState;
    const rawBuildings: CreatorBuildingItem[] = Array.isArray(raw.customBuildings)
      ? raw.customBuildings.map((b: CreatorBuildingItem) => {
          if (
            b &&
            (b.id === 'cbuild-mw7csayu-ahr' ||
              b.name === 'Menara Inovasi Digital' ||
              (b.modelType === 'modern_tower' && Math.abs(b.wx - 9.5) < 0.8 && Math.abs(b.wy - -3.5) < 0.8))
          ) {
            return {
              ...b,
              name: 'Menara Asesmen Individu',
              tagline: 'Asesmen Sumatif Mandiri Berbasis Lobi (TKA Individu)',
              icon: '📝',
              templateData: {
                ...(b.templateData || {}),
                welcomeText:
                  'Selamat datang di Menara Asesmen Individu! Fasilitas evaluasi sumatif mandiri berbasis lobi dengan standar TKA (Pilihan Ganda Tunggal, Kompleks MCMA, dan Kategori Berstimulus).',
                infoContent:
                  'Menara Asesmen Individu adalah pusat asesmen sumatif mandiri berbasis lobi (mirip TKA/CBT) di Kota Refleksia.\n\n• Siswa masuk ke lobi asesmen dan mengerjakan paket soal teracak secara mandiri.\n• Soal disusun otomatis dari Tujuan Pembelajaran (TP) pada Bank Materi Kota Refleksia.',
              },
            };
          }
          return b;
        })
      : [];
    return {
      version: typeof raw.version === 'number' ? raw.version : 0,
      updatedAt: raw.updatedAt || defaultState.updatedAt,
      updatedBy: raw.updatedBy || 'kikybahsoan',
      customBuildings: rawBuildings,
      existingOverrides:
        raw.existingOverrides && typeof raw.existingOverrides === 'object'
          ? raw.existingOverrides
          : {},
      npcConfigs:
        raw.npcConfigs && typeof raw.npcConfigs === 'object' ? raw.npcConfigs : {},
      customProps: Array.isArray(raw.customProps) ? raw.customProps : [],
      customAnimals: Array.isArray(raw.customAnimals) ? raw.customAnimals : [],
      terrainTiles:
        raw.terrainTiles && typeof raw.terrainTiles === 'object' ? raw.terrainTiles : {},
      customFences: Array.isArray(raw.customFences) ? raw.customFences : [],
    };
  },

  getCreatorCityState(): CityCreatorState {
    const saved = safeGet<CityCreatorState | null>(STORAGE_KEYS.CREATOR_CITY_STATE, null);
    return this.normalizeCreatorCityState(saved);
  },

  async saveCreatorCityState(
    nextState: CityCreatorState,
    options?: {
      syncCloud?: boolean;
      broadcast?: boolean;
      preserveVersion?: boolean;
      immediateCloud?: boolean;
    }
  ): Promise<CityCreatorState> {
    const normalized = this.normalizeCreatorCityState(nextState);
    const nextVersion =
      options?.preserveVersion && normalized.version > 0
        ? normalized.version
        : Math.max((normalized.version || 0) + 1, Date.now());

    const cleanState: CityCreatorState = {
      ...normalized,
      version: nextVersion,
      updatedAt:
        options?.preserveVersion && nextState.updatedAt
          ? nextState.updatedAt
          : new Date().toLocaleString('id-ID', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
      updatedBy: normalized.updatedBy || 'kikybahsoan',
    };

    safeSet(STORAGE_KEYS.CREATOR_CITY_STATE, cleanState);

    if (options?.broadcast !== false) {
      try {
        window.dispatchEvent(
          new CustomEvent('kota_refleksi_creator_state_updated', { detail: cleanState })
        );
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc1 = new BroadcastChannel('kota_refleksi_channel');
          bc1.postMessage({ type: 'creator_city_updated', data: cleanState });
          bc1.close();

          const bc2 = new BroadcastChannel('kota_refleksi_presence');
          bc2.postMessage({ type: 'creator_city_updated', data: cleanState });
          bc2.close();
        }
      } catch {}
    }

    if (options?.syncCloud !== false) {
      // 1. Instant push to Express Backend (/api/creator-city-state) which broadcasts via SSE to all online citizens in <20ms
      try {
        fetch('/api/creator-city-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorCityState: cleanState }),
        }).catch(() => {});
      } catch {}

      // 2. Push to Google Spreadsheet / Apps Script (immediately on "Simpan ke Kota", or debounced 600ms during live drags)
      const pushToGAS = async () => {
        const payloadReflection: Reflection = {
          id: `creator-city-state-v${cleanState.version}`,
          studentId: 'master-kikybahsoan',
          studentName: 'Master Creator (kikybahsoan)',
          studentNumber: 'CREATOR_CITY_STATE',
          className: 'Master Studio Kota Refleksia',
          materiId: 'creator-city-state',
          materiTitle: `[CREATOR_CITY_STATE] Tata Kota & Fasilitas (v${cleanState.version})`,
          scale: 5,
          moodEmoji: '🏗️',
          answers: {
            understood: `Tata Kota diperbarui oleh ${cleanState.updatedBy} pada ${cleanState.updatedAt}`,
            difficult: `Bangunan: ${cleanState.customBuildings.length} | Taman: ${(cleanState.customProps || []).length} | Hewan: ${(cleanState.customAnimals || []).length} | Pagar: ${(cleanState.customFences || []).length} | Tanah: ${Object.keys(cleanState.terrainTiles || {}).length}`,
            actionPlan: 'Sinkronisasi otomatis tata kota ke seluruh warga Kota Refleksia',
            findings: JSON.stringify(cleanState),
          },
          createdAt: cleanState.updatedAt,
        };
        await this.syncWithGAS('save_creator_city_state', { creatorCityState: cleanState });
        await this.syncWithGAS('submit_reflection', { reflection: payloadReflection });
      };

      if (this._creatorGasSyncTimer) {
        clearTimeout(this._creatorGasSyncTimer);
        this._creatorGasSyncTimer = null;
      }

      if (options?.immediateCloud) {
        await pushToGAS();
      } else {
        this._creatorGasSyncTimer = setTimeout(() => {
          this._creatorGasSyncTimer = null;
          pushToGAS().catch(() => {});
        }, 600);
      }
    }

    return cleanState;
  },

  async fetchCreatorCityStateFromCloud(): Promise<CityCreatorState> {
    const local = this.getCreatorCityState();
    let bestRemote: CityCreatorState | null = null;
    let serverVersion = 0;

    // 1. Check Express Server (/api/creator-city-state) first (fastest, <20ms)
    try {
      const serverRes = await fetch(`/api/creator-city-state?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
      });
      if (serverRes.ok) {
        const serverJson = await serverRes.json();
        if (serverJson?.data && typeof serverJson.data.version === 'number') {
          const parsedServer = this.normalizeCreatorCityState(serverJson.data);
          serverVersion = parsedServer.version;
          bestRemote = parsedServer;
        }
      }
    } catch {}

    // 2. Also check Google Spreadsheet / Google Apps Script Web App
    const settings = this.getSettings();
    if (settings.gasWebAppUrl && settings.gasWebAppUrl.startsWith('http')) {
      try {
        const url = new URL(settings.gasWebAppUrl);
        url.searchParams.set('action', 'get_data');
        url.searchParams.set('_t', String(Date.now()));
        const res = await fetch(url.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.creatorCityState && typeof data.creatorCityState === 'object') {
            const parsedGas = this.normalizeCreatorCityState(data.creatorCityState);
            if (!bestRemote || parsedGas.version > bestRemote.version) {
              bestRemote = parsedGas;
            }
          }

          if (Array.isArray(data.reflections)) {
            data.reflections.forEach((r: Reflection) => {
              const isCreatorRow =
                r &&
                (String(r.id || '').startsWith('creator-city-state') ||
                  r.studentNumber === 'CREATOR_CITY_STATE' ||
                  (r.materiTitle && String(r.materiTitle).includes('[CREATOR_CITY_STATE]')));
              if (isCreatorRow && r.answers?.findings) {
                try {
                  const parsed = this.normalizeCreatorCityState(JSON.parse(r.answers.findings));
                  if (
                    parsed &&
                    parsed.version > 0 &&
                    (!bestRemote || parsed.version > bestRemote.version)
                  ) {
                    bestRemote = parsed;
                  }
                } catch {}
              }
            });
          }
        }
      } catch {}
    }

    // If GAS had a newer state than the Express server, backfill the Express server so all connected citizens get it
    if (bestRemote && bestRemote.version > serverVersion) {
      try {
        fetch('/api/creator-city-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorCityState: bestRemote }),
        }).catch(() => {});
      } catch {}
    }

    // If local state is newer than remote (e.g., kikybahsoan just made changes before server restarted), push local to server
    if (local.version > (bestRemote?.version || 0) && local.version > serverVersion) {
      try {
        fetch('/api/creator-city-state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creatorCityState: local }),
        }).catch(() => {});
      } catch {}
    }

    if (bestRemote && bestRemote.version > local.version) {
      safeSet(STORAGE_KEYS.CREATOR_CITY_STATE, bestRemote);
      try {
        window.dispatchEvent(
          new CustomEvent('kota_refleksi_creator_state_updated', { detail: bestRemote })
        );
      } catch {}
      return bestRemote;
    }

    return local;
  },

  async submitCreatorBuildingIdea(
    buildingId: string,
    idea: Omit<CreatorIdeaItem, 'id' | 'votes' | 'votedBy' | 'createdAt'>
  ): Promise<CityCreatorState> {
    const state = this.getCreatorCityState();
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const newIdea: CreatorIdeaItem = {
      id: `idea-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      authorId: idea.authorId,
      authorName: idea.authorName,
      className: idea.className,
      content: sanitizeStudentInputText(idea.content).cleanText,
      votes: 1,
      votedBy: [idea.authorId],
      createdAt: nowStr,
    };
    const updatedBuildings = state.customBuildings.map((b) => {
      if (b.id !== buildingId) return b;
      const existingIdeas = Array.isArray(b.templateData.ideas) ? b.templateData.ideas : [];
      return {
        ...b,
        templateData: {
          ...b.templateData,
          ideas: [newIdea, ...existingIdeas],
        },
      };
    });
    return this.saveCreatorCityState({ ...state, customBuildings: updatedBuildings });
  },

  async voteCreatorBuildingIdea(
    buildingId: string,
    ideaId: string,
    voterId: string
  ): Promise<CityCreatorState> {
    const state = this.getCreatorCityState();
    const updatedBuildings = state.customBuildings.map((b) => {
      if (b.id !== buildingId) return b;
      const existingIdeas = Array.isArray(b.templateData.ideas) ? b.templateData.ideas : [];
      const nextIdeas = existingIdeas.map((item) => {
        if (item.id !== ideaId) return item;
        const votedSet = new Set(item.votedBy || []);
        if (votedSet.has(voterId)) {
          votedSet.delete(voterId);
        } else {
          votedSet.add(voterId);
        }
        return {
          ...item,
          votedBy: Array.from(votedSet),
          votes: votedSet.size,
        };
      });
      return {
        ...b,
        templateData: {
          ...b.templateData,
          ideas: nextIdeas,
        },
      };
    });
    return this.saveCreatorCityState({ ...state, customBuildings: updatedBuildings });
  },

  async submitCreatorBuildingMission(
    buildingId: string,
    submission: Omit<CreatorMissionSubmission, 'id' | 'createdAt'>
  ): Promise<CityCreatorState> {
    const state = this.getCreatorCityState();
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
    const newSub: CreatorMissionSubmission = {
      id: `msub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
      studentId: submission.studentId,
      studentName: submission.studentName,
      className: submission.className,
      responseText: sanitizeStudentInputText(submission.responseText).cleanText,
      createdAt: nowStr,
    };
    const updatedBuildings = state.customBuildings.map((b) => {
      if (b.id !== buildingId) return b;
      const prev = Array.isArray(b.templateData.submissions) ? b.templateData.submissions : [];
      return {
        ...b,
        templateData: {
          ...b.templateData,
          submissions: [newSub, ...prev.slice(0, 49)],
        },
      };
    });
    return this.saveCreatorCityState({ ...state, customBuildings: updatedBuildings });
  },

  async recordCreatorBuildingQuizScore(
    buildingId: string,
    entry: { studentId: string; studentName: string; score: number }
  ): Promise<CityCreatorState> {
    const state = this.getCreatorCityState();
    const nowStr = new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
    const updatedBuildings = state.customBuildings.map((b) => {
      if (b.id !== buildingId) return b;
      const prev = Array.isArray(b.templateData.highScores) ? b.templateData.highScores : [];
      const filtered = prev.filter((h) => h.studentId !== entry.studentId);
      const merged = [
        ...filtered,
        {
          studentId: entry.studentId,
          studentName: entry.studentName,
          score: entry.score,
          date: nowStr,
        },
      ].sort((a, b) => b.score - a.score);
      return {
        ...b,
        templateData: {
          ...b.templateData,
          highScores: merged.slice(0, 15),
        },
      };
    });
    return this.saveCreatorCityState({ ...state, customBuildings: updatedBuildings });
  },

  // -------------------------------------------------------------
  // SINKRONISASI ARENA RUMAH MISTERI KE GOOGLE SPREADSHEET
  // Sheet baru: Game_Ronde, Game_Pilihan, Game_Skor
  // -------------------------------------------------------------
  async syncMysteryArenaRondeToGAS(params: {
    ronde: GameRondeRow;
    teacherId: string;
    teacherName: string;
    teacherPin?: string;
  }): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_mystery_arena_ronde',
          teacherId: params.teacherId,
          teacherName: params.teacherName,
          teacherPin: params.teacherPin || settings.teacherPin || '1234',
          ronde: params.ronde,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Game_Ronde ke Spreadsheet:', e);
      return false;
    }
  },

  async syncMysteryArenaPilihanToGAS(pilihan: GamePilihanRow): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_mystery_arena_pilihan',
          pilihan: {
            id_ronde: pilihan.id_ronde,
            kelompok: `Kelompok ${pilihan.kelompok}`,
            rumah_dipilih: pilihan.rumah_dipilih,
            waktu: pilihan.waktu,
          },
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Game_Pilihan ke Spreadsheet:', e);
      return false;
    }
  },

  async syncMysteryArenaSkorToGAS(skorList: GameSkorRow[]): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_mystery_arena_skor',
          skorList,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Game_Skor ke Spreadsheet:', e);
      return false;
    }
  },

  // ==========================================================================
  // SINKRONISASI ESCAPE ROOM MENARA KE GOOGLE SPREADSHEET (APPS SCRIPT)
  // Sheet Baru: Escape_Konfigurasi, Escape_Sesi, Escape_Progres, Escape_Skor
  // ==========================================================================

  async syncEscapeKonfigurasiToGAS(params: {
    konfigurasi: EscapeKonfigurasiFloor[];
    teacherId: string;
    teacherName: string;
    teacherPin?: string;
  }): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_escape_konfigurasi',
          teacherId: params.teacherId,
          teacherName: params.teacherName,
          teacherPin: params.teacherPin || settings.teacherPin || '1234',
          konfigurasi: params.konfigurasi,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Escape_Konfigurasi ke Spreadsheet:', e);
      return false;
    }
  },

  async syncEscapeSesiToGAS(params: {
    sesi: EscapeSesiRow;
    teacherId: string;
    teacherName: string;
    teacherPin?: string;
  }): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_escape_sesi',
          teacherId: params.teacherId,
          teacherName: params.teacherName,
          teacherPin: params.teacherPin || settings.teacherPin || '1234',
          sesi: params.sesi,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Escape_Sesi ke Spreadsheet:', e);
      return false;
    }
  },

  async syncEscapeProgresToGAS(progres: EscapeProgresRow): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_escape_progres',
          progres: {
            id_sesi: progres.id_sesi,
            kelompok: `Kelompok ${progres.kelompok}`,
            lantai_sekarang: progres.lantai_sekarang,
            jumlah_salah: progres.jumlah_salah,
            hint_dipakai: progres.hint_dipakai,
            waktu_selesai: progres.waktu_selesai,
          },
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Escape_Progres ke Spreadsheet:', e);
      return false;
    }
  },

  async syncEscapeSkorToGAS(skorList: EscapeSkorRow[]): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_escape_skor',
          skorList,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Escape_Skor ke Spreadsheet:', e);
      return false;
    }
  },

  // ==========================================================================
  // MENARA ASESMEN INDIVIDU (TKA MANDIRI BERBASIS LOBI)
  // Mengambil Tujuan Pembelajaran (TP) dari Bank Materi Kota Refleksia
  // & Sinkronisasi 6 Sheet Baru ke Google Spreadsheet
  // ==========================================================================

  getAvailableAsesmenTpList(): AsesmenTpReference[] {
    const bankEntries = this.getBankMateri();
    const materis = this.getMateri();
    const objectives = this.getObjectives();
    const seenTpIds = new Set<string>();
    const list: AsesmenTpReference[] = [];

    // 1. Utamakan dari Bank Materi Guru AI yang sudah ada di Kota Refleksia
    bankEntries.forEach((bm) => {
      if (!bm || !bm.tujuanPembelajaran) return;
      const idTp = bm.objectiveId || bm.id;
      if (seenTpIds.has(idTp)) return;
      seenTpIds.add(idTp);
      list.push({
        id_tp: idTp,
        mata_pelajaran: bm.mataPelajaran || 'Dasar-Dasar DKV / Informatika',
        kelas: bm.kelasTarget || 'X DKV',
        tujuan_pembelajaran: bm.tujuanPembelajaran,
        isi_materi: [bm.materiEsensial, bm.ringkasanAI, bm.modulPerpustakaan]
          .filter(Boolean)
          .join('\n\n'),
      });
    });

    // 2. Gabungkan dengan Learning Objectives (TP) & Materi Bawaan Kota Refleksia
    objectives.forEach((obj) => {
      if (!obj || !obj.goalStatement) return;
      if (seenTpIds.has(obj.id)) return;
      const relatedMateri = materis.find((m) => m.id === obj.materiId);
      seenTpIds.add(obj.id);
      list.push({
        id_tp: obj.id,
        mata_pelajaran: relatedMateri?.subject || 'Informatika & Dasar DKV',
        kelas: relatedMateri?.targetClass === 'ALL' ? 'X DKV 1, 2 & 3' : relatedMateri?.targetClass || 'X DKV',
        tujuan_pembelajaran: obj.goalStatement,
        isi_materi:
          relatedMateri?.materiEsensial ||
          relatedMateri?.content ||
          obj.indicator ||
          obj.goalStatement,
      });
    });

    // 3. Gabungkan juga Materi yang memiliki field tujuanPembelajaran langsung
    materis.forEach((m) => {
      if (!m || !m.tujuanPembelajaran) return;
      const idTp = `tp-${m.id}`;
      if (seenTpIds.has(idTp)) return;
      seenTpIds.add(idTp);
      list.push({
        id_tp: idTp,
        mata_pelajaran: m.subject || 'Dasar-Dasar DKV',
        kelas: m.targetClass === 'ALL' ? 'X DKV 1, 2 & 3' : m.targetClass || 'X DKV',
        tujuan_pembelajaran: m.tujuanPembelajaran,
        isi_materi: m.materiEsensial || m.content || m.title,
      });
    });

    return list;
  },

  async syncAsesmenSessionAndBankToGAS(params: {
    sesi: AsesmenSesiRow;
    bankSoal: AsesmenBankSoalRow[];
    stimulusList: AsesmenStimulusRow[];
    teacherId: string;
    teacherName: string;
    teacherPin?: string;
  }): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_asesmen_sesi_dan_soal',
          teacherId: params.teacherId,
          teacherName: params.teacherName,
          teacherPin: params.teacherPin || settings.teacherPin || '1234',
          sesi: params.sesi,
          bankSoal: params.bankSoal,
          stimulusList: params.stimulusList,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Asesmen_Sesi & Asesmen_BankSoal ke Spreadsheet:', e);
      return false;
    }
  },

  async syncAsesmenPaketSiswaBatchToGAS(paketList: AsesmenPaketSiswaRow[]): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_asesmen_paket_batch',
          paketList,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Asesmen_PaketSiswa ke Spreadsheet:', e);
      return false;
    }
  },

  async syncAsesmenJawabanBatchToGAS(jawabanList: AsesmenJawabanRow[]): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    if (!Array.isArray(jawabanList) || jawabanList.length === 0) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_asesmen_jawaban_batch',
          jawabanList,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi batch Asesmen_Jawaban ke Spreadsheet:', e);
      return false;
    }
  },

  async syncAsesmenHasilToGAS(hasilList: AsesmenHasilRow[]): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();
    if (!url || !url.startsWith('https://script.google.com/')) return false;
    if (!Array.isArray(hasilList) || hasilList.length === 0) return false;
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'save_asesmen_hasil_batch',
          hasilList,
        }),
      });
      return true;
    } catch (e) {
      console.warn('Gagal sinkronisasi Asesmen_Hasil ke Spreadsheet:', e);
      return false;
    }
  },

  // ============================================================================
  // AIR MANCUR WARGA — DAFTAR HADIR SISWA HARIAN (LEMPAR KOIN 1 XP -> SHEET "Daftar_Hadir")
  // ============================================================================
  getWitaDateString(date: Date = new Date()): string {
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Makassar',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);
      const y = parts.find((p) => p.type === 'year')?.value || String(date.getFullYear());
      const m = parts.find((p) => p.type === 'month')?.value || String(date.getMonth() + 1).padStart(2, '0');
      const d = parts.find((p) => p.type === 'day')?.value || String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  },

  getWitaTimeString(date: Date = new Date()): string {
    try {
      return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      const hh = String(date.getHours()).padStart(2, '0');
      const mm = String(date.getMinutes()).padStart(2, '0');
      const ss = String(date.getSeconds()).padStart(2, '0');
      return `${hh}:${mm}:${ss}`;
    }
  },

  getFountainAttendance(): FountainAttendanceRow[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.FOUNTAIN_ATTENDANCE);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveFountainAttendanceList(rows: FountainAttendanceRow[]): void {
    try {
      const dedupMap = new Map<string, FountainAttendanceRow>();
      rows.forEach((r) => {
        if (!r || !r.tanggal || !r.student_id) return;
        const key = `${r.tanggal}_${r.student_id}`;
        const existing = dedupMap.get(key);
        if (!existing || (r.timestamp || 0) < (existing.timestamp || Infinity)) {
          dedupMap.set(key, {
            ...r,
            id_absen: r.id_absen || `absen_${r.tanggal}_${r.student_id}`,
          });
        }
      });
      const sorted = Array.from(dedupMap.values()).sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      localStorage.setItem(STORAGE_KEYS.FOUNTAIN_ATTENDANCE, JSON.stringify(sorted));
    } catch (e) {
      console.warn('Gagal menyimpan daftar hadir Air Mancur ke localStorage:', e);
    }
  },

  recordFountainAttendance(entry: FountainAttendanceRow): FountainAttendanceRow[] {
    const current = this.getFountainAttendance();
    const existsIdx = current.findIndex(
      (r) => r.tanggal === entry.tanggal && r.student_id === entry.student_id
    );
    if (existsIdx === -1) {
      current.push(entry);
      this.saveFountainAttendanceList(current);
    }
    return this.getFountainAttendance();
  },

  async syncFountainAttendanceToGAS(entry: FountainAttendanceRow): Promise<boolean> {
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();
    let gasSent = false;

    // 1. Kirim ke Server Kota Refleksia (/api/fountain-attendance) untuk sinkronisasi lintas perangkat & backup penerusan ke GAS
    try {
      const res = await fetch('/api/fountain-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_attendance',
          entry,
          gasUrl: url,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.rows)) {
          this.saveFountainAttendanceList(data.rows);
        }
        if (data?.gasSynced) {
          gasSent = true;
        }
      }
    } catch (e) {
      console.warn('Sinkronisasi server daftar hadir Air Mancur fallback ke direct GAS:', e);
    }

    // 2. Kirim langsung ke Google Apps Script Web App URL (Sheet "Daftar_Hadir")
    if (url && url.startsWith('https://script.google.com/')) {
      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'save_absensi_air_mancur',
            sheetName: 'Daftar_Hadir',
            entry,
            row: {
              ID_Absen: entry.id_absen,
              Tanggal: entry.tanggal,
              Waktu: entry.waktu,
              NIS_ID: entry.student_id,
              Nama_Siswa: entry.nama_siswa,
              Kelas: entry.kelas,
              Koin_XP: entry.koin_xp,
              Status: entry.status,
            },
          }),
        });
        gasSent = true;
      } catch (e) {
        console.warn('Gagal mengirim absensi Air Mancur ke Google Spreadsheet:', e);
      }
    }

    return gasSent;
  },

  async syncFountainAttendanceBatchToGAS(entries: FountainAttendanceRow[]): Promise<boolean> {
    if (!Array.isArray(entries) || entries.length === 0) return false;
    const settings = this.getSettings();
    const url = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();
    let ok = false;

    try {
      const res = await fetch('/api/fountain-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_batch',
          entries,
          gasUrl: url,
        }),
      });
      if (res.ok) ok = true;
    } catch {}

    if (url && url.startsWith('https://script.google.com/')) {
      try {
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'save_absensi_air_mancur_batch',
            sheetName: 'Daftar_Hadir',
            entries,
            rows: entries.map((entry) => ({
              ID_Absen: entry.id_absen,
              Tanggal: entry.tanggal,
              Waktu: entry.waktu,
              NIS_ID: entry.student_id,
              Nama_Siswa: entry.nama_siswa,
              Kelas: entry.kelas,
              Koin_XP: entry.koin_xp,
              Status: entry.status,
            })),
          }),
        });
        ok = true;
      } catch (e) {
        console.warn('Gagal sinkronisasi batch Daftar_Hadir ke Spreadsheet:', e);
      }
    }

    return ok;
  },
};





