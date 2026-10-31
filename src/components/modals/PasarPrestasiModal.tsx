import React, { useState, useMemo } from 'react';
import { Student, Reflection, PublicChatMessage, Message, StudentActivityBreakdown } from '../../types/index.ts';
import { TEACHER_ACCOUNTS } from '../../data/teacherAccounts.ts';
import { INITIAL_BADGES } from '../../data/initialData.ts';
import { StorageService } from '../../utils/storage.ts';
import { calculateStudentLevel } from '../../utils/rules.ts';
import { sounds } from '../../utils/audio.ts';
import {
  X,
  Trophy,
  Award,
  Flame,
  Star,
  TrendingUp,
  CheckCircle,
  Lock,
  Users,
  Shield,
  GraduationCap,
  Crown,
  Sparkles,
  BookOpen,
  Zap,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface PasarPrestasiModalProps {
  onClose: () => void;
  student: Student;
  reflections: Reflection[];
  students?: Student[];
  publicChats?: PublicChatMessage[];
  messages?: Message[];
}

export interface SupervisorInfo {
  id: string;
  name: string;
  role: string;
  institution: string;
  description: string;
  icon: string;
  badge: string;
}

export const SUPERVISORS_LIST: SupervisorInfo[] = [
  {
    id: 'pengawas-01',
    name: 'Drs. H. Ruslan S. Payu, M.Pd',
    role: 'Pengawas Pembina SMK Provinsi Gorontalo',
    institution: 'Dinas Pendidikan dan Kebudayaan Provinsi Gorontalo',
    description: 'Membina kurikulum merdeka kejuruan, penjaminan mutu asesmen reflektif, dan kompetensi keahlian DKV.',
    icon: '👔',
    badge: 'Pengawas Pembina',
  },
  {
    id: 'pengawas-02',
    name: 'Dra. Salma Botutihe, M.Pd',
    role: 'Pengawas Penjaminan Mutu Pendidikan Kejuruan',
    institution: 'Balai Guru Penggerak & Dikbudpora Gorontalo',
    description: 'Mengawal inovasi pembelajaran berbasis digital, berpikir komputasional, dan portofolio karya kreatif.',
    icon: '📑',
    badge: 'Pengawas Mutu',
  },
  {
    id: 'pengawas-03',
    name: 'Kepala SMKN 2 Gorontalo',
    role: 'Pimpinan & Penanggung Jawab Satuan Pendidikan',
    institution: 'SMK Negeri 2 Gorontalo',
    description: 'Mendukung penuh ekosistem pembelajaran reflektif digital berbasis gamifikasi untuk seluruh murid DKV.',
    icon: '🏛️',
    badge: 'Kepala Sekolah',
  },
  {
    id: 'pengawas-04',
    name: 'Koordinator Program Keahlian DKV',
    role: 'Pengawas Teaching Factory & Kurikulum Kejuruan',
    institution: 'Konsentrasi Keahlian DKV SMKN 2 Gorontalo',
    description: 'Mengawasi ketercapaian capaian pembelajaran, project-based learning, dan sertifikasi keahlian desain siswa.',
    icon: '🎨',
    badge: 'Koordinator DKV',
  },
  {
    id: 'pengawas-05',
    name: 'Sony (Wali Kota Refleksia)',
    role: 'Pengawas Ekosistem Digital Kota Refleksia',
    institution: 'Pemerintahan Kota Belajar Refleksia',
    description: 'Menjaga keasrian kota, keaktifan warga, ketertiban umum, dan mengapresiasi pencapaian setiap siswa.',
    icon: '✨',
    badge: 'Wali Kota',
  },
];

export const PasarPrestasiModal: React.FC<PasarPrestasiModalProps> = ({
  onClose,
  student,
  reflections,
  students: propStudents,
  publicChats,
  messages,
}) => {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'teachers' | 'supervisors' | 'my_stats'>('leaderboard');
  const [classFilter, setClassFilter] = useState<'all' | 'X DKV 2' | 'X DKV 3'>('all');

  // Retrieve all students
  const allStudents = useMemo(() => {
    const list = propStudents && propStudents.length > 0 ? propStudents : StorageService.getStudents();
    return list.filter((s) => !s.isTeacher);
  }, [propStudents]);

  // Compute stats and rank students by Total Activities in Town!
  const filteredStudents = useMemo(() => {
    let list = allStudents.map((s) => {
      const stats: StudentActivityBreakdown = StorageService.getStudentActivityStats(s, reflections, publicChats, messages);
      return {
        ...s,
        activityStats: stats,
        totalActivities: stats.total,
      };
    });

    if (classFilter === 'X DKV 2') {
      list = list.filter((s) => s.className?.includes('2'));
    } else if (classFilter === 'X DKV 3') {
      list = list.filter((s) => s.className?.includes('3'));
    }

    // Sort descending primarily by TOTAL ACTIVITIES (Jumlah Aktivitas dalam Kota: Login, Misi, Refleksi, Obrolan, Kuis)
    // Secondary tie-breaker: Points (XP), then streakDays
    list.sort((a, b) => {
      const actDiff = (b.totalActivities || 0) - (a.totalActivities || 0);
      if (actDiff !== 0) return actDiff;
      const xpDiff = (b.points || 0) - (a.points || 0);
      if (xpDiff !== 0) return xpDiff;
      return (b.streakDays || 0) - (a.streakDays || 0);
    });

    return list;
  }, [allStudents, classFilter, reflections, publicChats, messages]);

  // Top 5 Students based on Total Activities
  const top5Students = useMemo(() => {
    return filteredStudents.slice(0, 5);
  }, [filteredStudents]);

  // Find current student's rank based on Total Activities
  const studentRankIndex = useMemo(() => {
    if (!student || student.isTeacher) return -1;
    return filteredStudents.findIndex(
      (s) => s.id === student.id || s.name.toLowerCase() === student.name.toLowerCase()
    );
  }, [filteredStudents, student]);

  const currentStudentFull = useMemo(() => {
    if (!student) return null;
    return (
      filteredStudents.find(
        (s) => s.id === student.id || s.name.toLowerCase() === student.name.toLowerCase()
      ) || student
    );
  }, [filteredStudents, student]);

  const levelInfo = calculateStudentLevel(student.points || 0);
  const studentReflections = reflections.filter((r) => r.studentId === student.id);

  // Group reflection scales
  const scaleCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  studentReflections.forEach((r) => {
    const s = Math.round(r.scale) as 1 | 2 | 3 | 4 | 5;
    if (scaleCounts[s] !== undefined) scaleCounts[s]++;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-yellow-600 px-5 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
              🏆
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-display leading-tight">Pasar Prestasi</h2>
                <span className="text-[10px] uppercase font-black tracking-wider bg-black/25 text-amber-200 px-2 py-0.5 rounded-full border border-amber-300/30">
                  Refleksia City
                </span>
              </div>
              <p className="text-xs text-amber-100 font-medium">
                Papan Peringkat (Top 5 Siswa Teraktif), Dewan Guru Pembimbing & Pengawas Sekolah
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            aria-label="Tutup Pasar Prestasi"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-850 px-4 sm:px-6 py-2 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('leaderboard');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Peringkat Siswa (Top 5 Aktivitas)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('teachers');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Dewan Guru Pembimbing ({TEACHER_ACCOUNTS.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('supervisors');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'supervisors'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Pengawas & Pimpinan ({SUPERVISORS_LIST.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('my_stats');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'my_stats'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Statistik & Lencana Saya</span>
          </button>
        </div>

        {/* Tab 1: Leaderboard (Top 5 Students by Activities) */}
        {activeTab === 'leaderboard' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Filter Bar & Sub-heading */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                    <span>🏆</span>
                    <span>5 Siswa Bintang Teraktif Refleksia</span>
                  </h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Didasarkan Jumlah Aktivitas Kota
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Peringkat dihitung dari total aktivitas: Login harian, menyelesaikan misi Balai Kota, refleksi, kuis, & pesan warga.
                </p>
              </div>

              {/* Class Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 self-stretch sm:self-auto justify-center shrink-0">
                {(['all', 'X DKV 2', 'X DKV 3'] as const).map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setClassFilter(cls);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      classFilter === cls
                        ? 'bg-amber-500 text-slate-950 font-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {cls === 'all' ? 'Seluruh Kelas' : cls}
                  </button>
                ))}
              </div>
            </div>

            {/* Informative Rule Guide Banner */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-slate-800/90 via-slate-850 to-amber-950/30 border border-amber-500/30 flex items-start gap-3 text-xs">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-base shrink-0 border border-amber-400/30 mt-0.5">
                ⚡
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-white text-xs sm:text-sm">
                  Komponen Penilaian Aktivitas Kota:
                </h5>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  🚪 <b>Login ke Kota</b> (+1) • 🎯 <b>Menyelesaikan Misi</b> (+1 per misi) • 📝 <b>Kirim Refleksi</b> (+1) • 💬 <b>Obrolan Warga</b> (+1) • 🛠️ <b>Kuis Bengkel</b> (+1)
                </p>
              </div>
            </div>

            {/* Top 3 Podium Visual Display */}
            {top5Students.length >= 3 && (
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-5 pb-2">
                {/* Juara 2 (Perak) */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-900 border-2 border-slate-300 shadow-lg flex items-center justify-center text-2xl font-black">
                      🥈
                    </div>
                    <span className="absolute -top-2 -right-1 text-xs px-1.5 py-0.2 rounded-full bg-slate-300 text-slate-900 font-black border border-white">
                      #2
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-200 line-clamp-1 max-w-[110px]">
                    {top5Students[1]?.name}
                  </h4>
                  <span className="text-[10px] text-slate-400">{top5Students[1]?.className}</span>

                  {/* Activity Badge - Primary Hero Metric */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-500 text-amber-300 font-black text-xs flex items-center gap-1 shadow">
                    <Zap className="w-3 h-3 text-yellow-300" />
                    <span>{top5Students[1]?.totalActivities || 0} Aktivitas</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {top5Students[1]?.points || 0} XP • 🎯 {top5Students[1]?.activityStats?.missions || 0} Misi
                  </div>

                  <div className="w-full h-16 sm:h-20 bg-gradient-to-t from-slate-800/90 to-slate-700/60 rounded-t-2xl mt-3 border-t-2 border-slate-400/80 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black text-slate-300">2</span>
                  </div>
                </div>

                {/* Juara 1 (Emas - Center & Highest) */}
                <div className="flex flex-col items-center text-center -translate-y-2">
                  <div className="relative mb-2">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-xl animate-bounce">
                      👑
                    </div>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 text-amber-950 border-2 border-yellow-300 shadow-xl shadow-amber-500/30 flex items-center justify-center text-3xl font-black">
                      🥇
                    </div>
                    <span className="absolute -top-2 -right-1 text-xs px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black border border-yellow-100 shadow">
                      #1
                    </span>
                  </div>
                  <h4 className="font-black text-xs sm:text-base text-yellow-300 line-clamp-1 max-w-[130px]">
                    {top5Students[0]?.name}
                  </h4>
                  <span className="text-[10px] sm:text-xs text-amber-200/80 font-semibold">{top5Students[0]?.className}</span>

                  {/* Activity Badge - Primary Hero Metric */}
                  <div className="mt-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-xs sm:text-sm shadow-md flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-slate-950 fill-current" />
                    <span>{top5Students[0]?.totalActivities || 0} Aktivitas</span>
                  </div>
                  <div className="text-[10px] text-amber-200 font-semibold mt-0.5">
                    {top5Students[0]?.points || 0} XP • 🎯 {top5Students[0]?.activityStats?.missions || 0} Misi
                  </div>

                  <div className="w-full h-22 sm:h-28 bg-gradient-to-t from-amber-950/80 via-amber-800/50 to-amber-600/60 rounded-t-2xl mt-3 border-t-2 border-amber-300 flex flex-col items-center justify-center shadow-lg">
                    <Crown className="w-5 h-5 text-yellow-300 mb-0.5" />
                    <span className="text-2xl sm:text-3xl font-black text-yellow-300">1</span>
                  </div>
                </div>

                {/* Juara 3 (Perunggu) */}
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-800 to-amber-600 text-amber-100 border-2 border-amber-500 shadow-lg flex items-center justify-center text-2xl font-black">
                      🥉
                    </div>
                    <span className="absolute -top-2 -right-1 text-xs px-1.5 py-0.2 rounded-full bg-amber-700 text-amber-100 font-black border border-amber-400">
                      #3
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-200 line-clamp-1 max-w-[110px]">
                    {top5Students[2]?.name}
                  </h4>
                  <span className="text-[10px] text-slate-400">{top5Students[2]?.className}</span>

                  {/* Activity Badge - Primary Hero Metric */}
                  <div className="mt-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-500 text-amber-300 font-black text-xs flex items-center gap-1 shadow">
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>{top5Students[2]?.totalActivities || 0} Aktivitas</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    {top5Students[2]?.points || 0} XP • 🎯 {top5Students[2]?.activityStats?.missions || 0} Misi
                  </div>

                  <div className="w-full h-12 sm:h-16 bg-gradient-to-t from-slate-800/90 to-amber-900/40 rounded-t-2xl mt-3 border-t-2 border-amber-600 flex items-center justify-center">
                    <span className="text-xl sm:text-2xl font-black text-amber-400">3</span>
                  </div>
                </div>
              </div>
            )}

            {/* Top 5 Detailed List Cards */}
            <div className="space-y-2.5 pt-2">
              {top5Students.map((st, idx) => {
                const isMe = student && !student.isTeacher && (st.id === student.id || st.name.toLowerCase() === student.name.toLowerCase());
                const rankNum = idx + 1;
                const medalBadge =
                  rankNum === 1
                    ? '🥇 Juara 1 Teraktif'
                    : rankNum === 2
                    ? '🥈 Juara 2 Teraktif'
                    : rankNum === 3
                    ? '🥉 Juara 3 Teraktif'
                    : `#${rankNum} Bintang Kota`;

                const stats = st.activityStats;

                return (
                  <div
                    key={st.id || idx}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isMe
                        ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                        : rankNum === 1
                        ? 'bg-gradient-to-r from-amber-950/40 to-slate-850 border-amber-500/50'
                        : 'bg-slate-800/70 border-slate-700/70 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* Rank Badge */}
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow mt-0.5 sm:mt-0 ${
                          rankNum === 1
                            ? 'bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950'
                            : rankNum === 2
                            ? 'bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900'
                            : rankNum === 3
                            ? 'bg-gradient-to-tr from-amber-700 to-amber-500 text-white'
                            : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {rankNum}
                      </div>

                      {/* Name & Activity breakdown info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs sm:text-sm text-white truncate max-w-[200px] sm:max-w-[320px]">
                            {st.name}
                          </h4>
                          {isMe && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                              Kamu
                            </span>
                          )}
                          <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-slate-900 border border-slate-700 text-slate-400">
                            {medalBadge}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span>{st.className}</span>
                          <span>•</span>
                          <span>No: {st.studentNumber || (idx + 1)}</span>
                          <span>•</span>
                          <span>{st.badges?.length || 0} Lencana</span>
                        </div>

                        {/* Breakdown badges */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5 text-[10px]">
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-blue-950/70 border border-blue-500/30 text-blue-300 font-bold"
                            title="Jumlah kali masuk ke Kota Refleksia"
                          >
                            🚪 {stats?.logins || 1} Login
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold"
                            title="Misi Balai Kota yang telah dituntaskan"
                          >
                            🎯 {stats?.missions || 0} Misi Selesai
                          </span>
                          <span
                            className="px-1.5 py-0.5 rounded-md bg-purple-950/70 border border-purple-500/30 text-purple-300 font-bold"
                            title="Refleksi pembelajaran di Taman Refleksi"
                          >
                            📝 {stats?.reflections || 0} Refleksi
                          </span>
                          {(stats?.chats || 0) > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded-md bg-sky-950/70 border border-sky-500/30 text-sky-300 font-bold"
                              title="Pesan interaktif di Obrolan Warga"
                            >
                              💬 {stats?.chats} Chat
                            </span>
                          )}
                          {(stats?.quizzes || 0) > 0 && (
                            <span
                              className="px-1.5 py-0.5 rounded-md bg-amber-950/70 border border-amber-500/30 text-amber-300 font-bold"
                              title="Tantangan kuis algoritma di Bengkel Latihan"
                            >
                              🛠️ {stats?.quizzes} Kuis
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Total Activities & XP Display */}
                    <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/60 sm:border-none flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                      <div className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1">
                        <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span>{st.totalActivities || 0}</span>
                        <span className="text-[11px] text-amber-300 font-bold">Aktivitas</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {st.points || 0} XP • Lvl {calculateStudentLevel(st.points || 0).level}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Student's Rank Alert if outside Top 5 */}
            {student && !student.isTeacher && studentRankIndex >= 5 && (
              <div className="p-3.5 rounded-2xl bg-slate-800 border border-cyan-500/40 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold shrink-0">
                    #{studentRankIndex + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-white truncate">Posisi Peringkat Aktivitas Kamu: #{studentRankIndex + 1}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Total {currentStudentFull?.totalActivities || 1} Aktivitas ({currentStudentFull?.activityStats?.logins || 1} Login, {currentStudentFull?.activityStats?.missions || 0} Misi) • Selesaikan misi kota untuk menembus 5 Besar!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer transition shrink-0"
                >
                  Selesaikan Misi (+Aktivitas)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Teachers Board */}
        {activeTab === 'teachers' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>👨‍🏫</span>
                <span>Dewan Guru Pembimbing DKV SMKN 2 Gorontalo</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pendidik profesional pendamping kejuruan Desain Komunikasi Visual & Informatika
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {TEACHER_ACCOUNTS.map((t) => (
                <div
                  key={t.username}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-amber-500/50 transition flex items-start gap-3 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-xl shrink-0 border border-emerald-400/30 shadow">
                    {t.gender === 'P' ? '👩‍🏫' : '👨‍🏫'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                        {t.name}
                      </h4>
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                        Guru DKV
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">@{t.username}</p>

                    <div className="mt-2 space-y-1">
                      <span className="text-[10px] font-bold text-amber-300 block">Mata Pelajaran:</span>
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.map((s) => (
                          <span
                            key={s}
                            className="text-[9px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700/80 text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Supervisors & Leadership */}
        {activeTab === 'supervisors' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>🏛️</span>
                <span>Dewan Pengawas & Pimpinan Pendidikan</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Aparatur pembina sekolah, penjamin mutu pendidikan kejuruan, dan pimpinan kota
              </p>
            </div>

            <div className="space-y-3">
              {SUPERVISORS_LIST.map((sp) => (
                <div
                  key={sp.id}
                  className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-blue-500/50 transition flex items-start gap-4 shadow-sm"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center text-2xl shrink-0 border border-blue-400/40 shadow">
                    {sp.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-sm sm:text-base text-white">
                        {sp.name}
                      </h4>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-500/40">
                        {sp.badge}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-amber-300 mt-0.5">{sp.role}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sp.institution}</p>
                    <p className="text-xs text-slate-300 mt-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 leading-relaxed">
                      {sp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: My Badges & Stats */}
        {activeTab === 'my_stats' && (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
            {/* Level Progress Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-850 border border-slate-700 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
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
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
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
                <Award className="w-4 h-4 text-amber-400" />
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
                          ? 'bg-slate-800 border-amber-500/50 shadow'
                          : 'bg-slate-850/40 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-2xl shrink-0 border border-slate-700">
                        {isUnlocked ? b.icon : <Lock className="w-5 h-5 text-slate-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-xs text-white">{b.title}</h5>
                          {isUnlocked && <CheckCircle className="w-3.5 h-3.5 text-amber-400" />}
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
                          className="h-full bg-amber-500 rounded-full"
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
        )}
      </div>
    </div>
  );
};
