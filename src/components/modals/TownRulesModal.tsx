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
      title: 'Lapor Kehadiran di Gerbang Selamat Datang Bersama Nawa',
      desc: 'Setiap warga (Siswa, Guru, maupun Tamu) yang login otomatis tercatat di Buku Tamu Gerbang Selamat Datang yang dijaga oleh Komandan Nawa (bertopi rimba pramuka cokelat). Sapa atau klik Nawa untuk mengetahui siapa saja warga yang masuk kota hari ini dan siapa yang terakhir masuk.',
      icon: '🦅',
      color: 'from-amber-500/20 to-yellow-600/10 border-amber-500/40 text-amber-300',
    },
    {
      no: 2,
      title: 'Kejujuran & Orisinalitas Refleksi (Tersinkron Spreadsheet v3.0)',
      desc: 'Tuliskan refleksi di Pusat Refleksi (Data_Refleksi_Siswa), Jurnal Harian Pohon Beringin (tampilan awal khusus Hari Ini & arsip Baca Catatan Warga), Kuis Lab DKV, serta Podcast Studio ON AIR murni dari hasil pemikiran dan pengalaman pribadimu sendiri.',
      icon: '✍️',
      color: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-300',
    },
    {
      no: 3,
      title: 'Etika & Kesantunan Berkomunikasi di Seluruh Area Kota',
      desc: 'Seluruh warga wajib bertutur kata sopan, santun, dan saling membangun di Obrolan Ruang Kelas, Monumen Air Mancur, Kotak Saran Wisma Guru, apresiasi catatan Pohon Beringin, maupun Surat Konsultasi ke Guru di Kantor Pos.',
      icon: '🤝',
      color: 'from-blue-500/20 to-cyan-600/10 border-blue-500/40 text-blue-300',
    },
    {
      no: 4,
      title: 'Menjaga Kelestarian Lingkungan & Hutan Refleksia',
      desc: 'Rawat lingkungan kota: siram pohon 3x (-1 XP/siram) hingga berbuah apel merah segar (+2 XP saat dipetik), pungut daun kering (tiap 5 daun = +1 XP), serta kunjungi Hutan Refleksia & Rumah Pohon Beringin melalui loket tiket Pak @Sufri (-5 XP).',
      icon: '🌱',
      color: 'from-lime-500/20 to-emerald-600/10 border-lime-500/40 text-lime-300',
    },
    {
      no: 5,
      title: 'Kompetisi Sehat di Leaderboard Mingguan & Koran Sudut Literasi',
      desc: 'Keaktifan XP 7 hari terakhir ditampilkan secara live di Leaderboard Mingguan Balai Kota dan Rangking Siswa Teraktif pada Koran Harian di Sudut Literasi. Semangat berlomba secara sehat dan saling mendukung!',
      icon: '🏆',
      color: 'from-purple-500/20 to-pink-600/10 border-purple-500/40 text-purple-300',
    },
    {
      no: 6,
      title: 'Aturan Khusus Mode Tamu Kota (Wartawan / Wartawati)',
      desc: 'Pengunjung Mode Tamu memilih gender Laki-laki (Wartawan) atau Wanita (Wartawati) dengan modal awal 10 XP. Tamu dapat berkeliling melihat kota dan menaiki Ayunan (-1 XP), namun tidak dapat masuk ke gedung belajar atau Hutan Refleksia.',
      icon: '📸',
      color: 'from-orange-500/20 to-red-600/10 border-orange-500/40 text-orange-300',
    },
  ];

  const studentActivities = [
    {
      title: 'Pos Penjaga Gerbang Selamat Datang (Komandan Nawa)',
      desc: 'Temui Nawa di depan Gerbang Selamat Datang (bertopi rimba pramuka cokelat, kemeja khaki dua saku, celana pendek cokelat tua ber-holster, kaus kaki panjang gelap & sepatu bot lapangan). Klik Nawa untuk melihat daftar warga yang login hari ini dan warga terakhir yang masuk ke kota!',
      icon: '🦅',
      badge: 'Log Masuk Hari Ini',
    },
    {
      title: 'Koran Sudut Literasi: Rangking Siswa Teraktif & Info Kota Terbaru',
      desc: 'Duduk atau buka Sudut Literasi bersama Ibu @Patra untuk membaca Koran Harian Refleksia City yang kini memuat Rangking Siswa Teraktif (Top XP & Leaderboard Mingguan), Info Kota Terbaru, Komik Cerita Rakyat, dan Majalah Desain DKV!',
      icon: '📰',
      badge: 'Koran & Ranking',
    },
    {
      title: 'Jurnal Harian Pohon Beringin (Tampilan Awal Hari Ini & Baca Catatan Warga)',
      desc: 'Buka Pohon Beringin untuk melihat tampilan awal khusus "📅 Info Jurnal Hari Ini", beralih ke tab "🌳 Baca Catatan Warga" untuk membaca seluruh arsip refleksi teman-temanmu, atau tempel catatan harianmu sendiri (+1 XP, tersinkron ke Spreadsheet)!',
      icon: '🌳',
      badge: 'Hari Ini • +1 XP',
    },
    {
      title: 'Leaderboard Mingguan Balai Kota (Top 5 Warga 7 Hari Terakhir)',
      desc: 'Pantau 5 warga dengan perolehan XP terbanyak dalam 7 hari terakhir di Balai Kota lengkap dengan rincian XP Refleksi, Tes Lab DKV, Podcast, dan Misi Harian yang tersinkronisasi langsung dengan Google Spreadsheet.',
      icon: '🏛️',
      badge: 'Top 5 Mingguan',
    },
    {
      title: 'Radio Kota 99.9 FM "Malam Tenang dari Antent" & Musik 5 Waktu',
      desc: 'Putar saluran favorit 99.9 FM "Malam Tenang dari Antent" yang berputar berulang (loop otomatis) serta mendukung link Google Drive pribadimu, atau pilih saluran musik lo-fi sesuai 5 waktu WITA di bagian atas layar.',
      icon: '📻',
      badge: '99.9 FM Loop',
    },
    {
      title: 'Siaran Podcast Interaktif di Studio ON AIR (Menara Mentor)',
      desc: 'Ngobrol santai bersama Host AI Mentor membahas materi yang dikuasai, area yang perlu diperkuat, saran AI, pertanyaan pemantik, hingga rencana belajar. Selesai podcast dapat +3 XP & otomatis terekam ke sheet Hasil_Podcast!',
      icon: '🎙️',
      badge: 'Suara AI • +3 XP',
    },
    {
      title: 'Kuis 5 Jenjang & Tantangan di Lab DKV',
      desc: 'Masuk ke gedung Lab DKV berlogo Atom bergerak untuk mengerjakan kuis berjenjang (Jenjang 1 Dasar s.d. Jenjang 5 Kreasi). Setiap jawaban benar meraih +1 XP dan hasilnya otomatis tersinkron ke sheet Hasil_Tes_Lab_DKV.',
      icon: '⚛️',
      badge: 'Lab DKV • +1 XP/Soal',
    },
    {
      title: 'Menulis Refleksi Materi di Pusat Refleksi',
      desc: 'Pilih materi pelajaran dan skala pemahaman (1–5), tuliskan refleksi belajarmu, dan dapatkan umpan balik instan serta +1 XP otomatis yang langsung tersinkron ke sheet Data_Refleksi_Siswa!',
      icon: '🌍',
      badge: 'Refleksi • +1 XP',
    },
    {
      title: 'Hutan Refleksia, Rumah Pohon Beringin & Tiket Pak @Sufri',
      desc: 'Beli tiket masuk Hutan Refleksia (-5 XP) di Pos Penjaga Hutan Pak @Sufri untuk menjelajahi pepohonan rimbun, memetik apel hutan, serta naik ke Rumah Pohon Beringin untuk menikmati panorama kota dari ketinggian!',
      icon: '🏡',
      badge: 'Tiket Hutan -5 XP',
    },
    {
      title: 'Belajar Baca Iqro (1–6) & Tuntunan Sholat di Masjid Al-Hikmah',
      desc: 'Kunjungi Masjid Al-Hikmah untuk belajar membaca Iqro Jilid 1 s.d. 6 lengkap dengan audio makhraj/tajwid, serta panduan 13 gerakan & bacaan Tuntunan Sholat, Niat 5 Waktu, dan Wudhu (+1 XP per jilid/amalan)!',
      icon: '🕌',
      badge: 'Iqro 1-6 & Sholat',
    },
    {
      title: 'Menyiram Pohon (3x), Petik Apel (+2 XP) & Pungut Daun Kering',
      desc: 'Siram pohon 3 kali (-1 XP/siram) hingga berbuah apel merah segar (+2 XP saat dipetik), serta pungut daun kering yang gugur di taman (setiap 5 daun kering otomatis mendapat +1 XP)!',
      icon: '🍎',
      badge: 'Alam • +XP',
    },
    {
      title: 'Memancing Interaktif, Kafe Warga, Api Unggun & Ayunan',
      desc: 'Memancing di Dermaga Kolam Timur (-3 XP), beli Kopi/Roti/Eskrim di Kafe Warga, duduk bersama teman di Bangku Taman & Api Unggun, atau naik Ayunan Relaksasi (-1 XP, juga bisa diakses Tamu Kota!).',
      icon: '🎠',
      badge: 'Santai & Ayunan',
    },
    {
      title: 'Pasar Prestasi, Kantor Pos Kilat & Kotak Saran Wisma Guru',
      desc: 'Cek Kartu Warga & Leaderboard di Pasar Prestasi, kirim surat konsultasi ke Guru di Kantor Pos (tersinkron ke Pesan_Kantor_Pos), atau sampaikan ide di Kotak Saran depan Wisma Guru.',
      icon: '📮',
      badge: 'Pos & Aspirasi',
    },
  ];

  const teacherActivities = [
    {
      title: 'Bank Materi Guru & Distribusi Otomatis ke 9 Gedung Kota',
      desc: 'Buka gedung Bank Materi Guru untuk menginput Tujuan Pembelajaran (TP) & Materi Esensial. Sistem AI otomatis menyusun modul Perpustakaan, pertanyaan Refleksi, topik Podcast, misi Balai Kota, dan kuis 5 jenjang Lab DKV!',
      icon: '🏦',
      badge: 'Bank Materi AI',
    },
    {
      title: 'Monitoring Sinkronisasi Google Spreadsheet v3.0 Lengkap',
      desc: 'Memantau seluruh aktivitas warga yang tersinkron otomatis ke Google Spreadsheet: Data_Refleksi_Siswa, Pesan_Kantor_Pos, Hasil_Tes_Lab_DKV, Hasil_Podcast, Jurnal_Pohon_Beringin, Leaderboard Mingguan (Log_XP_Mingguan), dan Pasar_Prestasi.',
      icon: '📊',
      badge: 'Spreadsheet v3.0',
    },
    {
      title: 'Papan Pengumuman Guru di Halaman Balai Kota',
      desc: 'Menulis pengumuman resmi penting, info kelas, atau misi baru di Papan Pengumuman Guru samping Balai Kota yang juga otomatis tampil di Berita Utama Koran Sudut Literasi.',
      icon: '📢',
      badge: 'Pengumuman Kota',
    },
    {
      title: 'Memberikan Umpan Balik (Feedback) & Membalas Surat Kantor Pos',
      desc: 'Memberikan apresiasi dan evaluasi pada refleksi siswa, membalas surat konsultasi di Kantor Pos Kilat, serta membaca aspirasi warga pada Kotak Saran Wisma Guru.',
      icon: '📬',
      badge: 'Bimbingan Guru',
    },
    {
      title: 'Memantau Kehadiran Gerbang Utama (Nawa) & Leaderboard Mingguan',
      desc: 'Melihat daftar siswa yang login hari ini melalui laporan Komandan Nawa di Gerbang Selamat Datang serta mengevaluasi Top 5 warga teraktif 7 hari terakhir di Balai Kota.',
      icon: '🦅',
      badge: 'Pantau Kehadiran',
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
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold font-display leading-tight">
                  Papan Peraturan & Panduan Kota (Edisi Terbaru)
                </h2>
                <span className="text-[10px] uppercase font-black tracking-wider bg-black/25 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-300/30">
                  Gapura Utama • v3.0
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">
                Pedoman Tata Tertib, Pos Penjaga Gerbang Nawa, Aktivitas Siswa, & Sinkronisasi Spreadsheet Kota Refleksia
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
            <span>Peraturan & Etika Kota ({townRules.length} Prinsip)</span>
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
                  🦅
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Selamat Datang di Gerbang Utama Kota Refleksia!
                  </h3>
                  <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">
                    Di depan Gerbang Selamat Datang, <strong>Komandan Nawa</strong> siap menyambut dan mencatat setiap warga yang masuk hari ini. Baca panduan terbaru di bawah ini sebelum menjelajahi gedung belajar, Hutan Refleksia, Sudut Literasi, dan Pohon Beringin!
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
