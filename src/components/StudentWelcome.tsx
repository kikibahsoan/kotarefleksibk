import React, { useState, useMemo } from 'react';
import { SMK_CLASSES } from '../data/initialData.ts';
import { Student } from '../types/index.ts';
import { StorageService } from '../utils/storage.ts';
import { ThreeTownCanvas } from './ThreeTownCanvas.tsx';
import { TimePeriod } from '../utils/lofiAudio.ts';
import { WeatherType } from '../utils/weather.ts';
import { School, User, Lock, Sparkles, BookOpen, MapPin, Compass, KeyRound, Eye, EyeOff, ShieldCheck, Camera, Newspaper, X } from 'lucide-react';

interface StudentWelcomeProps {
  onLoginStudent: (student: Student) => void;
  onOpenTeacherLogin: () => void;
  existingStudent: Student | null;
  timePeriod?: TimePeriod;
  weatherType?: WeatherType;
}

export const StudentWelcome: React.FC<StudentWelcomeProps> = ({
  onLoginStudent,
  onOpenTeacherLogin,
  existingStudent,
  timePeriod = 'siang',
  weatherType = 'normal',
}) => {
  // If existing student is from deleted DKV 1, ignore it
  const validExistingStudent =
    existingStudent && !existingStudent.className.includes('DKV 1') ? existingStudent : null;

  const [className, setClassName] = useState<string>(
    validExistingStudent && !validExistingStudent.isGuest && !validExistingStudent.isTeacher
      ? validExistingStudent.className
      : SMK_CLASSES[0]
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    validExistingStudent && !validExistingStudent.isGuest && !validExistingStudent.isTeacher
      ? validExistingStudent.id
      : ''
  );
  const [customName, setCustomName] = useState<string>(validExistingStudent?.name || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Guest Login ("Tamu Kota") Modal State
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [showGuestPassword, setShowGuestPassword] = useState(false);
  const [guestError, setGuestError] = useState('');

  // Fetch all authorized students
  const allStudents = useMemo(() => StorageService.getStudents(), []);

  // Filter roster for selected class
  const classRoster = useMemo(() => {
    return allStudents
      .filter((s) => s.className === className)
      .sort((a, b) => (a.studentNumber || '99').localeCompare(b.studentNumber || '99'));
  }, [allStudents, className]);

  // Handle class change
  const handleClassChange = (newClass: string) => {
    setClassName(newClass);
    setSelectedStudentId('');
    setCustomName('');
    setPassword('');
    setError('');
  };

  // Handle selecting a student from dropdown
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudentId(studentId);
    setError('');
    const found = classRoster.find((s) => s.id === studentId);
    if (found) {
      setCustomName(found.name);
    } else {
      setCustomName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!className) {
      setError('Silakan pilih kelas terlebih dahulu.');
      return;
    }

    // Identify target student
    let target = classRoster.find((s) => s.id === selectedStudentId);
    if (!target && customName.trim()) {
      target = classRoster.find(
        (s) => s.name.trim().toLowerCase() === customName.trim().toLowerCase()
      );
    }

    if (!target) {
      setError('Silakan pilih nama murid dari daftar resmi kelas ' + (className.includes('DKV 2') ? 'X DKV 2' : 'X DKV 3') + '.');
      return;
    }

    if (!password.trim()) {
      setError('Silakan masukkan password akun murid.');
      return;
    }

    // Validate password
    if (target.password && target.password.trim() !== password.trim()) {
      setError('Password salah! Silakan periksa kembali NISN/Password yang terdaftar.');
      return;
    }

    // Update login timestamp & grant 5 XP (koin) on student login
    const loggedStudent: Student = {
      ...target,
      lastLogin: new Date().toISOString().slice(0, 10),
      streakDays: target.streakDays || 1,
      points: 5,
      badges: target.badges && target.badges.length > 0 ? target.badges : ['reflektor_pertama'],
    };

    StorageService.recordStudentActivity(target.id, 'login', 1);
    StorageService.saveOrUpdateStudent(loggedStudent);
    StorageService.setCurrentStudent(loggedStudent);
    onLoginStudent(loggedStudent);
  };

  // Handle Guest Login (Nama tamu bebas sesuai nama user, Password: Ter1m4k4s1h)
  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGuestError('');

    const cleanName = guestName.trim();
    if (!cleanName) {
      setGuestError('Silakan masukkan nama Anda terlebih dahulu.');
      return;
    }

    if (guestPassword.trim() !== 'Ter1m4k4s1h') {
      setGuestError('Password Tamu salah! Silakan periksa kembali password tamu Anda.');
      return;
    }

    const safeSlug = cleanName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'tamu';

    const guestStudent: Student = {
      id: `guest-${safeSlug}`,
      name: cleanName,
      className: 'Tamu Kota (Wartawan)',
      studentNumber: 'WARTAWAN-01',
      password: 'Ter1m4k4s1h',
      gender: 'L',
      points: 5,
      badges: ['reflektor_pertama'],
      lastLogin: new Date().toISOString().slice(0, 10),
      streakDays: 1,
      isTeacher: false,
      isGuest: true,
    };

    StorageService.setCurrentStudent(guestStudent);
    setIsGuestModalOpen(false);
    onLoginStudent(guestStudent);
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col justify-center items-center py-2 sm:py-5 px-3 sm:px-6 text-slate-100 overflow-y-auto">
      {/* Background: Live Refleksia City Canvas disesuaikan dengan blur 50% */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div
          className="w-full h-full"
          style={{
            filter: 'blur(6px)',
            transform: 'scale(1.04)',
          }}
        >
          <ThreeTownCanvas
            onSelectBuilding={() => {}}
            activeBuilding={null}
            newMateriBuildingIds={[]}
            studentId="preview-bg"
            studentName="Warga Refleksia"
            studentGender="L"
            isTeacher={false}
            isGuest={true}
            timePeriod={timePeriod}
            weatherType={weatherType}
          />
        </div>
        <div className="absolute inset-0 bg-slate-950/35" />
      </div>

      <div className="w-full max-w-md sm:max-w-lg landscape:max-w-3xl lg:max-w-4xl bg-slate-800/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 landscape:p-5 lg:p-7 relative z-10 overflow-hidden my-auto shrink-0 transition-all">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Responsive Grid Container: 2 columns in landscape or desktop, 1 column in mobile portrait */}
        <div className="landscape:grid landscape:grid-cols-12 lg:grid lg:grid-cols-12 landscape:gap-6 lg:gap-8 items-center relative z-10">
          
          {/* Left Column: Branding, Title, Badge & (in landscape) Feature Pills + Teacher & Guest Entry */}
          <div className="landscape:col-span-5 lg:col-span-5 flex flex-col justify-between text-center landscape:text-left lg:text-left">
            <div>
              <div className="inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 mb-2 sm:mb-2.5">
                <School className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold tracking-tight text-white mb-1 font-display">
                Refleksia City
              </h1>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10.5px] sm:text-xs font-bold mb-1.5 sm:mb-2">
                Kota Meta Pelajar
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 max-w-sm mx-auto landscape:mx-0 lg:mx-0 leading-relaxed">
                Peta kolaboratif berbasis media Interaktif untuk belajar, berinteraksi, dan refleksi
              </p>
            </div>

            {/* Feature Pills (Shown on left column in Tablet Landscape / Desktop) */}
            <div className="hidden landscape:grid lg:grid grid-cols-3 gap-1.5 mt-4 pt-3 border-t border-slate-700/60 text-center">
              <div className="p-1.5 rounded-xl bg-slate-900/50 border border-slate-700/40">
                <p className="text-base">🏛️</p>
                <p className="text-[10px] font-semibold text-slate-300 mt-0.5">Kota 3D Mini</p>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/50 border border-slate-700/40">
                <p className="text-base">🤖</p>
                <p className="text-[10px] font-semibold text-slate-300 mt-0.5">AI Mentor</p>
              </div>
              <div className="p-1.5 rounded-xl bg-slate-900/50 border border-slate-700/40">
                <p className="text-base">🏆</p>
                <p className="text-[10px] font-semibold text-slate-300 mt-0.5">Poin & Lencana</p>
              </div>
            </div>

            {/* Teacher & Guest Entry Buttons Side-by-Side (Shown on left column in Tablet Landscape / Desktop) */}
            <div className="hidden landscape:flex lg:flex flex-wrap items-center justify-center landscape:justify-start lg:justify-start gap-2 mt-3">
              <button
                type="button"
                onClick={onOpenTeacherLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/50 hover:bg-slate-700/60 transition border border-slate-700/60 hover:border-amber-400/60 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Masuk sebagai Guru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGuestName('');
                  setGuestPassword('');
                  setGuestError('');
                  setIsGuestModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 hover:text-white px-3 py-1.5 rounded-xl bg-sky-950/50 hover:bg-sky-900/60 transition border border-sky-500/40 hover:border-sky-400 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-sky-400" />
                <span>Login Tamu</span>
              </button>
            </div>
          </div>

          {/* Right Column: Existing User Banner + Login Form */}
          <div className="landscape:col-span-7 lg:col-span-7 mt-3 landscape:mt-0 lg:mt-0">
            {/* Existing User Quick Resume Banner */}
            {validExistingStudent && (
              <div className="mb-2.5 sm:mb-3 p-2.5 rounded-xl sm:rounded-2xl bg-emerald-950/70 border border-emerald-500/30 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                    {validExistingStudent.isGuest ? '📸' : validExistingStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-emerald-300 font-medium">Akun tersimpan</p>
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                      {validExistingStudent.name} ({validExistingStudent.isGuest ? 'Wartawan Tamu' : `${validExistingStudent.className.split(' ')[0]} ${validExistingStudent.className.split(' ')[1] || ''}`.trim()})
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const resumed: Student = {
                      ...validExistingStudent,
                      points: validExistingStudent.isTeacher ? 10 : 5,
                    };
                    if (!resumed.isGuest) {
                      StorageService.saveOrUpdateStudent(resumed);
                    }
                    StorageService.setCurrentStudent(resumed);
                    onLoginStudent(resumed);
                  }}
                  className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow transition shrink-0 cursor-pointer"
                >
                  Lanjutkan →
                </button>
              </div>
            )}

            {/* Student Form */}
            <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 relative">
              {/* Class Selector: X DKV 2 & X DKV 3 only */}
              <div>
                <label htmlFor="student-class-select" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                  Pilih Kelas <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {SMK_CLASSES.map((c) => {
                    const isSelected = className === c;
                    const shortLabel = c.includes('DKV 2') ? 'X DKV 2' : 'X DKV 3';
                    const subLabel = c.includes('DKV 2') ? '26 Siswa' : '27 Siswa';
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleClassChange(c)}
                        className={`py-1.5 sm:py-2 px-2.5 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600/30 border-emerald-500 text-emerald-200 font-extrabold shadow-md'
                            : 'bg-slate-900/70 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs sm:text-sm font-bold">{shortLabel}</div>
                        <div className="text-[9.5px] sm:text-[10px] opacity-75">{subLabel}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Student Name Selector from Class Roster */}
              <div>
                <label htmlFor="student-name-select" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-teal-400" />
                    Pilih Nama Murid ({className.includes('DKV 2') ? 'X DKV 2' : 'X DKV 3'}) <span className="text-red-400">*</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {classRoster.length} Murid
                  </span>
                </label>
                <select
                  id="student-name-select"
                  required
                  value={selectedStudentId}
                  onChange={(e) => handleSelectStudent(e.target.value)}
                  className="w-full px-3 py-1.5 sm:py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm cursor-pointer"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- Pilih Nama Lengkap dari Daftar Siswa --
                  </option>
                  {classRoster.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      Absen {s.studentNumber || '-'} : {s.name} {s.gender ? `(${s.gender})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="student-password-input" className="block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    Password Akun Murid <span className="text-red-400">*</span>
                  </span>
                </label>
                <div className="relative">
                  <input
                    id="student-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Masukkan password akun..."
                    className="w-full pl-3 pr-10 py-1.5 sm:py-2 bg-slate-900/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs sm:text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-400 font-semibold bg-red-950/60 p-2 rounded-lg border border-red-800">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className="w-full mt-1.5 py-2 sm:py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30 transition transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Compass className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Masuk Refleksia City</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer (Feature Pills & Teacher + Guest Buttons): Shown ONLY on Mobile Portrait */}
        <div className="landscape:hidden lg:hidden mt-3 pt-3 border-t border-slate-700/60">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="p-1.5 rounded-xl bg-slate-900/50">
              <p className="text-sm">🏛️</p>
              <p className="text-[10px] font-semibold text-slate-300 mt-0.5">Kota 3D Mini</p>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/50">
              <p className="text-sm">🤖</p>
              <p className="text-[10px] font-semibold text-slate-300 mt-0.5">AI Mentor</p>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-900/50">
              <p className="text-sm">🏆</p>
              <p className="text-[10px] font-semibold text-slate-300 mt-0.5">Poin & Lencana</p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={onOpenTeacherLogin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-700/60 transition border border-slate-700/60 hover:border-amber-400/60 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Masuk sebagai Guru</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setGuestName('');
                setGuestPassword('');
                setGuestError('');
                setIsGuestModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-200 hover:text-white px-3 py-1.5 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 transition border border-sky-500/40 hover:border-sky-400 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-sky-400" />
              <span>Login Tamu</span>
            </button>
          </div>
        </div>
      </div>

      {/* GUEST LOGIN MODAL (Nama Tamu Bebas / Pass: Ter1m4k4s1h) */}
      {isGuestModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsGuestModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-slate-900 border border-sky-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 relative overflow-hidden text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-20 -right-20 w-44 h-44 bg-sky-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-sky-500/30">
                  📸
                </div>
                <div>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-400/40 text-sky-300 text-[10px] font-extrabold uppercase tracking-wider">
                    <Newspaper className="w-3 h-3" />
                    <span>Akses Kunjungan Wartawan</span>
                  </div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                    Login Tamu Kota
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                aria-label="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700/70 text-xs text-slate-300 space-y-1 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Avatar Khusus:</span>
                <span className="font-bold text-amber-300">📸 Wartawan / Jurnalis Kota</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Hak Akses:</span>
                <span className="font-bold text-sky-300">👁️ Hanya Melihat-lihat (View Only)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Modal XP Awal:</span>
                <span className="font-bold text-emerald-300 font-mono">🪙 +5 XP</span>
              </div>
            </div>

            <form onSubmit={handleGuestSubmit} className="space-y-3 relative z-10">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Nama Tamu / Nama Anda
                </label>
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    setGuestError('');
                  }}
                  placeholder="Ketik nama Anda..."
                  className="w-full px-3 py-2 bg-slate-950/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1">
                  Password Tamu
                </label>
                <div className="relative">
                  <input
                    type={showGuestPassword ? 'text' : 'password'}
                    required
                    value={guestPassword}
                    onChange={(e) => {
                      setGuestPassword(e.target.value);
                      setGuestError('');
                    }}
                    placeholder="Masukkan password tamu..."
                    className="w-full pl-3 pr-10 py-2 bg-slate-950/90 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500 text-xs sm:text-sm font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowGuestPassword(!showGuestPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
                  >
                    {showGuestPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {guestError && (
                <p className="text-xs text-red-400 font-semibold bg-red-950/60 p-2 rounded-lg border border-red-800">
                  {guestError}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white shadow-lg shadow-sky-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>Masuk sebagai Tamu Kota (5 XP)</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
