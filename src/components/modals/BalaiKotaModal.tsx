import React from 'react';
import { X, CheckCircle2, Award, Calendar, Target, Sparkles } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface BalaiKotaModalProps {
  studentName?: string;
  studentXp?: number;
  onClose: () => void;
  onOpenBuilding?: (id: any) => void;
  onNavigateBuilding?: (id: any) => void;
  objectives?: any[];
  materis?: any[];
}

export const BalaiKotaModal: React.FC<BalaiKotaModalProps> = ({
  studentName = 'Siswa',
  studentXp = 100,
  onClose,
  onOpenBuilding,
  onNavigateBuilding,
}) => {
  const openTarget = onNavigateBuilding || onOpenBuilding || (() => {});
  const dailyMissions = [
    {
      id: 'm-1',
      title: 'Tulis Jurnal Refleksi 4F',
      desc: 'Isi Facts, Feelings, Findings, Future di Perpustakaan',
      xp: 30,
      targetId: 'perpustakaan',
      icon: '📚',
      done: studentXp >= 30,
    },
    {
      id: 'm-2',
      title: 'Mancing Ide Refleksi',
      desc: 'Tangkap inspirasi mindful di Kolam Pancing samping Balai Kota',
      xp: 25,
      targetId: 'kolam-pancing',
      icon: '🎣',
      done: studentXp >= 55,
    },
    {
      id: 'm-3',
      title: 'Sapa Warga di Kafe Refleksi',
      desc: 'Kirim insight belajarmu ke chat warga kota (maks 25 obrolan)',
      xp: 15,
      targetId: 'kafe-refleksi',
      icon: '☕',
      done: studentXp >= 70,
    },
    {
      id: 'm-4',
      title: 'Cek Pengumuman di Papan Info',
      desc: 'Pelajari tips metakognisi dan lihat posisimu di Leaderboard',
      xp: 10,
      targetId: 'papan-informasi',
      icon: '📋',
      done: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-dark rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-white/20 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-3xl shadow-inner">
              🏛️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Pusat Kota Refleksia
                </span>
                <span className="text-xs text-slate-400">Gedung Utama</span>
              </div>
              <h2 className="text-xl font-black text-white font-['Outfit']">Balai Kota Refleksia</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Civic Status Card */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-blue-200 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Status Warga Teladan
            </div>
            <h4 className="text-lg font-bold text-white mt-0.5">{studentName}</h4>
            <p className="text-xs text-slate-300">
              Tercatat aktif dalam membangun kebiasaan refleksi metakognitif harian.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/10">
            <Award className="w-7 h-7 text-amber-400" />
            <div>
              <div className="text-[11px] text-slate-300 font-medium">Total Akumulasi XP</div>
              <div className="text-base font-black text-amber-300">⭐ {studentXp} XP</div>
            </div>
          </div>
        </div>

        {/* Daily Missions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Misi Harian Refleksi
            </h3>
            <span className="text-xs text-cyan-300 font-medium">Batas reset: 24 Jam</span>
          </div>

          <div className="space-y-2.5">
            {dailyMissions.map((mission) => (
              <div
                key={mission.id}
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
                    {mission.icon}
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white flex items-center gap-2">
                      {mission.title}
                      {mission.done && (
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                      )}
                    </h5>
                    <p className="text-xs text-slate-300">{mission.desc}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2 py-1 rounded-lg border border-amber-400/30">
                    +{mission.xp} XP
                  </span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      onClose();
                      openTarget(mission.targetId);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
                  >
                    Buka
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
