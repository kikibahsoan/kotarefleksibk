import React from 'react';
import { Student } from '../../types/index.ts';
import { X, ShieldCheck, Award, Sparkles, CheckCircle2, QrCode, MapPin, School, Calendar, UserCheck } from 'lucide-react';
import { INITIAL_BADGES } from '../../data/initialData.ts';

interface KartuWargaModalProps {
  onClose: () => void;
  student: Student;
  studentHandle: string;
  levelInfo: {
    level: number;
    title: string;
  };
  reflectionsCount: number;
  completedMissionsCount: number;
  totalMissionsCount: number;
  isMaster?: boolean;
}

export const KartuWargaModal: React.FC<KartuWargaModalProps> = ({
  onClose,
  student,
  studentHandle,
  levelInfo,
  reflectionsCount,
  completedMissionsCount,
  totalMissionsCount,
  isMaster = false,
}) => {
  const isTeacher = Boolean(student.isTeacher);
  const classShort = isMaster
    ? 'MASTER KOTA REFLEKSIA'
    : isTeacher
    ? 'DEWAN GURU DKV'
    : student.className.includes('DKV 3')
    ? 'X DKV 3 (Desain Komunikasi Visual)'
    : 'X DKV 2 (Desain Komunikasi Visual)';

  const kwrNumber = isMaster
    ? '7571-KWR-MASTER-0001'
    : isTeacher
    ? `7571-KWR-GURU-${(student.id.replace(/[^0-9A-Z]/gi, '').slice(0, 6) || '01').toUpperCase()}`
    : `7571-${student.className.includes('DKV 3') ? '03' : '02'}-2026-00${student.studentNumber || '01'}`;

  const genderLabel = student.gender === 'P' ? 'Perempuan (P)' : 'Laki-laki (L)';
  const roleLabel = isMaster
    ? 'Arsitek & Master Kota Refleksia'
    : isTeacher
    ? `Pendidik / Guru (${student.subject || 'DKV'})`
    : 'Pelajar Aktif / Warga Studio DKV';

  const ownedBadges = INITIAL_BADGES.filter((b) => (student.badges || []).includes(b.id));

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-xl bg-gradient-to-br from-[#0f1c2e] via-[#132338] to-[#0a1929] border-2 border-amber-400/50 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.85)] text-slate-100 relative overflow-hidden max-h-[92dvh] overflow-y-auto">
        {/* Holographic / Watermark Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Official KWR Top Banner */}
        <div className="px-4 sm:px-6 py-3.5 bg-gradient-to-r from-emerald-950/90 via-slate-900/95 to-amber-950/80 border-b border-amber-400/30 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-emerald-500 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-amber-400">
                <School className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0">
              <p className="text-[9.5px] sm:text-[10px] font-extrabold tracking-widest uppercase text-amber-300">
                PEMERINTAH KOTA REFLEKSIA • SMKN 2 GORONTALO
              </p>
              <h2 className="text-sm sm:text-base font-black tracking-wide text-white font-display truncate">
                KARTU WARGA REFLEKSIA (KWR)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Tutup KWR"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Main KWR Card Body */}
        <div className="p-4 sm:p-6 space-y-4 relative z-10">
          {/* NIK / Nomor Induk Warga Bar */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-2xl px-3.5 py-2 flex items-center justify-between gap-2">
            <div>
              <span className="text-[9.5px] uppercase tracking-wider text-slate-400 font-bold block">
                NOMOR INDUK WARGA REFLEKSIA (NIWR)
              </span>
              <span className="font-mono text-xs sm:text-sm font-black tracking-wider text-amber-300">
                {kwrNumber}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-extrabold shrink-0">
              <CheckCircle2 className="w-3 h-3" /> TERVERIFIKASI
            </span>
          </div>

          {/* Citizen Photo + Personal Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-900/55 border border-slate-700/60 rounded-2xl p-3.5 sm:p-4">
            {/* Avatar Photo Frame */}
            <div className="sm:col-span-4 flex flex-col items-center text-center">
              <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gradient-to-b from-amber-500/30 via-emerald-600/25 to-slate-900 border-2 border-amber-400 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
                <span className="text-4xl sm:text-5xl drop-shadow">
                  {isMaster
                    ? '⏳'
                    : isTeacher
                    ? student.gender === 'P'
                      ? '👩‍🏫'
                      : '👨‍🏫'
                    : student.gender === 'P'
                    ? '🧕'
                    : '👦'}
                </span>
                <span className="mt-1.5 px-2 py-0.5 rounded bg-slate-950/80 text-[9px] font-mono font-bold text-amber-300 border border-amber-400/30">
                  {studentHandle}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-300">
                <UserCheck className="w-3 h-3" />
                <span>Warga Aktif</span>
              </div>
            </div>

            {/* Citizen Biodata Rows */}
            <div className="sm:col-span-8 space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-1 border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-medium">Nama Lengkap</span>
                <span className="col-span-2 font-black text-white uppercase">
                  : {student.name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-medium">No. Absen / ID</span>
                <span className="col-span-2 font-bold text-amber-300 font-mono">
                  : {student.studentNumber || '01'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-medium">Jenis Kelamin</span>
                <span className="col-span-2 font-semibold text-slate-200">
                  : {genderLabel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-medium">Distrik / Kelas</span>
                <span className="col-span-2 font-bold text-emerald-300">
                  : {classShort}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 border-b border-slate-800 pb-1.5">
                <span className="text-slate-400 font-medium">Pekerjaan</span>
                <span className="col-span-2 font-semibold text-slate-200">
                  : {roleLabel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <span className="text-slate-400 font-medium">Domisili</span>
                <span className="col-span-2 font-semibold text-sky-300 flex items-center gap-1">
                  : <MapPin className="w-3 h-3 inline text-sky-400" /> Kota Refleksia, Gorontalo
                </span>
              </div>
            </div>
          </div>

          {/* Civic Rank, XP & Activity Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-slate-900/75 border border-amber-500/30 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-semibold">Saldo Koin XP</p>
              <p className="text-sm sm:text-base font-black text-amber-400 font-mono mt-0.5">
                🪙 {student.points} XP
              </p>
            </div>
            <div className="bg-slate-900/75 border border-emerald-500/30 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-semibold">Gelar Warga</p>
              <p className="text-xs sm:text-sm font-black text-emerald-300 truncate mt-0.5">
                Lv.{levelInfo.level} {levelInfo.title}
              </p>
            </div>
            <div className="bg-slate-900/75 border border-cyan-500/30 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-semibold">Refleksi Tuntas</p>
              <p className="text-sm sm:text-base font-black text-cyan-300 font-mono mt-0.5">
                📝 {reflectionsCount}
              </p>
            </div>
            <div className="bg-slate-900/75 border border-purple-500/30 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-semibold">Misi Harian</p>
              <p className="text-sm sm:text-base font-black text-purple-300 font-mono mt-0.5">
                🎯 {completedMissionsCount}/{totalMissionsCount}
              </p>
            </div>
          </div>

          {/* Badges / Lencana Warga */}
          <div className="bg-slate-900/50 border border-slate-700/60 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-400" /> Lencana Kehormatan Warga
              </span>
              <span className="text-[10px] text-amber-300 font-bold">
                {ownedBadges.length} Lencana
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ownedBadges.length > 0 ? (
                ownedBadges.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-amber-400/30 text-xs font-bold text-slate-200"
                  >
                    <span>{b.icon}</span>
                    <span>{b.title}</span>
                  </span>
                ))
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-emerald-400/30 text-xs font-bold text-emerald-300">
                  🌱 Warga Baru Kota Refleksia
                </span>
              )}
            </div>
          </div>

          {/* Footer Signature & Validity */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-3 text-[10px] text-slate-400">
            <div className="space-y-0.5">
              <p className="flex items-center gap-1 text-slate-300 font-semibold">
                <Calendar className="w-3 h-3 text-emerald-400" />
                Berlaku: Selama Menjadi Warga Aktif Refleksia City
              </p>
              <p>Diterbitkan oleh Balai Kota Refleksia • Informatika (KKA) DKV</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-300 shrink-0">
              <QrCode className="w-5 h-5 text-amber-400" />
              <div className="text-[9px] leading-tight font-mono">
                <div className="font-bold text-white">KWR-DIGITAL</div>
                <div className="text-emerald-400">SAH & AKTIF</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
