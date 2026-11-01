import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Flag, Sparkles, Clock } from 'lucide-react';

interface KalenderNasionalModalProps {
  onClose: () => void;
  currentTimeWita: string;
}

export interface NationalDayItem {
  day: number;
  month: number; // 0-11 (Jan = 0, Dec = 11)
  title: string;
  isPublicHoliday: boolean; // Libur Nasional Resmi Pemerintah (SKB 3 Menteri)
  category: 'Libur Nasional' | 'Cuti Bersama' | 'Hari Besar Nasional';
}

export const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDONESIAN_DAYS_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

// Daftar Hari Libur Nasional Resmi Pemerintah RI (SKB 3 Menteri) & Hari Besar Nasional Penting
export const NATIONAL_DAYS_DATA: NationalDayItem[] = [
  // JANUARI
  { day: 1, month: 0, title: 'Tahun Baru Masehi', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 16, month: 0, title: 'Isra Mikraj Nabi Muhammad SAW', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 25, month: 0, title: 'Hari Gizi dan Makanan Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // FEBRUARI
  { day: 9, month: 1, title: 'Hari Pers Nasional (HPN)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 16, month: 1, title: 'Cuti Bersama Tahun Baru Imlek', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 17, month: 1, title: 'Tahun Baru Imlek Kongzili', isPublicHoliday: true, category: 'Libur Nasional' },

  // MARET
  { day: 9, month: 2, title: 'Hari Musik Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 18, month: 2, title: 'Cuti Bersama Hari Suci Nyepi', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 19, month: 2, title: 'Hari Suci Nyepi (Tahun Baru Saka)', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 20, month: 2, title: 'Hari Raya Idul Fitri 1447 H (Hari Pertama)', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 21, month: 2, title: 'Hari Raya Idul Fitri 1447 H (Hari Kedua)', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 23, month: 2, title: 'Cuti Bersama Idul Fitri 1447 H', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 24, month: 2, title: 'Cuti Bersama Idul Fitri 1447 H', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 30, month: 2, title: 'Hari Film Nasional (Insan Kreatif & DKV)', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // APRIL
  { day: 3, month: 3, title: 'Wafat Yesus Kristus (Jumat Agung)', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 5, month: 3, title: 'Kebangkitan Yesus Kristus (Hari Paskah)', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 21, month: 3, title: 'Hari Kartini', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 22, month: 3, title: 'Hari Bumi', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // MEI
  { day: 1, month: 4, title: 'Hari Buruh Internasional', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 2, month: 4, title: 'Hari Pendidikan Nasional (Hardiknas)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 14, month: 4, title: 'Kenaikan Yesus Kristus', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 15, month: 4, title: 'Cuti Bersama Kenaikan Yesus Kristus', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 20, month: 4, title: 'Hari Kebangkitan Nasional (Harkitnas)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 27, month: 4, title: 'Hari Raya Idul Adha 1447 H', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 28, month: 4, title: 'Cuti Bersama Hari Raya Idul Adha', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 31, month: 4, title: 'Hari Raya Waisak 2570 BE', isPublicHoliday: true, category: 'Libur Nasional' },

  // JUNI
  { day: 1, month: 5, title: 'Hari Lahir Pancasila', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 16, month: 5, title: 'Tahun Baru Islam 1 Muharram 1448 H', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 21, month: 5, title: 'Hari Krida Pertanian', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // JULI
  { day: 1, month: 6, title: 'Hari Bhayangkara', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 23, month: 6, title: 'Hari Anak Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // AGUSTUS
  { day: 10, month: 7, title: 'Hari Kebangkitan Teknologi Nasional (Hakteknas)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 14, month: 7, title: 'Hari Pramuka Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 17, month: 7, title: 'Hari Kemerdekaan Republik Indonesia (HUT RI)', isPublicHoliday: true, category: 'Libur Nasional' },
  { day: 25, month: 7, title: 'Maulid Nabi Muhammad SAW', isPublicHoliday: true, category: 'Libur Nasional' },

  // SEPTEMBER
  { day: 4, month: 8, title: 'Hari Pelanggan Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 8, month: 8, title: 'Hari Aksara Internasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 9, month: 8, title: 'Hari Olahraga Nasional (Haornas)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 17, month: 8, title: 'Hari Palang Merah Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // OKTOBER
  { day: 1, month: 9, title: 'Hari Kesaktian Pancasila', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 2, month: 9, title: 'Hari Batik Nasional (Warisan Budaya & Desain)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 5, month: 9, title: 'Hari Tentara Nasional Indonesia (TNI)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 22, month: 9, title: 'Hari Santri Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 28, month: 9, title: 'Hari Sumpah Pemuda', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // NOVEMBER
  { day: 10, month: 10, title: 'Hari Pahlawan Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 12, month: 10, title: 'Hari Kesehatan Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 25, month: 10, title: 'Hari Guru Nasional (HUT PGRI)', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 29, month: 10, title: 'HUT KORPRI', isPublicHoliday: false, category: 'Hari Besar Nasional' },

  // DESEMBER
  { day: 5, month: 11, title: 'Hari Ulang Tahun Provinsi Gorontalo', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 22, month: 11, title: 'Hari Ibu Nasional', isPublicHoliday: false, category: 'Hari Besar Nasional' },
  { day: 24, month: 11, title: 'Cuti Bersama Hari Raya Natal', isPublicHoliday: true, category: 'Cuti Bersama' },
  { day: 25, month: 11, title: 'Hari Raya Natal (Kelahiran Yesus Kristus)', isPublicHoliday: true, category: 'Libur Nasional' },
];

export const KalenderNasionalModal: React.FC<KalenderNasionalModalProps> = ({
  onClose,
  currentTimeWita,
}) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const todayDate = now.getDate();
  const todayMonth = now.getMonth();

  const [selectedMonth, setSelectedMonth] = useState<number>(todayMonth);
  const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

  // Days in selected month
  const daysInMonth = new Date(currentYear, selectedMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, selectedMonth, 1).getDay(); // 0 = Sunday

  const monthHolidays = NATIONAL_DAYS_DATA.filter((h) => h.month === selectedMonth);

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
    >
      <div className="w-full max-w-2xl bg-[#121e2c]/95 border border-slate-600/60 rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.75)] text-slate-100 overflow-hidden flex flex-col max-h-[90dvh]">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-emerald-950/60 border-b border-slate-700/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-black text-white truncate">
                  Kalender Bulanan & Hari Nasional RI
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> {currentTimeWita}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate">
                Sesuai Ketetapan Pemerintah RI (SKB 3 Menteri) & Kalender Pendidikan {currentYear}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer shrink-0"
            aria-label="Tutup Kalender"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Mode Switcher: Tampilan Per Bulan vs Daftar Tahunan Lengkap */}
        <div className="px-4 sm:px-5 pt-3 flex items-center justify-between gap-2 shrink-0">
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-700/70 text-xs font-bold w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📅 Kalender Per Bulan
            </button>
            <button
              type="button"
              onClick={() => setViewMode('annual')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🇮🇩 Daftar 12 Bulan Nasional
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedMonth(todayMonth);
              setViewMode('monthly');
            }}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600/60 text-[11px] font-bold text-emerald-300 transition cursor-pointer"
          >
            <Sparkles className="w-3 h-3" /> Hari Ini ({todayDate} {INDONESIAN_MONTHS[todayMonth]})
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {viewMode === 'monthly' ? (
            <>
              {/* 12-Month Quick Pills */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {INDONESIAN_MONTHS.map((mName, idx) => {
                  const isCurrent = idx === selectedMonth;
                  const isTodayM = idx === todayMonth;
                  const hasHoliday = NATIONAL_DAYS_DATA.some(
                    (h) => h.month === idx && h.isPublicHoliday
                  );
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => setSelectedMonth(idx)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-600/35 border-emerald-400 text-white shadow-md'
                          : isTodayM
                          ? 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                          : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">{mName.slice(0, 3)}</span>
                      {hasHoliday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Month Navigation Header */}
              <div className="flex items-center justify-between bg-slate-900/75 border border-slate-700/70 rounded-2xl px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                  aria-label="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {INDONESIAN_MONTHS[selectedMonth]} {currentYear}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    {monthHolidays.filter((h) => h.isPublicHoliday).length} Hari Libur Resmi •{' '}
                    {monthHolidays.filter((h) => !h.isPublicHoliday).length} Hari Besar Nasional
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition cursor-pointer"
                  aria-label="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="bg-slate-900/60 border border-slate-700/60 rounded-2xl p-3">
                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                  {INDONESIAN_DAYS_SHORT.map((dayName, idx) => (
                    <div
                      key={dayName}
                      className={`text-[10.5px] font-extrabold py-1 ${
                        idx === 0 ? 'text-red-400' : idx === 5 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-9 sm:h-11 rounded-xl bg-transparent" />
                  ))}

                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dateNum = idx + 1;
                    const dayOfWeek = (firstDayOfWeek + idx) % 7;
                    const isSunday = dayOfWeek === 0;
                    const isToday = dateNum === todayDate && selectedMonth === todayMonth;

                    const matchingDays = monthHolidays.filter((h) => h.day === dateNum);
                    const hasPublicHoliday = matchingDays.some((h) => h.isPublicHoliday);
                    const hasNationalDay = matchingDays.length > 0;

                    return (
                      <div
                        key={dateNum}
                        title={matchingDays.map((m) => `${m.title} (${m.category})`).join(' • ')}
                        className={`relative h-9 sm:h-11 rounded-xl flex flex-col items-center justify-center text-xs sm:text-sm font-bold border transition select-none ${
                          isToday
                            ? 'bg-emerald-600/40 border-emerald-400 text-white ring-2 ring-emerald-400/50 shadow-lg'
                            : hasPublicHoliday
                            ? 'bg-red-950/55 border-red-500/50 text-red-300'
                            : hasNationalDay
                            ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                            : isSunday
                            ? 'bg-slate-900/80 border-slate-800 text-red-400'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-200'
                        }`}
                      >
                        <span>{dateNum}</span>
                        {hasNationalDay && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                              hasPublicHoliday ? 'bg-red-400' : 'bg-amber-400'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" /> Hari Ini
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" /> Libur Nasional / Cuti Bersama
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 inline-block" /> Hari Besar Nasional
                  </span>
                </div>
              </div>

              {/* National Holidays & Commemorations List for Selected Month */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-red-400" />
                  Daftar Hari Nasional Bulan {INDONESIAN_MONTHS[selectedMonth]}
                </h4>

                {monthHolidays.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400 italic">
                    Tidak ada hari libur nasional pada bulan ini.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {monthHolidays.map((item, idx) => (
                      <div
                        key={`${item.month}-${item.day}-${idx}`}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${
                          item.isPublicHoliday
                            ? 'bg-red-950/30 border-red-500/40'
                            : 'bg-slate-900/65 border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-mono font-black text-xs shrink-0 border ${
                              item.isPublicHoliday
                                ? 'bg-red-500/20 border-red-400/50 text-red-300'
                                : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                            }`}
                          >
                            <span>{item.day}</span>
                            <span className="text-[8px] uppercase">
                              {INDONESIAN_MONTHS[item.month].slice(0, 3)}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-white truncate">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {item.day} {INDONESIAN_MONTHS[item.month]} {currentYear}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-extrabold shrink-0 border ${
                            item.category === 'Libur Nasional'
                              ? 'bg-red-500/20 text-red-300 border-red-400/40'
                              : item.category === 'Cuti Bersama'
                              ? 'bg-orange-500/20 text-orange-300 border-orange-400/40'
                              : 'bg-amber-500/15 text-amber-300 border-amber-400/30'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Annual 12-Month National Days List */
            <div className="space-y-3">
              {INDONESIAN_MONTHS.map((mName, mIdx) => {
                const items = NATIONAL_DAYS_DATA.filter((d) => d.month === mIdx);
                return (
                  <div
                    key={mName}
                    className="bg-slate-900/65 border border-slate-700/60 rounded-2xl p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <h4 className="text-xs sm:text-sm font-black text-emerald-300">
                        {mIdx + 1}. {mName} {currentYear}
                      </h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth(mIdx);
                          setViewMode('monthly');
                        }}
                        className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                      >
                        Lihat Kalender →
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-2 text-xs py-1 px-2 rounded-lg bg-slate-950/50"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                                item.isPublicHoliday
                                  ? 'bg-red-500/25 text-red-300'
                                  : 'bg-slate-800 text-amber-300'
                              }`}
                            >
                              {String(item.day).padStart(2, '0')} {mName.slice(0, 3)}
                            </span>
                            <span className="text-slate-100 font-medium truncate">
                              {item.title}
                            </span>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              item.isPublicHoliday
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
