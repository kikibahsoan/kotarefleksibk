import React, { useState } from 'react';
import { Materi, BuildingId } from '../../types/index.ts';
import { X, BookOpen, ExternalLink, Video, ArrowRight, Search } from 'lucide-react';

interface PerpustakaanModalProps {
  onClose: () => void;
  materis: Materi[];
  onNavigateBuilding: (buildingId: BuildingId) => void;
  onSelectMateriForReflection?: (materiId: string) => void;
}

export const PerpustakaanModal: React.FC<PerpustakaanModalProps> = ({
  onClose,
  materis,
  onNavigateBuilding,
  onSelectMateriForReflection,
}) => {
  const [selectedMateriId, setSelectedMateriId] = useState<string>(materis[0]?.id || '');
  const [search, setSearch] = useState('');

  const filteredMateris = materis.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase()) ||
      m.targetClass.toLowerCase().includes(search.toLowerCase())
  );

  const activeMateri = materis.find((m) => m.id === selectedMateriId) || filteredMateris[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-green-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              📚
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display leading-tight">Perpustakaan Kota</h2>
              <p className="text-xs text-emerald-100 font-medium">Koleksi Modul & Materi Pembelajaran Kejuruan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Perpustakaan"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content split into sidebar list and detail view */}
        <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden min-h-0">
          {/* Sidebar List */}
          <div className="md:col-span-5 border-r border-slate-800 p-4 flex flex-col overflow-y-auto">
            {/* Search input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari materi atau mapel..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-2 flex-1">
              {filteredMateris.map((m) => {
                const isSelected = activeMateri?.id === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMateriId(m.id)}
                    className={`w-full text-left p-3 rounded-2xl transition border ${
                      isSelected
                        ? 'bg-emerald-950/70 border-emerald-500/80 text-white shadow'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] uppercase font-bold text-emerald-400">
                        {m.subject}
                      </span>
                      {m.isNew && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-slate-950">
                          BARU
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold leading-snug line-clamp-2">{m.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">{m.targetClass}</p>
                  </button>
                );
              })}

              {filteredMateris.length === 0 && (
                <p className="text-center text-xs text-slate-500 py-6">Materi tidak ditemukan.</p>
              )}
            </div>
          </div>

          {/* Reading Detail Area */}
          <div className="md:col-span-7 p-6 overflow-y-auto flex flex-col justify-between space-y-6">
            {activeMateri ? (
              <>
                <div className="space-y-4">
                  <div>
                    <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800/80 mb-2">
                      {activeMateri.subject}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white leading-tight">
                      {activeMateri.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Sasaran: {activeMateri.targetClass} • Ditambahkan: {activeMateri.createdAt}
                    </p>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/70 text-slate-200 text-sm leading-relaxed whitespace-pre-line">
                    {activeMateri.content}
                  </div>

                  {/* Modul Ajar PDF Banner & External Links */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 to-teal-950/70 border border-emerald-600/50 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          Dokumen Modul Resmi (Fase E - SMK Negeri 2 Gorontalo)
                        </span>
                        <h5 className="text-xs font-bold text-white mt-1">
                          Materi Ajar Berpikir Komputasional — Abdul Rahman Bahsoan
                        </h5>
                        <p className="text-[11px] text-slate-300">
                          Berpikir Komputasional dalam Ruang Lingkup Bisnis Industri DKV (5 Pertemuan)
                        </p>
                      </div>
                      <a
                        href="/public/assets/aistudio/Materi_Ajar_Siswa_Berpikir_Komputasional_Abdul_Rahman_Bahsoan_15d54abe.pdf"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka PDF Modul</span>
                      </a>
                    </div>
                  </div>

                  {/* Pertanyaan Refleksi Khusus dari Modul */}
                  {activeMateri.customQuestions && activeMateri.customQuestions.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-2">
                      <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <span>📝</span>
                        <span>Pertanyaan Refleksi Terkait Materi Ini:</span>
                      </h5>
                      <ul className="space-y-1 text-xs text-slate-200">
                        {activeMateri.customQuestions.map((q, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-400 font-bold">{idx + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Video Penjelasan Praktik */}
                  {activeMateri.videoUrl && (
                    <div className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                      <a
                        href={activeMateri.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-xs text-sky-400 hover:text-sky-300 underline font-medium"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Tonton Video Penjelasan Praktik</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Call to action: Go to Reflection */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                  <p className="text-xs text-slate-400">
                    Selesai membaca? Luangkan waktu sejenak untuk refleksi.
                  </p>
                  <button
                    onClick={() => {
                      if (onSelectMateriForReflection) {
                        onSelectMateriForReflection(activeMateri.id);
                      }
                      onClose();
                      onNavigateBuilding('taman_refleksi');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-lg shadow-pink-600/30 flex items-center gap-2 transition"
                  >
                    <span>Mulai Refleksi Materi Ini</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-slate-400">
                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Pilih salah satu materi di sebelah kiri untuk membaca.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
