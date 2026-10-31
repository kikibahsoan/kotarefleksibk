import React, { useState } from 'react';
import { Student } from '../../types/index.ts';
import { sounds } from '../../utils/audio.ts';
import {
  X,
  ScrollText,
  Backpack,
  GraduationCap,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  PenTool,
  Trophy,
  MessageCircle,
  Coffee,
  Fish,
  Music,
  Mail,
  ShieldCheck,
  Compass,
  Sparkles,
  Users,
  HeartHandshake,
} from 'lucide-react';

interface TownRulesModalProps {
  onClose: () => void;
  student?: Student | null;
}

export const TownRulesModal: React.FC<TownRulesModalProps> = ({ onClose, student }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'student_guide' | 'teacher_guide'>('rules');

  const townRules = [
    {
      no: 1,
      title: 'Kejujuran & Orisinalitas Refleksi',
      desc: 'Tuliskan catatan refleksi belajar murni dari hasil pemikiran, pemahaman, dan pengalaman pribadi. Dilarang menyalin (copy-paste) atau menjiplak tulisan orang lain.',
      icon: '✍️',
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300',
    },
    {
      no: 2,
      title: 'Etika & Kesantunan Berkomunikasi',
      desc: 'Seluruh warga wajib bertutur kata sopan, santun, dan saling membangun baik di Ruang Obrolan Monumen Warga maupun surat menyurat di Kantor Pos. Dilarang keras ujaran kebencian, perundungan, dan spam.',
      icon: '🤝',
      color: 'from-blue-500/20 to-cyan-600/10 border-blue-500/40 text-blue-300',
    },
    {
      no: 3,
      title: 'Menjaga Kelestarian & Keasrian Kota',
      desc: 'Rawat fasilitas kota bersama: rajin menyiram tanaman di Kebun Botani (+2 XP), tertib memancing di Danau Timur (+2 XP), membaca rapi di Sudut Literasi, dan menjaga kebersihan lingkungan.',
      icon: '🌱',
      color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-300',
    },
    {
      no: 4,
      title: 'Komitmen Belajar & Streak Harian',
      desc: 'Hadir di kota Refleksia minimal satu kali setiap hari untuk menjaga nyala api streak belajar, memeriksa pengumuman guru, dan menuntaskan 5 misi harian untuk meraih bonus XP.',
      icon: '🔥',
      color: 'from-orange-500/20 to-red-600/10 border-orange-500/40 text-orange-300',
    },
    {
      no: 5,
      title: 'Sportivitas & Kolaborasi Apresiasi',
      desc: 'Papan Peringkat di Pasar Prestasi merupakan sarana motivasi positif bersama. Saling dukung dan hargai karya serta capaian sesama rekan siswa DKV SMKN 2 Gorontalo.',
      icon: '🏆',
      color: 'from-purple-500/20 to-pink-600/10 border-purple-500/40 text-purple-300',
    },
  ];

  const studentActivities = [
    {
      title: 'Menulis Refleksi di Taman Refleksi',
      desc: 'Pilih skala pemahaman (1-5), tuangkan rangkuman materi, hal menarik, dan kesulitan belajarmu. Dapatkan +3 XP setiap mengirimkan refleksi!',
      icon: '🌿',
      badge: '+3 XP',
    },
    {
      title: 'Belajar Mandiri di Perpustakaan',
      desc: 'Pelajari modul Berpikir Komputasional (IPO, Sistem Operasi, Komputasi Data) dan referensi kejuruan Desain Komunikasi Visual.',
      icon: '📖',
      badge: 'Modul PDF',
    },
    {
      title: 'Menuntaskan 5 Misi Harian',
      desc: 'Kerjakan misi acak setiap hari seperti menyiram tanaman, memancing, membaca literasi, dan berdiskusi untuk mempercepat kenaikan level.',
      icon: '🎯',
      badge: '15 XP Total',
    },
    {
      title: 'Memantau Peringkat di Pasar Prestasi',
      desc: 'Lihat posisi 5 siswa dengan XP tertinggi di seluruh kelas, kenali dewan guru pembimbing, dan kumpulkan galeri lencana prestasi.',
      icon: '🏆',
      badge: 'Top 5 XP',
    },
    {
      title: 'Sapa & Berdiskusi di Air Mancur Monumen Warga',
      desc: 'Berbincang hangat di ruang obrolan publik bersama teman-teman kelas X DKV 2 dan X DKV 3 dalam lingkungan yang ramah.',
      icon: '⛲',
      badge: 'Chat Publik',
    },
    {
      title: 'Beristirahat di Toko Roti & Kafe Ma Uba',
      desc: 'Beli secangkir kopi hangat, roti lezat, atau es krim menyegarkan, lalu nikmati di bangku taman bersama teman.',
      icon: '☕',
      badge: 'Kantin Warga',
    },
    {
      title: 'Memancing di Kolam Timur',
      desc: 'Nikmati suasana tenang di dermaga kayu kolam pemancingan air tawar untuk melatih fokus dan kesabaran (+2 XP).',
      icon: '🎣',
      badge: '+2 XP',
    },
    {
      title: 'Membaca di Sudut Literasi Bersama Ibu Patra',
      desc: 'Duduk santai di gazebo literasi membaca Komik Interaktif DKV, Majalah Desain Tipografi, atau Koran Warga Kora.',
      icon: '📚',
      badge: 'Sudut Baca',
    },
    {
      title: 'Menaiki Ayunan Relaksasi',
      desc: 'Duduk berayun santai di bawah rindangnya pepohonan taman kota untuk menyegarkan konsentrasi belajar.',
      icon: '🎠',
      badge: 'Relaksasi',
    },
    {
      title: 'Menu Emosi Melingkar (Radial Emotes)',
      desc: 'Klik avatar diri sendiri kapan saja untuk berjoget (🎵), memberi cinta (❤️), tertawa ceria (😂), atau melambaikan tangan (👋).',
      icon: '🎭',
      badge: 'Interaktif',
    },
    {
      title: 'Kirim Surat Privat ke Guru di Kantor Pos',
      desc: 'Konsultasikan kesulitan belajar atau tanyakan materi secara privat kepada Bapak/Ibu Guru pembimbing.',
      icon: '📬',
      badge: 'Konsultasi',
    },
  ];

  const teacherActivities = [
    {
      title: 'Monitoring Refleksi & Pemahaman Siswa',
      desc: 'Membaca dan memantau seluruh catatan refleksi dari siswa X DKV 2 & X DKV 3 secara terpusat di Balai Kota.',
      icon: '📊',
      badge: 'Pantau Siswa',
    },
    {
      title: 'Memberikan Umpan Balik (Feedback)',
      desc: 'Menuliskan catatan apresiasi, komentar bimbingan, dan evaluasi langsung yang dapat dibaca di buku refleksi siswa.',
      icon: '✍️',
      badge: 'Umpan Balik',
    },
    {
      title: 'Membalas Surat & Pesan Siswa di Kantor Pos',
      desc: 'Menjawab pertanyaan dan konsultasi belajar yang dikirimkan secara personal oleh siswa di loket Kantor Pos.',
      icon: '📬',
      badge: 'Respon Siswa',
    },
    {
      title: 'Mengelola Materi & Modul Baru di Perpustakaan',
      desc: 'Mengunggah bahan ajar baru, modul berpikir komputasional, referensi karya desain, dan pertanyaan pemantik refleksi.',
      icon: '📚',
      badge: 'Kelola Modul',
    },
    {
      title: 'Mengawasi Capaian Prestasi & Papan Peringkat',
      desc: 'Memantau dinamika persaingan sehat poin XP siswa di Pasar Prestasi serta menganugerahkan lencana keaktifan.',
      icon: '🏆',
      badge: 'Apresiasi XP',
    },
    {
      title: 'Pengaturan Kota & Rekapitulasi Data',
      desc: 'Mengonfigurasi kalender tahun ajaran, tautan sinkronisasi Google Spreadsheet nilai, serta Master PIN akses.',
      icon: '⚙️',
      badge: 'Sistem Kota',
    },
    {
      title: 'Berinteraksi Langsung di Dunia Virtual',
      desc: 'Jelajahi kota Refleksia dengan avatar resmi Guru Pembimbing / Master Guru untuk menyapa siswa secara langsung.',
      icon: '🏛️',
      badge: 'Avatar Guru',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 px-5 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold font-display leading-tight">
                  Papan Peraturan & Panduan Kota
                </h2>
                <span className="text-[10px] uppercase font-black tracking-wider bg-black/25 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300/30">
                  Gapura Utama
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Pedoman Tata Tertib, Aktivitas Siswa, dan Peran Guru di Refleksia City
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            aria-label="Tutup Papan Peraturan"
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
              setActiveTab('rules');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ScrollText className="w-4 h-4" />
            <span>Peraturan & Etika Kota (5 Prinsip)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('student_guide');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'student_guide'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Backpack className="w-4 h-4" />
            <span>Hal yang Bisa Dilakukan Siswa ({studentActivities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('teacher_guide');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'teacher_guide'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Hal yang Bisa Dilakukan Guru & Pengawas ({teacherActivities.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tab 1: Rules & Ethics */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-850 to-slate-850 border border-emerald-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl">
                  🏛️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Selamat Datang di Gerbang Utama Kota Refleksia!
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                    Refleksia City adalah ekosistem belajar digital terbuka untuk siswa Desain Komunikasi Visual (DKV) SMKN 2 Gorontalo. Setiap warga kota diharapkan menjunjung tinggi nilai integritas, rasa ingin tahu, dan persahabatan.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {townRules.map((r) => (
                  <div
                    key={r.no}
                    className={`p-4 rounded-2xl bg-gradient-to-r ${r.color} border transition flex items-start gap-3.5 shadow-sm`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-900/80 border border-slate-700/80 text-white font-black text-sm flex items-center justify-center shrink-0">
                      {r.no}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{r.icon}</span>
                        <h4 className="font-extrabold text-sm text-white">{r.title}</h4>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Student Guide */}
          {activeTab === 'student_guide' && (
            <div className="space-y-4 animate-fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>🎒</span>
                  <span>Panduan Aktivitas Siswa di Refleksia City</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Beragam kegiatan interaktif yang dapat kamu lakukan untuk mengumpulkan XP dan mengasah keahlian
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentActivities.map((act, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 transition flex items-start gap-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {act.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">
                          {act.title}
                        </h4>
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/40 shrink-0">
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        {act.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Teacher Guide */}
          {activeTab === 'teacher_guide' && (
            <div className="space-y-4 animate-fade-in">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>👨‍🏫</span>
                  <span>Wewenang & Peran Guru Pembimbing serta Pengawas</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fasilitas pemantauan asesmen, bimbingan refleksi, dan tata kelola pembelajaran
                </p>
              </div>

              <div className="space-y-3">
                {teacherActivities.map((tact, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 hover:border-teal-500/50 transition flex items-start gap-3.5 shadow-sm"
                  >
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-600 text-white flex items-center justify-center text-xl shrink-0 shadow">
                      {tact.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-xs sm:text-sm text-white">
                          {tact.title}
                        </h4>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-950 text-teal-300 border border-teal-500/40 shrink-0">
                          {tact.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        {tact.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-850 px-5 sm:px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">SMKN 2 Gorontalo • Program Keahlian Desain Komunikasi Visual</span>
            <span className="sm:hidden">SMKN 2 Gorontalo DKV</span>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow transition cursor-pointer"
          >
            Mengerti & Masuk Kota
          </button>
        </div>
      </div>
    </div>
  );
};
