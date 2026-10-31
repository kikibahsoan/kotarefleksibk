import React from 'react';
import { X, CheckCircle2, Award, Target, Sparkles, ArrowRight, Shuffle } from 'lucide-react';
import { sounds } from '../../utils/audio';
import { BuildingId } from '../../types/index.ts';

export interface TownMissionDef {
  id: string;
  title: string;
  desc: string;
  xp: number;
  targetId: BuildingId;
  icon: string;
}

export const TOWN_MISSION_POOL: TownMissionDef[] = [
  {
    id: 'm_refleksi',
    title: 'Kirim Refleksi di Pusat Refleksi',
    desc: 'Tulis dan kirim refleksi pembelajaran di Pusat Refleksi (+1 XP)',
    xp: 1,
    targetId: 'taman_refleksi',
    icon: '🌍',
  },
  {
    id: 'm_bengkel',
    title: 'Tuntaskan 5 Soal Berjenjang di Bengkel Latihan',
    desc: 'Jawab soal kuis berjenjang (5 detik/soal) di Bengkel Latihan',
    xp: 1,
    targetId: 'bengkel_latihan',
    icon: '🛠️',
  },
  {
    id: 'm_perpustakaan',
    title: 'Pelajari Modul di Perpustakaan',
    desc: 'Buka dan baca materi ajar Berpikir Komputasional di Perpustakaan Kampus',
    xp: 1,
    targetId: 'perpustakaan',
    icon: '📚',
  },
  {
    id: 'm_chat',
    title: 'Sapa Warga di Obrolan Kota',
    desc: 'Kirim pesan sapaan atau insight belajar ke obrolan langsung warga kota',
    xp: 1,
    targetId: 'monumen_warga',
    icon: '💬',
  },
  {
    id: 'm_pos',
    title: 'Kirim Pesan Konsultasi di Kantor Pos',
    desc: 'Kirim surat pertanyaan atau progres belajar ke Guru via Kantor Pos Kilat',
    xp: 1,
    targetId: 'kantor_pos',
    icon: '📮',
  },
  {
    id: 'm_mentor',
    title: 'Simak Evaluasi di Studio ON AIR',
    desc: 'Kunjungi Studio ON AIR (Menara Mentor) untuk menyimak umpan balik AI Mentor',
    xp: 1,
    targetId: 'menara_mentor',
    icon: '🎙️',
  },
  {
    id: 'm_papan',
    title: 'Baca Pengumuman di Papan Informasi',
    desc: 'Buka Papan Informasi Refleksia untuk mempelajari buletin & tips metakognisi',
    xp: 1,
    targetId: 'monumen_warga',
    icon: '📋',
  },
  {
    id: 'm_pasar',
    title: 'Cek Progres Lencana di Toko Poin',
    desc: 'Kunjungi Pasar Prestasi (Toko Poin) untuk mengecek koleksi lencana warga',
    xp: 1,
    targetId: 'pasar_prestasi',
    icon: '🎪',
  },
];

export function getOrInitUserRandomMissions(userId: string, forceNew = false): TownMissionDef[] {
  const storageKey = `kota_random_missions_v2_${userId}`;
  if (!forceNew) {
    try {
      const savedIds = localStorage.getItem(storageKey);
      if (savedIds) {
        const parsed: string[] = JSON.parse(savedIds);
        const mapped = parsed
          .map((id) => TOWN_MISSION_POOL.find((m) => m.id === id))
          .filter((m): m is TownMissionDef => Boolean(m));
        if (mapped.length === 5) {
          return mapped;
        }
      }
    } catch (e) {}
  }

  // Shuffle pool using Fisher-Yates and select 5 random missions
  const poolCopy = [...TOWN_MISSION_POOL];
  for (let i = poolCopy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [poolCopy[i], poolCopy[j]] = [poolCopy[j], poolCopy[i]];
  }
  const selected = poolCopy.slice(0, 5);
  try {
    localStorage.setItem(storageKey, JSON.stringify(selected.map((m) => m.id)));
  } catch (e) {}
  return selected;
}

export function getCompletedMissionIds(userId: string): string[] {
  const storageKey = `kota_completed_missions_v2_${userId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveCompletedMissionIds(userId: string, ids: string[]): void {
  const storageKey = `kota_completed_missions_v2_${userId}`;
  try {
    localStorage.setItem(storageKey, JSON.stringify(ids));
  } catch (e) {}
}

interface BalaiKotaModalProps {
  studentName?: string;
  studentXp?: number;
  onClose: () => void;
  onOpenBuilding?: (id: BuildingId) => void;
  onNavigateBuilding?: (id: BuildingId) => void;
  objectives?: any[];
  materis?: any[];
  assignedMissions: TownMissionDef[];
  completedMissionIds: string[];
}

export const BalaiKotaModal: React.FC<BalaiKotaModalProps> = ({
  studentName = 'Siswa',
  studentXp = 5,
  onClose,
  onOpenBuilding,
  onNavigateBuilding,
  assignedMissions,
  completedMissionIds,
}) => {
  const openTarget = onNavigateBuilding || onOpenBuilding || (() => {});
  const completedCount = assignedMissions.filter((m) => completedMissionIds.includes(m.id)).length;

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
                <span className="text-xs text-slate-400">Daftar Misi Warga</span>
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

        {/* Civic Status Card with Saldo (XP) */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs text-blue-200 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Status Warga Refleksia
            </div>
            <h4 className="text-lg font-bold text-white mt-0.5">{studentName}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Setiap misi bernilai <strong className="text-amber-300">+1 XP</strong>. Tidak ada klaim instan — tuntaskan langsung aktivitas misinya di kota dan XP otomatis masuk ke saldomu!
            </p>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-4 py-2.5 rounded-2xl border border-amber-400/40 shrink-0 shadow-inner">
            <Award className="w-8 h-8 text-amber-400" />
            <div>
              <div className="text-[11px] text-slate-300 font-medium">Saldo Koin (XP)</div>
              <div className="text-lg font-black text-amber-300 font-mono">🪙 {studentXp} XP</div>
            </div>
          </div>
        </div>

        {/* Randomized Missions List (No Manual Claim Button) */}
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" /> Daftar Misi Kota (Acak / Random)
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
                <Shuffle className="w-3 h-3" /> Misi Random • +1 XP / Misi
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold">
                {completedCount}/{assignedMissions.length} Tuntas
              </span>
            </div>
          </div>

          <div className="space-y-2.5">
            {assignedMissions.map((mission, idx) => {
              const isCompleted = completedMissionIds.includes(mission.id);

              return (
                <div
                  key={mission.id}
                  className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCompleted
                      ? 'bg-emerald-950/30 border-emerald-500/40'
                      : 'bg-white/5 hover:bg-white/10 border-white/10'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl shrink-0">
                      {mission.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          Misi #{idx + 1}
                        </span>
                        <h5 className="text-sm font-bold text-white">{mission.title}</h5>
                        {isCompleted && (
                          <span className="text-[10px] font-semibold text-emerald-300 flex items-center gap-1 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                            <CheckCircle2 className="w-3 h-3" /> Tuntas (+1 XP Masuk Otomatis)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mt-1">{mission.desc}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-xl border border-amber-400/30 font-mono">
                      +{mission.xp} XP
                    </span>

                    {isCompleted ? (
                      <span className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 flex items-center gap-1 cursor-default">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Misi Tuntas</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          onClose();
                          openTarget(mission.targetId);
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95 shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Kerjakan Misi</span>
                        <ArrowRight className="w-3.5 h-3.5" />
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

