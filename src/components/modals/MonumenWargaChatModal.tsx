import React, { useState } from 'react';
import { Student } from '../../types/index.ts';
import {
  X,
  Bell,
  BookOpen,
  Sparkles,
  Calendar,
  CheckCircle2,
  Users,
  Compass,
  Trophy,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

interface PapanInformasiModalProps {
  onClose: () => void;
  student: Student;
}

export const MonumenWargaChatModal: React.FC<PapanInformasiModalProps> = ({
  onClose,
  student,
}) => {
  const [activeTab, setActiveTab] = useState<'pengumuman' | 'tips' | 'jadwal' | 'warga'>('pengumuman');

  const isDkv3 = student.className.includes('DKV 3');
  const myClassShort = isDkv3 ? 'X DKV 3' : 'X DKV 2';

  const announcements = [
    {
      id: 'ann-1',
      title: 'Materi Aktif: Model Input-Process-Output (IPO) & Arsitektur Von Neumann',
      category: 'Akademik',
      date: 'Hari ini',
      urgent: true,
      content:
        'Siswa X DKV 2 dan X DKV 3 diharapkan menyelesaikan modul pembelajaran di Perpustakaan dan mengisi refleksi mandiri di Taman Refleksi sebelum akhir pekan ini. Evaluasi AI Mentor akan langsung diproses setelah pengisian.',
    },
    {
      id: 'ann-2',
      title: 'Tantangan Mingguan: Peran Sistem Operasi dalam Penjadwalan Proses',
      category: 'Tantangan',
      date: '2 hari lalu',
      urgent: false,
      content:
        'Uji pemahamanmu tentang antrean FIFO dan Shortest Job First di Bengkel Latihan. Dapatkan tambahan +30 XP dan lencana khusus jika mencapai skor sempurna!',
    },
    {
      id: 'ann-3',
      title: 'Integrasi Nilai ke Ruang Guru SMK Negeri 2 Gorontalo',
      category: 'Sistem',
      date: 'Minggu ini',
      urgent: false,
      content:
        'Setiap refleksi yang kamu kirimkan otomatis tersinkronisasi dengan Google Spreadsheet guru mata pelajaran. Pastikan mengisi refleksi dengan jujur dan orisinal.',
    },
  ];

  const reflectionTips = [
    {
      step: '1',
      title: 'Jujur pada Kesulitan yang Dialami',
      desc: 'Tuliskan secara spesifik bagian materi yang masih membingungkan. AI Mentor Kota dirancang untuk membantumu, bukan menghakimi.',
    },
    {
      step: '2',
      title: 'Hubungkan dengan Praktik Desain DKV',
      desc: 'Kaitkan konsep komputasi dengan kegiatan sehari-hari, misalnya proses render grafis, manajemen layer Photoshop, atau antrean cetak poster.',
    },
    {
      step: '3',
      title: 'Tentukan Rencana Aksi yang Konkret',
      desc: 'Buat komitmen belajar sederhana, misalnya membaca ulang modul 15 menit atau mencoba kuis latihan kembali.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border border-white/20 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl shadow-inner border border-emerald-500/30">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white font-display">
                  Papan Informasi Refleksia
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Resmi Kota
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium">
                Pusat Pengumuman, Misi Pembelajaran & Buletin Warga {myClassShort}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Papan Informasi"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-white/10 bg-slate-950/40 text-xs shrink-0 overflow-x-auto">
          {[
            { id: 'pengumuman', label: 'Pengumuman Misi', icon: Bell },
            { id: 'tips', label: 'Tips Refleksi', icon: Sparkles },
            { id: 'jadwal', label: 'Jadwal & Tata Tertib', icon: Calendar },
            { id: 'warga', label: 'Tentang Kota', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-t-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-emerald-400 text-emerald-300 bg-white/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: PENGUMUMAN */}
          {activeTab === 'pengumuman' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-teal-900/30 to-slate-900/40 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-300">Target Belajar Pekan Ini</p>
                  <p className="text-sm font-extrabold text-white mt-0.5">
                    Model IPO & Logika Pemecahan Masalah
                  </p>
                </div>
                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-500/30">
                  +30 XP per Refleksi
                </div>
              </div>

              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 hover:border-slate-600 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {ann.category}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{ann.date}</span>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1.5">{ann.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: TIPS REFLEKSI */}
          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-indigo-200 leading-relaxed">
                Refleksi bukan sekadar tugas, melainkan momen menyadari proses berpikir diri sendiri
                (<em>metakognisi</em>). Jawabanmu membantu guru dan AI Mentor memberikan umpan balik
                terbaik.
              </div>

              {reflectionTips.map((tip) => (
                <div
                  key={tip.step}
                  className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold flex items-center justify-center shrink-0 text-xs border border-emerald-500/30">
                    {tip.step}
                  </div>
                  <div>
                    <h5 className="font-bold text-xs sm:text-sm text-white">{tip.title}</h5>
                    <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: JADWAL & TATA TERTIB */}
          {activeTab === 'jadwal' && (
            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-amber-400" />
                  Jadwal Pembelajaran Kelas {myClassShort}
                </h4>
                <ul className="space-y-1.5 text-slate-300">
                  <li className="flex items-center justify-between py-1 border-b border-slate-700/50">
                    <span>Eksplorasi Modul di Perpustakaan</span>
                    <span className="font-bold text-white">07:30 - 09:00</span>
                  </li>
                  <li className="flex items-center justify-between py-1 border-b border-slate-700/50">
                    <span>Latihan Soal di Bengkel Latihan</span>
                    <span className="font-bold text-white">09:15 - 10:45</span>
                  </li>
                  <li className="flex items-center justify-between py-1">
                    <span>Pengisian Refleksi di Taman Refleksi</span>
                    <span className="font-bold text-emerald-400">11:00 - Selesai</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-bold text-sm text-white mb-2 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Tata Tertib Refleksia City
                </h4>
                <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                  <li>Gunakan bahasa yang santun pada obrolan warga.</li>
                  <li>Sampaikan refleksi secara mandiri dan jujur.</li>
                  <li>Dilarang melakukan spam atau ujaran yang tidak pantas.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: TENTANG KOTA */}
          {activeTab === 'warga' && (
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700">
                <h4 className="font-bold text-sm text-white mb-2">Refleksia City</h4>
                <p>
                  Refleksia City adalah lingkungan pembelajaran interaktif untuk siswa SMK Negeri 2
                  Gorontalo. Di kota ini, kamu menjelajahi materi Berpikir Komputasional, menguji
                  kemampuan, serta merefleksikan hasil belajarmu bersama AI Mentor Kota dan warga sekelas.
                </p>
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-700">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 text-center">
                    <p className="text-[11px] text-slate-400">Siswa Terdaftar</p>
                    <p className="text-base font-extrabold text-white">53 Murid</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 text-center">
                    <p className="text-[11px] text-slate-400">Kelas</p>
                    <p className="text-base font-extrabold text-emerald-400">X DKV 2 & 3</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-400">
            Terhubung sebagai <strong className="text-white">{student.name}</strong> ({myClassShort})
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition shadow"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
