import React, { useState } from 'react';
import { X, BookOpen, Send, Sparkles, CheckCircle2, History, FileText, ArrowRight, Video, ChevronLeft, HelpCircle, Layers } from 'lucide-react';
import { Materi, ReflectionEntry } from '../../types/index.ts';
import { INITIAL_MATERI } from '../../data/initialData.ts';
import { sounds } from '../../utils/audio.ts';

interface PerpustakaanModalProps {
  onClose: () => void;
  materis?: Materi[];
  onNavigateBuilding?: (id: any) => void;
  onSelectMateriForReflection?: (mId: any) => void;
  onAddXp?: (amount: number, reason: string) => void;
  reflections?: ReflectionEntry[];
  onSaveReflection?: (entry: ReflectionEntry) => void;
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

export const PerpustakaanModal: React.FC<PerpustakaanModalProps> = ({
  onClose,
  materis = [],
  onNavigateBuilding,
  onSelectMateriForReflection,
  onAddXp,
  reflections = [],
  onSaveReflection,
}) => {
  // Always ensure the 5 main books have full detailed text content
  const fiveShelfBooks: Materi[] = INITIAL_MATERI.slice(0, 5).map((initBook, idx) => {
    const matched = materis.find((m) => m.id === initBook.id) || materis[idx];
    if (matched && matched.content && matched.content.length >= initBook.content.length) {
      return matched;
    }
    return initBook;
  });

  const [activeTab, setActiveTab] = useState<'materi' | 'write' | 'archive'>('materi');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [subject, setSubject] = useState('Informatika (Berpikir Komputasional)');
  const [title, setTitle] = useState('');
  const [facts, setFacts] = useState('');
  const [feelings, setFeelings] = useState('');
  const [findings, setFindings] = useState('');
  const [future, setFuture] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [localArchives, setLocalArchives] = useState<ReflectionEntry[]>(() => {
    try {
      const saved = localStorage.getItem('kota_refleksi_jurnal4f');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !facts.trim()) return;

    const newEntry: ReflectionEntry = {
      id: `ref-${Date.now()}`,
      title,
      subject,
      facts,
      feelings: feelings || 'Merasa tertantang namun puas setelah berhasil.',
      findings: findings || 'Memahami pentingnya ketelitian dalam pemecahan masalah.',
      future: future || 'Akan mendokumentasikan setiap solusi untuk referensi berikutnya.',
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
      xpEarned: 30,
    };

    const nextArchives = [newEntry, ...localArchives];
    setLocalArchives(nextArchives);
    try {
      localStorage.setItem('kota_refleksi_jurnal4f', JSON.stringify(nextArchives));
    } catch {}

    if (onSaveReflection) onSaveReflection(newEntry);
    if (onAddXp) onAddXp(30, 'Menyelesaikan Jurnal 4F di Perpustakaan');
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
    }, 1500);
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
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
                          BUKU {selectedTheme.num} DARI 05
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${selectedTheme.badgeBg}`}>
                          {selectedBook.subject}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-slate-300">
                          Kelas: {selectedBook.targetClass}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white leading-snug flex items-center gap-2">
                        <span>{selectedTheme.icon}</span>
                        <span>{selectedBook.title}</span>
                      </h3>
                    </div>
                  </div>

                  {/* Ringkasan Inti Materi (Key Takeaways) */}
                  <div className="p-4 rounded-2xl bg-emerald-950/35 border border-emerald-500/30 space-y-2">
                    <div className="text-xs font-extrabold text-emerald-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>Inti Sari & Poin Penting Buku {selectedTheme.num}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-100/90 leading-relaxed pl-1">
                      {selectedTheme.keyPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Full Detailed Text Material Body */}
                  <div className="space-y-3">
                    <div className="text-xs font-extrabold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-400" />
                      <span>Uraian Materi Teks Lengkap</span>
                    </div>
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-slate-100 text-xs sm:text-sm leading-relaxed space-y-3 font-normal">
                      {selectedBook.content.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx} className="whitespace-pre-line leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>

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
                      <span>🌍 Tulis Refleksi Materi Ini di Pusat Refleksi (+3 Poin)</span>
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
                  <p className="text-xs text-emerald-200">Kamu mendapatkan reward +30 XP ke status Refleksia City.</p>
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
                <Send className="w-4 h-4" /> Simpan Jurnal Refleksi (+30 XP)
              </button>
            </div>
          </form>
        )}

        {/* Tab Content: Archive */}
        {activeTab === 'archive' && (
          <div className="mt-5 space-y-3">
            {combinedReflections.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Belum ada arsip jurnal 4F yang tersimpan. Mulai tulis jurnal baru sekarang!
              </div>
            ) : (
              combinedReflections.map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
                        {r.subject}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-1">{r.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400">{r.date}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                    <p><strong className="text-purple-300">Facts:</strong> {r.facts}</p>
                    <p><strong className="text-blue-300">Feelings:</strong> {r.feelings}</p>
                    <p><strong className="text-emerald-300">Findings:</strong> {r.findings}</p>
                    <p><strong className="text-amber-300">Future:</strong> {r.future}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
