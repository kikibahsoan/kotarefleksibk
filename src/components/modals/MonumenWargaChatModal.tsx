import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, FountainAttendanceRow } from '../../types/index.ts';
import { StorageService } from '../../utils/storage.ts';
import { sounds } from '../../utils/audio.ts';
import {
  X,
  Coins,
  Calendar,
  CheckCircle2,
  Users,
  Search,
  Download,
  RefreshCw,
  FileSpreadsheet,
  Clock,
  Sparkles,
  Copy,
  Check,
  UserCheck,
  UserX,
  ShieldCheck,
} from 'lucide-react';

interface PapanInformasiModalProps {
  onClose: () => void;
  student: Student;
  isTeacher?: boolean;
  onDeductXp?: (amount: number, reason?: string) => boolean;
}

const GAS_DAFTAR_HADIR_SNIPPET = `// ============================================================
// TAMBAHKAN PADA GOOGLE APPS SCRIPT (TANPA MENGUBAH SHEET LAMA)
// Sheet Baru: "Daftar_Hadir"
// Header Kolom: ID_Absen | Tanggal | Waktu | NIS_ID | Nama_Siswa | Kelas | Koin_XP | Status
// ============================================================

function ensureDaftarHadirSheet(ss) {
  var sheet = ss.getSheetByName('Daftar_Hadir');
  if (!sheet) {
    sheet = ss.insertSheet('Daftar_Hadir');
    sheet.appendRow(['ID_Absen', 'Tanggal', 'Waktu', 'NIS_ID', 'Nama_Siswa', 'Kelas', 'Koin_XP', 'Status']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#0f172a').setFontColor('#ffffff');
  }
  return sheet;
}

// Di dalam doPost(e):
if (data.action === 'save_absensi_air_mancur') {
  var sheet = ensureDaftarHadirSheet(SpreadsheetApp.getActiveSpreadsheet());
  var r = data.row || data.entry || {};
  var idAbsen = String(r.ID_Absen || r.id_absen || ('absen_' + r.Tanggal + '_' + r.NIS_ID));
  var values = sheet.getDataRange().getValues();
  var exists = false;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]) === idAbsen) {
      exists = true;
      break;
    }
  }
  if (!exists) {
    sheet.appendRow([
      idAbsen,
      r.Tanggal || r.tanggal || '',
      r.Waktu || r.waktu || '',
      r.NIS_ID || r.student_id || '',
      r.Nama_Siswa || r.nama_siswa || '',
      r.Kelas || r.kelas || '',
      r.Koin_XP !== undefined ? r.Koin_XP : 1,
      r.Status || r.status || 'HADIR'
    ]);
  }
  return ContentService.createTextOutput(JSON.stringify({ success: true, id_absen: idAbsen }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

export const MonumenWargaChatModal: React.FC<PapanInformasiModalProps> = ({
  onClose,
  student,
  isTeacher = false,
  onDeductXp,
}) => {
  const todayWita = useMemo(() => StorageService.getWitaDateString(), []);
  const [activeTab, setActiveTab] = useState<'absensi' | 'rekap_guru' | 'panduan_sheet'>('absensi');
  const [allRows, setAllRows] = useState<FountainAttendanceRow[]>(() =>
    StorageService.getFountainAttendance()
  );
  const [selectedDate, setSelectedDate] = useState<string>(todayWita);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<'ALL' | 'HADIR' | 'BELUM'>('ALL');

  // Coin toss animation & sync states
  const [isTossingCoin, setIsTossingCoin] = useState<boolean>(false);
  const [justAttendedToast, setJustAttendedToast] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  const settings = useMemo(() => StorageService.getSettings(), []);
  const gasUrl = (settings.spreadsheetUrl || settings.gasWebAppUrl || '').trim();

  const fetchAttendanceFromServer = useCallback(async () => {
    try {
      const q = gasUrl ? `?gasUrl=${encodeURIComponent(gasUrl)}` : '';
      const res = await fetch(`/api/fountain-attendance${q}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.rows)) {
          const local = StorageService.getFountainAttendance();
          const combined = [...local, ...data.rows];
          StorageService.saveFountainAttendanceList(combined);
          setAllRows(StorageService.getFountainAttendance());
        }
      }
    } catch {
      setAllRows(StorageService.getFountainAttendance());
    }
  }, [gasUrl]);

  useEffect(() => {
    fetchAttendanceFromServer();
    const interval = window.setInterval(fetchAttendanceFromServer, 3000);
    return () => window.clearInterval(interval);
  }, [fetchAttendanceFromServer]);

  // Check if current user has already attended today
  const myTodayAttendance = useMemo(() => {
    return allRows.find(
      (r) => r.tanggal === todayWita && String(r.student_id) === String(student.id)
    );
  }, [allRows, todayWita, student.id]);

  // Handle throwing 1 XP coin into Air Mancur Warga for daily attendance
  const handleThrowCoinAttendance = async () => {
    if (myTodayAttendance || isTossingCoin) return;

    setIsTossingCoin(true);
    try {
      sounds.playWaterSplash();
    } catch {}

    // Deduct 1 XP if student has >= 1 XP; still allow attendance if XP is 0
    const currentXp = Math.max(0, Number(student.points || 0));
    let deducted = false;
    if (currentXp >= 1) {
      if (onDeductXp) {
        deducted = onDeductXp(1, 'Absensi Koin Air Mancur Warga');
      } else {
        const updated: Student = { ...student, points: Math.max(0, currentXp - 1) };
        StorageService.saveOrUpdateStudent(updated);
        StorageService.setCurrentStudent(updated);
        deducted = true;
      }
    }

    const now = new Date();
    const tanggal = StorageService.getWitaDateString(now);
    const waktu = StorageService.getWitaTimeString(now);
    const newEntry: FountainAttendanceRow = {
      id_absen: `absen_${tanggal}_${student.id}`,
      tanggal,
      waktu,
      student_id: String(student.id),
      nama_siswa: student.name,
      kelas: student.className || 'X DKV',
      gender: student.gender === 'P' ? 'P' : 'L',
      koin_xp: deducted || currentXp >= 1 ? 1 : 0,
      status: 'HADIR',
      timestamp: Date.now(),
    };

    window.setTimeout(async () => {
      const updatedList = StorageService.recordFountainAttendance(newEntry);
      setAllRows(updatedList);
      setIsTossingCoin(false);
      setJustAttendedToast(
        deducted
          ? `Koin 1 XP berhasil dilempar ke Air Mancur! Kehadiranmu hari ini (${waktu} WITA) otomatis tercatat di Daftar Hadir.`
          : `Kehadiranmu hari ini (${waktu} WITA) berhasil tercatat di Daftar Hadir Air Mancur Warga!`
      );
      try {
        sounds.playRewardXp();
      } catch {}

      await StorageService.syncFountainAttendanceToGAS(newEntry);
      fetchAttendanceFromServer();
    }, 850);
  };

  // Available dates for teacher filter
  const availableDates = useMemo(() => {
    const set = new Set<string>([todayWita]);
    allRows.forEach((r) => {
      if (r.tanggal) set.add(r.tanggal);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allRows, todayWita]);

  // Available classes
  const availableClasses = useMemo(() => {
    const set = new Set<string>(['X DKV 2', 'X DKV 3']);
    allRows.forEach((r) => {
      if (r.kelas) set.add(r.kelas);
    });
    StorageService.getStudents().forEach((s) => {
      if (s.className && !s.className.toLowerCase().includes('guru')) {
        set.add(s.className);
      }
    });
    return Array.from(set);
  }, [allRows]);

  // Active date: Students always see todayWita; Teachers see selectedDate
  const activeDateForView = activeTab === 'rekap_guru' && isTeacher ? selectedDate : todayWita;

  const rowsForActiveDate = useMemo(() => {
    return allRows
      .filter((r) => r.tanggal === activeDateForView)
      .filter((r) => (classFilter === 'ALL' ? true : r.kelas === classFilter))
      .filter((r) =>
        searchQuery.trim()
          ? r.nama_siswa.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            r.kelas.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            r.student_id.toLowerCase().includes(searchQuery.trim().toLowerCase())
          : true
      )
      .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
  }, [allRows, activeDateForView, classFilter, searchQuery]);

  // Registered students list for Teacher Rekap (Hadir vs Belum Hadir)
  const teacherStudentRecapList = useMemo(() => {
    const allRegistered = StorageService.getStudents().filter(
      (s) => !s.className?.toLowerCase().includes('guru') && s.id !== 'teacher-1'
    );
    const attendedOnDateMap = new Map<string, FountainAttendanceRow>();
    allRows
      .filter((r) => r.tanggal === selectedDate)
      .forEach((r) => {
        attendedOnDateMap.set(String(r.student_id), r);
        attendedOnDateMap.set(r.nama_siswa.toLowerCase().trim(), r);
      });

    // Combine registered students + any dynamic student who attended on selectedDate
    const combinedStudents: Array<{
      id: string;
      name: string;
      className: string;
      attendance: FountainAttendanceRow | null;
    }> = [];
    const seenIds = new Set<string>();

    allRegistered.forEach((s) => {
      const att =
        attendedOnDateMap.get(String(s.id)) ||
        attendedOnDateMap.get(s.name.toLowerCase().trim()) ||
        null;
      seenIds.add(String(s.id));
      combinedStudents.push({
        id: String(s.id),
        name: s.name,
        className: s.className || 'X DKV',
        attendance: att,
      });
    });

    allRows
      .filter((r) => r.tanggal === selectedDate)
      .forEach((r) => {
        if (!seenIds.has(String(r.student_id))) {
          seenIds.add(String(r.student_id));
          combinedStudents.push({
            id: String(r.student_id),
            name: r.nama_siswa,
            className: r.kelas,
            attendance: r,
          });
        }
      });

    return combinedStudents
      .filter((item) => (classFilter === 'ALL' ? true : item.className === classFilter))
      .filter((item) => {
        if (teacherStatusFilter === 'HADIR') return Boolean(item.attendance);
        if (teacherStatusFilter === 'BELUM') return !item.attendance;
        return true;
      })
      .filter((item) =>
        searchQuery.trim()
          ? item.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            item.className.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            item.id.toLowerCase().includes(searchQuery.trim().toLowerCase())
          : true
      )
      .sort((a, b) => {
        if (a.attendance && !b.attendance) return -1;
        if (!a.attendance && b.attendance) return 1;
        if (a.attendance && b.attendance) {
          return (a.attendance.timestamp || 0) - (b.attendance.timestamp || 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [allRows, selectedDate, classFilter, teacherStatusFilter, searchQuery]);

  const handleExportCsv = (mode: 'date' | 'all') => {
    const targetRows =
      mode === 'date'
        ? allRows.filter(
            (r) =>
              r.tanggal === selectedDate &&
              (classFilter === 'ALL' ? true : r.kelas === classFilter)
          )
        : allRows;

    const headers = [
      'No',
      'ID_Absen',
      'Tanggal',
      'Waktu_WITA',
      'NIS_ID',
      'Nama_Siswa',
      'Kelas',
      'Koin_XP',
      'Status',
    ];
    const csvLines = [
      headers.join(','),
      ...targetRows.map((r, idx) =>
        [
          idx + 1,
          `"${(r.id_absen || '').replace(/"/g, '""')}"`,
          `"${r.tanggal}"`,
          `"${r.waktu}"`,
          `"${(r.student_id || '').replace(/"/g, '""')}"`,
          `"${(r.nama_siswa || '').replace(/"/g, '""')}"`,
          `"${(r.kelas || '').replace(/"/g, '""')}"`,
          r.koin_xp,
          `"${r.status}"`,
        ].join(',')
      ),
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download =
      mode === 'date'
        ? `Daftar_Hadir_Air_Mancur_${selectedDate}.csv`
        : `Daftar_Hadir_Air_Mancur_Semua_Tanggal.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSyncToSpreadsheet = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    const targetRows = allRows.filter((r) => r.tanggal === selectedDate);
    const ok = await StorageService.syncFountainAttendanceBatchToGAS(
      targetRows.length > 0 ? targetRows : allRows
    );
    await fetchAttendanceFromServer();
    setIsSyncing(false);
    setSyncMessage(
      ok
        ? `Berhasil menyinkronkan ${targetRows.length || allRows.length} data daftar hadir ke Google Spreadsheet (Sheet "Daftar_Hadir").`
        : `Data daftar hadir tersimpan di Server Kota Refleksia. Pastikan URL Web App Google Spreadsheet di Ruang Guru sudah diisi untuk sinkronisasi otomatis ke Sheet "Daftar_Hadir".`
    );
  };

  const formatReadableDate = (yyyyMmDd: string) => {
    try {
      const [y, m, d] = yyyyMmDd.split('-').map(Number);
      if (!y || !m || !d) return yyyyMmDd;
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date(y, m - 1, d));
    } catch {
      return yyyyMmDd;
    }
  };

  const todayTotalCount = useMemo(
    () => allRows.filter((r) => r.tanggal === todayWita).length,
    [allRows, todayWita]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-cyan-950/90 via-slate-900 to-amber-950/60 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-2xl border border-cyan-400/30 shadow-inner">
              ⛲
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Air Mancur Warga • Daftar Hadir Siswa
                </h3>
                <span className="text-[11px] text-cyan-300 font-semibold tabular-nums">
                  · {todayWita} WITA
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Lempar Koin 1 XP ke Air Mancur untuk Mencatat Daftar Hadir Harian di Google Spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup Air Mancur Warga"
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 px-5 py-2.5 border-b border-white/10 bg-slate-950/60 text-xs shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('absensi')}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === 'absensi'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Lempar Koin & Daftar Hadir Hari Ini ({todayTotalCount})</span>
            </button>

            {isTeacher && (
              <>
                <button
                  onClick={() => setActiveTab('rekap_guru')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'rekap_guru'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Rekap Tanggal & Ekspor (Guru)</span>
                </button>
                <button
                  onClick={() => setActiveTab('panduan_sheet')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'panduan_sheet'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Struktur Sheet Daftar_Hadir</span>
                </button>
              </>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 whitespace-nowrap tabular-nums">
            <span>Saldo Koin XP:</span>
            <strong className="text-amber-400 font-extrabold">{student.points} XP</strong>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* ================================================================= */}
          {/* TAB 1: ABSENSI LEMPAR KOIN 1 XP & DAFTAR HADIR HARI INI           */}
          {/* ================================================================= */}
          {activeTab === 'absensi' && (
            <>
              {/* Interactive Fountain Coin Toss Stage */}
              <div className="relative rounded-2xl bg-gradient-to-br from-cyan-950/70 via-slate-900 to-slate-950 border border-cyan-500/30 p-4 sm:p-5 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  {/* Left: Visual Fountain Pool & Animated Coin */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-950/70 border border-cyan-500/20 relative min-h-[168px]">
                    {/* Water Ripples */}
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-b from-cyan-500/30 via-sky-600/30 to-blue-900/50 border-2 border-cyan-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                      <div
                        className={`absolute inset-2 rounded-full border border-cyan-300/40 ${
                          isTossingCoin ? 'animate-ping' : ''
                        }`}
                      />
                      <div className="text-4xl select-none">⛲</div>

                      {/* Animated Flying Coin */}
                      {isTossingCoin && (
                        <div className="absolute -top-6 flex flex-col items-center animate-bounce">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-yellow-100 shadow-[0_0_20px_rgba(251,191,36,0.9)] flex items-center justify-center text-slate-950 font-black text-xs">
                            1 XP
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="mt-3 text-xs font-bold text-cyan-200 text-center">
                      Kolam Air Mancur Presensi Warga
                    </p>
                    <p className="text-[11px] text-slate-400 text-center tabular-nums">
                      {formatReadableDate(todayWita)}
                    </p>
                  </div>

                  {/* Right: Student Identity & 1 XP Coin Toss Action */}
                  <div className="md:col-span-7 flex flex-col justify-between space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-cyan-300 font-semibold">
                          Identitas Warga Kota Refleksia
                        </p>
                        <h4 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                          {student.name}
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Kelas: <strong className="text-white">{student.className}</strong> · Saldo
                          Saat Ini:{' '}
                          <strong className="text-amber-400 tabular-nums">
                            {student.points} XP
                          </strong>
                        </p>
                      </div>
                    </div>

                    {myTodayAttendance ? (
                      <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-3">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                        <div className="text-xs">
                          <p className="font-extrabold text-emerald-300 text-sm">
                            Kamu Sudah Tercatat Hadir Hari Ini!
                          </p>
                          <p className="text-slate-300 mt-0.5 tabular-nums">
                            Waktu lempar koin: <strong className="text-white">{myTodayAttendance.waktu} WITA</strong> ·
                            Tanggal: <strong className="text-white">{myTodayAttendance.tanggal}</strong> ·
                            Tersimpan di Daftar Hadir Spreadsheet.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          Untuk mengisi daftar hadir hari ini, lempar koin{' '}
                          <strong className="text-amber-300">1 XP</strong> ke dalam Air Mancur Warga.
                          Namamu akan langsung tercatat otomatis di daftar hadir hari ini pada Google
                          Spreadsheet.
                        </p>
                        <button
                          onClick={handleThrowCoinAttendance}
                          disabled={isTossingCoin}
                          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-extrabold text-sm shadow-[0_8px_24px_rgba(245,158,11,0.35)] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                          <Coins className="w-5 h-5" />
                          <span>
                            {isTossingCoin
                              ? 'Melempar Koin 1 XP ke Air Mancur...'
                              : 'Lempar Koin 1 XP — Absen Hari Ini'}
                          </span>
                        </button>
                      </div>
                    )}

                    {justAttendedToast && (
                      <div className="p-3 rounded-xl bg-cyan-950/70 border border-cyan-400/40 text-xs text-cyan-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                        <span>{justAttendedToast}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Today's Attendance List */}
              <div className="rounded-2xl bg-slate-950/60 border border-white/10 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <span>Daftar Hadir Siswa Hari Ini ({formatReadableDate(todayWita)})</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                      Total siswa sudah lempar koin hadir hari ini:{' '}
                      <strong className="text-cyan-300">{rowsForActiveDate.length} siswa</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Cari nama siswa..."
                        className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                      />
                    </div>

                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="ALL">Semua Kelas</option>
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={fetchAttendanceFromServer}
                      title="Muat ulang daftar hadir"
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {rowsForActiveDate.length === 0 ? (
                  <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                    Belum ada siswa yang melempar koin daftar hadir pada filter ini hari ini.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900/90 text-slate-300 border-b border-slate-800">
                          <th className="py-2.5 px-3 font-bold w-12">No</th>
                          <th className="py-2.5 px-3 font-bold">Waktu (WITA)</th>
                          <th className="py-2.5 px-3 font-bold">Nama Siswa</th>
                          <th className="py-2.5 px-3 font-bold">Kelas</th>
                          <th className="py-2.5 px-3 font-bold text-center">Koin</th>
                          <th className="py-2.5 px-3 font-bold text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/70">
                        {rowsForActiveDate.map((row, idx) => {
                          const isMe = String(row.student_id) === String(student.id);
                          return (
                            <tr
                              key={row.id_absen || `${row.tanggal}_${row.student_id}_${idx}`}
                              className={
                                isMe
                                  ? 'bg-cyan-950/40 text-white font-semibold'
                                  : 'hover:bg-slate-900/50 text-slate-200'
                              }
                            >
                              <td className="py-2.5 px-3 tabular-nums text-slate-400">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 tabular-nums text-cyan-300 font-medium">
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {row.waktu}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-white">
                                {row.nama_siswa}
                                {isMe && (
                                  <span className="ml-2 text-[10px] text-cyan-300 font-bold">
                                    (Kamu)
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-300">{row.kelas}</td>
                              <td className="py-2.5 px-3 text-center tabular-nums text-amber-300 font-bold">
                                {row.koin_xp} XP
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                                ✓ {row.status}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ================================================================= */}
          {/* TAB 2: REKAP GURU, FILTER TANGGAL & EKSPOR SPREADSHEET            */}
          {/* ================================================================= */}
          {activeTab === 'rekap_guru' && isTeacher && (
            <div className="space-y-4">
              {/* Filter Bar & Export Controls */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      <span>Panel Rekap Daftar Hadir Harian (Khusus Guru)</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Pilih tanggal dan kelas untuk memantau siswa yang sudah hadir maupun belum hadir
                      serta mengekspor ke Google Spreadsheet.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleExportCsv('date')}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh CSV ({selectedDate})</span>
                    </button>

                    <button
                      onClick={() => handleExportCsv('all')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh Semua Tanggal</span>
                    </button>

                    <button
                      onClick={handleSyncToSpreadsheet}
                      disabled={isSyncing}
                      className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer disabled:opacity-50"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>
                        {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan ke Sheet Daftar_Hadir'}
                      </span>
                    </button>
                  </div>
                </div>

                {syncMessage && (
                  <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs text-cyan-200">
                    {syncMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Pilih Tanggal Presensi
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value || todayWita)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white tabular-nums focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Riwayat Tanggal Tercatat
                    </label>
                    <select
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white tabular-nums focus:outline-none focus:border-amber-400"
                    >
                      {availableDates.map((d) => (
                        <option key={d} value={d}>
                          {d} {d === todayWita ? '(Hari Ini)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Filter Kelas</label>
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">Semua Kelas</option>
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      Status Kehadiran
                    </label>
                    <select
                      value={teacherStatusFilter}
                      onChange={(e) => setTeacherStatusFilter(e.target.value as any)}
                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="ALL">Semua Siswa (Hadir & Belum)</option>
                      <option value="HADIR">Sudah Hadir</option>
                      <option value="BELUM">Belum Hadir</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Metrics for Selected Date */}
              {(() => {
                const totalHadir = teacherStudentRecapList.filter((i) => i.attendance).length;
                const totalBelum = teacherStudentRecapList.filter((i) => !i.attendance).length;
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-white/10">
                      <p className="text-[11px] text-slate-400">Tanggal Dipilih</p>
                      <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 tabular-nums">
                        {selectedDate}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
                      <p className="text-[11px] text-emerald-300 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Sudah Hadir
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-emerald-300 mt-0.5 tabular-nums">
                        {totalHadir} Siswa
                      </p>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/30">
                      <p className="text-[11px] text-rose-300 flex items-center gap-1">
                        <UserX className="w-3.5 h-3.5" /> Belum Hadir
                      </p>
                      <p className="text-sm sm:text-base font-extrabold text-rose-300 mt-0.5 tabular-nums">
                        {totalBelum} Siswa
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Full Student Attendance Table for Teacher */}
              <div className="rounded-2xl bg-slate-950/60 border border-white/10 overflow-hidden">
                <div className="overflow-x-auto max-h-[340px]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-900 text-slate-300 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-2.5 px-3 font-bold w-12">No</th>
                        <th className="py-2.5 px-3 font-bold">Nama Siswa</th>
                        <th className="py-2.5 px-3 font-bold">Kelas</th>
                        <th className="py-2.5 px-3 font-bold">Waktu Hadir (WITA)</th>
                        <th className="py-2.5 px-3 font-bold text-center">Koin XP</th>
                        <th className="py-2.5 px-3 font-bold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70">
                      {teacherStudentRecapList.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-3 tabular-nums text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-semibold text-white">{item.name}</td>
                          <td className="py-2.5 px-3 text-slate-300">{item.className}</td>
                          <td className="py-2.5 px-3 tabular-nums text-cyan-300">
                            {item.attendance ? item.attendance.waktu : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-center tabular-nums text-amber-300 font-bold">
                            {item.attendance ? `${item.attendance.koin_xp} XP` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold">
                            {item.attendance ? (
                              <span className="text-emerald-400">✓ HADIR</span>
                            ) : (
                              <span className="text-slate-500">BELUM HADIR</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 3: STRUKTUR SHEET BARU "Daftar_Hadir" (GOOGLE SPREADSHEET)    */}
          {/* ================================================================= */}
          {activeTab === 'panduan_sheet' && isTeacher && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-emerald-500/30 space-y-2">
                <h4 className="font-extrabold text-sm text-white">
                  Sheet Baru Google Spreadsheet: <code className="text-emerald-300">Daftar_Hadir</code>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  Setiap kali siswa melempar koin 1 XP di Air Mancur Warga, aplikasi otomatis
                  mengirimkan aksi <code className="text-cyan-300">save_absensi_air_mancur</code> ke
                  URL Google Apps Script yang terhubung di Ruang Guru. Sheet lama tidak diubah sama
                  sekali; cukup tambahkan handler berikut pada Apps Script untuk membuat sheet{' '}
                  <code className="text-emerald-300">Daftar_Hadir</code> secara otomatis.
                </p>
                <div className="pt-2">
                  <p className="font-bold text-slate-200 mb-1">Urutan Kolom Sheet Daftar_Hadir:</p>
                  <p className="font-mono text-emerald-300 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    ID_Absen | Tanggal | Waktu | NIS_ID | Nama_Siswa | Kelas | Koin_XP | Status
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-slate-200">
                    Potongan Kode Google Apps Script (Sheet Daftar_Hadir)
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(GAS_DAFTAR_HADIR_SNIPPET);
                      setCopiedScript(true);
                      window.setTimeout(() => setCopiedScript(false), 2000);
                    }}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedScript ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode Apps Script</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-4 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {GAS_DAFTAR_HADIR_SNIPPET}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-white/10 flex items-center justify-between shrink-0 text-xs">
          <div className="text-slate-400">
            Warga aktif: <strong className="text-white">{student.name}</strong> ({student.className})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
