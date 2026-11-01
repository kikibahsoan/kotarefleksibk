import React, { useState, useMemo } from 'react';
import { SMK_CLASSES } from '../data/initialData.ts';
import { Student } from '../types/index.ts';
import { StorageService } from '../utils/storage.ts';
import { School, User, Lock, Sparkles, BookOpen, MapPin, Compass, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface StudentWelcomeProps {
  onLoginStudent: (student: Student) => void;
  onOpenTeacherLogin: () => void;
  existingStudent: Student | null;
}

export const StudentWelcome: React.FC<StudentWelcomeProps> = ({
  onLoginStudent,
  onOpenTeacherLogin,
  existingStudent,
}) => {
  // If existing student is from deleted DKV 1, ignore it
  const validExistingStudent =
    existingStudent && !existingStudent.className.includes('DKV 1') ? existingStudent : null;

  const [className, setClassName] = useState<string>(
    validExistingStudent?.className || SMK_CLASSES[0]
  );
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    validExistingStudent?.id || ''
  );
  const [customName, setCustomName] = useState<string>(validExistingStudent?.name || '');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

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

  return (
    <div className="min-h-[100dvh] w-full bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 flex flex-col justify-center items-center py-2 sm:py-5 px-3 sm:px-6 text-slate-100 overflow-y-auto">
      <div className="w-full max-w-md sm:max-w-lg landscape:max-w-3xl lg:max-w-4xl bg-slate-800/95 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 landscape:p-5 lg:p-7 relative overflow-hidden my-auto shrink-0 transition-all">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Responsive Grid Container: 2 columns in landscape or desktop, 1 column in mobile portrait */}
        <div className="landscape:grid landscape:grid-cols-12 lg:grid lg:grid-cols-12 landscape:gap-6 lg:gap-8 items-center relative z-10">
          
          {/* Left Column: Branding, Title, Badge & (in landscape) Feature Pills + Teacher Entry */}
          <div className="landscape:col-span-5 lg:col-span-5 flex flex-col justify-between text-center landscape:text-left lg:text-left">
            <div>
              <div className="inline-flex items-center justify-center w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30 mb-2 sm:mb-2.5">
                <School className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-extrabold tracking-tight text-white mb-1 font-display">
                Refleksia City
              </h1>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10.5px] sm:text-xs font-bold mb-1.5 sm:mb-2">
                Informatika (KKA) • X DKV 2 & X DKV 3
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 max-w-sm mx-auto landscape:mx-0 lg:mx-0 leading-relaxed">
                Media interaktif belajar & refleksi materi <strong className="text-amber-400">Berpikir Komputasional</strong> bersama <strong className="text-emerald-300">AI Mentor Kota</strong>.
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

            {/* Teacher Entry Button (Shown on left column in Tablet Landscape / Desktop) */}
            <div className="hidden landscape:block lg:block mt-3 text-center landscape:text-left lg:text-left">
              <button
                type="button"
                onClick={onOpenTeacherLogin}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-700/50 transition border border-slate-700/50 hover:border-slate-500 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Masuk sebagai Guru</span>
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
                    {validExistingStudent.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-emerald-300 font-medium">Akun tersimpan</p>
                    <p className="text-xs sm:text-sm font-bold text-white truncate">
                      {validExistingStudent.name} ({validExistingStudent.className.split(' ')[0]} {validExistingStudent.className.split(' ')[1]})
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
                    StorageService.saveOrUpdateStudent(resumed);
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

        {/* Footer (Feature Pills & Teacher Button): Shown ONLY on Mobile Portrait */}
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

          <div className="mt-2.5 text-center">
            <button
              type="button"
              onClick={onOpenTeacherLogin}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-slate-700/50 transition border border-transparent hover:border-slate-600 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Masuk sebagai Guru</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
