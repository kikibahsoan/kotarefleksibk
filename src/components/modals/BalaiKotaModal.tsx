import React from 'react';
import { Materi, LearningObjective, BuildingId } from '../../types/index.ts';
import { X, Calendar, Flag, Sparkles, ArrowRight, Award, Compass, Bell } from 'lucide-react';

interface BalaiKotaModalProps {
  onClose: () => void;
  onNavigateBuilding: (buildingId: BuildingId) => void;
  objectives: LearningObjective[];
  materis: Materi[];
  studentName?: string;
}

export const BalaiKotaModal: React.FC<BalaiKotaModalProps> = ({
  onClose,
  onNavigateBuilding,
  objectives,
  materis,
  studentName,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🏛️
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display leading-tight">Balai Kota Refleksi</h2>
              <p className="text-xs text-blue-100 font-medium">Pusat Informasi & Misi Pembelajaran Aktif</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Balai Kota"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Welcome Announcement */}
          <div className="p-4 rounded-2xl bg-blue-950/50 border border-blue-500/30 flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 mt-0.5">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-blue-300">
                Pengumuman Balai Kota {studentName ? `untuk ${studentName}` : ''}
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Selamat datang di Kota Refleksi! Selesaikan pembelajaran hari ini, tulis refleksimu secara jujur di Taman Refleksi, dan dengarkan masukan dari AI Mentor Kota di Menara Mentor.
              </p>
            </div>
          </div>

          {/* Active Learning Objectives (Tujuan Pembelajaran) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Flag className="w-4 h-4 text-emerald-400" />
                <span>Tujuan Pembelajaran & Misi Aktif</span>
              </h3>
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                {objectives.length} Misi
              </span>
            </div>

            <div className="space-y-3">
              {objectives.map((tp) => {
                const relatedMateri = materis.find((m) => m.id === tp.materiId);
                return (
                  <div
                    key={tp.id}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-slate-600 transition"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-400 border border-emerald-800 mb-1.5">
                          {relatedMateri?.subject || 'Kejuruan SMK'}
                        </span>
                        <h4 className="font-bold text-sm text-white">
                          {tp.goalStatement}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          <strong className="text-slate-300">Indikator:</strong> {tp.indicator}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Tenggat: <strong className="text-slate-200">{tp.deadline}</strong>
                      </span>
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateBuilding('taman_refleksi');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 transition"
                      >
                        <span>Refleksi Misi Ini</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Town Shortcuts */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-400" />
              <span>Jelajah Bangunan Penting</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  onNavigateBuilding('perpustakaan');
                }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-lg">
                  📚
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Perpustakaan</p>
                  <p className="text-xs text-slate-400">Baca materi & rangkuman</p>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onNavigateBuilding('taman_refleksi');
                }}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-left transition flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center text-lg">
                  🌸
                </div>
                <div>
                  <p className="font-bold text-sm text-white">Taman Refleksi</p>
                  <p className="text-xs text-slate-400">Tulis evaluasi belajarmu</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
