import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Heart, Send, CheckCircle2, Pin, Calendar, User, Search, Filter, MessageSquare, BookOpen, RefreshCw, Database } from 'lucide-react';
import { DailyJournalStickyNote, Student, PublicChatMessage, Reflection } from '../../types/index.ts';
import { sounds } from '../../utils/audio.ts';
import { StorageService as storage } from '../../utils/storage.ts';
import confetti from 'canvas-confetti';

interface JurnalHarianModalProps {
  onClose: () => void;
  student?: Student | null;
  onAddXp?: (amount: number, reason: string) => void;
  onNoteAdded?: (newNote: DailyJournalStickyNote) => void;
}

export const STORAGE_KEY_JURNAL_BERINGIN = 'kota_jurnal_harian_beringin';
export const STORAGE_KEY_JURNAL_LIKES_BY_USER = 'kota_jurnal_likes_by_user';

export const INITIAL_STICKY_NOTES: DailyJournalStickyNote[] = [
  {
    id: 'note-init-01',
    studentId: 'std-dkv2-01',
    studentName: 'ABDUL RAZAK SAMAUNA',
    className: 'X DKV 2',
    content: 'Hari ini paham konsep IPO Von Neumann, ternyata alur kerja layer desain mirip pemrosesan RAM!',
    mood: '💡',
    color: 'yellow',
    date: '31 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 45,
    likes: 5,
    likedBy: ['std-dkv2-02', 'std-dkv2-03', 'teacher-naziefah'],
    likedByNames: ['Siti Rahma', 'Budi Santoso', 'NAZIEFAH S.Pd'],
  },
  {
    id: 'note-init-02',
    studentId: 'teacher-naziefah',
    studentName: 'NAZIEFAH S.Pd',
    className: 'Guru Pembimbing',
    content: 'Semangat terus anak-anak DKV! Jangan lupa selalu istirahat cukup & jaga ketelitian berkarya.',
    mood: '🌿',
    color: 'pink',
    date: '31 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 120,
    likes: 12,
    likedBy: ['std-dkv2-01', 'std-dkv3-05', 'std-dkv2-12'],
    likedByNames: ['ABDUL RAZAK SAMAUNA', 'FADHIL ARKAN', 'NURUL AISYAH'],
  },
  {
    id: 'note-init-03',
    studentId: 'std-dkv3-05',
    studentName: 'FADHIL ARKAN',
    className: 'X DKV 3',
    content: 'Berhasil selesaikan 5 soal di Bengkel Latihan. Semoga besok bisa raih lencana reflektor lagi!',
    mood: '🚀',
    color: 'blue',
    date: '30 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 60 * 18,
    likes: 4,
    likedBy: ['std-dkv2-01', 'teacher-naziefah'],
    likedByNames: ['ABDUL RAZAK SAMAUNA', 'NAZIEFAH S.Pd'],
  },
  {
    id: 'note-init-04',
    studentId: 'std-dkv2-12',
    studentName: 'NURUL AISYAH',
    className: 'X DKV 2',
    content: 'Tadi santai di ayunan relaksasi sambil baca modul tipografi. Suasana kotanya adem banget.',
    mood: '🎨',
    color: 'green',
    date: '30 Okt 2026',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    likes: 7,
    likedBy: ['std-dkv2-01', 'std-dkv3-05'],
    likedByNames: ['ABDUL RAZAK SAMAUNA', 'FADHIL ARKAN'],
  },
];

const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const SHORT_MONTH_MAP: Record<string, string> = {
  jan: 'Januari',
  feb: 'Februari',
  mar: 'Maret',
  apr: 'April',
  mei: 'Mei',
  may: 'Mei',
  jun: 'Juni',
  jul: 'Juli',
  agu: 'Agustus',
  ags: 'Agustus',
  aug: 'Agustus',
  sep: 'September',
  sept: 'September',
  okt: 'Oktober',
  oct: 'Oktober',
  nov: 'November',
  des: 'Desember',
  dec: 'Desember',
};

/**
 * Memastikan format tanggal pada bagian bawah Sticky Note Batang Pohon
 * HANYA menampilkan Tanggal Bulan Tahun (contoh: "31 Oktober 2026") tanpa jam/waktu.
 */
export function formatTanggalBulanTahun(rawDate?: string, fallbackTimestamp?: number): string {
  const formatFromDateObj = (d: Date): string => {
    const day = d.getDate();
    const month = INDONESIAN_MONTHS[d.getMonth()] || 'Oktober';
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  if (rawDate && typeof rawDate === 'string') {
    const trimmed = rawDate.trim();

    // 1. Jika sudah berformat "31 Oktober 2026" atau "31 Okt 2026" (tanpa jam)
    const textDateMatch = trimmed.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
    if (textDateMatch) {
      const day = parseInt(textDateMatch[1], 10);
      const rawMonth = textDateMatch[2].toLowerCase();
      const year = textDateMatch[3];
      const fullMonth =
        INDONESIAN_MONTHS.find((m) => m.toLowerCase() === rawMonth) ||
        SHORT_MONTH_MAP[rawMonth.slice(0, 3)] ||
        textDateMatch[2];
      return `${day} ${fullMonth} ${year}`;
    }

    // 2. Jika berformat DD/MM/YYYY atau DD-MM-YYYY (sering dari Spreadsheet lokal Indonesia, misal "31/10/2026 14:20:00")
    const slashMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (slashMatch) {
      const d = parseInt(slashMatch[1], 10);
      const m = parseInt(slashMatch[2], 10);
      const y = parseInt(slashMatch[3], 10);
      if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
        return `${d} ${INDONESIAN_MONTHS[m - 1]} ${y}`;
      }
    }

    // 3. Jika berformat ISO (YYYY-MM-DD...) dari Google Spreadsheet JSON
    if (trimmed.toLowerCase() !== 'hari ini') {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        return formatFromDateObj(parsed);
      }
    }
  }

  if (fallbackTimestamp && !isNaN(Number(fallbackTimestamp)) && Number(fallbackTimestamp) > 0) {
    const d = new Date(Number(fallbackTimestamp));
    if (!isNaN(d.getTime())) {
      return formatFromDateObj(d);
    }
  }

  return formatFromDateObj(new Date());
}

export function getStoredStickyNotes(): DailyJournalStickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JURNAL_BERINGIN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((n: DailyJournalStickyNote) => ({
          ...n,
          date: formatTanggalBulanTahun(n.date, n.timestamp),
        }));
      }
    }
  } catch (e) {}
  const normalizedInit = INITIAL_STICKY_NOTES.map((n) => ({
    ...n,
    date: formatTanggalBulanTahun(n.date, n.timestamp),
  }));
  try {
    localStorage.setItem(STORAGE_KEY_JURNAL_BERINGIN, JSON.stringify(normalizedInit));
  } catch (e) {}
  return normalizedInit;
}

export function saveStoredStickyNotes(notes: DailyJournalStickyNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_JURNAL_BERINGIN, JSON.stringify(notes));
  } catch (e) {}
}

export function mergeStickyNotesList(
  listA: DailyJournalStickyNote[],
  listB: DailyJournalStickyNote[]
): DailyJournalStickyNote[] {
  const map = new Map<string, DailyJournalStickyNote>();
  const addOrMerge = (n: DailyJournalStickyNote) => {
    if (!n || !n.id) return;
    const cleanDate = formatTanggalBulanTahun(n.date, n.timestamp);
    const existing = map.get(n.id);
    if (!existing) {
      map.set(n.id, {
        ...n,
        date: cleanDate,
        likes: typeof n.likes === 'number' ? n.likes : 0,
        likedBy: Array.isArray(n.likedBy) ? n.likedBy : [],
        likedByNames: Array.isArray(n.likedByNames) ? n.likedByNames : [],
      });
    } else {
      const mergedLikedBy = Array.from(
        new Set([...(existing.likedBy || []), ...(n.likedBy || [])])
      );
      const mergedLikedNames = Array.from(
        new Set([...(existing.likedByNames || []), ...(n.likedByNames || [])])
      );
      const maxLikes = Math.max(
        existing.likes || 0,
        n.likes || 0,
        mergedLikedBy.length
      );
      map.set(n.id, {
        ...existing,
        ...n,
        date: formatTanggalBulanTahun(
          n.date && n.date !== 'Hari ini' ? n.date : existing.date,
          n.timestamp || existing.timestamp
        ),
        likes: maxLikes,
        likedBy: mergedLikedBy,
        likedByNames: mergedLikedNames,
      });
    }
  };
  listA.forEach(addOrMerge);
  listB.forEach(addOrMerge);
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/**
 * Menyimpan Sticky Note Pohon Beringin ke Google Spreadsheet melalui Google Apps Script.
 * Mendukung 3 jalur sekaligus:
 * 1. Sheet khusus 'Jurnal_Pohon_Beringin' (action: 'save_sticky_note') jika skrip GAS terbaru digunakan
 * 2. Sheet 'Data_Refleksi_Siswa' / 'Refleksi_Siswa' (action: 'submit_reflection') agar kompatibel 100% dengan skrip GAS v2.0 yang sudah dideploy tanpa perlu update skrip
 */
export async function syncStickyNoteToSpreadsheet(note: DailyJournalStickyNote): Promise<void> {
  try {
    // 1. Kirim action khusus save_sticky_note untuk tabel Jurnal_Pohon_Beringin
    storage.syncWithGAS('save_sticky_note', { note });

    // 2. Kirim juga ke submit_reflection dengan penanda [JURNAL_POHON_BERINGIN] agar otomatis tersimpan & terbaca di Spreadsheet v2.0 yang sudah ada!
    const validColors = ['yellow', 'pink', 'blue', 'green', 'purple'];
    const safeColor = validColors.includes(note.color) ? note.color : 'yellow';

    const reflectionPayload: Reflection = {
      id: note.id.startsWith('sticky-') ? note.id : `sticky-${note.id}`,
      studentId: note.studentId || 'std-anon',
      studentName: note.studentName || 'Warga Refleksia',
      studentNumber: safeColor,
      className: note.className || 'X DKV 2',
      materiId: 'pohon_beringin',
      materiTitle: `[JURNAL_POHON_BERINGIN]`,
      scale: Math.max(1, note.likes || 1),
      moodEmoji: note.mood || '😊',
      answers: {
        understood: note.content,
        difficult: JSON.stringify(note.likedBy || []),
        findings: JSON.stringify(note.likedByNames || []),
        actionPlan: String(note.likes || 0),
        customAnswers: {
          color: safeColor,
          timestamp: String(note.timestamp || Date.now()),
          date: note.date,
        },
      },
      createdAt: note.date || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    await storage.syncWithGAS('submit_reflection', {
      reflection: reflectionPayload,
      feedback: {
        id: `fb-${reflectionPayload.id}`,
        reflectionId: reflectionPayload.id,
        apresiasi: `Sticky Note Pohon Beringin (${safeColor})`,
        sudah_dikuasai: [safeColor, String(note.timestamp || Date.now())],
        perlu_diperkuat: note.likedBy || [],
        saran: note.likedByNames || [],
        pertanyaan_pemantik: note.mood || '😊',
        rencana_belajar: [String(note.likes || 0)],
        perlu_perhatian_guru: false,
      },
    });
  } catch (err) {
    console.warn('Gagal menyinkronkan sticky note ke Spreadsheet:', err);
  }
}

/**
 * Menyinkronkan Like Sticky Note ke Google Spreadsheet
 */
export async function syncStickyNoteLikeToSpreadsheet(note: DailyJournalStickyNote): Promise<void> {
  try {
    storage.syncWithGAS('like_sticky_note', {
      noteId: note.id,
      likes: note.likes || 0,
      likedBy: note.likedBy || [],
      likedByNames: note.likedByNames || [],
    });
    // Juga kirim update baris refleksi agar skrip v2.0 mencatat jumlah like terbaru
    await syncStickyNoteToSpreadsheet(note);
  } catch (err) {
    // safe fallback
  }
}

/**
 * Mengambil seluruh Sticky Note Pohon Beringin dari Google Spreadsheet + Server API + LocalStorage
 */
export async function fetchStickyNotesFromAllSources(): Promise<{
  notes: DailyJournalStickyNote[];
  fromSpreadsheet: boolean;
  spreadsheetName?: string;
}> {
  let currentNotes = getStoredStickyNotes();
  let fromSpreadsheet = false;
  let spreadsheetName = 'Google Spreadsheet';

  // 1. Ambil dari Server API (/api/journals/sticky-notes)
  try {
    const res = await fetch('/api/journals/sticky-notes');
    if (res.ok) {
      const json = await res.json();
      const serverList = Array.isArray(json) ? json : (json?.data || []);
      if (Array.isArray(serverList) && serverList.length > 0) {
        currentNotes = mergeStickyNotesList(currentNotes, serverList);
      }
    }
  } catch {}

  // 2. Ambil langsung dari Google Spreadsheet (Google Apps Script Web App)
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
        if (resData.spreadsheet) {
          spreadsheetName = resData.spreadsheet;
        }

        const sheetStickyList: DailyJournalStickyNote[] = [];

        // A. Jika skrip GAS mengembalikan array stickyNotes secara langsung
        if (Array.isArray(resData.stickyNotes)) {
          resData.stickyNotes.forEach((sn: any) => {
            if (sn && sn.id && sn.content) {
              sheetStickyList.push({
                id: String(sn.id),
                studentId: String(sn.studentId || 'std-sheet'),
                studentName: String(sn.studentName || 'Warga Refleksia'),
                className: String(sn.className || 'X DKV 2'),
                content: String(sn.content),
                mood: String(sn.mood || '😊'),
                color: ['yellow', 'pink', 'blue', 'green', 'purple'].includes(sn.color) ? sn.color : 'yellow',
                date: String(sn.date || 'Hari ini'),
                timestamp: Number(sn.timestamp) || Date.now(),
                likes: Number(sn.likes) || 0,
                likedBy: Array.isArray(sn.likedBy) ? sn.likedBy : [],
                likedByNames: Array.isArray(sn.likedByNames) ? sn.likedByNames : [],
              });
            }
          });
        }

        // B. Ekstrak dari resData.reflections yang bertanda [JURNAL_POHON_BERINGIN] atau id 'sticky-*'
        if (Array.isArray(resData.reflections)) {
          resData.reflections.forEach((r: Reflection, idx: number) => {
            const isSticky =
              (r.id && String(r.id).startsWith('sticky-')) ||
              (r.materiTitle && String(r.materiTitle).includes('JURNAL_POHON_BERINGIN')) ||
              r.materiId === 'pohon_beringin';

            if (isSticky && r.answers?.understood) {
              const rawColor =
                (r.answers?.customAnswers && r.answers.customAnswers['color']) ||
                r.studentNumber ||
                'yellow';
              const validColor = (['yellow', 'pink', 'blue', 'green', 'purple'].includes(String(rawColor))
                ? rawColor
                : 'yellow') as 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

              let parsedLikedBy: string[] = [];
              let parsedLikedNames: string[] = [];
              try {
                if (r.answers.difficult && r.answers.difficult.startsWith('[')) {
                  parsedLikedBy = JSON.parse(r.answers.difficult);
                }
              } catch {}
              try {
                if (r.answers.findings && r.answers.findings.startsWith('[')) {
                  parsedLikedNames = JSON.parse(r.answers.findings);
                }
              } catch {}

              const parsedLikes = Math.max(
                parsedLikedBy.length,
                Number(r.answers.actionPlan) || 0,
                (Number(r.scale) || 1) > 1 ? Number(r.scale) : 0
              );

              const rawTs =
                r.answers?.customAnswers && r.answers.customAnswers['timestamp']
                  ? Number(r.answers.customAnswers['timestamp'])
                  : Date.now() - idx * 60000;

              sheetStickyList.push({
                id: String(r.id),
                studentId: String(r.studentId || 'std-sheet'),
                studentName: String(r.studentName || 'Warga Refleksia'),
                className: String(r.className || 'X DKV 2'),
                content: String(r.answers.understood),
                mood: String(r.moodEmoji || '😊'),
                color: validColor,
                date: String(r.createdAt || 'Hari ini'),
                timestamp: isNaN(rawTs) ? Date.now() : rawTs,
                likes: parsedLikes,
                likedBy: Array.isArray(parsedLikedBy) ? parsedLikedBy : [],
                likedByNames: Array.isArray(parsedLikedNames) ? parsedLikedNames : [],
              });
            }
          });
        }

        if (sheetStickyList.length > 0) {
          currentNotes = mergeStickyNotesList(currentNotes, sheetStickyList);
        }
      }
    } catch (err) {
      // Safe fallback if offline
    }
  }

  saveStoredStickyNotes(currentNotes);
  return {
    notes: currentNotes,
    fromSpreadsheet,
    spreadsheetName,
  };
}

const COLOR_MAP = {
  yellow: {
    bg: 'bg-amber-100 text-amber-950 border-amber-300',
    tag: 'bg-amber-200/80 text-amber-900 border-amber-400/50',
    shadow: 'shadow-amber-900/20',
    label: 'Kuning Hangat',
  },
  pink: {
    bg: 'bg-pink-100 text-pink-950 border-pink-300',
    tag: 'bg-pink-200/80 text-pink-900 border-pink-400/50',
    shadow: 'shadow-pink-900/20',
    label: 'Pink Ceria',
  },
  blue: {
    bg: 'bg-sky-100 text-sky-950 border-sky-300',
    tag: 'bg-sky-200/80 text-sky-900 border-sky-400/50',
    shadow: 'shadow-sky-900/20',
    label: 'Biru Langit',
  },
  green: {
    bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    tag: 'bg-emerald-200/80 text-emerald-900 border-emerald-400/50',
    shadow: 'shadow-emerald-900/20',
    label: 'Hijau Mint',
  },
  purple: {
    bg: 'bg-purple-100 text-purple-950 border-purple-300',
    tag: 'bg-purple-200/80 text-purple-900 border-purple-400/50',
    shadow: 'shadow-purple-900/20',
    label: 'Ungu Lavender',
  },
};

const MOOD_OPTIONS = [
  { emoji: '😊', label: 'Semangat' },
  { emoji: '💡', label: 'Paham' },
  { emoji: '🚀', label: 'Tertantang' },
  { emoji: '🎨', label: 'Kreatif' },
  { emoji: '🌿', label: 'Tenang' },
  { emoji: '🎯', label: 'Fokus' },
];

export const JurnalHarianModal: React.FC<JurnalHarianModalProps> = ({
  onClose,
  student,
  onAddXp,
  onNoteAdded,
}) => {
  const currentCitizenId = student?.id || 'warga-lokal';
  const currentCitizenName = student?.name || 'Warga Refleksia';

  const [notes, setNotes] = useState<DailyJournalStickyNote[]>(() => getStoredStickyNotes());
  // Default to board so citizen immediately reads all other citizens' journals!
  const [activeTab, setActiveTab] = useState<'board' | 'write'>('board');
  const [filterClass, setFilterClass] = useState<'all' | 'mine' | 'dkv2' | 'dkv3' | 'guru'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [content, setContent] = useState('');
  const [mood, setMood] = useState('😊');
  const [color, setColor] = useState<'yellow' | 'pink' | 'blue' | 'green' | 'purple'>('yellow');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncingSpreadsheet, setIsSyncingSpreadsheet] = useState(false);
  const [spreadsheetConnected, setSpreadsheetConnected] = useState(true);
  const [spreadsheetName, setSpreadsheetName] = useState('Database Kota Refleksi');

  // Per-citizen liked note IDs stored in localStorage so switching accounts on the same browser works independently
  const [likedNoteIds, setLikedNoteIds] = useState<string[]>(() => {
    try {
      const byUserRaw = localStorage.getItem(STORAGE_KEY_JURNAL_LIKES_BY_USER);
      if (byUserRaw) {
        const parsedMap = JSON.parse(byUserRaw);
        if (parsedMap && Array.isArray(parsedMap[currentCitizenId])) {
          return parsedMap[currentCitizenId];
        }
      }
      const savedLegacy = localStorage.getItem('kota_jurnal_likes');
      return savedLegacy ? JSON.parse(savedLegacy) : [];
    } catch {
      return [];
    }
  });

  const handleManualSyncSpreadsheet = async () => {
    if (isSyncingSpreadsheet) return;
    sounds.playClick();
    setIsSyncingSpreadsheet(true);
    try {
      const result = await fetchStickyNotesFromAllSources();
      setNotes(result.notes);
      if (result.fromSpreadsheet) {
        setSpreadsheetConnected(true);
        if (result.spreadsheetName) setSpreadsheetName(result.spreadsheetName);
      }
      window.dispatchEvent(new CustomEvent('kota_refleksi_sticky_notes_updated', { detail: result.notes }));
    } catch {}
    setIsSyncingSpreadsheet(false);
  };

  // Synchronize sticky notes from Google Spreadsheet, Server & localStorage across all citizens, tabs & devices
  useEffect(() => {
    let isMounted = true;
    const syncNotesFromAllSources = async () => {
      const local = getStoredStickyNotes();
      if (isMounted) {
        setNotes(local);
      }
      try {
        const result = await fetchStickyNotesFromAllSources();
        if (isMounted) {
          setNotes(result.notes);
          if (result.fromSpreadsheet) {
            setSpreadsheetConnected(true);
            if (result.spreadsheetName) setSpreadsheetName(result.spreadsheetName);
          }
        }
      } catch (err) {
        // Offline / localStorage-only mode works seamlessly
      }
    };

    syncNotesFromAllSources();

    // Auto-poll Google Spreadsheet every 8 seconds while modal is open so notes from other devices appear live
    const pollInterval = window.setInterval(() => {
      if (isMounted) {
        syncNotesFromAllSources();
      }
    }, 8000);

    // Listen to localStorage changes from other tabs/windows
    const handleNativeStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY_JURNAL_BERINGIN && e.newValue && isMounted) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setNotes(parsed);
        } catch {}
      }
    };

    // Listen to custom window events within the same tab
    const handleCustomUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && isMounted) {
        setNotes(e.detail);
      } else if (isMounted) {
        setNotes(getStoredStickyNotes());
      }
    };

    window.addEventListener('storage', handleNativeStorage);
    window.addEventListener('kota_refleksi_sticky_notes_updated', handleCustomUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('kota_refleksi_channel');
      bc.onmessage = (event) => {
        if (
          event.data?.type === 'sticky_note_added' ||
          event.data?.type === 'STICKY_NOTE_ADDED' ||
          event.data?.type === 'sticky_notes_updated' ||
          event.data?.type === 'sticky_note_liked'
        ) {
          if (Array.isArray(event.data?.notes) && isMounted) {
            const merged = mergeStickyNotesList(getStoredStickyNotes(), event.data.notes);
            saveStoredStickyNotes(merged);
            setNotes(merged);
          } else {
            syncNotesFromAllSources();
          }
        }
      };
    }

    return () => {
      isMounted = false;
      window.clearInterval(pollInterval);
      window.removeEventListener('storage', handleNativeStorage);
      window.removeEventListener('kota_refleksi_sticky_notes_updated', handleCustomUpdate);
      if (bc) bc.close();
    };
  }, []);

  // Filtered notes based on filterClass and search query
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // 1. Class / Mine filter
      if (filterClass === 'mine') {
        const isMine =
          (student?.id && n.studentId === student.id) ||
          (student?.name && n.studentName.toLowerCase() === student.name.toLowerCase());
        if (!isMine) return false;
      } else if (filterClass === 'dkv2') {
        if (!n.className?.includes('DKV 2') && !n.className?.includes('2')) return false;
      } else if (filterClass === 'dkv3') {
        if (!n.className?.includes('DKV 3') && !n.className?.includes('3')) return false;
      } else if (filterClass === 'guru') {
        if (!n.className?.toLowerCase().includes('guru') && !n.className?.toLowerCase().includes('pengawas')) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = n.studentName.toLowerCase().includes(q);
        const matchesContent = n.content.toLowerCase().includes(q);
        const matchesClass = n.className?.toLowerCase().includes(q);
        return matchesName || matchesContent || matchesClass;
      }

      return true;
    });
  }, [notes, filterClass, searchQuery, student?.id, student?.name]);

  const myNotesCount = notes.filter(
    (n) =>
      (student?.id && n.studentId === student.id) ||
      (student?.name && n.studentName.toLowerCase() === student.name.toLowerCase())
  ).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const studentName = student?.name || 'Siswa DKV';
    const studentId = student?.id || `std-${Date.now()}`;
    const className = student?.className || (student?.isTeacher ? 'Guru Pembimbing' : 'X DKV 2');

    const todayStr = formatTanggalBulanTahun(undefined, Date.now());

    const newNote: DailyJournalStickyNote = {
      id: `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId,
      studentName,
      className,
      content: content.trim(),
      mood,
      color,
      date: todayStr,
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      likedByNames: [],
    };

    const currentLocal = getStoredStickyNotes();
    const nextNotes = [newNote, ...currentLocal.filter((n) => n.id !== newNote.id)];
    setNotes(nextNotes);
    saveStoredStickyNotes(nextNotes);

    // Call callbacks
    if (onNoteAdded) onNoteAdded(newNote);

    // 1. Simpan langsung ke Google Spreadsheet supaya bisa dilihat seluruh warga di semua perangkat!
    syncStickyNoteToSpreadsheet(newNote);

    // 2. Sync to backend server
    try {
      await fetch('/api/journals/sticky-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (e) {
      // offline fallback
    }

    // 3. Broadcast update across all tabs & components
    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_sticky_notes_updated', { detail: nextNotes }));
      window.dispatchEvent(new CustomEvent('sticky_note_added', { detail: newNote }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('kota_refleksi_channel');
        bc.postMessage({ type: 'STICKY_NOTE_ADDED', note: newNote, notes: nextNotes });
        bc.close();
      }
    } catch (e) {}

    // Award +1 XP
    if (onAddXp) {
      onAddXp(1, 'Menulis Jurnal Harian di Pohon Beringin');
    }

    sounds.playRewardXp();

    try {
      confetti({
        particleCount: 40,
        spread: 65,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setIsSuccess(true);
    setIsSubmitting(false);

    setTimeout(() => {
      setIsSuccess(false);
      setContent('');
      setActiveTab('board');
    }, 1000);
  };

  const handleToggleLike = async (noteId: string) => {
    sounds.playClick();
    const targetNote = notes.find((n) => n.id === noteId);
    const alreadyInNoteLikedBy = Boolean(targetNote?.likedBy?.includes(currentCitizenId));
    const isAlreadyLiked = likedNoteIds.includes(noteId) || alreadyInNoteLikedBy;

    const nextLiked = isAlreadyLiked
      ? likedNoteIds.filter((id) => id !== noteId)
      : Array.from(new Set([...likedNoteIds, noteId]));

    setLikedNoteIds(nextLiked);
    try {
      localStorage.setItem('kota_jurnal_likes', JSON.stringify(nextLiked));
      const rawMap = localStorage.getItem(STORAGE_KEY_JURNAL_LIKES_BY_USER);
      const parsedMap = rawMap ? JSON.parse(rawMap) : {};
      parsedMap[currentCitizenId] = nextLiked;
      localStorage.setItem(STORAGE_KEY_JURNAL_LIKES_BY_USER, JSON.stringify(parsedMap));
    } catch {}

    let updatedSingleNote: DailyJournalStickyNote | null = null;

    const nextNotes = notes.map((n) => {
      if (n.id === noteId) {
        const curLikes = n.likes || 0;
        const prevLikedBy = Array.isArray(n.likedBy) ? n.likedBy : [];
        const prevLikedNames = Array.isArray(n.likedByNames) ? n.likedByNames : [];

        const updatedLikedBy = isAlreadyLiked
          ? prevLikedBy.filter((id) => id !== currentCitizenId)
          : Array.from(new Set([...prevLikedBy, currentCitizenId]));

        const updatedLikedNames = isAlreadyLiked
          ? prevLikedNames.filter((nm) => nm !== currentCitizenName)
          : Array.from(new Set([...prevLikedNames, currentCitizenName]));

        const updatedLikes = Math.max(
          updatedLikedBy.length,
          Math.max(0, curLikes + (isAlreadyLiked ? -1 : 1))
        );

        updatedSingleNote = {
          ...n,
          likes: updatedLikes,
          likedBy: updatedLikedBy,
          likedByNames: updatedLikedNames,
        };
        return updatedSingleNote;
      }
      return n;
    });

    setNotes(nextNotes);
    saveStoredStickyNotes(nextNotes);

    // Simpan perubahan Like ke Google Spreadsheet agar terbaca warga lain
    if (updatedSingleNote) {
      syncStickyNoteLikeToSpreadsheet(updatedSingleNote);
    }

    // Broadcast updated likes to localStorage listeners & other tabs
    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_sticky_notes_updated', { detail: nextNotes }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('kota_refleksi_channel');
        bc.postMessage({ type: 'sticky_note_liked', noteId, notes: nextNotes });
        bc.close();
      }
    } catch {}

    try {
      fetch('/api/journals/sticky-notes/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId,
          increment: !isAlreadyLiked,
          studentId: currentCitizenId,
          studentName: currentCitizenName,
        }),
      }).catch(() => {});
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-dark rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl border border-emerald-500/30 relative max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🌳
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Tersimpan di Google Spreadsheet & LocalStorage</span>
                </span>
                <span className="text-[11px] text-amber-300 font-extrabold flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> +1 XP Tiap Catatan
                </span>
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit'] flex items-center gap-2 mt-0.5">
                <span>Jurnal Harian Pohon Beringin</span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSyncSpreadsheet}
              disabled={isSyncingSpreadsheet}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Muat ulang catatan warga dari Google Spreadsheet"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingSpreadsheet ? 'animate-spin text-emerald-300' : ''}`} />
              <span className="hidden sm:inline">{isSyncingSpreadsheet ? 'Sinkronisasi...' : 'Sinkron Spreadsheet'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher: Papan Catatan Warga (Default) vs Tulis Catatan Baru */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('board');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>🌳 Baca Catatan Warga ({notes.length})</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('write');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'write'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Pin className="w-3.5 h-3.5" />
              <span>✍️ Tulis Jurnal Harian (+1 XP)</span>
            </button>
          </div>

          {activeTab === 'board' && (
            <button
              onClick={() => {
                sounds.playClick();
                setActiveTab('write');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
            >
              <Pin className="w-3.5 h-3.5" />
              <span>Tempel Catatanmu</span>
            </button>
          )}
        </div>

        {/* Tab 1: Papan Sticky Notes Seluruh Warga (Semua catatan warga terbaca jelas!) */}
        {activeTab === 'board' && (
          <div className="mt-4 flex-1 space-y-4">
            {/* Filter pills & search bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-white/10">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                <button
                  onClick={() => setFilterClass('all')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterClass === 'all'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Semua Warga ({notes.length})
                </button>
                <button
                  onClick={() => setFilterClass('dkv2')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterClass === 'dkv2'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  X DKV 2
                </button>
                <button
                  onClick={() => setFilterClass('dkv3')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterClass === 'dkv3'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  X DKV 3
                </button>
                <button
                  onClick={() => setFilterClass('guru')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterClass === 'guru'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Guru & Pengawas
                </button>
                <button
                  onClick={() => setFilterClass('mine')}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    filterClass === 'mine'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  Catatan Saya ({myNotesCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa atau isi refleksi..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            {/* Tree Corkboard Display */}
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-[#24130b] via-[#1a0d07] to-[#100703] border-2 border-amber-900/60 shadow-[inset_0_6px_28px_rgba(0,0,0,0.85)] relative min-h-[420px]">
              {/* Header inside tree plank */}
              <div className="flex items-center justify-between px-3.5 py-2 mb-4 rounded-xl bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-amber-950/90 border border-amber-600/30 shadow-inner">
                <span className="text-[10.5px] font-extrabold tracking-widest uppercase text-amber-300 flex items-center gap-2">
                  <span>🌳 BATANG POHON BERINGIN • CATATAN REFLEKSI SELURUH WARGA KOTA</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-200">
                  {filteredNotes.length} TAMPIL
                </span>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs space-y-3">
                  <p className="text-4xl">🍃</p>
                  <p className="font-bold text-slate-200 text-sm">
                    {searchQuery ? 'Tidak ada catatan yang sesuai dengan kata kunci.' : 'Belum ada catatan yang tersimpan di kategori ini.'}
                  </p>
                  <button
                    onClick={() => {
                      setFilterClass('all');
                      setSearchQuery('');
                      setActiveTab('write');
                    }}
                    className="mt-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95"
                  >
                    Tulis Catatan Harian Sekarang (+1 XP)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                  {filteredNotes.map((note, idx) => {
                    const cObj = COLOR_MAP[note.color] || COLOR_MAP.yellow;
                    const isLiked =
                      likedNoteIds.includes(note.id) ||
                      Boolean(note.likedBy?.includes(currentCitizenId));
                    const isMyOwn =
                      (student?.id && note.studentId === student.id) ||
                      (student?.name && note.studentName.toLowerCase() === student.name.toLowerCase());
                    const rotations = ['rotate-[-1.2deg]', 'rotate-[1.2deg]', 'rotate-[-0.8deg]', 'rotate-[1.5deg]', 'rotate-[-1.5deg]'];
                    const rot = rotations[idx % rotations.length];
                    const likedNames = Array.isArray(note.likedByNames) ? note.likedByNames : [];

                    return (
                      <div
                        key={note.id}
                        className={`p-4 rounded-2xl border-2 ${cObj.bg} ${cObj.shadow} shadow-lg transition-all hover:scale-102 hover:shadow-2xl hover:z-20 relative flex flex-col justify-between ${rot}`}
                      >
                        {/* Pin top center */}
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 border border-white/80 shadow-md flex items-center justify-center text-[10px] text-white">
                          📌
                        </div>

                        <div>
                          {/* Note Header: Author Name & Class clearly visible! */}
                          <div className="flex items-start justify-between border-b border-black/15 pb-2 mb-2.5 gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${cObj.tag}`}>
                                  {note.className || 'Siswa DKV'}
                                </span>
                                {isMyOwn && (
                                  <span className="text-[9px] font-black uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded shadow-xs">
                                    Catatan Kamu
                                  </span>
                                )}
                              </div>
                              <h4 className="text-xs sm:text-[13px] font-black text-slate-950 mt-1 leading-snug">
                                {note.studentName}
                              </h4>
                            </div>
                            <span className="text-2xl shrink-0 drop-shadow-sm p-1 rounded-xl bg-black/5" title={`Mood: ${note.mood}`}>
                              {note.mood}
                            </span>
                          </div>

                          {/* Note Reflection Content */}
                          <p className="text-xs sm:text-[12.5px] leading-relaxed font-medium text-slate-900 whitespace-pre-wrap break-words min-h-[48px]">
                            "{note.content}"
                          </p>
                        </div>

                        {/* Note Footer Bagian Bawah: Hanya Tanggal Bulan Tahun & Tombol Suka */}
                        <div className="mt-3.5 pt-2 border-t border-black/15 flex items-center justify-between text-[10.5px]">
                          <span className="opacity-80 font-semibold flex items-center gap-1 text-slate-900">
                            <Calendar className="w-3 h-3 opacity-65 shrink-0" />
                            <span>{formatTanggalBulanTahun(note.date, note.timestamp)}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleLike(note.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold transition active:scale-95 cursor-pointer shadow-xs ${
                              isLiked
                                ? 'bg-rose-500 text-white shadow-rose-500/30'
                                : 'bg-black/10 hover:bg-rose-500/20 text-slate-900'
                            }`}
                            title={
                              likedNames.length > 0
                                ? `Disukai oleh: ${likedNames.join(', ')}`
                                : isLiked
                                ? 'Batalkan suka'
                                : 'Sukai catatan warga ini'
                            }
                          >
                            <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-white animate-bounce' : 'text-rose-600'}`} />
                            <span className="text-[11px] font-mono">
                              {note.likes || 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Form Tulis Sticky Note Baru */}
        {activeTab === 'write' && (
          <div className="mt-4 space-y-4">
            {isSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-white">Sticky Note Berhasil Ditempelkan!</h4>
                  <p className="text-xs text-emerald-300">
                    Catatanmu kini langsung dapat dibaca oleh seluruh warga kota & kamu meraih <strong className="text-amber-300">+1 XP</strong>!
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Input */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>Catatan Refleksi Singkat Harian</span>
                    <span className="text-[11px] text-slate-400 font-normal">{content.length}/180 karakter</span>
                  </label>
                  <textarea
                    rows={4}
                    maxLength={180}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Tuliskan pengalaman belajar, hal berkesan, atau komitmen karyamu hari ini..."
                    className="w-full p-3 rounded-2xl bg-slate-900 border border-white/20 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none leading-relaxed"
                  />
                </div>

                {/* Mood Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Perasaan / Suasana Hati Hari Ini
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {MOOD_OPTIONS.map((m) => (
                      <button
                        key={m.emoji}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setMood(m.emoji);
                        }}
                        className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                          mood === m.emoji
                            ? 'bg-emerald-600/30 border-emerald-400 text-white shadow-inner scale-102'
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        <span className="text-xl">{m.emoji}</span>
                        <span className="text-[10px] font-semibold">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Pilihan Warna Kertas Sticky Note
                  </label>
                  <div className="flex items-center gap-2">
                    {(['yellow', 'pink', 'blue', 'green', 'purple'] as const).map((cKey) => {
                      const cObj = COLOR_MAP[cKey];
                      return (
                        <button
                          key={cKey}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setColor(cKey);
                          }}
                          className={`w-9 h-9 rounded-xl border-2 flex items-center justify-center transition-transform cursor-pointer ${cObj.bg} ${
                            color === cKey ? 'scale-110 shadow-lg ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={cObj.label}
                        >
                          {color === cKey && <span className="text-xs font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    className="w-full py-3 px-5 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-700/30 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Menempelkan...' : 'Tempelkan Sticky Note di Pohon Beringin (+1 XP)'}</span>
                  </button>
                </div>
              </form>

              {/* Realtime Live Preview on Tree Bark */}
              <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-b from-[#25150d] via-[#1a0e08] to-[#110905] border-2 border-amber-900/60 shadow-[inset_0_4px_24px_rgba(0,0,0,0.85)] relative min-h-[260px] overflow-hidden">
                <div className="text-[10.5px] uppercase tracking-widest font-extrabold text-amber-400/90 mb-3 flex items-center gap-1.5">
                  <span>🌳 Pratinjau Tampilan di Batang Pohon</span>
                </div>

                {/* Sticky Note Box */}
                <div
                  className={`w-full max-w-[270px] p-4 rounded-2xl border-2 ${COLOR_MAP[color].bg} ${COLOR_MAP[color].shadow} shadow-2xl transition-all transform rotate-[-1.5deg] relative`}
                >
                  {/* Push Pin */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 shadow-md border-2 border-white/60 flex items-center justify-center text-[10px] text-white">
                    📍
                  </div>

                  <div className="flex items-center justify-between border-b border-black/15 pb-2 mb-2">
                    <div className="min-w-0 pr-1">
                      <div className="text-[9px] font-extrabold uppercase tracking-wider opacity-75 truncate">
                        {student?.className || 'X DKV 2'}
                      </div>
                      <div className="text-xs font-black truncate text-slate-950">
                        {student?.name || 'Siswa DKV'}
                      </div>
                    </div>
                    <span className="text-2xl shrink-0 drop-shadow-sm">{mood}</span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium min-h-[60px] whitespace-pre-wrap break-words text-slate-900">
                    {content.trim() || 'Tuliskan catatan harianmu di formulir sebelah kiri untuk melihat pratinjau di sini...'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-black/15 flex items-center justify-between text-[10.5px] opacity-80 font-semibold text-slate-900">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 opacity-65 shrink-0" />
                      <span>{formatTanggalBulanTahun(undefined, Date.now())}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
