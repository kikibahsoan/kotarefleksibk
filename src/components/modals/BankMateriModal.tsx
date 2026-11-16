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
    ringkasanAI: string;
    modulPerpustakaan: string;
    pertanyaanRefleksi: string[];
    topikPodcastMentor: string;
    pertanyaanPemantikPodcast: string;
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
        resolvedTp = `Peserta didik mampu memahami dan menerapkan konsep ${resolvedElemen} (Model Input-Process-Output, Sistem Operasi, Struktur Data Stack/Queue, serta Algoritma Pencarian & Pengurutan) dalam menyelesaikan permasalahan kejuruan DKV secara sistematis.`;
      } else {
        resolvedTp = `Peserta didik mampu menganalisis prinsip ${resolvedElemen} pada mata pelajaran ${cleanMapel} serta menerapkannya dalam pembuatan karya desain komunikasi visual yang efektif, estetis, dan komunikatif.`;
      }
      setTujuanPembelajaran(resolvedTp);
    }

    if (!resolvedEss) {
      if (mapelLower.includes('informatika') || mapelLower.includes('komputasional')) {
        resolvedEss = `1. Model Input-Process-Output (IPO) pada arsitektur Von Neumann dan peran CPU, RAM, serta SSD saat mengolah aset grafis.\n2. Penjadwalan proses Sistem Operasi menggunakan algoritma FIFO dan Shortest Job First (SJF) serta pencegahan Deadlock.\n3. Struktur data Array, Stack (LIFO pada fitur Undo & tumpukan Layer), dan Queue (FIFO pada antrean cetak/render).\n4. Efisiensi algoritma pencarian (Linear Search vs Binary Search) dan pengurutan (Sorting) untuk manajemen ribuan file aset desain.`;
      } else {
        resolvedEss = `1. Konsep fundamental dan prinsip utama pada elemen ${resolvedElemen} (${cleanMapel}).\n2. Pengaturan komposisi visual, kontras warna, tipografi, dan ruang kosong (White Space) agar pesan utama terbaca dalam 3 detik.\n3. Standar alur kerja produksi kreatif mulai dari riset data audiens (Input), pengolahan konsep di kanvas kerja (Process), hingga ekspor karya cetak CMYK 300 DPI maupun digital sRGB (Output).`;
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

    return {
      ringkasanAI: `Materi "${cleanEl}" pada mata pelajaran ${cleanMapel} (${kelasTarget}) yang disusun oleh ${tName} ini berfokus pada pencapaian Tujuan Pembelajaran: "${cleanTp}". Siswa dipandu menguasai konsep esensial secara bertahap mulai dari literasi di Perpustakaan, refleksi diri di Pusat Refleksi, diskusi lisan di Studio ON AIR, hingga evaluasi 5 jenjang di Lab DKV & Tefa.`,
      modulPerpustakaan: `BAB 1 — PENGANTAR ELEMEN: ${cleanEl.toUpperCase()}\nMata Pelajaran: ${cleanMapel} (${kelasTarget})\nGuru Pengampu: ${tName}\n\nTujuan Pembelajaran:\n${cleanTp}\n\nBAB 2 — INTI MATERI ESENSIAL\n${cleanEss}\n\nBAB 3 — PENERAPAN KONTEKSTUAL & LANGKAH PRAKTIS DI KOTA REFLEKSIA\n1. Pahami konsep kunci dan istilah utama pada materi ${cleanEl}.\n2. Hubungkan poin-poin materi esensial di atas dengan tugas praktik atau proyek kejuruan sebagai siswa SMK jurusan DKV.\n3. Evaluasi hasil belajarmu melalui pencatatan Jurnal 4F (Facts, Feelings, Findings, Future) serta latihan kuis berjenjang di Lab DKV & Tefa.`,
      pertanyaanRefleksi: [
        `Dari materi "${cleanEl}" (${cleanMapel}), bagian konsep esensial mana yang paling cepat kamu pahami dan mengapa?`,
        `Tantangan atau kesulitan apa yang kamu temukan saat mencoba mencapai Tujuan Pembelajaran: "${cleanTp}"?`,
        `Langkah konkret apa yang akan kamu lakukan pada proyek atau latihan berikutnya untuk menerapkan materi ini secara lebih optimal?`,
      ],
      topikPodcastMentor: `Kupas Tuntas ${cleanMapel}: Strategi Menguasai Elemen "${cleanEl}" bersama ${tName}`,
      pertanyaanPemantikPodcast: `Setelah mempelajari materi esensial "${cleanEl}", bagaimana cara kamu menjelaskan kembali konsep utamanya dengan bahasa sendiri serta menerapkannya dalam karya nyata?`,
      misiBalaiKota: `Misi Kota (${cleanMapel}): Pelajari modul "${cleanEl}" di Perpustakaan, tulis refleksi di Pusat Refleksi, dan taklukkan Kuis 5 Jenjang di Lab DKV & Tefa!`,
      tantanganBangunanLain: [
        {
          buildingId: 'perpustakaan',
          buildingName: 'Perpustakaan Kampus',
          buildingIcon: '📚',
          activityTitle: `Modul Bacaan & Jurnal 4F: ${cleanEl}`,
          materialSummary: `Baca modul lengkap ${cleanMapel} yang disusun oleh ${tName} tentang "${cleanEl}", lalu rangkum temuanmu di Jurnal 4F.`,
          challengePrompt: `Baca 3 Bab modul "${cleanEl}" di Rak Buku Perpustakaan dan simpan Jurnal 4F (+XP).`,
        },
        {
          buildingId: 'taman_refleksi',
          buildingName: 'Pusat Refleksi',
          buildingIcon: '🌿',
          activityTitle: `Refleksi Mandiri: ${cleanEl}`,
          materialSummary: `Evaluasi pemahamanmu terhadap Tujuan Pembelajaran: "${cleanTp}".`,
          challengePrompt: `Pilih materi "${cleanMapel}: ${cleanEl}" di Pusat Refleksi lalu jawab 3 pertanyaan refleksi Guru.`,
        },
        {
          buildingId: 'menara_mentor',
          buildingName: 'Studio ON AIR',
          buildingIcon: '🎙️',
          activityTitle: `Podcast Interaktif AI Mentor: ${cleanEl}`,
          materialSummary: `Diskusikan poin penguatan materi "${cleanEl}" bersama Host AI Mentor di Studio ON AIR.`,
          challengePrompt: `Rekam episode Podcast membahas "${cleanEl}" dan dapatkan umpan balik langsung.`,
        },
        {
          buildingId: 'bengkel_latihan',
          buildingName: 'Lab DKV & Tefa',
          buildingIcon: '🛠️',
          activityTitle: `Kuis Berjenjang 5 Level: ${cleanEl}`,
          materialSummary: `Uji penguasaan materi esensial "${cleanEl}" dari Jenjang 1 (Dasar) hingga Jenjang 5 (Mahir).`,
          challengePrompt: `Kerjakan 5 soal kuis "${cleanMapel} - ${cleanEl}" di Lab DKV & Tefa.`,
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
          materialSummary: `Kirimkan pertanyaan kepada ${tName} jika ada bagian dari materi "${cleanEl}" yang masih belum jelas.`,
          challengePrompt: `Kirim pesan konsultasi materi "${cleanEl}" melalui Kantor Pos.`,
        },
        {
          buildingId: 'monumen_warga',
          buildingName: 'Monumen Warga',
          buildingIcon: '🗿',
          activityTitle: `Diskusi Warga: Berbagi Insight ${cleanEl}`,
          materialSummary: `Diskusikan ide penerapan materi "${cleanEl}" bersama teman sekelas di ruang obrolan Monumen Warga.`,
          challengePrompt: `Bagikan 1 kesimpulan menarik tentang "${cleanEl}" di Monumen Warga.`,
        },
        {
          buildingId: 'pasar_prestasi',
          buildingName: 'Pasar Prestasi',
          buildingIcon: '🏆',
          activityTitle: `Penghargaan Penguasaan Materi ${cleanMapel}`,
          materialSummary: `Setiap aktivitas belajar pada materi "${cleanEl}" menambah skor keaktifan dan XP warga di Pasar Prestasi.`,
          challengePrompt: `Kumpulkan XP dari misi Bank Materi untuk masuk Top 5 Warga Berprestasi.`,
        },
        {
          buildingId: 'masjid',
          buildingName: 'Masjid Al-Hikmah',
          buildingIcon: '🕌',
          activityTitle: `Integrasi Karakter & Keberkahan Ilmu: ${cleanMapel}`,
          materialSummary: `Niatkan mempelajari "${cleanEl}" dengan jujur, tekun, dan penuh tanggung jawab agar ilmu yang diperoleh membawa manfaat.`,
          challengePrompt: `Jaga adab menuntut ilmu dan ketekunan belajar di Kota Refleksia.`,
        },
      ] as BankMateriBuildingDistribution[],
      kuisBengkel: [
        {
          question: `[Jenjang 1 - Dasar] Berdasarkan materi "${cleanEl}" pada mata pelajaran ${cleanMapel}, apa tujuan pembelajaran utama yang ingin dicapai?`,
          options: [
            cleanTp.length > 115 ? cleanTp.slice(0, 115) + '...' : cleanTp,
            'Menghafal daftar istilah tanpa memahami penerapannya dalam proyek',
            'Melewatkan tahapan perencanaan dan analisis konsep dasar',
            'Mengabaikan kaidah keselamatan kerja dan kolaborasi tim',
          ],
          correctIndex: 0,
          explanation: `Tujuan pembelajaran utama pada elemen "${cleanEl}" adalah: ${cleanTp}`,
        },
        {
          question: `[Jenjang 2 - Pemahaman] Manakah pernyataan berikut yang paling sesuai dengan pokok Materi Esensial "${cleanEl}" yang diajarkan oleh ${tName}?`,
          options: [
            'Konsep materi tidak memiliki kaitan dengan praktik nyata siswa',
            cleanEss.length > 115 ? cleanEss.slice(0, 115) + '...' : cleanEss,
            'Seluruh tahapan dikerjakan secara acak tanpa struktur yang jelas',
            'Evaluasi hasil karya tidak diperlukan dalam proses belajar',
          ],
          correctIndex: 1,
          explanation: `Materi esensial menekankan pada pemahaman konsep inti: ${cleanEss.slice(0, 140)}`,
        },
        {
          question: `[Jenjang 3 - Penerapan] Saat menerapkan elemen "${cleanEl}" dalam tugas praktik ${cleanMapel}, langkah awal yang paling tepat dilakukan siswa adalah...`,
          options: [
            'Langsung mengumpulkan tugas tanpa membaca instruksi dan tujuan pembelajaran',
            'Memahami prinsip dasar materi esensial lalu menyusun rencana kerja sesuai indikator capaian',
            'Menyalin pekerjaan teman tanpa melakukan proses analisis mandiri',
            'Menghindari diskusi maupun refleksi ketika menemui kesulitan teknis',
          ],
          correctIndex: 1,
          explanation:
            'Penerapan yang baik selalu dimulai dari pemahaman materi esensial dan perencanaan kerja yang mengacu pada Tujuan Pembelajaran.',
        },
        {
          question: `[Jenjang 4 - Analisis] Mengapa siswa perlu melakukan refleksi setelah mempelajari elemen "${cleanEl}" pada mata pelajaran ${cleanMapel}?`,
          options: [
            'Untuk memetakan bagian konsep yang sudah dikuasai dan merancang perbaikan pada bagian yang masih sulit',
            'Agar tidak perlu mengikuti latihan soal di Lab DKV & Tefa',
            'Hanya sebagai formalitas tanpa dampak pada peningkatan keterampilan',
            'Untuk menggantikan seluruh kegiatan praktik kejuruan di kelas',
          ],
          correctIndex: 0,
          explanation:
            'Refleksi membantu siswa menyadari kekuatan dan celah pemahamannya sehingga dapat menyusun strategi tindak lanjut yang terukur.',
        },
        {
          question: `[Jenjang 5 - Evaluasi & Kreasi] Bagaimana indikator bahwa seorang siswa telah mencapai level Mahir pada elemen "${cleanEl}" (${cleanMapel})?`,
          options: [
            'Hanya mampu menyebutkan judul materi tanpa bisa memberi contoh',
            'Mampu mengintegrasikan konsep materi esensial ke dalam karya/solusi nyata secara mandiri, kritis, dan kreatif',
            'Bergantung sepenuhnya pada bantuan orang lain saat menyelesaikan masalah dasar',
            'Belum dapat menghubungkan tujuan pembelajaran dengan hasil pekerjaan',
          ],
          correctIndex: 1,
          explanation:
            'Pada jenjang Mahir, siswa mampu mengevaluasi dan menerapkan konsep esensial secara kreatif serta mandiri sesuai Tujuan Pembelajaran.',
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
      const timer = window.setTimeout(() => controller.abort(), 14000);
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
            ringkasanAI: d.ringkasanAI || fallbackData.ringkasanAI,
            modulPerpustakaan: d.modulPerpustakaan || fallbackData.modulPerpustakaan,
            pertanyaanRefleksi:
              Array.isArray(d.pertanyaanRefleksi) && d.pertanyaanRefleksi.length > 0
                ? d.pertanyaanRefleksi
                : fallbackData.pertanyaanRefleksi,
            topikPodcastMentor: d.topikPodcastMentor || fallbackData.topikPodcastMentor,
            pertanyaanPemantikPodcast:
              d.pertanyaanPemantikPodcast || fallbackData.pertanyaanPemantikPodcast,
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
      'Peserta didik mampu menganalisis karakter filosofi warna dan merancang sistem identitas visual (Logo, Palet Warna, dan Tipografi) untuk produk UMKM kreatif secara konsisten.'
    );
    setMateriEsensial(
      '1. Fungsi Logo sebagai wajah utama identitas brand (Sederhana, Mudah Diingat, Timeless, Fleksibel).\n2. Psikologi Warna dalam komunikasi visual (Merah: Energi/Keberanian, Biru: Kepercayaan/Teknologi, Kuning: Optimisme, Hijau: Pertumbuhan/Alami).\n3. Konsistensi Brand Guidelines pada kemasan dan media promosi digital.'
    );
    setStatusBanner({
      type: 'info',
      message:
        'Contoh input Elemen, Tujuan Pembelajaran, dan Materi Esensial berhasil diisi! Klik "✨ Generate AI & Sebarkan ke Bangunan Kota" untuk mengolahnya.',
    });
  };

  const handleGenerateAI = async () => {
    sounds.playClick();
    const inputs = ensureCurriculumInputs();
    setIsGeneratingAI(true);
    setStatusBanner({
      type: 'info',
      message:
        '🤖 Arsitek Kurikulum AI sedang menyusun Modul Perpustakaan, Pertanyaan Pusat Refleksi, Topik Podcast Studio ON AIR, 5 Soal Kuis Lab DKV, & Misi 9 Bangunan Refleksia City...',
    });

    try {
      const d = await requestOrBuildAiDistribution(inputs);
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
        ringkasanAI: d.ringkasanAI,
        modulPerpustakaan: d.modulPerpustakaan,
        pertanyaanRefleksi: d.pertanyaanRefleksi || [],
        topikPodcastMentor: d.topikPodcastMentor,
        pertanyaanPemantikPodcast: d.pertanyaanPemantikPodcast,
        misiBalaiKota: d.misiBalaiKota,
        tantanganBangunanLain: d.tantanganBangunanLain || [],
        kuisBengkel: formattedKuis,
        source: d.source,
      });

      sounds.playRewardXp();
      setStatusBanner({
        type: 'success',
        message:
          '✨ Berhasil Generate AI! Periksa hasil distribusi untuk ke-9 bangunan di samping/bawah, lalu klik "🚀 Simpan ke Spreadsheet & Sebarkan" untuk menyimpannya ke Google Spreadsheet.',
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
        '🚀 Sedang menyimpan ke Google Spreadsheet (Sheet Bank_Materi_Guru) & menyebarkan materi ke 9 bangunan Refleksia City...',
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
        materiEsensial: inputs.cleanEss,
        ringkasanAI:
          previewToUse?.ringkasanAI ||
          `Materi ${inputs.cleanMapel} (${inputs.cleanEl}) oleh ${teacher.name} untuk kelas ${kelasTarget}.`,
        modulPerpustakaan: previewToUse?.modulPerpustakaan || inputs.cleanEss,
        pertanyaanRefleksi: previewToUse?.pertanyaanRefleksi || [
          `Apa konsep utama dari materi "${inputs.cleanEl}" yang sudah kamu pahami?`,
          `Bagian mana dari Tujuan Pembelajaran "${inputs.cleanTp}" yang masih menantang?`,
          `Apa rencana tindakanmu untuk menerapkan materi ini pada karya berikutnya?`,
        ],
        topikPodcastMentor:
          previewToUse?.topikPodcastMentor || `Diskusi ${inputs.cleanMapel}: ${inputs.cleanEl}`,
        pertanyaanPemantikPodcast:
          previewToUse?.pertanyaanPemantikPodcast ||
          `Bagaimana cara kamu menerapkan materi "${inputs.cleanEl}" pada proyek kejuruan DKV?`,
        misiBalaiKota:
          previewToUse?.misiBalaiKota ||
          `Pelajari modul "${inputs.cleanEl}" di Perpustakaan, tulis Refleksi, dan kerjakan Kuis 5 Jenjang di Lab DKV!`,
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
        message: `🎉 Materi "${inputs.cleanMapel} — ${inputs.cleanEl}" berhasil disimpan ke Google Spreadsheet dan OTOMATIS TERSEBAR ke seluruh 9 bangunan Refleksia City!`,
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
                        🌐 Bagaimana Sistem Distribusi AI Bekerja?
                      </p>
                      <p>
                        Ketika Bapak/Ibu Guru mengklik tombol{' '}
                        <strong className="text-white">✨ Generate AI</strong>, sistem otomatis menyusun dan menyebarkan materi ke setiap gedung:
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-amber-300">📚 1. Perpustakaan Kampus</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Modul bacaan lengkap 3 BAB + pencatatan Jurnal 4F siswa.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-emerald-300">🌿 2. Pusat Refleksi</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tujuan Pembelajaran (TP) & 3 pertanyaan refleksi mendalam khusus materi ini.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-rose-300">🎙️ 3. Studio ON AIR</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Topik siaran Podcast AI Mentor & pertanyaan pemantik diskusi lisan.
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                        <div className="font-bold text-cyan-300">🛠️ 4. Lab DKV & Tefa</div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          5 Soal Kuis Berjenjang otomatis (Jenjang 1 Dasar s.d. Jenjang 5 Mahir).
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 sm:col-span-2">
                        <div className="font-bold text-indigo-300">
                          🏛️ 5. Balai Kota, 📮 Kantor Pos, 🗿 Monumen Warga, 🏆 Pasar Prestasi & 🕌 Masjid
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Misi aksi warga, topik diskusi publik, konsultasi guru pengampu, lencana XP, & integrasi adab belajar.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[540px] overflow-y-auto pr-1">
                    {/* Ringkasan AI */}
                    <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40">
                      <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-1">
                        ✨ Ringkasan Eksekutif AI ({finalMapel})
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {generatedPreview.ringkasanAI}
                      </p>
                    </div>

                    {/* Modul Perpustakaan */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-bold text-amber-300 mb-1">
                        📚 Modul Bacaan di Perpustakaan Kampus:
                      </div>
                      <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                        {generatedPreview.modulPerpustakaan}
                      </pre>
                    </div>

                    {/* Pertanyaan Refleksi */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-bold text-emerald-300 mb-1.5">
                        🌿 3 Pertanyaan Refleksi di Pusat Refleksi:
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                        {generatedPreview.pertanyaanRefleksi.map((q, i) => (
                          <li key={i}>{q}</li>
                        ))}
                      </ol>
                    </div>

                    {/* Podcast & Balai Kota */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-rose-300 mb-1">
                          🎙️ Topik Studio ON AIR:
                        </div>
                        <p className="text-xs text-slate-200 font-semibold">
                          {generatedPreview.topikPodcastMentor}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Pemantik: "{generatedPreview.pertanyaanPemantikPodcast}"
                        </p>
                      </div>
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                        <div className="text-[11px] font-bold text-indigo-300 mb-1">
                          🏛️ Misi Warga di Balai Kota:
                        </div>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {generatedPreview.misiBalaiKota}
                        </p>
                      </div>
                    </div>

                    {/* 5 Kuis Lab DKV */}
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="text-[11px] font-bold text-cyan-300 mb-2">
                        🛠️ 5 Soal Kuis Berjenjang di Lab DKV & Tefa:
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
