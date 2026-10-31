import React, { useState, useEffect, useMemo } from 'react';
import { X, Sparkles, Heart, Send, CheckCircle2, Pin, Calendar, User, Search, Filter, MessageSquare, BookOpen } from 'lucide-react';
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
  } catch (e) {}
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

  const [likedNoteIds, setLikedNoteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('kota_jurnal_likes');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Synchronize sticky notes from server across all devices & students
  useEffect(() => {
    let isMounted = true;
    const fetchSharedNotes = async () => {
      try {
        const res = await fetch('/api/journals/sticky-notes');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            const map = new Map<string, DailyJournalStickyNote>();
            // Add server notes first
            json.data.forEach((n: DailyJournalStickyNote) => {
              if (n && n.id) map.set(n.id, n);
            });
            // Merge local storage notes
            const local = getStoredStickyNotes();
            local.forEach((n) => {
              if (!map.has(n.id)) map.set(n.id, n);
            });
            const merged = Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            setNotes(merged);
            saveStoredStickyNotes(merged);
          }
        }
      } catch (err) {
        // Safe offline fallback
      }
    };

    fetchSharedNotes();

    // Listen to local BroadcastChannel and window events
    const handleStorageUpdate = (e: any) => {
      if (e?.detail && Array.isArray(e.detail) && isMounted) {
        setNotes(e.detail);
      }
    };
    window.addEventListener('kota_refleksi_sticky_notes_updated', handleStorageUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      bc = new BroadcastChannel('kota_refleksi_channel');
      bc.onmessage = (event) => {
        if (event.data?.type === 'sticky_note_added' || event.data?.type === 'sticky_notes_updated') {
          fetchSharedNotes();
        }
      };
    }

    return () => {
      isMounted = false;
      window.removeEventListener('kota_refleksi_sticky_notes_updated', handleStorageUpdate);
      if (bc) bc.close();
    };
  }, []);

  // Filtered notes based on filterClass and search query
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // 1. Class / Mine filter
      if (filterClass === 'mine') {
        if (student?.id && n.studentId !== student.id) return false;
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
  }, [notes, filterClass, searchQuery, student?.id]);

  const myNotesCount = notes.filter((n) => student?.id && n.studentId === student.id).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const studentName = student?.name || 'Siswa DKV';
    const studentId = student?.id || `std-${Date.now()}`;
    const className = student?.className || (student?.isTeacher ? 'Guru Pembimbing' : 'X DKV 2');

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

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
    };

    const nextNotes = [newNote, ...notes];
    setNotes(nextNotes);
    saveStoredStickyNotes(nextNotes);

    // Call callbacks
    if (onNoteAdded) onNoteAdded(newNote);

    // Sync to backend server so other citizens on different devices/browsers can read it immediately
    try {
      await fetch('/api/journals/sticky-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote),
      });
    } catch (e) {
      // offline fallback
    }

    // Broadcast update across tabs
    try {
      window.dispatchEvent(new CustomEvent('kota_refleksi_sticky_notes_updated', { detail: nextNotes }));
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('kota_refleksi_channel');
        bc.postMessage({ type: 'sticky_note_added', data: newNote });
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
    }, 1200);
  };

  const handleToggleLike = async (noteId: string) => {
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

    try {
      fetch('/api/journals/sticky-notes/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, increment: !isAlreadyLiked }),
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
                    const isLiked = likedNoteIds.includes(note.id);
                    const isMyOwn = student?.id && note.studentId === student.id;
                    const rotations = ['rotate-[-1.2deg]', 'rotate-[1.2deg]', 'rotate-[-0.8deg]', 'rotate-[1.5deg]', 'rotate-[-1.5deg]'];
                    const rot = rotations[idx % rotations.length];

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

                        {/* Note Footer: Date & Heart Likes */}
                        <div className="mt-3.5 pt-2 border-t border-black/15 flex items-center justify-between text-[10.5px]">
                          <span className="opacity-75 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 opacity-60" />
                            <span>{note.date}</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleLike(note.id)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                              isLiked ? 'bg-rose-500 text-white' : 'bg-black/10 hover:bg-black/20 text-slate-900'
                            }`}
                            title="Beri tanda suka pada catatan ini"
                          >
                            <Heart className={`w-3 h-3 ${isLiked ? 'fill-white' : ''}`} />
                            <span className="text-[11px] font-mono">{note.likes || 0}</span>
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

                  <div className="mt-3 pt-2 border-t border-black/15 flex items-center justify-between text-[10px] opacity-75">
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
      </div>
    </div>
  );
};
