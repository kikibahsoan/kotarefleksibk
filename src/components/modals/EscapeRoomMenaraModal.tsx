import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  X,
  Lock,
  Unlock,
  Trophy,
  Users,
  MessageSquare,
  Send,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Timer,
  Sparkles,
  ShieldCheck,
  ArrowUp,
  ArrowDown,
  GripVertical,
  BookOpen,
  Settings,
  Save,
  KeyRound,
  Layers,
  Award,
  Square,
} from 'lucide-react';
import {
  Student,
  MysteryGroupNumber,
  EscapeFloorNumber,
  EscapeQuestionType,
  EscapeKonfigurasiFloor,
  EscapeProgresRow,
  EscapeSkorRow,
  EscapeTowerPlayerPresence,
  EscapeTowerState,
} from '../../types/index.ts';
import { StorageService } from '../../utils/storage.ts';
import { sounds } from '../../utils/audio.ts';
import { RealtimePresenceMesh } from '../../utils/realtimePresenceMesh.ts';
import { EscapeTowerEngine } from '../../utils/escapeTowerEngine.ts';

interface EscapeRoomMenaraModalProps {
  onClose: () => void;
  student: Student;
  onAddXp?: (amount: number, reason: string) => void;
  onOpenCareerBuildingModal?: () => void;
}

const ALL_GROUPS: MysteryGroupNumber[] = [1, 2, 3, 4, 5, 6, 7, 8];
const FLOOR_NUMBERS: EscapeFloorNumber[] = [1, 2, 3, 4, 5];

const GROUP_COLORS: Record<MysteryGroupNumber, { bg: string; border: string; text: string; hex: string }> = {
  1: { bg: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-300', hex: '#fb7185' },
  2: { bg: 'bg-sky-500/20', border: 'border-sky-400', text: 'text-sky-300', hex: '#38bdf8' },
  3: { bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-300', hex: '#34d399' },
  4: { bg: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-300', hex: '#fbbf24' },
  5: { bg: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-300', hex: '#c084fc' },
  6: { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-300', hex: '#22d3ee' },
  7: { bg: 'bg-pink-500/20', border: 'border-pink-400', text: 'text-pink-300', hex: '#f472b6' },
  8: { bg: 'bg-lime-500/20', border: 'border-lime-400', text: 'text-lime-300', hex: '#a3e635' },
};

interface QuickTemplatePreset {
  id: string;
  label: string;
  description: string;
  floors: Array<{
    nomor_lantai: EscapeFloorNumber;
    judul: string;
    cerita: string;
    soal: string;
    jenis: EscapeQuestionType;
    opsi: string[];
    hint: string;
    kunci_jawaban: string;
    batas_waktu: number;
  }>;
}

const TEACHER_QUICK_TEMPLATES: QuickTemplatePreset[] = [
  {
    id: 'dkv_produksi',
    label: '🎨 Paket 1: Desain Grafis & Produksi DKV',
    description: 'Hirarki Visual, Warna Cetak CMYK, Alur Kerja Desain, Resolusi DPI, dan Portofolio.',
    floors: [
      {
        nomor_lantai: 1,
        judul: 'Lantai 1 • Lobi Keamanan Visual',
        cerita:
          'Pintu utama Menara Pencakar Langit terkunci rapat! Sistem keamanan meminta kelompokmu mengidentifikasi prinsip dasar komposisi visual agar lift menuju Lantai 2 aktif.',
        soal: 'Prinsip desain yang mengatur urutan perhatian mata pembaca dari elemen terpenting (judul utama) ke informasi pendukung disebut...',
        jenis: 'pilihan_ganda',
        opsi: [
          'A. Hirarki Visual (Visual Hierarchy)',
          'B. Distorsi Perspektif',
          'C. Redundansi Piksel',
          'D. Monotonisasi Ruang',
        ],
        hint: 'Istilah untuk menyusun prioritas informasi dari yang paling besar/kontras ke yang terkecil.',
        kunci_jawaban: 'A',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 2,
        judul: 'Lantai 2 • Laboratorium Warna Cetak',
        cerita:
          'Lift berhenti di Lantai 2. Mesin cetak offset raksasa memblokir lorong darurat dan meminta kode singkatan 4 warna tinta utama percetakan.',
        soal: 'Ketik singkatan 4 huruf model warna subtraktif yang wajib digunakan saat menyiapkan file desain untuk dicetak di mesin percetakan (Cyan, Magenta, Yellow, Key/Black):',
        jenis: 'isian_singkat',
        opsi: [],
        hint: 'Terdiri dari 4 huruf kapital: dimulai dengan huruf C dan diakhiri huruf K.',
        kunci_jawaban: 'CMYK',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 3,
        judul: 'Lantai 3 • Ruang Algoritma Produksi Desain',
        cerita:
          'Panel jembatan menuju tangga Lantai 4 teracak! Susun kembali urutan alur kerja (workflow) proyek desain komunikasi visual dari tahap paling awal hingga akhir.',
        soal: 'Susun urutan langkah kerja desainer profesional berikut dari langkah pertama (1) hingga terakhir (4):',
        jenis: 'urutan_langkah',
        opsi: [
          'Memahami Brief Klien & Riset Target Audiens',
          'Membuat Moodboard & Sketsa Kasar (Thumbnail)',
          'Eksekusi Desain Digital & Tipografi',
          'Revisi Akhir & Ekspor File Siap Cetak/Publikasi',
        ],
        hint: 'Mulai dari memahami brief/riset, lalu sketsa/moodboard, kemudian eksekusi digital, dan terakhir ekspor final.',
        kunci_jawaban:
          'Memahami Brief Klien & Riset Target Audiens -> Membuat Moodboard & Sketsa Kasar (Thumbnail) -> Eksekusi Desain Digital & Tipografi -> Revisi Akhir & Ekspor File Siap Cetak/Publikasi',
        batas_waktu: 150,
      },
      {
        nomor_lantai: 4,
        judul: 'Lantai 4 • Brankas Enkripsi Resolusi',
        cerita:
          'Tinggal satu lantai sebelum puncak! Pintu baja Lantai 4 dikunci dengan keypad sandi angka 3 digit yang biasa dipakai desainer untuk standar resolusi cetak tajam.',
        soal: 'Masukkan sandi angka 3 digit: Berapa nilai standar resolusi DPI (Dots Per Inch) minimal agar hasil cetak poster/majalah terlihat tajam dan tidak pecah?',
        jenis: 'sandi_kode',
        opsi: [],
        hint: 'Angka ratusan bulat yang berada di antara 250 dan 350 DPI (bukan 72 DPI untuk layar).',
        kunci_jawaban: '300',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 5,
        judul: 'Lantai 5 • Ruang Kontrol Pintu Atap',
        cerita:
          'Kelompokmu tiba di lantai tertinggi tepat di bawah Pintu Atap Helipad! Jawab teka-teki terakhir ini untuk membuka kunci hidrolik Pintu Atap.',
        soal: 'Kumpulan karya terbaik seorang desainer yang disusun secara rapi dan terkurasi untuk ditunjukkan kepada klien atau perusahaan saat melamar kerja disebut...',
        jenis: 'isian_singkat',
        opsi: [],
        hint: 'Kata benda 10 huruf yang diawali dengan "PORTO..." dan diakhiri "...FOLIO".',
        kunci_jawaban: 'PORTOFOLIO',
        batas_waktu: 120,
      },
    ],
  },
  {
    id: 'fotografi_sinema',
    label: '📷 Paket 2: Fotografi & Videografi SMK',
    description: 'Segitiga Eksposur, Golden Hour, Tahap Produksi Video, Sandi FPS, dan Rule of Thirds.',
    floors: [
      {
        nomor_lantai: 1,
        judul: 'Lantai 1 • Studio Cahaya Kamera',
        cerita: 'Sensor pintu Lantai 1 membutuhkan pemahaman dasar Segitiga Eksposur (Exposure Triangle) fotografi.',
        soal: 'Manakah tiga elemen utama dalam Segitiga Eksposur pada kamera DSLR/Mirrorless?',
        jenis: 'pilihan_ganda',
        opsi: [
          'A. Resolusi, Megapiksel, dan Memori',
          'B. Aperture (Diafragma), Shutter Speed, dan ISO',
          'C. Tripod, Gimbal, dan Filter Lensa',
          'D. Kontras, Saturasi, dan Ketajaman',
        ],
        hint: 'Tiga pengaturan kamera yang mengatur bukaan lensa, kecepatan rana, dan sensitivitas sensor.',
        kunci_jawaban: 'B',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 2,
        judul: 'Lantai 2 • Lorong Komposisi Grid',
        cerita: 'Layar monitor menampilkan garis bantu 3x3 yang membagi bidang foto menjadi 9 bagian sama besar.',
        soal: 'Aturan komposisi fotografi yang menempatkan objek utama pada titik potong garis 3x3 disebut Rule of ... (ketik 1 kata bahasa Inggris):',
        jenis: 'isian_singkat',
        opsi: [],
        hint: 'Kata bahasa Inggris untuk "Pertiga" (diawali huruf T, diakhiri huruf S).',
        kunci_jawaban: 'THIRDS',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 3,
        judul: 'Lantai 3 • Ruang Editing Sinematografi',
        cerita: 'Mesin waktu produksi film meminta urutan proses pembuatan karya video komersial yang benar.',
        soal: 'Susun 4 tahapan produksi film/video berikut dari paling awal hingga akhir:',
        jenis: 'urutan_langkah',
        opsi: [
          'Penulisan Naskah Skenario & Storyboard (Pra-Produksi)',
          'Pengambilan Gambar / Shooting di Lokasi (Produksi)',
          'Penyuntingan Video, Color Grading & Sound Design (Pasca-Produksi)',
          'Distribusi & Penayangan Karya ke Publik',
        ],
        hint: 'Urutkan dari Pra-Produksi (Storyboard) -> Produksi (Shooting) -> Pasca-Produksi (Editing) -> Distribusi.',
        kunci_jawaban:
          'Penulisan Naskah Skenario & Storyboard (Pra-Produksi) -> Pengambilan Gambar / Shooting di Lokasi (Produksi) -> Penyuntingan Video, Color Grading & Sound Design (Pasca-Produksi) -> Distribusi & Penayangan Karya ke Publik',
        batas_waktu: 150,
      },
      {
        nomor_lantai: 4,
        judul: 'Lantai 4 • Pintu Sandi Frame Rate Sinema',
        cerita: 'Keypad pintu baja Lantai 4 menanyakan standar jumlah bingkai per detik (FPS) khas film bioskop.',
        soal: 'Masukkan angka 2 digit standar Frame Per Second (FPS) sinematik yang digunakan pada film layar lebar bioskop:',
        jenis: 'sandi_kode',
        opsi: [],
        hint: 'Angka genap dua digit tepat di bawah 25 FPS.',
        kunci_jawaban: '24',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 5,
        judul: 'Lantai 5 • Atap Lensa Telefoto',
        cerita: 'Satu langkah lagi menuju Helipad Puncak! Jawab istilah efek latar belakang buram (blur) yang indah pada fotografi potret.',
        soal: 'Istilah populer asal bahasa Jepang untuk efek latar belakang blur/buram yang lembut di luar titik fokus lensa adalah...',
        jenis: 'isian_singkat',
        opsi: [],
        hint: 'Terdiri dari 5 huruf: B - O - K - E - H.',
        kunci_jawaban: 'BOKEH',
        batas_waktu: 120,
      },
    ],
  },
  {
    id: 'karier_wirausaha',
    label: '🚀 Paket 3: Karier BMW+ & Kewirausahaan Kreatif',
    description: 'Jalur BMW+, Analisis SWOT, Tahap Membangun Brand, Sandi HAKI, dan Etika Profesi.',
    floors: [
      {
        nomor_lantai: 1,
        judul: 'Lantai 1 • Gerbang Karier Masa Depan',
        cerita: 'Selamat datang di Menara Karier! Tentukan kepanjangan rumus BMW bagi lulusan SMK.',
        soal: 'Apakah kepanjangan dari istilah jalur masa depan lulusan SMK "B - M - W"?',
        jenis: 'pilihan_ganda',
        opsi: [
          'A. Belajar, Membaca, Wisata',
          'B. Bekerja, Melanjutkan Studi, Wirausaha',
          'C. Berlari, Melompat, Wawasan',
          'D. Bisnis, Modal, Waralaba',
        ],
        hint: 'Tiga jalur utama lulusan SMK: masuk industri, kuliah di perguruan tinggi, atau membuka usaha mandiri.',
        kunci_jawaban: 'B',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 2,
        judul: 'Lantai 2 • Ruang Strategi Bisnis Kreatif',
        cerita: 'Sebelum meluncurkan studio kreatif, kelompokmu harus memetakan Kekuatan, Kelemahan, Peluang, dan Ancaman.',
        soal: 'Metode perencanaan strategis yang menganalisis Strengths, Weaknesses, Opportunities, dan Threats disingkat dengan 4 huruf:',
        jenis: 'isian_singkat',
        opsi: [],
        hint: 'Gabungan huruf pertama dari Strengths (S), Weaknesses (W), Opportunities (O), Threats (T).',
        kunci_jawaban: 'SWOT',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 3,
        judul: 'Lantai 3 • Jembatan Branding Usaha',
        cerita: 'Susun tahapan membangun identitas visual merek (Branding) UMKM agar siap bersaing di pasar.',
        soal: 'Urutkan langkah membangun identitas brand UMKM berikut dari langkah pertama hingga terakhir:',
        jenis: 'urutan_langkah',
        opsi: [
          'Riset Nilai Produk & Karakter Target Konsumen',
          'Merancang Nama Brand, Filosofi & Sketsa Logo',
          'Menyusun Panduan Brand (Warna, Tipografi & Desain Kemasan)',
          'Peluncuran Kampanye Promosi & Evaluasi Pasar',
        ],
        hint: 'Riset konsumen dulu -> rancang nama & logo -> susun panduan kemasan -> peluncuran promosi.',
        kunci_jawaban:
          'Riset Nilai Produk & Karakter Target Konsumen -> Merancang Nama Brand, Filosofi & Sketsa Logo -> Menyusun Panduan Brand (Warna, Tipografi & Desain Kemasan) -> Peluncuran Kampanye Promosi & Evaluasi Pasar',
        batas_waktu: 150,
      },
      {
        nomor_lantai: 4,
        judul: 'Lantai 4 • Brankas Sandi Kreatif',
        cerita: 'Pintu Lantai 4 terkunci dengan sandi angka: jika A=1, B=2, C=3, D=4, K=11, V=22.',
        soal: 'Masukkan kode 4 digit gabungan angka urutan abjad untuk huruf D - K - V (D=4, K=11, V=22 -> digabung tanpa spasi menjadi 5 digit):',
        jenis: 'sandi_kode',
        opsi: [],
        hint: 'Gabungkan angka 4, 11, dan 22 menjadi satu deretan angka (41122).',
        kunci_jawaban: '41122',
        batas_waktu: 120,
      },
      {
        nomor_lantai: 5,
        judul: 'Lantai 5 • Pintu Atap Hak Cipta',
        cerita: 'Pintu Atap tinggal selangkah lagi! Sebagai desainer profesional, kamu wajib menghargai karya orisinal dan tidak menjiplak karya orang lain.',
        soal: 'Tindakan menjiplak atau mengakui karya desain milik orang lain seolah-olah karya sendiri disebut... (ketik 1 kata, contoh: PLAGIAT)',
        jenis: 'isian_singkat',
        opsi: [],
        hint: 'Kata 7 huruf yang diawali dengan "PLAG..." dan diakhiri "...IAT".',
        kunci_jawaban: 'PLAGIAT',
        batas_waktu: 120,
      },
    ],
  },
];

interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

export const EscapeRoomMenaraModal: React.FC<EscapeRoomMenaraModalProps> = ({
  onClose,
  student,
  onAddXp,
  onOpenCareerBuildingModal,
}) => {
  // Unique participant identity per browser tab (supports multi-tab testing smoothly)
  const participantIdentity = useMemo(() => {
    try {
      let tabId = sessionStorage.getItem('escape_tower_tab_id');
      if (!tabId) {
        tabId = Math.random().toString(36).slice(2, 6);
        sessionStorage.setItem('escape_tower_tab_id', tabId);
      }
      const regKey = `escape_tower_active_tabs_${student.id}`;
      const now = Date.now();
      let map: Record<string, number> = {};
      try {
        map = JSON.parse(localStorage.getItem(regKey) || '{}');
      } catch {}
      Object.keys(map).forEach((k) => {
        if (now - map[k] > 15000) delete map[k];
      });
      const otherTabs = Object.keys(map).filter((k) => k !== tabId);
      map[tabId] = now;
      localStorage.setItem(regKey, JSON.stringify(map));

      if (otherTabs.length > 0 && !student.isTeacher) {
        return {
          id: `${student.id}__${tabId}`,
          name: `${student.name} (#${otherTabs.length + 1})`,
          tabId,
          regKey,
        };
      }
      return { id: student.id, name: student.name, tabId, regKey };
    } catch {
      return { id: student.id, name: student.name, tabId: 'default', regKey: '' };
    }
  }, [student.id, student.isTeacher, student.name]);

  const effectiveStudentId = participantIdentity.id;
  const effectiveStudentName = participantIdentity.name;

  useEffect(() => {
    if (!participantIdentity.regKey) return;
    const interval = window.setInterval(() => {
      try {
        const map = JSON.parse(localStorage.getItem(participantIdentity.regKey) || '{}');
        map[participantIdentity.tabId] = Date.now();
        localStorage.setItem(participantIdentity.regKey, JSON.stringify(map));
      } catch {}
    }, 4000);
    return () => window.clearInterval(interval);
  }, [participantIdentity]);

  const [selectedGroup, setSelectedGroup] = useState<MysteryGroupNumber>(() => {
    const saved = localStorage.getItem(`escape_tower_group_${effectiveStudentId}`);
    const parsed = saved ? parseInt(saved, 10) : 1;
    return (parsed >= 1 && parsed <= 8 ? parsed : 1) as MysteryGroupNumber;
  });
  const [towerState, setTowerState] = useState<EscapeTowerState | null>(() =>
    EscapeTowerEngine.getInitialHydratedState(
      student,
      effectiveStudentId,
      effectiveStudentName,
      selectedGroup
    )
  );
  const [isVerifiedTeacher, setIsVerifiedTeacher] = useState<boolean>(Boolean(student.isTeacher));

  const [activeRightTab, setActiveRightTab] = useState<'teacher' | 'group' | 'scoreboard' | 'info'>(
    student.isTeacher ? 'teacher' : 'group'
  );

  // Teacher Floor Editor state
  const [editingFloorTab, setEditingFloorTab] = useState<EscapeFloorNumber>(1);
  const [teacherFloorsDraft, setTeacherFloorsDraft] = useState<EscapeKonfigurasiFloor[]>([]);
  const [teacherSettingsDraft, setTeacherSettingsDraft] = useState({
    jumlah_kelompok: 8,
    poin_dasar: 100,
    bonus_kecepatan: 50,
    pengurang_hint: 10,
    pengurang_salah: 5,
    penalti_waktu_salah_detik: 5,
  });
  const [hasInitializedTeacherDraft, setHasInitializedTeacherDraft] = useState(false);

  // Student Shared Answer Input state
  const [localAnswerText, setLocalAnswerText] = useState<string>('');
  const [orderedSteps, setOrderedSteps] = useState<string[]>([]);
  const [draggedStepIdx, setDraggedStepIdx] = useState<number | null>(null);
  const [chatText, setChatText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Elevator & Rooftop Celebration Animation state
  const [elevatorAnimFloor, setElevatorAnimFloor] = useState<number>(1);
  const [doorOpenProgress, setDoorOpenProgress] = useState<number>(1);
  const [rooftopCelebration, setRooftopCelebration] = useState<boolean>(false);
  const awardedSesiRef = useRef<string | null>(null);
  const lastKnownGroupFloorRef = useRef<number>(1);

  // Canvas & Confetti refs
  const towerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const towerStateRef = useRef<EscapeTowerState | null>(null);
  towerStateRef.current = towerState;
  const selectedGroupRef = useRef<MysteryGroupNumber>(selectedGroup);
  selectedGroupRef.current = selectedGroup;
  const confettiRef = useRef<ConfettiParticle[]>([]);

  // Real-time Mesh Peers
  const meshPeersRef = useRef<Map<string, EscapeTowerPlayerPresence>>(new Map());
  const [meshPeersVersion, setMeshPeersVersion] = useState(0);
  const meshRef = useRef<RealtimePresenceMesh | null>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const settings = useMemo(() => StorageService.getSettings(), []);

  const showTempStatus = useCallback((msg: string) => {
    setStatusMessage(msg);
    setErrorMessage(null);
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  }, []);

  const showTempError = useCallback((err: string) => {
    setErrorMessage(err);
    window.setTimeout(() => {
      setErrorMessage((prev) => (prev === err ? null : prev));
    }, 5000);
  }, []);

  const spawnRooftopCelebrationParticles = useCallback(() => {
    const colors = ['#fde047', '#38bdf8', '#34d399', '#fb7185', '#c084fc', '#f97316'];
    const list: ConfettiParticle[] = [];
    for (let i = 0; i < 65; i++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const speed = 0.003 + Math.random() * 0.009;
      list.push({
        x: 0.5 + (Math.random() - 0.5) * 0.28,
        y: 0.14,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: 3.5 + Math.random() * 4.5,
        alpha: 1,
      });
    }
    confettiRef.current = list;
  }, []);

  // Broadcast real-time event across Global WSS Mesh + Local BroadcastChannel
  const publishEscapeMeshEvent = useCallback((escapePayload: any) => {
    const payloadWithTs = {
      ...escapePayload,
      ts: Date.now(),
    };
    try {
      if (meshRef.current) {
        meshRef.current.publish({
          type: 'escape_tower_event',
          escapePayload: payloadWithTs,
        });
      }
    } catch {}
    try {
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'escape_tower_event',
          escapePayload: payloadWithTs,
        });
      }
    } catch {}
  }, []);

  // Fetch state from Server + Local/Mesh Hybrid Engine (polled every 2.4s as required: "Polling 2-3 detik agar ringan untuk Spreadsheet")
  const fetchEscapeTowerState = useCallback(async () => {
    try {
      const json = await EscapeTowerEngine.fetchState({
        student,
        effectiveStudentId,
        effectiveStudentName,
        selectedGroup: selectedGroupRef.current,
      });
      if (json && json.data) {
        setTowerState(json.data);
        setIsVerifiedTeacher(Boolean(json.isVerifiedTeacher));
      }
    } catch {
      // Ignore transient network errors during polling
    }
  }, [effectiveStudentId, effectiveStudentName, student]);

  // Initialize Teacher Draft when verified teacher receives state
  useEffect(() => {
    if (isVerifiedTeacher && towerState && !hasInitializedTeacherDraft) {
      if (towerState.konfigurasi && towerState.konfigurasi.length === 5) {
        setTeacherFloorsDraft(
          towerState.konfigurasi.map((f) => ({
            ...f,
            opsi: f.opsi ? [...f.opsi] : [],
            hint: f.hint || '',
            kunci_jawaban: f.kunci_jawaban || '',
          }))
        );
      }
      if (towerState.sesi) {
        setTeacherSettingsDraft({
          jumlah_kelompok: towerState.sesi.jumlah_kelompok || 8,
          poin_dasar: towerState.sesi.poin_dasar || 100,
          bonus_kecepatan: towerState.sesi.bonus_kecepatan || 50,
          pengurang_hint: towerState.sesi.pengurang_hint || 10,
          pengurang_salah: towerState.sesi.pengurang_salah || 5,
          penalti_waktu_salah_detik: towerState.sesi.penalti_waktu_salah_detik || 5,
        });
      }
      setHasInitializedTeacherDraft(true);
    }
  }, [hasInitializedTeacherDraft, isVerifiedTeacher, towerState]);

  // Handle incoming real-time mesh / broadcast events
  const handleIncomingEscapeMeshPayload = useCallback(
    (payload: any) => {
      if (!payload || typeof payload !== 'object') return;
      if (payload.studentId && payload.studentName) {
        const existing = meshPeersRef.current.get(payload.studentId);
        const nextGrp: MysteryGroupNumber | null = payload.isTeacher
          ? null
          : payload.kelompok || existing?.kelompok || 1;
        meshPeersRef.current.set(payload.studentId, {
          studentId: payload.studentId,
          studentName: payload.studentName,
          className: payload.className || (payload.isTeacher ? 'Dewan Guru' : 'X DKV'),
          gender: payload.gender === 'P' ? 'P' : 'L',
          isTeacher: Boolean(payload.isTeacher),
          kelompok: nextGrp,
          lantai_sekarang: payload.lantai_sekarang || existing?.lantai_sekarang || 1,
          lastSeen: Date.now(),
        });
        setMeshPeersVersion((v) => v + 1);
      }

      const merged = EscapeTowerEngine.mergeIncomingMeshPayload(
        payload,
        effectiveStudentId,
        Boolean(student.isTeacher),
        selectedGroupRef.current
      );
      if (merged) {
        setTowerState(merged);
      }
      if (
        payload.eventType === 'teacher_state_sync' ||
        payload.eventType === 'student_action' ||
        payload.eventType === 'presence_join'
      ) {
        fetchEscapeTowerState();
      }
    },
    [effectiveStudentId, fetchEscapeTowerState, student]
  );

  // Setup 4-Layer Real-Time Sync (WSS Mesh + BroadcastChannel + SSE + 2.4s Polling)
  useEffect(() => {
    fetchEscapeTowerState();

    // Auto-register student in selected group on mount
    if (!student.isTeacher) {
      EscapeTowerEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'join_group',
        kelompok: selectedGroupRef.current,
      })
        .then((json) => {
          if (json?.data) setTowerState(json.data);
        })
        .catch(() => {});
    }

    const announcePresence = () => {
      publishEscapeMeshEvent({
        eventType: 'presence_join',
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        className: student.className || (student.isTeacher ? 'Dewan Guru' : 'X DKV'),
        gender: student.gender === 'P' ? 'P' : 'L',
        isTeacher: Boolean(student.isTeacher),
        studentNumber: student.studentNumber || '',
        kelompok: student.isTeacher ? null : selectedGroupRef.current,
      });
    };

    announcePresence();

    let isMounted = true;
    const mesh = new RealtimePresenceMesh(
      `escape_${effectiveStudentId}`,
      (msg) => {
        if (!isMounted) return;
        if (msg.type === 'escape_tower_event' && msg.escapePayload) {
          handleIncomingEscapeMeshPayload(msg.escapePayload);
        } else if (msg.type === 'escape_tower_request' && msg.senderId !== effectiveStudentId) {
          announcePresence();
        }
      },
      () => {
        if (!isMounted) return;
        mesh.publish({ type: 'escape_tower_request', senderId: effectiveStudentId });
        announcePresence();
      }
    );
    meshRef.current = mesh;

    let bc: BroadcastChannel | null = null;
    try {
      bc =
        typeof BroadcastChannel !== 'undefined'
          ? new BroadcastChannel('kota_refleksi_escape_tower')
          : null;
      broadcastChannelRef.current = bc;
      if (bc) {
        bc.onmessage = (ev) => {
          if (!isMounted) return;
          if (ev.data?.type === 'escape_tower_event' && ev.data.escapePayload) {
            handleIncomingEscapeMeshPayload(ev.data.escapePayload);
          } else if (
            ev.data?.type === 'escape_tower_request' &&
            ev.data.senderId !== effectiveStudentId
          ) {
            announcePresence();
          }
        };
        bc.postMessage({ type: 'escape_tower_request', senderId: effectiveStudentId });
      }
    } catch {}

    // Polling every 2.4 seconds (2-3 detik sesuai spesifikasi)
    const pollInterval = window.setInterval(fetchEscapeTowerState, 2400);
    const heartbeatInterval = window.setInterval(announcePresence, 5000);

    // SSE stream for instant server tick
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/presence/stream');
      es.onmessage = (ev) => {
        try {
          const parsed = JSON.parse(ev.data);
          if (parsed?.type === 'escape_tower_tick') {
            fetchEscapeTowerState();
          }
        } catch {}
      };
    } catch {}

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      window.clearInterval(heartbeatInterval);
      try {
        mesh.dispose();
      } catch {}
      meshRef.current = null;
      if (bc) {
        try {
          bc.close();
        } catch {}
      }
      broadcastChannelRef.current = null;
      if (es) es.close();
    };
  }, [
    effectiveStudentId,
    effectiveStudentName,
    fetchEscapeTowerState,
    handleIncomingEscapeMeshPayload,
    publishEscapeMeshEvent,
    student.className,
    student.gender,
    student.isTeacher,
    student.studentNumber,
  ]);

  const myGroupProgress: EscapeProgresRow | null = useMemo(() => {
    if (!towerState?.progres) return null;
    return towerState.progres[selectedGroup] || null;
  }, [selectedGroup, towerState?.progres]);

  const currentFloorNumber: 1 | 2 | 3 | 4 | 5 | 6 = myGroupProgress?.lantai_sekarang || 1;

  const activeFloorConfig: EscapeKonfigurasiFloor | null = useMemo(() => {
    if (!towerState?.konfigurasi) return null;
    const targetFl = currentFloorNumber <= 5 ? (currentFloorNumber as EscapeFloorNumber) : 5;
    return towerState.konfigurasi.find((f) => f.nomor_lantai === targetFl) || null;
  }, [currentFloorNumber, towerState?.konfigurasi]);

  // Sync shared draft answer & step ordering when group or floor changes
  useEffect(() => {
    if (!activeFloorConfig) return;
    if (activeFloorConfig.jenis === 'urutan_langkah') {
      const stepsFromDraft = myGroupProgress?.draft_jawaban
        ? myGroupProgress.draft_jawaban
            .split(' -> ')
            .map((s) => s.trim())
            .filter(Boolean)
        : [];
      if (
        stepsFromDraft.length === (activeFloorConfig.opsi || []).length &&
        stepsFromDraft.length > 0
      ) {
        setOrderedSteps(stepsFromDraft);
      } else if (activeFloorConfig.opsi && activeFloorConfig.opsi.length > 0) {
        setOrderedSteps([...activeFloorConfig.opsi]);
      }
    } else if (myGroupProgress?.draft_jawaban !== undefined) {
      setLocalAnswerText(myGroupProgress.draft_jawaban);
    }
  }, [
    activeFloorConfig?.jenis,
    activeFloorConfig?.nomor_lantai,
    myGroupProgress?.draft_jawaban,
    selectedGroup,
  ]);

  // Trigger Elevator / Door Animation & Rooftop Celebration when group advances floor!
  useEffect(() => {
    const prevFl = lastKnownGroupFloorRef.current;
    if (currentFloorNumber > prevFl) {
      sounds.playOpenModal();
      setDoorOpenProgress(0);
      const startTime = performance.now();
      const startFloor = prevFl;
      const targetFloor = currentFloorNumber;

      const stepAnim = (now: number) => {
        const t = Math.min(1, (now - startTime) / 900);
        const eased = 1 - Math.pow(1 - t, 3);
        setElevatorAnimFloor(startFloor + (targetFloor - startFloor) * eased);
        setDoorOpenProgress(t);
        if (t < 1) {
          window.requestAnimationFrame(stepAnim);
        } else {
          setElevatorAnimFloor(targetFloor);
          setDoorOpenProgress(1);
        }
      };
      window.requestAnimationFrame(stepAnim);

      if (currentFloorNumber === 6) {
        setRooftopCelebration(true);
        sounds.playVictoryFanfare();
        spawnRooftopCelebrationParticles();

        // Award XP/Coin to members of the group that reached the rooftop (once per session)
        const sesiId = towerState?.sesi?.id_sesi || 'escape-1';
        const awardKey = `${sesiId}_grp_${selectedGroup}`;
        if (!student.isTeacher && awardedSesiRef.current !== awardKey) {
          awardedSesiRef.current = awardKey;
          const rank = myGroupProgress?.peringkat_atap || 1;
          const xpReward = rank === 1 ? 25 : rank <= 3 ? 15 : 10;
          if (onAddXp) {
            onAddXp(
              xpReward,
              `Menyelesaikan Escape Room Menara (Kelompok ${selectedGroup} • Peringkat #${rank})`
            );
          }
        }
      }
    } else {
      setElevatorAnimFloor(currentFloorNumber);
    }
    lastKnownGroupFloorRef.current = currentFloorNumber;
  }, [
    currentFloorNumber,
    myGroupProgress?.peringkat_atap,
    onAddXp,
    selectedGroup,
    spawnRooftopCelebrationParticles,
    student.isTeacher,
    towerState?.sesi?.id_sesi,
  ]);

  // Total Elapsed Timer & Penalty Cooldown Timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [cooldownRemainingSec, setCooldownRemainingSec] = useState<number>(0);

  useEffect(() => {
    const updateTimers = () => {
      const sesi = towerStateRef.current?.sesi;
      const now = Date.now();
      if (!sesi || !sesi.waktu_mulai_ms || sesi.status === 'menunggu') {
        setElapsedSeconds(0);
      } else if (sesi.status === 'jeda' && sesi.waktu_jeda_ms) {
        const activeMs = sesi.waktu_jeda_ms - sesi.waktu_mulai_ms - (sesi.total_durasi_jeda_ms || 0);
        setElapsedSeconds(Math.max(0, Math.floor(activeMs / 1000)));
      } else if (sesi.status === 'berjalan') {
        const activeMs = now - sesi.waktu_mulai_ms - (sesi.total_durasi_jeda_ms || 0);
        setElapsedSeconds(Math.max(0, Math.floor(activeMs / 1000)));
      }

      const prog = towerStateRef.current?.progres?.[selectedGroupRef.current];
      if (prog?.cooldown_sampai_ms && now < prog.cooldown_sampai_ms) {
        setCooldownRemainingSec(Math.ceil((prog.cooldown_sampai_ms - now) / 1000));
      } else {
        setCooldownRemainingSec(0);
      }
    };

    updateTimers();
    const id = window.setInterval(updateTimers, 300);
    return () => window.clearInterval(id);
  }, []);

  const formatDuration = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Student Action: Join Group (1..jumlah_kelompok)
  const handleJoinGroup = async (kelompok: MysteryGroupNumber) => {
    sounds.playClick();
    setSelectedGroup(kelompok);
    localStorage.setItem(`escape_tower_group_${effectiveStudentId}`, String(kelompok));

    publishEscapeMeshEvent({
      eventType: 'student_action',
      actionType: 'join_group',
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      kelompok,
    });

    try {
      const json = await EscapeTowerEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'join_group',
        kelompok,
      });
      if (json?.data) {
        setTowerState(json.data);
        showTempStatus(`Bergabung ke Kelompok ${kelompok}!`);
      }
    } catch {
      showTempError('Gagal bergabung ke kelompok.');
    }
  };

  // Student Action: Sync Shared Group Answer Draft
  const syncSharedGroupDraft = async (nextDraft: string) => {
    setLocalAnswerText(nextDraft);
    try {
      const json = await EscapeTowerEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'sync_draft',
        kelompok: selectedGroup,
        draft_jawaban: nextDraft,
      });
      if (json?.data) {
        setTowerState(json.data);
      }
      publishEscapeMeshEvent({
        eventType: 'student_action',
        actionType: 'sync_draft',
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        kelompok: selectedGroup,
        draft_jawaban: nextDraft,
        groupProgress: json?.data?.progres?.[selectedGroup],
      });
    } catch {}
  };

  // Student Action: Request Hint ("Minta Petunjuk")
  const handleRequestHint = async () => {
    sounds.playClick();
    setIsSubmitting(true);
    try {
      const json = await EscapeTowerEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'request_hint',
        kelompok: selectedGroup,
      });
      if (!json.success) {
        showTempError(json.error || 'Gagal meminta petunjuk.');
      } else if (json.data) {
        const nextState = json.data as EscapeTowerState;
        setTowerState(nextState);
        showTempStatus(
          `💡 Petunjuk Lantai ${currentFloorNumber} terbuka untuk Kelompok ${selectedGroup}! (-${nextState.sesi.pengurang_hint} poin)`
        );
        const prog = nextState.progres?.[selectedGroup];
        if (prog) {
          StorageService.syncEscapeProgresToGAS(prog);
        }
        publishEscapeMeshEvent({
          eventType: 'student_action',
          actionType: 'request_hint',
          studentId: effectiveStudentId,
          studentName: effectiveStudentName,
          kelompok: selectedGroup,
          groupProgress: prog,
          scores: nextState.skor,
        });
      }
    } catch {
      showTempError('Gagal membuka petunjuk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Action: Submit Group Answer for Current Floor
  const handleSubmitGroupAnswer = async (overrideAnswer?: string) => {
    if (!activeFloorConfig) return;
    const finalAnswer =
      overrideAnswer !== undefined
        ? overrideAnswer
        : activeFloorConfig.jenis === 'urutan_langkah'
        ? orderedSteps.join(' -> ')
        : localAnswerText.trim();

    if (!finalAnswer) {
      showTempError('Isi atau pilih jawaban kelompok terlebih dahulu!');
      return;
    }

    setIsSubmitting(true);
    try {
      const json = await EscapeTowerEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'submit_answer',
        kelompok: selectedGroup,
        jawaban: finalAnswer,
      });
      if (!json.success) {
        sounds.playBounceKnockback();
        showTempError(json.error || 'Gagal mengirim jawaban.');
        return;
      }

      if (json.data) {
        const nextState = json.data as EscapeTowerState;
        setTowerState(nextState);
        const updatedProg = nextState.progres?.[selectedGroup];
        if (updatedProg) {
          StorageService.syncEscapeProgresToGAS(updatedProg);
        }
        if (nextState.skor) {
          StorageService.syncEscapeSkorToGAS(nextState.skor);
        }
      }

      if (json.hasil === 'benar') {
        sounds.playRewardXp();
        setLocalAnswerText('');
        showTempStatus(json.message || '✅ Jawaban Benar! Lantai berikutnya terbuka!');
      } else {
        sounds.playBounceKnockback();
        showTempError(json.message || '❌ Jawaban belum tepat, coba lagi!');
      }

      publishEscapeMeshEvent({
        eventType: 'student_action',
        actionType: 'submit_answer',
        studentId: effectiveStudentId,
        studentName: effectiveStudentName,
        kelompok: selectedGroup,
        jawaban: finalAnswer,
        groupProgress: json.data?.progres?.[selectedGroup],
        scores: json.data?.skor,
        lantai_sekarang: json.data?.progres?.[selectedGroup]?.lantai_sekarang,
      });
    } catch {
      showTempError('Gagal memverifikasi jawaban.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag & Drop / Reorder helpers for "urutan_langkah"
  const moveStepItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= orderedSteps.length) return;
    sounds.playClick();
    const copy = [...orderedSteps];
    const [moved] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, moved);
    setOrderedSteps(copy);
    syncSharedGroupDraft(copy.join(' -> '));
  };

  // Student Action: Send Group Chat
  const handleSendGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = chatText.trim();
    if (!trimmed) return;
    setChatText('');
    sounds.playClick();

    publishEscapeMeshEvent({
      eventType: 'student_action',
      actionType: 'send_group_chat',
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      kelompok: selectedGroup,
      chatContent: trimmed,
    });

    try {
      const json = await EscapeTowerEngine.executeStudentAction({
        student,
        effectiveStudentId,
        effectiveStudentName,
        actionType: 'send_group_chat',
        kelompok: selectedGroup,
        chatContent: trimmed,
      });
      if (json?.data) setTowerState(json.data);
    } catch {}
  };

  // Teacher Action Handler (Hybrid Server + Client/Mesh Engine)
  const executeTeacherAction = async (actionType: string, extraPayload: Record<string, any> = {}) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const json = await EscapeTowerEngine.executeTeacherAction({
        student,
        actionType,
        extraPayload,
      });
      if (!json.success) {
        showTempError(json.error || 'Gagal menjalankan aksi Guru.');
        return null;
      }
      if (json.data) {
        const nextState = json.data as EscapeTowerState;
        setTowerState(nextState);

        publishEscapeMeshEvent({
          eventType: 'teacher_state_sync',
          actionType,
          studentId: effectiveStudentId,
          studentName: effectiveStudentName,
          isTeacher: true,
          canonicalStore: json.canonicalStore,
        });

        // Sync to Google Spreadsheet (Escape_Konfigurasi, Escape_Sesi, Escape_Skor)
        if (actionType === 'save_konfigurasi' && nextState.konfigurasi) {
          StorageService.syncEscapeKonfigurasiToGAS({
            konfigurasi: nextState.konfigurasi,
            teacherId: student.id,
            teacherName: student.name,
            teacherPin: settings.teacherPin,
          });
        }
        if (nextState.sesi) {
          StorageService.syncEscapeSesiToGAS({
            sesi: nextState.sesi,
            teacherId: student.id,
            teacherName: student.name,
            teacherPin: settings.teacherPin,
          });
        }
        if (nextState.skor) {
          StorageService.syncEscapeSkorToGAS(nextState.skor);
        }
        return nextState;
      }
    } catch {
      showTempError('Gagal menjalankan aksi Guru.');
    } finally {
      setIsSubmitting(false);
    }
    return null;
  };

  const handleApplyQuickTemplate = (preset: QuickTemplatePreset) => {
    sounds.playClick();
    const mapped: EscapeKonfigurasiFloor[] = preset.floors.map((f) => ({
      nomor_lantai: f.nomor_lantai,
      judul: f.judul,
      cerita: f.cerita,
      soal: f.soal,
      jenis: f.jenis,
      opsi: [...f.opsi],
      hint: f.hint,
      kunci_jawaban: f.kunci_jawaban,
      batas_waktu: f.batas_waktu,
    }));
    setTeacherFloorsDraft(mapped);
    showTempStatus(`✨ Template "${preset.label}" dimuat! Klik "Simpan Konfigurasi" untuk menerapkan.`);
  };

  // Unified real-time list of all online participants (Server + Global Mesh + Self)
  const allOnlineParticipants = useMemo(() => {
    void meshPeersVersion;
    const map = new Map<string, EscapeTowerPlayerPresence>();
    (towerState?.towerPlayers || []).forEach((p) => {
      if (p && p.studentId) {
        map.set(p.studentId, p);
      }
    });
    meshPeersRef.current.forEach((peer, pid) => {
      const existing = map.get(pid);
      if (!existing || peer.lastSeen > existing.lastSeen) {
        map.set(pid, peer);
      }
    });
    map.set(effectiveStudentId, {
      studentId: effectiveStudentId,
      studentName: effectiveStudentName,
      className: student.className || (student.isTeacher ? 'Dewan Guru' : 'X DKV'),
      gender: student.gender === 'P' ? 'P' : 'L',
      isTeacher: Boolean(student.isTeacher),
      kelompok: student.isTeacher ? null : selectedGroup,
      lantai_sekarang: student.isTeacher ? 1 : currentFloorNumber,
      lastSeen: Date.now(),
    });
    return Array.from(map.values());
  }, [
    currentFloorNumber,
    effectiveStudentId,
    effectiveStudentName,
    meshPeersVersion,
    selectedGroup,
    student.className,
    student.gender,
    student.isTeacher,
    towerState?.towerPlayers,
  ]);

  const onlineStudentsList = useMemo(
    () => allOnlineParticipants.filter((p) => !p.isTeacher),
    [allOnlineParticipants]
  );

  // Unified real-time group member roster (Kelompok 1 - 8)
  const groupRosterMap = useMemo(() => {
    const map: Record<
      MysteryGroupNumber,
      Array<{ studentId: string; studentName: string; className: string; isOnline: boolean }>
    > = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
      6: [],
      7: [],
      8: [],
    };

    ALL_GROUPS.forEach((gNum) => {
      const serverMembers = towerState?.groupMembers?.[gNum] || [];
      serverMembers.forEach((m: any) => {
        if (!m || !m.studentId) return;
        const isOnline = allOnlineParticipants.some(
          (ap) =>
            ap.studentId === m.studentId ||
            ap.studentName.trim().toLowerCase() === String(m.studentName || '').trim().toLowerCase()
        );
        if (!map[gNum].some((ex) => ex.studentId === m.studentId)) {
          map[gNum].push({
            studentId: m.studentId,
            studentName: m.studentName,
            className: m.className || 'X DKV',
            isOnline,
          });
        }
      });
    });

    allOnlineParticipants.forEach((ap) => {
      if (ap.isTeacher) return;
      const gNum = (ap.kelompok ||
        towerState?.studentGroupMap?.[ap.studentId] ||
        1) as MysteryGroupNumber;
      if (gNum >= 1 && gNum <= 8) {
        ALL_GROUPS.forEach((otherG) => {
          if (otherG !== gNum) {
            map[otherG] = map[otherG].filter((m) => m.studentId !== ap.studentId);
          }
        });
        const idx = map[gNum].findIndex((m) => m.studentId === ap.studentId);
        if (idx >= 0) {
          map[gNum][idx].isOnline = true;
          map[gNum][idx].studentName = ap.studentName;
        } else {
          map[gNum].push({
            studentId: ap.studentId,
            studentName: ap.studentName,
            className: ap.className || 'X DKV',
            isOnline: true,
          });
        }
      }
    });

    return map;
  }, [allOnlineParticipants, towerState?.groupMembers, towerState?.studentGroupMap]);

  // 60FPS Skyscraper Escape Room Visual Simulation Canvas
  useEffect(() => {
    const canvas = towerCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;

    const renderTower = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (
        canvas.width !== Math.floor(rect.width * dpr) ||
        canvas.height !== Math.floor(rect.height * dpr)
      ) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const W = rect.width;
      const H = rect.height;

      const state = towerStateRef.current;
      const maxGrp = state?.sesi?.jumlah_kelompok || 8;
      const myGrp = selectedGroupRef.current;
      const myProg = state?.progres?.[myGrp];
      const myFl = myProg?.lantai_sekarang || 1;

      // 1. Night/Twilight Futuristic Skyscraper Skyline Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#020617');
      skyGrad.addColorStop(0.55, '#0f172a');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, W, H);

      // Distant city stars & skyline silhouettes
      ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      for (let s = 0; s < 18; s++) {
        const sx = ((s * 97) % 100) * 0.01 * W;
        const sy = ((s * 43) % 65) * 0.01 * H;
        ctx.fillRect(sx, sy, 2, 2);
      }

      // 2. Main Blue Skyscraper Structure ("REFLEKSIA TIMUR • PENCAKAR LANGIT")
      const towerLeft = W * 0.14;
      const towerRight = W * 0.86;
      const towerW = towerRight - towerLeft;
      const roofY = H * 0.14;
      const baseY = H * 0.91;
      const totalFloorsH = baseY - roofY;
      const floorH = totalFloorsH / 6; // 5 puzzle floors + 1 roof level

      // Outer Blue Glass Frame
      ctx.fillStyle = '#0c4a6e';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(towerLeft - 6, roofY - 12, towerW + 12, totalFloorsH + 18, 10);
      ctx.fill();
      ctx.stroke();

      // Spire & Aviation Beacon at the very top
      const centerX = W * 0.5;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(centerX, roofY - 12);
      ctx.lineTo(centerX, 6);
      ctx.stroke();

      const beaconPulse = Math.sin(now * 0.008) > 0;
      ctx.fillStyle = beaconPulse ? '#f43f5e' : '#fbbf24';
      ctx.beginPath();
      ctx.arc(centerX, 6, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Rooftop Level (Level 6: PINTU ATAP & HELIPAD KEMENANGAN)
      const roofBoxTop = roofY;
      const roofBoxH = floorH * 0.92;
      const anyGroupOnRoof = Object.values(state?.progres || {}).some(
        (p) => p.lantai_sekarang === 6
      );
      const isMyGroupOnRoof = !student.isTeacher && myFl === 6;

      ctx.fillStyle =
        anyGroupOnRoof || isMyGroupOnRoof
          ? 'rgba(16, 185, 129, 0.28)'
          : 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = anyGroupOnRoof || isMyGroupOnRoof ? '#34d399' : '#475569';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(towerLeft + 6, roofBoxTop, towerW - 12, roofBoxH, 6);
      ctx.fill();
      ctx.stroke();

      // Rooftop Door Visual (Opens when reached!)
      const doorX = centerX;
      const doorY = roofBoxTop + roofBoxH * 0.52;
      ctx.fillStyle = anyGroupOnRoof ? '#10b981' : '#334155';
      ctx.beginPath();
      ctx.roundRect(doorX - 58, roofBoxTop + 5, 116, roofBoxH - 10, 6);
      ctx.fill();

      ctx.fillStyle = anyGroupOnRoof ? '#fef08a' : '#cbd5e1';
      ctx.font = 'bold 10.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        anyGroupOnRoof
          ? '🔓 PINTU ATAP TERBUKA! 🏆 HELIPAD PUNCAK'
          : '🔒 PINTU ATAP MENARA (SELESAIKAN LANTAI 1–5)',
        doorX,
        doorY + 3
      );

      // 4. Draw Floors 5 down to 1
      for (let f = 5; f >= 1; f--) {
        const rowIndexFromTop = 6 - f; // f=5 -> 1, f=1 -> 5
        const fTop = roofY + rowIndexFromTop * floorH;
        const fH = floorH * 0.92;

        const isCompletedByMe = !student.isTeacher && myFl > f;
        const isCurrentForMe = !student.isTeacher && myFl === f;
        const flMeta = state?.konfigurasi?.find((k) => k.nomor_lantai === f);

        ctx.save();
        if (isCompletedByMe) {
          ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
          ctx.strokeStyle = '#34d399';
        } else if (isCurrentForMe || student.isTeacher) {
          ctx.fillStyle = 'rgba(14, 165, 233, 0.25)';
          ctx.strokeStyle = '#38bdf8';
        } else {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = '#334155';
        }
        ctx.lineWidth = isCurrentForMe ? 2.2 : 1.3;
        ctx.beginPath();
        ctx.roundRect(towerLeft + 6, fTop, towerW - 12, fH, 6);
        ctx.fill();
        ctx.stroke();

        // Left Floor Label & Lock/Unlock Icon
        const statusIcon = isCompletedByMe
          ? '✅'
          : isCurrentForMe || student.isTeacher
          ? '🔓'
          : '🔒';
        ctx.fillStyle = isCompletedByMe
          ? '#6ee7b7'
          : isCurrentForMe || student.isTeacher
          ? '#7dd3fc'
          : '#64748b';
        ctx.font = 'bold 10.5px sans-serif';
        ctx.textAlign = 'left';
        const shortTitle = (flMeta?.judul || `Lantai ${f}`).slice(0, 32);
        ctx.fillText(`${statusIcon} ${shortTitle}`, towerLeft + 14, fTop + fH * 0.58);

        // Groups currently on this floor (Badges on the right side of the floor)
        const groupsOnFloor: MysteryGroupNumber[] = [];
        for (let g = 1; g <= maxGrp; g++) {
          const grp = g as MysteryGroupNumber;
          const p = state?.progres?.[grp];
          if ((p?.lantai_sekarang || 1) === f) {
            groupsOnFloor.push(grp);
          }
        }

        groupsOnFloor.forEach((gNum, idx) => {
          const gColor = GROUP_COLORS[gNum];
          const bx = towerRight - 26 - idx * 34;
          const by = fTop + fH * 0.5;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.beginPath();
          ctx.roundRect(bx - 15, by - 9, 30, 18, 6);
          ctx.fill();
          ctx.strokeStyle = gColor.hex;
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = gColor.hex;
          ctx.font = 'bold 9.5px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`K${gNum}`, bx, by + 3.5);
        });

        ctx.restore();
      }

      // Groups on the Rooftop (lantai_sekarang === 6)
      const groupsOnRoof: MysteryGroupNumber[] = [];
      for (let g = 1; g <= maxGrp; g++) {
        const grp = g as MysteryGroupNumber;
        if (state?.progres?.[grp]?.lantai_sekarang === 6) {
          groupsOnRoof.push(grp);
        }
      }
      groupsOnRoof.forEach((gNum, idx) => {
        const gColor = GROUP_COLORS[gNum];
        const bx = towerRight - 26 - idx * 36;
        const by = roofBoxTop + roofBoxH * 0.5;
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.roundRect(bx - 17, by - 9, 34, 18, 6);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        ctx.fillStyle = gColor.hex;
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🏆K${gNum}`, bx, by + 3.5);
      });

      // 5. Animated Glass Elevator Shaft in the Left-Center of the Tower
      const shaftX = towerLeft + towerW * 0.48;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(shaftX - 16, roofY, 32, totalFloorsH);

      const clampedAnimFl = Math.max(1, Math.min(6, elevatorAnimFloor));
      const elevRowFromTop = 6 - clampedAnimFl;
      const elevY = roofY + elevRowFromTop * floorH + floorH * 0.1;
      const elevH = floorH * 0.72;

      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(shaftX - 14, elevY, 28, elevH, 4);
      ctx.fill();
      ctx.stroke();

      // Sliding Elevator Doors
      const doorGap = Math.max(0, Math.min(1, doorOpenProgress)) * 10;
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(shaftX - 12, elevY + 2, 12 - doorGap, elevH - 4);
      ctx.fillRect(shaftX + doorGap, elevY + 2, 12 - doorGap, elevH - 4);

      // 6. Base Lobby & Teacher Control Podium at Bottom
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(centerX - 105, baseY + 2, 210, H - baseY - 4, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👨‍🏫 LOBI BAWAH & PODIUM KONTROL GURU', centerX, baseY + (H - baseY) * 0.62);

      // 7. Confetti / Fireworks Celebration Particles on Roof Completion
      if (confettiRef.current.length > 0) {
        confettiRef.current.forEach((pt) => {
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.00018; // gravity
          pt.alpha = Math.max(0, pt.alpha - 0.006);
          if (pt.alpha > 0.01) {
            ctx.save();
            ctx.globalAlpha = pt.alpha;
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x * W, pt.y * H, pt.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        });
      }

      ctx.restore();
      animId = window.requestAnimationFrame(renderTower);
    };

    animId = window.requestAnimationFrame(renderTower);
    return () => window.cancelAnimationFrame(animId);
  }, [doorOpenProgress, elevatorAnimFloor, student.isTeacher]);

  // Sorted Scoreboard Rows
  const sortedScores: EscapeSkorRow[] = useMemo(() => {
    const maxGrp = towerState?.sesi?.jumlah_kelompok || 8;
    const list = (towerState?.skor || []).filter((s) => s.kelompok <= maxGrp);
    return [...list].sort((a, b) => {
      // 1. Groups that reached the roof first (by peringkat ascending)
      if (a.peringkat && b.peringkat) return a.peringkat - b.peringkat;
      if (a.peringkat && !b.peringkat) return -1;
      if (!a.peringkat && b.peringkat) return 1;
      // 2. Then by total_poin descending
      if (b.total_poin !== a.total_poin) return b.total_poin - a.total_poin;
      // 3. Then by current floor descending
      const flA = towerState?.progres?.[a.kelompok]?.lantai_sekarang || 1;
      const flB = towerState?.progres?.[b.kelompok]?.lantai_sekarang || 1;
      return flB - flA;
    });
  }, [towerState?.progres, towerState?.sesi?.jumlah_kelompok, towerState?.skor]);

  const myGroupChats = useMemo(() => {
    if (!towerState?.groupChats) return [];
    return towerState.groupChats.filter((c) => c.kelompok === selectedGroup);
  }, [selectedGroup, towerState?.groupChats]);

  const maxActiveGroups = towerState?.sesi?.jumlah_kelompok || 8;
  const visibleGroups = useMemo(
    () => ALL_GROUPS.filter((g) => g <= maxActiveGroups),
    [maxActiveGroups]
  );

  const isHintAlreadyUnlockedForCurrentFloor = Boolean(
    currentFloorNumber <= 5 &&
      myGroupProgress?.hint_terbuka_lantai?.includes(currentFloorNumber as EscapeFloorNumber)
  );

  const editingFloorObj = useMemo(
    () => teacherFloorsDraft.find((f) => f.nomor_lantai === editingFloorTab) || null,
    [editingFloorTab, teacherFloorsDraft]
  );

  const updateEditingFloorField = (field: keyof EscapeKonfigurasiFloor, value: any) => {
    setTeacherFloorsDraft((prev) =>
      prev.map((f) => (f.nomor_lantai === editingFloorTab ? { ...f, [field]: value } : f))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-slate-900 border border-sky-500/40 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-slate-100">
        {/* TOP HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border-b border-slate-700/80 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-xl sm:text-2xl shadow-lg border border-sky-300/40 shrink-0">
              🏙️
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg text-white truncate">
                  Escape Room Menara • Refleksia Timur Pencakar Langit
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {allOnlineParticipants.length} Peserta Online ({onlineStudentsList.length} Siswa)
                  </span>
                </span>
                {towerState?.sesi && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                      towerState.sesi.status === 'berjalan'
                        ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
                        : towerState.sesi.status === 'jeda'
                        ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                        : towerState.sesi.status === 'selesai'
                        ? 'bg-sky-500/30 text-sky-200 border-sky-400'
                        : 'bg-slate-800 text-slate-300 border-slate-600'
                    }`}
                  >
                    Status: {towerState.sesi.status.toUpperCase()}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                Pecahkan 5 Teka-Teki Berurutan (Lantai 1–5) Bersama Kelompokmu untuk Membuka Pintu Atap Menara!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenCareerBuildingModal && (
              <button
                onClick={onOpenCareerBuildingModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/40 text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                title="Buka Peta Karier & Materi Gedung Pencakar Langit"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Peta Karier &amp; Materi</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer border border-slate-600/60"
              title="Keluar dari Escape Room Menara"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STATUS / ERROR BANNER */}
        {(statusMessage || errorMessage) && (
          <div
            className={`px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 shrink-0 border-b ${
              errorMessage
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {errorMessage ? (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>{errorMessage || statusMessage}</span>
            </div>
          </div>
        )}

        {/* MAIN RESPONSIVE BODY: LEFT TOWER & PUZZLE STAGE (7 COLS) + RIGHT TABS PANEL (5 COLS) */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
          {/* LEFT COLUMN (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col p-3 sm:p-4 gap-3 overflow-y-auto">
            {/* TOP SESSION & TIMER SUMMARY BAR */}
            <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-indigo-950/90 border border-sky-400/40 rounded-2xl p-3 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-sky-500/30 border border-sky-400/50 text-sky-200 font-mono font-extrabold text-xs">
                    {towerState?.sesi?.id_sesi?.toUpperCase() || 'ESCAPE-1'}
                  </span>
                  {!student.isTeacher && (
                    <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/50 text-indigo-200 font-extrabold text-xs">
                      Kelompok {selectedGroup} •{' '}
                      {currentFloorNumber === 6
                        ? '🏆 PINTU ATAP TERBUKA!'
                        : `Lantai ${currentFloorNumber} dari 5`}
                    </span>
                  )}
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>
                      Poin Dasar: {towerState?.sesi?.poin_dasar || 100} (+Bonus{' '}
                      {towerState?.sesi?.bonus_kecepatan || 50})
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {!student.isTeacher && myGroupProgress && (
                    <span className="text-[11px] font-bold text-slate-300 bg-slate-900/90 px-2 py-0.5 rounded-lg border border-slate-700">
                      💡 Hint: {myGroupProgress.hint_dipakai} • ❌ Salah:{' '}
                      {myGroupProgress.jumlah_salah}
                    </span>
                  )}
                  <div className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/50 text-amber-200">
                    <Timer className="w-3.5 h-3.5" />
                    <span>
                      Waktu: {formatDuration(elapsedSeconds)}
                      {!student.isTeacher && (myGroupProgress?.penalti_waktu_detik || 0) > 0
                        ? ` (+${myGroupProgress?.penalti_waktu_detik}d penalti)`
                        : ''}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    Keamanan Server Aktif: Kunci jawaban &amp; progres jawaban kelompok lain tidak dikirim ke browser siswa.
                  </span>
                </span>
                {towerState?.winningGroups && towerState.winningGroups.length > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400 text-emerald-200 font-extrabold">
                    🏆 Juara Puncak Atap: Kelompok {towerState.winningGroups[0]}!
                  </span>
                )}
              </div>
            </div>

            {/* DEDICATED TOWER LAYOUT INFO BAR (OUTSIDE CANVAS SO SIMULATION IS NEVER COVERED) */}
            <div className="bg-slate-950/90 border border-slate-700/80 rounded-xl px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-200 shrink-0">
              <div className="font-extrabold text-sky-300 flex items-center gap-1.5">
                <span>🏢 Tata Letak Menara:</span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-slate-300">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    <strong>Puncak:</strong> Pintu Atap &amp; Helipad
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>
                    <strong>Tengah:</strong> Lantai 1–5 &amp; Lift Kaca
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>
                    <strong>Bawah:</strong> Lobi &amp; Podium Guru
                  </span>
                </span>
              </div>
            </div>

            {/* LIVE SKYSCRAPER TOWER VISUAL SIMULATION CANVAS (CLEAN & UNOBSTRUCTED) */}
            <div className="relative w-full h-[250px] sm:h-[285px] rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950 shrink-0">
              <canvas ref={towerCanvasRef} className="w-full h-full block" />
            </div>

            {/* LIVE PARTICIPANTS ROSTER STRIP */}
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="text-[11px] font-extrabold text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>
                    Peserta Bergabung Real-Time ({allOnlineParticipants.length} Orang •{' '}
                    {onlineStudentsList.length} Siswa)
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Polling Ringan 2–3 Detik + Real-Time Mesh
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[64px] overflow-y-auto pr-1">
                {allOnlineParticipants.map((p) => {
                  const isMe = p.studentId === effectiveStudentId || p.studentId === student.id;
                  const pGrp = p.kelompok || towerState?.studentGroupMap?.[p.studentId];
                  const grpFl = pGrp ? towerState?.progres?.[pGrp]?.lantai_sekarang || 1 : 1;
                  return (
                    <span
                      key={p.studentId}
                      className={`px-2 py-0.5 rounded-lg text-[10.5px] font-bold flex items-center gap-1 border ${
                        p.isTeacher
                          ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                          : isMe
                          ? 'bg-sky-500/25 border-sky-400 text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>{p.isTeacher ? `👨‍🏫 ${p.studentName}` : p.studentName}</span>
                      {!p.isTeacher && pGrp && (
                        <span className="px-1 rounded bg-slate-800 text-sky-300 text-[9.5px] font-extrabold">
                          K{pGrp}
                        </span>
                      )}
                      {!p.isTeacher && pGrp && (
                        <span className="px-1 rounded bg-emerald-500/20 text-emerald-300 text-[9.5px] font-extrabold">
                          {grpFl === 6 ? '🏆ATAP' : `L${grpFl}`}
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* SHARED GROUP PUZZLE & ANSWER PANEL (FOR STUDENTS) OR FLOOR OVERVIEW (FOR TEACHER) */}
            {student.isTeacher ? (
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3.5">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Ringkasan Posisi Kelompok di 5 Lantai &amp; Pintu Atap:</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Buka tab Panel Guru di kanan untuk mengelola soal &amp; sesi
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((flNum) => {
                    const groupsHere = visibleGroups.filter(
                      (g) => (towerState?.progres?.[g]?.lantai_sekarang || 1) === flNum
                    );
                    const flTitle =
                      flNum === 6
                        ? '🏆 Pintu Atap (Selesai)'
                        : towerState?.konfigurasi?.find((k) => k.nomor_lantai === flNum)?.judul ||
                          `Lantai ${flNum}`;
                    return (
                      <div
                        key={flNum}
                        className={`p-2.5 rounded-xl border ${
                          flNum === 6
                            ? 'bg-emerald-950/40 border-emerald-500/40'
                            : 'bg-slate-900/90 border-slate-700/80'
                        }`}
                      >
                        <div className="text-[11px] font-extrabold text-white truncate">
                          {flTitle}
                        </div>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {groupsHere.length > 0 ? (
                            groupsHere.map((g) => (
                              <span
                                key={g}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold border ${GROUP_COLORS[g].bg} ${GROUP_COLORS[g].border} ${GROUP_COLORS[g].text}`}
                              >
                                Kelompok {g}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-500">Kosong</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : currentFloorNumber === 6 ? (
              /* ROOFTOP VICTORY CARD FOR STUDENT GROUP */
              <div className="bg-gradient-to-br from-emerald-950/90 via-slate-900 to-amber-950/70 border-2 border-emerald-400/70 rounded-2xl p-4 text-center shadow-xl">
                <div className="text-3xl sm:text-4xl mb-1">🏆🔓🎉</div>
                <h3 className="text-base sm:text-lg font-black text-emerald-300">
                  SELAMAT! KELOMPOK {selectedGroup} BERHASIL MEMBUKA PINTU ATAP!
                </h3>
                <p className="text-xs text-slate-200 mt-1">
                  Kelompokmu telah menyelesaikan seluruh 5 lantai teka-teki Menara Pencakar Langit Refleksia Timur!
                </p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-extrabold">
                  <span className="px-3 py-1 rounded-xl bg-amber-500/25 border border-amber-400 text-amber-200">
                    🏅 Peringkat Atap: #{myGroupProgress?.peringkat_atap || 1}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-sky-500/25 border border-sky-400 text-sky-200">
                    ⏱️ Total Waktu: {formatDuration(myGroupProgress?.durasi_detik)}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-500/25 border border-emerald-400 text-emerald-200">
                    ⭐ Total Poin:{' '}
                    {towerState?.skor?.find((s) => s.kelompok === selectedGroup)?.total_poin || 0}{' '}
                    Poin
                  </span>
                </div>
              </div>
            ) : (
              /* ACTIVE FLOOR PUZZLE & SHARED GROUP ANSWER BOX FOR STUDENTS */
              <div className="bg-slate-800/75 border border-sky-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/25 border border-sky-400 text-sky-200 text-xs font-black flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{activeFloorConfig?.judul || `Lantai ${currentFloorNumber}`}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] font-bold text-slate-300 uppercase">
                      {activeFloorConfig?.jenis === 'pilihan_ganda'
                        ? 'Pilihan Ganda'
                        : activeFloorConfig?.jenis === 'urutan_langkah'
                        ? 'Susun Algoritma (Drag & Drop)'
                        : activeFloorConfig?.jenis === 'sandi_kode'
                        ? 'Sandi / Kode'
                        : 'Isian Singkat'}
                    </span>
                  </div>

                  {/* Minta Petunjuk (Hint) Button */}
                  <button
                    type="button"
                    disabled={
                      isSubmitting ||
                      isHintAlreadyUnlockedForCurrentFloor ||
                      towerState?.sesi?.status !== 'berjalan'
                    }
                    onClick={handleRequestHint}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 border transition cursor-pointer ${
                      isHintAlreadyUnlockedForCurrentFloor
                        ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                        : 'bg-amber-500/25 hover:bg-amber-500/35 border-amber-400 text-amber-200 disabled:opacity-50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>
                      {isHintAlreadyUnlockedForCurrentFloor
                        ? '💡 Petunjuk Terbuka'
                        : `💡 Minta Petunjuk (-${towerState?.sesi?.pengurang_hint || 10} Poin)`}
                    </span>
                  </button>
                </div>

                {/* Short Narrative Story */}
                {activeFloorConfig?.cerita && (
                  <div className="text-xs text-sky-200/90 italic bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2">
                    “{activeFloorConfig.cerita}”
                  </div>
                )}

                {/* Floor Question */}
                <div className="text-xs sm:text-sm font-bold text-white bg-slate-950/90 border border-slate-700/80 rounded-xl p-3 leading-relaxed">
                  {activeFloorConfig?.soal || 'Memuat teka-teki lantai...'}
                </div>

                {/* Unlocked Hint Box */}
                {activeFloorConfig?.hint && (
                  <div className="bg-amber-950/60 border border-amber-400/60 rounded-xl px-3 py-2 text-xs text-amber-200 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-extrabold">Petunjuk Lantai {currentFloorNumber}: </span>
                      <span>{activeFloorConfig.hint}</span>
                    </div>
                  </div>
                )}

                {/* Penalty Cooldown Warning */}
                {cooldownRemainingSec > 0 && (
                  <div className="bg-rose-950/80 border border-rose-500/60 rounded-xl px-3 py-2 text-xs font-extrabold text-rose-200 flex items-center justify-between">
                    <span>
                      ⏳ Jawaban sebelumnya belum tepat! Penalti waktu tunggu sebelum mencoba lagi:
                    </span>
                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-mono">
                      {cooldownRemainingSec} detik
                    </span>
                  </div>
                )}

                {/* SHARED GROUP ANSWER INPUT BY QUESTION TYPE */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-3">
                  <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                    <span className="text-[11px] font-extrabold text-emerald-300">
                      🤝 Kolom Jawaban Bersama Kelompok {selectedGroup}:
                    </span>
                    {myGroupProgress?.terakhir_dijawab_oleh && (
                      <span className="text-[10px] text-slate-400">
                        Terakhir diisi oleh: <strong>{myGroupProgress.terakhir_dijawab_oleh}</strong>
                      </span>
                    )}
                  </div>

                  {activeFloorConfig?.jenis === 'pilihan_ganda' && (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(activeFloorConfig.opsi && activeFloorConfig.opsi.length > 0
                          ? activeFloorConfig.opsi
                          : ['A. Pilihan A', 'B. Pilihan B', 'C. Pilihan C', 'D. Pilihan D']
                        ).map((opt, idx) => {
                          const letter = ['A', 'B', 'C', 'D'][idx] || String(idx + 1);
                          const isSelected =
                            localAnswerText.trim().toUpperCase() === letter ||
                            localAnswerText.trim() === opt;
                          return (
                            <button
                              key={idx}
                              type="button"
                              disabled={
                                isSubmitting ||
                                cooldownRemainingSec > 0 ||
                                towerState?.sesi?.status !== 'berjalan'
                              }
                              onClick={() => {
                                sounds.playClick();
                                syncSharedGroupDraft(letter);
                              }}
                              className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-500/30 border-sky-400 text-white shadow-md'
                                  : 'bg-slate-950/80 hover:bg-slate-800 border-slate-700 text-slate-200'
                              } disabled:opacity-50`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        type="button"
                        disabled={
                          isSubmitting ||
                          cooldownRemainingSec > 0 ||
                          !localAnswerText.trim() ||
                          towerState?.sesi?.status !== 'berjalan'
                        }
                        onClick={() => handleSubmitGroupAnswer()}
                        className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
                      >
                        🔓 Kirim Jawaban Pilihan Kelompok {selectedGroup} ({localAnswerText || '-'})
                      </button>
                    </div>
                  )}

                  {activeFloorConfig?.jenis === 'urutan_langkah' && (
                    <div className="flex flex-col gap-2">
                      <div className="text-[11px] text-slate-300 mb-0.5">
                        Geser (Drag &amp; Drop) atau gunakan tombol panah ↑ ↓ untuk menyusun urutan langkah yang benar:
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {orderedSteps.map((stepText, idx) => (
                          <div
                            key={`${idx}-${stepText}`}
                            draggable
                            onDragStart={() => setDraggedStepIdx(idx)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => {
                              if (draggedStepIdx !== null && draggedStepIdx !== idx) {
                                moveStepItem(draggedStepIdx, idx);
                              }
                              setDraggedStepIdx(null);
                            }}
                            className="flex items-center justify-between gap-2 bg-slate-950/90 border border-slate-700 hover:border-sky-400/60 rounded-xl px-3 py-2 text-xs font-bold text-slate-100 cursor-grab"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <GripVertical className="w-4 h-4 text-slate-500 shrink-0" />
                              <span className="w-5 h-5 rounded-full bg-sky-500/25 border border-sky-400 text-sky-300 text-[10px] font-black flex items-center justify-center shrink-0">
                                {idx + 1}
                              </span>
                              <span className="truncate">{stepText}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => moveStepItem(idx, idx - 1)}
                                disabled={idx === 0}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                                title="Geser ke Atas"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveStepItem(idx, idx + 1)}
                                disabled={idx === orderedSteps.length - 1}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 cursor-pointer"
                                title="Geser ke Bawah"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        disabled={
                          isSubmitting ||
                          cooldownRemainingSec > 0 ||
                          towerState?.sesi?.status !== 'berjalan'
                        }
                        onClick={() => handleSubmitGroupAnswer(orderedSteps.join(' -> '))}
                        className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer disabled:opacity-50"
                      >
                        🔓 Kunci &amp; Periksa Urutan Algoritma Kelompok {selectedGroup}
                      </button>
                    </div>
                  )}

                  {(activeFloorConfig?.jenis === 'isian_singkat' ||
                    activeFloorConfig?.jenis === 'sandi_kode') && (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={localAnswerText}
                          onChange={(e) => syncSharedGroupDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSubmitGroupAnswer();
                            }
                          }}
                          disabled={
                            isSubmitting ||
                            cooldownRemainingSec > 0 ||
                            towerState?.sesi?.status !== 'berjalan'
                          }
                          placeholder={
                            activeFloorConfig.jenis === 'sandi_kode'
                              ? 'Masukkan kode sandi / angka pembuka pintu...'
                              : 'Ketik jawaban singkat kelompokmu di sini...'
                          }
                          className="flex-1 bg-slate-950 border border-slate-700 focus:border-sky-400 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-extrabold text-white tracking-wider outline-none"
                        />
                        <button
                          type="button"
                          disabled={
                            isSubmitting ||
                            cooldownRemainingSec > 0 ||
                            !localAnswerText.trim() ||
                            towerState?.sesi?.status !== 'berjalan'
                          }
                          onClick={() => handleSubmitGroupAnswer()}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg transition cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                        >
                          <Unlock className="w-4 h-4" />
                          <span>Buka Pintu</span>
                        </button>
                      </div>

                      {/* Quick Keypad for sandi_kode */}
                      {activeFloorConfig.jenis === 'sandi_kode' && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-400 mr-1 flex items-center gap-1">
                            <KeyRound className="w-3 h-3 text-amber-400" />
                            <span>Keypad Cepat:</span>
                          </span>
                          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                            <button
                              key={digit}
                              type="button"
                              disabled={
                                isSubmitting ||
                                cooldownRemainingSec > 0 ||
                                towerState?.sesi?.status !== 'berjalan'
                              }
                              onClick={() => {
                                sounds.playClick();
                                syncSharedGroupDraft(`${localAnswerText}${digit}`);
                              }}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono font-black text-amber-300 cursor-pointer disabled:opacity-40"
                            >
                              {digit}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => syncSharedGroupDraft('')}
                            className="px-2 h-7 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-[10px] font-bold text-rose-200 cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {towerState?.sesi?.status !== 'berjalan' && (
                    <div className="mt-2 text-[11px] text-amber-300 font-bold">
                      ⏳ Menunggu Bapak/Ibu Guru menekan tombol &ldquo;Mulai Permainan&rdquo; agar kolom jawaban aktif.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN (5 COLS): 4 TABS MATCHING ARENA RUMAH MISTERI */}
          <div className="lg:col-span-5 flex flex-col bg-slate-900/95 overflow-hidden">
            {/* TAB BAR */}
            <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/90 border-b border-slate-800 shrink-0">
              {student.isTeacher && (
                <button
                  onClick={() => setActiveRightTab('teacher')}
                  className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                    activeRightTab === 'teacher'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Panel Guru</span>
                </button>
              )}
              <button
                onClick={() => setActiveRightTab('group')}
                className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeRightTab === 'group'
                    ? 'bg-sky-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Kelompok &amp; Chat</span>
              </button>
              <button
                onClick={() => setActiveRightTab('scoreboard')}
                className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeRightTab === 'scoreboard'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Papan Skor</span>
              </button>
              <button
                onClick={() => setActiveRightTab('info')}
                className={`py-2 px-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer ${
                  activeRightTab === 'info'
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Info</span>
              </button>
            </div>

            {/* TAB CONTENT AREA */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {/* TAB 1: PANEL GURU */}
              {activeRightTab === 'teacher' && student.isTeacher && (
                <div className="space-y-3.5">
                  {/* 1. KONTROL SESI PERMAINAN */}
                  <div className="bg-slate-950/90 border border-amber-500/40 rounded-2xl p-3 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Play className="w-3.5 h-3.5" />
                        <span>Kontrol Sesi Escape Room Menara</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Sesi: {towerState?.sesi?.id_sesi}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        disabled={isSubmitting || towerState?.sesi?.status === 'berjalan'}
                        onClick={() =>
                          executeTeacherAction('start_game').then((st) => {
                            if (st) showTempStatus('🚀 Permainan Escape Room Menara dimulai!');
                          })
                        }
                        className="py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Mulai Permainan</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || towerState?.sesi?.status !== 'berjalan'}
                        onClick={() =>
                          executeTeacherAction('pause_game').then((st) => {
                            if (st) showTempStatus('⏸️ Permainan dijeda sementara.');
                          })
                        }
                        className="py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Pause className="w-3.5 h-3.5" />
                        <span>Jeda</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || towerState?.sesi?.status !== 'jeda'}
                        onClick={() =>
                          executeTeacherAction('resume_game').then((st) => {
                            if (st) showTempStatus('▶️ Permainan dilanjutkan!');
                          })
                        }
                        className="py-2 px-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Lanjut</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting || towerState?.sesi?.status === 'selesai'}
                        onClick={() =>
                          executeTeacherAction('end_game').then((st) => {
                            if (st) showTempStatus('🏁 Sesi permainan diakhiri.');
                          })
                        }
                        className="py-2 px-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Square className="w-3.5 h-3.5" />
                        <span>Akhiri</span>
                      </button>

                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() =>
                          executeTeacherAction('reset_game').then((st) => {
                            if (st)
                              showTempStatus(
                                '🔄 Seluruh kelompok direset kembali ke Lantai 1!'
                              );
                          })
                        }
                        className="col-span-2 sm:col-span-2 py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Semua Kelompok ke Lantai 1</span>
                      </button>
                    </div>
                  </div>

                  {/* 2. PANTAUAN LANGSUNG TIAP KELOMPOK */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-sky-300">
                        📊 Pantauan Langsung Kelompok (1–{maxActiveGroups})
                      </span>
                      <span className="text-[10px] text-slate-400">Real-Time</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-1">
                      {visibleGroups.map((gNum) => {
                        const prog = towerState?.progres?.[gNum];
                        const skorRow = towerState?.skor?.find((s) => s.kelompok === gNum);
                        const members = groupRosterMap[gNum] || [];
                        const fl = prog?.lantai_sekarang || 1;
                        return (
                          <div
                            key={gNum}
                            className={`p-2 rounded-xl border ${GROUP_COLORS[gNum].bg} ${GROUP_COLORS[gNum].border}`}
                          >
                            <div className="flex items-center justify-between text-xs font-extrabold">
                              <span className={GROUP_COLORS[gNum].text}>Kelompok {gNum}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-950/90 text-[10px] text-white">
                                {fl === 6 ? `🏆 ATAP (#${prog?.peringkat_atap || 1})` : `Lantai ${fl}/5`}
                              </span>
                            </div>
                            <div className="mt-1 flex flex-wrap items-center justify-between text-[10px] text-slate-300">
                              <span>
                                ❌ Salah: <strong>{prog?.jumlah_salah || 0}</strong> • 💡 Hint:{' '}
                                <strong>{prog?.hint_dipakai || 0}</strong>
                              </span>
                              <span className="font-bold text-amber-300">
                                {skorRow?.total_poin || 0} Poin
                              </span>
                            </div>
                            <div className="mt-1 text-[10px] text-slate-400 truncate">
                              ⏱️ Waktu:{' '}
                              {prog?.durasi_detik
                                ? `${formatDuration(prog.durasi_detik)} (Selesai)`
                                : formatDuration(elapsedSeconds + (prog?.penalti_waktu_detik || 0))}
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {members.length > 0 ? (
                                members.map((m) => (
                                  <span
                                    key={m.studentId}
                                    className="px-1.5 py-0.5 rounded bg-slate-950/80 text-[9.5px] text-slate-200 font-semibold"
                                  >
                                    {m.studentName}
                                  </span>
                                ))
                              ) : (
                                <span className="text-[9.5px] text-slate-500 italic">
                                  Belum ada anggota
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. TEMPLATE SOAL CEPAT (OPSIONAL) */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Template Soal Cepat 5 Lantai (Opsional):</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {TEACHER_QUICK_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => handleApplyQuickTemplate(tpl)}
                          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition cursor-pointer"
                        >
                          <div className="text-xs font-extrabold text-white">{tpl.label}</div>
                          <div className="text-[10px] text-slate-400">{tpl.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. PENGATURAN POIN & KELOMPOK */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <div className="text-xs font-extrabold text-amber-300">
                      ⚙️ Pengaturan Kelompok &amp; Rumus Poin
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Jml Kelompok (1-8)</span>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={teacherSettingsDraft.jumlah_kelompok}
                          onChange={(e) =>
                            setTeacherSettingsDraft((p) => ({
                              ...p,
                              jumlah_kelompok: Number(e.target.value) || 8,
                            }))
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Poin Dasar</span>
                        <input
                          type="number"
                          min={10}
                          max={500}
                          value={teacherSettingsDraft.poin_dasar}
                          onChange={(e) =>
                            setTeacherSettingsDraft((p) => ({
                              ...p,
                              poin_dasar: Number(e.target.value) || 100,
                            }))
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Bonus Kecepatan</span>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={teacherSettingsDraft.bonus_kecepatan}
                          onChange={(e) =>
                            setTeacherSettingsDraft((p) => ({
                              ...p,
                              bonus_kecepatan: Number(e.target.value) || 50,
                            }))
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Pengurang Hint</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={teacherSettingsDraft.pengurang_hint}
                          onChange={(e) =>
                            setTeacherSettingsDraft((p) => ({
                              ...p,
                              pengurang_hint: Number(e.target.value) || 10,
                            }))
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Pengurang Salah</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={teacherSettingsDraft.pengurang_salah}
                          onChange={(e) =>
                            setTeacherSettingsDraft((p) => ({
                              ...p,
                              pengurang_salah: Number(e.target.value) || 5,
                            }))
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-slate-400">Penalti Salah (dtk)</span>
                        <input
                          type="number"
                          min={1}
                          max={60}
                          value={teacherSettingsDraft.penalti_waktu_salah_detik}
                          onChange={(e) =>
                            setTeacherSettingsDraft((p) => ({
                              ...p,
                              penalti_waktu_salah_detik: Number(e.target.value) || 5,
                            }))
                          }
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-bold"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 5. FORM PENGISIAN 5 LANTAI (LANTAI 1 - 5) */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2.5">
                    <div className="text-xs font-extrabold text-sky-300">
                      📝 Form Konfigurasi Teka-Teki 5 Lantai
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {FLOOR_NUMBERS.map((fl) => (
                        <button
                          key={fl}
                          type="button"
                          onClick={() => setEditingFloorTab(fl)}
                          className={`py-1.5 rounded-lg text-[11px] font-extrabold cursor-pointer transition ${
                            editingFloorTab === fl
                              ? 'bg-sky-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          Lantai {fl}
                        </button>
                      ))}
                    </div>

                    {editingFloorObj && (
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10.5px] text-slate-400 font-bold">
                            Judul Lantai {editingFloorTab}
                          </label>
                          <input
                            type="text"
                            value={editingFloorObj.judul}
                            onChange={(e) => updateEditingFloorField('judul', e.target.value)}
                            className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10.5px] text-slate-400 font-bold">
                              Jenis Soal
                            </label>
                            <select
                              value={editingFloorObj.jenis}
                              onChange={(e) =>
                                updateEditingFloorField(
                                  'jenis',
                                  e.target.value as EscapeQuestionType
                                )
                              }
                              className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-white font-bold"
                            >
                              <option value="pilihan_ganda">Pilihan Ganda</option>
                              <option value="isian_singkat">Isian Singkat (Kata/Angka)</option>
                              <option value="urutan_langkah">Urutan Langkah (Drag &amp; Drop)</option>
                              <option value="sandi_kode">Sandi / Kode</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[10.5px] text-slate-400 font-bold">
                              Batas Waktu Lantai (detik)
                            </label>
                            <input
                              type="number"
                              min={15}
                              max={900}
                              value={editingFloorObj.batas_waktu}
                              onChange={(e) =>
                                updateEditingFloorField(
                                  'batas_waktu',
                                  Number(e.target.value) || 120
                                )
                              }
                              className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10.5px] text-slate-400 font-bold">
                            Cerita Singkat Lantai {editingFloorTab}
                          </label>
                          <textarea
                            rows={2}
                            value={editingFloorObj.cerita}
                            onChange={(e) => updateEditingFloorField('cerita', e.target.value)}
                            className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[10.5px] text-slate-400 font-bold">
                            Pertanyaan / Soal Lantai {editingFloorTab}
                          </label>
                          <textarea
                            rows={2}
                            value={editingFloorObj.soal}
                            onChange={(e) => updateEditingFloorField('soal', e.target.value)}
                            className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold"
                          />
                        </div>

                        {(editingFloorObj.jenis === 'pilihan_ganda' ||
                          editingFloorObj.jenis === 'urutan_langkah') && (
                          <div>
                            <label className="text-[10.5px] text-slate-400 font-bold">
                              {editingFloorObj.jenis === 'pilihan_ganda'
                                ? 'Opsi Pilihan Ganda (1 baris per opsi, misal A. ...)'
                                : 'Daftar Langkah Algoritma (1 baris per langkah sesuai urutan benar)'}
                            </label>
                            <textarea
                              rows={4}
                              value={(editingFloorObj.opsi || []).join('\n')}
                              onChange={(e) => {
                                const lines = e.target.value.split('\n');
                                updateEditingFloorField('opsi', lines);
                                if (editingFloorObj.jenis === 'urutan_langkah') {
                                  updateEditingFloorField(
                                    'kunci_jawaban',
                                    lines
                                      .map((l) => l.trim())
                                      .filter(Boolean)
                                      .join(' -> ')
                                  );
                                }
                              }}
                              className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10.5px] text-amber-300 font-bold">
                              💡 Petunjuk (Hint)
                            </label>
                            <input
                              type="text"
                              value={editingFloorObj.hint || ''}
                              onChange={(e) => updateEditingFloorField('hint', e.target.value)}
                              className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                            />
                          </div>
                          <div>
                            <label className="text-[10.5px] text-emerald-300 font-bold">
                              🔑 Kunci Jawaban (Rahasia Server)
                            </label>
                            <input
                              type="text"
                              value={editingFloorObj.kunci_jawaban || ''}
                              onChange={(e) =>
                                updateEditingFloorField('kunci_jawaban', e.target.value)
                              }
                              className="w-full mt-0.5 bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 text-emerald-200 font-extrabold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() =>
                        executeTeacherAction('save_konfigurasi', {
                          konfigurasi: teacherFloorsDraft,
                          pengaturan: teacherSettingsDraft,
                        }).then((st) => {
                          if (st)
                            showTempStatus(
                              '💾 Konfigurasi 5 Lantai & Pengaturan berhasil disimpan ke Server & Spreadsheet!'
                            );
                        })
                      }
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Konfigurasi 5 Lantai &amp; Pengaturan</span>
                    </button>
                  </div>

                  {/* 6. ATUR KELOMPOK SISWA ONLINE */}
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 space-y-2">
                    <div className="text-xs font-extrabold text-white">
                      👥 Atur Penempatan Kelompok Siswa Online ({onlineStudentsList.length} Siswa)
                    </div>
                    {onlineStudentsList.length === 0 ? (
                      <div className="text-[11px] text-slate-500 italic">
                        Belum ada siswa online di jendela Escape Room Menara.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                        {onlineStudentsList.map((stu) => {
                          const curG =
                            stu.kelompok || towerState?.studentGroupMap?.[stu.studentId] || 1;
                          return (
                            <div
                              key={stu.studentId}
                              className="flex items-center justify-between gap-2 bg-slate-900 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs"
                            >
                              <span className="font-bold text-slate-200 truncate">
                                {stu.studentName}
                              </span>
                              <select
                                value={curG}
                                onChange={(e) =>
                                  executeTeacherAction('assign_group', {
                                    targetStudentId: stu.studentId,
                                    targetStudentName: stu.studentName,
                                    targetStudentClass: stu.className,
                                    targetStudentGender: stu.gender,
                                    targetGroup: Number(e.target.value),
                                  })
                                }
                                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-[11px] text-sky-300 font-extrabold"
                              >
                                {visibleGroups.map((g) => (
                                  <option key={g} value={g}>
                                    Kelompok {g}
                                  </option>
                                ))}
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: KELOMPOK & OBROLAN */}
              {activeRightTab === 'group' && (
                <div className="space-y-3 flex flex-col h-full">
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3">
                    <div className="text-xs font-extrabold text-sky-300 mb-2">
                      Pilih Kelompokmu (Kelompok 1–{maxActiveGroups}):
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {visibleGroups.map((gNum) => {
                        const isSelected = selectedGroup === gNum;
                        const members = groupRosterMap[gNum] || [];
                        const fl = towerState?.progres?.[gNum]?.lantai_sekarang || 1;
                        return (
                          <button
                            key={gNum}
                            type="button"
                            onClick={() => handleJoinGroup(gNum)}
                            className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                              isSelected
                                ? `${GROUP_COLORS[gNum].bg} ${GROUP_COLORS[gNum].border} shadow-md`
                                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-extrabold ${GROUP_COLORS[gNum].text}`}>
                                K{gNum}
                              </span>
                              <span className="text-[10px] font-bold text-slate-300">
                                {fl === 6 ? '🏆Atap' : `L${fl}`}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              {members.length} anggota
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Members of Selected Group */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800">
                      <div className="text-[11px] font-bold text-slate-300 mb-1">
                        Anggota Kelompok {selectedGroup} ({groupRosterMap[selectedGroup]?.length || 0}{' '}
                        Siswa):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {(groupRosterMap[selectedGroup] || []).map((m) => (
                          <span
                            key={m.studentId}
                            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10.5px] font-bold text-slate-200 flex items-center gap-1"
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                m.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                              }`}
                            />
                            <span>{m.studentName}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* GROUP CHAT BOX */}
                  <div className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col min-h-[250px]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                      <span className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                        <span>Obrolan Diskusi Kelompok {selectedGroup}</span>
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        🔒 Privat Kelompok {selectedGroup}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[220px]">
                      {myGroupChats.length === 0 ? (
                        <div className="text-center text-xs text-slate-500 py-8">
                          Diskusikan jawaban Lantai {currentFloorNumber <= 5 ? currentFloorNumber : 5}{' '}
                          bersama anggota Kelompok {selectedGroup} di sini!
                        </div>
                      ) : (
                        myGroupChats.map((msg) => {
                          const isMine =
                            msg.senderId === effectiveStudentId || msg.senderId === student.id;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                            >
                              <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                                {msg.senderName} • {msg.timestamp}
                              </div>
                              <div
                                className={`px-3 py-1.5 rounded-2xl text-xs max-w-[85%] ${
                                  isMine
                                    ? 'bg-sky-600 text-white rounded-br-xs'
                                    : 'bg-slate-800 text-slate-100 rounded-bl-xs'
                                }`}
                              >
                                {msg.content}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form onSubmit={handleSendGroupChat} className="mt-2 pt-2 border-t border-slate-800 flex gap-1.5">
                      <input
                        type="text"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        placeholder={`Pesan diskusi Kelompok ${selectedGroup}...`}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-sky-400"
                      />
                      <button
                        type="submit"
                        className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB 3: PAPAN SKOR */}
              {activeRightTab === 'scoreboard' && (
                <div className="space-y-3">
                  <div className="bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Papan Skor Escape Room Menara</span>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Sheet: Escape_Skor &amp; Escape_Progres
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Rumus Poin = Poin Dasar ({towerState?.sesi?.poin_dasar || 100}) + Bonus Kecepatan (maks{' '}
                      {towerState?.sesi?.bonus_kecepatan || 50}) &minus; Hint ({towerState?.sesi?.pengurang_hint || 10}/hint) &minus; Salah ({towerState?.sesi?.pengurang_salah || 5}/salah).
                    </p>
                  </div>

                  <div className="space-y-2">
                    {sortedScores.map((row, idx) => {
                      const prog = towerState?.progres?.[row.kelompok];
                      const fl = prog?.lantai_sekarang || 1;
                      const isRoof = fl === 6;
                      return (
                        <div
                          key={row.kelompok}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
                            isRoof
                              ? 'bg-emerald-950/50 border-emerald-400/60'
                              : 'bg-slate-950/85 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                idx === 0
                                  ? 'bg-amber-400 text-slate-950'
                                  : idx === 1
                                  ? 'bg-slate-300 text-slate-950'
                                  : idx === 2
                                  ? 'bg-amber-700 text-white'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              #{idx + 1}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-extrabold ${
                                    GROUP_COLORS[row.kelompok].text
                                  }`}
                                >
                                  Kelompok {row.kelompok}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-bold text-white">
                                  {isRoof
                                    ? `🏆 Atap (Urutan #${prog?.peringkat_atap || idx + 1})`
                                    : `Lantai ${fl}/5`}
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-400 mt-0.5">
                                ⏱️ Waktu: {prog?.durasi_detik ? `${formatDuration(prog.durasi_detik)}` : '-'} • 💡 Hint:{' '}
                                {prog?.hint_dipakai || 0} • ❌ Salah: {prog?.jumlah_salah || 0}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-amber-300">
                              {row.total_poin} Poin
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {(groupRosterMap[row.kelompok] || []).length} siswa
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 4: INFO & PANDUAN */}
              {activeRightTab === 'info' && (
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">
                      <span>🏙️</span>
                      <span>Cara Bermain Escape Room Menara</span>
                    </h4>
                    <ul className="list-disc pl-4 space-y-1 text-[11.5px]">
                      <li>
                        <strong>5 Lantai Berurutan:</strong> Setiap kelompok mulai dari Lantai 1 dan harus memecahkan teka-teki tiap lantai secara berurutan (Lantai 1 &rarr; 2 &rarr; 3 &rarr; 4 &rarr; 5) untuk membuka <strong>Pintu Atap Menara</strong>.
                      </li>
                      <li>
                        <strong>Kolom Jawaban Bersama:</strong> Satu kelompok memiliki satu kolom jawaban bersama yang tersinkronisasi secara real-time.
                      </li>
                      <li>
                        <strong>4 Jenis Teka-Teki:</strong> Pilihan Ganda, Isian Singkat, Susun Algoritma (Drag &amp; Drop), dan Sandi/Kode.
                      </li>
                      <li>
                        <strong>Keamanan Anti-Intip:</strong> Kunci jawaban diperiksa di sisi server/Apps Script dan tidak pernah dikirim ke browser siswa. Siswa juga tidak bisa melihat soal lantai berikutnya atau jawaban kelompok lain.
                      </li>
                    </ul>
                  </div>

                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-2">
                    <h4 className="font-extrabold text-emerald-300 text-xs">
                      📊 Struktur 4 Sheet Baru Google Spreadsheet
                    </h4>
                    <div className="space-y-1.5 text-[11px] font-mono bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <div>
                        <strong className="text-amber-300">1. Escape_Konfigurasi:</strong> nomor_lantai, judul, cerita, soal, jenis, hint, kunci_jawaban, batas_waktu
                      </div>
                      <div>
                        <strong className="text-sky-300">2. Escape_Sesi:</strong> id_sesi, status, waktu_mulai
                      </div>
                      <div>
                        <strong className="text-emerald-300">3. Escape_Progres:</strong> id_sesi, kelompok, lantai_sekarang, jumlah_salah, hint_dipakai, waktu_selesai
                      </div>
                      <div>
                        <strong className="text-purple-300">4. Escape_Skor:</strong> kelompok, total_poin
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
