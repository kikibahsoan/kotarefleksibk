import React, { useState, useMemo } from 'react';
import {
  BuildingId,
  Materi,
  LearningObjective,
  Reflection,
  ReflectionAnswers,
  Message,
  Student,
} from '../../types/index.ts';
import {
  CITY_BUILDINGS_GOVERNANCE,
  getCityGovernanceState,
  saveCityGovernanceState,
  getStudentTodayBuildingXp,
  recordStudentBuildingXpWithCap,
  sanitizeStudentInputText,
} from '../../utils/aturanBakuKota.ts';
import { StorageService } from '../../utils/storage.ts';
import {
  X,
  BookOpen,
  MessageSquare,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  Users,
  Clock,
  Award,
  PlusCircle,
  Eye,
  EyeOff,
  Compass,
  ShoppingBag,
  Palette,
  Mic,
  Plane,
  Target,
} from 'lucide-react';

interface PusatKotaBuildingModalProps {
  buildingId: BuildingId;
  student: Student;
  materis: Materi[];
  objectives: LearningObjective[];
  reflections: Reflection[];
  messages: Message[];
  onClose: () => void;
  onSubmitReflection: (
    materiId: string,
    scale: number,
    answers: ReflectionAnswers,
    moodEmoji?: string
  ) => void;
  onSendMessage: (content: string) => void;
  onGainXp: (amount: number, reason: string) => void;
  onRefreshMateris?: () => void;
}

interface MuseumArtworkItem {
  id: string;
  title: string;
  creatorName: string;
  className: string;
  category: string;
  description: string;
  likes: number;
  createdAt: string;
}

interface StagePresentationItem {
  id: string;
  speakerName: string;
  className: string;
  topic: string;
  summary: string;
  kind: 'Presentasi Karya' | 'Pengumuman Kelas';
  createdAt: string;
}

interface MallCatalogItem {
  id: string;
  name: string;
  category: 'Kebutuhan Produktif' | 'Atribut Kreatif';
  xpCost: number;
  icon: string;
  benefit: string;
}

const MALL_CATALOG: MallCatalogItem[] = [
  {
    id: 'mall-sketchbook',
    name: 'Sketchbook Grid Isometrik DKV',
    category: 'Kebutuhan Produktif',
    xpCost: 4,
    icon: '📓',
    benefit: 'Prioritas Utama: Membantu merancang sketsa tata letak poster dan logo secara rapi.',
  },
  {
    id: 'mall-color-guide',
    name: 'Kartu Palet Warna CMYK & RGB',
    category: 'Kebutuhan Produktif',
    xpCost: 5,
    icon: '🎨',
    benefit: 'Prioritas Utama: Panduan kombinasi warna kontras tinggi untuk desain publikasi.',
  },
  {
    id: 'mall-pen-stylus',
    name: 'Ujung Nib Pen Tablet Cadangan',
    category: 'Kebutuhan Produktif',
    xpCost: 6,
    icon: '🖊️',
    benefit: 'Prioritas Utama: Menjaga presisi goresan ilustrasi digital di Lab DKV.',
  },
  {
    id: 'mall-pin-warga',
    name: 'Lencana Pin Kreator Pusat Kota',
    category: 'Atribut Kreatif',
    xpCost: 3,
    icon: '🎖️',
    benefit: 'Apresiasi Diri: Tanda kebanggaan warga aktif penjelajah Pusat Kota Refleksia.',
  },
];

const INITIAL_MUSEUM_WORKS: MuseumArtworkItem[] = [
  {
    id: 'art-seed-1',
    title: 'Poster Kampanye Budaya Baca & Literasi Digital',
    creatorName: 'Tim Kreatif X DKV 2',
    className: 'X DKV 2',
    category: 'Poster Publikasi',
    description: 'Menerapkan kontras warna kuning-biru tua dengan hierarki tipografi tegas dan ruang kosong seimbang.',
    likes: 14,
    createdAt: '6 November 2026',
  },
  {
    id: 'art-seed-2',
    title: 'Ilustrasi Vektor Karawo Modern Gorontalo',
    creatorName: 'Komunitas Ilustrator X DKV 3',
    className: 'X DKV 3',
    category: 'Ilustrasi Digital',
    description: 'Eksplorasi motif geometris lokal Gorontalo menggunakan pola perulangan (looping) vektor.',
    likes: 19,
    createdAt: '6 November 2026',
  },
];

const INITIAL_STAGE_ITEMS: StagePresentationItem[] = [
  {
    id: 'stage-seed-1',
    speakerName: 'Perwakilan Kelas X DKV 2 & X DKV 3',
    className: 'X DKV 2 & X DKV 3',
    topic: 'Pameran Terbuka Proyek Desain Semester Ganjil',
    summary: 'Setiap kelompok menyiapkan presentasi konsep 3 menit (Masalah, Solusi Visual, Manfaat) di Panggung Kota.',
    kind: 'Pengumuman Kelas',
    createdAt: '6 November 2026',
  },
];

export const PusatKotaBuildingModal: React.FC<PusatKotaBuildingModalProps> = ({
  buildingId,
  student,
  materis,
  objectives,
  reflections,
  messages,
  onClose,
  onSubmitReflection,
  onSendMessage,
  onGainXp,
  onRefreshMateris,
}) => {
  const spec = CITY_BUILDINGS_GOVERNANCE[buildingId] || CITY_BUILDINGS_GOVERNANCE.pencakar_langit;
  const isTeacher = Boolean(student.isTeacher);

  const [activeTab, setActiveTab] = useState<'materi' | 'refleksi' | 'tanya_guru' | 'fitur_khas'>('materi');
  const [govState, setGovState] = useState(() => getCityGovernanceState());
  const isLocked = Boolean(govState.lockedBuildings[buildingId]);

  // Daily XP Cap tracking (Pasal C.11)
  const [todayBuildingXp, setTodayBuildingXp] = useState(() =>
    getStudentTodayBuildingXp(student.id, buildingId)
  );
  const remainingDailyXp = Math.max(0, spec.dailyXpCap - todayBuildingXp);

  // Filter Materi for this building (plus class visibility per Pasal D.14)
  const buildingMateris = useMemo(() => {
    const list = materis.filter((m) => m.location === buildingId);
    if (isTeacher) return list;
    return list.filter((m) => {
      if (m.isActive === false) return false;
      const hiddenForClass = govState.hiddenMateriIdsByClass[student.className] || [];
      if (hiddenForClass.includes(m.id)) return false;
      return true;
    });
  }, [materis, buildingId, isTeacher, govState.hiddenMateriIdsByClass, student.className]);

  const [selectedMateriId, setSelectedMateriId] = useState<string>(() => buildingMateris[0]?.id || '');
  const selectedMateri = useMemo(
    () => buildingMateris.find((m) => m.id === selectedMateriId) || buildingMateris[0] || null,
    [buildingMateris, selectedMateriId]
  );

  // Teacher Add Materi Form (Pasal D.12 & D.13)
  const [showAddMateriForm, setShowAddMateriForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Desain Komunikasi Visual');
  const [newTargetClass, setNewTargetClass] = useState('X DKV 2 & X DKV 3');
  const [newTp, setNewTp] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newQuestion1, setNewQuestion1] = useState('');
  const [materiStatusMsg, setMateriStatusMsg] = useState<string | null>(null);

  // Reflection Form State (Tab 2)
  const [scale, setScale] = useState<number>(5);
  const [moodEmoji, setMoodEmoji] = useState<string>('😊');
  const [understood, setUnderstood] = useState('');
  const [difficult, setDifficult] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [customAns, setCustomAns] = useState<Record<string, string>>({});
  const [reflectionNotice, setReflectionNotice] = useState<string | null>(null);

  // Ask Teacher State (Tab 3)
  const [questionText, setQuestionText] = useState('');
  const [questionNotice, setQuestionNotice] = useState<string | null>(null);

  // Building-Specific Feature States (Tab 4)
  // 1. Pencakar Langit: Career Goal Builder
  const [careerDream, setCareerDream] = useState('UI/UX & Brand Designer');
  const [careerSkill, setCareerSkill] = useState('Tipografi, Grid System, dan Riset Pengguna');
  const [careerSaved, setCareerSaved] = useState<string | null>(null);

  // 2. Latihan Tentara: Team Discipline Checklist
  const [disciplineChecks, setDisciplineChecks] = useState<boolean[]>([false, false, false]);
  const [disciplineNotice, setDisciplineNotice] = useState<string | null>(null);

  // 3. Museum Seni: Artwork Showcase
  const [artworks, setArtworks] = useState<MuseumArtworkItem[]>(() => {
    try {
      const raw = localStorage.getItem('kota_refleksi_museum_artworks_v1');
      return raw ? JSON.parse(raw) : INITIAL_MUSEUM_WORKS;
    } catch {
      return INITIAL_MUSEUM_WORKS;
    }
  });
  const [artTitle, setArtTitle] = useState('');
  const [artCategory, setArtCategory] = useState('Poster Publikasi');
  const [artDesc, setArtDesc] = useState('');

  // 4. Panggung Kota: Class Presentation & Announcement Board
  const [stageItems, setStageItems] = useState<StagePresentationItem[]>(() => {
    try {
      const raw = localStorage.getItem('kota_refleksi_stage_items_v1');
      return raw ? JSON.parse(raw) : INITIAL_STAGE_ITEMS;
    } catch {
      return INITIAL_STAGE_ITEMS;
    }
  });
  const [stageTopic, setStageTopic] = useState('');
  const [stageSummary, setStageSummary] = useState('');
  const [stageKind, setStageKind] = useState<'Presentasi Karya' | 'Pengumuman Kelas'>('Presentasi Karya');

  // 5. Mall Kota: Owned Items & Purchase Feedback
  const [ownedMallItems, setOwnedMallItems] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`kota_refleksi_mall_owned_${student.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [mallNotice, setMallNotice] = useState<string | null>(null);

  // 6. Bandara: Flight Plan / Learning Roadmap Boarding Pass
  const [flightDest, setFlightDest] = useState('Tuntas Portofolio Desain & Siap Industri');
  const [flightMilestone, setFlightMilestone] = useState('Menyelesaikan 5 Karya Terbaik Semester Ini');
  const [boardingPassSaved, setBoardingPassSaved] = useState(false);

  const studentMessages = useMemo(
    () =>
      messages.filter((m) =>
        isTeacher ? true : m.studentId === student.id || m.studentName === student.name
      ),
    [messages, isTeacher, student.id, student.name]
  );

  const studentBuildingReflections = useMemo(
    () =>
      reflections.filter(
        (r) =>
          (isTeacher || r.studentId === student.id) &&
          buildingMateris.some((m) => m.id === r.materiId)
      ),
    [reflections, isTeacher, student.id, buildingMateris]
  );

  const handleToggleLockBuilding = () => {
    if (!isTeacher) return;
    const next: typeof govState = {
      ...govState,
      lockedBuildings: {
        ...govState.lockedBuildings,
        [buildingId]: !isLocked,
      },
      updatedByTeacher: student.name,
    };
    saveCityGovernanceState(next, true);
    setGovState(next);
    StorageService.syncCityBuildingsToSpreadsheet();
  };

  const handleToggleMateriClassVisibility = (materiId: string, targetClassName: string) => {
    if (!isTeacher) return;
    const currentHidden = govState.hiddenMateriIdsByClass[targetClassName] || [];
    const isCurrentlyHidden = currentHidden.includes(materiId);
    const updatedForClass = isCurrentlyHidden
      ? currentHidden.filter((id) => id !== materiId)
      : [...currentHidden, materiId];
    const next: typeof govState = {
      ...govState,
      hiddenMateriIdsByClass: {
        ...govState.hiddenMateriIdsByClass,
        [targetClassName]: updatedForClass,
      },
      updatedByTeacher: student.name,
    };
    saveCityGovernanceState(next, true);
    setGovState(next);
  };

  const handleAddTeacherMateri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTeacher || !newTitle.trim() || !newContent.trim()) return;
    const createdId = `materi-pk-${buildingId}-${Date.now()}`;
    const newMat: Materi = {
      id: createdId,
      title: newTitle.trim(),
      subject: newSubject.trim() || 'Desain Komunikasi Visual',
      targetClass: newTargetClass,
      tujuanPembelajaran: newTp.trim() || spec.learningObjective,
      content: newContent.trim(),
      location: buildingId,
      createdAt: new Date().toISOString().slice(0, 10),
      isNew: true,
      isActive: true,
      teacherName: student.name,
      customQuestions: newQuestion1.trim()
        ? [newQuestion1.trim()]
        : ['Apa poin terpenting yang kamu pelajari dari materi ini?'],
    };
    StorageService.addMateri(newMat);
    if (newTp.trim()) {
      StorageService.addObjective({
        id: `tp-${createdId}`,
        materiId: createdId,
        goalStatement: newTp.trim(),
        indicator: `Menuntaskan aktivitas dan refleksi di ${spec.name}`,
        deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      });
    }
    onRefreshMateris?.();
    setSelectedMateriId(createdId);
    setNewTitle('');
    setNewTp('');
    setNewContent('');
    setNewQuestion1('');
    setShowAddMateriForm(false);
    setMateriStatusMsg('Materi baru berhasil ditambahkan dan disinkronkan!');
    setTimeout(() => setMateriStatusMsg(null), 4000);
  };

  const awardCappedBuildingXp = (requested: number, reason: string): number => {
    const res = recordStudentBuildingXpWithCap(student.id, buildingId, requested);
    setTodayBuildingXp(getStudentTodayBuildingXp(student.id, buildingId));
    if (res.grantedXp > 0) {
      onGainXp(res.grantedXp, `${spec.name}: ${reason}`);
    }
    return res.grantedXp;
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMateri) return;
    if (understood.trim().length < 5 || difficult.trim().length < 5 || actionPlan.trim().length < 5) {
      setReflectionNotice('Mohon isi ketiga kolom refleksi (minimal 5 karakter) dengan jujur dan santun.');
      return;
    }

    const cleanUnderstood = sanitizeStudentInputText(understood.trim()).cleanText;
    const cleanDifficult = sanitizeStudentInputText(difficult.trim()).cleanText;
    const cleanAction = sanitizeStudentInputText(actionPlan.trim()).cleanText;

    const sanitizedCustom: Record<string, string> = {};
    Object.entries(customAns).forEach(([k, v]) => {
      sanitizedCustom[k] = sanitizeStudentInputText(v).cleanText;
    });

    onSubmitReflection(
      selectedMateri.id,
      scale,
      {
        understood: cleanUnderstood,
        difficult: cleanDifficult,
        actionPlan: cleanAction,
        materiTitle: `[${spec.name}] ${selectedMateri.title}`,
        mood: moodEmoji,
        customAnswers: sanitizedCustom,
      },
      moodEmoji
    );

    recordStudentBuildingXpWithCap(student.id, buildingId, 3);
    setTodayBuildingXp(getStudentTodayBuildingXp(student.id, buildingId));
    setUnderstood('');
    setDifficult('');
    setActionPlan('');
    setCustomAns({});
    setReflectionNotice(
      `Refleksi di ${spec.name} berhasil dikirim ke Guru & Google Spreadsheet (+3 XP)!`
    );
    setTimeout(() => setReflectionNotice(null), 5000);
  };

  const handleAskTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (questionText.trim().length < 5) {
      setQuestionNotice('Tulis pertanyaanmu minimal 5 karakter dengan bahasa yang sopan.');
      return;
    }
    const { cleanText } = sanitizeStudentInputText(questionText.trim());
    const formattedQuestion = `[${spec.name} • ${selectedMateri?.title || spec.category}] ${cleanText}`;
    onSendMessage(formattedQuestion);
    awardCappedBuildingXp(2, 'Bertanya pada Guru');
    setQuestionText('');
    setQuestionNotice(
      'Pertanyaanmu telah dikirim ke Ruang Guru & tercatat di Sheet Pesan_Kantor_Pos!'
    );
    setTimeout(() => setQuestionNotice(null), 4500);
  };

  // If locked by teacher and user is a student, show clean locked notice (Pasal C.10 & G.23)
  if (isLocked && !isTeacher) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 text-center text-slate-100 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-3 text-2xl">
            🔒
          </div>
          <h3 className="text-lg font-extrabold text-white">{spec.name} Sedang Ditutup Sementara</h3>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Guru Pembimbing sedang mengunci sementara akses ke gedung ini untuk kegiatan terfokus. Silakan kunjungi gedung lainnya atau hubungi Guru.
          </p>
          <button
            onClick={onClose}
            className="mt-5 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
          >
            Kembali ke Peta Kota
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-6 pb-4 px-2.5 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700/90 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header Gedung (Pasal C.8 & C.10) */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/80 px-4 sm:px-6 py-4 flex flex-col gap-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-2xl shrink-0">
                {spec.icon}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-sky-300 font-semibold">
                  <span>{spec.zone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{spec.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">Koordinat [{spec.wx}, {spec.wy}]</span>
                </div>
                <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight mt-0.5">
                  {spec.name}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">{spec.shortDescription}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isTeacher && (
                <button
                  onClick={handleToggleLockBuilding}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition whitespace-nowrap shrink-0 ${
                    isLocked
                      ? 'bg-rose-500/20 border-rose-400/40 text-rose-200 hover:bg-rose-500/30'
                      : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/30'
                  }`}
                >
                  {isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{isLocked ? 'Terkunci (Buka)' : 'Terbuka (Kunci)'}</span>
                </button>
              )}
              <button
                onClick={onClose}
                aria-label="Tutup Gedung"
                className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bar Informasi Tujuan Belajar, Kapasitas, Jam Buka & Kuota XP Harian (Pasal C.8, C.10, C.11) */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="text-slate-300 leading-snug">
              <span className="font-bold text-amber-300">🎯 Tujuan Belajar: </span>
              {spec.learningObjective}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 shrink-0 tabular-nums">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                Kapasitas {spec.capacity} Warga
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                {spec.openingHours}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Award className="w-3.5 h-3.5" />
                Sisa XP Hari Ini: {remainingDailyXp}/{spec.dailyXpCap} XP
              </span>
            </div>
          </div>

          {/* 4 Tab Navigasi Standar + Fitur Khas Gedung (Pasal C.9) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
            <button
              onClick={() => setActiveTab('materi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'materi'
                  ? 'bg-sky-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>1. Materi Belajar</span>
            </button>
            <button
              onClick={() => setActiveTab('refleksi')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'refleksi'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>2. Refleksi (+3 XP)</span>
            </button>
            <button
              onClick={() => setActiveTab('tanya_guru')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'tanya_guru'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>3. Bertanya pada Guru</span>
            </button>
            <button
              onClick={() => setActiveTab('fitur_khas')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap shrink-0 ${
                activeTab === 'fitur_khas'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>
                4.{' '}
                {buildingId === 'pencakar_langit'
                  ? 'Peta Karier & Cita-cita'
                  : buildingId === 'latihan_tentara'
                  ? 'Misi Disiplin Tim'
                  : buildingId === 'museum_seni'
                  ? 'Galeri Pameran Karya'
                  : buildingId === 'panggung_kota'
                  ? 'Panggung & Pengumuman'
                  : buildingId === 'mall_kota'
                  ? 'Katalog Belanja Mall'
                  : 'Boarding Pass Belajar'}
              </span>
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* TAB 1: MATERI BELAJAR */}
          {activeTab === 'materi' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  {buildingMateris.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMateriId(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                        selectedMateri?.id === m.id
                          ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                          : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {m.title}
                    </button>
                  ))}
                </div>

                {isTeacher && (
                  <button
                    onClick={() => setShowAddMateriForm((v) => !v)}
                    className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition whitespace-nowrap shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{showAddMateriForm ? 'Tutup Form Guru' : 'Tambah Materi Gedung'}</span>
                  </button>
                )}
              </div>

              {materiStatusMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                  {materiStatusMsg}
                </div>
              )}

              {/* Form Guru Tambah Materi (Pasal D.12 - D.14) */}
              {isTeacher && showAddMateriForm && (
                <form
                  onSubmit={handleAddTeacherMateri}
                  className="bg-slate-950/80 border border-amber-500/40 rounded-2xl p-4 space-y-3"
                >
                  <h4 className="text-xs font-extrabold text-amber-300">
                    👨‍🏫 Panel Guru: Tambah Materi Baru di {spec.name}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="Judul Materi..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      required
                    />
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Mata Pelajaran..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={newTargetClass}
                      onChange={(e) => setNewTargetClass(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="X DKV 2 & X DKV 3">Semua Kelas (X DKV 2 & X DKV 3)</option>
                      <option value="X DKV 2 (Desain Komunikasi Visual)">Hanya X DKV 2</option>
                      <option value="X DKV 3 (Desain Komunikasi Visual)">Hanya X DKV 3</option>
                    </select>
                    <input
                      type="text"
                      value={newTp}
                      onChange={(e) => setNewTp(e.target.value)}
                      placeholder="Tujuan Pembelajaran (TP)..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <textarea
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Isi materi pembelajaran yang ramah siswa SMK..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    value={newQuestion1}
                    onChange={(e) => setNewQuestion1(e.target.value)}
                    placeholder="Pertanyaan pemantik refleksi untuk siswa..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                    >
                      Simpan Materi Gedung
                    </button>
                  </div>
                </form>
              )}

              {selectedMateri ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{selectedMateri.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span>Kelas: {selectedMateri.targetClass}</span>
                        <span aria-hidden="true">·</span>
                        <span>Tanggal: {selectedMateri.createdAt}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-white mt-1">
                        {selectedMateri.title}
                      </h3>
                    </div>

                    {/* Kontrol Visibilitas Materi per Kelas untuk Guru (Pasal D.14) */}
                    {isTeacher && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          'X DKV 2 (Desain Komunikasi Visual)',
                          'X DKV 3 (Desain Komunikasi Visual)',
                        ].map((cls) => {
                          const isHidden = (govState.hiddenMateriIdsByClass[cls] || []).includes(
                            selectedMateri.id
                          );
                          const shortLabel = cls.includes('DKV 2') ? 'X DKV 2' : 'X DKV 3';
                          return (
                            <button
                              key={cls}
                              onClick={() => handleToggleMateriClassVisibility(selectedMateri.id, cls)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition ${
                                isHidden
                                  ? 'bg-rose-500/20 border-rose-400/40 text-rose-200'
                                  : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                              }`}
                            >
                              {isHidden ? (
                                <EyeOff className="w-3 h-3" />
                              ) : (
                                <Eye className="w-3 h-3" />
                              )}
                              <span>
                                {shortLabel}: {isHidden ? 'Disembunyikan' : 'Tampil'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {selectedMateri.tujuanPembelajaran && (
                    <div className="bg-sky-950/40 border border-sky-500/30 rounded-xl p-3 text-xs text-sky-100">
                      <span className="font-bold text-sky-300">Capaian / Tujuan Pembelajaran: </span>
                      {selectedMateri.tujuanPembelajaran}
                    </div>
                  )}

                  <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedMateri.content}
                  </div>

                  {/* Pertanyaan Pemantik Materi */}
                  {selectedMateri.customQuestions && selectedMateri.customQuestions.length > 0 && (
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                      <h4 className="text-xs font-bold text-amber-300">
                        💡 Pertanyaan Refleksi & Diskusi Gedung:
                      </h4>
                      <ul className="list-decimal list-inside text-xs text-slate-300 space-y-1">
                        {selectedMateri.customQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      onClick={() => {
                        const got = awardCappedBuildingXp(1, `Membaca Materi ${selectedMateri.title}`);
                        setMateriStatusMsg(
                          got > 0
                            ? `Selamat! Kamu memperoleh +${got} XP karena menuntaskan bacaan materi di ${spec.name}.`
                            : `Kamu sudah membaca materi ini (batas harian XP gedung ${spec.dailyXpCap} XP telah tercapai hari ini).`
                        );
                        setTimeout(() => setMateriStatusMsg(null), 4000);
                      }}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Tandai Selesai Dibaca (+1 XP)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('refleksi')}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Lanjut Tulis Refleksi (+3 XP)</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-2xl border border-slate-800">
                  Belum ada materi aktif untuk kelasmu di gedung ini.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REFLEKSI SISWA (+3 XP & SINKRON SPREADSHEET) */}
          {activeTab === 'refleksi' && (
            <div className="space-y-5">
              <form
                onSubmit={handleReflectionSubmit}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Jurnal Refleksi Siswa — {spec.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Tulis refleksi jujurmu untuk meraih +3 XP. Otomatis tersinkron ke Sheet Data_Refleksi_Siswa.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {['😊', '🤩', '🤔', '🔥', '🚀'].map((emo) => (
                      <button
                        type="button"
                        key={emo}
                        onClick={() => setMoodEmoji(emo)}
                        className={`w-9 h-9 rounded-xl text-base flex items-center justify-center border transition ${
                          moodEmoji === emo
                            ? 'bg-amber-500/25 border-amber-400 scale-105'
                            : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {emo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Skala Bintang 1 - 5 */}
                <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3">
                  <span className="text-xs font-bold text-slate-300">
                    Skala Pemahaman Materi (1-5):
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setScale(star)}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition tabular-nums ${
                          scale >= star
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        ★ {star}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pertanyaan Khusus Gedung */}
                {selectedMateri?.customQuestions && selectedMateri.customQuestions.length > 0 && (
                  <div className="space-y-3">
                    {selectedMateri.customQuestions.map((q, idx) => (
                      <div key={idx} className="space-y-1">
                        <label className="block text-xs font-semibold text-amber-200">
                          Pertanyaan Gedung #{idx + 1}: {q}
                        </label>
                        <input
                          type="text"
                          value={customAns[`Q${idx + 1}`] || ''}
                          onChange={(e) =>
                            setCustomAns((prev) => ({ ...prev, [`Q${idx + 1}`]: e.target.value }))
                          }
                          placeholder="Tulis jawaban singkatmu..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-emerald-300">
                      1. Apa yang sudah kamu pahami?
                    </label>
                    <textarea
                      rows={3}
                      value={understood}
                      onChange={(e) => setUnderstood(e.target.value)}
                      placeholder="Jelaskan hal utama yang sudah kamu kuasai..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-rose-300">
                      2. Bagian mana yang masih sulit?
                    </label>
                    <textarea
                      rows={3}
                      value={difficult}
                      onChange={(e) => setDifficult(e.target.value)}
                      placeholder="Tuliskan kendala atau hal yang masih membingungkan..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-sky-300">
                      3. Apa rencana tindak lanjutmu?
                    </label>
                    <textarea
                      rows={3}
                      value={actionPlan}
                      onChange={(e) => setActionPlan(e.target.value)}
                      placeholder="Langkah konkret yang akan kamu lakukan..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                      required
                    />
                  </div>
                </div>

                {reflectionNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                    {reflectionNotice}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Kirim Refleksi & Simpan ke Spreadsheet (+3 XP)</span>
                  </button>
                </div>
              </form>

              {/* Riwayat Refleksi Siswa Pribadi (Pasal E.17: Hanya milik siswa sendiri atau Guru) */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  📋 Riwayat Refleksi {isTeacher ? 'Seluruh Siswa di Gedung Ini' : 'Milikmu di Gedung Ini'} (
                  {studentBuildingReflections.length})
                </h4>
                {studentBuildingReflections.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Belum ada catatan refleksi di {spec.name}.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {studentBuildingReflections.slice(0, 6).map((r) => (
                      <div
                        key={r.id}
                        className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-bold text-white">
                            {r.studentName} ({r.className})
                          </span>
                          <span className="tabular-nums">
                            ★ {r.scale}/5 · {r.createdAt}
                          </span>
                        </div>
                        <p className="text-slate-300">
                          <strong className="text-emerald-300">Dipahami:</strong>{' '}
                          {r.answers.understood}
                        </p>
                        <p className="text-slate-300">
                          <strong className="text-sky-300">Rencana:</strong> {r.answers.actionPlan}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: BERTANYA PADA GURU */}
          {activeTab === 'tanya_guru' && (
            <div className="space-y-5">
              <form
                onSubmit={handleAskTeacherSubmit}
                className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3"
              >
                <h3 className="text-base font-extrabold text-white">
                  Konsultasi & Bertanya pada Guru — {spec.name}
                </h3>
                <p className="text-xs text-slate-400">
                  Ada materi atau tantangan di {spec.name} yang ingin kamu tanyakan kepada Guru? Pertanyaanmu otomatis diteruskan ke Ruang Guru & Google Spreadsheet.
                </p>
                <textarea
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={`Tulis pertanyaan sopanmu seputar ${spec.category.toLowerCase()}...`}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                  required
                />
                {questionNotice && (
                  <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                    {questionNotice}
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-2 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Pertanyaan ke Guru (+2 XP)</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300">
                  📬 Riwayat Pertanyaan & Balasan Guru ({studentMessages.length})
                </h4>
                {studentMessages.length === 0 ? (
                  <p className="text-xs text-slate-500">Belum ada pesan konsultasi yang dikirim.</p>
                ) : (
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {studentMessages.slice(0, 6).map((msg) => (
                      <div
                        key={msg.id}
                        className="bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-slate-400">
                          <span className="font-bold text-white">{msg.studentName}</span>
                          <span>{msg.createdAt}</span>
                        </div>
                        <p className="text-slate-200">{msg.content}</p>
                        {msg.teacherReply ? (
                          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-lg p-2 text-emerald-200">
                            <span className="font-bold">Balasan Guru: </span>
                            {msg.teacherReply}
                          </div>
                        ) : (
                          <span className="text-[11px] text-amber-300">
                            Menunggu tanggapan Guru Pembimbing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: FITUR KHAS MASING-MASING GEDUNG BARU */}
          {activeTab === 'fitur_khas' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
              {/* 1. GEDUNG PENCAKAR LANGIT: PETA KARIER & CITA-CITA */}
              {buildingId === 'pencakar_langit' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Target className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Simulator Puncak Karier & Cita-cita SMK
                      </h3>
                      <p className="text-xs text-slate-400">
                        Susun target profesi masa depanmu di puncak Menara Pusat Kota.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Profesi / Karier Impian Setelah Lulus SMK:
                      </label>
                      <input
                        type="text"
                        value={careerDream}
                        onChange={(e) => setCareerDream(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Keahlian Utama yang Sedang Dilatih:
                      </label>
                      <input
                        type="text"
                        value={careerSkill}
                        onChange={(e) => setCareerSkill(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const got = awardCappedBuildingXp(2, `Menyusun Peta Karier: ${careerDream}`);
                      setCareerSaved(
                        `Target Karier "${careerDream}" disimpan! ${
                          got > 0 ? `(+${got} XP)` : ''
                        }`
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                  >
                    Simpan Komitmen Cita-cita (+2 XP)
                  </button>
                  {careerSaved && (
                    <div className="p-3 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs font-semibold">
                      {careerSaved}
                    </div>
                  )}
                </div>
              )}

              {/* 2. LATIHAN TENTARA: DISIPLIN, TANGGUNG JAWAB & KERJA TIM */}
              {buildingId === 'latihan_tentara' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Pakta Disiplin, Tanggung Jawab & Kerja Tim Ksatria
                      </h3>
                      <p className="text-xs text-slate-400">
                        Centang 3 latihan karakter yang sudah kamu terapkan hari ini bersama rekan sekelasmu.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[
                      'Hadir dan memulai kegiatan belajar tepat waktu tanpa menunda tugas.',
                      'Menjaga kerapian file kerja, peralatan belajar, dan kebersihan lingkungan kelas.',
                      'Membantu rekan satu kelompok secara aktif dan berkomunikasi dengan santun.',
                    ].map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-emerald-500/40 transition text-xs text-slate-200"
                      >
                        <input
                          type="checkbox"
                          checked={disciplineChecks[idx]}
                          onChange={() =>
                            setDisciplineChecks((prev) =>
                              prev.map((v, i) => (i === idx ? !v : v))
                            )
                          }
                          className="w-4 h-4 accent-emerald-500"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      if (disciplineChecks.every(Boolean)) {
                        const got = awardCappedBuildingXp(2, 'Menuntaskan Pakta Disiplin & Kerja Tim');
                        setDisciplineNotice(
                          `Luar biasa! Kamu telah menuntaskan Pakta Disiplin Ksatria hari ini ${
                            got > 0 ? `(+${got} XP)` : ''
                          }.`
                        );
                      } else {
                        setDisciplineNotice('Silakan centang ketiga komitmen disiplin di atas terlebih dahulu.');
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    Lapor Ketuntasan Disiplin Tim (+2 XP)
                  </button>
                  {disciplineNotice && (
                    <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold">
                      {disciplineNotice}
                    </div>
                  )}
                </div>
              )}

              {/* 3. MUSEUM SENI: GALERI KARYA & KREATIVITAS */}
              {buildingId === 'museum_seni' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Palette className="w-5 h-5 text-amber-400" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Galeri Pameran Karya & Kreativitas Warga
                      </h3>
                      <p className="text-xs text-slate-400">
                        Pajang deskripsi karya terbaikmu dan berikan apresiasi pada karya warga lain.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <input
                      type="text"
                      value={artTitle}
                      onChange={(e) => setArtTitle(e.target.value)}
                      placeholder="Judul Karya Desain/Seni..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <select
                      value={artCategory}
                      onChange={(e) => setArtCategory(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Poster Publikasi">Poster Publikasi</option>
                      <option value="Ilustrasi Digital">Ilustrasi Digital</option>
                      <option value="Fotografi & Videografi">Fotografi & Videografi</option>
                      <option value="Tipografi & Logo">Tipografi & Logo</option>
                    </select>
                    <input
                      type="text"
                      value={artDesc}
                      onChange={(e) => setArtDesc(e.target.value)}
                      placeholder="Konsep singkat karya..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!artTitle.trim() || !artDesc.trim()) return;
                      const created: MuseumArtworkItem = {
                        id: `art-${Date.now()}`,
                        title: sanitizeStudentInputText(artTitle.trim()).cleanText,
                        creatorName: student.name,
                        className: student.className,
                        category: artCategory,
                        description: sanitizeStudentInputText(artDesc.trim()).cleanText,
                        likes: 1,
                        createdAt: new Date().toLocaleDateString('id-ID'),
                      };
                      const updated = [created, ...artworks];
                      setArtworks(updated);
                      try {
                        localStorage.setItem(
                          'kota_refleksi_museum_artworks_v1',
                          JSON.stringify(updated)
                        );
                      } catch {}
                      awardCappedBuildingXp(2, `Memajang Karya di Museum Seni: ${created.title}`);
                      setArtTitle('');
                      setArtDesc('');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
                  >
                    Pajang Karya di Galeri Museum (+2 XP)
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {artworks.map((art) => (
                      <div
                        key={art.id}
                        className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-1.5"
                      >
                        <div className="text-[11px] text-amber-300 font-semibold">
                          {art.category} · {art.creatorName} ({art.className})
                        </div>
                        <h4 className="text-xs font-extrabold text-white">{art.title}</h4>
                        <p className="text-xs text-slate-300">{art.description}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">{art.createdAt}</span>
                          <button
                            onClick={() => {
                              const next = artworks.map((a) =>
                                a.id === art.id ? { ...a, likes: a.likes + 1 } : a
                              );
                              setArtworks(next);
                              try {
                                localStorage.setItem(
                                  'kota_refleksi_museum_artworks_v1',
                                  JSON.stringify(next)
                                );
                              } catch {}
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 tabular-nums"
                          >
                            👏 Apresiasi ({art.likes})
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. PANGGUNG KOTA: PRESENTASI & PENGUMUMAN KELAS */}
              {buildingId === 'panggung_kota' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Mic className="w-5 h-5 text-purple-400" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Mimbar Panggung Terbuka: Presentasi & Pengumuman Kelas
                      </h3>
                      <p className="text-xs text-slate-400">
                        Daftarkan ringkasan presentasi karyamu atau bagikan pengumuman positif kelas.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <select
                      value={stageKind}
                      onChange={(e) =>
                        setStageKind(e.target.value as 'Presentasi Karya' | 'Pengumuman Kelas')
                      }
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    >
                      <option value="Presentasi Karya">Presentasi Karya</option>
                      <option value="Pengumuman Kelas">Pengumuman Kelas</option>
                    </select>
                    <input
                      type="text"
                      value={stageTopic}
                      onChange={(e) => setStageTopic(e.target.value)}
                      placeholder="Judul Presentasi / Pengumuman..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white sm:col-span-2"
                    />
                  </div>
                  <textarea
                    rows={2}
                    value={stageSummary}
                    onChange={(e) => setStageSummary(e.target.value)}
                    placeholder="Inti pesan presentasi 3 menit atau isi pengumuman kelas..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <button
                    onClick={() => {
                      if (!stageTopic.trim() || !stageSummary.trim()) return;
                      const item: StagePresentationItem = {
                        id: `stage-${Date.now()}`,
                        speakerName: student.name,
                        className: student.className,
                        topic: sanitizeStudentInputText(stageTopic.trim()).cleanText,
                        summary: sanitizeStudentInputText(stageSummary.trim()).cleanText,
                        kind: stageKind,
                        createdAt: new Date().toLocaleDateString('id-ID'),
                      };
                      const updated = [item, ...stageItems];
                      setStageItems(updated);
                      try {
                        localStorage.setItem(
                          'kota_refleksi_stage_items_v1',
                          JSON.stringify(updated)
                        );
                      } catch {}
                      awardCappedBuildingXp(2, `Tampil di Panggung Kota: ${item.topic}`);
                      setStageTopic('');
                      setStageSummary('');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs transition"
                  >
                    Tampilkan di Panggung Kota (+2 XP)
                  </button>

                  <div className="space-y-2 pt-2">
                    {stageItems.map((st) => (
                      <div
                        key={st.id}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-purple-300 font-semibold">
                          <span>
                            🎤 {st.kind} · {st.speakerName} ({st.className})
                          </span>
                          <span>{st.createdAt}</span>
                        </div>
                        <h4 className="font-bold text-white">{st.topic}</h4>
                        <p className="text-slate-300">{st.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. MALL KOTA: TEMPAT BELANJA ATRIBUT & LITERASI BIJAK */}
              {buildingId === 'mall_kota' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-5 h-5 text-rose-400" />
                      <div>
                        <h3 className="text-base font-extrabold text-white">
                          Etalase Belanja Atribut Kreatif — Refleksia Grand Mall
                        </h3>
                        <p className="text-xs text-slate-400">
                          Latih literasi belanja bijak dengan memprioritaskan perlengkapan produktif.
                        </p>
                      </div>
                    </div>
                    <div className="text-xs font-extrabold text-amber-300 tabular-nums">
                      Saldo XP Kamu: {student.points} XP
                    </div>
                  </div>

                  {mallNotice && (
                    <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 text-xs font-semibold">
                      {mallNotice}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {MALL_CATALOG.map((item) => {
                      const isOwned = ownedMallItems.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between gap-2"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl shrink-0">
                              {item.icon}
                            </div>
                            <div>
                              <div className="text-[11px] text-rose-300 font-semibold">
                                {item.category}
                              </div>
                              <h4 className="text-xs font-extrabold text-white">{item.name}</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">{item.benefit}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                            <span className="text-xs font-bold text-amber-300 tabular-nums">
                              Harga Simulasi: {item.xpCost} XP
                            </span>
                            <button
                              onClick={() => {
                                if (isOwned) {
                                  setMallNotice(`Kamu sudah memiliki ${item.name} di koleksi warga.`);
                                  return;
                                }
                                const next = [...ownedMallItems, item.id];
                                setOwnedMallItems(next);
                                try {
                                  localStorage.setItem(
                                    `kota_refleksi_mall_owned_${student.id}`,
                                    JSON.stringify(next)
                                  );
                                } catch {}
                                const got = awardCappedBuildingXp(
                                  2,
                                  `Simulasi Belanja Bijak: ${item.name}`
                                );
                                setMallNotice(
                                  `Berhasil memilih "${item.name}" (${item.category})! ${
                                    got > 0 ? `Bonus Literasi Belanja +${got} XP!` : ''
                                  }`
                                );
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                isOwned
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-rose-500 hover:bg-rose-400 text-white'
                              }`}
                            >
                              {isOwned ? '✓ Sudah Dimiliki' : 'Pilih Item'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 6. BANDARA: PERJALANAN BELAJAR & TARGET JANGKA PANJANG */}
              {buildingId === 'bandara' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <Plane className="w-5 h-5 text-sky-400" />
                    <div>
                      <h3 className="text-base font-extrabold text-white">
                        Boarding Pass Perjalanan Belajar & Target Jangka Panjang
                      </h3>
                      <p className="text-xs text-slate-400">
                        Cetak tiket perjalanan belajarmu dari Bandara Internasional Refleksia.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Destinasi Target Jangka Panjang (Lulus SMK):
                      </label>
                      <input
                        type="text"
                        value={flightDest}
                        onChange={(e) => setFlightDest(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Target Transit Semester Ini:
                      </label>
                      <input
                        type="text"
                        value={flightMilestone}
                        onChange={(e) => setFlightMilestone(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setBoardingPassSaved(true);
                      awardCappedBuildingXp(2, `Menerbitkan Boarding Pass: ${flightDest}`);
                    }}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition"
                  >
                    Terbitkan Boarding Pass Belajar (+2 XP)
                  </button>

                  {boardingPassSaved && (
                    <div className="bg-gradient-to-r from-sky-950/80 to-indigo-950/80 border border-sky-400/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-[11px] font-bold text-sky-300">
                          ✈️ REFLEKSIA AIRWAYS · BOARDING PASS RESMI
                        </div>
                        <div className="text-sm font-extrabold text-white">
                          Penumpang: {student.name} ({student.className})
                        </div>
                        <div className="text-xs text-slate-300">
                          Destinasi Utama: <strong className="text-amber-300">{flightDest}</strong>
                        </div>
                        <div className="text-xs text-slate-300">
                          Target Transit: {flightMilestone}
                        </div>
                      </div>
                      <div className="text-right text-xs font-mono text-sky-300 shrink-0 tabular-nums">
                        <div>GATE: PK-06</div>
                        <div>STATUS: READY TO FLY</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
