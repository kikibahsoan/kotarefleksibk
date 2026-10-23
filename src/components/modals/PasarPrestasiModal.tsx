import React from 'react';
import { Student, Reflection, Badge } from '../../types/index.ts';
import { INITIAL_BADGES } from '../../data/initialData.ts';
import { calculateStudentLevel } from '../../utils/rules.ts';
import { X, Award, Flame, Star, TrendingUp, CheckCircle, Lock } from 'lucide-react';

interface PasarPrestasiModalProps {
  onClose: () => void;
  student: Student;
  reflections: Reflection[];
}

export const PasarPrestasiModal: React.FC<PasarPrestasiModalProps> = ({
  onClose,
  student,
  reflections,
}) => {
  const levelInfo = calculateStudentLevel(student.points);
  const studentReflections = reflections.filter((r) => r.studentId === student.id);

  // Group reflection scales
  const scaleCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  studentReflections.forEach((r) => {
    const s = Math.round(r.scale) as 1 | 2 | 3 | 4 | 5;
    if (scaleCounts[s] !== undefined) scaleCounts[s]++;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
              🎪
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-display leading-tight">Pasar Prestasi</h2>
              <p className="text-xs text-cyan-100 font-medium">Lencana, Poin Belajar & Progres Pemahaman</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Pasar Prestasi"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Level Progress Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Level {levelInfo.level}
                </span>
                <h3 className="text-lg font-extrabold text-white">{levelInfo.title}</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-amber-400">{student.points}</span>
                <span className="text-xs text-slate-400 block">Total Poin XP</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-medium">
              <span>{levelInfo.minPoints} XP</span>
              <span>{levelInfo.progressPercent}% menuju Level {levelInfo.level + 1}</span>
              <span>{levelInfo.nextLevelPoints} XP</span>
            </div>
          </div>

          {/* Quick Stats: Streaks & Reflections */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-xl">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">{student.streakDays} Hari</p>
                <p className="text-xs text-slate-400">Streak Refleksi</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center text-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-extrabold text-white">{studentReflections.length} Kali</p>
                <p className="text-xs text-slate-400">Refleksi Ditulis</p>
              </div>
            </div>
          </div>

          {/* Badges Gallery */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Galeri Lencana Keberhasilan ({student.badges?.length || 0} Terbuka)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INITIAL_BADGES.map((b) => {
                const isUnlocked = student.badges?.includes(b.id);
                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-slate-800 border-cyan-500/50 shadow'
                        : 'bg-slate-850/40 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl shrink-0 border border-slate-700">
                      {isUnlocked ? b.icon : <Lock className="w-5 h-5 text-slate-500" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h5 className="font-bold text-xs text-white">{b.title}</h5>
                        {isUnlocked && <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{b.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Understanding Scale Summary Chart */}
          <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span>Distribusi Skala Pemahaman Refleksimu</span>
            </h4>

            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((s) => {
                const count = scaleCounts[s as 1 | 2 | 3 | 4 | 5];
                const pct = studentReflections.length > 0 ? (count / studentReflections.length) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3 text-xs">
                    <span className="w-16 font-mono text-slate-300 flex items-center gap-0.5">
                      {s} <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <div className="flex-1 h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/60">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right font-bold text-slate-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
