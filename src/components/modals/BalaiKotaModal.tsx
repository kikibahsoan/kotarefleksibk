import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Award, Target, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface BalaiKotaModalProps {
  studentName?: string;
  studentXp?: number;
  onClose: () => void;
  onOpenBuilding?: (id: any) => void;
  onNavigateBuilding?: (id: any) => void;
  objectives?: any[];
  materis?: any[];
  onAddPoints?: (amount: number, reason: string) => void;
  reflectionsCount?: number;
  hasSharedChatToday?: boolean;
}

export const BalaiKotaModal: React.FC<BalaiKotaModalProps> = ({
  studentName = 'Siswa',
  studentXp = 100,
  onClose,
  onOpenBuilding,
  onNavigateBuilding,
  onAddPoints,
  reflectionsCount = 0,
  hasSharedChatToday = false,
}) => {
  const openTarget = onNavigateBuilding || onOpenBuilding || (() => {});
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const storageKey = `kota_missions_claimed_${studentName}_${todayDateStr}`;

  // Keep track of claimed missions for today (auto-resets every 24h as date changes)
  const [claimedMissions, setClaimedMissions] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(claimedMissions));
    } catch (e) {}
  }, [claimedMissions, storageKey]);

  const dailyMissions = [
    {
      id: 'm-1',
      title: 'Tulis Jurnal Refleksi 4F',
      desc: 'Isi Facts, Feelings, Findings, Future di Perpustakaan atau Taman Refleksi',
      xp: 30,
      targetId: 'taman_refleksi',
      icon: '📚',
      isReadyToClaim: reflectionsCount > 0,
    },
    {
      id: 'm-2',
      title: 'Mancing Ide & Meditasi Refleksi',
      desc: 'Tangkap inspirasi mindful di Kolam Pancing samping Balai Kota',
      xp: 25,
      targetId: 'kolam_pancing',
      icon: '🎣',
      isReadyToClaim: true, // Can be completed directly
    },
    {
      id: 'm-3',
      title: 'Sapa Warga di Kafe Refleksi',
      desc: 'Kirim pesan atau insight belajarmu ke obrolan warga kota',
      xp: 15,
      targetId: 'kafe_refleksi',
      icon: '☕',
      isReadyToClaim: hasSharedChatToday,
    },
    {
      id: 'm-4',
      title: 'Cek Papan Info & Bonus Harian',
      desc: 'Pelajari tips metakognisi hari ini dan ambil bonus absensi warga',
      xp: 10,
      targetId: 'papan_informasi',
      icon: '📋',
      isReadyToClaim: true, // Daily login/attendance bonus
    },
    {
      id: 'm-5',
      title: 'Asah Logika di Bengkel Latihan',
      desc: 'Selesaikan tantangan kuis cepat Berpikir Komputasional',
      xp: 20,
      targetId: 'bengkel_latihan',
      icon: '🛠️',
      isReadyToClaim: false,
    },
  ];

  const handleClaimMission = (missionId: string, xpAmount: number, title: string) => {
    if (claimedMissions.includes(missionId)) return;

    sounds.playRewardXp();
    setClaimedMissions((prev) => [...prev, missionId]);

    if (onAddPoints) {
      onAddPoints(xpAmount, title);
    }

    setToastMessage(`🎉 Misi "${title}" tuntas! +${xpAmount} XP berhasil ditambahkan ke saldo!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="liquid-glass-dark rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-white/20 relative max-h-[92vh] overflow-y-auto">
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
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast Banner */}
        {toastMessage && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg animate-in fade-in slide-in-from-top-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-spin-slow" />
            <span className="flex-1">{toastMessage}</span>
          </div>
        )}

        {/* Civic Status Card with Saldo (XP) */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-blue-200 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Status Warga Teladan
            </div>
            <h4 className="text-lg font-bold text-white mt-0.5">{studentName}</h4>
            <p className="text-xs text-slate-300">
              Tuntaskan misi harian untuk menambah saldo XP kamu. Saldo XP bisa dipakai belanja kopi, roti, dan eskrim!
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-amber-400/40 shrink-0 shadow-inner">
            <Award className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-[11px] text-slate-300 font-medium">Saldo Dompet Warga</div>
              <div className="text-lg font-black text-amber-300 font-mono">🪙 {studentXp} XP</div>
            </div>
          </div>
        </div>

        {/* Daily Missions */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Misi Harian Berhadiah XP
            </h3>
            <span className="text-[11px] text-cyan-300 font-medium">Auto-reset setiap 24 Jam</span>
          </div>

          <div className="space-y-2.5">
            {dailyMissions.map((mission) => {
              const isClaimed = claimedMissions.includes(mission.id);

              return (
                <div
                  key={mission.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isClaimed
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-85'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                      {mission.icon}
                    </div>
                    <div className="min-w-0">
                      <h5 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{mission.title}</span>
                        {isClaimed && (
                          <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <CheckCircle2 className="w-3 h-3" /> Selesai (+XP Masuk)
                          </span>
                        )}
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed mt-0.5">{mission.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-xl border border-amber-400/30 font-mono">
                      +{mission.xp} XP
                    </span>

                    {isClaimed ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 cursor-default">
                        Sudah Diklaim
                      </span>
                    ) : mission.isReadyToClaim ? (
                      <button
                        onClick={() => handleClaimMission(mission.id, mission.xp, mission.title)}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30 border border-yellow-300 transition active:scale-95 cursor-pointer flex items-center gap-1 animate-pulse"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Klaim +{mission.xp} XP</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          openTarget(mission.targetId);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <span>Kerjakan</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
