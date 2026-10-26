import React, { useState } from 'react';
import { X, BookOpen, Send, Sparkles, CheckCircle2, History, FileText, ArrowRight, Video } from 'lucide-react';
import { Materi, ReflectionEntry } from '../../types/index.ts';
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

export const PerpustakaanModal: React.FC<PerpustakaanModalProps> = ({
  onClose,
  materis = [],
  onNavigateBuilding,
  onSelectMateriForReflection,
  onAddXp,
  reflections = [],
  onSaveReflection,
}) => {
  const [activeTab, setActiveTab] = useState<'materi' | 'write' | 'archive'>(
    materis.length > 0 ? 'materi' : 'write'
  );
  const [subject, setSubject] = useState('Informatika (Berpikir Komputasional)');
  const [title, setTitle] = useState('');
  const [facts, setFacts] = useState('');
  const [feelings, setFeelings] = useState('');
  const [findings, setFindings] = useState('');
  const [future, setFuture] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

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
                  Materi & Jurnal 4F
                </span>
                <span className="text-xs text-amber-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Pelajari Materi & Refleksi
                </span>
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit']">Perpustakaan Refleksi</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Ghibli Watercolor Miniature Showcase Banner */}
        <div className="mt-4 rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-slate-900/40 to-amber-950/30 p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-4 shadow-xl">
          <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden border-2 border-emerald-400/40 shadow-lg relative group">
            <img
              src="/ghibli_perpustakaan.jpg"
              alt="Perpustakaan Studio Ghibli Aesthetic"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-1">
              <span className="text-[9px] font-bold text-amber-200 bg-black/60 px-1 py-0.5 rounded backdrop-blur-xs">
                🌿 Ghibli Art
              </span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Studio Ghibli Aesthetic
              </span>
              <span className="text-[10px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                🌾 Anime Watercolor
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
              Perpustakaan Miniatur di Blok Tanah Melayang
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Arsitektur kayu pedesaan yang nyaman dengan menara lonceng, kincir air, tanaman rambat rimbun, dan palet warna bumi alami di atas fondasi tanah bersudut membulat.
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto">
          {materis.length > 0 && (
            <button
              onClick={() => setActiveTab('materi')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'materi'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" /> Modul & Materi ({materis.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('write')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'write'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4" /> Tulis Jurnal 4F
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'archive'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" /> Arsip Jurnal ({reflections.length})
          </button>
        </div>

        {/* Tab Content: Materi */}
        {activeTab === 'materi' && (
          <div className="mt-5 space-y-4">
            <p className="text-xs text-slate-300">
              Pilih materi pembelajaran Berpikir Komputasional berikut untuk dibaca, lalu klik "Tulis Refleksi" untuk merefleksikan pemahamanmu di Taman Refleksi.
            </p>

            <div className="space-y-3">
              {materis.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {m.targetClass}
                      </span>
                      {m.isNew && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                          BARU
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-white leading-snug">{m.title}</h4>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {m.content}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0">
                    {m.link && (
                      <a
                        href={m.link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5" /> PDF
                      </a>
                    )}
                    {m.videoUrl && (
                      <a
                        href={m.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 transition flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5" /> Video
                      </a>
                    )}
                    <button
                      onClick={() => {
                        sounds.playClick();
                        if (onSelectMateriForReflection) onSelectMateriForReflection(m.id);
                        if (onNavigateBuilding) onNavigateBuilding('taman_refleksi');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-1.5"
                    >
                      <span>Tulis Refleksi</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
            {reflections.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                Belum ada arsip jurnal 4F yang tersimpan. Mulai tulis jurnal baru sekarang!
              </div>
            ) : (
              reflections.map((r) => (
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
