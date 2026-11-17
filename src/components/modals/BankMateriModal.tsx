import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  FileSpreadsheet,
  Code2,
  Building2,
  Target,
  Layers,
  GraduationCap,
  Send,
  ExternalLink,
  Eye,
  HelpCircle,
  Radio,
  Wrench,
  Landmark,
} from 'lucide-react';
import {
  BankMateriEntry,
  BankMateriBuildingDistribution,
  BankMateriVisualIllustration,
  BankMateriDailyImplementation,
  BuildingId,
  QuizQuestion,
  Student,
  TownSettings,
} from '../../types/index.ts';
import { TEACHER_ACCOUNTS } from '../../data/teacherAccounts.ts';
import { StorageService } from '../../utils/storage.ts';
import { sounds } from '../../utils/audio.ts';
import { GOOGLE_APPS_SCRIPT_CODE } from './RuangGuruModal.tsx';

export interface BankMateriModalProps {
  onClose: () => void;
  teacher: Student;
  bankMateriList: BankMateriEntry[];
  settings: TownSettings;
  onSaveBankMateri: (entry: BankMateriEntry) => Promise<void>;
  onDeleteBankMateri: (id: string) => Promise<void>;
  onRefreshBankMateri: () => Promise<void>;
  onSelectBuilding?: (id: BuildingId) => void;
}

const ALL_SUBJECT_SUGGESTIONS: string[] = Array.from(
  new Set([
    ...TEACHER_ACCOUNTS.flatMap((t) => t.subjects),
    'Dasar-Dasar Desain Komunikasi Visual (DDKV)',
    'Komputer Grafis & Publikasi',
    'Fotografi & Videografi',
    'Desain Multimedia Interaktif',
    'Kreatif Inovatif dan Kewirausahaan (KIK)',
    'Informatika & Berpikir Komputasional',
    'Bimbingan Konseling & Karakter Kerja',
  ])
);

const ELEMEN_SUGGESTIONS: string[] = [
  'Prinsip Desain Grafis, Tipografi & Hierarki Visual',
  'Proses Produksi Desain & Identitas Visual (Branding)',
  'Sketsa, Ilustrasi Digital & Karakter Visual',
  'Fotografi Pencahayaan, Komposisi & Videografi Sinematik',
  'Pengolahan Audio Video & Motion Graphic',
  'Antarmuka Pengguna (UI/UX) & Desain Multimedia Interaktif',
  'Kewirausahaan Kreatif, HAKI & Manajemen Proyek Tefa',
  'Berpikir Komputasional & Literasi Digital',
];

const KELAS_OPTIONS: string[] = [
  'X DKV 2 & X DKV 3',
  'X DKV, XI DKV, XII DKV',
  'X DKV',
  'XI DKV',
  'XII DKV',
];

export const BankMateriModal: React.FC<BankMateriModalProps> = ({
  onClose,
  teacher,
  bankMateriList,
  settings,
  onSaveBankMateri,
  onDeleteBankMateri,
  onRefreshBankMateri,
  onSelectBuilding,
}) => {
  const defaultSubject = useMemo(() => {
    if (teacher.subject) {
      const firstSub = teacher.subject.split(',')[0]?.trim();
      if (firstSub) return firstSub;
    }
    const matchedTeacher = TEACHER_ACCOUNTS.find(
      (t) => t.name.toLowerCase() === teacher.name.toLowerCase()
    );
    if (matchedTeacher && matchedTeacher.subjects.length > 0) {
      return matchedTeacher.subjects[0];
    }
    return 'Komputer Grafis & Publikasi';
  }, [teacher]);

  const [activeTab, setActiveTab] = useState<'form' | 'daftar' | 'spreadsheet'>('form');

  // Form states
  const [mataPelajaran, setMataPelajaran] = useState<string>(defaultSubject);
  const [customMapel, setCustomMapel] = useState<string>('');
  const [useCustomMapel, setUseCustomMapel] = useState<boolean>(false);
  const [kelasTarget, setKelasTarget] = useState<string>('X DKV, XI DKV, XII DKV');
  const [elemen, setElemen] = useState<string>('');
  const [tujuanPembelajaran, setTujuanPembelajaran] = useState<string>('');
  const [materiEsensial, setMateriEsensial] = useState<string>('');

  // AI Generation preview states
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncingSheet, setIsSyncingSheet] = useState<boolean>(false);
  const [generatedPreview, setGeneratedPreview] = useState<{
    materiEsensialDikembangkan?: string;
    ringkasanAI: string;
    modulPerpustakaan: string;
    ilustrasiVisual: BankMateriVisualIllustration[];
    implementasiSehariHari: BankMateriDailyImplementation[];
    pertanyaanRefleksi: string[];
    topikPodcastMentor: string;
    ringkasanMendalamPodcast: string;
    studiKasusPodcast: string;
    poinDiskusiPodcast: string[];
    pertanyaanPemantikPodcast: string;
    daftarPemantikPodcast: string[];
    misiBalaiKota: string;
    tantanganBangunanLain: BankMateriBuildingDistribution[];
    kuisBengkel: QuizQuestion[];
    source?: string;
  } | null>(null);

  const [statusBanner, setStatusBanner] = useState<{
    type: 'success' | 'info' | 'error';
    message: string;
  } | null>(null);

  const [selectedDetailEntry, setSelectedDetailEntry] = useState<BankMateriEntry | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const finalMapel = useCustomMapel && customMapel.trim() ? customMapel.trim() : mataPelajaran;

  const ensureCurriculumInputs = () => {
    const cleanMapel = (finalMapel || 'Informatika & Berpikir Komputasional').trim();
    const mapelLower = cleanMapel.toLowerCase();

    let resolvedElemen = elemen.trim();
    let resolvedTp = tujuanPembelajaran.trim();
    let resolvedEss = materiEsensial.trim();

    if (!resolvedElemen) {
      if (mapelLower.includes('informatika') || mapelLower.includes('komputasional')) {
        resolvedElemen = 'Berpikir Komputasional: Algoritma, Struktur Data & Pengolahan Data IPO';
      } else if (mapelLower.includes('fotografi') || mapelLower.includes('videografi')) {
        resolvedElemen = 'Fotografi Pencahayaan, Segitiga Exposure & Komposisi Sinematik';
      } else if (mapelLower.includes('multimedia') || mapelLower.includes('interaktif') || mapelLower.includes('ui')) {
        resolvedElemen = 'Antarmuka Pengguna (UI/UX), Wireframe & Prototipe Interaktif';
      } else if (mapelLower.includes('wirausaha') || mapelLower.includes('kik')) {
        resolvedElemen = 'Kewirausahaan Kreatif, HAKI, Kalkulasi Harga Pokok & Manajemen Tefa';
      } else {
        resolvedElemen = 'Prinsip Desain Grafis, Tipografi, Kontras Warna & Hierarki Visual';
      }
      setElemen(resolvedElemen);
    }

    if (!resolvedTp) {
      if (mapelLower.includes('informatika') || mapelLower.includes('komputasional')) {
        resolvedTp = `Peserta didik mampu memahami dan menerapkan konsep ${resolvedElemen} (Model Input-Process-Output, Sistem Operasi, Struktur Data Stack/Queue, serta Algoritma Pencarian & Pengurutan) dalam menyelesaikan permasalahan teknologi kehidupan sehari-hari secara sistematis.`;
      } else {
        resolvedTp = `Peserta didik mampu menganalisis prinsip ${resolvedElemen} pada mata pelajaran ${cleanMapel} serta menerapkannya untuk memecahkan masalah komunikasi visual dan teknologi dalam kehidupan sehari-hari.`;
      }
      setTujuanPembelajaran(resolvedTp);
    }

    if (!resolvedEss) {
      if (mapelLower.includes('informatika') || mapelLower.includes('komputasional')) {
        resolvedEss = `1. Model Input-Process-Output (IPO) pada arsitektur perangkat teknologi sehari-hari dan peran CPU, RAM, serta SSD.\n2. Penjadwalan proses Sistem Operasi menggunakan algoritma FIFO dan Shortest Job First (SJF) serta pencegahan Deadlock pada aplikasi harian.\n3. Struktur data Array, Stack (LIFO pada fitur Undo/Back aplikasi), dan Queue (FIFO pada antrean layanan digital).\n4. Efisiensi algoritma pencarian (Linear Search vs Binary Search) dan pengurutan (Sorting) untuk pengelolaan data sehari-hari.`;
      } else {
        resolvedEss = `1. Konsep fundamental dan prinsip utama pada elemen ${resolvedElemen} (${cleanMapel}).\n2. Pengaturan komposisi visual, kontras warna, tipografi, dan ruang kosong (White Space) agar informasi aplikasi/publikasi terbaca dalam 3 detik.\n3. Penerapan sistem alur kerja (Input-Process-Output) untuk menyelesaikan masalah informasi teknologi sehari-hari secara efektif.`;
      }
      setMateriEsensial(resolvedEss);
    }

    return {
      cleanMapel,
      cleanEl: resolvedElemen,
      cleanTp: resolvedTp,
      cleanEss: resolvedEss,
    };
  };

  const buildClientSmartDistribution = (params: {
    cleanMapel: string;
    cleanEl: string;
    cleanTp: string;
    cleanEss: string;
  }) => {
    const { cleanMapel, cleanEl, cleanTp, cleanEss } = params;
    const tName = teacher.name || 'Guru Pengampu DKV';

    const expandedMateriEsensial =
      cleanEss.length >= 180
        ? cleanEss
        : `${cleanEss ? cleanEss + '\n\n' : ''}Pengembangan Otomatis Materi Esensial berbasis Tujuan Pembelajaran (${cleanTp}):\n1. Konsep Fundamental & Prinsip Kerja ${cleanEl}: Memahami definisi, komponen utama, dan cara kerja sistem pada ${cleanMapel}.\n2. Pemetaan Masalah Teknologi Sehari-hari: Menganalisis bagaimana kendala penggunaan teknologi harian dapat diurai secara sistematis.\n3. Langkah Implementasi Terstruktur: Menerapkan tahapan Input -> Proses Transformasi Konsep -> Output Solusi yang efisien dan ramah pengguna.\n4. Evaluasi Kualitas & Dampak Nyata: Mengukur keberhasilan solusi dari segi kecepatan, kejelasan informasi, serta manfaat bagi masyarakat.`;

    return {
      materiEsensialDikembangkan: expandedMateriEsensial,
      ringkasanAI: `Materi "${cleanEl}" pada mata pelajaran ${cleanMapel} (${kelasTarget}) yang dikembangkan oleh AI dari Tujuan Pembelajaran "${cleanTp}" membekali siswa dengan penguasaan konsep esensial, diagram visual interaktif, serta penerapan nyata dalam memecahkan masalah teknologi di kehidupan sehari-hari.`,
      modulPerpustakaan: `BAB 1 — PENGANTAR KONSEP & TUJUAN PEMBELAJARAN: ${cleanEl.toUpperCase()}\nMata Pelajaran: ${cleanMapel} (${kelasTarget})\nGuru Pengampu: ${tName}\n\nTujuan Pembelajaran Utama:\n"${cleanTp}"\n\nMengapa materi "${cleanEl}" penting dipelajari? Dalam kehidupan sehari-hari, kita berinteraksi dengan berbagai perangkat dan layanan teknologi—mulai dari aplikasi smartphone, sistem antrean digital, pencarian informasi, hingga media komunikasi visual publik. Bab ini menguraikan bagaimana konsep ${cleanEl} menjadi kunci utama agar teknologi bekerja secara efisien, akurat, dan mudah dipahami.\n\nBAB 2 — PENGEMBANGAN MENDALAM MATERI ESENSIAL\n${expandedMateriEsensial}\n\nBAB 3 — PENJELASAN VISUAL & SKEMA CARA KERJA KONSEP\nPerhatikan Diagram Infografis Interaktif yang menyertai modul ini:\n1. Tahap Identifikasi (Input Masalah Harian): Mengamati kendala teknologi yang dialami pengguna sehari-hari dan mengumpulkan data penting.\n2. Tahap Transformasi (Proses ${cleanEl}): Mengolah data menggunakan aturan, struktur, dan kaidah materi esensial.\n3. Tahap Solusi (Output Nyata): Menghasilkan solusi teknologi/visual yang cepat, bebas kesalahan, dan langsung mempermudah aktivitas warga.\n\nBAB 4 — IMPLEMENTASI MATERI DALAM KEHIDUPAN SEHARI-HARI\n1. Efisiensi Aktivitas Digital Harian: Mengatur alur data dan informasi pada perangkat ponsel/komputer agar pencarian dan eksekusi tugas berlangsung dalam hitungan detik.\n2. Pemecahan Masalah Layanan di Lingkungan Sekolah & Warga: Mengatasi antrean layanan, kesalahan input formulir digital, atau kebingungan membaca panduan informasi publik.\n3. Pengambilan Keputusan Berbasis Analisis: Mengevaluasi keakuratan informasi digital dan memilih solusi teknologi paling tepat untuk kebutuhan sehari-hari.`,
      ilustrasiVisual: [
        {
          id: `vis-${Date.now()}-1`,
          title: `Diagram Alur Cara Kerja: ${cleanEl} dalam Kehidupan Sehari-hari`,
          badge: 'Infografis Interaktif #1',
          caption: `Visualisasi tahapan sistematis bagaimana konsep "${cleanEl}" mengubah masalah teknologi harian menjadi solusi yang terukur.`,
          visualType: 'flow_diagram' as const,
          steps: [
            {
              stepLabel: '1. Identifikasi Masalah Harian (Input)',
              icon: '🔍',
              description: `Mengamati kendala teknologi yang dialami pengguna sehari-hari terkait ${cleanEl} dan mengumpulkan informasi kunci.`,
            },
            {
              stepLabel: '2. Pemrosesan Konsep Esensial (Process)',
              icon: '⚙️',
              description: `Menerapkan prinsip inti "${cleanTp.slice(0, 90)}" untuk menyusun langkah penyelesaian yang logis dan efisien.`,
            },
            {
              stepLabel: '3. Solusi Teknologi Teruji (Output)',
              icon: '🚀',
              description: `Menghasilkan solusi siap pakai yang menghemat waktu, mencegah kesalahan teknis, dan mudah digunakan masyarakat.`,
            },
          ],
          takeaway: `Pemahaman "${cleanEl}" adalah kerangka kerja visual untuk menyelesaikan masalah teknologi setiap hari.`,
        },
        {
          id: `vis-${Date.now()}-2`,
          title: `Perbandingan Visual: Tanpa Konsep vs. Dengan Penerapan ${cleanEl}`,
          badge: 'Infografis Interaktif #2',
          caption: `Ilustrasi perbedaan nyata antara penanganan masalah teknologi secara acak dibandingkan dengan penerapan "${cleanEl}".`,
          visualType: 'comparison_visual' as const,
          steps: [
            {
              stepLabel: 'Kondisi Awal: Penanganan Acak & Lambat',
              icon: '⚠️',
              description: `Pengguna kebingungan saat menghadapi masalah teknologi harian karena data berantakan dan alur kerja tidak terstruktur.`,
            },
            {
              stepLabel: 'Transformasi: Integrasi Materi Esensial',
              icon: '📐',
              description: `Konsep ${cleanEl} diterapkan untuk memilah prioritas, menata struktur informasi, dan memvalidasi setiap tahapan.`,
            },
            {
              stepLabel: 'Hasil Akhir: Sistem Efisien & Akurat',
              icon: '✅',
              description: `Masalah terselesaikan lebih cepat, risiko salah langkah turun drastis, dan sesuai capaian Tujuan Pembelajaran.`,
            },
          ],
          takeaway: `Dengan menerapkan ${cleanEl}, setiap kendala teknologi sehari-hari dapat dianalisis dan diselesaikan secara tepat.`,
        },
      ] as BankMateriVisualIllustration[],
      implementasiSehariHari: [
        {
          id: `imp-${Date.now()}-1`,
          title: `Optimasi Penggunaan Aplikasi & Perangkat Digital Harian`,
          icon: '📱',
          dailyProblem: `Banyak pengguna mengalami kendala aplikasi lambat, file berantakan, atau salah langkah saat menggunakan layanan teknologi harian.`,
          conceptApplication: `Menerapkan prinsip "${cleanEl}" (${cleanTp.slice(0, 95)}) untuk mengorganisir data dan menyusun urutan langkah yang benar.`,
          realBenefit: `Aktivitas digital harian (belajar, transaksi, komunikasi) berjalan lebih cepat, hemat memori, dan bebas kesalahan.`,
        },
        {
          id: `imp-${Date.now()}-2`,
          title: `Penyelesaian Masalah Sistem Layanan di Lingkungan Sekolah`,
          icon: '🏫',
          dailyProblem: `Antrean layanan perpustakaan, absensi pagi, atau pengumpulan tugas digital sering tersendat karena alur informasi yang belum rapi.`,
          conceptApplication: `Menggunakan konsep materi esensial "${cleanEl}" untuk memetakan ulang alur layanan menjadi tahapan sederhana bagi seluruh siswa.`,
          realBenefit: `Mengurangi waktu tunggu siswa secara signifikan dan meningkatkan ketertiban serta akurasi data sekolah.`,
        },
        {
          id: `imp-${Date.now()}-3`,
          title: `Keamanan Informasi & Pengambilan Keputusan di Media Digital`,
          icon: '🛡️',
          dailyProblem: `Warga sering kebingungan saat memverifikasi informasi digital atau memahami panduan keamanan akun sehari-hari.`,
          conceptApplication: `Melakukan evaluasi kritis dan verifikasi bertahap berbasis "${cleanEl}" sebelum mengambil keputusan di perangkat digital.`,
          realBenefit: `Melindungi keamanan akun pribadi serta membantu keluarga menggunakan teknologi secara cerdas dan aman.`,
        },
      ] as BankMateriDailyImplementation[],
      pertanyaanRefleksi: [
        `Dari pengembangan materi "${cleanEl}" (${cleanMapel}) dan contoh penerapannya dalam kehidupan sehari-hari, konsep mana yang paling membuka wawasan barumu?`,
        `Masalah teknologi sehari-hari apa yang pernah kamu alami sendiri dan ternyata bisa diselesaikan menggunakan prinsip Tujuan Pembelajaran: "${cleanTp}"?`,
        `Langkah konkret apa yang akan kamu lakukan untuk menerapkan konsep "${cleanEl}" dalam aktivitas harian atau tugas berikutnya?`,
      ],
      topikPodcastMentor: `Kupas Tuntas ${cleanMapel}: Implementasi Nyata "${cleanEl}" dalam Memecahkan Masalah Teknologi Sehari-hari`,
      ringkasanMendalamPodcast: `Episode spesial Studio ON AIR bersama ${tName} ini mengupas secara mendalam bagaimana elemen "${cleanEl}" pada mata pelajaran ${cleanMapel} diturunkan langsung dari Tujuan Pembelajaran: "${cleanTp}". Kita membedah bagaimana konsep esensial ini bekerja di balik teknologi yang kita gunakan setiap hari serta bagaimana siswa dapat menganalisis masalah teknologi di sekitar mereka untuk merumuskan solusi praktis.`,
      studiKasusPodcast: `Studi Kasus Siaran ON AIR: Di lingkungan sekolah dan tempat tinggal kita, banyak pengguna sering mengalami kendala saat memakai sistem layanan digital harian (seperti antrean layanan yang macet, pengelolaan file yang berantakan, atau informasi digital yang membingungkan). Dengan menerapkan prinsip "${cleanEl}" secara sistematis mulai dari identifikasi masalah hingga perancangan solusi yang ramah pengguna, masalah tersebut berhasil diatasi secara efektif!`,
      poinDiskusiPodcast: [
        `1. Bedah Konsep Inti: Hubungan langsung antara Tujuan Pembelajaran "${cleanTp}" dengan materi esensial "${cleanEl}".`,
        `2. Fenomena Sehari-hari: Mengapa masalah teknologi di sekitar kita sering muncul jika mengabaikan prinsip "${cleanEl}"?`,
        `3. Studi Kasus Lapangan: Contoh nyata penerapan "${cleanEl}" pada smartphone, sistem sekolah, dan aktivitas warga.`,
        `4. Langkah Aksi Siswa: Tips praktis menerapkan materi ini secara langsung mulai hari ini.`,
      ],
      pertanyaanPemantikPodcast: `Coba amati satu masalah teknologi yang paling sering kamu atau keluargamu temui dalam kehidupan sehari-hari. Bagaimana kamu akan menggunakan konsep "${cleanEl}" untuk menganalisis penyebabnya dan merancang solusi yang paling efektif?`,
      daftarPemantikPodcast: [
        `Coba amati satu masalah teknologi yang paling sering kamu atau keluargamu temui dalam kehidupan sehari-hari. Bagaimana kamu akan menggunakan konsep "${cleanEl}" untuk menganalisis penyebabnya dan merancang solusi yang paling efektif?`,
        `Jika sebuah aplikasi atau sistem digital di sekolah tiba-tiba membingungkan penggunanya, indikator apa dari materi "${cleanEl}" yang pertama kali akan kamu evaluasi?`,
        `Apa dampak nyata yang dirasakan masyarakat jika seorang perancang teknologi menerapkan "${cleanEl}" dengan baik dibandingkan yang mengabaikannya?`,
      ],
      misiBalaiKota: `Misi Kota (${cleanMapel}): Pelajari modul berilustrasi "${cleanEl}" di Perpustakaan, bedah studi kasusnya di Studio ON AIR, dan pecahkan soal HOTS teknologi sehari-hari di Lab DKV & Menara Asesmen!`,
      tantanganBangunanLain: [
        {
          buildingId: 'perpustakaan',
          buildingName: 'Perpustakaan Kampus',
          buildingIcon: '📚',
          activityTitle: `Modul Visual & Implementasi Sehari-hari: ${cleanEl}`,
          materialSummary: `Pelajari 4 Bab lengkap "${cleanEl}" beserta Diagram Infografis Interaktif dan 3 kartu Implementasi Masalah Teknologi Kehidupan Sehari-hari.`,
          challengePrompt: `Baca modul berilustrasi "${cleanEl}" di Rak Buku Perpustakaan dan tulis Jurnal Pemahaman (+XP).`,
        },
        {
          buildingId: 'taman_refleksi',
          buildingName: 'Pusat Refleksi',
          buildingIcon: '🌿',
          activityTitle: `Refleksi Kontekstual: ${cleanEl}`,
          materialSummary: `Evaluasi pemahamanmu terhadap Tujuan Pembelajaran "${cleanTp}" dan kaitannya dengan teknologi sehari-hari.`,
          challengePrompt: `Pilih materi "${cleanMapel}: ${cleanEl}" di Pusat Refleksi lalu jawab 3 pertanyaan refleksi Guru.`,
        },
        {
          buildingId: 'menara_mentor',
          buildingName: 'Studio ON AIR',
          buildingIcon: '🎙️',
          activityTitle: `Siaran Podcast & Bedah Kasus Teknologi: ${cleanEl}`,
          materialSummary: `Pelajari Ringkasan Mendalam, Studi Kasus Teknologi Sehari-hari, dan Poin Diskusi "${cleanEl}" lalu siarkan bersama Host AI Mentor.`,
          challengePrompt: `Rekam episode Podcast membahas studi kasus "${cleanEl}" dan dapatkan umpan balik langsung.`,
        },
        {
          buildingId: 'bengkel_latihan',
          buildingName: 'Lab DKV & Tefa',
          buildingIcon: '🛠️',
          activityTitle: `Kuis 5 Jenjang Penerapan Teknologi Harian: ${cleanEl}`,
          materialSummary: `Uji kemampuan memecahkan masalah teknologi sehari-hari menggunakan konsep "${cleanEl}" dari Jenjang 1 (Dasar) hingga Jenjang 5 (Mahir).`,
          challengePrompt: `Kerjakan 5 soal studi kasus sehari-hari "${cleanMapel} - ${cleanEl}" di Lab DKV & Tefa.`,
        },
        {
          buildingId: 'balai_kota',
          buildingName: 'Balai Kota',
          buildingIcon: '🏛️',
          activityTitle: `Papan Misi & Capaian Pembelajaran: ${cleanMapel}`,
          materialSummary: `Target Capaian (${kelasTarget}): ${cleanTp}`,
          challengePrompt: `Cek progres penyelesaian misi materi "${cleanEl}" di Balai Kota.`,
        },
        {
          buildingId: 'kantor_pos',
          buildingName: 'Kantor Pos',
          buildingIcon: '📮',
          activityTitle: `Kotak Konsultasi Guru: ${tName}`,
          materialSummary: `Konsultasikan ide penerapan "${cleanEl}" dalam kehidupan sehari-hari kepada ${tName}.`,
          challengePrompt: `Kirim pesan konsultasi materi "${cleanEl}" melalui Kantor Pos.`,
        },
        {
          buildingId: 'monumen_warga',
          buildingName: 'Monumen Warga',
          buildingIcon: '🗿',
          activityTitle: `Diskusi Warga: Solusi Teknologi Harian ${cleanEl}`,
          materialSummary: `Diskusikan contoh penerapan "${cleanEl}" di kehidupan sehari-hari bersama teman sekelas di Monumen Warga.`,
          challengePrompt: `Bagikan 1 kesimpulan penerapan nyata "${cleanEl}" di Monumen Warga.`,
        },
        {
          buildingId: 'pasar_prestasi',
          buildingName: 'Pasar Prestasi',
          buildingIcon: '🏆',
          activityTitle: `Penghargaan Pemecah Masalah ${cleanMapel}`,
          materialSummary: `Setiap aktivitas belajar pada materi "${cleanEl}" menambah skor keaktifan dan XP warga di Pasar Prestasi.`,
          challengePrompt: `Kumpulkan XP dari misi Bank Materi untuk masuk Top 5 Warga Berprestasi.`,
        },
        {
          buildingId: 'masjid',
          buildingName: 'Masjid Al-Hikmah',
          buildingIcon: '🕌',
          activityTitle: `Etika & Kebermanfaatan Teknologi: ${cleanMapel}`,
          materialSummary: `Gunakan ilmu "${cleanEl}" untuk menghadirkan solusi teknologi yang jujur, aman, dan bermanfaat bagi masyarakat.`,
          challengePrompt: `Jaga adab menuntut ilmu dan ketekunan belajar di Kota Refleksia.`,
        },
      ] as BankMateriBuildingDistribution[],
      kuisBengkel: [
        {
          question: `[Jenjang 1 - Dasar] Dalam kehidupan sehari-hari, seorang siswa sering mengalami kebingungan saat mengelola data dan informasi digital di perangkatnya karena tidak terstruktur. Berdasarkan materi "${cleanEl}" (${cleanMapel}), langkah dasar apa yang harus dilakukan sesuai Tujuan Pembelajaran?`,
          options: [
            `Mengidentifikasi kebutuhan utama lalu menerapkan prinsip dasar "${cleanEl}" (${cleanTp.slice(0, 85)}) secara teratur`,
            'Menyimpan seluruh file dan informasi secara acak tanpa kategori maupun aturan yang jelas',
            'Menghapus seluruh aplikasi penting tanpa memeriksa fungsi dan kegunaannya terlebih dahulu',
            'Membiarkan masalah berlarut-larut tanpa mencari tahu penyebab utamanya',
          ],
          correctIndex: 0,
          explanation: `Sesuai Tujuan Pembelajaran (${cleanTp}), langkah dasar pemecahan masalah teknologi harian dimulai dari identifikasi kebutuhan dan penerapan konsep "${cleanEl}" secara terstruktur.`,
        },
        {
          question: `[Jenjang 2 - Pemahaman] Mengapa pemahaman terhadap Materi Esensial "${cleanEl}" sangat membantu masyarakat saat menghadapi kendala penggunaan aplikasi atau layanan teknologi sehari-hari?`,
          options: [
            'Karena membuat perangkat elektronik tidak membutuhkan daya listrik sama sekali',
            'Karena memberikan kerangka berpikir sistematis untuk memahami cara kerja sistem dan menemukan letak kesalahan dengan cepat',
            'Karena menghilangkan kebutuhan untuk membaca petunjuk keamanan digital',
            'Karena semua masalah teknologi dapat selesai sendiri tanpa tindakan pengguna',
          ],
          correctIndex: 1,
          explanation: `Materi esensial "${cleanEl}" membekali pengguna dengan pemahaman alur sistem sehingga saat terjadi kendala teknologi harian, penyebabnya dapat dipetakan secara logis.`,
        },
        {
          question: `[Jenjang 3 - Penerapan] Keluarga di rumah mengeluhkan proses pencarian dokumen digital dan pengaturan jadwal kegiatan di ponsel yang selalu memakan waktu lama hingga sering terlambat. Bagaimana cara menerapkan konsep "${cleanEl}" untuk menyelesaikan masalah tersebut?`,
          options: [
            'Membeli ponsel baru setiap minggu meskipun cara penggunaannya tetap berantakan',
            `Menyusun struktur pengelompokan yang jelas, menetapkan prioritas informasi, dan menerapkan alur kerja "${cleanEl}" yang konsisten`,
            'Menggabungkan seluruh dokumen pribadi dan jadwal ke dalam satu catatan panjang tanpa judul',
            'Menonaktifkan seluruh fitur pengingat dan pencarian pada perangkat ponsel',
          ],
          correctIndex: 1,
          explanation: `Penerapan "${cleanEl}" dalam kehidupan sehari-hari dilakukan dengan menata struktur informasi dan alur kerja secara konsisten sehingga waktu pencarian menjadi jauh lebih singkat.`,
        },
        {
          question: `[Jenjang 4 - Analisis] Sebuah sistem pendaftaran kegiatan siswa secara online mengalami kemacetan karena 65% pengguna salah mengisi kolom data penting. Jika dianalisis menggunakan konsep "${cleanEl}", akar masalah dan solusi perbaikan yang paling tepat adalah...`,
          options: [
            'Menyalahkan seluruh pengguna dan menutup pendaftaran tanpa memperbaiki sistem',
            'Alur informasi dan validasi input belum menerapkan prinsip materi esensial; solusinya adalah menyederhanakan tahapan dan memperjelas petunjuk pada titik krusial',
            'Menambah jumlah kolom isian menjadi tiga kali lipat tanpa memberi keterangan',
            'Menghapus fitur penyimpanan otomatis sehingga siswa harus mengetik ulang dari awal',
          ],
          correctIndex: 1,
          explanation: `Analisis berbasis "${cleanEl}" menunjukkan bahwa tingginya kesalahan pengguna disebabkan oleh alur sistem yang belum ramah pengguna; perbaikannya fokus pada penyederhanaan tahapan dan kejelasan panduan.`,
        },
        {
          question: `[Jenjang 5 - Evaluasi & Kreasi] Kamu diminta merancang solusi teknologi sederhana berbasis "${cleanEl}" untuk mengatasi masalah antrean panjang dan kesalahan pesanan di kantin sekolah pada jam istirahat. Rancangan solusi manakah yang paling efektif, realistis, dan memenuhi indikator Tujuan Pembelajaran?`,
          options: [
            'Meminta siswa berteriak bersamaan di depan kasir tanpa catatan pesanan',
            `Merancang sistem pemesanan/katalog terstruktur berbasis "${cleanEl}" yang memisahkan kategori menu, menampilkan rincian biaya otomatis, dan mengurutkan antrean secara transparan`,
            'Membuat aturan yang melarang siswa membeli makanan selama jam istirahat berlangsung',
            'Menggunakan formulir kertas tanpa nomor urut yang dikumpulkan secara acak di meja kasir',
          ],
          correctIndex: 1,
          explanation: `Pada level Evaluasi & Kreasi (HOTS), solusi terbaik mengintegrasikan konsep "${cleanEl}" untuk menciptakan sistem yang terstruktur, transparan, dan langsung menyelesaikan masalah nyata di lingkungan sekolah.`,
        },
      ],
      source: 'smart-curriculum-ai',
    };
  };

  const requestOrBuildAiDistribution = async (inputs: {
    cleanMapel: string;
    cleanEl: string;
    cleanTp: string;
    cleanEss: string;
  }) => {
    const fallbackData = buildClientSmartDistribution(inputs);
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 16000);
      const response = await fetch('/api/bank-materi/generate-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          teacherName: teacher.name,
          mataPelajaran: inputs.cleanMapel,
          kelasTarget,
          elemen: inputs.cleanEl,
          tujuanPembelajaran: inputs.cleanTp,
          materiEsensial: inputs.cleanEss,
        }),
      });
      window.clearTimeout(timer);

      if (response.ok) {
        const result = await response.json();
        if (result && result.success && result.data) {
          const d = result.data;
          return {
            materiEsensialDikembangkan:
              d.materiEsensialDikembangkan || fallbackData.materiEsensialDikembangkan,
            ringkasanAI: d.ringkasanAI || fallbackData.ringkasanAI,
            modulPerpustakaan: d.modulPerpustakaan || fallbackData.modulPerpustakaan,
            ilustrasiVisual:
              Array.isArray(d.ilustrasiVisual) && d.ilustrasiVisual.length > 0
                ? d.ilustrasiVisual
                : fallbackData.ilustrasiVisual,
            implementasiSehariHari:
              Array.isArray(d.implementasiSehariHari) && d.implementasiSehariHari.length > 0
                ? d.implementasiSehariHari
                : fallbackData.implementasiSehariHari,
            pertanyaanRefleksi:
              Array.isArray(d.pertanyaanRefleksi) && d.pertanyaanRefleksi.length > 0
                ? d.pertanyaanRefleksi
                : fallbackData.pertanyaanRefleksi,
            topikPodcastMentor: d.topikPodcastMentor || fallbackData.topikPodcastMentor,
            ringkasanMendalamPodcast:
              d.ringkasanMendalamPodcast || fallbackData.ringkasanMendalamPodcast,
            studiKasusPodcast: d.studiKasusPodcast || fallbackData.studiKasusPodcast,
            poinDiskusiPodcast:
              Array.isArray(d.poinDiskusiPodcast) && d.poinDiskusiPodcast.length > 0
                ? d.poinDiskusiPodcast
                : fallbackData.poinDiskusiPodcast,
            pertanyaanPemantikPodcast:
              d.pertanyaanPemantikPodcast || fallbackData.pertanyaanPemantikPodcast,
            daftarPemantikPodcast:
              Array.isArray(d.daftarPemantikPodcast) && d.daftarPemantikPodcast.length > 0
                ? d.daftarPemantikPodcast
                : fallbackData.daftarPemantikPodcast,
            misiBalaiKota: d.misiBalaiKota || fallbackData.misiBalaiKota,
            tantanganBangunanLain:
              Array.isArray(d.tantanganBangunanLain) && d.tantanganBangunanLain.length > 0
                ? d.tantanganBangunanLain
                : fallbackData.tantanganBangunanLain,
            kuisBengkel:
              Array.isArray(d.kuisBengkel) && d.kuisBengkel.length > 0
                ? d.kuisBengkel
                : fallbackData.kuisBengkel,
            source: result.source || 'gemini-ai',
          };
        }
      }
    } catch {
      // Fallback to client smart curriculum generator seamlessly
    }
    return fallbackData;
  };

  const handleQuickTemplate = () => {
    sounds.playClick();
    setElemen('Identitas Visual, Logo & Psikologi Warna Brand');
    setTujuanPembelajaran(
      'Peserta didik mampu menganalisis karakter filosofi warna dan merancang sistem identitas visual (Logo, Palet Warna, dan Tipografi) untuk memecahkan masalah informasi dan branding produk UMKM dalam kehidupan sehari-hari.'
    );
    setMateriEsensial(
      '1. Fungsi Logo sebagai wajah utama identitas brand (Sederhana, Mudah Diingat, Timeless, Fleksibel).\n2. Psikologi Warna dalam komunikasi visual dan aplikasi sehari-hari (Merah: Energi/Peringatan, Biru: Kepercayaan/Teknologi, Kuning: Optimisme, Hijau: Pertumbuhan/Alami).\n3. Konsistensi Brand Guidelines pada kemasan, antarmuka digital, dan media informasi publik.'
    );
    setStatusBanner({
      type: 'info',
      message:
        'Contoh input Elemen, Tujuan Pembelajaran, dan Materi Esensial berhasil diisi! Klik "✨ Generate AI & Sebarkan ke Bangunan Kota" untuk mengembangkan materi lengkap beserta ilustrasi visual & soal HOTS sehari-hari.',
    });
  };

  const handleGenerateAI = async () => {
    sounds.playClick();
    const inputs = ensureCurriculumInputs();
    setIsGeneratingAI(true);
    setStatusBanner({
      type: 'info',
      message:
        '🤖 AI Bank Materi sedang mengembangkan Materi Esensial dari TP, menyusun Modul Perpustakaan + Ilustrasi Visual & Implementasi Sehari-hari, Materi Mendalam Studio ON AIR, serta Soal HOTS Masalah Teknologi Harian di Lab DKV...',
    });

    try {
      const d = await requestOrBuildAiDistribution(inputs);
      if (d.materiEsensialDikembangkan && d.materiEsensialDikembangkan.length > inputs.cleanEss.length) {
        setMateriEsensial(d.materiEsensialDikembangkan);
      }

      const tempMateriId = `materi-bm-${Date.now()}`;
      const formattedKuis: QuizQuestion[] = (d.kuisBengkel || []).map((q: any, idx: number) => ({
        id: `q-bm-${Date.now()}-${idx + 1}`,
        materiId: tempMateriId,
        materiTitle: `${inputs.cleanMapel}: ${inputs.cleanEl}`,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        explanation: q.explanation || 'Pembahasan sesuai Materi Esensial.',
      }));

      setGeneratedPreview({
        materiEsensialDikembangkan: d.materiEsensialDikembangkan,
        ringkasanAI: d.ringkasanAI,
        modulPerpustakaan: d.modulPerpustakaan,
        ilustrasiVisual: d.ilustrasiVisual || [],
        implementasiSehariHari: d.implementasiSehariHari || [],
        pertanyaanRefleksi: d.pertanyaanRefleksi || [],
        topikPodcastMentor: d.topikPodcastMentor,
        ringkasanMendalamPodcast: d.ringkasanMendalamPodcast,
        studiKasusPodcast: d.studiKasusPodcast,
        poinDiskusiPodcast: d.poinDiskusiPodcast || [],
        pertanyaanPemantikPodcast: d.pertanyaanPemantikPodcast,
        daftarPemantikPodcast: d.daftarPemantikPodcast || [],
        misiBalaiKota: d.misiBalaiKota,
        tantanganBangunanLain: d.tantanganBangunanLain || [],
        kuisBengkel: formattedKuis,
        source: d.source,
      });

      sounds.playRewardXp();
      setStatusBanner({
        type: 'success',
        message:
          '✨ Berhasil Mengembangkan Materi dengan AI! Modul berilustrasi visual, implementasi kehidupan sehari-hari, materi mendalam Studio ON AIR, dan soal penerapan teknologi harian telah siap. Klik "🚀 Simpan ke Spreadsheet & Sebarkan"!',
      });
    } catch {
      setStatusBanner({
        type: 'error',
        message: 'Terjadi kendala saat mengolah materi. Silakan coba kembali.',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSaveAndDistribute = async () => {
    sounds.playClick();
    const inputs = ensureCurriculumInputs();
    setIsSaving(true);
    setStatusBanner({
      type: 'info',
      message:
        '🚀 Sedang menyimpan ke Google Spreadsheet (Sheet Bank_Materi_Guru) & menyebarkan materi visual, Studio ON AIR, Lab DKV, dan TP HOTS Asesmen ke seluruh bangunan Refleksia City...',
    });

    try {
      let previewToUse = generatedPreview;

      // Jika Guru langsung klik Simpan tanpa klik Generate AI dulu, jalankan Generate AI otomatis dengan fallback aman!
      if (!previewToUse) {
        const d = await requestOrBuildAiDistribution(inputs);
        previewToUse = {
          ...d,
          kuisBengkel: (d.kuisBengkel || []).map((q: any, idx: number) => ({
            id: `q-bm-${Date.now()}-${idx + 1}`,
            materiId: `materi-bm-${Date.now()}`,
            materiTitle: `${inputs.cleanMapel}: ${inputs.cleanEl}`,
            question: q.question,
            options: Array.isArray(q.options) ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q.explanation || 'Sesuai Materi Esensial.',
          })),
        };
      }

      const now = Date.now();
      const bmId = `bm-${now}`;
      const mId = `materi-${bmId}`;
      const oId = `tp-${bmId}`;
      const fullTitle = `${inputs.cleanMapel}: ${inputs.cleanEl}`;
      const finalExpandedEss =
        previewToUse?.materiEsensialDikembangkan || inputs.cleanEss;

      const formattedKuis: QuizQuestion[] = (previewToUse?.kuisBengkel || []).map(
        (q: any, idx: number) => ({
          id: `q-${bmId}-${idx + 1}`,
          materiId: mId,
          materiTitle: fullTitle,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : ['Opsi A', 'Opsi B', 'Opsi C', 'Opsi D'],
          correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
          explanation: q.explanation || 'Sesuai Materi Esensial.',
        })
      );

      const newEntry: BankMateriEntry = {
        id: bmId,
        materiId: mId,
        objectiveId: oId,
        teacherId: teacher.id || 'teacher-1',
        teacherName: teacher.name || 'Guru Pengampu DKV',
        mataPelajaran: inputs.cleanMapel,
        kelasTarget,
        elemen: inputs.cleanEl,
        tujuanPembelajaran: inputs.cleanTp,
        materiEsensial: finalExpandedEss,
        ringkasanAI:
          previewToUse?.ringkasanAI ||
          `Materi ${inputs.cleanMapel} (${inputs.cleanEl}) oleh ${teacher.name} untuk kelas ${kelasTarget}.`,
        modulPerpustakaan: previewToUse?.modulPerpustakaan || finalExpandedEss,
        ilustrasiVisual: previewToUse?.ilustrasiVisual || [],
        implementasiSehariHari: previewToUse?.implementasiSehariHari || [],
        pertanyaanRefleksi: previewToUse?.pertanyaanRefleksi || [
          `Apa konsep utama dari materi "${inputs.cleanEl}" yang sudah kamu pahami?`,
          `Bagian mana dari Tujuan Pembelajaran "${inputs.cleanTp}" yang masih menantang?`,
          `Apa rencana tindakanmu untuk menerapkan materi ini pada kehidupan sehari-hari?`,
        ],
        topikPodcastMentor:
          previewToUse?.topikPodcastMentor || `Diskusi ${inputs.cleanMapel}: ${inputs.cleanEl}`,
        ringkasanMendalamPodcast: previewToUse?.ringkasanMendalamPodcast || '',
        studiKasusPodcast: previewToUse?.studiKasusPodcast || '',
        poinDiskusiPodcast: previewToUse?.poinDiskusiPodcast || [],
        pertanyaanPemantikPodcast:
          previewToUse?.pertanyaanPemantikPodcast ||
          `Bagaimana cara kamu menerapkan materi "${inputs.cleanEl}" untuk memecahkan masalah teknologi sehari-hari?`,
        daftarPemantikPodcast: previewToUse?.daftarPemantikPodcast || [],
        misiBalaiKota:
          previewToUse?.misiBalaiKota ||
          `Pelajari modul berilustrasi "${inputs.cleanEl}" di Perpustakaan, bedah studi kasusnya di Studio ON AIR, dan kerjakan Kuis 5 Jenjang di Lab DKV!`,
        tantanganBangunanLain: previewToUse?.tantanganBangunanLain || [],
        kuisBengkel: formattedKuis,
        createdAt: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        timestamp: now,
      };

      await onSaveBankMateri(newEntry);

      sounds.playRewardXp();
      setStatusBanner({
        type: 'success',
        message: `🎉 Materi "${inputs.cleanMapel} — ${inputs.cleanEl}" berhasil dikembangkan oleh AI, disimpan ke Google Spreadsheet, dan OTOMATIS TERSEBAR ke Perpustakaan (dengan Ilustrasi & Implementasi Sehari-hari), Studio ON AIR, Lab DKV, & Menara Asesmen!`,
      });

      // Reset form & switch to list
      setElemen('');
      setTujuanPembelajaran('');
      setMateriEsensial('');
      setGeneratedPreview(null);
      setSelectedDetailEntry(newEntry);
      setActiveTab('daftar');
    } catch (err) {
      console.error('Failed saving Bank Materi:', err);
      setStatusBanner({
        type: 'error',
        message: 'Gagal menyimpan materi. Silakan coba lagi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncFromSpreadsheet = async () => {
    sounds.playClick();
    setIsSyncingSheet(true);
    setStatusBanner({
      type: 'info',
      message: '🔄 Sedang menyinkronkan data Bank Materi dari Server & Google Spreadsheet...',
    });
    try {
      await onRefreshBankMateri();
      sounds.playRewardXp();
      setStatusBanner({
        type: 'success',
        message: `✅ Sinkronisasi berhasil! Seluruh materi di Bank Materi telah diperbarui dan disebarkan ke setiap bangunan Kota Refleksia.`,
      });
    } catch {
      setStatusBanner({
        type: 'error',
        message: 'Gagal menarik data dari Google Spreadsheet.',
      });
    } finally {
      setIsSyncingSheet(false);
    }
  };

  const handleCopyScript = () => {
    sounds.playClick();
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-2xl shadow-indigo-950/60 overflow-hidden text-slate-100">
        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-violet-950 border-b border-indigo-500/30">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-indigo-500/30 border border-amber-300/40">
              🏦
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  GEDUNG BANK MATERI GURU
                </h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/40">
                  🔒 Akses Eksklusif Guru
                </span>
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  ✨ Auto-Distribusi AI 9 Bangunan + Spreadsheet v2.7
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5">
                Login Guru: <strong className="text-amber-300">{teacher.name}</strong> • Input Mata Pelajaran, Elemen, TP & Materi Esensial untuk disebarkan otomatis ke seluruh bangunan Kota Refleksia.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-slate-700 transition-colors"
            title="Tutup Bank Materi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('form');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'form'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>1. Tambah & Generate AI Materi Kota</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('daftar');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'daftar'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <Building2 className="w-4 h-4 text-emerald-300" />
              <span>2. Bank Materi & Distribusi Bangunan ({bankMateriList.length})</span>
            </button>

            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('spreadsheet');
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'spreadsheet'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 border border-emerald-400/40'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
              <span>3. Sinkronisasi & Script Spreadsheet v2.7</span>
            </button>
          </div>

          <button
            onClick={handleSyncFromSpreadsheet}
            disabled={isSyncingSheet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
            <span>Sinkronkan Spreadsheet</span>
          </button>
        </div>

        {/* STATUS BANNER */}
        {statusBanner && (
          <div
            className={`mx-5 mt-3 px-4 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
              statusBanner.type === 'success'
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
                : statusBanner.type === 'error'
                ? 'bg-rose-950/70 border-rose-500/40 text-rose-200'
                : 'bg-indigo-950/70 border-indigo-500/40 text-indigo-200'
            }`}
          >
            <span>{statusBanner.message}</span>
            <button
              onClick={() => setStatusBanner(null)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* CONTENT BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: INPUT & GENERATE AI */}
          {activeTab === 'form' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT COLUMN: TEACHER INPUT FORM */}
              <div className="lg:col-span-6 space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>Formulir Input Kurikulum Guru</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Isi 4 komponen inti di bawah, lalu klik tombol <strong>Generate AI</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleQuickTemplate}
                    className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-bold transition-colors"
                  >
                    💡 Isi Contoh Cepat
                  </button>
                </div>

                {/* Guru & Kelas Target */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Nama Guru Pengampu
                    </label>
                    <input
                      type="text"
                      value={teacher.name}
                      disabled
                      className="w-full px-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 text-xs font-bold text-amber-300 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Kelas Target Siswa
                    </label>
                    <select
                      value={kelasTarget}
                      onChange={(e) => setKelasTarget(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    >
                      {KELAS_OPTIONS.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1. Mata Pelajaran */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-indigo-300">
                      1. Mata Pelajaran *
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseCustomMapel(!useCustomMapel)}
                      className="text-[11px] text-amber-300 hover:underline font-semibold"
                    >
                      {useCustomMapel ? 'Pilih dari Daftar Mapel' : '+ Ketik Mapel Baru'}
                    </button>
                  </div>
                  {useCustomMapel ? (
                    <input
                      type="text"
                      value={customMapel}
                      onChange={(e) => setCustomMapel(e.target.value)}
                      placeholder="Ketik nama Mata Pelajaran..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/50 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    />
                  ) : (
                    <select
                      value={mataPelajaran}
                      onChange={(e) => setMataPelajaran(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none"
                    >
                      {ALL_SUBJECT_SUGGESTIONS.map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Elemen */}
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    2. Elemen Kurikulum *
                  </label>
                  <input
                    type="text"
                    value={elemen}
                    onChange={(e) => setElemen(e.target.value)}
                    placeholder="Contoh: Prinsip Desain Grafis, Tipografi & Hierarki Visual"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {ELEMEN_SUGGESTIONS.slice(0, 4).map((el) => (
                      <button
                        key={el}
                        type="button"
                        onClick={() => setElemen(el)}
                        className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-indigo-500/20 text-[10px] text-slate-300 hover:text-indigo-200 border border-slate-700 transition-colors"
                      >
                        + {el.length > 34 ? el.slice(0, 34) + '...' : el}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Tujuan Pembelajaran */}
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    3. Tujuan Pembelajaran (TP) *
                  </label>
                  <textarea
                    rows={3}
                    value={tujuanPembelajaran}
                    onChange={(e) => setTujuanPembelajaran(e.target.value)}
                    placeholder="Contoh: Peserta didik mampu menerapkan prinsip keseimbangan, kontras, dan hierarki tipografi dalam merancang poster publikasi digital..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none leading-relaxed"
                  />
                </div>

                {/* 4. Materi Esensial */}
                <div>
                  <label className="block text-[11px] font-bold text-indigo-300 mb-1">
                    4. Materi Esensial (Poin Inti / Ringkasan Materi Guru) *
                  </label>
                  <textarea
                    rows={5}
                    value={materiEsensial}
                    onChange={(e) => setMateriEsensial(e.target.value)}
                    placeholder="Tuliskan poin-poin inti materi esensial, rumus, langkah kerja, atau konsep utama yang wajib dikuasai siswa..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:border-indigo-400 focus:outline-none leading-relaxed"
                  />
                </div>

                {statusBanner && (
                  <div
                    className={`px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-2 ${
                      statusBanner.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                        : statusBanner.type === 'error'
                        ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                        : 'bg-indigo-950/80 border-indigo-500/50 text-indigo-200'
                    }`}
                  >
                    <span>{statusBanner.message}</span>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || isSaving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                    <span>
                      {isGeneratingAI
                        ? 'Sedang Mengolah dengan AI...'
                        : '✨ Generate AI (Sebarkan ke Bangunan Kota)'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveAndDistribute}
                    disabled={isSaving || isGeneratingAI}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {isSaving
                        ? 'Menyimpan & Menyebarkan...'
                        : '🚀 Simpan ke Spreadsheet & Sebarkan'}
                    </span>
                  </button>
                </div>
              </div>

              {/* RIGHT COLUMN: AI DISTRIBUTION PREVIEW ACROSS ALL 9 BUILDINGS */}
              <div className="lg:col-span-6 space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-indigo-500/30">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>Peta Distribusi Otomatis AI ke 9 Bangunan Kota</span>
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Satu kali Generate AI langsung menyiapkan konten siap pakai untuk siswa di seluruh gedung Refleksia City:
                    </p>
                  </div>
                </div>

                {!generatedPreview ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
                      <p className="font-bold text-amber-300 mb-1.5">
                        🌐 Bagaimana Sistem Pengembangan AI Bank Materi Bekerja?
                      </p>
                      <p>
                        Cukup isi <strong>Tujuan Pembelajaran (TP)</strong> &amp;{' '}
                        <strong>Materi Esensial</strong>, lalu klik{' '}
                        <strong className="text-white">✨ Generate AI</strong>. AI otomatis mengembangkan materi lengkap ke 4 gedung utama:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-amber-300">📚 1. Perpustakaan Kampus</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Modul bacaan lengkap 4 BAB + Diagram Infografis Interaktif + 3 Implementasi Nyata dalam Kehidupan Sehari-hari.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-rose-300">🎙️ 2. Studio ON AIR</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Pengembangan materi mendalam, Studi Kasus Masalah Teknologi Harian, Poin Diskusi Host, &amp; Pemantik HOTS.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-cyan-300">🛠️ 3. Lab DKV &amp; Tefa</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          5 Soal Kuis Berjenjang (Jenjang 1 s.d. 5) berbasis penerapan masalah teknologi dalam kehidupan sehari-hari.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-emerald-300">🏛️ 4. Asesmen Individu &amp; Pusat Refleksi</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          TP otomatis terhubung ke Generator Soal HOTS TKA (C4/C5/C6) &amp; 3 pertanyaan refleksi mendalam.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[560px] overflow-y-auto pr-1">
                    {/* Ringkasan AI */}
                    <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                        ✨ Ringkasan Pengembangan AI ({finalMapel})
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {generatedPreview.ringkasanAI}
                      </p>
                    </div>

                    {/* 1. Perpustakaan Kampus: Modul + Ilustrasi Visual + Implementasi Sehari-hari */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
                      <div className="text-[11px] font-bold text-amber-300">
                        📚 1. Perpustakaan Kampus (4 Bab + Infografis Visual + Implementasi Sehari-hari):
                      </div>
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        {generatedPreview.modulPerpustakaan}
                      </pre>

                      {generatedPreview.ilustrasiVisual?.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                            🎨 Ilustrasi Visual Kontekstual &amp; Diagram Infografis Interaktif ({generatedPreview.ilustrasiVisual.length} Bagan):
                          </div>
                          {generatedPreview.ilustrasiVisual.map((vis, vIdx) => (
                            <div
                              key={vis.id || vIdx}
                              className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 space-y-1.5"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[11px] font-bold text-white">{vis.title}</span>
                                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[9px] font-bold">
                                  {vis.badge}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-300">{vis.caption}</p>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                                {(vis.steps || []).map((st, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[10px]"
                                  >
                                    <div className="font-bold text-amber-300">
                                      {st.icon} {st.stepLabel}
                                    </div>
                                    <div className="text-slate-300 mt-0.5">{st.description}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {generatedPreview.implementasiSehariHari?.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                            🌍 Implementasi Materi dalam Kehidupan Sehari-hari ({generatedPreview.implementasiSehariHari.length} Kasus Nyata):
                          </div>
                          {generatedPreview.implementasiSehariHari.map((imp, iIdx) => (
                            <div
                              key={imp.id || iIdx}
                              className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[10px] space-y-1"
                            >
                              <div className="font-bold text-emerald-200">
                                {imp.icon} {imp.title}
                              </div>
                              <div className="text-slate-300">
                                <strong className="text-rose-300">Masalah Harian:</strong> {imp.dailyProblem}
                              </div>
                              <div className="text-slate-300">
                                <strong className="text-sky-300">Penerapan Materi:</strong> {imp.conceptApplication}
                              </div>
                              <div className="text-emerald-300">
                                <strong>Manfaat Nyata:</strong> {imp.realBenefit}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 2. Studio ON AIR (Materi Lebih Dikembangkan) */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-rose-500/30 space-y-2">
                      <div className="text-[11px] font-bold text-rose-300">
                        🎙️ 2. Pengembangan Materi Studio ON AIR (Podcast &amp; Radio Kampus):
                      </div>
                      <p className="text-xs text-white font-bold">
                        {generatedPreview.topikPodcastMentor}
                      </p>
                      {generatedPreview.ringkasanMendalamPodcast && (
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          {generatedPreview.ringkasanMendalamPodcast}
                        </p>
                      )}
                      {generatedPreview.studiKasusPodcast && (
                        <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 text-[10px] text-rose-100">
                          <strong className="text-amber-300">💡 Studi Kasus Siaran:</strong>{' '}
                          {generatedPreview.studiKasusPodcast}
                        </div>
                      )}
                      {generatedPreview.poinDiskusiPodcast?.length > 0 && (
                        <ul className="space-y-1 text-[10px] text-slate-300">
                          {generatedPreview.poinDiskusiPodcast.map((pt, pIdx) => (
                            <li key={pIdx} className="flex items-start gap-1.5">
                              <span className="text-rose-400 font-bold">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-[11px] text-amber-300 font-semibold pt-1">
                        🎯 Pertanyaan Pemantik HOTS: &ldquo;{generatedPreview.pertanyaanPemantikPodcast}&rdquo;
                      </div>
                    </div>

                    {/* 3. Pertanyaan Refleksi */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-bold text-emerald-300 mb-1.5">
                        🌿 Pertanyaan Refleksi di Pusat Refleksi:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                        {generatedPreview.pertanyaanRefleksi.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ol>
                    </div>

                    {/* 4. 5 Kuis Lab DKV (Penerapan Kehidupan Sehari-hari) */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                      <div className="text-[11px] font-bold text-cyan-300 mb-2">
                        🛠️ 3. Lab DKV &amp; Tefa — 5 Soal Penerapan Masalah Teknologi Sehari-hari:
                      </div>
                      <div className="space-y-2">
                        {generatedPreview.kuisBengkel.map((q, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px]"
                          >
                            <div className="font-bold text-white">{q.question}</div>
                            <div className="text-emerald-400 mt-1">
                              ✓ Jawaban Benar: {q.options[q.correctIndex]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DAFTAR BANK MATERI & DISTRIBUSI BANGUNAN */}
          {activeTab === 'daftar' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-sm font-black text-white">
                    📦 Daftar Bank Materi Guru yang Tersebar di Kota Refleksia ({bankMateriList.length} Materi)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seluruh materi di bawah ini sudah aktif di Perpustakaan, Pusat Refleksi, Studio ON AIR, Lab DKV & Tefa, dan Balai Kota untuk dipelajari Siswa.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('form')}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Materi Baru</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* List of Entries */}
                <div className="lg:col-span-5 space-y-3">
                  {bankMateriList.map((entry) => {
                    const isSelected =
                      (selectedDetailEntry?.id || bankMateriList[0]?.id) === entry.id;
                    return (
                      <div
                        key={entry.id}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedDetailEntry(entry);
                        }}
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/70 border-indigo-400 shadow-lg shadow-indigo-950/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                              {entry.mataPelajaran}
                            </span>
                            <span className="ml-1.5 inline-block px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              {entry.kelasTarget}
                            </span>
                            <h4 className="text-sm font-black text-white mt-1.5">
                              {entry.elemen}
                            </h4>
                            <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                              <strong>TP:</strong> {entry.tujuanPembelajaran}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                              <span>👩‍🏫 {entry.teacherName}</span>
                              <span>•</span>
                              <span>📅 {entry.createdAt}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playClick();
                              onDeleteBankMateri(entry.id);
                              if (selectedDetailEntry?.id === entry.id) {
                                setSelectedDetailEntry(null);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                            title="Hapus Materi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Detail of Selected Entry & 9 Buildings Distribution */}
                <div className="lg:col-span-7">
                  {(() => {
                    const activeEntry = selectedDetailEntry || bankMateriList[0];
                    if (!activeEntry) {
                      return (
                        <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
                          Belum ada materi di Bank Materi. Silakan tambahkan materi pada Tab 1.
                        </div>
                      );
                    }

                    return (
                      <div className="p-5 rounded-2xl bg-slate-950/70 border border-indigo-500/30 space-y-4">
                        <div className="border-b border-slate-800 pb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold">
                              ✓ AKTIF TERSEBAR DI 9 BANGUNAN KOTA
                            </span>
                            <span className="text-xs text-amber-300 font-bold">
                              {activeEntry.mataPelajaran} ({activeEntry.kelasTarget})
                            </span>
                          </div>
                          <h3 className="text-base font-black text-white mt-1.5">
                            Elemen: {activeEntry.elemen}
                          </h3>
                          <p className="text-xs text-slate-300 mt-1">
                            <strong className="text-indigo-300">Tujuan Pembelajaran:</strong>{' '}
                            {activeEntry.tujuanPembelajaran}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 whitespace-pre-line">
                            <strong className="text-indigo-300">Materi Esensial:</strong>{' '}
                            {activeEntry.materiEsensial}
                          </p>
                        </div>

                        {/* Grid 9 Bangunan */}
                        <div>
                          <div className="text-xs font-black text-amber-300 mb-2.5 flex items-center justify-between">
                            <span>🏙️ Distribusi Konten di Setiap Bangunan Refleksia City:</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              Klik tombol bangunan untuk meninjau langsung
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {(activeEntry.tantanganBangunanLain || []).map((b, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-2"
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-black text-white">
                                      {b.buildingIcon} {b.buildingName}
                                    </span>
                                    {onSelectBuilding && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          sounds.playClick();
                                          onSelectBuilding(b.buildingId as BuildingId);
                                        }}
                                        className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 text-[10px] font-bold transition-colors"
                                      >
                                        Buka Gedung →
                                      </button>
                                    )}
                                  </div>
                                  <div className="text-[11px] font-bold text-amber-300 mt-1">
                                    {b.activityTitle}
                                  </div>
                                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                                    {b.materialSummary}
                                  </p>
                                </div>
                                <div className="text-[10px] text-emerald-300 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/20">
                                  🎯 Aksi Siswa: {b.challengePrompt}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SINKRONISASI & GOOGLE APPS SCRIPT v2.7 */}
          {activeTab === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                      <span>Integrasi Google Spreadsheet Bank Materi Guru (Versi 2.7)</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">
                      Setiap kali Bapak/Ibu Guru mengklik <strong>Generate AI & Simpan</strong>, data otomatis tersimpan ke Sheet{' '}
                      <code className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">
                        Bank_Materi_Guru
                      </code>{' '}
                      di Google Spreadsheet dan dapat diakses oleh seluruh siswa.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {settings.spreadsheetUrl && (
                      <a
                        href={settings.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Buka Google Spreadsheet</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={handleCopyScript}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all"
                    >
                      {copiedScript ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Skrip v2.7 Berhasil Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Salin Kode Google Apps Script v2.7</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-emerald-300">1. Sheet Baru Otomatis</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Skrip v2.7 otomatis membuat tab Sheet <strong>Bank_Materi_Guru</strong> lengkap dengan 21 kolom kurikulum & distribusi AI.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-amber-300">2. Kompatibilitas Mundur</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dilengkapi cadangan otomatis berlabel <code>[BANK_MATERI_AI]</code> sehingga data tetap tersimpan aman di Spreadsheet.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="font-bold text-indigo-300">3. Sinkronisasi Lintas Perangkat</div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Siswa yang login dari HP/laptop mana pun otomatis menerima materi hasil Generate AI Guru di setiap bangunan kota.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Code2 className="w-4 h-4 text-indigo-400" />
                      <span>Kode Lengkap Google Apps Script v2.7 (Code.gs):</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Tempelkan di Extensions &gt; Apps Script &gt; Deploy New Version
                    </span>
                  </div>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-emerald-300 font-mono overflow-x-auto max-h-80 leading-relaxed">
                    {GOOGLE_APPS_SCRIPT_CODE}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
