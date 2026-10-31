import React, { useState, useEffect } from 'react';
import { X, Sparkles, Heart, Send, CheckCircle2, Pin, Calendar, User, BookOpen } from 'lucide-react';
import { DailyJournalStickyNote, Student } from '../../types/index.ts';
import { sounds } from '../../utils/audio.ts';
import confetti from 'canvas-confetti';

interface JurnalHarianModalProps {
  onClose: () => void;
  student?: Student | null;
  onAddXp?: (amount: number, reason: string) => void;
  onNoteAdded?: (newNote: DailyJournalStickyNote) => void;
}

export const STORAGE_KEY_JURNAL_BERINGIN = 'kota_jurnal_harian_beringin';

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
  },
];

export function getStoredStickyNotes(): DailyJournalStickyNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JURNAL_BERINGIN);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    // fallback
  }
  // If empty, initialize with default lively notes
  try {
    localStorage.setItem(STORAGE_KEY_JURNAL_BERINGIN, JSON.stringify(INITIAL_STICKY_NOTES));
  } catch (e) {}
  return INITIAL_STICKY_NOTES;
}

export function saveStoredStickyNotes(notes: DailyJournalStickyNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_JURNAL_BERINGIN, JSON.stringify(notes));
  } catch (e) {}
}

const COLOR_MAP = {
  yellow: {
    bg: 'bg-amber-100 text-amber-950 border-amber-300',
    header: 'bg-amber-200/70 border-amber-300/80 text-amber-900',
    pin: 'bg-rose-500',
    shadow: 'shadow-amber-900/20',
    ring: 'focus:ring-amber-400',
    label: 'Kuning Hangat',
  },
  pink: {
    bg: 'bg-pink-100 text-pink-950 border-pink-300',
    header: 'bg-pink-200/70 border-pink-300/80 text-pink-900',
    pin: 'bg-purple-600',
    shadow: 'shadow-pink-900/20',
    ring: 'focus:ring-pink-400',
    label: 'Pink Ceria',
  },
  blue: {
    bg: 'bg-sky-100 text-sky-950 border-sky-300',
    header: 'bg-sky-200/70 border-sky-300/80 text-sky-900',
    pin: 'bg-indigo-600',
    shadow: 'shadow-sky-900/20',
    ring: 'focus:ring-sky-400',
    label: 'Biru Langit',
  },
  green: {
    bg: 'bg-emerald-100 text-emerald-950 border-emerald-300',
    header: 'bg-emerald-200/70 border-emerald-300/80 text-emerald-900',
    pin: 'bg-emerald-700',
    shadow: 'shadow-emerald-900/20',
    ring: 'focus:ring-emerald-400',
    label: 'Hijau Mint',
  },
  purple: {
    bg: 'bg-purple-100 text-purple-950 border-purple-300',
    header: 'bg-purple-200/70 border-purple-300/80 text-purple-900',
    pin: 'bg-violet-600',
    shadow: 'shadow-purple-900/20',
    ring: 'focus:ring-purple-400',
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
  const [notes, setNotes] = useState<DailyJournalStickyNote[]>(() => getStoredStickyNotes());
  const [activeTab, setActiveTab] = useState<'write' | 'board'>('write');
  const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all');

  const [content, setContent] = useState('');
  const [mood, setMood] = useState('😊');
  const [color, setColor] = useState<'yellow' | 'pink' | 'blue' | 'green' | 'purple'>('yellow');
  const [isSuccess, setIsSuccess] = useState(false);
  const [likedNoteIds, setLikedNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kota_jurnal_likes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Calculate student notes count
  const myNotes = notes.filter((n) => n.studentId === student?.id);
  const displayedNotes = filterMode === 'mine' ? myNotes : notes;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const studentName = student?.name || 'Siswa DKV';
    const studentId = student?.id || `anon-${Date.now()}`;
    const className = student?.className || (student?.isTeacher ? 'Guru Pembimbing' : 'X DKV 2');

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const newNote: DailyJournalStickyNote = {
      id: `sticky-${Date.now()}`,
      studentId,
      studentName,
      className,
      content: content.trim(),
      mood,
      color,
      date: todayStr,
      timestamp: Date.now(),
      likes: 0,
    };

    const nextNotes = [newNote, ...notes];
    setNotes(nextNotes);
    saveStoredStickyNotes(nextNotes);

    // Call callbacks
    if (onNoteAdded) {
      onNoteAdded(newNote);
    }

    // Award +1 XP
    if (onAddXp) {
      onAddXp(1, 'Menulis Jurnal Harian di Pohon Beringin');
    }

    sounds.playRewardXp();

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setContent('');
      setActiveTab('board');
    }, 1200);
  };

  const handleToggleLike = (noteId: string) => {
    sounds.playClick();
    const isAlreadyLiked = likedNoteIds.includes(noteId);
    const nextLiked = isAlreadyLiked
      ? likedNoteIds.filter((id) => id !== noteId)
      : [...likedNoteIds, noteId];

    setLikedNoteIds(nextLiked);
    try {
      localStorage.setItem('kota_jurnal_likes', JSON.stringify(nextLiked));
    } catch {}

    const nextNotes = notes.map((n) => {
      if (n.id === noteId) {
        const curLikes = n.likes || 0;
        return {
          ...n,
          likes: Math.max(0, curLikes + (isAlreadyLiked ? -1 : 1)),
        };
      }
      return n;
    });

    setNotes(nextNotes);
    saveStoredStickyNotes(nextNotes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-dark rounded-3xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-emerald-500/30 relative max-h-[92vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-emerald-400/40 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🌳
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Belakang Balai Kota
                </span>
                <span className="text-[11px] text-amber-300 font-extrabold flex items-center gap-1 font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> +1 XP Tiap Catatan
                </span>
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
                <span>Jurnal Harian Pohon Beringin</span>
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
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
              <span>Tulis Sticky Note Hari Ini</span>
            </button>
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
              <span>🌳 Pohon Catatan ({notes.length})</span>
            </button>
          </div>

          {activeTab === 'board' && (
            <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  filterMode === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Semua ({notes.length})
              </button>
              <button
                onClick={() => setFilterMode('mine')}
                className={`px-2.5 py-1 rounded-lg font-bold transition ${
                  filterMode === 'mine' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Catatan Saya ({myNotes.length})
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Form Tulis Sticky Note */}
        {activeTab === 'write' && (
          <div className="mt-4 space-y-4">
            {isSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-6 h-6 text-emerald-300 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm text-white">Sticky Note Berhasil Ditempelkan!</h4>
                  <p className="text-xs text-emerald-300">
                    Kamu mendapatkan <strong className="text-amber-300">+1 XP</strong> ke saldo Refleksia City.
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
                    placeholder="Contoh: Hari ini saya berhasil memahami hierarki font pada tugas poster DKV dan mencoba kombinasi warna komplementer."
                    className="w-full p-3 rounded-2xl bg-slate-900 border border-white/20 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 resize-none leading-relaxed"
                  />
                </div>

                {/* Mood Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Perasaan / Mood Belajar Hari Ini
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
                    Warna Kertas Sticky Note
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
                    disabled={!content.trim()}
                    className="w-full py-3 px-5 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-700/30 transition transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Tempelkan Sticky Note di Pohon Beringin (+1 XP)</span>
                  </button>
                </div>
              </form>

              {/* Realtime Live Preview on Tree Bark */}
              <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-gradient-to-b from-[#25150d] via-[#1a0e08] to-[#110905] border-2 border-amber-900/60 shadow-[inset_0_4px_24px_rgba(0,0,0,0.85)] relative min-h-[260px] overflow-hidden">
                {/* Tree bark woodgrain background subtle texture */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:12px_12px]" />
                <div className="text-[10px] uppercase tracking-widest font-extrabold text-amber-400/80 mb-3 flex items-center gap-1.5">
                  <span>🌳 Pratinjau Sticky Note di Pohon</span>
                </div>

                {/* Sticky Note Box */}
                <div
                  className={`w-full max-w-[260px] p-4 rounded-2xl border-2 ${COLOR_MAP[color].bg} ${COLOR_MAP[color].shadow} shadow-2xl transition-all transform rotate-[-1.5deg] relative`}
                >
                  {/* Push Pin */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 shadow-md border-2 border-white/60 flex items-center justify-center text-[10px] text-white">
                    📍
                  </div>

                  <div className="flex items-center justify-between border-b border-black/10 pb-2 mb-2">
                    <div className="min-w-0 pr-1">
                      <div className="text-[10px] font-extrabold uppercase tracking-wider truncate opacity-75">
                        {student?.className || 'X DKV 2'}
                      </div>
                      <div className="text-xs font-black truncate">
                        {student?.name || 'Siswa DKV'}
                      </div>
                    </div>
                    <span className="text-2xl shrink-0 drop-shadow-sm">{mood}</span>
                  </div>

                  <p className="text-xs leading-relaxed font-medium min-h-[60px] whitespace-pre-wrap break-words">
                    {content.trim() || 'Tuliskan catatan harianmu di formulir sebelah kiri untuk melihat pratinjau di sini...'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[10px] opacity-75">
                    <span>Hari ini</span>
                    <span className="font-bold flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> +1 XP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Board Sticky Notes on Tree */}
        {activeTab === 'board' && (
          <div className="mt-4 flex-1">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-[#24130b] via-[#1a0d07] to-[#100703] border-2 border-amber-900/60 shadow-[inset_0_6px_28px_rgba(0,0,0,0.85)] relative min-h-[380px]">
              {/* Header inside tree plank */}
              <div className="flex items-center justify-between px-3 py-1.5 mb-4 rounded-xl bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-amber-950/90 border border-amber-600/30 shadow-inner">
                <span className="text-[10px] font-extrabold tracking-widest uppercase text-amber-300">
                  🌳 BATANG POHON BERINGIN • PAPAN STICKY NOTE WARGA
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-200">
                  {displayedNotes.length} CATATAN
                </span>
              </div>

              {displayedNotes.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs space-y-2">
                  <p className="text-3xl">🍃</p>
                  <p className="font-bold text-slate-300">Belum ada catatan yang tersimpan.</p>
                  <button
                    onClick={() => setActiveTab('write')}
                    className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95"
                  >
                    Tulis Catatan Pertamamu Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  {displayedNotes.map((note, idx) => {
                    const cObj = COLOR_MAP[note.color] || COLOR_MAP.yellow;
                    const isLiked = likedNoteIds.includes(note.id);
                    // Slight alternating rotation for authentic sticky note effect
                    const rotations = ['rotate-[-1.5deg]', 'rotate-[1.2deg]', 'rotate-[-0.8deg]', 'rotate-[1.8deg]', 'rotate-[-1.2deg]'];
                    const rot = rotations[idx % rotations.length];

                    return (
                      <div
                        key={note.id}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 ${cObj.bg} ${cObj.shadow} shadow-lg transition-all hover:scale-102 hover:shadow-xl hover:z-10 relative flex flex-col justify-between ${rot}`}
                      >
                        {/* Pin top center */}
                        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-gradient-to-tr from-rose-600 to-red-400 border border-white/70 shadow-sm flex items-center justify-center text-[9px] text-white">
                          📌
                        </div>

                        <div>
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-black/10 pb-1.5 mb-2">
                            <div className="min-w-0 pr-1">
                              <span className="text-[9px] font-extrabold uppercase tracking-wider block opacity-75 truncate">
                                {note.className || 'Siswa DKV'}
                              </span>
                              <h4 className="text-xs font-black truncate">{note.studentName}</h4>
                            </div>
                            <span className="text-xl shrink-0 drop-shadow-sm">{note.mood}</span>
                          </div>

                          {/* Content */}
                          <p className="text-xs leading-relaxed font-medium whitespace-pre-wrap break-words">
                            {note.content}
                          </p>
                        </div>

                        {/* Footer info & Like */}
                        <div className="mt-3 pt-2 border-t border-black/10 flex items-center justify-between text-[10px]">
                          <span className="opacity-70 font-mono">{note.date}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleLike(note.id)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-bold transition active:scale-95 cursor-pointer ${
                              isLiked ? 'bg-rose-500 text-white' : 'bg-black/10 hover:bg-black/20 text-slate-800'
                            }`}
                            title="Beri tanda suka"
                          >
                            <Heart className={`w-3 h-3 ${isLiked ? 'fill-white' : ''}`} />
                            <span>{note.likes || 0}</span>
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
      </div>
    </div>
  );
};
