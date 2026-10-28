import React from 'react';
import { BuildingId } from '../types/index.ts';
import { BUILDINGS_INFO } from './ThreeTownCanvas.tsx';
import { X, ChevronRight, Sparkles } from 'lucide-react';

interface QuickNav2DProps {
  onClose: () => void;
  onSelectBuilding: (buildingId: BuildingId) => void;
  newMateriBuildingIds: BuildingId[];
  onOpenTeacher?: () => void;
}

const BUILDING_ICONS: Record<BuildingId, string> = {
  balai_kota: '🏛️',
  perpustakaan: '📚',
  taman_refleksi: '🌸',
  menara_mentor: '📡',
  bengkel_latihan: '🛠️',
  kantor_pos: '📮',
  pasar_prestasi: '🎪',
  monumen_warga: '⛲',
};

const BUILDING_DESCRIPTIONS: Record<BuildingId, string> = {
  balai_kota: 'Misi hari ini, pengumuman sekolah, dan target pembelajaran aktif.',
  perpustakaan: 'Baca materi, rangkuman, dan tonton video penjelasan praktikum.',
  taman_refleksi: 'Tulis refleksi pemahaman 3 pertanyaan dan pilih skala bintang.',
  menara_mentor: 'Umpan balik personal AI Mentor Kota dan rencana belajar 3 langkah.',
  bengkel_latihan: 'Kuis cepat dan tantangan kejuruan untuk menambah poin XP.',
  kantor_pos: 'Kirim surat pertanyaan atau kesulitan langsung ke gurumu.',
  pasar_prestasi: 'Lihat koleksi lencana, poin XP, streak hari, dan level murid.',
  monumen_warga: 'Sapa & obrolan langsung sesama warga dan teman kelas di tengah kota.',
};

export const QuickNav2D: React.FC<QuickNav2DProps> = ({
  onClose,
  onSelectBuilding,
  newMateriBuildingIds,
  onOpenTeacher,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-8 pb-4 px-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[86vh] text-slate-100 my-auto animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-700 px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🗺️</span>
            <div>
              <h3 className="font-extrabold text-base text-white">Menu Cepat 2D: Lokasi Kota</h3>
              <p className="text-xs text-slate-400">Pilih bangunan untuk masuk langsung tanpa navigasi 3D</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Menu Cepat"
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
          >
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>

        {/* Buildings 2D List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {BUILDINGS_INFO.map((b) => {
            const hasNew = newMateriBuildingIds.includes(b.id);
            return (
              <button
                key={b.id}
                onClick={() => {
                  onSelectBuilding(b.id);
                  onClose();
                }}
                className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700/80 hover:border-slate-600 transition flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl shrink-0 border border-slate-700/80 group-hover:scale-105 transition transform">
                    {BUILDING_ICONS[b.id]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white group-hover:text-sky-300 transition">
                        {b.name}
                      </h4>
                      {hasNew && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Materi Baru</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {BUILDING_DESCRIPTIONS[b.id]}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white shrink-0 transition transform group-hover:translate-x-1" />
              </button>
            );
          })}

          {onOpenTeacher && (
            <button
              onClick={() => {
                onOpenTeacher();
                onClose();
              }}
              className="w-full text-left p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 to-emerald-950/60 hover:from-amber-900/60 hover:to-emerald-900/60 border border-amber-500/40 hover:border-amber-400/70 transition flex items-center justify-between gap-3 group mt-2"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-900/60 flex items-center justify-center text-2xl shrink-0 border border-amber-500/40 group-hover:scale-105 transition transform">
                  👨‍🏫
                </div>
                <div>
                  <h4 className="font-bold text-sm text-amber-200 group-hover:text-amber-100 transition">
                    Ruang Guru & Setting Cloud Spreadsheet
                  </h4>
                  <p className="text-xs text-amber-300/70 mt-0.5 leading-snug">
                    Kelola materi, nilai murid, PIN guru, serta konfigurasi Google Sheets & Apps Script
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-amber-400 group-hover:text-white shrink-0 transition transform group-hover:translate-x-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
