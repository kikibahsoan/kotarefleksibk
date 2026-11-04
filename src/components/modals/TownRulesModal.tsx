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
      desc: 'Tuliskan catatan refleksi belajar di Taman Refleksi, Jurnal Harian Pohon Beringin, maupun sesi obrolan Podcast di Studio ON AIR murni dari hasil pemikiran dan pengalaman pribadimu sendiri.',
      icon: '✍️',
      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300',
    },
    {
      no: 2,
      title: 'Etika & Kesantunan Berkomunikasi',
      desc: 'Seluruh warga wajib bertutur kata sopan, santun, dan saling membangun baik di Obrolan Ruang Kelas, Monumen Warga, apresiasi catatan Pohon Beringin, maupun surat ke Guru di Kantor Pos.',
      icon: '🤝',
      color: 'from-blue-500/20 to-cyan-600/10 border-blue-500/40 text-blue-300',
    },
    {
      no: 3,
      title: 'Menjaga Kelestarian, Kebersihan & Keasrian Kota',
      desc: 'Rawat lingkungan kota bersama: siram pohon 3x (-1 XP/siram) hingga berbuah apel segar lalu petik (+2 XP), pungut daun kering yang gugur di taman (tiap 5 dari 10 daun = +1 XP), serta tertib memancing dan membaca.',
      icon: '🌱',
      color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-300',
    },
    {
      no: 4,
      title: 'Komitmen Belajar, Podcast AI & 5 Misi Harian',
      desc: 'Hadir setiap hari di Refleksia City untuk menjaga streak belajar, berdiskusi santai bersama Host AI Mentor di Studio ON AIR, mengerjakan kuis Lab DKV, dan menuntaskan 5 misi harian Balai Kota.',
      icon: '🔥',
      color: 'from-orange-500/20 to-red-600/10 border-orange-500/40 text-orange-300',
    },
    {
      no: 5,
      title: 'Sportivitas & Kolaborasi Apresiasi Warga',
      desc: 'Papan Peringkat di Pasar Prestasi dan catatan di Pohon Beringin adalah sarana motivasi positif bersama. Saling beri tanda Suka (❤️) dan dukung capaian rekan siswa DKV SMKN 2 Gorontalo.',
      icon: '🏆',
      color: 'from-purple-500/20 to-pink-600/10 border-purple-500/40 text-purple-300',
    },
  ];

  const studentActivities = [
    {
      title: 'Belajar Baca Iqro (1–6) & Tuntunan Sholat di Masjid Al-Hikmah',
      desc: 'Kunjungi Masjid Al-Hikmah di samping kolam awal aliran sungai untuk belajar membaca Iqro Jilid 1 s.d. 6 lengkap dengan audio makhraj/tajwid & latihan baris, serta panduan 13 gerakan & bacaan Tuntunan Sholat, Niat 5 Waktu, dan Wudhu (+1 XP per jilid/amalan)!',
      icon: '🕌',
      badge: 'Iqro 1-6 & Sholat • +XP',
    },
    {
      title: 'Siaran Podcast Interaktif di Studio ON AIR (Menara Mentor)',
      desc: 'Ngobrol santai bersama Host AI Mentor cewek yang ramah (bersuara otomatis & bisa dijawab lewat mikrofon suara atau ketikan) membahas materi yang dikuasai, area yang perlu diperkuat, saran AI, pertanyaan pemantik, hingga rencana belajar. Selesai podcast dapat +3 XP & terekam di Spreadsheet!',
      icon: '🎙️',
      badge: 'Suara AI • +3 XP',
    },
    {
      title: 'Menyiram Pohon (3x) & Memetik Buah Apel Segar',
      desc: 'Pohon belum berbuah saat baru login. Dekati pohon dan siram 3 kali (-1 XP per siraman). Saat siraman ke-3, pohon mengeluarkan buah apel merah segar yang bisa dipetik untuk mendapatkan +2 XP!',
      icon: '🍎',
      badge: 'Petik Apel • +2 XP',
    },
    {
      title: 'Peduli Lingkungan: Memungut 10 Daun Kering',
      desc: 'Terdapat 10 daun kering yang tersebar alami di area kota (kota tetap tampak bersih). Klik atau dekati daun kering untuk memungutnya—setiap terkumpul 5 daun kering otomatis mendapat +1 XP!',
      icon: '🍂',
      badge: '5 Daun = +1 XP',
    },
    {
      title: 'Jurnal Harian Sticky Note di Pohon Beringin',
      desc: 'Dekati Pohon Beringin di belakang Balai Kota untuk menempelkan Sticky Note refleksi harianmu (+1 XP). Tersimpan di Spreadsheet sehingga bisa dilihat dan disukai (❤️) oleh seluruh warga kota!',
      icon: '🌳',
      badge: 'Spreadsheet • +1 XP',
    },
    {
      title: 'Menulis Refleksi Materi di Taman Refleksi',
      desc: 'Pilih materi pelajaran dan skala pemahaman (1–5), tuliskan rangkuman materi, hal menarik, serta kesulitan belajarmu. Dapatkan +1 XP otomatis setiap mengirimkan refleksi!',
      icon: '🌍',
      badge: 'Refleksi • +1 XP',
    },
    {
      title: 'Kuis & Tantangan di Lab DKV',
      desc: 'Masuk ke gedung Lab DKV berlogo Atom bergerak untuk menguji pemahaman materi kejuruan dan berpikir komputasional melalui kuis interaktif (+1 XP tiap jawaban benar).',
      icon: '⚛️',
      badge: 'Kuis • +1 XP/Soal',
    },
    {
      title: 'Memancing Interaktif di Dermaga Kolam Timur',
      desc: 'Mulai memancing (-3 XP) dengan animasi melempar joran ke kolam. Saat umpan bergoyang, klik tombol interaktif "🎣 Angkat Pancing!" untuk menangkap ikan unik atau botol pesan bijak!',
      icon: '🎣',
      badge: 'Lempar & Angkat',
    },
    {
      title: 'Belajar Mandiri & Baca Modul di Perpustakaan',
      desc: 'Pelajari modul Berpikir Komputasional, dasar Desain Komunikasi Visual, serta bahan ajar terbaru dari guru pembimbing, lalu lanjutkan ke refleksi materi.',
      icon: '📚',
      badge: 'Modul Belajar',
    },
    {
      title: 'Menuntaskan 5 Misi Harian di Balai Kota',
      desc: 'Cek 5 misi acak harianmu di Balai Kota (mengunjungi gedung, kuis, refleksi, atau menyapa di obrolan). Setiap misi tuntas langsung menambah XP otomatis ke saldomu!',
      icon: '🏛️',
      badge: 'Misi Otomatis',
    },
    {
      title: 'Beli Kopi, Roti & Eskrim di Kafe Warga',
      desc: 'Kunjungi Toko Roti & Kafe untuk membeli Kopi Hangat (-2 XP, 90 dtk), Roti Panggang (-1 XP, 60 dtk), atau Eskrim (-1 XP, 30 dtk) yang langsung dipegang oleh avatarmu sambil jalan-jalan!',
      icon: '☕',
      badge: 'Item Dipegang',
    },
    {
      title: 'Membaca di Sudut Literasi Bersama Ibu Patra',
      desc: 'Duduk santai di bangku Sudut Literasi (-1 XP) untuk membaca Komik Edukasi DKV, Majalah Seni & Tipografi, atau Koran Harian Warga Kora.',
      icon: '📖',
      badge: 'Komik & Majalah',
    },
    {
      title: 'Bangku Taman (2 Orang), Api Unggun & Ayunan',
      desc: 'Duduk santai berdua bersama teman di Bangku Air Mancur, hangatkan tubuh di Bangku Api Unggun pojok kota, atau naik Ayunan Relaksasi (-1 XP) sambil berbincang.',
      icon: '🎠',
      badge: 'Santai & Ayunan',
    },
    {
      title: 'Menu Ekspresi Avatar (Radial Emotes) & Radio 5 Waktu',
      desc: 'Klik avatarmu sendiri untuk Joget Musik (🎵), Suka (❤️), Tertawa (😂), atau Lambai (👋), serta nyalakan Radio Kota di atas layar yang memutar musik sesuai 5 waktu WITA.',
      icon: '🎵',
      badge: 'Emote & Radio',
    },
    {
      title: 'Obrolan Kota (24 Jam) & Radar Warga Online',
      desc: 'Mengobrol langsung dengan teman di panel Obrolan bawah layar atau Monumen Air Mancur, serta klik nama teman pada daftar Warga Online di kiri atas untuk menghampirinya.',
      icon: '⛲',
      badge: 'Chat & Radar',
    },
    {
      title: 'Pasar Prestasi & Kantor Pos Kilat',
      desc: 'Pantau Leaderboard XP tertinggi, galeri lencana, & Dewan Guru di Pasar Prestasi (terekam di Spreadsheet), atau kirim pesan konsultasi privat ke Guru di Kantor Pos.',
      icon: '🏆',
      badge: 'Peringkat & Pos',
    },
  ];

  const teacherActivities = [
    {
      title: 'Monitoring Refleksi, Jurnal Beringin & Riwayat Podcast AI',
      desc: 'Memantau seluruh catatan refleksi siswa X DKV 2 & X DKV 3, catatan Sticky Note Pohon Beringin, serta transkrip hasil obrolan Podcast Studio ON AIR yang tersinkronisasi dengan Spreadsheet.',
      icon: '📊',
      badge: 'Sinkron Spreadsheet',
    },
    {
      title: 'Memberikan Umpan Balik (Feedback) & Evaluasi',
      desc: 'Menuliskan catatan apresiasi, komentar bimbingan, dan evaluasi langsung yang dapat dibaca siswa serta memantau ketercapaian langkah rencana belajar.',
      icon: '✍️',
      badge: 'Umpan Balik',
    },
    {
      title: 'Membalas Surat & Konsultasi Siswa di Kantor Pos',
      desc: 'Menjawab pertanyaan dan konsultasi belajar yang dikirimkan secara personal oleh siswa melalui loket Kantor Pos Kilat.',
      icon: '📬',
      badge: 'Respon Siswa',
    },
    {
      title: 'Mengelola Materi & Modul Baru di Perpustakaan',
      desc: 'Mengunggah bahan ajar baru, modul berpikir komputasional, referensi karya desain DKV, dan tujuan pembelajaran kota.',
      icon: '📚',
      badge: 'Kelola Modul',
    },
    {
      title: 'Mengawasi Capaian Prestasi & Papan Peringkat',
      desc: 'Memantau perkembangan poin XP, keaktifan misi harian, dan lencana prestasi siswa di Pasar Prestasi secara real-time.',
      icon: '🏆',
      badge: 'Apresiasi XP',
    },
    {
      title: 'Pengaturan Kota & Sinkronisasi Google Spreadsheet 2.6',
      desc: 'Mengonfigurasi tautan Google Apps Script Spreadsheet (merekam Refleksi, Jurnal Pohon Beringin, Podcast Studio ON AIR, dan Pasar Prestasi) serta PIN Guru.',
      icon: '⚙️',
      badge: 'Spreadsheet 2.6',
    },
    {
      title: 'Berinteraksi Langsung di Dunia Virtual',
      desc: 'Menjelajahi Refleksia City dengan avatar Guru Pembimbing atau Master Guru Penjelajah Waktu untuk menyapa dan memotivasi siswa secara langsung.',
      icon: '🏛️',
      badge: 'Avatar Guru',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-sm animate-backdrop-fade">
      <div className="bg-[#121e2c]/82 backdrop-blur-xl border border-slate-600/60 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-100 animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-cyan-700/90 px-5 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shadow-lg">
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
                Pedoman Tata Tertib, Seluruh Aktivitas Terbaru Siswa, dan Peran Guru di Refleksia City
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
        <div className="bg-slate-900/55 px-4 sm:px-6 py-2 border-b border-slate-700/60 flex items-center gap-2 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setActiveTab('rules');
            }}
            className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'rules'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
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
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Backpack className="w-4 h-4" />
            <span>Aktivitas & Panduan Siswa ({studentActivities.length})</span>
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
                : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Peran Guru & Pengawas ({teacherActivities.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tab 1: Rules & Ethics */}
          {activeTab === 'rules' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900/60 to-slate-900/60 border border-emerald-500/30 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xl">
                  🏛️
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Selamat Datang di Gerbang Utama Kota Refleksia!
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                    Refleksia City adalah ekosistem belajar digital interaktif untuk siswa Desain Komunikasi Visual (DKV) SMKN 2 Gorontalo. Jelajahi seluruh fasilitas kota, kumpulkan XP melalui aktivitas belajar & kepedulian lingkungan, serta jaga selalu ketertiban bersama.
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
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Student Guide */}
          {activeTab === 'student_guide' && (
            <div className="space-y-4 animate-fade-in">
              <div className="pb-2 border-b border-slate-700/60">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>🎒</span>
                  <span>Panduan Lengkap Seluruh Aktivitas Siswa di Refleksia City</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Berikut seluruh kegiatan belajar, refleksi, podcast AI, dan interaksi lingkungan terbaru yang bisa kamu lakukan di dalam kota:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {studentActivities.map((act, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-2xl bg-slate-800/65 border border-slate-700/80 hover:border-emerald-500/50 transition flex items-start gap-3 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                      {act.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="font-extrabold text-xs sm:text-sm text-white leading-snug">
                          {act.title}
                        </h4>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 shrink-0">
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
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
              <div className="pb-2 border-b border-slate-700/60">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>👨‍🏫</span>
                  <span>Wewenang & Peran Guru Pembimbing serta Pengawas</span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Fasilitas pemantauan asesmen, bimbingan refleksi, riwayat podcast, dan tata kelola pembelajaran
                </p>
              </div>

              <div className="space-y-3">
                {teacherActivities.map((tact, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-slate-800/65 border border-slate-700/80 hover:border-teal-500/50 transition flex items-start gap-3.5 shadow-sm"
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
                      <p className="text-xs text-slate-200 mt-1 leading-relaxed">
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
        <div className="bg-slate-900/65 px-5 sm:px-6 py-3 border-t border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
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
