import React, { useState, useEffect, useRef } from 'react';
import {
  MentorFeedback,
  Reflection,
  Student,
  BuildingId,
  Materi,
  PodcastEpisodeRecord,
  PodcastTranscriptMessage,
} from '../../types/index.ts';
import { INITIAL_MATERI } from '../../data/initialData.ts';
import { StorageService as storage } from '../../utils/storage.ts';
import { sounds } from '../../utils/audio.ts';
import confetti from 'canvas-confetti';
import {
  X,
  Sparkles,
  CheckSquare,
  Square,
  Lightbulb,
  HelpCircle,
  History,
  MessageSquare,
  ArrowRight,
  AlertTriangle,
  ShieldCheck,
  Mic,
  Radio,
  Send,
  FileText,
  Database,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  Users,
  User,
  Copy,
  Check,
  Play,
} from 'lucide-react';

interface MenaraMentorModalProps {
  onClose: () => void;
  feedbacks: MentorFeedback[];
  reflections: Reflection[];
  student: Student;
  materis?: Materi[];
  onUpdateFeedbackSteps: (feedbackId: string, steps: boolean[]) => void;
  onNavigateBuilding: (buildingId: BuildingId) => void;
  onAddXp?: (amount: number, reason: string) => void;
}

export const STORAGE_KEY_PODCAST_HISTORY = 'kota_refleksi_podcast_history';

export const INITIAL_PODCAST_HISTORY: PodcastEpisodeRecord[] = [
  {
    id: 'pod-init-01',
    studentId: 'std-dkv2-01',
    studentName: 'ABDUL RAZAK SAMAUNA',
    className: 'X DKV 2',
    materiId: 'materi-bk-01',
    materiTitle: 'BAB 1 — MODEL IPO & ARSITEKTUR VON NEUMANN',
    sudahDikuasai:
      'Saya sudah paham alur Input, Process, dan Output, terutama bagaimana pen tablet menjadi input dan RAM menampung layer aktif.',
    perluDiperkuat:
      'Masih perlu memperkuat pemahaman tentang cara kerja Control Unit dan ALU di dalam CPU saat merender grafis.',
    saranKonkretAI: [
      'Gunakan analogi dapur studio: Control Unit adalah sutradara yang mengatur antrean, sedangkan ALU adalah juru hitung piksel.',
      'Coba amati Task Manager saat membuka aplikasi desain untuk melihat beban kerja CPU dan RAM secara langsung.',
      'Buat sketsa peta konsep hubungan Input -> CPU (CU + ALU) <-> RAM -> Output di buku catatan.',
    ],
    pertanyaanPemantikAI:
      'Jika suatu hari klien meminta revisi mendadak dengan 50 layer resolusi tinggi sementara kapasitas RAM terbatas, strategi apa yang akan kamu lakukan agar proses komputasi tidak macet?',
    jawabanPemantikSiswa:
      'Saya akan menggabungkan (merge) layer yang sudah final dan menutup aplikasi lain agar ruang meja kerja RAM tetap lega.',
    rencanaBelajarSiswa: [
      'Membaca kembali ilustrasi arsitektur Von Neumann di Perpustakaan Kampus selama 15 menit.',
      'Membuat infografis ringkas tentang perbedaan fungsi RAM dan Storage SSD.',
      'Mengerjakan latihan soal Model IPO di Bengkel Latihan.',
    ],
    apresiasiHost:
      'Luar biasa sekali obrolan kita hari ini, Abdul Razak! Kamu berhasil menghubungkan teori arsitektur komputer Von Neumann langsung ke manajemen layer desain grafis.',
    transcriptText: `[HOST AI MENTOR]: Halo pendengar Radio Refleksia! Selamat datang di Studio Podcast ON AIR Menara Mentor Kota bersama saya Host AI Mentor. Hari ini telah hadir bintang tamu spesial kita, ABDUL RAZAK SAMAUNA dari kelas X DKV 2 yang siap mengupas tuntas materi "BAB 1 — MODEL IPO & ARSITEKTUR VON NEUMANN". Halo Abdul Razak, dari materi ini, bagian mana yang menurutmu sudah paling kamu kuasai?\n\n[ABDUL RAZAK SAMAUNA]: Saya sudah paham alur Input, Process, dan Output, terutama bagaimana pen tablet menjadi input dan RAM menampung layer aktif.\n\n[HOST AI MENTOR]: Keren banget! Analogi RAM sebagai meja kerja layer itu tepat sasaran. Nah, kalau bagian atau area yang menurutmu masih perlu diperkuat apa nih?\n\n[ABDUL RAZAK SAMAUNA]: Masih perlu memperkuat pemahaman tentang cara kerja Control Unit dan ALU di dalam CPU saat merender grafis.\n\n[HOST AI MENTOR]: Jujur dan reflektif sekali! Sebagai Host sekaligus AI Mentor, ini 3 Saran Konkret untukmu:\n1. Gunakan analogi dapur studio: Control Unit adalah sutradara yang mengatur antrean, sedangkan ALU adalah juru hitung piksel.\n2. Coba amati Task Manager saat membuka aplikasi desain untuk melihat beban kerja CPU dan RAM secara langsung.\n3. Buat sketsa peta konsep hubungan Input -> CPU (CU + ALU) <-> RAM -> Output di buku catatan.\n\nSekarang, pertanyaan pemantik spesial buat kamu: "Jika suatu hari klien meminta revisi mendadak dengan 50 layer resolusi tinggi sementara kapasitas RAM terbatas, strategi apa yang akan kamu lakukan agar proses komputasi tidak macet?" Serta apa Rencana Belajar konkretmu selanjutnya?\n\n[ABDUL RAZAK SAMAUNA]: Saya akan menggabungkan (merge) layer yang sudah final dan menutup aplikasi lain agar ruang meja kerja RAM tetap lega. Rencana belajar saya: 1) Membaca kembali ilustrasi arsitektur Von Neumann di Perpustakaan Kampus selama 15 menit. 2) Membuat infografis ringkas tentang perbedaan fungsi RAM dan Storage SSD. 3) Mengerjakan latihan soal Model IPO di Bengkel Latihan.\n\n[HOST AI MENTOR]: Luar biasa sekali obrolan kita hari ini, Abdul Razak! Kamu berhasil menghubungkan teori arsitektur komputer Von Neumann langsung ke manajemen layer desain grafis. Sampai jumpa di episode Podcast Menara Mentor berikutnya!`,
    messages: [],
    createdAt: '31 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 30,
  },
];

export function getStoredPodcastHistory(): PodcastEpisodeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PODCAST_HISTORY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  try {
    localStorage.setItem(STORAGE_KEY_PODCAST_HISTORY, JSON.stringify(INITIAL_PODCAST_HISTORY));
  } catch {}
  return INITIAL_PODCAST_HISTORY;
}

export function saveStoredPodcastHistory(list: PodcastEpisodeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PODCAST_HISTORY, JSON.stringify(list));
  } catch {}
}

export function mergePodcastList(
  listA: PodcastEpisodeRecord[],
  listB: PodcastEpisodeRecord[]
): PodcastEpisodeRecord[] {
  const map = new Map<string, PodcastEpisodeRecord>();
  [...listA, ...listB].forEach((ep) => {
    if (ep && ep.id && ep.materiTitle) {
      map.set(ep.id, ep);
    }
  });
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Menyimpan Episode Podcast ke Google Spreadsheet (Kompatibel dengan GAS v2.0 & Sheet Riwayat_Podcast_Mentor)
 */
export async function syncPodcastEpisodeToSpreadsheet(episode: PodcastEpisodeRecord): Promise<void> {
  try {
    // 1. Kirim action khusus save_podcast_episode
    storage.syncWithGAS('save_podcast_episode', { episode });

    // 2. Kirim juga ke submit_reflection dengan penanda [PODCAST_MENARA_MENTOR] agar langsung tercatat rapi sebagai teks di Google Spreadsheet v2.0 tanpa perlu deploy ulang!
    const reflectionPayload: Reflection = {
      id: episode.id.startsWith('pod-') ? episode.id : `pod-${episode.id}`,
      studentId: episode.studentId || 'std-anon',
      studentName: episode.studentName || 'Siswa DKV',
      studentNumber: 'PODCAST',
      className: episode.className || 'X DKV 2',
      materiId: episode.materiId || 'materi-bk-01',
      materiTitle: `[PODCAST_MENARA_MENTOR] ${episode.materiTitle}`,
      scale: 5,
      moodEmoji: '🎙️',
      answers: {
        understood: episode.sudahDikuasai,
        difficult: episode.perluDiperkuat,
        findings: episode.jawabanPemantikSiswa,
        actionPlan: episode.rencanaBelajarSiswa.join('; '),
        customAnswers: {
          Transkrip_Podcast: episode.transcriptText,
          Pertanyaan_Pemantik_AI: episode.pertanyaanPemantikAI,
          Saran_Konkret_AI: episode.saranKonkretAI.join(' | '),
          Timestamp: String(episode.timestamp || Date.now()),
        },
      },
      createdAt: episode.createdAt,
    };

    await storage.syncWithGAS('submit_reflection', {
      reflection: reflectionPayload,
      feedback: {
        id: `fb-${reflectionPayload.id}`,
        reflectionId: reflectionPayload.id,
        apresiasi: episode.apresiasiHost,
        sudah_dikuasai: [episode.sudahDikuasai],
        perlu_diperkuat: [episode.perluDiperkuat],
        saran: episode.saranKonkretAI,
        pertanyaan_pemantik: episode.pertanyaanPemantikAI,
        rencana_belajar: episode.rencanaBelajarSiswa,
        perlu_perhatian_guru: false,
      },
    });
  } catch (err) {
    console.warn('Gagal menyinkronkan podcast ke Spreadsheet:', err);
  }
}

/**
 * Mengambil seluruh Riwayat Podcast dari Google Spreadsheet + Server API + LocalStorage
 */
export async function fetchPodcastsFromAllSources(): Promise<{
  episodes: PodcastEpisodeRecord[];
  fromSpreadsheet: boolean;
}> {
  let currentList = getStoredPodcastHistory();
  let fromSpreadsheet = false;

  // 1. Ambil dari Server API (/api/podcasts/history)
  try {
    const res = await fetch('/api/podcasts/history');
    if (res.ok) {
      const json = await res.json();
      const serverList = Array.isArray(json) ? json : json?.data || [];
      if (Array.isArray(serverList) && serverList.length > 0) {
        currentList = mergePodcastList(currentList, serverList);
      }
    }
  } catch {}

  // 2. Ambil dari Google Spreadsheet
  const settings = storage.getSettings();
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
        fromSpreadsheet = true;
        const sheetEpisodes: PodcastEpisodeRecord[] = [];

        // A. Jika skrip GAS mengembalikan array podcasts langsung
        if (Array.isArray(resData.podcasts)) {
          resData.podcasts.forEach((p: any) => {
            if (p && p.id && p.materiTitle) {
              sheetEpisodes.push({
                id: String(p.id),
                studentId: String(p.studentId || 'std-sheet'),
                studentName: String(p.studentName || 'Siswa DKV'),
                className: String(p.className || 'X DKV 2'),
                materiId: String(p.materiId || 'materi-bk-01'),
                materiTitle: String(p.materiTitle),
                sudahDikuasai: String(p.sudahDikuasai || ''),
                perluDiperkuat: String(p.perluDiperkuat || ''),
                saranKonkretAI: Array.isArray(p.saranKonkretAI) ? p.saranKonkretAI : [],
                pertanyaanPemantikAI: String(p.pertanyaanPemantikAI || ''),
                jawabanPemantikSiswa: String(p.jawabanPemantikSiswa || ''),
                rencanaBelajarSiswa: Array.isArray(p.rencanaBelajarSiswa) ? p.rencanaBelajarSiswa : [],
                apresiasiHost: String(p.apresiasiHost || ''),
                transcriptText: String(p.transcriptText || ''),
                messages: [],
                createdAt: String(p.createdAt || 'Hari ini'),
                timestamp: Number(p.timestamp) || Date.now(),
              });
            }
          });
        }

        // B. Ekstrak dari resData.reflections yang bertanda [PODCAST_MENARA_MENTOR] atau id 'pod-*'
        if (Array.isArray(resData.reflections)) {
          const fbList: MentorFeedback[] = Array.isArray(resData.feedbacks) ? resData.feedbacks : [];
          resData.reflections.forEach((r: Reflection, idx: number) => {
            const isPod =
              (r.id && String(r.id).startsWith('pod-')) ||
              (r.materiTitle && String(r.materiTitle).includes('[PODCAST_MENARA_MENTOR]')) ||
              r.studentNumber === 'PODCAST';

            if (isPod) {
              const matchedFb = fbList.find((f) => f.reflectionId === r.id);
              const cleanMateri = String(r.materiTitle || '')
                .replace('[PODCAST_MENARA_MENTOR]', '')
                .trim() || 'Materi Berpikir Komputasional';

              const sudah = r.answers?.understood || (matchedFb?.sudah_dikuasai?.[0] ?? '');
              const perlu = r.answers?.difficult || (matchedFb?.perlu_diperkuat?.[0] ?? '');
              const saranList = Array.isArray(matchedFb?.saran)
                ? matchedFb!.saran
                : matchedFb?.saran
                ? [String(matchedFb.saran)]
                : [];
              const pemantik =
                matchedFb?.pertanyaan_pemantik ||
                r.answers?.customAnswers?.['Pertanyaan_Pemantik_AI'] ||
                'Bagaimana penerapan materi ini pada proyek kejuruan DKV?';
              const jawabanPemantik = r.answers?.findings || '';
              const rencanaList =
                Array.isArray(matchedFb?.rencana_belajar) && matchedFb!.rencana_belajar.length > 0
                  ? matchedFb!.rencana_belajar
                  : r.answers?.actionPlan
                  ? r.answers.actionPlan.split('; ').filter(Boolean)
                  : [];
              const apresiasi =
                matchedFb?.apresiasi ||
                `Terima kasih ${r.studentName} telah berbagi di Podcast Menara Mentor!`;

              const savedTranscript =
                r.answers?.customAnswers?.['Transkrip_Podcast'] ||
                r.answers?.customAnswers?.['Catatan'] ||
                `[HOST AI MENTOR]: Selamat datang di Studio Podcast ON AIR Menara Mentor bersama ${r.studentName} (${r.className}) membahas "${cleanMateri}". Bagian mana yang sudah kamu kuasai?\n\n[${r.studentName}]: ${sudah}\n\n[HOST AI MENTOR]: Mantap! Lalu area mana yang masih perlu diperkuat?\n\n[${r.studentName}]: ${perlu}\n\n[HOST AI MENTOR]: Saran Konkret AI:\n${saranList
                  .map((s, i) => `${i + 1}. ${s}`)
                  .join('\n')}\n\nPertanyaan Pemantik: "${pemantik}"\n\n[${r.studentName}]: ${jawabanPemantik}\nRencana Belajar: ${rencanaList.join('; ')}\n\n[HOST AI MENTOR]: ${apresiasi}`;

              sheetEpisodes.push({
                id: String(r.id),
                studentId: String(r.studentId || 'std-sheet'),
                studentName: String(r.studentName || 'Siswa DKV'),
                className: String(r.className || 'X DKV 2'),
                materiId: String(r.materiId || 'materi-bk-01'),
                materiTitle: cleanMateri,
                sudahDikuasai: sudah,
                perluDiperkuat: perlu,
                saranKonkretAI: saranList,
                pertanyaanPemantikAI: pemantik,
                jawabanPemantikSiswa: jawabanPemantik,
                rencanaBelajarSiswa: rencanaList,
                apresiasiHost: apresiasi,
                transcriptText: savedTranscript,
                messages: [],
                createdAt: String(r.createdAt || 'Hari ini'),
                timestamp: Date.now() - idx * 60000,
              });
            }
          });
        }

        if (sheetEpisodes.length > 0) {
          currentList = mergePodcastList(currentList, sheetEpisodes);
        }
      }
    } catch {}
  }

  saveStoredPodcastHistory(currentList);
  return {
    episodes: currentList,
    fromSpreadsheet,
  };
}

export const MenaraMentorModal: React.FC<MenaraMentorModalProps> = ({
  onClose,
  feedbacks,
  reflections,
  student,
  materis = [],
  onUpdateFeedbackSteps,
  onNavigateBuilding,
  onAddXp,
}) => {
  // Available 5 core materials
  const availableMateris: Materi[] = INITIAL_MATERI.slice(0, 5).map((initBook, idx) => {
    const matched = materis.find((m) => m.id === initBook.id) || materis[idx];
    return matched || initBook;
  });

  // Tabs: 'podcast_studio' (Default ON AIR), 'podcast_history' (Riwayat Teks Spreadsheet), 'feedback' (Umpan Balik Refleksi)
  const [activeTab, setActiveTab] = useState<'podcast_studio' | 'podcast_history' | 'feedback'>('podcast_studio');

  // Podcast Studio States
  const [selectedMateriId, setSelectedMateriId] = useState<string>(availableMateris[0]?.id || 'materi-bk-01');
  const selectedMateri = availableMateris.find((m) => m.id === selectedMateriId) || availableMateris[0];

  type PodcastStage = 'select_topic' | 'ask_mastered' | 'ask_strengthen' | 'ask_plan_and_trigger' | 'completed';
  const [podcastStage, setPodcastStage] = useState<PodcastStage>('select_topic');
  const [chatMessages, setChatMessages] = useState<PodcastTranscriptMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [planStep1, setPlanStep1] = useState('');
  const [planStep2, setPlanStep2] = useState('');
  const [planStep3, setPlanStep3] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Podcast Session Collected Data
  const [sudahDikuasai, setSudahDikuasai] = useState('');
  const [perluDiperkuat, setPerluDiperkuat] = useState('');
  const [saranKonkretAI, setSaranKonkretAI] = useState<string[]>([]);
  const [pertanyaanPemantikAI, setPertanyaanPemantikAI] = useState('');
  const [jawabanPemantikSiswa, setJawabanPemantikSiswa] = useState('');
  const [rencanaBelajarSiswa, setRencanaBelajarSiswa] = useState<string[]>([]);
  const [apresiasiHost, setApresiasiHost] = useState('');
  const [completedEpisode, setCompletedEpisode] = useState<PodcastEpisodeRecord | null>(null);

  // Podcast History States
  const [episodes, setEpisodes] = useState<PodcastEpisodeRecord[]>(() => getStoredPodcastHistory());
  const [historyFilter, setHistoryFilter] = useState<'all' | 'mine'>('all');
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);
  const [copiedEpisodeId, setCopiedEpisodeId] = useState<string | null>(null);
  const [expandedEpisodeId, setExpandedEpisodeId] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // Load & sync Podcast History from Spreadsheet & Server
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const res = await fetchPodcastsFromAllSources();
        if (isMounted && Array.isArray(res.episodes)) {
          setEpisodes(res.episodes);
        }
      } catch {}
    };
    loadHistory();

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('kota_refleksi_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'PODCAST_EPISODE_ADDED' && event.data.episode && isMounted) {
          setEpisodes((prev) => {
            const next = mergePodcastList([event.data.episode], prev);
            saveStoredPodcastHistory(next);
            return next;
          });
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      if (bc) bc.close();
    };
  }, []);

  const handleManualSyncHistory = async () => {
    if (isSyncingSheet) return;
    sounds.playClick();
    setIsSyncingSheet(true);
    try {
      const res = await fetchPodcastsFromAllSources();
      setEpisodes(res.episodes);
    } catch {}
    setIsSyncingSheet(false);
  };

  const nowTimeStr = () =>
    new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  // Start Live Podcast Session
  const handleStartPodcast = () => {
    sounds.playClick();
    const introText = `🎙️ Halo pendengar setia Radio Refleksia! Selamat datang di Studio Podcast ON AIR Menara Mentor Kota bersama saya Host AI Mentor. Hari ini kita kedatangan bintang tamu spesial, ${student.name} dari kelas ${student.className || 'X DKV'}! Kita akan mengobrol santai mengupas materi "${selectedMateri.title}".\n\nHalo ${student.name}, senang sekali kamu hadir di studio! Untuk membuka obrolan kita: dari materi "${selectedMateri.title}" ini, bagian mana yang menurutmu SUDAH PALING KAMU KUASAI?`;

    setPodcastStage('ask_mastered');
    setSudahDikuasai('');
    setPerluDiperkuat('');
    setSaranKonkretAI([]);
    setPertanyaanPemantikAI('');
    setJawabanPemantikSiswa('');
    setRencanaBelajarSiswa([]);
    setApresiasiHost('');
    setCompletedEpisode(null);
    setUserInput('');
    setPlanStep1('');
    setPlanStep2('');
    setPlanStep3('');

    setChatMessages([
      {
        role: 'host',
        speakerName: 'Host AI Mentor',
        text: introText,
        timestamp: nowTimeStr(),
        stage: 'intro',
      },
    ]);
  };

  // Step 1 Submit: Student submits "Yang Sudah Kamu Kuasai"
  const handleSendMastered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiTyping) return;

    const answerText = userInput.trim();
    sounds.playClick();
    setSudahDikuasai(answerText);
    setUserInput('');

    const studentMsg: PodcastTranscriptMessage = {
      role: 'student',
      speakerName: student.name,
      text: answerText,
      timestamp: nowTimeStr(),
      stage: 'mastered',
    };

    setChatMessages((prev) => [...prev, studentMsg]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/gemini/podcast-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'after_mastered',
          studentName: student.name,
          className: student.className,
          materiTitle: selectedMateri.title,
          materiSummary: selectedMateri.content.slice(0, 350),
          sudahDikuasai: answerText,
        }),
      });
      const json = await res.json();
      const hostReply =
        json?.data?.hostReply ||
        `Keren banget ${student.name}! Penguasaanmu tentang "${answerText}" sudah sangat bagus. Nah, sekarang pertanyaan kedua dari Host: bagian atau AREA MANA YANG PERLU DIPERKUAT dari materi "${selectedMateri.title}" ini?`;

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'host',
          speakerName: 'Host AI Mentor',
          text: hostReply,
          timestamp: nowTimeStr(),
          stage: 'strengthen',
        },
      ]);
      setPodcastStage('ask_strengthen');
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          role: 'host',
          speakerName: 'Host AI Mentor',
          text: `Mantap sekali ${student.name}! Sekarang kita lanjut ke pertanyaan kedua: bagian atau AREA MANA YANG MASIH PERLU DIPERKUAT dari materi "${selectedMateri.title}" ini?`,
          timestamp: nowTimeStr(),
          stage: 'strengthen',
        },
      ]);
      setPodcastStage('ask_strengthen');
    } finally {
      setIsAiTyping(false);
    }
  };

  // Step 2 Submit: Student submits "Area Perlu Diperkuat" -> AI gives Saran Konkret + Pertanyaan Pemantik + asks for Rencana Belajar
  const handleSendStrengthen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiTyping) return;

    const strengthenText = userInput.trim();
    sounds.playClick();
    setPerluDiperkuat(strengthenText);
    setUserInput('');

    const studentMsg: PodcastTranscriptMessage = {
      role: 'student',
      speakerName: student.name,
      text: strengthenText,
      timestamp: nowTimeStr(),
      stage: 'strengthen',
    };

    setChatMessages((prev) => [...prev, studentMsg]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/gemini/podcast-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'after_strengthen',
          studentName: student.name,
          className: student.className,
          materiTitle: selectedMateri.title,
          materiSummary: selectedMateri.content.slice(0, 350),
          sudahDikuasai,
          perluDiperkuat: strengthenText,
        }),
      });
      const json = await res.json();
      const data = json?.data || {};
      const hostIntro =
        data.hostIntro ||
        `Terima kasih sudah terbuka berbagi, ${student.name}! Itu hal yang sangat wajar saat mempelajari "${selectedMateri.title}".`;
      const adviceList: string[] = Array.isArray(data.saranKonkret) && data.saranKonkret.length > 0
        ? data.saranKonkret
        : [
            `Pelajari ulang konsep "${strengthenText}" pada modul Perpustakaan Kampus dengan membuat sketsa alur visual.`,
            `Diskusikan contoh penerapan praktisnya bersama teman sekelas atau tanyakan ke guru lewat Kantor Pos.`,
            `Latih ketelitian dengan mengerjakan soal terkait di Bengkel Latihan.`,
          ];
      const triggerQ: string =
        data.pertanyaanPemantik ||
        `Jika konsep "${selectedMateri.title}" ini kamu gunakan dalam proyek desain nyata di studio DKV, bagaimana cara terbaik menerapkannya?`;
      const suggestedPlans: string[] = Array.isArray(data.suggestedRencana) ? data.suggestedRencana : [];

      setSaranKonkretAI(adviceList);
      setPertanyaanPemantikAI(triggerQ);
      if (suggestedPlans[0]) setPlanStep1(suggestedPlans[0]);
      if (suggestedPlans[1]) setPlanStep2(suggestedPlans[1]);
      if (suggestedPlans[2]) setPlanStep3(suggestedPlans[2]);

      const formattedHostAdviceMsg = `${hostIntro}\n\n💡 SARAN KONKRET DARI AI MENTOR:\n${adviceList
        .map((s, idx) => `${idx + 1}. ${s}`)
        .join('\n')}\n\n🔥 PERTANYAAN PEMANTIK UNTUKMU:\n"${triggerQ}"\n\nSekarang giliranmu menutup segmen ini: Apa tanggapanmu terhadap pertanyaan pemantik di atas, dan tuliskan Rencana Belajar konkretmu!`;

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'host',
          speakerName: 'Host AI Mentor',
          text: formattedHostAdviceMsg,
          timestamp: nowTimeStr(),
          stage: 'advice_trigger',
        },
      ]);
      setPodcastStage('ask_plan_and_trigger');
    } catch {
      const fallbackAdvice = [
        `Ulas kembali poin "${strengthenText}" di Perpustakaan Kampus sambil mencatat kata kunci.`,
        `Praktikkan dengan studi kasus desain sederhana bersama teman sebangku.`,
        `Uji pemahamanmu di Bengkel Latihan Kota Refleksi.`,
      ];
      const fallbackTrigger = `Menurutmu, mengapa pemahaman tentang "${selectedMateri.title}" sangat penting bagi seorang desainer komunikasi visual masa depan?`;
      setSaranKonkretAI(fallbackAdvice);
      setPertanyaanPemantikAI(fallbackTrigger);

      setChatMessages((prev) => [
        ...prev,
        {
          role: 'host',
          speakerName: 'Host AI Mentor',
          text: `Terima kasih atas kejujuranmu, ${student.name}!\n\n💡 SARAN KONKRET DARI AI MENTOR:\n1. ${fallbackAdvice[0]}\n2. ${fallbackAdvice[1]}\n3. ${fallbackAdvice[2]}\n\n🔥 PERTANYAAN PEMANTIK:\n"${fallbackTrigger}"\n\nSilakan berikan jawabanmu beserta Rencana Belajar 3 langkahmu!`,
          timestamp: nowTimeStr(),
          stage: 'advice_trigger',
        },
      ]);
      setPodcastStage('ask_plan_and_trigger');
    } finally {
      setIsAiTyping(false);
    }
  };

  // Step 3 Submit: Student answers Pertanyaan Pemantik & Rencana Belajar -> Finish & Save to Spreadsheet
  const handleFinishPodcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isAiTyping) return;

    const triggerAnswer = userInput.trim();
    const finalPlans = [
      planStep1.trim() || `Membaca ulang materi "${selectedMateri.title}" di Perpustakaan Kampus.`,
      planStep2.trim() || `Mempraktikkan saran mentor pada tugas praktik DKV berikutnya.`,
      planStep3.trim() || `Mengerjakan kuis evaluasi di Bengkel Latihan.`,
    ];

    sounds.playClick();
    setJawabanPemantikSiswa(triggerAnswer);
    setRencanaBelajarSiswa(finalPlans);
    setUserInput('');

    const studentText = `Jawaban Pemantik: "${triggerAnswer}"\n\n📋 Rencana Belajar Saya:\n1. ${finalPlans[0]}\n2. ${finalPlans[1]}\n3. ${finalPlans[2]}`;

    const studentMsg: PodcastTranscriptMessage = {
      role: 'student',
      speakerName: student.name,
      text: studentText,
      timestamp: nowTimeStr(),
      stage: 'action_plan',
    };

    const updatedMessagesWithStudent = [...chatMessages, studentMsg];
    setChatMessages(updatedMessagesWithStudent);
    setIsAiTyping(true);

    let closingText = `Luar biasa sekali, ${student.name}! Jawaban dan rencana belajar 3 langkahmu sangat inspiratif. Terima kasih sudah berbincang di Studio Podcast ON AIR Menara Mentor Kota! Seluruh transkrip obrolan kita telah disimpan ke Riwayat Podcast dan Google Spreadsheet.`;

    try {
      const res = await fetch('/api/gemini/podcast-host', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'closing',
          studentName: student.name,
          className: student.className,
          materiTitle: selectedMateri.title,
          jawabanPemantikSiswa: triggerAnswer,
          rencanaBelajarSiswa: finalPlans,
        }),
      });
      const json = await res.json();
      if (json?.data?.hostClosing) {
        closingText = json.data.hostClosing;
      }
    } catch {}

    const closingMsg: PodcastTranscriptMessage = {
      role: 'host',
      speakerName: 'Host AI Mentor',
      text: closingText,
      timestamp: nowTimeStr(),
      stage: 'closing',
    };

    const finalMessages = [...updatedMessagesWithStudent, closingMsg];
    setChatMessages(finalMessages);
    setApresiasiHost(closingText);
    setIsAiTyping(false);
    setPodcastStage('completed');

    // Build formatted full text transcript for Spreadsheet & History
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const fullTranscriptText = [
      `=== TRANSKRIP PODCAST STUDIO ON AIR - MENARA MENTOR KOTA ===`,
      `Tanggal: ${todayStr}`,
      `Bintang Tamu (Siswa): ${student.name} (${student.className || 'X DKV'})`,
      `Host: AI Mentor Kota Refleksi`,
      `Topik Materi: ${selectedMateri.title}`,
      `------------------------------------------------------------`,
      `1. YANG SUDAH DIKUASAI SISWA:`,
      `"${sudahDikuasai}"`,
      ``,
      `2. AREA YANG PERLU DIPERKUAT:`,
      `"${perluDiperkuat}"`,
      ``,
      `3. SARAN KONKRET DARI AI MENTOR:`,
      ...saranKonkretAI.map((s, i) => `   ${i + 1}. ${s}`),
      ``,
      `4. PERTANYAAN PEMANTIK DARI AI MENTOR:`,
      `"${pertanyaanPemantikAI}"`,
      `   Jawaban Siswa: "${triggerAnswer}"`,
      ``,
      `5. RENCANA BELAJAR SISWA (3 LANGKAH):`,
      ...finalPlans.map((p, i) => `   ${i + 1}. ${p}`),
      ``,
      `6. PENUTUP & APRESIASI HOST AI:`,
      `"${closingText}"`,
      `============================================================`,
    ].join('\n');

    const newEpisode: PodcastEpisodeRecord = {
      id: `pod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: student.id,
      studentName: student.name,
      className: student.className || 'X DKV 2',
      materiId: selectedMateri.id,
      materiTitle: selectedMateri.title,
      sudahDikuasai,
      perluDiperkuat,
      saranKonkretAI,
      pertanyaanPemantikAI,
      jawabanPemantikSiswa: triggerAnswer,
      rencanaBelajarSiswa: finalPlans,
      apresiasiHost: closingText,
      transcriptText: fullTranscriptText,
      messages: finalMessages,
      createdAt: todayStr,
      timestamp: Date.now(),
    };

    setCompletedEpisode(newEpisode);

    // 1. Save to LocalStorage & state
    const updatedEpisodes = mergePodcastList([newEpisode], episodes);
    setEpisodes(updatedEpisodes);
    saveStoredPodcastHistory(updatedEpisodes);

    // 2. Save to Backend Server
    try {
      fetch('/api/podcasts/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEpisode),
      }).catch(() => {});
    } catch {}

    // 3. Save directly to Google Spreadsheet as structured text!
    syncPodcastEpisodeToSpreadsheet(newEpisode);

    // 4. Broadcast to other tabs
    try {
      const bc = new BroadcastChannel('kota_refleksi_channel');
      bc.postMessage({ type: 'PODCAST_EPISODE_ADDED', episode: newEpisode });
      bc.close();
    } catch {}

    // 5. Reward XP
    if (onAddXp) {
      onAddXp(1, `Menyelesaikan Podcast AI Menara Mentor: ${selectedMateri.title}`);
    }
    sounds.playRewardXp();
    try {
      confetti({ particleCount: 55, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  // Existing Feedback tab logic
  const studentReflections = reflections.filter((r) => r.studentId === student.id);
  const latestReflection = studentReflections[0];
  const latestFeedback = latestReflection
    ? feedbacks.find((f) => f.reflectionId === latestReflection.id) || feedbacks[0]
    : feedbacks[0];

  const [selectedReflectionId, setSelectedReflectionId] = useState<string>(
    latestReflection?.id || ''
  );

  const displayedReflection =
    studentReflections.find((r) => r.id === selectedReflectionId) || latestReflection;
  const displayedFeedback = displayedReflection
    ? feedbacks.find((f) => f.reflectionId === displayedReflection.id) || latestFeedback
    : latestFeedback;

  const handleToggleStep = (index: number) => {
    if (!displayedFeedback) return;
    const currentSteps = [...(displayedFeedback.completedSteps || [false, false, false])];
    currentSteps[index] = !currentSteps[index];
    onUpdateFeedbackSteps(displayedFeedback.id, currentSteps);
  };

  const filteredEpisodes = episodes.filter((ep) => {
    if (historyFilter === 'mine') {
      return (
        ep.studentId === student.id ||
        ep.studentName.toLowerCase() === student.name.toLowerCase()
      );
    }
    return true;
  });

  const handleCopyTranscript = (ep: PodcastEpisodeRecord) => {
    sounds.playClick();
    try {
      navigator.clipboard.writeText(ep.transcriptText);
      setCopiedEpisodeId(ep.id);
      setTimeout(() => setCopiedEpisodeId(null), 2000);
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-backdrop-fade">
      <div className="bg-slate-900 border border-purple-500/40 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[93vh] text-slate-100 animate-fade-in-up">
        {/* Studio Header */}
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 px-5 sm:px-6 py-4 text-white flex items-center justify-between border-b border-purple-500/30">
          <div className="flex items-center gap-3.5">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-purple-700 flex items-center justify-center text-2xl shadow-lg border border-rose-400/50 shrink-0">
              🎙️
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-red-600 text-white flex items-center gap-1 shadow-sm shadow-red-600/50 animate-pulse">
                  <Radio className="w-3 h-3" /> ON AIR PODCAST
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Database className="w-3 h-3" /> Terekam di Spreadsheet v2.6
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black font-display leading-tight mt-0.5">
                Studio Podcast Menara Mentor Kota
              </h2>
              <p className="text-[11px] text-purple-200">
                Ngobrol Interaktif bareng Host AI Mentor • Bintang Tamu: <strong>{student.name}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Tutup Menara Mentor"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/70 px-5 py-2.5 overflow-x-auto">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('podcast_studio');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'podcast_studio'
                ? 'bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>🎙️ Studio Podcast AI (ON AIR)</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('podcast_history');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'podcast_history'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📜 Riwayat Podcast Teks Spreadsheet ({episodes.length})</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('feedback');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'feedback'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Umpan Balik Refleksi ({studentReflections.length})</span>
          </button>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* ============================================================ */}
          {/* TAB 1: STUDIO PODCAST AI (MENGOBROL DENGAN HOST AI MENTOR) */}
          {/* ============================================================ */}
          {activeTab === 'podcast_studio' && (
            <div className="space-y-4">
              {/* Stage 0: Pilih Materi Podcast */}
              {podcastStage === 'select_topic' && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 shadow-xl space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-start gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-400/40 flex items-center justify-center text-3xl shrink-0">
                        🎧
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-400 block">
                          SIARAN INTERAKTIF DUA ARAH
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          Selamat Datang di Studio Podcast, {student.name}!
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          Pilih salah satu materi di bawah ini. Kamu akan diwawancarai langsung oleh{' '}
                          <strong className="text-purple-300">Host AI Mentor</strong> membahas:
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alur Obrolan Podcast Badge List */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                    {[
                      { num: '1', label: 'Yang Sudah Dikuasai', icon: '✅', color: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300' },
                      { num: '2', label: 'Area Perlu Diperkuat', icon: '🎯', color: 'border-amber-500/40 bg-amber-950/30 text-amber-300' },
                      { num: '3', label: 'Saran Konkret dari AI', icon: '💡', color: 'border-purple-500/40 bg-purple-950/30 text-purple-300' },
                      { num: '4', label: 'Pertanyaan Pemantik AI', icon: '🔥', color: 'border-rose-500/40 bg-rose-950/30 text-rose-300' },
                      { num: '5', label: 'Rencana Belajar & Simpan', icon: '📊', color: 'border-sky-500/40 bg-sky-950/30 text-sky-300' },
                    ].map((item) => (
                      <div
                        key={item.num}
                        className={`p-2.5 rounded-xl border ${item.color} flex items-center gap-2 font-bold`}
                      >
                        <span className="text-base">{item.icon}</span>
                        <span className="leading-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pilih Topik Materi */}
                  <div className="space-y-2.5">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-purple-300">
                      Pilih Topik Materi Podcast Hari Ini:
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {availableMateris.map((m, idx) => {
                        const isSelected = m.id === selectedMateriId;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setSelectedMateriId(m.id);
                            }}
                            className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? 'bg-purple-600/25 border-purple-400 shadow-lg shadow-purple-950/50 text-white'
                                : 'bg-slate-950/60 border-white/10 text-slate-300 hover:bg-white/5 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                0{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <h4 className="text-xs sm:text-sm font-extrabold truncate">
                                  {m.title}
                                </h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {m.subject} • Klik untuk memilih topik obrolan
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                isSelected ? 'border-purple-400 bg-purple-500 text-white' : 'border-slate-600'
                              }`}
                            >
                              {isSelected && <span className="text-[10px] font-bold">✓</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleStartPodcast}
                      className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2.5 transition transform active:scale-95 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      <span>Mulai Siaran Podcast Bersama Host AI (+1 XP)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Active Podcast Conversation Room */}
              {podcastStage !== 'select_topic' && (
                <div className="space-y-4">
                  {/* Studio Banner Top */}
                  <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-purple-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[11px] font-black">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span>LIVE STUDIO</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Topik Materi Podcast:</span>
                        <h4 className="text-xs sm:text-sm font-extrabold text-white">
                          {selectedMateri.title}
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPodcastStage('select_topic')}
                      className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] font-bold transition cursor-pointer"
                    >
                      Ganti Materi
                    </button>
                  </div>

                  {/* Step Progress Indicator */}
                  <div className="grid grid-cols-4 gap-2 text-[10px] font-bold">
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        podcastStage === 'ask_mastered'
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                          : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                      }`}
                    >
                      1. Yang Dikuasai {sudahDikuasai && '✓'}
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        podcastStage === 'ask_strengthen'
                          ? 'bg-amber-600/30 border-amber-400 text-amber-200'
                          : perluDiperkuat
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      2. Area Diperkuat {perluDiperkuat && '✓'}
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        podcastStage === 'ask_plan_and_trigger'
                          ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                          : podcastStage === 'completed'
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      3. Saran AI & Pemantik {jawabanPemantikSiswa && '✓'}
                    </div>
                    <div
                      className={`p-2 rounded-xl border text-center ${
                        podcastStage === 'completed'
                          ? 'bg-emerald-600/30 border-emerald-400 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      4. Teks Spreadsheet {podcastStage === 'completed' && '✓'}
                    </div>
                  </div>

                  {/* Chat / Podcast Dialogue Feed */}
                  <div className="p-4 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4 max-h-[340px] overflow-y-auto">
                    {chatMessages.map((msg, i) => {
                      const isHost = msg.role === 'host';
                      return (
                        <div
                          key={i}
                          className={`flex items-start gap-3 ${
                            isHost ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          {isHost && (
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 border border-purple-400/50 flex items-center justify-center text-lg shrink-0 shadow-md">
                              🎙️
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap ${
                              isHost
                                ? 'bg-slate-800/90 border border-purple-500/30 text-slate-100 rounded-tl-none'
                                : 'bg-gradient-to-r from-emerald-700 to-teal-700 border border-emerald-400/40 text-white rounded-tr-none'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-1 text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                              <span className={isHost ? 'text-purple-300' : 'text-emerald-200'}>
                                {isHost ? '🎧 Host AI Mentor' : `🎤 ${msg.speakerName} (Bintang Tamu)`}
                              </span>
                              <span>{msg.timestamp}</span>
                            </div>
                            <div>{msg.text}</div>
                          </div>

                          {!isHost && (
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 border border-emerald-400/50 flex items-center justify-center text-lg shrink-0 shadow-md">
                              🧑‍🎨
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isAiTyping && (
                      <div className="flex items-center gap-3 text-xs text-purple-300 animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center">
                          🎙️
                        </div>
                        <span>Host AI Mentor sedang merangkai tanggapan & saran podcast...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Form for Stage 1: Yang Sudah Kamu Kuasai */}
                  {podcastStage === 'ask_mastered' && (
                    <form onSubmit={handleSendMastered} className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-3">
                      <label className="block text-xs font-extrabold text-emerald-300 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Segmen 1 — Ceritakan ke Host AI: Bagian mana yang SUDAH KAMU KUASAI?</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder={`Contoh: Saya sudah mengerti konsep dasar ${selectedMateri.title} dan cara kerjanya saat praktik desain...`}
                        className="w-full p-3 rounded-xl bg-slate-900 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!userInput.trim() || isAiTyping}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Jawab ke Mikrofon Host AI</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Input Form for Stage 2: Area Perlu Diperkuat */}
                  {podcastStage === 'ask_strengthen' && (
                    <form onSubmit={handleSendStrengthen} className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/40 space-y-3">
                      <label className="block text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4" />
                        <span>Segmen 2 — Bagian atau AREA MANA YANG PERLU DIPERKUAT dari materi ini?</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Contoh: Saya masih agak bingung membedakan tahapan teknisnya saat menghadapi studi kasus kompleks..."
                        className="w-full p-3 rounded-xl bg-slate-900 border border-white/15 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!userInput.trim() || isAiTyping}
                          className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 transition cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim & Minta Saran Konkret AI</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Input Form for Stage 3: Pertanyaan Pemantik & Rencana Belajar Siswa */}
                  {podcastStage === 'ask_plan_and_trigger' && (
                    <form onSubmit={handleFinishPodcast} className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-4">
                      {/* Highlighted AI Advice & Trigger Box */}
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-400/30 space-y-2.5 text-xs">
                        <div>
                          <span className="font-extrabold text-purple-300 uppercase tracking-wider text-[10px] block mb-1">
                            💡 Ringkasan Saran Konkret dari AI Mentor:
                          </span>
                          <ul className="space-y-1 text-slate-200 pl-4 list-decimal">
                            {saranKonkretAI.map((s, idx) => (
                              <li key={idx}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-white/10">
                          <span className="font-extrabold text-rose-300 uppercase tracking-wider text-[10px] block mb-0.5">
                            🔥 Pertanyaan Pemantik dari Host AI:
                          </span>
                          <p className="text-white font-semibold italic">"{pertanyaanPemantikAI}"</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-purple-200 mb-1">
                          1. Jawabanmu atas Pertanyaan Pemantik Host AI:
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          placeholder="Tuliskan tanggapan atau ide kreatifmu menjawab pertanyaan pemantik di atas..."
                          className="w-full p-3 rounded-xl bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-xs font-extrabold text-emerald-300">
                          2. Rencana Belajar Siswa (3 Langkah Konkret — dapat kamu sesuaikan):
                        </label>
                        <input
                          type="text"
                          value={planStep1}
                          onChange={(e) => setPlanStep1(e.target.value)}
                          placeholder="Langkah 1: Membaca kembali modul di Perpustakaan..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                        <input
                          type="text"
                          value={planStep2}
                          onChange={(e) => setPlanStep2(e.target.value)}
                          placeholder="Langkah 2: Mempraktikkan materi pada proyek desain..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                        <input
                          type="text"
                          value={planStep3}
                          onChange={(e) => setPlanStep3(e.target.value)}
                          placeholder="Langkah 3: Mengerjakan latihan soal di Bengkel Latihan..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-emerald-400"
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={!userInput.trim() || isAiTyping}
                          className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selesaikan Podcast & Simpan ke Riwayat Teks Spreadsheet (+1 XP)</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Stage 4: Podcast Completed Summary & Spreadsheet Saved Banner */}
                  {podcastStage === 'completed' && completedEpisode && (
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-purple-950/50 border-2 border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                          <div>
                            <h4 className="text-sm sm:text-base font-black text-white">
                              Siaran Podcast Selesai & Tersimpan di Google Spreadsheet!
                            </h4>
                            <p className="text-xs text-emerald-300">
                              Transkrip lengkap obrolanmu bersama Host AI telah dicatat di Riwayat Podcast berbentuk teks Spreadsheet.
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyTranscript(completedEpisode)}
                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            {copiedEpisodeId === completedEpisode.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Teks</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab('podcast_history')}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-extrabold text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Lihat di Riwayat Podcast</span>
                          </button>
                        </div>
                      </div>

                      {/* Preview Teks Transkrip Spreadsheet */}
                      <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-white/10 font-mono text-[11px] text-slate-200 whitespace-pre-wrap max-h-52 overflow-y-auto leading-relaxed">
                        {completedEpisode.transcriptText}
                      </div>

                      <div className="flex justify-between items-center pt-1">
                        <button
                          type="button"
                          onClick={() => setPodcastStage('select_topic')}
                          className="px-4 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400/40 text-purple-200 text-xs font-bold cursor-pointer"
                        >
                          🎙️ Buat Episode Podcast Materi Lainnya
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: RIWAYAT PODCAST BERBENTUK TEKS SPREADSHEET */}
          {/* ============================================================ */}
          {activeTab === 'podcast_history' && (
            <div className="space-y-4">
              {/* Filter & Sync Bar */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setHistoryFilter('all');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      historyFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Semua Warga ({episodes.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setHistoryFilter('mine');
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      historyFilter === 'mine'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>
                      Podcast Saya (
                      {
                        episodes.filter(
                          (e) =>
                            e.studentId === student.id ||
                            e.studentName.toLowerCase() === student.name.toLowerCase()
                        ).length
                      }
                      )
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSyncHistory}
                    disabled={isSyncingSheet}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSheet ? 'animate-spin' : ''}`} />
                    <span>{isSyncingSheet ? 'Menyinkronkan...' : 'Sinkron Spreadsheet'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('podcast_studio');
                      setPodcastStage('select_topic');
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Rekam Podcast Baru</span>
                  </button>
                </div>
              </div>

              {/* Spreadsheet Table View + Full Text Transcript Cards */}
              {filteredEpisodes.length === 0 ? (
                <div className="text-center py-14 px-4 rounded-3xl bg-slate-950/50 border border-white/10 space-y-3">
                  <div className="text-4xl">🎙️</div>
                  <h4 className="text-sm font-bold text-white">Belum Ada Riwayat Podcast di Kategori Ini</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Mulai ngobrol dengan Host AI di Studio Podcast untuk menyimpan riwayat refleksi berbentuk teks Spreadsheet!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Spreadsheet-Style Structured Table */}
                  <div className="rounded-2xl border border-emerald-500/30 overflow-hidden bg-slate-950/90 shadow-xl">
                    <div className="bg-emerald-950/80 border-b border-emerald-500/30 px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-300">
                        <Database className="w-4 h-4" />
                        <span>TABEL DATA RIWAYAT PODCAST (FORMAT TEKS SPREADSHEET)</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-200">
                        {filteredEpisodes.length} Baris Rekaman
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="bg-slate-900 text-slate-300 border-b border-slate-800 uppercase font-extrabold">
                            <th className="py-2.5 px-3 border-r border-slate-800">Waktu</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Nama Siswa & Kelas</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Materi Podcast</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Yang Dikuasai</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Perlu Diperkuat</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Saran Konkret AI</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Pertanyaan Pemantik & Jawaban</th>
                            <th className="py-2.5 px-3 border-r border-slate-800">Rencana Belajar</th>
                            <th className="py-2.5 px-3 text-center">Teks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/80 text-slate-200">
                          {filteredEpisodes.map((ep) => {
                            const isExpanded = expandedEpisodeId === ep.id;
                            return (
                              <React.Fragment key={ep.id}>
                                <tr className="hover:bg-slate-900/70 transition align-top">
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 whitespace-nowrap font-mono text-[10px] text-slate-400">
                                    {ep.createdAt}
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80">
                                    <div className="font-extrabold text-white">{ep.studentName}</div>
                                    <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[9px] font-bold">
                                      {ep.className}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 font-bold text-emerald-300 max-w-[150px]">
                                    {ep.materiTitle}
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 max-w-[170px]">
                                    {ep.sudahDikuasai}
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 max-w-[170px] text-amber-200">
                                    {ep.perluDiperkuat}
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 max-w-[200px]">
                                    <ol className="list-decimal pl-3.5 space-y-0.5 text-[10.5px]">
                                      {(ep.saranKonkretAI || []).map((s, idx) => (
                                        <li key={idx}>{s}</li>
                                      ))}
                                    </ol>
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 max-w-[200px]">
                                    <div className="text-rose-300 italic mb-1">
                                      "Q: {ep.pertanyaanPemantikAI}"
                                    </div>
                                    {ep.jawabanPemantikSiswa && (
                                      <div className="text-slate-300">
                                        <strong>Jawab:</strong> {ep.jawabanPemantikSiswa}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-2.5 px-3 border-r border-slate-800/80 max-w-[190px]">
                                    <ol className="list-decimal pl-3.5 space-y-0.5 text-[10.5px] text-sky-200">
                                      {(ep.rencanaBelajarSiswa || []).map((r, idx) => (
                                        <li key={idx}>{r}</li>
                                      ))}
                                    </ol>
                                  </td>
                                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                    <div className="flex flex-col gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedEpisodeId(isExpanded ? null : ep.id)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white font-bold text-[10px] transition cursor-pointer"
                                      >
                                        {isExpanded ? 'Tutup Teks' : 'Buka Transkrip'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyTranscript(ep)}
                                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 font-bold text-[10px] transition cursor-pointer"
                                      >
                                        {copiedEpisodeId === ep.id ? '✓ Disalin' : 'Salin Teks'}
                                      </button>
                                    </div>
                                  </td>
                                </tr>

                                {isExpanded && (
                                  <tr className="bg-slate-950">
                                    <td colSpan={9} className="p-4 border-b border-purple-500/30">
                                      <div className="p-4 rounded-2xl bg-slate-900 border border-purple-500/40 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                                        {ep.transcriptText}
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: UMPAN BALIK REFLEKSI (EXISTING MENTOR FEEDBACK) */}
          {/* ============================================================ */}
          {activeTab === 'feedback' && (
            <div className="space-y-5">
              {displayedFeedback ? (
                <div className="space-y-5">
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 to-indigo-950/80 border border-purple-500/40 shadow-lg">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">🌟</span>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                          Apresiasi Mentor Kota
                        </h4>
                        <p className="text-sm font-semibold text-white mt-1 leading-relaxed">
                          "{displayedFeedback.apresiasi}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {displayedFeedback.perlu_perhatian_guru && (
                    <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-600/50 flex items-start gap-3 text-xs text-amber-200">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 block mb-0.5">Pesan Pendampingan Khusus:</strong>
                        Mentor melihat kamu sedang menghadapi kesulitan yang cukup berat. Jangan ragu untuk berdiskusi dengan guru pengampu atau guru BK ya!
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-600/40">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Yang Sudah Kamu Kuasai</span>
                      </h5>
                      <ul className="space-y-1.5">
                        {(displayedFeedback.sudah_dikuasai || []).map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-600/40">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4" />
                        <span>Area Perlu Diperkuat</span>
                      </h5>
                      <ul className="space-y-1.5">
                        {(displayedFeedback.perlu_diperkuat || []).map((item: string, idx: number) => (
                          <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
                      <span>💡</span>
                      <span>Saran Konkret untuk Belajar Berikutnya</span>
                    </h5>
                    <div className="space-y-2">
                      {(Array.isArray(displayedFeedback.saran)
                        ? displayedFeedback.saran
                        : displayedFeedback.saran
                        ? [displayedFeedback.saran]
                        : []
                      ).map((s: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs text-slate-200 flex items-start gap-2"
                        >
                          <span className="w-5 h-5 rounded-full bg-purple-600/30 text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3">
                    <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">
                        Pertanyaan Pemantik dari Mentor
                      </h5>
                      <p className="text-xs sm:text-sm text-slate-200 font-medium italic">
                        "{displayedFeedback.pertanyaan_pemantik}"
                      </p>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-purple-400" />
                        <span>Rencana Belajar 3 Langkah (Bisa Dicentang)</span>
                      </h5>
                      <span className="text-[11px] font-bold text-slate-400">
                        {(displayedFeedback.completedSteps || []).filter(Boolean).length} / 3 Selesai
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {(displayedFeedback.rencana_belajar || []).map((step: string, idx: number) => {
                        const isChecked = displayedFeedback.completedSteps?.[idx] || false;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleStep(idx)}
                            className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                              isChecked
                                ? 'bg-purple-950/60 border-purple-500 text-purple-200 line-through'
                                : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:border-slate-600'
                            }`}
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                            ) : (
                              <Square className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                            )}
                            <span className="text-xs sm:text-sm leading-snug">{step}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-purple-900/50 flex items-center justify-center text-3xl mx-auto">
                    🎙️
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Mulai Podcast Pertamamu!</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Klik tab Studio Podcast AI (ON AIR) untuk berbincang dengan Host AI atau kunjungi Pusat Refleksi.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('podcast_studio')}
                    className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold inline-flex items-center gap-2 transition cursor-pointer"
                  >
                    <span>Ke Studio Podcast AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
