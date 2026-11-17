import React, { useState, useEffect } from 'react';
import { X, BookOpen, Send, Sparkles, CheckCircle2, History, FileText, ArrowRight, Video, ChevronLeft, HelpCircle, Layers, Users, User, Search, Filter } from 'lucide-react';
import { Materi, ReflectionEntry, Student } from '../../types/index.ts';
import { INITIAL_MATERI } from '../../data/initialData.ts';
import { LIBRARY_4F_ARCHIVE_SEEDS } from '../../data/archiveSeeds.ts';
import { sounds } from '../../utils/audio.ts';

interface PerpustakaanModalProps {
  onClose: () => void;
  materis?: Materi[];
  onNavigateBuilding?: (id: any) => void;
  onSelectMateriForReflection?: (mId: any) => void;
  onAddXp?: (amount: number, reason: string) => void;
  reflections?: ReflectionEntry[];
  onSaveReflection?: (entry: ReflectionEntry) => void;
  student?: Student | null;
}

const BOOK_SHELF_THEMES = [
  {
    num: '01',
    shortLabel: 'Model IPO & Von Neumann',
    tag: 'Arsitektur Komputer',
    spineGrad: 'from-emerald-700 via-emerald-800 to-teal-950',
    border: 'border-emerald-400/50',
    accent: 'text-emerald-300',
    badgeBg: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40',
    ribbon: 'bg-amber-400',
    icon: '🖥️',
    keyPoints: [
      'Input: Bahan mentah/instruksi awal (keyboard, mouse, pen tablet, kamera, brief klien).',
      'Process (CPU) & RAM: CPU mengolah instruksi; RAM menjadi meja kerja sementara untuk menampung layer & aplikasi aktif.',
      'Output: Hasil akhir pengolahan data (tampilan monitor, file cetak PDF CMYK, poster digital RGB).',
    ],
  },
  {
    num: '02',
    shortLabel: 'Sistem Operasi & Penjadwalan',
    tag: 'Manajemen Proses',
    spineGrad: 'from-blue-700 via-indigo-800 to-slate-950',
    border: 'border-sky-400/50',
    accent: 'text-sky-300',
    badgeBg: 'bg-sky-500/20 text-sky-200 border-sky-400/40',
    ribbon: 'bg-sky-400',
    icon: '⚙️',
    keyPoints: [
      'Sistem Operasi (OS) mengatur giliran pemakaian CPU, RAM, GPU, dan printer agar tidak bentrok (Deadlock).',
      'FIFO (First In First Out): Antrean pertama dilayani lebih dulu sampai tuntas.',
      'SJF (Shortest Job First): Pekerjaan dengan durasi paling cepat diselesaikan lebih dulu agar antrean tidak macet.',
    ],
  },
  {
    num: '03',
    shortLabel: 'Komputasi Data & Riset DKV',
    tag: 'Data-Driven Design',
    spineGrad: 'from-amber-600 via-orange-800 to-stone-950',
    border: 'border-amber-400/50',
    accent: 'text-amber-300',
    badgeBg: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
    ribbon: 'bg-emerald-400',
    icon: '📊',
    keyPoints: [
      'Data-Driven Design: Merancang karya visual berdasarkan riset data audiens, bukan sekadar tebakan.',
      '4 Tahap Komputasi Data: Pengumpulan (Survei) → Data Cleaning (Bersihkan data rusak/kosong) → Pengolahan (Tally) → Visualisasi Grafik.',
      'Diagram batang & lingkaran memudahkan klien memahami hasil riset pasar dengan cepat.',
    ],
  },
  {
    num: '04',
    shortLabel: 'Struktur Data & Algoritma',
    tag: 'Array, Stack, Queue',
    spineGrad: 'from-purple-700 via-violet-800 to-fuchsia-950',
    border: 'border-purple-400/50',
    accent: 'text-purple-300',
    badgeBg: 'bg-purple-500/20 text-purple-200 border-purple-400/40',
    ribbon: 'bg-pink-400',
    icon: '🧩',
    keyPoints: [
      'Array: Daftar terindeks berurutan (0, 1, 2, dst.) seperti deretan Color Swatches.',
      'Stack (LIFO - Last In First Out): Data terakhir masuk keluar pertama, digunakan pada fitur Undo (Ctrl+Z) & Layer.',
      'Queue (FIFO - First In First Out) & 3 Pola Algoritma: Sequential (runtut), Branching (IF-ELSE), Looping (perulangan).',
    ],
  },
  {
    num: '05',
    shortLabel: 'Sorting & Searching Aset',
    tag: 'Efisiensi Algoritma',
    spineGrad: 'from-rose-700 via-red-800 to-rose-950',
    border: 'border-rose-400/50',
    accent: 'text-rose-300',
    badgeBg: 'bg-rose-500/20 text-rose-200 border-rose-400/40',
    ribbon: 'bg-yellow-400',
    icon: '🔍',
    keyPoints: [
      'Linear Search: Mencari satu per satu dari awal hingga akhir (bisa untuk data acak, namun lambat pada ribuan aset).',
      'Binary Search: Membelah dua data secara berulang di titik tengah (sangat cepat: 1.024 file hanya butuh maks. 10 langkah).',
      'Syarat Mutlak Binary Search: Seluruh data atau folder aset desain WAJIB diurutkan (Sorting) terlebih dahulu.',
    ],
  },
];

const LEGACY_4F_SEED_IDS = new Set([
  'j4f-seed-1',
  'j4f-seed-2',
  'j4f-seed-3',
  'j4f-seed-4',
  'j4f-init-01',
  'j4f-init-02',
]);

function mergeWithLibrary4FSeeds(list: ReflectionEntry[]): ReflectionEntry[] {
  const map = new Map<string, ReflectionEntry>();
  (list || []).forEach((item) => {
    if (item && item.id && !LEGACY_4F_SEED_IDS.has(item.id)) {
      map.set(item.id, item);
    }
  });
  LIBRARY_4F_ARCHIVE_SEEDS.forEach((seed) => {
    if (seed && seed.id && !map.has(seed.id)) {
      map.set(seed.id, seed);
    }
  });
  return Array.from(map.values());
}

export const PerpustakaanModal: React.FC<PerpustakaanModalProps> = ({
  onClose,
  materis = [],
  onNavigateBuilding,
  onSelectMateriForReflection,
  onAddXp,
  reflections = [],
  onSaveReflection,
  student,
}) => {
  // Always ensure the 5 main books have full detailed text content
  const fiveShelfBooks: Materi[] = INITIAL_MATERI.slice(0, 5).map((initBook, idx) => {
    const matched = materis.find((m) => m.id === initBook.id) || materis[idx];
    if (matched && matched.content && matched.content.length >= initBook.content.length) {
      return matched;
    }
    return initBook;
  });

  // Additional modules generated by Teachers in Gedung Bank Materi
  const teacherBankBooks: Materi[] = materis.filter(
    (m) => !INITIAL_MATERI.slice(0, 5).some((init) => init.id === m.id)
  );

  const [activeTab, setActiveTab] = useState<'materi' | 'write' | 'archive'>('materi');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [subject, setSubject] = useState('Informatika (Berpikir Komputasional)');
  const [title, setTitle] = useState('');
  const [facts, setFacts] = useState('');
  const [feelings, setFeelings] = useState('');
  const [findings, setFindings] = useState('');
  const [future, setFuture] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [filterClass, setFilterClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<'all' | 'mine'>('all');

  const [localArchives, setLocalArchives] = useState<ReflectionEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kota_refleksi_jurnal4f');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = mergeWithLibrary4FSeeds(parsed);
          localStorage.setItem('kota_refleksi_jurnal4f', JSON.stringify(merged));
          return merged;
        }
      }
    } catch {}
    return [...LIBRARY_4F_ARCHIVE_SEEDS];
  });

  // Fetch shared 4F journals from server and listen for real-time broadcasts
  useEffect(() => {
    let isMounted = true;
    const fetchSharedJournals = async () => {
      try {
        const res = await fetch('/api/journals/4f');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json?.data || []);
          if (isMounted && Array.isArray(list)) {
            const merged = mergeWithLibrary4FSeeds(list);
            setLocalArchives(merged);
            try {
              localStorage.setItem('kota_refleksi_jurnal4f', JSON.stringify(merged));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Gagal memuat jurnal 4F dari server:', err);
      }
    };

    fetchSharedJournals();

    const handleCustomJournal = (e: Event) => {
      const custom = e as CustomEvent;
      if (custom.detail) {
        setLocalArchives((prev) => {
          const exists = prev.some((j) => j.id === custom.detail.id);
          if (exists) return prev;
          const next = [custom.detail, ...prev];
          try {
            localStorage.setItem('kota_refleksi_jurnal4f', JSON.stringify(next));
          } catch {}
          return next;
        });
      }
    };

    window.addEventListener('journal_4f_added', handleCustomJournal);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('kota_refleksi_channel');
      channel.onmessage = (event) => {
        if (event.data?.type === 'JOURNAL_4F_ADDED' && event.data.entry) {
          setLocalArchives((prev) => {
            const exists = prev.some((j) => j.id === event.data.entry.id);
            if (exists) return prev;
            const next = [event.data.entry, ...prev];
            try {
              localStorage.setItem('kota_refleksi_jurnal4f', JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      };
    } catch {}

    return () => {
      isMounted = false;
      window.removeEventListener('journal_4f_added', handleCustomJournal);
      if (channel) channel.close();
    };
  }, []);

  const combinedReflections = reflections.length > 0 ? reflections : localArchives;

  const selectedBookIndex = fiveShelfBooks.findIndex((b) => b.id === selectedBookId);
  const selectedBook =
    selectedBookIndex >= 0
      ? fiveShelfBooks[selectedBookIndex]
      : materis.find((b) => b.id === selectedBookId) || null;
  const selectedTheme =
    selectedBookIndex >= 0
      ? BOOK_SHELF_THEMES[selectedBookIndex % BOOK_SHELF_THEMES.length]
      : BOOK_SHELF_THEMES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !facts.trim()) return;

    const newEntry: ReflectionEntry = {
      id: `ref-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      studentId: student?.id || 'std-anon',
      studentName: student?.name || 'Warga Refleksia',
      className: student?.className || (student?.isTeacher ? 'Guru DKV' : 'X DKV 2'),
      title: title.trim(),
      subject: subject.trim() || 'Informatika',
      facts: facts.trim(),
      feelings: feelings.trim() || 'Merasa tertantang namun puas setelah berhasil.',
      findings: findings.trim() || 'Memahami pentingnya ketelitian dalam pemecahan masalah.',
      future: future.trim() || 'Akan mendokumentasikan setiap solusi untuk referensi berikutnya.',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      xpEarned: 2,
    };

    const nextArchives = [newEntry, ...localArchives];
    setLocalArchives(nextArchives);
    try {
      localStorage.setItem('kota_refleksi_jurnal4f', JSON.stringify(nextArchives));
    } catch {}

    // Send to backend so all other citizens on any device/session can read it
    try {
      await fetch('/api/journals/4f', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEntry),
      });
    } catch (err) {
      console.warn('Gagal simpan ke endpoint server 4F:', err);
    }

    // Broadcast real-time to other tabs
    try {
      const channel = new BroadcastChannel('kota_refleksi_channel');
      channel.postMessage({ type: 'JOURNAL_4F_ADDED', entry: newEntry });
      channel.close();
    } catch {}
    window.dispatchEvent(new CustomEvent('journal_4f_added', { detail: newEntry }));

    if (onSaveReflection) onSaveReflection(newEntry);
    if (onAddXp) onAddXp(2, 'Menyelesaikan Jurnal 4F di Perpustakaan');
    sounds.playRewardXp();
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      setTitle('');
      setFacts('');
      setFeelings('');
      setFindings('');
      setFuture('');
      setActiveTab('archive');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-dark rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-white/20 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-inner">
              📚
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Modul & Jurnal 4F
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Rak 5 Buku Materi & Refleksi
                </span>
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit']">Perpustakaan Kampus</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('materi');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'materi'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <FileText className="w-4 h-4" /> Modul & Materi
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('write');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'write'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Tulis Jurnal 4F
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('archive');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" /> Arsip Jurnal ({combinedReflections.length})
          </button>
        </div>

        {/* Tab Content: Materi (Rak Buku 5 Materi + Detail Materi Teks Lengkap saat diklik) */}
        {activeTab === 'materi' && (
          <div className="mt-5 space-y-4">
            {!selectedBook ? (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                      <span>📖 Rak Buku Lima Materi Berpikir Komputasional</span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Klik salah satu dari <strong>5 buku materi</strong> di rak bawah ini untuk membuka dan membaca materi teksnya secara detail.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 self-start sm:self-auto shrink-0">
                    ✨ Klik Buku untuk Baca Materi Teks Detail
                  </span>
                </div>

                {/* RAK BUKU LIMA MATERI (WOODEN LIBRARY BOOKCASE) */}
                <div className="rounded-3xl bg-gradient-to-b from-[#2a1810] via-[#1f120b] to-[#160c07] p-4 sm:p-6 border-2 border-amber-800/70 shadow-[inset_0_8px_28px_rgba(0,0,0,0.85),0_12px_30px_rgba(0,0,0,0.6)] relative overflow-hidden">
                  {/* Top Wooden Crown Molding */}
                  <div className="flex items-center justify-between px-3 py-1.5 mb-4 rounded-xl bg-gradient-to-r from-amber-950/90 via-amber-900/60 to-amber-950/90 border border-amber-600/40 shadow-inner">
                    <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-300/90">
                      🏛️ RAK BUKU LIMA MATERI • PERPUSTAKAAN KAMPUS
                    </span>
                    <span className="text-[10px] font-mono font-bold text-amber-200/80">
                      5 BUKU MATERI
                    </span>
                  </div>

                  {/* 5 Books Standing on the Shelf */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 sm:gap-2.5 pt-2 px-1 items-end">
                    {fiveShelfBooks.map((book, idx) => {
                      const theme = BOOK_SHELF_THEMES[idx % BOOK_SHELF_THEMES.length];
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => {
                            sounds.playOpenModal();
                            setSelectedBookId(book.id);
                          }}
                          className={`group relative w-full sm:h-64 rounded-t-2xl rounded-b-md bg-gradient-to-b ${theme.spineGrad} ${theme.border} border-2 p-3.5 sm:p-3 text-left transition-all duration-300 hover:-translate-y-2.5 hover:shadow-[0_14px_28px_rgba(0,0,0,0.75)] active:scale-98 flex flex-row sm:flex-col justify-between items-center sm:items-stretch gap-3 sm:gap-0 cursor-pointer overflow-hidden`}
                        >
                          {/* Book Spine Left Page-Edge Highlight */}
                          <div className="absolute top-0 bottom-0 left-1.5 w-1 bg-white/15 pointer-events-none" />
                          {/* Book Top Gold Foil Trim */}
                          <div className="hidden sm:block w-full h-1.5 rounded-full bg-gradient-to-r from-amber-300/80 via-yellow-200 to-amber-400/80 mb-2 shadow-sm" />

                          {/* Top Badge & Icon */}
                          <div className="flex sm:flex-col items-center sm:items-start gap-2.5 sm:gap-1.5 w-full">
                            <div className="flex items-center justify-between w-auto sm:w-full">
                              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-md bg-black/45 text-amber-300 border border-amber-400/40">
                                BUKU {theme.num}
                              </span>
                              <span className="text-xl sm:text-2xl drop-shadow group-hover:scale-110 transition-transform">
                                {theme.icon}
                              </span>
                            </div>

                            <div className="flex-1 sm:mt-1">
                              <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${theme.badgeBg} mb-1`}>
                                {theme.tag}
                              </span>
                              <h4 className="text-xs sm:text-[12.5px] font-extrabold text-white leading-snug line-clamp-2 sm:line-clamp-3 group-hover:text-amber-200 transition-colors">
                                {book.title.replace(/^Buku \d+:\s*/i, '').replace(/^Pertemuan \d+:\s*/i, '')}
                              </h4>
                            </div>
                          </div>

                          {/* Bottom Gold Foil Band & Read Action */}
                          <div className="shrink-0 sm:w-full sm:mt-auto sm:pt-2">
                            <div className="hidden sm:block w-full h-1 rounded-full bg-gradient-to-r from-amber-400/70 via-yellow-200 to-amber-400/70 mb-2" />
                            <div className="px-2.5 py-1.5 rounded-xl bg-black/40 group-hover:bg-amber-400 group-hover:text-slate-950 text-amber-200 text-[10px] font-extrabold flex items-center justify-center gap-1 border border-white/15 transition-colors whitespace-nowrap">
                              <BookOpen className="w-3 h-3 shrink-0" />
                              <span>Baca Detail</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 3D Wooden Bookshelf Plank Base with Brass Nameplates */}
                  <div className="mt-1 h-5 rounded-lg bg-gradient-to-b from-[#854d0e] via-[#713f12] to-[#422006] border-t-2 border-amber-400/50 border-b-4 border-[#271103] shadow-[0_8px_16px_rgba(0,0,0,0.85)] flex items-center justify-around px-4">
                    {fiveShelfBooks.map((_, idx) => (
                      <span
                        key={idx}
                        className="hidden sm:inline-block px-2 py-0.2 rounded bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-[#422006] font-mono font-black text-[8px] tracking-widest shadow-xs"
                      >
                        MODUL 0{idx + 1}
                      </span>
                    ))}
                    <span className="sm:hidden px-3 py-0.2 rounded bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 text-[#422006] font-mono font-black text-[8.5px] tracking-widest">
                      RAK BUKU LIMA MATERI UTAMA
                    </span>
                  </div>
                </div>

                {/* RAK TAMBAHAN: MODUL HASIL GENERATE AI DARI BANK MATERI GURU */}
                {teacherBankBooks.length > 0 && (
                  <div className="rounded-3xl bg-gradient-to-b from-indigo-950/90 via-slate-900 to-slate-950 p-4 sm:p-5 border-2 border-indigo-500/50 shadow-xl space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-500/30 pb-2.5">
                      <div>
                        <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-300 flex items-center gap-1.5">
                          🏦 MODUL TERDISTRIBUSI DARI GEDUNG BANK MATERI GURU ({teacherBankBooks.length} MODUL AI)
                        </span>
                        <p className="text-xs text-indigo-200/80 mt-0.5">
                          Modul pembelajaran terbaru yang di-generate oleh Bapak/Ibu Guru menggunakan AI untuk dipelajari siswa:
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teacherBankBooks.map((bmBook) => (
                        <button
                          key={bmBook.id}
                          type="button"
                          onClick={() => {
                            sounds.playOpenModal();
                            setSelectedBookId(bmBook.id);
                          }}
                          className="group text-left p-4 rounded-2xl bg-slate-900/90 hover:bg-indigo-950/80 border border-indigo-500/40 hover:border-amber-400/60 transition-all flex flex-col justify-between gap-2.5 cursor-pointer shadow-md"
                        >
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-extrabold">
                                {bmBook.subject}
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                ✨ Bank Materi AI
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-white group-hover:text-amber-200 transition-colors">
                              {bmBook.title}
                            </h4>
                            {bmBook.tujuanPembelajaran && (
                              <p className="text-[11px] text-slate-300 mt-1 line-clamp-2">
                                <strong>TP:</strong> {bmBook.tujuanPembelajaran}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
                            <span className="text-slate-400">
                              👩‍🏫 {bmBook.teacherName || 'Guru Pengampu'} • {bmBook.targetClass}
                            </span>
                            <span className="font-extrabold text-amber-300 group-hover:translate-x-0.5 transition-transform">
                              Baca Modul →
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* DETAIL MATERI TEKS VIEW SAAT BUKU DIKLIK */
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Top Navigation Bar: Back to Bookshelf + Quick 1-5 Book Switcher */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 border border-white/15 p-3 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setSelectedBookId(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold flex items-center gap-1.5 border border-white/15 transition cursor-pointer active:scale-95"
                  >
                    <ChevronLeft className="w-4 h-4 text-amber-400" />
                    <span>Kembali ke Rak 5 Buku</span>
                  </button>

                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    {fiveShelfBooks.map((b, idx) => {
                      const isCurrent = b.id === selectedBook.id;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => {
                            sounds.playClick();
                            setSelectedBookId(b.id);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition cursor-pointer ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950 shadow-md'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          }`}
                        >
                          Buku {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Open Book Detailed Content Card */}
                <div className="rounded-3xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-2xl space-y-5">
                  {/* Book Title Header */}
                  <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedBookIndex >= 0 ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                            BUKU {selectedTheme.num} DARI 05
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-500 text-white">
                            🏦 MODUL PENGEMBANGAN AI BANK MATERI
                          </span>
                        )}
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${selectedTheme.badgeBg}`}>
                          {selectedBook.subject}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                          Kelas: {selectedBook.targetClass}
                        </span>
                        {selectedBook.teacherName && (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            👩‍🏫 {selectedBook.teacherName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-snug flex items-center gap-2">
                        <span>{selectedBookIndex >= 0 ? selectedTheme.icon : '📘'}</span>
                        <span>{selectedBook.title}</span>
                      </h3>
                      {selectedBook.tujuanPembelajaran && (
                        <p className="text-xs text-indigo-200/95 bg-indigo-950/50 border border-indigo-500/30 rounded-xl px-3 py-2 mt-1">
                          <strong className="text-amber-300">🎯 Tujuan Pembelajaran (TP):</strong>{' '}
                          {selectedBook.tujuanPembelajaran}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ringkasan Inti Materi (Key Takeaways) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/35 border border-emerald-500/30 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>
                        {selectedBookIndex >= 0
                          ? `Inti Sari & Poin Penting Buku ${selectedTheme.num}`
                          : `Materi Esensial & Poin Inti Pengembangan (${selectedBook.elemen || selectedBook.subject})`}
                      </span>
                    </div>
                    {selectedBookIndex >= 0 ? (
                      <ul className="space-y-1.5 text-xs text-emerald-100/90 leading-relaxed pl-1">
                        {selectedTheme.keyPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs text-emerald-100/95 whitespace-pre-line leading-relaxed">
                        {selectedBook.materiEsensial || selectedBook.tujuanPembelajaran || selectedBook.title}
                      </div>
                    )}
                  </div>

                  {/* ILUSTRASI VISUAL KONTEKSTUAL & DIAGRAM INFOGRAFIS INTERAKTIF */}
                  {(() => {
                    const visuals =
                      selectedBook.ilustrasiVisual && selectedBook.ilustrasiVisual.length > 0
                        ? selectedBook.ilustrasiVisual
                        : [
                            {
                              id: `vis-auto-${selectedBook.id}-1`,
                              title: `Diagram Visual Cara Kerja: ${selectedBook.elemen || selectedBook.title}`,
                              badge: 'Infografis Visual Kontekstual',
                              caption: `Visualisasi bagaimana konsep pada "${selectedBook.title}" diterapkan dari masalah harian menjadi solusi teknologi nyata.`,
                              visualType: 'flow_diagram' as const,
                              steps: [
                                {
                                  stepLabel: 'Tahap 1: Input & Identifikasi Masalah Harian',
                                  icon: '🔍',
                                  description: `Mengamati masalah teknologi di kehidupan sehari-hari terkait ${selectedBook.subject} dan memetakan kebutuhan data utama.`,
                                },
                                {
                                  stepLabel: 'Tahap 2: Proses Transformasi Konsep',
                                  icon: '⚙️',
                                  description: `Menerapkan prinsip inti "${(selectedBook.tujuanPembelajaran || selectedBook.title).slice(0, 95)}" secara sistematis dan terstruktur.`,
                                },
                                {
                                  stepLabel: 'Tahap 3: Output Solusi & Implementasi Nyata',
                                  icon: '🚀',
                                  description: `Menghasilkan sistem/karya yang cepat, akurat, ramah pengguna, dan langsung menyelesaikan masalah sehari-hari.`,
                                },
                              ],
                              takeaway: `Setiap tahapan pada diagram di atas memastikan konsep ${selectedBook.subject} dapat dipraktikkan langsung dalam kehidupan sehari-hari.`,
                            },
                          ];

                    return (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/95 to-cyan-950/40 border border-cyan-500/40 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>Ilustrasi Visual Kontekstual &amp; Diagram Infografis Interaktif</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30">
                            Visualisasi Konsep &amp; Alur Sistem
                          </span>
                        </div>

                        {/* Contextual SVG Banner Illustration */}
                        <div className="rounded-2xl bg-slate-950/90 border border-indigo-500/30 p-3 sm:p-4 overflow-hidden">
                          <svg
                            viewBox="0 0 760 155"
                            className="w-full h-auto rounded-xl"
                            role="img"
                            aria-label={`Ilustrasi Visual ${selectedBook.title}`}
                          >
                            <defs>
                              <linearGradient id="bgGradPerpus" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#0f172a" />
                                <stop offset="50%" stopColor="#1e1b4b" />
                                <stop offset="100%" stopColor="#083344" />
                              </linearGradient>
                              <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
                                <stop offset="100%" stopColor="#ea580c" stopOpacity="0.12" />
                              </linearGradient>
                              <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.28" />
                                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.14" />
                              </linearGradient>
                              <linearGradient id="cardGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.14" />
                              </linearGradient>
                            </defs>
                            <rect width="760" height="155" rx="16" fill="url(#bgGradPerpus)" />
                            {/* Node 1: Masalah Sehari-hari */}
                            <rect x="20" y="22" width="205" height="110" rx="14" fill="url(#cardGrad1)" stroke="#f59e0b" strokeWidth="1.5" />
                            <circle cx="52" cy="54" r="16" fill="#f59e0b" fillOpacity="0.25" />
                            <text x="52" y="60" textAnchor="middle" fontSize="16">🔍</text>
                            <text x="78" y="50" fill="#fde68a" fontSize="11" fontWeight="bold">1. MASALAH HARIAN</text>
                            <text x="78" y="66" fill="#cbd5e1" fontSize="9.5">Situasi &amp; Data Nyata</text>
                            <text x="34" y="92" fill="#f8fafc" fontSize="10">• Kendala teknologi warga</text>
                            <text x="34" y="108" fill="#f8fafc" fontSize="10">• Kebutuhan efisiensi harian</text>

                            {/* Arrow 1 -> 2 */}
                            <path d="M 232 77 L 268 77" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="4 3" />
                            <polygon points="268,72 278,77 268,82" fill="#38bdf8" />

                            {/* Node 2: Proses Materi Esensial */}
                            <rect x="282" y="22" width="205" height="110" rx="14" fill="url(#cardGrad2)" stroke="#38bdf8" strokeWidth="1.5" />
                            <circle cx="314" cy="54" r="16" fill="#38bdf8" fillOpacity="0.25" />
                            <text x="314" y="60" textAnchor="middle" fontSize="16">⚙️</text>
                            <text x="340" y="50" fill="#bae6fd" fontSize="11" fontWeight="bold">2. KONSEP MATERI</text>
                            <text x="340" y="66" fill="#cbd5e1" fontSize="9.5">Penerapan TP &amp; Esensial</text>
                            <text x="296" y="92" fill="#f8fafc" fontSize="10">• Analisis &amp; struktur logis</text>
                            <text x="296" y="108" fill="#f8fafc" fontSize="10">• Optimasi alur sistem/visual</text>

                            {/* Arrow 2 -> 3 */}
                            <path d="M 494 77 L 530 77" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 3" />
                            <polygon points="530,72 540,77 530,82" fill="#10b981" />

                            {/* Node 3: Solusi Kehidupan Sehari-hari */}
                            <rect x="544" y="22" width="196" height="110" rx="14" fill="url(#cardGrad3)" stroke="#10b981" strokeWidth="1.5" />
                            <circle cx="576" cy="54" r="16" fill="#10b981" fillOpacity="0.25" />
                            <text x="576" y="60" textAnchor="middle" fontSize="16">🚀</text>
                            <text x="602" y="50" fill="#a7f3d0" fontSize="11" fontWeight="bold">3. SOLUSI NYATA</text>
                            <text x="602" y="66" fill="#cbd5e1" fontSize="9.5">Implementasi Sehari-hari</text>
                            <text x="558" y="92" fill="#f8fafc" fontSize="10">• Cepat, akurat &amp; aman</text>
                            <text x="558" y="108" fill="#f8fafc" fontSize="10">• Memudahkan warga &amp; siswa</text>
                          </svg>
                        </div>

                        {/* Interactive Diagram Cards */}
                        <div className="space-y-3">
                          {visuals.map((vis, vIdx) => (
                            <div
                              key={vis.id || vIdx}
                              className="p-4 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h4 className="text-xs sm:text-sm font-black text-white flex items-center gap-2">
                                  <span className="text-amber-300">📊</span>
                                  <span>{vis.title}</span>
                                </h4>
                                <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold">
                                  {vis.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{vis.caption}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                                {(vis.steps || []).map((st, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="p-3 rounded-xl bg-slate-900/95 border border-cyan-500/25 hover:border-amber-400/50 transition-all space-y-1.5"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-base">
                                        {st.icon}
                                      </span>
                                      <span className="text-xs font-extrabold text-amber-300 leading-tight">
                                        {st.stepLabel}
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-slate-200 leading-relaxed">
                                      {st.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                              {vis.takeaway && (
                                <div className="text-[11px] text-cyan-200 bg-cyan-950/40 border border-cyan-500/30 rounded-xl px-3 py-2">
                                  <strong className="text-amber-300">💡 Kesimpulan Visual:</strong> {vis.takeaway}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Full Detailed Text Material Body */}
                  <div className="space-y-3">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Uraian Materi Lengkap &amp; Pengembangan Bab</span>
                    </div>
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-xs sm:text-sm leading-relaxed space-y-3 font-normal">
                      {selectedBook.content.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="whitespace-pre-line leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* IMPLEMENTASI MATERI DALAM KEHIDUPAN SEHARI-HARI */}
                  {(() => {
                    const dailyList =
                      selectedBook.implementasiSehariHari && selectedBook.implementasiSehariHari.length > 0
                        ? selectedBook.implementasiSehariHari
                        : [
                            {
                              id: `imp-auto-${selectedBook.id}-1`,
                              title: 'Optimasi Penggunaan Aplikasi & Layanan Digital Harian',
                              icon: '📱',
                              dailyProblem:
                                'Pengguna sering mengalami kelambatan akses data, antrean layanan digital, atau salah langkah saat mengoperasikan aplikasi sehari-hari.',
                              conceptApplication: `Menerapkan prinsip inti pada "${selectedBook.title}" untuk menata urutan langkah (algoritma/alur kerja) dan menyusun struktur informasi yang jelas.`,
                              realBenefit:
                                'Aktivitas digital harian menjadi jauh lebih cepat, hemat waktu, dan meminimalkan risiko kesalahan.',
                            },
                            {
                              id: `imp-auto-${selectedBook.id}-2`,
                              title: 'Pemecahan Masalah Sistem Informasi di Lingkungan Sekolah',
                              icon: '🏫',
                              dailyProblem:
                                'Pencarian dokumen tugas, pencatatan daftar hadir, atau penyampaian pengumuman penting di sekolah sering memakan waktu lama jika dilakukan secara acak.',
                              conceptApplication: `Menggunakan konsep "${selectedBook.elemen || selectedBook.subject}" untuk mengelompokkan informasi secara terstruktur dan mudah dipindai.`,
                              realBenefit:
                                'Seluruh siswa dan guru dapat menemukan informasi krusial dalam hitungan detik.',
                            },
                            {
                              id: `imp-auto-${selectedBook.id}-3`,
                              title: 'Keamanan & Ketepatan Pengambilan Keputusan Teknologi Warga',
                              icon: '🛡️',
                              dailyProblem:
                                'Warga sering bingung saat menghadapi gangguan teknis perangkat atau memverifikasi kebenaran instruksi digital.',
                              conceptApplication: `Melakukan analisis bertahap sesuai Tujuan Pembelajaran "${(selectedBook.tujuanPembelajaran || selectedBook.title).slice(0, 95)}" sebelum mengambil keputusan.`,
                              realBenefit:
                                'Meningkatkan literasi digital keluarga dan menjaga keamanan data sehari-hari.',
                            },
                          ];

                    return (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-950/50 via-slate-900/95 to-teal-950/40 border border-emerald-500/40 space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                            <span>🌍</span>
                            <span>Implementasi Materi dalam Kehidupan Sehari-hari</span>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                            {dailyList.length} Studi Kasus Nyata
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {dailyList.map((imp, idx) => (
                            <div
                              key={imp.id || idx}
                              className="p-3.5 rounded-xl bg-slate-950/85 border border-emerald-500/25 space-y-2"
                            >
                              <div className="text-xs sm:text-sm font-black text-amber-300 flex items-center gap-2">
                                <span className="text-base">{imp.icon}</span>
                                <span>
                                  Kasus #{idx + 1}: {imp.title}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs">
                                <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30">
                                  <div className="text-[10px] font-extrabold uppercase text-rose-300 mb-1">
                                    ⚠️ Masalah Sehari-hari
                                  </div>
                                  <p className="text-slate-200 leading-relaxed text-[11px]">
                                    {imp.dailyProblem}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-sky-950/30 border border-sky-500/30">
                                  <div className="text-[10px] font-extrabold uppercase text-sky-300 mb-1">
                                    ⚙️ Penerapan Materi
                                  </div>
                                  <p className="text-slate-200 leading-relaxed text-[11px]">
                                    {imp.conceptApplication}
                                  </p>
                                </div>
                                <div className="p-2.5 rounded-lg bg-emerald-950/35 border border-emerald-500/30">
                                  <div className="text-[10px] font-extrabold uppercase text-emerald-300 mb-1">
                                    ✅ Manfaat &amp; Solusi Nyata
                                  </div>
                                  <p className="text-emerald-100 leading-relaxed text-[11px]">
                                    {imp.realBenefit}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Pertanyaan Pemantik Diskusi & Refleksi */}
                  {selectedBook.customQuestions && selectedBook.customQuestions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/35 space-y-2">
                      <div className="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span>Pertanyaan Pemantik Refleksi</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-indigo-100/90 leading-relaxed">
                        {selectedBook.customQuestions.map((q, qIdx) => (
                          <li key={qIdx}>{q}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Bottom Action Buttons (PDF, Video, Tulis Refleksi di Pusat Refleksi) */}
                  <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {selectedBook.link && (
                        <a
                          href={selectedBook.link}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition flex items-center gap-1.5"
                        >
                          <FileText className="w-4 h-4 text-sky-400" /> Unduh / Baca PDF Modul
                        </a>
                      )}
                      {selectedBook.videoUrl && (
                        <a
                          href={selectedBook.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 transition flex items-center gap-1.5"
                        >
                          <Video className="w-4 h-4" /> Tonton Video
                        </a>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        if (onSelectMateriForReflection) onSelectMateriForReflection(selectedBook.id);
                        if (onNavigateBuilding) onNavigateBuilding('taman_refleksi');
                        onClose();
                      }}
                      className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <span>🌍 Tulis Refleksi Materi Ini di Pusat Refleksi (+1 Poin)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Write Jurnal */}
        {activeTab === 'write' && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {isSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm">Jurnal Berhasil Disimpan!</h4>
                  <p className="text-xs text-emerald-200">Kamu mendapatkan reward +2 XP ke status Refleksia City.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Topik Refleksi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Model IPO Von Neumann"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-purple-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">1. Facts (Peristiwa konkret yang dialami)</label>
              <textarea
                required
                rows={2}
                placeholder="Apa yang telah kamu pelajari atau kerjakan hari ini?"
                value={facts}
                onChange={(e) => setFacts(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">2. Feelings (Perasaan selama pembelajaran)</label>
              <textarea
                rows={2}
                placeholder="Bagaimana perasaanmu saat menghadapi kendala atau berhasil menyelesaikannya?"
                value={feelings}
                onChange={(e) => setFeelings(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">3. Findings (Pembelajaran atau pemahaman baru)</label>
              <textarea
                rows={2}
                placeholder="Pelajaran penting apa yang kamu temukan?"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">4. Future (Rencana aksi masa depan)</label>
              <textarea
                rows={2}
                placeholder="Apa langkah nyata yang akan kamu lakukan selanjutnya?"
                value={future}
                onChange={(e) => setFuture(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/20 text-white text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/30 flex items-center gap-2 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" /> Simpan Jurnal Refleksi (+2 XP)
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: Archive (Semua Jurnal Warga) */}
        {activeTab === 'archive' && (
          <div className="mt-5 space-y-4">
            {/* Filter and Search Bar */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/60 border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setAuthorFilter('all');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      authorFilter === 'all'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" /> Semua Warga ({combinedReflections.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setAuthorFilter('mine');
                    }}
                    className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      authorFilter === 'mine'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Jurnal Saya (
                    {
                      combinedReflections.filter(
                        (r) =>
                          (student?.id && r.studentId === student.id) ||
                          (student?.name && r.studentName?.toLowerCase() === student.name.toLowerCase())
                      ).length
                    }
                    )
                  </button>
                </div>

                {/* Class selector */}
                <div className="flex items-center gap-1 overflow-x-auto text-xs">
                  {['all', 'X DKV 2', 'X DKV 3', 'Guru DKV'].map((cls) => (
                    <button
                      key={cls}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setFilterClass(cls);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-medium transition text-[11px] whitespace-nowrap ${
                        filterClass === cls
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cls === 'all' ? 'Semua Kelas' : cls}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari topik, nama siswa, atau kata kunci refleksi 4F..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>

            {/* List of Reflections */}
            {(() => {
              const filtered = combinedReflections.filter((r) => {
                // Author filter
                if (authorFilter === 'mine') {
                  const isMine =
                    (student?.id && r.studentId === student.id) ||
                    (student?.name && r.studentName?.toLowerCase() === student.name.toLowerCase());
                  if (!isMine) return false;
                }
                // Class filter
                if (filterClass !== 'all') {
                  if (filterClass === 'Guru DKV') {
                    if (r.className !== 'Guru DKV' && r.className !== 'Guru & Pengawas') return false;
                  } else if (!r.className || !r.className.includes(filterClass)) {
                    return false;
                  }
                }
                // Search query
                if (searchQuery.trim()) {
                  const q = searchQuery.toLowerCase();
                  const match =
                    (r.title && r.title.toLowerCase().includes(q)) ||
                    (r.subject && r.subject.toLowerCase().includes(q)) ||
                    (r.studentName && r.studentName.toLowerCase().includes(q)) ||
                    (r.facts && r.facts.toLowerCase().includes(q)) ||
                    (r.feelings && r.feelings.toLowerCase().includes(q)) ||
                    (r.findings && r.findings.toLowerCase().includes(q)) ||
                    (r.future && r.future.toLowerCase().includes(q));
                  if (!match) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-slate-400 text-xs space-y-2">
                    <p className="font-semibold text-slate-300">Tidak ada jurnal refleksi yang cocok dengan filter.</p>
                    <p className="text-[11px] text-slate-500">
                      Semua warga dapat saling membaca jurnal di sini. Coba ubah kata kunci atau tulis jurnal barumu!
                    </p>
                  </div>
                );
              }

              return filtered.map((r) => {
                const isCurrentStudent =
                  (student?.id && r.studentId === student.id) ||
                  (student?.name && r.studentName?.toLowerCase() === student.name.toLowerCase());

                return (
                  <div
                    key={r.id}
                    className={`p-4 rounded-2xl border transition-all space-y-3 ${
                      isCurrentStudent
                        ? 'bg-purple-950/30 border-purple-500/40 shadow-lg shadow-purple-950/20'
                        : 'bg-white/5 border-white/10 hover:border-white/20'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Author Tag */}
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-white/15 text-xs text-white font-bold">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span>{r.studentName || 'Warga Refleksia'}</span>
                          {isCurrentStudent && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500 text-white font-extrabold">
                              Kamu
                            </span>
                          )}
                        </div>

                        {/* Class Tag */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                          {r.className || 'X DKV'}
                        </span>

                        {/* Subject Tag */}
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {r.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{r.date}</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold text-[10px]">
                          +2 XP
                        </span>
                      </div>
                    </div>

                    {/* Topic Title */}
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        {r.title}
                      </h4>
                    </div>

                    {/* 4F Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {/* Facts */}
                      <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-purple-300 mb-1 flex items-center gap-1">
                          <span>🔍 1. Facts (Peristiwa)</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-[11px]">{r.facts}</p>
                      </div>

                      {/* Feelings */}
                      <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-blue-300 mb-1 flex items-center gap-1">
                          <span>💖 2. Feelings (Perasaan)</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-[11px]">{r.feelings}</p>
                      </div>

                      {/* Findings */}
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-300 mb-1 flex items-center gap-1">
                          <span>💡 3. Findings (Pembelajaran)</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-[11px]">{r.findings}</p>
                      </div>

                      {/* Future */}
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                        <div className="text-[10px] font-bold uppercase tracking-wide text-amber-300 mb-1 flex items-center gap-1">
                          <span>🚀 4. Future (Rencana Aksi)</span>
                        </div>
                        <p className="text-slate-200 leading-relaxed text-[11px]">{r.future}</p>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
